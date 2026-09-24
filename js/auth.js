/**
 * KejaMarket Ã¢â‚¬â€œ Real Authentication Engine & Anti-Fraud Phone Verification
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

  // API Base URL (same-origin relative path for all domains)
  const API_BASE = '';

  let pendingPhone = '';
  let pendingFlow = 'signup'; // 'signup' | 'login'
  let otpTimerInterval = null;

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SESSION & TOKEN HELPERS
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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
    if (user) {
      if (user.role === 'admin' || user.id === 'usr-admin-01' || (user.email && user.email.toLowerCase() === 'admin@kejamarket.co.ke')) {
        user.isAdmin = true;
      }
      localStorage.setItem('keja_session', JSON.stringify(user));
    }
    if (typeof applyAuthWall === 'function') applyAuthWall(user);
    // Update post button visibility when session changes
    if (window.app && typeof window.app.updatePostButtonsVisibility === 'function') {
      window.app.updatePostButtonsVisibility();
    }
  }

  function clearSession() {
    localStorage.removeItem('keja_token');
    localStorage.removeItem('keja_session');
    if (typeof applyAuthWall === 'function') applyAuthWall(null);
    // Update post button visibility when session is cleared
    if (window.app && typeof window.app.updatePostButtonsVisibility === 'function') {
      window.app.updatePostButtonsVisibility();
    }
  }

  function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     OPEN MODAL
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function openAuthModal(initialTab) {
    if (initialTab === 'reset' || initialTab === 'forgot') {
      showPanel(initialTab);
    } else {
      const session = getSession();
      if (session) {
        showLoggedInPanel(session);
      } else {
        showPanel(initialTab || 'signin');
      }
    }
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-auth');
    } else {
      const modal = document.getElementById('modal-auth');
      if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex';
      }
    }
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     TAB SWITCHING
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function switchTab(tab) {
    const session = getSession();
    if (session) {
      showLoggedInPanel(session);
      return;
    }
    showPanel(tab);
    const modal = document.getElementById('modal-auth');
    if (modal && !modal.classList.contains('open')) {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  }

  function showPanel(tab) {
    const panels = ['signin', 'signup', 'otp', 'loggedin', 'forgot', 'reset'];
    panels.forEach(p => {
      const el = document.getElementById(`auth-panel-${p}`);
      if (el) el.style.display = 'none';
    });

    const target = document.getElementById(`auth-panel-${tab}`);
    if (target) target.style.display = 'block';

    // Update tab button active states â€” new CSS class-based approach
    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    if (tabSignIn) {
      tabSignIn.classList.toggle('auth-tab--active', tab === 'signin');
    }
    if (tabSignUp) {
      tabSignUp.classList.toggle('auth-tab--active', tab === 'signup' || tab === 'otp');
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SIGN-IN MODE TOGGLE (PHONE OTP vs PASSWORD)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     ROLE SELECTION (TENANT, LANDLORD, AGENCY, SERVICE)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function setRole(role, panel) {
    state[`${panel}Role`] = role;

    const roles = ['tenant', 'landlord', 'agency', 'service'];
    roles.forEach(r => {
      const btn = document.getElementById(`role-${panel}-${r}`);
      if (btn) {
        const isActive = (r === role);
        btn.classList.toggle('role-btn-active', isActive);
        btn.classList.toggle('auth-role-card--active', isActive);
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
          nameLabel.textContent = 'Caretaker / Contact Person Name *';
        } else if (role === 'service') {
          nameLabel.textContent = 'Service Provider Name *';
        } else {
          nameLabel.textContent = 'Full Name *';
        }
      }
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SIGN UP (STEP 1: SEND SMS OTP)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  async function handleSignUp(e) {
    e.preventDefault();
    const nameEl = document.getElementById('signup-name');
    const phoneEl = document.getElementById('signup-phone');
    const emailEl = document.getElementById('signup-email');
    const passwordEl = document.getElementById('signup-password');

    const name = nameEl ? nameEl.value.trim() : '';
    let rawPhone = phoneEl ? phoneEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const role = state.signupRole;

    // Normalize phone number to Kenyan E.164 (+254...)
    let cleanDigits = rawPhone.replace(/\D/g, '');
    let phone = '';
    if (cleanDigits.startsWith('254')) {
      phone = '+' + cleanDigits;
    } else if (cleanDigits.startsWith('0')) {
      phone = '+254' + cleanDigits.substring(1);
    } else if (cleanDigits.length === 9) {
      phone = '+254' + cleanDigits;
    } else if (cleanDigits.length > 0) {
      phone = '+' + cleanDigits;
    } else {
      phone = rawPhone;
    }

    // STRICT VALIDATION: All fields required
    if (!name || !rawPhone || !email || !password) {
      if (window.app) window.app.showToast('All fields are required including email.', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (window.app) window.app.showToast('Please enter a valid email address.', 'error');
      return;
    }

    // Phone validation (+254 followed by 9 digits = 13 characters)
    if (phone.length < 12 || !phone.startsWith('+254')) {
      if (window.app) window.app.showToast('Please enter a valid Kenyan phone number (e.g. 712345678 or 0712345678).', 'error');
      return;
    }

    if (password.length < 6) {
      if (window.app) window.app.showToast('Ã¢ÂÅ’ Password must be at least 6 characters long.', 'error');
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
          window.app.showToast(`Welcome to KejaMarket, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`Ã¢ÂÅ’ ${data.message || 'Registration failed.'}`, 'error');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      if (window.app) {
        window.app.showToast('Ã¢ÂÅ’ Unable to reach server. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SIGN IN VIA PHONE SMS OTP (ANTI-FRAUD LOGIN)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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
          window.app.showToast(`Sign-in code sent to +${data.phone}!`, 'success');
        }
      } else {
        if (window.app) window.app.showToast(`Ã¢ÂÅ’ ${data.message || 'Account not found.'}`, 'error');
      }
    } catch (err) {
      console.error('Login send-otp error:', err);
      if (window.app) {
        window.app.showToast('Ã¢ÂÅ’ Unable to connect to server. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     OTP VERIFICATION UI & COUNTDOWN
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     CONFIRM OTP (VERIFY FOR SIGNUP OR LOGIN)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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
        // Ensure admin flag is preserved in session
        if (data.user.role === 'admin' || data.user.id === 'usr-admin-01') {
          data.user.isAdmin = true;
        }
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`Phone verified! Welcome, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`Ã¢ÂÅ’ ${data.message || 'Invalid verification code.'}`, 'error');
        for (let i = 1; i <= 4; i++) {
          const el = document.getElementById(`otp-${i}`);
          if (el) el.value = '';
        }
        const first = document.getElementById('otp-1');
        if (first) first.focus();
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      if (window.app) window.app.showToast('Ã¢ÂÅ’ Verification failed. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     RESEND OTP
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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
        if (window.app) window.app.showToast(`New verification code sent to +${pendingPhone}!`, 'success');
      } else {
        if (window.app) window.app.showToast(`Ã¢ÂÅ’ ${data.message || 'Failed to resend code.'}`, 'error');
        if (resendBtn) resendBtn.disabled = false;
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      if (resendBtn) resendBtn.disabled = false;
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     PASSWORD SIGN IN
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  async function handleSignIn(e) {
    e.preventDefault();
    const identifierEl = document.getElementById('signin-identifier');
    const passwordEl = document.getElementById('signin-password');

    const identifier = identifierEl ? identifierEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    // Role is auto-detected by server from credentials

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
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        // Ensure admin flag is preserved in session
        if (data.user.role === 'admin' || data.user.id === 'usr-admin-01') {
          data.user.isAdmin = true;
        }
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.showToast(`Welcome back, ${data.user.name}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(`${data.message || 'Incorrect credentials'}`, 'error');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      if (window.app) {
        window.app.showToast('Unable to connect to server. Please check your connection and try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SIGN OUT
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function signOut() {
    clearSession();
    updateHeaderUI(null);
    // Close any open portals/modals
    if (window.app) {
      window.app.closeModal('modal-auth');
      window.app.closeModal('modal-admin');
      window.app.closeModal('modal-landlord-portal');
      window.app.closeModal('modal-service-portal');
      window.app.showToast('You have been signed out successfully.', 'info');
    }
    // Close profile dropdown if open
    closeProfileDropdown();
    // Reset to sign-in panel in auth modal
    showPanel('signin');
    // Reload listings without auth state
    if (window.app && typeof window.app.applyFilters === 'function') {
      window.app.applyFilters();
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     LOGGED-IN PANEL
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function showLoggedInPanel(session) {
    const signinEl = document.getElementById('auth-panel-signin');
    const signupEl = document.getElementById('auth-panel-signup');
    const otpEl = document.getElementById('auth-panel-otp');
    const loggedinEl = document.getElementById('auth-panel-loggedin');

    if (signinEl) signinEl.style.display = 'none';
    if (signupEl) signupEl.style.display = 'none';
    if (otpEl) otpEl.style.display = 'none';
    if (loggedinEl) loggedinEl.style.display = 'block';

    const displayName = session.name || session.email || session.phone || 'User';
    const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U';

    const avatarEl = document.getElementById('auth-user-avatar');
    const greetingEl = document.getElementById('auth-user-greeting');
    const phoneDisplayEl = document.getElementById('auth-user-phone-display');
    const badgeEl = document.getElementById('auth-user-role-badge');

    if (avatarEl) avatarEl.textContent = initials;
    if (greetingEl) greetingEl.textContent = `Hi, ${displayName}!`;
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
        badgeEl.textContent = 'Administrator';
        badgeEl.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
        badgeEl.style.color = '#ffffff';
      } else if (session.role === 'agency') {
        badgeEl.textContent = 'Real Estate Agency';
        badgeEl.style.background = '#f3e8ff';
        badgeEl.style.color = '#7c3aed';
      } else if (session.role === 'landlord') {
        badgeEl.textContent = 'Direct Landlord';
        badgeEl.style.background = '#e0e7ff';
        badgeEl.style.color = '#4f46e5';
      } else {
        badgeEl.textContent = 'Tenant';
        badgeEl.style.background = '#d1fae5';
        badgeEl.style.color = '#065f46';
      }
    }

    if (window.kejaProfile && typeof window.kejaProfile.renderProfileMenu === 'function') {
      window.kejaProfile.renderProfileMenu(session);
    }

    if (window.kejaAdmin && typeof window.kejaAdmin.checkAdminSession === 'function') {
      window.kejaAdmin.checkAdminSession();
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     HEADER UI UPDATE & ROLE SEPARATION
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function updateHeaderUI(session) {
    applyAuthWall(session);
    const label = document.getElementById('auth-header-label');
    const btn = document.getElementById('btn-auth-header');
    const mobileLabel = document.getElementById('mobile-nav-user-label');
    const adminHeaderBtn = document.getElementById('btn-admin-header');
    const landlordHeaderBtn = document.getElementById('btn-landlord-header');
    const serviceHeaderBtn = document.getElementById('btn-service-header');
    const dashboardBtn = document.getElementById('btn-my-dashboard');
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

      const displayName = session.name || session.email || session.phone || 'User';
      const firstName = displayName.split(' ')[0];
      
      if (label) label.textContent = firstName;
      if (mobileLabel) mobileLabel.textContent = (displayName.split(' ')[0] || 'Me');
      if (adminHeaderBtn) adminHeaderBtn.style.display = 'none';
      
      if (landlordHeaderBtn) {
        landlordHeaderBtn.style.display = (isLandlordOrAgent && !isAdmin && !isServiceProvider) ? 'inline-flex' : 'none';
      }
      if (serviceHeaderBtn) {
        serviceHeaderBtn.style.display = isServiceProvider ? 'inline-flex' : 'none';
      }

      // Dashboard button: visible for all logged-in non-admin users
      if (dashboardBtn) {
        dashboardBtn.style.display = !isAdmin ? 'inline-flex' : 'none';
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
          btn.style.background = 'linear-gradient(135deg, #4f46e5, #4338ca)';
          btn.style.color = 'white';
        } else if (session.role === 'service') {
          btn.style.background = 'linear-gradient(135deg, #0891b2, #06b6d4)';
          btn.style.color = 'white';
        } else {
          btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
          btn.style.color = 'white';
        }
      }

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
      if (dashboardBtn) dashboardBtn.style.display = 'none';
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
      }
      if (postAdBtn) postAdBtn.style.display = 'none';
      if (pricingBtn) pricingBtn.style.display = 'none';
      if (whatsappAlertBanner) whatsappAlertBanner.style.display = 'flex';
    }

    if (window.kejaAdmin && typeof window.kejaAdmin.checkAdminSession === 'function') {
      window.kejaAdmin.checkAdminSession();
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     PASSWORD TOGGLE
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function togglePwd(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     ROLE GUARD (LANDLORD OR AGENCY)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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
      openAuthModal('signup');
      return;
    }

    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal(modalId);
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     ROLE GUARD (ANY AUTHENTICATED USER)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
  function requireAuthForAction(modalId, actionType) {
    const session = getSession();
    if (!session) {
      const msgMap = {
        'service': 'Please sign in to post a service.',
        'marketplace': 'Please sign in to sell an item.'
      };
      const msg = msgMap[actionType] || 'Please sign in to continue.';
      if (window.app) window.app.showToast(msg, 'info');
      switchTab('signin');
      openAuthModal();
      return;
    }

    // Any authenticated user can post services and marketplace items
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal(modalId);
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     SYNC SESSION WITH SERVER ON BOOT
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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

    // Handle pending callbacks first (e.g. user was blocked by auth-wall)
    if (typeof pendingTenantAuthCallback === 'function') {
      const cb = pendingTenantAuthCallback;
      pendingTenantAuthCallback = null;
      cb(user);
      return; // Don't open dashboard if user was mid-action
    }

    if (window.app && window.app.selectedPropertyForDetail) {
      window.app.unlockDetailPhotos();
      return; // Don't open dashboard if user tapped a property photo
    }

    // AUTO-OPEN PORTAL / DASHBOARD after login
    setTimeout(() => {
      // Admin â†’ Admin Portal (unchanged)
      if (user.role === 'admin' || user.isAdmin || user.id === 'usr-admin-01') {
        if (window.kejaAdmin && typeof window.kejaAdmin.openAdminModal === 'function') {
          window.kejaAdmin.openAdminModal();
        }
        return;
      }

      // Tenant / Buyer: DO NOT auto-pop dashboard modal upon login/signup.
      // It remains accessible inside their Profile dropdown.
      if (user.role === 'tenant' || user.role === 'buyer') {
        return;
      }

      // Landlord / Agency / Service roles → Unified User Dashboard
      if (window.kejaDashboard && typeof window.kejaDashboard.open === 'function') {
        window.kejaDashboard.open();
      } else {
        // Fallback: legacy direct-portal behaviour if dashboard JS not loaded
        if (user.role === 'landlord' || user.role === 'agency') {
          if (window.kejaLandlordPortal && typeof window.kejaLandlordPortal.openLandlordPortal === 'function') {
            window.kejaLandlordPortal.openLandlordPortal();
          }
        } else if (user.role === 'service') {
          if (window.kejaServicePortal && typeof window.kejaServicePortal.openServicePortal === 'function') {
            window.kejaServicePortal.openServicePortal();
          }
        }
      }
    }, 400);
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
    
    // CRITICAL: Ensure auth button is always visible
    ensureAuthButtonVisible();
    
    applyAuthWall(session);
    updateHeaderUI(session);
    syncSession();
  }

  /**
   * Force auth button visibility on load
   */
  function ensureAuthButtonVisible() {
    const authBtn = document.getElementById('btn-auth-header');
    const authLabel = document.getElementById('auth-header-label');
    
    if (authBtn) {
      // Force button to be visible
      authBtn.style.display = 'flex';
      authBtn.style.visibility = 'visible';
      authBtn.style.opacity = '1';
      
      // Ensure it has proper styling
      authBtn.classList.add('btn-header-action', 'btn-auth-trigger');
      
      if (authLabel && !authLabel.textContent.trim()) {
        authLabel.textContent = 'Sign In';
      }
      
      console.log('âœ… Auth button visibility ensured');
    } else {
      console.error('âŒ Auth button not found in DOM');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     PROFILE DROPDOWN (Small popup near button)
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */
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

    // Build compact profile dropdown content (Jiji-style)
    const content = document.getElementById('profile-dropdown-content');
    if (content) {
      content.innerHTML = `
        <!-- Profile Header -->
        <div class="profile-dropdown-header">
          <div class="profile-avatar">
            ${(session.name || 'User').charAt(0).toUpperCase()}
          </div>
          <div class="profile-name">${session.name || 'User'}</div>
          <div class="profile-contact">${session.email || session.phone || ''}</div>
          <div class="profile-role">${session.role || 'Member'}</div>
        </div>

        <!-- Profile Menu -->
        <div class="profile-menu">
          ${(session.role === 'admin' || session.isAdmin || session.id === 'usr-admin-01') ? `
            <a href="/admin-dashboard.html" class="profile-menu-item profile-menu-admin">
              <i class="fas fa-shield-alt profile-menu-icon" style="color:#dc2626;"></i>
              <span>Admin Control Center</span>
            </a>
          ` : ''}

          <button class="profile-menu-item" onclick="kejaDashboard.open('overview'); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-th-large profile-menu-icon" style="color:#16a34a;"></i>
            <span>My Account / My Dashboard</span>
          </button>

          <button class="profile-menu-item" onclick="kejaDashboard.open('settings'); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-user-cog profile-menu-icon" style="color:#4f46e5;"></i>
            <span>My Profile & Settings</span>
          </button>
          
          <button class="profile-menu-item" onclick="kejaDashboard.open('messages'); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-comment-dots profile-menu-icon" style="color:#2563eb;"></i>
            <span>Messages / Inquiries</span>
          </button>
          
          <button class="profile-menu-item" onclick="kejaDashboard.open('notifications'); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-bell profile-menu-icon" style="color:#f59e0b;"></i>
            <span>Notifications</span>
          </button>
          
          <button class="profile-menu-item" onclick="kejaDashboard.open('faq'); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-question-circle profile-menu-icon" style="color:#008744;"></i>
            <span>Help & FAQs</span>
          </button>
          
          <button class="profile-menu-item profile-logout" onclick="kejaAuth.signOut(); kejaAuth.closeProfileDropdown();">
            <i class="fas fa-sign-out-alt profile-menu-icon" style="color:#ef4444;"></i>
            <span>Sign Out</span>
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

  /* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
     PASSWORD RESET FLOW
  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

    let currentResetToken = '';

  function showForgotPassword() {
    ['signin', 'signup', 'otp', 'loggedin', 'reset', 'forgot'].forEach(p => {
      const el = document.getElementById(`auth-panel-${p}`);
      if (el) el.style.display = 'none';
    });
    const forgot = document.getElementById('auth-panel-forgot');
    if (forgot) forgot.style.display = 'block';
    const input = document.getElementById('forgot-email') || document.getElementById('forgot-identifier');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const emailEl = document.getElementById('forgot-email') || document.getElementById('forgot-identifier');
    const email = emailEl ? emailEl.value.trim() : '';
    if (!email) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending link...'; }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      const msg = data.message || 'If that email address is registered, a password reset link has been sent. Please check your inbox.';
      if (window.app) window.app.showToast(msg, 'success');

      const form = document.getElementById('form-forgot-password');
      if (form) {
        form.innerHTML = `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
            <p style="color:#15803d;font-weight:600;margin-bottom:8px;"><i class="fas fa-check-circle"></i> Reset Link Sent</p>
            <p style="color:#374151;font-size:0.9rem;line-height:1.4;">${msg}</p>
            <p style="color:#6b7280;font-size:0.8rem;margin-top:10px;">Check your spam/junk folder if you don't see it in a few minutes.</p>
          </div>
          <p class="auth-switch-text"><a href="#" onclick="kejaAuth.showPanel('signin');return false;"><i class="fas fa-arrow-left"></i> Back to Sign In</a></p>
        `;
      }
    } catch (err) {
      if (window.app) window.app.showToast('Could not reach server. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const token = document.getElementById('reset-token-val')?.value.trim() || currentResetToken;
    const newPassword = document.getElementById('reset-new-password')?.value || '';
    const confirmPassword = document.getElementById('reset-confirm-password')?.value || '';

    if (!token) {
      if (window.app) window.app.showToast('Reset token is missing. Please click the link in your email again.', 'error');
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
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        if (data.user.role === 'admin' || data.user.id === 'usr-admin-01') {
          data.user.isAdmin = true;
        }
        saveSession(data.user, data.token);
        updateHeaderUI(data.user);
        showLoggedInPanel(data.user);
        if (window.app) {
          window.app.closeModal('modal-auth');
          window.app.showToast(`Password reset! Welcome back, ${data.user.name || 'User'}!`, 'success');
        }
        handleAuthSuccess(data.user);
      } else {
        if (window.app) window.app.showToast(data.message || 'Reset failed. Link may be invalid or expired.', 'error');
      }
    } catch (err) {
      if (window.app) window.app.showToast('Reset failed. Check your connection.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  }

  async function checkResetTokenFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('reset_token') || urlParams.get('token');
      if (!token) return;

      currentResetToken = token;

      // Clean token from address bar cleanly
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      url.searchParams.delete('token');
      const cleanSearch = url.searchParams.toString();
      const newUrl = url.pathname + (cleanSearch ? '?' + cleanSearch : '') + url.hash;
      window.history.replaceState({}, document.title, newUrl);

      // Open modal on reset panel
      openAuthModal('reset');

      const tokenInput = document.getElementById('reset-token-val');
      if (tokenInput) tokenInput.value = token;

      const subtitle = document.getElementById('reset-panel-subtitle');
      const submitBtn = document.getElementById('btn-reset-submit');

      if (subtitle) subtitle.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying your reset link...';

      // Validate token with server
      try {
        const res = await fetch('/api/auth/reset-password/validate?token=' + encodeURIComponent(token));
        const valData = await res.json();

        if (!valData.valid) {
          if (subtitle) {
            subtitle.innerHTML = '<span style="color:#ef4444;font-weight:600;"><i class="fas fa-exclamation-triangle"></i> ' + (valData.message || 'This reset link has expired or has already been used.') + '</span>';
          }
          if (submitBtn) submitBtn.disabled = true;
          if (window.app) window.app.showToast(valData.message || 'This reset link is invalid or expired.', 'error');
        } else {
          if (subtitle) subtitle.textContent = 'Choose a new password for your KejaMarket account.';
          if (submitBtn) submitBtn.disabled = false;
          const pwdInput = document.getElementById('reset-new-password');
          if (pwdInput) setTimeout(() => pwdInput.focus(), 150);
        }
      } catch (err) {
        console.warn('Token validation network check failed:', err);
        if (subtitle) subtitle.textContent = 'Choose a new password for your KejaMarket account.';
      }
    } catch (e) {
      console.error('checkResetTokenFromUrl error:', e);
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
    requireAuthForAction,
    requireTenantAuth,
    getSession,
    getToken,
    isLoggedIn: function() {
      try {
        return !!(localStorage.getItem('keja_token') || JSON.parse(localStorage.getItem('keja_session')));
      } catch {
        return false;
      }
    },
    getAuthHeaders,
    applyAuthWall,
    toggleProfileDropdown,
    closeProfileDropdown,
    showForgotPassword,
    handleForgotPassword,
    handleResetPassword,
    checkResetTokenFromUrl,
  };

})();

window.kejaAuth = kejaAuth;



/**
 * CRITICAL MODAL FIXES
 */

// Enhanced modal management
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  const backdrop = modal?.closest('.modal-backdrop');
  
  if (backdrop) {
    backdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
    
    setTimeout(() => {
      backdrop.style.display = 'none';
    }, 150);
  }
  
  console.log(`âœ… Modal ${modalId} closed properly`);
};

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  const backdrop = modal?.closest('.modal-backdrop');
  
  if (backdrop) {
    backdrop.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    setTimeout(() => {
      backdrop.classList.add('open');
    }, 10);
  }
  
  console.log(`âœ… Modal ${modalId} opened properly`);
};

// Fix backdrop clicks to close modal (except auth modal)
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    // Don't close auth modal when clicking backdrop
    if (e.target.id === 'modal-auth') {
      return; // Do nothing - keep modal open
    }
    
    e.target.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 150);
  }
});

// Fix close buttons
document.addEventListener('click', function(e) {
  const closeBtn = e.target.closest('.modal-close, .btn-modal-close, .modal-close-btn, .auth-close-btn, [data-modal-close]');
  if (closeBtn) {
    const modal = closeBtn.closest('.modal-backdrop');
    if (modal) {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 150);
    }
  }
});

// FORCE PROFILE DROPDOWN TO USE NEW DESIGN
document.addEventListener('DOMContentLoaded', function() {
  // Disable any competing modal systems for profile
  const authModal = document.getElementById('modal-auth');
  if (authModal) {
    const profilePanels = authModal.querySelectorAll('[id*="profile"], [class*="profile"]');
    profilePanels.forEach(panel => {
      if (panel.id !== 'profile-dropdown' && panel.id !== 'profile-dropdown-content') {
        panel.style.display = 'none';
      }
    });
  }
  
  // Ensure profile dropdown uses new compact design
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileDropdown) {
    // Remove any old inline styles that might conflict
    profileDropdown.removeAttribute('style');
    profileDropdown.style.display = 'none'; // Start hidden
  }
});

console.log('ðŸ”§ Modal fixes and profile dropdown optimization applied');
  /**
   * Show messages and notifications for logged-in users
   */
  function updateCommunicationButtons() {
    const session = getSession();
    const messagesBtn = document.getElementById('btn-messages');
    const notificationsBtn = document.getElementById('btn-notifications');
    
    if (session && messagesBtn) {
      messagesBtn.style.display = 'flex';
    }
    
    if (session && notificationsBtn) {
      notificationsBtn.style.display = 'flex';
    }
    
    // Add logged-in class
    if (session) {
      document.body.classList.add('user-logged-in');
    } else {
      document.body.classList.remove('user-logged-in');
      if (messagesBtn) messagesBtn.style.display = 'none';
      if (notificationsBtn) notificationsBtn.style.display = 'none';
    }
  }

  // Call this function when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateCommunicationButtons, 100);
  });

  // Make it globally accessible
  window.updateCommunicationButtons = updateCommunicationButtons;

// Auto-clean redundant +254 or 0 prefix typed into signup phone input
document.addEventListener('DOMContentLoaded', function() {
  const phoneInput = document.getElementById('signup-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      let val = this.value.replace(/[^\d+]/g, '');
      if (val.startsWith('+254')) {
        val = val.substring(4);
      } else if (val.startsWith('254')) {
        val = val.substring(3);
      } else if (val.startsWith('0')) {
        val = val.substring(1);
      }
      this.value = val;
    });
  }
});

// Check for reset token in URL on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.kejaAuth && window.kejaAuth.checkResetTokenFromUrl) {
      window.kejaAuth.checkResetTokenFromUrl();
    }
  });
} else {
  if (window.kejaAuth && window.kejaAuth.checkResetTokenFromUrl) {
    window.kejaAuth.checkResetTokenFromUrl();
  }
}
