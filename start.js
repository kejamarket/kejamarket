/**
 * KEJAMARKET STARTUP - FORCE CORRECT DATABASE CONNECTION
 * This file ALWAYS uses the correct Supabase connection
 * Ignores any wrong environment variables
 */

// FORCE CORRECT DATABASE_URL - ALWAYS
process.env.DATABASE_URL = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';

console.log('='.repeat(60));
console.log('KEJAMARKET STARTING');
console.log('='.repeat(60));
console.log('✅ DATABASE_URL forced to correct Supabase connection');
console.log('   postgres@db.yvosarkfeukzdjxoenwe.supabase.co:5432');
console.log('='.repeat(60));
console.log('');

// Now start the actual server with correct DATABASE_URL
require('./server.js');
