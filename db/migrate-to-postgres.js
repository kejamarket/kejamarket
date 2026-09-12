#!/usr/bin/env node
/**
 * KejaMarket Data Migration Script
 * Migrates data from JSON file to PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const JSON_FILE = path.join(__dirname, 'data.json');
const MIGRATION_SQL = path.join(__dirname, 'postgres-migration.sql');

async function runMigration() {
  console.log('🚀 Starting KejaMarket PostgreSQL Migration...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('Set your PostgreSQL connection string:');
    console.log('export DATABASE_URL="postgresql://username:password@host:port/database"');
    process.exit(1);
  }

  // Initialize PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    // Step 1: Run schema migration
    console.log('📋 Creating database schema...');
    const schemaSql = fs.readFileSync(MIGRATION_SQL, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Database schema created successfully');

    // Step 2: Load existing JSON data
    let jsonData = { users: [], properties: [], reviews: {}, transactions: [], messages: [], alerts: [], leads: [] };
    
    if (fs.existsSync(JSON_FILE)) {
      console.log('📁 Loading existing JSON data...');
      const rawData = fs.readFileSync(JSON_FILE, 'utf8');
      jsonData = JSON.parse(rawData);
      console.log(`✅ Loaded JSON data: ${jsonData.users?.length || 0} users, ${jsonData.properties?.length || 0} properties`);
    } else {
      console.log('⚠️  No existing JSON file found, migrating with empty data');
    }

    // Step 3: Migrate Users
    console.log('\n👥 Migrating users...');
    let userCount = 0;
    if (jsonData.users && jsonData.users.length > 0) {
      for (const user of jsonData.users) {
        try {
          await pool.query(`
            INSERT INTO users (
              id, name, phone, email, password, role, is_admin, is_verified, 
              is_phone_verified, num_properties, area, agency_name, contact_person, 
              office_location, registration_no, coverage_area, created_at, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [
            user.id, user.name, user.phone, user.email, user.password, user.role,
            user.isAdmin || false, user.isVerified || false, user.isPhoneVerified || false,
            user.numProperties, user.area, user.agencyName, user.contactPerson,
            user.officeLocation, user.registrationNo, user.coverageArea,
            user.createdAt || new Date().toISOString(),
            JSON.stringify(user)
          ]);
          userCount++;
        } catch (err) {
          console.log(`⚠️  Skipped user ${user.id}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated ${userCount} users`);

    // Step 4: Migrate Properties
    console.log('\n🏠 Migrating properties...');
    let propertyCount = 0;
    if (jsonData.properties && jsonData.properties.length > 0) {
      for (const property of jsonData.properties) {
        try {
          await pool.query(`
            INSERT INTO properties (
              id, title, description, category, rent_period, is_bnb, bedrooms, bathrooms,
              floor_level, rent_kes, deposit_kes, county, corridor_id, estate_suburb,
              exact_location, latitude, longitude, water_supply_type, electricity_meter_type,
              garbage_fee_kes, water_rate_kes, is_featured, is_top_ad, is_verified,
              source, managed_by, agency_name, caretaker_name, caretaker_phone,
              landlord_id, created_at, posted_time_ago, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
            ON CONFLICT (id) DO NOTHING
          `, [
            property.id, property.title, property.description, property.category,
            property.rentPeriod || 'monthly', property.isBnb || false,
            property.bedrooms || 0, property.bathrooms || 0, property.floorLevel || 0,
            property.rent || 0, property.deposit || 0, property.county || 'Nairobi',
            property.corridorId, property.estateSuburb, property.exactLocation,
            property.latitude, property.longitude, property.waterSupplyType,
            property.electricityMeterType, property.garbageFee || 0,
            property.waterRate || 0, property.isFeatured || false,
            property.isTopAd || false, property.isVerified || false,
            property.source, property.managedBy, property.agencyName,
            property.caretakerName, property.caretakerPhone, property.landlordId,
            property.createdAt || new Date().toISOString(),
            property.postedTimeAgo || 'Just now', JSON.stringify(property)
          ]);

          // Migrate property photos
          if (property.photos && property.photos.length > 0) {
            for (let i = 0; i < property.photos.length; i++) {
              await pool.query(`
                INSERT INTO property_media (id, property_id, image_url, caption, display_order, raw_data)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING
              `, [
                `media-${property.id}-${i}`, property.id, property.photos[i],
                '', i, JSON.stringify({})
              ]);
            }
          }

          propertyCount++;
        } catch (err) {
          console.log(`⚠️  Skipped property ${property.id}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated ${propertyCount} properties`);

    // Step 5: Migrate Reviews
    console.log('\n⭐ Migrating reviews...');
    let reviewCount = 0;
    if (jsonData.reviews && typeof jsonData.reviews === 'object') {
      for (const [propertyId, reviews] of Object.entries(jsonData.reviews)) {
        if (Array.isArray(reviews)) {
          for (const review of reviews) {
            try {
              await pool.query(`
                INSERT INTO property_reviews (
                  id, property_id, author, rating_overall, rating_water, rating_security,
                  rating_deposit, review_date, review_text, verified, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO NOTHING
              `, [
                review.id || `rev-${propertyId}-${Date.now()}`, propertyId, review.author,
                review.ratingOverall || 5.0, review.ratingWater || 5.0,
                review.ratingSecurity || 5.0, review.ratingDeposit || 5.0,
                review.date, review.text, review.verified || false,
                JSON.stringify(review)
              ]);
              reviewCount++;
            } catch (err) {
              console.log(`⚠️  Skipped review: ${err.message}`);
            }
          }
        }
      }
    }
    console.log(`✅ Migrated ${reviewCount} reviews`);

    // Step 6: Migrate Transactions
    console.log('\n💰 Migrating transactions...');
    let txCount = 0;
    if (jsonData.transactions && jsonData.transactions.length > 0) {
      for (const tx of jsonData.transactions) {
        try {
          await pool.query(`
            INSERT INTO transactions (
              id, checkout_request_id, merchant_request_id, phone, amount,
              item_type, item_name, target_property_id, user_id, status,
              mpesa_receipt, result_desc, created_at, updated_at, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING
          `, [
            tx.id, tx.checkoutRequestId, tx.merchantRequestId, tx.phone, tx.amount,
            tx.itemType, tx.itemName, tx.targetPropertyId, tx.userId, tx.status,
            tx.mpesaReceipt, tx.resultDesc, tx.createdAt, tx.updatedAt,
            JSON.stringify(tx)
          ]);
          txCount++;
        } catch (err) {
          console.log(`⚠️  Skipped transaction ${tx.id}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated ${txCount} transactions`);

    // Step 7: Migrate Messages
    console.log('\n💬 Migrating messages...');
    let msgCount = 0;
    if (jsonData.messages && jsonData.messages.length > 0) {
      for (const msg of jsonData.messages) {
        try {
          await pool.query(`
            INSERT INTO messages (
              id, property_id, property_title, estate_suburb, sender_id, sender_name,
              sender_phone, recipient_id, recipient_name, text, is_read, created_at, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
          `, [
            msg.id, msg.propertyId, msg.propertyTitle, msg.estateSuburb,
            msg.senderId, msg.senderName, msg.senderPhone, msg.recipientId,
            msg.recipientName, msg.text, msg.isRead || false, msg.createdAt,
            JSON.stringify(msg)
          ]);
          msgCount++;
        } catch (err) {
          console.log(`⚠️  Skipped message ${msg.id}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated ${msgCount} messages`);

    // Step 8: Migrate Alerts & Leads
    console.log('\n🔔 Migrating alerts and leads...');
    let alertCount = 0, leadCount = 0;
    
    if (jsonData.alerts && jsonData.alerts.length > 0) {
      for (const alert of jsonData.alerts) {
        try {
          await pool.query(`
            INSERT INTO alerts (id, phone, category, estate, budget_min, budget_max, created_at, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING
          `, [
            alert.id, alert.phone, alert.category, alert.estate,
            alert.budgetMin, alert.budgetMax, alert.createdAt, JSON.stringify(alert)
          ]);
          alertCount++;
        } catch (err) {
          console.log(`⚠️  Skipped alert: ${err.message}`);
        }
      }
    }

    if (jsonData.leads && jsonData.leads.length > 0) {
      for (const lead of jsonData.leads) {
        try {
          await pool.query(`
            INSERT INTO leads (id, type, name, phone, status, created_at, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
          `, [
            lead.id, lead.type, lead.name, lead.phone,
            lead.status || 'pending', lead.createdAt, JSON.stringify(lead)
          ]);
          leadCount++;
        } catch (err) {
          console.log(`⚠️  Skipped lead: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated ${alertCount} alerts and ${leadCount} leads`);

    // Step 9: Create indexes for performance
    console.log('\n⚡ Creating performance indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_properties_rent_range ON properties(rent_kes);
      CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(estate_suburb, county);
      CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured, is_top_ad);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_property ON messages(property_id);
      CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, recipient_id);
    `);
    console.log('✅ Performance indexes created');

    // Final verification
    console.log('\n📊 Migration Summary:');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM properties) as properties,
        (SELECT COUNT(*) FROM property_reviews) as reviews,
        (SELECT COUNT(*) FROM transactions) as transactions,
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM alerts) as alerts,
        (SELECT COUNT(*) FROM leads) as leads
    `);

    const counts = stats.rows[0];
    console.log(`👥 Users: ${counts.users}`);
    console.log(`🏠 Properties: ${counts.properties}`);
    console.log(`⭐ Reviews: ${counts.reviews}`);
    console.log(`💰 Transactions: ${counts.transactions}`);
    console.log(`💬 Messages: ${counts.messages}`);
    console.log(`🔔 Alerts: ${counts.alerts}`);
    console.log(`📞 Leads: ${counts.leads}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('Your KejaMarket database is now ready to handle 50,000+ users.');

    // Create backup of JSON file
    if (fs.existsSync(JSON_FILE)) {
      const backupFile = JSON_FILE + '.backup-' + Date.now();
      fs.copyFileSync(JSON_FILE, backupFile);
      console.log(`📁 JSON backup created: ${path.basename(backupFile)}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  runMigration().catch(console.error);
}

module.exports = runMigration;