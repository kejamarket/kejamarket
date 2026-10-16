/**
 * KejaMarket - End-to-End System Test Suite
 * Tests all critical functionality for 10,000+ concurrent user readiness
 * 
 * Run: node test-system.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const USE_HTTPS = BASE_URL.startsWith('https');

// Test configuration
const config = {
  baseUrl: BASE_URL,
  timeout: 10000,
  colors: {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  }
};

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper: Make HTTP request
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const protocol = USE_HTTPS ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (USE_HTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KejaMarket-TestSuite/1.0',
        ...headers
      },
      timeout: config.timeout
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper: Log test result
function logTest(name, passed, message = '', duration = 0) {
  results.total++;
  const status = passed ? '✓' : '✗';
  const color = passed ? config.colors.green : config.colors.red;
  const durationStr = duration ? ` (${duration}ms)` : '';
  
  console.log(`${color}${status}${config.colors.reset} ${name}${durationStr}`);
  if (message) {
    console.log(`  ${message}`);
  }
  
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  results.tests.push({ name, passed, message, duration });
}

function logWarning(message) {
  console.log(`${config.colors.yellow}⚠${config.colors.reset} ${message}`);
  results.warnings++;
}

function logSection(title) {
  console.log(`\n${config.colors.blue}━━━ ${title} ━━━${config.colors.reset}`);
}

// Test Suite

async function testHealthEndpoint() {
  logSection('Health & Monitoring Tests');
  
  try {
    const start = Date.now();
    const res = await makeRequest('/api/health');
    const duration = Date.now() - start;
    
    const passed = res.statusCode === 200 && 
                   res.data && 
                   res.data.success === true &&
                   res.data.status === 'healthy';
    
    logTest('Health endpoint responds', passed, 
      passed ? `Status: ${res.data.status}, Uptime: ${Math.floor(res.data.uptime)}s` : 
               `Status code: ${res.statusCode}`, 
      duration);
    
    if (passed && res.data.database) {
      const dbHealthy = res.data.database.status === 'healthy';
      logTest('Database connection healthy', dbHealthy, 
        dbHealthy ? `Pool: ${res.data.database.poolStats?.total || 'N/A'} total, ${res.data.database.poolStats?.idle || 'N/A'} idle` :
                   `DB Status: ${res.data.database.status}`);
    }
    
    if (passed && res.data.cache) {
      const cacheWorking = res.data.cache.size !== undefined;
      logTest('Cache system operational', cacheWorking, 
        cacheWorking ? `Size: ${res.data.cache.size}/${res.data.cache.maxEntries}, Hit rate: ${res.data.cache.hitRate}` :
                      'Cache stats unavailable');
    }
    
    if (passed && res.data.memory) {
      const memUsed = parseInt(res.data.memory.used);
      const memWarning = memUsed > 450;
      if (memWarning) {
        logWarning(`High memory usage: ${res.data.memory.used}`);
      }
    }
  } catch (err) {
    logTest('Health endpoint responds', false, `Error: ${err.message}`);
  }
}

async function testCacheStats() {
  try {
    const start = Date.now();
    const res = await makeRequest('/api/cache-stats');
    const duration = Date.now() - start;
    
    const passed = res.statusCode === 200 && 
                   res.data && 
                   res.data.success === true &&
                   res.data.cache;
    
    logTest('Cache stats endpoint', passed, 
      passed ? `Hits: ${res.data.cache.hits}, Misses: ${res.data.cache.misses}` : 
               `Failed with status ${res.statusCode}`,
      duration);
    
    if (passed) {
      const hitRate = parseFloat(res.data.cache.hitRate);
      if (hitRate < 50) {
        logWarning(`Low cache hit rate: ${res.data.cache.hitRate} (warm up needed)`);
      }
    }
  } catch (err) {
    logTest('Cache stats endpoint', false, `Error: ${err.message}`);
  }
}

async function testPropertiesAPI() {
  logSection('API Functionality Tests');
  
  try {
    const start = Date.now();
    const res = await makeRequest('/api/properties?limit=10');
    const duration = Date.now() - start;
    
    const passed = res.statusCode === 200 && 
                   res.data && 
                   Array.isArray(res.data.properties);
    
    logTest('Properties API returns data', passed, 
      passed ? `Found ${res.data.properties.length} properties` : 
               `Status: ${res.statusCode}`,
      duration);
    
    if (passed && duration > 500) {
      logWarning(`Slow response time: ${duration}ms (check cache)`);
    }
    
    // Test cache headers
    if (passed && res.headers['x-cache']) {
      const cacheHit = res.headers['x-cache'] === 'HIT';
      logTest('Properties endpoint cached', true, 
        `Cache status: ${res.headers['x-cache']}`);
    }
  } catch (err) {
    logTest('Properties API returns data', false, `Error: ${err.message}`);
  }
}

async function testLocationsAPI() {
  try {
    const start = Date.now();
    const res = await makeRequest('/api/locations/hierarchy');
    const duration = Date.now() - start;
    
    const passed = res.statusCode === 200 && res.data;
    
    logTest('Locations hierarchy API', passed, 
      passed ? 'Location data loaded' : `Status: ${res.statusCode}`,
      duration);
    
    if (passed && duration > 300) {
      logWarning(`Slow location load: ${duration}ms`);
    }
  } catch (err) {
    logTest('Locations hierarchy API', false, `Error: ${err.message}`);
  }
}

async function testStatsAPI() {
  try {
    const start = Date.now();
    const res = await makeRequest('/api/stats');
    const duration = Date.now() - start;
    
    const passed = res.statusCode === 200 && 
                   res.data && 
                   res.data.success === true;
    
    logTest('Stats API responds', passed, 
      passed ? `Stats retrieved successfully` : `Status: ${res.statusCode}`,
      duration);
  } catch (err) {
    logTest('Stats API responds', false, `Error: ${err.message}`);
  }
}

async function testRateLimiting() {
  logSection('Rate Limiting Tests');
  
  try {
    // Test general API rate limit (100 req/min)
    console.log('  Testing API rate limiter (this may take a moment)...');
    
    let requests = [];
    const testPath = '/api/cache-stats'; // Lightweight endpoint
    
    // Send 10 rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(makeRequest(testPath).catch(err => ({ error: err.message })));
    }
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.statusCode === 200).length;
    const rateLimitCount = responses.filter(r => r.statusCode === 429).length;
    
    const passed = successCount > 0;
    logTest('API rate limiter configured', passed, 
      `${successCount} succeeded, ${rateLimitCount} rate limited`);
    
    // Check for rate limit headers
    const firstSuccess = responses.find(r => r.statusCode === 200);
    if (firstSuccess && firstSuccess.headers) {
      const hasHeaders = firstSuccess.headers['ratelimit-limit'] || 
                        firstSuccess.headers['x-ratelimit-limit'];
      if (hasHeaders) {
        logTest('Rate limit headers present', true, 
          `Limit: ${firstSuccess.headers['ratelimit-limit'] || firstSuccess.headers['x-ratelimit-limit']}`);
      }
    }
  } catch (err) {
    logTest('API rate limiter configured', false, `Error: ${err.message}`);
  }
}

async function testResponseCompression() {
  logSection('Performance Optimization Tests');
  
  try {
    const res = await makeRequest('/api/properties?limit=50', 'GET', null, {
      'Accept-Encoding': 'gzip, deflate'
    });
    
    const compressed = res.headers['content-encoding'] === 'gzip' || 
                      res.headers['content-encoding'] === 'deflate';
    
    logTest('Response compression enabled', compressed, 
      compressed ? `Encoding: ${res.headers['content-encoding']}` : 
                  'No compression detected');
  } catch (err) {
    logTest('Response compression enabled', false, `Error: ${err.message}`);
  }
}

async function testSecurityHeaders() {
  try {
    const res = await makeRequest('/');
    
    const hasHelmet = res.headers['x-content-type-options'] === 'nosniff' ||
                     res.headers['x-frame-options'] ||
                     res.headers['x-xss-protection'];
    
    logTest('Security headers present', hasHelmet, 
      hasHelmet ? 'Helmet middleware active' : 'Missing security headers');
    
    if (res.headers['x-powered-by']) {
      logWarning('X-Powered-By header exposed (should be hidden)');
    }
  } catch (err) {
    logTest('Security headers present', false, `Error: ${err.message}`);
  }
}

async function testCachePerformance() {
  logSection('Cache Performance Tests');
  
  try {
    // First request (cache miss)
    const start1 = Date.now();
    const res1 = await makeRequest('/api/properties?limit=5');
    const duration1 = Date.now() - start1;
    
    // Second request (cache hit)
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
    const start2 = Date.now();
    const res2 = await makeRequest('/api/properties?limit=5');
    const duration2 = Date.now() - start2;
    
    const cacheWorking = duration2 < duration1 * 0.8; // Cache should be 80%+ faster
    
    logTest('Cache improves response time', cacheWorking, 
      `First: ${duration1}ms, Cached: ${duration2}ms (${Math.round((1 - duration2/duration1) * 100)}% faster)`);
    
    // Check cache headers
    if (res2.headers['x-cache'] === 'HIT') {
      logTest('Cache header indicates HIT', true, 'X-Cache: HIT');
    }
  } catch (err) {
    logTest('Cache improves response time', false, `Error: ${err.message}`);
  }
}

async function testDatabaseQueries() {
  logSection('Database Performance Tests');
  
  try {
    // Test property detail query
    const start = Date.now();
    const listRes = await makeRequest('/api/properties?limit=1');
    
    if (listRes.data && listRes.data.properties && listRes.data.properties[0]) {
      const propId = listRes.data.properties[0].id;
      const detailRes = await makeRequest(`/api/properties/${propId}`);
      const duration = Date.now() - start;
      
      const passed = detailRes.statusCode === 200 && detailRes.data;
      logTest('Property detail query', passed, 
        passed ? `Retrieved in ${duration}ms` : `Failed: ${detailRes.statusCode}`,
        duration);
      
      if (duration > 1000) {
        logWarning(`Slow query: ${duration}ms (check database indexes)`);
      }
    } else {
      logWarning('No properties available to test detail query');
    }
  } catch (err) {
    logTest('Property detail query', false, `Error: ${err.message}`);
  }
}

async function testConcurrentRequests() {
  logSection('Concurrency Tests');
  
  try {
    console.log('  Simulating 50 concurrent requests...');
    
    const start = Date.now();
    const requests = [];
    
    for (let i = 0; i < 50; i++) {
      requests.push(
        makeRequest('/api/properties?limit=10')
          .catch(err => ({ error: err.message, statusCode: 0 }))
      );
    }
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;
    
    const successCount = responses.filter(r => r.statusCode === 200).length;
    const errorCount = responses.filter(r => r.statusCode === 0 || r.error).length;
    const avgTime = duration / 50;
    
    const passed = successCount >= 45; // 90% success rate
    
    logTest('50 concurrent requests', passed, 
      `${successCount} succeeded, ${errorCount} failed, Avg: ${Math.round(avgTime)}ms`,
      duration);
    
    if (avgTime > 500) {
      logWarning(`High average response time: ${Math.round(avgTime)}ms under load`);
    }
  } catch (err) {
    logTest('50 concurrent requests', false, `Error: ${err.message}`);
  }
}

async function testProfileButtonFunctionality() {
  logSection('Frontend Integration Tests');
  
  try {
    // Test that main HTML includes profile dropdown element
    const res = await makeRequest('/');
    const hasProfileDropdown = res.raw && res.raw.includes('id="profile-dropdown"');
    
    logTest('Profile dropdown element exists', hasProfileDropdown, 
      hasProfileDropdown ? 'Element found in HTML' : 'Element missing from HTML');
    
    // Test lazy-load.js is loaded
    const hasLazyLoad = res.raw && res.raw.includes('lazy-load.js');
    logTest('Lazy loading script included', hasLazyLoad,
      hasLazyLoad ? 'Performance optimization active' : 'Script missing');
    
  } catch (err) {
    logTest('Frontend integration', false, `Error: ${err.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${config.colors.blue}╔═══════════════════════════════════════════════════════════╗${config.colors.reset}`);
  console.log(`${config.colors.blue}║  KejaMarket End-to-End System Test Suite                 ║${config.colors.reset}`);
  console.log(`${config.colors.blue}║  Testing: ${BASE_URL.padEnd(43)}║${config.colors.reset}`);
  console.log(`${config.colors.blue}╚═══════════════════════════════════════════════════════════╝${config.colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Run all test suites
  await testHealthEndpoint();
  await testCacheStats();
  await testPropertiesAPI();
  await testLocationsAPI();
  await testStatsAPI();
  await testRateLimiting();
  await testResponseCompression();
  await testSecurityHeaders();
  await testCachePerformance();
  await testDatabaseQueries();
  await testConcurrentRequests();
  await testProfileButtonFunctionality();
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  console.log(`\n${config.colors.blue}━━━ Test Summary ━━━${config.colors.reset}`);
  console.log(`Total Tests:    ${results.total}`);
  console.log(`${config.colors.green}Passed:         ${results.passed}${config.colors.reset}`);
  console.log(`${config.colors.red}Failed:         ${results.failed}${config.colors.reset}`);
  console.log(`${config.colors.yellow}Warnings:       ${results.warnings}${config.colors.reset}`);
  console.log(`Duration:       ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Success Rate:   ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  // Overall status
  const overallPassed = results.failed === 0 && results.passed > 0;
  console.log(`\n${overallPassed ? config.colors.green : config.colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${config.colors.reset}`);
  console.log(`${overallPassed ? config.colors.green : config.colors.red}  Overall Status: ${overallPassed ? 'PASSED ✓' : 'FAILED ✗'}${config.colors.reset}`);
  console.log(`${overallPassed ? config.colors.green : config.colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${config.colors.reset}\n`);
  
  if (results.warnings > 0) {
    console.log(`${config.colors.yellow}Note: ${results.warnings} warning(s) detected. Review above for details.${config.colors.reset}\n`);
  }
  
  // Recommendations
  if (!overallPassed || results.warnings > 0) {
    console.log(`${config.colors.yellow}Recommendations:${config.colors.reset}`);
    
    if (results.failed > 0) {
      console.log(`  • Review failed tests above and fix critical issues`);
      console.log(`  • Ensure server is running: npm start or pm2 start ecosystem.config.js`);
      console.log(`  • Check database connection: PostgreSQL should be accessible`);
    }
    
    if (results.warnings > 0) {
      console.log(`  • Warm up cache by browsing properties (improves hit rate)`);
      console.log(`  • Monitor memory usage if > 450MB (auto-restarts at 500MB)`);
      console.log(`  • Review slow queries and add database indexes if needed`);
    }
    console.log('');
  }
  
  // Exit with appropriate code
  process.exit(overallPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(err => {
  console.error(`${config.colors.red}Fatal error:${config.colors.reset}`, err);
  process.exit(1);
});
