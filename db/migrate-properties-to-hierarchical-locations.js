/**
 * KejaMarket - Property Location Migration Script
 * Migrates existing properties from flat estateSuburb to hierarchical locationHierarchyId
 * PRESERVES all existing data - no deletions, only additions
 */

const fs = require('fs');
const path = require('path');
const { LocationsHierarchy } = require('./locations-hierarchy');

const DATA_FILE = path.join(__dirname, 'data.json');
const BACKUP_FILE = path.join(__dirname, `data-backup-${Date.now()}.json`);

class PropertyLocationMigrator {
  constructor() {
    this.locationsDb = new LocationsHierarchy();
    this.data = null;
    this.stats = {
      total: 0,
      matched: 0,
      unmatched: 0,
      alreadyMigrated: 0,
      matchDetails: []
    };
  }

  /**
   * Load data.json
   */
  loadData() {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      this.data = JSON.parse(raw);
      console.log(`✅ Loaded data.json with ${this.data.properties?.length || 0} properties`);
      return true;
    } catch (err) {
      console.error('❌ Error loading data.json:', err.message);
      return false;
    }
  }

  /**
   * Create backup before migration
   */
  createBackup() {
    try {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      console.log(`✅ Created backup at: ${BACKUP_FILE}`);
      return true;
    } catch (err) {
      console.error('❌ Error creating backup:', err.message);
      return false;
    }
  }

  /**
   * Get all ancestor IDs for a location (for locationPathIds)
   */
  getLocationPathIds(locationId) {
    const pathIds = [locationId];
    let current = this.locationsDb.getById(locationId);
    
    while (current && current.parentId) {
      pathIds.unshift(current.parentId);
      current = this.locationsDb.getById(current.parentId);
    }
    
    return pathIds;
  }

  /**
   * Find best matching location for a property
   */
  findMatchingLocation(property) {
    const estateSuburb = (property.estateSuburb || '').trim();
    const county = (property.county || '').trim();
    const exactLocation = (property.exactLocation || '').trim();
    const locationDisplay = (property.locationDisplay || property.displayLocation || '').trim();
    
    if (!estateSuburb) {
      return null;
    }

    // Strategy 1: Exact name match
    const exactMatch = this.locationsDb.locations.find(loc => 
      loc.name.toLowerCase() === estateSuburb.toLowerCase() && 
      loc.isActive
    );
    
    if (exactMatch) {
      return {
        location: exactMatch,
        matchType: 'exact',
        confidence: 100
      };
    }

    // Strategy 2: Search with fuzzy matching
    const searchResults = this.locationsDb.search(estateSuburb, 5);
    
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      
      // Check if county matches (if available)
      let countyMatches = true;
      if (county && topResult.county) {
        countyMatches = topResult.county.toLowerCase() === county.toLowerCase();
      }
      
      // Check confidence based on match score
      const confidence = topResult.matchScore || 70;
      
      if (confidence >= 70 && countyMatches) {
        return {
          location: topResult,
          matchType: 'fuzzy',
          confidence
        };
      }
    }

    // Strategy 3: Try exact location field
    if (exactLocation && exactLocation !== estateSuburb) {
      const exactLocResults = this.locationsDb.search(exactLocation, 3);
      if (exactLocResults.length > 0) {
        return {
          location: exactLocResults[0],
          matchType: 'exact_location',
          confidence: 80
        };
      }
    }

    // Strategy 4: Parse composite locations (e.g., "Kilimani, Nairobi")
    if (estateSuburb.includes(',')) {
      const parts = estateSuburb.split(',').map(p => p.trim());
      const primaryLocation = parts[0];
      
      const compositeResults = this.locationsDb.search(primaryLocation, 3);
      if (compositeResults.length > 0) {
        return {
          location: compositeResults[0],
          matchType: 'composite',
          confidence: 75
        };
      }
    }

    return null;
  }

  /**
   * Migrate a single property
   */
  migrateProperty(property) {
    // Check if already migrated
    if (property.locationHierarchyId) {
      this.stats.alreadyMigrated++;
      return 'already_migrated';
    }

    const matchResult = this.findMatchingLocation(property);
    
    if (!matchResult) {
      this.stats.unmatched++;
      this.stats.matchDetails.push({
        propertyId: property.id,
        title: property.title,
        estateSuburb: property.estateSuburb,
        county: property.county,
        status: 'NO_MATCH',
        reason: 'No matching location found in hierarchy'
      });
      return 'no_match';
    }

    const { location, matchType, confidence } = matchResult;
    
    // PRESERVE existing fields (legacy data)
    if (!property.legacyEstateSuburb) {
      property.legacyEstateSuburb = property.estateSuburb;
    }
    if (!property.legacyCounty) {
      property.legacyCounty = property.county;
    }

    // ADD new hierarchical location fields
    property.locationHierarchyId = location.id;
    property.locationName = location.name;
    property.locationFullPath = location.fullPath || location.name;
    property.locationPathIds = this.getLocationPathIds(location.id);
    property.locationCounty = location.county;
    property.locationSubCounty = location.subCounty;
    property.locationType = location.type;
    property.locationVerified = location.isVerified;
    
    // Update display fields to match hierarchy
    property.county = location.county || property.county;
    property.estateSuburb = location.name;
    property.locationDisplay = location.fullPath || `${location.name}, ${location.county}`;

    this.stats.matched++;
    this.stats.matchDetails.push({
      propertyId: property.id,
      title: property.title,
      originalLocation: property.legacyEstateSuburb,
      matchedLocation: location.name,
      fullPath: location.fullPath,
      matchType,
      confidence,
      status: 'MATCHED'
    });

    return 'migrated';
  }

  /**
   * Migrate all properties
   */
  migrateAll() {
    if (!this.data || !this.data.properties) {
      console.error('❌ No properties to migrate');
      return false;
    }

    console.log('\n🔄 Starting migration...\n');

    this.stats.total = this.data.properties.length;

    for (const property of this.data.properties) {
      this.migrateProperty(property);
    }

    return true;
  }

  /**
   * Save migrated data
   */
  saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log('\n✅ Saved migrated data to data.json');
      return true;
    } catch (err) {
      console.error('❌ Error saving data:', err.message);
      return false;
    }
  }

  /**
   * Generate migration report
   */
  generateReport() {
    const reportPath = path.join(__dirname, `migration-report-${Date.now()}.txt`);
    
    const report = `
========================================
KEJAMARKET LOCATION MIGRATION REPORT
========================================
Date: ${new Date().toISOString()}

SUMMARY
========================================
Total Properties:        ${this.stats.total}
Successfully Matched:    ${this.stats.matched} (${((this.stats.matched / this.stats.total) * 100).toFixed(1)}%)
Already Migrated:        ${this.stats.alreadyMigrated}
Unmatched:              ${this.stats.unmatched} (${((this.stats.unmatched / this.stats.total) * 100).toFixed(1)}%)

MATCH BREAKDOWN
========================================
${this.stats.matchDetails
  .filter(d => d.status === 'MATCHED')
  .map(d => `✓ ${d.propertyId}: "${d.originalLocation}" → "${d.matchedLocation}"
   Path: ${d.fullPath}
   Type: ${d.matchType}, Confidence: ${d.confidence}%`)
  .join('\n\n')}

${this.stats.unmatched > 0 ? `
UNMATCHED PROPERTIES (Need Manual Review)
========================================
${this.stats.matchDetails
  .filter(d => d.status === 'NO_MATCH')
  .map(d => `✗ ${d.propertyId}: "${d.title}"
   Location: ${d.estateSuburb}, ${d.county}
   Reason: ${d.reason}`)
  .join('\n\n')}

RECOMMENDATIONS FOR UNMATCHED
========================================
1. Review the locations above and add them to the hierarchy if they are valid
2. Or manually map these properties to the closest parent location
3. Some may be typos or outdated names that need correction
` : ''}

BACKUP FILE
========================================
Original data backed up to: ${BACKUP_FILE}

NEXT STEPS
========================================
1. Review this report for accuracy
2. Check unmatched properties and decide on manual mapping
3. Test the hierarchical search with migrated data
4. Deploy updated data.json to production

========================================
`;

    try {
      fs.writeFileSync(reportPath, report, 'utf-8');
      console.log(`\n📄 Migration report saved to: ${reportPath}`);
      return report;
    } catch (err) {
      console.error('❌ Error saving report:', err.message);
      return report;
    }
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Properties:      ${this.stats.total}`);
    console.log(`✓ Successfully Matched: ${this.stats.matched} (${((this.stats.matched / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`⚠ Already Migrated:     ${this.stats.alreadyMigrated}`);
    console.log(`✗ Unmatched:           ${this.stats.unmatched} (${((this.stats.unmatched / this.stats.total) * 100).toFixed(1)}%)`);
    console.log('='.repeat(60));
    
    if (this.stats.matched > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`   ${this.stats.matched} properties now have hierarchical location IDs`);
    }
    
    if (this.stats.unmatched > 0) {
      console.log(`\n⚠️  ${this.stats.unmatched} properties could not be automatically matched`);
      console.log('   These need manual review - see migration report for details');
    }
  }

  /**
   * Run full migration process
   */
  run() {
    console.log('🚀 KejaMarket Property Location Migration\n');

    // Step 1: Load data
    if (!this.loadData()) {
      return false;
    }

    // Step 2: Create backup
    if (!this.createBackup()) {
      console.error('❌ Failed to create backup. Migration aborted for safety.');
      return false;
    }

    // Step 3: Migrate
    if (!this.migrateAll()) {
      return false;
    }

    // Step 4: Save
    if (!this.saveData()) {
      console.error('❌ Failed to save migrated data. Check backup file.');
      return false;
    }

    // Step 5: Report
    this.generateReport();
    this.printSummary();

    return true;
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new PropertyLocationMigrator();
  const success = migrator.run();
  
  if (success) {
    console.log('\n✅ Migration complete! You can now:');
    console.log('   1. Review the migration report');
    console.log('   2. Test the hierarchical location search');
    console.log('   3. Handle any unmatched properties manually');
    process.exit(0);
  } else {
    console.error('\n❌ Migration failed. Check errors above.');
    console.error('   Original data is safe in backup file.');
    process.exit(1);
  }
}

module.exports = PropertyLocationMigrator;
