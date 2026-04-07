import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const swUrl = import.meta.env.BASE_URL + 'firebase-messaging-sw.js';
        const registration = await navigator.serviceWorker.register(swUrl);
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        return token;
      } catch {
        // Service Worker / Push API kullanılamıyorsa sessizce atla
        return null;
      }
    }
    return null;
  } catch {
    // Bildirim izni alınamadı — sessizce atla
    return null;
  }
};

export const setupNotificationListener = async (callback: (payload: unknown) => void) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch {
    // Listener kurulamadı — sessizce atla
  }
};
