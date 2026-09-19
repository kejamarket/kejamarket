/**
 * KejaMarket SEO — Location & Category Listing Pages Renderer
 * Handles:
 *   GET /rentals/:location
 *   GET /rentals/:location/:suburb
 *   GET /rentals/type/:type
 *   GET /rentals/:location/:suburb/:type
 *
 * Provides crawlable, rich HTML pages with genuine inventory counts,
 * real pricing statistics, schema.org ItemList markup, and direct links
 * to verified property pages.
 */

'use strict';

const { renderPage, buildPropertySlug, formatPrice, cleanTitle, escapeHtml, slugify, BASE_URL } = require('./template');
const { optimizeImageUrl } = require('./property-page');

/**
 * Normalise type/category strings into human-readable and query matches
 */
function normalizeTypeFilter(typeSlug) {
  if (!typeSlug) return null;
  const s = slugify(typeSlug);
  if (s.includes('bedsitter')) return { label: 'Bedsitters', beds: null, catMatch: 'bedsitter' };
  if (s.includes('studio')) return { label: 'Studio Apartments', beds: null, catMatch: 'studio' };
  if (s.includes('single-room') || s === 'single') return { label: 'Single Rooms', beds: null, catMatch: 'single' };
  if (s.includes('1-bedroom') || s === '1bed' || s === '1-bed') return { label: '1 Bedroom Apartments', beds: 1, catMatch: null };
  if (s.includes('2-bedroom') || s === '2bed' || s === '2-bed') return { label: '2 Bedroom Apartments', beds: 2, catMatch: null };
  if (s.includes('3-bedroom') || s === '3bed' || s === '3-bed') return { label: '3 Bedroom Apartments', beds: 3, catMatch: null };
  if (s.includes('4-bedroom') || s === '4bed' || s === '4-bed') return { label: '4+ Bedroom Houses', beds: 4, catMatch: null };
  if (s.includes('commercial') || s.includes('office')) return { label: 'Commercial & Office Spaces', beds: null, catMatch: 'commercial' };
  // Default fallback formatting
  const formatted = typeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label: formatted, beds: null, catMatch: s };
}

/**
 * Filter properties by location, suburb, and property type
 */
function filterProperties(allProps, { location, suburb, type }) {
  const activeProps = allProps.filter(p => p.isActive !== false && p.is_active !== false);
  const locSlug = location ? slugify(location) : null;
  const subSlug = suburb ? slugify(suburb) : null;
  const typeFilter = type ? normalizeTypeFilter(type) : null;

  return activeProps.filter(p => {
    // Location match
    if (locSlug) {
      if (locSlug === 'nairobi') {
        const pLoc = slugify(p.location || '');
        const pCounty = slugify(p.county || '');
        if (pCounty && pCounty !== 'nairobi' && pCounty !== 'undefined' && !pLoc.includes('nairobi')) {
          return false;
        }
      } else {
        const pLoc = slugify(p.location || '');
        const pSub = slugify(p.estateSuburb || p.estate_suburb || '');
        const pCounty = slugify(p.county || '');
        if (!pLoc.includes(locSlug) && !pSub.includes(locSlug) && !pCounty.includes(locSlug)) {
          return false;
        }
      }
    }

    // Suburb match
    if (subSlug) {
      const pSub = slugify(p.estateSuburb || p.estate_suburb || '');
      const pLoc = slugify(p.location || '');
      if (!pSub.includes(subSlug) && !pLoc.includes(subSlug)) {
        return false;
      }
    }

    // Type / bedroom match
    if (typeFilter) {
      const pBeds = Number(p.bedrooms || p.beds || 0);
      const pCat = slugify(p.category || '');
      const pTitle = slugify(p.title || '');
      if (typeFilter.beds !== null) {
        if (typeFilter.beds >= 4) {
          if (pBeds < 4) return false;
        } else if (pBeds !== typeFilter.beds) {
          return false;
        }
      }
      if (typeFilter.catMatch) {
        if (!pCat.includes(typeFilter.catMatch) && !pTitle.includes(typeFilter.catMatch)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Format title case for breadcrumbs and headings
 */
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Render Location / Category Page
 */
async function renderLocationPage(store, { location, suburb, type, originalUrl }) {
  let allProps = [];
  try {
    allProps = (await store.getAllProperties()) || [];
  } catch (err) {
    console.error('Error fetching properties for location page:', err.message);
  }

  const matches = filterProperties(allProps, { location, suburb, type });

  // If no listings exist at all, return 404
  if (matches.length === 0) {
    return {
      status: 404,
      html: renderPage({
        title: 'No Listings Found | KejaMarket Kenya',
        description: 'No active rental listings currently match this search on KejaMarket.',
        canonical: `${BASE_URL}${originalUrl || ''}`,
        noindex: true,
        body: `
          <div style="max-width:680px;margin:80px auto;text-align:center;padding:0 16px;">
            <div style="font-size:3.5rem;margin-bottom:16px;">🏡</div>
            <h1 style="font-size:1.8rem;color:#1B6A3B;margin-bottom:12px;">No listings currently available in this area</h1>
            <p style="color:#4b5563;font-size:1.05rem;line-height:1.6;margin-bottom:28px;">
              We haven't verified any active listings matching this criteria yet. Our team inspects and verifies new houses across Nairobi daily.
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="/rentals/nairobi" class="km-btn km-btn-primary">Browse Nairobi Rentals</a>
              <a href="/" class="km-btn km-btn-outline">Return to Home</a>
            </div>
          </div>
        `
      })
    };
  }

  // Calculate pricing statistics
  const rents = matches.map(p => Number(p.rentKes || p.rent_kes || p.rent || 0)).filter(r => r > 0);
  const minRent = rents.length ? Math.min(...rents) : 0;
  const maxRent = rents.length ? Math.max(...rents) : 0;
  const avgRent = rents.length ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length) : 0;

  // Build page title, heading & meta description
  const locName = location ? toTitleCase(location) : 'Nairobi';
  const subName = suburb ? toTitleCase(suburb) : null;
  const typeObj = type ? normalizeTypeFilter(type) : null;
  const typeName = typeObj ? typeObj.label : 'Apartments & Houses for Rent';

  let pageHeading = '';
  let metaTitle = '';
  let metaDesc = '';

  if (subName && typeObj) {
    pageHeading = `${typeObj.label} for Rent in ${subName}, ${locName}`;
    metaTitle = `${typeObj.label} in ${subName}, ${locName} — ${matches.length} Verified Listings | KejaMarket`;
    metaDesc = `Find ${matches.length} verified ${typeObj.label.toLowerCase()} for rent in ${subName}, ${locName}. Prices from KSh ${minRent.toLocaleString()} to KSh ${maxRent.toLocaleString()}/mo. Direct landlord contact, zero brokerage fees.`;
  } else if (subName) {
    pageHeading = `Houses & Apartments for Rent in ${subName}, ${locName}`;
    metaTitle = `Rentals in ${subName}, ${locName} — ${matches.length} Available | KejaMarket`;
    metaDesc = `Browse ${matches.length} verified apartments, bedsitters, and houses for rent in ${subName}, ${locName}. Rent ranges from KSh ${minRent.toLocaleString()} to KSh ${maxRent.toLocaleString()}. No middlemen fees.`;
  } else if (typeObj) {
    pageHeading = `${typeObj.label} for Rent in ${locName}`;
    metaTitle = `${typeObj.label} in ${locName} — ${matches.length} Verified Listings | KejaMarket`;
    metaDesc = `Search ${matches.length} verified ${typeObj.label.toLowerCase()} in ${locName}, Kenya. Average rent KSh ${avgRent.toLocaleString()}/mo. Verified landlords, genuine photos, real deposits.`;
  } else {
    pageHeading = `Verified Rental Houses & Apartments in ${locName}`;
    metaTitle = `Rentals in ${locName} — ${matches.length} Verified Houses & Apartments | KejaMarket`;
    metaDesc = `Explore ${matches.length} verified rental listings across ${locName}, Kenya. Safe, scam-free house hunting with direct landlord contacts and verified pricing.`;
  }

  // Canonical URL
  const canonicalUrl = `${BASE_URL}${originalUrl.split('?')[0]}`;

  // Breadcrumbs
  const breadcrumbs = [{ name: 'Home', url: '/' }, { name: 'Rentals', url: '/rentals/nairobi' }];
  if (location && slugify(location) !== 'nairobi') {
    breadcrumbs.push({ name: locName, url: `/rentals/${slugify(location)}` });
  }
  if (suburb) {
    breadcrumbs.push({ name: subName, url: `/rentals/${slugify(location || 'nairobi')}/${slugify(suburb)}` });
  }
  if (type) {
    breadcrumbs.push({ name: typeObj ? typeObj.label : toTitleCase(type), url: canonicalUrl });
  }

  // Schema.org ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageHeading,
    description: metaDesc,
    numberOfItems: matches.length,
    itemListElement: matches.slice(0, 30).map((p, idx) => {
      const slug = buildPropertySlug(p);
      const title = cleanTitle(p.title || `${p.category || 'Rental'} in ${p.estateSuburb || p.location}`);
      return {
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}/property/${slug}`,
        name: title
      };
    })
  };

  // Render property cards
  const cardsHtml = matches.map(p => {
    const slug = buildPropertySlug(p);
    const title = cleanTitle(p.title || `${p.category || 'Rental'} in ${p.estateSuburb || p.location}`);
    const rentVal = p.rentKes || p.rent_kes || p.rent;
    const photos = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : (p.raw_data?.photos || []);
    const photoUrl = photos[0] ? optimizeImageUrl(photos[0], 600) : 'https://kejamarket.co.ke/assets/logo.png';
    const beds = p.bedrooms || p.beds || 0;
    const sub = p.estateSuburb || p.estate_suburb || p.location || '';
    const loc = p.location || 'Nairobi';

    return `
      <article class="km-card" style="display:flex;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;border-radius:12px;background:#fff;transition:transform 0.2s,box-shadow 0.2s;">
        <a href="/property/${slug}" style="display:block;position:relative;height:220px;overflow:hidden;background:#f3f4f6;">
          <img src="${escapeHtml(photoUrl)}"
               alt="${escapeHtml(title)}"
               loading="lazy"
               style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
               onerror="this.src='https://kejamarket.co.ke/assets/logo.png'">
          ${p.isVerified !== false && p.is_verified !== false ? `
            <span style="position:absolute;top:10px;left:10px;background:#1B6A3B;color:#fff;font-size:0.75rem;font-weight:700;padding:4px 8px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
              ✓ Verified
            </span>
          ` : ''}
          <span style="position:absolute;bottom:10px;right:10px;background:rgba(15,36,25,0.85);color:#fff;font-size:0.8rem;padding:4px 8px;border-radius:6px;backdrop-filter:blur(4px);">
            📷 ${photos.length || 1} photo${photos.length !== 1 ? 's' : ''}
          </span>
        </a>
        <div style="padding:16px;display:flex;flex-direction:column;flex-grow:1;">
          <div style="font-size:1.25rem;font-weight:800;color:#1B6A3B;margin-bottom:6px;">
            ${formatPrice(rentVal)}<span style="font-size:0.85rem;color:#6b7280;font-weight:400;"> / month</span>
          </div>
          <h2 style="font-size:1.05rem;font-weight:700;color:#111827;line-height:1.4;margin:0 0 8px 0;">
            <a href="/property/${slug}" style="color:inherit;text-decoration:none;">${escapeHtml(title)}</a>
          </h2>
          <div style="font-size:0.875rem;color:#6b7280;margin-bottom:12px;display:flex;align-items:center;gap:4px;">
            📍 ${escapeHtml(sub)}${sub && loc && sub !== loc ? `, ${escapeHtml(loc)}` : ''}
          </div>
          <div style="display:flex;gap:12px;font-size:0.85rem;color:#4b5563;margin-bottom:16px;padding-top:10px;border-top:1px solid #f3f4f6;">
            ${beds ? `<span>🛏️ ${beds} Bed${beds > 1 ? 's' : ''}</span>` : `<span>🏠 ${escapeHtml(p.category || 'Rental')}</span>`}
            ${p.depositKes || p.deposit_kes ? `<span>💵 Deposit: ${formatPrice(p.depositKes || p.deposit_kes)}</span>` : ''}
          </div>
          <div style="margin-top:auto;">
            <a href="/property/${slug}" class="km-btn km-btn-primary" style="display:block;text-align:center;padding:10px 14px;border-radius:8px;text-decoration:none;">
              View Property Details →
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Popular Suburbs list for cross-linking
  const popularSuburbs = [
    { name: 'Kasarani', slug: 'kasarani' },
    { name: 'Roysambu', slug: 'roysambu' },
    { name: 'Kilimani', slug: 'kilimani' },
    { name: 'Westlands', slug: 'westlands' },
    { name: 'Ngong Road', slug: 'ngong-road' },
    { name: 'South B', slug: 'south-b' },
    { name: 'Rongai', slug: 'rongai' },
    { name: 'Ruaka', slug: 'ruaka' },
    { name: 'Kahawa West', slug: 'kahawa-west' },
    { name: 'Kileleshwa', slug: 'kileleshwa' },
    { name: 'Zimmerman', slug: 'zimmerman' },
    { name: 'Uthiru', slug: 'uthiru' }
  ];

  const body = `
    <header style="background:linear-gradient(135deg,#0F2419 0%,#1B6A3B 100%);color:#fff;padding:48px 0;border-radius:16px;margin-bottom:32px;">
      <div style="max-width:1000px;margin:0 auto;padding:0 24px;">
        <span style="display:inline-block;background:rgba(232,184,75,0.2);color:#E8B84B;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:700;margin-bottom:12px;border:1px solid rgba(232,184,75,0.4);">
          KENYA DIRECT RENTAL MARKETPLACE
        </span>
        <h1 style="font-size:2.25rem;font-weight:800;line-height:1.2;margin:0 0 14px 0;color:#fff;">
          ${escapeHtml(pageHeading)}
        </h1>
        <p style="font-size:1.1rem;color:#e5e7eb;max-width:760px;line-height:1.6;margin:0 0 24px 0;">
          ${escapeHtml(metaDesc)}
        </p>

        <!-- Live Market Stats Bar -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;background:rgba(255,255,255,0.1);padding:16px 20px;border-radius:12px;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);max-width:680px;">
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;color:#cbd5e1;letter-spacing:0.5px;">Active Listings</div>
            <div style="font-size:1.5rem;font-weight:800;color:#fff;">${matches.length}</div>
          </div>
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;color:#cbd5e1;letter-spacing:0.5px;">Lowest Rent</div>
            <div style="font-size:1.5rem;font-weight:800;color:#E8B84B;">${formatPrice(minRent)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;color:#cbd5e1;letter-spacing:0.5px;">Average Rent</div>
            <div style="font-size:1.5rem;font-weight:800;color:#fff;">${formatPrice(avgRent)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;color:#cbd5e1;letter-spacing:0.5px;">Broker Fee</div>
            <div style="font-size:1.5rem;font-weight:800;color:#34d399;">KSh 0</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Category quick filter tabs -->
    <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;margin-bottom:28px;">
      <a href="/rentals/${slugify(location || 'nairobi')}" class="km-btn ${!type ? 'km-btn-primary' : 'km-btn-outline'}" style="white-space:nowrap;font-size:0.875rem;">All Types</a>
      <a href="/rentals/${slugify(location || 'nairobi')}${suburb ? `/${slugify(suburb)}` : ''}/bedsitter" class="km-btn ${type === 'bedsitter' ? 'km-btn-primary' : 'km-btn-outline'}" style="white-space:nowrap;font-size:0.875rem;">Bedsitters</a>
      <a href="/rentals/${slugify(location || 'nairobi')}${suburb ? `/${slugify(suburb)}` : ''}/1-bedroom" class="km-btn ${type === '1-bedroom' ? 'km-btn-primary' : 'km-btn-outline'}" style="white-space:nowrap;font-size:0.875rem;">1 Bedrooms</a>
      <a href="/rentals/${slugify(location || 'nairobi')}${suburb ? `/${slugify(suburb)}` : ''}/2-bedroom" class="km-btn ${type === '2-bedroom' ? 'km-btn-primary' : 'km-btn-outline'}" style="white-space:nowrap;font-size:0.875rem;">2 Bedrooms</a>
      <a href="/rentals/${slugify(location || 'nairobi')}${suburb ? `/${slugify(suburb)}` : ''}/3-bedroom" class="km-btn ${type === '3-bedroom' ? 'km-btn-primary' : 'km-btn-outline'}" style="white-space:nowrap;font-size:0.875rem;">3 Bedrooms</a>
    </div>

    <!-- Properties Grid -->
    <main>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;margin-bottom:48px;">
        ${cardsHtml}
      </div>
    </main>

    <!-- Explore other popular Nairobi suburbs -->
    <section style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:32px;margin-top:40px;">
      <h2 style="font-size:1.35rem;font-weight:700;color:#111827;margin:0 0 8px 0;">
        Explore More Rental Locations in Nairobi
      </h2>
      <p style="color:#6b7280;font-size:0.95rem;margin:0 0 20px 0;">
        Looking in nearby areas? Check out verified direct-landlord listings in other Nairobi estates:
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${popularSuburbs.map(s => `
          <a href="/rentals/nairobi/${s.slug}" style="background:#fff;border:1px solid #d1d5db;padding:8px 14px;border-radius:20px;font-size:0.875rem;color:#374151;text-decoration:none;font-weight:500;transition:all 0.2s;">
            ${s.name} Rentals →
          </a>
        `).join('')}
      </div>
    </section>

    <!-- Rental Guides & Safety Advice -->
    <section style="margin-top:40px;padding:24px 0;">
      <h2 style="font-size:1.35rem;font-weight:700;color:#111827;margin-bottom:16px;">
        Essential Nairobi Tenant Guides
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
        <a href="/guides/how-to-verify-a-rental" style="display:block;background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px;text-decoration:none;color:inherit;">
          <div style="font-size:1.5rem;margin-bottom:8px;">🛡️</div>
          <h3 style="font-size:1.05rem;font-weight:700;color:#1B6A3B;margin:0 0 6px 0;">How to Verify a Rental in Kenya</h3>
          <p style="font-size:0.875rem;color:#6b7280;margin:0;">5 essential safety checks to avoid rental scams before paying any deposit.</p>
        </a>
        <a href="/guides/rental-deposits-kenya" style="display:block;background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px;text-decoration:none;color:inherit;">
          <div style="font-size:1.5rem;margin-bottom:8px;">💰</div>
          <h3 style="font-size:1.05rem;font-weight:700;color:#1B6A3B;margin:0 0 6px 0;">Kenya Rental Deposit Law & Rights</h3>
          <p style="font-size:0.875rem;color:#6b7280;margin:0;">What the law says about deposit refunds, notice periods, and disputes.</p>
        </a>
        <a href="/guides/moving-to-nairobi" style="display:block;background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px;text-decoration:none;color:inherit;">
          <div style="font-size:1.5rem;margin-bottom:8px;">🚚</div>
          <h3 style="font-size:1.05rem;font-weight:700;color:#1B6A3B;margin:0 0 6px 0;">Moving to Nairobi: Neighborhood Guide</h3>
          <p style="font-size:0.875rem;color:#6b7280;margin:0;">Commute times, safety ratings, water reliability, and rent budgets.</p>
        </a>
      </div>
    </section>
  `;

  const html = renderPage({
    title: metaTitle,
    description: metaDesc,
    canonical: canonicalUrl,
    jsonLd: itemListSchema,
    breadcrumbs,
    body
  });

  return { status: 200, html };
}

module.exports = { renderLocationPage, filterProperties };
