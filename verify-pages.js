const fetch = globalThis.fetch || require('node-fetch');
const productName = 'Bot Men Product Display';
const productId = 'zVHKrkEMorlnQSYDFaXI';
(async () => {
  try {
    const menRes = await fetch('http://localhost:3000/men');
    const menHtml = await menRes.text();
    console.log('/men status', menRes.status);
    console.log('/men head', menHtml.slice(0, 1200));
    console.log('/men contains name', menHtml.includes(productName));

    const detailRes = await fetch(`http://localhost:3000/product/${productId}`);
    const detailHtml = await detailRes.text();
    console.log(`/product/${productId} status`, detailRes.status);
    console.log('/product head', detailHtml.slice(0, 1200));
    console.log('/product contains name', detailHtml.includes(productName));
  } catch (err) {
    console.error('error', err);
  }
})();
