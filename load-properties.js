/**
 * Load 21 properties into NEW Supabase database
 */

require('dotenv').config();
const { Client } = require('pg');
const { SEED_PROPERTIES } = require('./js/data/seedListings.js');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

async function loadProperties() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');
    console.log(`Loading ${SEED_PROPERTIES.length} properties...\n`);

    let loaded = 0;
    for (const property of SEED_PROPERTIES) {
      try {
        const result = await client.query(`
          INSERT INTO properties (
            id, title, description, category, bedrooms, bathrooms, 
            floor_level, rent_kes, deposit_kes, county, corridor_id,
            estate_suburb, exact_location, latitude, longitude,
            water_supply_type, electricity_meter_type, garbage_fee_kes,
            water_rate_kes, is_featured, is_top_ad, is_verified,
            source, managed_by, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            is_verified = true
        `, [
          property.id, property.title, property.description, property.category,
          property.bedrooms, property.bathrooms, property.floorLevel,
          property.rentKes, property.depositKes, property.county, property.corridorId,
          property.estateSuburb, property.exactLocation, property.latitude, property.longitude,
          property.waterSupplyType, property.electricityMeterType, property.garbageFeeKes,
          property.waterRateKes, property.isFeatured || false, property.isTopAd || false,
          true, // is_verified
          property.source || 'seed', property.managedBy || 'landlord'
        ]);
        
        loaded++;
        console.log(`  ✓ ${loaded}. ${property.title.substring(0, 50)}...`);
      } catch (err) {
        console.error(`  ✗ Error loading ${property.id}:`, err.message);
      }
    }

    // Verify count
    const countResult = await client.query('SELECT COUNT(*) as total FROM properties WHERE is_verified = true');
    console.log(`\n✅ Total verified properties: ${countResult.rows[0].total}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

loadProperties();
