/**
 * Nairobi Rentals Live - Main Application Controller
 * High-performance orchestrator for search, filtering, view switching, modals, and user interactions.
 */

class NairobiRentalsApp {
  constructor() {
    this.properties = [...SEED_PROPERTIES];
    this.favorites = new Set();
    this.currentViewMode = 'grid'; // 'grid' | 'split' | 'map'
    this.currentPage = 1;
    this.pageSize = 9;
    this.activeCategory = 'All';
    this.activeCorridor = 'all';
    this.activeSuburb = 'all';
    this.activeCounty = 'all';
    this.searchQuery = '';
    this.minPrice = 0;
    this.maxPrice = 200000;
    this.sortBy = 'newest';
    this.showOnlyFavorites = false;
    this.hideTaken = true; // Default hide taken/occupied properties

    // Filters for utilities & amenities
    this.filters = {
      waterBorehole: false,
      waterCouncil: false,
      electricityTokens: false,
      balcony: false,
      parking: false,
      fence: false,
      cctv: false,
      internet: false,
      tiles: false,
      ensuite: false
    };

    this.selectedPropertyForDetail = null;
    this.activeChatProperty = null;
    this.chatMessages = [];
  }

  async init() {
    this.loadFavorites();
    this.currentFilterMode = 'properties'; // Default to properties
    this.renderCategoryPills();
    this.populateSidebarFilters();
    this.setupEventListeners();
    this.loadChatMessages();
    
    // Fetch live database listings from backend
    await this.fetchLiveProperties();

    this.applyFilters();

    // Init map and landlord managers
    window.mapController.init();
    window.landlordManager.initModal();

    // Show initial map pins
    setTimeout(() => {
      window.mapController.renderPins(this.filteredProperties);
    }, 300);
  }

  async fetchLiveProperties() {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        console.log('API response:', data);
        
        // Handle different response formats
        let propsArray = [];
        if (data.properties && Array.isArray(data.properties)) {
          propsArray = data.properties;
        } else if (data.data && Array.isArray(data.data)) {
          propsArray = data.data;
        } else if (Array.isArray(data)) {
          propsArray = data;
        }

        if (propsArray.length > 0) {
          // TENANT PORTAL: Show ONLY verified/approved + VACANT listings (hide taken properties)
          this.properties = propsArray.filter(p => 
            (p.status === 'approved' || 
            p.isApproved === true ||
            p.isVerified === true ||
            p.status === 'active') &&
            p.availability !== 'taken' &&  // Hide taken properties from tenant view
            !p.title?.includes('BEYOND SUNDAY') &&  // Exclude test data
            !p.isTest &&  // Exclude test properties
            !p.isPlaceholder  // Exclude placeholders
          );
          console.log('Loaded properties from API:', this.properties.length);
          return;
        }
      }
    } catch (err) {
      console.log('API fetch failed:', err);
    }
    
    // Fallback to seed properties
    console.log('Using seed properties (offline fallback)');
    this.properties = SEED_PROPERTIES.filter(p => 
      (p.status === 'approved' || 
      p.isApproved === true ||
      p.isVerified === true ||
      p.status === 'active') &&
      p.availability !== 'taken' &&  // Hide taken properties
      !p.title?.includes('BEYOND SUNDAY') &&
      !p.isTest &&
      !p.isPlaceholder
    );
    console.log('Loaded properties from seed:', this.properties.length);
  }

  // Alias called by admin.js after listing boost/delete
  async loadProperties() {
    await this.fetchLiveProperties();
    await this.loadMainServicesSection(); // Load services section
    this.applyFilters();
  }

  loadFavorites() {
    const saved = localStorage.getItem('nairobi_rentals_favs');
    if (saved) {
      try {
        this.favorites = new Set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
    this.updateFavoritesCounter();
    // Sync from server if logged in
    this.syncFavoritesFromServer();
  }

  async syncFavoritesFromServer() {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      if (!token) return;
      const res = await fetch('/api/favourites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.favourites && data.favourites.length > 0) {
        // Merge server favourites with local
        data.favourites.forEach(id => this.favorites.add(id));
        this.saveFavorites();
      }
    } catch (e) {
      // Silent — offline fallback to localStorage
    }
  }

  saveFavorites() {
    localStorage.setItem('nairobi_rentals_favs', JSON.stringify([...this.favorites]));
    this.updateFavoritesCounter();
  }

  updateFavoritesCounter() {
    const countEl = document.getElementById('fav-count-badge');
    if (countEl) {
      countEl.textContent = this.favorites.size;
    }
  }

  toggleFavorite(propertyId, event) {
    if (event) event.stopPropagation();
    const wasAdded = !this.favorites.has(propertyId);
    if (this.favorites.has(propertyId)) {
      this.favorites.delete(propertyId);
      this.showToast('Removed from saved favorites', 'info');
    } else {
      this.favorites.add(propertyId);
      this.showToast('Saved to your favorites! ❤️', 'success');
    }
    this.saveFavorites();
    this.applyFilters();

    // Persist to server if logged in
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    if (token) {
      const method = wasAdded ? 'POST' : 'DELETE';
      fetch(`/api/favourites/${encodeURIComponent(propertyId)}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {}); // Silent — localStorage is fallback
    }
  }

  renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    const sidebarList = document.getElementById('sidebar-category-list');

    const getCatIcon = (cat) => {
      if (cat === 'All') return 'fa-th-large';
      if (cat.includes('BnB') || cat.includes('Airbnb')) return 'fa-bed';
      if (cat.includes('Villa') || cat.includes('Vacation')) return 'fa-umbrella-beach';
      if (cat.includes('Conference') || cat.includes('Boardroom')) return 'fa-chalkboard-teacher';
      if (cat.includes('Meeting') || cat.includes('Event')) return 'fa-handshake';
      if (cat.includes('Office') || cat.includes('Co-Working') || cat.includes('Shop') || cat.includes('Commercial')) return 'fa-briefcase';
      if (cat.includes('Shared') || cat.includes('Hostel')) return 'fa-users';
      if (cat.includes('Bedsitter') || cat.includes('Single')) return 'fa-door-open';
      if (cat.includes('Maisonette') || cat.includes('Townhouse')) return 'fa-building';
      if (cat.includes('Penthouse') || cat.includes('Serviced')) return 'fa-crown';
      if (cat.includes('Marketplace')) return 'fa-shopping-bag';
      return 'fa-home';
    };

    // Horizontal scrolling pills (mobile / hidden on desktop)
    if (container) {
      const allPill = `<button class="category-pill active" data-category="All" onclick="app.setCategory('All', this)"><i class="fas fa-th-large"></i> All Properties</button>`;
      const pills = MASTER_CATEGORIES.map(cat =>
        `<button class="category-pill" data-category="${cat}" onclick="app.setCategory('${cat}', this)"><i class="fas ${getCatIcon(cat)}"></i> ${cat}</button>`
      ).join('');
      container.innerHTML = allPill + pills;
    }

    // Sidebar vertical category list
    if (sidebarList) {
      const allItem = `<button class="sidebar-cat-item active" data-category="All" onclick="app.setCategory('All', this)"><i class="fas fa-th-large"></i><span>All Properties</span></button>`;
      const items = MASTER_CATEGORIES.map(cat =>
        `<button class="sidebar-cat-item" data-category="${cat}" onclick="app.setCategory('${cat}', this)"><i class="fas ${getCatIcon(cat)}"></i><span>${cat}</span></button>`
      ).join('');
      sidebarList.innerHTML = allItem + items;
    }

    // Header Category Dropdown
    const headerCatSelect = document.getElementById('header-category-select');
    if (headerCatSelect) {
      headerCatSelect.innerHTML = `<option value="All">All Categories</option>` + 
        MASTER_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
      headerCatSelect.addEventListener('change', (e) => {
        this.setCategory(e.target.value);
      });
    }
  }

  setCategory(categoryName, el) {
    this.activeCategory = categoryName;
    
    // Update horizontal pills active class
    document.querySelectorAll('.category-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category') === categoryName);
    });

    // Update sidebar list active class
    document.querySelectorAll('.sidebar-cat-item').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category') === categoryName);
    });

    const headerCatSelect = document.getElementById('header-category-select');
    if (headerCatSelect) headerCatSelect.value = categoryName;

    this.currentPage = 1;
    this.applyFilters();
  }

  populateSidebarFilters() {
    // Populate Counties / Corridors
    const corridorSelect = document.getElementById('filter-corridor');
    if (corridorSelect) {
      corridorSelect.innerHTML = `<option value="all">All Nairobi Corridors & Satellite Towns</option>` +
        NAIROBI_REGIONS.map(r => `<option value="${r.corridorId}">${r.corridorName} (${r.county})</option>`).join('');
      
      corridorSelect.addEventListener('change', (e) => {
        this.activeCorridor = e.target.value;
        this.updateSuburbFilterOptions();
        this.applyFilters();
      });
    }

    this.updateSuburbFilterOptions();
  }

  updateSuburbFilterOptions() {
    const suburbSelect = document.getElementById('filter-suburb');
    if (!suburbSelect) return;

    let availableSuburbs = ALL_SUBURBS;
    if (this.activeCorridor !== 'all') {
      availableSuburbs = ALL_SUBURBS.filter(s => s.corridorId === this.activeCorridor);
    }

    suburbSelect.innerHTML = `<option value="all">All Suburbs & Estates (${availableSuburbs.length})</option>` +
      availableSuburbs.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    
    suburbSelect.addEventListener('change', (e) => {
      this.activeSuburb = e.target.value;
      this.applyFilters();
    });
  }

  switchFilterTab(tab) {
    console.log('Switching filter tab to:', tab);
    const categoryLabel = document.getElementById('filter-category-label');
    const categoryList = document.getElementById('sidebar-category-list');
    const propertyFiltersExtra = document.getElementById('sidebar-property-filters-extra');
    const serviceFiltersExtra = document.getElementById('sidebar-service-filters-extra');
    const marketplaceFiltersExtra = document.getElementById('sidebar-marketplace-filters-extra');
    const propertiesBtn = document.getElementById('filter-tab-properties');
    const servicesBtn = document.getElementById('filter-tab-services');
    const marketplaceBtn = document.getElementById('filter-tab-marketplace');

    if (!categoryLabel) {
      console.warn('Filter tab elements not found in DOM');
      return;
    }

    // Reset all tabs to inactive style
    [propertiesBtn, servicesBtn, marketplaceBtn].forEach(btn => {
      if (btn) {
        btn.style.background = 'transparent';
        btn.style.color = '#475569';
        btn.style.border = '1px solid #e2e8f0';
      }
    });

    if (tab === 'properties') {
      if (propertiesBtn) {
        propertiesBtn.style.background = '#00b53f';
        propertiesBtn.style.color = 'white';
        propertiesBtn.style.border = 'none';
      }
      if (categoryLabel) categoryLabel.innerHTML = '<i class="fas fa-th-list" style="color: #00b53f;"></i> Property Type';
      this.currentFilterMode = 'properties';
      this.renderPropertyCategories();
      if (propertyFiltersExtra) propertyFiltersExtra.style.display = 'block';
      if (serviceFiltersExtra) serviceFiltersExtra.style.display = 'none';
      if (marketplaceFiltersExtra) marketplaceFiltersExtra.style.display = 'none';
    } else if (tab === 'services') {
      if (servicesBtn) {
        servicesBtn.style.background = '#00b53f';
        servicesBtn.style.color = 'white';
        servicesBtn.style.border = 'none';
      }
      if (categoryLabel) categoryLabel.innerHTML = '<i class="fas fa-tools" style="color: #00b53f;"></i> Service Type';
      this.currentFilterMode = 'services';
      this.renderServiceCategories();
      if (propertyFiltersExtra) propertyFiltersExtra.style.display = 'none';
      if (serviceFiltersExtra) serviceFiltersExtra.style.display = 'block';
      if (marketplaceFiltersExtra) marketplaceFiltersExtra.style.display = 'none';
    } else if (tab === 'marketplace') {
      if (marketplaceBtn) {
        marketplaceBtn.style.background = '#00b53f';
        marketplaceBtn.style.color = 'white';
        marketplaceBtn.style.border = 'none';
      }
      if (categoryLabel) categoryLabel.innerHTML = '<i class="fas fa-shopping-bag" style="color: #00b53f;"></i> House Item Type';
      this.currentFilterMode = 'marketplace';
      this.renderMarketplaceCategories();
      if (propertyFiltersExtra) propertyFiltersExtra.style.display = 'none';
      if (serviceFiltersExtra) serviceFiltersExtra.style.display = 'none';
      if (marketplaceFiltersExtra) marketplaceFiltersExtra.style.display = 'block';
    }
  }

  renderPropertyCategories() {
    const categoryList = document.getElementById('sidebar-category-list');
    if (!categoryList) return;

    const getIcon = (cat) => {
      if (cat === 'All') return 'fa-th-large';
      if (cat.includes('BnB') || cat.includes('Airbnb')) return 'fa-bed';
      if (cat.includes('Villa') || cat.includes('Vacation')) return 'fa-umbrella-beach';
      if (cat.includes('Conference') || cat.includes('Boardroom')) return 'fa-chalkboard-teacher';
      if (cat.includes('Meeting') || cat.includes('Event')) return 'fa-handshake';
      if (cat.includes('Office') || cat.includes('Co-Working') || cat.includes('Shop') || cat.includes('Commercial')) return 'fa-briefcase';
      if (cat.includes('Shared') || cat.includes('Hostel')) return 'fa-users';
      if (cat.includes('Bedsitter') || cat.includes('Single')) return 'fa-door-open';
      if (cat.includes('Maisonette') || cat.includes('Townhouse')) return 'fa-building';
      if (cat.includes('Penthouse') || cat.includes('Serviced')) return 'fa-crown';
      if (cat.includes('Marketplace')) return 'fa-shopping-bag';
      return 'fa-home';
    };

    const allItem = `<button class="sidebar-cat-item active" data-category="All" onclick="app.setCategory('All', this)"><i class="fas fa-th-large"></i><span>All Properties</span></button>`;
    const items = MASTER_CATEGORIES
      .filter(cat => !cat.includes('Marketplace'))
      .map(cat => `<button class="sidebar-cat-item" data-category="${cat}" onclick="app.setCategory('${cat}', this)"><i class="fas ${getIcon(cat)}"></i><span>${cat}</span></button>`)
      .join('');
    categoryList.innerHTML = allItem + items;
  }

  renderServiceCategories() {
    const categoryList = document.getElementById('sidebar-category-list');
    if (!categoryList) return;

    const getIcon = (service) => {
      if (service.includes('Plumb')) return 'fa-wrench';
      if (service.includes('Electric')) return 'fa-bolt';
      if (service.includes('Clean')) return 'fa-broom';
      if (service.includes('Paint') || service.includes('Renovation')) return 'fa-paint-brush';
      if (service.includes('Pest')) return 'fa-bug';
      if (service.includes('Security')) return 'fa-shield-alt';
      if (service.includes('Handyman')) return 'fa-hammer';
      if (service.includes('Carpentry') || service.includes('Furniture')) return 'fa-hammer-paw';
      if (service.includes('Appliance')) return 'fa-microchip';
      if (service.includes('Water')) return 'fa-water';
      if (service.includes('Garden')) return 'fa-leaf';
      if (service.includes('Pet') || service.includes('Sitting')) return 'fa-dog';
      return 'fa-tools';
    };

    const allItem = `<button class="sidebar-cat-item active" data-service="All" onclick="app.setServiceCategory('All', this)"><i class="fas fa-th-large"></i><span>All Services</span></button>`;
    const items = SERVICE_CATEGORIES.map(service =>
      `<button class="sidebar-cat-item" data-service="${service}" onclick="app.setServiceCategory('${service}', this)"><i class="fas ${getIcon(service)}"></i><span>${service}</span></button>`
    ).join('');
    categoryList.innerHTML = allItem + items;
  }

  renderMarketplaceCategories() {
    const categoryList = document.getElementById('sidebar-category-list');
    if (!categoryList) return;

    const getIcon = (item) => {
      if (item.includes('Kitchen')) return 'fa-utensils';
      if (item.includes('Furniture') || item.includes('Sofas') || item.includes('Chair')) return 'fa-couch';
      if (item.includes('Bed') || item.includes('Mattress')) return 'fa-bed';
      if (item.includes('Dining')) return 'fa-chair';
      if (item.includes('Wardrobe') || item.includes('Cabinet')) return 'fa-square';
      if (item.includes('Electronics') || item.includes('TV')) return 'fa-tv';
      if (item.includes('Air')) return 'fa-wind';
      if (item.includes('Water Heater') || item.includes('Tank')) return 'fa-shower';
      if (item.includes('Cook') || item.includes('Stove')) return 'fa-fire';
      if (item.includes('Washing')) return 'fa-water';
      if (item.includes('Fridge') || item.includes('Freezer')) return 'fa-snowflake';
      if (item.includes('Mirror') || item.includes('Decor')) return 'fa-mirror';
      if (item.includes('Light') || item.includes('Fixture')) return 'fa-lightbulb';
      if (item.includes('Door') || item.includes('Lock')) return 'fa-door-closed';
      if (item.includes('Paint') || item.includes('Wallpaper')) return 'fa-palette';
      if (item.includes('Building')) return 'fa-hammer';
      if (item.includes('Tools')) return 'fa-toolbox';
      if (item.includes('Book')) return 'fa-book';
      if (item.includes('Sport')) return 'fa-basketball';
      if (item.includes('Garden')) return 'fa-leaf';
      return 'fa-shopping-bag';
    };

    const allItem = `<button class="sidebar-cat-item active" data-item="All" onclick="app.setMarketplaceItem('All', this)"><i class="fas fa-th-large"></i><span>All House Items</span></button>`;
    const items = HOUSE_ITEMS.map(item =>
      `<button class="sidebar-cat-item" data-item="${item}" onclick="app.setMarketplaceItem('${item}', this)"><i class="fas ${getIcon(item)}"></i><span>${item}</span></button>`
    ).join('');
    categoryList.innerHTML = allItem + items;
  }

  setServiceCategory(service, btn) {
    const allButtons = document.querySelectorAll('#sidebar-category-list .sidebar-cat-item');
    allButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.activeServiceCategory = service;
    this.showToast(`📍 Filtering services: ${service}`, 'info');
  }

  setMarketplaceItem(item, btn) {
    const allButtons = document.querySelectorAll('#sidebar-category-list .sidebar-cat-item');
    allButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.activeMarketplaceItem = item;
    this.showToast(`🛍️ Filtering items: ${item}`, 'info');
  }

   setupEventListeners() {
    // Search form in header
    const searchForm = document.getElementById('header-search-form');
    const searchInput = document.getElementById('header-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    const suggestionsDropdown = document.getElementById('header-search-suggestions');

    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.searchQuery = searchInput.value.trim();
        this.currentPage = 1;
        this.applyFilters();
        if (suggestionsDropdown) suggestionsDropdown.style.display = 'none';
      });

      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
        }
        this.showSearchSuggestions(this.searchQuery);
        this.currentPage = 1;
        this.applyFilters();
      });

      searchInput.addEventListener('focus', () => {
        if (this.searchQuery && this.searchQuery.length >= 2) {
          this.showSearchSuggestions(this.searchQuery);
        }
      });
    }

    // Close suggestions dropdown on outside click
    document.addEventListener('click', (e) => {
      if (suggestionsDropdown && !e.target.closest('.header-search-wrapper')) {
        suggestionsDropdown.style.display = 'none';
      }
    });

    // Price Slider & Inputs
    const priceSlider = document.getElementById('price-slider');
    const priceMaxInput = document.getElementById('price-max-input');
    const priceMinInput = document.getElementById('price-min-input');

    if (priceSlider && priceMaxInput) {
      priceSlider.addEventListener('input', (e) => {
        this.maxPrice = parseInt(e.target.value);
        priceMaxInput.value = this.maxPrice;
        this.applyFilters();
      });

      priceMaxInput.addEventListener('change', (e) => {
        this.maxPrice = parseInt(e.target.value) || 200000;
        priceSlider.value = this.maxPrice;
        this.applyFilters();
      });
    }

    if (priceMinInput) {
      priceMinInput.addEventListener('change', (e) => {
        this.minPrice = parseInt(e.target.value) || 0;
        this.applyFilters();
      });
    }

    // Checkbox filters
    const checkboxMap = [
      { id: 'filter-borehole', key: 'waterBorehole' },
      { id: 'filter-council', key: 'waterCouncil' },
      { id: 'filter-tokens', key: 'electricityTokens' },
      { id: 'filter-balcony', key: 'balcony' },
      { id: 'filter-parking', key: 'parking' },
      { id: 'filter-fence', key: 'fence' },
      { id: 'filter-cctv', key: 'cctv' },
      { id: 'filter-internet', key: 'internet' },
      { id: 'filter-tiles', key: 'tiles' },
      { id: 'filter-ensuite', key: 'ensuite' }
    ];

    checkboxMap.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener('change', (e) => {
          this.filters[item.key] = e.target.checked;
          this.applyFilters();
        });
      }
    });

    // Hide Taken Checkbox
    const hideTakenEl = document.getElementById('filter-hide-taken');
    if (hideTakenEl) {
      hideTakenEl.addEventListener('change', (e) => {
        this.hideTaken = e.target.checked;
        this.applyFilters();
      });
    }

    // Sorting
    const sortSelect = document.getElementById('sort-by-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.applyFilters();
      });
    }
  }

  setViewMode(mode) {
    if ((mode === 'map' || mode === 'split') && (!window.kejaAuth || !window.kejaAuth.getSession())) {
      window.kejaAuth.requireTenantAuth(() => this.setViewMode(mode));
      return;
    }

    this.currentViewMode = mode;

    // Toggle button active states
    document.querySelectorAll('.btn-view-mode').forEach(b => {
      if (b.getAttribute('data-view') === mode) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Toggle container visibilities
    const gridContainer = document.getElementById('view-grid-container');
    const splitContainer = document.getElementById('view-split-container');
    const mapContainer = document.getElementById('view-map-container');

    if (gridContainer) gridContainer.classList.toggle('hidden', mode !== 'grid');
    if (splitContainer) splitContainer.classList.toggle('hidden', mode !== 'split');
    if (mapContainer) mapContainer.classList.toggle('hidden', mode !== 'map');

    window.mapController.invalidateMaps();
  }

  resetFilters() {
    this.activeCategory = 'All';
    this.activeCorridor = 'all';
    this.activeSuburb = 'all';
    this.searchQuery = '';
    this.minPrice = 0;
    this.maxPrice = 200000;
    this.showOnlyFavorites = false;
    this.sortBy = 'newest';

    Object.keys(this.filters).forEach(k => { this.filters[k] = false; });

    // Reset UI elements
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) searchInput.value = '';
    const corridorSelect = document.getElementById('filter-corridor');
    if (corridorSelect) corridorSelect.value = 'all';
    const priceSlider = document.getElementById('price-slider');
    if (priceSlider) priceSlider.value = 200000;
    const priceMaxInput = document.getElementById('price-max-input');
    if (priceMaxInput) priceMaxInput.value = 200000;
    const priceMinInput = document.getElementById('price-min-input');
    if (priceMinInput) priceMinInput.value = 0;

    document.querySelectorAll('.sidebar-filters input[type="checkbox"]').forEach(c => { c.checked = false; });

    this.setCategory('All');
    this.updateSuburbFilterOptions();
    this.applyFilters();
    this.showToast('All filters have been reset', 'info');
  }

  toggleFavoritesView() {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    const favBtn = document.getElementById('btn-header-favs');
    if (favBtn) {
      favBtn.classList.toggle('active', this.showOnlyFavorites);
    }
    this.currentPage = 1;
    this.applyFilters();
    if (this.showOnlyFavorites) {
      this.showToast(`Showing ${this.favorites.size} saved favorites`, 'info');
    }
  }

  applyFilters() {
    let result = this.properties.filter(p => {
      // Hide taken / occupied properties filter
      if (this.hideTaken && (p.isTaken || p.status === 'taken')) return false;

      // Favorites filter
      if (this.showOnlyFavorites && !this.favorites.has(p.id)) return false;

      // Category filter
      if (this.activeCategory !== 'All' && p.category !== this.activeCategory) return false;

      // Corridor filter
      if (this.activeCorridor !== 'all' && p.corridorId !== this.activeCorridor) return false;

      // Suburb filter
      if (this.activeSuburb !== 'all' && p.estateSuburb !== this.activeSuburb) return false;

      // Price filter
      if (p.rentKes < this.minPrice || p.rentKes > this.maxPrice) return false;

      // Utilities filter
      if (this.filters.waterBorehole && !p.waterSupplyType.toLowerCase().includes('borehole')) return false;
      if (this.filters.waterCouncil && !p.waterSupplyType.toLowerCase().includes('council')) return false;
      if (this.filters.electricityTokens && !p.electricityMeterType.toLowerCase().includes('tokens') && !p.electricityMeterType.toLowerCase().includes('prepaid')) return false;

      // Amenities filter
      if (this.filters.balcony && !p.amenities.hasBalcony) return false;
      if (this.filters.parking && !p.amenities.hasParking) return false;
      if (this.filters.fence && !p.amenities.hasElectricFence) return false;
      if (this.filters.cctv && !p.amenities.hasCctv) return false;
      if (this.filters.internet && !p.amenities.hasInternet) return false;
      if (this.filters.tiles && !p.amenities.hasTiles) return false;
      if (this.filters.ensuite && !p.amenities.isMasterEnsuite) return false;

      // Enhanced Multi-Attribute Real-time Search query filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchEstate = p.estateSuburb.toLowerCase().includes(q);
        const matchCounty = p.county.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchCorridor = p.corridorId ? p.corridorId.toLowerCase().includes(q) : false;
        const matchAgency = (p.agencyName && p.agencyName.toLowerCase().includes(q)) || (p.landlord?.name && p.landlord.name.toLowerCase().includes(q));

        // Keywords for bedrooms
        const matchBedsitter = (q.includes('bedsitter') || q.includes('studio')) && (p.category.includes('Bedsitter') || p.bedrooms === 0);
        const matchSingle = (q.includes('single') || q.includes('single room')) && p.category.includes('Single Room');
        const match1Bed = (q.includes('1 bed') || q.includes('one bed')) && p.bedrooms === 1;
        const match2Bed = (q.includes('2 bed') || q.includes('two bed')) && p.bedrooms === 2;
        const match3Bed = (q.includes('3 bed') || q.includes('three bed')) && p.bedrooms === 3;
        const matchBnb = (q.includes('bnb') || q.includes('airbnb') || q.includes('daily')) && (p.isBnb || p.rentPeriod === 'night');

        // Keywords for agency / caretaker
        const matchAgencyWord = (q.includes('agency') || q.includes('agent')) && (p.managedBy === 'agency' || p.landlord?.isAgency);
        const matchCaretakerWord = q.includes('caretaker') && (p.caretakerPhone || p.caretakerName);

        // Keywords for utilities
        const matchBorehole = q.includes('borehole') && p.waterSupplyType.toLowerCase().includes('borehole');
        const matchTokens = (q.includes('token') || q.includes('prepaid')) && p.electricityMeterType.toLowerCase().includes('token');

        if (
          !matchTitle && !matchDesc && !matchEstate && !matchCounty && 
          !matchCategory && !matchCorridor && !matchAgency && 
          !matchBedsitter && !matchSingle && !match1Bed && !match2Bed && !match3Bed && !matchBnb &&
          !matchAgencyWord && !matchCaretakerWord && !matchBorehole && !matchTokens
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting: Begins with Single Rooms and goes upwards
    const CATEGORY_ORDER_RANK = {
      'Single Room': 1,
      'Bedsitter / Studio': 2,
      '1 Bedroom': 3,
      '2 Bedroom': 4,
      '3 Bedroom': 5,
      '4 Bedroom+': 6,
      'Maisonette / Townhouse': 7,
      'Bungalow': 8,
      'Penthouse': 9,
      'BnB / Airbnb (Daily Stay)': 10,
      'Studio BnB (Short-Stay)': 11,
      '1 & 2 Bedroom BnB (Furnished)': 12,
      'Luxury Villa / Vacation Stay': 13,
      'Serviced / Furnished': 14,
      'Hostels / Shared': 15
    };

    if (this.sortBy === 'price_asc') {
      result.sort((a, b) => a.rentKes - b.rentKes);
    } else if (this.sortBy === 'price_desc') {
      result.sort((a, b) => b.rentKes - a.rentKes);
    } else if (this.sortBy === 'featured') {
      result.sort((a, b) => (b.isTopAd ? 1 : 0) - (a.isTopAd ? 1 : 0));
    } else {
      // Default: Arrange from single rooms ascending up to BnBs
      result.sort((a, b) => {
        const rankA = CATEGORY_ORDER_RANK[a.category] || 99;
        const rankB = CATEGORY_ORDER_RANK[b.category] || 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.rentKes - b.rentKes;
      });
    }

    this.filteredProperties = result;
    this.renderListingsSummary();
    this.renderCardsGrid();
    this.renderSplitView();
    this.renderPagination();

    // Update map pins
    window.mapController.renderPins(result);
  }

  renderListingsSummary() {
    const summaryEl = document.getElementById('listings-count-summary');
    if (!summaryEl) return;

    const total = this.filteredProperties.length;
    let label = `${total} Rental Listings`;
    if (this.searchQuery) {
      label += ` for <span class="highlight">"${this.searchQuery}"</span>`;
    } else if (this.activeSuburb !== 'all') {
      label += ` in <span class="highlight">${this.activeSuburb}</span>`;
    } else if (this.activeCorridor !== 'all') {
      const corridorObj = NAIROBI_REGIONS.find(r => r.corridorId === this.activeCorridor);
      label += ` in <span class="highlight">${corridorObj?.corridorName || ''}</span>`;
    } else {
      label += ` across <span class="highlight">Nairobi & Environs</span>`;
    }

    summaryEl.innerHTML = label;
  }

  generateCardHtml(p) {
    const isFav = this.favorites.has(p.id);
    const photoCount = p.photoCount || p.media.length || 1;
    const thumbnail = p.media[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
    const isBnb = p.isBnb || p.category.includes('BnB') || p.category.includes('Airbnb') || p.category.includes('Villa') || p.rentPeriod === 'night';
    const isHourly = p.rentPeriod === 'hour' || p.category.includes('Boardroom');
    const isDaily = p.rentPeriod === 'day' || p.category.includes('Conference') || p.category.includes('Event') || p.category.includes('Hall');
    let pricePeriod = '/ month';
    if (p.rentPeriod === 'hour' || isHourly) pricePeriod = '/ hour';
    else if (p.rentPeriod === 'day' || isDaily) pricePeriod = '/ day';
    else if (p.rentPeriod === 'night' || isBnb) pricePeriod = '/ night';
    const isTaken = p.isTaken || p.status === 'taken';
    const isAgency = p.managedBy === 'agency' || p.landlord?.isAgency;
    
    return `
      <div class="property-card ${isTaken ? 'property-card-taken' : ''}" data-id="${p.id}">
        <div class="card-media-wrapper" onclick="app.openPropertyDetail('${p.id}')">
          <img src="${thumbnail}" alt="${p.title}" loading="lazy" style="${isTaken ? 'filter: grayscale(50%) opacity(0.8);' : ''}">
          
          <div class="card-badges-top">
            ${isTaken ? '<span class="badge-taken" style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 0.75rem;"><i class="fas fa-ban"></i> TAKEN / OCCUPIED</span>' : ''}
            ${isBnb ? '<span class="badge-top-ad" style="background: #ff5a5f;"><i class="fas fa-bed"></i> BNB / AIRBNB</span>' : (p.isTopAd ? '<span class="badge-top-ad"><i class="fas fa-bolt"></i> TOP AD</span>' : '')}
            ${isAgency ? `<span class="badge-verified-landlord" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);"><i class="fas fa-building"></i> ${p.agencyName ? (p.agencyName.length > 18 ? p.agencyName.substring(0, 16) + '...' : p.agencyName) : 'AGENCY'}</span>` : (p.landlord?.isVerified ? '<span class="badge-verified-landlord"><i class="fas fa-shield-alt"></i> VERIFIED</span>' : '')}
          </div>

          <button class="btn-favorite-heart ${isFav ? 'active' : ''}" onclick="app.toggleFavorite('${p.id}', event)" title="Save to Favorites">
            <i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i>
          </button>

          <span class="card-watermark"><i class="fas fa-home"></i> KEJAMARKET VERIFIED</span>
          <span class="card-photo-count"><i class="fas fa-camera"></i> ${photoCount} Photos</span>
        </div>

        <div class="card-content">
          <div class="card-price-row">
            <div class="card-price" style="${isTaken ? 'color: #64748b;' : ''}">KSh ${p.rentKes.toLocaleString()} <span class="period">${pricePeriod}</span></div>
            ${p.caretakerPhone ? '<span style="font-size:0.72rem; color:#b45309; background:#fef3c7; border:1px solid #fde68a; padding:1px 6px; border-radius:4px; font-weight:700;"><i class="fas fa-key"></i> Caretaker</span>' : ''}
          </div>

          <h3 class="card-title" onclick="app.openPropertyDetail('${p.id}')" title="${p.title}">
            ${isTaken ? '<span style="color: #dc2626; font-size: 0.8rem; font-weight: 800; margin-right: 4px;">[TAKEN]</span>' : ''}${p.title}
          </h3>

          <div class="card-location-row">
            <i class="fas fa-map-marker-alt" style="color: #00b53f;"></i>
            <span>${p.estateSuburb}, ${p.county}</span>
            <span class="time-posted">${p.postedTimeAgo || 'Today'}</span>
          </div>

          <div class="card-utility-tags">
            ${isBnb ? '<span class="utility-tag borehole"><i class="fas fa-wifi"></i> 100Mbps WiFi</span><span class="utility-tag tokens"><i class="fas fa-tv"></i> Netflix / Smart TV</span><span class="utility-tag tiles"><i class="fas fa-key"></i> Self Check-In</span>' : `
              <span class="utility-tag ${p.waterSupplyType.toLowerCase().includes('borehole') ? 'borehole' : 'council'}">
                <i class="fas fa-tint"></i> ${p.waterSupplyType}
              </span>
              <span class="utility-tag tokens">
                <i class="fas fa-bolt"></i> ${p.electricityMeterType}
              </span>
              ${p.amenities.hasTiles ? '<span class="utility-tag tiles"><i class="fas fa-border-all"></i> Tiles</span>' : ''}
            `}
          </div>

          <div class="card-action-buttons">
            ${isTaken ? `
              <button class="btn-card-call" style="background: #ef4444; color: white; opacity: 0.85;" onclick="app.showTakenToast(event)">
                <i class="fas fa-ban"></i> Taken
              </button>
              <button class="btn-card-chat" style="background: #94a3b8; color: white; opacity: 0.85;" onclick="app.showTakenToast(event)">
                <i class="fas fa-lock"></i> Taken
              </button>
            ` : `
              <button class="btn-card-call" onclick="app.revealLandlordPhone('${p.id}', this)">
                <i class="fas fa-phone-alt"></i> ${isAgency ? 'Call Agency' : (isBnb ? 'Call Host' : 'Call')}
              </button>
              <button class="btn-card-chat" onclick="app.openChatForProperty('${p.id}', event)">
                <i class="fas fa-comment-dots"></i> Chat
              </button>
            `}
            <button class="btn-card-map" onclick="app.focusPropertyOnMap('${p.id}', event)" title="View Pin on Map">
              <i class="fas fa-map-marked-alt"></i> Pin Map
            </button>
          </div>
        </div>
      </div>
    `;
  }

  focusPropertyOnMap(propertyId, event) {
    if (event) event.stopPropagation();
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.focusPropertyOnMap(propertyId));
      return;
    }
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.setViewMode('map');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    setTimeout(() => {
      if (window.mapController.fullMap) {
        window.mapController.fullMap.setView([p.latitude, p.longitude], 15, { animate: true });
      }
    }, 200);

    this.showToast(`Centered map on ${p.estateSuburb} (${p.title.substring(0, 25)}...)`, 'info');
  }

  renderCardsGrid() {
    const gridEl = document.getElementById('property-grid');
    if (!gridEl) return;

    if (this.filteredProperties.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state-box">
          <i class="fas fa-search-location"></i>
          <h3>No Properties Found</h3>
          <p>Try adjusting your search criteria, price range, or suburb filter.</p>
          <button class="btn-primary" onclick="app.resetFilters()"><i class="fas fa-redo"></i> Reset All Filters</button>
        </div>
      `;
      return;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredProperties.slice(start, start + this.pageSize);

    gridEl.innerHTML = pageItems.map(p => this.generateCardHtml(p)).join('');
  }

  renderSplitView() {
    const splitListEl = document.getElementById('split-property-list');
    if (!splitListEl) return;

    if (this.filteredProperties.length === 0) {
      splitListEl.innerHTML = `<div class="empty-state-box"><p>No rentals or BnBs match your criteria.</p></div>`;
      return;
    }

    splitListEl.innerHTML = this.filteredProperties.map(p => this.generateCardHtml(p)).join('');
  }

  renderPagination() {
    const paginationEl = document.getElementById('pagination-container');
    if (!paginationEl) return;

    const totalPages = Math.ceil(this.filteredProperties.length / this.pageSize);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let buttons = '';
    for (let i = 1; i <= totalPages; i++) {
      buttons += `<button class="btn-page ${i === this.currentPage ? 'active' : ''}" onclick="app.goToPage(${i})">${i}</button>`;
    }

    paginationEl.innerHTML = buttons;
  }

  goToPage(pageNumber) {
    this.currentPage = pageNumber;
    this.renderCardsGrid();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  revealLandlordPhone(propertyId, btnEl) {
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.revealLandlordPhone(propertyId, btnEl));
      return;
    }
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    if (btnEl) {
      btnEl.innerHTML = `<i class="fas fa-phone"></i> ${p.landlord.phone}`;
      btnEl.style.background = '#e6f8ec';
      btnEl.style.color = '#008e31';
      btnEl.style.borderColor = '#00b53f';
    }

    // Immediately open phone dialer app
    window.location.href = `tel:${p.landlord.phone}`;
  }

  callLandlordDirect(propertyId) {
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.callLandlordDirect(propertyId));
      return;
    }
    const p = this.properties.find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    this.unlockDetailContact(p);
    // Immediately open phone dialer app
    window.location.href = `tel:${p.landlord.phone}`;
  }

  openPropertyDetail(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.selectedPropertyForDetail = p;
    const isBnb = p.isBnb || p.category.includes('BnB') || p.category.includes('Airbnb') || p.category.includes('Villa') || p.rentPeriod === 'night';
    const isHourly = p.rentPeriod === 'hour' || p.category.includes('Boardroom');
    const isDaily = p.rentPeriod === 'day' || p.category.includes('Conference') || p.category.includes('Event') || p.category.includes('Hall');
    let pricePeriod = '/ month';
    if (p.rentPeriod === 'hour' || isHourly) pricePeriod = '/ hour';
    else if (p.rentPeriod === 'day' || isDaily) pricePeriod = '/ day';
    else if (p.rentPeriod === 'night' || isBnb) pricePeriod = '/ night';
    const isTaken = p.isTaken || p.status === 'taken';

    // Taken Status Banner & Control Bar
    const takenBanner = document.getElementById('detail-taken-banner');
    const statusPill = document.getElementById('detail-status-pill');
    const toggleBtn = document.getElementById('btn-toggle-taken-status');
    const landlordStatusBar = document.getElementById('detail-landlord-status-bar');

    // Check if the current user is an Admin or the Landlord owner of this listing
    const currentUser = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function')
      ? window.kejaAuth.getSession()
      : null;

    const isOwnerOrAdmin = !!(currentUser && (
      currentUser.role === 'admin' ||
      (currentUser.id && p.landlord && currentUser.id === p.landlord.id) ||
      (currentUser.phone && (
        (p.landlord && (currentUser.phone === p.landlord.phone || currentUser.phone === p.landlord.whatsapp)) ||
        currentUser.phone === p.landlordPhone
      ))
    ));

    // Show status toggle control ONLY to verified owner or admin
    if (landlordStatusBar) {
      landlordStatusBar.style.display = isOwnerOrAdmin ? 'flex' : 'none';
    }

    if (takenBanner) {
      takenBanner.style.display = isTaken ? 'flex' : 'none';
    }

    if (statusPill) {
      if (isTaken) {
        statusPill.textContent = 'TAKEN / OCCUPIED';
        statusPill.style.background = '#fef2f2';
        statusPill.style.color = '#991b1b';
      } else {
        statusPill.textContent = 'VACANT / AVAILABLE';
        statusPill.style.background = '#dcfce7';
        statusPill.style.color = '#166534';
      }
    }

    if (toggleBtn) {
      toggleBtn.innerHTML = isTaken
        ? '<i class="fas fa-check-circle"></i> Mark as Vacant / Available'
        : '<i class="fas fa-tag"></i> Mark as Taken / Occupied';
      toggleBtn.style.background = isTaken ? '#00b53f' : '';
      toggleBtn.style.color = isTaken ? '#ffffff' : '';
    }

    // Set modal title & price
    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-price').textContent = `KSh ${p.rentKes.toLocaleString()} ${pricePeriod}`;
    document.getElementById('detail-modal-deposit').textContent = isBnb 
      ? `Short-Stay / Daily Booking (No Deposit Required)`
      : `Deposit: KSh ${p.depositKes ? p.depositKes.toLocaleString() : p.rentKes.toLocaleString()}`;
    // Location & GPS Gating
    const isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    const locationEl = document.getElementById('detail-modal-location');
    const gpsBadge = document.getElementById('detail-gps-badge');

    if (isLoggedIn) {
      if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.exactLocation || (p.estateSuburb + ', ' + p.county)}`;
      if (gpsBadge) gpsBadge.textContent = `GPS: ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`;
    } else {
      if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.estateSuburb}, ${p.county} <span style="font-size:0.75rem; color:#64748b; margin-left:6px;"><i class="fas fa-lock"></i> Exact landmark & pin protected</span>`;
      if (gpsBadge) gpsBadge.textContent = 'GPS: Protected 🔒';
    }
    document.getElementById('detail-modal-desc').textContent = p.description;

    // Specs
    document.getElementById('spec-category').textContent = p.category;
    document.getElementById('spec-bedrooms').textContent = p.bedrooms === 0 ? (isBnb ? 'Studio BnB' : 'Bedsitter') : `${p.bedrooms} Bedroom`;
    document.getElementById('spec-water').textContent = p.waterSupplyType;
    document.getElementById('spec-electricity').textContent = p.electricityMeterType;
    const isAgencyListing = p.managedBy === 'agency' || p.landlord?.isAgency;
    const specSource = document.getElementById('spec-source');
    if (specSource) {
      specSource.innerHTML = isAgencyListing
        ? `<span style="color:#7c3aed;font-weight:700;"><i class="fas fa-building"></i> Real Estate Agency</span>`
        : `<span style="color:#00b53f;font-weight:700;"><i class="fas fa-user-check"></i> Direct Landlord</span>`;
    }
    document.getElementById('spec-verified').innerHTML = p.landlord.isVerified 
      ? `<span style="color:#1976d2;"><i class="fas fa-check-circle"></i> ${isBnb ? 'Superhost' : (isAgencyListing ? 'Verified Agency' : 'Verified Landlord')}</span>` 
      : '<span style="color:#64748b;">Direct Listing</span>';

    // Gallery
    this.currentPhotoIndex = 0;
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) mainImg.src = p.media[0]?.url || '';
    this.updatePhotoCounter();
    this.setupGallerySwipe();

    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => {
        if (idx === 0) {
          // Always show first photo free
          return `<div class="detail-thumb active" onclick="app.selectDetailPhoto('${m.url}', this, 0)">
            <img src="${m.url}" alt="${m.caption || 'Photo'}">
          </div>`;
        }
        if (isLoggedIn) {
          // Logged-in: show all photos normally
          return `<div class="detail-thumb" onclick="app.selectDetailPhoto('${m.url}', this, ${idx})">
            <img src="${m.url}" alt="${m.caption || 'Photo'}">
          </div>`;
        }
        // Locked: blurred thumb with lock icon
        return `<div class="detail-thumb detail-thumb-locked" onclick="kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('${p.id}'))" title="Sign in to view all photos">
          <img src="${m.url}" alt="Locked photo" style="filter:blur(6px) brightness(0.55); pointer-events:none;">
          <span class="thumb-lock-icon"><i class="fas fa-lock"></i></span>
        </div>`;
      }).join('');

      // If not logged in and there are extra photos, show a sign-in nudge strip
      if (!isLoggedIn && p.media.length > 1) {
        const extraCount = p.media.length - 1;
        thumbsContainer.insertAdjacentHTML('afterend', `
          <div id="detail-photos-lock-banner" onclick="kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('${p.id}'))"
            style="display:flex;align-items:center;gap:10px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:8px;padding:10px 14px;margin-top:8px;cursor:pointer;font-size:0.85rem;color:#475569;">
            <i class="fas fa-images" style="font-size:1.3rem;color:#00b53f;"></i>
            <span><strong>+${extraCount} more photo${extraCount > 1 ? 's' : ''}</strong> — <span style="color:#00b53f;font-weight:700;">Sign in free</span> to view all</span>
            <i class="fas fa-chevron-right" style="margin-left:auto;color:#94a3b8;"></i>
          </div>
        `);
      }
    }

    // Video Tours Walkthrough
    const videosContainer = document.getElementById('detail-videos-container');
    if (videosContainer) {
      if (p.videos && Array.isArray(p.videos) && p.videos.length > 0) {
        videosContainer.style.display = 'block';
        videosContainer.innerHTML = `
          <div style="background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #6b21a8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-video" style="color: #9333ea;"></i> Verified Video Walkthrough (${p.videos.length} clip${p.videos.length > 1 ? 's' : ''})
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              ${p.videos.map((v, i) => `
                <div style="flex: 1; min-width: 240px; border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <video src="${v.url || v}" controls playsinline style="width: 100%; max-height: 220px; object-fit: contain; display: block;"></video>
                  <div style="padding: 6px 10px; background: #1e1b4b; color: #c084fc; font-size: 0.75rem; font-weight: 600; display: flex; justify-content: space-between;">
                    <span><i class="fas fa-play-circle"></i> Video Tour #${i + 1}</span>
                    <span>${v.duration ? `⏱ ${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}` : 'Max 1m 30s'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        videosContainer.style.display = 'none';
        videosContainer.innerHTML = '';
      }
    }

    // Amenities List
    const amenitiesContainer = document.getElementById('detail-amenities-list');
    if (amenitiesContainer) {
      const items = [];
      if (isBnb) {
        items.push('<span><i class="fas fa-wifi" style="color:#00b53f;"></i> High-Speed Fiber WiFi (100Mbps)</span>');
        items.push('<span><i class="fas fa-tv" style="color:#00b53f;"></i> Smart 4K TV with Netflix & YouTube</span>');
        items.push('<span><i class="fas fa-key" style="color:#00b53f;"></i> Keyless Smart Lock Self Check-in</span>');
        items.push('<span><i class="fas fa-utensils" style="color:#00b53f;"></i> Fully Equipped Kitchen & Microwave</span>');
        items.push('<span><i class="fas fa-coffee" style="color:#00b53f;"></i> Coffee Maker & Electric Kettle</span>');
        items.push('<span><i class="fas fa-broom" style="color:#00b53f;"></i> Housekeeping & Fresh Linens</span>');
      }
      if (p.amenities.hasBalcony) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Private Balcony with View</span>');
      if (p.amenities.hasParking) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Free Dedicated Parking</span>');
      if (p.amenities.hasElectricFence) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Electric Perimeter Fence</span>');
      if (p.amenities.hasCctv) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> 24/7 CCTV Surveillance</span>');
      if (p.amenities.hasInternet && !isBnb) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> High-Speed Fiber WiFi</span>');
      if (p.amenities.hasTiles) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Ceramic Floor Tiles</span>');
      if (p.amenities.isMasterEnsuite) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Master Bedroom Ensuite</span>');
      if (p.amenities.hasGym) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Equipped Gym</span>');
      if (p.amenities.hasSwimmingPool) items.push('<span><i class="fas fa-check" style="color:#00b53f;"></i> Heated Swimming Pool</span>');

      amenitiesContainer.innerHTML = items.length > 0 
        ? items.join('') 
        : '<span style="color:#64748b;">Standard amenities available</span>';
    }

    // Management Badge
    const mgmtBadge = document.getElementById('detail-management-badge');
    if (mgmtBadge) {
      if (isAgencyListing) {
        mgmtBadge.textContent = '🏢 Managed by ' + (p.agencyName || p.landlord.name || 'Agency');
        mgmtBadge.style.background = '#f3e8ff';
        mgmtBadge.style.color = '#7c3aed';
      } else {
        mgmtBadge.textContent = '👤 Direct Landlord';
        mgmtBadge.style.background = '#dcfce7';
        mgmtBadge.style.color = '#15803d';
      }
    }

    // Landlord & Contacts
    const phoneDisplay = document.getElementById('detail-landlord-phone-display');
    const landlordName = document.getElementById('detail-landlord-name');
    const landlordSince = document.getElementById('detail-landlord-since');
    const callBtn = document.getElementById('detail-btn-call');
    const chatBtn = document.getElementById('detail-btn-inbox-chat');

    const contactName = isAgencyListing ? (p.agencyName || p.landlord.name) : p.landlord.name;

    if (isLoggedIn) {
      // Full access
      if (landlordName) landlordName.textContent = contactName;
      if (landlordSince) landlordSince.textContent = `Member since ${p.landlord.memberSince}`;
      if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i>${p.landlord.phone}`;
      if (callBtn) {
        callBtn.href = `tel:${p.landlord.phone}`;
        callBtn.removeAttribute('onclick');
        callBtn.style.opacity = '1';
        callBtn.style.pointerEvents = 'auto';
        callBtn.innerHTML = `<i class="fas fa-phone-alt"></i> Call ${isAgencyListing ? 'Agency' : 'Landlord'}`;
      }
      if (chatBtn) {
        chatBtn.onclick = () => app.openChatForCurrentProperty();
        chatBtn.style.opacity = '1';
        chatBtn.style.pointerEvents = 'auto';
        chatBtn.innerHTML = `<i class="fas fa-comment-dots"></i> Message ${isAgencyListing ? 'Agency' : 'Landlord'}`;
      }
    } else {
      // Protected
      if (landlordName) landlordName.innerHTML = `<i class="fas fa-user-shield" style="color:#00b53f;margin-right:6px;"></i><span style="color:#64748b;">${isAgencyListing ? 'Agency' : 'Landlord'} Details Protected</span>`;
      if (landlordSince) landlordSince.textContent = 'Sign in or create free account to view contact details';
      if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-lock" style="color:#94a3b8;margin-right:5px;"></i><span style="color:#94a3b8;letter-spacing:1px;">+254 7•• ••• ••• (Sign in to view)</span>`;
      if (callBtn) {
        callBtn.href = '#';
        callBtn.setAttribute('onclick', `event.preventDefault(); app.callLandlordDirect('${p.id}'); return false;`);
        callBtn.style.opacity = '0.9';
        callBtn.innerHTML = `<i class="fas fa-lock"></i> Sign In to Call ${isAgencyListing ? 'Agency' : 'Landlord'}`;
      }
      if (chatBtn) {
        chatBtn.onclick = (e) => { e.preventDefault(); kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(p.id)); };
        chatBtn.style.opacity = '0.85';
        chatBtn.innerHTML = `<i class="fas fa-lock"></i> Sign In to Message`;
      }
    }

    // Caretaker Card Population
    const caretakerCard = document.getElementById('detail-caretaker-card');
    const caretakerNameEl = document.getElementById('detail-caretaker-name');
    const caretakerCallBtn = document.getElementById('detail-btn-caretaker-call');

    if (caretakerCard) {
      if (p.caretakerPhone || p.caretakerName) {
        caretakerCard.style.display = 'block';
        if (caretakerNameEl) caretakerNameEl.textContent = p.caretakerName || 'Building Caretaker';
        if (caretakerCallBtn) {
          if (isLoggedIn) {
            caretakerCallBtn.href = `tel:${p.caretakerPhone || ''}`;
            caretakerCallBtn.removeAttribute('onclick');
            caretakerCallBtn.innerHTML = `<i class="fas fa-phone-alt"></i> Call Caretaker (${p.caretakerPhone || ''})`;
          } else {
            caretakerCallBtn.href = '#';
            caretakerCallBtn.setAttribute('onclick', `event.preventDefault(); kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('${p.id}')); return false;`);
            caretakerCallBtn.innerHTML = `<i class="fas fa-lock"></i> Sign In to Call Caretaker`;
          }
        }
      } else {
        caretakerCard.style.display = 'none';
      }
    }

    // Google Maps Link + Map visibility — gated behind login
    const directionsBtn = document.getElementById('detail-btn-directions');
    const mapSection = document.getElementById('detail-map-section');
    const gpsLockOverlay = document.getElementById('detail-map-lock-overlay');

    if (isLoggedIn) {
      if (directionsBtn) {
        directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
        directionsBtn.style.opacity = '1';
        directionsBtn.style.pointerEvents = 'auto';
      }
      if (gpsLockOverlay) gpsLockOverlay.style.display = 'none';
    } else {
      if (directionsBtn) {
        directionsBtn.href = '#';
        directionsBtn.setAttribute('onclick', `event.preventDefault(); kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('${p.id}')); return false;`);
        directionsBtn.style.opacity = '0.5';
      }
      if (gpsLockOverlay) gpsLockOverlay.style.display = 'flex';
    }

    // Social Live Comments, Tenant Critiques & Discussion
    const commentsContainer = document.getElementById('detail-comments-container');
    if (commentsContainer && window.commentManager) {
      window.commentManager.renderCommentsSection(p.id, commentsContainer);
    }

    // Load verified services to show in property detail
    this.loadPropertyDetailServices();

    this.openModal('modal-property-detail');

    // Initialize or refresh Detail Map Canvas
    setTimeout(() => {
      this.initDetailMap(p);
    }, 250);
  }

  initDetailMap(property) {
    const mapEl = document.getElementById('detail-property-map');
    if (!mapEl) return;

    if (!this.detailMap) {
      this.detailMap = L.map('detail-property-map').setView([property.latitude, property.longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.detailMap);

      this.detailMarker = L.marker([property.latitude, property.longitude]).addTo(this.detailMap)
        .bindPopup(`<b>${property.title}</b><br><span style="color:#00b53f;font-weight:bold;">KSh ${property.rentKes.toLocaleString()}</span><br>${property.estateSuburb}`)
        .openPopup();
    } else {
      this.detailMap.invalidateSize();
      this.detailMap.setView([property.latitude, property.longitude], 15);
      if (this.detailMarker) {
        this.detailMarker.setLatLng([property.latitude, property.longitude])
          .bindPopup(`<b>${property.title}</b><br><span style="color:#00b53f;font-weight:bold;">KSh ${property.rentKes.toLocaleString()}</span><br>${property.estateSuburb}`)
          .openPopup();
      }
    }
  }

  selectDetailPhoto(url, thumbEl, index) {
    if (typeof index === 'number') {
      this.currentPhotoIndex = index;
    } else if (this.selectedPropertyForDetail && this.selectedPropertyForDetail.media) {
      const foundIdx = this.selectedPropertyForDetail.media.findIndex(m => m.url === url);
      if (foundIdx !== -1) this.currentPhotoIndex = foundIdx;
    }
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) mainImg.src = url;

    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) {
      thumbEl.classList.add('active');
      thumbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    this.updatePhotoCounter();
  }

  prevDetailPhoto(event) {
    if (event) event.stopPropagation();
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

    const isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    if (!isLoggedIn && p.media.length > 1) {
      window.kejaAuth.requireTenantAuth(() => this.prevDetailPhoto());
      return;
    }

    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + p.media.length) % p.media.length;
    this.showPhotoAtIndex(this.currentPhotoIndex);
  }

  nextDetailPhoto(event) {
    if (event) event.stopPropagation();
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

    const isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    if (!isLoggedIn && p.media.length > 1) {
      window.kejaAuth.requireTenantAuth(() => this.nextDetailPhoto());
      return;
    }

    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % p.media.length;
    this.showPhotoAtIndex(this.currentPhotoIndex);
  }

  showPhotoAtIndex(index) {
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || !p.media[index]) return;

    this.currentPhotoIndex = index;
    const photo = p.media[index];
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) {
      mainImg.style.opacity = '0.7';
      mainImg.src = photo.url;
      setTimeout(() => { if (mainImg) mainImg.style.opacity = '1'; }, 80);
    }

    // Update active thumb
    const thumbs = document.querySelectorAll('#detail-thumbs-container .detail-thumb');
    thumbs.forEach((t, idx) => {
      if (idx === index) {
        t.classList.add('active');
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        t.classList.remove('active');
      }
    });

    this.updatePhotoCounter();

    // Update Lightbox if open
    const lightboxModal = document.getElementById('modal-lightbox');
    if (lightboxModal && lightboxModal.classList.contains('open')) {
      const lbImg = document.getElementById('lightbox-img');
      const lbCounter = document.getElementById('lightbox-counter');
      const lbCaption = document.getElementById('lightbox-caption');
      if (lbImg) lbImg.src = photo.url;
      if (lbCounter) lbCounter.textContent = `${index + 1} / ${p.media.length}`;
      if (lbCaption) lbCaption.textContent = photo.caption || p.title;
    }
  }

  updatePhotoCounter() {
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media) return;
    const idxEl = document.getElementById('detail-photo-index');
    const totEl = document.getElementById('detail-photo-total');
    if (idxEl) idxEl.textContent = (this.currentPhotoIndex || 0) + 1;
    if (totEl) totEl.textContent = p.media.length;
  }

  openLightbox(event) {
    if (event) event.stopPropagation();
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length === 0) return;

    const idx = this.currentPhotoIndex || 0;
    const photo = p.media[idx] || p.media[0];
    const lbImg = document.getElementById('lightbox-img');
    const lbCounter = document.getElementById('lightbox-counter');
    const lbCaption = document.getElementById('lightbox-caption');

    if (lbImg) lbImg.src = photo.url;
    if (lbCounter) lbCounter.textContent = `${idx + 1} / ${p.media.length}`;
    if (lbCaption) lbCaption.textContent = photo.caption || p.title;

    this.openModal('modal-lightbox');
  }

  setupGallerySwipe() {
    const container = document.getElementById('detail-gallery-main-container');
    if (!container || container.dataset.swipeBound) return;
    container.dataset.swipeBound = 'true';

    let startX = 0;
    let endX = 0;

    container.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].screenX;
      const diff = endX - startX;
      if (Math.abs(diff) > 45) {
        if (diff < 0) {
          this.nextDetailPhoto();
        } else {
          this.prevDetailPhoto();
        }
      }
    }, { passive: true });
  }

  // Called after login to unlock contact details in the open detail modal
  unlockDetailContact(p) {
    if (!p) p = this.selectedPropertyForDetail;
    if (!p) return;

    const landlordName = document.getElementById('detail-landlord-name');
    const landlordSince = document.getElementById('detail-landlord-since');
    const locationEl = document.getElementById('detail-modal-location');
    const gpsBadge = document.getElementById('detail-gps-badge');
    const phoneDisplay = document.getElementById('detail-landlord-phone-display');
    const callBtn = document.getElementById('detail-btn-call');
    const chatBtn = document.getElementById('detail-btn-inbox-chat');
    const directionsBtn = document.getElementById('detail-btn-directions');
    const gpsLockOverlay = document.getElementById('detail-map-lock-overlay');

    if (landlordName) landlordName.textContent = p.landlord.name;
    if (landlordSince) landlordSince.textContent = `Member since ${p.landlord.memberSince}`;
    if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.exactLocation || (p.estateSuburb + ', ' + p.county)}`;
    if (gpsBadge) gpsBadge.textContent = `GPS: ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`;
    if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i>${p.landlord.phone}`;
    if (callBtn) {
      callBtn.href = `tel:${p.landlord.phone}`;
      callBtn.removeAttribute('onclick');
      callBtn.style.opacity = '1';
      callBtn.style.pointerEvents = 'auto';
      callBtn.innerHTML = '<i class="fas fa-phone-alt"></i> Call Landlord';
    }
    if (chatBtn) {
      chatBtn.onclick = () => app.openChatForCurrentProperty();
      chatBtn.style.opacity = '1';
      chatBtn.style.pointerEvents = 'auto';
      chatBtn.innerHTML = '<i class="fas fa-comment-dots"></i> Message Landlord';
    }
    if (directionsBtn) {
      directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
      directionsBtn.removeAttribute('onclick');
      directionsBtn.style.opacity = '1';
      directionsBtn.style.pointerEvents = 'auto';
    }
    if (gpsLockOverlay) gpsLockOverlay.style.display = 'none';
  }

  unlockDetailPhotos(propertyId) {
    const p = propertyId
      ? this.properties.find(x => x.id === propertyId)
      : this.selectedPropertyForDetail;
    if (!p) return;

    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => `
        <div class="detail-thumb ${idx === (this.currentPhotoIndex || 0) ? 'active' : ''}" onclick="app.selectDetailPhoto('${m.url}', this, ${idx})">
          <img src="${m.url}" alt="${m.caption || 'Photo'}">
        </div>
      `).join('');
    }
    // Remove the lock banner if present
    const lockBanner = document.getElementById('detail-photos-lock-banner');
    if (lockBanner) lockBanner.remove();

    this.updatePhotoCounter();

    // Also unlock contact section
    this.unlockDetailContact(p);
  }


  addProperty(newProperty) {
    this.properties.unshift(newProperty);
    this.applyFilters();
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      if (modalId === 'modal-post-ad') {
        window.landlordManager.initPostMap();
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
    // Stop chat polling when messages modal closes
    if (modalId === 'modal-messages') {
      this.stopChatPolling();
    }
  }

  toggleMobileFilters() {
    const sidebar = document.getElementById('sidebar-filters');
    const closeBtn = document.querySelector('.btn-close-mobile-filter');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
      if (closeBtn) {
        closeBtn.style.display = sidebar.classList.contains('mobile-open') ? 'inline-block' : 'none';
      }
    }
  }

  cycleMobileView() {
    const views = ['grid', 'split', 'map'];
    const nextIdx = (views.indexOf(this.currentViewMode) + 1) % views.length;
    this.setViewMode(views[nextIdx]);
    const icon = document.getElementById('mobile-view-icon');
    if (icon) {
      icon.className = nextIdx === 0 ? 'fas fa-th-large' : nextIdx === 1 ? 'fas fa-columns' : 'fas fa-map-marked-alt';
    }
  }

  /* ─────────────────────────────────────────
     IN-APP CHAT & INBOX MESSAGING SYSTEM
  ───────────────────────────────────────── */
  openChatForProperty(propertyId, event) {
    if (event) event.stopPropagation();

    // Require login before opening chat
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.openChatForProperty(propertyId));
      return;
    }

    const prop = this.properties.find(p => p.id === propertyId);
    if (!prop) return;

    this.activeChatProperty = prop;
    this.isAdminChat = false;

    // Restore landlord quick replies
    const quickReplies = document.getElementById('chat-quick-replies');
    if (quickReplies) {
      quickReplies.innerHTML = `
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Is this house still available?')">Is this available?</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Can I schedule a viewing today?')">📅 Book viewing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Is borehole water continuous 24/7?')">💧 Water 24/7?</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('What is the deposit and token policy?')">💰 Deposit policy</button>
      `;
    }

    const input = document.getElementById('chat-message-input');
    if (input) input.placeholder = 'Type your message to the landlord...';

    // Update Chat Header
    const avatarEl = document.getElementById('chat-landlord-avatar');
    const titleEl = document.getElementById('chat-landlord-title');
    const subEl = document.getElementById('chat-property-subtitle');
    const banner = document.getElementById('chat-property-banner');
    const bannerTitle = document.getElementById('chat-banner-title');
    const bannerPrice = document.getElementById('chat-banner-price');

    if (avatarEl) {
      avatarEl.textContent = (prop.landlord.name || 'Landlord').slice(0, 2).toUpperCase();
    }
    if (titleEl) {
      titleEl.textContent = prop.landlord.name;
    }
    if (subEl) {
      subEl.textContent = `${prop.estateSuburb} · Direct Landlord Chat`;
    }
    if (banner && bannerTitle && bannerPrice) {
      banner.style.display = 'flex';
      bannerTitle.textContent = prop.title.length > 35 ? prop.title.substring(0, 35) + '...' : prop.title;
      bannerPrice.textContent = `KSh ${prop.rentKes.toLocaleString()}/${prop.rentPeriod || 'mo'}`;
    }

    this.renderChatMessages();
    this.openModal('modal-messages');
    // Start polling for new messages from server
    this.startChatPolling(prop.id);

    // Auto-focus message input
    setTimeout(() => {
      const input = document.getElementById('chat-message-input');
      if (input) input.focus();
    }, 300);
  }

  openAdminChat() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!session) {
      // Removed toast - cleaner UX, just open auth
      if (window.kejaAuth) {
        window.kejaAuth.requireTenantAuth(() => {
          this.openAdminChat();
        });
      }
      return;
    }

    this.isAdminChat = true;
    this.activeChatProperty = null;

    const avatarEl = document.getElementById('chat-landlord-avatar');
    const titleEl = document.getElementById('chat-landlord-title');
    const subEl = document.getElementById('chat-property-subtitle');
    const banner = document.getElementById('chat-property-banner');
    const input = document.getElementById('chat-message-input');
    const quickReplies = document.getElementById('chat-quick-replies');

    if (avatarEl) avatarEl.innerHTML = '🛡️';
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-headset" style="color: #00b53f; margin-right: 6px;"></i> KejaMarket Admin Support';
    if (subEl) subEl.textContent = 'Reach out directly to Admin · Prompt assistance & replies';
    if (banner) banner.style.display = 'none';
    if (input) input.placeholder = 'Type your message to KejaMarket Admin...';

    if (quickReplies) {
      quickReplies.innerHTML = `
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Need help listing my property')">🏠 Help listing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Payment or M-Pesa verification inquiry')">💰 Payment issue</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Report a fake or suspicious listing')">⚠️ Report listing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('General inquiry regarding KejaMarket')">💬 General inquiry</button>
      `;
    }

    this.renderChatMessages();
    this.openModal('modal-messages');

    setTimeout(() => {
      if (input) input.focus();
    }, 300);
  }

  openChatForCurrentProperty() {
    // Require login before opening chat
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.openChatForCurrentProperty());
      return;
    }

    if (this.selectedPropertyForDetail) {
      this.closeModal('modal-property-detail');
      this.openChatForProperty(this.selectedPropertyForDetail.id);
    } else {
      this.openAdminChat();
    }
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

    if (this.isAdminChat) {
      const adminMsgs = this.chatMessages.filter(m => m.isAdminMessage === true);
      if (!adminMsgs || adminMsgs.length === 0) {
        const userName = session && session.name ? session.name.split(' ')[0] : 'there';
        container.innerHTML = `
          <div style="text-align: center; padding: 24px 16px; color: #64748b;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto; font-size: 1.4rem;">
              🛡️
            </div>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">Reach out to KejaMarket Admin</div>
            <div style="font-size: 0.82rem; color: #64748b; max-width: 360px; margin: 0 auto; line-height: 1.5;">
              Hello ${userName}! Send a message directly to the KejaMarket administrative team for support with listing your house, payment confirmation, reporting fake listings, or general assistance.
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = adminMsgs.map(m => {
        const isMe = m.senderId === (session ? session.id : 'me') || m.isSenderMe;
        const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

        return `
          <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 4px;">
            <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 2px; padding: 0 4px;">
              ${isMe ? 'You' : (m.senderName || 'KejaMarket Admin')} · ${timeStr}
            </div>
            <div style="max-width: 80%; padding: 10px 14px; border-radius: ${isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px'}; background: ${isMe ? '#00b53f' : '#ffffff'}; color: ${isMe ? '#ffffff' : '#1e293b'}; font-size: 0.88rem; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: ${isMe ? 'none' : '1px solid #e2e8f0'}; word-break: break-word;">
              ${m.text}
            </div>
          </div>
        `;
      }).join('');

      container.scrollTop = container.scrollHeight;
      return;
    }

    const propId = this.activeChatProperty ? this.activeChatProperty.id : null;
    let msgs = this.chatMessages;
    if (propId) {
      msgs = this.chatMessages.filter(m => m.propertyId === propId && !m.isAdminMessage);
    }

    if (!msgs || msgs.length === 0) {
      const landlordName = this.activeChatProperty ? this.activeChatProperty.landlord.name : 'Landlord';
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: #64748b;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto; font-size: 1.4rem;">
            <i class="fas fa-comment-dots"></i>
          </div>
          <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">Start a direct chat with ${landlordName}</div>
          <div style="font-size: 0.8rem; color: #64748b; max-width: 320px; margin: 0 auto;">Ask about house availability, booking viewings, deposit policies, or water supply.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = msgs.map(m => {
      const isMe = m.senderId === (session ? session.id : 'me') || m.isSenderMe;
      const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

      return `
        <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 4px;">
          <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 2px; padding: 0 4px;">
            ${isMe ? 'You' : m.senderName} · ${timeStr}
          </div>
          <div style="max-width: 80%; padding: 10px 14px; border-radius: ${isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px'}; background: ${isMe ? '#00b53f' : '#ffffff'}; color: ${isMe ? '#ffffff' : '#1e293b'}; font-size: 0.88rem; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: ${isMe ? 'none' : '1px solid #e2e8f0'}; word-break: break-word;">
            ${m.text}
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  sendQuickReply(text) {
    const input = document.getElementById('chat-message-input');
    if (input) {
      input.value = text;
      this.sendChatMessage(text);
      input.value = '';
    }
  }

  handleChatMessageSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    this.sendChatMessage(text);
    input.value = '';
  }

  async sendChatMessage(text) {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const prop = this.activeChatProperty;
    const isAdminChat = this.isAdminChat || !prop;

    const newMsg = {
      id: 'msg-' + Date.now(),
      isAdminMessage: isAdminChat,
      propertyId: prop ? prop.id : null,
      propertyTitle: prop ? prop.title : 'Admin Inquiry',
      estateSuburb: prop ? prop.estateSuburb : 'Nairobi',
      recipientId: prop ? prop.landlord.id : 'usr-admin-01',
      recipientName: prop ? prop.landlord.name : 'KejaMarket Admin',
      senderId: session ? session.id : 'me',
      senderName: session ? session.name : 'User',
      senderPhone: session ? session.phone : '',
      isSenderMe: true,
      text: text,
      createdAt: new Date().toISOString()
    };

    this.chatMessages.push(newMsg);
    this.saveChatMessages();
    this.renderChatMessages();

    // Post to backend
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.kejaAuth && window.kejaAuth.getToken()) {
        headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
      }
      await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(newMsg)
      });
    } catch (err) {
      console.warn('Message offline sync');
    }

    if (isAdminChat) {
      // No auto-reply — admin responds manually through the admin portal
      this.showToast('🛡️ Message sent to KejaMarket Admin. We will respond via SMS shortly.', 'success');
    } else if (prop) {
      // No auto-reply — landlord replies manually through their portal
      this.showToast(`📨 Message sent to ${prop.landlord?.name || 'landlord'}. They will reply shortly.`, 'info');
    }
  }

  // simulateLandlordReply removed — landlords reply manually

  loadChatMessages() {
    // Load from localStorage as cache first
    const saved = localStorage.getItem('kejamarket_chat_messages');
    if (saved) {
      try {
        this.chatMessages = JSON.parse(saved);
      } catch (e) {
        this.chatMessages = [];
      }
    } else {
      this.chatMessages = [];
    }
  }

  saveChatMessages() {
    localStorage.setItem('kejamarket_chat_messages', JSON.stringify(this.chatMessages.slice(-100)));
  }

  // Poll server for new messages every 5 seconds when chat is open
  startChatPolling(propertyId) {
    this.stopChatPolling();
    this._chatPollPropertyId = propertyId;
    this._chatPollSince = new Date().toISOString();

    this._chatPollInterval = setInterval(async () => {
      try {
        const headers = {};
        if (window.kejaAuth && window.kejaAuth.getToken()) {
          headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
        }
        const pid = this._chatPollPropertyId;
        const since = encodeURIComponent(this._chatPollSince);
        const url = pid
          ? `/api/messages?propertyId=${encodeURIComponent(pid)}&since=${since}`
          : `/api/messages?since=${since}`;

        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          this._chatPollSince = data.serverTime || new Date().toISOString();

          data.messages.forEach(msg => {
            const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
            const myId = session ? session.id : null;
            // Don't add messages we already sent
            if (msg.sender_id === myId || msg.senderId === myId) return;
            // Don't duplicate
            if (this.chatMessages.some(m => m.id === msg.id)) return;

            this.chatMessages.push({
              id: msg.id,
              propertyId: msg.property_id || msg.propertyId,
              senderId: msg.sender_id || msg.senderId,
              senderName: msg.sender_name || msg.senderName || 'Landlord',
              isSenderMe: false,
              text: msg.text,
              createdAt: msg.created_at || msg.createdAt
            });
          });

          this.saveChatMessages();
          this.renderChatMessages();
        }
      } catch (err) {
        // Silent fail — polling in background
      }
    }, 5000); // Poll every 5 seconds
  }

  stopChatPolling() {
    if (this._chatPollInterval) {
      clearInterval(this._chatPollInterval);
      this._chatPollInterval = null;
    }
  }

  showTakenToast(event) {
    if (event) event.stopPropagation();
    this.showToast('This listing was marked TAKEN / OCCUPIED by the landlord.', 'warning');
  }

  async toggleCurrentPropertyTakenStatus() {
    if (!this.selectedPropertyForDetail) return;
    await this.togglePropertyTakenStatus(this.selectedPropertyForDetail.id);
  }

  async togglePropertyTakenStatus(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    const currentUser = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function')
      ? window.kejaAuth.getSession()
      : null;

    const isOwnerOrAdmin = !!(currentUser && (
      currentUser.role === 'admin' ||
      (currentUser.id && p.landlord && currentUser.id === p.landlord.id) ||
      (currentUser.phone && (
        (p.landlord && (currentUser.phone === p.landlord.phone || currentUser.phone === p.landlord.whatsapp)) ||
        currentUser.phone === p.landlordPhone
      ))
    ));

    if (!isOwnerOrAdmin) {
      this.showToast('Security Alert: Only the verified landlord of this listing or an admin can update occupancy status.', 'error');
      return;
    }

    const newStatus = !(p.isTaken || p.status === 'taken');
    const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');

    try {
      const res = await fetch(`/api/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isTaken: newStatus, status: newStatus ? 'taken' : 'available' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        p.isTaken = newStatus;
        p.status = newStatus ? 'taken' : 'available';
        this.showToast(data.message || `Status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}!`, 'success');
      } else {
        this.showToast(data.message || 'Failed to update property status.', 'warning');
        return;
      }
    } catch (err) {
      this.showToast('Network error while updating status.', 'error');
      return;
    }

    if (this.selectedPropertyForDetail && this.selectedPropertyForDetail.id === propertyId) {
      this.openPropertyDetail(propertyId);
    }

    this.applyFilters();
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async loadPropertyDetailServices() {
    const container = document.getElementById('detail-services-container');
    if (!container) return;

    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      
      if (data.success && data.properties) {
        // Filter for verified services only
        const services = data.properties.filter(p => 
          p.listingType === 'service' && 
          p.isVerified === true &&
          p.availability !== 'taken'
        );

        if (services.length === 0) {
          container.innerHTML = '';
          return;
        }

        // Group services by category
        const servicesByCategory = {
          wifi: [],
          movers: [],
          laundry: [],
          garbage: [],
          gas: [],
          water: []
        };

        services.forEach(s => {
          if (servicesByCategory[s.category]) {
            servicesByCategory[s.category].push(s);
          }
        });

        const categoryInfo = {
          wifi: { icon: 'wifi', color: '#0284c7', bg: '#e0f2fe', name: 'WiFi / Internet' },
          movers: { icon: 'truck-moving', color: '#ea580c', bg: '#fed7aa', name: 'Moving Services' },
          laundry: { icon: 'tshirt', color: '#8b5cf6', bg: '#ede9fe', name: 'Laundry Services' },
          garbage: { icon: 'trash', color: '#059669', bg: '#d1fae5', name: 'Garbage Collection' },
          gas: { icon: 'fire', color: '#dc2626', bg: '#fee2e2', name: 'Gas Refills' },
          water: { icon: 'tint', color: '#06b6d4', bg: '#cffafe', name: 'Water Delivery' }
        };

        let html = '<h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 1.1rem;"><i class="fas fa-concierge-bell"></i> Verified Services</h4>';

        Object.keys(servicesByCategory).forEach(category => {
          const categoryServices = servicesByCategory[category];
          if (categoryServices.length > 0) {
            const info = categoryInfo[category];
            const service = categoryServices[0]; // Show first provider
            
            html += `
              <div style="background: linear-gradient(135deg, ${info.bg}, ${info.bg}dd); border: 1.5px solid ${info.color}44; border-radius: 12px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: transform 0.2s ease;" onclick="app.showServiceProviders('${category}')">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: ${info.color}; display: flex; align-items: center; justify-content: center;">
                      <i class="fas fa-${info.icon}" style="color: white; font-size: 0.9rem;"></i>
                    </div>
                    <div>
                      <div style="font-weight: 800; font-size: 0.9rem; color: ${info.color};">${info.name}</div>
                      <div style="font-size: 0.72rem; color: ${info.color}dd; font-weight: 600;">${categoryServices.length} Verified Provider${categoryServices.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <span style="background: white; color: ${info.color}; font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">VIEW</span>
                </div>
                <p style="font-size: 0.78rem; color: ${info.color}; line-height: 1.4; margin: 0;">${service.description || service.businessName}</p>
              </div>
            `;
          }
        });

        container.innerHTML = html;
      }
    } catch (err) {
      console.log('Could not load services:', err);
      container.innerHTML = '';
    }
  }

  async loadMainServicesSection() {
    const container = document.getElementById('services-section');
    if (!container) return;

    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      
      if (data.success && data.properties) {
        const services = data.properties.filter(p => 
          p.listingType === 'service' && 
          p.isVerified === true &&
          p.availability !== 'taken'
        );

        if (services.length === 0) {
          container.innerHTML = '';
          return;
        }

        const servicesByCategory = {
          wifi: [],
          movers: [],
          laundry: [],
          garbage: [],
          gas: [],
          water: []
        };

        services.forEach(s => {
          if (servicesByCategory[s.category]) {
            servicesByCategory[s.category].push(s);
          }
        });

        const categoryInfo = {
          wifi: { icon: 'wifi', color: '#0284c7', bg: '#e0f2fe', name: 'WiFi / Internet' },
          movers: { icon: 'truck-moving', color: '#ea580c', bg: '#fed7aa', name: 'Moving Services' },
          laundry: { icon: 'tshirt', color: '#8b5cf6', bg: '#ede9fe', name: 'Laundry Services' },
          garbage: { icon: 'trash', color: '#059669', bg: '#d1fae5', name: 'Garbage Collection' },
          gas: { icon: 'fire', color: '#dc2626', bg: '#fee2e2', name: 'Gas Refills' },
          water: { icon: 'tint', color: '#06b6d4', bg: '#cffafe', name: 'Water Delivery' }
        };

        let html = `
          <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 1.3rem; font-weight: 800;"><i class="fas fa-concierge-bell" style="color: #4f46e5;"></i> Verified Services</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        `;

        Object.keys(servicesByCategory).forEach(category => {
          const categoryServices = servicesByCategory[category];
          if (categoryServices.length > 0) {
            const info = categoryInfo[category];
            html += `
              <div style="background: white; border: 2px solid ${info.color}44; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease;" onclick="app.showServiceProviders('${category}')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.12)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                  <div style="width: 48px; height: 48px; border-radius: 12px; background: ${info.color}; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-${info.icon}" style="color: white; font-size: 1.2rem;"></i>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 800; font-size: 1rem; color: #1e293b;">${info.name}</div>
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">${categoryServices.length} Provider${categoryServices.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <button style="width: 100%; background: ${info.color}; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                  <i class="fas fa-arrow-right"></i> View Providers
                </button>
              </div>
            `;
          }
        });

        html += `</div></div>`;
        container.innerHTML = html;
      }
    } catch (err) {
      console.log('Could not load services:', err);
      container.innerHTML = '';
    }
  }

  showServiceProviders(category) {
    // Show modal with all providers in this category
    alert(`Showing all ${category} service providers. Modal implementation coming...`);
  }
}

// Global instance
window.app = new NairobiRentalsApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
