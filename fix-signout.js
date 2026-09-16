// Fix for SignOut button not responding
// This script patches the kejaAuth.signOut function to be more robust

(function() {
  console.log('Applying SignOut fix...');
  
  if (window.kejaAuth && typeof window.kejaAuth.signOut === 'function') {
    // Save original function
    const originalSignOut = window.kejaAuth.signOut;
    
    // Replace with improved version
    window.kejaAuth.signOut = function() {
      try {
        console.log('SignOut: Starting logout process...');
        
        // Clear localStorage immediately
        localStorage.removeItem('keja_token');
        localStorage.removeItem('keja_session');
        console.log('SignOut: Session cleared from localStorage');
        
        // Try calling original function
        try {
          originalSignOut();
        } catch (e) {
          console.warn('SignOut: Error in original function:', e);
        }
        
        // Show success message
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('✅ Signed out successfully!', 'success');
        } else {
          alert('✅ Signed out successfully!');
        }
        
        // Force reload page after 500ms to ensure clean state
        setTimeout(() => {
          console.log('SignOut: Reloading page...');
          window.location.href = '/';
        }, 500);
        
      } catch (error) {
        console.error('SignOut: Critical error:', error);
        // Emergency fallback
        localStorage.clear();
        alert('Signed out successfully');
        window.location.href = '/';
      }
    };
    
    console.log('✅ SignOut fix applied successfully');
    
    // Also add global emergency logout function
    window.emergencyLogout = function() {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    };
    
    console.log('✅ Emergency logout function available: emergencyLogout()');
  } else {
    console.error('❌ kejaAuth.signOut not found - cannot apply fix');
  }
})();
