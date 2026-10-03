/**
 * FORCE DESKTOP LAYOUT SCRIPT
 * Ensures desktop layout displays correctly regardless of other JS
 */

// Force desktop layout immediately on load
(function() {
  
  // Force desktop layout function
  function forceDesktopLayout() {
    
    // Only apply on desktop screens
    if (window.innerWidth <= 900) return;
    
    console.log('🖥️ Forcing desktop layout...');
    
    // Hide mobile elements
    const mobileElements = [
      '.mobile-hero-promo',
      '.mobile-quick-actions-row', 
      '.mobile-filter-card-container',
      '.smart-tools-hero-hub',
      '.category-pills-bar',
      '.mobile-filter-bar',
      '.keja-desktop-hero-strip',
      '.keja-feature-strip'
    ];
    
    mobileElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.height = '0';
        el.style.overflow = 'hidden';
      });
    });
    
    // Force main layout grid
    const mainLayout = document.getElementById('main-app-layout');
    if (mainLayout) {
      mainLayout.style.display = 'grid';
      mainLayout.style.gridTemplateColumns = '250px minmax(0, 1fr)';
      mainLayout.style.gap = '20px';
      mainLayout.style.maxWidth = '1480px';
      mainLayout.style.width = '100%';
      mainLayout.style.margin = '0 auto';
      mainLayout.style.padding = '20px 16px 40px 16px';
      mainLayout.style.background = '#ffffff';
      mainLayout.style.alignItems = 'start';
    }
    
    // Force sidebar visibility
    const sidebar = document.querySelector('.sidebar-filters');
    if (sidebar) {
      sidebar.style.display = 'block';
      sidebar.style.visibility = 'visible';
      sidebar.style.width = '250px';
      sidebar.style.minWidth = '250px';
      sidebar.style.maxWidth = '250px';
    }
    
    // Force content area visibility
    const contentArea = document.querySelector('.content-area-wrapper');
    if (contentArea) {
      contentArea.style.display = 'block';
      contentArea.style.visibility = 'visible';
      contentArea.style.width = '100%';
    }
    
    // Force property grid visibility
    const propertyGrid = document.getElementById('property-grid');
    if (propertyGrid) {
      propertyGrid.style.display = 'grid';
      propertyGrid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      propertyGrid.style.gap = '16px';
      propertyGrid.style.width = '100%';
      propertyGrid.style.visibility = 'visible';
    }
    
    // Force results header visibility
    const resultsHeader = document.querySelector('.results-header');
    if (resultsHeader) {
      resultsHeader.style.display = 'flex';
      resultsHeader.style.visibility = 'visible';
    }
    
    // Trigger property rendering if app object exists
    if (window.app && typeof window.app.renderProperties === 'function') {
      setTimeout(() => {
        console.log('🔄 Re-rendering properties for desktop...');
        window.app.renderProperties();
      }, 100);
    }
    
    console.log('✅ Desktop layout forced successfully');
  }
  
  // Apply immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceDesktopLayout);
  } else {
    forceDesktopLayout();
  }
  
  // Also apply after window load
  window.addEventListener('load', forceDesktopLayout);
  
  // Reapply on window resize
  window.addEventListener('resize', forceDesktopLayout);
  
  // Apply periodically to override any JS changes
  setInterval(forceDesktopLayout, 2000);
  
})();