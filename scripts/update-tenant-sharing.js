const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update css/style.css
const cssPath = path.join(rootDir, 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const tiktokStyle = `
.btn-card-tiktok {
  width: 28px;
  height: 30px;
  background: #0f172a;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(15,23,42,0.25);
}
.btn-card-tiktok:hover {
  background: #000000;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.35);
}
`;

if (!css.includes('.btn-card-tiktok')) {
  css += '\n' + tiktokStyle;
}

// Adjust button dimensions to 28px x 30px so all 4 icons fit neatly
css = css.replace(/\.btn-card-whatsapp\s*\{[^}]+\}/, `.btn-card-whatsapp {
  width: 28px;
  height: 30px;
  background: #ffffff;
  border: 1px solid #25d366;
  border-radius: 6px;
  color: #25d366;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}`);

css = css.replace(/\.btn-card-instagram\s*\{[^}]+\}/, `.btn-card-instagram {
  width: 28px;
  height: 30px;
  background: linear-gradient(45deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(220,39,67,0.25);
}`);

css = css.replace(/\.btn-card-facebook\s*\{[^}]+\}/, `.btn-card-facebook {
  width: 28px;
  height: 30px;
  background: #1877f2;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(24,119,242,0.25);
}`);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ Updated css/style.css with compact social buttons');

// 2. Update js/app.js: Update card markup to include WhatsApp, Instagram, Facebook, TikTok
const appPath = path.join(rootDir, 'js', 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

const updatedCardRow = `<div class="card-actions-row" style="display: flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 6px;">
            <button type="button" class="btn-card-details-green" onclick="app.openPropertyDetail('\${p.id}')">
              View Details
            </button>
            <button type="button" class="btn-card-whatsapp" onclick="app.handleCardWhatsApp('\${p.id}', event)" title="Share to WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </button>
            <button type="button" class="btn-card-instagram" onclick="app.handleCardInstagram('\${p.id}', event)" title="Share to Instagram">
              <i class="fab fa-instagram"></i>
            </button>
            <button type="button" class="btn-card-facebook" onclick="app.handleCardFacebook('\${p.id}', event)" title="Share to Facebook">
              <i class="fab fa-facebook-f"></i>
            </button>
            <button type="button" class="btn-card-tiktok" onclick="app.handleCardTikTok('\${p.id}', event)" title="Share to TikTok">
              <i class="fab fa-tiktok"></i>
            </button>
          </div>`;

appJs = appJs.replace(/<div class="card-actions-row"[\s\S]*?<\/div>/, updatedCardRow);

// Add/update methods in appJs
const tenantSocialMethods = `
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

    // Tenant 1-Tap Share to WhatsApp
    const rent = Number(p.rentKes || p.price || 0).toLocaleString();
    const loc = p.estateSuburb || p.locationDisplay || 'Nairobi';
    const link = 'https://kejamarket.co.ke?prop=' + p.id;
    const text = '🏠 *Vacant House on KejaMarket*\\n' + p.title + '\\n💰 *Rent:* KSh ' + rent + '/month\\n📍 *Location:* ' + loc + '\\n🔗 *View Photos & Caretaker:* ' + link;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  }

  handleCardInstagram(propertyId, event) {
    if (event) event.stopPropagation();
    const p = (this.properties || []).find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'instagram');
      return;
    }

    // Tenant 1-Tap Share to Instagram
    const rent = Number(p.rentKes || p.price || 0).toLocaleString();
    const loc = p.estateSuburb || p.locationDisplay || 'Nairobi';
    const cleanSub = loc.split('(')[0].trim().replace(/\\s+/g, '').toLowerCase();
    const caption = '🏠 ' + p.title + '\\n💰 Rent: KSh ' + rent + '/month\\n📍 Location: ' + (p.exactLocation || loc) + '\\n🔗 Search ID ' + p.id + ' on kejamarket.co.ke\\n\\n#kejamarket #rentalskenya #' + cleanSub + 'apartments #nairobihousehunting';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(caption).then(() => {
        if (typeof this.showToast === 'function') {
          this.showToast('✅ Caption & link copied! Opening Instagram to share...', 'success');
        }
        setTimeout(() => window.open('https://instagram.com/kejamarket', '_blank'), 300);
      }).catch(() => {
        window.open('https://instagram.com/kejamarket', '_blank');
      });
    } else {
      window.open('https://instagram.com/kejamarket', '_blank');
    }
  }

  handleCardFacebook(propertyId, event) {
    if (event) event.stopPropagation();
    const p = (this.properties || []).find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'facebook');
      return;
    }

    // Tenant 1-Tap Share to Facebook
    const link = 'https://kejamarket.co.ke?prop=' + p.id;
    const quote = '🏠 ' + p.title + ' - KSh ' + Number(p.rentKes || p.price || 0).toLocaleString() + '/month in ' + (p.estateSuburb || 'Nairobi');
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link) + '&quote=' + encodeURIComponent(quote), '_blank');
  }

  handleCardTikTok(propertyId, event) {
    if (event) event.stopPropagation();
    const p = (this.properties || []).find(x => x.id === propertyId) || this.selectedPropertyForDetail;
    if (!p) return;

    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'tiktok');
      return;
    }

    // Tenant 1-Tap Share to TikTok
    const rent = Number(p.rentKes || p.price || 0).toLocaleString();
    const loc = p.estateSuburb || p.locationDisplay || 'Nairobi';
    const tiktokText = '🔥 Check out this house in ' + loc + '! ' + p.title + ' - KSh ' + rent + '/month. Search ID ' + p.id + ' on kejamarket.co.ke #kejamarket #housetour #nairobitiktok #fyp';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tiktokText).then(() => {
        if (typeof this.showToast === 'function') {
          this.showToast('✅ TikTok caption copied! Opening TikTok to share...', 'success');
        }
        setTimeout(() => window.open('https://tiktok.com/@kejamarket', '_blank'), 300);
      }).catch(() => {
        window.open('https://tiktok.com/@kejamarket', '_blank');
      });
    } else {
      window.open('https://tiktok.com/@kejamarket', '_blank');
    }
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

// Replace existing social handlers or insert
if (appJs.includes('handleCardTikTok')) {
  // Already has it, do regex replace
  appJs = appJs.replace(/isAdminUser\(\)[\s\S]*?openAdminSocialBlast\([\s\S]*?\}\n  \}/, tenantSocialMethods.trim());
} else if (appJs.includes('isAdminUser()')) {
  // Replace the old block with tenantSocialMethods
  const startIdx = appJs.indexOf('isAdminUser()');
  const endIdx = appJs.indexOf('  updateHeaderPostAdButtons()');
  if (startIdx !== -1 && endIdx !== -1) {
    appJs = appJs.slice(0, startIdx) + tenantSocialMethods.trim() + '\n\n' + appJs.slice(endIdx);
  }
} else {
  appJs = appJs.replace('  updateHeaderPostAdButtons() {', tenantSocialMethods + '\n  updateHeaderPostAdButtons() {');
}

fs.writeFileSync(appPath, appJs, 'utf8');
console.log('✅ Updated js/app.js with 1-tap tenant sharing for WhatsApp, TikTok, Facebook, Instagram');

// 3. Update index.html: Add 4-button social share toolbar to Property Details Modal
const indexHtmlPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const oldDetailShareBtn = `<button id="detail-btn-instagram-share" type="button" class="btn-secondary" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 8px; font-weight: 700; background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;" onclick="app.shareToInstagram(app.selectedPropertyForDetail && app.selectedPropertyForDetail.id, event)" title="Share / Post to Instagram @kejamarket">
                <i class="fab fa-instagram"></i> Instagram Share
              </button>`;

const newDetailShareToolbar = `<div class="detail-social-share-toolbar" style="display: flex; align-items: center; gap: 6px;">
                <button type="button" class="btn-secondary" style="padding: 10px 12px; font-size: 0.88rem; border-radius: 8px; font-weight: 700; background: #25d366; color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px;" onclick="app.handleCardWhatsApp(app.selectedPropertyForDetail && app.selectedPropertyForDetail.id, event)" title="Share to WhatsApp">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button type="button" class="btn-secondary" style="padding: 10px 12px; font-size: 0.88rem; border-radius: 8px; font-weight: 700; background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px;" onclick="app.handleCardInstagram(app.selectedPropertyForDetail && app.selectedPropertyForDetail.id, event)" title="Share to Instagram">
                  <i class="fab fa-instagram"></i> Instagram
                </button>
                <button type="button" class="btn-secondary" style="padding: 10px 12px; font-size: 0.88rem; border-radius: 8px; font-weight: 700; background: #1877f2; color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px;" onclick="app.handleCardFacebook(app.selectedPropertyForDetail && app.selectedPropertyForDetail.id, event)" title="Share to Facebook">
                  <i class="fab fa-facebook-f"></i> Facebook
                </button>
                <button type="button" class="btn-secondary" style="padding: 10px 12px; font-size: 0.88rem; border-radius: 8px; font-weight: 700; background: #0f172a; color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px;" onclick="app.handleCardTikTok(app.selectedPropertyForDetail && app.selectedPropertyForDetail.id, event)" title="Share to TikTok">
                  <i class="fab fa-tiktok"></i> TikTok
                </button>
              </div>`;

if (/<button id="detail-btn-instagram-share"[\s\S]*?<\/button>/.test(indexHtml)) {
  indexHtml = indexHtml.replace(/<button id="detail-btn-instagram-share"[\s\S]*?<\/button>/, newDetailShareToolbar);
  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
  console.log('✅ Updated index.html detail modal with full 4-platform sharing toolbar');
}

console.log('🚀 Tenant 1-tap sharing updates completed!');
