/**
 * KEJAMARKET STARTUP - FORCE CORRECT DATABASE CONNECTION
 * Sets DATABASE_URL BEFORE and AFTER dotenv loads
 */

// Set it BEFORE anything loads
const CORRECT_DATABASE_URL = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

// Load dotenv (server.js will also call this, but we do it first)
require('dotenv').config();

// Force it AGAIN after dotenv (in case .env had wrong value)
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

// Also force other critical env vars
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '10000';

console.log('='.repeat(80));
console.log('KEJAMARKET STARTING - FORCED CONFIGURATION');
console.log('='.repeat(80));
console.log('✅ DATABASE_URL: postgres@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres');
console.log('✅ Environment: ' + process.env.NODE_ENV);
console.log('✅ Port: ' + process.env.PORT);
console.log('='.repeat(80));
console.log('');

// Now start the server with correct configuration
require('./server.js');
