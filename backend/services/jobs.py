"""
Background analysis jobs.

Long-running provider calls (CDSE catalogue search, ohsome extraction, DEM
tile download) run in worker threads so ordinary page requests are never
blocked. Jobs record per-step status, provenance, and honest unavailable
states — missing results are never replaced with invented values.
"""

import datetime
import threading
from typing import Any, Dict, List, Optional, Tuple

import networkx as nx

from backend.services import cdse_search, dem_trace, ohsome_extract
from backend.services.analysis import group_s1_pairs, haversine_km

_lock = threading.Lock()
_jobs: Dict[str, Dict[str, Any]] = {}
_counter = 0
MAX_JOBS = 50

FLOOD_UNAVAILABLE_REASON = (
    "No flood-classification raster was derived: Sentinel scene download "
    "requires personal CDSE credentials, which are not configured, and no "
    "co-registered scene arrays were supplied. Scene candidates below prove "
    "data availability; they are not flood measurements."
)


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def create_job(inputs: Dict[str, Any]) -> Dict[str, Any]:
    global _counter
    with _lock:
        _counter += 1
        job_id = f"job-{_counter:04d}"
        job = {
            "job_id": job_id,
            "status": "queued",
            "created_at": _now(),
            "updated_at": _now(),
            "inputs": inputs,
            "steps": [],
            "results": {},
        }
        _jobs[job_id] = job
        while len(_jobs) > MAX_JOBS:
            oldest = min(_jobs, key=lambda k: _jobs[k]["created_at"])
            if oldest == job_id:
                break
            del _jobs[oldest]
    worker = threading.Thread(target=_run_job, args=(job_id,), daemon=True)
    worker.start()
    return {"job_id": job_id, "status": "queued"}


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None


def list_jobs() -> List[Dict[str, Any]]:
    with _lock:
        return [
            {
                "job_id": job["job_id"],
                "status": job["status"],
                "created_at": job["created_at"],
                "updated_at": job["updated_at"],
                "bbox": job["inputs"].get("bbox"),
                "event_date": job["inputs"].get("event_date"),
            }
            for job in sorted(_jobs.values(), key=lambda j: j["created_at"], reverse=True)
        ]


def _step(job: Dict[str, Any], name: str) -> Dict[str, Any]:
    step = {"name": name, "status": "running", "started_at": _now(),
            "finished_at": None, "detail": None}
    job["steps"].append(step)
    job["updated_at"] = _now()
    return step


def _finish_step(step: Dict[str, Any], status: str, detail: Any = None):
    step["status"] = status
    step["finished_at"] = _now()
    step["detail"] = detail


def _run_job(job_id: str):
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return
        job["status"] = "running"
    inputs = job["inputs"]
    bbox = inputs["bbox"]
    pre_start, pre_end = inputs["pre_window"]
    post_start, post_end = inputs["post_window"]
    snapshot = inputs["osm_snapshot_time"]

    # --- Sentinel-1 catalogue search ---
    step = _step(job, "sentinel1_search")
    try:
        pre = cdse_search.search_sentinel1(bbox, pre_start, pre_end)
        post = cdse_search.search_sentinel1(bbox, post_start, post_end)
        pairs = group_s1_pairs(pre, post)
        job["results"]["sentinel1"] = {
            "pre_candidates": len(pre),
            "post_candidates": len(post),
            "pre_scenes": pre[:50],
            "post_scenes": post[:50],
            "valid_pairs": pairs,
            "method": ("Public CDSE OData catalogue search (GRD, AOI intersection). "
                       "Pairs share relative orbit, direction, polarisation, and IW mode."),
            "source": "Copernicus Data Space Ecosystem catalogue (public search, no credentials)",
        }
        _finish_step(step, "succeeded",
                     f"{len(pre)} pre / {len(post)} post candidates, {len(pairs)} same-orbit pairs.")
    except Exception as exc:
        job["results"]["sentinel1"] = {"status": "unavailable", "reason": str(exc)[:300]}
        _finish_step(step, "failed", str(exc)[:300])

    # --- Sentinel-2 catalogue search ---
    step = _step(job, "sentinel2_search")
    try:
        pre2 = cdse_search.search_sentinel2(bbox, pre_start, pre_end)
        post2 = cdse_search.search_sentinel2(bbox, post_start, post_end)
        job["results"]["sentinel2"] = {
            "pre_usable": len(pre2["usable"]),
            "pre_obscured": len(pre2["obscured"]),
            "post_usable": len(post2["usable"]),
            "post_obscured": len(post2["obscured"]),
            "pre_scenes": (pre2["usable"] + pre2["obscured"])[:30],
            "post_scenes": (post2["usable"] + post2["obscured"])[:30],
            "method": ("Public CDSE OData catalogue search (Sentinel-2 L2A). Usable means "
                       "cloud cover <= 20%."),
            "source": "Copernicus Data Space Ecosystem catalogue (public search, no credentials)",
        }
        _finish_step(step, "succeeded",
                     f"{len(pre2['usable'])}+{len(post2['usable'])} usable scenes pre/post.")
    except Exception as exc:
        job["results"]["sentinel2"] = {"status": "unavailable", "reason": str(exc)[:300]}
        _finish_step(step, "failed", str(exc)[:300])

    # --- Flood layer: honestly unavailable ---
    job["results"]["flood_layer"] = {"status": "unavailable", "reason": FLOOD_UNAVAILABLE_REASON}

    # --- Pre-event OSM infrastructure ---
    step = _step(job, "infrastructure")
    road_geoms: List[Dict[str, Any]] = []
    try:
        counts = ohsome_extract.fetch_counts(bbox, snapshot)
        geoms = ohsome_extract.fetch_geometries(bbox, snapshot)
        road_geoms = geoms.get("roads", [])
        roads_summary = ohsome_extract.summarize_roads(road_geoms)
        job["results"]["infrastructure"] = {
            "snapshot": snapshot,
            "counts": counts,
            "roads": roads_summary,
            "bridges": [
                {"osm_id": b.get("osm_id"), "point": _feature_point(b),
                 "tags": b.get("tags", {})}
                for b in geoms.get("bridges", [])[:200]
            ],
            "hospitals": [
                {"osm_id": h.get("osm_id"), "point": _feature_point(h),
                 "tags": h.get("tags", {})}
                for h in geoms.get("hospitals", [])[:200]
            ],
            "method": ("Real pre-event OpenStreetMap extract via ohsome API "
                       "(full-history geometries valid at snapshot). Counts and "
                       "lengths are measured from the extract; they describe "
                       "potentially exposed infrastructure in the AOI, NOT confirmed damage."),
            "source": "© OpenStreetMap contributors (ohsome API, snapshot {})".format(snapshot),
        }
        _finish_step(step, "succeeded",
                     f"{counts['buildings']['count']} buildings, {roads_summary['total_km']} km roads.")
    except Exception as exc:
        job["results"]["infrastructure"] = {"status": "unavailable", "reason": str(exc)[:300]}
        _finish_step(step, "failed", str(exc)[:300])

    # --- Baseline connectivity on the real road graph ---
    step = _step(job, "connectivity")
    try:
        infra = job["results"].get("infrastructure", {})
        if infra.get("status") == "unavailable" or not road_geoms:
            raise ValueError("Road geometries unavailable; connectivity cannot be computed.")
        graph = _build_road_graph(road_geoms)
        hospitals = infra.get("hospitals", [])
        routes = []
        for settlement in inputs.get("settlements", []):
            routes.append(_route_to_hospital(graph, hospitals, settlement))
        job["results"]["connectivity"] = {
            "graph_nodes": graph.number_of_nodes(),
            "graph_edges": graph.number_of_edges(),
            "routes": routes,
            "disruption_modeling": {
                "status": "blocked",
                "reason": ("No flood mask is available, so no road segment can be "
                           "ruled impassable. Routes below are BASELINE shortest paths "
                           "with all segments assumed passable — estimated network "
                           "accessibility, not verified road closures."),
            },
            "method": ("Endpoint-snapped graph from real pre-event OSM ways; edge "
                       "weights are haversine lengths; Dijkstra shortest paths. "
                       "Crossings without shared nodes are not linked."),
        }
        _finish_step(step, "succeeded",
                     f"graph {graph.number_of_nodes()} nodes, {len(routes)} routes.")
    except Exception as exc:
        job["results"]["connectivity"] = {"status": "unavailable", "reason": str(exc)[:300]}
        _finish_step(step, "failed", str(exc)[:300])

    # --- DEM downstream trace ---
    if inputs.get("trace_start"):
        step = _step(job, "dem_trace")
        try:
            lat, lon = inputs["trace_start"]
            grid_info = dem_trace.build_grid(bbox)
            traced = dem_trace.trace_downstream(
                grid_info["grid"], grid_info["bounds"], lat, lon)
            job["results"]["dem_trace"] = {
                **traced,
                "tiles": grid_info["tiles"],
                "method": ("D8 steepest-descent on public Terrarium elevation tiles "
                           "(z12). Terrain-derived potential flow path — not a "
                           "hydraulic simulation and not a measured flood extent."),
                "source": "AWS Terrain Tiles (public, no key; SRTM/ETOPO-class sources)",
            }
            _finish_step(step, "succeeded", f"{traced['length_km']} km, drop {traced['drop_m']} m.")
        except Exception as exc:
            job["results"]["dem_trace"] = {"status": "unavailable", "reason": str(exc)[:300]}
            _finish_step(step, "failed", str(exc)[:300])

    failed_steps = [s for s in job["steps"] if s["status"] == "failed"]
    with _lock:
        job["status"] = "partial" if failed_steps else "succeeded"
        job["updated_at"] = _now()


def _feature_point(feature: Dict[str, Any]) -> Optional[List[float]]:
    """Best-effort [lat, lon] for a feature (Point, bbox-center fallback)."""
    coords = feature.get("coordinates")
    gtype = feature.get("geometry_type")
    try:
        if gtype == "Point" and coords:
            return [float(coords[1]), float(coords[0])]
        flat: List[Tuple[float, float]] = []

        def collect(c: Any):
            if isinstance(c, (list, tuple)) and len(c) == 2 and all(
                    isinstance(v, (int, float)) for v in c):
                flat.append((float(c[0]), float(c[1])))
            elif isinstance(c, (list, tuple)):
                for part in c:
                    collect(part)

        collect(coords)
        if not flat:
            return None
        lons = [p[0] for p in flat]
        lats = [p[1] for p in flat]
        return [(min(lats) + max(lats)) / 2, (min(lons) + max(lons)) / 2]
    except (TypeError, ValueError, IndexError):
        return None


def _node_key(lat: float, lon: float) -> Tuple[float, float]:
    return (round(lat, 6), round(lon, 6))


def _build_road_graph(road_features: List[Dict[str, Any]]) -> nx.Graph:
    graph = nx.Graph()
    for feature in road_features:
        if feature.get("geometry_type") != "LineString":
            continue
        coords = feature.get("coordinates") or []
        pts = [(_node_key(float(p[1]), float(p[0]))) for p in coords
               if isinstance(p, (list, tuple)) and len(p) >= 2]
        for (la1, lo1), (la2, lo2) in zip(pts, pts[1:]):
            w = haversine_km(la1, lo1, la2, lo2)
            if w <= 0:
                continue
            graph.add_edge((la1, lo1), (la2, lo2), weight=w,
                           highway=str((feature.get("tags") or {}).get("highway", "?")))
    return graph


def _nearest_node(graph: nx.Graph, lat: float, lon: float) -> Optional[Tuple[float, float]]:
    best = None
    best_d = float("inf")
    for (nlat, nlon) in graph.nodes:
        d = haversine_km(lat, lon, nlat, nlon)
        if d < best_d:
            best_d = d
            best = (nlat, nlon)
    return best


def _route_to_hospital(graph: nx.Graph, hospitals: List[Dict[str, Any]],
                       settlement: Dict[str, Any]) -> Dict[str, Any]:
    start = _nearest_node(graph, settlement["lat"], settlement["lon"])
    if start is None:
        return {"settlement": settlement["name"], "status": "unavailable",
                "reason": "Empty road graph."}
    best_route = None
    for hospital in hospitals:
        point = hospital.get("point")
        if not point:
            continue
        target = _nearest_node(graph, point[0], point[1])
        if target is None or target == start:
            continue
        try:
            length = nx.dijkstra_path_length(graph, start, target, weight="weight")
        except nx.NetworkXNoPath:
            continue
        name = (hospital.get("tags") or {}).get("name", str(hospital.get("osm_id")))
        if best_route is None or length < best_route["distance_km"]:
            best_route = {"hospital": name, "distance_km": round(length, 2)}
    if best_route is None:
        return {"settlement": settlement["name"], "status": "unavailable",
                "reason": "No hospital reachable on the baseline graph."}
    return {"settlement": settlement["name"], "status": "baseline_connected", **best_route}
