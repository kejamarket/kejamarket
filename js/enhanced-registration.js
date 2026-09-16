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

  // Property management role definitions
  propertyRoles: {
    'landlord': {
      title: 'Landlord / Property Owner',
      icon: '🏠',
      description: 'I own rental properties and manage them directly'
    },
    'caretaker': {
      title: 'Caretaker / Property Manager', 
      icon: '🏢',
      description: 'I manage properties on behalf of the owners'
    },
    'agent': {
      title: 'Real Estate Agent',
      icon: '🤝', 
      description: 'I help clients find and rent properties'
    },
    'company': {
      title: 'Property Management Company',
      icon: '🏢',
      description: 'We manage multiple properties for various owners'
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
            I am a:
          </p>
        </div>

        <div class="user-type-selection">
          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('property-manager')" data-type="property-manager">
            <div class="user-type-icon">🏠</div>
            <div class="user-type-content">
              <div class="user-type-title">Property Owner / Agent</div>
              <div class="user-type-desc">List and manage rental properties, connect with tenants and manage available units.</div>
            </div>
          </div>

          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('tenant')" data-type="tenant">
            <div class="user-type-icon">👤</div>
            <div class="user-type-content">
              <div class="user-type-title">Tenant</div>
              <div class="user-type-desc">Find a home and connect with property owners.</div>
            </div>
          </div>

          <div class="user-type-card" onclick="KejaEnhancedAuth.selectUserType('service')" data-type="service">
            <div class="user-type-icon">🔧</div>
            <div class="user-type-content">
              <div class="user-type-title">Service Provider</div>
              <div class="user-type-desc">Provide property-related services like plumbing, electrical, cleaning, moving, etc.</div>
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
    if (this.selectedUserType !== 'property-manager') {
      return this.getDirectRegistrationHTML();
    }

    return `
      <div class="signup-step" data-step="2">
        <div class="step-header">
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
            Tell us about yourself
          </h3>
          <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
            I am a:
          </p>
        </div>

        <div class="property-role-selection">
          ${Object.entries(this.propertyRoles).map(([key, role]) => `
            <div class="property-role-card" onclick="KejaEnhancedAuth.selectPropertyRole('${key}')" data-role="${key}">
              <div class="role-option">
                <div class="role-radio">
                  <input type="radio" name="property-role" value="${key}" id="role-${key}">
                  <span class="role-icon">${role.icon}</span>
                </div>
                <div class="role-info">
                  <div class="role-title">${role.title}</div>
                  <div class="role-desc">${role.description}</div>
                </div>
              </div>
            </div>
          `).join('')}
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
   * Caretaker-specific form
   */
  getCaretakerForm() {
    return `
      <div class="step-header">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; text-align: center;">
          Property Management Details
        </h3>
        <p style="color: #64748b; text-align: center; margin-bottom: 24px; font-size: 0.9rem;">
          Tell us about the properties you manage
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

        <div class="properties-section">
          <h4 style="color: #1e293b; margin: 20px 0 12px 0; font-size: 1rem;">Properties I Manage</h4>
          
          <div id="properties-list">
            <div class="property-input-group" data-property-index="0">
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

                <button type="button" class="btn-remove-property" onclick="KejaEnhancedAuth.removeProperty(0)" style="display: none;">
                  <i class="fas fa-trash"></i> Remove Property
                </button>
              </div>
            </div>
          </div>

          <button type="button" onclick="KejaEnhancedAuth.addProperty()" class="btn-add-property">
            <i class="fas fa-plus"></i> Add Another Property
          </button>
        </div>

        <div class="form-group" style="margin-top: 24px;">
          <label>ID/Verification Information *</label>
          <textarea id="caretaker-verification" class="form-control" rows="3" placeholder="National ID number, years of experience, references..." required></textarea>
        </div>
      </form>
    `;
  },

  /**
   * Get direct registration for non-property-manager roles
   */
  getDirectRegistrationHTML() {
    const userTypeData = {
      'tenant': { 
        title: 'Tenant Registration', 
        desc: 'Complete your tenant profile to find your ideal home',
        icon: '👤'
      },
      'service': { 
        title: 'Service Provider Registration', 
        desc: 'Set up your service business profile and start connecting with property owners',
        icon: '🔧'
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

        <form id="direct-registration-form" onsubmit="KejaEnhancedAuth.submitDirectRegistration(event)">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="direct-name" class="form-control" placeholder="e.g. John Mwangi" required>
          </div>
          
          ${this.selectedUserType === 'service' ? `
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
                <span class="upload-desc">Show examples of your completed work</span>
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
            <i class="fas fa-user-plus"></i> Create ${this.selectedUserType === 'service' ? 'Service Provider' : 'Account'}
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
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      event.target.value = '';
      return;
    }

    // Clear previous preview
    preview.innerHTML = '';

    files.forEach((file, index) => {
      if (file.size > maxSize) {
        alert(`Photo ${file.name} is too large. Maximum 5MB per photo.`);
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
    document.getElementById('summary-user-type').textContent = 
      this.selectedUserType === 'property-manager' ? 'Property Owner / Agent' : 
      this.selectedUserType === 'tenant' ? 'Tenant' : 'Service Provider';
    
    if (this.selectedPropertyRole) {
      document.getElementById('summary-role').textContent = 
        this.propertyRoles[this.selectedPropertyRole].title;
      document.getElementById('summary-role-item').style.display = 'block';
    }

    // Get name from current form
    const nameField = document.querySelector('#caretaker-name, #direct-name');
    if (nameField && nameField.value) {
      document.getElementById('summary-name').textContent = nameField.value;
    }

    // Show properties for caretakers
    if (this.selectedPropertyRole === 'caretaker') {
      const properties = this.getCaretakerProperties();
      if (properties.length > 0) {
        document.getElementById('summary-properties').textContent = `${properties.length} properties`;
        document.getElementById('summary-properties-item').style.display = 'block';
      }
    }
  },

  /**
   * Get caretaker properties data
   */
  getCaretakerProperties() {
    const properties = [];
    document.querySelectorAll('.property-input-group').forEach(group => {
      const name = group.querySelector('.property-name').value;
      const location = group.querySelector('.property-location').value;
      const units = group.querySelector('.property-units').value;
      const available = group.querySelector('.property-available').value;
      const owner = group.querySelector('.property-owner').value;

      if (name && location && units) {
        properties.push({
          name, location, units: parseInt(units), 
          available: parseInt(available) || 0, owner
        });
      }
    });
    return properties;
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
        password: document.getElementById('final-password').value,
        verification: document.getElementById('caretaker-verification')?.value || '',
        properties: this.selectedPropertyRole === 'caretaker' ? this.getCaretakerProperties() : []
      };

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
    container.innerHTML = `
      <div class="success-message" style="text-align: center; padding: 40px 20px;">
        <div class="success-icon" style="margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
            <i class="fas fa-check-circle" style="color: #059669; font-size: 2.5rem;"></i>
          </div>
        </div>
        
        <h3 style="color: #059669; margin-bottom: 16px; font-size: 1.4rem; font-weight: 800;">
          🛡️ Verification Submitted!
        </h3>
        
        <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">
          Your registration has been submitted for verification. You'll receive a confirmation SMS and email within 24 hours.
        </p>
        
        <div class="next-steps" style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h4 style="color: #1e293b; margin-bottom: 12px;">What happens next?</h4>
          <ul style="text-align: left; color: #64748b; font-size: 0.9rem;">
            <li>✅ Identity verification (24 hours)</li>
            <li>📱 SMS confirmation</li>
            <li>🛡️ Verified Property Partner status</li>
            <li>📊 Access to your dashboard</li>
          </ul>
        </div>
        
        <button onclick="app.closeModal('modal-auth')" class="btn-primary" style="width: 100%;">
          Done
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