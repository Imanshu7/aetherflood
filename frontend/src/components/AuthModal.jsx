import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { apiUrl } from '../config';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Emergency Response Lead'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert("Please enter your name and email.");
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.user) {
        onLoginSuccess(data.user);
      } else {
        const fallbackUser = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          initials: form.name.trim().slice(0, 2).toUpperCase()
        };
        onLoginSuccess(fallbackUser);
      }
    } catch {
      const fallbackUser = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        initials: form.name.trim().slice(0, 2).toUpperCase()
      };
      onLoginSuccess(fallbackUser);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '380px', 
          width: '100%', 
          backgroundColor: '#ffffff',
          borderRadius: '18px', 
          padding: '22px 24px',
          boxShadow: '0 20px 40px rgba(10, 34, 19, 0.15)',
          border: '1px solid rgba(10, 34, 19, 0.12)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#1e783e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0a2213', margin: 0, letterSpacing: '-0.02em' }}>
                Sign In
              </h2>
              <p style={{ fontSize: '11px', color: '#52735d', margin: '2px 0 0 0' }}>
                Command session credentials
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              width: '26px', 
              height: '26px', 
              borderRadius: '9999px', 
              backgroundColor: '#f2f7f4', 
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#52735d'
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#0a2213', display: 'block', marginBottom: '4px' }}>
              Name / Call-Sign
            </label>
            <input 
              type="text" 
              placeholder="e.g. Sarah Jenkins"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
              style={{
                backgroundColor: '#f6faf7',
                border: '1px solid rgba(10, 34, 19, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
                color: '#0a2213',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#0a2213', display: 'block', marginBottom: '4px' }}>
              Agency Email
            </label>
            <input 
              type="email" 
              placeholder="e.g. s.jenkins@response.gov"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
              style={{
                backgroundColor: '#f6faf7',
                border: '1px solid rgba(10, 34, 19, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
                color: '#0a2213',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#0a2213', display: 'block', marginBottom: '4px' }}>
              Command Role
            </label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              style={{
                backgroundColor: '#f6faf7',
                border: '1px solid rgba(10, 34, 19, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
                color: '#0a2213',
                boxSizing: 'border-box'
              }}
            >
              <option value="Emergency Response Lead">Emergency Response Lead</option>
              <option value="SAR Radar Specialist">SAR Radar Specialist</option>
              <option value="GIS Analyst">GIS Analyst</option>
              <option value="Medical Coordinator">Medical Coordinator</option>
            </select>
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              background: 'linear-gradient(180deg, #133c23 0%, #0d2818 100%)', 
              color: '#ffffff', 
              border: '1px solid rgba(52, 199, 89, 0.4)', 
              borderRadius: '9999px', 
              padding: '9px 14px', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 14px rgba(10, 34, 19, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '12px', fontSize: '10.5px', color: '#52735d', textAlign: 'center' }}>
          Incident command credentials · Local session
        </div>
      </div>
    </div>
  );
}
