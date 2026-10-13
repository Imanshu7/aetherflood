"""
Permitted pre-event OpenStreetMap extraction via the public ohsome API.

Only snapshots at or before the pre-event cutoff are ever requested, so
post-event OSM edits can never leak into operational results. Every number
returned carries its snapshot timestamp, filter, and method.
"""

from typing import Any, Dict, List, Optional
import requests

from backend.services.analysis import haversine_km

OHSOME_URL = "https://api.ohsome.org/v1"
TIMEOUT = (10, 90)

FILTERS = {
    "buildings": "building=* and building!=no",
    "roads": "highway=*",
    "bridges": "bridge=* and bridge!=no",
    "hospitals": "amenity=hospital",
}


def _post(endpoint: str, payload: Dict[str, str]) -> Dict[str, Any]:
    response = requests.post(f"{OHSOME_URL}/{endpoint}", data=payload, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("ohsome API returned an unexpected response.")
    return data


def _bbox_param(bbox: List[float]) -> str:
    return ",".join(str(v) for v in bbox)


def fetch_counts(bbox: List[float], snapshot: str) -> Dict[str, Any]:
    """Count OSM objects per category at the snapshot. Real measured counts."""
    result: Dict[str, Any] = {}
    for key, osm_filter in FILTERS.items():
        data = _post("elements/count", {
            "bboxes": _bbox_param(bbox),
            "time": snapshot,
            "filter": osm_filter,
        })
        rows = data.get("result") or []
        value = rows[0].get("value") if rows else None
        result[key] = {
            "count": int(value) if value is not None else None,
            "filter": osm_filter,
            "snapshot": snapshot,
        }
    return result


def _snapshot_dt(snapshot: str):
    import datetime
    text = str(snapshot).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)


def fetch_geometries(
    bbox: List[float], snapshot: str, categories: Optional[List[str]] = None
) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch feature geometries valid at the snapshot.

    Uses the full-history geometry extraction with an interval ending exactly
    at the snapshot, then keeps only object versions valid at the snapshot
    time — so post-event edits can never leak into operational results.
    (The plain `/elements/geometry` snapshot endpoint rejects extraction
    requests upstream, hence the interval form.)
    """
    import datetime
    categories = categories or ["roads", "bridges", "hospitals"]
    snap_dt = _snapshot_dt(snapshot)
    interval_start = (snap_dt - datetime.timedelta(days=90)).isoformat().replace("+00:00", "Z")
    out: Dict[str, List[Dict[str, Any]]] = {}
    for key in categories:
        data = _post("elementsFullHistory/geometry", {
            "bboxes": _bbox_param(bbox),
            "time": f"{interval_start},{snapshot}",
            "filter": FILTERS[key],
            "properties": "tags",
        })
        seen = set()
        features = []
        for feature in data.get("features") or []:
            props = feature.get("properties") or {}
            osm_id = props.get("@osmId")
            try:
                valid_from = _snapshot_dt(props.get("@validFrom")) if props.get("@validFrom") else None
                valid_to = _snapshot_dt(props.get("@validTo")) if props.get("@validTo") else None
            except Exception:
                continue
            if valid_from is not None and valid_from > snap_dt:
                continue
            if valid_to is not None and valid_to < snap_dt:
                continue
            if osm_id in seen:
                continue
            seen.add(osm_id)
            geometry = feature.get("geometry") or {}
            features.append({
                "osm_id": osm_id,
                "osm_type": props.get("@osmType"),
                "geometry_type": geometry.get("type"),
                "coordinates": geometry.get("coordinates"),
                "tags": {k: v for k, v in props.items() if not k.startswith("@")},
            })
        out[key] = features
    return out


def linestring_length_km(coordinates: Any, geometry_type: Optional[str] = None) -> float:
    """Length of a GeoJSON LineString/MultiLineString in [lon, lat] order."""
    if not coordinates:
        return 0.0
    lines = coordinates if geometry_type == "MultiLineString" else [coordinates]
    total = 0.0
    for line in lines or []:
        pts = list(line or [])
        for first, second in zip(pts, pts[1:]):
            lon1, lat1 = float(first[0]), float(first[1])
            lon2, lat2 = float(second[0]), float(second[1])
            total += haversine_km(lat1, lon1, lat2, lon2)
    return total


def summarize_roads(road_features: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_km = 0.0
    by_highway: Dict[str, float] = {}
    segments = 0
    for feature in road_features:
        if feature.get("geometry_type") not in ("LineString", "MultiLineString"):
            continue
        length = linestring_length_km(feature.get("coordinates"), feature.get("geometry_type"))
        total_km += length
        segments += 1
        hw = str((feature.get("tags") or {}).get("highway", "unspecified"))
        by_highway[hw] = by_highway.get(hw, 0.0) + length
    return {
        "segments": segments,
        "total_km": round(total_km, 2),
        "by_highway_km": {k: round(v, 2) for k, v in sorted(by_highway.items())},
    }
