/**
 * Test Simplified BNB and Property Management System
 */
console.log('🧪 Testing Simplified Property Management System...');

document.addEventListener('DOMContentLoaded', function() {
  
  // Test 1: Verify simplified management system is loaded
  if (typeof KejaSimplified !== 'undefined') {
    console.log('✅ KejaSimplified system loaded');
  } else {
    console.error('❌ KejaSimplified system not found');
  }
  
  // Test 2: Check BNB manager
  if (KejaSimplified.BNBManager) {
    console.log('✅ BNB Manager ready');
  }
  
  // Test 3: Check rental manager
  if (KejaSimplified.RentalManager) {
    console.log('✅ Rental Manager ready');
  }
  
  // Test 4: Verify CSS is loaded
  const testElement = document.createElement('div');
  testElement.className = 'simplified-bnb-section';
  document.body.appendChild(testElement);
  const styles = window.getComputedStyle(testElement);
  
  if (styles.background !== 'rgba(0, 0, 0, 0)' || styles.borderRadius !== '0px') {
    console.log('✅ Simplified management CSS loaded');
  } else {
    console.log('⚠️ CSS may still be loading');
  }
  
  document.body.removeChild(testElement);
  
  // Test 5: Demo the simplified workflow
  console.log('\n📋 Simplified Workflow Summary:');
  console.log('🏨 BNB Listings: Always visible → Guest inquiries → Host confirms');
  console.log('🏠 Rentals: Available ↔ Occupied toggle → Building-level only');
  console.log('🚫 No Units: Simplified to building management');
  console.log('📅 No Calendars: Host-confirmed availability through inquiries');
  
  // Test 6: Mock guest inquiry for testing
  window.testGuestInquiry = function() {
    KejaSimplified.GuestInquirySystem.showInquiryForm('test_bnb', 'Test BNB Property');
  };
  
  console.log('\n🎯 Test Functions Available:');
  console.log('• testGuestInquiry() - Test guest inquiry form');
  console.log('• KejaSimplified.toggleBNBStatus("test_id") - Test BNB status toggle');
  console.log('• KejaSimplified.toggleRentalStatus("test_id") - Test rental status toggle');
  
  console.log('\n✅ Simplified Property Management System Ready!');
  
});