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
}

const Ring: React.FC<RingProps> = ({ value, max, label, color, trackColor }) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const r = 42;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(100 - pct);
    }
  }, [pct]);

  return (
    <div className="w-full h-full relative flex-shrink-0">
      {/* SVG Ring */}
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ transform: 'rotate(-90deg)' }}
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
        <div className="font-extrabold text-xl sm:text-3xl md:text-4xl text-white tabular-nums tracking-tight">
          {String(value).padStart(2, '0')}
        </div>
        <div
          className="font-bold text-[8px] sm:text-[10px] md:text-xs uppercase tracking-widest mt-1"
          style={{ color: color }}
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

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{
        animation: isFinal ? 'heartbeat 0.8s infinite' : 'none',
      }}
    >
      {/* Progress rings */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 flex-nowrap overflow-x-auto px-2">
        {rings.map((r) => (
          <div key={r.label} className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40">
            <Ring
              value={r.value}
              max={r.max}
              label={r.label}
              color={r.color}
              trackColor={r.track}
            />
          </div>
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



