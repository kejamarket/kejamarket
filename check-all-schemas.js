const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchemas() {
  const client = await pool.connect();
  
  try {
    const tables = ['services', 'marketplace_items', 'properties'];
    
    for (const table of tables) {
      console.log(`\n=== ${table.toUpperCase()} TABLE ===`);
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      console.log('Columns:');
      result.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchemas();
