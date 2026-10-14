import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { TranslationNotice, emphasize, useBatchTranslate } from './Translation';
import { apiUrl } from '../config';

export default function IncidentsView({ onNavigateToMap, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [selectedIncidentGroup, setSelectedIncidentGroup] = useState('ALL'); // 'ALL' | 'nepal-tibet-2026-08-26' | 'budhi-gandaki-2026-10-11'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const incidentGroupOptions = [
    { key: 'ALL', label: t.incidents.allEvents },
    { key: 'nepal-tibet-2026-08-26', label: t.incidents.eventA },
    { key: 'budhi-gandaki-2026-10-11', label: t.incidents.eventB }
  ];

  const categoryOptions = [
    { key: 'All', label: t.incidents.allCategories },
    { key: 'Remote Sensing', label: t.incidents.catRemoteSensing },
    { key: 'Hazard Trigger', label: t.incidents.catHazardTrigger },
    { key: 'Infrastructure', label: t.incidents.catInfrastructure },
    { key: 'Settlements', label: t.incidents.catSettlements },
    { key: 'Critical Infrastructure', label: t.incidents.catCritical }
  ];

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const url = selectedIncidentGroup === 'ALL'
        ? apiUrl('/api/incidents')
        : apiUrl(`/api/incidents?incident_id=${selectedIncidentGroup}`);
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setIncidents(data);
      }
    } catch (err) {
      console.warn("Error fetching incidents from database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedIncidentGroup]);

  // Display-only label for the triage buttons; the raw status value is still
  // what gets sent to the backend and logged.
  const STATUS_LABELS = {
    REPORTED: t.incidents.stReported,
    CONFIRMED: t.incidents.stConfirmed,
    MONITORED: t.incidents.stMonitored,
    RESOLVED: t.incidents.stResolved,
  };

  const handleUpdateStatus = async (id, newStatus, actionNote) => {
    setUpdatingId(id);
    try {
      const res = await fetch(apiUrl(`/api/incidents/${id}/status`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, action_note: actionNote })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS' && data.incident) {
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
      }
    } catch {
      alert("Failed to update status in backend database.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Colours carry the confirmed-vs-reported distinction and stay keyed to the
  // raw status; only the displayed label is localized.
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
      case 'UNACKNOWLEDGED':
        return { color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.25)', label: status };
      case 'REPORTED':
        return { color: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)', border: '1px solid rgba(255, 149, 0, 0.25)', label: t.incidents.stReported };
      case 'CONFIRMED':
        return { color: '#1e783e', bg: 'rgba(30, 120, 62, 0.12)', border: '1px solid rgba(30, 120, 62, 0.25)', label: t.incidents.stConfirmed };
      case 'MONITORED':
        return { color: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)', border: '1px solid rgba(0, 113, 227, 0.25)', label: t.incidents.stMonitored };
      case 'RESOLVED':
        return { color: '#1e783e', bg: 'rgba(30, 120, 62, 0.12)', border: '1px solid rgba(30, 120, 62, 0.25)', label: t.incidents.stResolved };
      default:
        return { color: '#0a2213', bg: '#f2f7f4', border: '1px solid rgba(10, 34, 19, 0.08)', label: status };
    }
  };

  const filteredIncidents = incidents.filter(item => {
    const matchesCategory = activeCategoryFilter === 'All' ? true : item.category === activeCategoryFilter;
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Data-driven card text translated as one batch when Nepali is selected.
  // Five fields per card: title, subtitle, location, triage note, verification state.
  const CARD_FIELDS = 5;
  const cardTexts = useMemo(
    () => filteredIncidents.flatMap((item) => [
      item.title || '',
      item.subtitle || '',
      item.location_name || '',
      item.action_taken || '',
      item.verification_state || '',
    ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredIncidents.map((item) => item.id).join(','), lang]
  );
  const { strings: cardTr, isTranslating: cardsTranslating, error: cardsError, retry: cardsRetry } =
    useBatchTranslate(cardTexts, lang);
  const cardTextAt = (cardIndex, field) =>
    cardTr[cardIndex * CARD_FIELDS + field] ?? cardTexts[cardIndex * CARD_FIELDS + field];

  const openIncidentOnMap = (incident) => {
    onNavigateToMap?.(incident);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Search Bar */}
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
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
                {t.incidents.title}
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
                {t.incidents.badge}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              {t.incidents.subtitle} · {filteredIncidents.length} {filteredIncidents.length === 1 ? t.incidents.recordShown : t.incidents.recordsShown}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f2f7f4',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(10, 34, 19, 0.06)'
          }}>
            <Search size={13} color="#52735d" />
            <input
              type="text"
              placeholder={t.incidents.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '11.5px',
                color: '#0a2213',
                width: '140px'
              }}
            />
          </div>

          <button 
            type="button"
            onClick={fetchIncidents}
            className="btn-dark-green-pill"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '600' }}
            disabled={isLoading}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>{t.incidents.sync}</span>
          </button>
        </div>
      </div>

      {/* Incident Event Partition Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {incidentGroupOptions.map(grp => {
          const isSelected = selectedIncidentGroup === grp.key;
          return (
            <button
              key={grp.key}
              type="button"
              onClick={() => setSelectedIncidentGroup(grp.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: isSelected ? '700' : '500',
                backgroundColor: isSelected ? '#0d2818' : '#ffffff',
                color: isSelected ? '#ffffff' : '#3c3c43',
                border: isSelected ? '1px solid #0d2818' : '1px solid rgba(10, 34, 19, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {grp.label}
            </button>
          );
        })}
      </div>

      {/* Category Filter Row */}
      <div className="filter-pill-row">
        {categoryOptions.map((opt) => {
          const isActive = activeCategoryFilter === opt.key;
          return (
            <button
              key={opt.key}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter(opt.key)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Incidents Cards Grid */}
      {cardsTranslating && (
        <p className="ems-compare-muted" role="status" style={{ gridColumn: '1 / -1' }}>{t.common.translating}</p>
      )}
      <TranslationNotice error={cardsError} onRetry={cardsRetry} lang={lang} />
      {filteredIncidents.length === 0 ? (
        <div className="ems-compare-empty" role="status" style={{ gridColumn: '1 / -1' }}>
          <span>{t.incidents.emptyTitle}</span>
          {t.incidents.emptyHint}
        </div>
      ) : (
      <div className="incidents-grid">
        {filteredIncidents.map((card, cardIndex) => {
          const isDanger = card.severity === 'CRITICAL';
          const statusStyle = getStatusBadge(card.status);
          const isUpdating = updatingId === card.id;
          const isAugust = card.incident_id === 'nepal-tibet-2026-08-26';

          return (
            <div 
              key={card.id} 
              className="grey-card" 
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isDanger ? '1px solid rgba(255, 59, 48, 0.28)' : '1px solid rgba(10, 34, 19, 0.08)',
                borderRadius: '22px',
                backgroundColor: '#FFFFFF',
                boxShadow: isDanger 
                  ? '0 6px 20px rgba(255, 59, 48, 0.06), 0 1px 3px rgba(10, 34, 19, 0.04)' 
                  : '0 4px 16px rgba(10, 34, 19, 0.03), 0 1px 3px rgba(10, 34, 19, 0.03)'
              }}
            >
              <div>
                {/* Incident Group Tag + ID + Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      backgroundColor: isAugust ? 'rgba(30, 120, 62, 0.12)' : 'rgba(255, 149, 0, 0.15)',
                      color: isAugust ? '#1e783e' : '#b25e00',
                      letterSpacing: '0.02em'
                    }}>
                      {isAugust ? `${t.incidents.historicalBadge} · 26 AUG` : `${t.incidents.developingBadge} · 11 OCT`}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#52735d' }}>
                      {card.id}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    border: statusStyle.border,
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Title and Subtitle */}
                <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0a2213', margin: '0 0 5px 0', letterSpacing: '-0.01em' }}>
                  {cardTextAt(cardIndex, 0)}
                </h4>
                <p style={{ fontSize: '12.5px', color: '#52735d', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                  {emphasize(cardTextAt(cardIndex, 1), lang)}
                </p>

                {/* Location and Source Metadata Row */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#52735d',
                  backgroundColor: '#f2f7f4',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  border: '1px solid rgba(10, 34, 19, 0.06)'
                }}>
                  <button
                    type="button"
                    className="incident-location-link"
                    onClick={() => openIncidentOnMap(card)}
                    aria-label={`Show ${card.title} location on AetherFlood map`}
                  >
                    <MapPin size={13} color="#1e783e" />
                    <span>
                      <strong>{t.incidents.locationLabel}</strong> {cardTextAt(cardIndex, 2) || 'Designated Area'}
                      {card.lat != null && card.lon != null
                        && Number.isFinite(Number(card.lat)) && Number.isFinite(Number(card.lon))
                        ? ` (${Number(card.lat).toFixed(3)}, ${Number(card.lon).toFixed(3)})`
                        : ` · ${t.incidents.coordinatesUnavailable}`}
                    </span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#1e783e" />
                    <span><strong>{t.incidents.observationLabel}</strong> {card.timestamp}</span>
                  </div>
                  {card.source_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={13} color="#1e783e" />
                      <span><strong>{t.incidents.sourceLabel}</strong>{' '}
                        {card.source_url ? (
                          <a href={card.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e783e', textDecoration: 'underline' }}>
                            {card.source_name} <ExternalLink size={10} style={{ display: 'inline' }} />
                          </a>
                        ) : (
                          card.source_name
                        )}
                      </span>
                    </div>
                  )}
                  {card.verification_state && (
                    <div style={{ fontSize: '10px', color: '#0a2213', fontWeight: '600', marginTop: '2px' }}>
                      {t.incidents.statusLabel} {(cardTextAt(cardIndex, 4) || card.verification_state).replace(/_/g, ' ')}
                    </div>
                  )}
                </div>

                {/* Triage Action Log */}
                {card.action_taken && (
                  <div style={{
                    fontSize: '11px',
                    color: '#0a2213',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(10, 34, 19, 0.08)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#1e783e' }}>{t.incidents.triageNote}</strong> {cardTextAt(cardIndex, 3) || card.action_taken}
                  </div>
                )}
              </div>

              {/* Triage Status Update Buttons */}
              <div style={{
                display: 'flex',
                gap: '6px',
                borderTop: '1px solid rgba(10, 34, 19, 0.06)',
                paddingTop: '12px',
                flexWrap: 'wrap'
              }}>
                {['REPORTED', 'CONFIRMED', 'MONITORED', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(card.id, st, `Status set to ${st}`)}
                    disabled={isUpdating || card.status === st}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: card.status === st ? '700' : '500',
                      borderRadius: '6px',
                      border: card.status === st ? '1px solid #1e783e' : '1px solid rgba(10, 34, 19, 0.1)',
                      backgroundColor: card.status === st ? 'rgba(30, 120, 62, 0.12)' : '#ffffff',
                      color: card.status === st ? '#1e783e' : '#52735d',
                      cursor: card.status === st ? 'default' : 'pointer'
                    }}
                  >
                    {STATUS_LABELS[st] ?? st}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

    </div>
  );
}
