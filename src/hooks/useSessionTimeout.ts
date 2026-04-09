import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export const useSessionTimeout = () => {
  const { student, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Sadece Admin (1002) için oturum zaman aşımı kalkanını açıyoruz. Öğrenciler serbest!
    if (!student || student.id !== '1002') return;

    const ONE_HOUR = 60 * 60 * 1000; // 1 Saat (Milisaniye cinsinden)

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout(); // 1 saat hiçbir şeye dokunulmazsa çıkış yap
        window.location.reload();
      }, ONE_HOUR);
    };

    resetTimer(); // Sistemi başlat

    // Ekranda en ufak bir hareket olduğunda (fare, klavye, dokunma) 1 saati sıfırdan başlat
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [student, logout]);
};
