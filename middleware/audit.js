/**
 * Audit Middleware - Automatic audit logging
 * Logs all admin actions to audit_events table
 */

const auditService = require('../services/audit-service');

/**
 * Middleware: Audit all requests
 * Auto-logs admin actions with before/after states
 * Usage: app.use('/api/admin/*', auditRequest);
 */
function auditRequest(req, res, next) {
  // Store original methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Generate request ID
  req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Capture request start time
  const startTime = Date.now();
  
  // Override res.json to capture response
  res.json = function(body) {
    res.json = originalJson;
    
    // Log audit event
    setImmediate(() => {
      const duration = Date.now() - startTime;
      
      auditService.log({
        eventType: 'api_request',
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: `${req.method} ${req.path}`,
        resourceType: extractResourceType(req.path),
        resourceId: extractResourceId(req),
        requestId: req.requestId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        errorMessage: body?.message || body?.error,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: duration,
          query: req.query,
          permission: req.permission || req.permissions
        }
      });
    });
    
    return originalJson.call(this, body);
  };
  
  // Override res.send too (for non-JSON responses)
  res.send = function(body) {
    res.send = originalSend;
    
    setImmediate(() => {
      const duration = Date.now() - startTime;
      
      auditService.log({
        eventType: 'api_request',
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: `${req.method} ${req.path}`,
        resourceType: extractResourceType(req.path),
        requestId: req.requestId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: duration
        }
      });
    });
    
    return originalSend.call(this, body);
  };
  
  next();
}

/**
 * Middleware: Audit specific action with custom details
 * Usage: app.post('/api/admin/approve', auditAction('listing_approved'), handler)
 */
function auditAction(action, options = {}) {
  return (req, res, next) => {
    // Add audit function to request
    req.audit = async (details = {}) => {
      await auditService.log({
        eventType: options.eventType || 'admin_action',
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: action,
        resourceType: details.resourceType || extractResourceType(req.path),
        resourceId: details.resourceId || extractResourceId(req),
        beforeState: details.before,
        afterState: details.after,
        requestId: req.requestId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        outcome: details.outcome || 'success',
        errorMessage: details.error,
        metadata: {
          ...options.metadata,
          ...details.metadata
        }
      });
    };
    
    next();
  };
}

/**
 * Log authentication failure
 */
async function logAuthFailure(identifier, reason, req) {
  try {
    await auditService.logAuthFailure({
      identifier,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      failureReason: reason
    });
  } catch (error) {
    console.error('❌ Failed to log auth failure:', error);
  }
}

/**
 * Extract resource type from URL path
 */
function extractResourceType(path) {
  const match = path.match(/\/api\/admin\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req) {
  // Try common ID patterns
  return req.params.id || 
         req.params.userId || 
         req.params.propertyId || 
         req.params.listingId ||
         req.body?.id ||
         null;
}

module.exports = {
  auditRequest,
  auditAction,
  logAuthFailure
};
