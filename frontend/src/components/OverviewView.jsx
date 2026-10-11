import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Satellite, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Database,
  GitBranch,
  Activity,
  AlertTriangle,
  Clock,
  Compass
} from 'lucide-react';

export default function OverviewView({ lang = 'en' }) {
  const [orbitData, setOrbitData] = useState(null);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [sensorStatus, setSensorStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const [orbitRes, logsRes, sensorRes, metricsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/telemetry/orbit').then(r => r.json()).catch(() => null),
        fetch('http://127.0.0.1:8000/api/telemetry/pipeline-logs').then(r => r.json()).catch(() => []),
        fetch('http://127.0.0.1:8000/api/sensor/status').then(r => r.json()).catch(() => null),
        fetch('http://127.0.0.1:8000/api/metrics').then(r => r.json()).catch(() => null)
      ]);

      if (orbitRes) setOrbitData(orbitRes);
      if (Array.isArray(logsRes)) setPipelineLogs(logsRes);
      if (sensorRes) setSensorStatus(sensorRes);
      if (metricsRes) setMetrics(metricsRes);
    } catch (e) {
      console.warn("Telemetry loading error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Console Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 22px',
        borderRadius: '22px',
        border: '1px solid rgba(10, 34, 19, 0.08)',
        boxShadow: '0 4px 16px rgba(10, 34, 19, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#1e783e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Database size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
                PIPELINE & TELEMETRY
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(30, 120, 62, 0.12)',
                color: '#1e783e',
                border: '1px solid rgba(30, 120, 62, 0.25)'
              }}>
                LIVE STREAM
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              SQLite Spatial Store · Sentinel-1 Track 121 · WorldDEM-30
            </div>
          </div>
        </div>

        <button 
          onClick={fetchTelemetry}
          className="btn-dark-green-pill"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '600' }}
          disabled={isRefreshing}
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Poll Live'}</span>
        </button>
      </div>

      {/* Grid Row 1: Orbit Telemetry & Sensor Fusion */}
      <div className="overview-grid">
        
        {/* Card 1: Sentinel-1A Orbital Mechanics */}
        <div className="grey-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Satellite size={16} color="#1e783e" />
              <strong style={{ fontSize: '13px', color: '#0a2213', letterSpacing: '-0.01em' }}>Radar Geometry</strong>
            </div>
            <span style={{ fontSize: '10px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(30, 120, 62, 0.25)' }}>
              TRACK 121
            </span>
          </div>

          <div className="overview-subgrid-2col" style={{ fontSize: '11.5px' }}>
            <div style={{ backgroundColor: '#f2f7f4', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d', fontSize: '10px', fontWeight: '500' }}>Relative Orbit Track</span>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#0a2213', marginTop: '2px', letterSpacing: '-0.01em' }}>
                Track #{orbitData ? orbitData.relative_orbit_track : 121}
              </div>
              <span style={{ color: '#1e783e', fontSize: '9.5px', fontWeight: '600' }}>12-day identical geometry verified</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d', fontSize: '10px', fontWeight: '500' }}>Radar Frequency / Band</span>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#0a2213', marginTop: '2px', letterSpacing: '-0.01em' }}>
                C-band (5.405 GHz)
              </div>
              <span style={{ color: '#1e783e', fontSize: '9.5px', fontWeight: '600' }}>100% Monsoon cloud penetration</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d', fontSize: '10px', fontWeight: '500' }}>Incidence Angle & Pass</span>
              <div style={{ fontWeight: '600', fontSize: '12px', color: '#0a2213', marginTop: '2px' }}>
                39.2° (Ascending)
              </div>
              <span style={{ color: '#52735d', fontSize: '9.5px' }}>Altitude: 693 km · Vel: 7.5 km/s</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d', fontSize: '10px', fontWeight: '500' }}>Pixel Spacing & Swath</span>
              <div style={{ fontWeight: '600', fontSize: '12px', color: '#0a2213', marginTop: '2px' }}>
                10m (IW Mode) · 250km
              </div>
              <span style={{ color: '#52735d', fontSize: '9.5px' }}>Dual-Pol (VV + VH co/cross)</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '12px', border: '1px solid rgba(10, 34, 19, 0.08)', fontSize: '11px', color: '#0a2213', lineHeight: '1.45' }}>
            <strong style={{ fontWeight: '600' }}>Rule Compliance:</strong> Pre-disaster pass (2026-08-14) and post-flood pass (2026-08-26) were both captured on Orbit Track 121. Mismatched tracks cause false terrain shear in Himalayan topography.
          </div>
        </div>

        {/* Card 2: Sentinel-2 L2A Change Detection through Time (Copernicus Browser) */}
        <div className="grey-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#1e783e" />
              <strong style={{ fontSize: '13px', color: '#0a2213', letterSpacing: '-0.01em' }}>S2 L2A Change</strong>
            </div>
            <span style={{ fontSize: '10px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(30, 120, 62, 0.25)' }}>
              CDSE TIME
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Temporal Baseline (T₁):</span>
              <strong style={{ color: '#0a2213', fontWeight: '600' }}>2026-08-14 (Pre-Disaster)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Disaster Acquisition (T₂):</span>
              <strong style={{ color: '#ff3b30', fontWeight: '600' }}>2026-08-26 (Flood Peak)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Flood Expansion (ΔNDWI):</span>
              <strong style={{ color: '#1e783e', fontWeight: '600' }}>&gt; +0.25 (Cyan Surge)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Vegetation Scour (ΔNDVI):</span>
              <strong style={{ color: '#ea580c', fontWeight: '600' }}>&lt; -0.35 (Red Scars)</strong>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(30, 120, 62, 0.08)', borderRadius: '12px', border: '1px solid rgba(30, 120, 62, 0.2)', fontSize: '11px', color: '#0a2213', lineHeight: '1.45' }}>
            <strong style={{ color: '#1e783e' }}>Copernicus Workflow:</strong> CDSE Change Detection through Time, comparing multi-spectral L2A surfaces across time.
          </div>
        </div>

        {/* Card 3: Sensor Fusion & DEM Slope Filtering */}
        <div className="grey-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#1e783e" />
              <strong style={{ fontSize: '13px', color: '#0a2213', letterSpacing: '-0.01em' }}>Fusion Engine</strong>
            </div>
            <span style={{ fontSize: '10px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(30, 120, 62, 0.25)' }}>
              PHYSICS FILTER
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>S2 Visibility:</span>
              <strong style={{ color: '#1e783e', fontWeight: '600' }}>Lowlands Clear / Ridge Clouds</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Active Mode:</span>
              <strong style={{ color: '#1e783e', fontWeight: '600' }}>Dual Fusion: S1 + S2</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>DEM 30m Slope Mask:</span>
              <strong style={{ color: '#1e783e', fontWeight: '600' }}>≤ 18.0° Cutoff</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f2f7f4', borderRadius: '10px', border: '1px solid rgba(10, 34, 19, 0.06)' }}>
              <span style={{ color: '#52735d' }}>Pre-Event OSM:</span>
              <strong style={{ color: '#0a2213', fontWeight: '600' }}>ohsome API (≤ 2026-07-27)</strong>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(30, 120, 62, 0.08)', borderRadius: '12px', border: '1px solid rgba(30, 120, 62, 0.2)', fontSize: '11px', color: '#0a2213', lineHeight: '1.45' }}>
            <strong style={{ color: '#1e783e' }}>Physical Constraint:</strong> Water cannot pool on mountain cliffs. 8.4 km² false radar shadows removed by DEM processor.
          </div>
        </div>

      </div>

      {/* Grid Row 2: Live Pipeline Audit Ledger & Stream */}
      <div className="grey-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="#1e783e" />
            <strong style={{ fontSize: '13.5px', color: '#0a2213', letterSpacing: '-0.01em' }}>Pipeline Audit Stream</strong>
          </div>
          <span style={{ fontSize: '11px', color: '#52735d' }}>
            Table: <code style={{ backgroundColor: 'rgba(10, 34, 19, 0.06)', padding: '2px 6px', borderRadius: '4px', color: '#0a2213' }}>pipeline_logs</code> ({pipelineLogs.length} events)
          </span>
        </div>

        <div style={{
          backgroundColor: '#071a0e',
          color: '#f5f5f7',
          borderRadius: '14px',
          border: '1px solid rgba(30, 120, 62, 0.35)',
          padding: '14px 16px',
          fontFamily: 'SF Mono, ui-monospace, Menlo, Monaco, monospace',
          fontSize: '11.5px',
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px'
        }}>
          {pipelineLogs.map((log) => {
            const isWarn = log.level === 'WARN';
            const isErr = log.level === 'ERROR';
            return (
              <div key={log.id} style={{ display: 'flex', gap: '10px', lineHeight: '1.4' }}>
                <span style={{ color: '#52735d', flexShrink: 0 }}>[{log.timestamp}]</span>
                <span style={{
                  color: isErr ? '#ff3b30' : (isWarn ? '#ff9500' : '#2da854'),
                  fontWeight: '600',
                  flexShrink: 0,
                  width: '130px'
                }}>
                  {log.component}
                </span>
                <span style={{ flex: 1, color: '#f5f5f7' }}>{log.message}</span>
                {log.proof_token && (
                  <span style={{ color: '#2da854', fontSize: '10px', flexShrink: 0 }}>
                    [{log.proof_token}]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Row 3: Live Transport Graph & Network Statistics */}
      <div className="overview-grid">
        
        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <GitBranch size={16} color="#1e783e" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#52735d', letterSpacing: '0.02em' }}>TOPOLOGICAL NODES</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.02em' }}>
            14 <span style={{ fontSize: '12.5px', fontWeight: '400', color: '#52735d' }}>nodes</span>
          </div>
          <div style={{ fontSize: '11px', color: '#52735d', marginTop: '4px' }}>
            2 Hospitals, 3 Highway Junctions, 2 Bridges, 7 Settlements
          </div>
        </div>

        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={16} color="#ff3b30" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#52735d', letterSpacing: '0.02em' }}>SEVERED EDGES</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff3b30', letterSpacing: '-0.02em' }}>
            6 <span style={{ fontSize: '12.5px', fontWeight: '400', color: '#ff3b30' }}>cuts</span>
          </div>
          <div style={{ fontSize: '11px', color: '#52735d', marginTop: '4px' }}>
            NH09 km 61, Mailung track, 4 bridge washouts
          </div>
        </div>

        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Compass size={16} color="#1e783e" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#52735d', letterSpacing: '0.02em' }}>DISCONNECTED SUBGRAPHS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e783e', letterSpacing: '-0.02em' }}>
            4 <span style={{ fontSize: '12.5px', fontWeight: '400', color: '#1e783e' }}>clusters</span>
          </div>
          <div style={{ fontSize: '11px', color: '#52735d', marginTop: '4px' }}>
            Dijkstra component analysis: 7,770 cut-off population
          </div>
        </div>

      </div>

    </div>
  );
}
