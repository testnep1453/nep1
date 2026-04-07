importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Bu dosya build sırasında Vite plugin ile ENV değerleri inject edilmelidir.
// GitHub Actions'da VITE_FIREBASE_* env'leri secret olarak ayarlıdır.
// Aşağıdaki placeholder'lar build pipeline'da replaceAll ile doldurulur.
firebase.initializeApp({
  apiKey: "__VITE_FIREBASE_API_KEY__",
  authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
  projectId: "__VITE_FIREBASE_PROJECT_ID__",
  storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__VITE_FIREBASE_APP_ID__"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'NEP Eğitim';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildirim var!',
    icon: '/nep1/nep-logo.png',
    badge: '/nep1/nep-logo.png',
    tag: 'nep-notification',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklama — uygulamaya yönlendirme
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/nep1') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/nep1/');
    })
  );
});
