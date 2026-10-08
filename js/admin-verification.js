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
    // Now loads ALL pending item types from the unified endpoint
    const res = await fetch(`${API_BASE}/api/admin/pending`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
    });
    if (!res.ok) throw new Error('Failed to load pending listings');
    const data = await res.json();
    // Return combined pending items (properties + services + marketplace)
    return data.items || [];
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

  // Render pending items (all types: properties, services, marketplace)
  function renderPendingProperties(items) {
    const verificationContent = document.getElementById('verification-content');

    if (!items.length) {
      verificationContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle" style="color:#10b981;"></i>
          <p>No pending listings to verify</p>
          <small>All submissions have been processed ✅</small>
        </div>
      `;
      return;
    }

    const props = items.filter(i => i.type === 'property');
    const svcs  = items.filter(i => i.type === 'service');
    const mkts  = items.filter(i => i.type === 'marketplace');

    const typeColor = { property: '#4f46e5', service: '#059669', marketplace: '#b45309' };
    const typeIcon  = { property: 'fa-home', service: 'fa-tools', marketplace: 'fa-shopping-bag' };
    const typeLabel = { property: 'Property', service: 'Service', marketplace: 'Marketplace' };

    verificationContent.innerHTML = `
      <div class="verification-stats">
        <div class="stat-box">
          <i class="fas fa-clock"></i>
          <div><div class="stat-number">${items.length}</div><div class="stat-label">Total Pending</div></div>
        </div>
        <div class="stat-box">
          <i class="fas fa-home"></i>
          <div><div class="stat-number">${props.length}</div><div class="stat-label">Properties</div></div>
        </div>
        <div class="stat-box">
          <i class="fas fa-tools"></i>
          <div><div class="stat-number">${svcs.length}</div><div class="stat-label">Services</div></div>
        </div>
        <div class="stat-box">
          <i class="fas fa-shopping-bag"></i>
          <div><div class="stat-number">${mkts.length}</div><div class="stat-label">Marketplace</div></div>
        </div>
      </div>

      <div class="verification-grid">
        ${items.map(item => {
          const type = item.type || 'property';
          const color = typeColor[type] || '#4f46e5';
          const icon  = typeIcon[type]  || 'fa-file';
          const label = typeLabel[type] || type;
          const ownerName = item.landlordName || item.providerName || item.sellerName || 'Unknown';
          const ownerPhone = item.landlordPhone || item.providerPhone || item.sellerPhone || '-';
          const thumb = (Array.isArray(item.images) ? item.images[0] : null) || '';
          const thumbStyle = thumb ? `background-image:url('${thumb}');background-size:cover;background-position:center;` : 'background:#f1f5f9;display:flex;align-items:center;justify-content:center;';
          return `
          <div class="verification-card">
            <div class="verification-card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span style="background:${color};color:#fff;font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:20px;">
                <i class="fas ${icon}"></i> ${label}
              </span>
              <span class="verification-badge ${getDaysOld(item.created_at) > 3 ? 'urgent' : 'normal'}">
                <i class="fas fa-clock"></i> ${getDaysOld(item.created_at)}d ago
              </span>
            </div>

            <div class="verification-image" style="${thumbStyle}">
              ${!thumb ? `<i class="fas ${icon}" style="font-size:2rem;color:#94a3b8;"></i>` : ''}
            </div>

            <div class="verification-card-body">
              <h3>${escapeHtml(item.title || 'Untitled')}</h3>
              <div class="verification-detail"><i class="fas fa-user"></i> ${escapeHtml(ownerName)} &bull; ${ownerPhone}</div>
              ${item.location || item.coverageArea ? `<div class="verification-detail"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location || item.coverageArea || '')}</div>` : ''}
              ${item.price ? `<div class="verification-detail"><i class="fas fa-tag"></i> KSh ${formatNumber(item.price)}</div>` : ''}
              ${item.category ? `<div class="verification-detail"><i class="fas fa-folder"></i> ${escapeHtml(item.category)}</div>` : ''}
              ${item.serviceType ? `<div class="verification-detail"><i class="fas fa-briefcase"></i> ${escapeHtml(item.serviceType)}</div>` : ''}
              ${item.description ? `<div class="verification-description">${escapeHtml(item.description.substring(0,120))}${item.description.length>120?'...':''}</div>` : '<div class="verification-warning"><i class="fas fa-exclamation-circle"></i> No description</div>'}
            </div>

            <div class="verification-card-footer">
              <button class="btn-view" onclick="AdminVerification.viewDetails('${type}', '${item.id}')">
                <i class="fas fa-eye"></i> Review
              </button>
              <button class="btn-approve" onclick="AdminVerification.quickApprove('${type}', '${item.id}', '${escapeHtml(item.title || '')}')">
                <i class="fas fa-check"></i> Approve
              </button>
              <button class="btn-reject" onclick="AdminVerification.quickReject('${type}', '${item.id}', '${escapeHtml(item.title || '')}')">
                <i class="fas fa-times"></i> Reject
              </button>
            </div>
          </div>
        `}).join('')}
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

  // View details modal - works for all types
  function viewDetails(type, id) {
    if (type === 'property') {
      if (typeof AdminProperties !== 'undefined' && AdminProperties.viewPropertyDetail) {
        AdminProperties.viewPropertyDetail(id);
      }
      return;
    }

    // For service and marketplace: show a quick preview modal
    const allItems = [];
    document.querySelectorAll('.verification-card').forEach(card => {
      // We rely on the data embedded in the card buttons
    });

    // Fetch and show details in a modal
    const token = localStorage.getItem('keja_token');
    const url = type === 'service' ? `/api/services/${id}` : `/api/marketplace/${id}`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const item = data.service || data.item || data;
        if (!item) return;
        const existing = document.getElementById('verification-detail-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'verification-detail-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
              <h2><i class="fas ${type === 'service' ? 'fa-tools' : 'fa-shopping-bag'}"></i> ${type === 'service' ? 'Service' : 'Marketplace Item'} Review</h2>
              <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                ${[
                  ['Title', item.title || item.business_name || '-'],
                  ['Type / Category', item.service_type || item.category || '-'],
                  ['Owner', (item.provider_name || item.seller_name || '-') + ' • ' + (item.provider_phone || item.seller_phone || '-')],
                  ['Price', item.price_min != null ? `KSh ${formatNumber(item.price_min)} - ${formatNumber(item.price_max || item.price_min)}` : item.price_kes != null ? `KSh ${formatNumber(item.price_kes)}` : '-'],
                  ['Coverage / Location', item.coverage_area || item.location_suburb || '-'],
                  ['Description', item.description || '-'],
                  ['Status', item.status || '-'],
                  ['Submitted', new Date(item.created_at).toLocaleString('en-GB')]
                ].map(([label, val]) => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px;font-weight:600;color:#475569;width:35%;">${label}</td><td style="padding:8px;color:#1e293b;">${escapeHtml(String(val))}</td></tr>`).join('')}
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
              <button class="btn-danger" onclick="this.closest('.modal-overlay').remove(); AdminVerification.quickReject('${type}', '${id}', '${item.title}')">
                <i class="fas fa-times-circle"></i> Reject
              </button>
              <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); AdminVerification.quickApprove('${type}', '${id}', '${item.title}')">
                <i class="fas fa-check-circle"></i> Approve
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      })
      .catch(err => showToast('Could not load details: ' + err.message, 'error'));
  }

  // Quick approve — handles property, service, marketplace
  async function quickApprove(type, id, title) {
    if (!confirm(`Approve this ${type} listing${title ? ': "' + title + '"' : ''}?\n\nThis will publish it immediately and notify the owner.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemType: type, itemId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve');
      showToast(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} approved and is now LIVE!`, 'success');
      await loadVerificationItems();
    } catch (error) {
      console.error('Error approving:', error);
      showToast('Failed to approve: ' + error.message, 'error');
    }
  }

  // Quick reject — shows a reason modal for all types
  function quickReject(type, id, title) {
    const existing = document.getElementById('quick-reject-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'quick-reject-modal';
    modal.innerHTML = `
      <div class="modal-content modal-danger" style="max-width:480px;">
        <div class="modal-header">
          <h2><i class="fas fa-times-circle"></i> Reject Listing</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>You are rejecting: <strong>${escapeHtml(title || id)}</strong> <span style="background:#ede9fe;color:#6d28d9;font-size:0.75rem;padding:2px 8px;border-radius:12px;margin-left:6px;">${type}</span></p>

          <div class="form-group" style="margin-top:14px;">
            <label>Reason for Rejection <span style="color:#dc2626;">*</span></label>
            <select id="qr-reason" class="form-control">
              <option value="">Select a reason...</option>
              <option value="Incomplete Information">Incomplete Information</option>
              <option value="Poor Quality Images">Poor Quality Images</option>
              <option value="Misleading Description">Misleading Description</option>
              <option value="Duplicate Listing">Duplicate Listing</option>
              <option value="Incorrect Pricing">Incorrect Pricing</option>
              <option value="Suspicious Listing">Suspicious Listing</option>
              <option value="Policy Violation">Policy Violation</option>
              <option value="Location Not Verified">Location Not Verified</option>
              <option value="Not a Real Service">Not a Real Service</option>
              <option value="Item Already Sold">Item Already Sold</option>
              <option value="other">Other (specify below)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Additional Details <span style="color:#dc2626;">*</span></label>
            <textarea id="qr-details" class="form-control" rows="3" placeholder="Provide specific feedback so the poster can fix and resubmit..."></textarea>
          </div>

          <div class="alert alert-warning" style="margin-top:10px;font-size:0.85rem;">
            <i class="fas fa-info-circle"></i>
            The poster will receive an <strong>inbox notification</strong> and <strong>SMS</strong> with the rejection reason.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-danger" onclick="AdminVerification._confirmReject('${type}', '${id}')">
            <i class="fas fa-times-circle"></i> Reject Listing
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Internal confirm rejection
  async function _confirmReject(type, id) {
    const reason = document.getElementById('qr-reason')?.value || '';
    const details = document.getElementById('qr-details')?.value.trim() || '';
    if (!reason) { showToast('Please select a reason', 'error'); return; }
    if (!details) { showToast('Please provide additional details', 'error'); return; }
    const fullReason = reason === 'other' ? details : `${reason}: ${details}`;

    try {
      const res = await fetch(`${API_BASE}/api/admin/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemType: type, itemId: id, reason: fullReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject');
      document.getElementById('quick-reject-modal')?.remove();
      showToast(`❌ Listing rejected. Owner has been notified.`, 'success');
      await loadVerificationItems();
    } catch (err) {
      showToast('Failed to reject: ' + err.message, 'error');
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
    const existing = document.getElementById('verif-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'verif-toast';
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||'#3b82f6'};color:white;padding:12px 20px;border-radius:10px;font-weight:600;font-size:0.9rem;z-index:99999;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:slideIn 0.3s ease;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }

  // Public API
  return {
    init,
    loadVerificationItems,
    viewDetails,
    quickApprove,
    quickReject,
    _confirmReject,
    verifyUser
  };
})();

// Expose globally
window.AdminVerification = AdminVerification;
