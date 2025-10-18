// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAIrfZQnuQM/Z2XEzfPsaqHLK_Idsk",
  authDomain: "soulsync-a4c9c.firebaseapp.com",
  projectId: "soulsync-a4c9c",
  storageBucket: "soulsync-a4c9c.firebasestorage.app",
  messagingSenderId: "597853897409",
  appId: "1:597853897409:web:9e4579576efd4af048320"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const notificationTitle = payload.notification?.title || 'SoulSync';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.dateId || 'soulsync-notification',
    requireInteraction: true,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received', event);

  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});
