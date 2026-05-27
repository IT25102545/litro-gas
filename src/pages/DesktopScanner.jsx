import React, { useEffect, useState, useContext } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AppContext } from '../App';
import { CheckCircle } from 'lucide-react';

export default function DesktopScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const { assignLorry } = useContext(AppContext);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(success, error);

    function success(result) {
      try {
        const payload = JSON.parse(result);
        setScanResult(payload);
        assignLorry(payload);
        
        setTimeout(() => {
          setScanResult(null);
        }, 3000);
      } catch (e) {
        setScanError("Invalid QR Code Format.");
      }
    }

    function error(err) {
      // Ignored.
    }

    return () => {
      scanner.clear().catch(e => console.log(e));
    };
  }, [assignLorry]);

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#1a2f58' }}>Web Scanner (Desktop)</h1>
        <p>Use your webcam to scan the Lorry QR Code.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '32px' }}>
        
        <div style={{ display: scanResult ? 'none' : 'block' }}>
          <div id="reader" style={{ width: '100%', border: 'none', borderRadius: '12px', overflow: 'hidden' }}></div>
          {scanError && <p style={{ color: 'red', marginTop: '16px' }}>{scanError}</p>}
          
          <div style={{ marginTop: '30px', padding: '16px', background: '#f8f9fc', borderRadius: '8px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '10px' }}>Testing controls</h4>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => {
                const payload = {
                  regNumber: "WP-MOCK-" + Math.floor(Math.random()*1000),
                  distName: "Test Dist " + Math.floor(Math.random()*10),
                  opType: Math.random() > 0.5 ? "Load" : "Unload",
                  targetCount: 50
                };
                setScanResult(payload);
                assignLorry(payload);
                setTimeout(() => setScanResult(null), 3000);
              }}
            >
              Simulate Successful Scan
            </button>
          </div>
        </div>

        {scanResult && (
          <div className="fade-in" style={{ padding: '40px 20px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '12px' }}>
            <CheckCircle size={64} style={{ marginBottom: '16px', margin: '0 auto' }} />
            <h2 style={{ marginBottom: '8px' }}>Scan Successful!</h2>
            <p style={{ fontSize: '18px' }}>Lorry <strong>{scanResult.regNumber}</strong> assigned to system.</p>
            <p style={{ marginTop: '8px' }}>Operation: <strong>{scanResult.opType}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
