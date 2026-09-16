-- KejaMarket PostgreSQL migration schema
-- Designed to preserve the existing JSON IDs and JSON fields.
-- DO NOT replace this with the older UUID-only schema.sql.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'tenant',
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  num_properties TEXT,
  area TEXT,
  agency_name TEXT,
  contact_person TEXT,
  office_location TEXT,
  registration_no TEXT,
  coverage_area TEXT,
  created_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  rent_period TEXT,
  is_bnb BOOLEAN DEFAULT FALSE,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_level INTEGER,
  rent_kes NUMERIC(12,2),
  deposit_kes NUMERIC(12,2),
  county TEXT,
  corridor_id TEXT,
  estate_suburb TEXT,
  exact_location TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(11,7),
  water_supply_type TEXT,
  electricity_meter_type TEXT,
  garbage_fee_kes NUMERIC(12,2),
  water_rate_kes NUMERIC(12,2),
  is_featured BOOLEAN DEFAULT FALSE,
  is_top_ad BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  source TEXT,
  managed_by TEXT,
  agency_name TEXT,
  caretaker_name TEXT,
  caretaker_phone TEXT,
  landlord_id TEXT,
  created_at TIMESTAMPTZ,
  posted_time_ago TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_kes);
CREATE INDEX IF NOT EXISTS idx_properties_estate ON properties(estate_suburb);
CREATE INDEX IF NOT EXISTS idx_properties_active_featured ON properties(is_featured, is_top_ad);

CREATE TABLE IF NOT EXISTS property_media (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS property_reviews (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating_overall NUMERIC(2,1),
  rating_water NUMERIC(2,1),
  rating_security NUMERIC(2,1),
  rating_deposit NUMERIC(2,1),
  review_date DATE,
  review_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  phone TEXT,
  amount NUMERIC(12,2),
  item_type TEXT,
  item_name TEXT,
  target_property_id TEXT,
  user_id TEXT,
  status TEXT,
  mpesa_receipt TEXT,
  result_desc TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_transactions_checkout
  ON transactions(checkout_request_id);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  phone TEXT,
  category TEXT,
  estate TEXT,
  budget_min TEXT,
  budget_max TEXT,
  created_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  type TEXT,
  name TEXT,
  phone TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  property_title TEXT,
  estate_suburb TEXT,
  sender_id TEXT,
  sender_name TEXT,
  sender_phone TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT,
  author TEXT,
  avatar TEXT,
  is_landlord BOOLEAN DEFAULT FALSE,
  text TEXT,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_comments_property ON comments(property_id);
CREATE INDEX IF NOT EXISTS idx_comments_property ON comments(property_id);

-- ════════════════════════════════════════
-- PASSWORD RESET TOKENS
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

-- ════════════════════════════════════════
-- FAVOURITES
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS favourites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourites(user_id);

-- ════════════════════════════════════════
-- WHATSAPP ALERT SUBSCRIPTIONS
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS whatsapp_alert_subs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  phone TEXT NOT NULL,
  category TEXT,
  estate TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wa_subs_phone ON whatsapp_alert_subs(phone);
CREATE INDEX IF NOT EXISTS idx_wa_subs_active ON whatsapp_alert_subs(is_active);


-- ════════════════════════════════════════
-- SERVICES (Service Providers)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_name TEXT,
  provider_phone TEXT,
  provider_rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  is_verified BOOLEAN DEFAULT FALSE,
  coverage_area TEXT,
  service_hours TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_verified ON services(is_verified);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- ════════════════════════════════════════
-- SERVICE REVIEWS & RATINGS
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS service_reviews (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating NUMERIC(2,1) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);

-- ════════════════════════════════════════
-- MARKETPLACE (Used Items for Sale)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketplace_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name TEXT,
  seller_phone TEXT,
  price_kes NUMERIC(12,2),
  condition TEXT,
  item_type TEXT,
  is_negotiable BOOLEAN DEFAULT FALSE,
  location_suburb TEXT,
  location_corridor TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_price ON marketplace_items(price_kes);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_condition ON marketplace_items(condition);

-- KejaMarket Communication System Database Schema
-- Supporting User-to-User, User-to-Platform, and System-to-User communication

-- Conversations table (User-to-User communication)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'property', 'bnb', 'service', 'marketplace'
  related_id TEXT NOT NULL, -- property_id, service_id, item_id, etc.
  related_type TEXT NOT NULL, -- 'property', 'bnb', 'service', 'marketplace_item'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'closed'
  participant_1 TEXT NOT NULL REFERENCES users(id),
  participant_2 TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unread_count_p1 INTEGER DEFAULT 0, -- unread count for participant 1
  unread_count_p2 INTEGER DEFAULT 0, -- unread count for participant 2
  metadata JSONB DEFAULT '{}', -- inquiry type, property details, etc.
  CONSTRAINT valid_conversation_type CHECK (type IN ('property', 'bnb', 'service', 'marketplace'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_related ON conversations(related_id, related_type);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- Messages table (for conversations)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'inquiry', 'response', 'system'
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Support Tickets table (User-to-Platform communication)
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, -- Format: KM-XXXXX
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL, -- 'account', 'property', 'messages', 'payments', etc.
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'
  assigned_to TEXT REFERENCES users(id), -- support staff user
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT valid_ticket_category CHECK (category IN ('account', 'property', 'messages', 'payments', 'bnb', 'marketplace', 'services', 'safety', 'verification', 'technical', 'other')),
  CONSTRAINT valid_ticket_priority CHECK (priority IN ('normal', 'high', 'urgent')),
  CONSTRAINT valid_ticket_status CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- Support Messages table (for support tickets)
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- internal notes not visible to user
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);

-- Notifications table (System-to-User communication)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'inquiry', 'system', 'support', 'payment', 'verification', 'safety'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT NULL, -- conversation_id, ticket_id, property_id, etc.
  related_type TEXT NULL, -- 'conversation', 'support_ticket', 'property', etc.
  read_at TIMESTAMP NULL,
  action_url TEXT NULL, -- deep link to relevant page
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL, -- for temporary notifications
  metadata JSONB DEFAULT '{}',
  CONSTRAINT valid_notification_type CHECK (type IN ('inquiry', 'system', 'support', 'payment', 'verification', 'safety', 'marketing'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Interaction Events table (tracking external communications)
CREATE TABLE IF NOT EXISTS interaction_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  related_id TEXT NOT NULL, -- property_id, service_id, etc.
  related_type TEXT NOT NULL, -- 'property', 'service', 'marketplace_item'
  interaction_type TEXT NOT NULL, -- 'whatsapp_click', 'call_click', 'inquiry_sent'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}', -- additional tracking data
  CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('whatsapp_click', 'call_click', 'inquiry_sent', 'viewing_requested', 'contact_revealed'))
);

CREATE INDEX IF NOT EXISTS idx_interaction_events_user ON interaction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_related ON interaction_events(related_id, related_type);
CREATE INDEX IF NOT EXISTS idx_interaction_events_type ON interaction_events(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interaction_events_created_at ON interaction_events(created_at);

-- Communication Preferences table
CREATE TABLE IF NOT EXISTS communication_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  whatsapp_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  inquiry_notifications BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,
  support_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property Communication Settings (for landlords/hosts/providers)
CREATE TABLE IF NOT EXISTS property_communication_settings (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL, -- reference to property/service/item
  property_type TEXT NOT NULL, -- 'rental', 'bnb', 'service', 'marketplace_item'
  owner_id TEXT NOT NULL REFERENCES users(id),
  primary_contact_id TEXT REFERENCES users(id), -- can be different from owner (agent, caretaker)
  show_phone BOOLEAN DEFAULT FALSE,
  show_whatsapp BOOLEAN DEFAULT FALSE,
  auto_respond BOOLEAN DEFAULT FALSE,
  auto_response_message TEXT,
  business_hours JSONB DEFAULT '{}', -- availability schedule
  preferred_contact_method TEXT DEFAULT 'kejamarket', -- 'kejamarket', 'phone', 'whatsapp', 'email'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_property_type CHECK (property_type IN ('rental', 'bnb', 'service', 'marketplace_item')),
  CONSTRAINT valid_contact_method CHECK (preferred_contact_method IN ('kejamarket', 'phone', 'whatsapp', 'email'))
);

CREATE INDEX IF NOT EXISTS idx_property_comm_settings_property ON property_communication_settings(property_id, property_type);
CREATE INDEX IF NOT EXISTS idx_property_comm_settings_owner ON property_communication_settings(owner_id);

-- User Communication Stats (for analytics)
CREATE TABLE IF NOT EXISTS user_communication_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  total_inquiries_sent INTEGER DEFAULT 0,
  total_inquiries_received INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_support_tickets INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2), -- average response time for received inquiries
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default communication preferences for existing users
INSERT INTO communication_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM communication_preferences);

-- Create notification triggers
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for message recipient
  INSERT INTO notifications (
    id, user_id, type, title, message, related_id, related_type, action_url
  )
  SELECT 
    'notif_' || EXTRACT(EPOCH FROM NOW()) || '_' || NEW.id,
    CASE 
      WHEN c.participant_1 = NEW.sender_id THEN c.participant_2
      ELSE c.participant_1
    END,
    'inquiry',
    'New Message',
    LEFT(NEW.message_text, 100) || CASE WHEN LENGTH(NEW.message_text) > 100 THEN '...' ELSE '' END,
    NEW.conversation_id,
    'conversation',
    '#conversations'
  FROM conversations c 
  WHERE c.id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Create support ticket notification trigger
CREATE OR REPLACE FUNCTION notify_support_ticket()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user when ticket status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO notifications (
      id, user_id, type, title, message, related_id, related_type, action_url
    ) VALUES (
      'notif_' || EXTRACT(EPOCH FROM NOW()) || '_' || NEW.id,
      NEW.user_id,
      'support',
      'Support Ticket Update',
      'Your support ticket ' || NEW.id || ' status changed to: ' || NEW.status,
      NEW.id,
      'support_ticket',
      '#support-tickets'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_support_ticket
  AFTER UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION notify_support_ticket();

-- Insert sample data for testing
INSERT INTO conversations (id, type, related_id, related_type, participant_1, participant_2, metadata) VALUES
('conv_sample_001', 'property', 'prop_greenview_a02', 'property', 'usr_tenant_001', 'usr_landlord_001', 
 '{"property_name": "Greenview Apartments - A02", "inquiry_type": ["availability", "viewing"]}'),
('conv_sample_002', 'bnb', 'bnb_sunset_001', 'bnb', 'usr_guest_001', 'usr_host_001',
 '{"property_name": "Sunset BNB", "checkin": "2024-09-20", "checkout": "2024-09-22", "guests": 2}');

INSERT INTO messages (id, conversation_id, sender_id, message_text, message_type) VALUES
('msg_sample_001', 'conv_sample_001', 'usr_tenant_001', 'Hi, is this 2-bedroom apartment still available?', 'inquiry'),
('msg_sample_002', 'conv_sample_001', 'usr_landlord_001', 'Yes, it is available. Would you like to schedule a viewing?', 'response'),
('msg_sample_003', 'conv_sample_002', 'usr_guest_001', 'Hello, I would like to check availability for Sep 20-22 for 2 guests.', 'inquiry'),
('msg_sample_004', 'conv_sample_002', 'usr_host_001', 'Those dates are available! Here are the booking details...', 'response');

INSERT INTO support_tickets (id, user_id, category, subject, priority, status) VALUES
('KM-10001', 'usr_tenant_001', 'account', 'Account verification taking too long', 'normal', 'resolved'),
('KM-10002', 'usr_landlord_001', 'property', 'Property not showing in search', 'high', 'open');

INSERT INTO support_messages (id, ticket_id, sender_id, message_text, is_internal) VALUES
('smsg_001', 'KM-10001', 'usr_tenant_001', 'My account verification has been pending for 3 days.', FALSE),
('smsg_002', 'KM-10001', 'usr_support_001', 'We have reviewed your documents and approved your verification.', FALSE),
('smsg_003', 'KM-10002', 'usr_landlord_001', 'My property listing disappeared from search results yesterday.', FALSE);

-- Communication System Health Check
CREATE OR REPLACE FUNCTION communication_system_health_check()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  count BIGINT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Conversations'::TEXT,
    'Active'::TEXT,
    COUNT(*),
    'Total active conversations between users'::TEXT
  FROM conversations WHERE status = 'active'
  
  UNION ALL
  
  SELECT 
    'Messages'::TEXT,
    'Total'::TEXT,
    COUNT(*),
    'All messages sent through the system'::TEXT
  FROM messages
  
  UNION ALL
  
  SELECT 
    'Support Tickets'::TEXT,
    'Open'::TEXT,
    COUNT(*),
    'Support tickets requiring attention'::TEXT
  FROM support_tickets WHERE status IN ('open', 'in_progress')
  
  UNION ALL
  
  SELECT 
    'Notifications'::TEXT,
    'Unread'::TEXT,
    COUNT(*),
    'Unread notifications across all users'::TEXT
  FROM notifications WHERE read_at IS NULL
  
  UNION ALL
  
  SELECT 
    'Interaction Events'::TEXT,
    'Today'::TEXT,
    COUNT(*),
    'Communication interactions recorded today'::TEXT
  FROM interaction_events WHERE created_at >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

COMMENT ON TABLE conversations IS 'User-to-user conversations for properties, BNBs, services, and marketplace items';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE support_tickets IS 'User-to-platform support tickets and help requests';
COMMENT ON TABLE support_messages IS 'Messages within support tickets, including internal notes';
COMMENT ON TABLE notifications IS 'System-to-user notifications for all types of events';
COMMENT ON TABLE interaction_events IS 'Tracking of external communication events (WhatsApp, calls, etc.)';
COMMENT ON TABLE communication_preferences IS 'User preferences for different types of notifications';
COMMENT ON TABLE property_communication_settings IS 'Communication settings per property/service/item';
COMMENT ON TABLE user_communication_stats IS 'Communication statistics and analytics per user';

-- Success message
SELECT 'KejaMarket Communication System database schema installed successfully!' as result;