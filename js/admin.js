/**
 * KejaMarket - Administrator Control Center
 * Auto-opens on admin login. Never shows buttons to non-admins.
 * Tabs: Overview | Users | Listings | Messages | Settings
 */

class AdminPortalEngine {
  constructor() {
    this.activeTab = 'overview';
    this.users = [];
    this.stats = null;
    this.pendingListings = [];
    this.allListings = [];
    this.messages = [];
  }

  init() {
    this.checkAdminSession();
    // Auto-open if already logged in as admin
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (session && (session.role === 'admin' || session.isAdmin || session.id === 'usr-admin-01')) {
      setTimeout(() => this.openAdminModal(), 1000);
    }
  }

  checkAdminSession() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const isAdmin = this._isAdmin(session);
    const adminHeaderBtn = document.getElementById('btn-admin-header');
    const adminLinks = document.getElementById('auth-admin-links');
    const roleBadge = document.getElementById('auth-user-role-badge');

    if (adminHeaderBtn) adminHeaderBtn.style.display = 'none'; // always hidden
    if (adminLinks) adminLinks.style.display = isAdmin ? 'block' : 'none';
    if (roleBadge && isAdmin) {
      roleBadge.textContent = '👑 Administrator';
      roleBadge.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
      roleBadge.style.color = '#fff';
    }
    return isAdmin;
  }

  _isAdmin(session) {
    return Boolean(session && (
      session.id === 'usr-admin-01' ||
      session.role === 'admin' ||
      session.isAdmin === true ||
      (session.email && session.email.toLowerCase() === 'admin@kejamarket.co.ke')
    ));
  }

  async openAdminModal() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!session) {
      if (window.kejaAuth) window.kejaAuth.openAuthModal();
      return;
    }
    if (!this._isAdmin(session)) {
      if (window.app) window.app.showToast('🚫 Admin access only.', 'error');
      return;
    }
    if (window.app) window.app.openModal('modal-admin-portal');
    this.switchTab('overview');
    await this.refreshAllData();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabs = ['overview', 'users', 'listings', 'messages', 'system'];
    tabs.forEach(t => {
      const btn = document.getElementById(`admin-tab-btn-${t}`);
      const pane = document.getElementById(`admin-tab-pane-${t}`);
      if (btn) {
        btn.style.background = t === tabName ? '#7c3aed' : 'transparent';
        btn.style.color = t === tabName ? '#fff' : '#475569';
      }
      if (pane) pane.style.display = t === tabName ? 'block' : 'none';
    });

    if (tabName === 'overview') this.renderStats();
    if (tabName === 'users') this.renderUsers();
    if (tabName === 'listings') this.renderListings();
    if (tabName === 'messages') this.renderMessages();
    if (tabName === 'system') this.loadMpesaConfig();
  }

  async refreshAllData() {
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    const h = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const [statsRes, usersRes, pendingRes, listingsRes, msgsRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: h }),
        fetch('/api/admin/users', { headers: h }),
        fetch('/api/admin/pending-listings', { headers: h }),
        fetch('/api/properties', { headers: h }),
        fetch('/api/messages', { headers: h })
      ]);

      if (statsRes.ok) { this.stats = await statsRes.json(); }
      if (usersRes.ok) { const d = await usersRes.json(); this.users = d.users || []; }
      if (pendingRes.ok) { const d = await pendingRes.json(); this.pendingListings = d.listings || []; }
      if (listingsRes.ok) { const d = await listingsRes.json(); this.allListings = d.properties || []; }
      if (msgsRes.ok) { const d = await msgsRes.json(); this.messages = d.messages || []; }

      // Update pending badge
      const badge = document.getElementById('admin-pending-count');
      if (badge) {
        badge.textContent = this.pendingListings.length;
        badge.style.display = this.pendingListings.length > 0 ? 'inline-block' : 'none';
      }

      // Refresh current tab
      if (this.activeTab === 'overview') this.renderStats();
      if (this.activeTab === 'users') this.renderUsers();
      if (this.activeTab === 'listings') this.renderListings();
      if (this.activeTab === 'messages') this.renderMessages();
    } catch (err) {
      console.warn('Admin data fetch error:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OVERVIEW
  // ═══════════════════════════════════════════════════════════

  renderStats() {
    const s = this.stats || {};
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

    set('admin-stat-total-users', s.totalUsers);
    set('admin-stat-landlords', s.landlords);
    set('admin-stat-tenants', s.tenants);
    set('admin-stat-total-props', s.totalProperties);
    set('admin-stat-pending', this.pendingListings.length);
    set('admin-stat-transactions', s.totalTransactions);

    this._renderAnalytics();
  }

  _renderAnalytics() {
    const container = document.getElementById('admin-analytics-container');
    if (!container) return;

    const users = this.users || [];
    const props = this.allListings || [];
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const newUsers = users.filter(u => u.createdAt && new Date(u.createdAt) >= weekAgo).length;
    const newListings = props.filter(p => p.createdAt && new Date(p.createdAt) >= weekAgo).length;
    const avgRent = props.length > 0 ? Math.round(props.reduce((s, p) => s + (p.rentKes || p.rent || 0), 0) / props.length) : 0;

    const suburbMap = {};
    props.forEach(p => { const k = p.estateSuburb || 'Other'; suburbMap[k] = (suburbMap[k] || 0) + 1; });
    const topSuburbs = Object.entries(suburbMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:16px;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:18px;color:white;">
          <div style="font-weight:700;margin-bottom:8px;"><i class="fas fa-chart-line"></i> Growth This Week</div>
          <div style="font-size:2rem;font-weight:800;">+${newUsers + newListings}</div>
          <div style="font-size:0.85rem;opacity:0.9;">${newUsers} new users · ${newListings} new listings</div>
        </div>
        <div style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:12px;padding:18px;color:white;">
          <div style="font-weight:700;margin-bottom:8px;"><i class="fas fa-coins"></i> Average Rent</div>
          <div style="font-size:2rem;font-weight:800;">KSh ${avgRent.toLocaleString()}</div>
          <div style="font-size:0.85rem;opacity:0.9;">Across ${props.length} listings</div>
        </div>
        <div style="background:linear-gradient(135deg,#4facfe,#00f2fe);border-radius:12px;padding:18px;color:white;">
          <div style="font-weight:700;margin-bottom:8px;"><i class="fas fa-map-marked-alt"></i> Top Suburbs</div>
          ${topSuburbs.map((s,i) => `<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;"><span>${i+1}. ${s[0]}</span><strong>${s[1]}</strong></div>`).join('')}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════

  renderUsers() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;

    if (!this.users.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">No users yet</div>`;
      return;
    }

    const groups = {
      admin: { label: '👑 Admins', color: '#fef3c7', border: '#f59e0b', users: [] },
      landlord: { label: '🏢 Landlords & Agencies', color: '#e0e7ff', border: '#6366f1', users: [] },
      service: { label: '🔧 Service Providers', color: '#cffafe', border: '#06b6d4', users: [] },
      tenant: { label: '🏠 Tenants', color: '#d1fae5', border: '#10b981', users: [] }
    };

    this.users.forEach(u => {
      const role = u.isAdmin || u.id === 'usr-admin-01' || u.role === 'admin' ? 'admin'
        : (u.role === 'landlord' || u.role === 'agency') ? 'landlord'
        : u.role === 'service' ? 'service' : 'tenant';
      groups[role].users.push(u);
    });

    container.innerHTML = Object.values(groups).filter(g => g.users.length > 0).map(g => `
      <div style="background:${g.color};border:2px solid ${g.border};border-radius:12px;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 12px;font-size:0.95rem;font-weight:700;">${g.label} (${g.users.length})</h4>
        <div style="display:grid;gap:10px;">
          ${g.users.map(u => this._userCard(u)).join('')}
        </div>
      </div>
    `).join('');
  }

  _userCard(u) {
    const isSystemAdmin = u.id === 'usr-admin-01' || u.role === 'admin' || u.isAdmin;
    return `
      <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="font-weight:700;color:#1e293b;">
            ${u.name || 'Unknown'}
            ${u.isVerified ? '<span style="background:#dcfce7;color:#166534;font-size:0.7rem;padding:1px 6px;border-radius:4px;margin-left:4px;">✓ Verified</span>' : ''}
            ${u.isBanned ? '<span style="background:#fecaca;color:#991b1b;font-size:0.7rem;padding:1px 6px;border-radius:4px;margin-left:4px;">🚫 Banned</span>' : ''}
          </div>
          <div style="font-size:0.8rem;color:#64748b;margin-top:2px;">📞 ${u.phone || '—'} · 📧 ${u.email || '—'}</div>
          <div style="font-size:0.75rem;color:#94a3b8;">Joined: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="kejaAdmin.contactUser('${u.id}')" style="background:#4f46e5;color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;">
            💬 Message
          </button>
          ${!isSystemAdmin ? `
            <button onclick="kejaAdmin.toggleUserVerification('${u.id}')" style="background:${u.isVerified ? '#f59e0b' : '#10b981'};color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;">
              ${u.isVerified ? 'Unverify' : 'Verify'}
            </button>
            <button onclick="kejaAdmin.toggleUserBan('${u.id}')" style="background:${u.isBanned ? '#10b981' : '#ef4444'};color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;">
              ${u.isBanned ? 'Unban' : 'Ban'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // LISTINGS
  // ═══════════════════════════════════════════════════════════

  renderListings() {
    const container = document.getElementById('admin-listings-container');
    if (!container) return;

    const pending = this.pendingListings || [];
    const live = (this.allListings || []).filter(p =>
      p.status === 'approved' || p.isApproved || p.status === 'active'
    );

    let html = '';

    if (pending.length > 0) {
      html += `
        <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:16px;margin-bottom:16px;">
          <h4 style="margin:0 0 12px;color:#92400e;font-weight:700;">⏳ Pending Approval (${pending.length})</h4>
          <div style="display:grid;gap:10px;">
            ${pending.map(p => this._listingCard(p, true)).join('')}
          </div>
        </div>
      `;
    }

    if (live.length > 0) {
      html += `
        <div style="background:#d1fae5;border:2px solid #10b981;border-radius:12px;padding:16px;">
          <h4 style="margin:0 0 12px;color:#065f46;font-weight:700;">✅ Live Listings (${live.length})</h4>
          <div style="display:grid;gap:10px;">
            ${live.map(p => this._listingCard(p, false)).join('')}
          </div>
        </div>
      `;
    }

    if (!html) {
      html = `<div style="text-align:center;padding:40px;color:#64748b;">No listings found</div>`;
    }

    container.innerHTML = html;
  }

  _listingCard(p, isPending) {
    return `
      <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="font-weight:700;color:#1e293b;">${p.title || 'Untitled'}</div>
          <div style="font-size:0.8rem;color:#64748b;margin-top:2px;">
            📍 ${p.estateSuburb || '—'} · 💰 KSh ${Number(p.rentKes || p.rent || 0).toLocaleString()}/mo
          </div>
          <div style="font-size:0.75rem;color:#94a3b8;">
            ${p.category || '—'} · Posted: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${isPending ? `
            <button onclick="kejaAdmin.approveListing('${p.id}')" style="background:#10b981;color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">✅ Approve</button>
            <button onclick="kejaAdmin.rejectListing('${p.id}')" style="background:#ef4444;color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">❌ Reject</button>
          ` : `
            <button onclick="kejaAdmin.deleteListing('${p.id}')" style="background:#ef4444;color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;">🗑 Delete</button>
          `}
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════

  renderMessages() {
    const container = document.getElementById('admin-messages-container');
    if (!container) return;

    if (!this.messages.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;">No messages yet</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:grid;gap:10px;">
        ${this.messages.map(m => `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
              <div style="font-weight:700;color:#1e293b;">${m.senderName || m.sender_name || 'Unknown'}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">${m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</div>
            </div>
            <div style="font-size:0.85rem;color:#475569;margin-bottom:8px;">${m.text || ''}</div>
            ${m.propertyTitle || m.property_title ? `<div style="font-size:0.75rem;color:#64748b;">Property: ${m.propertyTitle || m.property_title}</div>` : ''}
            <div style="margin-top:8px;">
              <button onclick="kejaAdmin.contactUser('${m.senderId || m.sender_id || ''}')" style="background:#4f46e5;color:white;border:none;padding:5px 12px;border-radius:6px;font-size:0.75rem;cursor:pointer;">💬 Reply</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // USER ACTIONS
  // ═══════════════════════════════════════════════════════════

  contactUser(userId) {
    const u = this.users.find(u => u.id === userId) || { id: userId, name: 'User', phone: '', email: '' };
    const html = `
      <div id="admin-contact-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target.id==='admin-contact-modal')this.remove()">
        <div style="background:white;border-radius:16px;max-width:500px;width:100%;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:20px 24px;color:white;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:800;font-size:1.1rem;">💬 Contact ${u.name || 'User'}</div>
              <div style="font-size:0.82rem;opacity:0.85;">📞 ${u.phone || '—'} · 📧 ${u.email || '—'}</div>
            </div>
            <button onclick="document.getElementById('admin-contact-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:1.4rem;width:32px;height:32px;border-radius:50%;cursor:pointer;">×</button>
          </div>
          <div style="padding:20px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
              <a href="tel:${u.phone}" style="background:#10b981;color:white;padding:10px;border-radius:8px;text-align:center;text-decoration:none;font-weight:700;font-size:0.85rem;"><i class="fas fa-phone"></i> Call</a>
              <a href="https://wa.me/${(u.phone||'').replace(/\D/g,'')}" target="_blank" style="background:#25d366;color:white;padding:10px;border-radius:8px;text-align:center;text-decoration:none;font-weight:700;font-size:0.85rem;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
            </div>
            <form onsubmit="event.preventDefault();kejaAdmin.sendDirectMessage('${u.id}',document.getElementById('admin-msg-text').value)">
              <textarea id="admin-msg-text" placeholder="Type message..." style="width:100%;min-height:100px;padding:10px;border:2px solid #e2e8f0;border-radius:8px;font-family:inherit;resize:vertical;margin-bottom:10px;" required></textarea>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <button type="submit" style="background:#4f46e5;color:white;border:none;padding:10px;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> Send SMS</button>
                <button type="button" onclick="document.getElementById('admin-contact-modal').remove()" style="background:#6b7280;color:white;border:none;padding:10px;border-radius:8px;font-weight:700;cursor:pointer;">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  async sendDirectMessage(userId, message) {
    if (!message?.trim()) return;
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, message: message.trim(), method: 'sms' })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('✅ Message sent!', 'success');
        document.getElementById('admin-contact-modal')?.remove();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed to send', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  openBroadcastModal() {
    const html = `
      <div id="admin-broadcast-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target.id==='admin-broadcast-modal')this.remove()">
        <div style="background:white;border-radius:16px;max-width:600px;width:100%;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:20px 24px;color:white;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:800;font-size:1.1rem;"><i class="fas fa-bullhorn"></i> Broadcast Message</div>
            <button onclick="document.getElementById('admin-broadcast-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:1.4rem;width:32px;height:32px;border-radius:50%;cursor:pointer;">×</button>
          </div>
          <div style="padding:20px;">
            <form onsubmit="event.preventDefault();kejaAdmin.sendBroadcast()">
              <div style="margin-bottom:14px;">
                <label style="display:block;font-weight:700;margin-bottom:6px;color:#1e293b;">Target Audience</label>
                <select id="broadcast-target-role" style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:8px;font-size:0.9rem;" required>
                  <option value="">-- Select --</option>
                  <option value="tenant">All Tenants (${this.users.filter(u=>u.role==='tenant').length})</option>
                  <option value="landlord">All Landlords (${this.users.filter(u=>u.role==='landlord'||u.role==='agency').length})</option>
                  <option value="service">All Service Providers (${this.users.filter(u=>u.role==='service').length})</option>
                  <option value="all">Everyone (${this.users.length})</option>
                </select>
              </div>
              <div style="margin-bottom:14px;">
                <label style="display:block;font-weight:700;margin-bottom:6px;color:#1e293b;">Message</label>
                <textarea id="broadcast-message-text" placeholder="Type your broadcast message..." style="width:100%;min-height:120px;padding:10px;border:2px solid #e2e8f0;border-radius:8px;font-family:inherit;resize:vertical;" required></textarea>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <button type="submit" style="background:#f59e0b;color:white;border:none;padding:12px;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> Send SMS Broadcast</button>
                <button type="button" onclick="document.getElementById('admin-broadcast-modal').remove()" style="background:#6b7280;color:white;border:none;padding:12px;border-radius:8px;font-weight:700;cursor:pointer;">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  async sendBroadcast() {
    const targetRole = document.getElementById('broadcast-target-role')?.value;
    const message = document.getElementById('broadcast-message-text')?.value.trim();
    if (!targetRole || !message) { if (window.app) window.app.showToast('Fill in all fields', 'error'); return; }
    if (!confirm(`Send SMS to all ${targetRole === 'all' ? 'users' : targetRole + 's'}?`)) return;

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ targetRole, message, method: 'sms' })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`✅ Broadcast sent to ${data.recipientCount || 0} users!`, 'success');
        document.getElementById('admin-broadcast-modal')?.remove();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Network error', 'error');
    }
  }

  async toggleUserVerification(userId) {
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/toggle-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(data.message, 'success');
        await this.refreshAllData();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error', 'error');
    }
  }

  async toggleUserBan(userId) {
    const u = this.users.find(u => u.id === userId);
    if (!u) return;
    const action = u.isBanned ? 'unban' : 'ban';
    if (!confirm(`${action.toUpperCase()} ${u.name}?`)) return;
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(data.message, 'success');
        await this.refreshAllData();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error', 'error');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LISTING ACTIONS
  // ═══════════════════════════════════════════════════════════

  async approveListing(propId) {
    if (!confirm('Approve this listing? It goes live immediately.')) return;
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) { window.app.showToast('✅ Listing approved & live!', 'success'); window.app.loadProperties(); }
        await this.refreshAllData();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error approving listing', 'error');
    }
  }

  async rejectListing(propId) {
    const reason = prompt('Reason for rejection (shown to landlord):');
    if (reason === null) return;
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Listing rejected.', 'info');
        await this.refreshAllData();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error', 'error');
    }
  }

  async deleteListing(propId) {
    if (!confirm('Permanently delete this listing?')) return;
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propId)}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) { window.app.showToast('Listing deleted.', 'info'); window.app.loadProperties(); }
        await this.refreshAllData();
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error', 'error');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════

  async loadMpesaConfig() {
    try {
      const res = await fetch('/api/admin/mpesa-config');
      if (res.ok) {
        const data = await res.json();
        const badge = document.getElementById('admin-daraja-status-badge');
        if (badge) {
          badge.textContent = data.hasDarajaCredentials ? `Active (${(data.environment||'').toUpperCase()})` : 'Keys Pending';
          badge.style.background = data.hasDarajaCredentials ? '#dcfce7' : '#fee2e2';
          badge.style.color = data.hasDarajaCredentials ? '#15803d' : '#991b1b';
        }
      }
    } catch (e) { console.warn('M-Pesa config load error:', e); }
  }

  async saveMpesaConfig(e) {
    if (e) e.preventDefault();
    const payload = {};
    const get = id => document.getElementById(id)?.value.trim();
    if (get('admin-mpesa-key')) payload.consumerKey = get('admin-mpesa-key');
    if (get('admin-mpesa-secret')) payload.consumerSecret = get('admin-mpesa-secret');
    if (get('admin-mpesa-passkey')) payload.passkey = get('admin-mpesa-passkey');
    if (get('admin-mpesa-paybill')) payload.paybill = get('admin-mpesa-paybill');
    if (get('admin-mpesa-account')) payload.account = get('admin-mpesa-account');
    const env = document.getElementById('admin-mpesa-env')?.value;
    if (env) payload.environment = env;

    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    try {
      const res = await fetch('/api/admin/mpesa-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('✅ M-Pesa settings saved!', 'success');
        this.loadMpesaConfig();
      } else {
        if (window.app) window.app.showToast(data.message || 'Save failed', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Error saving settings', 'error');
    }
  }

  downloadBackup() {
    window.open('/api/admin/download-db', '_blank');
  }
}

window.kejaAdmin = new AdminPortalEngine();
document.addEventListener('DOMContentLoaded', () => window.kejaAdmin.init());
