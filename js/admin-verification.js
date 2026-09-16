/**
 * KejaMarket Admin - Verification Centre Module
 * Centralized verification management for properties, users, and documents
 */

const AdminVerification = (() => {
  const API_BASE = '';
  let currentTab = 'pending-properties';
  let currentItems = [];

  // Initialize verification module
  async function init(tab = 'pending-properties') {
    currentTab = tab;
    await loadVerificationItems();
  }

  // Load verification items based on tab
  async function loadVerificationItems() {
    const verificationContent = document.getElementById('verification-content');
    if (!verificationContent) return;

    verificationContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading verification queue...</div>';

    try {
      let data;
      
      switch (currentTab) {
        case 'pending-properties':
          data = await loadPendingProperties();
          renderPendingProperties(data);
          break;
        case 'pending-users':
          data = await loadPendingUsers();
          renderPendingUsers(data);
          break;
        case 'documents':
          data = await loadPendingDocuments();
          renderPendingDocuments(data);
          break;
        case 'recently-approved':
          data = await loadRecentlyApproved();
          renderRecentlyApproved(data);
          break;
        case 'recently-rejected':
          data = await loadRecentlyRejected();
          renderRecentlyRejected(data);
          break;
        default:
          verificationContent.innerHTML = '<div class="empty-state">Invalid tab</div>';
      }
      
    } catch (error) {
      console.error('Error loading verification items:', error);
      verificationContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load verification items</p></div>';
    }
  }

  // Load pending properties
  async function loadPendingProperties() {
    const res = await fetch(`${API_BASE}/api/admin/pending-listings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    });

    if (!res.ok) throw new Error('Failed to load pending properties');
    const data = await res.json();
    return data.properties || [];
  }

  // Load pending users
  async function loadPendingUsers() {
    const res = await fetch(`${API_BASE}/api/admin/users?filter=pending`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    });

    if (!res.ok) throw new Error('Failed to load pending users');
    const data = await res.json();
    return data.users || [];
  }

  // Load pending documents
  async function loadPendingDocuments() {
    // Placeholder - will be implemented when document verification is added
    return [];
  }

  // Load recently approved
  async function loadRecentlyApproved() {
    const res = await fetch(`${API_BASE}/api/admin/all-properties`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    });

    if (!res.ok) throw new Error('Failed to load properties');
    const data = await res.json();
    
    // Filter recently verified (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return (data.properties || [])
      .filter(p => (p.status === 'verified' || p.isVerified) && new Date(p.verifiedAt || p.updatedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.verifiedAt || b.updatedAt) - new Date(a.verifiedAt || a.updatedAt));
  }

  // Load recently rejected
  async function loadRecentlyRejected() {
    const res = await fetch(`${API_BASE}/api/admin/all-properties`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    });

    if (!res.ok) throw new Error('Failed to load properties');
    const data = await res.json();
    
    // Filter recently rejected (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return (data.properties || [])
      .filter(p => p.status === 'rejected' && new Date(p.rejectedAt || p.updatedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.rejectedAt || b.updatedAt) - new Date(a.rejectedAt || a.updatedAt));
  }

  // Render pending properties
  function renderPendingProperties(properties) {
    const verificationContent = document.getElementById('verification-content');
    
    if (!properties.length) {
      verificationContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>No pending properties to verify</p>
          <small>All listings have been processed</small>
        </div>
      `;
      return;
    }

    verificationContent.innerHTML = `
      <div class="verification-stats">
        <div class="stat-box">
          <i class="fas fa-clock"></i>
          <div>
            <div class="stat-number">${properties.length}</div>
            <div class="stat-label">Pending Verification</div>
          </div>
        </div>
        <div class="stat-box">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <div class="stat-number">${properties.filter(p => getDaysOld(p.createdAt) > 3).length}</div>
            <div class="stat-label">Older than 3 days</div>
          </div>
        </div>
      </div>

      <div class="verification-grid">
        ${properties.map(property => `
          <div class="verification-card">
            <div class="verification-card-header">
              <span class="verification-badge ${getDaysOld(property.createdAt) > 3 ? 'urgent' : 'normal'}">
                <i class="fas fa-clock"></i> ${getDaysOld(property.createdAt)} days ago
              </span>
            </div>
            
            <div class="verification-image" style="background-image: url('${property.images?.[0] || '/icons/placeholder.png'}')">
              ${!property.images?.length ? '<div class="no-image-badge"><i class="fas fa-image"></i> No Images</div>' : ''}
            </div>
            
            <div class="verification-card-body">
              <h3>${escapeHtml(property.title || 'Untitled Property')}</h3>
              <div class="verification-detail">
                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(property.location || 'No location')}
              </div>
              <div class="verification-detail">
                <i class="fas fa-money-bill-wave"></i> KSh ${formatNumber(property.price || 0)}
              </div>
              <div class="verification-detail">
                <i class="fas fa-user"></i> ${escapeHtml(property.landlordName || 'Unknown')} - ${property.landlordPhone || '-'}
              </div>
              ${property.description ? `
                <div class="verification-description">
                  ${escapeHtml(property.description.substring(0, 150))}${property.description.length > 150 ? '...' : ''}
                </div>
              ` : '<div class="verification-warning"><i class="fas fa-exclamation-circle"></i> No description provided</div>'}
            </div>
            
            <div class="verification-card-footer">
              <button class="btn-view" onclick="AdminVerification.viewDetails('property', '${property.id}')">
                <i class="fas fa-eye"></i> Review
              </button>
              <button class="btn-approve" onclick="AdminVerification.quickApprove('property', '${property.id}')">
                <i class="fas fa-check"></i> Approve
              </button>
              <button class="btn-reject" onclick="AdminVerification.quickReject('property', '${property.id}', '${escapeHtml(property.title)}')">
                <i class="fas fa-times"></i> Reject
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render pending users
  function renderPendingUsers(users) {
    const verificationContent = document.getElementById('verification-content');
    
    if (!users.length) {
      verificationContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-check"></i>
          <p>No pending user verifications</p>
          <small>All users have been verified</small>
        </div>
      `;
      return;
    }

    verificationContent.innerHTML = `
      <div class="verification-stats">
        <div class="stat-box">
          <i class="fas fa-user-clock"></i>
          <div>
            <div class="stat-number">${users.length}</div>
            <div class="stat-label">Unverified Users</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Properties</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>
                  <div class="user-info">
                    <div class="user-avatar" style="background: ${getRoleColor(user.role)}">${getInitials(user.name)}</div>
                    <div>
                      <div class="user-name">${escapeHtml(user.name)}</div>
                      <div class="user-id">#${user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>${user.phone}</td>
                <td><span class="badge badge-${user.role}">${formatRole(user.role)}</span></td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.propertyCount || 0}</td>
                <td>
                  <div class="action-buttons-group">
                    <button class="btn-icon" onclick="AdminUsers.viewUserDetail('${user.id}')" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-success" onclick="AdminVerification.verifyUser('${user.id}')" title="Verify">
                      <i class="fas fa-check"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Render pending documents
  function renderPendingDocuments(documents) {
    const verificationContent = document.getElementById('verification-content');
    
    verificationContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <p>Document verification coming soon</p>
        <small>This feature will allow verification of ID documents, business licenses, etc.</small>
      </div>
    `;
  }

  // Render recently approved
  function renderRecentlyApproved(items) {
    const verificationContent = document.getElementById('verification-content');
    
    if (!items.length) {
      verificationContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>No recently approved items</p>
        </div>
      `;
      return;
    }

    verificationContent.innerHTML = `
      <div class="verification-stats">
        <div class="stat-box stat-success">
          <i class="fas fa-check-circle"></i>
          <div>
            <div class="stat-number">${items.length}</div>
            <div class="stat-label">Approved (Last 7 days)</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Landlord</th>
              <th>Location</th>
              <th>Price</th>
              <th>Approved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(property => `
              <tr>
                <td>
                  <div class="property-info-cell">
                    <div class="property-thumbnail" style="background-image: url('${property.images?.[0] || '/icons/placeholder.png'}')"></div>
                    <div>
                      <div class="property-title">${escapeHtml(property.title || 'Untitled')}</div>
                      <div class="property-id">#${property.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>${escapeHtml(property.landlordName || 'Unknown')}</td>
                <td>${escapeHtml(property.location || '-')}</td>
                <td style="font-weight: 700; color: #7c3aed;">KSh ${formatNumber(property.price || 0)}</td>
                <td>${formatDate(property.verifiedAt || property.updatedAt)}</td>
                <td>
                  <button class="btn-icon" onclick="AdminProperties.viewPropertyDetail('${property.id}')" title="View">
                    <i class="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Render recently rejected
  function renderRecentlyRejected(items) {
    const verificationContent = document.getElementById('verification-content');
    
    if (!items.length) {
      verificationContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-times-circle"></i>
          <p>No recently rejected items</p>
        </div>
      `;
      return;
    }

    verificationContent.innerHTML = `
      <div class="verification-stats">
        <div class="stat-box stat-danger">
          <i class="fas fa-times-circle"></i>
          <div>
            <div class="stat-number">${items.length}</div>
            <div class="stat-label">Rejected (Last 7 days)</div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Landlord</th>
              <th>Reason</th>
              <th>Rejected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(property => `
              <tr>
                <td>
                  <div class="property-info-cell">
                    <div class="property-thumbnail" style="background-image: url('${property.images?.[0] || '/icons/placeholder.png'}')"></div>
                    <div>
                      <div class="property-title">${escapeHtml(property.title || 'Untitled')}</div>
                      <div class="property-id">#${property.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>${escapeHtml(property.landlordName || 'Unknown')}</td>
                <td style="color: #dc2626; font-size: 0.85rem;">${property.rejectionReason || 'No reason provided'}</td>
                <td>${formatDate(property.rejectedAt || property.updatedAt)}</td>
                <td>
                  <div class="action-buttons-group">
                    <button class="btn-icon" onclick="AdminProperties.viewPropertyDetail('${property.id}')" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-success" onclick="AdminVerification.quickApprove('property', '${property.id}')" title="Approve Now">
                      <i class="fas fa-check"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // View details (redirect to appropriate detail page)
  function viewDetails(type, id) {
    if (type === 'property') {
      AdminProperties.viewPropertyDetail(id);
    } else if (type === 'user') {
      AdminUsers.viewUserDetail(id);
    }
  }

  // Quick approve
  async function quickApprove(type, id) {
    if (!confirm('Approve this item?')) return;

    try {
      if (type === 'property') {
        const res = await fetch(`${API_BASE}/api/admin/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ propertyId: id })
        });

        if (!res.ok) throw new Error('Failed to approve');
        
        showToast('Property approved successfully', 'success');
        await loadVerificationItems();
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve: ' + error.message);
    }
  }

  // Quick reject
  function quickReject(type, id, title) {
    if (type === 'property') {
      AdminProperties.showRejectModal(id, title);
    }
  }

  // Verify user
  async function verifyUser(userId) {
    if (!confirm('Mark this user as verified?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle-verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to verify user');
      
      showToast('User verified successfully', 'success');
      await loadVerificationItems();
      
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user: ' + error.message);
    }
  }

  // Utility functions
  function getDaysOld(dateString) {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

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
    alert(message); // Temporary
  }

  // Public API
  return {
    init,
    loadVerificationItems,
    viewDetails,
    quickApprove,
    quickReject,
    verifyUser
  };
})();

// Expose globally
window.AdminVerification = AdminVerification;
