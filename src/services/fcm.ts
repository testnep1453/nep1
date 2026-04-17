import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { supabase } from '../config/supabase';

const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : '';
};

export const requestNotificationPermission = async (studentId?: string): Promise<string | null> => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.register(getEnvVar('BASE_URL') + 'firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: getEnvVar('VITE_FIREBASE_VAPID_KEY'),
      serviceWorkerRegistration: registration
    });

    if (token && studentId) {
      await supabase.from('students').update({
        "fcmToken": token,
        "lastSeen": new Date().toISOString()
      }).eq('"id"', studentId);
    }
    return token;
  } catch { return null; }
};

export const sendPushNotification = async (title: string, body: string, userId: string = 'all') => {
  try {
    await supabase.from('fcm_queue').insert([{ 
      "userId": String(userId),
      "title": title || 'NEP Operasyon', 
      "body": body || '', 
      "isRead": false,
      "createdAt": new Date().toISOString() 
    }]);
  } catch (error) {
    console.warn('FCM error:', error);
  }
};