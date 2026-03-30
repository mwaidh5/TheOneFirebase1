// Firebase Cloud Messaging Service Worker
// Required by FCM to receive background push notifications.
// This file MUST be at the root of your public directory.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmKs7RNGNKvtVG-tT7n7QCf1ZpbFXBxD8",
  authDomain: "theonefirebase1-42441499-db7a8.firebaseapp.com",
  projectId: "theonefirebase1-42441499-db7a8",
  storageBucket: "theonefirebase1-42441499-db7a8.firebasestorage.app",
  messagingSenderId: "531868004786",
  appId: "1:531868004786:web:99f2f7295d11846fb834ab"
});

const messaging = firebase.messaging();

// Handle background messages (when tab is not active)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'The One Training', {
    body: body || '',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: payload.data?.url ? [{ action: 'open', title: 'View' }] : []
  });
});

// Handle notification click → open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
