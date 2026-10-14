import React, { useState } from 'react';
import DevelopingIncidentSection from './DevelopingIncidentSection';
import HistoricalIncidentSection from './HistoricalIncidentSection';
import { TRANSLATIONS } from '../data/translations';
import { 
  Radio, 
  Layers, 
  Satellite, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  ArrowUpRight, 
  AlertTriangle,
  GitCompare,
  CheckCircle2,
  Clock3
} from 'lucide-react';

export default function OverviewView({ onNavigateToCompare, onNavigateToIncidents, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  // Selected flood state: '26aug' | '11oct' | 'both'
  const [selectedFlood, setSelectedFlood] = useState('both');

  return (
    <div className="overview-page" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Top Header Card with Integrated Pill Selector */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '22px',
        padding: '20px 24px',
        border: '1px solid rgba(10, 34, 19, 0.08)',
        boxShadow: '0 8px 24px rgba(10, 34, 19, 0.04), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#1e783e',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1e783e' }} />
              {t.overview.eyebrow}
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#0a2213',
              letterSpacing: '-0.025em',
              margin: '0 0 6px 0'
            }}>
              {t.overview.title}
            </h1>
            <p style={{
              fontSize: '12.5px',
              color: '#52735d',
              margin: 0,
              maxWidth: '680px',
              lineHeight: '1.5'
            }}>
              {selectedFlood === '26aug' 
                ? (lang === 'ne' 
                    ? '२६ अगस्ट २०२६ को त्रिशूली बेसिन बाढीको प्रमाणित उपग्रह तुलना, पूर्वाधार क्षति र मानवीय प्रतिवेदन समीक्षा गर्नुहोस्।' 
                    : 'Review verified satellite comparisons, highway disruptions, and agency reports for the 26 August 2026 Trishuli flood.')
                : selectedFlood === '11oct'
                  ? (lang === 'ne'
                      ? '११ अक्टोबर २०२६ को बुढीगण्डकी पहिरो नदी अवरोध, झोलुङ्गे पुल क्षति र प्रारम्भिक स्थल रिपोर्टिङ समीक्षा गर्नुहोस्।'
                      : 'Review preliminary field reporting and monitored data for the 11 October 2026 Budhi Gandaki incident.')
                  : t.overview.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10.5px',
              backgroundColor: 'rgba(30, 120, 62, 0.1)',
              color: '#1e783e',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontWeight: '600',
              border: '1px solid rgba(30, 120, 62, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <ShieldCheck size={12} color="#1e783e" />
              {t.overview.scope}
            </span>
          </div>
        </div>

        {/* Prominent Pill Switcher Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid rgba(10, 34, 19, 0.08)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          
          {/* Segmented Pill Selector */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f2f7f4',
            borderRadius: '9999px',
            padding: '4px',
            border: '1px solid rgba(10, 34, 19, 0.12)',
            boxShadow: 'inset 0 1px 2px rgba(10, 34, 19, 0.04)',
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            {/* Trishuli Flood 26 Aug Pill */}
            <button
              id="pill-trishuli-flood"
              type="button"
              onClick={() => setSelectedFlood('26aug')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 15px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: selectedFlood === '26aug' ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: selectedFlood === '26aug' ? '#0d2818' : 'transparent',
                color: selectedFlood === '26aug' ? '#ffffff' : '#0a2213',
                boxShadow: selectedFlood === '26aug' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: selectedFlood === '26aug' ? '#34d399' : '#1e783e',
                boxShadow: selectedFlood === '26aug' ? '0 0 6px #34d399' : 'none',
                display: 'inline-block'
              }} />
              <span>{t.overview.pillTrishuli}</span>
              <span style={{
                fontSize: '9.5px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: selectedFlood === '26aug' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(30, 120, 62, 0.1)',
                color: selectedFlood === '26aug' ? '#a7f3d0' : '#1e783e',
                fontWeight: '600'
              }}>
                Verified
              </span>
            </button>

            {/* Budhi Gandaki 11 Oct Pill */}
            <button
              id="pill-budhi-gandaki"
              type="button"
              onClick={() => setSelectedFlood('11oct')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 15px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: selectedFlood === '11oct' ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: selectedFlood === '11oct' ? '#0d2818' : 'transparent',
                color: selectedFlood === '11oct' ? '#ffffff' : '#0a2213',
                boxShadow: selectedFlood === '11oct' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: selectedFlood === '11oct' ? '#fbbf24' : '#d97706',
                boxShadow: selectedFlood === '11oct' ? '0 0 6px #fbbf24' : 'none',
                display: 'inline-block'
              }} />
              <span>{t.overview.pillBudhi}</span>
              <span style={{
                fontSize: '9.5px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: selectedFlood === '11oct' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                color: selectedFlood === '11oct' ? '#fde68a' : '#d97706',
                fontWeight: '600'
              }}>
                Developing
              </span>
            </button>

            {/* Both Floods / Side-by-Side Pill */}
            <button
              id="pill-compare-both"
              type="button"
              onClick={() => setSelectedFlood('both')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 15px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: selectedFlood === 'both' ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: selectedFlood === 'both' ? '#0d2818' : 'transparent',
                color: selectedFlood === 'both' ? '#ffffff' : '#0a2213',
                boxShadow: selectedFlood === 'both' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              <GitCompare size={13} color={selectedFlood === 'both' ? '#ffffff' : '#1e783e'} />
              <span>{t.overview.pillBoth}</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={onNavigateToIncidents}
              className="btn-white-pill"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              {t.overview.viewRegistry}
            </button>
            <button 
              type="button" 
              onClick={onNavigateToCompare}
              className="btn-dark-green-pill"
              style={{ fontSize: '11px', padding: '6px 14px' }}
            >
              <Satellite size={12} color="#ffffff" />
              <span>{t.overview.compareHistorical}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic Status Banner depending on selected filter */}
      <div className="overview-status-banner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: selectedFlood === '11oct' ? '#fffdf7' : '#f3f8f4',
        padding: '14px 20px',
        borderRadius: '16px',
        border: selectedFlood === '11oct' ? '1px solid #fae8b4' : '1px solid #c7dccb',
        boxShadow: '0 4px 16px rgba(24, 60, 43, 0.04)',
        flexWrap: 'wrap',
        gap: '12px',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: selectedFlood === '11oct' ? '#d97706' : '#1e783e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            {selectedFlood === '11oct' ? <Radio size={18} /> : selectedFlood === '26aug' ? <Satellite size={18} /> : <Layers size={18} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
                {selectedFlood === '26aug' 
                  ? t.overview.bannerTitleTrishuli 
                  : selectedFlood === '11oct' 
                    ? t.overview.bannerTitle 
                    : t.overview.bannerTitleBoth}
              </span>
              <span style={{
                fontSize: '9.5px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: selectedFlood === '11oct' ? 'rgba(255, 149, 0, 0.12)' : 'rgba(30, 120, 62, 0.12)',
                color: selectedFlood === '11oct' ? '#d97706' : '#1e783e',
                border: selectedFlood === '11oct' ? '1px solid rgba(255, 149, 0, 0.25)' : '1px solid rgba(30, 120, 62, 0.25)'
              }}>
                {selectedFlood === '26aug' 
                  ? t.overview.bannerEventTrishuli 
                  : selectedFlood === '11oct' 
                    ? t.overview.bannerEvent 
                    : t.overview.bannerEventBoth}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              {selectedFlood === '26aug' 
                ? t.overview.bannerSubTrishuli 
                : selectedFlood === '11oct' 
                  ? t.overview.bannerSub 
                  : t.overview.bannerSubBoth}
            </div>
          </div>
        </div>

        {/* Quick Attribute Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {selectedFlood === '26aug' && (
            <>
              <span style={{ fontSize: '10.5px', color: '#1e783e', backgroundColor: 'rgba(30, 120, 62, 0.08)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                Rasuwa District · Northern Border
              </span>
              <span style={{ fontSize: '10.5px', color: '#1e783e', backgroundColor: 'rgba(30, 120, 62, 0.08)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                4 Verified Satellite Pairs
              </span>
            </>
          )}
          {selectedFlood === '11oct' && (
            <>
              <span style={{ fontSize: '10.5px', color: '#b45309', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                Gorkha District · Gandaki
              </span>
              <span style={{ fontSize: '10.5px', color: '#b45309', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                2 Severed Suspension Bridges
              </span>
            </>
          )}
          {selectedFlood === 'both' && (
            <span style={{ fontSize: '10.5px', color: '#1e783e', backgroundColor: 'rgba(30, 120, 62, 0.08)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
              Cross-Basin Multi-Temporal Dataset
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparative Matrix (Rendered when 'both' is selected) */}
      {selectedFlood === 'both' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          border: '1px solid rgba(10, 34, 19, 0.08)',
          boxShadow: '0 4px 16px rgba(10, 34, 19, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <GitCompare size={16} color="#1e783e" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0a2213', margin: 0 }}>
              {lang === 'ne' ? 'घटना सारांश म्याट्रिक्स (२६ अगस्ट vs ११ अक्टोबर)' : 'Incident Summary Comparison Matrix (26 Aug vs 11 Oct)'}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(10, 34, 19, 0.12)', color: '#52735d' }}>
                  <th style={{ padding: '8px 12px', fontWeight: '700' }}>Dimension</th>
                  <th style={{ padding: '8px 12px', fontWeight: '700', color: '#1e783e' }}>
                    Incident A: Trishuli Flood (26 Aug 2026)
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: '700', color: '#d97706' }}>
                    Incident B: Budhi Gandaki Flood (11 Oct 2026)
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: '#0a2213' }}>
                <tr style={{ borderBottom: '1px solid rgba(10, 34, 19, 0.06)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#52735d' }}>Hazard Trigger</td>
                  <td style={{ padding: '8px 12px' }}>Glacier collapse &amp; Headwaters GLOF surge</td>
                  <td style={{ padding: '8px 12px' }}>Chumchet Landslide dam breach &amp; flash flood</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(10, 34, 19, 0.06)', backgroundColor: '#fafdfb' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#52735d' }}>River Basin &amp; District</td>
                  <td style={{ padding: '8px 12px' }}>Trishuli River Basin, Rasuwa District</td>
                  <td style={{ padding: '8px 12px' }}>Budhi Gandaki River, Gorkha District</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(10, 34, 19, 0.06)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#52735d' }}>Satellite Earth Observation</td>
                  <td style={{ padding: '8px 12px' }}>4 Verified Sentinel-2 / Landsat-9 SWIR pairs connected</td>
                  <td style={{ padding: '8px 12px' }}>Event-specific high-res pairs pending verification (no pair connected)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(10, 34, 19, 0.06)', backgroundColor: '#fafdfb' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#52735d' }}>Infrastructure Disruptions</td>
                  <td style={{ padding: '8px 12px' }}>Pasang Lhamu Highway (NH09) riverbank washouts</td>
                  <td style={{ padding: '8px 12px' }}>2 Suspension bridges (Nyakchet-Sirdibas, Soti) washed away</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#52735d' }}>Data Grounding Source</td>
                  <td style={{ padding: '8px 12px' }}>Copernicus Rapid Mapping &amp; ESA Space Support</td>
                  <td style={{ padding: '8px 12px' }}>ICIMOD Disaster Cutoff &amp; The Kathmandu Post Field Reports</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conditionally Rendered Incident Details based on selectedFlood */}
      {selectedFlood === '11oct' && (
        <DevelopingIncidentSection
          onNavigateToCompare={onNavigateToCompare}
          onNavigateToIncidents={onNavigateToIncidents}
          lang={lang}
        />
      )}

      {selectedFlood === '26aug' && (
        <HistoricalIncidentSection 
          onNavigateToCompare={onNavigateToCompare} 
          lang={lang} 
        />
      )}

      {selectedFlood === 'both' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 12px',
              backgroundColor: 'rgba(10, 34, 19, 0.04)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#0a2213'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e783e' }} />
              PART 1: HISTORICAL TRISHULI FLOOD (26 AUGUST 2026)
            </div>
            <HistoricalIncidentSection onNavigateToCompare={onNavigateToCompare} lang={lang} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 12px',
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#92400e'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
              PART 2: DEVELOPING BUDHI GANDAKI FLOOD (11 OCTOBER 2026)
            </div>
            <DevelopingIncidentSection
              onNavigateToCompare={onNavigateToCompare}
              onNavigateToIncidents={onNavigateToIncidents}
              lang={lang}
            />
          </div>
        </>
      )}

    </div>
  );
}

