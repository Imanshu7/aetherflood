"""
Public Copernicus Data Space Ecosystem (CDSE) catalogue search.

Uses only the unauthenticated OData catalogue search endpoint to discover
suitable Sentinel-1 / Sentinel-2 scenes for an area and date windows.
Scene *download* is intentionally not implemented here: product download
requires personal CDSE credentials, which must never be embedded in code.
The flood-classification step therefore reports an explicit unavailable
state instead of fabricating a raster.
"""

from typing import Any, Dict, List, Optional
import urllib.parse
import requests

ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
TIMEOUT = (10, 60)


def _wkt_polygon(bbox: List[float]) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    return (
        "geography'SRID=4326;POLYGON(("
        f"{min_lon} {min_lat},{max_lon} {min_lat},"
        f"{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))'"
    )


def _iso_z(value: str) -> str:
    text = str(value).strip()
    if text.endswith("+00:00"):
        text = text[:-6] + "Z"
    if not text.endswith("Z"):
        text += "Z"
    return text


def _search(params: Dict[str, str], top: int = 200) -> List[Dict[str, Any]]:
    query = dict(params)
    query["$top"] = str(top)
    url = ODATA_URL + "?" + urllib.parse.urlencode(query)
    collected: List[Dict[str, Any]] = []
    pages = 0
    while url and pages < 5:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict) or not isinstance(payload.get("value"), list):
            raise ValueError("CDSE catalogue returned an unexpected response.")
        collected.extend(payload["value"])
        url = payload.get("@odata.nextLink")
        pages += 1
    return collected


def _attrs(product: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for attr in product.get("Attributes") or []:
        name = attr.get("Name")
        if isinstance(name, str):
            out[name] = attr.get("Value")
    return out


def search_sentinel1(
    bbox: List[float], start_iso: str, end_iso: str, top: int = 200
) -> List[Dict[str, Any]]:
    """Find Sentinel-1 GRD scenes intersecting the AOI in a date window."""
    filt = (
        "Collection/Name eq 'SENTINEL-1' and contains(Name,'GRD') and "
        f"ContentDate/Start ge {_iso_z(start_iso)} and "
        f"ContentDate/Start le {_iso_z(end_iso)} and "
        f"OData.CSC.Intersects(area={_wkt_polygon(bbox)})"
    )
    products = _search({"$filter": filt, "$expand": "Attributes"}, top=top)
    scenes = []
    for product in products:
        attrs = _attrs(product)
        content = product.get("ContentDate") or {}
        scenes.append({
            "scene_id": product.get("Name"),
            "product_id": product.get("Id"),
            "acquisition_start": content.get("Start"),
            "acquisition_end": content.get("End"),
            "mode": attrs.get("operationalMode"),
            "swath": attrs.get("swathIdentifier"),
            "polarisation": attrs.get("polarisationChannels"),
            "orbit_direction": attrs.get("orbitDirection"),
            "relative_orbit": attrs.get("relativeOrbitNumber"),
            "platform": attrs.get("platformSerialIdentifier"),
            "processing_level": attrs.get("processingLevel"),
        })
    scenes.sort(key=lambda s: s.get("acquisition_start") or "")
    return scenes


def search_sentinel2(
    bbox: List[float], start_iso: str, end_iso: str, max_cloud_pct: float = 20.0, top: int = 200
) -> Dict[str, Any]:
    """Find Sentinel-2 L2A scenes; split into cloud-suitable vs obscured."""
    filt = (
        "Collection/Name eq 'SENTINEL-2' and contains(Name,'MSIL2A') and "
        f"ContentDate/Start ge {_iso_z(start_iso)} and "
        f"ContentDate/Start le {_iso_z(end_iso)} and "
        f"OData.CSC.Intersects(area={_wkt_polygon(bbox)})"
    )
    products = _search({"$filter": filt, "$expand": "Attributes"}, top=top)
    usable, obscured = [], []
    for product in products:
        attrs = _attrs(product)
        content = product.get("ContentDate") or {}
        try:
            cloud = float(attrs.get("cloudCover")) if attrs.get("cloudCover") is not None else None
        except (TypeError, ValueError):
            cloud = None
        scene = {
            "scene_id": product.get("Name"),
            "product_id": product.get("Id"),
            "acquisition_start": content.get("Start"),
            "acquisition_end": content.get("End"),
            "cloud_cover_pct": cloud,
        }
        if cloud is not None and cloud <= max_cloud_pct:
            usable.append(scene)
        else:
            obscured.append(scene)
    key = lambda s: s.get("acquisition_start") or ""
    usable.sort(key=key)
    obscured.sort(key=key)
    return {"usable": usable, "obscured": obscured, "max_cloud_pct": max_cloud_pct}
