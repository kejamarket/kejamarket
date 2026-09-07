/**
 * KejaMarket - Community Reviews & Transparency Module
 * Tracks ratings for: Water Consistency, Security, Deposit Refund Transparency
 * Connected to live backend database API.
 */

class ReviewManager {
  constructor() {
    this.reviews = typeof SEED_REVIEWS !== 'undefined' ? { ...SEED_REVIEWS } : {};
    this.initStorage();
  }

  initStorage() {
    const saved = localStorage.getItem('nairobi_rentals_reviews');
    if (saved) {
      try {
        this.reviews = { ...this.reviews, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed parsing reviews storage', e);
      }
    }
  }

  saveStorage() {
    localStorage.setItem('nairobi_rentals_reviews', JSON.stringify(this.reviews));
  }

  getReviewsForProperty(propertyId) {
    return this.reviews[propertyId] || [];
  }

  async addReview(propertyId, reviewData) {
    if (!this.reviews[propertyId]) {
      this.reviews[propertyId] = [];
    }

    const newReview = {
      id: 'rev-' + Date.now(),
      author: reviewData.author || 'Verified Tenant',
      ratingOverall: parseFloat(reviewData.ratingOverall) || 5.0,
      ratingWater: parseFloat(reviewData.ratingWater) || 5.0,
      ratingSecurity: parseFloat(reviewData.ratingSecurity) || 5.0,
      ratingDeposit: parseFloat(reviewData.ratingDeposit) || 5.0,
      date: new Date().toISOString().split('T')[0],
      text: reviewData.text,
      verified: true
    };

    this.reviews[propertyId].unshift(newReview);
    this.saveStorage();

    // Sync to backend
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.kejaAuth && window.kejaAuth.getToken()) {
        headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
      }
      await fetch(`/api/properties/${encodeURIComponent(propertyId)}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData)
      });
    } catch (err) {
      console.warn('Review offline sync:', err);
    }

    return newReview;
  }

  renderReviewsList(propertyId, containerEl) {
    const reviews = this.getReviewsForProperty(propertyId);
    if (!reviews || reviews.length === 0) {
      containerEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.88rem;">
          <i class="fas fa-comment-dots" style="font-size: 1.5rem; margin-bottom: 6px; display: block; color: #94a3b8;"></i>
          No community reviews yet. Be the first tenant to leave feedback on water, security & deposit transparency!
        </div>
      `;
      return;
    }

    containerEl.innerHTML = reviews.map(r => `
      <div style="border-bottom: 1px solid #e2e8f0; padding: 12px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 6px;">
            ${r.author}
            ${r.verified ? '<span style="background: #e6f8ec; color: #00b53f; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;"><i class="fas fa-check-circle"></i> Verified Resident</span>' : ''}
          </div>
          <div style="font-size: 0.78rem; color: #94a3b8;">${r.date}</div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; font-size: 0.75rem;">
          <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
            💧 Water: ${r.ratingWater}★
          </span>
          <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px;">
            🛡️ Security: ${r.ratingSecurity}★
          </span>
          <span style="background: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 4px;">
            💰 Deposit: ${r.ratingDeposit}★
          </span>
        </div>

        <p style="font-size: 0.85rem; color: #334155; line-height: 1.4;">
          ${r.text}
        </p>
      </div>
    `).join('');
  }
}

window.reviewManager = new ReviewManager();
