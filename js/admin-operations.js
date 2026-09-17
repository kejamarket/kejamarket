/**
 * KejaMarket Admin - Operations Module
 * Fetches real data from API for Services, Marketplace, Inquiries, Reviews, Reports, Support
 */

const AdminOperations = (() => {
  const API_BASE = '';
  let currentModule = 'services';
  let currentData = [];
  const token = () => localStorage.getItem('keja_token');
  const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

  async function init(module = 'services') {
    currentModule = module;
    await loadModuleData();
  }

  async function loadModuleData() {
    const content = document.getElementById('operations-content');
    if (!content) return;
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    try {
      switch (currentModule) {
        case 'services': await loadServices(); break;
        case 'marketplace': await loadMarketplace(); break;
        case 'inquiries': await loadInquiries(); break;
        case 'reviews': await loadReviews(); break;
        case 'reports': await loadReports(); break;
        case 'support': await loadSupport(); break;
        default: content.innerHTML = '<div class="empty-state">Module not found</div>';
      }
    } catch (error) {
      console.error('Error loading module:', error);
      content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load: ${error.message}</p></div>`;
    }
  }

  async function loadServices() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/services`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.services || data.data || [];
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar"><i class="fas fa-search"></i><input type="text" placeholder="Search services..." oninput="AdminOperations.search(this.value)"></div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-tools"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Services</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle"></i><div><div class="stat-number">${currentData.filter(s => s.status === 'active' || s.isVerified).length}</div><div class="stat-label">Active</div></div></div>
      </div>
      ${currentData.length ? renderServicesTable(currentData) : '<div class="empty-state"><i class="fas fa-tools"></i><p>No services found</p></div>'}
    `;
  }

  function renderServicesTable(data) {
    return `<div class="table-container"><table class="admin-table">
      <thead><tr><th>Provider</th><th>Category</th><th>Location</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${data.map(s => `<tr>
        <td><strong>${s.name || s.providerName || '-'}</strong><br><small>${s.email || s.phone || ''}</small></td>
        <td>${s.category || '-'}</td><td>${s.location || s.area || '-'}</td>
        <td>${s.price ? 'KSh ' + Number(s.price).toLocaleString() : 'Negotiable'}</td>
        <td><span class="status-badge ${s.status === 'active' || s.isVerified ? 'status-active' : 'status-pending'}">${s.status || (s.isVerified ? 'Active' : 'Pending')}</span></td>
        <td><button class="btn-action btn-delete" onclick="AdminOperations.removeItem('${s.id}','service')" title="Remove"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  async function loadMarketplace() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/marketplace`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.items || data.data || [];
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar"><i class="fas fa-search"></i><input type="text" placeholder="Search marketplace..." oninput="AdminOperations.search(this.value)"></div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-shopping-cart"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Items</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle"></i><div><div class="stat-number">${currentData.filter(i => i.status === 'available').length}</div><div class="stat-label">Available</div></div></div>
        <div class="stat-box"><i class="fas fa-ban"></i><div><div class="stat-number">${currentData.filter(i => i.status === 'sold').length}</div><div class="stat-label">Sold</div></div></div>
      </div>
      ${currentData.length ? renderMarketplaceTable(currentData) : '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>No items found</p></div>'}
    `;
  }

  function renderMarketplaceTable(data) {
    return `<div class="table-container"><table class="admin-table">
      <thead><tr><th>Item</th><th>Seller</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${data.map(item => `<tr>
        <td><strong>${item.title || item.name || '-'}</strong></td>
        <td>${item.sellerName || item.userId || '-'}</td>
        <td>${item.category || '-'}</td>
        <td>KSh ${Number(item.price || 0).toLocaleString()}</td>
        <td><span class="status-badge ${item.status === 'available' ? 'status-active' : item.status === 'sold' ? 'status-sold' : 'status-pending'}">${item.status || 'Available'}</span></td>
        <td><button class="btn-action btn-delete" onclick="AdminOperations.removeItem('${item.id}','marketplace')" title="Remove"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  async function loadInquiries() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/admin/inquiries`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.inquiries || [];
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-envelope"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(i => !i.status || i.status === 'new').length}</div><div class="stat-label">New</div></div></div>
      </div>
      ${currentData.length ? `<div class="table-container"><table class="admin-table">
        <thead><tr><th>From</th><th>Property</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${currentData.map(inq => `<tr>
          <td>${inq.senderName || inq.name || '-'}<br><small>${inq.phone || inq.email || ''}</small></td>
          <td>${inq.propertyTitle || inq.propertyId || '-'}</td>
          <td>${(inq.message || '-').substring(0, 60)}</td>
          <td>${inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-GB') : '-'}</td>
          <td><span class="status-badge ${inq.status === 'responded' ? 'status-active' : 'status-pending'}">${inq.status || 'New'}</span></td>
        </tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-envelope"></i><p>No inquiries found</p></div>'}
    `;
  }

  async function loadReviews() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/admin/reviews`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.reviews || [];
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-star"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total</div></div></div>
        <div class="stat-box"><i class="fas fa-flag"></i><div><div class="stat-number">${currentData.filter(r => r.flagged).length}</div><div class="stat-label">Flagged</div></div></div>
      </div>
      ${currentData.length ? `<div class="table-container"><table class="admin-table">
        <thead><tr><th>Reviewer</th><th>Property</th><th>Rating</th><th>Comment</th><th>Actions</th></tr></thead>
        <tbody>${currentData.map(r => `<tr>
          <td>${r.reviewerName || r.userId || '-'}</td>
          <td>${r.propertyTitle || r.propertyId || '-'}</td>
          <td>${'★'.repeat(r.rating || 0)}${'☆'.repeat(5-(r.rating||0))}</td>
          <td>${(r.comment || '-').substring(0, 60)}</td>
          <td><button class="btn-action btn-delete" onclick="AdminOperations.removeItem('${r.id}','review')" title="Delete"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-star"></i><p>No reviews found</p></div>'}
    `;
  }

  async function loadReports() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/admin/reports`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.reports || [];
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-exclamation-triangle"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(r => !r.status || r.status === 'open').length}</div><div class="stat-label">Open</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(r => r.status === 'resolved').length}</div><div class="stat-label">Resolved</div></div></div>
      </div>
      ${currentData.length ? `<div class="table-container"><table class="admin-table">
        <thead><tr><th>Reporter</th><th>Type</th><th>Reason</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${currentData.map(r => `<tr>
          <td>${r.reporterName || r.reportedBy || '-'}</td>
          <td>${r.type || '-'}</td>
          <td>${(r.reason || r.description || '-').substring(0, 60)}</td>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '-'}</td>
          <td><span class="status-badge ${r.status === 'resolved' ? 'status-active' : 'status-pending'}">${r.status || 'Open'}</span></td>
        </tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>No reports found</p></div>'}
    `;
  }

  async function loadSupport() {
    const content = document.getElementById('operations-content');
    const res = await fetch(`${API_BASE}/api/admin/support`, { headers: authHeaders() });
    const data = await res.json();
    currentData = data.tickets || [];
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-ticket-alt"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(t => t.status === 'open').length}</div><div class="stat-label">Open</div></div></div>
      </div>
      ${currentData.length ? `<div class="table-container"><table class="admin-table">
        <thead><tr><th>Ticket</th><th>User</th><th>Subject</th><th>Status</th></tr></thead>
        <tbody>${currentData.map(t => `<tr>
          <td><code>#${(t.id||'').substring(0,8)}</code></td>
          <td>${t.userName || t.userId || '-'}</td>
          <td>${t.subject || '-'}</td>
          <td><span class="status-badge ${t.status === 'closed' ? 'status-active' : 'status-pending'}">${t.status || 'Open'}</span></td>
        </tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No support tickets</p></div>'}
    `;
  }

  function search(query) {
    const q = query.toLowerCase();
    const filtered = currentData.filter(item => JSON.stringify(item).toLowerCase().includes(q));
    const el = document.querySelector('.table-container, .empty-state');
    if (el) el.outerHTML = filtered.length > 0 ? `<p style="padding:8px;color:#64748b">${filtered.length} result(s)</p>` : '<div class="empty-state">No results found</div>';
  }

  function viewItem(id, type) { alert(`View ${type} #${id}`); }

  async function removeItem(id, type) {
    if (!confirm(`Remove this ${type}?`)) return;
    const urls = { marketplace: `/api/marketplace/${id}`, service: `/api/services/${id}` };
    const url = urls[type];
    if (!url) { alert('Delete not supported for: ' + type); return; }
    try {
      const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { alert('Removed!'); await loadModuleData(); }
      else { const d = await res.json(); alert('Error: ' + (d.message || 'Failed')); }
    } catch(e) { alert('Error: ' + e.message); }
  }

  async function resolveReport(id) { alert('Mark resolved: ' + id); }

  return { init, search, viewItem, removeItem, resolveReport };
})();

window.AdminOperations = AdminOperations;