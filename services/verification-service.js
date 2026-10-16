/**
 * Identity & Property Verification Service
 * Handles document verification workflows
 */

const { Pool } = require('pg');
const auditService = require('./audit-service');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class VerificationService {
  /**
   * Get pending identity verifications
   */
  async getPendingIdentityVerifications(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT iv.*, u.name, u.email, u.phone
        FROM identity_verifications iv
        JOIN users u ON iv.user_id = u.id
        WHERE iv.status IN ('pending', 'under_review')
        ORDER BY iv.created_at ASC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Get pending verifications error:', error);
      return [];
    }
  }

  /**
   * Approve identity verification
   */
  async approveIdentityVerification(verificationId, reviewerId, score = 100) {
    try {
      const result = await pool.query(`
        UPDATE identity_verifications
        SET status = 'approved',
            reviewed_by = $2,
            reviewed_at = NOW(),
            verification_score = $3
        WHERE id = $1
        RETURNING *
      `, [verificationId, reviewerId, score]);

      if (result.rows.length > 0) {
        // Update user as verified
        await pool.query(`
          UPDATE users 
          SET is_verified = TRUE, verified_at = NOW()
          WHERE id = $1
        `, [result.rows[0].user_id]);

        // Audit log
        await auditService.log({
          eventType: 'identity_verification',
          actorId: reviewerId,
          action: 'approve_identity',
          resourceType: 'identity_verification',
          resourceId: verificationId,
          outcome: 'success',
          metadata: { userId: result.rows[0].user_id, score }
        });

        return { success: true, verification: result.rows[0] };
      }

      return { success: false, message: 'Verification not found' };
    } catch (error) {
      console.error('❌ Approve identity error:', error);
      throw error;
    }
  }

  /**
   * Reject identity verification
   */
  async rejectIdentityVerification(verificationId, reviewerId, reason) {
    try {
      const result = await pool.query(`
        UPDATE identity_verifications
        SET status = 'rejected',
            reviewed_by = $2,
            reviewed_at = NOW(),
            rejection_reason = $3
        WHERE id = $1
        RETURNING *
      `, [verificationId, reviewerId, reason]);

      if (result.rows.length > 0) {
        // Audit log
        await auditService.log({
          eventType: 'identity_verification',
          actorId: reviewerId,
          action: 'reject_identity',
          resourceType: 'identity_verification',
          resourceId: verificationId,
          outcome: 'success',
          metadata: { userId: result.rows[0].user_id, reason }
        });

        return { success: true, verification: result.rows[0] };
      }

      return { success: false, message: 'Verification not found' };
    } catch (error) {
      console.error('❌ Reject identity error:', error);
      throw error;
    }
  }

  /**
   * Get pending landlord verifications
   */
  async getPendingLandlordVerifications(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT lv.*, u.name, u.email, p.title as property_title
        FROM landlord_verifications lv
        JOIN users u ON lv.user_id = u.id
        LEFT JOIN properties p ON lv.property_id = p.id
        WHERE lv.status IN ('pending', 'under_review')
        ORDER BY lv.created_at ASC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Get pending landlord verifications error:', error);
      return [];
    }
  }

  /**
   * Approve landlord verification
   */
  async approveLandlordVerification(verificationId, verifierId) {
    try {
      const result = await pool.query(`
        UPDATE landlord_verifications
        SET status = 'approved',
            verified_by = $2,
            verified_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [verificationId, verifierId]);

      if (result.rows.length > 0) {
        const verification = result.rows[0];

        // Update user role to landlord if not already
        await pool.query(`
          UPDATE users 
          SET role = CASE WHEN role = 'tenant' THEN 'landlord' ELSE role END,
              is_landlord = TRUE
          WHERE id = $1
        `, [verification.user_id]);

        // If property linked, mark as verified
        if (verification.property_id) {
          await pool.query(`
            UPDATE properties 
            SET is_verified = TRUE, status = 'approved'
            WHERE id = $1
          `, [verification.property_id]);
        }

        // Audit log
        await auditService.log({
          eventType: 'landlord_verification',
          actorId: verifierId,
          action: 'approve_landlord',
          resourceType: 'landlord_verification',
          resourceId: verificationId,
          outcome: 'success',
          metadata: { userId: verification.user_id, propertyId: verification.property_id }
        });

        return { success: true, verification };
      }

      return { success: false, message: 'Verification not found' };
    } catch (error) {
      console.error('❌ Approve landlord error:', error);
      throw error;
    }
  }

  /**
   * Reject landlord verification
   */
  async rejectLandlordVerification(verificationId, verifierId, reason) {
    try {
      const result = await pool.query(`
        UPDATE landlord_verifications
        SET status = 'rejected',
            verified_by = $2,
            verified_at = NOW(),
            rejection_reason = $3
        WHERE id = $1
        RETURNING *
      `, [verificationId, verifierId, reason]);

      if (result.rows.length > 0) {
        // Audit log
        await auditService.log({
          eventType: 'landlord_verification',
          actorId: verifierId,
          action: 'reject_landlord',
          resourceType: 'landlord_verification',
          resourceId: verificationId,
          outcome: 'success',
          metadata: { reason }
        });

        return { success: true, verification: result.rows[0] };
      }

      return { success: false, message: 'Verification not found' };
    } catch (error) {
      console.error('❌ Reject landlord error:', error);
      throw error;
    }
  }
}

module.exports = new VerificationService();
