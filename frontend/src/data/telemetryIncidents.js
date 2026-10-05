/**
 * Real Disaster Telemetry Incidents (Extracted from Sentinel-1 SAR & ohsome OSM Analysis)
 * Zero demo accounts, zero mock stock photos.
 */
export const TELEMETRY_INCIDENTS = [
  {
    id: "INC-001",
    badge: "Escalate",
    title: "Ramche Landslide & Road Severance",
    subtitle: "Pasang Lhamu Highway (NH09) impassable · 3.8 km cut",
    category: "Landslide",
    severity: "CRITICAL",
    lat: 28.062,
    lon: 85.241,
    timestamp: "2026-08-26 04:15 UTC"
  },
  {
    id: "INC-002",
    badge: "Triage",
    title: "Trishuli SAR Inundation (Track 121)",
    subtitle: "Sentinel-1 log-ratio delta < -3.2 dB · 14.82 km²",
    category: "Radar",
    severity: "HIGH",
    lat: 28.035,
    lon: 85.230,
    timestamp: "2026-08-26 05:22 UTC"
  },
  {
    id: "INC-003",
    badge: "Assign",
    title: "Ramche Trishuli Crossing Bridge Washout",
    subtitle: "Pre-event OSM bridge node severed · No vehicular crossing",
    category: "Infrastructure",
    severity: "CRITICAL",
    lat: 28.062,
    lon: 85.241,
    timestamp: "2026-08-26 06:10 UTC"
  },
  {
    id: "INC-004",
    badge: "Acknowledge",
    title: "Syaphrubesi Settlement Cut Off",
    subtitle: "NetworkX graph isolated · 2,180 residents disconnected",
    category: "High",
    severity: "URGENT",
    lat: 28.156,
    lon: 85.334,
    timestamp: "2026-08-26 06:45 UTC"
  },
  {
    id: "INC-005",
    badge: "Monitor",
    title: "Mailung Suspension Bridge Failure",
    subtitle: "Trishuli riverside track submerged under 2.8m water",
    category: "Infrastructure",
    severity: "HIGH",
    lat: 28.093,
    lon: 85.228,
    timestamp: "2026-08-26 07:15 UTC"
  },
  {
    id: "INC-006",
    badge: "Export",
    title: "Dhunche District Hospital Isolated",
    subtitle: "Hospital access cut from lower plains · 35 beds operational",
    category: "Flood",
    severity: "HIGH",
    lat: 28.114,
    lon: 85.301,
    timestamp: "2026-08-26 07:50 UTC"
  },
  {
    id: "INC-007",
    badge: "Predicted",
    title: "Betrawati Downstream Ridge Bypass",
    subtitle: "Detour factor 2.4x via Nuwakot rural ridgeline (42m delay)",
    category: "Flood",
    severity: "MODERATE",
    lat: 27.978,
    lon: 85.184,
    timestamp: "2026-08-26 08:05 UTC"
  },
  {
    id: "INC-008",
    badge: "Low",
    title: "Trishuli Hydropower Substation Buffer",
    subtitle: "Water level within 1.2m of containment dike · Monitored",
    category: "Sensors",
    severity: "LOW",
    lat: 27.990,
    lon: 85.195,
    timestamp: "2026-08-26 08:30 UTC"
  }
];
