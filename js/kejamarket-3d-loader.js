/**
 * KejaMarket 3D Logo Preloader & Server Wake-Up Controller
 * Version: 118.0
 * 
 * Features:
 *  - Pure 60fps CSS 3D House Logo with floating perspective
 *  - Intercepts cold boots & Render service wake-up delays
 *  - Continuously polls /api/health to auto-connect as soon as cloud server responds
 *  - Auto-syncs live listings once server is awake
 *  - Instant "Skip to Browse" button for offline / cached instant entry
 *  - Failsafe auto-dismissal
 */

(function(global) {
  'use strict';

  var _dismissed = false;
  var _stepIndex = 0;
  var _timer = null;
  var _pollTimer = null;
  var _serverAwake = false;

  var STEPS = [
    { progress: 25, text: '🚀 Waking up KejaMarket secure cloud server...' },
    { progress: 50, text: '🏠 Loading verified vacancies in Nairobi, Kiambu & Machakos...' },
    { progress: 75, text: '💧 Checking tap water pressure & private KPLC meters...' },
    { progress: 90, text: '🔑 Connecting direct landlords & on-site caretakers...' },
    { progress: 96, text: '✨ Almost ready! Finalizing vacancy list...' }
  ];

  function updateStatus(text, progress) {
    var statusEl = document.getElementById('km-3d-loader-status');
    var fillEl = document.getElementById('km-3d-progress-fill');

    if (statusEl && text) {
      statusEl.style.opacity = '0';
      setTimeout(function() {
        if (statusEl && !_dismissed) {
          statusEl.textContent = text;
          statusEl.style.opacity = '1';
        }
      }, 150);
    }

    if (fillEl && typeof progress === 'number') {
      fillEl.style.width = Math.min(100, progress) + '%';
    }
  }

  function startCycle() {
    var skipBtn = document.getElementById('km-3d-skip-btn');

    _timer = setInterval(function() {
      if (_dismissed) return;
      _stepIndex++;

      if (_stepIndex < STEPS.length) {
        var s = STEPS[_stepIndex];
        updateStatus(s.text, s.progress);
      }

      // Show Skip button after 3.6 seconds (e.g. Render waking up) so user can browse cached data
      if (_stepIndex >= 2 && skipBtn) {
        skipBtn.style.display = 'inline-block';
      }
    }, 1300);

    // Actively poll /api/health to catch the moment server comes alive
    pollServerHealth();
  }

  function pollServerHealth() {
    if (_dismissed || _serverAwake) return;

    fetch('/api/health?_t=' + Date.now(), { cache: 'no-store' })
      .then(function(res) {
        if (res.ok) {
          _serverAwake = true;
          console.log('[KM3DLoader] Cloud server is awake and healthy!');
          
          // Trigger live properties reload if app is waiting
          if (global.app && typeof global.app.fetchLiveProperties === 'function') {
            global.app.fetchLiveProperties();
          }
          if (global.MobileApp && typeof global.MobileApp.loadProperties === 'function') {
            global.MobileApp.loadProperties();
          }

          updateStatus('Karibu KejaMarket! Opening listings...', 100);
          setTimeout(function() {
            global.KM3DLoader.dismiss(false);
          }, 400);
        } else {
          scheduleNextPoll();
        }
      })
      .catch(function() {
        scheduleNextPoll();
      });
  }

  function scheduleNextPoll() {
    if (_dismissed || _serverAwake) return;
    _pollTimer = setTimeout(pollServerHealth, 1600);
  }

  global.KM3DLoader = {
    init: function() {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startCycle();
      } else {
        window.addEventListener('DOMContentLoaded', startCycle);
      }

      // Maximum safety timeout: dismiss after 7.5 seconds so user is never blocked
      setTimeout(function() {
        if (!_dismissed) {
          global.KM3DLoader.dismiss(false);
        }
      }, 7500);
    },

    dismiss: function(force) {
      if (_dismissed) return;
      _dismissed = true;

      if (_timer) {
        clearInterval(_timer);
        _timer = null;
      }
      if (_pollTimer) {
        clearTimeout(_pollTimer);
        _pollTimer = null;
      }

      var loader = document.getElementById('km-3d-loader');
      var fillEl = document.getElementById('km-3d-progress-fill');
      var statusEl = document.getElementById('km-3d-loader-status');

      if (fillEl) fillEl.style.width = '100%';
      if (statusEl) statusEl.textContent = 'Karibu KejaMarket!';

      setTimeout(function() {
        if (loader) {
          loader.classList.add('km-3d-fadeout');
          loader.style.opacity = '0';
          loader.style.pointerEvents = 'none';
          setTimeout(function() {
            if (loader && loader.parentNode) {
              loader.parentNode.removeChild(loader);
            }
          }, 500);
        }
      }, force ? 30 : 250);
    }
  };

  // Auto-init immediately
  global.KM3DLoader.init();

})(window);
