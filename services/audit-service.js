/**
 * Audit Service - Centralized audit logging
 * Writes to immutable audit_events table
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AuditService {
  /**
   * Log an audit event
   */
  async log({
    eventType,
    actorId,
    actorName,
    actorRole,
    action,
    resourceType,
    resourceId,
    beforeState,
    afterState,
    requestId,
    ipAddress,
    userAgent,
    outcome = 'success',
    errorMessage,
    severity = 'info',
    metadata = {}
  }) {
    try {
      await pool.query(`
        INSERT INTO audit_events (
          event_type, actor_id, actor_name, actor_role, action, 
          resource_type, resource_id, before_state, after_state,
          request_id, ip_address, user_agent, outcome, error_message,
          severity, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        eventType,
        actorId,
        actorName,
        actorRole,
        action,
        resourceType,
        resourceId,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        requestId,
        ipAddress,
        userAgent,
        outcome,
        errorMessage,
        severity,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      // Don't throw - audit failure shouldn't break the main operation
      console.error('❌ Audit log write failed:', error.message);
    }
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure({ identifier, ipAddress, userAgent, failureReason }) {
    try {
      await pool.query(`
        INSERT INTO auth_failures (identifier, ip_address, user_agent, failure_reason)
        VALUES ($1, $2, $3, $4)
      `, [identifier, ipAddress, userAgent, failureReason]);
    } catch (error) {
      console.error('❌ Auth failure log failed:', error.message);
    }
  }

  /**
   * Get activity log with filters
   */
  async getActivityLog({
    actorId,
    resourceType,
    resourceId,
    action,
    eventType,
    outcome,
    severity,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = {}) {
    try {
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
        conditions.push(`action ILIKE $${paramIndex++}`);
        params.push(`%${action}%`);
      }
      if (eventType) {
        conditions.push(`event_type = $${paramIndex++}`);
        params.push(eventType);
      }
      if (outcome) {
        conditions.push(`outcome = $${paramIndex++}`);
        params.push(outcome);
      }
      if (severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(severity);
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
      
      const result = await pool.query(`
        SELECT 
          id, event_type, actor_id, actor_name, actor_role, action,
          resource_type, resource_id, outcome, error_message, severity,
          created_at, metadata
        FROM audit_events 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get activity log failed:', error);
      return [];
    }
  }

  /**
   * Get security events (failed auth, permission denials, etc.)
   */
  async getSecurityEvents({ startDate, endDate, limit = 100 } = {}) {
    try {
      let params = [];
      let conditions = ["severity IN ('warning', 'error', 'critical') OR outcome = 'failure'"];
      let paramIndex = 1;

      if (startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(endDate);
      }

      const result = await pool.query(`
        SELECT 
          id, event_type, actor_id, action, resource_type, resource_id,
          outcome, error_message, severity, ip_address, created_at
        FROM audit_events
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${paramIndex}
      `, [...params, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get security events failed:', error);
      return [];
    }
  }

  /**
   * Get auth failures
   */
  async getAuthFailures({ identifier, ipAddress, startDate, endDate, limit = 100 } = {}) {
    try {
      let conditions = [];
      let params = [];
      let paramIndex = 1;

      if (identifier) {
        conditions.push(`identifier = $${paramIndex++}`);
        params.push(identifier);
      }
      if (ipAddress) {
        conditions.push(`ip_address = $${paramIndex++}`);
        params.push(ipAddress);
      }
      if (startDate) {
        conditions.push(`attempted_at >= $${paramIndex++}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`attempted_at <= $${paramIndex++}`);
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await pool.query(`
        SELECT * FROM auth_failures
        ${whereClause}
        ORDER BY attempted_at DESC
        LIMIT $${paramIndex}
      `, [...params, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get auth failures failed:', error);
      return [];
    }
  }

  /**
   * Get audit summary statistics
   */
  async getSummary({ startDate, endDate } = {}) {
    try {
      let params = [];
      let paramIndex = 1;
      let conditions = [];

      if (startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT actor_id) as unique_actors,
          COUNT(CASE WHEN outcome = 'success' THEN 1 END) as successful_events,
          COUNT(CASE WHEN outcome = 'failure' THEN 1 END) as failed_events,
          COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END) as critical_events
        FROM audit_events
        ${whereClause}
      `, params);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Get audit summary failed:', error);
      return null;
    }
  }
}

module.exports = new AuditService();
