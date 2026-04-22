import { useState, useEffect } from 'react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
}

export const useCountdown = (targetDate: string | number | Date): TimeRemaining => {
  const toMs = (t: string | number | Date): number => {
    if (typeof t === 'number') return t;
    if (t instanceof Date) return t.getTime();
    // "2026-04-16" gibi string ise lokal saat 19:00 olarak parse et
    return new Date(t).getTime();
  };

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: false,
  });

  useEffect(() => {
    const targetMs = toMs(targetDate);

    const calculateTime = () => {
      const distance = targetMs - Date.now();

      if (isNaN(distance) || distance <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true });
        return;
      }

      setTimeRemaining({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        total: distance,
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return timeRemaining;
};

