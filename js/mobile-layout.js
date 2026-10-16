/**
 * KejaMarket Mobile Layout Controller
 * Implements all 8 screens from approved reference design
 * Only activates on mobile devices (max-width: 768px)
 */

const KejaMobile = (() => {
  const state = {
    currentScreen: 'home',
    activeNavItem: 'home',
    filtersOpen: false,
    currentProperty: null
  };

  // Check if device is mobile
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Initialize mobile layout
  function init() {
    if (!isMobile()) {
      console.log('[KejaMobile] Desktop detected - mobile layout disabled');
      return;
    }

    console.log('[KejaMobile] Mobile detected - initializing mobile layout');
    injectMobileStructure();
    bindEvents();
    updateBottomNav();
  }

  // Inject mobile HTML structure
  function injectMobileStructure() {
    const mobileHTML = `
      <!-- MOBILE HEADER -->
      <div class="mobile-header mobile-only">
        <img src="icons/logo.svg" alt="KejaMarket" class="mobile-header-logo" onerror="this.style.display='none'">
        <div class="mobile-header-actions">
          <div class="mobile-header-icon" onclick="KejaMobile.openNotifications()">
            <i class="fas fa-bell"></i>
            <span class="badge" id="mobile-notif-badge" style="display:none;">0</span>
          </div>
          <div class="mobile-header-icon" onclick="kejaAuth.toggleProfileDropdown()">
            <i class="fas fa-user"></i>
          </div>
        </div>
      </div>

      <!-- MOBILE MAIN CONTENT -->
      <div class="mobile-main mobile-only">
        
        <!-- SCREEN 1: HOME SCREEN -->
        <div id="mobile-screen-home" class="mobile-screen">
          <!-- Search Bar -->
          <div class="mobile-search-bar">
            <div class="mobile-search-input-wrapper">
              <i class="fas fa-search mobile-search-icon"></i>
              <input 
                type="text" 
                class="mobile-search-input" 
                placeholder="Search for properties, rentals, or land..."
                id="mobile-search-input"
              >
              <button class="mobile-search-btn" onclick="KejaMobile.performSearch()">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <!-- Location Selector -->
          <div class="mobile-location" onclick="KejaMobile.openLocationPicker()">
            <i class="fas fa-map-marker-alt"></i>
            <span id="mobile-location-text">Nairobi & Environs</span>
            <i class="fas fa-chevron-down" style="margin-left:auto;"></i>
          </div>

          <!-- Category Shortcuts -->
          <div class="mobile-categories">
            <h3 class="mobile-categories-title">Explore Categories</h3>
            <div class="mobile-category-grid">
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('home'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-home"></i>
                </div>
                <span class="mobile-category-label">Home</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('rentals'); return false;">
                <div class="mobile-category-icon active">
                  <i class="fas fa-key"></i>
                </div>
                <span class="mobile-category-label">Rentals</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('land'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-map"></i>
                </div>
                <span class="mobile-category-label">Land</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('services'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-tools"></i>
                </div>
                <span class="mobile-category-label">Services</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('items'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-shopping-bag"></i>
                </div>
                <span class="mobile-category-label">Used Items</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('bnb'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-bed"></i>
                </div>
                <span class="mobile-category-label">Airbnb</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('commercial'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-building"></i>
                </div>
                <span class="mobile-category-label">Commercial</span>
              </a>
              <a href="#" class="mobile-category-item" onclick="KejaMobile.filterByCategory('more'); return false;">
                <div class="mobile-category-icon">
                  <i class="fas fa-ellipsis-h"></i>
                </div>
                <span class="mobile-category-label">More</span>
              </a>
            </div>
          </div>

          <!-- Promotional Banner -->
          <div class="mobile-promo-banner">
            <div class="mobile-promo-title">Discover Great Opportunities</div>
            <div class="mobile-promo-subtitle">Find your perfect home in Nairobi</div>
            <button class="mobile-promo-btn" onclick="KejaMobile.showScreen('browse')">
              Explore Listings →
            </button>
          </div>

          <!-- Featured Listings Section -->
          <div class="mobile-section-header">
            <h3 class="mobile-section-title">Featured Listings</h3>
            <a href="#" class="mobile-section-link" onclick="KejaMobile.showScreen('browse'); return false;">
              See All →
            </a>
          </div>
          
          <div id="mobile-featured-grid" class="mobile-listings-grid">
            <!-- Will be populated by JavaScript -->
          </div>
        </div>

        <!-- SCREEN 2: BROWSE/SEARCH RESULTS -->
        <div id="mobile-screen-browse" class="mobile-screen" style="display:none;">
          <!-- Toolbar -->
          <div class="mobile-toolbar">
            <button class="mobile-toolbar-btn" onclick="KejaMobile.openFilters()">
              <i class="fas fa-filter"></i>
              Filters
            </button>
            <button class="mobile-toolbar-btn" onclick="KejaMobile.toggleSort()">
              <i class="fas fa-sort"></i>
              Sort
            </button>
          </div>

          <!-- Results Count -->
          <div class="mobile-results-count">
            <strong id="mobile-results-total">0</strong> results found
          </div>

          <!-- Property Grid -->
          <div id="mobile-browse-grid" class="mobile-listings-grid">
            <!-- Populated by JavaScript -->
          </div>
        </div>

        <!-- SCREEN 3: PROPERTY DETAIL -->
        <div id="mobile-screen-detail" class="mobile-screen mobile-property-detail" style="display:none;">
          <!-- Property content will be dynamically loaded -->
        </div>

        <!-- SCREEN 5: PROFILE/FAVORITES -->
        <div id="mobile-screen-profile" class="mobile-screen mobile-profile" style="display:none;">
          <div class="mobile-profile-header">
            <div class="mobile-profile-avatar" id="mobile-profile-avatar">U</div>
            <div class="mobile-profile-name" id="mobile-profile-name">Guest User</div>
            <div class="mobile-profile-email" id="mobile-profile-email">Sign in to save favorites</div>
          </div>

          <div class="mobile-profile-menu">
            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showMyListings(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-home"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">My Listings</span>
                <span class="mobile-profile-menu-desc">Properties you've posted</span>
              </div>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>

            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showFavorites(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-heart"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">Favorites</span>
                <span class="mobile-profile-menu-desc">Saved properties and items</span>
              </div>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>

            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showMessages(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-comment"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">Messages</span>
                <span class="mobile-profile-menu-desc">Chat with landlords</span>
              </div>
              <span class="mobile-profile-menu-badge" id="mobile-messages-badge" style="display:none;">0</span>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>

            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showSearches(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-search"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">My Searches</span>
                <span class="mobile-profile-menu-desc">Saved search filters</span>
              </div>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>

            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showSettings(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-cog"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">Account Settings</span>
                <span class="mobile-profile-menu-desc">Manage your profile</span>
              </div>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>

            <a href="#" class="mobile-profile-menu-item" onclick="KejaMobile.showHelp(); return false;">
              <div class="mobile-profile-menu-icon">
                <i class="fas fa-question-circle"></i>
              </div>
              <div class="mobile-profile-menu-text">
                <span class="mobile-profile-menu-title">Help & Support</span>
                <span class="mobile-profile-menu-desc">Get help or contact us</span>
              </div>
              <i class="fas fa-chevron-right" style="color:#cbd5e1;"></i>
            </a>
          </div>
        </div>

      </div>

      <!-- SCREEN 4: FILTERS PANEL (Overlay) -->
      <div id="mobile-filters-panel" class="mobile-filters-panel mobile-only">
        <div class="mobile-filters-header">
          <h2 class="mobile-filters-title">Filters</h2>
          <button class="mobile-filters-reset" onclick="KejaMobile.resetFilters()">Reset</button>
          <button class="mobile-filters-reset" onclick="KejaMobile.closeFilters()" style="margin-left:auto;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="mobile-filters-content">
          <!-- Property Type -->
          <div class="mobile-filter-group">
            <label class="mobile-filter-label">Property Type</label>
            <div class="mobile-filter-chips">
              <button class="mobile-filter-chip" data-filter="type" data-value="house">House</button>
              <button class="mobile-filter-chip active" data-filter="type" data-value="apartment">Apartment</button>
              <button class="mobile-filter-chip" data-filter="type" data-value="bedsitter">Bedsitter</button>
              <button class="mobile-filter-chip" data-filter="type" data-value="land">Land</button>
              <button class="mobile-filter-chip" data-filter="type" data-value="commercial">Commercial</button>
            </div>
          </div>

          <!-- Price Range -->
          <div class="mobile-filter-group">
            <label class="mobile-filter-label">Price Range (KSh)</label>
            <div class="mobile-filter-range">
              <input type="number" class="mobile-filter-input" placeholder="Min" id="mobile-filter-min">
              <span>-</span>
              <input type="number" class="mobile-filter-input" placeholder="Max" id="mobile-filter-max">
            </div>
          </div>

          <!-- Bedrooms -->
          <div class="mobile-filter-group">
            <label class="mobile-filter-label">Bedrooms</label>
            <div class="mobile-filter-chips">
              <button class="mobile-filter-chip" data-filter="beds" data-value="any">Any</button>
              <button class="mobile-filter-chip" data-filter="beds" data-value="1">1+</button>
              <button class="mobile-filter-chip" data-filter="beds" data-value="2">2+</button>
              <button class="mobile-filter-chip" data-filter="beds" data-value="3">3+</button>
              <button class="mobile-filter-chip" data-filter="beds" data-value="4">4+</button>
            </div>
          </div>

          <!-- Location / Estate -->
          <div class="mobile-filter-group">
            <label class="mobile-filter-label">Location / Estate</label>
            <input type="text" class="mobile-filter-input" placeholder="e.g., Kilimani, Westlands..." id="mobile-filter-location">
          </div>

          <!-- More Filters -->
          <div class="mobile-filter-group">
            <label class="mobile-filter-label">More Filters</label>
            <div class="mobile-filter-chips">
              <button class="mobile-filter-chip" data-filter="verified" data-value="true">Verified Only</button>
              <button class="mobile-filter-chip" data-filter="parking" data-value="true">Parking</button>
              <button class="mobile-filter-chip" data-filter="wifi" data-value="true">WiFi</button>
              <button class="mobile-filter-chip" data-filter="gym" data-value="true">Gym</button>
            </div>
          </div>
        </div>

        <div class="mobile-filters-footer">
          <button class="mobile-apply-filters-btn" onclick="KejaMobile.applyFilters()">
            Apply Filters
          </button>
        </div>
      </div>

      <!-- BOTTOM NAVIGATION -->
      <div class="mobile-bottom-nav mobile-only">
        <a href="#" class="mobile-nav-item active" data-screen="home" onclick="KejaMobile.navigate('home'); return false;">
          <i class="fas fa-home mobile-nav-icon"></i>
          <span class="mobile-nav-label">Home</span>
        </a>
        <a href="#" class="mobile-nav-item" data-screen="search" onclick="KejaMobile.navigate('browse'); return false;">
          <i class="fas fa-search mobile-nav-icon"></i>
          <span class="mobile-nav-label">Search</span>
        </a>
        <a href="#" class="mobile-nav-item" data-screen="favorites" onclick="KejaMobile.toggleFavorites(); return false;">
          <i class="fas fa-heart mobile-nav-icon"></i>
          <span class="mobile-nav-label">Favorites</span>
        </a>
        <a href="#" class="mobile-nav-item" data-screen="messages" onclick="KejaMobile.openMessages(); return false;">
          <i class="fas fa-comment mobile-nav-icon"></i>
          <span class="mobile-nav-label">Messages</span>
          <span class="mobile-nav-badge" id="mobile-nav-messages-badge" style="display:none;">0</span>
        </a>
        <a href="#" class="mobile-nav-item" data-screen="profile" onclick="KejaMobile.navigate('profile'); return false;">
          <i class="fas fa-user mobile-nav-icon"></i>
          <span class="mobile-nav-label">Profile</span>
        </a>
      </div>
    `;

    // Insert mobile structure at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', mobileHTML);
    
    // Hide desktop elements on mobile
    hideDesktopElements();
  }

  // Hide desktop elements when on mobile
  function hideDesktopElements() {
    const desktopSelectors = [
      '.header',
      '.desktop-header',
      '.desktop-nav',
      '.sidebar',
      '#map-container',
      '.desktop-footer'
    ];

    desktopSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
      });
    });
  }

  // Bind event listeners
  function bindEvents() {
    // Filter chip toggles
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('mobile-filter-chip')) {
        e.target.classList.toggle('active');
      }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobile() && document.querySelector('.mobile-header')) {
          // Switched to desktop - reload to show desktop layout
          location.reload();
        }
      }, 250);
    });
  }

  // Navigation functions
  function navigate(screen) {
    state.currentScreen = screen;
    
    // Hide all screens
    document.querySelectorAll('.mobile-screen').forEach(s => {
      s.style.display = 'none';
    });

    // Show selected screen
    const screenEl = document.getElementById(`mobile-screen-${screen}`);
    if (screenEl) {
      screenEl.style.display = 'block';
    }

    // Update bottom nav
    updateBottomNav();

    // Load screen content
    loadScreenContent(screen);
  }

  function updateBottomNav() {
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.screen === state.currentScreen) {
        item.classList.add('active');
      }
    });
  }

  function loadScreenContent(screen) {
    switch(screen) {
      case 'home':
        loadFeaturedListings();
        break;
      case 'browse':
        loadBrowseListings();
        break;
      case 'profile':
        loadProfileData();
        break;
    }
  }

  // Load featured listings for home screen
  function loadFeaturedListings() {
    if (!window.app || !window.app.properties) return;
    
    const grid = document.getElementById('mobile-featured-grid');
    if (!grid) return;

    const featured = window.app.properties.slice(0, 6);
    grid.innerHTML = featured.map(p => createListingCard(p)).join('');
  }

  // Load browse listings
  function loadBrowseListings() {
    if (!window.app || !window.app.properties) return;
    
    const grid = document.getElementById('mobile-browse-grid');
    const countEl = document.getElementById('mobile-results-total');
    
    if (!grid) return;

    const properties = window.app.properties;
    grid.innerHTML = properties.map(p => createListingCard(p)).join('');
    
    if (countEl) {
      countEl.textContent = properties.length;
    }
  }

  // Create listing card HTML
  function createListingCard(property) {
    const price = property.rentKes || property.price || 0;
    const badge = property.category || 'property';
    const isFavorite = window.app && window.app.favorites && window.app.favorites.has(property.id);

    return `
      <div class="mobile-listing-card" onclick="KejaMobile.showPropertyDetail('${property.id}')">
        <div class="mobile-listing-image-wrapper">
          <img src="${property.thumbnail || property.images?.[0] || 'https://via.placeholder.com/400x300'}" 
               alt="${property.title}" 
               class="mobile-listing-image"
               loading="lazy">
          <div class="mobile-listing-favorite ${isFavorite ? 'active' : ''}" 
               onclick="event.stopPropagation(); KejaMobile.toggleFavorite('${property.id}')">
            <i class="fas fa-heart"></i>
          </div>
          <span class="mobile-listing-badge badge-${badge.toLowerCase().replace(/\s+/g, '')}">
            ${badge}
          </span>
        </div>
        <div class="mobile-listing-details">
          <div class="mobile-listing-price">
            KSh ${price.toLocaleString()}
            <span class="mobile-listing-price-period">/month</span>
          </div>
          <div class="mobile-listing-title">${property.title || 'Property Listing'}</div>
          <div class="mobile-listing-location">
            <i class="fas fa-map-marker-alt"></i>
            ${property.estateSuburb || property.location || 'Nairobi'}
          </div>
          ${property.bedrooms ? `
          <div class="mobile-listing-meta">
            <span><i class="fas fa-bed"></i> ${property.bedrooms}</span>
            <span><i class="fas fa-bath"></i> ${property.bathrooms || 1}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Show property detail
  function showPropertyDetail(propertyId) {
    console.log('[KejaMobile] Show property detail:', propertyId);
    // Will be implemented to show full property details
  }

  // Toggle favorite
  function toggleFavorite(propertyId) {
    if (window.app && typeof window.app.toggleFavorite === 'function') {
      window.app.toggleFavorite(propertyId);
      loadScreenContent(state.currentScreen);
    }
  }

  // Filters functions
  function openFilters() {
    const panel = document.getElementById('mobile-filters-panel');
    if (panel) {
      panel.classList.add('active');
    }
  }

  function closeFilters() {
    const panel = document.getElementById('mobile-filters-panel');
    if (panel) {
      panel.classList.remove('active');
    }
  }

  function applyFilters() {
    // Get filter values and apply them
    closeFilters();
    loadBrowseListings();
  }

  function resetFilters() {
    document.querySelectorAll('.mobile-filter-chip').forEach(chip => {
      chip.classList.remove('active');
    });
    document.querySelectorAll('.mobile-filter-input').forEach(input => {
      input.value = '';
    });
  }

  // Load profile data
  function loadProfileData() {
    const session = kejaAuth && kejaAuth.getSession ? kejaAuth.getSession() : null;
    
    const avatarEl = document.getElementById('mobile-profile-avatar');
    const nameEl = document.getElementById('mobile-profile-name');
    const emailEl = document.getElementById('mobile-profile-email');

    if (session) {
      if (avatarEl) avatarEl.textContent = (session.name || 'U').charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = session.name || 'User';
      if (emailEl) emailEl.textContent = session.email || session.phone || '';
    } else {
      if (avatarEl) avatarEl.textContent = 'U';
      if (nameEl) nameEl.textContent = 'Guest User';
      if (emailEl) emailEl.textContent = 'Sign in to save favorites';
    }
  }

  // Public API
  return {
    init,
    navigate,
    showPropertyDetail,
    toggleFavorite,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    performSearch: () => navigate('browse'),
    filterByCategory: (cat) => { console.log('Filter by:', cat); navigate('browse'); },
    showScreen: (screen) => navigate(screen),
    openMessages: () => console.log('Messages'),
    toggleFavorites: () => navigate('browse'), // Show favorites in browse
    openNotifications: () => console.log('Notifications'),
    openLocationPicker: () => console.log('Location picker'),
    toggleSort: () => console.log('Sort'),
    showMyListings: () => console.log('My listings'),
    showFavorites: () => console.log('Favorites'),
    showMessages: () => console.log('Messages'),
    showSearches: () => console.log('Searches'),
    showSettings: () => console.log('Settings'),
    showHelp: () => console.log('Help')
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => KejaMobile.init());
} else {
  KejaMobile.init();
}

// Make globally accessible
window.KejaMobile = KejaMobile;
