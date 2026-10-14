import React, { useEffect, useRef, useState } from 'react';
import DevelopingIncidentSection from './DevelopingIncidentSection';
import HistoricalIncidentSection from './HistoricalIncidentSection';
import { TRANSLATIONS } from '../data/translations';
import { Layers, Radio, Satellite } from 'lucide-react';

const FILTER_OPTIONS = ['all', 'developing', 'historical'];

// Pill switcher items: "all" stacks both incidents, the other two isolate one.
// `dot` marks the developing incident as an ongoing (amber) event.
const FILTER_ITEMS = [
  { value: 'all', icon: Layers, dot: false },
  { value: 'developing', icon: Radio, dot: true },
  { value: 'historical', icon: Satellite, dot: false }
];

// Where each pill scrolls to when selected. "all" starts at the top of the
// developing incident (the newest-first stack begins there).
const SECTION_TARGETS = {
  all: 'overview-developing-section',
  developing: 'overview-developing-section',
  historical: 'overview-historical-section'
};

// Sticky offset: app top bar (~58px) plus the switcher bar and breathing room.
const SCROLL_OFFSET = 150;

export default function OverviewView({ onNavigateToCompare, onNavigateToIncidents, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  // Which incident(s) the operator wants on screen. "all" keeps the original
  // newest-first stack; the other two isolate a single incident for review.
  const [filter, setFilter] = useState('all');
  const activeFilter = FILTER_OPTIONS.includes(filter) ? filter : 'all';

  const pillsTrackRef = useRef(null);
  const pillRefs = useRef({});
  // Geometry of the sliding capsule behind the active pill.
  const [indicator, setIndicator] = useState(null);

  const filterItems = FILTER_ITEMS.map(({ value, icon, dot }) => ({
    value,
    icon,
    dot,
    label: {
      all: t.overview.filterAll,
      developing: t.overview.filterDeveloping,
      historical: t.overview.filterHistorical
    }[value],
    hint: {
      all: t.overview.filterHintAll,
      developing: t.overview.filterHintDeveloping,
      historical: t.overview.filterHintHistorical
    }[value]
  }));

  const filterStatus = {
    all: t.overview.filterCountAll,
    developing: t.overview.filterCountDeveloping,
    historical: t.overview.filterCountHistorical
  }[activeFilter];

  // Keep the sliding indicator aligned with the active pill. Re-measured on
  // resize and on container/font size changes so the capsule never drifts.
  useEffect(() => {
    const track = pillsTrackRef.current;
    const activePill = pillRefs.current[activeFilter];
    if (!track || !activePill) return undefined;

    const update = () => {
      setIndicator({ left: activePill.offsetLeft, width: activePill.offsetWidth });
    };
    update();

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(track);
      observer.observe(activePill);
    }
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [activeFilter]);

  // Scroll the active pill into view inside the (horizontally scrollable) pill
  // track on small screens — without moving the page itself.
  useEffect(() => {
    const track = pillsTrackRef.current;
    const activePill = pillRefs.current[activeFilter];
    if (!track || !activePill || track.scrollWidth <= track.clientWidth) return;
    track.scrollTo({
      left: activePill.offsetLeft - (track.clientWidth - activePill.offsetWidth) / 2,
      behavior: 'smooth'
    });
  }, [activeFilter]);

  // Scroll the newly revealed section into view under the sticky chrome.
  const scrollToSection = (value) => {
    const section = document.getElementById(SECTION_TARGETS[value] || SECTION_TARGETS.all);
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const selectFilter = (value) => {
    if (!FILTER_OPTIONS.includes(value)) return;
    if (value === activeFilter) {
      // Re-selecting the current pill re-centres its section.
      scrollToSection(value);
      return;
    }
    setFilter(value);
    // Wait two frames so React has painted the newly mounted section (and the
    // indicator has a fresh measurement) before scrolling to it.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(value)));
  };

  // Roving arrow-key navigation, per the WAI-ARIA tabs pattern.
  const handleFilterKeyDown = (event) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!dir) return;
    event.preventDefault();
    const i = FILTER_OPTIONS.indexOf(activeFilter);
    const next = FILTER_OPTIONS[(i + dir + FILTER_OPTIONS.length) % FILTER_OPTIONS.length];
    selectFilter(next);
    document.getElementById(`overview-filter-${next}`)?.focus();
  };

  return (
    <div className="overview-page">
      <header className="overview-page-header">
        <div>
          <div className="overview-page-eyebrow">{t.overview.eyebrow}</div>
          <h1>{t.overview.title}</h1>
          <p>
            {t.overview.description}
          </p>
        </div>
        <div className="overview-page-scope" aria-label="Overview scope">
          <span className="overview-page-scope-dot" aria-hidden="true" />
          <span>{t.overview.scope}</span>
        </div>
      </header>

      {/* Incident View Switcher — pill nav to choose which incident to review */}
      <div
        className="overview-view-filter"
        role="tablist"
        aria-label={t.overview.filterLabel}
        onKeyDown={handleFilterKeyDown}
      >
        <span className="overview-view-filter-label" aria-hidden="true">
          {t.overview.filterLabel}
        </span>
        <div className="overview-view-filter-pills" ref={pillsTrackRef}>
          {/* Sliding capsule behind the active pill */}
          <span
            className={`overview-view-filter-indicator${indicator ? ' is-measured' : ''}`}
            aria-hidden="true"
            style={indicator
              ? { transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }
              : undefined}
          />
          {filterItems.map(({ value, icon: Icon, dot, label, hint }) => {
            const isActive = activeFilter === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                id={`overview-filter-${value}`}
                ref={(el) => { pillRefs.current[value] = el; }}
                aria-selected={isActive}
                aria-controls={
                  value === 'developing' ? 'overview-developing-section'
                    : value === 'historical' ? 'overview-historical-section'
                      : undefined
                }
                tabIndex={isActive ? 0 : -1}
                className={`overview-view-pill${isActive ? ' is-active' : ''}`}
                title={hint}
                onClick={() => selectFilter(value)}
              >
                <span className="overview-view-pill-icon" aria-hidden="true">
                  {dot && <span className="overview-view-pill-dot" />}
                  <Icon size={13} strokeWidth={2.4} />
                </span>
                <span className="overview-view-pill-label">{label}</span>
              </button>
            );
          })}
        </div>
        <span className="overview-view-filter-status" aria-live="polite">
          {filterStatus}
        </span>
      </div>

      {/* Incident Status Banner — only relevant when the developing incident is on screen */}
      {activeFilter !== 'historical' && (
      <div className="overview-status-banner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f3f8f4',
        padding: '16px 22px',
        borderRadius: '14px',
        border: '1px solid #c7dccb',
        boxShadow: '0 7px 20px rgba(24, 60, 43, 0.05)',
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
            <Radio size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
                {t.overview.bannerTitle}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 149, 0, 0.12)',
                color: '#ff9500',
                border: '1px solid rgba(255, 149, 0, 0.25)'
              }}>
                {t.overview.bannerEvent}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              {t.overview.bannerSub}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={onNavigateToIncidents}
            className="btn-white-pill"
            style={{ fontSize: '11px' }}
          >
            {t.overview.viewRegistry}
          </button>
          <button 
            type="button" 
            onClick={onNavigateToCompare}
            className="btn-dark-green-pill"
            style={{ fontSize: '11px' }}
          >
            {t.overview.compareHistorical}
          </button>
        </div>
      </div>
      )}

      {/* Primary Dedicated Developing Incident Experience */}
      {activeFilter !== 'historical' && (
        <div id="overview-developing-section" role="tabpanel" aria-labelledby="overview-filter-developing">
          <DevelopingIncidentSection
            onNavigateToCompare={onNavigateToCompare}
            onNavigateToIncidents={onNavigateToIncidents}
            lang={lang}
          />
        </div>
      )}

      {activeFilter !== 'developing' && (
        <div id="overview-historical-section" role="tabpanel" aria-labelledby="overview-filter-historical">
          <HistoricalIncidentSection onNavigateToCompare={onNavigateToCompare} lang={lang} />
        </div>
      )}

    </div>
  );
}
