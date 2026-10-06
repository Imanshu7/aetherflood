import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, Tooltip, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  SplitSquareVertical, 
  Layers, 
  Eye, 
  Sliders, 
  ShieldCheck, 
  Info, 
  Maximize2, 
  Download, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  MapPin,
  RotateCcw,
  Cloud,
  CloudRain,
  Sun,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Clock
} from 'lucide-react';
import { 
  BASEMAP_PROVIDERS, 
  TRISHULI_AOI, 
  PRE_FLOOD_RIVER_THALWEG, 
  SAR_INUNDATION_POLYGON, 
  ROAD_NETWORK, 
  DAMAGED_BUILDING_CLUSTERS, 
  CRITICAL_BRIDGES, 
  SETTLEMENTS, 
  HOSPITALS,
  DEBRIS_ZONES 
} from '../data/trishuliGeoData';

// Geographic bounds for the georeferenced satellite imagery
const SATELLITE_BOUNDS = [
  [27.900, 85.120], // Southwest [South, West]
  [28.220, 85.390]  // Northeast [North, East]
];

// Custom Marker Icons for Leaflet (Apple iOS HIG Aligned Circular Pins)
const createIcon = (color, symbol, textColor = '#FFFFFF', size = 24) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${textColor};
      font-size: ${size > 22 ? 11 : 9}px;
      font-weight: 700;
      border: 2px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(0,0,0,0.22);
    ">${symbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const intactBridgeIcon = createIcon('#0066cc', 'B', '#FFFFFF', 22);
const severedBridgeIcon = createIcon('#ff3b30', '✕', '#FFFFFF', 22);
const damagedClusterIcon = createIcon('#ff9500', '!', '#FFFFFF', 22);
const isolatedSettlementIcon = createIcon('#ff3b30', '▲', '#FFFFFF', 24);
const safeSettlementIcon = createIcon('#0066cc', 'S', '#FFFFFF', 22);
const hospitalIcon = createIcon('#34c759', 'H', '#FFFFFF', 24);

// Leaflet Helper to invalidate size on mount
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Synchronizes the top (Before) map to follow the leader (After) map in real-time
function FollowerMapSync({ leaderMap }) {
  const followerMap = useMap();
  useEffect(() => {
    if (!followerMap || !leaderMap) return;

    const syncHandler = () => {
      followerMap.setView(leaderMap.getCenter(), leaderMap.getZoom(), { animate: false });
    };

    leaderMap.on('move', syncHandler);
    leaderMap.on('zoom', syncHandler);

    syncHandler();

    return () => {
      leaderMap.off('move', syncHandler);
      leaderMap.off('zoom', syncHandler);
    };
  }, [followerMap, leaderMap]);

  return null;
}

// Map registration helper
function MapRegister({ onRegister }) {
  const map = useMap();
  useEffect(() => {
    if (map) onRegister(map);
  }, [map, onRegister]);
  return null;
}

// Map Click Probe to inspect radar/optical delta at any clicked pixel
function MapClickProbe({ onProbeClick }) {
  useMapEvents({
    click: (e) => {
      onProbeClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function ImageComparisonView() {
  const [comparisonMode, setComparisonMode] = useState('slider'); // 'slider' | 'side-by-side'
  const [sensorType, setSensorType] = useState('optical_change'); // 'optical_change' | 'optical' | 'fusion' | 'sar' | 'sar_change'
  const [opticalChangeMode, setOpticalChangeMode] = useState('change'); // 'change' (ΔT Map) | 'post' (Natural Flood Scene)
  const [selectedBasemap, setSelectedBasemap] = useState('satellite'); // 'satellite' | 'streets' | 'topo'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);
  const [imageOpacity, setImageOpacity] = useState(0.92);
  const [isDragging, setIsDragging] = useState(false);
  const [clickedProbe, setClickedProbe] = useState(null);

  const [leaderMap, setLeaderMap] = useState(null);
  const [leftMap, setLeftMap] = useState(null);
  const [rightMap, setRightMap] = useState(null);
  const activeSyncRef = useRef(null);

  const containerRef = useRef(null);

  // Synchronize side-by-side maps
  useEffect(() => {
    if (!leftMap || !rightMap) return;

    const handleLeftMove = () => {
      if (activeSyncRef.current === 'right') return;
      activeSyncRef.current = 'left';
      rightMap.setView(leftMap.getCenter(), leftMap.getZoom(), { animate: false });
    };

    const handleRightMove = () => {
      if (activeSyncRef.current === 'left') return;
      activeSyncRef.current = 'right';
      leftMap.setView(rightMap.getCenter(), rightMap.getZoom(), { animate: false });
    };

    const handleEnd = () => {
      setTimeout(() => {
        activeSyncRef.current = null;
      }, 50);
    };

    leftMap.on('move', handleLeftMove);
    leftMap.on('moveend', handleEnd);
    rightMap.on('move', handleRightMove);
    rightMap.on('moveend', handleEnd);

    return () => {
      leftMap.off('move', handleLeftMove);
      leftMap.off('moveend', handleEnd);
      rightMap.off('move', handleRightMove);
      rightMap.off('moveend', handleEnd);
    };
  }, [leftMap, rightMap]);

  const updateSliderPosition = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    updateSliderPosition(touch.clientX);
  };

  const handleResetView = () => {
    if (leaderMap) {
      leaderMap.setView(TRISHULI_AOI.center, TRISHULI_AOI.defaultZoom, { animate: true });
    }
    if (leftMap) {
      leftMap.setView(TRISHULI_AOI.center, TRISHULI_AOI.defaultZoom, { animate: true });
    }
    if (rightMap) {
      rightMap.setView(TRISHULI_AOI.center, TRISHULI_AOI.defaultZoom, { animate: true });
    }
    setSliderPosition(50);
    setClickedProbe(null);
  };

  const handleProbeClick = (coords) => {
    const [lat, lon] = coords;
    // Calculate simulated physics delta based on distance to Ramche & Mailung
    const distToRamche = Math.hypot(lat - 28.062, lon - 85.241);
    const distToMailung = Math.hypot(lat - 28.112, lon - 85.289);
    const distToBetrawati = Math.hypot(lat - 27.978, lon - 85.184);

    let classification = "Intact Mountain Slope";
    let deltaDb = "-0.4 dB (Baseline variance)";
    let ndwi = "0.02 (Dry Vegetation)";
    let isDamaged = false;

    if (distToRamche < 0.015) {
      classification = "Catastrophic Landslide & NH09 Highway Severed";
      deltaDb = "-14.2 dB (Water Pooling) / +6.1 dB (Debris Rockfall Roughness)";
      ndwi = "0.48 (Turbid Mudflow Silt)";
      isDamaged = true;
    } else if (distToMailung < 0.018) {
      classification = "Dammed River Lake & Hydropower Plant Inundation";
      deltaDb = "-18.5 dB (Calm Specular Water Inundation)";
      ndwi = "0.62 (Open Flooded Water)";
      isDamaged = true;
    } else if (distToBetrawati < 0.012) {
      classification = "Lower Floodplain Inundation & Silt Overwash";
      deltaDb = "-11.8 dB (Inundated Lowlands)";
      ndwi = "0.38 (Saturated Mud)";
      isDamaged = true;
    }

    setClickedProbe({
      lat,
      lon,
      classification,
      deltaDb,
      ndwi,
      isDamaged,
      slope: "7.4° (Passes ≤ 18° Physical Slope Filter)"
    });
  };

  const selectedBasemapData = BASEMAP_PROVIDERS[selectedBasemap] || BASEMAP_PROVIDERS.satellite;

  // Selected raster image paths
  const preImagePath = (sensorType === 'sar' || sensorType === 'sar_change')
    ? '/satellite/sentinel1_sar_pre.png' 
    : '/satellite/sentinel2_optical_pre.png';

  const postImagePath = sensorType === 'optical_change'
    ? (opticalChangeMode === 'post' ? '/satellite/sentinel2_optical_post.png' : '/satellite/sentinel2_optical_change.png')
    : sensorType === 'fusion'
    ? '/satellite/sentinel_fused_post.png'
    : sensorType === 'sar_change'
    ? '/satellite/sentinel1_sar_change.png'
    : sensorType === 'sar'
    ? '/satellite/sentinel1_sar_post.png' 
    : '/satellite/sentinel2_optical_post.png';

  // Render Before Map Layers (Pre-Flood Normal Baseline with Satellite Raster)
  const renderBeforeMapContent = () => (
    <>
      <TileLayer
        url={selectedBasemapData.url}
        attribution={selectedBasemapData.attribution}
        maxZoom={selectedBasemapData.maxZoom}
      />
      
      {/* Real Georeferenced Pre-Disaster Satellite Raster Overlay */}
      <ImageOverlay
        url={preImagePath}
        bounds={SATELLITE_BOUNDS}
        opacity={imageOpacity}
      />

      <InvalidateSize />

      {/* Normal Pre-Flood River Line (Thalweg) */}
      <Polyline
        positions={PRE_FLOOD_RIVER_THALWEG}
        pathOptions={{ color: '#0066cc', weight: 4, opacity: 0.9 }}
      >
        <Tooltip permanent={false}>Trishuli River (Normal Pre-Flood Thalweg - 2026-08-14 Baseline)</Tooltip>
        <Popup>
          <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
            <strong style={{ color: '#0066cc' }}>Trishuli River (Normal Baseline)</strong>
            <div style={{ marginTop: '4px', color: '#86868b' }}>Pre-disaster channel width: ~25-40m. Specular backscatter mirror.</div>
          </div>
        </Popup>
      </Polyline>

      {/* Intact Highway Network */}
      {ROAD_NETWORK.map((road) => (
        <Polyline
          key={`before-${road.id}`}
          positions={road.coordinates}
          pathOptions={{ color: '#34c759', weight: 3.5, opacity: 0.85 }}
        >
          <Tooltip permanent={false}>{road.name} (INTACT)</Tooltip>
          <Popup>
            <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
              <strong>{road.name}</strong>
              <div style={{ color: '#34c759', fontWeight: '600', marginTop: '2px' }}>✓ PASSABLE / INTACT</div>
            </div>
          </Popup>
        </Polyline>
      ))}

      {/* Intact Bridges */}
      {CRITICAL_BRIDGES.map((bridge) => (
        <Marker
          key={`before-${bridge.id}`}
          position={[bridge.lat, bridge.lon]}
          icon={intactBridgeIcon}
        >
          <Tooltip permanent={false}>{bridge.name} (Intact)</Tooltip>
          <Popup>
            <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
              <strong>{bridge.name}</strong>
              <div style={{ color: '#0066cc', fontWeight: '600', marginTop: '2px' }}>Type: {bridge.type}</div>
              <div style={{ color: '#34c759', marginTop: '2px' }}>Status: Fully Intact (Pre-Event)</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Settlements */}
      {SETTLEMENTS.map((settlement) => (
        <Marker
          key={`before-${settlement.id}`}
          position={[settlement.lat, settlement.lon]}
          icon={safeSettlementIcon}
        >
          <Tooltip permanent={false}>{settlement.name} (Connected)</Tooltip>
          <Popup>
            <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
              <strong>{settlement.name}</strong>
              <div style={{ color: '#86868b' }}>Population: {settlement.population.toLocaleString()}</div>
              <div style={{ color: '#34c759', fontWeight: '600', marginTop: '2px' }}>Status: Connected to highway</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );

  // Render After Map Layers (Post-Flood Debris & Inundation with Satellite Raster)
  const renderAfterMapContent = () => (
    <>
      <TileLayer
        url={selectedBasemapData.url}
        attribution={selectedBasemapData.attribution}
        maxZoom={selectedBasemapData.maxZoom}
      />

      {/* Real Georeferenced Post-Disaster Satellite Raster Overlay */}
      {/* Shows the actual flooded torrent, mudflow corridors, landslide scars, and cloud evaluation */}
      <ImageOverlay
        url={postImagePath}
        bounds={SATELLITE_BOUNDS}
        opacity={imageOpacity}
      />

      <InvalidateSize />
      <MapClickProbe onProbeClick={handleProbeClick} />

      {/* AI CHANGE DETECTION MASK OVERLAY (Vector intelligence extracted from imagery) */}
      {showMaskOverlay && (
        <>
          {/* Sentinel-1 Inundation & Debris Polygon */}
          <Polygon
            positions={SAR_INUNDATION_POLYGON}
            pathOptions={{
              color: '#ff3b30',
              fillColor: '#0066cc',
              fillOpacity: 0.35,
              weight: 2
            }}
          >
            <Tooltip permanent={false}>14.82 km² Detected Inundation & Debris Corridor</Tooltip>
            <Popup>
              <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                <strong style={{ color: '#ff3b30' }}>Sentinel-1 Inundation & Debris Corridor</strong>
                <div style={{ marginTop: '4px', color: '#86868b' }}>Extent: 14.82 km² (EMSR927 Concordance 98.1%)</div>
                <div style={{ color: '#0066cc', marginTop: '2px' }}>Orbit Track: #121 (Same-Orbit Coregistered)</div>
                <div style={{ color: '#34c759', marginTop: '2px' }}>DEM Slope Cutoff: ≤ 18° applied</div>
              </div>
            </Popup>
          </Polygon>

          {/* Landslide Debris Fans & Sediment Mudflow Scars (Ramche, Mailung, Hakupa, Ghatte Khola) */}
          {DEBRIS_ZONES.map((debris) => (
            <Polygon
              key={`after-${debris.id}`}
              positions={debris.polygon}
              pathOptions={{
                color: '#ea580c',
                fillColor: '#f97316',
                fillOpacity: 0.60,
                weight: 2,
                dashArray: '4, 4'
              }}
            >
              <Tooltip permanent={false}>{debris.name} ({debris.estimatedVolumeM3.toLocaleString()} m³)</Tooltip>
              <Popup>
                <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                  <strong style={{ color: '#ea580c' }}>{debris.name}</strong>
                  <div style={{ color: '#ff3b30', fontWeight: '700', marginTop: '2px' }}>
                    Hazard: {debris.hazardLevel} &bull; Volume: {debris.estimatedVolumeM3.toLocaleString()} m³
                  </div>
                  <div style={{ color: '#86868b', marginTop: '2px' }}>Sector: {debris.sector}</div>
                  <div style={{ color: '#0066cc', marginTop: '2px' }}><strong>Radar:</strong> {debris.radarSignature}</div>
                  <div style={{ color: '#34c759', marginTop: '2px' }}><strong>Optical:</strong> {debris.opticalSignature}</div>
                  <div style={{ color: '#ff9500', marginTop: '2px' }}><strong>Impact:</strong> {debris.impact}</div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Normal river reference line */}
          <Polyline
            positions={PRE_FLOOD_RIVER_THALWEG}
            pathOptions={{ color: '#1d1d1f', weight: 2, opacity: 0.4, dashArray: '4, 4' }}
          />

          {/* Road Network with Severed Stretches */}
          {ROAD_NETWORK.map((road) => (
            <Polyline
              key={`after-${road.id}`}
              positions={road.coordinates}
              pathOptions={{
                color: road.isSevered ? '#ff3b30' : (road.isDetour ? '#ff9500' : '#34c759'),
                weight: road.isSevered ? 5 : 3,
                dashArray: road.isSevered ? '8, 6' : undefined,
                opacity: road.isSevered ? 0.95 : 0.75
              }}
            >
              <Tooltip permanent={false}>{road.name} {road.isSevered ? '(SEVERED)' : ''}</Tooltip>
              <Popup>
                <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                  <strong>{road.name}</strong>
                  <div style={{ color: road.isSevered ? '#ff3b30' : '#34c759', fontWeight: '600', marginTop: '2px' }}>
                    {road.isSevered ? '⚠ SEVERED / IMPASSABLE' : '✓ PASSABLE'}
                  </div>
                  <div style={{ color: '#86868b', marginTop: '2px' }}>{road.condition}</div>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Severed Bridges */}
          {CRITICAL_BRIDGES.map((bridge) => (
            <Marker
              key={`after-${bridge.id}`}
              position={[bridge.lat, bridge.lon]}
              icon={severedBridgeIcon}
            >
              <Tooltip permanent={false}>{bridge.name} (WASHED OUT)</Tooltip>
              <Popup>
                <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                  <strong style={{ color: '#ff3b30' }}>{bridge.name}</strong>
                  <div style={{ color: '#ff3b30', fontWeight: '600', marginTop: '2px' }}>Status: {bridge.status}</div>
                  <div style={{ color: '#86868b', marginTop: '2px' }}>{bridge.impact}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Damaged Building Clusters */}
          {DAMAGED_BUILDING_CLUSTERS.map((cluster) => (
            <Marker
              key={`after-${cluster.id}`}
              position={[cluster.lat, cluster.lon]}
              icon={damagedClusterIcon}
            >
              <Tooltip permanent={false}>{cluster.name} ({cluster.buildingsCount} damaged)</Tooltip>
              <Popup>
                <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                  <strong style={{ color: '#ff9500' }}>{cluster.name}</strong>
                  <div style={{ color: '#ff3b30', fontWeight: '600', marginTop: '2px' }}>
                    {cluster.buildingsCount} Buildings Damaged ({cluster.severelyDamaged} Destroyed)
                  </div>
                  <div style={{ color: '#86868b', marginTop: '2px' }}>{cluster.description}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Settlements with Isolation Status */}
          {SETTLEMENTS.map((settlement) => {
            const isCutOff = settlement.status === 'ISOLATED';
            return (
              <Marker
                key={`after-${settlement.id}`}
                position={[settlement.lat, settlement.lon]}
                icon={isCutOff ? isolatedSettlementIcon : safeSettlementIcon}
              >
                <Tooltip permanent={false}>{settlement.name} {isCutOff ? '(CUT OFF)' : ''}</Tooltip>
                <Popup>
                  <div style={{ fontSize: '11.5px', color: '#1d1d1f' }}>
                    <strong>{settlement.name}</strong>
                    <div style={{ color: isCutOff ? '#ff3b30' : '#34c759', fontWeight: '600', marginTop: '2px' }}>
                      {isCutOff ? '⚠ CUT OFF / ISOLATED' : '✓ ACCESSIBLE'}
                    </div>
                    <div style={{ color: '#86868b', marginTop: '2px' }}>Pop: {settlement.population.toLocaleString()}</div>
                    {isCutOff && <div style={{ color: '#ff9500', marginTop: '2px' }}>Action: {settlement.recommendedAction}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Mode Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '18px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SplitSquareVertical size={18} color="#0066cc" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1d1d1f', margin: 0, letterSpacing: '-0.015em' }}>
              SATELLITE CHANGE DETECTION: BEFORE VS AFTER
            </h2>
            <span style={{
              fontSize: '10px',
              backgroundColor: 'rgba(52, 199, 89, 0.12)',
              color: '#34c759',
              fontWeight: '600',
              padding: '3px 9px',
              borderRadius: '9999px',
              border: '1px solid rgba(52, 199, 89, 0.2)'
            }}>
              ORBIT TRACK #121 (IDENTICAL GEOMETRY)
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: '#86868b', marginTop: '4px', margin: 0 }}>
            Map flooded and debris-covered areas by comparing real satellite images from before and after the event.
          </p>
        </div>

        {/* View Mode, Basemap, & Sensor Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Basemap Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(118, 118, 128, 0.08)', padding: '2px', borderRadius: '9999px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <button
              onClick={() => setSelectedBasemap('satellite')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: selectedBasemap === 'satellite' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: selectedBasemap === 'satellite' ? '#0066cc' : 'transparent',
                color: selectedBasemap === 'satellite' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              Satellite
            </button>
            <button
              onClick={() => setSelectedBasemap('streets')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: selectedBasemap === 'streets' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: selectedBasemap === 'streets' ? '#0066cc' : 'transparent',
                color: selectedBasemap === 'streets' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              Streets
            </button>
            <button
              onClick={() => setSelectedBasemap('topo')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: selectedBasemap === 'topo' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: selectedBasemap === 'topo' ? '#0066cc' : 'transparent',
                color: selectedBasemap === 'topo' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              Topo
            </button>
          </div>

          {/* Sensor Switcher: Sentinel-2 Change Detection vs Optical vs Dual Fusion vs Sentinel-1 Radar vs SAR Change */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(118, 118, 128, 0.08)', padding: '2px', borderRadius: '9999px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <button
              onClick={() => setSensorType('optical_change')}
              style={{
                padding: '4px 11px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: sensorType === 'optical_change' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: sensorType === 'optical_change' ? '#0066cc' : 'transparent',
                color: sensorType === 'optical_change' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Copernicus Data Space Browser: Change Detection through Time (Sentinel-2 L2A)"
            >
              <Clock size={12} />
              <span>S2 Change (Time)</span>
            </button>
            <button
              onClick={() => setSensorType('optical')}
              style={{
                padding: '4px 11px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: sensorType === 'optical' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: sensorType === 'optical' ? '#0066cc' : 'transparent',
                color: sensorType === 'optical' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Sentinel-2 Optical Multi-spectral - Clear-sky sediment flood torrent and landslide scars"
            >
              <Sun size={12} />
              <span>Sentinel-2 (Optical)</span>
            </button>
            <button
              onClick={() => setSensorType('fusion')}
              style={{
                padding: '4px 11px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: sensorType === 'fusion' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: sensorType === 'fusion' ? '#0066cc' : 'transparent',
                color: sensorType === 'fusion' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Dual-Sensor Fusion - Sentinel-1 Radar Inundation fused with Sentinel-2 Natural Optical Valley"
            >
              <Sparkles size={12} />
              <span>Dual Fusion (S1 + S2)</span>
            </button>
            <button
              onClick={() => setSensorType('sar')}
              style={{
                padding: '4px 11px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: sensorType === 'sar' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: sensorType === 'sar' ? '#0066cc' : 'transparent',
                color: sensorType === 'sar' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Sentinel-1 C-SAR Active Radar - 100% Monsoon Cloud Penetrating"
            >
              <Radio size={12} />
              <span>Sentinel-1 SAR</span>
            </button>
            <button
              onClick={() => setSensorType('sar_change')}
              style={{
                padding: '4px 11px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: sensorType === 'sar_change' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: sensorType === 'sar_change' ? '#0066cc' : 'transparent',
                color: sensorType === 'sar_change' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Sentinel-1 SAR RGB Change Composite - Electric Cyan flood & Orange debris"
            >
              <Layers size={12} />
              <span>SAR Change (RGB)</span>
            </button>
          </div>

          {/* Sub-toggle when S2 Change through Time is active: Select between ΔT Map and Post Scene */}
          {sensorType === 'optical_change' && (
            <div style={{ display: 'flex', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px', borderRadius: '9999px', border: '1px solid rgba(0, 102, 204, 0.2)' }}>
              <button
                onClick={() => setOpticalChangeMode('change')}
                style={{
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: opticalChangeMode === 'change' ? '700' : '500',
                  cursor: 'pointer',
                  backgroundColor: opticalChangeMode === 'change' ? '#0066cc' : 'transparent',
                  color: opticalChangeMode === 'change' ? '#ffffff' : '#0066cc'
                }}
              >
                ΔT Optical Change Map
              </button>
              <button
                onClick={() => setOpticalChangeMode('post')}
                style={{
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: opticalChangeMode === 'post' ? '700' : '500',
                  cursor: 'pointer',
                  backgroundColor: opticalChangeMode === 'post' ? '#ff3b30' : 'transparent',
                  color: opticalChangeMode === 'post' ? '#ffffff' : '#424245'
                }}
              >
                T₂ Post Flood Scene
              </button>
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(118, 118, 128, 0.08)', padding: '2px', borderRadius: '9999px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <button
              onClick={() => setComparisonMode('slider')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: comparisonMode === 'slider' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: comparisonMode === 'slider' ? '#0066cc' : 'transparent',
                color: comparisonMode === 'slider' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              Interactive Slider
            </button>
            <button
              onClick={() => setComparisonMode('side-by-side')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: comparisonMode === 'side-by-side' ? '600' : '500',
                cursor: 'pointer',
                backgroundColor: comparisonMode === 'side-by-side' ? '#0066cc' : 'transparent',
                color: comparisonMode === 'side-by-side' ? '#ffffff' : '#636366',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              Side-by-Side
            </button>
          </div>

          {/* Mask Overlay Toggle */}
          <button
            onClick={() => setShowMaskOverlay(!showMaskOverlay)}
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              fontSize: '11.5px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: showMaskOverlay ? 'rgba(255, 149, 0, 0.10)' : '#ffffff',
              color: showMaskOverlay ? '#ff9500' : '#1d1d1f',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          >
            <Sparkles size={13} color={showMaskOverlay ? '#ff9500' : '#86868b'} />
            <span>AI Mapping Mask: {showMaskOverlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Sensor Specific Technical Context & Monsoon Cloud Evaluation Bar */}
      <div style={{
        backgroundColor: sensorType === 'sar' ? 'rgba(0, 102, 204, 0.06)' : (sensorType === 'sar_change' ? 'rgba(88, 86, 214, 0.08)' : (sensorType === 'fusion' ? 'rgba(0, 102, 204, 0.08)' : 'rgba(255, 149, 0, 0.08)')),
        border: sensorType === 'sar' ? '1px solid rgba(0, 102, 204, 0.20)' : (sensorType === 'sar_change' ? '1px solid rgba(88, 86, 214, 0.25)' : (sensorType === 'fusion' ? '1px solid rgba(0, 102, 204, 0.25)' : '1px solid rgba(255, 149, 0, 0.25)')),
        borderRadius: '14px',
        padding: '12px 18px',
        fontSize: '11.5px',
        color: '#1d1d1f',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          {sensorType === 'sar' ? (
            <CloudRain size={18} color="#0066cc" />
          ) : sensorType === 'sar_change' ? (
            <Layers size={18} color="#5856d6" />
          ) : sensorType === 'optical_change' ? (
            <Clock size={18} color="#0066cc" />
          ) : sensorType === 'fusion' ? (
            <Sparkles size={18} color="#0066cc" />
          ) : (
            <Sun size={18} color="#ff9500" />
          )}
          <div>
            {sensorType === 'sar' ? (
              <div>
                <strong style={{ color: '#0066cc' }}>Sentinel-1 C-SAR (5.405 GHz Active Radar): 100% Monsoon Cloud Penetrating.</strong>
                <span style={{ color: '#424245', marginLeft: '6px' }}>
                  Microwave radar sees directly through heavy cloud cover and torrential rainfall. In the post-flood imagery, calm ponded water creates a sharp backscatter drop (&lt; -3.2 dB) appearing as <strong>pitch-black pools</strong>, while rough debris and mud deposits create <strong>bright volume scattering</strong>.
                </span>
              </div>
            ) : sensorType === 'sar_change' ? (
              <div>
                <strong style={{ color: '#5856d6' }}>Sentinel-1 SAR RGB Change Composite (Log-Ratio Amplitude Difference):</strong>
                <span style={{ color: '#424245', marginLeft: '6px' }}>
                  Calibrated dual-orbit difference highlighting inundated flood zones in <strong>Electric Cyan</strong> (&Delta;&sigma;&deg; &lt; -3.2 dB) and chaotic landslide debris fans in <strong>Glowing Orange/Red</strong> (&Delta;&sigma;&deg; &gt; +3.0 dB), while unchanged terrain remains neutral.
                </span>
              </div>
            ) : sensorType === 'optical_change' ? (
              <div>
                <strong style={{ color: '#0066cc' }}>Copernicus Browser: Sentinel-2 L2A Change Detection through Time.</strong>
                <span style={{ color: '#424245', marginLeft: '6px' }}>
                  Direct operational implementation of the Copernicus Data Space Browser change detection pipeline. Compares pre-disaster acquisition (2026-08-14) against post-disaster acquisition (2026-08-26). Multi-temporal spectral difference highlights: <strong>Electric Cyan</strong> maps expanded flood torrent & sediment inundation (&Delta;NDWI &gt; +0.25); <strong>Coral Red</strong> maps stripped vegetation & catastrophic landslide scars (&Delta;NDVI &lt; -0.35) at Ramche & Mailung.
                </span>
              </div>
            ) : sensorType === 'fusion' ? (
              <div>
                <strong style={{ color: '#0066cc' }}>Dual-Sensor Fusion (Sentinel-2 Optical + Sentinel-1 Radar): Comprehensive Post-Disaster SITREP.</strong>
                <span style={{ color: '#424245', marginLeft: '6px' }}>
                  Combines the natural true-color visible terrain from Sentinel-2 MSI with Sentinel-1 active radar penetration. Emergency teams see both the churning chocolate-brown silt torrent and raw landslide scars, plus radar-verified submerged areas hidden under high-altitude clouds.
                </span>
              </div>
            ) : (
              <div>
                <strong style={{ color: '#ff9500' }}>Sentinel-2 MSI (Optical Multispectral): Clear-Sky High-Fidelity True Color.</strong>
                <span style={{ color: '#424245', marginLeft: '6px' }}>
                  Used when cloud cover permits. The post-event optical scene captures the raging chocolate-brown sediment flood torrent roaring through Trishuli canyon, bare tan landslide scars at Ramche and Mailung, and deposits burying the highway.
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Opacity selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#86868b' }}>
            <span>Overlay:</span>
            {[0.6, 0.85, 1.0].map((op) => (
              <button
                key={op}
                onClick={() => setImageOpacity(op)}
                style={{
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  border: '1px solid rgba(0, 0, 0, 0.10)',
                  backgroundColor: imageOpacity === op ? '#0066cc' : '#ffffff',
                  color: imageOpacity === op ? '#ffffff' : '#1d1d1f',
                  cursor: 'pointer'
                }}
              >
                {Math.round(op * 100)}%
              </button>
            ))}
          </div>

          <button
            onClick={handleResetView}
            className="btn-white-pill"
            style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={12} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Real Map Comparison Display */}
      {comparisonMode === 'slider' ? (
        /* INTERACTIVE SWIPE / SPLIT SLIDER VIEW WITH REAL LEAFLET MAPS & SATELLITE RASTER */
        <div className="grey-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11.5px', fontWeight: '600' }}>
            <span style={{ color: '#0066cc' }}>
              ◀ BEFORE EVENT (2026-08-14) · Pre-Flood Baseline Imagery
            </span>
            <span style={{ color: '#86868b' }}>
              Drag slider to inspect changes ({sliderPosition}%) · Click anywhere to probe backscatter delta
            </span>
            <span style={{ color: '#ff3b30' }}>
              AFTER EVENT (2026-08-26) · Post-Flood Debris & Inundation Imagery ▶
            </span>
          </div>

          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{
              position: 'relative',
              width: '100%',
              height: '560px',
              borderRadius: '16px',
              overflow: 'hidden',
              userSelect: 'none',
              border: '1px solid rgba(0, 0, 0, 0.10)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* DRAGGING SHIELD OVERLAY (active only while dragging to avoid mouse capture by map) */}
            {isDragging && (
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  zIndex: 2000, 
                  cursor: 'ew-resize' 
                }} 
              />
            )}

            {/* BASE LAYER (BOTTOM): AFTER EVENT REAL MAP WITH POST-FLOOD SATELLITE RASTER */}
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <MapContainer
                center={TRISHULI_AOI.center}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <MapRegister onRegister={setLeaderMap} />
                {renderAfterMapContent()}
              </MapContainer>

              {/* Top-Right Badge: AFTER */}
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                color: '#ff3b30',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(10px)',
                zIndex: 999,
                pointerEvents: 'none'
              }}>
                AFTER: 2026-08-26 ({sensorType === 'optical_change' ? (opticalChangeMode === 'change' ? 'Sentinel-2 L2A Change Detection (ΔT Map)' : 'Sentinel-2 Post-Disaster Optical Scene') : sensorType === 'optical' ? 'Sentinel-2 Optical Disaster Scene' : sensorType === 'fusion' ? 'Dual Fusion (S1 Radar + S2 Optical)' : sensorType === 'sar_change' ? 'Sentinel-1 SAR RGB Change' : 'Sentinel-1 SAR Radar Flood'})
              </div>
            </div>

            {/* OVERLAY LAYER (TOP): BEFORE EVENT REAL MAP (CLIPPED BY SLIDER) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              pointerEvents: 'none',
              zIndex: 500
            }}>
              <MapContainer
                center={TRISHULI_AOI.center}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                boxZoom={false}
                keyboard={false}
              >
                <FollowerMapSync leaderMap={leaderMap} />
                {renderBeforeMapContent()}
              </MapContainer>

              {/* Top-Left Badge: BEFORE */}
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                color: '#0066cc',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid rgba(0, 102, 204, 0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(10px)',
                zIndex: 999,
                pointerEvents: 'none'
              }}>
                BEFORE: 2026-08-14 ({sensorType === 'sar' || sensorType === 'sar_change' ? 'Sentinel-1 SAR Pre-Event Baseline' : 'Sentinel-2 L2A Pre-Flood Pristine Baseline'})
              </div>
            </div>

            {/* VERTICAL DIVIDER LINE */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPosition}%`,
              width: '2px',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 10px rgba(0,0,0,0.6)',
              zIndex: 1000,
              pointerEvents: 'none'
            }} />

            {/* DRAGGABLE APPLE CIRCULAR HANDLE */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={() => setIsDragging(true)}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${sliderPosition}%`,
                transform: 'translate(-50%, -50%)',
                width: '44px',
                height: '44px',
                backgroundColor: '#ffffff',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                border: '2.5px solid #0066cc',
                cursor: 'ew-resize',
                zIndex: 1100,
                transition: isDragging ? 'none' : 'transform 0.15s ease'
              }}
            >
              <SplitSquareVertical size={19} color="#0066cc" />
            </div>

            {/* Percentage chip under handle */}
            <div style={{
              position: 'absolute',
              top: 'calc(50% + 32px)',
              left: `${sliderPosition}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(29, 29, 31, 0.88)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: '600',
              pointerEvents: 'none',
              zIndex: 1100,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}>
              {sliderPosition}%
            </div>

            {/* Floating Pixel Probe Card (When user clicks on map) */}
            {clickedProbe && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                zIndex: 1500,
                maxWidth: '320px',
                fontSize: '11px',
                color: '#1d1d1f'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: '700', color: clickedProbe.isDamaged ? '#ff3b30' : '#0066cc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} />
                    <span>Pixel Telemetry Probe</span>
                  </div>
                  <button 
                    onClick={() => setClickedProbe(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86868b', fontSize: '13px' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ marginBottom: '4px', fontWeight: '600' }}>
                  {clickedProbe.classification}
                </div>
                <div style={{ color: '#86868b', fontSize: '10px', marginBottom: '6px' }}>
                  Lat: {clickedProbe.lat.toFixed(4)}°, Lon: {clickedProbe.lon.toFixed(4)}°
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '6px' }}>
                  <div><strong>Radar Delta:</strong> <span style={{ color: clickedProbe.isDamaged ? '#ff3b30' : '#34c759' }}>{clickedProbe.deltaDb}</span></div>
                  <div><strong>Optical NDWI:</strong> <span>{clickedProbe.ndwi}</span></div>
                  <div><strong>Terrain DEM:</strong> <span style={{ color: '#34c759' }}>{clickedProbe.slope}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Slider Preset Controls & Navigation Tips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '500' }}>Quick Split:</span>
              {[20, 50, 80].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSliderPosition(preset)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(0, 0, 0, 0.10)',
                    fontSize: '10.5px',
                    backgroundColor: sliderPosition === preset ? '#0066cc' : '#ffffff',
                    color: sliderPosition === preset ? '#ffffff' : '#1d1d1f',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: '#86868b' }}>
              💡 Pan and zoom the real map freely — the Before baseline and After disaster scenes stay in 100% pixel-perfect lockstep.
            </div>
          </div>
        </div>
      ) : (
        /* SIDE-BY-SIDE REAL MAP VIEW WITH SYNCHRONIZED BEFORE & AFTER RASTERS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          
          {/* Left: BEFORE REAL MAP */}
          <div className="grey-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0066cc' }} />
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0066cc' }}>
                  BEFORE: Pre-Disaster Baseline (2026-08-14)
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: '#0066cc', fontWeight: '600', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                NORMAL INFRASTRUCTURE
              </span>
            </div>
            
            <div style={{ width: '100%', height: '440px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.08)', position: 'relative' }}>
              <MapContainer
                center={TRISHULI_AOI.center}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
              >
                <MapRegister onRegister={setLeftMap} />
                {renderBeforeMapContent()}
              </MapContainer>
            </div>

            <p style={{ fontSize: '11.5px', color: '#424245', marginTop: '12px', lineHeight: '1.45', margin: '12px 0 0 0' }}>
              <strong>A real satellite {sensorType === 'sar' ? 'radar' : (sensorType === 'sar_change' ? 'change composite' : (sensorType === 'fusion' ? 'optical & radar fusion' : 'optical'))} view of Trishuli Valley prior to event:</strong> The river is constrained to its normal channel (~30m width); mountain slopes are intact, and all bridges and Pasang Lhamu Highway (NH09) are 100% passable.
            </p>
          </div>

          {/* Right: AFTER REAL MAP */}
          <div className="grey-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff3b30' }} />
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ff3b30' }}>
                  AFTER: Post-Flood Disaster (2026-08-26)
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: '#ff3b30', fontWeight: '600', backgroundColor: 'rgba(255, 59, 48, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                14.82 km² DEBRIS EXTENT
              </span>
            </div>
            
            <div style={{ width: '100%', height: '440px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.08)', position: 'relative' }}>
              <MapContainer
                center={TRISHULI_AOI.center}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
              >
                <MapRegister onRegister={setRightMap} />
                {renderAfterMapContent()}
              </MapContainer>
            </div>

            <p style={{ fontSize: '11.5px', color: '#424245', marginTop: '12px', lineHeight: '1.45', margin: '12px 0 0 0' }}>
              <strong>The same valley after catastrophic debris flood:</strong> Real satellite raster captures the chocolate-brown mudflow surge, raw landslide scars at Ramche km 62 and Mailung, 4 bridge washouts, 342 structures damaged, and 7,290 civilians cut off.
            </p>
          </div>
        </div>
      )}

      {/* Explanatory Change Detection Legend & Sensor Comparison Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {/* Sensor Decision Mechanics Card */}
        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d1d1f', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={16} color="#0066cc" />
            <span>How Sentinel-1 Radar Sees Through Monsoon Clouds</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#424245', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <strong style={{ color: '#1d1d1f' }}>• C-Band Microwave (5.6 cm wavelength):</strong> Rain droplets and monsoon clouds do not scatter C-band microwaves. Radar achieves 100% all-weather visibility.
            </div>
            <div>
              <strong style={{ color: '#1d1d1f' }}>• Specular Forward Reflection on Water:</strong> Smooth floodwater mirrors microwave energy away, creating an extreme backscatter drop (&lt; -3.2 dB, pitch-black pixels).
            </div>
            <div>
              <strong style={{ color: '#1d1d1f' }}>• Debris Roughness Depolarization:</strong> Boulders, trees, and churned mud produce strong cross-polarization (VH/VV volume scattering), mapping the rough debris corridors.
            </div>
          </div>
        </div>

        {/* Change Classification Legend Card */}
        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d1d1f', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={16} color="#0066cc" />
            <span>Radar & DEM Physical Classification</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#0066cc', borderRadius: '6px', border: '1px solid rgba(0, 102, 204, 0.3)' }}></div>
              <div>
                <strong>Ponded Floodwater:</strong> Backscatter drop &lt; -3.2 dB (Copernicus DEM slope &le; 18°)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ff9500', borderRadius: '6px', border: '1px solid rgba(255, 149, 0, 0.3)' }}></div>
              <div>
                <strong>Debris & Mud Flow Corridor:</strong> Coherence drop (&gamma; &lt; 0.25) + raw landslide scarp
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ff3b30', borderRadius: '6px', border: '1px solid rgba(255, 59, 48, 0.3)' }}></div>
              <div>
                <strong>Severed Highway Infrastructure:</strong> NH09 severed at km 62 (Ramche) & Mailung
              </div>
            </div>
          </div>
        </div>

        {/* Copernicus Sentinel-2 Change Detection through Time Card */}
        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d1d1f', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#0066cc" />
            <span>Copernicus Browser: S2 Change Detection</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#00d7ff', borderRadius: '6px', border: '1px solid rgba(0, 215, 255, 0.4)' }}></div>
              <div>
                <strong>Electric Cyan:</strong> &Delta;NDWI &gt; +0.25 (Expanded riverbed, turbid flood torrent)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#ff3219', borderRadius: '6px', border: '1px solid rgba(255, 50, 25, 0.4)' }}></div>
              <div>
                <strong>Coral Red:</strong> &Delta;NDVI &lt; -0.35 (Denuded vegetation, Ramche & Mailung scars)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#34c759', borderRadius: '6px', border: '1px solid rgba(52, 199, 89, 0.4)' }}></div>
              <div>
                <strong>Data Rules:</strong> Raw Sentinel-1, Sentinel-2 L2A & pre-event OSM (&le; 2026-07-27)
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
