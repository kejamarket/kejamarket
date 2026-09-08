/**
 * KejaMarket - Official Administrator Control Center Engine
 * Provides live analytics, user management, listings moderation, and database tools.
 */

class AdminPortalEngine {
  constructor() {
    this.activeTab = 'overview';
    this.users = [];
    this.stats = null;
  }

  init() {
    // Check if current user is admin and update UI
    this.checkAdminSession();
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
    } catch (err) {
      console.warn('Admin fetch error:', err);
    }
  }

  renderStats() {
    if (!this.stats) return;
    const s = this.stats;

    const elTotalUsers = document.getElementById('admin-stat-total-users');
    const elLandlords = document.getElementById('admin-stat-landlords');
    const elTenants = document.getElementById('admin-stat-tenants');
    const elTotalProps = document.getElementById('admin-stat-total-props');
    const elAvailableProps = document.getElementById('admin-stat-available-props');
    const elTakenProps = document.getElementById('admin-stat-taken-props');

    if (elTotalUsers) elTotalUsers.textContent = s.totalUsers || (this.users ? this.users.length : 0);
    if (elLandlords) elLandlords.textContent = s.landlords || 0;
    if (elTenants) elTenants.textContent = s.tenants || 0;
    if (elTotalProps) elTotalProps.textContent = s.totalProperties || (window.app?.state?.properties?.length || 0);
    if (elAvailableProps) elAvailableProps.textContent = s.availableProperties || 0;
    if (elTakenProps) elTakenProps.textContent = s.takenProperties || 0;
  }

  renderUsers() {
    const container = document.getElementById('admin-users-table-body');
    if (!container) return;

    if (!this.users || this.users.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #64748b;">No registered users found in database.</td></tr>`;
      return;
    }

    container.innerHTML = this.users.map(u => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-weight: 700; color: #1e293b;">
          ${u.name}
          ${u.id === 'usr-admin-01' ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">ADMIN</span>' : ''}
        </td>
        <td style="padding: 12px; color: #475569;">${u.phone || '-'}</td>
        <td style="padding: 12px; color: #475569; font-size: 0.82rem;">${u.email || '-'}</td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${u.role === 'landlord' ? '#e0e7ff; color: #4338ca;' : '#d1fae5; color: #065f46;'}">
            ${u.role === 'landlord' ? 'Landlord' : 'Tenant'}
          </span>
        </td>
        <td style="padding: 12px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: ${u.isVerified ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${u.isVerified ? '✓ Verified' : 'Unverified'}
          </span>
        </td>
        <td style="padding: 12px; text-align: right;">
          <button class="category-pill" style="font-size: 0.75rem; padding: 4px 10px; margin: 0; cursor: pointer; background: ${u.isVerified ? '#f87171; color: white;' : '#10b981; color: white;'}" onclick="kejaAdmin.toggleUserVerification('${u.id}')">
            ${u.isVerified ? 'Revoke Verify' : 'Verify Landlord'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderListings() {
    const container = document.getElementById('admin-listings-table-body');
    if (!container) return;

    const properties = (window.app && window.app.properties) || [];
    if (properties.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #64748b;">No listings in database.</td></tr>`;
      return;
    }

    container.innerHTML = properties.slice(0, 30).map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-weight: 600; color: #1e293b; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.title}">
          ${p.title}
        </td>
        <td style="padding: 12px; color: #475569;">${p.estateSuburb || p.county || '-'}</td>
        <td style="padding: 12px; font-weight: 700; color: #00b53f;">KSh ${Number(p.rentKes || 0).toLocaleString()}</td>
        <td style="padding: 12px;">
          ${p.isTopAd ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">TOP AD</span>' : '<span style="color:#94a3b8; font-size:0.75rem;">Standard</span>'}
        </td>
        <td style="padding: 12px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: ${p.isTaken ? '#ef4444' : '#00b53f'}">
            ${p.isTaken ? '🔴 Taken' : '🟢 Vacant'}
          </span>
        </td>
        <td style="padding: 12px; text-align: right; display: flex; gap: 6px; justify-content: flex-end;">
          <button class="category-pill" style="font-size: 0.72rem; padding: 4px 8px; margin: 0; background: #ff9800; color: white; cursor: pointer;" onclick="kejaAdmin.boostListing('${p.id}')">
            ⚡ Boost
          </button>
          <button class="category-pill" style="font-size: 0.72rem; padding: 4px 8px; margin: 0; background: #ef4444; color: white; cursor: pointer;" onclick="kejaAdmin.deleteListing('${p.id}')">
            🗑 Delete
          </button>
        </td>
      </tr>
    `).join('');
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
      if (window.app) window.app.showToast('Network error updating user', 'error');
    }
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
    if (!confirm('Are you sure you want to delete this listing from the database?')) return;
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) {
          window.app.showToast('Listing removed from database', 'info');
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
}

window.kejaAdmin = new AdminPortalEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.kejaAdmin.init();
});
