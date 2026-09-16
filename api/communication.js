/**
 * KejaMarket Communication API Endpoints
 * Handles conversations, messages, support tickets, and notifications
 */

const express = require('express');
const router = express.Router();
const pool = require('../db/pool'); // Assuming database pool is configured
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate unique IDs
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * CONVERSATIONS ENDPOINTS
 */

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT c.*, 
             CASE 
               WHEN c.participant_1 = $1 THEN c.unread_count_p1
               ELSE c.unread_count_p2
             END as unread_count,
             CASE 
               WHEN c.participant_1 = $1 THEN u2.name
               ELSE u1.name
             END as other_participant_name,
             CASE 
               WHEN c.participant_1 = $1 THEN u2.role
               ELSE u1.role
             END as other_participant_role,
             m.message_text as last_message,
             m.created_at as last_message_at
      FROM conversations c
      LEFT JOIN users u1 ON c.participant_1 = u1.id
      LEFT JOIN users u2 ON c.participant_2 = u2.id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE c.participant_1 = $1 OR c.participant_2 = $1
      ORDER BY c.last_message_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      conversations: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create new conversation (property inquiry)
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, relatedId, relatedType, participantId, initialMessage, metadata } = req.body;
    
    // Check if conversation already exists
    const existingQuery = `
      SELECT id FROM conversations 
      WHERE related_id = $1 AND related_type = $2 
      AND ((participant_1 = $3 AND participant_2 = $4) 
           OR (participant_1 = $4 AND participant_2 = $3))
    `;
    
    const existing = await pool.query(existingQuery, [relatedId, relatedType, userId, participantId]);
    
    let conversationId;
    
    if (existing.rows.length > 0) {
      conversationId = existing.rows[0].id;
    } else {
      // Create new conversation
      conversationId = generateId('conv');
      
      const insertQuery = `
        INSERT INTO conversations (id, type, related_id, related_type, participant_1, participant_2, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      await pool.query(insertQuery, [conversationId, type, relatedId, relatedType, userId, participantId, JSON.stringify(metadata || {})]);
    }
    
    // Add initial message
    const messageId = generateId('msg');
    const messageQuery = `
      INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const messageResult = await pool.query(messageQuery, [
      messageId, 
      conversationId, 
      userId, 
      initialMessage, 
      'inquiry', 
      JSON.stringify(metadata || {})
    ]);
    
    // Update conversation timestamp
    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
    
    res.json({
      success: true,
      conversation_id: conversationId,
      message: messageResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Verify user is participant in conversation
    const authQuery = `
      SELECT id FROM conversations 
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
    `;
    
    const authResult = await pool.query(authQuery, [conversationId, userId]);
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Get messages
    const messagesQuery = `
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `;
    
    const messagesResult = await pool.query(messagesQuery, [conversationId]);
    
    // Mark messages as read
    await pool.query(
      `UPDATE messages SET read_at = CURRENT_TIMESTAMP 
       WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [conversationId, userId]
    );
    
    // Reset unread count
    await pool.query(
      `UPDATE conversations SET 
       unread_count_p1 = CASE WHEN participant_1 = $2 THEN 0 ELSE unread_count_p1 END,
       unread_count_p2 = CASE WHEN participant_2 = $2 THEN 0 ELSE unread_count_p2 END
       WHERE id = $1`,
      [conversationId, userId]
    );
    
    res.json({
      success: true,
      messages: messagesResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message to conversation
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { message, messageType = 'text', attachments = [] } = req.body;
    
    // Verify user is participant
    const authQuery = `
      SELECT participant_1, participant_2 FROM conversations 
      WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)
    `;
    
    const authResult = await pool.query(authQuery, [conversationId, userId]);
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Insert message
    const messageId = generateId('msg');
    const insertQuery = `
      INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      messageId, conversationId, userId, message, messageType, JSON.stringify(attachments)
    ]);
    
    // Update conversation timestamp and unread counts
    const conversation = authResult.rows[0];
    const otherParticipant = conversation.participant_1 === userId ? conversation.participant_2 : conversation.participant_1;
    const unreadField = conversation.participant_1 === userId ? 'unread_count_p2' : 'unread_count_p1';
    
    await pool.query(
      `UPDATE conversations SET 
       last_message_at = CURRENT_TIMESTAMP,
       ${unreadField} = ${unreadField} + 1
       WHERE id = $1`,
      [conversationId]
    );
    
    res.json({
      success: true,
      message: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * SUPPORT TICKETS ENDPOINTS
 */

// Get all support tickets for a user
router.get('/support-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT t.*, 
             COUNT(sm.id) as message_count,
             MAX(sm.created_at) as last_message_at
      FROM support_tickets t
      LEFT JOIN support_messages sm ON t.id = sm.ticket_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      tickets: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Create new support ticket
router.post('/support-tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subject, description, priority = 'normal' } = req.body;
    
    // Generate ticket ID
    const ticketNumber = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `KM-${ticketNumber}`;
    
    // Insert ticket
    const ticketQuery = `
      INSERT INTO support_tickets (id, user_id, category, subject, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
    `;
    
    const ticketResult = await pool.query(ticketQuery, [ticketId, userId, category, subject, priority]);
    
    // Add initial message
    const messageId = generateId('smsg');
    const messageQuery = `
      INSERT INTO support_messages (id, ticket_id, sender_id, message_text, is_internal)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `;
    
    const messageResult = await pool.query(messageQuery, [messageId, ticketId, userId, description]);
    
    // Send auto-acknowledgment
    const autoMessageId = generateId('smsg');
    const autoMessage = `Hello! We've received your support request (${ticketId}).\n\nOur support team will review your issue and respond within 24 hours.\n\nFor urgent issues, our typical response time is 2-4 hours.\n\nThank you for contacting KejaMarket!`;
    
    await pool.query(messageQuery, [autoMessageId, ticketId, 'system', autoMessage]);
    
    res.json({
      success: true,
      ticket: ticketResult.rows[0],
      initial_message: messageResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get messages for a support ticket
router.get('/support-tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    
    // Verify user owns the ticket
    const authQuery = 'SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2';
    const authResult = await pool.query(authQuery, [ticketId, userId]);
    
    if (authResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }
    
    // Get messages (excluding internal notes)
    const messagesQuery = `
      SELECT sm.*, u.name as sender_name, u.role as sender_role
      FROM support_messages sm
      LEFT JOIN users u ON sm.sender_id = u.id
      WHERE sm.ticket_id = $1 AND sm.is_internal = false
      ORDER BY sm.created_at ASC
    `;
    
    const result = await pool.query(messagesQuery, [ticketId]);
    
    res.json({
      success: true,
      messages: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    res.status(500).json({ error: 'Failed to fetch ticket messages' });
  }
});

/**
 * NOTIFICATIONS ENDPOINTS
 */

// Get notifications for user
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, unread_only = false } = req.query;
    
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    if (unread_only === 'true') {
      query += ` AND read_at IS NULL`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      notifications: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notifications as read
router.post('/notifications/mark-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_ids } = req.body;
    
    if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const placeholders = notification_ids.map((_, index) => `$${index + 2}`).join(', ');
      const query = `
        UPDATE notifications 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND id IN (${placeholders})
      `;
      
      await pool.query(query, [userId, ...notification_ids]);
    } else {
      // Mark all notifications as read
      await pool.query(
        'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL',
        [userId]
      );
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * INTERACTION EVENTS ENDPOINTS
 */

// Record interaction event (WhatsApp click, call click, etc.)
router.post('/interactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { relatedId, relatedType, interactionType, metadata = {} } = req.body;
    
    const eventId = generateId('int');
    const query = `
      INSERT INTO interaction_events (id, user_id, related_id, related_type, interaction_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(query, [eventId, userId, relatedId, relatedType, interactionType, JSON.stringify(metadata)]);
    
    res.json({
      success: true,
      event: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

/**
 * ADMIN ENDPOINTS (for support staff)
 */

// Get all support tickets (admin only)
router.get('/admin/support-tickets', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const query = `
      SELECT t.*, u.name as user_name, u.phone as user_phone,
             COUNT(sm.id) as message_count,
             MAX(sm.created_at) as last_message_at
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN support_messages sm ON t.id = sm.ticket_id
      GROUP BY t.id, u.name, u.phone
      ORDER BY 
        CASE WHEN t.status = 'open' THEN 1 
             WHEN t.status = 'in_progress' THEN 2 
             ELSE 3 END,
        CASE WHEN t.priority = 'urgent' THEN 1 
             WHEN t.priority = 'high' THEN 2 
             ELSE 3 END,
        t.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      tickets: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

module.exports = router;