/**
 * Advanced Analytics Service
 * Revenue metrics, user behavior, property performance
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AnalyticsService {
  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(startDate, endDate) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'completed' AND transaction_type = 'commission' THEN amount ELSE 0 END) as commission_revenue,
          SUM(CASE WHEN status = 'completed' AND transaction_type = 'service_fee' THEN amount ELSE 0 END) as service_revenue,
          SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as refunded_amount,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_transaction
        FROM transactions
        WHERE created_at >= $1 AND created_at <= $2
      `, [startDate, endDate]);

      return result.rows[0] || {};
    } catch (error) {
      console.error('❌ Get revenue metrics error:', error);
      return {};
    }
  }

  /**
   * Get user growth metrics
   */
  async getUserGrowthMetrics(days = 30) {
    try {
      const result = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users,
          SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Get user growth error:', error);
      return [];
    }
  }

  /**
   * Get property performance
   */
  async getPropertyPerformance(limit = 100) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id,
          p.title,
          p.location,
          p.price,
          p.views,
          COUNT(DISTINCT i.id) as inquiries,
          COUNT(DISTINCT r.id) as reviews,
          AVG(r.rating) as avg_rating,
          p.created_at,
          p.is_verified
        FROM properties p
        LEFT JOIN inquiries i ON p.id = i.property_id
        LEFT JOIN reviews r ON p.id = r.property_id
        WHERE p.status IN ('approved', 'verified')
        GROUP BY p.id
        ORDER BY p.views DESC, inquiries DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Get property performance error:', error);
      return [];
    }
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehaviorMetrics() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'tenant') as tenants,
          COUNT(*) FILTER (WHERE role = 'landlord' OR is_landlord = TRUE) as landlords,
          COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_users,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_7days,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '30 days') as active_30days,
          COUNT(*) FILTER (WHERE is_admin = TRUE) as admins
        FROM users
      `);

      return result.rows[0] || {};
    } catch (error) {
      console.error('❌ Get user behavior error:', error);
      return {};
    }
  }

  /**
   * Get listing metrics
   */
  async getListingMetrics() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_listings,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved' OR status = 'verified') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE is_verified = TRUE) as verified,
          COUNT(*) FILTER (WHERE is_featured = TRUE) as featured,
          AVG(price) as avg_price,
          AVG(views) as avg_views
        FROM properties
      `);

      return result.rows[0] || {};
    } catch (error) {
      console.error('❌ Get listing metrics error:', error);
      return {};
    }
  }

  /**
   * Get daily analytics summary
   */
  async getDailySummary(date) {
    try {
      const [users, properties, transactions, inquiries] = await Promise.all([
        pool.query(`
          SELECT COUNT(*) as count FROM users 
          WHERE DATE(created_at) = $1
        `, [date]),
        pool.query(`
          SELECT COUNT(*) as count FROM properties 
          WHERE DATE(created_at) = $1
        `, [date]),
        pool.query(`
          SELECT COUNT(*) as count, SUM(amount) as total
          FROM transactions 
          WHERE DATE(created_at) = $1 AND status = 'completed'
        `, [date]),
        pool.query(`
          SELECT COUNT(*) as count FROM inquiries 
          WHERE DATE(created_at) = $1
        `, [date])
      ]);

      return {
        date,
        new_users: parseInt(users.rows[0]?.count || 0),
        new_properties: parseInt(properties.rows[0]?.count || 0),
        transactions: parseInt(transactions.rows[0]?.count || 0),
        revenue: parseFloat(transactions.rows[0]?.total || 0),
        inquiries: parseInt(inquiries.rows[0]?.count || 0)
      };
    } catch (error) {
      console.error('❌ Get daily summary error:', error);
      return {};
    }
  }
}

module.exports = new AnalyticsService();
