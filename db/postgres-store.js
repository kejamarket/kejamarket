const { cache } = require('./cache');
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
    try {
      this.fallbackStore = require('./store.js');
    } catch (_) {
      this.fallbackStore = null;
    }

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          const val = Reflect.get(target, prop, receiver);
          return typeof val === 'function' ? val.bind(target) : val;
        }
        if (target.fallbackStore && typeof target.fallbackStore[prop] === 'function') {
          return target.fallbackStore[prop].bind(target.fallbackStore);
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }

  saveLandlordMessage(message) {
    if (this.fallbackStore && typeof this.fallbackStore.saveLandlordMessage === 'function') {
      return this.fallbackStore.saveLandlordMessage(message);
    }
    return message;
  }

  getLandlordMessages(userId, role) {
    if (this.fallbackStore && typeof this.fallbackStore.getLandlordMessages === 'function') {
      return this.fallbackStore.getLandlordMessages(userId, role);
    }
    return [];
  }

  get data() {
    return this.fallbackStore ? this.fallbackStore.data : { properties: [], users: [], buildings: [], units: [], inquiries: [], reviews: [], reports: [], supportTickets: [] };
  }

  async init() {
    const POOLER_URL = 'postgresql://postgres.cwqmtrwdbjmsrrqjkfmj:Stallonjevugwe4@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
    
    // Resolve candidate database URLs
    let requestedUrl = global.KEJAMARKET_DATABASE_URL || process.env.DATABASE_URL || POOLER_URL;
    
    // If DATABASE_URL points to IPv6-only direct connection (db.*.supabase.co), rewrite to pooler
    if (requestedUrl.includes('db.cwqmtrwdbjmsrrqjkfmj.supabase.co') || requestedUrl.includes('.supabase.co:5432')) {
      console.log('🔄 Detected direct IPv6 Supabase URL on host without IPv6; rewriting to IPv4 Connection Pooler...');
      requestedUrl = POOLER_URL;
    }

    const candidateUrls = [requestedUrl];
    if (requestedUrl !== POOLER_URL) {
      candidateUrls.push(POOLER_URL);
    }

    for (let i = 0; i < candidateUrls.length; i++) {
      const dbUrl = candidateUrls[i];
      const isPooler = dbUrl.includes('pooler.supabase.com');
      console.log(`🔌 Attempting PostgreSQL connection (${i + 1}/${candidateUrls.length}): ${isPooler ? 'Supabase Pooler' : 'Direct/Configured'}...`);

      const config = {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 25, // Optimized for 10,000+ concurrent users with connection pooler
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 10000, // Prevent slow queries from hanging connections
      };

      try {
        if (this.pool) {
          try { await this.pool.end(); } catch (e) {}
        }
        this.pool = new Pool(config);
        this.pool.on('error', (err) => {
          console.warn('⚠️ Unexpected error on idle PostgreSQL client (will auto-reconnect):', err.message);
        });
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        this.isConnected = true;
        console.log('✅ PostgreSQL connected successfully to', isPooler ? 'Supabase Connection Pooler (IPv4)' : 'PostgreSQL Database');

        // Ensure admin user exists
        await this.ensureAdminUser();
        return true;
      } catch (err) {
        console.warn(`⚠️ PostgreSQL connection attempt ${i + 1} failed:`, err.message);
      }
    }

    console.error('❌ All PostgreSQL connection attempts failed.');
    try {
      this.fallbackStore = require('./store.js');
      console.log('📦 Initialized local store fallback');
      return true;
    } catch (fbErr) {
      console.error('Fallback store load failed:', fbErr.message);
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
        phone = EXCLUDED.phone,
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
      '0792409540',
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

    const { name, phone, email, password, role, numProperties, area, agencyName, contactPerson, officeLocation, registrationNo, coverageArea, isAdmin, adminPermissions } = userData;
    
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

    const isAdm = userRole === 'admin' || !!isAdmin;
    const query = `
      INSERT INTO users (
        id, name, phone, email, password, role, is_phone_verified, is_verified,
        num_properties, area, agency_name, contact_person, office_location, 
        registration_no, coverage_area, created_at, raw_data, is_admin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
      JSON.stringify(adminPermissions ? { adminPermissions } : {}),
      isAdm
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
    if (cleanId.includes('admin') || cleanId === '0792409540' || cleanId === '254792409540') {
      await this.ensureAdminUser();
    }

    const user = await this.findUserByIdentifier(cleanId);
    if (!user) {
      throw new Error('No user found with this phone number or email.');
    }

    let match = await bcrypt.compare(password, user.password);

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
    if (updates.phone) {
      fields.push(`phone = $${valueIndex++}`);
      values.push(updates.phone.trim());
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${valueIndex++}`);
      values.push(updates.role);
    }
    if (updates.is_admin !== undefined || updates.isAdmin !== undefined) {
      fields.push(`is_admin = $${valueIndex++}`);
      values.push(updates.is_admin !== undefined ? updates.is_admin : updates.isAdmin);
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
    if (updates.adminPermissions !== undefined || updates.promotedAt || updates.demotedAt) {
      const extra = {};
      if (updates.adminPermissions !== undefined) extra.adminPermissions = updates.adminPermissions;
      if (updates.promotedAt) extra.promotedAt = updates.promotedAt;
      if (updates.promotedBy) extra.promotedBy = updates.promotedBy;
      if (updates.demotedAt) extra.demotedAt = updates.demotedAt;
      if (updates.demotedBy) extra.demotedBy = updates.demotedBy;
      fields.push(`raw_data = COALESCE(raw_data, '{}'::jsonb) || $${valueIndex++}::jsonb`);
      values.push(JSON.stringify(extra));
    }

    if (fields.length === 0) return this.getUserById(id);

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    
    const result = await this.query(query, values);
    return result.rows.length > 0 ? this.sanitizeUser(result.rows[0]) : null;
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    safe.isAdmin = !!(safe.is_admin || safe.role === 'admin' || safe.id === 'usr-admin-01');
    safe.is_admin = safe.isAdmin;
    safe.isVerified = !!safe.is_verified;
    safe.isPhoneVerified = !!safe.is_phone_verified;
    safe.createdAt = safe.created_at || safe.createdAt;
    return safe;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROPERTY METHODS
  // ═══════════════════════════════════════════════════════════════════

  async getAllProperties() {
    if (this.isConnected) {
      try {
        const result = await this.query(`
          SELECT p.*, 
                 COALESCE(array_agg(pm.image_url) FILTER (WHERE pm.image_url IS NOT NULL), '{}') as photos
          FROM properties p 
          LEFT JOIN property_media pm ON p.id = pm.property_id 
          GROUP BY p.id 
          ORDER BY p.created_at DESC
        `);
        return result.rows.map(row => {
          const rentNum = parseFloat(row.rent_kes) || 0;
          const depNum = parseFloat(row.deposit_kes) || 0;
          // Explicit: only true when the column is literally true — null/undefined means PENDING
          const isVer = row.is_verified === true;
          const status = row.raw_data?.status || (isVer ? 'approved' : 'pending');
          const photosArr = (row.photos && row.photos.length > 0) ? row.photos : (row.raw_data?.photos || []);
          return {
            ...row.raw_data,
            id: row.id,
            title: row.title,
            rent: rentNum,
            rentKes: rentNum,
            rent_kes: rentNum,
            deposit: depNum,
            depositKes: depNum,
            deposit_kes: depNum,
            category: row.category,
            estateSuburb: row.estate_suburb,
            estate_suburb: row.estate_suburb,
            county: row.county || (row.raw_data && row.raw_data.county) || 'Nairobi',
            isFeatured: !!row.is_featured,
            is_featured: !!row.is_featured,
            isTopAd: !!row.is_top_ad,
            is_top_ad: !!row.is_top_ad,
            isVerified: isVer,
            is_verified: isVer,
            status: status,
            isApproved: isVer,
            corridorId: row.corridor_id,
            corridor_id: row.corridor_id,
            waterSupplyType: row.water_supply_type || (row.raw_data && row.raw_data.waterSupplyType) || '',
            electricityMeterType: row.electricity_meter_type || (row.raw_data && row.raw_data.electricityMeterType) || '',
            postedTimeAgo: row.posted_time_ago || 'Today',
            photos: photosArr,
            media: photosArr.map((url, idx) => ({ url, caption: `Photo ${idx + 1}` }))
          };
        });
      } catch (err) {
        console.warn('⚠️ PostgreSQL query failed, using local store cache:', err.message);
      }
    }

    if (!this.fallbackStore) {
      try { this.fallbackStore = require('./store.js'); } catch (_) {}
    }
    return this.fallbackStore ? this.fallbackStore.getAllProperties() : [];
  }

  async _unused_getAllProperties() {
    
    return result.rows.map(row => {
      const rentNum = parseFloat(row.rent_kes) || 0;
      const depNum = parseFloat(row.deposit_kes) || 0;
      const isVer = row.is_verified !== false;
      const photosArr = (row.photos && row.photos.length > 0) ? row.photos : (row.raw_data?.photos || []);
      return {
        ...row.raw_data,
        id: row.id,
        title: row.title,
        rent: rentNum,
        rentKes: rentNum,
        rent_kes: rentNum,
        deposit: depNum,
        depositKes: depNum,
        deposit_kes: depNum,
        category: row.category,
        estateSuburb: row.estate_suburb,
        estate_suburb: row.estate_suburb,
        county: row.county || (row.raw_data && row.raw_data.county) || 'Nairobi',
        isFeatured: !!row.is_featured,
        is_featured: !!row.is_featured,
        isTopAd: !!row.is_top_ad,
        is_top_ad: !!row.is_top_ad,
        isVerified: isVer,
        is_verified: isVer,
        corridorId: row.corridor_id,
        corridor_id: row.corridor_id,
        waterSupplyType: row.water_supply_type || (row.raw_data && row.raw_data.waterSupplyType) || '',
        electricityMeterType: row.electricity_meter_type || (row.raw_data && row.raw_data.electricityMeterType) || '',
        postedTimeAgo: row.posted_time_ago || 'Today',
        photos: photosArr,
        media: photosArr.map((url, idx) => ({ url, caption: `Photo ${idx + 1}` }))
      };
    });
  }

  async getPropertyById(id) {
    if (this.isConnected) {
      try {
        const result = await this.query('SELECT * FROM properties WHERE id = $1', [id]);
        if (result.rows.length > 0) {
          const property = result.rows[0];
          const rentNum = parseFloat(property.rent_kes) || 0;
          const depNum = parseFloat(property.deposit_kes) || 0;
          // Explicit: only true when the column is literally true
          const isVer = property.is_verified === true;
          const status = property.raw_data?.status || (isVer ? 'approved' : 'pending');
          return {
            ...property.raw_data,
            id: property.id,
            title: property.title,
            rent: rentNum,
            rentKes: rentNum,
            rent_kes: rentNum,
            deposit: depNum,
            depositKes: depNum,
            deposit_kes: depNum,
            category: property.category,
            estateSuburb: property.estate_suburb,
            estate_suburb: property.estate_suburb,
            county: property.county || (property.raw_data && property.raw_data.county) || 'Nairobi',
            isFeatured: !!property.is_featured,
            is_featured: !!property.is_featured,
            isTopAd: !!property.is_top_ad,
            is_top_ad: !!property.is_top_ad,
            isVerified: isVer,
            is_verified: isVer,
            status: status,
            isApproved: isVer,
            waterSupplyType: property.water_supply_type || '',
            electricityMeterType: property.electricity_meter_type || '',
            postedTimeAgo: property.posted_time_ago || 'Today'
          };
        }
      } catch (err) {
        console.warn('⚠️ getPropertyById DB failed, using local store cache:', err.message);
      }
    }

    if (!this.fallbackStore) {
      try { this.fallbackStore = require('./store.js'); } catch (_) {}
    }
    return this.fallbackStore ? this.fallbackStore.getPropertyById(id) : null;
  }

  async _unused_getPropertyById(id) {
    const result = { rows: [] };
    if (result.rows.length === 0) return null;

    const property = result.rows[0];
    const rentNum = parseFloat(property.rent_kes) || 0;
    const depNum = parseFloat(property.deposit_kes) || 0;
    const isVer = property.is_verified !== false;
    return {
      ...property.raw_data,
      id: property.id,
      title: property.title,
      rent: rentNum,
      rentKes: rentNum,
      rent_kes: rentNum,
      deposit: depNum,
      depositKes: depNum,
      deposit_kes: depNum,
      category: property.category,
      estateSuburb: property.estate_suburb,
      estate_suburb: property.estate_suburb,
      county: property.county || (property.raw_data && property.raw_data.county) || 'Nairobi',
      isFeatured: !!property.is_featured,
      is_featured: !!property.is_featured,
      isTopAd: !!property.is_top_ad,
      is_top_ad: !!property.is_top_ad,
      isVerified: isVer,
      is_verified: isVer,
      waterSupplyType: property.water_supply_type || '',
      electricityMeterType: property.electricity_meter_type || '',
      postedTimeAgo: property.posted_time_ago || 'Today'
    };
  }

  async addProperty(property) {
    if (!this.isConnected) {
      return this.fallbackStore.addProperty(property);
    }

    const id = property.id || 'prop-usr-' + Date.now();
    const createdAt = new Date().toISOString();
    const rentNum = parseFloat(property.rentKes ?? property.rent ?? property.rent_kes ?? 0) || 0;
    const depNum = parseFloat(property.depositKes ?? property.deposit ?? property.deposit_kes ?? rentNum) || 0;

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
      rentNum, depNum, property.county || 'Nairobi',
      property.corridorId || '', property.estateSuburb || '', property.exactLocation || '',
      property.latitude || null, property.longitude || null, 
      property.waterSupplyType || '', property.electricityMeterType || '',
      property.isFeatured || false, property.isTopAd || false,
      // New submissions always start as UNVERIFIED (false) — admin must approve
      false,
      property.managedBy || 'landlord', property.agencyName || '',
      property.caretakerName || '', property.caretakerPhone || '', property.landlordId || '',
      createdAt, property.postedTimeAgo || 'Just now',
      // Store pending status in raw_data too
      JSON.stringify({ ...property, status: 'pending', isVerified: false, isApproved: false })
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

    return { 
      ...property, 
      id, 
      rent: rentNum, 
      rentKes: rentNum, 
      rent_kes: rentNum, 
      deposit: depNum, 
      depositKes: depNum, 
      deposit_kes: depNum, 
      isVerified: false,
      is_verified: false,
      status: 'pending',
      isApproved: false,
      createdAt, 
      postedTimeAgo: 'Just now' 
    };
  }

  async updateProperty(id, updates) {
    if (!this.isConnected) {
      return this.fallbackStore.updateProperty(id, updates);
    }

    // Build SQL for explicit column updates (is_verified, is_featured, is_top_ad)
    const colUpdates = [];
    const colValues = [];
    let colIdx = 1;

    if (updates.isVerified !== undefined || updates.is_verified !== undefined) {
      const verVal = updates.isVerified !== undefined ? updates.isVerified : updates.is_verified;
      colUpdates.push(`is_verified = $${colIdx++}`);
      colValues.push(!!verVal);
    }
    if (updates.isFeatured !== undefined || updates.is_featured !== undefined) {
      colUpdates.push(`is_featured = $${colIdx++}`);
      colValues.push(!!(updates.isFeatured ?? updates.is_featured));
    }
    if (updates.isTopAd !== undefined || updates.is_top_ad !== undefined) {
      colUpdates.push(`is_top_ad = $${colIdx++}`);
      colValues.push(!!(updates.isTopAd ?? updates.is_top_ad));
    }

    // Always patch raw_data with all updates
    colUpdates.push(`raw_data = raw_data || $${colIdx++}::jsonb`);
    colValues.push(JSON.stringify(updates));
    colValues.push(id);

    await this.query(
      `UPDATE properties SET ${colUpdates.join(', ')} WHERE id = $${colIdx}`,
      colValues
    );

    // Get updated property
    try { cache.invalidate('properties'); cache.invalidate('property'); cache.invalidate('stats'); } catch (_) {}
    return await this.getPropertyById(id);
  }

  async deleteProperty(id) {
    if (!this.isConnected) {
      return this.fallbackStore.deleteProperty(id);
    }

    const result = await this.query('DELETE FROM properties WHERE id = $1', [id]);
    try { cache.invalidate('properties'); cache.invalidate('property'); cache.invalidate('stats'); } catch (_) {}
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
        (SELECT COUNT(*) FROM users) as active_users,
        (SELECT COUNT(*) FROM properties) as total_properties,
        (SELECT COUNT(*) FROM properties WHERE is_verified = true) as active_listings,
        (SELECT COUNT(*) FROM properties WHERE is_verified IS NOT TRUE) as pending_listings,
        (SELECT COUNT(*) FROM properties WHERE raw_data->>'availability' != 'taken') as available_properties,
        (SELECT COUNT(*) FROM properties WHERE raw_data->>'availability' = 'taken') as taken_properties,
        (SELECT COUNT(*) FROM properties WHERE is_bnb = true OR category ILIKE '%bnb%') as total_bnbs,
        (SELECT COUNT(*) FROM buildings) as total_buildings,
        (SELECT COUNT(*) FROM units) as total_units,
        (SELECT COUNT(*) FROM services) as total_services,
        (SELECT COUNT(*) FROM marketplace_items) as total_marketplace,
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE is_read = false) as new_inquiries,
        (SELECT COUNT(*) FROM house_hunts) as total_house_hunts,
        (SELECT COUNT(*) FROM similar_property_alerts) as total_similar_alerts
    `);

    const recentUsers = await this.query(`
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT 50
    `);

    const r = stats.rows[0];
    return {
      ...r,
      totalUsers: parseInt(r.total_users) || 0,
      activeUsers: parseInt(r.active_users) || 0,
      tenants: parseInt(r.tenants) || 0,
      landlords: parseInt(r.landlords) || 0,
      totalProperties: parseInt(r.total_properties) || 0,
      activeListings: parseInt(r.active_listings) || 0,
      pendingListings: parseInt(r.pending_listings) || 0,
      totalBNBs: parseInt(r.total_bnbs) || 0,
      totalBuildings: parseInt(r.total_buildings) || 0,
      totalUnits: parseInt(r.total_units) || 0,
      totalServices: parseInt(r.total_services) || 0,
      totalMarketplace: parseInt(r.total_marketplace) || 0,
      availableProperties: parseInt(r.available_properties) || 0,
      takenProperties: parseInt(r.taken_properties) || 0,
      totalTransactions: parseInt(r.total_transactions) || 0,
      totalMessages: parseInt(r.total_messages) || 0,
      newInquiries: parseInt(r.new_inquiries) || 0,
      openReports: 0,
      totalHouseHunts: parseInt(r.total_house_hunts) || 0,
      totalSimilarAlerts: parseInt(r.total_similar_alerts) || 0,
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

  // ═══════════════════════════════════════════════════════════════════
  // PASSWORD RESET TOKENS
  // ═══════════════════════════════════════════════════════════════════

  async createPasswordResetToken(userId, token, expiresAt) {
    if (!this.isConnected) return null;
    const id = 'prt-' + Date.now();
    await this.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       ON CONFLICT (token) DO NOTHING`,
      [id, userId, token, expiresAt]
    );
    return { id, userId, token, expiresAt };
  }

  async getPasswordResetToken(token) {
    if (!this.isConnected) return null;
    const result = await this.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async markResetTokenUsed(token) {
    if (!this.isConnected) return;
    await this.query(
      `UPDATE password_reset_tokens SET used = true WHERE token = $1`,
      [token]
    );
  }

  async resetUserPassword(userId, hashedPassword) {
    if (!this.isConnected) return null;
    const result = await this.query(
      `UPDATE users SET password = $1 WHERE id = $2 RETURNING *`,
      [hashedPassword, userId]
    );
    return result.rows.length > 0 ? this.sanitizeUser(result.rows[0]) : null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // FAVOURITES
  // ═══════════════════════════════════════════════════════════════════

  async addFavourite(userId, propertyId) {
    if (!this.isConnected) return null;
    const id = 'fav-' + Date.now();
    try {
      await this.query(
        `INSERT INTO favourites (id, user_id, property_id, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, property_id) DO NOTHING`,
        [id, userId, propertyId]
      );
      return { id, userId, propertyId };
    } catch (err) {
      return null;
    }
  }

  async removeFavourite(userId, propertyId) {
    if (!this.isConnected) return false;
    const result = await this.query(
      `DELETE FROM favourites WHERE user_id = $1 AND property_id = $2`,
      [userId, propertyId]
    );
    return result.rowCount > 0;
  }

  async getUserFavourites(userId) {
    if (!this.isConnected) return [];
    const result = await this.query(
      `SELECT property_id FROM favourites WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map(r => r.property_id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // WHATSAPP ALERT SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════

  async saveWhatsAppSub(sub) {
    if (!this.isConnected) return this.fallbackStore ? this.fallbackStore.saveAlert(sub) : sub;
    const id = 'wa-' + Date.now();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    await this.query(
      `INSERT INTO whatsapp_alert_subs (id, user_id, phone, category, estate, budget_min, budget_max, is_active, paid_at, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), $8, NOW())
       ON CONFLICT DO NOTHING`,
      [id, sub.userId || null, sub.phone, sub.category, sub.estate, sub.budgetMin || null, sub.budgetMax || null, expiresAt]
    );
    return { id, ...sub, expiresAt };
  }

  async getActiveWhatsAppSubs() {
    if (!this.isConnected) return [];
    const result = await this.query(
      `SELECT * FROM whatsapp_alert_subs WHERE is_active = true AND expires_at > NOW()`
    );
    return result.rows;
  }

  async getMatchingWhatsAppSubs(property) {
    if (!this.isConnected) return [];
    const result = await this.query(
      `SELECT * FROM whatsapp_alert_subs 
       WHERE is_active = true AND expires_at > NOW()
       AND (category IS NULL OR category = 'All Categories' OR category = $1)
       AND (estate IS NULL OR estate = 'Any Estate' OR estate ILIKE $2)
       AND (budget_min IS NULL OR $3 >= budget_min)
       AND (budget_max IS NULL OR $3 <= budget_max)`,
      [property.category, `%${property.estateSuburb}%`, property.rentKes || property.rent || 0]
    );
    return result.rows;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SERVER-SIDE SEARCH & FILTERING
  // ═══════════════════════════════════════════════════════════════════

  async searchProperties({ category, suburb, corridor, minPrice, maxPrice, query, page = 1, pageSize = 12, sort = 'newest', landlordId, isVerified } = {}) {
    if (!this.isConnected) {
      let all = this.fallbackStore.getAllProperties();
      if (isVerified !== undefined) {
        all = all.filter(p => (p.is_verified === true || p.isVerified === true) === !!isVerified);
      }
      return { properties: all, total: all.length, page: 1, pageSize: all.length, totalPages: 1 };
    }

    const conditions = [];
    const values = [];
    let idx = 1;

    if (isVerified !== undefined) {
      conditions.push(`is_verified = $${idx++}`);
      values.push(!!isVerified);
    }
    if (category && category !== 'All') {
      conditions.push(`category = $${idx++}`);
      values.push(category);
    }
    if (suburb && suburb !== 'all') {
      conditions.push(`estate_suburb ILIKE $${idx++}`);
      values.push(`%${suburb}%`);
    }
    if (corridor && corridor !== 'all') {
      conditions.push(`corridor_id = $${idx++}`);
      values.push(corridor);
    }
    if (minPrice) {
      conditions.push(`rent_kes >= $${idx++}`);
      values.push(Number(minPrice));
    }
    if (maxPrice) {
      conditions.push(`rent_kes <= $${idx++}`);
      values.push(Number(maxPrice));
    }
    if (query) {
      conditions.push(`(title ILIKE $${idx} OR estate_suburb ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${query}%`);
      idx++;
    }
    if (landlordId) {
      conditions.push(`landlord_id = $${idx++}`);
      values.push(landlordId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap = {
      newest: 'created_at DESC',
      price_asc: 'rent_kes ASC',
      price_desc: 'rent_kes DESC',
      featured: 'is_featured DESC, is_top_ad DESC, created_at DESC',
      category_asc: 'category ASC, rent_kes ASC'
    };
    const orderBy = orderMap[sort] || 'created_at DESC';

    // Count total
    const countResult = await this.query(`SELECT COUNT(*) FROM properties ${where}`, values);
    const total = parseInt(countResult.rows[0].count);

    // Fetch page
    const offset = (page - 1) * pageSize;
    const dataResult = await this.query(
      `SELECT * FROM properties ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, pageSize, offset]
    );

    const properties = dataResult.rows.map(row => {
      const isVer = row.is_verified === true;
      const status = row.raw_data?.status || (isVer ? 'approved' : 'pending');
      return {
        ...row.raw_data,
        id: row.id,
        title: row.title,
        rent: row.rent_kes,
        rentKes: row.rent_kes,
        category: row.category,
        estateSuburb: row.estate_suburb,
        isFeatured: row.is_featured,
        isTopAd: row.is_top_ad,
        isVerified: isVer,
        is_verified: isVer,
        status: status,
        isApproved: isVer,
        createdAt: row.created_at
      };
    });

    return {
      properties,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // DUPLICATE DETECTION
  // ═══════════════════════════════════════════════════════════════════

  async findDuplicateListing(landlordId, estateSuburb, category, rentKes) {
    if (!this.isConnected) return null;
    const result = await this.query(
      `SELECT id, title FROM properties
       WHERE landlord_id = $1
         AND estate_suburb ILIKE $2
         AND category = $3
         AND ABS(rent_kes - $4) < 500
         AND created_at > NOW() - INTERVAL '30 days'
       LIMIT 1`,
      [landlordId, `%${estateSuburb}%`, category, rentKes]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SERVER-SIDE ADMIN ANALYTICS
  // ═══════════════════════════════════════════════════════════════════

  async getAdminAnalytics() {
    if (!this.isConnected) return null;

    const [userStats, propStats, revenueStats, topSuburbs, topCategories, growth] = await Promise.all([
      this.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE role = 'tenant') as tenants,
          COUNT(*) FILTER (WHERE role = 'landlord') as landlords,
          COUNT(*) FILTER (WHERE role = 'agency') as agencies,
          COUNT(*) FILTER (WHERE role = 'service') as service_providers,
          COUNT(*) FILTER (WHERE is_verified = true) as verified,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
        FROM users
      `),
      this.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_featured = true OR is_top_ad = true) as boosted,
          COUNT(*) FILTER (WHERE (raw_data->>'availability') = 'taken' OR (raw_data->>'isTaken')::boolean = true) as taken,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
          ROUND(AVG(rent_kes)) as avg_rent,
          MIN(rent_kes) as min_rent,
          MAX(rent_kes) as max_rent
        FROM properties
      `),
      this.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'SUCCESS') as confirmed,
          COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS' AND created_at > NOW() - INTERVAL '30 days'), 0) as revenue_this_month
        FROM transactions
      `),
      this.query(`
        SELECT estate_suburb, COUNT(*) as count
        FROM properties
        GROUP BY estate_suburb
        ORDER BY count DESC
        LIMIT 8
      `),
      this.query(`
        SELECT category, COUNT(*) as count
        FROM properties
        GROUP BY category
        ORDER BY count DESC
        LIMIT 8
      `),
      this.query(`
        SELECT
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as signups
        FROM users
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `)
    ]);

    return {
      users: userStats.rows[0],
      properties: propStats.rows[0],
      revenue: revenueStats.rows[0],
      topSuburbs: topSuburbs.rows,
      topCategories: topCategories.rows,
      signupTrend: growth.rows
    };
  }

  async saveSimilarPropertyAlert(data) {
    const id = 'spa-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    if (this.isConnected) {
      try {
        const res = await this.query(`
          INSERT INTO similar_property_alerts (
            id, property_id, property_title, phone, email, location,
            category, bedrooms, max_budget, status, created_at, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11)
          RETURNING *
        `, [
          id, data.propertyId || null, data.propertyTitle || null, data.phone,
          data.email || null, data.location || null, data.category || null,
          data.bedrooms ? parseInt(data.bedrooms) : null,
          data.maxBudget ? parseFloat(data.maxBudget) : null,
          now, JSON.stringify(data)
        ]);
        return res.rows[0];
      } catch (e) {
        console.error('saveSimilarPropertyAlert error:', e.message);
      }
    }
    return { id, ...data, createdAt: now };
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOUSE HUNT METHODS
  // ═══════════════════════════════════════════════════════════════════

  async _ensureHouseHuntTables() {
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS house_hunts (
          id TEXT PRIMARY KEY, customer_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
          payment_status TEXT NOT NULL DEFAULT 'PENDING',
          payment_amount NUMERIC(12,2) DEFAULT 2000,
          mpesa_receipt TEXT, checkout_request_id TEXT, paid_at TIMESTAMPTZ,
          started_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
          preferred_locations TEXT, budget_min NUMERIC(12,2), budget_max NUMERIC(12,2),
          property_type TEXT, bedrooms INTEGER, bathrooms INTEGER,
          move_in_date TEXT, amenities TEXT, parking_required BOOLEAN DEFAULT FALSE,
          furnished TEXT DEFAULT 'any', other_preferences TEXT,
          assigned_admin_id TEXT, admin_notes TEXT,
          properties_found INTEGER DEFAULT 0, viewings_arranged INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
          raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE TABLE IF NOT EXISTS house_hunt_properties (
          id TEXT PRIMARY KEY, hunt_id TEXT NOT NULL,
          property_id TEXT, property_title TEXT, property_location TEXT,
          property_price NUMERIC(12,2), property_bedrooms INTEGER, property_bathrooms INTEGER,
          property_images TEXT, property_amenities TEXT,
          is_verified BOOLEAN DEFAULT FALSE, availability TEXT DEFAULT 'available',
          availability_confirmed_at TIMESTAMPTZ, availability_confirmed_by TEXT,
          admin_note TEXT, viewing_status TEXT DEFAULT 'none',
          viewing_date TEXT, removed_at TIMESTAMPTZ, removed_reason TEXT,
          added_at TIMESTAMPTZ DEFAULT NOW(), raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS house_hunt_id TEXT;
      `);
    } catch (e) { /* non-fatal — tables may already exist */ }
  }

  async createHouseHunt(data) {
    if (!this.isConnected) return this._hhFbCreate(data);
    await this._ensureHouseHuntTables();
    const id = 'hh-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const r = await this.query(`
      INSERT INTO house_hunts (
        id, customer_id, status, payment_status, payment_amount,
        checkout_request_id, preferred_locations, budget_min, budget_max,
        property_type, bedrooms, bathrooms, move_in_date, amenities,
        parking_required, furnished, other_preferences,
        created_at, updated_at, raw_data
      ) VALUES ($1,$2,'PAYMENT_PENDING','PENDING',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16,$17)
      RETURNING *`,
      [
        id, data.customerId, data.paymentAmount || 2000,
        data.checkoutRequestId || null,
        JSON.stringify(data.preferredLocations || []),
        data.budgetMin || null, data.budgetMax || null,
        data.propertyType || null, data.bedrooms || null, data.bathrooms || null,
        data.moveInDate || null,
        JSON.stringify(data.amenities || []),
        data.parkingRequired || false, data.furnished || 'any',
        data.otherPreferences || null, now, JSON.stringify(data)
      ]
    );
    return this._fmtHunt(r.rows[0]);
  }

  async getHouseHuntById(id) {
    if (!this.isConnected) return this._hhFbGetById(id);
    const r = await this.query('SELECT hh.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email FROM house_hunts hh LEFT JOIN users u ON hh.customer_id = u.id WHERE hh.id = $1', [id]);
    return r.rows.length ? this._fmtHunt(r.rows[0]) : null;
  }

  async getHouseHuntsByCustomer(customerId) {
    if (!this.isConnected) return this._hhFbGetByCust(customerId);
    const r = await this.query('SELECT * FROM house_hunts WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
    return r.rows.map(h => this._fmtHunt(h));
  }

  async getAllHouseHunts({ status, limit = 100, offset = 0 } = {}) {
    if (!this.isConnected) return this._hhFbGetAll();
    let q = `SELECT hh.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
             FROM house_hunts hh LEFT JOIN users u ON hh.customer_id = u.id`;
    const v = [];
    if (status) { q += ` WHERE hh.status = $1`; v.push(status); }
    q += ` ORDER BY hh.created_at DESC LIMIT $${v.length+1} OFFSET $${v.length+2}`;
    v.push(limit, offset);
    const r = await this.query(q, v);
    return r.rows.map(h => this._fmtHunt(h));
  }

  async updateHouseHunt(id, updates) {
    if (!this.isConnected) return this._hhFbUpdate(id, updates);
    const colMap = {
      status:'status', paymentStatus:'payment_status', mpesaReceipt:'mpesa_receipt',
      checkoutRequestId:'checkout_request_id', paidAt:'paid_at',
      startedAt:'started_at', expiresAt:'expires_at',
      adminNotes:'admin_notes', assignedAdminId:'assigned_admin_id',
      propertiesFound:'properties_found', viewingsArranged:'viewings_arranged'
    };
    const fields = []; const v = []; let i = 1;
    for (const [k, col] of Object.entries(colMap)) {
      if (updates[k] !== undefined) { fields.push(`${col}=$${i++}`); v.push(updates[k]); }
    }
    if (!fields.length) return this.getHouseHuntById(id);
    fields.push(`updated_at=$${i++}`); v.push(new Date().toISOString()); v.push(id);
    const r = await this.query(`UPDATE house_hunts SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, v);
    return r.rows.length ? this._fmtHunt(r.rows[0]) : null;
  }

  async activateHouseHunt(id, mpesaReceipt, checkoutRequestId) {
    const now = new Date();
    const expires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return this.updateHouseHunt(id, {
      status: 'ACTIVE', paymentStatus: 'SUCCESS',
      mpesaReceipt, checkoutRequestId,
      paidAt: now.toISOString(),
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString()
    });
  }

  async addPropertyToHunt(huntId, pd) {
    if (!this.isConnected) return this._hhFbAddProp(huntId, pd);
    const id = 'hhp-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const r = await this.query(`
      INSERT INTO house_hunt_properties (
        id, hunt_id, property_id, property_title, property_location,
        property_price, property_bedrooms, property_bathrooms,
        property_images, property_amenities, is_verified, availability, admin_note, raw_data
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [id, huntId, pd.propertyId||null, pd.title||pd.propertyTitle||'',
       pd.location||pd.propertyLocation||'', pd.price||pd.propertyPrice||null,
       pd.bedrooms||null, pd.bathrooms||null,
       JSON.stringify(pd.images||[]), JSON.stringify(pd.amenities||[]),
       pd.isVerified||false, pd.availability||'available', pd.adminNote||null, JSON.stringify(pd)]
    );
    await this.query(
      `UPDATE house_hunts SET properties_found=(SELECT COUNT(*) FROM house_hunt_properties WHERE hunt_id=$1 AND removed_at IS NULL),updated_at=NOW() WHERE id=$1`,
      [huntId]
    );
    return r.rows[0];
  }

  async getPropertiesForHunt(huntId, includeRemoved = false) {
    if (!this.isConnected) return [];
    let q = 'SELECT * FROM house_hunt_properties WHERE hunt_id=$1';
    if (!includeRemoved) q += ' AND removed_at IS NULL';
    q += ' ORDER BY added_at ASC';
    const r = await this.query(q, [huntId]);
    return r.rows.map(p => ({
      ...p,
      propertyImages: this._safeJson(p.property_images, []),
      propertyAmenities: this._safeJson(p.property_amenities, [])
    }));
  }

  async updateHuntProperty(propId, updates) {
    if (!this.isConnected) return null;
    const colMap = {
      availability:'availability', availabilityConfirmedAt:'availability_confirmed_at',
      availabilityConfirmedBy:'availability_confirmed_by', adminNote:'admin_note',
      viewingStatus:'viewing_status', viewingDate:'viewing_date',
      removedAt:'removed_at', removedReason:'removed_reason', isVerified:'is_verified'
    };
    const fields = []; const v = []; let i = 1;
    for (const [k, col] of Object.entries(colMap)) {
      if (updates[k] !== undefined) { fields.push(`${col}=$${i++}`); v.push(updates[k]); }
    }
    if (!fields.length) return null;
    v.push(propId);
    const r = await this.query(`UPDATE house_hunt_properties SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, v);
    return r.rows[0] || null;
  }

  async removePropertyFromHunt(propId, reason, huntId) {
    const r = await this.updateHuntProperty(propId, { removedAt: new Date().toISOString(), removedReason: reason || 'Removed by admin' });
    if (huntId) await this.query(`UPDATE house_hunts SET properties_found=(SELECT COUNT(*) FROM house_hunt_properties WHERE hunt_id=$1 AND removed_at IS NULL),updated_at=NOW() WHERE id=$1`, [huntId]);
    return r;
  }

  async saveHuntMessage(msg) {
    if (!this.isConnected) return this.saveMessage({ ...msg, huntId: msg.huntId });
    const id = 'msg-hh-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const r = await this.query(`
      INSERT INTO messages (id, house_hunt_id, sender_id, sender_name, sender_phone, recipient_id, recipient_name, text, is_read, created_at, raw_data)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,NOW(),$9) RETURNING *`,
      [id, msg.huntId, msg.senderId||'system', msg.senderName||'KejaMarket',
       msg.senderPhone||'', msg.recipientId||msg.customerId,
       msg.recipientName||'Customer', (msg.text||'').trim(), JSON.stringify(msg)]
    );
    return r.rows[0];
  }

  async getHuntMessages(huntId) {
    if (!this.isConnected) return [];
    const r = await this.query('SELECT * FROM messages WHERE house_hunt_id=$1 ORDER BY created_at ASC', [huntId]);
    return r.rows;
  }

  _fmtHunt(row) {
    if (!row) return null;
    return {
      ...row,
      id: row.id, customerId: row.customer_id,
      customerName: row.customer_name, customerPhone: row.customer_phone, customerEmail: row.customer_email,
      status: row.status, paymentStatus: row.payment_status,
      paymentAmount: parseFloat(row.payment_amount) || 2000,
      mpesaReceipt: row.mpesa_receipt, checkoutRequestId: row.checkout_request_id,
      paidAt: row.paid_at, startedAt: row.started_at, expiresAt: row.expires_at,
      preferredLocations: this._safeJson(row.preferred_locations, []),
      budgetMin: row.budget_min ? parseFloat(row.budget_min) : null,
      budgetMax: row.budget_max ? parseFloat(row.budget_max) : null,
      propertyType: row.property_type, bedrooms: row.bedrooms, bathrooms: row.bathrooms,
      moveInDate: row.move_in_date, amenities: this._safeJson(row.amenities, []),
      parkingRequired: row.parking_required, furnished: row.furnished,
      otherPreferences: row.other_preferences,
      adminNotes: row.admin_notes, assignedAdminId: row.assigned_admin_id,
      propertiesFound: parseInt(row.properties_found) || 0,
      viewingsArranged: parseInt(row.viewings_arranged) || 0,
      createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  _safeJson(val, fallback) {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
  }

  // In-memory fallbacks
  _hhFbCreate(data) {
    const h = { id:'hh-'+Date.now(), ...data, status:'PAYMENT_PENDING', paymentStatus:'PENDING', createdAt:new Date().toISOString(), propertiesFound:0, viewingsArranged:0 };
    if (!this.fallbackStore?.data) return h;
    if (!this.fallbackStore.data.houseHunts) this.fallbackStore.data.houseHunts = [];
    this.fallbackStore.data.houseHunts.push(h); return h;
  }
  _hhFbGetById(id) { return (this.fallbackStore?.data?.houseHunts||[]).find(h=>h.id===id)||null; }
  _hhFbGetByCust(cid) { return (this.fallbackStore?.data?.houseHunts||[]).filter(h=>h.customerId===cid); }
  _hhFbGetAll() { return this.fallbackStore?.data?.houseHunts||[]; }
  _hhFbUpdate(id, u) {
    const list = this.fallbackStore?.data?.houseHunts||[];
    const i = list.findIndex(h=>h.id===id);
    if (i===-1) return null;
    list[i]={...list[i],...u,updatedAt:new Date().toISOString()}; return list[i];
  }
  _hhFbAddProp(huntId, pd) {
    const p={id:'hhp-'+Date.now(),huntId,...pd,addedAt:new Date().toISOString()};
    if (!this.fallbackStore?.data) return p;
    if (!this.fallbackStore.data.huntProperties) this.fallbackStore.data.huntProperties=[];
    this.fallbackStore.data.huntProperties.push(p); return p;
  }
}

module.exports = new PostgreSQLStore();
