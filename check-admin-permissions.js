require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPermissions() {
  try {
    console.log('Checking admin permissions...\n');
    
    // Check user role assignments
    const roles = await pool.query(`
      SELECT ur.user_id, u.name, u.email, r.name as role_name, COUNT(p.name) as permission_count
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.is_active = TRUE
      GROUP BY ur.user_id, u.name, u.email, r.name
    `);
    
    console.log('User Role Assignments:');
    roles.rows.forEach(row => {
      console.log(`  ${row.name} (${row.email})`);
      console.log(`    Role: ${row.role_name}`);
      console.log(`    Permissions: ${row.permission_count}\n`);
    });
    
    // Check specific permissions for admin user
    const adminPerms = await pool.query(`
      SELECT p.name
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = 'usr-admin-01' AND ur.is_active = TRUE
      ORDER BY p.name
    `);
    
    console.log('Admin user (usr-admin-01) permissions:');
    adminPerms.rows.forEach(p => console.log(`  - ${p.name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPermissions();
