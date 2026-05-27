import React, { useState, useContext, useRef } from 'react';
import jsQR from 'jsqr';
import { AppContext } from '../App';
import { CheckCircle, Camera, AlertCircle, Hash } from 'lucide-react';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualReg, setManualReg] = useState('');
  const [manualDist, setManualDist] = useState('');
  const [manualOp, setManualOp] = useState('Load');
  const [manualCount, setManualCount] = useState('');
  const { assignLorry } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const processSuccess = (payload) => {
    setScanResult(payload);
    setScanError(null);
    setShowManual(false);
    assignLorry(payload);
    setTimeout(() => setScanResult(null), 4000);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processSuccess({
      regNumber: manualReg.trim(),
      distName: manualDist.trim(),
      opType: manualOp,
      targetCount: parseInt(manualCount, 10),
    });
    setManualReg(''); setManualDist(''); setManualCount('');
  };

  // Draw image to canvas at given size and scan with jsQR
  const scanCanvas = (imgEl, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgEl, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
  };

  // Rotate image on canvas 90 degrees clockwise, return new canvas
  const rotateCanvas = (sourceCanvas) => {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.height;
    canvas.height = sourceCanvas.width;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth',
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Downscale so jsQR doesn't choke on 12MP iPhone photos
        // Try multiple target sizes — sometimes smaller is better for QR detection
        const sizes = [800, 400, 1200, 600];
        let found = null;

        for (const size of sizes) {
          // Keep aspect ratio
          let w = img.width;
          let h = img.height;
          if (w > h) { h = Math.round((h / w) * size); w = size; }
          else        { w = Math.round((w / h) * size); h = size; }

          const result = scanCanvas(img, w, h);
          if (result) { found = result.data; break; }
        }

        // If portrait QR not found, try scanning at different rotations
        // (iPhone EXIF issue — sometimes image renders sideways on canvas)
        if (!found) {
          const sizes2 = [800, 400];
          outer:
          for (const size of sizes2) {
            let w = img.width;
            let h = img.height;
            if (w > h) { h = Math.round((h / w) * size); w = size; }
            else        { w = Math.round((w / h) * size); h = size; }

            // Draw base canvas for rotation
            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = w; baseCanvas.height = h;
            const bCtx = baseCanvas.getContext('2d');
            bCtx.fillStyle = '#ffffff';
            bCtx.fillRect(0, 0, w, h);
            bCtx.drawImage(img, 0, 0, w, h);

            // Try 3 rotations (90, 180, 270)
            let rotCanvas = baseCanvas;
            for (let rot = 0; rot < 3; rot++) {
              const result = rotateCanvas(rotCanvas);

              // We need the rotated canvas to continue rotating
              const newCanvas = document.createElement('canvas');
              newCanvas.width = rotCanvas.height;
              newCanvas.height = rotCanvas.width;
              const nCtx = newCanvas.getContext('2d');
              nCtx.translate(newCanvas.width / 2, newCanvas.height / 2);
              nCtx.rotate(Math.PI / 2);
              nCtx.drawImage(rotCanvas, -rotCanvas.width / 2, -rotCanvas.height / 2);
              rotCanvas = newCanvas;

              if (result) { found = result.data; break outer; }
            }
          }
        }

        if (found) {
          try {
            const payload = JSON.parse(found);
            processSuccess(payload);
          } catch (e) {
            setScanError('QR Code detected but not a valid Litro payload.');
          }
        } else {
          setScanError('Could not read QR code from photo. Try: brighter lighting, QR filling more of the frame, or use Manual Entry below.');
          setShowManual(true);
        }

        setIsProcessing(false);
        event.target.value = '';
      };
      img.onerror = () => {
        setScanError('Failed to load image. Please try again.');
        setIsProcessing(false);
        event.target.value = '';
      };
      img.src = e.target.result;
    };
    // Use FileReader instead of createObjectURL — more compatible with Safari
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '0', maxWidth: '100%', minHeight: '100vh', background: '#dbe3ed', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {/* Top Bar */}
      <div style={{ padding: '40px 20px 20px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <img src="/logo.png" alt="Litro Gas" style={{ height: '64px', marginBottom: '16px' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <h1 style={{ fontSize: '24px', color: '#1a2f58', fontWeight: 600, margin: 0 }}>Arrival Scanner</h1>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Scan lorry QR code to assign bay</p>
      </div>

      <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>

        {scanResult ? (
          <div className="fade-in" style={{ padding: '40px 24px', background: 'white', borderRadius: '32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(46,125,50,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={48} color="#2e7d32" />
            </div>
            <h2 style={{ marginBottom: '8px', fontSize: '26px', color: '#1a2f58' }}>Assigned!</h2>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '4px' }}>
              <strong style={{ color: '#1a2f58' }}>{scanResult.regNumber}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{scanResult.distName}</p>
            <span style={{ display: 'inline-block', padding: '6px 16px', background: '#f0f4f8', borderRadius: '20px', fontSize: '14px', color: '#183e7a', fontWeight: 500 }}>
              {scanResult.opType} · {scanResult.targetCount} Cylinders
            </span>
          </div>
        ) : (
          <>
            {/* Scan button */}
            <button
              style={{ width: '100%', padding: '36px 20px', background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #183e7a, #3a7bd5)', color: 'white', border: 'none', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', boxShadow: isProcessing ? 'none' : '0 16px 32px rgba(24,62,122,0.35)', cursor: isProcessing ? 'not-allowed' : 'pointer', WebkitTapHighlightColor: 'transparent' }}
              onClick={() => !isProcessing && fileInputRef.current.click()}
              disabled={isProcessing}
            >
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '18px', borderRadius: '50%' }}>
                {isProcessing
                  ? <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <Camera size={40} color="white" />
                }
              </div>
              <span style={{ fontSize: '20px', fontWeight: 600 }}>{isProcessing ? 'Reading QR...' : 'Tap to Scan QR'}</span>
              {!isProcessing && <span style={{ fontSize: '12px', opacity: 0.7 }}>Take a photo of the QR code</span>}
            </button>

            {/* No capture attr — lets Safari use Photos picker which has correct orientation */}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

            {/* Error */}
            {scanError && (
              <div style={{ padding: '14px 18px', background: 'white', color: '#b71c1c', borderRadius: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{scanError}</span>
              </div>
            )}

            {/* Manual Entry */}
            <button
              style={{ background: showManual ? '#1a2f58' : 'white', border: '2px solid #1a2f58', borderRadius: '20px', padding: '14px 20px', color: showManual ? 'white' : '#1a2f58', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', WebkitTapHighlightColor: 'transparent' }}
              onClick={() => setShowManual(!showManual)}
            >
              <Hash size={16} />
              {showManual ? 'Hide Manual Entry' : 'Manual Entry'}
            </button>

            {showManual && (
              <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                <h3 style={{ color: '#1a2f58', marginBottom: '20px', fontSize: '16px' }}>Enter Lorry Details</h3>
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Registration No. (e.g. WP LA-1234)" value={manualReg} onChange={e => setManualReg(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', WebkitAppearance: 'none' }} />
                  <input type="text" placeholder="Selling Point / District" value={manualDist} onChange={e => setManualDist(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', WebkitAppearance: 'none' }} />
                  <select value={manualOp} onChange={e => setManualOp(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', background: 'white', WebkitAppearance: 'none' }}>
                    <option value="Load">Load (Fill Cylinders)</option>
                    <option value="Unload">Unload (Empty Cylinders)</option>
                  </select>
                  <input type="number" placeholder="Target Cylinder Count" value={manualCount} onChange={e => setManualCount(e.target.value)} required min="1" style={{ padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', WebkitAppearance: 'none' }} />
                  <button type="submit" style={{ padding: '16px', background: 'linear-gradient(135deg, #183e7a, #3a7bd5)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                    Assign to Bay
                  </button>
                </form>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#bbb', fontSize: '11px', padding: '8px', cursor: 'pointer' }}
                onClick={() => { processSuccess({ regNumber: 'WP-TEST-' + Math.floor(Math.random()*999), distName: 'Test District', opType: 'Load', targetCount: 50 }); }}>
                Test Mode
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
