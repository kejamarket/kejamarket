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
      
      // Setup Global Search
      setupGlobalSearch();

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
        case 'house-hunts':
          if (window.AdminHunts && typeof window.AdminHunts.loadHouseHunts === 'function') {
            await window.AdminHunts.loadHouseHunts(viewData);
          } else {
            document.getElementById('admin-content').innerHTML = '<div class="loading-state">Loading House Hunts...</div>';
          }
          break;
        case 'adminUsers':
          await loadAdminUsers(viewData);
          break;
        case 'rentals':
          await loadProperties('rental');
          break;
        case 'locations':
          await loadLocations(viewData);
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
        case 'global':
          await loadGlobal(viewData);
          break;
        case 'featured':
          await loadFeatured(viewData);
          break;
        case 'notifications':
          await loadNotifications(viewData);
          break;
        case 'appsettings':
          await loadAppSettings(viewData);
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
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-bed"></i> Short-Stay & BNB Management</h1>
      </div>
      <div class="module-tabs">
        <button class="tab-btn active" data-filter="all">All BNBs</button>
        <button class="tab-btn" data-filter="active">Active</button>
        <button class="tab-btn" data-filter="pending">Pending</button>
        <button class="tab-btn" data-filter="available">Available</button>
        <button class="tab-btn" data-filter="booked">Booked</button>
      </div>
      <div id="bnb-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
      </div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AdminBNB.init(btn.dataset.filter);
      });
    });

    if (typeof AdminBNB !== 'undefined') {
      await AdminBNB.init(viewData || 'all');
    } else {
      console.error('AdminBNB module not loaded');
    }
  }

  async function loadServices(viewData) {
    await loadOperationsModule('services', 'Services Management', 'tools');
  }

  async function loadMarketplace(viewData) {
    await loadOperationsModule('marketplace', 'Marketplace Management', 'shopping-cart');
  }

  async function loadInquiries(viewData) {
    await loadOperationsModule('inquiries', 'Inquiries Management', 'envelope');
  }

  async function loadReviews(viewData) {
    await loadOperationsModule('reviews', 'Reviews Management', 'star');
  }

  async function loadReports(viewData) {
    await loadOperationsModule('reports', 'Reports & Complaints', 'exclamation-triangle');
  }

  async function loadRisk(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-shield-alt"></i> Risk & Fraud Detection</h1></div>
      <div class="empty-state"><i class="fas fa-shield-alt"></i><p>Risk monitoring system</p><small>Advanced fraud detection coming soon</small></div>
    `;
  }

  async function loadSupport(viewData) {
    await loadOperationsModule('support', 'Support Ticketing', 'ticket-alt');
  }

  async function loadOperationsModule(module, title, icon) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-${icon}"></i> ${title}</h1></div>
      <div id="operations-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div></div>
    `;

    if (typeof AdminOperations !== 'undefined') {
      await AdminOperations.init(module);
    }
  }

  async function loadAdminUsers(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-user-shield"></i> Admin Users & Permissions</h1>
      </div>
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="admin-user-search" placeholder="Search admins..." oninput="filterAdminList(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-primary" onclick="showAddAdminModal()">
            <i class="fas fa-user-plus"></i> Add Admin
          </button>
        </div>
      </div>
      <div id="admin-users-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading admins...</div>
      </div>

      <!-- Add Admin Modal -->
      <div id="add-admin-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:none; align-items:center; justify-content:center;">
        <div style="background:#fff; border-radius:16px; padding:32px; max-width:480px; width:90%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 style="margin:0; color:#1e293b;"><i class="fas fa-user-shield" style="color:#7c3aed;margin-right:8px;"></i>Add Admin</h2>
            <button onclick="closeAddAdminModal()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;">&times;</button>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:20px;">
            <button id="tab-promote" onclick="switchAdminTab('promote')" style="flex:1;padding:10px;border-radius:8px;border:2px solid #7c3aed;background:#7c3aed;color:white;font-weight:700;cursor:pointer;">Promote Existing User</button>
            <button id="tab-create" onclick="switchAdminTab('create')" style="flex:1;padding:10px;border-radius:8px;border:2px solid #e2e8f0;background:#f8fafc;color:#64748b;font-weight:700;cursor:pointer;">Create New Admin</button>
          </div>

          <!-- Promote existing user -->
          <div id="panel-promote">
            <p style="color:#64748b; font-size:0.88rem; margin-bottom:16px;">Enter the User ID or email of an existing user to grant them admin access.</p>
            <label style="font-weight:600;font-size:0.88rem;">User ID or Email</label>
            <input id="promote-user-id" type="text" placeholder="usr-xxx or user@email.com" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 16px;font-size:0.9rem;box-sizing:border-box;">
            <button onclick="promoteUser()" style="width:100%;padding:12px;background:#7c3aed;color:white;border:none;border-radius:8px;font-weight:700;font-size:0.95rem;cursor:pointer;">
              <i class="fas fa-crown"></i> Promote to Admin
            </button>
          </div>

          <!-- Create new admin -->
          <div id="panel-create" style="display:none;">
            <label style="font-weight:600;font-size:0.88rem;">Full Name *</label>
            <input id="new-admin-name" type="text" placeholder="e.g. Jane Mwangi" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 12px;font-size:0.9rem;box-sizing:border-box;">
            <label style="font-weight:600;font-size:0.88rem;">Email</label>
            <input id="new-admin-email" type="email" placeholder="admin@kejamarket.co.ke" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 12px;font-size:0.9rem;box-sizing:border-box;">
            <label style="font-weight:600;font-size:0.88rem;">Phone</label>
            <input id="new-admin-phone" type="tel" placeholder="+254700000000" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 12px;font-size:0.9rem;box-sizing:border-box;">
            <label style="font-weight:600;font-size:0.88rem;">Temporary Password (leave blank to auto-generate)</label>
            <input id="new-admin-password" type="text" placeholder="Auto-generated if empty" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 16px;font-size:0.9rem;box-sizing:border-box;">
            <button onclick="createAdmin()" style="width:100%;padding:12px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;font-size:0.95rem;cursor:pointer;">
              <i class="fas fa-user-plus"></i> Create Admin Account
            </button>
          </div>

          <div id="add-admin-result" style="margin-top:16px;display:none;"></div>
        </div>
      </div>
    `;

    // Inject helper functions into global scope for this module
    window.showAddAdminModal = () => { document.getElementById('add-admin-modal').style.display = 'flex'; };
    window.closeAddAdminModal = () => { document.getElementById('add-admin-modal').style.display = 'none'; };
    window.switchAdminTab = (tab) => {
      document.getElementById('panel-promote').style.display = tab === 'promote' ? 'block' : 'none';
      document.getElementById('panel-create').style.display = tab === 'create' ? 'block' : 'none';
      document.getElementById('tab-promote').style.background = tab === 'promote' ? '#7c3aed' : '#f8fafc';
      document.getElementById('tab-promote').style.color = tab === 'promote' ? 'white' : '#64748b';
      document.getElementById('tab-create').style.background = tab === 'create' ? '#16a34a' : '#f8fafc';
      document.getElementById('tab-create').style.color = tab === 'create' ? 'white' : '#64748b';
    };

    window.promoteUser = async () => {
      const input = document.getElementById('promote-user-id').value.trim();
      if (!input) { alert('Please enter a User ID or email.'); return; }
      const resultEl = document.getElementById('add-admin-result');
      try {
        // Try by userId first, fall back to searching by email
        const res = await fetch('/api/admin/admins', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: input })
        });
        const data = await res.json();
        resultEl.style.display = 'block';
        resultEl.style.padding = '12px';
        resultEl.style.borderRadius = '8px';
        if (data.success) {
          resultEl.style.background = '#f0fdf4';
          resultEl.style.color = '#16a34a';
          resultEl.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
          setTimeout(() => { closeAddAdminModal(); loadAdminUsers(); }, 1500);
        } else {
          resultEl.style.background = '#fef2f2';
          resultEl.style.color = '#dc2626';
          resultEl.innerHTML = `<i class="fas fa-times-circle"></i> ${data.message}`;
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    };

    window.createAdmin = async () => {
      const name = document.getElementById('new-admin-name').value.trim();
      const email = document.getElementById('new-admin-email').value.trim();
      const phone = document.getElementById('new-admin-phone').value.trim();
      const password = document.getElementById('new-admin-password').value.trim();
      if (!name) { alert('Name is required.'); return; }
      if (!email && !phone) { alert('Email or phone is required.'); return; }
      const resultEl = document.getElementById('add-admin-result');
      try {
        const res = await fetch('/api/admin/admins', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();
        resultEl.style.display = 'block';
        resultEl.style.padding = '12px';
        resultEl.style.borderRadius = '8px';
        if (data.success) {
          resultEl.style.background = '#f0fdf4';
          resultEl.style.color = '#16a34a';
          resultEl.innerHTML = `<i class="fas fa-check-circle"></i> Admin created!<br><strong>Temp Password:</strong> <code>${data.tempPassword}</code><br><small>Share this password securely — it won't be shown again.</small>`;
          setTimeout(() => { closeAddAdminModal(); loadAdminUsers(); }, 4000);
        } else {
          resultEl.style.background = '#fef2f2';
          resultEl.style.color = '#dc2626';
          resultEl.innerHTML = `<i class="fas fa-times-circle"></i> ${data.message}`;
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    };

    window.filterAdminList = (q) => {
      const rows = document.querySelectorAll('#admin-users-table tbody tr');
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
      });
    };

    window.revokeAdmin = async (id, name) => {
      if (!confirm(`Remove admin access from ${name}? They will become a regular user.`)) return;
      try {
        const res = await fetch(`/api/admin/admins/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
        });
        const data = await res.json();
        if (data.success) { alert(data.message); await loadAdminUsers(); }
        else alert('Error: ' + data.message);
      } catch (e) { alert('Error: ' + e.message); }
    };

    // Load actual admin list
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const admins = data.admins || [];
      const adminContent = document.getElementById('admin-users-content');

      if (!admins.length) {
        adminContent.innerHTML = '<div class="empty-state"><i class="fas fa-user-shield"></i><p>No admin users found</p></div>';
        return;
      }

      adminContent.innerHTML = `
        <div class="table-container">
          <table class="admin-table" id="admin-users-table">
            <thead><tr><th>Name</th><th>Email / Phone</th><th>ID</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              ${admins.map(a => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">${(a.name||'A').charAt(0)}</div>
                      <div><strong>${a.name || 'Admin'}</strong><br><span style="font-size:0.75rem;background:#f0fdf4;color:#16a34a;padding:2px 8px;border-radius:20px;font-weight:600;">Admin</span></div>
                    </div>
                  </td>
                  <td>${a.email || a.phone || '-'}</td>
                  <td><code style="font-size:0.75rem;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${a.id}</code></td>
                  <td>${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                  <td>
                    ${a.id === 'usr-admin-01' 
                      ? '<span style="color:#94a3b8;font-size:0.8rem;"><i class="fas fa-lock"></i> Super Admin</span>' 
                      : `<button class="btn-action btn-delete" onclick="revokeAdmin('${a.id}','${(a.name||'').replace(/'/g,'')}')" title="Revoke Admin"><i class="fas fa-user-minus"></i> Revoke</button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('admin-users-content').innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load admins: ${err.message}</p></div>`;
    }
  }

  async function loadLocations(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-map-marker-alt"></i> Covered Locations & Estates</h1>
      </div>
      <div id="locations-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading locations...</div>
      </div>
    `;
    try {
      const res = await fetch('/api/admin/all-properties', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const props = data.properties || [];
      const locationMap = {};
      props.forEach(p => {
        const loc = p.estateSuburb || p.estate_suburb || p.county || 'Nairobi Metro';
        if (!locationMap[loc]) locationMap[loc] = { count: 0, verified: 0, rentSum: 0 };
        locationMap[loc].count++;
        if (p.isVerified || p.is_verified || p.status === 'verified') locationMap[loc].verified++;
        locationMap[loc].rentSum += (p.rentKes || p.rent || p.rent_kes || 0);
      });

      const locList = Object.entries(locationMap).sort((a, b) => b[1].count - a[1].count);
      const container = document.getElementById('locations-content');
      if (!locList.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-map-marker-alt"></i><p>No locations found</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="stats-row">
          <div class="stat-box"><i class="fas fa-map-marked-alt"></i><div><div class="stat-number">${locList.length}</div><div class="stat-label">Active Estates</div></div></div>
          <div class="stat-box"><i class="fas fa-home"></i><div><div class="stat-number">${props.length}</div><div class="stat-label">Total Listings</div></div></div>
        </div>
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Estate / Area</th>
                <th>Total Properties</th>
                <th>Verified</th>
                <th>Avg Rent (KES)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${locList.map(([loc, stats]) => `
                <tr>
                  <td><strong><i class="fas fa-location-dot" style="color:#7c3aed;margin-right:8px;"></i>${loc}</strong></td>
                  <td>${stats.count}</td>
                  <td><span class="status-badge status-active">${stats.verified} Verified</span></td>
                  <td>KES ${stats.count ? Math.round(stats.rentSum / stats.count).toLocaleString() : '-'}</td>
                  <td><span class="status-badge status-verified">Active</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('locations-content').innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading locations: ${err.message}</p></div>`;
    }
  }

  async function loadAudit(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-clipboard-list"></i> Security Audit Logs</h1></div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-list"></i><div><div class="stat-number">0</div><div class="stat-label">Total Logs</div></div></div>
        <div class="stat-box"><i class="fas fa-clock"></i><div><div class="stat-number">0</div><div class="stat-label">Today</div></div></div>
      </div>
      <div class="empty-state"><i class="fas fa-clipboard-list"></i><p>All admin actions are logged here</p><small>Track who did what and when</small></div>
    `;
  }

  async function loadAnalytics(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-chart-bar"></i> Analytics & Reports</h1></div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-eye"></i><div><div class="stat-number">0</div><div class="stat-label">Total Views</div></div></div>
        <div class="stat-box"><i class="fas fa-users"></i><div><div class="stat-number">0</div><div class="stat-label">User Growth</div></div></div>
        <div class="stat-box"><i class="fas fa-home"></i><div><div class="stat-number">0</div><div class="stat-label">New Listings</div></div></div>
      </div>
      <div class="empty-state"><i class="fas fa-chart-bar"></i><p>Advanced analytics dashboard</p><small>Charts and reports coming soon</small></div>
    `;
  }

  async function loadFinance(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-dollar-sign"></i> Finance Management</h1></div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-money-bill-wave"></i><div><div class="stat-number">KSh 0</div><div class="stat-label">Total Revenue</div></div></div>
        <div class="stat-box"><i class="fas fa-check"></i><div><div class="stat-number">0</div><div class="stat-label">Transactions</div></div></div>
      </div>
      <div class="empty-state"><i class="fas fa-dollar-sign"></i><p>Financial tracking system</p><small>Payments, commissions, and reports</small></div>
    `;
  }

  async function loadGlobal(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-globe"></i> Site Configuration</h1></div>
      <div class="stats-row">
        <div class="stat-box" style="border-left:4px solid #6366f1;"><i class="fas fa-check-circle" style="color:#6366f1"></i><div><div class="stat-number" style="color:#6366f1">Live</div><div class="stat-label">Site Status</div></div></div>
        <div class="stat-box" style="border-left:4px solid #10b981;"><i class="fas fa-server" style="color:#10b981"></i><div><div class="stat-number" style="color:#10b981">Render</div><div class="stat-label">Hosting</div></div></div>
        <div class="stat-box" style="border-left:4px solid #f59e0b;"><i class="fas fa-database" style="color:#f59e0b"></i><div><div class="stat-number" style="color:#f59e0b">PostgreSQL</div><div class="stat-label">Database</div></div></div>
        <div class="stat-box" style="border-left:4px solid #00b53f;"><i class="fas fa-envelope" style="color:#00b53f"></i><div><div class="stat-number" style="color:#00b53f">Resend</div><div class="stat-label">Email Service</div></div></div>
      </div>
      <div class="table-container" style="margin-top:24px;">
        <table class="admin-table">
          <thead><tr><th>Config Key</th><th>Value</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><strong>Site Name</strong></td><td>KejaMarket</td><td><span class="status-badge status-active">Active</span></td></tr>
            <tr><td><strong>Domain</strong></td><td>kejamarket.co.ke</td><td><span class="status-badge status-active">Active</span></td></tr>
            <tr><td><strong>Email (Resend)</strong></td><td>no-reply@kejamarket.co.ke</td><td><span class="status-badge status-verified">Configured</span></td></tr>
            <tr><td><strong>M-Pesa STK Push</strong></td><td>Safaricom Daraja API</td><td><span class="status-badge status-pending">Pending</span></td></tr>
            <tr><td><strong>Media Storage</strong></td><td>Cloudinary CDN</td><td><span class="status-badge status-active">Active</span></td></tr>
            <tr><td><strong>Auth Mode</strong></td><td>JWT + Bcrypt + Email Reset</td><td><span class="status-badge status-verified">Secure</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  async function loadFeatured(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-star"></i> Featured Listings</h1></div>
      <div class="module-actions">
        <p style="color:#64748b;font-size:0.9rem;">Feature top-quality listings that will appear in the "Featured" section on the homepage.</p>
      </div>
      <div id="featured-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading featured properties...</div></div>
    `;
    try {
      const res = await fetch('/api/admin/all-properties', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const props = (data.properties || []).filter(p => p.status === 'approved' || p.isFeatured);
      const container = document.getElementById('featured-content');
      if (!props.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>No approved properties to feature</p></div>';
        return;
      }
      container.innerHTML = `<div class="table-container"><table class="admin-table">
        <thead><tr><th>Property</th><th>Location</th><th>Rent</th><th>Featured</th></tr></thead>
        <tbody>${props.slice(0, 30).map(p => `
          <tr>
            <td><strong>${p.title || '-'}</strong></td>
            <td>${p.estateSuburb || p.estate_suburb || '-'}</td>
            <td>KSh ${(p.rentKes || p.rent || 0).toLocaleString()}</td>
            <td><span class="status-badge ${p.isFeatured ? 'status-verified' : 'status-pending'}">${p.isFeatured ? '⭐ Featured' : 'Normal'}</span></td>
          </tr>`).join('')}
        </tbody></table></div>`;
    } catch (err) {
      document.getElementById('featured-content').innerHTML = `<div class="error-state"><p>Error: ${err.message}</p></div>`;
    }
  }

  async function loadNotifications(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-bell"></i> System Notifications</h1></div>
      <div class="stats-row">
        <div class="stat-box"><i class="fas fa-bell" style="color:#f59e0b"></i><div><div class="stat-number">0</div><div class="stat-label">Pending Alerts</div></div></div>
        <div class="stat-box"><i class="fas fa-paper-plane" style="color:#6366f1"></i><div><div class="stat-number">0</div><div class="stat-label">Emails Sent Today</div></div></div>
        <div class="stat-box"><i class="fas fa-comment" style="color:#00b53f"></i><div><div class="stat-number">0</div><div class="stat-label">WhatsApp Sent Today</div></div></div>
      </div>
      <div class="empty-state" style="margin-top:24px;">
        <i class="fas fa-bell"></i>
        <p>Push Notification Management</p>
        <small>Send broadcast messages to tenants, landlords, and agencies</small>
        <div style="margin-top:20px;max-width:480px;text-align:left;">
          <label style="font-weight:600;font-size:0.88rem;">Notification Message</label>
          <textarea id="notif-msg" placeholder="Type your announcement here..." style="width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:8px;margin:8px 0 12px;font-size:0.9rem;min-height:80px;box-sizing:border-box;"></textarea>
          <label style="font-weight:600;font-size:0.88rem;">Target Audience</label>
          <select id="notif-audience" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;margin:6px 0 16px;font-size:0.9rem;">
            <option value="all">All Users</option>
            <option value="tenants">Tenants Only</option>
            <option value="landlords">Landlords & Agencies</option>
          </select>
          <button onclick="alert('Notifications feature coming soon!')" style="padding:12px 24px;background:#7c3aed;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
            <i class="fas fa-paper-plane"></i> Send Notification
          </button>
        </div>
      </div>
    `;
  }

  async function loadAppSettings(viewData) {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-cog"></i> App Settings</h1></div>
      <div class="table-container">
        <table class="admin-table">
          <thead><tr><th>Setting</th><th>Current Value</th><th>Description</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Maintenance Mode</strong></td>
              <td><label style="position:relative;display:inline-block;width:44px;height:24px;"><input type="checkbox" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:24px;transition:0.3s;"></span></label></td>
              <td><small style="color:#64748b;">Take site offline for maintenance</small></td>
            </tr>
            <tr>
              <td><strong>Tenant Verification Required</strong></td>
              <td><span class="status-badge status-pending">On Post Only</span></td>
              <td><small style="color:#64748b;">Tenants only need verification to post listings</small></td>
            </tr>
            <tr>
              <td><strong>New User Auto-Approval</strong></td>
              <td><span class="status-badge status-active">Enabled</span></td>
              <td><small style="color:#64748b;">New accounts are immediately active</small></td>
            </tr>
            <tr>
              <td><strong>Listing Approval Required</strong></td>
              <td><span class="status-badge status-verified">Admin Review</span></td>
              <td><small style="color:#64748b;">All new listings require admin approval</small></td>
            </tr>
            <tr>
              <td><strong>Social Sharing</strong></td>
              <td><span class="status-badge status-active">Open (No Auth)</span></td>
              <td><small style="color:#64748b;">Anyone can share property links</small></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
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

  // ============================================================
  // GLOBAL SEARCH CONTROLLER
  // ============================================================
  let searchDebounceTimer = null;
  let activeSearchCategory = 'all';
  let lastSearchResults = null;

  function setupGlobalSearch() {
    const searchInput = document.getElementById('admin-global-search-input');
    const clearBtn = document.getElementById('admin-search-clear-btn');
    const dropdown = document.getElementById('admin-search-dropdown');
    const resultsContainer = document.getElementById('admin-search-results');
    const filterPills = document.querySelectorAll('.search-filter-pill');

    if (!searchInput) return;

    // Keyboard shortcut (Ctrl + K or Cmd + K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      if (e.key === 'Escape') {
        closeGlobalSearch();
      }
    });

    // Category filter buttons
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeSearchCategory = pill.dataset.filter || 'all';
        if (lastSearchResults) {
          renderSearchResults(lastSearchResults, activeSearchCategory);
        }
      });
    });

    // Input events
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

      if (query.length < 2) {
        if (dropdown) dropdown.style.display = query.length > 0 ? 'block' : 'none';
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="search-hint">Type at least 2 characters to search across KejaMarket...</div>';
        }
        lastSearchResults = null;
        return;
      }

      if (dropdown) dropdown.style.display = 'block';
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="search-hint"><i class="fas fa-spinner fa-spin"></i> Searching database...</div>';
      }

      searchDebounceTimer = setTimeout(() => {
        performGlobalSearch(query);
      }, 250);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2 && dropdown) {
        dropdown.style.display = 'block';
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        closeGlobalSearch();
        searchInput.focus();
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      const container = document.getElementById('admin-global-search-container');
      if (container && !container.contains(e.target)) {
        closeGlobalSearch();
      }
    });
  }

  function closeGlobalSearch() {
    const dropdown = document.getElementById('admin-search-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  }

  async function performGlobalSearch(query) {
    const token = localStorage.getItem('keja_token');
    const resultsContainer = document.getElementById('admin-search-results');

    try {
      const res = await fetch(`${API_BASE}/api/admin/global-search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      lastSearchResults = data.results || {};
      renderSearchResults(lastSearchResults, activeSearchCategory);
    } catch (err) {
      console.error('Search error:', err);
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="search-empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Search error</p>
            <small>${err.message}</small>
          </div>
        `;
      }
    }
  }

  function renderSearchResults(results, category) {
    const resultsContainer = document.getElementById('admin-search-results');
    if (!resultsContainer) return;

    const sections = [];

    const showUsers = category === 'all' || category === 'users';
    const showProps = category === 'all' || category === 'properties';
    const showServices = category === 'all' || category === 'services';
    const showMarketplace = category === 'all' || category === 'marketplace';
    const showBuildings = category === 'all' || category === 'buildings';

    let totalShown = 0;

    // Users
    if (showUsers && results.users && results.users.length > 0) {
      totalShown += results.users.length;
      sections.push(`
        <div class="search-section">
          <div class="search-section-header">
            <span><i class="fas fa-users"></i> Users</span>
            <span>${results.users.length} match${results.users.length > 1 ? 'es' : ''}</span>
          </div>
          ${results.users.map(u => `
            <div class="search-result-item" onclick="AdminCore.navigate('users'); AdminCore.closeGlobalSearch();">
              <div class="search-result-icon user"><i class="fas fa-user"></i></div>
              <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(u.name || 'User')}</div>
                <div class="search-result-sub">
                  <span>${escapeHtml(u.phone || u.email || 'No contact')}</span>
                  ${u.email ? `<span>• ${escapeHtml(u.email)}</span>` : ''}
                </div>
              </div>
              <span class="search-result-badge ${u.isAdmin ? 'admin' : (u.role || 'tenant')}">${u.isAdmin ? 'ADMIN' : (u.role || 'user')}</span>
            </div>
          `).join('')}
        </div>
      `);
    }

    // Properties
    if (showProps && results.properties && results.properties.length > 0) {
      totalShown += results.properties.length;
      sections.push(`
        <div class="search-section">
          <div class="search-section-header">
            <span><i class="fas fa-home"></i> Properties</span>
            <span>${results.properties.length} match${results.properties.length > 1 ? 'es' : ''}</span>
          </div>
          ${results.properties.map(p => `
            <div class="search-result-item" onclick="AdminCore.navigate('properties'); AdminCore.closeGlobalSearch();">
              <div class="search-result-icon property"><i class="fas fa-building"></i></div>
              <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(p.title || 'Property Listing')}</div>
                <div class="search-result-sub">
                  <span>KSh ${Number(p.price || 0).toLocaleString()}</span>
                  <span>• ${escapeHtml(p.location || 'Nairobi')}</span>
                  ${p.estateSuburb ? `<span>(${escapeHtml(p.estateSuburb)})</span>` : ''}
                </div>
              </div>
              <span class="search-result-badge ${p.isVerified ? 'verified' : ''}">${p.type || 'Rental'}</span>
            </div>
          `).join('')}
        </div>
      `);
    }

    // Services
    if (showServices && results.services && results.services.length > 0) {
      totalShown += results.services.length;
      sections.push(`
        <div class="search-section">
          <div class="search-section-header">
            <span><i class="fas fa-tools"></i> Services</span>
            <span>${results.services.length} match${results.services.length > 1 ? 'es' : ''}</span>
          </div>
          ${results.services.map(s => `
            <div class="search-result-item" onclick="AdminCore.navigate('services'); AdminCore.closeGlobalSearch();">
              <div class="search-result-icon service"><i class="fas fa-wrench"></i></div>
              <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(s.title || 'Service')}</div>
                <div class="search-result-sub">
                  <span>${escapeHtml(s.serviceType || 'Service')}</span>
                  <span>• By ${escapeHtml(s.providerName || 'Provider')}</span>
                  ${s.location ? `<span>• ${escapeHtml(s.location)}</span>` : ''}
                </div>
              </div>
              <span class="search-result-badge service">${escapeHtml(s.serviceType || 'Service')}</span>
            </div>
          `).join('')}
        </div>
      `);
    }

    // Marketplace
    if (showMarketplace && results.marketplace && results.marketplace.length > 0) {
      totalShown += results.marketplace.length;
      sections.push(`
        <div class="search-section">
          <div class="search-section-header">
            <span><i class="fas fa-shopping-bag"></i> Marketplace Items</span>
            <span>${results.marketplace.length} match${results.marketplace.length > 1 ? 'es' : ''}</span>
          </div>
          ${results.marketplace.map(m => `
            <div class="search-result-item" onclick="AdminCore.navigate('marketplace'); AdminCore.closeGlobalSearch();">
              <div class="search-result-icon marketplace"><i class="fas fa-tag"></i></div>
              <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(m.title || 'Marketplace Item')}</div>
                <div class="search-result-sub">
                  <span>KSh ${Number(m.price || 0).toLocaleString()}</span>
                  <span>• ${escapeHtml(m.category || 'Item')}</span>
                  ${m.location ? `<span>• ${escapeHtml(m.location)}</span>` : ''}
                </div>
              </div>
              <span class="search-result-badge">${escapeHtml(m.category || 'For Sale')}</span>
            </div>
          `).join('')}
        </div>
      `);
    }

    // Buildings
    if (showBuildings && results.buildings && results.buildings.length > 0) {
      totalShown += results.buildings.length;
      sections.push(`
        <div class="search-section">
          <div class="search-section-header">
            <span><i class="fas fa-building"></i> Buildings</span>
            <span>${results.buildings.length} match${results.buildings.length > 1 ? 'es' : ''}</span>
          </div>
          ${results.buildings.map(b => `
            <div class="search-result-item" onclick="AdminCore.navigate('buildings'); AdminCore.closeGlobalSearch();">
              <div class="search-result-icon building"><i class="fas fa-city"></i></div>
              <div class="search-result-info">
                <div class="search-result-title">${escapeHtml(b.name || 'Building')}</div>
                <div class="search-result-sub">
                  <span>${escapeHtml(b.location || '')}</span>
                  ${b.unitsCount ? `<span>• ${b.unitsCount} units</span>` : ''}
                </div>
              </div>
              <span class="search-result-badge">BUILDING</span>
            </div>
          `).join('')}
        </div>
      `);
    }

    if (totalShown === 0) {
      resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <i class="fas fa-search"></i>
          <p>No results found</p>
          <small>Try searching with another keyword or category</small>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = sections.join('');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public API
  return {
    init,
    navigate,
    navigateToModule: (module, filter) => navigate(module, filter),
    closeGlobalSearch,
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
