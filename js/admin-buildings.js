/**
 * KejaMarket Admin - Buildings & Units Management Module
 * Manage multi-unit buildings and their individual units
 */

const AdminBuildings = (() => {
  const API_BASE = '';
  let currentView = 'buildings'; // 'buildings' or 'units'
  let currentBuildings = [];
  let currentUnits = [];

  // Initialize buildings module
  async function init(view = 'buildings') {
    currentView = view;
    if (view === 'buildings') {
      await loadBuildings();
    } else {
      await loadUnits();
    }
  }

  // Load buildings
  async function loadBuildings() {
    const buildingsContent = document.getElementById('buildings-content');
    if (!buildingsContent) return;

    buildingsContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading buildings...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load buildings');

      const data = await res.json();
      currentBuildings = data.buildings || [];
      renderBuildingsTable(currentBuildings);
      
    } catch (error) {
      console.error('Error loading buildings:', error);
      buildingsContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load buildings</p></div>';
    }
  }

  // Load units
  async function loadUnits() {
    const unitsContent = document.getElementById('buildings-content');
    if (!unitsContent) return;

    unitsContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading units...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/units`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load units');

      const data = await res.json();
      currentUnits = data.units || [];
      renderUnitsTable(currentUnits);
      
    } catch (error) {
      console.error('Error loading units:', error);
      unitsContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load units</p></div>';
    }
  }

  // Render buildings table
  function renderBuildingsTable(buildings) {
    const buildingsContent = document.getElementById('buildings-content');
    
    if (!buildings.length) {
      buildingsContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-building"></i>
          <p>No buildings found</p>
          <button class="btn-primary" onclick="AdminBuildings.showAddBuildingModal()">
            <i class="fas fa-plus"></i> Add Building
          </button>
        </div>
      `;
      return;
    }

    buildingsContent.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="building-search" placeholder="Search buildings..." onkeyup="AdminBuildings.searchBuildings(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminBuildings.exportBuildings()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn-primary" onclick="AdminBuildings.showAddBuildingModal()">
            <i class="fas fa-plus"></i> Add Building
          </button>
        </div>
      </div>

      <div class="buildings-grid">
        ${buildings.map(building => `
          <div class="building-card" onclick="AdminBuildings.viewBuildingDetail('${building.id}')">
            <div class="building-card-header">
              <h3>${escapeHtml(building.name || 'Unnamed Building')}</h3>
              <span class="badge badge-${building.status || 'active'}">${building.status || 'Active'}</span>
            </div>
            
            <div class="building-card-body">
              <div class="building-stat">
                <i class="fas fa-door-open"></i>
                <div>
                  <div class="stat-value">${building.totalUnits || 0}</div>
                  <div class="stat-label">Total Units</div>
                </div>
              </div>
              <div class="building-stat">
                <i class="fas fa-check-circle"></i>
                <div>
                  <div class="stat-value">${building.occupiedUnits || 0}</div>
                  <div class="stat-label">Occupied</div>
                </div>
              </div>
              <div class="building-stat">
                <i class="fas fa-home"></i>
                <div>
                  <div class="stat-value">${building.availableUnits || 0}</div>
                  <div class="stat-label">Available</div>
                </div>
              </div>
            </div>

            <div class="building-card-footer">
              <div class="building-info">
                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(building.location || 'No location')}
              </div>
              <div class="building-info">
                <i class="fas fa-user"></i> ${escapeHtml(building.landlordName || 'Unknown')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render units table
  function renderUnitsTable(units) {
    const unitsContent = document.getElementById('buildings-content');
    
    if (!units.length) {
      unitsContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-door-open"></i>
          <p>No units found</p>
          <small>Units are created within buildings</small>
        </div>
      `;
      return;
    }

    unitsContent.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="unit-search" placeholder="Search units..." onkeyup="AdminBuildings.searchUnits(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminBuildings.exportUnits()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Unit Number</th>
              <th>Building</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Tenant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${units.map(unit => `
              <tr onclick="AdminBuildings.viewUnitDetail('${unit.id}')" style="cursor: pointer;">
                <td>
                  <div style="font-weight: 600; color: #1e293b;">${escapeHtml(unit.unitNumber || '-')}</div>
                  <div style="font-size: 0.8rem; color: #94a3b8;">#${unit.id.slice(0, 8)}</div>
                </td>
                <td>${escapeHtml(unit.buildingName || '-')}</td>
                <td><span class="badge badge-type">${unit.bedrooms || 0}BR</span></td>
                <td style="font-weight: 700; color: #7c3aed;">KSh ${formatNumber(unit.price || 0)}</td>
                <td>${renderUnitStatus(unit)}</td>
                <td>${escapeHtml(unit.tenantName || '-')}</td>
                <td onclick="event.stopPropagation();">
                  <div class="action-buttons-group">
                    <button class="btn-icon" onclick="AdminBuildings.viewUnitDetail('${unit.id}')" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="AdminBuildings.editUnit('${unit.id}')" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Render unit status
  function renderUnitStatus(unit) {
    if (unit.status === 'occupied' || unit.isOccupied) {
      return '<span class="status-badge status-taken"><i class="fas fa-user"></i> Occupied</span>';
    }
    if (unit.status === 'available') {
      return '<span class="status-badge status-active"><i class="fas fa-check"></i> Available</span>';
    }
    if (unit.status === 'maintenance') {
      return '<span class="status-badge status-pending"><i class="fas fa-wrench"></i> Maintenance</span>';
    }
    return '<span class="status-badge status-pending">Unknown</span>';
  }

  // View building detail
  async function viewBuildingDetail(buildingId) {
    const contentArea = document.getElementById('admin-content');
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading building details...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings/${buildingId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load building');

      const data = await res.json();
      renderBuildingDetailPage(data.building);
      
    } catch (error) {
      console.error('Error loading building:', error);
      contentArea.innerHTML = '<div class="error-state">Failed to load building details</div>';
    }
  }

  // Render building detail page
  function renderBuildingDetailPage(building) {
    const contentArea = document.getElementById('admin-content');
    
    contentArea.innerHTML = `
      <div class="module-header">
        <div>
          <button class="btn-back" onclick="AdminCore.navigate('buildings')">
            <i class="fas fa-arrow-left"></i> Back to Buildings
          </button>
          <h1 style="margin-top: 12px;">
            <i class="fas fa-building"></i> ${escapeHtml(building.name || 'Building Details')}
          </h1>
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminBuildings.editBuilding('${building.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-primary" onclick="AdminBuildings.showAddUnitModal('${building.id}')">
            <i class="fas fa-plus"></i> Add Unit
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Building Info Card -->
        <div class="detail-card">
          <h3><i class="fas fa-info-circle"></i> Building Information</h3>
          <div class="detail-row">
            <span class="detail-label">Building ID:</span>
            <span class="detail-value">${building.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${escapeHtml(building.name || '-')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${escapeHtml(building.location || '-')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span class="detail-value">${escapeHtml(building.address || '-')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><span class="badge badge-${building.status || 'active'}">${building.status || 'Active'}</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created:</span>
            <span class="detail-value">${formatDate(building.createdAt)}</span>
          </div>
        </div>

        <!-- Landlord Info Card -->
        <div class="detail-card">
          <h3><i class="fas fa-user"></i> Owner Information</h3>
          <div class="detail-row">
            <span class="detail-label">Owner:</span>
            <span class="detail-value">${escapeHtml(building.landlordName || 'Unknown')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${building.landlordPhone || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${building.landlordEmail || '-'}</span>
          </div>
        </div>

        <!-- Statistics Card -->
        <div class="detail-card">
          <h3><i class="fas fa-chart-bar"></i> Unit Statistics</h3>
          <div class="detail-row">
            <span class="detail-label">Total Units:</span>
            <span class="detail-value" style="font-weight: 700; color: #7c3aed;">${building.totalUnits || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Occupied:</span>
            <span class="detail-value" style="color: #dc2626;">${building.occupiedUnits || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Available:</span>
            <span class="detail-value" style="color: #10b981;">${building.availableUnits || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Maintenance:</span>
            <span class="detail-value" style="color: #f59e0b;">${building.maintenanceUnits || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Occupancy Rate:</span>
            <span class="detail-value">${building.totalUnits ? Math.round((building.occupiedUnits / building.totalUnits) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      <!-- Units List -->
      <div class="detail-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3><i class="fas fa-door-open"></i> Units in this Building</h3>
          <button class="btn-primary" onclick="AdminBuildings.showAddUnitModal('${building.id}')">
            <i class="fas fa-plus"></i> Add Unit
          </button>
        </div>
        <div id="building-units-list">
          <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading units...</div>
        </div>
      </div>
    `;

    // Load units for this building
    loadBuildingUnits(building.id);
  }

  // Load units for a specific building
  async function loadBuildingUnits(buildingId) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings/${buildingId}/units`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load units');

      const data = await res.json();
      const unitsList = document.getElementById('building-units-list');
      
      if (!data.units || data.units.length === 0) {
        unitsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-door-open"></i>
            <p>No units in this building yet</p>
            <button class="btn-primary" onclick="AdminBuildings.showAddUnitModal('${buildingId}')">
              <i class="fas fa-plus"></i> Add First Unit
            </button>
          </div>
        `;
        return;
      }

      unitsList.innerHTML = `
        <div class="units-grid">
          ${data.units.map(unit => `
            <div class="unit-card" onclick="AdminBuildings.viewUnitDetail('${unit.id}')">
              <div class="unit-card-header">
                <h4>${escapeHtml(unit.unitNumber || 'Unit')}</h4>
                ${renderUnitStatus(unit)}
              </div>
              <div class="unit-card-body">
                <div class="unit-detail">
                  <i class="fas fa-bed"></i> ${unit.bedrooms || 0} Bedrooms
                </div>
                <div class="unit-detail">
                  <i class="fas fa-bath"></i> ${unit.bathrooms || 0} Bathrooms
                </div>
                <div class="unit-detail" style="font-weight: 700; color: #7c3aed;">
                  <i class="fas fa-money-bill-wave"></i> KSh ${formatNumber(unit.price || 0)}/mo
                </div>
                ${unit.tenantName ? `
                  <div class="unit-detail">
                    <i class="fas fa-user"></i> ${escapeHtml(unit.tenantName)}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Error loading units:', error);
      document.getElementById('building-units-list').innerHTML = '<div class="error-state">Failed to load units</div>';
    }
  }

  // View unit detail
  function viewUnitDetail(unitId) {
    const unit = currentUnits.find(u => u.id === unitId);
    if (!unit) return;
    showModal(`
      <h3 style="margin:0 0 16px;color:#1e293b;">Unit Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ['Unit Number', unit.unitNumber || unit.unit_number || '-'],
          ['Building', unit.buildingName || '-'],
          ['Bedrooms', unit.bedrooms || 0],
          ['Bathrooms', unit.bathrooms || 0],
          ['Price', `KSh ${formatNumber(unit.price || 0)}/mo`],
          ['Status', unit.status || 'available'],
          ['Tenant', unit.tenantName || unit.tenant_name || 'Vacant'],
          ['Description', unit.description || '-']
        ].map(([k,v]) => `<tr><td style="padding:8px 4px;font-weight:600;color:#64748b;width:130px;">${k}</td><td style="padding:8px 4px;">${v}</td></tr>`).join('')}
      </table>
      <div style="text-align:right;margin-top:16px;">
        <button onclick="AdminBuildings.editUnit('${unit.id}')" class="btn-primary" style="margin-right:8px;"><i class="fas fa-edit"></i> Edit</button>
        <button onclick="closeAdminModal()" class="btn-secondary">Close</button>
      </div>
    `);
  }

  // Show add building modal
  function showAddBuildingModal() {
    showModal(`
      <h3 style="margin:0 0 20px;color:#1e293b;"><i class="fas fa-building" style="color:#7c3aed;margin-right:8px;"></i>Add New Building</h3>
      <form id="add-building-form" onsubmit="AdminBuildings.submitAddBuilding(event)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Building Name *</label>
            <input id="bldg-name" type="text" required placeholder="e.g. Westlands Heights" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Location / Address *</label>
            <input id="bldg-location" type="text" required placeholder="e.g. Westlands, Nairobi" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Number of Floors</label>
            <input id="bldg-floors" type="number" min="1" value="1" placeholder="1" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Status</label>
            <select id="bldg-status" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
              <option value="active">Active</option>
              <option value="under-construction">Under Construction</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Description</label>
            <textarea id="bldg-desc" rows="3" placeholder="Brief description of the building..." style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button type="button" onclick="closeAdminModal()" class="btn-secondary">Cancel</button>
          <button type="submit" id="add-bldg-btn" class="btn-primary"><i class="fas fa-plus"></i> Add Building</button>
        </div>
      </form>
    `);
  }

  async function submitAddBuilding(e) {
    e.preventDefault();
    const btn = document.getElementById('add-bldg-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: document.getElementById('bldg-name').value.trim(),
          location: document.getElementById('bldg-location').value.trim(),
          totalFloors: parseInt(document.getElementById('bldg-floors').value) || 1,
          status: document.getElementById('bldg-status').value,
          description: document.getElementById('bldg-desc').value.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      closeAdminModal();
      showBuildingToast('Building added successfully! ✅', 'success');
      await loadBuildings();
    } catch (err) {
      showBuildingToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-plus"></i> Add Building';
    }
  }

  // Show add unit modal
  function showAddUnitModal(buildingId) {
    showModal(`
      <h3 style="margin:0 0 20px;color:#1e293b;"><i class="fas fa-door-open" style="color:#7c3aed;margin-right:8px;"></i>Add New Unit</h3>
      <form id="add-unit-form" onsubmit="AdminBuildings.submitAddUnit(event, '${buildingId}')">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Unit Number *</label>
            <input id="unit-number" type="text" required placeholder="e.g. A1, 101" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Status</label>
            <select id="unit-status" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Bedrooms</label>
            <input id="unit-beds" type="number" min="0" value="1" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Bathrooms</label>
            <input id="unit-baths" type="number" min="0" value="1" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Monthly Rent (KSh)</label>
            <input id="unit-price" type="number" min="0" placeholder="e.g. 25000" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Description</label>
            <textarea id="unit-desc" rows="2" placeholder="Optional description..." style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button type="button" onclick="closeAdminModal()" class="btn-secondary">Cancel</button>
          <button type="submit" id="add-unit-btn" class="btn-primary"><i class="fas fa-plus"></i> Add Unit</button>
        </div>
      </form>
    `);
  }

  async function submitAddUnit(e, buildingId) {
    e.preventDefault();
    const btn = document.getElementById('add-unit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const res = await fetch(`${API_BASE}/api/admin/units`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buildingId,
          unitNumber: document.getElementById('unit-number').value.trim(),
          bedrooms: parseInt(document.getElementById('unit-beds').value) || 0,
          bathrooms: parseInt(document.getElementById('unit-baths').value) || 0,
          price: parseFloat(document.getElementById('unit-price').value) || 0,
          status: document.getElementById('unit-status').value,
          description: document.getElementById('unit-desc').value.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      closeAdminModal();
      showBuildingToast('Unit added successfully! ✅', 'success');
      // Reload whichever view is active
      if (currentView === 'units') await loadUnits();
      else await loadBuildings();
    } catch (err) {
      showBuildingToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-plus"></i> Add Unit';
    }
  }

  // Edit building
  function editBuilding(buildingId) {
    const building = currentBuildings.find(b => b.id === buildingId);
    if (!building) return;
    showModal(`
      <h3 style="margin:0 0 20px;color:#1e293b;"><i class="fas fa-edit" style="color:#7c3aed;margin-right:8px;"></i>Edit Building</h3>
      <form id="edit-building-form" onsubmit="AdminBuildings.submitEditBuilding(event, '${buildingId}')">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Building Name</label>
            <input id="edit-bldg-name" type="text" value="${(building.name||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Location</label>
            <input id="edit-bldg-location" type="text" value="${(building.location||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Floors</label>
            <input id="edit-bldg-floors" type="number" min="1" value="${building.totalFloors||building.total_floors||1}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Status</label>
            <select id="edit-bldg-status" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
              <option value="active" ${building.status==='active'?'selected':''}>Active</option>
              <option value="under-construction" ${building.status==='under-construction'?'selected':''}>Under Construction</option>
              <option value="inactive" ${building.status==='inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Description</label>
            <textarea id="edit-bldg-desc" rows="3" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;">${building.description||''}</textarea>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button type="button" onclick="if(confirm('Delete this building?')) AdminBuildings.deleteBuilding('${buildingId}')" style="margin-right:auto;" class="btn-danger"><i class="fas fa-trash"></i> Delete</button>
          <button type="button" onclick="closeAdminModal()" class="btn-secondary">Cancel</button>
          <button type="submit" id="edit-bldg-btn" class="btn-primary"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </form>
    `);
  }

  async function submitEditBuilding(e, buildingId) {
    e.preventDefault();
    const btn = document.getElementById('edit-bldg-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings/${buildingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: document.getElementById('edit-bldg-name').value.trim(),
          location: document.getElementById('edit-bldg-location').value.trim(),
          totalFloors: parseInt(document.getElementById('edit-bldg-floors').value) || 1,
          status: document.getElementById('edit-bldg-status').value,
          description: document.getElementById('edit-bldg-desc').value.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      closeAdminModal();
      showBuildingToast('Building updated! ✅', 'success');
      await loadBuildings();
    } catch (err) {
      showBuildingToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }

  async function deleteBuilding(buildingId) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/buildings/${buildingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      closeAdminModal();
      showBuildingToast('Building deleted.', 'info');
      await loadBuildings();
    } catch (err) {
      showBuildingToast('Error: ' + err.message, 'error');
    }
  }

  // Edit unit
  function editUnit(unitId) {
    const unit = currentUnits.find(u => u.id === unitId);
    if (!unit) { showBuildingToast('Unit not found', 'error'); return; }
    showModal(`
      <h3 style="margin:0 0 20px;color:#1e293b;"><i class="fas fa-edit" style="color:#7c3aed;margin-right:8px;"></i>Edit Unit</h3>
      <form id="edit-unit-form" onsubmit="AdminBuildings.submitEditUnit(event, '${unitId}')">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Unit Number</label>
            <input id="eu-number" type="text" value="${(unit.unitNumber||unit.unit_number||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Status</label>
            <select id="eu-status" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
              <option value="available" ${unit.status==='available'?'selected':''}>Available</option>
              <option value="occupied" ${unit.status==='occupied'?'selected':''}>Occupied</option>
              <option value="maintenance" ${unit.status==='maintenance'?'selected':''}>Maintenance</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Bedrooms</label>
            <input id="eu-beds" type="number" min="0" value="${unit.bedrooms||0}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Bathrooms</label>
            <input id="eu-baths" type="number" min="0" value="${unit.bathrooms||0}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block;font-weight:600;margin-bottom:4px;color:#374151;">Monthly Rent (KSh)</label>
            <input id="eu-price" type="number" min="0" value="${unit.price||0}" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button type="button" onclick="closeAdminModal()" class="btn-secondary">Cancel</button>
          <button type="submit" id="edit-unit-btn" class="btn-primary"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </form>
    `);
  }

  async function submitEditUnit(e, unitId) {
    e.preventDefault();
    const btn = document.getElementById('edit-unit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const res = await fetch(`${API_BASE}/api/admin/units/${unitId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          unitNumber: document.getElementById('eu-number').value.trim(),
          bedrooms: parseInt(document.getElementById('eu-beds').value)||0,
          bathrooms: parseInt(document.getElementById('eu-baths').value)||0,
          price: parseFloat(document.getElementById('eu-price').value)||0,
          status: document.getElementById('eu-status').value
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      closeAdminModal();
      showBuildingToast('Unit updated! ✅', 'success');
      if (currentView === 'units') await loadUnits();
      else await loadBuildings();
    } catch (err) {
      showBuildingToast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }

  // Modal helper
  function showModal(html) {
    let overlay = document.getElementById('admin-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'admin-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.onclick = e => { if (e.target === overlay) closeAdminModal(); };
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div style="background:#fff;border-radius:16px;padding:28px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">${html}</div>`;
    overlay.style.display = 'flex';
  }

  function closeAdminModal() {
    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function showBuildingToast(message, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||colors.info};color:#fff;padding:14px 20px;border-radius:10px;font-weight:600;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:340px;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Search buildings
  function searchBuildings(query) {
    if (!query.trim()) {
      renderBuildingsTable(currentBuildings);
      return;
    }

    const filtered = currentBuildings.filter(building => 
      (building.name && building.name.toLowerCase().includes(query.toLowerCase())) ||
      (building.location && building.location.toLowerCase().includes(query.toLowerCase())) ||
      (building.landlordName && building.landlordName.toLowerCase().includes(query.toLowerCase()))
    );

    renderBuildingsTable(filtered);
  }

  // Search units
  function searchUnits(query) {
    if (!query.trim()) {
      renderUnitsTable(currentUnits);
      return;
    }

    const filtered = currentUnits.filter(unit => 
      (unit.unitNumber && unit.unitNumber.toLowerCase().includes(query.toLowerCase())) ||
      (unit.buildingName && unit.buildingName.toLowerCase().includes(query.toLowerCase())) ||
      (unit.tenantName && unit.tenantName.toLowerCase().includes(query.toLowerCase()))
    );

    renderUnitsTable(filtered);
  }

  // Export functions
  function exportBuildings() {
    alert('Export functionality coming soon');
  }

  function exportUnits() {
    alert('Export functionality coming soon');
  }

  // Utility functions
  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  return {
    init,
    loadBuildings,
    loadUnits,
    viewBuildingDetail,
    viewUnitDetail,
    showAddBuildingModal,
    showAddUnitModal,
    submitAddBuilding,
    submitAddUnit,
    editBuilding,
    editUnit,
    submitEditBuilding,
    submitEditUnit,
    deleteBuilding,
    searchBuildings,
    searchUnits,
    exportBuildings,
    exportUnits
  };
})();

// Expose globally
window.AdminBuildings = AdminBuildings;
