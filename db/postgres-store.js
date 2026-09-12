/**
 * KejaMarket - PostgreSQL Database Layer
 * Production-ready database for 50,000+ users with full ACID compliance
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class PostgreSQLStore {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.fallbackStore = null;
  }

  async init() {
    // Initialize PostgreSQL connection
    const config = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    try {
      this.pool = new Pool(config);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL connected successfully');
      
      // Ensure admin user exists
      await this.ensureAdminUser();
      
      return true;
    } catch (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
      
      // Fallback to JSON store for development
      this.fallbackStore = require('./store.js');
      console.log('🔄 Using JSON file fallback');
      
      return false;
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.log('⚠️  Slow query:', duration + 'ms', text);
      }
      
      return res;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  async ensureAdminUser() {
    if (!this.isConnected) return;
    
    const adminPasswordHash = await bcrypt.hash('Stallon@jevugwe4', 10);
    
    const query = `
      INSERT INTO users (
        id, name, phone, email, password, role, is_admin, is_verified, 
        num_properties, area, created_at, raw_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        is_admin = EXCLUDED.is_admin,
        is_verified = EXCLUDED.is_verified
    `;

    const values = [
      'usr-admin-01',
      'KejaMarket Administrator', 
      '0700000000',
      'admin@kejamarket.co.ke',
      adminPasswordHash,
      'admin',
      true,
      true,
      '10+',
      'Nairobi Metro',
      new Date().toISOString(),
      JSON.stringify({})
    ];

    await this.query(query, values);
  }

  // ═══════════════════════════════════════════════════════════════════
  // USER METHODS
  // ═══════════════════════════════════════════════════════════════════

  async createUser(userData) {
    if (!this.isConnected) {
      return this.fallbackStore.createUser(userData);
    }

    const { name, phone, email, password, role, numProperties, area, agencyName, contactPerson, officeLocation, registrationNo, coverageArea } = userData;
    
    const cleanPhone = phone.replace(/\s+/g, '');
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check for duplicates
    const dupCheck = await this.query(
      'SELECT id FROM users WHERE phone = $1 OR email = $2',
      [cleanPhone, cleanEmail]
    );
    
    if (dupCheck.rows.length > 0) {
      throw new Error('An account with this phone number or email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'tenant';
    const userId = 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const query = `
      INSERT INTO users (
        id, name, phone, email, password, role, is_phone_verified, is_verified,
        num_properties, area, agency_name, contact_person, office_location, 
        registration_no, coverage_area, created_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      userId, name.trim(), cleanPhone, cleanEmail, hashedPassword, userRole, true,
      userRole === 'tenant' || userRole === 'agency',
      userRole === 'landlord' ? (numProperties || '1') : null,
      userRole === 'landlord' ? (area || '') : null,
      userRole === 'agency' ? (agencyName || name.trim()) : null,
      userRole === 'agency' ? (contactPerson || name.trim()) : null,
      userRole === 'agency' ? (officeLocation || '') : null,
      userRole === 'agency' ? (registrationNo || '') : null,
      userRole === 'agency' ? (coverageArea || area || '') : null,
      new Date().toISOString(),
      JSON.stringify({})
    ];

    const result = await this.query(query, values);
    return this.sanitizeUser(result.rows[0]);
  }

  async findUserByIdentifier(identifier) {
    if (!this.isConnected) {
      return this.fallbackStore.findUserByIdentifier(identifier);
    }

    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const cleanNumeric = clean.replace(/[\s+-]/g, '');

    const query = `
      SELECT * FROM users 
      WHERE phone = $1 
         OR email = $2 
         OR (phone = $3 AND $4 LIKE '0%')
         OR (phone = $5 AND $6 LIKE '254%')
         OR ($7 = 'admin' AND (id = 'usr-admin-01' OR role = 'admin'))
      LIMIT 1
    `;

    const values = [
      cleanNumeric,
      clean,
      '254' + cleanNumeric.slice(1), cleanNumeric,
      '0' + cleanNumeric.slice(3), cleanNumeric,
      clean
    ];

    const result = await this.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async authenticateUser(identifier, password, role = null) {
    if (!this.isConnected) {
      return this.fallbackStore.authenticateUser(identifier, password, role);
    }

    const cleanId = identifier.trim().toLowerCase();

    // Ensure admin user exists for admin logins
    if (cleanId.includes('admin') || cleanId === '0700000000') {
      await this.ensureAdminUser();
    }

    const user = await this.findUserByIdentifier(cleanId);
    if (!user) {
      throw new Error('No user found with this phone number or email.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Incorrect password. Please try again.');
    }

    // Update role if needed (except for system accounts)
    const isSystemAccount = user.id === 'usr-admin-01' || user.is_admin === true;
    if (role && user.role !== role && !isSystemAccount) {
      await this.query('UPDATE users SET role = $1 WHERE id = $2', [role, user.id]);
      user.role = role;
    }

    return this.sanitizeUser(user);
  }

  async getUserById(id) {
    if (!this.isConnected) {
      return this.fallbackStore.getUserById(id);
    }

    const result = await this.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.sanitizeUser(result.rows[0]) : null;
  }

  async updateUser(id, updates) {
    if (!this.isConnected) {
      return this.fallbackStore.updateUser(id, updates);
    }

    const fields = [];
    const values = [];
    let valueIndex = 1;

    if (updates.name) {
      fields.push(`name = $${valueIndex++}`);
      values.push(updates.name.trim());
    }
    if (updates.email) {
      fields.push(`email = $${valueIndex++}`);
      values.push(updates.email.trim());
    }
    if (updates.isVerified !== undefined) {
      fields.push(`is_verified = $${valueIndex++}`);
      values.push(updates.isVerified);
    }
    if (updates.area) {
      fields.push(`area = $${valueIndex++}`);
      values.push(updates.area);
    }
    if (updates.numProperties) {
      fields.push(`num_properties = $${valueIndex++}`);
      values.push(updates.numProperties);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    
    const result = await this.query(query, values);
    return result.rows.length > 0 ? this.sanitizeUser(result.rows[0]) : null;
  }

  sanitizeUser(user) {
    const { password, ...safe } = user;
    return safe;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROPERTY METHODS
  // ═══════════════════════════════════════════════════════════════════

  async getAllProperties() {
    if (!this.isConnected) {
      return this.fallbackStore.getAllProperties();
    }

    const result = await this.query(`
      SELECT p.*, 
             COALESCE(array_agg(pm.image_url) FILTER (WHERE pm.image_url IS NOT NULL), '{}') as photos
      FROM properties p 
      LEFT JOIN property_media pm ON p.id = pm.property_id 
      GROUP BY p.id 
      ORDER BY p.created_at DESC
    `);
    
    return result.rows.map(row => ({
      ...row.raw_data,
      id: row.id,
      title: row.title,
      rent: row.rent_kes,
      category: row.category,
      estateSuburb: row.estate_suburb,
      photos: row.photos || []
    }));
  }

  async getPropertyById(id) {
    if (!this.isConnected) {
      return this.fallbackStore.getPropertyById(id);
    }

    const result = await this.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;

    const property = result.rows[0];
    return {
      ...property.raw_data,
      id: property.id,
      title: property.title,
      rent: property.rent_kes,
      category: property.category,
      estateSuburb: property.estate_suburb
    };
  }

  async addProperty(property) {
    if (!this.isConnected) {
      return this.fallbackStore.addProperty(property);
    }

    const id = property.id || 'prop-usr-' + Date.now();
    const createdAt = new Date().toISOString();

    const query = `
      INSERT INTO properties (
        id, title, description, category, rent_period, bedrooms, bathrooms, 
        rent_kes, deposit_kes, county, corridor_id, estate_suburb, exact_location,
        latitude, longitude, water_supply_type, electricity_meter_type,
        is_featured, is_top_ad, is_verified, managed_by, agency_name,
        caretaker_name, caretaker_phone, landlord_id, created_at, 
        posted_time_ago, raw_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      ) RETURNING *
    `;

    const values = [
      id, property.title || '', property.description || '', property.category || '',
      property.rentPeriod || 'monthly', property.bedrooms || 0, property.bathrooms || 0,
      property.rent || 0, property.deposit || 0, property.county || 'Nairobi',
      property.corridorId || '', property.estateSuburb || '', property.exactLocation || '',
      property.latitude || null, property.longitude || null, 
      property.waterSupplyType || '', property.electricityMeterType || '',
      property.isFeatured || false, property.isTopAd || false, property.isVerified || false,
      property.managedBy || 'landlord', property.agencyName || '',
      property.caretakerName || '', property.caretakerPhone || '', property.landlordId || '',
      createdAt, property.postedTimeAgo || 'Just now', JSON.stringify(property)
    ];

    const result = await this.query(query, values);
    
    // Add photos if any
    if (property.photos && property.photos.length > 0) {
      for (let i = 0; i < property.photos.length; i++) {
        await this.query(
          'INSERT INTO property_media (id, property_id, image_url, display_order, raw_data) VALUES ($1, $2, $3, $4, $5)',
          [`media-${id}-${i}`, id, property.photos[i], i, JSON.stringify({})]
        );
      }
    }

    return { ...property, id, createdAt, postedTimeAgo: 'Just now' };
  }

  async updateProperty(id, updates) {
    if (!this.isConnected) {
      return this.fallbackStore.updateProperty(id, updates);
    }

    // Update PostgreSQL record
    await this.query(
      'UPDATE properties SET raw_data = raw_data || $1::jsonb WHERE id = $2',
      [JSON.stringify(updates), id]
    );

    // Get updated property
    return await this.getPropertyById(id);
  }

  async deleteProperty(id) {
    if (!this.isConnected) {
      return this.fallbackStore.deleteProperty(id);
    }

    const result = await this.query('DELETE FROM properties WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async boostProperty(propertyId, boostType = 'top_ad') {
    if (!this.isConnected) {
      return this.fallbackStore.boostProperty(propertyId, boostType);
    }

    const query = `
      UPDATE properties 
      SET is_top_ad = true, is_featured = true, 
          raw_data = raw_data || $1::jsonb
      WHERE id = $2 
      RETURNING *
    `;

    const boostData = {
      boostedAt: new Date().toISOString(),
      boostType
    };

    const result = await this.query(query, [JSON.stringify(boostData), propertyId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TRANSACTION METHODS
  // ═══════════════════════════════════════════════════════════════════

  async createTransaction(txData) {
    if (!this.isConnected) {
      return this.fallbackStore.createTransaction(txData);
    }

    const id = 'tx-' + Date.now();
    const createdAt = new Date().toISOString();

    const query = `
      INSERT INTO transactions (
        id, checkout_request_id, merchant_request_id, phone, amount,
        item_type, item_name, target_property_id, user_id, status,
        created_at, updated_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      id, txData.checkoutRequestId, txData.merchantRequestId || '',
      txData.phone, txData.amount, txData.itemType, txData.itemName,
      txData.targetPropertyId, txData.userId, txData.status || 'PENDING',
      createdAt, createdAt, JSON.stringify(txData)
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getTransactionByCheckoutId(checkoutRequestId) {
    if (!this.isConnected) {
      return this.fallbackStore.getTransactionByCheckoutId(checkoutRequestId);
    }

    const result = await this.query(
      'SELECT * FROM transactions WHERE checkout_request_id = $1',
      [checkoutRequestId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateTransaction(checkoutRequestId, updates) {
    if (!this.isConnected) {
      return this.fallbackStore.updateTransaction(checkoutRequestId, updates);
    }

    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (updates.status) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(updates.status);
    }
    if (updates.mpesaReceipt) {
      updateFields.push(`mpesa_receipt = $${valueIndex++}`);
      values.push(updates.mpesaReceipt);
    }
    if (updates.resultDesc) {
      updateFields.push(`result_desc = $${valueIndex++}`);
      values.push(updates.resultDesc);
    }

    updateFields.push(`updated_at = $${valueIndex++}`);
    values.push(new Date().toISOString());

    values.push(checkoutRequestId);

    const query = `
      UPDATE transactions 
      SET ${updateFields.join(', ')} 
      WHERE checkout_request_id = $${valueIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    if (result.rows.length === 0) return null;

    const tx = result.rows[0];

    // Auto-apply upgrades if successful
    if (updates.status === 'SUCCESS') {
      if (tx.target_property_id && (tx.item_type.startsWith('top_ad') || tx.item_type.startsWith('boost'))) {
        await this.boostProperty(tx.target_property_id, tx.item_type);
      }
      if (tx.user_id && tx.item_type === 'verified_badge') {
        await this.updateUser(tx.user_id, { isVerified: true });
      }
    }

    return tx;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADDITIONAL METHODS (Messages, Reviews, etc.)
  // ═══════════════════════════════════════════════════════════════════

  async saveMessage(msg) {
    if (!this.isConnected) {
      return this.fallbackStore.saveMessage(msg);
    }

    const id = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const createdAt = new Date().toISOString();

    const query = `
      INSERT INTO messages (
        id, property_id, property_title, estate_suburb, sender_id, sender_name,
        sender_phone, recipient_id, recipient_name, text, is_read, created_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      id, msg.propertyId || null, msg.propertyTitle || '', msg.estateSuburb || '',
      msg.senderId || 'guest-' + Date.now(), msg.senderName || 'Tenant',
      msg.senderPhone || '', msg.recipientId || null, msg.recipientName || 'Landlord',
      (msg.text || '').trim(), false, createdAt, JSON.stringify(msg)
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getMessages(propertyId = null, userId = null) {
    if (!this.isConnected) {
      return this.fallbackStore.getMessages(propertyId, userId);
    }

    let query = 'SELECT * FROM messages WHERE 1=1';
    const values = [];
    let valueIndex = 1;

    if (propertyId) {
      query += ` AND property_id = $${valueIndex++}`;
      values.push(propertyId);
    }
    if (userId) {
      query += ` AND (sender_id = $${valueIndex++} OR recipient_id = $${valueIndex++})`;
      values.push(userId, userId);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.query(query, values);
    return result.rows;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN & STATS METHODS
  // ═══════════════════════════════════════════════════════════════════

  async getOverviewStats() {
    if (!this.isConnected) {
      return this.fallbackStore.getOverviewStats();
    }

    const stats = await this.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'tenant') as tenants,
        (SELECT COUNT(*) FROM users WHERE role = 'landlord') as landlords,
        (SELECT COUNT(*) FROM properties) as total_properties,
        (SELECT COUNT(*) FROM properties WHERE raw_data->>'availability' != 'taken') as available_properties,
        (SELECT COUNT(*) FROM properties WHERE raw_data->>'availability' = 'taken') as taken_properties,
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM messages) as total_messages
    `);

    const recentUsers = await this.query(`
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT 50
    `);

    return {
      ...stats.rows[0],
      totalUsers: parseInt(stats.rows[0].total_users),
      tenants: parseInt(stats.rows[0].tenants),
      landlords: parseInt(stats.rows[0].landlords),
      totalProperties: parseInt(stats.rows[0].total_properties),
      availableProperties: parseInt(stats.rows[0].available_properties),
      takenProperties: parseInt(stats.rows[0].taken_properties),
      totalTransactions: parseInt(stats.rows[0].total_transactions),
      totalMessages: parseInt(stats.rows[0].total_messages),
      dbFilePath: 'PostgreSQL Database',
      recentUsers: recentUsers.rows.map(u => this.sanitizeUser(u))
    };
  }

  async getAllUsers() {
    if (!this.isConnected) {
      return this.fallbackStore.getAllUsers();
    }

    const result = await this.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(u => this.sanitizeUser(u));
  }

  // Fallback methods for compatibility
  async saveAlert(alert) {
    if (!this.isConnected) {
      return this.fallbackStore.saveAlert(alert);
    }
    
    const id = 'alert-' + Date.now();
    const createdAt = new Date().toISOString();
    
    await this.query(
      'INSERT INTO alerts (id, phone, category, estate, budget_min, budget_max, created_at, raw_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, alert.phone, alert.category, alert.estate, alert.budgetMin, alert.budgetMax, createdAt, JSON.stringify(alert)]
    );
    
    return { id, ...alert, createdAt };
  }

  async saveLead(type, leadData) {
    if (!this.isConnected) {
      return this.fallbackStore.saveLead(type, leadData);
    }

    const id = 'lead-' + Date.now();
    const createdAt = new Date().toISOString();

    await this.query(
      'INSERT INTO leads (id, type, name, phone, status, created_at, raw_data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, type, leadData.name || '', leadData.phone || '', 'pending', createdAt, JSON.stringify(leadData)]
    );

    return { id, type, ...leadData, createdAt };
  }

  // Additional compatibility methods
  async getReviewsForProperty(propertyId) {
    if (!this.isConnected) {
      return this.fallbackStore.getReviewsForProperty(propertyId);
    }

    const result = await this.query('SELECT * FROM property_reviews WHERE property_id = $1 ORDER BY review_date DESC', [propertyId]);
    return result.rows;
  }

  async addReview(propertyId, review) {
    if (!this.isConnected) {
      return this.fallbackStore.addReview(propertyId, review);
    }

    const id = 'rev-' + Date.now();
    const query = `
      INSERT INTO property_reviews (
        id, property_id, author, rating_overall, rating_water, rating_security, 
        rating_deposit, review_date, review_text, verified, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      id, propertyId, review.author || 'Verified Tenant',
      parseFloat(review.ratingOverall) || 5.0,
      parseFloat(review.ratingWater) || 5.0,
      parseFloat(review.ratingSecurity) || 5.0,
      parseFloat(review.ratingDeposit) || 5.0,
      new Date().toISOString().split('T')[0],
      review.text || '', review.verified !== undefined ? review.verified : true,
      JSON.stringify(review)
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getAllTransactions() {
    if (!this.isConnected) {
      return this.fallbackStore.getAllTransactions();
    }

    const result = await this.query('SELECT * FROM transactions ORDER BY created_at DESC');
    return result.rows;
  }

  // Close connection
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = new PostgreSQLStore();