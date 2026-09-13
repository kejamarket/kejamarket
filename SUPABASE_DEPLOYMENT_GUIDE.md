# KejaMarket Supabase PostgreSQL Deployment Guide

## ✅ What's Been Completed

### 1. Supabase Setup
- ✅ Created Supabase account (FREE tier)
- ✅ Created project: `kejamarket-prod`
- ✅ Region: West EU (Ireland)
- ✅ Database URL: `postgresql://postgres:Stallon@jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres`

### 2. Database Migration
- ✅ All 15 tables created successfully:
  - users
  - properties
  - services
  - marketplace_items
  - transactions
  - messages
  - comments
  - property_media
  - property_reviews
  - service_reviews
  - favourites
  - leads
  - alerts
  - whatsapp_alert_subs
  - password_reset_tokens

### 3. Seed Data
- ✅ 21 verified property listings loaded
- ✅ All listings have images from Unsplash
- ✅ Cover all major Nairobi areas (Ruaka, Kilimani, Roysambu, Kasarani, etc.)

---

## 🚀 Deployment Steps

### Option 1: Deploy to Render.com (Recommended - FREE)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "feat: add Supabase PostgreSQL support"
   git push origin main
   ```

2. **Go to Render.com**:
   - Visit: https://render.com
   - Sign up/Login with GitHub

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `kejamarket` repo

4. **Configure Service**:
   ```
   Name: kejamarket-prod
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   ```

5. **Add Environment Variables** (Critical!):
   ```
   DATABASE_URL=postgresql://postgres:Stallon@jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres
   
   JWT_SECRET=821b62dccd1d6a0c4d8262002c9ed1c5d1e8d0e0aa6ea0e63d15bfaaf3886b4191321f40d4c10fb076c93ddd58e7d93b04b42e68086ff5321b7bfc0b987d3ff4
   
   AT_USERNAME=kejamarket
   AT_API_KEY=atsk_bdabf24586133b346f31f648972e20184f64dc60e215e175c948b83d5e5e720bf9991634
   
   MPESA_CONSUMER_KEY=YOUR_CONSUMER_KEY_HERE
   MPESA_CONSUMER_SECRET=YOUR_CONSUMER_SECRET_HERE
   MPESA_PASSKEY=YOUR_PASSKEY_HERE
   MPESA_PAYBILL=303030
   MPESA_ACCOUNT=2057103992
   MPESA_ENV=sandbox
   
   PORT=3001
   NODE_ENV=production
   ```

6. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your app will be live at: `https://kejamarket-prod.onrender.com`

---

### Option 2: Deploy to Railway.app (Also FREE)

1. **Visit Railway.app**:
   - https://railway.app
   - Sign in with GitHub

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `kejamarket` repository

3. **Add Environment Variables**:
   - Click on the service → "Variables" tab
   - Add all the environment variables from Option 1 above

4. **Deploy**:
   - Railway auto-deploys on git push
   - You'll get a URL like: `https://kejamarket-prod.up.railway.app`

---

### Option 3: Deploy to Your Own Domain (kejamarket.co.ke)

#### Prerequisites:
- VPS/Server (DigitalOcean, AWS EC2, Linode, etc.)
- Domain: kejamarket.co.ke already registered

#### Steps:

1. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js 20+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository**:
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_USERNAME/kejamarket.git
   cd kejamarket
   ```

4. **Create `.env` file**:
   ```bash
   nano .env
   ```
   Paste all environment variables (see Option 1 above)

5. **Install dependencies**:
   ```bash
   npm install
   ```

6. **Install PM2 (Process Manager)**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name kejamarket
   pm2 save
   pm2 startup
   ```

7. **Set up Nginx reverse proxy**:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/kejamarket
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name kejamarket.co.ke www.kejamarket.co.ke;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kejamarket /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d kejamarket.co.ke -d www.kejamarket.co.ke
   ```

9. **Update DNS**:
   - Go to your domain registrar
   - Point A record to your server IP:
     ```
     A    @    YOUR_SERVER_IP
     A    www  YOUR_SERVER_IP
     ```

10. **Done!** Your site is live at https://kejamarket.co.ke

---

## 🔐 Environment Variables Explained

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | Supabase PostgreSQL connection | ✅ YES |
| `JWT_SECRET` | Auth token encryption | ✅ YES |
| `AT_USERNAME` | Africa's Talking SMS account | ✅ YES |
| `AT_API_KEY` | SMS API key | ✅ YES |
| `MPESA_*` | M-Pesa Daraja API credentials | Optional (sandbox default) |
| `PORT` | Server port | Optional (defaults to 3001) |
| `NODE_ENV` | production/development | Optional |

---

## 📊 Supabase Dashboard Access

### View Your Data:
1. Go to: https://supabase.com/dashboard
2. Select project: `kejamarket-prod`
3. Click "Table Editor" (left sidebar)
4. Browse tables:
   - **properties** - See all 21 loaded listings
   - **users** - See registered users
   - **transactions** - See M-Pesa payments

### Run SQL Queries:
1. Click "SQL Editor" (left sidebar)
2. Example queries:

```sql
-- Count all verified properties
SELECT COUNT(*) FROM properties WHERE is_verified = true;

-- Get all properties in Ruaka
SELECT title, rent_kes, estate_suburb 
FROM properties 
WHERE estate_suburb LIKE '%Ruaka%';

-- Get total revenue
SELECT SUM(amount) FROM transactions WHERE status = 'completed';

-- Get recent users
SELECT name, phone, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🧪 Testing Your Deployment

### 1. Test API Health:
```bash
curl https://your-domain.com/api/status
```

### 2. Test Properties Endpoint:
```bash
curl https://your-domain.com/api/properties?limit=5
```

### 3. Test Admin Login:
- Email: `admin@kejamarket.co.ke`
- Password: `Stallon@jevugwe4`
- Phone: `0700000000`

### 4. Test Property Search:
```bash
curl "https://your-domain.com/api/properties?minPrice=10000&maxPrice=30000&suburb=Ruaka"
```

---

## 🔧 Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run migration again:
```bash
node run-migration.js
```

### Issue: "Connection refused"
**Solution**: Check if DATABASE_URL is set correctly:
```bash
echo $DATABASE_URL
```

### Issue: "No properties returned"
**Solution**: Load seed data:
```bash
node load-seed-data.js
```

### Issue: "Port already in use"
**Solution**: Kill old processes:
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

---

## 📱 Admin Features to Test

1. **Login as Admin**:
   - Navigate to `/admin-dashboard.html`
   - Login with admin credentials

2. **View Pending Listings**:
   - Click "Verification" tab
   - Should show 0 pending (all 21 are pre-approved)

3. **Post New Property**:
   - Click "+ Post Rental"
   - Fill form and submit
   - Check it appears in "Pending" tab

4. **Approve Listing**:
   - Click "Approve" button
   - Verify it appears on public homepage

5. **View All Properties**:
   - Navigate to homepage
   - Should show 21 properties

---

## 🎉 Success Checklist

- [✅] Supabase project created
- [✅] Database migrated (15 tables)
- [✅] 21 seed properties loaded
- [✅] `.env` file configured
- [ ] Deployed to production (Render/Railway/VPS)
- [ ] Domain DNS updated (if using custom domain)
- [ ] SSL certificate installed
- [ ] Admin dashboard tested
- [ ] Property posting tested
- [ ] M-Pesa payment tested (when live credentials added)

---

## 🆘 Need Help?

### Supabase Support:
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

### Deployment Support:
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app

### KejaMarket Issues:
- Check server logs: `pm2 logs kejamarket`
- Check database: Supabase dashboard → Table Editor
- Check API: `/api/status` endpoint

---

## 📌 Quick Reference

**Supabase Project**: `kejamarket-prod`  
**Database**: PostgreSQL 15  
**Connection**: `db.yvosarkfeukzdjxoenwe.supabase.co`  
**Admin Email**: `admin@kejamarket.co.ke`  
**Admin Password**: `Stallon@jevugwe4`  

**Production URLs** (after deployment):
- Render: `https://kejamarket-prod.onrender.com`
- Railway: `https://kejamarket-prod.up.railway.app`
- Custom Domain: `https://kejamarket.co.ke`
