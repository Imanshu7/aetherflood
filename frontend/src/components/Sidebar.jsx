import React from 'react';
import { 
  Map, 
  Layers, 
  Settings, 
  LogOut, 
  Activity, 
  BarChart2, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Radio 
} from 'lucide-react';
import RubberSegment from './RubberSegment';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  openAuthModal, 
  onLogout, 
  isCollapsed = false, 
  onToggleCollapse 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Map },
    { id: 'overview', label: 'Situation Overview', icon: Layers },
    { id: 'incidents', label: 'Incident Feed', icon: Activity },
    { id: 'copilot', label: 'Aether Copilot', icon: MessageSquare },
    { id: 'stats', label: 'Situation Stats', icon: BarChart2 },
  ];

  const sidebarSegments = [
    { value: 'dashboard', label: 'Map' },
    { value: 'overview', label: 'Matrix' },
    { value: 'incidents', label: 'Feed' },
    { value: 'copilot', label: 'AI' }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand & Single Canonical Collapse/Expand Toggle Header */}
      <div className="sidebar-brand-header">
        {!isCollapsed && (
          <div className="sidebar-brand-title">
            <Radio size={15} className="live-pulse-icon" />
            <div className="sidebar-brand-text">
              <span className="brand-main">AETHERFLOOD</span>
              <span className="brand-sub">COPILOT // LIVE</span>
            </div>
          </div>
        )}
        <button 
          className="sidebar-toggle-btn" 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* RubberSegment Control inside Sidebar */}
      {!isCollapsed && (
        <div style={{ marginBottom: '14px', padding: '0 2px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            fontSize: '9.5px', 
            fontWeight: '700', 
            color: '#8EBAAF', 
            marginBottom: '6px', 
            letterSpacing: '0.05em' 
          }}>
            <span>TACTICAL SCOPE</span>
            <span style={{ fontSize: '8.5px', opacity: 0.75 }}>RUBBER</span>
          </div>
          <RubberSegment
            items={sidebarSegments}
            value={sidebarSegments.some(s => s.value === currentView) ? currentView : 'dashboard'}
            onChange={(val) => setCurrentView(val)}
            trackColor="#0E2420"
            thumbColor="#245E53"
            textColor="#8EBAAF"
            activeTextColor="#FFFFFF"
            size="sm"
            radius={6}
            inset={2}
            equalSlots={true}
            stretch={80}
            squash={2}
            speed={1}
            draggable
          />
        </div>
      )}

      {/* Unified Single Operator Account Card */}
      <div 
        className="user-profile-badge" 
        title={isCollapsed ? (currentUser ? `${currentUser.name} (${currentUser.role})` : 'Operator Sign In') : "Operator Account Profile"}
      >
        <div 
          className="user-avatar-badge"
          onClick={openAuthModal}
          style={{ cursor: 'pointer' }}
          title="Click to switch account"
        >
          {currentUser ? currentUser.initials : <User size={15} />}
        </div>
        {!isCollapsed && (
          <>
            <div className="user-info" onClick={openAuthModal} style={{ cursor: 'pointer' }}>
              <span className="user-name">
                {currentUser ? currentUser.name : 'Sign In / Register'}
              </span>
              <span className="user-email">
                {currentUser ? currentUser.role : 'No active session'}
              </span>
            </div>
            {currentUser && (
              <button 
                className="user-logout-inline" 
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Strict Hackathon Compliance Indicator */}
      <div 
        className="compliance-box"
        title="Strict Hackathon Compliance: Sentinel-1 Track #121, OSM Snapshot 2026-07-27, Copernicus DEM <= 18°"
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px', 
          color: '#8EBAAF', 
          fontWeight: '600', 
          justifyContent: isCollapsed ? 'center' : 'flex-start' 
        }}>
          <ShieldAlert size={isCollapsed ? 16 : 13} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Rules Enforced</span>}
        </div>
        {!isCollapsed && (
          <div className="compliance-details">
            <div>• Sentinel-1: Track #121</div>
            <div>• OSM Snapshot: 2026-07-27</div>
            <div>• Zero-Hallucination SITREP</div>
          </div>
        )}
      </div>

      {/* Bottom Settings */}
      <div className="sidebar-bottom">
        <button 
          className="nav-item" 
          onClick={() => alert("Pipeline Rules: Sentinel-1 relative orbit locked to 121; ohsome pre-event snapshot locked to 2026-07-27T00:00:00Z.")}
          title={isCollapsed ? "Pipeline Settings" : undefined}
        >
          <Settings size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Settings & Rules</span>}
        </button>
      </div>
    </aside>
  );
}
