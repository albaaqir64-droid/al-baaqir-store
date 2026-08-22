import { initializeApp, getApps, getApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6zHxPXw5YXAVudfk7wMGDjYiglpsE9ww",
  authDomain: "al-baaqir-store.firebaseapp.com",
  projectId: "al-baaqir-store",
  // Standard bucket is usually project-id.appspot.com,
  // though new projects sometimes use .firebasestorage.app
  storageBucket: "al-baaqir-store.firebasestorage.app",
  messagingSenderId: "806944771261",
  appId: "1:806944771261:web:0897e2e02edc3c0417fbd4",
  measurementId: "G-CZE3JN5695",
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
