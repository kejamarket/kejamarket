# KejaMarket Admin Verification System - Deployment Guide

## Status: ✅ READY FOR DEPLOYMENT

**Latest Commit**: 99d0c91  
**Date**: September 8, 2026  
**Features**: Complete admin verification system with 45 real Nairobi seed listings

---

## What's New

### 🎯 Complete Admin Verification System
- ✅ All new listings (properties, services, items) start as **unverified** (`is_verified = false`)
- ✅ Unverified listings are **hidden from public APIs**
- ✅ Admin dashboard has dedicated **Verification Tab** to approve/reject pending items
- ✅ Users see "Pending verification by admin" toast when posting
- ✅ Real-time pending counts on admin dashboard
- ✅ All actions logged in `verification_logs` table for audit trail

### 📊 45 Real Nairobi Seed Listings
- **12 Rental Properties** (Kilimani, Westlands, Karen, Runda, Brookside, etc.)
  - Price range: KSh 45,000 - 250,000/month
  - 1-5 bedrooms
  - Sources: buyrentkenya.com, HiNairobi

- **12 Home Services** (Plumbing, electrical, cleaning, handyman, painting, WiFi, gas, water, laundry, appliance repair, pest control, movers)
  - Price range: KSh 500 - 100,000
  - Sources: franciorsplumbing.co.ke, prologictechnologies.co.ke, zuuri.co.ke, hinairobi.com

- **18 Used Items** (Electronics, furniture, appliances, sports)
  - Laptops, TVs, projectors, sofas, beds, desks, cameras, washing machines
  - Price range: KSh 960 - 98,000
  - Sources: chiro.co.ke, corido.co.ke, nboresale.com, hinairobi.com, Facebook marketplace

---

## Pre-Deployment Checklist

### Database
- [ ] PostgreSQL database running
- [ ] Connection string configured in environment
- [ ] Migration scripts backed up

### Application
- [ ] All JavaScript files syntax verified ✅
- [ ] Server endpoints tested ✅
- [ ] Admin dashboard UI responsive ✅
- [ ] Git repository clean ✅

### Environment Variables
- [ ] `DATABASE_URL` set to PostgreSQL connection
- [ ] `PORT` set (default: 3000)
- [ ] `NODE_ENV` set to 'production' (if applicable)

---

## Deployment Steps

### Step 1: Execute Database Migration

Run this SQL against your PostgreSQL database to clear existing listings and ensure schema:

```sql
-- File: db/clear-and-seed.sql
-- This script:
-- 1. Deletes all existing listings (properties, services, marketplace items)
-- 2. Ensures is_verified column exists on all tables
-- 3. Creates verification_logs table
-- 4. Creates indexes for fast filtering

-- Execute in your PostgreSQL client:
psql -U postgres -d kejamarket -f db/clear-and-seed.sql
```

**Result**: 
- All old listings removed ✅
- Schema verified ✅
- Ready for seed data ✅

### Step 2: (Optional) Seed Real Data

If you want to pre-populate with 45 real Nairobi listings:

```javascript
// File: db/seed-listings.js contains all data
// To insert programmatically:

const seedListings = require('./db/seed-listings.js');

// Insert properties
for (const prop of seedListings.properties) {
  await db.query(
    `INSERT INTO properties (id, title, description, location, suburb, bedrooms, bathrooms, 
     rent_kes, property_type, landlord_id, landlord_name, landlord_phone, is_verified, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NOW())`,
    [prop.id, prop.title, prop.description, prop.location, prop.suburb, prop.bedrooms, 
     prop.bathrooms, prop.price, prop.propertyType, prop.landlordId, prop.landlordName, 
     prop.landlordPhone]
  );
}

// Similarly for services and marketplace_items
```

**Result**: 
- 12 rental properties pending approval ✅
- 12 services pending approval ✅
- 18 used items pending approval ✅
- Total: 42 items in verification queue ✅

### Step 3: Deploy Application

```bash
# Install dependencies (if not already done)
npm install

# Run in production
npm start
# or
NODE_ENV=production node server.js
```

**Result**:
- Server running on port 3000 (or configured port) ✅
- All API endpoints active ✅
- Admin dashboard available at /admin-dashboard.html ✅

### Step 4: Verify Deployment

#### 4a. Test Public APIs (should return empty without verified items)

```bash
# These should initially return empty or minimal data since all seed items have is_verified=false
curl http://localhost:3000/api/properties
curl http://localhost:3000/api/services
curl http://localhost:3000/api/marketplace
```

**Expected**: `{ success: true, properties: [], count: 0 }`

#### 4b. Test Admin Pending Endpoint (login as admin first)

```bash
# Get authorization token by logging in as admin
# Then:
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3000/api/admin/pending
```

**Expected**:
```json
{
  "success": true,
  "pending": {
    "properties": [12 items],
    "services": [12 items],
    "items": [18 items]
  },
  "counts": {
    "pendingProperties": 12,
    "pendingServices": 12,
    "pendingItems": 18,
    "total": 42
  }
}
```

#### 4c. Access Admin Dashboard

1. Open browser: `http://localhost:3000/admin-dashboard.html`
2. Login as admin (username: usr-admin-01 or email containing 'admin')
3. Click "Verification" tab in sidebar
4. Verify you see:
   - 4 stat cards showing counts (12, 12, 18, 42)
   - 42 pending item cards in grid
   - Approve/Reject buttons for each
5. Click "Approve" on one property
   - Should show success toast
   - Count should update to 41
   - Property should disappear from pending list
   - Property now appears in public GET /api/properties

#### 4d. Test User Posting Flow

1. Login as tenant or service provider
2. Click "Post Service" or "Sell Item" button
3. Fill form and submit
4. Verify toast: "✅ Service posted! Pending verification by admin."
5. Login as admin
6. Check Verification tab
7. New item should appear in pending list with count updated
8. Click Approve → item appears in public feeds

---

## File Summary

### New Files
- `db/clear-and-seed.sql` - Database migration (clear + schema setup)
- `db/seed-listings.js` - 45 real Nairobi seed listings
- `VERIFICATION_SYSTEM_TEST.md` - Complete test plan
- `DEPLOYMENT_GUIDE.md` - This file

### Modified Files
- `server.js` - Added 3 admin endpoints (GET /api/admin/pending, POST /api/admin/approve, POST /api/admin/reject)
- `js/app.js` - Updated toast messages to show "Pending verification"
- `js/admin.js` - Added verification tab methods
- `admin-dashboard.html` - Added Verification tab UI

### Unchanged (Compatible)
- `index.html` - No breaking changes
- `js/auth.js` - No breaking changes
- Other files - No impact

---

## API Endpoints Summary

### Public Endpoints (Verified Items Only)
- `GET /api/properties` - Returns only verified properties
- `GET /api/services` - Returns only verified services
- `GET /api/marketplace` - Returns only verified items

### Admin Endpoints (Auth Required + Admin Role)
- `GET /api/admin/pending` - Get all pending items (12 properties, 12 services, 18 items)
- `POST /api/admin/approve` - Approve item (sets is_verified=true)
- `POST /api/admin/reject` - Reject item (deletes it, logs reason)

### Example Admin Request
```bash
# Approve a property
curl -X POST http://localhost:3000/api/admin/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "itemType": "property",
    "itemId": "prop-001"
  }'

# Response: { success: true, message: "property approved successfully", item: {...} }
```

---

## Rollback Plan

If deployment has issues:

### Option 1: Restore Database
```sql
-- Restore from backup before migration
RESTORE DATABASE FROM BACKUP...

-- Or manually restore listings if backup not available
-- Properties should still exist in backup, just restore is_verified column
```

### Option 2: Revert Code
```bash
# Revert to previous commit
git revert 99d0c91
npm install
npm start
```

### Option 3: Disable Verification (Quick Fix)
Modify `server.js` GET endpoints to return all items temporarily:
```javascript
// Change this line in GET /api/services:
let query = 'SELECT * FROM services WHERE status = $1'; // Remove AND is_verified = true
```

---

## Monitoring

### Key Metrics to Track
1. **Pending Items Count** - Should decrease as admin approves
2. **Public Listing Count** - Should increase as items are approved
3. **API Response Times** - Verify no slowdown from new indexes
4. **Admin Login Success** - Verify admin panel accessibility
5. **Error Logs** - Check for verification endpoint errors

### Common Issues

| Issue | Solution |
|-------|----------|
| Admin dashboard doesn't load | Verify `is_admin = true` on your user account |
| Pending items not showing | Check `is_verified` column exists: `SELECT is_verified FROM properties LIMIT 1;` |
| Public API returns wrong data | Verify filters: `SELECT COUNT(*) FROM properties WHERE is_verified = true;` |
| Approve/reject doesn't work | Check admin auth token is valid and user.isAdmin = true |
| Seed data not inserted | Run clear-and-seed.sql first, then check db/seed-listings.js format |

---

## Post-Deployment Tasks

1. **Monitor Logs** - Watch for errors in first 24 hours
2. **Test All Flows** - Post item → Pending → Admin approves → Public
3. **Notify Stakeholders** - Let users know about new verification system
4. **Document Policies** - Create user-facing docs on what's required for approval
5. **Set Admin Schedule** - Decide when admins check pending queue (daily? hourly?)
6. **Plan Notifications** - Implement email/SMS when item is approved/rejected (future enhancement)

---

## Success Criteria

✅ **System is successfully deployed when:**

1. Database migration executed without errors
2. Seed data loaded (42 pending items visible in admin dashboard)
3. Admin can view pending items in Verification tab
4. Admin can approve items (they appear in public APIs)
5. Admin can reject items (they're deleted)
6. Users see "Pending verification" when posting
7. Public APIs only return verified items (count = 0 initially)
8. All error logs are clean
9. Performance acceptable (sub-second response times)

---

## Support & Questions

**Git Repository**: https://github.com/kejamarket/kejamarket  
**Latest Commits**:
- 99d0c91 - Expand seed data with 45 real listings
- 6fa13d1 - Implement admin verification system
- 557f8a7 - Add test documentation

**Status**: Ready for immediate deployment ✅

---

**Deployment Date**: _________  
**Deployed By**: _________  
**Notes**: _________

