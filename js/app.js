/**
 * Nairobi Rentals Live - Main Application Controller
 * High-performance orchestrator for search, filtering, view switching, modals, and user interactions.
 */

class NairobiRentalsApp {
  constructor() {
    this.properties = [...SEED_PROPERTIES];
    this.services = [];
    this.marketplaceItems = [];
    this.favorites = new Set();
    this.currentViewMode = 'grid'; // 'grid' | 'split' | 'map'
    this.currentPage = 1;
    this.pageSize = 8;
    this.activeCategory = 'All';
    this.activeCorridor = 'all';
    this.activeSuburb = 'all';
    this.activeCounty = 'all';
    this.activeServiceCorridor = 'all';
    this.activeServiceSuburb = 'all';
    this.searchQuery = '';
    this.minPrice = 0;
    this.maxPrice = 200000;
    this.sortBy = 'newest';
    this.showOnlyFavorites = false;
    this.hideTaken = true; // Default hide taken/occupied properties
    this.currentFilterMode = 'properties'; // Default filter mode
    this.activeVerificationFilter = 'all'; // 'all' | 'verified' | 'unverified'

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
          this.properties = this.properties.map(p => this.normalizeProperty(p));

          // Ensure exact reference properties are at the top of the list
          const exactSeed = (typeof SEED_PROPERTIES !== 'undefined' ? SEED_PROPERTIES : []).filter(s => s.id?.startsWith('prop-exact-')).map(p => this.normalizeProperty(p));
          const existingIds = new Set(exactSeed.map(s => s.id));
          this.properties = [...exactSeed, ...this.properties.filter(p => !existingIds.has(p.id))];

          console.log('Loaded properties from API:', this.properties.length);
          
          // Initialize Recently Added section with fresh data
          if (window.KejaRecentlyAdded && window.KejaRecentlyAdded.refresh) {
            setTimeout(() => {
              window.KejaRecentlyAdded.refresh();
            }, 500);
          }
          
          return;
        }
      }
    } catch (err) {
      console.log('API fetch failed:', err);
    }
    
    // Fallback to seed properties
    console.log('Using seed properties (offline fallback)');
    const exactSeed = (typeof SEED_PROPERTIES !== 'undefined' ? SEED_PROPERTIES : []).filter(s => s.id?.startsWith('prop-exact-')).map(p => this.normalizeProperty(p));
    const otherSeed = (typeof SEED_PROPERTIES !== 'undefined' ? SEED_PROPERTIES : []).filter(s => !s.id?.startsWith('prop-exact-') &&
      (s.status === 'approved' || 
      s.isApproved === true ||
      s.isVerified === true ||
      s.status === 'active') &&
      s.availability !== 'taken' &&
      !s.title?.includes('BEYOND SUNDAY') &&
      !s.isTest &&
      !s.isPlaceholder
    ).map(p => this.normalizeProperty(p));
    this.properties = [...exactSeed, ...otherSeed];
    console.log('Loaded properties from seed:', this.properties.length);
    
    // Initialize Recently Added section with fresh data
    if (window.KejaRecentlyAdded && window.KejaRecentlyAdded.refresh) {
      setTimeout(() => {
        window.KejaRecentlyAdded.refresh();
      }, 500);
    }
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
      // Silent — offline fallback to localStorage
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
      countEl.style.display = this.favorites.size > 0 ? 'inline-flex' : 'none';
    }
  }

  toggleFavorite(propertyId, event) {
    if (event) event.stopPropagation();
    // Gate: require sign-in to save/remove favorites
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.toggleFavorite(propertyId, null));
      return;
    }
    const wasAdded = !this.favorites.has(propertyId);
    if (this.favorites.has(propertyId)) {
      this.favorites.delete(propertyId);
      this.showToast('Removed from saved favorites', 'info');
    } else {
      this.favorites.add(propertyId);
      this.showToast('Saved to your favorites!', 'success');
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
      }).catch(() => {}); // Silent — localStorage is fallback
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
    // Populate Counties / Corridors for Properties
    const corridorSelect = document.getElementById('filter-corridor');
    if (corridorSelect) {
      corridorSelect.innerHTML = `<option value="all">Nairobi & Environs</option>` +
        NAIROBI_REGIONS.map(r => `<option value="${r.corridorId}">${r.corridorName} (${r.county})</option>`).join('');
      
      corridorSelect.addEventListener('change', (e) => {
        this.activeCorridor = e.target.value;
        this.updateSuburbFilterOptions();
        this.applyFilters();
      });
    }

    this.updateSuburbFilterOptions();
    this.populateSidebarChecklists();
    
    // Populate Counties / Corridors for Services
    const serviceCorridorSelect = document.getElementById('filter-service-corridor');
    if (serviceCorridorSelect) {
      serviceCorridorSelect.innerHTML = `<option value="all">All Nairobi Corridors</option>` +
        NAIROBI_REGIONS.map(r => `<option value="${r.corridorId}">${r.corridorName} (${r.county})</option>`).join('');
      
      serviceCorridorSelect.addEventListener('change', (e) => {
        this.activeServiceCorridor = e.target.value;
        this.updateServiceSuburbFilterOptions();
        this.applyFilters();
      });
    }

    this.updateServiceSuburbFilterOptions();
  }

  toggleFilterSection(secId) {
    const el = document.getElementById(secId);
    if (el) el.classList.toggle('collapsed');
  }

  populateSidebarChecklists() {
    const suburbContainer = document.getElementById('suburb-checklist-container');
    if (suburbContainer) {
      const topSuburbs = [
        { name: 'Ngara', count: 12 },
        { name: 'Kilimani', count: 18 },
        { name: 'Parklands', count: 9 },
        { name: 'Ruaraka', count: 6 },
        { name: 'Kasarani', count: 14 },
        { name: 'Lavington', count: 10 },
        { name: 'Westlands', count: 22 },
        { name: 'Donholm', count: 8 },
        { name: 'Eastleigh', count: 11 },
        { name: 'Rongai', count: 7 },
        { name: 'South B', count: 15 },
        { name: 'South C', count: 9 },
        { name: 'Ruaka', count: 19 },
        { name: 'Roysambu', count: 16 },
        { name: 'Umoja', count: 13 },
        { name: 'Pangani', count: 8 },
        { name: 'Embakasi', count: 12 },
        { name: 'Kikuyu', count: 7 },
        { name: 'Karen', count: 5 },
        { name: 'Juja', count: 11 }
      ];

      this.sidebarSuburbsList = topSuburbs;
      if (!this.selectedSuburbs) {
        this.selectedSuburbs = new Set();
      }
      this.renderSuburbChecklist(topSuburbs.slice(0, 10));
    }

    const typeContainer = document.getElementById('property-type-checklist-container');
    if (typeContainer) {
      const types = [
        { name: 'Single Room', count: '3,245' },
        { name: 'Bedsitter', count: '4,502' },
        { name: '1 Bedroom', count: '2,187' },
        { name: '2 Bedrooms', count: '1,432' },
        { name: '3 Bedrooms', count: '986' },
        { name: '4+ Bedrooms', count: '521' },
        { name: 'Bungalow', count: '318' }
      ];

      typeContainer.innerHTML = types.map(t => `
        <label class="filter-check-item">
          <input type="checkbox" class="prop-type-checkbox" value="${t.name}" onchange="app.onPropertyTypeCheckboxChange(this)">
          <span class="item-label">${t.name}</span>
          <span class="item-count">${t.count}</span>
        </label>
      `).join('');
    }
  }

  renderSuburbChecklist(suburbs) {
    const container = document.getElementById('suburb-checklist-container');
    if (!container) return;

    container.innerHTML = suburbs.map(s => {
      const isChecked = this.selectedSuburbs?.has(s.name) || false;
      return `
        <label class="filter-check-item">
          <input type="checkbox" class="suburb-checkbox" value="${s.name}" ${isChecked ? 'checked' : ''} onchange="app.onSuburbCheckboxChange(this)">
          <span class="item-label">${s.name}</span>
          <span class="item-count">${s.count}</span>
        </label>
      `;
    }).join('');
  }

  filterSuburbChecklist(query) {
    if (!this.sidebarSuburbsList) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.renderSuburbChecklist(this.showingAllSuburbs ? this.sidebarSuburbsList : this.sidebarSuburbsList.slice(0, 10));
      return;
    }
    const filtered = this.sidebarSuburbsList.filter(s => s.name.toLowerCase().includes(q));
    this.renderSuburbChecklist(filtered);
  }

  toggleMoreSuburbs() {
    this.showingAllSuburbs = !this.showingAllSuburbs;
    const btn = document.getElementById('btn-toggle-more-suburbs');
    if (this.showingAllSuburbs) {
      this.renderSuburbChecklist(this.sidebarSuburbsList);
      if (btn) btn.innerHTML = `<span>Show less</span> <i class="fas fa-chevron-up"></i>`;
    } else {
      this.renderSuburbChecklist(this.sidebarSuburbsList.slice(0, 10));
      if (btn) btn.innerHTML = `<span>Show more (${this.sidebarSuburbsList.length - 10})</span> <i class="fas fa-chevron-down"></i>`;
    }
  }

  onSuburbCheckboxChange(cb) {
    if (!this.selectedSuburbs) this.selectedSuburbs = new Set();
    if (cb.checked) {
      this.selectedSuburbs.add(cb.value);
    } else {
      this.selectedSuburbs.delete(cb.value);
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onPropertyTypeCheckboxChange(cb) {
    if (cb.checked) {
      this.setCategory(cb.value);
    } else {
      this.setCategory('All');
    }
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

  updateServiceSuburbFilterOptions() {
    const serviceSuburbSelect = document.getElementById('filter-service-suburb');
    if (!serviceSuburbSelect) return;

    let availableSuburbs = ALL_SUBURBS;
    if (this.activeServiceCorridor && this.activeServiceCorridor !== 'all') {
      availableSuburbs = ALL_SUBURBS.filter(s => s.corridorId === this.activeServiceCorridor);
    }

    serviceSuburbSelect.innerHTML = `<option value="all">All Suburbs & Estates (${availableSuburbs.length})</option>` +
      availableSuburbs.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    
    serviceSuburbSelect.addEventListener('change', (e) => {
      this.activeServiceSuburb = e.target.value;
      this.applyFilters();
    });
  }

  setVerificationFilter(status, btn) {
    this.activeVerificationFilter = status;
    
    // Update active pill UI
    document.querySelectorAll('.verification-pill').forEach(p => p.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    }
    
    // Apply filters based on current mode
    this.currentPage = 1;
    this.applyFilters();
    this.showToast(`Filtering by verification: ${status}`, 'info');
  }

  switchFilterTab(tab) {
    console.log('Switching filter tab to:', tab);
    
    // Toggle Accordion Bodies
    const accBodyProps = document.getElementById('acc-body-properties');
    const accBodyServ = document.getElementById('acc-body-services');
    const accBodyMkt = document.getElementById('acc-body-marketplace');

    // Toggle extra filters
    const propFilters = document.getElementById('sidebar-properties-filters');
    const servFilters = document.getElementById('sidebar-services-filters');
    const mktFilters = document.getElementById('sidebar-marketplace-filters');

    if (accBodyProps) accBodyProps.style.display = tab === 'properties' ? 'block' : 'none';
    if (accBodyServ) accBodyServ.style.display = tab === 'services' ? 'block' : 'none';
    if (accBodyMkt) accBodyMkt.style.display = tab === 'marketplace' ? 'block' : 'none';

    if (propFilters) propFilters.style.display = tab === 'properties' ? 'block' : 'none';
    if (servFilters) servFilters.style.display = tab === 'services' ? 'block' : 'none';
    if (mktFilters) mktFilters.style.display = tab === 'marketplace' ? 'block' : 'none';

    // Update top tab strip button visual state
    const tabStyles = {
      properties: { activeBg: '#f0fdf4', activeBorder: '#00b53f', activeColor: '#166534', dimBg: '#f9fafb', dimBorder: '#e2e8f0', dimColor: '#94a3b8' },
      services:   { activeBg: '#faf5ff', activeBorder: '#7c3aed', activeColor: '#6b21a8', dimBg: '#f9fafb', dimBorder: '#e2e8f0', dimColor: '#94a3b8' },
      marketplace:{ activeBg: '#fffbe6', activeBorder: '#f59e0b', activeColor: '#854d0e', dimBg: '#f9fafb', dimBorder: '#e2e8f0', dimColor: '#94a3b8' }
    };
    ['properties', 'services', 'marketplace'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (!btn) return;
      const isActive = t === tab;
      const styles = tabStyles[t];
      btn.style.background = isActive ? styles.activeBg : styles.dimBg;
      btn.style.borderColor = isActive ? styles.activeBorder : styles.dimBorder;
      btn.style.color = isActive ? styles.activeColor : styles.dimColor;
      btn.style.transform = isActive ? 'scale(1.03)' : 'scale(1)';
      btn.style.boxShadow = isActive ? `0 2px 8px ${styles.activeBorder}33` : 'none';
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    this.currentFilterMode = tab;

    if (tab === 'properties') {
      this.renderPropertyCategories();
    } else if (tab === 'services') {
      this.renderServiceCategories();
    } else if (tab === 'marketplace') {
      this.renderMarketplaceCategories();
    }
    
    // Apply filters to load the correct data for the new tab
    this.applyFilters();
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
    const categoryList = document.getElementById('sidebar-services-category-list');
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
      // Internet & Connectivity
      if (service.includes('Safaricom')) return 'fa-wifi';
      if (service.includes('Airtel')) return 'fa-signal';
      if (service.includes('Jamii') || service.includes('Faiba')) return 'fa-network-wired';
      if (service.includes('Zuku')) return 'fa-ethernet';
      if (service.includes('Liquid')) return 'fa-server';
      if (service.includes('Internet') || service.includes('Fibre') || service.includes('5G') || service.includes('4G')) return 'fa-wifi';
      return 'fa-tools';
    };

    const allItem = `<button class="sidebar-cat-item active" data-service="All" onclick="app.setServiceCategory('All', this)"><i class="fas fa-th-large"></i><span>All Services</span></button>`;
    const items = SERVICE_CATEGORIES.map(service =>
      `<button class="sidebar-cat-item" data-service="${service}" onclick="app.setServiceCategory('${service}', this)"><i class="fas ${getIcon(service)}"></i><span>${service}</span></button>`
    ).join('');
    categoryList.innerHTML = allItem + items;
  }

  renderMarketplaceCategories() {
    const categoryList = document.getElementById('sidebar-marketplace-category-list');
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
    this.applyFilters(); // Apply filters and refresh UI
    this.showToast(`Filtering services: ${service}`, 'info');
  }

  setMarketplaceItem(item, btn) {
    const allButtons = document.querySelectorAll('#sidebar-category-list .sidebar-cat-item');
    allButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.activeMarketplaceItem = item;
    this.applyFilters(); // Apply filters and refresh UI
    this.showToast(`Filtering items: ${item}`, 'info');
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

  toggleFraudWarning() {
    const details = document.getElementById('fraud-warning-details');
    const toggleText = document.getElementById('fraud-toggle-text');
    const toggleIcon = document.getElementById('fraud-toggle-icon');
    if (details) {
      const isHidden = details.style.display === 'none' || details.style.display === '';
      details.style.display = isHidden ? 'block' : 'none';
      if (toggleText) toggleText.textContent = isHidden ? 'Less Info' : 'Safety Tips';
      if (toggleIcon) toggleIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      if (isHidden) {
        details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  onSortChange(value) {
    this.sortBy = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  setViewMode(mode) {
    // Gate: interactive map/split view requires login
    if ((mode === 'map' || mode === 'split') && !(window.kejaAuth && window.kejaAuth.getSession())) {
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

    if (mode === 'map' || mode === 'split') {
      if (window.mapController) {
        window.mapController.init();
        setTimeout(() => {
          if (window.mapController.fullMap) window.mapController.fullMap.invalidateSize();
          if (window.mapController.splitMap) window.mapController.splitMap.invalidateSize();
          window.mapController.renderPins(this.filteredProperties || []);
        }, 300);
      }
    }
  }

  resetFilters() {
    this.activeCategory = 'All';
    this.activeCorridor = 'all';
    this.activeSuburb = 'all';
    this.activeServiceCorridor = 'all';
    this.activeServiceSuburb = 'all';
    this.searchQuery = '';
    this.minPrice = 0;
    this.maxPrice = 200000;
    this.showOnlyFavorites = false;
    this.sortBy = 'newest';
    this.selectedSuburbs = new Set();

    Object.keys(this.filters).forEach(k => { this.filters[k] = false; });

    // Reset UI elements
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) searchInput.value = '';
    const corridorSelect = document.getElementById('filter-corridor');
    if (corridorSelect) corridorSelect.value = 'all';
    const serviceCorridorSelect = document.getElementById('filter-service-corridor');
    if (serviceCorridorSelect) serviceCorridorSelect.value = 'all';
    const priceSlider = document.getElementById('price-slider');
    if (priceSlider) priceSlider.value = 200000;
    const priceMaxInput = document.getElementById('price-max-input');
    if (priceMaxInput) priceMaxInput.value = 200000;
    const priceMinInput = document.getElementById('price-min-input');
    if (priceMinInput) priceMinInput.value = 0;

    document.querySelectorAll('.sidebar-filters input[type="checkbox"]').forEach(c => { c.checked = false; });

    this.setCategory('All');
    this.updateSuburbFilterOptions();
    this.updateServiceSuburbFilterOptions();
    this.applyFilters();
    this.showToast('All filters have been reset', 'info');
  }

  clearSearchInput() {
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = 'none';
    const dropdown = document.getElementById('header-search-suggestions');
    if (dropdown) dropdown.style.display = 'none';
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  highlightMatch(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark style="background:#dcfce7; color:#166534; font-weight:700; padding:0 2px;">$1</mark>');
  }

  showSearchSuggestions(query) {
    const dropdown = document.getElementById('header-search-suggestions');
    if (!dropdown) return;

    if (!query || query.trim().length < 1) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const q = query.toLowerCase().trim();
    const suggestions = [];

    // 1. Check Estates / Suburbs
    const commonEstates = ['Kilimani', 'Westlands', 'Ruaka', 'Roysambu', 'Kasarani', 'Ngara', 'Umoja', 'Kahawa West', 'Embakasi', 'Parklands', 'Lavington', 'Kileleshwa', 'South B', 'South C', 'Thika Road', 'Juja', 'Karen'];
    commonEstates.forEach(est => {
      if (est.toLowerCase().includes(q)) {
        suggestions.push({ type: 'location', text: est, icon: 'fas fa-map-marker-alt', category: 'Estate / Location' });
      }
    });

    // 2. House Types & Categories
    const houseTypes = [
      'Single Room', 'Bedsitter / Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom+', 
      'Maisonette / Townhouse', 'Bungalow', 'Penthouse', 'BnB / Airbnb Stay', 'Commercial / Office'
    ];
    houseTypes.forEach(ht => {
      if (ht.toLowerCase().includes(q) && !suggestions.some(s => s.text.toLowerCase() === ht.toLowerCase())) {
        suggestions.push({ type: 'category', text: ht, icon: 'fas fa-home', category: 'House Type' });
      }
    });

    // 3. Marketplace Categories
    const mktCategories = [
      'Furniture & Sofas', 'Beds & Mattresses', 'Kitchen Appliances', 'Electronics & TV', 
      'Fridges & Freezers', 'Washing Machines', 'Dining Tables & Chairs', 'Wardrobes & Cabinets'
    ];
    mktCategories.forEach(mc => {
      if (mc.toLowerCase().includes(q) && !suggestions.some(s => s.text.toLowerCase() === mc.toLowerCase())) {
        suggestions.push({ type: 'marketplace', text: mc, icon: 'fas fa-shopping-bag', category: 'Used Item' });
      }
    });

    // 4. Listing Titles
    if (this.properties && Array.isArray(this.properties)) {
      this.properties.forEach(p => {
        if (p.title && p.title.toLowerCase().includes(q) && !suggestions.some(s => s.text.toLowerCase() === p.title.toLowerCase())) {
          suggestions.push({ type: 'property', text: p.title, icon: 'fas fa-building', category: 'Rental Listing' });
        }
      });
    }

    const topSuggestions = suggestions.slice(0, 8);

    if (topSuggestions.length === 0) {
      dropdown.innerHTML = `
        <div class="search-suggestion-item empty" style="padding: 12px; color: #64748b; font-size: 0.85rem; text-align: center;">
          <i class="fas fa-search" style="margin-right: 6px; color: #00b53f;"></i> Press enter to search for "<strong>${this.escapeHtml(query)}</strong>"
        </div>`;
    } else {
      dropdown.innerHTML = topSuggestions.map(item => `
        <div class="search-suggestion-item" onclick="app.selectSearchSuggestion('${this.escapeHtml(item.text).replace(/'/g, "\\'")}')">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="${item.icon}" style="color: #00b53f; font-size: 0.95rem;"></i>
            <span style="font-weight: 600; font-size: 0.9rem; color: #0f172a;">${this.highlightMatch(item.text, query)}</span>
          </div>
          <span style="font-size: 0.72rem; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${item.category}</span>
        </div>
      `).join('');
    }

    dropdown.style.display = 'block';
  }

  selectSearchSuggestion(text) {
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) searchInput.value = text;
    const dropdown = document.getElementById('header-search-suggestions');
    if (dropdown) dropdown.style.display = 'none';
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = 'flex';

    this.searchQuery = text;
    this.currentPage = 1;
    this.applyFilters();
  }

    openGalleryModal(propertyId, event) {
    if (event) event.stopPropagation();
    // Gate: require sign-in to view full gallery
    const _isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    if (!_isLoggedIn) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        window.kejaAuth.requireTenantAuth(() => this.openGalleryModal(propertyId, null));
      }
      return;
    }
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.normalizeProperty(p);
    this.selectedPropertyForDetail = p;
    this.currentPhotoIndex = 0;

    // Open property detail modal
    this.openPropertyDetail(propertyId);

    // Open full lightbox gallery showing all 7 photos immediately
    setTimeout(() => this.openLightbox(null), 100);
  }

  // Handle photo file selection for forms (Max 5 photos)
  handleFormPhotoFiles(inputEl, previewId, maxPhotos = 5) {
    const previewGrid = document.getElementById(previewId);
    if (!previewGrid || !inputEl.files) return;

    if (!inputEl._uploadedPhotos) inputEl._uploadedPhotos = [];
    const files = Array.from(inputEl.files);

    if (inputEl._uploadedPhotos.length + files.length > maxPhotos) {
      this.showToast(`Maximum ${maxPhotos} photos allowed per post.`, 'error');
    }

    const remainingSlots = maxPhotos - inputEl._uploadedPhotos.length;
    files.slice(0, remainingSlots).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawUrl = e.target.result;
        let finalUrl = rawUrl;
        if (window.kejaWatermark && typeof window.kejaWatermark.applyWatermarkToImage === 'function') {
          try {
            finalUrl = await window.kejaWatermark.applyWatermarkToImage(rawUrl);
          } catch (err) {
            console.warn('Watermark failed, using raw:', err);
          }
        }
        inputEl._uploadedPhotos.push(finalUrl);
        this.renderFormPhotoPreviews(inputEl, previewGrid, maxPhotos);
      };
      reader.readAsDataURL(file);
    });
  }

  renderFormPhotoPreviews(inputEl, previewGrid, maxPhotos) {
    if (!inputEl._uploadedPhotos) inputEl._uploadedPhotos = [];
    previewGrid.innerHTML = inputEl._uploadedPhotos.map((url, idx) => `
      <div style="position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #00b53f;">
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
        ${idx === 0 ? '<span style="position: absolute; bottom: 0; left: 0; right: 0; background: #00b53f; color: white; font-size: 0.6rem; text-align: center; font-weight: 700;">COVER</span>' : ''}
        <span style="position: absolute; top: 2px; left: 2px; background: rgba(15,23,42,0.85); color: #fff; font-size: 0.52rem; font-weight: 700; padding: 1px 3px; border-radius: 2px; border: 1px solid rgba(0,181,63,0.8);">kejamarket.co.ke</span>
        <button type="button" style="position: absolute; top: 2px; right: 2px; background: rgba(220,38,38,0.9); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 0.7rem;" onclick="app.removeFormPhoto('${inputEl.id}', '${previewGrid.id}', ${idx}, ${maxPhotos})">&times;</button>
      </div>
    `).join('');
  }

  removeFormPhoto(inputId, previewId, index, maxPhotos) {
    const inputEl = document.getElementById(inputId);
    const previewGrid = document.getElementById(previewId);
    if (inputEl && inputEl._uploadedPhotos) {
      inputEl._uploadedPhotos.splice(index, 1);
      this.renderFormPhotoPreviews(inputEl, previewGrid, maxPhotos);
    }
  }

  // Handle video file selection for forms (Max 1 video, max 90s duration)
  handleFormVideoFile(inputEl, previewId, maxSeconds = 90) {
    const previewContainer = document.getElementById(previewId);
    if (!previewContainer || !inputEl.files || inputEl.files.length === 0) return;

    const file = inputEl.files[0];
    const video = document.createElement('video');
    video.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);
    video.src = blobUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const duration = video.duration;

      if (duration > maxSeconds + 1) {
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        this.showToast(`Video exceeds max duration! Allowed: 1 minute 30 seconds (90s). Uploaded: ${mins}m ${secs}s. Please trim your video.`, 'error');
        inputEl.value = '';
        inputEl._uploadedVideo = null;
        previewContainer.innerHTML = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        let posterUrl = '';
        if (window.kejaWatermark && typeof window.kejaWatermark.generateVideoPoster === 'function') {
          try {
            posterUrl = await window.kejaWatermark.generateVideoPoster(file);
          } catch (err) {}
        }
        inputEl._uploadedVideo = { url: e.target.result, duration: Math.round(duration), poster: posterUrl };
        previewContainer.innerHTML = `
          <div style="position: relative; width: 160px; border-radius: 8px; overflow: hidden; background: #000; border: 2px solid #7c3aed;">
            <video src="${e.target.result}" ${posterUrl ? `poster="${posterUrl}"` : ''} controlsList="nodownload" oncontextmenu="return false;" style="width: 100%; height: 95px; object-fit: cover;" controls></video>
            <span style="position: absolute; top: 4px; left: 4px; background: rgba(15,23,42,0.85); color: #fff; font-size: 0.58rem; font-weight: 700; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(0,181,63,0.8); z-index: 5;">
              <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #00b53f; margin-right: 3px;"></span>kejamarket.co.ke
            </span>
            <span style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${Math.round(duration)}s
            </span>
            <button type="button" style="position: absolute; top: 4px; right: 4px; background: rgba(220,38,38,0.9); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 0.75rem; z-index: 6;" onclick="document.getElementById('${inputEl.id}').value = ''; document.getElementById('${inputEl.id}')._uploadedVideo = null; document.getElementById('${previewId}').innerHTML = '';">&times;</button>
          </div>`;
        this.showToast(`Video tour attached (${Math.round(duration)}s) with kejamarket.co.ke watermark!`, 'info');
      };
      reader.readAsDataURL(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      this.showToast('Could not process video file. Please check video format.', 'error');
      inputEl.value = '';
      previewContainer.innerHTML = '';
    };
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
    // Load correct data source based on filter mode
    if (this.currentFilterMode === 'services') {
      this.loadServicesData();
      return;
    } else if (this.currentFilterMode === 'marketplace') {
      this.loadMarketplaceData();
      return;
    }

    // Otherwise proceed with properties filtering
    let result = this.properties.filter(p => {
      // Hide taken / occupied properties filter
      if (this.hideTaken && (p.isTaken || p.status === 'taken')) return false;

      // Verification filter
      const isLandlordVerified = p.landlord?.isVerified === true;
      if (this.activeVerificationFilter === 'verified' && !isLandlordVerified && !p.isVerified && p.status !== 'approved') return false;
      if (this.activeVerificationFilter === 'unverified' && (isLandlordVerified || p.isVerified || p.status === 'approved')) return false;

      // Favorites filter
      if (this.showOnlyFavorites && !this.favorites.has(p.id)) return false;

      // Category filter
      if (this.activeCategory && this.activeCategory !== 'All') {
        const cat = this.activeCategory.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        let matchesCategory = (p.category === this.activeCategory);
        if (!matchesCategory) {
          if (cat.includes('airbnb') || cat.includes('bnb') || cat.includes('short')) {
            matchesCategory = Boolean(
              p.isBnb || 
              p.rentPeriod === 'night' || 
              pCat.includes('bnb') || 
              pCat.includes('airbnb') || 
              pCat.includes('short') || 
              pCat.includes('villa') || 
              (p.title && (p.title.toLowerCase().includes('bnb') || p.title.toLowerCase().includes('airbnb')))
            );
          } else if (cat === 'rentals' || cat === 'rental') {
            matchesCategory = Boolean(!p.isForSale && !pCat.includes('land') && !pCat.includes('plot'));
          } else if (cat.includes('selling') || cat.includes('sale')) {
            matchesCategory = Boolean(
              p.isForSale || 
              pCat.includes('selling') || 
              pCat.includes('sale') || 
              pCat.includes('bungalow') || 
              pCat.includes('maisonette') || 
              pCat.includes('plot') || 
              (p.title && p.title.toLowerCase().includes('for sale'))
            );
          } else if (cat.includes('apartment')) {
            matchesCategory = Boolean(
              pCat.includes('apartment') || 
              pCat.includes('bedroom') || 
              pCat.includes('bedsitter') || 
              pCat.includes('studio') ||
              pCat.includes('penthouse')
            );
          } else if (cat.includes('land') || cat.includes('plot')) {
            matchesCategory = Boolean(pCat.includes('land') || pCat.includes('plot') || (p.title && p.title.toLowerCase().includes('plot')));
          } else if (cat.includes('bedsitter') || cat.includes('studio')) {
            matchesCategory = pCat.includes('bedsitter') || pCat.includes('studio') || p.bedrooms === 0;
          } else if (cat.includes('single')) {
            matchesCategory = pCat.includes('single');
          } else if (cat.includes('1 bed')) {
            matchesCategory = pCat.includes('1 bed') || p.bedrooms === 1;
          } else if (cat.includes('2 bed')) {
            matchesCategory = pCat.includes('2 bed') || p.bedrooms === 2;
          } else if (cat.includes('3 bed')) {
            matchesCategory = pCat.includes('3 bed') || p.bedrooms === 3;
          } else if (cat.includes('4 bed')) {
            matchesCategory = pCat.includes('4 bed') || p.bedrooms >= 4;
          } else if (cat.includes('bungalow')) {
            matchesCategory = pCat.includes('bungalow');
          } else if (cat.includes('maisonette') || cat.includes('townhouse')) {
            matchesCategory = pCat.includes('maisonette') || pCat.includes('townhouse');
          } else {
            matchesCategory = pCat.includes(cat);
          }
        }
        if (!matchesCategory) return false;
      }

      // Corridor filter
      if (this.activeCorridor !== 'all' && p.corridorId !== this.activeCorridor) return false;

      // Suburb filter (supports multiple selected checkboxes and substring matching)
      if (this.selectedSuburbs && this.selectedSuburbs.size > 0) {
        const matchesSuburb = Array.from(this.selectedSuburbs).some(sub => {
          const sLower = sub.toLowerCase();
          return (p.estateSuburb && p.estateSuburb.toLowerCase().includes(sLower)) ||
                 (p.title && p.title.toLowerCase().includes(sLower)) ||
                 (p.exactLocation && p.exactLocation.toLowerCase().includes(sLower));
        });
        if (!matchesSuburb) return false;
      } else if (this.activeSuburb && this.activeSuburb !== 'all') {
        const sLower = this.activeSuburb.toLowerCase();
        const matchesSuburb = (p.estateSuburb && p.estateSuburb.toLowerCase().includes(sLower)) ||
                              (p.title && p.title.toLowerCase().includes(sLower)) ||
                              (p.exactLocation && p.exactLocation.toLowerCase().includes(sLower));
        if (!matchesSuburb) return false;
      }

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

    // Sorting Algorithm: Boosted/Featured first, then by Newest Uploaded
    const parseItemTime = (item) => {
      if (item.createdAt) {
        const t = new Date(item.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (item.timestamp) {
        const t = new Date(item.timestamp).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (typeof item.id === 'string') {
        const num = parseInt(item.id.replace(/\D/g, ''), 10);
        if (!isNaN(num)) return num;
      }
      return 0;
    };

    if (this.sortBy === 'price_asc') {
      result.sort((a, b) => (a.rentKes ?? a.price ?? 0) - (b.rentKes ?? b.price ?? 0));
    } else if (this.sortBy === 'price_desc') {
      result.sort((a, b) => (b.rentKes ?? b.price ?? 0) - (a.rentKes ?? a.price ?? 0));
    } else if (this.sortBy === 'category_asc') {
      result.sort((a, b) => {
        const rankA = CATEGORY_ORDER_RANK[a.category] || 99;
        const rankB = CATEGORY_ORDER_RANK[b.category] || 99;
        if (rankA !== rankB) return rankA - rankB;
        return (a.rentKes ?? 0) - (b.rentKes ?? 0);
      });
    } else {
      // Default / 'newest' / 'featured':
      // 1. Boosted / Featured ads appear first
      // 2. All categories sorted by newest uploaded timestamp descending
      result.sort((a, b) => {
        const isBoostedA = (a.isTopAd || a.isFeatured || a.badgeType === 'featured' || a.isBoosted) ? 1 : 0;
        const isBoostedB = (b.isTopAd || b.isFeatured || b.badgeType === 'featured' || b.isBoosted) ? 1 : 0;
        if (isBoostedA !== isBoostedB) {
          return isBoostedB - isBoostedA;
        }
        return parseItemTime(b) - parseItemTime(a);
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
    summaryEl.style.display = 'none';
    summaryEl.innerHTML = '';
  }

  generateCardHtml(p) {
    const isFav = this.favorites.has(p.id);
    const photoCount = p.photoCount || p.media?.length || 7;
    const thumbnail = p.media?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
    const isTaken = p.isTaken || p.status === 'taken' || p.status === 'occupied' || p.availability === 'occupied';
    const rawPrice = p.rentKes ?? p.rent ?? p.rent_kes ?? p.price ?? 0;
    const displayRent = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
    const isForSale = p.isForSale || p.title?.includes('Plot for Sale') || p.title?.includes('for Sale') || displayRent > 500000;
    const pricePeriod = isForSale ? '' : '/month';

    // Clean TikTok / Facebook tour prefixes from listing titles
    const cleanTitle = (str) => {
      if (!str) return '';
      return str
        .replace(/^TikTok\s+(House\s+)?(Tours?|Hunting|Viral|Gem|Sensation):\s*/i, '')
        .replace(/^TikTok\s+Tour:\s*/i, '')
        .replace(/^Facebook\s+(Direct|Tours?|Marketplace):\s*/i, '')
        .trim();
    };
    const displayTitle = cleanTitle(p.title);

    // Availability status on picture
    const isOccupied = Boolean(isTaken);
    const isFeatured = Boolean(p.badgeType === 'featured' || p.isFeatured || p.isTopAd);

    let badgeHtml = '';
    if (isOccupied) {
      badgeHtml = `<div class="card-badge-status occupied taken"><i class="fas fa-ban"></i> JUST RENTED OUT</div>`;
    } else {
      badgeHtml = `<div class="card-badge-status available"><i class="fas fa-check-circle"></i> AVAILABLE</div>`;
    }

    if (isFeatured && !isOccupied) {
      badgeHtml += `<div class="card-badge-status featured"><i class="fas fa-star"></i> FEATURED</div>`;
    }

    const watermarkText = 'KEJAMARKET VERIFIED';
    const beds = p.bedrooms ?? (p.category?.includes('Bedsitter') ? 1 : 1);
    const baths = p.bathrooms ?? 1;
    const sqm = p.sizeSqm ?? p.sqm ?? 0;
    const locationDisplay = p.locationDisplay || (p.estateSuburb ? `${p.estateSuburb}, ${p.county || 'Nairobi'}` : 'Nairobi');

    return `
      <div class="property-card ${isOccupied ? 'property-card-taken' : ''}" data-id="${p.id}">
        <div class="card-media-wrapper" onclick="app.openGalleryModal('${p.id}', event)" style="cursor: pointer;">
          <img src="${thumbnail}" alt="${displayTitle}" loading="lazy" style="${isOccupied ? 'filter: grayscale(40%) opacity(0.85);' : ''}">
          
          ${badgeHtml}

          <button type="button" class="btn-card-fav ${isFav ? 'active' : ''}" onclick="app.toggleFavorite('${p.id}', event)" title="Save to Favorites">
            <i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i>
          </button>

          <span class="card-watermark"><i class="fas fa-home"></i> ${watermarkText}</span>
          <span class="card-photo-count" onclick="app.openGalleryModal('${p.id}', event)">
            <i class="fas fa-camera"></i> ${photoCount} Photos
          </span>
        </div>

        <div class="card-content">
          <div class="card-price-row">
            <div class="card-price">KSh ${displayRent.toLocaleString()} <span class="period">${pricePeriod}</span></div>
          </div>

          <h3 class="card-title" onclick="app.openPropertyDetail('${p.id}')" title="${displayTitle}">
            ${isOccupied ? '<span style="color: #dc2626; font-size: 0.8rem; font-weight: 800; margin-right: 4px;">[OCCUPIED]</span>' : ''}${displayTitle}
          </h3>

          <div class="card-location-row" title="${locationDisplay}">
            <i class="fas fa-map-marker-alt"></i>
            <span>${locationDisplay}</span>
          </div>

          <div class="card-specs-row">
            <span><i class="fas fa-bed"></i> ${beds} ${beds === 1 ? 'Bed' : 'Beds'}</span>
            <span><i class="fas fa-bath"></i> ${baths} ${baths === 1 ? 'Bath' : 'Baths'}</span>
            ${sqm ? `<span><i class="fas fa-vector-square"></i> ${sqm.toLocaleString()} m²</span>` : ''}
          </div>

          ${isOccupied ? `
            <button type="button" class="btn-card-notify-similar" onclick="app.openSimilarAlertModal('${p.id}', event)">
              <i class="fas fa-bell"></i> Notify Me When Similar Available
            </button>
          ` : ''}
          <div class="card-actions-row">
            <button type="button" class="btn-card-details-green" onclick="app.openPropertyDetail('${p.id}')">
              View Details
            </button>
            <div class="card-direct-social-btns">
              <button type="button" class="card-social-btn card-social-wa" onclick="app.handleCardWhatsApp('${p.id}', event)" title="Share on WhatsApp"><i class="fab fa-whatsapp"></i></button>
              <button type="button" class="card-social-btn card-social-ig" onclick="app.handleCardInstagram('${p.id}', event)" title="Share on Instagram"><i class="fab fa-instagram"></i></button>
              <button type="button" class="card-social-btn card-social-fb" onclick="app.handleCardFacebook('${p.id}', event)" title="Share on Facebook"><i class="fab fa-facebook-f"></i></button>
              <button type="button" class="card-social-btn card-social-tt" onclick="app.handleCardTikTok('${p.id}', event)" title="Share on TikTok"><i class="fab fa-tiktok"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  openGalleryModal(propertyId, event) {
    if (event) event.stopPropagation();
    // Auth gate for gallery / more photos: "More photos -> 🔒 Login"
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.openGalleryModal(propertyId, null));
      return;
    }
    this.openPropertyDetail(propertyId);
  }

  openCardMoreMenu(propertyId, event) {
    if (event) event.stopPropagation();
    this.openPropertyDetail(propertyId);
  }

  focusPropertyOnMap(propertyId, event) {
    if (event) event.stopPropagation();
    // Gate: map view requires login
    if (!window.kejaAuth || !window.kejaAuth.getSession()) {
      window.kejaAuth.requireTenantAuth(() => this.focusPropertyOnMap(propertyId, null));
      return;
    }
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.setViewMode('map');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    setTimeout(() => {
      if (window.mapController && window.mapController.fullMap) {
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

    const totalCount = 312;
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, totalCount);

    let navHtml = `
      <div class="pagination-controls">
        <button class="btn-page-nav" onclick="app.goToPage(${Math.max(1, this.currentPage - 1)})" ${this.currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="btn-page ${this.currentPage === 1 ? 'active' : ''}" onclick="app.goToPage(1)">1</button>
        <button class="btn-page ${this.currentPage === 2 ? 'active' : ''}" onclick="app.goToPage(2)">2</button>
        <button class="btn-page ${this.currentPage === 3 ? 'active' : ''}" onclick="app.goToPage(3)">3</button>
        <button class="btn-page ${this.currentPage === 4 ? 'active' : ''}" onclick="app.goToPage(4)">4</button>
        <button class="btn-page ${this.currentPage === 5 ? 'active' : ''}" onclick="app.goToPage(5)">5</button>
        <span class="pagination-ellipsis">...</span>
        <button class="btn-page ${this.currentPage === 20 ? 'active' : ''}" onclick="app.goToPage(20)">20</button>
        <button class="btn-page-nav" onclick="app.goToPage(${Math.min(20, this.currentPage + 1)})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="pagination-showing-text">
        Showing ${startItem}-${endItem} of ${totalCount} listings
      </div>
    `;

    paginationEl.innerHTML = navHtml;
  }

  goToPage(pageNumber) {
    this.currentPage = pageNumber;
    this.renderCardsGrid();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }

  revealLandlordPhone(propertyId, btnEl) {
    // Gate: require sign-in to reveal contact phone
    const _isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    if (!_isLoggedIn) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        window.kejaAuth.requireTenantAuth(() => this.revealLandlordPhone(propertyId, btnEl));
      }
      return;
    }
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;
    this.normalizeProperty(p);

    const phone = p.landlord?.phone || '+254792409540';
    if (btnEl) {
      btnEl.innerHTML = `<i class="fas fa-phone"></i> ${phone}`;
      btnEl.style.background = '#e6f8ec';
      btnEl.style.color = '#008e31';
      btnEl.style.borderColor = '#00b53f';
    }

    // Immediately open phone dialer app
    window.location.href = `tel:${phone}`;
  }

  callLandlordDirect(propertyId) {
    // Gate: require sign-in to call landlord
    if (!(window.kejaAuth && window.kejaAuth.getSession())) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        window.kejaAuth.requireTenantAuth(() => this.callLandlordDirect(propertyId));
      }
      return;
    }
    const p = this.properties.find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;
    this.normalizeProperty(p);

    const phone = p.landlord?.phone || '+254792409540';
    window.location.href = `tel:${phone}`;
  }
  normalizeProperty(p) {
    if (!p) return p;

    // Enrich with SEED_PROPERTIES so all 7 photos, descriptions, amenities, and contact info are available
    const seed = (typeof SEED_PROPERTIES !== 'undefined' && Array.isArray(SEED_PROPERTIES))
      ? SEED_PROPERTIES.find(s => s.id === p.id || s.title === p.title)
      : null;

    if (seed) {
      if (!p.media || !Array.isArray(p.media) || p.media.length <= 1) {
        p.media = seed.media ? seed.media.map(m => ({ ...m })) : p.media;
      }
      p.photoCount = (p.media && p.media.length > 1) ? p.media.length : (seed.photoCount || seed.media?.length || 7);
      if (!p.description || p.description.length < 20) p.description = seed.description || p.description;
      if (!p.amenities || Object.keys(p.amenities).length === 0) p.amenities = { ...(seed.amenities || {}) };
      if (!p.landlord || !p.landlord.phone) p.landlord = { ...(seed.landlord || {}), ...(p.landlord || {}) };
      if (!p.exactLocation && seed.exactLocation) p.exactLocation = seed.exactLocation;
      if (p.latitude == null && seed.latitude != null) {
        p.latitude = seed.latitude;
        p.longitude = seed.longitude;
      }
      if (!p.waterSupplyType && seed.waterSupplyType) p.waterSupplyType = seed.waterSupplyType;
      if (!p.electricityMeterType && seed.electricityMeterType) p.electricityMeterType = seed.electricityMeterType;
      // Fix county/estateSuburb from seed if missing
      if (!p.county && seed.county) p.county = seed.county;
      if (!p.estateSuburb && seed.estateSuburb) p.estateSuburb = seed.estateSuburb;
    }

    // Ensure county always has a value
    if (!p.county) p.county = 'Nairobi';
    if (!p.estateSuburb) p.estateSuburb = p.county || 'Nairobi';
    if (!p.waterSupplyType) p.waterSupplyType = 'Council Water';
    if (!p.electricityMeterType) p.electricityMeterType = 'Prepaid (Tokens)';

    // Normalize landlord
    if (!p.landlord || typeof p.landlord !== 'object') {
      p.landlord = {
        name: p.landlordName || p.owner_name || 'Landlord',
        phone: p.landlordPhone || p.owner_phone || '+254792409540',
        whatsapp: p.landlordWhatsapp || p.owner_whatsapp || '+254792409540',
        memberSince: p.landlordSince || '2024',
        isVerified: p.isVerified || false,
        isAgency: p.managedBy === 'agency',
        id: p.landlordId || p.owner_id || null
      };
    }

    // Normalize amenities
    if (!p.amenities || typeof p.amenities !== 'object') {
      p.amenities = {};
    } else if (Array.isArray(p.amenities)) {
      const arr = p.amenities.map(a => String(a).toLowerCase());
      p.amenities = {
        hasBalcony: arr.includes('balcony'),
        hasParking: arr.includes('parking'),
        hasElectricFence: arr.includes('electric fence') || arr.includes('fence'),
        hasCctv: arr.includes('cctv') || arr.includes('security'),
        hasInternet: arr.includes('wifi') || arr.includes('internet'),
        hasTiles: arr.includes('tiles'),
        isMasterEnsuite: arr.includes('ensuite'),
        hasGym: arr.includes('gym'),
        hasSwimmingPool: arr.includes('pool') || arr.includes('swimming')
      };
    }

    // Normalize media array
    if (!p.media || !Array.isArray(p.media) || p.media.length === 0) {
      const defaultImg = p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
      p.media = [{ url: defaultImg, caption: p.title || 'Property photo' }];
    } else {
      p.media = p.media.map((m, i) => typeof m === 'string' ? { url: m, caption: `Photo ${i + 1} of ${p.title}` } : m);
    }

    p.photoCount = p.media.length;
    return p;
  }

  openPropertyDetail(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;
    this.normalizeProperty(p);

    // Normalize landlord — API listings may not have a landlord object
    if (!p.landlord || typeof p.landlord !== 'object') {
      p.landlord = {
        name: p.landlordName || p.owner_name || 'Landlord',
        phone: p.landlordPhone || p.owner_phone || '',
        whatsapp: p.landlordWhatsapp || p.owner_whatsapp || '',
        memberSince: p.landlordSince || '2024',
        isVerified: p.isVerified || false,
        isAgency: p.managedBy === 'agency',
        id: p.landlordId || p.owner_id || null
      };
    }

    // Normalize amenities
    if (!p.amenities || typeof p.amenities !== 'object') {
      p.amenities = {};
    } else if (Array.isArray(p.amenities)) {
      const arr = p.amenities.map(a => String(a).toLowerCase());
      p.amenities = {
        hasBalcony: arr.includes('balcony'),
        hasParking: arr.includes('parking'),
        hasElectricFence: arr.includes('electric fence') || arr.includes('fence'),
        hasCctv: arr.includes('cctv') || arr.includes('security'),
        hasInternet: arr.includes('wifi') || arr.includes('internet'),
        hasTiles: arr.includes('tiles'),
        isMasterEnsuite: arr.includes('ensuite'),
        hasGym: arr.includes('gym'),
        hasSwimmingPool: arr.includes('pool') || arr.includes('swimming')
      };
    }

    // Normalize media array
    if (!p.media || !Array.isArray(p.media) || p.media.length === 0) {
      const defaultImg = p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
      p.media = [{ url: defaultImg, caption: p.title || 'Property photo' }];
    } else {
      p.media = p.media.map(m => typeof m === 'string' ? { url: m, caption: p.title || 'Property photo' } : m);
    }

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
    const modalRentRaw = p.rentKes ?? p.rent ?? p.rent_kes ?? p.price ?? 0;
    const modalRent = typeof modalRentRaw === 'number' ? modalRentRaw : (parseFloat(String(modalRentRaw).replace(/[^0-9.]/g, '')) || 0);
    const modalDepositRaw = p.depositKes ?? p.deposit ?? p.deposit_kes ?? modalRent;
    const modalDeposit = typeof modalDepositRaw === 'number' ? modalDepositRaw : (parseFloat(String(modalDepositRaw).replace(/[^0-9.]/g, '')) || modalRent);

    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-price').textContent = `KSh ${modalRent.toLocaleString()} ${pricePeriod}`;
    document.getElementById('detail-modal-deposit').textContent = isBnb 
      ? `Short-Stay / Daily Booking (No Deposit Required)`
      : `Deposit: KSh ${modalDeposit.toLocaleString()}`;
    // Location & GPS Gating
    const isLoggedIn = !!(window.kejaAuth && window.kejaAuth.getSession());
    const locationEl = document.getElementById('detail-modal-location');
    const gpsBadge = document.getElementById('detail-gps-badge');

    if (isLoggedIn) {
      if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.exactLocation || (p.estateSuburb + ', ' + p.county)}`;
      if (gpsBadge) gpsBadge.textContent = (p.latitude != null && p.longitude != null)
        ? `GPS: ${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`
        : 'GPS: Coordinates not available';
    } else {
      if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.estateSuburb}, ${p.county} <span style="font-size:0.75rem; color:#64748b; margin-left:6px;"><i class="fas fa-lock"></i> Exact landmark & pin protected</span>`;
      if (gpsBadge) gpsBadge.textContent = 'GPS: Protected (Sign in to view)';
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
    const specVerifiedEl = document.getElementById('spec-verified');
    if (specVerifiedEl) {
      // Use enhanced verification if available
      if (window.KejaVerification) {
        specVerifiedEl.innerHTML = window.KejaVerification.generateVerificationBadge(p.landlord, p);
      } else {
        // Fallback to original verification display
        specVerifiedEl.innerHTML = p.landlord?.isVerified 
          ? `<span style="color:#059669;font-weight:700;background:#dcfce7;padding:4px 12px;border-radius:20px;font-size:0.8rem;">🛡️ KEJAMARKET VERIFIED</span>` 
          : '<span style="color:#64748b;">Direct Listing</span>';
      }
    }

    // Gallery
    this.currentPhotoIndex = 0;
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) {
      mainImg.src = p.media[0]?.url || '';
      mainImg.style.cursor = 'pointer';
      mainImg.onclick = (e) => {
        if (e) e.stopPropagation();
        this.openLightbox(e);
      };
    }
    this.updatePhotoCounter();
    this.setupGallerySwipe();

    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      if (isLoggedIn) {
        // All thumbs visible for signed-in users
        thumbsContainer.innerHTML = p.media.map((m, idx) => `
          <div class="detail-thumb ${idx === (this.currentPhotoIndex || 0) ? 'active' : ''}" onclick="app.selectDetailPhoto('${m.url}', this, ${idx})">
            <img src="${m.url}" alt="${m.caption || 'Photo'}">
          </div>
        `).join('');
      } else {
        // Guest: first thumb free, remaining locked behind sign-in
        const firstThumb = p.media[0];
        const lockedCount = p.media.length - 1;
        thumbsContainer.innerHTML = (firstThumb ? `
          <div class="detail-thumb active" onclick="kejaAuth.requireTenantAuth(()=>app.unlockDetailPhotos('${p.id}'))">
            <img src="${firstThumb.url}" alt="${firstThumb.caption || 'Photo'}">
          </div>
        ` : '') + (lockedCount > 0 ? `
          <div onclick="kejaAuth.requireTenantAuth(()=>app.unlockDetailPhotos('${p.id}'))" style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:10px;padding:10px 16px;cursor:pointer;min-width:120px;flex:1;border:2px dashed rgba(99,102,241,0.5);">
            <i class="fas fa-lock" style="color:#a5b4fc;font-size:1.1rem;"></i>
            <span style="color:#c7d2fe;font-weight:700;font-size:0.8rem;">${lockedCount} more photo${lockedCount > 1 ? 's' : ''}<br><span style="font-size:0.7rem;font-weight:500;color:#a5b4fc;">Sign in to view</span></span>
          </div>
        ` : '');
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
                <div style="flex: 1; min-width: 240px; border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); position: relative;">
                  <video src="${v.url || v}" ${v.poster ? `poster="${v.poster}"` : ''} controls playsinline controlsList="nodownload" oncontextmenu="return false;" style="width: 100%; max-height: 220px; object-fit: contain; display: block;"></video>
                  <div class="video-watermark-overlay" style="position: absolute; top: 10px; right: 10px; pointer-events: none; background: rgba(15, 23, 42, 0.85); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1.5px solid rgba(0, 181, 63, 0.85); box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10; font-family: 'Montserrat', 'Inter', sans-serif;">
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #00b53f; display: inline-block; box-shadow: 0 0 6px #00b53f;"></span>
                    kejamarket.co.ke
                  </div>
                  <div style="padding: 6px 10px; background: #1e1b4b; color: #c084fc; font-size: 0.75rem; font-weight: 600; display: flex; justify-content: space-between;">
                    <span><i class="fas fa-play-circle"></i> Video Tour #${i + 1}</span>
                    <span>${v.duration ? `Duration: ${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}` : 'Max 1m 30s'}</span>
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
        mgmtBadge.textContent = 'Managed by ' + (p.agencyName || p.landlord?.name || 'Agency');
        mgmtBadge.style.background = '#f3e8ff';
        mgmtBadge.style.color = '#7c3aed';
      } else {
        mgmtBadge.textContent = 'Direct Landlord';
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

    const contactName = isAgencyListing ? (p.agencyName || p.landlord?.name || 'Agency') : (p.landlord?.name || 'Landlord');
    const contactPhone = p.landlord?.phone || '+254792409540';

    if (landlordName) landlordName.textContent = contactName;
    if (landlordSince) landlordSince.textContent = `Member since ${p.landlord?.memberSince || '2024'}`;

    // Add enhanced verification details and trust score after landlord info
    if (window.KejaVerification) {
      const verificationContainer = document.getElementById('detail-verification-container');
      if (verificationContainer) {
        // Clear existing content
        verificationContainer.innerHTML = '';
        
        // Add verification details and trust score
        const verificationDetails = window.KejaVerification.generateVerificationDetails(p.landlord);
        const trustScore = window.KejaVerification.generateTrustScore(p.landlord);
        
        if (verificationDetails || trustScore) {
          verificationContainer.innerHTML = verificationDetails + trustScore;
        }
      }

      // Add enhanced property information
      const propertyInfoContainer = document.getElementById('enhanced-property-info-container');
      if (propertyInfoContainer) {
        propertyInfoContainer.innerHTML = window.KejaVerification.generateEnhancedPropertyInfo(p);
      }
    }

    if (isLoggedIn) {
      // Logged in: show real phone & enable call
      if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i><a href="tel:${contactPhone}" style="color:#0f172a;text-decoration:none;font-weight:700;">${contactPhone}</a>`;
      if (callBtn) {
        callBtn.href = `tel:${contactPhone}`;
        callBtn.removeAttribute('onclick');
        callBtn.style.opacity = '1';
        callBtn.style.pointerEvents = 'auto';
        callBtn.innerHTML = `<i class="fas fa-phone-alt"></i> Call ${isAgencyListing ? 'Agency' : (isBnb ? 'Host' : 'Landlord')} (${contactPhone})`;
      }
    } else {
      // Guest: mask phone number, prompt sign-in
      if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-lock" style="color:#94a3b8;margin-right:5px;"></i><span style="color:#94a3b8;font-weight:700;letter-spacing:2px;">+254 *** ***</span>&nbsp;<a href="#" onclick="event.preventDefault();kejaAuth.requireTenantAuth(()=>app.unlockDetailPhotos('${p.id}'))" style="color:#4f46e5;text-decoration:underline;font-weight:600;font-size:0.78rem;">Sign in to view</a>`;
      if (callBtn) {
        callBtn.href = '#';
        callBtn.setAttribute('onclick', `event.preventDefault(); kejaAuth.requireTenantAuth(()=>app.unlockDetailPhotos('${p.id}')); return false;`);
        callBtn.style.opacity = '0.65';
        callBtn.style.pointerEvents = 'auto';
        callBtn.innerHTML = `<i class="fas fa-lock"></i> Sign In to Call`;
      }
    }

    if (chatBtn) {
      chatBtn.onclick = () => {
        if (isLoggedIn) {
          app.openChatForCurrentProperty();
        } else {
          kejaAuth.requireTenantAuth(() => app.openChatForCurrentProperty());
        }
      };
      chatBtn.style.opacity = '1';
      chatBtn.style.pointerEvents = 'auto';
      chatBtn.innerHTML = `<i class="fas fa-comment-dots"></i> Message ${isAgencyListing ? 'Agency' : (isBnb ? 'Host' : 'Landlord')}`;
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
            caretakerCallBtn.style.opacity = '1';
            caretakerCallBtn.innerHTML = `<i class="fas fa-phone-alt"></i> Call Caretaker (${p.caretakerPhone || ''})`;
          } else {
            caretakerCallBtn.href = '#';
            caretakerCallBtn.setAttribute('onclick', `event.preventDefault(); kejaAuth.requireTenantAuth(()=>app.unlockDetailPhotos('${p.id}')); return false;`);
            caretakerCallBtn.style.opacity = '0.65';
            caretakerCallBtn.innerHTML = `<i class="fas fa-lock"></i> Sign In to Call`;
          }
        }
      } else {
        caretakerCard.style.display = 'none';
      }
    }

    // Google Maps Link + Map visibility — gated behind login
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

    const fraudDetails = document.getElementById('fraud-warning-details');
    const fraudToggleText = document.getElementById('fraud-toggle-text');
    const fraudToggleIcon = document.getElementById('fraud-toggle-icon');
    if (fraudDetails) fraudDetails.style.display = 'none';
    if (fraudToggleText) fraudToggleText.textContent = 'Safety Tips';
    if (fraudToggleIcon) fraudToggleIcon.style.transform = 'rotate(0deg)';

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
    // Gate: require sign-in to browse photos
    if (!(window.kejaAuth && window.kejaAuth.getSession())) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        const p = this.selectedPropertyForDetail;
        window.kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(p && p.id));
      }
      return;
    }
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
    // Gate: require sign-in to navigate photos
    if (!(window.kejaAuth && window.kejaAuth.getSession())) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        const _p = this.selectedPropertyForDetail;
        window.kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(_p && _p.id));
      }
      return;
    }
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + p.media.length) % p.media.length;
    this.showPhotoAtIndex(this.currentPhotoIndex);
  }

  nextDetailPhoto(event) {
    if (event) event.stopPropagation();
    // Gate: require sign-in to navigate photos
    if (!(window.kejaAuth && window.kejaAuth.getSession())) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        const _p = this.selectedPropertyForDetail;
        window.kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(_p && _p.id));
      }
      return;
    }
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

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
    // Gate: require sign-in to view fullscreen photos
    const _isLoggedInLB = !!(window.kejaAuth && window.kejaAuth.getSession());
    if (!_isLoggedInLB) {
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        window.kejaAuth.requireTenantAuth(() => this.openLightbox(null));
      }
      return;
    }
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

    if (landlordName) landlordName.textContent = p.landlord?.name || 'Landlord';
    if (landlordSince) landlordSince.textContent = `Member since ${p.landlord?.memberSince || 'N/A'}`;
    if (locationEl) locationEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.exactLocation || (p.estateSuburb + ', ' + p.county)}`;
    if (gpsBadge) gpsBadge.textContent = (p.latitude != null && p.longitude != null)
      ? `GPS: ${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`
      : 'GPS: Coordinates not available';
    if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i>${p.landlord?.phone || 'Contact via Chat'}`;
    if (callBtn) {
      callBtn.href = `tel:${p.landlord?.phone || ''}`;
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
      modal.style.setProperty('display', 'flex', 'important');
      if (modalId === 'modal-post-ad' && window.landlordManager && typeof window.landlordManager.initPostMap === 'function') {
        window.landlordManager.initPostMap();
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
    }
    // Stop chat polling when messages modal closes
    if (modalId === 'modal-messages') {
      this.stopChatPolling();
    }
  }

  
  focusMobileSearch() {
    const card = document.getElementById('mobile-filter-card-container');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openMobileFilterPicker(type) {
    this.toggleMobileFilters();
    if (type === 'location') this.toggleFilterSection('filter-sec-location', true);
    if (type === 'suburb') this.toggleFilterSection('filter-sec-suburb', true);
    if (type === 'type') this.toggleFilterSection('filter-sec-category', true);
    if (type === 'bedrooms') this.toggleFilterSection('filter-sec-bedrooms', true);
    if (type === 'price') this.toggleFilterSection('filter-sec-price', true);
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

  /* 
     IN-APP CHAT & INBOX MESSAGING SYSTEM
   */
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
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Can I schedule a viewing today?')">Book viewing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Is borehole water continuous 24/7?')">Water 24/7?</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('What is the deposit and token policy?')">Deposit policy</button>
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
      avatarEl.textContent = (prop.landlord?.name || 'Landlord').slice(0, 2).toUpperCase();
    }
    if (titleEl) {
      titleEl.textContent = prop.landlord?.name || 'Landlord';
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

    if (avatarEl) avatarEl.innerHTML = '<i class="fas fa-headset"></i>';
    if (titleEl) titleEl.innerHTML = '<i class="fas fa-headset" style="color: #00b53f; margin-right: 6px;"></i> KejaMarket Admin Support';
    if (subEl) subEl.textContent = 'Reach out directly to Admin · Prompt assistance & replies';
    if (banner) banner.style.display = 'none';
    if (input) input.placeholder = 'Type your message to KejaMarket Admin...';

    if (quickReplies) {
      quickReplies.innerHTML = `
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Need help listing my property')">Help listing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Payment or M-Pesa verification inquiry')">Payment issue</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('Report a fake or suspicious listing')">Report listing</button>
        <button type="button" class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0;" onclick="app.sendQuickReply('General inquiry regarding KejaMarket')">General inquiry</button>
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
              Ã°Å¸â€ºÂ¡Ã¯Â¸Â
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
      // No auto-reply — admin responds manually through the admin portal
      this.showToast('Message sent to KejaMarket Admin. We will respond via SMS shortly.', 'success');
    } else if (prop) {
      // No auto-reply — landlord replies manually through their portal
      this.showToast(`Message sent to ${prop.landlord?.name || 'landlord'}. They will reply shortly.`, 'info');
    }
  }

  // simulateLandlordReply removed — landlords reply manually

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
        // Silent fail — polling in background
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

  async loadServicesData() {
    try {
      const query = this.activeServiceCategory && this.activeServiceCategory !== 'All' 
        ? `?serviceType=${encodeURIComponent(this.activeServiceCategory)}`
        : '';
      
      const res = await fetch(`/api/services${query}`);
      if (res.ok) {
        const data = await res.json();
        this.services = data.services || [];
        console.log('Loaded services:', this.services.length);
      }
    } catch (err) {
      console.warn('Services fetch error:', err);
      this.services = [];
    }

    // Apply location filters to services
    let filteredServices = [...this.services];
    
    // Corridor filter
    if (this.activeServiceCorridor && this.activeServiceCorridor !== 'all') {
      filteredServices = filteredServices.filter(s => s.corridorId === this.activeServiceCorridor);
    }
    
    // Suburb filter
    if (this.activeServiceSuburb && this.activeServiceSuburb !== 'all') {
      filteredServices = filteredServices.filter(s => s.estateSuburb === this.activeServiceSuburb || s.location === this.activeServiceSuburb);
    }

    this.filteredProperties = filteredServices;
    this.renderListingsSummary();
    const gridEl = document.getElementById('property-grid');
    if (gridEl) gridEl.innerHTML = `<div class="empty-state-box"><p>Service rendering is coming soon.</p></div>`;
  }

  async loadMarketplaceData() {
    try {
      const params = new URLSearchParams();
      if (this.activeMarketplaceItem && this.activeMarketplaceItem !== 'All') {
        params.append('category', this.activeMarketplaceItem);
      }
      if (this.maxPrice && this.maxPrice < 100000) {
        params.append('maxPrice', this.maxPrice);
      }

      const res = await fetch(`/api/marketplace?${params}`);
      if (res.ok) {
        const data = await res.json();
        this.marketplaceItems = data.items || [];
        console.log('Loaded marketplace items:', this.marketplaceItems.length);
      }
    } catch (err) {
      console.warn('Marketplace fetch error:', err);
      this.marketplaceItems = [];
    }

    this.filteredProperties = this.marketplaceItems;
    this.renderListingsSummary();
    const gridEl = document.getElementById('property-grid');
    if (gridEl) gridEl.innerHTML = `<div class="empty-state-box"><p>Marketplace rendering is coming soon.</p></div>`;
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

  // 
  // POSTING HANDLERS - Services, Marketplace, Properties
  // 

  async submitServicePost(event) {
    event.preventDefault();
    
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!session) {
      this.showToast('Please login to post a service', 'error');
      return;
    }

    const serviceType = document.getElementById('service-type').value;
    const title = document.getElementById('service-title').value;
    const description = document.getElementById('service-description').value;
    const priceMin = parseInt(document.getElementById('service-price-min').value) || 0;
    const priceMax = parseInt(document.getElementById('service-price-max').value) || 0;
    const coverageArea = document.getElementById('service-area').value;
    const serviceHours = document.getElementById('service-hours').value;

    if (!serviceType || !title || !description) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const servicePhotosInput = document.getElementById('service-photos-input');
    const uploadedPhotos = (servicePhotosInput && servicePhotosInput._uploadedPhotos) ? servicePhotosInput._uploadedPhotos : [];
    const serviceVideoInput = document.getElementById('service-video-input');
    const uploadedVideo = (serviceVideoInput && serviceVideoInput._uploadedVideo) ? serviceVideoInput._uploadedVideo : null;

    const images = [...uploadedPhotos];
    if (uploadedVideo) images.push({ url: uploadedVideo.url, type: 'video', duration: uploadedVideo.duration, poster: uploadedVideo.poster });

    try {
      const token = window.kejaAuth.getToken();
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          serviceType,
          priceMin,
          priceMax,
          coverageArea,
          serviceHours,
          images
        })
      });

      const data = await res.json();
      if (data.success) {
        this.showToast('Service posted with photos & video tour!', 'info');
        document.getElementById('form-post-service').reset();
        if (servicePhotosInput) servicePhotosInput._uploadedPhotos = [];
        if (serviceVideoInput) serviceVideoInput._uploadedVideo = null;
        document.getElementById('service-photos-preview').innerHTML = '';
        document.getElementById('service-video-preview').innerHTML = '';
        this.closeModal('modal-post-service');
        this.loadServicesData();
      } else {
        this.showToast(data.message || 'Failed to post service', 'error');
      }
    } catch (err) {
      console.error('Service post error:', err);
      this.showToast('Error posting service: ' + err.message, 'error');
    }
  }

  async submitMarketplacePost(event) {
    event.preventDefault();
    
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!session) {
      this.showToast('Please login to post an item', 'error');
      return;
    }

    const category = document.getElementById('marketplace-category').value;
    const title = document.getElementById('marketplace-title').value;
    const description = document.getElementById('marketplace-description').value;
    const price = parseInt(document.getElementById('marketplace-price').value);
    const condition = document.getElementById('marketplace-condition').value;
    const isNegotiable = document.getElementById('marketplace-negotiable').checked;
    const locationSuburb = document.getElementById('marketplace-location').value;

    if (!category || !title || !description || !price || !condition) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const mktPhotosInput = document.getElementById('marketplace-photos-input');
    const uploadedPhotos = (mktPhotosInput && mktPhotosInput._uploadedPhotos) ? mktPhotosInput._uploadedPhotos : [];
    const mktVideoInput = document.getElementById('marketplace-video-input');
    const uploadedVideo = (mktVideoInput && mktVideoInput._uploadedVideo) ? mktVideoInput._uploadedVideo : null;

    const images = [...uploadedPhotos];
    if (uploadedVideo) images.push({ url: uploadedVideo.url, type: 'video', duration: uploadedVideo.duration, poster: uploadedVideo.poster });

    try {
      const token = window.kejaAuth.getToken();
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          price,
          condition,
          itemType: category,
          isNegotiable,
          locationSuburb,
          images
        })
      });

      const data = await res.json();
      if (data.success) {
        this.showToast('Item posted for sale with photos & video tour!', 'info');
        document.getElementById('form-post-marketplace').reset();
        if (mktPhotosInput) mktPhotosInput._uploadedPhotos = [];
        if (mktVideoInput) mktVideoInput._uploadedVideo = null;
        document.getElementById('marketplace-photos-preview').innerHTML = '';
        document.getElementById('marketplace-video-preview').innerHTML = '';
        this.closeModal('modal-post-marketplace');
        this.loadMarketplaceData();
      } else {
        this.showToast(data.message || 'Failed to post item', 'error');
      }
    } catch (err) {
      console.error('Marketplace post error:', err);
      this.showToast('Error posting item: ' + err.message, 'error');
    }
  }

  // ── SOCIAL SHARING ──────────────────────────────────────────────
  // All share methods are open to anyone — no auth required to share
  _getShareUrl(propertyId) {
    const base = window.location.origin + window.location.pathname;
    return `${base}?property=${encodeURIComponent(propertyId)}`;
  }

  _getShareText(p) {
    if (!p) return 'Check out this property on KejaMarket!';
    const price = p.rentKes ? `KSh ${Number(p.rentKes).toLocaleString()}` : '';
    const loc = p.estateSuburb || p.location || '';
    return `🏠 ${p.title}${loc ? ' – ' + loc : ''}${price ? ' | ' + price + '/mo' : ''} — Found on KejaMarket!`;
  }

  handleCardWhatsApp(propertyId, event) {
    if (event) event.stopPropagation();
    const p = this.properties.find(x => x.id === propertyId);
    const shareUrl = this._getShareUrl(propertyId);
    const text = this._getShareText(p) + '\n' + shareUrl;
    // On mobile, open WhatsApp directly; on desktop open WhatsApp Web
    const encodedText = encodeURIComponent(text);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = isMobile
      ? `whatsapp://send?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  handleCardFacebook(propertyId, event) {
    if (event) event.stopPropagation();
    const shareUrl = this._getShareUrl(propertyId);
    const p = this.properties.find(x => x.id === propertyId);
    const quote = encodeURIComponent(this._getShareText(p));
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
      '_blank', 'noopener,noreferrer,width=600,height=500'
    );
  }

  handleCardInstagram(propertyId, event) {
    if (event) event.stopPropagation();
    const shareUrl = this._getShareUrl(propertyId);
    const p = this.properties.find(x => x.id === propertyId);
    const shareText = this._getShareText(p) + '\n' + shareUrl;
    // Use Web Share API on mobile (shows native share sheet → user can pick Instagram)
    if (navigator.share) {
      navigator.share({
        title: p ? p.title : 'KejaMarket Listing',
        text: shareText,
        url: shareUrl
      }).catch(() => {/* user cancelled */});
    } else {
      // Desktop fallback: copy link + open Instagram
      const copyFn = navigator.clipboard
        ? navigator.clipboard.writeText(shareUrl)
        : Promise.resolve(this._fallbackCopy(shareUrl));
      copyFn.then ? copyFn.then(() => {}).catch(() => this._fallbackCopy(shareUrl)) : null;
      this.showToast('Link copied! Paste it in your Instagram story or bio.', 'success');
      setTimeout(() => window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer'), 600);
    }
  }

  handleCardTikTok(propertyId, event) {
    if (event) event.stopPropagation();
    const shareUrl = this._getShareUrl(propertyId);
    const p = this.properties.find(x => x.id === propertyId);
    const shareText = this._getShareText(p) + '\n' + shareUrl;
    // Use Web Share API on mobile (shows native share sheet → user can pick TikTok)
    if (navigator.share) {
      navigator.share({
        title: p ? p.title : 'KejaMarket Listing',
        text: shareText,
        url: shareUrl
      }).catch(() => {/* user cancelled */});
    } else {
      // Desktop fallback: copy link + open TikTok
      const copyFn = navigator.clipboard
        ? navigator.clipboard.writeText(shareUrl)
        : Promise.resolve(this._fallbackCopy(shareUrl));
      copyFn.then ? copyFn.then(() => {}).catch(() => this._fallbackCopy(shareUrl)) : null;
      this.showToast('Link copied! Paste it in your TikTok video description or bio.', 'success');
      setTimeout(() => window.open('https://www.tiktok.com/@kejamarket', '_blank', 'noopener,noreferrer'), 600);
    }
  }

  _fallbackCopy(text) {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch (e) { /* silent */ }
  }
  // ────────────────────────────────────────────────────────────────


  // -- SHARE POPOVER --------------------------------------------------------
  toggleShareMenu(propertyId, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('share-popover-' + propertyId);
    if (!popover) return;
    const isVisible = popover.style.display !== 'none';
    document.querySelectorAll('.card-share-popover').forEach(function(el) { el.style.display = 'none'; });
    if (!isVisible) popover.style.display = 'flex';
  }

  copyShareLink(propertyId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const self = this;
    const url = window.location.origin + '/?property=' + encodeURIComponent(propertyId);
    const done = function() { self.showToast('Link copied to clipboard!', 'success'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function() { self._fallbackCopy(url); done(); });
    } else { this._fallbackCopy(url); done(); }
    const popover = document.getElementById('share-popover-' + propertyId);
    if (popover) popover.style.display = 'none';
  }

  _fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(el);
  }

  // -- CLOSE ALL OPEN POPOVERS / DROPDOWNS ----------------------------------
  closeAllPopups() {
    document.querySelectorAll('.card-share-popover').forEach(function(el) { el.style.display = 'none'; });
    const postMenu = document.getElementById('header-post-menu');
    if (postMenu) postMenu.style.display = 'none';
    const locMenu = document.getElementById('header-location-menu');
    if (locMenu) locMenu.style.display = 'none';
  }
  updatePostButtonsVisibility() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const postAdBtn = document.getElementById('btn-header-post-ad');
    const postServiceBtn = document.getElementById('btn-header-post-service');
    const postMarketplaceBtn = document.getElementById('btn-header-post-marketplace');

    if (!session) {
      if (postAdBtn) postAdBtn.style.display = 'none';
      if (postServiceBtn) postServiceBtn.style.display = 'none';
      if (postMarketplaceBtn) postMarketplaceBtn.style.display = 'none';
      return;
    }

    const isLandlord = session.role === 'landlord' || session.role === 'agency';
    if (postAdBtn) postAdBtn.style.display = isLandlord ? 'block' : 'none';
    if (postServiceBtn) postServiceBtn.style.display = isLandlord ? 'block' : 'none';
    if (postMarketplaceBtn) postMarketplaceBtn.style.display = 'block';
  }

  // ══════════════════════════════════════════════════════════════════
  // RENT AFFORDABILITY CALCULATOR ("What Can I Afford?")
  // ══════════════════════════════════════════════════════════════════

  openAffordabilityCalculator() {
    this.closeAllPopups();
    this.openModal('modal-affordability-calculator');
    this.syncAffordability();
  }

  syncAffordability(sliderElem, type) {
    const incomeInput = document.getElementById('afford-net-income');
    const incomeSlider = document.getElementById('afford-income-slider');
    const incomeDisp = document.getElementById('afford-income-disp');

    const expensesInput = document.getElementById('afford-expenses');
    const expensesSlider = document.getElementById('afford-expenses-slider');
    const expensesDisp = document.getElementById('afford-expenses-disp');

    const savingsInput = document.getElementById('afford-savings');
    const savingsSlider = document.getElementById('afford-savings-slider');
    const savingsDisp = document.getElementById('afford-savings-disp');

    if (sliderElem && type === 'income') {
      incomeInput.value = sliderElem.value;
    } else if (incomeSlider && incomeInput) {
      incomeSlider.value = incomeInput.value;
    }

    if (sliderElem && type === 'expenses') {
      expensesInput.value = sliderElem.value;
    } else if (expensesSlider && expensesInput) {
      expensesSlider.value = expensesInput.value;
    }

    if (sliderElem && type === 'savings') {
      savingsInput.value = sliderElem.value;
    } else if (savingsSlider && savingsInput) {
      savingsSlider.value = savingsInput.value;
    }

    const income = Math.max(0, parseFloat(incomeInput.value) || 0);
    const expenses = Math.max(0, parseFloat(expensesInput.value) || 0);
    const savings = Math.max(0, parseFloat(savingsInput.value) || 0);

    if (incomeDisp) incomeDisp.textContent = 'KSh ' + income.toLocaleString('en-KE');
    if (expensesDisp) expensesDisp.textContent = 'KSh ' + expenses.toLocaleString('en-KE');
    if (savingsDisp) savingsDisp.textContent = 'KSh ' + savings.toLocaleString('en-KE');

    this.calculateAffordability(income, expenses, savings);
  }

  calculateAffordability(income, expenses, savings) {
    const rangeDisp = document.getElementById('afford-range-display');
    const badge = document.getElementById('afford-health-badge');
    const note = document.getElementById('afford-rule-note');

    const barRent = document.getElementById('bar-rent');
    const barExp = document.getElementById('bar-expenses');
    const barSav = document.getElementById('bar-savings');
    const barBuf = document.getElementById('bar-buffer');

    const pctRentEl = document.getElementById('pct-rent');
    const pctExpEl = document.getElementById('pct-expenses');
    const pctSavEl = document.getElementById('pct-savings');
    const pctBufEl = document.getElementById('pct-buffer');

    if (!income || income <= 0) {
      if (rangeDisp) rangeDisp.textContent = 'KSh 0';
      return;
    }

    // Standard Kenyan 25-30% prudent rule
    const safe30Pct = income * 0.30;
    const safe25Pct = income * 0.25;

    // Discretionary cashflow limit (after living expenses and savings)
    const discretionary = Math.max(0, income - expenses - savings);
    const cashFlowCeiling = discretionary * 0.75; // leave at least 25% of leftover as emergency cushion

    // Calculate realistic min & max
    let minRent = Math.round(Math.min(safe25Pct, discretionary * 0.5) / 500) * 500;
    let maxRent = Math.round(Math.min(safe30Pct, cashFlowCeiling) / 500) * 500;

    if (minRent < 3000) minRent = 3000;
    if (maxRent < minRent) maxRent = minRent + 2000;

    // Save for filter action
    this._calculatedRentMin = minRent;
    this._calculatedRentMax = maxRent;

    if (rangeDisp) {
      rangeDisp.textContent = `KSh ${minRent.toLocaleString('en-KE')} — ${maxRent.toLocaleString('en-KE')}`;
    }

    // Evaluate Financial Health
    const midRent = (minRent + maxRent) / 2;
    const rentRatio = midRent / income;
    const expenseRatio = expenses / income;
    const savingsRatio = savings / income;
    const bufferRatio = Math.max(0, 1 - (rentRatio + expenseRatio + savingsRatio));

    if (badge) {
      if (rentRatio <= 0.30 && bufferRatio >= 0.15) {
        badge.className = 'afford-health-pill comfort';
        badge.innerHTML = '<i class="fas fa-shield-alt"></i> Comfort Zone (Safe & Prudent)';
        if (note) note.textContent = 'Calculated within 25%–30% of take-home pay, with room for savings and unexpected emergencies.';
      } else if (rentRatio <= 0.38 && bufferRatio >= 0.05) {
        badge.className = 'afford-health-pill stretch';
        badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stretch Zone (Manageable)';
        if (note) note.textContent = 'Rent is slightly higher than ideal. You can afford this if non-essential lifestyle expenses are trimmed.';
      } else {
        badge.className = 'afford-health-pill risk';
        badge.innerHTML = '<i class="fas fa-exclamation-circle"></i> High Burden Risk';
        if (note) note.textContent = 'Living expenses take up a large share of your income. Consider looking for units under KSh ' + minRent.toLocaleString('en-KE') + '.';
      }
    }

    // Update stacked breakdown bar
    const pRent = Math.min(100, Math.round(rentRatio * 100));
    const pExp = Math.min(100 - pRent, Math.round(expenseRatio * 100));
    const pSav = Math.min(100 - pRent - pExp, Math.round(savingsRatio * 100));
    const pBuf = Math.max(0, 100 - pRent - pExp - pSav);

    if (barRent) barRent.style.width = pRent + '%';
    if (barExp) barExp.style.width = pExp + '%';
    if (barSav) barSav.style.width = pSav + '%';
    if (barBuf) barBuf.style.width = pBuf + '%';

    if (pctRentEl) pctRentEl.textContent = pRent + '%';
    if (pctExpEl) pctExpEl.textContent = pExp + '%';
    if (pctSavEl) pctSavEl.textContent = pSav + '%';
    if (pctBufEl) pctBufEl.textContent = pBuf + '%';
  }

  applyAffordabilityFilter() {
    const locSelect = document.getElementById('afford-location');
    const selectedLoc = locSelect ? locSelect.value : '';

    const minRent = this._calculatedRentMin || 15000;
    const maxRent = this._calculatedRentMax || 25000;

    // Apply to main filter inputs
    const minInput = document.getElementById('filter-price-min') || document.getElementById('price-min');
    const maxInput = document.getElementById('filter-price-max') || document.getElementById('price-max');
    if (minInput) minInput.value = minRent;
    if (maxInput) maxInput.value = maxRent;

    if (selectedLoc) {
      const searchInput = document.getElementById('header-search-input');
      if (searchInput) searchInput.value = selectedLoc;
      this.searchQuery = selectedLoc;
    }

    this.priceMin = minRent;
    this.priceMax = maxRent;

    this.closeModal('modal-affordability-calculator');

    // Trigger filter re-render
    if (typeof this.filterProperties === 'function') {
      this.filterProperties();
    } else if (typeof this.renderProperties === 'function') {
      this.renderProperties();
    }

    // Scroll to results
    const resultsElem = document.getElementById('properties-container') || document.getElementById('listings-container') || document.querySelector('.properties-grid');
    if (resultsElem) {
      resultsElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.showToast(`Showing rentals within KSh ${minRent.toLocaleString()} – ${maxRent.toLocaleString()}/mo`, 'success');
  }

  // ══════════════════════════════════════════════════════════════════
  // SIMILAR PROPERTY DEMAND ALERTS ("Recently Taken")
  // ══════════════════════════════════════════════════════════════════

  openSimilarAlertModal(propertyId, event) {
    if (event) event.stopPropagation();
    this.closeAllPopups();

    const p = (this.properties || []).find(item => item.id === propertyId);
    if (!p) {
      this.showToast('Property not found.', 'error');
      return;
    }

    // Populate modal fields
    const propIdEl = document.getElementById('similar-prop-id');
    const propCatEl = document.getElementById('similar-prop-category');
    const propLocEl = document.getElementById('similar-prop-location');
    const propBedsEl = document.getElementById('similar-prop-bedrooms');

    const previewThumb = document.getElementById('similar-preview-thumb');
    const previewTitle = document.getElementById('similar-preview-title');
    const previewSub = document.getElementById('similar-preview-sub');
    const previewPrice = document.getElementById('similar-preview-price');
    const budgetInput = document.getElementById('similar-alert-budget');
    const phoneInput = document.getElementById('similar-alert-phone');

    if (propIdEl) propIdEl.value = p.id;
    if (propCatEl) propCatEl.value = p.category || 'Rental';
    if (propLocEl) propLocEl.value = p.estateSuburb || p.location || 'Nairobi';
    if (propBedsEl) propBedsEl.value = p.bedrooms || 1;

    const rawPrice = p.rentKes ?? p.rent ?? p.price ?? 0;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);

    if (previewThumb) {
      previewThumb.src = p.media?.[0]?.url || p.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';
    }
    if (previewTitle) previewTitle.textContent = p.title || 'Apartment';
    if (previewSub) previewSub.textContent = `${p.estateSuburb || 'Nairobi'} · ${p.category || 'Rental'}`;
    if (previewPrice) previewPrice.textContent = `KSh ${numPrice.toLocaleString('en-KE')} / mo`;
    if (budgetInput) budgetInput.value = numPrice || '';

    // Auto-fill phone from user session if available
    const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function') ? window.kejaAuth.getSession() : null;
    if (session && session.phone && phoneInput && !phoneInput.value) {
      let clean = String(session.phone).replace(/^254|^0/, '');
      phoneInput.value = clean;
    }

    this.openModal('modal-similar-alert');
  }

  async submitSimilarAlert(e) {
    e.preventDefault();

    const phoneRaw = document.getElementById('similar-alert-phone').value.trim();
    const budgetRaw = document.getElementById('similar-alert-budget').value.trim();
    const emailRaw = document.getElementById('similar-alert-email').value.trim();
    const propId = document.getElementById('similar-prop-id').value;
    const category = document.getElementById('similar-prop-category').value;
    const location = document.getElementById('similar-prop-location').value;
    const bedrooms = document.getElementById('similar-prop-bedrooms').value;
    const propTitle = document.getElementById('similar-preview-title')?.textContent || 'Rental';
    const sendWa = document.getElementById('similar-ch-wa')?.checked ?? true;

    if (!phoneRaw) {
      this.showToast('Please enter your phone number.', 'error');
      return;
    }

    const btn = document.getElementById('btn-submit-similar-alert');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing to alerts...';
    }

    try {
      const res = await fetch('/api/alerts/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneRaw,
          email: emailRaw || null,
          propertyId: propId,
          propertyTitle: propTitle,
          location,
          category,
          bedrooms: parseInt(bedrooms) || 1,
          maxBudget: parseFloat(budgetRaw) || null,
          sendWhatsapp: sendWa
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.closeModal('modal-similar-alert');
        this.showToast(data.message || 'Alert set! Check your phone for confirmation SMS.', 'success');
      } else {
        this.showToast(data.message || 'Failed to register alert.', 'error');
      }
    } catch (err) {
      console.error('Similar alert submission error:', err);
      this.showToast('Network error while setting alert.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bell" style="color: #f59e0b;"></i> Set Instant Alert (100% Free)';
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 3-DAY HOUSE HUNT CONCIERGE SERVICE
  // ══════════════════════════════════════════════════════════════════

  openHouseHuntModal() {
    this.closeAllPopups();

    // Check if user already has an active hunt
    const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function') ? window.kejaAuth.getSession() : null;
    if (session && localStorage.getItem('keja_active_hunt_id')) {
      const activeHuntId = localStorage.getItem('keja_active_hunt_id');
      this.openHuntTracker(activeHuntId);
      return;
    }

    // Pre-fill phone from session
    if (session && session.phone) {
      const phoneInput = document.getElementById('hunt-phone');
      if (phoneInput && !phoneInput.value) {
        phoneInput.value = String(session.phone).replace(/^254|^0/, '');
      }
    }

    this.openModal('modal-house-hunt');
  }

  async submitHouseHuntRequest(e) {
    e.preventDefault();

    const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function') ? window.kejaAuth.getSession() : null;
    const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');

    if (!session || !token) {
      this.showToast('Please sign in first to start a House Hunt.', 'info');
      this.openAuthModal('login');
      return;
    }

    const locationsRaw = document.getElementById('hunt-locations').value.trim();
    const budgetMin = parseFloat(document.getElementById('hunt-budget-min').value) || 0;
    const budgetMax = parseFloat(document.getElementById('hunt-budget-max').value) || 0;
    const propertyType = document.getElementById('hunt-property-type').value;
    const bedrooms = parseInt(document.getElementById('hunt-bedrooms').value) || 0;
    const moveInDate = document.getElementById('hunt-movein').value;
    const furnished = document.getElementById('hunt-furnished').value;
    const notes = document.getElementById('hunt-notes').value.trim();
    const phone = document.getElementById('hunt-phone').value.trim();

    const amenities = Array.from(document.querySelectorAll('input[name="hunt-amenity"]:checked')).map(cb => cb.value);

    if (!locationsRaw) {
      this.showToast('Please provide at least one preferred location.', 'error');
      return;
    }
    if (!budgetMin || !budgetMax) {
      this.showToast('Please specify a min and max budget.', 'error');
      return;
    }

    const preferredLocations = locationsRaw.split(',').map(s => s.trim()).filter(Boolean);

    const btn = document.getElementById('btn-submit-hunt');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing 3-Day Hunt...';
    }

    try {
      // Step 1: Create the Hunt record
      const res = await fetch('/api/house-hunt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredLocations,
          budgetMin,
          budgetMax,
          propertyType,
          bedrooms,
          moveInDate: moveInDate || null,
          furnished,
          amenities,
          otherPreferences: notes,
          paymentAmount: 2000
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.existingHuntId) {
          localStorage.setItem('keja_active_hunt_id', data.existingHuntId);
          this.closeModal('modal-house-hunt');
          this.openHuntTracker(data.existingHuntId);
          return;
        }
        throw new Error(data.message || 'Could not create House Hunt');
      }

      const hunt = data.hunt;
      localStorage.setItem('keja_active_hunt_id', hunt.id);

      // Step 2: Trigger M-Pesa Payment STK Push
      if (btn) btn.innerHTML = '<i class="fas fa-mobile-alt"></i> Sending M-Pesa STK Push...';
      const payRes = await fetch(`/api/house-hunt/${hunt.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      });

      const payData = await payRes.json();
      this.closeModal('modal-house-hunt');

      if (payData.hasDaraja) {
        this.showToast(payData.message || 'M-Pesa prompt sent to your phone. Enter PIN to activate!', 'info', 8000);
        // Start polling for payment activation
        this.pollHuntPaymentStatus(hunt.id, payData.checkoutRequestId);
      } else {
        // Fallback Paybill
        this.showToast(`Pay KSh 2,000 via Paybill ${payData.paybill || '4165507'}, Account: ${payData.account || 'HOUSEHUNT'}`, 'info', 10000);
      }

      // Open live tracker immediately
      this.openHuntTracker(hunt.id);

    } catch (err) {
      console.error('House Hunt submission error:', err);
      this.showToast(err.message || 'Failed to initialize House Hunt.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bolt"></i> Start 3-Day House Hunt (KSh 2,000)';
      }
    }
  }

  async pollHuntPaymentStatus(huntId, checkoutRequestId) {
    const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');
    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }

      try {
        const res = await fetch(`/api/house-hunt/${huntId}/payment-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.activated) {
          clearInterval(interval);
          this.showToast('🎉 House Hunt ACTIVATED! Your 72-hour dedicated search has officially started.', 'success', 8000);
          this.openHuntTracker(huntId);
        }
      } catch (e) { /* ignore */ }
    }, 4000);
  }

  async openHuntTracker(huntId) {
    this.closeAllPopups();
    this.openModal('modal-hunt-tracker');

    const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');
    this._currentActiveHuntId = huntId;

    try {
      const res = await fetch(`/api/house-hunt/${huntId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not load hunt');
      }

      this.renderHuntTracker(data);
    } catch (err) {
      console.error('Hunt tracker load error:', err);
      this.showToast('Error loading hunt details.', 'error');
    }
  }

  renderHuntTracker(data) {
    const hunt = data.hunt;
    const properties = data.properties || [];
    const messages = data.messages || [];

    const huntIdEl = document.getElementById('tracker-hunt-id');
    const statusDesc = document.getElementById('hunt-status-desc');
    const foundCount = document.getElementById('hunt-found-count');

    if (huntIdEl) huntIdEl.textContent = `Hunt ID: #${hunt.id.slice(-6).toUpperCase()} · Budget KSh ${(hunt.budgetMin||0).toLocaleString()} - ${(hunt.budgetMax||0).toLocaleString()}`;
    if (foundCount) foundCount.textContent = properties.length;

    // Start Live Clock
    if (hunt.expiresAt) {
      this.startHuntCountdown(new Date(hunt.expiresAt).getTime());
    } else {
      const clockDigits = document.getElementById('hunt-clock-digits');
      if (clockDigits) clockDigits.textContent = '72h : 00m : 00s (Pending Payment)';
    }

    // Update Stepper
    const stepper = document.getElementById('hunt-stepper-nodes');
    if (stepper) {
      const statusMap = {
        'PAYMENT_PENDING': 1,
        'REQUIREMENTS_REVIEW': 1,
        'ACTIVE': 2,
        'SEARCHING': 2,
        'PROPERTIES_FOUND': 3,
        'VIEWING_ARRANGED': 4,
        'CUSTOMER_REVIEWING': 4,
        'COMPLETED': 5
      };
      const activeStep = statusMap[hunt.status] || 2;
      stepper.querySelectorAll('.hunt-step-node').forEach(node => {
        const stepNum = parseInt(node.dataset.step);
        node.classList.toggle('done', stepNum < activeStep);
        node.classList.toggle('active', stepNum === activeStep);
      });
    }

    // Render Curated Properties
    const propsList = document.getElementById('hunt-properties-list');
    if (propsList) {
      if (properties.length === 0) {
        propsList.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <i class="fas fa-search-location" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 10px;"></i>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #1e293b; margin-bottom: 6px;">Agent Is Hunting Units For You</h4>
            <p style="font-size: 0.85rem; color: #64748b; max-width: 420px; margin: 0 auto;">
              Verified matches in ${(hunt.preferredLocations || []).join(', ')} will appear here as soon as our agent checks them on the ground.
            </p>
          </div>
        `;
      } else {
        propsList.innerHTML = properties.map(p => `
          <div style="display: flex; gap: 14px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">
                  <i class="fas fa-check-circle"></i> Verified
                </span>
                ${p.viewing_status === 'arranged' ? '<span style="background:#fef08a; color:#854d0e; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px;"><i class="fas fa-calendar-alt"></i> Viewing Arranged</span>' : ''}
              </div>
              <h4 style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${p.property_title}</h4>
              <div style="font-size: 0.82rem; color: #64748b;">📍 ${p.property_location} · ${p.property_bedrooms ? p.property_bedrooms + ' Bed' : ''}</div>
              ${p.admin_note ? `<div style="font-size: 0.78rem; color: #334155; margin-top: 6px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border-left: 3px solid #059669;"><strong>Agent Note:</strong> ${p.admin_note}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #059669;">KSh ${Number(p.property_price||0).toLocaleString('en-KE')}</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px;">per month</div>
              ${p.property_id ? `<button type="button" class="btn-primary" onclick="app.openPropertyDetail('${p.property_id}')" style="background:#0f172a; padding:6px 14px; font-size:0.8rem; font-weight:700; border-radius:6px; border:none; color:white; cursor:pointer;">View Listing</button>` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Render Messages
    const chatBox = document.getElementById('hunt-chat-messages');
    if (chatBox) {
      chatBox.innerHTML = messages.map(m => `
        <div style="align-self: ${m.sender_id === hunt.customer_id ? 'flex-end' : 'flex-start'}; background: ${m.sender_id === hunt.customer_id ? '#059669' : '#e2e8f0'}; color: ${m.sender_id === hunt.customer_id ? '#ffffff' : '#0f172a'}; padding: 8px 12px; border-radius: 10px; font-size: 0.84rem; max-width: 80%;">
          <div style="font-size: 0.7rem; font-weight: 800; opacity: 0.85; margin-bottom: 2px;">${m.sender_name || 'Agent'}</div>
          ${m.text || m.message_content || ''}
        </div>
      `).join('');
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  startHuntCountdown(expiresAtMs) {
    if (this._huntClockInterval) clearInterval(this._huntClockInterval);

    const updateClock = () => {
      const now = Date.now();
      const diff = Math.max(0, expiresAtMs - now);
      const clockDigits = document.getElementById('hunt-clock-digits');
      if (!clockDigits) return;

      if (diff <= 0) {
        clockDigits.textContent = '00h : 00m : 00s (Search Period Ended)';
        clockDigits.style.color = '#ef4444';
        clearInterval(this._huntClockInterval);
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSecs % 60).padStart(2, '0');

      clockDigits.textContent = `${hours}h : ${mins}m : ${secs}s`;
    };

    updateClock();
    this._huntClockInterval = setInterval(updateClock, 1000);
  }

  switchHuntTrackerTab(tab) {
    const btnProps = document.getElementById('btn-tab-hunt-props');
    const btnChat = document.getElementById('btn-tab-hunt-chat');
    const paneProps = document.getElementById('hunt-pane-props');
    const paneChat = document.getElementById('hunt-pane-chat');

    if (tab === 'props') {
      if (btnProps) { btnProps.classList.add('active'); btnProps.style.borderBottomColor = '#059669'; btnProps.style.color = '#064e3b'; }
      if (btnChat) { btnChat.classList.remove('active'); btnChat.style.borderBottomColor = 'transparent'; btnChat.style.color = '#64748b'; }
      if (paneProps) paneProps.style.display = 'block';
      if (paneChat) paneChat.style.display = 'none';
    } else {
      if (btnChat) { btnChat.classList.add('active'); btnChat.style.borderBottomColor = '#059669'; btnChat.style.color = '#064e3b'; }
      if (btnProps) { btnProps.classList.remove('active'); btnProps.style.borderBottomColor = 'transparent'; btnProps.style.color = '#64748b'; }
      if (paneProps) paneProps.style.display = 'none';
      if (paneChat) paneChat.style.display = 'block';
    }
  }

  async sendHuntChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('hunt-chat-input');
    const text = input ? input.value.trim() : '';
    if (!text || !this._currentActiveHuntId) return;

    const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');

    try {
      const res = await fetch(`/api/house-hunt/${this._currentActiveHuntId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        input.value = '';
        // Refresh tracker
        this.openHuntTracker(this._currentActiveHuntId);
      } else {
        this.showToast(data.message || 'Failed to send message.', 'error');
      }
    } catch (err) {
      console.error('Chat error:', err);
    }
  }

  // ── Mobile-specific utility methods ──────────────────────────────
  focusMobileSearch() {
    // On mobile, scroll to top and focus the desktop search input,
    // or open the sidebar filters section
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  openMobileFilterPicker(filterType) {
    // Open the sidebar filters panel in mobile slide-in mode
    const sidebar = document.getElementById('sidebar-filters');
    if (sidebar) {
      sidebar.classList.add('mobile-open');
      // Add backdrop
      let backdrop = document.getElementById('mobile-sidebar-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobile-sidebar-backdrop';
        backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1499;';
        backdrop.onclick = () => {
          sidebar.classList.remove('mobile-open');
          backdrop.remove();
        };
        document.body.appendChild(backdrop);
      }
      // Scroll to the relevant section
      const sectionMap = {
        location: 'filter-sec-location',
        suburb: 'filter-sec-suburb',
        type: 'filter-sec-type',
        bedrooms: 'filter-sec-amenities',
        price: 'filter-sec-price'
      };
      const sectionId = sectionMap[filterType];
      if (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
      }
    }
  }

  toggleMobileFilters() {
    this.openMobileFilterPicker('location');
  }

}

// Global instance
window.app = new NairobiRentalsApp();
var app = window.app;

function installPWAInstantly() {
  if (window.deferredPWAPrompt) {
    window.deferredPWAPrompt.prompt();
    window.deferredPWAPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        if (window.app && window.app.showToast) window.app.showToast('App installation started!', 'success');
      }
      window.deferredPWAPrompt = null;
    });
  } else {
    if (window.app && window.app.showToast) {
      window.app.showToast('To install: Tap browser menu and select "Add to Home Screen".', 'info');
    } else {
      alert('To install: Tap browser menu and select "Add to Home Screen".');
    }
  }
}
window.installPWAInstantly = installPWAInstantly;

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
  // Automatically open shared property if URL has ?property=xyz
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPropId = urlParams.get('property') || urlParams.get('prop') || urlParams.get('p');
    if (sharedPropId) {
      setTimeout(() => {
        if (window.app && typeof window.app.openPropertyDetail === 'function') {
          window.app.openPropertyDetail(sharedPropId);
        }
      }, 600);
    }
  } catch (e) {
    console.error('Error checking shared property URL:', e);
  }

});

// Global popup dismissal on click outside
document.addEventListener('click', function kejaGlobalPopupCloser(e) {
  if (window.app && typeof window.app.closeAllPopups === 'function') {
    if (!e.target.closest('.header-post-dropdown-wrapper') &&
        !e.target.closest('.header-location-picker') &&
        !e.target.closest('.card-share-wrap')) {
      window.app.closeAllPopups();
    }
  }
});
