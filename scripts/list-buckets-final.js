const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  try {
    const sa = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
    }

    const storage = admin.storage();
    const [buckets] = await storage.getBuckets();
    console.log('Available Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
