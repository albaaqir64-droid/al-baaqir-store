const { getStorage } = require('firebase-admin/storage');
const { initializeApp, cert } = require('firebase-admin/app');
const fs = require('fs');

async function run() {
  try {
    const sa = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    const app = initializeApp({
      credential: cert(sa)
    });

    const storage = getStorage(app);
    // In new SDK, getBuckets might be on the default bucket or you use storage.bucket().getFiles() etc
    // Actually storage.getBuckets() is correct for the storage instance in Admin SDK.
    // Let's try another way to see the project's storage setup.
    console.log('Project ID:', sa.project_id);

    // Try to get the default bucket
    try {
        const bucket = storage.bucket(`${sa.project_id}.appspot.com`);
        const [exists] = await bucket.exists();
        console.log(`${sa.project_id}.appspot.com exists:`, exists);
    } catch(e) {
        console.log(`${sa.project_id}.appspot.com check failed`);
    }

    try {
        const bucket2 = storage.bucket(`${sa.project_id}.firebasestorage.app`);
        const [exists2] = await bucket2.exists();
        console.log(`${sa.project_id}.firebasestorage.app exists:`, exists2);
    } catch(e) {
        console.log(`${sa.project_id}.firebasestorage.app check failed`);
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

run();
