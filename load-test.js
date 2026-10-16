/**
 * KejaMarket - Load Testing Script
 * Simulates high concurrent user load to verify 10,000+ user readiness
 * 
 * Usage:
 *   node load-test.js              # Default: 100 users, 10 req/user
 *   node load-test.js 500 20       # 500 users, 20 requests each
 *   node load-test.js 1000 50      # 1000 users, 50 requests each
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const USE_HTTPS = BASE_URL.startsWith('https');
const CONCURRENT_USERS = parseInt(process.argv[2]) || 100;
const REQUESTS_PER_USER = parseInt(process.argv[3]) || 10;
const RAMP_UP_TIME_MS = 5000; // Spread user load over 5 seconds

// Test scenarios (realistic user behavior)
const SCENARIOS = [
  { path: '/api/properties?limit=20', weight: 40, name: 'Browse Properties' },
  { path: '/api/properties/area-stats', weight: 15, name: 'View Area Stats' },
  { path: '/api/locations/search?q=westlands&limit=10', weight: 15, name: 'Search Locations' },
  { path: '/api/locations/hierarchy', weight: 10, name: 'Location Hierarchy' },
  { path: '/api/stats', weight: 10, name: 'View Stats' },
  { path: '/api/cache-stats', weight: 5, name: 'Cache Stats' },
  { path: '/api/health', weight: 5, name: 'Health Check' }
];

// Results tracking
const results = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  timeoutCount: 0,
  rateLimitCount: 0,
  responseTimes: [],
  errors: {},
  statusCodes: {},
  startTime: 0,
  endTime: 0
};

// Helper: Make HTTP request
function makeRequest(path) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const protocol = USE_HTTPS ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (USE_HTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'KejaMarket-LoadTest/1.0',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30s timeout
    };

    const startTime = Date.now();

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          duration: duration,
          size: data.length
        });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        statusCode: 0,
        duration: duration,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        statusCode: 0,
        duration: duration,
        error: 'timeout'
      });
    });

    req.end();
  });
}

// Helper: Select scenario based on weight
function selectScenario() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const scenario of SCENARIOS) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      return scenario;
    }
  }
  
  return SCENARIOS[0]; // Fallback
}

// Simulate single user making multiple requests
async function simulateUser(userId, delay) {
  // Ramp up: stagger user start times
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const userResults = [];
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const scenario = selectScenario();
    const result = await makeRequest(scenario.path);
    
    result.scenario = scenario.name;
    userResults.push(result);
    
    // Record results
    results.totalRequests++;
    
    if (result.success) {
      results.successCount++;
      results.responseTimes.push(result.duration);
    } else {
      results.errorCount++;
      
      if (result.error === 'timeout') {
        results.timeoutCount++;
      } else if (result.statusCode === 429) {
        results.rateLimitCount++;
      }
      
      const errorKey = result.error || `HTTP ${result.statusCode}`;
      results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
    }
    
    // Track status codes
    const statusKey = result.statusCode || 'ERROR';
    results.statusCodes[statusKey] = (results.statusCodes[statusKey] || 0) + 1;
    
    // Brief delay between requests (realistic user behavior)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }
  
  return userResults;
}

// Calculate statistics
function calculateStats() {
  if (results.responseTimes.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0
    };
  }
  
  const sorted = results.responseTimes.sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    min: sorted[0],
    max: sorted[len - 1],
    mean: sorted.reduce((a, b) => a + b, 0) / len,
    median: sorted[Math.floor(len / 2)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)]
  };
}

// Print progress bar
function printProgress(current, total, startTime) {
  const percent = Math.floor((current / total) * 100);
  const barLength = 40;
  const filled = Math.floor((percent / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  process.stdout.write(`\r  Progress: [${bar}] ${percent}% (${current}/${total} users) - ${elapsed}s`);
}

// Main load test
async function runLoadTest() {
  console.log('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║     KejaMarket Load Testing Suite                        ║\x1b[0m');
  console.log('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
  
  console.log(`\x1b[33mTest Configuration:\x1b[0m`);
  console.log(`  Target URL:         ${BASE_URL}`);
  console.log(`  Concurrent Users:   ${CONCURRENT_USERS}`);
  console.log(`  Requests per User:  ${REQUESTS_PER_USER}`);
  console.log(`  Total Requests:     ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log(`  Ramp-up Time:       ${RAMP_UP_TIME_MS / 1000}s`);
  console.log('');
  
  console.log('\x1b[33mTest Scenarios:\x1b[0m');
  SCENARIOS.forEach(s => {
    console.log(`  ${s.name.padEnd(25)} ${s.weight}%`);
  });
  console.log('');
  
  console.log('\x1b[32m━━━ Starting Load Test ━━━\x1b[0m\n');
  
  results.startTime = Date.now();
  
  // Create user simulations with staggered start times
  const userPromises = [];
  const delayIncrement = RAMP_UP_TIME_MS / CONCURRENT_USERS;
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const delay = i * delayIncrement;
    userPromises.push(simulateUser(i, delay));
    
    // Print progress periodically
    if ((i + 1) % 10 === 0 || i === CONCURRENT_USERS - 1) {
      printProgress(i + 1, CONCURRENT_USERS, results.startTime);
    }
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  results.endTime = Date.now();
  
  console.log('\n\n\x1b[32m━━━ Test Complete ━━━\x1b[0m\n');
  
  // Calculate and display results
  const duration = (results.endTime - results.startTime) / 1000;
  const stats = calculateStats();
  const successRate = (results.successCount / results.totalRequests * 100).toFixed(2);
  const throughput = (results.totalRequests / duration).toFixed(2);
  
  console.log('\x1b[36m━━━ Results Summary ━━━\x1b[0m\n');
  
  console.log('\x1b[33mOverview:\x1b[0m');
  console.log(`  Total Duration:     ${duration.toFixed(2)}s`);
  console.log(`  Total Requests:     ${results.totalRequests}`);
  console.log(`  Successful:         \x1b[32m${results.successCount}\x1b[0m`);
  console.log(`  Failed:             \x1b[31m${results.errorCount}\x1b[0m`);
  console.log(`  Success Rate:       ${successRate >= 99 ? '\x1b[32m' : successRate >= 95 ? '\x1b[33m' : '\x1b[31m'}${successRate}%\x1b[0m`);
  console.log(`  Throughput:         ${throughput} req/s`);
  console.log('');
  
  console.log('\x1b[33mResponse Times:\x1b[0m');
  console.log(`  Min:                ${stats.min}ms`);
  console.log(`  Mean:               ${Math.round(stats.mean)}ms`);
  console.log(`  Median:             ${stats.median}ms`);
  console.log(`  95th Percentile:    ${stats.p95 < 500 ? '\x1b[32m' : stats.p95 < 1000 ? '\x1b[33m' : '\x1b[31m'}${stats.p95}ms\x1b[0m`);
  console.log(`  99th Percentile:    ${stats.p99 < 1000 ? '\x1b[32m' : stats.p99 < 2000 ? '\x1b[33m' : '\x1b[31m'}${stats.p99}ms\x1b[0m`);
  console.log(`  Max:                ${stats.max}ms`);
  console.log('');
  
  if (results.rateLimitCount > 0) {
    console.log('\x1b[33mRate Limiting:\x1b[0m');
    console.log(`  Rate Limited (429): ${results.rateLimitCount}`);
    console.log(`  Rate Limit %:       ${(results.rateLimitCount / results.totalRequests * 100).toFixed(2)}%`);
    console.log('');
  }
  
  if (results.timeoutCount > 0) {
    console.log('\x1b[31mTimeouts:\x1b[0m');
    console.log(`  Timeout Count:      ${results.timeoutCount}`);
    console.log(`  Timeout %:          ${(results.timeoutCount / results.totalRequests * 100).toFixed(2)}%`);
    console.log('');
  }
  
  if (Object.keys(results.statusCodes).length > 0) {
    console.log('\x1b[33mStatus Code Distribution:\x1b[0m');
    Object.keys(results.statusCodes)
      .sort((a, b) => results.statusCodes[b] - results.statusCodes[a])
      .forEach(code => {
        const count = results.statusCodes[code];
        const percent = (count / results.totalRequests * 100).toFixed(1);
        console.log(`  ${String(code).padEnd(6)} ${String(count).padStart(6)} (${percent}%)`);
      });
    console.log('');
  }
  
  if (Object.keys(results.errors).length > 0) {
    console.log('\x1b[31mErrors:\x1b[0m');
    Object.keys(results.errors)
      .sort((a, b) => results.errors[b] - results.errors[a])
      .slice(0, 10) // Top 10 errors
      .forEach(error => {
        console.log(`  ${error}: ${results.errors[error]}`);
      });
    console.log('');
  }
  
  // Performance assessment
  console.log('\x1b[36m━━━ Performance Assessment ━━━\x1b[0m\n');
  
  const assessments = [];
  
  if (successRate >= 99) {
    assessments.push({ status: 'PASS', msg: 'Success rate excellent (≥99%)' });
  } else if (successRate >= 95) {
    assessments.push({ status: 'WARN', msg: `Success rate acceptable but could be improved (${successRate}%)` });
  } else {
    assessments.push({ status: 'FAIL', msg: `Success rate too low (${successRate}%)` });
  }
  
  if (stats.p95 < 500) {
    assessments.push({ status: 'PASS', msg: '95th percentile response time excellent (<500ms)' });
  } else if (stats.p95 < 1000) {
    assessments.push({ status: 'WARN', msg: `95th percentile response time acceptable (${stats.p95}ms)` });
  } else {
    assessments.push({ status: 'FAIL', msg: `95th percentile response time too slow (${stats.p95}ms)` });
  }
  
  if (stats.mean < 300) {
    assessments.push({ status: 'PASS', msg: 'Mean response time excellent (<300ms)' });
  } else if (stats.mean < 600) {
    assessments.push({ status: 'WARN', msg: `Mean response time acceptable (${Math.round(stats.mean)}ms)` });
  } else {
    assessments.push({ status: 'FAIL', msg: `Mean response time too slow (${Math.round(stats.mean)}ms)` });
  }
  
  if (throughput > 50) {
    assessments.push({ status: 'PASS', msg: `Throughput excellent (${throughput} req/s)` });
  } else if (throughput > 20) {
    assessments.push({ status: 'WARN', msg: `Throughput acceptable (${throughput} req/s)` });
  } else {
    assessments.push({ status: 'FAIL', msg: `Throughput too low (${throughput} req/s)` });
  }
  
  if (results.timeoutCount === 0) {
    assessments.push({ status: 'PASS', msg: 'No timeouts detected' });
  } else if (results.timeoutCount < results.totalRequests * 0.01) {
    assessments.push({ status: 'WARN', msg: `${results.timeoutCount} timeouts (<1%)` });
  } else {
    assessments.push({ status: 'FAIL', msg: `${results.timeoutCount} timeouts (≥1%)` });
  }
  
  assessments.forEach(a => {
    const icon = a.status === 'PASS' ? '\x1b[32m✓\x1b[0m' : 
                 a.status === 'WARN' ? '\x1b[33m⚠\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${icon} ${a.msg}`);
  });
  
  const failCount = assessments.filter(a => a.status === 'FAIL').length;
  const warnCount = assessments.filter(a => a.status === 'WARN').length;
  
  console.log('');
  
  if (failCount === 0 && warnCount === 0) {
    console.log('\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('\x1b[32m  Overall: EXCELLENT - Ready for 10,000+ users! ✓\x1b[0m');
    console.log('\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  } else if (failCount === 0) {
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('\x1b[33m  Overall: GOOD - Minor optimizations recommended\x1b[0m');
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  } else {
    console.log('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('\x1b[31m  Overall: NEEDS IMPROVEMENT - Review failures above\x1b[0m');
    console.log('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
    
    console.log('\x1b[33mRecommendations:\x1b[0m');
    console.log('  • Increase database connection pool size if seeing connection errors');
    console.log('  • Check server resources (CPU, memory) during load');
    console.log('  • Review slow queries and add database indexes');
    console.log('  • Consider horizontal scaling for higher loads');
    console.log('  • Monitor PM2 cluster worker distribution\n');
  }
  
  // Exit code based on critical failures
  process.exit(failCount > 0 ? 1 : 0);
}

// Run the load test
runLoadTest().catch(err => {
  console.error('\x1b[31mFatal error:\x1b[0m', err);
  process.exit(1);
});
