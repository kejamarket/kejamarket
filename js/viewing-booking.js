/**
 * KejaMarket - Comprehensive Viewing & Tour Booking System
 * Seamlessly synced between Desktop and PWA:
 * Supports 100% Free In-Person Walk-Ins and Live WhatsApp Video Tours
 */

const KejaViewing = {
  currentProperty: null,
  selectedViewingType: 'physical',
  selectedViewingTime: '10:00 AM',

  /**
   * Open the viewing booking modal for a property
   * @param {string} propertyId
   * @param {'physical'|'virtual'} initialType
   */
  async openBookingModal(propertyId, initialType = 'physical') {
    if (!propertyId && window.app && app.selectedPropertyForDetail) {
      propertyId = app.selectedPropertyForDetail.id;
    }

    if (!propertyId) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast('Please select a property first.', 'error');
      }
      return;
    }

    this.selectedViewingType = initialType || 'physical';
    this.selectedViewingTime = '10:00 AM';

    // Retrieve property details
    if (window.app && app.selectedPropertyForDetail && app.selectedPropertyForDetail.id === propertyId) {
      this.currentProperty = app.selectedPropertyForDetail;
    } else if (window.app && app.properties) {
      this.currentProperty = app.properties.find(p => p.id === propertyId);
    }

    if (!this.currentProperty) {
      try {
        const res = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`);
        if (res.ok) {
          const data = await res.json();
          this.currentProperty = data.property || data;
        }
      } catch (err) {
        console.warn('Property fetch for booking:', err);
      }
    }

    this.renderInitialBookingForm();
    if (window.app && typeof app.openModal === 'function') {
      app.openModal('modal-viewing-booking');
    }
  },

  selectViewingType(type, el) {
    this.selectedViewingType = type;
    document.querySelectorAll('.km-viewing-type-btn').forEach(b => {
      b.classList.remove('active');
    });
    if (el) el.classList.add('active');
    else {
      const target = document.getElementById(type === 'virtual' ? 'km-vtype-virtual' : 'km-vtype-physical');
      if (target) target.classList.add('active');
    }
  },

  selectViewingTime(time, el) {
    this.selectedViewingTime = time;
    document.querySelectorAll('.km-fchip').forEach(b => {
      b.classList.remove('active');
    });
    if (el) el.classList.add('active');
  },

  renderInitialBookingForm() {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    const prop = this.currentProperty || (window.app && app.selectedPropertyForDetail) || {};
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
    const rent = prop.rentKes || prop.rent || prop.price || 0;
    const formattedRent = typeof rent === 'number' ? rent.toLocaleString() : rent;
    const today = new Date().toISOString().split('T')[0];
    const isVirtual = this.selectedViewingType === 'virtual';

    container.innerHTML = `
      <div class="km-booking-wrapper" style="padding: 4px;">
        <!-- Property Mini Card -->
        <div style="display:flex; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:14px; align-items:center;">
          <img src="${thumb}" style="width:68px; height:68px; border-radius:8px; object-fit:cover; flex-shrink:0;" alt="${prop.title || 'Property'}">
          <div style="min-width:0;">
            <div style="font-weight:800; font-size:14px; color:#0f172a; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prop.title || 'Selected Property'}</div>
            <div style="font-size:14px; font-weight:900; color:#006818;">KSh ${formattedRent}/mo</div>
            <div style="font-size:11.5px; color:#64748b;"><i class="fas fa-map-marker-alt" style="color:#006818;"></i> ${prop.estateSuburb || prop.county || 'Nairobi'} &middot; Verified Unit</div>
          </div>
        </div>

        <!-- 100% Free Inspection Guarantee Card -->
        <div class="km-zero-viewing-fee-card" style="margin-bottom:16px;">
          <div class="km-zero-fee-icon"><i class="fas fa-shield-alt"></i></div>
          <div class="km-zero-fee-content">
            <div class="km-zero-fee-title"><i class="fas fa-check-circle" style="color:#006818;"></i> 100% Free Inspection Guaranteed</div>
            <div class="km-zero-fee-sub">KejaMarket bans all viewing fees. Inspect this home with zero upfront charges before paying anything.</div>
          </div>
        </div>

        <!-- Inspection Mode Selector (Physical vs Virtual WhatsApp Video) -->
        <div style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:8px;">Choose Inspection Mode:</div>
          <div class="km-viewing-type-selector">
            <div class="km-viewing-type-btn ${!isVirtual ? 'active' : ''}" id="km-vtype-physical" onclick="KejaViewing.selectViewingType('physical', this)">
              <i class="fas fa-walking"></i>
              <strong>In-Person Walk-In</strong>
              <span>Meet caretaker at gate</span>
            </div>
            <div class="km-viewing-type-btn ${isVirtual ? 'active' : ''}" id="km-vtype-virtual" onclick="KejaViewing.selectViewingType('virtual', this)">
              <i class="fab fa-whatsapp"></i>
              <strong>Live Video Tour</strong>
              <span>WhatsApp live inspection</span>
            </div>
          </div>
        </div>

        <!-- Preferred Date Picker -->
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Select Preferred Viewing Date</label>
          <input type="date" id="vr-preferred-date" value="${today}" min="${today}"
            style="width:100%; height:40px; padding:0 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13.5px; font-weight:600; color:#0f172a; outline:none; box-sizing:border-box;">
        </div>

        <!-- Preferred Time Slot Pills -->
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Select Preferred Time Slot</label>
          <div class="km-filter-chip-grid">
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('09:00 AM', this)">09:00 AM</div>
            <div class="km-fchip active" onclick="KejaViewing.selectViewingTime('10:00 AM', this)">10:00 AM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('11:00 AM', this)">11:00 AM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('12:00 PM', this)">12:00 PM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('01:00 PM', this)">01:00 PM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('02:00 PM', this)">02:00 PM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('03:00 PM', this)">03:00 PM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('04:00 PM', this)">04:00 PM</div>
            <div class="km-fchip" onclick="KejaViewing.selectViewingTime('05:00 PM', this)">05:00 PM</div>
          </div>
        </div>

        <!-- Note to Landlord / Caretaker -->
        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Note to Landlord / Caretaker (Optional)</label>
          <textarea id="vr-notes" placeholder="e.g. Coming with my roommate to inspect water pressure and kitchen layout..."
            style="width:100%; height:65px; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13px; color:#0f172a; box-sizing:border-box; outline:none; resize:none;"></textarea>
        </div>

        <!-- Submit Button -->
        <button type="button" id="vr-submit-btn" onclick="KejaViewing.handleFormSubmit(event)"
          style="width:100%; height:46px; background:#00b53f; color:#ffffff; border:none; border-radius:10px; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(0,181,63,0.35); transition:all 0.2s ease;">
          <i class="fas fa-paper-plane"></i> Submit Free Viewing Request
        </button>
      </div>
    `;
  },

  handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const prop = this.currentProperty || (window.app && app.selectedPropertyForDetail) || {};
    const viewingType = this.selectedViewingType || 'physical';
    const date = document.getElementById('vr-preferred-date')?.value || new Date().toISOString().split('T')[0];
    const time = this.selectedViewingTime || '10:00 AM';
    const notes = document.getElementById('vr-notes')?.value || '';

    // Record viewing request locally
    try {
      const stored = JSON.parse(localStorage.getItem('keja_viewings') || '[]');
      stored.unshift({
        id: 'viewing_' + Date.now(),
        propertyId: prop.id,
        propertyTitle: prop.title,
        viewingType,
        date,
        time,
        notes,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('keja_viewings', JSON.stringify(stored));
    } catch (err) {}

    // Send to backend API asynchronously
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    if (token) {
      fetch('/api/viewings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: prop.id,
          preferredDate: date,
          preferredTime: time,
          notes: `[${viewingType === 'virtual' ? 'Live Video Tour' : 'In-Person Walk-In'}] ${notes}`
        })
      }).catch(err => console.warn('Viewing API submission warning:', err));
    }

    this.renderConfirmedScreen({
      prop,
      viewingType,
      date,
      time
    });
  },

  renderConfirmedScreen(params) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    const prop = params.prop || {};
    const isVirtual = params.viewingType === 'virtual';
    const dateLabel = params.date ? new Date(params.date).toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : params.date;
    const phone = (prop.landlord?.whatsapp || prop.whatsapp || prop.landlord?.phone || prop.phone || prop.caretakerPhone || '+254792409540').replace(/[^0-9]/g, '');
    const cleanWa = phone.replace(/^0/, '254');
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

    container.innerHTML = `
      <div style="padding:16px 8px; text-align:center;">
        <!-- Success Icon Badge -->
        <div style="width:72px; height:72px; border-radius:50%; background:${isVirtual ? '#dcfce7' : '#dcfce7'}; color:#15803d; font-size:32px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; box-shadow:0 4px 16px rgba(0,181,63,0.2);">
          <i class="${isVirtual ? 'fab fa-whatsapp' : 'fas fa-calendar-check'}"></i>
        </div>

        <h3 style="font-size:1.25rem; font-weight:900; color:#0f172a; margin:0 0 6px 0;">
          ${isVirtual ? '📱 WhatsApp Video Tour Booked!' : '✅ Free Viewing Request Sent!'}
        </h3>
        <p style="font-size:0.86rem; color:#64748b; margin:0 0 16px 0;">
          ${isVirtual
            ? 'The caretaker will connect with you via live WhatsApp video at the scheduled time.'
            : 'The property manager and building caretaker have been alerted for your arrival.'}
        </p>

        <!-- Summary Card -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:left; margin-bottom:18px;">
          <div style="display:flex; gap:10px; align-items:center; padding-bottom:10px; border-bottom:1px solid #e2e8f0; margin-bottom:10px;">
            <img src="${thumb}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;" alt="Property">
            <div style="min-width:0;">
              <div style="font-weight:800; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prop.title || 'Selected Property'}</div>
              <div style="font-size:12px; color:#006818; font-weight:700;">KSh ${Number(prop.rentKes || prop.rent || 0).toLocaleString()}/mo</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; text-align:center;">
              <i class="${isVirtual ? 'fab fa-whatsapp' : 'fas fa-walking'}" style="color:#006818; font-size:16px; margin-bottom:2px; display:block;"></i>
              <div style="font-size:10px; color:#64748b; font-weight:600;">Inspection Type</div>
              <div style="font-size:12px; font-weight:800; color:#0f172a;">${isVirtual ? 'Live Video Tour' : 'In-Person Walk-In'}</div>
            </div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; text-align:center;">
              <i class="fas fa-clock" style="color:#006818; font-size:16px; margin-bottom:2px; display:block;"></i>
              <div style="font-size:10px; color:#64748b; font-weight:600;">Time Slot</div>
              <div style="font-size:12px; font-weight:800; color:#0f172a;">${params.time}</div>
            </div>
          </div>
          <div style="margin-top:8px; background:#f0fdf4; border-radius:8px; padding:7px; text-align:center; font-size:12px; font-weight:700; color:#166534;">
            <i class="fas fa-calendar-alt"></i> ${dateLabel}
          </div>
        </div>

        <!-- Action Links -->
        ${isVirtual ? `
          <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi! I have booked a WhatsApp Live Video Tour on KejaMarket for: *${prop.title || 'your property'}* on ${dateLabel} at ${params.time}. Please confirm when you are ready for the live video inspection. Thank you!`)}"
             target="_blank" rel="noopener noreferrer"
             style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:46px; background:#25D366; color:#ffffff; border-radius:10px; font-size:14.5px; font-weight:800; text-decoration:none; margin-bottom:10px; box-shadow:0 3px 10px rgba(37,211,102,0.35);">
            <i class="fab fa-whatsapp" style="font-size:18px;"></i> Open Live Video Chat on WhatsApp
          </a>
        ` : `
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <a href="tel:${phone}"
               style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; height:44px; background:#006818; color:#ffffff; border-radius:10px; font-size:13.5px; font-weight:800; text-decoration:none;">
              <i class="fas fa-phone-alt"></i> Call Caretaker
            </a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${prop.latitude || -1.286389},${prop.longitude || 36.817223}"
               target="_blank" rel="noopener noreferrer"
               style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; height:44px; background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; border-radius:10px; font-size:13.5px; font-weight:800; text-decoration:none;">
              <i class="fas fa-directions"></i> Get Directions
            </a>
          </div>
        `}

        <button type="button" class="btn-secondary" onclick="app.closeModal('modal-viewing-booking')"
          style="width:100%; height:38px; border:1px solid #cbd5e1; background:#ffffff; color:#64748b; font-size:13px; font-weight:700; border-radius:8px; cursor:pointer;">
          Back to Listings
        </button>
      </div>
    `;
  }
};

window.KejaViewing = KejaViewing;
