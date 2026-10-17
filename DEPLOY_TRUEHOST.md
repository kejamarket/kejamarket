# TrueHost Deployment Guide for KejaMarket

## 🇰🇪 TrueHost Kenya - Deployment Instructions

TrueHost uses cPanel with Node.js support. Follow these steps:

---

## Method 1: cPanel Terminal (Recommended) ⭐

### Step 1: Login to cPanel
1. Go to: https://cpanel.truehost.cloud (or your cPanel URL)
2. Login with your TrueHost credentials
3. Find and click **"Terminal"** icon

### Step 2: Navigate to Your App Directory
```bash
# Find your app directory (usually one of these):
cd ~/kejamarket
# OR
cd ~/public_html/kejamarket
# OR
cd ~/nodevenv/kejamarket
# OR
ls -la  # List directories to find it
```

### Step 3: Pull Latest Code
```bash
git pull origin main
```

### Step 4: Restart Node.js Application
```bash
# Go back to cPanel interface
# Click "Setup Node.js App"
# Find your application
# Click "Restart" button
```

**OR if you have command line access:**
```bash
# Find the restart command from cPanel
touch tmp/restart.txt  # Common restart method
# OR
pkill -f "node.*server.js"  # Kill and it will auto-restart
```

---

## Method 2: cPanel File Manager + Git (No Terminal)

### Step 1: Login to cPanel
1. Go to your TrueHost cPanel
2. Click **"Git Version Control"** icon (or "Git™ Version Control")

### Step 2: Update Repository
1. Find your repository in the list
2. Click **"Manage"**
3. Click **"Pull or Deploy"** tab
4. Click **"Update from Remote"** button
5. Wait for success message

### Step 3: Restart Node.js App
1. Go back to cPanel home
2. Click **"Setup Node.js App"** icon
3. Find your kejamarket application
4. Click **"Restart"** button (circular arrow icon)
5. Wait for "Restarted successfully" message

---

## Method 3: FTP Upload (If Git Not Configured)

### Step 1: Download Updated Files
On your local machine, in the nai folder, these are the key files:
- `css/mobile-layout.css`
- `js/mobile-layout.js`
- `index.html`

### Step 2: Connect via FTP
1. Open FileZilla or any FTP client
2. Connect using:
   - **Host**: ftp.kejamarket.co.ke (or IP from TrueHost)
   - **Username**: Your cPanel username
   - **Password**: Your cPanel password
   - **Port**: 21

### Step 3: Upload Files
1. Navigate to: `/public_html/kejamarket` (or your app folder)
2. Upload these files (overwrite existing):
   - `css/mobile-layout.css` → upload to `css/` folder
   - `js/mobile-layout.js` → upload to `js/` folder
   - `index.html` → upload to root

### Step 4: Restart App
1. Login to cPanel
2. Go to "Setup Node.js App"
3. Click "Restart"

---

## Method 4: TrueHost SSH (If Enabled)

**Check if SSH is enabled in your TrueHost package:**

```bash
# Connect via SSH
ssh your-username@kejamarket.co.ke
# OR
ssh your-username@server-ip

# Navigate to app
cd ~/kejamarket

# Pull code
git pull origin main

# Install dependencies
npm install --production

# Restart (use one that works):
touch tmp/restart.txt
# OR
pkill -f node
# OR go to cPanel and restart from there
```

---

## Verification After Deployment

### 1. Check API is Working
Visit: https://kejamarket.co.ke/test-api.html

Should show:
```
✅ API WORKING!
Total properties: 132
Approved: 137
```

### 2. Check Desktop View
Visit: https://kejamarket.co.ke (on desktop/laptop)
- Should show desktop layout
- Properties should load (not "0 Properties")

### 3. Check Mobile View
Visit: https://kejamarket.co.ke (on phone OR resize browser to mobile width)
- Should show mobile layout
- See KejaMarket logo at top
- 8 category icons in 2 rows
- 2-column property grid
- Bottom navigation with 5 tabs

---

## TrueHost-Specific Settings

### Node.js App Configuration in cPanel

**Application Settings:**
- **Application Mode**: Production
- **Application Root**: kejamarket (or your folder name)
- **Application URL**: kejamarket.co.ke
- **Application Startup File**: server.js
- **Node.js Version**: 18.x or higher (recommended)

**Environment Variables** (if needed):
```
NODE_ENV=production
PORT=3001
```

### Common TrueHost Paths
- **App directory**: `~/kejamarket` or `~/nodevenv/kejamarket`
- **Public HTML**: `~/public_html`
- **Node modules**: `~/kejamarket/node_modules`
- **Logs**: `~/kejamarket/logs` or check cPanel error logs

---

## Troubleshooting TrueHost

### Issue: "Can't find git command"
**Solution**: Use cPanel Git Version Control interface instead of terminal

### Issue: "Permission denied" when running git
**Solution**: 
```bash
# Fix permissions
chmod 755 ~/kejamarket
cd ~/kejamarket
git config --global --add safe.directory ~/kejamarket
```

### Issue: Node.js app won't restart
**Solution**:
1. cPanel → Setup Node.js App
2. Click "Stop App" 
3. Wait 5 seconds
4. Click "Start App"
5. Check error log if it fails

### Issue: "0 Properties" still showing after deployment
**Solution 1 - Clear Browser Cache**:
- Press Ctrl+Shift+Delete
- Clear all cached files
- Hard refresh: Ctrl+Shift+R

**Solution 2 - Check File Upload**:
```bash
# Via cPanel Terminal
cd ~/kejamarket
ls -lh css/mobile-layout.css js/mobile-layout.js
# Should show recent timestamps
```

**Solution 3 - Verify Git Pull Worked**:
```bash
cd ~/kejamarket
git log -1 --oneline
# Should show: cb8afc2 docs: Add comprehensive deployment instructions
# OR: b3e5563 feat: EXACT mobile layout matching reference design
```

### Issue: 500 Internal Server Error
**Check error logs**:
1. cPanel → Errors
2. Look for recent errors
3. Common fixes:
   - Missing node_modules: Run `npm install --production`
   - Wrong Node.js version: Change in "Setup Node.js App"
   - Port conflict: Check Application Port setting

### Issue: Database not connected
**Check database settings**:
1. cPanel → phpMyAdmin or PostgreSQL
2. Verify database exists and has data
3. Check connection string in your .env file

---

## TrueHost Support Contact

If you encounter issues:
- **TrueHost Support**: https://truehost.cloud/support
- **Email**: support@truehost.co.ke  
- **Phone**: +254 20 528 0000
- **Live Chat**: Available on their website

**What to tell them**:
"I need help deploying my Node.js application. I've pushed new code to GitHub and need to pull it to my cPanel and restart the application."

---

## Quick Command Reference (TrueHost Terminal)

```bash
# Navigate to app
cd ~/kejamarket

# Check current version
git log -1 --oneline

# Pull latest code
git pull origin main

# Check file was updated
ls -lh css/mobile-layout.css

# View last 20 lines of log
tail -20 logs/combined.log

# Restart app (then use cPanel interface)
touch tmp/restart.txt
```

---

## Recommended: Setup Auto-Deploy (Optional)

**For future updates without manual deployment:**

1. cPanel → Git Version Control
2. Select your repository
3. Click "Manage"
4. Enable "Pull on Update"
5. Add webhook URL to GitHub repo settings

This way, every time you push to GitHub, TrueHost automatically pulls and updates!

---

**Ready to deploy? Use Method 1 (cPanel Terminal) or Method 2 (Git Version Control)! 🚀**
