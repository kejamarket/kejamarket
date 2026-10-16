-- KejaMarket RBAC (Role-Based Access Control) Migration
-- Phase 1: Security & Trust Foundation

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT ('role-' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY DEFAULT ('perm-' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Role-Permission junction
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role junction (extends existing users table)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, role_id)
);

-- Approval requests for privileged actions
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY DEFAULT ('approval-' || gen_random_uuid()::text),
  requester_id TEXT NOT NULL REFERENCES users(id),
  approver_id TEXT REFERENCES users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  reason TEXT,
  request_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_requests(status, requested_at);

-- Seed default roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('role-super-admin', 'Super Admin', 'Full system access - emergency use only', TRUE),
  ('role-ops-admin', 'Operations Admin', 'Manage listings, users, and concierge workflows', TRUE),
  ('role-verification-officer', 'Verification Officer', 'Review identity and property verification', TRUE),
  ('role-finance-officer', 'Finance Officer', 'View transactions and reconcile payments', TRUE),
  ('role-finance-approver', 'Finance Approver', 'Approve refunds and high-value operations', TRUE),
  ('role-support-agent', 'Support Agent', 'Handle customer inquiries and complaints', TRUE),
  ('role-auditor', 'Auditor', 'Read-only access to audit logs and reports', TRUE),
  ('role-system-operator', 'System Operator', 'Monitor infrastructure and backups', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Listings
  ('listing.view', 'listing', 'view', 'View all listings'),
  ('listing.approve', 'listing', 'approve', 'Approve pending listings'),
  ('listing.reject', 'listing', 'reject', 'Reject listings'),
  ('listing.edit', 'listing', 'edit', 'Edit listing details'),
  ('listing.delete', 'listing', 'delete', 'Delete listings'),
  ('listing.feature', 'listing', 'feature', 'Mark listings as featured'),
  
  -- Users
  ('user.view', 'user', 'view', 'View user profiles and details'),
  ('user.edit', 'user', 'edit', 'Edit user information'),
  ('user.ban', 'user', 'ban', 'Ban or suspend users'),
  ('user.verify', 'user', 'verify', 'Verify user accounts'),
  
  -- Identity verification
  ('identity.review', 'identity', 'review', 'Review verification documents'),
  ('identity.approve', 'identity', 'approve', 'Approve identity verification'),
  ('identity.reject', 'identity', 'reject', 'Reject verification'),
  
  -- Property verification
  ('property.review', 'property', 'review', 'Review property ownership documents'),
  ('property.verify', 'property', 'verify', 'Verify property ownership'),
  
  -- Payments
  ('payment.view', 'payment', 'view', 'View transaction history'),
  ('payment.reconcile', 'payment', 'reconcile', 'Reconcile payments'),
  ('payment.export', 'payment', 'export', 'Export payment reports'),
  
  -- Refunds
  ('refund.view', 'refund', 'view', 'View refund requests'),
  ('refund.request', 'refund', 'request', 'Create refund requests'),
  ('refund.approve', 'refund', 'approve', 'Approve refund requests'),
  ('refund.execute', 'refund', 'execute', 'Execute approved refunds'),
  
  -- Admin
  ('admin.manage_roles', 'admin', 'manage_roles', 'Manage roles and permissions'),
  ('admin.manage_users', 'admin', 'manage_users', 'Manage admin users'),
  
  -- Audit
  ('audit.read', 'audit', 'read', 'View audit logs'),
  ('audit.export', 'audit', 'export', 'Export audit reports'),
  
  -- System
  ('system.monitor', 'system', 'monitor', 'View system health and metrics'),
  ('system.config', 'system', 'config', 'Manage system configuration'),
  
  -- Fraud
  ('fraud.review', 'fraud', 'review', 'Review fraud signals'),
  ('fraud.investigate', 'fraud', 'investigate', 'Investigate suspicious activity')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to roles

-- Super Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-super-admin', id, 'system' FROM permissions
ON CONFLICT DO NOTHING;

-- Operations Admin: listings, users, auditing
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-ops-admin', id, 'system' FROM permissions 
WHERE resource IN ('listing', 'user', 'fraud') OR name IN ('audit.read', 'system.monitor')
ON CONFLICT DO NOTHING;

-- Verification Officer: identity and property verification
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-verification-officer', id, 'system' FROM permissions 
WHERE resource IN ('identity', 'property') OR name IN ('user.view', 'listing.view', 'audit.read')
ON CONFLICT DO NOTHING;

-- Finance Officer: view and reconcile, request refunds
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-finance-officer', id, 'system' FROM permissions 
WHERE name IN ('payment.view', 'payment.reconcile', 'payment.export', 'refund.view', 'refund.request', 'audit.read')
ON CONFLICT DO NOTHING;

-- Finance Approver: approve and execute refunds
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-finance-approver', id, 'system' FROM permissions 
WHERE name IN ('payment.view', 'refund.view', 'refund.approve', 'refund.execute', 'audit.read')
ON CONFLICT DO NOTHING;

-- Support Agent: limited access
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-support-agent', id, 'system' FROM permissions 
WHERE name IN ('user.view', 'listing.view', 'payment.view', 'audit.read')
ON CONFLICT DO NOTHING;

-- Auditor: read-only everything
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-auditor', id, 'system' FROM permissions 
WHERE action IN ('view', 'read') OR name IN ('payment.export', 'audit.export')
ON CONFLICT DO NOTHING;

-- System Operator: monitoring and system
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT 'role-system-operator', id, 'system' FROM permissions 
WHERE resource = 'system' OR name IN ('audit.read')
ON CONFLICT DO NOTHING;

-- Add admin column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_admin_action_at TIMESTAMPTZ;

COMMENT ON TABLE roles IS 'Admin roles for RBAC system';
COMMENT ON TABLE permissions IS 'Granular permissions for admin actions';
COMMENT ON TABLE user_roles IS 'User-to-role assignments with expiry';
COMMENT ON TABLE approval_requests IS 'Two-person approval for high-risk operations';
