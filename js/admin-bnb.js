/**
 * KejaMarket Admin - BNB Management Module
 * Manage short-stay/BNB listings with host-guest logic
 */

const AdminBNB = (() => {
  const API_BASE = '';
  let currentFilter = 'all';
  let currentBNBs = [];

  // Initialize BNB module
  async function init(filter = 'all') {
    currentFilter = filter;
    await loadBNBs();
  }

  // Load BNBs
  async function loadBNBs() {
    const bnbContent = document.getElementById('bnb-content');
    if (!bnbContent) return;

    bnbContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading BNBs...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-properties`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load BNBs');

      const data = await res.json();
      const bnbs = (data.properties || []).filter(p => 
        p.propertyType === 'bnb' || 
        p.propertyType === 'short-stay' || 
        p.is_bnb === true || 
        p.isBnb === true || 
        (p.category && (p.category.toLowerCase().includes('bnb') || p.category.toLowerCase().includes('airbnb') || p.category.toLowerCase().includes('short-stay')))
      );
      currentBNBs = filterBNBsByTab(bnbs);
      renderBNBsGrid(currentBNBs);
      
    } catch (error) {
      console.error('Error loading BNBs:', error);
      bnbContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load BNBs</p></div>';
    }
  }

  // Filter BNBs by tab
  function filterBNBsByTab(bnbs) {
    switch (currentFilter) {
      case 'all':
        return bnbs;
      case 'active':
        return bnbs.filter(b => b.status === 'verified' || b.isVerified);
      case 'pending':
        return bnbs.filter(b => b.status === 'pending');
      case 'available':
        return bnbs.filter(b => !b.isBooked && (b.status === 'verified' || b.isVerified));
      case 'booked':
        return bnbs.filter(b => b.isBooked);
      default:
        return bnbs;
    }
  }

  // Render BNBs grid
  function renderBNBsGrid(bnbs) {
    const bnbContent = document.getElementById('bnb-content');
    
    if (!bnbs.length) {
      bnbContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bed"></i>
          <p>No BNB listings found</p>
          <small>BNB listings will appear here</small>
        </div>
      `;
      return;
    }

    bnbContent.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="bnb-search" placeholder="Search BNBs..." onkeyup="AdminBNB.searchBNBs(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminBNB.exportBNBs()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <div class="bnb-grid">
        ${bnbs.map(bnb => `
          <div class="bnb-card" onclick="AdminBNB.viewBNBDetail('${bnb.id}')">
            <div class="bnb-image" style="background-image: url('${bnb.images?.[0] || '/icons/placeholder.png'}')">
              ${bnb.isBooked ? '<div class="booked-badge"><i class="fas fa-check"></i> Booked</div>' : ''}
            </div>
            <div class="bnb-card-body">
              <h3>${escapeHtml(bnb.title || 'Untitled BNB')}</h3>
              <div class="bnb-detail">
                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(bnb.location || '-')}
              </div>
              <div class="bnb-detail">
                <i class="fas fa-user"></i> Host: ${escapeHtml(bnb.landlordName || 'Unknown')}
              </div>
              <div class="bnb-stats">
                <div class="bnb-stat">
                  <i class="fas fa-bed"></i> ${bnb.bedrooms || 0} BR
                </div>
                <div class="bnb-stat">
                  <i class="fas fa-bath"></i> ${bnb.bathrooms || 0} BA
                </div>
                <div class="bnb-stat">
                  <i class="fas fa-users"></i> ${bnb.maxGuests || 2} Guests
                </div>
              </div>
              <div class="bnb-price">
                KSh ${formatNumber(bnb.price || 0)}<span>/night</span>
              </div>
              <div class="bnb-footer">
                ${renderBNBStatus(bnb)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render BNB status
  function renderBNBStatus(bnb) {
    if (bnb.status === 'verified' || bnb.isVerified) {
      return '<span class="status-badge status-verified"><i class="fas fa-check-circle"></i> Active</span>';
    }
    if (bnb.status === 'pending') {
      return '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>';
    }
    if (bnb.status === 'rejected') {
      return '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Rejected</span>';
    }
    return '<span class="status-badge status-pending">Unknown</span>';
  }

  // View BNB detail
  function viewBNBDetail(bnbId) {
    AdminProperties.viewPropertyDetail(bnbId);
  }

  // Search BNBs
  function searchBNBs(query) {
    if (!query.trim()) {
      renderBNBsGrid(currentBNBs);
      return;
    }

    const filtered = currentBNBs.filter(bnb => 
      (bnb.title && bnb.title.toLowerCase().includes(query.toLowerCase())) ||
      (bnb.location && bnb.location.toLowerCase().includes(query.toLowerCase())) ||
      (bnb.landlordName && bnb.landlordName.toLowerCase().includes(query.toLowerCase()))
    );

    renderBNBsGrid(filtered);
  }

  // Export BNBs
  function exportBNBs() {
    alert('Export functionality coming soon');
  }

  // Utility functions
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
    loadBNBs,
    viewBNBDetail,
    searchBNBs,
    exportBNBs
  };
})();

window.AdminBNB = AdminBNB;
