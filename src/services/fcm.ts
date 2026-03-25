import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('FCM not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const setupNotificationListener = async (callback: (payload: any) => void) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up notification listener:', error);
  }
};
