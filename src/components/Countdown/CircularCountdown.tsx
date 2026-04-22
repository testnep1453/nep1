import React, { useEffect, useRef } from 'react';
import { useCountdown } from '../../hooks/useCountdown';

interface CircularCountdownProps {
  targetDate: string | number | Date;
}

interface RingProps {
  value: number;
  max: number;
  label: string;
  color: string;
  trackColor: string;
  size?: number;
}

const Ring: React.FC<RingProps> = ({ value, max, label, color, trackColor, size = 160 }) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const r = 42;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(100 - pct);
    }
  }, [pct]);

  return (
    <div
      style={{ width: size, height: size, position: 'relative' }}
      className="flex-shrink-0"
    >
      {/* SVG Ring */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Track */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth="7"
          pathLength="100"
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={String(100 - pct)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: size * 0.28,
            color: '#ffffff',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-1px',
          }}
        >
          {String(value).padStart(2, '0')}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: size * 0.085,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: 4,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export const CircularCountdown: React.FC<CircularCountdownProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="flex justify-center items-center py-4">
        <span className="text-2xl font-black text-[#39FF14] uppercase tracking-widest animate-pulse">
          🟢 Derse Başlayabilirsiniz!
        </span>
      </div>
    );
  }

  // Responsive size: büyük ekranda 170px, küçükte 100px
  const getSize = () => {
    if (typeof window === 'undefined') return 155;
    if (window.innerWidth >= 1024) return 170;
    if (window.innerWidth >= 640) return 135;
    return 105;
  };

  const [size, setSize] = React.useState(getSize);
  React.useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Son 10 saniyede tüm renkler kırmızı ve nabız atıyor mu kontrolü
  const isFinal = days === 0 && hours === 0 && minutes === 0 && seconds <= 10;

  const rings = [
    { value: days,    max: 30, label: 'GÜN',    color: isFinal ? '#ef4444' : '#28c76f', track: '#1a3a2a' },
    { value: hours,   max: 24, label: 'SAAT',   color: isFinal ? '#ef4444' : '#ea5455', track: '#3a1a1a' },
    { value: minutes, max: 60, label: 'DAKİKA', color: isFinal ? '#ef4444' : '#ff9f43', track: '#3a2a1a' },
    { value: seconds, max: 60, label: 'SANİYE', color: isFinal ? '#ef4444' : '#00cfe8', track: '#1a2f35' },
  ].filter((_r, i) => {
    // days=0 ise gün kutusunu gizle
    if (i === 0 && days === 0) return false;
    // hours=0 VE days=0 ise saat kutusunu gizle
    if (i === 1 && days === 0 && hours === 0) return false;
    return true;
  });

  const gap = size >= 155 ? 32 : size >= 120 ? 20 : 12;

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{
        animation: isFinal ? 'heartbeat 0.8s infinite' : 'none',
      }}
    >
      {/* Progress rings */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
          flexWrap: 'nowrap',
        }}
      >
        {rings.map((r) => (
          <Ring
            key={r.label}
            value={r.value}
            max={r.max}
            label={r.label}
            color={r.color}
            trackColor={r.track}
            size={size}
          />
        ))}
      </div>

      <style>{`
        @keyframes heartbeat {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};



