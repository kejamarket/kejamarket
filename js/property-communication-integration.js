/**
 * Property Communication Integration
 * Adds communication buttons to property listings
 */

const PropertyCommunicationIntegration = {

  /**
   * Add communication buttons to property cards
   */
  enhancePropertyCards() {
    // Find all property cards
    const propertyCards = document.querySelectorAll('.property-card, .listing-card');
    
    propertyCards.forEach(card => {
      if (card.querySelector('.communication-buttons')) {
        return; // Already enhanced
      }
      
      const propertyId = card.dataset.propertyId || 'prop_' + Date.now();
      const propertyName = card.querySelector('.property-title, .listing-title')?.textContent || 'Property';
      const propertyType = card.classList.contains('bnb-card') ? 'bnb' : 'rental';
      
      this.addCommunicationButtons(card, propertyId, propertyName, propertyType);
    });
  },

  /**
   * Add communication buttons to a property card
   */
  addCommunicationButtons(card, propertyId, propertyName, propertyType) {
    const communicationSection = document.createElement('div');
    communicationSection.className = 'communication-buttons';
    communicationSection.innerHTML = `
      <div class="property-actions">
        <button class="btn-inquiry primary" onclick="PropertyCommunication.sendInquiry('${propertyId}', '${propertyName}', '${propertyType}')">
          🟢 Send Inquiry
        </button>
        
        <div class="secondary-actions">
          <button class="btn-communication secondary" onclick="PropertyCommunication.initiateWhatsApp('${propertyId}')">
            📱 WhatsApp
          </button>
          <button class="btn-communication secondary" onclick="PropertyCommunication.initiateCall('${propertyId}')">
            📞 Call
          </button>
          ${propertyType === 'rental' ? `
            <button class="btn-communication secondary" onclick="PropertyCommunication.requestViewing('${propertyId}', '${propertyName}')">
              👁️ View
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    // Insert before existing action buttons or at the end
    const existingActions = card.querySelector('.property-actions, .listing-actions');
    if (existingActions) {
      existingActions.parentNode.insertBefore(communicationSection, existingActions);
    } else {
      card.appendChild(communicationSection);
    }
  },

  /**
   * Add communication to BNB cards specifically
   */
  enhanceBNBCards() {
    const bnbCards = document.querySelectorAll('.bnb-card, [data-property-type="bnb"]');
    
    bnbCards.forEach(card => {
      if (card.querySelector('.bnb-communication')) {
        return; // Already enhanced
      }
      
      const propertyId = card.dataset.propertyId || 'bnb_' + Date.now();
      const propertyName = card.querySelector('.bnb-title, .property-title')?.textContent || 'BNB Property';
      
      const communicationSection = document.createElement('div');
      communicationSection.className = 'bnb-communication';
      communicationSection.innerHTML = `
        <div class="bnb-actions">
          <button class="btn-check-availability" onclick="PropertyCommunication.checkBNBAvailability('${propertyId}', '${propertyName}')">
            📅 Check Availability
          </button>
          
          <div class="bnb-contact-options">
            <button class="btn-bnb-contact" onclick="PropertyCommunication.contactHost('${propertyId}')">
              💬 Contact Host
            </button>
            <button class="btn-bnb-whatsapp" onclick="PropertyCommunication.initiateWhatsApp('${propertyId}')">
              📱 WhatsApp
            </button>
          </div>
        </div>
        
        <div class="availability-notice">
          <i class="fas fa-info-circle"></i>
          Availability confirmed directly by host
        </div>
      `;
      
      card.appendChild(communicationSection);
    });
  },

  /**
   * Enhance service provider cards
   */
  enhanceServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card, .provider-card');
    
    serviceCards.forEach(card => {
      if (card.querySelector('.service-communication')) {
        return;
      }
      
      const serviceId = card.dataset.serviceId || 'service_' + Date.now();
      const serviceName = card.querySelector('.service-name, .provider-name')?.textContent || 'Service Provider';
      
      const communicationSection = document.createElement('div');
      communicationSection.className = 'service-communication';
      communicationSection.innerHTML = `
        <div class="service-actions">
          <button class="btn-request-service" onclick="PropertyCommunication.requestService('${serviceId}', '${serviceName}')">
            🔧 Request Service
          </button>
          
          <div class="service-contact-options">
            <button class="btn-service-chat" onclick="PropertyCommunication.chatWithProvider('${serviceId}')">
              💬 Chat
            </button>
            <button class="btn-service-call" onclick="PropertyCommunication.initiateCall('${serviceId}')">
              📞 Call
            </button>
            <button class="btn-service-whatsapp" onclick="PropertyCommunication.initiateWhatsApp('${serviceId}')">
              📱 WhatsApp
            </button>
          </div>
        </div>
      `;
      
      card.appendChild(communicationSection);
    });
  },

  /**
   * Enhance marketplace item cards
   */
  enhanceMarketplaceCards() {
    const marketplaceCards = document.querySelectorAll('.marketplace-card, .item-card');
    
    marketplaceCards.forEach(card => {
      if (card.querySelector('.marketplace-communication')) {
        return;
      }
      
      const itemId = card.dataset.itemId || 'item_' + Date.now();
      const itemName = card.querySelector('.item-title, .item-name')?.textContent || 'Marketplace Item';
      
      const communicationSection = document.createElement('div');
      communicationSection.className = 'marketplace-communication';
      communicationSection.innerHTML = `
        <div class="marketplace-actions">
          <button class="btn-ask-seller" onclick="PropertyCommunication.askSeller('${itemId}', '${itemName}')">
            🛒 Ask Seller
          </button>
          
          <div class="seller-contact-options">
            <button class="btn-marketplace-chat" onclick="PropertyCommunication.chatWithSeller('${itemId}')">
              💬 Chat
            </button>
            <button class="btn-marketplace-call" onclick="PropertyCommunication.initiateCall('${itemId}')">
              📞 Call
            </button>
            <button class="btn-marketplace-whatsapp" onclick="PropertyCommunication.initiateWhatsApp('${itemId}')">
              📱 WhatsApp
            </button>
          </div>
        </div>
      `;
      
      card.appendChild(communicationSection);
    });
  },

  /**
   * Initialize all enhancements
   */
  init() {
    console.log('🔗 Initializing Property Communication Integration...');
    
    // Run enhancements
    this.enhancePropertyCards();
    this.enhanceBNBCards();
    this.enhanceServiceCards();
    this.enhanceMarketplaceCards();
    
    // Set up observers for dynamic content
    this.setupDynamicObserver();
    
    console.log('✅ Property Communication Integration ready');
  },

  /**
   * Set up observer for dynamically added content
   */
  setupDynamicObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new property cards were added
            if (node.classList && (node.classList.contains('property-card') || node.classList.contains('listing-card'))) {
              this.enhancePropertyCards();
            }
            
            // Check if container with property cards was added
            const newPropertyCards = node.querySelectorAll && node.querySelectorAll('.property-card, .listing-card');
            if (newPropertyCards && newPropertyCards.length > 0) {
              this.enhancePropertyCards();
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
};

/**
 * Property Communication Action Handlers
 */
const PropertyCommunication = {

  sendInquiry(propertyId, propertyName, propertyType) {
    KejaCommunication.MarketplaceCommunication.showPropertyInquiry(propertyId, propertyName, propertyType);
  },

  checkBNBAvailability(propertyId, propertyName) {
    KejaCommunication.MarketplaceCommunication.showPropertyInquiry(propertyId, propertyName, 'bnb');
  },

  requestViewing(propertyId, propertyName) {
    alert(`🏠 Viewing Request\n\nProperty: ${propertyName}\n\nThis would show a viewing request form with:\n• Preferred date/time\n• Contact details\n• Special requirements\n\nFeature coming soon!`);
  },

  requestService(serviceId, serviceName) {
    KejaCommunication.MarketplaceCommunication.showServiceRequest(serviceId, serviceName);
  },

  askSeller(itemId, itemName) {
    KejaCommunication.MarketplaceCommunication.showMarketplaceInquiry(itemId, itemName);
  },

  contactHost(propertyId) {
    this.sendInquiry(propertyId, 'BNB Property', 'bnb');
  },

  chatWithProvider(serviceId) {
    alert('💬 Chat with Service Provider\n\nOpening direct chat...\n\nThis would open the KejaMarket messaging system with the service provider.');
  },

  chatWithSeller(itemId) {
    alert('💬 Chat with Seller\n\nOpening direct chat...\n\nThis would open the KejaMarket messaging system with the item seller.');
  },

  initiateWhatsApp(id) {
    KejaCommunication.MarketplaceCommunication.initiateWhatsApp(id);
  },

  initiateCall(id) {
    KejaCommunication.MarketplaceCommunication.initiateCall(id);
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    PropertyCommunicationIntegration.init();
  }, 500);
});

// Make globally available
window.PropertyCommunicationIntegration = PropertyCommunicationIntegration;
window.PropertyCommunication = PropertyCommunication;

console.log('✅ Property Communication Integration loaded');