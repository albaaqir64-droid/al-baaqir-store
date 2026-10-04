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

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials missing. Using placeholder for build.");
    return { options: {}, name: "[DEFAULT]" };
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
      const service = getAuth(getAdminApp()) as any;
      return service[prop](...args);
    };
  }
});

// --- FIRESTORE PROXY (Synchronous for chaining support) ---
export const adminDb: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    const { getFirestore } = require("firebase-admin/firestore");
    const service = getFirestore(getAdminApp()) as any;
    const val = service[prop];
    return typeof val === 'function' ? val.bind(service) : val;
  }
});

// --- STORAGE PROXY ---
export const adminStorage: any = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    const { getStorage } = require("firebase-admin/storage");
    const service = getStorage(getAdminApp()) as any;
    const val = service[prop];
    return typeof val === 'function' ? val.bind(service) : val;
  }
});

export const FieldValue = new Proxy({} as any, {
  get(_, prop: string | symbol) {
    return (require("firebase-admin/firestore").FieldValue as any)[prop];
  }
});
