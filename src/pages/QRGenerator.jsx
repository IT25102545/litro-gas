import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRGenerator() {
  const [formData, setFormData] = useState({
    regNumber: '',
    distName: '',
    opType: 'Load',
    targetCount: ''
  });
  const [qrValue, setQrValue] = useState(null);
  const canvasRef = useRef(null);

  // Whenever qrValue changes, render QR code onto canvas
  useEffect(() => {
    if (qrValue && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrValue, {
        width: 280,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
    }
  }, [qrValue]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.regNumber || !formData.distName || !formData.targetCount) return;
    
    // Create a JSON payload
    const payload = JSON.stringify({
      regNumber: formData.regNumber,
      distName: formData.distName,
      opType: formData.opType,
      targetCount: parseInt(formData.targetCount, 10)
    });
    setQrValue(payload);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_${formData.regNumber.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app-wrapper fade-in">
      <div className="app-layout" style={{ maxWidth: '1000px', margin: '0 auto', minHeight: 'auto' }}>
        <header className="top-nav" style={{ background: 'rgba(255,255,255,0.2)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container">
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Litro Gas Logo" style={{ height: '48px' }} onError={(e) => { e.target.style.display = 'none'; }} />
            </h2>
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Standalone Generator Terminal
          </div>
        </header>

        <main className="main-content">
          <div className="page-header" style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px' }}>QR Code Dispatch Generator</h1>
            <p>Generate arrival QR codes for distribution lorries departing for the main outpost.</p>
          </div>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: '1', minWidth: '350px' }}>
              <h3 style={{ marginBottom: '24px', color: '#1a2f58' }}>Lorry Details</h3>
              <form onSubmit={handleGenerate}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4a5568', fontSize: '13px' }}>Lorry Registration Number</label>
                <input 
                  type="text" 
                  name="regNumber" 
                  value={formData.regNumber} 
                  onChange={handleChange} 
                  placeholder="e.g. WP LA-1234"
                  required 
                />

                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4a5568', fontSize: '13px' }}>Distribution Name (Selling Point)</label>
                <input 
                  type="text" 
                  name="distName" 
                  value={formData.distName} 
                  onChange={handleChange} 
                  placeholder="e.g. Colombo Central Dist."
                  required 
                />

                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4a5568', fontSize: '13px' }}>Operation Type</label>
                <select name="opType" value={formData.opType} onChange={handleChange}>
                  <option value="Load">Load (Fill Cylinders)</option>
                  <option value="Unload">Unload (Empty Cylinders)</option>
                </select>

                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#4a5568', fontSize: '13px' }}>Target Cylinder Count</label>
                <input 
                  type="number" 
                  name="targetCount" 
                  value={formData.targetCount} 
                  onChange={handleChange} 
                  placeholder="e.g. 100"
                  min="1"
                  required 
                />

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px', padding: '16px' }}>
                  Generate QR Code
                </button>
              </form>
            </div>

            {qrValue && (
              <div className="card fade-in" style={{ flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ marginBottom: '32px', color: '#1a2f58' }}>Generated QR Code</h3>
                <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}>
                  <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px' }} />
                </div>
                
                <button 
                  onClick={handleDownload} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '32px', width: '220px', background: 'rgba(255,255,255,0.8)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#183e7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span style={{ color: '#183e7a' }}>Download PNG</span>
                </button>
                
                <p style={{ marginTop: '20px', fontSize: '13px', color: '#666', textAlign: 'center', maxWidth: '280px', lineHeight: '1.5' }}>
                  Driver must present this QR code upon arrival at the main Litro outpost.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
