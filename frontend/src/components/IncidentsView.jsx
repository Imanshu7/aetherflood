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

export default function IncidentsView() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = [
    'All',
    'CRITICAL',
    'Landslide',
    'Infrastructure',
    'Flood',
    'Radar'
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
      case 'Radar': return <Radio size={16} color="#0066cc" />;
      case 'Landslide': return <AlertTriangle size={16} color="#ff3b30" />;
      case 'Infrastructure': return <Navigation size={16} color="#ff9500" />;
      case 'Flood': return <AlertTriangle size={16} color="#0066cc" />;
      default: return <Building size={16} color="#34c759" />;
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
        return { color: '#0066cc', bg: 'rgba(0, 102, 204, 0.08)', border: '1px solid rgba(0, 102, 204, 0.2)', label: 'TEAM DISPATCHED' };
      case 'RESOLVED':
        return { color: '#34c759', bg: 'rgba(52, 199, 89, 0.12)', border: '1px solid rgba(52, 199, 89, 0.25)', label: 'RESOLVED' };
      default:
        return { color: '#1d1d1f', bg: '#f5f5f7', border: '1px solid rgba(0, 0, 0, 0.08)', label: status };
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
        padding: '14px 20px',
        borderRadius: '18px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#0066cc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1d1d1f', letterSpacing: '-0.015em' }}>
                TACTICAL TRIAGE & INCIDENT DISPATCH CONSOLE
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(52, 199, 89, 0.12)',
                color: '#34c759',
                border: '1px solid rgba(52, 199, 89, 0.25)'
              }}>
                LIVE DATABASE PERSISTED
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>
              Manage spatial incidents with real-time field triage, evacuation status, and emergency dispatch notes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f5f5f7',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '9999px',
            padding: '6px 14px',
            gap: '8px'
          }}>
            <Search size={14} color="#86868b" />
            <input 
              type="text" 
              placeholder="Filter incidents..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '150px', color: '#1d1d1f' }}
            />
          </div>

          <button 
            onClick={fetchIncidents}
            className="btn-white-pill"
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
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'CRITICAL' ? 'Critical (Landslides & Washouts)' : filter}
            </button>
          );
        })}
      </div>

      {/* Incidents Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredIncidents.map((card) => {
          const isDanger = card.severity === 'CRITICAL';
          const statusStyle = getStatusBadge(card.status);
          const isUpdating = updatingId === card.id;

          return (
            <div 
              key={card.id} 
              className="grey-card" 
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: isDanger ? '4px solid #ff3b30' : '4px solid #0066cc',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div>
                {/* Card Header: Category + ID + Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '5px',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getCategoryIcon(card.category)}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#86868b' }}>
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
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#1d1d1f', margin: '0 0 5px 0', letterSpacing: '-0.01em' }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: '11.5px', color: '#86868b', lineHeight: '1.45', margin: '0 0 12px 0' }}>
                  {card.subtitle}
                </p>

                {/* Spatial Metadata Row */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#86868b',
                  backgroundColor: '#f5f5f7',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="#0066cc" />
                    <span>Lat: <strong style={{ color: '#1d1d1f' }}>{card.lat.toFixed(3)}</strong>, Lon: <strong style={{ color: '#1d1d1f' }}>{card.lon.toFixed(3)}</strong></span>
                  </div>

                  {card.population_affected > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} color="#ff3b30" />
                      <span>Pop: <strong style={{ color: '#ff3b30' }}>{card.population_affected.toLocaleString()} cut off</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#86868b" />
                    <span>{card.timestamp}</span>
                  </div>
                </div>

                {/* Assigned Team & Action Note */}
                {card.action_taken && (
                  <div style={{ fontSize: '11px', color: '#1d1d1f', backgroundColor: 'rgba(52, 199, 89, 0.08)', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(52, 199, 89, 0.2)' }}>
                    <strong style={{ color: '#1b5e20' }}>Action Log:</strong> {card.action_taken}
                  </div>
                )}
              </div>

              {/* Triage Action Buttons - Connected directly to Backend Database */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
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
                    backgroundColor: card.status === 'ACKNOWLEDGED' ? '#0066cc' : '#f5f5f7',
                    color: card.status === 'ACKNOWLEDGED' ? '#FFFFFF' : '#1d1d1f',
                    border: card.status === 'ACKNOWLEDGED' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
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
                    backgroundColor: card.status === 'TRIAGED' ? '#ff9500' : '#f5f5f7',
                    color: card.status === 'TRIAGED' ? '#FFFFFF' : '#1d1d1f',
                    border: card.status === 'TRIAGED' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
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
                    backgroundColor: card.status === 'DISPATCHED' ? '#0066cc' : '#f5f5f7',
                    color: card.status === 'DISPATCHED' ? '#FFFFFF' : '#1d1d1f',
                    border: card.status === 'DISPATCHED' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
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
                    backgroundColor: card.status === 'RESOLVED' ? '#34c759' : '#f5f5f7',
                    color: card.status === 'RESOLVED' ? '#FFFFFF' : '#1d1d1f',
                    border: card.status === 'RESOLVED' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
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
