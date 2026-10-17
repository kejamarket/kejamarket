#!/usr/bin/env node
/**
 * Database Initialization Script for Production
 * Run this once to initialize the database with seed data
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing KejaMarket Database...\n');

// Check if db/data.json exists
const dbPath = path.join(__dirname, 'db', 'data.json');

if (fs.existsSync(dbPath)) {
  console.log('✅ Database file already exists at:', dbPath);
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log('📊 Database Statistics:');
  console.log(`   - Users: ${data.users?.length || 0}`);
  console.log(`   - Properties: ${data.properties?.length || 0}`);
  console.log(`   - Services: ${data.services?.length || 0}`);
  console.log(`   - Marketplace Items: ${data.marketplace_items?.length || 0}`);
  console.log('\n✅ Database is ready!');
  process.exit(0);
} else {
  console.log('⚠️  Database file not found. Creating new database...');
  
  // Load the store module which will auto-initialize
  const store = require('./db/store.js');
  
  console.log('✅ Database initialized with seed data');
  console.log('📊 Database Statistics:');
  console.log(`   - Users: ${store.data.users?.length || 0}`);
  console.log(`   - Properties: ${store.data.properties?.length || 0}`);
  console.log(`   - Services: ${store.data.services?.length || 0}`);
  console.log(`   - Marketplace Items: ${store.data.marketplace_items?.length || 0}`);
  
  console.log('\n✅ Database initialization complete!');
  process.exit(0);
}
