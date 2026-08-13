const path = require('path');
const fs = require('fs');
// Ensure admin SDK initialized for server environment used by the compiled route
const saPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './al-baaqir-store-firebase-adminsdk-fbsvc-03b1a7a771.json');
const raw = fs.readFileSync(saPath, 'utf8');
const parsed = JSON.parse(raw);
const { initializeApp, cert } = require('firebase-admin/app');
initializeApp({ credential: cert(parsed) });

// Require the compiled Next dev server route
const routePath = path.resolve('.next/dev/server/app/api/products/route.js');
if (!fs.existsSync(routePath)) {
  console.error('Compiled route not found at', routePath);
  process.exit(2);
}
const route = require(routePath);

async function run() {
  const req = {
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => ({ name: 'API Route Test Belt', price: 500, category: 'Belts' }),
    url: 'http://localhost/api/products'
  };

  if (!route.POST) {
    console.error('POST handler not found in route module');
    process.exit(2);
  }

  const res = await route.POST(req);
  // Try to print JSON body if possible
  try {
    const body = await res.json();
    console.log('Route POST response:', body);
  } catch (e) {
    console.log('Route POST returned non-JSON response or no .json():', e && e.message);
  }
}

run().catch(e=>{console.error(e);process.exit(1)});
