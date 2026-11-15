/**
 * KejaMarket Logo Preloader & Server Wake-Up Controller
 * Version: 119.0
 *
 * Key bug fixes vs v118:
 *  - Single-shot flag in sessionStorage prevents the loader from re-appearing
 *    on every route change / soft navigation that re-runs DOMContentLoaded hooks.
 *  - pollServerHealth stops after first successful /api/health 200 response.
 *  - Safety 7.5 s hard timeout unchanged.
 */

(function(global) {
  'use strict';

  // ── Guard: only show ONCE per browser session ──────────────────────────────
  // On a true cold-boot visit sessionStorage is empty → show the loader.
  // On any subsequent SPA navigation or soft page reload the key is already set → skip.
  var SESSION_KEY = 'km_loader_shown_v119';
  if (sessionStorage.getItem(SESSION_KEY)) {
    // Already shown this session – remove the element if it somehow got injected again
    var staleEl = document.getElementById('km-3d-loader');
    if (staleEl && staleEl.parentNode) staleEl.parentNode.removeChild(staleEl);
    return;
  }

  var _dismissed = false;
  var _stepIndex = 0;
  var _cycleTimer = null;
  var _pollTimer  = null;
  var _serverAwake = false;

  var STEPS = [
    { progress: 20, text: '\u{1F680} Waking up KejaMarket secure cloud server...' },
    { progress: 45, text: '\u{1F3E0} Loading verified vacancies in Nairobi, Kiambu & Machakos...' },
    { progress: 68, text: '\u{1F4A7} Checking tap water pressure & private KPLC meters...' },
    { progress: 88, text: '\u{1F511} Connecting direct landlords & on-site caretakers...' },
    { progress: 95, text: '\u{2728} Almost ready! Finalising vacancy list...' }
  ];

  // ── DOM helpers ──────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  function updateStatus(text, progress) {
    var statusEl = el('km-loader-status');
    var fillEl   = el('km-loader-fill');
    if (statusEl && text) {
      statusEl.style.opacity = '0';
      setTimeout(function() {
        if (!_dismissed && statusEl) {
          statusEl.textContent = text;
          statusEl.style.opacity = '1';
        }
      }, 150);
    }
    if (fillEl && typeof progress === 'number') {
      fillEl.style.width = Math.min(100, progress) + '%';
    }
  }

  // ── Status cycle ─────────────────────────────────────────────────────────────
  function startCycle() {
    _cycleTimer = setInterval(function() {
      if (_dismissed) return;
      _stepIndex = Math.min(_stepIndex + 1, STEPS.length - 1);
      var s = STEPS[_stepIndex];
      updateStatus(s.text, s.progress);

      // Show skip button after ~3 s
      if (_stepIndex >= 2) {
        var skipBtn = el('km-loader-skip');
        if (skipBtn) skipBtn.style.display = 'inline-block';
      }
    }, 1300);
  }

  // ── Health polling ───────────────────────────────────────────────────────────
  function pollHealth() {
    if (_dismissed || _serverAwake) return;

    fetch('/api/health?_t=' + Date.now(), { cache: 'no-store' })
      .then(function(res) {
        if (res.ok) {
          _serverAwake = true;
          // Try to trigger live re-fetch in the app
          if (global.app && typeof global.app.fetchLiveProperties === 'function') {
            global.app.fetchLiveProperties();
          }
          if (global.MobileApp && typeof global.MobileApp.loadProperties === 'function') {
            global.MobileApp.loadProperties();
          }
          updateStatus('Karibu KejaMarket! Opening listings...', 100);
          setTimeout(function() { KM.dismiss(false); }, 350);
        } else {
          scheduleNextPoll();
        }
      })
      .catch(function() { scheduleNextPoll(); });
  }

  function scheduleNextPoll() {
    if (!_dismissed && !_serverAwake) {
      _pollTimer = setTimeout(pollHealth, 1800);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  var KM = {
    init: function() {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startCycle();
        pollHealth();
      } else {
        window.addEventListener('DOMContentLoaded', function() {
          startCycle();
          pollHealth();
        });
      }

      // Hard timeout: always dismiss after 7.5 s
      setTimeout(function() { if (!_dismissed) KM.dismiss(false); }, 7500);
    },

    dismiss: function(force) {
      if (_dismissed) return;
      _dismissed = true;

      // Mark as shown for this browser session
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(e) {}

      clearInterval(_cycleTimer);
      clearTimeout(_pollTimer);

      var loader = el('km-3d-loader');
      var fillEl  = el('km-loader-fill');
      var statusEl = el('km-loader-status');

      if (fillEl)   fillEl.style.width = '100%';
      if (statusEl) statusEl.textContent = 'Karibu KejaMarket!';

      setTimeout(function() {
        if (loader) {
          loader.style.opacity = '0';
          loader.style.pointerEvents = 'none';
          setTimeout(function() {
            if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
          }, 500);
        }
      }, force ? 30 : 300);
    }
  };

  global.KM3DLoader = KM;
  KM.init();

})(window);
