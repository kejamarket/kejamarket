require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='properties'")
  .then(r => {
    console.log('PROPERTIES COLUMNS:', r.rows.map(x => x.column_name).join(', '));
    return pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='viewing_requests'");
  })
  .then(r => {
    console.log('VIEWING_REQUESTS COLUMNS:', r.rows.map(x => x.column_name).join(', '));
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
