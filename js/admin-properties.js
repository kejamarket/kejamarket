/**
 * KejaMarket Admin - Property Management Module
 * Complete property management with status changes, editing, and detailed views
 */

const AdminProperties = (() => {
  const API_BASE = '';
  let currentFilter = 'all';
  let currentProperties = [];
  let currentPage = 1;
  const PAGE_SIZE = 20;

  // Initialize property module
  async function init(filter = 'all') {
    currentFilter = filter;
    currentPage = 1;
    await loadProperties();
  }

  // Load properties based on filter
  async function loadProperties() {
    const propertiesContent = document.getElementById('properties-content');
    if (!propertiesContent) return;

    propertiesContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading properties...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-properties`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load properties');

      const data = await res.json();
      currentProperties = filterPropertiesByTab(data.properties || []);
      renderPropertiesTable(currentProperties);
      
    } catch (error) {
      console.error('Error loading properties:', error);
      propertiesContent.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load properties</p></div>';
    }
  }

  // Filter properties by tab
  function filterPropertiesByTab(properties) {
    switch (currentFilter) {
      case 'all':
        return properties;
      case 'verified':
        return properties.filter(p => p.status === 'verified' || p.isVerified);
      case 'pending':
        return properties.filter(p => p.status === 'pending' || (!p.isVerified && p.status !== 'rejected'));
      case 'rejected':
        return properties.filter(p => p.status === 'rejected');
      case 'available':
        return properties.filter(p => !p.isTaken && p.status !== 'taken');
      case 'taken':
        return properties.filter(p => p.isTaken || p.status === 'taken');
      case 'rental':
        return properties.filter(p => p.propertyType === 'rental' || !p.propertyType);
      case 'bnb':
        return properties.filter(p => p.propertyType === 'bnb' || p.propertyType === 'short-stay');
      default:
        return properties;
    }
  }

  // Render properties table
  function renderPropertiesTable(properties) {
    const propertiesContent = document.getElementById('properties-content');
    
    if (!properties.length) {
      propertiesContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-home"></i>
          <p>No properties found in this category</p>
        </div>
      `;
      return;
    }

    propertiesContent.innerHTML = `
      <div class="module-actions">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" id="property-search" placeholder="Search by title, location, landlord..." onkeyup="AdminProperties.searchProperties(this.value)">
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="AdminProperties.exportProperties()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Landlord</th>
              <th>Location</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(property => `
              <tr>
                <td>
                  <div class="property-info-cell" onclick="AdminProperties.viewPropertyDetail('${property.id}')" style="cursor: pointer;">
                    <div class="property-thumbnail" style="background-image: url('${property.images?.[0] || '/icons/placeholder.png'}')"></div>
                    <div>
                      <div class="property-title">${escapeHtml(property.title || 'Untitled Property')}</div>
                      <div class="property-id">#${property.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.85rem;">
                    <div style="font-weight: 600;">${escapeHtml(property.landlordName || 'Unknown')}</div>
                    <div style="color: #64748b;">${property.landlordPhone || '-'}</div>
                  </div>
                </td>
                <td>${escapeHtml(property.location || '-')}</td>
                <td><span class="badge badge-type">${formatPropertyType(property.propertyType)}</span></td>
                <td style="font-weight: 700; color: #7c3aed;">KSh ${formatNumber(property.price || 0)}</td>
                <td>${renderPropertyStatus(property)}</td>
                <td style="font-size: 0.85rem; color: #64748b;">${formatDate(property.createdAt)}</td>
                <td>
                  <div class="action-buttons-group">
                    <button class="btn-icon" style="background: #fdf2f8; color: #db2777; border-color: #fbcfe8;" onclick="AdminProperties.openSocialBlast('${property.id}')" title="Social Blast (WhatsApp, Instagram, FB, TikTok)"><i class="fas fa-bullhorn"></i></button>
                    <button class="btn-icon" onclick="AdminProperties.viewPropertyDetail('${property.id}')" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="AdminProperties.editProperty('${property.id}')" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    ${renderPropertyActions(property)}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="table-pagination">
        <div class="pagination-info">
          Showing ${properties.length} of ${currentProperties.length} properties
        </div>
      </div>
    `;
  }

  // Render property status badge
  function renderPropertyStatus(property) {
    if (property.status === 'verified' || property.isVerified) {
      return '<span class="status-badge status-verified"><i class="fas fa-check-circle"></i> Verified</span>';
    }
    if (property.status === 'pending') {
      return '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>';
    }
    if (property.status === 'rejected') {
      return '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Rejected</span>';
    }
    if (property.isTaken || property.status === 'taken') {
      return '<span class="status-badge status-taken"><i class="fas fa-lock"></i> Taken</span>';
    }
    return '<span class="status-badge status-pending">Unverified</span>';
  }

  // Render property-specific actions
  function renderPropertyActions(property) {
    const isPending = property.status === 'pending' || (!property.isVerified && property.status !== 'rejected');
    const isVerified = property.status === 'verified' || property.isVerified;
    
    let actions = '';
    
    if (isPending) {
      actions += `
        <button class="btn-icon btn-success" onclick="AdminProperties.approveProperty('${property.id}')" title="Approve">
          <i class="fas fa-check"></i>
        </button>
        <button class="btn-icon btn-danger" onclick="AdminProperties.showRejectModal('${property.id}', '${escapeHtml(property.title)}')" title="Reject">
          <i class="fas fa-times"></i>
        </button>
      `;
    }
    
    if (isVerified) {
      actions += `
        <button class="btn-icon btn-warning" onclick="AdminProperties.toggleTaken('${property.id}', ${property.isTaken})" title="${property.isTaken ? 'Mark Available' : 'Mark Taken'}">
          <i class="fas fa-${property.isTaken ? 'unlock' : 'lock'}"></i>
        </button>
      `;
    }
    
    actions += `
      <button class="btn-icon btn-danger" onclick="AdminProperties.deleteProperty('${property.id}', '${escapeHtml(property.title)}')" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    return actions;
  }

  // View property detail page
  async function viewPropertyDetail(propertyId) {
    const contentArea = document.getElementById('admin-content');
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading property details...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('keja_token')}` }
      });

      if (!res.ok) throw new Error('Failed to load property');

      const data = await res.json();
      renderPropertyDetailPage(data.property);
      
    } catch (error) {
      console.error('Error loading property:', error);
      contentArea.innerHTML = '<div class="error-state">Failed to load property details</div>';
    }
  }

  // Render property detail page
  function renderPropertyDetailPage(property) {
    const contentArea = document.getElementById('admin-content');
    
    contentArea.innerHTML = `
      <div class="module-header">
        <div>
          <button class="btn-back" onclick="AdminCore.navigate('properties')">
            <i class="fas fa-arrow-left"></i> Back to Properties
          </button>
          <h1 style="margin-top: 12px;">
            <i class="fas fa-home"></i> ${escapeHtml(property.title || 'Property Details')}
          </h1>
        </div>
        <div class="action-buttons">
          ${renderPropertyDetailActions(property)}
        </div>
      </div>

      <!-- Property Images -->
      <div class="property-images-gallery">
        ${(property.images || []).length > 0 ? `
          <div class="main-image" style="background-image: url('${property.images[0]}')"></div>
          ${property.images.length > 1 ? `
            <div class="thumbnail-grid">
              ${property.images.slice(1, 5).map(img => `
                <div class="thumbnail" style="background-image: url('${img}')"></div>
              `).join('')}
              ${property.images.length > 5 ? `<div class="thumbnail more">+${property.images.length - 5}</div>` : ''}
            </div>
          ` : ''}
        ` : `
          <div class="main-image no-image">
            <i class="fas fa-image"></i>
            <p>No images available</p>
          </div>
        `}
      </div>

      <div class="detail-grid">
        <!-- Property Info Card -->
        <div class="detail-card">
          <h3><i class="fas fa-info-circle"></i> Property Information</h3>
          <div class="detail-row">
            <span class="detail-label">Property ID:</span>
            <span class="detail-value">${property.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value">${escapeHtml(property.title || '-')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value"><span class="badge badge-type">${formatPropertyType(property.propertyType)}</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${escapeHtml(property.location || '-')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Price:</span>
            <span class="detail-value" style="color: #7c3aed; font-weight: 700;">KSh ${formatNumber(property.price || 0)}${property.propertyType === 'bnb' ? '/night' : '/month'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bedrooms:</span>
            <span class="detail-value">${property.bedrooms || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bathrooms:</span>
            <span class="detail-value">${property.bathrooms || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${renderPropertyStatus(property)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Posted:</span>
            <span class="detail-value">${formatDate(property.createdAt)}</span>
          </div>
        </div>

        <!-- Landlord Info Card -->
        <div class="detail-card">
          <h3><i class="fas fa-user"></i> Landlord Information</h3>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${escapeHtml(property.landlordName || 'Unknown')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${property.landlordPhone || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${property.landlordEmail || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">User ID:</span>
            <span class="detail-value">
              <a href="#" onclick="AdminUsers.viewUserDetail('${property.userId}'); return false;" style="color: #7c3aed;">
                ${property.userId ? property.userId.slice(0, 8) : '-'}
              </a>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Properties:</span>
            <span class="detail-value">${property.landlordPropertyCount || 1}</span>
          </div>
        </div>

        <!-- Property Stats Card -->
        <div class="detail-card">
          <h3><i class="fas fa-chart-line"></i> Statistics</h3>
          <div class="detail-row">
            <span class="detail-label">Views:</span>
            <span class="detail-value">${property.views || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Inquiries:</span>
            <span class="detail-value">${property.inquiriesCount || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Favourites:</span>
            <span class="detail-value">${property.favouritesCount || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reviews:</span>
            <span class="detail-value">${property.reviewsCount || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reports:</span>
            <span class="detail-value">${property.reportsCount || 0}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      ${property.description ? `
        <div class="detail-section">
          <h3><i class="fas fa-align-left"></i> Description</h3>
          <p style="white-space: pre-wrap; line-height: 1.6; color: #475569;">${escapeHtml(property.description)}</p>
        </div>
      ` : ''}

      <!-- Amenities -->
      ${property.amenities && property.amenities.length > 0 ? `
        <div class="detail-section">
          <h3><i class="fas fa-star"></i> Amenities</h3>
          <div class="amenities-grid">
            ${property.amenities.map(amenity => `
              <div class="amenity-badge">
                <i class="fas fa-check"></i> ${escapeHtml(amenity)}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Activity Log -->
      <div class="detail-section">
        <h3><i class="fas fa-history"></i> Activity Log</h3>
        <div id="property-activity-log">
          <div class="empty-state"><i class="fas fa-history"></i><p>No activity recorded</p></div>
        </div>
      </div>
    `;
  }

  // Render property detail action buttons
  function renderPropertyDetailActions(property) {
    const isPending = property.status === 'pending' || (!property.isVerified && property.status !== 'rejected');
    const isVerified = property.status === 'verified' || property.isVerified;
    
    let actions = `
      <button class="btn-secondary" onclick="AdminProperties.editProperty('${property.id}')">
        <i class="fas fa-edit"></i> Edit
      </button>
    `;
    
    if (isPending) {
      actions += `
        <button class="btn-primary" onclick="AdminProperties.approveProperty('${property.id}')">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn-danger" onclick="AdminProperties.showRejectModal('${property.id}', '${escapeHtml(property.title)}')">
          <i class="fas fa-times"></i> Reject
        </button>
      `;
    }
    
    if (isVerified) {
      actions += `
        <button class="btn-warning" onclick="AdminProperties.toggleTaken('${property.id}', ${property.isTaken})">
          <i class="fas fa-${property.isTaken ? 'unlock' : 'lock'}"></i> Mark ${property.isTaken ? 'Available' : 'Taken'}
        </button>
      `;
    }
    
    actions += `
      <button class="btn-danger" onclick="AdminProperties.deleteProperty('${property.id}', '${escapeHtml(property.title)}')">
        <i class="fas fa-trash"></i> Delete
      </button>
    `;
    
    return actions;
  }

  // Approve property
  async function approveProperty(propertyId) {
    if (!confirm('Approve this property listing?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propertyId })
      });

      if (!res.ok) throw new Error('Failed to approve property');

      showToast('Property approved successfully', 'success');
      
      // Reload or navigate
      if (document.getElementById('properties-content')) {
        await loadProperties();
      } else {
        await viewPropertyDetail(propertyId);
      }
      
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property: ' + error.message);
    }
  }

  // Show reject modal
  function showRejectModal(propertyId, propertyTitle) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-danger">
        <div class="modal-header">
          <h2><i class="fas fa-times-circle"></i> Reject Property</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>You are about to reject the property: <strong>${propertyTitle}</strong></p>
          
          <div class="form-group">
            <label>Reason for Rejection <span style="color: #dc2626;">*</span></label>
            <select id="reject-reason" class="form-control">
              <option value="">Select a reason...</option>
              <option value="Incomplete Information">Incomplete Information</option>
              <option value="Poor Quality Images">Poor Quality Images</option>
              <option value="Misleading Description">Misleading Description</option>
              <option value="Duplicate Listing">Duplicate Listing</option>
              <option value="Incorrect Pricing">Incorrect Pricing</option>
              <option value="Suspicious Listing">Suspicious Listing</option>
              <option value="Policy Violation">Policy Violation</option>
              <option value="Location Not Verified">Location Not Verified</option>
              <option value="other">Other (specify below)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Additional Details <span style="color: #dc2626;">*</span></label>
            <textarea id="reject-details" class="form-control" rows="4" placeholder="Provide specific feedback for the landlord..." required></textarea>
          </div>

          <div class="alert alert-warning">
            <i class="fas fa-info-circle"></i>
            The landlord will receive an SMS and email notification with the rejection reason.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-danger" onclick="AdminProperties.confirmReject('${propertyId}')">
            <i class="fas fa-times-circle"></i> Reject Property
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Confirm reject property
  async function confirmReject(propertyId) {
    const reason = document.getElementById('reject-reason').value;
    const details = document.getElementById('reject-details').value;

    if (!reason || !details) {
      alert('Please provide both a reason and detailed explanation');
      return;
    }

    const reasonText = reason === 'other' ? details : reason + ': ' + details;

    try {
      const res = await fetch(`${API_BASE}/api/admin/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId,
          reason: reasonText
        })
      });

      if (!res.ok) throw new Error('Failed to reject property');

      document.querySelector('.modal-overlay').remove();
      showToast('Property rejected', 'success');
      
      // Reload
      if (document.getElementById('properties-content')) {
        await loadProperties();
      } else {
        AdminCore.navigate('properties');
      }
      
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Failed to reject property: ' + error.message);
    }
  }

  // Toggle taken status
  async function toggleTaken(propertyId, currentlyTaken) {
    const action = currentlyTaken ? 'available' : 'taken';
    if (!confirm(`Mark this property as ${action}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}/toggle-taken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to update property status');

      showToast(`Property marked as ${action}`, 'success');
      
      // Reload
      if (document.getElementById('properties-content')) {
        await loadProperties();
      } else {
        await viewPropertyDetail(propertyId);
      }
      
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property: ' + error.message);
    }
  }

  // Delete property
  async function deleteProperty(propertyId, propertyTitle) {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keja_token')}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete property');

      showToast('Property deleted successfully', 'success');
      
      // Navigate back to list
      AdminCore.navigate('properties');
      
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property: ' + error.message);
    }
  }

  // Search properties
  function searchProperties(query) {
    if (!query.trim()) {
      renderPropertiesTable(currentProperties);
      return;
    }

    const filtered = currentProperties.filter(property => 
      (property.title && property.title.toLowerCase().includes(query.toLowerCase())) ||
      (property.location && property.location.toLowerCase().includes(query.toLowerCase())) ||
      (property.landlordName && property.landlordName.toLowerCase().includes(query.toLowerCase())) ||
      (property.landlordPhone && property.landlordPhone.includes(query)) ||
      property.id.toLowerCase().includes(query.toLowerCase())
    );

    renderPropertiesTable(filtered);
  }

  // Edit property (placeholder)
  function editProperty(propertyId) {
    alert('Edit property functionality coming soon');
  }

  // Export properties (placeholder)
  function exportProperties() {
    alert('Export functionality coming soon');
  }

  // Utility functions
  function formatPropertyType(type) {
    if (!type || type === 'rental') return 'Rental';
    if (type === 'bnb' || type === 'short-stay') return 'BNB / Short Stay';
    return type.charAt(0).toUpperCase() + type.slice(1);
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
    alert(message); // Temporary - will be replaced with proper toast
  }

  // Public API
  
  function openSocialBlast(propertyId) {
    const prop = currentProperties.find(p => p.id === propertyId);
    if (!prop) return;
    if (window.kejaSocial && typeof window.kejaSocial.openAdminBlast === 'function') {
      window.kejaSocial.openAdminBlast(prop, 'whatsapp');
    } else if (window.app && typeof window.app.openAdminSocialBlast === 'function') {
      window.app.openAdminSocialBlast(propertyId, 'whatsapp');
    }
  }

  return {
    openSocialBlast,
    init,
    loadProperties,
    searchProperties,
    viewPropertyDetail,
    editProperty,
    approveProperty,
    showRejectModal,
    confirmReject,
    toggleTaken,
    deleteProperty,
    exportProperties
  };
})();

// Expose globally
window.AdminProperties = AdminProperties;
