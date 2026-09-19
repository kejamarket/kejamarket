/**
 * KejaMarket SEO — HTML Shell Template
 * Generates consistent SSR HTML pages for crawlable property/location/guide pages.
 * Brand: green #1B6A3B / dark #0F2419 / accent gold #E8B84B
 */

'use strict';

const BASE_URL = 'https://kejamarket.co.ke';

/**
 * Slugify a string for use in URLs
 */
function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Build a property slug from property data
 * Format: {first8-of-id}-{bedrooms}bed-{category-slug}-{suburb-slug}
 */
function buildPropertySlug(property) {
  const id = (property.id || '').replace(/-/g, '').substring(0, 8);
  const beds = property.bedrooms || property.beds || 0;
  const cat = slugify(
    (property.category || 'rental')
      .replace(/\s*Bedroom\s*/i, 'bed')
      .replace(/\s*Room\s*/i, 'room')
      .replace(/\s*Studio\s*/i, 'studio')
  );
  const suburb = slugify(property.estateSuburb || property.estate_suburb || property.location || '');
  return `${id}-${beds}bed-${cat}-${suburb}`;
}

/**
 * Format KSh price string
 */
function formatPrice(rentKes) {
  const n = Number(rentKes);
  if (!n) return 'Price on request';
  return `KSh ${n.toLocaleString('en-KE')}`;
}

/**
 * Strip "TikTok Tour:", "Facebook Direct:", "TikTok House Tours" prefixes from titles
 */
function cleanTitle(title) {
  if (!title) return title;
  return title
    .replace(/^TikTok\s+(House\s+)?(Tours?|Hunting|Viral|Gem|Sensation):\s*/i, '')
    .replace(/^TikTok\s+Tour:\s*/i, '')
    .replace(/^Facebook\s+(Direct|Tours?|Marketplace):\s*/i, '')
    .trim();
}

/**
 * Render the full HTML page shell
 *
 * @param {object} opts
 *   title, description, canonical, ogImage, jsonLd, breadcrumbs, body, noindex
 */
function renderPage({
  title,
  description,
  canonical,
  ogImage,
  jsonLd = [],
  breadcrumbs = [],
  body,
  noindex = false,
  lang = 'en-KE'
}) {
  const robotsMeta = noindex
    ? '<meta name="robots" content="noindex,follow">'
    : '<meta name="robots" content="index,follow">';

  const ldArray = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);
  const jsonLdBlocks = ldArray
    .map(ld => `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`)
    .join('\n');

  const breadcrumbHtml = breadcrumbs.length > 1
    ? `<nav class="km-breadcrumb" aria-label="Breadcrumb">
        <ol>
          ${breadcrumbs.map((b, i) =>
            i < breadcrumbs.length - 1
              ? `<li><a href="${b.url}">${b.name}</a></li>`
              : `<li aria-current="page">${b.name}</li>`
          ).join('')}
        </ol>
      </nav>`
    : '';

  const ogImageTag = ogImage
    ? `<meta property="og:image" content="${ogImage}">
       <meta property="og:image:width" content="1200">
       <meta property="og:image:height" content="630">
       <meta name="twitter:image" content="${ogImage}">`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  ${robotsMeta}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="KejaMarket">
  <meta property="og:locale" content="en_KE">
  ${ogImageTag}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:site" content="@kejamarket">

  <!-- Language & Geo -->
  <meta name="geo.region" content="KE">
  <meta name="geo.placename" content="Nairobi, Kenya">

  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico">

  <!-- JSON-LD Structured Data -->
  ${jsonLdBlocks}

  <style>
    /* ─── KejaMarket SEO Page Styles ─────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --km-green: #1B6A3B;
      --km-green-dark: #0F2419;
      --km-green-light: #e8f5ee;
      --km-gold: #E8B84B;
      --km-text: #1a1a1a;
      --km-muted: #6b7280;
      --km-border: #e5e7eb;
      --km-white: #ffffff;
      --km-shadow: 0 2px 8px rgba(0,0,0,0.10);
      --km-radius: 10px;
      --max-w: 1180px;
      --font: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }
    html { font-size: 16px; scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--km-text); background: #f8f9fa; line-height: 1.6; }
    a { color: var(--km-green); text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; display: block; }

    /* ── Header ── */
    .km-header {
      background: var(--km-green-dark);
      padding: 0 20px;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .km-header-inner {
      max-width: var(--max-w); margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 60px;
    }
    .km-logo { display: flex; align-items: center; gap: 10px; color: var(--km-white); font-weight: 700; font-size: 1.25rem; }
    .km-logo-icon { font-size: 1.5rem; }
    .km-header-cta {
      background: var(--km-green); color: var(--km-white);
      padding: 8px 18px; border-radius: 6px; font-size: 0.875rem; font-weight: 600;
      transition: background 0.2s;
    }
    .km-header-cta:hover { background: #156030; text-decoration: none; }

    /* ── Breadcrumb ── */
    .km-breadcrumb { background: var(--km-white); border-bottom: 1px solid var(--km-border); padding: 10px 20px; }
    .km-breadcrumb ol { max-width: var(--max-w); margin: 0 auto; display: flex; flex-wrap: wrap; gap: 4px; list-style: none; font-size: 0.8rem; color: var(--km-muted); }
    .km-breadcrumb li + li::before { content: '›'; margin-right: 4px; }
    .km-breadcrumb a { color: var(--km-green); }

    /* ── Main wrapper ── */
    .km-main { max-width: var(--max-w); margin: 0 auto; padding: 24px 20px 48px; }

    /* ── Property page layout ── */
    .km-property-grid { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }
    @media (max-width: 900px) { .km-property-grid { grid-template-columns: 1fr; } }

    /* ── Photo gallery ── */
    .km-gallery { border-radius: var(--km-radius); overflow: hidden; background: var(--km-green-dark); }
    .km-gallery-main { width: 100%; height: 380px; object-fit: cover; }
    @media (max-width: 600px) { .km-gallery-main { height: 240px; } }
    .km-gallery-thumbs { display: flex; gap: 4px; padding: 4px; overflow-x: auto; background: #111; }
    .km-gallery-thumbs img { width: 80px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0; cursor: pointer; opacity: 0.75; transition: opacity 0.2s; }
    .km-gallery-thumbs img:hover { opacity: 1; }

    /* ── Property header ── */
    .km-property-header { margin: 20px 0 12px; }
    .km-property-title { font-size: 1.5rem; font-weight: 700; color: var(--km-green-dark); line-height: 1.3; }
    @media (max-width: 600px) { .km-property-title { font-size: 1.2rem; } }
    .km-property-location { color: var(--km-muted); font-size: 0.9rem; margin-top: 4px; }
    .km-price-tag { font-size: 1.75rem; font-weight: 800; color: var(--km-green); margin: 12px 0; }
    .km-price-period { font-size: 0.875rem; font-weight: 400; color: var(--km-muted); }

    /* ── Badges ── */
    .km-badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .km-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--km-green-light); color: var(--km-green);
      border: 1px solid #b7dfc8; border-radius: 20px;
      padding: 4px 12px; font-size: 0.8rem; font-weight: 600;
    }
    .km-badge.verified { background: #fff8e1; color: #b45309; border-color: #fde68a; }
    .km-badge.featured { background: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
    .km-badge.inactive { background: #f3f4f6; color: var(--km-muted); border-color: var(--km-border); }

    /* ── Details card ── */
    .km-details-card { background: var(--km-white); border-radius: var(--km-radius); box-shadow: var(--km-shadow); padding: 24px; }
    .km-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .km-detail-item { display: flex; flex-direction: column; gap: 2px; }
    .km-detail-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--km-muted); }
    .km-detail-value { font-weight: 600; font-size: 0.95rem; }

    /* ── Contact sidebar ── */
    .km-contact-card { background: var(--km-white); border-radius: var(--km-radius); box-shadow: var(--km-shadow); padding: 24px; position: sticky; top: 76px; }
    .km-contact-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
    .km-cta-btn {
      display: block; width: 100%; text-align: center;
      background: var(--km-green); color: var(--km-white);
      padding: 13px 20px; border-radius: 8px; font-weight: 700; font-size: 1rem;
      margin-bottom: 10px; transition: background 0.2s;
    }
    .km-cta-btn:hover { background: #156030; text-decoration: none; }
    .km-cta-btn.secondary { background: var(--km-white); color: var(--km-green); border: 2px solid var(--km-green); }
    .km-cta-btn.secondary:hover { background: var(--km-green-light); }
    .km-cta-btn.whatsapp { background: #25D366; }
    .km-cta-btn.whatsapp:hover { background: #1ebe5d; }

    /* ── Description section ── */
    .km-section { margin: 24px 0; }
    .km-section-title { font-size: 1.1rem; font-weight: 700; color: var(--km-green-dark); border-bottom: 2px solid var(--km-green-light); padding-bottom: 8px; margin-bottom: 14px; }
    .km-description { line-height: 1.8; color: #374151; white-space: pre-wrap; }

    /* ── Amenities grid ── */
    .km-amenities { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
    .km-amenity { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; padding: 8px 12px; background: var(--km-green-light); border-radius: 6px; }
    .km-amenity-icon { font-size: 1.1rem; }

    /* ── Reviews ── */
    .km-review { background: var(--km-white); border-radius: var(--km-radius); box-shadow: var(--km-shadow); padding: 16px; margin-bottom: 12px; }
    .km-review-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .km-review-author { font-weight: 600; font-size: 0.9rem; }
    .km-review-rating { color: var(--km-gold); font-size: 0.9rem; }
    .km-review-text { color: #374151; font-size: 0.875rem; line-height: 1.6; }
    .km-stars { color: var(--km-gold); letter-spacing: 2px; }

    /* ── Listing grid (location pages) ── */
    .km-listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .km-listing-card { background: var(--km-white); border-radius: var(--km-radius); box-shadow: var(--km-shadow); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .km-listing-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .km-listing-card img { width: 100%; height: 180px; object-fit: cover; }
    .km-listing-card-body { padding: 14px; }
    .km-listing-card-title { font-weight: 700; font-size: 0.95rem; color: var(--km-green-dark); margin-bottom: 4px; line-height: 1.3; }
    .km-listing-card-location { font-size: 0.8rem; color: var(--km-muted); margin-bottom: 8px; }
    .km-listing-card-price { font-size: 1.1rem; font-weight: 800; color: var(--km-green); }
    .km-listing-card-meta { font-size: 0.75rem; color: var(--km-muted); margin-top: 4px; }
    .km-listing-card-link { display: block; margin-top: 10px; font-size: 0.8rem; font-weight: 600; color: var(--km-green); }

    /* ── Hero banner (location pages) ── */
    .km-hero { background: linear-gradient(135deg, var(--km-green-dark), var(--km-green)); color: var(--km-white); padding: 40px 20px; text-align: center; margin-bottom: 28px; border-radius: var(--km-radius); }
    .km-hero h1 { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
    .km-hero p { font-size: 1.05rem; opacity: 0.9; }
    .km-hero-stats { display: flex; justify-content: center; gap: 32px; margin-top: 20px; flex-wrap: wrap; }
    .km-hero-stat { text-align: center; }
    .km-hero-stat-value { font-size: 1.75rem; font-weight: 800; color: var(--km-gold); }
    .km-hero-stat-label { font-size: 0.8rem; opacity: 0.8; }
    @media (max-width: 600px) { .km-hero h1 { font-size: 1.4rem; } .km-hero-stats { gap: 16px; } }

    /* ── Guide page ── */
    .km-guide-content { max-width: 780px; }
    .km-guide-content h2 { font-size: 1.3rem; font-weight: 700; color: var(--km-green-dark); margin: 28px 0 10px; }
    .km-guide-content h3 { font-size: 1.05rem; font-weight: 700; margin: 20px 0 8px; }
    .km-guide-content p { margin-bottom: 14px; color: #374151; line-height: 1.8; }
    .km-guide-content ul, .km-guide-content ol { margin: 10px 0 14px 24px; color: #374151; }
    .km-guide-content li { margin-bottom: 6px; line-height: 1.7; }
    .km-guide-callout { background: var(--km-green-light); border-left: 4px solid var(--km-green); padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .km-guide-callout p { margin: 0; }

    /* ── Footer ── */
    .km-footer { background: var(--km-green-dark); color: rgba(255,255,255,0.8); padding: 40px 20px 24px; margin-top: 60px; }
    .km-footer-inner { max-width: var(--max-w); margin: 0 auto; }
    .km-footer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 28px; margin-bottom: 32px; }
    .km-footer-col-title { color: var(--km-white); font-weight: 700; font-size: 0.95rem; margin-bottom: 12px; }
    .km-footer-links { list-style: none; }
    .km-footer-links li { margin-bottom: 7px; }
    .km-footer-links a { color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .km-footer-links a:hover { color: var(--km-white); }
    .km-footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 0.8rem; text-align: center; color: rgba(255,255,255,0.5); }

    /* ── Unavailable listing ── */
    .km-unavailable-banner { background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--km-radius); padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .km-unavailable-banner p { color: #b91c1c; font-weight: 600; }
  </style>
</head>
<body>

  <!-- ── Site Header ── -->
  <header class="km-header" role="banner">
    <div class="km-header-inner">
      <a href="/" class="km-logo" aria-label="KejaMarket home">
        <span class="km-logo-icon">🏠</span>
        <span>KejaMarket</span>
      </a>
      <a href="/" class="km-header-cta">Browse Rentals</a>
    </div>
  </header>

  ${breadcrumbHtml}

  <!-- ── Page Content ── -->
  <main id="main-content" class="km-main">
    ${body}
  </main>

  <!-- ── Site Footer ── -->
  <footer class="km-footer" role="contentinfo">
    <div class="km-footer-inner">
      <div class="km-footer-grid">
        <div>
          <p class="km-footer-col-title">KejaMarket</p>
          <p style="font-size:0.85rem;line-height:1.7;color:rgba(255,255,255,0.65)">
            Kenya's trusted rental marketplace. Find verified bedsitters, 1-bedroom, 2-bedroom apartments and houses in Nairobi and beyond.
          </p>
        </div>
        <div>
          <p class="km-footer-col-title">Popular Areas</p>
          <ul class="km-footer-links">
            <li><a href="/rentals/nairobi">Nairobi Rentals</a></li>
            <li><a href="/rentals/nairobi/kasarani">Kasarani</a></li>
            <li><a href="/rentals/nairobi/kilimani">Kilimani</a></li>
            <li><a href="/rentals/nairobi/westlands">Westlands</a></li>
            <li><a href="/rentals/nairobi/rongai">Rongai</a></li>
            <li><a href="/rentals/nairobi/syokimau">Syokimau</a></li>
          </ul>
        </div>
        <div>
          <p class="km-footer-col-title">Property Types</p>
          <ul class="km-footer-links">
            <li><a href="/rentals/type/bedsitter">Bedsitters</a></li>
            <li><a href="/rentals/type/1-bedroom">1 Bedroom</a></li>
            <li><a href="/rentals/type/2-bedroom">2 Bedroom</a></li>
            <li><a href="/rentals/type/3-bedroom">3 Bedroom</a></li>
            <li><a href="/rentals/type/house">Houses</a></li>
            <li><a href="/rentals/type/airbnb">Airbnb / BnB</a></li>
          </ul>
        </div>
        <div>
          <p class="km-footer-col-title">Guides</p>
          <ul class="km-footer-links">
            <li><a href="/guides/how-to-verify-a-rental">Verify a Rental</a></li>
            <li><a href="/guides/moving-to-nairobi">Moving to Nairobi</a></li>
            <li><a href="/guides/rental-deposits-kenya">Rental Deposits</a></li>
            <li><a href="/guides/rental-areas-nairobi">Nairobi Areas Guide</a></li>
            <li><a href="/guides/bedsitter-guide">Bedsitter Guide</a></li>
            <li><a href="/guides/1-bedroom-guide">1 Bedroom Guide</a></li>
          </ul>
        </div>
        <div>
          <p class="km-footer-col-title">KejaMarket</p>
          <ul class="km-footer-links">
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Use</a></li>
            <li><a href="https://www.instagram.com/kejamarket" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://www.tiktok.com/@kejamarket" rel="noopener noreferrer">TikTok</a></li>
          </ul>
        </div>
      </div>
      <div class="km-footer-bottom">
        <p>© ${new Date().getFullYear()} KejaMarket. All rights reserved. Nairobi, Kenya.</p>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { renderPage, buildPropertySlug, slugify, formatPrice, cleanTitle, escapeHtml, BASE_URL };
