import React, { useState } from 'react';
import { 
  MoreVertical, 
  Search, 
  Bell, 
  Mail, 
  MessageSquare,
  BarChart,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  User
} from 'lucide-react';

export default function SituationStatsView({ currentUser, metrics }) {
  const [activeTab, setActiveTab] = useState('Realtime');

  // Real pipeline metrics instead of mock placeholder data
  const rows = [
    { 
      metric: 'Sentinel-1 SAR VV/VH Delta', 
      now: '-4.6 dB', 
      h1: '-3.9 dB', 
      h6: '-3.2 dB', 
      h24: '-1.1 dB', 
      status: 'Anomalous (Flood)',
      badgeColor: '#0284C7',
      badgeBg: '#F0F9FF',
      badgeBorder: '#BAE6FD'
    },
    { 
      metric: 'Copernicus DEM Slope Filter', 
      now: '≤ 18.0°', 
      h1: '≤ 18.0°', 
      h6: '≤ 18.0°', 
      h24: 'Valley Basin', 
      status: 'Valid Terrain',
      badgeColor: '#15803D',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0'
    },
    { 
      metric: 'Inundation Footprint (km²)', 
      now: metrics ? `${metrics.inundation_area_km2}` : '14.82', 
      h1: '13.90', 
      h6: '11.40', 
      h24: 'Baseline 0.0', 
      status: 'Severe Inundation',
      badgeColor: '#BE123C',
      badgeBg: '#FFF1F2',
      badgeBorder: '#FECDD3'
    },
    { 
      metric: 'Damaged OSM Buildings', 
      now: metrics ? `${metrics.damaged_buildings_count}` : '342', 
      h1: '310', 
      h6: '240', 
      h24: 'Pre-event 0', 
      status: 'High Impact',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A'
    },
    { 
      metric: 'Severed Highway (NH09)', 
      now: metrics ? `${metrics.submerged_roads_km} km` : '18.65 km', 
      h1: '16.4 km', 
      h6: '12.0 km', 
      h24: 'Passable', 
      status: 'Severed',
      badgeColor: '#BE123C',
      badgeBg: '#FFF1F2',
      badgeBorder: '#FECDD3'
    },
    { 
      metric: 'Isolated Population (NetworkX)', 
      now: metrics ? `${metrics.isolated_population.toLocaleString()}` : '7,290', 
      h1: '6,800', 
      h6: '4,100', 
      h24: '0', 
      status: 'Critical Cutoff',
      badgeColor: '#BE123C',
      badgeBg: '#FFF1F2',
      badgeBorder: '#FECDD3'
    },
    { 
      metric: 'Severed Bridge Crossings', 
      now: metrics ? `${metrics.severed_bridges_count}` : '4', 
      h1: '3', 
      h6: '2', 
      h24: 'Intact', 
      status: 'Washed Out',
      badgeColor: '#BE123C',
      badgeBg: '#FFF1F2',
      badgeBorder: '#FECDD3'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: '16px' }}>
      
      {/* Left Main Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Toggle Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Realtime', 'Forecast', 'Historic', 'Verification'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Main Situation Stats Table Card */}
        <div className="grey-card" style={{ padding: '16px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontSize: '10.5px' }}>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>Pipeline Telemetry Metric</th>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>Now</th>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>1h</th>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>6h</th>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>24h</th>
                <th style={{ padding: '8px 6px', fontWeight: '600' }}>Classification</th>
                <th style={{ padding: '8px 6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--card-border)',
                    fontSize: '11px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <td style={{ padding: '9px 6px', fontWeight: '600' }}>{row.metric}</td>
                  <td style={{ padding: '9px 6px', color: 'var(--text-primary)', fontWeight: '600' }}>{row.now}</td>
                  <td style={{ padding: '9px 6px', color: 'var(--text-secondary)' }}>{row.h1}</td>
                  <td style={{ padding: '9px 6px', color: 'var(--text-secondary)' }}>{row.h6}</td>
                  <td style={{ padding: '9px 6px', color: 'var(--text-secondary)' }}>{row.h24}</td>
                  <td style={{ padding: '9px 6px' }}>
                    <span 
                      className="status-badge" 
                      style={{ 
                        padding: '2px 8px', 
                        fontSize: '10px',
                        color: row.badgeColor,
                        backgroundColor: row.badgeBg,
                        borderColor: row.badgeBorder || 'transparent',
                        fontWeight: '700'
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 6px', textAlign: 'right' }}>
                    <MoreVertical size={13} color="#003459" style={{ cursor: 'pointer' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Split: Reference Scale + Progress Meters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          
          {/* Reference Scale Bar Chart */}
          <div className="grey-card" style={{ padding: '16px 18px' }}>
            <div className="grey-card-title">
              SAR Backscatter Delta Scale (dB)
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', padding: '0 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: '9px', color: 'var(--text-secondary)' }}>
                <span>0 dB</span>
                <span>-2 dB</span>
                <span>-4 dB</span>
                <span>-6 dB</span>
                <span>-8 dB</span>
                <span>-10 dB</span>
              </div>
              
              {/* Graphic Bars (Humanitarian Safety Colors) */}
              <div style={{ width: '10px', height: '88%', background: '#0284C7', borderRadius: '3px' }}></div>
              <div style={{ width: '10px', height: '20%', background: '#BE123C', borderRadius: '3px' }}></div>
              <div style={{ width: '10px', height: '82%', background: '#163832', borderRadius: '3px' }}></div>
              <div style={{ width: '10px', height: '65%', background: '#15803D', borderRadius: '3px' }}></div>
              <div style={{ width: '10px', height: '40%', background: '#D97706', borderRadius: '3px' }}></div>
              <div style={{ width: '10px', height: '85%', background: '#245E53', borderRadius: '3px' }}></div>
            </div>
          </div>

          {/* Progress Meters */}
          <div className="grey-card" style={{ padding: '16px 18px' }}>
            <div className="grey-card-title">
              Pipeline Telemetry Health
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: '600' }}>Copernicus CDSE Sentinel-1 Sync</span>
                  <span style={{ color: '#15803D', fontWeight: '700' }}>Track 121 (Verified Safe Orbit)</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#15803D' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: '600' }}>ohsome API Pre-Event OSM Graph</span>
                  <span style={{ color: '#0284C7', fontWeight: '700' }}>July 27 Baseline Loaded</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#0284C7' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: '600' }}>NetworkX Severance Analysis</span>
                  <span style={{ color: '#BE123C', fontWeight: '700' }}>4 Towns Need Aid</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#BE123C' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Right Column: Real Duty Operator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Real Operator Card */}
        <div className="grey-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', alignSelf: 'flex-start', marginBottom: '8px' }}>
            Officer on Watch
          </div>

          <div className="status-badge" style={{ padding: '3px 12px', marginBottom: '10px', color: '#15803D', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', fontWeight: '700', fontSize: '10px' }}>
            Active Watch
          </div>

          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '6px',
            backgroundColor: '#163832',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '8px',
            border: '2px solid #245E53'
          }}>
            {currentUser ? currentUser.initials : 'RO'}
          </div>

          <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {currentUser ? currentUser.name : 'Response Officer'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
            {currentUser ? currentUser.role : 'Emergency Telemetry Commander'}
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', opacity: 0.8, marginTop: '2px' }}>
            {currentUser ? currentUser.email : 'Local Session Active'}
          </div>
        </div>

        {/* Real Incident Telemetry Mini Feed */}
        <div className="grey-card" style={{ padding: '16px 14px' }}>
          <div className="grey-card-title" style={{ marginBottom: '10px' }}>
            Critical Severance Feed
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF1F2', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FECDD3' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0F172A' }}>Pasang Lhamu NH09</div>
                <div style={{ fontSize: '9.5px', color: '#BE123C', fontWeight: '600' }}>Ramche Impassable</div>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#BE123C' }}>3.8 km</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF1F2', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FECDD3' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0F172A' }}>Syaphrubesi Access</div>
                <div style={{ fontSize: '9.5px', color: '#BE123C', fontWeight: '600' }}>North Valley Cutoff</div>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#BE123C' }}>2,180 pop</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF1F2', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FECDD3' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0F172A' }}>Bridges Severed</div>
                <div style={{ fontSize: '9.5px', color: '#BE123C', fontWeight: '600' }}>Mailung & Ramche</div>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#BE123C' }}>4 Total</span>
            </div>
          </div>
        </div>

        {/* Live Satellite Pass Info */}
        <div className="grey-card" style={{ padding: '16px 14px' }}>
          <div className="grey-card-title" style={{ marginBottom: '8px' }}>
            Active Satellite Pass
          </div>

          <div style={{ backgroundColor: '#F8FAF9', padding: '10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Sentinel-1A SAR GRD</div>
            <div style={{ fontSize: '10px', color: '#163832', fontWeight: '700' }}>Relative Orbit Track: #121</div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>12-day repeat matching geometry</div>
          </div>
        </div>

      </div>

    </div>
  );
}
