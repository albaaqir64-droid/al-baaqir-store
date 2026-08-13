const base = 'http://127.0.0.1:3000';
(async () => {
  try {
    const res = await fetch(`${base}/api/products`);
    console.log('GET /api/products status', res.status);
    const data = await res.json();
    console.log('GET /api/products count', Array.isArray(data) ? data.length : typeof data);

    const payload = {
      name: `Automated Belt Test ${Date.now()}`,
      category: 'Belts',
      price: 220,
      stock: 4,
      mainImage: '',
      images: [],
      description: 'Automated POST test for Belts category',
      discountPercent: 0,
      active: true,
      featured: false,
    };

    const res2 = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('POST /api/products status', res2.status);
    const created = await res2.json();
    console.log('POST response', created);

    const res3 = await fetch(`${base}/api/products?category=Belts`);
    console.log('GET /api/products?category=Belts status', res3.status);
    const filtered = await res3.json();
    console.log('Filtered Belts count', Array.isArray(filtered) ? filtered.filter((p) => p.category === 'Belts').length : filtered);
    console.log('Created product category exact?', created?.category === 'Belts');

    const res4 = await fetch(`${base}/belts`);
    console.log('/belts status', res4.status);
    const html = await res4.text();
    console.log('/belts includes product name?', html.includes(payload.name));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
