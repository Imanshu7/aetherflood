"""
AetherFlood Database Service (SQLite-backed Spatial Data Store)
Manages real persistent database records for:
1. Spatial Incidents & Field Triage Dispatches with strict incident isolation:
   - Incident A: Nepal–Tibet Historical Flood (2026-08-26)
   - Incident B: Budhi Gandaki Developing Flood (2026-10-11)
2. Satellite & Sensor Inputs (Historical Sentinel-1 Orbit 121, Sentinel-2 Optical, Copernicus DEM)
3. Pipeline Telemetry Audit Logs
"""

import sqlite3
import os
import datetime
from typing import Dict, Any, List, Optional
from backend.services.incident_data import INCIDENT_A, INCIDENT_B

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "aetherflood.db")

def get_db_path() -> str:
    """Return the active SQLite database path, copying to /tmp in Vercel serverless environments."""
    if os.getenv("VERCEL"):
        tmp_db = "/tmp/aetherflood.db"
        if not os.path.exists(tmp_db) and os.path.exists(DEFAULT_DB_PATH):
            try:
                import shutil
                shutil.copy2(DEFAULT_DB_PATH, tmp_db)
            except Exception as e:
                print(f"[WARN] Failed copying SQLite DB to /tmp: {e}")
        return tmp_db
    return DEFAULT_DB_PATH

DB_PATH = get_db_path()

class DatabaseService:
    def __init__(self):
        active_path = get_db_path()
        os.makedirs(os.path.dirname(active_path), exist_ok=True)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(get_db_path())
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Incidents Table with strict incident_id partition
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    incident_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    subtitle TEXT NOT NULL,
                    location_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    verification_state TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    source_name TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    status TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lon REAL NOT NULL,
                    action_taken TEXT,
                    timestamp TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            # 2. Satellite Passes Table (Multi-temporal orbital history for Incident A)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS satellite_passes (
                    id TEXT PRIMARY KEY,
                    incident_id TEXT NOT NULL,
                    sensor TEXT NOT NULL,
                    date TEXT NOT NULL,
                    orbit_track INTEGER NOT NULL,
                    polarization TEXT NOT NULL,
                    mean_backscatter_db REAL NOT NULL,
                    water_extent_km2 REAL NOT NULL,
                    cloud_cover_pct REAL NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT
                )
            """)

            # 3. Pipeline Telemetry Audit Logs Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    component TEXT NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    proof_token TEXT
                )
            """)

            conn.commit()

        # Seed initial source-attributed records
        self._seed_initial_data()

    def _seed_initial_data(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if columns exist; if old schema, upgrade
            cursor.execute("PRAGMA table_info(incidents)")
            cols = [col["name"] for col in cursor.fetchall()]
            if "incident_id" not in cols:
                cursor.execute("DROP TABLE incidents")
                cursor.execute("""
                    CREATE TABLE incidents (
                        id TEXT PRIMARY KEY,
                        incident_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        subtitle TEXT NOT NULL,
                        location_name TEXT NOT NULL,
                        category TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        verification_state TEXT NOT NULL,
                        source_id TEXT NOT NULL,
                        source_name TEXT NOT NULL,
                        source_url TEXT NOT NULL,
                        status TEXT NOT NULL,
                        lat REAL NOT NULL,
                        lon REAL NOT NULL,
                        action_taken TEXT,
                        timestamp TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                """)
                conn.commit()

            cursor.execute("SELECT COUNT(*) as count FROM incidents")
            if cursor.fetchone()["count"] == 0:
                now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
                records_to_insert = []
                
                # Insert Incident A verified records
                for rec in INCIDENT_A.sub_records:
                    records_to_insert.append((
                        rec.id,
                        rec.incident_id,
                        rec.title,
                        rec.subtitle,
                        rec.location_name,
                        rec.category,
                        rec.severity,
                        rec.verification_state,
                        rec.source_id,
                        rec.source_name,
                        rec.source_url,
                        rec.status,
                        rec.lat,
                        rec.lon,
                        rec.action_note or "",
                        rec.timestamp,
                        now_str
                    ))

                # Insert Incident B verified records
                for rec in INCIDENT_B.sub_records:
                    records_to_insert.append((
                        rec.id,
                        rec.incident_id,
                        rec.title,
                        rec.subtitle,
                        rec.location_name,
                        rec.category,
                        rec.severity,
                        rec.verification_state,
                        rec.source_id,
                        rec.source_name,
                        rec.source_url,
                        rec.status,
                        rec.lat,
                        rec.lon,
                        rec.action_note or "",
                        rec.timestamp,
                        now_str
                    ))

                cursor.executemany("""
                    INSERT INTO incidents (
                        id, incident_id, title, subtitle, location_name, category, severity,
                        verification_state, source_id, source_name, source_url, status,
                        lat, lon, action_taken, timestamp, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, records_to_insert)

            # Check if satellite_passes has incident_id
            cursor.execute("PRAGMA table_info(satellite_passes)")
            pass_cols = [col["name"] for col in cursor.fetchall()]
            if "incident_id" not in pass_cols:
                cursor.execute("DROP TABLE satellite_passes")
                cursor.execute("""
                    CREATE TABLE satellite_passes (
                        id TEXT PRIMARY KEY,
                        incident_id TEXT NOT NULL,
                        sensor TEXT NOT NULL,
                        date TEXT NOT NULL,
                        orbit_track INTEGER NOT NULL,
                        polarization TEXT NOT NULL,
                        mean_backscatter_db REAL NOT NULL,
                        water_extent_km2 REAL NOT NULL,
                        cloud_cover_pct REAL NOT NULL,
                        status TEXT NOT NULL,
                        notes TEXT
                    )
                """)
                conn.commit()

            cursor.execute("SELECT COUNT(*) as count FROM satellite_passes")
            if cursor.fetchone()["count"] == 0:
                initial_passes = [
                    (
                        "PASS-01",
                        "nepal-tibet-2026-08-26",
                        "Sentinel-1A C-SAR",
                        "2026-08-02",
                        121,
                        "VV + VH",
                        -12.4,
                        0.0,
                        78.0,
                        "ARCHIVED_BASELINE",
                        "Dry seasonal baseline pass; identical relative orbit track #121"
                    ),
                    (
                        "PASS-02",
                        "nepal-tibet-2026-08-26",
                        "Sentinel-1A C-SAR",
                        "2026-08-14",
                        121,
                        "VV + VH",
                        -12.1,
                        0.0,
                        82.0,
                        "PRE_EVENT_REFERENCE",
                        "Official pre-disaster SAR scene; exactly 12 days prior to flood event"
                    ),
                    (
                        "PASS-03",
                        "nepal-tibet-2026-08-26",
                        "Sentinel-1A C-SAR",
                        "2026-08-26",
                        121,
                        "VV + VH",
                        -16.8,
                        0.0,
                        85.0,
                        "POST_EVENT_ACQUISITION",
                        "Post-disaster acquisition; relative orbit track #121 preserved"
                    ),
                    (
                        "PASS-04",
                        "nepal-tibet-2026-08-26",
                        "Sentinel-2B MSI (Optical)",
                        "2026-08-25",
                        0,
                        "Multi-spectral (13 bands)",
                        0.0,
                        0.0,
                        91.4,
                        "OBSCURED_BY_CLOUDS",
                        "Monsoon cloud deck obstructed optical view in high-altitude valley"
                    ),
                    (
                        "PASS-05",
                        "nepal-tibet-2026-08-26",
                        "Copernicus DEM (WorldDEM-30)",
                        "2026-08-26",
                        0,
                        "Elevation & Slope (30m)",
                        0.0,
                        0.0,
                        0.0,
                        "TERRAIN_DEM_INPUT",
                        "Copernicus 30m Global DEM raster input for physical slope conditioning (>18°)"
                    )
                ]
                cursor.executemany("""
                    INSERT INTO satellite_passes (
                        id, incident_id, sensor, date, orbit_track, polarization, mean_backscatter_db, water_extent_km2, cloud_cover_pct, status, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initial_passes)

            # Check if pipeline logs exist
            cursor.execute("SELECT COUNT(*) as count FROM pipeline_logs")
            if cursor.fetchone()["count"] == 0:
                initial_logs = [
                    ("2026-08-26 09:53:00 UTC", "COPERNICUS_DEM", "INFO", "Copernicus WorldDEM-30 30m terrain elevation raster ingested for hydraulic slope masking.", "COPERNICUS-DEM-30M"),
                    ("2026-08-27 10:30:00 UTC", "SATELLITE_CATALOGUE", "INFO", "Co-registered Copernicus Sentinel-2 Betrawati/Gerkhu pair (12 Aug vs 27 Aug 2026).", "S2-BETRAWATI-PAIR"),
                    ("2026-08-27 12:00:00 UTC", "SATELLITE_CATALOGUE", "INFO", "Co-registered ESA/USGS Glacier headwaters SWIR pair (24 Aug S2 vs 26 Aug Landsat-9).", "ESA-GLACIER-SWIR"),
                    ("2026-10-11 11:30:00 NPT", "REPORT_INGESTION", "INFO", "Ingested ICIMOD preliminary report on Budhi Gandaki suspected landslide-dam breach.", "ICIMOD-2026-10-11"),
                    ("2026-10-11 14:00:00 NPT", "REPORT_INGESTION", "INFO", "Ingested Kathmandu Post report on Gorkha river corridor bridge and settlement disruptions.", "TKP-2026-10-11")
                ]
                cursor.executemany("""
                    INSERT INTO pipeline_logs (timestamp, component, level, message, proof_token)
                    VALUES (?, ?, ?, ?, ?)
                """, initial_logs)

            conn.commit()

    # --- Incident Methods ---
    def get_all_incidents(
        self,
        category_filter: Optional[str] = None,
        incident_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            conditions = []
            params = []

            if incident_id:
                conditions.append("incident_id = ?")
                params.append(incident_id)

            if category_filter and category_filter != "All":
                conditions.append("category = ?")
                params.append(category_filter)

            where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            query = f"SELECT * FROM incidents {where_clause} ORDER BY severity = 'CRITICAL' DESC, timestamp DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def update_incident_status(self, record_id: str, new_status: str, action_note: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()

            exact_match = cursor.execute(
                "SELECT * FROM incidents WHERE id = ?",
                (record_id,),
            ).fetchone()
            if exact_match is not None:
                target_id = exact_match["id"]
                target_incident_id = exact_match["incident_id"]
                filter_sql = "WHERE id = ?"
                filter_params = (target_id,)
                row = exact_match
            else:
                incident_match = cursor.execute(
                    "SELECT * FROM incidents WHERE incident_id = ? ORDER BY id LIMIT 1",
                    (record_id,),
                ).fetchone()
                if incident_match is None:
                    return None
                target_id = incident_match["id"]
                target_incident_id = incident_match["incident_id"]
                filter_sql = "WHERE incident_id = ?"
                filter_params = (target_incident_id,)
                row = incident_match

            if action_note:
                cursor.execute(
                    f"""
                    UPDATE incidents
                    SET status = ?, action_taken = ?, updated_at = ?
                    {filter_sql}
                    """,
                    (new_status, action_note, now, *filter_params),
                )
            else:
                cursor.execute(
                    f"""
                    UPDATE incidents
                    SET status = ?, updated_at = ?
                    {filter_sql}
                    """,
                    (new_status, now, *filter_params),
                )
            conn.commit()

            cursor.execute("SELECT * FROM incidents WHERE id = ?", (target_id,))
            updated_row = cursor.fetchone()
            return dict(updated_row) if updated_row else None

    # --- Satellite Passes Methods ---
    def get_satellite_passes(self, incident_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if incident_id:
                cursor.execute("SELECT * FROM satellite_passes WHERE incident_id = ? ORDER BY date ASC", (incident_id,))
            else:
                cursor.execute("SELECT * FROM satellite_passes ORDER BY date ASC")
            return [dict(r) for r in cursor.fetchall()]

    # --- Pipeline Logs Methods ---
    def get_pipeline_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pipeline_logs ORDER BY id DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]

    def add_pipeline_log(self, component: str, level: str, message: str, proof_token: Optional[str] = None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            cursor.execute("""
                INSERT INTO pipeline_logs (timestamp, component, level, message, proof_token)
                VALUES (?, ?, ?, ?, ?)
            """, (now, component, level, message, proof_token or "AUDIT-TOKEN"))
            conn.commit()

db_service = DatabaseService()
