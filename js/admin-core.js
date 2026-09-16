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

  // Users module loader - delegates to AdminUsers module
  async function loadUsers(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-users"></i> User Management</h1>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" data-filter="all">All Users</button>
        <button class="tab-btn" data-filter="tenants">Tenants</button>
        <button class="tab-btn" data-filter="landlords">Landlords</button>
        <button class="tab-btn" data-filter="agents">Agents</button>
        <button class="tab-btn" data-filter="service-providers">Service Providers</button>
        <button class="tab-btn" data-filter="verified">Verified</button>
        <button class="tab-btn" data-filter="pending">Pending</button>
        <button class="tab-btn" data-filter="suspended">Suspended</button>
      </div>
      <div id="users-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>
      </div>
    `;

    // Setup tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AdminUsers.init(btn.dataset.filter);
      });
    });

    // Load users with AdminUsers module
    if (typeof AdminUsers !== 'undefined') {
      await AdminUsers.init(viewData || 'all');
    } else {
      console.error('AdminUsers module not loaded');
    }
  }

  // Properties, Buildings, Units - placeholder loaders
  async function loadProperties(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-home"></i> Property Management</h1>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" data-filter="all">All Properties</button>
        <button class="tab-btn" data-filter="verified">Verified</button>
        <button class="tab-btn" data-filter="pending">Pending</button>
        <button class="tab-btn" data-filter="rejected">Rejected</button>
        <button class="tab-btn" data-filter="available">Available</button>
        <button class="tab-btn" data-filter="taken">Taken</button>
        <button class="tab-btn" data-filter="rental">Rentals</button>
        <button class="tab-btn" data-filter="bnb">BNBs</button>
      </div>
      <div id="properties-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>
      </div>
    `;

    // Setup tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AdminProperties.init(btn.dataset.filter);
      });
    });

    // Load properties with AdminProperties module
    if (typeof AdminProperties !== 'undefined') {
      await AdminProperties.init(viewData || 'all');
    } else {
      console.error('AdminProperties module not loaded');
    }
  }

  async function loadBuildings(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-building"></i> Buildings & Units Management</h1>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" data-view="buildings">
          <i class="fas fa-building"></i> Buildings
        </button>
        <button class="tab-btn" data-view="units">
          <i class="fas fa-door-open"></i> All Units
        </button>
      </div>
      <div id="buildings-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
      </div>
    `;

    // Setup tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AdminBuildings.init(btn.dataset.view);
      });
    });

    // Load buildings with AdminBuildings module
    if (typeof AdminBuildings !== 'undefined') {
      await AdminBuildings.init(viewData || 'buildings');
    } else {
      console.error('AdminBuildings module not loaded');
    }
  }

  async function loadUnits(viewData) {
    // Delegate to buildings module with units view
    await loadBuildings('units');
  }

  async function loadVerification(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-shield-check"></i> Verification Centre</h1>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" data-filter="pending-properties">
          <i class="fas fa-home"></i> Pending Properties
        </button>
        <button class="tab-btn" data-filter="pending-users">
          <i class="fas fa-user-clock"></i> Pending Users
        </button>
        <button class="tab-btn" data-filter="documents">
          <i class="fas fa-file-alt"></i> Documents
        </button>
        <button class="tab-btn" data-filter="recently-approved">
          <i class="fas fa-check-circle"></i> Recently Approved
        </button>
        <button class="tab-btn" data-filter="recently-rejected">
          <i class="fas fa-times-circle"></i> Recently Rejected
        </button>
      </div>
      <div id="verification-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading verification queue...</div>
      </div>
    `;

    // Setup tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AdminVerification.init(btn.dataset.filter);
      });
    });

    // Load verification with AdminVerification module
    if (typeof AdminVerification !== 'undefined') {
      await AdminVerification.init(viewData || 'pending-properties');
    } else {
      console.error('AdminVerification module not loaded');
    }
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
