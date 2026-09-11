/**
 * KejaMarket - Landlord Portal Dashboard
 * Complete portal for landlords to manage listings, browse properties, and communicate with admin
 */

class LandlordPortal {
  constructor() {
    this.activeTab = 'my-listings';
    this.myListings = [];
    this.messages = [];
    this.stats = null;
  }

  init() {
    this.checkLandlordSession();
    
    // AUTO-OPEN: If already logged in as landlord on page load, open portal automatically
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (session && (session.role === 'landlord' || session.role === 'agency') && 
        session.role !== 'admin' && !session.isAdmin && session.id !== 'usr-admin-01') {
      // Open landlord portal automatically after a short delay
      setTimeout(() => {
        this.openLandlordPortal();
      }, 1000);
    }
  }

  checkLandlordSession() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    
    // IMPORTANT: Admins should NOT see landlord portal, only their own admin portal
    const isLandlord = Boolean(
      session && 
      (session.role === 'landlord' || session.role === 'agency') &&
      session.role !== 'admin' &&  // Exclude admins
      !session.isAdmin &&  // Exclude admin flag
      session.id !== 'usr-admin-01'  // Exclude default admin
    );

    const landlordHeaderBtn = document.getElementById('btn-landlord-header');
    const landlordLinks = document.getElementById('auth-landlord-links');

    if (isLandlord) {
      if (landlordHeaderBtn) landlordHeaderBtn.style.display = 'inline-flex';
      if (landlordLinks) landlordLinks.style.display = 'block';
    } else {
      if (landlordHeaderBtn) landlordHeaderBtn.style.display = 'none';
      if (landlordLinks) landlordLinks.style.display = 'none';
    }

    return isLandlord;
  }

  async openLandlordPortal() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (!session || (session.role !== 'landlord' && session.role !== 'agency')) {
      if (window.app) window.app.showToast('Please sign in as a Landlord or Agency.', 'error');
      if (window.kejaAuth) window.kejaAuth.openAuthModal();
      return;
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-landlord-portal');
    }

    this.switchTab('my-listings');
    await this.refreshAllData();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabs = ['my-listings', 'browse', 'messages'];
    
    tabs.forEach(t => {
      const btn = document.getElementById(`landlord-tab-btn-${t}`);
      const pane = document.getElementById(`landlord-tab-pane-${t}`);
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

    if (tabName === 'my-listings') this.renderMyListings();
    if (tabName === 'browse') this.renderBrowseListings();
    if (tabName === 'messages') this.renderMessages();
  }

  async refreshAllData() {
    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch my listings
      const myRes = await fetch('/api/landlord/my-listings', { headers });
      if (myRes.ok) {
        const data = await myRes.json();
        this.myListings = data.listings || [];
        if (this.activeTab === 'my-listings') this.renderMyListings();
      }

      // Fetch messages
      const msgRes = await fetch('/api/landlord/messages', { headers });
      if (msgRes.ok) {
        const data = await msgRes.json();
        this.messages = data.messages || [];
        if (this.activeTab === 'messages') this.renderMessages();
        
        // Update message count badge
        const msgBadge = document.getElementById('landlord-msg-count');
        if (msgBadge) {
          const unread = this.messages.filter(m => !m.isRead).length;
          msgBadge.textContent = unread;
          msgBadge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (err) {
      console.warn('Landlord fetch error:', err);
    }
  }

  renderMyListings() {
    const container = document.getElementById('landlord-my-listings-container');
    if (!container) return;

    if (!this.myListings || this.myListings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: #94a3b8;">
          <i class="fas fa-home" style="font-size: 3rem; margin-bottom: 16px; color: #cbd5e1;"></i>
          <h3 style="color: #475569; margin-bottom: 8px;">No Listings Yet</h3>
          <p style="margin-bottom: 24px;">Post your first property to start receiving tenant inquiries.</p>
          <button class="btn-primary" style="background: #7c3aed; padding: 12px 24px;" onclick="window.app.openModal('modal-post-ad')">
            <i class="fas fa-plus"></i> Post Your First Property
          </button>
        </div>
      `;
      return;
    }

    const pending = this.myListings.filter(p => !p.isApproved && p.status !== 'approved');
    const approved = this.myListings.filter(p => p.isApproved || p.status === 'approved');

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: #1e293b;">My Listings (${this.myListings.length})</h3>
        <button class="btn-primary" style="background: #7c3aed; padding: 8px 16px; font-size: 0.9rem;" onclick="window.app.openModal('modal-post-ad')">
          <i class="fas fa-plus"></i> Post New Property
        </button>
      </div>
    `;

    // Pending listings
    if (pending.length > 0) {
      html += `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px; color: #92400e; font-size: 1rem;">
            <i class="fas fa-clock"></i> Pending Approval (${pending.length})
          </h4>
          <p style="font-size: 0.9rem; color: #78350f; margin-bottom: 16px;">
            These listings are under review by our admin team. You'll be notified once they're approved.
          </p>
          <div style="display: grid; gap: 12px;">
            ${pending.map(p => this.renderListingCard(p, 'pending')).join('')}
          </div>
        </div>
      `;
    }

    // Approved listings
    if (approved.length > 0) {
      html += `
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px; color: #065f46; font-size: 1rem;">
            <i class="fas fa-check-circle"></i> Live Listings (${approved.length})
          </h4>
          <div style="display: grid; gap: 12px;">
            ${approved.map(p => this.renderListingCard(p, 'approved')).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  renderListingCard(property, status) {
    const statusBadge = status === 'pending' 
      ? '<span style="background: #fbbf24; color: #78350f; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">⏳ Pending</span>'
      : '<span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">✓ Live</span>';

    return `
      <div style="background: white; border-radius: 8px; padding: 16px; display: flex; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${property.images && property.images[0] ? `
          <img src="${property.images[0]}" alt="${property.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />
        ` : ''}
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 1rem; color: #1e293b;">${property.title}</h4>
            ${statusBadge}
          </div>
          <div style="color: #64748b; font-size: 0.9rem; margin-bottom: 8px;">
            <i class="fas fa-map-marker-alt"></i> ${property.estateSuburb || property.area || '-'}
          </div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #00b53f; margin-bottom: 8px;">
            KSh ${Number(property.rentKes || property.price || 0).toLocaleString()}/month
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="category-pill" style="font-size: 0.8rem; padding: 6px 12px; background: #6366f1; color: white;" onclick="kejaLandlordPortal.viewMyListingDetails('${property.id}')">
              <i class="fas fa-eye"></i> View
            </button>
            ${status === 'approved' ? `
              <button class="category-pill" style="font-size: 0.8rem; padding: 6px 12px; background: #f59e0b; color: white;" onclick="kejaLandlordPortal.boostListing('${property.id}')">
                <i class="fas fa-rocket"></i> Boost
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderBrowseListings() {
    const container = document.getElementById('landlord-browse-container');
    if (!container) return;

    // LANDLORD PORTAL: Show all verified listings (like tenants see)
    const verifiedListings = (window.app && window.app.properties) || [];

    if (verifiedListings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: #94a3b8;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 16px; color: #cbd5e1;"></i>
          <h3 style="color: #475569;">No verified listings available</h3>
        </div>
      `;
      return;
    }

    let html = `
      <h3 style="margin: 0 0 16px; color: #1e293b;">Browse Verified Properties (${verifiedListings.length})</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
    `;

    verifiedListings.slice(0, 12).forEach(p => {
      html += `
        <div class="property-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.app.openPropertyDetail('${p.id}')">
          ${p.images && p.images[0] ? `
            <img src="${p.images[0]}" alt="${p.title}" style="width: 100%; height: 200px; object-fit: cover;" />
          ` : ''}
          <div style="padding: 16px;">
            <h4 style="margin: 0 0 8px; font-size: 1rem; color: #1e293b;">${p.title}</h4>
            <div style="color: #64748b; font-size: 0.85rem; margin-bottom: 8px;">
              <i class="fas fa-map-marker-alt"></i> ${p.estateSuburb || p.area || '-'}
            </div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #00b53f;">
              KSh ${Number(p.rentKes || p.price || 0).toLocaleString()}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderMessages() {
    const container = document.getElementById('landlord-messages-container');
    if (!container) return;

    if (!this.messages || this.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: #94a3b8;">
          <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 16px; color: #cbd5e1;"></i>
          <h3 style="color: #475569; margin-bottom: 8px;">No Messages</h3>
          <p style="margin-bottom: 24px;">Start a conversation with the admin team.</p>
          <button class="btn-primary" style="background: #7c3aed; padding: 12px 24px;" onclick="kejaLandlordPortal.sendMessageToAdmin()">
            <i class="fas fa-paper-plane"></i> Contact Admin
          </button>
        </div>
      `;
      return;
    }

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: #1e293b;">Messages (${this.messages.length})</h3>
        <button class="btn-primary" style="background: #7c3aed; padding: 8px 16px; font-size: 0.9rem;" onclick="kejaLandlordPortal.sendMessageToAdmin()">
          <i class="fas fa-paper-plane"></i> New Message
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    this.messages.forEach(msg => {
      const isFromAdmin = msg.fromRole === 'admin';
      const isApproval = msg.message.includes('APPROVED');
      const isRejection = msg.message.includes('NOT approved');
      
      let bgColor = isFromAdmin ? '#f0f9ff' : '#f8fafc';
      let borderColor = isFromAdmin ? '#3b82f6' : '#7c3aed';
      
      if (isApproval) {
        bgColor = '#f0fdf4';
        borderColor = '#10b981';
      } else if (isRejection) {
        bgColor = '#fef2f2';
        borderColor = '#ef4444';
      }

      html += `
        <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; border-radius: 8px; ${!msg.isRead ? 'box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);' : ''}">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #1e293b;">
              ${isFromAdmin ? '👑 Admin Team' : '📤 You'}
              ${!msg.isRead ? '<span style="background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 8px; margin-left: 8px;">NEW</span>' : ''}
            </span>
            <span style="font-size: 0.85rem; color: #64748b;">
              ${new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>
          <div style="color: #475569; line-height: 1.6; white-space: pre-wrap;">
            ${msg.message}
          </div>
          ${msg.propertyId ? `
            <div style="margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 4px; font-size: 0.85rem;">
              <i class="fas fa-home"></i> Related to: ${msg.propertyTitle || msg.propertyId}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Mark messages as read after displaying
    this.markMessagesAsRead();
  }

  sendMessageToAdmin() {
    const message = prompt('Enter your message to the admin team:');
    if (!message) return;

    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    fetch('/api/landlord/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (window.app) window.app.showToast('Message sent to admin!', 'success');
        this.refreshAllData();
      } else {
        if (window.app) window.app.showToast(data.message || 'Failed to send message', 'error');
      }
    })
    .catch(err => {
      if (window.app) window.app.showToast('Network error', 'error');
    });
  }

  viewMyListingDetails(propId) {
    const property = this.myListings.find(p => p.id === propId);
    if (!property) return;

    // Close the landlord portal
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-landlord-portal');
    }

    // Open the property detail modal
    setTimeout(() => {
      if (window.app && typeof window.app.openPropertyDetail === 'function') {
        window.app.openPropertyDetail(propId);
      }
    }, 300); // Small delay to allow portal to close smoothly
  }

  boostListing(propId) {
    if (!confirm('Boost this listing to TOP AD for KSh 1,000?')) return;
    
    // Open M-Pesa payment modal
    if (window.app) {
      window.app.showToast('Opening M-Pesa payment...', 'info');
      // TODO: Integrate with monetization module
    }
  }

  markMessagesAsRead() {
    // Mark all messages as read (could call API endpoint)
    const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
    fetch('/api/landlord/messages/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }).catch(err => console.log('Could not mark messages as read'));
  }
}

// Global instance
const kejaLandlordPortal = new LandlordPortal();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => kejaLandlordPortal.init());
} else {
  kejaLandlordPortal.init();
}
