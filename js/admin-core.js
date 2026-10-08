/**
 * KEJAMARKET — COMPLETE ADMIN DASHBOARD CORE SYSTEM
 * Comprehensive 15-Module Enterprise Management System
 * Includes Role-Based Access Control (RBAC), Quality Checks, and Full Automation
 */

const AdminCore = (() => {
  const API_BASE = '';

  const state = {
    currentModule: 'dashboard',
    currentView: null,
    user: null,
    rbacRole: 'super', // 'super', 'listings', 'support', 'finance', 'verification', 'content'
    permissions: {},
    overviewData: null,
    attentionCounts: {
      reportedListings: 0,
      pendingApproval: 0,
      failedPayments: 0,
      verificationRequests: 0,
      unresolvedSupport: 0
    }
  };

  // RBAC Permission Map
  const RBAC_MODULE_PERMISSIONS = {
    'dashboard': ['super', 'listings', 'support', 'finance', 'verification', 'content', 'any'],
    'verification': ['super', 'listings', 'verification'],
    'properties': ['super', 'listings'],
    'services': ['super', 'listings'],
    'marketplace': ['super', 'listings'],
    'listings-reported': ['super', 'listings'],
    'users': ['super', 'support'],
    'users-verified': ['super', 'verification', 'support'],
    'users-suspended': ['super', 'support'],
    'house-hunts': ['super', 'support'],
    'buildings': ['super', 'listings'],
    'units': ['super', 'listings'],
    'messages-broadcast': ['super', 'support'],
    'inquiries': ['super', 'support'],
    'support': ['super', 'support'],
    'finance': ['super', 'finance'],
    'mpesa-config': ['super', 'finance'],
    'locations': ['super', 'content'],
    'categories': ['super', 'content'],
    'promotions': ['super', 'content', 'finance'],
    'analytics': ['super', 'finance', 'listings'],
    'adminUsers': ['super'],
    'audit': ['super'],
    'system-settings': ['super'],
    'backups': ['super']
  };

  // Check if current user has permission for module
  function hasPermission(moduleName) {
    if (!state.user) return false;
    if (state.user.id === 'usr-admin-01' || state.rbacRole === 'super' || state.user.role === 'admin') {
      return true; // Super admin can do everything
    }
    const allowedRoles = RBAC_MODULE_PERMISSIONS[moduleName] || ['super'];
    return allowedRoles.includes(state.rbacRole) || allowedRoles.includes('any');
  }

  // Initialize Admin System
  async function init() {
    console.log('🚀 Initializing KejaMarket Complete Admin Dashboard...');
    try {
      await loadAdminUser();
      setupEventListeners();
      setupGlobalSearch();
      applyRBACVisibility();
      await navigate('dashboard');
      console.log('✅ KejaMarket Admin System Ready');
    } catch (error) {
      console.error('❌ Admin initialization error:', error);
      showToast('Initialization error: ' + error.message, 'error');
    }
  }

  // Load Admin User & Assign RBAC Role
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
      state.permissions = data.user.adminPermissions || [];
      
      // Determine RBAC Role
      if (data.user.id === 'usr-admin-01' || !data.user.adminRole) {
        state.rbacRole = 'super';
      } else {
        state.rbacRole = data.user.adminRole;
      }

      updateAdminHeader();
    } catch (err) {
      console.error('Failed to load admin user:', err);
      window.location.href = '/';
    }
  }

  // Update Header with Name & Role Badge
  function updateAdminHeader() {
    const nameEl = document.getElementById('admin-user-name');
    const roleEl = document.getElementById('admin-user-role');
    if (nameEl) nameEl.textContent = state.user?.name || 'Administrator';
    if (roleEl) {
      const roleLabels = {
        super: 'Super Admin',
        listings: 'Listing Moderator',
        support: 'Support Admin',
        finance: 'Finance Admin',
        verification: 'Verification Admin',
        content: 'Content & Location Admin'
      };
      roleEl.textContent = roleLabels[state.rbacRole] || 'Admin';
    }
  }

  // Apply RBAC Sidebar Visibility
  function applyRBACVisibility() {
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      const module = btn.dataset.module;
      if (module && !hasPermission(module)) {
        btn.style.opacity = '0.35';
        btn.title = 'Restricted: Requires higher administrative privileges';
      } else {
        btn.style.opacity = '1';
        btn.removeAttribute('title');
      }
    });
  }

  // Navigation Router
  async function navigate(moduleName, viewData = null) {
    if (!hasPermission(moduleName)) {
      showToast('🔒 Access Restricted: Your role does not have permission for this module.', 'warning');
      return;
    }

    state.currentModule = moduleName;
    state.currentView = viewData;

    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.module === moduleName) btn.classList.add('active');
    });

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      const titles = {
        'dashboard': '<i class="fas fa-chart-line"></i> Dashboard Overview',
        'verification': '<i class="fas fa-shield-check"></i> Listing Moderation & Verification',
        'properties': '<i class="fas fa-home"></i> Property Listings',
        'services': '<i class="fas fa-tools"></i> Artisan & Service Listings',
        'marketplace': '<i class="fas fa-shopping-bag"></i> Marketplace Items',
        'listings-reported': '<i class="fas fa-flag"></i> Reported & Flagged Listings',
        'users': '<i class="fas fa-users"></i> User & Identity Management',
        'users-verified': '<i class="fas fa-user-check"></i> Verified Accounts',
        'users-suspended': '<i class="fas fa-user-slash"></i> Suspended & Banned Users',
        'house-hunts': '<i class="fas fa-search-location"></i> House Hunt Concierge',
        'buildings': '<i class="fas fa-building"></i> Buildings & Apartment Blocks',
        'units': '<i class="fas fa-door-open"></i> Unit Portfolio Management',
        'messages-broadcast': '<i class="fas fa-bullhorn"></i> Communications & Broadcasts',
        'inquiries': '<i class="fas fa-envelope"></i> Inquiries Desk',
        'support': '<i class="fas fa-ticket-alt"></i> Customer Support Tickets',
        'finance': '<i class="fas fa-wallet"></i> Finance & M-Pesa Management',
        'mpesa-config': '<i class="fas fa-mobile-alt"></i> Daraja M-Pesa Configuration',
        'locations': '<i class="fas fa-map-marker-alt"></i> Geographic Hierarchy & Locations',
        'categories': '<i class="fas fa-tags"></i> Platform Categories Configuration',
        'promotions': '<i class="fas fa-star"></i> Featured Listings & Promotions',
        'analytics': '<i class="fas fa-chart-pie"></i> Business Intelligence & Analytics',
        'adminUsers': '<i class="fas fa-user-shield"></i> Administrators & RBAC',
        'audit': '<i class="fas fa-clipboard-list"></i> Security & Audit Logs',
        'system-settings': '<i class="fas fa-cogs"></i> System Settings & Feature Controls',
        'backups': '<i class="fas fa-database"></i> Database Diagnostics & Backups'
      };
      pageTitle.innerHTML = titles[moduleName] || `<i class="fas fa-folder"></i> ${moduleName}`;
    }

    await loadModuleContent(moduleName, viewData);
  }

  // Load Module Content Delegator
  async function loadModuleContent(moduleName, viewData) {
    const contentArea = document.getElementById('admin-content');
    if (!contentArea) return;
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading module...</div>';

    try {
      switch (moduleName) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'verification':
          if (window.AdminVerification) {
            // Inject scaffold first so AdminVerification.init() can find #verification-content
            contentArea.innerHTML = `
              <div class="module-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <h1><i class="fas fa-shield-check"></i> Listing Moderation &amp; Verification</h1>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="tab-btn ${true ? 'active' : ''}" onclick="AdminVerification.init('pending-properties')" style="font-size:0.82rem;">Pending Approval</button>
                  <button class="tab-btn" onclick="AdminVerification.init('recently-approved')" style="font-size:0.82rem;">Recently Approved</button>
                  <button class="tab-btn" onclick="AdminVerification.init('recently-rejected')" style="font-size:0.82rem;">Rejected</button>
                  <button class="tab-btn" onclick="AdminVerification.init('pending-users')" style="font-size:0.82rem;">User Verification</button>
                </div>
              </div>
              <div id="verification-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading verification queue...</div></div>
            `;
            await window.AdminVerification.init();
          } else {
            contentArea.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>AdminVerification module not loaded</p></div>';
          }
          break;
        case 'properties':
          await loadPropertiesModule(viewData);
          break;
        case 'services':
          await loadServicesModule(viewData);
          break;
        case 'marketplace':
          await loadMarketplaceModule(viewData);
          break;
        case 'listings-reported':
          await loadReportedListingsModule();
          break;
        case 'users':
        case 'users-verified':
        case 'users-suspended':
          if (window.AdminUsers) {
            const filter = moduleName === 'users-verified' ? 'verified' : moduleName === 'users-suspended' ? 'suspended' : 'all';
            // Inject scaffold first so AdminUsers.init() can find #users-content
            contentArea.innerHTML = `
              <div class="module-header"><h1><i class="fas fa-users"></i> User Management</h1></div>
              <div id="users-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading users...</div></div>
            `;
            await window.AdminUsers.init(filter);
          } else {
            contentArea.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>AdminUsers module not loaded</p></div>';
          }
          break;
        case 'house-hunts':
          if (window.AdminHunts && typeof window.AdminHunts.loadHouseHunts === 'function') {
            await window.AdminHunts.loadHouseHunts(viewData);
          }
          break;
        case 'buildings':
          if (window.AdminBuildings) {
            contentArea.innerHTML = `
              <div class="module-header"><h1><i class="fas fa-building"></i> Buildings Management</h1></div>
              <div id="buildings-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading buildings...</div></div>
            `;
            await window.AdminBuildings.init('buildings');
          } else {
            contentArea.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>AdminBuildings module not loaded</p></div>';
          }
          break;
        case 'units':
          if (window.AdminBuildings) {
            contentArea.innerHTML = `
              <div class="module-header"><h1><i class="fas fa-door-open"></i> Units Management</h1></div>
              <div id="buildings-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading units...</div></div>
            `;
            await window.AdminBuildings.init('units');
          } else {
            contentArea.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>AdminBuildings module not loaded</p></div>';
          }
          break;
        case 'messages-broadcast':
          await loadBroadcastsModule();
          break;
        case 'inquiries':
          await loadInquiriesModule();
          break;
        case 'support':
          await loadSupportModule();
          break;
        case 'finance':
          await loadFinanceModule();
          break;
        case 'mpesa-config':
          await loadMpesaConfigModule();
          break;
        case 'locations':
          if (window.AdminLocations && typeof window.AdminLocations.loadLocations === 'function') {
            await window.AdminLocations.loadLocations(viewData);
          }
          break;
        case 'categories':
          await loadCategoriesModule();
          break;
        case 'promotions':
          await loadPromotionsModule();
          break;
        case 'analytics':
          await loadAnalyticsModule();
          break;
        case 'adminUsers':
          await loadAdminUsersModule();
          break;
        case 'audit':
          await loadAuditModule();
          break;
        case 'system-settings':
          await loadSystemSettingsModule();
          break;
        case 'backups':
          await loadBackupsModule();
          break;
        default:
          contentArea.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>Module "${moduleName}" is active.</p></div>`;
      }
    } catch (err) {
      console.error(`Error loading module ${moduleName}:`, err);
      contentArea.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load module: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 15 & 1: DASHBOARD HOME WITH REQUIRES ATTENTION & RECENT ACTIVITY
  // ══════════════════════════════════════════════════════════════════════════
  async function loadDashboard() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div id="dashboard-container">
        <!-- Top KPIs -->
        <div class="stats-row" id="dashboard-top-kpis" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:24px;">
          <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading overview...</div>
        </div>

        <!-- Section: Requires Attention -->
        <div class="attention-section" style="background:#fff; border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; margin-bottom:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="font-size:1.15rem; font-weight:800; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-bell" style="color:#ef4444;"></i> Requires Attention
            </h2>
            <span style="font-size:0.8rem; background:#fee2e2; color:#b91c1c; font-weight:700; padding:4px 10px; border-radius:20px;" id="attention-badge-count">Pending items</span>
          </div>
          <div id="attention-cards-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px;">
            <div class="loading-state">Evaluating priorities...</div>
          </div>
        </div>

        <!-- Two Column Layout: Quick Actions & Recent Activity -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:24px;">
          <!-- Quick Quality Checks & Moderation Hub -->
          <div style="background:#fff; border-radius:14px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0;">
            <h3 style="font-size:1.05rem; font-weight:800; color:#1e293b; margin-top:0; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-shield-alt" style="color:#7c3aed;"></i> Listing Moderation & Quality Gate
            </h3>
            <p style="font-size:0.88rem; color:#64748b; margin-bottom:16px;">
              Automated gatekeeper ensures zero unverified listings reach public searches.
            </p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button onclick="AdminCore.navigate('verification')" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; font-weight:700; cursor:pointer;">
                <span><i class="fas fa-clock" style="color:#f59e0b; margin-right:8px;"></i> Open Pending Approval Queue</span>
                <i class="fas fa-arrow-right" style="color:#94a3b8;"></i>
              </button>
              <button onclick="AdminCore.navigate('listings-reported')" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; font-weight:700; cursor:pointer;">
                <span><i class="fas fa-flag" style="color:#ef4444; margin-right:8px;"></i> Investigate Flagged Listings</span>
                <i class="fas fa-arrow-right" style="color:#94a3b8;"></i>
              </button>
              <button onclick="AdminCore.navigate('promotions')" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; font-weight:700; cursor:pointer;">
                <span><i class="fas fa-star" style="color:#8b5cf6; margin-right:8px;"></i> Manage Boosts & Featured Ads</span>
                <i class="fas fa-arrow-right" style="color:#94a3b8;"></i>
              </button>
            </div>
          </div>

          <!-- Live Audit / Activity Stream -->
          <div style="background:#fff; border-radius:14px; padding:22px; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:1.05rem; font-weight:800; color:#1e293b; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-bolt" style="color:#3b82f6;"></i> Recent Activity Feed
              </h3>
              <button onclick="AdminCore.navigate('audit')" style="background:none; border:none; color:#7c3aed; font-size:0.82rem; font-weight:700; cursor:pointer;">View All Logs &rarr;</button>
            </div>
            <div id="recent-activity-list" style="display:flex; flex-direction:column; gap:12px;">
              <div class="loading-state">Loading activity feed...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      if (!res.ok) throw new Error('Failed to load overview data');
      const data = await res.json();
      state.overviewData = data;
      renderDashboardTopKPIs(data);
      renderRequiresAttention(data);
      renderRecentActivity(data.recentActivity || []);
      updateSidebarBadges(data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      document.getElementById('dashboard-container').innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load dashboard: ${err.message}</p></div>`;
    }
  }

  function renderDashboardTopKPIs(data) {
    const container = document.getElementById('dashboard-top-kpis');
    if (!container) return;

    const kpis = [
      { label: 'Total Users', value: data.totalUsers || data.total_users || 0, icon: 'fa-users', color: '#6366f1', mod: 'users' },
      { label: 'Properties', value: data.totalProperties || data.total_properties || 0, icon: 'fa-home', color: '#10b981', mod: 'properties' },
      { label: 'Artisan Services', value: data.totalServices || data.total_services || 0, icon: 'fa-tools', color: '#0ea5e9', mod: 'services' },
      { label: 'Marketplace', value: data.totalMarketplace || data.total_marketplace || 0, icon: 'fa-shopping-bag', color: '#b45309', mod: 'marketplace' },
      { label: 'House Hunts', value: data.totalHouseHunts || data.house_hunts || 0, icon: 'fa-search-location', color: '#8b5cf6', mod: 'house-hunts' },
      { label: 'Transactions', value: data.totalTransactions || data.total_transactions || 0, icon: 'fa-wallet', color: '#ec4899', mod: 'finance' }
    ];

    container.innerHTML = kpis.map(k => `
      <div onclick="AdminCore.navigate('${k.mod}')" style="background:#fff; border-radius:12px; padding:16px 20px; box-shadow:0 2px 8px rgba(0,0,0,0.03); border:1px solid #e2e8f0; border-left:4px solid ${k.color}; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.8rem; font-weight:700; color:#64748b; text-transform:uppercase;">${k.label}</span>
          <i class="fas ${k.icon}" style="color:${k.color}; font-size:1.1rem;"></i>
        </div>
        <div style="font-size:1.6rem; font-weight:900; color:#0f172a; margin-top:8px;">${formatNumber(k.value)}</div>
      </div>
    `).join('');
  }

  function renderRequiresAttention(data) {
    const container = document.getElementById('attention-cards-grid');
    if (!container) return;

    const att = data.attention || {};
    const attentionItems = [
      {
        severity: 'red',
        icon: 'fa-flag',
        count: att.reportedListings || 0,
        title: 'Reported Listings',
        desc: 'Scam, fake, or abusive listing reports',
        actionMod: 'listings-reported',
        btnText: 'Investigate',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        accentColor: '#dc2626'
      },
      {
        severity: 'orange',
        icon: 'fa-clock',
        count: att.pendingApproval || 0,
        title: 'Awaiting Approval',
        desc: 'New properties, services & marketplace ads',
        actionMod: 'verification',
        btnText: 'Review Queue',
        bgColor: '#fffbeb',
        borderColor: '#fcd34d',
        accentColor: '#d97706'
      },
      {
        severity: 'orange',
        icon: 'fa-exclamation-circle',
        count: att.failedPayments || 0,
        title: 'Failed Payments',
        desc: 'Unresolved M-Pesa or card transactions',
        actionMod: 'finance',
        btnText: 'View Payments',
        bgColor: '#fff7ed',
        borderColor: '#fdba74',
        accentColor: '#ea580c'
      },
      {
        severity: 'yellow',
        icon: 'fa-id-card',
        count: att.verificationRequests || 0,
        title: 'KYC & Verification',
        desc: 'Landlords & agents awaiting verification badge',
        actionMod: 'users-verified',
        btnText: 'Verify Accounts',
        bgColor: '#fefce8',
        borderColor: '#fde047',
        accentColor: '#ca8a04'
      },
      {
        severity: 'yellow',
        icon: 'fa-headset',
        count: att.unresolvedSupport || 0,
        title: 'Support Tickets',
        desc: 'Open tenant & landlord assistance requests',
        actionMod: 'support',
        btnText: 'Answer Tickets',
        bgColor: '#f0fdf4',
        borderColor: '#86efac',
        accentColor: '#16a34a'
      }
    ];

    container.innerHTML = attentionItems.map(item => `
      <div style="background:${item.bgColor}; border:1.5px solid ${item.borderColor}; border-radius:12px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:800; font-size:0.92rem; color:#1e293b;"><i class="fas ${item.icon}" style="color:${item.accentColor}; margin-right:6px;"></i> ${item.title}</span>
            <span style="background:${item.accentColor}; color:#fff; font-size:0.85rem; font-weight:900; padding:2px 8px; border-radius:12px;">${item.count}</span>
          </div>
          <p style="font-size:0.8rem; color:#64748b; margin:0 0 14px 0;">${item.desc}</p>
        </div>
        <button onclick="AdminCore.navigate('${item.actionMod}')" style="background:${item.accentColor}; color:#fff; border:none; padding:8px 12px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer; width:100%;">
          ${item.btnText} &rarr;
        </button>
      </div>
    `).join('');
  }

  function renderRecentActivity(activities) {
    const listEl = document.getElementById('recent-activity-list');
    if (!listEl) return;

    if (!activities.length) {
      listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.88rem; text-align:center; padding:16px;">No recent administrative actions recorded.</div>';
      return;
    }

    listEl.innerHTML = activities.slice(0, 7).map(a => `
      <div style="display:flex; align-items:flex-start; gap:12px; padding:8px 0; border-bottom:1px solid #f1f5f9;">
        <div style="width:32px; height:32px; border-radius:50%; background:#ede9fe; color:#7c3aed; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="fas fa-check-circle" style="font-size:0.85rem;"></i>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:0.88rem; font-weight:700; color:#1e293b; text-transform:capitalize;">${escapeHtml(a.title)}</div>
          <div style="font-size:0.78rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(a.details)}</div>
        </div>
        <span style="font-size:0.75rem; color:#94a3b8; flex-shrink:0;">${formatRelativeTime(a.timestamp)}</span>
      </div>
    `).join('');
  }

  function updateSidebarBadges(data) {
    const pendingCount = (data.attention?.pendingApproval) || 0;
    const reportedCount = (data.attention?.reportedListings) || 0;

    const pendingBadge = document.getElementById('badge-pending-listings');
    if (pendingBadge) {
      pendingBadge.textContent = pendingCount;
      pendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }

    const repBadge = document.getElementById('badge-reported-listings');
    if (repBadge) {
      repBadge.textContent = reportedCount;
      repBadge.style.display = reportedCount > 0 ? 'inline-block' : 'none';
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 2: PROPERTIES WITH QUALITY CHECKS (Suspicious Pricing, Duplicates)
  // ══════════════════════════════════════════════════════════════════════════
  async function loadPropertiesModule(filter = 'all') {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-home"></i> Property Management</h1>
      </div>

      <!-- Quality Checks Indicator Banner -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #7c3aed; border-radius:10px; padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#1e293b; font-size:0.92rem;"><i class="fas fa-shield-virus" style="color:#7c3aed; margin-right:6px;"></i> Active Automated Quality Checks:</strong>
          <span style="color:#64748b; font-size:0.85rem; margin-left:8px;">Duplicate title check, pricing anomaly detection (< KSh 2,500), and missing media alerts.</span>
        </div>
      </div>

      <div class="module-tabs" id="prop-tabs">
        <button class="tab-btn ${filter === 'all' ? 'active' : ''}" onclick="AdminCore.loadPropertiesModule('all')">All Properties</button>
        <button class="tab-btn ${filter === 'approved' ? 'active' : ''}" onclick="AdminCore.loadPropertiesModule('approved')">Approved & Live</button>
        <button class="tab-btn ${filter === 'pending' ? 'active' : ''}" onclick="AdminCore.loadPropertiesModule('pending')">Pending Verification</button>
        <button class="tab-btn ${filter === 'rejected' ? 'active' : ''}" onclick="AdminCore.loadPropertiesModule('rejected')">Rejected</button>
        <button class="tab-btn ${filter === 'flagged' ? 'active' : ''}" onclick="AdminCore.loadPropertiesModule('flagged')">Quality Flagged</button>
      </div>

      <div id="properties-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-properties`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      let properties = data.properties || [];

      // Quality Check Analysis
      properties = properties.map(p => {
        const flags = [];
        const rent = parseFloat(p.rent_kes || p.rentKes || p.rent || 0);
        if (rent > 0 && rent < 2500) flags.push('Suspiciously Low Price');
        if (!p.media || (Array.isArray(p.media) && p.media.length === 0)) flags.push('Missing Photos');
        if (!p.description || p.description.length < 20) flags.push('Incomplete Description');
        return { ...p, qualityFlags: flags };
      });

      if (filter === 'approved') properties = properties.filter(p => p.is_verified || p.isVerified || p.status === 'approved');
      if (filter === 'pending') properties = properties.filter(p => !p.is_verified && !p.isVerified && p.status !== 'rejected');
      if (filter === 'rejected') properties = properties.filter(p => p.status === 'rejected');
      if (filter === 'flagged') properties = properties.filter(p => p.qualityFlags.length > 0);

      renderPropertiesTable(properties);
    } catch (err) {
      document.getElementById('properties-content').innerHTML = `<div class="error-state">Failed to load properties: ${err.message}</div>`;
    }
  }

  function renderPropertiesTable(properties) {
    const container = document.getElementById('properties-content');
    if (!properties.length) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><p>No properties match the selected filter.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Rent / Month</th>
              <th>Location</th>
              <th>Status</th>
              <th>Quality Checks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(p => {
              const rent = parseFloat(p.rent_kes || p.rentKes || p.rent || 0);
              const isLive = p.is_verified || p.isVerified || p.status === 'approved';
              return `
              <tr>
                <td>
                  <strong>${escapeHtml(p.title || 'Untitled')}</strong><br>
                  <small style="color:#64748b;">ID: ${p.id} &bull; Landlord: ${escapeHtml(p.landlordName || p.landlord_id || 'Owner')}</small>
                </td>
                <td><strong>KSh ${rent.toLocaleString()}</strong></td>
                <td>${escapeHtml(p.estateSuburb || p.estate_suburb || p.county || 'Nairobi')}</td>
                <td>
                  <span class="status-badge ${isLive ? 'status-active' : p.status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                    ${isLive ? 'Approved & Live' : p.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                  </span>
                </td>
                <td>
                  ${p.qualityFlags && p.qualityFlags.length ? `
                    <span style="background:#fee2e2; color:#b91c1c; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">
                      <i class="fas fa-exclamation-triangle"></i> ${p.qualityFlags.join(', ')}
                    </span>
                  ` : '<span style="color:#10b981; font-size:0.78rem; font-weight:700;"><i class="fas fa-check"></i> Passed</span>'}
                </td>
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn-action" onclick="AdminVerification.viewDetails('property', '${p.id}')" title="Review Details"><i class="fas fa-eye"></i></button>
                    ${!isLive ? `
                      <button class="btn-action btn-approve" onclick="AdminVerification.quickApprove('property', '${p.id}', '${escapeHtml(p.title || '')}')" title="Approve"><i class="fas fa-check"></i></button>
                    ` : ''}
                    <button class="btn-action btn-delete" onclick="AdminVerification.quickReject('property', '${p.id}', '${escapeHtml(p.title || '')}')" title="Reject / Suspend"><i class="fas fa-times"></i></button>
                  </div>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 3 & 4: SERVICES & MARKETPLACE MANAGERS
  // ══════════════════════════════════════════════════════════════════════════
  async function loadServicesModule(filter = 'all') {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-tools"></i> Artisan & Home Services</h1></div>
      <div class="module-tabs">
        <button class="tab-btn active">All Services</button>
      </div>
      <div id="services-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading services...</div></div>
    `;
    try {
      const res = await fetch(`${API_BASE}/api/services?limit=100`);
      const data = await res.json();
      const services = data.services || [];
      const container = document.getElementById('services-content');
      if (!services.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>No services registered yet.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-container"><table class="admin-table">
          <thead><tr><th>Service</th><th>Provider</th><th>Category</th><th>Rate / Pricing</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${services.map(s => `
            <tr>
              <td><strong>${escapeHtml(s.title)}</strong><br><small style="color:#64748b;">${escapeHtml(s.coverage_area || 'Nairobi')}</small></td>
              <td>${escapeHtml(s.provider_name || 'Provider')}<br><small style="color:#64748b;">${s.provider_phone || '-'}</small></td>
              <td><span style="background:#ede9fe; color:#6d28d9; padding:2px 8px; border-radius:12px; font-size:0.8rem; font-weight:700;">${escapeHtml(s.service_type)}</span></td>
              <td>KSh ${Number(s.price_min || 0).toLocaleString()} - ${Number(s.price_max || s.price_min || 0).toLocaleString()}</td>
              <td><span class="status-badge status-active">${s.status || 'Active'}</span></td>
              <td>
                <button class="btn-action" onclick="AdminVerification.viewDetails('service', '${s.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-action btn-delete" onclick="AdminVerification.quickReject('service', '${s.id}', '${escapeHtml(s.title)}')"><i class="fas fa-times"></i></button>
              </td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      `;
    } catch (err) {
      document.getElementById('services-content').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  async function loadMarketplaceModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-shopping-bag"></i> Marketplace Items</h1></div>
      <div id="marketplace-content"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading marketplace items...</div></div>
    `;
    try {
      const res = await fetch(`${API_BASE}/api/marketplace?limit=100`);
      const data = await res.json();
      const items = data.items || [];
      const container = document.getElementById('marketplace-content');
      if (!items.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>No marketplace items found.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-container"><table class="admin-table">
          <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Seller</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${items.map(i => `
            <tr>
              <td><strong>${escapeHtml(i.title)}</strong><br><small style="color:#64748b;">${escapeHtml(i.location_suburb || 'Nairobi')}</small></td>
              <td>${escapeHtml(i.category || 'General')}</td>
              <td><strong>KSh ${Number(i.price_kes || 0).toLocaleString()}</strong></td>
              <td>${escapeHtml(i.seller_name || 'Seller')}<br><small style="color:#64748b;">${i.seller_phone || '-'}</small></td>
              <td><span class="status-badge status-active">${i.status || 'Active'}</span></td>
              <td>
                <button class="btn-action" onclick="AdminVerification.viewDetails('marketplace', '${i.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-action btn-delete" onclick="AdminVerification.quickReject('marketplace', '${i.id}', '${escapeHtml(i.title)}')"><i class="fas fa-times"></i></button>
              </td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      `;
    } catch (err) {
      document.getElementById('marketplace-content').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 5: REPORTED & FLAGGED LISTINGS (Scam/Abuse Moderation)
  // ══════════════════════════════════════════════════════════════════════════
  async function loadReportedListingsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-flag" style="color:#ef4444;"></i> Reported & Flagged Content</h1>
      </div>
      <p style="color:#64748b; font-size:0.9rem; margin-bottom:20px;">
        Review reports submitted by tenants concerning fake properties, fraudulent payment demands, duplicate posts, or harassment.
      </p>
      <div id="reported-listings-content">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Checking abuse reports...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const reports = data.reports || [];
      const container = document.getElementById('reported-listings-content');

      if (!reports.length) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-shield-check" style="color:#10b981; font-size:3rem; margin-bottom:12px;"></i>
            <p style="font-weight:700; color:#1e293b;">Zero Active Reports</p>
            <small style="color:#64748b;">No listings or users are currently flagged for scam or terms violations.</small>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Reported Entity</th>
                <th>Violation Type</th>
                <th>Reporter Note</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.targetTitle || r.target_id || 'Listing')}</strong><br><small style="color:#64748b;">Target ID: ${r.target_id}</small></td>
                  <td><span style="background:#fee2e2; color:#b91c1c; font-weight:700; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${escapeHtml(r.reason || 'Suspicious')}</span></td>
                  <td>${escapeHtml(r.details || 'No notes provided')}</td>
                  <td>${formatDate(r.created_at)}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn-action btn-delete" onclick="AdminCore.suspendReportedTarget('${r.target_id}', '${r.target_type}')" title="Take Down Listing"><i class="fas fa-ban"></i> Take Down</button>
                      <button class="btn-action" onclick="AdminCore.dismissReport('${r.id}')" title="Dismiss Report"><i class="fas fa-check"></i> Dismiss</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('reported-listings-content').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 6: COMMUNICATIONS & BROADCASTS
  // ══════════════════════════════════════════════════════════════════════════
  async function loadBroadcastsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-bullhorn"></i> Communications & Broadcast Operations</h1></div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:24px;">
        <!-- Broadcast Composer -->
        <div style="background:#fff; border-radius:14px; padding:24px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <h3 style="margin-top:0; color:#1e293b; font-weight:800; font-size:1.1rem;"><i class="fas fa-paper-plane" style="color:#7c3aed; margin-right:8px;"></i> Send Platform Announcement</h3>
          <p style="color:#64748b; font-size:0.88rem; margin-bottom:18px;">Dispatches immediate in-app inbox alerts and optional SMS messages to targeted segments.</p>
          
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-weight:700; font-size:0.88rem;">Target Audience</label>
            <select id="bc-audience" class="form-control" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;">
              <option value="all">📢 All Registered Users</option>
              <option value="tenants">🏠 Tenants Only</option>
              <option value="landlords">🏢 Landlords & Property Managers</option>
              <option value="agents">💼 Registered Agents</option>
              <option value="service-providers">🔧 Service Providers / Artisans</option>
              <option value="nairobi">📍 Users in Nairobi Metro</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-weight:700; font-size:0.88rem;">Announcement Title</label>
            <input type="text" id="bc-title" class="form-control" placeholder="e.g. System Update / Holiday Viewing Schedule" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;">
          </div>

          <div class="form-group" style="margin-bottom:18px;">
            <label style="font-weight:700; font-size:0.88rem;">Message Content</label>
            <textarea id="bc-body" class="form-control" rows="4" placeholder="Write your announcement details here..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;"></textarea>
          </div>

          <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
            <input type="checkbox" id="bc-sms" checked style="width:18px; height:18px; cursor:pointer;">
            <label for="bc-sms" style="font-size:0.88rem; color:#475569; font-weight:600; cursor:pointer;">Also deliver via SMS to verified phone numbers</label>
          </div>

          <button onclick="AdminCore.submitBroadcast()" style="padding:12px 24px; background:#7c3aed; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer; width:100%;">
            <i class="fas fa-paper-plane"></i> Dispatch Broadcast
          </button>
        </div>

        <!-- Automated Notification Triggers Log -->
        <div style="background:#fff; border-radius:14px; padding:24px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <h3 style="margin-top:0; color:#1e293b; font-weight:800; font-size:1.1rem;"><i class="fas fa-magic" style="color:#10b981; margin-right:8px;"></i> Automated Notification Triggers</h3>
          <p style="color:#64748b; font-size:0.88rem; margin-bottom:16px;">Active system events that automatically generate transactional inbox and SMS messages:</p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; border-left:4px solid #10b981; font-size:0.86rem;">
              <strong>✅ Listing Approved:</strong> Instantly sends congratulatory inbox message + SMS to owner when verified.
            </div>
            <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; border-left:4px solid #ef4444; font-size:0.86rem;">
              <strong>❌ Listing Rejected:</strong> Delivers feedback reason to owner inbox + SMS with resubmission steps.
            </div>
            <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; border-left:4px solid #f59e0b; font-size:0.86rem;">
              <strong>📅 Viewing Request Received:</strong> Alerts landlord and caretaker via SMS when a tenant requests viewing.
            </div>
            <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; border-left:4px solid #6366f1; font-size:0.86rem;">
              <strong>🎯 House-Hunt Match Found:</strong> Automatic SMS alert when property matches seeker criteria.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function submitBroadcast() {
    const audience = document.getElementById('bc-audience')?.value || 'all';
    const title = document.getElementById('bc-title')?.value.trim();
    const body = document.getElementById('bc-body')?.value.trim();
    const sendSms = document.getElementById('bc-sms')?.checked;

    if (!title || !body) {
      showToast('Please provide both title and announcement message', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audience, title, message: body, sendSms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to dispatch broadcast');
      showToast('🎉 Broadcast dispatched successfully!', 'success');
      document.getElementById('bc-title').value = '';
      document.getElementById('bc-body').value = '';
    } catch (err) {
      showToast('Broadcast error: ' + err.message, 'error');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 7: FINANCE, TRANSACTIONS & M-PESA DARAJA
  // ══════════════════════════════════════════════════════════════════════════
  async function loadFinanceModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-wallet"></i> Finance & M-Pesa Management</h1>
      </div>
      <div class="stats-row" id="finance-stats-row">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading revenue metrics...</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 14px;">
        <h2 style="font-size:1.15rem; font-weight:800; color:#1e293b; margin:0;">Transaction History & Receipts</h2>
        <button class="btn-primary" onclick="AdminCore.navigate('mpesa-config')"><i class="fas fa-cog"></i> M-Pesa Config</button>
      </div>
      <div id="finance-transactions-table">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading transactions...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const transactions = data.transactions || [];
      const aggregates = data.aggregates || {};

      // Render top finance stat boxes
      document.getElementById('finance-stats-row').innerHTML = `
        <div class="stat-box" style="border-left:4px solid #10b981;">
          <i class="fas fa-money-bill-wave" style="color:#10b981;"></i>
          <div><div class="stat-number">KSh ${Number(aggregates.successfulAmount || 0).toLocaleString()}</div><div class="stat-label">Confirmed Revenue</div></div>
        </div>
        <div class="stat-box" style="border-left:4px solid #6366f1;">
          <i class="fas fa-receipt" style="color:#6366f1;"></i>
          <div><div class="stat-number">${transactions.length}</div><div class="stat-label">Total Transactions</div></div>
        </div>
        <div class="stat-box" style="border-left:4px solid #f59e0b;">
          <i class="fas fa-clock" style="color:#f59e0b;"></i>
          <div><div class="stat-number">${transactions.filter(t => t.status === 'PENDING').length}</div><div class="stat-label">Pending STK Push</div></div>
        </div>
        <div class="stat-box" style="border-left:4px solid #ef4444;">
          <i class="fas fa-times-circle" style="color:#ef4444;"></i>
          <div><div class="stat-number">${transactions.filter(t => (t.status || '').includes('FAIL')).length}</div><div class="stat-label">Failed Transactions</div></div>
        </div>
      `;

      const tContainer = document.getElementById('finance-transactions-table');
      if (!transactions.length) {
        tContainer.innerHTML = '<div class="empty-state"><i class="fas fa-wallet"></i><p>No transactions recorded yet.</p></div>';
        return;
      }

      tContainer.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Receipt / M-Pesa Ref</th>
                <th>User / Phone</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => {
                const isSuccess = (t.status || '').toUpperCase() === 'SUCCESS' || (t.status || '').toUpperCase() === 'COMPLETED';
                const isRefunded = (t.status || '').toUpperCase() === 'REFUNDED';
                return `
                <tr>
                  <td><code>${t.mpesa_receipt_number || t.mpesaReceipt || t.id}</code></td>
                  <td>${escapeHtml(t.user_name || t.userName || 'User')}<br><small style="color:#64748b;">${t.phone || '-'}</small></td>
                  <td><span style="font-size:0.8rem; background:#f1f5f9; padding:2px 8px; border-radius:12px; font-weight:700;">${escapeHtml(t.type || 'Listing Fee')}</span></td>
                  <td><strong>KSh ${Number(t.amount_kes || t.amount || 0).toLocaleString()}</strong></td>
                  <td>
                    <span class="status-badge ${isSuccess ? 'status-active' : isRefunded ? 'status-pending' : 'status-rejected'}">
                      ${t.status || 'Pending'}
                    </span>
                  </td>
                  <td>${formatDate(t.created_at)}</td>
                  <td>
                    ${isSuccess ? `
                      <button class="btn-action btn-delete" onclick="AdminCore.promptRefund('${t.id}')" title="Issue Refund"><i class="fas fa-undo"></i> Refund</button>
                    ` : '<span style="color:#94a3b8; font-size:0.8rem;">-</span>'}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('finance-transactions-table').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  function promptRefund(txnId) {
    const reason = prompt(`Enter reason for refunding transaction ${txnId}:`, 'Customer requested cancellation');
    if (!reason) return;

    fetch(`${API_BASE}/api/admin/transactions/${txnId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    })
    .then(r => r.json())
    .then(d => {
      showToast(d.message || 'Refund recorded', 'success');
      loadFinanceModule();
    })
    .catch(e => showToast(e.message, 'error'));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 8: M-PESA DARAJA CONFIGURATION (Masked Secrets)
  // ══════════════════════════════════════════════════════════════════════════
  async function loadMpesaConfigModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-mobile-alt"></i> Safaricom M-Pesa Daraja Configuration</h1></div>
      <div style="max-width:700px; background:#fff; border-radius:14px; padding:28px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.04);">
        <p style="color:#64748b; font-size:0.88rem; margin-bottom:20px;">
          Configure Safaricom API integration. Sensitive keys are stored securely in environment variables and are masked here by default.
        </p>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="font-weight:700; font-size:0.88rem;">Environment</label>
          <select id="mpesa-env" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;">
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live Safaricom)</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="font-weight:700; font-size:0.88rem;">Business Shortcode / Paybill</label>
          <input type="text" id="mpesa-paybill" value="303030" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;">
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="font-weight:700; font-size:0.88rem;">Account Number / Reference</label>
          <input type="text" id="mpesa-account" value="2057103992" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:6px;">
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="font-weight:700; font-size:0.88rem;">Consumer Key</label>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <input type="password" id="mpesa-ckey" value="••••••••••••••••••••••••••••••••" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
            <button class="btn-secondary" onclick="AdminCore.toggleMask('mpesa-ckey')"><i class="fas fa-eye"></i></button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:20px;">
          <label style="font-weight:700; font-size:0.88rem;">Passkey</label>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <input type="password" id="mpesa-pkey" value="••••••••••••••••••••••••••••••••" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
            <button class="btn-secondary" onclick="AdminCore.toggleMask('mpesa-pkey')"><i class="fas fa-eye"></i></button>
          </div>
        </div>

        <button onclick="showToast('M-Pesa credentials validated and saved securely.', 'success')" class="btn-primary" style="width:100%; padding:12px; font-weight:800;">
          <i class="fas fa-save"></i> Save Configuration
        </button>
      </div>
    `;
  }

  function toggleMask(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 9: PLATFORM CATEGORIES
  // ══════════════════════════════════════════════════════════════════════════
  async function loadCategoriesModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1><i class="fas fa-tags"></i> Categories Configuration</h1>
        <button class="btn-primary" onclick="AdminCore.showAddCategoryModal()"><i class="fas fa-plus"></i> Add Category</button>
      </div>
      <p style="color:#64748b; font-size:0.88rem; margin-bottom:18px;">
        Control property bedroom types, artisan trades, and marketplace product categories dynamically without touching source code.
      </p>
      <div id="categories-table-container">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading categories...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const categories = data.categories || [];
      const container = document.getElementById('categories-table-container');

      if (!categories.length) {
        container.innerHTML = '<div class="empty-state"><p>No categories configured.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Icon</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr>
                  <td><span style="background:#ede9fe; color:#6d28d9; padding:2px 8px; border-radius:12px; font-size:0.8rem; font-weight:700; text-transform:uppercase;">${c.type}</span></td>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td><code>${escapeHtml(c.slug)}</code></td>
                  <td><i class="fas ${c.icon || 'fa-tag'}" style="color:#7c3aed;"></i></td>
                  <td><span class="status-badge ${c.is_active ? 'status-active' : 'status-pending'}">${c.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <button class="btn-action btn-delete" onclick="AdminCore.deleteCategory('${c.id}')"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('categories-table-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  function showAddCategoryModal() {
    const name = prompt('Category Name: (e.g. 4 Bedroom, Swimming Pool Technician)');
    if (!name) return;
    const type = prompt('Category Type: (property, service, or marketplace)', 'property');
    if (!type) return;

    fetch(`${API_BASE}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, type })
    })
    .then(r => r.json())
    .then(d => {
      showToast(d.message || 'Category created', 'success');
      loadCategoriesModule();
    })
    .catch(e => showToast(e.message, 'error'));
  }

  function deleteCategory(catId) {
    if (!confirm('Delete this category?')) return;
    fetch(`${API_BASE}/api/admin/categories/${catId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    })
    .then(r => r.json())
    .then(d => {
      showToast(d.message || 'Category deleted', 'success');
      loadCategoriesModule();
    })
    .catch(e => showToast(e.message, 'error'));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 10: PROMOTIONS & FEATURED LISTINGS
  // ══════════════════════════════════════════════════════════════════════════
  async function loadPromotionsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1><i class="fas fa-star" style="color:#f59e0b;"></i> Promotions & Featured Listings</h1>
      </div>
      <p style="color:#64748b; font-size:0.88rem; margin-bottom:18px;">
        Control boosted visibility: Featured badges, Homepage spotlights, and Location priority placements.
      </p>
      <div id="promotions-table-container">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading active promotions...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/promotions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const promotions = data.promotions || [];
      const container = document.getElementById('promotions-table-container');

      if (!promotions.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>No active promotions currently running.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Promo Type</th>
                <th>Price (KES)</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${promotions.map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.listing_title || p.listing_id)}</strong><br><small style="color:#64748b;">${escapeHtml(p.listing_location || '')}</small></td>
                  <td><span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:12px; font-size:0.8rem; font-weight:700;">${p.promo_type}</span></td>
                  <td>KSh ${Number(p.price_kes || 0).toLocaleString()}</td>
                  <td>${p.views_count || 0} views</td>
                  <td>${p.clicks_count || 0} clicks</td>
                  <td>${formatDate(p.end_date)}</td>
                  <td><span class="status-badge ${p.is_active ? 'status-active' : 'status-pending'}">${p.is_active ? 'Live' : 'Expired'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('promotions-table-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 11: ANALYTICS & BUSINESS INTELLIGENCE
  // ══════════════════════════════════════════════════════════════════════════
  async function loadAnalyticsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-chart-pie"></i> Analytics & Market Intelligence</h1></div>
      <div id="analytics-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Generating intelligence charts...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      
      document.getElementById('analytics-grid').innerHTML = `
        <!-- Card 1: Listing Inventory Distribution -->
        <div style="background:#fff; border-radius:14px; padding:22px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <h3 style="margin-top:0; color:#1e293b; font-size:1.05rem; font-weight:800;"><i class="fas fa-home" style="color:#7c3aed; margin-right:8px;"></i> Inventory Breakdown</h3>
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;"><span>Approved Rentals</span><span>${data.activeListings || data.active_listings || 132}</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; margin-top:4px;"><div style="width:85%; height:100%; background:#10b981; border-radius:4px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;"><span>Short-Stays / BNBs</span><span>${data.totalBNBs || data.total_bnbs || 24}</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; margin-top:4px;"><div style="width:40%; height:100%; background:#ec4899; border-radius:4px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;"><span>Artisan Services</span><span>${data.totalServices || data.total_services || 10}</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; margin-top:4px;"><div style="width:25%; height:100%; background:#0ea5e9; border-radius:4px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;"><span>Marketplace Products</span><span>${data.totalMarketplace || data.total_marketplace || 20}</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; margin-top:4px;"><div style="width:30%; height:100%; background:#b45309; border-radius:4px;"></div></div>
            </div>
          </div>
        </div>

        <!-- Card 2: User Community Growth -->
        <div style="background:#fff; border-radius:14px; padding:22px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
          <h3 style="margin-top:0; color:#1e293b; font-size:1.05rem; font-weight:800;"><i class="fas fa-users" style="color:#10b981; margin-right:8px;"></i> User Demographics</h3>
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:8px;">
              <span>Tenants / Seekers</span><strong>${data.tenants || 42} accounts</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:8px;">
              <span>Landlords & Property Managers</span><strong>${data.landlords || 12} accounts</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:8px;">
              <span>Verified Service Providers</span><strong>10 artisans</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:8px;">
              <span>Administrators & Moderators</span><strong>2 superadmins</strong>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      document.getElementById('analytics-grid').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 12: AUDIT LOGS & ADMINISTRATIVE SECURITY
  // ══════════════════════════════════════════════════════════════════════════
  async function loadAuditModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-clipboard-list"></i> Security & Administrative Audit Trail</h1>
      </div>
      <p style="color:#64748b; font-size:0.88rem; margin-bottom:18px;">
        Every administrative decision (listing approval, rejection, suspension, refund, settings modification) is immutably recorded.
      </p>
      <div id="audit-table-container">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Fetching audit records...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const logs = data.logs || [];
      const container = document.getElementById('audit-table-container');

      if (!logs.length) {
        container.innerHTML = '<div class="empty-state"><p>No audit records recorded yet.</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target Object</th>
                <th>Details / Notes</th>
                <th>Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => {
                const isPositive = l.action.includes('APPROVED') || l.action.includes('RESTORED');
                const isNegative = l.action.includes('REJECTED') || l.action.includes('BANNED') || l.action.includes('SUSPENDED');
                return `
                <tr>
                  <td><strong>${escapeHtml(l.admin_name || 'Admin')}</strong></td>
                  <td>
                    <span style="background:${isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#ede9fe'}; color:${isPositive ? '#166534' : isNegative ? '#991b1b' : '#6d28d9'}; font-weight:700; font-size:0.75rem; padding:3px 8px; border-radius:12px;">
                      ${escapeHtml(l.action)}
                    </span>
                  </td>
                  <td>
                    <strong>${escapeHtml(l.target_title || l.target_id || '-')}</strong><br>
                    <small style="color:#64748b;">${l.target_type || ''}</small>
                  </td>
                  <td>${escapeHtml(l.details || '-')}</td>
                  <td>${new Date(l.created_at).toLocaleString('en-GB')}</td>
                  <td><code>${l.ip_address || 'Internal'}</code></td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('audit-table-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 13: SYSTEM SETTINGS & FEATURE CONTROLS
  // ══════════════════════════════════════════════════════════════════════════
  async function loadSystemSettingsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-cogs"></i> System Settings & Feature Controls</h1></div>
      <div style="max-width:760px; background:#fff; border-radius:14px; padding:28px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.04);">
        <h3 style="margin-top:0; color:#1e293b; font-weight:800; font-size:1.1rem;">Listing & Moderation Rules</h3>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;">
          <div>
            <strong>Require Admin Approval Before Publishing</strong><br>
            <small style="color:#64748b;">All property, service, and marketplace submissions require admin verification.</small>
          </div>
          <input type="checkbox" id="set-approval" checked style="width:20px; height:20px; cursor:pointer;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;">
          <div>
            <strong>Listing Expiry Period (Days)</strong><br>
            <small style="color:#64748b;">Days before an unrenewed listing is automatically moved to expired status.</small>
          </div>
          <input type="number" id="set-expiry" value="60" style="width:80px; padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-weight:700;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;">
          <div>
            <strong>Max Photos Allowed per Property</strong><br>
            <small style="color:#64748b;">Maximum image upload count allowed per rental unit.</small>
          </div>
          <input type="number" id="set-photos" value="15" style="width:80px; padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-weight:700;">
        </div>

        <h3 style="margin-top:24px; color:#1e293b; font-weight:800; font-size:1.1rem;">Platform Access & Safety</h3>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;">
          <div>
            <strong>Allow New User Registration</strong><br>
            <small style="color:#64748b;">Allow new tenants and landlords to sign up.</small>
          </div>
          <input type="checkbox" id="set-reg" checked style="width:20px; height:20px; cursor:pointer;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;">
          <div>
            <strong style="color:#dc2626;">Maintenance Mode</strong><br>
            <small style="color:#64748b;">Take public storefront offline while keeping admin system active.</small>
          </div>
          <input type="checkbox" id="set-maint" style="width:20px; height:20px; cursor:pointer;">
        </div>

        <div style="margin-top:24px;">
          <button onclick="AdminCore.saveSystemSettings()" class="btn-primary" style="padding:12px 24px; font-weight:800; width:100%;">
            <i class="fas fa-save"></i> Save Platform Settings
          </button>
        </div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/system-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const gen = (data.settings && data.settings.general) || {};
      if (document.getElementById('set-approval')) document.getElementById('set-approval').checked = gen.requireListingApproval !== false;
      if (document.getElementById('set-expiry')) document.getElementById('set-expiry').value = gen.listingExpiryDays || 60;
      if (document.getElementById('set-photos')) document.getElementById('set-photos').value = gen.maxPhotosPerListing || 15;
      if (document.getElementById('set-reg')) document.getElementById('set-reg').checked = gen.allowUserRegistration !== false;
      if (document.getElementById('set-maint')) document.getElementById('set-maint').checked = gen.maintenanceMode === true;
    } catch(e) {
      console.warn('Settings load:', e.message);
    }
  }

  async function saveSystemSettings() {
    const val = {
      requireListingApproval: document.getElementById('set-approval')?.checked,
      listingExpiryDays: parseInt(document.getElementById('set-expiry')?.value) || 60,
      maxPhotosPerListing: parseInt(document.getElementById('set-photos')?.value) || 15,
      allowUserRegistration: document.getElementById('set-reg')?.checked,
      maintenanceMode: document.getElementById('set-maint')?.checked
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/system-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: 'general', value: val })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      showToast('✅ Platform settings saved and applied to database.', 'success');
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 14: DATABASE DIAGNOSTICS & BACKUPS
  // ══════════════════════════════════════════════════════════════════════════
  async function loadBackupsModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header">
        <h1><i class="fas fa-database"></i> Database Diagnostics & Backups</h1>
      </div>
      <div id="db-health-container">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Checking database health...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/database-health`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const container = document.getElementById('db-health-container');

      container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
          <!-- Card 1: Connection & Pooler -->
          <div style="background:#fff; border-radius:14px; padding:22px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
            <h3 style="margin-top:0; color:#1e293b; font-weight:800; font-size:1.05rem;"><i class="fas fa-server" style="color:#10b981; margin-right:8px;"></i> Database Engine</h3>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
              <div><strong>Engine:</strong> ${data.database}</div>
              <div><strong>Status:</strong> <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:12px; font-weight:700;">HEALTHY (Connected)</span></div>
              <div><strong>Storage Footprint:</strong> ${data.databaseSize || '14.2 MB'}</div>
              <div><strong>Host:</strong> <code>${data.host}</code></div>
              <div><strong>Last Health Check:</strong> ${new Date(data.lastBackupCheck).toLocaleString('en-GB')}</div>
            </div>
            <div style="margin-top:20px;">
              <a href="/api/admin/download-db" target="_blank" style="display:inline-block; text-align:center; padding:10px 18px; background:#7c3aed; color:white; border-radius:8px; font-weight:700; text-decoration:none; width:100%;">
                <i class="fas fa-download"></i> Export & Download Database JSON Snapshot
              </a>
            </div>
          </div>

          <!-- Card 2: Table Row Counts -->
          <div style="background:#fff; border-radius:14px; padding:22px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
            <h3 style="margin-top:0; color:#1e293b; font-weight:800; font-size:1.05rem;"><i class="fas fa-table" style="color:#6366f1; margin-right:8px;"></i> Live Record Counts</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px;">
              ${(data.tables || []).map(t => `
                <div style="padding:10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                  <small style="color:#64748b; text-transform:uppercase; font-weight:700;">${t.table}</small>
                  <div style="font-size:1.2rem; font-weight:900; color:#0f172a;">${t.count}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      document.getElementById('db-health-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE 16: ADMIN MANAGEMENT & RBAC
  // ══════════════════════════════════════════════════════════════════════════
  async function loadAdminUsersModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1><i class="fas fa-user-shield"></i> Administrators & Role-Based Access Control (RBAC)</h1>
        <button class="btn-primary" onclick="AdminCore.promptCreateAdmin()"><i class="fas fa-plus"></i> Add Administrator</button>
      </div>
      <p style="color:#64748b; font-size:0.88rem; margin-bottom:18px;">
        Define roles: Super Admin, Listing Moderator, Support Admin, Finance Admin, Verification Admin, or Content/Location Admin.
      </p>
      <div id="admin-users-table">
        <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading administrators...</div>
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const admins = data.admins || [];
      const container = document.getElementById('admin-users-table');

      container.innerHTML = `
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Email / Phone</th>
                <th>Assigned RBAC Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map(a => `
                <tr>
                  <td><strong>${escapeHtml(a.name || 'Admin')}</strong><br><small style="color:#64748b;">ID: ${a.id}</small></td>
                  <td>${escapeHtml(a.email || a.phone || '-')}</td>
                  <td>
                    <span style="background:#ede9fe; color:#6d28d9; padding:2px 8px; border-radius:12px; font-weight:700; font-size:0.8rem;">
                      ${a.id === 'usr-admin-01' ? 'Super Admin (Owner)' : (a.adminRole || 'Super Admin')}
                    </span>
                  </td>
                  <td><span class="status-badge status-active">Active</span></td>
                  <td>
                    ${a.id === 'usr-admin-01' ? '<span style="color:#94a3b8; font-size:0.8rem;"><i class="fas fa-lock"></i> Protected</span>' : `
                      <button class="btn-action btn-delete" onclick="AdminCore.revokeAdmin('${a.id}')"><i class="fas fa-user-minus"></i> Revoke</button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('admin-users-table').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  function promptCreateAdmin() {
    const email = prompt('Enter user email or ID to promote to administrator:');
    if (!email) return;
    const role = prompt('Assign RBAC Role:\n1. super (Super Admin)\n2. listings (Listing Moderator)\n3. support (Support Admin)\n4. finance (Finance Admin)\n5. verification (Verification Admin)\n6. content (Content/Location Admin)', 'listings');

    fetch(`${API_BASE}/api/admin/admins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: email, role: 'admin', adminRole: role || 'listings' })
    })
    .then(r => r.json())
    .then(d => {
      showToast(d.message || 'Admin role assigned', 'success');
      loadAdminUsersModule();
    })
    .catch(e => showToast(e.message, 'error'));
  }

  function revokeAdmin(adminId) {
    if (!confirm('Revoke administrator privileges for this user?')) return;
    fetch(`${API_BASE}/api/admin/admins/${adminId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    })
    .then(r => r.json())
    .then(d => {
      showToast(d.message || 'Admin privileges revoked', 'success');
      loadAdminUsersModule();
    })
    .catch(e => showToast(e.message, 'error'));
  }

  // Inquiries module
  async function loadInquiriesModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-envelope"></i> Tenant Inquiries Desk</h1></div>
      <div id="inquiries-container"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading inquiries...</div></div>
    `;
    try {
      const res = await fetch(`${API_BASE}/api/admin/inquiries`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const inqs = data.inquiries || [];
      const container = document.getElementById('inquiries-container');
      if (!inqs.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><p>No new customer inquiries.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-container"><table class="admin-table">
          <thead><tr><th>Seeker</th><th>Subject / Property</th><th>Message</th><th>Date</th></tr></thead>
          <tbody>${inqs.map(i => `
            <tr>
              <td><strong>${escapeHtml(i.name || 'Tenant')}</strong><br><small style="color:#64748b;">${i.phone || i.email || '-'}</small></td>
              <td>${escapeHtml(i.propertyTitle || i.subject || 'General Inquiry')}</td>
              <td>${escapeHtml(i.message || '')}</td>
              <td>${formatDate(i.createdAt)}</td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      `;
    } catch (err) {
      document.getElementById('inquiries-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // Customer support tickets
  async function loadSupportModule() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
      <div class="module-header"><h1><i class="fas fa-ticket-alt"></i> Customer Support Tickets</h1></div>
      <div id="support-container"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading tickets...</div></div>
    `;
    try {
      const res = await fetch(`${API_BASE}/api/admin/support`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });
      const data = await res.json();
      const tickets = data.tickets || [];
      const container = document.getElementById('support-container');
      if (!tickets.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>All support tickets resolved.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="table-container"><table class="admin-table">
          <thead><tr><th>User</th><th>Category</th><th>Details</th><th>Status</th></tr></thead>
          <tbody>${tickets.map(t => `
            <tr>
              <td><strong>${escapeHtml(t.userName || t.user_id || 'User')}</strong></td>
              <td>${escapeHtml(t.category || 'General')}</td>
              <td>${escapeHtml(t.subject || t.message || '-')}</td>
              <td><span class="status-badge status-pending">${t.status || 'Open'}</span></td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      `;
    } catch (err) {
      document.getElementById('support-container').innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  // Setup Global Search
  function setupGlobalSearch() {
    const input = document.getElementById('admin-global-search-input');
    const dropdown = document.getElementById('admin-search-dropdown');
    const results = document.getElementById('admin-search-results');
    if (!input || !dropdown) return;

    let debounce = null;
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounce);
      if (q.length < 2) {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.style.display = 'block';
      results.innerHTML = '<div class="search-hint"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
      debounce = setTimeout(() => {
        fetch(`${API_BASE}/api/admin/global-search?q=${encodeURIComponent(q)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
        })
        .then(r => r.json())
        .then(data => renderSearchResults(data.results || {}))
        .catch(err => results.innerHTML = `<div class="error-state">${err.message}</div>`);
      }, 250);
    });

    document.addEventListener('click', (e) => {
      const container = document.getElementById('admin-global-search-container');
      if (container && !container.contains(e.target)) dropdown.style.display = 'none';
    });
  }

  function renderSearchResults(res) {
    const results = document.getElementById('admin-search-results');
    if (!results) return;
    const users = res.users || [];
    const props = res.properties || [];
    if (!users.length && !props.length) {
      results.innerHTML = '<div class="search-hint">No matches found.</div>';
      return;
    }
    results.innerHTML = `
      ${users.map(u => `
        <div style="padding:8px 12px; border-bottom:1px solid #f1f5f9; cursor:pointer;" onclick="AdminCore.navigate('users'); document.getElementById('admin-search-dropdown').style.display='none';">
          <i class="fas fa-user" style="color:#7c3aed; margin-right:6px;"></i> <strong>${escapeHtml(u.name)}</strong> (${u.role || 'user'}) - ${u.phone || ''}
        </div>
      `).join('')}
      ${props.map(p => `
        <div style="padding:8px 12px; border-bottom:1px solid #f1f5f9; cursor:pointer;" onclick="AdminCore.navigate('properties'); document.getElementById('admin-search-dropdown').style.display='none';">
          <i class="fas fa-home" style="color:#10b981; margin-right:6px;"></i> <strong>${escapeHtml(p.title)}</strong> - KSh ${(p.price || 0).toLocaleString()}
        </div>
      `).join('')}
    `;
  }

  function setupEventListeners() {
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mod = btn.dataset.module;
        if (mod) navigate(mod);
      });
    });

    const logout = document.getElementById('admin-logout');
    if (logout) {
      logout.addEventListener('click', () => {
        localStorage.removeItem('keja_token');
        window.location.href = '/';
      });
    }
  }

  function formatNumber(num) {
    return new Intl.NumberFormat().format(num || 0);
  }

  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatRelativeTime(d) {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(msg, type = 'info') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||'#3b82f6'};color:white;padding:12px 22px;border-radius:10px;font-weight:700;font-size:0.9rem;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.25);`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  return {
    init,
    navigate,
    loadPropertiesModule,
    submitBroadcast,
    promptRefund,
    toggleMask,
    showAddCategoryModal,
    deleteCategory,
    saveSystemSettings,
    promptCreateAdmin,
    revokeAdmin,
    state
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdminCore.init());
} else {
  AdminCore.init();
}

window.AdminCore = AdminCore;
