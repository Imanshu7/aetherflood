import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import ImageComparisonView from './components/ImageComparisonView';
import OverviewView from './components/OverviewView';
import IncidentsView from './components/IncidentsView';
import CopilotView from './components/CopilotView';
import SituationStatsView from './components/SituationStatsView';
import AuthModal from './components/AuthModal';
import RubberSegment from './components/RubberSegment';
import { 
  Radio, 
  Search, 
  Mic,
  LogOut 
} from 'lucide-react';

import { TRANSLATIONS } from './data/translations';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' (Image 1) | 'focus' (Image 2)
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
    } catch (e) {}
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Fetch benchmark & damage metrics from FastAPI backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/benchmark/trishuli')
      .then(res => res.json())
      .then(data => {
        setBenchmarkData(data);
      })
      .catch(err => {
        console.warn('Backend benchmark loading fallback:', err);
      });

    fetch('http://127.0.0.1:8000/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
      })
      .catch(err => {
        console.warn('Backend metrics loading fallback:', err);
      });
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Authentic Apple Tab Bar items (Matches Tab 1 ... Tab 5 in Image 1 & Image 2)
  const navSegments = [
    { value: 'dashboard', label: 'Dashboard', title: `Dashboard: ${t.nav.dashboard}` },
    { value: 'compare', label: 'Compare', title: `Compare: ${t.nav.compare}` },
    { value: 'overview', label: 'Overview', title: `Overview: ${t.nav.overview}` },
    { value: 'incidents', label: 'Incidents', title: `Incidents: ${t.nav.incidents}` },
    { value: 'copilot', label: 'Copilot', title: `Copilot: ${t.nav.copilot}` }
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
                  COPILOT // LIVE
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
              trackColor="rgba(255, 255, 255, 0.65)"
              thumbColor="#ffffff"
              textColor="#1f422b"
              activeTextColor="#0a2213"
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

          {/* Right: Search Box, Dark Pill Action, Language, Account Profile */}
          <div className="top-bar-right">
            {/* Apple Search Pill (with SF Search icon, Search input & Mic icon) */}
            <div className="top-bar-search">
              <Search size={13} color="#8e8e93" />
              <input 
                type="text" 
                placeholder="Search..." 
              />
              <Mic size={13} color="#8e8e93" style={{ cursor: 'pointer', flexShrink: 0 }} title="Voice dictation input" />
            </div>

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
                    benchmarkData={benchmarkData} 
                    metrics={metrics} 
                    viewMode={viewMode}
                    onToggleViewMode={() => setViewMode(v => v === 'standard' ? 'focus' : 'standard')}
                    onNavigateToCompare={() => setCurrentView('compare')}
                    onNavigateToCopilot={() => setCurrentView('copilot')}
                    onNavigateToIncidents={() => setCurrentView('incidents')}
                    lang={lang}
                  />
                )}
                {currentView === 'compare' && <ImageComparisonView lang={lang} />}
                {currentView === 'overview' && <OverviewView lang={lang} />}
                {currentView === 'incidents' && <IncidentsView lang={lang} />}
                {currentView === 'copilot' && <CopilotView currentUser={currentUser} lang={lang} onLanguageChange={handleLanguageChange} />}
                {currentView === 'stats' && <SituationStatsView currentUser={currentUser} metrics={metrics} lang={lang} />}
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
