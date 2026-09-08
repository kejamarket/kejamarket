/**
 * KejaMarket – Real Authentication Engine
 * Connected to live backend JWT + Bcrypt API (/api/auth)
 * Handles tenant & landlord sign-up, sign-in, session sync, and role permissions.
 */

const kejaAuth = (() => {
  // Current selected role per panel
  const state = { signinRole: 'tenant', signupRole: 'tenant' };

  // API Base URL (defaults to relative path or current host)
  const API_BASE = '';

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

  let pendingSignupPhone = '';
  let otpTimerInterval = null;

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
     ROLE SELECTION
  ───────────────────────────────────────── */
  function setRole(role, panel) {
    state[`${panel}Role`] = role;

    const other = role === 'tenant' ? 'landlord' : 'tenant';
    const btnRole = document.getElementById(`role-${panel}-${role}`);
    const btnOther = document.getElementById(`role-${panel}-${other}`);

    if (btnRole) btnRole.classList.add('role-btn-active');
    if (btnOther) btnOther.classList.remove('role-btn-active');

    // Show/hide landlord-only fields on signup
    if (panel === 'signup') {
      const landlordFields = document.getElementById('signup-landlord-fields');
      if (landlordFields) {
        landlordFields.style.display = role === 'landlord' ? 'block' : 'none';
      }
    }
  }

  /* ─────────────────────────────────────────
     SIGN UP (STEP 1: SEND OTP VIA SMS)
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

    const numProperties = role === 'landlord' && document.getElementById('signup-num-properties')
      ? document.getElementById('signup-num-properties').value
      : null;
    const area = role === 'landlord' && document.getElementById('signup-landlord-area')
      ? document.getElementById('signup-landlord-area').value.trim()
      : null;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending SMS code...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, role, numProperties, area })
      });

      const data = await res.json();

      if (data.success && data.phone) {
        pendingSignupPhone = data.phone;
        showOtpPanel(data.phone, data.devOtp);
        if (window.app) {
          window.app.showToast(`📲 Verification code sent to +${data.phone}! Enter the 4-digit code.`, 'success');
        }
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Failed to send verification code.'}`, 'error');
      }
    } catch (err) {
      console.error('Sign up send-otp error:', err);
      if (window.app) {
        window.app.showToast('❌ Unable to reach server. Please check your connection and try again.', 'error');
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
  function showOtpPanel(phone, devOtp) {
    showPanel('otp');
    const phoneDisplay = document.getElementById('otp-display-phone');
    if (phoneDisplay) {
      phoneDisplay.textContent = `+${phone}`;
    }

    // Dev/Sandbox helper banner
    const devBanner = document.getElementById('otp-dev-banner');
    const devCode = document.getElementById('otp-dev-code');
    if (devOtp && devBanner && devCode) {
      devBanner.style.display = 'block';
      devCode.textContent = devOtp;
    } else if (devBanner) {
      devBanner.style.display = 'none';
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
     CONFIRM OTP (STEP 2: VERIFY & LOG IN)
  ───────────────────────────────────────── */
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const d1 = document.getElementById('otp-1')?.value || '';
    const d2 = document.getElementById('otp-2')?.value || '';
    const d3 = document.getElementById('otp-3')?.value || '';
    const d4 = document.getElementById('otp-4')?.value || '';
    const otp = `${d1}${d2}${d3}${d4}`.trim();

    if (otp.length !== 4) {
      if (window.app) window.app.showToast('Please enter the full 4-digit verification code.', 'info');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-otp');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingSignupPhone, otp })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`🎉 Phone verified! Welcome to KejaMarket, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Invalid verification code.'}`, 'error');
        // Clear digits for retry
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
    if (!pendingSignupPhone) {
      switchTab('signup');
      return;
    }

    const resendBtn = document.getElementById('btn-resend-otp');
    if (resendBtn) resendBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingSignupPhone })
      });

      const data = await res.json();

      if (data.success) {
        if (data.devOtp) {
          const devBanner = document.getElementById('otp-dev-banner');
          const devCode = document.getElementById('otp-dev-code');
          if (devBanner && devCode) {
            devBanner.style.display = 'block';
            devCode.textContent = data.devOtp;
          }
        }
        startOtpCountdown(60);
        if (window.app) window.app.showToast(`🔄 New verification code sent to +${pendingSignupPhone}!`, 'success');
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
     SIGN IN (REAL BACKEND API)
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
    const loggedinEl = document.getElementById('auth-panel-loggedin');

    if (signinEl) signinEl.style.display = 'none';
    if (signupEl) signupEl.style.display = 'none';
    if (loggedinEl) loggedinEl.style.display = 'block';

    // Avatar initials
    const initials = (session.name || 'User')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const avatarEl = document.getElementById('auth-user-avatar');
    const greetingEl = document.getElementById('auth-user-greeting');
    const badgeEl = document.getElementById('auth-user-role-badge');

    if (avatarEl) avatarEl.textContent = initials;
    if (greetingEl) greetingEl.textContent = `Hi, ${session.name}!`;

    // Role badge & Admin detection
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
      } else if (session.role === 'landlord') {
        badgeEl.textContent = '🏠 Landlord';
        badgeEl.style.background = '#e0e7ff';
        badgeEl.style.color = '#4f46e5';
      } else {
        badgeEl.textContent = '🔍 Tenant';
        badgeEl.style.background = '#d1fae5';
        badgeEl.style.color = '#065f46';
      }
    }

    // Show correct dashboard links
    const adminLinks = document.getElementById('auth-admin-links');
    const tenantLinks = document.getElementById('auth-tenant-links');
    const landlordLinks = document.getElementById('auth-landlord-links');

    if (adminLinks) adminLinks.style.display = isAdmin ? 'block' : 'none';
    if (tenantLinks) tenantLinks.style.display = session.role === 'tenant' ? 'block' : 'none';
    if (landlordLinks) landlordLinks.style.display = (session.role === 'landlord' || isAdmin) ? 'block' : 'none';

    if (window.kejaAdmin && typeof window.kejaAdmin.checkAdminSession === 'function') {
      window.kejaAdmin.checkAdminSession();
    }
  }

  /* ─────────────────────────────────────────
     HEADER UI UPDATE
  ───────────────────────────────────────── */
  function updateHeaderUI(session) {
    const label = document.getElementById('auth-header-label');
    const btn = document.getElementById('btn-auth-header');
    const mobileLabel = document.getElementById('mobile-nav-user-label');
    const adminHeaderBtn = document.getElementById('btn-admin-header');

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
        } else {
          btn.style.background = session.role === 'landlord'
            ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
            : 'linear-gradient(135deg,#10b981,#059669)';
          btn.style.color = 'white';
        }
      }
    } else {
      if (label) label.textContent = 'Sign In';
      if (mobileLabel) mobileLabel.textContent = 'Profile';
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none';
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
      }
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
     ROLE GUARD
  ───────────────────────────────────────── */
  function requireLandlordForAction(modalId) {
    const session = getSession();
    if (!session) {
      if (window.app) window.app.showToast('Please sign in as a Landlord to post a property.', 'info');
      switchTab('signin');
      setRole('landlord', 'signin');
      openAuthModal();
      return;
    }
    // Admins have full landlord access
    const isAdmin = Boolean(
      session.id === 'usr-admin-01' ||
      session.role === 'admin' ||
      session.isAdmin === true ||
      (session.email && session.email.toLowerCase().includes('admin'))
    );
    if (session.role !== 'landlord' && !isAdmin) {
      if (window.app) window.app.showToast('Only landlord accounts can post properties. Please switch or create a Landlord account.', 'info');
      switchTab('signup');
      setRole('landlord', 'signup');
      openAuthModal();
      return;
    }
    // Verified or active landlord
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
      // Offline fallback: keep existing localStorage session
      const session = getSession();
      if (session) updateHeaderUI(session);
    }
  }

  /* ─────────────────────────────────────────
     TENANT AUTH GUARD
     Call with a callback — runs it if logged in,
     otherwise nudges user to sign in as tenant.
  ───────────────────────────────────────── */
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
    if (window.app) window.app.showToast('Please sign in or create a free account to view photos, live location, and landlord contacts.', 'info');
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

