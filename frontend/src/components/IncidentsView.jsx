import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Radio, 
  Building, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Send, 
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search
} from 'lucide-react';

export default function IncidentsView({ lang = 'en' }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = [
    { key: 'All', label: 'All' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'Infrastructure', label: 'Bridges & Roads' },
    { key: 'Flood', label: 'Floods' },
    { key: 'Radar', label: 'Radar' }
  ];

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/incidents');
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
  }, []);

  const handleUpdateStatus = async (id, newStatus, actionNote) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, action_note: actionNote })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS' && data.incident) {
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
      }
    } catch (e) {
      alert("Failed to update status in backend database.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Radar': return <Radio size={16} color="#1e783e" />;
      case 'Landslide': return <AlertTriangle size={16} color="#ff3b30" />;
      case 'Infrastructure': return <Navigation size={16} color="#ff9500" />;
      case 'Flood': return <AlertTriangle size={16} color="#1e783e" />;
      default: return <Building size={16} color="#1e783e" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
      case 'UNACKNOWLEDGED':
        return { color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.25)', label: status };
      case 'TRIAGED':
        return { color: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)', border: '1px solid rgba(255, 149, 0, 0.25)', label: 'TRIAGED' };
      case 'DISPATCHED':
        return { color: '#1e783e', bg: 'rgba(30, 120, 62, 0.12)', border: '1px solid rgba(30, 120, 62, 0.25)', label: 'DISPATCHED' };
      case 'RESOLVED':
        return { color: '#1e783e', bg: 'rgba(30, 120, 62, 0.12)', border: '1px solid rgba(30, 120, 62, 0.25)', label: 'RESOLVED' };
      default:
        return { color: '#0a2213', bg: '#f2f7f4', border: '1px solid rgba(10, 34, 19, 0.08)', label: status };
    }
  };

  const filteredIncidents = incidents.filter(item => {
    const matchesFilter = activeFilter === 'All' 
      ? true 
      : (activeFilter === 'CRITICAL' ? item.severity === 'CRITICAL' : item.category === activeFilter);
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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
                INCIDENTS
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
                LIVE DB
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#52735d', marginTop: '2px' }}>
              Field triage, evacuation status, and emergency dispatch notes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(10, 34, 19, 0.12)',
            borderRadius: '9999px',
            padding: '6px 14px',
            gap: '8px'
          }}>
            <Search size={14} color="#52735d" />
            <input 
              type="text" 
              placeholder="Filter incidents..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '150px', color: '#0a2213' }}
            />
          </div>

          <button 
            onClick={fetchIncidents}
            className="btn-dark-green-pill"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '600' }}
            disabled={isLoading}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-pill-row">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.key;
          return (
            <button
              key={opt.key}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFilter(opt.key)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Incidents Cards Grid */}
      <div className="incidents-grid">
        {filteredIncidents.map((card) => {
          const isDanger = card.severity === 'CRITICAL';
          const statusStyle = getStatusBadge(card.status);
          const isUpdating = updatingId === card.id;

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
                {/* Card Header: Category + ID + Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '5px',
                      borderRadius: '8px',
                      backgroundColor: '#f2f7f4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getCategoryIcon(card.category)}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#52735d' }}>
                      {card.id} · {card.category.toUpperCase()}
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
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0a2213', margin: '0 0 5px 0', letterSpacing: '-0.01em' }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: '11.5px', color: '#52735d', lineHeight: '1.45', margin: '0 0 12px 0' }}>
                  {card.subtitle}
                </p>

                {/* Spatial Metadata Row */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#52735d',
                  backgroundColor: '#f2f7f4',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  border: '1px solid rgba(10, 34, 19, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="#1e783e" />
                    <span>Lat: <strong style={{ color: '#0a2213' }}>{card.lat.toFixed(3)}</strong>, Lon: <strong style={{ color: '#0a2213' }}>{card.lon.toFixed(3)}</strong></span>
                  </div>

                  {card.population_affected > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} color="#ff3b30" />
                      <span>Pop: <strong style={{ color: '#ff3b30' }}>{card.population_affected.toLocaleString()} cut off</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#52735d" />
                    <span>{card.timestamp}</span>
                  </div>
                </div>

                {/* Assigned Team & Action Note */}
                {card.action_taken && (
                  <div style={{ fontSize: '11px', color: '#0a2213', backgroundColor: 'rgba(30, 120, 62, 0.08)', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(30, 120, 62, 0.2)' }}>
                    <strong style={{ color: '#1b5e20' }}>Action Log:</strong> {card.action_taken}
                  </div>
                )}
              </div>

              {/* Triage Action Buttons - Connected directly to Backend Database */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid rgba(10, 34, 19, 0.08)',
                paddingTop: '12px',
                marginTop: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleUpdateStatus(card.id, 'ACKNOWLEDGED', 'Acknowledged by Sector Command')}
                  className="filter-pill"
                  style={{
                    fontSize: '10.5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: card.status === 'ACKNOWLEDGED' ? '#0d2818' : '#ffffff',
                    color: card.status === 'ACKNOWLEDGED' ? '#FFFFFF' : '#0a2213',
                    border: card.status === 'ACKNOWLEDGED' ? '1px solid rgba(30, 120, 62, 0.5)' : '1.5px solid rgba(13, 40, 24, 0.22)',
                    boxShadow: card.status === 'ACKNOWLEDGED' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none'
                  }}
                  disabled={isUpdating}
                >
                  Acknowledge
                </button>

                <button
                  onClick={() => handleUpdateStatus(card.id, 'TRIAGED', 'Triage priority established; assessment drone en route')}
                  className="filter-pill"
                  style={{
                    fontSize: '10.5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: card.status === 'TRIAGED' ? '#ff9500' : '#ffffff',
                    color: card.status === 'TRIAGED' ? '#FFFFFF' : '#0a2213',
                    border: card.status === 'TRIAGED' ? 'none' : '1.5px solid rgba(13, 40, 24, 0.22)'
                  }}
                  disabled={isUpdating}
                >
                  Triage
                </button>

                <button
                  onClick={() => handleUpdateStatus(card.id, 'DISPATCHED', 'Rotary-wing / engineering relief unit dispatched')}
                  className="filter-pill"
                  style={{
                    fontSize: '10.5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: card.status === 'DISPATCHED' ? '#0d2818' : '#ffffff',
                    color: card.status === 'DISPATCHED' ? '#FFFFFF' : '#0a2213',
                    border: card.status === 'DISPATCHED' ? '1px solid rgba(30, 120, 62, 0.5)' : '1.5px solid rgba(13, 40, 24, 0.22)',
                    boxShadow: card.status === 'DISPATCHED' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none'
                  }}
                  disabled={isUpdating}
                >
                  Dispatch
                </button>

                <button
                  onClick={() => handleUpdateStatus(card.id, 'RESOLVED', 'Bypass opened or situation stabilized')}
                  className="filter-pill"
                  style={{
                    fontSize: '10.5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: card.status === 'RESOLVED' ? '#0d2818' : '#ffffff',
                    color: card.status === 'RESOLVED' ? '#FFFFFF' : '#0a2213',
                    border: card.status === 'RESOLVED' ? '1px solid rgba(30, 120, 62, 0.5)' : '1.5px solid rgba(13, 40, 24, 0.22)',
                    boxShadow: card.status === 'RESOLVED' ? '0 2px 8px rgba(10, 34, 19, 0.25)' : 'none'
                  }}
                  disabled={isUpdating}
                >
                  Resolve
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
