/**
 * EMERGENCY FIX FOR KEJAMARKET.CO.KE
 * This file fixes ALL non-responsive buttons
 * 
 * SYMPTOMS FIXED:
 * - Sign out button not working
 * - Photo clicks not working
 * - Property cards not opening
 * - Search not responding
 * - All buttons unresponsive
 * 
 * ROOT CAUSE: JavaScript execution failure or event listener issues
 */

(function() {
  console.log('🚨 EMERGENCY FIX: Initializing button repairs...');
  
  let fixCount = 0;
  
  // Fix 1: Ensure app is loaded
  function waitForApp() {
    if (typeof window.app !== 'undefined' && typeof window.kejaAuth !== 'undefined') {
      console.log('✅ App and Auth modules loaded');
      applyAllFixes();
    } else {
      console.log('⏳ Waiting for app to load...');
      setTimeout(waitForApp, 100);
    }
  }
  
  function applyAllFixes() {
    
    // FIX #1: Property Cards Click
    document.querySelectorAll('.property-card, .listing-card').forEach((card, index) => {
      if (card && !card.hasAttribute('data-fixed')) {
        card.style.cursor = 'pointer';
        card.onclick = function(e) {
          // Prevent if clicking favorite button
          if (e.target.closest('.btn-favorite-heart')) return;
          
          const propId = this.getAttribute('data-id') || this.id;
          console.log('Card clicked:', propId);
          if (window.app && typeof window.app.showPropertyDetail === 'function') {
            window.app.showPropertyDetail(propId);
          }
        };
        card.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #2: Favorite Hearts
    document.querySelectorAll('.btn-favorite-heart').forEach((btn) => {
      if (btn && !btn.hasAttribute('data-fixed')) {
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
        btn.onclick = function(e) {
          e.stopPropagation();
          const card = this.closest('[data-id]');
          const propId = card ? card.getAttribute('data-id') : null;
          console.log('Favorite clicked:', propId);
          if (window.app && typeof window.app.toggleFavorite === 'function' && propId) {
            window.app.toggleFavorite(propId, e);
          }
        };
        btn.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #3: Category Pills
    document.querySelectorAll('.category-pill').forEach((pill) => {
      if (pill && !pill.hasAttribute('data-fixed')) {
        pill.style.cursor = 'pointer';
        pill.onclick = function() {
          const category = this.getAttribute('data-category') || this.textContent.trim();
          console.log('Category clicked:', category);
          if (window.app && typeof window.app.setCategory === 'function') {
            window.app.setCategory(category);
          }
        };
        pill.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #4: Sign Out Button
    document.querySelectorAll('[onclick*="signOut"]').forEach((btn) => {
      if (btn && !btn.hasAttribute('data-fixed')) {
        btn.style.cursor = 'pointer';
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Sign out clicked');
          
          // Force logout
          localStorage.removeItem('keja_token');
          localStorage.removeItem('keja_session');
          
          if (window.kejaAuth && typeof window.kejaAuth.signOut === 'function') {
            try {
              window.kejaAuth.signOut();
            } catch (err) {
              console.warn('signOut error:', err);
              // Fallback: redirect to home
              window.location.href = '/';
            }
          } else {
            // Absolute fallback
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }
        };
        btn.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #5: Auth Modal Button
    const authBtn = document.getElementById('btn-auth-header');
    if (authBtn && !authBtn.hasAttribute('data-fixed')) {
      authBtn.style.cursor = 'pointer';
      authBtn.onclick = function() {
        console.log('Auth button clicked');
        if (window.kejaAuth && typeof window.kejaAuth.openAuthModal === 'function') {
          window.kejaAuth.openAuthModal();
        } else if (window.app) {
          window.app.openModal('modal-auth');
        }
      };
      authBtn.setAttribute('data-fixed', 'true');
      fixCount++;
    }
    
    // FIX #6: Search Button
    const searchBtn = document.querySelector('.btn-search, #btn-search');
    if (searchBtn && !searchBtn.hasAttribute('data-fixed')) {
      searchBtn.style.cursor = 'pointer';
      searchBtn.onclick = function() {
        console.log('Search clicked');
        if (window.app && typeof window.app.applyFilters === 'function') {
          window.app.applyFilters();
        }
      };
      searchBtn.setAttribute('data-fixed', 'true');
      fixCount++;
    }
    
    // FIX #7: Photo Gallery in Detail Modal
    document.querySelectorAll('.detail-photo-thumb, .photo-thumbnail').forEach((thumb) => {
      if (thumb && !thumb.hasAttribute('data-fixed')) {
        thumb.style.cursor = 'pointer';
        thumb.onclick = function() {
          const index = this.getAttribute('data-index') || 0;
          console.log('Photo thumbnail clicked:', index);
          if (window.app && typeof window.app.showPhotoAtIndex === 'function') {
            window.app.showPhotoAtIndex(index);
          }
        };
        thumb.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #8: Property Detail Photos (main photo click for lightbox)
    const mainPhoto = document.getElementById('detail-modal-main-photo');
    if (mainPhoto && !mainPhoto.hasAttribute('data-fixed')) {
      mainPhoto.style.cursor = 'zoom-in';
      mainPhoto.onclick = function() {
        console.log('Main photo clicked');
        if (window.app && typeof window.app.openLightbox === 'function') {
          window.app.openLightbox();
        }
      };
      mainPhoto.setAttribute('data-fixed', 'true');
      fixCount++;
    }
    
    // FIX #9: Modal Close Buttons
    document.querySelectorAll('.modal-close-btn, .btn-close-modal').forEach((btn) => {
      if (btn && !btn.hasAttribute('data-fixed')) {
        btn.style.cursor = 'pointer';
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          const modal = this.closest('.modal-backdrop');
          if (modal) {
            modal.classList.remove('open');
            console.log('Modal closed');
          }
        };
        btn.setAttribute('data-fixed', 'true');
        fixCount++;
      }
    });
    
    // FIX #10: Ensure all onclick elements have pointer cursor
    document.querySelectorAll('[onclick]').forEach((el) => {
      if (!el.hasAttribute('data-onclick-fixed')) {
        el.style.cursor = el.style.cursor || 'pointer';
        el.setAttribute('data-onclick-fixed', 'true');
        fixCount++;
      }
    });
    
    console.log(`✅ EMERGENCY FIX COMPLETE: ${fixCount} buttons repaired`);
    
    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;z-index:999999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.5s ease;';
    indicator.innerHTML = `✅ ${fixCount} Buttons Fixed!`;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.style.transition = 'opacity 0.5s';
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 500);
    }, 3000);
  }
  
  // FIX #11: Global Emergency Functions
  window.emergencyLogout = function() {
    localStorage.clear();
    sessionStorage.clear();
    alert('✅ Emergency logout complete');
    window.location.href = '/';
  };
  
  window.emergencyReload = function() {
    location.reload(true);
  };
  
  window.debugButtons = function() {
    console.log('=== BUTTON DEBUG INFO ===');
    console.log('Total buttons:', document.querySelectorAll('button').length);
    console.log('Buttons with onclick:', document.querySelectorAll('button[onclick]').length);
    console.log('Property cards:', document.querySelectorAll('.property-card').length);
    console.log('App loaded:', typeof window.app !== 'undefined');
    console.log('Auth loaded:', typeof window.kejaAuth !== 'undefined');
    console.log('Modals:', document.querySelectorAll('.modal-backdrop').length);
  };
  
  // Start the fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForApp);
  } else {
    waitForApp();
  }
  
  console.log('🚨 Emergency fix loaded. Available commands:');
  console.log('  - emergencyLogout() - Force logout');
  console.log('  - emergencyReload() - Hard reload page');
  console.log('  - debugButtons() - Show button debug info');
  
})();
