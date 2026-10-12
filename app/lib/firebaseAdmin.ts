import "server-only";

/**
 * Firebase Admin provider for server-side Next.js code.
 * Supports a local service-account JSON path and environment credentials.
 */

let app: any;

function initAdminApp() {
  const { initializeApp, getApps, getApp, cert } = require("firebase-admin/app");
  const fs = require("node:fs");
  const path = require("node:path");
  if (getApps().length > 0) return getApp();

  try {
    let credential;
    let projectId = "";
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

    if (serviceAccountPath) {
      try {
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
          const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, ""));
          const serviceAccountProjectId = typeof serviceAccount.project_id === "string"
            ? serviceAccount.project_id.trim()
            : "";

          if (serviceAccountProjectId) {
            credential = cert(serviceAccount);
            projectId = serviceAccountProjectId;
          }
        }
      } catch {
        // A local-only or unreadable file must not prevent env-based initialization.
      }
    }

    if (!credential) {
      projectId = (process.env.FIREBASE_PROJECT_ID || "").replace(/[\'\"]/g, "").trim();
      const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/[\'\"]/g, "").trim();
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
        .replace(/\\n/g, "\n")
        .trim()
        .replace(/^[\'"]|[\'"]$/g, "");

      if (!projectId || !clientEmail || !privateKey) {
        console.warn("Firebase Admin credentials missing. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
        return null;
      }

      credential = cert({ projectId, clientEmail, privateKey });
    }

    if (!projectId) throw new Error("Firebase service account is missing its project ID.");
    return initializeApp({ projectId, credential, storageBucket: `${projectId}.firebasestorage.app` });
  } catch (error) {
    // Keep the underlying SDK message in server logs so credential and project
    // configuration problems can be diagnosed without exposing secrets.
    const reason = error instanceof Error ? error.message : String(error);
    console.error("Firebase Admin initialization failed:", reason);
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
    if (!firebaseApp) {
      throw new Error("Firebase Admin is unavailable: initialization failed. Check the preceding server log for the cause.");
    }
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
