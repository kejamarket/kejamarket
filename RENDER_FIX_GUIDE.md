# 🚀 Render Deployment Fix Guide

## Problem
Render is using the OLD Supabase database URL and deployment is failing with PostgreSQL connection errors.

## Solution - Update Environment Variable in Render

### Step 1: Update DATABASE_URL
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service: **kejamarket-prod**
3. Click **"Environment"** in the left sidebar
4. Find the **DATABASE_URL** variable
5. Click "Edit" or the pencil icon
6. Replace the old value with:
   ```
   postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres
   ```
7. Click **"Save Changes"**

### Step 2: Clear Cache & Deploy
1. Go back to the main dashboard (click the service name at top)
2. Click **"Manual Deploy"** button (top right)
3. Select **"Clear build cache & deploy"**
4. Wait 2-3 minutes for deployment to complete

### Step 3: Verify Deployment
After deployment completes, test these URLs:

**Properties (should show 21):**
```
https://kejamarket.co.ke/api/properties
```

**Services (should show 10):**
```
https://kejamarket.co.ke/api/services
```

**Marketplace (should show 20):**
```
https://kejamarket.co.ke/api/marketplace
```

## What's in the Database
✅ **21 Properties** - Rental houses across Nairobi
✅ **10 Services** - Moving companies, plumbers, electricians, cleaners
✅ **20 Marketplace Items** - Furniture, electronics, appliances
✅ **30 Users** - Service providers and sellers

## Current Status
- ✅ Database: Populated with real data
- ✅ GitHub: Latest code pushed (commit 63ceb0e)
- ❌ Render: Using old DATABASE_URL - **NEEDS UPDATE**

## Why This Happened
You created a NEW Supabase project and updated the local `.env` file, but Render still has the OLD database URL in its environment variables. Render doesn't automatically sync with your `.env` file - you must manually update it in the Render dashboard.

## After Fix
Once you update the DATABASE_URL and redeploy:
- Your live site will show all 21 properties
- Services page will show 10 moving/home service providers
- Marketplace will show 20 items for sale
- All features will work properly

---

**Need help?** The error logs show:
```
PostgreSQL connection failed: connect ENETUNREACH 2a05:d014:415:501::7f4e:5432
```

This confirms Render is trying to connect to the OLD database IP address. Updating DATABASE_URL will fix this immediately.
