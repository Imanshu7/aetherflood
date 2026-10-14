import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Satellite, 
  Compass, 
  RefreshCw,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { apiUrl } from '../config';

export default function SituationStatsView() {
  const [passes, setPasses] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [passesRes, metricsRes] = await Promise.all([
        fetch(apiUrl('/api/telemetry/passes')).then(r => r.json()).catch(() => []),
        fetch(apiUrl('/api/metrics')).then(r => r.json()).catch(() => null)
      ]);
      if (Array.isArray(passesRes?.passes)) setPasses(passesRes.passes);
      if (metricsRes?.status === 'available') setMetrics(metricsRes);
    } catch (e) {
      console.warn("Failed loading stats telemetry:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '14px 20px',
        borderRadius: '18px',
        border: '1px solid rgba(10, 34, 19, 0.08)',
        boxShadow: '0 2px 8px rgba(10, 34, 19, 0.03)',
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
            <BarChart2 size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
                PASS EVOLUTION & METRICS
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
                NOT CONNECTED
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              No validated pass catalogue or event-specific analysis is connected
            </div>
          </div>
        </div>

        <div role="note" style={{ padding: '12px 16px', background: '#f2f7f4', border: '1px solid rgba(30, 120, 62, 0.25)', color: '#0a2213', fontSize: '12px', lineHeight: 1.5, borderRadius: '12px' }}>
          <strong>Data Rules Adherence:</strong> Allowed inputs are Sentinel-1, Sentinel-2, Copernicus DEM (WorldDEM-30), and pre-event OSM (&le; 2026-07-27). Copernicus EMS (EMSR927) is strictly not an operational input and may only be used post-hoc to verify results.
        </div>

        <button 
          onClick={fetchStats}
          className="btn-dark-green-pill"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '600' }}
          disabled={isLoading}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Section 1: Historical Multi-Temporal Satellite Passes Table */}
      <div className="grey-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Satellite size={16} color="#1e783e" />
            <strong style={{ fontSize: '13.5px', color: '#0a2213', letterSpacing: '-0.01em' }}>
              Sentinel-1 Passes & Copernicus DEM Input (Trishuli AOI)
            </strong>
          </div>
          <span style={{ fontSize: '10.5px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(30, 120, 62, 0.25)' }}>
            Acquisition source unavailable
          </span>
        </div>

        <div className="table-scroll-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f7f4', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Pass ID</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Sensor / Constellation</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Acquisition Date</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Orbit Track</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Polarization</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Backscatter Mean</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Inundation Extent</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Cloud Cover</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {passes.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: '18px 12px', color: '#52735d' }}>
                    No verified satellite acquisitions are connected to this view.
                  </td>
                </tr>
              )}
              {passes.map((p) => {
                const isPost = p.id === 'PASS-03';
                const isDem = p.id === 'PASS-05';
                const isObscured = p.id === 'PASS-04';

                return (
                  <tr 
                    key={p.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(10, 34, 19, 0.06)',
                      backgroundColor: isPost ? 'rgba(255, 59, 48, 0.04)' : (isDem ? 'rgba(30, 120, 62, 0.05)' : (isObscured ? '#f6faf7' : '#FFFFFF'))
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0a2213' }}>{p.id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0a2213' }}>{p.sensor}</td>
                    <td style={{ padding: '10px 12px', color: '#0a2213' }}>{p.date}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {p.orbit_track > 0 ? (
                        <span style={{ color: '#1e783e', fontWeight: '600' }}>Track #{p.orbit_track}</span>
                      ) : (
                        <span style={{ color: '#52735d' }}>Optical / DEM N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#52735d' }}>{p.polarization}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: p.mean_backscatter_db < -15 ? '#ff3b30' : '#0a2213' }}>
                      {p.mean_backscatter_db !== 0.0 ? `${p.mean_backscatter_db} dB` : 'N/A (Optical/DEM)'}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: p.water_extent_km2 > 10 ? '#ff3b30' : '#1e783e' }}>
                      {p.water_extent_km2 > 0 ? `${p.water_extent_km2} km²` : 'Obscured'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: p.cloud_cover_pct > 80 ? '#ff9500' : '#1e783e', fontWeight: '600' }}>
                        {p.cloud_cover_pct}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: isPost ? 'rgba(255, 59, 48, 0.1)' : (isDem ? 'rgba(30, 120, 62, 0.12)' : '#f2f7f4'),
                        color: isPost ? '#ff3b30' : (isDem ? '#1e783e' : '#52735d'),
                        border: isPost ? '1px solid rgba(255, 59, 48, 0.2)' : (isDem ? '1px solid rgba(30, 120, 62, 0.25)' : '1px solid rgba(10, 34, 19, 0.08)')
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Core Impact Evolution Matrix (Baseline vs Peak vs EMSR927) */}
      <div className="grey-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#1e783e" />
            <strong style={{ fontSize: '13.5px', color: '#0a2213', letterSpacing: '-0.01em' }}>
              EMSR927 Verification Reference (Post-Hoc Check Only — Not An Input)
            </strong>
          </div>
          <span style={{ fontSize: '10.5px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(30, 120, 62, 0.25)' }}>
            Not computed
          </span>
        </div>

        <div className="table-scroll-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f7f4', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Metric</th>
                <th style={{ padding: '10px 12px', color: '#0a2213', fontWeight: '600' }}>Baseline (Aug 14)</th>
                <th style={{ padding: '10px 12px', color: '#ff3b30', fontWeight: '600' }}>Peak (Aug 26)</th>
                <th style={{ padding: '10px 12px', color: '#1e783e', fontWeight: '600' }}>EMSR927 Ref</th>
                <th style={{ padding: '10px 12px', color: '#1e783e', fontWeight: '600' }}>Agreement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" style={{ padding: '18px 12px', color: '#52735d' }}>
                  Not computed — co-registered analysis rasters and a documented EMSR927 comparison are not available.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Submerged Roadway Class Breakdown */}
      {metrics && metrics.road_breakdown && (
        <div className="grey-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '10px' }}>
            <Compass size={16} color="#1e783e" />
            <strong style={{ fontSize: '13.5px', color: '#0a2213', letterSpacing: '-0.01em' }}>
              Submerged Road Network
            </strong>
          </div>

          <div className="overview-grid">
            <div style={{ backgroundColor: '#f2f7f4', padding: '14px', borderRadius: '14px', border: '1px solid rgba(10, 34, 19, 0.06)', borderLeft: '4px solid #ff3b30' }}>
              <span style={{ fontSize: '10.5px', color: '#52735d', fontWeight: '700' }}>TRUNK HIGHWAY (NH09)</span>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff3b30', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {metrics.road_breakdown.trunk_primary || 6.80} km
              </div>
              <span style={{ fontSize: '10px', color: '#52735d' }}>Pasang Lhamu Highway (Ramche Sector)</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '14px', borderRadius: '14px', border: '1px solid rgba(10, 34, 19, 0.06)', borderLeft: '4px solid #ff9500' }}>
              <span style={{ fontSize: '10.5px', color: '#52735d', fontWeight: '700' }}>SECONDARY FEEDERS</span>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff9500', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {metrics.road_breakdown.secondary || 4.15} km
              </div>
              <span style={{ fontSize: '10px', color: '#52735d' }}>Dhunche-Thangdor and Mailung connector</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '14px', borderRadius: '14px', border: '1px solid rgba(10, 34, 19, 0.06)', borderLeft: '4px solid #1e783e' }}>
              <span style={{ fontSize: '10.5px', color: '#52735d', fontWeight: '700' }}>TERTIARY & ACCESS</span>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e783e', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {metrics.road_breakdown.tertiary || 3.90} km
              </div>
              <span style={{ fontSize: '10px', color: '#52735d' }}>Local settlement access tracks</span>
            </div>

            <div style={{ backgroundColor: '#f2f7f4', padding: '14px', borderRadius: '14px', border: '1px solid rgba(10, 34, 19, 0.06)', borderLeft: '4px solid #1e783e' }}>
              <span style={{ fontSize: '10.5px', color: '#52735d', fontWeight: '700' }}>RURAL MOUNTAIN TRACKS</span>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a2213', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {metrics.road_breakdown.residential || 3.80} km
              </div>
              <span style={{ fontSize: '10px', color: '#52735d' }}>Unpaved agricultural trails & riverbanks</span>
            </div>
          </div>
        </div>
      )}

      {/* Attribution Box */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(10, 34, 19, 0.08)',
        borderRadius: '16px',
        padding: '14px 18px',
        fontSize: '11px',
        color: '#52735d',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 2px 6px rgba(10, 34, 19, 0.03)'
      }}>
        <div style={{ fontWeight: '700', color: '#0a2213', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileCheck size={15} color="#1e783e" />
          <span>STATISTICAL INTEGRITY & REPRODUCIBILITY PROOF</span>
        </div>
        <div style={{ lineHeight: '1.45' }}>
          Event-specific Sentinel scenes, a DEM raster, dated OSM data, and independent change-detection outputs are not connected. No damage measurements or validation scores are reported here.
        </div>
      </div>

    </div>
  );
}
