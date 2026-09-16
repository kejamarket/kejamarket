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
    const isCaretaker = this.user.registrationData?.isCaretaker || 
                       this.user.registrationData?.propertyRole === 'caretaker';
    
    if (isCaretaker) {
      this.setupCaretakerDashboard();
    } else {
      this.setupStandardDashboard();
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
   * Setup standard property owner dashboard
   */
  setupStandardDashboard() {
    const dashboardHeader = document.querySelector('#landlord-dashboard h2');
    if (dashboardHeader) {
      const role = this.user.registrationData?.propertyRole || 'landlord';
      let dashboardTitle = '🏠 Property Owner Dashboard';
      
      switch(role) {
        case 'agent':
          dashboardTitle = '🤝 Real Estate Agent Dashboard';
          break;
        case 'company':
          dashboardTitle = '🏢 Property Management Dashboard';
          break;
      }
      
      dashboardHeader.innerHTML = `
        <div class="owner-welcome">
          <span class="greeting">Welcome, ${this.user.name}</span>
          <span class="dashboard-title">${dashboardTitle}</span>
        </div>
      `;
    }
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
   * Utility functions
   */
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
    
    try {
      // In a real implementation, this would save to the backend
      console.log('Adding property:', propertyData);
      
      // Simulate success
      this.properties.push({
        id: Date.now().toString(),
        ...propertyData,
        status: 'available',
        inquiries: 0
      });
      
      // Refresh the buildings list
      const buildingsList = document.getElementById('buildings-list');
      if (buildingsList) {
        buildingsList.innerHTML = this.renderBuildingsList();
      }
      
      this.closeModal('add-property-modal');
      this.showSuccessMessage('Property added successfully!');
      
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
    }
  },

  manageBuilding(propertyId) {
    console.log('Managing building:', propertyId);
    // This would open a detailed building management interface
    alert(`Managing building ${propertyId} - Full interface coming soon!`);
  },

  addUnit(propertyId) {
    console.log('Adding unit to building:', propertyId);
    // This would open the add listing form for this specific building
    if (window.landlordPortal && window.landlordPortal.showAddListingModal) {
      window.landlordPortal.showAddListingModal();
    }
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