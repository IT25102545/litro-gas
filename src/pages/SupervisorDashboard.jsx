import React, { useState, useContext } from 'react';
import { AppContext, socket } from '../App';
import { Play, ArrowDown, ArrowUp, Shield, CheckCircle, AlertTriangle, RotateCcw, Plus, Trash2, Clock, Activity } from 'lucide-react';

const BAY_MAP = { Load: 1, Unload: 5 };

const Header = ({ title, subtitle, supervisorId, onLogout, badge }) => (
  <header style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img src="/logo.png" alt="Litro Gas" style={{ height: '36px' }} onError={e => { e.target.style.display = 'none'; }} />
      <div>
        <div style={{ fontSize: '14px', color: '#1a2f58', fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: '#718096' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {badge}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.08)', padding: '5px 11px', borderRadius: '20px' }}>
        <Shield size={13} color="#3b82f6" />
        <span style={{ fontSize: '12px', color: '#1a2f58', fontWeight: 600 }}>{supervisorId}</span>
      </div>
      {onLogout && <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Logout</button>}
    </div>
  </header>
);

const AddLorryForm = ({ supervisorId, bayId, onSubmit, isQueuing }) => {
  const [plate, setPlate] = useState('');
  const [count, setCount] = useState('');
  const submit = e => {
    e.preventDefault();
    if (!plate || !count) return;
    onSubmit(plate, count);
    setPlate(''); setCount('');
  };
  return (
    <form onSubmit={submit} style={{ background: isQueuing ? 'rgba(249,115,22,0.04)' : 'rgba(59,130,246,0.04)', border: `1px solid ${isQueuing ? 'rgba(249,115,22,0.2)' : 'rgba(59,130,246,0.15)'}`, borderRadius: '16px', padding: '20px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: isQueuing ? '#f97316' : '#3b82f6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> {isQueuing ? 'Add Next Lorry to Queue' : 'Start Unloading Job'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#718096', fontWeight: 500, display: 'block', marginBottom: '5px' }}>Lorry Plate</label>
          <input value={plate} onChange={e => setPlate(e.target.value)} required placeholder="WP LA-1234"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '13px', background: 'white', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#718096', fontWeight: 500, display: 'block', marginBottom: '5px' }}>Expected Count</label>
          <input value={count} onChange={e => setCount(e.target.value)} required type="number" min="1" placeholder="1000"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '13px', background: 'white', boxSizing: 'border-box' }} />
        </div>
      </div>
      <button type="submit" style={{ width: '100%', padding: '11px', background: isQueuing ? 'linear-gradient(135deg,#ea580c,#f97316)' : 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Play size={14} /> {isQueuing ? 'Add to Queue' : 'Begin Unloading'}
      </button>
    </form>
  );
};

export default function SupervisorDashboard() {
  const { bays } = useContext(AppContext);
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('supAuth') === 'true');
  const [supervisorId, setSupervisorId] = useState(sessionStorage.getItem('supId') || '');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [opType, setOpType] = useState(null);
  const [lorryPlate, setLorryPlate] = useState('');
  const [targetCount, setTargetCount] = useState('');
  const [jobStarted, setJobStarted] = useState(false);
  const [noteText, setNoteText] = useState('');

  const bayId = opType ? BAY_MAP[opType] : null;
  const bay = bayId ? bays.find(b => b.id === bayId) : null;
  const isLoad = opType === 'Load';

  const handleLogin = e => {
    e.preventDefault();
    if (loginId.trim() !== '' && password === 'sup123') {
      sessionStorage.setItem('supAuth', 'true');
      sessionStorage.setItem('supId', loginId.trim());
      setIsAuthenticated(true); setSupervisorId(loginId.trim()); setLoginError('');
    } else { setLoginError('Invalid credentials (password: sup123)'); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('supAuth'); sessionStorage.removeItem('supId');
    setIsAuthenticated(false); setSupervisorId(''); setOpType(null);
  };

  const handleAddToQueue = (plate, count) => {
    socket.emit('addToQueue', { bayId, supervisorId, lorryPlate: plate, targetCount: parseInt(count) });
    if (!jobStarted) setJobStarted(true);
  };

  const handleStartLoadJob = e => {
    e.preventDefault();
    if (!supervisorId || !lorryPlate || !targetCount) return;
    socket.emit('startJob', { bayId, supervisorId, lorryPlate: lorryPlate.trim().toUpperCase(), targetCount: parseInt(targetCount) });
    setJobStarted(true);
  };

  const handleClearBay = () => {
    socket.emit('clearBay', bayId);
    setJobStarted(false); setLorryPlate(''); setTargetCount(''); setOpType(null);
  };

  const handleRemoveQueued = (jobId) => socket.emit('removeFromQueue', { bayId, jobId });

  const handleSubmitNote = (e) => {
    e.preventDefault();
    const lj = bay?.lastCompletedJob;
    if (lj?.noteRequired && !noteText.trim()) return;
    socket.emit('submitNote', { bayId, note: noteText.trim() });
    setNoteText('');
  };

  // ── LOGIN ────────────────────────────────────────────────────
  if (!isAuthenticated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f0f4ff,#e8f0fe)' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', borderRadius: '24px', padding: '40px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Shield size={26} color="white" />
        </div>
        <h2 style={{ color: '#1a2f58', margin: '0 0 6px', fontSize: '22px' }}>Supervisor Login</h2>
        <p style={{ color: '#718096', fontSize: '13px', margin: '0 0 28px' }}>Enter credentials to access bay operations</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input value={loginId} onChange={e => setLoginId(e.target.value)} required placeholder="Supervisor ID (e.g. SUP-001)"
            style={{ padding: '13px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', fontSize: '14px' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password"
            style={{ padding: '13px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', fontSize: '14px' }} />
          {loginError && <div style={{ color: '#ef4444', fontSize: '12px' }}>{loginError}</div>}
          <button type="submit" style={{ padding: '14px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            Login
          </button>
        </div>
      </form>
    </div>
  );

  // ── OP TYPE SELECTION ────────────────────────────────────────
  if (!opType) return (
    <div className="app-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="app-layout fade-in" style={{ width: '100%', maxWidth: '800px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Header title="Supervisor Panel" supervisorId={supervisorId} onLogout={handleLogout} />
        
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(58,123,213,0.2)' }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', color: '#1a2f58', margin: '0 0 8px', fontWeight: 700, letterSpacing: '-0.5px' }}>Operation Control</h1>
          <p style={{ color: '#718096', fontSize: '15px', margin: '0 0 48px' }}>Select the bay you are assigned to supervise</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              { type: 'Load', icon: <ArrowDown size={32} color="#3b82f6" />, bg: 'white', border: 'rgba(59,130,246,0.3)', hoverBg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', hoverBorder: '#3b82f6', desc: 'Bay 1 · Fill cylinders', shadow: 'rgba(59,130,246,0.15)' },
              { type: 'Unload', icon: <ArrowUp size={32} color="#f97316" />, bg: 'white', border: 'rgba(249,115,22,0.3)', hoverBg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', hoverBorder: '#f97316', desc: 'Bay 5 · Return empties', shadow: 'rgba(249,115,22,0.15)' },
            ].map(op => (
              <button key={op.type} onClick={() => setOpType(op.type)}
                style={{ padding: '40px 24px', border: `2px solid ${op.border}`, borderRadius: '24px', background: op.bg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', boxShadow: `0 10px 30px ${op.shadow}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${op.shadow}`; e.currentTarget.style.background = op.hoverBg; e.currentTarget.style.borderColor = op.hoverBorder; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 10px 30px ${op.shadow}`; e.currentTarget.style.background = op.bg; e.currentTarget.style.borderColor = op.border; }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 4px 16px ${op.shadow}`, border: `1px solid ${op.border}` }}>{op.icon}</div>
                <div style={{ fontSize: '22px', color: '#1a2f58', fontWeight: 800, marginBottom: '6px' }}>{op.type}</div>
                <div style={{ fontSize: '14px', color: '#718096', fontWeight: 600 }}>{op.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── LOADING VIEW (unchanged logic) ───────────────────────────
  if (isLoad) {
    const progress = bay && bay.targetCount > 0 ? ((bay.targetCount - bay.currentCount) / bay.targetCount) * 100 : 0;
    if (bay && bay.status === 'Complete') return (
      <div className="app-wrapper"><div className="app-layout fade-in" style={{ maxWidth: '580px' }}>
        <Header title={`Bay ${bayId} — Loading`} supervisorId={supervisorId} onLogout={handleLogout} />
        <div style={{ padding: '48px 32px', textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '16px' }} />
          <h2 style={{ color: '#1a2f58' }}>Load Complete</h2>
          <button onClick={handleClearBay} style={{ marginTop: '24px', padding: '12px 32px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            <RotateCcw size={15} style={{ marginRight: '8px' }} />Release Bay
          </button>
        </div>
      </div></div>
    );
    if (bay && bay.status === 'In Progress' && jobStarted) return (
      <div className="app-wrapper"><div className="app-layout fade-in" style={{ maxWidth: '580px' }}>
        <Header title={`Bay ${bayId} — Loading`} subtitle={bay.lorryPlate} supervisorId={supervisorId}
          badge={<span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, background: 'rgba(59,130,246,0.08)', padding: '4px 10px', borderRadius: '12px' }}>● LIVE</span>} />
        <div style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '72px', fontWeight: 200, color: '#1a2f58', lineHeight: 1 }}>{bay.currentCount}</div>
          <div style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0 24px' }}>of {bay.targetCount} remaining</div>
          <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg,#183e7a,#3a7bd5)', transition: 'width 0.8s ease', borderRadius: '4px' }} />
          </div>
          <div style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>{Math.round(progress)}% loaded</div>
        </div>
      </div></div>
    );
    return (
      <div className="app-wrapper"><div className="app-layout fade-in" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Header title="Start Loading Job" subtitle={`Bay ${bayId}`} supervisorId={supervisorId}
          badge={<button onClick={() => setOpType(null)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: '#718096' }}>← Back</button>} />
        <div style={{ padding: '32px' }}>
          {bay && bay.status !== 'Free' ? (
            <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(245,158,11,0.06)', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={32} color="#f59e0b" /><h3 style={{ color: '#1a2f58', margin: '12px 0 8px' }}>Bay Busy</h3>
              <p style={{ color: '#718096', fontSize: '13px' }}>Bay {bayId} is currently in use.</p>
            </div>
          ) : (
            <form onSubmit={handleStartLoadJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '6px' }}>Lorry Plate</label>
                <input value={lorryPlate} onChange={e => setLorryPlate(e.target.value)} required placeholder="WP LA-1234"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '6px' }}>Total Cylinders</label>
                <input value={targetCount} onChange={e => setTargetCount(e.target.value)} required type="number" min="1" placeholder="1000"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
              <button type="submit" style={{ padding: '13px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Play size={16} /> Begin Loading
              </button>
            </form>
          )}
        </div>
      </div></div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── UNLOADING — Queue Management View ────────────────────────
  // ══════════════════════════════════════════════════════════════
  const isActive = bay && bay.status === 'In Progress';
  const isComplete = bay && bay.status === 'Complete' && (bay.queue || []).length === 0;
  const progress = isActive && bay.targetCount > 0 ? (bay.currentCount / bay.targetCount) * 100 : 0;
  const queue = (bay && bay.queue) || [];
  const sessionErrors = (bay && bay.sessionErrors) || [];
  const lastJob = bay && bay.lastCompletedJob;
  const noteNeeded = lastJob && !lastJob.noteSubmitted;

  return (
    <div className="app-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div className="app-layout fade-in" style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Header
          title="Bay 5 — Unloading"
          subtitle={isActive ? `Active: ${bay.lorryPlate}` : isComplete ? 'Job Complete' : 'Ready'}
          supervisorId={supervisorId}
          onLogout={handleLogout}
          badge={
            isActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(249,115,22,0.08)', padding: '4px 10px', borderRadius: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', animation: 'blink 1s infinite' }} />
                <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 700 }}>LIVE</span>
              </div>
            ) : null
          }
        />

        <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Active Job Counter */}
            {isActive && (
              <div style={{ background: 'white', border: '2px solid rgba(249,115,22,0.15)', borderRadius: '28px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(249,115,22,0.08)' }}>
                <div style={{ fontSize: '13px', color: '#f97316', fontWeight: 800, letterSpacing: '2.5px', marginBottom: '24px', textTransform: 'uppercase' }}>Cylinders Unloaded</div>
                <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 24px' }}>
                  <svg viewBox="0 0 220 220" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="12" />
                    <circle cx="110" cy="110" r="100" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 100}
                      strokeDashoffset={2 * Math.PI * 100 * (1 - Math.min(progress, 100) / 100)}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '64px', fontWeight: 300, color: '#1a2f58', lineHeight: 1 }}>{bay.currentCount}</div>
                    <div style={{ fontSize: '15px', color: '#a0aec0', marginTop: '4px' }}>of {bay.targetCount}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.5px' }}>LORRY</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>{bay.lorryPlate}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.5px' }}>SUPERVISOR</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>{bay.supervisorId}</div>
                  </div>
                </div>
                <div style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '16px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid rgba(249,115,22,0.2)', boxShadow: '0 4px 12px rgba(249,115,22,0.1)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316', animation: 'blink 1s infinite' }} />
                  <span style={{ fontSize: '14px', color: '#f97316', fontWeight: 600 }}>SENSOR ACTIVE — Counting automatically</span>
                </div>
              </div>
            )}

            {/* Queue List */}
            {queue.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#f97316" /> WAITING QUEUE ({queue.length} lorr{queue.length === 1 ? 'y' : 'ies'})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {queue.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#f97316' }}>{idx + 1}</div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a2f58' }}>{item.lorryPlate}</div>
                          <div style={{ fontSize: '13px', color: '#718096' }}>{item.targetCount} cylinders · {item.supervisorId}</div>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveQueued(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e0'; e.currentTarget.style.background = 'none'; }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Add to Queue Form */}
            {(bay?.status === 'Free' || bay?.status === 'In Progress') && (
              <div style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderRadius: '16px' }}>
                <AddLorryForm supervisorId={supervisorId} bayId={bayId} onSubmit={handleAddToQueue} isQueuing={isActive} />
              </div>
            )}

            {/* Pending Note Banner */}
            {isActive && noteNeeded && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> NOTE REQUIRED for previous lorry: {lastJob.lorryPlate}
                </div>
                {lastJob.difference !== 0 && (
                  <div style={{ fontSize: '13px', color: '#718096', marginBottom: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '10px 14px' }}>
                    Expected: <b>{lastJob.expectedCount}</b> · Counted: <b style={{ color: '#ef4444' }}>{lastJob.actualCount}</b> · Diff: <b style={{ color: '#ef4444' }}>{lastJob.difference > 0 ? '+' : ''}{lastJob.difference}</b>
                  </div>
                )}
                <form onSubmit={handleSubmitNote} style={{ display: 'flex', gap: '10px' }}>
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} required={lastJob.noteRequired}
                    placeholder={lastJob.noteRequired ? 'Explain discrepancy...' : 'Add note (optional)...'}
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', fontSize: '14px', background: 'white' }} />
                  <button type="submit" style={{ padding: '12px 24px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                </form>
              </div>
            )}

            {/* Active Session Errors */}
            {sessionErrors.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> ACTIVE ERRORS ({sessionErrors.length})
                </div>
                {sessionErrors.map((err, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#718096', padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠</span> {err.message} <span style={{ color: '#a0aec0', marginLeft: '8px' }}>{new Date(err.time).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Complete (queue empty) */}
            {isComplete && (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '24px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <CheckCircle size={56} color="#22c55e" style={{ marginBottom: '12px' }} />
                  <h3 style={{ color: '#1a2f58', margin: '0 0 6px', fontSize: '24px' }}>Unloading Complete</h3>
                  <p style={{ color: '#718096', fontSize: '15px', margin: 0 }}>Bay 5 — {lastJob?.lorryPlate || bay.lorryPlate}</p>
                </div>

                {lastJob && lastJob.difference !== 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={15} /> Cylinder Count Mismatch
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      {[['Expected', lastJob.expectedCount, '#1a2f58'], ['Counted', lastJob.actualCount, '#ef4444'], ['Difference', (lastJob.difference > 0 ? '+' : '') + lastJob.difference, '#ef4444']].map(([label, val, col]) => (
                        <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 600 }}>{label.toUpperCase()}</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: col }}>{val.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lastJob?.errors?.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.04)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>Errors During Session</div>
                    {lastJob.errors.map((e, i) => <div key={i} style={{ fontSize: '14px', color: '#718096', padding: '3px 0' }}>⚠ {e.message}</div>)}
                  </div>
                )}

                {noteNeeded ? (
                  <form onSubmit={handleSubmitNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#1a2f58' }}>
                      {lastJob?.noteRequired ? '⚠ Note Required' : 'Supervisor Note (optional)'}
                    </label>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                      required={lastJob?.noteRequired}
                      placeholder={lastJob?.noteRequired ? 'Explain the discrepancy or issue...' : 'Add any observations (optional)...'}
                      style={{ padding: '14px 16px', border: `1px solid ${lastJob?.noteRequired ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '12px', fontSize: '14px', resize: 'none', fontFamily: 'inherit' }} />
                    <button type="submit" style={{ padding: '14px', background: 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>Submit Note</button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: '14px', color: '#22c55e', fontWeight: 600 }}>✓ Note submitted</div>
                )}

                <button onClick={handleClearBay} disabled={noteNeeded && lastJob?.noteRequired}
                  style={{ width: '100%', padding: '16px', background: noteNeeded && lastJob?.noteRequired ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg,#183e7a,#3a7bd5)', border: 'none', borderRadius: '14px', color: noteNeeded && lastJob?.noteRequired ? '#a0aec0' : 'white', fontWeight: 600, cursor: noteNeeded && lastJob?.noteRequired ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
                  <RotateCcw size={16} /> Release Bay & Start New
                </button>
              </div>
            )}

            <button onClick={() => setOpType(null)} style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px', color: '#64748b', cursor: 'pointer', fontSize: '15px', width: '100%', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
              ← Change Operation Type
            </button>
          </div>
        </div>

        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    </div>
  );
}
