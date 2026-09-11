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
    if (!session) {
      if (window.app) window.app.showToast('Please sign in as Administrator.', 'error');
      if (window.kejaAuth) window.kejaAuth.openAuthModal();
      return;
    }

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

    container.innerHTML = this.users.map(u => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-weight: 700; color: #1e293b;">
          ${u.name}
          ${u.id === 'usr-admin-01' ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">ADMIN</span>' : ''}
          ${u.isBanned ? '<span style="background: #fecaca; color: #991b1b; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">BANNED</span>' : ''}
        </td>
        <td style="padding: 12px; color: #475569;">${u.phone || '-'}</td>
        <td style="padding: 12px; color: #475569; font-size: 0.82rem;">${u.email || '-'}</td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${u.role === 'landlord' ? '#e0e7ff; color: #4338ca;' : '#d1fae5; color: #065f46;'}">
            ${u.role === 'landlord' ? 'Landlord' : u.role === 'agency' ? 'Agency' : 'Tenant'}
          </span>
        </td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${u.isVerified ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${u.isVerified ? '✓ Verified' : 'Unverified'}
          </span>
        </td>
        <td style="padding: 12px; text-align: right;">
          <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0 4px; cursor: pointer; background: ${u.isVerified ? '#f87171; color: white;' : '#10b981; color: white;'}" onclick="kejaAdmin.toggleUserVerification('${u.id}')">
            ${u.isVerified ? 'Revoke' : 'Verify'}
          </button>
          ${u.id !== 'usr-admin-01' ? `
            <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0; cursor: pointer; background: ${u.isBanned ? '#10b981; color: white;' : '#ef4444; color: white;'}" onclick="kejaAdmin.toggleUserBan('${u.id}')">
              ${u.isBanned ? 'Unban' : 'Ban'}
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  renderListings() {
    const container = document.getElementById('admin-listings-table-body');
    if (!container) return;

    const properties = (window.app && window.app.properties) || [];
    const pending = this.pendingListings || [];
    
    if (properties.length === 0 && pending.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: #64748b;">No listings in database.</td></tr>`;
      return;
    }

    let html = '';

    // Show PENDING listings FIRST
    if (pending.length > 0) {
      html += `
        <tr style="background: #fef3c7; border-bottom: 2px solid #f59e0b;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #92400e; font-size: 0.9rem;">
            <i class="fas fa-clock"></i> PENDING APPROVAL (${pending.length})
          </td>
        </tr>
      `;

      pending.forEach(p => {
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

    // Show APPROVED listings
    if (properties.length > 0) {
      html += `
        <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
          <td colspan="7" style="padding: 12px; font-weight: 800; color: #475569; font-size: 0.9rem;">
            <i class="fas fa-check-circle"></i> LIVE LISTINGS (${properties.length})
          </td>
        </tr>
      `;

      properties.slice(0, 30).forEach(p => {
        html += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${p.title}</td>
            <td style="padding: 12px; color: #475569;">${p.estateSuburb || p.sublocation || '-'}</td>
            <td style="padding: 12px; font-weight: 700; color: #00b53f;">KSh ${Number(p.rentKes || 0).toLocaleString()}</td>
            <td style="padding: 12px;">${p.isTopAd ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px;">TOP AD</span>' : '<span style="color:#94a3b8; font-size:0.75rem;">Standard</span>'}</td>
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

    const modalHtml = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 24px; color: white; border-radius: 16px 16px 0 0; position: relative;">
            <button onclick="this.closest('[style*=position]').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            <h2 style="margin: 0; font-size: 1.5rem;">📋 Listing Details</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">Review before approval</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            <!-- Images -->
            ${property.images && property.images.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <img src="${property.images[0]}" alt="Property" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}

            <!-- Title & Price -->
            <h3 style="margin: 0 0 16px; font-size: 1.4rem; color: #1e293b;">${property.title}</h3>
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <span style="font-size: 1.8rem; font-weight: 800; color: #00b53f; margin-right: 12px;">KSh ${Number(property.rentKes || property.price || 0).toLocaleString()}</span>
              <span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${property.type || 'Property'}</span>
            </div>

            <!-- Location -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">📍 Location</div>
                <div style="font-weight: 600; color: #1e293b;">${property.area || property.location || '-'}</div>
              </div>
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">🏘️ Estate/Suburb</div>
                <div style="font-weight: 600; color: #1e293b;">${property.estateSuburb || property.sublocation || '-'}</div>
              </div>
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">🛏️ Bedrooms</div>
                <div style="font-weight: 600; color: #1e293b;">${property.bedrooms || '-'}</div>
              </div>
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">🚿 Bathrooms</div>
                <div style="font-weight: 600; color: #1e293b;">${property.bathrooms || '-'}</div>
              </div>
            </div>

            <!-- Description -->
            ${property.description ? `
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 8px;">📝 Description</div>
                <div style="color: #475569; line-height: 1.6; font-size: 0.95rem;">${property.description}</div>
              </div>
            ` : ''}

            <!-- Amenities -->
            ${property.amenities && property.amenities.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 8px;">✨ Amenities</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${property.amenities.map(a => `<span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">✓ ${a}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Landlord Info -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <div style="font-size: 0.85rem; font-weight: 600; color: #92400e; margin-bottom: 8px;">👤 Landlord Contact</div>
              <div style="color: #78350f;">
                <div style="margin-bottom: 4px;"><strong>Name:</strong> ${property.landlord?.name || property.landlordName || '-'}</div>
                <div style="margin-bottom: 4px;"><strong>Phone:</strong> ${property.landlordPhone || property.landlord?.phone || '-'}</div>
                <div><strong>WhatsApp:</strong> ${property.landlord?.whatsapp || property.landlordPhone || '-'}</div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 12px;">
              <button class="btn-primary" style="flex: 1; padding: 12px; font-size: 1rem; font-weight: 600; background: #00b53f; color: white; border: none; border-radius: 8px; cursor: pointer;" onclick="kejaAdmin.approveListing('${property.id}'); this.closest('[style*=position]').remove();">
                ✓ Approve Listing
              </button>
              <button class="btn-primary" style="flex: 1; padding: 12px; font-size: 1rem; font-weight: 600; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;" onclick="kejaAdmin.rejectListing('${property.id}'); this.closest('[style*=position]').remove();">
                ✗ Reject Listing
              </button>
            </div>

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
}

// Initialize admin engine
window.kejaAdmin = new AdminPortalEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.kejaAdmin.init();
});
