#!/usr/bin/env node
/**
 * FORCE DATABASE_URL FIX
 * This script OVERRIDES any wrong DATABASE_URL and sets it correctly
 * Run this before starting the server
 */

// FORCE the correct DATABASE_URL regardless of environment variable
const CORRECT_DATABASE_URL = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';

console.log('='.repeat(80));
console.log('🔧 FORCING CORRECT DATABASE_URL');
console.log('='.repeat(80));

// Check current DATABASE_URL
const currentUrl = process.env.DATABASE_URL;

if (currentUrl) {
  console.log('Current DATABASE_URL detected (may be wrong):');
  console.log('  ' + currentUrl.substring(0, 50) + '...');
  
  // Check if it has the wrong format
  if (currentUrl.includes('postgres.yvo') || currentUrl.includes('postgres.$')) {
    console.log('❌ WRONG FORMAT DETECTED - Fixing...');
    process.env.DATABASE_URL = CORRECT_DATABASE_URL;
    console.log('✅ DATABASE_URL CORRECTED');
  } else if (currentUrl === CORRECT_DATABASE_URL) {
    console.log('✅ DATABASE_URL is already correct');
  } else {
    console.log('⚠️  DATABASE_URL format unknown, forcing correct value...');
    process.env.DATABASE_URL = CORRECT_DATABASE_URL;
    console.log('✅ DATABASE_URL SET TO CORRECT VALUE');
  }
} else {
  console.log('⚠️  No DATABASE_URL found in environment');
  console.log('Setting correct DATABASE_URL...');
  process.env.DATABASE_URL = CORRECT_DATABASE_URL;
  console.log('✅ DATABASE_URL SET');
}

console.log('');
console.log('Final DATABASE_URL:');
console.log('  postgresql://postgres:***@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres');
console.log('='.repeat(80));
console.log('');

// Now start the actual server
require('./server.js');
