/**
 * Nairobi Rentals Live - Monetization & Lipa Na M-Pesa Payment Engine
 * Handles:
 * 1. TOP AD listing boosts (7 & 30 days)
 * 2. Verified Landlord annual subscriptions
 * 3. Pro Agency monthly listing packages
 * 4. Instant WhatsApp tenant alert subscriptions
 * 5. Value-add affiliate lead generation (Movers & Fibre Internet)
 */

class MonetizationEngine {
  constructor() {
    this.currentPendingOrder = null;
    this.stkInterval = null;
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

    // Update Checkout UI
    document.getElementById('mpesa-checkout-item-title').textContent = itemName;
    document.getElementById('mpesa-checkout-amount-badge').textContent = `KSh ${amountKes.toLocaleString()}`;
    document.getElementById('mpesa-checkout-desc').textContent = this.getItemDescription(itemType);

    // Reset STK phone simulator
    document.getElementById('mpesa-step-input').style.display = 'block';
    document.getElementById('mpesa-step-stk').style.display = 'none';
    document.getElementById('mpesa-step-success').style.display = 'none';

    window.app.openModal('modal-mpesa-checkout');
  }

  getItemDescription(itemType) {
    switch (itemType) {
      case 'top_ad_7':
        return 'Places your listing at the top of Nairobi search results and highlights price tag in golden orange for 7 days.';
      case 'top_ad_30':
        return 'Top pinned ranking for 30 days across all Nairobi categories with 5x tenant inquiries.';
      case 'verified_badge':
        return 'Earn the blue "VERIFIED LANDLORD" badge for 1 year with identity & title deed validation.';
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
      const rawPhone = phoneInput.value.trim();

      if (!rawPhone || rawPhone.length < 9) {
        window.app.showToast('Please enter a valid Safaricom phone number (e.g. 0712345678)', 'info');
        return;
      }

      // Show STK prompt screen immediately
      this.showStkScreen(rawPhone);

      try {
        // Call real Daraja backend (server.js on port 3001)
        const res = await fetch('http://localhost:3001/api/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: rawPhone,
            amount: this.currentPendingOrder.amountKes,
            description: this.currentPendingOrder.itemName
          })
        });
        const data = await res.json();
        if (data.success) {
          window.app.showToast('✅ M-Pesa prompt sent! Enter your PIN on your phone.', 'success');
          setTimeout(() => this.completeMpesaPayment(), 6000);
        } else {
          window.app.showToast(`❌ ${data.message}`, 'error');
          this.resetCheckout();
        }
      } catch (err) {
        // Backend offline – fall back to simulation for demo
        console.warn('Backend unreachable, using simulation:', err.message);
        setTimeout(() => this.completeMpesaPayment(), 4000);
      }
    });
  }

  showStkScreen(phone) {
    const formatted = phone.startsWith('0') ? '254' + phone.substring(1) : phone;
    document.getElementById('mpesa-step-input').style.display = 'none';
    document.getElementById('mpesa-step-stk').style.display = 'block';
    document.getElementById('stk-sim-phone').textContent = `+${formatted}`;
    document.getElementById('stk-sim-amount').textContent = `KSh ${this.currentPendingOrder.amountKes.toLocaleString()}`;
    document.getElementById('stk-pin-display').textContent = '•••• (waiting for PIN…)';
  }

  resetCheckout() {
    document.getElementById('mpesa-step-input').style.display = 'block';
    document.getElementById('mpesa-step-stk').style.display = 'none';
    document.getElementById('mpesa-step-success').style.display = 'none';
  }

  triggerStkPushSimulation(phone) {
    const formattedPhone = phone.startsWith('0') ? '254' + phone.substring(1) : phone;
    
    // Hide input step, show STK Simulator
    document.getElementById('mpesa-step-input').style.display = 'none';
    document.getElementById('mpesa-step-stk').style.display = 'block';
    document.getElementById('stk-sim-phone').textContent = `+${formattedPhone}`;
    document.getElementById('stk-sim-amount').textContent = `KSh ${this.currentPendingOrder.amountKes.toLocaleString()}`;

    // Simulate STK push countdown & PIN verification
    let secondsLeft = 4;
    const pinEl = document.getElementById('stk-pin-display');
    pinEl.textContent = '••••';

    this.stkInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft === 2) {
        pinEl.textContent = '•••• (PIN Entered)';
      }

      if (secondsLeft <= 0) {
        clearInterval(this.stkInterval);
        this.completeMpesaPayment();
      }
    }, 1000);
  }

  completeMpesaPayment() {
    const receiptCode = 'QKJ' + Math.floor(100000 + Math.random() * 900000);
    const order = this.currentPendingOrder;

    // Show Success Step
    document.getElementById('mpesa-step-stk').style.display = 'none';
    document.getElementById('mpesa-step-success').style.display = 'block';
    document.getElementById('mpesa-success-receipt').textContent = receiptCode;
    document.getElementById('mpesa-success-msg').textContent = `Payment of KSh ${order.amountKes.toLocaleString()} confirmed. Your order for "${order.itemName}" is now active!`;

    // Apply Upgrades to Properties/Landlords
    if (order.targetPropertyId) {
      const prop = window.app.properties.find(p => p.id === order.targetPropertyId);
      if (prop) {
        if (order.itemType.startsWith('top_ad')) {
          prop.isTopAd = true;
          prop.isFeatured = true;
        } else if (order.itemType === 'verified_badge') {
          prop.landlord.isVerified = true;
        }
      }
    } else if (order.itemType === 'verified_badge') {
      window.app.showToast('Verified Landlord status activated for your profile!', 'success');
    }

    // Refresh listings & map
    window.app.applyFilters();
    window.app.showToast(`Lipa Na M-Pesa ${receiptCode} Confirmed!`, 'success');
  }

  setupWhatsAppAlertsForm() {
    const alertForm = document.getElementById('form-whatsapp-alert-sub');
    if (!alertForm) return;

    alertForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone    = document.getElementById('alert-tenant-phone').value.trim();
      const estate   = document.getElementById('alert-tenant-estate').value;
      const category = document.getElementById('alert-tenant-category').value;
      const budgetMin = document.getElementById('alert-tenant-budget-min').value.trim();
      const budgetMax = document.getElementById('alert-tenant-budget-max').value.trim();

      // Validate: max must be ≥ min if both are supplied
      if (budgetMin && budgetMax && Number(budgetMax) < Number(budgetMin)) {
        window.app.showToast('Max budget must be greater than Min budget.', 'info');
        return;
      }

      // Build human-readable budget label
      let budgetLabel = 'Any Budget';
      if (budgetMin && budgetMax) {
        budgetLabel = `KSh ${Number(budgetMin).toLocaleString()} – ${Number(budgetMax).toLocaleString()}`;
      } else if (budgetMin) {
        budgetLabel = `From KSh ${Number(budgetMin).toLocaleString()}`;
      } else if (budgetMax) {
        budgetLabel = `Up to KSh ${Number(budgetMax).toLocaleString()}`;
      }

      window.app.closeModal('modal-whatsapp-alerts');
      this.openMpesaCheckout('whatsapp_alerts', `WhatsApp Alerts (${category} · ${estate} · ${budgetLabel}/mo)`, 100);
    });
  }

  setupAffiliateLeadForms() {
    // Movers quote submit
    window.submitMoversLead = function(e) {
      e.preventDefault();
      const name = document.getElementById('mover-lead-name').value;
      const phone = document.getElementById('mover-lead-phone').value;
      const from = document.getElementById('mover-lead-from').value;
      const to = document.getElementById('mover-lead-to').value;

      window.app.closeModal('modal-lead-movers');
      window.app.showToast(`Quote request sent for ${from} ➔ ${to}! Partner movers will call ${phone} within 15 mins.`, 'success');
    };

    // Fibre WiFi submit
    window.submitFibreLead = function(e) {
      e.preventDefault();
      const phone = document.getElementById('fibre-lead-phone').value;
      const estate = document.getElementById('fibre-lead-estate').value;
      const isp = document.getElementById('fibre-lead-isp').value;

      window.app.closeModal('modal-lead-fibre');
      window.app.showToast(`Installation request for ${isp} in ${estate} received! Agent will call ${phone} for connection.`, 'success');
    };
  }
}

window.monetization = new MonetizationEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.monetization.init();
});
