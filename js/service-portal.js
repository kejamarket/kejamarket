/**
 * KejaMarket - Service Provider Portal
 * For WiFi/Internet, Movers, Laundry, Garbage, Gas, and Water service providers
 */

const kejaServicePortal = (() => {
  let currentTab = 'my-services';

  function openServicePortal() {
    const session = kejaAuth.getSession();
    if (!session || (session.role !== 'service')) {
      if (window.app) window.app.showToast('Please sign in as a Service Provider to access this portal.', 'info');
      return;
    }
    if (window.app) window.app.openModal('modal-service-portal');
    switchTab('my-services');
  }

  function closeServicePortal() {
    if (window.app) window.app.closeModal('modal-service-portal');
  }

  function switchTab(tab) {
    currentTab = tab;
    const tabs = document.querySelectorAll('.service-portal-tab');
    const panels = document.querySelectorAll('.service-portal-panel');

    tabs.forEach(t => {
      if (t.dataset.tab === tab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    panels.forEach(p => {
      if (p.dataset.panel === tab) {
        p.style.display = 'block';
      } else {
        p.style.display = 'none';
      }
    });

    if (tab === 'my-services') {
      loadMyServices();
    } else if (tab === 'payments') {
      loadPaymentHistory();
    } else if (tab === 'messages') {
      loadMessages();
    }
  }

  async function loadMyServices() {
    const session = kejaAuth.getSession();
    if (!session) return;

    const container = document.getElementById('service-my-services-list');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
      const token = kejaAuth.getToken();
      const res = await fetch('/api/service/my-services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.services) {
        if (data.services.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
              <i class="fas fa-tools" style="font-size:3rem;color:#cbd5e1;margin-bottom:12px;"></i>
              <p style="color:#64748b;margin:0;">You haven't posted any services yet.</p>
              <button onclick="kejaServicePortal.showPostForm()" class="btn-primary" style="margin-top:16px;">
                <i class="fas fa-plus-circle"></i> Post Your First Service
              </button>
            </div>
          `;
        } else {
          container.innerHTML = data.services.map(service => renderServiceCard(service)).join('');
        }
      } else {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">Failed to load services.</div>';
      }
    } catch (err) {
      console.error('Load services error:', err);
      container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;">Error loading services.</div>';
    }
  }

  function renderServiceCard(service) {
    const statusColor = service.isVerified ? '#10b981' : '#f59e0b';
    const statusText = service.isVerified ? 'Verified ✓' : 'Pending Approval';
    const isBoosted = service.isTopAd || service.boosted;
    const categoryNames = {
      wifi: 'WiFi / Internet',
      movers: 'Moving Services',
      laundry: 'Laundry Services',
      garbage: 'Garbage Collection',
      gas: 'Gas Refills',
      water: 'Water Delivery'
    };

    return `
      <div class="service-card" style="background:white;border:${isBoosted ? '2px solid #f59e0b' : '1px solid #e5e7eb'};border-radius:12px;padding:16px;margin-bottom:12px;position:relative;${isBoosted ? 'box-shadow: 0 4px 12px rgba(245,158,11,0.2);' : ''}">
        ${isBoosted ? '<div style="position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:4px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;"><i class="fas fa-rocket"></i> BOOSTED</div>' : ''}
        
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;${isBoosted ? 'margin-top:28px;' : ''}">
          <div>
            <h4 style="margin:0 0 4px 0;color:#1e1b4b;font-size:1.05rem;font-weight:700;">${service.businessName || service.providerName}</h4>
            <p style="margin:0;color:#64748b;font-size:0.85rem;"><i class="fas fa-tools"></i> ${categoryNames[service.category] || service.category}</p>
          </div>
          <span style="padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${statusColor}22;color:${statusColor};">
            ${statusText}
          </span>
        </div>
        
        ${service.description ? `<p style="margin:8px 0;color:#475569;font-size:0.9rem;">${service.description}</p>` : ''}
        
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          ${service.serviceAreas ? `<span style="font-size:0.8rem;color:#6b7280;"><i class="fas fa-map-marker-alt"></i> ${service.serviceAreas}</span>` : ''}
          <span style="font-size:0.8rem;color:#6b7280;"><i class="fas fa-phone"></i> ${service.phone}</span>
        </div>

        ${service.price ? `<div style="margin-top:8px;font-size:0.95rem;color:#4f46e5;font-weight:700;">KSh ${service.price.toLocaleString()}</div>` : ''}
        
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button onclick="kejaServicePortal.viewService('${service.id}')" class="btn-secondary" style="flex:1;">
            <i class="fas fa-eye"></i> View
          </button>
          <button onclick="kejaServicePortal.editService('${service.id}')" class="btn-secondary" style="flex:1;">
            <i class="fas fa-edit"></i> Edit
          </button>
          ${service.isVerified ? `
            <button onclick="kejaServicePortal.${isBoosted ? 'unboostService' : 'openBoostPayment'}('${service.id}')" class="btn-secondary" style="flex:1;${isBoosted ? 'background:#dc2626;color:white;' : 'background:linear-gradient(135deg,#f59e0b,#d97706);color:white;'}">
              <i class="fas fa-${isBoosted ? 'times' : 'rocket'}"></i> ${isBoosted ? 'Un-boost' : 'Boost'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function showPostForm() {
    closeServicePortal();
    setTimeout(() => {
      const formSection = document.getElementById('service-post-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  }

  function viewService(id) {
    // Close portal and show full service listing
    closeServicePortal();
    // Implement service detail view
    if (window.app) window.app.showToast('Service detail view coming soon!', 'info');
  }

  function editService(id) {
    if (window.app) window.app.showToast('Edit service feature coming soon!', 'info');
  }

  async function loadMessages() {
    const container = document.getElementById('service-messages-list');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';

    try {
      const token = kejaAuth.getToken();
      const res = await fetch('/api/service/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.messages) {
        if (data.messages.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
              <i class="fas fa-envelope-open" style="font-size:3rem;color:#cbd5e1;margin-bottom:12px;"></i>
              <p style="color:#64748b;margin:0;">No messages yet.</p>
            </div>
          `;
        } else {
          container.innerHTML = data.messages.map(msg => `
            <div class="message-card" style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <strong style="color:#1e1b4b;">${msg.from}</strong>
                <span style="font-size:0.8rem;color:#64748b;">${new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <p style="margin:0;color:#475569;">${msg.message}</p>
            </div>
          `).join('');
        }
      } else {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No messages found.</div>';
      }
    } catch (err) {
      console.error('Load messages error:', err);
      container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;">Error loading messages.</div>';
    }
  }

  async function loadPaymentHistory() {
    const container = document.getElementById('service-payment-history-list');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading payment history...</div>';

    try {
      const token = kejaAuth.getToken();
      const res = await fetch('/api/service/payment-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.payments) {
        if (data.payments.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
              <i class="fas fa-credit-card" style="font-size:3rem;color:#cbd5e1;margin-bottom:12px;"></i>
              <p style="color:#64748b;margin:0;">No payment history yet.</p>
              <p style="color:#94a3b8;font-size:0.85rem;margin-top:8px;">Boost your services to appear at the top!</p>
            </div>
          `;
        } else {
          const totalSpent = data.payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          container.innerHTML = `
            <!-- Summary Card -->
            <div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:20px;border-radius:12px;margin-bottom:20px;">
              <h3 style="margin:0 0 8px;font-size:1.2rem;">Payment Summary</h3>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-top:12px;">
                <div>
                  <div style="font-size:0.85rem;opacity:0.9;">Total Spent</div>
                  <div style="font-size:1.6rem;font-weight:800;">KSh ${totalSpent.toLocaleString()}</div>
                </div>
                <div>
                  <div style="font-size:0.85rem;opacity:0.9;">Total Payments</div>
                  <div style="font-size:1.6rem;font-weight:800;">${data.payments.length}</div>
                </div>
                <div>
                  <div style="font-size:0.85rem;opacity:0.9;">Successful</div>
                  <div style="font-size:1.6rem;font-weight:800;">${data.payments.filter(p => p.status === 'completed').length}</div>
                </div>
              </div>
            </div>

            <!-- Payment List -->
            <h4 style="margin:0 0 12px;color:#1e293b;font-size:0.95rem;">Transaction History</h4>
            ${data.payments.map(payment => {
              const statusColors = {
                completed: { bg: '#dcfce7', color: '#166534', icon: 'check-circle' },
                pending: { bg: '#fef3c7', color: '#92400e', icon: 'clock' },
                failed: { bg: '#fee2e2', color: '#991b1b', icon: 'times-circle' }
              };
              const status = statusColors[payment.status] || statusColors.pending;
              
              return `
                <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                    <div>
                      <div style="font-weight:700;color:#1e293b;margin-bottom:4px;">Boost Payment</div>
                      <div style="font-size:0.8rem;color:#64748b;">Service ID: ${payment.serviceId}</div>
                      <div style="font-size:0.8rem;color:#64748b;">${new Date(payment.createdAt).toLocaleString()}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:1.3rem;font-weight:800;color:#10b981;">KSh ${payment.amount.toLocaleString()}</div>
                      <span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${status.bg};color:${status.color};margin-top:4px;">
                        <i class="fas fa-${status.icon}"></i> ${payment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  ${payment.status === 'failed' && payment.failureReason ? `
                    <div style="background:#fef2f2;padding:8px 12px;border-radius:8px;margin-top:8px;font-size:0.85rem;color:#991b1b;">
                      <i class="fas fa-exclamation-triangle"></i> ${payment.failureReason}
                    </div>
                  ` : ''}
                  ${payment.status === 'completed' && payment.completedAt ? `
                    <div style="background:#f0fdf4;padding:8px 12px;border-radius:8px;margin-top:8px;font-size:0.85rem;color:#166534;">
                      <i class="fas fa-check"></i> Completed: ${new Date(payment.completedAt).toLocaleString()}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          `;
        }
      } else {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">Failed to load payment history.</div>';
      }
    } catch (err) {
      console.error('Load payment history error:', err);
      container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;">Error loading payment history.</div>';
    }
  }

  // Auto-open on page load if service provider is logged in
  function init() {
    const session = kejaAuth.getSession();
    if (session && session.role === 'service') {
      setTimeout(() => {
        openServicePortal();
      }, 500);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BOOST PAYMENT SYSTEM
  // ═══════════════════════════════════════════════════════════

  function openBoostPayment(serviceId) {
    const session = kejaAuth.getSession();
    if (!session) return;

    const modalHtml = `
      <div id="boost-payment-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;" onclick="if(event.target.id==='boost-payment-modal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; color: white; border-radius: 16px 16px 0 0;">
            <button onclick="document.getElementById('boost-payment-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">×</button>
            <h2 style="margin: 0; font-size: 1.4rem;"><i class="fas fa-rocket"></i> Boost Your Service</h2>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 0.9rem;">Appear at the top for 30 days</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            
            <!-- Pricing -->
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #f59e0b;">
              <h3 style="margin: 0 0 12px; color: #92400e; font-size: 1.1rem;">Boost Package</h3>
              <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 2.5rem; font-weight: 800; color: #d97706;">KSh 500</span>
                <span style="color: #92400e; font-size: 0.9rem;">/ 30 days</span>
              </div>
              <ul style="margin: 12px 0 0; padding-left: 20px; color: #78350f;">
                <li>Your service appears at the top</li>
                <li>🚀 BOOSTED badge displayed</li>
                <li>Gold border highlight</li>
                <li>Priority visibility for 30 days</li>
                <li>Increased customer inquiries</li>
              </ul>
            </div>

            <!-- Phone Number Input -->
            <form onsubmit="event.preventDefault(); kejaServicePortal.initiateBoostPayment('${serviceId}');">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b;">M-Pesa Phone Number</label>
              <input 
                type="tel" 
                id="boost-mpesa-phone" 
                placeholder="e.g. 0712345678" 
                value="${session.phone || ''}"
                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-family: inherit; margin-bottom: 20px;" 
                required 
              />

              <!-- Instructions -->
              <div style="background: #eff6ff; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-size: 0.85rem;">
                  <strong>Payment Instructions:</strong><br>
                  1. Click "Pay with M-Pesa" below<br>
                  2. Enter your M-Pesa PIN on your phone<br>
                  3. Your service will be boosted immediately
                </p>
              </div>

              <!-- Submit Button -->
              <button type="submit" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 16px; border-radius: 10px; font-weight: 700; font-size: 1.1rem; cursor: pointer;">
                <i class="fas fa-mobile-alt"></i> Pay KSh 500 with M-Pesa
              </button>
            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  async function initiateBoostPayment(serviceId) {
    const phoneInput = document.getElementById('boost-mpesa-phone');
    if (!phoneInput) return;

    const phone = phoneInput.value.trim();
    if (!phone) {
      if (window.app) window.app.showToast('Please enter your M-Pesa phone number', 'error');
      return;
    }

    // Validate phone format
    if (!/^(254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''))) {
      if (window.app) window.app.showToast('Invalid phone number format', 'error');
      return;
    }

    try {
      // Show loading
      if (window.app) window.app.showToast('Initiating M-Pesa payment...', 'info');

      const token = kejaAuth.getToken();
      const res = await fetch('/api/service/boost-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId,
          phone,
          amount: 500
        })
      });

      const data = await res.json();

      if (data.success) {
        // Close modal
        document.getElementById('boost-payment-modal')?.remove();

        // Show success message
        if (window.app) {
          window.app.showToast('📱 Check your phone to complete payment!', 'success');
        }

        // Poll for payment status
        pollPaymentStatus(serviceId, data.checkoutRequestId);
      } else {
        if (window.app) window.app.showToast(data.message || 'Payment initiation failed', 'error');
      }
    } catch (err) {
      console.error('Boost payment error:', err);
      if (window.app) window.app.showToast('Payment error. Please try again.', 'error');
    }
  }

  async function pollPaymentStatus(serviceId, checkoutRequestId) {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 30 seconds

    const interval = setInterval(async () => {
      attempts++;

      try {
        const token = kejaAuth.getToken();
        const res = await fetch(`/api/service/payment-status/${checkoutRequestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          if (window.app) {
            window.app.showToast('🚀 Payment successful! Your service is now boosted!', 'success');
          }
          loadMyServices(); // Refresh services list
        } else if (data.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(interval);
          if (window.app) {
            window.app.showToast('Payment not completed. Please try again.', 'error');
          }
        }
      } catch (err) {
        console.error('Payment status poll error:', err);
      }
    }, 2000); // Check every 2 seconds
  }

  async function unboostService(serviceId) {
    if (!confirm('Remove boost from this service?')) return;

    try {
      const token = kejaAuth.getToken();
      const res = await fetch(`/api/properties/${encodeURIComponent(serviceId)}/unboost`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('Boost removed', 'info');
        loadMyServices(); // Refresh list
      }
    } catch (err) {
      if (window.app) window.app.showToast('Failed to remove boost', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    openServicePortal,
    closeServicePortal,
    switchTab,
    showPostForm,
    viewService,
    editService,
    loadMyServices,
    loadMessages,
    loadPaymentHistory,
    openBoostPayment,
    initiateBoostPayment,
    unboostService
  };
})();
