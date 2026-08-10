/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');
(async () => {
  try {
    const key = JSON.parse(fs.readFileSync('./al-baaqir-store-firebase-adminsdk-fbsvc-03b1a7a771.json','utf8'));
    const projectId = key.project_id || key.projectId;
    const auth = new GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/datastore'] });
    const client = await auth.getClient();

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/carts/test-user-cart-bot`;

    const body = {
      fields: {
        userId: { stringValue: 'test-user-cart-bot' },
        items: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    id: { stringValue: 'zVHKrkEMorlnQSYDFaXI' },
                    name: { stringValue: 'Bot Men Product Display' },
                    price: { doubleValue: 29.99 },
                    qty: { integerValue: '2' },
                    image: { stringValue: '' },
                    productUrl: { stringValue: '/product/zVHKrkEMorlnQSYDFaXI' },
                  },
                },
              },
            ],
          },
        },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    };

    let res = await client.request({ url, method: 'PATCH', data: body, headers: { 'Content-Type': 'application/json' } });
    console.log('write status', res.status);
    console.log(JSON.stringify(res.data, null, 2));

    res = await client.request({ url, method: 'GET' });
    console.log('read status', res.status);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
