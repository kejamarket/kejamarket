-- KejaMarket Audit Logging Migration
-- Phase 1: Security & Trust - Immutable audit trail

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY DEFAULT ('audit-' || gen_random_uuid()::text),
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  before_state JSONB,
  after_state JSONB,
  request_id TEXT,
  ip_address INET,
  user_agent TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
  error_message TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_events(severity, created_at DESC) WHERE severity IN ('error', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_outcome ON audit_events(outcome, created_at DESC) WHERE outcome = 'failure';

-- Prevent modification/deletion of audit events
CREATE RULE audit_no_delete AS ON DELETE TO audit_events DO INSTEAD NOTHING;
CREATE RULE audit_no_update AS ON UPDATE TO audit_events DO INSTEAD NOTHING;

-- Create function to auto-log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_events (
    event_type,
    actor_id,
    action,
    resource_type,
    resource_id,
    before_state,
    after_state,
    outcome
  ) VALUES (
    'permission_change',
    CURRENT_USER,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on role and permission changes
CREATE TRIGGER role_permissions_audit
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION log_permission_change();

CREATE TRIGGER user_roles_audit
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION log_permission_change();

-- Authentication failure tracking
CREATE TABLE IF NOT EXISTS auth_failures (
  id TEXT PRIMARY KEY DEFAULT ('auth-fail-' || gen_random_uuid()::text),
  identifier TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_failures_identifier ON auth_failures(identifier, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_failures_ip ON auth_failures(ip_address, attempted_at DESC);

-- Auto-cleanup old auth failures (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_auth_failures()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_failures WHERE attempted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Security event types enum for better categorization
COMMENT ON TABLE audit_events IS 'Immutable audit trail - cannot be deleted or modified';
COMMENT ON COLUMN audit_events.event_type IS 'Category: auth, permission, moderation, payment, system';
COMMENT ON COLUMN audit_events.severity IS 'Event severity for alerting and filtering';
COMMENT ON TABLE auth_failures IS 'Track failed login attempts for security monitoring';

-- Create materialized view for audit summary (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS audit_summary AS
SELECT 
  DATE(created_at) as date,
  event_type,
  action,
  outcome,
  COUNT(*) as event_count,
  COUNT(DISTINCT actor_id) as unique_actors
FROM audit_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, action, outcome;

CREATE UNIQUE INDEX ON audit_summary (date, event_type, action, outcome);

-- Function to refresh audit summary
CREATE OR REPLACE FUNCTION refresh_audit_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY audit_summary;
END;
$$ LANGUAGE plpgsql;
