import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initErrorLogger } from './services/errorLogger';

// Global hata dinleyicisini başlat (Supabase Logger) - TDZ hatalarını önlemek için try-catch içinde
try {
  initErrorLogger();
} catch (e) {
  console.warn('Error logger başlatılamadı:', e);
}

// PWA (Uygulama Yükleme) için Service Worker'ı manuel olarak sisteme kaydediyoruz
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/nep1/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('PWA Modülü Aktif:', registration.scope);
      })
      .catch((err) => {
        console.log('PWA Hatası:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

