import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MoreHorizontal, 
  MapPin, 
  Clock, 
  FileText,
  AlertTriangle,
  Radio,
  Building,
  Navigation
} from 'lucide-react';
import { TELEMETRY_INCIDENTS } from '../data/telemetryIncidents';

export default function IncidentsView() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [incidents, setIncidents] = useState(TELEMETRY_INCIDENTS);

  const filterOptions = [
    'All',
    'Flood',
    'Landslide',
    'Infrastructure',
    'Radar',
    'Sensors',
    'High'
  ];

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
        }
      })
      .catch(err => {
        console.warn("Using verified telemetry incidents baseline:", err);
      });
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Radar': return <Radio size={22} color="#245E53" />;
      case 'Landslide': return <AlertTriangle size={22} color="#BE123C" />;
      case 'Infrastructure': return <Navigation size={22} color="#BE123C" />;
      case 'Flood': return <AlertTriangle size={22} color="#0284C7" />;
      default: return <Building size={22} color="#15803D" />;
    }
  };

  const getBadgeColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return { color: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' };
      case 'URGENT': return { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
      case 'ACTIVE': return { color: '#FFFFFF', bg: '#163832', border: '#163832' };
      default: return { color: '#163832', bg: '#F8FAF9', border: '#E2E8F0' };
    }
  };

  const safeList = Array.isArray(incidents) ? incidents : TELEMETRY_INCIDENTS;

  const filteredIncidents = activeFilter === 'All' 
    ? safeList 
    : safeList.filter(item => item.category === activeFilter || (activeFilter === 'High' && (item.severity === 'CRITICAL' || item.severity === 'URGENT')));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Filter Pills matching Screenshot 3 */}
      <div className="filter-pill-row">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* 8-Card Grid with real telemetry (No demo stock photos, small typography) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {filteredIncidents.map((card) => {
          const badgeStyle = getBadgeColor(card.severity);
          const isDanger = card.category === 'Landslide' || card.category === 'Infrastructure' || card.severity === 'CRITICAL';
          const isFlood = card.category === 'Flood';
          return (
            <div 
              key={card.id} 
              className="grey-card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                padding: '16px 14px',
                minHeight: '270px',
                justifyContent: 'space-between',
                border: '1.5px solid var(--card-border)'
              }}
            >
              {/* Top Pill Badge */}
              <div 
                className="status-badge" 
                style={{ 
                  padding: '4px 14px', 
                  fontWeight: '700', 
                  fontSize: '10px',
                  color: badgeStyle.color,
                  backgroundColor: badgeStyle.bg,
                  borderColor: badgeStyle.border || 'transparent'
                }}
              >
                {card.badge}
              </div>

              {/* GIS / Telemetry Radar Visual */}
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '6px', 
                backgroundColor: isDanger ? '#FFF1F2' : (isFlood ? '#F0F9FF' : '#ECFDF5'),
                margin: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${isDanger ? '#FECDD3' : (isFlood ? '#BAE6FD' : '#A7F3D0')}`
              }}>
                {getCategoryIcon(card.category)}
                <span style={{ fontSize: '8.5px', color: isDanger ? '#BE123C' : (isFlood ? '#0284C7' : '#15803D'), marginTop: '2px', fontWeight: '700' }}>
                  {card.category.toUpperCase()}
                </span>
              </div>

              {/* Title & Subtitle (Small written text) */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.3' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                  {card.subtitle}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', opacity: 0.8, marginTop: '3px' }}>
                  {card.timestamp}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                <button 
                  className="icon-btn" 
                  style={{ width: '30px', height: '30px' }}
                  onClick={() => alert(`Direct Dispatch initiated for ${card.title}`)}
                  title="Dispatch Team"
                >
                  <Phone size={13} />
                </button>
                <button 
                  className="icon-btn" 
                  style={{ width: '30px', height: '30px' }}
                  onClick={() => alert(`Location: Lat ${card.lat}, Lon ${card.lon}`)}
                  title="View Coordinates"
                >
                  <MapPin size={13} />
                </button>
                <button 
                  className="icon-btn" 
                  style={{ width: '30px', height: '30px' }}
                  onClick={() => alert(`Incident ID: ${card.id} | Severity: ${card.severity}`)}
                  title="Incident Details"
                >
                  <FileText size={13} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
