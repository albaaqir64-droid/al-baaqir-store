import "server-only";

/**
 * Production-ready Firebase Admin provider for Next.js 16 + Vercel.
 * Fixes ERR_REQUIRE_ESM by using dynamic imports for Auth while
 * maintaining synchronous proxies for Firestore to support chaining.
 */

let app: any;

function initAdminApp() {
  const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
  if (getApps().length > 0) return getApp();

  // Clean environment variables (remove potential quotes and handle newlines)
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").replace(/['"]/g, "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/['"]/g, "").trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").replace(/['"]/g, "").trim();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials missing. Check Vercel Environment Variables.");
    return null;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  } catch (err) {
    console.error("Firebase Admin Initialization Error:", err);
    return null;
  }
}

export const getAdminApp = () => {
  if (!app) app = initAdminApp();
  return app;
};

// --- AUTH PROXY (Dynamic Import to fix ERR_REQUIRE_ESM) ---
export const adminAuth: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    // Return an async function that imports and calls the real method
    return async (...args: any[]) => {
      const { getAuth } = await import("firebase-admin/auth");
      const firebaseApp = getAdminApp();
      if (!firebaseApp) throw new Error("Firebase Admin App not initialized. Check credentials.");
      const service = getAuth(firebaseApp) as any;
      return service[prop](...args);
    };
  }
});

// --- FIRESTORE PROXY (Synchronous for chaining support) ---
export const adminDb: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    const { getFirestore } = require("firebase-admin/firestore");
    const firebaseApp = getAdminApp();
    if (!firebaseApp) return null;
    const service = getFirestore(firebaseApp) as any;
    const val = service[prop];
    return typeof val === 'function' ? val.bind(service) : val;
  }
});

// --- STORAGE PROXY ---
export const adminStorage: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    const { getStorage } = require("firebase-admin/storage");
    const firebaseApp = getAdminApp();
    if (!firebaseApp) return null;
    const service = getStorage(firebaseApp) as any;
    const val = service[prop];
    return typeof val === 'function' ? val.bind(service) : val;
  }
});

export const FieldValue = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    const { FieldValue } = require("firebase-admin/firestore");
    return FieldValue[prop];
  }
});
