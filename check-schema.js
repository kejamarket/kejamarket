const {Client} = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres',
  ssl: {rejectUnauthorized: false}
});

client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties' ORDER BY ordinal_position"))
  .then(r => {
    console.log('Properties table columns:');
    r.rows.forEach(col => console.log('  -', col.column_name));
    return client.end();
  })
  .catch(e => console.error(e.message));
