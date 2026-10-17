/**
 * KEJAMARKET STARTUP - NEW SUPABASE PROJECT
 * Forces correct DATABASE_URL - MULTIPLE TIMES TO ENSURE IT STICKS
 * Using Connection Pooler for IPv4 compatibility
 */

const CORRECT_DATABASE_URL = 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

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
console.log('🚀 KEJAMARKET - FORCED DATABASE CONNECTION (Connection Pooler)');
console.log('='.repeat(80));
console.log('DATABASE_URL:', CORRECT_DATABASE_URL);
console.log('ENV CHECK:', process.env.DATABASE_URL);
console.log('MATCH:', process.env.DATABASE_URL === CORRECT_DATABASE_URL ? '✅ YES' : '❌ NO');
console.log('='.repeat(80));
console.log('');

// Export for server.js to use directly if needed
global.KEJAMARKET_DATABASE_URL = CORRECT_DATABASE_URL;

// Auto-seed database if empty
(async () => {
  try {
    const { Client } = require('pg');
    const fs = require('fs');
    const path = require('path');
    
    const client = new Client({ connectionString: CORRECT_DATABASE_URL });
    await client.connect();
    
    // Check if properties exist
    const result = await client.query('SELECT COUNT(*) FROM properties');
    const count = parseInt(result.rows[0].count);
    
    console.log(`📊 Database check: ${count} properties found`);
    
    if (count === 0) {
      console.log('🌱 Database is empty. Auto-seeding...\n');
      
      // Load and seed data
      const seedDataPath = path.join(__dirname, 'db', 'data.json');
      const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
      
      console.log(`   - Users to seed: ${seedData.users?.length || 0}`);
      console.log(`   - Properties to seed: ${seedData.properties?.length || 0}`);
      
      // Seed users
      for (const user of seedData.users || []) {
        try {
          await client.query(`
            INSERT INTO users (id, name, phone, email, password, role, is_admin, is_verified, is_phone_verified, num_properties, area, agency_name, contact_person, office_location, registration_no, coverage_area, created_at, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [
            user.id, user.name, user.phone, user.email || null, user.password || null,
            user.role || 'tenant', user.isAdmin || false, user.isVerified || false,
            user.isPhoneVerified || false, user.numProperties || null, user.area || null,
            user.agencyName || null, user.contactPerson || null, user.officeLocation || null,
            user.registrationNo || null, user.coverageArea || null,
            user.createdAt || new Date().toISOString(), JSON.stringify(user)
          ]);
        } catch (e) { /* skip */ }
      }
      
      // Seed properties
      for (const prop of seedData.properties || []) {
        try {
          await client.query(`
            INSERT INTO properties (
              id, title, description, category, rent_period, is_bnb, bedrooms, bathrooms,
              floor_level, rent_kes, deposit_kes, county, corridor_id, estate_suburb,
              exact_location, latitude, longitude, water_supply_type, electricity_meter_type,
              garbage_fee_kes, water_rate_kes, is_featured, is_top_ad, is_verified,
              status, posted_by, posted_date, last_edited, raw_data
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
              $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
            ) ON CONFLICT (id) DO NOTHING
          `, [
            prop.id, prop.title, prop.description || null, prop.category || null,
            prop.rentPeriod || null, prop.isBnb || false, prop.bedrooms || null,
            prop.bathrooms || null, prop.floorLevel || null, prop.rentKes || prop.rent || null,
            prop.depositKes || prop.deposit || null, prop.county || null, prop.corridorId || null,
            prop.estateSuburb || null, prop.exactLocation || null, prop.latitude || null,
            prop.longitude || null, prop.waterSupplyType || null, prop.electricityMeterType || null,
            prop.garbageFeeKes || null, prop.waterRateKes || null, prop.isFeatured || false,
            prop.isTopAd || false, prop.isVerified || false, prop.status || 'approved',
            prop.postedBy || null, prop.postedDate || new Date().toISOString(),
            prop.lastEdited || new Date().toISOString(), JSON.stringify(prop)
          ]);
        } catch (e) { /* skip */ }
      }
      
      const newCount = await client.query('SELECT COUNT(*) FROM properties');
      console.log(`✅ Seeding complete! Properties: ${newCount.rows[0].count}\n`);
    }
    
    await client.end();
  } catch (error) {
    console.error('⚠️  Auto-seed error:', error.message);
  }
  
  // Start server
  require('./server.js');
})();
