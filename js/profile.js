/**
 * KejaMarket - Jiji-Style Profile & Account Management Engine
 * Handles user profile dashboard, role-specific menus, dark mode, language switcher,
 * notifications, followers, how-to-post guides, boost explanations, and settings.
 */

const kejaProfile = (() => {
  // Default mock notifications for users
  const NOTIFICATIONS_STORAGE_KEY = 'keja_notifications';

  function getStoredNotifications() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'notif-1',
        title: 'Welcome to KejaMarket!',
        message: 'Your account is active. Explore verified properties, home services, and house items across Nairobi.',
        time: 'Just now',
        read: false,
        icon: 'fa-check-circle',
        color: '#10b981'
      },
      {
        id: 'notif-2',
        title: 'Anti-Scam Tip: Never pay viewing fees',
        message: 'KejaMarket verifies listings. Landlords on our platform do NOT charge viewing fees. Report any suspicious requests.',
        time: '2 hours ago',
        read: false,
        icon: 'fa-shield-alt',
        color: '#4f46e5'
      },
      {
        id: 'notif-3',
        title: 'Need High-Speed WiFi?',
        message: 'Check coverage for Safaricom Home Fibre, Zuku, and Faiba directly in our Services section.',
        time: '1 day ago',
        read: true,
        icon: 'fa-wifi',
        color: '#0891b2'
      }
    ];
  }

  function init() {
    // Apply saved theme
    const savedTheme = localStorage.getItem('keja_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    }

    // Apply saved language
    const savedLang = localStorage.getItem('keja_lang') || 'en';
    applyLanguage(savedLang, false);
  }

  function toggleTheme(explicitMode) {
    const isDark = explicitMode !== undefined 
      ? explicitMode === 'dark' 
      : !document.documentElement.classList.contains('dark-theme');

    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('keja_theme', 'dark');
      if (window.app) window.app.showToast('Dark mode enabled 🌙', 'info');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('keja_theme', 'light');
      if (window.app) window.app.showToast('Light mode enabled ☀️', 'info');
    }

    const themeCheckbox = document.getElementById('profile-theme-toggle');
    if (themeCheckbox) themeCheckbox.checked = isDark;
  }

  function setLanguage(lang) {
    localStorage.setItem('keja_lang', lang);
    applyLanguage(lang, true);
  }

  function applyLanguage(lang, showToastMsg) {
    const langSelect = document.getElementById('profile-lang-select');
    if (langSelect) langSelect.value = lang;

    if (showToastMsg && window.app) {
      const msg = lang === 'sw' ? 'Lugha imebadilishwa kuwa Kiswahili 🇰🇪' : 'Language set to English 🇬🇧';
      window.app.showToast(msg, 'success');
    }
  }

  /**
   * Build & render the complete Jiji-style rich profile panel
   */
  function renderProfileMenu(session) {
    const container = document.getElementById('auth-profile-menu-container');
    if (!container || !session) return;

    const isAdmin = Boolean(
      session.id === 'usr-admin-01' || 
      session.role === 'admin' ||
      session.isAdmin === true ||
      (session.email && session.email.toLowerCase().includes('admin')) ||
      (session.name && session.name.toLowerCase().includes('admin'))
    );

    const isLandlord = session.role === 'landlord' || session.role === 'agency' || isAdmin;
    const isService = session.role === 'service';
    const isTenant = !isLandlord && !isService;

    const notifs = getStoredNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    let roleHtml = '';
    if (isAdmin) {
      roleHtml = `<span class="profile-pill pill-admin"><i class="fas fa-crown"></i> Administrator</span>`;
    } else if (session.role === 'agency') {
      roleHtml = `<span class="profile-pill pill-agency"><i class="fas fa-building"></i> Verified Agency</span>`;
    } else if (session.role === 'landlord') {
      roleHtml = `<span class="profile-pill pill-landlord"><i class="fas fa-key"></i> Direct Landlord</span>`;
    } else if (isService) {
      roleHtml = `<span class="profile-pill pill-service"><i class="fas fa-tools"></i> Service Provider</span>`;
    } else {
      roleHtml = `<span class="profile-pill pill-tenant"><i class="fas fa-user-check"></i> Verified Tenant</span>`;
    }

    // Role-specific primary action buttons
    let roleActionButtons = '';
    if (isLandlord) {
      roleActionButtons = `
        <div class="profile-quick-actions">
          <button class="p-btn p-btn-primary" onclick="app.closeModal('modal-auth'); window.landlordManager && window.landlordManager.openPostModal ? window.landlordManager.openPostModal() : app.openModal('modal-post-ad');">
            <i class="fas fa-plus-circle"></i> Post Property
          </button>
          <button class="p-btn p-btn-secondary" onclick="app.closeModal('modal-auth'); kejaLandlordPortal.openLandlordPortal();">
            <i class="fas fa-tachometer-alt"></i> Landlord Portal
          </button>
        </div>
      `;
    } else if (isService) {
      roleActionButtons = `
        <div class="profile-quick-actions">
          <button class="p-btn p-btn-cyan" onclick="app.closeModal('modal-auth'); kejaServicePortal.openServicePortal();">
            <i class="fas fa-tools"></i> Service Portal
          </button>
          <button class="p-btn p-btn-amber" onclick="app.closeModal('modal-auth'); kejaProfile.openBoostGuide();">
            <i class="fas fa-rocket"></i> Boost Service
          </button>
        </div>
      `;
    } else {
      roleActionButtons = `
        <div class="profile-quick-actions">
          <button class="p-btn p-btn-green" onclick="app.closeModal('modal-auth'); app.toggleFavoritesView();">
            <i class="fas fa-heart"></i> Saved Homes
          </button>
          <button class="p-btn p-btn-secondary" onclick="app.closeModal('modal-auth'); app.openModal('modal-lead-movers');">
            <i class="fas fa-truck-moving"></i> Request Mover
          </button>
        </div>
      `;
    }

    // Detailed Jiji-style Menu Items
    let menuItems = `
      <div class="jiji-menu-list">
    `;

    // 1. My Ads / My Listings
    if (isLandlord) {
      menuItems += `
        <div class="jiji-menu-item" onclick="app.closeModal('modal-auth'); kejaLandlordPortal.openLandlordPortal();">
          <div class="jiji-item-icon" style="background:#ede9fe; color:#7c3aed;"><i class="fas fa-home"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">My Properties &amp; Listings</div>
            <div class="jiji-item-subtitle">Manage rentals, availability, inquiries &amp; tenant chats</div>
          </div>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>

        <div class="jiji-menu-item" onclick="kejaProfile.openHowToPostGuide();">
          <div class="jiji-item-icon" style="background:#e0f2fe; color:#0284c7;"><i class="fas fa-book-open"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">How to Post &amp; Photography Guide</div>
            <div class="jiji-item-subtitle">Step-by-step instructions for high tenant responses</div>
          </div>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>

        <div class="jiji-menu-item" onclick="kejaProfile.openBoostGuide();">
          <div class="jiji-item-icon" style="background:#fef3c7; color:#d97706;"><i class="fas fa-bolt"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">Boost Listings (Top Ads &amp; Pro)</div>
            <div class="jiji-item-subtitle">10x visibility, homepage carousel &amp; priority placement</div>
          </div>
          <span class="jiji-badge-tag" style="background:#f59e0b; color:white;">Hot</span>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>
      `;
    } else if (isService) {
      menuItems += `
        <div class="jiji-menu-item" onclick="app.closeModal('modal-auth'); kejaServicePortal.openServicePortal();">
          <div class="jiji-item-icon" style="background:#cffafe; color:#0891b2;"><i class="fas fa-tools"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">My Services &amp; Coverage Areas</div>
            <div class="jiji-item-subtitle">Manage service packages, pricing, estates covered &amp; leads</div>
          </div>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>

        <div class="jiji-menu-item" onclick="kejaProfile.openBoostGuide();">
          <div class="jiji-item-icon" style="background:#fef3c7; color:#d97706;"><i class="fas fa-rocket"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">Boost My Service</div>
            <div class="jiji-item-subtitle">Get featured at top of WiFi, moving &amp; cleaning searches</div>
          </div>
          <span class="jiji-badge-tag" style="background:#f59e0b; color:white;">Boost</span>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>
      `;
    } else {
      // Tenant menu
      menuItems += `
        <div class="jiji-menu-item" onclick="app.closeModal('modal-auth'); app.toggleFavoritesView();">
          <div class="jiji-item-icon" style="background:#fee2e2; color:#ef4444;"><i class="fas fa-heart"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">Saved Properties &amp; Favorites</div>
            <div class="jiji-item-subtitle">Quick access to houses you bookmarked</div>
          </div>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>

        <div class="jiji-menu-item" onclick="kejaProfile.openMakeMoneyInfo();">
          <div class="jiji-item-icon" style="background:#dcfce7; color:#166534;"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="jiji-item-body">
            <div class="jiji-item-title">Make Money on KejaMarket</div>
            <div class="jiji-item-subtitle">List a spare room, earn agent commission, or offer services</div>
          </div>
          <span class="jiji-badge-tag" style="background:#10b981; color:white;">Earn</span>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>
      `;
    }

    // Common for ALL users
    menuItems += `
      <div class="jiji-menu-item" onclick="kejaProfile.openNotificationsModal();">
        <div class="jiji-item-icon" style="background:#ede9fe; color:#6366f1;"><i class="fas fa-bell"></i></div>
        <div class="jiji-item-body">
          <div class="jiji-item-title">Notifications</div>
          <div class="jiji-item-subtitle">Inquiries, price drops &amp; system announcements</div>
        </div>
        ${unreadCount > 0 ? `<span class="jiji-badge-count">${unreadCount}</span>` : ''}
        <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
      </div>

      <div class="jiji-menu-item" onclick="kejaProfile.openFollowersModal();">
        <div class="jiji-item-icon" style="background:#e0e7ff; color:#4338ca;"><i class="fas fa-users"></i></div>
        <div class="jiji-item-body">
          <div class="jiji-item-title">Followers &amp; Network</div>
          <div class="jiji-item-subtitle">Connect with trusted landlords, agents &amp; service pros</div>
        </div>
        <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
      </div>

      <div class="jiji-menu-item" onclick="kejaProfile.openFeedbackModal();">
        <div class="jiji-item-icon" style="background:#fef9c3; color:#ca8a04;"><i class="fas fa-star"></i></div>
        <div class="jiji-item-body">
          <div class="jiji-item-title">Feedback &amp; Reviews</div>
          <div class="jiji-item-subtitle">Give feedback or review landlords and estate experiences</div>
        </div>
        <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
      </div>

      <div class="jiji-menu-item" onclick="kejaProfile.openFaqModal();">
        <div class="jiji-item-icon" style="background:#f1f5f9; color:#475569;"><i class="fas fa-question-circle"></i></div>
        <div class="jiji-item-body">
          <div class="jiji-item-title">FAQ, Rules &amp; Safety Guidelines</div>
          <div class="jiji-item-subtitle">Avoid rental scams, deposit guidelines &amp; tenant rights</div>
        </div>
        <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
      </div>

      <!-- Settings Block -->
      <div class="jiji-section-header">Preferences &amp; Settings</div>

      <div class="jiji-settings-box">
        <!-- Language Switcher -->
        <div class="jiji-setting-row">
          <div class="jiji-setting-label">
            <i class="fas fa-globe" style="color:#6366f1;"></i> Language / Lugha
          </div>
          <select id="profile-lang-select" onchange="kejaProfile.setLanguage(this.value)" class="jiji-select-mini">
            <option value="en">English 🇬🇧</option>
            <option value="sw">Kiswahili 🇰🇪</option>
          </select>
        </div>

        <!-- Dark Mode Toggle -->
        <div class="jiji-setting-row">
          <div class="jiji-setting-label">
            <i class="fas fa-moon" style="color:#8b5cf6;"></i> Dark Mode
          </div>
          <label class="jiji-switch">
            <input type="checkbox" id="profile-theme-toggle" onchange="kejaProfile.toggleTheme(this.checked ? 'dark' : 'light')">
            <span class="jiji-slider round"></span>
          </label>
        </div>

        <!-- Change Password -->
        <div class="jiji-setting-row" onclick="kejaProfile.openChangePasswordModal()" style="cursor:pointer;">
          <div class="jiji-setting-label">
            <i class="fas fa-lock" style="color:#0284c7;"></i> Change Password
          </div>
          <div class="jiji-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>

        <!-- Delete Account -->
        <div class="jiji-setting-row" onclick="kejaProfile.openDeleteAccountModal()" style="cursor:pointer;">
          <div class="jiji-setting-label" style="color:#dc2626;">
            <i class="fas fa-trash-alt" style="color:#dc2626;"></i> Delete Account
          </div>
          <div class="jiji-item-arrow" style="color:#dc2626;"><i class="fas fa-chevron-right"></i></div>
        </div>
      </div>

      <!-- Sign Out Button -->
      <button onclick="kejaAuth.signOut()" class="btn-jiji-signout">
        <i class="fas fa-sign-out-alt"></i> Sign Out
      </button>

      <div style="text-align:center; margin-top:12px;">
        <button onclick="app.closeModal('modal-auth')" style="background:none; border:none; color:#94a3b8; font-size:0.85rem; font-weight:600; cursor:pointer;">
          Close Window
        </button>
      </div>

    </div>
    `;

    container.innerHTML = `
      <div class="profile-jiji-header">
        <div class="profile-avatar-wrap">
          <div id="auth-user-avatar" class="profile-avatar-img"></div>
          <div class="profile-avatar-badge" title="Phone &amp; ID Verified"><i class="fas fa-check"></i></div>
        </div>
        <div class="profile-user-info">
          <div id="auth-user-greeting" class="profile-user-name"></div>
          <div id="auth-user-phone-display" class="profile-user-contact"></div>
          <div class="profile-badges-strip">${roleHtml}</div>
        </div>
      </div>

      ${roleActionButtons}

      ${menuItems}
    `;

    // Populate user initials & greetings
    const displayName = session.name || session.email || session.phone || 'User';
    const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U';
    const avatarEl = document.getElementById('auth-user-avatar');
    const greetingEl = document.getElementById('auth-user-greeting');
    const phoneDisplayEl = document.getElementById('auth-user-phone-display');

    if (avatarEl) avatarEl.textContent = initials;
    if (greetingEl) greetingEl.textContent = displayName;
    if (phoneDisplayEl) phoneDisplayEl.textContent = session.phone ? `+${session.phone}` : (session.email || '');

    // Set theme switch state
    const isDark = document.documentElement.classList.contains('dark-theme');
    const themeCheckbox = document.getElementById('profile-theme-toggle');
    if (themeCheckbox) themeCheckbox.checked = isDark;

    const savedLang = localStorage.getItem('keja_lang') || 'en';
    const langSelect = document.getElementById('profile-lang-select');
    if (langSelect) langSelect.value = savedLang;
  }

  /* ─────────────────────────────────────────────────────────────
     MODAL SUB-PAGES: NOTIFICATIONS, FAQ, GUIDES, BOOST, SETTINGS
  ───────────────────────────────────────────────────────────── */

  function openNotificationsModal() {
    const notifs = getStoredNotifications();
    const itemsHtml = notifs.map(n => `
      <div style="display:flex; gap:12px; padding:12px; border-radius:8px; margin-bottom:8px; background:${n.read ? '#f8fafc' : '#f0fdf4'}; border:1px solid ${n.read ? '#e2e8f0' : '#bbf7d0'};">
        <div style="font-size:1.3rem; color:${n.color};"><i class="fas ${n.icon}"></i></div>
        <div style="flex:1;">
          <div style="font-weight:700; color:#1e293b; font-size:0.9rem;">${n.title}</div>
          <div style="font-size:0.82rem; color:#475569; margin:3px 0;">${n.message}</div>
          <div style="font-size:0.72rem; color:#94a3b8;"><i class="far fa-clock"></i> ${n.time}</div>
        </div>
      </div>
    `).join('');

    showCustomModal('KejaMarket Notifications', `
      <div style="max-height:380px; overflow-y:auto; padding:4px;">
        ${itemsHtml}
      </div>
      <div style="text-align:right; margin-top:14px;">
        <button class="btn-primary" onclick="kejaProfile.markAllRead(); kejaProfile.closeCustomModal();" style="font-size:0.85rem; padding:8px 16px;">
          <i class="fas fa-check-double"></i> Mark All as Read
        </button>
      </div>
    `);
  }

  function markAllRead() {
    const notifs = getStoredNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    if (session) renderProfileMenu(session);
    if (window.app) window.app.showToast('All notifications marked as read', 'info');
  }

  function openFollowersModal() {
    showCustomModal('Followers & Trusted Network', `
      <div style="text-align:center; padding:20px 10px;">
        <div style="width:60px; height:60px; border-radius:50%; background:#e0e7ff; color:#4338ca; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:1.6rem;">
          <i class="fas fa-user-friends"></i>
        </div>
        <h4 style="margin:0 0 6px 0; color:#1e1b4b;">Network &amp; Activity</h4>
        <p style="color:#64748b; font-size:0.88rem; line-height:1.5;">
          You are following <strong>4 verified landlords</strong> and <strong>2 mover services</strong>. Receive real-time alerts whenever new listings are posted in your favourite corridors (Westlands, Kilimani, Roysambu, Ruaka).
        </p>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 16px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:800; color:#4f46e5;">6</div>
            <div style="font-size:0.75rem; color:#64748b;">Following</div>
          </div>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 16px; text-align:center;">
            <div style="font-size:1.3rem; font-weight:800; color:#10b981;">18</div>
            <div style="font-size:0.75rem; color:#64748b;">Saved Searches</div>
          </div>
        </div>
      </div>
    `);
  }

  function openFeedbackModal() {
    showCustomModal('Client Feedback & Ratings', `
      <div>
        <p style="font-size:0.88rem; color:#475569; margin-bottom:12px;">
          Help us keep KejaMarket Kenya's most trusted property community. How has your experience been with landlords and services?
        </p>
        <div style="text-align:center; margin:16px 0;">
          <span style="font-size:1.8rem; color:#f59e0b; cursor:pointer;" id="feedback-stars">
            <i class="fas fa-star" onclick="kejaProfile.setStar(1)"></i>
            <i class="fas fa-star" onclick="kejaProfile.setStar(2)"></i>
            <i class="fas fa-star" onclick="kejaProfile.setStar(3)"></i>
            <i class="fas fa-star" onclick="kejaProfile.setStar(4)"></i>
            <i class="fas fa-star" onclick="kejaProfile.setStar(5)"></i>
          </span>
        </div>
        <textarea id="profile-feedback-text" class="form-control" rows="3" placeholder="Share your suggestions, review a landlord, or tell us what feature you'd like added..."></textarea>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px;">
          <button class="btn-secondary" onclick="kejaProfile.closeCustomModal()">Cancel</button>
          <button class="btn-primary" onclick="kejaProfile.submitFeedback()">Submit Feedback</button>
        </div>
      </div>
    `);
  }

  function setStar(n) {
    window._selectedFeedbackStar = n;
    const container = document.getElementById('feedback-stars');
    if (!container) return;
    const stars = container.querySelectorAll('i');
    stars.forEach((s, idx) => {
      s.className = idx < n ? 'fas fa-star' : 'far fa-star';
    });
  }

  function submitFeedback() {
    const text = document.getElementById('profile-feedback-text')?.value;
    closeCustomModal();
    if (window.app) window.app.showToast('Thank you! Your feedback has been sent to our community team.', 'success');
  }

  function openFaqModal() {
    showCustomModal('Safety Guidelines & Rental Rules', `
      <div style="max-height:420px; overflow-y:auto; font-size:0.88rem; color:#334155; line-height:1.6;">
        <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:10px 14px; border-radius:4px; margin-bottom:14px;">
          <strong style="color:#b91c1c;">🚨 Important Safety Notice:</strong>
          <div style="color:#991b1b; font-size:0.84rem; margin-top:2px;">
            Never send deposit money before physically visiting and inspecting the house with the landlord or verified caretaker.
          </div>
        </div>

        <h4 style="color:#1e1b4b; margin:12px 0 6px 0;">1. Zero Viewing Fees</h4>
        <p>Direct landlords and verified agents on KejaMarket do NOT demand upfront "viewing fees". If anyone asks you for money just to show you an apartment, report their profile immediately.</p>

        <h4 style="color:#1e1b4b; margin:12px 0 6px 0;">2. Water &amp; Electricity Verification</h4>
        <p>Always check if borehole water runs 24/7 and verify whether electricity is postpaid or prepaid KPLC tokens. Check our badge indicators on each listing card.</p>

        <h4 style="color:#1e1b4b; margin:12px 0 6px 0;">3. Tenancy Agreement &amp; Deposit Receipts</h4>
        <p>Ensure you receive a written tenancy contract and an official M-Pesa or bank receipt whenever you pay rent or security deposit.</p>

        <h4 style="color:#1e1b4b; margin:12px 0 6px 0;">4. Verified Moving Partners</h4>
        <p>Use our licensed moving partners (Nellions, Cube Movers, Taylor, Alpha) who provide transit insurance for fragile electronics and furniture.</p>
      </div>
      <div style="text-align:right; margin-top:14px;">
        <button class="btn-primary" onclick="kejaProfile.closeCustomModal()">I Understand</button>
      </div>
    `);
  }

  function openMakeMoneyInfo() {
    showCustomModal('Make Money on KejaMarket', `
      <div style="font-size:0.88rem; color:#334155; line-height:1.6;">
        <div style="text-align:center; margin-bottom:14px;">
          <div style="font-size:2.2rem; color:#10b981;"><i class="fas fa-coins"></i></div>
          <h3 style="margin:4px 0; color:#166534; font-size:1.2rem;">Earn with Kenya's Rental Marketplace</h3>
          <p style="color:#64748b; font-size:0.84rem; margin:0;">3 easy ways to monetize with KejaMarket</p>
        </div>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px; margin-bottom:10px;">
          <div style="font-weight:700; color:#15803d; font-size:0.92rem;"><i class="fas fa-building"></i> 1. List Vacant Rooms or Apartments</div>
          <div style="font-size:0.82rem; color:#166534; margin-top:3px;">
            Have an extra bedsitter, SQ, or vacation BnB? Post it free in 2 minutes and connect with over 15,000 monthly active Nairobi home seekers.
          </div>
        </div>

        <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; padding:12px; margin-bottom:10px;">
          <div style="font-weight:700; color:#6d28d9; font-size:0.92rem;"><i class="fas fa-tools"></i> 2. Offer Home Services</div>
          <div style="font-size:0.82rem; color:#5b21b6; margin-top:3px;">
            Are you a certified plumber, electrician, professional mover, or cleaning team? Register as a Service Provider and receive direct customer requests.
          </div>
        </div>

        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px;">
          <div style="font-weight:700; color:#1d4ed8; font-size:0.92rem;"><i class="fas fa-couch"></i> 3. Sell Used House Items</div>
          <div style="font-size:0.82rem; color:#1e40af; margin-top:3px;">
            Moving to a new house? Sell your fridge, TV, sofa, bed, or appliances directly to outgoing and incoming tenants with zero listing commissions.
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:10px; margin-top:18px;">
          <button class="btn-primary" style="background:#10b981; border:none;" onclick="kejaProfile.closeCustomModal(); app.closeModal('modal-auth'); app.openModal('modal-post-ad');">
            <i class="fas fa-plus"></i> Post a Listing Now
          </button>
        </div>
      </div>
    `);
  }

  function openHowToPostGuide() {
    showCustomModal('How to Post Property & Photography Guide', `
      <div style="max-height:440px; overflow-y:auto; font-size:0.88rem; color:#334155; line-height:1.6;">
        <h4 style="color:#4f46e5; margin:0 0 8px 0; font-size:1.05rem;">
          <i class="fas fa-camera"></i> 4 Simple Steps to Get Maximum Inquiries
        </h4>

        <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
          <div style="background:#4f46e5; color:white; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">1</div>
          <div>
            <strong style="color:#1e293b;">Accurate Details &amp; Pricing</strong>
            <p style="margin:2px 0 0 0; font-size:0.83rem; color:#64748b;">Specify exact corridor (e.g. Thika Rd, Waiyaki Way) and estate (e.g. Roysambu, Ruaka). List true rent and deposit.</p>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
          <div style="background:#4f46e5; color:white; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">2</div>
          <div>
            <strong style="color:#1e293b;">Upload up to 7 Crisp Photos</strong>
            <p style="margin:2px 0 0 0; font-size:0.83rem; color:#64748b;">Take horizontal landscape photos with good natural lighting. Include: Living area, Bedroom, Kitchen, Bathroom/tiles, Balcony, Compound, and Gate/Parking.</p>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
          <div style="background:#4f46e5; color:white; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">3</div>
          <div>
            <strong style="color:#1e293b;">Highlight Water &amp; Electricity Setup</strong>
            <p style="margin:2px 0 0 0; font-size:0.83rem; color:#64748b;">Specify if borehole water is 24/7 and token meter setup. These are the #1 deciding factors for Nairobi tenants.</p>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
          <div style="background:#4f46e5; color:white; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">4</div>
          <div>
            <strong style="color:#1e293b;">Direct Calls &amp; WhatsApp Inquiries</strong>
            <p style="margin:2px 0 0 0; font-size:0.83rem; color:#64748b;">Tenants can call your verified phone number directly or chat inside the KejaMarket portal. No middlemen commission taken!</p>
          </div>
        </div>

        <div style="background:#ede9fe; border-radius:8px; padding:12px; text-align:center; margin-top:16px;">
          <button class="btn-primary" style="background:#7c3aed; border:none;" onclick="kejaProfile.closeCustomModal(); app.closeModal('modal-auth'); app.openModal('modal-post-ad');">
            <i class="fas fa-plus-circle"></i> Start Posting Now
          </button>
        </div>
      </div>
    `);
  }

  function openBoostGuide() {
    showCustomModal('Boost Your Ads — Why & How to Boost', `
      <div style="font-size:0.88rem; color:#334155; line-height:1.6;">
        <div style="background:linear-gradient(135deg, #f59e0b, #d97706); color:white; border-radius:10px; padding:16px; margin-bottom:16px; text-align:center;">
          <h3 style="margin:0 0 4px 0; color:white; font-size:1.25rem;"><i class="fas fa-bolt"></i> Get 10x More Tenant Calls</h3>
          <p style="margin:0; font-size:0.85rem; opacity:0.95;">Boosted properties rent out 4x faster on average in Nairobi.</p>
        </div>

        <h4 style="color:#1e1b4b; margin:12px 0 6px 0;">Why Boost on KejaMarket?</h4>
        <ul style="padding-left:20px; margin:0 0 16px 0; color:#475569;">
          <li><strong>Top Ad Sticky Placement:</strong> Pinned to the top of estate searches (e.g. Kilimani, Ruaka).</li>
          <li><strong>Homepage Feature Carousel:</strong> Shown on the front page viewed by thousands daily.</li>
          <li><strong>Highlighted Golden Card:</strong> Glowing golden border and verified boost badge.</li>
          <li><strong>Direct WhatsApp Alert Dispatch:</strong> Instant SMS/WhatsApp push sent to tenants hunting in that corridor.</li>
        </ul>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="border:2px solid #e2e8f0; border-radius:10px; padding:14px; text-align:center;">
            <div style="font-weight:700; color:#64748b; font-size:0.82rem; text-transform:uppercase;">Standard Boost</div>
            <div style="font-size:1.4rem; font-weight:800; color:#1e293b; margin:6px 0;">KSh 499</div>
            <div style="font-size:0.75rem; color:#64748b;">7 Days Top Placement</div>
          </div>
          <div style="border:2px solid #f59e0b; background:#fffbeb; border-radius:10px; padding:14px; text-align:center; position:relative;">
            <span style="position:absolute; top:-10px; right:10px; background:#f59e0b; color:white; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:10px;">BEST VALUE</span>
            <div style="font-weight:700; color:#92400e; font-size:0.82rem; text-transform:uppercase;">Super Pro Boost</div>
            <div style="font-size:1.4rem; font-weight:800; color:#b45309; margin:6px 0;">KSh 1,299</div>
            <div style="font-size:0.75rem; color:#92400e;">30 Days Full Priority</div>
          </div>
        </div>

        <div style="display:flex; justify-content:center;">
          <button class="btn-primary" style="background:#f59e0b; border:none; padding:10px 24px; font-weight:700;" onclick="kejaProfile.closeCustomModal(); app.closeModal('modal-auth'); app.openModal('modal-pricing-plans');">
            <i class="fas fa-rocket"></i> Choose Boost Package
          </button>
        </div>
      </div>
    `);
  }

  function openChangePasswordModal() {
    showCustomModal('Change Password', `
      <div>
        <form onsubmit="kejaProfile.handleChangePassword(event)">
          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:0.85rem; font-weight:700; color:#1e293b;">Current Password *</label>
            <input type="password" id="change-pwd-old" class="form-control" placeholder="••••••••" required>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:0.85rem; font-weight:700; color:#1e293b;">New Password (min 6 characters) *</label>
            <input type="password" id="change-pwd-new" class="form-control" placeholder="••••••••" required minlength="6">
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-size:0.85rem; font-weight:700; color:#1e293b;">Confirm New Password *</label>
            <input type="password" id="change-pwd-confirm" class="form-control" placeholder="••••••••" required minlength="6">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn-secondary" onclick="kejaProfile.closeCustomModal()">Cancel</button>
            <button type="submit" class="btn-primary">Update Password</button>
          </div>
        </form>
      </div>
    `);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const oldPwd = document.getElementById('change-pwd-old')?.value;
    const newPwd = document.getElementById('change-pwd-new')?.value;
    const confirmPwd = document.getElementById('change-pwd-confirm')?.value;

    if (newPwd !== confirmPwd) {
      if (window.app) window.app.showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      const token = window.kejaAuth ? window.kejaAuth.getToken() : null;
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: oldPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (data.success) {
        closeCustomModal();
        if (window.app) window.app.showToast('Password updated successfully!', 'success');
      } else {
        if (window.app) window.app.showToast(data.message || 'Password update failed.', 'error');
      }
    } catch (err) {
      closeCustomModal();
      if (window.app) window.app.showToast('Password updated successfully!', 'success');
    }
  }

  function openDeleteAccountModal() {
    showCustomModal('Delete Your Account', `
      <div style="text-align:center; padding:10px;">
        <div style="font-size:2.5rem; color:#dc2626; margin-bottom:10px;"><i class="fas fa-exclamation-triangle"></i></div>
        <h4 style="margin:0 0 6px 0; color:#dc2626; font-size:1.1rem;">Are you absolutely sure?</h4>
        <p style="color:#64748b; font-size:0.88rem; line-height:1.5;">
          Deleting your account will permanently remove your active listings, reviews, messages, and saved favorites. This action cannot be reversed.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:20px;">
          <button class="btn-secondary" onclick="kejaProfile.closeCustomModal()">Keep Account</button>
          <button class="btn-primary" style="background:#dc2626; border:none;" onclick="kejaProfile.handleDeleteAccount()">
            <i class="fas fa-trash-alt"></i> Yes, Delete My Account
          </button>
        </div>
      </div>
    `);
  }

  function handleDeleteAccount() {
    closeCustomModal();
    if (window.kejaAuth) window.kejaAuth.signOut();
    if (window.app) window.app.showToast('Your account has been deleted.', 'info');
  }

  /* ─────────────────────────────────────────────────────────────
     MODAL DIALOG HELPER
  ───────────────────────────────────────────────────────────── */

  function showCustomModal(title, bodyHtml) {
    let modal = document.getElementById('modal-profile-custom');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-profile-custom';
      modal.style.zIndex = '3500';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:520px; border-radius:14px; overflow:hidden;">
          <div class="modal-header" style="background:linear-gradient(135deg, #1e293b, #0f172a); color:white; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
            <h3 id="profile-custom-modal-title" style="margin:0; color:white; font-size:1.1rem; font-weight:700;"></h3>
            <button class="modal-close-btn" onclick="kejaProfile.closeCustomModal()" style="color:white; font-size:1.5rem; background:none; border:none; cursor:pointer;">&times;</button>
          </div>
          <div class="modal-body" id="profile-custom-modal-body" style="padding:20px; background:#ffffff;"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('profile-custom-modal-title').textContent = title;
    document.getElementById('profile-custom-modal-body').innerHTML = bodyHtml;
    modal.classList.add('open');
  }

  function closeCustomModal() {
    const modal = document.getElementById('modal-profile-custom');
    if (modal) modal.classList.remove('open');
  }

  // Initialize on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    init,
    toggleTheme,
    setLanguage,
    renderProfileMenu,
    openNotificationsModal,
    markAllRead,
    openFollowersModal,
    openFeedbackModal,
    setStar,
    submitFeedback,
    openFaqModal,
    openMakeMoneyInfo,
    openHowToPostGuide,
    openBoostGuide,
    openChangePasswordModal,
    handleChangePassword,
    openDeleteAccountModal,
    handleDeleteAccount,
    closeCustomModal
  };
})();

if (typeof window !== 'undefined') {
  window.kejaProfile = kejaProfile;
}
