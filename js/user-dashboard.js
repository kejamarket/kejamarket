/**
 * KejaMarket — Unified User Dashboard
 * Opens after login for ALL non-admin roles (tenant, landlord, agency, service)
 * Shows stats, quick actions, and recent listings based on role
 */

const kejaDashboard = (() => {

  let _stats = null;
  let _session = null;

  // ─── Role config: colours, labels, quick actions ─────────────────────
  const ROLE_CONFIG = {
    landlord: {
      label: 'Property Owner',
      color: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      icon: 'fas fa-home',
      listingLabel: 'My Properties',
      postAction: () => window.app && window.app.openModal('modal-post-ad'),
      postLabel: '+ Post Property',
      portalAction: () => window.kejaLandlordPortal && window.kejaLandlordPortal.openLandlordPortal(),
      portalLabel: 'Open Property Portal',
      portalIcon: 'fas fa-columns'
    },
    agency: {
      label: 'Real Estate Agency',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      icon: 'fas fa-building',
      listingLabel: 'My Properties',
      postAction: () => window.app && window.app.openModal('modal-post-ad'),
      postLabel: '+ Post Property',
      portalAction: () => window.kejaLandlordPortal && window.kejaLandlordPortal.openLandlordPortal(),
      portalLabel: 'Open Property Portal',
      portalIcon: 'fas fa-columns'
    },
    service: {
      label: 'Service Provider',
      color: '#0891b2',
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
      icon: 'fas fa-tools',
      listingLabel: 'My Services',
      postAction: () => window.app && window.app.openModal('modal-post-service'),
      postLabel: '+ Post Service',
      portalAction: () => window.kejaServicePortal && window.kejaServicePortal.openServicePortal(),
      portalLabel: 'Open Services Portal',
      portalIcon: 'fas fa-columns'
    },
    tenant: {
      label: 'Tenant',
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
      icon: 'fas fa-user',
      listingLabel: 'My Items',
      postAction: () => window.app && window.app.openModal('modal-post-marketplace'),
      postLabel: '+ Sell Item',
      portalAction: null,
      portalLabel: null,
      portalIcon: null
    }
  };

  // ─── Open dashboard ───────────────────────────────────────────────────
  async function open() {
    _session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!_session) return;

    // Skip for admin — they have their own portal
    if (_session.role === 'admin' || _session.isAdmin) return;

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-user-dashboard');
    }

    _renderSkeleton();
    await _loadAndRender();
  }

  function close() {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-user-dashboard');
    }
  }

  // ─── Render skeleton while loading ───────────────────────────────────
  function _renderSkeleton() {
    const body = document.getElementById('user-dashboard-body');
    if (!body) return;
    body.innerHTML = `
      <div class="ud-skeleton">
        <div class="ud-skeleton-bar"></div>
        <div class="ud-skeleton-bar ud-skeleton-bar--short"></div>
        <div class="ud-stats-grid">
          ${[1,2,3,4].map(() => `<div class="ud-stat-card ud-skeleton-card"></div>`).join('')}
        </div>
      </div>`;
  }

  // ─── Fetch stats and render ───────────────────────────────────────────
  async function _loadAndRender() {
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
    _render();
  }

  // ─── Full render ─────────────────────────────────────────────────────
  function _render() {
    if (!_session) return;

    const role = _session.role || 'tenant';
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    const name = (_session.name || 'User').split(' ')[0];
    const initials = (_session.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isVerified = _session.isVerified || _session.is_verified || false;

    const stats = _stats || { listings: 0, activeListings: 0, pendingListings: 0, messages: 0, unreadMessages: 0, favourites: 0, totalViews: 0 };

    // Update modal header gradient
    const header = document.getElementById('user-dashboard-header');
    if (header) header.style.background = cfg.gradient;

    // Build stat cards based on role
    const statCards = _buildStatCards(role, cfg, stats);

    // Build quick actions
    const quickActions = _buildQuickActions(role, cfg, stats);

    // Build recent section
    const recentSection = _buildRecentSection(role, cfg);

    const body = document.getElementById('user-dashboard-body');
    if (!body) return;

    body.innerHTML = `
      <!-- User identity row -->
      <div class="ud-identity">
        <div class="ud-avatar" style="background: ${cfg.gradient};">${initials}</div>
        <div class="ud-identity-info">
          <div class="ud-welcome">Welcome back, <strong>${name}</strong> 👋</div>
          <div class="ud-meta">
            <span class="ud-role-badge" style="background: ${cfg.color}20; color: ${cfg.color};">
              <i class="${cfg.icon}"></i> ${cfg.label}
            </span>
            ${isVerified
              ? `<span class="ud-verified-badge"><i class="fas fa-shield-alt"></i> Verified</span>`
              : `<span class="ud-unverified-badge"><i class="fas fa-exclamation-circle"></i> Unverified</span>`
            }
          </div>
          <div class="ud-contact">${_session.email || ''} ${_session.phone ? '· +' + _session.phone : ''}</div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="ud-stats-grid">
        ${statCards}
      </div>

      <!-- Quick actions -->
      <div class="ud-section-title">Quick Actions</div>
      <div class="ud-actions-grid">
        ${quickActions}
      </div>

      <!-- Recent listings / items -->
      <div class="ud-section-title" style="margin-top: 20px;">${cfg.listingLabel}</div>
      <div id="ud-recent-container">
        ${recentSection}
      </div>
    `;
  }

  function _buildStatCards(role, cfg, stats) {
    const cards = [];

    if (role === 'tenant') {
      cards.push(
        _statCard('fas fa-heart', stats.favourites, 'Saved', '#ef4444', () => window.app && window.app.toggleFavoritesView()),
        _statCard('fas fa-shopping-bag', stats.listings, 'My Items', cfg.color, null),
        _statCard('fas fa-comment-dots', stats.messages, 'Messages', '#2563EB', () => window.app && window.app.openAdminChat && window.app.openAdminChat()),
        _statCard('fas fa-sms', 0, 'SMS Alerts', '#1E5A85', () => window.app && window.app.openModal('modal-whatsapp-alerts'))
      );
    } else {
      cards.push(
        _statCard('fas fa-list', stats.listings, 'Total Listings', cfg.color, null),
        _statCard('fas fa-check-circle', stats.activeListings, 'Active / Live', '#16a34a', null),
        _statCard('fas fa-clock', stats.pendingListings, 'Pending', '#F59E0B', null),
        _statCard('fas fa-comment-dots', stats.messages, 'Messages', '#2563EB', null),
        _statCard('fas fa-heart', stats.favourites, 'Saved', '#ef4444', () => window.app && window.app.toggleFavoritesView()),
        _statCard('fas fa-eye', stats.totalViews, 'Total Views', '#64748b', null)
      );
    }

    return cards.join('');
  }

  function _statCard(icon, value, label, color, onClick) {
    const clickAttr = onClick ? `onclick="(${onClick})()" style="cursor:pointer;"` : '';
    return `
      <div class="ud-stat-card" ${clickAttr}>
        <div class="ud-stat-icon" style="background: ${color}18; color: ${color};">
          <i class="${icon}"></i>
        </div>
        <div class="ud-stat-value">${value ?? 0}</div>
        <div class="ud-stat-label">${label}</div>
      </div>`;
  }

  function _buildQuickActions(role, cfg, stats) {
    const actions = [];

    // Post action (primary - always first)
    actions.push(_actionBtn(cfg.postLabel, 'fas fa-plus-circle', cfg.color, `kejaDashboard._callPostAction('${role}')`));

    // Portal shortcut (landlord/agency/service)
    if (cfg.portalAction) {
      actions.push(_actionBtn(cfg.portalLabel, cfg.portalIcon, cfg.color, `kejaDashboard._callPortalAction('${role}')`));
    }

    // Messages
    const msgBadge = stats.unreadMessages > 0 ? ` (${stats.unreadMessages} new)` : '';
    actions.push(_actionBtn(`Messages${msgBadge}`, 'fas fa-comment-dots', '#2563EB', `window.app && window.app.openAdminChat && window.app.openAdminChat()`));

    // Saved properties
    actions.push(_actionBtn('Saved Properties', 'fas fa-heart', '#ef4444', `window.app && window.app.toggleFavoritesView()`));

    // SMS Alerts
    actions.push(_actionBtn('SMS Alerts', 'fas fa-sms', '#1E5A85', `window.app && window.app.openModal('modal-whatsapp-alerts')`));

    // Browse listings
    actions.push(_actionBtn('Browse Properties', 'fas fa-search', '#475569', `window.app.closeModal('modal-user-dashboard')`));

    return actions.join('');
  }

  function _actionBtn(label, icon, color, onclick) {
    return `
      <button class="ud-action-btn" onclick="${onclick}; kejaDashboard.close();" style="border-left: 4px solid ${color};">
        <i class="${icon}" style="color: ${color};"></i>
        <span>${label}</span>
        <i class="fas fa-chevron-right ud-action-arrow"></i>
      </button>`;
  }

  function _buildRecentSection(role) {
    if (role === 'landlord' || role === 'agency') {
      return `
        <div class="ud-recent-cta">
          <p>View and manage all your property listings in the Property Portal.</p>
          <button class="ud-cta-btn ud-cta-btn--primary" onclick="kejaDashboard.close(); setTimeout(() => window.kejaLandlordPortal && window.kejaLandlordPortal.openLandlordPortal(), 200);">
            <i class="fas fa-home"></i> Open Property Portal
          </button>
          <button class="ud-cta-btn" onclick="window.app && window.app.openModal('modal-post-ad'); kejaDashboard.close();">
            <i class="fas fa-plus"></i> Post New Property
          </button>
        </div>`;
    } else if (role === 'service') {
      return `
        <div class="ud-recent-cta">
          <p>Manage your services, view bookings and messages in the Services Portal.</p>
          <button class="ud-cta-btn ud-cta-btn--primary" onclick="kejaDashboard.close(); setTimeout(() => window.kejaServicePortal && window.kejaServicePortal.openServicePortal(), 200);">
            <i class="fas fa-tools"></i> Open Services Portal
          </button>
          <button class="ud-cta-btn" onclick="window.app && window.app.openModal('modal-post-service'); kejaDashboard.close();">
            <i class="fas fa-plus"></i> Post New Service
          </button>
        </div>`;
    } else {
      // Tenant
      return `
        <div class="ud-recent-cta">
          <p>Browse verified properties, save favorites, and set up SMS alerts for new listings.</p>
          <button class="ud-cta-btn ud-cta-btn--primary" onclick="kejaDashboard.close();">
            <i class="fas fa-search"></i> Browse Properties
          </button>
          <button class="ud-cta-btn" onclick="window.app && window.app.openModal('modal-post-marketplace'); kejaDashboard.close();">
            <i class="fas fa-shopping-bag"></i> Sell an Item
          </button>
        </div>`;
    }
  }

  // ─── Called from inline onclick (role string) ─────────────────────────
  function _callPostAction(role) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    if (cfg.postAction) cfg.postAction();
  }

  function _callPortalAction(role) {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.tenant;
    if (cfg.portalAction) { close(); setTimeout(cfg.portalAction, 200); }
  }

  // ─── Public API ───────────────────────────────────────────────────────
  return { open, close, _callPostAction, _callPortalAction };

})();

window.kejaDashboard = kejaDashboard;
