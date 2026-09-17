const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(appPath, 'utf8');

if (!content.includes('isAdminUser()')) {
  const methods = `
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

    // Regular tenant/visitor: Open direct WhatsApp with caretaker or KejaMarket WhatsApp 0792409540
    const rawPhone = (p.caretakerPhone || p.landlord?.whatsapp || p.landlord?.phone || '0792409540').replace(/\\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1) : (rawPhone.startsWith('254') ? rawPhone : '254' + rawPhone);
    const text = encodeURIComponent('Hello KejaMarket, I am inquiring about "' + p.title + '" [ID: ' + p.id + '] listed on kejamarket.co.ke. Is it vacant for viewing?');
    window.open('https://wa.me/' + cleanPhone + '?text=' + text, '_blank');
  }

  handleCardInstagram(propertyId, event) {
    if (event) event.stopPropagation();
    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'instagram');
      return;
    }
    // Tenant / Regular visitor / Landlord: Open official @kejamarket profile
    window.open('https://instagram.com/kejamarket', '_blank');
  }

  handleCardFacebook(propertyId, event) {
    if (event) event.stopPropagation();
    if (this.isAdminUser()) {
      this.openAdminSocialBlast(propertyId, 'facebook');
      return;
    }
    // Tenant / Regular visitor / Landlord: Open KejaMarket Facebook page
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

  content = content.replace('  updateHeaderPostAdButtons() {', methods + '\n  updateHeaderPostAdButtons() {');
  fs.writeFileSync(appPath, content, 'utf8');
  console.log('✅ Added methods to NairobiRentalsApp');
} else {
  console.log('ℹ️ Methods already present');
}
