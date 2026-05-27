import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import QRGenerator from './pages/QRGenerator';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import DesktopScanner from './pages/DesktopScanner';
import MobileConnect from './pages/MobileConnect';
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
    activeBaysCount: 0,
    totalLorriesHandled: 0,
    totalCylindersProcessed: 0,
    efficiency: 0,
    avgWait: 0,
    pastLorries: []
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    socket.on('stateUpdate', (newState) => {
      if (newState.bays) setBays(newState.bays);
      if (newState.stats) setStats(newState.stats);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stateUpdate');
    };
  }, []);

  const assignLorry = (lorryData) => {
    socket.emit('scanQR', lorryData);
  };

  const updateBayStatus = (bayId, status) => {
    if (status === 'In Progress') {
      socket.emit('startOperation', bayId);
    }
  };

  const clearBay = (bayId) => {
    socket.emit('clearBay', bayId);
  };

  return (
    <AppContext.Provider value={{ bays, stats, assignLorry, updateBayStatus, clearBay }}>
      <Router>
        <Routes>
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/mobile-scanner" element={<Scanner />} />
          <Route path="*" element={
            <div className="app-wrapper">
              <div className="app-layout fade-in">
                <TopNav connected={connected} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard connected={connected} />} />
                    <Route path="/scanner" element={<DesktopScanner />} />
                    <Route path="/mobile-connect" element={<MobileConnect />} />
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
