// Load seed data to production Supabase
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadSeedToProduction() {
  // Use the corrected connection string
  const connectionString = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to production Supabase...');
    await client.connect();
    console.log('✅ Connected!');

    // Load seed data file
    const seedPath = path.join(__dirname, 'js', 'data', 'seedListings.js');
    const seedCode = fs.readFileSync(seedPath, 'utf8');
    
    // Extract SEED_PROPERTIES
    const sandbox = {};
    const fn = new Function('sandbox', `${seedCode}\nsandbox.SEED_PROPERTIES = SEED_PROPERTIES;`);
    fn(sandbox);
    const properties = sandbox.SEED_PROPERTIES || [];

    console.log(`📦 Loading ${properties.length} properties...\n`);

    let loaded = 0;
    for (const prop of properties) {
      try {
        // Check if property already exists
        const existing = await client.query('SELECT id FROM properties WHERE id = $1', [prop.id]);
        
        if (existing.rows.length > 0) {
          // Update to ensure is_verified = true
          await client.query('UPDATE properties SET is_verified = true WHERE id = $1', [prop.id]);
          console.log(`  ✓ Updated: ${prop.title}`);
        } else {
          // Insert new property
          await client.query(`
            INSERT INTO properties (
              id, title, description, category, rent_period, bedrooms, bathrooms,
              floor_level, rent_kes, deposit_kes, county, corridor_id,
              estate_suburb, exact_location, latitude, longitude,
              water_supply_type, electricity_meter_type, garbage_fee_kes, water_rate_kes,
              is_featured, is_top_ad, is_verified, source, managed_by, agency_name,
              caretaker_name, caretaker_phone, landlord_id, created_at, raw_data
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), $30
            )
          `, [
            prop.id,
            prop.title,
            prop.description || '',
            prop.category,
            prop.rentPeriod || 'monthly',
            prop.bedrooms || 0,
            prop.bathrooms || 0,
            prop.floorLevel || 0,
            prop.rentKes || 0,
            prop.depositKes || 0,
            prop.county || 'Nairobi',
            prop.corridorId || '',
            prop.estateSuburb || '',
            prop.exactLocation || '',
            prop.latitude || 0,
            prop.longitude || 0,
            prop.waterSupplyType || '',
            prop.electricityMeterType || '',
            prop.garbageFeeKes || 0,
            prop.waterRateKes || 0,
            prop.isFeatured || false,
            prop.isTopAd || false,
            true, // is_verified = TRUE
            prop.source || 'seed',
            prop.managedBy || 'landlord',
            prop.agencyName || null,
            prop.caretakerName || null,
            prop.caretakerPhone || null,
            prop.landlord?.id || 'usr-landlord-seed',
            JSON.stringify(prop)
          ]);

          // Insert images
          if (prop.images && Array.isArray(prop.images)) {
            for (let i = 0; i < prop.images.length; i++) {
              const img = prop.images[i];
              const imageUrl = typeof img === 'string' ? img : img.url;
              const caption = typeof img === 'object' ? img.caption : `Photo ${i + 1}`;
              
              await client.query(`
                INSERT INTO property_media (
                  id, property_id, image_url, caption, display_order, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING
              `, [
                `${prop.id}-img-${i}`,
                prop.id,
                imageUrl,
                caption,
                i,
                JSON.stringify({ type: 'image' })
              ]);
            }
          }

          console.log(`  ✓ Loaded: ${prop.title}`);
        }
        loaded++;
      } catch (err) {
        console.error(`  ✗ Failed: ${prop.title}`, err.message);
      }
    }

    console.log(`\n✅ Loaded ${loaded} properties to production!`);
    console.log('🔄 Restart your Render service to see the changes.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

loadSeedToProduction();
