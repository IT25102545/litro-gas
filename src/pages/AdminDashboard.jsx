import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../App';
import {
  ArrowDown, ArrowUp, AlertTriangle, CheckCircle,
  Package, Truck, Shield, Clock, Activity,
  ArrowUpRight, X, Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const { bays, stats, discrepancyLog, completedJobs } = useContext(AppContext);
  const [selectedBay, setSelectedBay] = useState(null);
  const [logFilter, setLogFilter] = useState('all'); // all | mismatch | matched
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('adminAuth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const freshBay = selectedBay ? bays.find(b => b.id === selectedBay.id) : null;

  const filteredLog = discrepancyLog.filter(d => {
    if (logFilter === 'mismatch') return d.status === 'Mismatch';
    if (logFilter === 'matched') return d.status === 'Matched';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Free': return { bg: 'rgba(34,197,94,0.08)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' };
      case 'In Progress': return { bg: 'rgba(59,130,246,0.08)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' };
      case 'Complete': return { bg: 'rgba(168,85,247,0.08)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' };
      default: return { bg: 'rgba(100,116,139,0.08)', text: '#64748b', border: 'rgba(100,116,139,0.2)' };
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #183e7a, #3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', color: '#1a2f58', fontWeight: 600, margin: '0 0 8px' }}>Admin Login</h2>
          <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 32px' }}>Enter your credentials to access the control panel.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ color: '#4a5568', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="admin"
                style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ color: '#4a5568', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="admin123"
                style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
              />
            </div>
            {loginError && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 500 }}>{loginError}</div>}
            
            <button type="submit" className="btn btn-primary" style={{ padding: '16px', marginTop: '8px', fontSize: '15px', fontWeight: 600, width: '100%' }}>
              Login to Admin Panel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: '#1a2f58', fontWeight: 300, margin: '0 0 4px' }}>
            Admin <span style={{ fontWeight: 600 }}>Control Panel</span>
          </h1>
          <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>Real-time bay monitoring & discrepancy tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'Active Bays', value: stats.activeBays, icon: <Activity size={16} color="#3b82f6" />, color: '#3b82f6' },
            { label: 'Jobs Done', value: stats.totalCompleted, icon: <Truck size={16} color="#22c55e" />, color: '#22c55e' },
            { label: 'Loaded Cylinders', value: (stats.loadedCylinders || 0).toLocaleString(), icon: <ArrowDown size={16} color="#3b82f6" />, color: '#3b82f6' },
            { label: 'Unloaded Cylinders', value: (stats.unloadedCylinders || 0).toLocaleString(), icon: <ArrowUp size={16} color="#f97316" />, color: '#f97316' },
            { label: 'Total Cylinders', value: ((stats.loadedCylinders || 0) + (stats.unloadedCylinders || 0)).toLocaleString(), icon: <Package size={16} color="#a855f7" />, color: '#a855f7' },
            { label: 'Mismatches', value: stats.mismatches, icon: <AlertTriangle size={16} color={stats.mismatches > 0 ? '#ef4444' : '#94a3b8'} />, color: stats.mismatches > 0 ? '#ef4444' : '#94a3b8' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '32px', fontWeight: 300, color: '#1a2f58', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {s.icon} {s.value}
              </div>
              <div style={{ fontSize: '12px', color: '#718096', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bays Grid */}
      <h2 style={{ fontSize: '20px', color: '#1a2f58', marginBottom: '20px', fontWeight: 500 }}>All Loading / Unloading Bays</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        {bays.map((bay, index) => {
          const sc = getStatusColor(bay.status);
          const isLoad = bay.type === 'Load';
          const progress = bay.status !== 'Free' ? (
            isLoad
              ? ((bay.targetCount - bay.currentCount) / bay.targetCount) * 100
              : (bay.currentCount / bay.targetCount) * 100
          ) : 0;

          return (
            <div key={bay.id} className="card" onClick={() => setSelectedBay(bay)}
              style={{
                cursor: 'pointer',
                borderLeft: `5px solid ${isLoad ? '#3b82f6' : '#f97316'}`,
                display: 'flex', flexDirection: 'column', gap: '14px',
                transition: 'all 0.3s ease',
              }}>
              {/* Bay header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isLoad ? 'rgba(59,130,246,0.1)' : 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLoad ? <ArrowDown size={18} color="#3b82f6" /> : <ArrowUp size={18} color="#f97316" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Bay {bay.id}</h3>
                    <span style={{ fontSize: '11px', color: '#718096' }}>{bay.type} Operation</span>
                  </div>
                </div>
                <span style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                  {bay.status}
                </span>
              </div>

              {/* Content */}
              {bay.status === 'Free' ? (
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.08)' }}>
                  <span style={{ color: '#a0aec0', fontSize: '13px' }}>No supervisor assigned</span>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '14px', padding: '14px', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supervisor</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a2f58', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} color="#3b82f6" /> {bay.supervisorId}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lorry</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a2f58' }}>{bay.lorryPlate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#718096' }}>{isLoad ? 'Remaining' : 'Counted'}: {bay.currentCount}</span>
                    <span style={{ fontSize: '12px', color: '#1a2f58', fontWeight: 600 }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="glass-progress" style={{ height: '6px' }}>
                    <div className="glass-progress-fill" style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: bay.status === 'Complete' ? 'linear-gradient(90deg, #a855f7, #c084fc)' : (isLoad ? 'linear-gradient(90deg, #2563eb, #60a5fa)' : 'linear-gradient(90deg, #ea580c, #fb923c)')
                    }}></div>
                  </div>
                  {/* Queue indicator */}
                  {bay.queue && bay.queue.length > 0 && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Queue ({bay.queue.length})
                      </div>
                      {bay.queue.slice(0, 2).map((q, qi) => (
                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#718096', padding: '2px 0' }}>
                          <span>#{qi + 1} {q.lorryPlate}</span>
                          <span>{q.targetCount} cyl</span>
                        </div>
                      ))}
                      {bay.queue.length > 2 && <div style={{ fontSize: '11px', color: '#a0aec0' }}>+{bay.queue.length - 2} more</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discrepancy Log */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', color: '#1a2f58', fontWeight: 500, margin: 0 }}>Operations Log & Discrepancies</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'mismatch', label: '⚠ Mismatches' },
            { key: 'matched', label: '✓ Matched' },
          ].map(f => (
            <button key={f.key} onClick={() => setLogFilter(f.key)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: logFilter === f.key ? '#1a2f58' : 'rgba(0,0,0,0.04)',
                color: logFilter === f.key ? 'white' : '#64748b',
              }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredLog.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
              <thead style={{ background: '#f8f9fc' }}>
                <tr>
                  {['Date & Time', 'Bay', 'Supervisor', 'Lorry Plate', 'Expected', 'Actual', 'Diff', 'Errors', 'Note', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', color: '#718096', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((entry, idx) => {
                  const isMismatch = entry.status === 'Mismatch';
                  const hasErrors = entry.errors && entry.errors.length > 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5', background: isMismatch ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                        <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                        <div style={{ color: '#a0aec0' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#1a2f58' }}>Bay {entry.bayId}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4a5568' }}>{entry.supervisorId}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#1a2f58' }}>{entry.lorryPlate}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4a5568' }}>{(entry.expectedCount || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: isMismatch ? '#ef4444' : '#22c55e' }}>{(entry.actualCount || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: entry.difference === 0 ? '#22c55e' : '#ef4444' }}>
                        {entry.difference > 0 ? '+' : ''}{entry.difference}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: '180px' }}>
                        {hasErrors ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {entry.errors.map((e, ei) => (
                              <span key={ei} style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.06)', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>⚠ {e.message.split(' —')[0]}</span>
                            ))}
                          </div>
                        ) : <span style={{ fontSize: '11px', color: '#a0aec0' }}>None</span>}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                        {entry.note ? (
                          <span style={{ fontSize: '12px', color: '#4a5568', fontStyle: 'italic' }}>"{entry.note}"</span>
                        ) : entry.noteRequired ? (
                          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>Pending...</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#a0aec0' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: isMismatch ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: isMismatch ? '#ef4444' : '#22c55e', border: `1px solid ${isMismatch ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}` }}>
                          {isMismatch ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: '#a0aec0' }}>
            <Package size={32} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>No {logFilter === 'all' ? 'operations' : logFilter === 'mismatch' ? 'mismatches' : 'matched jobs'} recorded yet.</p>
          </div>
        )}
      </div>

      {/* Bay Detail Modal */}
      {freshBay && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedBay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <button className="close-btn" onClick={() => setSelectedBay(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: freshBay.type === 'Load' ? 'rgba(59,130,246,0.1)' : 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {freshBay.type === 'Load' ? <ArrowDown size={22} color="#3b82f6" /> : <ArrowUp size={22} color="#f97316" />}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px' }}>Bay {freshBay.id}</h2>
                <span style={{ color: '#718096', fontSize: '13px' }}>{freshBay.type} Operation</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <span style={{ ...(() => { const c = getStatusColor(freshBay.status); return { background: c.bg, color: c.text, border: `1px solid ${c.border}` }; })(), padding: '5px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                {freshBay.status}
              </span>
            </div>

            {freshBay.status !== 'Free' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8f9fc', padding: '20px', borderRadius: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>Supervisor</div>
                    <div style={{ fontWeight: 600, color: '#1a2f58', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} color="#3b82f6" /> {freshBay.supervisorId}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>Lorry Plate</div>
                    <div style={{ fontWeight: 600, color: '#1a2f58' }}>{freshBay.lorryPlate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>Target Count</div>
                    <div style={{ fontWeight: 600, color: '#1a2f58' }}>{freshBay.targetCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', marginBottom: '4px' }}>Current Count</div>
                    <div style={{ fontWeight: 600, color: '#1a2f58' }}>{freshBay.currentCount}</div>
                  </div>
                </div>

                {freshBay.status === 'In Progress' && (
                  <div style={{ background: '#f8f9fc', padding: '20px', borderRadius: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: 300, color: '#1a2f58', fontVariantNumeric: 'tabular-nums' }}>
                      {freshBay.currentCount}
                      <span style={{ fontSize: '18px', color: '#a0aec0', fontWeight: 500 }}> / {freshBay.targetCount}</span>
                    </div>
                    <div className="glass-progress" style={{ marginTop: '16px' }}>
                      <div className="glass-progress-fill" style={{
                        width: `${freshBay.type === 'Load'
                          ? ((freshBay.targetCount - freshBay.currentCount) / freshBay.targetCount) * 100
                          : (freshBay.currentCount / freshBay.targetCount) * 100}%`
                      }}></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', background: '#f0f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Shield size={24} color="#a0aec0" />
                </div>
                <p style={{ color: '#718096', fontSize: '14px' }}>No supervisor assigned. Waiting for a supervisor to start a job on this bay.</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
