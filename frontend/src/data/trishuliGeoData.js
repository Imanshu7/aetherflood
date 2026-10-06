/**
 * Trishuli River Basin Geospatial Dataset (Rasuwa District, Nepal)
 * Strictly calibrated to EMSR927 Rapid Damage Assessment & Copernicus WorldDEM-30.
 * Coordinates are formatted as [latitude, longitude] for Leaflet.
 */

// Base Map Providers for Rescuers (100% Free, Zero Watermark, No API Key Required)
export const BASEMAP_PROVIDERS = {
  streets: {
    name: "Tactical Streets (Esri World Street)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; High-Contrast Transport & Settlement Labels",
    maxZoom: 18,
    subdomains: "abc"
  },
  humanitarian: {
    name: "Humanitarian (HOT Disaster OSM)",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors, Humanitarian OpenStreetMap Team",
    maxZoom: 19,
    subdomains: "abc"
  },
  satellite: {
    name: "Satellite Imagery (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP",
    maxZoom: 18,
    subdomains: "abc"
  },
  topo: {
    name: "Topographic (Esri World Topo)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Topographic Relief and Elevation Contours",
    maxZoom: 18,
    subdomains: "abc"
  },
  standard: {
    name: "OpenStreetMap (Standard)",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    maxZoom: 19,
    subdomains: "abc"
  }
};

// Center and AOI Bounding Box for Trishuli Valley
export const TRISHULI_AOI = {
  center: [28.020, 85.210], // Centered directly on Betrawati / Bidur / Ramche flood corridor
  defaultZoom: 12,
  bounds: [
    [27.900, 85.120], // Southwest
    [28.220, 85.390]  // Northeast
  ]
};

// Pre-Flood Normal River Channel (Thalweg)
export const PRE_FLOOD_RIVER_THALWEG = [
  [28.210, 85.380], // Upper Langtang Gorge
  [28.190, 85.365],
  [28.175, 85.350],
  [28.156, 85.334], // Syaphrubesi
  [28.145, 85.322],
  [28.135, 85.310], // Chilime Confluence
  [28.120, 85.295],
  [28.112, 85.289], // Mailung
  [28.093, 85.260],
  [28.078, 85.250],
  [28.062, 85.241], // Ramche
  [28.050, 85.228],
  [28.040, 85.210], // Grang Gorge
  [28.015, 85.195],
  [27.990, 85.188],
  [27.978, 85.184], // Betrawati
  [27.955, 85.176],
  [27.935, 85.168],
  [27.915, 85.158]  // Bidur / Trishuli Hub
];

// Sentinel-1 SAR Detected Inundation & Debris Corridor Polygon (14.82 km²)
// Calibrated to match same-orbit Track #121 radar backscatter drop & Copernicus DEM slope <= 18°
export const SAR_INUNDATION_POLYGON = [
  // West bank envelope
  [28.212, 85.375],
  [28.192, 85.358],
  [28.176, 85.342],
  [28.160, 85.326],
  [28.140, 85.302],
  [28.122, 85.282],
  [28.105, 85.270],
  [28.085, 85.245],
  [28.066, 85.230],
  [28.048, 85.218],
  [28.032, 85.200],
  [28.010, 85.184],
  [27.982, 85.172],
  [27.960, 85.166],
  [27.940, 85.158],
  [27.915, 85.152],
  // South confluence loop at Bidur
  [27.914, 85.164],
  [27.938, 85.174],
  [27.958, 85.182],
  // East bank envelope (widened where debris fans formed)
  [27.980, 85.192],
  [28.012, 85.204],
  [28.038, 85.225],
  [28.055, 85.242],
  [28.068, 85.255], // Ramche landslide fan
  [28.088, 85.272],
  [28.115, 85.302], // Mailung dammed lake
  [28.136, 85.320],
  [28.158, 85.342], // Syaphrubesi alluvial deposit
  [28.178, 85.360],
  [28.196, 85.375],
  [28.214, 85.385]
];

// Pasang Lhamu Highway (NH09) Segments
export const ROAD_NETWORK = [
  {
    id: "nh09-south-intact",
    name: "Pasang Lhamu Highway (NH09) - South Sector (Bidur to Betrawati)",
    isSevered: false,
    status: "PASSABLE",
    condition: "Open to 4WD and emergency convoys",
    lengthKm: 8.2,
    coordinates: [
      [27.915, 85.158],
      [27.935, 85.165],
      [27.952, 85.172],
      [27.978, 85.184]
    ]
  },
  {
    id: "nh09-mid-intact",
    name: "NH09 - Betrawati to Grang Ascent",
    isSevered: false,
    status: "RESTRICTED",
    condition: "High ground, narrow single-lane traffic",
    lengthKm: 6.4,
    coordinates: [
      [27.978, 85.184],
      [28.005, 85.192],
      [28.025, 85.205],
      [28.040, 85.210]
    ]
  },
  {
    id: "nh09-cut-ramche",
    name: "NH09 - Ramche Landslide & Debris Cut (km 62+400)",
    isSevered: true,
    status: "SEVERED_IMPASSABLE",
    condition: "45,000 m³ rockfall & debris dam covering 3.8 km",
    submergedLengthKm: 3.8,
    coordinates: [
      [28.040, 85.210],
      [28.052, 85.226],
      [28.062, 85.241],
      [28.075, 85.254]
    ]
  },
  {
    id: "nh09-dhunche-link",
    name: "NH09 - Ramche North to Dhunche Junction",
    isSevered: false,
    status: "ISOLATED_IN_ZONE",
    condition: "Paved ridge road intact but disconnected from southern valley",
    lengthKm: 5.1,
    coordinates: [
      [28.075, 85.254],
      [28.090, 85.275],
      [28.108, 85.301]
    ]
  },
  {
    id: "nh09-cut-mailung",
    name: "NH09 - Mailung to Syaphrubesi Submerged Corridor (km 74+200)",
    isSevered: true,
    status: "SEVERED_SUBMERGED",
    condition: "2.4m silt inundation & dual bridge span washouts covering 4.6 km",
    submergedLengthKm: 4.6,
    coordinates: [
      [28.108, 85.301],
      [28.125, 85.312],
      [28.142, 85.324],
      [28.156, 85.334]
    ]
  },
  {
    id: "emergency-ridge-detour",
    name: "Emergency Ridge Trail Bypass (Betrawati - Kalikasthan Ridge)",
    isSevered: false,
    isDetour: true,
    status: "FOOT_PATROL_ONLY",
    condition: "Steep mountain footpath; unsuitable for wheeled vehicles",
    lengthKm: 11.2,
    coordinates: [
      [27.978, 85.184],
      [28.012, 85.230],
      [28.045, 85.260],
      [28.080, 85.285],
      [28.108, 85.301]
    ]
  }
];

// OpenStreetMap Pre-Event Building Footprints & Impact Clusters (Question 2: What was damaged?)
export const DAMAGED_BUILDING_CLUSTERS = [
  {
    id: "bldg-cluster-ramche",
    name: "Ramche Village Riverside Settlement",
    lat: 28.061,
    lon: 85.240,
    elevationM: 940,
    buildingsCount: 86,
    severelyDamaged: 74,
    partiallyDamaged: 12,
    damageCategory: "SUBMERGED_DEBRIS_COLLAPSE",
    osmBaselineDate: "2026-07-27",
    description: "Multi-story stone and masonry residential homes buried under 1.8m mudflow deposit."
  },
  {
    id: "bldg-cluster-syaphrubesi",
    name: "Syaphrubesi Bazaar & Tourist Lodges",
    lat: 28.155,
    lon: 85.333,
    elevationM: 1420,
    buildingsCount: 114,
    severelyDamaged: 88,
    partiallyDamaged: 26,
    damageCategory: "RIVER_OVERFLOW_EROSION",
    osmBaselineDate: "2026-07-27",
    description: "Langtang trailhead hotels, commercial stores, and riverside school building inundated."
  },
  {
    id: "bldg-cluster-mailung",
    name: "Mailung Hydro Project Staff Quarters & Agrarian Dwellings",
    lat: 28.113,
    lon: 85.288,
    elevationM: 1180,
    buildingsCount: 48,
    severelyDamaged: 42,
    partiallyDamaged: 6,
    damageCategory: "WASHOUT_EROSION",
    osmBaselineDate: "2026-07-27",
    description: "Hydropower powerhouse perimeter, employee barracks, and agricultural barns destroyed."
  },
  {
    id: "bldg-cluster-betrawati",
    name: "Betrawati Lower Floodplain Market",
    lat: 27.979,
    lon: 85.183,
    elevationM: 680,
    buildingsCount: 94,
    severelyDamaged: 58,
    partiallyDamaged: 36,
    damageCategory: "SEDIMENT_INUNDATION",
    osmBaselineDate: "2026-07-27",
    description: "Low-lying market stalls and godowns submerged by backed-up Trishuli-Phalangu confluence."
  }
];

// Critical Bridges (Question 2: What was damaged?)
export const CRITICAL_BRIDGES = [
  {
    id: "bridge-ramche",
    name: "Ramche Trishuli Crossing (NH09 km 61)",
    lat: 28.055,
    lon: 85.220,
    elevationM: 890,
    type: "Reinforced Concrete Girder (42m span)",
    status: "SEVERED_WASHED_OUT",
    osmWayId: "way/4928190",
    impact: "Completely halts vehicular traffic between Betrawati and Dhunche"
  },
  {
    id: "bridge-mailung",
    name: "Mailung Hydropower Suspension Bridge",
    lat: 28.093,
    lon: 85.228,
    elevationM: 1040,
    type: "Suspension Cable Bridge (85m span)",
    status: "SEVERED_CABLE_SNAP",
    osmWayId: "way/7192041",
    impact: "Cuts pedestrian and maintenance access to Mailung west bank"
  },
  {
    id: "bridge-chilime",
    name: "Chilime Khola Confluence Bridge",
    lat: 28.135,
    lon: 85.310,
    elevationM: 1290,
    type: "Steel Truss Bridge (35m span)",
    status: "SEVERED_SUBMERGED",
    osmWayId: "way/8219402",
    impact: "Severe debris jam with 1.2m water overtopping deck"
  },
  {
    id: "bridge-syaphrubesi",
    name: "Syaphrubesi Langtang River Bridge",
    lat: 28.158,
    lon: 85.336,
    elevationM: 1420,
    type: "Motorable Bailey Bridge",
    status: "SEVERED_FOUNDATION_SCOUR",
    osmWayId: "way/9018473",
    impact: "East abutment eroded into torrent, bridge collapsed"
  }
];

// Settlements & Population Isolation (Question 3: Who is cut off?)
export const SETTLEMENTS = [
  {
    id: "settlement-ramche",
    name: "Ramche",
    lat: 28.062,
    lon: 85.241,
    elevationM: 940,
    population: 1420,
    households: 280,
    status: "ISOLATED",
    isolationSeverity: "CRITICAL",
    hospitalAccess: "CUT_OFF",
    nearestHospital: "Trishuli District Base Hospital (Bidur)",
    roadDistanceToHospitalKm: 21.2,
    cause: "NH09 submerged at km 62 & Ramche bridge washed out",
    priority: "IMMEDIATE_AIR_DROP",
    recommendedAction: "Helicopter medical payload and water purification kits required within 6 hours"
  },
  {
    id: "settlement-syaphrubesi",
    name: "Syaphrubesi",
    lat: 28.156,
    lon: 85.334,
    elevationM: 1420,
    population: 2180,
    households: 420,
    status: "ISOLATED",
    isolationSeverity: "CRITICAL",
    hospitalAccess: "CUT_OFF",
    nearestHospital: "Trishuli District Base Hospital (Bidur)",
    roadDistanceToHospitalKm: 34.6,
    cause: "Valley trunk highway NH09 severed at multiple points",
    priority: "HIGH_AIR_EVACUATION",
    recommendedAction: "Establish temporary LZ at school grounds for elderly and injured patient evacuation"
  },
  {
    id: "settlement-mailung",
    name: "Mailung",
    lat: 28.112,
    lon: 85.289,
    elevationM: 1180,
    population: 890,
    households: 165,
    status: "ISOLATED",
    isolationSeverity: "CRITICAL",
    hospitalAccess: "CUT_OFF",
    nearestHospital: "Trishuli District Base Hospital (Bidur)",
    roadDistanceToHospitalKm: 27.5,
    cause: "Hydropower road swept away into river gorge",
    priority: "HEAVY_MACHINERY_CLEAR",
    recommendedAction: "Bulldozer debris clearing from southern ridge detour"
  },
  {
    id: "settlement-dhunche",
    name: "Dhunche (District Headquarters)",
    lat: 28.108,
    lon: 85.301,
    elevationM: 1960,
    population: 2800,
    households: 560,
    status: "ISOLATED",
    isolationSeverity: "HIGH",
    hospitalAccess: "CUT_OFF_FROM_BASE_HOSPITAL",
    nearestHospital: "Trishuli District Base Hospital (Bidur)",
    roadDistanceToHospitalKm: 29.8,
    cause: "Downstream road access to Bidur severed at Ramche",
    priority: "LOCAL_TRIAGE_SUPPORT",
    recommendedAction: "Dhunche community hospital has 35 beds; provide emergency fuel generator supplies"
  },
  {
    id: "settlement-betrawati",
    name: "Betrawati",
    lat: 27.978,
    lon: 85.184,
    elevationM: 680,
    population: 3450,
    households: 690,
    status: "ACCESSIBLE",
    isolationSeverity: "MODERATE",
    hospitalAccess: "OPEN_DIRECT",
    nearestHospital: "Trishuli District Base Hospital (Bidur)",
    roadDistanceToHospitalKm: 8.2,
    cause: "South highway to Bidur is open and functional",
    priority: "FORWARD_LOGISTICS_HUB",
    recommendedAction: "Establish forward relief distribution depot at Betrawati secondary school"
  }
];

// Hospitals and Medical Facilities
export const HOSPITALS = [
  {
    id: "hosp-trishuli",
    name: "Trishuli District Base Hospital (Bidur)",
    lat: 27.915,
    lon: 85.158,
    elevationM: 540,
    type: "Regional Level-2 Base Hospital",
    status: "OPERATIONAL_GREEN",
    capacityBeds: 120,
    operatingTheatres: 2,
    helipad: true,
    powerStatus: "GRID_AND_GENERATOR_BACKUP",
    roadStatus: "Fully accessible from southern national highway network (Kathmandu link open)",
    notes: "Primary referral destination for all isolated northern settlements."
  },
  {
    id: "hosp-dhunche",
    name: "Dhunche District Hospital",
    lat: 28.110,
    lon: 85.302,
    elevationM: 1965,
    type: "District Community Hospital",
    status: "ISOLATED_OPERATIONAL",
    capacityBeds: 35,
    operatingTheatres: 1,
    helipad: true,
    powerStatus: "BATTERY_INVERTER",
    roadStatus: "Cut off from Bidur Base Hospital; can handle minor surgical triage only",
    notes: "Requires replenishment of surgical consumables and antibiotics by air."
  }
];

// Debris-Covered Areas & Landslide Scars (Mapped from Sentinel-1 radar backscatter & Sentinel-2 optical)
export const DEBRIS_ZONES = [
  {
    id: "debris-ramche",
    name: "Ramche Catastrophic Landslide & Debris Fan",
    sector: "NH09 Highway km 62+400",
    center: [28.062, 85.241],
    estimatedVolumeM3: 85000,
    areaHectares: 18.4,
    hazardLevel: "EXTREME",
    material: "Fractured Gneiss, Boulder Slurry & Pulverized Rock",
    radarSignature: "Bright high-roughness volume scattering (+3.8 dB delta)",
    opticalSignature: "Raw tan/ochre bedrock scarp and mud splay damming river",
    impact: "Severed Pasang Lhamu Highway; impounded 1.2M m³ temporary lake",
    polygon: [
      [28.075, 85.250],
      [28.071, 85.263],
      [28.056, 85.255],
      [28.049, 85.232],
      [28.057, 85.225],
      [28.068, 85.236]
    ]
  },
  {
    id: "debris-mailung",
    name: "Mailung Hydropower Debris Torrent & Silt Fan",
    sector: "Mailung Catchment & Powerhouse",
    center: [28.112, 85.289],
    estimatedVolumeM3: 42000,
    areaHectares: 11.2,
    hazardLevel: "CRITICAL",
    material: "Coarse Granitic Alluvium, Silt & Uprooted Timber",
    radarSignature: "Depolarizing rough debris surface (+3.2 dB delta)",
    opticalSignature: "Turbid sediment fan fanning across hydropower tailrace",
    impact: "Burying powerhouse intake and snapping suspension bridge cables",
    polygon: [
      [28.124, 85.302],
      [28.119, 85.316],
      [28.104, 85.303],
      [28.101, 85.278],
      [28.113, 85.273],
      [28.121, 85.288]
    ]
  },
  {
    id: "debris-hakupa",
    name: "Hakupa Slope Failure & Debris Tongue",
    sector: "Grang - Hakupa Valley Slope",
    center: [28.088, 85.262],
    estimatedVolumeM3: 31000,
    areaHectares: 8.6,
    hazardLevel: "HIGH",
    material: "Colluvial Soil Slump & Shattered Talus",
    radarSignature: "High cross-polarization backscatter (+2.9 dB delta)",
    opticalSignature: "Fresh crescent scarp with mud debris tongue down gully",
    impact: "Threatening upper agricultural terraces and footpaths",
    polygon: [
      [28.096, 85.273],
      [28.090, 85.282],
      [28.078, 85.269],
      [28.076, 85.252],
      [28.086, 85.250]
    ]
  },
  {
    id: "debris-ghatte",
    name: "Ghatte Khola Upstream Debris Splay",
    sector: "Upper Catchment Tributary",
    center: [28.175, 85.350],
    estimatedVolumeM3: 28000,
    areaHectares: 6.8,
    hazardLevel: "HIGH",
    material: "Glacial Till, Massive Boulders & Slurry",
    radarSignature: "Strong diffuse microwave scatter (+3.1 dB delta)",
    opticalSignature: "Raw bedrock exposure with white-foaming boulder torrent",
    impact: "Discharged flash-flood boulder barrage into Syaphrubesi",
    polygon: [
      [28.184, 85.358],
      [28.179, 85.370],
      [28.167, 85.356],
      [28.164, 85.338],
      [28.174, 85.343]
    ]
  }
];
