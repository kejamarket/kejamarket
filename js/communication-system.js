/**
 * KejaMarket Complete Communication System
 * Two-layer architecture: User-to-User & User-to-KejaMarket
 */

const KejaCommunicationSystem = {

  /**
   * USER-TO-USER COMMUNICATION (Marketplace)
   * Property inquiries, BNB availability, service requests, marketplace
   */
  MarketplaceCommunication: {

    /**
     * Property Inquiry System
     */
    showPropertyInquiry(propertyId, propertyName, propertyType = 'rental') {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content inquiry-modal">
          <div class="modal-header">
            <h3>🏠 Send Property Inquiry</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="property-info">
            <div class="property-name">${propertyName}</div>
            <div class="property-type">${propertyType === 'rental' ? 'Long-term Rental' : 'BNB/Short Stay'}</div>
          </div>
          
          <form class="inquiry-form" onsubmit="KejaCommunication.submitPropertyInquiry(event, '${propertyId}', '${propertyType}')">
            <div class="inquiry-checkboxes">
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="availability" checked>
                <span class="checkmark">☑</span> Is this ${propertyType === 'rental' ? 'house' : 'accommodation'} still available?
              </label>
              
              ${propertyType === 'rental' ? `
                <label class="inquiry-option">
                  <input type="checkbox" name="inquiry_type" value="viewing">
                  <span class="checkmark">☐</span> I'd like to arrange a viewing
                </label>
                
                <label class="inquiry-option">
                  <input type="checkbox" name="inquiry_type" value="rent_deposit">
                  <span class="checkmark">☐</span> I'd like to know the rent/deposit details
                </label>
              ` : `
                <label class="inquiry-option">
                  <input type="checkbox" name="inquiry_type" value="dates">
                  <span class="checkmark">☐</span> I want to check specific dates
                </label>
              `}
              
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="more_info">
                <span class="checkmark">☐</span> I'd like more information
              </label>
            </div>
            
            ${propertyType === 'bnb' ? `
              <div class="bnb-dates">
                <div class="form-row">
                  <div class="form-group">
                    <label>Check-in Date</label>
                    <input type="date" name="checkin" required>
                  </div>
                  <div class="form-group">
                    <label>Check-out Date</label>
                    <input type="date" name="checkout" required>
                  </div>
                </div>
                <div class="form-group">
                  <label>Number of Guests</label>
                  <select name="guests" required>
                    <option value="">Select guests</option>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5+">5+ Guests</option>
                  </select>
                </div>
              </div>
            ` : ''}
            
            <div class="form-group">
              <label>Message</label>
              <textarea name="message" placeholder="Hi, I'm interested in this ${propertyType === 'rental' ? 'house' : 'accommodation'}..." rows="4"></textarea>
            </div>
            
            <div class="communication-options">
              <button type="submit" class="btn-primary">
                <i class="fas fa-paper-plane"></i>
                Send Inquiry
              </button>
              
              <div class="secondary-actions">
                <button type="button" class="btn-secondary" onclick="KejaCommunication.initiateWhatsApp('${propertyId}')">
                  📱 WhatsApp
                </button>
                <button type="button" class="btn-secondary" onclick="KejaCommunication.initiateCall('${propertyId}')">
                  📞 Call
                </button>
              </div>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    },

    /**
     * Submit property inquiry
     */
    submitPropertyInquiry(event, propertyId, propertyType) {
      event.preventDefault();
      const formData = new FormData(event.target);
      
      const inquiryTypes = [];
      const checkboxes = event.target.querySelectorAll('input[name="inquiry_type"]:checked');
      checkboxes.forEach(cb => inquiryTypes.push(cb.value));
      
      const inquiry = {
        propertyId,
        propertyType,
        inquiryTypes,
        message: formData.get('message'),
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        guests: formData.get('guests'),
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      console.log('Property inquiry submitted:', inquiry);
      
      // Create conversation thread
      this.createConversation(propertyId, 'property', inquiry);
      
      alert(`✅ Inquiry Sent!\n\n${propertyType === 'rental' ? 'Your rental inquiry has been sent to the landlord/agent.' : 'Your availability request has been sent to the host.'}\n\nYou'll receive a response notification when they reply.\n\nConversation saved in: Messages > Property Conversations`);
      
      event.target.closest('.modal-overlay').remove();
    },

    /**
     * Service Request System
     */
    showServiceRequest(serviceId, serviceName) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content service-inquiry-modal">
          <div class="modal-header">
            <h3>🔧 Request Service</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="service-info">
            <div class="service-name">${serviceName}</div>
            <div class="service-type">Professional Service</div>
          </div>
          
          <form class="service-form" onsubmit="KejaCommunication.submitServiceRequest(event, '${serviceId}')">
            <div class="service-checkboxes">
              <label class="inquiry-option">
                <input type="checkbox" name="service_type" value="quote" checked>
                <span class="checkmark">☑</span> I need a quote for this service
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="service_type" value="availability">
                <span class="checkmark">☐</span> Check availability and schedule
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="service_type" value="emergency">
                <span class="checkmark">☐</span> This is an emergency service
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="service_type" value="consultation">
                <span class="checkmark">☐</span> I need consultation/advice
              </label>
            </div>
            
            <div class="form-group">
              <label>Describe Your Service Need</label>
              <textarea name="description" placeholder="Please describe what you need help with..." rows="4" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Preferred Contact Method</label>
              <select name="contact_method">
                <option value="kejamarket">KejaMarket Messages</option>
                <option value="phone">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Site Visit</option>
              </select>
            </div>
            
            <button type="submit" class="btn-primary">
              <i class="fas fa-tools"></i>
              Request Service
            </button>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    },

    /**
     * Marketplace Item Inquiry
     */
    showMarketplaceInquiry(itemId, itemName) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content marketplace-inquiry-modal">
          <div class="modal-header">
            <h3>🛒 Ask Seller</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="item-info">
            <div class="item-name">${itemName}</div>
            <div class="item-type">Marketplace Item</div>
          </div>
          
          <form class="marketplace-form" onsubmit="KejaCommunication.submitMarketplaceInquiry(event, '${itemId}')">
            <div class="inquiry-checkboxes">
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="availability" checked>
                <span class="checkmark">☑</span> Is this item still available?
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="condition">
                <span class="checkmark">☐</span> What's the condition of the item?
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="price">
                <span class="checkmark">☐</span> Is the price negotiable?
              </label>
              
              <label class="inquiry-option">
                <input type="checkbox" name="inquiry_type" value="viewing">
                <span class="checkmark">☐</span> Can I view the item?
              </label>
            </div>
            
            <div class="form-group">
              <label>Message to Seller</label>
              <textarea name="message" placeholder="Hi, I'm interested in this item..." rows="3"></textarea>
            </div>
            
            <button type="submit" class="btn-primary">
              <i class="fas fa-comment"></i>
              Send Message
            </button>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    },

    /**
     * Create conversation thread
     */
    createConversation(relatedId, type, initialMessage) {
      const conversation = {
        id: 'conv_' + Date.now(),
        type, // 'property', 'bnb', 'service', 'marketplace'
        relatedId,
        participants: ['current_user', 'property_owner'], // Replace with actual IDs
        status: 'active',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        initialMessage
      };
      
      // Store conversation (in real implementation, send to backend)
      const conversations = JSON.parse(localStorage.getItem('kejamarket_conversations') || '[]');
      conversations.push(conversation);
      localStorage.setItem('kejamarket_conversations', JSON.stringify(conversations));
      
      console.log('Conversation created:', conversation);
      return conversation;
    },

    /**
     * External communication tracking
     */
    initiateWhatsApp(propertyId) {
      // Record WhatsApp interaction
      this.recordInteraction(propertyId, 'whatsapp_click');
      alert('📱 WhatsApp Integration\n\nOpening WhatsApp to continue conversation.\n\nNote: KejaMarket will record that you used WhatsApp, but the actual conversation happens outside our platform.');
    },

    initiateCall(propertyId) {
      // Record call interaction
      this.recordInteraction(propertyId, 'call_click');
      alert('📞 Call Integration\n\nOpening phone dialer.\n\nNote: KejaMarket will record that you initiated a call, but the actual conversation happens outside our platform.');
    },

    recordInteraction(relatedId, type) {
      const interaction = {
        relatedId,
        type,
        timestamp: new Date().toISOString(),
        userId: 'current_user' // Replace with actual user ID
      };
      
      console.log('Interaction recorded:', interaction);
      
      // Store for analytics
      const interactions = JSON.parse(localStorage.getItem('kejamarket_interactions') || '[]');
      interactions.push(interaction);
      localStorage.setItem('kejamarket_interactions', JSON.stringify(interactions));
    }
  },

  /**
   * USER-TO-KEJAMARKET COMMUNICATION (Support System)
   */
  SupportSystem: {

    /**
     * Show support ticket creation
     */
    showSupportForm() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content support-modal">
          <div class="modal-header">
            <h3>🎫 Contact KejaMarket Support</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <form class="support-form" onsubmit="KejaCommunication.submitSupportTicket(event)">
            <div class="form-group">
              <label>What can we help you with?</label>
              <select name="category" required onchange="this.nextElementSibling.textContent = this.options[this.selectedIndex].text">
                <option value="">Select category</option>
                <option value="account">🔐 Account & Login</option>
                <option value="property">🏠 Property / Listing</option>
                <option value="messages">💬 Messages & Inquiries</option>
                <option value="payments">💰 Payments</option>
                <option value="bnb">🏨 BNB / Short Stay</option>
                <option value="marketplace">🛒 Marketplace</option>
                <option value="services">🔧 Services</option>
                <option value="safety">🛡️ Safety / Scam Report</option>
                <option value="verification">✅ Verification</option>
                <option value="technical">📱 Technical Problem</option>
                <option value="other">📄 Other</option>
              </select>
              <div class="selected-category"></div>
            </div>
            
            <div class="form-group">
              <label>Subject</label>
              <input type="text" name="subject" placeholder="Brief description of your issue" required>
            </div>
            
            <div class="form-group">
              <label>Describe your issue</label>
              <textarea name="description" placeholder="Please provide as much detail as possible..." rows="5" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Priority</label>
              <select name="priority">
                <option value="normal">Normal</option>
                <option value="high">High (Affects functionality)</option>
                <option value="urgent">Urgent (Cannot use KejaMarket)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Attach files (optional)</label>
              <input type="file" name="attachments" multiple accept="image/*,.pdf,.doc,.docx">
              <small>Screenshots, documents, or other relevant files</small>
            </div>
            
            <button type="submit" class="btn-primary">
              <i class="fas fa-ticket-alt"></i>
              Submit Support Request
            </button>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    },

    /**
     * Submit support ticket
     */
    submitSupportTicket(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      
      const ticket = {
        id: 'KM-' + Math.floor(10000 + Math.random() * 90000),
        userId: 'current_user', // Replace with actual user ID
        category: formData.get('category'),
        subject: formData.get('subject'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        status: 'open',
        createdAt: new Date().toISOString(),
        assignedTo: null,
        messages: [{
          id: 'msg_' + Date.now(),
          senderId: 'current_user',
          message: formData.get('description'),
          timestamp: new Date().toISOString(),
          isInternal: false
        }]
      };
      
      // Store ticket
      const tickets = JSON.parse(localStorage.getItem('kejamarket_support_tickets') || '[]');
      tickets.push(ticket);
      localStorage.setItem('kejamarket_support_tickets', JSON.stringify(tickets));
      
      console.log('Support ticket created:', ticket);
      
      alert(`✅ Support Request Submitted!\n\nTicket ID: ${ticket.id}\n\nWe've received your ${ticket.category} request and will respond within 24 hours.\n\nYou can track your ticket in: Messages > KejaMarket Support`);
      
      event.target.closest('.modal-overlay').remove();
      
      // Auto-acknowledge
      this.sendAutoAcknowledgment(ticket.id);
    },

    /**
     * Send automatic acknowledgment
     */
    sendAutoAcknowledgment(ticketId) {
      const acknowledgment = {
        id: 'msg_' + Date.now(),
        senderId: 'kejamarket_support',
        message: `Hello! We've received your support request (${ticketId}).\n\nOur support team will review your issue and respond within 24 hours.\n\nFor urgent issues, our typical response time is 2-4 hours.\n\nThank you for contacting KejaMarket!`,
        timestamp: new Date().toISOString(),
        isInternal: false
      };
      
      // Add to ticket messages
      const tickets = JSON.parse(localStorage.getItem('kejamarket_support_tickets') || '[]');
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.messages.push(acknowledgment);
        ticket.status = 'in_progress';
        localStorage.setItem('kejamarket_support_tickets', JSON.stringify(tickets));
      }
      
      console.log('Auto-acknowledgment sent for ticket:', ticketId);
    }
  },

  /**
   * SYSTEM NOTIFICATIONS
   */
  NotificationSystem: {

    /**
     * Show notifications center
     */
    showNotificationsCenter() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content notifications-modal">
          <div class="modal-header">
            <h3>🔔 Notifications</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="notifications-tabs">
            <button class="tab-btn active" onclick="KejaCommunication.showNotificationTab('all')">All</button>
            <button class="tab-btn" onclick="KejaCommunication.showNotificationTab('inquiries')">Inquiries</button>
            <button class="tab-btn" onclick="KejaCommunication.showNotificationTab('system')">System</button>
            <button class="tab-btn" onclick="KejaCommunication.showNotificationTab('support')">Support</button>
          </div>
          
          <div class="notifications-list">
            ${this.renderNotifications()}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    },

    /**
     * Render notifications
     */
    renderNotifications() {
      const sampleNotifications = [
        {
          id: 'notif_001',
          type: 'inquiry',
          title: 'New Property Inquiry',
          message: 'Brian is interested in your 2-bedroom apartment in Kileleshwa',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '#property-conversations'
        },
        {
          id: 'notif_002',
          type: 'system',
          title: 'Listing Approved',
          message: 'Your property listing "Greenview Apartments" has been approved and is now visible',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '#my-properties'
        },
        {
          id: 'notif_003',
          type: 'support',
          title: 'Support Response',
          message: 'KejaMarket Support responded to your ticket KM-10452',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '#support-tickets'
        }
      ];
      
      return sampleNotifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}">
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-type ${notif.type}">${this.getNotificationIcon(notif.type)}</span>
              <span class="notification-title">${notif.title}</span>
              <span class="notification-time">${this.formatTimeAgo(notif.timestamp)}</span>
            </div>
            <div class="notification-message">${notif.message}</div>
            ${!notif.read ? '<div class="unread-indicator">•</div>' : ''}
          </div>
        </div>
      `).join('');
    },

    getNotificationIcon(type) {
      const icons = {
        inquiry: '💬',
        system: '🔔',
        support: '🎫',
        payment: '💰',
        verification: '✅',
        safety: '🛡️'
      };
      return icons[type] || '📱';
    },

    formatTimeAgo(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diffHours = Math.floor((now - time) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    }
  }
};

// Make available globally
window.KejaCommunication = KejaCommunicationSystem;

console.log('✅ KejaMarket Communication System loaded');