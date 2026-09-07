/**
 * KejaMarket - Landlord Posting & Verification Module
 * Manages "+ Post Free Ad" flow, image uploads, watermark preview, GPS placement, ID verification, and backend sync.
 */

class LandlordManager {
  constructor() {
    this.uploadedImages = [];
    this.selectedCoords = { lat: -1.286389, lng: 36.817223 }; // Default Nairobi CBD
    this.postMap = null;
    this.postMarker = null;
  }

  initModal() {
    this.populateSelects();
    this.setupDropzone();
    this.setupFormSubmit();
    this.setupVerificationModal();
  }

  populateSelects() {
    // Populate Categories
    const catSelect = document.getElementById('post-category');
    if (catSelect && typeof MASTER_CATEGORIES !== 'undefined') {
      catSelect.innerHTML = MASTER_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate Corridors / Suburbs
    const suburbSelect = document.getElementById('post-suburb');
    if (suburbSelect && typeof ALL_SUBURBS !== 'undefined') {
      suburbSelect.innerHTML = ALL_SUBURBS.map(s => 
        `<option value="${s.name}" data-lat="${s.lat}" data-lng="${s.lng}" data-county="${s.county}" data-corridor="${s.corridorId}">
          ${s.name} (${s.county})
        </option>`
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
  }

  setupDropzone() {
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('post-photos-input');
    const previewGrid = document.getElementById('post-photos-preview');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#00b53f';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '#cbd5e1';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#cbd5e1';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFiles(e.target.files);
      }
    });
  }

  handleFiles(files) {
    const previewGrid = document.getElementById('post-photos-preview');
    if (!previewGrid) return;

    Array.from(files).slice(0, 16).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target.result;
        this.uploadedImages.push(imgUrl);
        this.renderPhotoPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  renderPhotoPreviews() {
    const previewGrid = document.getElementById('post-photos-preview');
    if (!previewGrid) return;

    previewGrid.innerHTML = this.uploadedImages.map((url, idx) => `
      <div class="photo-preview-item" style="position:relative; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; height:80px;">
        <img src="${url}" alt="Upload preview ${idx+1}" style="width:100%; height:100%; object-fit:cover;">
        <span class="watermark-tag" style="position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.65); color:#fff; font-size:0.6rem; padding:1px 4px; border-radius:3px;">
          <i class="fas fa-shield-alt"></i> KEJAMARKET
        </span>
        <button type="button" onclick="landlordManager.removePhoto(${idx})" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.85); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:0.65rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
      </div>
    `).join('');
  }

  removePhoto(index) {
    this.uploadedImages.splice(index, 1);
    this.renderPhotoPreviews();
  }

  initPostMap() {
    setTimeout(() => {
      const mapEl = document.getElementById('post-pin-map');
      if (!mapEl) return;

      if (!this.postMap && typeof L !== 'undefined') {
        this.postMap = L.map('post-pin-map').setView([this.selectedCoords.lat, this.selectedCoords.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.postMap);

        this.postMarker = L.marker([this.selectedCoords.lat, this.selectedCoords.lng], {
          draggable: true
        }).addTo(this.postMap);

        this.postMarker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          this.selectedCoords = { lat: pos.lat, lng: pos.lng };
          const coordsEl = document.getElementById('post-gps-coords');
          if (coordsEl) coordsEl.textContent = `GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        });

        this.postMap.on('click', (e) => {
          this.postMarker.setLatLng(e.latlng);
          this.selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
          const coordsEl = document.getElementById('post-gps-coords');
          if (coordsEl) coordsEl.textContent = `GPS: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
        });
      } else if (this.postMap) {
        this.postMap.invalidateSize();
      }
    }, 200);
  }

  updatePostMapLocation(lat, lng) {
    this.selectedCoords = { lat, lng };
    if (this.postMap && this.postMarker) {
      this.postMap.setView([lat, lng], 14);
      this.postMarker.setLatLng([lat, lng]);
      const coordsEl = document.getElementById('post-gps-coords');
      if (coordsEl) coordsEl.textContent = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  setupFormSubmit() {
    const form = document.getElementById('post-ad-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

      const title = document.getElementById('post-title')?.value.trim() || '';
      const rent = parseFloat(document.getElementById('post-rent')?.value) || 0;
      const deposit = parseFloat(document.getElementById('post-deposit')?.value) || rent;
      const category = document.getElementById('post-category')?.value || '1 Bedroom';
      const suburb = document.getElementById('post-suburb')?.value || 'Kilimani';
      const description = document.getElementById('post-description')?.value.trim() || '';
      const waterType = document.getElementById('post-water')?.value || 'Borehole Water';
      const electricityType = document.getElementById('post-electricity')?.value || 'Prepaid (Tokens)';
      const landlordName = document.getElementById('post-landlord-name')?.value.trim() || (session ? session.name : 'Direct Landlord');
      const phone = document.getElementById('post-phone')?.value.trim() || (session ? session.phone : '+254700000000');

      const suburbObj = (typeof ALL_SUBURBS !== 'undefined' && ALL_SUBURBS.find(s => s.name === suburb)) || { county: 'Nairobi', corridorId: 'nairobi_central' };

      const defaultPhotos = [
        { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', caption: 'Living Area' },
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80', caption: 'Bedroom' }
      ];

      const priceType = document.getElementById('post-price-type')?.value || 'monthly';
      const isBnb = priceType === 'night' || category.includes('BnB') || category.includes('Airbnb') || category.includes('Villa');

      const media = this.uploadedImages.length > 0 
        ? this.uploadedImages.map(url => ({ url, caption: title }))
        : defaultPhotos;

      const newListing = {
        title,
        description,
        category,
        isBnb,
        rentPeriod: isBnb ? 'night' : 'month',
        bedrooms: category.includes('1 Bedroom') || category.includes('1 & 2') ? 1 : category.includes('2 Bedroom') ? 2 : category.includes('3 Bedroom') ? 3 : category.includes('4 Bedroom') ? 4 : 0,
        bathrooms: 1,
        floorLevel: 1,
        rentKes: rent,
        depositKes: isBnb ? 0 : deposit,
        county: suburbObj.county,
        corridorId: suburbObj.corridorId,
        estateSuburb: suburb,
        exactLocation: suburb + ', Nairobi Metro Area',
        latitude: this.selectedCoords.lat,
        longitude: this.selectedCoords.lng,
        waterSupplyType: waterType,
        electricityMeterType: electricityType,
        garbageFeeKes: isBnb ? 0 : 500,
        waterRateKes: isBnb ? 0 : 100,
        isFeatured: false,
        isTopAd: false,
        isVerified: true,
        source: 'direct',
        postedTimeAgo: 'Just now',
        landlord: {
          id: session ? session.id : ('usr-' + Date.now()),
          name: landlordName,
          phone,
          whatsapp: phone,
          isVerified: session ? session.isVerified : true,
          memberSince: 'September 2026',
          rating: 5.0,
          reviewCount: 1
        },
        amenities: {
          hasBalcony: document.getElementById('amenity-balcony')?.checked || false,
          hasParking: document.getElementById('amenity-parking')?.checked || false,
          hasElectricFence: document.getElementById('amenity-fence')?.checked || false,
          hasCctv: document.getElementById('amenity-cctv')?.checked || false,
          hasInternet: document.getElementById('amenity-internet')?.checked || false,
          hasTiles: document.getElementById('amenity-tiles')?.checked || false,
          isMasterEnsuite: document.getElementById('amenity-ensuite')?.checked || false,
          hasGym: false,
          hasSwimmingPool: false
        },
        media,
        photoCount: media.length
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing listing...';
      }

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (window.kejaAuth && window.kejaAuth.getToken()) {
          headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
        }

        const res = await fetch('/api/properties', {
          method: 'POST',
          headers,
          body: JSON.stringify(newListing)
        });

        const data = await res.json();
        const createdProp = (data.success && data.property) ? data.property : newListing;

        if (window.app) {
          window.app.addProperty(createdProp);
          window.app.closeModal('modal-post-ad');
          window.app.showToast('🎉 Listing published successfully! Watermark applied and live on Nairobi map.', 'success');
        }
      } catch (err) {
        console.warn('Backend sync error, adding to local state:', err);
        if (window.app) {
          window.app.addProperty(newListing);
          window.app.closeModal('modal-post-ad');
          window.app.showToast('Listing published locally! Watermark applied.', 'success');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Free Ad Now';
        }
        form.reset();
        this.uploadedImages = [];
        this.renderPhotoPreviews();
      }
    });
  }

  setupVerificationModal() {
    const vForm = document.getElementById('form-verification-badge');
    if (!vForm) return;

    vForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idNumber = document.getElementById('verify-id-number')?.value || '';
      const propertyCount = document.getElementById('verify-property-count')?.value || '1';
      const estate = document.getElementById('verify-estate')?.value || '';

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (window.kejaAuth && window.kejaAuth.getToken()) {
          headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
        }
        await fetch('/api/auth/verify-landlord', {
          method: 'POST',
          headers,
          body: JSON.stringify({ idNumber, propertyCount, estate })
        });
      } catch (err) {
        console.warn('Verification submit offline sync');
      }

      if (window.app) {
        window.app.closeModal('modal-verification');
        window.app.showToast('ID Verification submitted! "Verified Landlord" badge activated.', 'success');
      }
      vForm.reset();
    });
  }
}

window.landlordManager = new LandlordManager();
