import React, { useEffect, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import QRCode from 'qrcode';

export default function MobileConnect() {
  // Dynamically uses whatever host is serving the app — works both locally and on Railway
  const scannerUrl = `${window.location.origin}/mobile-scanner`;
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, scannerUrl, {
        width: 250,
        margin: 3,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
    }
  }, [scannerUrl]);

  return (
    <div className="container fade-in">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px' }}>Connect Mobile Scanner</h1>
        <p>Use your mobile phone as a wireless QR scanner.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
        <Smartphone size={48} color="#183e7a" style={{ marginBottom: '20px' }} />
        <h2 style={{ marginBottom: '16px', color: '#1a2f58' }}>Scan to Open Scanner</h2>
        <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
          Open your phone's camera and scan this QR code. It will open the scanner app on your phone,
          and any scanned lorry QR codes will be synced to this desktop Dashboard instantly.
        </p>

        <div style={{ display: 'inline-block', background: 'white', padding: '16px', borderRadius: '12px', border: '2px solid #f1f3f5', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        <div style={{ marginTop: '32px', background: '#f8f9fc', padding: '16px', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Or visit this URL directly on your phone:</p>
          <code style={{ fontSize: '15px', color: '#1565c0', fontWeight: 'bold', wordBreak: 'break-all' }}>{scannerUrl}</code>
        </div>
      </div>
    </div>
  );
}
