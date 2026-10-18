require('dotenv').config();
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const opts = { hostname: 'localhost', port: 3001, path, method, headers };
    const r = http.request(opts, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  // 1. Get property
  const propsRes = await req('GET', '/api/properties?limit=1');
  const propsList = propsRes.body.properties || propsRes.body.data || propsRes.body;
  const property = Array.isArray(propsList) ? propsList[0] : null;
  console.log(`✅ Property: ${property?.id} - ${property?.title}`);

  // 2. Register tenant
  const ts = Date.now();
  const email = `t_${ts}@test.com`;
  const regRes = await req('POST', '/api/auth/register', {
    name: 'Test Tenant', email, phone: `070${ts.toString().slice(-7)}`, password: 'Test1234!', role: 'tenant'
  });
  const tenantToken = regRes.body.token;
  const tenantId = regRes.body.user?.id;
  console.log(`✅ Tenant: ${email} (${tenantId})`);

  // 3. Create viewing request
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const viewRes = await req('POST', '/api/viewings/request', {
    propertyId: property.id, preferredDate: tomorrow, preferredTime: '10:00'
  }, tenantToken);
  const vrId = viewRes.body.request?.id;
  const vrStatus = viewRes.body.request?.status;
  console.log(`✅ Viewing Request: ${vrId} | Status: ${vrStatus}`);

  // 4. Staff confirm (need admin)
  const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@kejamarket.co.ke', password: 'Admin1234!' });
  let adminToken = adminLogin.body.token;
  if (!adminToken) {
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign({ id: 'usr-admin-01', role: 'admin', isAdmin: true, is_admin: true, email: 'admin@kejamarket.co.ke' }, process.env.JWT_SECRET || 'kejamarket_super_secret_jwt_key_2026', { expiresIn: '1d' });
  }
  
  if (adminToken) {
    console.log('\n✅ Admin logged in');
    const confirmRes = await req('POST', `/api/admin/viewings/${vrId}/staff-confirm`, {
      confirmedDate: tomorrow, confirmedTime: '10:00', notes: 'Test - confirmed'
    }, adminToken);
    console.log(`✅ Staff confirm: ${confirmRes.status} | ${confirmRes.body.message || confirmRes.body.error}`);
    console.log(`  New status: ${confirmRes.body.viewingRequest?.status}`);
  } else {
    console.log('⚠️ No admin — waiting for 60s escalation then simulating manual confirm via tenant flow');
  }

  // 5. Check status
  const statusRes = await req('GET', `/api/viewings/${vrId}/status`, null, tenantToken);
  console.log(`\n✅ Status poll: ${statusRes.status} | status: ${statusRes.body.status}`);
  console.log('  Full body:', JSON.stringify(statusRes.body, null, 2).slice(0, 300));

  // 6. Initiate payment (if status allows)
  console.log('\n--- Initiate payment ---');
  const payRes = await req('POST', `/api/viewings/${vrId}/pay`, { phone: '0712345678' }, tenantToken);
  console.log(`Pay status: ${payRes.status} | ${payRes.body.message || payRes.body.error}`);
  if (payRes.body.bookingId) console.log(`Booking ID: ${payRes.body.bookingId}`);

  // 7. Simulate receipt verification
  console.log('\n--- Verify receipt ---');
  const rn = 'QKA' + Math.random().toString(36).slice(2, 9).toUpperCase();
  const receiptRes = await req('POST', `/api/viewings/${vrId}/verify-receipt`, {
    receiptNumber: rn, amount: 200
  }, tenantToken);
  console.log(`Receipt: ${receiptRes.status} | ${receiptRes.body.message || receiptRes.body.error}`);

  // 8. Unlock
  console.log('\n--- Unlock ---');
  const unlockRes = await req('GET', `/api/viewings/${vrId}/unlock`, null, tenantToken);
  console.log(`Unlock: ${unlockRes.status}`);
  console.log(JSON.stringify(unlockRes.body, null, 2).slice(0, 400));

  console.log('\n🎉 TEST COMPLETE');
}

main().catch(e => console.error('ERROR:', e.message));
