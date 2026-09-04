const http = require('http');

const payload = {
  awb: "AWB123456789",
  order_id: "ALB-99064907-182", // Ensure this exists in your DB or use a real one
  shipment_id: "SHP123456",
  current_status: "DELIVERED",
  current_status_id: "7",
  courier_name: "Delhivery",
  timestamp: new Date().toISOString()
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/shiprocket/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify(payload));
req.end();
