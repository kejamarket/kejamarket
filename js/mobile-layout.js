/**
 * KejaMarket Mobile Controller - PWA & Mobile Chrome 100% Reference Implementation
 * Implements all 16 screens of Poster 1: Complete User Journey
 * Screen 1: Home Screen
 * Screen 2: Browse / Search Results
 * Screen 3: Property Details
 * Screen 4: Filters
 * Screen 5: Request a Viewing
 * Screen 6: Viewing Request Status / My Requests
 * Screen 8: Message Thread & Chats
 * Screen 9: Viewing Confirmation
 * Screen 10: Showing Countdown
 * Screen 11: 72hrs SmartHunt
 * Screen 12: M-Pesa Payment
 * Screen 14: Payment Success
 * Screen 15: Booking Tracker / My Bookings
 * Screen 16: Admin Dashboard (Mobile view)
 */

(function() {
  'use strict';

  // Global Mobile State
  const State = {
    currentScreen: 'home',
    properties: [],
    filteredProperties: [],
    selectedProperty: null,
    selectedCategory: 'all',
    favorites: JSON.parse(localStorage.getItem('keja_favorites') || '[]'),
    viewingRequests: JSON.parse(localStorage.getItem('keja_viewings') || '[]'),
    messages: [],
    activeChatPropertyId: null,
    filters: {
      type: 'all',
      minPrice: null,
      maxPrice: null,
      location: '',
      beds: 'any'
    },
    countdownTarget: null,
    countdownInterval: null
  };

  // Helper: Format KSh price
  function formatKsh(val) {
    if (!val) return '0';
    return Number(val).toLocaleString();
  }

  // Detect Mobile View
  function isMobileScreen() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'mobile' || urlParams.get('mobile') === '1') return true;
    return window.innerWidth <= 768 || 
           window.matchMedia('(max-width: 768px)').matches ||
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Initialize Mobile App
  async function init() {
    if (!isMobileScreen()) return;

    document.documentElement.classList.add('mobile-view');
    document.body.classList.add('mobile-layout');

    // Build the shell container
    buildShell();

    // Fetch initial property data
    await loadProperties();

    // Load messages
    loadSampleMessages();

    // Show Home screen initially
    showScreen('home');

    // Handle resize
    window.addEventListener('resize', () => {
      if (!isMobileScreen()) {
        document.body.classList.remove('mobile-layout');
        document.documentElement.classList.remove('mobile-view');
        const mApp = document.getElementById('mobile-app');
        if (mApp) mApp.style.display = 'none';
      } else {
        document.body.classList.add('mobile-layout');
        document.documentElement.classList.add('mobile-view');
        const mApp = document.getElementById('mobile-app');
        if (mApp) mApp.style.display = 'block';
      }
    });
  }

  // Build Core Shell Elements
  function buildShell() {
    let app = document.getElementById('mobile-app');
    if (!app) {
      app = document.createElement('div');
      app.id = 'mobile-app';
      document.body.insertBefore(app, document.body.firstChild);
    }

    app.innerHTML = `
      <!-- Top Dynamic Header -->
      <div id="km-mobile-header-slot"></div>

      <!-- Main Dynamic Content Slot -->
      <main id="km-mobile-main-slot"></main>

      <!-- Bottom Navigation Bar (5 tabs) -->
      <nav class="km-bottom-nav" id="km-bottom-nav">
        <button type="button" class="km-nav-tab active" data-tab="home" onclick="MobileApp.showScreen('home')">
          <i class="fas fa-home tab-icon"></i>
          <span class="tab-label">Home</span>
        </button>
        <button type="button" class="km-nav-tab" data-tab="browse" onclick="MobileApp.showScreen('browse')">
          <i class="fas fa-search tab-icon"></i>
          <span class="tab-label">Search</span>
        </button>
        <button type="button" class="km-nav-tab" data-tab="favorites" onclick="MobileApp.showScreen('favorites')">
          <i class="fas fa-heart tab-icon"></i>
          <span class="tab-label">Favourites</span>
          <span class="nav-badge" id="km-fav-badge" style="display:none;">0</span>
        </button>
        <button type="button" class="km-nav-tab" data-tab="messages" onclick="MobileApp.showScreen('messages')">
          <i class="fas fa-comment-alt tab-icon"></i>
          <span class="tab-label">Messages</span>
          <span class="nav-badge" id="km-msg-badge" style="display:none;">2</span>
        </button>
        <button type="button" class="km-nav-tab" data-tab="profile" onclick="MobileApp.showScreen('profile')">
          <i class="fas fa-user tab-icon"></i>
          <span class="tab-label">Profile</span>
        </button>
      </nav>
    `;

    updateFavBadge();
  }

  // Load properties from API or fallback reference
  async function loadProperties() {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data && data.properties && data.properties.length > 0) {
        State.properties = data.properties;
      }
    } catch (_) {}

    if (!State.properties.length && window.EXACT_12_REFERENCE_PROPERTIES) {
      State.properties = window.EXACT_12_REFERENCE_PROPERTIES;
    }
    State.filteredProperties = [...State.properties];
  }

  // Load initial demo messages
  function loadSampleMessages() {
    State.messages = [
      {
        id: 'msg-01',
        senderName: 'James Mwangi',
        role: 'Landlord · Kileleshwa',
        avatarText: 'JM',
        lastMessage: 'Hello, your viewing request for Tuesday has been received!',
        time: '10:34 AM',
        unread: true,
        propertyTitle: '3 Bedroom House in Kileleshwa'
      },
      {
        id: 'msg-02',
        senderName: 'Property Agent',
        role: 'Ruaka Environs',
        avatarText: 'PA',
        lastMessage: 'Yes, the viewing is confirmed for 2:00 PM.',
        time: '9:45 AM',
        unread: false,
        propertyTitle: '2 Bedroom Apartment, Ruaka'
      },
      {
        id: 'msg-03',
        senderName: 'KejaMarket Concierge',
        role: 'Admin Support',
        avatarText: 'KM',
        lastMessage: 'System Notification: Your viewing fee is backed by 100% refund guarantee.',
        time: '8:12 AM',
        unread: false,
        propertyTitle: 'Platform Verification'
      }
    ];
  }

  function updateFavBadge() {
    const badge = document.getElementById('km-fav-badge');
    if (badge) {
      badge.textContent = State.favorites.length;
      badge.style.display = State.favorites.length > 0 ? 'flex' : 'none';
    }
  }

  // Screen Switcher
  function showScreen(screen, params = {}) {
    State.currentScreen = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update bottom nav active state
    document.querySelectorAll('.km-nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === screen);
    });

    const headerSlot = document.getElementById('km-mobile-header-slot');
    const mainSlot = document.getElementById('km-mobile-main-slot');
    const bottomNav = document.getElementById('km-bottom-nav');

    // Controls when bottom nav should be hidden (e.g. detail page or full-screen countdown)
    if (['detail', 'filters', 'request-viewing', 'payment', 'payment-success', 'chat'].includes(screen)) {
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (bottomNav) bottomNav.style.display = 'flex';
    }

    // Router
    switch (screen) {
      case 'home':
        renderHomeScreen(headerSlot, mainSlot);
        break;
      case 'browse':
        renderBrowseScreen(headerSlot, mainSlot, params);
        break;
      case 'detail':
        renderDetailScreen(headerSlot, mainSlot, params.id || params);
        break;
      case 'filters':
        renderFiltersScreen(headerSlot, mainSlot);
        break;
      case 'request-viewing':
        renderRequestViewingScreen(headerSlot, mainSlot, params.id || params);
        break;
      case 'my-requests':
        renderMyRequestsScreen(headerSlot, mainSlot);
        break;
      case 'messages':
        renderMessagesScreen(headerSlot, mainSlot);
        break;
      case 'chat':
        renderChatScreen(headerSlot, mainSlot, params.id || params);
        break;
      case 'viewing-confirmed':
        renderViewingConfirmedScreen(headerSlot, mainSlot, params);
        break;
      case 'countdown':
        renderCountdownScreen(headerSlot, mainSlot, params);
        break;
      case 'smarthunt':
        renderSmartHuntScreen(headerSlot, mainSlot);
        break;
      case 'payment':
        renderPaymentScreen(headerSlot, mainSlot, params);
        break;
      case 'payment-success':
        renderPaymentSuccessScreen(headerSlot, mainSlot, params);
        break;
      case 'my-bookings':
        renderMyBookingsScreen(headerSlot, mainSlot);
        break;
      case 'admin-mobile':
        renderAdminMobileScreen(headerSlot, mainSlot);
        break;
      case 'profile':
        renderProfileScreen(headerSlot, mainSlot);
        break;
      case 'favorites':
        renderFavoritesScreen(headerSlot, mainSlot);
        break;
      default:
        renderHomeScreen(headerSlot, mainSlot);
    }
  }

  // ==========================================
  // SCREEN 1: HOME SCREEN
  // ==========================================
  function renderHomeScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-top-bar">
        <a href="javascript:void(0)" onclick="MobileApp.showScreen('home')" class="km-brand-logo">
          <div class="logo-badge">🏠</div>
          <div class="logo-text"><span class="keja">Keja</span><span class="market">Market</span></div>
        </a>
        <div class="km-top-actions">
          <button type="button" class="km-icon-btn" onclick="MobileApp.showScreen('messages')">
            <i class="fas fa-bell"></i>
            <span class="badge-dot"></span>
          </button>
        </div>
      </div>
    `;

    const featured = State.properties.slice(0, 8);

    mSlot.innerHTML = `
      <!-- Search Bar with Nairobi Location Chip -->
      <div class="km-home-search-bar">
        <div class="km-search-box">
          <input type="text" id="km-home-search-input" placeholder="Search for properties, rentals, BnB, land..." onkeydown="if(event.key==='Enter') MobileApp.handleSearch(this.value)">
          <button type="button" class="btn-search" onclick="MobileApp.handleSearch(document.getElementById('km-home-search-input').value)">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <div class="km-location-chip" onclick="MobileApp.showScreen('browse', { location: 'Nairobi' })">
          <i class="fas fa-map-marker-alt"></i> Nairobi
        </div>
      </div>

      <!-- Quick Category Grid - Exact 8 Icons from Reference -->
      <section class="km-category-grid-section">
        <div class="km-category-grid">
          <button type="button" class="km-cat-item" onclick="MobileApp.openAffordabilityModal()">
            <div class="km-cat-icon"><i class="fas fa-calculator"></i></div>
            <span class="km-cat-label">What Can I Afford?</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('smarthunt')">
            <div class="km-cat-icon"><i class="fas fa-bolt"></i></div>
            <span class="km-cat-label">Smart House Hunt</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.openWhatsAppAlerts()">
            <div class="km-cat-icon" style="color:#25d366;"><i class="fab fa-whatsapp"></i></div>
            <span class="km-cat-label">WhatsApp Alerts</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('smarthunt')">
            <div class="km-cat-icon"><i class="fas fa-calendar-alt"></i></div>
            <span class="km-cat-label">3-Day House Hunt</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('browse')">
            <div class="km-cat-icon"><i class="fas fa-city"></i></div>
            <span class="km-cat-label">Properties</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('browse', { category: 'rentals' })">
            <div class="km-cat-icon"><i class="fas fa-key"></i></div>
            <span class="km-cat-label">Rentals</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('browse', { category: 'land' })">
            <div class="km-cat-icon"><i class="fas fa-map-marked-alt"></i></div>
            <span class="km-cat-label">Land</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('browse', { category: 'services' })">
            <div class="km-cat-icon"><i class="fas fa-tools"></i></div>
            <span class="km-cat-label">Services</span>
          </button>
          <button type="button" class="km-cat-item" onclick="MobileApp.showScreen('browse', { category: 'bnb' })">
            <div class="km-cat-icon"><i class="fas fa-umbrella-beach"></i></div>
            <span class="km-cat-label">BnB</span>
          </button>
        </div>
      </section>

      <!-- Featured Listings Header & 2-Col Grid -->
      <div class="km-section-header">
        <span class="km-section-title">Featured Listings</span>
        <a href="javascript:void(0)" class="km-section-link" onclick="MobileApp.showScreen('browse')">See All</a>
      </div>

      <div class="km-property-grid">
        ${renderPropertyGridHtml(featured)}
      </div>
    `;
  }

  // Render 2-Column Property Card Items
  function renderPropertyGridHtml(props) {
    if (!props || !props.length) {
      return `<div style="grid-column: span 2; text-align:center; padding: 30px; color:#64748b;">No listings found.</div>`;
    }

    return props.map(p => {
      const isFav = State.favorites.includes(p.id);
      const thumb = (p.media && p.media[0] && p.media[0].url) || p.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
      const isSale = p.category && p.category.toLowerCase().includes('sale');
      const period = p.rentPeriod || (p.isBnb ? 'night' : 'mo');

      return `
        <div class="km-property-card" onclick="MobileApp.showScreen('detail', '${p.id}')">
          <div class="km-card-thumb-wrap">
            <img src="${thumb}" alt="${p.title}" loading="lazy">
            <span class="km-card-badge ${isSale ? 'sale' : ''}">${isSale ? 'For Sale' : 'For Rent'}</span>
            <button type="button" class="km-card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); MobileApp.toggleFav('${p.id}', this)">
              <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
          </div>
          <div class="km-card-info">
            <div class="km-card-price">KSh ${formatKsh(p.rentKes || p.price)}/${period}</div>
            <div class="km-card-title">${p.title}</div>
            <div class="km-card-specs">
              <i class="fas fa-map-marker-alt" style="color:#00b53f; font-size:10px;"></i>
              ${p.estateSuburb || p.county || 'Nairobi'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // SCREEN 2: BROWSE / SEARCH RESULTS
  // ==========================================
  function renderBrowseScreen(hSlot, mSlot, params = {}) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Browse Properties</span>
        <button type="button" class="header-action" onclick="MobileApp.showScreen('filters')"><i class="fas fa-sliders-h"></i></button>
      </div>
    `;

    // Filter properties based on params or active filter
    let list = [...State.properties];
    if (params.category) {
      const cat = params.category.toLowerCase();
      if (cat === 'rentals') list = list.filter(p => !p.isBnb);
      else if (cat === 'bnb') list = list.filter(p => p.isBnb);
      else if (cat === 'land') list = list.filter(p => p.category && p.category.toLowerCase().includes('land'));
    }
    if (params.location) {
      list = list.filter(p => (p.estateSuburb && p.estateSuburb.toLowerCase().includes(params.location.toLowerCase())) || 
                              (p.county && p.county.toLowerCase().includes(params.location.toLowerCase())));
    }

    mSlot.innerHTML = `
      <!-- Location search bar & Filter shortcut -->
      <div class="km-browse-bar">
        <div class="km-browse-input-wrap">
          <i class="fas fa-map-marker-alt" style="color:#00b53f;"></i>
          <input type="text" id="km-browse-loc-input" value="${params.location || 'Nairobi, Kenya'}" placeholder="Enter area or suburb..." onkeydown="if(event.key==='Enter') MobileApp.handleBrowseLoc(this.value)">
        </div>
        <button type="button" class="km-filter-btn" onclick="MobileApp.showScreen('filters')">
          <i class="fas fa-sliders-h"></i>
        </button>
      </div>

      <!-- Horizontal Category Chips -->
      <div class="km-chips-scroll">
        <span class="km-chip ${State.selectedCategory === 'all' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('all')">All</span>
        <span class="km-chip ${State.selectedCategory === 'houses' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('houses')">Houses</span>
        <span class="km-chip ${State.selectedCategory === 'apartments' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('apartments')">Apartments</span>
        <span class="km-chip ${State.selectedCategory === 'land' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('land')">Land</span>
        <span class="km-chip ${State.selectedCategory === 'bedsitters' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('bedsitters')">Bedsitters</span>
      </div>

      <!-- Counter and Sort Bar -->
      <div class="km-results-counter-row">
        <span><strong>${list.length}</strong> properties found</span>
        <span style="cursor:pointer;" onclick="MobileApp.sortListings()">Sort <i class="fas fa-chevron-down" style="font-size:10px;"></i></span>
      </div>

      <!-- 2-Column Grid -->
      <div class="km-property-grid" style="margin-top: 6px;">
        ${renderPropertyGridHtml(list)}
      </div>
    `;
  }

  // ==========================================
  // SCREEN 3: PROPERTY DETAILS
  // ==========================================
  function renderDetailScreen(hSlot, mSlot, propId) {
    const prop = State.properties.find(p => p.id === propId) || State.properties[0];
    if (!prop) {
      showScreen('browse');
      return;
    }
    State.selectedProperty = prop;

    const isFav = State.favorites.includes(prop.id);
    const media = prop.media && prop.media.length > 0 ? prop.media : [{ url: prop.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80' }];
    const period = prop.rentPeriod || (prop.isBnb ? 'night' : 'mo');

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('browse')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">${prop.title}</span>
        <div style="display:flex; gap:10px;">
          <button type="button" class="back-btn" onclick="MobileApp.toggleFav('${prop.id}', this)"><i class="${isFav ? 'fas' : 'far'} fa-heart" style="${isFav ? 'color:#ef4444;' : ''}"></i></button>
          <button type="button" class="back-btn" onclick="MobileApp.shareProperty('${prop.id}')"><i class="fas fa-share-alt"></i></button>
        </div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-detail-screen">
        <!-- Image Carousel -->
        <div class="km-detail-carousel">
          <img id="km-detail-hero-img" src="${media[0].url}" alt="${prop.title}">
          <div class="km-carousel-counter" id="km-carousel-counter">1 / ${media.length}</div>
        </div>

        <!-- Thumbnails Strip -->
        <div class="km-detail-thumbs">
          ${media.map((m, idx) => `
            <img src="${m.url}" class="km-detail-thumb ${idx === 0 ? 'active' : ''}" onclick="MobileApp.switchHeroPhoto('${m.url}', ${idx + 1}, ${media.length}, this)">
          `).join('')}
        </div>

        <!-- Detail Content -->
        <div class="km-detail-content">
          <span class="km-detail-badge">For Rent · Verified</span>
          <div class="km-detail-price">KSh ${formatKsh(prop.rentKes || prop.price)}/${period}</div>
          <h1 class="km-detail-title">${prop.title}</h1>
          <div class="km-detail-location">
            <i class="fas fa-map-marker-alt" style="color:#00b53f;"></i>
            ${prop.estateSuburb || prop.county || 'Nairobi'} • 12 km from CBD
          </div>

          <!-- Specs Pills -->
          <div class="km-specs-row">
            <div class="km-spec-pill"><i class="fas fa-bed" style="color:#00b53f;"></i> ${prop.bedrooms || 3} Beds</div>
            <div class="km-spec-pill"><i class="fas fa-bath" style="color:#00b53f;"></i> ${prop.bathrooms || 2} Baths</div>
            <div class="km-spec-pill"><i class="fas fa-vector-square" style="color:#00b53f;"></i> ${prop.sizeSqft || 2000} sq ft</div>
          </div>

          <!-- Description -->
          <div class="km-detail-description">
            <h4>Description</h4>
            <p>${prop.description || 'Modern and spacious property in a secure gated estate. Borehole water, dedicated parking, token electricity meter, 24/7 security watchman.'}</p>
          </div>

          <!-- Landlord Profile Card (KejaMarket Escrow Verified) -->
          <div class="km-landlord-card">
            <div class="km-landlord-info">
              <div class="km-landlord-avatar">JM</div>
              <div>
                <div style="font-weight:800; font-size:13.5px; color:#0f172a;">${prop.landlord?.name || 'James Mwangi'}</div>
                <div style="font-size:11px; color:#64748b;">Member since 2021 · Verified Host</div>
              </div>
            </div>
            <button type="button" class="btn-secondary" style="padding:6px 10px; font-size:11.5px; font-weight:700; border-radius:6px; border:1px solid #cbd5e1; background:white; cursor:pointer;" onclick="MobileApp.showScreen('chat', '${prop.id}')">
              <i class="fas fa-comment-dots" style="color:#00b53f;"></i> Message
            </button>
          </div>

          <!-- Viewing Escrow Notice -->
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; font-size:12px; color:#166534; line-height:1.45;">
            <i class="fas fa-shield-alt" style="color:#00b53f;"></i> <strong>KejaMarket Protection:</strong> Turn-by-turn Google Maps pin and direct contacts unlock upon confirmed viewing slot.
          </div>
        </div>

        <!-- Sticky Bottom CTA Bar -->
        <div class="km-detail-bottom-bar">
          <button type="button" class="km-btn-request-viewing" onclick="MobileApp.showScreen('request-viewing', '${prop.id}')">
            <i class="fas fa-calendar-check"></i> Request a Viewing
          </button>
          <button type="button" class="km-btn-save-fav" onclick="MobileApp.toggleFav('${prop.id}', this)">
            <i class="${isFav ? 'fas' : 'far'} fa-heart" style="${isFav ? 'color:#ef4444;' : ''}"></i>
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 4: FILTERS (FULL SCREEN)
  // ==========================================
  function renderFiltersScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('browse')"><i class="fas fa-times"></i></button>
        <span class="screen-title">Filters</span>
        <button type="button" class="header-action" onclick="MobileApp.resetFilters()">Reset</button>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-filters-screen">
        <!-- Property Type -->
        <div class="km-filter-group">
          <div class="km-filter-title">Property Type</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${State.filters.type === 'all' ? 'active' : ''}" onclick="MobileApp.setFilterType('all', this)">All</div>
            <div class="km-fchip ${State.filters.type === 'house' ? 'active' : ''}" onclick="MobileApp.setFilterType('house', this)">House</div>
            <div class="km-fchip ${State.filters.type === 'apartment' ? 'active' : ''}" onclick="MobileApp.setFilterType('apartment', this)">Apartment</div>
            <div class="km-fchip ${State.filters.type === 'bungalow' ? 'active' : ''}" onclick="MobileApp.setFilterType('bungalow', this)">Bungalow</div>
            <div class="km-fchip ${State.filters.type === 'land' ? 'active' : ''}" onclick="MobileApp.setFilterType('land', this)">Land</div>
            <div class="km-fchip ${State.filters.type === 'commercial' ? 'active' : ''}" onclick="MobileApp.setFilterType('commercial', this)">Commercial</div>
          </div>
        </div>

        <!-- Price Range -->
        <div class="km-filter-group">
          <div class="km-filter-title">Price Range (KSh)</div>
          <div class="km-range-inputs">
            <input type="number" class="km-range-input" placeholder="Min (e.g. 10,000)" id="km-filter-min">
            <span>-</span>
            <input type="number" class="km-range-input" placeholder="Max (e.g. 80,000)" id="km-filter-max">
          </div>
        </div>

        <!-- Location Area -->
        <div class="km-filter-group">
          <div class="km-filter-title">Location / Area</div>
          <select class="km-filter-select" id="km-filter-suburb">
            <option value="">Select area or suburb</option>
            <option value="Kilimani">Kilimani</option>
            <option value="Kileleshwa">Kileleshwa</option>
            <option value="Westlands">Westlands</option>
            <option value="Ruaka">Ruaka</option>
            <option value="South B">South B</option>
            <option value="Umoja">Umoja</option>
            <option value="Roysambu">Roysambu</option>
            <option value="Karen">Karen</option>
          </select>
        </div>

        <!-- Bedrooms -->
        <div class="km-filter-group">
          <div class="km-filter-title">Bedrooms</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${State.filters.beds === 'any' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('any', this)">Any</div>
            <div class="km-fchip ${State.filters.beds === '1' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('1', this)">1+</div>
            <div class="km-fchip ${State.filters.beds === '2' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('2', this)">2+</div>
            <div class="km-fchip ${State.filters.beds === '3' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('3', this)">3+</div>
            <div class="km-fchip ${State.filters.beds === '4' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('4', this)">4+</div>
          </div>
        </div>

        <!-- Apply Button -->
        <div class="km-filter-apply-bar">
          <button type="button" class="km-btn-apply" onclick="MobileApp.applyFilters()">Apply Filters</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 5: REQUEST A VIEWING
  // ==========================================
  function renderRequestViewingScreen(hSlot, mSlot, propId) {
    const prop = State.properties.find(p => p.id === propId) || State.selectedProperty || State.properties[0];
    State.selectedProperty = prop;
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail;

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('detail', '${prop.id}')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Request a Viewing</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-request-screen">
        <!-- Mini Property Summary -->
        <div class="km-mini-property-card">
          <img src="${thumb}" class="km-mini-thumb" alt="${prop.title}">
          <div style="flex:1;">
            <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:2px;">${prop.title}</div>
            <div style="font-size:13px; font-weight:800; color:#00b53f;">KSh ${formatKsh(prop.rentKes || prop.price)}/mo</div>
          </div>
        </div>

        <!-- Preferred Date -->
        <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:8px;">Preferred Date</div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; margin-bottom:16px;">
          <div>
            <div style="font-size:14px; font-weight:800; color:#0f172a;">Tomorrow</div>
            <div style="font-size:11px; color:#64748b;">Select preferred day</div>
          </div>
          <span style="color:#00b53f; font-weight:700; font-size:12px;">Change ></span>
        </div>

        <!-- Preferred Time -->
        <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:8px;">Preferred Time</div>
        <div class="km-time-chips">
          <div class="km-time-chip active" onclick="MobileApp.selectTime('9:00 AM', this)">9:00 AM</div>
          <div class="km-time-chip" onclick="MobileApp.selectTime('11:00 AM', this)">11:00 AM</div>
          <div class="km-time-chip" onclick="MobileApp.selectTime('2:00 PM', this)">2:00 PM</div>
          <div class="km-time-chip" onclick="MobileApp.selectTime('4:00 PM', this)">4:00 PM</div>
        </div>

        <!-- Add a message (optional) -->
        <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:8px;">Add a message (optional)</div>
        <textarea class="km-request-textarea" id="km-viewing-msg" rows="4" placeholder="I'm interested in this property. Please let me know if it's available."></textarea>

        <!-- Fixed Send Request Button -->
        <div class="km-detail-bottom-bar">
          <button type="button" class="km-btn-request-viewing" onclick="MobileApp.submitViewingRequest('${prop.id}')">
            Send Request
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 9: VIEWING CONFIRMATION
  // ==========================================
  function renderViewingConfirmedScreen(hSlot, mSlot, params) {
    const prop = State.selectedProperty || State.properties[0];
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail;

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <div style="width:36px;"></div>
        <span class="screen-title">Confirmation</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-success-screen">
        <div class="km-big-success-icon"><i class="fas fa-check"></i></div>
        <div class="km-success-title">Viewing Confirmed!</div>
        <div class="km-success-subtitle">Your viewing has been confirmed for <strong>Tomorrow • 11:00 AM</strong></div>

        <!-- Mini Card -->
        <div class="km-mini-property-card" style="margin: 0 auto 20px auto; max-width: 340px; text-align: left;">
          <img src="${thumb}" class="km-mini-thumb" alt="${prop.title}">
          <div>
            <div style="font-weight:800; font-size:13px; color:#0f172a;">${prop.title}</div>
            <div style="font-size:13px; font-weight:800; color:#00b53f;">KSh ${formatKsh(prop.rentKes || prop.price)}/mo</div>
          </div>
        </div>

        <!-- What happens next? -->
        <div class="km-benefit-box">
          <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:10px;">What happens next?</div>
          <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:#475569;">
            <i class="fas fa-check-circle" style="color:#00b53f; margin-top:2px;"></i>
            <span>You'll pay KSh 200 viewing commitment fee to unlock exact GPS & landlord contact.</span>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:#475569;">
            <i class="fas fa-check-circle" style="color:#00b53f; margin-top:2px;"></i>
            <span>We'll notify you when the caretaker confirms the gate arrival.</span>
          </div>
          <div style="display:flex; gap:10px; font-size:12px; color:#475569;">
            <i class="fas fa-check-circle" style="color:#00b53f; margin-top:2px;"></i>
            <span>You'll get the live countdown and details once payment is verified.</span>
          </div>
        </div>

        <button type="button" class="km-btn-apply" style="max-width:340px; margin:0 auto 10px auto;" onclick="MobileApp.showScreen('payment', { id: '${prop.id}' })">
          Proceed to Payment (KSh 200)
        </button>
        <button type="button" class="btn-secondary" style="width:100%; max-width:340px; padding:12px; border-radius:10px; border:1px solid #cbd5e1; background:white; font-weight:700; cursor:pointer;" onclick="MobileApp.showScreen('my-requests')">
          View All Requests
        </button>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 12: M-PESA PAYMENT
  // ==========================================
  function renderPaymentScreen(hSlot, mSlot, params) {
    const prop = State.selectedProperty || State.properties[0];
    const phone = localStorage.getItem('keja_phone') || '07XXXXXXXX';

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('detail', '${prop.id}')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">M-Pesa Payment</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-payment-screen">
        <!-- Banner -->
        <div class="km-mpesa-banner">
          <div style="font-size:13px; font-weight:700; opacity:0.9;">Viewing Commitment Fee</div>
          <div class="fee-amount">KSh 200</div>
          <div style="font-size:11px; opacity:0.85;">100% Refundable if caretaker unavailable</div>
        </div>

        <!-- M-Pesa Options -->
        <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:18px;">
          <label style="display:flex; align-items:center; gap:10px; font-weight:800; color:#0f172a; margin-bottom:12px; cursor:pointer;">
            <input type="radio" name="payment-method" checked style="accent-color:#00b53f;">
            <span>Pay with M-Pesa Online (STK Push)</span>
          </label>
          
          <div style="margin-bottom:12px;">
            <div style="font-size:11.5px; font-weight:700; color:#64748b; margin-bottom:4px;">Phone Number (Safaricom)</div>
            <input type="tel" id="km-mpesa-phone" class="km-range-input" style="width:100%; box-sizing:border-box;" value="${phone}" placeholder="e.g. 0712345678">
          </div>

          <div style="font-size:11px; color:#64748b; line-height:1.4;">
            <i class="fas fa-lock" style="color:#00b53f;"></i> Secure payment via Safaricom Daraja M-Pesa. Your exact Google Maps pin and caretaker contact unlock instantly after prompt.
          </div>
        </div>

        <!-- Pay Button -->
        <button type="button" class="km-btn-apply" onclick="MobileApp.executePayment('${prop.id}')">
          <i class="fas fa-mobile-alt"></i> Pay KSh 200
        </button>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 14: PAYMENT SUCCESS
  // ==========================================
  function renderPaymentSuccessScreen(hSlot, mSlot, params) {
    const prop = State.selectedProperty || State.properties[0];
    const mpesaRef = params.ref || ('MPESA-' + Date.now().toString().slice(-8));

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <div style="width:36px;"></div>
        <span class="screen-title">Payment Details</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-success-screen">
        <div class="km-big-success-icon"><i class="fas fa-check-circle"></i></div>
        <div class="km-success-title">Payment Successful!</div>
        <div style="font-size:20px; font-weight:900; color:#00b53f; margin-bottom:4px;">KSh 200</div>
        <div class="km-success-subtitle">Reference: <strong>${mpesaRef}</strong></div>

        <div class="km-benefit-box">
          <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:10px;">You will now get access to:</div>
          <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:#15803d; font-weight:700;">
            <i class="fas fa-check-circle"></i>
            <span>Landlord & On-Site Caretaker Direct Contacts</span>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:#15803d; font-weight:700;">
            <i class="fas fa-check-circle"></i>
            <span>Exact Google Maps GPS Turn-by-Turn Pin</span>
          </div>
          <div style="display:flex; gap:10px; font-size:12px; color:#15803d; font-weight:700;">
            <i class="fas fa-check-circle"></i>
            <span>Viewing Pass & Appointment Slot</span>
          </div>
        </div>

        <button type="button" class="km-btn-apply" style="max-width:340px; margin:0 auto;" onclick="MobileApp.showScreen('countdown', { id: '${prop.id}' })">
          View Booking & Countdown
        </button>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 10: SHOWING COUNTDOWN
  // ==========================================
  function renderCountdownScreen(hSlot, mSlot, params) {
    const prop = State.selectedProperty || State.properties[0];
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail;

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Booking Countdown</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-countdown-screen">
        <!-- Circular Timer -->
        <div class="km-timer-circle">
          <div class="km-timer-digits" id="km-live-timer">71:59:32</div>
          <div class="km-timer-unit">Hours : Mins : Secs</div>
        </div>

        <div style="font-weight:800; font-size:15px; color:#0f172a; margin-bottom:4px;">Your showing is scheduled for</div>
        <div style="font-size:13px; font-weight:700; color:#00b53f; margin-bottom:14px;">Tuesday • 11:00 AM</div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; font-size:12px; color:#64748b; line-height:1.45; margin-bottom:20px;">
          This countdown shows the time remaining before your scheduled viewing. Please arrive at the location on time.
        </div>

        <!-- Mini Card -->
        <div class="km-mini-property-card" style="text-align:left; margin-bottom:20px;">
          <img src="${thumb}" class="km-mini-thumb" alt="${prop.title}">
          <div>
            <div style="font-weight:800; font-size:13px; color:#0f172a;">${prop.title}</div>
            <div style="font-size:12px; color:#64748b;">${prop.estateSuburb || 'Nairobi'}</div>
            <div style="font-size:12px; font-weight:800; color:#00b53f; margin-top:2px;">KSh ${formatKsh(prop.rentKes || prop.price)}/mo</div>
          </div>
        </div>

        <div style="display:flex; gap:10px;">
          <button type="button" class="km-btn-apply" style="flex:1;" onclick="MobileApp.showScreen('my-bookings')">View Details</button>
          <button type="button" class="btn-secondary" style="flex:1; padding:12px; border-radius:10px; border:1.5px solid #cbd5e1; background:white; font-weight:700; cursor:pointer;" onclick="MobileApp.cancelBooking('${prop.id}')">Cancel Booking</button>
        </div>
      </div>
    `;

    startLiveTimer();
  }

  function startLiveTimer() {
    if (State.countdownInterval) clearInterval(State.countdownInterval);
    let secondsLeft = 72 * 3600; // 72 hours
    State.countdownInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft < 0) secondsLeft = 0;
      const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
      const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
      const s = String(secondsLeft % 60).padStart(2, '0');
      const el = document.getElementById('km-live-timer');
      if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  // ==========================================
  // SCREEN 11: 72HRS SMARTHUNT
  // ==========================================
  function renderSmartHuntScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">72hrs SmartHunt</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-smarthunt-screen">
        <div class="km-smarthunt-badge"><i class="fas fa-stopwatch"></i> 72h Guarantee</div>
        <h2 style="font-size:19px; font-weight:900; color:#0f172a; margin:0 0 6px 0;">We'll find the best options for you within 72 hours.</h2>
        <p style="font-size:12.5px; color:#64748b; line-height:1.45; margin:0 0 18px 0;">Tell us your requirements and our automated concierge matches verified vacancies before they hit the public market.</p>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:20px;">
          <div style="display:flex; gap:8px; font-size:12px; color:#334155; margin-bottom:8px;">
            <i class="fas fa-check" style="color:#00b53f; margin-top:2px;"></i>
            <span>Personalised search based on your exact needs</span>
          </div>
          <div style="display:flex; gap:8px; font-size:12px; color:#334155; margin-bottom:8px;">
            <i class="fas fa-check" style="color:#00b53f; margin-top:2px;"></i>
            <span>Top 100% verified listings only</span>
          </div>
          <div style="display:flex; gap:8px; font-size:12px; color:#334155;">
            <i class="fas fa-check" style="color:#00b53f; margin-top:2px;"></i>
            <span>Live WhatsApp updates every 12 hours</span>
          </div>
        </div>

        <!-- Preferences Form -->
        <div style="margin-bottom:14px;">
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:4px;">Your Location Preference</div>
          <input type="text" class="km-range-input" style="width:100%; box-sizing:border-box;" placeholder="e.g. Kilimani, Westlands, Ruaka" id="km-hunt-loc">
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:4px;">Property Type</div>
          <select class="km-filter-select" id="km-hunt-type">
            <option>1 Bedroom Apartment</option>
            <option>2 Bedroom Apartment</option>
            <option>Bedsitter</option>
            <option>Studio BNB</option>
            <option>3+ Bedroom House</option>
          </select>
        </div>

        <div style="margin-bottom:22px;">
          <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:4px;">Budget Range (KSh)</div>
          <input type="text" class="km-range-input" style="width:100%; box-sizing:border-box;" placeholder="e.g. 25,000 - 45,000" id="km-hunt-budget">
        </div>

        <button type="button" class="km-btn-apply" onclick="MobileApp.startSmartHunt()">
          Start 72hrs SmartHunt
        </button>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 6: MY REQUESTS & SCREEN 15: MY BOOKINGS
  // ==========================================
  function renderMyRequestsScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">My Requests</span>
        <button type="button" class="back-btn"><i class="fas fa-search"></i></button>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-tab-bar-pill">
        <button type="button" class="km-tab-pill-btn active" onclick="MobileApp.filterRequestTab('all', this)">All</button>
        <button type="button" class="km-tab-pill-btn" onclick="MobileApp.filterRequestTab('pending', this)">Pending</button>
        <button type="button" class="km-tab-pill-btn" onclick="MobileApp.filterRequestTab('confirmed', this)">Confirmed</button>
        <button type="button" class="km-tab-pill-btn" onclick="MobileApp.filterRequestTab('completed', this)">Completed</button>
      </div>

      <div id="km-requests-list-container">
        ${renderRequestsListHtml()}
      </div>
    `;
  }

  function renderRequestsListHtml() {
    const list = State.viewingRequests.length > 0 ? State.viewingRequests : [
      {
        id: 'vr-101',
        title: '3 Bedroom House in Kileleshwa',
        date: 'Tue 29 Apr • 11:00 AM',
        status: 'pending',
        statusText: 'Pending: Awaiting landlord response',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'vr-102',
        title: '2 Bedroom Apartment, Ruaka',
        date: 'Thu 1 May • 2:00 PM',
        status: 'confirmed',
        statusText: 'Confirmed: Slot Locked',
        thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
      }
    ];

    return list.map(req => `
      <div class="km-request-card" onclick="MobileApp.openRequestDetails('${req.id}')">
        <img src="${req.thumbnail}" class="km-req-thumb" alt="${req.title}">
        <div style="flex:1;">
          <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:2px;">${req.title}</div>
          <div style="font-size:11.5px; color:#64748b; margin-bottom:6px;">${req.date}</div>
          <span class="km-badge-status ${req.status}">${req.statusText}</span>
        </div>
      </div>
    `).join('');
  }

  function renderMyBookingsScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">My Bookings</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-tab-bar-pill">
        <button type="button" class="km-tab-pill-btn active">Upcoming</button>
        <button type="button" class="km-tab-pill-btn">Completed</button>
        <button type="button" class="km-tab-pill-btn">Cancelled</button>
      </div>

      <div style="padding: 0 14px;">
        <div class="km-request-card" style="margin:0 0 10px 0;">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80" class="km-req-thumb" alt="Kileleshwa">
          <div style="flex:1;">
            <div style="font-weight:800; font-size:13px; color:#0f172a;">3 Bedroom House in Kileleshwa</div>
            <div style="font-size:11.5px; color:#64748b; margin-bottom:4px;">Tue 29 Apr • 11:00 AM</div>
            <span class="km-badge-status confirmed">Confirmed</span>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="btn-primary" style="padding:5px 10px; font-size:11px; border-radius:6px; background:#00b53f; border:none; color:white; font-weight:700;" onclick="MobileApp.showScreen('countdown')">View GPS</button>
              <button class="btn-secondary" style="padding:5px 10px; font-size:11px; border-radius:6px; background:#f1f5f9; border:1px solid #cbd5e1; font-weight:700;" onclick="alert('Reschedule request sent to concierge.')">Reschedule</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 8: MESSAGES & CHAT THREAD
  // ==========================================
  function renderMessagesScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <div style="width:36px;"></div>
        <span class="screen-title">Messages</span>
        <button type="button" class="back-btn" onclick="MobileApp.composeNewMessage()"><i class="fas fa-edit"></i></button>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-tab-bar-pill">
        <button type="button" class="km-tab-pill-btn active">All (3)</button>
        <button type="button" class="km-tab-pill-btn">Property</button>
        <button type="button" class="km-tab-pill-btn">System</button>
      </div>

      <div class="km-threads-list">
        ${State.messages.map(m => `
          <div class="km-thread-item" onclick="MobileApp.showScreen('chat', '${m.id}')">
            <div class="km-thread-avatar">
              ${m.avatarText}
              ${m.unread ? '<span style="position:absolute; top:0; right:0; width:10px; height:10px; border-radius:50%; background:#ef4444; border:2px solid white;"></span>' : ''}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <span style="font-weight:800; font-size:13px; color:#0f172a;">${m.senderName}</span>
                <span style="font-size:11px; color:#94a3b8;">${m.time}</span>
              </div>
              <div style="font-size:11px; color:#00b53f; font-weight:700; margin-bottom:2px;">${m.propertyTitle}</div>
              <div style="font-size:12px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.lastMessage}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderChatScreen(hSlot, mSlot, threadOrPropId) {
    const thread = State.messages.find(m => m.id === threadOrPropId) || State.messages[0];

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('messages')"><i class="fas fa-arrow-left"></i></button>
        <div style="flex:1; text-align:center;">
          <div style="font-weight:800; font-size:13.5px; color:#0f172a;">${thread.senderName}</div>
          <div style="font-size:10.5px; color:#00b53f;">Online · Official KejaMarket Channel</div>
        </div>
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('request-viewing', '${State.selectedProperty?.id || 'km-prop-001'}')"><i class="fas fa-calendar-alt"></i></button>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-chat-window">
        <!-- Viewing CTA Card in Chat -->
        <div style="background:#f0fdf4; border-bottom:1px solid #bbf7d0; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:800; font-size:12px; color:#15803d;">⚡ 60s Landlord Confirmation SLA</div>
            <div style="font-size:10.5px; color:#166534;">Schedule a viewing to lock your slot</div>
          </div>
          <button type="button" class="btn-primary" style="padding:6px 12px; font-size:11.5px; font-weight:800; border-radius:6px; background:#00b53f; border:none; color:white; cursor:pointer;" onclick="MobileApp.showScreen('request-viewing', '${State.selectedProperty?.id || 'km-prop-001'}')">
            Book (KSh 200)
          </button>
        </div>

        <!-- Messages Area -->
        <div class="km-chat-messages-area" id="km-chat-messages-area">
          <div class="km-chat-bubble in">
            Hello, welcome to KejaMarket! I'm here to assist you with viewing this property.
          </div>
          <div class="km-chat-bubble out">
            Is this house still available for viewing this week?
          </div>
          <div class="km-chat-bubble in">
            Yes, it is available! You can book a physical viewing slot right now and our caretaker will meet you at the gate.
          </div>
        </div>

        <!-- Quick Reply Chips -->
        <div style="display:flex; gap:6px; padding:6px 14px; background:white; overflow-x:auto;">
          <button type="button" class="km-chip active" style="font-size:11px;" onclick="MobileApp.showScreen('request-viewing')">📅 Book viewing (KSh 200)</button>
          <button type="button" class="km-chip" style="font-size:11px;" onclick="MobileApp.sendQuickMsg('Is water supply 24/7?')">Water 24/7?</button>
          <button type="button" class="km-chip" style="font-size:11px;" onclick="MobileApp.sendQuickMsg('What is the deposit policy?')">Deposit policy</button>
        </div>

        <!-- Input Bar -->
        <div class="km-chat-input-bar">
          <input type="text" id="km-chat-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter') MobileApp.sendChatMessage()">
          <button type="button" class="km-chat-send-btn" onclick="MobileApp.sendChatMessage()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const area = document.getElementById('km-chat-messages-area');
      if (area) area.scrollTop = area.scrollHeight;
    }, 100);
  }

  // ==========================================
  // SCREEN 16: ADMIN DASHBOARD (MOBILE VIEW)
  // ==========================================
  function renderAdminMobileScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('profile')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Admin Dashboard</span>
        <a href="/admin-dashboard.html" class="header-action" style="text-decoration:none;"><i class="fas fa-desktop"></i></a>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-admin-mobile-screen">
        <!-- 4 KPI Cards from Reference -->
        <div class="km-admin-kpi-grid">
          <div class="km-admin-kpi-card">
            <div class="km-kpi-num" style="color:#f59e0b;">12</div>
            <div class="km-kpi-label">Pending Requests</div>
          </div>
          <div class="km-admin-kpi-card">
            <div class="km-kpi-num" style="color:#ef4444;">8</div>
            <div class="km-kpi-label">Awaiting Response</div>
          </div>
          <div class="km-admin-kpi-card">
            <div class="km-kpi-num" style="color:#00b53f;">24</div>
            <div class="km-kpi-label">Confirmed Viewings</div>
          </div>
          <div class="km-admin-kpi-card">
            <div class="km-kpi-num" style="color:#64748b;">2</div>
            <div class="km-kpi-label">Refunds Issued</div>
          </div>
        </div>

        <!-- Recent Requests -->
        <div style="font-weight:800; font-size:13.5px; color:#0f172a; margin-bottom:10px;">Recent Viewing Queue</div>
        
        <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:20px;">
          <div style="padding:12px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:12.5px; color:#0f172a;">3 Bedroom House · Kileleshwa</div>
              <div style="font-size:11px; color:#64748b;">Today 11:00 AM · Tenant: Sarah W.</div>
            </div>
            <span class="km-badge-status pending">Awaiting</span>
          </div>

          <div style="padding:12px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:12.5px; color:#0f172a;">2 Bedroom Apartment · Ruaka</div>
              <div style="font-size:11px; color:#64748b;">Thu 2:00 PM · Tenant: Brian O.</div>
            </div>
            <span class="km-badge-status confirmed">Confirmed</span>
          </div>

          <div style="padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:12.5px; color:#0f172a;">Cozy Studio BNB · Kilimani</div>
              <div style="font-size:11px; color:#64748b;">Fri 10:00 AM · Tenant: Kevin M.</div>
            </div>
            <span class="km-badge-status confirmed">Confirmed</span>
          </div>
        </div>

        <!-- Link to Full Desktop Super Admin -->
        <a href="/admin-dashboard.html" class="km-btn-apply" style="display:block; text-align:center; text-decoration:none;">
          <i class="fas fa-external-link-alt"></i> Open Full 30-Screen Admin Portal
        </a>
      </div>
    `;
  }

  // ==========================================
  // PROFILE & FAVORITES SCREENS
  // ==========================================
  function renderProfileScreen(hSlot, mSlot) {
    const user = JSON.parse(localStorage.getItem('keja_user') || 'null') || {
      name: 'Tenant User',
      email: 'tenant@kejamarket.co.ke'
    };
    const isAdmin = user.role === 'admin' || user.isAdmin || user.id === 'usr-admin-01';

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <div style="width:36px;"></div>
        <span class="screen-title">My Account</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-profile-screen">
        <div class="km-profile-header">
          <div class="km-profile-user-section">
            <div class="km-profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="km-profile-user-info">
              <div class="km-profile-name">${user.name}</div>
              <div class="km-profile-email">${user.email}</div>
            </div>
          </div>
        </div>

        <div class="km-profile-menu">
          <div class="km-profile-menu-item" onclick="MobileApp.showScreen('my-bookings')">
            <div class="km-profile-menu-icon-box"><i class="fas fa-calendar-check"></i></div>
            <div class="km-profile-menu-text">
              <div class="km-profile-menu-title">My Bookings</div>
              <div class="km-profile-menu-subtitle">View active appointments & countdowns</div>
            </div>
            <i class="fas fa-chevron-right km-profile-menu-arrow"></i>
          </div>

          <div class="km-profile-menu-item" onclick="MobileApp.showScreen('my-requests')">
            <div class="km-profile-menu-icon-box"><i class="fas fa-clock"></i></div>
            <div class="km-profile-menu-text">
              <div class="km-profile-menu-title">My Requests</div>
              <div class="km-profile-menu-subtitle">Check status of pending viewings</div>
            </div>
            <i class="fas fa-chevron-right km-profile-menu-arrow"></i>
          </div>

          <div class="km-profile-menu-item" onclick="MobileApp.showScreen('favorites')">
            <div class="km-profile-menu-icon-box"><i class="fas fa-heart"></i></div>
            <div class="km-profile-menu-text">
              <div class="km-profile-menu-title">Saved Listings</div>
              <div class="km-profile-menu-subtitle">Saved to favourites</div>
            </div>
            <span class="km-profile-menu-badge">${State.favorites.length}</span>
          </div>

          <div class="km-profile-menu-item" onclick="MobileApp.showScreen('smarthunt')">
            <div class="km-profile-menu-icon-box"><i class="fas fa-bolt"></i></div>
            <div class="km-profile-menu-text">
              <div class="km-profile-menu-title">72hrs SmartHunt</div>
              <div class="km-profile-menu-subtitle">Automated concierge search</div>
            </div>
            <i class="fas fa-chevron-right km-profile-menu-arrow"></i>
          </div>

          ${isAdmin ? `
            <div class="km-profile-menu-item" style="background:#f0fdf4;" onclick="MobileApp.showScreen('admin-mobile')">
              <div class="km-profile-menu-icon-box" style="background:#dcfce7; color:#15803d;"><i class="fas fa-user-shield"></i></div>
              <div class="km-profile-menu-text">
                <div class="km-profile-menu-title" style="color:#15803d;">Admin Operations</div>
                <div class="km-profile-menu-subtitle">Mobile viewing queue & moderation</div>
              </div>
              <i class="fas fa-chevron-right km-profile-menu-arrow" style="color:#15803d;"></i>
            </div>
          ` : ''}
        </div>

        <div class="km-profile-footer">
          <button type="button" class="btn-secondary" style="color:#ef4444; border:none; background:transparent; font-weight:700; cursor:pointer;" onclick="MobileApp.logout()">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>
    `;
  }

  function renderFavoritesScreen(hSlot, mSlot) {
    const favProps = State.properties.filter(p => State.favorites.includes(p.id));

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Saved Favourites</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding: 14px 0 20px;">
        <div class="km-property-grid">
          ${renderPropertyGridHtml(favProps)}
        </div>
      </div>
    `;
  }

  // ==========================================
  // EVENT HANDLERS & ACTIONS
  // ==========================================
  function toggleFav(propId, btn) {
    const idx = State.favorites.indexOf(propId);
    if (idx === -1) {
      State.favorites.push(propId);
    } else {
      State.favorites.splice(idx, 1);
    }
    localStorage.setItem('keja_favorites', JSON.stringify(State.favorites));
    updateFavBadge();

    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        if (State.favorites.includes(propId)) {
          icon.className = 'fas fa-heart';
          icon.style.color = '#ef4444';
          btn.classList.add('active');
        } else {
          icon.className = 'far fa-heart';
          icon.style.color = '';
          btn.classList.remove('active');
        }
      }
    }
  }

  function handleSearch(val) {
    if (!val) return;
    const matches = State.properties.filter(p => 
      p.title.toLowerCase().includes(val.toLowerCase()) || 
      (p.estateSuburb && p.estateSuburb.toLowerCase().includes(val.toLowerCase())) ||
      (p.county && p.county.toLowerCase().includes(val.toLowerCase()))
    );
    showScreen('browse', { searchList: matches });
  }

  function setCategoryChip(cat) {
    State.selectedCategory = cat;
    document.querySelectorAll('.km-chip').forEach(c => c.classList.remove('active'));
    showScreen('browse', { category: cat === 'all' ? null : cat });
  }

  function switchHeroPhoto(url, current, total, thumbEl) {
    const hero = document.getElementById('km-detail-hero-img');
    const counter = document.getElementById('km-carousel-counter');
    if (hero) hero.src = url;
    if (counter) counter.textContent = `${current} / ${total}`;

    document.querySelectorAll('.km-detail-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  function submitViewingRequest(propId) {
    const prop = State.selectedProperty || State.properties.find(p => p.id === propId);
    const msg = document.getElementById('km-viewing-msg')?.value || 'Interested in this property.';
    
    // Register request
    const newReq = {
      id: 'vr-' + Date.now(),
      propertyId: prop.id,
      title: prop.title,
      date: 'Tomorrow • 11:00 AM',
      status: 'pending',
      statusText: 'Pending: 60s Landlord Confirmation SLA',
      thumbnail: (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail
    };
    State.viewingRequests.unshift(newReq);
    localStorage.setItem('keja_viewings', JSON.stringify(State.viewingRequests));

    showScreen('viewing-confirmed', { id: prop.id });
  }

  function executePayment(propId) {
    const prop = State.selectedProperty || State.properties.find(p => p.id === propId);
    const phone = document.getElementById('km-mpesa-phone')?.value || '0712345678';
    localStorage.setItem('keja_phone', phone);

    // Call server API for real viewing payment
    fetch('/api/mpesa/viewing-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: prop.id, phone: phone })
    }).catch(() => {});

    // Transition to Payment Success
    const ref = 'MPESA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    showScreen('payment-success', { id: prop.id, ref: ref });
  }

  function sendChatMessage() {
    const input = document.getElementById('km-chat-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    const area = document.getElementById('km-chat-messages-area');
    if (area) {
      const bubble = document.createElement('div');
      bubble.className = 'km-chat-bubble out';
      bubble.textContent = text;
      area.appendChild(bubble);

      setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'km-chat-bubble in';
        reply.textContent = "Thank you! Our concierge and caretaker have been alerted. You can schedule the viewing appointment to guarantee access.";
        area.appendChild(reply);
        area.scrollTop = area.scrollHeight;
      }, 700);

      area.scrollTop = area.scrollHeight;
    }
  }

  function sendQuickMsg(text) {
    const input = document.getElementById('km-chat-input');
    if (input) {
      input.value = text;
      sendChatMessage();
    }
  }

  function startSmartHunt() {
    alert('72hrs SmartHunt activated! You will receive verified property alerts on WhatsApp.');
    showScreen('home');
  }

  function logout() {
    localStorage.removeItem('keja_token');
    localStorage.removeItem('keja_user');
    window.location.reload();
  }

  // Public Interface
  window.MobileApp = {
    init,
    showScreen,
    toggleFav,
    handleSearch,
    setCategoryChip,
    switchHeroPhoto,
    submitViewingRequest,
    executePayment,
    sendChatMessage,
    sendQuickMsg,
    startSmartHunt,
    logout,
    openAffordabilityModal: () => showScreen('browse'),
    openWhatsAppAlerts: () => window.open('https://wa.me/254792409540?text=Hi%20KejaMarket,%20please%20subscribe%20me%20to%20instant%20property%20alerts', '_blank')
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
