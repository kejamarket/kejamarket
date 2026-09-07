/**
 * Keja – Authentication Engine
 * Handles tenant & landlord sign-up / sign-in / sign-out
 * Uses localStorage for session persistence (no backend required for now)
 */

const kejaAuth = (() => {
  // Current selected role per panel
  const state = { signinRole: 'tenant', signupRole: 'tenant' };

  /* ─────────────────────────────────────────
     SESSION HELPERS
  ───────────────────────────────────────── */
  function getSession() {
    try { return JSON.parse(localStorage.getItem('keja_session')) || null; } catch { return null; }
  }
  function saveSession(data) {
    localStorage.setItem('keja_session', JSON.stringify(data));
  }
  function clearSession() {
    localStorage.removeItem('keja_session');
  }

  // All registered users (stored in localStorage)
  function getUsers() {
    try { return JSON.parse(localStorage.getItem('keja_users')) || []; } catch { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem('keja_users', JSON.stringify(users));
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
    window.app.openModal('modal-auth');
  }

  /* ─────────────────────────────────────────
     TAB SWITCHING
  ───────────────────────────────────────── */
  function switchTab(tab) {
    const session = getSession();
    if (session) { showLoggedInPanel(session); return; }
    showPanel(tab);
  }

  function showPanel(tab) {
    // Panels
    document.getElementById('auth-panel-signin').style.display   = tab === 'signin'  ? 'block' : 'none';
    document.getElementById('auth-panel-signup').style.display   = tab === 'signup'  ? 'block' : 'none';
    document.getElementById('auth-panel-loggedin').style.display = 'none';

    // Tab button styles
    const activeStyle   = 'background:transparent; color:white; border-bottom:3px solid white;';
    const inactiveStyle = 'background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.75); border-bottom:3px solid transparent;';
    document.getElementById('auth-tab-signin').style.cssText += tab === 'signin' ? activeStyle : inactiveStyle;
    document.getElementById('auth-tab-signup').style.cssText += tab === 'signup' ? activeStyle : inactiveStyle;
  }

  /* ─────────────────────────────────────────
     ROLE SELECTION
  ───────────────────────────────────────── */
  function setRole(role, panel) {
    state[`${panel}Role`] = role;

    const other = role === 'tenant' ? 'landlord' : 'tenant';
    document.getElementById(`role-${panel}-${role}`).classList.add('role-btn-active');
    document.getElementById(`role-${panel}-${other}`).classList.remove('role-btn-active');

    // Show/hide landlord-only fields on signup
    if (panel === 'signup') {
      document.getElementById('signup-landlord-fields').style.display = role === 'landlord' ? 'block' : 'none';
    }
  }

  /* ─────────────────────────────────────────
     SIGN UP
  ───────────────────────────────────────── */
  function handleSignUp(e) {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const phone    = document.getElementById('signup-phone').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role     = state.signupRole;

    // Check for duplicate phone
    const users = getUsers();
    if (users.find(u => u.phone === phone)) {
      window.app.showToast('An account with this phone number already exists. Please Sign In.', 'info');
      switchTab('signin');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name, phone, email,
      password: btoa(password), // simple obfuscation (NOT production crypto)
      role,
      createdAt: new Date().toISOString(),
      // Landlord extras
      numProperties: role === 'landlord' ? document.getElementById('signup-num-properties').value : null,
      area:          role === 'landlord' ? document.getElementById('signup-landlord-area').value.trim() : null,
    };

    users.push(newUser);
    saveUsers(users);

    const session = { id: newUser.id, name: newUser.name, role: newUser.role, phone: newUser.phone };
    saveSession(session);
    updateHeaderUI(session);
    showLoggedInPanel(session);

    window.app.showToast(`🎉 Welcome to Keja, ${name}! Your ${role} account is ready.`, 'success');
  }

  /* ─────────────────────────────────────────
     SIGN IN
  ───────────────────────────────────────── */
  function handleSignIn(e) {
    e.preventDefault();
    const identifier = document.getElementById('signin-identifier').value.trim();
    const password   = document.getElementById('signin-password').value;
    const role       = state.signinRole;

    const users = getUsers();
    const user  = users.find(u =>
      (u.phone === identifier || u.email === identifier) &&
      u.password === btoa(password) &&
      u.role === role
    );

    if (!user) {
      window.app.showToast('Incorrect phone/email or password. Please try again.', 'info');
      return;
    }

    const session = { id: user.id, name: user.name, role: user.role, phone: user.phone };
    saveSession(session);
    updateHeaderUI(session);
    showLoggedInPanel(session);

    window.app.showToast(`👋 Welcome back, ${user.name}!`, 'success');
  }

  /* ─────────────────────────────────────────
     SIGN OUT
  ───────────────────────────────────────── */
  function signOut() {
    clearSession();
    updateHeaderUI(null);
    window.app.closeModal('modal-auth');
    window.app.showToast('You have been signed out.', 'info');
  }

  /* ─────────────────────────────────────────
     LOGGED-IN PANEL
  ───────────────────────────────────────── */
  function showLoggedInPanel(session) {
    document.getElementById('auth-panel-signin').style.display   = 'none';
    document.getElementById('auth-panel-signup').style.display   = 'none';
    document.getElementById('auth-panel-loggedin').style.display = 'block';

    // Avatar initials
    const initials = session.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('auth-user-avatar').textContent     = initials;
    document.getElementById('auth-user-greeting').textContent   = `Hi, ${session.name}!`;

    // Role badge
    const badge = document.getElementById('auth-user-role-badge');
    if (session.role === 'landlord') {
      badge.textContent         = '🏠 Landlord';
      badge.style.background    = '#e0e7ff';
      badge.style.color         = '#4f46e5';
    } else {
      badge.textContent         = '🔍 Tenant';
      badge.style.background    = '#d1fae5';
      badge.style.color         = '#065f46';
    }

    // Show correct dashboard links
    document.getElementById('auth-tenant-links').style.display   = session.role === 'tenant'   ? 'block' : 'none';
    document.getElementById('auth-landlord-links').style.display  = session.role === 'landlord' ? 'block' : 'none';
  }

  /* ─────────────────────────────────────────
     HEADER UI UPDATE
  ───────────────────────────────────────── */
  function updateHeaderUI(session) {
    const label = document.getElementById('auth-header-label');
    const icon  = document.querySelector('#btn-auth-header i');
    if (!label) return;

    if (session) {
      const initials = session.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      label.textContent = initials;
      if (icon) icon.className = 'fas fa-user-circle';
      document.getElementById('btn-auth-header').style.background =
        session.role === 'landlord'
          ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
          : 'linear-gradient(135deg,#10b981,#059669)';
      document.getElementById('btn-auth-header').style.color = 'white';
    } else {
      label.textContent = 'Sign In';
      if (icon) icon.className = 'fas fa-user-circle';
      document.getElementById('btn-auth-header').style.background = '';
      document.getElementById('btn-auth-header').style.color      = '';
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
      window.app.showToast('Please sign in as a Landlord to post a property.', 'info');
      switchTab('signin');
      openAuthModal();
      return;
    }
    if (session.role !== 'landlord') {
      window.app.showToast('Only landlord accounts can post properties. Please create a Landlord account.', 'error');
      return;
    }
    // They are a logged-in landlord
    window.app.openModal(modalId);
  }

  /* ─────────────────────────────────────────
     INIT (restore session on page load)
  ───────────────────────────────────────── */
  function init() {
    const session = getSession();
    if (session) updateHeaderUI(session);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { openAuthModal, switchTab, setRole, handleSignIn, handleSignUp, signOut, togglePwd, requireLandlordForAction };
})();
