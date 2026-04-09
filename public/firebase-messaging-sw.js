importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

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

// YENİ EKLENEN KISIM: Chrome "no-op" (boş) handler'ı reddettiği için
// ona çalışıyor gibi görünen gerçek bir kalkan veriyoruz. 
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Uygulama çevrimdışı.', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
  }
});
