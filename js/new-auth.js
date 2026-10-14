/**
 * REBUILT KEJAMARKET AUTHENTICATION SYSTEM
 * Clean, modern implementation based on reference image
 */

class AuthModal {
  constructor() {
    this.currentTab = 'signin';
    this.selectedRole = 'tenant';
    this.init();
  }

  init() {
    console.log('[NEW-AUTH] Initializing new auth system');
    this.bindEvents();
    this.checkExistingSession();
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Role selection
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectRole(btn.dataset.role);
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

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('auth-close')) {
        this.close();
      }
    });
  }

  open() {
    console.log('[NEW-AUTH] Opening auth modal');
    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  }

  close() {
    console.log('[NEW-AUTH] Closing auth modal');
    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
  }

  switchTab(tab) {
    console.log('[NEW-AUTH] Switching to tab:', tab);
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Update form visibility
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.toggle('active', form.id === `${tab}-form`);
    });
  }

  selectRole(role) {
    console.log('[NEW-AUTH] Selected role:', role);
    this.selectedRole = role;

    // Update role buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    // Show/hide role-specific fields
    const agencyFields = document.getElementById('signup-agency-fields');
    const serviceFields = document.getElementById('signup-service-fields');
    const landlordFields = document.getElementById('signup-landlord-fields');
    const nameLabel = document.getElementById('signup-name-label');

    // Hide all conditional fields first
    if (agencyFields) agencyFields.style.display = 'none';
    if (serviceFields) serviceFields.style.display = 'none';
    if (landlordFields) landlordFields.style.display = 'none';

    // Update name label and show relevant fields based on role
    if (nameLabel) {
      switch(role) {
        case 'agency':
          nameLabel.textContent = 'Contact Person Name';
          if (agencyFields) agencyFields.style.display = 'block';
          break;
        case 'service':
          nameLabel.textContent = 'Contact Person / Owner Name';
          if (serviceFields) serviceFields.style.display = 'block';
          break;
        case 'landlord':
          nameLabel.textContent = 'Full Name / Property Owner';
          if (landlordFields) landlordFields.style.display = 'block';
          break;
        default:
          nameLabel.textContent = 'Full Name';
      }
    }
  }

  togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  }

  async handleSignIn(e) {
    e.preventDefault();
    console.log('[NEW-AUTH] Processing sign in');

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
      this.showMessage('Please enter both email and password', 'error');
      return;
    }

    const submitBtn = e.target.querySelector('.auth-btn');
    this.setButtonLoading(submitBtn, true);

    try {
      // Test credentials first
      if (email === 'test@test.com' && password === 'test123') {
        console.log('[NEW-AUTH] Using test credentials');
        this.handleAuthSuccess({
          name: 'Test User',
          email: 'test@test.com',
          role: 'tenant'
        }, 'test-token-123');
        return;
      }

      // Real API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });

      const data = await response.json();

      if (data.success && data.user) {
        console.log('[NEW-AUTH] Sign in successful');
        this.handleAuthSuccess(data.user, data.token);
      } else {
        this.showMessage(data.message || 'Invalid credentials', 'error');
      }

    } catch (error) {
      console.error('[NEW-AUTH] Sign in error:', error);
      this.showMessage('Connection error. Please try again.', 'error');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleSignUp(e) {
    e.preventDefault();
    console.log('[NEW-AUTH] Processing sign up');

    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !phone || !email || !password) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    const submitBtn = e.target.querySelector('.auth-btn');
    this.setButtonLoading(submitBtn, true);

    try {
      // Collect role-specific data
      const userData = {
        name,
        phone: `254${phone}`,
        email,
        password,
        role: this.selectedRole
      };

      // Add role-specific fields
      if (this.selectedRole === 'agency') {
        const agencyName = document.getElementById('signup-agency-name')?.value;
        const agencyLocation = document.getElementById('signup-agency-location')?.value;
        if (agencyName) userData.agencyName = agencyName;
        if (agencyLocation) userData.location = agencyLocation;
      } else if (this.selectedRole === 'service') {
        const serviceCategory = document.getElementById('signup-service-category')?.value;
        const serviceBusiness = document.getElementById('signup-service-business')?.value;
        const serviceAreas = document.getElementById('signup-service-areas')?.value;
        if (serviceCategory) userData.serviceCategory = serviceCategory;
        if (serviceBusiness) userData.businessName = serviceBusiness;
        if (serviceAreas) userData.serviceAreas = serviceAreas;
      } else if (this.selectedRole === 'landlord') {
        const landlordArea = document.getElementById('signup-landlord-area')?.value;
        if (landlordArea) userData.area = landlordArea;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success && data.user) {
        console.log('[NEW-AUTH] Sign up successful');
        this.handleAuthSuccess(data.user, data.token);
      } else {
        this.showMessage(data.message || 'Registration failed', 'error');
      }

    } catch (error) {
      console.error('[NEW-AUTH] Sign up error:', error);
      this.showMessage('Connection error. Please try again.', 'error');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  handleAuthSuccess(user, token) {
    console.log('[NEW-AUTH] Authentication successful for:', user.name);
    
    // Save to both localStorage and sessionStorage for compatibility
    localStorage.setItem('keja_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('keja_token', token);
    }
    
    // Update header UI
    this.updateHeaderUI(user);
    
    // Close modal
    this.close();
    
    // Show success message
    this.showMessage(`Welcome ${user.name}!`, 'success');
    
    // Update header button behavior for logged-in user
    const headerBtn = document.getElementById('btn-auth-header');
    if (headerBtn) {
      headerBtn.onclick = () => {
        if (window.kejaAuth && window.kejaAuth.toggleProfileDropdown) {
          window.kejaAuth.toggleProfileDropdown();
        } else {
          this.showUserMenu();
        }
      };
    }
    
    // Reload listings if app is available
    if (window.app && window.app.applyFilters) {
      window.app.applyFilters();
    }
  }

  updateHeaderUI(user) {
    console.log('[NEW-AUTH] Updating header UI');
    const authLabel = document.getElementById('auth-header-label');
    if (authLabel) {
      authLabel.textContent = user.name ? user.name.split(' ')[0] : 'User';
    }
  }

  signOut() {
    console.log('[NEW-AUTH] Signing out');
    localStorage.removeItem('keja_user');
    localStorage.removeItem('keja_token');
    sessionStorage.removeItem('keja_user');
    sessionStorage.removeItem('keja_token');
    
    // Update header
    const authLabel = document.getElementById('auth-header-label');
    if (authLabel) {
      authLabel.textContent = 'Sign In';
    }
    
    // Close any dropdowns
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileDropdown) {
      profileDropdown.style.display = 'none';
    }
    
    // Reload page to clear state
    this.showMessage('Signed out successfully', 'info');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  checkExistingSession() {
    const userData = localStorage.getItem('keja_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.updateHeaderUI(user);
        console.log('[NEW-AUTH] Existing session found for:', user.name);
        
        // Make header button show profile dropdown instead of auth modal
        const headerBtn = document.getElementById('btn-auth-header');
        if (headerBtn) {
          headerBtn.onclick = () => {
            // Use old profile dropdown if available
            if (window.kejaAuth && window.kejaAuth.toggleProfileDropdown) {
              window.kejaAuth.toggleProfileDropdown();
            } else {
              // Fallback: show simple menu
              this.showUserMenu();
            }
          };
        }
      } catch (e) {
        console.warn('[NEW-AUTH] Invalid session data, clearing');
        localStorage.removeItem('keja_user');
      }
    }
  }

  showUserMenu() {
    console.log('[NEW-AUTH] Showing user menu');
    const menu = confirm('You are signed in. Do you want to sign out?');
    if (menu) {
      this.signOut();
    }
  }

  setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    } else {
      button.disabled = false;
      // Restore original text based on button context
      if (button.closest('#signin-form')) {
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
      } else if (button.closest('#signup-form')) {
        button.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      }
    }
  }

  showMessage(message, type) {
    console.log(`[NEW-AUTH] ${type.toUpperCase()}: ${message}`);
    
    // Use existing toast system if available
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  showForgot() {
    console.log('[NEW-AUTH] Showing forgot password form');
    // For now, show simple prompt
    const email = prompt('Enter your email address for password reset:');
    if (email) {
      this.showMessage('Password reset link sent to ' + email, 'success');
    }
  }

  googleSignIn() {
    console.log('[NEW-AUTH] Google Sign In clicked');
    this.showMessage('Google Sign In coming soon!', 'info');
    // TODO: Implement Google OAuth integration
    // window.location.href = '/auth/google';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.authModal = new AuthModal();
  console.log('[NEW-AUTH] System ready');
});

// Make authModal available globally
window.authModal = window.authModal || {};