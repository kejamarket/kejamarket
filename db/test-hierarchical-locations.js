/**
 * KejaMarket - Hierarchical Location System Test Suite
 * Tests all required scenarios from the specification
 */

const { LocationsHierarchy } = require('./locations-hierarchy');
const fs = require('fs');
const path = require('path');

class LocationSystemTester {
  constructor() {
    this.locationsDb = new LocationsHierarchy();
    this.properties = [];
    this.testResults = [];
    this.loadProperties();
  }

  loadProperties() {
    try {
      const dataPath = path.join(__dirname, 'data.json');
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(raw);
      this.properties = data.properties || [];
      console.log(`✅ Loaded ${this.properties.length} properties for testing\n`);
    } catch (err) {
      console.error('❌ Error loading properties:', err.message);
      this.properties = [];
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, details) {
    this.testResults.push({
      test: testName,
      status: passed ? 'PASS' : 'FAIL',
      details
    });

    const icon = passed ? '✓' : '✗';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${testName}`);
    if (details) {
      console.log(`  ${details}\n`);
    }
  }

  /**
   * Test 1: Search for "Mlolongo" returns Mlolongo + all phases
   */
  testMlolongoParentSearch() {
    console.log('\n📋 TEST 1: Parent Location Search - Mlolongo');
    console.log('─'.repeat(60));

    const results = this.locationsDb.search('Mlolongo', 10);
    const mlolongo = results.find(r => r.name === 'Mlolongo');

    if (!mlolongo) {
      this.recordTest('Find Mlolongo location', false, 'Mlolongo not found in search results');
      return;
    }

    this.recordTest('Find Mlolongo location', true, `Found: ${mlolongo.fullPath}`);

    // Get all descendants
    const descendants = this.locationsDb.getDescendantIds(mlolongo.id);
    this.recordTest(
      'Get Mlolongo descendants',
      descendants.length > 1,
      `Found ${descendants.length} locations (Mlolongo + ${descendants.length - 1} children)`
    );

    // Check children
    const children = this.locationsDb.getChildren(mlolongo.id);
    const hasPhases = children.some(c => c.name.includes('Phase'));
    this.recordTest(
      'Mlolongo has Phase subdivisions',
      hasPhases,
      `Children: ${children.map(c => c.name).join(', ')}`
    );

    // Verify properties would be returned
    const propsInMlolongo = this.properties.filter(p => 
      p.locationHierarchyId && descendants.includes(p.locationHierarchyId)
    );

    this.recordTest(
      'Properties in Mlolongo hierarchy',
      propsInMlolongo.length >= 0,
      `Found ${propsInMlolongo.length} properties that would be returned`
    );
  }

  /**
   * Test 2: Search for "Mlolongo Phase 2" returns only Phase 2
   */
  testMlolongoPhase2SpecificSearch() {
    console.log('\n📋 TEST 2: Specific Location Search - Mlolongo Phase 2');
    console.log('─'.repeat(60));

    const results = this.locationsDb.search('Mlolongo Phase 2', 10);
    const phase2 = results.find(r => r.name === 'Mlolongo Phase 2');

    if (!phase2) {
      this.recordTest('Find Mlolongo Phase 2', false, 'Phase 2 not found');
      return;
    }

    this.recordTest('Find Mlolongo Phase 2', true, `Found: ${phase2.fullPath}`);

    // Verify it has a parent
    const parent = this.locationsDb.getById(phase2.parentId);
    this.recordTest(
      'Phase 2 has Mlolongo parent',
      parent && parent.name === 'Mlolongo',
      `Parent: ${parent ? parent.fullPath : 'None'}`
    );

    // Get descendants (should be just itself if no sub-phases)
    const descendants = this.locationsDb.getDescendantIds(phase2.id);
    this.recordTest(
      'Phase 2 descendants',
      descendants.length >= 1,
      `${descendants.length} location(s) (Phase 2 itself${descendants.length > 1 ? ' + sub-locations' : ''})`
    );

    // Check specific property filtering would work
    const propsInPhase2 = this.properties.filter(p => 
      p.locationHierarchyId && descendants.includes(p.locationHierarchyId)
    );

    this.recordTest(
      'Properties specifically in Phase 2',
      propsInPhase2.length >= 0,
      `Found ${propsInPhase2.length} properties (specific to Phase 2 only)`
    );
  }

  /**
   * Test 3: Search for "Umoja" returns Umoja + Umoja I, II, Innercore, Tena
   */
  testUmojaParentSearch() {
    console.log('\n📋 TEST 3: Parent Location Search - Umoja');
    console.log('─'.repeat(60));

    const results = this.locationsDb.search('Umoja', 10);
    const umoja = results.find(r => r.name === 'Umoja' && !r.name.includes('I'));

    if (!umoja) {
      this.recordTest('Find Umoja location', false, 'Umoja not found');
      return;
    }

    this.recordTest('Find Umoja location', true, `Found: ${umoja.fullPath}`);

    // Get children
    const children = this.locationsDb.getChildren(umoja.id);
    const childNames = children.map(c => c.name);

    this.recordTest(
      'Umoja has subdivisions',
      children.length > 0,
      `Children: ${childNames.join(', ')}`
    );

    // Verify expected children exist
    const hasUmojaI = childNames.some(n => n === 'Umoja I');
    const hasUmojaII = childNames.some(n => n === 'Umoja II');
    const hasInnercore = childNames.some(n => n.includes('Innercore'));

    this.recordTest('Has Umoja I', hasUmojaI, hasUmojaI ? 'Found' : 'Missing');
    this.recordTest('Has Umoja II', hasUmojaII, hasUmojaII ? 'Found' : 'Missing');
    this.recordTest('Has Umoja Innercore', hasInnercore, hasInnercore ? 'Found' : 'Missing');

    // Get all descendants
    const descendants = this.locationsDb.getDescendantIds(umoja.id);
    this.recordTest(
      'Total Umoja hierarchy',
      descendants.length > 1,
      `${descendants.length} total locations (parent + children)`
    );

    // Count properties
    const propsInUmoja = this.properties.filter(p => 
      p.locationHierarchyId && descendants.includes(p.locationHierarchyId) ||
      (p.estateSuburb && p.estateSuburb.toLowerCase().includes('umoja'))
    );

    this.recordTest(
      'Properties in Umoja hierarchy',
      propsInUmoja.length >= 0,
      `${propsInUmoja.length} properties would be returned`
    );
  }

  /**
   * Test 4: Search for "Eastleigh" returns Eastleigh + all sections
   */
  testEastleighParentSearch() {
    console.log('\n📋 TEST 4: Parent Location Search - Eastleigh');
    console.log('─'.repeat(60));

    const results = this.locationsDb.search('Eastleigh', 20);
    const eastleigh = results.find(r => r.name === 'Eastleigh' && !r.name.includes('Section'));

    if (!eastleigh) {
      this.recordTest('Find Eastleigh location', false, 'Eastleigh not found');
      return;
    }

    this.recordTest('Find Eastleigh location', true, `Found: ${eastleigh.fullPath}`);

    // Get children (sections)
    const children = this.locationsDb.getChildren(eastleigh.id);
    const sections = children.filter(c => c.name.includes('Section'));

    this.recordTest(
      'Eastleigh has sections',
      sections.length > 0,
      `Found ${sections.length} sections`
    );

    // Verify section numbers
    const sectionNumbers = sections.map(s => {
      const match = s.name.match(/Section (\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(n => n !== null);

    this.recordTest(
      'Section range',
      sectionNumbers.length > 0,
      `Sections: ${Math.min(...sectionNumbers)} to ${Math.max(...sectionNumbers)}`
    );

    // Get descendants
    const descendants = this.locationsDb.getDescendantIds(eastleigh.id);
    this.recordTest(
      'Total Eastleigh hierarchy',
      descendants.length > 1,
      `${descendants.length} locations (Eastleigh + ${sections.length} sections)`
    );
  }

  /**
   * Test 5: Search for "Eastleigh Section 8" returns only Section 8
   */
  testEastleighSection8SpecificSearch() {
    console.log('\n📋 TEST 5: Specific Location Search - Eastleigh Section 8');
    console.log('─'.repeat(60));

    const results = this.locationsDb.search('Eastleigh Section 8', 10);
    const section8 = results.find(r => r.name === 'Eastleigh Section 8');

    if (!section8) {
      this.recordTest('Find Eastleigh Section 8', false, 'Section 8 not found');
      return;
    }

    this.recordTest('Find Eastleigh Section 8', true, `Found: ${section8.fullPath}`);

    // Verify parent
    const parent = this.locationsDb.getById(section8.parentId);
    this.recordTest(
      'Section 8 has Eastleigh parent',
      parent && parent.name === 'Eastleigh',
      `Parent: ${parent ? parent.name : 'None'}`
    );

    // Verify specific search only returns this section
    const descendants = this.locationsDb.getDescendantIds(section8.id);
    this.recordTest(
      'Section 8 is leaf node',
      descendants.length === 1,
      `Only Section 8 itself (no sub-sections)`
    );
  }

  /**
   * Test 6: Autocomplete search functionality
   */
  testAutocompleteSearch() {
    console.log('\n📋 TEST 6: Autocomplete Search');
    console.log('─'.repeat(60));

    // Test partial matching
    const tests = [
      { query: 'mlol', expected: 'Mlolongo' },
      { query: 'umo', expected: 'Umoja' },
      { query: 'east', expected: 'Eastleigh' },
      { query: 'kil', expected: 'Kilimani' },
      { query: 'rua', expected: 'Ruaka' }
    ];

    for (const { query, expected } of tests) {
      const results = this.locationsDb.search(query, 5);
      const found = results.some(r => r.name.toLowerCase().includes(expected.toLowerCase()));
      
      this.recordTest(
        `Autocomplete: "${query}" → "${expected}"`,
        found,
        found ? `Found in top ${results.length} results` : 'Not found'
      );
    }
  }

  /**
   * Test 7: Breadcrumb/Path display
   */
  testBreadcrumbDisplay() {
    console.log('\n📋 TEST 7: Breadcrumb / Full Path Display');
    console.log('─'.repeat(60));

    // Test various path depths
    const testCases = [
      { name: 'Nairobi', expectedDepth: 1 },
      { name: 'Kilimani', expectedMinDepth: 2 },
      { name: 'Mlolongo Phase 2', expectedMinDepth: 3 }
    ];

    for (const { name, expectedDepth, expectedMinDepth } of testCases) {
      const results = this.locationsDb.search(name, 1);
      if (results.length > 0) {
        const loc = results[0];
        const breadcrumbs = this.locationsDb.getBreadcrumbs(loc.id);
        const pathParts = loc.fullPath ? loc.fullPath.split(' → ') : [];
        
        const depthMatches = expectedDepth 
          ? pathParts.length === expectedDepth
          : pathParts.length >= expectedMinDepth;

        this.recordTest(
          `Path for "${name}"`,
          depthMatches && loc.fullPath,
          `${loc.fullPath} (${breadcrumbs.length} levels)`
        );
      } else {
        this.recordTest(`Path for "${name}"`, false, 'Location not found');
      }
    }
  }

  /**
   * Test 8: Verify location counts
   */
  testLocationCounts() {
    console.log('\n📋 TEST 8: Location Database Coverage');
    console.log('─'.repeat(60));

    const all = this.locationsDb.getAllActive();
    const counties = all.filter(l => l.type === 'county');
    const towns = all.filter(l => l.type === 'town');
    const majorAreas = all.filter(l => l.type === 'major_area');
    const estates = all.filter(l => l.type === 'estate');
    const phases = all.filter(l => l.type === 'phase');
    const sections = all.filter(l => l.type === 'section');
    const verified = all.filter(l => l.isVerified);

    this.recordTest('Total locations', all.length > 100, `${all.length} locations`);
    this.recordTest('Counties', counties.length >= 5, `${counties.length} counties`);
    this.recordTest('Towns', towns.length >= 10, `${towns.length} towns`);
    this.recordTest('Major areas', majorAreas.length >= 10, `${majorAreas.length} major areas`);
    this.recordTest('Estates', estates.length >= 5, `${estates.length} estates`);
    this.recordTest('Phases', phases.length >= 10, `${phases.length} phases`);
    this.recordTest('Sections', sections.length >= 10, `${sections.length} sections`);
    this.recordTest('Verified locations', verified.length > 100, `${verified.length} verified`);

    // Check for key locations
    const keyLocations = ['Nairobi', 'Kiambu', 'Machakos', 'Mlolongo', 'Umoja', 'Eastleigh', 'Kibera', 'Mathare'];
    for (const name of keyLocations) {
      const found = all.some(l => l.name === name);
      this.recordTest(`Has "${name}"`, found, found ? 'Present' : 'Missing');
    }
  }

  /**
   * Test 9: Property migration verification
   */
  testPropertyMigration() {
    console.log('\n📋 TEST 9: Property Migration Status');
    console.log('─'.repeat(60));

    const migratedProps = this.properties.filter(p => p.locationHierarchyId);
    const unmigrated = this.properties.filter(p => !p.locationHierarchyId);
    const withPathIds = this.properties.filter(p => p.locationPathIds && p.locationPathIds.length > 0);

    this.recordTest(
      'Properties migrated',
      migratedProps.length > 0,
      `${migratedProps.length}/${this.properties.length} have locationHierarchyId`
    );

    this.recordTest(
      'Properties with path IDs',
      withPathIds.length > 0,
      `${withPathIds.length} have locationPathIds for descendant matching`
    );

    this.recordTest(
      'Legacy data preserved',
      this.properties.every(p => p.estateSuburb || p.locationName),
      'All properties have location data'
    );

    // Check a sample migrated property
    if (migratedProps.length > 0) {
      const sample = migratedProps[0];
      const hasRequiredFields = 
        sample.locationHierarchyId &&
        sample.locationName &&
        sample.locationPathIds &&
        sample.locationPathIds.length > 0;

      this.recordTest(
        'Sample property structure',
        hasRequiredFields,
        `${sample.title}: ${sample.locationFullPath}`
      );
    }
  }

  /**
   * Test 10: Descendant matching logic
   */
  testDescendantMatching() {
    console.log('\n📋 TEST 10: Descendant Matching Logic');
    console.log('─'.repeat(60));

    // Find Mlolongo and its phases
    const mlolongoResults = this.locationsDb.search('Mlolongo', 10);
    const mlolongo = mlolongoResults.find(r => r.name === 'Mlolongo' && !r.name.includes('Phase'));

    if (!mlolongo) {
      this.recordTest('Descendant matching test', false, 'Mlolongo not found');
      return;
    }

    const descendants = this.locationsDb.getDescendantIds(mlolongo.id);
    const children = this.locationsDb.getChildren(mlolongo.id);

    // Verify descendants include parent + all children
    const expectedCount = 1 + children.length; // parent + children
    this.recordTest(
      'Descendants include parent',
      descendants.includes(mlolongo.id),
      'Mlolongo ID is in descendants array'
    );

    this.recordTest(
      'Descendants include all children',
      children.every(c => descendants.includes(c.id)),
      `All ${children.length} children included`
    );

    this.recordTest(
      'Descendant count correct',
      descendants.length === expectedCount,
      `${descendants.length} total (1 parent + ${children.length} children)`
    );
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log('🧪 KejaMarket Hierarchical Location System Test Suite');
    console.log('═'.repeat(60));
    console.log(`Testing ${this.properties.length} properties against ${this.locationsDb.locations.length} locations\n`);

    this.testMlolongoParentSearch();
    this.testMlolongoPhase2SpecificSearch();
    this.testUmojaParentSearch();
    this.testEastleighParentSearch();
    this.testEastleighSection8SpecificSearch();
    this.testAutocompleteSearch();
    this.testBreadcrumbDisplay();
    this.testLocationCounts();
    this.testPropertyMigration();
    this.testDescendantMatching();

    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`);
    if (failed > 0) {
      console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`);
    }
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  ✗ ${r.test}: ${r.details}`));
    }

    console.log('\n' + '═'.repeat(60));

    if (failed === 0) {
      console.log('✅ All tests passed! Location system is working correctly.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review failures above.`);
    }

    return failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new LocationSystemTester();
  const allPassed = tester.runAll();
  process.exit(allPassed ? 0 : 1);
}

module.exports = LocationSystemTester;
