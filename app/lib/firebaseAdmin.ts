import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let adminApp: ReturnType<typeof initializeApp> | null = null;

function createAdminApp() {  const requiredEnv = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_STORAGE_BUCKET",
  ];

  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase admin env vars: ${missing.join(", ")}`);
  }
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  return initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }
  adminApp = createAdminApp();
  return adminApp;
}

export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app);
}
