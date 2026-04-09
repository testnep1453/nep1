import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

interface CircularCountdownProps {
  targetDate: string | number | Date;
}

// "export const" diyerek direkt dışarı aktarıyoruz
export const CircularCountdown: React.FC<CircularCountdownProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="flex justify-center items-center p-4">
        <h2 className="text-2xl font-bold text-green-500">Derse Başlayabilirsiniz!</h2>
      </div>
    );
  }

  const renderCircle = (value: number, label: string, maxValue: number, color: string) => {
    // 00 olan değerleri tamamen gizler
    if (value === 0) return null; 

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / maxValue) * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center m-2">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-in-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            {value.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
            {label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <span>⏰</span> SONRAKİ DERSE
      </h2>

      <div className="flex flex-wrap justify-center items-center gap-4">
        {renderCircle(days, 'Gün', 30, 'text-blue-500')}
        {renderCircle(hours, 'Saat', 24, 'text-orange-500')}
        {renderCircle(minutes, 'Dakika', 60, 'text-green-500')}
        {renderCircle(seconds, 'Saniye', 60, 'text-purple-500')}
      </div>
    </div>
  );
};
