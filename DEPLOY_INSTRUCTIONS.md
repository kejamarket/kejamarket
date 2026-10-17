# Production Deployment Instructions for KejaMarket

## Current Status
✅ **Code is ready on GitHub**
- Repository: https://github.com/kejamarket/kejamarket.git
- Latest commit: `b3e5563` - "EXACT mobile layout matching reference design"
- All 8 mobile screens implemented
- 137 properties in database
- Desktop layout untouched

---

## Deployment Methods

### Method 1: SSH Access (Recommended)

**Step 1: Connect to your server**
```bash
ssh your-username@kejamarket.co.ke
# OR
ssh your-username@your-server-ip
```

**Step 2: Navigate to project directory**
```bash
cd /var/www/kejamarket
# OR
cd /home/ubuntu/kejamarket
# OR wherever your project is located
```

**Step 3: Pull latest code**
```bash
git pull origin main
```

**Step 4: Install dependencies (if needed)**
```bash
npm install --production
```

**Step 5: Restart the application**

Choose one based on your setup:

**If using PM2:**
```bash
pm2 restart kejamarket
pm2 save
pm2 status
```

**If using systemctl:**
```bash
sudo systemctl restart kejamarket
sudo systemctl status kejamarket
```

**If using Docker:**
```bash
docker-compose restart
docker-compose ps
```

**If manual node process:**
```bash
# Find the process
ps aux | grep node
# Kill it
kill <process-id>
# Start again
npm start
```

---

### Method 2: Automated Script

**Copy `DEPLOY_NOW.sh` to your server and run:**
```bash
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```

---

### Method 3: Git Hosting Panel

**If your host has Git deployment (Heroku, Vercel, Netlify, Railway, etc.):**

1. Go to your hosting dashboard
2. Find "Deploy" or "Git" section
3. Click "Deploy from GitHub"
4. Select branch: `main`
5. Click "Deploy Now"

**Common platforms:**
- **Heroku**: Dashboard → App → Deploy tab → "Deploy Branch"
- **Vercel**: Dashboard → Project → Deployments → "Redeploy"
- **Railway**: Dashboard → Service → Settings → "Deploy"
- **DigitalOcean App Platform**: Apps → kejamarket → "Deploy"

---

### Method 4: cPanel or Plesk

**If using cPanel:**
1. Login to cPanel
2. Go to "Terminal" or "SSH Access"
3. Navigate to public_html or your app folder
4. Run: `git pull origin main`
5. Restart Node.js app from "Setup Node.js App" section

**If using Plesk:**
1. Login to Plesk
2. Go to "Git" section
3. Click "Pull Updates"
4. Go to "Node.js" section
5. Click "Restart App"

---

### Method 5: FTP Upload (Last Resort)

**Only if Git is not available:**

1. Download these files from your local machine:
   - `css/mobile-layout.css`
   - `js/mobile-layout.js`
   - `index.html` (updated cache versions)

2. Upload via FTP to production:
   - Connect to kejamarket.co.ke via FileZilla/WinSCP
   - Navigate to public_html or www folder
   - Upload the files (overwrite existing)

3. Clear server cache if applicable

---

## Verification After Deployment

### Check 1: Properties Loading
Visit: https://kejamarket.co.ke/test-api.html
- Should show: "✅ API WORKING! Total properties: 132"

### Check 2: Desktop View
Visit: https://kejamarket.co.ke (on desktop)
- Should display desktop layout normally
- Properties should load (not "0 Properties")

### Check 3: Mobile View
Visit: https://kejamarket.co.ke (on mobile or resize browser ≤768px)
- Should show mobile layout with 8 screens:
  1. Home (hero + 8 categories + featured listings)
  2. Browse (2-column grid)
  3. Property Detail (gallery + green price + CTA)
  4. Filters (overlay panel)
  5. Profile (user menu)
  6. Rentals (browse layout)
  7. Land (browse layout)
  8. Used Items (browse layout)
- Bottom nav: 5 tabs (Home, Search, Favorites, Messages, Profile)

---

## Troubleshooting

### Issue: "0 Properties" still showing

**Solution 1: Clear Browser Cache**
- Press Ctrl+Shift+Delete
- Clear cache and cookies
- Hard refresh: Ctrl+Shift+R

**Solution 2: Server-side cache**
```bash
# If using Redis
redis-cli FLUSHALL

# If using file cache
rm -rf tmp/cache/*
```

**Solution 3: Check API**
```bash
curl https://kejamarket.co.ke/api/properties | jq '.properties | length'
# Should return: 132
```

### Issue: Mobile layout not showing

**Check 1: Files uploaded?**
```bash
ls -lh css/mobile-layout.css js/mobile-layout.js
# Both files should exist and be recent
```

**Check 2: Cache versions updated?**
Open index.html and verify:
```html
<link rel="stylesheet" href="css/mobile-layout.css?v=2.0&t=202610090400">
<script src="js/mobile-layout.js?v=2.0&t=202610090400" defer></script>
```

**Check 3: CDN cache**
If using Cloudflare or similar:
- Login to CDN dashboard
- Find "Purge Cache" button
- Purge all files

### Issue: Server won't restart

**Check logs:**
```bash
# PM2 logs
pm2 logs kejamarket --lines 50

# systemctl logs
sudo journalctl -u kejamarket -n 50

# Docker logs
docker-compose logs --tail=50

# Node error logs
tail -50 /var/log/kejamarket/error.log
```

### Issue: Port conflict

**Check if port 3001 is in use:**
```bash
netstat -tulpn | grep 3001
# OR
lsof -i :3001
```

**Kill the process if needed:**
```bash
kill -9 <PID>
```

---

## Environment Variables

Make sure these are set on production (if using .env):

```bash
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...  # or your DB connection
SESSION_SECRET=your-secret-here
```

---

## Rollback (If Something Goes Wrong)

```bash
# View commit history
git log --oneline -10

# Rollback to previous version
git reset --hard 08ae4ea  # or any previous commit hash

# Restart
pm2 restart kejamarket  # or your restart command
```

---

## Support Contact

If deployment fails, provide this info:
1. Hosting provider (DigitalOcean, AWS, Heroku, shared hosting, etc.)
2. Error messages from logs
3. Screenshot of what you see
4. Output of: `git log -1 --oneline`

---

## Quick Commands Reference

```bash
# Check current commit
git log -1 --oneline

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart PM2
pm2 restart kejamarket && pm2 save

# Check status
pm2 status
# OR
sudo systemctl status kejamarket
# OR
docker-compose ps

# View logs
pm2 logs kejamarket --lines 30
# OR
sudo journalctl -u kejamarket -n 30
# OR
docker-compose logs --tail=30

# Test API
curl https://kejamarket.co.ke/api/properties | head -100
```

---

**Ready to deploy? Run the commands for your hosting setup above! 🚀**
