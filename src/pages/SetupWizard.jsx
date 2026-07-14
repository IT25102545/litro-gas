import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, MapPin, Terminal as TerminalIcon, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { socket } from '../App';

export default function SetupWizard() {
  const [localIp, setLocalIp] = useState('Detecting...');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [comPort, setComPort] = useState('COM3');
  
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashLogs, setFlashLogs] = useState([]);
  const [flashSuccess, setFlashSuccess] = useState(null);

  useEffect(() => {
    fetch('/api/setup/info')
      .then(res => res.json())
      .then(data => setLocalIp(data.localIp))
      .catch(err => console.error(err));

    socket.on('flash_log', (log) => {
      setFlashLogs(prev => [...prev, log]);
    });

    socket.on('flash_done', ({ success }) => {
      setIsFlashing(false);
      setFlashSuccess(success);
    });

    return () => {
      socket.off('flash_log');
      socket.off('flash_done');
    };
  }, []);

  const handleFlash = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure the ESP32 is plugged into ${comPort}?`)) return;
    
    setIsFlashing(true);
    setFlashLogs([]);
    setFlashSuccess(null);

    try {
      const res = await fetch('/api/setup/flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password, comPort })
      });
      const data = await res.json();
      if (data.error) {
        setFlashLogs([`[ERROR] ${data.error}`]);
        setIsFlashing(false);
        setFlashSuccess(false);
      }
    } catch (e) {
      setFlashLogs([`[ERROR] Failed to communicate with server: ${e.message}`]);
      setIsFlashing(false);
      setFlashSuccess(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Left Column: Form */}
        <div style={{ padding: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', color: '#0f172a', margin: '0 0 4px', fontWeight: 800 }}>Board Setup</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Provision and flash ESP32 directly</p>
            </div>
          </div>

          <form onSubmit={handleFlash} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Auto-detected IP */}
            <div style={{ background: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <MapPin size={24} color="#3b82f6" />
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Local Server IP (Auto-Detected)</div>
                <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>{localIp}</div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wifi size={16} /> Warehouse WiFi SSID
              </label>
              <input value={ssid} onChange={e => setSsid(e.target.value)} required placeholder="LITRO_WAREHOUSE_WIFI" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '8px' }}>WiFi Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="••••••••" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '8px' }}>USB COM Port</label>
              <input value={comPort} onChange={e => setComPort(e.target.value)} required placeholder="COM3" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={isFlashing} style={{ marginTop: '16px', padding: '18px', background: isFlashing ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: isFlashing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background 0.2s' }}>
              {isFlashing ? <RefreshCw size={20} className="spin" /> : <Play size={20} />}
              {isFlashing ? 'Flashing Board...' : 'Configure & Flash Board'}
            </button>
            <p style={{ margin: '0', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Make sure ESP-IDF is installed on this PC</p>
          </form>
        </div>

        {/* Right Column: Terminal Output */}
        <div style={{ background: '#0f172a', padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'white' }}>
            <TerminalIcon size={20} color="#3b82f6" />
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '1px' }}>Flashing Terminal</span>
          </div>

          <div style={{ flex: 1, background: '#020617', borderRadius: '12px', padding: '16px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc', lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
            {flashLogs.length === 0 ? (
              <span style={{ color: '#475569' }}>Awaiting flash command...</span>
            ) : (
              flashLogs.map((log, i) => <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{log}</span>)
            )}
          </div>

          {flashSuccess !== null && (
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: flashSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${flashSuccess ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {flashSuccess ? <CheckCircle size={24} color="#22c55e" /> : <AlertCircle size={24} color="#ef4444" />}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: flashSuccess ? '#22c55e' : '#ef4444' }}>
                  {flashSuccess ? 'Success!' : 'Flashing Failed'}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  {flashSuccess ? 'Board is configured and ready.' : 'Check the COM port and USB connection.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
