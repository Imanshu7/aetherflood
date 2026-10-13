"""
Canonical Incident Registry for AetherFlood
Strict separation between:
- Incident A: Historical Nepal–Tibet Floods (26 August 2026, Rasuwa / Northern Nepal)
- Incident B: Developing Budhi Gandaki Flood (11 October 2026, Gorkha District, Nepal)

Every metric and statement is source-attributed. No fabricated statistics.

DATA-RULE COMPLIANCE: Copernicus EMS (incl. EMSR927), UNOSAT and other published
damage maps are prohibited as inputs under the competition rules. They are NOT
represented here as verified facts, metrics, or sub-records and are never injected
into the copilot's grounding context. They may only be referenced post-hoc to
check results. Authorized inputs are Sentinel-1, Sentinel-2, Copernicus DEM, and
pre-event OpenStreetMap.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class SourcedFact(BaseModel):
    statement: str
    source_name: str
    source_url: str
    observation_date: str
    verification_status: str # "VERIFIED_OBSERVATION", "OFFICIAL_REPORT", "PRELIMINARY_UNCONFIRMED"

class SourcedMetric(BaseModel):
    name: str
    value: Any
    unit: Optional[str] = None
    formula_or_method: Optional[str] = None
    source: str
    status: str # "VERIFIED", "CALCULATED", "UNAVAILABLE"
    limitations: Optional[str] = None

class IncidentRecord(BaseModel):
    id: str
    incident_id: str
    title: str
    subtitle: str
    location_name: str
    lat: float
    lon: float
    category: str
    severity: str
    verification_state: str
    source_id: str
    source_name: str
    source_url: str
    timestamp: str
    status: str # "REPORTED", "CONFIRMED", "MONITORED", "RESOLVED"
    action_note: Optional[str] = None

class CanonicalIncident(BaseModel):
    id: str
    title: str
    short_title: str
    event_date: str
    region: str
    hazard_type: str
    incident_type: str # "historical" or "developing"
    status_label: str
    verification_state: str
    center_coords: List[float] # [lat, lon]
    summary: str
    sources: List[Dict[str, Any]]
    verified_facts: List[SourcedFact]
    metrics: List[SourcedMetric]
    data_gaps: List[str]
    uncertainties: List[str]
    satellite_pairs: List[Dict[str, Any]]
    sub_records: List[IncidentRecord]

# ---------------------------------------------------------------------------
# INCIDENT A: Historical Nepal–Tibet Flood (26 August 2026)
# ---------------------------------------------------------------------------
INCIDENT_A = CanonicalIncident(
    id="nepal-tibet-2026-08-26",
    title="Nepal–Tibet Floods",
    short_title="Historical Nepal–Tibet Flood",
    event_date="2026-08-26",
    region="Rasuwa District & Northern Nepal Border Corridor",
    hazard_type="Flash Flood / Glacial Lake Outburst Flood (GLOF) & Debris Torrent",
    incident_type="historical",
    status_label="Historical Incident (Retrospective Geospatial Analysis)",
    verification_state="VERIFIED_OBSERVATIONS",
    center_coords=[28.163, 85.340],
    summary=(
        "On 26 August 2026, a catastrophic flash flood and debris flow occurred along the "
        "Trishuli and Bhote Koshi river corridors in Rasuwa District, northern Nepal, near the "
        "Tibet border. Multispectral satellite imagery from Copernicus Sentinel-2 and Landsat-9 "
        "captured substantial river channel widening, sediment deposits, and headwaters collapse."
    ),
    sources=[
        {
            "id": "eu-space",
            "name": "EU Space Support Office / Copernicus Sentinel-2",
            "url": "https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood",
            "date": "2026-08-27",
            "type": "Optical Earth Observation Comparison"
        },
        {
            "id": "esa-sentinel2",
            "name": "European Space Agency (ESA) Sentinel-2",
            "url": "https://www.esa.int/ESA_Multimedia/Images/2026/08/Sentinel-2_captures_before_and_after_Nepal_flash_flood",
            "date": "2026-08-27",
            "type": "Optical Earth Observation Comparison"
        },
        {
            "id": "esa-glacier",
            "name": "ESA / USGS Landsat-9 & Sentinel-2 Glacier Analysis",
            "url": "https://www.esa.int/ESA_Multimedia/Images/2026/08/Nepal_glacier_collapse_and_flood_before_and_after",
            "date": "2026-08-26",
            "type": "SWIR False-Colour Glacier Collapse Analysis"
        },
        {
            "id": "abc-news",
            "name": "ABC News Satellite Investigation",
            "url": "https://www.abc.net.au/news/2026-08-28/nepal-tibet-floods-satellite-imagery-shows-destruction/107088372",
            "date": "2026-08-28",
            "type": "Commercial Satellite Reporting (Planet / Maxar)"
        }
    ],
    verified_facts=[
        SourcedFact(
            statement="Copernicus Sentinel-2 imagery acquired on 27 August 2026 compared to 12 August 2026 shows clear river-channel widening and alluvial sediment deposition at Betrawati and Gerkhu.",
            source_name="EU Space Support Office",
            source_url="https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood",
            observation_date="2026-08-27",
            verification_status="VERIFIED_OBSERVATION"
        ),
        SourcedFact(
            statement="US Landsat-9 captured shortwave-infrared imagery on 26 August 2026 ~2 hours post-event, resolving the headwaters glacier/slope collapse scar and debris path when compared to Sentinel-2 pre-event imagery from 24 August 2026.",
            source_name="European Space Agency & USGS",
            source_url="https://www.esa.int/ESA_Multimedia/Images/2026/08/Nepal_glacier_collapse_and_flood_before_and_after",
            observation_date="2026-08-26",
            verification_status="VERIFIED_OBSERVATION"
        ),
        SourcedFact(
            statement="Pasang Lhamu Highway (NH09) riverbank corridor between Betrawati and Syapru Besi suffered multiple washout cuts and debris blockages.",
            source_name="Field reporting / ABC News",
            source_url="https://www.abc.net.au/news/2026-08-28/nepal-tibet-floods-satellite-imagery-shows-destruction/107088372",
            observation_date="2026-08-28",
            verification_status="OFFICIAL_REPORT"
        )
    ],
    metrics=[
        SourcedMetric(
            name="Copernicus DEM Terrain Mask",
            value="WorldDEM-30",
            unit="30m raster",
            formula_or_method="Copernicus 30m Global DEM physical slope masking (<= 18.0° threshold)",
            source="Copernicus WorldDEM-30 (Allowed Input)",
            status="VERIFIED",
            limitations="Physical terrain slope conditioning eliminating mountain radar layover/shadow artifacts."
        ),
        SourcedMetric(
            name="Verified Satellite Image Pairs",
            value=3,
            unit="pairs",
            formula_or_method="Curated and co-registered optical / SWIR image pairs with confirmed dates and provenance",
            source="Copernicus Sentinel-2, ESA, USGS Landsat-9",
            status="VERIFIED",
            limitations="Cover Betrawati/Gerkhu, Trishuli regional corridor, and glacier headwaters."
        ),
        SourcedMetric(
            name="Automated Inundation Extent",
            value=None,
            unit="km²",
            formula_or_method=None,
            source="AetherFlood Analysis Pipeline",
            status="UNAVAILABLE",
            limitations="No calibrated SAR water mask or raster DEM co-registration array is currently connected."
        )
    ],
    data_gaps=[
        "No live river stream gauge telemetry is active for this historical retrospective.",
        "Building/flood damage polygons from published damage maps (e.g. Copernicus EMS, UNOSAT) "
        "are prohibited as inputs under the competition rules and are not represented here; "
        "damage assessments are manual cartographic gradings, not autonomous detector measurements.",
        "Commercial Planet/Maxar imagery referenced by news media is not redistributable under open licenses."
    ],
    uncertainties=[
        "Monsoon cloud cover partially obscures high-mountain valley sections in post-event optical imagery.",
        "Glacier headwaters comparison uses differing sensors (Sentinel-2 24 Aug vs Landsat-9 26 Aug) with different spatial resolutions and solar angles."
    ],
    satellite_pairs=[
        {
            "id": "betrawati-gerkhu",
            "title": "Betrawati and Gerkhu river channel",
            "location": "Betrawati and Gerkhu, Nepal",
            "beforeDate": "12 August 2026",
            "afterDate": "27 August 2026",
            "sensor": "Copernicus Sentinel-2",
            "source": "EU Space Support Office"
        },
        {
            "id": "trishuli-regional",
            "title": "Trishuli River corridor · regional context",
            "location": "Trishuli River corridor, Nepal",
            "beforeDate": "12 August 2026",
            "afterDate": "27 August 2026",
            "sensor": "Copernicus Sentinel-2",
            "source": "European Space Agency"
        },
        {
            "id": "glacier-headwaters",
            "title": "Glacier collapse & upstream headwaters",
            "location": "Headwaters catchment, Northern Nepal / Tibet border",
            "beforeDate": "24 August 2026",
            "afterDate": "26 August 2026",
            "sensor": "Copernicus Sentinel-2 & US Landsat-9 (SWIR)",
            "source": "European Space Agency & USGS"
        }
    ],
    sub_records=[
        IncidentRecord(
            id="NT-REC-001",
            incident_id="nepal-tibet-2026-08-26",
            title="Sentinel-2 Optical Change Detection",
            subtitle="Pre/post-event optical comparison confirms river corridor widening and sediment loading",
            location_name="Trishuli & Bhote Koshi corridors, Rasuwa",
            lat=28.163,
            lon=85.340,
            category="Remote Sensing",
            severity="CRITICAL",
            verification_state="VERIFIED_OBSERVATION",
            source_id="ESA-S2-L1C",
            source_name="Copernicus Sentinel-2 (ESA)",
            source_url="https://dataspace.copernicus.eu/",
            timestamp="2026-08-27 10:30 UTC",
            status="CONFIRMED",
            action_note="Authorized input: Sentinel-2 L1C true-colour comparison (12 Aug vs 27 Aug 2026)."
        ),
        IncidentRecord(
            id="NT-REC-002",
            incident_id="nepal-tibet-2026-08-26",
            title="Betrawati–Gerkhu River Channel Widening",
            subtitle="Sentinel-2 comparison confirms channel enlargement and sediment deposits",
            location_name="Betrawati and Gerkhu",
            lat=27.978,
            lon=85.183,
            category="Remote Sensing",
            severity="HIGH",
            verification_state="VERIFIED_OBSERVATION",
            source_id="EU-SPACE-S2",
            source_name="EU Space Support Office",
            source_url="https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood",
            timestamp="2026-08-27 10:30 UTC",
            status="CONFIRMED",
            action_note="Pre-event (12 Aug) and post-event (27 Aug) optical imagery co-registered."
        ),
        IncidentRecord(
            id="NT-REC-003",
            incident_id="nepal-tibet-2026-08-26",
            title="Glacier Collapse & Headwaters Debris Flow",
            subtitle="Landsat-9 SWIR acquisition resolves collapse scar 2 hours post-event",
            location_name="Upstream border headwaters",
            lat=28.320,
            lon=85.450,
            category="Hazard Trigger",
            severity="CRITICAL",
            verification_state="VERIFIED_OBSERVATION",
            source_id="ESA-USGS-SWIR",
            source_name="European Space Agency & USGS",
            source_url="https://www.esa.int/ESA_Multimedia/Images/2026/08/Nepal_glacier_collapse_and_flood_before_and_after",
            timestamp="2026-08-26 12:00 UTC",
            status="CONFIRMED",
            action_note="Cross-sensor SWIR bands verify ice/rock avalanche triggering mechanism."
        ),
        IncidentRecord(
            id="NT-REC-004",
            incident_id="nepal-tibet-2026-08-26",
            title="Pasang Lhamu Highway (NH09) Corridor Disruption",
            subtitle="Multiple road sections washed out between Betrawati and Syapru Besi",
            location_name="Pasang Lhamu Highway Corridor",
            lat=28.062,
            lon=85.241,
            category="Infrastructure",
            severity="HIGH",
            verification_state="OFFICIAL_REPORT",
            source_id="ABC-FIELD",
            source_name="Field Reports / ABC News",
            source_url="https://www.abc.net.au/news/2026-08-28/nepal-tibet-floods-satellite-imagery-shows-destruction/107088372",
            timestamp="2026-08-28 08:00 UTC",
            status="MONITORED",
            action_note="Arterial road connectivity severed along Trishuli gorge."
        )
    ]
)

# ---------------------------------------------------------------------------
# INCIDENT B: Developing Budhi Gandaki Flood (11 October 2026)
# ---------------------------------------------------------------------------
INCIDENT_B = CanonicalIncident(
    id="budhi-gandaki-2026-10-11",
    title="Budhi Gandaki Flood",
    short_title="Developing Budhi Gandaki Flood",
    event_date="2026-10-11",
    region="Gorkha District, Gandaki Province, Nepal",
    hazard_type="Flash Flood / Suspected Landslide-Dam Breach",
    incident_type="developing",
    status_label="Developing Incident (Monitored from Verified Source Reports)",
    verification_state="PRELIMINARY_SOURCE_REVIEWS",
    center_coords=[28.439, 84.912],
    summary=(
        "On 11 October 2026, a flash flood occurred along the Budhi Gandaki river corridor in "
        "Gorkha District. Preliminary reporting from ICIMOD identified a possible temporary "
        "landslide blockage breach near Chumchet as a potential trigger. The Kathmandu Post "
        "reported houses inundated or swept away and multiple bridge washouts across Chumnubri, "
        "Dharche, and Aarughat rural municipalities. Four persons were reported unaccounted for, "
        "with casualty totals unconfirmed by authorities at publication."
    ),
    sources=[
        {
            "id": "icimod",
            "name": "ICIMOD Preliminary Assessment",
            "url": "https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
            "date": "2026-10-11",
            "type": "Scientific Agency Press Release & Assessment"
        },
        {
            "id": "kathmandu-post",
            "name": "The Kathmandu Post",
            "url": "https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
            "date": "2026-10-11",
            "type": "National Newspaper Investigation"
        },
        {
            "id": "nasa-gibs",
            "name": "NASA EOSDIS GIBS (MODIS Terra True Colour)",
            "url": "https://earthdata.nasa.gov/data/tools/gibs",
            "date": "2026-10-12",
            "type": "Coarse 250m Daily Context Imagery"
        }
    ],
    verified_facts=[
        SourcedFact(
            statement="ICIMOD reported that a temporary landslide blockage failure near Chumchet was identified as a possible trigger for the 11 October Budhi Gandaki flash flood.",
            source_name="ICIMOD",
            source_url="https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
            observation_date="2026-10-11",
            verification_status="OFFICIAL_REPORT"
        ),
        SourcedFact(
            statement="The Kathmandu Post reported 4 people unaccounted for on 11 October; authorities had not confirmed casualty counts at time of reporting.",
            source_name="The Kathmandu Post",
            source_url="https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
            observation_date="2026-10-11",
            verification_status="OFFICIAL_REPORT"
        ),
        SourcedFact(
            statement="Bridge losses were reported at Nyakchet–Sirdibas, Machhakhola–Kerauja, Soti, and the Arughat connection between Gorkha and Dhading.",
            source_name="The Kathmandu Post",
            source_url="https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
            observation_date="2026-10-11",
            verification_status="OFFICIAL_REPORT"
        ),
        SourcedFact(
            statement="Damage to a construction camp and equipment at the Budhi Gandaki hydropower project was reported at Salleri (Chumnubri-3).",
            source_name="ICIMOD & The Kathmandu Post",
            source_url="https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
            observation_date="2026-10-11",
            verification_status="OFFICIAL_REPORT"
        )
    ],
    metrics=[
        SourcedMetric(
            name="Reported Unaccounted Individuals",
            value=4,
            unit="persons",
            formula_or_method="Cited from preliminary dispatch by The Kathmandu Post",
            source="The Kathmandu Post (11 Oct 2026)",
            status="VERIFIED",
            limitations="Dated preliminary report; authorities had not verified casualties at publication."
        ),
        SourcedMetric(
            name="Confirmed Casualties",
            value=None,
            unit="persons",
            formula_or_method=None,
            source="Local District Administration Office",
            status="UNAVAILABLE",
            limitations="No official reconciled casualty count released by responsible agencies."
        ),
        SourcedMetric(
            name="Event-Specific Satellite Damage Assessment",
            value=None,
            unit="km²",
            formula_or_method=None,
            source="AetherFlood Analysis Pipeline",
            status="UNAVAILABLE",
            limitations="No high-resolution Sentinel-1 SAR or Sentinel-2 optical cloud-free post-event scene available."
        )
    ],
    data_gaps=[
        "No verified live sensor or gauge feed is connected for the Budhi Gandaki corridor.",
        "Total casualty and displacement figures remain unconfirmed by disaster management authorities.",
        "A complete, reconciled bridge and road damage inventory has not been published.",
        "Coarse 250m NASA MODIS tiles cannot resolve local flood boundaries or building damages."
    ],
    uncertainties=[
        "Trigger mechanism remains subject to geological and field verification.",
        "Published reports reflect conditions as of 11 October 2026, reviewed 12 October; ongoing changes are not automatically tracked."
    ],
    satellite_pairs=[],
    sub_records=[
        IncidentRecord(
            id="BG-REC-001",
            incident_id="budhi-gandaki-2026-10-11",
            title="Suspected Landslide-Dam Breach near Chumchet",
            subtitle="ICIMOD identified temporary blockage failure as likely flood trigger",
            location_name="Chumchet, Chumnubri Rural Municipality",
            lat=28.439,
            lon=84.912,
            category="Hazard Trigger",
            severity="CRITICAL",
            verification_state="PRELIMINARY_UNCONFIRMED",
            source_id="ICIMOD-PRELIM",
            source_name="ICIMOD",
            source_url="https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
            timestamp="2026-10-11 11:30 NPT",
            status="CONFIRMED",
            action_note="Upstream tributaries Syar and Ungilung monitored as candidate source reaches."
        ),
        IncidentRecord(
            id="BG-REC-002",
            incident_id="budhi-gandaki-2026-10-11",
            title="Bridge Crossings Disrupted in Gorkha Corridor",
            subtitle="Crossings severed at Nyakchet–Sirdibas, Machhakhola, and Soti",
            location_name="Chumnubri, Dharche, and Aarughat areas",
            lat=28.250,
            lon=84.850,
            category="Infrastructure",
            severity="CRITICAL",
            verification_state="OFFICIAL_REPORT",
            source_id="TKP-BRIDGES",
            source_name="The Kathmandu Post",
            source_url="https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
            timestamp="2026-10-11 14:00 NPT",
            status="REPORTED",
            action_note="Pedestrian suspension and road bridges disrupted; field inventory pending."
        ),
        IncidentRecord(
            id="BG-REC-003",
            incident_id="budhi-gandaki-2026-10-11",
            title="Riverside Settlement Inundation & Missing Persons",
            subtitle="Homes inundated; 4 persons unaccounted for at publication",
            location_name="Jagat, Sirdibas, and Machhakhola",
            lat=28.310,
            lon=84.880,
            category="Settlements",
            severity="HIGH",
            verification_state="OFFICIAL_REPORT",
            source_id="TKP-SETTLEMENTS",
            source_name="The Kathmandu Post",
            source_url="https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
            timestamp="2026-10-11 14:00 NPT",
            status="REPORTED",
            action_note="Local evacuation underway; authorities collecting reconciled damage reports."
        ),
        IncidentRecord(
            id="BG-REC-004",
            incident_id="budhi-gandaki-2026-10-11",
            title="Budhi Gandaki Hydropower Construction Camp Impact",
            subtitle="Damage to camp facilities and equipment at Salleri worksite",
            location_name="Salleri, Chumnubri-3",
            lat=28.350,
            lon=84.890,
            category="Critical Infrastructure",
            severity="HIGH",
            verification_state="OFFICIAL_REPORT",
            source_id="ICIMOD-HYDRO",
            source_name="ICIMOD & The Kathmandu Post",
            source_url="https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
            timestamp="2026-10-11 11:30 NPT",
            status="REPORTED",
            action_note="Worksite equipment inundated; full loss assessment in progress."
        )
    ]
)

CANONICAL_INCIDENTS = {
    INCIDENT_A.id: INCIDENT_A,
    INCIDENT_B.id: INCIDENT_B,
}

def get_canonical_incident(incident_id: str) -> Optional[CanonicalIncident]:
    return CANONICAL_INCIDENTS.get(incident_id)

def list_canonical_incidents() -> List[CanonicalIncident]:
    return list(CANONICAL_INCIDENTS.values())
