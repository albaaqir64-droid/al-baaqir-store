const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  try {
    const sa = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(sa)
      });
    }

    // Default bucket
    const bucket = admin.storage().bucket();
    console.log('Default Bucket:', bucket.name);

    // List all buckets
    const [buckets] = await admin.storage().getBuckets();
    console.log('All Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));

  } catch (e) {
    console.error('Error:', e);
  }
}
run();
