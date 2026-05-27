import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smartphone, ScanLine, Bell, User } from 'lucide-react';

export default function TopNav({ connected }) {
  const location = useLocation();

  return (
    <header className="top-nav" style={{ padding: '20px 40px', background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.7)', marginBottom: '40px' }}>
      <div className="logo-container">
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Litro Gas" style={{ height: '48px' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </h2>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? "active-link" : ""}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/mobile-connect" className={location.pathname === '/mobile-connect' ? "active-link" : ""}>
            <Smartphone size={16} /> Connect Scanner
          </Link>
        </li>
        <li>
          <Link to="/scanner" className={location.pathname === '/scanner' ? "active-link" : ""}>
            <ScanLine size={16} /> Web Scanner
          </Link>
        </li>
      </ul>

      <div className="user-profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#4caf50' : '#f44336' }}></div>
          <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
            {connected ? 'Server Active' : 'Offline'}
          </span>
        </div>
        <button className="icon-btn"><Bell size={18} color="#555" /></button>
        <button className="icon-btn"><User size={18} color="#555" /></button>
      </div>
    </header>
  );
}
