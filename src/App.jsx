import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminDashboard from './pages/AdminDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import DigitalDisplay from './pages/DigitalDisplay';
import SuperAdmin from './pages/SuperAdmin';
import TopNav from './components/TopNav';
import './App.css';

const SERVER_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:3001`
  : window.location.origin;
export const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
export const AppContext = React.createContext();

function App() {
  const [bays, setBays] = useState([]);
  const [stats, setStats] = useState({
    activeBays: 0,
    totalCompleted: 0,
    totalCylinders: 0,
    mismatches: 0,
  });
  const [discrepancyLog, setDiscrepancyLog] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [license, setLicense] = useState({ active: true, type: 'trial' });

  useEffect(() => {
    fetch('/api/license/status').then(res => res.json()).then(data => setLicense(data)).catch(() => {});
    
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('stateUpdate', (data) => {
      if (data.bays) setBays(data.bays);
      if (data.stats) setStats(data.stats);
      if (data.discrepancyLog) setDiscrepancyLog(data.discrepancyLog);
      if (data.completedJobs) setCompletedJobs(data.completedJobs);
    });

    socket.on('licenseUpdated', (data) => setLicense(data));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stateUpdate');
      socket.off('licenseUpdated');
    };
  }, []);

  const isExpired = !license.active && window.location.pathname !== '/superadmin';

  return (
    <AppContext.Provider value={{ bays, stats, discrepancyLog, completedJobs, connected }}>
      {isExpired && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'system-ui' }}>
          <div style={{ background: 'white', color: '#0f172a', padding: '60px', borderRadius: '24px', textAlign: 'center', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ fontSize: '40px' }}>🔒</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 16px', color: '#ef4444' }}>SYSTEM LOCKED</h1>
            <p style={{ fontSize: '18px', color: '#475569', marginBottom: '32px', lineHeight: 1.5 }}>
              The software license verification has failed or the license has expired. The system has been securely locked.
            </p>
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: '#334155', fontWeight: 600 }}>Please contact your system integrator to purchase a lifetime license and resume operations.</p>
            </div>
            <a href="/superadmin" style={{ display: 'inline-block', padding: '16px 32px', background: '#0f172a', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700 }}>Integrator Login</a>
          </div>
        </div>
      )}
      <Router>
        <Routes>
          {/* Supervisor view — standalone mobile-first page */}
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route path="/supervisor/:bayId" element={<SupervisorDashboard />} />

          {/* Digital Display windows */}
          <Route path="/display/load" element={<DigitalDisplay type="Load" />} />
          <Route path="/display/unload" element={<DigitalDisplay type="Unload" />} />
          
          {/* Super Admin — standalone dark mode page */}
          <Route path="/superadmin" element={<SuperAdmin />} />

          {/* Admin view — with TopNav wrapper */}
          <Route path="*" element={
            <div className="app-wrapper">
              <div className="app-layout fade-in">
                <TopNav connected={connected} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                  </Routes>
                </main>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
