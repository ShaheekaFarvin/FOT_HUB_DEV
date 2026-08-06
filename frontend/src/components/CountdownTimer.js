import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

/**
 * CountdownTimer
 * Props:
 *   targetDate  – Date | string  – the date to count down to
 *   label       – string         – prefix label e.g. "Starts in" or "Ends in"
 *   onExpire    – fn (optional)  – called once when timer hits 0
 *   compact     – bool           – if true, renders a small inline badge; else a larger strip
 */
const CountdownTimer = ({ targetDate, label = 'Ends in', onExpire, compact = false }) => {
  const getRemaining = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    const totalSecs = Math.floor(diff / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return { d, h, m, s, totalSecs };
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!remaining) return;
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (!r && onExpire) onExpire();
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!remaining) return null;

  const { d, h, m, s } = remaining;

  // ── Compact mode: small inline badge (used in election cards) ──
  if (compact) {
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (d === 0) parts.push(`${String(m).padStart(2,'0')}m`);
    if (d === 0 && h === 0) parts.push(`${String(s).padStart(2,'0')}s`);

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.01em',
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        <Timer size={10} style={{ flexShrink: 0 }} />
        {label} {parts.join(' ')}
      </span>
    );
  }

  // ── Full mode: digit blocks (used in VotingPage hero) ──
  const blocks = [
    { val: d,  unit: 'Days'    },
    { val: h,  unit: 'Hours'   },
    { val: m,  unit: 'Mins'    },
    { val: s,  unit: 'Secs'    },
  ].filter((_, i) => {
    // Hide Days block if < 1 day left
    if (i === 0 && d === 0) return false;
    return true;
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.90)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginRight: '2px',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        {label}
      </span>

      {blocks.map(({ val, unit }, i) => (
        <React.Fragment key={unit}>
          {i > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 700, fontSize: '16px', marginTop: '-2px' }}>:</span>
          )}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: d === 0 && h === 0 ? '22px' : '20px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                minWidth: '32px',
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              }}
            >
              {String(val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.80)', fontWeight: 600, letterSpacing: '0.06em', marginTop: '2px', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
              {unit}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default CountdownTimer;
