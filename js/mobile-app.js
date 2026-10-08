/**
 * KejaMarket Mobile App JavaScript
 * Handles mobile-specific UI and interactions
 */

class MobileApp {
  constructor() {
    this.isMobile = this.detectMobile();
    this.init();
  }

  /**
   * Detect if user is on mobile device
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileDevice || isSmallScreen;
  }

  /**
   * Initialize mobile app
   */
  init() {
    if (this.isMobile) {
      this.enableMobileMode();
      this.setupMobileListeners();
      this.optimizeForTouch();
      console.log('📱 Mobile mode enabled');
    }

    // Listen for resize to toggle mobile mode
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        if (wasMobile !== this.isMobile) {
          location.reload(); // Reload to apply correct layout
        }
      }, 250);
    });
  }

  /**
   * Enable mobile-specific UI
   */
  enableMobileMode() {
    // Show mobile elements
    const mobileElements = document.querySelectorAll('.mobile-header, .mobile-search-bar, .mobile-bottom-nav');
    mobileElements.forEach(el => {
      if (el) el.style.display = '';
    });

    // Hide desktop elements
    const desktopElements = document.querySelectorAll('.site-header .header-container, .secondary-nav');
    desktopElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Add mobile class to body
    document.body.classList.add('mobile-mode');
    
    // Adjust main content
    const mainContent = document.querySelector('.main-content, main, #app-main');
    if (mainContent) {
      mainContent.style.marginTop = '120px';
      mainContent.style.marginBottom = '80px';
      mainContent.style.padding = '0';
    }

    // Make property cards mobile-optimized
    this.optimizePropertyCards();
  }

  /**
   * Setup mobile-specific event listeners
   */
  setupMobileListeners() {
    // Mobile search input
    const mobileSearchInput = document.getElementById('mobile-search-input');
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        if (window.app && app.handleSearch) {
          app.handleSearch(e.target.value);
        }
      });

      mobileSearchInput.addEventListener('focus', () => {
        // Scroll to top when search is focused
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Pull to refresh (if supported)
    this.setupPullToRefresh();

    // Prevent bounce scroll on iOS
    this.preventBounceScroll();
  }

  /**
   * Optimize property cards for mobile
   */
  optimizePropertyCards() {
    setTimeout(() => {
      const propertyCards = document.querySelectorAll('.property-card, .prop-card, .listing-card');
      propertyCards.forEach(card => {
        card.classList.add('touch-feedback');
        
        // Full width on mobile
        card.style.width = 'calc(100% - 32px)';
        card.style.margin = '0 16px 16px 16px';
        card.style.borderRadius = '16px';
        
        // Make image taller
        const img = card.querySelector('img');
        if (img) {
          img.style.height = '220px';
          img.style.objectFit = 'cover';
        }
      });
    }, 500);
  }

  /**
   * Optimize for touch interactions
   */
  optimizeForTouch() {
    // Increase tap target sizes
    const buttons = document.querySelectorAll('button, a, .clickable');
    buttons.forEach(btn => {
      const currentHeight = parseFloat(getComputedStyle(btn).height);
      if (currentHeight && currentHeight < 44) {
        btn.style.minHeight = '44px';
        btn.style.minWidth = '44px';
      }
    });

    // Add touch feedback to interactive elements
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, a, .clickable');
      if (target) {
        target.style.opacity = '0.7';
      }
    });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('button, a, .clickable');
      if (target) {
        setTimeout(() => {
          target.style.opacity = '';
        }, 100);
      }
    });
  }

  /**
   * Setup pull to refresh
   */
  setupPullToRefresh() {
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        isPulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;

      if (pullDistance > 80 && window.scrollY === 0) {
        // Trigger refresh
        this.refreshPage();
        isPulling = false;
      }
    });

    document.addEventListener('touchend', () => {
      isPulling = false;
    });
  }

  /**
   * Refresh page content
   */
  refreshPage() {
    console.log('📱 Refreshing...');
    if (window.app && app.refreshProperties) {
      app.refreshProperties();
    } else {
      location.reload();
    }
  }

  /**
   * Prevent bounce scroll on iOS
   */
  preventBounceScroll() {
    let lastY = 0;
    
    document.addEventListener('touchstart', (e) => {
      lastY = e.touches[0].pageY;
    });

    document.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].pageY;
      const scrollElement = e.target.closest('.scrollable, .modal-body, .dropdown-menu');
      
      if (!scrollElement) {
        // Prevent bounce if at top or bottom
        if ((window.scrollY === 0 && currentY > lastY) || 
            (window.scrollY + window.innerHeight >= document.body.scrollHeight && currentY < lastY)) {
          e.preventDefault();
        }
      }
      
      lastY = currentY;
    }, { passive: false });
  }

  /**
   * Show mobile toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `mobile-toast mobile-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#00b53f' : type === 'error' ? '#ef4444' : '#1f2937'};
      color: white;
      padding: 12px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize mobile app
const mobileApp = new MobileApp();

// Expose globally for other scripts
window.mobileApp = mobileApp;

// Add utility to kejaUI for mobile nav switching
if (typeof window.kejaUI === 'undefined') {
  window.kejaUI = {};
}

window.kejaUI.setMobileNav = function(element) {
  // Remove active class from all nav items
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked item
  if (element) {
    element.classList.add('active');
  }
};

console.log('📱 Mobile App JS loaded');
