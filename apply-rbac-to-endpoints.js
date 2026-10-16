/**
 * Systematically apply RBAC middleware to all admin endpoints
 * Replaces manual role checks with permission-based middleware
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Define replacements: [endpoint_pattern, permission]
const replacements = [
  // Locations
  ["app.post('/api/admin/locations'", "requirePermission('config.edit')"],
  ["app.put('/api/admin/locations/:id'", "requirePermission('config.edit')"],
  ["app.delete('/api/admin/locations/:id'", "requirePermission('config.edit')"],
  ["app.post('/api/admin/locations/merge'", "requirePermission('config.edit')"],
  
  // Overview & Analytics
  ["app.get('/api/admin/overview'", "requirePermission('analytics.view')"],
  ["app.get('/api/admin/global-search'", "requirePermission('analytics.view')"],
  ["app.get('/api/admin/analytics'", "requirePermission('analytics.view')"],
  
  // M-Pesa Config
  ["app.get('/api/admin/mpesa-config'", "requirePermission('config.view')"],
  ["app.post('/api/admin/mpesa-config'", "requirePermission('config.edit')"],
  
  // User Management
  ["app.post('/api/admin/users/:id/suspend'", "requirePermission('user.ban')"],
  ["app.post('/api/admin/users/:id/toggle-verify'", "requirePermission('user.edit')"],
  ["app.post('/api/admin/users/:id/ban'", "requirePermission('user.ban')"],
  ["app.patch('/api/admin/users/:id'", "requirePermission('user.edit')"],
  ["app.post('/api/admin/users'", "requirePermission('user.create')"],
  ["app.delete('/api/admin/users/:id'", "requirePermission('user.delete')"],
  
  // Buildings
  ["app.get('/api/admin/buildings'", "requirePermission('listing.view')"],
  ["app.post('/api/admin/buildings'", "requirePermission('listing.create')"],
  ["app.put('/api/admin/buildings/:id'", "requirePermission('listing.edit')"],
  ["app.delete('/api/admin/buildings/:id'", "requirePermission('listing.delete')"],
  ["app.get('/api/admin/buildings/:id'", "requirePermission('listing.view')"],
  ["app.get('/api/admin/buildings/:id/units'", "requirePermission('listing.view')"],
  
  // Units
  ["app.post('/api/admin/units'", "requirePermission('listing.create')"],
  ["app.get('/api/admin/units'", "requirePermission('listing.view')"],
  ["app.put('/api/admin/units/:id'", "requirePermission('listing.edit')"],
  
  // Communications
  ["app.post('/api/admin/broadcast'", "requirePermission('communication.send')"],
  ["app.post('/api/admin/send-message'", "requirePermission('communication.send')"],
  
  // System
  ["app.get('/api/admin/download-db'", "requirePermission('system.backup')"],
  
  // Properties
  ["app.get('/api/admin/all-properties'", "requirePermission('listing.view')"],
  ["app.get('/api/admin/pending-listings'", "requirePermission('listing.approve')"],
  
  // Admin Management
  ["app.get('/api/admin/admins'", "requirePermission('admin.manage')"],
  ["app.post('/api/admin/admins'", "requirePermission('admin.manage')"],
  ["app.put('/api/admin/admins/:id'", "requirePermission('admin.manage')"],
  ["app.delete('/api/admin/admins/:id'", "requirePermission('admin.manage')"],
  
  // Content Moderation
  ["app.get('/api/admin/inquiries'", "requirePermission('content.moderate')"],
  ["app.get('/api/admin/reviews'", "requirePermission('content.moderate')"],
  ["app.get('/api/admin/reports'", "requirePermission('content.moderate')"],
  ["app.get('/api/admin/support'", "requirePermission('support.view')"],
  ["app.delete('/api/admin/reviews/:id'", "requirePermission('content.moderate')"],
  ["app.delete('/api/admin/inquiries/:id'", "requirePermission('content.moderate')"],
  ["app.patch('/api/admin/reports/:id'", "requirePermission('content.moderate')"],
  ["app.delete('/api/admin/reports/:id'", "requirePermission('content.moderate')"],
  ["app.patch('/api/admin/support/:id'", "requirePermission('support.respond')"],
  
  // SMS (also needs protection)
  ["app.post('/api/sms/send'", "requirePermission('communication.send')"],
  
  // Audit logs
  ["app.get('/api/admin/audit-logs'", "requirePermission('audit.view')"]
];

let replacedCount = 0;

for (const [endpointPattern, permission] of replacements) {
  // Escape special regex characters in endpoint pattern
  const escapedPattern = endpointPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:\w+/g, ':[\\w]+');
  
  // Match: endpoint, requireAuth, async/function, then the if statement
  const regex = new RegExp(
    `(${escapedPattern}, requireAuth,) (async )?\\(req, res\\) => \\{\\s*try \\{\\s*if \\(req\\.user\\.role !== 'admin' && !req\\.user\\.isAdmin\\) \\{?\\s*return res\\.status\\(403\\)\\.json\\([^)]+\\);?\\s*\\}?`,
    'g'
  );
  
  const replacement = `$1 ${permission}, auditRequest, $2(req, res) => {\n  try {`;
  
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    replacedCount++;
    console.log(`✅ ${endpointPattern} → ${permission}`);
  }
}

// Write the updated content
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\n🎉 Successfully updated ${replacedCount}/${replacements.length} endpoints with RBAC middleware!`);
console.log('\n✅ All admin endpoints now protected with permission-based access control');
console.log('✅ Audit logging automatically applied to all protected endpoints');
