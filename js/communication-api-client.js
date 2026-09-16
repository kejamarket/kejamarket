/**
 * KejaMarket Communication API Client
 * Frontend client for interacting with the communication system backend
 */

const CommunicationAPI = {

  // Get JWT token from localStorage
  getAuthToken() {
    return localStorage.getItem('keja_token');
  },

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method: 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`/api/communication${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * CONVERSATIONS API
   */

  // Get all conversations for current user
  async getConversations() {
    return await this.makeRequest('/conversations');
  },

  // Create new conversation/inquiry
  async createConversation(data) {
    return await this.makeRequest('/conversations', {
      method: 'POST',
      body: data
    });
  },

  // Get messages for a conversation
  async getConversationMessages(conversationId) {
    return await this.makeRequest(`/conversations/${conversationId}/messages`);
  },

  // Send message to conversation
  async sendMessage(conversationId, messageData) {
    return await this.makeRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: messageData
    });
  },

  /**
   * SUPPORT TICKETS API
   */

  // Get all support tickets for current user
  async getSupportTickets() {
    return await this.makeRequest('/support-tickets');
  },

  // Create new support ticket
  async createSupportTicket(data) {
    return await this.makeRequest('/support-tickets', {
      method: 'POST',
      body: data
    });
  },

  // Get messages for a support ticket
  async getSupportTicketMessages(ticketId) {
    return await this.makeRequest(`/support-tickets/${ticketId}/messages`);
  },

  /**
   * NOTIFICATIONS API
   */

  // Get notifications for current user
  async getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    const endpoint = `/notifications${params.toString() ? '?' + params.toString() : ''}`;
    return await this.makeRequest(endpoint);
  },

  // Mark notifications as read
  async markNotificationsRead(notificationIds = null) {
    return await this.makeRequest('/notifications/mark-read', {
      method: 'POST',
      body: { notification_ids: notificationIds }
    });
  },

  /**
   * INTERACTION TRACKING API
   */

  // Record interaction event
  async recordInteraction(data) {
    return await this.makeRequest('/interactions', {
      method: 'POST',
      body: data
    });
  },

  /**
   * HEALTH CHECK API
   */

  // Get communication system health
  async getSystemHealth() {
    return await this.makeRequest('/health');
  },

  /**
   * HELPER METHODS
   */

  // Send property inquiry
  async sendPropertyInquiry(propertyId, propertyName, propertyType, message, metadata = {}) {
    try {
      // For demo purposes, we'll use a mock participant ID
      // In production, this would come from the property owner data
      const participantId = 'mock_property_owner_' + propertyId;
      
      const conversationData = {
        type: propertyType === 'bnb' ? 'bnb' : 'property',
        relatedId: propertyId,
        relatedType: propertyType === 'bnb' ? 'bnb' : 'property',
        participantId: participantId,
        initialMessage: message,
        metadata: {
          propertyName,
          propertyType,
          inquiryType: metadata.inquiryTypes || ['availability'],
          ...metadata
        }
      };

      const result = await this.createConversation(conversationData);
      
      console.log('✅ Property inquiry sent successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send property inquiry:', error);
      throw error;
    }
  },

  // Send service request
  async sendServiceRequest(serviceId, serviceName, message, metadata = {}) {
    try {
      const participantId = 'mock_service_provider_' + serviceId;
      
      const conversationData = {
        type: 'service',
        relatedId: serviceId,
        relatedType: 'service',
        participantId: participantId,
        initialMessage: message,
        metadata: {
          serviceName,
          serviceTypes: metadata.serviceTypes || ['quote'],
          ...metadata
        }
      };

      const result = await this.createConversation(conversationData);
      console.log('✅ Service request sent successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send service request:', error);
      throw error;
    }
  },

  // Send marketplace inquiry
  async sendMarketplaceInquiry(itemId, itemName, message, metadata = {}) {
    try {
      const participantId = 'mock_item_seller_' + itemId;
      
      const conversationData = {
        type: 'marketplace',
        relatedId: itemId,
        relatedType: 'marketplace_item',
        participantId: participantId,
        initialMessage: message,
        metadata: {
          itemName,
          inquiryTypes: metadata.inquiryTypes || ['availability'],
          ...metadata
        }
      };

      const result = await this.createConversation(conversationData);
      console.log('✅ Marketplace inquiry sent successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send marketplace inquiry:', error);
      throw error;
    }
  },

  // Create support ticket
  async submitSupportTicket(category, subject, description, priority = 'normal') {
    try {
      const ticketData = {
        category,
        subject,
        description,
        priority
      };

      const result = await this.createSupportTicket(ticketData);
      console.log('✅ Support ticket created successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to create support ticket:', error);
      throw error;
    }
  },

  // Track external interaction
  async trackInteraction(relatedId, relatedType, interactionType, metadata = {}) {
    try {
      const interactionData = {
        relatedId,
        relatedType,
        interactionType,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ...metadata
        }
      };

      const result = await this.recordInteraction(interactionData);
      console.log('✅ Interaction tracked:', interactionType, result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to track interaction:', error);
      // Don't throw error for tracking failures
    }
  },

  /**
   * REAL-TIME UPDATES (for future implementation)
   */

  // Initialize real-time connection (WebSocket/SSE)
  initializeRealTimeUpdates() {
    console.log('🔄 Real-time updates would be initialized here');
    // TODO: Implement WebSocket or Server-Sent Events for live updates
  },

  // Subscribe to conversation updates
  subscribeToConversation(conversationId, callback) {
    console.log('📡 Subscribing to conversation updates:', conversationId);
    // TODO: Implement real-time conversation updates
  }
};

// Integration with existing communication system
if (typeof KejaCommunication !== 'undefined') {
  
  // Override the existing communication methods to use the API
  const originalSubmitPropertyInquiry = KejaCommunication.MarketplaceCommunication.submitPropertyInquiry;
  KejaCommunication.MarketplaceCommunication.submitPropertyInquiry = async function(event, propertyId, propertyType) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      const inquiryTypes = [];
      const checkboxes = event.target.querySelectorAll('input[name="inquiry_type"]:checked');
      checkboxes.forEach(cb => inquiryTypes.push(cb.value));
      
      const message = formData.get('message') || `Hi, I'm interested in this ${propertyType === 'rental' ? 'property' : 'accommodation'}.`;
      
      const metadata = {
        inquiryTypes,
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        guests: formData.get('guests')
      };
      
      const result = await CommunicationAPI.sendPropertyInquiry(
        propertyId, 
        `Property ${propertyId}`, 
        propertyType, 
        message, 
        metadata
      );
      
      alert(`✅ Inquiry Sent!\n\nYour ${propertyType === 'rental' ? 'rental' : 'BNB'} inquiry has been sent.\n\nConversation ID: ${result.conversation_id}\n\nYou can track responses in Messages → ${propertyType === 'rental' ? 'Property' : 'BNB'} Conversations`);
      
    } catch (error) {
      alert(`❌ Failed to send inquiry: ${error.message}`);
    }
    
    event.target.closest('.modal-overlay').remove();
  };

  // Override support ticket submission
  const originalSubmitSupportTicket = KejaCommunication.SupportSystem.submitSupportTicket;
  KejaCommunication.SupportSystem.submitSupportTicket = async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      const result = await CommunicationAPI.submitSupportTicket(
        formData.get('category'),
        formData.get('subject'),
        formData.get('description'),
        formData.get('priority')
      );
      
      alert(`✅ Support Request Submitted!\n\nTicket ID: ${result.ticket.id}\n\nWe've received your ${result.ticket.category} request and will respond within 24 hours.\n\nYou can track your ticket in: Messages > KejaMarket Support`);
      
    } catch (error) {
      alert(`❌ Failed to create support ticket: ${error.message}`);
    }
    
    event.target.closest('.modal-overlay').remove();
  };

  // Override interaction tracking
  const originalRecordInteraction = KejaCommunication.MarketplaceCommunication.recordInteraction;
  KejaCommunication.MarketplaceCommunication.recordInteraction = async function(relatedId, type) {
    await CommunicationAPI.trackInteraction(relatedId, 'property', type + '_click');
  };

  console.log('✅ Communication API client integrated with existing system');
}

// Make available globally
window.CommunicationAPI = CommunicationAPI;

// Initialize real-time updates when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if user is logged in
  const token = CommunicationAPI.getAuthToken();
  if (token) {
    CommunicationAPI.initializeRealTimeUpdates();
  }
});

console.log('✅ KejaMarket Communication API Client loaded');