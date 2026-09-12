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
