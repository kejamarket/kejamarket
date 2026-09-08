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

  function showPanel(tab) {
    const signinEl = document.getElementById('auth-panel-signin');
    const signupEl = document.getElementById('auth-panel-signup');
    const loggedinEl = document.getElementById('auth-panel-loggedin');

    if (signinEl) signinEl.style.display = tab === 'signin' ? 'block' : 'none';
    if (signupEl) signupEl.style.display = tab === 'signup' ? 'block' : 'none';
    if (loggedinEl) loggedinEl.style.display = 'none';

    // Tab button styles
    const activeStyle = 'background:transparent; color:white; border-bottom:3px solid white;';
    const inactiveStyle = 'background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.75); border-bottom:3px solid transparent;';

    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    if (tabSignIn) tabSignIn.style.cssText += tab === 'signin' ? activeStyle : inactiveStyle;
    if (tabSignUp) tabSignUp.style.cssText += tab === 'signup' ? activeStyle : inactiveStyle;
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
     SIGN UP (REAL BACKEND API)
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
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, role, numProperties, area })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`🎉 Welcome to KejaMarket, ${data.user.name}! Your account is active.`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`❌ ${data.message || 'Registration failed'}`, 'error');
      }
    } catch (err) {
      console.error('Sign up error:', err);
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

    // Role badge
    if (badgeEl) {
      if (session.role === 'landlord') {
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
    const tenantLinks = document.getElementById('auth-tenant-links');
    const landlordLinks = document.getElementById('auth-landlord-links');
    if (tenantLinks) tenantLinks.style.display = session.role === 'tenant' ? 'block' : 'none';
    if (landlordLinks) landlordLinks.style.display = session.role === 'landlord' ? 'block' : 'none';
  }

  /* ─────────────────────────────────────────
     HEADER UI UPDATE
  ───────────────────────────────────────── */
  function updateHeaderUI(session) {
    const label = document.getElementById('auth-header-label');
    const btn = document.getElementById('btn-auth-header');
    const mobileLabel = document.getElementById('mobile-nav-user-label');

    if (session) {
      const initials = (session.name || 'User')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      if (label) label.textContent = initials;
      if (mobileLabel) mobileLabel.textContent = session.name.split(' ')[0];
      if (btn) {
        btn.style.background = session.role === 'landlord'
          ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
          : 'linear-gradient(135deg,#10b981,#059669)';
        btn.style.color = 'white';
      }
    } else {
      if (label) label.textContent = 'Sign In';
      if (mobileLabel) mobileLabel.textContent = 'Profile';
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
      }
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
    if (session.role !== 'landlord') {
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

