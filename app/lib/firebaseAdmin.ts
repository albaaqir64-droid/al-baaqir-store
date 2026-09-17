import "server-only";

import { initializeApp, cert, getApps, getApp, App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function createAdminApp(): App | null {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const formattedPrivateKey = privateKey.includes("\\n")
    ? privateKey.replace(/\\n/g, "\n")
    : privateKey;

  try {
    return initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      } as any),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    return null;
  }
}

export function getAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  const app = createAdminApp();
  if (!app) {
    // During build, we return a dummy to satisfy TypeScript.
    // At runtime, this will throw if used without env vars.
    return {} as App;
  }
  return app;
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
