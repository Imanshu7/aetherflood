import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import CopernicusDEMCompareView from './components/CopernicusEMSCompareView';
import OverviewView from './components/OverviewView';
import IncidentsView from './components/IncidentsView';
import CopilotView from './components/CopilotView';
import SituationStatsView from './components/SituationStatsView';
import AuthModal from './components/AuthModal';
import RubberSegment from './components/RubberSegment';
import { 
  Radio, 
  LogOut 
} from 'lucide-react';

import { TRANSLATIONS } from './data/translations';
import { apiUrl } from './config';

export default function App() {
  const readMapIncidentFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    if ((requestedView && requestedView !== 'dashboard')
      || (!params.has('incidentId') && (!params.has('lat') || !params.has('lon')))) {
      return null;
    }
    const latValue = params.get('lat');
    const lonValue = params.get('lon');
    const lat = latValue === null || latValue.trim() === '' ? Number.NaN : Number(latValue);
    const lon = lonValue === null || lonValue.trim() === '' ? Number.NaN : Number(lonValue);
    return {
      id: params.get('incidentId') || 'map-location',
      title: params.get('title') || 'Selected incident',
      location_name: params.get('location') || '',
      timestamp: params.get('date') || '',
      source_name: params.get('source') || '',
      verification_state: params.get('verification') || '',
      resolveCoordinates: !params.has('lat') || !params.has('lon'),
      lat,
      lon
    };
  };
  const [currentView, setCurrentView] = useState(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view');
    return ['dashboard', 'compare', 'overview', 'incidents', 'copilot', 'stats'].includes(requestedView)
      ? requestedView
      : 'dashboard';
  });
  const [mapIncident, setMapIncident] = useState(readMapIncidentFromUrl);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() =>
    readMapIncidentFromUrl() ? 'focus' : 'standard'
  );
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('aetherflood_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('aetherflood_lang', newLang);
    } catch (e) {
      console.warn("Storage save:", e);
    }
  };

  // Real logged-in user profile from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aetherflood_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage access:", e);
    }
    return {
      name: "Commander Sarah Jenkins",
      email: "s.jenkins@disaster-response.gov",
      role: "Emergency Response Lead",
      initials: "SJ"
    };
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('aetherflood_user', JSON.stringify(user));
    } catch (e) {
      console.warn("Storage save:", e);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('aetherflood_user');
    } catch {}
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  const navigateToIncidentMap = (incident) => {
    const params = new URLSearchParams({
      view: 'dashboard',
      incidentId: String(incident.id ?? ''),
      title: String(incident.title ?? ''),
      location: String(incident.location_name ?? ''),
      date: String(incident.timestamp ?? ''),
      source: String(incident.source_name ?? ''),
      verification: String(incident.verification_state ?? ''),
      lat: String(incident.lat ?? ''),
      lon: String(incident.lon ?? '')
    });
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    setMapIncident(incident);
    setViewMode('focus');
    setCurrentView('dashboard');
  };

  const navigateToIncidents = () => {
    window.history.pushState({}, '', `${window.location.pathname}?view=incidents`);
    setCurrentView('incidents');
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedView = params.get('view');
      setCurrentView(['dashboard', 'compare', 'overview', 'incidents', 'copilot', 'stats'].includes(requestedView)
        ? requestedView
        : 'dashboard');
      const incident = readMapIncidentFromUrl();
      setMapIncident(incident);
      setViewMode(incident ? 'focus' : 'standard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!mapIncident?.resolveCoordinates || !mapIncident.id) return;
    fetch(apiUrl('/api/incidents'))
      .then((response) => {
        if (!response.ok) throw new Error(`Incident lookup failed: HTTP ${response.status}`);
        return response.json();
      })
      .then((records) => {
        if (!Array.isArray(records)) throw new Error('Incident lookup returned an invalid response');
        const record = records.find((item) => String(item.id) === String(mapIncident.id));
        if (!record) {
          console.warn(`No incident record found for map link ${mapIncident.id}`);
          return;
        }
        const params = new URLSearchParams({
          view: 'dashboard',
          incidentId: String(record.id),
          title: String(record.title ?? ''),
          location: String(record.location_name ?? ''),
          date: String(record.timestamp ?? ''),
          source: String(record.source_name ?? ''),
          verification: String(record.verification_state ?? ''),
          lat: String(record.lat ?? ''),
          lon: String(record.lon ?? '')
        });
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        setMapIncident(record);
      })
      .catch((error) => {
        console.warn(`Could not resolve coordinates for incident ${mapIncident.id}:`, error);
      });
  }, [mapIncident?.id]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Authentic Apple Tab Bar items (Matches Tab 1 ... Tab 5 in Image 1 & Image 2)
  const navSegments = [
    { value: 'dashboard', label: t.nav.dashboard, title: `Dashboard: ${t.nav.dashboard}` },
    { value: 'compare', label: t.nav.compare, title: `Compare: ${t.nav.compare}` },
    { value: 'overview', label: t.nav.overview, title: `Overview: ${t.nav.overview}` },
    { value: 'incidents', label: t.nav.incidents, title: `Incidents: ${t.nav.incidents}` },
    { value: 'copilot', label: t.nav.copilot, title: `Copilot: ${t.nav.copilot}` }
  ];

  return (
    <div className="app-container">
      <div className="main-viewport">
        {/* Apple Sub-Nav Frosted Glass Top Bar */}
        <header className="top-bar">
          {/* Left: Brand Identity Beacon */}
          <div className="top-bar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Radio size={16} color="#1e783e" className="live-pulse-icon" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', letterSpacing: '-0.02em', color: '#0a2213', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                  AETHERFLOOD
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: '600', color: '#1e783e', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  DISASTER INTELLIGENCE // PROTOTYPE
                </div>
              </div>
            </div>
          </div>

          {/* Center: Apple Frosted Segmented Tab Control (Tab 1 ... Tab 5) */}
          <div className="top-bar-center">
            <RubberSegment
              items={navSegments}
              value={currentView}
              onChange={(val) => setCurrentView(val)}
              trackColor="#e6f0e8"
              thumbColor="#0d2818"
              textColor="#1f422b"
              activeTextColor="#ffffff"
              size="md"
              radius={9999}
              inset={3}
              equalSlots={false}
              stretch={40}
              squash={2}
              speed={1}
              glide={60}
              draggable
            />
          </div>

          {/* Right: Language and Account Profile */}
          <div className="top-bar-right">
                  {/* Global Language Switcher */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.55)',
                    borderRadius: '9999px',
                    padding: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.7)'
                  }}>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      style={{
                        padding: '2.5px 7.5px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '10.5px',
                        fontWeight: lang === 'en' ? '600' : '500',
                        cursor: 'pointer',
                        backgroundColor: lang === 'en' ? '#0d2818' : 'transparent',
                        color: lang === 'en' ? '#ffffff' : '#636366',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ne')}
                      style={{
                        padding: '2.5px 7.5px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '10.5px',
                        fontWeight: lang === 'ne' ? '600' : '500',
                        cursor: 'pointer',
                        backgroundColor: lang === 'ne' ? '#0d2818' : 'transparent',
                        color: lang === 'ne' ? '#ffffff' : '#636366',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      NE
                    </button>
                  </div>

                  {/* Operator Account Profile */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.55)',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      padding: '2px 7px 2px 3px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                    onClick={() => setIsAuthModalOpen(true)}
                    title="Click to switch account"
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '9999px',
                      backgroundColor: '#0d2818',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9.5px',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {currentUser ? currentUser.initials : 'RO'}
                    </div>
                    <span className="user-pill-name" style={{ 
                      fontSize: '10.5px', 
                      fontWeight: '600', 
                      color: '#0a2213', 
                      whiteSpace: 'nowrap',
                      maxWidth: '75px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {currentUser ? (currentUser.name.replace(/^Commander\s+/i, '').split(' ')[0]) : t.account.signIn}
                    </span>
                    {currentUser && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#86868b',
                          cursor: 'pointer',
                          padding: '1px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={t.account.signOut}
                      >
                        <LogOut size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* View Switcher Container */}
              <main className="page-container">
                {currentView === 'dashboard' && (
                  <DashboardView 
                    viewMode={viewMode}
                    onToggleViewMode={() => setViewMode(v => v === 'standard' ? 'focus' : 'standard')}
                    onNavigateToCompare={() => setCurrentView('compare')}
                    onNavigateToCopilot={() => setCurrentView('copilot')}
                    onNavigateToIncidents={navigateToIncidents}
                    focusedIncident={mapIncident}
                    onClearIncidentFocus={() => {
                      setMapIncident(null);
                      setViewMode('standard');
                      window.history.pushState({}, '', `${window.location.pathname}?view=dashboard`);
                    }}
                    lang={lang}
                  />
                )}
                {currentView === 'compare' && <CopernicusDEMCompareView />}
                {currentView === 'overview' && (
                  <OverviewView
                    onNavigateToCompare={() => setCurrentView('compare')}
                    onNavigateToIncidents={() => setCurrentView('incidents')}
                    lang={lang}
                  />
                )}
                {currentView === 'incidents' && (
                  <IncidentsView onNavigateToMap={navigateToIncidentMap} lang={lang} />
                )}
                {currentView === 'copilot' && <CopilotView currentUser={currentUser} lang={lang} onLanguageChange={handleLanguageChange} />}
                {currentView === 'stats' && <SituationStatsView />}
              </main>
            </div>

            {/* Operator Authentication Modal */}
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        );
      }
