const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');
const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// 1. Insert normalizeProperty right before openPropertyDetail(propertyId) {
const targetStr = `  openPropertyDetail(propertyId) {`;
const normalizeCode = `  normalizeProperty(p) {
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
    this.normalizeProperty(p);`;

if (!content.includes('normalizeProperty(p) {')) {
  content = content.replace(
    /(\r?\n\s*)openPropertyDetail\(propertyId\)\s*\{\r?\n\s*const p = this\.properties\.find\(x => x\.id === propertyId\);\r?\n\s*if \(!p\) return;/,
    eol + normalizeCode.split('\n').join(eol)
  );
  console.log('Added normalizeProperty method');
}

// 2. Replace openGalleryModal to immediately open lightbox with all 7 photos
const newGalleryModal = `  openGalleryModal(propertyId, event) {
    if (event) event.stopPropagation();
    const p = this.properties.find(x => x.id === propertyId);
    if (!p) return;

    this.normalizeProperty(p);
    this.selectedPropertyForDetail = p;
    this.currentPhotoIndex = 0;

    // Open property detail modal
    this.openPropertyDetail(propertyId);

    // Open full lightbox gallery showing all 7 photos immediately
    setTimeout(() => this.openLightbox(event), 100);
  }`;

content = content.replace(
  /openGalleryModal\(propertyId, event\)\s*\{[\s\S]*?\/\/ Guests: detail modal opens[^\r\n]*\r?\n\s*\}/,
  newGalleryModal.split('\n').join(eol)
);
console.log('Updated openGalleryModal');

// 3. Update thumbnails in openPropertyDetail
content = content.replace(
  /const thumbsContainer = document\.getElementById\('detail-thumbs-container'\);[\s\S]*?thumbsContainer\.insertAdjacentHTML\('afterend'[\s\S]*?<\/div>\r?\n\s*`\);\r?\n\s*\}\r?\n\s*\}/,
  `const thumbsContainer = document.getElementById('detail-thumbs-container');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = p.media.map((m, idx) => \`
        <div class="detail-thumb \${idx === (this.currentPhotoIndex || 0) ? 'active' : ''}" onclick="app.selectDetailPhoto('\${m.url}', this, \${idx})">
          <img src="\${m.url}" alt="\${m.caption || 'Photo'}">
        </div>
      \`).join('');
    }`.split('\n').join(eol)
);
console.log('Updated detail thumbs');

// 4. Update landlord contact in openPropertyDetail to reveal phone and call directly
content = content.replace(
  /const contactName = isAgencyListing \? \(p\.agencyName \|\| p\.landlord\?\.name \|\| 'Agency'\) : \(p\.landlord\?\.name \|\| 'Landlord'\);[\s\S]*?chatBtn\.innerHTML = `<i class="fas fa-lock"><\/i> Sign In to Message`;\r?\n\s*\}\r?\n\s*\}/,
  `const contactName = isAgencyListing ? (p.agencyName || p.landlord?.name || 'Agency') : (p.landlord?.name || 'Landlord');
    const contactPhone = p.landlord?.phone || '+254711882233';

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
    }`.split('\n').join(eol)
);
console.log('Updated landlord contacts');

fs.writeFileSync('js/app.js', content, 'utf8');
console.log('Successfully wrote updated js/app.js');
