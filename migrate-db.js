#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs PostgreSQL migration if DATABASE_URL is set
 * Otherwise initializes JSON database
 */

const fs = require('fs');
const path = require('path');

async function migrate() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (DATABASE_URL && DATABASE_URL.includes('postgres')) {
    console.log('🔄 PostgreSQL detected. Running migration...\n');
    
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: DATABASE_URL });
      
      await client.connect();
      console.log('✅ Connected to PostgreSQL');
      
      // Read and execute migration SQL
      const migrationSQL = fs.readFileSync(path.join(__dirname, 'db', 'postgres-migration.sql'), 'utf8');
      await client.query(migrationSQL);
      console.log('✅ Database schema created');
      
      await client.end();
      console.log('\n✅ Migration complete! Server will load data on startup.');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n⚠️  Will try to continue - server will initialize on startup');
    }
    
  } else {
    console.log('📁 No PostgreSQL URL. Will use JSON database...\n');
  }
  
  console.log('✅ Build complete');
}

migrate().catch(e => {
  console.error('Migration error:', e);
  console.log('✅ Continuing with build...');
  process.exit(0); // Don't fail the build
});
