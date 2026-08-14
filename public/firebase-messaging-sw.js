/* Firebase Cloud Messaging service worker. Firebase client settings are public. */
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD6zHxPXw5YXAVudfk7wMGDjYiglpsE9ww",
  authDomain: "al-baaqir-store.firebaseapp.com",
  projectId: "al-baaqir-store",
  storageBucket: "al-baaqir-store.firebasestorage.app",
  messagingSenderId: "806944771261",
  appId: "1:806944771261:web:0897e2e02edc3c0417fbd4",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || "Al Baaqir order update", {
    body: notification.body || "Your order status has been updated.",
    data: { link: payload.fcmOptions?.link || "/my-orders" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.link || "/my-orders"));
});
