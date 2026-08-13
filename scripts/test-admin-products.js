const path = require('path');
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const saPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './al-baaqir-store-firebase-adminsdk-fbsvc-03b1a7a771.json');
const raw = fs.readFileSync(saPath, 'utf8');
const parsed = JSON.parse(raw);
const app = initializeApp({ credential: cert(parsed) });
const db = getFirestore(app);

async function main() {
  const docRef = db.collection('products').doc();
  const product = {
    name: 'Admin Test Belt ' + Date.now(),
    category: 'Belts',
    price: 2100,
    stock: 7,
    mainImage: 'https://storage.googleapis.com/al-baaqir-store.firebasestorage.app/products/test/main.png',
    images: ['https://storage.googleapis.com/al-baaqir-store.firebasestorage.app/products/test/gallery1.png'],
    description: 'Admin workflow test product',
    discountPercent: 10,
    active: true,
    featured: false,
    slug: 'admin-test-belt',
    createdAt: new Date(),
    lastUpdated: new Date(),
  };
  await docRef.set(product);
  console.log('Created product id:', docRef.id);

  const createdDoc = await db.collection('products').doc(docRef.id).get();
  console.log('Read back product exists:', createdDoc.exists);
  if (!createdDoc.exists) process.exit(1);

  await db.collection('products').doc(docRef.id).update({ price: 2200, description: 'Updated admin workflow test product' });
  const updatedDoc = await db.collection('products').doc(docRef.id).get();
  console.log('Updated price:', updatedDoc.data().price);

  await db.collection('products').doc(docRef.id).delete();
  const deletedDoc = await db.collection('products').doc(docRef.id).get();
  console.log('Deleted exists:', deletedDoc.exists);
}

main().catch((e) => { console.error(e); process.exit(1); });
