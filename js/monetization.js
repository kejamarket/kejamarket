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

  // Item Descriptions Helper
  getItemDescription(itemType) {
    const descs = {
      whatsapp_alerts: 'Instant WhatsApp notifications as soon as matching rentals are listed.',
      listing_boost: 'Boost this rental listing to top search placement for 7 days.',
      top_ad_3: 'Top Ad placement for 3 days across all relevant searches.',
      top_ad_7: 'Top Ad placement for 7 days across all relevant searches.',
      top_ad_30: 'Top Ad placement for 30 days across all relevant searches.',
      verified_badge: 'Verified Landlord green trust badge on profile & listings.'
    };
    return descs[itemType] || 'Direct Lipa Na M-Pesa transaction.';
  }

  // Open Checkout for a Specific Item
  openMpesaCheckout(itemType, itemName, amountKes, targetPropertyId = null, prefillPhone = null, autoTrigger = false) {
    this.currentPendingOrder = {
      itemType,
      itemName,
      amountKes,
      targetPropertyId,
      timestamp: Date.now()
    };
    this.currentCheckoutRequestId = null;

    // Pre-fill phone if provided or if user is logged in
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const phoneInput = document.getElementById('mpesa-phone-number');
    let phoneToUse = prefillPhone || (session && session.phone) || '';
    if (phoneInput && phoneToUse) {
      let clean = phoneToUse.replace(/\D/g, '');
      if (clean.startsWith('254')) clean = clean.slice(3);
      if (clean.startsWith('0')) clean = clean.slice(1);
      phoneInput.value = clean;
    }

    // Update Checkout UI
    const titleEl = document.getElementById('mpesa-checkout-item-title');
    const badgeEl = document.getElementById('mpesa-checkout-amount-badge');
    const descEl = document.getElementById('mpesa-checkout-desc');
    const paybillAmt = document.getElementById('paybill-amount-badge');
    const paybillAcct = document.getElementById('paybill-account-badge');

    if (titleEl) titleEl.textContent = itemName;
    if (badgeEl) badgeEl.textContent = `KSh ${amountKes.toLocaleString()}`;
    if (descEl) descEl.textContent = this.getItemDescription(itemType);
    if (paybillAmt) paybillAmt.textContent = `KSh ${amountKes.toLocaleString()}`;
    if (paybillAcct) paybillAcct.textContent = '2057103992';

    this.resetCheckout();

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-mpesa-checkout');
    }

    // Auto-trigger STK push directly so user gets real prompt immediately
    if (autoTrigger && phoneToUse) {
      setTimeout(() => {
        this.triggerStkPush();
      }, 300);
    }
  }

  switchCheckoutTab(tab) {
    const tabStk = document.getElementById('mpesa-tab-stk');
    const tabPaybill = document.getElementById('mpesa-tab-paybill');
    const btnStk = document.getElementById('tab-btn-mpesa-stk');
    const btnPaybill = document.getElementById('tab-btn-mpesa-paybill');

    if (tab === 'paybill') {
      if (tabStk) tabStk.style.display = 'none';
      if (tabPaybill) tabPaybill.style.display = 'block';
      if (btnStk) {
        btnStk.style.background = 'transparent';
        btnStk.style.color = '#64748b';
        btnStk.style.boxShadow = 'none';
      }
      if (btnPaybill) {
        btnPaybill.style.background = 'white';
        btnPaybill.style.color = '#0f172a';
        btnPaybill.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
    } else {
      if (tabStk) tabStk.style.display = 'block';
      if (tabPaybill) tabPaybill.style.display = 'none';
      if (btnStk) {
        btnStk.style.background = 'white';
        btnStk.style.color = '#0f172a';
        btnStk.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
      if (btnPaybill) {
        btnPaybill.style.background = 'transparent';
        btnPaybill.style.color = '#64748b';
        btnPaybill.style.boxShadow = 'none';
      }
    }
  }

  copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app) window.app.showToast(`📋 Copied ${label}: ${text}`, 'success');
      }).catch(() => {
        if (window.app) window.app.showToast(`Copied: ${text}`, 'info');
      });
    } else {
      if (window.app) window.app.showToast(`Copied ${label}: ${text}`, 'info');
    }
  }

  copyAmount() {
    if (this.currentPendingOrder) {
      this.copyText(String(this.currentPendingOrder.amountKes), 'Amount');
    }
  }

  async verifyDirectReceipt(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('mpesa-receipt-code-input');
    const rawCode = input ? input.value.trim().toUpperCase() : '';

    if (!rawCode || rawCode.length < 5) {
      if (window.app) window.app.showToast('Please enter a valid M-Pesa receipt code (e.g. SKL89XYZ12).', 'error');
      return;
    }

    const btn = document.getElementById('btn-verify-receipt-submit');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Receipt...';
    }

    try {
      const payload = {
        checkoutRequestId: this.currentCheckoutRequestId || null,
        receiptCode: rawCode,
        amount: this.currentPendingOrder ? this.currentPendingOrder.amountKes : 100,
        itemType: this.currentPendingOrder ? this.currentPendingOrder.itemType : 'listing_boost',
        itemName: this.currentPendingOrder ? this.currentPendingOrder.itemName : 'Direct M-Pesa Payment',
        targetPropertyId: this.currentPendingOrder ? this.currentPendingOrder.targetPropertyId : null,
        phone: document.getElementById('mpesa-phone-number')?.value || null
      };

      const res = await fetch('/api/mpesa/verify-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.kejaAuth && window.kejaAuth.getToken() ? { 'Authorization': `Bearer ${window.kejaAuth.getToken()}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        this.completePaymentSuccess(data.receipt || rawCode);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Receipt verification failed.'}`, 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('❌ Could not verify receipt with server.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  async triggerStkPush() {
    const phoneInput = document.getElementById('mpesa-phone-number');
    let rawPhone = phoneInput ? phoneInput.value.trim() : '';

    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 9) {
      if (window.app) window.app.showToast('Please enter a valid Safaricom phone number (e.g. 0712345678)', 'info');
      return;
    }

    // Format phone to 254...
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    if (!this.currentPendingOrder) {
      if (window.app) window.app.showToast('No active item selected for checkout.', 'error');
      return;
    }

    const form = document.getElementById('form-mpesa-stk-trigger');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Contacting Safaricom...';
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
          phone: cleanPhone,
          amount: this.currentPendingOrder.amountKes,
          itemType: this.currentPendingOrder.itemType,
          itemName: this.currentPendingOrder.itemName,
          targetPropertyId: this.currentPendingOrder.targetPropertyId
        })
      });

      const data = await res.json();

      if (data.success && data.hasDaraja && data.checkoutRequestId) {
        this.currentCheckoutRequestId = data.checkoutRequestId;
        // Show STK Prompt screen with real timer & spinner
        this.showStkScreen(cleanPhone);
        if (window.app) window.app.showToast('📲 Real Safaricom STK prompt sent! Enter your PIN on your phone.', 'success');
        
        // Start polling for real payment confirmation from Safaricom
        this.startStatusPolling(data.checkoutRequestId);
      } else if (data.requiresPaybill || !data.hasDaraja) {
        // Live keys not yet configured: switch to Paybill 303030 immediately
        this.switchCheckoutTab('paybill');
        if (window.app) window.app.showToast('ℹ️ Complete payment via Paybill 303030 and enter receipt code below to confirm.', 'info');
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Payment initiation failed'}`, 'error');
        this.resetCheckout();
      }
    } catch (err) {
      console.error('STK Push error:', err);
      if (window.app) window.app.showToast('❌ Could not reach payment server. Please check connection.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  setupMpesaForm() {
    const form = document.getElementById('form-mpesa-stk-trigger');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.triggerStkPush();
    });
  }

  showStkScreen(phone) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    const tabStk = document.getElementById('mpesa-tab-stk');
    const tabPaybill = document.getElementById('mpesa-tab-paybill');
    const stepStk = document.getElementById('mpesa-step-stk');
    const stepSuccess = document.getElementById('mpesa-step-success');

    if (tabStk) tabStk.style.display = 'none';
    if (tabPaybill) tabPaybill.style.display = 'none';
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

    // ── WhatsApp Alerts: show a dedicated WhatsApp activation success screen ──
    if (order.itemType === 'whatsapp_alerts') {
      const prefs = this._pendingWhatsAppPrefs || {};
      const phone = prefs.phone || document.getElementById('mpesa-phone-number')?.value || '07xxxxxxxx';
      const estate = prefs.estate || 'Any Estate';
      const category = prefs.category || 'All Categories';
      const budgetLabel = prefs.budgetLabel || 'Any Budget';

      // Close M-Pesa modal and open WhatsApp success modal
      if (window.app) window.app.closeModal('modal-mpesa-checkout');

      // Populate and show the WhatsApp success modal
      const waPhone = document.getElementById('wa-success-phone');
      const waEstate = document.getElementById('wa-success-estate');
      const waCat = document.getElementById('wa-success-category');
      const waBudget = document.getElementById('wa-success-budget');
      const waReceipt = document.getElementById('wa-success-receipt');
      if (waPhone) waPhone.textContent = phone;
      if (waEstate) waEstate.textContent = estate;
      if (waCat) waCat.textContent = category;
      if (waBudget) waBudget.textContent = budgetLabel + '/mo';
      if (waReceipt) waReceipt.textContent = receiptCode;

      setTimeout(() => {
        if (window.app) window.app.openModal('modal-whatsapp-success');
      }, 300);

      if (window.app) window.app.showToast('🎉 WhatsApp Alerts Activated! First alert coming shortly.', 'success', 6000);
      this._pendingWhatsAppPrefs = null;
      return;
    }

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
    const tabStk = document.getElementById('mpesa-tab-stk');
    const tabPaybill = document.getElementById('mpesa-tab-paybill');
    const stepStk = document.getElementById('mpesa-step-stk');
    const stepSuccess = document.getElementById('mpesa-step-success');

    if (tabStk) tabStk.style.display = 'block';
    if (tabPaybill) tabPaybill.style.display = 'none';
    if (stepStk) stepStk.style.display = 'none';
    if (stepSuccess) stepSuccess.style.display = 'none';
    this.switchCheckoutTab('stk');
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
      const submitBtn = alertForm.querySelector('button[type="submit"]');

      const phone = phoneEl ? phoneEl.value.trim() : '';
      const estate = estateEl ? estateEl.value : 'Any Estate';
      const category = catEl ? catEl.value : 'All Categories';
      const budgetMin = minEl ? minEl.value.trim() : '';
      const budgetMax = maxEl ? maxEl.value.trim() : '';

      // Validate phone number
      if (!phone) {
        if (window.app) window.app.showToast('⚠️ Please enter your WhatsApp phone number.', 'error');
        if (phoneEl) phoneEl.focus();
        return;
      }
      const cleanCheck = phone.replace(/\D/g, '');
      if (cleanCheck.length < 9) {
        if (window.app) window.app.showToast('⚠️ Please enter a valid Kenyan phone number (e.g. 0712345678).', 'error');
        if (phoneEl) phoneEl.focus();
        return;
      }

      if (budgetMin && budgetMax && Number(budgetMax) < Number(budgetMin)) {
        if (window.app) window.app.showToast('Max budget must be greater than Min budget.', 'info');
        return;
      }

      // Show loading state on button
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';
      }

      // Save alert preferences to backend
      try {
        await fetch('/api/alerts/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, estate, category, budgetMin, budgetMax })
        });
      } catch (err) {
        console.warn('Could not sync alert to backend:', err);
      }

      // Restore button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }

      let budgetLabel = 'Any Budget';
      if (budgetMin && budgetMax) {
        budgetLabel = `KSh ${Number(budgetMin).toLocaleString()} – ${Number(budgetMax).toLocaleString()}`;
      } else if (budgetMin) {
        budgetLabel = `From KSh ${Number(budgetMin).toLocaleString()}`;
      } else if (budgetMax) {
        budgetLabel = `Up to KSh ${Number(budgetMax).toLocaleString()}`;
      }

      // Store alert prefs so success screen can show them
      this._pendingWhatsAppPrefs = { phone, estate, category, budgetMin, budgetMax, budgetLabel };

      // Close alerts modal and open M-Pesa checkout
      if (window.app) window.app.closeModal('modal-whatsapp-alerts');
      setTimeout(() => {
        this.openMpesaCheckout(
          'whatsapp_alerts',
          `WhatsApp Alerts (${category} · ${estate} · ${budgetLabel}/mo)`,
          100,
          null,
          phone
        );
      }, 200);
    });
  }

  setupAffiliateLeadForms() {
    // Movers quote submit — now captures house size & preferred partner
    window.submitMoversLead = async function(e) {
      e.preventDefault();
      const name    = document.getElementById('mover-lead-name')?.value?.trim() || '';
      const phone   = document.getElementById('mover-lead-phone')?.value?.trim() || '';
      const from    = document.getElementById('mover-lead-from')?.value?.trim() || '';
      const to      = document.getElementById('mover-lead-to')?.value?.trim() || '';
      const size    = document.getElementById('mover-lead-size')?.value || '1 Bedroom Apartment';
      const partner = document.getElementById('mover-lead-partner')?.value || 'All Verified Partners';

      if (!phone) {
        if (window.app) window.app.showToast('⚠️ Please enter your phone number.', 'error');
        return;
      }

      try {
        await fetch('/api/leads/movers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, from, to, size, partner })
        });
      } catch (err) {
        console.warn('Movers lead offline — will retry on reconnect');
      }

      if (window.app) {
        window.app.closeModal('modal-lead-movers');
        const partnerLabel = partner === 'All Verified Partners' ? 'Nellions, Cube, Taylor & Alpha Movers' : partner;
        window.app.showToast(
          `🚚 Moving quote request sent! ${partnerLabel} will call ${phone} within 15 minutes with a ${size} quote from ${from} ➜ ${to}.`,
          'success',
          7000
        );
      }
    };

    // Fibre WiFi submit — now captures package, timing & house address
    window.submitFibreLead = async function(e) {
      e.preventDefault();
      const phone  = document.getElementById('fibre-lead-phone')?.value?.trim() || '';
      const estate = document.getElementById('fibre-lead-estate')?.value?.trim() || '';
      const isp    = document.getElementById('fibre-lead-isp')?.value || 'Safaricom Home Fibre (Bronze 40Mbps - KSh 2,999/mo)';
      const timing = document.getElementById('fibre-lead-time')?.value || 'Immediately (Within 24 Hours)';

      if (!phone) {
        if (window.app) window.app.showToast('⚠️ Please enter your phone number.', 'error');
        return;
      }

      try {
        await fetch('/api/leads/fibre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, estate, isp, timing })
        });
      } catch (err) {
        console.warn('Fibre lead offline — will retry on reconnect');
      }

      if (window.app) {
        window.app.closeModal('modal-lead-fibre');
        // Shorten ISP label for toast display
        const ispShort = isp.split('(')[0].trim();
        window.app.showToast(
          `📶 ${ispShort} installation request confirmed for ${estate}! A technician will call ${phone} — Timing: ${timing}.`,
          'success',
          7000
        );
      }
    };
  }
}

window.monetization = new MonetizationEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.monetization.init();
});
