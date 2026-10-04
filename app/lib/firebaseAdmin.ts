import "server-only";
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Optimized Firebase Admin provider for Next.js 16.
 * Standard imports are used as next.config.ts now handles bundling.
 */

function initAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials missing. Using placeholder for build.");
    return { options: {}, name: "[DEFAULT]" } as any;
  }

  const formattedKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/^['"]|['"]$/g, "");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedKey,
    }),
    storageBucket: `${projectId}.firebasestorage.app`,
  });
}

// Exports expected by the project
export const getAdminApp = () => {
  return initAdminApp();
};

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

export { FieldValue };
