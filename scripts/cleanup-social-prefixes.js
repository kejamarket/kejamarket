/**
 * Script to clean up TikTok and Facebook prefixes from property titles and descriptions
 * Updates db/data.json, js/data/seedListings.js, and PostgreSQL properties table
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

function cleanText(text) {
  if (!text) return text;
  return text
    .replace(/^TikTok\s+(House\s+)?(Tours?|Hunting|Viral|Gem|Sensation):\s*/i, '')
    .replace(/^TikTok\s+Tour:\s*/i, '')
    .replace(/^Facebook\s+(Direct|Tours?|Marketplace):\s*/i, '')
    .trim();
}

async function runCleanup() {
  console.log('🧹 Starting cleanup of TikTok / Facebook prefixes...');

  // 1. Clean db/data.json
  const dataJsonPath = path.join(__dirname, '..', 'db', 'data.json');
  if (fs.existsSync(dataJsonPath)) {
    try {
      const raw = fs.readFileSync(dataJsonPath, 'utf8');
      const data = JSON.parse(raw);
      let modified = 0;

      if (Array.isArray(data.properties)) {
        data.properties.forEach(p => {
          const oldTitle = p.title;
          const newTitle = cleanText(oldTitle);
          if (oldTitle !== newTitle) {
            p.title = newTitle;
            modified++;
          }
        });
      }

      if (modified > 0) {
        fs.writeFileSync(dataJsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✅ Cleaned ${modified} titles in db/data.json`);
      } else {
        console.log('ℹ️ No titles needed cleaning in db/data.json');
      }
    } catch (err) {
      console.error('⚠️ Error cleaning db/data.json:', err.message);
    }
  }

  // 2. Clean js/data/seedListings.js
  const seedPath = path.join(__dirname, '..', 'js', 'data', 'seedListings.js');
  if (fs.existsSync(seedPath)) {
    try {
      let content = fs.readFileSync(seedPath, 'utf8');
      const originalLen = content.length;
      content = content.replace(/"(TikTok\s+(House\s+)?(Tours?|Hunting|Viral|Gem|Sensation):\s*|Facebook\s+(Direct|Tours?|Marketplace):\s*)/gi, '"');
      if (content.length !== originalLen) {
        fs.writeFileSync(seedPath, content, 'utf8');
        console.log('✅ Cleaned titles in js/data/seedListings.js');
      } else {
        console.log('ℹ️ No titles needed cleaning in js/data/seedListings.js');
      }
    } catch (err) {
      console.error('⚠️ Error cleaning seedListings.js:', err.message);
    }
  }

  // 3. Clean PostgreSQL properties if reachable with 5s timeout
  const dbUrl = global.KEJAMARKET_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    // Check if properties table exists
    const checkRes = await pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'properties'");
    if (parseInt(checkRes.rows[0].count, 10) > 0) {
      const res = await pool.query(`
        UPDATE properties
        SET title = REGEXP_REPLACE(title, '^(TikTok\\s+(House\\s+)?(Tours?|Hunting|Viral|Gem|Sensation):\\s*|Facebook\\s+(Direct|Tours?|Marketplace):\\s*)', '', 'i')
        WHERE title ~* '^(TikTok|Facebook)'
      `);
      console.log(`✅ Cleaned ${res.rowCount} rows in PostgreSQL properties table`);
    }
    await pool.end();
  } catch (dbErr) {
    console.warn('ℹ️ PostgreSQL update skipped/offline:', dbErr.message);
  }

  console.log('🎉 Cleanup script complete!');
}

runCleanup();
