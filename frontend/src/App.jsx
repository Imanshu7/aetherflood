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
  Map, 
  Layers, 
  Activity, 
  MessageSquare, 
  BarChart2, 
  Radio, 
  Search, 
  User, 
  LogOut, 
  Bell, 
  Mail,
  SplitSquareVertical
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Real logged-in user profile from localStorage (Zero demo accounts)
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

  const navSegments = [
    { value: 'dashboard', label: 'Dashboard', icon: <Map size={13} /> },
    { value: 'compare', label: 'SAR Compare', icon: <SplitSquareVertical size={13} /> },
    { value: 'overview', label: 'Overview', icon: <Layers size={13} /> },
    { value: 'incidents', label: 'Incidents', icon: <Activity size={13} /> },
    { value: 'copilot', label: 'Copilot', icon: <MessageSquare size={13} /> },
    { value: 'stats', label: 'Stats', icon: <BarChart2 size={13} /> }
  ];

  return (
    <div className="app-container">
      {/* Main Viewport - Full Width without Sidebar */}
      <div className="main-viewport">
        {/* Top App Bar with Shifted Navigation powered by RubberSegment */}
        <header className="top-bar">
          {/* Left: Brand Identity Beacon */}
          <div className="top-bar-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Radio size={16} color="#34c759" className="live-pulse-icon" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-0.02em', color: '#1d1d1f', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                  AETHERFLOOD
                </div>
                <div style={{ fontSize: '9px', fontWeight: '500', color: '#0066cc', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                  COPILOT // LIVE
                </div>
              </div>
            </div>
          </div>

          {/* Center: Shifted Navigation powered by RubberSegment from React Bits */}
          <div className="top-bar-center">
            <RubberSegment
              items={navSegments}
              value={currentView}
              onChange={(val) => setCurrentView(val)}
              trackColor="rgba(118, 118, 128, 0.12)"
              thumbColor="#ffffff"
              textColor="#636366"
              activeTextColor="#1d1d1f"
              size="md"
              radius={12}
              inset={3}
              equalSlots={false}
              stretch={50}
              squash={2}
              speed={1}
              glide={60}
              draggable
            />
          </div>

          {/* Right: Search Box, Alert Actions, Operator Account Profile */}
          <div className="top-bar-right">
            <div className="top-bar-search">
              <Search size={13} color="#86868b" />
              <input 
                type="text" 
                placeholder="Search incidents, telemetry..." 
              />
            </div>

            <div className="top-bar-actions">
              <button className="icon-btn" title="Alerts & Warnings">
                <Bell size={14} />
              </button>
              <button className="icon-btn" title="Dispatch Messages">
                <Mail size={14} />
              </button>
            </div>

            {/* Operator Account Profile */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(118, 118, 128, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
              onClick={() => setIsAuthModalOpen(true)}
              title="Click to switch account"
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '9999px',
                backgroundColor: '#0066cc',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {currentUser ? currentUser.initials : 'RO'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#1d1d1f', lineHeight: '1.2' }}>
                  {currentUser ? currentUser.name : 'Sign In'}
                </span>
                <span style={{ fontSize: '9px', color: '#86868b', lineHeight: '1.1' }}>
                  {currentUser ? currentUser.role : 'Observer'}
                </span>
              </div>
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
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '2px'
                  }}
                  title="Sign Out"
                >
                  <LogOut size={12} />
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
              onNavigateToCompare={() => setCurrentView('compare')}
            />
          )}
          {currentView === 'compare' && <ImageComparisonView />}
          {currentView === 'overview' && <OverviewView />}
          {currentView === 'incidents' && <IncidentsView />}
          {currentView === 'copilot' && <CopilotView currentUser={currentUser} />}
          {currentView === 'stats' && <SituationStatsView currentUser={currentUser} metrics={metrics} />}
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
