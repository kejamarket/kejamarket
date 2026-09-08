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
        if (data.success && Array.isArray(data.properties) && data.properties.length > 0) {
          this.properties = data.properties;
        }
      }
    } catch (err) {
      console.log('Using seed properties (offline fallback)');
    }
  }

  // Alias called by admin.js after listing boost/delete
  async loadProperties() {
    await this.fetchLiveProperties();
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
    if (this.favorites.has(propertyId)) {
      this.favorites.delete(propertyId);
      this.showToast('Removed from saved favorites', 'info');
    } else {
      this.favorites.add(propertyId);
      this.showToast('Saved to your favorites! ❤️', 'success');
    }
    this.saveFavorites();
    this.applyFilters();
  }

  renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    const allPill = `<button class="category-pill active" data-category="All" onclick="app.setCategory('All', this)"><i class="fas fa-th-large"></i> All Properties</button>`;
    const pills = MASTER_CATEGORIES.map(cat => {
      let icon = 'fa-home';
      if (cat.includes('BnB') || cat.includes('Airbnb')) icon = 'fa-bed';
      if (cat.includes('Villa') || cat.includes('Vacation')) icon = 'fa-umbrella-beach';
      if (cat.includes('Bedsitter') || cat.includes('Single')) icon = 'fa-door-open';
      if (cat.includes('Maisonette') || cat.includes('Townhouse')) icon = 'fa-building';
      if (cat.includes('Penthouse') || cat.includes('Serviced')) icon = 'fa-crown';

      return `<button class="category-pill" data-category="${cat}" onclick="app.setCategory('${cat}', this)"><i class="fas ${icon}"></i> ${cat}</button>`;
    }).join('');

    container.innerHTML = allPill + pills;

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
    
    // Update pills active class
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(p => {
      if (p.getAttribute('data-category') === categoryName) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
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

  setupEventListeners() {
    // Search form in header
    const searchForm = document.getElementById('header-search-form');
    const searchInput = document.getElementById('header-search-input');
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.searchQuery = searchInput.value.trim();
        this.currentPage = 1;
        this.applyFilters();
      });

      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.applyFilters();
      });
    }

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

      // Search query filter (matches title, description, suburb, county)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchEstate = p.estateSuburb.toLowerCase().includes(q);
        const matchCounty = p.county.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEstate && !matchCounty) return false;
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
    if (this.activeSuburb !== 'all') {
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
    const isTaken = p.isTaken || p.status === 'taken';
    const pricePeriod = isBnb ? '/ night' : '/ month';
    
    // WhatsApp click-to-chat text
    const waText = encodeURIComponent(`Hello, I am inquiring about your listing: "${p.title}" (KSh ${p.rentKes.toLocaleString()}${pricePeriod}) on Nairobi Rentals Live.`);
    const waPhone = p.landlord.whatsapp.replace(/[^0-9]/g, '');

    return `
      <div class="property-card ${isTaken ? 'property-card-taken' : ''}" data-id="${p.id}">
        <div class="card-media-wrapper" onclick="app.openPropertyDetail('${p.id}')">
          <img src="${thumbnail}" alt="${p.title}" loading="lazy" style="${isTaken ? 'filter: grayscale(50%) opacity(0.8);' : ''}">
          
          <div class="card-badges-top">
            ${isTaken ? '<span class="badge-taken" style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 0.75rem;"><i class="fas fa-ban"></i> TAKEN / OCCUPIED</span>' : ''}
            ${isBnb ? '<span class="badge-top-ad" style="background: #ff5a5f;"><i class="fas fa-bed"></i> BNB / AIRBNB</span>' : (p.isTopAd ? '<span class="badge-top-ad"><i class="fas fa-bolt"></i> TOP AD</span>' : '')}
            ${p.landlord.isVerified ? '<span class="badge-verified-landlord"><i class="fas fa-shield-alt"></i> VERIFIED</span>' : ''}
          </div>

          <button class="btn-favorite-heart ${isFav ? 'active' : ''}" onclick="app.toggleFavorite('${p.id}', event)" title="Save to Favorites">
            <i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i>
          </button>

          <span class="card-watermark"><i class="fas fa-home"></i> NAIROBI RENTALS LIVE</span>
          <span class="card-photo-count"><i class="fas fa-camera"></i> ${photoCount} Photos</span>
        </div>

        <div class="card-content">
          <div class="card-price-row">
            <div class="card-price" style="${isTaken ? 'color: #64748b;' : ''}">KSh ${p.rentKes.toLocaleString()} <span class="period">${pricePeriod}</span></div>
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
                <i class="fas fa-phone-alt"></i> ${isBnb ? 'Call Host' : 'Call'}
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
    const isTaken = p.isTaken || p.status === 'taken';
    const pricePeriod = isBnb ? '/ night' : '/ month';

    // Taken Status Banner & Control Bar
    const takenBanner = document.getElementById('detail-taken-banner');
    const statusPill = document.getElementById('detail-status-pill');
    const toggleBtn = document.getElementById('btn-toggle-taken-status');

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
    document.getElementById('spec-garbage').textContent = isBnb ? 'Free Cleaning' : (p.garbageFeeKes ? `KSh ${p.garbageFeeKes}/mo` : 'Included');
    document.getElementById('spec-verified').innerHTML = p.landlord.isVerified 
      ? `<span style="color:#1976d2;"><i class="fas fa-check-circle"></i> ${isBnb ? 'Superhost' : 'Verified Landlord'}</span>` 
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

    // Landlord & Contacts
    const phoneDisplay = document.getElementById('detail-landlord-phone-display');
    const landlordName = document.getElementById('detail-landlord-name');
    const landlordSince = document.getElementById('detail-landlord-since');
    const callBtn = document.getElementById('detail-btn-call');
    const chatBtn = document.getElementById('detail-btn-inbox-chat');

    if (isLoggedIn) {
      // Full access
      if (landlordName) landlordName.textContent = p.landlord.name;
      if (landlordSince) landlordSince.textContent = `Member since ${p.landlord.memberSince}`;
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
    } else {
      // Protected
      if (landlordName) landlordName.innerHTML = `<i class="fas fa-user-shield" style="color:#00b53f;margin-right:6px;"></i><span style="color:#64748b;">Landlord Details Protected</span>`;
      if (landlordSince) landlordSince.textContent = 'Sign in or create free account to view contact details';
      if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-lock" style="color:#94a3b8;margin-right:5px;"></i><span style="color:#94a3b8;letter-spacing:1px;">+254 7•• ••• ••• (Sign in to view)</span>`;
      if (callBtn) {
        callBtn.href = '#';
        callBtn.setAttribute('onclick', `event.preventDefault(); app.callLandlordDirect('${p.id}'); return false;`);
        callBtn.style.opacity = '0.9';
        callBtn.innerHTML = '<i class="fas fa-lock"></i> Sign In to Call';
      }
      if (chatBtn) {
        chatBtn.onclick = (e) => { e.preventDefault(); kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(p.id)); };
        chatBtn.style.opacity = '0.85';
        chatBtn.innerHTML = '<i class="fas fa-lock"></i> Sign In to Message';
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

    // Auto-focus message input
    setTimeout(() => {
      const input = document.getElementById('chat-message-input');
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
      this.openModal('modal-messages');
    }
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const propId = this.activeChatProperty ? this.activeChatProperty.id : null;
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

    // Filter relevant messages
    let msgs = this.chatMessages;
    if (propId) {
      msgs = this.chatMessages.filter(m => m.propertyId === propId);
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

    const newMsg = {
      id: 'msg-' + Date.now(),
      propertyId: prop ? prop.id : null,
      propertyTitle: prop ? prop.title : '',
      estateSuburb: prop ? prop.estateSuburb : '',
      recipientId: prop ? prop.landlord.id : null,
      recipientName: prop ? prop.landlord.name : 'Landlord',
      senderId: session ? session.id : 'me',
      senderName: session ? session.name : 'Tenant',
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

    // Landlord Auto-Reply Simulation for realistic instant response
    if (prop) {
      this.simulateLandlordReply(text, prop);
    }
  }

  simulateLandlordReply(tenantText, prop) {
    setTimeout(() => {
      let replyText = `Hello! Thank you for inquiring about ${prop.title}. The house is available for viewing today.`;
      
      const lower = tenantText.toLowerCase();
      if (lower.includes('water')) {
        replyText = `Yes, water is supplied via ${prop.waterSupplyType} with overhead storage tanks. Always running!`;
      } else if (lower.includes('view') || lower.includes('book') || lower.includes('schedule')) {
        replyText = `You are welcome for a viewing today! You can reach me at ${prop.landlord.phone} once you arrive at ${prop.estateSuburb}.`;
      } else if (lower.includes('deposit') || lower.includes('token') || lower.includes('rent')) {
        replyText = `Rent is KSh ${prop.rentKes.toLocaleString()}/month, deposit is KSh ${prop.depositKes.toLocaleString()}, and electricity is ${prop.electricityMeterType}.`;
      }

      const replyMsg = {
        id: 'reply-' + Date.now(),
        propertyId: prop.id,
        propertyTitle: prop.title,
        estateSuburb: prop.estateSuburb,
        recipientId: 'me',
        recipientName: 'Tenant',
        senderId: prop.landlord.id,
        senderName: prop.landlord.name,
        isSenderMe: false,
        text: replyText,
        createdAt: new Date().toISOString()
      };

      this.chatMessages.push(replyMsg);
      this.saveChatMessages();
      this.renderChatMessages();
      this.showToast(`💬 New reply from ${prop.landlord.name}`, 'info');
    }, 1500);
  }

  loadChatMessages() {
    const saved = localStorage.getItem('kejamarket_chat_messages');
    if (saved) {
      try {
        this.chatMessages = JSON.parse(saved);
      } catch (e) {
        this.chatMessages = [];
      }
    } else {
      // Default initial welcome conversations
      this.chatMessages = [
        {
          id: 'seed-msg-1',
          propertyId: 'prop-nrb-001',
          propertyTitle: 'Executive 2 Bedroom in Ruaka',
          estateSuburb: 'Ruaka',
          senderId: 'usr-landlord-01',
          senderName: 'James Mwangi',
          isSenderMe: false,
          text: 'Hello! The house is available for viewing today between 10am and 5pm. Borehole water is running 24/7.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  }

  saveChatMessages() {
    localStorage.setItem('kejamarket_chat_messages', JSON.stringify(this.chatMessages));
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

    const newStatus = !(p.isTaken || p.status === 'taken');

    try {
      const res = await fetch(`/api/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTaken: newStatus, status: newStatus ? 'taken' : 'available' })
      });

      if (res.ok) {
        const data = await res.json();
        p.isTaken = newStatus;
        p.status = newStatus ? 'taken' : 'available';
        this.showToast(data.message || `Status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}!`, 'success');
      } else {
        p.isTaken = newStatus;
        p.status = newStatus ? 'taken' : 'available';
        this.showToast(`Status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}!`, 'success');
      }
    } catch (err) {
      p.isTaken = newStatus;
      p.status = newStatus ? 'taken' : 'available';
      this.showToast(`Status updated to ${newStatus ? 'TAKEN / OCCUPIED' : 'VACANT / AVAILABLE'}!`, 'info');
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
}

// Global instance
window.app = new NairobiRentalsApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
