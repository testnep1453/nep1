import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

interface CircularCountdownProps {
  targetDate: string | number | Date;
}

export const CircularCountdown: React.FC<CircularCountdownProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="flex justify-center items-center py-2">
        <h2 className="text-xl font-bold text-green-500">Derse Başlayabilirsiniz!</h2>
      </div>
    );
  }

  const renderCircle = (value: number, label: string, maxValue: number, color: string) => {
    // 00 olanları gizle
    if (value === 0) return null;

    const radius = 35; // Biraz daha kompakt yaptık
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / maxValue) * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center mx-1">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-in-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800 dark:text-white leading-none">
            {value.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mt-0.5">
            {label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full bg-transparent">
      {/* Yazı Boyutu Büyük ve Sade */}
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
        <span>⏰</span> SONRAKİ DERSE
      </h2>

      {/* Sayaçlar - Kutu yok, direkt yan yana */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {renderCircle(days, 'Gün', 30, 'text-blue-500')}
        {renderCircle(hours, 'Saat', 24, 'text-orange-500')}
        {renderCircle(minutes, 'Dakika', 60, 'text-green-500')}
        {renderCircle(seconds, 'Saniye', 60, 'text-purple-500')}
      </div>
    </div>
  );
};
