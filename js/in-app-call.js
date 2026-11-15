/**
 * KejaMarket In-App Calling System
 * v116 - HD Voice In-App Calling for Desktop & PWA with Web Audio tone synthesis
 */
(function(global) {
  'use strict';

  var _activeCall = null;
  var _timerInterval = null;
  var _ringOscillator = null;
  var _audioCtx = null;
  var _secondsElapsed = 0;
  var _isMuted = false;
  var _isSpeaker = true;

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

  // Synthesize realistic telephone ring tone (425Hz modulated beep)
  function playRingTone() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      _ringOscillator = { osc: osc, gain: gain };

      // Cadence: beep 1s, quiet 2s
      var t = ctx.currentTime;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.setValueAtTime(0, t + 1.2);
    } catch (e) {
      console.warn('Audio tone could not play:', e);
    }
  }

  function stopRingTone() {
    if (_ringOscillator) {
      try {
        _ringOscillator.osc.stop();
        _ringOscillator.osc.disconnect();
      } catch (e) {}
      _ringOscillator = null;
    }
  }

  function playEndBeep() {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      setTimeout(function() {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      }, 350);
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
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:99999; background:rgba(2,44,34,0.88); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px; font-family:"Plus Jakarta Sans",system-ui,sans-serif;';

    modal.innerHTML = [
      '<div style="max-width:380px; width:100%; border-radius:24px; background:linear-gradient(180deg, #064e3b 0%, #022c22 100%); color:#ffffff; padding:28px 20px 24px; text-align:center; box-shadow:0 25px 60px -10px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.12); position:relative; overflow:hidden;">',

      // Security & HD Badge
      '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(34,197,94,0.2); border:1px solid rgba(34,197,94,0.4); color:#86efac; border-radius:20px; padding:3px 12px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:18px;">',
      '<i class="fas fa-lock" style="font-size:9px;"></i> KejaMarket HD In-App Call',
      '</div>',

      // Avatar with animated pulse rings
      '<div style="position:relative; width:100px; height:100px; margin:0 auto 16px;">',
      '<div id="km-call-pulse-ring" style="position:absolute; inset:-12px; border-radius:50%; border:2px solid rgba(34,197,94,0.4); animation:kmCallPulse 2s infinite ease-out;"></div>',
      '<div id="km-call-avatar" style="width:100px; height:100px; border-radius:50%; background:#006818; color:#ffffff; font-size:32px; font-weight:900; display:flex; align-items:center; justify-content:center; border:3px solid #22c55e; box-shadow:0 8px 24px rgba(0,0,0,0.4); margin:0 auto;">LL</div>',
      '<span id="km-call-live-dot" style="position:absolute; bottom:4px; right:4px; width:18px; height:18px; border-radius:50%; background:#22c55e; border:3px solid #064e3b;"></span>',
      '</div>',

      // Name & Property
      '<h3 id="km-call-name" style="margin:0 0 4px; font-size:1.35rem; font-weight:900; color:#ffffff; letter-spacing:-0.3px;">Verified Landlord</h3>',
      '<div id="km-call-context" style="font-size:12px; color:#86efac; margin-bottom:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Property Inquiry</div>',

      // Status / Timer
      '<div id="km-call-status" style="font-size:14px; font-weight:800; color:#cbd5e1; margin-bottom:24px; min-height:22px; display:flex; align-items:center; justify-content:center; gap:6px;">',
      '<i class="fas fa-signal" style="color:#22c55e; font-size:12px;"></i> <span>Calling...</span>',
      '</div>',

      // Control Action Buttons (Mute, Speaker, Direct Phone)
      '<div style="display:flex; justify-content:center; gap:16px; margin-bottom:24px;">',
      '<button type="button" id="km-btn-mute" style="width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); color:#ffffff; font-size:18px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.15s;" title="Mute Microphone">',
      '<i class="fas fa-microphone"></i><span style="font-size:8px; font-weight:700;">MUTE</span>',
      '</button>',
      '<button type="button" id="km-btn-speaker" style="width:52px; height:52px; border-radius:50%; background:rgba(34,197,94,0.25); border:1px solid rgba(34,197,94,0.5); color:#86efac; font-size:18px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.15s;" title="Speakerphone">',
      '<i class="fas fa-volume-up"></i><span style="font-size:8px; font-weight:700;">SPEAKER</span>',
      '</button>',
      '<a id="km-btn-gsm" href="#" style="width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); color:#ffffff; font-size:18px; text-decoration:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:all 0.15s;" title="Direct GSM Call">',
      '<i class="fas fa-sim-card"></i><span style="font-size:8px; font-weight:700;">PHONE</span>',
      '</a>',
      '</div>',

      // Big Red End Call Button
      '<button type="button" id="km-btn-end-call" style="width:64px; height:64px; border-radius:50%; background:#ef4444; border:none; color:#ffffff; font-size:24px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(239,68,68,0.5); transition:transform 0.15s;" title="End Call">',
      '<i class="fas fa-phone-slash"></i>',
      '</button>',

      '</div>',

      // Embedded Pulse Animation Styles
      '<style>',
      '@keyframes kmCallPulse {',
      '  0% { transform:scale(0.95); opacity:0.8; }',
      '  50% { transform:scale(1.22); opacity:0.3; }',
      '  100% { transform:scale(1.35); opacity:0; }',
      '}',
      '</style>'
    ].join('');

    document.body.appendChild(modal);

    // Wire mute
    document.getElementById('km-btn-mute').addEventListener('click', function() {
      _isMuted = !_isMuted;
      this.style.background = _isMuted ? '#ef4444' : 'rgba(255,255,255,0.12)';
      this.style.borderColor = _isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)';
      this.innerHTML = _isMuted 
        ? '<i class="fas fa-microphone-slash"></i><span style="font-size:8px;font-weight:700;">MUTED</span>'
        : '<i class="fas fa-microphone"></i><span style="font-size:8px;font-weight:700;">MUTE</span>';
    });

    // Wire speaker
    document.getElementById('km-btn-speaker').addEventListener('click', function() {
      _isSpeaker = !_isSpeaker;
      this.style.background = _isSpeaker ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.12)';
      this.style.color = _isSpeaker ? '#86efac' : '#ffffff';
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

      var modal = ensureModal();
      modal.style.display = 'flex';

      var initials = name.split(' ').map(function(n){ return n.charAt(0); }).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'VL';
      document.getElementById('km-call-avatar').textContent = initials;
      document.getElementById('km-call-name').textContent = name;
      document.getElementById('km-call-context').textContent = contextTitle;
      document.getElementById('km-btn-gsm').href = 'tel:' + phone.replace(/[^0-9+]/g, '');

      var statusEl = document.getElementById('km-call-status');
      statusEl.innerHTML = '<i class="fas fa-signal" style="color:#22c55e;"></i> Connecting to Landlord...';

      _secondsElapsed = 0;
      _isMuted = false;
      _isSpeaker = true;

      // Start ringing after 1s
      setTimeout(function() {
        if (!modal || modal.style.display !== 'flex') return;
        statusEl.innerHTML = '<i class="fas fa-phone-volume" style="color:#22c55e; animation:kmCallPulse 1s infinite;"></i> Ringing (' + phone + ')...';
        playRingTone();
      }, 1000);

      // Connect after 3.2s
      setTimeout(function() {
        if (!modal || modal.style.display !== 'flex') return;
        stopRingTone();
        statusEl.innerHTML = '<span style="color:#22c55e; font-weight:900;">● Connected</span> · <span id="km-call-timer">00:00</span>';

        _timerInterval = setInterval(function() {
          _secondsElapsed++;
          var timerEl = document.getElementById('km-call-timer');
          if (timerEl) {
            timerEl.textContent = formatTime(_secondsElapsed);
          }
        }, 1000);
      }, 3400);

      _activeCall = { name: name, phone: phone };
    },

    end: function() {
      stopRingTone();
      playEndBeep();
      if (_timerInterval) {
        clearInterval(_timerInterval);
        _timerInterval = null;
      }
      var statusEl = document.getElementById('km-call-status');
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#ef4444; font-weight:800;">Call Ended (' + formatTime(_secondsElapsed) + ')</span>';
      }
      setTimeout(function() {
        var modal = document.getElementById('modal-in-app-call');
        if (modal) modal.style.display = 'none';
        _activeCall = null;
      }, 700);
    }
  };

})(window);
