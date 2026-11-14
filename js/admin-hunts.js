/**
 * KejaMarket Admin — House Hunt Concierge Management Module
 * Connects to /api/admin/house-hunts endpoints
 */

const AdminHunts = (() => {
  let _hunts = [];
  let _currentHunt = null;

  function getToken() {
    return localStorage.getItem('keja_token');
  }

  function formatPrice(val) {
    const n = Number(val);
    if (!n) return '0';
    return n.toLocaleString('en-KE');
  }

  function formatRemaining(ms) {
    if (ms === null || ms === undefined) return '—';
    if (ms <= 0) return '<span style="color:#ef4444; font-weight:800;">EXPIRED</span>';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const color = hours < 12 ? '#ef4444' : (hours < 24 ? '#f59e0b' : '#10b981');
    return `<span style="color:${color}; font-weight:800;">${hours}h ${mins}m left</span>`;
  }

  function getStatusBadge(status) {
    const map = {
      'PAYMENT_PENDING': { label: 'Payment Pending', bg: '#fef3c7', text: '#92400e' },
      'ACTIVE': { label: 'Active', bg: '#dcfce7', text: '#15803d' },
      'REQUIREMENTS_REVIEW': { label: 'Reviewing Req.', bg: '#e0e7ff', text: '#3730a3' },
      'SEARCHING': { label: 'Agent Searching', bg: '#e0f2fe', text: '#0369a1' },
      'PROPERTIES_FOUND': { label: 'Properties Found', bg: '#f3e8ff', text: '#7e22ce' },
      'VIEWING_ARRANGED': { label: 'Viewing Arranged', bg: '#fef08a', text: '#854d0e' },
      'CUSTOMER_REVIEWING': { label: 'Customer Reviewing', bg: '#ecfdf5', text: '#065f46' },
      'COMPLETED': { label: 'Completed', bg: '#bbf7d0', text: '#14532d' },
      'EXPIRED': { label: 'Expired', bg: '#fee2e2', text: '#991b1b' },
      'CANCELLED': { label: 'Cancelled', bg: '#f1f5f9', text: '#475569' }
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', text: '#475569' };
    return `<span style="background:${s.bg}; color:${s.text}; padding:4px 10px; border-radius:12px; font-weight:800; font-size:0.75rem; text-transform:uppercase;">${s.label}</span>`;
  }

  async function loadHouseHunts() {
    const content = document.getElementById('admin-content');
    if (!content) return;

    content.innerHTML = `
      <div class="dashboard-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <a href="/" style="display:inline-flex; align-items:center; gap:6px; color:#006818; text-decoration:none; font-weight:800; font-size:12.5px; margin-bottom:6px; background:#e8f8ee; padding:4px 10px; border-radius:6px;">
            <i class="fas fa-arrow-left"></i> Back to KejaMarket Home
          </a>
          <h1 style="font-size:1.6rem; font-weight:800; color:#0f172a; margin:0;"><i class="fas fa-search-location" style="color:#059669;"></i> House Hunt Concierge (3-Day Search)</h1>
          <p style="color:#64748b; font-size:0.88rem; margin:4px 0 0 0;">Manage personalized 72-hour property search requests & physical viewing arrangements.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <a href="/" style="display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px; font-weight:700; text-decoration:none; background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; font-size:13px;">
            <i class="fas fa-home"></i> Back to Site
          </a>
          <button class="btn-primary" onclick="AdminHunts.loadHouseHunts()" style="display:flex; align-items:center; gap:6px; background:#059669; padding:8px 16px; border-radius:8px; font-weight:700; border:none; color:white; cursor:pointer;">
            <i class="fas fa-sync-alt"></i> Refresh Hunts
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div id="hunt-stats-bar" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-bottom:24px;">
        <div class="admin-stat-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Total Hunts</div>
          <div style="font-size:1.6rem; font-weight:900; color:#0f172a; margin-top:4px;" id="stat-hunt-total">—</div>
        </div>
        <div class="admin-stat-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="font-size:0.75rem; font-weight:700; color:#059669; text-transform:uppercase;">Active / Searching</div>
          <div style="font-size:1.6rem; font-weight:900; color:#059669; margin-top:4px;" id="stat-hunt-active">—</div>
        </div>
        <div class="admin-stat-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="font-size:0.75rem; font-weight:700; color:#d97706; text-transform:uppercase;">Viewing Arranged</div>
          <div style="font-size:1.6rem; font-weight:900; color:#d97706; margin-top:4px;" id="stat-hunt-viewings">—</div>
        </div>
        <div class="admin-stat-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="font-size:0.75rem; font-weight:700; color:#2563eb; text-transform:uppercase;">Completed</div>
          <div style="font-size:1.6rem; font-weight:900; color:#2563eb; margin-top:4px;" id="stat-hunt-done">—</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
        <button class="btn-filter-pill active" data-hunt-filter="all" onclick="AdminHunts.filterHunts('all')">All</button>
        <button class="btn-filter-pill" data-hunt-filter="ACTIVE" onclick="AdminHunts.filterHunts('ACTIVE')">Active / Live</button>
        <button class="btn-filter-pill" data-hunt-filter="SEARCHING" onclick="AdminHunts.filterHunts('SEARCHING')">Searching</button>
        <button class="btn-filter-pill" data-hunt-filter="VIEWING_ARRANGED" onclick="AdminHunts.filterHunts('VIEWING_ARRANGED')">Viewing Arranged</button>
        <button class="btn-filter-pill" data-hunt-filter="COMPLETED" onclick="AdminHunts.filterHunts('COMPLETED')">Completed</button>
      </div>

      <!-- Bulk Action Bar -->
      <div id="hunt-bulk-bar" style="display:none; background:#ecfdf5; border:1.5px solid #059669; border-radius:10px; padding:12px 18px; margin-bottom:16px; align-items:center; justify-content:space-between; box-shadow:0 4px 12px rgba(5,150,105,0.12);">
        <div style="font-weight:700; color:#065f46; display:flex; align-items:center; gap:8px;">
          <i class="fas fa-tasks" style="font-size:1.1rem;"></i>
          <span><span id="hunt-selected-count" style="font-size:1.1rem; font-weight:900;">0</span> house hunts selected</span>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn-danger" onclick="AdminHunts.bulkDeleteHunts()" style="background:#dc2626; color:white; font-weight:800; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-trash-alt"></i> Delete Selected Hunts
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; box-shadow:0 4px 15px -3px rgba(0,0,0,0.05);">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:1.5px solid #e2e8f0; color:#475569; font-weight:800; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.5px;">
                <th style="padding:14px 10px; width:40px; text-align:center;">
                  <input type="checkbox" id="hunt-select-all" onchange="AdminHunts.toggleSelectAll(this)" style="width:17px; height:17px; cursor:pointer;">
                </th>
                <th style="padding:14px 18px;">Customer</th>
                <th style="padding:14px 18px;">Locations & Budget</th>
                <th style="padding:14px 18px;">Status</th>
                <th style="padding:14px 18px;">Time Remaining</th>
                <th style="padding:14px 18px;">Properties</th>
                <th style="padding:14px 18px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="hunt-table-body">
              <tr>
                <td colspan="6" style="padding:32px; text-align:center; color:#64748b;">
                  <i class="fas fa-spinner fa-spin"></i> Loading House Hunts...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Container for Hunt Management -->
      <div id="hunt-detail-modal-root"></div>
    `;

    try {
      const res = await fetch('/api/admin/house-hunts', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.hunts)) {
        _hunts = data.hunts;
        renderStats();
        renderTable(_hunts);
      } else {
        document.getElementById('hunt-table-body').innerHTML = `
          <tr><td colspan="6" style="padding:24px; text-align:center; color:#ef4444;">${data.message || 'No hunts found.'}</td></tr>
        `;
      }
    } catch (e) {
      console.error('Failed to load hunts:', e);
      document.getElementById('hunt-table-body').innerHTML = `
        <tr><td colspan="6" style="padding:24px; text-align:center; color:#ef4444;">Error loading hunts: ${e.message}</td></tr>
      `;
    }
  }

  function renderStats() {
    const total = _hunts.length;
    const active = _hunts.filter(h => ['ACTIVE', 'SEARCHING', 'PROPERTIES_FOUND', 'REQUIREMENTS_REVIEW'].includes(h.status)).length;
    const viewings = _hunts.filter(h => h.status === 'VIEWING_ARRANGED').length;
    const done = _hunts.filter(h => h.status === 'COMPLETED').length;

    const elTotal = document.getElementById('stat-hunt-total');
    const elActive = document.getElementById('stat-hunt-active');
    const elViewings = document.getElementById('stat-hunt-viewings');
    const elDone = document.getElementById('stat-hunt-done');
    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elViewings) elViewings.textContent = viewings;
    if (elDone) elDone.textContent = done;

    // Update nav badge
    const badge = document.getElementById('admin-hunts-count');
    if (badge) {
      badge.textContent = active;
      badge.style.display = active > 0 ? 'inline-block' : 'none';
    }
  }

  function renderTable(hunts) {
    const tbody = document.getElementById('hunt-table-body');
    if (!tbody) return;

    if (!hunts.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:36px; text-align:center; color:#64748b;">
            <i class="fas fa-search-location" style="font-size:2rem; color:#cbd5e1; margin-bottom:8px;"></i>
            <div>No House Hunts matching this filter.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = hunts.map(h => {
      const locs = Array.isArray(h.preferredLocations) ? h.preferredLocations.join(', ') : (h.preferredLocations || 'Any');
      const budget = `KSh ${formatPrice(h.budgetMin)} – ${formatPrice(h.budgetMax)}`;
      const customer = h.customerName || h.customerId || 'Customer';
      const cleanPhone = (h.customerPhone || '').replace(/[^0-9]/g, '');
      const phone = h.customerPhone ? `<a href="tel:${h.customerPhone}" style="color:#059669; text-decoration:none; font-weight:700;"><i class="fas fa-phone-alt"></i> +${h.customerPhone}</a>` : '—';
      const propsCount = h.propertiesFound || 0;
      const viewingsCount = h.viewingsArranged || 0;
      const isPaid = h.paymentStatus === 'SUCCESS' || h.paymentStatus === 'PAID';

      return `
        <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <td style="padding:14px 10px; text-align:center;">
            <input type="checkbox" class="hunt-row-cb" value="${h.id}" onchange="AdminHunts.updateBulkBar()" style="width:17px; height:17px; cursor:pointer;">
          </td>
          <td style="padding:14px 18px;">
            <div style="font-weight:800; color:#0f172a;">${customer}</div>
            <div style="font-size:0.78rem; color:#64748b; margin-top:3px;">${phone}</div>
            <div style="font-size:0.72rem; color:#94a3b8; font-family:monospace;">ID: ${h.id.slice(-8)}</div>
          </td>
          <td style="padding:14px 18px;">
            <div style="font-weight:700; color:#334155; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${locs}</div>
            <div style="font-size:0.8rem; color:#059669; font-weight:800; margin-top:2px;">${budget}</div>
            <div style="font-size:0.75rem; color:#64748b;">${h.bedrooms !== null ? h.bedrooms + ' Bed · ' : ''}${h.propertyType || 'Rental'}</div>
          </td>
          <td style="padding:14px 18px;">
            ${getStatusBadge(h.status)}
            ${isPaid ? '<span style="display:block; margin-top:4px; font-size:0.72rem; color:#059669; font-weight:700;"><i class="fas fa-check-circle"></i> Paid KSh 2,000</span>' : '<span style="display:block; margin-top:4px; font-size:0.72rem; color:#d97706; font-weight:700;">Payment Pending</span>'}
          </td>
          <td style="padding:14px 18px;">
            ${formatRemaining(h.timeRemainingMs)}
          </td>
          <td style="padding:14px 18px;">
            <div style="font-weight:800; color:#0f172a;"><i class="fas fa-home" style="color:#059669;"></i> ${propsCount} found</div>
            <div style="font-size:0.78rem; color:#d97706; font-weight:700;"><i class="fas fa-calendar-check"></i> ${viewingsCount} viewings</div>
          </td>
          <td style="padding:14px 18px; text-align:right;">
            <div style="display:inline-flex; gap:6px; align-items:center; justify-content:flex-end;">
              <button class="btn-primary" onclick="AdminHunts.openManageModal('${h.id}')" title="Manage Hunt & Assign Properties" style="padding:7px 12px; font-size:0.8rem; font-weight:800; border-radius:7px; background:#0f172a; border:none; color:white; cursor:pointer;">
                <i class="fas fa-tasks"></i> Manage
              </button>
              ${!isPaid ? `
                <button onclick="AdminHunts.activateHunt('${h.id}')" title="Activate 72h Search & Mark as Paid" style="padding:7px 10px; font-size:0.78rem; font-weight:800; border-radius:7px; background:#dcfce7; color:#15803d; border:1px solid #86efac; cursor:pointer;">
                  <i class="fas fa-bolt"></i> Activate
                </button>
              ` : ''}
              ${cleanPhone ? `
                <a href="https://wa.me/${cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone}" target="_blank" title="WhatsApp Customer" style="padding:6px 9px; font-size:0.82rem; border-radius:7px; background:#25d366; color:white; text-decoration:none; display:inline-flex; align-items:center;">
                  <i class="fab fa-whatsapp"></i>
                </a>
              ` : ''}
              <button onclick="AdminHunts.deleteHunt('${h.id}')" title="Delete Hunt" style="padding:7px 10px; font-size:0.8rem; border-radius:7px; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; cursor:pointer;">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterHunts(filter) {
    document.querySelectorAll('.btn-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.huntFilter === filter);
      btn.style.background = btn.dataset.huntFilter === filter ? '#059669' : '#f1f5f9';
      btn.style.color = btn.dataset.huntFilter === filter ? '#ffffff' : '#334155';
    });

    if (filter === 'all') {
      renderTable(_hunts);
    } else if (filter === 'ACTIVE') {
      renderTable(_hunts.filter(h => ['ACTIVE', 'SEARCHING', 'PROPERTIES_FOUND', 'REQUIREMENTS_REVIEW'].includes(h.status)));
    } else {
      renderTable(_hunts.filter(h => h.status === filter));
    }
  }

  async function openManageModal(huntId) {
    const root = document.getElementById('hunt-detail-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop" style="display:flex; align-items:center; justify-content:center; z-index:3200; position:fixed; inset:0; background:rgba(0,0,0,0.6);">
        <div class="modal-dialog" style="max-width:860px; width:95%; max-height:90vh; overflow-y:auto; background:#ffffff; border-radius:18px; padding:0; box-shadow:0 25px 60px rgba(0,0,0,0.3);">
          <div style="padding:24px; text-align:center;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:#059669;"></i>
            <div style="margin-top:10px; font-weight:700; color:#334155;">Loading Hunt Details...</div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch hunt details');

      _currentHunt = data;
      renderManageModal(data);
    } catch (e) {
      alert('Error: ' + e.message);
      root.innerHTML = '';
    }
  }

  function renderManageModal(data) {
    const root = document.getElementById('hunt-detail-modal-root');
    if (!root) return;

    const hunt = data.hunt;
    const properties = data.properties || [];
    const messages = data.messages || [];

    const locs = Array.isArray(hunt.preferredLocations) ? hunt.preferredLocations.join(', ') : (hunt.preferredLocations || 'Any');
    const budget = `KSh ${formatPrice(hunt.budgetMin)} – ${formatPrice(hunt.budgetMax)}`;

    root.innerHTML = `
      <div class="modal-backdrop" style="display:flex; align-items:center; justify-content:center; z-index:3200; position:fixed; inset:0; background:rgba(0,0,0,0.6);">
        <div class="modal-dialog" style="max-width:920px; width:95%; max-height:90vh; display:flex; flex-direction:column; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div style="background:#0f172a; color:white; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:900; font-size:1.2rem;">Hunt: ${hunt.customerName || 'Customer'}</span>
                ${getStatusBadge(hunt.status)}
              </div>
              <div style="font-size:0.8rem; color:#94a3b8; margin-top:3px;">
                Phone: <strong>+${hunt.customerPhone || '—'}</strong> · Locations: <strong>${locs}</strong> · Budget: <strong>${budget}</strong>
              </div>
            </div>
            <button type="button" onclick="document.getElementById('hunt-detail-modal-root').innerHTML=''" style="background:none; border:none; color:white; font-size:1.8rem; cursor:pointer;">&times;</button>
          </div>

          <!-- Body -->
          <div style="padding:22px 24px; overflow-y:auto; flex:1; background:#f8fafc;">

            <!-- Status & Notes Control Card -->
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:20px;">
              <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:800; color:#0f172a;"><i class="fas fa-sliders-h" style="color:#059669;"></i> Hunt Workflow Controls</h4>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px;">
                <div>
                  <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Workflow Status</label>
                  <select id="modal-hunt-status" style="width:100%; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-weight:700; font-size:0.88rem;">
                    <option value="ACTIVE" ${hunt.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                    <option value="REQUIREMENTS_REVIEW" ${hunt.status === 'REQUIREMENTS_REVIEW' ? 'selected' : ''}>REQUIREMENTS_REVIEW</option>
                    <option value="SEARCHING" ${hunt.status === 'SEARCHING' ? 'selected' : ''}>SEARCHING</option>
                    <option value="PROPERTIES_FOUND" ${hunt.status === 'PROPERTIES_FOUND' ? 'selected' : ''}>PROPERTIES_FOUND</option>
                    <option value="VIEWING_ARRANGED" ${hunt.status === 'VIEWING_ARRANGED' ? 'selected' : ''}>VIEWING_ARRANGED</option>
                    <option value="CUSTOMER_REVIEWING" ${hunt.status === 'CUSTOMER_REVIEWING' ? 'selected' : ''}>CUSTOMER_REVIEWING</option>
                    <option value="COMPLETED" ${hunt.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
                    <option value="EXPIRED" ${hunt.status === 'EXPIRED' ? 'selected' : ''}>EXPIRED</option>
                    <option value="CANCELLED" ${hunt.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Viewings Arranged Count</label>
                  <input type="number" id="modal-hunt-viewings" value="${hunt.viewingsArranged || 0}" style="width:100%; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-weight:700; font-size:0.88rem;">
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#475569; margin-bottom:4px;">Internal Admin Notes</label>
                <textarea id="modal-hunt-notes" rows="2" placeholder="Notes for team on landlord viewings, gatekeeper contacts, etc." style="width:100%; padding:8px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">${hunt.adminNotes || ''}</textarea>
              </div>
              <button type="button" class="btn-primary" onclick="AdminHunts.saveHuntUpdates('${hunt.id}')" style="background:#059669; padding:8px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; border:none; color:white; cursor:pointer;">
                <i class="fas fa-save"></i> Save Workflow Status
              </button>
              <button type="button" onclick="AdminHunts.dispatchScoutPrompt('${hunt.id}')" style="background:linear-gradient(135deg,#f59e0b,#d97706); padding:8px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; border:none; color:white; cursor:pointer; margin-left:8px;">
                <i class="fas fa-paper-plane"></i> Dispatch Scout
              </button>
            </div>

            <!-- Add Property to Hunt -->
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:20px;">
              <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:800; color:#0f172a;"><i class="fas fa-plus-circle" style="color:#059669;"></i> Attach Property to this Hunt</h4>
              <div style="display:flex; gap:10px; margin-bottom:8px;">
                <input type="text" id="modal-attach-propid" placeholder="Enter Property ID or Title from catalog..." style="flex:1; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.88rem;">
                <input type="text" id="modal-attach-note" placeholder="Note to customer (e.g. 2nd floor, borehole, KSh 18k)..." style="flex:1.2; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.88rem;">
                <button type="button" class="btn-primary" onclick="AdminHunts.attachProperty('${hunt.id}')" style="background:#0f172a; padding:9px 16px; border-radius:8px; font-weight:800; border:none; color:white; cursor:pointer; white-space:nowrap;">
                  Attach Property
                </button>
              </div>
              <small style="color:#64748b; font-size:0.74rem;">Adding a property will instantly notify customer <strong>+${hunt.customerPhone || ''}</strong> via SMS.</small>
            </div>

            <!-- Properties Attached List -->
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:20px;">
              <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:800; color:#0f172a;"><i class="fas fa-home" style="color:#059669;"></i> Attached Properties (${properties.length})</h4>
              <div style="display:grid; gap:12px;">
                ${properties.length === 0 ? '<div style="color:#64748b; font-size:0.85rem; padding:12px 0;">No properties attached yet. Search catalog and attach matches above.</div>' : ''}
                ${properties.map(p => `
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;">
                      <div style="font-weight:800; font-size:0.92rem; color:#0f172a;">${p.property_title || 'Listing'}</div>
                      <div style="font-size:0.8rem; color:#64748b;">📍 ${p.property_location || '—'} · <strong style="color:#059669;">KSh ${formatPrice(p.property_price)}</strong></div>
                      ${p.admin_note ? `<div style="font-size:0.76rem; color:#334155; margin-top:4px; background:#ffffff; padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0;">Note: ${p.admin_note}</div>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <select onchange="AdminHunts.updatePropStatus('${hunt.id}', '${p.id}', this.value)" style="padding:6px 10px; border-radius:6px; font-weight:700; font-size:0.78rem; border:1.5px solid #cbd5e1;">
                        <option value="none" ${p.viewing_status === 'none' ? 'selected' : ''}>No Viewing</option>
                        <option value="requested" ${p.viewing_status === 'requested' ? 'selected' : ''}>Viewing Requested</option>
                        <option value="arranged" ${p.viewing_status === 'arranged' ? 'selected' : ''}>Viewing Arranged</option>
                        <option value="done" ${p.viewing_status === 'done' ? 'selected' : ''}>Viewing Done</option>
                      </select>
                      <button type="button" onclick="AdminHunts.removeProp('${hunt.id}', '${p.id}')" style="background:#fee2e2; color:#991b1b; border:none; padding:6px 10px; border-radius:6px; font-weight:800; font-size:0.75rem; cursor:pointer;" title="Remove">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Customer Chat / SMS Messages Stream -->
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">
              <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:800; color:#0f172a;"><i class="fas fa-comment-dots" style="color:#059669;"></i> Chat & SMS Log with Customer</h4>
              <div style="height:200px; overflow-y:auto; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
                ${messages.length === 0 ? '<div style="color:#94a3b8; font-size:0.8rem;">No messages exchanged yet. Send a message below to SMS customer.</div>' : ''}
                ${messages.map(m => `
                  <div style="align-self:${m.sender_id === hunt.customer_id ? 'flex-start' : 'flex-end'}; background:${m.sender_id === hunt.customer_id ? '#ffffff' : '#059669'}; color:${m.sender_id === hunt.customer_id ? '#0f172a' : '#ffffff'}; padding:8px 12px; border-radius:10px; max-width:80%; font-size:0.82rem; border:${m.sender_id === hunt.customer_id ? '1px solid #e2e8f0' : 'none'};">
                    <div style="font-weight:800; font-size:0.72rem; opacity:0.85; margin-bottom:2px;">${m.sender_name || 'Agent'}</div>
                    ${m.text || m.message_content || ''}
                  </div>
                `).join('')}
              </div>
              <div style="display:flex; gap:8px;">
                <input type="text" id="modal-reply-text" placeholder="Type a message (dispatches SMS to customer phone)..." style="flex:1; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.88rem;">
                <button type="button" class="btn-primary" onclick="AdminHunts.sendMessage('${hunt.id}')" style="background:#059669; padding:9px 18px; border-radius:8px; font-weight:800; border:none; color:white; cursor:pointer;">
                  <i class="fas fa-paper-plane"></i> Send SMS
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  async function saveHuntUpdates(huntId) {
    const status = document.getElementById('modal-hunt-status').value;
    const notes = document.getElementById('modal-hunt-notes').value;
    const viewings = document.getElementById('modal-hunt-viewings').value;

    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status, adminNotes: notes, viewingsArranged: viewings })
      });
      const data = await res.json();
      if (data.success) {
        alert('Hunt status updated successfully!');
        loadHouseHunts();
        openManageModal(huntId);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (e) {
      alert('Error updating hunt: ' + e.message);
    }
  }

  async function attachProperty(huntId) {
    const propId = document.getElementById('modal-attach-propid').value.trim();
    const note = document.getElementById('modal-attach-note').value.trim();
    if (!propId) {
      alert('Please provide a Property ID or Title');
      return;
    }

    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ propertyId: propId, adminNote: note })
      });
      const data = await res.json();
      if (data.success) {
        alert('Property attached! SMS dispatched to customer.');
        openManageModal(huntId);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (e) {
      alert('Error attaching property: ' + e.message);
    }
  }

  async function updatePropStatus(huntId, propId, viewingStatus) {
    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}/properties/${propId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ viewingStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadHouseHunts();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function removeProp(huntId, propId) {
    if (!confirm('Remove this property from the hunt?')) return;
    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}/properties/${propId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ reason: 'Admin removed' })
      });
      const data = await res.json();
      if (data.success) {
        openManageModal(huntId);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function sendMessage(huntId) {
    const input = document.getElementById('modal-reply-text');
    const text = input.value.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/house-hunt/${huntId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        input.value = '';
        openManageModal(huntId);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (e) {
      alert('Error sending message: ' + e.message);
    }
  }

  // Multi-Select & Bulk Actions for Hunts
  function toggleSelectAll(masterCb) {
    const cbs = document.querySelectorAll('.hunt-row-cb');
    cbs.forEach(cb => cb.checked = masterCb.checked);
    updateBulkBar();
  }

  function updateBulkBar() {
    const cbs = document.querySelectorAll('.hunt-row-cb:checked');
    const bulkBar = document.getElementById('hunt-bulk-bar');
    const countEl = document.getElementById('hunt-selected-count');
    if (!bulkBar) return;
    if (cbs.length > 0) {
      bulkBar.style.display = 'flex';
      if (countEl) countEl.textContent = cbs.length;
    } else {
      bulkBar.style.display = 'none';
      const masterCb = document.getElementById('hunt-select-all');
      if (masterCb) masterCb.checked = false;
    }
  }

  async function bulkDeleteHunts() {
    const cbs = Array.from(document.querySelectorAll('.hunt-row-cb:checked'));
    if (!cbs.length) return;
    const huntIds = cbs.map(cb => cb.value);

    if (!confirm(`⚠️ Delete ${huntIds.length} House Hunts?\n\nThis will permanently delete the selected hunt requests.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/house-hunts/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ huntIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete hunts');
      alert(data.message || 'Hunts deleted successfully');
      await loadHouseHunts();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  function showDispatchSuccessModal(data) {
    const modalId = 'dispatch-success-' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#ffffff;border-radius:18px;max-width:500px;width:100%;box-shadow:0 25px 70px rgba(0,0,0,0.35);overflow:hidden;">
          <div style="background:linear-gradient(135deg,#059669,#047857);color:#ffffff;padding:24px;text-align:center;">
            <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.8rem;">
              ⚡
            </div>
            <h3 style="margin:0;font-size:1.3rem;font-weight:800;">Scout Dispatched!</h3>
            <p style="margin:6px 0 0;opacity:0.9;font-size:0.88rem;">Ground concierge search is now live and tracking.</p>
          </div>
          <div style="padding:22px 24px;">
            ${data.scout ? `
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;margin-bottom:18px;">
                <div style="font-size:0.75rem;text-transform:uppercase;color:#15803d;font-weight:800;letter-spacing:0.05em;margin-bottom:4px;">Assigned Ground Scout</div>
                <div style="font-size:1.1rem;font-weight:800;color:#0f172a;">${data.scout.name}</div>
                <div style="font-size:0.85rem;color:#475569;margin-top:2px;">
                  📍 Primary Area: <strong>${data.scout.primaryArea}</strong> &nbsp;·&nbsp; 📞 ${data.scout.phone}
                </div>
              </div>
            ` : ''}
            <div style="font-size:0.85rem;color:#475569;margin-bottom:20px;line-height:1.5;">
              ✅ <strong>SMS Notification</strong> sent to customer with concierge status.<br>
              ✅ <strong>Task Alert</strong> dispatched to the field scout.
            </div>
            <div style="display:flex;gap:10px;">
              ${data.whatsappUrl ? `
                <a href="${data.whatsappUrl}" target="_blank" onclick="document.getElementById('${modalId}').remove()" style="flex:1.5;background:#25d366;color:#ffffff;text-decoration:none;padding:12px;border-radius:10px;font-weight:800;font-size:0.9rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
                  <i class="fab fa-whatsapp" style="font-size:1.1rem;"></i> Send WhatsApp Task
                </a>
              ` : ''}
              <button type="button" onclick="document.getElementById('${modalId}').remove()" style="flex:1;background:#f1f5f9;color:#334155;border:none;padding:12px;border-radius:10px;font-weight:700;font-size:0.9rem;cursor:pointer;">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async function activateHunt(huntId) {
    if (!confirm('⚡ Activate 72-Hour Search?\n\nThis will mark the hunt as PAID, start the 72-hour countdown timer, and automatically dispatch the nearest field scout.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to activate hunt');
      showDispatchSuccessModal(data);
      await loadHouseHunts();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function dispatchScoutPrompt(huntId) {
    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to dispatch scout');
      showDispatchSuccessModal(data);
      await loadHouseHunts();
      const modalRoot = document.getElementById('hunt-detail-modal-root');
      if (modalRoot) modalRoot.innerHTML = '';
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function deleteHunt(huntId) {
    if (!confirm('⚠️ Delete House Hunt?\n\nAre you sure you want to permanently delete this house hunt request?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/house-hunts/${huntId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete hunt');
      alert(data.message || 'Hunt deleted successfully');
      await loadHouseHunts();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  return {
    loadHouseHunts,
    filterHunts,
    openManageModal,
    saveHuntUpdates,
    attachProperty,
    updatePropStatus,
    removeProp,
    sendMessage,
    toggleSelectAll,
    updateBulkBar,
    bulkDeleteHunts,
    activateHunt,
    dispatchScoutPrompt,
    deleteHunt
  };
})();

window.AdminHunts = AdminHunts;
