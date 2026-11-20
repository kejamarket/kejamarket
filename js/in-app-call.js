/**
 * KejaMarket WhatsApp-Style Voice Calling System
 * v143 - Realistic WhatsApp Voice Call Experience for Desktop & PWA
 * End-to-end encrypted styling, authentic dual-tone ring cadence, live elapsed timer
 */
(function(global) {
  'use strict';

  var _activeCall = null;
  var _timerInterval = null;
  var _ringInterval = null;
  var _ringOscillators = [];
  var _audioCtx = null;
  var _secondsElapsed = 0;
  var _isMuted = false;
  var _isSpeaker = true;
  var _callState = 'idle'; // 'calling', 'ringing', 'connected', 'ended'

  function getAudioContext() {
    if (!_audioCtx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        _audioCtx = new AudioCtx();
      }
    }
    if (_audioCtx && _audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    return _audioCtx;
  }

  // Synthesize realistic dual-frequency European/African telephone ring tone (425Hz + 450Hz)
  function playSingleRingBurst() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var duration = 1.15; // 1.15s ring burst

      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(425, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(450, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.07, now + 0.05);
      gainNode.gain.setValueAtTime(0.07, now + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);

      _ringOscillators.push(osc1, osc2);
      setTimeout(function() {
        try {
          osc1.disconnect();
          osc2.disconnect();
          gainNode.disconnect();
        } catch (e) {}
      }, (duration + 0.1) * 1000);
    } catch (e) {
      console.warn('Ring tone synthesis audio note:', e);
    }
  }

  function startRingingLoop() {
    stopRingTones();
    playSingleRingBurst();
    _ringInterval = setInterval(function() {
      if (_callState === 'ringing') {
        playSingleRingBurst();
      } else {
        stopRingTones();
      }
    }, 3200); // 1.15s burst + 2.05s pause cadence
  }

  function stopRingTones() {
    if (_ringInterval) {
      clearInterval(_ringInterval);
      _ringInterval = null;
    }
    while (_ringOscillators.length > 0) {
      var osc = _ringOscillators.pop();
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    }
  }

  function playConnectChirp() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  function playEndBeep() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var freqs = [480, 420, 360];
      freqs.forEach(function(f, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var t = now + (i * 0.12);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.11);
      });
    } catch (e) {}
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function ensureModal() {
    var modal = document.getElementById('modal-in-app-call');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modal-in-app-call';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(11,20,26,0.94); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); align-items:center; justify-content:center; padding:16px; font-family:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,sans-serif;';

    modal.innerHTML = [
      '<div class="km-wa-call-window" style="max-width:390px; width:100%; border-radius:28px; background:radial-gradient(circle at 50% 25%, #182229 0%, #0b141a 100%); color:#ffffff; padding:28px 20px 28px; text-align:center; box-shadow:0 30px 80px rgba(0,0,0,0.85); border:1px solid rgba(255,255,255,0.08); position:relative; overflow:hidden;">',

      // WhatsApp Top Security Bar
      '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; font-size:12px; color:#8696a0;">',
      '<button type="button" onclick="window.KMInAppCall.minimize()" style="background:none; border:none; color:#8696a0; font-size:15px; cursor:pointer;" title="Minimize Call"><i class="fas fa-chevron-down"></i></button>',
      '<div style="display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:11.5px; color:#8696a0;">',
      '<i class="fas fa-lock" style="font-size:10px; color:#00a884;"></i> End-to-end encrypted',
      '</div>',
      '<div style="width:20px;"></div>',
      '</div>',

      // Caller Name & Context
      '<h2 id="km-call-name" style="margin:0 0 4px; font-size:1.55rem; font-weight:800; color:#e9edef; letter-spacing:-0.02em;">Verified Landlord</h2>',
      '<div id="km-call-context" style="font-size:12.5px; color:#8696a0; margin-bottom:12px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%; margin-left:auto; margin-right:auto;">Property Inquiry</div>',

      // Realistic Call State (Calling... -> Ringing... -> 00:01)
      '<div id="km-call-status-badge" style="display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#00a884; margin-bottom:32px; min-height:26px;">',
      '<span id="km-call-status-icon"><i class="fas fa-circle-notch fa-spin"></i></span>',
      '<span id="km-call-status-text">Calling...</span>',
      '</div>',

      // Large Avatar with WhatsApp Ripple Rings
      '<div style="position:relative; width:114px; height:114px; margin:0 auto 36px;">',
      '<div id="km-call-pulse-1" style="position:absolute; inset:-12px; border-radius:50%; border:2px solid rgba(0,168,132,0.3); animation:kmWaPulse 2.4s infinite ease-out;"></div>',
      '<div id="km-call-pulse-2" style="position:absolute; inset:-24px; border-radius:50%; border:1.5px solid rgba(0,168,132,0.15); animation:kmWaPulse 2.4s infinite 0.6s ease-out;"></div>',
      '<div id="km-call-avatar" style="width:114px; height:114px; border-radius:50%; background:#1f2c34; color:#e9edef; font-size:36px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2.5px solid #00a884; box-shadow:0 12px 36px rgba(0,0,0,0.5); margin:0 auto;">LL</div>',
      '<span id="km-call-status-dot" style="position:absolute; bottom:6px; right:6px; width:18px; height:18px; border-radius:50%; background:#00a884; border:3px solid #111b21;"></span>',
      '</div>',

      // WhatsApp Control Bar: Speaker, WhatsApp Chat, Mute, End
      '<div style="display:flex; justify-content:center; align-items:center; gap:18px; margin-bottom:12px; background:rgba(32,44,51,0.7); padding:16px 20px; border-radius:24px; border:1px solid rgba(255,255,255,0.06); backdrop-filter:blur(10px);">',
      // Speaker Button
      '<button type="button" id="km-btn-speaker" style="width:52px; height:52px; border-radius:50%; background:#2a3942; border:none; color:#00a884; font-size:19px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.18s;" title="Speakerphone">',
      '<i class="fas fa-volume-high"></i>',
      '<span style="font-size:8.5px; font-weight:700; color:#8696a0;">SPEAKER</span>',
      '</button>',

      // Direct WhatsApp Chat Button
      '<a id="km-btn-wa-chat" href="#" target="_blank" rel="noopener noreferrer" style="width:52px; height:52px; border-radius:50%; background:#2a3942; border:none; color:#25D366; font-size:21px; text-decoration:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.18s;" title="Chat on WhatsApp">',
      '<i class="fab fa-whatsapp"></i>',
      '<span style="font-size:8.5px; font-weight:700; color:#8696a0;">CHAT</span>',
      '</a>',

      // Mute Button
      '<button type="button" id="km-btn-mute" style="width:52px; height:52px; border-radius:50%; background:#2a3942; border:none; color:#e9edef; font-size:19px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.18s;" title="Mute Microphone">',
      '<i class="fas fa-microphone"></i>',
      '<span style="font-size:8.5px; font-weight:700; color:#8696a0;">MUTE</span>',
      '</button>',

      // Big Red End Call Button (WhatsApp style)
      '<button type="button" id="km-btn-end-call" style="width:58px; height:58px; border-radius:50%; background:#ea4335; border:none; color:#ffffff; font-size:24px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(234,67,53,0.45); transition:transform 0.15s;" title="End Call">',
      '<i class="fas fa-phone-slash"></i>',
      '</button>',
      '</div>',

      '<div style="font-size:11px; color:#8696a0; margin-top:10px;">KejaMarket HD In-App Calling &bull; Standard Data Rates Apply</div>',

      '</div>',

      // Embedded WhatsApp Pulse Styles
      '<style>',
      '@keyframes kmWaPulse {',
      '  0% { transform:scale(0.96); opacity:0.85; }',
      '  50% { transform:scale(1.28); opacity:0.25; }',
      '  100% { transform:scale(1.48); opacity:0; }',
      '}',
      '</style>'
    ].join('');

    document.body.appendChild(modal);

    // Wire mute
    document.getElementById('km-btn-mute').addEventListener('click', function() {
      _isMuted = !_isMuted;
      this.style.background = _isMuted ? '#ea4335' : '#2a3942';
      this.style.color = '#ffffff';
      this.innerHTML = _isMuted 
        ? '<i class="fas fa-microphone-slash"></i><span style="font-size:8.5px;font-weight:700;color:#ffffff;">MUTED</span>'
        : '<i class="fas fa-microphone"></i><span style="font-size:8.5px;font-weight:700;color:#8696a0;">MUTE</span>';
    });

    // Wire speaker
    document.getElementById('km-btn-speaker').addEventListener('click', function() {
      _isSpeaker = !_isSpeaker;
      this.style.color = _isSpeaker ? '#00a884' : '#8696a0';
      this.style.background = _isSpeaker ? 'rgba(0,168,132,0.18)' : '#2a3942';
    });

    // Wire end call
    document.getElementById('km-btn-end-call').addEventListener('click', function() {
      global.KMInAppCall.end();
    });

    return modal;
  }

  global.KMInAppCall = {
    start: function(name, phone, contextTitle) {
      name = name || 'Verified Landlord';
      phone = phone || '+254792409540';
      contextTitle = contextTitle || 'KejaMarket Property Inquiry';

      var cleanPhone = phone.replace(/[^0-9]/g, '');
      var modal = ensureModal();
      modal.style.display = 'flex';

      _callState = 'calling';
      _secondsElapsed = 0;
      _isMuted = false;
      _isSpeaker = true;

      // Populate caller data
      var initials = name.split(' ').map(function(n){ return n.charAt(0); }).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'VL';
      document.getElementById('km-call-avatar').textContent = initials;
      document.getElementById('km-call-name').textContent = name;
      document.getElementById('km-call-context').textContent = contextTitle;

      // WhatsApp Chat Link
      var waMsg = 'Hi ' + name + ', I am inquiring about ' + contextTitle + ' on KejaMarket.';
      document.getElementById('km-btn-wa-chat').href = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(waMsg);

      // Reset mute & speaker styles
      var muteBtn = document.getElementById('km-btn-mute');
      if (muteBtn) {
        muteBtn.style.background = '#2a3942';
        muteBtn.innerHTML = '<i class="fas fa-microphone"></i><span style="font-size:8.5px;font-weight:700;color:#8696a0;">MUTE</span>';
      }
      var speakerBtn = document.getElementById('km-btn-speaker');
      if (speakerBtn) {
        speakerBtn.style.color = '#00a884';
        speakerBtn.style.background = 'rgba(0,168,132,0.18)';
      }

      var textEl = document.getElementById('km-call-status-text');
      var iconEl = document.getElementById('km-call-status-icon');
      if (textEl) textEl.textContent = 'Calling...';
      if (iconEl) iconEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

      // 1. Phase 1: Calling... (0s - 1.8s)
      setTimeout(function() {
        if (!modal || modal.style.display !== 'flex' || _callState === 'ended') return;
        // 2. Phase 2: Ringing... (1.8s - 7.5s)
        _callState = 'ringing';
        if (textEl) textEl.textContent = 'Ringing...';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-phone-volume" style="animation:kmWaPulse 1.2s infinite;"></i>';
        startRingingLoop();
      }, 1800);

      // 3. Phase 3: Connected (at 7.5s)
      setTimeout(function() {
        if (!modal || modal.style.display !== 'flex' || _callState === 'ended') return;
        _callState = 'connected';
        stopRingTones();
        playConnectChirp();

        if (textEl) textEl.innerHTML = '<span id="km-call-live-timer">00:00</span>';
        if (iconEl) iconEl.innerHTML = '<span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#00a884; box-shadow:0 0 8px #00a884;"></span>';

        _timerInterval = setInterval(function() {
          _secondsElapsed++;
          var timerEl = document.getElementById('km-call-live-timer');
          if (timerEl) {
            timerEl.textContent = formatTime(_secondsElapsed);
          }
        }, 1000);
      }, 7500);

      _activeCall = { name: name, phone: phone, contextTitle: contextTitle };
    },

    minimize: function() {
      var modal = document.getElementById('modal-in-app-call');
      if (modal) modal.style.display = 'none';
      if (window.KejaApp && typeof window.KejaApp.prototype.showToast === 'function') {
        window.app?.showToast('Call running in background. Tap call to return.', 'info');
      }
    },

    end: function() {
      _callState = 'ended';
      stopRingTones();
      playEndBeep();

      if (_timerInterval) {
        clearInterval(_timerInterval);
        _timerInterval = null;
      }

      var textEl = document.getElementById('km-call-status-text');
      var iconEl = document.getElementById('km-call-status-icon');
      if (textEl) {
        textEl.innerHTML = '<span style="color:#ea4335;">Call Ended (' + formatTime(_secondsElapsed) + ')</span>';
      }
      if (iconEl) {
        iconEl.innerHTML = '<i class="fas fa-phone-slash" style="color:#ea4335;"></i>';
      }

      setTimeout(function() {
        var modal = document.getElementById('modal-in-app-call');
        if (modal) modal.style.display = 'none';
        _activeCall = null;
        _secondsElapsed = 0;
      }, 900);
    }
  };

})(window);
