import React, { useMemo, useRef, useState } from 'react';
import { TRANSLATIONS } from '../data/translations';
import { TranslationNotice, useBatchTranslate } from './Translation';

export const COMPARISONS = [
  {
    id: 'betrawati-gerkhu',
    title: 'Betrawati and Gerkhu river channel',
    location: 'Betrawati and Gerkhu, Rasuwa/Nuwakot, Nepal',
    beforeDate: '12 August 2026',
    afterDate: '27 August 2026',
    beforeImage: '/assets/historical-nepal/betrawati-gerkhu-before-2026-08-12.webp',
    afterImage: '/assets/historical-nepal/betrawati-gerkhu-after-2026-08-27.webp',
    thumbnail: '/assets/historical-nepal/betrawati-gerkhu-source-comparison.webp',
    aspectRatio: '2480 / 2630',
    sensor: 'Copernicus Sentinel-2',
    source: 'EU Space Support Office',
    credit: 'European Union, Copernicus Sentinel-2 imagery',
    license: 'CC BY 4.0; attribution and notice of crop/adaptation',
    sourcePage: 'https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood',
    sourceImage: 'https://eu-space.europa.eu/sites/default/files/2026-08/20260827_Nepal.png.webp',
    licensePage: 'https://commission.europa.eu/legal-notice_en',
    changeSummary: 'River channel widening and broad alluvial sediment deposits are visible in the post-event scene along the riverbed. Both panels use identical image bounds; title and footer graphics removed.',
    resolutionNote: 'The 4,960 × 3,507 px source composite is separated into date-correct panels and cropped with matching bounds. The source terms are CC BY 4.0; this is genuine multispectral optical imagery.'
  },
  {
    id: 'trishuli-regional',
    title: 'Trishuli River corridor · regional context',
    location: 'Trishuli River corridor, Nepal',
    beforeDate: '12 August 2026',
    afterDate: '27 August 2026',
    beforeImage: '/assets/historical-nepal/nepal-tibet-trishuli-sentinel2-before-2026-08-12.webp',
    afterImage: '/assets/historical-nepal/nepal-tibet-trishuli-sentinel2-after-2026-08-27.webp',
    thumbnail: '/assets/historical-nepal/trishuli-regional-comparison.webp',
    aspectRatio: '1 / 1',
    sensor: 'Copernicus Sentinel-2',
    source: 'European Space Agency',
    credit: 'ESA / Copernicus Sentinel-2',
    license: 'ESA image-use terms; attribution required',
    sourcePage: 'https://www.esa.int/ESA_Multimedia/Images/2026/08/Sentinel-2_captures_before_and_after_Nepal_flash_flood',
    sourceBeforeImage: 'https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2026/08/sentinel-2_images_area_of_nepal_prior_to_flash_flood/27442429-1-eng-GB/Sentinel-2_images_area_of_Nepal_prior_to_flash_flood.jpg',
    sourceAfterImage: 'https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2026/08/sentinel-2_captures_before_and_after_nepal_flash_flood/27442595-1-eng-GB/Sentinel-2_captures_before_and_after_Nepal_flash_flood.jpg',
    licensePage: 'https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website',
    changeSummary: 'Both full-scene images show the same square Trishuli River corridor. Monsoon clouds obscure parts of the 27 August scene; use this pair for regional context, not localized damage assessment.',
    resolutionNote: 'Each ESA source image is 5,173 × 5,173 px and is stored at full pixel dimensions as WebP (quality 95). Sentinel-2 visible-band sampling is nominally 10 m; the published images are not georeferenced assets, and AetherFlood has not performed image registration or change analysis.'
  },
  {
    id: 'glacier-headwaters',
    title: 'Glacier collapse & upstream headwaters',
    location: 'Headwaters catchment, Northern Nepal / Tibet border',
    beforeDate: '24 August 2026',
    afterDate: '26 August 2026',
    beforeImage: '/assets/historical-nepal/glacier-headwaters-before-2026-08-24.webp',
    afterImage: '/assets/historical-nepal/glacier-headwaters-after-2026-08-26.webp',
    thumbnail: '/assets/historical-nepal/glacier-headwaters-comparison.webp',
    aspectRatio: '1920 / 2400',
    sensor: 'Copernicus Sentinel-2 & US Landsat-9 (SWIR)',
    source: 'European Space Agency & USGS',
    credit: 'Contains modified Copernicus Sentinel data (2026) / ESA / USGS Landsat',
    license: 'ESA image-use terms & USGS Open Data; attribution required',
    sourcePage: 'https://www.esa.int/ESA_Multimedia/Images/2026/08/Nepal_glacier_collapse_and_flood_before_and_after',
    sourceImage: 'https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2026/08/nepal_glacier_collapse_and_flood_before_and_after/27442263-1-eng-GB/Nepal_glacier_collapse_and_flood_before_and_after.jpg',
    licensePage: 'https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website',
    changeSummary: 'Shortwave-infrared (SWIR) false-colour composite highlighting the glacial lake/ice collapse scar and debris torrent initiation. Captured ~2 hours post-event by Landsat-9 compared against pre-event Sentinel-2.',
    resolutionNote: 'Cross-sensor comparison: Pre-event Sentinel-2 (24 Aug) and post-event Landsat-9 (26 Aug). Both processed in SWIR bands to penetrate mountain haze and distinguish mud/ice from cloud. Different spatial resolutions and illumination angles apply.'
  }
];

export function ImageSwipeDivider({ position, onPositionChange, stageRef }) {
  const isDraggingRef = useRef(false);

  const updatePosition = (clientX) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    const clamped = Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100));
    onPositionChange(clamped);
  };

  return (
    <div
      className="satellite-pair-divider"
      style={{ left: `${position}%` }}
      role="slider"
      tabIndex={0}
      aria-label="Before and after satellite image divider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`Before image visible across ${Math.round(position)} percent of the comparison`}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        isDraggingRef.current = true;
        updatePosition(event.clientX);
      }}
      onPointerMove={(event) => {
        if (isDraggingRef.current) {
          event.preventDefault();
          updatePosition(event.clientX);
        }
      }}
      onPointerUp={(event) => {
        isDraggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        isDraggingRef.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onPositionChange(Math.max(0, position - 2));
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          onPositionChange(Math.min(100, position + 2));
        } else if (event.key === 'Home') {
          event.preventDefault();
          onPositionChange(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          onPositionChange(100);
        }
      }}
    >
      <span aria-hidden="true" />
    </div>
  );
}

export default function HistoricalImageComparison({ position, onPositionChange, selectedLocation }) {
  const stageRef = useRef(null);
  const [selectedComparisonId, setSelectedComparisonId] = useState('betrawati-gerkhu');
  const [imageError, setImageError] = useState(false);
  const [loadedImages, setLoadedImages] = useState([]);
  const comparison = COMPARISONS.find((item) => item.id === selectedComparisonId) || COMPARISONS[0];

  const selectComparison = (comparisonId) => {
    setSelectedComparisonId(comparisonId);
    setImageError(false);
    setLoadedImages([]);
    onPositionChange(50);
  };

  const handleStageClick = (event) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    const clamped = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
    onPositionChange(clamped);
  };

  return (
    <section className="historical-image-comparison" aria-labelledby="historical-image-comparison-title">
      <div className="historical-image-comparison-heading">
        <div>
          <div className="ems-compare-eyebrow">{comparison.sensor} · Source satellite imagery</div>
          <h2 id="historical-image-comparison-title">{comparison.title}</h2>
          <p>{comparison.location} · Nepal–Tibet flood, 26 August 2026</p>
          {selectedLocation && (
            <p className="historical-image-comparison-selected-location">
              Selected EMS location: {selectedLocation}
            </p>
          )}
        </div>
        <button type="button" className="btn-white-pill" onClick={() => onPositionChange(50)}>
          Reset to middle (50%)
        </button>
      </div>

      <div className="historical-image-comparison-body">
        <figure className="satellite-pair-figure">
          <div
            className="satellite-pair-stage"
            ref={stageRef}
            onClick={handleStageClick}
            style={{ aspectRatio: comparison.aspectRatio, cursor: 'crosshair' }}
            aria-label={`Satellite image comparison at ${comparison.location}`}
          >
            {!imageError && loadedImages.length < 2 && (
              <div className="satellite-pair-loading" role="status">
                Loading satellite images…
              </div>
            )}
            <img
              className="satellite-pair-image"
              src={comparison.beforeImage}
              alt={`Before flood at ${comparison.location}, acquired ${comparison.beforeDate}, ${comparison.credit}`}
              onLoad={() => setLoadedImages((loaded) => loaded.includes('before') ? loaded : [...loaded, 'before'])}
              onError={() => setImageError(true)}
              draggable={false}
            />
            <div
              className="satellite-pair-after-clip"
              style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            >
              <img
                className="satellite-pair-image"
                src={comparison.afterImage}
                alt={`After flood at ${comparison.location}, acquired ${comparison.afterDate}, ${comparison.credit}`}
                onLoad={() => setLoadedImages((loaded) => loaded.includes('after') ? loaded : [...loaded, 'after'])}
                onError={() => setImageError(true)}
                draggable={false}
              />
            </div>
            <span className="satellite-pair-label is-before">
              BEFORE <time dateTime={comparison.beforeDate}>{comparison.beforeDate}</time>
            </span>
            <span className="satellite-pair-label is-after">
              AFTER <time dateTime={comparison.afterDate}>{comparison.afterDate}</time>
            </span>
            <ImageSwipeDivider
              position={position}
              onPositionChange={onPositionChange}
              stageRef={stageRef}
            />
          </div>
          <figcaption>
            {comparison.changeSummary}
          </figcaption>
        </figure>

        <aside className="satellite-pair-details">
          <h3>Verified image pair provenance</h3>
          <dl>
            <div><dt>Location</dt><dd>{comparison.location}</dd></div>
            <div><dt>Sensor</dt><dd>{comparison.sensor}</dd></div>
            <div><dt>Before</dt><dd>{comparison.beforeDate}</dd></div>
            <div><dt>After</dt><dd>{comparison.afterDate}</dd></div>
            <div><dt>Credit</dt><dd>{comparison.credit}</dd></div>
            <div><dt>License</dt><dd>{comparison.license}</dd></div>
          </dl>
          <p>{comparison.resolutionNote}</p>
          <div className="satellite-pair-source-links">
            <a href={comparison.sourcePage} target="_blank" rel="noopener noreferrer">
              Open {comparison.source} source page
            </a>
            {comparison.sourceImage && (
              <a href={comparison.sourceImage} target="_blank" rel="noopener noreferrer">
                Open published original image
              </a>
            )}
            {comparison.sourceBeforeImage && (
              <a href={comparison.sourceBeforeImage} target="_blank" rel="noopener noreferrer">
                Open original before image
              </a>
            )}
            {comparison.sourceAfterImage && (
              <a href={comparison.sourceAfterImage} target="_blank" rel="noopener noreferrer">
                Open original after image
              </a>
            )}
            {comparison.licensePage && (
              <a href={comparison.licensePage} target="_blank" rel="noopener noreferrer">
                View license and reuse terms
              </a>
            )}
          </div>
        </aside>
      </div>

      {imageError && (
        <p className="ems-compare-alert" role="alert">
          One or both local satellite images could not be loaded. Use the source links above to view
          the published comparison.
        </p>
      )}

      <div className="historical-image-gallery">
        <div className="historical-image-gallery-heading">
          <h3>Verified comparison gallery</h3>
          <span>{COMPARISONS.length} image pairs with confirmed dates, location and source provenance</span>
        </div>
        <div className="historical-image-gallery-items">
          {COMPARISONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="historical-image-gallery-item"
              aria-pressed={selectedComparisonId === item.id}
              onClick={() => selectComparison(item.id)}
            >
              <img src={item.thumbnail} alt="" loading="lazy" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.beforeDate} / {item.afterDate} · {item.source}</small>
              </span>
            </button>
          ))}
        </div>
        <p>
          ABC News also documents comparisons at Rasuwagadhi, Syapru Besi, Kolpurtar, and the Trishuli bridge
          using commercial Planet and Maxar imagery. Because those raw commercial assets are subject to
          restrictive redistribution copyright, they are not mirrored locally. Direct links to their published
          reporting are provided for verification:
          {' '}
          <a
            href="https://www.abc.net.au/news/2026-08-28/nepal-tibet-floods-satellite-imagery-shows-destruction/107088372"
            target="_blank"
            rel="noopener noreferrer"
          >
            ABC News satellite report
          </a>
          {' '}and{' '}
          <a
            href="https://www.abc.net.au/news/2026-08-27/nepal-tibet-floods-landslide-maps-photos-videos/107083300"
            target="_blank"
            rel="noopener noreferrer"
          >
            ABC News photo/map gallery
          </a>.
        </p>
      </div>
    </section>
  );
}

const AUTO_ADVANCE_MS = 3000;

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const listener = (event) => setPrefersReduced(event.matches);
    query.addEventListener?.('change', listener);
    return () => query.removeEventListener?.('change', listener);
  }, []);
  return prefersReduced;
}

/**
 * Automatic before/after viewer for the Overview section.
 * Alternates the verified BEFORE (12 Aug 2026) and AFTER (27 Aug 2026)
 * frames with a smooth crossfade. Manual slider is intentionally not used here.
 */
export function AutoBeforeAfter({ comparison, lang = 'en', captionOverride }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const playing = isPlaying && !prefersReducedMotion;

  React.useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % 2);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [playing, comparison?.id]);

  React.useEffect(() => {
    setFrameIndex(0);
  }, [comparison?.id]);

  if (!comparison) return null;
  const frames = [
    { image: comparison.beforeImage, date: comparison.beforeDate, label: t.satellite.beforeState },
    { image: comparison.afterImage, date: comparison.afterDate, label: t.satellite.afterState }
  ];
  const current = frames[frameIndex];

  return (
    <div className="auto-compare" role="region" aria-label={`${comparison.title} automatic before and after comparison`}>
      <div
        className="auto-compare-stage"
        style={{ aspectRatio: comparison.aspectRatio }}
      >
        {frames.map((frame, index) => (
          <img
            key={frame.label}
            className={`auto-compare-image${index === frameIndex ? ' is-visible' : ''}`}
            src={frame.image}
            alt={`${frame.label} flood at ${comparison.location}, acquired ${frame.date}, ${comparison.credit}`}
            aria-hidden={index === frameIndex ? undefined : true}
            draggable={false}
          />
        ))}
        <span className="auto-compare-label" aria-live="polite">
          {current.label} <time dateTime={current.date}>{current.date}</time>
        </span>
        <button
          type="button"
          className="auto-compare-play"
          onClick={() => setIsPlaying((value) => !value)}
          aria-pressed={playing}
          aria-label={playing ? t.satellite.pause : t.satellite.play}
        >
          {playing ? t.satellite.pause : t.satellite.play}
        </button>
      </div>
      <div className="auto-compare-progress" aria-hidden="true">
        {playing ? (
          <span key={`${comparison.id}-${frameIndex}`} className="auto-compare-progress-bar" />
        ) : (
          <span className="auto-compare-progress-bar is-paused" style={{ width: `${frameIndex === 0 ? 0 : 100}%` }} />
        )}
      </div>
      <p className="auto-compare-caption">{captionOverride ?? comparison.changeSummary}</p>
    </div>
  );
}

/**
 * Overview satellite evidence: automatic comparison of the verified
 * Betrawati/Gerkhu pair plus the provenance gallery. No draggable slider.
 */
// Map View presents the two optical before/after pairs together. The SWIR
// false-colour glacier pair is deliberately not shown here; its record and
// imagery are preserved for the dedicated Compare workspace.
const MAP_VIEW_EXCLUDED_IDS = new Set(['glacier-headwaters']);
const MAP_VIEW_COMPARISONS = COMPARISONS.filter((item) => !MAP_VIEW_EXCLUDED_IDS.has(item.id));

export function HistoricalAutoComparison({ lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  // Only the per-pair captions are translated now that both pairs are always
  // on screen; the section heading is generic.
  const pairTexts = useMemo(
    () => MAP_VIEW_COMPARISONS.map((item) => item.changeSummary),
    []
  );
  const { strings: pairTr, isTranslating: pairTranslating, error: pairError, retry: pairRetry } =
    useBatchTranslate(pairTexts, lang);

  return (
    <section className="historical-image-comparison" aria-labelledby="historical-image-comparison-title">
      <div className="historical-image-comparison-heading">
        <div>
          <div className="ems-compare-eyebrow">{t.satellite.sourceImagery}</div>
          <h2 id="historical-image-comparison-title">
            {lang === 'ne' ? 'प्रमाणित उपग्रह तुलना जोडीहरू' : 'Verified satellite comparison pairs'}
          </h2>
          <p>
            {lang === 'ne'
              ? `${t.satellite.eventContext} · दुवै जोडीहरू स्वतः पूर्व/पछि दृश्य बदल्छन्।`
              : `${t.satellite.eventContext} · both pairs alternate automatically.`}
          </p>
          {pairTranslating && (
            <p className="historical-image-comparison-selected-location" role="status">{t.common.translating}</p>
          )}
        </div>
      </div>
      <TranslationNotice error={pairError} onRetry={pairRetry} lang={lang} />

      {/* Map View shows the two optical pairs side by side, both visible and
          auto-alternating. The SWIR false-colour glacier pair is intentionally
          excluded here; its data and assets are untouched and it remains
          available in the dedicated Compare workspace. */}
      <div className="historical-image-pair-grid">
        {MAP_VIEW_COMPARISONS.map((item, idx) => (
          <figure key={item.id} className="satellite-pair-card">
            <AutoBeforeAfter comparison={item} lang={lang} captionOverride={pairTr[idx] ?? null} />
            <figcaption className="satellite-pair-card-caption">
              <strong>{item.title}</strong>
              <span className="satellite-pair-card-dates">
                <span>{t.satellite.before} {item.beforeDate}</span>
                <span aria-hidden="true">→</span>
                <span>{t.satellite.after} {item.afterDate}</span>
              </span>
              <span className="satellite-pair-card-source">
                {item.sensor} · {item.source}
              </span>
              <span className="satellite-pair-source-links">
                <a href={item.sourcePage} target="_blank" rel="noopener noreferrer">
                  Open {item.source} source page
                </a>
                {item.licensePage && (
                  <a href={item.licensePage} target="_blank" rel="noopener noreferrer">
                    View license and reuse terms
                  </a>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <aside className="satellite-pair-details satellite-pair-details-wide">
        <h3>{t.satellite.provenance}</h3>
        <dl>
          {MAP_VIEW_COMPARISONS.map((item) => (
            <React.Fragment key={item.id}>
              <div><dt>{item.title}</dt><dd>{item.location}</dd></div>
              <div><dt>{t.satellite.sensor}</dt><dd>{item.sensor}</dd></div>
              <div><dt>{t.satellite.credit}</dt><dd>{item.credit}</dd></div>
              <div><dt>{t.satellite.license}</dt><dd>{item.license}</dd></div>
            </React.Fragment>
          ))}
        </dl>
      </aside>
    </section>
  );
}
