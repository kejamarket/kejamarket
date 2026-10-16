require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addMissingPermissions() {
  try {
    console.log('Adding missing permissions...\n');
    
    // Missing permissions needed for endpoints
    const missingPermissions = [
      { name: 'analytics.view', resource: 'analytics', action: 'view', description: 'View analytics dashboards' },
      { name: 'content.moderate', resource: 'content', action: 'moderate', description: 'Moderate user content' },
      { name: 'support.view', resource: 'support', action: 'view', description: 'View support tickets' },
      { name: 'support.respond', resource: 'support', action: 'respond', description: 'Respond to support tickets' },
      { name: 'communication.send', resource: 'communication', action: 'send', description: 'Send communications' },
      { name: 'config.view', resource: 'config', action: 'view', description: 'View system configuration' },
      { name: 'config.edit', resource: 'config', action: 'edit', description: 'Edit system configuration' },
      { name: 'system.backup', resource: 'system', action: 'backup', description: 'Create system backups' },
      { name: 'admin.manage', resource: 'admin', action: 'manage', description: 'Manage admin users and roles' },
      { name: 'audit.view', resource: 'audit', action: 'view', description: 'View audit logs' },
      { name: 'listing.create', resource: 'listing', action: 'create', description: 'Create listings' }
    ];
    
    for (const perm of missingPermissions) {
      try {
        await pool.query(`
          INSERT INTO permissions (name, resource, action, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (name) DO NOTHING
        `, [perm.name, perm.resource, perm.action, perm.description]);
        console.log(`✅ Added: ${perm.name}`);
      } catch (err) {
        console.log(`ℹ️  ${perm.name}: ${err.message}`);
      }
    }
    
    // Grant all new permissions to Super Admin
    console.log('\nGranting permissions to Super Admin role...');
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 'role-super-admin', id FROM permissions
      WHERE name IN (${missingPermissions.map((_, i) => `$${i + 1}`).join(',')})
      ON CONFLICT DO NOTHING
    `, missingPermissions.map(p => p.name));
    console.log('✅ Permissions granted to Super Admin');
    
    // Verify total permissions
    const total = await pool.query('SELECT COUNT(*) FROM permissions');
    console.log(`\n✅ Total permissions in system: ${total.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingPermissions();
