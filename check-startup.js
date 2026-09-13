#!/usr/bin/env node
/**
 * Startup Health Check Script
 * Run this to verify server environment and database connection
 */

require('dotenv').config();
const { Client } = require('pg');

console.log('='.repeat(80));
console.log('KEJAMARKET STARTUP HEALTH CHECK');
console.log('='.repeat(80));
console.log('');

// 1. Check environment variables
console.log('1. ENVIRONMENT VARIABLES:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`   PORT: ${process.env.PORT || 'NOT SET (will use 3000)'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET ❌'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET (using default)'}`);
console.log('');

// 2. Check database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL not set!');
  console.error('   Server will fail to start.');
  process.exit(1);
}

console.log('2. TESTING DATABASE CONNECTION:');
console.log(`   Connecting to: ${process.env.DATABASE_URL.split('@')[1] || 'unknown'}`);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(async () => {
    console.log('   ✅ Connection successful!');
    
    // Check tables exist
    console.log('');
    console.log('3. CHECKING DATABASE TABLES:');
    
    const tables = ['users', 'properties', 'property_media', 'reviews', 'messages'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
    // Check verified properties
    console.log('');
    console.log('4. CHECKING VERIFIED PROPERTIES:');
    try {
      const result = await client.query('SELECT COUNT(*) FROM properties WHERE is_verified = true');
      const count = result.rows[0].count;
      console.log(`   Total verified properties: ${count}`);
      
      if (count === 0) {
        console.log('   ⚠️  WARNING: No verified properties! API will return empty results.');
      } else {
        console.log('   ✅ Properties ready to serve');
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
    
    await client.end();
    
    console.log('');
    console.log('='.repeat(80));
    console.log('HEALTH CHECK COMPLETE');
    console.log('='.repeat(80));
    process.exit(0);
    
  })
  .catch((err) => {
    console.error('   ❌ CONNECTION FAILED!');
    console.error(`   Error: ${err.message}`);
    console.error('');
    console.error('   Possible causes:');
    console.error('   - DATABASE_URL format incorrect');
    console.error('   - Database server not reachable');
    console.error('   - Invalid credentials');
    console.error('   - SSL/TLS issues');
    console.error('');
    console.error('   Current DATABASE_URL format:');
    console.error(`   ${process.env.DATABASE_URL.substring(0, 50)}...`);
    
    process.exit(1);
  });
