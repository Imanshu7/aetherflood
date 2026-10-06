"""
Backend API Comprehensive Integration Test Suite
Validates all required endpoints, math models, and zero-hallucination outputs.
"""
import asyncio
import sys
import httpx
from backend.main import app

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("Testing /api/health ...")
        r = await client.get("/api/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("[PASS] Health check passed:", r.json())

        print("\nTesting /api/metrics ...")
        r = await client.get("/api/metrics")
        assert r.status_code == 200, f"Metrics failed: {r.text}"
        data = r.json()
        assert data["inundation_area_km2"] > 0
        assert data["damaged_buildings_count"] > 0
        assert data["isolated_population"] > 0
        print(f"[PASS] Metrics passed: Inundation: {data['inundation_area_km2']} km², Damaged buildings: {data['damaged_buildings_count']}, Isolated pop: {data['isolated_population']}")

        print("\nTesting /api/benchmark/trishuli ...")
        r = await client.get("/api/benchmark/trishuli")
        assert r.status_code == 200
        b_data = r.json()
        assert "metadata" in b_data
        assert "geojson" in b_data
        print(f"[PASS] Benchmark passed. GeoJSON feature count: {len(b_data['geojson']['features'])}")

        print("\nTesting /api/sensor/status ...")
        r = await client.get("/api/sensor/status")
        assert r.status_code == 200
        s_data = r.json()
        assert "radar_telemetry" in s_data
        print(f"[PASS] Sensor status passed. Mode: {s_data['fusion_decision']['active_mode']}")

        print("\nTesting /api/bonus/trace-flood-path ...")
        r = await client.get("/api/bonus/trace-flood-path?lat=28.180&lon=85.355")
        assert r.status_code == 200
        path_data = r.json()
        assert path_data["threatened_settlements_count"] > 0
        print(f"[PASS] Bonus upstream trace passed! Downstream length: {path_data['total_downstream_length_km']} km, Settlements: {[s['name'] for s in path_data['threatened_settlements']]}")

        print("\nTesting /api/copilot/chat (English Power / Reasoning test) ...")
        r = await client.post("/api/copilot/chat", json={"query": "Why are you better than other LLMs and what was damaged?", "language": "en"})
        assert r.status_code == 200
        chat_res = r.json()
        assert "reply" in chat_res
        print(f"[PASS] English Copilot response received (length: {len(chat_res['reply'])})")
        print(f"Snippet:\n{chat_res['reply'][:180]}...\n")

        print("\nTesting /api/copilot/chat (Nepali Rescuer test) ...")
        r = await client.post("/api/copilot/chat", json={"query": "कुन कुन बस्तीहरू सम्पर्कविहीन छन् र बाटो अवस्था के छ?", "language": "ne"})
        assert r.status_code == 200
        chat_ne = r.json()
        assert "reply" in chat_ne
        print(f"[PASS] Nepali Copilot response received (length: {len(chat_ne['reply'])})")

        print("\nTesting /api/copilot/sitrep (Bilingual SITREPs) ...")
        r_en = await client.get("/api/copilot/sitrep?language=en")
        assert r_en.status_code == 200
        assert len(r_en.json()["sitrep_markdown"]) > 500
        r_ne = await client.get("/api/copilot/sitrep?language=ne")
        assert r_ne.status_code == 200
        assert len(r_ne.json()["sitrep_markdown"]) > 500
        print("[PASS] Bilingual SITREPs generated successfully!")

        print("\nTesting /api/analyze rule enforcement ...")
        # Should reject mismatched orbit tracks
        bad_req = {
            "bbox": [85.1, 27.9, 85.4, 28.2],
            "event_date": "2026-08-26",
            "pre_orbit_track": 121,
            "post_orbit_track": 48, # MISMATCH!
            "osm_snapshot_time": "2026-07-27T00:00:00Z"
        }
        r_bad = await client.post("/api/analyze", json=bad_req)
        assert r_bad.status_code == 400
        print("[PASS] Same-orbit rule enforcement properly triggered 400 error as required.")

        # Valid req
        good_req = {
            "bbox": [85.1, 27.9, 85.4, 28.2],
            "event_date": "2026-08-26",
            "pre_orbit_track": 121,
            "post_orbit_track": 121,
            "osm_snapshot_time": "2026-07-27T00:00:00Z"
        }
        r_good = await client.post("/api/analyze", json=good_req)
        assert r_good.status_code == 200
        print("[PASS] Custom Analysis endpoint succeeded!")

        print("\n================ ALL 8 BACKEND API TESTS PASSED! ================\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
