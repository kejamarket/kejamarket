// Deployment verification script
const https = require('https');
const http = require('http');

const RENDER_URL = 'https://kejamarket.onrender.com';

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const isJson = res.headers['content-type'] && res.headers['content-type'].includes('application/json');
          const content = isJson ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, content, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, content: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkDeployment() {
  console.log('🚀 Checking KejaMarket deployment on Render...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${RENDER_URL}/api/health`,
      expectedStatus: 200,
      checkContent: (data) => data && (typeof data === 'object' ? data.status === 'online' : data.includes('online'))
    },
    {
      name: 'Main Website',
      url: `${RENDER_URL}/`,
      expectedStatus: 200,
      checkContent: (text) => typeof text === 'string' && text.includes('KejaMarket')
    },
    {
      name: 'Admin Portal Assets',
      url: `${RENDER_URL}/js/admin.js`,
      expectedStatus: 200,
      checkContent: (text) => typeof text === 'string' && text.includes('AdminPortalEngine')
    },
    {
      name: 'Main App Assets',
      url: `${RENDER_URL}/js/app.js`,
      expectedStatus: 200,
      checkContent: (text) => typeof text === 'string' && text.includes('KejaMarketApp')
    },
    {
      name: 'CSS Styles',
      url: `${RENDER_URL}/css/style.css`,
      expectedStatus: 200,
      checkContent: (text) => typeof text === 'string' && text.includes('KejaMarket')
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const response = await makeRequest(test.url);

      if (response.status === test.expectedStatus) {
        if (!test.checkContent || test.checkContent(response.content)) {
          console.log(`✅ ${test.name}: PASSED`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name}: Content check failed`);
          failedTests++;
        }
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failedTests++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 DEPLOYMENT TEST RESULTS:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / tests.length) * 100)}%\n`);

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED! Deployment is successful and healthy.');
    console.log(`🌐 Your application is live at: ${RENDER_URL}`);
  } else if (passedTests > failedTests) {
    console.log('⚠️ Deployment is partially working. Some issues detected.');
  } else {
    console.log('🚨 Deployment has issues. Check Render logs for details.');
  }
}

// Run the check
checkDeployment().catch(console.error);