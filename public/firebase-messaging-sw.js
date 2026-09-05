// Firebase Cloud Messaging Service Worker for KRISHISETU
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBOta9N0SjHZyXAFuyCPoJBnn-RchTrCRI",
  authDomain: "kisaan-setu-7d74b.firebaseapp.com",
  projectId: "kisaan-setu-7d74b",
  storageBucket: "kisaan-setu-7d74b.firebasestorage.app",
  messagingSenderId: "545121595157",
  appId: "1:545121595157:web:731a37b2ea97b5882ec31c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'KRISHISETU Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'आपको एक नया संदेश मिला है।',
    icon: '/assets/icons/icon-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
