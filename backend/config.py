"""
AetherFlood Copilot - Configuration & System Constants
Strict adherence to hackathon data rules:
- Allowed inputs: Sentinel-1 / Sentinel-2 (CDSE public search), pre-event OpenStreetMap (<= 2026-07-27), Copernicus DEM 30m (WorldDEM-30), Sen1Floods11 & Kuro Siwo
- Prohibited as inputs: Copernicus EMS, UNOSAT or published damage maps (EMSR927 is referenced solely to check results, never as an input)
"""

import os
from pydantic import BaseModel


def _load_dotenv():
    """
    Minimal root `.env` loader (stdlib only, no new dependency): KEY=VALUE
    lines with optional quoting; existing process environment always wins.
    Backend-only secrets such as SARVAM_API_KEY stay out of the frontend.
    """
    try:
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(root, ".env")
        with open(path, encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip("'").strip('"').strip()
                if key and key not in os.environ:
                    os.environ[key] = value
    except OSError:
        pass


_load_dotenv()

# Disaster event date and strict pre-event OSM cutoff
DISASTER_DATE = "2026-08-26T00:00:00Z"
PRE_EVENT_OSM_SNAPSHOT = "2026-07-27T00:00:00Z"

# Copernicus Data Space Ecosystem (CDSE)
CDSE_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CDSE_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
CDSE_STAC_URL = "https://catalogue.dataspace.copernicus.eu/stac"
# NOTE: Copernicus EMS (mapping.emergency.copernicus.eu) is intentionally NOT
# configured. EMS/UNOSAT/published damage maps are prohibited as inputs under
# the competition data rules; they may only be referenced post-hoc to check
# results, so no EMS catalogue URL or client is kept here.

# ohsome API for historical OpenStreetMap data
OHSOME_API_URL = "https://api.ohsome.org/v1"

# Default Area of Interest (AoI): Trishuli Basin / Rasuwa District, Nepal (Sentinel-1 / Copernicus DEM)
# [min_lon, min_lat, max_lon, max_lat]
DEFAULT_AOI = {
    "name": "Trishuli River Basin, Nepal (Sentinel-1 / Copernicus DEM)",
    "bbox": [85.120, 27.910, 85.340, 28.160],
    "center": [28.035, 85.230],
    "pre_event_sar_date": "2026-08-14T00:00:00Z", # Orbit Track 121 (12 days prior)
    "post_event_sar_date": "2026-08-26T00:00:00Z", # Orbit Track 121 (Identical geometry)
    "relative_orbit": 121,
    "pass_direction": "DESCENDING"
}

class PipelineConfig(BaseModel):
    cdse_client_id: str = os.getenv("CDSE_CLIENT_ID", "")
    cdse_client_secret: str = os.getenv("CDSE_CLIENT_SECRET", "")
    sar_threshold_db: float = -3.2  # VV/VH log-ratio drop threshold for flood/debris
    slope_cutoff_deg: float = 18.0  # Slope threshold above which water cannot pool
    pre_event_snapshot: str = PRE_EVENT_OSM_SNAPSHOT
    copilot_model: str = os.getenv("COPILOT_MODEL", "gemma:2b")
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", os.getenv("COPILOT_MODEL", "gemma:2b"))
    sarvam_api_key: str = os.getenv("SARVAM_API_KEY", "")
    sarvam_model: str = os.getenv("SARVAM_MODEL", "sarvam-105b")
    sarvam_api_url: str = os.getenv("SARVAM_API_URL", "https://api.sarvam.ai/v1/chat/completions")
    copilot_mode: str = os.getenv("COPILOT_MODE", "offline")

config = PipelineConfig()
