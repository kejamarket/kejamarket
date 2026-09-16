/**
 * Test Profile Dropdown Functionality
 */

console.log('🧪 Testing Profile Dropdown...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // Test 1: Check if profile dropdown exists
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileDropdown) {
    console.log('✅ Profile dropdown element found');
    
    // Ensure it uses the new compact styling
    profileDropdown.style.cssText = `
      display: none !important;
      position: absolute !important;
      top: 50px !important;
      right: 10px !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
      min-width: 280px !important;
      max-width: 320px !important;
      z-index: 9999 !important;
      padding: 0 !important;
      border: 1px solid #e5e7eb !important;
      overflow: hidden !important;
    `;
    
    console.log('✅ Profile dropdown styling applied');
  } else {
    console.error('❌ Profile dropdown element not found');
  }
  
  // Test 2: Check if auth button exists
  const authButton = document.getElementById('btn-auth-header');
  if (authButton) {
    console.log('✅ Auth button found');
    
    // Test click functionality
    authButton.addEventListener('click', function() {
      console.log('🖱️ Auth button clicked - testing dropdown');
      
      setTimeout(() => {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown && dropdown.style.display === 'block') {
          console.log('✅ Profile dropdown opened successfully');
          
          // Check if content has new structure
          const content = dropdown.querySelector('.profile-dropdown-header');
          if (content) {
            console.log('✅ New Jiji-style profile content detected');
          } else {
            console.log('⚠️ Still using old profile content structure');
          }
        } else {
          console.log('❌ Profile dropdown did not open');
        }
      }, 100);
    });
    
  } else {
    console.error('❌ Auth button not found');
  }
  
  // Test 3: Remove any conflicting notifications
  setInterval(() => {
    const notifications = document.querySelectorAll('[innerHTML*="Buttons Fixed"], [textContent*="Buttons Fixed"]');
    if (notifications.length > 0) {
      console.log(`🗑️ Removing ${notifications.length} button fix notifications`);
      notifications.forEach(notif => notif.remove());
    }
  }, 1000);
  
  console.log('🧪 Profile dropdown tests initialized');
});

// Force cleanup of any interfering elements
window.addEventListener('load', function() {
  // Remove any elements that might interfere
  const interfering = document.querySelectorAll('[style*="479"], [innerHTML*="479 Buttons"], .emergency-fix');
  interfering.forEach(el => el.remove());
  
  console.log('🧹 Cleaned up interfering elements');
});