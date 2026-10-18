-- ════════════════════════════════════════════════════════════════════════════
-- KEJAMARKET VIEWING BOOKING SYSTEM — Migration
-- Version: 1.0 | Date: 2026-10-18
-- Phase 1 of KejaMarket Spec v1.1 Implementation
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND properties table with listing lifecycle columns
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_status TEXT NOT NULL DEFAULT 'published'
    CONSTRAINT valid_listing_status CHECK (listing_status IN (
      'draft', 'pending_review', 'published', 'temporarily_unconfirmed',
      'occupied', 'rejected', 'archived'
    )),
  ADD COLUMN IF NOT EXISTS listing_manager_type TEXT DEFAULT 'owner'
    CONSTRAINT valid_manager_type CHECK (listing_manager_type IN (
      'owner', 'agency', 'caretaker', 'property_manager'
    )),
  ADD COLUMN IF NOT EXISTS availability_last_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reconfirmation_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backup_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS backup_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS authorised_to_list BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_gps_unlock_requires_payment BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_reconfirmation ON properties(reconfirmation_due_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. VIEWING REQUESTS — tenant's request, full state machine
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viewing_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  alternate_date DATE,
  alternate_time TEXT,
  confirmed_date DATE,
  confirmed_time TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_property_confirmation'
    CONSTRAINT valid_viewing_status CHECK (status IN (
      'awaiting_property_confirmation',
      'escalated_to_admin',
      'slot_confirmed_awaiting_payment',
      'awaiting_alternative',
      'declined',
      'payment_initiated',
      'payment_processing',
      'booking_confirmed',
      'payment_failed',
      'payment_expired',
      'completed',
      'tenant_no_show',
      'landlord_cancelled',
      'property_unavailable',
      'rescheduled',
      'cancelled',
      'disputed'
    )),
  rep_notified_at TIMESTAMPTZ,
  rep_notification_channel TEXT,
  rep_delivery_status TEXT DEFAULT 'sent',
  escalation_due_at TIMESTAMPTZ,
  confirmation_source TEXT,
  confirmed_by_staff_id TEXT REFERENCES users(id),
  confirmation_method TEXT,
  confirmation_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  decline_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TIMESTAMPTZ,
  assigned_admin_id TEXT REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_escalation ON viewing_requests(escalation_due_at);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_created ON viewing_requests(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. VIEWING BOOKINGS — confirmed + paid bookings
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viewing_bookings (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES viewing_requests(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES users(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  viewing_date DATE NOT NULL,
  viewing_time TEXT NOT NULL,
  payment_transaction_id TEXT REFERENCES transactions(id),
  payment_amount NUMERIC(12,2) NOT NULL DEFAULT 200.00,
  payment_currency TEXT NOT NULL DEFAULT 'KES',
  payment_verified_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'mpesa',
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CONSTRAINT valid_booking_status CHECK (status IN (
      'awaiting_payment', 'payment_initiated', 'confirmed',
      'completed', 'tenant_no_show', 'landlord_cancelled',
      'rescheduled', 'refunded', 'disputed'
    )),
  contact_unlocked_at TIMESTAMPTZ,
  gps_unlocked_at TIMESTAMPTZ,
  unlocked_contact_snapshot JSONB,
  outcome_recorded_at TIMESTAMPTZ,
  outcome_recorded_by TEXT REFERENCES users(id),
  outcome_notes TEXT,
  refund_initiated_at TIMESTAMPTZ,
  refund_reason TEXT,
  refund_amount NUMERIC(12,2),
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  receipt_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_viewing_bookings_tenant ON viewing_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_bookings_property ON viewing_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_bookings_status ON viewing_bookings(status);
CREATE INDEX IF NOT EXISTS idx_viewing_bookings_date ON viewing_bookings(viewing_date);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. VIEWING SLOT LOCKS — prevent double-booking
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viewing_slot_locks (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  viewing_date DATE NOT NULL,
  viewing_time TEXT NOT NULL,
  request_id TEXT NOT NULL REFERENCES viewing_requests(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_released BOOLEAN DEFAULT FALSE,
  UNIQUE(property_id, viewing_date, viewing_time)
);

CREATE INDEX IF NOT EXISTS idx_slot_locks_expires ON viewing_slot_locks(expires_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. VIEWING POLICY ACCEPTANCES — audit that tenant saw no-show policy
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viewing_policy_acceptances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES users(id),
  request_id TEXT NOT NULL REFERENCES viewing_requests(id),
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  policy_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_policy_acceptance_request ON viewing_policy_acceptances(request_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. LINK transactions to viewing requests
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS viewing_request_id TEXT REFERENCES viewing_requests(id),
  ADD COLUMN IF NOT EXISTS viewing_booking_id TEXT REFERENCES viewing_bookings(id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. SYSTEM SETTINGS for fee & timers
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO system_settings (key, value, description, updated_at)
VALUES
  ('viewing_commitment_fee_kes', '200'::jsonb, 'KSh fee per confirmed viewing', NOW()),
  ('viewing_escalation_seconds', '60'::jsonb, 'Seconds before escalation to admin', NOW()),
  ('viewing_payment_window_minutes', '15'::jsonb, 'Payment window after confirmation', NOW()),
  ('listing_reconfirmation_days', '14'::jsonb, 'Days before reconfirmation required', NOW()),
  ('listing_archive_days', '21'::jsonb, 'Days without confirmation before auto-archive', NOW())
ON CONFLICT (key) DO NOTHING;
