/**
 * KejaMarket SEO — Rental Guides & Knowledge Base Renderer
 * GET /guides/:slug
 *
 * Provides authoritative, helpful rental articles structured for SEO,
 * AI search engines (Copilot, Perplexity, Gemini, Google Search Generative),
 * and Kenyan tenants/landlords. Includes Schema.org Article metadata.
 */

'use strict';

const { renderPage, formatPrice, escapeHtml, BASE_URL } = require('./template');

const GUIDES_DATA = {
  'how-to-verify-a-rental': {
    title: 'How to Verify a Rental House and Avoid Scams in Kenya (2026 Guide)',
    metaTitle: 'How to Verify a Rental House & Avoid Scams in Kenya | KejaMarket',
    description: 'Protect your hard-earned money. Step-by-step verification checklist for renting an apartment or house in Nairobi, avoiding fake agents, and paying safely.',
    category: 'Tenant Safety',
    publishedDate: '2025-01-15',
    modifiedDate: '2026-03-01',
    readTime: '6 min read',
    content: `
      <h2>The Reality of House Hunting in Nairobi</h2>
      <p>Renting a house in Nairobi can be frustrating when dealing with unverified middlemen. Every month, prospective tenants lose deposit money to fraudsters posing as landlords or "caretakers." At KejaMarket, our mission is to eliminate rental fraud by connecting tenants directly with verified landlords.</p>
      
      <h2>5 Golden Rules to Protect Yourself Before Paying Any Deposit</h2>
      
      <h3>1. Never Pay a "Viewing Fee" to See a Vacant House</h3>
      <p>Legitimate landlords and registered property managers do not charge viewing fees or consultation fees. Any agent demanding KSh 1,000 to KSh 2,500 before showing you an apartment is engaging in predatory practices. On KejaMarket, all listings provide genuine photos, location details, and direct contact with zero viewing fees.</p>

      <h3>2. Inspect the Property In Person During Daylight</h3>
      <p>Always inspect the unit physically before committing. Check essential utility infrastructure:</p>
      <ul>
        <li><strong>Water supply and pressure:</strong> Ask current neighbors how many days a week water runs and whether the building has backup borehole/tanks.</li>
        <li><strong>Electricity tokens (KPLC):</strong> Check if the meter is a separate prepaid sub-meter or a shared post-paid bill with previous arrears.</li>
        <li><strong>Cellular network & internet:</strong> Test Safaricom/Airtel signal inside bedrooms and check if fiber providers (Safaricom Home Fibre, Zuku, Faiba) are installed.</li>
        <li><strong>Security:</strong> Note the compound gates, electric fencing, CCTV presence, and night security guard arrangements.</li>
      </ul>

      <h3>3. Confirm Landlord Identity and Payment Recipient</h3>
      <p>Always pay via official, traceable payment channels. When paying via Safaricom M-Pesa:</p>
      <ul>
        <li>Prefer Paybill or Buy Goods Till numbers registered to the property management firm or building name.</li>
        <li>If paying a personal phone number, ensure the name on M-Pesa matches the name on the signed tenancy agreement.</li>
        <li>Never wire money to Western Union, crypto, or untraceable third-party accounts.</li>
      </ul>

      <h3>4. Demand a Written Tenancy Agreement</h3>
      <p>A verbal agreement is legally weak. Before paying your deposit, ask for a written tenancy agreement detailing:</p>
      <ul>
        <li>Exact monthly rent and due date (e.g. 5th of each month).</li>
        <li>Security deposit amount and terms of refund upon vacation.</li>
        <li>Garbage collection fees, water rates per unit, and service charges.</li>
        <li>Notice period required before moving out (standard in Kenya is one calendar month).</li>
      </ul>

      <h3>5. Photograph Existing Damages Before Move-In</h3>
      <p>On move-in day, take clear time-stamped photos of all existing wall cracks, chipped tiles, plumbing leaks, and paint condition. Share these with the caretaker in writing (WhatsApp or email) so you are not unfairly docked from your deposit when you move out.</p>
    `
  },

  'rental-deposits-kenya': {
    title: 'Kenya Rental Deposit Rights: What the Law Says About Refunds & Deductions',
    metaTitle: 'Rental Deposits in Kenya: Law, Refunds & Deductions Explained | KejaMarket',
    description: 'Understand your legal rights as a tenant in Kenya regarding rent deposits, notice periods, lawful deductions, and how to recover your deposit when moving out.',
    category: 'Legal Rights',
    publishedDate: '2025-02-10',
    modifiedDate: '2026-02-28',
    readTime: '7 min read',
    content: `
      <h2>How Rental Deposits Work in Kenya</h2>
      <p>In the Kenyan rental market, landlords standardly require a security deposit equivalent to one month's rent (and occasionally two months in premium or furnished properties), plus a small refundable water deposit (usually KSh 1,000 to KSh 3,000) and electricity deposit.</p>

      <h2>What the Law Allows Landlords to Deduct</h2>
      <p>A deposit is <strong>not free income</strong> for the landlord. Under Kenyan tenancy practices and contract law, deposits may only be deducted for:</p>
      <ul>
        <li><strong>Unpaid rent or utility arrears:</strong> Outstanding KPLC power bills, water usage, or unpaid service charges.</li>
        <li><strong>Tenant-caused physical damage:</strong> Broken window panes, damaged sanitary fittings, unauthorized electrical modifications, or broken doors.</li>
      </ul>
      <p>Landlords <em>cannot</em> deduct for <strong>fair wear and tear</strong> — normal aging of wall paint, sun-faded window frames, or minor carpet aging over years of occupancy.</p>

      <h2>Notice Periods and Moving Out</h2>
      <p>Under Kenyan rental agreements, a tenant must give <strong>one clear calendar month's written notice</strong> before vacating. Notice given on the 15th of June typically terminates the tenancy on the 31st of July, unless otherwise mutually agreed in writing.</p>

      <h2>Step-by-Step Guide to Getting Your Full Deposit Back</h2>
      <ol>
        <li><strong>Give formal notice early:</strong> Send a formal letter or tracked email/WhatsApp one full month in advance.</li>
        <li><strong>Schedule a joint exit inspection:</strong> Request the caretaker or landlord walk through the property together 3-5 days before handing over keys.</li>
        <li><strong>Clear all utility accounts:</strong> Obtain clearance receipts from Nairobi Water or your borehole meter and print the final KPLC prepaid token statement.</li>
        <li><strong>Agree in writing on deductions:</strong> Document the agreed refund amount and expected payout date before surrendering the keys.</li>
      </ol>
    `
  },

  'moving-to-nairobi': {
    title: 'Moving to Nairobi: Neighborhoods, Commute Times, and Budget Guide',
    metaTitle: 'Moving to Nairobi Guide: Best Neighborhoods, Commutes & Rent | KejaMarket',
    description: 'The complete relocation guide for Nairobi newcomers. Compare rental prices across Westlands, Kilimani, Kasarani, Ngong Road, and Roysambu with commute tips.',
    category: 'Relocation Guide',
    publishedDate: '2025-03-01',
    modifiedDate: '2026-03-05',
    readTime: '8 min read',
    content: `
      <h2>Welcome to Nairobi: The Hub of East Africa</h2>
      <p>Nairobi is vibrant, fast-growing, and diverse. Choosing the right neighborhood depends heavily on three key factors: your workplace location, your daily transport mode, and your monthly housing budget.</p>

      <h2>Popular Nairobi Neighborhoods by Budget</h2>

      <h3>1. Budget & Starter Estates (KSh 8,000 – KSh 22,000 / month)</h3>
      <p>Ideal for university graduates, remote freelancers, and young professionals:</p>
      <ul>
        <li><strong>Kasarani & Roysambu:</strong> Thika Superhighway access. Excellent Matatu connectivity (Route 17B, 44), 24-hour amenities, TRM mall proximity. Bedsitters KSh 9k–14k, 1 bedrooms KSh 16k–22k.</li>
        <li><strong>Rongai & Ngong:</strong> Fresh air, quiet, mountain views. SGR passenger train and southern bypass. 1 bedrooms KSh 12k–18k, 2 bedrooms KSh 22k–30k.</li>
        <li><strong>Kahawa West & Zimmerman:</strong> Highly affordable student and starter rentals with direct Thika Road connections.</li>
      </ul>

      <h3>2. Mid-Market & Family Suburbs (KSh 25,000 – KSh 60,000 / month)</h3>
      <p>Popular with growing families and mid-career professionals:</p>
      <ul>
        <li><strong>South B & South C:</strong> 10-15 minutes to Nairobi CBD, reliable water supply, family-friendly gated communities. 2 bedrooms KSh 35k–50k.</li>
        <li><strong>Ruaka:</strong> Northern Bypass connectivity to Westlands and Gigiri (UN complex). Modern high-rises, Two Rivers Mall. 1 bedrooms KSh 22k–30k, 2 bedrooms KSh 35k–55k.</li>
        <li><strong>Ngong Road (Dagoretti Corner to Karen border):</strong> Fast dual-carriage highway commute to Upper Hill and CBD.</li>
      </ul>

      <h3>3. Upper-Middle & Expat Enclaves (KSh 60,000+ / month)</h3>
      <p>Walkable, cosmopolitan, close to international schools and embassies:</p>
      <ul>
        <li><strong>Kilimani & Kileleshwa:</strong> Modern apartments, backup generators, swimming pools, high walkability to restaurants and shopping centers.</li>
        <li><strong>Westlands & Parklands:</strong> Nairobi’s commercial center. Great for tech workers, financial analysts, and expatriates.</li>
      </ul>
    `
  },

  'rental-areas-nairobi': {
    title: 'Top Rental Areas in Nairobi Compared: Safety, Rent, Water & Transport',
    metaTitle: 'Nairobi Rental Areas Compared: Rent, Water, Safety & Matatus | KejaMarket',
    description: 'Comprehensive breakdown of Nairobi residential estates. Compare average rents, water reliability, matatu routes, and security across 15+ suburbs.',
    category: 'Area Guide',
    publishedDate: '2025-01-20',
    modifiedDate: '2026-03-02',
    readTime: '9 min read',
    content: `
      <h2>Comparing Nairobi Suburbs for Renters</h2>
      <p>Finding a home in Nairobi requires balancing rent cost against infrastructure reality. Here is an honest, field-verified breakdown of key Nairobi residential corridors.</p>

      <h2>Thika Road Corridor (Roysambu, Kasarani, Garden Estate, Kahawa)</h2>
      <p><strong>Transport:</strong> Superhighway with high-frequency matatus (fare KSh 50-100 off-peak). Average commute to CBD is 25-45 minutes.</p>
      <p><strong>Water:</strong> Mostly reliable due to shared city lines and borehole drilling in newer high-rise developments.</p>
      <p><strong>Verdict:</strong> Best value for money for tech workers, college alumni, and young couples seeking modern finishes at sensible prices.</p>

      <h2>Westlands & Kilimani Corridor</h2>
      <p><strong>Transport:</strong> Expressway connectivity, taxi-hailing (Uber/Bolt) wait times under 3 minutes.</p>
      <p><strong>Amenities:</strong> Gyms, co-working hubs, high-speed fibre, 24/7 security teams.</p>
      <p><strong>Verdict:</strong> Premier executive living with unmatched social life and international dining.</p>

      <h2>Mombasa Road & Eastlands Corridor (South B, South C, Imara Daima)</h2>
      <p><strong>Transport:</strong> Nairobi Commuter Rail, Expressway entry points, direct airport access.</p>
      <p><strong>Verdict:</strong> Established, community-focused neighborhoods with longstanding schools and religious centers.</p>
    `
  },

  'bedsitter-guide': {
    title: 'The Ultimate Bedsitter Hunting Guide in Nairobi: Layouts, Rent & Costs',
    metaTitle: 'Bedsitter Hunting Guide Nairobi: Prices, Tips & What to Check | KejaMarket',
    description: 'Everything you need to know before renting a bedsitter or studio in Nairobi. Average rent prices by estate, kitchen layouts, security, and hidden utility costs.',
    category: 'Apartment Types',
    publishedDate: '2025-02-01',
    modifiedDate: '2026-03-04',
    readTime: '5 min read',
    content: `
      <h2>What is a Bedsitter in Kenya?</h2>
      <p>In Kenya, a "bedsitter" is an open-plan self-contained apartment where the bedroom and living area are combined into one single space, with a separate private bathroom and an integrated kitchenette corner. It differs from a "single room" because a bedsitter has its own private inside bathroom and sink.</p>

      <h2>Typical Nairobi Bedsitter Rent Ranges</h2>
      <ul>
        <li><strong>Kasarani / Zimmerman / Kahawa West:</strong> KSh 7,500 – KSh 12,000 / month</li>
        <li><strong>Roysambu / Lumumba Drive:</strong> KSh 10,000 – KSh 15,000 / month</li>
        <li><strong>Ruaka / Ndenderu:</strong> KSh 12,000 – KSh 18,000 / month</li>
        <li><strong>South B / Nairobi West:</strong> KSh 14,000 – KSh 20,000 / month</li>
        <li><strong>Kilimani / Kileleshwa (Studios):</strong> KSh 28,000 – KSh 45,000 / month</li>
      </ul>

      <h2>Key Features to Look for in a Quality Bedsitter</h2>
      <ul>
        <li><strong>Kitchen ventilation:</strong> Since cooking occurs in the same room you sleep, check that the kitchen window opens directly outside or has an exhaust hood.</li>
        <li><strong>Natural daylight:</strong> Beware of ground-floor units blocked by adjacent high-rises that require artificial lighting all day.</li>
        <li><strong>Wardrobe space:</strong> A built-in wardrobe saves you significant floor space.</li>
        <li><strong>Separate token meter:</strong> Never accept a shared electricity bill where the landlord divides consumption among 10 units.</li>
      </ul>
    `
  },

  '1-bedroom-guide': {
    title: '1-Bedroom House Hunting Guide in Nairobi: Price Trends & Best Locations',
    metaTitle: '1 Bedroom House Hunting Guide Nairobi: Locations & Rent | KejaMarket',
    description: 'Find the best 1-bedroom apartments for rent in Nairobi. Detailed comparison of rent, security, layouts, and master ensuite features across popular estates.',
    category: 'Apartment Types',
    publishedDate: '2025-02-15',
    modifiedDate: '2026-03-01',
    readTime: '6 min read',
    content: `
      <h2>Why 1-Bedroom Rentals Are Nairobi’s Most In-Demand Units</h2>
      <p>A 1-bedroom apartment provides a dedicated separate bedroom, distinct living room, enclosed kitchen, and private balcony. It is the gold standard for couples, corporate professionals working remotely, and tenants wanting privacy when hosting guests.</p>

      <h2>What to Budget for a 1-Bedroom Apartment in Nairobi</h2>
      <p>Based on active real-time listings on KejaMarket, 1-bedroom rental prices divide into three primary tiers:</p>
      <ul>
        <li><strong>Affordable (KSh 14,000 – KSh 22,000):</strong> Kasarani, Roysambu, Rongai, Kahawa Sukari, Uthiru.</li>
        <li><strong>Mid-Market (KSh 23,000 – KSh 40,000):</strong> Ruaka, South B, Ngong Road, Thindigua, Kiambu Road.</li>
        <li><strong>High-End (KSh 45,000 – KSh 85,000):</strong> Kilimani, Kileleshwa, Westlands, Lavington (often includes gym, pool, lift, borehole, generator).</li>
      </ul>

      <h2>Must-Have Amenities Checklist</h2>
      <ul>
        <li>Balcony with laundry hanging space and plumbing for washing machine.</li>
        <li>Ample kitchen storage cupboards with granite or tiled countertops.</li>
        <li>Designated tenant parking spot inside the gated compound.</li>
        <li>Fast fiber broadband readiness (Safaricom Home Fibre or Faiba box pre-wired).</li>
      </ul>
    `
  },

  'landlord-guide': {
    title: 'Landlord Guide: How to Attract Verified, Reliable Tenants in Nairobi Fast',
    metaTitle: 'Landlord Guide: Fill Vacancies Fast with Reliable Tenants | KejaMarket',
    description: 'Tips for Nairobi property owners and caretakers. How to photograph your rental, set competitive pricing, vet tenant profiles, and eliminate prolonged vacancy rates.',
    category: 'Landlords',
    publishedDate: '2025-01-10',
    modifiedDate: '2026-02-25',
    readTime: '6 min read',
    content: `
      <h2>The Cost of Vacant Units in Nairobi</h2>
      <p>In Nairobi's competitive rental market, an empty apartment sitting unrented for two months costs more than a 10% rent discount. Finding reliable, long-term tenants quickly requires modern digital marketing and direct transparency.</p>

      <h2>4 Steps to Rent Out Your Unit in Days on KejaMarket</h2>
      
      <h3>1. Take Bright, Wide-Angle Daytime Photos</h3>
      <p>Over 80% of tenants browse listings on their smartphones. Clean the apartment, open all curtains to let in natural daylight, and capture:</p>
      <ul>
        <li>The full living room showing floor tiling and windows.</li>
        <li>The kitchen showing cupboards, sink, and cooking station.</li>
        <li>The bedroom showing the wardrobe and natural light.</li>
        <li>The clean bathroom with shower fittings.</li>
        <li>The external building facade, secure gate, and parking lot.</li>
      </ul>

      <h3>2. Price Realistically Based on Live Neighborhood Data</h3>
      <p>Use KejaMarket’s neighborhood rent trackers to compare what similar units in your immediate estate are renting for. A slightly competitive rent with an honest security deposit attracts multiple verified applications immediately.</p>

      <h3>3. Cut Out Fraudulent Middlemen</h3>
      <p>Unregistered rogue agents often inflate rents or demand viewing fees that turn away good tenants. Listing directly on KejaMarket gives you verified direct inquiries from genuine tenants with zero brokerage commissions.</p>

      <h3>4. Maintain Tenant Retention</h3>
      <p>Prompt maintenance (fixing plumbing leaks quickly, ensuring borehole pumps run smoothly) is the single biggest factor in keeping tenants renewal after renewal.</p>
    `
  }
};

/**
 * Render Guide Page
 */
async function renderGuidePage(store, slug) {
  const guide = GUIDES_DATA[slug];

  if (!guide) {
    return {
      status: 404,
      html: renderPage({
        title: 'Guide Not Found | KejaMarket Kenya',
        description: 'The requested rental guide could not be found on KejaMarket.',
        canonical: `${BASE_URL}/guides`,
        noindex: true,
        body: `
          <div style="max-width:640px;margin:80px auto;text-align:center;padding:0 16px;">
            <div style="font-size:3.5rem;margin-bottom:16px;">📚</div>
            <h1 style="font-size:1.8rem;color:#1B6A3B;margin-bottom:12px;">Guide Article Not Found</h1>
            <p style="color:#4b5563;font-size:1.05rem;line-height:1.6;margin-bottom:28px;">
              The guide you are looking for might have been moved or updated. Explore our full library of tenant and landlord resources below.
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

  // Calculate live database stats for relevance if applicable
  let statBoxHtml = '';
  try {
    const allProps = (await store.getAllProperties()) || [];
    const active = allProps.filter(p => p.isActive !== false && p.is_active !== false);
    
    if (slug === 'bedsitter-guide') {
      const bedsitters = active.filter(p => (p.category || '').toLowerCase().includes('bedsitter'));
      const rents = bedsitters.map(p => Number(p.rentKes || p.rent_kes || p.rent || 0)).filter(r => r > 0);
      if (rents.length > 0) {
        const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
        const min = Math.min(...rents);
        statBoxHtml = `
          <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:12px;padding:20px;margin:24px 0;">
            <div style="font-weight:700;color:#1B6A3B;margin-bottom:6px;">📊 KejaMarket Live Bedsitter Market Data</div>
            <div style="font-size:0.95rem;color:#2e7d32;line-height:1.5;">
              Currently tracking <strong>${rents.length} verified bedsitters</strong> across Nairobi. Average rent: <strong>${formatPrice(avg)}/month</strong> (starting from <strong>${formatPrice(min)}</strong>).
            </div>
            <a href="/rentals/nairobi/bedsitter" style="display:inline-block;margin-top:10px;font-weight:600;color:#1B6A3B;text-decoration:underline;">
              Browse available bedsitters →
            </a>
          </div>
        `;
      }
    } else if (slug === '1-bedroom-guide') {
      const oneBeds = active.filter(p => Number(p.bedrooms || p.beds || 0) === 1);
      const rents = oneBeds.map(p => Number(p.rentKes || p.rent_kes || p.rent || 0)).filter(r => r > 0);
      if (rents.length > 0) {
        const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
        const min = Math.min(...rents);
        statBoxHtml = `
          <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:12px;padding:20px;margin:24px 0;">
            <div style="font-weight:700;color:#1B6A3B;margin-bottom:6px;">📊 KejaMarket Live 1-Bedroom Market Data</div>
            <div style="font-size:0.95rem;color:#2e7d32;line-height:1.5;">
              Currently tracking <strong>${rents.length} verified 1-bedroom apartments</strong> across Nairobi. Average rent: <strong>${formatPrice(avg)}/month</strong> (starting from <strong>${formatPrice(min)}</strong>).
            </div>
            <a href="/rentals/nairobi/1-bedroom" style="display:inline-block;margin-top:10px;font-weight:600;color:#1B6A3B;text-decoration:underline;">
              Browse available 1-bedroom listings →
            </a>
          </div>
        `;
      }
    }
  } catch (err) {
    // Ignore stats fetch error, article will still render
  }

  const canonicalUrl = `${BASE_URL}/guides/${slug}`;

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides/how-to-verify-a-rental' },
    { name: guide.category, url: canonicalUrl }
  ];

  // Schema.org Article JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: guide.title,
    description: guide.description,
    image: 'https://kejamarket.co.ke/assets/logo.png',
    datePublished: guide.publishedDate,
    dateModified: guide.modifiedDate,
    author: {
      '@type': 'Organization',
      name: 'KejaMarket Editorial Team',
      url: BASE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'KejaMarket Kenya',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kejamarket.co.ke/assets/logo.png'
      }
    }
  };

  const body = `
    <article style="max-width:820px;margin:0 auto;padding:16px 0 48px 0;">
      <!-- Article Header -->
      <header style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block;background:#e8f5e9;color:#1B6A3B;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;margin-bottom:12px;text-transform:uppercase;">
          ${escapeHtml(guide.category)}
        </span>
        <h1 style="font-size:2.25rem;font-weight:800;color:#111827;line-height:1.25;margin:0 0 16px 0;">
          ${escapeHtml(guide.title)}
        </h1>
        <div style="display:flex;align-items:center;gap:16px;font-size:0.875rem;color:#6b7280;flex-wrap:wrap;">
          <span>✍️ KejaMarket Research</span>
          <span>📅 Updated: ${guide.modifiedDate}</span>
          <span>⏱️ ${guide.readTime}</span>
        </div>
      </header>

      <!-- Live stats box if available -->
      ${statBoxHtml}

      <!-- Article Main Body -->
      <div style="font-size:1.05rem;line-height:1.8;color:#374151;">
        ${guide.content}
      </div>

      <!-- Call to Action Banner -->
      <div style="background:linear-gradient(135deg,#0F2419 0%,#1B6A3B 100%);color:#fff;border-radius:16px;padding:32px;margin:48px 0;text-align:center;">
        <h2 style="font-size:1.5rem;font-weight:800;color:#fff;margin:0 0 10px 0;">Ready to Find Your Next Home in Nairobi?</h2>
        <p style="color:#d1fae5;font-size:1rem;max-width:540px;margin:0 auto 20px auto;">
          Explore verified apartments with direct landlord contacts, zero fake photos, and zero viewing fees.
        </p>
        <a href="/rentals/nairobi" class="km-btn km-btn-primary" style="background:#E8B84B;color:#0F2419;font-weight:800;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">
          Browse Nairobi Listings →
        </a>
      </div>

      <!-- Other Useful Guides -->
      <section style="border-top:1px solid #e5e7eb;padding-top:32px;">
        <h3 style="font-size:1.25rem;font-weight:700;color:#111827;margin-bottom:16px;">Related Rental Guides</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
          ${Object.entries(GUIDES_DATA)
            .filter(([gSlug]) => gSlug !== slug)
            .slice(0, 3)
            .map(([gSlug, g]) => `
              <a href="/guides/${gSlug}" style="display:block;background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:10px;text-decoration:none;color:inherit;transition:background 0.2s;">
                <div style="font-size:0.75rem;font-weight:700;color:#1B6A3B;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(g.category)}</div>
                <h4 style="font-size:0.95rem;font-weight:700;color:#111827;margin:0 0 6px 0;line-height:1.4;">${escapeHtml(g.title)}</h4>
                <div style="font-size:0.8rem;color:#6b7280;">${g.readTime}</div>
              </a>
            `).join('')}
        </div>
      </section>
    </article>
  `;

  const html = renderPage({
    title: guide.metaTitle,
    description: guide.description,
    canonical: canonicalUrl,
    jsonLd: articleSchema,
    breadcrumbs,
    body
  });

  return { status: 200, html };
}

module.exports = { renderGuidePage, GUIDES_DATA };
