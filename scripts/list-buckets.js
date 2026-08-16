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
    // In admin SDK v11+, getBuckets is on the storage instance
    const [buckets] = await storage.getBuckets();
    console.log('Available Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));
    process.exit(0);
  } catch (e) {
    console.error('FAILED TO LIST BUCKETS:', e.message);
    process.exit(1);
  }
}
run();
