/**
 * Enhanced Landlord Portal with Multi-Building Management for Caretakers
 * Provides role-specific dashboards and professional terminology
 */

const KejaEnhancedPortal = {
  
  user: null,
  properties: [],
  
  /**
   * Initialize enhanced landlord portal
   */
  init(user) {
    console.log('Enhanced Landlord Portal initialized for:', user.name);
    this.user = user;
    this.loadUserProperties();
    this.setupEnhancedDashboard();
  },

  /**
   * Setup role-specific dashboard
   */
  setupEnhancedDashboard() {
    const propertyRole = this.user.registrationData?.propertyRole || 'landlord';
    
    switch(propertyRole) {
      case 'airbnb-host':
        this.setupAirbnbDashboard();
        break;
      case 'serviced-apartment':
        this.setupServicedApartmentDashboard();
        break;
      case 'guest-house':
        this.setupGuestHouseDashboard();
        break;
      case 'commercial':
        this.setupCommercialDashboard();
        break;
      case 'caretaker':
        this.setupCaretakerDashboard();
        break;
      case 'property-manager':
        this.setupPropertyManagerDashboard();
        break;
      case 'agent':
        this.setupAgentDashboard();
        break;
      default:
        this.setupLandlordDashboard();
    }
  },

  /**
   * Setup caretaker-specific dashboard with multi-building management
   */
  setupCaretakerDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="caretaker-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏢 Property Partner Dashboard</span>
          </div>
          <div class="partner-badge">
            🛡️ Verified Property Partner
          </div>
        </div>
      `;
    }

    // Add enhanced property management section
    this.addMultiBuildingManager();
    this.addCaretakerMetrics();
    this.addPropertyOwnerCommunication();
  },

  /**
   * Setup Airbnb host dashboard with marketplace model (no booking management)
   */
  setupAirbnbDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="airbnb-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏨 BNB Host Dashboard</span>
          </div>
          <div class="host-badge">
            🏨 BNB Host
          </div>
        </div>
      `;
    }

    this.addBnbListings();
    this.addBnbMetrics();
    this.addGuestInquiries();
  },

  /**
   * Add BNB listings management (marketplace model)
   */
  addBnbListings() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const bnbSection = document.createElement('div');
    bnbSection.id = 'bnb-listings';
    bnbSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-bed"></i>
          My BNB Listings
          <span class="properties-count">${this.properties.length} listings</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddBnbModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add BNB Listing
        </button>
      </div>

      <div class="bnb-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏠</div>
            <div class="card-content">
              <div class="card-number">${this.properties.length}</div>
              <div class="card-label">Active Listings</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">👀</div>
            <div class="card-content">
              <div class="card-number">${this.getBnbViews()}</div>
              <div class="card-label">Total Views</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📞</div>
            <div class="card-content">
              <div class="card-number">${this.getGuestInquiries()}</div>
              <div class="card-label">Guest Inquiries</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">⭐</div>
            <div class="card-content">
              <div class="card-number">4.8</div>
              <div class="card-label">Guest Rating</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bnb-listings-list" id="bnb-listings-list">
        ${this.renderBnbListings()}
      </div>
    `;

    dashboard.appendChild(bnbSection);
  },

  /**
   * Render BNB listings (marketplace model)
   */
  renderBnbListings() {
    if (this.properties.length === 0) {
      return `
        <div class="empty-properties">
          <div class="empty-icon">🏨</div>
          <div class="empty-title">No BNB Listings Yet</div>
          <div class="empty-desc">Add your first BNB listing to start connecting with guests on KejaMarket</div>
          <button onclick="KejaEnhancedPortal.showAddBnbModal()" class="btn-primary">
            <i class="fas fa-plus"></i> Create Your First BNB Listing
          </button>
        </div>
      `;
    }

    return this.properties.map(property => `
      <div class="bnb-listing-card" data-property-id="${property.id}">
        <div class="bnb-header">
          <div class="bnb-info">
            <div class="bnb-name">${property.title}</div>
            <div class="bnb-location">
              <i class="fas fa-map-marker-alt"></i>
              ${property.location}
            </div>
          </div>
          <div class="availability-status">
            <div class="status-indicator">🟡 Confirm with host</div>
            <div class="price-display">KSh ${property.nightlyRate || 3500}/night</div>
          </div>
        </div>
        
        <div class="bnb-stats">
          <div class="stat">
            <span class="stat-number">${property.views || 0}</span>
            <span class="stat-label">Views</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.inquiries || 0}</span>
            <span class="stat-label">Inquiries</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.contacts || 0}</span>
            <span class="stat-label">Contacts</span>
          </div>
          <div class="stat">
            <span class="stat-number">⭐ ${property.rating || 4.8}</span>
            <span class="stat-label">Rating</span>
          </div>
        </div>
        
        <div class="bnb-actions">
          <button onclick="KejaEnhancedPortal.editBnbListing('${property.id}')" class="btn-action">
            📝 Edit Listing
          </button>
          <button onclick="KejaEnhancedPortal.viewBnbInquiries('${property.id}')" class="btn-action">
            📞 View Inquiries
          </button>
          <button onclick="KejaEnhancedPortal.manageBnbListing('${property.id}')" class="btn-manage">
            Manage
          </button>
        </div>
        
        <div class="marketplace-note">
          <i class="fas fa-info-circle"></i>
          <span>Guests contact you directly to confirm availability and booking</span>
        </div>
      </div>
    `).join('');
  },

  /**
   * Add BNB marketplace metrics
   */
  addBnbMetrics() {
    const dashboard = document.getElementById('landlord-dashboard');
    
    const metricsSection = document.createElement('div');
    metricsSection.id = 'bnb-metrics';
    metricsSection.innerHTML = `
      <div class="section-header">
        <h3><i class="fas fa-chart-bar"></i> BNB Performance</h3>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-number">${this.getGuestInquiries()}</div>
            <div class="metric-label">Guest Inquiries</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">👁️</div>
          <div class="metric-content">
            <div class="metric-number">${this.getBnbViews()}</div>
            <div class="metric-label">Listing Views</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📞</div>
          <div class="metric-content">
            <div class="metric-number">${Math.floor(Math.random() * 15) + 5}</div>
            <div class="metric-label">Phone Contacts</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">💬</div>
          <div class="metric-content">
            <div class="metric-number">${Math.floor(Math.random() * 20) + 8}</div>
            <div class="metric-label">WhatsApp Contacts</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
      </div>
    `;
    
    dashboard.appendChild(metricsSection);
  },

  /**
   * Add guest inquiry management (not booking management)
   */
  addGuestInquiries() {
    const dashboard = document.getElementById('landlord-dashboard');
    
    const inquirySection = document.createElement('div');
    inquirySection.id = 'guest-inquiries';
    inquirySection.innerHTML = `
      <div class="section-header">
        <h3><i class="fas fa-envelope"></i> Recent Guest Inquiries</h3>
      </div>
      
      <div class="inquiries-panel">
        <div class="inquiry-requests">
          <h4>New Inquiries (${Math.floor(Math.random() * 5) + 2})</h4>
          <div class="inquiry-list">
            <div class="guest-inquiry">
              <div class="guest-info">
                <strong>Sarah K.</strong> • Interested in your Kilimani BNB
                <div class="inquiry-details">Looking for 3 nights, Dec 15-18</div>
                <div class="inquiry-time">2 hours ago</div>
              </div>
              <div class="inquiry-actions">
                <button onclick="KejaEnhancedPortal.respondToInquiry('inq1')" class="btn-respond">Respond</button>
                <button onclick="KejaEnhancedPortal.viewInquiry('inq1')" class="btn-view">View</button>
              </div>
            </div>
            
            <div class="guest-inquiry">
              <div class="guest-info">
                <strong>Mike A.</strong> • Wants to book your Westlands place
                <div class="inquiry-details">Weekend stay, Dec 22-24</div>
                <div class="inquiry-time">5 hours ago</div>
              </div>
              <div class="inquiry-actions">
                <button onclick="KejaEnhancedPortal.respondToInquiry('inq2')" class="btn-respond">Respond</button>
                <button onclick="KejaEnhancedPortal.viewInquiry('inq2')" class="btn-view">View</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="inquiry-tips">
          <h4>💡 Host Tips</h4>
          <div class="tip-list">
            <div class="tip-item">
              <i class="fas fa-clock"></i>
              <span>Respond quickly to increase booking chances</span>
            </div>
            <div class="tip-item">
              <i class="fas fa-phone"></i>
              <span>Confirm availability before accepting</span>
            </div>
            <div class="tip-item">
              <i class="fas fa-handshake"></i>
              <span>Be clear about check-in arrangements</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="marketplace-flow">
        <div class="flow-title">
          <i class="fas fa-route"></i>
          How KejaMarket BNB Works
        </div>
        <div class="flow-steps">
          <div class="flow-step">
            <div class="step-number">1</div>
            <div class="step-text">Guest finds your listing</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-number">2</div>
            <div class="step-text">Guest contacts you directly</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-number">3</div>
            <div class="step-text">You confirm availability</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-number">4</div>
            <div class="step-text">You arrange booking & payment</div>
          </div>
        </div>
      </div>
    `;
    
    dashboard.appendChild(inquirySection);
  },

  /**
   * Utility functions for BNB metrics
   */
  getBnbViews() {
    return Math.floor(Math.random() * 200) + 50; // 50-250 views
  },

  getGuestInquiries() {
    return Math.floor(Math.random() * 15) + 5; // 5-20 inquiries
  },

  /**
   * Setup standard landlord dashboard
   */
  setupLandlordDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="landlord-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏠 Landlord Dashboard</span>
          </div>
          <div class="landlord-badge">
            🏠 Property Owner
          </div>
        </div>
      `;
    }

    this.addLandlordProperties();
    this.addLandlordMetrics();
  },

  /**
   * Add standard landlord property management
   */
  addLandlordProperties() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const propertiesSection = document.createElement('div');
    propertiesSection.id = 'landlord-properties';
    propertiesSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-building"></i>
          My Properties
          <span class="properties-count">${this.properties.length} properties</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddPropertyModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Property
        </button>
      </div>

      <div class="properties-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏠</div>
            <div class="card-content">
              <div class="card-number">${this.getTotalUnits()}</div>
              <div class="card-label">Total Units</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">✅</div>
            <div class="card-content">
              <div class="card-number">${this.getVacantUnits()}</div>
              <div class="card-label">Vacant Units</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <div class="card-number">KSh ${this.getMonthlyRental().toLocaleString()}</div>
              <div class="card-label">Monthly Rental</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <div class="card-number">${this.getTenantInquiries()}</div>
              <div class="card-label">Inquiries</div>
            </div>
          </div>
        </div>
      </div>

      <div class="properties-list" id="properties-list">
        ${this.renderLandlordProperties()}
      </div>
    `;

    dashboard.appendChild(propertiesSection);
  },

  /**
   * Add multi-building management interface
   */
  addMultiBuildingManager() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    // Find insertion point (after existing content)
    const existingStats = dashboard.querySelector('.landlord-stats');
    
    const multiBuildingSection = document.createElement('div');
    multiBuildingSection.id = 'multi-building-manager';
    multiBuildingSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-building"></i>
          My Properties
          <span class="properties-count">${this.properties.length} properties</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddPropertyModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Property
        </button>
      </div>

      <div class="buildings-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏢</div>
            <div class="card-content">
              <div class="card-number" id="total-buildings">${this.properties.length}</div>
              <div class="card-label">Buildings</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🏠</div>
            <div class="card-content">
              <div class="card-number" id="total-units">${this.getTotalUnits()}</div>
              <div class="card-label">Total Units</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">✅</div>
            <div class="card-content">
              <div class="card-number" id="available-units">${this.getAvailableUnits()}</div>
              <div class="card-label">Available</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <div class="card-number" id="active-listings">${this.getActiveListings()}</div>
              <div class="card-label">Active Listings</div>
            </div>
          </div>
        </div>
      </div>

      <div class="buildings-list" id="buildings-list">
        ${this.renderBuildingsList()}
      </div>
    `;

    // Insert after stats or at beginning
    if (existingStats) {
      existingStats.insertAdjacentElement('afterend', multiBuildingSection);
    } else {
      dashboard.insertBefore(multiBuildingSection, dashboard.firstChild);
    }
  },

  /**
   * Render buildings list
   */
  renderBuildingsList() {
    if (this.properties.length === 0) {
      return `
        <div class="empty-properties">
          <div class="empty-icon">🏢</div>
          <div class="empty-title">No Properties Added Yet</div>
          <div class="empty-desc">Add your first building to start managing listings</div>
          <button onclick="KejaEnhancedPortal.showAddPropertyModal()" class="btn-primary">
            <i class="fas fa-plus"></i> Add Your First Property
          </button>
        </div>
      `;
    }

    return this.properties.map(property => `
      <div class="building-card" data-property-id="${property.id}">
        <div class="building-header">
          <div class="building-info">
            <div class="building-name">${property.title}</div>
            <div class="building-location">
              <i class="fas fa-map-marker-alt"></i>
              ${property.estateSuburb || property.corridor}
            </div>
          </div>
          <div class="building-actions">
            <button onclick="KejaEnhancedPortal.manageBuilding('${property.id}')" class="btn-manage">
              Manage
            </button>
            <button onclick="KejaEnhancedPortal.addUnit('${property.id}')" class="btn-add-unit">
              + Add Unit
            </button>
          </div>
        </div>
        
        <div class="building-stats">
          <div class="stat">
            <span class="stat-number">${property.totalUnits || 1}</span>
            <span class="stat-label">Units</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.availableUnits || 1}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.inquiries || 0}</span>
            <span class="stat-label">Inquiries</span>
          </div>
          ${property.hasPhotos || property.hasVideo ? `
          <div class="stat media-stat">
            <span class="stat-label">
              ${property.hasPhotos ? '📸' : ''}${property.hasVideo ? '🎥' : ''} Media
            </span>
          </div>
          ` : ''}
          <div class="stat status-${property.status}">
            <span class="stat-label">${property.status === 'available' ? '✅ Active' : '⏸️ Inactive'}</span>
          </div>
        </div>
        
        <div class="building-owner">
          <small>
            <i class="fas fa-user"></i>
            Owner: ${property.ownerContact || 'Contact on file'}
          </small>
        </div>
      </div>
    `).join('');
  },

  /**
   * Add caretaker-specific metrics
   */
  addCaretakerMetrics() {
    const dashboard = document.getElementById('landlord-dashboard');
    
    const metricsSection = document.createElement('div');
    metricsSection.id = 'caretaker-metrics';
    metricsSection.innerHTML = `
      <div class="section-header">
        <h3><i class="fas fa-chart-line"></i> Performance Metrics</h3>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📱</div>
          <div class="metric-content">
            <div class="metric-number">94%</div>
            <div class="metric-label">Response Rate</div>
            <div class="metric-trend">+5% this month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">👥</div>
          <div class="metric-content">
            <div class="metric-number">${this.getMonthlyInquiries()}</div>
            <div class="metric-label">Monthly Inquiries</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🏠</div>
          <div class="metric-content">
            <div class="metric-number">${this.getMonthlyRentals()}</div>
            <div class="metric-label">Units Rented</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⭐</div>
          <div class="metric-content">
            <div class="metric-number">4.8</div>
            <div class="metric-label">Tenant Rating</div>
            <div class="metric-trend">Excellent</div>
          </div>
        </div>
      </div>
    `;
    
    dashboard.appendChild(metricsSection);
  },

  /**
   * Add property owner communication section
   */
  addPropertyOwnerCommunication() {
    const dashboard = document.getElementById('landlord-dashboard');
    
    const commSection = document.createElement('div');
    commSection.id = 'owner-communication';
    commSection.innerHTML = `
      <div class="section-header">
        <h3><i class="fas fa-comments"></i> Owner Communication</h3>
      </div>
      
      <div class="communication-panel">
        <div class="quick-updates">
          <h4>Quick Updates</h4>
          <div class="update-buttons">
            <button onclick="KejaEnhancedPortal.sendOwnerUpdate('occupancy')" class="btn-update">
              📊 Send Occupancy Report
            </button>
            <button onclick="KejaEnhancedPortal.sendOwnerUpdate('maintenance')" class="btn-update">
              🔧 Report Maintenance Issue
            </button>
            <button onclick="KejaEnhancedPortal.sendOwnerUpdate('rental')" class="btn-update">
              💰 New Rental Update
            </button>
          </div>
        </div>
        
        <div class="message-owner">
          <h4>Send Message to Property Owners</h4>
          <textarea id="owner-message" placeholder="Type your message to property owners..." rows="3"></textarea>
          <button onclick="KejaEnhancedPortal.sendOwnerMessage()" class="btn-primary">
            <i class="fas fa-paper-plane"></i> Send Message
          </button>
        </div>
      </div>
    `;
    
    dashboard.appendChild(commSection);
  },

  /**
   * Utility functions for different property types
   */
  getOccupancyRate() {
    return Math.floor(Math.random() * 30) + 60; // 60-90%
  },

  getMonthlyEarnings() {
    return Math.floor(Math.random() * 50000) + 75000; // 75k-125k
  },

  getVacantUnits() {
    return this.properties.reduce((sum, prop) => sum + (prop.vacantUnits || Math.floor(Math.random() * 3)), 0);
  },

  getMonthlyRental() {
    return Math.floor(Math.random() * 100000) + 150000; // 150k-250k
  },

  getTenantInquiries() {
    return Math.floor(Math.random() * 15) + 5; // 5-20 inquiries
  },

  /**
   * Render standard landlord properties
   */
  renderLandlordProperties() {
    if (this.properties.length === 0) {
      return `
        <div class="empty-properties">
          <div class="empty-icon">🏠</div>
          <div class="empty-title">No Properties Added Yet</div>
          <div class="empty-desc">Add your first rental property to start managing tenants</div>
          <button onclick="KejaEnhancedPortal.showAddPropertyModal()" class="btn-primary">
            <i class="fas fa-plus"></i> Add Your First Property
          </button>
        </div>
      `;
    }

    return this.properties.map(property => `
      <div class="property-card" data-property-id="${property.id}">
        <div class="property-header">
          <div class="property-info">
            <div class="property-name">${property.title}</div>
            <div class="property-location">
              <i class="fas fa-map-marker-alt"></i>
              ${property.location}
            </div>
          </div>
          <div class="property-actions">
            <button onclick="KejaEnhancedPortal.manageProperty('${property.id}')" class="btn-manage">
              Manage
            </button>
            <button onclick="KejaEnhancedPortal.addUnit('${property.id}')" class="btn-add-unit">
              + Add Unit
            </button>
          </div>
        </div>
        
        <div class="property-stats">
          <div class="stat">
            <span class="stat-number">KSh ${property.monthlyRent || 25000}</span>
            <span class="stat-label">Monthly Rent</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.totalUnits || 1}</span>
            <span class="stat-label">Units</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.vacantUnits || 0}</span>
            <span class="stat-label">Vacant</span>
          </div>
          <div class="stat">
            <span class="stat-number">${property.inquiries || 0}</span>
            <span class="stat-label">Inquiries</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Add landlord metrics
   */
  addLandlordMetrics() {
    const dashboard = document.getElementById('landlord-dashboard');
    
    const metricsSection = document.createElement('div');
    metricsSection.id = 'landlord-metrics';
    metricsSection.innerHTML = `
      <div class="section-header">
        <h3><i class="fas fa-chart-line"></i> Property Performance</h3>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">👥</div>
          <div class="metric-content">
            <div class="metric-number">${this.getTenantInquiries()}</div>
            <div class="metric-label">Tenant Inquiries</div>
            <div class="metric-trend">This month</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🏠</div>
          <div class="metric-content">
            <div class="metric-number">${Math.floor(Math.random() * 5) + 2}</div>
            <div class="metric-label">Viewing Requests</div>
            <div class="metric-trend">This week</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <div class="metric-number">98%</div>
            <div class="metric-label">Collection Rate</div>
            <div class="metric-trend">Excellent</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⭐</div>
          <div class="metric-content">
            <div class="metric-number">4.6</div>
            <div class="metric-label">Tenant Rating</div>
            <div class="metric-trend">Good</div>
          </div>
        </div>
      </div>
    `;
    
    dashboard.appendChild(metricsSection);
  },

  /**
   * BNB Marketplace Actions (no booking management)
   */
  showAddBnbModal() {
    console.log('Showing add BNB listing modal');
    alert('Add BNB Listing - Set up your listing with photos, description, nightly rate, and contact preferences');
  },

  editBnbListing(propertyId) {
    console.log('Editing BNB listing:', propertyId);
    alert('Edit BNB Listing - Update photos, description, nightly rate, and availability status');
  },

  viewBnbInquiries(propertyId) {
    console.log('Viewing BNB inquiries for:', propertyId);
    alert('View Guest Inquiries - See all guests who have contacted you about this listing');
  },

  manageBnbListing(propertyId) {
    console.log('Managing BNB listing:', propertyId);
    alert('Manage BNB - Update listing details, respond to inquiries, manage photos');
  },

  respondToInquiry(inquiryId) {
    console.log('Responding to inquiry:', inquiryId);
    alert('Respond to Guest - Call, WhatsApp, or message the guest directly to confirm availability and arrange booking');
  },

  viewInquiry(inquiryId) {
    console.log('Viewing inquiry details:', inquiryId);
    alert('Inquiry Details - View full guest message, dates requested, and contact information');
  },

  manageProperty(propertyId) {
    console.log('Managing property:', propertyId);
    alert('Property management - coming soon!');
  },

  /**
   * Setup serviced apartment dashboard
   */
  setupServicedApartmentDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="serviced-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏨 Serviced Apartment Manager</span>
          </div>
          <div class="serviced-badge">
            🏨 Serviced Apartments
          </div>
        </div>
      `;
    }

    this.addServicedApartmentProperties();
  },

  /**
   * Setup guest house dashboard
   */
  setupGuestHouseDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="guesthouse-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏨 Guest House Manager</span>
          </div>
          <div class="guesthouse-badge">
            🏨 Guest House / Lodge
          </div>
        </div>
      `;
    }

    this.addGuestHouseProperties();
  },

  /**
   * Setup commercial property dashboard
   */
  setupCommercialDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="commercial-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏢 Commercial Property Manager</span>
          </div>
          <div class="commercial-badge">
            🏢 Commercial Properties
          </div>
        </div>
      `;
    }

    this.addCommercialProperties();
  },

  /**
   * Setup agent dashboard
   */
  setupAgentDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="agent-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🤝 Real Estate Agent Portal</span>
          </div>
          <div class="agent-badge">
            🤝 Real Estate Agent
          </div>
        </div>
      `;
    }

    this.addAgentProperties();
  },

  /**
   * Setup property manager dashboard
   */
  setupPropertyManagerDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      dashboardHeader.innerHTML = `
        <div class="manager-welcome">
          <div class="welcome-text">
            <span class="greeting">Welcome, ${this.user.name}</span>
            <span class="dashboard-title">🏢 Property Management Portal</span>
          </div>
          <div class="manager-badge">
            🏢 Property Manager
          </div>
        </div>
      `;
    }

    this.addPropertyManagerDashboard();
  },

  /**
   * Add serviced apartment management
   */
  addServicedApartmentProperties() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const servicedSection = document.createElement('div');
    servicedSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-concierge-bell"></i>
          My Serviced Apartments
          <span class="properties-count">${this.properties.length} apartments</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddServicedApartmentModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Apartment
        </button>
      </div>

      <div class="serviced-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏨</div>
            <div class="card-content">
              <div class="card-number">${this.properties.length}</div>
              <div class="card-label">Apartments</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📅</div>
            <div class="card-content">
              <div class="card-number">${this.getOccupancyRate()}%</div>
              <div class="card-label">Occupancy</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🛎️</div>
            <div class="card-content">
              <div class="card-number">24/7</div>
              <div class="card-label">Concierge</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">⭐</div>
            <div class="card-content">
              <div class="card-number">4.7</div>
              <div class="card-label">Service Rating</div>
            </div>
          </div>
        </div>
      </div>

      <div class="properties-list">
        <div class="empty-properties">
          <div class="empty-icon">🏨</div>
          <div class="empty-title">No Serviced Apartments Yet</div>
          <div class="empty-desc">Add your first serviced apartment with hotel-like amenities</div>
          <button onclick="KejaEnhancedPortal.showAddServicedApartmentModal()" class="btn-primary">
            <i class="fas fa-plus"></i> Add Serviced Apartment
          </button>
        </div>
      </div>
    `;

    dashboard.appendChild(servicedSection);
  },

  /**
   * Add guest house management
   */
  addGuestHouseProperties() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const guestSection = document.createElement('div');
    guestSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-bed"></i>
          My Guest House
          <span class="properties-count">Hospitality Management</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showRoomManagementModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Manage Rooms
        </button>
      </div>

      <div class="guesthouse-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🛏️</div>
            <div class="card-content">
              <div class="card-number">12</div>
              <div class="card-label">Total Rooms</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">✅</div>
            <div class="card-content">
              <div class="card-number">8</div>
              <div class="card-label">Available</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📋</div>
            <div class="card-content">
              <div class="card-number">5</div>
              <div class="card-label">Reservations</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">⭐</div>
            <div class="card-content">
              <div class="card-number">4.9</div>
              <div class="card-label">Guest Rating</div>
            </div>
          </div>
        </div>
      </div>
    `;

    dashboard.appendChild(guestSection);
  },

  /**
   * Add commercial property management
   */
  addCommercialProperties() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const commercialSection = document.createElement('div');
    commercialSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-building"></i>
          Commercial Portfolio
          <span class="properties-count">Business Properties</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddCommercialModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Commercial Space
        </button>
      </div>

      <div class="commercial-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏢</div>
            <div class="card-content">
              <div class="card-number">${this.properties.length}</div>
              <div class="card-label">Properties</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🏪</div>
            <div class="card-content">
              <div class="card-number">24</div>
              <div class="card-label">Total Spaces</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💼</div>
            <div class="card-content">
              <div class="card-number">18</div>
              <div class="card-label">Occupied</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <div class="card-number">KSh 450K</div>
              <div class="card-label">Monthly Income</div>
            </div>
          </div>
        </div>
      </div>
    `;

    dashboard.appendChild(commercialSection);
  },

  /**
   * Add agent portfolio management
   */
  addAgentProperties() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const agentSection = document.createElement('div');
    agentSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-handshake"></i>
          Client Properties
          <span class="properties-count">Active Listings</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddClientPropertyModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Client Property
        </button>
      </div>

      <div class="agent-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏠</div>
            <div class="card-content">
              <div class="card-number">${this.properties.length}</div>
              <div class="card-label">Active Listings</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <div class="card-number">15</div>
              <div class="card-label">Clients</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📅</div>
            <div class="card-content">
              <div class="card-number">8</div>
              <div class="card-label">Viewings Scheduled</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <div class="card-number">KSh 125K</div>
              <div class="card-label">Commission YTD</div>
            </div>
          </div>
        </div>
      </div>
    `;

    dashboard.appendChild(agentSection);
  },

  /**
   * Add property manager dashboard
   */
  addPropertyManagerDashboard() {
    const dashboard = document.getElementById('landlord-dashboard');
    if (!dashboard) return;

    const managerSection = document.createElement('div');
    managerSection.innerHTML = `
      <div class="section-header">
        <h3>
          <i class="fas fa-building-user"></i>
          Property Portfolio
          <span class="properties-count">Professional Management</span>
        </h3>
        <button onclick="KejaEnhancedPortal.showAddManagedPropertyModal()" class="btn-add-property">
          <i class="fas fa-plus"></i> Add Managed Property
        </button>
      </div>

      <div class="manager-overview">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🏢</div>
            <div class="card-content">
              <div class="card-number">${this.properties.length}</div>
              <div class="card-label">Managed Properties</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">👤</div>
            <div class="card-content">
              <div class="card-number">8</div>
              <div class="card-label">Property Owners</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🏠</div>
            <div class="card-content">
              <div class="card-number">45</div>
              <div class="card-label">Total Units</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <div class="card-number">92%</div>
              <div class="card-label">Occupancy Rate</div>
            </div>
          </div>
        </div>
      </div>
    `;

    dashboard.appendChild(managerSection);
  },

  /**
   * Modal methods for different property types
   */
  showAddServicedApartmentModal() {
    alert('Serviced apartment setup - coming soon!');
  },

  showRoomManagementModal() {
    alert('Room management - coming soon!');
  },

  showAddCommercialModal() {
    alert('Commercial space setup - coming soon!');
  },

  showAddClientPropertyModal() {
    alert('Client property listing - coming soon!');
  },

  showAddManagedPropertyModal() {
    alert('Managed property setup - coming soon!');
  },

  addUnit(propertyId) {
    console.log('Adding unit to property:', propertyId);
    alert('Add unit functionality - coming soon!');
  },
  getTotalUnits() {
    return this.properties.reduce((sum, prop) => sum + (prop.totalUnits || 1), 0);
  },

  getAvailableUnits() {
    return this.properties.reduce((sum, prop) => sum + (prop.availableUnits || (prop.status === 'available' ? 1 : 0)), 0);
  },

  getActiveListings() {
    return this.properties.filter(prop => prop.status === 'available').length;
  },

  getMonthlyInquiries() {
    // This would come from actual data in production
    return Math.floor(Math.random() * 25) + 10;
  },

  getMonthlyRentals() {
    // This would come from actual data in production
    return Math.floor(Math.random() * 8) + 2;
  },

  /**
   * Load user properties from backend
   */
  async loadUserProperties() {
    try {
      const response = await fetch('/api/landlord/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kejaToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.properties = data.properties || [];
        
        // Update UI if already rendered
        const buildingsList = document.getElementById('buildings-list');
        if (buildingsList) {
          buildingsList.innerHTML = this.renderBuildingsList();
        }
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  },

  /**
   * Property management actions
   */
  showAddPropertyModal() {
    // Create enhanced property addition modal
    const modalHTML = `
      <div class="modal-overlay" id="add-property-modal">
        <div class="modal-content property-modal">
          <div class="modal-header">
            <h3>Add New Property</h3>
            <button onclick="KejaEnhancedPortal.closeModal('add-property-modal')" class="modal-close">&times;</button>
          </div>
          
          <form id="add-property-form" onsubmit="KejaEnhancedPortal.submitProperty(event)">
            <div class="form-row">
              <div class="form-group">
                <label>Property/Building Name *</label>
                <input type="text" id="property-name" required placeholder="e.g. Sunrise Apartments">
              </div>
              <div class="form-group">
                <label>Total Units *</label>
                <input type="number" id="property-units" required min="1" placeholder="20">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Location *</label>
                <input type="text" id="property-location" required placeholder="e.g. Kilimani, Nairobi">
              </div>
              <div class="form-group">
                <label>Available Units</label>
                <input type="number" id="property-available" min="0" placeholder="5">
              </div>
            </div>
            
            <div class="form-group">
              <label>Property Owner Contact</label>
              <input type="text" id="property-owner" placeholder="Owner's name and phone">
            </div>
            
            <div class="form-group">
              <label>Additional Notes</label>
              <textarea id="property-notes" rows="3" placeholder="Any additional information about this property..."></textarea>
            </div>

            <div class="form-section media-section">
              <h4>📸 Property Media (Optional)</h4>
              <p class="media-help">Add photos of the building exterior, common areas, and sample units</p>
              
              <div class="media-upload-area">
                <div class="upload-section">
                  <label class="upload-label">
                    <i class="fas fa-camera"></i>
                    <span class="upload-title">Property Photos (Max 5)</span>
                    <span class="upload-desc">Building exterior, common areas</span>
                    <input type="file" id="property-photos" multiple accept="image/*" onchange="KejaEnhancedPortal.handlePropertyPhotoUpload(event)">
                  </label>
                  <div id="property-photo-preview" class="media-preview"></div>
                </div>

                <div class="upload-section">
                  <label class="upload-label">
                    <i class="fas fa-video"></i>
                    <span class="upload-title">Property Video (Max 1)</span>
                    <span class="upload-desc">Building walkthrough tour</span>
                    <input type="file" id="property-video" accept="video/*" onchange="KejaEnhancedPortal.handlePropertyVideoUpload(event)">
                  </label>
                  <div id="property-video-preview" class="media-preview"></div>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" onclick="KejaEnhancedPortal.closeModal('add-property-modal')" class="btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-plus"></i> Add Property
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  async submitProperty(event) {
    event.preventDefault();
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      const propertyData = {
        title: document.getElementById('property-name').value,
        totalUnits: parseInt(document.getElementById('property-units').value),
        location: document.getElementById('property-location').value,
        availableUnits: parseInt(document.getElementById('property-available').value) || 0,
        ownerContact: document.getElementById('property-owner').value,
        notes: document.getElementById('property-notes').value,
        addedBy: 'caretaker',
        caretakerId: this.user.id
      };
      
      // Add basic data to form
      Object.keys(propertyData).forEach(key => {
        formData.append(key, propertyData[key]);
      });

      // Add property photos
      const propertyPhotos = document.getElementById('property-photos').files;
      for (let i = 0; i < propertyPhotos.length; i++) {
        formData.append('propertyPhotos', propertyPhotos[i]);
      }

      // Add property video
      const propertyVideo = document.getElementById('property-video').files[0];
      if (propertyVideo) {
        formData.append('propertyVideo', propertyVideo);
      }

      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Property...';
      submitBtn.disabled = true;

      console.log('Adding property with media:', propertyData);
      
      // Simulate success with media info
      setTimeout(() => {
        // Add to properties list
        this.properties.push({
          id: Date.now().toString(),
          ...propertyData,
          status: 'available',
          inquiries: 0,
          hasPhotos: propertyPhotos.length > 0,
          hasVideo: !!propertyVideo,
          mediaCount: propertyPhotos.length + (propertyVideo ? 1 : 0)
        });
        
        // Refresh the buildings list
        const buildingsList = document.getElementById('buildings-list');
        if (buildingsList) {
          buildingsList.innerHTML = this.renderBuildingsList();
        }
        
        this.closeModal('add-property-modal');
        
        let mediaMessage = '';
        if (propertyPhotos.length > 0 || propertyVideo) {
          mediaMessage = ` Media uploaded: ${propertyPhotos.length} photos${propertyVideo ? ' and 1 video' : ''}.`;
        }
        
        this.showSuccessMessage(`Property added successfully!${mediaMessage}`);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
      
      // Reset button
      const submitBtn = event.target.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Property';
      submitBtn.disabled = false;
    }
  },

  manageBuilding(propertyId) {
    console.log('Managing building:', propertyId);
    // This would open a detailed building management interface
    alert(`Managing building ${propertyId} - Full interface coming soon!`);
  },

  addUnit(propertyId) {
    console.log('Adding unit to building:', propertyId);
    
    // Create enhanced unit addition modal with media upload
    const modalHTML = `
      <div class="modal-overlay" id="add-unit-modal">
        <div class="modal-content unit-modal">
          <div class="modal-header">
            <h3>Add New Unit Listing</h3>
            <button onclick="KejaEnhancedPortal.closeModal('add-unit-modal')" class="modal-close">&times;</button>
          </div>
          
          <form id="add-unit-form" onsubmit="KejaEnhancedPortal.submitUnit(event)">
            <div class="form-section">
              <h4>Basic Information</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Unit Type *</label>
                  <select id="unit-type" required>
                    <option value="">Select unit type</option>
                    <option value="Bedsitter / Studio">Bedsitter / Studio</option>
                    <option value="1 Bedroom">1 Bedroom</option>
                    <option value="2 Bedroom">2 Bedroom</option>
                    <option value="3 Bedroom">3 Bedroom</option>
                    <option value="Maisonette / Townhouse">Maisonette / Townhouse</option>
                    <option value="Single Room">Single Room</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Monthly Rent (KES) *</label>
                  <input type="number" id="unit-rent" required min="1000" placeholder="15000">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Unit Number/Name *</label>
                  <input type="text" id="unit-number" required placeholder="e.g. Unit 2A, Flat 5">
                </div>
                <div class="form-group">
                  <label>Deposit (KES)</label>
                  <input type="number" id="unit-deposit" placeholder="15000">
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Unit Details</h4>
              <div class="form-group">
                <label>Description *</label>
                <textarea id="unit-description" required rows="3" placeholder="Describe the unit, amenities, and key features..."></textarea>
              </div>
              
              <div class="amenities-section">
                <label>Amenities</label>
                <div class="amenities-grid">
                  <label><input type="checkbox" value="Water"> 💧 Water Supply</label>
                  <label><input type="checkbox" value="Electricity"> ⚡ Electricity</label>
                  <label><input type="checkbox" value="Parking"> 🚗 Parking</label>
                  <label><input type="checkbox" value="Security"> 🛡️ Security</label>
                  <label><input type="checkbox" value="CCTV"> 📹 CCTV</label>
                  <label><input type="checkbox" value="WiFi"> 📶 WiFi Ready</label>
                  <label><input type="checkbox" value="Balcony"> 🏠 Balcony</label>
                  <label><input type="checkbox" value="Borehole"> 💧 Borehole</label>
                </div>
              </div>
            </div>

            <div class="form-section media-section">
              <h4>📸 Property Media</h4>
              <p class="media-help">Add photos and video to showcase this unit (helps attract more tenants)</p>
              
              <div class="media-upload-area">
                <div class="upload-section">
                  <label class="upload-label">
                    <i class="fas fa-camera"></i>
                    <span class="upload-title">Unit Photos (Max 8)</span>
                    <span class="upload-desc">JPG, PNG up to 2MB each</span>
                    <input type="file" id="unit-photos" multiple accept="image/*" onchange="KejaEnhancedPortal.handlePhotoUpload(event)">
                  </label>
                  <div id="photo-preview" class="media-preview"></div>
                </div>

                <div class="upload-section">
                  <label class="upload-label">
                    <i class="fas fa-video"></i>
                    <span class="upload-title">Unit Video Tour (Max 1)</span>
                    <span class="upload-desc">MP4, MOV max 1min 30sec</span>
                    <input type="file" id="unit-video" accept="video/*" onchange="KejaEnhancedPortal.handleVideoUpload(event)">
                  </label>
                  <div id="video-preview" class="media-preview"></div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Availability</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Available From</label>
                  <input type="date" id="unit-available" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select id="unit-status">
                    <option value="available">✅ Available Now</option>
                    <option value="coming-soon">⏳ Coming Soon</option>
                    <option value="occupied">🏠 Occupied</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" onclick="KejaEnhancedPortal.closeModal('add-unit-modal')" class="btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-plus"></i> Add Unit Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  sendOwnerUpdate(type) {
    console.log('Sending owner update:', type);
    // This would send specific update types to property owners
    this.showSuccessMessage(`${type} update sent to property owners!`);
  },

  sendOwnerMessage() {
    const message = document.getElementById('owner-message').value;
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }
    
    console.log('Sending message to owners:', message);
    // This would send the message to all property owners
    document.getElementById('owner-message').value = '';
    this.showSuccessMessage('Message sent to property owners!');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  },

  /**
   * Property media upload handlers
   */
  handlePropertyPhotoUpload(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('property-photo-preview');
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed for property`);
      event.target.value = '';
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';

    files.forEach((file, index) => {
      if (file.size > maxSize) {
        alert(`Photo ${file.name} is too large. Maximum 5MB per photo.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'media-item';
        photoItem.innerHTML = `
          <div class="media-thumbnail">
            <img src="${e.target.result}" alt="Property photo ${index + 1}">
            <button type="button" class="remove-media" onclick="this.parentElement.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="media-info">
            <div class="media-name">${file.name}</div>
            <div class="media-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
          </div>
        `;
        preview.appendChild(photoItem);
      };
      reader.readAsDataURL(file);
    });
  },

  handlePropertyVideoUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('property-video-preview');
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!file) return;

    if (file.size > maxSize) {
      alert('Video file is too large. Maximum 50MB allowed.');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      event.target.value = '';
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      const videoItem = document.createElement('div');
      videoItem.className = 'media-item';
      videoItem.innerHTML = `
        <div class="media-thumbnail video-thumbnail">
          <video src="${e.target.result}" controls>
            Your browser does not support video preview.
          </video>
          <button type="button" class="remove-media" onclick="this.parentElement.parentElement.remove(); document.getElementById('property-video').value = '';">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="media-info">
          <div class="media-name">${file.name}</div>
          <div class="media-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
          <div class="media-type">Property Tour</div>
        </div>
      `;
      preview.appendChild(videoItem);
    };
    reader.readAsDataURL(file);
  },
  handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('photo-preview');
    const maxFiles = 8;
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      event.target.value = '';
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';

    files.forEach((file, index) => {
      if (file.size > maxSize) {
        alert(`Photo ${file.name} is too large. Maximum 2MB per photo.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'media-item';
        photoItem.innerHTML = `
          <div class="media-thumbnail">
            <img src="${e.target.result}" alt="Unit photo ${index + 1}">
            <button type="button" class="remove-media" onclick="this.parentElement.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="media-info">
            <div class="media-name">${file.name}</div>
            <div class="media-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
          </div>
        `;
        preview.appendChild(photoItem);
      };
      reader.readAsDataURL(file);
    });
  },

  handleVideoUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('video-preview');

    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      event.target.value = '';
      return;
    }

    // Check video duration (1 minute 30 seconds = 90 seconds)
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      if (video.duration > 90) {
        alert('Video is too long. Maximum duration is 1 minute 30 seconds.');
        event.target.value = '';
        return;
      }

      // Clear previous preview
      preview.innerHTML = '';

      const reader = new FileReader();
      reader.onload = (e) => {
        const videoItem = document.createElement('div');
        videoItem.className = 'media-item';
        videoItem.innerHTML = `
          <div class="media-thumbnail video-thumbnail">
            <video src="${e.target.result}" controls>
              Your browser does not support video preview.
            </video>
            <button type="button" class="remove-media" onclick="this.parentElement.parentElement.remove(); document.getElementById('unit-video').value = '';">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="media-info">
            <div class="media-name">${file.name}</div>
            <div class="media-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
            <div class="media-type">Video Tour</div>
            <div class="media-duration">${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}</div>
          </div>
        `;
        preview.appendChild(videoItem);
      };
      reader.readAsDataURL(file);
    };

    video.src = URL.createObjectURL(file);
  },

  /**
   * Submit unit with media
   */
  async submitUnit(event) {
    event.preventDefault();
    
    try {
      // Collect form data
      const formData = new FormData();
      
      // Basic unit information
      const unitData = {
        type: document.getElementById('unit-type').value,
        rent: document.getElementById('unit-rent').value,
        unitNumber: document.getElementById('unit-number').value,
        deposit: document.getElementById('unit-deposit').value || 0,
        description: document.getElementById('unit-description').value,
        availableFrom: document.getElementById('unit-available').value,
        status: document.getElementById('unit-status').value,
        caretakerId: this.user.id,
        isCaretakerListing: true
      };

      // Collect amenities
      const amenities = [];
      document.querySelectorAll('.amenities-grid input:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
      });
      unitData.amenities = amenities;

      // Add basic data to form
      Object.keys(unitData).forEach(key => {
        formData.append(key, unitData[key]);
      });

      // Add photos
      const photoFiles = document.getElementById('unit-photos').files;
      for (let i = 0; i < photoFiles.length; i++) {
        formData.append('photos', photoFiles[i]);
      }

      // Add video
      const videoFile = document.getElementById('unit-video').files[0];
      if (videoFile) {
        formData.append('video', videoFile);
      }

      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading Media...';
      submitBtn.disabled = true;

      // Submit to backend
      console.log('Submitting unit with media...', unitData);
      
      // In a real implementation, this would upload to the backend
      // For now, simulate success
      setTimeout(() => {
        this.closeModal('add-unit-modal');
        this.showSuccessMessage(`Unit listing created successfully! ${photoFiles.length} photos and ${videoFile ? '1 video' : 'no video'} uploaded.`);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 2000);

      /* Real implementation would be:
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kejaToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.closeModal('add-unit-modal');
        this.showSuccessMessage('Unit listing created successfully with media!');
        // Refresh properties list
        this.loadUserProperties();
      } else {
        throw new Error('Failed to create listing');
      }
      */

    } catch (error) {
      console.error('Error creating unit listing:', error);
      alert('Failed to create unit listing. Please try again.');
      
      // Reset button
      const submitBtn = event.target.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Unit Listing';
      submitBtn.disabled = false;
    }
  },

  showSuccessMessage(message) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
};

// Initialize when user data is available
if (typeof window !== 'undefined') {
  window.KejaEnhancedPortal = KejaEnhancedPortal;
}

// Auto-initialize if landlord portal exists
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the landlord portal and user is a caretaker
  if (document.getElementById('landlord-dashboard') && 
      localStorage.getItem('kejaToken')) {
    
    // Get user data and initialize if caretaker
    try {
      const userData = JSON.parse(localStorage.getItem('kejaUser') || '{}');
      if (userData.registrationData?.isCaretaker || 
          userData.registrationData?.propertyRole === 'caretaker') {
        KejaEnhancedPortal.init(userData);
      }
    } catch (error) {
      console.error('Error initializing enhanced portal:', error);
    }
  }
});