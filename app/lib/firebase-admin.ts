import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

/**
 * Robust Firebase Admin initialization that handles:
 * 1. Build-time environment (where env vars might be missing)
 * 2. Vercel deployment (escaped newlines in private keys)
 * 3. Hot-reloading (preventing multiple app initialization)
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Build-time safety: If credentials are missing, return a dummy proxy
  // to prevent top-level crashes during 'next build' static analysis.
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Firebase Admin credentials missing. Ensure environment variables are set.');
    }
    return {} as App;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${projectId}.firebasestorage.app`
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    return {} as App;
  }
}

// Export singletons that are safe to use across the app.
// Note: In Next.js 15+, using getters is often safer to ensure
// initialization happens in the correct execution context.
export const adminDb = getFirestore(getAdminApp());
export const adminAuth = getAuth(getAdminApp());
export const adminStorage = getStorage(getAdminApp());
