import React, { useContext, useEffect } from 'react';
import { AppContext } from '../App';

export default function DigitalDisplay({ type }) {
  const { bays } = useContext(AppContext);
  
  // Bay 1 for Load, Bay 5 for Unload
  const bayId = type === 'Load' ? 1 : 5;
  const bay = bays.find(b => b.id === bayId);

  if (!bay) return null;

  const isActive = bay.status === 'In Progress';
  const displayValue = isActive ? bay.currentCount.toString().padStart(4, '0') : '----';
  const ghostValue = '8888'; // Used to show faint inactive segments in the background
  
  const label = type === 'Load' ? 'REMAINING (BAY 1)' : 'UNLOADED (BAY 5)';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c', // Deep dark background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{
        fontSize: '3vw',
        letterSpacing: '5px',
        marginBottom: '40px',
        color: '#ff2a2a',
        textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
        opacity: isActive ? 1 : 0.4,
        transition: 'opacity 0.3s',
        fontWeight: 'bold',
        fontFamily: "'Share Tech Mono', monospace"
      }}>
        {label}
      </div>
      
      {/* 7-Segment Display Container */}
      <div style={{
        position: 'relative',
        background: '#050505',
        padding: '2vw 5vw',
        borderRadius: '20px',
        border: '8px solid #1a1a1a',
        boxShadow: 'inset 0 0 50px #000, 0 10px 30px rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        
        {/* Background (Inactive Segments) */}
        <div style={{
          fontFamily: "'DSEG7 Classic', sans-serif",
          fontSize: '25vw',
          lineHeight: '1',
          fontStyle: 'italic',
          color: '#2a0505', // Very faint dark red for inactive segments
          userSelect: 'none',
          WebkitFontSmoothing: 'none', // Ensure sharp rendering
        }}>
          {ghostValue}
        </div>

        {/* Foreground (Active Segments) */}
        <div style={{
          position: 'absolute',
          fontFamily: "'DSEG7 Classic', sans-serif",
          fontSize: '25vw',
          lineHeight: '1',
          fontStyle: 'italic',
          color: '#ff1a1a', // Bright LED red
          textShadow: '0 0 10px rgba(255,0,0,0.6)', // Reduced glow for sharp lines
          userSelect: 'none',
          opacity: isActive ? 1 : 0.2, // Dim when not active
          transition: 'opacity 0.3s',
          WebkitFontSmoothing: 'none', // Ensure sharp rendering
        }}>
          {displayValue}
        </div>
      </div>
      
      {!isActive && (
        <div style={{
          position: 'absolute',
          bottom: '10vh',
          fontSize: '2vw',
          color: '#555',
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '2px'
        }}>
          WAITING FOR SUPERVISOR...
        </div>
      )}
    </div>
  );
}
