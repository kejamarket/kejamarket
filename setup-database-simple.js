#!/usr/bin/env node
/**
 * Simple PostgreSQL Setup - Load properties directly
 */

const { Client } = require('pg');
const fs = require('fs');

async function setup() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
  
  console.log('🔧 Setting up database...\n');
  
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to PostgreSQL\n');
  
  // Create tables
  console.log('📋 Creating tables...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      rent_kes NUMERIC(12,2),
      bedrooms INTEGER,
      bathrooms INTEGER,
      estate_suburb TEXT,
      county TEXT,
      status TEXT DEFAULT 'approved',
      raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      password TEXT,
      role TEXT DEFAULT 'tenant',
      raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);
  console.log('✅ Tables created\n');
  
  // Load data
  console.log('📊 Loading properties...');
  const data = JSON.parse(fs.readFileSync('./db/data.json', 'utf8'));
  
  let count = 0;
  for (const prop of data.properties || []) {
    try {
      await client.query(`
        INSERT INTO properties (id, title, category, rent_kes, bedrooms, bathrooms, estate_suburb, county, status, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          rent_kes = EXCLUDED.rent_kes,
          bedrooms = EXCLUDED.bedrooms,
          bathrooms = EXCLUDED.bathrooms,
          estate_suburb = EXCLUDED.estate_suburb,
          county = EXCLUDED.county,
          status = EXCLUDED.status,
          raw_data = EXCLUDED.raw_data
      `, [
        prop.id,
        prop.title,
        prop.category || null,
        prop.rentKes || prop.rent || null,
        prop.bedrooms || null,
        prop.bathrooms || null,
        prop.estateSuburb || null,
        prop.county || null,
        prop.status || 'approved',
        JSON.stringify(prop)
      ]);
      count++;
    } catch (e) {
      console.error(`Error adding ${prop.id}:`, e.message);
    }
  }
  
  console.log(`✅ Added ${count} properties\n`);
  
  // Verify
  const result = await client.query('SELECT COUNT(*) FROM properties');
  console.log(`📊 Total properties in database: ${result.rows[0].count}\n`);
  
  await client.end();
  console.log('✅ Setup complete!');
}

setup().catch(e => {
  console.error('❌ Setup failed:', e.message);
  process.exit(1);
});
