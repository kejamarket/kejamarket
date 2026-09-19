/**
 * KejaMarket SEO — Dynamic XML Sitemaps Generator
 * Generates standards-compliant XML sitemaps:
 *   /sitemap.xml           - Master sitemap index
 *   /sitemap-properties.xml - Real active property listings with lastmod
 *   /sitemap-locations.xml  - Location & suburb index pages
 *   /sitemap-guides.xml     - Authoritative guide articles
 */

'use strict';

const { buildPropertySlug, slugify, BASE_URL } = require('./template');
const { GUIDES_DATA } = require('./guides');

function formatDate(dateVal) {
  try {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Master Sitemap Index
 */
function renderSitemapIndex() {
  const today = formatDate();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-properties.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-locations.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-guides.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Properties Sitemap
 */
async function renderPropertiesSitemap(store) {
  let allProps = [];
  try {
    allProps = (await store.getAllProperties()) || [];
  } catch (err) {
    console.error('Sitemap properties fetch error:', err.message);
  }

  // Filter to active, verified properties only
  const activeProps = allProps.filter(p => p.isActive !== false && p.is_active !== false);

  const urls = activeProps.map(p => {
    const slug = buildPropertySlug(p);
    const loc = `${BASE_URL}/property/${slug}`;
    const lastmod = formatDate(p.updatedAt || p.updated_at || p.createdAt || p.created_at);
    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Locations & Categories Sitemap
 */
async function renderLocationsSitemap(store) {
  let allProps = [];
  try {
    allProps = (await store.getAllProperties()) || [];
  } catch (err) {
    console.error('Sitemap locations fetch error:', err.message);
  }

  const activeProps = allProps.filter(p => p.isActive !== false && p.is_active !== false);
  const today = formatDate();

  const urlSet = new Set();

  // Root rentals page
  urlSet.add(`${BASE_URL}/rentals/nairobi`);

  // Popular categories
  const categories = ['bedsitter', '1-bedroom', '2-bedroom', '3-bedroom', 'studio'];
  for (const cat of categories) {
    urlSet.add(`${BASE_URL}/rentals/nairobi/${cat}`);
  }

  // Add distinct locations and suburbs present in active listings
  for (const p of activeProps) {
    const loc = slugify(p.location || 'nairobi');
    const sub = slugify(p.estateSuburb || p.estate_suburb || '');

    if (loc) {
      urlSet.add(`${BASE_URL}/rentals/${loc}`);
    }
    if (loc && sub) {
      urlSet.add(`${BASE_URL}/rentals/${loc}/${sub}`);
      // Add combination if bedrooms or bedsitter
      const beds = Number(p.bedrooms || p.beds || 0);
      if (beds === 1) urlSet.add(`${BASE_URL}/rentals/${loc}/${sub}/1-bedroom`);
      if (beds === 2) urlSet.add(`${BASE_URL}/rentals/${loc}/${sub}/2-bedroom`);
      if (beds === 3) urlSet.add(`${BASE_URL}/rentals/${loc}/${sub}/3-bedroom`);
      if ((p.category || '').toLowerCase().includes('bedsitter')) {
        urlSet.add(`${BASE_URL}/rentals/${loc}/${sub}/bedsitter`);
      }
    }
  }

  const urls = Array.from(urlSet).map(url => {
    return `  <url>
    <loc>${xmlEscape(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Guides Sitemap
 */
function renderGuidesSitemap() {
  const today = formatDate();
  const urls = Object.entries(GUIDES_DATA).map(([slug, guide]) => {
    const loc = `${BASE_URL}/guides/${slug}`;
    const lastmod = guide.modifiedDate || today;
    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

module.exports = {
  renderSitemapIndex,
  renderPropertiesSitemap,
  renderLocationsSitemap,
  renderGuidesSitemap
};
