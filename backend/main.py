"""AetherFlood API for source-linked incident monitoring and prototype workflows.

Data rules (hackathon compliance):
- Allowed inputs: Sentinel-1, Sentinel-2, Copernicus DEM, pre-event OpenStreetMap,
  and the listed training datasets.
- Prohibited as inputs: Copernicus EMS, UNOSAT or any other published damage maps,
  and OpenStreetMap edits made after the event. These may only be referenced
  after the fact to check results. This API exposes no EMS ingestion endpoint.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Literal, Optional
import sys
import uvicorn
import datetime
import os
import logging
import requests
from pathlib import Path

# Ensure the repository root (parent of backend/) is in sys.path so 'backend' package imports resolve
# whether executed from repo root or inside the backend service directory on Vercel.
_repo_root = str(Path(__file__).resolve().parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from backend.config import PRE_EVENT_OSM_SNAPSHOT
from backend.services.incident_data import (
    get_canonical_incident,
    list_canonical_incidents
)
from backend.services.copilot_engine import copilot_engine
from backend.services.db import db_service
from backend.ml.change_detection_pipeline import (
    Sentinel1OrbitFilter,
    S1SceneMetadata,
)

logger = logging.getLogger("aetherflood")

app = FastAPI(
    title="AetherFlood Copilot API",
    description=(
        "Source-grounded incident monitoring and decision copilot. "
        "Prohibited inputs (Copernicus EMS, UNOSAT, published damage maps, post-event "
        "OSM edits) are never ingested; they may only be referenced post-hoc to check results."
    ),
    version="1.0.0"
)

# CORS configuration: allows local dev, deployed Firebase origins, and any Vercel deployment domain.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "AETHERFLOOD_ALLOWED_ORIGINS",
        # Local Vite dev + preview, then deployed Firebase Hosting origins.
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "https://aetherflood.web.app,https://aetherflood.firebaseapp.com",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    bbox: List[float] # [min_lon, min_lat, max_lon, max_lat]
    event_date: str
    pre_event_date: Optional[str] = None
    pre_orbit_track: int = 121
    post_orbit_track: int = 121
    osm_snapshot_time: str = PRE_EVENT_OSM_SNAPSHOT

class ChatTurn(BaseModel):
    """A single bounded conversation turn supplied by the client."""
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    incident_id: Optional[str] = "nepal-tibet-2026-08-26"
    language: str = "en" # "en" or "ne"
    mode: str = "offline" # "offline" (Ollama) or "online"
    ollama_model: Optional[str] = None
    analysis_job_id: Optional[str] = None # ground the reply in a completed analysis job
    # Bounded so a long conversation cannot grow the prompt without limit.
    history: List[ChatTurn] = Field(default_factory=list, max_length=12)

    @field_validator("query")
    @classmethod
    def _query_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("query must contain at least one non-whitespace character")
        return value.strip()

class UserAuthRequest(BaseModel):
    name: str
    email: str
    role: Optional[str] = "Disaster Response Officer"
    password: Optional[str] = ""

# In-memory storage for active operational users
CURRENT_USERS: Dict[str, Dict[str, Any]] = {}

@app.get("/")
def root():
    return {
        "system": "AetherFlood Copilot",
        "status": "PROTOTYPE",
        "analysis_status": "unavailable",
        "limitations": [
            "No event-specific Sentinel scenes or DEM rasters are ingested.",
            "No validated damage or network-isolation measurements are connected.",
            "Copernicus EMS, UNOSAT and other published damage maps are prohibited as "
            "inputs under competition rules; they may only be referenced post-hoc to "
            "check results, and no EMS ingestion endpoint exists here.",
        ],
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AetherFlood Copilot Engine"}

@app.post("/api/auth/register")
def register_user(req: UserAuthRequest):
    user_id = req.email.strip().lower()
    user_data = {
        "id": user_id,
        "name": req.name.strip(),
        "email": req.email.strip(),
        "role": req.role or "Emergency Coordinator",
        "initials": "".join([part[0].upper() for part in req.name.strip().split() if part])[:2] or "OP",
        "registered_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    CURRENT_USERS[user_id] = user_data
    return {"status": "SUCCESS", "user": user_data}

@app.get("/api/benchmark/trishuli")
def get_trishuli_case_study():
    return {
        "status": "unavailable",
        "metadata": {
            "event": "Nepal–Tibet floods",
            "date": "2026-08-26",
            "activation_code": "EMSR927",
        },
        "reason": (
            "No verified Sentinel analysis output or independent benchmark "
            "comparison is loaded."
        ),
    }

@app.get("/api/metrics")
def get_system_metrics():
    return {
        "status": "unavailable",
        "measurements": None,
        "reason": "No validated flood measurements, SAR change products, or DEM-derived outputs are connected to the operational pipeline.",
        "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

@app.get("/api/system/summary")
def get_system_summary():
    return {
        "system": "AetherFlood Copilot",
        "status": "unavailable",
        "reason": "No validated Sentinel scenes, DEM rasters, or independent damage measurements are connected to the operational analysis workflow.",
        "active_incidents": [],
        "prohibited_input_policy": (
            "Copernicus EMS, UNOSAT and other published damage maps, and post-event "
            "OpenStreetMap edits are prohibited as inputs. No EMS catalogue access or "
            "EMS-derived product is exposed; such sources may only be referenced "
            "post-hoc to check results."
        ),
        "satellite_imagery_pairs_loaded": 0,
        "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

class IncidentStatusUpdate(BaseModel):
    status: Literal["REPORTED", "CONFIRMED", "MONITORED", "RESOLVED"]
    action_note: Optional[str] = None

@app.get("/api/incidents")
def get_incidents_feed(
    incident_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """
    Returns source-attributed incident records partitioned by incident_id.
    """
    return db_service.get_all_incidents(category_filter=category, incident_id=incident_id)

@app.get("/api/incidents/canonical")
def get_canonical_incidents():
    """Returns canonical records for both incidents with verified provenance."""
    return [inc.model_dump() for inc in list_canonical_incidents()]

@app.get("/api/incidents/canonical/{incident_id}")
def get_canonical_incident_detail(incident_id: str):
    inc = get_canonical_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc.model_dump()

@app.post("/api/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, req: IncidentStatusUpdate):
    """
    Updates incident triage status (REPORTED, CONFIRMED, MONITORED, RESOLVED).
    Persists to SQLite database and logs to pipeline audit ledger.
    """
    res = db_service.update_incident_status(incident_id, req.status, req.action_note)
    if not res:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    db_service.add_pipeline_log(
        component="TACTICAL_DISPATCH",
        level="INFO",
        message=f"Incident record {incident_id} updated to {req.status}. Action: {req.action_note or 'Triage status changed'}",
        proof_token=f"INC-STATUS-{incident_id}"
    )
    return {"status": "SUCCESS", "incident": res}

@app.get("/api/telemetry/passes")
def get_satellite_passes(incident_id: Optional[str] = Query(None)):
    passes = db_service.get_satellite_passes(incident_id)
    if not passes:
        return {
            "status": "unavailable",
            "passes": [],
            "reason": "No validated SAR or optical acquisitions are connected to the analysis pipeline.",
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    return {
        "status": "available",
        "passes": passes,
        "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

@app.get("/api/telemetry/pipeline-logs")
def get_pipeline_logs(limit: int = Query(50)):
    logs = db_service.get_pipeline_logs(limit)
    if not logs:
        return {
            "status": "unavailable",
            "logs": [],
            "reason": "No validated operational pipeline logs are connected.",
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    return {
        "status": "available",
        "logs": logs,
        "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

@app.get("/api/telemetry/orbit")
def get_orbit_telemetry():
    return {
        "status": "unavailable",
        "reason": "Live orbit ephemeris and acquisition telemetry are not connected.",
    }

@app.post("/api/analyze")
def run_custom_analysis(req: AnalysisRequest):
    """
    Validates requested metadata before returning an explicit unavailable state.
    Checks:
    1. Same-orbit track rule for Sentinel-1
    2. Pre-event snapshot rule for OSM
    """
    # 1. Enforce Sentinel-1 Same-Orbit Rule
    if req.pre_orbit_track != req.post_orbit_track:
        raise HTTPException(
            status_code=400,
            detail=(
                f"DATA RULE VIOLATION: Pre-event orbit track ({req.pre_orbit_track}) does not match "
                f"post-event track ({req.post_orbit_track}). SAR change detection requires identical look geometry."
            )
        )
    
    # 2. Enforce Pre-disaster OSM snapshot rule
    if req.osm_snapshot_time > PRE_EVENT_OSM_SNAPSHOT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"DATA RULE VIOLATION: Requested OSM snapshot date ({req.osm_snapshot_time}) is after "
                f"the allowable pre-event cutoff ({PRE_EVENT_OSM_SNAPSHOT}). Post-event edits prohibited."
            )
        )

    raise HTTPException(
        status_code=503,
        detail=(
            "Analysis unavailable: this endpoint does not ingest verified Sentinel scenes, "
            "an event-specific flood mask, a DEM raster, or dated OSM data."
        ),
    )

@app.get("/api/sensor/status")
def get_sensor_pipeline_status():
    return {
        "status": "unavailable",
        "reason": "No validated SAR or optical scenes are not connected to the analysis pipeline.",
    }

@app.post("/api/copilot/chat")
def copilot_chat(req: ChatRequest):
    """
    Generate incident situation analysis strictly grounded in verified data.
    Prevents hallucinated casualties, coordinates, or statistics.
    """
    from backend.services.jobs import get_job
    res = copilot_engine.answer_query(
        query=req.query,
        incident_id=req.incident_id,
        lang=req.language,
        mode=req.mode,
        analysis_job=(get_job(req.analysis_job_id) if req.analysis_job_id else None),
        history=[t.model_dump() for t in req.history],
    )
    res_dict = res.model_dump()
    res_dict["mode"] = req.mode
    res_dict["reply"] = res.summary
    res_dict["provider"] = res.model_provider
    res_dict["model"] = res.model_name or res.model_provider
    return res_dict

@app.get("/api/copilot/sitrep")
def get_sitrep(
    incident_id: Optional[str] = Query(None),
    lang: Optional[str] = Query(None),
    language: Optional[str] = Query(None)
):
    """
    Return formal 1-page Situation Report grounded strictly in verified incident data.
    """
    chosen_lang = lang or language or "en"
    if chosen_lang not in ["en", "ne"]:
        chosen_lang = "en"
    return copilot_engine.generate_sitrep(
        incident_id=incident_id,
        lang=chosen_lang
    )

@app.get("/api/bonus/trace-flood-path")
def trace_upstream_flood_path(
    lat: float = Query(..., description="Upstream latitude"),
    lon: float = Query(..., description="Upstream longitude")
):
    """
    Terrain-derived downstream path from a start point using public elevation
    tiles (D8 steepest descent). This is a potential flow path from terrain —
    not a hydraulic simulation and not a measured flood extent.
    """
    from backend.services import dem_trace
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        raise HTTPException(status_code=422, detail="Start coordinates out of range.")
    half = 0.06
    bbox = [lon - half, lat - half, lon + half, lat + half]
    try:
        grid_info = dem_trace.build_grid(bbox)
        traced = dem_trace.trace_downstream(grid_info["grid"], grid_info["bounds"], lat, lon)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Elevation tile download failed: {exc}")
    except Exception:
        # Log server-side; never return internal exception text to the client.
        logger.exception("Downstream tracing failed")
        raise HTTPException(
            status_code=502,
            detail="Downstream tracing failed due to an internal processing error.",
        )
    drop = traced["drop_m"]
    length_km = traced["length_km"]
    return {
        "path_coordinates": traced["path_coordinates"],
        "total_downstream_length_km": length_km,
        "total_elevation_drop_m": drop,
        "valley_gradient_pct": round((drop / (length_km * 1000.0) * 100.0) if length_km > 0 else 0.0, 2),
        "upstream_origin": {
            "input_lat": lat,
            "input_lon": lon,
            "origin_elevation_m": traced["start_elevation_m"],
            "starting_zone": "Public elevation tiles (Terrarium, D8 trace)",
        },
        "method": ("D8 steepest-descent on public Terrarium elevation tiles. "
                   "Terrain-derived potential flow path — not a hydraulic model."),
        "source": "AWS Terrain Tiles (public, no key; SRTM/ETOPO-class sources)",
    }

class ChangeDetectionRequest(BaseModel):
    pre_scene_id: Optional[str] = "S1A_IW_GRDH_1SDV_20260814T001842_Track121"
    post_scene_id: Optional[str] = "S1A_IW_GRDH_1SDV_20260826T001843_Track121"
    relative_orbit_pre: int = 121
    relative_orbit_post: int = 121
    orbit_direction: str = "ASCENDING"
    pre_acquisition_time: str = "2026-08-14T00:18:42"
    post_acquisition_time: str = "2026-08-26T00:18:43"
    polarizations: List[str] = ["VV", "VH"]
    apply_dem_filter: bool = True

@app.post("/api/ml/change-detection")
def run_bitemporal_change_detection(req: ChangeDetectionRequest):
    """Validate acquisition metadata without fabricating image inputs or results."""
    try:
        t_pre = datetime.datetime.fromisoformat(req.pre_acquisition_time)
        t_post = datetime.datetime.fromisoformat(req.post_acquisition_time)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ISO timestamp format: {str(e)}")

    pre_meta = S1SceneMetadata(
        scene_id=req.pre_scene_id,
        acquisition_time=t_pre,
        relative_orbit=req.relative_orbit_pre,
        orbit_direction=req.orbit_direction,
        polarization=req.polarizations
    )
    post_meta = S1SceneMetadata(
        scene_id=req.post_scene_id,
        acquisition_time=t_post,
        relative_orbit=req.relative_orbit_post,
        orbit_direction=req.orbit_direction,
        polarization=req.polarizations
    )

    orbit_filter = Sentinel1OrbitFilter()
    try:
        orbit_filter.validate_pair(pre_meta, post_meta)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    raise HTTPException(
        status_code=503,
        detail=(
            "Acquisition metadata passed validation, but change detection is unavailable "
            "because real co-registered scene arrays and a matching DEM are not supplied."
        ),
    )

class AnalysisJobRequest(BaseModel):
    bbox: Optional[List[float]] = None
    polygon: Optional[Any] = None
    event_date: Optional[str] = None
    pre_window: Optional[List[str]] = None
    post_window: Optional[List[str]] = None
    osm_snapshot_time: Optional[str] = None
    trace_start: Optional[List[float]] = None
    settlements: Optional[List[Dict[str, Any]]] = None


@app.post("/api/analysis/jobs", status_code=201)
def create_analysis_job(req: AnalysisJobRequest):
    """
    Start a real operational analysis job: validates the AOI/date/windows,
    then searches public Sentinel catalogues, extracts pre-event OSM data,
    and (optionally) traces downstream terrain — all in a background worker.
    Flood classification itself is honestly reported unavailable because scene
    download requires CDSE credentials that are not configured.
    """
    from backend.services.analysis import validate_analysis_inputs
    from backend.services.jobs import create_job
    try:
        inputs = validate_analysis_inputs(req.model_dump(exclude_none=False))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return create_job(inputs)


class BatchTranslateRequest(BaseModel):
    texts: List[str]
    target_lang: str = "ne"


@app.post("/api/translate")
def batch_translate(req: BatchTranslateRequest):
    """
    Translate short UI/content strings via Sarvam AI (server-side only).
    Successes are cached briefly by content hash; failures are never cached
    as translations. 'en' echoes the source (status 'original').
    """
    from backend.services import sarvam_translate
    if req.target_lang not in ("en", "ne"):
        raise HTTPException(status_code=422, detail="target_lang must be 'en' or 'ne'.")
    if not isinstance(req.texts, list) or not (1 <= len(req.texts) <= 20):
        raise HTTPException(status_code=422, detail="texts must be a list of 1 to 20 strings.")
    for text in req.texts:
        if not isinstance(text, str) or not text.strip() or len(text) > 2000:
            raise HTTPException(
                status_code=422,
                detail="Each text must be a non-empty string of at most 2000 characters.",
            )
    out = []
    for index, text in enumerate(req.texts):
        if req.target_lang == "en":
            out.append({"index": index, "text": text, "status": "original"})
            continue
        cached = sarvam_translate.cache_get(text, "ne")
        if cached is not None:
            out.append({"index": index, "text": cached, "status": "ok", "cached": True})
            continue
        try:
            translated = sarvam_translate.translate_text(
                text, source_lang="en", target_lang="ne")["text"]
            sarvam_translate.cache_put(text, "ne", translated)
            out.append({"index": index, "text": translated, "status": "ok"})
        except sarvam_translate.SarvamError as exc:
            out.append({"index": index, "text": text, "status": "error",
                        "code": exc.code, "error": exc.message})
    return {
        "translations": out,
        "provider": "sarvam",
        "model": sarvam_translate.config.sarvam_model,
        "target_lang": req.target_lang,
    }


@app.get("/api/analysis/jobs")
def list_analysis_jobs():
    from backend.services.jobs import list_jobs
    return {"jobs": list_jobs()}


@app.get("/api/analysis/jobs/{job_id}")
def get_analysis_job(job_id: str):
    from backend.services.jobs import get_job
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Unknown analysis job {job_id}.")
    return job


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
