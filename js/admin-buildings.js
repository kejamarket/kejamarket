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
    alert('Unit detail view coming soon');
  }

  // Show add building modal
  function showAddBuildingModal() {
    alert('Add building functionality coming soon');
  }

  // Show add unit modal
  function showAddUnitModal(buildingId) {
    alert('Add unit functionality coming soon');
  }

  // Edit building
  function editBuilding(buildingId) {
    alert('Edit building functionality coming soon');
  }

  // Edit unit
  function editUnit(unitId) {
    alert('Edit unit functionality coming soon');
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
    editBuilding,
    editUnit,
    searchBuildings,
    searchUnits,
    exportBuildings,
    exportUnits
  };
})();

// Expose globally
window.AdminBuildings = AdminBuildings;
