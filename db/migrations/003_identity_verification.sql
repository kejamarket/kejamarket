-- KejaMarket Identity Verification System
-- Stores ID documents, verification status, and approval workflow

CREATE TABLE IF NOT EXISTS identity_verifications (
  id TEXT PRIMARY KEY DEFAULT ('idverif-' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'kra_pin')),
  document_number TEXT NOT NULL,
  document_front_url TEXT NOT NULL,
  document_back_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expiry_date DATE,
  verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_identity_user ON identity_verifications(user_id);
CREATE INDEX idx_identity_status ON identity_verifications(status);
CREATE INDEX idx_identity_created ON identity_verifications(created_at DESC);

-- Landlord verification (separate from identity - proves property ownership)
CREATE TABLE IF NOT EXISTS landlord_verifications (
  id TEXT PRIMARY KEY DEFAULT ('landverif-' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  title_deed_url TEXT,
  lease_agreement_url TEXT,
  kra_pin_cert_url TEXT,
  ownership_proof_type TEXT CHECK (ownership_proof_type IN ('title_deed', 'lease', 'power_of_attorney', 'company_registration')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  verified_by TEXT REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landlord_user ON landlord_verifications(user_id);
CREATE INDEX idx_landlord_property ON landlord_verifications(property_id);
CREATE INDEX idx_landlord_status ON landlord_verifications(status);

-- Verification notes/comments
CREATE TABLE IF NOT EXISTS verification_notes (
  id TEXT PRIMARY KEY DEFAULT ('note-' || gen_random_uuid()::text),
  verification_id TEXT NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'landlord')),
  author_id TEXT NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_notes ON verification_notes(verification_id, verification_type);

COMMENT ON TABLE identity_verifications IS 'User identity verification via government ID';
COMMENT ON TABLE landlord_verifications IS 'Property ownership verification for landlords';
COMMENT ON TABLE verification_notes IS 'Internal notes during verification process';
