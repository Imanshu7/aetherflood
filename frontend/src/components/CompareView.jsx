import React from 'react';
import { Satellite, Mountain, Map as MapIcon, ShieldCheck } from 'lucide-react';
import Sentinel2BeforeAfterSection from './Sentinel2BeforeAfterSection';

const panelStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(10, 34, 19, 0.08)',
  borderRadius: '18px',
  padding: '18px'
};

// Authorized inputs under the competition data rules. Everything the compare
// workspace renders is derived from one of these sources.
const ALLOWED_INPUTS = [
  { icon: Satellite, name: 'Sentinel-1 SAR', note: 'Same-orbit-track GRD pairs for change detection.' },
  { icon: Satellite, name: 'Sentinel-2 optical', note: 'Pre/post-event L1C true-colour imagery (shown below).' },
  { icon: Mountain, name: 'Copernicus DEM', note: 'WorldDEM-30 terrain slope masking.' },
  { icon: MapIcon, name: 'Pre-event OpenStreetMap', note: 'Snapshot on or before 27 Jul 2026; no post-event edits.' }
];

/**
 * Flood comparison workspace built ONLY from authorized inputs.
 * Published damage maps (Copernicus EMS, UNOSAT) and post-event OSM edits are
 * prohibited as inputs under the competition rules; they may only be referenced
 * after the fact to check results, so nothing from them is fetched or rendered.
 */
export default function CompareView() {
  return (
    <div className="ems-compare">
      <section className="ems-compare-hero" style={{ ...panelStyle, padding: '22px' }} aria-labelledby="compare-title">
        <div className="ems-compare-heading">
          <div>
            <div className="ems-compare-eyebrow">Compare workspace · source-linked monitoring</div>
            <h1 id="compare-title">Flood comparison workspace</h1>
            <p>
              Review source-verified Sentinel-2 before/after acquisitions for the 26 August
              Nepal–Tibet flood alongside the documented evidence for the region. Every layer here
              derives from an authorized input; no published damage map is ingested.
            </p>

            <div style={{ backgroundColor: 'rgba(30, 120, 62, 0.08)', border: '1px solid rgba(30, 120, 62, 0.22)', borderRadius: '10px', padding: '10px 14px', marginTop: '12px', fontSize: '11.5px', color: '#0a2213', lineHeight: '1.5' }}>
              <strong style={{ color: '#1e783e' }}>Data Rules Adherence:</strong> Allowed inputs are Sentinel-1, Sentinel-2, Copernicus DEM (WorldDEM-30), pre-event OpenStreetMap (≤ 27 Jul 2026), and the listed training datasets. Copernicus EMS, UNOSAT and any other published damage maps — plus OpenStreetMap edits made after the event — are <em>prohibited as inputs</em> and may only be used after the fact to check results.
            </div>
          </div>
        </div>
      </section>

      {/* Authorized inputs panel */}
      <section style={panelStyle} aria-labelledby="allowed-inputs-title">
        <div className="ems-section-heading">
          <div>
            <div className="ems-compare-eyebrow">Compliant data sources</div>
            <h3 id="allowed-inputs-title">Authorized inputs used in this workspace</h3>
          </div>
          <ShieldCheck size={17} color="#1e783e" aria-hidden="true" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '14px' }}>
          {ALLOWED_INPUTS.map(({ icon: Icon, name, note }) => (
            <div key={name} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', border: '1px solid rgba(10, 34, 19, 0.08)', borderRadius: '12px', backgroundColor: '#f3f8f4' }}>
              <Icon size={16} color="#1e783e" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0a2213' }}>{name}</div>
                <div style={{ fontSize: '11px', color: '#687d70', marginTop: '2px', lineHeight: '1.5' }}>{note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sentinel-2 before/after comparison — the allowed optical input */}
      <Sentinel2BeforeAfterSection />

      <div className="ems-compare-footer">
        <span>Authorized inputs only: Copernicus Sentinel-1 / Sentinel-2, Copernicus DEM, pre-event OpenStreetMap.</span>
        <span>Published damage maps (Copernicus EMS, UNOSAT) are prohibited as inputs and are not shown.</span>
      </div>
    </div>
  );
}
