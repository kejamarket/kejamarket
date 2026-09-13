#!/usr/bin/env node
/**
 * FORCE DATABASE_URL FIX
 * This script OVERRIDES any wrong DATABASE_URL and sets it correctly
 * Run this before starting the server
 */

// FORCE the correct DATABASE_URL - IGNORE environment variable completely
const CORRECT_DATABASE_URL = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';

console.log('='.repeat(80));
console.log('🔧 FORCE DATABASE_URL FIX - IGNORING ENVIRONMENT');
console.log('='.repeat(80));

// Always set the correct DATABASE_URL, don't trust environment
const oldUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

if (oldUrl) {
  console.log('Old DATABASE_URL (ignored): ' + oldUrl.substring(0, 40) + '...');
}

console.log('✅ DATABASE_URL FORCED TO CORRECT VALUE');
console.log('   Connection: postgres@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres');
console.log('='.repeat(80));
console.log('');

// Now start the actual server
require('./server.js');
