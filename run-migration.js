// Run PostgreSQL migration on Supabase
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Read migration file
    const migrationPath = path.join(__dirname, 'db', 'postgres-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove the file path line at the top if it exists
    const cleanSQL = migrationSQL.replace(/^C:\\.*\.sql\s*\n/, '');

    console.log('📦 Running migration...');
    await client.query(cleanSQL);
    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });

    console.log('\n🎉 Supabase database is ready!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
