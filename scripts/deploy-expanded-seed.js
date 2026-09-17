/**
 * Merges the 59 new authentic listings into js/data/seedListings.js,
 * syncs db/data.json, and executes load-seed-data.js.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateNewListings } = require('./populate-authentic-listings.js');

const SEED_FILE = path.join(__dirname, '../js/data/seedListings.js');
const DB_DATA_FILE = path.join(__dirname, '../db/data.json');

function main() {
  console.log('🚀 Starting authentic listings deployment...');

  // 1. Generate new listings
  const newListings = generateNewListings();
  console.log(`✨ Generated ${newListings.length} new authentic listings`);

  // 2. Read existing seed listings
  const originalContent = fs.readFileSync(SEED_FILE, 'utf8');
  const existingSeed = require(SEED_FILE);
  const existingProperties = existingSeed.SEED_PROPERTIES || [];
  const existingIds = new Set(existingProperties.map(p => p.id));

  // Filter out any ID collisions
  const toAdd = newListings.filter(p => !existingIds.has(p.id));
  console.log(`📦 Adding ${toAdd.length} new properties to existing ${existingProperties.length} properties...`);

  // 3. Find end of SEED_PROPERTIES array
  const reviewsMarker = 'const SEED_REVIEWS';
  const markerIdx = originalContent.indexOf(reviewsMarker);
  if (markerIdx === -1) {
    throw new Error('Could not find const SEED_REVIEWS marker in seedListings.js');
  }

  // Find the closing bracket of SEED_PROPERTIES right before SEED_REVIEWS
  const beforeMarker = originalContent.substring(0, markerIdx);
  const lastBracketIdx = beforeMarker.lastIndexOf('];');
  if (lastBracketIdx === -1) {
    throw new Error('Could not find closing bracket ]; of SEED_PROPERTIES');
  }

  // Format the new properties as JSON with indentation
  const formattedNewProps = toAdd.map(p => '  ' + JSON.stringify(p, null, 2).replace(/\n/g, '\n  ')).join(',\n');

  // Insert before the last bracket
  const updatedContent = 
    beforeMarker.substring(0, lastBracketIdx).trimEnd() + 
    ',\n' + 
    formattedNewProps + 
    '\n];\n\n' + 
    originalContent.substring(markerIdx);

  fs.writeFileSync(SEED_FILE, updatedContent, 'utf8');
  console.log('✅ Updated js/data/seedListings.js successfully');

  // Validate the updated file
  delete require.cache[require.resolve(SEED_FILE)];
  const reloaded = require(SEED_FILE);
  console.log(`🎯 Validated: SEED_PROPERTIES now has ${reloaded.SEED_PROPERTIES.length} total properties!`);

  // 4. Update db/data.json
  if (fs.existsSync(DB_DATA_FILE)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(DB_DATA_FILE, 'utf8'));
      dbData.properties = dbData.properties || [];
      const dbIds = new Set(dbData.properties.map(p => p.id));
      
      toAdd.forEach(p => {
        if (!dbIds.has(p.id)) {
          dbData.properties.push({
            ...p,
            status: 'approved',
            isApproved: true,
            isVerified: true
          });
        }
      });

      fs.writeFileSync(DB_DATA_FILE, JSON.stringify(dbData, null, 2), 'utf8');
      console.log(`✅ Updated db/data.json with properties (total: ${dbData.properties.length})`);
    } catch (e) {
      console.warn('⚠️ Could not update db/data.json:', e.message);
    }
  }

  // 5. Run load-seed-data.js to load to Supabase / PostgreSQL
  console.log('🔌 Running node load-seed-data.js to sync with database...');
  try {
    const output = execSync('node load-seed-data.js', { 
      cwd: path.join(__dirname, '..'), 
      encoding: 'utf8',
      stdio: 'pipe' 
    });
    console.log(output);
  } catch (err) {
    console.error('❌ load-seed-data.js error:', err.stdout || err.message);
  }

  console.log('🎉 Deployment complete!');
}

main();
