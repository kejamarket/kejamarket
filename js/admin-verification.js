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
                  <button class="btn-icon" onclick="AdminVerification.viewDetails('property', '${property.id}')" title="View Details & Photos">
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
                    <button class="btn-icon" onclick="AdminVerification.viewDetails('property', '${property.id}')" title="View Details & Photos">
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

  // View details modal with full photos gallery, quality checks & inline approve/reject - works for all types
  async function viewDetails(type, id) {
    const existing = document.getElementById('verification-detail-modal');
    if (existing) existing.remove();

    const token = localStorage.getItem('keja_token');
    const modal = document.createElement('div');
    modal.id = 'verification-detail-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:820px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border-radius:14px;box-shadow:0 20px 40px rgba(0,0,0,0.25);">
        <div class="modal-header" style="background:#0f172a;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;">
          <h2 style="font-size:1.15rem;font-weight:700;margin:0;display:flex;align-items:center;gap:10px;color:#fff;">
            <i class="fas ${type === 'property' ? 'fa-home' : type === 'service' ? 'fa-tools' : 'fa-shopping-bag'}" style="color:#10b981;"></i>
            Moderation Review: <span style="font-weight:400;text-transform:capitalize;">${type} #${String(id).slice(0, 8)}</span>
          </h2>
          <button class="modal-close" style="color:#94a3b8;background:transparent;border:none;font-size:1.4rem;cursor:pointer;" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" id="verif-modal-body" style="padding:22px;overflow-y:auto;flex:1;">
          <div class="loading-state" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#059669;"></i><p style="margin-top:12px;color:#64748b;">Loading full listing details &amp; photos...</p></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close when clicking backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    try {
      const url = type === 'property' 
        ? `/api/properties/${id}` 
        : type === 'service' 
          ? `/api/services/${id}` 
          : `/api/marketplace/${id}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Could not fetch details (${res.status} ${res.statusText})`);
      const data = await res.json();
      const item = data.property || data.service || data.item || data;
      if (!item) throw new Error('Listing data not found');

      // Normalize images
      let images = [];
      if (Array.isArray(item.images)) {
        images = item.images;
      } else if (typeof item.images === 'string') {
        try { images = JSON.parse(item.images); } catch (_) { images = [item.images]; }
      } else if (Array.isArray(item.media)) {
        images = item.media;
      } else if (typeof item.image_url === 'string') {
        images = [item.image_url];
      } else if (typeof item.image === 'string') {
        images = [item.image];
      }
      images = (Array.isArray(images) ? images : []).filter(img => typeof img === 'string' && img.trim().length > 0);

      // Normalization of fields
      const title = item.title || item.business_name || 'Untitled Listing';
      const ownerName = item.landlordName || item.landlord?.name || item.provider_name || item.providerName || item.seller_name || item.sellerName || 'Unknown Owner';
      const ownerPhone = item.landlordPhone || item.landlord?.phone || item.provider_phone || item.providerPhone || item.seller_phone || item.sellerPhone || 'Not provided';
      const ownerEmail = item.landlordEmail || item.landlord?.email || item.provider_email || item.seller_email || '';
      const location = [item.estate, item.area, item.county, item.coverage_area, item.coverageArea, item.location_suburb, item.location_corridor, item.location].filter(Boolean).join(', ') || item.address || 'Location not specified';
      
      let priceDisplay = 'Not specified';
      let rawPrice = 0;
      if (item.price != null) {
        rawPrice = Number(item.price);
        priceDisplay = `KSh ${formatNumber(rawPrice)} / month`;
      } else if (item.rent_kes != null || item.rentKes != null) {
        rawPrice = Number(item.rent_kes || item.rentKes);
        priceDisplay = `KSh ${formatNumber(rawPrice)} / month`;
      } else if (item.price_min != null) {
        priceDisplay = `KSh ${formatNumber(item.price_min)}${item.price_max ? ' - ' + formatNumber(item.price_max) : ''}`;
      } else if (item.price_kes != null) {
        priceDisplay = `KSh ${formatNumber(item.price_kes)}`;
      }

      const description = item.description || '';
      const status = item.status || (item.is_verified ? 'approved' : 'pending');
      const category = item.propertyType || item.property_type || item.service_type || item.serviceType || item.category || '-';
      const createdAt = item.created_at || item.createdAt || null;

      // Quality check flags
      const flags = [];
      if (images.length === 0) flags.push({ type: 'danger', text: 'No Photos Uploaded' });
      if (rawPrice > 0 && rawPrice < 2500) flags.push({ type: 'warning', text: 'Suspiciously Low Price (< KSh 2,500)' });
      if (!description || description.length < 25) flags.push({ type: 'warning', text: 'Short / Incomplete Description' });
      if (!ownerPhone || ownerPhone === 'Not provided') flags.push({ type: 'danger', text: 'Missing Phone Number' });

      const bodyEl = document.getElementById('verif-modal-body');
      if (!bodyEl) return;

      bodyEl.innerHTML = `
        <!-- Quality Alerts -->
        ${flags.length > 0 ? `
          <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px;">
            ${flags.map(f => `
              <span style="background:${f.type === 'danger' ? '#fef2f2' : '#fffbeb'};color:${f.type === 'danger' ? '#991b1b' : '#92400e'};border:1px solid ${f.type === 'danger' ? '#fecaca' : '#fde68a'};padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
                <i class="fas fa-exclamation-triangle"></i> ${f.text}
              </span>
            `).join('')}
          </div>
        ` : `
          <div style="margin-bottom:16px;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:6px 12px;border-radius:8px;font-size:0.8rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
            <i class="fas fa-check-circle"></i> Basic Quality Checks Passed
          </div>
        `}

        <!-- Media Gallery Section -->
        <div style="margin-bottom:20px;background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="color:#0f172a;font-size:0.92rem;"><i class="fas fa-images" style="color:#059669;"></i> Photos Gallery</strong>
            <span style="font-size:0.8rem;font-weight:700;color:${images.length ? '#059669' : '#dc2626'};background:${images.length ? '#ecfdf5' : '#fee2e2'};padding:2px 8px;border-radius:10px;">
              ${images.length} ${images.length === 1 ? 'Photo' : 'Photos'}
            </span>
          </div>
          ${images.length > 0 ? `
            <div style="text-align:center;background:#000;border-radius:10px;overflow:hidden;">
              <img id="verif-preview-main-img" src="${escapeHtml(images[0])}" alt="Listing photo preview" style="max-height:360px;width:100%;object-fit:contain;display:block;margin:0 auto;" onerror="this.onerror=null;this.src='/icons/placeholder.png';">
            </div>
            ${images.length > 1 ? `
              <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:6px;">
                ${images.map((img, idx) => `
                  <img src="${escapeHtml(img)}" 
                       alt="Thumbnail ${idx+1}" 
                       style="width:72px;height:54px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${idx===0?'#059669':'#cbd5e1'};opacity:${idx===0?'1':'0.75'};transition:all 0.2s;flex-shrink:0;" 
                       onclick="document.getElementById('verif-preview-main-img').src='${escapeHtml(img)}';this.parentElement.querySelectorAll('img').forEach(el=>{el.style.borderColor='#cbd5e1';el.style.opacity='0.75'});this.style.borderColor='#059669';this.style.opacity='1';"
                       onerror="this.onerror=null;this.src='/icons/placeholder.png';" />
                `).join('')}
              </div>
            ` : ''}
          ` : `
            <div style="background:#fff1f2;border:1px dashed #f43f5e;border-radius:10px;padding:24px;text-align:center;color:#9f1239;">
              <i class="fas fa-image" style="font-size:2.2rem;margin-bottom:8px;color:#e11d48;display:block;"></i>
              <strong style="font-size:0.95rem;">No Photos Uploaded</strong>
              <p style="margin:4px 0 0 0;font-size:0.83rem;color:#be123c;">The user did not provide any images with this submission.</p>
            </div>
          `}
        </div>

        <!-- Listing Core Details Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:18px;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-size:0.75rem;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:6px;">Listing Information</div>
            <div style="font-size:1.05rem;font-weight:800;color:#0f172a;margin-bottom:6px;">${escapeHtml(title)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.88rem;color:#475569;">
              <i class="fas fa-tag" style="color:#059669;width:16px;"></i> <strong style="color:#059669;font-size:1rem;">${priceDisplay}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.88rem;color:#475569;">
              <i class="fas fa-layer-group" style="color:#64748b;width:16px;"></i> Type: <span style="font-weight:600;">${escapeHtml(String(category))}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.88rem;color:#475569;">
              <i class="fas fa-map-marker-alt" style="color:#ef4444;width:16px;"></i> <span>${escapeHtml(location)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:#64748b;">
              <i class="fas fa-calendar" style="color:#64748b;width:16px;"></i> Submitted: ${createdAt ? new Date(createdAt).toLocaleString('en-KE', { dateStyle:'medium', timeStyle:'short' }) : 'Unknown date'}
            </div>
          </div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-size:0.75rem;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:6px;">Owner &amp; Contact Details</div>
            <div style="font-size:1.05rem;font-weight:800;color:#0f172a;margin-bottom:6px;">${escapeHtml(ownerName)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.88rem;color:#475569;">
              <i class="fas fa-phone-alt" style="color:#059669;width:16px;"></i>
              ${ownerPhone && ownerPhone !== 'Not provided' ? `<a href="tel:${escapeHtml(ownerPhone)}" style="color:#059669;font-weight:700;text-decoration:none;">${escapeHtml(ownerPhone)}</a>` : '<span style="color:#ef4444;">No Phone Provided</span>'}
            </div>
            ${ownerEmail ? `
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.88rem;color:#475569;">
                <i class="fas fa-envelope" style="color:#64748b;width:16px;"></i> <a href="mailto:${escapeHtml(ownerEmail)}" style="color:#3b82f6;text-decoration:none;">${escapeHtml(ownerEmail)}</a>
              </div>
            ` : ''}
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:0.85rem;color:#64748b;">
              <i class="fas fa-info-circle" style="color:#64748b;width:16px;"></i> Current Status: <span style="font-weight:700;text-transform:uppercase;color:${status === 'approved' ? '#059669' : status === 'rejected' ? '#dc2626' : '#d97706'}">${escapeHtml(status)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:#64748b;">
              <i class="fas fa-id-badge" style="color:#64748b;width:16px;"></i> ID: <code>${escapeHtml(String(id))}</code>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:18px;">
          <div style="font-size:0.75rem;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:8px;">Description</div>
          <div style="font-size:0.92rem;color:#334155;line-height:1.6;white-space:pre-wrap;">${escapeHtml(description || 'No description provided by poster.')}</div>
        </div>

        <!-- Amenities / Extra Specs if available -->
        ${Array.isArray(item.amenities) && item.amenities.length > 0 ? `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:18px;">
            <div style="font-size:0.75rem;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:8px;">Amenities &amp; Features</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${item.amenities.map(a => `
                <span style="background:#f1f5f9;color:#334155;padding:4px 10px;border-radius:6px;font-size:0.82rem;font-weight:600;"><i class="fas fa-check" style="color:#059669;margin-right:4px;"></i>${escapeHtml(String(a))}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Inline Actions Footer -->
        <div class="modal-footer" style="padding:14px 0 0 0;margin-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="padding:9px 18px;border-radius:8px;font-weight:700;">
            Close Preview
          </button>
          <button class="btn-danger" style="background:#dc2626;color:white;border:none;padding:9px 18px;border-radius:8px;font-weight:700;cursor:pointer;" onclick="this.closest('.modal-overlay').remove(); AdminVerification.quickReject('${type}', '${id}', '${escapeHtml(title).replace(/'/g, "\\'")}')">
            <i class="fas fa-times-circle"></i> Reject Listing
          </button>
          <button class="btn-primary" style="background:#059669;color:white;border:none;padding:9px 20px;border-radius:8px;font-weight:700;cursor:pointer;" onclick="this.closest('.modal-overlay').remove(); AdminVerification.quickApprove('${type}', '${id}', '${escapeHtml(title).replace(/'/g, "\\'")}')">
            <i class="fas fa-check-circle"></i> Approve &amp; Publish
          </button>
        </div>
      `;
    } catch (err) {
      console.error('Error in viewDetails:', err);
      const bodyEl = document.getElementById('verif-modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="error-state" style="padding:30px;text-align:center;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;color:#ef4444;margin-bottom:10px;"></i>
            <p style="color:#b91c1c;font-weight:700;">Could not load listing details</p>
            <p style="color:#64748b;font-size:0.88rem;">${escapeHtml(err.message)}</p>
            <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="margin-top:14px;">Close</button>
          </div>
        `;
      }
    }
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
