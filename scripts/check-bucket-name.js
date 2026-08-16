const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');

async function run() {
  try {
    const sa = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    const app = initializeApp({
      credential: cert(sa),
      projectId: sa.project_id
    });
    const storage = getStorage(app);
    const bucket = storage.bucket();
    console.log('Detected Default Bucket Name:', bucket.name);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
run();
