require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixProperties() {
  try {
    // Check current status distribution
    const statusDist = await pool.query('SELECT status, COUNT(*) as count FROM properties GROUP BY status ORDER BY count DESC');
    console.log('Current property status distribution:');
    statusDist.rows.forEach(row => {
      console.log(`  ${row.status || 'NULL'}: ${row.count}`);
    });
    console.log('');
    
    // Update ALL properties to approved status
    console.log('Setting ALL properties to status = "approved"...');
    const result = await pool.query(`
      UPDATE properties 
      SET status = 'approved'
      WHERE status IS NULL OR status != 'approved'
      RETURNING id
    `);
    
    console.log(`✅ Updated ${result.rows.length} properties to approved status`);
    
    // Verify
    const verify = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_verified = true) as verified,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE is_verified = true AND status = 'approved') as visible
      FROM properties
    `);
    
    console.log('');
    console.log('✅ Final stats:');
    console.log(`  Total: ${verify.rows[0].total}`);
    console.log(`  Verified: ${verify.rows[0].verified}`);
    console.log(`  Approved: ${verify.rows[0].approved}`);
    console.log(`  Visible: ${verify.rows[0].visible}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixProperties();
