import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { supabase } from '../config/supabase';

// Deleted getEnvVar usages for Vite compatibility

export const requestNotificationPermission = async (studentId?: string): Promise<string | null> => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.register('/nep1/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: "BPemRYEHe6c4Uj7E_oZeIpBHygovvUAVj033y54l64C9txHC5eVyfO-I3_XEhYKmEApVMZ-yLjXH1H-Xx6KNuWY",
      serviceWorkerRegistration: registration
    });

    if (token && studentId) {
      await supabase.from('students').update({
        "fcmToken": token,
        "lastSeen": new Date().toISOString()
      }).eq('id', studentId);
    }
    return token;
  } catch { return null; }
};

// KRİTİK: App.tsx'in beklediği eksik export geri eklendi
export const setupNotificationListener = async (
  callback: (payload: MessagePayload) => void
) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch { }
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