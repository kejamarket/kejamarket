require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
console.log('Testing URL:', url.substring(0, 60) + '...');

const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    // Get columns of properties table
    const cols = await p.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties' ORDER BY ordinal_position`);
    console.log('Properties columns:');
    cols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    // Get a sample row
    const sample = await p.query('SELECT * FROM properties LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('\nSample row keys:', Object.keys(sample.rows[0]).join(', '));
      console.log('Sample rent value:', sample.rows[0].rent_kes || sample.rows[0].rent || sample.rows[0].price || 'N/A');
      console.log('Sample status:', sample.rows[0].status || sample.rows[0].is_verified || 'N/A');
    }

    // Check users table
    const userCount = await p.query('SELECT COUNT(*) FROM users');
    console.log('\nUser count:', userCount.rows[0].count);

    // Check services table
    const svcCount = await p.query("SELECT COUNT(*) FROM services");
    console.log('Service count:', svcCount.rows[0].count);

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await p.end();
  }
}

run();
