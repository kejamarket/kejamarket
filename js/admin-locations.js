/**
 * KejaMarket Admin Master Location Management Module
 * Enables admins to:
 * - View & search hierarchical locations (Counties, Towns, Areas, Estates, Gates, Phases, Sections)
 * - Add new location / estate / phase / gate / court without code deployments
 * - Edit location details (name, aliases, coordinates, status, verified)
 * - Move location under a different parent
 * - Archive/Delete location
 * - Merge duplicate locations
 */

const AdminLocations = (() => {
  let allLocations = [];
  let locationMap = new Map();
  let currentFilterType = 'ALL';
  let searchQuery = '';

  const API_HEADERS = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('keja_token')}`
  });

  async function loadLocations() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h1><i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> Master Location System</h1>
          <p style="color:#64748b; font-size:0.9rem; margin-top:4px;">Manage Kenyan hierarchical locations: County → Area → Estate → Sub-area → Phase/Gate/Section</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn-primary" onclick="AdminLocations.openAddModal()" style="display:flex; align-items:center; gap:6px; background:#00b53f; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fas fa-plus"></i> Add New Location
          </button>
          <button class="btn-secondary" onclick="AdminLocations.openMergeModal()" style="display:flex; align-items:center; gap:6px; background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; padding:10px 18px; border-radius:8px; font-weight:700; cursor:pointer;">
            <i class="fas fa-code-branch"></i> Merge Duplicates
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div id="loc-stats-row" class="stats-row" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin:20px 0;">
        <div class="stat-box" style="background:white; padding:18px; border-radius:12px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
          <i class="fas fa-map-marked-alt" style="font-size:2rem; color:#00b53f;"></i>
          <div><div class="stat-number" id="stat-total-locs" style="font-size:1.6rem; font-weight:800; color:#0f172a;">...</div><div class="stat-label" style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Total Locations</div></div>
        </div>
        <div class="stat-box" style="background:white; padding:18px; border-radius:12px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
          <i class="fas fa-home" style="font-size:2rem; color:#3b82f6;"></i>
          <div><div class="stat-number" id="stat-estates-count" style="font-size:1.6rem; font-weight:800; color:#0f172a;">...</div><div class="stat-label" style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Estates / Suburbs</div></div>
        </div>
        <div class="stat-box" style="background:white; padding:18px; border-radius:12px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
          <i class="fas fa-hashtag" style="font-size:2rem; color:#8b5cf6;"></i>
          <div><div class="stat-number" id="stat-phases-count" style="font-size:1.6rem; font-weight:800; color:#0f172a;">...</div><div class="stat-label" style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Phases & Gates</div></div>
        </div>
        <div class="stat-box" style="background:white; padding:18px; border-radius:12px; border:1px solid #e2e8f0; display:flex; gap:12px; align-items:center;">
          <i class="fas fa-check-double" style="font-size:2rem; color:#10b981;"></i>
          <div><div class="stat-number" id="stat-verified-count" style="font-size:1.6rem; font-weight:800; color:#0f172a;">...</div><div class="stat-label" style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Verified</div></div>
        </div>
      </div>

      <!-- Filter Controls & Search -->
      <div style="background:white; padding:16px 20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between;">
        <div style="display:flex; flex:1; min-width:260px; max-width:480px; position:relative;">
          <i class="fas fa-search" style="position:absolute; left:14px; top:12px; color:#94a3b8;"></i>
          <input 
            type="text" 
            id="admin-loc-search-input" 
            placeholder="Search location name, alias, parent path (e.g. Nyayo, Sheshe, Phase 2)..." 
            style="width:100%; height:40px; padding:0 36px 0 38px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.9rem; outline:none;"
            oninput="AdminLocations.handleSearch(this.value)"
          />
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="loc-filter-tab active" data-type="ALL" onclick="AdminLocations.filterType('ALL', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:#00b53f; color:white; font-weight:700; font-size:0.8rem; cursor:pointer;">All</button>
          <button class="loc-filter-tab" data-type="COUNTY" onclick="AdminLocations.filterType('COUNTY', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:600; font-size:0.8rem; cursor:pointer;">Counties</button>
          <button class="loc-filter-tab" data-type="AREA" onclick="AdminLocations.filterType('AREA', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:600; font-size:0.8rem; cursor:pointer;">Areas</button>
          <button class="loc-filter-tab" data-type="ESTATE" onclick="AdminLocations.filterType('ESTATE', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:600; font-size:0.8rem; cursor:pointer;">Estates</button>
          <button class="loc-filter-tab" data-type="PHASE" onclick="AdminLocations.filterType('PHASE', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:600; font-size:0.8rem; cursor:pointer;">Phases / Gates</button>
          <button class="loc-filter-tab" data-type="SECTION" onclick="AdminLocations.filterType('SECTION', this)" style="padding:6px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#475569; font-weight:600; font-size:0.8rem; cursor:pointer;">Sections / Courts</button>
        </div>
      </div>

      <!-- Locations Table -->
      <div class="table-container" style="background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
        <div id="admin-loc-table-wrapper">
          <div style="padding:40px; text-align:center; color:#64748b;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px; color:#00b53f;"></i>
            <p>Loading master locations...</p>
          </div>
        </div>
      </div>

      <!-- Location Edit / Add Modal Container -->
      <div id="admin-loc-modal-container"></div>
    `;

    await fetchAllLocations();
  }

  async function fetchAllLocations() {
    try {
      const res = await fetch('/api/locations?limit=2500');
      const data = await res.json();
      allLocations = data.results || (window.KEJA_MASTER_LOCATIONS || []);
      
      locationMap.clear();
      allLocations.forEach(l => locationMap.set(l.id, l));

      updateStats();
      renderTable();
    } catch (e) {
      console.error('Error fetching locations:', e);
      allLocations = window.KEJA_MASTER_LOCATIONS || [];
      allLocations.forEach(l => locationMap.set(l.id, l));
      updateStats();
      renderTable();
    }
  }

  function updateStats() {
    const totalEl = document.getElementById('stat-total-locs');
    const estatesEl = document.getElementById('stat-estates-count');
    const phasesEl = document.getElementById('stat-phases-count');
    const verifiedEl = document.getElementById('stat-verified-count');

    if (totalEl) totalEl.textContent = allLocations.length;
    if (estatesEl) estatesEl.textContent = allLocations.filter(l => l.type === 'ESTATE' || l.type === 'NEIGHBOURHOOD').length;
    if (phasesEl) phasesEl.textContent = allLocations.filter(l => l.type === 'PHASE' || l.type === 'GATE').length;
    if (verifiedEl) verifiedEl.textContent = allLocations.filter(l => l.verified).length;
  }

  function filterType(type, btn) {
    currentFilterType = type;
    document.querySelectorAll('.loc-filter-tab').forEach(b => {
      b.style.background = 'white';
      b.style.color = '#475569';
    });
    if (btn) {
      btn.style.background = '#00b53f';
      btn.style.color = 'white';
    }
    renderTable();
  }

  function handleSearch(val) {
    searchQuery = (val || '').toLowerCase().trim();
    renderTable();
  }

  function renderTable() {
    const wrapper = document.getElementById('admin-loc-table-wrapper');
    if (!wrapper) return;

    let filtered = allLocations;

    if (currentFilterType !== 'ALL') {
      if (currentFilterType === 'PHASE') {
        filtered = filtered.filter(l => l.type === 'PHASE' || l.type === 'GATE');
      } else if (currentFilterType === 'SECTION') {
        filtered = filtered.filter(l => l.type === 'SECTION' || l.type === 'COURT' || l.type === 'STAGE');
      } else {
        filtered = filtered.filter(l => l.type === currentFilterType);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(l => {
        const name = (l.name || '').toLowerCase();
        const path = (l.pathString || '').toLowerCase();
        const aliases = (l.aliases || []).join(' ').toLowerCase();
        return name.includes(searchQuery) || path.includes(searchQuery) || aliases.includes(searchQuery);
      });
    }

    if (filtered.length === 0) {
      wrapper.innerHTML = `
        <div style="padding:40px; text-align:center; color:#94a3b8;">
          <i class="fas fa-search-location" style="font-size:2.5rem; margin-bottom:12px; color:#cbd5e1;"></i>
          <p style="font-size:1.05rem; font-weight:700; color:#334155;">No locations found</p>
          <small>Try a different search query or filter type</small>
        </div>
      `;
      return;
    }

    const displayList = filtered.slice(0, 100);

    wrapper.innerHTML = `
      <div style="padding:10px 20px; background:#f8fafc; font-size:0.8rem; font-weight:700; color:#64748b; border-bottom:1px solid #e2e8f0;">
        Showing ${displayList.length} of ${filtered.length} locations
      </div>
      <table class="admin-table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc; text-align:left; border-bottom:1px solid #e2e8f0; font-size:0.75rem; text-transform:uppercase; color:#64748b;">
            <th style="padding:12px 18px;">Name</th>
            <th style="padding:12px 18px;">Type</th>
            <th style="padding:12px 18px;">Hierarchical Path</th>
            <th style="padding:12px 18px;">County</th>
            <th style="padding:12px 18px;">Aliases</th>
            <th style="padding:12px 18px;">Verified</th>
            <th style="padding:12px 18px; text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${displayList.map(loc => `
            <tr style="border-bottom:1px solid #f1f5f9; font-size:0.88rem;">
              <td style="padding:12px 18px; font-weight:700; color:#0f172a;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <i class="${getIconForType(loc.type)}" style="color:#00b53f; font-size:0.9rem;"></i>
                  <span>${escapeHtml(loc.name)}</span>
                </div>
              </td>
              <td style="padding:12px 18px;">
                <span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:12px; background:#f1f5f9; color:#475569;">
                  ${loc.type}
                </span>
              </td>
              <td style="padding:12px 18px; color:#64748b; font-size:0.8rem;">
                ${escapeHtml(loc.pathString || loc.name)}
              </td>
              <td style="padding:12px 18px; color:#334155;">
                ${escapeHtml(loc.county || 'Nairobi')}
              </td>
              <td style="padding:12px 18px; color:#64748b; font-size:0.78rem;">
                ${loc.aliases && loc.aliases.length > 0 ? loc.aliases.map(a => `<span style="background:#f1f5f9; padding:1px 6px; border-radius:4px; margin-right:4px;">${escapeHtml(a)}</span>`).join('') : '<span style="color:#cbd5e1;">-</span>'}
              </td>
              <td style="padding:12px 18px;">
                ${loc.verified ? '<span style="color:#059669; font-weight:700; font-size:0.78rem;"><i class="fas fa-check-circle"></i> Yes</span>' : '<span style="color:#94a3b8; font-size:0.78rem;">No</span>'}
              </td>
              <td style="padding:12px 18px; text-align:right;">
                <div style="display:inline-flex; gap:6px;">
                  <button type="button" class="btn-sm" onclick="AdminLocations.openAddChildModal('${loc.id}')" title="Add Sub-area/Phase/Gate" style="background:#e8f8ee; color:#00b53f; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.78rem;">
                    <i class="fas fa-plus"></i> Child
                  </button>
                  <button type="button" class="btn-sm" onclick="AdminLocations.openEditModal('${loc.id}')" title="Edit Location" style="background:#f1f5f9; color:#334155; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.78rem;">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button type="button" class="btn-sm" onclick="AdminLocations.deleteLocation('${loc.id}')" title="Archive Location" style="background:#fef2f2; color:#ef4444; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.78rem;">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function openAddModal(parentId = null, defaultType = 'ESTATE') {
    const parent = parentId ? locationMap.get(parentId) : null;
    const container = document.getElementById('admin-loc-modal-container');
    if (!container) return;

    const potentialParents = allLocations.filter(l => l.type === 'COUNTY' || l.type === 'AREA' || l.type === 'TOWN' || l.type === 'ESTATE' || l.type === 'GATE');

    container.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:540px; border-radius:16px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.25); max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
            <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#0f172a;">
              <i class="fas fa-map-marker-alt" style="color:#00b53f;"></i> ${parent ? `Add Child under "${parent.name}"` : 'Add New Location'}
            </h3>
            <button onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:none; border:none; font-size:1.2rem; color:#94a3b8; cursor:pointer;">&times;</button>
          </div>

          <form id="admin-add-loc-form" onsubmit="AdminLocations.submitAddLocation(event)">
            <input type="hidden" name="parentId" value="${parentId || ''}">

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Parent Location</label>
              <select name="selectedParentId" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" onchange="this.form.parentId.value=this.value">
                <option value="">-- No Parent (Root / County) --</option>
                ${potentialParents.map(p => `
                  <option value="${p.id}" ${parentId === p.id ? 'selected' : ''}>${p.pathString || p.name} (${p.type})</option>
                `).join('')}
              </select>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Location Name *</label>
              <input type="text" name="name" required placeholder="e.g. Sheshe Gardens, Phase 2, Gate C..." style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 12px; font-size:0.9rem;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Location Type *</label>
                <select name="type" required style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                  <option value="ESTATE" ${defaultType === 'ESTATE' ? 'selected' : ''}>Estate</option>
                  <option value="PHASE" ${defaultType === 'PHASE' ? 'selected' : ''}>Phase</option>
                  <option value="GATE" ${defaultType === 'GATE' ? 'selected' : ''}>Gate</option>
                  <option value="SECTION" ${defaultType === 'SECTION' ? 'selected' : ''}>Section</option>
                  <option value="COURT">Court</option>
                  <option value="STAGE">Stage</option>
                  <option value="SUB_AREA">Sub-area</option>
                  <option value="AREA">Area</option>
                  <option value="TOWN">Town</option>
                  <option value="COUNTY">County</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">County</label>
                <select name="county" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                  <option value="Nairobi" ${!parent || parent.county === 'Nairobi' ? 'selected' : ''}>Nairobi</option>
                  <option value="Kiambu" ${parent && parent.county === 'Kiambu' ? 'selected' : ''}>Kiambu</option>
                  <option value="Machakos" ${parent && parent.county === 'Machakos' ? 'selected' : ''}>Machakos</option>
                  <option value="Kajiado" ${parent && parent.county === 'Kajiado' ? 'selected' : ''}>Kajiado</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Nakuru">Nakuru</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Aliases (comma separated)</label>
              <input type="text" name="aliases" placeholder="e.g. Buru 3, Sec 7, Phase Two..." style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 12px; font-size:0.88rem;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Latitude (optional)</label>
                <input type="number" step="any" name="latitude" placeholder="-1.2863" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Longitude (optional)</label>
                <input type="number" step="any" name="longitude" placeholder="36.8172" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" />
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:flex; align-items:center; gap:8px; font-size:0.88rem; font-weight:600; color:#0f172a; cursor:pointer;">
                <input type="checkbox" name="verified" checked style="width:18px; height:18px; accent-color:#00b53f;" />
                Mark as KejaMarket Verified Location
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:#f1f5f9; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer; color:#475569;">Cancel</button>
              <button type="submit" style="background:#00b53f; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:700; cursor:pointer;">Save Location</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openAddChildModal(parentId) {
    const parent = locationMap.get(parentId);
    let childType = 'PHASE';
    if (parent.type === 'COUNTY') childType = 'AREA';
    else if (parent.type === 'AREA') childType = 'ESTATE';
    else if (parent.type === 'ESTATE') childType = 'GATE';
    else if (parent.type === 'GATE') childType = 'PHASE';
    openAddModal(parentId, childType);
  }

  async function submitAddLocation(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      type: form.type.value,
      parentId: form.parentId.value || null,
      county: form.county.value,
      aliases: form.aliases.value ? form.aliases.value.split(',').map(a => a.trim()).filter(Boolean) : [],
      verified: form.verified.checked
    };

    if (form.latitude.value) data.latitude = parseFloat(form.latitude.value);
    if (form.longitude.value) data.longitude = parseFloat(form.longitude.value);

    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Location added successfully!');
        document.getElementById('admin-loc-modal-container').innerHTML = '';
        await fetchAllLocations();
      } else {
        alert('❌ Error: ' + (result.message || 'Failed to save location'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  }

  function openEditModal(locId) {
    const loc = locationMap.get(locId);
    if (!loc) return;

    const container = document.getElementById('admin-loc-modal-container');
    if (!container) return;

    const potentialParents = allLocations.filter(l => l.id !== loc.id && (l.type === 'COUNTY' || l.type === 'AREA' || l.type === 'TOWN' || l.type === 'ESTATE' || l.type === 'GATE'));

    container.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:540px; border-radius:16px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.25); max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
            <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#0f172a;">
              <i class="fas fa-edit" style="color:#00b53f;"></i> Edit Location: ${escapeHtml(loc.name)}
            </h3>
            <button onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:none; border:none; font-size:1.2rem; color:#94a3b8; cursor:pointer;">&times;</button>
          </div>

          <form id="admin-edit-loc-form" onsubmit="AdminLocations.submitEditLocation(event, '${loc.id}')">
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Parent Location (Move under another parent)</label>
              <select name="parentId" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                <option value="">-- No Parent (Root / County) --</option>
                ${potentialParents.map(p => `
                  <option value="${p.id}" ${loc.parentId === p.id ? 'selected' : ''}>${p.pathString || p.name} (${p.type})</option>
                `).join('')}
              </select>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Location Name *</label>
              <input type="text" name="name" required value="${escapeHtml(loc.name)}" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 12px; font-size:0.9rem;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Location Type *</label>
                <select name="type" required style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                  <option value="ESTATE" ${loc.type === 'ESTATE' ? 'selected' : ''}>Estate</option>
                  <option value="PHASE" ${loc.type === 'PHASE' ? 'selected' : ''}>Phase</option>
                  <option value="GATE" ${loc.type === 'GATE' ? 'selected' : ''}>Gate</option>
                  <option value="SECTION" ${loc.type === 'SECTION' ? 'selected' : ''}>Section</option>
                  <option value="COURT" ${loc.type === 'COURT' ? 'selected' : ''}>Court</option>
                  <option value="STAGE" ${loc.type === 'STAGE' ? 'selected' : ''}>Stage</option>
                  <option value="SUB_AREA" ${loc.type === 'SUB_AREA' ? 'selected' : ''}>Sub-area</option>
                  <option value="AREA" ${loc.type === 'AREA' ? 'selected' : ''}>Area</option>
                  <option value="TOWN" ${loc.type === 'TOWN' ? 'selected' : ''}>Town</option>
                  <option value="COUNTY" ${loc.type === 'COUNTY' ? 'selected' : ''}>County</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">County</label>
                <input type="text" name="county" value="${escapeHtml(loc.county || 'Nairobi')}" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" />
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Aliases (comma separated)</label>
              <input type="text" name="aliases" value="${escapeHtml((loc.aliases || []).join(', '))}" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 12px; font-size:0.88rem;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Latitude</label>
                <input type="number" step="any" name="latitude" value="${loc.latitude || ''}" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:4px;">Longitude</label>
                <input type="number" step="any" name="longitude" value="${loc.longitude || ''}" style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;" />
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:flex; align-items:center; gap:8px; font-size:0.88rem; font-weight:600; color:#0f172a; cursor:pointer;">
                <input type="checkbox" name="verified" ${loc.verified ? 'checked' : ''} style="width:18px; height:18px; accent-color:#00b53f;" />
                Mark as KejaMarket Verified Location
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:#f1f5f9; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer; color:#475569;">Cancel</button>
              <button type="submit" style="background:#00b53f; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:700; cursor:pointer;">Update Location</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async function submitEditLocation(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      type: form.type.value,
      parentId: form.parentId.value || null,
      county: form.county.value,
      aliases: form.aliases.value ? form.aliases.value.split(',').map(a => a.trim()).filter(Boolean) : [],
      verified: form.verified.checked
    };

    if (form.latitude.value) data.latitude = parseFloat(form.latitude.value);
    if (form.longitude.value) data.longitude = parseFloat(form.longitude.value);

    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'PUT',
        headers: API_HEADERS(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Location updated successfully!');
        document.getElementById('admin-loc-modal-container').innerHTML = '';
        await fetchAllLocations();
      } else {
        alert('❌ Error: ' + (result.message || 'Failed to update location'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  }

  async function deleteLocation(id) {
    const loc = locationMap.get(id);
    if (!confirm(`Are you sure you want to archive "${loc?.name || id}"?`)) return;

    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
        headers: API_HEADERS()
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Location archived successfully!');
        await fetchAllLocations();
      } else {
        alert('❌ Error: ' + (result.message || 'Failed to archive location'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  }

  function openMergeModal() {
    const container = document.getElementById('admin-loc-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:520px; border-radius:16px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
            <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#0f172a;">
              <i class="fas fa-code-branch" style="color:#00b53f;"></i> Merge Duplicate Locations
            </h3>
            <button onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:none; border:none; font-size:1.2rem; color:#94a3b8; cursor:pointer;">&times;</button>
          </div>

          <p style="font-size:0.85rem; color:#64748b; margin-bottom:16px;">
            Merge a duplicate location into a master location. All child items from the source location will be moved to the target, and source aliases merged.
          </p>

          <form onsubmit="AdminLocations.submitMergeLocations(event)">
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#dc2626; margin-bottom:4px;">Source Location (Will be archived)</label>
              <select name="sourceId" required style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                <option value="">-- Select Source to Merge From --</option>
                ${allLocations.map(l => `<option value="${l.id}">${l.pathString || l.name} (${l.id})</option>`).join('')}
              </select>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:block; font-size:0.8rem; font-weight:700; color:#059669; margin-bottom:4px;">Target Location (Master to keep)</label>
              <select name="targetId" required style="width:100%; height:38px; border:1.5px solid #cbd5e1; border-radius:8px; padding:0 10px; font-size:0.88rem;">
                <option value="">-- Select Target to Merge Into --</option>
                ${allLocations.map(l => `<option value="${l.id}">${l.pathString || l.name} (${l.id})</option>`).join('')}
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
              <button type="button" onclick="document.getElementById('admin-loc-modal-container').innerHTML=''" style="background:#f1f5f9; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer; color:#475569;">Cancel</button>
              <button type="submit" style="background:#00b53f; color:white; border:none; padding:10px 20px; border-radius:8px; font-weight:700; cursor:pointer;">Merge Now</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async function submitMergeLocations(e) {
    e.preventDefault();
    const form = e.target;
    const sourceId = form.sourceId.value;
    const targetId = form.targetId.value;

    if (sourceId === targetId) {
      alert('Source and target locations cannot be the same!');
      return;
    }

    if (!confirm('Are you sure you want to merge these locations? This will re-parent all child items.')) return;

    try {
      const res = await fetch('/api/admin/locations/merge', {
        method: 'POST',
        headers: API_HEADERS(),
        body: JSON.stringify({ sourceId, targetId })
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Locations merged successfully!');
        document.getElementById('admin-loc-modal-container').innerHTML = '';
        await fetchAllLocations();
      } else {
        alert('❌ Error: ' + (result.message || 'Merge failed'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  }

  function getIconForType(type) {
    switch (type) {
      case 'COUNTY': return 'fas fa-map';
      case 'TOWN': return 'fas fa-city';
      case 'AREA': return 'fas fa-layer-group';
      case 'ESTATE': return 'fas fa-home';
      case 'NEIGHBOURHOOD': return 'fas fa-building';
      case 'PHASE': return 'fas fa-hashtag';
      case 'GATE': return 'fas fa-door-open';
      case 'SECTION': return 'fas fa-cubes';
      case 'COURT': return 'fas fa-th';
      case 'STAGE': return 'fas fa-bus';
      default: return 'fas fa-map-marker-alt';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    loadLocations,
    filterType,
    handleSearch,
    openAddModal,
    openAddChildModal,
    openEditModal,
    deleteLocation,
    openMergeModal,
    submitAddLocation,
    submitEditLocation,
    submitMergeLocations
  };
})();

window.AdminLocations = AdminLocations;
