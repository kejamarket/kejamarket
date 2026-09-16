/**
 * KejaMarket Admin - Operations Module
 * Handles Services, Marketplace, Inquiries, Reviews, Reports, Support
 */

const AdminOperations = (() => {
  const API_BASE = '';
  let currentModule = 'services';
  let currentData = [];

  // Initialize operations module
  async function init(module = 'services') {
    currentModule = module;
    await loadModuleData();
  }

  // Load module data
  async function loadModuleData() {
    const content = document.getElementById('operations-content');
    if (!content) return;

    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
      switch (currentModule) {
        case 'services':
          await loadServices();
          break;
        case 'marketplace':
          await loadMarketplace();
          break;
        case 'inquiries':
          await loadInquiries();
          break;
        case 'reviews':
          await loadReviews();
          break;
        case 'reports':
          await loadReports();
          break;
        case 'support':
          await loadSupport();
          break;
        default:
          content.innerHTML = '<div class="empty-state">Module not found</div>';
      }
    } catch (error) {
      console.error('Error loading module:', error);
      content.innerHTML = '<div class="error-state">Failed to load data</div>';
    }
  }

  // Load Services
  async function loadServices() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.services || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search services..." onkeyup="AdminOperations.search(this.value)">
        </div>
        <button class="btn-primary"><i class="fas fa-plus"></i> Add Service</button>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-tools"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Services</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(s => s.status === 'active').length}</div><div class="stat-label">Active</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'service') : '<div class="empty-state"><i class="fas fa-tools"></i><p>No services found</p></div>'}
    `;
  }

  // Load Marketplace
  async function loadMarketplace() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.marketplaceItems || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search marketplace..." onkeyup="AdminOperations.search(this.value)">
        </div>
        <button class="btn-primary"><i class="fas fa-plus"></i> Add Item</button>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-shopping-cart"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Items</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(i => i.status === 'available').length}</div><div class="stat-label">Available</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'marketplace') : '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>No marketplace items found</p></div>'}
    `;
  }

  // Load Inquiries
  async function loadInquiries() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.inquiries || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search inquiries..." onkeyup="AdminOperations.search(this.value)">
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-envelope"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Inquiries</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(i => i.status === 'new').length}</div><div class="stat-label">New</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(i => i.status === 'responded').length}</div><div class="stat-label">Responded</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'inquiry') : '<div class="empty-state"><i class="fas fa-envelope"></i><p>No inquiries found</p></div>'}
    `;
  }

  // Load Reviews
  async function loadReviews() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.reviews || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search reviews..." onkeyup="AdminOperations.search(this.value)">
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-star"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Reviews</div></div></div>
        <div class="stat-box"><i class="fas fa-flag"></i><div><div class="stat-number">${currentData.filter(r => r.flagged).length}</div><div class="stat-label">Flagged</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'review') : '<div class="empty-state"><i class="fas fa-star"></i><p>No reviews found</p></div>'}
    `;
  }

  // Load Reports
  async function loadReports() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.reports || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search reports..." onkeyup="AdminOperations.search(this.value)">
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-exclamation-triangle"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Reports</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(r => r.status === 'open').length}</div><div class="stat-label">Open</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(r => r.status === 'resolved').length}</div><div class="stat-label">Resolved</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'report') : '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>No reports found</p></div>'}
    `;
  }

  // Load Support Tickets
  async function loadSupport() {
    const content = document.getElementById('operations-content');
    currentData = store.data?.supportTickets || [];
    
    content.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search tickets..." onkeyup="AdminOperations.search(this.value)">
        </div>
        <button class="btn-primary"><i class="fas fa-plus"></i> New Ticket</button>
      </div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-ticket-alt"></i><div><div class="stat-number">${currentData.length}</div><div class="stat-label">Total Tickets</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">${currentData.filter(t => t.status === 'open').length}</div><div class="stat-label">Open</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">${currentData.filter(t => t.status === 'closed').length}</div><div class="stat-label">Closed</div></div></div>
      </div>
      ${currentData.length ? renderTable(currentData, 'ticket') : '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No support tickets found</p></div>'}
    `;
  }

  // Render generic table
  function renderTable(data, type) {
    const headers = getHeaders(type);
    return `
      <div class="table-container">
        <table class="admin-table">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}<th>Actions</th></tr></thead>
          <tbody>${data.map(item => renderRow(item, type)).join('')}</tbody>
        </table>
      </div>
    `;
  }

  // Get table headers
  function getHeaders(type) {
    const headerMap = {
      service: ['Service', 'Provider', 'Category', 'Price', 'Status'],
      marketplace: ['Item', 'Seller', 'Category', 'Price', 'Status'],
      inquiry: ['From', 'Property', 'Message', 'Date', 'Status'],
      review: ['Reviewer', 'Property', 'Rating', 'Comment', 'Date'],
      report: ['Reporter', 'Type', 'Reason', 'Date', 'Status'],
      ticket: ['Ticket ID', 'User', 'Subject', 'Priority', 'Status']
    };
    return headerMap[type] || [];
  }

  // Render table row
  function renderRow(item, type) {
    return `<tr><td colspan="100" style="text-align: center; padding: 20px; color: #64748b;">Data display coming soon</td></tr>`;
  }

  // Search function
  function search(query) {
    console.log('Searching:', query);
  }

  // Public API
  return { init, search };
})();

window.AdminOperations = AdminOperations;
window.store = window.store || { data: {} }; // Placeholder
