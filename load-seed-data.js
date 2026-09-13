// Load seed listings into Supabase PostgreSQL
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadSeedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Load seed data file
    const seedPath = path.join(__dirname, 'js', 'data', 'seedListings.js');
    const seedCode = fs.readFileSync(seedPath, 'utf8');
    
    // Extract the SEED_PROPERTIES array using eval in sandboxed context
    const sandbox = {};
    const fn = new Function('sandbox', `${seedCode}\nsandbox.SEED_PROPERTIES = SEED_PROPERTIES;`);
    fn(sandbox);
    const properties = sandbox.SEED_PROPERTIES || [];

    console.log(`📦 Found ${properties.length} seed properties to load\n`);

    let propertiesLoaded = 0;
    let servicesLoaded = 0;
    let itemsLoaded = 0;

    for (const prop of properties) {
      try {
        // Determine if it's a property, service, or marketplace item
        const isService = prop.serviceType || prop.service_type;
        const isMarketplaceItem = prop.itemCategory || prop.item_category;

        if (isService) {
          // Insert into services table
          await client.query(`
            INSERT INTO services (
              id, title, description, service_type, price_min, price_max,
              provider_name, provider_phone, provider_whatsapp,
              location_area, is_verified, created_at, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
            ON CONFLICT (id) DO NOTHING
          `, [
            prop.id,
            prop.title,
            prop.description || '',
            prop.serviceType || prop.service_type,
            prop.priceMin || prop.price_min || 0,
            prop.priceMax || prop.price_max || 0,
            prop.providerName || prop.provider_name || 'Service Provider',
            prop.providerPhone || prop.provider_phone || '0700000000',
            prop.providerWhatsapp || prop.provider_whatsapp || '0700000000',
            prop.locationArea || prop.location_area || 'Nairobi',
            true, // is_verified
            JSON.stringify(prop)
          ]);
          servicesLoaded++;
          console.log(`  ✓ Service: ${prop.title}`);

        } else if (isMarketplaceItem) {
          // Insert into marketplace_items table
          await client.query(`
            INSERT INTO marketplace_items (
              id, title, description, category, price_kes,
              condition, seller_name, seller_phone, seller_whatsapp,
              location_suburb, is_verified, created_at, images, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, $13)
            ON CONFLICT (id) DO NOTHING
          `, [
            prop.id,
            prop.title,
            prop.description || '',
            prop.itemCategory || prop.item_category || 'General',
            prop.priceKes || prop.price_kes || 0,
            prop.condition || 'Used',
            prop.sellerName || prop.seller_name || 'Seller',
            prop.sellerPhone || prop.seller_phone || '0700000000',
            prop.sellerWhatsapp || prop.seller_whatsapp || '0700000000',
            prop.locationSuburb || prop.location_suburb || 'Nairobi',
            true, // is_verified
            JSON.stringify(prop.images || []),
            JSON.stringify(prop)
          ]);
          itemsLoaded++;
          console.log(`  ✓ Item: ${prop.title}`);

        } else {
          // Insert into properties table
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
            ON CONFLICT (id) DO NOTHING
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
            true, // is_verified
            prop.source || 'seed',
            prop.managedBy || 'landlord',
            prop.agencyName || null,
            prop.caretakerName || null,
            prop.caretakerPhone || null,
            prop.landlord?.id || 'usr-landlord-seed',
            JSON.stringify(prop)
          ]);

          // Insert images if available
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

          propertiesLoaded++;
          console.log(`  ✓ Property: ${prop.title}`);
        }

      } catch (err) {
        console.error(`  ✗ Failed to load: ${prop.title}`, err.message);
      }
    }

    console.log('\n📊 Loading Summary:');
    console.log(`  ✓ Properties: ${propertiesLoaded}`);
    console.log(`  ✓ Services: ${servicesLoaded}`);
    console.log(`  ✓ Marketplace Items: ${itemsLoaded}`);
    console.log(`  ✓ Total: ${propertiesLoaded + servicesLoaded + itemsLoaded}`);

    console.log('\n🎉 Seed data loaded successfully!');
  } catch (err) {
    console.error('❌ Loading failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

loadSeedData();
