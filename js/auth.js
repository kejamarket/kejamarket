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
    if (typeof applyAuthWall === 'function') applyAuthWall(user);
  }

  function clearSession() {
    localStorage.removeItem('keja_token');
    localStorage.removeItem('keja_session');
    if (typeof applyAuthWall === 'function') applyAuthWall(null);
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
    const panels = ['signin', 'signup', 'otp', 'loggedin', 'forgot', 'reset'];
    panels.forEach(p => {
      const el = document.getElementById(`auth-panel-${p}`);
      if (el) el.style.display = 'none';
    });

    const target = document.getElementById(`auth-panel-${tab}`);
    if (target) target.style.display = 'block';

    // Update tab button active states for main tabs only
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
     ROLE SELECTION (TENANT, LANDLORD, AGENCY, SERVICE)
  ───────────────────────────────────────── */
  function setRole(role, panel) {
    state[`${panel}Role`] = role;

    const roles = ['tenant', 'landlord', 'agency', 'service'];
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
      const serviceFields = document.getElementById('signup-service-fields');
      const nameLabel = document.getElementById('signup-name-label');

      if (landlordFields) {
        landlordFields.style.display = role === 'landlord' ? 'block' : 'none';
      }
      if (agencyFields) {
        agencyFields.style.display = role === 'agency' ? 'block' : 'none';
      }
      if (serviceFields) {
        serviceFields.style.display = role === 'service' ? 'block' : 'none';
      }
      if (nameLabel) {
        if (role === 'agency') {
          nameLabel.textContent = 'Director / Principal Agent Name *';
        } else if (role === 'service') {
          nameLabel.textContent = 'Service Provider Name *';
        } else {
          nameLabel.textContent = 'Full Name *';
        }
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

    // STRICT VALIDATION: All fields required
    if (!name || !phone || !email || !password) {
      if (window.app) window.app.showToast('❌ All fields are required including email.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (window.app) window.app.showToast('❌ Please enter a valid email address.', 'error');
      return;
    }

    // Phone validation
    if (phone.length < 10) {
      if (window.app) window.app.showToast('❌ Please enter a valid phone number.', 'error');
      return;
    }

    if (password.length < 6) {
      if (window.app) window.app.showToast('❌ Password must be at least 6 characters long.', 'error');
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

    const serviceCategory = role === 'service' && document.getElementById('signup-service-category')
      ? document.getElementById('signup-service-category').value
      : null;
    const serviceBusiness = role === 'service' && document.getElementById('signup-service-business')
      ? document.getElementById('signup-service-business').value.trim()
      : null;
    const serviceAreas = role === 'service' && document.getElementById('signup-service-areas')
      ? document.getElementById('signup-service-areas').value.trim()
      : null;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, phone, email, password, role, 
          area, 
          agencyName: agencyName || name, 
          contactPerson: name, 
          officeLocation,
          serviceCategory,
          serviceBusiness,
          serviceAreas
        })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.closeModal('modal-auth');
          window.app.showToast(`🎉 Welcome to KejaMarket, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Registration failed.'}`, 'error');
      }
    } catch (err) {
      console.error('Sign up error:', err);
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
    applyAuthWall(session);
    const label = document.getElementById('auth-header-label');
    const btn = document.getElementById('btn-auth-header');
    const mobileLabel = document.getElementById('mobile-nav-user-label');
    const adminHeaderBtn = document.getElementById('btn-admin-header');
    const landlordHeaderBtn = document.getElementById('btn-landlord-header');
    const serviceHeaderBtn = document.getElementById('btn-service-header');
    const postAdBtn = document.getElementById('btn-header-post-ad');
    const pricingBtn = document.getElementById('btn-header-pricing');
    const whatsappAlertBanner = document.getElementById('tenant-whatsapp-alert-banner');

    if (session) {
      const isAdmin = Boolean(
        session.id === 'usr-admin-01' || 
        session.role === 'admin' ||
        session.isAdmin === true ||
        (session.email && session.email.toLowerCase().includes('admin')) ||
        (session.name && session.name.toLowerCase().includes('admin'))
      );

      const isLandlordOrAgent = Boolean(
        session.role === 'landlord' ||
        session.role === 'agency' ||
        session.role === 'agent' ||
        isAdmin
      );

      const isServiceProvider = Boolean(session.role === 'service');

      const initials = (session.name || 'User')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      if (label) label.textContent = initials;
      if (mobileLabel) mobileLabel.textContent = session.name.split(' ')[0];
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none'; // Always hidden, auto-opens on login
      
      // Show Landlord Portal button ONLY for landlords/agents (NOT admin, NOT service)
      if (landlordHeaderBtn) {
        landlordHeaderBtn.style.display = (isLandlordOrAgent && !isAdmin && !isServiceProvider) ? 'inline-flex' : 'none';
      }
      
      // Show Service Portal button ONLY for service providers
      if (serviceHeaderBtn) {
        serviceHeaderBtn.style.display = isServiceProvider ? 'inline-flex' : 'none';
      }

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
        } else if (session.role === 'service') {
          btn.style.background = 'linear-gradient(135deg, #0891b2, #06b6d4)';
          btn.style.color = 'white';
        } else {
          btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btn.style.color = 'white';
        }
      }

      // Role separation:
      // Pricing & Pro and Post only appear for Landlord or Agent (never for Tenant or Service Provider)
      if (postAdBtn) postAdBtn.style.display = isLandlordOrAgent ? 'inline-flex' : 'none';
      if (pricingBtn) pricingBtn.style.display = isLandlordOrAgent ? 'inline-flex' : 'none';

      if (session.role === 'tenant') {
        if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'flex';
      } else {
        if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'none';
      }
    } else {
      if (label) label.textContent = 'Sign In';
      if (mobileLabel) mobileLabel.textContent = 'Profile';
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none';
      if (landlordHeaderBtn) landlordHeaderBtn.style.display = 'none';
      if (serviceHeaderBtn) serviceHeaderBtn.style.display = 'none';
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
      }
      // When signed out: hide Post and Pricing & Pro (only landlords/agents have these)
      if (postAdBtn) postAdBtn.style.display = 'none';
      if (pricingBtn) pricingBtn.style.display = 'none';
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
    applyAuthWall(user);
    updateHeaderUI(user);
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-auth');
    }
    if (window.app && typeof window.app.applyFilters === 'function') {
      window.app.applyFilters();
    }
    
    // AUTO-OPEN PORTAL: Automatically open appropriate portal after login
    setTimeout(() => {
      // Admin users → Open Admin Portal automatically (no button needed)
      if (user.role === 'admin' || user.isAdmin || user.id === 'usr-admin-01') {
        if (window.kejaAdmin && typeof window.kejaAdmin.openAdminModal === 'function') {
          window.kejaAdmin.openAdminModal();
        }
      }
      // Landlord/Agency users → Open Landlord Portal automatically
      else if (user.role === 'landlord' || user.role === 'agency') {
        if (window.kejaLandlordPortal && typeof window.kejaLandlordPortal.openLandlordPortal === 'function') {
          window.kejaLandlordPortal.openLandlordPortal();
        }
      }
      // Service Provider users → Open Service Portal automatically
      else if (user.role === 'service') {
        if (window.kejaServicePortal && typeof window.kejaServicePortal.openServicePortal === 'function') {
          window.kejaServicePortal.openServicePortal();
        }
      }
      // Tenants → Stay on main browsing page (default)
    }, 500); // Small delay to ensure modals are ready

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
    // Removed toast - cleaner UX
    switchTab('signin');
    setRole('tenant', 'signin');
    openAuthModal();
    return false;
  }

  // Controls auth state UI: marketplace and listings are always open for seamless browsing
  function applyAuthWall(session) {
    const wall = document.getElementById('signin-wall');
    const mainLayout = document.getElementById('main-app-layout');

    // Marketplace is always visible to everyone
    if (wall) wall.style.display = 'none';
    if (mainLayout) mainLayout.style.display = '';

    // Refresh properties display
    if (window.app && typeof window.app.applyFilters === 'function') {
      window.app.applyFilters();
    }
    setTimeout(() => {
      if (window.mapController && typeof window.mapController.invalidateSize === 'function') {
        window.mapController.invalidateSize();
      }
    }, 150);
  }

  function init() {
    const session = getSession();
    applyAuthWall(session);
    updateHeaderUI(session);
    syncSession();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* ─────────────────────────────────────────
     PROFILE DROPDOWN (Small popup near button)
  ───────────────────────────────────────── */
  function toggleProfileDropdown() {
    const session = getSession();
    
    // Not logged in -> Open auth modal
    if (!session) {
      openAuthModal();
      return;
    }

    // Logged in -> Show small dropdown
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;

    // Toggle visibility
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
      return;
    }

    // Build dropdown content
    const content = document.getElementById('profile-dropdown-content');
    if (content) {
      content.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${session.name}</div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">${session.email || session.phone}</div>
          <div style="font-size: 0.75rem; color: #6366f1; margin-top: 4px; text-transform: uppercase; font-weight: 600;">${session.role}</div>
        </div>
        <div style="padding: 8px 0;">
          ${session.role === 'landlord' || session.role === 'agency' ? `
            <button onclick="kejaLandlordPortal.openLandlordPortal(); kejaAuth.closeProfileDropdown();" style="width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 10px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
              <i class="fas fa-home" style="width: 16px;"></i> Landlord Portal
            </button>
          ` : ''}
          ${session.role === 'service' ? `
            <button onclick="kejaServicePortal.openServicePortal(); kejaAuth.closeProfileDropdown();" style="width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 10px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
              <i class="fas fa-tools" style="width: 16px;"></i> Service Portal
            </button>
          ` : ''}
          <button onclick="window.app.openModal('modal-saved-properties'); kejaAuth.closeProfileDropdown();" style="width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 10px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
            <i class="fas fa-heart" style="width: 16px;"></i> Saved Properties
          </button>
          <button onclick="window.app.openModal('modal-whatsapp-alerts'); kejaAuth.closeProfileDropdown();" style="width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 10px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
            <i class="fab fa-whatsapp" style="width: 16px; color: #25d366;"></i> WhatsApp Alerts
          </button>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding: 8px 0;">
          <button onclick="kejaAuth.signOut(); kejaAuth.closeProfileDropdown();" style="width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #dc2626; font-weight: 600; display: flex; align-items: center; gap: 10px;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'">
            <i class="fas fa-sign-out-alt" style="width: 16px;"></i> Sign Out
          </button>
        </div>
      `;
    }

    dropdown.style.display = 'block';

    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeDropdownOnClickOutside);
    }, 100);
  }

  function closeProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    document.removeEventListener('click', closeDropdownOnClickOutside);
  }

  function closeDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('profile-dropdown');
    const button = document.getElementById('btn-auth-header');
    if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
      closeProfileDropdown();
    }
  }

  /* ─────────────────────────────────────────
     PASSWORD RESET FLOW
  ───────────────────────────────────────── */

  let forgotIdentifier = '';

  function showForgotPassword() {
    // Hide ALL panels completely
    ['signin', 'signup', 'otp', 'loggedin', 'reset', 'forgot'].forEach(p => {
      const el = document.getElementById(`auth-panel-${p}`);
      if (el) el.style.display = 'none';
    });
    // Show only forgot panel
    const forgot = document.getElementById('auth-panel-forgot');
    if (forgot) forgot.style.display = 'block';
    const input = document.getElementById('forgot-identifier');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const identifierEl = document.getElementById('forgot-identifier');
    const identifier = identifierEl ? identifierEl.value.trim() : '';
    if (!identifier) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();

      if (data.success) {
        forgotIdentifier = identifier;
        // Hide forgot, show reset panel cleanly
        ['signin', 'signup', 'otp', 'loggedin', 'forgot'].forEach(p => {
          const el = document.getElementById(`auth-panel-${p}`);
          if (el) el.style.display = 'none';
        });
        const reset = document.getElementById('auth-panel-reset');
        if (reset) reset.style.display = 'block';
        // Pre-focus the code input
        setTimeout(() => {
          const codeInput = document.getElementById('reset-otp-code');
          if (codeInput) codeInput.focus();
        }, 100);
        if (window.app) window.app.showToast(`✅ Reset code sent to your phone!`, 'success');
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Failed to send reset code.'}`, 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('❌ Could not reach server. Try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const otp = document.getElementById('reset-otp-code')?.value.trim() || '';
    const newPassword = document.getElementById('reset-new-password')?.value || '';
    const confirmPassword = document.getElementById('reset-confirm-password')?.value || '';

    if (!otp || otp.length < 6) {
      if (window.app) window.app.showToast('Enter the 6-digit reset code from your SMS.', 'info');
      return;
    }
    if (newPassword.length < 6) {
      if (window.app) window.app.showToast('Password must be at least 6 characters.', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      if (window.app) window.app.showToast('Passwords do not match.', 'error');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...'; }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier, otp, newPassword })
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.closeModal('modal-auth');
          window.app.showToast(`✅ Password reset! Welcome back, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Reset failed.'}`, 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('❌ Reset failed. Check your connection.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  return {
    openAuthModal,
    switchTab,
    showPanel,
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
    getAuthHeaders,
    applyAuthWall,
    toggleProfileDropdown,
    closeProfileDropdown,
    showForgotPassword,
    handleForgotPassword,
    handleResetPassword
  };

})();

window.kejaAuth = kejaAuth;
