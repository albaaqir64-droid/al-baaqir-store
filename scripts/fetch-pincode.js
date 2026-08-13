const https = require('https');
https.get('https://api.postalpincode.in/pincode/110025', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error fetching pincode:', err);
});
