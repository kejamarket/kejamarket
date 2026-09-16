# KejaMarket Admin Dashboard - Full Implementation Plan

## ✅ Phase 1: Foundation (CURRENT)
- [x] Created admin-core.js with routing and state management
- [x] Set up module architecture
- [x] Implemented dashboard with clickable cards
- [x] Created user management foundation
- [ ] Update admin-dashboard.html to use new system
- [ ] Create admin-specific CSS
- [ ] Set up proper authentication middleware

## 🔄 Phase 2: Core Modules (NEXT - Prioritized by importance)

### 2.1 User Management (HIGH PRIORITY)
**Files to create:**
- `js/admin-users.js` - Complete user management module
- User profile pages
- Ban/suspend with reason modals
- Bulk operations
- User history tracking

**Backend routes needed:**
```
GET  /api/admin/users - List users with filters
GET  /api/admin/users/:id - User details
POST /api/admin/users/:id/verify - Verify user
POST /api/admin/users/:id/suspend - Suspend with reason
POST /api/admin/users/:id/ban - Ban with reason
POST /api/admin/users/:id/activate - Reactivate
DELETE /api/admin/users/:id - Soft delete
```

### 2.2 Verification Centre (HIGH PRIORITY - MOST REQUESTED)
**Files to create:**
- `js/admin-verification.js`
- Approval/rejection workflows
- Document review system
- Reason modals for rejection

**Backend routes:**
```
GET  /api/admin/verification/pending
GET  /api/admin/verification/:id
POST /api/admin/verification/:id/approve
POST /api/admin/verification/:id/reject - with reason
POST /api/admin/verification/:id/request-docs
```

**Critical workflow:**
1. Admin views pending listing
2. Reviews documents/photos
3. Clicks Approve or Reject
4. If reject: Modal opens for reason selection
5. User gets notification with reason
6. Creates audit log entry

### 2.3 Property Management
**Files:** `js/admin-properties.js`
- Property listings with all statuses
- Property details page
- Edit capabilities
- Feature/unfeature
- Suspend/archive

### 2.4 Buildings & Units
**Files:** `js/admin-buildings.js`, `js/admin-units.js`
- Building hierarchy
- Unit management
- Occupancy tracking

### 2.5 BNB Management
**Files:** `js/admin-bnb.js`
- BNB listings
- Host management
- Inquiry tracking
- Important: Platform is connector, not operator

### 2.6 Services & Marketplace
**Files:** `js/admin-services.js`, `js/admin-marketplace.js`
- Provider management
- Item listings
- Category management

### 2.7 Reports & Complaints (HIGH PRIORITY)
**Files:** `js/admin-reports.js`
- Investigation queue
- Report categories
- Resolution tracking
- Evidence handling

## 📋 Phase 3: Support & Communication

### 3.1 Support Ticketing System
**Files:** `js/admin-support.js`
- Ticket management
- Assignment
- Response system
- Escalation

### 3.2 Inquiries
**Files:** `js/admin-inquiries.js`
- View all inquiries
- Communication history
- Status tracking

### 3.3 Reviews
**Files:** `js/admin-reviews.js`
- Review moderation
- Hide/restore
- Report handling

## 🔒 Phase 4: Security & Admin

### 4.1 Admin Users & Permissions
**Files:** `js/admin-permissions.js`
- Role management
- Permission matrix
- Admin creation

### 4.2 Audit Logs
**Files:** `js/admin-audit.js`
- All admin actions logged
- Searchable history
- Export capability

### 4.3 Risk & Fraud
**Files:** `js/admin-risk.js`
- Suspicious activity flagging
- Duplicate detection
- Investigation queue

## 📊 Phase 5: Analytics & Reporting

### 5.1 Analytics Dashboard
**Files:** `js/admin-analytics.js`
- Charts with Chart.js
- Date filtering
- Export reports

### 5.2 Finance Module
**Files:** `js/admin-finance.js`
- Payment tracking
- Subscriptions
- Commissions

## 🛠️ Phase 6: System Management

### 6.1 Content Management
**Files:** `js/admin-content.js`
- FAQ management
- Banner management
- Blog posts

### 6.2 Locations
**Files:** `js/admin-locations.js`
- County/town management
- Estate management

### 6.3 Settings
- System configuration
- Integration management

## 🎨 Frontend Components Needed

### Reusable Components:
1. **ConfirmationModal** - For destructive actions
2. **ReasonModal** - For bans/suspensions/rejections
3. **LoadingState** - Consistent loading UI
4. **EmptyState** - No data states
5. **ErrorState** - Error handling
6. **DataTable** - Sortable, filterable tables
7. **SearchBar** - Global and module-specific search
8. **StatusBadge** - Consistent status indicators
9. **ActionButtons** - Edit, delete, suspend, etc.
10. **NotificationToast** - Success/error messages

### Modal Types:
- **Rejection Modal**: Select reason + custom message
- **Ban Modal**: Reason + duration + notify user
- **Suspend Modal**: Reason + duration + notify user
- **Document Request Modal**: Select documents needed
- **Delete Confirmation**: "Are you sure?" with consequences
- **Bulk Action Modal**: Confirm bulk operations

## 📡 Backend API Structure

### Admin Middleware:
```javascript
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && !req.user.isAdmin)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user.permissions?.[permission]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### Audit Logging:
Every admin action must call:
```javascript
await createAuditLog({
  adminId: req.user.id,
  action: 'approve_property',
  targetType: 'property',
  targetId: propertyId,
  details: { reason, previousStatus, newStatus },
  ipAddress: req.ip
});
```

### Notification Triggers:
Every user-facing action must call:
```javascript
await sendUserNotification({
  userId: targetUserId,
  type: 'listing_approved',
  title: 'Listing Approved',
  message: 'Your property listing has been approved',
  data: { propertyId, listingId }
});
```

## 🎯 Critical Success Factors

1. **Every card, button, icon is clickable and functional**
2. **No fake/hardcoded numbers in production**
3. **All destructive actions require confirmation**
4. **Bans/rejections must have reasons**
5. **Users are notified of all important actions**
6. **All admin actions are logged**
7. **Permissions are enforced on backend**
8. **Responsive design works on all devices**
9. **Loading, error, empty states everywhere**
10. **KejaMarket remains a connector platform**

## 📦 Deliverables Checklist

### Core Files:
- [ ] js/admin-core.js (DONE)
- [ ] js/admin-users.js
- [ ] js/admin-properties.js
- [ ] js/admin-buildings.js
- [ ] js/admin-units.js
- [ ] js/admin-verification.js
- [ ] js/admin-bnb.js
- [ ] js/admin-services.js
- [ ] js/admin-marketplace.js
- [ ] js/admin-inquiries.js
- [ ] js/admin-reviews.js
- [ ] js/admin-reports.js
- [ ] js/admin-risk.js
- [ ] js/admin-support.js
- [ ] js/admin-permissions.js
- [ ] js/admin-audit.js
- [ ] js/admin-analytics.js
- [ ] js/admin-finance.js
- [ ] js/admin-content.js
- [ ] js/admin-locations.js
- [ ] js/admin-components.js (Modals, tables, etc.)
- [ ] css/admin-dashboard.css

### Backend Routes:
- [ ] Admin authentication middleware
- [ ] User management routes
- [ ] Verification routes with workflow
- [ ] Property management routes
- [ ] Building/Unit routes
- [ ] BNB routes
- [ ] Services/Marketplace routes
- [ ] Reports/Complaints routes
- [ ] Support ticket routes
- [ ] Admin user management routes
- [ ] Audit log routes
- [ ] Analytics routes
- [ ] Finance routes

### Database Updates:
- [ ] Admin permissions table
- [ ] Audit logs table
- [ ] Support tickets table
- [ ] Admin notes table
- [ ] Verification history table
- [ ] Ban/suspension reasons table

## 🚀 Implementation Priority Order

**Week 1:**
1. Admin core architecture ✅
2. User management module
3. Verification centre with workflow
4. Basic property management

**Week 2:**
5. Reports & complaints system
6. Support ticketing
7. Buildings & units
8. BNB management

**Week 3:**
9. Services & marketplace
10. Reviews & inquiries
11. Risk & fraud detection
12. Admin users & permissions

**Week 4:**
13. Audit logs
14. Analytics dashboard
15. Finance module
16. Content management
17. Testing & bug fixes
18. Production deployment

## 🎬 Next Immediate Actions:

1. Update admin-dashboard.html to load admin-core.js
2. Create admin-components.js for modals/UI
3. Build user management module completely
4. Implement verification workflow
5. Test end-to-end with database
6. Deploy to production

---
**Status:** Phase 1 Foundation in progress
**Last Updated:** 2026-09-16
