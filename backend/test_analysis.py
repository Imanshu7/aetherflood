"""Offline tests for the operational analysis pipeline.

No external network calls: validators, same-orbit pairing, D8 tracing on a
synthetic grid, OSM road summarization, and job API validation states.
"""
import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import asyncio
import re
import numpy as np
import httpx
from backend.main import app
from backend.services import analysis as A
from backend.services import dem_trace as DEM
from backend.services import ohsome_extract as OE


def test_bbox_validation():
    try:
        A.validate_bbox([0, 0, 0, 0])
        raise AssertionError("degenerate bbox accepted")
    except ValueError:
        pass
    try:
        A.validate_bbox([-10, -10, 10, 10])
        raise AssertionError("oversize AOI accepted")
    except ValueError:
        pass
    bbox, geo = A.validate_bbox([85.12, 27.91, 85.34, 28.16])
    assert geo["area_km2"] > 100, geo
    print("[PASS] bbox validation")


def test_input_rules():
    base = {"bbox": [85.12, 27.91, 85.34, 28.16], "event_date": "2026-08-26"}
    A.validate_analysis_inputs(base)
    bad = dict(base, pre_orbit_track=1)  # unknown key ignored, still valid
    A.validate_analysis_inputs(bad)
    for patch, _msg in [
        ({"event_date": "2030-01-01"}, "future event"),
        ({"event_date": "2010-01-01"}, "pre-S1 event"),
        ({"osm_snapshot_time": "2026-08-01T00:00:00Z"}, "post-cutoff snapshot"),
        ({"pre_window": ["2026-08-20", "2026-08-10"]}, "inverted window"),
        ({"bbox": None, "polygon": None}, "missing AOI"),
    ]:
        req = dict(base)
        req.update(patch)
        try:
            A.validate_analysis_inputs(req)
            raise AssertionError(f"accepted invalid input: {_msg}")
        except ValueError:
            pass
    print("[PASS] input rules (dates, snapshot cutoff, windows, AOI)")


def test_same_orbit_pairing():
    pre = [
        {"scene_id": "pre121", "mode": "IW", "relative_orbit": 121,
         "orbit_direction": "DESCENDING", "polarisation": "VV&VH",
         "acquisition_start": "2026-08-14T00:00:00Z"},
        {"scene_id": "pre85", "mode": "IW", "relative_orbit": 85,
         "orbit_direction": "ASCENDING", "polarisation": "VV&VH",
         "acquisition_start": "2026-08-14T00:00:00Z"},
    ]
    post = [
        {"scene_id": "post121", "mode": "IW", "relative_orbit": 121,
         "orbit_direction": "DESCENDING", "polarisation": "VV&VH",
         "acquisition_start": "2026-08-26T00:00:00Z"},
        {"scene_id": "post85desc", "mode": "IW", "relative_orbit": 85,
         "orbit_direction": "DESCENDING", "polarisation": "VV&VH",
         "acquisition_start": "2026-08-26T00:00:00Z"},
    ]
    pairs = A.group_s1_pairs(pre, post)
    assert len(pairs) == 1, pairs
    assert pairs[0]["relative_orbit"] == 121
    print("[PASS] same-orbit pairing rejects mixed geometries")


def test_d8_synthetic():
    grid = np.array([[10.0, 9.0, 8.0],
                     [11.0, 7.0, 6.0],
                     [12.0, 8.0, 5.0]])
    out = DEM.trace_downstream(grid, [0.0, 0.0, 0.002, 0.002], 0.0015, 0.0005)
    assert out["points"] >= 2, out
    assert out["drop_m"] > 0, out
    assert out["length_km"] > 0, out
    flat = np.full((4, 4), 100.0)
    still = DEM.trace_downstream(flat, [0.0, 0.0, 0.004, 0.004], 0.002, 0.002)
    assert still["points"] == 1 and still["drop_m"] == 0, still
    print("[PASS] D8 tracing descends synthetic slope, stops on flats")


def test_road_summary():
    feats = [
        {"geometry_type": "LineString",
         "coordinates": [[85.0, 28.0], [85.01, 28.0]],
         "tags": {"highway": "primary"}},
        {"geometry_type": "Point", "coordinates": [85.0, 28.0], "tags": {}},
    ]
    summary = OE.summarize_roads(feats)
    assert summary["segments"] == 1, summary
    assert 0.9 < summary["total_km"] < 1.1, summary
    print("[PASS] road length summarization")


async def test_job_api():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.post("/api/analysis/jobs", json={"event_date": "2030-01-01"})
        assert r.status_code == 400, r.text
        r = await client.post("/api/analysis/jobs", json={
            "bbox": [85.12, 27.91, 85.34, 28.16], "event_date": "not-a-date"})
        assert r.status_code == 400, r.text
        r = await client.get("/api/analysis/jobs/nope-0000")
        assert r.status_code == 404, r.text
        print("[PASS] job API validation states (400/404, no fabricated jobs)")


def test_copilot_job_grounding():
    from backend.services.copilot_engine import copilot_engine
    job = {
        "job_id": "job-0007",
        "status": "partial",
        "created_at": "2026-10-13T00:00:00+00:00",
        "inputs": {"event_date": "2026-08-26T00:00:00+00:00", "area_km2": 12.5},
        "results": {
            "sentinel1": {"pre_candidates": 8, "post_candidates": 6,
                          "valid_pairs": [{"relative_orbit": 121}]},
            "sentinel2": {"pre_usable": 1, "post_usable": 0},
            "infrastructure": {
                "snapshot": "2026-07-27T00:00:00Z",
                "counts": {"buildings": {"count": 586}},
                "roads": {"total_km": 15.68},
            },
            "dem_trace": {"length_km": 2.21},
        },
    }
    resp = copilot_engine.answer_query(
        query="How many buildings were damaged?", lang="en", analysis_job=job)
    assert resp.status == "ok", resp
    assert "586" in resp.summary, resp.summary
    assert "8" in resp.summary and "6" in resp.summary, resp.summary
    assert "damage" not in resp.summary.lower().replace("no damage", "").replace("damage extent", "") \
        or "cannot be quantified" in resp.summary or "No flood" in resp.summary, resp.summary
    # Without a job the copilot answers from stored incident records. It must
    # still refuse to present pre-event exposure as a damage count.
    resp2 = copilot_engine.answer_query(query="How many buildings were damaged?", lang="en")
    assert resp2.status == "ok", resp2
    assert "586" not in resp2.summary, resp2.summary
    lowered = resp2.summary.lower()
    assert not re.search(r"\b\d[\d,]*\s+buildings?\s+(were\s+)?damaged", lowered), resp2.summary
    # A damage question with no damage record must surface that it is unavailable.
    assert "unavailable" in lowered or "not available" in lowered or "no verified" in lowered or "data gap" in lowered, resp2.summary
    print("[PASS] copilot grounds replies in job results and never invents damage counts")


if __name__ == "__main__":
    test_bbox_validation()
    test_input_rules()
    test_same_orbit_pairing()
    test_d8_synthetic()
    test_road_summary()
    test_copilot_job_grounding()
    asyncio.run(test_job_api())
    print("================ ALL 7 ANALYSIS TESTS PASSED! ================")
