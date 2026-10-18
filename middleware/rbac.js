/**
 * RBAC Middleware - Role-Based Access Control
 * Enforces permissions on admin endpoints
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Check if a user has a specific permission
 * @param {string} userId - User ID
 * @param {string} requiredPermission - Permission name (e.g., 'listing.approve')
 * @returns {Promise<boolean>}
 */
async function checkPermission(userId, requiredPermission) {
  // Super admin / system owner always has all permissions
  if (userId === 'usr-admin-01') return true;
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1 
          AND p.name = $2
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ) as has_permission
    `, [userId, requiredPermission]);
    
    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('❌ Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>}
 */
async function getUserPermissions(userId) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.name
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.name
    `, [userId]);
    
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('❌ Get user permissions error:', error);
    return [];
  }
}

/**
 * Get all roles for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<object>>}
 */
async function getUserRoles(userId) {
  try {
    const result = await pool.query(`
      SELECT r.id, r.name, r.description, ur.assigned_at, ur.expires_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY r.name
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Get user roles error:', error);
    return [];
  }
}

/**
 * Middleware: Require specific permission
 * Usage: app.get('/api/admin/users', requirePermission('user.view'), handler)
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Please log in' 
      });
    }

    // Super admin bypass
    if (req.user.id === 'usr-admin-01' || req.user.adminRole === 'super' || (req.user.role === 'admin' && !req.user.adminRole)) {
      req.permission = permission;
      return next();
    }
    
    const hasPermission = await checkPermission(req.user.id, permission);
    
    if (!hasPermission) {
      // Log unauthorized access attempt
      console.warn(`⚠️  Unauthorized access attempt: User ${req.user.id} tried to access ${permission}`);
      
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: permission
      });
    }
    
    // Add permission info to request for audit logging
    req.permission = permission;
    next();
  };
}

/**
 * Middleware: Require ANY of the specified permissions
 * Usage: app.get('/api/admin/items', requireAnyPermission('listing.view', 'user.view'), handler)
 */
function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Please log in' 
      });
    }

    // Super admin bypass
    if (req.user.id === 'usr-admin-01' || req.user.adminRole === 'super' || (req.user.role === 'admin' && !req.user.adminRole)) {
      req.permission = permissions[0];
      return next();
    }
    
    for (const permission of permissions) {
      const hasPermission = await checkPermission(req.user.id, permission);
      if (hasPermission) {
        req.permission = permission;
        return next();
      }
    }
    
    console.warn(`⚠️  Unauthorized access attempt: User ${req.user.id} lacks any of: ${permissions.join(', ')}`);
    
    return res.status(403).json({ 
      success: false, 
      message: 'Insufficient permissions',
      required_any: permissions
    });
  };
}

/**
 * Middleware: Require ALL specified permissions
 * Usage: app.post('/api/admin/refund', requireAllPermissions('refund.request', 'payment.view'), handler)
 */
function requireAllPermissions(...permissions) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Please log in' 
      });
    }

    // Super admin bypass
    if (req.user.id === 'usr-admin-01' || req.user.adminRole === 'super' || (req.user.role === 'admin' && !req.user.adminRole)) {
      req.permissions = permissions;
      return next();
    }
    
    const missingPermissions = [];
    
    for (const permission of permissions) {
      const hasPermission = await checkPermission(req.user.id, permission);
      if (!hasPermission) {
        missingPermissions.push(permission);
      }
    }
    
    if (missingPermissions.length > 0) {
      console.warn(`⚠️  Unauthorized access: User ${req.user.id} missing: ${missingPermissions.join(', ')}`);
      
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required_all: permissions,
        missing: missingPermissions
      });
    }
    
    req.permissions = permissions;
    next();
  };
}

/**
 * Middleware: Require admin role (any admin)
 * Quick helper for general admin access
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - Please log in' 
    });
  }
  
  if (!req.user.is_admin && !req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required'  
    });
  }
  
  next();
}

module.exports = {
  checkPermission,
  getUserPermissions,
  getUserRoles,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  pool // Export for services
};
