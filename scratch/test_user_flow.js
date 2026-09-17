/**
 * KejaMarket Comprehensive Integration & Layout Test Suite
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

function get(pathName) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${pathName}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

function post(pathName, postData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(postData);
    const req = http.request(`${BASE_URL}${pathName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 KEJAMARKET COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- Test Group 1: Server & Database Health ---
  console.log('--- 1. Health & Database Connectivity ---');
  try {
    const health = await get('/api/health');
    assert(health.statusCode === 200, 'Health endpoint responds with 200 OK');
    const healthData = JSON.parse(health.body);
    assert(healthData.status === 'online', 'Server reports online status');
    assert(healthData.dbReady === true, 'PostgreSQL database connection is ready');
    assert(healthData.dataCounts && healthData.dataCounts.properties > 0, `Properties present in DB (${healthData.dataCounts?.properties} items)`);
  } catch (err) {
    assert(false, 'Server health check', err.message);
  }

  // --- Test Group 2: Core Data Endpoints ---
  console.log('\n--- 2. Core API Endpoints ---');
  try {
    const props = await get('/api/properties');
    assert(props.statusCode === 200, 'GET /api/properties responds with 200');
    const propList = JSON.parse(props.body);
    const propArr = Array.isArray(propList) ? propList : propList.properties || [];
    assert(propArr.length > 0, `Properties loaded successfully (${propArr.length} properties)`);

    const servs = await get('/api/services');
    assert(servs.statusCode === 200, 'GET /api/services responds with 200');

    const market = await get('/api/marketplace');
    assert(market.statusCode === 200, 'GET /api/marketplace responds with 200');
  } catch (err) {
    assert(false, 'Core API Endpoints', err.message);
  }

  // --- Test Group 3: HTML & Layout Structure ---
  console.log('\n--- 3. HTML DOM Hierarchy & Layout Checks ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Check that footer is NOT inside <main class="main-app-layout">
  const mainOpen = indexHtml.indexOf('<main class="main-app-layout"');
  const mainClose = indexHtml.indexOf('</main>');
  const footerPos = indexHtml.indexOf('<footer class="keja-site-footer">');

  assert(mainOpen !== -1, 'main.main-app-layout exists in index.html');
  assert(footerPos !== -1, 'footer.keja-site-footer exists in index.html');
  assert(footerPos > mainClose, 'footer.keja-site-footer is placed outside <main>, allowing full-width spanning');

  // Check green SMS banner structure in index.html
  assert(indexHtml.includes('class="green-sms-alert-banner"'), 'green-sms-alert-banner exists in DOM');
  assert(indexHtml.includes('class="green-sms-right"'), 'green-sms-right image container exists in banner');
  assert(indexHtml.includes('Better Homes') && indexHtml.includes('Better Lives'), 'Cursive script tagline exists in banner');

  // Check sidebar filter sections
  assert(indexHtml.includes('filter-accordion-section'), 'Sidebar accordion sections exist');
  assert(indexHtml.includes('btn-apply-filters-main'), 'Green apply filters button exists in sidebar');

  // Check that obsolete conflicting script is removed
  assert(!indexHtml.includes('js/enhanced-registration.js'), 'Obsolete enhanced-registration.js is removed to protect auth modal');

  // --- Test Group 4: CSS Desktop Full-Width & 4-Column Grid Rules ---
  console.log('\n--- 4. CSS Full-Width & Responsive Grid Rules ---');
  const styleCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

  assert(styleCss.includes('max-width: 1720px'), '1720px max-width container defined for wide displays');
  assert(styleCss.includes('.main-app-layout') && styleCss.includes('grid-template-columns:'), 'Sidebar grid layout defined for desktop');
  assert(styleCss.includes('repeat(4, minmax(0, 1fr))'), '4-column card grid defined using minmax(0, 1fr) to prevent clipping');
  assert(styleCss.includes('clip-path: polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)'), 'Diagonal clip-path applied to SMS banner right image');
  assert(styleCss.includes('.keja-footer-container'), 'keja-footer-container defined with full-width responsive grid');

  // --- Test Group 5: Auth & Role Switching Logic ---
  console.log('\n--- 5. Auth Modal & Script Integrity ---');
  const authJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');

  assert(authJs.includes('modal.classList.add(\'open\')'), 'openAuthModal ensures modal gets .open class');
  assert(authJs.includes('function setRole(role, panel)'), 'setRole method defined for Tenant / Landlord / Business');
  assert(authJs.includes('auth-role-card--active'), 'setRole updates active role button classes');

  // --- Test Summary ---
  console.log('\n====================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
