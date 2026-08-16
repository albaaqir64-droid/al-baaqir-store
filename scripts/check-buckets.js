const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('service-account.json not found');
      return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const storage = admin.storage();
    // In node SDK it's storage.bucket() to get default, or getBuckets() on the storage object
    // Wait, getBuckets is on the storage instance.
    const [buckets] = await admin.storage().getBuckets();

    console.log('--- Firebase Storage Buckets Found ---');
    buckets.forEach(b => {
      console.log(`Bucket Name: ${b.name}`);
    });
    console.log('-------------------------------');

    const projectId = serviceAccount.project_id;
    console.log(`Project ID: ${projectId}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
