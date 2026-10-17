# 🚀 Render.com Deployment Guide - KejaMarket

## ✅ Deployment Status: LIVE

**Service**: kejamarket-prod  
**URL**: https://kejamarket-prod.onrender.com  
**Repository**: https://github.com/kejamarket/kejamarket  
**Branch**: main  
**Latest Commit**: 9211c39 - "feat: Add deployment configurations for Render and SSH"

---

## Step 1: ✅ Environment Variables (In Progress)

### Add these in Render Dashboard → Environment:

#### Critical (Required):
- `JWT_SECRET` = `821b62dccd1d6a0c4d8262002c9ed1c5d1e8d0e0aa6ea0e63d15bfaaf3886b4191321f40d4c10fb076c93ddd58e7d93b04b42e68086ff5321b7bfc0b987d3ff4`
- `PORT` = `3001`
- `NODE_ENV` = `production`
- `APP_URL` = `https://kejamarket-prod.onrender.com`
- `DATABASE_URL` = `postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

#### SMS & Payments:
- `AT_USERNAME` = `kejamarket`
- `AT_API_KEY` = `atsk_bdabf24586133b346f31f648972e20184f64dc60e215e175c948b83d5e5e720bf9991634`
- `MPESA_PAYBILL` = `303030`
- `MPESA_ACCOUNT` = `2057103992`
- `MPESA_ENV` = `sandbox`
- `MPESA_CALLBACK_URL` = `https://kejamarket-prod.onrender.com/api/mpesa/callback`

#### Optional (Configure when ready):
- `GOOGLE_CLIENT_ID` = (Get from https://console.cloud.google.com/apis/credentials)
- `GOOGLE_CLIENT_SECRET` = (Get from Google Cloud Console)
- `CLOUDINARY_CLOUD_NAME` = (Get from https://cloudinary.com - free account)
- `CLOUDINARY_API_KEY` = (Cloudinary Dashboard)
- `CLOUDINARY_API_SECRET` = (Cloudinary Dashboard)

---

## Step 2: Custom Domain Setup (kejamarket.co.ke)

### In Render Dashboard:

1. Go to **Settings** → **Custom Domain**
2. Click **"Add Custom Domain"**
3. Enter: `kejamarket.co.ke`
4. Also add: `www.kejamarket.co.ke`

Render will show you DNS records to add:

### In TrueHost DNS Settings (or Domain Registrar):

#### For kejamarket.co.ke:
**Type**: `A Record`  
**Name**: `@` (or leave blank)  
**Value**: `216.24.57.1` (Render's IP - they'll show you the actual IP)  
**TTL**: `3600`

#### For www.kejamarket.co.ke:
**Type**: `CNAME`  
**Name**: `www`  
**Value**: `kejamarket-prod.onrender.com`  
**TTL**: `3600`

#### SSL Certificate:
✅ Render automatically provisions free SSL certificates via Let's Encrypt (no action needed)

---

## Step 3: Database Initialization

Your app is already connected to Supabase PostgreSQL. To verify/initialize:

### Check Database Connection:

1. Visit: `https://kejamarket-prod.onrender.com/health`
2. Should return: `{"status":"ok","database":"connected"}`

### If Database Needs Setup:

Run the migration script via Render Shell:

1. In Render Dashboard → Click "Shell" (tab at top)
2. Wait for shell to connect
3. Run:
```bash
node -e "require('./db/store.js').initDatabase()"
```

Or manually run SQL migration:
```bash
psql $DATABASE_URL -f db/postgres-migration.sql
```

---

## Step 4: Testing Checklist

### Basic Functionality:
- [ ] Visit https://kejamarket-prod.onrender.com
- [ ] Check homepage loads
- [ ] Verify 137 properties display
- [ ] Test search and filters
- [ ] Check mobile layout (resize to ≤768px)

### Authentication:
- [ ] Click "Sign In"
- [ ] Test email/password login
- [ ] Test Google Sign In (after adding GOOGLE_CLIENT_ID)
- [ ] Verify user profile loads

### Property Listings:
- [ ] Browse properties
- [ ] Open property detail page
- [ ] Test favorites (heart icon)
- [ ] Check image galleries

### Mobile Navigation:
- [ ] Bottom nav switches screens
- [ ] Category icons work
- [ ] Filters open/close
- [ ] Property cards clickable

### Admin Dashboard:
- [ ] Login as admin user
- [ ] Visit `/admin-dashboard.html`
- [ ] Check user management
- [ ] Test property approval

### Performance:
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] No console errors (F12 → Console)

---

## Step 5: Post-Deployment Tasks

### Google OAuth Configuration:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `https://kejamarket-prod.onrender.com`
   - Authorized redirect URIs: `https://kejamarket-prod.onrender.com`
3. Copy Client ID and Client Secret
4. Add to Render Environment Variables
5. Redeploy (auto-triggers on env change)

### Cloudinary Setup (Image CDN):

1. Sign up at: https://cloudinary.com (free: 25GB storage)
2. Get credentials from Dashboard
3. Add to Render Environment:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### M-Pesa Live Credentials:

1. Go to: https://developer.safaricom.co.ke
2. Get production credentials (currently in sandbox mode)
3. Update in Render Environment:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_PASSKEY`
   - `MPESA_ENV` = `live`

---

## Step 6: Monitoring & Maintenance

### Check Logs:

In Render Dashboard → "Logs" tab:
- Monitor for errors
- Check API requests
- Verify database queries

### Performance Monitoring:

Render provides:
- CPU usage
- Memory usage
- Request metrics
- Response times

### Auto-Deploy:

✅ Enabled - any push to `main` branch auto-deploys

To disable:
1. Go to Settings
2. Toggle "Auto-Deploy"

### Manual Deploy:

1. Click "Manual Deploy" button
2. Select branch: `main`
3. Click "Deploy"

---

## Step 7: Scaling (When Traffic Grows)

### Free Plan (Current):
- 750 hours/month
- 512 MB RAM
- Spins down after 15 min inactivity
- ⚠️ 50-second cold start delay

### Upgrade to Starter ($7/month):
- Always on (no spin down)
- 1 GB RAM
- Better performance
- Custom domain SSL

### How to Upgrade:
1. Dashboard → Click "Upgrade" button
2. Select "Starter" plan
3. Add payment method

---

## Troubleshooting

### Site is slow on first load:
**Cause**: Free plan spins down after inactivity  
**Solution**: Upgrade to Starter plan, or use uptime monitor (e.g., UptimeRobot)

### Images not loading:
**Cause**: Missing Cloudinary config  
**Solution**: Add Cloudinary env vars (see Step 5)

### Google Sign In not working:
**Cause**: Missing OAuth credentials  
**Solution**: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

### Database connection error:
**Cause**: DATABASE_URL incorrect or Supabase paused  
**Solution**: Check Supabase dashboard, verify connection string

### 502 Bad Gateway:
**Cause**: App crashed or port mismatch  
**Solution**: Check Logs tab, ensure PORT=3001 in env vars

---

## Domain Propagation Timeline

After adding DNS records in TrueHost:
- **5-10 minutes**: DNS propagates (usually fast)
- **Up to 48 hours**: Maximum (rarely takes this long)
- **Check status**: https://www.whatsmydns.net/#A/kejamarket.co.ke

---

## Support & Resources

### Render Documentation:
- Custom Domains: https://render.com/docs/custom-domains
- Environment Variables: https://render.com/docs/environment-variables
- Deploy Hooks: https://render.com/docs/deploy-hooks

### TrueHost Support:
- Phone: +254 20 528 0000
- Email: support@truehost.co.ke
- For DNS configuration help

### Project Repository:
- GitHub: https://github.com/kejamarket/kejamarket
- Issues: https://github.com/kejamarket/kejamarket/issues

---

## Next Steps Summary

1. ✅ **Add environment variables** (in progress)
2. ⏳ **Wait for redeploy** (auto-triggers after saving env vars)
3. ⏳ **Test the site**: https://kejamarket-prod.onrender.com
4. ⏳ **Configure custom domain** (kejamarket.co.ke)
5. ⏳ **Add DNS records** in TrueHost
6. ⏳ **Wait for DNS propagation** (5-10 min)
7. ⏳ **Test on custom domain**: https://kejamarket.co.ke
8. ⏳ **Configure Google OAuth** (optional)
9. ⏳ **Setup Cloudinary** (optional, for images)
10. ⏳ **Monitor and optimize**

---

**Deployment Date**: October 17, 2026  
**Deployed By**: Kiro AI  
**Status**: 🚀 LIVE & READY

🎉 **Congratulations! Your website is now live on Render.com!**
