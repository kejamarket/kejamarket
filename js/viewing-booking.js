/**
 * KejaMarket Viewing Booking Flow (Spec v1.1)
 * Manages:
 * 1. Slot selection (preferred & alternative dates/times)
 * 2. 60-second real-time countdown & escalation state polling
 * 3. No-show policy acceptance audit
 * 4. KSh 200 M-Pesa STK push & receipt verification
 * 5. Instant unlock of exact GPS coordinates and caretaker contacts
 */

const KejaViewing = {
  currentProperty: null,
  activeRequest: null,
  activeBooking: null,
  pollTimer: null,
  countdownInterval: null,
  remainingSeconds: 60,

  /**
   * Open the viewing booking modal for a property
   */
  async openBookingModal(propertyId) {
    if (!propertyId && app.selectedPropertyForDetail) {
      propertyId = app.selectedPropertyForDetail.id;
    }

    if (!propertyId) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast('Please select a property first.', 'error');
      }
      return;
    }

    // Require tenant sign-in before booking
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    if (!token) {
      if (window.kejaAuth && typeof kejaAuth.requireTenantAuth === 'function') {
        kejaAuth.requireTenantAuth(() => KejaViewing.openBookingModal(propertyId));
      } else {
        app.openModal('modal-auth');
      }
      return;
    }

    try {
      if (!app.selectedPropertyForDetail || app.selectedPropertyForDetail.id !== propertyId) {
        const res = await fetch(`/api/properties/${propertyId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.property) {
          this.currentProperty = data.property;
        }
      } else {
        this.currentProperty = app.selectedPropertyForDetail;
      }
    } catch (err) {
      console.warn('Property fetch for booking:', err);
    }

    // Check if tenant already has an active or confirmed viewing request for this property
    try {
      const checkRes = await fetch(`/api/viewings/property/${propertyId}/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const checkData = await checkRes.json();
      if (checkData.success && checkData.request) {
        this.activeRequest = checkData.request;
        this.renderActiveRequestView(checkData.request);
        app.openModal('modal-viewing-booking');
        return;
      }
    } catch (err) {
      console.warn('Check active viewing:', err);
    }

    // New booking form
    this.renderInitialBookingForm();
    app.openModal('modal-viewing-booking');
  },

  /**
   * Render initial date/time picker form
   */
  renderInitialBookingForm() {
    this.stopPolling();
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    const prop = this.currentProperty || {};
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    container.innerHTML = `
      <div class="viewing-flow-step" id="viewing-step-form">
        <div style="background: linear-gradient(135deg, #f0fdf4, #e8fbf0); border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #00b53f; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #166534;">Verified Property Viewing</div>
            <div style="font-size: 0.8rem; color: #15803d; line-height: 1.35;">
              ${prop.title ? prop.title : 'Selected Listing'} • KSh ${Number(prop.rentKes || prop.rent || 0).toLocaleString()}/mo
            </div>
          </div>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.82rem; color: #92400e;">
          <div style="font-weight: 700; margin-bottom: 2px;"><i class="fas fa-shield-alt"></i> KejaMarket Viewing Assurance</div>
          Free to request. Property manager confirms within <strong>60 seconds</strong>. Once confirmed, pay only the official <strong>KSh 200 platform fee</strong> via M-Pesa to lock your slot and unlock exact GPS & caretaker contacts.
        </div>

        <form id="viewing-request-form" onsubmit="KejaViewing.handleFormSubmit(event)">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
              Preferred Viewing Date <span style="color: #ef4444;">*</span>
            </label>
            <input type="date" id="vr-preferred-date" min="${today}" max="${maxDate}" value="${today}" required
              style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #0f172a; outline: none; box-sizing: border-box;">
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
              Preferred Time Slot <span style="color: #ef4444;">*</span>
            </label>
            <select id="vr-preferred-time" required
              style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #0f172a; outline: none; box-sizing: border-box; background: white;">
              <option value="09:00 AM - 10:00 AM">Morning: 09:00 AM - 10:00 AM</option>
              <option value="10:00 AM - 11:00 AM">Morning: 10:00 AM - 11:00 AM</option>
              <option value="11:00 AM - 12:00 PM">Midday: 11:00 AM - 12:00 PM</option>
              <option value="02:00 PM - 03:00 PM" selected>Afternoon: 02:00 PM - 03:00 PM</option>
              <option value="03:00 PM - 04:00 PM">Afternoon: 03:00 PM - 04:00 PM</option>
              <option value="04:00 PM - 05:00 PM">Evening: 04:00 PM - 05:00 PM</option>
              <option value="05:00 PM - 06:00 PM">Evening: 05:00 PM - 06:00 PM</option>
            </select>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 5px;">
              Alternative Date / Time (Optional fallback)
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <input type="date" id="vr-alt-date" min="${today}" max="${maxDate}"
                style="padding: 9px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #0f172a; box-sizing: border-box;">
              <select id="vr-alt-time"
                style="padding: 9px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #0f172a; background: white; box-sizing: border-box;">
                <option value="">Any time slot</option>
                <option value="Morning (9am - 12pm)">Morning (9am - 12pm)</option>
                <option value="Afternoon (2pm - 5pm)">Afternoon (2pm - 5pm)</option>
                <option value="Evening (5pm - 6:30pm)">Evening (5pm - 6:30pm)</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 5px;">
              Notes for Property Manager / Caretaker (Optional)
            </label>
            <input type="text" id="vr-notes" placeholder="e.g. Coming with spouse, interested in immediate move-in"
              style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #0f172a; box-sizing: border-box;">
          </div>

          <button type="submit" id="vr-submit-btn" class="btn-primary"
            style="width: 100%; padding: 13px; font-size: 0.95rem; font-weight: 800; border-radius: 9px; background: #00b53f; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 6px rgba(0,181,63,0.3);">
            <i class="fas fa-paper-plane"></i> Request Viewing Appointment
          </button>
        </form>
      </div>
    `;
  },

  /**
   * Handle initial submission of viewing request
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    if (!token) {
      app.showToast('Please sign in to book a viewing.', 'error');
      return;
    }

    const preferredDate = document.getElementById('vr-preferred-date')?.value;
    const preferredTime = document.getElementById('vr-preferred-time')?.value;
    const alternateDate = document.getElementById('vr-alt-date')?.value;
    const alternateTime = document.getElementById('vr-alt-time')?.value;
    const notes = document.getElementById('vr-notes')?.value;
    const propertyId = this.currentProperty ? this.currentProperty.id : (app.selectedPropertyForDetail && app.selectedPropertyForDetail.id);

    const submitBtn = document.getElementById('vr-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    try {
      const res = await fetch('/api/viewings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId,
          preferredDate,
          preferredTime,
          alternateDate,
          alternateTime,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit viewing request');
      }

      this.activeRequest = data.request;
      this.startCountdownAndPoll(data.request);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Viewing Appointment';
      }
      app.showToast(err.message || 'Submission failed. Try again.', 'error');
    }
  },

  /**
   * Start 60s countdown and poll server status
   */
  startCountdownAndPoll(request) {
    this.remainingSeconds = 60;
    this.renderWaitingView(request);

    // Countdown interval
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.remainingSeconds--;
      const timerEl = document.getElementById('vr-countdown-sec');
      const progressEl = document.getElementById('vr-countdown-bar');

      if (timerEl) {
        timerEl.textContent = Math.max(0, this.remainingSeconds) + 's';
      }
      if (progressEl) {
        const pct = Math.max(0, (this.remainingSeconds / 60) * 100);
        progressEl.style.width = pct + '%';
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);

    // Poll status every 3 seconds
    this.startPolling(request.id);
  },

  /**
   * Start status polling
   */
  startPolling(requestId) {
    this.stopPolling();
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');

    this.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/viewings/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.request) {
          const req = data.request;
          this.activeRequest = req;

          // Transition checks
          if (req.status === 'slot_confirmed_awaiting_payment') {
            this.stopPolling();
            this.renderPaymentView(req);
          } else if (req.status === 'booking_confirmed' || req.contact_unlocked_at) {
            this.stopPolling();
            this.renderUnlockedView(req);
          } else if (req.status === 'declined') {
            this.stopPolling();
            this.renderDeclinedView(req);
          } else if (req.status === 'escalated_to_admin') {
            const statusBadge = document.getElementById('vr-status-badge');
            const statusDesc = document.getElementById('vr-status-desc');
            if (statusBadge) {
              statusBadge.innerHTML = '<i class="fas fa-headset"></i> KejaMarket Staff Live on Call';
              statusBadge.style.background = '#e0e7ff';
              statusBadge.style.color = '#3730a3';
            }
            if (statusDesc) {
              statusDesc.textContent = '60s SLA elapsed. Our operations team is contacting the property manager now to confirm your appointment.';
            }
          }
        }
      } catch (pollErr) {
        console.warn('Viewing status poll warning:', pollErr);
      }
    }, 3000);
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  },

  /**
   * Render waiting view with countdown
   */
  renderWaitingView(req) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 10px 4px;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #f0fdf4; border: 3px solid #bbf7d0; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; position: relative;">
          <i class="fas fa-clock" style="font-size: 2rem; color: #00b53f;"></i>
        </div>

        <div id="vr-status-badge" style="display: inline-block; background: #fef3c7; color: #92400e; font-size: 0.8rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;">
          <i class="fas fa-spinner fa-spin"></i> Awaiting Property Confirmation
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
          Checking Availability...
        </h3>

        <p id="vr-status-desc" style="font-size: 0.86rem; color: #64748b; line-height: 1.5; margin: 0 auto 16px auto; max-width: 320px;">
          We dispatched a real-time availability alert to the property manager. Response SLA: <strong>60 seconds</strong>.
        </p>

        <!-- Countdown Visual -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #475569;">Auto-Escalation SLA:</span>
            <span id="vr-countdown-sec" style="font-size: 1.1rem; font-weight: 900; color: #00b53f; font-family: monospace;">60s</span>
          </div>
          <div style="height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div id="vr-countdown-bar" style="height: 100%; width: 100%; background: #00b53f; transition: width 1s linear;"></div>
          </div>
          <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 6px;">
            If no response in 60s, our operations desk calls the caretaker directly.
          </div>
        </div>

        <div style="background: #f1f5f9; border-radius: 8px; padding: 10px 14px; text-align: left; font-size: 0.82rem; color: #334155; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Requested Slot:</div>
          <div><i class="fas fa-calendar-day" style="color:#00b53f; width:16px;"></i> ${req.preferred_date} • ${req.preferred_time}</div>
        </div>

        <button type="button" class="btn-secondary" onclick="app.closeModal('modal-viewing-booking')"
          style="padding: 9px 20px; font-size: 0.85rem; border-radius: 8px; border: 1.5px solid #cbd5e1; background: white; cursor: pointer; color: #475569;">
          Keep Waiting in Background
        </button>
      </div>
    `;
  },

  /**
   * Render payment view once slot confirmed
   */
  renderPaymentView(req) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    const userPhone = localStorage.getItem('user_phone') || '';

    container.innerHTML = `
      <div style="padding: 4px;">
        <div style="background: #dcfce7; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #00b53f; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
            <i class="fas fa-check"></i>
          </div>
          <div>
            <div style="font-weight: 900; font-size: 1rem; color: #166534;">Viewing Slot Confirmed!</div>
            <div style="font-size: 0.82rem; color: #15803d;">
              ${req.confirmed_date || req.preferred_date} at <strong>${req.confirmed_time || req.preferred_time}</strong>
            </div>
          </div>
        </div>

        <div style="background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
            <span style="font-size: 0.85rem; color: #64748b;">Viewing Commitment Fee</span>
            <span style="font-size: 1.15rem; font-weight: 900; color: #00b53f;">KSh 200</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b;">
            <span>Payment Window</span>
            <span style="font-weight: 700; color: #d97706;"><i class="fas fa-stopwatch"></i> 15 Minutes Remaining</span>
          </div>
        </div>

        <!-- No-show policy acknowledgment -->
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; margin-bottom: 16px;">
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="vr-policy-checkbox" required style="margin-top: 3px; accent-color: #00b53f;">
            <span style="font-size: 0.78rem; color: #78350f; line-height: 1.45;">
              I acknowledge the <strong>No-Show Policy</strong>: KSh 200 reserves this dedicated viewing slot. The fee is non-refundable if I fail to attend without 3 hours advance notice.
            </span>
          </label>
        </div>

        <!-- M-Pesa STK Push Form -->
        <form id="vr-payment-form" onsubmit="KejaViewing.handlePaymentSubmit(event, '${req.id}')">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
              M-Pesa Phone Number <span style="color: #ef4444;">*</span>
            </label>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 11px; font-weight: 700; color: #64748b; font-size: 0.9rem;">+254</span>
              <input type="tel" id="vr-mpesa-phone" placeholder="712345678" value="${userPhone.replace(/^254/, '').replace(/^0/, '')}" required
                style="width: 100%; padding: 10px 12px 10px 54px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; font-weight: 700; color: #0f172a; outline: none; box-sizing: border-box;">
            </div>
          </div>

          <button type="submit" id="vr-pay-btn" class="btn-primary"
            style="width: 100%; padding: 13px; font-size: 0.98rem; font-weight: 800; border-radius: 9px; background: #00b53f; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 6px rgba(0,181,63,0.3);">
            <i class="fas fa-lock"></i> Pay KSh 200 & Unlock GPS / Contact
          </button>
        </form>

        <div style="text-align: center; margin-top: 12px;">
          <button type="button" onclick="KejaViewing.showReceiptVerifyForm('${req.id}')"
            style="background: none; border: none; color: #64748b; font-size: 0.78rem; text-decoration: underline; cursor: pointer;">
            Already paid? Enter M-Pesa receipt code
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Handle M-Pesa STK push payment
   */
  async handlePaymentSubmit(e, requestId) {
    e.preventDefault();
    const policyCb = document.getElementById('vr-policy-checkbox');
    if (!policyCb || !policyCb.checked) {
      app.showToast('Please accept the No-Show policy to proceed.', 'error');
      return;
    }

    const phoneRaw = document.getElementById('vr-mpesa-phone')?.value;
    if (!phoneRaw) {
      app.showToast('Enter your M-Pesa phone number.', 'error');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    const payBtn = document.getElementById('vr-pay-btn');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending STK Prompt...';
    }

    try {
      // 1. Audit policy acceptance
      await fetch(`/api/viewings/${requestId}/accept-policy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Initiate STK push
      const res = await fetch(`/api/viewings/${requestId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: phoneRaw })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment initiation failed');
      }

      // 3. Render STK Prompt Waiting view
      this.renderPaymentPromptWaiting(requestId, data.checkoutRequestId, phoneRaw);
    } catch (err) {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-lock"></i> Pay KSh 200 & Unlock GPS / Contact';
      }
      app.showToast(err.message || 'Failed to initiate payment. Please retry.', 'error');
    }
  },

  /**
   * Render waiting screen while tenant enters PIN on phone
   */
  renderPaymentPromptWaiting(requestId, checkoutRequestId, phone) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 14px 4px;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #eff6ff; border: 3px solid #bfdbfe; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <i class="fas fa-mobile-alt" style="font-size: 2rem; color: #2563eb;"></i>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
          Check Your Phone
        </h3>

        <p style="font-size: 0.86rem; color: #475569; line-height: 1.5; margin: 0 auto 16px auto; max-width: 320px;">
          An M-Pesa PIN prompt for <strong>KSh 200</strong> has been sent to <strong>+254 ${phone.replace(/^254/, '')}</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 0.82rem; color: #64748b;">
          <i class="fas fa-spinner fa-spin" style="color: #00b53f;"></i> Waiting for confirmation... Once you enter your PIN, this screen unlocks automatically.
        </div>

        <button type="button" onclick="KejaViewing.showReceiptVerifyForm('${requestId}', '${checkoutRequestId}')" class="btn-secondary"
          style="padding: 10px 18px; font-size: 0.85rem; border-radius: 8px; border: 1.5px solid #cbd5e1; background: white; cursor: pointer; color: #334155;">
          Enter Receipt Code Manually
        </button>
      </div>
    `;

    // Poll checkout request status every 2.5 seconds
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    const pollPayment = setInterval(async () => {
      try {
        if (!checkoutRequestId) return;
        const res = await fetch(`/api/mpesa/status/${checkoutRequestId}`);
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          clearInterval(pollPayment);
          // Fetch unlocked data
          const unlockRes = await fetch(`/api/viewings/${requestId}/unlock`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const unlockData = await unlockRes.json();
          if (unlockData.success && unlockData.data) {
            this.renderUnlockedView(unlockData.data);
          }
        }
      } catch (e) {
        console.warn('Payment poll check:', e);
      }
    }, 2500);

    // Timeout polling after 2 minutes
    setTimeout(() => clearInterval(pollPayment), 120000);
  },

  /**
   * Manual receipt verification fallback
   */
  showReceiptVerifyForm(requestId, checkoutRequestId = '') {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 6px;">
        <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
          Verify M-Pesa Receipt
        </h3>
        <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 14px;">
          Enter the 10-character Safaricom M-Pesa receipt code received on your phone (e.g. QKJ89XYZ12).
        </p>

        <form id="vr-receipt-form" onsubmit="KejaViewing.handleManualReceiptSubmit(event, '${requestId}', '${checkoutRequestId}')">
          <div style="margin-bottom: 14px;">
            <input type="text" id="vr-receipt-input" maxlength="10" placeholder="e.g. QKJ89XYZ12" required
              style="width: 100%; padding: 11px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 1rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; box-sizing: border-box;">
          </div>

          <button type="submit" id="vr-verify-btn" class="btn-primary"
            style="width: 100%; padding: 12px; font-size: 0.92rem; font-weight: 800; border-radius: 8px; background: #00b53f; border: none; color: white; cursor: pointer;">
            Verify & Unlock Details
          </button>
        </form>

        <button type="button" onclick="KejaViewing.openBookingModal('${this.currentProperty ? this.currentProperty.id : ''}')"
          style="display: block; width: 100%; margin-top: 10px; background: none; border: none; font-size: 0.8rem; color: #64748b; cursor: pointer; text-decoration: underline;">
          Back to payment options
        </button>
      </div>
    `;
  },

  async handleManualReceiptSubmit(e, requestId, checkoutRequestId) {
    e.preventDefault();
    const code = document.getElementById('vr-receipt-input')?.value?.trim().toUpperCase();
    if (!code || code.length !== 10) {
      app.showToast('Please enter a valid 10-character Safaricom receipt code.', 'error');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    const btn = document.getElementById('vr-verify-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    }

    try {
      const res = await fetch('/api/mpesa/verify-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiptCode: code,
          amount: 200,
          itemType: 'viewing_fee',
          itemName: 'Viewing Commitment Fee',
          targetPropertyId: requestId,
          checkoutRequestId: checkoutRequestId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verification failed');
      }

      // Fetch unlocked data
      const unlockRes = await fetch(`/api/viewings/${requestId}/unlock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unlockData = await unlockRes.json();
      if (unlockData.success && unlockData.data) {
        this.renderUnlockedView(unlockData.data);
      } else {
        app.showToast('Payment confirmed! Refreshing...', 'success');
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verify & Unlock Details';
      }
      app.showToast(err.message || 'Verification failed. Check code and retry.', 'error');
    }
  },

  /**
   * Render Unlocked Confirmation Pass (Post-Payment Unlock)
   */
  renderUnlockedView(unlockedData) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    const contactName = unlockedData.contact?.name || 'Property Caretaker';
    const contactPhone = unlockedData.contact?.phone || '+254792409540';
    const exactLoc = unlockedData.location?.exact || 'Building Gate';
    const lat = unlockedData.location?.latitude;
    const lng = unlockedData.location?.longitude;
    const mapLink = (lat && lng) ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : '#';

    container.innerHTML = `
      <div style="padding: 2px;">
        <div style="background: linear-gradient(135deg, #059669, #047857); color: white; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; text-align: center; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); margin-bottom: 8px;">
            <i class="fas fa-check-circle" style="font-size: 1.6rem; color: #a7f3d0;"></i>
          </div>
          <div style="font-size: 0.76rem; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; opacity: 0.85;">Confirmed Viewing Pass</div>
          <h2 style="font-size: 1.25rem; font-weight: 900; margin: 4px 0 2px 0; color: white;">
            ${unlockedData.propertyTitle || 'Property Viewing'}
          </h2>
          <div style="font-size: 0.86rem; color: #d1fae5; font-weight: 700;">
            <i class="fas fa-calendar-alt"></i> ${unlockedData.viewingDate} • <i class="fas fa-clock"></i> ${unlockedData.viewingTime}
          </div>
        </div>

        <!-- Caretaker Card with Direct Call -->
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;">
          <div style="font-size: 0.74rem; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 6px;">
            <i class="fas fa-user-shield" style="color: #00b53f;"></i> Unlocked On-Site Contact
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 1rem; font-weight: 900; color: #0f172a;">${contactName}</div>
              <div style="font-size: 0.86rem; color: #059669; font-weight: 800;">${contactPhone}</div>
            </div>
            <a href="tel:${contactPhone}" class="btn-primary"
              style="padding: 9px 18px; font-size: 0.85rem; font-weight: 800; border-radius: 8px; background: #00b53f; color: white; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fas fa-phone-alt"></i> Call Now
            </a>
          </div>
        </div>

        <!-- Exact GPS Pin Card -->
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;">
          <div style="font-size: 0.74rem; text-transform: uppercase; font-weight: 800; color: #1e40af; margin-bottom: 6px;">
            <i class="fas fa-map-marked-alt" style="color: #2563eb;"></i> Exact GPS & Landmark Location
          </div>
          <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 10px;">
            ${exactLoc}
          </div>
          ${lat && lng ? `
            <a href="${mapLink}" target="_blank" class="btn-secondary"
              style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; font-size: 0.86rem; font-weight: 800; border-radius: 8px; background: white; border: 1.5px solid #93c5fd; color: #1d4ed8; text-decoration: none;">
              <i class="fas fa-directions"></i> Open Turn-by-Turn Google Maps
            </a>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
          <span>Receipt: <strong>${unlockedData.receiptId || 'KM-CONFIRMED'}</strong></span>
          <span>Status: <strong style="color: #059669;">Verified Paid</strong></span>
        </div>

        <button type="button" class="btn-secondary" onclick="app.closeModal('modal-viewing-booking')"
          style="width: 100%; margin-top: 14px; padding: 10px; font-size: 0.86rem; border-radius: 8px; border: 1.5px solid #cbd5e1; background: white; cursor: pointer; color: #475569; font-weight: 700;">
          Close & View Listing
        </button>
      </div>
    `;

    // Also update any open property detail modal with the unlocked contact & maps
    if (this.currentProperty) {
      this.currentProperty.contactLocked = false;
      this.currentProperty.gpsLocked = false;
      this.currentProperty.caretakerPhone = contactPhone;
      this.currentProperty.caretakerName = contactName;
      if (lat) this.currentProperty.latitude = lat;
      if (lng) this.currentProperty.longitude = lng;
    }
  },

  /**
   * Render view when active request exists
   */
  renderActiveRequestView(req) {
    if (req.status === 'slot_confirmed_awaiting_payment') {
      this.renderPaymentView(req);
    } else if (req.status === 'booking_confirmed' || req.contact_unlocked_at) {
      this.fetchAndRenderUnlocked(req.id);
    } else if (req.status === 'declined') {
      this.renderDeclinedView(req);
    } else {
      this.renderWaitingView(req);
      this.startPolling(req.id);
    }
  },

  async fetchAndRenderUnlocked(requestId) {
    const token = localStorage.getItem('token') || localStorage.getItem('keja_token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`/api/viewings/${requestId}/unlock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        this.renderUnlockedView(data.data);
      }
    } catch (e) {
      console.warn('Fetch unlocked viewing:', e);
    }
  },

  renderDeclinedView(req) {
    const container = document.getElementById('viewing-modal-body');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 16px 6px;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: inline-flex; align-items: center; justify-content: center; font-size: 1.8rem; margin-bottom: 12px;">
          <i class="fas fa-times-circle"></i>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #991b1b; margin: 0 0 6px 0;">Viewing Request Declined</h3>
        <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin: 0 auto 16px auto; max-width: 320px;">
          ${req.decline_reason || 'The property manager is unavailable at your requested time. No fees were charged.'}
        </p>
        <button type="button" class="btn-primary" onclick="KejaViewing.renderInitialBookingForm()"
          style="padding: 11px 22px; font-size: 0.9rem; font-weight: 800; border-radius: 8px; background: #00b53f; color: white; border: none; cursor: pointer;">
          Choose Another Date / Time
        </button>
      </div>
    `;
  }
};

window.KejaViewing = KejaViewing;
