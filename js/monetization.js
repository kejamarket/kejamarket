/**
 * KejaMarket - Lipa Na M-Pesa Payment & Monetization Engine
 * Handles:
 * 1. Real Daraja STK Push prompt triggers via backend (/api/mpesa/stk-push)
 * 2. Real-time transaction polling (/api/mpesa/status/:checkoutRequestId)
 * 3. Instant manual confirmation & SMS receipt code verification (/api/mpesa/verify-receipt)
 * 4. TOP AD listing boosts (7 & 30 days)
 * 5. Verified Landlord annual subscriptions
 * 6. Pro Agency monthly listing packages
 * 7. Instant WhatsApp tenant alert subscriptions
 * 8. Nairobi Movers & Fibre Internet lead generation
 */

class MonetizationEngine {
  constructor() {
    this.currentPendingOrder = null;
    this.currentCheckoutRequestId = null;
    this.pollingInterval = null;
    this.pollAttempts = 0;
    this.maxPollAttempts = 30; // 30 * 2s = 60 seconds
  }

  init() {
    this.setupMpesaForm();
    this.setupWhatsAppAlertsForm();
    this.setupAffiliateLeadForms();
  }

  // Open Checkout for a Specific Item
  openMpesaCheckout(itemType, itemName, amountKes, targetPropertyId = null) {
    this.currentPendingOrder = {
      itemType,
      itemName,
      amountKes,
      targetPropertyId,
      timestamp: Date.now()
    };
    this.currentCheckoutRequestId = null;

    // Pre-fill phone if user is logged in
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const phoneInput = document.getElementById('mpesa-phone-number');
    if (phoneInput && session && session.phone) {
      phoneInput.value = session.phone;
    }

    // Update Checkout UI
    const titleEl = document.getElementById('mpesa-checkout-item-title');
    const badgeEl = document.getElementById('mpesa-checkout-amount-badge');
    const descEl = document.getElementById('mpesa-checkout-desc');

    if (titleEl) titleEl.textContent = itemName;
    if (badgeEl) badgeEl.textContent = `KSh ${amountKes.toLocaleString()}`;
    if (descEl) descEl.textContent = this.getItemDescription(itemType);

    this.resetCheckout();

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-mpesa-checkout');
    }
  }

  getItemDescription(itemType) {
    switch (itemType) {
      case 'top_ad_7':
        return 'Places your listing at the top of Nairobi search results and highlights price tag in golden orange for 7 days.';
      case 'top_ad_30':
        return 'Top pinned ranking for 30 days across all Nairobi categories with 5x tenant inquiries.';
      case 'verified_badge':
        return 'Get a blue "VERIFIED LANDLORD" badge on all your listings for 1 year. Tenants trust verified landlords more and inquire faster.';
      case 'agency_starter':
        return 'Post up to 5 properties with priority ranking and direct WhatsApp leads.';
      case 'agency_pro':
        return 'Post up to 25 properties with auto-refresh and monthly analytics report.';
      case 'whatsapp_alerts':
        return 'Instant WhatsApp alerts sent directly to your phone when matching rental houses are posted.';
      default:
        return 'Premium platform listing upgrade.';
    }
  }

  setupMpesaForm() {
    const form = document.getElementById('form-mpesa-stk-trigger');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('mpesa-phone-number');
      const rawPhone = phoneInput ? phoneInput.value.trim() : '';

      if (!rawPhone || rawPhone.replace(/\D/g, '').length < 9) {
        if (window.app) window.app.showToast('Please enter a valid Safaricom phone number (e.g. 0712345678)', 'info');
        return;
      }

      if (!this.currentPendingOrder) {
        if (window.app) window.app.showToast('No active item selected for checkout.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending STK Prompt...';
      }

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (window.kejaAuth && window.kejaAuth.getToken()) {
          headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
        }

        const res = await fetch('/api/mpesa/stk-push', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phone: rawPhone,
            amount: this.currentPendingOrder.amountKes,
            itemType: this.currentPendingOrder.itemType,
            itemName: this.currentPendingOrder.itemName,
            targetPropertyId: this.currentPendingOrder.targetPropertyId
          })
        });

        const data = await res.json();

        if (data.success && data.checkoutRequestId) {
          this.currentCheckoutRequestId = data.checkoutRequestId;
          // Show STK Prompt screen
          this.showStkScreen(rawPhone);
          if (window.app) window.app.showToast('📲 M-Pesa prompt sent! Enter your PIN on your phone.', 'success');
          
          // Start polling for payment confirmation from Safaricom
          this.startStatusPolling(data.checkoutRequestId);
        } else {
          if (window.app) window.app.showToast(`❌ ${data.message || 'Payment initiation failed'}`, 'error');
          this.resetCheckout();
        }
      } catch (err) {
        console.error('STK Push error:', err);
        // Server is unreachable - show error, do NOT simulate success
        if (window.app) window.app.showToast('❌ Could not reach payment server. Please check your connection and try again.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  showStkScreen(phone) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    const stepInput = document.getElementById('mpesa-step-input');
    const stepStk = document.getElementById('mpesa-step-stk');
    const stepSuccess = document.getElementById('mpesa-step-success');

    if (stepInput) stepInput.style.display = 'none';
    if (stepStk) stepStk.style.display = 'block';
    if (stepSuccess) stepSuccess.style.display = 'none';

    const simPhone = document.getElementById('stk-sim-phone');
    const simAmount = document.getElementById('stk-sim-amount');
    const pinDisplay = document.getElementById('stk-pin-display');
    const statusText = document.getElementById('stk-status-text');

    if (simPhone) simPhone.textContent = `+${cleanPhone}`;
    if (simAmount && this.currentPendingOrder) {
      simAmount.textContent = `KSh ${this.currentPendingOrder.amountKes.toLocaleString()}`;
    }
    if (pinDisplay) pinDisplay.textContent = '•••• (Enter PIN on phone)';
    if (statusText) statusText.textContent = 'Waiting for PIN entry on phone...';
  }

  startStatusPolling(checkoutRequestId) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollAttempts = 0;

    this.pollingInterval = setInterval(async () => {
      this.pollAttempts++;

      try {
        const res = await fetch(`/api/mpesa/status/${encodeURIComponent(checkoutRequestId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'SUCCESS') {
            clearInterval(this.pollingInterval);
            this.completePaymentSuccess(data.receipt || ('QKJ' + Math.floor(100000 + Math.random() * 900000)));
            return;
          } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            clearInterval(this.pollingInterval);
            if (window.app) window.app.showToast('Payment was cancelled or failed. Please try again.', 'error');
            this.resetCheckout();
            return;
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }

      if (this.pollAttempts >= this.maxPollAttempts) {
        clearInterval(this.pollingInterval);
        // Polling timed out - ask user to manually confirm or try again
        this.showPinTimeout();
      }
    }, 2000);
  }

  // Show a timeout message when polling expires without a response
  showPinTimeout() {
    const statusText = document.getElementById('stk-status-text');
    if (statusText) {
      statusText.innerHTML = '⏰ No response received. If you entered your PIN, click <strong>"I Have Entered PIN"</strong> below to confirm, or click Cancel to try again.';
    }
    if (window.app) window.app.showToast('⏰ Timed out waiting for M-Pesa. Click "I Have Entered PIN" if you already paid.', 'info');
  }

  // Called when user clicks "I Have Entered PIN – Confirm Now"
  async checkStatusImmediate() {
    const checkoutRequestId = this.currentCheckoutRequestId;
    if (!checkoutRequestId) {
      if (window.app) window.app.showToast('❌ No active payment session. Please start again.', 'error');
      this.resetCheckout();
      return;
    }

    const btn = document.getElementById('btn-instant-confirm');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Payment...';
    }

    try {
      // Query live status from backend first
      const statusRes = await fetch(`/api/mpesa/status/${encodeURIComponent(checkoutRequestId)}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === 'SUCCESS') {
          this.completePaymentSuccess(statusData.receipt || 'QKJ' + Math.floor(100000 + Math.random() * 900000));
          return;
        } else if (statusData.status === 'FAILED' || statusData.status === 'CANCELLED') {
          if (window.app) window.app.showToast('❌ Payment was cancelled or failed on Safaricom side. Please try again.', 'error');
          this.resetCheckout();
          return;
        }
      }

      // Still PENDING - ask user to enter their SMS receipt code for manual verify
      const code = prompt(
        'Payment is still processing.\n\n' +
        'If you received an M-Pesa SMS confirmation, paste the receipt code here (e.g. QKJ7XXXXXX).\n\n' +
        'Leave empty and press Cancel to try again later.'
      );
      if (code && code.trim().length >= 6) {
        const cleanCode = code.trim().toUpperCase();
        // Verify the receipt code with backend
        const verifyRes = await fetch('/api/mpesa/verify-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId, receiptCode: cleanCode })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          this.completePaymentSuccess(verifyData.receipt || cleanCode);
          return;
        } else {
          if (window.app) window.app.showToast('⚠️ Receipt code could not be verified. Contact support if you were charged.', 'error');
        }
      } else {
        // User cancelled - tell them to try again
        if (window.app) window.app.showToast('Payment not confirmed. If you were charged, please contact support with your receipt code.', 'info');
      }
    } catch (err) {
      console.warn('Instant check error:', err);
      if (window.app) window.app.showToast('❌ Could not verify payment. Check your connection and try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-double"></i> I Have Entered PIN – Confirm Now';
      }
    }
  }

  // Prompt for manual receipt code from SMS
  async promptReceiptCode() {
    const code = prompt('Enter the M-Pesa Receipt Code from your SMS (e.g. QKJ7XXXXXX):');
    if (!code || !code.trim() || code.trim().length < 6) {
      if (window.app) window.app.showToast('No receipt code entered. Payment not confirmed.', 'info');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    try {
      const res = await fetch('/api/mpesa/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutRequestId: this.currentCheckoutRequestId,
          receiptCode: cleanCode
        })
      });
      const data = await res.json();
      if (data.success) {
        this.completePaymentSuccess(data.receipt || cleanCode);
      } else {
        if (window.app) window.app.showToast('⚠️ Receipt code not verified. Contact support if you were charged.', 'error');
      }
    } catch (err) {
      console.warn('Receipt verify error:', err);
      if (window.app) window.app.showToast('❌ Could not verify. Check connection and try again.', 'error');
    }
  }

  playSuccessChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // AudioContext not allowed without interaction
    }
  }

  completePaymentSuccess(receiptCode) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const order = this.currentPendingOrder;
    if (!order) return;

    this.playSuccessChime();

    const stepStk = document.getElementById('mpesa-step-stk');
    const stepSuccess = document.getElementById('mpesa-step-success');
    const receiptEl = document.getElementById('mpesa-success-receipt');
    const msgEl = document.getElementById('mpesa-success-msg');

    if (stepStk) stepStk.style.display = 'none';
    if (stepSuccess) stepSuccess.style.display = 'block';
    if (receiptEl) receiptEl.textContent = receiptCode;
    if (msgEl) {
      msgEl.textContent = `Payment of KSh ${order.amountKes.toLocaleString()} confirmed! Your order for "${order.itemName}" is now active.`;
    }

    // Apply Upgrades in frontend state
    if (order.targetPropertyId && window.app && window.app.properties) {
      const prop = window.app.properties.find(p => p.id === order.targetPropertyId);
      if (prop) {
        if (order.itemType.startsWith('top_ad') || order.itemType.startsWith('boost')) {
          prop.isTopAd = true;
          prop.isFeatured = true;
        } else if (order.itemType === 'verified_badge') {
          if (prop.landlord) prop.landlord.isVerified = true;
        }
      }
      // Notify backend to persist boost
      fetch(`/api/properties/${encodeURIComponent(order.targetPropertyId)}/boost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boostType: order.itemType })
      }).catch(e => console.warn('Could not sync boost to backend:', e));
    }

    if (order.itemType === 'verified_badge') {
      const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
      if (session) {
        session.isVerified = true;
        if (window.kejaAuth.saveSession) window.kejaAuth.saveSession(session);
      }
      if (window.app) window.app.showToast('🎉 Verified Landlord status activated for your profile!', 'success');
    }

    // Refresh listings & map
    if (window.app && typeof window.app.applyFilters === 'function') {
      window.app.applyFilters();
    }
    if (window.app) {
      window.app.showToast(`✅ Lipa Na M-Pesa ${receiptCode} Confirmed!`, 'success');
    }
  }

  resetCheckout() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const stepInput = document.getElementById('mpesa-step-input');
    const stepStk = document.getElementById('mpesa-step-stk');
    const stepSuccess = document.getElementById('mpesa-step-success');

    if (stepInput) stepInput.style.display = 'block';
    if (stepStk) stepStk.style.display = 'none';
    if (stepSuccess) stepSuccess.style.display = 'none';
  }

  setupWhatsAppAlertsForm() {
    const alertForm = document.getElementById('form-whatsapp-alert-sub');
    if (!alertForm) return;

    alertForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneEl = document.getElementById('alert-tenant-phone');
      const estateEl = document.getElementById('alert-tenant-estate');
      const catEl = document.getElementById('alert-tenant-category');
      const minEl = document.getElementById('alert-tenant-budget-min');
      const maxEl = document.getElementById('alert-tenant-budget-max');

      const phone = phoneEl ? phoneEl.value.trim() : '';
      const estate = estateEl ? estateEl.value : 'Any Estate';
      const category = catEl ? catEl.value : 'All Categories';
      const budgetMin = minEl ? minEl.value.trim() : '';
      const budgetMax = maxEl ? maxEl.value.trim() : '';

      if (budgetMin && budgetMax && Number(budgetMax) < Number(budgetMin)) {
        if (window.app) window.app.showToast('Max budget must be greater than Min budget.', 'info');
        return;
      }

      // Save alert to backend
      try {
        await fetch('/api/alerts/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, estate, category, budgetMin, budgetMax })
        });
      } catch (err) {
        console.warn('Could not sync alert to backend:', err);
      }

      let budgetLabel = 'Any Budget';
      if (budgetMin && budgetMax) {
        budgetLabel = `KSh ${Number(budgetMin).toLocaleString()} – ${Number(budgetMax).toLocaleString()}`;
      } else if (budgetMin) {
        budgetLabel = `From KSh ${Number(budgetMin).toLocaleString()}`;
      } else if (budgetMax) {
        budgetLabel = `Up to KSh ${Number(budgetMax).toLocaleString()}`;
      }

      if (window.app) window.app.closeModal('modal-whatsapp-alerts');
      this.openMpesaCheckout('whatsapp_alerts', `WhatsApp Alerts (${category} · ${estate} · ${budgetLabel}/mo)`, 100);
    });
  }

  setupAffiliateLeadForms() {
    // Movers quote submit
    window.submitMoversLead = async function(e) {
      e.preventDefault();
      const name = document.getElementById('mover-lead-name')?.value || '';
      const phone = document.getElementById('mover-lead-phone')?.value || '';
      const from = document.getElementById('mover-lead-from')?.value || '';
      const to = document.getElementById('mover-lead-to')?.value || '';

      try {
        await fetch('/api/leads/movers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, from, to })
        });
      } catch (err) {
        console.warn('Lead submission offline sync');
      }

      if (window.app) {
        window.app.closeModal('modal-lead-movers');
        window.app.showToast(`🚚 Quote request sent for ${from} ➔ ${to}! Partner movers will call ${phone} within 15 mins.`, 'success');
      }
    };

    // Fibre WiFi submit
    window.submitFibreLead = async function(e) {
      e.preventDefault();
      const phone = document.getElementById('fibre-lead-phone')?.value || '';
      const estate = document.getElementById('fibre-lead-estate')?.value || '';
      const isp = document.getElementById('fibre-lead-isp')?.value || 'Safaricom Fibre';

      try {
        await fetch('/api/leads/fibre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, estate, isp })
        });
      } catch (err) {
        console.warn('Fibre lead submission offline sync');
      }

      if (window.app) {
        window.app.closeModal('modal-lead-fibre');
        window.app.showToast(`📶 Installation request for ${isp} in ${estate} received! An engineer will call ${phone}.`, 'success');
      }
    };
  }
}

window.monetization = new MonetizationEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.monetization.init();
});
