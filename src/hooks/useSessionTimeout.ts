/**
 * Session Timeout Hook
 * 
 * Kullanıcı belirli bir süre işlem yapmazsa otomatik çıkış yapar.
 * Admin için daha uzun (60dk), ajan için daha kısa (30dk).
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  /** Timeout süresi (ms) */
  timeoutMs: number;
  /** Timeout olunca çağrılacak fonksiyon */
  onTimeout: () => void;
  /** aktif mi? */
  enabled: boolean;
}

// Varsayılan süreler
export const SESSION_TIMEOUT = {
  ADMIN: 60 * 60 * 1000,   // 60 dakika
  AGENT: 30 * 60 * 1000,   // 30 dakika
} as const;

const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keydown',
  'scroll', 'touchstart', 'click', 'focus',
] as const;

export const useSessionTimeout = ({ timeoutMs, onTimeout, enabled }: UseSessionTimeoutOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Callback'i güncel tut
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    // İlk timer'ı başlat
    resetTimer();

    // Aktivite dinleyicileri
    const handleActivity = () => resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [enabled, resetTimer]);
};
