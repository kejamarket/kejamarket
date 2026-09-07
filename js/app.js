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
  }

  init() {
    this.loadFavorites();
    this.renderCategoryPills();
    this.populateSidebarFilters();
    this.setupEventListeners();
    this.applyFilters();

    // Init map and landlord managers
    window.mapController.init();
    window.landlordManager.initModal();

    // Show initial map pins
    setTimeout(() => {
      window.mapController.renderPins(this.filteredProperties);
    }, 300);
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
    const pricePeriod = isBnb ? '/ night' : '/ month';
    
    // WhatsApp click-to-chat text
    const waText = encodeURIComponent(`Hello, I am inquiring about your listing: "${p.title}" (KSh ${p.rentKes.toLocaleString()}${pricePeriod}) on Nairobi Rentals Live.`);
    const waPhone = p.landlord.whatsapp.replace(/[^0-9]/g, '');

    return `
      <div class="property-card" data-id="${p.id}">
        <div class="card-media-wrapper" onclick="app.openPropertyDetail('${p.id}')">
          <img src="${thumbnail}" alt="${p.title}" loading="lazy">
          
          <div class="card-badges-top">
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
            <div class="card-price">KSh ${p.rentKes.toLocaleString()} <span class="period">${pricePeriod}</span></div>
          </div>

          <h3 class="card-title" onclick="app.openPropertyDetail('${p.id}')" title="${p.title}">
            ${p.title}
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
            <button class="btn-card-call" onclick="app.revealLandlordPhone('${p.id}', this)">
              <i class="fas fa-phone-alt"></i> ${isBnb ? 'Call Host' : 'Call'}
            </button>
            <a class="btn-card-whatsapp" href="https://wa.me/${waPhone}?text=${waText}" target="_blank" rel="noopener">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
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
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    btnEl.innerHTML = `<i class="fas fa-phone"></i> ${p.landlord.phone}`;
    btnEl.style.background = '#e6f8ec';
    btnEl.style.color = '#008e31';
    btnEl.style.borderColor = '#00b53f';
  }

  openPropertyDetail(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.selectedPropertyForDetail = p;
    const isBnb = p.isBnb || p.category.includes('BnB') || p.category.includes('Airbnb') || p.category.includes('Villa') || p.rentPeriod === 'night';
    const pricePeriod = isBnb ? '/ night' : '/ month';

    // Set modal title & price
    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-price').textContent = `KSh ${p.rentKes.toLocaleString()} ${pricePeriod}`;
    document.getElementById('detail-modal-deposit').textContent = isBnb 
      ? `Short-Stay / Daily Booking (No Deposit Required)`
      : `Deposit: KSh ${p.depositKes ? p.depositKes.toLocaleString() : p.rentKes.toLocaleString()}`;
    document.getElementById('detail-modal-location').innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${p.exactLocation || p.estateSuburb + ', ' + p.county}`;
    document.getElementById('detail-modal-desc').textContent = p.description;

    // GPS badge
    const gpsBadge = document.getElementById('detail-gps-badge');
    if (gpsBadge) {
      gpsBadge.textContent = `GPS: ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`;
    }

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
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) mainImg.src = p.media[0]?.url || '';

    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => `
        <div class="detail-thumb ${idx === 0 ? 'active' : ''}" onclick="app.selectDetailPhoto('${m.url}', this)">
          <img src="${m.url}" alt="${m.caption || 'Photo'}">
        </div>
      `).join('');
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
    document.getElementById('detail-landlord-name').textContent = p.landlord.name;
    document.getElementById('detail-landlord-since').textContent = `Member since ${p.landlord.memberSince}`;
    
    const waPhone = p.landlord.whatsapp.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hello ${p.landlord.name}, I am inquiring about booking "${p.title}" on Nairobi Rentals Live.`);
    document.getElementById('detail-btn-whatsapp').href = `https://wa.me/${waPhone}?text=${waText}`;
    document.getElementById('detail-btn-call').href = `tel:${p.landlord.phone}`;
    document.getElementById('detail-landlord-phone-display').textContent = p.landlord.phone;

    // Google Maps Link
    document.getElementById('detail-btn-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;

    // Community Reviews
    const reviewsList = document.getElementById('detail-reviews-list');
    if (reviewsList) {
      window.reviewManager.renderReviewsList(p.id, reviewsList);
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

  selectDetailPhoto(url, thumbEl) {
    const mainImg = document.getElementById('detail-main-photo');
    if (mainImg) mainImg.src = url;

    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  submitReviewForm(e) {
    e.preventDefault();
    if (!this.selectedPropertyForDetail) return;

    const name = document.getElementById('review-author-name').value.trim() || 'Verified Resident';
    const water = document.getElementById('review-water-rating').value;
    const sec = document.getElementById('review-sec-rating').value;
    const dep = document.getElementById('review-dep-rating').value;
    const text = document.getElementById('review-comment-text').value.trim();

    if (!text) {
      this.showToast('Please write a short review comment', 'info');
      return;
    }

    window.reviewManager.addReview(this.selectedPropertyForDetail.id, {
      author: name,
      ratingWater: water,
      ratingSecurity: sec,
      ratingDeposit: dep,
      ratingOverall: ((parseFloat(water) + parseFloat(sec) + parseFloat(dep)) / 3).toFixed(1),
      text
    });

    const reviewsList = document.getElementById('detail-reviews-list');
    if (reviewsList) {
      window.reviewManager.renderReviewsList(this.selectedPropertyForDetail.id, reviewsList);
    }

    document.getElementById('review-comment-text').value = '';
    this.showToast('Thank you! Community review published.', 'success');
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
