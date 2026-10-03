import "server-only";

/**
 * Solid Firebase Admin provider for Next.js 16 + Vercel.
 * Uses lazy loading and proxies to prevent ESM/CJS conflicts during build
 * and to ensure auth modules (which pull in jose/jwks-rsa) are only loaded
 * when actually needed.
 */

let app: any;

function initAdminApp() {
  const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
  if (getApps().length > 0) return getApp();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin environment variables are missing. Using dummy app for build.");
    return {
      options: {},
      name: "[DEFAULT]",
      automaticResourceManagement: false
    };
  }

  try {
    // Handle both literal \n and actual newlines, and strip accidental quotes
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
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    return null;
  }
}

export const getAdminApp = () => {
  if (!app) app = initAdminApp();
  return app;
};

// Lazy service getters
export const getAdminDb = () => require("firebase-admin/firestore").getFirestore(getAdminApp());
export const getAdminAuth = () => require("firebase-admin/auth").getAuth(getAdminApp());
export const getAdminStorage = () => require("firebase-admin/storage").getStorage(getAdminApp());

// Proxies to maintain synchronous-style access without top-level loading
export const adminDb: any = new Proxy({} as any, {
  get(_, prop) {
    const service = getAdminDb();
    const value = service[prop];
    return typeof value === 'function' ? value.bind(service) : value;
  }
});

export const adminAuth: any = new Proxy({} as any, {
  get(_, prop) {
    const service = getAdminAuth();
    const value = service[prop];
    return typeof value === 'function' ? value.bind(service) : value;
  }
});

export const adminStorage: any = new Proxy({} as any, {
  get(_, prop) {
    const service = getAdminStorage();
    const value = service[prop];
    return typeof value === 'function' ? value.bind(service) : value;
  }
});

// Static properties that might be needed (like FieldValue)
export const FieldValue = new Proxy({} as any, {
  get(_, prop) {
    return require("firebase-admin/firestore").FieldValue[prop];
  }
});
