"""
Operational analysis input validation and pure geospatial helpers.

Track B rules enforced here:
- AOI must be a valid bbox or polygon (arbitrary user-selected areas allowed).
- Allowed operational inputs: Sentinel-1, Sentinel-2, Copernicus DEM (WorldDEM-30), pre-event OSM.
- Pre-event OSM snapshot must be <= PRE_EVENT_OSM_SNAPSHOT (2026-07-27).
- Sentinel-1 same-orbit rule: identical relative orbit + direction required.
- No Copernicus EMS / UNOSAT / published-damage / post-event-OSM inputs anywhere in this operational path.
"""

import datetime
import math
from typing import Any, Dict, List, Optional, Tuple

from backend.config import PRE_EVENT_OSM_SNAPSHOT

MAX_AOI_DEG2 = 1.0
MIN_LON, MAX_LON = -180.0, 180.0
MIN_LAT, MAX_LAT = -90.0, 90.0
EARTH_RADIUS_KM = 6371.0


def _parse_dt(value: str) -> datetime.datetime:
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def bbox_area_km2(bbox: List[float]) -> float:
    min_lon, min_lat, max_lon, max_lat = bbox
    mid_lat = math.radians((min_lat + max_lat) / 2)
    width = (max_lon - min_lon) * 111.32 * math.cos(mid_lat)
    height = (max_lat - min_lat) * 110.57
    return abs(width * height)


def validate_bbox(bbox: Any) -> Tuple[List[float], Dict[str, Any]]:
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        raise ValueError("bbox must be [min_lon, min_lat, max_lon, max_lat].")
    try:
        vals = [float(v) for v in bbox]
    except (TypeError, ValueError):
        raise ValueError("bbox coordinates must be numeric.")
    min_lon, min_lat, max_lon, max_lat = vals
    if not (MIN_LON <= min_lon < max_lon <= MAX_LON):
        raise ValueError("bbox longitudes must satisfy -180 <= min_lon < max_lon <= 180.")
    if not (MIN_LAT <= min_lat < max_lat <= MAX_LAT):
        raise ValueError("bbox latitudes must satisfy -90 <= min_lat < max_lat <= 90.")
    deg2 = (max_lon - min_lon) * (max_lat - min_lat)
    if deg2 > MAX_AOI_DEG2:
        raise ValueError(
            f"AOI too large ({deg2:.3f} deg²). Maximum supported area is {MAX_AOI_DEG2} deg²."
        )
    return vals, {"area_km2": round(bbox_area_km2(vals), 2), "area_deg2": round(deg2, 4)}


def validate_polygon(polygon: Any) -> Tuple[List[float], Dict[str, Any]]:
    """Accept a GeoJSON-style [[[lon,lat],...]] exterior ring; derive bbox."""
    if not isinstance(polygon, (list, tuple)) or not polygon:
        raise ValueError("polygon must be a non-empty list of linear rings.")
    ring = polygon[0] if isinstance(polygon[0][0], (list, tuple)) else polygon
    if len(ring) < 4:
        raise ValueError("polygon ring must have at least 4 positions.")
    pts = []
    for pos in ring:
        if not isinstance(pos, (list, tuple)) or len(pos) < 2:
            raise ValueError("polygon positions must be [lon, lat] pairs.")
        lon, lat = float(pos[0]), float(pos[1])
        if not (MIN_LON <= lon <= MAX_LON and MIN_LAT <= lat <= MAX_LAT):
            raise ValueError("polygon coordinates out of range.")
        pts.append((lon, lat))
    if pts[0] != pts[-1]:
        raise ValueError("polygon ring must be closed (first == last position).")
    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    return validate_bbox([min(lons), min(lats), max(lons), max(lats)])


def bbox_to_wkt(bbox: List[float]) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    return (
        f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},"
        f"{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
    )


def validate_analysis_inputs(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate a full analysis-job request. Returns normalized inputs."""
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    bbox = payload.get("bbox")
    polygon = payload.get("polygon")
    if bbox is not None and polygon is not None:
        raise ValueError("Provide either bbox or polygon, not both.")
    if bbox is not None:
        norm_bbox, geo = validate_bbox(bbox)
    elif polygon is not None:
        norm_bbox, geo = validate_polygon(polygon)
    else:
        raise ValueError("Provide an area of interest as bbox or polygon.")

    try:
        event_dt = _parse_dt(payload.get("event_date", ""))
    except Exception:
        raise ValueError("event_date must be an ISO-8601 date/datetime.")
    earliest = datetime.datetime(2014, 4, 3, tzinfo=datetime.timezone.utc)
    now = datetime.datetime.now(datetime.timezone.utc)
    if event_dt < earliest:
        raise ValueError("event_date predates the Sentinel-1 era (2014-04-03).")
    if event_dt > now + datetime.timedelta(days=1):
        raise ValueError("event_date is in the future.")

    def _window(name: str, default_days: int, direction: int) -> Tuple[str, str]:
        raw = payload.get(name)
        if raw is None:
            end = event_dt if direction < 0 else event_dt
            start = end + datetime.timedelta(days=default_days * direction)
            if direction < 0:
                return start.isoformat(), end.isoformat()
            return end.isoformat(), (end + datetime.timedelta(days=default_days)).isoformat()
        if not isinstance(raw, (list, tuple)) or len(raw) != 2:
            raise ValueError(f"{name} must be [start_iso, end_iso].")
        try:
            start, end = _parse_dt(raw[0]), _parse_dt(raw[1])
        except Exception:
            raise ValueError(f"{name} contains an invalid ISO-8601 datetime.")
        if start >= end:
            raise ValueError(f"{name} start must precede end.")
        if (end - start).days > 366:
            raise ValueError(f"{name} span exceeds 366 days.")
        return start.isoformat(), end.isoformat()

    pre_start, pre_end = _window("pre_window", -120, -1)
    post_start, post_end = _window("post_window", 60, 1)
    if _parse_dt(pre_end) > event_dt:
        raise ValueError("pre_window must end on or before event_date.")
    if _parse_dt(post_start) < event_dt:
        raise ValueError("post_window must start on or after event_date.")

    snapshot = payload.get("osm_snapshot_time") or PRE_EVENT_OSM_SNAPSHOT
    snapshot = str(snapshot)
    try:
        snap_dt = _parse_dt(snapshot)
    except Exception:
        raise ValueError("osm_snapshot_time must be an ISO-8601 datetime.")
    cutoff = _parse_dt(PRE_EVENT_OSM_SNAPSHOT)
    if snap_dt > cutoff:
        raise ValueError(
            f"osm_snapshot_time ({snapshot}) is after the pre-event cutoff "
            f"({PRE_EVENT_OSM_SNAPSHOT}). Post-event OSM edits are prohibited."
        )
    if snap_dt > event_dt:
        raise ValueError("osm_snapshot_time must precede event_date.")
    # ohsome requires the trailing-Z form, not +00:00.
    snapshot_z = snap_dt.isoformat().replace("+00:00", "Z")

    trace_start = payload.get("trace_start")
    if trace_start is not None:
        if not isinstance(trace_start, (list, tuple)) or len(trace_start) != 2:
            raise ValueError("trace_start must be [lat, lon].")
        lat, lon = float(trace_start[0]), float(trace_start[1])
        if not (MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON):
            raise ValueError("trace_start coordinates out of range.")
        trace_start = [lat, lon]

    settlements = payload.get("settlements") or []
    if not isinstance(settlements, list):
        raise ValueError("settlements must be a list of {name, lat, lon}.")
    norm_settlements = []
    for item in settlements[:50]:
        if not isinstance(item, dict):
            raise ValueError("each settlement must be an object.")
        lat, lon = float(item["lat"]), float(item["lon"])
        if not (MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON):
            raise ValueError("settlement coordinates out of range.")
        norm_settlements.append({"name": str(item.get("name", "settlement")), "lat": lat, "lon": lon})

    return {
        "bbox": norm_bbox,
        "bbox_wkt": bbox_to_wkt(norm_bbox),
        "area_km2": geo["area_km2"],
        "area_deg2": geo["area_deg2"],
        "event_date": event_dt.isoformat(),
        "pre_window": [pre_start, pre_end],
        "post_window": [post_start, post_end],
        "osm_snapshot_time": snapshot_z,
        "trace_start": trace_start,
        "settlements": norm_settlements,
    }


def group_s1_pairs(
    pre_scenes: List[Dict[str, Any]], post_scenes: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Pair pre/post Sentinel-1 scenes sharing identical viewing geometry:
    same relative orbit, same orbit direction, same polarisation, same mode.
    Different geometries are never compared pixel-by-pixel.
    """
    def key(scene: Dict[str, Any]) -> Optional[tuple]:
        if scene.get("mode") != "IW":
            return None
        rel = scene.get("relative_orbit")
        if rel is None:
            return None
        return (rel, scene.get("orbit_direction"), scene.get("polarisation"), scene.get("mode"))

    post_by_key: Dict[tuple, List[Dict[str, Any]]] = {}
    for scene in post_scenes:
        k = key(scene)
        if k is None:
            continue
        post_by_key.setdefault(k, []).append(scene)

    pairs = []
    for scene in pre_scenes:
        k = key(scene)
        if k is None:
            continue
        for post in post_by_key.get(k, []):
            pairs.append({
                "relative_orbit": k[0],
                "orbit_direction": k[1],
                "polarisation": k[2],
                "mode": k[3],
                "pre_scene_id": scene.get("scene_id"),
                "pre_acquisition": scene.get("acquisition_start"),
                "post_scene_id": post.get("scene_id"),
                "post_acquisition": post.get("acquisition_start"),
            })
    pairs.sort(key=lambda p: (p["relative_orbit"], p["pre_acquisition"] or ""))
    return pairs
