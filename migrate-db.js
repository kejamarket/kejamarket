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
      
      // Load seed data from JSON
      const seedData = require('./db/data.json');
      const store = require('./db/postgres-store.js');
      await store.init();
      
      console.log(`📊 Seeding database...`);
      console.log(`   - Users: ${seedData.users?.length || 0}`);
      console.log(`   - Properties: ${seedData.properties?.length || 0}`);
      console.log(`   - Services: ${seedData.services?.length || 0}`);
      console.log(`   - Marketplace: ${seedData.marketplace_items?.length || 0}`);
      
      // Insert seed data
      for (const user of seedData.users || []) {
        try {
          await store.createUser(user);
        } catch (e) {
          // User might already exist
        }
      }
      
      for (const property of seedData.properties || []) {
        try {
          await store.createProperty(property);
        } catch (e) {
          // Property might already exist
        }
      }
      
      await client.end();
      console.log('\n✅ Migration complete!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n⚠️  Falling back to JSON database...');
      
      // Initialize JSON database as fallback
      const store = require('./db/store.js');
      console.log('✅ JSON database initialized');
      console.log(`   - Properties: ${store.data.properties?.length || 0}`);
    }
    
  } else {
    console.log('📁 No PostgreSQL URL. Initializing JSON database...\n');
    const store = require('./db/store.js');
    console.log('✅ JSON database initialized');
    console.log(`   - Properties: ${store.data.properties?.length || 0}`);
  }
}

migrate().catch(console.error);
