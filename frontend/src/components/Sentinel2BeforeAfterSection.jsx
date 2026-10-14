import React, { useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { ImageSwipeDivider } from './HistoricalImageComparison';
import trishuliBefore from '../assets/2026-08-12-00_00_2026-08-12-23_59_Sentinel-2_L1C_True_color.jpg';
import syapruBefore from '../assets/2026-08-12-00_00_2026-08-12-23_59_Sentinel-2_L1C_True_color (2).jpg';
import bidurBefore from '../assets/2026-08-12-00_00_2026-08-12-23_59_Sentinel-2_L1C_True_color (3).jpg';
import phosretarBefore from '../assets/2026-08-12-00_00_2026-08-12-23_59_Sentinel-2_L1C_True_color (4).jpg';
import syapruAfter from '../assets/2026-08-27-00_00_2026-08-27-23_59_Sentinel-2_L1C_True_color (1).jpg';
import bidurAfter from '../assets/2026-08-27-00_00_2026-08-27-23_59_Sentinel-2_L1C_True_color (2).jpg';
import trishuliAfter from '../assets/2026-08-27-00_00_2026-08-27-23_59_Sentinel-2_L1C_True_color.png';
import phosretarAfter from '../assets/2026-09-21-00_00_2026-09-21-23_59_Sentinel-2_L1C_True_color.jpg';

const PAIRS = [
  {
    id: 'trishuli-gandaki-nuwakot',
    title: 'Trishuli Gandaki · Nuwakot corridor',
    description: 'Detailed river corridor with Trishuli Gandaki River and Nuwakot labels visible in both acquisitions.',
    locations: [],
    before: trishuliBefore,
    after: trishuliAfter,
    beforeDate: '12 AUG 2026',
    afterDate: '27 AUG 2026',
    aspectRatio: '786 / 570'
  },
  {
    id: 'syapru-besi',
    title: 'Syapru Besi',
    description: 'Location-labeled corridor view centered on Syapru Besi and nearby mountain valleys.',
    locations: ['Syapru Besi'],
    before: syapruBefore,
    after: syapruAfter,
    beforeDate: '12 AUG 2026',
    afterDate: '27 AUG 2026',
    aspectRatio: '786 / 569'
  },
  {
    id: 'bidur',
    title: 'Bidur',
    description: 'Location-labeled view of Bidur, NH42, and the surrounding river junctions.',
    locations: ['Bidur'],
    before: bidurBefore,
    after: bidurAfter,
    beforeDate: '12 AUG 2026',
    afterDate: '27 AUG 2026',
    aspectRatio: '786 / 569'
  },
  {
    id: 'phosretar',
    title: 'Phosretar',
    description: 'Location-labeled Phosretar corridor; the later acquisition is dated 21 September 2026.',
    locations: ['Phosretar'],
    before: phosretarBefore,
    after: phosretarAfter,
    beforeDate: '12 AUG 2026',
    afterDate: '21 SEP 2026',
    aspectRatio: '786 / 569'
  }
];

function PairComparison({ pair, selectedLocation }) {
  const stageRef = useRef(null);
  const [position, setPosition] = useState(50);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleStageClick = (event) => {
    // Ignore clicks on the divider handle or the inspect button.
    if (event.target.closest('.satellite-pair-divider')) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    const clamped = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    setPosition(clamped);
  };

  return (
    <article className="sentinel2-pair" aria-labelledby={`${pair.id}-title`}>
      <div className="sentinel2-pair-heading">
        <div>
          <div className="ems-compare-eyebrow">Sentinel-2 L1C · True Color</div>
          <h3 id={`${pair.id}-title`}>{pair.title}</h3>
          <p>{pair.description}</p>
          {selectedLocation && <p className="sentinel2-selected-location">Selected EMS location: {selectedLocation}</p>}
        </div>
        <button
          type="button"
          className="btn-white-pill sentinel2-reset"
          onClick={() => setPosition(50)}
        >
          Reset
        </button>
      </div>

      <div className="sentinel2-pair-stage-wrap">
        <div
          className="sentinel2-pair-stage"
          ref={stageRef}
          style={{ aspectRatio: pair.aspectRatio, cursor: 'crosshair' }}
          onClick={handleStageClick}
          aria-label={`${pair.title} before and after satellite comparison`}
        >
          <img className="sentinel2-pair-image" src={pair.before} alt={`${pair.title}, before acquisition, ${pair.beforeDate}, Sentinel-2 L1C True Color`} draggable={false} />
          <div className="sentinel2-pair-after-clip" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
            <img className="sentinel2-pair-image" src={pair.after} alt={`${pair.title}, after acquisition, ${pair.afterDate}, Sentinel-2 L1C True Color`} draggable={false} />
          </div>
          <span className="sentinel2-pair-label is-before">BEFORE <time>{pair.beforeDate}</time></span>
          <span className="sentinel2-pair-label is-after">AFTER <time>{pair.afterDate}</time></span>
          <ImageSwipeDivider position={position} onPositionChange={setPosition} stageRef={stageRef} />
        </div>
        <button
          type="button"
          className="sentinel2-enlarge"
          onClick={() => setIsLightboxOpen(true)}
          aria-label={`Enlarge ${pair.title}`}
          title="Inspect original images"
        >
          <Maximize2 size={14} aria-hidden="true" />
          Inspect full images
        </button>
      </div>

      <p className="sentinel2-pair-note">
        Credit: European Union, contains modified Copernicus Sentinel data 2026, processed with Copernicus Browser.
      </p>

      {isLightboxOpen && (
        <div className="sentinel2-lightbox" role="dialog" aria-modal="true" aria-labelledby={`${pair.id}-lightbox-title`}>
          <div className="sentinel2-lightbox-panel">
            <div className="sentinel2-lightbox-header">
              <div>
                <h4 id={`${pair.id}-lightbox-title`}>{pair.title}</h4>
                <p>Sentinel-2 L1C · True Color · original aspect ratio</p>
              </div>
              <button type="button" className="sentinel2-lightbox-close" onClick={() => setIsLightboxOpen(false)} aria-label="Close enlarged images">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="sentinel2-lightbox-images">
              <figure><img src={pair.before} alt={`${pair.title} before, ${pair.beforeDate}`} /><figcaption>BEFORE · {pair.beforeDate}</figcaption></figure>
              <figure><img src={pair.after} alt={`${pair.title} after, ${pair.afterDate}`} /><figcaption>AFTER · {pair.afterDate}</figcaption></figure>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function Sentinel2BeforeAfterSection({ selectedLocation }) {
  const selectedPair = PAIRS.find((pair) => pair.locations.includes(selectedLocation)) || PAIRS[0];

  return (
    <section className="sentinel2-before-after" aria-labelledby="sentinel2-before-after-title">
      <header className="sentinel2-before-after-heading">
        <div>
          <div className="ems-compare-eyebrow">Historical Nepal–Tibet flood · source imagery</div>
          <h2 id="sentinel2-before-after-title">Nepal Flood: Sentinel-2 Before &amp; After</h2>
          <p>Pre-event: 12 Aug 2026 · Post-event acquisitions: 27 Aug and 21 Sep 2026</p>
        </div>
        <span className="sentinel2-sensor-tag">Sentinel-2 L1C · True Color</span>
      </header>
      <p className="sentinel2-before-after-intro">
        Select a Nepal location above to inspect its matching before/after pair. Four verified same-viewport pairs are available
        (Trishuli Gandaki, Syapru Besi, Bidur, Phosretar). An unverifiable wide-area framing was removed rather than shown as a
        forced comparison. Visible differences may also reflect sediment, cloud cover, seasonal conditions, acquisition differences,
        or image alignment; no measurements are inferred here. Contains modified Copernicus Sentinel data 2026.
      </p>
      <div className="sentinel2-pair-grid">
        <PairComparison key={selectedPair.id} pair={selectedPair} selectedLocation={selectedLocation} />
      </div>
    </section>
  );
}
