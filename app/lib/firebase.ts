import { initializeApp, getApps, getApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6zHxPXw5YXAVudfk7wMGDjYiglpsE9ww",
  authDomain: "al-baaqir-store.firebaseapp.com",
  projectId: "al-baaqir-store",
  storageBucket: "al-baaqir-store.firebasestorage.app",
  messagingSenderId: "806944771261",
  appId: "1:806944771261:web:0897e2e02edc3c0417fbd4",
  measurementId: "G-CZE3JN5695",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
