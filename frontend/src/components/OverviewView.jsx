import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

export default function OverviewView() {
  const [operationalTeams] = useState([
    {
      role: "Incident Lead",
      subrole: "Disaster Command Division",
      initials: "IC",
      color: "#163832",
      textColor: "#FFFFFF",
      border: "1.5px solid #245E53"
    },
    {
      role: "SAR Hydrology Analyst",
      subrole: "Sentinel-1 Radar Team",
      initials: "SA",
      color: "#0284C7",
      textColor: "#FFFFFF",
      border: "1.5px solid #BAE6FD"
    },
    {
      role: "GIS Network Engineer",
      subrole: "ohsome & Road Topology",
      initials: "GE",
      color: "#BE123C",
      textColor: "#FFFFFF",
      border: "1.5px solid #FECDD3"
    },
    {
      role: "Aviation Logistics Lead",
      subrole: "Isolated Town Air-Drops",
      initials: "AL",
      color: "#15803D",
      textColor: "#FFFFFF",
      border: "1.5px solid #A7F3D0"
    }
  ]);

  const [tasks, setTasks] = useState({
    command: [
      { id: 1, name: "Sentinel-1 Orbit Track #121 Audit", due: "Today", status: "Active", priority: "Critical" },
      { id: 2, name: "ohsome OSM Snapshot Baseline Check (2026-07-27)", due: "Today", status: "Completed", priority: "Normal" },
      { id: 3, name: "Direct UAV Reconnaissance to Ramche Landslide", due: "Friday", status: "Ongoing", priority: "Urgent" }
    ],
    technical: [
      { id: 4, name: "NetworkX Graph Dijkstra Shortest Path Run", due: "Today", status: "Completed", priority: "High" },
      { id: 5, name: "Copernicus DEM 30m Slope Mask Calibration", due: "Thursday", status: "Active", priority: "Medium" },
      { id: 6, name: "Trishuli Hospital Access Rerouting Validation", due: "Friday", status: "Ongoing", priority: "Urgent" }
    ]
  });

  const toggleTaskStatus = (section, id) => {
    setTasks(prev => ({
      ...prev,
      [section]: prev[section].map(t => {
        if (t.id === id) {
          const nextStatus = t.status === 'Completed' ? 'Active' : 'Completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    }));
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return { color: '#BE123C', bg: '#FFF1F2', border: '1px solid #FECDD3' };
      case 'Urgent': return { color: '#D97706', bg: '#FEF3C7', border: '1px solid #FDE68A' };
      case 'High': return { color: '#163832', bg: '#E6F4F1', border: '1px solid #8EBAAF' };
      default: return { color: '#15803D', bg: '#ECFDF5', border: '1px solid #A7F3D0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 2x2 Grid matching Overview Wireframe */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.35fr',
        gap: '16px'
      }}>
        
        {/* Top-Left Card: Calendar Widget */}
        <div className="grey-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>October 2026</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn" style={{ width: '26px', height: '26px' }}>
                <ChevronLeft size={13} />
              </button>
              <button className="icon-btn" style={{ width: '26px', height: '26px' }}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-primary)'
          }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} style={{ fontWeight: '600', color: 'var(--text-secondary)', paddingBottom: '3px', fontSize: '10px' }}>{day}</div>
            ))}
            <div style={{ color: '#94A3B8' }}>27</div>
            <div style={{ color: '#94A3B8' }}>28</div>
            <div style={{ color: '#94A3B8' }}>29</div>
            <div style={{ color: '#94A3B8' }}>30</div>
            <div style={{ color: '#94A3B8' }}>31</div>
            <div>1</div>
            <div>2</div>

            <div style={{
              background: '#163832',
              borderRadius: '4px',
              width: '22px',
              height: '22px',
              margin: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '700'
            }}>3</div>
            <div>4</div>
            <div>5</div>
            <div>6</div>
            <div>7</div>
            <div>8</div>
            <div>9</div>

            <div>10</div>
            <div>11</div>
            <div>12</div>
            <div>13</div>
            <div>14</div>
            <div>15</div>
            <div>16</div>

            <div>17</div>
            <div>18</div>
            <div>19</div>
            <div>20</div>
            <div>21</div>
            <div>22</div>
            <div>23</div>

            <div>24</div>
            <div>25</div>
            <div>26</div>
            <div>27</div>
            <div>28</div>
            <div>29</div>
            <div>30</div>
          </div>
        </div>

        {/* Top-Right Card: Operational Status */}
        <div className="grey-card" style={{ padding: '18px 20px' }}>
          <div className="grey-card-title">
            Operational Status Matrix
          </div>

          {/* Column labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px repeat(6, 1fr)',
            fontSize: '10px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            <div></div>
            <div>Rainfall</div>
            <div>River</div>
            <div>Pop.</div>
            <div>Res.</div>
            <div>Alerts</div>
            <div>Forecast</div>
          </div>

          {/* Timeline Gantt Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '600' }}>Sensors online</span>
              <div style={{ height: '9px', background: '#15803D', borderRadius: '2px', width: '85%' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '600' }}>Active incidents</span>
              <div style={{ height: '9px', background: '#BE123C', borderRadius: '2px', width: '65%', marginLeft: '15%' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '600' }}>Predicted extent</span>
              <div style={{ height: '9px', background: '#0284C7', borderRadius: '2px', width: '40%', marginLeft: '50%' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '600' }}>Radar overlay</span>
              <div style={{ display: 'flex', gap: '10px', width: '100%', paddingLeft: '35%' }}>
                <div style={{ height: '9px', background: '#163832', borderRadius: '2px', width: '28px' }}></div>
                <div style={{ height: '9px', background: '#245E53', borderRadius: '2px', width: '90px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Left Card: Response Teams */}
        <div className="grey-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="grey-card-title" style={{ marginBottom: 0 }}>Response Command Roles</span>
            <span style={{ fontSize: '10.5px', color: 'var(--theme-verified)', fontWeight: '600' }}>
              Active Command
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {operationalTeams.map((member, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: 'var(--card-bg-light)', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '6px',
                  border: '1px solid var(--card-border)'
                }}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '4px', 
                  backgroundColor: member.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: member.textColor || '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: member.border || '1.5px solid #245E53'
                }}>
                  {member.initials}
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{member.role}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{member.subrole}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Right Card: Task Assignments */}
        <div className="grey-card" style={{ padding: '18px 20px' }}>
          <div className="grey-card-title">
            Operational Action Plan
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Command Section */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
                INCIDENT COMMAND ITEMS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tasks.command.map((task) => {
                  const pStyle = getPriorityStyle(task.priority);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTaskStatus('command', task.id)}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '20px 1fr 70px 75px 65px', 
                        alignItems: 'center',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '3px', 
                        border: '1.5px solid #245E53',
                        background: task.status === 'Completed' ? '#15803D' : 'transparent'
                      }}></div>
                      <span style={{ 
                        color: 'var(--text-primary)', 
                        fontWeight: '500',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}>{task.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{task.due}</span>
                      <span className="status-badge" style={{ padding: '2px 8px', fontSize: '9.5px' }}>{task.status}</span>
                      <span className="status-badge" style={{ color: pStyle.color, backgroundColor: pStyle.bg, border: pStyle.border || 'transparent', padding: '2px 8px', fontSize: '9.5px' }}>{task.priority}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical GIS Section */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
                HYDROLOGY & NETWORK ITEMS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tasks.technical.map((task) => {
                  const pStyle = getPriorityStyle(task.priority);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTaskStatus('technical', task.id)}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '20px 1fr 70px 75px 65px', 
                        alignItems: 'center',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '3px', 
                        border: '1.5px solid #245E53',
                        background: task.status === 'Completed' ? '#15803D' : 'transparent'
                      }}></div>
                      <span style={{ 
                        color: 'var(--text-primary)', 
                        fontWeight: '500',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}>{task.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{task.due}</span>
                      <span className="status-badge" style={{ padding: '2px 8px', fontSize: '9.5px' }}>{task.status}</span>
                      <span className="status-badge" style={{ color: pStyle.color, backgroundColor: pStyle.bg, padding: '2px 8px', fontSize: '9.5px' }}>{task.priority}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
