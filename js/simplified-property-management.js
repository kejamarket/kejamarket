/**
 * KejaMarket Simplified Property Management
 * - Simplified BNB workflow (no complex calendars)
 * - Building-level management (no units)
 * - Simple Available/Occupied toggle for rentals
 */

const KejaSimplifiedManagement = {
  
  /**
   * BNB Management - Always Visible Listings with Host-Confirmed Availability
   */
  BNBManager: {
    
    /**
     * Create simplified BNB listing interface
     */
    renderBNBDashboard() {
      return `
        <div class="simplified-bnb-section">
          <h3>
            <i class="fas fa-bed"></i>
            My BNB Listings
            <span class="help-text">Always visible - guests contact you for availability</span>
          </h3>
          
          <div class="workflow-explanation">
            <div class="workflow-card">
              <h4>🏨 Simple BNB Management</h4>
              <div class="workflow-steps">
                <div class="step">1️⃣ Your BNB stays visible on KejaMarket</div>
                <div class="step">2️⃣ Guests send inquiries with their dates</div>
                <div class="step">3️⃣ You confirm availability directly</div>
                <div class="step">4️⃣ You arrange booking outside KejaMarket</div>
              </div>
            </div>
          </div>
          
          <div class="bnb-listings">
            ${this.renderBNBListings()}
          </div>
        </div>
      `;
    },
    
    /**
     * Render individual BNB listings
     */
    renderBNBListings() {
      const sampleBNBs = [
        {
          id: 'bnb_001',
          name: 'Sunset BNB',
          type: '1 Bedroom',
          rate: 3500,
          location: 'Westlands, Nairobi',
          status: 'active',
          inquiries: 12
        }
      ];
      
      return sampleBNBs.map(bnb => `
        <div class="bnb-card">
          <div class="bnb-info">
            <div class="bnb-title">${bnb.name}</div>
            <div class="bnb-subtitle">${bnb.type} • KSh ${bnb.rate.toLocaleString()}/night</div>
            <div class="bnb-location">📍 ${bnb.location}</div>
          </div>
          
          <div class="bnb-status">
            <span class="status-badge ${bnb.status}">
              ${bnb.status === 'active' ? '🟢 Active & Visible' : '⏸️ Paused'}
            </span>
          </div>
          
          <div class="bnb-metrics">
            <div class="metric">📩 ${bnb.inquiries} inquiries</div>
          </div>
          
          <div class="bnb-actions">
            <button class="btn-secondary" onclick="KejaSimplified.viewInquiries('${bnb.id}')">
              View Inquiries
            </button>
            <button class="btn-primary" onclick="KejaSimplified.toggleBNBStatus('${bnb.id}')">
              ${bnb.status === 'active' ? 'Pause Listing' : 'Activate Listing'}
            </button>
          </div>
          
          <div class="availability-note">
            <i class="fas fa-info-circle"></i>
            Availability is confirmed directly by you when guests inquire
          </div>
        </div>
      `).join('');
    }
  },
  
  /**
   * Long-term Rental Management - Simple Available/Occupied Toggle
   */
  RentalManager: {
    
    /**
     * Create simplified rental management interface
     */
    renderRentalDashboard() {
      return `
        <div class="simplified-rental-section">
          <h3>
            <i class="fas fa-home"></i>
            My Rental Properties
            <span class="help-text">Building-level management - simple Available/Occupied toggle</span>
          </h3>
          
          <div class="workflow-explanation">
            <div class="workflow-card">
              <h4>🏠 Simple Rental Management</h4>
              <div class="workflow-steps">
                <div class="step">🟢 <strong>Available:</strong> Visible in search, accepting inquiries</div>
                <div class="step">🔴 <strong>Occupied:</strong> Hidden from search, saved in your account</div>
                <div class="step">↻ <strong>Toggle:</strong> One-click to switch between Available/Occupied</div>
                <div class="step">💾 <strong>Permanent:</strong> Photos and details always saved</div>
              </div>
            </div>
          </div>
          
          <div class="rental-properties">
            ${this.renderRentalProperties()}
          </div>
        </div>
      `;
    },
    
    /**
     * Render rental properties with simple toggle
     */
    renderRentalProperties() {
      const sampleRentals = [
        {
          id: 'rental_001',
          name: 'Greenview Apartments',
          type: '2 Bedroom',
          rent: 25000,
          location: 'Kiambu Road',
          status: 'available',
          dateOccupied: null
        },
        {
          id: 'rental_002',
          name: 'City Center Apartment',
          type: '1 Bedroom', 
          rent: 35000,
          location: 'CBD, Nairobi',
          status: 'occupied',
          dateOccupied: '2024-08-15'
        }
      ];
      
      return sampleRentals.map(rental => `
        <div class="rental-card">
          <div class="rental-info">
            <div class="rental-title">${rental.name}</div>
            <div class="rental-subtitle">${rental.type} • KSh ${rental.rent.toLocaleString()}/month</div>
            <div class="rental-location">📍 ${rental.location}</div>
          </div>
          
          <div class="rental-status">
            <span class="status-badge ${rental.status}">
              ${rental.status === 'available' ? '🟢 Available' : '🔴 Occupied'}
            </span>
            ${rental.dateOccupied ? `<div class="status-date">Since ${rental.dateOccupied}</div>` : ''}
          </div>
          
          <div class="rental-actions">
            <button class="btn-secondary" onclick="KejaSimplified.editRental('${rental.id}')">
              Edit Details
            </button>
            <button class="btn-primary toggle-btn" onclick="KejaSimplified.toggleRentalStatus('${rental.id}')">
              ${rental.status === 'available' ? 'Mark as Taken' : 'Make Available'}
            </button>
          </div>
          
          <div class="permanent-note">
            <i class="fas fa-save"></i>
            Photos and details permanently saved in your account
          </div>
        </div>
      `).join('');
    }
  },
  
  /**
   * Guest Inquiry System for BNBs
   */
  GuestInquirySystem: {
    
    /**
     * Show guest inquiry form (for BNB listings)
     */
    showInquiryForm(bnbId, bnbName) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content inquiry-modal">
          <div class="modal-header">
            <h3>Check Availability</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="inquiry-info">
            <h4>${bnbName}</h4>
            <p class="availability-notice">
              <i class="fas fa-info-circle"></i>
              Availability is confirmed directly by the host. Send an inquiry to check your preferred dates.
            </p>
          </div>
          
          <form class="inquiry-form" onsubmit="KejaSimplified.submitInquiry(event, '${bnbId}')">
            <div class="form-row">
              <div class="form-group">
                <label>Check-in Date</label>
                <input type="date" name="checkin" required>
              </div>
              <div class="form-group">
                <label>Check-out Date</label>
                <input type="date" name="checkout" required>
              </div>
            </div>
            
            <div class="form-group">
              <label>Number of Guests</label>
              <select name="guests" required>
                <option value="">Select guests</option>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5+">5+ Guests</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Message to Host</label>
              <textarea name="message" placeholder="Hello, I would like to stay at ${bnbName}..." rows="4"></textarea>
            </div>
            
            <div class="form-group">
              <label>Your Contact Information</label>
              <input type="text" name="contact" placeholder="Phone number or email" required>
            </div>
            
            <button type="submit" class="btn-primary">
              <i class="fas fa-paper-plane"></i>
              Send Inquiry to Host
            </button>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
    },
    
    /**
     * Submit guest inquiry
     */
    submitInquiry(event, bnbId) {
      event.preventDefault();
      const formData = new FormData(event.target);
      
      const inquiry = {
        bnbId,
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        guests: formData.get('guests'),
        message: formData.get('message'),
        contact: formData.get('contact'),
        timestamp: new Date().toISOString()
      };
      
      console.log('Guest inquiry submitted:', inquiry);
      
      // Show success message
      alert(`✅ Inquiry Sent!\n\nYour availability request has been sent to the host.\n\nThe host will respond directly with:\n• Available - booking details\n• Sorry, those dates are taken\n\nExpected response time: Within 24 hours`);
      
      // Close modal
      event.target.closest('.modal-overlay').remove();
    }
  },

  /**
   * Action handlers
   */
  toggleBNBStatus(bnbId) {
    console.log('Toggling BNB status for:', bnbId);
    
    const confirmed = confirm(
      `BNB Status Toggle:\n\n` +
      `🟢 Active → ⏸️ Paused (Hidden from search, no new inquiries)\n` +
      `⏸️ Paused → 🟢 Active (Visible to guests, accepting inquiries)\n\n` +
      `No calendar management needed! Continue?`
    );
    
    if (confirmed) {
      alert('✅ BNB status updated! Your listing details are permanently saved.');
    }
  },
  
  toggleRentalStatus(rentalId) {
    console.log('Toggling rental status for:', rentalId);
    
    // Show simple confirmation dialog
    const confirmed = confirm(
      `Toggle Property Status:\n\n` +
      `🟢 Available → 🔴 Occupied (Hide from search)\n` +
      `🔴 Occupied → 🟢 Available (Show in search)\n\n` +
      `Photos and details remain saved. Continue?`
    );
    
    if (confirmed) {
      alert('✅ Status updated! Your property photos and details are permanently saved.');
    }
  },
  
  viewInquiries(id) {
    console.log('Viewing inquiries for:', id);
    alert(`Guest Inquiry Example:\n\n` +
          `From: Sarah K.\n` +
          `Property: Sunset BNB\n` +
          `Check-in: 20 September\n` +
          `Check-out: 22 September\n` +
          `Guests: 2\n\n` +
          `Your response options:\n` +
          `✅ Available - provide booking details\n` +
          `❌ Sorry, those dates are taken`);
  },
  
  editRental(rentalId) {
    console.log('Editing rental:', rentalId);
    alert('Edit Property Details:\n\n• Update photos\n• Change rent amount\n• Modify description\n• Update amenities\n\nProperty stays in your account permanently!');
  }
};

// Make available globally
window.KejaSimplified = KejaSimplifiedManagement;

console.log('✅ Simplified Property Management loaded');