const http = require('http');

const HOST = 'localhost';
const PORT = 3000; // Active Next dev server port

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: HOST, port: PORT, path, method, headers };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await request('GET', '/api/products');
      if (res.statusCode && res.statusCode < 500) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  console.log('Waiting for Next dev server on', `http://${HOST}:${PORT}`);
  const ready = await waitForServer(30000);
  if (!ready) {
    console.error('Server not ready');
    process.exit(2);
  }
  console.log('Server ready — posting product');

  const product = {
    name: 'E2E Test Belt ' + Date.now(),
    category: 'Belts',
    price: 1234,
    stock: 5,
    mainImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
    images: [],
    description: 'E2E test product'
  };

  const postRes = await request('POST', '/api/products', JSON.stringify(product), { 'Content-Type': 'application/json' });
  console.log('POST status:', postRes.statusCode);
  try { console.log('POST body:', postRes.body); } catch (e) {}

  if (!postRes.body || postRes.statusCode >= 400) {
    console.error('POST failed');
    process.exit(3);
  }

  // confirm via API GET
  const getRes = await request('GET', '/api/products');
  if (getRes.statusCode !== 200) {
    console.error('GET /api/products failed:', getRes.statusCode);
    process.exit(4);
  }
  const list = JSON.parse(getRes.body || '[]');
  const found = list.find((p) => p.name && p.name.indexOf('E2E Test Belt') === 0);
  console.log('Found in GET /api/products:', !!found);
  if (!found) {
    console.error('Created product not found in GET results');
    process.exit(5);
  }

  // check category page HTML
  const pageRes = await request('GET', '/belts');
  if (pageRes.statusCode !== 200) {
    console.error('/belts returned', pageRes.statusCode);
    process.exit(6);
  }
  const html = pageRes.body || '';
  if (html.indexOf(found.name) === -1) {
    console.error('Product not present on /belts page HTML');
    process.exit(7);
  }

  console.log('E2E success — product created, appears in GET and on /belts');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(99); });
