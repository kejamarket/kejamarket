/**
 * KejaMarket Recently Added Section
 * Handles dynamic property categorization and display
 */

const KejaRecentlyAdded = {
  
  // Category definitions
  categories: {
    'just-added': {
      name: 'Just Added',
      icon: '🔥',
      description: 'Brand new listings from the last 24 hours',
      badge: 'JUST ADDED',
      color: '#ef4444'
    },
    'available-today': {
      name: 'Available Today',
      icon: '⚡',
      description: 'Properties you can view and move into today',
      badge: 'AVAILABLE TODAY',
      color: '#f59e0b'
    },
    'best-value': {
      name: 'Best Value',
      icon: '💰',
      description: 'Great properties at unbeatable prices',
      badge: 'BEST VALUE',
      color: '#10b981'
    },
    'verified-homes': {
      name: 'Verified Homes',
      icon: '🛡',
      description: 'Fully verified properties from trusted landlords',
      badge: 'VERIFIED',
      color: '#3b82f6'
    }
  },

  currentCategory: 'just-added',
  propertiesPerPage: 12,
  currentPage: 1,

  /**
   * Initialize Recently Added section
   */
  init() {
    console.log('KejaMarket Recently Added initialized');
    this.createSection();
    this.bindEvents();
  },

  /**
   * Create the Recently Added section HTML
   */
  createSection() {
    const container = document.createElement('div');
    container.className = 'recently-added-section';
    container.id = 'recently-added-section';
    
    container.innerHTML = `
      <div class="recently-added-header">
        <h2 class="recently-added-title">🏠 Fresh Properties Daily</h2>
        <p class="recently-added-subtitle">New listings added every day - check back often for the latest homes!</p>
        
        <!-- Category Tabs -->
        <div class="category-tabs" id="category-tabs">
          ${Object.entries(this.categories).map(([key, category]) => `
            <button class="category-tab ${key === this.currentCategory ? 'active' : ''}" 
                    data-category="${key}">
              <span class="tab-icon">${category.icon}</span>
              <span>${category.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Properties Grid -->
      <div class="recently-added-grid" id="recently-added-grid">
        <!-- Properties will be loaded here -->
      </div>

      <!-- Load More Button -->
      <div class="load-more-section" id="load-more-section" style="display: none;">
        <button class="load-more-btn" id="load-more-btn">
          <i class="fas fa-plus-circle"></i>
          <span>Show More Properties</span>
        </button>
      </div>

      <!-- Daily Return Message -->
      <div class="daily-return-message">
        <div class="daily-return-title">
          <span>📅</span>
          <span>New Properties Added Daily!</span>
        </div>
        <p class="daily-return-text">
          Check back every day for fresh listings. We add 20+ new verified properties daily from trusted landlords across Nairobi.
        </p>
      </div>
    `;

    // Insert after main property grid
    const mainGrid = document.getElementById('properties-grid');
    if (mainGrid && mainGrid.parentNode) {
      mainGrid.parentNode.insertBefore(container, mainGrid.nextSibling);
    } else {
      // Fallback: append to main content area
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.appendChild(container);
      }
    }

    this.loadCategoryProperties();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Category tab clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.category-tab')) {
        const category = e.target.closest('.category-tab').dataset.category;
        this.switchCategory(category);
      }
      
      // Load more button
      if (e.target.closest('#load-more-btn')) {
        this.loadMoreProperties();
      }
      
      // Property actions
      if (e.target.closest('.recent-action-btn')) {
        const action = e.target.closest('.recent-action-btn').dataset.action;
        const propertyId = e.target.closest('.recent-property-card').dataset.propertyId;
        this.handlePropertyAction(action, propertyId);
      }
    });
  },

  /**
   * Switch category and load properties
   */
  switchCategory(category) {
    if (category === this.currentCategory) return;
    
    this.currentCategory = category;
    this.currentPage = 1;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    this.loadCategoryProperties();
  },

  /**
   * Load properties for current category
   */
  async loadCategoryProperties() {
    const grid = document.getElementById('recently-added-grid');
    
    // Show loading
    grid.innerHTML = this.getLoadingHTML();
    
    try {
      // Get properties from main app
      const allProperties = window.app ? window.app.properties : [];
      const categoryProperties = this.categorizeProperties(allProperties);
      const properties = categoryProperties[this.currentCategory] || [];
      
      // Display properties
      const displayProperties = properties.slice(0, this.propertiesPerPage * this.currentPage);
      
      if (displayProperties.length === 0) {
        grid.innerHTML = this.getEmptyStateHTML();
        document.getElementById('load-more-section').style.display = 'none';
      } else {
        grid.innerHTML = displayProperties.map(property => this.createPropertyCard(property)).join('');
        
        // Show/hide load more button
        const hasMore = properties.length > displayProperties.length;
        document.getElementById('load-more-section').style.display = hasMore ? 'block' : 'none';
      }
      
    } catch (error) {
      console.error('Error loading recently added properties:', error);
      grid.innerHTML = this.getErrorHTML();
    }
  },

  /**
   * Categorize properties based on criteria
   */
  categorizeProperties(properties) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const categorized = {
      'just-added': [],
      'available-today': [],
      'best-value': [],
      'verified-homes': []
    };
    
    properties.forEach(property => {
      // Get property date (fallback to random recent date for demo)
      const propertyDate = property.dateAdded ? new Date(property.dateAdded) : 
                          new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      // Just Added - properties from last 24 hours
      if (propertyDate >= oneDayAgo) {
        categorized['just-added'].push(property);
      }
      
      // Available Today - not taken and ready to move
      if (!property.isTaken && property.status !== 'taken' && property.availability !== 'taken') {
        categorized['available-today'].push(property);
      }
      
      // Best Value - properties with good price/value ratio
      const rent = property.rentKes || property.rent || 0;
      if (this.isBestValue(property, rent)) {
        categorized['best-value'].push(property);
      }
      
      // Verified Homes - verified landlords and properties
      if (property.isVerified || property.landlord?.isVerified) {
        categorized['verified-homes'].push(property);
      }
    });
    
    return categorized;
  },

  /**
   * Determine if property is best value
   */
  isBestValue(property, rent) {
    const category = property.category?.toLowerCase() || '';
    
    // Define price thresholds for "best value" by category
    const valueThresholds = {
      'bedsitter': 12000,
      'studio': 12000,
      '1 bedroom': 20000,
      '2 bedroom': 35000,
      '3 bedroom': 50000,
      '4 bedroom': 70000
    };
    
    const threshold = valueThresholds[category] || 25000;
    return rent > 0 && rent <= threshold;
  },

  /**
   * Create property card HTML
   */
  createPropertyCard(property) {
    const category = this.categories[this.currentCategory];
    const rent = property.rentKes || property.rent || 0;
    const location = property.estateSuburb || property.location || 'Nairobi';
    const bedrooms = property.bedrooms || 'Studio';
    const bathrooms = property.bathrooms || 1;
    
    // Get first image or placeholder
    const imageUrl = property.media?.[0]?.url || 
                    property.images?.[0] || 
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';
    
    // Time badge
    const timeAgo = this.getTimeAgo(property);
    
    return `
      <div class="recent-property-card" data-property-id="${property.id}">
        <div class="recent-property-image" style="background-image: url('${imageUrl}')">
          <div class="category-badge ${this.currentCategory}">${category.badge}</div>
          <div class="time-badge">${timeAgo}</div>
        </div>
        
        <div class="recent-property-info">
          <h3 class="recent-property-title">${property.title}</h3>
          
          <div class="recent-property-location">
            <i class="fas fa-map-marker-alt" style="color: #059669;"></i>
            <span>${location}</span>
          </div>
          
          <div class="recent-property-price">
            KSh ${rent.toLocaleString()}/month
          </div>
          
          <div class="recent-property-features">
            <span><i class="fas fa-bed"></i> ${bedrooms} ${bedrooms === 1 ? 'Bedroom' : bedrooms === 'Studio' ? '' : 'Bedrooms'}</span>
            <span><i class="fas fa-bath"></i> ${bathrooms} Bath${bathrooms > 1 ? 's' : ''}</span>
            ${property.hasParking ? '<span><i class="fas fa-car"></i> Parking</span>' : ''}
          </div>
          
          <div class="recent-property-actions">
            <button class="recent-action-btn recent-action-primary" data-action="view">
              <i class="fas fa-eye"></i> View Details
            </button>
            <button class="recent-action-btn recent-action-secondary" data-action="contact">
              <i class="fas fa-phone"></i> Contact
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get time ago string
   */
  getTimeAgo(property) {
    const now = new Date();
    const propertyDate = property.dateAdded ? new Date(property.dateAdded) : 
                        new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    const diffMs = now - propertyDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return '1w ago';
  },

  /**
   * Load more properties
   */
  loadMoreProperties() {
    this.currentPage++;
    this.loadCategoryProperties();
  },

  /**
   * Handle property actions
   */
  handlePropertyAction(action, propertyId) {
    if (action === 'view') {
      // Use main app's showPropertyDetail if available
      if (window.app && window.app.showPropertyDetail) {
        const property = window.app.properties.find(p => p.id === propertyId);
        if (property) {
          window.app.showPropertyDetail(property);
        }
      }
    } else if (action === 'contact') {
      // Handle contact action
      if (window.app && window.app.openContactModal) {
        const property = window.app.properties.find(p => p.id === propertyId);
        if (property) {
          window.app.openContactModal(property);
        }
      }
    }
  },

  /**
   * Get loading HTML
   */
  getLoadingHTML() {
    return Array(6).fill().map(() => `
      <div class="recent-property-card" style="opacity: 0.6;">
        <div class="recent-property-image" style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>
        <div class="recent-property-info">
          <div style="height: 20px; background: #f0f0f0; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 16px; background: #f0f0f0; border-radius: 4px; width: 70%; margin-bottom: 12px;"></div>
          <div style="height: 24px; background: #f0f0f0; border-radius: 4px; width: 50%; margin-bottom: 16px;"></div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Get empty state HTML
   */
  getEmptyStateHTML() {
    const category = this.categories[this.currentCategory];
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">${category.icon}</div>
        <h3 class="empty-state-title">No ${category.name} Properties</h3>
        <p class="empty-state-text">
          Check back soon - we're always adding new ${category.name.toLowerCase()} properties!
        </p>
      </div>
    `;
  },

  /**
   * Get error HTML
   */
  getErrorHTML() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Unable to Load Properties</h3>
        <p class="empty-state-text">
          Please refresh the page to try again.
        </p>
      </div>
    `;
  },

  /**
   * Refresh properties when new data is available
   */
  refresh() {
    this.loadCategoryProperties();
  }
};

// Add loading animation CSS
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(loadingStyle);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => KejaRecentlyAdded.init());
} else {
  KejaRecentlyAdded.init();
}

// Export for global access
window.KejaRecentlyAdded = KejaRecentlyAdded;