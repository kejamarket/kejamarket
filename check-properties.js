require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkProperties() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_verified = true) as verified,
        COUNT(*) FILTER (WHERE status IN ('approved', 'verified')) as approved_status,
        COUNT(*) FILTER (WHERE is_verified = true AND status IN ('approved', 'verified')) as visible
      FROM properties
    `);
    
    const stats = result.rows[0];
    console.log('Property Statistics:');
    console.log('  Total properties:', stats.total);
    console.log('  Verified (is_verified=true):', stats.verified);
    console.log('  Approved status:', stats.approved_status);
    console.log('  Visible on site (verified AND approved):', stats.visible);
    console.log('');
    
    if (parseInt(stats.visible) === 0) {
      console.log('⚠️  No properties are visible because they need to be BOTH verified AND approved');
      console.log('');
      console.log('Fixing: Setting all properties to verified and approved...');
      
      const updated = await pool.query(`
        UPDATE properties 
        SET is_verified = true, 
            status = 'approved'
        WHERE is_verified IS NULL OR is_verified = false OR status IS NULL OR status = 'pending'
        RETURNING id
      `);
      
      console.log(`✅ Updated ${updated.rows.length} properties to verified and approved`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProperties();
