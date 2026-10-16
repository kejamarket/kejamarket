/**
 * Script to update all admin endpoints with RBAC middleware
 * Maps each endpoint to appropriate permissions
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Endpoint to permission mapping
const endpointPermissions = [
  // User management
  { pattern: "app.get('/api/admin/users/:id'", permission: "requirePermission('user.view')" },
  { pattern: "app.post('/api/admin/users/:id/suspend'", permission: "requirePermission('user.ban')" },
  { pattern: "app.post('/api/admin/users/:id/toggle-verify'", permission: "requirePermission('user.edit')" },
  { pattern: "app.post('/api/admin/users/:id/ban'", permission: "requirePermission('user.ban')" },
  { pattern: "app.patch('/api/admin/users/:id'", permission: "requirePermission('user.edit')" },
  { pattern: "app.post('/api/admin/users'", permission: "requirePermission('user.create')" },
  { pattern: "app.delete('/api/admin/users/:id'", permission: "requirePermission('user.delete')" },
  
  // Building & property management  
  { pattern: "app.get('/api/admin/buildings'", permission: "requirePermission('listing.view')" },
  { pattern: "app.post('/api/admin/buildings'", permission: "requirePermission('listing.create')" },
  { pattern: "app.put('/api/admin/buildings/:id'", permission: "requirePermission('listing.edit')" },
  { pattern: "app.delete('/api/admin/buildings/:id'", permission: "requirePermission('listing.delete')" },
  { pattern: "app.get('/api/admin/buildings/:id'", permission: "requirePermission('listing.view')" },
  { pattern: "app.get('/api/admin/buildings/:id/units'", permission: "requirePermission('listing.view')" },
  { pattern: "app.post('/api/admin/units'", permission: "requirePermission('listing.create')" },
  { pattern: "app.get('/api/admin/units'", permission: "requirePermission('listing.view')" },
  { pattern: "app.put('/api/admin/units/:id'", permission: "requirePermission('listing.edit')" },
  { pattern: "app.get('/api/admin/all-properties'", permission: "requirePermission('listing.view')" },
  { pattern: "app.get('/api/admin/pending-listings'", permission: "requirePermission('listing.approve')" },
  
  // Admin management
  { pattern: "app.get('/api/admin/admins'", permission: "requirePermission('admin.manage')" },
  { pattern: "app.post('/api/admin/admins'", permission: "requirePermission('admin.manage')" },
  { pattern: "app.put('/api/admin/admins/:id'", permission: "requirePermission('admin.manage')" },
  { pattern: "app.delete('/api/admin/admins/:id'", permission: "requirePermission('admin.manage')" },
  
  // Content moderation
  { pattern: "app.get('/api/admin/inquiries'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.get('/api/admin/reviews'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.get('/api/admin/reports'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.get('/api/admin/support'", permission: "requirePermission('support.view')" },
  { pattern: "app.delete('/api/admin/reviews/:id'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.delete('/api/admin/inquiries/:id'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.patch('/api/admin/reports/:id'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.delete('/api/admin/reports/:id'", permission: "requirePermission('content.moderate')" },
  { pattern: "app.patch('/api/admin/support/:id'", permission: "requirePermission('support.respond')" },
  
  // Analytics & monitoring
  { pattern: "app.get('/api/admin/overview'", permission: "requirePermission('analytics.view')" },
  { pattern: "app.get('/api/admin/global-search'", permission: "requirePermission('analytics.view')" },
  { pattern: "app.get('/api/admin/analytics'", permission: "requirePermission('analytics.view')" },
  { pattern: "app.get('/api/admin/audit-logs'", permission: "requirePermission('audit.view')" },
  
  // Configuration & system
  { pattern: "app.get('/api/admin/mpesa-config'", permission: "requirePermission('config.view')" },
  { pattern: "app.post('/api/admin/mpesa-config'", permission: "requirePermission('config.edit')" },
  { pattern: "app.post('/api/admin/broadcast'", permission: "requirePermission('communication.send')" },
  { pattern: "app.post('/api/admin/send-message'", permission: "requirePermission('communication.send')" },
  { pattern: "app.get('/api/admin/download-db'", permission: "requirePermission('system.backup')" },
  
  // Locations
  { pattern: "app.post('/api/admin/locations'", permission: "requirePermission('config.edit')" },
  { pattern: "app.put('/api/admin/locations/:id'", permission: "requirePermission('config.edit')" },
  { pattern: "app.delete('/api/admin/locations/:id'", permission: "requirePermission('config.edit')" },
  { pattern: "app.post('/api/admin/locations/merge'", permission: "requirePermission('config.edit')" }
];

let replacedCount = 0;

for (const { pattern, permission } of endpointPermissions) {
  // Find the endpoint pattern
  const regex = new RegExp(
    `(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, requireAuth,) async \\(req, res\\) => \\{\\s+try \\{\\s+if \\(req\\.user\\.role !== 'admin' && !req\\.user\\.isAdmin\\)`,
    'g'
  );
  
  const replacement = `$1 ${permission}, auditRequest, async (req, res) => {\n  try {`;
  
  const newContent = serverContent.replace(regex, replacement);
  if (newContent !== serverContent) {
    serverContent = newContent;
    replacedCount++;
    console.log(`✅ Updated: ${pattern}`);
  }
}

// Write back
fs.writeFileSync(serverPath, serverContent);
console.log(`\n🎉 Successfully updated ${replacedCount} endpoints with RBAC middleware!`);
