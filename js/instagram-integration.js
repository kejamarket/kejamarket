/**
 * KejaMarket - Omni-Channel Social Engine
 * Public: WhatsApp (0792409540), Instagram (@kejamarket), Facebook (@kejamarket), TikTok (@kejamarket)
 * Admin Portal: 1-Click Multi-Channel Broadcast Suite (WhatsApp, Instagram, Facebook, TikTok)
 */

window.kejaSocial = {
  instagramUrl: 'https://instagram.com/kejamarket',
  whatsappUrl: 'https://wa.me/254792409540',
  whatsappNumber: '0792409540',
  facebookUrl: 'https://facebook.com/kejamarket',
  tiktokUrl: 'https://tiktok.com/@kejamarket',
  currentProperty: null,
  activeTab: 'whatsapp',

  toggleWidget() {
    const menu = document.getElementById('social-widget-menu');
    if (!menu) return;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  },

  closeWidget() {
    const menu = document.getElementById('social-widget-menu');
    if (menu) menu.style.display = 'none';
  },

  openInstagram() {
    window.open(this.instagramUrl, '_blank');
  },

  openWhatsApp() {
    window.open(this.whatsappUrl, '_blank');
  },

  openFacebook() {
    window.open(this.facebookUrl, '_blank');
  },

  openTikTok() {
    window.open(this.tiktokUrl, '_blank');
  },

  // Generate customized captions for each network
  generateCaptions(p) {
    if (!p) return {};
    const rent = Number(p.rentKes || p.price || 0).toLocaleString();
    const deposit = Number(p.depositKes || p.rentKes || p.price || 0).toLocaleString();
    const loc = p.estateSuburb || p.locationDisplay || 'Nairobi';
    const exactLoc = p.exactLocation || loc;
    const caretaker = p.caretakerName ? `${p.caretakerName} (${p.caretakerPhone || '0792409540'})` : 'KejaMarket Official (0792409540)';
    const cleanSub = loc.split('(')[0].trim().replace(/\s+/g, '').toLowerCase();

    return {
      whatsapp: `🏠 *VACANT HOUSE TOUR - ${loc.toUpperCase()}*\n${p.title}\n\n💰 *Rent:* KSh ${rent} / month\n💵 *Deposit:* KSh ${deposit}\n📍 *Location:* ${exactLoc}\n🛏️ *Bedrooms:* ${p.bedrooms ?? 1} | 🚿 *Bathrooms:* ${p.bathrooms ?? 1}\n💧 *Water:* ${p.waterSupplyType || 'Borehole Water (24/7)'}\n⚡ *Electricity:* ${p.electricityMeterType || 'Prepaid Tokens'}\n📞 *Inquiries / Caretaker:* ${caretaker}\n\n✅ *Verified & Available on KejaMarket*\n🌐 *Direct Link:* https://kejamarket.co.ke?prop=${p.id}\n\n👉 *WhatsApp us on 0792409540 for instant free viewing!*`,

      instagram: `🏠 VACANT HOUSE IN ${loc.toUpperCase()}:\n${p.title}\n\n💰 Rent: KSh ${rent} / month\n💵 Deposit: KSh ${deposit}\n📍 Exact Location: ${exactLoc}\n🛏️ Bedrooms: ${p.bedrooms ?? 1} | 🚿 Bathrooms: ${p.bathrooms ?? 1}\n💧 Water: ${p.waterSupplyType || 'Borehole Water 24/7'}\n⚡ Electricity: ${p.electricityMeterType || 'Prepaid Tokens'}\n📞 Contact / Caretaker: ${caretaker}\n\n✅ Verified Vacant & Available on KejaMarket!\n🔗 Website ID: ${p.id}\n👉 Follow @kejamarket for daily verified house tours across Nairobi!\n\n#kejamarket #nairobihousehunting #rentalskenya #${cleanSub}apartments #kenyahomes #nairobitenants #vacanthouses`,

      facebook: `🏠 VACANT HOUSE FOR RENT IN ${loc.toUpperCase()}\n${p.title}\n\nRent: KSh ${rent} / Month | Deposit: KSh ${deposit}\nLocation: ${exactLoc}\n\n✔ Verified vacant unit with individual token meter and reliable water supply.\n✔ Zero viewing fee — physical inspection is 100% FREE.\n\nCaretaker / Contact: ${caretaker}\nWhatsApp Official: 0792409540\nListing Details: https://kejamarket.co.ke?prop=${p.id}\n\n#KejaMarket #NairobiRentals #RealHomesKenya`,

      tiktok: `🔥 TOUR THIS VACANT HOUSE IN ${loc.toUpperCase()}!\n${p.title}\nRent: KSh ${rent}/month | Deposit: KSh ${deposit}\nLocation: ${exactLoc}\n\nDrop a comment or WhatsApp 0792409540 to schedule free viewing today!\n\n#kejamarket #nairobitiktok #housetour #vacanthouses #kenyantiktok #fyp #foryoupage #rentalsinnairobi`
    };
  },

  // Open Admin Blast Modal
  openAdminBlast(p, defaultTab = 'whatsapp') {
    this.currentProperty = p;
    this.activeTab = defaultTab;

    const modal = document.getElementById('modal-admin-social-blast');
    if (!modal) return;

    // Update Property Header
    const titleEl = document.getElementById('admin-blast-prop-title');
    if (titleEl) titleEl.textContent = p.title;

    // Render tabs content
    this.switchBlastTab(defaultTab);

    modal.style.display = 'flex';
    modal.classList.add('open');
  },

  closeAdminBlast() {
    const modal = document.getElementById('modal-admin-social-blast');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('open');
    }
  },

  switchBlastTab(tab) {
    this.activeTab = tab;
    const p = this.currentProperty;
    if (!p) return;

    const captions = this.generateCaptions(p);
    const content = captions[tab] || '';

    // Update active tab buttons
    document.querySelectorAll('.admin-social-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    const box = document.getElementById('admin-blast-text-box');
    if (box) box.value = content;

    // Update action buttons based on tab
    const actionContainer = document.getElementById('admin-blast-actions');
    if (!actionContainer) return;

    if (tab === 'whatsapp') {
      actionContainer.innerHTML = `
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy WhatsApp Text
        </button>
        <button type="button" onclick="kejaSocial.shareToWhatsAppDirect()" style="background: #25d366; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-whatsapp"></i> Broadcast to WhatsApp
        </button>
      `;
    } else if (tab === 'instagram') {
      actionContainer.innerHTML = `
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy Caption & Hashtags
        </button>
        <a href="https://instagram.com/kejamarket" target="_blank" style="background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-instagram"></i> Open @kejamarket
        </a>
      `;
    } else if (tab === 'facebook') {
      actionContainer.innerHTML = `
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy Facebook Post
        </button>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://kejamarket.co.ke?prop=' + p.id)}" target="_blank" style="background: #1877f2; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-facebook-f"></i> Share to Facebook
        </a>
      `;
    } else if (tab === 'tiktok') {
      actionContainer.innerHTML = `
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy TikTok Caption
        </button>
        <a href="https://tiktok.com/@kejamarket" target="_blank" style="background: #0f172a; color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-tiktok"></i> Open TikTok
        </a>
      `;
    }
  },

  copyCurrentText() {
    const box = document.getElementById('admin-blast-text-box');
    if (!box) return;
    const text = box.value;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`✅ ${this.activeTab.toUpperCase()} text copied to clipboard!`, 'success');
        } else {
          alert('Copied to clipboard!');
        }
      });
    } else {
      box.select();
      document.execCommand('copy');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`✅ ${this.activeTab.toUpperCase()} text copied to clipboard!`, 'success');
      } else {
        alert('Copied to clipboard!');
      }
    }
  },

  shareToWhatsAppDirect() {
    const box = document.getElementById('admin-blast-text-box');
    const text = box ? box.value : '';
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
};

// Auto-bind to prototype and app instance
if (typeof window !== 'undefined') {
  window.attachSocialToApp = function() {
    const targets = [];
    if (window.app) targets.push(window.app);
    if (window.NairobiRentalsApp && window.NairobiRentalsApp.prototype) targets.push(window.NairobiRentalsApp.prototype);

    targets.forEach(t => {
      t.openAdminSocialBlast = function(propertyId, tab = 'whatsapp') {
        const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
        const isAdmin = !!(session && (session.role === 'admin' || session.isAdmin === true));
        if (!isAdmin) {
          if (typeof this.showToast === 'function') {
            this.showToast('Social Blast is restricted to Administrator portal.', 'info');
          }
          return;
        }
        const allProps = this.properties || [];
        const p = allProps.find(x => x.id === propertyId) || this.selectedPropertyForDetail;
        if (p) window.kejaSocial.openAdminBlast(p, tab);
      };
    });
  };

  window.attachSocialToApp();
  document.addEventListener('DOMContentLoaded', window.attachSocialToApp);

  // Close social widget menu when clicking outside
  document.addEventListener('click', (e) => {
    const widget = document.getElementById('floating-social-widget');
    if (widget && !widget.contains(e.target)) {
      window.kejaSocial.closeWidget();
    }
  });
}
