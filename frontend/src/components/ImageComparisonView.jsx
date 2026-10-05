import React, { useState, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function ImageComparisonView() {
  const [comparisonMode, setComparisonMode] = useState('slider'); // 'slider' | 'side-by-side' | 'difference'
  const [sensorType, setSensorType] = useState('sar'); // 'sar' | 'optical'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isDragging && e.buttons !== 1) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Mode Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: '4px',
        border: '1.5px solid #CBD5E1'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SplitSquareVertical size={18} color="#163832" />
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              SATELLITE CHANGE DETECTION: BEFORE VS AFTER
            </h2>
            <span style={{
              fontSize: '10px',
              backgroundColor: '#ECFDF5',
              color: '#15803D',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #A7F3D0'
            }}>
              ORBIT TRACK #121 (IDENTICAL GEOMETRY)
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Compare pre- and post-flood imagery to map inundation, debris corridors, and severed mountain infrastructure.
          </p>
        </div>

        {/* View Mode & Sensor Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sensor Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setSensorType('sar')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: sensorType === 'sar' ? '#163832' : 'transparent',
                color: sensorType === 'sar' ? '#FFFFFF' : '#334155'
              }}
            >
              Sentinel-1 SAR (Radar)
            </button>
            <button
              onClick={() => setSensorType('optical')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: sensorType === 'optical' ? '#163832' : 'transparent',
                color: sensorType === 'optical' ? '#FFFFFF' : '#334155'
              }}
            >
              Sentinel-2 (Optical)
            </button>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setComparisonMode('slider')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: comparisonMode === 'slider' ? '#0284C7' : 'transparent',
                color: comparisonMode === 'slider' ? '#FFFFFF' : '#334155'
              }}
            >
              Interactive Slider
            </button>
            <button
              onClick={() => setComparisonMode('side-by-side')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                backgroundColor: comparisonMode === 'side-by-side' ? '#0284C7' : 'transparent',
                color: comparisonMode === 'side-by-side' ? '#FFFFFF' : '#334155'
              }}
            >
              Side-by-Side
            </button>
          </div>

          {/* Mask Overlay Toggle */}
          <button
            onClick={() => setShowMaskOverlay(!showMaskOverlay)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1.5px solid #CBD5E1',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: showMaskOverlay ? '#FEF3C7' : '#FFFFFF',
              color: showMaskOverlay ? '#92400E' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Sparkles size={13} color={showMaskOverlay ? '#D97706' : '#64748B'} />
            <span>AI Change Mask: {showMaskOverlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Official Rule & Technical Context Box */}
      <div style={{
        backgroundColor: '#FFFBEB',
        border: '1.5px solid #FCD34D',
        borderRadius: '4px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#78350F',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} color="#B45309" />
          <span>
            <strong>Orbit Geometry Constraint (Slide 4):</strong> Pre-event image (2026-08-14) and Post-event image (2026-08-26) are acquired from the <em>same relative orbit track #121</em> (12 days apart) at the exact same viewing angle. Cross-orbit comparisons introduce geometric shear in steep mountain valleys that would produce false pixel changes.
          </span>
        </div>
        <div style={{ fontWeight: '700', color: '#92400E', fontSize: '10.5px' }}>
          Trishuli Valley AOI: 28.085°N, 85.225°E
        </div>
      </div>

      {/* Main Interactive Comparison Display */}
      {comparisonMode === 'slider' ? (
        /* INTERACTIVE SWIPE / SPLIT SLIDER VIEW */
        <div className="grey-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: '700' }}>
            <span style={{ color: '#163832' }}>
              ◀ BEFORE EVENT (2026-08-14) · Pre-Flood Baseline
            </span>
            <span style={{ color: '#0284C7' }}>
              Drag slider to inspect changes ({sliderPosition}%)
            </span>
            <span style={{ color: '#BE123C' }}>
              AFTER EVENT (2026-08-26) · Post-Flood Debris Corridor ▶
            </span>
          </div>

          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            style={{
              position: 'relative',
              width: '100%',
              height: '520px',
              backgroundColor: '#1E293B',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'ew-resize',
              userSelect: 'none',
              border: '2px solid #CBD5E1'
            }}
          >
            {/* BACKGROUND LAYER: AFTER EVENT SCENE */}
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <RadarSceneSVG 
                isAfter={true} 
                sensor={sensorType} 
                showMask={showMaskOverlay} 
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid #475569'
              }}>
                AFTER: Debris Flood & Ponded Mud (2026-08-26)
              </div>
            </div>

            {/* FOREGROUND LAYER: BEFORE EVENT SCENE (CLIPPED BY SLIDER) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              width: `${sliderPosition}%`,
              height: '100%',
              overflow: 'hidden',
              borderRight: '3px solid #FFFFFF',
              boxShadow: '2px 0 10px rgba(0,0,0,0.5)'
            }}>
              <div style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%', height: '100%' }}>
                <RadarSceneSVG 
                  isAfter={false} 
                  sensor={sensorType} 
                  showMask={false} 
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid #475569'
              }}>
                BEFORE: Baseline Mountain Valley (2026-08-14)
              </div>
            </div>

            {/* DRAGGABLE HANDLE */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `${sliderPosition}%`,
              transform: 'translate(-50%, -50%)',
              width: '36px',
              height: '36px',
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              border: '2px solid #163832',
              cursor: 'ew-resize',
              zIndex: 10
            }}>
              <SplitSquareVertical size={18} color="#163832" />
            </div>
          </div>
        </div>
      ) : (
        /* SIDE-BY-SIDE VIEW (MATCHING SLIDE 2 WIREFRAME) */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Left: BEFORE */}
          <div className="grey-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#163832' }}>
                BEFORE
              </div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                Sentinel-1 SAR · 2026-08-14
              </span>
            </div>
            
            <div style={{ width: '100%', height: '380px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid #CBD5E1', position: 'relative' }}>
              <RadarSceneSVG isAfter={false} sensor={sensorType} showMask={false} />
            </div>

            <p style={{ fontStyle: 'italic', fontSize: '11px', color: '#475569', marginTop: '10px', lineHeight: '1.4' }}>
              <strong>A radar view of a mountain valley.</strong> The river shows as a thin dark line; slopes facing the satellite appear bright. (Identical to competition challenge specification).
            </p>
          </div>

          {/* Right: AFTER */}
          <div className="grey-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#BE123C' }}>
                AFTER
              </div>
              <span style={{ fontSize: '10px', color: '#BE123C', fontWeight: '700' }}>
                Sentinel-1 SAR · 2026-08-26 (+12 Days)
              </span>
            </div>
            
            <div style={{ width: '100%', height: '380px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid #CBD5E1', position: 'relative' }}>
              <RadarSceneSVG isAfter={true} sensor={sensorType} showMask={showMaskOverlay} />
            </div>

            <p style={{ fontStyle: 'italic', fontSize: '11px', color: '#475569', marginTop: '10px', lineHeight: '1.4' }}>
              <strong>The same valley after a debris flood:</strong> a wide, rough corridor of mud and rock with dark ponded water. Your system finds this change automatically.
            </p>
          </div>
        </div>
      )}

      {/* Explanatory Change Detection Legend & Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        <div className="grey-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
            How Radar Sees the Mountain Valley
          </div>
          <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <strong style={{ color: '#0F172A' }}>• Calm Water (Specular Mirror):</strong> Radar pulses bounce forward away from the satellite, returning zero echo. Water appears pitch-black.
            </div>
            <div>
              <strong style={{ color: '#0F172A' }}>• Facing Slopes (Layover & Foreshortening):</strong> Mountain faces oriented toward the radar beam concentrate energy, returning intense bright pixels.
            </div>
            <div>
              <strong style={{ color: '#0F172A' }}>• Debris & Mud Corridors:</strong> Boulders, saturated silt, and fallen timber create surface roughness, creating a wide textured corridor easily segmented by log-ratio delta.
            </div>
          </div>
        </div>

        <div className="grey-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
            Change Classification Legend
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#0284C7', borderRadius: '3px', border: '1px solid #0369A1' }}></div>
              <div>
                <strong>Ponded Floodwater:</strong> Backscatter delta &lt; -3.2 dB (Copernicus DEM slope &le; 18°)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#D97706', borderRadius: '3px', border: '1px solid #B45309' }}></div>
              <div>
                <strong>Debris & Mud Flow Corridor:</strong> Coherence drop (&gamma; &lt; 0.25) along valley thalweg
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', backgroundColor: '#BE123C', borderRadius: '3px', border: '1px solid #9F1239' }}></div>
              <div>
                <strong>Severed Road Infrastructure:</strong> Pre-event OSM Pasang Lhamu Highway (NH09) severed
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/**
 * High-Fidelity SVG Graphic rendering the exact SAR Radar Mountain Valley scene
 * from Slide 2 (Before thin river line vs After wide debris flood corridor).
 */
function RadarSceneSVG({ isAfter, sensor, showMask }) {
  return (
    <svg 
      viewBox="0 0 800 450" 
      preserveAspectRatio="xMidYMid slice" 
      style={{ width: '100%', height: '100%', backgroundColor: '#2B2D2F', display: 'block' }}
    >
      <defs>
        {/* Radar terrain noise filter simulating C-band SAR speckle */}
        <filter id={`radarSpeckle-${isAfter ? 'after' : 'before'}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 0.45 0" />
          <feComposite in="SourceGraphic" in2="noise" operator="arithmetic" k1="0.5" k2="0.6" k3="0.2" k4="0" />
        </filter>

        {/* Linear gradients for mountain ridges */}
        <linearGradient id="slopeBright" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4C8CC" />
          <stop offset="50%" stopColor="#8A9096" />
          <stop offset="100%" stopColor="#3A3D42" />
        </linearGradient>

        <linearGradient id="slopeShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E2023" />
          <stop offset="70%" stopColor="#2F3237" />
          <stop offset="100%" stopColor="#18191B" />
        </linearGradient>
      </defs>

      {/* Mountain Relief Shading (Slopes facing satellite are bright, backslope dark) */}
      <rect width="800" height="450" fill="#4B4E54" filter={`url(#radarSpeckle-${isAfter ? 'after' : 'before'})`} />

      {/* Upper Mountain Massif (Facing slope bright) */}
      <path 
        d="M 0,0 L 800,0 L 800,160 Q 600,120 480,180 Q 320,100 200,140 Q 80,70 0,110 Z" 
        fill="url(#slopeBright)" 
        opacity="0.85" 
      />

      {/* Lower Mountain Ridges (Shadowed and textured) */}
      <path 
        d="M 0,310 Q 150,260 290,340 Q 450,290 580,360 Q 700,320 800,380 L 800,450 L 0,450 Z" 
        fill="url(#slopeShadow)" 
        opacity="0.9" 
      />

      {/* Valley Floor Corridor */}
      <path 
        d="M 0,170 Q 220,185 360,230 Q 520,220 800,280 L 800,340 Q 510,310 330,290 Q 180,260 0,230 Z" 
        fill="#383B40" 
        opacity="0.95" 
      />

      {/* BEFORE SCENE: Thin dark river line through valley */}
      {!isAfter && (
        <>
          <path 
            d="M 0,195 Q 120,210 240,205 Q 360,250 480,240 Q 620,270 800,295" 
            fill="none" 
            stroke="#111315" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />
          {/* Subtle Pasang Lhamu Highway contour */}
          <path 
            d="M 0,182 Q 130,196 250,190 Q 370,238 490,226 Q 630,258 800,280" 
            fill="none" 
            stroke="#666A72" 
            strokeWidth="2.5" 
            strokeDasharray="5, 3" 
          />
        </>
      )}

      {/* AFTER SCENE: Wide rough corridor of mud and rock with dark ponded water */}
      {isAfter && (
        <>
          {/* Wide rough debris & mudflow corridor (Textured mud/rock corridor) */}
          <path 
            d="M 0,165 Q 140,175 250,180 Q 360,210 420,225 Q 540,220 680,260 Q 750,280 800,275 L 800,340 Q 690,330 560,295 Q 430,290 320,280 Q 180,265 0,240 Z" 
            fill={sensor === 'optical' ? '#7A6248' : '#4E5259'} 
            stroke={sensor === 'optical' ? '#5E4A34' : '#33363B'}
            strokeWidth="2"
            opacity="0.95"
          />

          {/* Dark ponded water bodies within the debris corridor */}
          {/* Pond 1: Upstream widening */}
          <ellipse cx="160" cy="195" rx="34" ry="14" fill="#0C0D0F" transform="rotate(-10 160 195)" />
          {/* Pond 2: Mid-valley choke point lake */}
          <ellipse cx="380" cy="235" rx="55" ry="22" fill="#0C0D0F" transform="rotate(8 380 235)" />
          {/* Pond 3: Downstream dammed pond */}
          <ellipse cx="610" cy="275" rx="60" ry="18" fill="#0C0D0F" transform="rotate(-6 610 275)" />

          {/* Active river channel cutting through debris */}
          <path 
            d="M 0,190 Q 110,200 160,195 Q 260,220 380,235 Q 500,250 610,275 Q 710,290 800,305" 
            fill="none" 
            stroke="#0C0D0F" 
            strokeWidth="7" 
            strokeLinecap="round" 
          />

          {/* Severed Highway segments (Red severed cuts) */}
          <path 
            d="M 0,182 Q 130,196 230,191" 
            fill="none" 
            stroke="#666A72" 
            strokeWidth="2.5" 
            strokeDasharray="5, 3" 
          />
          {/* SEVERED STRETCH 1 */}
          <path 
            d="M 230,191 Q 280,215 340,225" 
            fill="none" 
            stroke="#BE123C" 
            strokeWidth="4" 
            strokeDasharray="4, 4" 
          />
          {/* Remaining segment */}
          <path 
            d="M 340,225 Q 440,220 480,228" 
            fill="none" 
            stroke="#666A72" 
            strokeWidth="2.5" 
            strokeDasharray="5, 3" 
          />
          {/* SEVERED STRETCH 2 */}
          <path 
            d="M 480,228 Q 570,250 640,265" 
            fill="none" 
            stroke="#BE123C" 
            strokeWidth="4" 
            strokeDasharray="4, 4" 
          />
          {/* Downstream road */}
          <path 
            d="M 640,265 Q 720,275 800,280" 
            fill="none" 
            stroke="#666A72" 
            strokeWidth="2.5" 
            strokeDasharray="5, 3" 
          />

          {/* AI CHANGE DETECTION MASK (Optional visual toggle) */}
          {showMask && (
            <g opacity="0.65">
              {/* Blue/Cyan highlight on detected ponded water */}
              <ellipse cx="160" cy="195" rx="36" ry="16" fill="#0284C7" transform="rotate(-10 160 195)" />
              <ellipse cx="380" cy="235" rx="58" ry="24" fill="#0284C7" transform="rotate(8 380 235)" />
              <ellipse cx="610" cy="275" rx="63" ry="20" fill="#0284C7" transform="rotate(-6 610 275)" />

              {/* Gold / Amber outline on debris corridor boundaries */}
              <path 
                d="M 0,165 Q 140,175 250,180 Q 360,210 420,225 Q 540,220 680,260 Q 750,280 800,275" 
                fill="none" 
                stroke="#D97706" 
                strokeWidth="3.5" 
                strokeDasharray="6, 4" 
              />
              <path 
                d="M 0,240 Q 180,265 320,280 Q 430,290 560,295 Q 690,330 800,340" 
                fill="none" 
                stroke="#D97706" 
                strokeWidth="3.5" 
                strokeDasharray="6, 4" 
              />
            </g>
          )}
        </>
      )}

      {/* Grid overlay for satellite coordinate measurement */}
      <g stroke="#FFFFFF" strokeWidth="0.5" opacity="0.15">
        <line x1="200" y1="0" x2="200" y2="450" strokeDasharray="4, 4" />
        <line x1="400" y1="0" x2="400" y2="450" strokeDasharray="4, 4" />
        <line x1="600" y1="0" x2="600" y2="450" strokeDasharray="4, 4" />
        <line x1="0" y1="150" x2="800" y2="150" strokeDasharray="4, 4" />
        <line x1="0" y1="300" x2="800" y2="300" strokeDasharray="4, 4" />
      </g>
    </svg>
  );
}
