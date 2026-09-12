/**
 * KejaMarket: one-time JSON -> PostgreSQL migration
 *
 * Run from the project root:
 *   node scripts/migrate-json-to-postgres.js
 *
 * Requires:
 *   DATABASE_URL=<Render Internal Database URL>
 *   npm install pg
 *
 * This script DOES NOT delete or modify db/data.json.
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATA_FILE = path.join(__dirname, "..", "db", "data.json");
const SCHEMA_FILE = path.join(__dirname, "..", "db", "postgres-migration.sql");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.error(`ERROR: ${DATA_FILE} was not found.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const schema = fs.readFileSync(SCHEMA_FILE, "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function asInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function bool(value) {
  return value === true;
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("Connecting to PostgreSQL...");
    await client.query("SELECT 1");
    console.log("Connected.");

    console.log("Creating KejaMarket tables...");
    await client.query(schema);

    await client.query("BEGIN");

    // Clear only the tables created by this migration.
    // data.json remains untouched.
    await client.query(`
      TRUNCATE TABLE
        comments,
        messages,
        leads,
        alerts,
        transactions,
        property_reviews,
        property_media,
        properties,
        users
      RESTART IDENTITY CASCADE
    `);

    // USERS
    for (const u of data.users || []) {
      await client.query(
        `INSERT INTO users
          (id,name,phone,email,password,role,is_admin,is_verified,is_phone_verified,
           num_properties,area,agency_name,contact_person,office_location,
           registration_no,coverage_area,created_at,raw_data)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          u.id,
          u.name || "",
          u.phone || "",
          u.email || null,
          u.password || null,
          u.role || "tenant",
          bool(u.isAdmin),
          bool(u.isVerified),
          bool(u.isPhoneVerified),
          u.numProperties || null,
          u.area || null,
          u.agencyName || null,
          u.contactPerson || null,
          u.officeLocation || null,
          u.registrationNo || null,
          u.coverageArea || null,
          asDate(u.createdAt),
          u
        ]
      );
    }

    // PROPERTIES
    for (const p of data.properties || []) {
      const landlord = p.landlord || {};
      await client.query(
        `INSERT INTO properties
          (id,title,description,category,rent_period,is_bnb,bedrooms,bathrooms,floor_level,
           rent_kes,deposit_kes,county,corridor_id,estate_suburb,exact_location,
           latitude,longitude,water_supply_type,electricity_meter_type,
           garbage_fee_kes,water_rate_kes,is_featured,is_top_ad,is_verified,source,
           managed_by,agency_name,caretaker_name,caretaker_phone,landlord_id,
           created_at,posted_time_ago,raw_data)
         VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
           $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)`,
        [
          p.id,
          p.title || "",
          p.description || "",
          p.category || null,
          p.rentPeriod || "month",
          bool(p.isBnb),
          asInt(p.bedrooms),
          asInt(p.bathrooms),
          asInt(p.floorLevel),
          asNumber(p.rentKes),
          asNumber(p.depositKes),
          p.county || null,
          p.corridorId || null,
          p.estateSuburb || null,
          p.exactLocation || null,
          asNumber(p.latitude),
          asNumber(p.longitude),
          p.waterSupplyType || null,
          p.electricityMeterType || null,
          asNumber(p.garbageFeeKes),
          asNumber(p.waterRateKes),
          bool(p.isFeatured),
          bool(p.isTopAd),
          bool(p.isVerified),
          p.source || null,
          p.managedBy || null,
          p.agencyName || null,
          p.caretakerName || null,
          p.caretakerPhone || null,
          landlord.id || null,
          asDate(p.createdAt),
          p.postedTimeAgo || null,
          p
        ]
      );

      // Preserve all media exactly enough to reconstruct the listing.
      for (let i = 0; i < (p.media || []).length; i++) {
        const m = p.media[i] || {};
        const mediaId = `${p.id}-media-${i + 1}`;
        if (!m.url) continue;

        await client.query(
          `INSERT INTO property_media
            (id,property_id,image_url,caption,display_order,raw_data)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [mediaId, p.id, m.url, m.caption || null, i, m]
        );
      }
    }

    // REVIEWS: data.json stores these as { propertyId: [reviews...] }
    for (const [propertyId, reviews] of Object.entries(data.reviews || {})) {
      for (const r of reviews || []) {
        await client.query(
          `INSERT INTO property_reviews
            (id,property_id,author,rating_overall,rating_water,rating_security,
             rating_deposit,review_date,review_text,verified,raw_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (id) DO NOTHING`,
          [
            r.id || `review-${propertyId}-${Date.now()}-${Math.random()}`,
            propertyId,
            r.author || "Verified Tenant",
            asNumber(r.ratingOverall),
            asNumber(r.ratingWater),
            asNumber(r.ratingSecurity),
            asNumber(r.ratingDeposit),
            r.date || null,
            r.text || "",
            bool(r.verified),
            r
          ]
        );
      }
    }

    // TRANSACTIONS
    for (const t of data.transactions || []) {
      await client.query(
        `INSERT INTO transactions
          (id,checkout_request_id,merchant_request_id,phone,amount,item_type,item_name,
           target_property_id,user_id,status,mpesa_receipt,result_desc,created_at,updated_at,raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          t.id,
          t.checkoutRequestId || null,
          t.merchantRequestId || null,
          t.phone || null,
          asNumber(t.amount),
          t.itemType || null,
          t.itemName || null,
          t.targetPropertyId || null,
          t.userId || null,
          t.status || null,
          t.mpesaReceipt || null,
          t.resultDesc || null,
          asDate(t.createdAt),
          asDate(t.updatedAt),
          t
        ]
      );
    }

    // ALERTS
    for (const a of data.alerts || []) {
      await client.query(
        `INSERT INTO alerts
          (id,phone,category,estate,budget_min,budget_max,created_at,raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          a.id,
          a.phone || null,
          a.category || null,
          a.estate || null,
          a.budgetMin || null,
          a.budgetMax || null,
          asDate(a.createdAt),
          a
        ]
      );
    }

    // LEADS
    for (const l of data.leads || []) {
      await client.query(
        `INSERT INTO leads
          (id,type,name,phone,status,created_at,raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          l.id,
          l.type || null,
          l.name || null,
          l.phone || null,
          l.status || null,
          asDate(l.createdAt),
          l
        ]
      );
    }

    // MESSAGES
    for (const m of data.messages || []) {
      await client.query(
        `INSERT INTO messages
          (id,property_id,property_title,estate_suburb,sender_id,sender_name,sender_phone,
           recipient_id,recipient_name,text,is_read,created_at,raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          m.id,
          m.propertyId || null,
          m.propertyTitle || null,
          m.estateSuburb || null,
          m.senderId || m.fromUserId || null,
          m.senderName || null,
          m.senderPhone || null,
          m.recipientId || m.toUserId || null,
          m.recipientName || null,
          m.text || "",
          bool(m.isRead),
          asDate(m.createdAt),
          m
        ]
      );
    }

    // COMMENTS: data.json stores comments grouped by propertyId.
    for (const [propertyId, comments] of Object.entries(data.comments || {})) {
      for (const c of comments || []) {
        await client.query(
          `INSERT INTO comments
            (id,property_id,user_id,author,avatar,is_landlord,text,reactions,
             user_reactions,replies,created_at,raw_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO NOTHING`,
          [
            c.id || `comment-${propertyId}-${Date.now()}-${Math.random()}`,
            propertyId,
            c.userId || null,
            c.author || null,
            c.avatar || null,
            bool(c.isLandlord),
            c.text || "",
            c.reactions || {},
            c.userReactions || {},
            c.replies || [],
            asDate(c.createdAt),
            c
          ]
        );
      }
    }

    await client.query("COMMIT");

    // Verification
    const tables = [
      "users",
      "properties",
      "property_media",
      "property_reviews",
      "transactions",
      "alerts",
      "leads",
      "messages",
      "comments"
    ];

    console.log("\nMIGRATION COMPLETE. Counts:");
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count}`);
    }

    console.log("\nExpected from data.json:");
    console.log(`  users: ${data.users?.length || 0}`);
    console.log(`  properties: ${data.properties?.length || 0}`);
    console.log(`  reviews: ${Object.values(data.reviews || {}).reduce((n, a) => n + a.length, 0)}`);
    console.log(`  transactions: ${data.transactions?.length || 0}`);
    console.log(`  alerts: ${data.alerts?.length || 0}`);
    console.log(`  leads: ${data.leads?.length || 0}`);
    console.log(`  messages: ${data.messages?.length || 0}`);
    console.log(`  comments: ${Object.values(data.comments || {}).reduce((n, a) => n + a.length, 0)}`);

    console.log("\nIMPORTANT: db/data.json was NOT changed.");
    console.log("Do NOT delete it yet. The application still uses store.js/JSON until we refactor it.");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("\nMIGRATION FAILED.");
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
