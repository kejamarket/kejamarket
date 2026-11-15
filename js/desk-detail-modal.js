/**
 * KejaMarket Desktop Detail Modal - PWA Parity
 * v116 - Renders the full PWA-style property detail inside the desktop modal
 */
(function(global) {
  'use strict';

  function fmt(n) {
    return Number(n || 0).toLocaleString();
  }

  function getBadge(p) {
    var c = (p.category || '').toLowerCase();
    var t = (p.title || '').toLowerCase();
    var beds = Number(p.bedrooms || 1);
    if (c.includes('single') || t.includes('single room')) return {label:'Single Room', icon:'fa-door-open', color:'#0284c7'};
    if (c.includes('double') || t.includes('double room')) return {label:'Double Room', icon:'fa-person-booth', color:'#ea580c'};
    if (c.includes('bedsit') || t.includes('bedsit')) return {label:'Bedsitter', icon:'fa-bed', color:'#10b981'};
    if (c.includes('studio') || t.includes('studio')) return {label:'Studio', icon:'fa-couch', color:'#06b6d4'};
    if (beds === 1 || c.includes('1 bed') || t.includes('1 bed')) return {label:'1 Bedroom', icon:'fa-door-open', color:'#059669'};
    if (beds === 2 || c.includes('2 bed') || t.includes('2 bed')) return {label:'2 Bedrooms', icon:'fa-door-closed', color:'#ef4444'};
    if (beds === 3 || c.includes('3 bed') || t.includes('3 bed')) return {label:'3 Bedrooms', icon:'fa-home', color:'#2563eb'};
    if (beds >= 4 || c.includes('4 bed') || t.includes('4 bed')) return {label:'4+ Bedrooms', icon:'fa-star', color:'#6366f1'};
    if (c.includes('maisonette') || t.includes('maisonette')) return {label:'Maisonette', icon:'fa-building', color:'#db2777'};
    if (c.includes('villa') || t.includes('villa')) return {label:'Villa', icon:'fa-tree', color:'#006818'};
    if (c.includes('bnb') || c.includes('airbnb') || p.isBnb) return {label:'BnB / Stay', icon:'fa-umbrella-beach', color:'#8b5cf6'};
    if (c.includes('commercial') || t.includes('shop') || t.includes('office')) return {label:'Commercial', icon:'fa-store', color:'#475569'};
    if (c.includes('land') || c.includes('plot')) return {label:'Land & Plots', icon:'fa-map-marked-alt', color:'#854d0e'};
    return {label:'Apartment', icon:'fa-city', color:'#ec4899'};
  }

  function e(str) {
    // HTML-encode for attributes
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  global.KMDeskDetail = {
    _map: null,

    build: function(p, coords, propsArr, openChatFn, requestViewingFn) {
      var isBnb = p.isBnb || (p.category||'').includes('BnB') || p.rentPeriod === 'night';
      var landlordName = (p.landlord && p.landlord.name) || p.landlordName || p.owner_name || 'Verified Landlord';
      var landlordInitials = landlordName.split(' ').map(function(n){return n.charAt(0);}).filter(Boolean).slice(0,2).join('').toUpperCase() || 'VL';
      var phone = (p.landlord && p.landlord.phone) || p.phone || p.contactPhone || '+254112377651';
      var wa = (p.landlord && p.landlord.whatsapp) || p.whatsapp || phone;
      var cleanWa = wa.replace(/[^0-9]/g, '');
      var period = p.rentPeriod || (isBnb ? 'night' : 'mo');
      var rent = Number(p.rentKes || p.price || 0);
      var deposit = Number(p.depositKes || p.deposit || rent);
      var totalMoveIn = isBnb ? rent : (rent + deposit);
      var badge = getBadge(p);
      var areaStr = p.estateSuburb || p.county || 'Nairobi';

      var media = (p.media && p.media.length) ? p.media : [{url: p.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', caption: p.title}];

      var depositLabel = p.depositKes ? ('KSh ' + fmt(p.depositKes)) : '1 Month';
      var depositStr = isBnb ? 'KSh 0 (No Deposit)' : 'KSh ' + fmt(deposit);
      var sizeStr = (p.sizeSqft || p.sizeSqm || 25) + ' sqm';
      var waterStr = p.waterSupplyType || 'Borehole';
      var elecStr = p.electricityMeterType || 'Tokens';
      var descStr = e(p.description || 'Spacious, well-ventilated property in a secure gated estate. Includes token electricity meter, ample parking, borehole water backup, and perimeter electric fence.');
      var schedText = isBnb ? 'Free to request &middot; 60s Host SLA &middot; Daily &amp; Hourly Bookings'
        : 'Free to request &middot; 60s Caretaker SLA &middot; 100% Free Viewing Request &middot; Instant Confirmation';

      // WhatsApp text
      var waText = 'Hi ' + landlordName + ', I saw your ' + p.title + ' in ' + (p.estateSuburb || 'Nairobi') + ' (KSh ' + fmt(rent) + ') on KejaMarket. Is it available for viewing?';
      var waLink = 'https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(waText);
      var gMapsLink = 'https://www.google.com/maps/dir/?api=1&destination=' + coords.lat + ',' + coords.lng;

      // Amenity chips
      var am = p.amenities || {};
      var chips = [];
      if (am.hasInternet || isBnb) chips.push('<span class="km-amenity-chip"><i class="fas fa-wifi"></i> WiFi Ready</span>');
      if (am.hasParking) chips.push('<span class="km-amenity-chip"><i class="fas fa-parking"></i> Dedicated Parking</span>');
      if (am.hasCctv) chips.push('<span class="km-amenity-chip"><i class="fas fa-video"></i> CCTV &amp; Guards</span>');
      if (am.hasBalcony) chips.push('<span class="km-amenity-chip"><i class="fas fa-seedling"></i> Private Balcony</span>');
      if (am.isMasterEnsuite) chips.push('<span class="km-amenity-chip"><i class="fas fa-bath"></i> Ensuite</span>');
      if (am.hasGym) chips.push('<span class="km-amenity-chip"><i class="fas fa-dumbbell"></i> Gym</span>');
      if (am.hasSwimmingPool) chips.push('<span class="km-amenity-chip"><i class="fas fa-swimming-pool"></i> Pool</span>');
      chips.push('<span class="km-amenity-chip"><i class="fas fa-tint"></i> Borehole Water 24/7</span>');
      chips.push('<span class="km-amenity-chip"><i class="fas fa-door-closed"></i> Gated Community</span>');

      // Similar listings (use data-id, wire clicks after render)
      var similar = (propsArr || []).filter(function(x){return x.id !== p.id && (x.estateSuburb === p.estateSuburb || x.category === p.category);}).slice(0,4);
      if (!similar.length) similar = (propsArr || []).filter(function(x){return x.id !== p.id;}).slice(0,4);
      var simHtml = similar.map(function(rel) {
        var thumb = (rel.media && rel.media[0] && rel.media[0].url) || rel.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';
        var price2 = Number(rel.rentKes || rel.price || 0);
        return [
          '<div class="km-similar-card" data-propid="', e(rel.id), '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;cursor:pointer;">',
          '<img src="', e(thumb), '" alt="', e(rel.title), '" style="width:100%;height:100px;object-fit:cover;">',
          '<div style="padding:8px;">',
          '<div style="font-size:0.9rem;font-weight:800;color:#006818;">KSh ', fmt(price2), '/mo</div>',
          '<div style="font-size:0.8rem;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">', e(rel.title), '</div>',
          '<div style="font-size:0.72rem;color:#64748b;"><i class="fas fa-map-marker-alt"></i> ', e(rel.estateSuburb || rel.county || 'Nairobi'), '</div>',
          '</div></div>'
        ].join('');
      }).join('');

      // Thumbnail strip (use data-url, data-idx, wire clicks after render)
      var thumbsHtml = media.map(function(m, idx) {
        return '<img src="' + e(m.url) + '" class="km-detail-thumb ' + (idx===0?'active':'') + '" data-url="' + e(m.url) + '" data-idx="' + (idx+1) + '" data-total="' + media.length + '">';
      }).join('');

      var html = [
        '<div class="km-detail-screen km-desk-detail-screen">',

        // CAROUSEL
        '<div class="km-detail-carousel" id="km-desk-carousel-box" style="position:relative;overflow:hidden;border-radius:12px 12px 0 0;max-height:340px;">',
        '<img id="km-desk-hero-img" src="', e(media[0].url), '" alt="', e(p.title), '" style="width:100%;height:340px;object-fit:cover;display:block;">',
        '<span style="position:absolute;top:12px;left:12px;z-index:4;background:', badge.color, ';color:#fff;font-weight:800;font-size:11px;padding:4px 10px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:inline-flex;align-items:center;gap:5px;"><i class="fas ', badge.icon, '"></i> ', badge.label, '</span>',
        '<div style="position:absolute;top:12px;right:12px;z-index:4;background:rgba(0,0,0,0.65);color:#fff;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;"><i class="fas fa-camera"></i> <span id="km-desk-photo-cur">1</span> / ', media.length, '</div>',
        '</div>',

        // THUMBNAILS
        '<div class="km-detail-thumbs" id="km-desk-thumbs-strip" style="display:flex;gap:6px;padding:8px 0 4px;overflow-x:auto;">', thumbsHtml, '</div>',

        // CONTENT
        '<div class="km-detail-content" style="padding:14px 16px 100px;">',

        // Price row
        '<div class="km-detail-price-row">',
        '<div class="km-detail-price">KSh ', fmt(rent), '<span style="font-size:13px;font-weight:600;color:#64748b;">/', period, '</span></div>',
        '<span style="background:', badge.color, ';color:#fff;font-weight:800;font-size:11.5px;padding:3px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;"><i class="fas ', badge.icon, '"></i> ', badge.label, '</span>',
        '</div>',

        '<h1 class="km-detail-title" style="font-size:1.15rem;font-weight:900;color:#0f172a;margin:6px 0 4px;">', e(p.title), '</h1>',
        '<div class="km-detail-location" style="font-size:13px;color:#334155;margin-bottom:12px;"><i class="fas fa-map-marker-alt" style="color:#006818;"></i> ', e(areaStr), ' &bull; 100% Verified Location</div>',

        // VIEWING SCHEDULE BANNER
        '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:12px 14px;margin-bottom:12px;">',
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">',
        '<div><div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;"><span style="background:#006818;color:#fff;padding:2px 7px;border-radius:4px;font-size:9.5px;">VERIFIED VIEWING</span> Schedule an In-Person Viewing</div>',
        '<div style="font-size:11px;color:#166534;">', schedText, '</div></div>',
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">',
        '<button type="button" class="km-desk-walkin-btn" style="background:#006818;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;"><i class="fas fa-walking"></i> Walk-In</button>',
        '<button type="button" class="km-desk-video-btn" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;"><i class="fas fa-video"></i> Video Tour</button>',
        '</div></div></div>',

        // ZERO FEE CARD
        '<div class="km-zero-viewing-fee-card">',
        '<div class="km-zero-fee-icon"><i class="fas fa-shield-alt"></i></div>',
        '<div class="km-zero-fee-content"><div class="km-zero-fee-title"><i class="fas fa-check-circle" style="color:#006818;"></i> 100% Free Viewings Guaranteed</div>',
        '<div class="km-zero-fee-sub">KejaMarket strictly bans all viewing fees. Never send money to an agent or broker just to view this house.</div>',
        '<div style="font-size:10.5px;color:#166534;margin-top:4px;font-weight:700;"><i class="fas fa-check-double" style="color:#006818;"></i> Physical Inspection Verified &bull; Tap Water Pressure &amp; Token Meter Tested</div>',
        '</div></div>',

        // 6-CARD SPECS
        '<div class="km-specs-grid">',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-bed"></i></div><div class="km-spec-card-value">', (p.bedrooms||1), ' Bed</div><div class="km-spec-card-label">Bedrooms</div></div>',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-bath"></i></div><div class="km-spec-card-value">', (p.bathrooms||1), ' Bath</div><div class="km-spec-card-label">Bathrooms</div></div>',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-ruler-combined"></i></div><div class="km-spec-card-value">', sizeStr, '</div><div class="km-spec-card-label">Floor Area</div></div>',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-money-bill-wave"></i></div><div class="km-spec-card-value">', depositLabel, '</div><div class="km-spec-card-label">Deposit</div></div>',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-tint"></i></div><div class="km-spec-card-value">', e(waterStr), '</div><div class="km-spec-card-label">Water Supply</div></div>',
        '<div class="km-spec-card"><div class="km-spec-card-icon"><i class="fas fa-bolt"></i></div><div class="km-spec-card-value">', e(elecStr), '</div><div class="km-spec-card-label">Electricity</div></div>',
        '</div>',

        // MOVE-IN BREAKDOWN
        '<div class="km-move-in-breakdown-card">',
        '<div class="km-breakdown-header"><h4><i class="fas fa-calculator" style="color:#006818;"></i> Transparent Move-In Breakdown</h4><span class="km-breakdown-badge">Upfront Terms</span></div>',
        '<div class="km-breakdown-rows">',
        '<div class="km-breakdown-row"><span>1st Month Rent</span><strong>KSh ', fmt(rent), '</strong></div>',
        '<div class="km-breakdown-row"><span>Refundable Security Deposit</span><strong>', depositStr, '</strong></div>',
        '<div class="km-breakdown-row"><span>Water Deposit / Account</span><span class="km-row-highlight">Pre-paid Meter (KSh 0)</span></div>',
        '<div class="km-breakdown-row"><span>Electricity (KPLC Token)</span><span class="km-row-highlight">Direct Token Meter (KSh 0)</span></div>',
        '<div class="km-breakdown-row"><span>Service Charge (Garbage &amp; Security)</span><span class="km-row-highlight">Included</span></div>',
        '<div class="km-breakdown-divider"></div>',
        '<div class="km-breakdown-row km-breakdown-total"><span>Estimated Total Move-In</span><span class="km-total-amount">KSh ', fmt(totalMoveIn), '</span></div>',
        '</div></div>',

        // UTILITIES CHECKLIST
        '<div class="km-utility-card">',
        '<h4><i class="fas fa-check-double" style="color:#006818;"></i> Verified Living Quality &amp; Utilities</h4>',
        '<div class="km-utility-grid">',
        '<div class="km-util-item"><i class="fas fa-tint" style="color:#0284c7;"></i> <div><strong>24/7 Water Supply</strong><span>Borehole + Council backup</span></div></div>',
        '<div class="km-util-item"><i class="fas fa-bolt" style="color:#f59e0b;"></i> <div><strong>Private KPLC Token</strong><span>Direct paybill, private meter</span></div></div>',
        '<div class="km-util-item"><i class="fas fa-wifi" style="color:#8b5cf6;"></i> <div><strong>High-Speed Fibre</strong><span>Safaricom &amp; Faiba ready</span></div></div>',
        '<div class="km-util-item"><i class="fas fa-car" style="color:#10b981;"></i> <div><strong>Secure Parking</strong><span>Free dedicated slot inside gate</span></div></div>',
        '<div class="km-util-item"><i class="fas fa-shield-alt" style="color:#006818;"></i> <div><strong>Estate Security</strong><span>CCTV + Electric perimeter</span></div></div>',
        '<div class="km-util-item"><i class="fas fa-trash-alt" style="color:#64748b;"></i> <div><strong>Garbage Collection</strong><span>Included in service charge</span></div></div>',
        '</div></div>',

        // AMENITIES
        '<div class="km-amenities-section"><h4>Features &amp; Amenities</h4><div class="km-amenities-chips-wrap">', chips.join(''), '</div></div>',

        // DESCRIPTION
        '<div class="km-detail-description"><h4>Description</h4><p>', descStr, '</p></div>',

        // MAP
        '<div class="km-detail-map-box">',
        '<div class="km-detail-map-header">',
        '<div><div class="km-map-title"><i class="fas fa-map-marked-alt" style="color:#006818;"></i> Location &amp; Neighborhood Map</div>',
        '<div class="km-map-sub">', e(areaStr), ' &bull; Verified Direct Location</div></div>',
        '<a href="', gMapsLink, '" target="_blank" rel="noopener noreferrer" class="km-map-dir-btn"><i class="fas fa-directions"></i> Directions</a>',
        '</div>',
        '<div id="km-desk-detail-map" style="height:220px;border-radius:10px;overflow:hidden;"></div>',
        '<div style="color:#006818;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;margin-top:6px;"><i class="fas fa-check-circle" style="color:#006818;"></i> 100% Verified Location &amp; Direct Directions</div>',
        '</div>',

        // LANDLORD CARD
        '<div class="km-landlord-card">',
        '<div class="km-landlord-info">',
        '<div class="km-landlord-avatar" style="position:relative;">', landlordInitials,
        '<span style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid #fff;display:block;"></span></div>',
        '<div style="flex:1;">',
        '<div class="km-landlord-name">', e(landlordName), '</div>',
        '<div class="km-landlord-meta"><i class="fas fa-check-circle" style="color:#006818;"></i> Identity Verified &bull; Direct Landlord &bull; Replies fast</div>',
        '<div style="font-size:11px;color:#22c55e;margin-top:2px;font-weight:600;">&#x25CF; Online now</div>',
        '</div></div>',
        '<div class="km-comm-hub-grid">',
        '<button type="button" class="km-comm-hub-btn km-comm-chat km-desk-chat-btn"><i class="fas fa-comment-dots"></i><span>In-App Chat</span></button>',
        '<a href="', waLink, '" target="_blank" rel="noopener noreferrer" class="km-comm-hub-btn km-comm-wa"><i class="fab fa-whatsapp"></i><span>WhatsApp</span></a>',
        '<button type="button" class="km-comm-hub-btn km-comm-call km-desk-inapp-call-btn" title="HD In-App Voice Call"><i class="fas fa-phone-alt"></i><span>In-App Call</span></button>',
        '<a href="tel:', phone, '" class="km-comm-hub-btn km-comm-call" style="background:#f8fafc; color:#475569;" title="Direct GSM Call"><i class="fas fa-sim-card"></i><span>Direct Phone</span></a>',
        '<button type="button" class="km-comm-hub-btn km-comm-view km-desk-walkin-btn2"><i class="fas fa-calendar-check"></i><span>Book Viewing</span></button>',
        '<button type="button" class="km-comm-hub-btn km-comm-share km-desk-share-hub-btn" style="background:#f0fdf4; border:1px solid #86efac; color:#006818;" title="Share Listing"><i class="fas fa-share-alt"></i><span>Share House</span></button>',
        '</div></div>',

        // SAFETY TIPS
        '<div class="km-safety-tips-card">',
        '<h4><i class="fas fa-shield-alt"></i> KejaMarket Verified Safety Tips</h4>',
        '<ul><li>Do not pay any viewing fee or deposit before visiting the property in person.</li>',
        '<li>Always meet the caretaker or landlord inside the physical unit.</li>',
        '<li>Confirm tap water pressure and electricity token meters before making payment.</li></ul>',
        '</div>',

        // SIMILAR LISTINGS
        simHtml ? [
          '<div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;">',
          '<h4 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 4px;display:flex;align-items:center;gap:6px;"><i class="fas fa-home" style="color:#006818;"></i> Other Related Houses</h4>',
          '<div style="font-size:11.5px;color:#64748b;margin-bottom:10px;">Similar verified vacancies in ', e(areaStr), '</div>',
          '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">', simHtml, '</div>',
          '</div>'
        ].join('') : '',

        '</div>', // km-detail-content
        '</div>', // km-detail-screen

        // STICKY FOOTER
        '<div style="position:sticky;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e2e8f0;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:100;box-shadow:0 -2px 10px rgba(0,0,0,0.08);">',
        '<div><div style="font-size:1.1rem;font-weight:900;color:#006818;">KSh ', fmt(rent), '/', period, '</div>',
        '<div style="font-size:11px;color:#64748b;">', e(areaStr), ' &middot; ', e(p.title), '</div></div>',
        '<div style="display:flex;gap:8px;">',
        '<button type="button" class="km-desk-walkin-btn" style="background:#006818;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-walking"></i> Walk-In</button>',
        '<button type="button" class="km-desk-video-btn" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-video"></i> Video Tour</button>',
        '</div></div>'
      ].join('');

      return html;
    },

    // Wire event listeners after HTML is injected
    wireEvents: function(modalEl, p, openChatFn, requestViewingFn) {
      // Thumbnail clicks
      modalEl.querySelectorAll('#km-desk-thumbs-strip .km-detail-thumb').forEach(function(img) {
        img.addEventListener('click', function() {
          var url = this.dataset.url;
          var cur = this.dataset.idx;
          var hero = document.getElementById('km-desk-hero-img');
          if (hero) hero.src = url;
          var counter = document.getElementById('km-desk-photo-cur');
          if (counter) counter.textContent = cur;
          modalEl.querySelectorAll('#km-desk-thumbs-strip .km-detail-thumb').forEach(function(t){t.classList.remove('active');});
          img.classList.add('active');
        });
      });

      // Walk-In buttons
      modalEl.querySelectorAll('.km-desk-walkin-btn, .km-desk-walkin-btn2').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof requestViewingFn === 'function') requestViewingFn(p.id, 'walkin');
        });
      });

      // Video Tour buttons
      modalEl.querySelectorAll('.km-desk-video-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof requestViewingFn === 'function') requestViewingFn(p.id, 'video');
        });
      });

      // Chat button
      var chatBtn = modalEl.querySelector('.km-desk-chat-btn');
      if (chatBtn && typeof openChatFn === 'function') {
        chatBtn.addEventListener('click', openChatFn);
      }

      // Share button in comm hub
      var shareHubBtn = modalEl.querySelector('.km-desk-share-hub-btn');
      if (shareHubBtn) {
        shareHubBtn.addEventListener('click', function() {
          if (window.KMShareCard) window.KMShareCard.open(p);
        });
      }

      // In-App Call button
      var inAppCallBtn = modalEl.querySelector('.km-desk-inapp-call-btn');
      if (inAppCallBtn) {
        inAppCallBtn.addEventListener('click', function() {
          var lName = (p.landlord && p.landlord.name) || p.landlordName || 'Verified Landlord';
          var lPhone = (p.landlord && p.landlord.phone) || p.phone || '+254792409540';
          if (window.KMInAppCall) {
            window.KMInAppCall.start(lName, lPhone, p.title || 'KejaMarket Property Inquiry');
          } else {
            window.location.href = 'tel:' + lPhone.replace(/[^0-9+]/g, '');
          }
        });
      }

      // Similar card clicks
      modalEl.querySelectorAll('.km-similar-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var pid = this.dataset.propid;
          if (pid && window.app && typeof window.app.openPropertyDetail === 'function') {
            window.app.openPropertyDetail(pid);
          }
        });
      });
    },

    // Init Leaflet map
    initMap: function(property, coords, retryCount) {
      retryCount = retryCount || 0;
      var mapEl = document.getElementById('km-desk-detail-map');
      if (!mapEl) return;
      if (typeof L === 'undefined') {
        if (retryCount < 15) {
          setTimeout(function(){KMDeskDetail.initMap(property, coords, retryCount+1);}, 200);
        }
        return;
      }
      if (this._map) {
        try { this._map.remove(); } catch(e) {}
        this._map = null;
      }
      if (mapEl._leaflet_id) { delete mapEl._leaflet_id; mapEl.innerHTML = ''; }

      var rentText = Number(property.rentKes || property.price || 0);
      this._map = L.map('km-desk-detail-map', {
        attributionControl: false, zoomControl: true, scrollWheelZoom: false
      }).setView([coords.lat, coords.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, subdomains: ['a','b','c']
      }).addTo(this._map);

      var pinIcon = L.divIcon({
        className: 'km-leaflet-pin',
        html: '<div style="background:#006818;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2.5px solid white;font-size:14px;"><i class="fas fa-home"></i></div>',
        iconSize: [34,34], iconAnchor: [17,17]
      });

      L.marker([coords.lat, coords.lng], {icon: pinIcon}).addTo(this._map)
        .bindPopup('<b>' + (property.title||'') + '</b><br><span style="color:#006818;font-weight:800;">KSh ' + rentText.toLocaleString() + '/mo</span><br><small>' + (property.estateSuburb || coords.areaName || '') + '</small>')
        .openPopup();

      L.circle([coords.lat, coords.lng], {
        radius: 250, color: '#006818', fillColor: '#1db010', fillOpacity: 0.16, weight: 2
      }).addTo(this._map);

      setTimeout(function() {
        if (KMDeskDetail._map) KMDeskDetail._map.invalidateSize();
      }, 300);
    }
  };

})(window);
