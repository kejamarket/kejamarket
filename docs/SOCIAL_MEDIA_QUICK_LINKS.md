# Social Media API - Quick Reference Links

## 🔗 Direct Links to Get Started

### Facebook
- **Create App:** https://developers.facebook.com/apps/create/
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
- **Access Token Debugger:** https://developers.facebook.com/tools/debug/accesstoken/
- **My Apps Dashboard:** https://developers.facebook.com/apps/

### Instagram
- **Requirements:** https://developers.facebook.com/docs/instagram-api/getting-started
- **Test Instagram API:** https://developers.facebook.com/tools/explorer/

### Twitter/X
- **Developer Portal:** https://developer.twitter.com/en/portal/dashboard
- **Apply for Developer Account:** https://developer.twitter.com/en/apply-for-access
- **API Documentation:** https://developer.twitter.com/en/docs/twitter-api

---

## 📋 Credentials Checklist

- [ ] **Facebook Page ID**
- [ ] **Facebook Page Access Token** (long-lived, 60 days)
- [ ] **Instagram Business Account ID**
- [ ] **Twitter API Key**
- [ ] **Twitter API Secret**
- [ ] **Twitter Access Token**
- [ ] **Twitter Access Secret**

---

## 🎯 What You Need Before Starting

### Facebook & Instagram
1. A **Facebook Page** for KejaMarket
2. An **Instagram Business Account** linked to that page
3. Admin access to both

### Twitter
1. A **Twitter/X account** for KejaMarket (@kejamarket)
2. Access to the account email for verification

---

## ⚡ Quick Test Commands

After adding credentials to `.env`, test with:

```bash
# Restart server
pm2 restart kejamarket

# Watch logs
pm2 logs kejamarket --lines 50

# Test by approving any listing in admin panel
# Look for: "📢 Auto-sharing property..."
```

---

## 🆘 Emergency Contacts

**Facebook Issues:**
- Developer Support: https://developers.facebook.com/support/

**Twitter Issues:**
- Developer Support: https://developer.twitter.com/en/support

**Instagram Issues:**
- Use Facebook Developer Support (Instagram API is part of Facebook Graph API)
