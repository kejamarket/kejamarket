const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyData() {
  const client = await pool.connect();
  
  try {
    console.log('=== DATABASE VERIFICATION ===\n');
    
    // Check properties
    const properties = await client.query('SELECT COUNT(*) FROM properties');
    console.log(`✓ Properties: ${properties.rows[0].count}`);
    
    // Check services
    const services = await client.query('SELECT COUNT(*) FROM services');
    console.log(`✓ Services: ${services.rows[0].count}`);
    
    // Check marketplace items
    const marketplace = await client.query('SELECT COUNT(*) FROM marketplace_items');
    console.log(`✓ Marketplace Items: ${marketplace.rows[0].count}`);
    
    // Check users
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✓ Users: ${users.rows[0].count}`);
    
    console.log('\n=== SAMPLE DATA ===\n');
    
    // Sample properties
    const sampleProps = await client.query('SELECT title, rent_kes, estate_suburb FROM properties LIMIT 3');
    console.log('Properties:');
    sampleProps.rows.forEach(p => console.log(`  - ${p.title} (KES ${p.rent_kes}) in ${p.estate_suburb}`));
    
    // Sample services
    const sampleServices = await client.query('SELECT title, service_type, provider_phone FROM services LIMIT 3');
    console.log('\nServices:');
    sampleServices.rows.forEach(s => console.log(`  - ${s.title} (${s.service_type}) - ${s.provider_phone}`));
    
    // Sample marketplace
    const sampleItems = await client.query('SELECT title, category, price_kes FROM marketplace_items LIMIT 3');
    console.log('\nMarketplace Items:');
    sampleItems.rows.forEach(i => console.log(`  - ${i.title} (${i.category}) - KES ${i.price_kes}`));
    
    console.log('\n✅ Database verification complete!\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyData();
