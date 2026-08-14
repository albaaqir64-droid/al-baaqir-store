import "server-only";

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

let adminApp: ReturnType<typeof initializeApp> | null = null;

type ServiceAccountJson = Partial<ServiceAccount> & {
  project_id?: string;
  private_key?: string;
  client_email?: string;
  storageBucket?: string;
};

function resolveServiceAccountPath() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!configuredPath) return null;
  return path.resolve(process.cwd(), configuredPath);
}

function loadServiceAccountFromFile(): ServiceAccountJson | null {
  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath) return null;

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Firebase service account file not found: ${serviceAccountPath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(serviceAccountPath, "utf8");
    return JSON.parse(raw) as ServiceAccountJson;
  } catch (err) {
    console.error("Could not parse Firebase service account JSON:", (err && (err as Error).message) || String(err));
    return null;
  }
}

function applyServiceAccountToEnv(parsed: ServiceAccountJson | null) {
  if (!parsed) return;
  try {
    const projectId = parsed.project_id || parsed.projectId;
    if (projectId && !process.env.FIREBASE_PROJECT_ID) {
      process.env.FIREBASE_PROJECT_ID = String(projectId);
    }
    if (parsed.private_key && !process.env.FIREBASE_PRIVATE_KEY) {
      process.env.FIREBASE_PRIVATE_KEY = String(parsed.private_key);
    }
    if (parsed.client_email && !process.env.FIREBASE_CLIENT_EMAIL) {
      process.env.FIREBASE_CLIENT_EMAIL = String(parsed.client_email);
    }
    const bucket = parsed.storageBucket || parsed.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : undefined);
    if (bucket && !process.env.FIREBASE_STORAGE_BUCKET) {
      process.env.FIREBASE_STORAGE_BUCKET = String(bucket);
    }
  } catch (e) {
    // don't crash here; best-effort only
  }
}

function createServiceAccountFromEnv(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    return null;
  }

  return {
    projectId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    clientEmail,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  } as ServiceAccount;
}

function getStorageBucket(serviceAccount: ServiceAccountJson | null): string {
  const explicitBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (explicitBucket) {
    return explicitBucket;
  }

  const bucketFromServiceAccount = serviceAccount?.storageBucket;
  if (bucketFromServiceAccount) {
    return bucketFromServiceAccount;
  }

  const projectId = serviceAccount?.project_id || serviceAccount?.projectId;
  if (projectId) {
    return `${projectId}.firebasestorage.app`;
  }

  throw new Error("Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET or include storageBucket / project_id in the service account JSON.");
}

function createAdminApp() {
  const serviceAccountFromFile = loadServiceAccountFromFile();
  // If a service account JSON is present, populate server-side env vars so
  // other server modules that expect env vars will see them (keeps creds server-side).
  if (serviceAccountFromFile) {
    applyServiceAccountToEnv(serviceAccountFromFile);
  }
  const serviceAccount = serviceAccountFromFile || createServiceAccountFromEnv();

  if (!serviceAccount) {
    const filePath = resolveServiceAccountPath();
    if (filePath) {
      throw new Error(`Missing Firebase admin credentials. Service account path is set to ${filePath}, but the file could not be loaded.`);
    }
    throw new Error(
      "Missing Firebase admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH to a valid service account JSON file, or provide FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL as server-side environment variables."
    );
  }

  const storageBucket = getStorageBucket(serviceAccountFromFile || serviceAccount);

  return initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket,
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
