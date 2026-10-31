# 🔒 KejaMarket RLS Security Setup Guide

## Overview
This guide explains how to enable Row Level Security (RLS) on your Supabase database to fix the 48 security errors.

---

## 🚨 Current Issues (From Supabase Security Advisor)

**48 Errors Found:**
- RLS Disabled in Public on:
  - `public.promotions`
  - `public.house_hunts`
  - `public.property_media`
  - `public.property_reviews`
  - `public.services`
  - `public.marketplace_items`

**Risk Level:** 🔴 CRITICAL - Anyone can read/modify all data

---

## ✅ Solution: Enable RLS with Security Policies

### Step 1: Copy the SQL File

The file `db/rls-security-policies.sql` contains all the necessary SQL commands to:
- ✅ Enable RLS on all 6 tables
- ✅ Drop existing (open) policies
- ✅ Create proper read/write/update/delete policies
- ✅ Restrict access based on user roles and ownership

### Step 2: Apply in Supabase SQL Editor

1. Go to **Supabase Dashboard**
2. Select your **kejamarket-prod** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy entire contents of `db/rls-security-policies.sql`
6. Paste into the SQL editor
7. Click **Run** (▶️ button)
8. Wait for completion (should see ✅ success message)

### Step 3: Verify Security Policies

Go to **Supabase Dashboard** → **Database** → **Tables**

For each table, verify:
1. Click table name (e.g., `promotions`)
2. Look at **Policies** section
3. Should see multiple policies like:
   - ✅ "Allow public read promotions"
   - ✅ "Allow admin write promotions"
   - ✅ "Allow admin update promotions"
   - ✅ "Allow admin delete promotions"

---

## 🔐 Security Policy Details

### 1. **promotions** Table
```
READ:   Active promotions visible to all + authenticated
WRITE:  Admin only
UPDATE: Admin only
DELETE: Admin only
```
**Purpose:** Marketing team controls promotions, users see active ones

### 2. **house_hunts** Table
```
READ:   Authenticated users see their own + others
WRITE:  Creator only (authenticated users)
UPDATE: Creator only
DELETE: Creator or Admin
```
**Purpose:** Users manage their own house hunt requests

### 3. **property_media** Table
```
READ:   Public (everyone sees property images)
WRITE:  Property owner or Admin
UPDATE: Property owner or Admin
DELETE: Admin only
```
**Purpose:** Property owners upload media, everyone views

### 4. **property_reviews** Table
```
READ:   Public (everyone sees reviews)
WRITE:  Any authenticated user (reviewer_id = auth.uid())
UPDATE: Reviewer or Admin
DELETE: Reviewer or Admin
```
**Purpose:** Community reviews, reviewers control their own reviews

### 5. **services** Table
```
READ:   Active services public + provider sees own
WRITE:  Service provider (provider_id = auth.uid())
UPDATE: Provider or Admin
DELETE: Admin only
```
**Purpose:** Service providers list services, customers browse

### 6. **marketplace_items** Table
```
READ:   Active items public + seller sees own
WRITE:  Seller (seller_id = auth.uid())
UPDATE: Seller or Admin
DELETE: Admin only
```
**Purpose:** Users sell items, customers browse marketplace

---

## 🔑 Key Access Control Patterns

### Pattern 1: Admin-Only Control
```sql
-- Only admins can modify (e.g., promotions)
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
))
```

### Pattern 2: Owner-Only Access
```sql
-- Only creator/owner can modify their own data
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id)
```

### Pattern 3: Public Read + Owner Write
```sql
-- Everyone can read active, but only owner can create/update
FOR SELECT USING (status = 'active' OR auth.uid() = owner_id)
FOR INSERT WITH CHECK (auth.uid() = owner_id)
```

### Pattern 4: Cross-Table Lookup
```sql
-- Check if user owns the related property
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.properties WHERE id = property_id
  )
)
```

---

## ⚙️ Testing Policies

### Test as Anonymous User
1. In Supabase SQL Editor, test query:
```sql
-- This should work (public read)
SELECT * FROM public.promotions WHERE status = 'active';

-- This should FAIL (no delete permission)
DELETE FROM public.promotions WHERE id = 'xyz';
```

### Test as Authenticated User
1. Sign in to your website
2. Try to create/update/delete data
3. Should succeed for owned data, fail for others' data

### Test as Admin User
1. Sign in as admin account
2. Should be able to create/update/delete any data

---

## 🚀 After Applying Policies

### What Happens
✅ Supabase Security Advisor will no longer show "RLS Disabled" errors  
✅ Users can only access their own data or public data  
✅ Admins have full control  
✅ Database is production-ready  

### Testing Checklist
- [ ] Applied SQL file in Supabase
- [ ] Verified all 6 tables have policies
- [ ] Tested anonymous read (should work for public data)
- [ ] Tested anonymous write (should fail)
- [ ] Tested authenticated user (should work for own data)
- [ ] Tested admin (should work for all data)
- [ ] Security Advisor shows 0 RLS errors
- [ ] Website still works normally

---

## 📋 SQL File Execution Steps (Detailed)

### Option A: Supabase Dashboard (Recommended for first-time)

1. **Log in to Supabase**
   - Go to https://supabase.com
   - Select your project

2. **Open SQL Editor**
   - Left sidebar → SQL Editor
   - New Query button

3. **Paste the SQL**
   - Copy from `db/rls-security-policies.sql`
   - Paste entire contents
   - DO NOT modify anything

4. **Execute**
   - Click **Run** button (play icon)
   - Wait for green ✅ completion message

5. **Verify**
   - Go to Database → Tables
   - Click each table
   - Check Policies section shows new policies

### Option B: Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref cwqmtrwdbjmsrrqjkfmj

# Run the migration
supabase db push db/rls-security-policies.sql
```

---

## 🆘 Troubleshooting

### Error: "Admin_users table not found"
**Cause:** The admin_users table doesn't exist  
**Solution:** Update policies to use correct admin table name or create admin_users table first

### Error: "Column 'owner_id' doesn't exist"
**Cause:** Table structure doesn't match policy assumptions  
**Solution:** Check column names in your tables and update policies accordingly

### Error: "auth.uid() cannot be null"
**Cause:** User not authenticated  
**Solution:** This is expected for anonymous users - policies handle this

### Policies not showing in UI
**Solution:** 
- Refresh browser (Ctrl+F5)
- Check table name spelling
- Verify SQL executed without errors

---

## 📊 Security Advisor After RLS

After applying policies:

**Before:**
```
48 errors
  ├─ RLS Disabled in Public (promotions)
  ├─ RLS Disabled in Public (house_hunts)
  ├─ RLS Disabled in Public (property_media)
  ├─ RLS Disabled in Public (property_reviews)
  ├─ RLS Disabled in Public (services)
  └─ RLS Disabled in Public (marketplace_items)
```

**After:**
```
0 errors
✅ All tables protected with RLS policies
✅ Read access: Public or authenticated
✅ Write access: Owner or admin only
✅ Delete access: Admin only
```

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] RLS enabled on all public tables
- [ ] All policies applied and tested
- [ ] Security Advisor shows 0 errors
- [ ] Anonymous read works (public data)
- [ ] Anonymous write fails (protected)
- [ ] Authenticated users can CRUD own data
- [ ] Admin users can CRUD all data
- [ ] Website functionality verified
- [ ] Mobile app still works
- [ ] API endpoints still work

---

## 📞 Need Help?

If you encounter issues:

1. **Check Supabase Logs**
   - Dashboard → Logs → Database
   - Look for errors

2. **Verify Table Structure**
   - Dashboard → Database → Tables
   - Compare with policy assumptions

3. **Test Individual Policies**
   - SQL Editor → Run test query
   - Verify expected behavior

4. **Review Policy Logic**
   - Each policy has comments explaining intent
   - Compare with your actual table structure

---

## ✨ Summary

This RLS setup:
- ✅ Fixes all 48 security errors
- ✅ Protects user data from unauthorized access
- ✅ Maintains full functionality for authorized users
- ✅ Provides admin control when needed
- ✅ Makes database production-ready
- ✅ Complies with security best practices

**Status:** Ready to deploy! 🚀
