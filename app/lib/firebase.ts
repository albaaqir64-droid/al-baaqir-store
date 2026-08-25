import { initializeApp, getApps, getApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Default config as fallback
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD6zHxPXw5YXAVudfk7wMGDjYiglpsE9ww",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "al-baaqir-store.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "al-baaqir-store",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "al-baaqir-store.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "806944771261",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:806944771261:web:0897e2e02edc3c0417fbd4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CZE3JN5695",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Firestore's default WebChannel stream is blocked by some browser proxies and
// security software, which leaves the browser SDK permanently "offline" even
// though HTTPS access to the Firebase project is available. Long polling uses
// the same authenticated Firestore endpoint without relying on that stream.
// Keep the Node/server path on getFirestore: this transport option is browser-only.
export const db = typeof window === "undefined"
  ? getFirestore(app)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });

export const storage = getStorage(app);
export const auth = getAuth(app);
export { GoogleAuthProvider };

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
