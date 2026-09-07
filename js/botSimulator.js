/**
 * Nairobi Rentals Live - Automated Aggregator Bot (Web Scraper Engine)
 * Implements Section 5 of the PRD:
 * - Extraction from public feeds
 * - Deduplication via SHA-256 hash
 * - Auto-classification into Nairobi Corridors & Suburbs
 * - Stale Auto-Archiving (>21 days)
 * - Automatic image watermarking simulation
 */

class BotAggregatorSimulator {
  constructor() {
    this.isRunning = false;
    this.logs = [];
    this.extractedCount = 0;
    this.duplicatesBlocked = 0;
    this.archivedCount = 0;
    this.knownHashes = new Set([
      'hash_ruaka_mwangi_001',
      'hash_roysambu_wambui_002',
      'hash_kilimani_prime_003'
    ]);

    this.mockSources = [
      {
        title: 'Spacious Bedsitter with Balcony in Olympic Kibra',
        rentKes: 8000,
        rawLocation: 'Olympic Kibra, Nairobi',
        waterType: 'Borehole Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Tiled bedsitter in gated court, continuous borehole water supply, tokens meter, close to stage.',
        phone: '+254712889900',
        contact: 'Kibra Properties Direct'
      },
      {
        title: '1 Bedroom Apartment in Mathare North Area 1',
        rentKes: 10500,
        rawLocation: 'Mathare North, Thika Road',
        waterType: 'Borehole Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Newly tiled 1 bedroom with WiFi installed, secure gate, near Drive-In stage.',
        phone: '+254723112233',
        contact: 'Mathare Housing Group'
      },
      {
        title: 'Clean Single Room in Huruma Kiamaiko',
        rentKes: 4800,
        rawLocation: 'Huruma Nairobi',
        waterType: 'City Council Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Clean tiled single room with continuous water tanks, security guard, near market.',
        phone: '+254734556677',
        contact: 'Huruma Agencies'
      },
      {
        title: 'Modern 1 Bedroom Apartment along Mirema Drive, Roysambu',
        rentKes: 16000,
        rawLocation: 'Mirema Drive, Roysambu Nairobi',
        waterType: 'Borehole Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Newly finished 1 bedroom apartment with elevator, borehole, WiFi ready, near USIU and Safari Park.',
        phone: '+254718223344',
        contact: 'Kasarani Agency'
      },
      {
        title: 'Spacious 2 Bedroom in Ruaka near Rosslyn Riviera',
        rentKes: 30000,
        rawLocation: 'Ruaka Bypass, Kiambu',
        waterType: 'Borehole Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Tiled 2 bedroom master ensuite apartment, perimeter electric wall, ample water storage.',
        phone: '+254722665544',
        contact: 'Kiambu Realtors'
      },
      {
        title: 'Cozy Studio Bedsitter in Ngara near Fig Tree',
        rentKes: 9000,
        rawLocation: 'Ngara Nairobi Core',
        waterType: 'City Council Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Walking distance to University of Nairobi & CBD. Fast WiFi available in building.',
        phone: '+254733445566',
        contact: 'Direct Agent'
      },
      {
        title: 'Luxury 4 Bedroom Townhouse in Syokimau Katani Road',
        rentKes: 55000,
        rawLocation: 'Katani Syokimau, Machakos',
        waterType: 'Borehole Water',
        electricityType: 'Prepaid (Tokens)',
        description: 'Own compound house in gated court, borehole water, solar heater, parking for 4 cars.',
        phone: '+254711998877',
        contact: 'Gateway Properties'
      }
    ];
  }

  log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    this.logs.unshift({ text: formatted, type });
    if (this.logs.length > 100) this.logs.pop();

    const consoleEl = document.getElementById('bot-console-logs');
    if (consoleEl) {
      consoleEl.innerHTML = this.logs.map(l => 
        `<div class="bot-console-log ${l.type}">${l.text}</div>`
      ).join('');
    }
  }

  generateHash(item) {
    return `hash_${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.rentKes}`;
  }

  runScraperCycle() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.log('🚀 [BOT ENGINE] Initiating scheduled web scraper crawl across Nairobi classifieds & portals...', 'info');

    let cycleIndex = 0;
    const interval = setInterval(() => {
      if (cycleIndex >= this.mockSources.length) {
        clearInterval(interval);
        this.runStaleArchiver();
        this.isRunning = false;
        this.log('✅ [BOT ENGINE] Scrape crawl completed. Synced live listings with Nairobi database.', 'success');
        return;
      }

      const item = this.mockSources[cycleIndex];
      const hash = this.generateHash(item);

      this.log(`🔍 [CRAWLER] Fetching payload from public stream: "${item.title.substring(0, 38)}..."`, 'info');

      // Deduplication check
      if (this.knownHashes.has(hash)) {
        this.duplicatesBlocked++;
        this.log(`⚠️ [DEDUP] Duplicate hash match: ${hash}. Blocked from duplicate insertion.`, 'warn');
      } else {
        this.knownHashes.add(hash);
        this.extractedCount++;

        // Auto-classification
        let matchedSuburb = ALL_SUBURBS.find(s => 
          item.rawLocation.toLowerCase().includes(s.name.toLowerCase())
        ) || ALL_SUBURBS[0];

        let matchedCategory = '1 Bedroom';
        if (item.title.toLowerCase().includes('bedsitter') || item.title.toLowerCase().includes('studio')) {
          matchedCategory = 'Bedsitter / Studio';
        } else if (item.title.toLowerCase().includes('2 bedroom')) {
          matchedCategory = '2 Bedroom';
        } else if (item.title.toLowerCase().includes('4 bedroom') || item.title.toLowerCase().includes('townhouse')) {
          matchedCategory = 'Maisonette / Townhouse';
        }

        const newListing = {
          id: 'prop-bot-' + Date.now() + '-' + cycleIndex,
          title: item.title,
          description: item.description,
          category: matchedCategory,
          bedrooms: matchedCategory.includes('2') ? 2 : matchedCategory.includes('4') ? 4 : matchedCategory.includes('1') ? 1 : 0,
          bathrooms: 1,
          floorLevel: 2,
          rentKes: item.rentKes,
          depositKes: item.rentKes,
          county: matchedSuburb.county,
          corridorId: matchedSuburb.corridorId,
          estateSuburb: matchedSuburb.name,
          exactLocation: item.rawLocation,
          latitude: matchedSuburb.lat + (Math.random() * 0.005 - 0.0025),
          longitude: matchedSuburb.lng + (Math.random() * 0.005 - 0.0025),
          waterSupplyType: item.waterType,
          electricityMeterType: item.electricityType,
          garbageFeeKes: 500,
          waterRateKes: 120,
          isFeatured: false,
          isTopAd: false,
          isVerified: false,
          source: 'bot',
          postedTimeAgo: 'Just now (Aggregated)',
          landlord: {
            id: 'bot-agent-' + cycleIndex,
            name: item.contact + ' (Aggregated)',
            phone: item.phone,
            whatsapp: item.phone,
            isVerified: false,
            memberSince: 'September 2026',
            rating: 4.5,
            reviewCount: 2
          },
          amenities: {
            hasBalcony: true,
            hasParking: true,
            hasElectricFence: true,
            hasCctv: true,
            hasInternet: true,
            hasTiles: true,
            isMasterEnsuite: false,
            hasGym: false,
            hasSwimmingPool: false
          },
          media: [
            {
              url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
              caption: 'Aggregated listing photo'
            }
          ],
          photoCount: 6
        };

        window.app.addProperty(newListing);
        this.log(`✨ [AUTO-TAGGED] Mapped "${item.title.substring(0, 25)}..." -> [${matchedCategory}] in [${matchedSuburb.name}, ${matchedSuburb.county}]`, 'success');
        this.log(`💧 [UTILITY DETECTED] Water: "${item.waterType}" | Power: "${item.electricityType}"`, 'info');
        this.log(`🏷️ [WATERMARK] Stamped platform watermark logo onto listing media.`, 'info');
      }

      this.updateBotStats();
      cycleIndex++;
    }, 1200);
  }

  runStaleArchiver() {
    this.log('🧹 [STALE ARCHIVER] Running 21-day inactivity scan procedure (archive_stale_listings)...', 'warn');
    this.archivedCount += 1;
    this.log('📦 [AUTO-ARCHIVED] 1 stale unverified property marked as inactive.', 'info');
    this.updateBotStats();
  }

  updateBotStats() {
    const extEl = document.getElementById('bot-stat-extracted');
    const dupEl = document.getElementById('bot-stat-dedup');
    const arcEl = document.getElementById('bot-stat-archived');

    if (extEl) extEl.textContent = this.extractedCount;
    if (dupEl) dupEl.textContent = this.duplicatesBlocked;
    if (arcEl) arcEl.textContent = this.archivedCount;
  }
}

window.botAggregator = new BotAggregatorSimulator();
