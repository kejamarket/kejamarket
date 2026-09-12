/**
 * KejaMarket - Administrator Control Center Engine
 * Complete admin dashboard with analytics, user management, and listing moderation
 * SAFE VERSION: Does not interfere with main site functionality
 */

class AdminPortalEngine {
  constructor() {
    this.activeTab = 'overview';
    this.users = [];
    this.stats = null;
    this.pendingListings = [];
    this.recentActivity = [];
  }

  init() {
    this.checkAdminSession();
    
    // AUTO-OPEN: If already logged in as admin on page load, open portal automatically
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (session && (session.role === 'admin' || session.isAdmin || session.id === 'usr-admin-01')) {
      // Open admin portal automatically after a short delay
      setTimeout(() => {
        this.openAdminModal();
      }, 1000);
    }
  }

  checkAdminSession() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const isAdmin = Boolean(
      session && (
        session.id === 'usr-admin-01' || 
        session.role === 'admin' ||
        session.isAdmin === true ||
        (session.email && session.email.toLowerCase().includes('admin')) ||
        (session.name && session.name.toLowerCase().includes('admin'))
      )
    );

    const adminHeaderBtn = document.getElementById('btn-admin-header');
    const adminLinks = document.getElementById('auth-admin-links');
    const roleBadge = document.getElementById('auth-user-role-badge');

    if (isAdmin) {
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'inline-flex';
      if (adminLinks) adminLinks.style.display = 'block';
      if (roleBadge) {
        roleBadge.textContent = '👑 Administrator';
        roleBadge.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
        roleBadge.style.color = '#ffffff';
        roleBadge.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)';
      }
    } else {
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none';
      if (adminLinks) adminLinks.style.display = 'none';
    }

    return isAdmin;
  }

  async openAdminModal() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    
    // Check if user is logged in
    if (!session) {
      if (window.app) window.app.showToast('⚠️ Please sign in with admin credentials', 'error');
      if (window.kejaAuth) window.kejaAuth.openAuthModal();
      return;
    }

    // Check if user is admin
    const isAdmin = Boolean(
      session.id === 'usr-admin-01' || 
      session.role === 'admin' ||
      session.isAdmin === true ||
      (session.email && session.email.toLowerCase().includes('admin')) ||
      (session.name && session.name.toLowerCase().includes('admin'))
    );

    if (!isAdmin) {
      if (window.app) window.app.showToast('🚫 Access denied. Admin credentials required.', 'error');
      return;
    }

    // User is admin - open portal
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-admin-portal');
    }

    this.switchTab('overview');
    await this.refreshAllData();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabs = ['overview', 'users', 'listings', 'system'];
    
    tabs.forEach(t => {
      const btn = document.getElementById(`admin-tab-btn-${t}`);
      const pane = document.getElementById(`admin-tab-pane-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.classList.add('active');
          btn.style.background = '#7c3aed';
          btn.style.color = '#ffffff';
        } else {
          btn.classList.remove('active');
          btn.style.background = 'transparent';
          btn.style.color = '#475569';
        }
      }
      if (pane) {
        pane.style.display = t === tabName ? 'block' : 'none';
      }
    });

    if (tabName === 'users') this.renderUsers();
    if (tabName === 'listings') this.renderListings();
    if (tabName === 'system') {
      this.loadMpesaConfig();
      this.loadActivityLogs();
    }
    if (tabName === 'overview') this.renderStats();
  }

  async refreshAllData() {
    try {
      const headers = {};
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch overview stats
      const statsRes = await fetch('/api/admin/overview', { headers });
      if (statsRes.ok) {
        this.stats = await statsRes.json();
        this.renderStats();
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        this.users = data.users || [];
        if (this.activeTab === 'users') this.renderUsers();
      }

      // Fetch pending listings
      const pendingRes = await fetch('/api/admin/pending-listings', { headers });
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        this.pendingListings = data.listings || [];
        if (this.activeTab === 'listings') this.renderListings();
        
        // Update pending count badge
        const pendingBadge = document.getElementById('admin-pending-count');
        if (pendingBadge) {
          pendingBadge.textContent = this.pendingListings.length;
          pendingBadge.style.display = this.pendingListings.length > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (err) {
      console.warn('Admin fetch error:', err);
    }
  }

  renderStats() {
    if (!this.stats) return;
    const s = this.stats;

    // Update basic stat cards
    const elTotalUsers = document.getElementById('admin-stat-total-users');
    const elLandlords = document.getElementById('admin-stat-landlords');
    const elTenants = document.getElementById('admin-stat-tenants');
    const elTotalProps = document.getElementById('admin-stat-total-props');
    const elAvailableProps = document.getElementById('admin-stat-available-props');
    const elTakenProps = document.getElementById('admin-stat-taken-props');

    if (elTotalUsers) elTotalUsers.textContent = s.totalUsers || (this.users ? this.users.length : 0);
    if (elLandlords) elLandlords.textContent = s.landlords || 0;
    if (elTenants) elTenants.textContent = s.tenants || 0;
    if (elTotalProps) elTotalProps.textContent = s.totalProperties || (window.app?.properties?.length || 0);
    if (elAvailableProps) elAvailableProps.textContent = s.availableProperties || 0;
    if (elTakenProps) elTakenProps.textContent = s.takenProperties || 0;

    // Render advanced analytics
    this.renderAdvancedAnalytics();
  }

  renderAdvancedAnalytics() {
    const container = document.getElementById('admin-analytics-container');
    if (!container) return;

    const properties = (window.app && window.app.properties) || [];
    const users = this.users || [];

    // Calculate analytics
    const avgPrice = properties.length > 0 
      ? Math.round(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length)
      : 0;

    const areaStats = {};
    properties.forEach(p => {
      const area = p.area || p.location || 'Unknown';
      areaStats[area] = (areaStats[area] || 0) + 1;
    });

    const topAreas = Object.entries(areaStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const typeStats = {};
    properties.forEach(p => {
      const type = p.type || 'Other';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    // Growth metrics (simulated for now)
    const newUsersThisWeek = users.filter(u => {
      if (!u.createdAt) return false;
      const created = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length;

    const newListingsThisWeek = properties.filter(p => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 24px;">
        
        <!-- Growth Metrics -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="fas fa-chart-line" style="font-size: 1.5rem; margin-right: 10px;"></i>
            <h3 style="margin: 0; font-size: 1rem;">Growth (7 Days)</h3>
          </div>
          <div style="font-size: 2rem; font-weight: 800; margin-bottom: 4px;">+${newUsersThisWeek + newListingsThisWeek}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">
            ${newUsersThisWeek} new users • ${newListingsThisWeek} new listings
          </div>
        </div>

        <!-- Price Analytics -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 20px; color: white; box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="fas fa-coins" style="font-size: 1.5rem; margin-right: 10px;"></i>
            <h3 style="margin: 0; font-size: 1rem;">Avg. Rent Price</h3>
          </div>
          <div style="font-size: 2rem; font-weight: 800; margin-bottom: 4px;">KES ${avgPrice.toLocaleString()}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">
            Across ${properties.length} listings
          </div>
        </div>

        <!-- Popular Areas -->
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 20px; color: white; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="fas fa-map-marked-alt" style="font-size: 1.5rem; margin-right: 10px;"></i>
            <h3 style="margin: 0; font-size: 1rem;">Top Areas</h3>
          </div>
          <div style="font-size: 0.9rem;">
            ${topAreas.map((a, i) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; opacity: ${1 - (i * 0.15)};">
                <span>${i + 1}. ${a[0]}</span>
                <span style="font-weight: 700;">${a[1]} listings</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Property Types -->
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 20px; color: white; box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="fas fa-home" style="font-size: 1.5rem; margin-right: 10px;"></i>
            <h3 style="margin: 0; font-size: 1rem;">Property Mix</h3>
          </div>
          <div style="font-size: 0.9rem;">
            ${Object.entries(typeStats).map(([type, count]) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>${type}</span>
                <span style="font-weight: 700;">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  renderUsers() {
    const container = document.getElementById('admin-users-table-body');
    if (!container) return;

    if (!this.users || this.users.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #64748b;">No registered users found.</td></tr>`;
      return;
    }

    // Separate users by role
    const tenants = this.users.filter(u => u.role === 'tenant');
    const landlords = this.users.filter(u => u.role === 'landlord' || u.role === 'agency');
    const serviceProviders = this.users.filter(u => u.role === 'service');
    const admins = this.users.filter(u => u.role === 'admin' || u.isAdmin || u.id === 'usr-admin-01');

    let html = '';

    // ADMINS Section
    if (admins.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #fef08a, #fde047); border-bottom: 2px solid #eab308;">
          <td colspan="6" style="padding: 12px; font-weight: 800; color: #713f12; font-size: 0.95rem;">
            <i class="fas fa-crown"></i> ADMINISTRATORS (${admins.length})
          </td>
        </tr>
      `;
      html += admins.map(u => this.renderUserRow(u)).join('');
    }

    // LANDLORDS & AGENTS Section
    if (landlords.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe); border-bottom: 2px solid #818cf8; margin-top: 20px;">
          <td colspan="6" style="padding: 12px; font-weight: 800; color: #3730a3; font-size: 0.95rem;">
            <i class="fas fa-building"></i> LANDLORDS & AGENCIES (${landlords.length})
          </td>
        </tr>
      `;
      html += landlords.map(u => this.renderUserRow(u)).join('');
    }

    // SERVICE PROVIDERS Section
    if (serviceProviders.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #cffafe, #a5f3fc); border-bottom: 2px solid #06b6d4;">
          <td colspan="6" style="padding: 12px; font-weight: 800; color: #164e63; font-size: 0.95rem;">
            <i class="fas fa-tools"></i> SERVICE PROVIDERS (${serviceProviders.length})
          </td>
        </tr>
      `;
      html += serviceProviders.map(u => this.renderUserRow(u)).join('');
    }

    // TENANTS Section
    if (tenants.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-bottom: 2px solid #10b981;">
          <td colspan="6" style="padding: 12px; font-weight: 800; color: #065f46; font-size: 0.95rem;">
            <i class="fas fa-users"></i> TENANTS (${tenants.length})
          </td>
        </tr>
      `;
      html += tenants.map(u => this.renderUserRow(u)).join('');
    }

    container.innerHTML = html;
  }

  renderUserRow(u) {
    const roleColors = {
      admin: 'background: #fef3c7; color: #92400e;',
      landlord: 'background: #e0e7ff; color: #4338ca;',
      agency: 'background: #ddd6fe; color: #5b21b6;',
      service: 'background: #cffafe; color: #155e75;',
      tenant: 'background: #d1fae5; color: #065f46;'
    };

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-weight: 700; color: #1e293b;">
          ${u.name}
          ${u.id === 'usr-admin-01' || u.role === 'admin' || u.isAdmin ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">ADMIN</span>' : ''}
          ${u.isBanned ? '<span style="background: #fecaca; color: #991b1b; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">BANNED</span>' : ''}
        </td>
        <td style="padding: 12px; color: #475569;">${u.phone || '-'}</td>
        <td style="padding: 12px; color: #475569; font-size: 0.82rem;">${u.email || '-'}</td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; ${roleColors[u.role] || roleColors.tenant}">
            ${u.role === 'agency' ? 'Agency' : u.role}
          </span>
        </td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${u.isVerified ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${u.isVerified ? '✓ Verified' : 'Unverified'}
          </span>
        </td>
        <td style="padding: 12px; text-align: right;">
          <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0 4px; cursor: pointer; background: #4f46e5; color: white;" onclick="kejaAdmin.contactUser('${u.id}', '${u.role}')">
            <i class="fas fa-comments"></i> Contact
          </button>
          <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0 4px; cursor: pointer; background: ${u.isVerified ? '#f87171; color: white;' : '#10b981; color: white;'}" onclick="kejaAdmin.toggleUserVerification('${u.id}')">
            ${u.isVerified ? 'Revoke' : 'Verify'}
          </button>
          ${u.id !== 'usr-admin-01' && !u.isAdmin && u.role !== 'admin' ? `
            <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0; cursor: pointer; background: ${u.isBanned ? '#10b981; color: white;' : '#ef4444; color: white;'}" onclick="kejaAdmin.toggleUserBan('${u.id}')">
              ${u.isBanned ? 'Unban' : 'Ban'}
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  renderListings() {
    const container = document.getElementById('admin-listings-table-body');
    if (!container) return;

    const properties = (window.app && window.app.properties) || [];
    const pending = this.pendingListings || [];
    
    // Separate properties and services
    const pendingProperties = pending.filter(p => !p.listingType || p.listingType === 'property');
    const pendingServices = pending.filter(p => p.listingType === 'service');
    const approvedProperties = properties.filter(p => !p.listingType || p.listingType === 'property');
    const approvedServices = properties.filter(p => p.listingType === 'service');
    
    if (properties.length === 0 && pending.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: #64748b;">No listings in database.</td></tr>`;
      return;
    }

    let html = '';

    // ═══ PENDING PROPERTIES ═══
    if (pendingProperties.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #fef3c7, #fde047); border-bottom: 2px solid #f59e0b;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #92400e; font-size: 0.95rem;">
            <i class="fas fa-home"></i> PENDING PROPERTIES (${pendingProperties.length})
          </td>
        </tr>
      `;

      pendingProperties.forEach(p => {
        html += `
          <tr style="background: #fffbeb; border-bottom: 1px solid #fde68a;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${p.title}</td>
            <td style="padding: 12px; color: #475569;">${p.estateSuburb || p.sublocation || '-'}</td>
            <td style="padding: 12px; font-weight: 700; color: #00b53f;">KSh ${Number(p.rentKes || 0).toLocaleString()}</td>
            <td style="padding: 12px;"><span style="background: #fbbf24; color: #78350f; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 700;">⏳ PENDING</span></td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${p.landlord?.name || 'Unknown'}</td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #6366f1; color: white; cursor: pointer;" onclick="kejaAdmin.viewListingDetails('${p.id}')">👁️ View</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #00b53f; color: white; cursor: pointer;" onclick="kejaAdmin.approveListing('${p.id}')">✓ Approve</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.rejectListing('${p.id}')">✗ Reject</button>
            </td>
          </tr>
        `;
      });
    }

    // ═══ PENDING SERVICES ═══
    if (pendingServices.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #bae6fd, #7dd3fc); border-bottom: 2px solid #0284c7; margin-top: 20px;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #0c4a6e; font-size: 0.95rem;">
            <i class="fas fa-tools"></i> PENDING SERVICES (${pendingServices.length})
          </td>
        </tr>
      `;

      pendingServices.forEach(p => {
        html += `
          <tr style="background: #f0f9ff; border-bottom: 1px solid #bae6fd;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${p.businessName || p.title}</td>
            <td style="padding: 12px; color: #475569;">${p.category || '-'}</td>
            <td style="padding: 12px; font-weight: 700; color: #0284c7;">${p.serviceAreas || '-'}</td>
            <td style="padding: 12px;"><span style="background: #fbbf24; color: #78350f; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 700;">⏳ PENDING</span></td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${p.providerName || 'Unknown'}</td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #6366f1; color: white; cursor: pointer;" onclick="kejaAdmin.viewListingDetails('${p.id}')">👁️ View</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #00b53f; color: white; cursor: pointer;" onclick="kejaAdmin.approveListing('${p.id}')">✓ Approve</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.rejectListing('${p.id}')">✗ Reject</button>
            </td>
          </tr>
        `;
      });
    }

    // ═══ APPROVED PROPERTIES ═══
    if (approvedProperties.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-bottom: 2px solid #10b981; margin-top: 20px;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #065f46; font-size: 0.95rem;">
            <i class="fas fa-check-circle"></i> LIVE PROPERTIES (${approvedProperties.length})
          </td>
        </tr>
      `;

      approvedProperties.slice(0, 20).forEach(p => {
        html += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${p.title}</td>
            <td style="padding: 12px; color: #475569;">${p.estateSuburb || p.sublocation || '-'}</td>
            <td style="padding: 12px; font-weight: 700; color: #00b53f;">KSh ${Number(p.rentKes || 0).toLocaleString()}</td>
            <td style="padding: 12px;"><span style="background: #dcfce7; color: #166534; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 700;">✓ LIVE</span></td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${p.landlord?.name || '-'}</td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #6366f1; color: white; cursor: pointer;" onclick="window.app.openPropertyDetail('${p.id}')">👁️ View</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.deleteListing('${p.id}')">🗑️ Delete</button>
            </td>
          </tr>
        `;
      });
    }

    // ═══ APPROVED SERVICES ═══
    if (approvedServices.length > 0) {
      html += `
        <tr style="background: linear-gradient(135deg, #cffafe, #a5f3fc); border-bottom: 2px solid #06b6d4; margin-top: 20px;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #164e63; font-size: 0.95rem;">
            <i class="fas fa-check-circle"></i> LIVE SERVICES (${approvedServices.length})
          </td>
        </tr>
      `;

      approvedServices.forEach(p => {
        html += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${p.businessName || p.title}</td>
            <td style="padding: 12px; color: #475569;">${p.category || '-'}</td>
            <td style="padding: 12px; font-weight: 700; color: #0284c7;">${p.serviceAreas || '-'}</td>
            <td style="padding: 12px;"><span style="background: #dcfce7; color: #166534; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 700;">✓ LIVE</span></td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${p.providerName || '-'}</td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0 4px; background: #6366f1; color: white; cursor: pointer;" onclick="alert('Service details')">👁️ View</button>
              <button class="category-pill" style="font-size: 0.75rem; padding: 6px 12px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.deleteListing('${p.id}')">🗑️ Delete</button>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = html;
  }            <td style="padding: 12px;">${p.isTopAd ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px;">TOP AD</span>' : '<span style="color:#94a3b8; font-size:0.75rem;">Standard</span>'}</td>
            <td style="padding: 12px;"><span style="font-weight: 700; color: ${p.isTaken ? '#ef4444' : '#00b53f'}">${p.isTaken ? '🔴 Taken' : '🟢 Vacant'}</span></td>
            <td style="padding: 12px; font-size: 0.75rem; color: #64748b;">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <button class="category-pill" style="font-size: 0.72rem; padding: 4px 8px; margin: 0 4px; background: #ff9800; color: white; cursor: pointer;" onclick="kejaAdmin.boostListing('${p.id}')">⚡ Boost</button>
              <button class="category-pill" style="font-size: 0.72rem; padding: 4px 8px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.deleteListing('${p.id}')">🗑 Delete</button>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = html;
  }

  async toggleUserVerification(userId) {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/toggle-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(data.message, 'success');
        await this.refreshAllData();
      } else {
        if (window.app) window.app.showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  async toggleUserBan(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const action = user.isBanned ? 'unban' : 'ban';
    if (!confirm(`${action.toUpperCase()} user ${user.name}?`)) return;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(data.message, 'success');
        await this.refreshAllData();
      } else {
        if (window.app) window.app.showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  async approveListing(propId) {
    if (!confirm('Approve this listing? It will go live immediately.')) return;
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) {
          window.app.showToast('✅ Listing approved & published!', 'success');
          window.app.loadProperties();
        }
        await this.refreshAllData();
      } else {
        if (window.app) window.app.showToast(data.message || 'Approval failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  async rejectListing(propId) {
    const reason = prompt('Why are you rejecting this listing?\n(Optional - will be sent to landlord)');
    if (reason === null) return;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('❌ Listing rejected', 'info');
        await this.refreshAllData();
      } else {
        if (window.app) window.app.showToast(data.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  viewListingDetails(propId) {
    const allProps = [
      ...(this.pendingListings || []),
      ...((window.app && window.app.properties) || [])
    ];
    const property = allProps.find(p => p.id === propId);
    
    if (!property) {
      if (window.app) window.app.showToast('Property not found', 'error');
      return;
    }

    const isPending = !property.isVerified && property.status !== 'approved';
    const isService = property.listingType === 'service';

    // Build photo gallery
    let photoGallery = '';
    if (property.images && property.images.length > 0) {
      photoGallery = `
        <div style="margin-bottom: 20px;">
          <div style="position: relative; margin-bottom: 12px;">
            <img id="admin-preview-main-photo" src="${property.images[0]}" alt="Property" style="width: 100%; height: 400px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
              <i class="fas fa-images"></i> ${property.images.length} Photos
            </div>
          </div>
          <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;">
            ${property.images.map((img, idx) => `
              <img src="${img}" onclick="document.getElementById('admin-preview-main-photo').src='${img}'" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid ${idx === 0 ? '#4f46e5' : 'transparent'}; transition: all 0.2s;" onmouseover="this.style.borderColor='#4f46e5'" onmouseout="this.style.borderColor='${idx === 0 ? '#4f46e5' : 'transparent'}'" />
            `).join('')}
          </div>
        </div>
      `;
    }

    // Build video section
    let videoSection = '';
    if (property.videoUrl) {
      videoSection = `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px; color: #1e293b; font-size: 1rem;"><i class="fas fa-video"></i> Video Tour</h4>
          <video controls style="width: 100%; max-height: 400px; border-radius: 12px;">
            <source src="${property.videoUrl}" type="video/mp4">
            Your browser does not support video playback.
          </video>
        </div>
      `;
    }

    // Landlord/Provider contact info
    const contactInfo = isService 
      ? `
        <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #0284c7;">
          <h4 style="margin: 0 0 12px; color: #0c4a6e; font-size: 1rem;"><i class="fas fa-user-tie"></i> Service Provider</h4>
          <div style="display: grid; gap: 8px;">
            <div><strong>Name:</strong> ${property.providerName || 'N/A'}</div>
            <div><strong>Business:</strong> ${property.businessName || 'N/A'}</div>
            <div><strong>Phone:</strong> <a href="tel:${property.phone}" style="color: #0284c7; font-weight: 600;"><i class="fas fa-phone"></i> ${property.phone}</a></div>
            <div><strong>Category:</strong> ${property.category || 'N/A'}</div>
            <div><strong>Service Areas:</strong> ${property.serviceAreas || 'N/A'}</div>
          </div>
          <button onclick="kejaAdmin.contactUser('${property.postedBy}', 'service')" style="margin-top: 12px; width: 100%; background: #0284c7; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            <i class="fas fa-comments"></i> Message Provider
          </button>
        </div>
      `
      : `
        <div style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #6366f1;">
          <h4 style="margin: 0 0 12px; color: #3730a3; font-size: 1rem;"><i class="fas fa-user-tie"></i> Landlord Contact</h4>
          <div style="display: grid; gap: 8px;">
            <div><strong>Name:</strong> ${property.landlord?.name || 'N/A'}</div>
            <div><strong>Phone:</strong> <a href="tel:${property.landlord?.phone}" style="color: #4f46e5; font-weight: 600;"><i class="fas fa-phone"></i> ${property.landlord?.phone}</a></div>
            <div><strong>WhatsApp:</strong> <a href="https://wa.me/${property.landlord?.whatsapp?.replace(/[^0-9]/g, '')}" target="_blank" style="color: #25d366; font-weight: 600;"><i class="fab fa-whatsapp"></i> ${property.landlord?.whatsapp}</a></div>
            <div><strong>Email:</strong> ${property.landlord?.email || 'N/A'}</div>
            ${property.landlord?.isAgency ? `<div><strong>Agency:</strong> ${property.agencyName || 'Yes'}</div>` : ''}
          </div>
          <button onclick="kejaAdmin.contactUser('${property.postedBy}', 'landlord')" style="margin-top: 12px; width: 100%; background: #6366f1; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            <i class="fas fa-comments"></i> Message Landlord
          </button>
        </div>
      `;

    const modalHtml = `
      <div id="admin-listing-preview-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;" onclick="if(event.target.id==='admin-listing-preview-modal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 95vh; overflow-y: auto; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${isPending ? '#f59e0b' : '#10b981'} 0%, ${isPending ? '#d97706' : '#059669'} 100%); padding: 24px; color: white; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 100;">
            <button onclick="document.getElementById('admin-listing-preview-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            <h2 style="margin: 0; font-size: 1.5rem;">${isPending ? '⏳ Pending Verification' : '✅ Verified Listing'}</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">${isService ? 'Service Provider' : 'Property'} • Posted ${new Date(property.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            ${photoGallery}
            ${videoSection}

            <!-- Title & Price -->
            <h3 style="margin: 0 0 16px; font-size: 1.6rem; color: #1e293b;">${isService ? property.businessName : property.title}</h3>
            
            ${!isService ? `
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                <span style="font-size: 2rem; font-weight: 800; color: #00b53f;">KSh ${Number(property.rentKes || property.price || 0).toLocaleString()}</span>
                <span style="background: #e0e7ff; color: #4338ca; padding: 6px 14px; border-radius: 12px; font-size: 0.9rem; font-weight: 600;">${property.category || 'Property'}</span>
                <span style="background: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 12px; font-size: 0.9rem; font-weight: 600;">${property.bedrooms} Bedroom</span>
              </div>
            ` : ''}

            ${contactInfo}

            <!-- Description -->
            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 12px; color: #1e293b; font-size: 1rem;"><i class="fas fa-align-left"></i> Description</h4>
              <p style="margin: 0; color: #475569; line-height: 1.6;">${property.description || 'No description provided.'}</p>
            </div>

            <!-- Location Details -->
            ${!isService ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">📍 Location</div>
                  <div style="font-weight: 600; color: #1e293b;">${property.area || property.location || '-'}</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">🏘️ Estate/Suburb</div>
                  <div style="font-weight: 600; color: #1e293b;">${property.estateSuburb || property.sublocation || '-'}</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">💧 Water</div>
                  <div style="font-weight: 600; color: #1e293b;">${property.waterSupplyType || '-'}</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">⚡ Electricity</div>
                  <div style="font-weight: 600; color: #1e293b;">${property.electricityMeterType || '-'}</div>
                </div>
              </div>
            ` : ''}

            <!-- Action Buttons -->
            ${isPending ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
                <button onclick="kejaAdmin.approveListing('${property.id}'); document.getElementById('admin-listing-preview-modal').remove();" style="background: #10b981; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  <i class="fas fa-check-circle"></i> Approve & Publish
                </button>
                <button onclick="kejaAdmin.rejectListing('${property.id}'); document.getElementById('admin-listing-preview-modal').remove();" style="background: #ef4444; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  <i class="fas fa-times-circle"></i> Reject Listing
                </button>
              </div>
            ` : `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
                <button onclick="kejaAdmin.boostListing('${property.id}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  <i class="fas fa-rocket"></i> Boost This Listing
                </button>
                <button onclick="if(confirm('Delete this listing permanently?')) { kejaAdmin.deleteListing('${property.id}'); document.getElementById('admin-listing-preview-modal').remove(); }" style="background: #ef4444; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  <i class="fas fa-trash"></i> Delete Listing
                </button>
              </div>
            `}

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  async boostListing(propId) {
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/boost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boostType: 'top_ad' })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) {
          window.app.showToast('Listing boosted to TOP AD!', 'success');
          window.app.loadProperties();
        }
        this.renderListings();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Failed to boost listing', 'error');
    }
  }

  async deleteListing(propId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) {
          window.app.showToast('Listing removed', 'info');
          window.app.loadProperties();
        }
        this.renderListings();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error deleting listing', 'error');
    }
  }

  downloadBackup() {
    window.open('/api/admin/download-db', '_blank');
  }

  async loadActivityLogs() {
    const container = document.getElementById('admin-activity-logs-container');
    if (!container) return;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/admin/activity-logs?limit=50', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      const data = await res.json();
      if (!data.success || !data.logs || data.logs.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 24px; color: #94a3b8;">
            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 8px;"></i>
            <div>No activity logs found</div>
          </div>
        `;
        return;
      }

      const actionIcons = {
        'APPROVED_LISTING': '✅',
        'REJECTED_LISTING': '❌',
        'BANNED_USER': '🚫',
        'UNBANNED_USER': '✓',
      };

      const actionColors = {
        'APPROVED_LISTING': '#dcfce7; color: #166534',
        'REJECTED_LISTING': '#fee2e2; color: #991b1b',
        'BANNED_USER': '#fef3c7; color: #92400e',
        'UNBANNED_USER': '#dbeafe; color: #1e40af',
      };

      container.innerHTML = data.logs.map(log => {
        const date = new Date(log.timestamp);
        const icon = actionIcons[log.action] || '📝';
        const color = actionColors[log.action] || '#f1f5f9; color: #475569';
        
        let detailsText = '';
        if (log.details) {
          if (log.details.propertyTitle) detailsText = `Property: ${log.details.propertyTitle}`;
          if (log.details.userName) detailsText = `User: ${log.details.userName}`;
          if (log.details.reason) detailsText += ` | Reason: ${log.details.reason}`;
        }

        return `
          <div style="background: #f8fafc; border-left: 3px solid #7c3aed; padding: 12px; margin-bottom: 8px; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: ${color}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
                  ${icon} ${log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <span style="font-size: 0.75rem; color: #64748b;">${date.toLocaleString()}</span>
            </div>
            ${detailsText ? `<div style="font-size: 0.85rem; color: #475569; margin-top: 6px;">${detailsText}</div>` : ''}
          </div>
        `;
      }).join('');

    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #ef4444;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <div>Failed to load activity logs</div>
        </div>
      `;
    }
  }

  async loadMpesaConfig() {
    try {
      const res = await fetch('/api/admin/mpesa-config');
      if (res.ok) {
        const data = await res.json();
        const badge = document.getElementById('admin-daraja-status-badge');
        
        if (badge) {
          if (data.hasDarajaCredentials) {
            badge.textContent = `Active (${data.environment?.toUpperCase() || 'PROD'})`;
            badge.style.background = '#dcfce7';
            badge.style.color = '#15803d';
          } else {
            badge.textContent = 'Keys Pending';
            badge.style.background = '#fee2e2';
            badge.style.color = '#991b1b';
          }
        }
      }
    } catch (e) {
      console.warn('Could not load M-Pesa config:', e);
    }
  }

  async saveMpesaConfig(e) {
    if (e) e.preventDefault();
    const key = document.getElementById('admin-mpesa-key')?.value.trim();
    const secret = document.getElementById('admin-mpesa-secret')?.value.trim();
    const passkey = document.getElementById('admin-mpesa-passkey')?.value.trim();
    const paybill = document.getElementById('admin-mpesa-paybill')?.value.trim();
    const account = document.getElementById('admin-mpesa-account')?.value.trim();
    const env = document.getElementById('admin-mpesa-env')?.value;

    const payload = {};
    if (key) payload.consumerKey = key;
    if (secret) payload.consumerSecret = secret;
    if (passkey) payload.passkey = passkey;
    if (paybill) payload.paybill = paybill;
    if (account) payload.account = account;
    if (env) payload.environment = env;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/mpesa-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('✅ M-Pesa configuration saved!', 'success');
        this.loadMpesaConfig();
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Failed to save'}`, 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('❌ Server error', 'error');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // COMMUNICATION SYSTEM
  // ═══════════════════════════════════════════════════════════

  contactUser(userId, userType) {
    // Find user details
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      if (window.app) window.app.showToast('User not found', 'error');
      return;
    }

    const modalHtml = `
      <div id="admin-contact-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="if(event.target.id==='admin-contact-modal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; color: white; border-radius: 16px 16px 0 0;">
            <button onclick="document.getElementById('admin-contact-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">×</button>
            <h2 style="margin: 0; font-size: 1.4rem;"><i class="fas fa-comments"></i> Contact User</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">${user.name || 'User'} • ${userType}</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            <!-- User Info -->
            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <div style="display: grid; gap: 8px;">
                <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
                <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                <div><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                <div><strong>User ID:</strong> ${user.id}</div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <a href="tel:${user.phone}" style="background: #10b981; color: white; padding: 12px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 700;">
                <i class="fas fa-phone"></i> Call
              </a>
              <a href="https://wa.me/${user.phone?.replace(/[^0-9]/g, '')}" target="_blank" style="background: #25d366; color: white; padding: 12px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 700;">
                <i class="fab fa-whatsapp"></i> WhatsApp
              </a>
            </div>

            <!-- Message Form -->
            <form onsubmit="event.preventDefault(); kejaAdmin.sendDirectMessage('${user.id}', document.getElementById('admin-message-text').value);">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b;">Send Message (SMS/Email)</label>
              <textarea id="admin-message-text" placeholder="Type your message here..." style="width: 100%; min-height: 120px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-family: inherit; resize: vertical; margin-bottom: 12px;" required></textarea>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button type="submit" style="background: #4f46e5; color: white; padding: 12px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer;">
                  <i class="fas fa-paper-plane"></i> Send Message
                </button>
                <button type="button" onclick="document.getElementById('admin-contact-modal').remove()" style="background: #6b7280; color: white; padding: 12px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer;">
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  async sendDirectMessage(userId, message) {
    if (!message || !message.trim()) {
      if (window.app) window.app.showToast('Please enter a message', 'error');
      return;
    }

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId,
          message: message.trim(),
          method: 'both' // Send via both SMS and Email
        })
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('✅ Message sent successfully!', 'success');
        document.getElementById('admin-contact-modal')?.remove();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  openBroadcastModal() {
    const modalHtml = `
      <div id="admin-broadcast-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="if(event.target.id==='admin-broadcast-modal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 700px; width: 100%; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; color: white; border-radius: 16px 16px 0 0;">
            <button onclick="document.getElementById('admin-broadcast-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">×</button>
            <h2 style="margin: 0; font-size: 1.4rem;"><i class="fas fa-bullhorn"></i> Broadcast Message</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">Send message to all users in a role</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            <form onsubmit="event.preventDefault(); kejaAdmin.sendBroadcast();">
              
              <!-- Target Role -->
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b;">Target Audience</label>
                <select id="broadcast-target-role" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-family: inherit;" required>
                  <option value="">-- Select Role --</option>
                  <option value="tenant">All Tenants (${this.users.filter(u => u.role === 'tenant').length} users)</option>
                  <option value="landlord">All Landlords (${this.users.filter(u => u.role === 'landlord').length} users)</option>
                  <option value="agency">All Agencies (${this.users.filter(u => u.role === 'agency').length} users)</option>
                  <option value="service">All Service Providers (${this.users.filter(u => u.role === 'service').length} users)</option>
                  <option value="all">Everyone (${this.users.length} users)</option>
                </select>
              </div>

              <!-- Message -->
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b;">Message</label>
                <textarea id="broadcast-message-text" placeholder="Type your broadcast message..." style="width: 100%; min-height: 150px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-family: inherit; resize: vertical;" required></textarea>
              </div>

              <!-- Delivery Method -->
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b;">Delivery Method</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                  <label style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 2px solid #e5e7eb; cursor: pointer; text-align: center;">
                    <input type="radio" name="delivery-method" value="email" checked style="margin-right: 6px;">
                    <i class="fas fa-envelope"></i> Email
                  </label>
                  <label style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 2px solid #e5e7eb; cursor: pointer; text-align: center;">
                    <input type="radio" name="delivery-method" value="sms" style="margin-right: 6px;">
                    <i class="fas fa-sms"></i> SMS
                  </label>
                  <label style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 2px solid #e5e7eb; cursor: pointer; text-align: center;">
                    <input type="radio" name="delivery-method" value="both" style="margin-right: 6px;">
                    <i class="fas fa-check-double"></i> Both
                  </label>
                </div>
              </div>

              <!-- Actions -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button type="submit" style="background: #f59e0b; color: white; padding: 14px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  <i class="fas fa-paper-plane"></i> Send Broadcast
                </button>
                <button type="button" onclick="document.getElementById('admin-broadcast-modal').remove()" style="background: #6b7280; color: white; padding: 14px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  async sendBroadcast() {
    const targetRole = document.getElementById('broadcast-target-role')?.value;
    const message = document.getElementById('broadcast-message-text')?.value.trim();
    const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked')?.value || 'email';

    if (!targetRole || !message) {
      if (window.app) window.app.showToast('Please fill in all fields', 'error');
      return;
    }

    if (!confirm(`Send this message to all ${targetRole === 'all' ? 'users' : targetRole + 's'}?`)) {
      return;
    }

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          targetRole,
          message,
          method: deliveryMethod
        })
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`✅ Broadcast sent to ${data.recipientCount || 0} users!`, 'success');
        document.getElementById('admin-broadcast-modal')?.remove();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed to send broadcast', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  openBoostManagementModal() {
    const modalHtml = `
      <div id="admin-boost-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="if(event.target.id==='admin-boost-modal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; color: white; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 100;">
            <button onclick="document.getElementById('admin-boost-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">×</button>
            <h2 style="margin: 0; font-size: 1.4rem;"><i class="fas fa-rocket"></i> Boost Management</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">Manage boosted listings and top ads</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            <div id="boost-listings-container"></div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.loadBoostedListings();
  }

  async loadBoostedListings() {
    const container = document.getElementById('boost-listings-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #f59e0b;"></i></div>';

    try {
      const properties = window.app?.properties || [];
      const boosted = properties.filter(p => p.isTopAd || p.boosted);

      if (boosted.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fas fa-rocket" style="font-size: 3rem; opacity: 0.3; margin-bottom: 16px;"></i>
            <div style="font-size: 1.1rem; font-weight: 600;">No boosted listings</div>
            <div style="margin-top: 8px;">Boosted listings will appear here</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e5e7eb;">Property</th>
              <th style="padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e5e7eb;">Location</th>
              <th style="padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e5e7eb;">Price</th>
              <th style="padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e5e7eb;">Status</th>
              <th style="padding: 12px; text-align: right; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e5e7eb;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${boosted.map(p => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${p.title || 'Untitled'}</td>
                <td style="padding: 12px; font-size: 0.85rem; color: #64748b;">${p.area || p.location || 'N/A'}</td>
                <td style="padding: 12px; font-weight: 700; color: #00b53f;">KSh ${Number(p.rentKes || p.price || 0).toLocaleString()}</td>
                <td style="padding: 12px;"><span style="background: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">🚀 BOOSTED</span></td>
                <td style="padding: 12px; text-align: right;">
                  <button onclick="kejaAdmin.unboostListing('${p.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                    <i class="fas fa-times"></i> Un-boost
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading boosted listings</div>';
    }
  }

  async unboostListing(propId) {
    if (!confirm('Remove boost from this listing?')) return;

    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/unboost`, {
        method: 'PUT'
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) {
          window.app.showToast('Boost removed', 'info');
          window.app.loadProperties();
        }
        this.loadBoostedListings();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Failed to remove boost', 'error');
    }
  }
}

// Initialize admin engine
window.kejaAdmin = new AdminPortalEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.kejaAdmin.init();
});
