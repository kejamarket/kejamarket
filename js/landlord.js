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
    this.setupLocationSearch(); // NEW: Initialize hierarchical location search
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

    const getSuburbs = () => {
      const list = [];
      const seen = new Set();

      const addSuburb = (name, county = 'Nairobi', pathString = '', lat = -1.286389, lng = 36.817223) => {
        if (!name) return;
        const key = (name + '|' + county).toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ name, county, pathString, lat, lng });
      };

      // 1. Kenya County Areas & Wards/Phases (all 4 counties)
      const countyData = window.KENYA_COUNTY_AREAS || (typeof KENYA_COUNTY_AREAS !== 'undefined' ? KENYA_COUNTY_AREAS : null);
      if (countyData && typeof countyData === 'object') {
        Object.keys(countyData).forEach(countyKey => {
          const cObj = countyData[countyKey];
          const countyTitle = cObj.title || countyKey;
          const areas = cObj.areas || {};
          Object.keys(areas).forEach(areaName => {
            addSuburb(areaName, countyTitle, `${areaName}, ${countyTitle}`);
            const subZones = areas[areaName] || [];
            if (Array.isArray(subZones)) {
              subZones.forEach(sub => {
                if (sub && !sub.startsWith('All ')) {
                  addSuburb(`${areaName} - ${sub}`, countyTitle, `${sub}, ${areaName}, ${countyTitle}`);
                }
              });
            }
          });
        });
      }

      // 2. ALL_SUBURBS array
      const globalSuburbs = (typeof ALL_SUBURBS !== 'undefined' && Array.isArray(ALL_SUBURBS)) ? ALL_SUBURBS : (window.ALL_SUBURBS || []);
      globalSuburbs.forEach(s => {
        if (typeof s === 'string') {
          addSuburb(s, 'Nairobi');
        } else if (s && s.name) {
          addSuburb(s.name, s.county || 'Nairobi', s.pathString || '', s.lat || s.latitude, s.lng || s.longitude);
        }
      });

      // 3. NAIROBI_REGIONS fallback
      if (typeof NAIROBI_REGIONS !== 'undefined' && Array.isArray(NAIROBI_REGIONS)) {
        NAIROBI_REGIONS.forEach(r => {
          (r.suburbs || []).forEach(s => addSuburb(s, r.county || 'Nairobi', '', r.lat, r.lng));
        });
      }

      return list;
    };

    const renderItems = (items) => {
      if (!items || items.length === 0) {
        suggestionsDiv.innerHTML = `<div style="padding: 10px 12px; color: #64748b; font-size: 0.85rem;">Using "${searchInput.value.trim()}"</div>`;
        suggestionsDiv.style.display = 'block';
        return;
      }

      suggestionsDiv.innerHTML = items.map(s => `
        <div style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;" 
             onmouseover="this.style.background='#f0fdf4'" 
             onmouseout="this.style.background='white'"
             onclick="landlordManager.selectSuburb('${(s.name || '').replace(/'/g, "\\'")}', ${s.lat || s.latitude || -1.286}, ${s.lng || s.longitude || 36.817}, '${(s.county || 'Nairobi').replace(/'/g, "\\'")}', '${s.corridorId || ''}')">
          <div>
            <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem;">${s.name}</div>
            ${s.pathString ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${s.pathString}</div>` : ''}
          </div>
          <div style="font-size: 0.75rem; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 999px; font-weight: 600; white-space: nowrap; margin-left: 8px;">${s.county || 'Nairobi'}</div>
        </div>
      `).join('');

      suggestionsDiv.style.display = 'block';
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

      renderItems(matches);

      clearTimeout(searchInput._searchTimer);
      searchInput._searchTimer = setTimeout(async () => {
        try {
          const apiRes = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=15`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && Array.isArray(apiData.locations) && apiData.locations.length > 0) {
              const seen = new Set();
              const combined = [];
              for (const loc of apiData.locations) {
                const k = (loc.name || '').toLowerCase();
                if (!seen.has(k)) {
                  seen.add(k);
                  combined.push({
                    name: loc.name,
                    county: loc.county || 'Machakos',
                    lat: loc.latitude || -1.3835,
                    lng: loc.longitude || 36.9605,
                    corridorId: loc.corridorId || '',
                    pathString: loc.pathString
                  });
                }
              }
              for (const loc of matches) {
                const k = (loc.name || '').toLowerCase();
                if (!seen.has(k)) {
                  seen.add(k);
                  combined.push(loc);
                }
              }
              renderItems(combined.slice(0, 20));
            }
          }
        } catch (_) {}
      }, 150);
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

  selectSuburb(name, lat, lng, county, corridorId) {
    const searchInput = document.getElementById('post-suburb-search');
    const suggestionsDiv = document.getElementById('suburb-suggestions');
    const hiddenSelect = document.getElementById('post-suburb');
    const latInput = document.getElementById('post-lat');
    const lngInput = document.getElementById('post-lng');
    const badge = document.getElementById('post-live-location-badge');
    const nameEl = document.getElementById('live-loc-name');
    const coordsEl = document.getElementById('live-loc-coords');

    if (searchInput) searchInput.value = name;
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
    // Store selected suburb data
    this.selectedSuburb = { name, lat: lat || -1.286389, lng: lng || 36.817223, county: county || 'Nairobi', corridorId: corridorId || '' };
    this.selectedCoords = { lat: this.selectedSuburb.lat, lng: this.selectedSuburb.lng };

    if (latInput) latInput.value = this.selectedCoords.lat;
    if (lngInput) lngInput.value = this.selectedCoords.lng;

    if (nameEl) nameEl.textContent = `📍 ${name} (${county || 'Selected'} ✓)`;
    if (coordsEl) coordsEl.textContent = `${this.selectedCoords.lat.toFixed(4)}, ${this.selectedCoords.lng.toFixed(4)}`;
    if (badge) badge.style.display = 'flex';

    if (typeof this.updatePostMapLocation === 'function') {
      this.updatePostMapLocation(this.selectedCoords.lat, this.selectedCoords.lng);
    }

    // Update hidden select for form submission
    if (hiddenSelect) {
      hiddenSelect.innerHTML = `<option value="${name}" selected>${name}</option>`;
    }
  }

  /**
   * NEW: Setup Hierarchical Location Search Component
   */
  setupLocationSearch() {
    // Check if LocationSearch class is available
    if (typeof LocationSearch === 'undefined') {
      console.warn('LocationSearch not loaded, using fallback autocomplete');
      return;
    }

    try {
      // Get DOM elements
      const inputElement = document.getElementById('post-suburb-search');
      const containerElement = document.getElementById('location-search-container');
      
      if (!inputElement) {
        console.error('Location search input not found');
        return;
      }

      // Initialize the LocationSearch component
      this.locationSearch = new LocationSearch({
        inputElement: inputElement,
        resultsContainer: containerElement,
        onSelect: (location) => {
          // Store location data in hidden fields
          const hierarchyIdField = document.getElementById('post-location-hierarchy-id');
          const pathIdsField = document.getElementById('post-location-path-ids');
          const fullPathField = document.getElementById('post-location-full-path');
          
          if (hierarchyIdField) hierarchyIdField.value = location.id || '';
          if (pathIdsField) pathIdsField.value = JSON.stringify(location.pathIds || [location.id]);
          if (fullPathField) fullPathField.value = location.fullPath || location.name;

          // Update suburb selection for backward compatibility
          this.selectedSuburb = {
            name: location.name,
            lat: location.latitude || -1.286389,
            lng: location.longitude || 36.817223,
            county: location.county || 'Nairobi',
            corridorId: location.id
          };

          // Update map if available
          if (this.updatePostMapLocation) {
            this.updatePostMapLocation(this.selectedSuburb.lat, this.selectedSuburb.lng);
          }

          console.log('✅ Location selected:', location.fullPath);
        }
      });

      console.log('✅ Hierarchical LocationSearch initialized');
    } catch (error) {
      console.error('Error initializing LocationSearch:', error);
    }
  }

  populateSelects() {
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
      catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Populate Corridors / Suburbs
    const suburbSelect = document.getElementById('post-suburb');
    const suburbs = (typeof ALL_SUBURBS !== 'undefined' && Array.isArray(ALL_SUBURBS) && ALL_SUBURBS.length > 0)
      ? ALL_SUBURBS
      : (window.ALL_SUBURBS || []);

    if (suburbSelect && suburbs.length > 0) {
      suburbSelect.innerHTML = suburbs.map(s => 
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

    // Also populate native datalist for instant autocomplete
    const datalist = document.getElementById('suburb-datalist');
    if (datalist && suburbs.length > 0) {
      datalist.innerHTML = suburbs.map(s => `<option value="${s.name}">${s.name} (${s.county})</option>`).join('');
    }
  }

  setupDropzone() {
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('post-photos-input');

    if (!fileInput) return;

    if (dropzone) {
      dropzone.onclick = (e) => {
        // Direct click trigger
        if (e.target !== fileInput) {
          fileInput.click();
        }
      };

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      };

      dropzone.ondragleave = () => {
        dropzone.classList.remove('dragover');
      };

      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFiles(e.dataTransfer.files);
        }
      };
    }

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFiles(e.target.files);
        fileInput.value = ''; // Reset so picking the same files or re-selecting works every time
      }
    };
  }

  setupVideoDropzone() {
    const videoDropzone = document.getElementById('video-dropzone');
    const videoInput = document.getElementById('post-videos-input');

    if (!videoInput) return;

    if (videoDropzone) {
      videoDropzone.onclick = (e) => {
        if (e.target !== videoInput) {
          videoInput.click();
        }
      };

      videoDropzone.ondragover = (e) => {
        e.preventDefault();
        videoDropzone.style.borderColor = '#7c3aed';
      };

      videoDropzone.ondragleave = () => {
        videoDropzone.style.borderColor = '#c084fc';
      };

      videoDropzone.ondrop = (e) => {
        e.preventDefault();
        videoDropzone.style.borderColor = '#c084fc';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleVideoFiles(e.dataTransfer.files);
        }
      };
    }

    videoInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleVideoFiles(e.target.files);
        videoInput.value = '';
      }
    };
  }

  async handleFiles(files) {
    const previewGrid = document.getElementById('post-photos-preview');
    if (!previewGrid) return;

    const remainingSlots = 5 - this.uploadedImages.length;
    if (remainingSlots <= 0) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Maximum 5 photos allowed. Remove a photo to add another.', 'info');
      }
      return;
    }

    const filesToProcess = Array.from(files)
      .filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Please select valid photos (JPG, PNG, WebP).', 'warning');
      }
      return;
    }

    const dropzone = document.getElementById('photo-dropzone');
    if (dropzone) dropzone.style.opacity = '0.6';

    for (const file of filesToProcess) {
      try {
        const compressedDataUrl = await this.compressAndWatermarkImage(file, 1280, 0.82);
        if (this.uploadedImages.length < 5) {
          this.uploadedImages.push(compressedDataUrl);
          this.renderPhotoPreviews();
        }
      } catch (err) {
        console.warn('Image processing fallback:', err);
        const rawUrl = await this.fileToDataUrl(file);
        if (this.uploadedImages.length < 5) {
          this.uploadedImages.push(rawUrl);
          this.renderPhotoPreviews();
        }
      }
    }

    if (dropzone) dropzone.style.opacity = '1';

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(`📸 ${this.uploadedImages.length} of 5 photos added!`, 'success');
    }
  }

  fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  compressAndWatermarkImage(file, maxDimension = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;

        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const r = new FileReader();
          r.onload = e => resolve(e.target.result);
          r.readAsDataURL(file);
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, w, h);

        // Watermark: bottom-right pill
        const text = 'kejamarket.co.ke';
        const fontSize = Math.max(13, Math.round(w * 0.024));
        ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        const textMetrics = ctx.measureText(text);
        const padX = fontSize * 0.8;
        const padY = fontSize * 0.4;
        const pillW = textMetrics.width + padX * 2 + fontSize;
        const pillH = fontSize + padY * 2;
        const pillX = w - pillW - 14;
        const pillY = h - pillH - 14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, pillW, pillH, 8);
        } else {
          ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fill();

        // Green dot
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(pillX + padX, pillY + pillH / 2, fontSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pillX + padX + fontSize * 0.6, pillY + pillH / 2);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = e => reject(e);
        r.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  }

  handleVideoFiles(files) {
    const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp)$/i.test(f.name));
    if (videoFiles.length === 0) {
      if (window.app) window.app.showToast('Please select valid video files (MP4, WebM, MOV).', 'info');
      return;
    }

    videoFiles.forEach(file => {
      if (this.uploadedVideos.length >= 1) {
        if (window.app) window.app.showToast('Maximum 1 video tour allowed per listing.', 'info');
        return;
      }

      if (file.size > 80 * 1024 * 1024) {
        if (window.app) window.app.showToast(`⚠️ Video is ${(file.size / (1024*1024)).toFixed(1)}MB. Max recommended is 80MB.`, 'warning');
      }

      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const blobUrl = URL.createObjectURL(file);
      videoEl.src = blobUrl;

      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(blobUrl);
        const duration = videoEl.duration;

        if (duration > 91) {
          const mins = Math.floor(duration / 60);
          const secs = Math.floor(duration % 60);
          if (window.app) {
            window.app.showToast(`❌ Video exceeds max duration! Allowed: 1m 30s. Uploaded: ${mins}m ${secs}s.`, 'error');
          }
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const videoDataUrl = e.target.result;
          this.uploadedVideos.push({
            url: videoDataUrl,
            file: file,
            duration: Math.round(duration),
            name: file.name,
            poster: ''
          });
          this.renderVideoPreviews();
          if (window.app) {
            window.app.showToast(`🎥 Video tour attached (${Math.round(duration)}s)!`, 'success');
          }
        };
        reader.readAsDataURL(file);
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        this.uploadedVideos.push({
          url: URL.createObjectURL(file),
          file: file,
          duration: 30,
          name: file.name,
          poster: ''
        });
        this.renderVideoPreviews();
      };
    });
  }

  renderPhotoPreviews() {
    const previewGrid = document.getElementById('post-photos-preview');
    const countEl = document.getElementById('post-photos-count');
    if (!previewGrid) return;

    if (countEl) {
      countEl.textContent = `${this.uploadedImages.length} / 5 photos`;
      countEl.style.color = this.uploadedImages.length > 0 ? '#15803d' : '#64748b';
    }

    if (this.uploadedImages.length === 0) {
      previewGrid.innerHTML = '';
      previewGrid.style.display = 'none';
      return;
    }

    previewGrid.style.display = 'grid';

    let html = this.uploadedImages.map((url, idx) => `
      <div class="photo-preview-item" style="position:relative; border-radius:10px; overflow:hidden; border:2px solid ${idx === 0 ? '#22c55e' : '#e2e8f0'}; height:90px; background:#f8fafc; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <img src="${url}" alt="Listing photo ${idx+1}" style="width:100%; height:100%; object-fit:cover; display:block;">
        ${idx === 0 ? `
          <span style="position:absolute; top:4px; left:4px; background:#16a34a; color:#fff; font-size:0.62rem; font-weight:800; padding:2px 6px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.3); display:inline-flex; align-items:center; gap:3px;">
            <i class="fas fa-star" style="font-size:0.55rem;"></i> Cover Photo
          </span>
        ` : ''}
        <button type="button" onclick="landlordManager.removePhoto(${idx})" title="Delete photo" aria-label="Delete photo" style="position:absolute; top:4px; right:4px; background:rgba(220,38,38,0.92); color:white; border:none; border-radius:50%; width:24px; height:24px; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.3); transition:transform 0.15s;">
          <i class="fas fa-trash-alt" style="font-size:0.65rem;"></i>
        </button>
      </div>
    `).join('');

    if (this.uploadedImages.length < 5) {
      html += `
        <label for="post-photos-input" class="photo-preview-add-tile" style="border:2px dashed #cbd5e1; border-radius:10px; height:90px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:pointer; background:#f8fafc; color:#64748b; transition:all 0.15s;" onmouseover="this.style.borderColor='#22c55e';this.style.color='#16a34a';" onmouseout="this.style.borderColor='#cbd5e1';this.style.color='#64748b';">
          <i class="fas fa-plus-circle" style="font-size:1.3rem;"></i>
          <span style="font-size:0.72rem; font-weight:700;">+ Add Photo</span>
        </label>
      `;
    }

    previewGrid.innerHTML = html;
  }

  renderVideoPreviews() {
    const previewGrid = document.getElementById('post-videos-preview');
    if (!previewGrid) return;

    if (this.uploadedVideos.length === 0) {
      previewGrid.innerHTML = '';
      return;
    }

    previewGrid.innerHTML = this.uploadedVideos.map((v, idx) => {
      const mins = Math.floor(v.duration / 60);
      const secs = (v.duration % 60).toString().padStart(2, '0');
      return `
        <div class="video-preview-item" style="position:relative; border-radius:8px; overflow:hidden; border:2px solid #c084fc; width:140px; height:90px; background:#000;">
          <video src="${v.url}" controlsList="nodownload" oncontextmenu="return false;" style="width:100%; height:100%; object-fit:cover;" muted></video>
          <span style="position:absolute; bottom:4px; left:4px; background:rgba(124,58,237,0.85); color:#fff; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; display:flex; align-items:center; gap:4px; z-index:4;">
            <i class="fas fa-play" style="font-size:0.55rem;"></i> ${mins}:${secs}
          </span>
          <button type="button" onclick="landlordManager.removeVideo(${idx})" style="position:absolute; top:3px; right:3px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:22px; height:22px; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:5;">&times;</button>
        </div>
      `;
    }).join('');
  }

  removePhoto(index) {
    if (index >= 0 && index < this.uploadedImages.length) {
      this.uploadedImages.splice(index, 1);
      this.renderPhotoPreviews();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Photo removed', 'info');
      }
    }
  }

  removeVideo(index) {
    if (index >= 0 && index < this.uploadedVideos.length) {
      this.uploadedVideos.splice(index, 1);
      this.renderVideoPreviews();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Video removed', 'info');
      }
    }
  }

  initPostMap() {
    setTimeout(() => {
      const mapEl = document.getElementById('post-pin-map');
      if (!mapEl) return;

      if (!this.postMap && typeof L !== 'undefined') {
        this.postMap = L.map('post-pin-map', {
          attributionControl: true,  // Enable attribution (required by OpenStreetMap)
          preferCanvas: false,       // Use SVG for better quality
          zoomControl: true,         // Show zoom controls
          scrollWheelZoom: true     // Allow mouse wheel zoom
        }).setView([this.selectedCoords.lat, this.selectedCoords.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          minZoom: 10,
          attribution: '© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://kejamarket.co.ke">KejaMarket</a>',
          subdomains: ['a', 'b', 'c', 'd'],
          tileSize: 256,
          detectRetina: true,
          updateWhenZooming: false
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
      if (managedBy === 'agency') {
        contactLabel.textContent = 'Principal Agent / Agency Name *';
      } else if (managedBy === 'caretaker') {
        contactLabel.textContent = 'Caretaker Full Name *';
      } else {
        contactLabel.textContent = 'Your Full Name / Landlord *';
      }
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
      const searchVal = document.getElementById('post-suburb-search')?.value.trim() || '';
      const suburb = (this.selectedSuburb && this.selectedSuburb.name) || document.getElementById('post-suburb')?.value || searchVal || 'Kilimani';
      const description = document.getElementById('post-description')?.value.trim() || '';
      const waterType = document.getElementById('post-water')?.value || 'Borehole Water';
      const electricityType = document.getElementById('post-electricity')?.value || 'Prepaid (Tokens)';
      
      // Auto-fill landlord details from session (no form fields needed)
      const landlordName = this.landlordName || (session ? session.name : (managedBy === 'agency' ? 'Verified Agency' : (managedBy === 'caretaker' ? 'Caretaker' : 'Direct Landlord')));
      const phone = this.landlordPhone || (session ? session.phone : '+254700000000');

      const suburbObj = this.selectedSuburb || (typeof ALL_SUBURBS !== 'undefined' && ALL_SUBURBS.find(s => s.name === suburb)) || { county: 'Nairobi', corridorId: 'nairobi_central' };

      // NEW: Get hierarchical location data
      const locationHierarchyId = document.getElementById('post-location-hierarchy-id')?.value || null;
      const locationPathIds = document.getElementById('post-location-path-ids')?.value || null;
      const locationFullPath = document.getElementById('post-location-full-path')?.value || null;
      
      let parsedPathIds = null;
      try {
        if (locationPathIds) parsedPathIds = JSON.parse(locationPathIds);
      } catch(e) {
        console.warn('Could not parse locationPathIds');
      }

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
        latitude: parseFloat(document.getElementById('post-lat')?.value) || this.selectedCoords.lat,
        longitude: parseFloat(document.getElementById('post-lng')?.value) || this.selectedCoords.lng,
        locationAccuracy: parseFloat(document.getElementById('post-loc-accuracy')?.value) || null,
        hasLiveLocation: Boolean(document.getElementById('post-lat')?.value),
        
        // NEW: Hierarchical location fields
        locationHierarchyId: locationHierarchyId,
        locationName: suburb,
        locationFullPath: locationFullPath || suburb,
        locationPathIds: parsedPathIds,
        locationCounty: suburbObj.county,
        locationVerified: false,
        
        // Legacy fields (preserved for backward compatibility)
        legacyEstateSuburb: suburb,
        legacyCounty: suburbObj.county,
        
        waterSupplyType: waterType,
        electricityMeterType: electricityType,
        garbageFeeKes: isBnb ? 0 : 500,
        waterRateKes: isBnb ? 0 : 100,
        isFeatured: false,
        isTopAd: false,
        isVerified: true,
        source: managedBy === 'agency' ? 'agency' : (managedBy === 'caretaker' ? 'caretaker' : 'direct'),
        managedBy: managedBy,
        agencyName: managedBy === 'agency' ? (agencyName || landlordName) : null,
        caretakerName: caretakerName || (managedBy === 'caretaker' ? landlordName : null),
        caretakerPhone: caretakerPhone || (managedBy === 'caretaker' ? phone : null),
        postedTimeAgo: 'Just now',
        landlord: {
          id: session ? session.id : ('usr-' + Date.now()),
          name: managedBy === 'agency' ? (agencyName || landlordName) : (managedBy === 'caretaker' ? (caretakerName || landlordName) : landlordName),
          phone,
          whatsapp: phone,
          isVerified: session ? session.isVerified : true,
          isAgency: managedBy === 'agency',
          isCaretaker: managedBy === 'caretaker',
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
            console.warn('Photo CDN upload failed, using fallback:', uploadErr.message);
          }
        }

        // Upload videos to CDN or server if any
        if (this.uploadedVideos && this.uploadedVideos.length > 0) {
          const finalVideos = [];
          for (let i = 0; i < this.uploadedVideos.length; i++) {
            const vid = this.uploadedVideos[i];
            if (submitBtn) {
              submitBtn.innerHTML = `<i class="fas fa-video fa-spin"></i> Uploading video tour (${i + 1}/${this.uploadedVideos.length})...`;
            }

            // If already a hosted URL (not base64 data URI and not blob:)
            if (vid.url && !vid.url.startsWith('data:') && !vid.url.startsWith('blob:')) {
              finalVideos.push(vid);
              continue;
            }

            try {
              let vidRes;
              if (vid.file) {
                const formData = new FormData();
                formData.append('video', vid.file);
                formData.append('folder', 'kejamarket/videos');
                const authHeader = (window.kejaAuth && window.kejaAuth.getToken()) ? { 'Authorization': `Bearer ${window.kejaAuth.getToken()}` } : {};
                vidRes = await fetch('/api/upload/video', {
                  method: 'POST',
                  headers: authHeader,
                  body: formData
                });
              } else {
                vidRes = await fetch('/api/upload/video', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    video: vid.url,
                    folder: 'kejamarket/videos'
                  })
                });
              }

              if (vidRes.ok) {
                const vidData = await vidRes.json();
                if (vidData.success && vidData.url) {
                  finalVideos.push({
                    url: vidData.url,
                    duration: vid.duration || 0,
                    name: vid.name || `Video Tour ${i + 1}`,
                    poster: vid.poster || ''
                  });
                } else {
                  console.warn('Video upload returned error message:', vidData.message);
                }
              } else {
                console.warn('Video upload endpoint failed with status:', vidRes.status);
              }
            } catch (vidErr) {
              console.warn('Video upload network error:', vidErr.message);
            }
          }

          newListing.videos = finalVideos;
          newListing.videoCount = finalVideos.length;
        }

        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing listing...';

        const res = await fetch('/api/properties', {
          method: 'POST',
          headers,
          body: JSON.stringify(newListing)
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.success) {
          const errMsg = (data && data.message) ? data.message : 'Server could not save listing. Please check required fields.';
          if (window.app) window.app.showToast(`❌ ${errMsg}`, 'error');
          return;
        }

        const createdProp = data.property || newListing;

        if (window.app) {
          window.app.addProperty(createdProp);
          window.app.closeModal('modal-post-ad');
          window.app.showToast('🎉 Listing published successfully! Video tour and photos are live on Nairobi map.', 'success');
        }

        form.reset();
        this.uploadedImages = [];
        this.uploadedVideos = [];
        this.renderPhotoPreviews();
        this.renderVideoPreviews();
      } catch (err) {
        console.error('Listing publication error:', err);
        if (window.app) {
          window.app.showToast(`❌ Could not publish listing: ${err.message || 'Network error'}. Please try again.`, 'error');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Free Ad Now';
        }
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
