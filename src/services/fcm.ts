import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { supabase } from '../config/supabase';

/**
 * FCM Push Notification Service (Modül 2)
 * - İzin iste → Token al → Firestore'a kaydet
 * - Foreground mesaj dinleme
 * - Token yenileme
 */

// Güvenli env erişimi
const getEnvVar = (key: string): string => {
  try {
    const value = import.meta.env[key];
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
};

/**
 * Bildirim izni iste ve FCM token al
 * Token'ı Firestore'a kaydeder
 */
export const requestNotificationPermission = async (studentId?: string): Promise<string | null> => {
  try {
    // Tarayıcı desteği kontrolü
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    try {
      const swUrl = getEnvVar('BASE_URL') + 'firebase-messaging-sw.js';
      const registration = await navigator.serviceWorker.register(swUrl);

      const token = await getToken(messaging, {
        vapidKey: getEnvVar('VITE_FIREBASE_VAPID_KEY'),
        serviceWorkerRegistration: registration
      });

      // Token'ı Supabase (students tablosu) üzerine kaydet
      if (token && studentId) {
        await saveTokenToDatabase(studentId, token);
      }

      return token;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

/**
 * FCM Token'ı Supabase students tablosuna (fcm_token) kaydet
 */
const saveTokenToDatabase = async (studentId: string, token: string) => {
  try {
    // fcmTokens tablosu yerine doğrudan students tablosuna (snake_case)
    await supabase.from('students').update({
      fcm_token: token,
      last_seen: new Date().toISOString()
    }).eq('id', studentId);
  } catch {
    // Token kaydedilemedi — sessiz
  }
};

/**
 * Foreground mesaj dinleyici
 * Uygulama açıkken gelen push mesajlarını yakalar
 */
export const setupNotificationListener = async (
  callback: (payload: MessagePayload) => void
) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      // Foreground'da browser notification göstermiyoruz — Supabase (Uygulama İçi) handle ediyor.
      // SADECE background (Kilit Ekranı) için Firebase tasarlandı (Modül 2).
      
      /* 
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = payload.notification?.title || 'NEP Eğitim';
        const body = payload.notification?.body || 'Yeni bildirim';

        new Notification(title, {
          body,
          icon: `${window.location.origin}${import.meta.env.BASE_URL}nep-logo.png`,
          tag: 'nep-foreground',
        });
      }
      */

      callback(payload);
    });
  } catch {
    // Listener kurulamadı
  }
};

export const sendPushNotification = async (title: string, body: string, userId: string = 'all') => {
  try {
    // Şema: user_id (TEXT), title, body, is_read, created_at
    await supabase.from('fcm_queue').insert([{ 
      user_id: String(userId),
      title: title || 'NEP Operasyon', 
      body: body || '', 
      is_read: false,
      created_at: new Date().toISOString() 
    }]);
  } catch (error) {
    console.warn('FCM queue insertion failed:', error);
  }
};

