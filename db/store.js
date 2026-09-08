/**
 * KejaMarket - Persistent JSON Database Storage Engine
 * Handles users, properties, reviews, M-Pesa transactions, leads, and alerts.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data.json');

// Default initial state
const defaultState = {
  users: [],
  properties: [],
  reviews: {},
  transactions: [],
  alerts: [],
  leads: [],
  messages: [],
  comments: {}
};

class Store {
  constructor() {
    this.data = { ...defaultState };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all arrays and objects exist
        this.data.users = this.data.users || [];
        this.data.properties = this.data.properties || [];
        this.data.reviews = this.data.reviews || {};
        this.data.transactions = this.data.transactions || [];
        this.data.alerts = this.data.alerts || [];
        this.data.leads = this.data.leads || [];
        this.data.messages = this.data.messages || [];
        this.data.comments = this.data.comments || {};
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB file, reinitializing:', err);
      this.seedInitialData();
      this.save();
    }
  }

  save() {
    try {
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving DB file:', err);
    }
  }

  seedInitialData() {
    // Try loading seed listings from seedListings.js if available
    try {
      const seedFilePath = path.join(__dirname, '../js/data/seedListings.js');
      if (fs.existsSync(seedFilePath)) {
        const seedCode = fs.readFileSync(seedFilePath, 'utf-8');
        // Simple extraction of SEED_PROPERTIES and SEED_REVIEWS
        const sandbox = {};
        const fn = new Function('sandbox', `${seedCode}\nsandbox.SEED_PROPERTIES = SEED_PROPERTIES;\nsandbox.SEED_REVIEWS = SEED_REVIEWS;`);
        fn(sandbox);
        if (Array.isArray(sandbox.SEED_PROPERTIES)) {
          this.data.properties = sandbox.SEED_PROPERTIES;
        }
        if (sandbox.SEED_REVIEWS && typeof sandbox.SEED_REVIEWS === 'object') {
          this.data.reviews = sandbox.SEED_REVIEWS;
        }
      }
    } catch (e) {
      console.warn('Could not auto-import seedListings.js, using default:', e.message);
    }

    // Seed production admin & verified landlord accounts
    const hashedPassword = bcrypt.hashSync('keja2026', 10);
    this.data.users = [
      {
        id: 'usr-admin-01',
        name: 'KejaMarket Admin',
        phone: '0700000000',
        email: 'admin@kejamarket.co.ke',
        password: hashedPassword,
        role: 'landlord',
        isVerified: true,
        numProperties: '10+',
        area: 'Nairobi Metro',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-landlord-01',
        name: 'James Mwangi',
        phone: '0712345678',
        email: 'james.mwangi@gmail.com',
        password: hashedPassword,
        role: 'landlord',
        isVerified: true,
        numProperties: '2-5',
        area: 'Ruaka & Westlands',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-tenant-01',
        name: 'Grace Wanjiku',
        phone: '0722000111',
        email: 'grace.wanjiku@gmail.com',
        password: hashedPassword,
        role: 'tenant',
        isVerified: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // ─── USER METHODS ──────────────────────────────────────────────────────────
  async createUser({ name, phone, email, password, role, numProperties, area }) {
    const cleanPhone = phone.replace(/\s+/g, '');
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check duplicate phone
    const existingPhone = this.data.users.find(u => u.phone === cleanPhone);
    if (existingPhone) {
      throw new Error('An account with this phone number already exists.');
    }

    // Check duplicate email
    if (cleanEmail) {
      const existingEmail = this.data.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        throw new Error('An account with this email address already exists.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'tenant',
      isVerified: role === 'tenant',
      numProperties: role === 'landlord' ? (numProperties || '1') : null,
      area: role === 'landlord' ? (area || '') : null,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(user);
    this.save();
    return this.sanitizeUser(user);
  }

  async authenticateUser(identifier, password, role = null) {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.data.users.find(u => 
      u.phone === cleanId || 
      (u.email && u.email.toLowerCase() === cleanId) ||
      u.phone.replace(/^254/, '0') === cleanId ||
      u.phone === '254' + cleanId.replace(/^0/, '')
    );

    if (!user) {
      throw new Error('No user found with this phone number or email.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Incorrect password. Please try again.');
    }

    // If role requested and does not match, optionally update or warn
    if (role && user.role !== role) {
      // Allow flexible switch if they are signing in to their valid account
      user.role = role;
      this.save();
    }

    return this.sanitizeUser(user);
  }

  getUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    return user ? this.sanitizeUser(user) : null;
  }

  updateUser(id, updates) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.email) user.email = updates.email.trim();
    if (updates.isVerified !== undefined) user.isVerified = updates.isVerified;
    if (updates.area) user.area = updates.area;
    if (updates.numProperties) user.numProperties = updates.numProperties;
    
    this.save();
    return this.sanitizeUser(user);
  }

  sanitizeUser(user) {
    const { password, ...safe } = user;
    return safe;
  }

  // ─── PROPERTY METHODS ──────────────────────────────────────────────────────
  getAllProperties() {
    return this.data.properties;
  }

  getPropertyById(id) {
    return this.data.properties.find(p => p.id === id) || null;
  }

  addProperty(property) {
    // Generate id if missing
    if (!property.id) {
      property.id = 'prop-usr-' + Date.now();
    }
    property.createdAt = property.createdAt || new Date().toISOString();
    property.postedTimeAgo = property.postedTimeAgo || 'Just now';
    this.data.properties.unshift(property);
    this.save();
    return property;
  }

  updateProperty(id, updates) {
    const index = this.data.properties.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.properties[index] = { ...this.data.properties[index], ...updates };
    this.save();
    return this.data.properties[index];
  }

  boostProperty(propertyId, boostType = 'top_ad') {
    const prop = this.getPropertyById(propertyId);
    if (prop) {
      prop.isTopAd = true;
      prop.isFeatured = true;
      prop.boostedAt = new Date().toISOString();
      prop.boostType = boostType;
      this.save();
      return prop;
    }
    return null;
  }

  // ─── REVIEWS METHODS ───────────────────────────────────────────────────────
  getReviewsForProperty(propertyId) {
    return this.data.reviews[propertyId] || [];
  }

  addReview(propertyId, review) {
    if (!this.data.reviews[propertyId]) {
      this.data.reviews[propertyId] = [];
    }
    const newRev = {
      id: 'rev-' + Date.now(),
      author: review.author || 'Verified Tenant',
      ratingOverall: parseFloat(review.ratingOverall) || 5.0,
      ratingWater: parseFloat(review.ratingWater) || 5.0,
      ratingSecurity: parseFloat(review.ratingSecurity) || 5.0,
      ratingDeposit: parseFloat(review.ratingDeposit) || 5.0,
      date: new Date().toISOString().split('T')[0],
      text: review.text || '',
      verified: review.verified !== undefined ? review.verified : true
    };
    this.data.reviews[propertyId].unshift(newRev);
    this.save();
    return newRev;
  }

  // ─── TRANSACTIONS (M-PESA) ─────────────────────────────────────────────────
  createTransaction({ checkoutRequestId, merchantRequestId, phone, amount, itemType, itemName, targetPropertyId, userId, status = 'PENDING' }) {
    const tx = {
      id: 'tx-' + Date.now(),
      checkoutRequestId,
      merchantRequestId: merchantRequestId || '',
      phone,
      amount: Number(amount),
      itemType,
      itemName,
      targetPropertyId,
      userId,
      status, // 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
      mpesaReceipt: null,
      resultDesc: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.transactions.unshift(tx);
    this.save();
    return tx;
  }

  getTransactionByCheckoutId(checkoutRequestId) {
    return this.data.transactions.find(t => t.checkoutRequestId === checkoutRequestId) || null;
  }

  updateTransaction(checkoutRequestId, { status, mpesaReceipt, resultDesc }) {
    const tx = this.getTransactionByCheckoutId(checkoutRequestId);
    if (!tx) return null;

    tx.status = status;
    if (mpesaReceipt) tx.mpesaReceipt = mpesaReceipt;
    if (resultDesc) tx.resultDesc = resultDesc;
    tx.updatedAt = new Date().toISOString();

    // Auto-apply upgrades if successful
    if (status === 'SUCCESS') {
      if (tx.targetPropertyId && (tx.itemType.startsWith('top_ad') || tx.itemType.startsWith('boost'))) {
        this.boostProperty(tx.targetPropertyId, tx.itemType);
      }
      if (tx.userId && tx.itemType === 'verified_badge') {
        this.updateUser(tx.userId, { isVerified: true });
      }
    }

    this.save();
    return tx;
  }

  getAllTransactions() {
    return this.data.transactions;
  }

  // ─── ALERTS & LEADS ────────────────────────────────────────────────────────
  saveAlert(alert) {
    const entry = {
      id: 'alert-' + Date.now(),
      ...alert,
      createdAt: new Date().toISOString()
    };
    this.data.alerts.push(entry);
    this.save();
    return entry;
  }

  saveLead(type, lead) {
    const entry = {
      id: 'lead-' + Date.now(),
      type, // 'movers' | 'fibre'
      ...lead,
      createdAt: new Date().toISOString()
    };
    this.data.leads.push(entry);
    this.save();
    return entry;
  }

  // ─── MESSAGES (IN-APP INBOX / CHAT) ─────────────────────────────────────────
  getMessages(propertyId = null, userId = null) {
    this.data.messages = this.data.messages || [];
    let list = this.data.messages;
    if (propertyId) {
      list = list.filter(m => m.propertyId === propertyId);
    }
    if (userId) {
      list = list.filter(m => m.senderId === userId || m.recipientId === userId);
    }
    return list;
  }

  saveMessage(msg) {
    this.data.messages = this.data.messages || [];
    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      propertyId: msg.propertyId || null,
      propertyTitle: msg.propertyTitle || '',
      estateSuburb: msg.estateSuburb || '',
      senderId: msg.senderId || 'guest-' + Date.now(),
      senderName: msg.senderName || 'Tenant',
      senderPhone: msg.senderPhone || '',
      recipientId: msg.recipientId || null,
      recipientName: msg.recipientName || 'Landlord',
      text: (msg.text || '').trim(),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  // ─── LIVE FACEBOOK-STYLE PUBLIC COMMENTS ────────────────────────────────────
  getComments(propertyId) {
    this.data.comments = this.data.comments || {};
    return this.data.comments[propertyId] || [];
  }

  addComment(propertyId, { author, avatar, text, userId, isLandlord = false }) {
    this.data.comments = this.data.comments || {};
    if (!this.data.comments[propertyId]) {
      this.data.comments[propertyId] = [];
    }

    const cleanAuthor = author ? author.trim() : 'Nairobi Resident';
    const initials = cleanAuthor.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const newComment = {
      id: 'comm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      propertyId,
      userId: userId || null,
      author: cleanAuthor,
      avatar: avatar || initials,
      isLandlord: Boolean(isLandlord),
      text: text.trim(),
      reactions: {
        likes: 0,
        loves: 0,
        fire: 0,
        clap: 0
      },
      userReactions: {},
      replies: [],
      createdAt: new Date().toISOString()
    };

    this.data.comments[propertyId].unshift(newComment);
    this.save();
    return newComment;
  }

  addCommentReaction(propertyId, commentId, reactionType = 'likes', userId = 'anon') {
    this.data.comments = this.data.comments || {};
    const comments = this.data.comments[propertyId] || [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return null;

    comment.reactions = comment.reactions || { likes: 0, loves: 0, fire: 0, clap: 0 };
    comment.userReactions = comment.userReactions || {};

    const validTypes = ['likes', 'loves', 'fire', 'clap'];
    const type = validTypes.includes(reactionType) ? reactionType : 'likes';

    // Toggle reaction or increment
    comment.reactions[type] = (comment.reactions[type] || 0) + 1;
    comment.userReactions[userId] = type;

    this.save();
    return comment;
  }

  addCommentReply(propertyId, commentId, { author, text, isLandlord = false }) {
    this.data.comments = this.data.comments || {};
    const comments = this.data.comments[propertyId] || [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return null;

    comment.replies = comment.replies || [];
    const cleanAuthor = author ? author.trim() : 'Resident';
    const reply = {
      id: 'rep-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      author: cleanAuthor,
      isLandlord: Boolean(isLandlord),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    comment.replies.push(reply);
    this.save();
    return reply;
  }

  // ─── ADMIN & OWNER METHODS ────────────────────────────────────────────────
  getAllUsers() {
    return (this.data.users || []).map(u => this.sanitizeUser(u));
  }

  getOverviewStats() {
    const users = this.data.users || [];
    const properties = this.data.properties || [];
    const transactions = this.data.transactions || [];
    const messages = this.data.messages || [];

    const totalUsers = users.length;
    const tenants = users.filter(u => u.role === 'tenant').length;
    const landlords = users.filter(u => u.role === 'landlord').length;
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => !p.isTaken && p.status !== 'taken').length;
    const takenProperties = properties.filter(p => p.isTaken || p.status === 'taken').length;

    return {
      totalUsers,
      tenants,
      landlords,
      totalProperties,
      availableProperties,
      takenProperties,
      totalTransactions: transactions.length,
      totalMessages: messages.length,
      dbFilePath: DB_FILE,
      recentUsers: users.slice(-50).reverse().map(u => this.sanitizeUser(u))
    };
  }

  getDbFilePath() {
    return DB_FILE;
  }
}

module.exports = new Store();

