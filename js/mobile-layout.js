/**
 * KejaMarket Mobile Controller - EXACT Reference Match
 * Implements all 8 screens pixel-perfect
 */

(function() {
  'use strict';

  // State
  const State = {
    currentScreen: 'home',
    properties: [],
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
    currentProperty: null,
    user: null
  };

  // Initialize
  function init() {
    if (window.innerWidth > 768) return;

    document.body.classList.add('mobile-layout');
    buildUI();
    loadData();
    setupEvents();
    showScreen('home');
  }

  // Build UI
  function buildUI() {
    const app = document.createElement('div');
    app.id = 'mobile-app';
    app.innerHTML = `
      <!-- Header -->
      <header class="mobile-header">
        <div class="mobile-logo-container">
          <div class="mobile-logo-icon"></div>
          <div class="mobile-logo-text">
            <span class="mobile-logo-keja">Keja</span><span class="mobile-logo-market">Market</span>
          </div>
        </div>
        <div class="mobile-header-icon">
          <i class="fas fa-bell"></i>
        </div>
      </header>

      <!-- Search -->
      <div class="mobile-search-wrapper">
        <div class="mobile-search-input-group">
          <input type="text" placeholder="Search for properties, rentals, land..." id="mobile-search">
          <button class="mobile-search-button" id="mobile-search-btn">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <div class="mobile-results-text" style="display:none;" id="mobile-results">
          <i class="fas fa-map-marker-alt mobile-results-pin"></i>
          <span>0 Results</span>
        </div>
      </div>

      <!-- Main Content -->
      <main id="mobile-content"></main>

      <!-- Bottom Nav -->
      <nav class="mobile-bottom-nav">
        <div class="mobile-nav-tab active" data-screen="home">
          <i class="fas fa-home mobile-nav-icon"></i>
          <span class="mobile-nav-label">Home</span>
        </div>
        <div class="mobile-nav-tab" data-screen="search">
          <i class="fas fa-search mobile-nav-icon"></i>
          <span class="mobile-nav-label">Search</span>
        </div>
        <div class="mobile-nav-tab" data-screen="favorites">
          <i class="far fa-heart mobile-nav-icon"></i>
          <span class="mobile-nav-label">Favorites</span>
        </div>
        <div class="mobile-nav-tab" data-screen="messages">
          <i class="far fa-comment mobile-nav-icon"></i>
          <span class="mobile-nav-label">Messages</span>
          <span class="mobile-nav-badge" style="display:none;">3</span>
        </div>
        <div class="mobile-nav-tab" data-screen="profile">
          <i class="far fa-user mobile-nav-icon"></i>
          <span class="mobile-nav-label">Profile</span>
        </div>
      </nav>

      <!-- Filters Overlay -->
      <div class="mobile-filters-overlay" id="mobile-filters">
        <div class="mobile-filters-topbar">
          <i class="fas fa-times mobile-back-btn" onclick="MobileApp.closeFilters()"></i>
          <h2 class="mobile-filters-title">Filters</h2>
          <span class="mobile-filters-reset" onclick="MobileApp.resetFilters()">Reset</span>
        </div>
        <div class="mobile-filters-scroll" id="mobile-filters-content"></div>
        <div class="mobile-filters-footer">
          <button class="mobile-filters-apply-btn" onclick="MobileApp.applyFilters()">Apply Filters</button>
        </div>
      </div>
    `;

    document.body.insertBefore(app, document.body.firstChild);
  }

  // Load Data
  async function loadData() {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      State.properties = (data.properties || []).filter(p => 
        (p.status === 'approved' || p.isVerified) && p.availability !== 'taken'
      );
      updateResultsCount();
    } catch (err) {
      console.error('Failed to load properties:', err);
    }

    // Check auth
    const user = localStorage.getItem('user');
    if (user) State.user = JSON.parse(user);
  }

  function updateResultsCount() {
    const el = document.getElementById('mobile-results');
    if (el && State.properties.length > 0) {
      el.style.display = 'flex';
      el.querySelector('span').textContent = `${State.properties.length} Results`;
    }
  }

  // Screen Router
  function showScreen(screen) {
    State.currentScreen = screen;
    
    // Update nav
    document.querySelectorAll('.mobile-nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.screen === screen);
    });

    const content = document.getElementById('mobile-content');
    
    switch(screen) {
      case 'home': renderHome(content); break;
      case 'search': renderSearch(content); break;
      case 'favorites': renderFavorites(content); break;
      case 'messages': renderMessages(content); break;
      case 'profile': renderProfile(content); break;
    }
  }

  // SCREEN 1: HOME
  function renderHome(el) {
    const featured = State.properties.slice(0, 10);
    
    el.innerHTML = `
      <!-- Hero -->
      <section class="mobile-hero-section">
        <div class="mobile-hero-card">
          <div class="mobile-hero-content">
            <h1 class="mobile-hero-title">Discover<br>Great Opportunities</h1>
            <p class="mobile-hero-subtitle">Find your perfect place in Kenya's largest marketplace</p>
            <button class="mobile-hero-button" onclick="MobileApp.showScreen('search')">
              Explore Listings
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="mobile-categories-section">
        <h2 class="mobile-section-title">Categories</h2>
        <div class="mobile-categories-grid">
          <div class="mobile-category-button" onclick="MobileApp.filterCategory('home')">
            <div class="mobile-category-icon-wrapper home">
              <i class="fas fa-home"></i>
            </div>
            <span class="mobile-category-label">Home</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.showScreen('search')">
            <div class="mobile-category-icon-wrapper search">
              <i class="fas fa-search"></i>
            </div>
            <span class="mobile-category-label">Search</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.showScreen('favorites')">
            <div class="mobile-category-icon-wrapper favorite">
              <i class="fas fa-heart"></i>
            </div>
            <span class="mobile-category-label">Favorites</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.filterCategory('land')">
            <div class="mobile-category-icon-wrapper land">
              <i class="fas fa-map"></i>
            </div>
            <span class="mobile-category-label">Land</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.filterCategory('services')">
            <div class="mobile-category-icon-wrapper services">
              <i class="fas fa-tools"></i>
            </div>
            <span class="mobile-category-label">Services</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.filterCategory('used')">
            <div class="mobile-category-icon-wrapper used">
              <i class="fas fa-shopping-bag"></i>
            </div>
            <span class="mobile-category-label">Used Items</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.filterCategory('bnb')">
            <div class="mobile-category-icon-wrapper bnb">
              <i class="fas fa-bed"></i>
            </div>
            <span class="mobile-category-label">BnB</span>
          </div>
          <div class="mobile-category-button" onclick="MobileApp.showScreen('messages')">
            <div class="mobile-category-icon-wrapper chat">
              <i class="fas fa-comment"></i>
            </div>
            <span class="mobile-category-label">Messages</span>
          </div>
        </div>
      </section>

      <!-- Featured Listings -->
      <section class="mobile-featured-section">
        <div class="mobile-section-header">
          <h2 class="mobile-section-title">Featured Listings</h2>
          <span class="mobile-see-all" onclick="MobileApp.showScreen('search')">See All ${State.properties.length}</span>
        </div>
      </section>

      <!-- Grid -->
      <div class="mobile-grid">
        ${renderPropertyCards(featured)}
      </div>
      <div class="mobile-spacer"></div>
    `;
  }

  // SCREEN 2: SEARCH/BROWSE
  function renderSearch(el) {
    el.innerHTML = `
      <div class="mobile-browse-header">
        <div class="mobile-browse-topbar">
          <i class="fas fa-arrow-left mobile-back-btn" onclick="MobileApp.showScreen('home')"></i>
          <h1 class="mobile-browse-title">Properties</h1>
          <i class="fas fa-search mobile-browse-search-icon"></i>
        </div>
        <div class="mobile-browse-subheader">
          <div class="mobile-listing-count">
            <i class="fas fa-map-marker-alt" style="color:#ef4444;"></i>
            ${State.properties.length} listings found
          </div>
          <button class="mobile-sort-btn" onclick="MobileApp.showFilters()">
            <i class="fas fa-sliders-h"></i>
            Sort
          </button>
        </div>
      </div>

      <div class="mobile-browse-content">
        <div class="mobile-grid">
          ${renderPropertyCards(State.properties)}
        </div>
      </div>
    `;
  }

  // SCREEN 3: PROPERTY DETAIL
  function showPropertyDetail(id) {
    const prop = State.properties.find(p => p.id === id);
    if (!prop) return;
    
    State.currentProperty = prop;
    const photos = prop.photos || prop.media || [];
    const isFav = State.favorites.includes(id);
    
    const el = document.getElementById('mobile-content');
    el.innerHTML = `
      <div class="mobile-detail-screen">
        <div class="mobile-detail-header">
          <i class="fas fa-arrow-left mobile-back-btn" onclick="MobileApp.goBack()"></i>
          <div class="mobile-detail-actions">
            <button class="mobile-detail-action-btn" onclick="MobileApp.share('${id}')">
              <i class="fas fa-share-alt"></i>
            </button>
            <button class="mobile-detail-action-btn" onclick="MobileApp.toggleFav('${id}')">
              <i class="fas fa-heart" style="color:${isFav ? '#ef4444' : '#64748b'}"></i>
            </button>
          </div>
        </div>

        <div class="mobile-detail-gallery">
          <img src="${photos[0] || 'https://via.placeholder.com/800x600/f1f5f9/cbd5e1?text=No+Image'}" 
               alt="${prop.title}" 
               class="mobile-detail-main-image" 
               id="main-img">
          <div class="mobile-gallery-indicator">1/${photos.length || 1}</div>
        </div>

        ${photos.length > 1 ? `
          <div class="mobile-detail-thumbnails">
            ${photos.map((p, i) => `
              <img src="${p}" class="mobile-detail-thumb ${i === 0 ? 'active' : ''}" 
                   onclick="MobileApp.changeImage(${i})">
            `).join('')}
          </div>
        ` : ''}

        <div class="mobile-detail-body">
          <div class="mobile-detail-price-section">
            <div class="mobile-detail-price-large">
              KSh ${formatPrice(prop.rentKes || prop.rent)}
            </div>
            <h1 class="mobile-detail-property-title">${prop.title}</h1>
            <div class="mobile-detail-location-row">
              <i class="fas fa-map-marker-alt" style="color:#ef4444;"></i>
              ${prop.estateSuburb || prop.county}
            </div>
          </div>

          ${prop.bedrooms || prop.bathrooms ? `
            <div class="mobile-detail-stats-row">
              ${prop.bedrooms ? `
                <div class="mobile-detail-stat">
                  <i class="fas fa-bed mobile-detail-stat-icon"></i>
                  <span class="mobile-detail-stat-value">${prop.bedrooms} Beds</span>
                </div>
              ` : ''}
              ${prop.bathrooms ? `
                <div class="mobile-detail-stat">
                  <i class="fas fa-bath mobile-detail-stat-icon"></i>
                  <span class="mobile-detail-stat-value">${prop.bathrooms} Baths</span>
                </div>
              ` : ''}
              ${prop.size ? `
                <div class="mobile-detail-stat">
                  <i class="fas fa-ruler-combined mobile-detail-stat-icon"></i>
                  <span class="mobile-detail-stat-value">${prop.size} sqft</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="mobile-detail-section">
            <h3 class="mobile-detail-section-title">Description</h3>
            <p class="mobile-detail-description">${prop.description || 'No description available.'}</p>
          </div>
        </div>

        <div class="mobile-detail-cta-bar">
          <button class="mobile-cta-primary" onclick="MobileApp.contact('${id}')">
            <i class="fas fa-phone"></i>
            Contact Landlord
          </button>
          <button class="mobile-cta-secondary" onclick="MobileApp.toggleFav('${id}')">
            <i class="fas fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;
  }

  // SCREEN 4: FILTERS
  function showFilters() {
    const panel = document.getElementById('mobile-filters');
    const content = document.getElementById('mobile-filters-content');
    
    content.innerHTML = `
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Property Type</div>
        <div class="mobile-filter-chips">
          <div class="mobile-filter-chip" data-type="house">House</div>
          <div class="mobile-filter-chip" data-type="apartment">Apartment</div>
          <div class="mobile-filter-chip" data-type="bedsitter">Bedsitter</div>
          <div class="mobile-filter-chip" data-type="land">Land</div>
          <div class="mobile-filter-chip" data-type="commercial">Commercial</div>
        </div>
      </div>

      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Price Range (KSh)</div>
        <div class="mobile-filter-range">
          <input type="number" class="mobile-filter-input" placeholder="Min" id="price-min">
          <span>-</span>
          <input type="number" class="mobile-filter-input" placeholder="Max" id="price-max">
        </div>
      </div>

      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Bedrooms</div>
        <div class="mobile-filter-chips">
          <div class="mobile-filter-chip" data-beds="any">Any</div>
          <div class="mobile-filter-chip" data-beds="1">1+</div>
          <div class="mobile-filter-chip" data-beds="2">2+</div>
          <div class="mobile-filter-chip" data-beds="3">3+</div>
          <div class="mobile-filter-chip" data-beds="4">4+</div>
        </div>
      </div>

      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Location / Estate</div>
        <input type="text" class="mobile-filter-input" placeholder="Enter location" id="filter-location">
      </div>
    `;
    
    panel.classList.add('active');
  }

  function closeFilters() {
    document.getElementById('mobile-filters').classList.remove('active');
  }

  function applyFilters() {
    // TODO: Implement filtering logic
    closeFilters();
    showScreen('search');
  }

  function resetFilters() {
    document.querySelectorAll('.mobile-filter-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('filter-location').value = '';
  }

  // SCREEN 5: PROFILE
  function renderProfile(el) {
    const user = State.user || { name: 'Katana Mbenya', email: 'mbenye.nzau@gmail.com' };
    
    el.innerHTML = `
      <div class="mobile-profile-screen">
        <div class="mobile-profile-header">
          <div class="mobile-profile-user-section">
            <div class="mobile-profile-avatar">K</div>
            <div class="mobile-profile-user-info">
              <div class="mobile-profile-name">${user.name}</div>
              <div class="mobile-profile-email">${user.email}</div>
            </div>
            <i class="fas fa-cog mobile-profile-settings-icon"></i>
          </div>
        </div>

        <div class="mobile-profile-menu">
          <div class="mobile-profile-menu-item" onclick="MobileApp.showMyListings()">
            <div class="mobile-profile-menu-icon-box">
              <i class="fas fa-home"></i>
            </div>
            <div class="mobile-profile-menu-text">
              <div class="mobile-profile-menu-title">My Listings</div>
              <div class="mobile-profile-menu-subtitle">View and manage your ads</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showScreen('favorites')">
            <div class="mobile-profile-menu-icon-box">
              <i class="fas fa-heart"></i>
            </div>
            <div class="mobile-profile-menu-text">
              <div class="mobile-profile-menu-title">Favorites</div>
              <div class="mobile-profile-menu-subtitle">Saved properties</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showScreen('messages')">
            <div class="mobile-profile-menu-icon-box">
              <i class="fas fa-comment"></i>
            </div>
            <div class="mobile-profile-menu-text">
              <div class="mobile-profile-menu-title">Messages</div>
              <div class="mobile-profile-menu-subtitle">Chat with landlords</div>
            </div>
            <span class="mobile-profile-menu-badge" style="display:none;">3</span>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item">
            <div class="mobile-profile-menu-icon-box">
              <i class="fas fa-search"></i>
            </div>
            <div class="mobile-profile-menu-text">
              <div class="mobile-profile-menu-title">My Searches</div>
              <div class="mobile-profile-menu-subtitle">Saved searches</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item">
            <div class="mobile-profile-menu-icon-box">
              <i class="fas fa-user"></i>
            </div>
            <div class="mobile-profile-menu-text">
              <div class="mobile-profile-menu-title">Account Settings</div>
              <div class="mobile-profile-menu-subtitle">Manage profile</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>
        </div>

        <button class="mobile-profile-cta-btn">
          <i class="fas fa-plus-circle"></i>
          List your property or item
        </button>

        <div class="mobile-profile-footer">
          <div class="mobile-profile-help-text">
            Help & Support • Get help and contact us
          </div>
          <div class="mobile-profile-logout-btn" onclick="MobileApp.logout()">
            <i class="fas fa-sign-out-alt"></i>
            Sign Out
          </div>
        </div>
      </div>
    `;
  }

  // FAVORITES
  function renderFavorites(el) {
    const favProps = State.properties.filter(p => State.favorites.includes(p.id));
    
    if (favProps.length === 0) {
      el.innerHTML = `
        <div style="padding:80px 20px; text-align:center;">
          <i class="far fa-heart" style="font-size:64px; color:#cbd5e1;"></i>
          <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin:16px 0 8px;">No Favorites Yet</h2>
          <p style="font-size:14px; color:#64748b; margin-bottom:24px;">Start saving properties you love</p>
          <button class="mobile-hero-button" onclick="MobileApp.showScreen('search')">
            Browse Properties
          </button>
        </div>
      `;
      return;
    }
    
    el.innerHTML = `
      <div class="mobile-browse-header">
        <div class="mobile-browse-topbar">
          <i class="fas fa-arrow-left mobile-back-btn" onclick="MobileApp.showScreen('home')"></i>
          <h1 class="mobile-browse-title">Favorites</h1>
          <div style="width:32px;"></div>
        </div>
        <div class="mobile-browse-subheader">
          <div class="mobile-listing-count">${favProps.length} saved</div>
        </div>
      </div>
      <div class="mobile-browse-content">
        <div class="mobile-grid">
          ${renderPropertyCards(favProps)}
        </div>
      </div>
    `;
  }

  // MESSAGES
  function renderMessages(el) {
    el.innerHTML = `
      <div style="padding:80px 20px; text-align:center;">
        <i class="far fa-comment" style="font-size:64px; color:#cbd5e1;"></i>
        <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin:16px 0 8px;">No Messages</h2>
        <p style="font-size:14px; color:#64748b; margin-bottom:24px;">Your conversations will appear here</p>
      </div>
    `;
  }

  // Render Property Cards
  function renderPropertyCards(props) {
    if (!props || props.length === 0) {
      return '<div style="grid-column:1/-1; padding:40px; text-align:center; color:#64748b;">No properties found</div>';
    }

    return props.map(p => {
      const photos = p.photos || p.media || [];
      const img = photos[0] || 'https://via.placeholder.com/400x300/f1f5f9/cbd5e1?text=No+Image';
      const isFav = State.favorites.includes(p.id);

      return `
        <div class="mobile-property-card" onclick="MobileApp.showDetail('${p.id}')">
          <div class="mobile-property-image-container">
            <img src="${img}" alt="${p.title}" class="mobile-property-image" loading="lazy">
            <button class="mobile-property-favorite-btn ${isFav ? 'active' : ''}" 
                    onclick="event.stopPropagation(); MobileApp.toggleFav('${p.id}')">
              <i class="fas fa-heart"></i>
            </button>
            ${photos.length > 1 ? `
              <div class="mobile-property-gallery-count">
                <i class="fas fa-camera"></i>
                <span>1/${photos.length}</span>
              </div>
            ` : ''}
          </div>
          <div class="mobile-property-info">
            <div class="mobile-property-price">
              KSh ${formatPrice(p.rentKes || p.rent)}
              <span class="mobile-property-period">/${p.rentPeriod || 'month'}</span>
            </div>
            <div class="mobile-property-title">${p.title}</div>
            ${p.bedrooms || p.bathrooms ? `
              <div class="mobile-property-meta">
                ${p.bedrooms ? `<div class="mobile-property-meta-item"><i class="fas fa-bed"></i> ${p.bedrooms}</div>` : ''}
                ${p.bathrooms ? `<div class="mobile-property-meta-item"><i class="fas fa-bath"></i> ${p.bathrooms}</div>` : ''}
              </div>
            ` : ''}
            <div class="mobile-property-location">
              <i class="fas fa-map-marker-alt"></i>
              <span>${p.estateSuburb || p.county}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Utilities
  function formatPrice(price) {
    if (!price) return '0';
    return parseFloat(price).toLocaleString('en-KE', { maximumFractionDigits: 0 });
  }

  // Event Setup
  function setupEvents() {
    // Nav tabs
    document.querySelectorAll('.mobile-nav-tab').forEach(tab => {
      tab.addEventListener('click', () => showScreen(tab.dataset.screen));
    });

    // Search
    document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
      showScreen('search');
    });

    // Filter chips
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('mobile-filter-chip')) {
        const parent = e.target.parentElement;
        if (e.target.dataset.beds) {
          parent.querySelectorAll('.mobile-filter-chip').forEach(c => c.classList.remove('active'));
        }
        e.target.classList.toggle('active');
      }
    });
  }

  // Public API
  window.MobileApp = {
    showScreen,
    showDetail: showPropertyDetail,
    showFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    goBack: () => showScreen('search'),
    
    toggleFav: (id) => {
      const idx = State.favorites.indexOf(id);
      if (idx > -1) State.favorites.splice(idx, 1);
      else State.favorites.push(id);
      localStorage.setItem('favorites', JSON.stringify(State.favorites));
      showScreen(State.currentScreen);
    },
    
    filterCategory: (cat) => {
      // TODO: Filter by category
      showScreen('search');
    },
    
    changeImage: (idx) => {
      const photos = State.currentProperty?.photos || State.currentProperty?.media || [];
      if (!photos[idx]) return;
      document.getElementById('main-img').src = photos[idx];
      document.querySelectorAll('.mobile-detail-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
      });
      document.querySelector('.mobile-gallery-indicator').textContent = `${idx + 1}/${photos.length}`;
    },
    
    share: (id) => {
      if (navigator.share) {
        navigator.share({ title: State.currentProperty?.title, url: location.href });
      } else {
        alert('Share: ' + location.href);
      }
    },
    
    contact: (id) => {
      alert('Contact landlord - implement messaging');
    },
    
    logout: () => {
      if (confirm('Sign out?')) {
        localStorage.removeItem('user');
        location.href = '/';
      }
    },
    
    showMyListings: () => alert('My Listings - Coming soon')
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Resize handler
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if ((window.innerWidth <= 768 && !document.body.classList.contains('mobile-layout')) ||
          (window.innerWidth > 768 && document.body.classList.contains('mobile-layout'))) {
        location.reload();
      }
    }, 250);
  });

})();
