import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

let adminApp: ReturnType<typeof initializeApp> | null = null;

function tryLoadServiceAccountFromFile() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const defaultPath = path.join(process.cwd(), "service-account.json");
  const candidate = configuredPath || defaultPath;
  try {
    if (!fs.existsSync(candidate)) return false;
    const raw = fs.readFileSync(candidate, { encoding: "utf8" });
    const parsed = JSON.parse(raw);
    // Only set env vars if they are not already provided
    const projectId = parsed.project_id || parsed.projectId;
    process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || projectId;
    process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || parsed.private_key;
    process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || parsed.client_email || parsed.clientEmail;
    // storage bucket may not be present in the service account; leave existing or infer from the project id
    process.env.FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || parsed.storageBucket || parsed.bucket || (projectId ? `${projectId}.firebasestorage.app` : undefined);
    return true;
  } catch (err) {
    // do not expose private key or file contents in logs
    console.error("Could not load service account JSON:", (err && (err as Error).message) || String(err));
    return false;
  }
}

function createAdminApp() {
  // attempt to load a local service-account JSON file if present
  tryLoadServiceAccountFromFile();

  const requiredEnv = [
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
