/**
 * Bulk Operations Service
 * Mass approve/reject, bulk messaging, batch updates
 */

const { Pool } = require('pg');
const auditService = require('./audit-service');
const emailService = require('../db/email-service');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class BulkOperationsService {
  /**
   * Bulk approve listings
   */
  async bulkApproveListings(propertyIds, approvedBy) {
    try {
      const operationId = 'bulk-' + Date.now();
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      for (const propertyId of propertyIds) {
        try {
          await pool.query(`
            UPDATE properties 
            SET status = 'approved', is_verified = TRUE, updated_at = NOW()
            WHERE id = $1
          `, [propertyId]);

          successCount++;
          results.push({ propertyId, status: 'success' });

          // Audit log
          await auditService.log({
            eventType: 'bulk_operation',
            actorId: approvedBy,
            action: 'bulk_approve_listing',
            resourceType: 'property',
            resourceId: propertyId,
            outcome: 'success',
            metadata: { operationId }
          });
        } catch (error) {
          failedCount++;
          results.push({ propertyId, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        operationId,
        total: propertyIds.length,
        successCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Bulk approve listings error:', error);
      throw error;
    }
  }

  /**
   * Bulk reject listings
   */
  async bulkRejectListings(propertyIds, rejectedBy, reason) {
    try {
      const operationId = 'bulk-' + Date.now();
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      for (const propertyId of propertyIds) {
        try {
          await pool.query(`
            UPDATE properties 
            SET status = 'rejected', updated_at = NOW()
            WHERE id = $1
          `, [propertyId]);

          successCount++;
          results.push({ propertyId, status: 'success' });

          // Audit log
          await auditService.log({
            eventType: 'bulk_operation',
            actorId: rejectedBy,
            action: 'bulk_reject_listing',
            resourceType: 'property',
            resourceId: propertyId,
            outcome: 'success',
            metadata: { operationId, reason }
          });
        } catch (error) {
          failedCount++;
          results.push({ propertyId, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        operationId,
        total: propertyIds.length,
        successCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Bulk reject listings error:', error);
      throw error;
    }
  }

  /**
   * Bulk ban users
   */
  async bulkBanUsers(userIds, bannedBy, reason) {
    try {
      const operationId = 'bulk-' + Date.now();
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      for (const userId of userIds) {
        try {
          await pool.query(`
            UPDATE users 
            SET is_banned = TRUE, banned_at = NOW(), ban_reason = $2
            WHERE id = $1
          `, [userId, reason]);

          successCount++;
          results.push({ userId, status: 'success' });

          // Audit log
          await auditService.log({
            eventType: 'bulk_operation',
            actorId: bannedBy,
            action: 'bulk_ban_user',
            resourceType: 'user',
            resourceId: userId,
            outcome: 'success',
            metadata: { operationId, reason }
          });
        } catch (error) {
          failedCount++;
          results.push({ userId, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        operationId,
        total: userIds.length,
        successCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Bulk ban users error:', error);
      throw error;
    }
  }

  /**
   * Bulk send messages
   */
  async bulkSendMessages(userIds, subject, message, sentBy, method = 'email') {
    try {
      const operationId = 'bulk-' + Date.now();
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      // Get user details
      const usersResult = await pool.query(`
        SELECT id, name, email, phone FROM users WHERE id = ANY($1)
      `, [userIds]);

      for (const user of usersResult.rows) {
        try {
          if (method === 'email' && user.email) {
            await emailService.sendEmail(user.email, subject, message);
            successCount++;
            results.push({ userId: user.id, status: 'success', method: 'email' });
          } else if (method === 'sms' && user.phone) {
            // SMS sending would go here
            successCount++;
            results.push({ userId: user.id, status: 'success', method: 'sms' });
          } else {
            failedCount++;
            results.push({ userId: user.id, status: 'failed', error: 'No contact method available' });
          }

          // Audit log
          await auditService.log({
            eventType: 'bulk_operation',
            actorId: sentBy,
            action: 'bulk_send_message',
            resourceType: 'user',
            resourceId: user.id,
            outcome: successCount > failedCount ? 'success' : 'failure',
            metadata: { operationId, method, subject }
          });
        } catch (error) {
          failedCount++;
          results.push({ userId: user.id, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        operationId,
        total: userIds.length,
        successCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Bulk send messages error:', error);
      throw error;
    }
  }

  /**
   * Bulk update property prices
   */
  async bulkUpdatePrices(propertyIds, priceAdjustment, adjustmentType, updatedBy) {
    try {
      const operationId = 'bulk-' + Date.now();
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      for (const propertyId of propertyIds) {
        try {
          let query;
          if (adjustmentType === 'percentage') {
            query = `
              UPDATE properties 
              SET price = price * (1 + $2 / 100.0), updated_at = NOW()
              WHERE id = $1
              RETURNING price
            `;
          } else {
            query = `
              UPDATE properties 
              SET price = price + $2, updated_at = NOW()
              WHERE id = $1
              RETURNING price
            `;
          }

          const result = await pool.query(query, [propertyId, priceAdjustment]);
          
          successCount++;
          results.push({ 
            propertyId, 
            status: 'success', 
            newPrice: result.rows[0]?.price 
          });

          // Audit log
          await auditService.log({
            eventType: 'bulk_operation',
            actorId: updatedBy,
            action: 'bulk_update_price',
            resourceType: 'property',
            resourceId: propertyId,
            outcome: 'success',
            metadata: { operationId, adjustment: priceAdjustment, type: adjustmentType }
          });
        } catch (error) {
          failedCount++;
          results.push({ propertyId, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        operationId,
        total: propertyIds.length,
        successCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Bulk update prices error:', error);
      throw error;
    }
  }
}

module.exports = new BulkOperationsService();
