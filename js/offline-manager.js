/**
 * KejaMarket Offline Manager & Resilient PWA Experience
 * Handles offline detection, UI notification banner, server action guards,
 * graceful fallback for cached property browsing, and safe online data refresh.
 */

(function () {
  'use strict';

  // Configuration
  const OFFLINE_BANNER_ID = 'kejamarket-offline-banner';
  const TOAST_CONTAINER_ID = 'kejamarket-toast-container';

  const state = {
    isOffline: !navigator.onLine,
    hasShownBanner: false
  };

  /**
   * Helper: Show Toast Notification
   */
  function showToast(message, type = 'info', duration = 4500) {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = TOAST_CONTAINER_ID;
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 90%;
        width: 420px;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isError = type === 'error' || type === 'warning';
    const bgColor = isError ? '#0f172a' : '#052e16';
    const borderColor = isError ? '#ef4444' : '#22c55e';
    const icon = isError ? 'fa-exclamation-triangle' : 'fa-check-circle';
    const iconColor = isError ? '#ef4444' : '#22c55e';

    toast.style.cssText = `
      background: ${bgColor};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      border-left: 4px solid ${borderColor};
      pointer-events: auto;
      animation: kejaFadeInUp 0.25s ease-out;
      line-height: 1.4;
    `;

    toast.innerHTML = `
      <i class="fas ${icon}" style="color: ${iconColor}; font-size: 1.15rem; flex-shrink: 0;"></i>
      <div style="flex: 1;">${message}</div>
      <button style="background: none; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 0 4px;" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.onclick = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    };

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
          toast.style.transition = 'all 0.2s ease';
          setTimeout(() => toast.remove(), 200);
        }
      }, duration);
    }
  }

  /**
   * Create or update the responsive top offline banner
   */
  function renderOfflineBanner() {
    let banner = document.getElementById(OFFLINE_BANNER_ID);

    if (!state.isOffline) {
      if (banner) {
        // Show quick green "Back Online" transition before removing
        banner.style.background = 'linear-gradient(90deg, #15803d 0%, #16a34a 100%)';
        banner.innerHTML = `
          <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.88rem; font-weight: 700; color: #ffffff;">
            <i class="fas fa-check-circle" style="font-size: 1rem;"></i>
            <span>Internet connection restored. Live data synchronized.</span>
          </div>
        `;
        setTimeout(() => {
          if (banner) {
            banner.style.maxHeight = '0';
            banner.style.opacity = '0';
            banner.style.padding = '0';
            setTimeout(() => banner && banner.remove(), 400);
          }
        }, 3000);
      }
      return;
    }

    if (!banner) {
      banner = document.createElement('div');
      banner.id = OFFLINE_BANNER_ID;
      banner.style.cssText = `
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100000;
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        color: #ffffff;
        border-bottom: 2px solid #eab308;
        padding: 10px 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      document.body.prepend(banner);
    }

    banner.innerHTML = `
      <div style="max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #ca8a04; color: #ffffff; font-size: 0.82rem;">
            <i class="fas fa-wifi-slash"></i>
          </span>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #fef08a; display: flex; align-items: center; gap: 6px;">
              You are currently offline
              <span style="font-size: 0.72rem; padding: 2px 7px; background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; border-radius: 12px; font-weight: 700; color: #fef08a;">Offline Mode</span>
            </div>
            <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 1px;">
              Viewing cached properties. Online features (login, viewing bookings, ad posting, payments) will resume when reconnected.
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="keja-btn-check-connection" style="background: #eab308; color: #0f172a; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s ease;">
            <i class="fas fa-rotate-right"></i> Check Connection
          </button>
        </div>
      </div>
    `;

    const checkBtn = banner.querySelector('#keja-btn-check-connection');
    if (checkBtn) {
      checkBtn.onclick = checkConnectionNow;
    }
  }

  /**
   * Ping network to verify if real connection is restored
   */
  async function checkConnectionNow() {
    const btn = document.getElementById('keja-btn-check-connection');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
      btn.disabled = true;
    }

    try {
      // Fetch small cache-busted request
      const response = await fetch('/manifest.json?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store'
      });
      if (response.ok) {
        handleOnline();
        showToast('Connected! You are now back online.', 'success');
      } else {
        throw new Error('Offline');
      }
    } catch (e) {
      showToast('Still offline. Please check your WiFi or mobile data connection.', 'warning');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-rotate-right"></i> Check Connection';
        btn.disabled = false;
      }
    }
  }

  /**
   * Protect server-dependent actions when offline
   */
  function guardServerActions() {
    // Intercept clicks on actions that strictly require online backend
    document.addEventListener('click', function (e) {
      if (!state.isOffline) return;

      const target = e.target.closest('button, a, input[type="submit"]');
      if (!target) return;

      // 1. Authentication forms
      if (
        target.id === 'login-submit-btn' ||
        target.id === 'register-submit-btn' ||
        target.closest('#login-form') ||
        target.closest('#register-form') ||
        target.classList.contains('auth-submit-btn')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Login and account registration require an active internet connection.', 'error');
        return;
      }

      // 2. Post Property / Post Ad
      if (
        target.id === 'btn-post-property' ||
        target.id === 'header-post-btn' ||
        target.closest('#property-post-form') ||
        (target.textContent && target.textContent.includes('Post Property') && target.tagName === 'BUTTON') ||
        (target.getAttribute('href') && target.getAttribute('href').includes('action=post'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Posting a property requires an active internet connection to upload photos and save your listing.', 'warning');
        return;
      }

      // 3. Bookings, inquiries, direct chat
      if (
        target.classList.contains('book-viewing-btn') ||
        target.classList.contains('contact-landlord-btn') ||
        target.id === 'btn-book-viewing' ||
        target.closest('#booking-modal')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Viewing bookings and landlord inquiries require an active internet connection.', 'warning');
        return;
      }

      // 4. M-Pesa payments & STK push
      if (
        target.classList.contains('mpesa-pay-btn') ||
        target.id === 'btn-initiate-mpesa' ||
        target.closest('#payment-modal')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('M-Pesa payment processing requires an active internet connection.', 'error');
        return;
      }
    }, true);

    // Form submit blocker
    document.addEventListener('submit', function (e) {
      if (!state.isOffline) return;

      const form = e.target;
      const formId = form.id || '';
      if (
        formId.includes('login') ||
        formId.includes('register') ||
        formId.includes('auth') ||
        formId.includes('post') ||
        formId.includes('payment') ||
        formId.includes('booking')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showToast('This action cannot be completed while offline. Please connect to the internet and try again.', 'warning');
      }
    }, true);
  }

  /**
   * Image Fallback Listener: Replace failed images with sleek offline SVG placeholder
   */
  function setupImageFallbacks() {
    window.addEventListener('error', function (e) {
      const target = e.target;
      if (target && target.tagName === 'IMG') {
        if (!target.dataset.fallbackApplied) {
          target.dataset.fallbackApplied = 'true';
          target.src = '/icons/offline-placeholder.svg';
          target.alt = 'Image cached offline - available when online';
          target.style.objectFit = 'cover';
        }
      }
    }, true);

    // Also scan existing images on page load
    document.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', function () {
        if (!this.dataset.fallbackApplied) {
          this.dataset.fallbackApplied = 'true';
          this.src = '/icons/offline-placeholder.svg';
          this.alt = 'Image cached offline - available when online';
          this.style.objectFit = 'cover';
        }
      });
    });
  }

  /**
   * Event Handlers for Online/Offline transitions
   */
  function handleOffline() {
    state.isOffline = true;
    document.body.classList.add('kejamarket-offline');
    renderOfflineBanner();
    showToast('You are now offline. Displaying cached properties.', 'warning');
  }

  function handleOnline() {
    state.isOffline = false;
    document.body.classList.remove('kejamarket-offline');
    renderOfflineBanner();
    showToast('Connected! Restoring live features and updating listings...', 'success');

    // Safe data refresh: if property loader function exists, refresh without reloading the entire page
    try {
      if (window.kejaApp && typeof window.kejaApp.refreshProperties === 'function') {
        window.kejaApp.refreshProperties();
      } else if (typeof window.renderListings === 'function') {
        window.renderListings();
      }
    } catch (err) {
      console.warn('OfflineManager: Auto-refresh error:', err);
    }
  }

  // Initialize
  function init() {
    // Listen to network status events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    setupImageFallbacks();
    guardServerActions();

    // Check initial state
    if (state.isOffline) {
      handleOffline();
    }

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js?v=31.0')
        .then((reg) => {
          console.log('[OfflineManager] Service worker active with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[OfflineManager] Service worker registration error:', err);
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export utility to window for manual checks
  window.kejaOffline = {
    isOffline: () => state.isOffline,
    checkConnection: checkConnectionNow,
    showToast: showToast
  };
})();
