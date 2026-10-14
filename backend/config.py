"""
AetherFlood Copilot - Configuration & System Constants
Strict adherence to hackathon data rules:
- Sentinel-1 / Sentinel-2 from dataspace.copernicus.eu (strict relative orbit track matching)
- OpenStreetMap via ohsome API strictly using pre-event snapshot (<= 2026-07-27T00:00:00Z)
- Copernicus DEM 30m (WorldDEM-30)
- Training validation reference: Sen1Floods11 & Kuro Siwo
- Ground-truth evaluation reference: EMSR927 (Trishuli Nepal Flood, August 2026)
"""

import os
from pydantic import BaseModel


def _load_dotenv():
    """
    Minimal `.env` loader (stdlib only, no new dependency): KEY=VALUE
    lines with optional quoting; existing process environment always wins.
    Checks both backend directory and root directory for .env files.
    """
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(backend_dir)
        for env_path in [os.path.join(backend_dir, ".env"), os.path.join(root_dir, ".env")]:
            if not os.path.isfile(env_path):
                continue
            with open(env_path, encoding="utf-8") as handle:
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
EMS_PUBLIC_ACTIVATIONS_URL = (
    "https://mapping.emergency.copernicus.eu/backend/dashboard-api/public-activations/"
)

# ohsome API for historical OpenStreetMap data
OHSOME_API_URL = "https://api.ohsome.org/v1"

# Default Area of Interest (AoI): Trishuli Basin / Rasuwa District, Nepal (EMSR927 Event)
# [min_lon, min_lat, max_lon, max_lat]
DEFAULT_AOI = {
    "name": "Trishuli River Basin, Nepal (EMSR927 Validation)",
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
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    copilot_mode: str = os.getenv("COPILOT_MODE", "auto")

config = PipelineConfig()
