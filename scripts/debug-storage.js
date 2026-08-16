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
    console.log('Attempting to list buckets...');
    const [buckets] = await storage.getBuckets();
    console.log('Found buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));

    const projectId = sa.project_id;
    console.log('Project ID from SA:', projectId);

    // Check common bucket names
    const bucketsToCheck = [
      `${projectId}.firebasestorage.app`,
      `${projectId}.appspot.com`,
      `staging.${projectId}.appspot.com`
    ];

    for (const bucketName of bucketsToCheck) {
      const b = storage.bucket(bucketName);
      try {
        const [exists] = await b.exists();
        console.log(`Bucket ${bucketName} exists: ${exists}`);
      } catch (e) {
        console.log(`Bucket ${bucketName} check failed: ${e.message}`);
      }
    }

  } catch (e) {
    console.error('Debug script failed:', e);
  }
}

run();
