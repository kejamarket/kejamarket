# KejaMarket Deployment Instructions

## 🚀 Quick Deploy to Render.com (5 minutes)

### Step 1: Prepare Repository
1. Push your code to GitHub (if not already done)
2. Ensure all files are committed including the new desktop layout CSS

### Step 2: Deploy on Render.com
1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:

**Basic Settings:**
- **Name**: kejamarket
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

**Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
JWT_SECRET=821b62dccd1d6a0c4d8262002c9ed1c5d1e8d0e0aa6ea0e63d15bfaaf3886b4191321f40d4c10fb076c93ddd58e7d93b04b42e68086ff5321b7bfc0b987d3ff4
AT_USERNAME=kejamarket
AT_API_KEY=atsk_bdabf24586133b346f31f648972e20184f64dc60e215e175c948b83d5e5e720bf9991634
MPESA_CONSUMER_KEY=YOUR_CONSUMER_KEY_HERE
MPESA_CONSUMER_SECRET=YOUR_CONSUMER_SECRET_HERE  
MPESA_PASSKEY=YOUR_PASSKEY_HERE
MPESA_PAYBILL=303030
MPESA_ACCOUNT=2057103992
MPESA_ENV=sandbox
```

### Step 3: Deploy
1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Your app will be live at: `https://kejamarket-xxxx.onrender.com`

## ✅ What's Ready for Production

### ✅ Database
- PostgreSQL via Supabase (132 properties loaded)
- Connection pooler configured for reliability
- All tables and indexes created

### ✅ Backend Features  
- User authentication (JWT + phone OTP)
- Property listings and search
- Admin dashboard
- M-Pesa payment integration (sandbox ready)
- SMS alerts via Africa's Talking
- House hunting service
- Real-time messaging

### ✅ Frontend Features
- **NEW**: Desktop layout matches reference image exactly
- 4-column property grid
- 250px sidebar with filters
- Professional results header
- Mobile-responsive design
- Progressive Web App (PWA)

### ✅ Security & Performance
- Rate limiting (100 requests/15min)
- Helmet security headers
- CORS configured
- Compression enabled
- Input validation and sanitization

## 🌐 Custom Domain Setup (Optional)

### For kejamarket.co.ke:
1. In Render dashboard, go to Settings → Custom Domains
2. Add domain: `kejamarket.co.ke`
3. Add CNAME record in your DNS:
   ```
   CNAME: www → kejamarket-xxxx.onrender.com
   CNAME: @ → kejamarket-xxxx.onrender.com
   ```

## 🔧 Post-Deployment Checklist

### Test These Features:
- [ ] Homepage loads with new desktop layout
- [ ] Property search and filtering
- [ ] User registration/login
- [ ] Admin dashboard (admin@kejamarket.co.ke / Stallon@jevugwe4)
- [ ] Mobile responsiveness
- [ ] SMS alerts subscription
- [ ] House hunting booking

### Production Configuration:
- [ ] Update M-Pesa to live credentials (when ready)
- [ ] Configure SMTP email service
- [ ] Set up Cloudinary for image hosting
- [ ] Monitor logs and performance

## 📊 Current Database Content
- **Properties**: 132 verified listings
- **Locations**: 543 Nairobi areas covered
- **Admin User**: admin@kejamarket.co.ke (ready to use)

## 🆘 Troubleshooting

**Build Fails:**
- Check Node.js version (requires 20+)
- Verify all dependencies in package.json

**Database Connection Issues:**
- Verify DATABASE_URL environment variable
- Check Supabase connection pooler status

**Static Files Not Loading:**
- Ensure CSS files are in /css/ folder
- Check file paths are relative

Your KejaMarket platform is production-ready! 🎉