const path = require('path');
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './al-baaqir-store-firebase-adminsdk-fbsvc-03b1a7a771.json';
  const resolved = path.resolve(process.cwd(), saPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const parsed = JSON.parse(raw);

  const app = initializeApp({ credential: cert(parsed) });
  const db = getFirestore(app);

  const docRef = db.collection('products').doc();
  const product = {
    name: 'Test Belt from script',
    category: 'Belts',
    price: 1999,
    stock: 10,
    mainImage: '',
    images: [],
    galleryImages: [],
    description: 'Automated test product',
    discountPercent: 0,
    active: true,
    featured: false,
    slug: 'test-belt-script',
    createdAt: new Date(),
    lastUpdated: new Date(),
  };

  await docRef.set(product);
  console.log('Created product id:', docRef.id);

  const snapshot = await db.collection('products').where('category', '==', 'Belts').get();
  console.log('Products with category Belts:', snapshot.size);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, data.name, data.category);
  });
}

main().catch(e=>{console.error(e);process.exit(1)});
