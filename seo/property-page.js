/**
 * KejaMarket SEO — Individual Property Page Renderer
 * GET /property/:slug
 *
 * Reads the real property record from the DB and renders a full HTML page
 * with correct SEO metadata, JSON-LD structured data, photos, amenities,
 * and genuine reviews. The existing POST /api/properties route is UNTOUCHED.
 */

'use strict';

const { renderPage, buildPropertySlug, formatPrice, cleanTitle, escapeHtml, slugify, BASE_URL } = require('./template');

/**
 * Build amenity list from property_amenities record
 */
function buildAmenities(amenities) {
  if (!amenities) return [];
  const map = [
    { key: 'has_balcony',           icon: '🏞️', label: 'Balcony' },
    { key: 'has_parking',           icon: '🚗', label: 'Parking' },
    { key: 'has_electric_fence',    icon: '⚡', label: 'Electric Fence' },
    { key: 'has_cctv',              icon: '📷', label: 'CCTV Security' },
    { key: 'has_internet',          icon: '📶', label: 'Internet / Wi-Fi' },
    { key: 'has_tiles',             icon: '🪟', label: 'Tiled Floors' },
    { key: 'is_master_ensuite',     icon: '🛁', label: 'Master Ensuite' },
    { key: 'has_gym',               icon: '💪', label: 'Gym' },
    { key: 'has_swimming_pool',     icon: '🏊', label: 'Swimming Pool' },
    { key: 'has_backup_generator',  icon: '🔋', label: 'Backup Generator' },
    { key: 'is_pet_friendly',       icon: '🐾', label: 'Pet Friendly' },
  ];
  return map.filter(a => amenities[a.key] === true || amenities[a.key] === 't' || amenities[a.key] === 1);
}

/**
 * Build Cloudinary-optimised image URL (auto quality, auto format, max 1200px wide)
 */
function optimizeImageUrl(url, w = 1200) {
  if (!url) return '';
  if (url.includes('cloudinary.com') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
  }
  return url;
}

/**
 * Resolve property from slug or full UUID
 * Slug format: {first8}-{beds}bed-{cat}-{suburb}
 * We match by the first 8-char prefix of the UUID (after removing dashes)
 */
async function resolveProperty(store, slugOrId) {
  // Try direct UUID lookup first
  try {
    const direct = await store.getPropertyById(slugOrId);
    if (direct) return direct;
  } catch (_) { /* not a valid UUID */ }

  // Extract the 8-char prefix from slug
  const prefix = slugOrId.split('-')[0];
  if (!prefix || prefix.length < 6) return null;

  // Fetch all properties and match by ID prefix
  try {
    const all = await store.getAllProperties();
    if (!all) return null;
    return all.find(p => {
      const cleanId = (p.id || '').replace(/-/g, '');
      return cleanId.startsWith(prefix);
    }) || null;
  } catch (_) {
    return null;
  }
}

/**
 * Render star rating HTML
 */
function stars(rating) {
  const full = Math.round(Number(rating) || 0);
  return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(0, 5 - full));
}

/**
 * Render the individual property page HTML
 */
async function renderPropertyPage(store, slugOrId) {
  const raw = await resolveProperty(store, slugOrId);

  if (!raw) return { status: 404, html: null };

  // Map DB fields (supports both camelCase and snake_case)
  const property = {
    id: raw.id,
    title: cleanTitle(raw.title),
    description: raw.description || raw.desc || '',
    category: raw.category || '',
    bedrooms: raw.bedrooms || raw.beds || 0,
    bathrooms: raw.bathrooms || raw.baths || 1,
    floorLevel: raw.floor_level || raw.floorLevel || null,
    rentKes: Number(raw.rent_kes || raw.rentKes || raw.rent || 0),
    depositKes: Number(raw.deposit_kes || raw.depositKes || raw.deposit || 0),
    waterSupply: raw.water_supply_type || raw.waterSupply || '',
    electricityType: raw.electricity_meter_type || raw.electricityType || '',
    garbageFee: Number(raw.garbage_fee_kes || raw.garbageFee || 0),
    estateSuburb: raw.estate_suburb || raw.estateSuburb || raw.location || '',
    county: raw.county || 'Nairobi',
    corridor: raw.corridor || '',
    exactAddress: raw.exact_address_notes || raw.exactAddress || '',
    isBnb: raw.is_bnb || raw.isBnb || false,
    rentPeriod: raw.rent_period || raw.rentPeriod || 'month',
    isActive: raw.is_active !== false && raw.isActive !== false,
    isFeatured: raw.is_featured || raw.isFeatured || false,
    isVerified: raw.is_verified !== false || raw.isVerified !== false,
    lastVerifiedAt: raw.last_verified_at || raw.lastVerifiedAt || null,
    createdAt: raw.created_at || raw.createdAt || null,
    updatedAt: raw.updated_at || raw.updatedAt || null,
    photos: raw.photos || [],
    media: raw.media || [],
    amenities: raw.amenities || raw.property_amenities || null,
    reviews: raw.reviews || [],
    landlord: raw.landlord || null,
  };

  // Build the canonical slug and URL
  const slug = buildPropertySlug({ ...property, id: raw.id });
  const canonicalUrl = `${BASE_URL}/property/${slug}`;

  // Resolve photos (support both array-of-strings and array-of-objects)
  let photoUrls = [];
  if (property.media && property.media.length > 0) {
    photoUrls = property.media.map(m => m.url || m.image_url || m).filter(Boolean);
  } else if (property.photos && property.photos.length > 0) {
    photoUrls = property.photos.filter(Boolean);
  }
  const primaryPhoto = photoUrls[0] ? optimizeImageUrl(photoUrls[0]) : '';
  const thumbPhotos = photoUrls.slice(1, 8).map(u => optimizeImageUrl(u, 400));

  // === SEO Metadata ===
  const locationStr = property.estateSuburb || property.county;
  const priceStr = formatPrice(property.rentKes);
  const periodStr = property.isBnb ? 'per night' : 'per month';
  const bedsStr = property.bedrooms > 0 ? `${property.bedrooms} Bedroom ` : '';
  const pageTitle = `${bedsStr}${property.category} for Rent in ${locationStr}, ${property.county} | KejaMarket`;
  const pageDesc = `${property.title} in ${locationStr}. ${priceStr}/${property.isBnb ? 'night' : 'month'}. ${
    property.description ? property.description.substring(0, 120).replace(/\s+/g, ' ').trim() + '...' : ''
  } Find verified rentals on KejaMarket.`;

  // === Breadcrumbs ===
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Rentals', url: '/rentals/nairobi' },
    { name: locationStr, url: `/rentals/nairobi/${slugify(locationStr)}` },
    { name: property.title }
  ];

  // === JSON-LD: Accommodation / LodgingBusiness ===
  const schemaType = property.isBnb ? 'LodgingBusiness' : 'Accommodation';
  const jsonLd = [];

  const accommodationSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: property.title,
    description: property.description,
    url: canonicalUrl,
    image: photoUrls.slice(0, 5).map(u => optimizeImageUrl(u)),
    address: {
      '@type': 'PostalAddress',
      addressLocality: locationStr,
      addressRegion: property.county,
      addressCountry: 'KE'
    },
    geo: (raw.latitude && raw.longitude) ? {
      '@type': 'GeoCoordinates',
      latitude: raw.latitude,
      longitude: raw.longitude
    } : undefined,
    numberOfRooms: property.bedrooms || undefined,
    amenityFeature: buildAmenities(property.amenities).map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a.label,
      value: true
    })),
    priceRange: priceStr + ' ' + periodStr,
  };

  // Add genuine reviews/ratings only if they exist
  if (property.reviews && property.reviews.length > 0) {
    const avgRating = property.reviews.reduce((s, r) => s + Number(r.rating_overall || r.rating || 0), 0) / property.reviews.length;
    accommodationSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: property.reviews.length,
      bestRating: 5,
      worstRating: 1
    };
    accommodationSchema.review = property.reviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author_name || r.authorName || 'Tenant' },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating_overall || r.rating || 3,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: r.review_text || r.text || ''
    }));
  }

  jsonLd.push(accommodationSchema);

  // RealEstateListing schema
  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: canonicalUrl,
    datePosted: property.createdAt ? new Date(property.createdAt).toISOString() : undefined,
    offers: {
      '@type': 'Offer',
      price: property.rentKes,
      priceCurrency: 'KES',
      availability: property.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut'
    }
  });

  // BreadcrumbList schema
  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url ? `${BASE_URL}${b.url}` : canonicalUrl
    }))
  });

  // === Build amenity HTML ===
  const amenityList = buildAmenities(property.amenities);
  const amenitiesHtml = amenityList.length > 0
    ? `<div class="km-section">
        <h2 class="km-section-title">Amenities & Features</h2>
        <div class="km-amenities">
          ${amenityList.map(a => `
            <div class="km-amenity">
              <span class="km-amenity-icon">${a.icon}</span>
              <span>${escapeHtml(a.label)}</span>
            </div>`).join('')}
        </div>
      </div>`
    : '';

  // === Reviews HTML ===
  const reviewsHtml = property.reviews && property.reviews.length > 0
    ? `<div class="km-section">
        <h2 class="km-section-title">Tenant Reviews (${property.reviews.length})</h2>
        ${property.reviews.slice(0, 5).map(r => `
          <div class="km-review">
            <div class="km-review-header">
              <span class="km-review-author">${escapeHtml(r.author_name || r.authorName || 'Tenant')}</span>
              <span class="km-stars">${stars(r.rating_overall || r.rating)}</span>
            </div>
            <p class="km-review-text">${escapeHtml(r.review_text || r.text || '')}</p>
          </div>`).join('')}
      </div>`
    : '';

  // === WhatsApp contact ===
  const waPhone = property.landlord?.whatsapp || property.landlord?.phone || '';
  const waMsg = encodeURIComponent(`Hello, I found your listing on KejaMarket: "${property.title}" at ${priceStr}/month. Is it still available?`);
  const waLink = waPhone
    ? `https://wa.me/${waPhone.replace(/[^0-9]/g, '')}?text=${waMsg}`
    : `https://wa.me/?text=${waMsg}`;

  // Status notice for inactive listings
  const inactiveBanner = !property.isActive
    ? `<div class="km-unavailable-banner" role="alert">
        <span>⚠️</span>
        <p>This listing is no longer active. It may have been rented or taken down. Browse similar properties below.</p>
      </div>`
    : '';

  // === Gallery HTML ===
  const galleryHtml = primaryPhoto
    ? `<div class="km-gallery">
        <img
          src="${escapeHtml(primaryPhoto)}"
          alt="${escapeHtml(property.title)} - ${escapeHtml(locationStr)}, ${escapeHtml(property.county)}"
          class="km-gallery-main"
          loading="eager"
          fetchpriority="high"
          width="800" height="380"
        >
        ${thumbPhotos.length > 0 ? `
        <div class="km-gallery-thumbs" aria-label="Property photo thumbnails">
          ${thumbPhotos.map((u, i) => `
            <img
              src="${escapeHtml(u)}"
              alt="${escapeHtml(property.title)} photo ${i + 2}"
              loading="lazy"
              width="80" height="60"
              onclick="document.querySelector('.km-gallery-main').src='${escapeHtml(u.replace('/upload/', '/upload/f_auto,q_auto,w_1200/'))}'"
            >`).join('')}
        </div>` : ''}
      </div>`
    : `<div class="km-gallery" style="height:180px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;">🏠</div>`;

  // === Body HTML ===
  const body = `
    ${inactiveBanner}
    <div class="km-property-grid">
      <div>
        ${galleryHtml}

        <div class="km-property-header">
          <h1 class="km-property-title">${escapeHtml(property.title)}</h1>
          <p class="km-property-location">📍 ${escapeHtml(locationStr)}, ${escapeHtml(property.county)}, Kenya</p>
          <div class="km-price-tag">
            ${escapeHtml(priceStr)}
            <span class="km-price-period">/${property.isBnb ? 'night' : 'month'}</span>
          </div>
          <div class="km-badges">
            ${property.isVerified ? '<span class="km-badge verified">✅ KejaMarket Verified</span>' : ''}
            ${property.isFeatured ? '<span class="km-badge featured">⭐ Featured</span>' : ''}
            ${property.isBnb ? '<span class="km-badge">🏨 Airbnb / Short Stay</span>' : ''}
            ${!property.isActive ? '<span class="km-badge inactive">⚠️ No Longer Available</span>' : ''}
          </div>
        </div>

        <!-- Quick Details -->
        <div class="km-section">
          <h2 class="km-section-title">Property Details</h2>
          <div class="km-details-card">
            <div class="km-details-grid">
              ${property.bedrooms > 0 ? `<div class="km-detail-item"><span class="km-detail-label">Bedrooms</span><span class="km-detail-value">🛏️ ${property.bedrooms}</span></div>` : ''}
              ${property.bathrooms > 0 ? `<div class="km-detail-item"><span class="km-detail-label">Bathrooms</span><span class="km-detail-value">🚿 ${property.bathrooms}</span></div>` : ''}
              ${property.category ? `<div class="km-detail-item"><span class="km-detail-label">Type</span><span class="km-detail-value">${escapeHtml(property.category)}</span></div>` : ''}
              ${property.floorLevel != null ? `<div class="km-detail-item"><span class="km-detail-label">Floor</span><span class="km-detail-value">${property.floorLevel === 0 ? 'Ground Floor' : `Floor ${property.floorLevel}`}</span></div>` : ''}
              ${property.waterSupply ? `<div class="km-detail-item"><span class="km-detail-label">Water</span><span class="km-detail-value">💧 ${escapeHtml(property.waterSupply)}</span></div>` : ''}
              ${property.electricityType ? `<div class="km-detail-item"><span class="km-detail-label">Electricity</span><span class="km-detail-value">⚡ ${escapeHtml(property.electricityType)}</span></div>` : ''}
              ${property.depositKes > 0 ? `<div class="km-detail-item"><span class="km-detail-label">Deposit</span><span class="km-detail-value">${escapeHtml(formatPrice(property.depositKes))}</span></div>` : ''}
              ${property.garbageFee > 0 ? `<div class="km-detail-item"><span class="km-detail-label">Garbage Fee</span><span class="km-detail-value">${escapeHtml(formatPrice(property.garbageFee))}/mo</span></div>` : ''}
              ${property.exactAddress ? `<div class="km-detail-item" style="grid-column:1/-1"><span class="km-detail-label">Location Notes</span><span class="km-detail-value">${escapeHtml(property.exactAddress)}</span></div>` : ''}
            </div>
          </div>
        </div>

        <!-- Description -->
        ${property.description ? `
        <div class="km-section">
          <h2 class="km-section-title">About this Property</h2>
          <p class="km-description">${escapeHtml(property.description)}</p>
        </div>` : ''}

        ${amenitiesHtml}
        ${reviewsHtml}

        <!-- Internal links -->
        <div class="km-section">
          <h2 class="km-section-title">More Rentals Like This</h2>
          <p style="color:#6b7280;font-size:0.9rem">
            Browse more
            <a href="/rentals/nairobi/${slugify(locationStr)}">${escapeHtml(locationStr)} rentals</a>
            or
            <a href="/rentals/type/${slugify(property.category)}">${escapeHtml(property.category)} listings</a>
            on KejaMarket.
          </p>
        </div>
      </div>

      <!-- Sidebar / Contact Card -->
      <aside>
        <div class="km-contact-card">
          <p class="km-contact-title">Interested in this property?</p>
          <p style="font-size:1.5rem;font-weight:800;color:#1B6A3B;margin-bottom:16px">${escapeHtml(priceStr)}<span style="font-size:0.875rem;font-weight:400;color:#6b7280">/${property.isBnb ? 'night' : 'month'}</span></p>

          <a href="${escapeHtml(waLink)}" class="km-cta-btn whatsapp" target="_blank" rel="noopener noreferrer" id="btn-wa-contact">
            📱 WhatsApp Landlord
          </a>
          <a href="/" class="km-cta-btn secondary" id="btn-view-on-kejamarket">
            View on KejaMarket
          </a>

          ${property.landlord ? `
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280">
            <p><strong style="color:#1a1a1a">${escapeHtml(property.landlord.name || 'Landlord')}</strong></p>
            ${property.landlord.isVerified ? '<p style="color:#059669">✅ Verified Landlord</p>' : ''}
            ${property.landlord.isAgency ? `<p>${escapeHtml(property.landlord.agencyName || 'Agency')}</p>` : ''}
          </div>` : ''}

          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
            <p style="font-size:0.75rem;color:#9ca3af;text-align:center">
              🔒 Never pay deposit before viewing. Always verify the landlord.
              <a href="/guides/how-to-verify-a-rental" style="display:block;margin-top:4px;">Safety guide →</a>
            </p>
          </div>
        </div>

        <!-- Posted date -->
        ${property.createdAt ? `
        <div style="margin-top:12px;font-size:0.75rem;color:#9ca3af;text-align:center">
          Listed: ${new Date(property.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>` : ''}
      </aside>
    </div>
  `;

  const html = renderPage({
    title: pageTitle,
    description: pageDesc,
    canonical: canonicalUrl,
    ogImage: primaryPhoto || undefined,
    jsonLd,
    breadcrumbs,
    body,
    noindex: !property.isActive,
  });

  return { status: 200, html };
}

module.exports = { renderPropertyPage, resolveProperty, buildAmenities, optimizeImageUrl };
