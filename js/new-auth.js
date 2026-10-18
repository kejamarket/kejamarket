/**
 * KejaMarket – Authentication System (Redesigned & Hardened)
 * Modern, responsive AuthModal with Role Customization, Password Strength Meter,
 * In-Modal Password Recovery & Robust Error Handling.
 */

class AuthModal {
  constructor() {
    this.currentTab = 'signin';
    this.selectedRole = 'tenant';
    this.init();
  }

  init() {
    console.log('[AUTH] Initializing KejaMarket Authentication System...');
    this.bindEvents();
    this.setupPasswordStrengthMeter();
    this.setupPhoneSanitizer();
    this.checkExistingSession();
  }

  bindEvents() {
    // Tab switching buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // Form submissions
    const signinForm = document.getElementById('signin-form-element');
    if (signinForm) {
      signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
    }

    const signupForm = document.getElementById('signup-form-element');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignUp(e));
    }

    const forgotForm = document.getElementById('forgot-form-element');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => this.handleForgotSubmit(e));
    }

    // Modal close when clicking backdrop outside card
    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        this.close();
      }
    });
  }

  open(initialTab = 'signin') {
    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.style.removeProperty('display');
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    this.clearAlert();
    this.switchTab(initialTab);
  }

  close() {
    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
    if (window.app && typeof window.app.closeModal === 'function') {
      try { window.app.closeModal('modal-auth'); } catch (_) {}
    }
    this.clearAlert();
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.clearAlert();

    // Update tab pills
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Toggle panels
    document.querySelectorAll('.auth-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`${tab}-form`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Hide tab navigation when on forgot password
    const tabsNav = document.getElementById('auth-tabs-nav');
    if (tabsNav) {
      tabsNav.style.display = tab === 'forgot' ? 'none' : 'flex';
    }
  }

  selectRole(role) {
    this.selectedRole = role;

    // Update role card active states
    document.querySelectorAll('.role-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    // Conditional role fields
    const agencyFields = document.getElementById('signup-agency-fields');
    const serviceFields = document.getElementById('signup-service-fields');
    const landlordFields = document.getElementById('signup-landlord-fields');
    const nameLabel = document.getElementById('signup-name-label');

    if (agencyFields) agencyFields.style.display = role === 'agency' ? 'block' : 'none';
    if (serviceFields) serviceFields.style.display = role === 'service' ? 'block' : 'none';
    if (landlordFields) landlordFields.style.display = role === 'landlord' ? 'block' : 'none';

    if (nameLabel) {
      switch (role) {
        case 'agency':
          nameLabel.textContent = 'Contact Person Name';
          break;
        case 'service':
          nameLabel.textContent = 'Owner / Contact Person';
          break;
        case 'landlord':
          nameLabel.textContent = 'Full Name / Property Owner';
          break;
        default:
          nameLabel.textContent = 'Full Name';
      }
    }
  }

  togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const btn = input.parentElement.querySelector('.password-toggle i');

    if (input.type === 'password') {
      input.type = 'text';
      if (btn) {
        btn.classList.remove('fa-eye');
        btn.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (btn) {
        btn.classList.remove('fa-eye-slash');
        btn.classList.add('fa-eye');
      }
    }
  }

  setupPasswordStrengthMeter() {
    const pwdInput = document.getElementById('signup-password');
    const meter = document.getElementById('password-strength-container');
    const label = document.getElementById('strength-label-text');
    const confirmInput = document.getElementById('signup-confirm-password');
    const matchIcon = document.getElementById('password-match-icon');

    if (pwdInput && meter && label) {
      pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        if (!val) {
          meter.style.display = 'none';
          return;
        }
        meter.style.display = 'flex';

        // Calculate strength
        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/\d/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

        meter.className = 'password-strength-container';
        if (score <= 1) {
          meter.classList.add('strength-weak');
          label.textContent = 'Weak';
        } else if (score === 2 || score === 3) {
          meter.classList.add('strength-medium');
          label.textContent = 'Good';
        } else {
          meter.classList.add('strength-strong');
          label.textContent = 'Strong';
        }

        // Recheck confirmation if already typed
        if (confirmInput && confirmInput.value) {
          matchIcon.style.display = confirmInput.value === val ? 'inline-block' : 'none';
        }
      });
    }

    if (confirmInput && pwdInput && matchIcon) {
      confirmInput.addEventListener('input', () => {
        matchIcon.style.display = (confirmInput.value && confirmInput.value === pwdInput.value) ? 'inline-block' : 'none';
      });
    }
  }

  setupPhoneSanitizer() {
    const phoneInput = document.getElementById('signup-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        let val = phoneInput.value;
        // Strip non-digits
        val = val.replace(/\D/g, '');
        // If user typed 254... or 07... or 01... strip leading 254 or 0
        if (val.startsWith('254')) val = val.slice(3);
        if (val.startsWith('0')) val = val.slice(1);
        phoneInput.value = val;
      });
    }
  }

  getApiBase() {
    if (window.location.origin.includes(':3000') || window.location.origin.includes(':5500') || window.location.protocol === 'file:') {
      return 'http://localhost:3001';
    }
    return '';
  }

  showAlert(message, type = 'error') {
    const box = document.getElementById('auth-alert-box');
    if (!box) return;
    box.className = `auth-alert-box ${type}`;
    const icon = type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    box.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    box.style.display = 'flex';
    try {
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
    if (type === 'error' && window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(message, 'error');
    }
  }

  clearAlert() {
    const box = document.getElementById('auth-alert-box');
    if (box) {
      box.style.display = 'none';
      box.innerHTML = '';
    }
  }

  showForgot() {
    this.switchTab('forgot');
    const successBox = document.getElementById('forgot-success-box');
    if (successBox) successBox.style.display = 'none';
  }

  // ════════════════════════════════════════════════════════════════
  // SIGN IN HANDLER
  // ════════════════════════════════════════════════════════════════
  async handleSignIn(e) {
    e.preventDefault();
    this.clearAlert();

    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');
    const submitBtn = e.target.querySelector('.auth-btn-primary');

    const identifier = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!identifier || !password) {
      this.showAlert('Please enter both your phone/email and password.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Signing In...');

    try {
      const response = await fetch(`${this.getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.handleAuthSuccess(data.user, data.token);
      } else {
        this.showAlert(data.message || 'Invalid credentials. Please verify your phone/email and password.');
      }
    } catch (err) {
      console.error('[AUTH] Sign in error:', err);
      this.showAlert('Network error: Unable to connect to server. Please try again.');
    } finally {
      this.setButtonLoading(submitBtn, false, 'Sign In');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // SIGN UP HANDLER
  // ════════════════════════════════════════════════════════════════
  async handleSignUp(e) {
    e.preventDefault();
    this.clearAlert();

    const terms = document.getElementById('signup-terms');
    if (terms && !terms.checked) {
      this.showAlert('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    const name = document.getElementById('signup-name')?.value?.trim();
    let phone = document.getElementById('signup-phone')?.value?.trim();
    const email = document.getElementById('signup-email')?.value?.trim();
    const password = document.getElementById('signup-password')?.value;
    const confirmPassword = document.getElementById('signup-confirm-password')?.value;
    const submitBtn = e.target.querySelector('.auth-btn-primary');

    if (!name || !phone || !email || !password) {
      this.showAlert('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      this.showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      this.showAlert('Passwords do not match. Please re-enter.');
      return;
    }

    // Format phone to 254XXXXXXXXX
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('254')) cleanPhone = cleanPhone.slice(3);
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
    if (cleanPhone.length < 9) {
      this.showAlert('Please enter a valid 9-digit Kenyan phone number (e.g. 712 345 678).');
      return;
    }
    const fullCanonicalPhone = '254' + cleanPhone;

    // Build payload
    const userData = {
      name,
      phone: fullCanonicalPhone,
      email,
      password,
      role: this.selectedRole
    };

    if (this.selectedRole === 'agency') {
      userData.agencyName = document.getElementById('signup-agency-name')?.value?.trim() || name;
      userData.officeLocation = document.getElementById('signup-agency-location')?.value?.trim() || '';
    } else if (this.selectedRole === 'landlord') {
      userData.area = document.getElementById('signup-landlord-area')?.value?.trim() || '';
    } else if (this.selectedRole === 'service') {
      userData.serviceCategory = document.getElementById('signup-service-category')?.value || 'artisan';
      userData.serviceBusiness = document.getElementById('signup-service-business')?.value?.trim() || name;
    }

    this.setButtonLoading(submitBtn, true, 'Creating Account...');

    try {
      const response = await fetch(`${this.getApiBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.handleAuthSuccess(data.user, data.token);
      } else {
        const errorMsg = data.message || 'Registration was unsuccessful. Please verify your details.';
        this.showAlert(errorMsg, 'error');
        if (errorMsg.toLowerCase().includes('already exists')) {
          const box = document.getElementById('auth-alert-box');
          if (box) {
            box.innerHTML += ' <a href="#" style="color:#2563eb; font-weight:800; text-decoration:underline; margin-left:8px;" onclick="authModal.switchTab(\'signin\'); return false;">Sign In Here &rarr;</a>';
          }
        }
      }
    } catch (err) {
      console.error('[AUTH] Sign up error:', err);
      this.showAlert('Network error: Unable to connect to server. Please try again.');
    } finally {
      this.setButtonLoading(submitBtn, false, 'Create My Free Account');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD HANDLER (In-Modal, Zero popups!)
  // ════════════════════════════════════════════════════════════════
  async handleForgotSubmit(e) {
    e.preventDefault();
    this.clearAlert();

    const input = document.getElementById('forgot-identifier');
    const identifier = input ? input.value.trim() : '';
    const submitBtn = document.getElementById('btn-forgot-submit');
    const successBox = document.getElementById('forgot-success-box');

    if (!identifier) {
      this.showAlert('Please enter your registered email address or phone number.');
      return;
    }

    this.setButtonLoading(submitBtn, true, 'Sending...');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, identifier })
      });

      const data = await res.json();

      if (successBox) {
        successBox.style.display = 'block';
        const msgEl = document.getElementById('forgot-success-msg');
        if (msgEl) {
          msgEl.textContent = data.message || `If ${identifier} is registered, instructions have been sent.`;
        }
      }
      this.showAlert('Reset instructions dispatched successfully.', 'success');
    } catch (err) {
      this.showAlert('Could not contact server. Please check your connection.');
    } finally {
      this.setButtonLoading(submitBtn, false, 'Send Reset Link / SMS');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // GOOGLE ONE-TAP & OAUTH
  // ════════════════════════════════════════════════════════════════
  googleSignIn() {
    this.showAlert('Connecting with Google...', 'info');

    const GOOGLE_CLIENT_ID = '1084466637843-gqefl7vr6pqmgbm0l9l6lnm9oqkfhqrc.apps.googleusercontent.com';

    if (!window.google || !window.google.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        setTimeout(() => this.googleSignIn(), 300);
      };
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (data.success && data.user) {
              this.handleAuthSuccess(data.user, data.token);
            } else {
              this.showAlert(data.message || 'Google Sign-In failed.');
            }
          } catch (e) {
            this.showAlert('Google Sign-In error. Please try password sign-in.');
          }
        }
      });

      window.google.accounts.id.prompt();
    } catch (e) {
      this.showAlert('Google service is currently unavailable. Please use email/password.');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // AUTH SUCCESS & SESSION
  // ════════════════════════════════════════════════════════════════
  handleAuthSuccess(user, token) {
    const userStr = JSON.stringify(user);
    const sessionKeys = [
      'keja_user',
      'keja_session',
      'kejamarket_user',
      'user'
    ];
    sessionKeys.forEach(k => {
      try { localStorage.setItem(k, userStr); } catch (_) {}
    });
    if (token) {
      try {
        localStorage.setItem('keja_token', token);
        localStorage.setItem('kejamarket_auth_token', token);
      } catch (_) {}
    }

    // Immediately update header UI across both auth implementations
    this.updateHeaderUI(user);
    if (window.kejaAuth && typeof window.kejaAuth.updateHeaderUI === 'function') {
      try { window.kejaAuth.updateHeaderUI(user); } catch (_) {}
    }
    if (window.updateCommunicationButtons) {
      try { window.updateCommunicationButtons(); } catch (_) {}
    }

    // Immediately close modal pop-up
    this.close();

    // Show friendly, prominent welcome toast
    const firstName = user.name ? user.name.trim().split(' ')[0] : 'there';
    const welcomeMsg = `Welcome, ${firstName}! Your KejaMarket account is ready.`;

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast(welcomeMsg, 'success');
    } else {
      this.showToast(welcomeMsg, 'success');
    }

    // Dispatch global events so components immediately refresh to logged-in state
    window.dispatchEvent(new CustomEvent('keja:auth:login', { detail: { user, token } }));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));

    // Redirect to admin dashboard if admin
    if (user.role === 'admin' || user.isAdmin || user.id === 'usr-admin-01') {
      setTimeout(() => {
        if (confirm('Administrator account detected. Would you like to open the Admin Control Center?')) {
          window.location.href = '/admin-dashboard.html';
        }
      }, 500);
    }
  }

  updateHeaderUI(user) {
    const authLabel = document.getElementById('auth-header-label');
    if (authLabel) {
      const firstName = user && user.name ? user.name.trim().split(' ')[0] : (user ? 'Account' : 'Sign In');
      authLabel.textContent = firstName;
    }
  }

  checkExistingSession() {
    try {
      const userData = localStorage.getItem('keja_user') || localStorage.getItem('kejamarket_user') || localStorage.getItem('keja_session');
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user.name) {
          this.updateHeaderUI(user);
        }
      }
    } catch (e) {
      console.warn('[AUTH] Session parse error:', e);
    }
  }

  signOut() {
    const sessionKeys = [
      'keja_token',
      'keja_session',
      'keja_user',
      'kejamarket_user',
      'kejamarket_auth_token',
      'user',
      'currentUser',
      'keja_active_hunt_id'
    ];
    sessionKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
      try { sessionStorage.removeItem(k); } catch (_) {}
    });
    try {
      document.cookie = 'token=; Max-Age=0; path=/;';
      document.cookie = 'keja_token=; Max-Age=0; path=/;';
    } catch (_) {}

    const authLabel = document.getElementById('auth-header-label');
    if (authLabel) authLabel.textContent = 'Sign In';

    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';

    if (window.kejaAuth && typeof window.kejaAuth.updateHeaderUI === 'function') {
      try { window.kejaAuth.updateHeaderUI(null); } catch (_) {}
    }

    this.close();

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('You have been signed out successfully.', 'info');
    }

    window.dispatchEvent(new CustomEvent('keja:auth:logout'));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));

    // Seamless refresh so the page cleanly reflects the guest / logged-out state
    setTimeout(() => {
      window.location.href = '/';
    }, 250);
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  setButtonLoading(button, isLoading, text) {
    if (!button) return;
    button.disabled = isLoading;
    if (isLoading) {
      button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${text}</span>`;
    } else {
      button.innerHTML = `<span>${text}</span> <i class="fas fa-arrow-right"></i>`;
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.authModal = new AuthModal();
});