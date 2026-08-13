const http = require('http');
const payload = JSON.stringify({
  name: `API Created Product ${Date.now()}`,
  category: 'Belts',
  price: 123,
  stock: 5,
  mainImage: '',
  images: [],
  description: 'Created via API to bypass flaky UI create',
  discountPercent: 0,
  active: true,
  featured: false,
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.parse(data)); } catch(e) { console.log(data); }
  });
});

req.on('error', (e) => { console.error('ERROR', e.message); });
req.write(payload);
req.end();
