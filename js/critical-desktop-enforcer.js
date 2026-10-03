/**
 * CRITICAL DESKTOP LAYOUT ENFORCER
 * Aggressively forces desktop layout exactly like reference image
 * Overrides any mobile CSS or JS that tries to change layout
 * VERSION: 3.1 - CACHE BUSTER - Updated 2026-09-08
 */

(function() {
  'use strict';

  console.log('🚀 CRITICAL Desktop Layout Enforcer v3.1 Loading...');

  // Critical CSS injection for maximum specificity
  function injectCriticalCSS() {
    const criticalCSS = `
      /* ULTRA HIGH SPECIFICITY DESKTOP LAYOUT ENFORCEMENT */
      html body .main-app-layout,
      html body #main-app-layout {
        display: grid !important;
        grid-template-columns: 250px minmax(0, 1fr) !important;
        gap: 20px !important;
        max-width: 1480px !important;
        margin: 0 auto !important;
        padding: 20px 16px 40px 16px !important;
        background: #ffffff !important;
        align-items: start !important;
      }
      
      html body .sidebar-filters,
      html body #sidebar-filters {
        display: block !important;
        visibility: visible !important;
        width: 250px !important;
        min-width: 250px !important;
        background: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 12px !important;
        padding: 20px !important;
      }
      
      html body .property-listings-grid,
      html body .property-grid,
      html body #property-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 16px !important;
        width: 100% !important;
        visibility: visible !important;
      }
      
      html body .content-area-wrapper {
        display: block !important;
        visibility: visible !important;
        width: 100% !important;
      }
      
      html body .results-header {
        display: flex !important;
        visibility: visible !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 24px !important;
        padding-bottom: 16px !important;
        border-bottom: 1px solid #f1f5f9 !important;
      }
      
      /* HIDE MOBILE ELEMENTS */
      html body .mobile-hero-promo,
      html body .mobile-quick-actions-row, 
      html body .mobile-filter-card-container,
      html body .smart-tools-hero-hub,
      html body .category-pills-bar,
      html body .mobile-filter-bar,
      html body .keja-desktop-hero-strip,
      html body .keja-feature-strip {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
      }
    `;
    
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = criticalCSS;
    style.setAttribute('id', 'critical-desktop-enforcer');
    document.head.appendChild(style);
    
    console.log('✅ Critical CSS injected for desktop layout');
  }

  // Force desktop layout with maximum aggression
  function enforceDesktopLayout() {
    console.log('🔧 Enforcing desktop layout...');
    
    // 1. Force main layout
    const mainLayout = document.querySelector('.main-app-layout, #main-app-layout');
    if (mainLayout) {
      mainLayout.style.setProperty('display', 'grid', 'important');
      mainLayout.style.setProperty('grid-template-columns', '250px minmax(0, 1fr)', 'important');
      mainLayout.style.setProperty('gap', '20px', 'important');
      mainLayout.style.setProperty('max-width', '1480px', 'important');
      mainLayout.style.setProperty('margin', '0 auto', 'important');
      mainLayout.style.setProperty('padding', '20px 16px 40px 16px', 'important');
      mainLayout.style.setProperty('align-items', 'start', 'important');
    }
    
    // 2. Force sidebar
    const sidebar = document.querySelector('.sidebar-filters, #sidebar-filters');
    if (sidebar) {
      sidebar.style.setProperty('display', 'block', 'important');
      sidebar.style.setProperty('visibility', 'visible', 'important');
      sidebar.style.setProperty('width', '250px', 'important');
      sidebar.style.setProperty('min-width', '250px', 'important');
    }
    
    // 3. Force property grid
    const propertyGrids = document.querySelectorAll('.property-listings-grid, .property-grid, #property-grid');
    propertyGrids.forEach(grid => {
      grid.style.setProperty('display', 'grid', 'important');
      grid.style.setProperty('grid-template-columns', 'repeat(4, minmax(0, 1fr))', 'important');
      grid.style.setProperty('gap', '16px', 'important');
      grid.style.setProperty('width', '100%', 'important');
      grid.style.setProperty('visibility', 'visible', 'important');
    });
    
    // 4. Force content area
    const contentArea = document.querySelector('.content-area-wrapper');
    if (contentArea) {
      contentArea.style.setProperty('display', 'block', 'important');
      contentArea.style.setProperty('visibility', 'visible', 'important');
      contentArea.style.setProperty('width', '100%', 'important');
    }
    
    // 5. Force results header
    const resultsHeader = document.querySelector('.results-header');
    if (resultsHeader) {
      resultsHeader.style.setProperty('display', 'flex', 'important');
      resultsHeader.style.setProperty('visibility', 'visible', 'important');
    }
    
    // 6. Hide mobile elements
    const mobileSelectors = [
      '.mobile-hero-promo',
      '.mobile-quick-actions-row', 
      '.mobile-filter-card-container',
      '.smart-tools-hero-hub',
      '.category-pills-bar',
      '.mobile-filter-bar',
      '.keja-desktop-hero-strip',
      '.keja-feature-strip'
    ];
    
    mobileSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('height', '0', 'important');
      });
    });
    
    console.log('✅ Desktop layout enforced successfully');
  }
  
  // Aggressive property rendering trigger
  function triggerPropertyRendering() {
    setTimeout(() => {
      if (window.app && typeof window.app.renderProperties === 'function') {
        console.log('🔄 Triggering property re-render...');
        window.app.renderProperties();
      }
      
      if (window.app && typeof window.app.loadProperties === 'function') {
        console.log('🔄 Triggering property reload...');
        window.app.loadProperties();
      }
    }, 200);
  }
  
  // Override any viewport meta that might cause mobile behavior
  function overrideViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1200, initial-scale=1.0, user-scalable=yes');
    }
  }
  
  // Run immediately
  injectCriticalCSS();
  overrideViewport();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      enforceDesktopLayout();
      triggerPropertyRendering();
    });
  } else {
    enforceDesktopLayout();
    triggerPropertyRendering();
  }
  
  // Also run after full load
  window.addEventListener('load', function() {
    enforceDesktopLayout();
    triggerPropertyRendering();
  });
  
  // Monitor for changes and re-enforce
  const observer = new MutationObserver(function(mutations) {
    let needsReEnforcement = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        needsReEnforcement = true;
      }
    });
    
    if (needsReEnforcement) {
      setTimeout(enforceDesktopLayout, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // Re-enforce every 1 second to override any changes
  setInterval(enforceDesktopLayout, 1000);
  
  console.log('🎯 Critical Desktop Layout Enforcer Active');
  
})();