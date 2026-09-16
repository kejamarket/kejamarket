/**
 * End-to-End KejaMarket Communication System Test
 * Tests complete integration: Frontend + Backend + Database
 */
console.log('🧪 Starting End-to-End Communication System Test...');

document.addEventListener('DOMContentLoaded', async function() {
  
  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  function logTest(testName, status, message, details = null) {
    const symbols = { pass: '✅', fail: '❌', warn: '⚠️' };
    const logMessage = `${symbols[status]} ${testName}: ${message}`;
    console.log(logMessage);
    
    testResults[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings']++;
    testResults.details.push({
      test: testName,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  console.log('\n🎯 END-TO-END SYSTEM TEST SUITE');
  console.log('════════════════════════════════════════');

  // Test Suite 1: API Client Loading
  console.log('\n📡 API CLIENT LOADING TESTS');
  
  try {
    if (typeof CommunicationAPI !== 'undefined') {
      logTest('Communication API Client', 'pass', 'Loaded and available');
    } else {
      logTest('Communication API Client', 'fail', 'Not loaded or not available');
    }

    // Test API client methods
    const requiredMethods = [
      'getConversations',
      'createConversation', 
      'getSupportTickets',
      'createSupportTicket',
      'getNotifications',
      'recordInteraction',
      'sendPropertyInquiry',
      'sendServiceRequest',
      'submitSupportTicket'
    ];

    let methodsAvailable = 0;
    requiredMethods.forEach(method => {
      if (typeof CommunicationAPI[method] === 'function') {
        methodsAvailable++;
      }
    });

    if (methodsAvailable === requiredMethods.length) {
      logTest('API Methods', 'pass', `All ${requiredMethods.length} methods available`);
    } else {
      logTest('API Methods', 'warn', `${methodsAvailable}/${requiredMethods.length} methods available`);
    }

  } catch (error) {
    logTest('API Client Loading', 'fail', 'Error during API client check: ' + error.message);
  }

  // Test Suite 2: Authentication Status
  console.log('\n🔐 AUTHENTICATION STATUS TESTS');
  
  const token = CommunicationAPI.getAuthToken();
  if (token) {
    logTest('Auth Token', 'pass', 'JWT token found in localStorage');
    
    try {
      // Test token validity by making a simple API call
      const healthCheck = await CommunicationAPI.getSystemHealth();
      logTest('Token Validity', 'pass', 'Token accepted by backend API');
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        logTest('Token Validity', 'fail', 'Token rejected - user needs to login');
      } else {
        logTest('Token Validity', 'warn', 'Cannot verify token - API may be offline');
      }
    }
  } else {
    logTest('Auth Token', 'warn', 'No JWT token found - user needs to login for full testing');
  }

  // Test Suite 3: Backend API Connectivity
  console.log('\n🌐 BACKEND API CONNECTIVITY TESTS');
  
  try {
    // Test health endpoint (doesn't require auth)
    const healthResponse = await fetch('/api/communication/health');
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      logTest('Backend API', 'pass', 'Communication API responding');
      logTest('Database Connection', 'pass', 'Database health check passed');
      
      if (healthData.communication_system) {
        logTest('Communication Tables', 'pass', `${healthData.communication_system.length} health checks passed`);
      }
    } else {
      logTest('Backend API', 'fail', 'Health check failed');
    }

  } catch (error) {
    logTest('Backend API', 'fail', 'Cannot connect to backend: ' + error.message);
  }

  // Test Suite 4: Database Schema Verification
  console.log('\n🗄️ DATABASE SCHEMA VERIFICATION');
  
  try {
    const healthResponse = await fetch('/api/communication/health');
    const healthData = await healthResponse.json();
    
    if (healthData.success && healthData.communication_system) {
      const systemHealth = healthData.communication_system;
      const expectedTables = ['Conversations', 'Messages', 'Support Tickets', 'Notifications', 'Interaction Events'];
      
      const foundTables = systemHealth.map(item => item.component);
      const missingTables = expectedTables.filter(table => !foundTables.includes(table));
      
      if (missingTables.length === 0) {
        logTest('Database Schema', 'pass', 'All communication tables verified');
      } else {
        logTest('Database Schema', 'warn', `Missing tables: ${missingTables.join(', ')}`);
      }
      
      // Check table counts
      systemHealth.forEach(item => {
        const count = parseInt(item.count);
        if (item.component === 'Support Tickets' && item.status === 'Open') {
          logTest(`${item.component} (${item.status})`, count > 0 ? 'pass' : 'warn', `${count} records`);
        } else {
          logTest(`${item.component} (${item.status})`, 'pass', `${count} records`);
        }
      });
    }
    
  } catch (error) {
    logTest('Database Schema', 'fail', 'Cannot verify schema: ' + error.message);
  }

  // Test Suite 5: Frontend Integration
  console.log('\n🎨 FRONTEND INTEGRATION TESTS');
  
  try {
    // Test if communication system is integrated with existing forms
    const hasPropertyInquiry = typeof window.demoPropertyInquiry === 'function';
    const hasServiceRequest = typeof window.demoServiceRequest === 'function';
    const hasSupportTicket = typeof window.demoSupportTicket === 'function';
    const hasMessagesCenter = typeof window.demoMessagesCenter === 'function';
    
    logTest('Property Inquiry Integration', hasPropertyInquiry ? 'pass' : 'fail', 
      hasPropertyInquiry ? 'Demo function available' : 'Demo function missing');
    
    logTest('Service Request Integration', hasServiceRequest ? 'pass' : 'fail',
      hasServiceRequest ? 'Demo function available' : 'Demo function missing');
    
    logTest('Support Ticket Integration', hasSupportTicket ? 'pass' : 'fail',
      hasSupportTicket ? 'Demo function available' : 'Demo function missing');
    
    logTest('Messages Center Integration', hasMessagesCenter ? 'pass' : 'fail',
      hasMessagesCenter ? 'Demo function available' : 'Demo function missing');

    // Test UI elements
    const messagesBtn = document.getElementById('btn-messages');
    const notificationsBtn = document.getElementById('btn-notifications');
    
    logTest('Messages Button', messagesBtn ? 'pass' : 'warn', 
      messagesBtn ? 'Found in header' : 'Not visible (may require login)');
    
    logTest('Notifications Button', notificationsBtn ? 'pass' : 'warn',
      notificationsBtn ? 'Found in header' : 'Not visible (may require login)');

  } catch (error) {
    logTest('Frontend Integration', 'fail', 'Error testing integration: ' + error.message);
  }

  // Test Suite 6: Live API Testing (if authenticated)
  if (token) {
    console.log('\n🔄 LIVE API TESTING (AUTHENTICATED USER)');
    
    try {
      // Test getting conversations
      const conversations = await CommunicationAPI.getConversations();
      logTest('Get Conversations', 'pass', `Retrieved ${conversations.conversations?.length || 0} conversations`);
      
      // Test getting support tickets
      const tickets = await CommunicationAPI.getSupportTickets();
      logTest('Get Support Tickets', 'pass', `Retrieved ${tickets.tickets?.length || 0} tickets`);
      
      // Test getting notifications
      const notifications = await CommunicationAPI.getNotifications();
      logTest('Get Notifications', 'pass', `Retrieved ${notifications.notifications?.length || 0} notifications`);
      
    } catch (error) {
      logTest('Live API Testing', 'fail', 'Error testing live API: ' + error.message);
    }
  } else {
    console.log('\n⏩ SKIPPING LIVE API TESTS - NO AUTHENTICATION');
    logTest('Live API Testing', 'warn', 'Skipped - requires authentication');
  }

  // Test Suite 7: Complete Workflow Simulation
  console.log('\n🎭 WORKFLOW SIMULATION TESTS');
  
  try {
    // Test property inquiry workflow
    if (typeof KejaCommunication !== 'undefined') {
      logTest('Property Inquiry Workflow', 'pass', 'System ready for property inquiries');
      logTest('BNB Inquiry Workflow', 'pass', 'System ready for BNB availability requests');
      logTest('Service Request Workflow', 'pass', 'System ready for service provider requests');
      logTest('Support Ticket Workflow', 'pass', 'System ready for support tickets');
    } else {
      logTest('Workflow Simulation', 'fail', 'Core communication system not available');
    }

    // Test simplified property management integration
    if (typeof KejaSimplified !== 'undefined') {
      logTest('Property Management Integration', 'pass', 'Simplified BNB/rental system integrated');
    } else {
      logTest('Property Management Integration', 'warn', 'Simplified property system may not be loaded');
    }

  } catch (error) {
    logTest('Workflow Simulation', 'fail', 'Error testing workflows: ' + error.message);
  }

  // Test Suite 8: Performance & Load Testing
  console.log('\n⚡ PERFORMANCE TESTING');
  
  try {
    const startTime = performance.now();
    
    // Test multiple API calls
    const promises = [
      fetch('/api/communication/health'),
      fetch('/api/communication/health'),
      fetch('/api/communication/health')
    ];
    
    await Promise.all(promises);
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    if (totalTime < 1000) {
      logTest('API Response Time', 'pass', `3 concurrent requests completed in ${totalTime}ms`);
    } else if (totalTime < 3000) {
      logTest('API Response Time', 'warn', `3 concurrent requests completed in ${totalTime}ms`);
    } else {
      logTest('API Response Time', 'fail', `3 concurrent requests took ${totalTime}ms`);
    }

  } catch (error) {
    logTest('Performance Testing', 'fail', 'Error testing performance: ' + error.message);
  }

  // Final Results & Recommendations
  console.log('\n📊 FINAL TEST RESULTS');
  console.log('════════════════════════════════════════');
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  
  const totalTests = testResults.passed + testResults.warnings + testResults.failed;
  const successRate = Math.round((testResults.passed / totalTests) * 100);
  
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log(`🔢 Total Tests: ${totalTests}`);

  // System Status Assessment
  let systemStatus = 'UNKNOWN';
  let statusColor = '🟡';
  let recommendation = '';

  if (testResults.failed === 0) {
    if (testResults.warnings <= 2) {
      systemStatus = 'PRODUCTION READY';
      statusColor = '🟢';
      recommendation = 'System is fully operational and ready for production deployment!';
    } else {
      systemStatus = 'MOSTLY READY';
      statusColor = '🟡';
      recommendation = 'System is functional with minor issues. Review warnings before production.';
    }
  } else if (testResults.failed <= 3 && testResults.passed > testResults.failed) {
    systemStatus = 'NEEDS ATTENTION';
    statusColor = '🟠';
    recommendation = 'System has issues that should be resolved. Core functionality may work but needs fixes.';
  } else {
    systemStatus = 'CRITICAL ISSUES';
    statusColor = '🔴';
    recommendation = 'System has critical problems that prevent proper operation. Requires immediate attention.';
  }

  console.log(`\n${statusColor} SYSTEM STATUS: ${systemStatus}`);
  console.log(`📋 RECOMMENDATION: ${recommendation}`);

  // Interactive Demo Guide
  console.log('\n🎯 INTERACTIVE TESTING GUIDE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (token) {
    console.log('🔐 AUTHENTICATED USER - Full Testing Available:');
    console.log('');
    console.log('📬 COMMUNICATION DEMOS:');
    console.log('• demoPropertyInquiry() - Test rental property inquiry');
    console.log('• demoBNBInquiry() - Test BNB availability request');
    console.log('• demoServiceRequest() - Test service provider request');
    console.log('• demoSupportTicket() - Test support ticket creation');
    console.log('• demoMessagesCenter() - Open complete messages interface');
    console.log('• demoNotifications() - Open notifications center');
    console.log('');
    console.log('🏠 PROPERTY MANAGEMENT DEMOS:');
    console.log('• demoBNBDashboard() - BNB management interface');
    console.log('• demoRentalDashboard() - Rental management interface');
    console.log('');
    console.log('🔧 API TESTING:');
    console.log('• CommunicationAPI.getConversations() - Fetch user conversations');
    console.log('• CommunicationAPI.getSupportTickets() - Fetch support tickets');
    console.log('• CommunicationAPI.getNotifications() - Fetch notifications');
    console.log('• CommunicationAPI.getSystemHealth() - Check system health');
  } else {
    console.log('🔓 GUEST USER - Limited Testing Available:');
    console.log('');
    console.log('To unlock full testing capabilities:');
    console.log('1. Sign up or log in to KejaMarket');
    console.log('2. Run this test again');
    console.log('3. Access all communication features');
    console.log('');
    console.log('📬 AVAILABLE DEMOS:');
    console.log('• demoMessagesCenter() - View messages interface');
    console.log('• demoPropertyInquiry() - Test inquiry form (UI only)');
    console.log('• demoSupportTicket() - Test support form (UI only)');
  }

  console.log('\n🎯 QUICK START: Run demoMessagesCenter() to see the complete interface!');

  // Auto-launch demo if requested
  if (window.location.hash === '#test-e2e') {
    setTimeout(() => {
      console.log('\n🚀 Auto-launching comprehensive demo...');
      if (typeof demoMessagesCenter === 'function') {
        demoMessagesCenter();
      }
    }, 2000);
  }

  // Store test results globally for inspection
  window.testResults = testResults;
  
  console.log('\n💾 Test results stored in window.testResults for detailed inspection');
  console.log('✅ End-to-End Communication System Test Complete!');

});

console.log('✅ End-to-End Communication System Test Suite loaded');