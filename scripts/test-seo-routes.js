/**
 * Test script to verify all SEO endpoints, sitemaps, templates, and structured data
 */

const http = require('http');
const express = require('express');
const { createSeoRouter } = require('../seo/routes');
const fallbackStore = require('../db/store');
const { buildPropertySlug } = require('../seo/template');

async function runTests() {
  console.log('🧪 Starting SEO Suite Verification...');

  // Setup test app
  const app = express();
  app.use(createSeoRouter(() => fallbackStore));

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test server running on port ${port}`);

  let passed = 0;
  let failed = 0;

  async function check(name, path, validate) {
    try {
      const res = await fetch(`${baseUrl}${path}`);
      const text = await res.text();
      const err = validate(res.status, res.headers, text);
      if (err) {
        console.error(`❌ [FAIL] ${name}: ${err}`);
        failed++;
      } else {
        console.log(`✅ [PASS] ${name} (HTTP ${res.status})`);
        passed++;
      }
    } catch (e) {
      console.error(`❌ [FAIL] ${name}: Exception ${e.message}`);
      failed++;
    }
  }

  // 1. Check Sitemap Index
  await check('Sitemap Index', '/sitemap.xml', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!headers.get('content-type')?.includes('xml')) return 'Missing XML content-type';
    if (!body.includes('<sitemapindex') || !body.includes('sitemap-properties.xml')) return 'Malformed sitemapindex';
  });

  // 2. Check Properties Sitemap
  await check('Properties Sitemap', '/sitemap-properties.xml', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!headers.get('content-type')?.includes('xml')) return 'Missing XML content-type';
    if (!body.includes('<urlset') || !body.includes('/property/')) return 'Missing urlset or properties';
  });

  // 3. Check Locations Sitemap
  await check('Locations Sitemap', '/sitemap-locations.xml', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!headers.get('content-type')?.includes('xml')) return 'Missing XML content-type';
    if (!body.includes('/rentals/nairobi')) return 'Missing rentals/nairobi';
  });

  // 4. Check Guides Sitemap
  await check('Guides Sitemap', '/sitemap-guides.xml', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!headers.get('content-type')?.includes('xml')) return 'Missing XML content-type';
    if (!body.includes('how-to-verify-a-rental')) return 'Missing how-to-verify guide';
  });

  // 5. Check Rentals Location Page
  await check('Location Page (/rentals/nairobi)', '/rentals/nairobi', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!body.includes('KejaMarket') || !body.includes('ItemList')) return 'Missing branding or ItemList schema';
    if (!body.includes('View Property Details')) return 'Missing property cards';
  });

  // 6. Check Suburb Page
  await check('Suburb Page (/rentals/nairobi/kasarani)', '/rentals/nairobi/kasarani', (status, headers, body) => {
    if (status !== 200 && status !== 404) return `Unexpected status ${status}`;
    if (status === 200 && (!body.includes('Kasarani') || !body.includes('ItemList'))) return 'Missing Kasarani content';
  });

  // 7. Check Category Page
  await check('Category Page (/rentals/nairobi/bedsitter)', '/rentals/nairobi/bedsitter', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!body.includes('Bedsitter') && !body.includes('bedsitters')) return 'Missing bedsitter content';
  });

  // 8. Check Guide Page
  await check('Guide Page (/guides/how-to-verify-a-rental)', '/guides/how-to-verify-a-rental', (status, headers, body) => {
    if (status !== 200) return `Expected 200, got ${status}`;
    if (!body.includes('How to Verify a Rental') || !body.includes('Article')) return 'Missing guide title or Article schema';
  });

  // 9. Check Individual Property Page
  const props = fallbackStore.getAllProperties();
  if (props && props.length > 0) {
    const slug = buildPropertySlug(props[0]);
    await check(`Property Page (/property/${slug})`, `/property/${slug}`, (status, headers, body) => {
      if (status !== 200) return `Expected 200, got ${status}`;
      if (!body.includes('Direct Landlord') && !body.includes('KSh')) return 'Missing property details';
      if (!body.includes('schema.org') || !body.includes('RealEstateListing')) return 'Missing JSON-LD RealEstateListing schema';
    });
  }

  server.close();
  console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All SEO endpoints verified successfully!');
  }
}

runTests();
