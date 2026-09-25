/**
 * KejaMarket Master Location Picker Component
 * Hierarchical drill-down + real-time search engine
 * Supports: Mobile Bottom Sheet (360px-414px) & Desktop Modal
 */

(function(window) {
  'use strict';

  class KejaLocationPicker {
    constructor() {
      this.locations = [];
      this.locationMap = new Map();
      this.childrenMap = new Map();
      this.currentParentId = null;
      this.breadcrumbs = [];
      this.selectedLocation = null;
      this.isOpen = false;
      this.onSelectCallback = null;

      this.init();
    }

    init() {
      // Load locations from master seed or window
      if (window.KEJA_MASTER_LOCATIONS && Array.isArray(window.KEJA_MASTER_LOCATIONS)) {
        this.locations = window.KEJA_MASTER_LOCATIONS;
        this.rebuildIndexes();
      }

      // Also fetch latest dynamically if available
      this.fetchLocations();

      // Inject modal DOM
      this.injectModalHtml();
    }

    rebuildIndexes() {
      this.locationMap.clear();
      this.childrenMap.clear();

      for (const loc of this.locations) {
        if (loc.status === 'archived') continue;
        this.locationMap.set(loc.id, loc);
        const parentId = loc.parentId || 'ROOT';
        if (!this.childrenMap.has(parentId)) {
          this.childrenMap.set(parentId, []);
        }
        this.childrenMap.get(parentId).push(loc);
      }
    }

    async fetchLocations() {
      try {
        const res = await fetch('/api/locations?limit=2000');
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            this.locations = data.results;
            this.rebuildIndexes();
          }
        }
      } catch (e) {
        // Fallback silently to pre-bundled seed
      }
    }

    injectModalHtml() {
      if (document.getElementById('keja-location-picker-modal')) return;

      const modalHtml = `
        <div id="keja-location-picker-modal" class="loc-picker-backdrop" style="display: none;">
          <div class="loc-picker-sheet">
            <!-- Header -->
            <div class="loc-picker-header">
              <div class="loc-picker-title-group">
                <i class="fas fa-map-marker-alt loc-picker-pin-icon"></i>
                <div>
                  <h3 class="loc-picker-title">Select Location</h3>
                  <p class="loc-picker-subtitle">Search or browse Kenyan counties, estates & phases</p>
                </div>
              </div>
              <button type="button" class="loc-picker-close-btn" id="loc-picker-btn-close" aria-label="Close location picker">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Search Bar -->
            <div class="loc-picker-search-bar">
              <i class="fas fa-search loc-search-icon"></i>
              <input 
                type="text" 
                id="loc-picker-search-input" 
                class="loc-picker-search-input" 
                placeholder="Search area, estate, neighbourhood (e.g. Nyayo Phase 2, Buruburu, Sheshe Gardens)..." 
                autocomplete="off"
              />
              <button type="button" class="loc-search-clear-btn" id="loc-picker-search-clear" style="display: none;">
                <i class="fas fa-times-circle"></i>
              </button>
            </div>

            <!-- Breadcrumbs Bar -->
            <div class="loc-picker-breadcrumbs" id="loc-picker-breadcrumbs" style="display: none;">
              <!-- Dynamic breadcrumbs -->
            </div>

            <!-- Content Container -->
            <div class="loc-picker-body">
              <!-- Active Filter / Level Prompt -->
              <div class="loc-picker-section-label" id="loc-picker-section-label">
                Popular Regions & Counties
              </div>

              <!-- List / Grid of Locations -->
              <div class="loc-picker-list" id="loc-picker-list">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Bottom Actions -->
            <div class="loc-picker-footer">
              <button type="button" class="loc-picker-all-btn" id="loc-picker-btn-all-kenya">
                <i class="fas fa-globe-africa"></i> All Nairobi & Environs
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.attachEventListeners();
    }

    attachEventListeners() {
      const modal = document.getElementById('keja-location-picker-modal');
      const closeBtn = document.getElementById('loc-picker-btn-close');
      const searchInput = document.getElementById('loc-picker-search-input');
      const clearBtn = document.getElementById('loc-picker-search-clear');
      const allKenyaBtn = document.getElementById('loc-picker-btn-all-kenya');

      if (closeBtn) closeBtn.onclick = () => this.close();
      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) this.close();
        };
      }

      if (searchInput) {
        searchInput.oninput = (e) => {
          const val = e.target.value;
          if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
          this.handleSearch(val);
        };
      }

      if (clearBtn) {
        clearBtn.onclick = () => {
          if (searchInput) {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            this.handleSearch('');
          }
        };
      }

      if (allKenyaBtn) {
        allKenyaBtn.onclick = () => {
          this.selectLocation(null);
        };
      }
    }

    open(initialParentId = null, onSelect = null) {
      this.onSelectCallback = onSelect;
      const modal = document.getElementById('keja-location-picker-modal');
      const searchInput = document.getElementById('loc-picker-search-input');
      const clearBtn = document.getElementById('loc-picker-search-clear');

      if (!modal) return;
      modal.style.display = 'flex';
      this.isOpen = true;
      document.body.style.overflow = 'hidden';

      if (searchInput) {
        searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
      }

      this.currentParentId = initialParentId;
      this.renderLevel(initialParentId);

      setTimeout(() => {
        if (searchInput && window.innerWidth > 640) {
          searchInput.focus();
        }
      }, 100);
    }

    close() {
      const modal = document.getElementById('keja-location-picker-modal');
      if (modal) modal.style.display = 'none';
      this.isOpen = false;
      document.body.style.overflow = '';
    }

    renderBreadcrumbs(parentId) {
      const breadcrumbsEl = document.getElementById('loc-picker-breadcrumbs');
      if (!breadcrumbsEl) return;

      if (!parentId) {
        breadcrumbsEl.style.display = 'none';
        breadcrumbsEl.innerHTML = '';
        return;
      }

      const chain = [];
      let curr = this.locationMap.get(parentId);
      while (curr) {
        chain.unshift(curr);
        curr = curr.parentId ? this.locationMap.get(curr.parentId) : null;
      }

      breadcrumbsEl.style.display = 'flex';
      let html = `
        <span class="loc-bc-item loc-bc-root" onclick="window.kejaLocationPicker.renderLevel(null)">
          <i class="fas fa-home"></i> All
        </span>
      `;

      chain.forEach((item, index) => {
        const isLast = index === chain.length - 1;
        html += `
          <i class="fas fa-chevron-right loc-bc-separator"></i>
          <span class="loc-bc-item ${isLast ? 'loc-bc-current' : ''}" onclick="window.kejaLocationPicker.renderLevel('${item.id}')">
            ${item.name}
          </span>
        `;
      });

      breadcrumbsEl.innerHTML = html;
    }

    renderLevel(parentId = null) {
      this.currentParentId = parentId;
      this.renderBreadcrumbs(parentId);

      const listEl = document.getElementById('loc-picker-list');
      const sectionLabel = document.getElementById('loc-picker-section-label');
      if (!listEl) return;

      const children = this.childrenMap.get(parentId || 'ROOT') || [];
      const currentLoc = parentId ? this.locationMap.get(parentId) : null;

      if (currentLoc) {
        const childType = children.length > 0 ? (children[0].type || 'sub-locations') : 'sub-locations';
        sectionLabel.textContent = `Select within ${currentLoc.name} (${children.length} ${childType.toLowerCase()}s)`;
      } else {
        sectionLabel.textContent = 'Popular Regions & Counties';
      }

      let html = '';

      // If we are drilled down, provide option to select the current parent directly (e.g. Any Gate / Any Phase)
      if (currentLoc) {
        html += `
          <div class="loc-item-card loc-item-card--any" onclick="window.kejaLocationPicker.selectLocation('${currentLoc.id}')">
            <div class="loc-card-icon-box loc-card-icon-box--green">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="loc-card-text">
              <div class="loc-card-name">Select all of ${currentLoc.name}</div>
              <div class="loc-card-path">Properties anywhere in ${currentLoc.displayLocation || currentLoc.name}</div>
            </div>
            <span class="loc-card-badge loc-card-badge--any">Select Whole Area</span>
          </div>
        `;
      }

      if (children.length === 0) {
        // No further children (leaf node)
        if (currentLoc) {
          this.selectLocation(currentLoc.id);
          return;
        }
        html += `
          <div class="loc-picker-empty">
            <i class="fas fa-map-marker-alt"></i>
            <p>No sub-locations found here.</p>
          </div>
        `;
      } else {
        children.forEach(child => {
          const grandChildren = this.childrenMap.get(child.id) || [];
          const hasChildren = grandChildren.length > 0;
          const typeBadge = this.formatTypeBadge(child.type);

          html += `
            <div class="loc-item-card" onclick="window.kejaLocationPicker.handleItemClick('${child.id}', ${hasChildren})">
              <div class="loc-card-icon-box">
                <i class="${this.getTypeIcon(child.type)}"></i>
              </div>
              <div class="loc-card-text">
                <div class="loc-card-name">${child.name}</div>
                <div class="loc-card-path">${child.pathString || child.county || ''}</div>
              </div>
              <div class="loc-card-right">
                ${typeBadge ? `<span class="loc-card-badge">${typeBadge}</span>` : ''}
                ${hasChildren ? `
                  <button type="button" class="loc-drill-btn" title="Explore sub-areas">
                    <span>${grandChildren.length}</span>
                    <i class="fas fa-chevron-right"></i>
                  </button>
                ` : `
                  <i class="fas fa-check loc-leaf-check"></i>
                `}
              </div>
            </div>
          `;
        });
      }

      listEl.innerHTML = html;
    }

    handleItemClick(id, hasChildren) {
      if (hasChildren) {
        // Drill down to the next level
        this.renderLevel(id);
      } else {
        // Select leaf location
        this.selectLocation(id);
      }
    }

    handleSearch(query) {
      const breadcrumbsEl = document.getElementById('loc-picker-breadcrumbs');
      const sectionLabel = document.getElementById('loc-picker-section-label');
      const listEl = document.getElementById('loc-picker-list');

      if (!query || !query.trim()) {
        this.renderLevel(this.currentParentId);
        return;
      }

      if (breadcrumbsEl) breadcrumbsEl.style.display = 'none';

      const results = this.searchLocations(query, 20);
      if (sectionLabel) sectionLabel.textContent = `Search results for "${query}" (${results.length} found)`;

      if (!listEl) return;

      if (results.length === 0) {
        listEl.innerHTML = `
          <div class="loc-picker-empty">
            <i class="fas fa-search-location"></i>
            <p>No locations matching "<strong>${this.escapeHtml(query)}</strong>"</p>
            <small style="color: #64748b;">Try searching an estate (e.g. Nyayo, Buruburu, Sheshe Gardens, Eastleigh)</small>
          </div>
        `;
        return;
      }

      let html = '';
      results.forEach(loc => {
        const typeBadge = this.formatTypeBadge(loc.type);
        html += `
          <div class="loc-item-card" onclick="window.kejaLocationPicker.selectLocation('${loc.id}')">
            <div class="loc-card-icon-box">
              <i class="${this.getTypeIcon(loc.type)}"></i>
            </div>
            <div class="loc-card-text">
              <div class="loc-card-name">${this.highlightMatch(loc.name, query)}</div>
              <div class="loc-card-path">${this.highlightMatch(loc.pathString || loc.name, query)}</div>
            </div>
            <div class="loc-card-right">
              ${typeBadge ? `<span class="loc-card-badge">${typeBadge}</span>` : ''}
              <button type="button" class="loc-select-pill">Select</button>
            </div>
          </div>
        `;
      });

      listEl.innerHTML = html;
    }

    searchLocations(query, limit = 20) {
      const STOP_WORDS = new Set(['phase', 'gate', 'section', 'sec', 'court', 'stage', 'road', 'estate', 'area', 'sub-area', 'town', 'county', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);

      const cleanQ = query.trim().toLowerCase().replace(/['’]/g, '');
      const tokens = cleanQ.split(/\s+/).filter(t => t.length > 0);
      const nonStopTokens = tokens.filter(t => !STOP_WORDS.has(t));

      const scored = [];

      for (const loc of this.locations) {
        if (loc.status === 'archived') continue;

        const locName = (loc.name || '').toLowerCase().replace(/['’]/g, '');
        const pathStr = (loc.pathString || '').toLowerCase().replace(/['’]/g, '');
        const searchTerms = (loc.searchTerms || []).map(t => t.toLowerCase().replace(/['’]/g, ''));
        const aliases = (loc.aliases || []).map(a => a.toLowerCase().replace(/['’]/g, ''));

        let score = 0;

        const allTokensInPath = tokens.every(token => 
          pathStr.includes(token) || searchTerms.some(st => st.includes(token)) || aliases.some(a => a.includes(token))
        );

        const matchesNonStop = nonStopTokens.length === 0 || nonStopTokens.every(token => 
          pathStr.includes(token) || searchTerms.some(st => st.includes(token)) || aliases.some(a => a.includes(token))
        );

        if (tokens.length >= 2 && !matchesNonStop) {
          continue;
        }

        // Exact name match
        if (locName === cleanQ) score += 300;
        else if (locName.startsWith(cleanQ)) score += 200;
        else if (locName.includes(cleanQ)) score += 150;

        // Exact alias match
        if (aliases.some(a => a === cleanQ)) score += 250;
        else if (aliases.some(a => a.startsWith(cleanQ))) score += 180;
        else if (aliases.some(a => a.includes(cleanQ))) score += 120;

        if (allTokensInPath) {
          score += 200 + (tokens.length * 30);
          const lastToken = tokens[tokens.length - 1];
          if (locName.includes(lastToken)) score += 50;
          if (pathStr.includes(cleanQ)) score += 100;
        } else {
          const matchCount = tokens.filter(t => pathStr.includes(t) || aliases.some(a => a.includes(t)) || searchTerms.some(st => st.includes(t))).length;
          score += matchCount * 30;
        }

        if (loc.verified) score += 10;
        if (loc.type === 'PHASE' || loc.type === 'GATE' || loc.type === 'SECTION') {
          if (tokens.length > 1) score += 20;
        }

        if (score > 60) {
          scored.push({ loc, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map(s => s.loc);
    }

    selectLocation(locId) {
      const loc = locId ? this.locationMap.get(locId) : null;
      this.selectedLocation = loc;
      this.close();

      // Trigger app callback
      if (typeof this.onSelectCallback === 'function') {
        this.onSelectCallback(loc);
      } else if (window.app && typeof window.app.applySelectedLocation === 'function') {
        window.app.applySelectedLocation(loc);
      }
    }

    formatTypeBadge(type) {
      if (!type) return '';
      switch (type) {
        case 'COUNTY': return 'County';
        case 'TOWN': return 'Town';
        case 'AREA': return 'Area';
        case 'ESTATE': return 'Estate';
        case 'NEIGHBOURHOOD': return 'Neighbourhood';
        case 'SUB_AREA': return 'Sub-area';
        case 'PHASE': return 'Phase';
        case 'GATE': return 'Gate';
        case 'SECTION': return 'Section';
        case 'COURT': return 'Court';
        case 'STAGE': return 'Stage';
        default: return type.charAt(0) + type.slice(1).toLowerCase();
      }
    }

    getTypeIcon(type) {
      switch (type) {
        case 'COUNTY': return 'fas fa-map';
        case 'TOWN': return 'fas fa-city';
        case 'AREA': return 'fas fa-layer-group';
        case 'ESTATE': return 'fas fa-home';
        case 'NEIGHBOURHOOD': return 'fas fa-building';
        case 'PHASE': return 'fas fa-hashtag';
        case 'GATE': return 'fas fa-door-open';
        case 'SECTION': return 'fas fa-cubes';
        case 'COURT': return 'fas fa-th';
        case 'STAGE': return 'fas fa-bus';
        default: return 'fas fa-map-marker-alt';
      }
    }

    highlightMatch(text, query) {
      if (!text || !query) return this.escapeHtml(text || '');
      const clean = this.escapeHtml(text);
      const q = query.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!q) return clean;
      const re = new RegExp(`(${q})`, 'gi');
      return clean.replace(re, '<mark class="loc-highlight">$1</mark>');
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  window.KejaLocationPicker = KejaLocationPicker;
  window.kejaLocationPicker = new KejaLocationPicker();

})(window);
