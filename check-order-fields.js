const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert } = require('firebase-admin/app');
const fs = require('fs');

async function run() {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log('Fetching orders...');
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();

    if (snapshot.empty) {
      console.log('No orders found.');
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('ORDER_INFO:' + JSON.stringify({
          id: doc.id,
          invoiceNumber: data.invoiceNumber || 'MISSING',
          shiprocketOrderId: data.shiprocketOrderId || 'MISSING',
          shiprocketShipmentId: data.shiprocketShipmentId || 'MISSING',
          shiprocketAwb: data.shiprocketAwb || 'MISSING',
          status: data.status
        }));
      });
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
