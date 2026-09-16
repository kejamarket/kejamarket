const fs = require('fs');

console.log('--- Applying comprehensive fixes ---');

// =====================================================================
// 1. UPDATE CSS (css/style.css)
// =====================================================================
let css = fs.readFileSync('css/style.css', 'utf8');

// Update main-container and sidebar-filters
css = css.replace(
  /grid-template-columns:\s*335px\s+1fr;/g,
  'grid-template-columns: 380px 1fr;'
);

css = css.replace(
  /\.sidebar-filter-cols\s*\{[\s\S]*?grid-template-columns:\s*135px\s+1fr;[\s\S]*?\}/,
  `.sidebar-filter-cols {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: start;
}`
);

fs.writeFileSync('css/style.css', css, 'utf8');
console.log('✓ Updated css/style.css');

// =====================================================================
// 2. UPDATE LANDLORD.JS (js/landlord.js)
// =====================================================================
let landlord = fs.readFileSync('js/landlord.js', 'utf8');

// Ensure populateSelects is bulletproof
const oldPopulate = `  populateSelects() {
    // Populate Categories
    const catSelect = document.getElementById('post-category');
    if (catSelect && typeof MASTER_CATEGORIES !== 'undefined') {
      catSelect.innerHTML = MASTER_CATEGORIES.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
    }

    // Populate Corridors / Suburbs
    const suburbSelect = document.getElementById('post-suburb');
    if (suburbSelect && typeof ALL_SUBURBS !== 'undefined') {
      suburbSelect.innerHTML = ALL_SUBURBS.map(s => 
        \`<option value="\${s.name}" data-lat="\${s.lat}" data-lng="\${s.lng}" data-county="\${s.county}" data-corridor="\${s.corridorId}">
          \${s.name} (\${s.county})
        </option>\`
      ).join('');

      suburbSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        if (opt) {
          const lat = parseFloat(opt.getAttribute('data-lat'));
          const lng = parseFloat(opt.getAttribute('data-lng'));
          this.updatePostMapLocation(lat, lng);
        }
      });
    }
  }`;

const newPopulate = `  populateSelects() {
    // Populate Categories
    const catSelect = document.getElementById('post-category');
    const categories = (typeof MASTER_CATEGORIES !== 'undefined' && Array.isArray(MASTER_CATEGORIES) && MASTER_CATEGORIES.length > 0)
      ? MASTER_CATEGORIES
      : (window.MASTER_CATEGORIES || [
          'Single Room', 'Bedsitter / Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom+',
          'Maisonette / Townhouse', 'Bungalow', 'Penthouse', 'Room In Shared Apartment', 'Hostels / Student Room',
          'Conference Room / Boardroom', 'Meeting & Event Hall', 'Commercial Office / Co-Working', 'Commercial Shop / Stall',
          'BnB / Airbnb (Daily Stay)', 'Studio BnB (Short-Stay)', '1 & 2 Bedroom BnB (Furnished)', 'Luxury Villa / Vacation Stay'
        ]);

    if (catSelect) {
      catSelect.innerHTML = categories.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
    }

    // Populate Corridors / Suburbs
    const suburbSelect = document.getElementById('post-suburb');
    const suburbs = (typeof ALL_SUBURBS !== 'undefined' && Array.isArray(ALL_SUBURBS) && ALL_SUBURBS.length > 0)
      ? ALL_SUBURBS
      : (window.ALL_SUBURBS || []);

    if (suburbSelect && suburbs.length > 0) {
      suburbSelect.innerHTML = suburbs.map(s => 
        \`<option value="\${s.name}" data-lat="\${s.lat}" data-lng="\${s.lng}" data-county="\${s.county}" data-corridor="\${s.corridorId}">
          \${s.name} (\${s.county})
        </option>\`
      ).join('');

      suburbSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        if (opt) {
          const lat = parseFloat(opt.getAttribute('data-lat'));
          const lng = parseFloat(opt.getAttribute('data-lng'));
          this.updatePostMapLocation(lat, lng);
        }
      });
    }

    // Also populate native datalist for instant autocomplete
    const datalist = document.getElementById('suburb-datalist');
    if (datalist && suburbs.length > 0) {
      datalist.innerHTML = suburbs.map(s => \`<option value="\${s.name}">\${s.name} (\${s.county})</option>\`).join('');
    }
  }`;

landlord = landlord.replace(oldPopulate, newPopulate);

// Update setupSuburbAutocomplete to dynamically retrieve suburbs list
const oldSuburbAuto = /setupSuburbAutocomplete\(\) \{[\s\S]*?selectSuburb\(name, lat, lng, county, corridorId\) \{/;

const newSuburbAuto = `setupSuburbAutocomplete() {
    const searchInput = document.getElementById('post-suburb-search');
    const suggestionsDiv = document.getElementById('suburb-suggestions');
    const hiddenSelect = document.getElementById('post-suburb');

    if (!searchInput || !suggestionsDiv) return;

    const getSuburbs = () => {
      if (typeof ALL_SUBURBS !== 'undefined' && Array.isArray(ALL_SUBURBS) && ALL_SUBURBS.length > 0) return ALL_SUBURBS;
      if (window.ALL_SUBURBS && Array.isArray(window.ALL_SUBURBS) && window.ALL_SUBURBS.length > 0) return window.ALL_SUBURBS;
      if (typeof NAIROBI_REGIONS !== 'undefined' && Array.isArray(NAIROBI_REGIONS)) {
        const list = [];
        NAIROBI_REGIONS.forEach(r => (r.suburbs || []).forEach(s => list.push({ name: s, county: r.county || 'Nairobi', corridorId: r.corridorId, lat: r.lat || -1.286389, lng: r.lng || 36.817223 })));
        return list;
      }
      return [];
    };

    const handleSearch = (e) => {
      const query = (e ? e.target.value : searchInput.value || '').trim().toLowerCase();
      const allSuburbs = getSuburbs();

      if (query.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      const matches = allSuburbs.filter(s => 
        s.name.toLowerCase().includes(query) ||
        (s.county && s.county.toLowerCase().includes(query))
      ).slice(0, 15);

      if (matches.length === 0) {
        suggestionsDiv.innerHTML = \`<div style="padding: 10px 12px; color: #64748b; font-size: 0.85rem;">Using "\${searchInput.value.trim()}"</div>\`;
        suggestionsDiv.style.display = 'block';
        return;
      }

      suggestionsDiv.innerHTML = matches.map(s => \`
        <div style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;" 
             onmouseover="this.style.background='#f0fdf4'" 
             onmouseout="this.style.background='white'"
             onclick="landlordManager.selectSuburb('\${s.name.replace(/'/g, "\\\\'")}', \${s.lat}, \${s.lng}, '\${s.county}', '\${s.corridorId}')">
          <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem;">\${s.name}</div>
          <div style="font-size: 0.75rem; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 999px; font-weight: 600;">\${s.county}</div>
        </div>
      \`).join('');

      suggestionsDiv.style.display = 'block';
    };

    searchInput.removeEventListener('input', searchInput._autoHandler || (()=>{}));
    searchInput._autoHandler = handleSearch;
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', handleSearch);

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.style.display = 'none';
      }
    });
  }

  selectSuburb(name, lat, lng, county, corridorId) {`;

landlord = landlord.replace(oldSuburbAuto, newSuburbAuto);

// Fallback in form submit for suburb text
landlord = landlord.replace(
  "const suburb = document.getElementById('post-suburb')?.value || 'Kilimani';",
  "const searchVal = document.getElementById('post-suburb-search')?.value.trim() || '';\n      const suburb = (this.selectedSuburb && this.selectedSuburb.name) || document.getElementById('post-suburb')?.value || searchVal || 'Kilimani';"
);

fs.writeFileSync('js/landlord.js', landlord, 'utf8');
console.log('✓ Updated js/landlord.js');

// =====================================================================
// 3. UPDATE APP.JS (js/app.js)
// =====================================================================
let app = fs.readFileSync('js/app.js', 'utf8');

// Insert normalizeProperty helper right before openPropertyDetail
const oldOpenPropDetail = `  openPropertyDetail(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    // Normalize landlord — API listings may not have a landlord object`;

const newOpenPropDetail = `  normalizeProperty(p) {
    if (!p) return p;

    // Enrich with SEED_PROPERTIES so all 7 photos, descriptions, amenities, and contact info are available
    const seed = (typeof SEED_PROPERTIES !== 'undefined' && Array.isArray(SEED_PROPERTIES))
      ? SEED_PROPERTIES.find(s => s.id === p.id || s.title === p.title)
      : null;

    if (seed) {
      if (!p.media || !Array.isArray(p.media) || p.media.length <= 1) {
        p.media = seed.media ? seed.media.map(m => ({ ...m })) : p.media;
      }
      p.photoCount = (p.media && p.media.length > 1) ? p.media.length : (seed.photoCount || seed.media?.length || 7);
      if (!p.description || p.description.length < 20) p.description = seed.description || p.description;
      if (!p.amenities || Object.keys(p.amenities).length === 0) p.amenities = { ...(seed.amenities || {}) };
      if (!p.landlord || !p.landlord.phone) p.landlord = { ...(seed.landlord || {}), ...(p.landlord || {}) };
      if (!p.exactLocation && seed.exactLocation) p.exactLocation = seed.exactLocation;
      if (p.latitude == null && seed.latitude != null) {
        p.latitude = seed.latitude;
        p.longitude = seed.longitude;
      }
      if (!p.waterSupplyType && seed.waterSupplyType) p.waterSupplyType = seed.waterSupplyType;
      if (!p.electricityMeterType && seed.electricityMeterType) p.electricityMeterType = seed.electricityMeterType;
    }

    // Normalize landlord
    if (!p.landlord || typeof p.landlord !== 'object') {
      p.landlord = {
        name: p.landlordName || p.owner_name || 'Landlord',
        phone: p.landlordPhone || p.owner_phone || '+254711882233',
        whatsapp: p.landlordWhatsapp || p.owner_whatsapp || '+254711882233',
        memberSince: p.landlordSince || '2024',
        isVerified: p.isVerified || false,
        isAgency: p.managedBy === 'agency',
        id: p.landlordId || p.owner_id || null
      };
    }

    // Normalize amenities
    if (!p.amenities || typeof p.amenities !== 'object') {
      p.amenities = {};
    } else if (Array.isArray(p.amenities)) {
      const arr = p.amenities.map(a => String(a).toLowerCase());
      p.amenities = {
        hasBalcony: arr.includes('balcony'),
        hasParking: arr.includes('parking'),
        hasElectricFence: arr.includes('electric fence') || arr.includes('fence'),
        hasCctv: arr.includes('cctv') || arr.includes('security'),
        hasInternet: arr.includes('wifi') || arr.includes('internet'),
        hasTiles: arr.includes('tiles'),
        isMasterEnsuite: arr.includes('ensuite'),
        hasGym: arr.includes('gym'),
        hasSwimmingPool: arr.includes('pool') || arr.includes('swimming')
      };
    }

    // Normalize media array
    if (!p.media || !Array.isArray(p.media) || p.media.length === 0) {
      const defaultImg = p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
      p.media = [{ url: defaultImg, caption: p.title || 'Property photo' }];
    } else {
      p.media = p.media.map((m, i) => typeof m === 'string' ? { url: m, caption: \`Photo \${i + 1} of \${p.title}\` } : m);
    }

    p.photoCount = p.media.length;
    return p;
  }

  openPropertyDetail(propertyId) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;
    this.normalizeProperty(p);

    // Normalize landlord — API listings may not have a landlord object`;

app = app.replace(oldOpenPropDetail, newOpenPropDetail);

// Map API loaded properties through normalizeProperty
app = app.replace(
  'console.log(\'Loaded properties from API:\', this.properties.length);',
  'this.properties = this.properties.map(p => this.normalizeProperty(p));\n          console.log(\'Loaded properties from API:\', this.properties.length);'
);

// Update openGalleryModal to immediately open lightbox with all 7 photos
const oldGalleryModal = `  openGalleryModal(propertyId, event) {
    if (event) event.stopPropagation();
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.selectedPropertyForDetail = p;
    this.currentPhotoIndex = 0;

    // Standardize media array
    if (!p.media || !Array.isArray(p.media) || p.media.length === 0) {
      const defaultImg = p.thumbnail || p.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
      p.media = [{ url: defaultImg, caption: p.title }];
    } else {
      p.media = p.media.map(m => typeof m === 'string' ? { url: m, caption: p.title } : m);
    }

    const isLoggedIn = !!(window.kejaAuth && (window.kejaAuth.isLoggedIn() || window.kejaAuth.getSession()));

    // Always open property detail modal (for ALL users — guests and logged-in)
    this.openPropertyDetail(propertyId);

    if (isLoggedIn) {
      // Logged-in: unlock photos and open lightbox directly
      this.unlockDetailPhotos(propertyId);
      setTimeout(() => this.openLightbox(event), 100);
    }
    // Guests: detail modal opens, they can sign in from within to see full gallery
  }`;

const newGalleryModal = `  openGalleryModal(propertyId, event) {
    if (event) event.stopPropagation();
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.normalizeProperty(p);
    this.selectedPropertyForDetail = p;
    this.currentPhotoIndex = 0;

    // Open property detail modal
    this.openPropertyDetail(propertyId);

    // Open full lightbox gallery with all 7 photos immediately
    setTimeout(() => this.openLightbox(event), 100);
  }`;

app = app.replace(oldGalleryModal, newGalleryModal);

// In openPropertyDetail: Render thumbnails completely unlocked and unblurred
const oldDetailThumbs = `    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => {
        if (idx === 0) {
          // Always show first photo free
          return \`<div class="detail-thumb active" onclick="app.selectDetailPhoto('\${m.url}', this, 0)">
            <img src="\${m.url}" alt="\${m.caption || 'Photo'}">
          </div>\`;
        }
        if (isLoggedIn) {
          // Logged-in: show all photos normally
          return \`<div class="detail-thumb" onclick="app.selectDetailPhoto('\${m.url}', this, \${idx})">
            <img src="\${m.url}" alt="\${m.caption || 'Photo'}">
          </div>\`;
        }
        // Locked: blurred thumb with lock icon
        return \`<div class="detail-thumb detail-thumb-locked" onclick="kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('\${p.id}'))" title="Sign in to view all photos">
          <img src="\${m.url}" alt="Locked photo" style="filter:blur(6px) brightness(0.55); pointer-events:none;">
          <span class="thumb-lock-icon"><i class="fas fa-lock"></i></span>
        </div>\`;
      }).join('');

      // If not logged in and there are extra photos, show a sign-in nudge strip
      if (!isLoggedIn && p.media.length > 1) {
        const extraCount = p.media.length - 1;
        thumbsContainer.insertAdjacentHTML('afterend', \`
          <div id="detail-photos-lock-banner" onclick="kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos('\${p.id}'))"
            style="display:flex;align-items:center;gap:10px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:8px;padding:10px 14px;margin-top:8px;cursor:pointer;font-size:0.85rem;color:#475569;">
            <i class="fas fa-images" style="font-size:1.3rem;color:#00b53f;"></i>
            <span><strong>+\${extraCount} more photo\${extraCount > 1 ? 's' : ''}</strong> —  <span style="color:#00b53f;font-weight:700;">Sign in free</span> to view all</span>
            <i class="fas fa-chevron-right" style="margin-left:auto;color:#94a3b8;"></i>
          </div>
        \`);
      }
    }`;

const newDetailThumbs = `    const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => \`
        <div class="detail-thumb \${idx === (this.currentPhotoIndex || 0) ? 'active' : ''}" onclick="app.selectDetailPhoto('\${m.url}', this, \${idx})">
          <img src="\${m.url}" alt="\${m.caption || 'Photo'}">
        </div>
      \`).join('');
    }`;

app = app.replace(oldDetailThumbs, newDetailThumbs);

// In openPropertyDetail: Unblock landlord & caretaker calls
const oldLandlordContacts = `    if (isLoggedIn) {
      // Full access
      if (landlordName) landlordName.textContent = contactName;
      if (landlordSince) landlordSince.textContent = \`Member since \${p.landlord?.memberSince || '2024'}\`;
      if (phoneDisplay) phoneDisplay.innerHTML = \`<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i>\${p.landlord?.phone || 'Contact via Chat'}\`;
      if (callBtn) {
        callBtn.href = \`tel:\${p.landlord?.phone || ''}\`;
        callBtn.removeAttribute('onclick');
        callBtn.style.opacity = '1';
        callBtn.style.pointerEvents = 'auto';
        callBtn.innerHTML = \`<i class="fas fa-phone-alt"></i> Call \${isAgencyListing ? 'Agency' : 'Landlord'}\`;
      }
      if (chatBtn) {
        chatBtn.onclick = () => app.openChatForCurrentProperty();
        chatBtn.style.opacity = '1';
        chatBtn.style.pointerEvents = 'auto';
        chatBtn.innerHTML = \`<i class="fas fa-comment-dots"></i> Message \${isAgencyListing ? 'Agency' : 'Landlord'}\`;
      }
    } else {
      // Protected
      if (landlordName) landlordName.innerHTML = \`<i class="fas fa-user-shield" style="color:#00b53f;margin-right:6px;"></i><span style="color:#64748b;">\${isAgencyListing ? 'Agency' : 'Landlord'} Details Protected</span>\`;
      if (landlordSince) landlordSince.textContent = 'Sign in or create free account to view contact details';
      if (phoneDisplay) phoneDisplay.innerHTML = \`<i class="fas fa-lock" style="color:#94a3b8;margin-right:5px;"></i><span style="color:#94a3b8;letter-spacing:1px;">+254 7••• •••••• (Sign in to view)</span>\`;
      if (callBtn) {
        callBtn.href = '#';
        callBtn.setAttribute('onclick', \`event.preventDefault(); app.callLandlordDirect('\${p.id}'); return false;\`);
        callBtn.style.opacity = '0.9';
        callBtn.innerHTML = \`<i class="fas fa-lock"></i> Sign In to Call \${isAgencyListing ? 'Agency' : 'Landlord'}\`;
      }
      if (chatBtn) {
        chatBtn.onclick = (e) => { e.preventDefault(); kejaAuth.requireTenantAuth(() => app.unlockDetailPhotos(p.id)); };
        chatBtn.style.opacity = '0.85';
        chatBtn.innerHTML = \`<i class="fas fa-lock"></i> Sign In to Message\`;
      }
    }`;

const newLandlordContacts = `    const contactPhone = p.landlord?.phone || '+254711882233';
    if (landlordName) landlordName.textContent = contactName;
    if (landlordSince) landlordSince.textContent = \`Member since \${p.landlord?.memberSince || '2024'}\`;
    if (phoneDisplay) phoneDisplay.innerHTML = \`<i class="fas fa-phone-alt" style="color:#00b53f;margin-right:5px;"></i><a href="tel:\${contactPhone}" style="color:#0f172a;text-decoration:none;font-weight:700;">\${contactPhone}</a>\`;
    if (callBtn) {
      callBtn.href = \`tel:\${contactPhone}\`;
      callBtn.removeAttribute('onclick');
      callBtn.style.opacity = '1';
      callBtn.style.pointerEvents = 'auto';
      callBtn.innerHTML = \`<i class="fas fa-phone-alt"></i> Call \${isAgencyListing ? 'Agency' : (isBnb ? 'Host' : 'Landlord')} (\${contactPhone})\`;
    }
    if (chatBtn) {
      chatBtn.onclick = () => {
        if (isLoggedIn) {
          app.openChatForCurrentProperty();
        } else {
          kejaAuth.requireTenantAuth(() => app.openChatForCurrentProperty());
        }
      };
      chatBtn.style.opacity = '1';
      chatBtn.style.pointerEvents = 'auto';
      chatBtn.innerHTML = \`<i class="fas fa-comment-dots"></i> Message \${isAgencyListing ? 'Agency' : (isBnb ? 'Host' : 'Landlord')}\`;
    }`;

app = app.replace(oldLandlordContacts, newLandlordContacts);

// Caretaker direct calling without login block
app = landlord ? app.replace(
  /if \(caretakerCallBtn\) \{[\s\S]*?caretakerCallBtn\.innerHTML = `<i class="fas fa-lock"><\/i> Sign In to Call Caretaker`;[\s\S]*?\}\s*\}/,
  `if (caretakerCallBtn) {
          caretakerCallBtn.href = \`tel:\${p.caretakerPhone || ''}\`;
          caretakerCallBtn.removeAttribute('onclick');
          caretakerCallBtn.innerHTML = \`<i class="fas fa-phone-alt"></i> Call Caretaker (\${p.caretakerPhone || ''})\`;
        }`
) : app;

// Remove login requirements in prevDetailPhoto & nextDetailPhoto
app = app.replace(
  /prevDetailPhoto\(event\) \{[\s\S]*?this\.showPhotoAtIndex\(this\.currentPhotoIndex\);\s*\}/,
  `prevDetailPhoto(event) {
    if (event) event.stopPropagation();
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + p.media.length) % p.media.length;
    this.showPhotoAtIndex(this.currentPhotoIndex);
  }`
);

app = app.replace(
  /nextDetailPhoto\(event\) \{[\s\S]*?this\.showPhotoAtIndex\(this\.currentPhotoIndex\);\s*\}/,
  `nextDetailPhoto(event) {
    if (event) event.stopPropagation();
    const p = this.selectedPropertyForDetail;
    if (!p || !p.media || p.media.length <= 1) return;

    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % p.media.length;
    this.showPhotoAtIndex(this.currentPhotoIndex);
  }`
);

// Update revealLandlordPhone & callLandlordDirect to dial directly without requiring login
app = app.replace(
  /revealLandlordPhone\(propertyId, btnEl\) \{[\s\S]*?window\.location\.href = `tel:\${p\.landlord\.phone}`;?\s*\}/,
  `revealLandlordPhone(propertyId, btnEl) {
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;
    this.normalizeProperty(p);

    const phone = p.landlord?.phone || '+254711882233';
    if (btnEl) {
      btnEl.innerHTML = \`<i class="fas fa-phone"></i> \${phone}\`;
      btnEl.style.background = '#e6f8ec';
      btnEl.style.color = '#008e31';
      btnEl.style.borderColor = '#00b53f';
    }

    // Immediately open phone dialer app
    window.location.href = \`tel:\${phone}\`;
  }`
);

app = app.replace(
  /callLandlordDirect\(propertyId\) \{[\s\S]*?window\.location\.href = `tel:\${p\.landlord\.phone}`;?\s*\}/,
  `callLandlordDirect(propertyId) {
    const p = this.properties.find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;
    this.normalizeProperty(p);

    const phone = p.landlord?.phone || '+254711882233';
    window.location.href = \`tel:\${phone}\`;
  }`
);

// Ensure modal-post-ad populates selects upon open
app = app.replace(
  `if (modalId === 'modal-post-ad') {
        window.landlordManager.initPostMap();
      }`,
  `if (modalId === 'modal-post-ad') {
        if (window.landlordManager) {
          window.landlordManager.populateSelects();
          window.landlordManager.setupSuburbAutocomplete();
          window.landlordManager.initPostMap();
        }
      }`
);

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('✓ Updated js/app.js');

// =====================================================================
// 4. UPDATE INDEX.HTML (index.html)
// =====================================================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Post Ad modal House Type options baked in directly
const oldPostCategorySelect = '<select id="post-category" class="form-control" required></select>';
const newPostCategorySelect = `<select id="post-category" class="form-control" required>
                <option value="Single Room">Single Room</option>
                <option value="Bedsitter / Studio">Bedsitter / Studio</option>
                <option value="1 Bedroom" selected>1 Bedroom</option>
                <option value="2 Bedroom">2 Bedroom</option>
                <option value="3 Bedroom">3 Bedroom</option>
                <option value="4 Bedroom+">4 Bedroom+</option>
                <option value="Maisonette / Townhouse">Maisonette / Townhouse</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Room In Shared Apartment">Room In Shared Apartment</option>
                <option value="Hostels / Student Room">Hostels / Student Room</option>
                <option value="Conference Room / Boardroom">Conference Room / Boardroom</option>
                <option value="Meeting & Event Hall">Meeting & Event Hall</option>
                <option value="Commercial Office / Co-Working">Commercial Office / Co-Working</option>
                <option value="Commercial Shop / Stall">Commercial Shop / Stall</option>
                <option value="BnB / Airbnb (Daily Stay)">BnB / Airbnb (Daily Stay)</option>
                <option value="Studio BnB (Short-Stay)">Studio BnB (Short-Stay)</option>
                <option value="1 & 2 Bedroom BnB (Furnished)">1 & 2 Bedroom BnB (Furnished)</option>
                <option value="Luxury Villa / Vacation Stay">Luxury Villa / Vacation Stay</option>
              </select>`;

html = html.replace(oldPostCategorySelect, newPostCategorySelect);

// B. Suburb autocomplete field with datalist and position:relative
const oldSuburbField = `<div class="form-group">
              <label>Estate / Area / Suburb * <small style="color: #64748b;">(Start typing...)</small></label>
              <input type="text" id="post-suburb-search" class="form-control" placeholder="Type estate name (e.g. Ruaka, Kilimani...)" autocomplete="off" required>
              <select id="post-suburb" class="form-control" style="display: none;"></select>
              <div id="suburb-suggestions" style="position: absolute; background: white; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 200px; overflow-y: auto; width: 100%; z-index: 1000; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>
            </div>`;

const newSuburbField = `<div class="form-group" style="position: relative;">
              <label>Estate / Area / Suburb * <small style="color: #64748b;">(Start typing...)</small></label>
              <input type="text" id="post-suburb-search" list="suburb-datalist" class="form-control" placeholder="Type estate name (e.g. Ruaka, Kilimani...)" autocomplete="off" required>
              <datalist id="suburb-datalist"></datalist>
              <select id="post-suburb" class="form-control" style="display: none;"></select>
              <div id="suburb-suggestions" style="position: absolute; top: calc(100% + 2px); left: 0; right: 0; background: white; border: 1.5px solid #00b53f; border-radius: 8px; max-height: 220px; overflow-y: auto; z-index: 99999; display: none; box-shadow: 0 10px 25px rgba(0,0,0,0.2);"></div>
            </div>`;

html = html.replace(oldSuburbField, newSuburbField);

// C. Sidebar 2-Column Structure
const oldSidebarContent = /<!-- Category List — switches based on active tab -->[\s\S]*?<!-- COLUMN 2: Location, Price, Utilities, Amenities -->[\s\S]*?<div class="sidebar-col-other">/;

const newSidebarContent = `<!-- 2-COLUMN FILTER LAYOUT -->
      <div class="sidebar-filter-cols" id="sidebar-filter-cols">
        <!-- COLUMN 1: House Types / Services / House Items + Verification -->
        <div class="sidebar-col-category">
          <!-- Panel 1: Rental Properties -->
          <div id="acc-body-properties" style="display:block;">
            <div style="font-size:0.75rem; font-weight:700; color:#166534; margin-bottom:5px; display:flex; align-items:center; gap:5px;">
              <i class="fas fa-home" style="color:#00b53f;"></i> House Types
            </div>
            <div id="sidebar-category-list" class="sidebar-category-list">
              <!-- Populated by JS -->
            </div>
          </div>

          <!-- Panel 2: Professional Services -->
          <div id="acc-body-services" style="display:none;">
            <div style="font-size:0.75rem; font-weight:700; color:#6b21a8; margin-bottom:5px; display:flex; align-items:center; gap:5px;">
              <i class="fas fa-tools" style="color:#7c3aed;"></i> Services
            </div>
            <div id="sidebar-services-category-list" class="sidebar-category-list">
              <!-- Populated by JS -->
            </div>
          </div>

          <!-- Panel 3: House Items & Marketplace -->
          <div id="acc-body-marketplace" style="display:none;">
            <div style="font-size:0.75rem; font-weight:700; color:#854d0e; margin-bottom:5px; display:flex; align-items:center; gap:5px;">
              <i class="fas fa-shopping-bag" style="color:#f59e0b;"></i> Used Items
            </div>
            <div id="sidebar-marketplace-category-list" class="sidebar-category-list">
              <!-- Populated by JS -->
            </div>
          </div>

          <!-- Verification Status Filter -->
          <div class="filter-group" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-top: 10px;">
            <div class="filter-title" style="font-weight: 800; color: #0f172a; margin-bottom: 6px; font-size: 0.76rem; display: flex; align-items: center; justify-content: space-between;">
              <span><i class="fas fa-shield-alt" style="color: #00b53f;"></i> Verified</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <button type="button" class="verification-pill active" id="vf-all" onclick="app.setVerificationFilter('all', this)" style="padding: 4px 6px; font-size: 0.72rem; font-weight: 700; border-radius: 5px; border: 1px solid #00b53f; background: #00b53f; color: white; cursor: pointer; text-align: center;">
                All
              </button>
              <button type="button" class="verification-pill" id="vf-verified" onclick="app.setVerificationFilter('verified', this)" style="padding: 4px 6px; font-size: 0.72rem; font-weight: 700; border-radius: 5px; border: 1px solid #cbd5e1; background: white; color: #166534; cursor: pointer; text-align: center;">
                Verified Only
              </button>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: Nairobi Corridor, Suburb / Estate, Rent Price, Water & Utilities, Amenities -->
        <div class="sidebar-col-other" id="sidebar-properties-filters">`;

html = html.replace(oldSidebarContent, newSidebarContent);

// Close sidebar-filter-cols before </aside>
html = html.replace(
  `        </div>
      </div>

      <!-- SERVICES FILTER SECTION -->`,
  `        </div>
      </div>
      </div>

      <!-- SERVICES FILTER SECTION -->`
);

// D. Bump cache-busters in index.html to v=2.9
html = html.replace(/v=2\.8&t=202609160035/g, 'v=2.9&t=202609160120');
html = html.replace(/\/sw\.js\?v=2\.[0-9]+/g, '/sw.js?v=2.9');

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Updated index.html');

// =====================================================================
// 5. UPDATE SERVICE WORKER (sw.js)
// =====================================================================
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/const CACHE_NAME = 'kejamarket-v[0-9]+';/, "const CACHE_NAME = 'kejamarket-v29';");
fs.writeFileSync('sw.js', sw, 'utf8');
console.log('✓ Updated sw.js');

console.log('All updates applied successfully!');
