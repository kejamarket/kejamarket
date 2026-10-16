-- KejaMarket Fraud Detection & Advanced Analytics

-- Fraud detection flags
CREATE TABLE IF NOT EXISTS fraud_flags (
  id TEXT PRIMARY KEY DEFAULT ('fraud-' || gen_random_uuid()::text),
  user_id TEXT REFERENCES users(id),
  transaction_id TEXT REFERENCES transactions(id),
  property_id TEXT REFERENCES properties(id),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('suspicious_activity', 'duplicate_listing', 'fake_documents', 'payment_fraud', 'identity_theft', 'spam', 'scam_attempt')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  auto_detected BOOLEAN DEFAULT TRUE,
  detection_rules TEXT[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive', 'confirmed')),
  assigned_to TEXT REFERENCES users(id),
  investigated_by TEXT REFERENCES users(id),
  investigated_at TIMESTAMPTZ,
  resolution_notes TEXT,
  action_taken TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_user ON fraud_flags(user_id);
CREATE INDEX idx_fraud_transaction ON fraud_flags(transaction_id);
CREATE INDEX idx_fraud_property ON fraud_flags(property_id);
CREATE INDEX idx_fraud_status ON fraud_flags(status);
CREATE INDEX idx_fraud_severity ON fraud_flags(severity, status);
CREATE INDEX idx_fraud_created ON fraud_flags(created_at DESC);

-- User risk scores
CREATE TABLE IF NOT EXISTS user_risk_scores (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  total_flags INTEGER DEFAULT 0,
  confirmed_frauds INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  factors JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_level ON user_risk_scores(risk_level, risk_score DESC);
CREATE INDEX idx_risk_score ON user_risk_scores(risk_score DESC);

-- Advanced analytics metrics (daily aggregates)
CREATE TABLE IF NOT EXISTS analytics_daily (
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, metric_type, metric_name)
);

CREATE INDEX idx_analytics_date ON analytics_daily(date DESC);
CREATE INDEX idx_analytics_type ON analytics_daily(metric_type, date DESC);

-- Real-time analytics cache
CREATE TABLE IF NOT EXISTS analytics_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_expiry ON analytics_cache(expires_at);

-- Notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id TEXT PRIMARY KEY DEFAULT ('notif-' || gen_random_uuid()::text),
  recipient_id TEXT NOT NULL REFERENCES users(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push', 'in_app')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT,
  message TEXT NOT NULL,
  template_id TEXT,
  template_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notification_queue(recipient_id);
CREATE INDEX idx_notifications_status ON notification_queue(status, priority);
CREATE INDEX idx_notifications_created ON notification_queue(created_at DESC);

-- Bulk operations tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id TEXT PRIMARY KEY DEFAULT ('bulk-' || gen_random_uuid()::text),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('approve_listings', 'reject_listings', 'ban_users', 'send_messages', 'update_properties', 'export_data')),
  initiated_by TEXT NOT NULL REFERENCES users(id),
  target_count INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  parameters JSONB,
  results JSONB DEFAULT '[]'::jsonb,
  error_log TEXT[],
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulk_ops_initiated ON bulk_operations(initiated_by);
CREATE INDEX idx_bulk_ops_status ON bulk_operations(status);
CREATE INDEX idx_bulk_ops_created ON bulk_operations(created_at DESC);

COMMENT ON TABLE fraud_flags IS 'Suspicious activity detection and investigation';
COMMENT ON TABLE user_risk_scores IS 'User fraud risk assessment';
COMMENT ON TABLE analytics_daily IS 'Daily aggregated metrics for dashboard';
COMMENT ON TABLE notification_queue IS 'Email/SMS notification delivery queue';
COMMENT ON TABLE bulk_operations IS 'Track bulk admin operations';
