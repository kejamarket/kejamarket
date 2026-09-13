// Quick test script to verify Render deployment is working
const https = require('https');

function testEndpoint(url, name) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const count = json.count || json.total || 0;
          console.log(`✓ ${name}: ${count} items (Status: ${res.statusCode})`);
          resolve({ success: true, count });
        } catch (e) {
          console.log(`✗ ${name}: Failed to parse JSON`);
          resolve({ success: false, count: 0 });
        }
      });
    }).on('error', (err) => {
      console.log(`✗ ${name}: ${err.message}`);
      resolve({ success: false, count: 0 });
    });
  });
}

async function testAll() {
  console.log('🔍 Testing KejaMarket Live API...\n');
  
  const results = await Promise.all([
    testEndpoint('https://kejamarket.co.ke/api/properties', 'Properties'),
    testEndpoint('https://kejamarket.co.ke/api/services', 'Services'),
    testEndpoint('https://kejamarket.co.ke/api/marketplace', 'Marketplace')
  ]);
  
  console.log('\n📊 Summary:');
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);
  
  if (totalCount > 0) {
    console.log(`✅ Deployment successful! ${totalCount} total items found.`);
  } else {
    console.log('❌ Deployment not updated yet. All endpoints return 0 items.');
    console.log('👉 Update DATABASE_URL in Render dashboard and redeploy.');
  }
}

testAll();
