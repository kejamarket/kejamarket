/**
 * KejaMarket Social Share & Deep Linking Card System
 * v116 - Generates rich social media preview cards (FB, Instagram, TikTok, WhatsApp, X)
 * and enables 1-tap deep links that open exact properties with seamless browsing.
 */
(function(global) {
  'use strict';

  function fmt(n) {
    return Number(n || 0).toLocaleString();
  }

  function e(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getBaseUrl() {
    return (window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : 'https://kejamarket.co.ke';
  }

  function ensureModal() {
    var modal = document.getElementById('km-modal-share-card');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'km-modal-share-card';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:100000; background:rgba(15,23,42,0.7); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:16px; font-family:"Plus Jakarta Sans",system-ui,sans-serif;';

    modal.innerHTML = [
      '<div style="max-width:500px; width:100%; border-radius:20px; background:#ffffff; box-shadow:0 25px 60px -12px rgba(0,0,0,0.35); overflow:hidden; display:flex; flex-direction:column; border:1px solid #e2e8f0;">',

      // Modal Header
      '<div style="padding:14px 18px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; background:#ffffff;">',
      '<div style="display:flex; align-items:center; gap:8px;">',
      '<div style="width:32px; height:32px; border-radius:50%; background:#f0fdf4; color:#006818; display:flex; align-items:center; justify-content:center; font-size:14px;"><i class="fas fa-share-alt"></i></div>',
      '<h3 style="margin:0; font-size:1.05rem; font-weight:800; color:#0f172a;">Share Listing</h3>',
      '</div>',
      '<button type="button" id="km-share-close-btn" style="background:#f1f5f9; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; font-size:16px; line-height:1;">&times;</button>',
      '</div>',

      // Modal Body
      '<div style="padding:18px 20px; overflow-y:auto; max-height:80vh;">',

      // Sub-label
      '<div style="font-size:11.5px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">',
      'Social Preview Card (FB, Insta, TikTok, WhatsApp)',
      '</div>',

      // ── THE EXACT CARD PREVIEW (matching user mock) ──
      '<div id="km-share-card-preview" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px; padding:12px; display:flex; gap:12px; align-items:center; box-shadow:0 4px 14px rgba(0,0,0,0.06); margin-bottom:16px; transition:transform 0.15s ease;">',
      '<img id="km-share-thumb" src="" alt="Property" style="width:82px; height:82px; border-radius:12px; object-fit:cover; flex-shrink:0; background:#f1f5f9;">',
      '<div style="flex:1; min-width:0;">',
      '<div id="km-share-title" style="font-size:1.05rem; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;">Property Title</div>',
      '<div id="km-share-location" style="font-size:11.5px; color:#475569; display:flex; align-items:center; gap:4px; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">',
      '<i class="fas fa-map-marker-alt" style="color:#00b53f; font-size:11px; flex-shrink:0;"></i> <span id="km-share-loc-text">Location</span>',
      '</div>',
      '<div id="km-share-price" style="font-size:1.15rem; font-weight:900; color:#00b53f; line-height:1.2; margin-bottom:2px;">KSh 0 / month</div>',
      '<div id="km-share-specs" style="font-size:11px; color:#94a3b8; font-weight:600;">0 Bed &middot; 1 Bath &middot; Water &middot; Parking</div>',
      '</div>',
      '</div>',

      // Explanatory note
      '<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:8px 12px; font-size:11.5px; color:#166534; margin-bottom:16px; display:flex; align-items:center; gap:8px;">',
      '<i class="fas fa-check-circle" style="color:#006818; font-size:13px; flex-shrink:0;"></i>',
      '<span>Recipients tap this card to view this exact house, then seamlessly browse more listings!</span>',
      '</div>',

      // Direct Link Input with Copy button
      '<div style="margin-bottom:18px;">',
      '<label style="display:block; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px;">Direct Share Link</label>',
      '<div style="display:flex; gap:6px;">',
      '<input type="text" id="km-share-link-input" readonly style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #cbd5e1; background:#f8fafc; font-size:12px; color:#0f172a; font-family:monospace; outline:none;" value="">',
      '<button type="button" id="km-share-copy-btn" style="background:#006818; color:#ffffff; border:none; border-radius:10px; padding:0 16px; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; flex-shrink:0; transition:background 0.15s;">',
      '<i class="fas fa-copy"></i> <span id="km-share-copy-text">Copy</span>',
      '</button>',
      '</div>',
      '</div>',

      // ── 1-CLICK SOCIAL CHANNELS ──
      '<div style="font-size:11.5px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">',
      'Share Directly to Social Apps',
      '</div>',

      '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:12px;">',

      // WhatsApp
      '<a id="km-share-wa-btn" href="#" target="_blank" rel="noopener noreferrer" style="background:#25D366; color:#ffffff; text-decoration:none; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; box-shadow:0 3px 8px rgba(37,211,102,0.25); transition:transform 0.15s;">',
      '<i class="fab fa-whatsapp" style="font-size:22px;"></i><span>WhatsApp</span>',
      '</a>',

      // Facebook
      '<a id="km-share-fb-btn" href="#" target="_blank" rel="noopener noreferrer" style="background:#1877F2; color:#ffffff; text-decoration:none; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; box-shadow:0 3px 8px rgba(24,119,242,0.25); transition:transform 0.15s;">',
      '<i class="fab fa-facebook-f" style="font-size:20px;"></i><span>Facebook</span>',
      '</a>',

      // Twitter / X
      '<a id="km-share-x-btn" href="#" target="_blank" rel="noopener noreferrer" style="background:#0f172a; color:#ffffff; text-decoration:none; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; box-shadow:0 3px 8px rgba(15,23,42,0.25); transition:transform 0.15s;">',
      '<i class="fab fa-x-twitter" style="font-size:20px;"></i><span>Twitter / X</span>',
      '</a>',

      // Instagram
      '<button type="button" id="km-share-insta-btn" style="background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:#ffffff; border:none; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; cursor:pointer; box-shadow:0 3px 8px rgba(220,39,67,0.25); transition:transform 0.15s;">',
      '<i class="fab fa-instagram" style="font-size:22px;"></i><span>Instagram</span>',
      '</button>',

      // TikTok
      '<button type="button" id="km-share-tiktok-btn" style="background:#010101; color:#ffffff; border:1px solid #334155; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; cursor:pointer; box-shadow:0 3px 8px rgba(0,0,0,0.3); transition:transform 0.15s;">',
      '<i class="fab fa-tiktok" style="font-size:20px; color:#00f2fe;"></i><span>TikTok</span>',
      '</button>',

      // Telegram
      '<a id="km-share-tg-btn" href="#" target="_blank" rel="noopener noreferrer" style="background:#229ED9; color:#ffffff; text-decoration:none; border-radius:12px; padding:12px 8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:12px; box-shadow:0 3px 8px rgba(34,158,217,0.25); transition:transform 0.15s;">',
      '<i class="fab fa-telegram-plane" style="font-size:22px;"></i><span>Telegram</span>',
      '</a>',

      '</div>',

      // Native share button (if supported)
      '<button type="button" id="km-share-native-btn" style="display:none; width:100%; background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:10px; font-size:12.5px; font-weight:700; color:#1e293b; cursor:pointer; align-items:center; justify-content:center; gap:6px;">',
      '<i class="fas fa-ellipsis-h"></i> More Sharing Options (SMS, Email, More Apps)',
      '</button>',

      '</div>', // end body
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    // Wire close
    document.getElementById('km-share-close-btn').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', function(evt) {
      if (evt.target === modal) modal.style.display = 'none';
    });

    return modal;
  }

  global.KMShareCard = {
    open: function(propOrId) {
      var p = propOrId;
      if (typeof p === 'string') {
        if (window.app && Array.isArray(window.app.properties)) {
          p = window.app.properties.find(function(item){ return item.id === propOrId; });
        }
        if (!p && window.State && Array.isArray(window.State.properties)) {
          p = window.State.properties.find(function(item){ return item.id === propOrId; });
        }
        if (!p && window.SEED_PROPERTIES && Array.isArray(window.SEED_PROPERTIES)) {
          p = window.SEED_PROPERTIES.find(function(item){ return item.id === propOrId; });
        }
      }
      if (!p && window.app && window.app.selectedPropertyForDetail) {
        p = window.app.selectedPropertyForDetail;
      }
      if (!p) {
        console.warn('KMShareCard: No property provided to share');
        return;
      }

      var modal = ensureModal();
      modal.style.display = 'flex';

      var baseUrl = getBaseUrl();
      var shareUrl = baseUrl + '/?prop=' + encodeURIComponent(p.id);

      var rentVal = Number(p.rentKes || p.price || 0);
      var period = p.rentPeriod || (p.isBnb ? 'night' : 'month');
      var areaText = p.exactLocation || p.estateSuburb || p.county || 'Nairobi';
      var thumbUrl = (p.media && p.media[0] && (p.media[0].url || p.media[0])) 
        || (p.photos && p.photos[0] && (p.photos[0].url || p.photos[0]))
        || p.thumbnail 
        || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';

      var beds = Number(p.bedrooms ?? 0);
      var baths = Number(p.bathrooms ?? 1);
      var specsText = beds + ' Bed · ' + baths + ' Bath · WiFi · Parking';

      // Populate preview card
      var thumbEl = document.getElementById('km-share-thumb');
      var titleEl = document.getElementById('km-share-title');
      var locTextEl = document.getElementById('km-share-loc-text');
      var priceEl = document.getElementById('km-share-price');
      var specsEl = document.getElementById('km-share-specs');
      var inputEl = document.getElementById('km-share-link-input');

      if (thumbEl) thumbEl.src = thumbUrl;
      if (titleEl) titleEl.textContent = p.title || 'bedsitter';
      if (locTextEl) locTextEl.textContent = areaText + ', Nairobi / Machakos / Kajiado';
      if (priceEl) priceEl.textContent = 'KSh ' + fmt(rentVal) + ' / ' + period;
      if (specsEl) specsEl.textContent = specsText;
      if (inputEl) inputEl.value = shareUrl;

      // WhatsApp text: authentic Kenyan house hunter format
      var waMsg = [
        '*' + (p.title || 'Rental House') + '*',
        '📍 ' + areaText,
        '💰 *KSh ' + fmt(rentVal) + ' / ' + period + '*',
        '🛏️ ' + specsText,
        '🛡️ 100% Free Viewings Guaranteed on KejaMarket',
        '',
        '👉 *Tap here to view exact photos, location & details:*',
        shareUrl,
        '',
        '_(Then browse 150+ more verified houses in Nairobi & environs)_'
      ].join('\n');

      var waBtn = document.getElementById('km-share-wa-btn');
      if (waBtn) waBtn.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(waMsg);

      var fbBtn = document.getElementById('km-share-fb-btn');
      if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);

      var xBtn = document.getElementById('km-share-x-btn');
      if (xBtn) xBtn.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Check out this verified listing on KejaMarket: ' + p.title + ' in ' + areaText + ' (KSh ' + fmt(rentVal) + '/' + period + ')') + '&url=' + encodeURIComponent(shareUrl) + '&hashtags=KejaMarket,HouseHuntingKenya,NairobiRentals';

      var tgBtn = document.getElementById('km-share-tg-btn');
      if (tgBtn) tgBtn.href = 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(p.title + ' in ' + areaText + ' - KSh ' + fmt(rentVal) + '/' + period);

      // Copy Button
      var copyBtn = document.getElementById('km-share-copy-btn');
      var copyText = document.getElementById('km-share-copy-text');
      if (copyBtn) {
        copyBtn.onclick = function() {
          navigator.clipboard.writeText(shareUrl).then(function() {
            if (copyText) copyText.textContent = 'Copied!';
            copyBtn.style.background = '#15803d';
            setTimeout(function() {
              if (copyText) copyText.textContent = 'Copy';
              copyBtn.style.background = '#006818';
            }, 2000);
          }).catch(function() {
            inputEl.select();
            document.execCommand('copy');
            if (copyText) copyText.textContent = 'Copied!';
          });
        };
      }

      // Instagram Button: copies captioned link and guides user
      var instaBtn = document.getElementById('km-share-insta-btn');
      if (instaBtn) {
        instaBtn.onclick = function() {
          var instaText = p.title + ' in ' + areaText + ' (KSh ' + fmt(rentVal) + '/' + period + ')\nView on KejaMarket: ' + shareUrl;
          navigator.clipboard.writeText(instaText).then(function() {
            alert('✅ Listing link copied for Instagram!\n\nYou can now paste it into your Instagram Story link sticker, Bio, or Direct Message.');
          });
        };
      }

      // TikTok Button: copies captioned link and tags
      var tiktokBtn = document.getElementById('km-share-tiktok-btn');
      if (tiktokBtn) {
        tiktokBtn.onclick = function() {
          var ttText = 'Tour this house: ' + p.title + ' in ' + areaText + ' (KSh ' + fmt(rentVal) + '/' + period + ')\n' + shareUrl + '\n#KejaMarket #HouseHunting #KenyaRentals';
          navigator.clipboard.writeText(ttText).then(function() {
            alert('✅ Listing link copied for TikTok!\n\nYou can now paste it in your TikTok video caption, bio, or comment.');
          });
        };
      }

      // Native share button
      var nativeBtn = document.getElementById('km-share-native-btn');
      if (nativeBtn) {
        if (navigator.share) {
          nativeBtn.style.display = 'flex';
          nativeBtn.onclick = function() {
            navigator.share({
              title: p.title || 'KejaMarket Listing',
              text: 'Check out this rental on KejaMarket: ' + p.title + ' in ' + areaText + ' (KSh ' + fmt(rentVal) + '/' + period + ')',
              url: shareUrl
            }).catch(function(){});
          };
        } else {
          nativeBtn.style.display = 'none';
        }
      }
    }
  };

})(window);
