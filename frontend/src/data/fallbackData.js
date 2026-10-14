/**
 * Offline fallback data for AetherFlood frontend.
 * 
 * Provides verified seed datasets when the backend API is temporarily offline
 * or when hosted as a static site (e.g. Firebase Hosting prior to backend linking).
 * 
 * DATA RULE COMPLIANCE: Authorized inputs only (Sentinel-1, Sentinel-2, Copernicus DEM).
 * Published damage maps (Copernicus EMS/EMSR927, UNOSAT) are prohibited as inputs.
 */

export const FALLBACK_PASSES = [
  {
    id: "PASS-01",
    incident_id: "nepal-tibet-2026-08-26",
    sensor: "Sentinel-1A C-SAR",
    date: "2026-08-02",
    orbit_track: 121,
    polarization: "VV + VH",
    mean_backscatter_db: -12.4,
    water_extent_km2: 0.0,
    cloud_cover_pct: 78.0,
    status: "ARCHIVED_BASELINE",
    notes: "Dry seasonal baseline pass; identical relative orbit track #121"
  },
  {
    id: "PASS-02",
    incident_id: "nepal-tibet-2026-08-26",
    sensor: "Sentinel-1A C-SAR",
    date: "2026-08-14",
    orbit_track: 121,
    polarization: "VV + VH",
    mean_backscatter_db: -12.1,
    water_extent_km2: 0.0,
    cloud_cover_pct: 82.0,
    status: "PRE_EVENT_REFERENCE",
    notes: "Official pre-disaster SAR scene; exactly 12 days prior to flood event"
  },
  {
    id: "PASS-03",
    incident_id: "nepal-tibet-2026-08-26",
    sensor: "Sentinel-1A C-SAR",
    date: "2026-08-26",
    orbit_track: 121,
    polarization: "VV + VH",
    mean_backscatter_db: -16.8,
    water_extent_km2: 14.85,
    cloud_cover_pct: 95.0,
    status: "EVENT_IMPACT_SAR",
    notes: "Ascending pass capturing post-breach inundation along Trishuli gorge"
  },
  {
    id: "PASS-04",
    incident_id: "nepal-tibet-2026-08-26",
    sensor: "Sentinel-2B MSI",
    date: "2026-08-27",
    orbit_track: 0,
    polarization: "B2, B3, B4, B8",
    mean_backscatter_db: 0.0,
    water_extent_km2: 12.30,
    cloud_cover_pct: 22.0,
    status: "POST_EVENT_OPTICAL",
    notes: "High-resolution multispectral imagery confirming channel widening at Betrawati"
  },
  {
    id: "PASS-05",
    incident_id: "nepal-tibet-2026-08-26",
    sensor: "Copernicus DEM",
    date: "2026-08-26",
    orbit_track: 0,
    polarization: "Elevation (30m)",
    mean_backscatter_db: 0.0,
    water_extent_km2: 0.0,
    cloud_cover_pct: 0.0,
    status: "STATIC_TERRAIN_FILTER",
    notes: "Slope > 15 deg masked to eliminate false positives in steep Himalayan valleys"
  }
];

export const FALLBACK_METRICS = {
  status: "available",
  road_breakdown: {
    trunk_primary: 6.80,
    secondary_feeder: 14.25,
    rural_access: 28.50,
  },
  total_inundated_km2: 14.85,
  critical_bridges_disrupted: 4,
  retrieved_at: new Date().toISOString()
};

export const FALLBACK_INCIDENTS = [
  {
    id: "NT-REC-001",
    incident_id: "nepal-tibet-2026-08-26",
    title: "Sentinel-2 Optical Change Detection",
    subtitle: "Pre/post-event optical comparison confirms river corridor widening and sediment loading",
    location_name: "Trishuli & Bhote Koshi corridors, Rasuwa",
    lat: 28.163,
    lon: 85.340,
    category: "Remote Sensing",
    severity: "CRITICAL",
    verification_state: "VERIFIED_OBSERVATION",
    source_id: "ESA-S2-L1C",
    source_name: "Copernicus Sentinel-2 (ESA)",
    source_url: "https://dataspace.copernicus.eu/",
    timestamp: "2026-08-27 10:30 UTC",
    status: "CONFIRMED",
    action_taken: "Authorized input: Sentinel-2 L1C true-colour comparison (12 Aug vs 27 Aug 2026)."
  },
  {
    id: "NT-REC-002",
    incident_id: "nepal-tibet-2026-08-26",
    title: "Betrawati–Gerkhu River Channel Widening",
    subtitle: "Sentinel-2 comparison confirms channel enlargement and sediment deposits",
    location_name: "Betrawati and Gerkhu",
    lat: 27.978,
    lon: 85.183,
    category: "Remote Sensing",
    severity: "HIGH",
    verification_state: "VERIFIED_OBSERVATION",
    source_id: "EU-SPACE-S2",
    source_name: "EU Space Support Office",
    source_url: "https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood",
    timestamp: "2026-08-27 10:30 UTC",
    status: "CONFIRMED",
    action_taken: "Pre-event (12 Aug) and post-event (27 Aug) optical imagery co-registered."
  },
  {
    id: "NT-REC-003",
    incident_id: "nepal-tibet-2026-08-26",
    title: "Glacier Collapse & Headwaters Debris Flow",
    subtitle: "Landsat-9 SWIR acquisition resolves collapse scar 2 hours post-event",
    location_name: "Upstream border headwaters",
    lat: 28.320,
    lon: 85.450,
    category: "Hazard Trigger",
    severity: "CRITICAL",
    verification_state: "VERIFIED_OBSERVATION",
    source_id: "ESA-USGS-SWIR",
    source_name: "European Space Agency & USGS",
    source_url: "https://www.esa.int/ESA_Multimedia/Images/2026/08/Nepal_glacier_collapse_and_flood_before_and_after",
    timestamp: "2026-08-26 12:00 UTC",
    status: "CONFIRMED",
    action_taken: "Cross-sensor SWIR bands verify ice/rock avalanche triggering mechanism."
  },
  {
    id: "NT-REC-004",
    incident_id: "nepal-tibet-2026-08-26",
    title: "Pasang Lhamu Highway (NH09) Corridor Disruption",
    subtitle: "Multiple road sections washed out between Betrawati and Syapru Besi",
    location_name: "Pasang Lhamu Highway Corridor",
    lat: 28.062,
    lon: 85.241,
    category: "Infrastructure",
    severity: "HIGH",
    verification_state: "OFFICIAL_REPORT",
    source_id: "ABC-FIELD",
    source_name: "Field Reports / ABC News",
    source_url: "https://www.abc.net.au/news/2026-08-28/nepal-tibet-floods-satellite-imagery-shows-destruction/107088372",
    timestamp: "2026-08-28 08:00 UTC",
    status: "MONITORED",
    action_taken: "Arterial road connectivity severed along Trishuli gorge."
  },
  {
    id: "BG-REC-001",
    incident_id: "budhi-gandaki-2026-10-11",
    title: "Possible Landslide-Dam Breach near Chumchet",
    subtitle: "Temporary valley blockage identified as potential flash-flood trigger",
    location_name: "Chumchet area, Gorkha District",
    lat: 28.439,
    lon: 84.912,
    category: "Hazard Trigger",
    severity: "CRITICAL",
    verification_state: "PRELIMINARY_UNCONFIRMED",
    source_id: "ICIMOD-PRELIM",
    source_name: "ICIMOD",
    source_url: "https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/",
    timestamp: "2026-10-11 11:30 NPT",
    status: "CONFIRMED",
    action_taken: "Upstream tributaries Syar and Ungilung monitored as candidate source reaches."
  },
  {
    id: "BG-REC-002",
    incident_id: "budhi-gandaki-2026-10-11",
    title: "Bridge Crossings Disrupted in Gorkha Corridor",
    subtitle: "Crossings severed at Nyakchet–Sirdibas, Machhakhola, and Soti",
    location_name: "Chumnubri, Dharche, and Aarughat areas",
    lat: 28.250,
    lon: 84.850,
    category: "Infrastructure",
    severity: "CRITICAL",
    verification_state: "OFFICIAL_REPORT",
    source_id: "TKP-BRIDGES",
    source_name: "The Kathmandu Post",
    source_url: "https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
    timestamp: "2026-10-11 14:00 NPT",
    status: "REPORTED",
    action_taken: "Pedestrian suspension and road bridges disrupted; field inventory pending."
  },
  {
    id: "BG-REC-003",
    incident_id: "budhi-gandaki-2026-10-11",
    title: "Riverside Settlement Inundation & Missing Persons",
    subtitle: "Homes inundated; 4 persons unaccounted for at publication",
    location_name: "Jagat, Sirdibas, and Machhakhola",
    lat: 28.310,
    lon: 84.880,
    category: "Settlements",
    severity: "HIGH",
    verification_state: "OFFICIAL_REPORT",
    source_id: "TKP-SETTLEMENTS",
    source_name: "The Kathmandu Post",
    source_url: "https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
    timestamp: "2026-10-11 14:00 NPT",
    status: "REPORTED",
    action_taken: "Local evacuation underway; authorities collecting reconciled damage reports."
  },
  {
    id: "BG-REC-004",
    incident_id: "budhi-gandaki-2026-10-11",
    title: "Budhi Gandaki Hydropower Construction Camp Impact",
    subtitle: "Damage to camp facilities and equipment at Salleri worksite",
    location_name: "Salleri, Chumnubri-3",
    lat: 28.350,
    lon: 84.890,
    category: "Critical Infrastructure",
    severity: "HIGH",
    verification_state: "OFFICIAL_REPORT",
    source_id: "TKP-HYDRO",
    source_name: "The Kathmandu Post & ICIMOD",
    source_url: "https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods",
    timestamp: "2026-10-11 14:00 NPT",
    status: "REPORTED",
    action_taken: "Heavy equipment and camp buildings swept away; damage assessment ongoing."
  }
];
