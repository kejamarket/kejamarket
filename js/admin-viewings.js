/**
 * KejaMarket Admin Viewing Queue Module (Spec v1.1)
 * Real-time monitoring and dispatch for viewing requests and 60-second escalations
 */

const AdminViewings = {
  currentFilter: 'active',
  pollInterval: null,

  async init(filter = 'active') {
    this.currentFilter = filter;
    const contentArea = document.getElementById('admin-content') || document.querySelector('.admin-main-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div>
          <h1 style="margin:0; font-size:1.4rem; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-calendar-check" style="color:#00b53f;"></i> Live Viewing Operations Queue
          </h1>
          <p style="margin:4px 0 0 0; font-size:0.85rem; color:#64748b;">
            Spec v1.1: 60-second SLA escalation desk, caretaker dispatch & viewing outcome recording
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-secondary" onclick="AdminViewings.loadQueue()" style="padding:8px 14px; font-size:0.85rem; border-radius:8px; border:1.5px solid #cbd5e1; background:white; cursor:pointer;">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex; gap:8px; margin-bottom:18px; border-bottom:1.5px solid #e2e8f0; padding-bottom:8px;">
        <button class="tab-btn ${this.currentFilter === 'active' ? 'active' : ''}" onclick="AdminViewings.setFilter('active')"
          style="padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; border:none; background:${this.currentFilter === 'active' ? '#00b53f' : '#f1f5f9'}; color:${this.currentFilter === 'active' ? '#fff' : '#475569'};">
          Active Escalations
        </button>
        <button class="tab-btn ${this.currentFilter === 'escalated' ? 'active' : ''}" onclick="AdminViewings.setFilter('escalated')"
          style="padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; border:none; background:${this.currentFilter === 'escalated' ? '#dc2626' : '#f1f5f9'}; color:${this.currentFilter === 'escalated' ? '#fff' : '#475569'};">
          Escalated to Staff (>60s)
        </button>
        <button class="tab-btn ${this.currentFilter === 'all' ? 'active' : ''}" onclick="AdminViewings.setFilter('all')"
          style="padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; border:none; background:${this.currentFilter === 'all' ? '#00b53f' : '#f1f5f9'}; color:${this.currentFilter === 'all' ? '#fff' : '#475569'};">
          All Requests
        </button>
      </div>

      <div id="viewing-queue-list">
        <div style="text-align:center; padding:40px; color:#64748b;">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:#00b53f;"></i>
          <p style="margin-top:12px;">Loading live viewing queue...</p>
        </div>
      </div>
    `;

    await this.loadQueue();
    this.startAutoRefresh();
  },

  setFilter(filter) {
    this.currentFilter = filter;
    this.init(filter);
  },

  startAutoRefresh() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.loadQueue(true), 10000);
  },

  async loadQueue(isSilent = false) {
    const listEl = document.getElementById('viewing-queue-list');
    if (!listEl) return;

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/viewings/queue?filter=${this.currentFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch queue');

      // Update badge
      const badge = document.getElementById('admin-viewings-count');
      if (badge) {
        const escalatedCount = (data.queue || []).filter(q => q.status === 'escalated_to_admin').length;
        badge.textContent = escalatedCount;
        badge.style.display = escalatedCount > 0 ? 'inline-block' : 'none';
      }

      this.renderQueueTable(data.queue || []);
    } catch (err) {
      if (!isSilent && listEl) {
        listEl.innerHTML = `
          <div style="padding:20px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; color:#991b1b;">
            <i class="fas fa-exclamation-circle"></i> Failed to load queue: ${err.message}
          </div>
        `;
      }
    }
  },

  renderQueueTable(queue) {
    const listEl = document.getElementById('viewing-queue-list');
    if (!listEl) return;

    if (!queue || queue.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px;">
          <div style="width:60px; height:60px; border-radius:50%; background:#dcfce7; color:#15803d; display:inline-flex; align-items:center; justify-content:center; font-size:1.8rem; margin-bottom:12px;">
            <i class="fas fa-check"></i>
          </div>
          <h3 style="margin:0 0 6px 0; color:#0f172a; font-weight:800;">Queue is Clear</h3>
          <p style="margin:0; font-size:0.86rem; color:#64748b;">No viewing requests currently require staff intervention.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${queue.map(item => this.renderQueueCard(item)).join('')}
      </div>
    `;
  },

  renderQueueCard(item) {
    const isEscalated = item.status === 'escalated_to_admin';
    const isAwaitingPayment = item.status === 'slot_confirmed_awaiting_payment';
    const isConfirmed = item.status === 'booking_confirmed';
    const caretakerPhone = item.caretaker_phone || item.backup_contact_phone || 'None provided';

    return `
      <div style="background:#fff; border:${isEscalated ? '2px solid #ef4444' : '1px solid #e2e8f0'}; border-radius:14px; padding:18px; box-shadow:0 2px 6px rgba(0,0,0,0.04); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-weight:900; font-size:1.05rem; color:#0f172a;">${item.property_title || 'Listing'}</span>
              <span style="font-size:0.8rem; font-weight:700; color:#64748b;">(Ref: ${item.id.slice(-6).toUpperCase()})</span>
            </div>
            <div style="font-size:0.85rem; color:#475569;">
              <i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${item.property_location || 'Nairobi'} • 
              <strong>KSh ${Number(item.property_price || 0).toLocaleString()}/mo</strong>
            </div>
          </div>

          <div>
            ${isEscalated ? `
              <span style="background:#fee2e2; color:#dc2626; font-size:0.78rem; font-weight:800; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:5px; border:1px solid #fecaca;">
                <i class="fas fa-fire"></i> 60s SLA EXCEEDED — CALL CARETAKER
              </span>
            ` : isAwaitingPayment ? `
              <span style="background:#fef3c7; color:#92400e; font-size:0.78rem; font-weight:800; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
                <i class="fas fa-clock"></i> Awaiting Tenant KSh 200 Payment
              </span>
            ` : isConfirmed ? `
              <span style="background:#dcfce7; color:#15803d; font-size:0.78rem; font-weight:800; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;">
                <i class="fas fa-check-circle"></i> Booking Confirmed & Paid
              </span>
            ` : `
              <span style="background:#f1f5f9; color:#475569; font-size:0.78rem; font-weight:800; padding:4px 10px; border-radius:20px;">
                ${item.status}
              </span>
            `}
          </div>
        </div>

        <!-- Tenant & Caretaker Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; background:#f8fafc; border-radius:10px; padding:12px 14px; margin-bottom:14px; font-size:0.83rem;">
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:800; color:#64748b; margin-bottom:3px;">Tenant</div>
            <div style="font-weight:800; color:#0f172a;">${item.tenant_name || 'Tenant'}</div>
            <div style="color:#00b53f; font-weight:700;"><a href="tel:${item.tenant_phone}" style="color:inherit; text-decoration:none;"><i class="fas fa-phone-alt"></i> ${item.tenant_phone}</a></div>
          </div>

          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:800; color:#64748b; margin-bottom:3px;">Caretaker / Landlord</div>
            <div style="font-weight:800; color:#0f172a;">${item.caretaker_name || 'Property Manager'}</div>
            <div style="color:#2563eb; font-weight:700;"><a href="tel:${caretakerPhone}" style="color:inherit; text-decoration:none;"><i class="fas fa-phone-alt"></i> ${caretakerPhone}</a></div>
          </div>

          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:800; color:#64748b; margin-bottom:3px;">Requested Slot</div>
            <div style="font-weight:800; color:#0f172a;">${item.preferred_date}</div>
            <div style="color:#475569;">${item.preferred_time}</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
          <a href="tel:${caretakerPhone}" class="btn-secondary" style="padding:8px 14px; font-size:0.82rem; font-weight:700; border-radius:7px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">
            <i class="fas fa-phone-alt"></i> Call Caretaker
          </a>

          ${isEscalated ? `
            <button onclick="AdminViewings.openStaffConfirmModal('${item.id}', '${item.preferred_date}', '${item.preferred_time}')" class="btn-primary"
              style="padding:8px 14px; font-size:0.82rem; font-weight:800; border-radius:7px; background:#00b53f; color:white; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-check"></i> Staff Confirm Slot
            </button>
            <button onclick="AdminViewings.declineRequest('${item.id}')" class="btn-secondary"
              style="padding:8px 12px; font-size:0.82rem; font-weight:700; border-radius:7px; background:#fff; color:#dc2626; border:1px solid #fecaca; cursor:pointer;">
              Decline
            </button>
          ` : ''}

          ${isConfirmed ? `
            <button onclick="AdminViewings.recordOutcome('${item.booking_id || item.id}', 'completed')" class="btn-primary"
              style="padding:8px 12px; font-size:0.82rem; font-weight:700; border-radius:7px; background:#059669; color:white; border:none; cursor:pointer;">
              <i class="fas fa-check-double"></i> Mark Completed
            </button>
            <button onclick="AdminViewings.recordOutcome('${item.booking_id || item.id}', 'tenant_no_show')" class="btn-secondary"
              style="padding:8px 12px; font-size:0.82rem; font-weight:700; border-radius:7px; background:#fff; color:#d97706; border:1px solid #fde68a; cursor:pointer;">
              Tenant No-Show
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  async openStaffConfirmModal(requestId, date, time) {
    const notes = prompt('Enter confirmation notes (e.g. "Called caretaker Mwangi, slot confirmed for unit 4B"):', 'Confirmed via phone by KejaMarket operations team');
    if (notes === null) return;

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/viewings/${requestId}/staff-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmedDate: date,
          confirmedTime: time,
          notes
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Confirmation failed');
      alert('Viewing slot confirmed by staff. Tenant notified to pay KSh 200 within 15 minutes.');
      this.loadQueue();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  },

  async declineRequest(requestId) {
    const reason = prompt('Reason for declining request:', 'Property manager unavailable at requested time');
    if (reason === null) return;

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`/api/viewings/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Decline failed');
      this.loadQueue();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  },

  async recordOutcome(bookingId, outcome) {
    const notes = prompt(`Notes for outcome (${outcome}):`, '');
    if (notes === null) return;

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/viewings/${bookingId}/outcome`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ outcome, notes })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Outcome update failed');
      alert(`Outcome recorded: ${outcome}`);
      this.loadQueue();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }
};

window.AdminViewings = AdminViewings;
