const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update css/style.css with styles for Facebook card button and Admin Social Blast
const cssPath = path.join(rootDir, 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const socialCss = `
/* KejaMarket Card Action Buttons */
.btn-card-whatsapp {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #25d366;
  border-radius: 6px;
  color: #25d366;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.btn-card-whatsapp:hover {
  background: #25d366;
  color: #ffffff;
}
.btn-card-instagram {
  width: 32px;
  height: 32px;
  background: linear-gradient(45deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(220,39,67,0.25);
}
.btn-card-instagram:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220,39,67,0.35);
}
.btn-card-facebook {
  width: 32px;
  height: 32px;
  background: #1877f2;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(24,119,242,0.25);
}
.btn-card-facebook:hover {
  background: #166fe5;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24,119,242,0.35);
}

/* Admin Social Blast Modal */
.admin-social-tab-btn {
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-weight: 700;
  font-size: 0.88rem;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.admin-social-tab-btn.active {
  color: #0f172a;
  border-bottom-color: #00b53f;
}
`;

if (!css.includes('.btn-card-facebook')) {
  css += '\n' + socialCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Updated css/style.css');
}

// 2. Update js/app.js
const appJsPath = path.join(rootDir, 'js', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

const newCardActions = `<div class="card-actions-row">
            <button type="button" class="btn-card-details-green" onclick="app.openPropertyDetail('\${p.id}')">
              View Details
            </button>
            <button type="button" class="btn-card-whatsapp" onclick="app.handleCardWhatsApp('\${p.id}', event)" title="WhatsApp (0792409540)">
              <i class="fab fa-whatsapp"></i>
            </button>
            <button type="button" class="btn-card-instagram" onclick="app.handleCardInstagram('\${p.id}', event)" title="Instagram (@kejamarket)">
              <i class="fab fa-instagram"></i>
            </button>
            <button type="button" class="btn-card-facebook" onclick="app.handleCardFacebook('\${p.id}', event)" title="Facebook (@kejamarket)">
              <i class="fab fa-facebook-f"></i>
            </button>
          </div>`;

appJs = appJs.replace(
  /<div class="card-actions-row">[\s\S]*?<\/div>/,
  newCardActions
);

// Add admin checking & card action handlers to NairobiRentalsApp
const appHandlers = `
  isAdminUser() {
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    return !!(session && (session.role === 'admin' || session.isAdmin === true));
  }

  handleCardWhatsApp(propertyId, event) {
    if (event) event.stopPropagation();
    const p = (this.properties || []).find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'whatsapp');
      return;
    }

    // Tenant / Regular visitor action: Connect on WhatsApp (caretaker phone or KejaMarket official line 0792409540)
    const rawPhone = (p.caretakerPhone || p.landlord?.whatsapp || p.landlord?.phone || '0792409540').replace(/\\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1) : (rawPhone.startsWith('254') ? rawPhone : '254' + rawPhone);
    const text = encodeURIComponent(\`Hello KejaMarket, I am inquiring about "\${p.title}" [ID: \${p.id}] listed on kejamarket.co.ke. Is it vacant for viewing?\`);
    window.open(\`https://wa.me/\${cleanPhone}?text=\${text}\`, '_blank');
  }

  handleCardInstagram(propertyId, event) {
    if (event) event.stopPropagation();
    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'instagram');
      return;
    }
    // Tenant / Regular visitor / Landlord action: Open official @kejamarket Instagram profile
    window.open('https://instagram.com/kejamarket', '_blank');
  }

  handleCardFacebook(propertyId, event) {
    if (event) event.stopPropagation();
    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'facebook');
      return;
    }
    // Tenant / Regular visitor / Landlord action: Open KejaMarket Facebook page
    window.open('https://facebook.com/kejamarket', '_blank');
  }

  openAdminSocialBlast(propertyId, tab = 'whatsapp') {
    if (!this.isAdminUser()) {
      if (typeof this.showToast === 'function') {
        this.showToast('Social Blast is an Administrator-only marketing feature.', 'info');
      }
      return;
    }

    const p = (this.properties || []).find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    if (window.kejaSocial && typeof window.kejaSocial.openAdminBlast === 'function') {
      window.kejaSocial.openAdminBlast(p, tab);
    }
  }
`;

if (!appJs.includes('handleCardWhatsApp')) {
  appJs = appJs.replace(
    'window.app = new NairobiRentalsApp();',
    appHandlers + '\n\nwindow.app = new NairobiRentalsApp();'
  );
  fs.writeFileSync(appJsPath, appJs, 'utf8');
  console.log('✅ Updated js/app.js with card handlers');
} else {
  fs.writeFileSync(appJsPath, appJs, 'utf8');
  console.log('✅ Updated js/app.js card layout');
}

// 3. Update js/instagram-integration.js to full Social Blast Engine
const socialJsPath = path.join(rootDir, 'js', 'instagram-integration.js');
const newSocialEngine = `/**
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
    const caretaker = p.caretakerName ? \`\${p.caretakerName} (\${p.caretakerPhone || '0792409540'})\` : 'KejaMarket Official (0792409540)';
    const cleanSub = loc.split('(')[0].trim().replace(/\\s+/g, '').toLowerCase();

    return {
      whatsapp: \`🏠 *VACANT HOUSE TOUR - \${loc.toUpperCase()}*\\n\${p.title}\\n\\n💰 *Rent:* KSh \${rent} / month\\n💵 *Deposit:* KSh \${deposit}\\n📍 *Location:* \${exactLoc}\\n🛏️ *Bedrooms:* \${p.bedrooms ?? 1} | 🚿 *Bathrooms:* \${p.bathrooms ?? 1}\\n💧 *Water:* \${p.waterSupplyType || 'Borehole Water (24/7)'}\\n⚡ *Electricity:* \${p.electricityMeterType || 'Prepaid Tokens'}\\n📞 *Inquiries / Caretaker:* \${caretaker}\\n\\n✅ *Verified & Available on KejaMarket*\\n🌐 *Direct Link:* https://kejamarket.co.ke?prop=\${p.id}\\n\\n👉 *WhatsApp us on 0792409540 for instant free viewing!*\`,

      instagram: \`🏠 VACANT HOUSE IN \${loc.toUpperCase()}:\\n\${p.title}\\n\\n💰 Rent: KSh \${rent} / month\\n💵 Deposit: KSh \${deposit}\\n📍 Exact Location: \${exactLoc}\\n🛏️ Bedrooms: \${p.bedrooms ?? 1} | 🚿 Bathrooms: \${p.bathrooms ?? 1}\\n💧 Water: \${p.waterSupplyType || 'Borehole Water 24/7'}\\n⚡ Electricity: \${p.electricityMeterType || 'Prepaid Tokens'}\\n📞 Contact / Caretaker: \${caretaker}\\n\\n✅ Verified Vacant & Available on KejaMarket!\\n🔗 Website ID: \${p.id}\\n👉 Follow @kejamarket for daily verified house tours across Nairobi!\\n\\n#kejamarket #nairobihousehunting #rentalskenya #\${cleanSub}apartments #kenyahomes #nairobitenants #vacanthouses\`,

      facebook: \`🏠 VACANT HOUSE FOR RENT IN \${loc.toUpperCase()}\\n\${p.title}\\n\\nRent: KSh \${rent} / Month | Deposit: KSh \${deposit}\\nLocation: \${exactLoc}\\n\\n✔ Verified vacant unit with individual token meter and reliable water supply.\\n✔ Zero viewing fee — physical inspection is 100% FREE.\\n\\nCaretaker / Contact: \${caretaker}\\nWhatsApp Official: 0792409540\\nListing Details: https://kejamarket.co.ke?prop=\${p.id}\\n\\n#KejaMarket #NairobiRentals #RealHomesKenya\`,

      tiktok: \`🔥 TOUR THIS VACANT HOUSE IN \${loc.toUpperCase()}!\\n\${p.title}\\nRent: KSh \${rent}/month | Deposit: KSh \${deposit}\\nLocation: \${exactLoc}\\n\\nDrop a comment or WhatsApp 0792409540 to schedule free viewing today!\\n\\n#kejamarket #nairobitiktok #housetour #vacanthouses #kenyantiktok #fyp #foryoupage #rentalsinnairobi\`
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
      actionContainer.innerHTML = \`
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy WhatsApp Text
        </button>
        <button type="button" onclick="kejaSocial.shareToWhatsAppDirect()" style="background: #25d366; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-whatsapp"></i> Broadcast to WhatsApp
        </button>
      \`;
    } else if (tab === 'instagram') {
      actionContainer.innerHTML = \`
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy Caption & Hashtags
        </button>
        <a href="https://instagram.com/kejamarket" target="_blank" style="background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-instagram"></i> Open @kejamarket
        </a>
      \`;
    } else if (tab === 'facebook') {
      actionContainer.innerHTML = \`
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy Facebook Post
        </button>
        <a href="https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent('https://kejamarket.co.ke?prop=' + p.id)}" target="_blank" style="background: #1877f2; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-facebook-f"></i> Share to Facebook
        </a>
      \`;
    } else if (tab === 'tiktok') {
      actionContainer.innerHTML = \`
        <button type="button" onclick="kejaSocial.copyCurrentText()" style="background: #00b53f; color: white; border: none; border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fas fa-copy"></i> Copy TikTok Caption
        </button>
        <a href="https://tiktok.com/@kejamarket" target="_blank" style="background: #0f172a; color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 11px 18px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fab fa-tiktok"></i> Open TikTok
        </a>
      \`;
    }
  },

  copyCurrentText() {
    const box = document.getElementById('admin-blast-text-box');
    if (!box) return;
    const text = box.value;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(\`✅ \${this.activeTab.toUpperCase()} text copied to clipboard!\`, 'success');
        } else {
          alert('Copied to clipboard!');
        }
      });
    } else {
      box.select();
      document.execCommand('copy');
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(\`✅ \${this.activeTab.toUpperCase()} text copied to clipboard!\`, 'success');
      } else {
        alert('Copied to clipboard!');
      }
    }
  },

  shareToWhatsAppDirect() {
    const box = document.getElementById('admin-blast-text-box');
    const text = box ? box.value : '';
    const url = \`https://api.whatsapp.com/send?text=\${encodeURIComponent(text)}\`;
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
`;

fs.writeFileSync(socialJsPath, newSocialEngine, 'utf8');
console.log('✅ Updated js/instagram-integration.js with full Omni-Channel Engine');

// 4. Update index.html to add the Admin Social Blast Modal
const indexHtmlPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const oldModalRegex = /<!-- Modal: Instagram Marketing[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newAdminBlastModal = `<!-- Modal: Admin Omni-Channel Social Blast Suite (WhatsApp, Instagram, Facebook, TikTok) -->
  <div class="modal-backdrop" id="modal-admin-social-blast" style="display: none; align-items: center; justify-content: center; z-index: 3100;">
    <div class="modal-dialog" style="max-width: 600px; width: 94%; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); background: #ffffff;">
      <div class="modal-header" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: white; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(45deg, #f09433, #dc2743, #1877f2); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white;">
            <i class="fas fa-bullhorn"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: white;">Admin Social Blast Suite</h3>
            <div id="admin-blast-prop-title" style="font-size: 0.76rem; color: #94a3b8; max-width: 380px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Property Marketing</div>
          </div>
        </div>
        <button type="button" class="modal-close-btn" style="color: white; font-size: 1.6rem; background: none; border: none; cursor: pointer;" onclick="kejaSocial.closeAdminBlast()">&times;</button>
      </div>

      <!-- Social Tabs (WhatsApp | Instagram | Facebook | TikTok) -->
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 10px; overflow-x: auto;">
        <button type="button" class="admin-social-tab-btn active" data-tab="whatsapp" onclick="kejaSocial.switchBlastTab('whatsapp')">
          <i class="fab fa-whatsapp" style="color: #25d366; font-size: 1.1rem;"></i> WhatsApp
        </button>
        <button type="button" class="admin-social-tab-btn" data-tab="instagram" onclick="kejaSocial.switchBlastTab('instagram')">
          <i class="fab fa-instagram" style="color: #e1306c; font-size: 1.1rem;"></i> Instagram
        </button>
        <button type="button" class="admin-social-tab-btn" data-tab="facebook" onclick="kejaSocial.switchBlastTab('facebook')">
          <i class="fab fa-facebook-f" style="color: #1877f2; font-size: 1.05rem;"></i> Facebook
        </button>
        <button type="button" class="admin-social-tab-btn" data-tab="tiktok" onclick="kejaSocial.switchBlastTab('tiktok')">
          <i class="fab fa-tiktok" style="color: #0f172a; font-size: 1.05rem;"></i> TikTok
        </button>
      </div>

      <div class="modal-body" style="padding: 18px 20px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">
          <i class="fas fa-edit"></i> Formatted Marketing Copy (Editable)
        </div>
        <textarea id="admin-blast-text-box" style="width: 100%; height: 180px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.85rem; color: #0f172a; resize: vertical; line-height: 1.5; outline: none;"></textarea>

        <div id="admin-blast-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px;">
          <!-- Populated dynamically via switchBlastTab() -->
        </div>
      </div>
    </div>
  </div>`;

if (oldModalRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldModalRegex, newAdminBlastModal);
} else if (!indexHtml.includes('modal-admin-social-blast')) {
  indexHtml = indexHtml.replace(
    '<!-- Floating Social Connect Widget',
    newAdminBlastModal + '\n\n  <!-- Floating Social Connect Widget'
  );
}

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✅ Updated index.html with Admin Social Blast Modal');

// 5. Update js/admin-properties.js to add Social Blast button in Admin Table
const adminPropPath = path.join(rootDir, 'js', 'admin-properties.js');
if (fs.existsSync(adminPropPath)) {
  let adminProp = fs.readFileSync(adminPropPath, 'utf8');
  if (!adminProp.includes('AdminProperties.openSocialBlast')) {
    adminProp = adminProp.replace(
      `<button class="btn-icon" onclick="AdminProperties.viewPropertyDetail('\${property.id}')" title="View Details">`,
      `<button class="btn-icon" style="background: #fdf2f8; color: #db2777; border-color: #fbcfe8;" onclick="AdminProperties.openSocialBlast('\${property.id}')" title="Social Blast (WhatsApp, Instagram, FB, TikTok)"><i class="fas fa-bullhorn"></i></button>\n                    <button class="btn-icon" onclick="AdminProperties.viewPropertyDetail('\${property.id}')" title="View Details">`
    );

    const blastMethod = `
  function openSocialBlast(propertyId) {
    const prop = currentProperties.find(p => p.id === propertyId);
    if (!prop) return;
    if (window.kejaSocial && typeof window.kejaSocial.openAdminBlast === 'function') {
      window.kejaSocial.openAdminBlast(prop, 'whatsapp');
    } else if (window.app && typeof window.app.openAdminSocialBlast === 'function') {
      window.app.openAdminSocialBlast(propertyId, 'whatsapp');
    }
  }
`;
    adminProp = adminProp.replace('return {', blastMethod + '\n  return {\n    openSocialBlast,');
    fs.writeFileSync(adminPropPath, adminProp, 'utf8');
    console.log('✅ Updated js/admin-properties.js with openSocialBlast');
  }
}

console.log('🚀 All updates applied successfully!');
