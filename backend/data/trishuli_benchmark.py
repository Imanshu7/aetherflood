"""
Trishuli Nepal Flood Benchmark (August 26, 2026 Event)
Provides GeoJSON layers matching EMSR927 Copernicus Emergency Management Service reference data
strictly for post-inference validation.
"""

from typing import Dict, Any

TRISHULI_BENCHMARK_DATA: Dict[str, Any] = {
    "disaster_meta": {
        "event": "Trishuli River Flood & Debris Inundation",
        "date": "2026-08-26",
        "district": "Rasuwa, Bagmati Province, Nepal",
        "coordinates": [28.035, 85.230],
        "validation_dataset": "EMSR927 Rapid Damage Assessment",
        "sar_pair": {
            "pre_event": "2026-08-14 (Sentinel-1A, Track 121)",
            "post_event": "2026-08-26 (Sentinel-1A, Track 121)"
        },
        "osm_snapshot": "2026-07-27 (via ohsome API)",
        "dem": "Copernicus DEM (WorldDEM-30)"
    },
    "geojson": {
        "type": "FeatureCollection",
        "features": [
            # Inundation Polygons (River and debris flow footprint)
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [85.180, 27.970],
                        [85.210, 28.020],
                        [85.240, 28.065],
                        [85.275, 28.095],
                        [85.320, 28.140],
                        [85.335, 28.160],
                        [85.345, 28.155],
                        [85.315, 28.130],
                        [85.265, 28.080],
                        [85.230, 28.040],
                        [85.195, 27.990],
                        [85.170, 27.965],
                        [85.180, 27.970]
                    ]]
                },
                "properties": {
                    "layer": "inundation_extent",
                    "type": "SAR_Detected_Water_Debris",
                    "area_km2": 14.82,
                    "confidence": "HIGH (Log-Ratio Delta < -3.2 dB & Slope < 18°)",
                    "color": "#3b82f6"
                }
            },
            # Severed Roads (Pasang Lhamu Highway NH09)
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.235, 28.050],
                        [85.242, 28.062],
                        [85.250, 28.075]
                    ]
                },
                "properties": {
                    "layer": "severed_road",
                    "name": "Pasang Lhamu Highway (NH09) - Ramche Sector",
                    "status": "IMPASSABLE_DEBRIS_FLOW",
                    "submerged_length_km": 3.8,
                    "color": "#ef4444"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.280, 28.098],
                        [85.310, 28.135],
                        [85.334, 28.156]
                    ]
                },
                "properties": {
                    "layer": "severed_road",
                    "name": "NH09 - Mailung to Syaphrubesi Link",
                    "status": "SUBMERGED_BRIDGE_WASHOUT",
                    "submerged_length_km": 4.6,
                    "color": "#ef4444"
                }
            },
            # Intact / Rerouted Road Bypass
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.158, 27.915],
                        [85.175, 27.940],
                        [85.184, 27.978]
                    ]
                },
                "properties": {
                    "layer": "intact_road",
                    "name": "Bidur-Betrawati South Access",
                    "status": "OPEN_CAUTION",
                    "color": "#10b981"
                }
            },
            # Severed Bridges
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.241, 28.062]},
                "properties": {
                    "layer": "severed_bridge",
                    "name": "Ramche Trishuli Crossing Bridge",
                    "status": "WASHED_OUT",
                    "color": "#dc2626"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.295, 28.115]},
                "properties": {
                    "layer": "severed_bridge",
                    "name": "Mailung Hydropower Access Bridge",
                    "status": "WASHED_OUT",
                    "color": "#dc2626"
                }
            },
            # Isolated Settlements
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.241, 28.062]},
                "properties": {
                    "layer": "settlement",
                    "name": "Ramche",
                    "population": 1420,
                    "status": "ISOLATED",
                    "hospital_access": "CUT_OFF"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.334, 28.156]},
                "properties": {
                    "layer": "settlement",
                    "name": "Syaphrubesi",
                    "population": 2180,
                    "status": "ISOLATED",
                    "hospital_access": "CUT_OFF"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.228, 28.093]},
                "properties": {
                    "layer": "settlement",
                    "name": "Mailung",
                    "population": 890,
                    "status": "ISOLATED",
                    "hospital_access": "CUT_OFF"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.298, 28.112]},
                "properties": {
                    "layer": "settlement",
                    "name": "Dhunche",
                    "population": 2800,
                    "status": "ISOLATED",
                    "hospital_access": "CUT_OFF"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.184, 27.978]},
                "properties": {
                    "layer": "settlement",
                    "name": "Betrawati",
                    "population": 3450,
                    "status": "REROUTED",
                    "hospital_access": "ACCESSIBLE_DETOUR"
                }
            },
            # Critical Facilities (Hospitals)
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.158, 27.915]},
                "properties": {
                    "layer": "hospital",
                    "name": "Trishuli District Hospital (Bidur)",
                    "type": "Regional Hub Hospital",
                    "status": "OPERATIONAL",
                    "beds": 120
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.301, 28.114]},
                "properties": {
                    "layer": "hospital",
                    "name": "Dhunche District Hospital",
                    "type": "Community Hospital",
                    "status": "ISOLATED_IN_ZONE",
                    "beds": 35
                }
            }
        ]
    }
}
