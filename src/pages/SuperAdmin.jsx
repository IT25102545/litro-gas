import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Server, Activity, Database, GitBranch, Terminal, Key } from 'lucide-react';

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('superAuth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [updateStatus, setUpdateStatus] = useState('');
  const [health, setHealth] = useState(null);
  const [license, setLicense] = useState(null);

  const fetchLicense = () => {
    fetch('/api/superadmin/license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth: 'litro2024super' })
    })
    .then(res => res.json())
    .then(data => setLicense(data))
    .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/health')
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(err => console.error(err));
      
      fetchLicense();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'super' && password === 'litro2024super') {
      sessionStorage.setItem('superAuth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid super admin credentials');
    }
  };

  const handleUpdateSystem = async () => {
    if (!window.confirm("WARNING: This will pull the latest code from GitHub, build the React app, and restart the server. Connected boards and dashboards may briefly disconnect. Proceed?")) return;
    setUpdateStatus('updating');
    try {
      const res = await fetch('/api/admin/system-update', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert('Update trigger failed.');
      setUpdateStatus('');
    }
  };

  const handleUpdateLicense = async (action) => {
    if (!window.confirm(`Are you sure you want to apply: ${action}?`)) return;
    try {
      const res = await fetch('/api/superadmin/license/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth: 'litro2024super', action })
      });
      const data = await res.json();
      if (data.success) {
        setLicense(data.status);
        alert('License updated successfully.');
      }
    } catch (e) {
      alert('License update failed.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center', background: '#1e293b', border: '1px solid #334155' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Terminal size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', color: '#f8fafc', fontWeight: 600, margin: '0 0 8px' }}>System Integrator</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 32px' }}>Super Admin access restricted.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="super"
                style={{ width: '100%', padding: '14px 18px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '15px', outline: 'none', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Master Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '14px 18px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '15px', outline: 'none', color: 'white' }}
              />
            </div>
            {loginError && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 500 }}>{loginError}</div>}
            
            <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', marginTop: '8px', fontSize: '15px', fontWeight: 600, width: '100%', cursor: 'pointer' }}>
              Authenticate
            </button>
          </div>
        </form>
      </div>
    );
  }

  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Terminal size={32} color="#ef4444" /> System Control Center
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Root level access for system integrator.</p>
          </div>
          <button onClick={() => { sessionStorage.removeItem('superAuth'); setIsAuthenticated(false); }}
            style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
            <Server size={24} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Server Status</div>
            <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
              Online
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
            <Activity size={24} color="#22c55e" style={{ marginBottom: '16px' }} />
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>PM2 Uptime</div>
            <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>{formatUptime(health?.uptime)}</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
            <Database size={24} color="#a855f7" style={{ marginBottom: '16px' }} />
            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Database Engine</div>
            <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '4px' }}>SQLite WAL</div>
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={20} /> Deploy Latest Code
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            This will pull the latest commits from the <code>main</code> branch of the GitHub repository. 
            It automatically runs <code>npm install</code>, builds the React frontend via Vite, and gracefully restarts the PM2 Node.js process.
          </p>
          
          <button onClick={handleUpdateSystem} disabled={updateStatus === 'updating'}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%',
              padding: '16px', background: updateStatus === 'updating' ? '#334155' : '#2563eb', 
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 600, 
              cursor: updateStatus === 'updating' ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}>
            <RefreshCw size={20} className={updateStatus === 'updating' ? 'spin' : ''} />
            {updateStatus === 'updating' ? 'Executing Deployment Pipeline...' : 'Fetch & Deploy from GitHub'}
          </button>
        </div>

        {license && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px', marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} color="#eab308" /> License & Subscription Management
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: license.active ? '#22c55e' : '#ef4444', marginTop: '4px' }}>
                  {license.message}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>License Type</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginTop: '4px', textTransform: 'capitalize' }}>
                  {license.type} {license.type === 'trial' && `(Expires: ${new Date(license.expiry).toLocaleDateString()})`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => handleUpdateLicense('extend_trial')} style={{ flex: 1, padding: '16px', background: '#334155', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#475569'} onMouseLeave={e => e.currentTarget.style.background = '#334155'}>
                Extend Trial (14 Days)
              </button>
              <button onClick={() => handleUpdateLicense('lifetime')} style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #eab308, #ca8a04)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                Activate Lifetime License
              </button>
            </div>
          </div>
        )}

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
