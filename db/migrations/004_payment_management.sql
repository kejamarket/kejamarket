-- KejaMarket Payment & Transaction Management
-- Comprehensive payment tracking, reconciliation, and refund workflows

-- Check if transactions table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'transactions') THEN
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY DEFAULT ('txn-' || gen_random_uuid()::text),
      user_id TEXT NOT NULL REFERENCES users(id),
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'payment', 'refund', 'commission', 'service_fee', 'concierge_payment')),
      amount DECIMAL(12, 2) NOT NULL,
      currency TEXT DEFAULT 'KES',
      payment_method TEXT CHECK (payment_method IN ('mpesa', 'card', 'bank_transfer', 'wallet')),
      mpesa_receipt TEXT,
      mpesa_transaction_id TEXT,
      mpesa_phone TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed', 'refunded')),
      description TEXT,
      reference_type TEXT,
      reference_id TEXT,
      reconciled BOOLEAN DEFAULT FALSE,
      reconciled_by TEXT REFERENCES users(id),
      reconciled_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled ON transactions(reconciled, created_at DESC);

-- Refund requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id TEXT PRIMARY KEY DEFAULT ('refund-' || gen_random_uuid()::text),
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
  requested_by TEXT NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  executed_by TEXT REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  mpesa_refund_receipt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON refund_requests(created_at DESC);

-- Payment reconciliation sessions
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
  id TEXT PRIMARY KEY DEFAULT ('recon-' || gen_random_uuid()::text),
  reconciled_by TEXT NOT NULL REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  reconciled_count INTEGER DEFAULT 0,
  discrepancies_found INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_period ON reconciliation_sessions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON reconciliation_sessions(status);

-- Commission tracking
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY DEFAULT ('comm-' || gen_random_uuid()::text),
  transaction_id TEXT REFERENCES transactions(id),
  property_id TEXT REFERENCES properties(id),
  landlord_id TEXT REFERENCES users(id),
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'paid', 'disputed')),
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_transaction ON commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commissions_property ON commissions(property_id);
CREATE INDEX IF NOT EXISTS idx_commissions_landlord ON commissions(landlord_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

COMMENT ON TABLE transactions IS 'All financial transactions in the system';
COMMENT ON TABLE refund_requests IS 'Refund workflow with multi-step approval';
COMMENT ON TABLE reconciliation_sessions IS 'Financial reconciliation tracking';
COMMENT ON TABLE commissions IS 'Commission calculations and payments';
