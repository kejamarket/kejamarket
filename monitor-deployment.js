// Continuous deployment monitoring
const fetch = require('node-fetch');

const RENDER_URL = 'https://kejamarket.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds

let checks = 0;
let successes = 0;
let failures = 0;

async function checkHealth() {
  checks++;
  console.log(`\n🔍 Health Check #${checks} - ${new Date().toLocaleTimeString()}`);
  
  try {
    const response = await fetch(`${RENDER_URL}/api/health`, {
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      successes++;
      console.log(`✅ Status: ${data.status} | Uptime: ${Math.round((successes/checks)*100)}%`);
      console.log(`📊 M-Pesa: ${data.mpesaEnvironment} | Daraja: ${data.hasDarajaCredentials ? 'Active' : 'Sandbox'}`);
    } else {
      failures++;
      console.log(`❌ HTTP ${response.status} | Uptime: ${Math.round((successes/checks)*100)}%`);
    }
  } catch (error) {
    failures++;
    console.log(`🚨 Connection failed: ${error.message} | Uptime: ${Math.round((successes/checks)*100)}%`);
  }
}

console.log('🚀 Starting KejaMarket deployment monitoring...');
console.log(`📡 Monitoring: ${RENDER_URL}`);
console.log('Press Ctrl+C to stop monitoring\n');

// Initial check
checkHealth();

// Set up recurring checks
const interval = setInterval(checkHealth, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 FINAL MONITORING REPORT:');
  console.log(`Total Checks: ${checks}`);
  console.log(`Successful: ${successes}`);
  console.log(`Failed: ${failures}`);
  console.log(`Overall Uptime: ${Math.round((successes/checks)*100)}%`);
  console.log('\n👋 Monitoring stopped.');
  clearInterval(interval);
  process.exit(0);
});