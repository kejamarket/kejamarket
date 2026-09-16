/**
 * Enhanced KejaMarket Registration System
 * Multi-step registration with proper role hierarchy
 */

const KejaEnhancedAuth = {
  
  // Registration state
  currentStep: 1,
  selectedUserType: null,
  selectedPropertyRole: null,
  registrationData: {},

  // Property management role definitions (sub-roles under Property Account)
  propertyRoles: {
    'landlord': {
      title: 'Landlord / Long-term Rental',
      icon: '🏠',
      description: 'I own rental properties for long-term tenants (monthly/yearly leases)',
      propertyType: 'long-term-rental',
      dashboardFeatures: ['monthly rent', 'vacant units', 'tenant inquiries', 'viewing requests', 'lease management']
    },
    'airbnb-host': {
      title: 'Airbnb / Short-Stay Host',
      icon: '🏨',
      description: 'I host short-term accommodations (nightly/weekly stays)',
      propertyType: 'short-stay',
      dashboardFeatures: ['nightly pricing', 'availability calendar', 'booking requests', 'guest inquiries', 'check-in/out', 'reviews', 'earnings']
    },
    'serviced-apartment': {
      title: 'Serviced Apartment',
      icon: '🏨',
      description: 'I manage furnished apartments with hotel-like services',
      propertyType: 'serviced-apartment',
      dashboardFeatures: ['nightly/monthly rates', 'service amenities', 'booking management', 'guest services', 'occupancy tracking']
    },
    'agent': {
      title: 'Real Estate Agent',
      icon: '🤝', 
      description: 'I help clients find, rent, and sell properties',
      propertyType: 'agent-listings',
      dashboardFeatures: ['client properties', 'commission tracking', 'viewing schedules', 'client management', 'property portfolio']
    },
    'caretaker': {
      title: 'Caretaker',
      icon: '🏢',
      description: 'I manage long-term rental properties on behalf of owners',
      propertyType: 'long-term-rental',
      dashboardFeatures: ['managed properties', 'unit availability', 'tenant inquiries', 'owner communication', 'maintenance requests']
    },
    'property-manager': {
      title: 'Property Manager',
      icon: '🏢',
      description: 'I professionally manage multiple properties for various owners',
      propertyType: 'multi-property',
      dashboardFeatures: ['property portfolio', 'owner accounts', 'tenant management', 'financial reporting', 'maintenance coordination']
    },
    'guest-house': {
      title: 'Guest House / Lodge',
      icon: '🏨',
      description: 'I operate a guest house, lodge, or small hotel',
      propertyType: 'hospitality',
      dashboardFeatures: ['room management', 'reservations', 'guest services', 'occupancy rates', 'hospitality amenities']
    },
    'commercial': {
      title: 'Commercial Property Owner',
      icon: '🏢',
      description: 'I own/manage office spaces, retail, or commercial properties',
      propertyType: 'commercial',
      dashboardFeatures: ['commercial units', 'lease agreements', 'business tenants', 'commercial rates', 'property services']
    }
  },

  // Main account types
  mainAccountTypes: {
    'property-account': {
      title: 'Property Account',
      icon: '🏠',
      description: 'List and manage rental properties, connect with tenants and manage available units.',
      subtitle: 'Landlord / Agent',
      subRoles: ['landlord', 'agent', 'caretaker', 'property-manager']
    },
    'tenant': {
      title: 'Tenant',
      icon: '👤',
      description: 'Search for properties, save favorites, contact property owners, and buy/sell house items.',
      permissions: {
        listProperty: false,
        manageProperty: false,
        searchProperties: true,
        requestViewing: true,
        sellHouseItems: true,
        listServices: false,
        receivePropertyInquiries: false,
        receiveServiceInquiries: false
      }
    },
    'service-provider': {
      title: 'Service Provider',
      icon: '🔧',
      description: 'List services, manage your service profile, and sell relevant products.',
      permissions: {
        listProperty: false,
        manageProperty: false,
        searchProperties: true,
        requestViewing: true, // optional for service providers
        sellHouseItems: true, // if relevant products
        listServices: true,
        receivePropertyInquiries: false,
        receiveServiceInquiries: true
      }
    }
  },

  /**
   * Initialize enhanced registration
   */
  init() {
    console.log('Enhanced Registration System initialized');
    this.overrideDefaultAuth();
    this.createEnhancedSignupFlow();
    this.bindEvents();
  },

  /**
   * Override default auth system
   */
  overrideDefaultAuth() {
    // Override the setRole function for signup to use our enhanced flow
    if (window.kejaAuth && typeof window.kejaAuth.setRole === 'function') {
      const originalSetRole = window.kejaAuth.setRole;
      window.kejaAuth.setRole = (role, panel) => {
        if (panel === 'signup') {
          // For signup, show our enhanced registration instead
          this.showEnhancedRegistration();
          return;
        }
        // For signin, use original function
        originalSetRole(role, panel);
      };
    }

    // Override any existing signup button click handlers
    document.addEventListener('click', (e) => {
      if (e.target.matches('[onclick*="signup"]') || 
          e.target.matches('.role-btn[onclick*="signup"]') ||
          e.target.closest('.role-btn[onclick*="signup"]')) {
        e.preventDefault();
        e.stopPropagation();
        this.showEnhancedRegistration();
        return false;
      }
    });
  },

  /**
   * Show enhanced registration modal
   */
  showEnhancedRegistration() {
    // Close any existing auth modal
    if (window.app && typeof window.app.closeModal === 'function') {
      window.app.closeModal('modal-auth');
    }
    
    // Show our enhanced modal
    setTimeout(() => {
      this.createEnhancedSignupFlow();
      const authModal = document.getElementById('modal-auth');
      if (authModal) {
        authModal.style.display = 'flex';
      }
    }, 100);
  },

  /**
   * Create enhanced multi-step signup flow
   */
  createEnhancedSignupFlow() {
    // Find the existing signup form
    const existingForm = document.getElementById('form-signup');
    if (!existingForm) return;

    const signupPanel = existingForm.closest('#auth-panel-signup');
    if (!signupPanel) return;

    // Create new enhanced signup structure
    const enhancedSignup = document.createElement('div');
    enhancedSignup.id = 'enhanced-signup';
    enhancedSignup.innerHTML = this.getSignupStepHTML(1);

    // Replace existing form
    signupPanel.innerHTML = '';
    signupPanel.appendChild(enhancedSignup);
  },

  /**
   * Get HTML for specific signup step
   */
  getSignupStepHTML(step) {
    switch(step) {
      case 1:
        return this.getStep1HTML();
      case 2:
        return this.getStep2HTML();
      case 3:
        return this.getStep3HTML();
      case 4:
        return this.getStep4HTML();
      default:
        return this.getStep1HTML();
    }
  },

  /**
   * Step 1: Choose main user type
   */
  getStep1HTML() {
    return `
      <div class="signup-step" data-step="1">
        <div class="step-header">
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
            Create your KejaMarket account
          </h3>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
            Choose your account type:
          </p>
        </div>

        <div class="user-type-selection">
          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('property-account')" data-type="property-account">
            <div class="user-type-icon">🏠</div>
            <div class="user-type-content">
              <div class="user-type-title">Landlord / Agent</div>
              <div class="user-type-desc">List property • Manage property listings • Receive tenant inquiries • Sell property-related items • Optionally offer services</div>
            </div>
          </div>

          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('tenant')" data-type="tenant">
            <div class="user-type-icon">👤</div>
            <div class="user-type-content">
              <div class="user-type-title">Tenant</div>
              <div class="user-type-desc">Search for properties • Save/favorite properties • Contact landlords/agents/caretakers • Request viewings • Buy used house items</div>
            </div>
          </div>

          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('service-provider')" data-type="service-provider">
            <div class="user-type-icon">🔧</div>
            <div class="user-type-content">
              <div class="user-type-title">Service Provider</div>
              <div class="user-type-desc">List services • Manage service profile • Receive service inquiries • Sell relevant products/items</div>
            </div>
          </div>
        </div>

        <div class="step-navigation" style="margin-top: 24px;">
          <button class="btn-back" onclick="app.closeModal('modal-auth')" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;">
            Cancel
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Step 2: Choose property management role
   */
  getStep2HTML() {
    if (this.selectedUserType !== 'property-account') {
      return this.getDirectRegistrationHTML();
    }

    return `
      <div class="signup-step" data-step="2">
        <div class="step-header">
          <div class="property-account-header">
            <div class="account-type-badge">🏠 PROPERTY ACCOUNT</div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
              What do you manage?
            </h3>
            <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
              Choose your property management specialization:
            </p>
          </div>
        </div>

        <div class="property-role-selection">
          ${Object.entries(this.propertyRoles).map(([key, role]) => `
            <div class="property-role-card enhanced-role-card" onclick="KejaEnhancedAuth.selectPropertyRole('${key}')" data-role="${key}">
              <div class="role-option">
                <div class="role-radio">
                  <input type="radio" name="property-role" value="${key}" id="role-${key}">
                  <span class="role-icon">${role.icon}</span>
                </div>
                <div class="role-info">
                  <div class="role-title">${role.title}</div>
                  <div class="role-desc">${role.description}</div>
                  <div class="dashboard-preview">
                    Dashboard: ${role.dashboardFeatures.slice(0, 3).join(' • ')}${role.dashboardFeatures.length > 3 ? '...' : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="property-system-note" style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #059669;">
          <div style="display: flex; align-items: center; gap: 8px; color: #059669; font-weight: 600; margin-bottom: 8px;">
            <i class="fas fa-info-circle"></i>
            One Property System, Multiple Specializations
          </div>
          <div style="color: #064e3b; font-size: 0.85rem; line-height: 1.4;">
            Each role gets a specialized dashboard designed for your property type - from nightly Airbnb rates to monthly rental management.
          </div>
        </div>

        <div class="step-navigation" style="margin-top: 24px;">
          <button class="btn-back" onclick="KejaEnhancedAuth.goToStep(1)">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <button class="btn-next" onclick="KejaEnhancedAuth.goToStep(3)" id="step2-next" disabled>
            Continue <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Step 3: Role-specific information
   */
  getStep3HTML() {
    return `
      <div class="signup-step" data-step="3">
        ${this.getRoleSpecificForm()}
        
        <div class="step-navigation" style="margin-top: 24px;">
          <button class="btn-back" onclick="KejaEnhancedAuth.goToStep(2)">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <button class="btn-next" onclick="KejaEnhancedAuth.goToStep(4)" id="step3-next">
            Continue <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Step 4: Final registration
   */
  getStep4HTML() {
    return `
      <div class="signup-step" data-step="4">
        <div class="step-header">
          <div class="verification-icon" style="text-align: center; margin-bottom: 20px;">
            <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <i class="fas fa-shield-alt" style="color: #059669; font-size: 1.8rem;"></i>
            </div>
          </div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
            Submit for Verification
          </h3>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
            Your information will be reviewed and verified within 24 hours.
          </p>
        </div>

        <div class="registration-summary">
          <div class="summary-card">
            <h4>Registration Summary</h4>
            <div class="summary-item">
              <span class="label">User Type:</span>
              <span class="value" id="summary-user-type"></span>
            </div>
            <div class="summary-item" id="summary-role-item">
              <span class="label">Role:</span>
              <span class="value" id="summary-role"></span>
            </div>
            <div class="summary-item">
              <span class="label">Name:</span>
              <span class="value" id="summary-name"></span>
            </div>
            <div class="summary-item" id="summary-properties-item" style="display: none;">
              <span class="label">Properties:</span>
              <span class="value" id="summary-properties"></span>
            </div>
          </div>
        </div>

        <form id="final-registration-form" onsubmit="KejaEnhancedAuth.submitRegistration(event)">
          <div class="form-group">
            <label>Phone Number *</label>
            <input type="tel" id="final-phone" class="form-control" placeholder="+254..." required>
          </div>
          
          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" id="final-email" class="form-control" placeholder="your@email.com" required>
          </div>
          
          <div class="form-group">
            <label>Password *</label>
            <input type="password" id="final-password" class="form-control" placeholder="Min 6 characters" required>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%; background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 14px; border-radius: 12px; font-weight: 700;">
            <i class="fas fa-shield-alt"></i> Submit for Verification
          </button>
        </form>

        <div class="step-navigation" style="margin-top: 16px;">
          <button class="btn-back" onclick="KejaEnhancedAuth.goToStep(3)">
            <i class="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Get role-specific form content
   */
  getRoleSpecificForm() {
    switch(this.selectedPropertyRole) {
      case 'caretaker':
        return this.getCaretakerForm();
      case 'landlord':
        return this.getLandlordForm();
      case 'agent':
        return this.getAgentForm();
      case 'company':
        return this.getCompanyForm();
      default:
        return this.getLandlordForm();
    }
  },

  /**
   * Caretaker-specific form (simplified - properties added later in dashboard)
   */
  getCaretakerForm() {
    return `
      <div class="step-header">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
          Property Manager Details
        </h3>
        <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
          Complete your profile - you can add properties in your dashboard
        </p>
      </div>

      <form id="caretaker-form">
        <div class="form-group">
          <label>Your Full Name *</label>
          <input type="text" id="caretaker-name" class="form-control" placeholder="e.g. John Mwangi" required>
        </div>

        <div class="form-group">
          <label>Your Position *</label>
          <select id="caretaker-position" class="form-control" required>
            <option value="">Select your role</option>
            <option value="caretaker">Building Caretaker</option>
            <option value="property-manager">Property Manager</option>
            <option value="estate-manager">Estate Manager</option>
            <option value="facility-manager">Facility Manager</option>
          </select>
        </div>

        <div class="form-group">
          <label>Years of Experience *</label>
          <select id="caretaker-experience" class="form-control" required>
            <option value="">Select experience</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div class="form-group">
          <label>Area of Operation *</label>
          <input type="text" id="caretaker-area" class="form-control" placeholder="e.g. Nairobi, Kilimani, Westlands" required>
        </div>

        <div class="form-group" style="margin-top: 24px;">
          <label>Additional Information (Optional)</label>
          <textarea id="caretaker-notes" class="form-control" rows="3" placeholder="Brief description of your experience, certifications, or special skills..."></textarea>
        </div>

        <div class="signup-note" style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #059669;">
          <div style="display: flex; align-items: center; gap: 8px; color: #059669; font-weight: 600; margin-bottom: 8px;">
            <i class="fas fa-info-circle"></i>
            Next Steps
          </div>
          <div style="color: #064e3b; font-size: 0.9rem; line-height: 1.4;">
            After registration, you'll access your Property Partner Dashboard where you can add buildings, create unit listings, and manage your portfolio.
          </div>
        </div>
      </form>
    `;
  },

  /**
   * Get direct registration for non-property-account roles
   */
  getDirectRegistrationHTML() {
    const userTypeData = {
      'tenant': { 
        title: 'Tenant Registration', 
        desc: 'Complete your tenant profile to find your ideal home',
        icon: '👤',
        permissions: [
          '✅ Search for properties',
          '✅ Save/favorite properties', 
          '✅ Contact property owners',
          '✅ Request viewings',
          '✅ Buy/sell used house items',
          '❌ Cannot list properties for rent'
        ]
      },
      'service-provider': { 
        title: 'Service Provider Registration', 
        desc: 'Set up your service business profile and start connecting with property owners',
        icon: '🔧',
        permissions: [
          '✅ List services',
          '✅ Manage service profile',
          '✅ Receive service inquiries',
          '✅ Sell relevant products/items',
          '✅ Search properties (optional)',
          '❌ Cannot list properties for rent'
        ]
      }
    };

    const data = userTypeData[this.selectedUserType] || userTypeData.tenant;

    return `
      <div class="signup-step" data-step="direct">
        <div class="step-header">
          <div class="step-icon" style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 3rem;">${data.icon}</div>
          </div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
            ${data.title}
          </h3>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
            ${data.desc}
          </p>
        </div>

        <div class="permissions-display" style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <h4 style="color: #1e293b; font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">
            Your Account Permissions:
          </h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${data.permissions.map(permission => `
              <li style="padding: 4px 0; font-size: 0.85rem; color: #4b5563;">
                ${permission}
              </li>
            `).join('')}
          </ul>
        </div>

        <form id="direct-registration-form" onsubmit="KejaEnhancedAuth.submitDirectRegistration(event)">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="direct-name" class="form-control" placeholder="e.g. John Mwangi" required>
          </div>
          
          ${this.selectedUserType === 'service-provider' ? `
          <div class="form-group">
            <label>Service Type *</label>
            <select id="direct-service-type" class="form-control" required>
              <option value="">Select your primary service</option>
              <option value="plumbing">🔧 Plumbing</option>
              <option value="electrical">⚡ Electrical</option>
              <option value="cleaning">🧽 Cleaning Services</option>
              <option value="moving">📦 Moving & Relocation</option>
              <option value="painting">🎨 Painting</option>
              <option value="carpentry">🔨 Carpentry</option>
              <option value="security">🛡️ Security Services</option>
              <option value="gardening">🌱 Gardening & Landscaping</option>
              <option value="appliance">🔧 Appliance Repair</option>
              <option value="pest-control">🐛 Pest Control</option>
              <option value="roofing">🏠 Roofing</option>
              <option value="other">🔧 Other Services</option>
            </select>
          </div>

          <div class="form-group">
            <label>Service Description *</label>
            <textarea id="direct-service-desc" class="form-control" rows="3" placeholder="Briefly describe your services and experience..." required></textarea>
          </div>

          <div class="form-section media-section">
            <h4>📸 Service Portfolio (Optional)</h4>
            <p class="media-help">Add photos of your work to build trust with potential clients</p>
            
            <div class="upload-section">
              <label class="upload-label">
                <i class="fas fa-camera"></i>
                <span class="upload-title">Work Photos (Max 5)</span>
                <span class="upload-desc">JPG, PNG up to 2MB each</span>
                <input type="file" id="service-photos" multiple accept="image/*" onchange="KejaEnhancedAuth.handleServicePhotoUpload(event)">
              </label>
              <div id="service-photo-preview" class="media-preview"></div>
            </div>
          </div>
          ` : ''}
          
          <div class="form-group">
            <label>Phone Number *</label>
            <input type="tel" id="direct-phone" class="form-control" placeholder="+254..." required>
          </div>
          
          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" id="direct-email" class="form-control" placeholder="your@email.com" required>
          </div>
          
          <div class="form-group">
            <label>Password *</label>
            <input type="password" id="direct-password" class="form-control" placeholder="Min 6 characters" required>
          </div>

          <button type="submit" class="btn-primary" style="width: 100%;">
            <i class="fas fa-user-plus"></i> Create ${this.selectedUserType === 'service-provider' ? 'Service Provider' : 'Tenant'} Account
          </button>
        </form>

        <div class="step-navigation" style="margin-top: 16px;">
          <button class="btn-back" onclick="KejaEnhancedAuth.goToStep(1)">
            <i class="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Event handlers
   */
  bindEvents() {
    // Handle property role selection
    document.addEventListener('change', (e) => {
      if (e.target.name === 'property-role') {
        this.selectedPropertyRole = e.target.value;
        document.getElementById('step2-next').disabled = false;
        
        // Update visual selection
        document.querySelectorAll('.property-role-card').forEach(card => {
          card.classList.remove('selected');
        });
        e.target.closest('.property-role-card').classList.add('selected');
      }
    });
  },

  /**
   * Service photo upload handler
   */
  handleServicePhotoUpload(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('service-photo-preview');
    const maxFiles = 5;
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      event.target.value = '';
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';

    files.forEach((file, index) => {
      if (file.size > maxSize) {
        alert(`Photo ${file.name} is too large. Maximum 2MB per photo.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'media-item';
        photoItem.innerHTML = `
          <div class="media-thumbnail">
            <img src="${e.target.result}" alt="Service work ${index + 1}">
            <button type="button" class="remove-media" onclick="this.parentElement.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="media-info">
            <div class="media-name">${file.name}</div>
            <div class="media-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
            <div class="media-type">Work Sample</div>
          </div>
        `;
        preview.appendChild(photoItem);
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Step navigation
   */
  selectUserType(type) {
    this.selectedUserType = type;
    
    // Visual feedback
    document.querySelectorAll('.user-type-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    // Auto-proceed after selection
    setTimeout(() => {
      this.goToStep(2);
    }, 300);
  },

  selectPropertyRole(role) {
    this.selectedPropertyRole = role;
    document.querySelector(`#role-${role}`).checked = true;
    document.getElementById('step2-next').disabled = false;
    
    // Update visual selection
    document.querySelectorAll('.property-role-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-role="${role}"]`).classList.add('selected');
  },

  goToStep(step) {
    this.currentStep = step;
    const container = document.getElementById('enhanced-signup');
    if (container) {
      container.innerHTML = this.getSignupStepHTML(step);
      
      // Update summary if on step 4
      if (step === 4) {
        this.updateRegistrationSummary();
      }
    }
  },

  /**
   * Property management for caretakers
   */
  addProperty() {
    const propertiesList = document.getElementById('properties-list');
    const currentCount = propertiesList.children.length;
    
    const propertyGroup = document.createElement('div');
    propertyGroup.className = 'property-input-group';
    propertyGroup.setAttribute('data-property-index', currentCount);
    propertyGroup.innerHTML = this.getPropertyInputHTML(currentCount);
    
    propertiesList.appendChild(propertyGroup);
    
    // Show remove buttons if more than 1 property
    if (currentCount > 0) {
      document.querySelectorAll('.btn-remove-property').forEach(btn => {
        btn.style.display = 'inline-block';
      });
    }
  },

  removeProperty(index) {
    const propertyGroup = document.querySelector(`[data-property-index="${index}"]`);
    if (propertyGroup) {
      propertyGroup.remove();
      
      // Hide remove buttons if only 1 property left
      const remainingProperties = document.querySelectorAll('.property-input-group');
      if (remainingProperties.length === 1) {
        document.querySelectorAll('.btn-remove-property').forEach(btn => {
          btn.style.display = 'none';
        });
      }
      
      // Re-index remaining properties
      remainingProperties.forEach((group, idx) => {
        group.setAttribute('data-property-index', idx);
      });
    }
  },

  getPropertyInputHTML(index) {
    return `
      <div class="property-card">
        <div class="form-row">
          <div class="form-group" style="flex: 2;">
            <label>Property/Building Name *</label>
            <input type="text" class="form-control property-name" placeholder="e.g. Sunrise Apartments" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label>Total Units *</label>
            <input type="number" class="form-control property-units" placeholder="20" min="1" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group" style="flex: 2;">
            <label>Location *</label>
            <input type="text" class="form-control property-location" placeholder="e.g. Kilimani, Nairobi" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label>Available Units</label>
            <input type="number" class="form-control property-available" placeholder="5" min="0">
          </div>
        </div>

        <div class="form-group">
          <label>Property Owner Contact</label>
          <input type="text" class="form-control property-owner" placeholder="Owner's name and phone">
        </div>

        <button type="button" class="btn-remove-property" onclick="KejaEnhancedAuth.removeProperty(${index})">
          <i class="fas fa-trash"></i> Remove Property
        </button>
      </div>
    `;
  },

  /**
   * Update registration summary
   */
  updateRegistrationSummary() {
    const userTypeText = this.selectedUserType === 'property-account' ? 'Property Account (Landlord / Agent)' : 
                        this.selectedUserType === 'tenant' ? 'Tenant' : 
                        this.selectedUserType === 'service-provider' ? 'Service Provider' : 'User';
    
    document.getElementById('summary-user-type').textContent = userTypeText;
    
    if (this.selectedPropertyRole && this.selectedUserType === 'property-account') {
      document.getElementById('summary-role').textContent = 
        this.propertyRoles[this.selectedPropertyRole].title;
      document.getElementById('summary-role-item').style.display = 'block';
    } else {
      document.getElementById('summary-role-item').style.display = 'none';
    }

    // Get name from current form
    const nameField = document.querySelector('#caretaker-name, #direct-name');
    if (nameField && nameField.value) {
      document.getElementById('summary-name').textContent = nameField.value;
    }

    // Properties section not shown for registration
    document.getElementById('summary-properties-item').style.display = 'none';
  },

  /**
   * Form submissions
   */
  async submitRegistration(event) {
    event.preventDefault();
    
    try {
      // Collect all form data
      const registrationData = {
        userType: this.selectedUserType,
        role: this.selectedPropertyRole,
        name: document.getElementById('caretaker-name')?.value || '',
        position: document.getElementById('caretaker-position')?.value || '',
        phone: document.getElementById('final-phone').value,
        email: document.getElementById('final-email').value,
        password: document.getElementById('final-password').value
      };

      // Add caretaker-specific data (no properties during signup)
      if (this.selectedPropertyRole === 'caretaker') {
        registrationData.experience = document.getElementById('caretaker-experience')?.value || '';
        registrationData.operationArea = document.getElementById('caretaker-area')?.value || '';
        registrationData.notes = document.getElementById('caretaker-notes')?.value || '';
      }

      console.log('Enhanced Registration Data:', registrationData);
      
      // Submit to backend
      const response = await fetch('/api/auth/register-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        this.showSuccessMessage();
      } else {
        throw new Error('Registration failed');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  },

  async submitDirectRegistration(event) {
    event.preventDefault();
    
    try {
      const registrationData = {
        userType: this.selectedUserType,
        name: document.getElementById('direct-name').value,
        phone: document.getElementById('direct-phone').value,
        email: document.getElementById('direct-email').value,
        password: document.getElementById('direct-password').value
      };

      // Add service provider specific data
      if (this.selectedUserType === 'service') {
        registrationData.serviceType = document.getElementById('direct-service-type')?.value;
        registrationData.serviceDescription = document.getElementById('direct-service-desc')?.value;
        
        // Handle service photos
        const servicePhotos = document.getElementById('service-photos')?.files;
        if (servicePhotos && servicePhotos.length > 0) {
          registrationData.hasPhotos = true;
          registrationData.photoCount = servicePhotos.length;
          // In real implementation, photos would be uploaded as FormData
        }
      }

      console.log('Direct Registration Data:', registrationData);
      
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
      submitBtn.disabled = true;

      // Submit to enhanced registration endpoint
      const response = await fetch('/api/auth/register-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        this.showSuccessMessage(
          this.selectedUserType === 'service' ? 
          'Service provider account created! You can now start offering your services.' :
          'Account created successfully! Welcome to KejaMarket.'
        );
        
        setTimeout(() => {
          if (window.app && typeof window.app.closeModal === 'function') {
            window.app.closeModal('modal-auth');
          }
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
    } catch (error) {
      console.error('Direct registration error:', error);
      alert('Registration failed: ' + error.message);
      
      // Reset button
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-user-plus"></i> Create ${this.selectedUserType === 'service' ? 'Service Provider' : 'Account'}`;
        submitBtn.disabled = false;
      }
    }
  },

  /**
   * Show success message
   */
  showSuccessMessage() {
    const container = document.getElementById('enhanced-signup');
    const isPropertyAccount = this.selectedUserType === 'property-account';
    const isCaretaker = this.selectedPropertyRole === 'caretaker';
    const isServiceProvider = this.selectedUserType === 'service-provider';
    const isTenant = this.selectedUserType === 'tenant';
    
    let title, message, features;
    
    if (isPropertyAccount) {
      if (isCaretaker) {
        title = '🏢 Property Partner Account Created!';
        message = 'Welcome to KejaMarket! You now have access to your Property Partner Dashboard where you can add buildings and create unit listings.';
        features = [
          '🏢 Add buildings you manage',
          '📝 Create unit listings with photos & videos', 
          '📊 Track inquiries and manage availability',
          '💬 Communicate with property owners'
        ];
      } else {
        title = '🏠 Property Account Created!';
        message = 'Welcome to KejaMarket! Your property management account is ready. You can now list properties and connect with tenants.';
        features = [
          '🏠 List and manage properties',
          '📝 Create listings with photos & videos',
          '📊 Receive and track tenant inquiries', 
          '💰 Sell property-related items'
        ];
      }
    } else if (isServiceProvider) {
      title = '🔧 Service Provider Account Created!';
      message = 'Welcome to KejaMarket! Your service provider profile is ready. You can now list services and connect with clients.';
      features = [
        '🔧 List and manage services',
        '📝 Create service profile with portfolio',
        '📞 Receive service inquiries',
        '💼 Sell relevant products/items'
      ];
    } else {
      title = '👤 Tenant Account Created!';
      message = 'Welcome to KejaMarket! Your tenant account is ready. You can now search for properties and connect with landlords.';
      features = [
        '🔍 Search and filter properties',
        '❤️ Save favorite properties',
        '📱 Contact landlords directly',
        '🛒 Buy/sell used house items'
      ];
    }
    
    container.innerHTML = `
      <div class="success-message" style="text-align: center; padding: 40px 20px;">
        <div class="success-icon" style="margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
            <i class="fas fa-check-circle" style="color: #059669; font-size: 2.5rem;"></i>
          </div>
        </div>
        
        <h3 style="color: #059669; margin-bottom: 16px; font-size: 1.4rem; font-weight: 800;">
          ${title}
        </h3>
        
        <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">
          ${message}
        </p>
        
        <div class="next-steps" style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h4 style="color: #1e293b; margin-bottom: 12px;">
            Your Account Features:
          </h4>
          <ul style="text-align: left; color: #64748b; font-size: 0.9rem;">
            ${features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
        
        <button onclick="app.closeModal('modal-auth'); ${isPropertyAccount ? 'window.location.reload();' : ''}" class="btn-primary" style="width: 100%;">
          ${isPropertyAccount ? 'Go to Dashboard' : 'Start Exploring'}
        </button>
      </div>
    `;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load, then initialize
    setTimeout(() => KejaEnhancedAuth.init(), 500);
  });
} else {
  // DOM already loaded, initialize after a short delay
  setTimeout(() => KejaEnhancedAuth.init(), 500);
}

// Also initialize when the auth modal is shown
document.addEventListener('click', (e) => {
  if (e.target.matches('[onclick*="openAuthModal"]') || 
      e.target.matches('.auth-trigger') ||
      e.target.textContent.includes('Sign Up')) {
    // Reinitialize enhanced registration when auth modal opens
    setTimeout(() => KejaEnhancedAuth.init(), 100);
  }
});

// Export for global access
window.KejaEnhancedAuth = KejaEnhancedAuth;