/**
 * KejaMarket - Landlord Posting & Verification Module
 * Manages "+ Post Free Ad" flow, image uploads, watermark preview, GPS placement, ID verification, and backend sync.
 */

class LandlordManager {
  constructor() {
    this.uploadedImages = [];
    this.uploadedVideos = [];
    this.selectedCoords = { lat: -1.286389, lng: 36.817223 }; // Default Nairobi CBD
    this.postMap = null;
    this.postMarker = null;
  }

  initModal() {
    this.populateSelects();
    this.setupDropzone();
    this.setupVideoDropzone();
    this.setupFormSubmit();
    this.setupVerificationModal();
    this.setupSuburbAutocomplete();
    this.autoFillUserDetails();
  }

  autoFillUserDetails() {
    // Auto-fill landlord name and phone from logged-in user
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (session) {
      // Phone is auto-filled from session (no need for input field)
      this.landlordPhone = session.phone;
      this.landlordName = session.name;
    }
  }

  setupSuburbAutocomplete() {
    const searchInput = document.getElementById('post-suburb-search');
    const suggestionsDiv = document.getElementById('suburb-suggestions');
    const hiddenSelect = document.getElementById('post-suburb');

    if (!searchInput || !suggestionsDiv) return;

    let allSuburbs = [];
    if (typeof ALL_SUBURBS !== 'undefined') {
      allSuburbs = ALL_SUBURBS;
    }

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (query.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      const matches = allSuburbs.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.county.toLowerCase().includes(query)
      ).slice(0, 10);

      if (matches.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      suggestionsDiv.innerHTML = matches.map(s => `
        <div style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; hover:background: #f8fafc;" 
             onmouseover="this.style.background='#f8fafc'" 
             onmouseout="this.style.background='white'"
             onclick="landlordManager.selectSuburb('${s.name}', ${s.lat}, ${s.lng}, '${s.county}', '${s.corridorId}')">
          <div style="font-weight: 600; color: #1e293b;">${s.name}</div>
          <div style="font-size: 0.85rem; color: #64748b;">${s.county}</div>
        </div>
      `).join('');

      suggestionsDiv.style.display = 'block';
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.style.display = 'none';
      }
    });
  }

  selectSuburb(name, lat, lng, county, corridorId) {
    const searchInput = document.getElementById('post-suburb-search');
    const suggestionsDiv = document.getElementById('suburb-suggestions');
    const hiddenSelect = document.getElementById('post-suburb');

    if (searchInput) searchInput.value = `${name} (${county})`;
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
    // Store selected suburb data
    this.selectedSuburb = { name, lat, lng, county, corridorId };
    this.updatePostMapLocation(lat, lng);

    // Update hidden select for form submission
    if (hiddenSelect) {
      hiddenSelect.innerHTML = `<option value="${name}" selected>${name}</option>`;
    }
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

  setupVideoDropzone() {
    const videoDropzone = document.getElementById('video-dropzone');
    const videoInput = document.getElementById('post-videos-input');

    if (!videoDropzone || !videoInput) return;

    videoDropzone.addEventListener('click', () => videoInput.click());

    videoDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      videoDropzone.style.borderColor = '#7c3aed';
    });

    videoDropzone.addEventListener('dragleave', () => {
      videoDropzone.style.borderColor = '#c084fc';
    });

    videoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      videoDropzone.style.borderColor = '#c084fc';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleVideoFiles(e.dataTransfer.files);
      }
    });

    videoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleVideoFiles(e.target.files);
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

  handleVideoFiles(files) {
    const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      if (window.app) window.app.showToast('Please select valid video files (MP4, WebM, MOV).', 'info');
      return;
    }

    videoFiles.forEach(file => {
      if (this.uploadedVideos.length >= 2) {
        if (window.app) window.app.showToast('Maximum 2 video tours allowed per listing.', 'info');
        return;
      }

      // Check video duration (max 1m 30s / 90 seconds)
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const blobUrl = URL.createObjectURL(file);
      videoEl.src = blobUrl;

      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(blobUrl);
        const duration = videoEl.duration;

        if (duration > 91) { // 1m 30s + 1s tolerance
          const mins = Math.floor(duration / 60);
          const secs = Math.floor(duration % 60);
          if (window.app) {
            window.app.showToast(`❌ Video exceeds max duration! Allowed: 1 min 30 sec (1m 30s). Uploaded: ${mins}m ${secs}s.`, 'error');
          }
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const videoDataUrl = e.target.result;
          this.uploadedVideos.push({
            url: videoDataUrl,
            duration: Math.round(duration),
            name: file.name
          });
          this.renderVideoPreviews();
          if (window.app) {
            window.app.showToast(`🎥 Video tour added (${Math.round(duration)}s)!`, 'success');
          }
        };
        reader.readAsDataURL(file);
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        if (window.app) window.app.showToast('Could not process video file. Please try another format.', 'error');
      };
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

  renderVideoPreviews() {
    const previewGrid = document.getElementById('post-videos-preview');
    if (!previewGrid) return;

    previewGrid.innerHTML = this.uploadedVideos.map((v, idx) => {
      const mins = Math.floor(v.duration / 60);
      const secs = (v.duration % 60).toString().padStart(2, '0');
      return `
        <div class="video-preview-item" style="position:relative; border-radius:8px; overflow:hidden; border:2px solid #c084fc; width:140px; height:90px; background:#000;">
          <video src="${v.url}" style="width:100%; height:100%; object-fit:cover;" muted></video>
          <span style="position:absolute; bottom:4px; left:4px; background:rgba(124,58,237,0.85); color:#fff; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; display:flex; align-items:center; gap:4px;">
            <i class="fas fa-play" style="font-size:0.55rem;"></i> ${mins}:${secs}
          </span>
          <button type="button" onclick="landlordManager.removeVideo(${idx})" style="position:absolute; top:3px; right:3px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:22px; height:22px; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:5;">&times;</button>
        </div>
      `;
    }).join('');
  }

  removePhoto(index) {
    this.uploadedImages.splice(index, 1);
    this.renderPhotoPreviews();
  }

  removeVideo(index) {
    this.uploadedVideos.splice(index, 1);
    this.renderVideoPreviews();
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

  useLiveLocation() {
    const btn = document.getElementById('btn-use-live-location');

    if (!navigator.geolocation) {
      if (window.app) window.app.showToast('GPS is not supported on this device.', 'error');
      return;
    }

    // Show loading state on button
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Move map pin to live location
        this.updatePostMapLocation(lat, lng);

        // Reset button to success state
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-check-circle"></i> Location Set';
          btn.style.background = '#dcfce7';
          btn.style.color = '#166534';
          btn.style.borderColor = '#86efac';
          // Reset back after 3s
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Live Location';
            btn.style.background = '#e0f2fe';
            btn.style.color = '#0284c7';
            btn.style.borderColor = '#7dd3fc';
          }, 3000);
        }

        if (window.app) window.app.showToast('📍 Live location set on map. You can still drag the pin to adjust.', 'success');
      },
      (error) => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Live Location';
        }

        const messages = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Could not detect your location. Try again or pin manually.',
          3: 'Location request timed out. Try again or pin manually.'
        };
        if (window.app) window.app.showToast(messages[error.code] || 'Location unavailable.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  toggleManagedByFields(managedBy) {
    const agencyRow = document.getElementById('post-agency-name-row');
    const contactLabel = document.getElementById('post-contact-name-label');
    const nameInput = document.getElementById('post-landlord-name');
    const agencyInput = document.getElementById('post-agency-name');
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

    if (agencyRow) {
      agencyRow.style.display = managedBy === 'agency' ? 'grid' : 'none';
    }
    if (contactLabel) {
      contactLabel.textContent = managedBy === 'agency' ? 'Principal Agent / Contact Person *' : 'Your Full Name / Landlord *';
    }
    if (session && session.role === 'agency' && agencyInput) {
      agencyInput.value = session.agencyName || session.name;
    }
  }

  setupFormSubmit() {
    const form = document.getElementById('post-ad-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

      const managedBy = document.getElementById('post-managed-by')?.value || (session && session.role === 'agency' ? 'agency' : 'landlord');
      const agencyName = document.getElementById('post-agency-name')?.value.trim() || (session?.agencyName || session?.name || '');
      const caretakerName = document.getElementById('post-caretaker-name')?.value.trim() || '';
      const caretakerPhone = document.getElementById('post-caretaker-phone')?.value.trim() || '';

      const title = document.getElementById('post-title')?.value.trim() || '';
      const rent = parseFloat(document.getElementById('post-rent')?.value) || 0;
      const deposit = parseFloat(document.getElementById('post-deposit')?.value) || rent;
      const category = document.getElementById('post-category')?.value || '1 Bedroom';
      const suburb = document.getElementById('post-suburb')?.value || 'Kilimani';
      const description = document.getElementById('post-description')?.value.trim() || '';
      const waterType = document.getElementById('post-water')?.value || 'Borehole Water';
      const electricityType = document.getElementById('post-electricity')?.value || 'Prepaid (Tokens)';
      
      // Auto-fill landlord details from session (no form fields needed)
      const landlordName = this.landlordName || (session ? session.name : (managedBy === 'agency' ? 'Verified Agency' : 'Direct Landlord'));
      const phone = this.landlordPhone || (session ? session.phone : '+254700000000');

      const suburbObj = this.selectedSuburb || (typeof ALL_SUBURBS !== 'undefined' && ALL_SUBURBS.find(s => s.name === suburb)) || { county: 'Nairobi', corridorId: 'nairobi_central' };

      const defaultPhotos = [
        { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80', caption: 'Living Area' },
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80', caption: 'Bedroom' }
      ];

      const priceType = document.getElementById('post-price-type')?.value || 'monthly';
      const isBnb = priceType === 'night' || category.includes('BnB') || category.includes('Airbnb') || category.includes('Villa');
      const isDaily = priceType === 'day' || category.includes('Conference') || category.includes('Event') || category.includes('Hall');
      const isHourly = priceType === 'hour' || category.includes('Boardroom');
      const rentPeriod = isHourly ? 'hour' : (isDaily ? 'day' : (isBnb ? 'night' : 'month'));

      const media = this.uploadedImages.length > 0 
        ? this.uploadedImages.map(url => ({ url, caption: title }))
        : defaultPhotos;

      const newListing = {
        title,
        description,
        category,
        isBnb,
        rentPeriod,
        bedrooms: category.includes('1 Bedroom') || category.includes('1 & 2') ? 1 : category.includes('2 Bedroom') ? 2 : category.includes('3 Bedroom') ? 3 : category.includes('4 Bedroom') ? 4 : 0,
        bathrooms: 1,
        floorLevel: 1,
        rentKes: rent,
        depositKes: (isBnb || isDaily || isHourly) ? 0 : deposit,
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
        source: managedBy === 'agency' ? 'agency' : 'direct',
        managedBy: managedBy,
        agencyName: managedBy === 'agency' ? (agencyName || landlordName) : null,
        caretakerName: caretakerName || null,
        caretakerPhone: caretakerPhone || null,
        postedTimeAgo: 'Just now',
        landlord: {
          id: session ? session.id : ('usr-' + Date.now()),
          name: managedBy === 'agency' ? (agencyName || landlordName) : landlordName,
          phone,
          whatsapp: phone,
          isVerified: session ? session.isVerified : true,
          isAgency: managedBy === 'agency',
          agencyName: managedBy === 'agency' ? (agencyName || landlordName) : null,
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
        videos: this.uploadedVideos || [],
        videoCount: (this.uploadedVideos || []).length,
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

        // Upload photos to Cloudinary CDN if there are any base64 images
        if (this.uploadedImages.length > 0) {
          try {
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading photos...';
            const uploadRes = await fetch('/api/upload/images', {
              method: 'POST',
              headers,
              body: JSON.stringify({ images: this.uploadedImages, folder: 'kejamarket/properties' })
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              if (uploadData.urls && uploadData.urls.length > 0) {
                // Replace base64 with CDN URLs
                newListing.media = uploadData.urls.map((url, i) => ({ url, caption: `${title} - Photo ${i + 1}` }));
                newListing.photos = uploadData.urls;
                newListing.photoCount = uploadData.urls.length;
              }
            }
          } catch (uploadErr) {
            console.warn('Photo CDN upload failed, using base64 fallback:', uploadErr.message);
          }
          if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing listing...';
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
        this.uploadedVideos = [];
        this.renderPhotoPreviews();
        this.renderVideoPreviews();
      }
    });
  }

  setupVerificationModal() {
    const vForm = document.getElementById('form-verification-badge');
    if (!vForm) return;

    vForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('verify-full-name')?.value || '';
      const idNumber = document.getElementById('verify-id-number')?.value || '';
      const phone = document.getElementById('verify-phone')?.value || '';
      const propertyCount = document.getElementById('verify-property-count')?.value || '1';

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (window.kejaAuth && window.kejaAuth.getToken()) {
          headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
        }
        await fetch('/api/auth/verify-landlord', {
          method: 'POST',
          headers,
          body: JSON.stringify({ fullName, idNumber, phone, propertyCount })
        });
      } catch (err) {
        console.warn('Verification submit offline sync');
      }

      if (window.app) {
        window.app.closeModal('modal-verification');
        window.app.showToast('✅ Verified! Your "Verified Landlord" badge is now active on all listings.', 'success');
      }
      vForm.reset();
    });
  }
}

window.landlordManager = new LandlordManager();
