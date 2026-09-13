/**
 * KEJAMARKET STARTUP - NEW SUPABASE PROJECT
 * Forces correct DATABASE_URL
 */

const CORRECT_DATABASE_URL = 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';
process.env.DATABASE_URL = CORRECT_DATABASE_URL;

require('dotenv').config();

process.env.DATABASE_URL = CORRECT_DATABASE_URL;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '10000';

console.log('='.repeat(80));
console.log('KEJAMARKET - NEW SUPABASE PROJECT');
console.log('='.repeat(80));
console.log('DATABASE: postgres@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres');
console.log('='.repeat(80));
console.log('');

require('./server.js');
