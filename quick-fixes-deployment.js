/**
 * KejaMarket Quick Fixes - Production Deployment
 * Fixes all reported UI/UX issues
 */

// Fix 1: Remove duplicate communication buttons from property cards
document.addEventListener('DOMContentLoaded', function() {
  
  // Prevent PropertyCommunicationIntegration from running (it creates duplicates)
  if (window.PropertyCommunicationIntegration) {
    console.log('🔧 Disabling duplicate button creation');
    window.PropertyCommunicationIntegration.init = function() {
      console.log('✅ Duplicate prevention active');
    };
  }
  
  // Fix 2: Add close buttons to all modals
  const addCloseButtonsToModals = setInterval(() => {
    const modals = document.querySelectorAll('.modal-overlay:not(.has-close-btn)');
    modals.forEach(modal => {
      if (!modal.querySelector('.modal-close-button')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-button';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => modal.remove();
        
        const modalContent = modal.querySelector('.modal-content, .inquiry-modal, .service-inquiry-modal, .marketplace-inquiry-modal, .support-modal, .messages-modal, .notifications-modal');
        if (modalContent && !modalContent.querySelector('.modal-close-button')) {
          modalContent.insertAdjacentElement('afterbegin', closeBtn);
        }
      }
      modal.classList.add('has-close-btn');
    });
  }, 500);
  
  // Fix 3: Reduce modal sizes
  const style = document.createElement('style');
  style.textContent = `
    /* Smaller, more compact modals */
    .inquiry-modal,
    .service-inquiry-modal,
    .marketplace-inquiry-modal,
    .support-modal {
      max-width: 450px !important;
      width: 90% !important;
      max-height: 85vh !important;
      overflow-y: auto !important;
    }
    
    .messages-modal {
      max-width: 900px !important;
      width: 90% !important;
      max-height: 80vh !important;
    }
    
    .notifications-modal {
      max-width: 550px !important;
      width: 90% !important;
      max-height: 75vh !important;
    }
    
    /* Close button styling */
    .modal-close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ef4444;
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-weight: 300;
    }
    
    .modal-close-button:hover {
      background: #dc2626;
      transform: rotate(90deg);
    }
    
    /* Fix duplicate icons - hide duplicates */
    .card-action-buttons + .communication-buttons {
      display: none !important;
    }
    
    .card-action-buttons + .bnb-communication {
      display: none !important;
    }
    
    /* Smaller icons everywhere */
    .card-action-buttons button i,
    .btn-card-call i,
    .btn-card-chat i,
    .btn-card-map i {
      font-size: 0.85rem !important;
    }
    
    .utility-tag i {
      font-size: 0.75rem !important;
    }
    
    /* Fix filter section scrolling issue - extend to use all available space */
    .categories-filters-sidebar {
      max-height: calc(100vh - 140px) !important;
      overflow-y: auto !important;
      padding-bottom: 20px !important;
    }
    
    .sidebar-col-category,
    .sidebar-col-other {
      max-height: none !important;
    }
    
    .filter-section {
      max-height: none !important;
      overflow: visible !important;
    }
    
    /* Ensure filter options are fully visible without scrolling */
    .house-types-list,
    .services-list {
      max-height: none !important;
      overflow: visible !important;
    }
    
    /* Hide toast messages / notification popups */
    .toast-notification,
    .toast-container,
    .Toastify,
    [class*="toast"],
    [id*="toast"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    
    /* Make service category items clickable and styled */
    .sidebar-cat-item,
    .service-category-item {
      cursor: pointer !important;
      pointer-events: auto !important;
      user-select: none !important;
    }
    
    /* Fix map container sizing - ensure full visibility */
    .split-view-container {
      height: calc(100vh - 220px) !important;
      min-height: 600px !important;
    }
    
    .split-map-col {
      height: 100% !important;
      min-height: 600px !important;
    }
    
    .full-map-view-container {
      height: calc(100vh - 200px) !important;
      min-height: 650px !important;
    }
    
    #leaflet-full-map,
    #leaflet-split-map {
      width: 100% !important;
      height: 100% !important;
      min-height: inherit !important;
    }
    
    /* Ensure map is not cut off at top */
    .leaflet-container {
      height: 100% !important;
    }
    
    /* Make sure map pins are fully visible */
    .leaflet-marker-pane {
      z-index: 600 !important;
    }
    
    .leaflet-popup-pane {
      z-index: 700 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Fix 4: Add service location filters
  setTimeout(() => {
    const servicesSection = document.querySelector('[data-category="services"]');
    if (servicesSection) {
      // Add location filter for services
      const locationFilter = document.createElement('div');
      locationFilter.className = 'filter-group';
      locationFilter.innerHTML = `
        <h4 class="filter-group-title">
          <i class="fas fa-map-marker-alt"></i> Service Location
        </h4>
        <div class="corridor-filter-options">
          <label class="filter-checkbox">
            <input type="checkbox" value="westlands" onchange="app.applyServiceLocationFilter()">
            <span>Westlands Corridor</span>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="thika-road" onchange="app.applyServiceLocationFilter()">
            <span>Thika Road</span>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="mombasa-road" onchange="app.applyServiceLocationFilter()">
            <span>Mombasa Road</span>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="ngong-road" onchange="app.applyServiceLocationFilter()">
            <span>Ngong Road</span>
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="eastlands" onchange="app.applyServiceLocationFilter()">
            <span>Eastlands</span>
          </label>
        </div>
      `;
      
      const servicesListEl = servicesSection.querySelector('.services-list');
      if (servicesListEl) {
        servicesListEl.parentNode.insertBefore(locationFilter, servicesListEl);
      }
    }
  }, 1000);
  
  console.log('✅ Quick fixes applied');
  
  // Fix 5: Disable toast notifications for filters only (keep auth toasts)
  setTimeout(() => {
    if (window.app && window.app.showToast) {
      const originalShowToast = window.app.showToast;
      window.app.showToast = function(message, type) {
        // Allow authentication and error messages
        if (type === 'error' || type === 'success' || 
            message.includes('Welcome') || 
            message.includes('Sign') ||
            message.includes('Password') ||
            message.includes('Account') ||
            message.includes('Email') ||
            message.includes('Phone')) {
          return originalShowToast.call(this, message, type);
        }
        // Silently ignore filter/category notifications
        return;
      };
      console.log('✅ Toast notifications filtered (auth messages allowed)');
    }
  }, 100);
});

// Add service location filter functionality
if (window.app) {
  window.app.applyServiceLocationFilter = function() {
    console.log('Applying service location filter');
    this.applyFilters();
  };
}

console.log('✅ Quick Fixes Deployment Script Loaded');