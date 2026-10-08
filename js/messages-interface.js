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
  openConversation(id, type = 'general') {
    if (type === 'property') return this.openPropertyConversation(id);
    if (type === 'bnb') return this.openBNBConversation(id);
    if (type === 'marketplace') return this.openMarketplaceConversation(id);
    if (type === 'support') return this.openSupportTicket(id);
    this.openChatThreadModal({
      id,
      title: 'Conversation ' + id,
      type: type,
      participant: 'User',
      initialMessage: 'Hello, I have an inquiry.'
    });
  },

  openPropertyConversation(id) {
    this.openChatThreadModal({
      id,
      title: 'Greenview Apartments - Unit A02',
      type: 'property',
      participant: 'John (Landlord)',
      initialMessage: 'Yes, the house is still available. Would you like to schedule a viewing?'
    });
  },

  openBNBConversation(id) {
    this.openChatThreadModal({
      id,
      title: 'Sunset BNB Availability',
      type: 'bnb',
      participant: 'Mary (Host)',
      initialMessage: 'Those dates are available! Here are the booking details and check-in times.'
    });
  },

  openMarketplaceConversation(id) {
    this.openChatThreadModal({
      id,
      title: 'Used Sofa Inquiry',
      type: 'marketplace',
      participant: 'Peter (Seller)',
      initialMessage: 'Yes, the sofa is still available for KSh 8,000. When would you like to view it?'
    });
  },

  openSupportTicket(id) {
    this.openChatThreadModal({
      id,
      title: 'Ticket: Account Verification',
      type: 'support',
      participant: 'KejaMarket Support',
      initialMessage: 'We have reviewed your documents and approved your verification. Please let us know if you need anything else.'
    });
  },

  openChatThreadModal({ id, title, type, participant, initialMessage }) {
    let existingModal = document.getElementById('chat-thread-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'chat-thread-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:10001;display:flex;align-items:center;justify-content:center;padding:12px;';
    
    modal.innerHTML = `
      <div style="background:white;border-radius:16px;max-width:540px;width:100%;height:85vh;max-height:650px;display:flex;flex-direction:column;box-shadow:0 24px 48px rgba(0,0,0,0.25);overflow:hidden;">
        <!-- Header -->
        <div style="padding:14px 18px;background:#1e1b4b;color:white;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">
              ${participant.charAt(0)}
            </div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;line-height:1.2;">${participant}</div>
              <div style="font-size:0.75rem;color:#c7d2fe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">${title}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <a href="tel:+254792409540" style="padding:6px 10px;background:rgba(255,255,255,0.15);color:white;border-radius:6px;font-size:0.8rem;text-decoration:none;"><i class="fas fa-phone"></i></a>
            <a href="https://wa.me/254792409540" target="_blank" style="padding:6px 10px;background:rgba(255,255,255,0.15);color:#4ade80;border-radius:6px;font-size:0.8rem;text-decoration:none;"><i class="fab fa-whatsapp"></i></a>
            <button onclick="document.getElementById('chat-thread-modal').remove()" style="background:none;border:none;color:white;font-size:1.4rem;cursor:pointer;padding:4px 8px;margin-left:4px;">&times;</button>
          </div>
        </div>

        <!-- Message Body -->
        <div id="chat-messages-container" style="flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:12px;">
          <div style="text-align:center;margin-bottom:8px;">
            <span style="font-size:0.72rem;background:#e2e8f0;color:#64748b;padding:3px 10px;border-radius:12px;">Conversation Started</span>
          </div>
          <!-- Received initial message -->
          <div style="display:flex;justify-content:flex-start;">
            <div style="max-width:80%;background:white;padding:10px 14px;border-radius:14px;border-bottom-left-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:0.9rem;color:#1e293b;line-height:1.4;">${initialMessage}</p>
              <span style="display:block;font-size:0.68rem;color:#94a3b8;margin-top:4px;text-align:right;">Earlier</span>
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div style="padding:12px;background:white;border-top:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;">
          <input type="text" id="chat-thread-input" placeholder="Type a message..." style="flex:1;padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:24px;font-size:0.9rem;outline:none;" onkeydown="if(event.key==='Enter') KejaMessages.sendChatMessage('${id}')">
          <button onclick="KejaMessages.sendChatMessage('${id}')" style="width:40px;height:40px;border-radius:50%;background:#4f46e5;color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
            <i class="fas fa-paper-plane" style="font-size:0.9rem;"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
      const input = document.getElementById('chat-thread-input');
      if (input) input.focus();
    }, 100);
  },

  async sendChatMessage(conversationId) {
    const input = document.getElementById('chat-thread-input');
    if (!input || !input.value.trim()) return;

    const messageText = input.value.trim();
    input.value = '';

    const container = document.getElementById('chat-messages-container');
    if (container) {
      const bubble = document.createElement('div');
      bubble.style.cssText = 'display:flex;justify-content:flex-end;';
      bubble.innerHTML = `
        <div style="max-width:80%;background:#4f46e5;color:white;padding:10px 14px;border-radius:14px;border-bottom-right-radius:2px;box-shadow:0 1px 4px rgba(79,70,229,0.25);">
          <p style="margin:0;font-size:0.9rem;line-height:1.4;">${messageText}</p>
          <span style="display:block;font-size:0.68rem;color:rgba(255,255,255,0.7);margin-top:4px;text-align:right;">Just now</span>
        </div>
      `;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversationId,
          content: messageText,
          message: messageText
        })
      });
    } catch (e) {
      console.warn('Message send network warning:', e);
    }
  }
};

// Make available globally
window.KejaMessages = KejaMessagesInterface;

console.log('✅ KejaMarket Messages Interface loaded');