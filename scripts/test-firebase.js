const path = require('path');
const fs = require('fs');
async function main() {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './al-baaqir-store-firebase-adminsdk-fbsvc-03b1a7a771.json';
  const resolved = path.resolve(process.cwd(), saPath);
  if (!fs.existsSync(resolved)) {
    console.error('Service account file not found at', resolved);
    process.exit(2);
  }
  const raw = fs.readFileSync(resolved, 'utf8');
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { console.error('Invalid JSON', e); process.exit(2); }

  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const { getStorage } = require('firebase-admin/storage');

  const app = initializeApp({ credential: cert(parsed), storageBucket: parsed.storageBucket || `${parsed.project_id}.firebasestorage.app` });
  console.log('Initialized Firebase Admin app:', !!app.name);

  const db = getFirestore(app);
  const storage = getStorage(app);

  try {
    const collections = await db.listCollections();
    console.log('Collections count:', collections.length);
  } catch (err) {
    console.error('Error listing collections:', err && err.message || err);
  }

  try {
    const bucket = storage.bucket();
    console.log('Storage bucket name:', bucket.name);
  } catch (err) {
    console.error('Error accessing storage:', err && err.message || err);
  }
}

main().catch((e)=>{console.error(e);process.exit(1);});
