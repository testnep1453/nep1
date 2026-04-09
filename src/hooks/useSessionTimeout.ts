import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 Saat (App.tsx hata vermesin diye eklendi)

export const useSessionTimeout = () => {
  const { student, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Sadece Admin (1002) için oturum zaman aşımı kalkanını açıyoruz. Öğrenciler serbest!
    if (!student || student.id !== '1002') return;

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout(); // 1 saat hiçbir şeye dokunulmazsa çıkış yap
        window.location.reload();
      }, SESSION_TIMEOUT);
    };

    resetTimer(); // Sistemi başlat

    // Ekranda en ufak bir hareket olduğunda 1 saati sıfırdan başlat
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [student, logout]);
};
