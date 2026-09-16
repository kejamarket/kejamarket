/**
 * KejaMarket Admin Dashboard Core System
 * Handles routing, state management, and module coordination
 */

const AdminCore = (() => {
  const state = {
    currentModule: 'dashboard',
    currentView: null,
    user: null,
    permissions: {},
    data: {}
  };

  const API_BASE = '';

  // Module registry
  const modules = {
    dashboard: null,
    users: null,
    properties: null,
    buildings: null,
    units: null,
    verification: null,
    rentals: null,
    bnb: null,
    services: null,
    marketplace: null,
    inquiries: null,
    reviews: null,
    reports: null,
    risk: null,
    support: null,
    adminUsers: null,
    audit: null,
    analytics: null,
    locations: null,
    finance: null,
    content: null
  };

  // Initialize admin system
  async function init() {
    console.log('🚀 Initializing KejaMarket Admin System...');
    
    try {
      // Load admin user info
      await loadAdminUser();
      
      // Setup event listeners
      setupEventListeners();
      
      // Load dashboard by default
      await navigate('dashboard');
      
      console.log('✅ Admin system initialized');
    } catch (error) {
      console.error('❌ Admin initialization failed:', error);
      showError('Failed to initialize admin dashboard');
    }
  }

  // Load admin user information
  async function loadAdminUser() {
    const token = localStorage.getItem('keja_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Unauthorized');

      const data = await res.json();
      
      if (!data.user || (data.user.role !== 'admin' && !data.user.isAdmin)) {
        alert('Admin access required');
        window.location.href = '/';
        return;
      }

      state.user = data.user;
      state.permissions = data.user.permissions || {};
      
      // Update header
      updateAdminHeader();
      
    } catch (error) {
      console.error('Failed to load admin user:', error);
      window.location.href = '/';
    }
  }

  // Update admin header info
  function updateAdminHeader() {
    const nameEl = document.getElementById('admin-user-name');
    const roleEl = document.getElementById('admin-user-role');
    
    if (nameEl) nameEl.textContent = state.user?.name || 'Administrator';
    if (roleEl) roleEl.textContent = state.user?.role || 'Admin';
  }

  // Navigation system
  async function navigate(moduleName, viewData = null) {
    console.log(`📍 Navigating to: ${moduleName}`, viewData);
    
    state.currentModule = moduleName;
    state.currentView = viewData;

    // Update active sidebar item
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.module === moduleName) {
        btn.classList.add('active');
      }
    });

    // Load module content
    await loadModuleContent(moduleName, viewData);
  }

  // Load module content
  async function loadModuleContent(moduleName, viewData) {
    const contentArea = document.getElementById('admin-content');
    if (!contentArea) return;

    // Show loading
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
      // Call appropriate module loader
      switch (moduleName) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'users':
          await loadUsers(viewData);
          break;
        case 'properties':
          await loadProperties(viewData);
          break;
        case 'buildings':
          await loadBuildings(viewData);
          break;
        case 'units':
          await loadUnits(viewData);
          break;
        case 'verification':
          await loadVerification(viewData);
          break;
        case 'bnb':
          await loadBNB(viewData);
          break;
        case 'services':
          await loadServices(viewData);
          break;
        case 'marketplace':
          await loadMarketplace(viewData);
          break;
        case 'inquiries':
          await loadInquiries(viewData);
          break;
        case 'reviews':
          await loadReviews(viewData);
          break;
        case 'reports':
          await loadReports(viewData);
          break;
        case 'risk':
          await loadRisk(viewData);
          break;
        case 'support':
          await loadSupport(viewData);
          break;
        case 'adminUsers':
          await loadAdminUsers(viewData);
          break;
        case 'audit':
          await loadAudit(viewData);
          break;
        case 'analytics':
          await loadAnalytics(viewData);
          break;
        case 'finance':
          await loadFinance(viewData);
          break;
        default:
          contentArea.innerHTML = '<div class="empty-state">Module not implemented yet</div>';
      }
    } catch (error) {
      console.error(`Error loading ${moduleName}:`, error);
      contentArea.innerHTML = `<div class="error-state">Error loading module: ${error.message}</div>`;
    }
  }

  // Dashboard loader
  async function loadDashboard() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="dashboard-header">
        <h1><i class="fas fa-chart-line"></i> Dashboard Overview</h1>
      </div>
      <div id="dashboard-stats" class="dashboard-stats">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading statistics...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load dashboard data');

      const data = await res.json();
      renderDashboardStats(data);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      document.getElementById('dashboard-stats').innerHTML = '<div class="error-state">Failed to load dashboard</div>';
    }
  }

  // Render dashboard statistics with clickable cards
  function renderDashboardStats(data) {
    const statsContainer = document.getElementById('dashboard-stats');
    
    const stats = [
      { icon: '👥', label: 'Total Users', value: data.totalUsers || 0, module: 'users', color: '#6366f1' },
      { icon: '🏠', label: 'Properties', value: data.totalProperties || 0, module: 'properties', color: '#10b981' },
      { icon: '🏢', label: 'Buildings', value: data.totalBuildings || 0, module: 'buildings', color: '#f59e0b' },
      { icon: '🚪', label: 'Units', value: data.totalUnits || 0, module: 'units', color: '#8b5cf6' },
      { icon: '📋', label: 'Active Listings', value: data.activeListings || 0, module: 'properties', filter: 'active', color: '#14b8a6' },
      { icon: '⏳', label: 'Pending Listings', value: data.pendingListings || 0, module: 'verification', color: '#f97316' },
      { icon: '🛏️', label: 'BNBs', value: data.totalBNBs || 0, module: 'bnb', color: '#ec4899' },
      { icon: '🔧', label: 'Service Providers', value: data.totalServices || 0, module: 'services', color: '#3b82f6' },
      { icon: '🛋️', label: 'Marketplace Items', value: data.totalMarketplace || 0, module: 'marketplace', color: '#a855f7' },
      { icon: '📩', label: 'New Inquiries', value: data.newInquiries || 0, module: 'inquiries', filter: 'new', color: '#06b6d4' },
      { icon: '🚨', label: 'Open Reports', value: data.openReports || 0, module: 'reports', filter: 'open', color: '#ef4444' },
      { icon: '✅', label: 'Active Users', value: data.activeUsers || 0, module: 'users', filter: 'active', color: '#22c55e' }
    ];

    statsContainer.innerHTML = stats.map(stat => `
      <div class="stat-card" onclick="AdminCore.navigateToModule('${stat.module}', ${stat.filter ? `'${stat.filter}'` : 'null'})" style="cursor: pointer; border-color: ${stat.color}">
        <div class="stat-icon" style="background: ${stat.color}20; color: ${stat.color}">${stat.icon}</div>
        <div class="stat-info">
          <div class="stat-value" style="color: ${stat.color}">${formatNumber(stat.value)}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      </div>
    `).join('');
  }

  // Users module loader (placeholder - will be expanded)
  async function loadUsers(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-users"></i> User Management</h1>
        <button class="btn-primary" onclick="AdminCore.showModal('add-user')">
          <i class="fas fa-plus"></i> Add User
        </button>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" onclick="AdminCore.loadUserTab('all')">All Users</button>
        <button class="tab-btn" onclick="AdminCore.loadUserTab('tenants')">Tenants</button>
        <button class="tab-btn" onclick="AdminCore.loadUserTab('landlords')">Landlords</button>
        <button class="tab-btn" onclick="AdminCore.loadUserTab('agents')">Agents</button>
        <button class="tab-btn" onclick="AdminCore.loadUserTab('pending')">Pending Verification</button>
        <button class="tab-btn" onclick="AdminCore.loadUserTab('suspended')">Suspended</button>
      </div>
      <div id="users-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>
      </div>
    `;

    // Load users data
    await loadUserTab(viewData || 'all');
  }

  async function loadUserTab(tabName) {
    const usersContent = document.getElementById('users-content');
    usersContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/users?filter=${tabName}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load users');

      const data = await res.json();
      renderUsersTable(data.users || []);
      
    } catch (error) {
      console.error('Error loading users:', error);
      usersContent.innerHTML = '<div class="error-state">Failed to load users</div>';
    }
  }

  function renderUsersTable(users) {
    const usersContent = document.getElementById('users-content');
    
    if (!users.length) {
      usersContent.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No users found</p></div>';
      return;
    }

    usersContent.innerHTML = `
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr onclick="AdminCore.viewUser('${user.id}')" style="cursor: pointer;">
                <td>
                  <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div class="user-name">${user.name}</div>
                      <div class="user-id">#${user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>${user.email || '-'}</td>
                <td>${user.phone}</td>
                <td><span class="badge badge-${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-${user.isPhoneVerified ? 'verified' : 'pending'}">${user.isPhoneVerified ? 'Verified' : 'Pending'}</span></td>
                <td>${formatDate(user.createdAt)}</td>
                <td onclick="event.stopPropagation();">
                  <button class="btn-icon" onclick="AdminCore.editUser('${user.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon" onclick="AdminCore.suspendUser('${user.id}')" title="Suspend">
                    <i class="fas fa-ban"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Properties, Buildings, Units - placeholder loaders
  async function loadProperties(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Properties Module...</div>';
    // Will be implemented in next phase
  }

  async function loadBuildings(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Buildings Module...</div>';
  }

  async function loadUnits(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Units Module...</div>';
  }

  async function loadVerification(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Verification Module...</div>';
  }

  async function loadBNB(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading BNB Module...</div>';
  }

  async function loadServices(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Services Module...</div>';
  }

  async function loadMarketplace(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Marketplace Module...</div>';
  }

  async function loadInquiries(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Inquiries Module...</div>';
  }

  async function loadReviews(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Reviews Module...</div>';
  }

  async function loadReports(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Reports Module...</div>';
  }

  async function loadRisk(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Risk & Fraud Module...</div>';
  }

  async function loadSupport(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Support Module...</div>';
  }

  async function loadAdminUsers(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Admin Users Module...</div>';
  }

  async function loadAudit(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Audit Logs Module...</div>';
  }

  async function loadAnalytics(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Analytics Module...</div>';
  }

  async function loadFinance(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loading-state">Loading Finance Module...</div>';
  }

  // Utility functions
  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function showError(message) {
    alert(message); // Temporary - will be replaced with proper toast
  }

  // Setup event listeners
  function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const module = btn.dataset.module;
        if (module) navigate(module);
      });
    });

    // Logout
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('keja_token');
        window.location.href = '/';
      });
    }
  }

  // Public API
  return {
    init,
    navigate,
    navigateToModule: (module, filter) => navigate(module, filter),
    loadUserTab,
    viewUser: (userId) => console.log('View user:', userId),
    editUser: (userId) => console.log('Edit user:', userId),
    suspendUser: (userId) => console.log('Suspend user:', userId),
    showModal: (modalType) => console.log('Show modal:', modalType),
    state
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdminCore.init());
} else {
  AdminCore.init();
}

// Expose globally
window.AdminCore = AdminCore;
