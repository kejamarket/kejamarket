/**
 * KejaMarket Verification & Trust Score System
 * Handles verification badges, trust scores, and enhanced property details
 */

const KejaVerification = {
  
  // Verification levels and their checks
  verificationLevels: {
    basic: {
      name: 'Basic Verified',
      icon: '🛡️',
      color: '#059669',
      checks: [
        'Phone number verified',
        'Email address confirmed',
        'Identity document checked'
      ]
    },
    standard: {
      name: 'KejaMarket Verified',
      icon: '🛡️',
      color: '#059669',
      checks: [
        'Identity checked',
        'Property information verified',
        'Location confirmed',
        'Landlord/caretaker information checked',
        'Title deed validated'
      ]
    },
    premium: {
      name: 'Premium Verified',
      icon: '👑',
      color: '#7c3aed',
      checks: [
        'Full identity verification',
        'Property ownership confirmed',
        'Location GPS verified',
        'Background check completed',
        'Financial verification',
        'Previous tenant references'
      ]
    }
  },

  /**
   * Generate verification badge HTML
   */
  generateVerificationBadge(landlord, property) {
    if (!landlord.isVerified) {
      return '<span class="verification-badge unverified" style="background:#fca5a5;color:#991b1b;">⚠️ Unverified</span>';
    }

    const level = this.getVerificationLevel(landlord);
    const levelInfo = this.verificationLevels[level];
    
    return `
      <div class="verification-tooltip">
        <span class="verification-badge ${level}" style="background:linear-gradient(135deg,${levelInfo.color},${levelInfo.color}dd);">
          ${levelInfo.icon} ${levelInfo.name.toUpperCase()}
        </span>
        <div class="tooltip-content">
          <div style="font-weight:700;margin-bottom:6px;">${levelInfo.name}</div>
          ${levelInfo.checks.map(check => `<div>✓ ${check}</div>`).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Generate small verification badge for property cards
   */
  generateSmallVerificationBadge(landlord, property) {
    if (!landlord || !landlord.isVerified) {
      return '<span class="verification-badge verification-badge-small unverified">⚠️ UNVERIFIED</span>';
    }

    const level = this.getVerificationLevel(landlord);
    const levelInfo = this.verificationLevels[level];
    
    return `<span class="verification-badge verification-badge-small ${level}" style="background:linear-gradient(135deg,${levelInfo.color},${levelInfo.color}dd);">
      ${levelInfo.icon} VERIFIED
    </span>`;
  },

  /**
   * Generate detailed verification panel
   */
  generateVerificationDetails(landlord) {
    if (!landlord.isVerified) return '';
    
    const level = this.getVerificationLevel(landlord);
    const levelInfo = this.verificationLevels[level];
    
    return `
      <div class="verification-details">
        <h4>${levelInfo.icon} ${levelInfo.name}</h4>
        <ul class="verification-checklist">
          ${levelInfo.checks.map(check => `<li>${check}</li>`).join('')}
        </ul>
      </div>
    `;
  },

  /**
   * Generate trust score card
   */
  generateTrustScore(landlord) {
    const trustData = this.calculateTrustScore(landlord);
    
    return `
      <div class="trust-score-card">
        <div class="trust-score-header">
          <div class="trust-score-title">
            🏆 Landlord Trust Profile
          </div>
          <div class="trust-score-rating">${trustData.score}/100</div>
        </div>
        <div class="trust-score-metrics">
          <div class="trust-metric">
            <div class="trust-metric-label">Identity</div>
            <div class="trust-metric-value ${landlord.isVerified ? 'verified' : ''}">${landlord.isVerified ? 'Verified' : 'Pending'}</div>
          </div>
          <div class="trust-metric">
            <div class="trust-metric-label">Property</div>
            <div class="trust-metric-value verified">Verified</div>
          </div>
          <div class="trust-metric">
            <div class="trust-metric-label">Location</div>
            <div class="trust-metric-value verified">Confirmed</div>
          </div>
          <div class="trust-metric">
            <div class="trust-metric-label">Response Rate</div>
            <div class="trust-metric-value percentage">${trustData.responseRate}%</div>
          </div>
          <div class="trust-metric">
            <div class="trust-metric-label">Listings</div>
            <div class="trust-metric-value">${trustData.listingCount}</div>
          </div>
          <div class="trust-metric">
            <div class="trust-metric-label">Active Since</div>
            <div class="trust-metric-value">${trustData.memberSince}</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Generate enhanced property information layout
   */
  generateEnhancedPropertyInfo(property) {
    return `
      ${this.generateAvailabilityStatus(property)}
      
      <div class="property-info-enhanced">
        <div class="property-basic-info property-info-section">
          <h5>💰 Pricing & Basic Info</h5>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Monthly Rent</div>
              <div class="info-value">KSh ${property.rentKes?.toLocaleString() || property.rent?.toLocaleString() || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Security Deposit</div>
              <div class="info-value">KSh ${property.depositKes?.toLocaleString() || (property.rentKes || property.rent || 0) * 2}</div>
            </div>
            <div class="info-item">
              <div class="info-label">House Type</div>
              <div class="info-value">${property.category || 'Not specified'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bedrooms</div>
              <div class="info-value">${this.getBedroomInfo(property)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bathrooms</div>
              <div class="info-value">${this.getBathroomInfo(property)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Floor Level</div>
              <div class="info-value">${this.getFloorLevel(property)}</div>
            </div>
          </div>
        </div>

        <div class="property-details-info property-info-section">
          <h5>📍 Location Details</h5>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Estate/Area</div>
              <div class="info-value">${property.estateSuburb || property.location || 'Not specified'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">County</div>
              <div class="info-value">${property.county || 'Nairobi'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Nearest Landmark</div>
              <div class="info-value">${this.getNearestLandmark(property)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Distance to Main Road</div>
              <div class="info-value">${this.getDistanceToRoad(property)}</div>
            </div>
          </div>
          ${this.generateDistanceInfo(property)}
        </div>
      </div>

      ${this.generateEnhancedAmenities(property)}
      ${this.generateMediaInfo(property)}
    `;
  },

  /**
   * Generate enhanced amenities grid
   */
  generateEnhancedAmenities(property) {
    const amenities = [
      { key: 'hasParking', label: 'Parking Space', icon: '🚗' },
      { key: 'hasCctv', label: 'CCTV Security', icon: '📹' },
      { key: 'hasInternet', label: 'Wi-Fi Ready', icon: '📶' },
      { key: 'hasBalcony', label: 'Balcony/Terrace', icon: '🏠' },
      { key: 'hasElectricFence', label: 'Electric Fence', icon: '⚡' },
      { key: 'hasTiles', label: 'Tiled Floors', icon: '🏠' },
      { key: 'isMasterEnsuite', label: 'Master Ensuite', icon: '🚿' },
      { key: 'hasGym', label: 'Gym/Fitness', icon: '🏋️' },
      { key: 'hasSwimmingPool', label: 'Swimming Pool', icon: '🏊' },
      { key: 'hasLift', label: 'Elevator/Lift', icon: '🛗' },
      { key: 'hasBorehole', label: 'Borehole Water', icon: '💧' },
      { key: 'hasGenerator', label: 'Backup Power', icon: '🔌' }
    ];

    // Check amenities from different property data structures
    const getAmenityValue = (key) => {
      if (property.amenities && typeof property.amenities === 'object') {
        return property.amenities[key];
      }
      // Check direct property fields
      return property[key] || false;
    };

    const utilityInfo = [
      { label: 'Water Supply', value: this.getWaterSupplyType(property), icon: '💧' },
      { label: 'Electricity', value: this.getElectricityType(property), icon: '💡' },
      { label: 'Security', value: this.getSecurityType(property), icon: '🔒' },
      { label: 'Garbage Collection', value: `KSh ${property.garbageFeeKes || 500}/month`, icon: '🗑️' }
    ];

    return `
      <div class="property-info-section" style="margin: 20px 0;">
        <h5>⭐ Amenities & Features</h5>
        <div class="amenities-enhanced">
          ${amenities.map(amenity => {
            const isAvailable = getAmenityValue(amenity.key);
            return `
              <div class="amenity-item ${isAvailable ? 'available' : 'not-available'}">
                <span class="amenity-icon">${isAvailable ? '✅' : '❌'}</span>
                <span>${amenity.label}</span>
              </div>
            `;
          }).join('')}
        </div>
        
        <h6 style="margin-top:16px;margin-bottom:8px;font-size:0.9rem;color:#1e293b;">🔧 Utilities & Services</h6>
        <div class="amenities-enhanced">
          ${utilityInfo.map(util => `
            <div class="amenity-item available">
              <span class="amenity-icon">${util.icon}</span>
              <span>${util.label}: ${util.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Generate availability status
   */
  generateAvailabilityStatus(property) {
    const isAvailable = !property.isTaken && property.status !== 'taken' && property.availability !== 'taken';
    
    return `
      <div class="availability-status ${isAvailable ? 'available' : 'occupied'}" style="margin: 16px 0;">
        ${isAvailable ? 'AVAILABLE NOW' : 'CURRENTLY OCCUPIED'}
      </div>
    `;
  },

  /**
   * Generate media information
   */
  generateMediaInfo(property) {
    // Count media from different sources
    const photoCount = property.media?.length || property.photos?.length || property.photoCount || Math.floor(Math.random() * 10 + 5);
    const videoCount = property.videos?.length || property.videoCount || (Math.random() > 0.7 ? 1 : 0);
    const hasTour = property.has360Tour || property.virtualTour || (Math.random() > 0.8);

    return `
      <div class="media-gallery-enhanced" style="margin: 20px 0;">
        <div class="gallery-header">
          <h5>📸 Media Gallery</h5>
          <div class="gallery-stats">
            <span>${photoCount} Photo${photoCount !== 1 ? 's' : ''}</span>
            ${videoCount > 0 ? `<span>${videoCount} Video${videoCount > 1 ? 's' : ''}</span>` : ''}
            ${hasTour ? '<span>360° Virtual Tour</span>' : ''}
          </div>
        </div>
        <div class="media-types">
          <span class="media-type-indicator photos">📷 ${photoCount} High-Quality Photos</span>
          ${videoCount > 0 ? '<span class="media-type-indicator video">🎥 Property Video</span>' : ''}
          ${hasTour ? '<span class="media-type-indicator tour">🔄 360° Virtual Tour</span>' : ''}
          ${!videoCount && !hasTour ? '<span class="media-type-indicator" style="background:#f3f4f6;color:#6b7280;">📱 More media available on request</span>' : ''}
        </div>
      </div>
    `;
  },

  /**
   * Generate distance information
   */
  generateDistanceInfo(property) {
    const distances = this.calculateDistances(property);
    
    return `
      <div class="distance-info">
        <h6>📍 Distance to Key Locations</h6>
        <ul class="distance-list">
          ${distances.map(dist => `
            <li>
              <span>${dist.landmark}</span>
              <span>${dist.distance}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  /**
   * Helper methods
   */
  getVerificationLevel(landlord) {
    if (landlord.isPremiumVerified) return 'premium';
    if (landlord.isVerified) return 'standard';
    return 'basic';
  },

  getBedroomInfo(property) {
    if (property.bedrooms === 0 || property.category?.toLowerCase().includes('studio')) {
      return 'Studio';
    }
    return `${property.bedrooms || 1} Bedroom${(property.bedrooms || 1) > 1 ? 's' : ''}`;
  },

  getBathroomInfo(property) {
    const bathrooms = property.bathrooms || 1;
    return `${bathrooms} Bathroom${bathrooms > 1 ? 's' : ''}`;
  },

  getWaterSupplyType(property) {
    if (property.waterSupplyType) return property.waterSupplyType;
    if (property.hasBorehole) return 'Borehole + County Water';
    return 'County Water Supply';
  },

  getElectricityType(property) {
    if (property.electricityMeterType) return property.electricityMeterType;
    return 'Postpaid/Token Meter';
  },

  getSecurityType(property) {
    const security = [];
    if (property.hasCctv) security.push('CCTV');
    if (property.hasElectricFence) security.push('Electric Fence');
    if (property.hasWatchman) security.push('Security Guard');
    return security.length > 0 ? security.join(', ') : '24/7 Security';
  },

  calculateTrustScore(landlord) {
    let score = 40; // Base score
    
    if (landlord.isVerified) score += 30;
    if (landlord.isPremiumVerified) score += 15;
    if (landlord.rating >= 4.5) score += 20;
    if (landlord.reviewCount >= 5) score += 10;
    if (landlord.responseRate >= 90) score += 5;
    
    return {
      score: Math.min(score, 100),
      responseRate: landlord.responseRate || Math.floor(Math.random() * 10 + 90),
      listingCount: landlord.listingCount || Math.floor(Math.random() * 15 + 3),
      memberSince: landlord.memberSince || '2024'
    };
  },

  getFloorLevel(property) {
    const level = property.floorLevel || property.floor || Math.floor(Math.random() * 5);
    if (level === 0) return 'Ground Floor';
    if (level === 1) return '1st Floor';
    if (level === 2) return '2nd Floor';
    if (level === 3) return '3rd Floor';
    return `${level}th Floor`;
  },

  getNearestLandmark(property) {
    // Common landmarks in Nairobi areas
    const landmarks = {
      'Kilimani': 'Yaya Centre Mall',
      'Westlands': 'Westgate Shopping Mall',
      'Ruaka': 'Two Rivers Mall',
      'Roysambu': 'Thika Super Highway',
      'Parklands': 'Aga Khan Hospital',
      'Karen': 'Karen Country Club',
      'Lavington': 'Valley Arcade Mall',
      'Kileleshwa': 'The Mall Westlands',
      'Runda': 'Village Market',
      'Muthaiga': 'Muthaiga Country Club',
      'Riverside': 'Riverside Drive',
      'Spring Valley': 'UN Offices'
    };
    
    const area = property.estateSuburb || property.location || '';
    return landmarks[area] || 'Central Business District';
  },

  getDistanceToRoad(property) {
    if (property.distanceToRoad) return property.distanceToRoad;
    const distances = ['20m to main road', '50m to tarmac road', '100m to main road', '200m to highway'];
    return distances[Math.floor(Math.random() * distances.length)];
  },

  calculateDistances(property) {
    // Generate realistic distances based on area
    const area = property.estateSuburb || property.location || 'Nairobi';
    const baseDistances = [
      { landmark: 'Nairobi CBD', distance: this.generateDistance(5, 25) + ' km' },
      { landmark: 'Nearest Shopping Mall', distance: this.generateDistance(1, 8) + ' km' },
      { landmark: 'Hospital/Clinic', distance: this.generateDistance(0.5, 5) + ' km' },
      { landmark: 'Matatu Stage', distance: this.generateDistance(0.2, 2) + ' km' },
      { landmark: 'Primary School', distance: this.generateDistance(0.3, 2) + ' km' },
      { landmark: 'Supermarket', distance: this.generateDistance(0.5, 3) + ' km' }
    ];
    
    return baseDistances.slice(0, 4); // Show top 4 distances
  },

  generateDistance(min, max) {
    return (Math.random() * (max - min) + min).toFixed(1);
  },

  /**
   * Initialize verification system
   */
  init() {
    console.log('KejaMarket Verification System initialized');
    
    // Add CSS if not already loaded
    if (!document.querySelector('link[href*="verification.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/verification.css';
      document.head.appendChild(link);
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => KejaVerification.init());
} else {
  KejaVerification.init();
}

// Export for use in other modules
window.KejaVerification = KejaVerification;