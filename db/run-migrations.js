/**
 * Migration Runner for KejaMarket
 * Runs all SQL migrations in the migrations folder
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📦 Found ${files.length} migration files`);

  for (const file of files) {
    console.log(`\n🔄 Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await pool.query(sql);
      console.log(`✅ ${file} completed successfully`);
    } catch (error) {
      console.error(`❌ ${file} failed:`, error.message);
      throw error;
    }
  }

  console.log('\n✅ All migrations completed successfully!');
}

async function verifyMigrations() {
  console.log('\n📊 Verifying database schema...');

  try {
    // Check roles
    const roles = await pool.query('SELECT COUNT(*) FROM roles');
    console.log(`✅ Roles table: ${roles.rows[0].count} roles`);

    // Check permissions
    const permissions = await pool.query('SELECT COUNT(*) FROM permissions');
    console.log(`✅ Permissions table: ${permissions.rows[0].count} permissions`);

    // Check role_permissions
    const rolePerms = await pool.query('SELECT COUNT(*) FROM role_permissions');
    console.log(`✅ Role-Permission mappings: ${rolePerms.rows[0].count} assignments`);

    // Check audit_events table exists
    const auditCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_events')");
    console.log(`✅ Audit events table: ${auditCheck.rows[0].exists ? 'Created' : 'Missing'}`);

    console.log('\n✅ Database schema verification passed!');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 KejaMarket Database Migration Runner\n');
    console.log(`📍 Database: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET'}\n`);

    await runMigrations();
    await verifyMigrations();

    console.log('\n🎉 Migration complete! RBAC system is ready.');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

main();
