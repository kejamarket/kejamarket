/**
 * RBAC Service - Role and permission management
 */

const { Pool } = require('pg');
const auditService = require('./audit-service');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class RBACService {
  /**
   * Assign role to user
   */
  async assignRole(userId, roleId, assignedBy, expiresAt = null) {
    try {
      // Check if role exists
      const roleCheck = await pool.query('SELECT name FROM roles WHERE id = $1', [roleId]);
      if (roleCheck.rows.length === 0) {
        throw new Error('Role not found');
      }

      // Assign role
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (user_id, role_id) 
        DO UPDATE SET is_active = TRUE, assigned_at = NOW(), assigned_by = $3, expires_at = $4
      `, [userId, roleId, assignedBy, expiresAt]);

      // Audit log
      await auditService.log({
        eventType: 'role_assignment',
        actorId: assignedBy,
        action: 'assign_role',
        resourceType: 'user',
        resourceId: userId,
        afterState: { roleId, expiresAt },
        outcome: 'success',
        metadata: { roleName: roleCheck.rows[0].name }
      });

      return { success: true, message: 'Role assigned successfully' };
    } catch (error) {
      console.error('❌ Assign role failed:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(userId, roleId, revokedBy) {
    try {
      const result = await pool.query(`
        UPDATE user_roles 
        SET is_active = FALSE
        WHERE user_id = $1 AND role_id = $2
        RETURNING *
      `, [userId, roleId]);

      if (result.rows.length === 0) {
        throw new Error('Role assignment not found');
      }

      // Audit log
      await auditService.log({
        eventType: 'role_revocation',
        actorId: revokedBy,
        action: 'revoke_role',
        resourceType: 'user',
        resourceId: userId,
        beforeState: { roleId },
        outcome: 'success'
      });

      return { success: true, message: 'Role revoked successfully' };
    } catch (error) {
      console.error('❌ Revoke role failed:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles() {
    try {
      const result = await pool.query(`
        SELECT r.*, 
               COUNT(DISTINCT ur.user_id) as user_count,
               COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = TRUE
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id
        ORDER BY r.name
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Get all roles failed:', error);
      return [];
    }
  }

  /**
   * Get role details with permissions
   */
  async getRoleDetails(roleId) {
    try {
      const role = await pool.query('SELECT * FROM roles WHERE id = $1', [roleId]);
      if (role.rows.length === 0) {
        return null;
      }

      const permissions = await pool.query(`
        SELECT p.*
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action
      `, [roleId]);

      return {
        ...role.rows[0],
        permissions: permissions.rows
      };
    } catch (error) {
      console.error('❌ Get role details failed:', error);
      return null;
    }
  }

  /**
   * Get users with a specific role
   */
  async getUsersWithRole(roleId) {
    try {
      const result = await pool.query(`
        SELECT u.id, u.name, u.email, u.phone, ur.assigned_at, ur.expires_at
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.role_id = $1 AND ur.is_active = TRUE
        ORDER BY ur.assigned_at DESC
      `, [roleId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get users with role failed:', error);
      return [];
    }
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(requesterId, actionType, resourceType, resourceId, reason, requestData) {
    try {
      const result = await pool.query(`
        INSERT INTO approval_requests (
          requester_id, action_type, resource_type, resource_id, reason, request_data, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [requesterId, actionType, resourceType, resourceId, reason, JSON.stringify(requestData)]);

      // Audit log
      await auditService.log({
        eventType: 'approval_request',
        actorId: requesterId,
        action: 'request_approval',
        resourceType,
        resourceId,
        outcome: 'success',
        metadata: { actionType, approvalId: result.rows[0].id }
      });

      return result.rows[0];
    } catch (error) {
      console.error('❌ Create approval request failed:', error);
      throw error;
    }
  }

  /**
   * Approve request
   */
  async approveRequest(approvalId, approverId, execute = false) {
    try {
      // Get request
      const request = await pool.query(
        'SELECT * FROM approval_requests WHERE id = $1 AND status = $2',
        [approvalId, 'pending']
      );

      if (request.rows.length === 0) {
        throw new Error('Approval request not found or already processed');
      }

      // Check approver is not requester
      if (request.rows[0].requester_id === approverId) {
        throw new Error('Cannot approve your own request');
      }

      // Update status
      const status = execute ? 'executed' : 'approved';
      const result = await pool.query(`
        UPDATE approval_requests
        SET status = $1, approver_id = $2, reviewed_at = NOW(), 
            executed_at = CASE WHEN $1 = 'executed' THEN NOW() ELSE NULL END
        WHERE id = $3
        RETURNING *
      `, [status, approverId, approvalId]);

      // Audit log
      await auditService.log({
        eventType: 'approval_decision',
        actorId: approverId,
        action: 'approve_request',
        resourceType: request.rows[0].resource_type,
        resourceId: request.rows[0].resource_id,
        outcome: 'success',
        metadata: { approvalId, actionType: request.rows[0].action_type, executed: execute }
      });

      return result.rows[0];
    } catch (error) {
      console.error('❌ Approve request failed:', error);
      throw error;
    }
  }

  /**
   * Reject request
   */
  async rejectRequest(approvalId, approverId, rejectionReason) {
    try {
      const result = await pool.query(`
        UPDATE approval_requests
        SET status = 'rejected', approver_id = $1, reviewed_at = NOW(), rejection_reason = $2
        WHERE id = $3 AND status = 'pending'
        RETURNING *
      `, [approverId, rejectionReason, approvalId]);

      if (result.rows.length === 0) {
        throw new Error('Approval request not found or already processed');
      }

      // Audit log
      await auditService.log({
        eventType: 'approval_decision',
        actorId: approverId,
        action: 'reject_request',
        resourceType: result.rows[0].resource_type,
        resourceId: result.rows[0].resource_id,
        outcome: 'success',
        metadata: { approvalId, reason: rejectionReason }
      });

      return result.rows[0];
    } catch (error) {
      console.error('❌ Reject request failed:', error);
      throw error;
    }
  }
}

module.exports = new RBACService();
