#!/usr/bin/env node
/**
 * Seed PostgreSQL Database with data from db/data.json
 * Run this after migration to populate the database
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  console.log('🌱 Starting database seed...\n');
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Load seed data
    const seedDataPath = path.join(__dirname, 'db', 'data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
    
    console.log('\n📊 Seed Data:');
    console.log(`   - Users: ${seedData.users?.length || 0}`);
    console.log(`   - Properties: ${seedData.properties?.length || 0}`);
    console.log(`   - Services: ${seedData.services?.length || 0}`);
    console.log(`   - Marketplace Items: ${seedData.marketplace_items?.length || 0}`);
    
    // Seed users
    console.log('\n👥 Seeding users...');
    for (const user of seedData.users || []) {
      try {
        await client.query(`
          INSERT INTO users (id, name, phone, email, password, role, is_admin, is_verified, is_phone_verified, num_properties, area, agency_name, contact_person, office_location, registration_no, coverage_area, created_at, raw_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id,
          user.name,
          user.phone,
          user.email || null,
          user.password || null,
          user.role || 'tenant',
          user.isAdmin || user.is_admin || false,
          user.isVerified || user.is_verified || false,
          user.isPhoneVerified || user.is_phone_verified || false,
          user.numProperties || user.num_properties || null,
          user.area || null,
          user.agencyName || user.agency_name || null,
          user.contactPerson || user.contact_person || null,
          user.officeLocation || user.office_location || null,
          user.registrationNo || user.registration_no || null,
          user.coverageArea || user.coverage_area || null,
          user.createdAt || user.created_at || new Date().toISOString(),
          JSON.stringify(user)
        ]);
      } catch (e) {
        // Duplicate key or other error - skip
      }
    }
    console.log(`✅ Seeded ${seedData.users?.length || 0} users`);
    
    // Seed properties
    console.log('\n🏠 Seeding properties...');
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
          prop.id,
          prop.title,
          prop.description || null,
          prop.category || null,
          prop.rentPeriod || prop.rent_period || null,
          prop.isBnb || prop.is_bnb || false,
          prop.bedrooms || null,
          prop.bathrooms || null,
          prop.floorLevel || prop.floor_level || null,
          prop.rentKes || prop.rent_kes || prop.rent || null,
          prop.depositKes || prop.deposit_kes || prop.deposit || null,
          prop.county || null,
          prop.corridorId || prop.corridor_id || null,
          prop.estateSuburb || prop.estate_suburb || null,
          prop.exactLocation || prop.exact_location || null,
          prop.latitude || null,
          prop.longitude || null,
          prop.waterSupplyType || prop.water_supply_type || null,
          prop.electricityMeterType || prop.electricity_meter_type || null,
          prop.garbageFeeKes || prop.garbage_fee_kes || null,
          prop.waterRateKes || prop.water_rate_kes || null,
          prop.isFeatured || prop.is_featured || false,
          prop.isTopAd || prop.is_top_ad || false,
          prop.isVerified || prop.is_verified || false,
          prop.status || 'approved',
          prop.postedBy || prop.posted_by || null,
          prop.postedDate || prop.posted_date || new Date().toISOString(),
          prop.lastEdited || prop.last_edited || new Date().toISOString(),
          JSON.stringify(prop)
        ]);
      } catch (e) {
        console.error(`Error seeding property ${prop.id}:`, e.message);
      }
    }
    console.log(`✅ Seeded ${seedData.properties?.length || 0} properties`);
    
    await client.end();
    console.log('\n✅ Database seeding complete!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
