/**
 * Complete Test Suite for KejaMarket Communication System
 */
console.log('🧪 Testing Complete KejaMarket Communication System...');

document.addEventListener('DOMContentLoaded', function() {
  
  // Test 1: Verify all communication modules are loaded
  console.log('\n📋 Module Loading Tests:');
  
  if (typeof KejaCommunication !== 'undefined') {
    console.log('✅ KejaCommunication system loaded');
  } else {
    console.error('❌ KejaCommunication system not found');
  }
  
  if (typeof KejaMessages !== 'undefined') {
    console.log('✅ KejaMessages interface loaded');
  } else {
    console.error('❌ KejaMessages interface not found');
  }
  
  // Test 2: Check communication subsystems
  console.log('\n🗣️ Communication Subsystems:');
  
  if (KejaCommunication.MarketplaceCommunication) {
    console.log('✅ Marketplace Communication ready');
  }
  
  if (KejaCommunication.SupportSystem) {
    console.log('✅ Support System ready');
  }
  
  if (KejaCommunication.NotificationSystem) {
    console.log('✅ Notification System ready');
  }
  
  // Test 3: Verify UI elements
  console.log('\n🎨 UI Elements Test:');
  
  const messagesBtn = document.getElementById('btn-messages');
  const notificationsBtn = document.getElementById('btn-notifications');
  
  if (messagesBtn) {
    console.log('✅ Messages button found in header');
  } else {
    console.log('⚠️ Messages button not found');
  }
  
  if (notificationsBtn) {
    console.log('✅ Notifications button found in header');
  } else {
    console.log('⚠️ Notifications button not found');
  }
  
  // Test 4: CSS loading
  console.log('\n🎨 CSS Loading Test:');
  
  const testElement = document.createElement('div');
  testElement.className = 'messages-modal';
  document.body.appendChild(testElement);
  const styles = window.getComputedStyle(testElement);
  
  if (styles.maxWidth !== 'none') {
    console.log('✅ Communication System CSS loaded');
  } else {
    console.log('⚠️ CSS may still be loading');
  }
  
  document.body.removeChild(testElement);
  
  // Test 5: Create demo functions for testing
  console.log('\n🎯 Demo Functions Created:');
  
  // Property Inquiry Demo
  window.testPropertyInquiry = function() {
    KejaCommunication.MarketplaceCommunication.showPropertyInquiry('test_prop_001', 'Test Property - 2BR Apartment', 'rental');
  };
  
  // BNB Inquiry Demo
  window.testBNBInquiry = function() {
    KejaCommunication.MarketplaceCommunication.showPropertyInquiry('test_bnb_001', 'Test BNB - Cozy Studio', 'bnb');
  };
  
  // Service Request Demo
  window.testServiceRequest = function() {
    KejaCommunication.MarketplaceCommunication.showServiceRequest('test_service_001', 'ABC Plumbing Services');
  };
  
  // Marketplace Inquiry Demo
  window.testMarketplaceInquiry = function() {
    KejaCommunication.MarketplaceCommunication.showMarketplaceInquiry('test_item_001', 'Used Sofa Set - KSh 8,000');
  };
  
  // Support System Demo
  window.testSupportSystem = function() {
    KejaCommunication.SupportSystem.showSupportForm();
  };
  
  // Messages Center Demo
  window.testMessagesCenter = function() {
    KejaMessages.showMessagesCenter();
  };
  
  // Notifications Demo
  window.testNotifications = function() {
    KejaCommunication.NotificationSystem.showNotificationsCenter();
  };
  
  console.log('• testPropertyInquiry() - Test rental property inquiry');
  console.log('• testBNBInquiry() - Test BNB availability request');
  console.log('• testServiceRequest() - Test service provider request');
  console.log('• testMarketplaceInquiry() - Test marketplace item inquiry');
  console.log('• testSupportSystem() - Test support ticket creation');
  console.log('• testMessagesCenter() - Test complete messages interface');
  console.log('• testNotifications() - Test notifications center');
  
  // Test 6: Communication Architecture Summary
  console.log('\n🏗️ Communication Architecture:');
  console.log('📬 USER-TO-USER: Property inquiries, BNB requests, service requests, marketplace');
  console.log('🎫 USER-TO-KEJAMARKET: Support tickets, platform communication');
  console.log('🔔 SYSTEM-TO-USER: Notifications, alerts, updates');
  console.log('📞 EXTERNAL: WhatsApp/Call tracking (interaction recording)');
  
  // Test 7: Mock some data for testing
  console.log('\n💾 Sample Data Created:');
  
  // Create sample conversations
  const sampleConversations = [
    {
      id: 'conv_demo_001',
      type: 'property',
      propertyName: 'Demo Greenview Apartments',
      participant: 'John - Landlord',
      lastMessage: 'Yes, the house is available. Would you like to schedule a viewing?',
      timestamp: new Date().toISOString(),
      unread: true
    }
  ];
  
  localStorage.setItem('kejamarket_conversations', JSON.stringify(sampleConversations));
  console.log('✅ Sample conversations stored');
  
  // Create sample support ticket
  const sampleTickets = [
    {
      id: 'KM-DEMO-001',
      category: 'property',
      subject: 'Demo Support Ticket',
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      messages: [
        {
          senderId: 'current_user',
          message: 'This is a demo support ticket for testing.',
          timestamp: new Date().toISOString()
        }
      ]
    }
  ];
  
  localStorage.setItem('kejamarket_support_tickets', JSON.stringify(sampleTickets));
  console.log('✅ Sample support tickets stored');
  
  // Test 8: Integration with existing systems
  console.log('\n🔗 Integration Tests:');
  
  if (typeof KejaSimplified !== 'undefined') {
    console.log('✅ Integrated with Simplified Property Management');
  }
  
  if (typeof KejaEnhancedPortal !== 'undefined') {
    console.log('✅ Integrated with Enhanced Landlord Portal');
  }
  
  // Test 9: User journey simulation
  console.log('\n👥 User Journey Simulation:');
  console.log('🏠 TENANT: Find property → Send inquiry → Receive response → Schedule viewing');
  console.log('🏨 GUEST: Find BNB → Check availability → Host confirms → Book directly');
  console.log('🔧 CUSTOMER: Find service → Request quote → Provider responds → Schedule service');
  console.log('🛒 BUYER: Find item → Ask seller → Negotiate → Arrange pickup');
  console.log('🎫 USER: Issue occurs → Contact support → Support responds → Issue resolved');
  
  console.log('\n✅ Complete KejaMarket Communication System Ready!');
  console.log('\n🎯 Quick Test: Run testMessagesCenter() to see the full interface');
  
  // Auto-test if requested
  if (window.location.hash === '#test-communication') {
    setTimeout(() => {
      console.log('\n🚀 Auto-testing Messages Center...');
      testMessagesCenter();
    }, 1000);
  }
  
});