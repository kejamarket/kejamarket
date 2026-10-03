# 🌐 Custom Domain Setup for KejaMarket.co.ke

**Current Live URL**: https://kejamarket.onrender.com ✅  
**Target Custom Domain**: https://kejamarket.co.ke  
**Status**: Ready for DNS configuration  

---

## 📋 DOMAIN CONFIGURATION STEPS

### Step 1: Render.com Domain Setup

1. **Login to Render Dashboard**:
   - Go to https://render.com/dashboard
   - Select your KejaMarket web service

2. **Add Custom Domain**:
   - Navigate to **Settings** → **Custom Domains**
   - Click **"Add Custom Domain"**
   - Enter: `kejamarket.co.ke`
   - Click **"Save"**

3. **Add WWW Subdomain** (Recommended):
   - Click **"Add Custom Domain"** again
   - Enter: `www.kejamarket.co.ke`
   - Click **"Save"**

4. **Note the CNAME Target**:
   - Render will provide a target like: `kejamarket-xxxx.onrender.com`
   - Copy this exact value for DNS configuration

---

## 🔧 DNS CONFIGURATION

### Required DNS Records:

```dns
# For Root Domain (kejamarket.co.ke)
Type: CNAME
Name: @
Value: kejamarket-xxxx.onrender.com
TTL: 300

# For WWW Subdomain (www.kejamarket.co.ke)
Type: CNAME  
Name: www
Value: kejamarket-xxxx.onrender.com
TTL: 300
```

### DNS Provider Instructions:

#### Option 1: Cloudflare (Recommended)
1. Login to Cloudflare dashboard
2. Select kejamarket.co.ke domain
3. Go to **DNS** → **Records**
4. Add CNAME records as shown above
5. Set Proxy Status to **"DNS Only"** (gray cloud) initially
6. After SSL verification, can enable **"Proxied"** (orange cloud)

#### Option 2: Namecheap
1. Login to Namecheap account
2. Go to **Domain List** → **Manage** kejamarket.co.ke
3. Navigate to **Advanced DNS**
4. Add CNAME records as specified above
5. Remove any conflicting A records for @ and www

#### Option 3: GoDaddy
1. Login to GoDaddy DNS Management
2. Select kejamarket.co.ke domain
3. Add CNAME records with values above
4. Delete default A records if they conflict

---

## 🔐 SSL Certificate Setup

### Automatic SSL (Render handles this):
- **Certificate Generation**: Automatic via Let's Encrypt
- **Renewal**: Auto-renewed every 90 days
- **HTTPS Redirect**: Automatic HTTP → HTTPS redirect
- **Verification Time**: 5-15 minutes after DNS propagation

### SSL Verification Process:
1. DNS records propagate (2-48 hours)
2. Render detects domain ownership
3. Let's Encrypt certificate generated automatically  
4. HTTPS becomes available
5. HTTP traffic redirects to HTTPS

---

## ⏱️ PROPAGATION TIMELINE

### Expected Timeframes:
- **DNS Propagation**: 2-48 hours (typically 2-6 hours)
- **SSL Certificate**: 5-15 minutes after DNS propagation
- **Full Functionality**: Within 24 hours maximum

### Testing Propagation:
```bash
# Check DNS propagation
nslookup kejamarket.co.ke
dig kejamarket.co.ke

# Test different global locations
https://www.whatsmydns.net/#CNAME/kejamarket.co.ke
```

---

## 🧪 TESTING CHECKLIST

### Once DNS Propagates:

#### ✅ Basic Connectivity:
- [ ] https://kejamarket.co.ke loads homepage
- [ ] https://www.kejamarket.co.ke redirects properly
- [ ] SSL certificate shows as valid (green lock)
- [ ] HTTP redirects to HTTPS automatically

#### ✅ Application Features:
- [ ] Property search works
- [ ] Admin dashboard accessible: https://kejamarket.co.ke/admin-dashboard.html
- [ ] API endpoints respond: https://kejamarket.co.ke/api/health
- [ ] Mobile layout functions correctly
- [ ] Image loading from Cloudinary

#### ✅ Performance:
- [ ] Page load times under 3 seconds
- [ ] Desktop layout displays correctly
- [ ] Mobile responsiveness maintained
- [ ] Database queries respond quickly

---

## 🔄 REDIRECT CONFIGURATION

### Render Auto-Redirects:
```
http://kejamarket.co.ke → https://kejamarket.co.ke ✅
http://www.kejamarket.co.ke → https://www.kejamarket.co.ke ✅  
www.kejamarket.co.ke → kejamarket.co.ke (optional)
```

### Custom Redirects (if needed):
- Configure in Render dashboard under **Redirects/Rewrites**
- Example: www → non-www or vice versa
- All HTTP traffic automatically redirects to HTTPS

---

## 📊 MONITORING & ANALYTICS

### Domain Health Monitoring:
1. **Uptime Monitoring**: 
   - Use Render's built-in monitoring
   - Consider external services like UptimeRobot

2. **SSL Certificate Monitoring**:
   - Automatic Let's Encrypt renewal
   - 30-day expiration warnings (automated)

3. **Performance Monitoring**:
   - Google PageSpeed Insights
   - GTmetrix performance testing
   - Render dashboard metrics

---

## 🔍 TROUBLESHOOTING

### Common Issues & Solutions:

#### 🚨 "Domain Not Found" Error:
- **Cause**: DNS not propagated yet
- **Solution**: Wait 2-24 hours, check DNS propagation tools

#### 🚨 "SSL Certificate Error":
- **Cause**: Certificate generation in progress
- **Solution**: Wait 15 minutes after DNS propagation

#### 🚨 "Site Not Secure" Warning:
- **Cause**: Mixed content (HTTP resources on HTTPS page)
- **Solution**: Update all URLs to HTTPS in application

#### 🚨 "Domain Mismatch" Error:
- **Cause**: CNAME pointing to wrong target
- **Solution**: Verify CNAME value matches Render's target

#### 🚨 Slow Loading:
- **Cause**: DNS TTL too high or CDN issues
- **Solution**: Lower TTL to 300, check Cloudinary status

---

## 📧 EMAIL CONFIGURATION (Optional)

### Professional Email Setup:
```
# MX Records for kejamarket.co.ke email
Priority 10: mail.kejamarket.co.ke
Priority 20: mail2.kejamarket.co.ke

# Or use Google Workspace:
Priority 1: aspmx.l.google.com
Priority 5: alt1.aspmx.l.google.com
Priority 5: alt2.aspmx.l.google.com
Priority 10: alt3.aspmx.l.google.com  
Priority 10: alt4.aspmx.l.google.com
```

### Email Integration with App:
- Update SMTP settings in environment variables
- Configure support@kejamarket.co.ke for system emails
- Set up admin@kejamarket.co.ke for notifications

---

## 🎯 POST-DOMAIN LAUNCH CHECKLIST

### ✅ Technical Updates:
- [ ] Update all internal links to use kejamarket.co.ke
- [ ] Update social media profiles with new URL
- [ ] Submit new sitemap to Google Search Console
- [ ] Update Google Analytics property URL
- [ ] Configure Facebook/Twitter meta tags with new domain

### ✅ Business Updates:
- [ ] Update marketing materials with kejamarket.co.ke
- [ ] Notify existing users of domain change
- [ ] Update business cards and printed materials
- [ ] Configure email signatures with new domain
- [ ] Update app store listings (if applicable)

### ✅ SEO Migration:
- [ ] Set up 301 redirects from old URLs (if any)
- [ ] Update Google Search Console property
- [ ] Submit updated sitemap
- [ ] Monitor search rankings during transition
- [ ] Update backlink sources with new domain

---

## 🔗 IMPORTANT URLS AFTER DOMAIN SETUP

### Public URLs:
- **Homepage**: https://kejamarket.co.ke
- **Admin Dashboard**: https://kejamarket.co.ke/admin-dashboard.html
- **API Health**: https://kejamarket.co.ke/api/health
- **Privacy Policy**: https://kejamarket.co.ke/privacy-policy.html
- **Terms of Service**: https://kejamarket.co.ke/terms.html

### Admin Access:
- **Username**: admin@kejamarket.co.ke
- **Password**: Stallon@jevugwe4
- **Dashboard**: https://kejamarket.co.ke/admin-dashboard.html

---

## 📱 SOCIAL MEDIA UPDATE TEMPLATE

### Announcement Post:
```
🎉 Big News! KejaMarket is now live at our official domain!

🏠 Find verified rental properties in Nairobi
📱 Professional desktop & mobile experience  
🔒 Secure, fast, and user-friendly
✨ 312+ properties ready to view

Visit us at: https://kejamarket.co.ke

#KejaMarket #NairobiRentals #PropertySearch #Kenya #RealEstate
```

---

## ✅ FINAL DOMAIN STATUS

### Ready for Configuration:
- **Application**: Live and fully functional ✅
- **Database**: 132 properties + complete user system ✅
- **SSL Ready**: Automatic certificate generation ✅  
- **Performance**: Optimized for production traffic ✅
- **Mobile**: Fully responsive design ✅

### Required Actions:
1. **DNS Configuration**: Add CNAME records to domain provider
2. **Domain Addition**: Add kejamarket.co.ke in Render dashboard
3. **Propagation Wait**: 2-48 hours for global DNS updates
4. **Testing**: Verify all functionality on custom domain
5. **Go Live**: Update marketing and social media

---

## 🏆 SUCCESS METRICS

### Post-Domain Launch Goals:
- **✅ SSL Certificate**: Valid and trusted
- **✅ Load Time**: Under 3 seconds globally
- **✅ Uptime**: 99.9% availability
- **✅ SEO Ready**: Proper meta tags and sitemap
- **✅ Mobile Optimized**: Perfect responsive design
- **✅ User Experience**: Seamless property search

**🌟 KejaMarket will be fully branded and ready for Kenya's rental market!**

---

**Domain Configuration Guide Created**: September 8, 2026  
**Current Status**: Ready for DNS setup  
**Timeline**: 24-48 hours to full custom domain functionality  
**Next Step**: Configure DNS records with domain provider 🚀