"use client";

import { arrayUnion, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { db } from "./firebase";
import { getCurrentUserId } from "./auth";

export async function requestOrderStatusNotifications(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !(await isSupported())) return false;
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return false;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const userId = getCurrentUserId();
  if (!vapidKey || !userId || !("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return false;
    await setDoc(doc(db, "users", userId), { fcmTokens: arrayUnion(token), fcmTokenUpdatedAt: serverTimestamp() }, { merge: true });
    onMessage(messaging, (payload) => {
      if (payload.notification?.title) new Notification(payload.notification.title, { body: payload.notification.body });
    });
    return true;
  } catch (error) {
    console.warn("Push notification registration was unavailable:", error);
    return false;
  }
}
