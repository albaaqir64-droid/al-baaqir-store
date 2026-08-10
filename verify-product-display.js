const fetch = globalThis.fetch || require('node-fetch');
const productName = 'Bot Men Product Display';
const body = {
  name: productName,
  category: 'Men',
  price: 29.99,
  stock: 10,
  description: 'Verify product display in Men category and detail page.',
  mainImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  images: [],
  featured: true,
};
(async () => {
  try {
    const resAll = await fetch('http://localhost:3000/api/products');
    const productsAll = await resAll.json();
    console.log('api/products count=', Array.isArray(productsAll) ? productsAll.length : 'err');

    const resPost = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const created = await resPost.json();
    console.log('created status=', resPost.status);
    console.log(JSON.stringify(created, null, 2));
    if (!created?.id) {
      return;
    }

    const resFiltered = await fetch('http://localhost:3000/api/products?category=Men');
    const productsMen = await resFiltered.text();
    console.log('/api/products?category=Men response length=', productsMen.length);
    console.log('contains name=', productsMen.includes(productName));

    const menPage = await fetch('http://localhost:3000/men');
    const menHtml = await menPage.text();
    console.log('/men page status=', menPage.status);
    console.log('/men page contains name=', menHtml.includes(productName));

    const detailPage = await fetch(`http://localhost:3000/product/${created.id}`);
    const detailHtml = await detailPage.text();
    console.log('/product/<id> status=', detailPage.status);
    console.log('/product/<id> contains name=', detailHtml.includes(productName));
  } catch (err) {
    console.error('error', err);
  }
})();
