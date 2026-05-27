import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../App';
import { Play, CheckCircle, RefreshCcw, LogOut, Clock, ArrowUpRight, ListChecks, ScanLine, Smartphone, LayoutDashboard, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ connected }) {
  const { bays, stats, updateBayStatus, clearBay } = useContext(AppContext);
  const [selectedBay, setSelectedBay] = useState(null);

  const handleBayClick = (bay) => {
    setSelectedBay(bay);
  };

  const closeModal = () => {
    setSelectedBay(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Free': return <span className="badge badge-free">Free</span>;
      case 'Occupied': return <span className="badge badge-occupied">Occupied</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Complete': return <span className="badge badge-complete">Complete</span>;
      default: return null;
    }
  };

  const freshSelectedBay = selectedBay ? bays.find(b => b.id === selectedBay.id) : null;
  const activeBaysCount = bays.filter(b => b.status !== 'Free').length;

  const allQueuedLorries = bays
    .flatMap(bay => (bay.queue || []).map(lorry => ({ ...lorry, assignedBayId: bay.id })))
    .sort((a, b) => a.queuedAt - b.queuedAt);

  return (
    <div className="fade-in">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', color: '#1a2f58', fontWeight: 300 }}>Welcome in, <span style={{ fontWeight: 600 }}>Manager</span></h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <span style={{ background: '#183e7a', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Load Bays: 4</span>
            <span style={{ background: '#3a7bd5', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Unload Bays: 4</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', fontWeight: 300, color: '#1a2f58', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={20} color="#a0aec0" /> {stats?.activeBaysCount || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#718096', fontWeight: 500 }}>Active Bays</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', fontWeight: 300, color: '#1a2f58', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCcw size={20} color="#a0aec0" /> {(stats?.totalCylindersProcessed || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#718096', fontWeight: 500 }}>Cylinders Processed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', fontWeight: 300, color: '#1a2f58', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpRight size={20} color="#a0aec0" /> {stats?.totalLorriesHandled || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#718096', fontWeight: 500 }}>Total Lorries</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start' }}>
        {/* Main Bays Grid - 75% Width */}
        <div style={{ flex: '3' }}>
          <h2 style={{ fontSize: '24px', color: '#1a2f58', marginBottom: '20px' }}>Operational Bays</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {bays.map((bay, index) => (
              <div 
                key={bay.id} 
                className={`card stagger-${(index % 4) + 1}`}
                style={{ 
                  cursor: 'pointer', 
                  borderTop: `6px solid ${bay.type === 'Load' ? '#183e7a' : '#ef6c00'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
                onClick={() => handleBayClick(bay)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#1a2f58', fontSize: '18px' }}>
                      {bay.id}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', margin: 0 }}>{bay.type} Bay</h3>
                    </div>
                  </div>
                  {getStatusBadge(bay.status)}
                </div>

                {bay.status === 'Free' ? (
                  <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <span style={{ color: '#999', fontSize: '14px' }}>Ready for Assignment</span>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.8)', borderRadius: '16px', flex: 1, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lorry Reg</span>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#1a2f58' }}>{bay.currentLorry?.regNumber}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</span>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#1a2f58' }}>{bay.currentCount} / {bay.targetCount}</div>
                      </div>
                    </div>
                    
                    <div className="glass-progress">
                      <div className="glass-progress-fill" style={{ 
                        width: `${(bay.currentCount / bay.targetCount) * 100}%`,
                        background: bay.status === 'Complete' ? 'linear-gradient(90deg, #00838f, #4dd0e1)' : ''
                      }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Queue List - 25% Width */}
        <div style={{ flex: '1', marginTop: '52px' }}>
          <div className="card-dark" style={{ position: 'relative', overflow: 'hidden', height: '100%', minHeight: '400px' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 500 }}>Queue List</h3>
              <span style={{ fontSize: '24px', fontWeight: 300, color: 'rgba(255,255,255,0.8)' }}>
                {allQueuedLorries.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {allQueuedLorries.map((lorry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: lorry.opType === 'Load' ? 'rgba(58, 123, 213, 0.3)' : 'rgba(239, 108, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={14} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{lorry.regNumber}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Assigned to Bay {lorry.assignedBayId} • {lorry.targetCount} Cyl</div>
                  </div>
                </div>
              ))}
              {allQueuedLorries.length === 0 && (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                  No lorries in queue
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', color: '#1a2f58', marginBottom: '20px' }}>Facility Analytics</h2>
      {/* Analytics Cards Row (Bottom) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '24px', marginBottom: '40px' }}>
        
        {/* Profile/Facility Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'linear-gradient(135deg, #74ebd5, #9face6)', height: '140px', position: 'relative' }}></div>
          <div style={{ padding: '24px', position: 'relative', marginTop: '-50px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
              <img src="/logo.png" alt="Litro Gas Logo" style={{ height: '60px' }} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Main Outpost</h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>Colombo Facility HQ</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#555' }}>Daily Target</span>
              <span style={{ fontWeight: 600 }}>2,500 Cyl</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#555' }}>Shift</span>
              <span style={{ fontWeight: 600 }}>Morning (08:00 - 16:00)</span>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#1a2f58', marginBottom: '8px' }}>Efficiency</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 300, color: '#1a2f58' }}>{stats?.efficiency || 0}%</span>
                <span style={{ fontSize: '13px', color: '#666' }}>Output rate</span>
              </div>
            </div>
            <button className="icon-btn" style={{ background: '#f8f9fc' }}><ArrowUpRight size={18} color="#183e7a" /></button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', marginTop: '20px' }}>
            {[40, 70, 45, 90, 60, 85, 30].map((h, i) => (
              <div key={i} style={{ width: '12%', background: i === 3 ? '#3a7bd5' : '#e2e8f0', height: `${h}%`, borderRadius: '6px', position: 'relative' }}>
                 {i === 3 && <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', background: '#3a7bd5', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Peak</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#a0aec0', fontSize: '12px', fontWeight: 500 }}>
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>

        {/* Time Tracker Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <button className="icon-btn" style={{ position: 'absolute', top: '24px', right: '24px', background: '#f8f9fc' }}><ArrowUpRight size={18} color="#183e7a" /></button>
          <h3 style={{ fontSize: '16px', color: '#1a2f58', position: 'absolute', top: '24px', left: '24px' }}>Avg Wait</h3>
          
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '30px' }}>
            <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeDasharray="4 8" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#3a7bd5" strokeWidth="8" strokeDasharray="250" strokeDashoffset={250 - (Math.min(stats?.avgWait || 0, 30) / 30 * 250)} style={{ transition: 'all 1s ease' }} />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 300, color: '#1a2f58' }}>{stats?.avgWait || 0}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Minutes</div>
            </div>
          </div>
        </div>

      </div>

      {/* Past Lorries Section */}
      <h2 style={{ fontSize: '24px', color: '#1a2f58', marginBottom: '20px', marginTop: '20px' }}>Completed Orders / Past Lorries</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {stats?.pastLorries && stats.pastLorries.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fc' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Time</th>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Lorry Reg</th>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Selling Point</th>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Operation</th>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Cylinders</th>
                <th style={{ padding: '16px 24px', color: '#718096', fontWeight: 500, fontSize: '13px' }}>Bay Used</th>
              </tr>
            </thead>
            <tbody>
              {stats.pastLorries.map((lorry, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1a2f58', fontWeight: 500 }}>{lorry.completedAt}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1a2f58', fontWeight: 600 }}>{lorry.regNumber}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4a5568' }}>{lorry.distName}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      background: lorry.opType === 'Load' ? 'rgba(58, 123, 213, 0.1)' : 'rgba(239, 108, 0, 0.1)', 
                      color: lorry.opType === 'Load' ? '#183e7a' : '#ef6c00', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 600 
                    }}>{lorry.opType}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4a5568' }}>{lorry.targetCount}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#4a5568', fontWeight: 500 }}>Bay {lorry.bayId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
            No lorries processed yet.
          </div>
        )}
      </div>

      {/* Modal for Bay Details using React Portal */}
      {freshSelectedBay && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <h2 style={{ marginBottom: '24px', fontSize: '22px' }}>Bay {freshSelectedBay.id} Overview</h2>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <span className={`badge badge-${freshSelectedBay.type.toLowerCase()}`}>{freshSelectedBay.type} Operation</span>
              {getStatusBadge(freshSelectedBay.status)}
            </div>

            {freshSelectedBay.status !== 'Free' && freshSelectedBay.currentLorry && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8f9fc', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Registration</div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#1a2f58' }}>{freshSelectedBay.currentLorry.regNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Destination</div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#1a2f58' }}>{freshSelectedBay.currentLorry.distName}</div>
                  </div>
                </div>

                <div style={{ background: '#f8f9fc', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Processed Cylinders</div>
                  <div style={{ fontWeight: 300, fontSize: '48px', color: '#183e7a' }}>
                    {freshSelectedBay.currentCount} <span style={{ fontSize: '20px', color: '#a0aec0', fontWeight: 500 }}>/ {freshSelectedBay.targetCount}</span>
                  </div>
                  <div className="glass-progress" style={{ marginTop: '16px' }}>
                    <div className="glass-progress-fill" style={{ 
                      width: `${(freshSelectedBay.currentCount / freshSelectedBay.targetCount) * 100}%`,
                      background: freshSelectedBay.status === 'Complete' ? 'linear-gradient(90deg, #00838f, #4dd0e1)' : ''
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {freshSelectedBay.status === 'Occupied' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}
                      onClick={() => updateBayStatus(freshSelectedBay.id, 'In Progress')}
                    >
                      <Play size={18} /> Start Auto-Count
                    </button>
                  )}

                  {freshSelectedBay.status === 'Complete' && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}
                      onClick={() => clearBay(freshSelectedBay.id)}
                    >
                      <LogOut size={18} /> Release Bay
                    </button>
                  )}
                </div>
              </div>
            )}

            {freshSelectedBay.status === 'Free' && (
              <div style={{ padding: '24px 0 0', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#f0f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ScanLine size={24} color="#a0aec0" />
                </div>
                <p style={{ color: '#666', fontSize: '15px' }}>Bay is empty. Scan an arriving {freshSelectedBay.type} lorry to assign it here.</p>
              </div>
            )}

            {/* Show Queued Lorries for this specific Bay */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Lorries Queued for Bay {freshSelectedBay.id} ({freshSelectedBay.queue?.length || 0})
              </h3>
              
              {freshSelectedBay.queue?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {freshSelectedBay.queue.map((lorry, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fc', borderRadius: '12px', border: '1px solid #f1f3f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: lorry.opType === 'Load' ? 'rgba(58, 123, 213, 0.1)' : 'rgba(239, 108, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={12} color={lorry.opType === 'Load' ? '#183e7a' : '#ef6c00'} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2f58' }}>{lorry.regNumber}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{lorry.targetCount} Cylinders</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: '#a0aec0' }}>
                        Pos #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8f9fc', borderRadius: '12px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                  No lorries currently in queue for this bay.
                </div>
              )}
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
