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

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('stateUpdate', (data) => {
      if (data.bays) setBays(data.bays);
      if (data.stats) setStats(data.stats);
      if (data.discrepancyLog) setDiscrepancyLog(data.discrepancyLog);
      if (data.completedJobs) setCompletedJobs(data.completedJobs);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stateUpdate');
    };
  }, []);

  return (
    <AppContext.Provider value={{ bays, stats, discrepancyLog, completedJobs, connected }}>
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
