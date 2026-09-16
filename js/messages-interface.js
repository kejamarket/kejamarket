/**
 * KejaMarket Messages Interface
 * Central hub for all communication types
 */

const KejaMessagesInterface = {

  /**
   * Show main messages center
   */
  showMessagesCenter() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay messages-overlay';
    modal.innerHTML = `
      <div class="modal-content messages-modal">
        <div class="modal-header">
          <h3>💬 Messages</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        
        <div class="messages-sidebar">
          <div class="message-categories">
            <button class="category-btn active" data-category="all" onclick="KejaMessages.showCategory('all')">
              <i class="fas fa-inbox"></i>
              <span>All Messages</span>
              <span class="unread-count">7</span>
            </button>
            
            <button class="category-btn" data-category="property" onclick="KejaMessages.showCategory('property')">
              <i class="fas fa-home"></i>
              <span>Property Conversations</span>
              <span class="unread-count">3</span>
            </button>
            
            <button class="category-btn" data-category="bnb" onclick="KejaMessages.showCategory('bnb')">
              <i class="fas fa-bed"></i>
              <span>BNB Conversations</span>
              <span class="unread-count">2</span>
            </button>
            
            <button class="category-btn" data-category="service" onclick="KejaMessages.showCategory('service')">
              <i class="fas fa-tools"></i>
              <span>Service Conversations</span>
              <span class="unread-count">0</span>
            </button>
            
            <button class="category-btn" data-category="marketplace" onclick="KejaMessages.showCategory('marketplace')">
              <i class="fas fa-shopping-cart"></i>
              <span>Marketplace Conversations</span>
              <span class="unread-count">1</span>
            </button>
            
            <button class="category-btn" data-category="support" onclick="KejaMessages.showCategory('support')">
              <i class="fas fa-life-ring"></i>
              <span>KejaMarket Support</span>
              <span class="unread-count">1</span>
            </button>
          </div>
        </div>
        
        <div class="messages-content">
          <div class="category-content" id="category-all">
            ${this.renderAllMessages()}
          </div>
          
          <div class="category-content" id="category-property" style="display:none;">
            ${this.renderPropertyConversations()}
          </div>
          
          <div class="category-content" id="category-bnb" style="display:none;">
            ${this.renderBNBConversations()}
          </div>
          
          <div class="category-content" id="category-service" style="display:none;">
            ${this.renderServiceConversations()}
          </div>
          
          <div class="category-content" id="category-marketplace" style="display:none;">
            ${this.renderMarketplaceConversations()}
          </div>
          
          <div class="category-content" id="category-support" style="display:none;">
            ${this.renderSupportTickets()}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  /**
   * Show specific category
   */
  showCategory(categoryName) {
    // Hide all category contents
    document.querySelectorAll('.category-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected category
    const selectedContent = document.getElementById(`category-${categoryName}`);
    if (selectedContent) {
      selectedContent.style.display = 'block';
    }
    
    // Add active class to selected button
    const selectedBtn = document.querySelector(`[data-category="${categoryName}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  },

  /**
   * Render all messages (combined view)
   */
  renderAllMessages() {
    const allMessages = [
      {
        id: 'conv_001',
        type: 'property',
        title: 'Greenview Apartments - Unit A02',
        lastMessage: 'Yes, the house is still available. Would you like to view it?',
        timestamp: '2h ago',
        unread: true,
        participant: 'John - Landlord'
      },
      {
        id: 'conv_002',
        type: 'bnb',
        title: 'Sunset BNB Availability',
        lastMessage: 'Those dates are available! Here are the booking details...',
        timestamp: '4h ago',
        unread: true,
        participant: 'Mary - Host'
      },
      {
        id: 'ticket_001',
        type: 'support',
        title: 'Account Verification Issue',
        lastMessage: 'We have reviewed your documents and approved your verification.',
        timestamp: '1d ago',
        unread: true,
        participant: 'KejaMarket Support'
      },
      {
        id: 'conv_003',
        type: 'marketplace',
        title: 'Used Sofa Inquiry',
        lastMessage: 'Yes, the sofa is still available for KSh 8,000.',
        timestamp: '2d ago',
        unread: false,
        participant: 'Peter - Seller'
      }
    ];

    return `
      <div class="messages-header">
        <h4>All Conversations</h4>
        <p>Your messages, inquiries, and support tickets</p>
      </div>
      
      <div class="messages-list">
        ${allMessages.map(msg => `
          <div class="message-item ${msg.unread ? 'unread' : 'read'}" onclick="KejaMessages.openConversation('${msg.id}', '${msg.type}')">
            <div class="message-icon">
              ${this.getMessageTypeIcon(msg.type)}
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-title">${msg.title}</span>
                <span class="message-time">${msg.timestamp}</span>
              </div>
              <div class="message-preview">${msg.lastMessage}</div>
              <div class="message-participant">${msg.participant}</div>
            </div>
            ${msg.unread ? '<div class="unread-indicator">•</div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render property conversations
   */
  renderPropertyConversations() {
    const propertyConversations = [
      {
        id: 'prop_001',
        property: 'Greenview Apartments - Unit A02',
        participant: 'John - Landlord',
        lastMessage: 'Yes, the house is still available. Would you like to view it?',
        timestamp: '2h ago',
        status: 'active',
        unread: true,
        inquiryType: 'Availability & Viewing'
      },
      {
        id: 'prop_002',
        property: 'City Center Apartment',
        participant: 'Sarah - Agent',
        lastMessage: 'The deposit is KSh 70,000 and rent is KSh 35,000.',
        timestamp: '1d ago',
        status: 'viewing_scheduled',
        unread: false,
        inquiryType: 'Rent Details'
      }
    ];

    return `
      <div class="messages-header">
        <h4>Property Conversations</h4>
        <p>Long-term rental inquiries and discussions</p>
      </div>
      
      <div class="conversations-list">
        ${propertyConversations.map(conv => `
          <div class="conversation-item ${conv.unread ? 'unread' : 'read'}" onclick="KejaMessages.openPropertyConversation('${conv.id}')">
            <div class="conversation-header">
              <div class="property-name">${conv.property}</div>
              <div class="conversation-time">${conv.timestamp}</div>
            </div>
            <div class="conversation-details">
              <div class="participant-info">${conv.participant}</div>
              <div class="inquiry-type">${conv.inquiryType}</div>
            </div>
            <div class="conversation-preview">${conv.lastMessage}</div>
            <div class="conversation-status">
              <span class="status-badge ${conv.status}">
                ${conv.status === 'active' ? '🟢 Active' : 
                  conv.status === 'viewing_scheduled' ? '📅 Viewing Scheduled' : 
                  '✅ Completed'}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render BNB conversations
   */
  renderBNBConversations() {
    const bnbConversations = [
      {
        id: 'bnb_001',
        property: 'Sunset BNB',
        guest: 'Brian K.',
        dates: 'Sep 20-22, 2024',
        guests: '2 guests',
        lastMessage: 'Those dates are available! Here are the booking details...',
        timestamp: '4h ago',
        status: 'available',
        unread: true
      }
    ];

    return `
      <div class="messages-header">
        <h4>BNB Conversations</h4>
        <p>Short-stay availability requests and confirmations</p>
      </div>
      
      <div class="conversations-list">
        ${bnbConversations.map(conv => `
          <div class="conversation-item bnb-item ${conv.unread ? 'unread' : 'read'}" onclick="KejaMessages.openBNBConversation('${conv.id}')">
            <div class="conversation-header">
              <div class="property-name">${conv.property}</div>
              <div class="conversation-time">${conv.timestamp}</div>
            </div>
            <div class="bnb-details">
              <div class="guest-info">Guest: ${conv.guest}</div>
              <div class="stay-details">${conv.dates} • ${conv.guests}</div>
            </div>
            <div class="conversation-preview">${conv.lastMessage}</div>
            <div class="conversation-status">
              <span class="status-badge ${conv.status}">
                ${conv.status === 'available' ? '🟢 Confirmed Available' : 
                  conv.status === 'unavailable' ? '🔴 Dates Taken' : 
                  '🟡 Awaiting Response'}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render service conversations
   */
  renderServiceConversations() {
    return `
      <div class="messages-header">
        <h4>Service Conversations</h4>
        <p>Professional service requests and quotes</p>
      </div>
      
      <div class="empty-conversations">
        <div class="empty-icon">🔧</div>
        <div class="empty-title">No Service Conversations</div>
        <div class="empty-desc">When you request services from professionals, your conversations will appear here</div>
      </div>
    `;
  },

  /**
   * Render marketplace conversations
   */
  renderMarketplaceConversations() {
    const marketplaceConversations = [
      {
        id: 'market_001',
        item: 'Used Sofa Set',
        participant: 'Peter - Seller',
        lastMessage: 'Yes, the sofa is still available for KSh 8,000.',
        timestamp: '2d ago',
        status: 'available',
        unread: false
      }
    ];

    return `
      <div class="messages-header">
        <h4>Marketplace Conversations</h4>
        <p>Used items and selling inquiries</p>
      </div>
      
      <div class="conversations-list">
        ${marketplaceConversations.map(conv => `
          <div class="conversation-item marketplace-item ${conv.unread ? 'unread' : 'read'}" onclick="KejaMessages.openMarketplaceConversation('${conv.id}')">
            <div class="conversation-header">
              <div class="item-name">${conv.item}</div>
              <div class="conversation-time">${conv.timestamp}</div>
            </div>
            <div class="participant-info">${conv.participant}</div>
            <div class="conversation-preview">${conv.lastMessage}</div>
            <div class="conversation-status">
              <span class="status-badge ${conv.status}">
                ${conv.status === 'available' ? '🟢 Available' : 
                  conv.status === 'sold' ? '🔴 Sold' : 
                  '🟡 Negotiating'}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render support tickets
   */
  renderSupportTickets() {
    const supportTickets = JSON.parse(localStorage.getItem('kejamarket_support_tickets') || '[]');
    
    // Add sample ticket if none exist
    if (supportTickets.length === 0) {
      supportTickets.push({
        id: 'KM-10452',
        category: 'account',
        subject: 'Account Verification Issue',
        status: 'resolved',
        priority: 'normal',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            senderId: 'current_user',
            message: 'My account verification is taking too long.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            senderId: 'kejamarket_support',
            message: 'We have reviewed your documents and approved your verification.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ]
      });
    }

    return `
      <div class="messages-header">
        <h4>KejaMarket Support</h4>
        <p>Your support tickets and platform communication</p>
        <button class="btn-new-ticket" onclick="KejaCommunication.SupportSystem.showSupportForm()">
          <i class="fas fa-plus"></i>
          New Support Request
        </button>
      </div>
      
      <div class="support-tickets-list">
        ${supportTickets.map(ticket => `
          <div class="support-ticket-item ${ticket.status}" onclick="KejaMessages.openSupportTicket('${ticket.id}')">
            <div class="ticket-header">
              <div class="ticket-id">${ticket.id}</div>
              <div class="ticket-time">${this.formatTimeAgo(ticket.createdAt)}</div>
            </div>
            <div class="ticket-subject">${ticket.subject}</div>
            <div class="ticket-details">
              <span class="ticket-category">${this.getCategoryName(ticket.category)}</span>
              <span class="ticket-status status-${ticket.status}">${this.getStatusName(ticket.status)}</span>
              <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
            </div>
            <div class="ticket-preview">
              ${ticket.messages[ticket.messages.length - 1]?.message.substring(0, 80)}...
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Helper functions
   */
  getMessageTypeIcon(type) {
    const icons = {
      property: '🏠',
      bnb: '🏨',
      service: '🔧',
      marketplace: '🛒',
      support: '🎫'
    };
    return icons[type] || '💬';
  },

  getCategoryName(category) {
    const names = {
      account: 'Account',
      property: 'Property',
      messages: 'Messages',
      payments: 'Payments',
      bnb: 'BNB',
      marketplace: 'Marketplace',
      services: 'Services',
      safety: 'Safety',
      verification: 'Verification',
      technical: 'Technical',
      other: 'Other'
    };
    return names[category] || category;
  },

  getStatusName(status) {
    const names = {
      open: '🔵 Open',
      in_progress: '🟡 In Progress',
      waiting_for_user: '🟠 Waiting for You',
      resolved: '🟢 Resolved',
      closed: '⚫ Closed'
    };
    return names[status] || status;
  },

  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  },

  /**
   * Open conversation methods
   */
  openConversation(id, type) {
    alert(`Opening ${type} conversation: ${id}\n\nThis would open the full conversation thread with message history and reply functionality.`);
  },

  openPropertyConversation(id) {
    alert(`Opening property conversation: ${id}\n\nFeatures:\n• Full message history\n• Reply functionality\n• View property details\n• Schedule viewing\n• WhatsApp/Call options`);
  },

  openBNBConversation(id) {
    alert(`Opening BNB conversation: ${id}\n\nFeatures:\n• Confirm/deny availability\n• Share booking details\n• Communicate dates\n• Direct guest contact`);
  },

  openMarketplaceConversation(id) {
    alert(`Opening marketplace conversation: ${id}\n\nFeatures:\n• Negotiate price\n• Arrange viewing\n• Mark as sold\n• Share contact details`);
  },

  openSupportTicket(id) {
    alert(`Opening support ticket: ${id}\n\nFeatures:\n• Full ticket history\n• Reply to support\n• View ticket status\n• Upload attachments\n• Close/reopen ticket`);
  }
};

// Make available globally
window.KejaMessages = KejaMessagesInterface;

console.log('✅ KejaMarket Messages Interface loaded');