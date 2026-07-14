import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, Shield } from 'lucide-react';

export default function TopNav({ connected }) {
  const location = useLocation();

  return (
    <header className="top-nav" style={{ padding: '20px 40px', background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.7)', marginBottom: '0' }}>
      <div className="logo-container">
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Litro Gas" style={{ height: '48px' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={{ fontSize: '14px', color: '#718096', fontWeight: 400, letterSpacing: '0.5px' }}>Bay Management</span>
        </h2>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? "active-link" : ""}>
            <LayoutDashboard size={16} /> Admin Panel
          </Link>
        </li>
      </ul>

      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#4caf50' : '#f44336' }}></div>
          <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div style={{ height: '24px', width: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
          <Shield size={14} color="#3b82f6" />
          <span style={{ fontSize: '13px', color: '#1a2f58', fontWeight: 600 }}>System Admin</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem('adminAuth'); window.location.reload(); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
          Logout
        </button>
      </div>
    </header>
  );
}
