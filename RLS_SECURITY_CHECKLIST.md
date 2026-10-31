# ✅ RLS Security Implementation Checklist

## 🎯 Goal
Enable Row Level Security (RLS) on all 6 public tables to fix 48 Supabase Security Advisor errors.

---

## 📋 Pre-Implementation

- [ ] Backed up database (Supabase auto-backups, but safe to verify)
- [ ] Reviewed all policies in `db/rls-security-policies.sql`
- [ ] Understood access control patterns
- [ ] Prepared test cases

---

## 🚀 Implementation Steps

### Step 1: Apply SQL Policies

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor → New Query
- [ ] Copy contents of `db/rls-security-policies.sql`
- [ ] Paste into editor
- [ ] Click **Run** button
- [ ] Wait for ✅ success message

### Step 2: Verify Policies Applied

#### Table: promotions
- [ ] Policy "Allow public read promotions" exists
- [ ] Policy "Allow admin write promotions" exists
- [ ] Policy "Allow admin update promotions" exists
- [ ] Policy "Allow admin delete promotions" exists
- [ ] RLS toggle is **ON**

#### Table: house_hunts
- [ ] Policy "Allow authenticated read house_hunts" exists
- [ ] Policy "Allow owner write house_hunts" exists
- [ ] Policy "Allow owner update house_hunts" exists
- [ ] Policy "Allow owner delete house_hunts" exists
- [ ] RLS toggle is **ON**

#### Table: property_media
- [ ] Policy "Allow public read property_media" exists
- [ ] Policy "Allow owner write property_media" exists
- [ ] Policy "Allow owner update property_media" exists
- [ ] Policy "Allow admin delete property_media" exists
- [ ] RLS toggle is **ON**

#### Table: property_reviews
- [ ] Policy "Allow public read property_reviews" exists
- [ ] Policy "Allow authenticated write property_reviews" exists
- [ ] Policy "Allow owner update property_reviews" exists
- [ ] Policy "Allow owner delete property_reviews" exists
- [ ] RLS toggle is **ON**

#### Table: services
- [ ] Policy "Allow public read services" exists
- [ ] Policy "Allow provider write services" exists
- [ ] Policy "Allow provider update services" exists
- [ ] Policy "Allow admin delete services" exists
- [ ] RLS toggle is **ON**

#### Table: marketplace_items
- [ ] Policy "Allow public read marketplace_items" exists
- [ ] Policy "Allow seller write marketplace_items" exists
- [ ] Policy "Allow seller update marketplace_items" exists
- [ ] Policy "Allow admin delete marketplace_items" exists
- [ ] RLS toggle is **ON**

### Step 3: Check Security Advisor

- [ ] Go to Security Advisor
- [ ] Verify **0 RLS Disabled errors** (was 48)
- [ ] No "Errors" section should appear for RLS
- [ ] All warnings cleared

---

## 🧪 Testing

### Test 1: Anonymous User - Read Public Data
```
Scenario: Browse property listings
Expected: ✅ Can see active properties
Test:
  - Don't sign in
  - Browse properties page
  - Should load normally
```

### Test 2: Anonymous User - Cannot Modify
```
Scenario: Try to upload property media without signing in
Expected: ❌ Request denied/not visible
Test:
  - Open browser dev console
  - Try fetch DELETE on property_media
  - Should get permission error
```

### Test 3: Authenticated User - Own Data
```
Scenario: Landlord creates and updates property
Expected: ✅ Can create/update own property
Test:
  - Sign in as landlord
  - Create new property
  - Should succeed
  - Edit own property → should succeed
  - Try to edit others' property → should fail
```

### Test 4: Admin User - Full Access
```
Scenario: Admin manages all data
Expected: ✅ Can CRUD any data
Test:
  - Sign in as admin
  - Create/read/update/delete any record
  - All operations should succeed
```

### Test 5: Service Provider - Provider Data
```
Scenario: Service provider lists services
Expected: ✅ Can create/edit own services, see others' active
Test:
  - Sign in as service provider
  - Create service → should succeed
  - Edit own service → should succeed
  - Edit others' service → should fail (unless admin)
```

---

## 🌐 Website Functionality Testing

After RLS enabled, verify website still works:

### Homepage
- [ ] Properties load
- [ ] Can search by location
- [ ] Can filter by property type
- [ ] Can browse other categories

### Property Details
- [ ] Can view property details
- [ ] Can see media/photos
- [ ] Can see reviews
- [ ] Can post review (authenticated)

### Landlord Portal
- [ ] Can create property
- [ ] Can edit own property
- [ ] Can upload media
- [ ] Can't access others' properties

### Service Marketplace
- [ ] Can browse services
- [ ] Service providers can list services
- [ ] Can't modify others' services

### Marketplace
- [ ] Can browse items
- [ ] Users can sell items
- [ ] Can't delete others' listings

### Admin Dashboard
- [ ] Can view all data
- [ ] Can manage all entities
- [ ] Can delete anything
- [ ] Performance is normal

---

## 📊 Security Advisor Status

| Check | Before | After |
|-------|--------|-------|
| Total Errors | 48 | **0** ✅ |
| RLS Disabled Errors | 48 | **0** ✅ |
| RLS Disabled on promotions | ❌ | ✅ |
| RLS Disabled on house_hunts | ❌ | ✅ |
| RLS Disabled on property_media | ❌ | ✅ |
| RLS Disabled on property_reviews | ❌ | ✅ |
| RLS Disabled on services | ❌ | ✅ |
| RLS Disabled on marketplace_items | ❌ | ✅ |

---

## 🔒 Access Control Matrix

| Action | Anonymous | Authenticated | Owner | Admin |
|--------|-----------|---------------|-------|-------|
| **Read Public Data** | ✅ | ✅ | ✅ | ✅ |
| **Read Own Data** | ❌ | ✅ | ✅ | ✅ |
| **Create Own Data** | ❌ | ✅ | ✅ | ✅ |
| **Update Own Data** | ❌ | ✅ | ✅ | ✅ |
| **Delete Own Data** | ❌ | ⚠️ | ✅ | ✅ |
| **Update Others' Data** | ❌ | ❌ | ❌ | ✅ |
| **Delete Others' Data** | ❌ | ❌ | ❌ | ✅ |
| **Manage Promotions** | ❌ | ❌ | ❌ | ✅ |

Legend: ✅ = Allowed | ❌ = Denied | ⚠️ = Creator/Admin only

---

## 📝 Documentation

- [ ] Read `SECURITY_RLS_SETUP.md` (detailed guide)
- [ ] Review `db/rls-security-policies.sql` (policy definitions)
- [ ] Understand each policy's purpose (comments in SQL)
- [ ] Document any custom changes made

---

## 🔄 Post-Implementation

- [ ] Commit changes to GitHub
- [ ] Push to main branch
- [ ] Update team on security improvements
- [ ] Monitor for any access issues
- [ ] Review Security Advisor weekly

---

## ✨ Final Status

### When Checklist is Complete:
- ✅ All RLS policies applied
- ✅ All 6 tables protected
- ✅ Security Advisor shows 0 errors
- ✅ Website functionality verified
- ✅ Access control working correctly
- ✅ Admin features functional
- ✅ Production-ready
- ✅ Documented and committed

---

## 🚀 Next Steps

1. **Apply SQL policies** in Supabase (follow Step 1)
2. **Verify each table** (follow Step 2)
3. **Check Security Advisor** (follow Step 3)
4. **Run tests** (follow Testing section)
5. **Commit to GitHub** (after verification)

---

**Status:** Ready to implement  
**Impact:** Fixes 48 security errors  
**Effort:** ~10 minutes  
**Risk:** Low (policies are non-breaking, preserve functionality)  
**Benefit:** High (production-secure database)

🔒 **Security Complete!**
