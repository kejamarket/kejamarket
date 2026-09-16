/**
 * KejaMarket Admin - User Management Module
 * Complete user management with CRUD, verification, suspension, and banning
 */

const AdminUsers = (() => {
  const API_BASE = '';
  let currentFilter = 'all';
  let currentUsers = [];
  let currentPage = 1;
  const PAGE_SIZE = 20;

  // Initialize user module
  async function init(filter = 'all') {
    currentFilter = filter;
    currentPage = 1;
    await loadUsers();
  }

  // Load users based on filter
  async function loadUsers() {
    const usersContent = document.getElementById('users-content');
    if (!usersContent) return;

    usersContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/users?filter=${currentFilter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load users');

      const data = await res.json();
      currentUsers = filterUsersByTab(data.users || []);
      renderUsersTable(currentUsers);
      
    } catch (error) {
      console.error('Error loading users:', error);
      usersContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load users</p></div>';
    }
  }

  // Filter users by tab
  function filterUsersByTab(users) {
    switch (currentFilter) {
      case 'all':
        return users;
      case 'tenants':
        return users.filter(u => u.role === 'tenant');
      case 'landlords':
        return users.filter(u => u.role === 'landlord');
      case 'agents':
        return users.filter(u => u.role === 'agent');
      case 'service-providers':
        return users.filter(u => u.role === 'service-provider');
      case 'pending':
        return users.filter(u => !u.isPhoneVerified);
      case 'verified':
        return users.filter(u => u.isPhoneVerified);
      case 'suspended':
        return users.filter(u => u.isSuspended || u.isBanned);
      default:
        return users;
    }
  }

  // Render users table
  function renderUsersTable(users) {
    const usersContent = document.getElementById('users-content');
    
    if (!users.length) {
      usersContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>No users found in this category</p>
        </div>
      `;
      return;
    }

    usersContent.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="user-search" placeholder="Search by name, email, phone..." onkeyup="AdminUsers.searchUsers(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminUsers.exportUsers()">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn-primary" onclick="AdminUsers.showAddUserModal()">
            <i class="fas fa-plus"></i> Add User
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Properties</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>
                  <div class="user-info" onclick="AdminUsers.viewUserDetail('${user.id}')" style="cursor: pointer;">
                    <div class="user-avatar" style="background: ${getRoleColor(user.role)}">${getInitials(user.name)}</div>
                    <div>
                      <div class="user-name">${escapeHtml(user.name)}</div>
                      <div class="user-id">#${user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.85rem;">
                    <div style="margin-bottom: 4px;">${user.email || '-'}</div>
                    <div style="color: #64748b;">${user.phone}</div>
                  </div>
                </td>
                <td><span class="badge badge-${user.role}">${formatRole(user.role)}</span></td>
                <td>${renderUserStatus(user)}</td>
                <td><span style="font-weight: 600;">${user.propertyCount || 0}</span></td>
                <td style="font-size: 0.85rem; color: #64748b;">${formatDate(user.createdAt)}</td>
                <td>
                  <div class="action-buttons-group">
                    <button class="btn-icon" onclick="AdminUsers.viewUserDetail('${user.id}')" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="AdminUsers.editUser('${user.id}')" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    ${!user.isBanned ? `
                      <button class="btn-icon btn-warning" onclick="AdminUsers.showSuspendModal('${user.id}', '${escapeHtml(user.name)}')" title="Suspend">
                        <i class="fas fa-ban"></i>
                      </button>
                    ` : ''}
                    <button class="btn-icon btn-danger" onclick="AdminUsers.showBanModal('${user.id}', '${escapeHtml(user.name)}')" title="${user.isBanned ? 'Unban' : 'Ban'}">
                      <i class="fas fa-${user.isBanned ? 'check' : 'user-slash'}"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="table-pagination">
        <div class="pagination-info">
          Showing ${users.length} of ${currentUsers.length} users
        </div>
      </div>
    `;
  }

  // Render user status badges
  function renderUserStatus(user) {
    if (user.isBanned) {
      return '<span class="status-badge status-banned"><i class="fas fa-ban"></i> Banned</span>';
    }
    if (user.isSuspended) {
      return '<span class="status-badge status-suspended"><i class="fas fa-pause-circle"></i> Suspended</span>';
    }
    if (user.isPhoneVerified) {
      return '<span class="status-badge status-verified"><i class="fas fa-check-circle"></i> Verified</span>';
    }
    return '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>';
  }

  // View user detail page
  async function viewUserDetail(userId) {
    const contentArea = document.getElementById('admin-content');
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading user details...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load user');

      const data = await res.json();
      renderUserDetailPage(data.user);
      
    } catch (error) {
      console.error('Error loading user:', error);
      contentArea.innerHTML = '<div class="error-state">Failed to load user details</div>';
    }
  }

  // Render user detail page
  function renderUserDetailPage(user) {
    const contentArea = document.getElementById('admin-content');
    
    contentArea.innerHTML = `
      <div class="module-header">
        <div>
          <button class="btn-back" onclick="AdminCore.navigate('users')">
            <i class="fas fa-arrow-left"></i> Back to Users
          </button>
          <h1 style="margin-top: 12px;">
            <i class="fas fa-user"></i> ${escapeHtml(user.name)}
          </h1>
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminUsers.editUser('${user.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          ${!user.isBanned ? `
            <button class="btn-warning" onclick="AdminUsers.showSuspendModal('${user.id}', '${escapeHtml(user.name)}')">
              <i class="fas fa-ban"></i> Suspend
            </button>
          ` : ''}
          <button class="btn-danger" onclick="AdminUsers.showBanModal('${user.id}', '${escapeHtml(user.name)}')">
            <i class="fas fa-user-slash"></i> ${user.isBanned ? 'Unban' : 'Ban'}
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- User Info Card -->
        <div class="detail-card">
          <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
          <div class="detail-row">
            <span class="detail-label">User ID:</span>
            <span class="detail-value">${user.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Full Name:</span>
            <span class="detail-value">${escapeHtml(user.name)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${user.email || 'Not provided'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${user.phone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role:</span>
            <span class="detail-value"><span class="badge badge-${user.role}">${formatRole(user.role)}</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${renderUserStatus(user)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Joined:</span>
            <span class="detail-value">${formatDate(user.createdAt)}</span>
          </div>
        </div>

        <!-- Activity Card -->
        <div class="detail-card">
          <h3><i class="fas fa-chart-line"></i> Activity Summary</h3>
          <div class="detail-row">
            <span class="detail-label">Properties Listed:</span>
            <span class="detail-value">${user.propertyCount || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Active Listings:</span>
            <span class="detail-value">${user.activeListings || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Inquiries Sent:</span>
            <span class="detail-value">${user.inquiriesSent || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reviews Given:</span>
            <span class="detail-value">${user.reviewsGiven || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reports Filed:</span>
            <span class="detail-value">${user.reportsCount || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Last Active:</span>
            <span class="detail-value">${formatDate(user.lastActive || user.createdAt)}</span>
          </div>
        </div>

        <!-- Verification Card -->
        <div class="detail-card">
          <h3><i class="fas fa-shield-check"></i> Verification Status</h3>
          <div class="detail-row">
            <span class="detail-label">Phone Verified:</span>
            <span class="detail-value">${user.isPhoneVerified ? '<span class="status-badge status-verified">✓ Yes</span>' : '<span class="status-badge status-pending">✗ No</span>'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email Verified:</span>
            <span class="detail-value">${user.isEmailVerified ? '<span class="status-badge status-verified">✓ Yes</span>' : '<span class="status-badge status-pending">✗ No</span>'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ID Verified:</span>
            <span class="detail-value">${user.isIdVerified ? '<span class="status-badge status-verified">✓ Yes</span>' : '<span class="status-badge status-pending">✗ No</span>'}</span>
          </div>
          ${user.isBanned ? `
            <div class="detail-row">
              <span class="detail-label">Ban Reason:</span>
              <span class="detail-value" style="color: #dc2626;">${user.banReason || 'No reason provided'}</span>
            </div>
          ` : ''}
          ${user.isSuspended ? `
            <div class="detail-row">
              <span class="detail-label">Suspend Reason:</span>
              <span class="detail-value" style="color: #f59e0b;">${user.suspendReason || 'No reason provided'}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- User Properties -->
      ${user.role === 'landlord' || user.role === 'agent' ? `
        <div class="detail-section">
          <h3><i class="fas fa-home"></i> Properties (${user.propertyCount || 0})</h3>
          <div id="user-properties-list">
            <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>
          </div>
        </div>
      ` : ''}

      <!-- Recent Activity -->
      <div class="detail-section">
        <h3><i class="fas fa-history"></i> Recent Activity</h3>
        <div id="user-activity-list">
          <div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>
        </div>
      </div>
    `;

    // Load user properties if applicable
    if (user.role === 'landlord' || user.role === 'agent') {
      loadUserProperties(user.id);
    }
  }

  // Load user properties
  async function loadUserProperties(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/properties?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load properties');

      const data = await res.json();
      const propertiesList = document.getElementById('user-properties-list');
      
      if (!data.properties || data.properties.length === 0) {
        propertiesList.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><p>No properties listed</p></div>';
        return;
      }

      propertiesList.innerHTML = `
        <div class="properties-grid">
          ${data.properties.map(prop => `
            <div class="property-card-mini" onclick="AdminCore.navigate('properties', '${prop.id}')">
              <div class="property-image" style="background-image: url('${prop.images?.[0] || '/icons/placeholder.png'}')"></div>
              <div class="property-info">
                <h4>${escapeHtml(prop.title)}</h4>
                <p>${prop.location}</p>
                <div class="property-meta">
                  <span class="badge badge-${prop.status}">${prop.status}</span>
                  <span style="font-weight: 700; color: #7c3aed;">KSh ${formatNumber(prop.price)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Error loading properties:', error);
      document.getElementById('user-properties-list').innerHTML = '<div class="error-state">Failed to load properties</div>';
    }
  }

  // Show suspend modal
  function showSuspendModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="fas fa-ban"></i> Suspend User</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>You are about to suspend <strong>${userName}</strong>. This will temporarily disable their account access.</p>
          
          <div class="form-group">
            <label>Reason for Suspension <span style="color: #dc2626;">*</span></label>
            <select id="suspend-reason" class="form-control">
              <option value="">Select a reason...</option>
              <option value="Suspicious Activity">Suspicious Activity</option>
              <option value="Policy Violation">Policy Violation</option>
              <option value="Spam or Abuse">Spam or Abuse</option>
              <option value="False Information">False Information</option>
              <option value="Payment Issues">Payment Issues</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="other">Other (specify below)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Additional Details</label>
            <textarea id="suspend-details" class="form-control" rows="4" placeholder="Provide additional context..."></textarea>
          </div>

          <div class="form-group">
            <label>Suspension Duration</label>
            <select id="suspend-duration" class="form-control">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30" selected>30 days</option>
              <option value="90">90 days</option>
              <option value="indefinite">Indefinite</option>
            </select>
          </div>

          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            The user will be notified via SMS and email about this suspension.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-warning" onclick="AdminUsers.confirmSuspend('${userId}')">
            <i class="fas fa-ban"></i> Suspend User
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Confirm suspend user
  async function confirmSuspend(userId) {
    const reason = document.getElementById('suspend-reason').value;
    const details = document.getElementById('suspend-details').value;
    const duration = document.getElementById('suspend-duration').value;

    if (!reason) {
      alert('Please select a reason for suspension');
      return;
    }

    const reasonText = reason === 'other' ? details : reason + (details ? ': ' + details : '');

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reasonText,
          duration: duration
        })
      });

      if (!res.ok) throw new Error('Failed to suspend user');

      document.querySelector('.modal-overlay').remove();
      showToast('User suspended successfully', 'success');
      
      // Reload users or user detail
      if (document.getElementById('users-content')) {
        await loadUsers();
      } else {
        await viewUserDetail(userId);
      }
      
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user: ' + error.message);
    }
  }

  // Show ban modal
  function showBanModal(userId, userName) {
    // Check if user is already banned
    const user = currentUsers.find(u => u.id === userId);
    if (user && user.isBanned) {
      if (confirm(`Unban ${userName}? They will regain access to their account.`)) {
        unbanUser(userId);
      }
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-danger">
        <div class="modal-header">
          <h2><i class="fas fa-user-slash"></i> Ban User</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>You are about to <strong style="color: #dc2626;">permanently ban</strong> <strong>${userName}</strong>. This action will:</p>
          <ul style="margin: 16px 0; padding-left: 24px;">
            <li>Immediately revoke all account access</li>
            <li>Hide all their listings</li>
            <li>Prevent future registrations with same phone/email</li>
            <li>Send notification to the user</li>
          </ul>
          
          <div class="form-group">
            <label>Reason for Ban <span style="color: #dc2626;">*</span></label>
            <select id="ban-reason" class="form-control">
              <option value="">Select a reason...</option>
              <option value="Fraud or Scam">Fraud or Scam</option>
              <option value="Severe Policy Violation">Severe Policy Violation</option>
              <option value="Harassment or Threats">Harassment or Threats</option>
              <option value="Illegal Activity">Illegal Activity</option>
              <option value="Repeated Violations">Repeated Violations</option>
              <option value="Identity Theft">Identity Theft</option>
              <option value="other">Other (specify below)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Additional Details <span style="color: #dc2626;">*</span></label>
            <textarea id="ban-details" class="form-control" rows="4" placeholder="Provide detailed reason for permanent ban..." required></textarea>
          </div>

          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            <strong>Warning:</strong> This is a permanent action. The user can only be unbanned by an administrator.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-danger" onclick="AdminUsers.confirmBan('${userId}')">
            <i class="fas fa-user-slash"></i> Ban User Permanently
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Confirm ban user
  async function confirmBan(userId) {
    const reason = document.getElementById('ban-reason').value;
    const details = document.getElementById('ban-details').value;

    if (!reason || !details) {
      alert('Please provide both a reason and detailed explanation for the ban');
      return;
    }

    const reasonText = reason === 'other' ? details : reason + ': ' + details;

    if (!confirm('Are you absolutely sure? This will permanently ban this user.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reasonText,
          isBanned: true
        })
      });

      if (!res.ok) throw new Error('Failed to ban user');

      document.querySelector('.modal-overlay').remove();
      showToast('User banned successfully', 'success');
      
      // Reload
      if (document.getElementById('users-content')) {
        await loadUsers();
      } else {
        AdminCore.navigate('users');
      }
      
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user: ' + error.message);
    }
  }

  // Unban user
  async function unbanUser(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isBanned: false,
          reason: 'Unbanned by administrator'
        })
      });

      if (!res.ok) throw new Error('Failed to unban user');

      showToast('User unbanned successfully', 'success');
      
      // Reload
      if (document.getElementById('users-content')) {
        await loadUsers();
      } else {
        AdminCore.navigate('users');
      }
      
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user: ' + error.message);
    }
  }

  // Search users
  function searchUsers(query) {
    if (!query.trim()) {
      renderUsersTable(currentUsers);
      return;
    }

    const filtered = currentUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.phone.includes(query) ||
      (user.email && user.email.toLowerCase().includes(query.toLowerCase())) ||
      user.id.toLowerCase().includes(query.toLowerCase())
    );

    renderUsersTable(filtered);
  }

  // Edit user (placeholder)
  function editUser(userId) {
    alert('Edit user functionality coming soon');
  }

  // Export users (placeholder)
  function exportUsers() {
    alert('Export functionality coming soon');
  }

  // Show add user modal (placeholder)
  function showAddUserModal() {
    alert('Add user functionality coming soon');
  }

  // Utility functions
  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getRoleColor(role) {
    const colors = {
      'tenant': '#3b82f6',
      'landlord': '#10b981',
      'agent': '#f59e0b',
      'admin': '#7c3aed',
      'service-provider': '#ec4899'
    };
    return colors[role] || '#64748b';
  }

  function formatRole(role) {
    return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, type = 'info') {
    // Temporary alert - will be replaced with proper toast
    alert(message);
  }

  // Public API
  return {
    init,
    loadUsers,
    searchUsers,
    viewUserDetail,
    editUser,
    showSuspendModal,
    showBanModal,
    confirmSuspend,
    confirmBan,
    exportUsers,
    showAddUserModal
  };
})();

// Expose globally
window.AdminUsers = AdminUsers;
