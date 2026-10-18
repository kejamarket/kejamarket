require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('render') || connectionString.includes('neon') || connectionString.includes('supabase')
    ? { rejectUnauthorized: false }
    : false
});

async function run() {
  try {
    const sqlPath = path.join(__dirname, 'viewing-booking-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running viewing booking migration...');
    await pool.query(sql);
    console.log('Viewing booking migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
