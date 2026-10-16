# 🏗️ KejaMarket Admin - Implementation Plan

## Stack Profile
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Backend:** Node.js + Express v5.2.1
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT + Bcrypt
- **Payments:** Safaricom Daraja M-Pesa
- **SMS:** Africa's Talking
- **Hosting:** Render
- **Team:** Solo developer
- **Timeline:** 10-12 weeks (phased approach)

---

## Phase 1: Security & Trust (Weeks 1-3) - P0

### 1.1 Role-Based Access Control (RBAC)

**Database Schema:**
```sql
-- db/migrations/001_rbac.sql
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT ('role-' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY DEFAULT ('perm-' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);

-- Seed default roles
INSERT INTO roles (id, name, description) VALUES
  ('role-super-admin', 'Super Admin', 'Full system access'),
  ('role-ops-admin', 'Operations Admin', 'Listings, users, concierge'),
  ('role-verification-officer', 'Verification Officer', 'Identity & property verification'),
  ('role-finance-officer', 'Finance Officer', 'Transactions & reconciliation'),
  ('role-finance-approver', 'Finance Approver', 'Approve refunds'),
  ('role-support-agent', 'Support Agent', 'Customer inquiries'),
  ('role-auditor', 'Auditor', 'Read-only reports'),
  ('role-system-operator', 'System Operator', 'Infrastructure monitoring')
ON CONFLICT (id) DO NOTHING;

-- Seed permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('listing.view', 'listing', 'view', 'View listings'),
  ('listing.approve', 'listing', 'approve', 'Approve listings'),
  ('listing.reject', 'listing', 'reject', 'Reject listings'),
  ('listing.delete', 'listing', 'delete', 'Delete listings'),
  ('user.view', 'user', 'view', 'View user details'),
  ('user.edit', 'user', 'edit', 'Edit user information'),
  ('user.ban', 'user', 'ban', 'Ban users'),
  ('identity.review', 'identity', 'review', 'Review verification documents'),
  ('identity.approve', 'identity', 'approve', 'Approve identity verification'),
  ('property.verify', 'property', 'verify', 'Verify property ownership'),
  ('payment.view', 'payment', 'view', 'View transactions'),
  ('payment.reconcile', 'payment', 'reconcile', 'Reconcile payments'),
  ('refund.request', 'refund', 'request', 'Request refunds'),
  ('refund.approve', 'refund', 'approve', 'Approve refunds'),
  ('refund.execute', 'refund', 'execute', 'Execute approved refunds'),
  ('admin.manage_roles', 'admin', 'manage_roles', 'Manage roles & permissions'),
  ('audit.read', 'audit', 'read', 'View audit logs'),
  ('system.monitor', 'system', 'monitor', 'View system health')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to roles
-- Super Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-super-admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- Operations Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-ops-admin', id FROM permissions 
WHERE resource IN ('listing', 'user') OR name IN ('audit.read', 'system.monitor')
ON CONFLICT DO NOTHING;

-- Verification Officer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-verification-officer', id FROM permissions 
WHERE resource IN ('identity', 'property') OR name = 'audit.read'
ON CONFLICT DO NOTHING;

-- Finance Officer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-finance-officer', id FROM permissions 
WHERE resource IN ('payment', 'refund') AND action IN ('view', 'reconcile', 'request')
ON CONFLICT DO NOTHING;

-- Finance Approver
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-finance-approver', id FROM permissions 
WHERE name IN ('payment.view', 'refund.view', 'refund.approve', 'refund.execute')
ON CONFLICT DO NOTHING;

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

**Backend Middleware:**
```javascript
// middleware/rbac.js
const db = require('../db/postgres-store');

async function checkPermission(userId, requiredPermission) {
  const result = await db.query(`
    SELECT EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1 
        AND p.name = $2
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) as has_permission
  `, [userId, requiredPermission]);
  
  return result.rows[0]?.has_permission || false;
}

function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const hasPermission = await checkPermission(req.user.id, permission);
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: permission
      });
    }
    
    next();
  };
}

function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    for (const permission of permissions) {
      const hasPermission = await checkPermission(req.user.id, permission);
      if (hasPermission) {
        return next();
      }
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Insufficient permissions',
      required_any: permissions
    });
  };
}

module.exports = { checkPermission, requirePermission, requireAnyPermission };
```

### 1.2 Audit Logging

**Database Schema:**
```sql
-- db/migrations/002_audit_logs.sql
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY DEFAULT ('audit-' || gen_random_uuid()::text),
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  before_state JSONB,
  after_state JSONB,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  outcome TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_events(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);

-- Prevent deletion of audit events
CREATE RULE audit_no_delete AS ON DELETE TO audit_events DO INSTEAD NOTHING;
CREATE RULE audit_no_update AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
```

**Backend Service:**
```javascript
// services/audit-service.js
const db = require('../db/postgres-store');

class AuditService {
  async log({
    eventType,
    actorId,
    actorRole,
    action,
    resourceType,
    resourceId,
    beforeState,
    afterState,
    requestId,
    ipAddress,
    userAgent,
    outcome,
    errorMessage,
    metadata = {}
  }) {
    try {
      await db.query(`
        INSERT INTO audit_events (
          event_type, actor_id, actor_role, action, resource_type, resource_id,
          before_state, after_state, request_id, ip_address, user_agent,
          outcome, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        eventType, actorId, actorRole, action, resourceType, resourceId,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        requestId, ipAddress, userAgent, outcome, errorMessage,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      console.error('❌ Failed to write audit log:', error);
      // Don't throw - audit failure shouldn't break the main operation
    }
  }

  async getActivityLog(filters = {}) {
    const { actorId, resourceType, resourceId, action, startDate, endDate, limit = 100, offset = 0 } = filters;
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (actorId) {
      conditions.push(`actor_id = $${paramIndex++}`);
      params.push(actorId);
    }
    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(resourceType);
    }
    if (resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(resourceId);
    }
    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const result = await db.query(`
      SELECT * FROM audit_events 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return result.rows;
  }
}

module.exports = new AuditService();
```

**Continue reading to see Phase 2-5...**

---

## Implementation Status: ⚠️ NOT STARTED

### Next Steps:
1. Run database migrations (001_rbac.sql, 002_audit_logs.sql)
2. Implement RBAC middleware
3. Add audit logging to all admin endpoints
4. Create admin dashboard UI
5. Test permissions enforcement

**Estimated Time:** 3 weeks for Phase 1
**Priority:** P0 - Must complete before production use

---

*Full implementation continues in next sections...*
