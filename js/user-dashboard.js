/**
 * KejaMarket — Unified Multi-Role User Dashboard & Account Center
 * Supports Tenant/Buyer, Property Owner/Agent, Real Estate Agency, and Service Provider
 * Home remains the main marketplace page; account actions run smoothly inside this dashboard.
 */

const kejaDashboard = (() => {

  let _stats = null;
  let _session = null;
  let _currentTab = 'overview';
  let _myItems = [];
  let _myProperties = [];
  let _myServices = [];
  let _savedProps = [];
  let _agencyTeam = [];
  let _conversations = [];

  // ─── Role config ──────────────────────────────────────────────────────────
  const ROLE_CONFIG = {
    tenant: {
      label: 'Tenant / Buyer',
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
      icon: 'fas fa-user',
      mainTabId: 'items',
      mainTabLabel: 'My Items for Sale',
      mainTabIcon: 'fas fa-shopping-bag',
      postLabel: '+ Sell Household Item',
      postAction: () => window.app && window.app.openModal('modal-post-marketplace')
    },
    buyer: {
      label: 'Tenant / Buyer',
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
      icon: 'fas fa-user',
      mainTabId: 'items',
      mainTabLabel: 'My Items for Sale',
      mainTabIcon: 'fas fa-shopping-bag',
      postLabel: '+ Sell Household Item',
      postAction: () => window.app && window.app.openModal('modal-post-marketplace')
    },
    landlord: {
      label: 'Property Owner / Agent',
      color: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      icon: 'fas fa-home',
      mainTabId: 'properties',
      mainTabLabel: 'My Properties',
      mainTabIcon: 'fas fa-home',
      postLabel: '+ Add Property',
      postAction: () => window.app && window.app.openModal('modal-post-ad')
    },
    agent: {
      label: 'Property Agent',
      color: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      icon: 'fas fa-user-tie',
      mainTabId: 'properties',
      mainTabLabel: 'My Properties',
      mainTabIcon: 'fas fa-home',
      postLabel: '+ Add Property',
      postAction: () => window.app && window.app.openModal('modal-post-ad')
    },
    agency: {
      label: 'Real Estate Agency',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      icon: 'fas fa-building',
      mainTabId: 'agency-props',
      mainTabLabel: 'Agency Properties',
      mainTabIcon: 'fas fa-building',
      postLabel: '+ Add Agency Listing',
      postAction: () => window.app && window.app.openModal('modal-post-ad')
    },
    service: {
      label: 'Service Provider',
      color: '#0891b2',
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
      icon: 'fas fa-tools',
      mainTabId: 'services',
      mainTabLabel: 'My Services',
      mainTabIcon: 'fas fa-tools',
      postLabel: '+ Add Service',
      postAction: () => window.app && window.app.openModal('modal-post-service')
    },
    admin: {
      label: 'Administrator',
      color: '#dc2626',
      gradient: 'linear-gradient(135deg, #dc2626, #991b1b)',
      icon: 'fas fa-shield-alt',
      mainTabId: 'overview',
      mainTabLabel: 'Overview',
      mainTabIcon: 'fas fa-shield-alt',
      postLabel: 'Admin Control Center',
      postAction: () => { window.location.href = '/admin-dashboard.html'; }
    }
  };

  // ─── Open Dashboard ────────────────────────────────────────────────────────
  async function open(targetTab = 'overview') {
    _session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!_session) {
      if (targetTab === 'faq' || targetTab === 'help') {
        _session = { name: 'Guest', role: 'tenant' };
      } else {
        if (window.kejaAuth) window.kejaAuth.openAuthModal();
        return;
      }
    }

    _currentTab = targetTab || 'overview';

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-user-dashboard');
    }

    _renderShell();
    await _loadInitialData();
    switchTab(_currentTab);
  }

  function close() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-user-dashboard');
    }
  }

  // ─── Initial Shell Layout with Nav Tabs ───────────────────────────────────
  function _renderShell() {
    const role = _session.role || 'tenant';
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    const header = document.getElementById('user-dashboard-header');
    if (header) header.style.background = cfg.gradient;

    const body = document.getElementById('user-dashboard-body');
    if (!body) return;

    // Build Navigation Tabs dynamically based on Role
    let tabsHtml = `
      <button class="ud-tab-btn active" data-tab="overview" onclick="kejaDashboard.switchTab('overview')">
        <i class="fas fa-th-large"></i> Overview
      </button>
    `;

    if (role === 'tenant' || role === 'buyer') {
      tabsHtml += `
        <button class="ud-tab-btn" data-tab="items" onclick="kejaDashboard.switchTab('items')">
          <i class="fas fa-shopping-bag"></i> My Items for Sale
        </button>
        <button class="ud-tab-btn" data-tab="favorites" onclick="kejaDashboard.switchTab('favorites')">
          <i class="fas fa-heart"></i> Saved Properties
        </button>
      `;
    } else if (role === 'landlord' || role === 'agent') {
      tabsHtml += `
        <button class="ud-tab-btn" data-tab="properties" onclick="kejaDashboard.switchTab('properties')">
          <i class="fas fa-home"></i> My Property Listings
        </button>
        <button class="ud-tab-btn" data-tab="favorites" onclick="kejaDashboard.switchTab('favorites')">
          <i class="fas fa-heart"></i> Saved
        </button>
      `;
    } else if (role === 'agency') {
      tabsHtml += `
        <button class="ud-tab-btn" data-tab="properties" onclick="kejaDashboard.switchTab('properties')">
          <i class="fas fa-building"></i> Agency Listings
        </button>
        <button class="ud-tab-btn" data-tab="agency-team" onclick="kejaDashboard.switchTab('agency-team')">
          <i class="fas fa-users-cog"></i> Team Members
        </button>
      `;
    } else if (role === 'service') {
      tabsHtml += `
        <button class="ud-tab-btn" data-tab="services" onclick="kejaDashboard.switchTab('services')">
          <i class="fas fa-tools"></i> Services Offered
        </button>
      `;
    }

    tabsHtml += `
      <button class="ud-tab-btn" data-tab="messages" onclick="kejaDashboard.switchTab('messages')">
        <i class="fas fa-comment-dots"></i> Messages & Inquiries
      </button>
      <button class="ud-tab-btn" data-tab="alerts" onclick="kejaDashboard.switchTab('alerts')">
        <i class="fas fa-bell"></i> Alerts & Notifications
      </button>
      <button class="ud-tab-btn" data-tab="settings" onclick="kejaDashboard.switchTab('settings')">
        <i class="fas fa-user-cog"></i> Profile & Settings
      </button>
      <button class="ud-tab-btn" data-tab="faq" onclick="kejaDashboard.switchTab('faq')">
        <i class="fas fa-question-circle"></i> Help & FAQs
      </button>
    `;

    body.innerHTML = `
      <div class="ud-nav-tabs-bar">
        ${tabsHtml}
      </div>
      <div class="ud-tab-content-container" id="ud-tab-content">
        <div style="text-align:center; padding:40px 20px; color:#64748b;">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p style="margin-top:10px; font-weight:600;">Loading your dashboard...</p>
        </div>
      </div>
    `;
  }

  // ─── Fetch Base Stats and Info ────────────────────────────────────────────
  async function _loadInitialData() {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/user/dashboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _stats = data.success ? data.stats : null;
    } catch (e) {
      _stats = null;
    }
  }

  // ─── Switch Tabs ──────────────────────────────────────────────────────────
  function switchTab(tab) {
    _currentTab = tab;
    
    // Update active tab buttons
    document.querySelectorAll('.ud-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const container = document.getElementById('ud-tab-content');
    if (!container) return;

    switch (tab) {
      case 'overview':
        _renderOverview(container);
        break;
      case 'items':
        _renderItemsTab(container);
        break;
      case 'properties':
        _renderPropertiesTab(container);
        break;
      case 'agency-team':
        _renderAgencyTeamTab(container);
        break;
      case 'services':
        _renderServicesTab(container);
        break;
      case 'favorites':
        _renderFavoritesTab(container);
        break;
      case 'messages':
        _renderMessagesTab(container);
        break;
      case 'alerts':
      case 'notifications':
        _renderAlertsTab(container);
        break;
      case 'settings':
        _renderSettingsTab(container);
        break;
      case 'faq':
      case 'help':
        _renderFaqTab(container);
        break;
      default:
        _renderOverview(container);
    }
  }

  // ─── 1. OVERVIEW TAB ──────────────────────────────────────────────────────
  function _renderOverview(container) {
    const role = _session.role || 'tenant';
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    const name = (_session.name || 'User').split(' ')[0];
    const initials = (_session.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isVerified = _session.isVerified || _session.is_verified || false;
    const stats = _stats || { listings: 0, activeListings: 0, pendingListings: 0, messages: 0, unreadMessages: 0, favourites: 0, totalViews: 0 };

    let statCards = '';
    if (role === 'tenant' || role === 'buyer') {
      statCards = `
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('favorites')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #fee2e2; color: #ef4444;"><i class="fas fa-heart"></i></div>
          <div class="ud-stat-value">${stats.favourites || 0}</div>
          <div class="ud-stat-label">Saved Properties</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('items')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #dcfce7; color: #16a34a;"><i class="fas fa-shopping-bag"></i></div>
          <div class="ud-stat-value">${stats.listings || 0}</div>
          <div class="ud-stat-label">My Items for Sale</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('messages')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-comment-dots"></i></div>
          <div class="ud-stat-value">${stats.messages || 0}</div>
          <div class="ud-stat-label">Inquiries & Messages</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('alerts')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-bell"></i></div>
          <div class="ud-stat-value">Active</div>
          <div class="ud-stat-label">SMS / WhatsApp Alerts</div>
        </div>
      `;
    } else {
      statCards = `
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('properties')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #e0e7ff; color: #4f46e5;"><i class="fas fa-home"></i></div>
          <div class="ud-stat-value">${stats.listings || 0}</div>
          <div class="ud-stat-label">Total Listings</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('properties')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #dcfce7; color: #16a34a;"><i class="fas fa-check-circle"></i></div>
          <div class="ud-stat-value">${stats.activeListings || 0}</div>
          <div class="ud-stat-label">Active / Live</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('properties')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-clock"></i></div>
          <div class="ud-stat-value">${stats.pendingListings || 0}</div>
          <div class="ud-stat-label">Pending Review</div>
        </div>
        <div class="ud-stat-card" onclick="kejaDashboard.switchTab('messages')" style="cursor:pointer;">
          <div class="ud-stat-icon" style="background: #dbeafe; color: #2563eb;"><i class="fas fa-comment-dots"></i></div>
          <div class="ud-stat-value">${stats.messages || 0}</div>
          <div class="ud-stat-label">Inquiries Received</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="ud-identity">
        <div class="ud-avatar" style="background: ${cfg.gradient};">${initials}</div>
        <div class="ud-identity-info">
          <div class="ud-welcome">Welcome back, <strong>${name}</strong> 👋</div>
          <div class="ud-meta">
            <span class="ud-role-badge" style="background: ${cfg.color}15; color: ${cfg.color}; font-weight:700;">
              <i class="${cfg.icon}"></i> ${cfg.label}
            </span>
            ${isVerified
              ? `<span class="ud-verified-badge"><i class="fas fa-shield-alt"></i> Verified Account</span>`
              : `<span class="ud-unverified-badge"><i class="fas fa-exclamation-circle"></i> Standard Account</span>`
            }
          </div>
          <div class="ud-contact"><i class="fas fa-envelope"></i> ${_session.email || 'No email set'} · <i class="fas fa-phone"></i> ${_session.phone ? '+' + _session.phone : 'No phone set'}</div>
        </div>
      </div>

      <div class="ud-stats-grid">
        ${statCards}
      </div>

      <div class="ud-section-title">Quick Actions</div>
      <div class="ud-actions-grid">
        <button class="ud-action-btn" onclick="kejaDashboard._callPostAction('${role}');" style="border-left: 4px solid ${cfg.color};">
          <i class="fas fa-plus-circle" style="color: ${cfg.color};"></i>
          <span>${cfg.postLabel}</span>
          <i class="fas fa-chevron-right ud-action-arrow"></i>
        </button>

        ${(role === 'tenant' || role === 'buyer') ? `
          <button class="ud-action-btn" onclick="kejaDashboard.switchTab('items');" style="border-left: 4px solid #16a34a;">
            <i class="fas fa-box-open" style="color: #16a34a;"></i>
            <span>Manage My Sold / Active Items</span>
            <i class="fas fa-chevron-right ud-action-arrow"></i>
          </button>
          <button class="ud-action-btn" onclick="kejaDashboard.switchTab('favorites');" style="border-left: 4px solid #ef4444;">
            <i class="fas fa-heart" style="color: #ef4444;"></i>
            <span>View Saved Favorites</span>
            <i class="fas fa-chevron-right ud-action-arrow"></i>
          </button>
        ` : `
          <button class="ud-action-btn" onclick="kejaDashboard.switchTab('properties');" style="border-left: 4px solid #4f46e5;">
            <i class="fas fa-list-ul" style="color: #4f46e5;"></i>
            <span>Manage Property Listings</span>
            <i class="fas fa-chevron-right ud-action-arrow"></i>
          </button>
        `}

        <button class="ud-action-btn" onclick="kejaDashboard.switchTab('messages');" style="border-left: 4px solid #2563eb;">
          <i class="fas fa-comment-dots" style="color: #2563eb;"></i>
          <span>Inquiries & Messages</span>
          <i class="fas fa-chevron-right ud-action-arrow"></i>
        </button>

        <button class="ud-action-btn" onclick="kejaDashboard.switchTab('settings');" style="border-left: 4px solid #64748b;">
          <i class="fas fa-cog" style="color: #64748b;"></i>
          <span>Account Settings</span>
          <i class="fas fa-chevron-right ud-action-arrow"></i>
        </button>
      </div>
    `;
  }

  // ─── 2. TENANT: MY ITEMS FOR SALE (CRUD) ──────────────────────────────────
  async function _renderItemsTab(container) {
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-shopping-bag" style="color:#16a34a;"></i> My Items for Sale</h3>
          <p class="ud-tab-desc">Sell pre-owned household furniture, appliances, electronics, and home goods directly to tenants.</p>
        </div>
        <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-marketplace'); kejaDashboard.close();">
          <i class="fas fa-plus"></i> Post New Item
        </button>
      </div>
      <div id="ud-items-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading your items...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/marketplace/my-items', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _myItems = data.success ? data.items : [];
      _renderItemsList();
    } catch (e) {
      const listEl = document.getElementById('ud-items-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load items at this time.</p></div>`;
    }
  }

  function _renderItemsList() {
    const listEl = document.getElementById('ud-items-list');
    if (!listEl) return;

    if (!_myItems || _myItems.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-box-open" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>No household items listed yet</h4>
          <p style="color:#64748b; font-size:0.9rem; max-width:400px; margin:0 auto 16px;">Moving out or decluttering? You can list your furniture, TVs, fridges, and home items here directly.</p>
          <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-marketplace'); kejaDashboard.close();">
            <i class="fas fa-plus-circle"></i> List Your First Item
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-items-grid">
        ${_myItems.map(item => {
          const price = item.price_kes || item.price || 0;
          const status = item.status || 'active';
          const isPaused = status === 'paused';
          const isSold = status === 'sold';
          const statusBadge = isSold 
            ? '<span class="ud-badge ud-badge-sold">SOLD</span>'
            : isPaused 
            ? '<span class="ud-badge ud-badge-paused">PAUSED</span>'
            : '<span class="ud-badge ud-badge-active">ACTIVE</span>';

          const images = typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []);
          const thumb = images.length > 0 ? images[0] : '/favicon.ico';

          return `
            <div class="ud-item-card">
              <img src="${thumb}" alt="${item.title}" class="ud-item-thumb" onerror="this.src='/favicon.ico';">
              <div class="ud-item-details">
                <div class="ud-item-status-row">
                  ${statusBadge}
                  <span class="ud-item-category">${item.category || 'Household'}</span>
                </div>
                <h4 class="ud-item-title">${item.title}</h4>
                <div class="ud-item-price">KSh ${Number(price).toLocaleString()}</div>
                <div class="ud-item-loc"><i class="fas fa-map-marker-alt"></i> ${item.location_suburb || item.location || 'Nairobi'}</div>
                
                <div class="ud-item-actions">
                  ${!isSold ? `
                    <button class="ud-btn-action" onclick="kejaDashboard.toggleItemStatus('${item.id}', '${isPaused ? 'active' : 'paused'}')">
                      <i class="fas ${isPaused ? 'fa-play' : 'fa-pause'}"></i> ${isPaused ? 'Activate' : 'Pause'}
                    </button>
                    <button class="ud-btn-action" onclick="kejaDashboard.toggleItemStatus('${item.id}', 'sold')">
                      <i class="fas fa-check"></i> Mark as Sold
                    </button>
                  ` : `
                    <button class="ud-btn-action" onclick="kejaDashboard.toggleItemStatus('${item.id}', 'active')">
                      <i class="fas fa-redo"></i> Relist Item
                    </button>
                  `}
                  <button class="ud-btn-action ud-btn-delete" onclick="kejaDashboard.deleteMarketplaceItem('${item.id}')">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async function toggleItemStatus(itemId, newStatus) {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/marketplace/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`Item status updated to ${newStatus}`, 'success');
        const it = _myItems.find(i => i.id === itemId);
        if (it) it.status = newStatus;
        _renderItemsList();
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not update status', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error updating item', 'error');
    }
  }

  async function deleteMarketplaceItem(itemId) {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/marketplace/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Item deleted successfully', 'success');
        _myItems = _myItems.filter(i => i.id !== itemId);
        _renderItemsList();
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not delete item', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error deleting item', 'error');
    }
  }

  // ─── 3. PROPERTY OWNER & AGENCY: PROPERTY LISTINGS ────────────────────────
  async function _renderPropertiesTab(container) {
    const role = _session.role || 'landlord';
    const isAgency = role === 'agency';

    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-home" style="color:#4f46e5;"></i> ${isAgency ? 'Agency Properties' : 'My Property Listings'}</h3>
          <p class="ud-tab-desc">Manage verified rental properties, sales, Airbnb stays, and review pending submissions.</p>
        </div>
        <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-ad'); kejaDashboard.close();">
          <i class="fas fa-plus"></i> Post New Property
        </button>
      </div>

      <div class="ud-filter-pills" id="ud-prop-filter-pills">
        <button class="ud-filter-pill active" onclick="kejaDashboard.filterPropertyList('all', this)">All Listings</button>
        <button class="ud-filter-pill" onclick="kejaDashboard.filterPropertyList('active', this)">Active / Live</button>
        <button class="ud-filter-pill" onclick="kejaDashboard.filterPropertyList('pending', this)">Pending Verification</button>
        <button class="ud-filter-pill" onclick="kejaDashboard.filterPropertyList('paused', this)">Paused / Taken</button>
      </div>

      <div id="ud-properties-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/landlord/my-listings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _myProperties = data.success ? data.listings : [];
      filterPropertyList('all');
    } catch (e) {
      const listEl = document.getElementById('ud-properties-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load properties at this time.</p></div>`;
    }
  }

  function filterPropertyList(filter, pillBtn) {
    if (pillBtn) {
      document.querySelectorAll('#ud-prop-filter-pills .ud-filter-pill').forEach(b => b.classList.remove('active'));
      pillBtn.classList.add('active');
    }

    const listEl = document.getElementById('ud-properties-list');
    if (!listEl) return;

    let filtered = _myProperties || [];
    if (filter === 'active') {
      filtered = filtered.filter(p => (p.isApproved || p.status === 'approved' || p.is_verified) && p.availability !== 'taken');
    } else if (filter === 'pending') {
      filtered = filtered.filter(p => !p.isApproved && p.status !== 'approved' && !p.is_verified);
    } else if (filter === 'paused') {
      filtered = filtered.filter(p => p.availability === 'taken' || p.status === 'paused');
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-home" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>No listings match this filter</h4>
          <p style="color:#64748b; font-size:0.9rem;">You can post your property listings to reach thousands of tenants across Kenya.</p>
          <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-ad'); kejaDashboard.close();">
            <i class="fas fa-plus"></i> Post Property Listing
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-properties-grid">
        ${filtered.map(prop => {
          const rent = prop.rentKes ?? prop.rent ?? prop.rent_kes ?? 0;
          const isVerified = prop.isApproved || prop.status === 'approved' || prop.is_verified;
          const isTaken = prop.availability === 'taken';
          const photos = Array.isArray(prop.photos) ? prop.photos : (Array.isArray(prop.media) ? prop.media.map(m => m.url || m) : []);
          const thumb = photos.length > 0 ? photos[0] : '/favicon.ico';

          return `
            <div class="ud-prop-card">
              <img src="${thumb}" alt="${prop.title}" class="ud-prop-thumb" onerror="this.src='/favicon.ico';">
              <div class="ud-prop-details">
                <div class="ud-item-status-row">
                  ${isTaken ? `<span class="ud-badge ud-badge-paused">OCCUPIED / TAKEN</span>` : 
                    isVerified ? `<span class="ud-badge ud-badge-active">LIVE / VERIFIED</span>` : 
                    `<span class="ud-badge ud-badge-pending">PENDING VERIFICATION</span>`
                  }
                  <span class="ud-item-category">${prop.category || 'Rental'}</span>
                </div>
                <h4 class="ud-prop-title">${prop.title}</h4>
                <div class="ud-prop-price">KSh ${Number(rent).toLocaleString()}/month</div>
                <div class="ud-prop-loc"><i class="fas fa-map-marker-alt"></i> ${prop.estateSuburb || prop.area || 'Nairobi'}</div>
                
                <div class="ud-item-actions">
                  <button class="ud-btn-action" onclick="kejaDashboard.togglePropertyAvailability('${prop.id}', '${isTaken ? 'vacant' : 'taken'}')">
                    <i class="fas ${isTaken ? 'fa-door-open' : 'fa-door-closed'}"></i> ${isTaken ? 'Mark Vacant' : 'Mark Taken'}
                  </button>
                  <button class="ud-btn-action" onclick="kejaDashboard.renewPropertyListing('${prop.id}')">
                    <i class="fas fa-sync-alt"></i> Renew Listing
                  </button>
                  <button class="ud-btn-action ud-btn-delete" onclick="kejaDashboard.deletePropertyListing('${prop.id}')">
                    <i class="fas fa-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async function togglePropertyAvailability(propId, newAvailability) {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/landlord/availability/${propId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: newAvailability })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`Property updated to ${newAvailability}`, 'success');
        const p = _myProperties.find(item => item.id === propId);
        if (p) p.availability = newAvailability;
        filterPropertyList('all');
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not update availability', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error updating property', 'error');
    }
  }

  async function renewPropertyListing(propId) {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/properties/${propId}/renew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Listing renewed successfully for 30 days!', 'success');
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not renew listing', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error renewing listing', 'error');
    }
  }

  async function deletePropertyListing(propId) {
    if (!confirm('Are you sure you want to delete this property listing?')) return;
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/properties/${propId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Listing removed successfully', 'success');
        _myProperties = _myProperties.filter(p => p.id !== propId);
        filterPropertyList('all');
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not remove listing', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error removing listing', 'error');
    }
  }

  // ─── 4. AGENCY: TEAM MEMBERS & ASSIGNMENT ─────────────────────────────────
  async function _renderAgencyTeamTab(container) {
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-users-cog" style="color:#7c3aed;"></i> Agency Team Members</h3>
          <p class="ud-tab-desc">Add verified agents to your agency and assign property inquiries and listings.</p>
        </div>
        <button class="ud-primary-action-btn" onclick="kejaDashboard.promptAddTeamMember()">
          <i class="fas fa-user-plus"></i> Add Team Agent
        </button>
      </div>
      <div id="ud-team-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading team...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/agency/team', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _agencyTeam = data.success ? data.team : [];
      _renderAgencyTeamList();
    } catch (e) {
      const listEl = document.getElementById('ud-team-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load team members.</p></div>`;
    }
  }

  function _renderAgencyTeamList() {
    const listEl = document.getElementById('ud-team-list');
    if (!listEl) return;

    if (!_agencyTeam || _agencyTeam.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-user-friends" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>No agents added to your team yet</h4>
          <p style="color:#64748b; font-size:0.9rem;">Add your agency's leasing consultants and property managers.</p>
          <button class="ud-primary-action-btn" onclick="kejaDashboard.promptAddTeamMember()">
            <i class="fas fa-user-plus"></i> Add First Agent
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-team-grid">
        ${_agencyTeam.map(member => `
          <div class="ud-team-card">
            <div class="ud-avatar" style="background: linear-gradient(135deg, #7c3aed, #4f46e5);">${member.name.charAt(0).toUpperCase()}</div>
            <div class="ud-team-info">
              <h4>${member.name}</h4>
              <div class="ud-team-role"><i class="fas fa-briefcase"></i> ${member.role || 'Authorized Agent'}</div>
              <div class="ud-team-contact"><i class="fas fa-phone"></i> +${member.phone || ''}</div>
              <div class="ud-team-contact"><i class="fas fa-envelope"></i> ${member.email || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function promptAddTeamMember() {
    const name = prompt('Enter Agent Name:');
    if (!name) return;
    const phone = prompt('Enter Agent Phone Number (e.g. 254712345678):');
    if (!phone) return;
    const email = prompt('Enter Agent Email (optional):') || '';

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/agency/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, email, role: 'Agent' })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(data.message, 'success');
        _agencyTeam.push({ name, phone, email, role: 'Agent' });
        _renderAgencyTeamList();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed to add agent', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error adding agent', 'error');
    }
  }

  // ─── 5. SERVICE PROVIDER: SERVICES OFFERED ────────────────────────────────
  async function _renderServicesTab(container) {
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-tools" style="color:#0891b2;"></i> Services Offered</h3>
          <p class="ud-tab-desc">Manage your moving, internet, laundry, cleaning, and utility service listings.</p>
        </div>
        <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-service'); kejaDashboard.close();">
          <i class="fas fa-plus"></i> Post New Service
        </button>
      </div>
      <div id="ud-services-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading services...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/service/my-services', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _myServices = data.success ? data.services : [];
      _renderServicesList();
    } catch (e) {
      const listEl = document.getElementById('ud-services-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load services.</p></div>`;
    }
  }

  function _renderServicesList() {
    const listEl = document.getElementById('ud-services-list');
    if (!listEl) return;

    if (!_myServices || _myServices.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-tools" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>No services posted yet</h4>
          <p style="color:#64748b; font-size:0.9rem;">Reach estate tenants looking for movers, fibre WiFi, cleaning, and gas delivery.</p>
          <button class="ud-primary-action-btn" onclick="window.app && window.app.openModal('modal-post-service'); kejaDashboard.close();">
            <i class="fas fa-plus-circle"></i> Post Your First Service
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-services-grid">
        ${_myServices.map(svc => `
          <div class="ud-service-card">
            <div class="ud-service-header">
              <span class="ud-badge ud-badge-active"><i class="fas fa-check"></i> ACTIVE</span>
              <span class="ud-item-category">${svc.category || 'Service'}</span>
            </div>
            <h4>${svc.businessName || svc.title || 'Service Listing'}</h4>
            <p style="color:#64748b; font-size:0.85rem; margin:6px 0;">${svc.description || 'Verified estate service.'}</p>
            <div class="ud-service-meta"><i class="fas fa-map-marker-alt"></i> Coverage: ${svc.serviceAreas || 'Nairobi & Suburbs'}</div>
            
            <div class="ud-item-actions" style="margin-top:12px;">
              <button class="ud-btn-action ud-btn-delete" onclick="kejaDashboard.deleteServiceListing('${svc.id}')">
                <i class="fas fa-trash"></i> Remove
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function deleteServiceListing(svcId) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/service/${svcId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Service removed successfully', 'success');
        _myServices = _myServices.filter(s => s.id !== svcId);
        _renderServicesList();
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not remove service', 'error');
      }
    } catch (e) {
      if (window.app) window.app.showToast('Network error removing service', 'error');
    }
  }

  // ─── 6. FAVORITES / SAVED PROPERTIES TAB ──────────────────────────────────
  async function _renderFavoritesTab(container) {
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-heart" style="color:#ef4444;"></i> Saved Properties</h3>
          <p class="ud-tab-desc">Quickly access and compare your bookmarked rental properties and apartments.</p>
        </div>
      </div>
      <div id="ud-favorites-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading saved properties...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/favourites', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      const favIds = data.success ? data.favourites : [];

      if (!favIds || favIds.length === 0) {
        document.getElementById('ud-favorites-list').innerHTML = `
          <div class="ud-empty-state">
            <i class="fas fa-heart-broken" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
            <h4>No saved properties yet</h4>
            <p style="color:#64748b; font-size:0.9rem;">Click the heart icon on any property card to save it here for quick access.</p>
            <button class="ud-primary-action-btn" onclick="kejaDashboard.close();">
              <i class="fas fa-search"></i> Browse Properties
            </button>
          </div>
        `;
        return;
      }

      // Fetch all properties to match IDs
      const propsRes = await fetch('/api/properties');
      const propsData = await propsRes.json();
      const all = propsData.properties || [];
      const saved = all.filter(p => favIds.includes(p.id));

      _renderSavedPropsList(saved);
    } catch (e) {
      const listEl = document.getElementById('ud-favorites-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load saved properties.</p></div>`;
    }
  }

  function _renderSavedPropsList(saved) {
    const listEl = document.getElementById('ud-favorites-list');
    if (!listEl) return;

    if (!saved || saved.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-heart" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>Your saved properties are currently unavailable</h4>
          <button class="ud-primary-action-btn" onclick="kejaDashboard.close();">Browse Properties</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-properties-grid">
        ${saved.map(prop => {
          const rent = prop.rentKes ?? prop.rent ?? prop.rent_kes ?? 0;
          const photos = Array.isArray(prop.photos) ? prop.photos : (Array.isArray(prop.media) ? prop.media.map(m => m.url || m) : []);
          const thumb = photos.length > 0 ? photos[0] : '/favicon.ico';

          return `
            <div class="ud-prop-card">
              <img src="${thumb}" alt="${prop.title}" class="ud-prop-thumb" onerror="this.src='/favicon.ico';">
              <div class="ud-prop-details">
                <span class="ud-item-category">${prop.category || 'Rental'}</span>
                <h4 class="ud-prop-title">${prop.title}</h4>
                <div class="ud-prop-price">KSh ${Number(rent).toLocaleString()}/mo</div>
                <div class="ud-prop-loc"><i class="fas fa-map-marker-alt"></i> ${prop.estateSuburb || prop.area || 'Nairobi'}</div>
                
                <div class="ud-item-actions">
                  <button class="ud-btn-action" onclick="kejaDashboard.close(); window.app && window.app.openPropertyDetail && window.app.openPropertyDetail('${prop.id}');">
                    <i class="fas fa-eye"></i> View Property
                  </button>
                  <button class="ud-btn-action ud-btn-delete" onclick="kejaDashboard.removeFavorite('${prop.id}')">
                    <i class="fas fa-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async function removeFavorite(propId) {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      await fetch(`/api/favourites/${propId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (window.app) window.app.showToast('Removed from favorites', 'info');
      switchTab('favorites');
    } catch (e) {
      if (window.app) window.app.showToast('Error removing favorite', 'error');
    }
  }

  // ─── 7. MESSAGES & INQUIRIES TAB ──────────────────────────────────────────
  async function _renderMessagesTab(container) {
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-comment-dots" style="color:#2563eb;"></i> Messages & Inquiries</h3>
          <p class="ud-tab-desc">Direct communications with tenants, landlords, and KejaMarket customer support.</p>
        </div>
        <button class="ud-primary-action-btn" onclick="window.app && window.app.openAdminChat && window.app.openAdminChat(); kejaDashboard.close();">
          <i class="fas fa-headset"></i> Support Chat
        </button>
      </div>
      <div id="ud-messages-list" style="margin-top:16px;">
        <div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading conversations...</div>
      </div>
    `;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/communication/conversations', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      _conversations = data.success ? data.conversations : [];
      _renderConversationsList();
    } catch (e) {
      const listEl = document.getElementById('ud-messages-list');
      if (listEl) listEl.innerHTML = `<div class="ud-empty-state"><p>Could not load messages at this time.</p></div>`;
    }
  }

  function _renderConversationsList() {
    const listEl = document.getElementById('ud-messages-list');
    if (!listEl) return;

    if (!_conversations || _conversations.length === 0) {
      listEl.innerHTML = `
        <div class="ud-empty-state">
          <i class="fas fa-comments" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
          <h4>No conversation history yet</h4>
          <p style="color:#64748b; font-size:0.9rem;">When you inquire about a property, household item, or service, your messages will appear here.</p>
          <button class="ud-primary-action-btn" onclick="window.app && window.app.openAdminChat && window.app.openAdminChat(); kejaDashboard.close();">
            <i class="fas fa-headset"></i> Contact KejaMarket Support
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div class="ud-conversations-list">
        ${_conversations.map(conv => `
          <div class="ud-conv-card" onclick="window.app && window.app.openAdminChat && window.app.openAdminChat(); kejaDashboard.close();">
            <div class="ud-avatar" style="background: linear-gradient(135deg, #2563eb, #3b82f6); width:44px; height:44px; font-size:1rem;">
              ${(conv.other_participant_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div class="ud-conv-info">
              <div class="ud-conv-header">
                <strong>${conv.other_participant_name || 'Inquiry Contact'}</strong>
                <span class="ud-conv-time">${conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}</span>
              </div>
              <p class="ud-conv-preview">${conv.last_message || 'Inquiry thread'}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── 8. ALERTS & NOTIFICATIONS TAB ────────────────────────────────────────
  function _renderAlertsTab(container) {
    const user = _session || {};
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-bell" style="color:#f59e0b;"></i> Property Alerts & Notifications</h3>
          <p class="ud-tab-desc">Get instant SMS and WhatsApp notifications when new houses match your preferred budget and location.</p>
        </div>
      </div>

      <div class="ud-alerts-card">
        <form onsubmit="kejaDashboard.saveAlertsForm(event)" class="ud-alerts-form">
          <div class="ud-form-group">
            <label><i class="fas fa-phone"></i> WhatsApp / SMS Alert Phone Number</label>
            <input type="text" id="alert-phone-input" value="${user.phone ? '+' + user.phone : ''}" placeholder="+254712345678" required class="ud-input">
          </div>

          <div class="ud-form-row">
            <div class="ud-form-group">
              <label><i class="fas fa-map-marker-alt"></i> Preferred Estate / Area</label>
              <input type="text" id="alert-area-input" placeholder="e.g. Roysambu, Kilimani, Westlands" class="ud-input">
            </div>
            <div class="ud-form-group">
              <label><i class="fas fa-home"></i> Preferred Category</label>
              <select id="alert-category-input" class="ud-input">
                <option value="all">All Properties</option>
                <option value="bedsitter">Bedsitter</option>
                <option value="1bedroom">1 Bedroom</option>
                <option value="2bedroom">2 Bedroom</option>
                <option value="airbnb">Airbnb / Stays</option>
              </select>
            </div>
          </div>

          <div class="ud-form-row">
            <div class="ud-form-group">
              <label><i class="fas fa-coins"></i> Min Budget (KSh)</label>
              <input type="number" id="alert-min-budget" placeholder="e.g. 10000" class="ud-input">
            </div>
            <div class="ud-form-group">
              <label><i class="fas fa-coins"></i> Max Budget (KSh)</label>
              <input type="number" id="alert-max-budget" placeholder="e.g. 35000" class="ud-input">
            </div>
          </div>

          <div style="margin-top: 14px;">
            <button type="submit" class="ud-primary-action-btn" style="width:100%; justify-content:center; padding:12px;">
              <i class="fab fa-whatsapp"></i> Save Instant Alert Preferences
            </button>
          </div>
        </form>
      </div>
    `;
  }

  async function saveAlertsForm(e) {
    e.preventDefault();
    const phone = document.getElementById('alert-phone-input').value;
    const estate = document.getElementById('alert-area-input').value;
    const category = document.getElementById('alert-category-input').value;
    const budgetMin = document.getElementById('alert-min-budget').value;
    const budgetMax = document.getElementById('alert-max-budget').value;

    try {
      const res = await fetch('/api/whatsapp/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, estate, category, budgetMin, budgetMax, userId: _session.id })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('✅ Instant rental alerts configured successfully! SMS confirmation sent.', 'success');
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not save alert preferences', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error saving alert preferences', 'error');
    }
  }

  // ─── 9. PROFILE & SETTINGS TAB ────────────────────────────────────────────
  function _renderSettingsTab(container) {
    const user = _session || {};
    container.innerHTML = `
      <div class="ud-tab-header">
        <div>
          <h3 class="ud-tab-title"><i class="fas fa-user-cog" style="color:#4f46e5;"></i> My Profile & Account Settings</h3>
          <p class="ud-tab-desc">Update your personal profile, contact information, and security preferences.</p>
        </div>
      </div>

      <div class="ud-settings-card">
        <form onsubmit="kejaDashboard.saveProfileForm(event)" class="ud-settings-form">
          <div class="ud-form-row">
            <div class="ud-form-group">
              <label><i class="fas fa-user"></i> Full Name</label>
              <input type="text" id="settings-name" value="${user.name || ''}" required class="ud-input">
            </div>
            <div class="ud-form-group">
              <label><i class="fas fa-envelope"></i> Email Address</label>
              <input type="email" id="settings-email" value="${user.email || ''}" required class="ud-input">
            </div>
          </div>

          <div class="ud-form-row">
            <div class="ud-form-group">
              <label><i class="fas fa-phone"></i> Phone Number</label>
              <input type="text" id="settings-phone" value="${user.phone ? '+' + user.phone : ''}" readonly class="ud-input" style="background:#f1f5f9; cursor:not-allowed;">
            </div>
            <div class="ud-form-group">
              <label><i class="fas fa-id-badge"></i> Account Role</label>
              <input type="text" value="${user.role ? user.role.toUpperCase() : 'TENANT'}" readonly class="ud-input" style="background:#f1f5f9; font-weight:700; cursor:not-allowed;">
            </div>
          </div>

          <div style="margin-top: 16px; display:flex; gap:10px;">
            <button type="submit" class="ud-primary-action-btn">
              <i class="fas fa-save"></i> Save Profile Changes
            </button>
            <button type="button" class="ud-btn-action" onclick="kejaAuth.signOut(); kejaDashboard.close();" style="color:#ef4444; border-color:#fecaca;">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </form>
      </div>
    `;
  }

  async function saveProfileForm(e) {
    e.preventDefault();
    const name = document.getElementById('settings-name').value;
    const email = document.getElementById('settings-email').value;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Profile updated successfully!', 'success');
        if (data.user && window.kejaAuth) {
          const s = window.kejaAuth.getSession();
          if (s) {
            s.name = name;
            s.email = email;
            localStorage.setItem('kejamarket_user', JSON.stringify(s));
          }
        }
      } else {
        if (window.app) window.app.showToast(data.message || 'Could not update profile', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error updating profile', 'error');
    }
  }

  // ─── FAQ & HELP TAB ───────────────────────────────────────────────────────
  function _renderFaqTab(container) {
    container.innerHTML = `
      <div class="ud-tab-section" style="padding: 10px 0;">
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-question-circle" style="color: #16a34a;"></i> Help & Frequently Asked Questions
          </h3>
          <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Everything you need to know about house hunting, direct landlord contacts, and listing properties on KejaMarket.
          </p>
        </div>

        <!-- Neighborhood Explorer Chips -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 22px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-map-marked-alt" style="color: #16a34a;"></i> Explore Popular Nairobi Rental Neighborhoods:
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Ruaka'; app.searchQuery = 'Ruaka'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Ruaka</strong> <small>(Bedsitters & 1-Beds)</small>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Kilimani'; app.searchQuery = 'Kilimani'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Kilimani</strong> <small>(Modern Apartments)</small>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Westlands'; app.searchQuery = 'Westlands'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Westlands</strong> <small>(Prime Urban Living)</small>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Roysambu'; app.searchQuery = 'Roysambu'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Roysambu / Kasarani</strong>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'South B'; app.searchQuery = 'South B'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>South B & C</strong>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Kileleshwa'; app.searchQuery = 'Kileleshwa'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Kileleshwa</strong>
            </button>
            <button type="button" class="seo-location-chip" onclick="kejaDashboard.close(); document.getElementById('header-search-input').value = 'Ngong Road'; app.searchQuery = 'Ngong Road'; app.currentPage = 1; app.applyFilters(); window.scrollTo({top: 0, behavior: 'smooth'});">
              <strong>Ngong Road</strong>
            </button>
          </div>
        </div>

        <!-- FAQ Accordion -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <details class="keja-faq-item" open style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>What is KejaMarket and how does it work?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              KejaMarket (<strong>kejamarket.co.ke</strong>) is Kenya's verified online rental property marketplace. We eliminate middleman brokers by allowing verified landlords and property managers to list vacant houses, apartments, bedsitters, and Airbnbs directly. Tenants can browse with real-time interactive maps, view watermarked photos, and contact landlords directly via phone call or WhatsApp without paying any viewing fees.
            </div>
          </details>

          <details class="keja-faq-item" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>Does KejaMarket charge viewing fees or broker commission?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              No. KejaMarket is 100% free for house hunters and tenants. You can search rentals, filter by neighborhood and price range, view exact building coordinates, and contact property owners directly without paying broker viewing fees.
            </div>
          </details>

          <details class="keja-faq-item" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>Which areas in Nairobi have affordable rentals on KejaMarket?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              We feature listings across all major Nairobi residential corridors:
              <ul style="margin: 8px 0 0 18px; padding: 0;">
                <li><strong>Thika Road</strong> (Roysambu, Kasarani, Kahawa Sukari, Zimmerman) for affordable bedsitters and 1-bedrooms (KSh 8k – 20k).</li>
                <li><strong>Limuru Road</strong> (Ruaka, Ndenderu, Two Rivers environs) for modern mid-rise apartments with elevators and backup water (KSh 15k – 35k).</li>
                <li><strong>Kilimani, Kileleshwa & Westlands</strong> for premium 1, 2, and 3-bedroom residences and serviced Airbnbs.</li>
                <li><strong>Mombasa Road</strong> (South B, South C, Imara Daima, Syokimau) for convenient CBD commuting.</li>
              </ul>
            </div>
          </details>

          <details class="keja-faq-item" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>How do landlords and property owners post listings on KejaMarket?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              Landlords and caretakers can create a free account, tap the <strong>Post Rental</strong> button at the top of the page, fill in property details (rent, deposit, bedrooms, amenities), upload photos, and publish immediately. Every image is automatically stamped with an authentic <code>kejamarket.co.ke</code> watermark to protect your property photos from copycat scams.
            </div>
          </details>

          <details class="keja-faq-item" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>How does KejaMarket protect tenants from online rental scams?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              We maintain strict verification standards: landlord telephone validation, photo watermarking, community reviews, and an active moderation team. We always advise tenants never to send rental deposits before physically inspecting a property and meeting the on-site landlord or caretaker.
            </div>
          </details>

          <details class="keja-faq-item" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
            <summary style="font-weight: 700; color: #0f172a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>Are short stays and furnished Airbnbs available in Kenya on KejaMarket?</span>
              <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: #16a34a;"></i>
            </summary>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              Yes. Simply click the <strong>Airbnbs</strong> tab in our category navigation to discover verified short-stay apartments, studios, and vacation homes in Nairobi with transparent daily and weekly rates.
            </div>
          </details>
        </div>

        <!-- Contact Support banner -->
        <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-weight: 700; color: #166534; font-size: 0.95rem;">Have a question that's not answered here?</div>
            <div style="color: #15803d; font-size: 0.85rem;">Our local support team is ready to help you directly.</div>
          </div>
          <button class="ud-primary-action-btn" onclick="kejaDashboard.close(); app.openAdminChat();" style="margin: 0; padding: 8px 16px; font-size: 0.85rem;">
            <i class="fas fa-comment-dots"></i> Message Support
          </button>
        </div>
      </div>
    `;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _callPostAction(role) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    if (cfg.postAction) {
      close();
      setTimeout(cfg.postAction, 200);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    open,
    close,
    switchTab,
    _callPostAction,
    filterPropertyList,
    toggleItemStatus,
    deleteMarketplaceItem,
    togglePropertyAvailability,
    renewPropertyListing,
    deletePropertyListing,
    promptAddTeamMember,
    deleteServiceListing,
    removeFavorite,
    saveAlertsForm,
    saveProfileForm
  };

})();

window.kejaDashboard = kejaDashboard;
