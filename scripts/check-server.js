const http = require('http');
const options = { hostname: '127.0.0.1', port: 3000, path: '/belts', method: 'GET' };
const req = http.request(options, (res) => {
  console.log('status', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('body', body.slice(0, 500));
  });
});
req.on('error', (err) => console.error('error', err.message));
req.end();
