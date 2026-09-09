/**
 * KejaMarket – Real Authentication Engine & Anti-Fraud Phone Verification
 * Connected to live backend JWT + Bcrypt API (/api/auth)
 * Handles phone SMS OTP verification for Tenant, Landlord, and Agency sign-up & sign-in.
 */

const kejaAuth = (() => {
  // Current selected role per panel: 'tenant', 'landlord', or 'agency'
  const state = { 
    signinRole: 'tenant', 
    signupRole: 'tenant',
    signinMode: 'otp' // 'otp' | 'password'
  };

  // API Base URL (defaults to relative path or current host)
  const API_BASE = '';

  let pendingPhone = '';
  let pendingFlow = 'signup'; // 'signup' | 'login'
  let otpTimerInterval = null;

  /* ─────────────────────────────────────────
     SESSION & TOKEN HELPERS
  ───────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem('keja_token') || null;
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('keja_session')) || null;
    } catch {
      return null;
    }
  }

  function saveSession(user, token) {
    if (token) localStorage.setItem('keja_token', token);
    if (user) localStorage.setItem('keja_session', JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem('keja_token');
    localStorage.removeItem('keja_session');
  }

  function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /* ─────────────────────────────────────────
     OPEN MODAL
  ───────────────────────────────────────── */
  function openAuthModal() {
    const session = getSession();
    if (session) {
      showLoggedInPanel(session);
    } else {
      showPanel('signin');
    }
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-auth');
    }
  }

  /* ─────────────────────────────────────────
     TAB SWITCHING
  ───────────────────────────────────────── */
  function switchTab(tab) {
    const session = getSession();
    if (session) {
      showLoggedInPanel(session);
      return;
    }
    showPanel(tab);
  }

  function showPanel(tab) {
    const signinEl = document.getElementById('auth-panel-signin');
    const signupEl = document.getElementById('auth-panel-signup');
    const otpEl = document.getElementById('auth-panel-otp');
    const loggedinEl = document.getElementById('auth-panel-loggedin');

    if (signinEl) signinEl.style.display = tab === 'signin' ? 'block' : 'none';
    if (signupEl) signupEl.style.display = tab === 'signup' ? 'block' : 'none';
    if (otpEl) otpEl.style.display = tab === 'otp' ? 'block' : 'none';
    if (loggedinEl) loggedinEl.style.display = 'none';

    // Tab button styles
    const activeStyle = 'background:transparent; color:white; border-bottom:3px solid white;';
    const inactiveStyle = 'background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.75); border-bottom:3px solid transparent;';

    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    if (tabSignIn) tabSignIn.style.cssText += (tab === 'signin' ? activeStyle : inactiveStyle);
    if (tabSignUp) tabSignUp.style.cssText += (tab === 'signup' || tab === 'otp' ? activeStyle : inactiveStyle);
  }

  /* ─────────────────────────────────────────
     SIGN-IN MODE TOGGLE (PHONE OTP vs PASSWORD)
  ───────────────────────────────────────── */
  function setSigninMode(mode) {
    state.signinMode = mode;
    const formOtp = document.getElementById('form-signin-otp');
    const formPassword = document.getElementById('form-signin-password');
    const btnOtp = document.getElementById('signin-mode-otp');
    const btnPassword = document.getElementById('signin-mode-password');

    if (formOtp) formOtp.style.display = mode === 'otp' ? 'block' : 'none';
    if (formPassword) formPassword.style.display = mode === 'password' ? 'block' : 'none';

    if (btnOtp) {
      btnOtp.style.background = mode === 'otp' ? '#ffffff' : 'transparent';
      btnOtp.style.color = mode === 'otp' ? '#0f172a' : '#64748b';
      btnOtp.style.fontWeight = mode === 'otp' ? '700' : '600';
      btnOtp.style.boxShadow = mode === 'otp' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none';
    }

    if (btnPassword) {
      btnPassword.style.background = mode === 'password' ? '#ffffff' : 'transparent';
      btnPassword.style.color = mode === 'password' ? '#0f172a' : '#64748b';
      btnPassword.style.fontWeight = mode === 'password' ? '700' : '600';
      btnPassword.style.boxShadow = mode === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none';
    }
  }

  /* ─────────────────────────────────────────
     ROLE SELECTION (TENANT, LANDLORD, AGENCY)
  ───────────────────────────────────────── */
  function setRole(role, panel) {
    state[`${panel}Role`] = role;

    const roles = ['tenant', 'landlord', 'agency'];
    roles.forEach(r => {
      const btn = document.getElementById(`role-${panel}-${r}`);
      if (btn) {
        if (r === role) {
          btn.classList.add('role-btn-active');
        } else {
          btn.classList.remove('role-btn-active');
        }
      }
    });

    // Show/hide role-specific fields on signup
    if (panel === 'signup') {
      const landlordFields = document.getElementById('signup-landlord-fields');
      const agencyFields = document.getElementById('signup-agency-fields');
      const nameLabel = document.getElementById('signup-name-label');

      if (landlordFields) {
        landlordFields.style.display = role === 'landlord' ? 'block' : 'none';
      }
      if (agencyFields) {
        agencyFields.style.display = role === 'agency' ? 'block' : 'none';
      }
      if (nameLabel) {
        nameLabel.textContent = role === 'agency' ? 'Director / Principal Agent Name *' : 'Full Name *';
      }
    }
  }

  /* ─────────────────────────────────────────
     SIGN UP (STEP 1: SEND SMS OTP)
  ───────────────────────────────────────── */
  async function handleSignUp(e) {
    e.preventDefault();
    const nameEl = document.getElementById('signup-name');
    const phoneEl = document.getElementById('signup-phone');
    const emailEl = document.getElementById('signup-email');
    const passwordEl = document.getElementById('signup-password');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const role = state.signupRole;

    if (!name || !phone || !password) {
      if (window.app) window.app.showToast('Please fill in all required fields.', 'info');
      return;
    }

    if (password.length < 6) {
      if (window.app) window.app.showToast('Password must be at least 6 characters long.', 'info');
      return;
    }

    const area = role === 'landlord' && document.getElementById('signup-landlord-area')
      ? document.getElementById('signup-landlord-area').value.trim()
      : null;

    const agencyName = role === 'agency' && document.getElementById('signup-agency-name')
      ? document.getElementById('signup-agency-name').value.trim()
      : null;
    const officeLocation = role === 'agency' && document.getElementById('signup-agency-location')
      ? document.getElementById('signup-agency-location').value.trim()
      : null;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending SMS OTP...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, phone, email, password, role, 
          area, 
          agencyName: agencyName || name, 
          contactPerson: name, 
          officeLocation 
        })
      });

      const data = await res.json();

      if (data.success && data.phone) {
        pendingPhone = data.phone;
        pendingFlow = 'signup';
        showOtpPanel(data.phone, 'signup');
        if (window.app) {
          window.app.showToast(`📲 4-digit code sent via SMS to +${data.phone}!`, 'success');
        }
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Failed to send verification code.'}`, 'error');
      }
    } catch (err) {
      console.error('Sign up send-otp error:', err);
      if (window.app) {
        window.app.showToast('❌ Unable to reach server. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* ─────────────────────────────────────────
     SIGN IN VIA PHONE SMS OTP (ANTI-FRAUD LOGIN)
  ───────────────────────────────────────── */
  async function handleSendLoginOtp(e) {
    e.preventDefault();
    const phoneEl = document.getElementById('signin-otp-phone');
    const identifier = phoneEl ? phoneEl.value.trim() : '';

    if (!identifier) {
      if (window.app) window.app.showToast('Please enter your registered phone number.', 'info');
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending SMS Code...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await res.json();

      if (data.success && data.phone) {
        pendingPhone = data.phone;
        pendingFlow = 'login';
        showOtpPanel(data.phone, 'login');
        if (window.app) {
          window.app.showToast(`📲 Sign-in code sent to +${data.phone}!`, 'success');
        }
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Account not found.'}`, 'error');
      }
    } catch (err) {
      console.error('Login send-otp error:', err);
      if (window.app) {
        window.app.showToast('❌ Unable to connect to server. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* ─────────────────────────────────────────
     OTP VERIFICATION UI & COUNTDOWN
  ───────────────────────────────────────── */
  function showOtpPanel(phone, flow = 'signup') {
    showPanel('otp');
    const phoneDisplay = document.getElementById('otp-display-phone');
    const panelTitle = document.getElementById('otp-panel-title');
    const submitBtnLabel = document.getElementById('btn-submit-otp-label');

    if (phoneDisplay) phoneDisplay.textContent = `+${phone}`;
    if (panelTitle) {
      panelTitle.textContent = flow === 'login' ? 'Confirm Sign-In Code' : 'Verify Your Phone Number';
    }
    if (submitBtnLabel) {
      submitBtnLabel.textContent = flow === 'login' ? 'Verify & Sign In' : 'Verify & Complete Registration';
    }

    // Reset digit boxes
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`otp-${i}`);
      if (el) el.value = '';
    }
    const firstInput = document.getElementById('otp-1');
    if (firstInput) firstInput.focus();

    startOtpCountdown(60);
  }

  function startOtpCountdown(seconds) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);

    let remaining = seconds;
    const resendBtn = document.getElementById('btn-resend-otp');
    const countdownSpan = document.getElementById('otp-countdown');

    if (resendBtn) resendBtn.disabled = true;
    if (countdownSpan) countdownSpan.textContent = `(${remaining}s)`;

    otpTimerInterval = setInterval(() => {
      remaining -= 1;
      if (countdownSpan) countdownSpan.textContent = `(${remaining}s)`;
      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (countdownSpan) countdownSpan.textContent = '';
      }
    }, 1000);
  }

  function onOtpDigitInput(index, input, event) {
    input.value = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value && index < 4) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
    // If all 4 digits entered, auto-submit
    const d1 = document.getElementById('otp-1')?.value || '';
    const d2 = document.getElementById('otp-2')?.value || '';
    const d3 = document.getElementById('otp-3')?.value || '';
    const d4 = document.getElementById('otp-4')?.value || '';
    if (d1 && d2 && d3 && d4) {
      const submitBtn = document.getElementById('btn-submit-otp');
      if (submitBtn) submitBtn.click();
    }
  }

  function onOtpKeyDown(index, input, event) {
    if (event.key === 'Backspace' && !input.value && index > 1) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) {
        prev.focus();
        prev.value = '';
      }
    }
  }

  /* ─────────────────────────────────────────
     CONFIRM OTP (VERIFY FOR SIGNUP OR LOGIN)
  ───────────────────────────────────────── */
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const d1 = document.getElementById('otp-1')?.value || '';
    const d2 = document.getElementById('otp-2')?.value || '';
    const d3 = document.getElementById('otp-3')?.value || '';
    const d4 = document.getElementById('otp-4')?.value || '';
    const otp = `${d1}${d2}${d3}${d4}`.trim();

    if (otp.length !== 4) {
      if (window.app) window.app.showToast('Please enter the full 4-digit code.', 'info');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-otp');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    }

    const endpoint = pendingFlow === 'login' 
      ? `${API_BASE}/api/auth/login-verify-otp` 
      : `${API_BASE}/api/auth/verify-otp`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, otp })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`🎉 Phone verified! Welcome, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Invalid verification code.'}`, 'error');
        for (let i = 1; i <= 4; i++) {
          const el = document.getElementById(`otp-${i}`);
          if (el) el.value = '';
        }
        const first = document.getElementById('otp-1');
        if (first) first.focus();
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      if (window.app) window.app.showToast('❌ Verification failed. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* ─────────────────────────────────────────
     RESEND OTP
  ───────────────────────────────────────── */
  async function handleResendOtp() {
    if (!pendingPhone) {
      switchTab(pendingFlow === 'login' ? 'signin' : 'signup');
      return;
    }

    const resendBtn = document.getElementById('btn-resend-otp');
    if (resendBtn) resendBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, type: pendingFlow })
      });

      const data = await res.json();

      if (data.success) {
        startOtpCountdown(60);
        if (window.app) window.app.showToast(`🔄 New verification code sent to +${pendingPhone}!`, 'success');
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Failed to resend code.'}`, 'error');
        if (resendBtn) resendBtn.disabled = false;
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      if (resendBtn) resendBtn.disabled = false;
    }
  }

  /* ─────────────────────────────────────────
     PASSWORD SIGN IN
  ───────────────────────────────────────── */
  async function handleSignIn(e) {
    e.preventDefault();
    const identifierEl = document.getElementById('signin-identifier');
    const passwordEl = document.getElementById('signin-password');

    const identifier = identifierEl ? identifierEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const role = state.signinRole;

    if (!identifier || !password) {
      if (window.app) window.app.showToast('Please enter your phone/email and password.', 'info');
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`👋 Welcome back, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Incorrect credentials'}`, 'error');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      if (window.app) {
        window.app.showToast('Unable to connect to server. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* ─────────────────────────────────────────
     SIGN OUT
  ───────────────────────────────────────── */
  function signOut() {
    clearSession();
    updateHeaderUI(null);
    if (window.app) {
      window.app.closeModal('modal-auth');
      window.app.showToast('You have been signed out.', 'info');
    }
  }

  /* ─────────────────────────────────────────
     LOGGED-IN PANEL
  ───────────────────────────────────────── */
  function showLoggedInPanel(session) {
    const signinEl = document.getElementById('auth-panel-signin');
    const signupEl = document.getElementById('auth-panel-signup');
    const otpEl = document.getElementById('auth-panel-otp');
    const loggedinEl = document.getElementById('auth-panel-loggedin');

    if (signinEl) signinEl.style.display = 'none';
    if (signupEl) signupEl.style.display = 'none';
    if (otpEl) otpEl.style.display = 'none';
    if (loggedinEl) loggedinEl.style.display = 'block';

    const initials = (session.name || 'User')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const avatarEl = document.getElementById('auth-user-avatar');
    const greetingEl = document.getElementById('auth-user-greeting');
    const phoneDisplayEl = document.getElementById('auth-user-phone-display');
    const badgeEl = document.getElementById('auth-user-role-badge');

    if (avatarEl) avatarEl.textContent = initials;
    if (greetingEl) greetingEl.textContent = `Hi, ${session.name}!`;
    if (phoneDisplayEl) phoneDisplayEl.textContent = session.phone ? `+${session.phone}` : (session.email || '');

    const isAdmin = Boolean(
      session && (
        session.id === 'usr-admin-01' || 
        session.role === 'admin' ||
        session.isAdmin === true ||
        (session.email && session.email.toLowerCase().includes('admin')) ||
        (session.name && session.name.toLowerCase().includes('admin'))
      )
    );

    if (badgeEl) {
      if (isAdmin) {
        badgeEl.textContent = '👑 Administrator';
        badgeEl.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
        badgeEl.style.color = '#ffffff';
      } else if (session.role === 'agency') {
        badgeEl.textContent = '🏢 Real Estate Agency';
        badgeEl.style.background = '#f3e8ff';
        badgeEl.style.color = '#7c3aed';
      } else if (session.role === 'landlord') {
        badgeEl.textContent = '🏠 Direct Landlord';
        badgeEl.style.background = '#e0e7ff';
        badgeEl.style.color = '#4f46e5';
      } else {
        badgeEl.textContent = '🔍 Tenant';
        badgeEl.style.background = '#d1fae5';
        badgeEl.style.color = '#065f46';
      }
    }

    if (window.kejaAdmin && typeof window.kejaAdmin.checkAdminSession === 'function') {
      window.kejaAdmin.checkAdminSession();
    }
  }

  /* ─────────────────────────────────────────
     HEADER UI UPDATE & ROLE SEPARATION
  ───────────────────────────────────────── */
  function updateHeaderUI(session) {
    const label = document.getElementById('auth-header-label');
    const btn = document.getElementById('btn-auth-header');
    const mobileLabel = document.getElementById('mobile-nav-user-label');
    const adminHeaderBtn = document.getElementById('btn-admin-header');
    const postAdBtn = document.getElementById('btn-header-post-ad');
    const whatsappAlertBanner = document.getElementById('tenant-whatsapp-alert-banner');

    if (session) {
      const isAdmin = Boolean(
        session.id === 'usr-admin-01' || 
        session.role === 'admin' ||
        session.isAdmin === true ||
        (session.email && session.email.toLowerCase().includes('admin')) ||
        (session.name && session.name.toLowerCase().includes('admin'))
      );

      const initials = (session.name || 'User')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      if (label) label.textContent = isAdmin ? '👑 Admin' : initials;
      if (mobileLabel) mobileLabel.textContent = isAdmin ? 'Admin' : session.name.split(' ')[0];
      if (adminHeaderBtn) adminHeaderBtn.style.display = isAdmin ? 'inline-flex' : 'none';

      if (btn) {
        if (isAdmin) {
          btn.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
          btn.style.color = '#ffd700';
          btn.style.fontWeight = '700';
        } else if (session.role === 'agency') {
          btn.style.background = 'linear-gradient(135deg, #7c3aed, #6366f1)';
          btn.style.color = 'white';
        } else if (session.role === 'landlord') {
          btn.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
          btn.style.color = 'white';
        } else {
          btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btn.style.color = 'white';
        }
      }

      // Role separation:
      if (session.role === 'tenant') {
        // Tenants are looking for houses: hide Post Ad, show WhatsApp Alerts
        if (postAdBtn) postAdBtn.style.display = 'none';
        if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'flex';
      } else {
        // Landlords & Agencies: show Post Ad, hide Tenant WhatsApp alert
        if (postAdBtn) postAdBtn.style.display = 'inline-flex';
        if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'none';
      }
    } else {
      if (label) label.textContent = 'Sign In';
      if (mobileLabel) mobileLabel.textContent = 'Profile';
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none';
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
      }
      if (postAdBtn) postAdBtn.style.display = 'inline-flex';
      if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'flex';
    }

    if (window.kejaAdmin && typeof window.kejaAdmin.checkAdminSession === 'function') {
      window.kejaAdmin.checkAdminSession();
    }
  }

  /* ─────────────────────────────────────────
     PASSWORD TOGGLE
  ───────────────────────────────────────── */
  function togglePwd(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  }

  /* ─────────────────────────────────────────
     ROLE GUARD (LANDLORD OR AGENCY)
  ───────────────────────────────────────── */
  function requireLandlordForAction(modalId) {
    const session = getSession();
    if (!session) {
      if (window.app) window.app.showToast('Please sign in to post a property.', 'info');
      switchTab('signin');
      setRole('landlord', 'signin');
      openAuthModal();
      return;
    }

    const isAdmin = Boolean(
      session.id === 'usr-admin-01' ||
      session.role === 'admin' ||
      session.isAdmin === true ||
      (session.email && session.email.toLowerCase().includes('admin'))
    );

    const isAuthorized = session.role === 'landlord' || session.role === 'agency' || isAdmin;

    if (!isAuthorized) {
      if (window.app) window.app.showToast('Only landlord or agency accounts can post properties.', 'info');
      switchTab('signup');
      setRole('landlord', 'signup');
      openAuthModal();
      return;
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal(modalId);
    }
  }

  /* ─────────────────────────────────────────
     SYNC SESSION WITH SERVER ON BOOT
  ───────────────────────────────────────── */
  async function syncSession() {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          saveSession(data.user, token);
          updateHeaderUI(data.user);
        }
      } else if (res.status === 401) {
        clearSession();
        updateHeaderUI(null);
      }
    } catch {
      const session = getSession();
      if (session) updateHeaderUI(session);
    }
  }

  let pendingTenantAuthCallback = null;

  function handleAuthSuccess(user) {
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-auth');
    }
    if (typeof pendingTenantAuthCallback === 'function') {
      const cb = pendingTenantAuthCallback;
      pendingTenantAuthCallback = null;
      cb(user);
    } else if (window.app && window.app.selectedPropertyForDetail) {
      window.app.unlockDetailPhotos();
    }
  }

  function requireTenantAuth(callback) {
    const session = getSession();
    if (session) {
      if (typeof callback === 'function') callback(session);
      return true;
    }
    pendingTenantAuthCallback = callback;
    if (window.app) window.app.showToast('Please sign in or create a free account to view photos, live location, and contacts.', 'info');
    switchTab('signin');
    setRole('tenant', 'signin');
    openAuthModal();
    return false;
  }

  function init() {
    const session = getSession();
    if (session) updateHeaderUI(session);
    syncSession();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    openAuthModal,
    switchTab,
    setRole,
    setSigninMode,
    handleSendLoginOtp,
    handleSignIn,
    handleSignUp,
    handleVerifyOtp,
    handleResendOtp,
    onOtpDigitInput,
    onOtpKeyDown,
    signOut,
    togglePwd,
    requireLandlordForAction,
    requireTenantAuth,
    getSession,
    getToken,
    getAuthHeaders
  };

})();

window.kejaAuth = kejaAuth;
