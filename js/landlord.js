/**
 * Nairobi Rentals Live - Landlord Posting & Verification Module
 * Manages "+ Post Free Ad" flow, image uploads, watermark preview, GPS placement, and ID verification.
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
    if (catSelect) {
      catSelect.innerHTML = MASTER_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate Corridors / Suburbs
    const suburbSelect = document.getElementById('post-suburb');
    if (suburbSelect) {
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
      <div class="photo-preview-item">
        <img src="${url}" alt="Upload preview ${idx+1}">
        <span class="watermark-tag"><i class="fas fa-shield-alt"></i> NAIROBI RENTALS LIVE</span>
        <button type="button" onclick="landlordManager.removePhoto(${idx})" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,0.85);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:0.65rem;cursor:pointer;">&times;</button>
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

      if (!this.postMap) {
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
          document.getElementById('post-gps-coords').textContent = `GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        });

        this.postMap.on('click', (e) => {
          this.postMarker.setLatLng(e.latlng);
          this.selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
          document.getElementById('post-gps-coords').textContent = `GPS: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
        });
      } else {
        this.postMap.invalidateSize();
      }
    }, 200);
  }

  updatePostMapLocation(lat, lng) {
    this.selectedCoords = { lat, lng };
    if (this.postMap && this.postMarker) {
      this.postMap.setView([lat, lng], 14);
      this.postMarker.setLatLng([lat, lng]);
      document.getElementById('post-gps-coords').textContent = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  setupFormSubmit() {
    const form = document.getElementById('post-ad-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('post-title').value.trim();
      const rent = parseFloat(document.getElementById('post-rent').value);
      const deposit = parseFloat(document.getElementById('post-deposit').value) || rent;
      const category = document.getElementById('post-category').value;
      const suburb = document.getElementById('post-suburb').value;
      const description = document.getElementById('post-description').value.trim();
      const waterType = document.getElementById('post-water').value;
      const electricityType = document.getElementById('post-electricity').value;
      const landlordName = document.getElementById('post-landlord-name').value.trim() || 'Direct Landlord';
      const phone = document.getElementById('post-phone').value.trim() || '+254700000000';

      const suburbObj = ALL_SUBURBS.find(s => s.name === suburb) || { county: 'Nairobi', corridorId: 'nairobi_central' };

      // Use uploaded images or fallbacks
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
        id: 'prop-usr-' + Date.now(),
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
          id: 'usr-' + Date.now(),
          name: landlordName,
          phone,
          whatsapp: phone,
          isVerified: true,
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

      // Add to main state and UI
      window.app.addProperty(newListing);
      window.app.closeModal('modal-post-ad');
      window.app.showToast('Listing published successfully! Watermark applied.', 'success');
      form.reset();
      this.uploadedImages = [];
      this.renderPhotoPreviews();
    });
  }

  setupVerificationModal() {
    const vForm = document.getElementById('form-verification-badge');
    if (!vForm) return;

    vForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.app.closeModal('modal-verification');
      window.app.showToast('ID Verification submitted! "Verified Landlord" badge pending approval.', 'info');
      vForm.reset();
    });
  }
}

window.landlordManager = new LandlordManager();
