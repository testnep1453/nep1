import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { supabase } from '../config/supabase';

/**
 * FCM Push Notification Service (Modül 2)
 * - İzin iste → Token al → Firestore'a kaydet
 * - Foreground mesaj dinleme
 * - Token yenileme
 */

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
      const swUrl = import.meta.env.BASE_URL + 'firebase-messaging-sw.js';
      const registration = await navigator.serviceWorker.register(swUrl);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      // Token'ı Firestore'a kaydet
      if (token && studentId) {
        await saveTokenToFirestore(studentId, token);
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
 * FCM Token'ı Firestore'a kaydet
 */
const saveTokenToFirestore = async (studentId: string, token: string) => {
  try {
    await supabase.from('fcmTokens').upsert({
      id: studentId,
      token,
      updated_at: new Date().toISOString(),
      platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
    });
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

/**
 * FCM Push gönderme (Sistem tetikleyicisi)
 * Supabase fcm_queue tablosuna push isteği atar, veya direkt fonksiyon çağırır.
 */
export const sendPushNotification = async (title: string, body: string) => {
  try {
    // Bu tablo/kanal üzerinden backend (Edge function veya benzeri) FCM atabilir.
    await supabase.from('fcm_queue').insert([{ 
      title, 
      body, 
      created_at: new Date().toISOString() 
    }]);
  } catch {
    // sessiz
  }
};
