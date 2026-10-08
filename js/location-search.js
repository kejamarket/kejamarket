/**
 * KejaMarket - Hierarchical Location Search Component
 * Provides autocomplete search with parent-child navigation
 * Supports: "Mlolongo" returns all properties + shows Phase 1, 2, 3, 4 as options
 */

class LocationSearch {
  constructor(options = {}) {
    this.inputElement = options.inputElement;
    this.resultsContainer = options.resultsContainer;
    this.onSelect = options.onSelect || (() => {});
    this.onClear = options.onClear || (() => {});
    this.minChars = options.minChars || 2;
    this.debounceDelay = options.debounceDelay || 300;
    
    this.locations = [];
    this.selectedLocation = null;
    this.searchTimeout = null;
    
    this.init();
  }

  async init() {
    await this.loadLocations();
    this.attachEventListeners();
  }

  async loadLocations() {
    try {
      const response = await fetch('/api/locations/hierarchy');
      if (response.ok) {
        const data = await response.json();
        // API returns array directly
        this.locations = Array.isArray(data) ? data : [];
        
        // Initialize LocationsHierarchy with the data
        if (typeof LocationsHierarchy !== 'undefined') {
          this.locationsDb = new LocationsHierarchy(this.locations);
          console.log(`✅ Loaded ${this.locations.length} hierarchical locations`);
        } else {
          console.error('LocationsHierarchy class not found');
        }
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      this.locations = [];
    }
  }

  attachEventListeners() {
    if (!this.inputElement) return;

    // Input event with debounce
    this.inputElement.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < this.minChars) {
        this.hideResults();
        return;
      }
      
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, this.debounceDelay);
    });

    // Focus event - show recent/popular if empty
    this.inputElement.addEventListener('focus', () => {
      if (this.inputElement.value.trim().length === 0) {
        this.showPopularLocations();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.inputElement.contains(e.target) && !this.resultsContainer.contains(e.target)) {
        this.hideResults();
      }
    });
  }

  performSearch(query) {
    const results = this.searchLocations(query);
    this.displayResults(results, query);
  }

  /**
   * Search locations with fuzzy matching
   * Returns grouped results: exact matches, then parent matches
   */
  searchLocations(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const loc of this.locations) {
      if (!loc.isActive) continue;

      const nameLower = loc.name.toLowerCase();
      const fullPathLower = (loc.fullPath || '').toLowerCase();
      
      let matchScore = 0;
      let matchType = '';

      // Exact match
      if (nameLower === lowerQuery) {
        matchScore = 100;
        matchType = 'exact';
      }
      // Starts with query
      else if (nameLower.startsWith(lowerQuery)) {
        matchScore = 90;
        matchType = 'prefix';
      }
      // Contains query
      else if (nameLower.includes(lowerQuery)) {
        matchScore = 70;
        matchType = 'contains';
      }
      // Full path contains query
      else if (fullPathLower.includes(lowerQuery)) {
        matchScore = 50;
        matchType = 'path';
      }
      // Check aliases
      else if (loc.aliases && Array.isArray(loc.aliases)) {
        for (const alias of loc.aliases) {
          if (alias.toLowerCase().includes(lowerQuery)) {
            matchScore = 60;
            matchType = 'alias';
            break;
          }
        }
      }

      if (matchScore > 0) {
        results.push({
          ...loc,
          matchScore,
          matchType
        });
      }
    }

    // Sort by match score (desc), then property count (desc)
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (b.propertyCount || 0) - (a.propertyCount || 0);
    });

    return results.slice(0, 15); // Limit to 15 results
  }

  /**
   * Display search results with hierarchical context
   */
  displayResults(results, query) {
    if (!this.resultsContainer) return;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="location-search-no-results">
          <i class="fas fa-search"></i>
          <p>No locations found for "${query}"</p>
        </div>
      `;
      this.resultsContainer.classList.add('active');
      return;
    }

    // Group results: show main result + children
    const html = results.map(loc => this.renderLocationResult(loc)).join('');
    
    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add('active');

    // Attach click handlers
    this.resultsContainer.querySelectorAll('.location-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const locationId = item.dataset.locationId;
        const location = this.locations.find(l => l.id === locationId);
        if (location) {
          this.selectLocation(location);
        }
      });
    });
  }

  /**
   * Render a single location result with hierarchy display
   */
  renderLocationResult(loc) {
    const propertyCount = loc.propertyCount || 0;
    const countText = propertyCount > 0 ? `${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}` : '';
    const verifiedBadge = loc.isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : '';
    
    // Get type icon
    const typeIcons = {
      'county': 'fa-map',
      'town': 'fa-city',
      'major_area': 'fa-map-marker-alt',
      'estate': 'fa-building',
      'neighbourhood': 'fa-home',
      'phase': 'fa-layer-group',
      'section': 'fa-th-large',
      'zone': 'fa-map-pin',
      'informal_settlement': 'fa-home'
    };
    const icon = typeIcons[loc.type] || 'fa-map-marker';

    return `
      <div class="location-result-item" data-location-id="${loc.id}">
        <div class="location-result-icon">
          <i class="fas ${icon}"></i>
        </div>
        <div class="location-result-details">
          <div class="location-result-name">
            ${loc.name}
            ${verifiedBadge}
          </div>
          <div class="location-result-path">
            ${loc.fullPath || loc.name}
          </div>
          ${countText ? `<div class="location-result-count">${countText}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Select a location and optionally show its children
   */
  async selectLocation(location) {
    this.selectedLocation = location;
    this.inputElement.value = location.name;
    
    // Get children to show drill-down option
    const children = this.getChildren(location.id);
    
    if (children.length > 0) {
      // Show children as refinement options
      this.showChildrenOptions(location, children);
    } else {
      // No children, just select and hide
      this.hideResults();
      this.onSelect(location, null);
    }
  }

  /**
   * Get children of a location
   */
  getChildren(parentId) {
    return this.locations.filter(loc => loc.parentId === parentId && loc.isActive);
  }

  /**
   * Show children as refinement options
   */
  showChildrenOptions(parentLocation, children) {
    if (!this.resultsContainer) return;

    const html = `
      <div class="location-children-container">
        <div class="location-children-header">
          <button class="location-select-parent" data-location-id="${parentLocation.id}">
            <i class="fas fa-check"></i>
            <span>${parentLocation.name} — All Areas</span>
            <small>${parentLocation.propertyCount || 0} properties</small>
          </button>
        </div>
        <div class="location-children-divider">
          <span>Or select specific area</span>
        </div>
        <div class="location-children-list">
          ${children.map(child => `
            <button class="location-child-item" data-location-id="${child.id}">
              <i class="fas fa-arrow-right"></i>
              <span>${child.name}</span>
              <small>${child.propertyCount || 0}</small>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add('active');

    // Attach handlers for parent selection
    const parentBtn = this.resultsContainer.querySelector('.location-select-parent');
    if (parentBtn) {
      parentBtn.addEventListener('click', () => {
        this.hideResults();
        this.onSelect(parentLocation, null);
      });
    }

    // Attach handlers for children
    this.resultsContainer.querySelectorAll('.location-child-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const childId = btn.dataset.locationId;
        const child = this.locations.find(l => l.id === childId);
        if (child) {
          this.selectLocation(child);
        }
      });
    });
  }

  /**
   * Show popular/recent locations when input is empty
   */
  showPopularLocations() {
    const popular = this.locations
      .filter(loc => loc.isActive && loc.propertyCount > 0)
      .sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0))
      .slice(0, 10);

    if (popular.length === 0) return;

    const html = `
      <div class="location-popular-header">Popular Locations</div>
      ${popular.map(loc => this.renderLocationResult(loc)).join('')}
    `;

    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add('active');

    // Attach click handlers
    this.resultsContainer.querySelectorAll('.location-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const locationId = item.dataset.locationId;
        const location = this.locations.find(l => l.id === locationId);
        if (location) {
          this.selectLocation(location);
        }
      });
    });
  }

  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.classList.remove('active');
    }
  }

  clear() {
    this.selectedLocation = null;
    if (this.inputElement) {
      this.inputElement.value = '';
    }
    this.hideResults();
    this.onClear();
  }

  getSelectedLocation() {
    return this.selectedLocation;
  }

  /**
   * Get all descendant IDs for a location (for parent search)
   */
  getDescendantIds(locationId) {
    const descendants = new Set([locationId]);
    const queue = [locationId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      
      for (const loc of this.locations) {
        if (loc.parentId === currentId && !descendants.has(loc.id)) {
          descendants.add(loc.id);
          queue.push(loc.id);
        }
      }
    }
    
    return Array.from(descendants);
  }

  /**
   * Get breadcrumb path for display
   */
  getBreadcrumbs(locationId) {
    const breadcrumbs = [];
    let current = this.locations.find(l => l.id === locationId);
    
    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug
      });
      current = current.parentId ? this.locations.find(l => l.id === current.parentId) : null;
    }
    
    return breadcrumbs;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationSearch;
}
