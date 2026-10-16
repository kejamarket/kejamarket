/**
 * KejaMarket Mobile Layout Controller
 * Complete implementation for all 8 screens matching reference design
 */

(function() {
  'use strict';

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const MobileState = {
    currentScreen: 'home',
    properties: [],
    favorites: [],
    currentProperty: null,
    filters: {
      propertyType: [],
      priceRange: { min: 0, max: 100000000 },
      bedrooms: null,
      location: null
    },
    user: null
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  function initMobileLayout() {
    if (window.innerWidth > 768) return;

    // Add mobile class to body
    document.body.classList.add('mobile-layout');
    
    // Build mobile UI
    buildMobileUI();
    
    // Load data
    loadProperties();
    
    // Check authentication
    checkAuth();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show home screen
    showScreen('home');
  }

  // ========================================
  // UI BUILDER
  // ========================================

  function buildMobileUI() {
    const container = document.createElement('div');
    container.id = 'mobile-app-container';
    container.innerHTML = `
      <!-- Mobile Header -->
      <header class="mobile-header">
        <div class="mobile-header-logo">
          <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><circle cx='30' cy='30' r='25' fill='%2316a34a'/><text x='65' y='40' font-family='Arial' font-size='24' font-weight='bold' fill='%231e293b'>Keja</text><text x='130' y='40' font-family='Arial' font-size='24' font-weight='bold' fill='%2316a34a'>Market</text></svg>" alt="KejaMarket">
        </div>
        <div class="mobile-header-actions">
          <i class="fas fa-bell mobile-header-icon" id="mobile-notifications"></i>
        </div>
      </header>

      <!-- Search Container -->
      <div class="mobile-search-container">
        <div class="mobile-search-bar">
          <input type="text" placeholder="Search for properties, rentals, land..." id="mobile-search-input">
          <div class="mobile-search-icon" id="mobile-search-btn">
            <i class="fas fa-search"></i>
          </div>
        </div>
        <div class="mobile-results-count" id="mobile-results-count" style="display:none;">
          <i class="fas fa-map-marker-alt mobile-results-pin"></i>
          <span>0 Results</span>
        </div>
      </div>

      <!-- Main Content Area -->
      <main id="mobile-main-content"></main>

      <!-- Bottom Navigation -->
      <nav class="mobile-bottom-nav">
        <div class="mobile-nav-item active" data-screen="home">
          <i class="fas fa-home mobile-nav-icon"></i>
          <span class="mobile-nav-label">Home</span>
        </div>
        <div class="mobile-nav-item" data-screen="search">
          <i class="fas fa-search mobile-nav-icon"></i>
          <span class="mobile-nav-label">Search</span>
        </div>
        <div class="mobile-nav-item" data-screen="favorites">
          <i class="far fa-heart mobile-nav-icon"></i>
          <span class="mobile-nav-label">Favorites</span>
        </div>
        <div class="mobile-nav-item" data-screen="messages">
          <i class="far fa-comment mobile-nav-icon"></i>
          <span class="mobile-nav-label">Messages</span>
          <span class="mobile-nav-badge" style="display:none;">3</span>
        </div>
        <div class="mobile-nav-item" data-screen="profile">
          <i class="far fa-user mobile-nav-icon"></i>
          <span class="mobile-nav-label">Profile</span>
        </div>
      </nav>

      <!-- Filters Panel (Hidden by default) -->
      <div class="mobile-filters-panel" id="mobile-filters-panel">
        <div class="mobile-filters-header">
          <i class="fas fa-times mobile-back-button" id="mobile-close-filters"></i>
          <h2 class="mobile-filters-title">Filters</h2>
          <span class="mobile-filters-reset" id="mobile-reset-filters">Reset</span>
        </div>
        <div class="mobile-filters-content" id="mobile-filters-content"></div>
        <div class="mobile-filters-footer">
          <button class="mobile-filters-apply" id="mobile-apply-filters">Apply Filters</button>
        </div>
      </div>
    `;

    // Insert at beginning of body
    document.body.insertBefore(container, document.body.firstChild);
  }

  // ========================================
  // SCREEN RENDERERS
  // ========================================

  function showScreen(screenName) {
    MobileState.currentScreen = screenName;
    
    // Update bottom nav active state
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenName);
    });

    // Render appropriate screen
    const mainContent = document.getElementById('mobile-main-content');
    
    switch(screenName) {
      case 'home':
        renderHomeScreen(mainContent);
        break;
      case 'search':
        renderBrowseScreen(mainContent);
        break;
      case 'favorites':
        renderFavoritesScreen(mainContent);
        break;
      case 'messages':
        renderMessagesScreen(mainContent);
        break;
      case 'profile':
        renderProfileScreen(mainContent);
        break;
      default:
        renderHomeScreen(mainContent);
    }
  }

  // ========================================
  // SCREEN 1: HOME SCREEN
  // ========================================

  function renderHomeScreen(container) {
    const featuredProperties = MobileState.properties.filter(p => p.isFeatured).slice(0, 8);
    
    container.innerHTML = `
      <!-- Hero Banner -->
      <section class="mobile-hero-banner">
        <div class="mobile-hero-card">
          <h1 class="mobile-hero-title">Discover<br>Great Opportunities</h1>
          <p class="mobile-hero-subtitle">Find your perfect place in Kenya's largest marketplace</p>
          <button class="mobile-hero-cta" onclick="MobileApp.showScreen('search')">
            Explore Listings
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </section>

      <!-- Categories -->
      <section class="mobile-categories">
        <div class="mobile-categories-header">
          <span>Categories</span>
          <span class="mobile-categories-see-all" onclick="MobileApp.showScreen('search')">See All</span>
        </div>
        <div class="mobile-categories-grid">
          <a class="mobile-category-item" onclick="MobileApp.filterByCategory('rentals')">
            <div class="mobile-category-icon home">
              <i class="fas fa-home"></i>
            </div>
            <span class="mobile-category-label">Rentals</span>
          </a>
          <a class="mobile-category-item" onclick="MobileApp.filterByCategory('land')">
            <div class="mobile-category-icon land">
              <i class="fas fa-map"></i>
            </div>
            <span class="mobile-category-label">Land</span>
          </a>
          <a class="mobile-category-item" onclick="MobileApp.filterByCategory('services')">
            <div class="mobile-category-icon services">
              <i class="fas fa-tools"></i>
            </div>
            <span class="mobile-category-label">Services</span>
          </a>
          <a class="mobile-category-item" onclick="MobileApp.filterByCategory('used-items')">
            <div class="mobile-category-icon used-items">
              <i class="fas fa-shopping-bag"></i>
            </div>
            <span class="mobile-category-label">Used Items</span>
          </a>
        </div>
      </section>

      <!-- Featured Listings -->
      <section class="mobile-section">
        <div class="mobile-section-header">
          <h2 class="mobile-section-title">Featured Listings</h2>
          <span class="mobile-section-see-all" onclick="MobileApp.showScreen('search')">See All ${MobileState.properties.length}</span>
        </div>
      </section>

      <!-- Property Grid -->
      <div class="mobile-properties-grid">
        ${renderPropertyCards(featuredProperties.length > 0 ? featuredProperties : MobileState.properties.slice(0, 10))}
      </div>

      <div class="mobile-spacer"></div>
    `;
  }

  // ========================================
  // SCREEN 2: BROWSE / SEARCH RESULTS
  // ========================================

  function renderBrowseScreen(container) {
    const filteredProperties = MobileState.properties;
    
    container.innerHTML = `
      <div class="mobile-browse-content">
        <!-- Results Header -->
        <div style="padding: 0 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #1e293b;">Properties</h2>
            <button class="mobile-sort-button" onclick="MobileApp.showFilters()">
              <i class="fas fa-sliders-h"></i>
              <span>Filters</span>
            </button>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i>
            ${filteredProperties.length} results
          </p>
        </div>

        <!-- Property Grid -->
        <div class="mobile-properties-grid">
          ${renderPropertyCards(filteredProperties)}
        </div>

        <div class="mobile-spacer"></div>
      </div>
    `;
  }

  // ========================================
  // SCREEN 3: PROPERTY DETAIL
  // ========================================

  function showPropertyDetail(propertyId) {
    const property = MobileState.properties.find(p => p.id === propertyId);
    if (!property) return;

    MobileState.currentProperty = property;
    const mainContent = document.getElementById('mobile-main-content');
    
    const photos = property.photos || property.media || [];
    const isFavorite = MobileState.favorites.includes(propertyId);
    
    mainContent.innerHTML = `
      <div class="mobile-property-detail">
        <!-- Detail Header -->
        <div class="mobile-detail-header">
          <i class="fas fa-arrow-left mobile-back-button" onclick="MobileApp.goBack()"></i>
          <div class="mobile-detail-actions">
            <div class="mobile-detail-action-btn" onclick="MobileApp.shareProperty('${propertyId}')">
              <i class="fas fa-share-alt"></i>
            </div>
            <div class="mobile-detail-action-btn ${isFavorite ? 'active' : ''}" onclick="MobileApp.toggleFavorite('${propertyId}')">
              <i class="fas fa-heart" style="color: ${isFavorite ? '#ef4444' : '#64748b'}"></i>
            </div>
          </div>
        </div>

        <!-- Gallery -->
        <div class="mobile-detail-gallery">
          <img src="${photos[0] || 'https://via.placeholder.com/800x600/f1f5f9/cbd5e1?text=No+Image'}" 
               alt="${property.title}" 
               class="mobile-gallery-main-image"
               id="mobile-main-image">
          <div class="mobile-gallery-counter">1/${photos.length || 1}</div>
        </div>

        ${photos.length > 1 ? `
          <div class="mobile-gallery-thumbnails">
            ${photos.map((photo, i) => `
              <img src="${photo}" 
                   alt="Photo ${i+1}" 
                   class="mobile-gallery-thumb ${i === 0 ? 'active' : ''}"
                   onclick="MobileApp.changeGalleryImage(${i})">
            `).join('')}
          </div>
        ` : ''}

        <!-- Content -->
        <div class="mobile-detail-content">
          <!-- Price Section -->
          <div class="mobile-detail-price-section">
            <div class="mobile-detail-price">
              KSh ${formatPrice(property.rentKes || property.rent)}
              ${property.rentPeriod ? `<span style="font-size: 16px; font-weight: 500; color: #64748b;">/${property.rentPeriod}</span>` : ''}
            </div>
            <h1 class="mobile-detail-title">${property.title}</h1>
            <div class="mobile-detail-location">
              <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i>
              <span>${property.exactLocation || property.estateSuburb || property.county}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="mobile-detail-stats">
            ${property.bedrooms ? `
              <div class="mobile-detail-stat">
                <i class="fas fa-bed mobile-detail-stat-icon"></i>
                <span class="mobile-detail-stat-value">${property.bedrooms}</span>
              </div>
            ` : ''}
            ${property.bathrooms ? `
              <div class="mobile-detail-stat">
                <i class="fas fa-bath mobile-detail-stat-icon"></i>
                <span class="mobile-detail-stat-value">${property.bathrooms}</span>
              </div>
            ` : ''}
            ${property.size || property.sqft ? `
              <div class="mobile-detail-stat">
                <i class="fas fa-ruler-combined mobile-detail-stat-icon"></i>
                <span class="mobile-detail-stat-value">${property.size || property.sqft} sqft</span>
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          <div class="mobile-detail-section">
            <h3 class="mobile-detail-section-title">Description</h3>
            <p class="mobile-detail-description">
              ${property.description || 'No description available for this property.'}
            </p>
          </div>

          <!-- Amenities -->
          ${property.amenities ? `
            <div class="mobile-detail-section">
              <h3 class="mobile-detail-section-title">Amenities</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${(property.amenities.split(',') || []).map(amenity => `
                  <span style="padding: 6px 12px; background: #f1f5f9; border-radius: 8px; font-size: 13px; color: #475569;">
                    ${amenity.trim()}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- CTA Bar -->
        <div class="mobile-detail-cta-bar">
          <button class="mobile-detail-cta-primary" onclick="MobileApp.contactLandlord('${propertyId}')">
            <i class="fas fa-phone"></i>
            Contact Landlord
          </button>
          <button class="mobile-detail-cta-secondary" onclick="MobileApp.saveToFavorites('${propertyId}')">
            <i class="far fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;
  }

  // ========================================
  // SCREEN 4: FILTERS
  // ========================================

  function showFilters() {
    const filtersPanel = document.getElementById('mobile-filters-panel');
    const filtersContent = document.getElementById('mobile-filters-content');
    
    filtersContent.innerHTML = `
      <!-- Property Type -->
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Property Type</div>
        <div class="mobile-filter-chips">
          <div class="mobile-filter-chip" data-filter="type" data-value="house">House</div>
          <div class="mobile-filter-chip" data-filter="type" data-value="apartment">Apartment</div>
          <div class="mobile-filter-chip" data-filter="type" data-value="bedsitter">Bedsitter</div>
          <div class="mobile-filter-chip" data-filter="type" data-value="land">Land</div>
          <div class="mobile-filter-chip" data-filter="type" data-value="commercial">Commercial</div>
        </div>
      </div>

      <!-- Price Range -->
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Price Range (KSh)</div>
        <div class="mobile-filter-range">
          <input type="number" class="mobile-filter-input" placeholder="Min" id="filter-price-min" value="${MobileState.filters.priceRange.min || ''}">
          <span>-</span>
          <input type="number" class="mobile-filter-input" placeholder="Max" id="filter-price-max" value="${MobileState.filters.priceRange.max || ''}">
        </div>
      </div>

      <!-- Bedrooms -->
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Bedrooms</div>
        <div class="mobile-filter-chips">
          <div class="mobile-filter-chip" data-filter="bedrooms" data-value="any">Any</div>
          <div class="mobile-filter-chip" data-filter="bedrooms" data-value="1">1+</div>
          <div class="mobile-filter-chip" data-filter="bedrooms" data-value="2">2+</div>
          <div class="mobile-filter-chip" data-filter="bedrooms" data-value="3">3+</div>
          <div class="mobile-filter-chip" data-filter="bedrooms" data-value="4">4+</div>
        </div>
      </div>

      <!-- Location -->
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">Location / Estate</div>
        <input type="text" class="mobile-filter-input" placeholder="Enter location, estate or keyword" id="filter-location">
      </div>

      <!-- More Filters -->
      <div class="mobile-filter-group">
        <div class="mobile-filter-label">More Filters</div>
        <div class="mobile-filter-chips">
          <div class="mobile-filter-chip" data-filter="verified" data-value="true">Verified Only</div>
          <div class="mobile-filter-chip" data-filter="featured" data-value="true">Featured</div>
        </div>
      </div>
    `;

    filtersPanel.classList.add('active');
  }

  function closeFilters() {
    document.getElementById('mobile-filters-panel').classList.remove('active');
  }

  function applyFilters() {
    // Collect filter values
    const selectedTypes = Array.from(document.querySelectorAll('.mobile-filter-chip[data-filter="type"].active'))
      .map(chip => chip.dataset.value);
    
    const selectedBedrooms = document.querySelector('.mobile-filter-chip[data-filter="bedrooms"].active')?.dataset.value;
    
    const priceMin = document.getElementById('filter-price-min')?.value || 0;
    const priceMax = document.getElementById('filter-price-max')?.value || 100000000;
    
    const location = document.getElementById('filter-location')?.value || '';

    // Update state
    MobileState.filters = {
      propertyType: selectedTypes,
      bedrooms: selectedBedrooms !== 'any' ? selectedBedrooms : null,
      priceRange: { min: priceMin, max: priceMax },
      location: location
    };

    // Apply filters and re-render
    filterProperties();
    closeFilters();
    showScreen('search');
  }

  function resetFilters() {
    MobileState.filters = {
      propertyType: [],
      priceRange: { min: 0, max: 100000000 },
      bedrooms: null,
      location: null
    };
    
    document.querySelectorAll('.mobile-filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });
    
    document.getElementById('filter-price-min').value = '';
    document.getElementById('filter-price-max').value = '';
    document.getElementById('filter-location').value = '';
  }

  // ========================================
  // SCREEN 5: PROFILE
  // ========================================

  function renderProfileScreen(container) {
    const user = MobileState.user || {
      name: 'Katana Mbenya',
      email: 'mbenye.nzau@gmail.com',
      avatar: 'K'
    };

    container.innerHTML = `
      <div class="mobile-profile-screen">
        <!-- Profile Header -->
        <div class="mobile-profile-header">
          <div class="mobile-profile-user">
            <div class="mobile-profile-avatar">${user.avatar}</div>
            <div class="mobile-profile-info">
              <div class="mobile-profile-name">${user.name}</div>
              <div class="mobile-profile-email">${user.email}</div>
            </div>
            <i class="fas fa-cog mobile-profile-settings-icon"></i>
          </div>
        </div>

        <!-- Profile Menu -->
        <div class="mobile-profile-menu">
          <div class="mobile-profile-menu-item" onclick="MobileApp.showMyListings()">
            <div class="mobile-profile-menu-icon">
              <i class="fas fa-home"></i>
            </div>
            <div class="mobile-profile-menu-content">
              <div class="mobile-profile-menu-title">My Listings</div>
              <div class="mobile-profile-menu-subtitle">View and manage your ads</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showScreen('favorites')">
            <div class="mobile-profile-menu-icon">
              <i class="fas fa-heart"></i>
            </div>
            <div class="mobile-profile-menu-content">
              <div class="mobile-profile-menu-title">Favorites</div>
              <div class="mobile-profile-menu-subtitle">Saved properties and items</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showMessages()">
            <div class="mobile-profile-menu-icon">
              <i class="fas fa-comment"></i>
            </div>
            <div class="mobile-profile-menu-content">
              <div class="mobile-profile-menu-title">Messages</div>
              <div class="mobile-profile-menu-subtitle">Chat with landlords and sellers</div>
            </div>
            <span class="mobile-profile-menu-badge" style="display:none;">3</span>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showMySearches()">
            <div class="mobile-profile-menu-icon">
              <i class="fas fa-search"></i>
            </div>
            <div class="mobile-profile-menu-content">
              <div class="mobile-profile-menu-title">My Searches</div>
              <div class="mobile-profile-menu-subtitle">Saved searches and alerts</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>

          <div class="mobile-profile-menu-item" onclick="MobileApp.showAccountSettings()">
            <div class="mobile-profile-menu-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="mobile-profile-menu-content">
              <div class="mobile-profile-menu-title">Account Settings</div>
              <div class="mobile-profile-menu-subtitle">Manage profile and preferences</div>
            </div>
            <i class="fas fa-chevron-right mobile-profile-menu-arrow"></i>
          </div>
        </div>

        <!-- Post Property CTA -->
        <button class="mobile-profile-cta" onclick="MobileApp.postProperty()">
          <i class="fas fa-plus-circle"></i>
          List your property or item
        </button>

        <!-- Footer -->
        <div class="mobile-profile-footer">
          <div class="mobile-profile-help">
            <i class="fas fa-info-circle"></i>
            Help & Support • Get help and contact us
          </div>
          <div class="mobile-profile-logout" onclick="MobileApp.logout()">
            <i class="fas fa-sign-out-alt"></i>
            Sign Out
          </div>
        </div>
      </div>
    `;
  }

  // ========================================
  // SCREEN 6, 7, 8: RENTALS, LAND, USED ITEMS
  // ========================================

  function renderFavoritesScreen(container) {
    const favoriteProperties = MobileState.properties.filter(p => 
      MobileState.favorites.includes(p.id)
    );

    if (favoriteProperties.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <div class="mobile-empty-icon">
            <i class="far fa-heart"></i>
          </div>
          <h2 class="mobile-empty-title">No Favorites Yet</h2>
          <p class="mobile-empty-text">
            Start saving properties and items you love.<br>
            Tap the heart icon on any listing.
          </p>
          <button class="mobile-empty-cta" onclick="MobileApp.showScreen('search')">
            <i class="fas fa-search"></i>
            Explore Listings
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="mobile-browse-content">
        <div style="padding: 20px 16px 16px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Favorites</h2>
          <p style="font-size: 13px; color: #64748b;">${favoriteProperties.length} saved items</p>
        </div>
        <div class="mobile-properties-grid">
          ${renderPropertyCards(favoriteProperties)}
        </div>
      </div>
    `;
  }

  function renderMessagesScreen(container) {
    container.innerHTML = `
      <div class="mobile-empty-state">
        <div class="mobile-empty-icon">
          <i class="far fa-comment"></i>
        </div>
        <h2 class="mobile-empty-title">No Messages</h2>
        <p class="mobile-empty-text">
          When you contact landlords or sellers,<br>
          your conversations will appear here.
        </p>
        <button class="mobile-empty-cta" onclick="MobileApp.showScreen('search')">
          <i class="fas fa-search"></i>
          Find Properties
        </button>
      </div>
    `;
  }

  // ========================================
  // PROPERTY CARD RENDERER
  // ========================================

  function renderPropertyCards(properties) {
    if (!properties || properties.length === 0) {
      return '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #64748b;">No properties found</div>';
    }

    return properties.map(property => {
      const photos = property.photos || property.media || [];
      const mainPhoto = photos[0] || 'https://via.placeholder.com/400x300/f1f5f9/cbd5e1?text=No+Image';
      const isFavorite = MobileState.favorites.includes(property.id);
      const categoryClass = getCategoryClass(property.category);

      return `
        <div class="mobile-property-card" onclick="MobileApp.showPropertyDetail('${property.id}')">
          <div class="mobile-property-image-wrapper">
            <img src="${mainPhoto}" alt="${property.title}" class="mobile-property-image" loading="lazy">
            <div class="mobile-property-badge ${categoryClass}">${property.category || 'Property'}</div>
            <div class="mobile-property-favorite ${isFavorite ? 'active' : ''}" 
                 onclick="event.stopPropagation(); MobileApp.toggleFavorite('${property.id}')">
              <i class="fas fa-heart"></i>
            </div>
            ${photos.length > 1 ? `
              <div class="mobile-property-gallery-indicator">
                <i class="fas fa-camera"></i>
                <span>1/${photos.length}</span>
              </div>
            ` : ''}
          </div>
          <div class="mobile-property-content">
            <div class="mobile-property-price">
              KSh ${formatPrice(property.rentKes || property.rent)}
              <span class="mobile-property-price-small">/${property.rentPeriod || 'month'}</span>
            </div>
            <div class="mobile-property-title">${property.title}</div>
            ${property.bedrooms || property.bathrooms ? `
              <div class="mobile-property-meta">
                ${property.bedrooms ? `
                  <div class="mobile-property-meta-item">
                    <i class="fas fa-bed"></i>
                    <span>${property.bedrooms}</span>
                  </div>
                ` : ''}
                ${property.bathrooms ? `
                  <div class="mobile-property-meta-item">
                    <i class="fas fa-bath"></i>
                    <span>${property.bathrooms}</span>
                  </div>
                ` : ''}
                ${property.size ? `
                  <div class="mobile-property-meta-item">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.size} sqft</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            <div class="mobile-property-location">
              <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i>
              <span>${property.estateSuburb || property.exactLocation || property.county}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================
  // UTILITIES
  // ========================================

  function formatPrice(price) {
    if (!price) return '0';
    return parseFloat(price).toLocaleString('en-KE', { maximumFractionDigits: 0 });
  }

  function getCategoryClass(category) {
    if (!category) return '';
    const cat = category.toLowerCase();
    if (cat.includes('single')) return 'single';
    if (cat.includes('double')) return 'double';
    if (cat.includes('bedsitter')) return 'bedsitter';
    if (cat.includes('studio')) return 'studio';
    if (cat.includes('1 bed')) return 'one-bed';
    if (cat.includes('2 bed')) return 'two-bed';
    if (cat.includes('3 bed')) return 'three-bed';
    if (cat.includes('4 bed')) return 'four-bed';
    if (cat.includes('apartment')) return 'apartment';
    if (cat.includes('land')) return 'land';
    if (cat.includes('bnb') || cat.includes('airbnb')) return 'bnb';
    return '';
  }

  function filterProperties() {
    let filtered = MobileState.properties;

    // Apply filters
    if (MobileState.filters.propertyType.length > 0) {
      filtered = filtered.filter(p => 
        MobileState.filters.propertyType.some(type => 
          p.category?.toLowerCase().includes(type)
        )
      );
    }

    if (MobileState.filters.bedrooms) {
      const minBeds = parseInt(MobileState.filters.bedrooms);
      filtered = filtered.filter(p => p.bedrooms >= minBeds);
    }

    if (MobileState.filters.priceRange) {
      filtered = filtered.filter(p => {
        const price = p.rentKes || p.rent || 0;
        return price >= MobileState.filters.priceRange.min && 
               price <= MobileState.filters.priceRange.max;
      });
    }

    if (MobileState.filters.location) {
      const loc = MobileState.filters.location.toLowerCase();
      filtered = filtered.filter(p => 
        p.county?.toLowerCase().includes(loc) ||
        p.estateSuburb?.toLowerCase().includes(loc) ||
        p.exactLocation?.toLowerCase().includes(loc)
      );
    }

    MobileState.properties = filtered;
  }

  // ========================================
  // DATA LOADING
  // ========================================

  async function loadProperties() {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      MobileState.properties = data.properties || [];
      
      // Update results count
      const resultsCount = document.getElementById('mobile-results-count');
      if (resultsCount && MobileState.properties.length > 0) {
        resultsCount.style.display = 'flex';
        resultsCount.querySelector('span').textContent = `${MobileState.properties.length} Results`;
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      MobileState.properties = [];
    }
  }

  function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
      MobileState.user = JSON.parse(user);
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  function setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        showScreen(item.dataset.screen);
      });
    });

    // Search
    const searchBtn = document.getElementById('mobile-search-btn');
    const searchInput = document.getElementById('mobile-search-input');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
          MobileState.filters.location = query;
          filterProperties();
          showScreen('search');
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchBtn.click();
        }
      });
    }

    // Filters
    document.getElementById('mobile-close-filters')?.addEventListener('click', closeFilters);
    document.getElementById('mobile-apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('mobile-reset-filters')?.addEventListener('click', resetFilters);

    // Filter chips toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('mobile-filter-chip')) {
        if (e.target.dataset.filter === 'bedrooms') {
          // Radio behavior for bedrooms
          document.querySelectorAll('.mobile-filter-chip[data-filter="bedrooms"]').forEach(chip => {
            chip.classList.remove('active');
          });
        }
        e.target.classList.toggle('active');
      }
    });
  }

  // ========================================
  // PUBLIC API
  // ========================================

  window.MobileApp = {
    showScreen,
    showPropertyDetail,
    showFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    
    toggleFavorite: (propertyId) => {
      const index = MobileState.favorites.indexOf(propertyId);
      if (index > -1) {
        MobileState.favorites.splice(index, 1);
      } else {
        MobileState.favorites.push(propertyId);
      }
      localStorage.setItem('favorites', JSON.stringify(MobileState.favorites));
      
      // Re-render current screen
      showScreen(MobileState.currentScreen);
    },
    
    filterByCategory: (category) => {
      MobileState.filters.propertyType = [category];
      filterProperties();
      showScreen('search');
    },
    
    goBack: () => {
      showScreen('search');
    },
    
    changeGalleryImage: (index) => {
      const mainImage = document.getElementById('mobile-main-image');
      const thumbs = document.querySelectorAll('.mobile-gallery-thumb');
      const photos = MobileState.currentProperty?.photos || MobileState.currentProperty?.media || [];
      
      if (mainImage && photos[index]) {
        mainImage.src = photos[index];
        thumbs.forEach((thumb, i) => {
          thumb.classList.toggle('active', i === index);
        });
        
        const counter = document.querySelector('.mobile-gallery-counter');
        if (counter) {
          counter.textContent = `${index + 1}/${photos.length}`;
        }
      }
    },
    
    contactLandlord: (propertyId) => {
      alert('Contact landlord functionality - integrate with your messaging system');
    },
    
    shareProperty: (propertyId) => {
      if (navigator.share) {
        navigator.share({
          title: MobileState.currentProperty?.title,
          url: window.location.href
        });
      } else {
        alert('Share this property: ' + window.location.href);
      }
    },
    
    saveToFavorites: (propertyId) => {
      window.MobileApp.toggleFavorite(propertyId);
    },
    
    postProperty: () => {
      window.location.href = '/post-property.html';
    },
    
    logout: () => {
      if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    },
    
    showMyListings: () => alert('My Listings - Coming soon'),
    showMessages: () => showScreen('messages'),
    showMySearches: () => alert('My Searches - Coming soon'),
    showAccountSettings: () => alert('Account Settings - Coming soon')
  };

  // ========================================
  // AUTO-INITIALIZE
  // ========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileLayout);
  } else {
    initMobileLayout();
  }

  // Re-init on resize (if going from desktop to mobile)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 768 && !document.body.classList.contains('mobile-layout')) {
        location.reload();
      }
    }, 250);
  });

})();
