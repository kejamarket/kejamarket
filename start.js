/**
 * KEJAMARKET STARTUP - NEW SUPABASE PROJECT
 * Forces correct DATABASE_URL - MULTIPLE TIMES TO ENSURE IT STICKS
 */

const CORRECT_DATABASE_URL = 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

// Set it BEFORE dotenv
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

// Load .env file
require('dotenv').config();

// FORCE it again AFTER dotenv (in case .env tries to override)
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

// Set other environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '10000';

// One more time for absolute certainty
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

console.log('='.repeat(80));
console.log('🚀 KEJAMARKET - FORCED DATABASE CONNECTION');
console.log('='.repeat(80));
console.log('DATABASE_URL:', CORRECT_DATABASE_URL);
console.log('ENV CHECK:', process.env.DATABASE_URL);
console.log('MATCH:', process.env.DATABASE_URL === CORRECT_DATABASE_URL ? '✅ YES' : '❌ NO');
console.log('='.repeat(80));
console.log('');

// Export for server.js to use directly if needed
global.KEJAMARKET_DATABASE_URL = CORRECT_DATABASE_URL;

require('./server.js');
