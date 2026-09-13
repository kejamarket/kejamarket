-- Clear and Reseed Listings
-- This script will:
-- 1. Clear all existing listings
-- 2. Ensure is_verified column exists
-- 3. Prepare for seed data import

-- ════════════════════════════════════════
-- CLEAR ALL LISTINGS
-- ════════════════════════════════════════

-- Delete all existing properties
DELETE FROM property_media;
DELETE FROM property_reviews;
DELETE FROM comments;
DELETE FROM favourites;
DELETE FROM properties;

-- Delete all existing services
DELETE FROM service_reviews;
DELETE FROM services;

-- Delete all existing marketplace items
DELETE FROM marketplace_items;

-- ════════════════════════════════════════
-- ENSURE is_verified COLUMNS EXIST
-- ════════════════════════════════════════

-- Add is_verified to properties if not exists
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add is_verified to services if not exists
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add is_verified to marketplace_items if not exists
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- ════════════════════════════════════════
-- CREATE INDICES FOR VERIFICATION FILTERING
-- ════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(is_verified);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);

CREATE INDEX IF NOT EXISTS idx_services_verified ON services(is_verified);
CREATE INDEX IF NOT EXISTS idx_services_created ON services(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_verified ON marketplace_items(is_verified);
CREATE INDEX IF NOT EXISTS idx_marketplace_created ON marketplace_items(created_at);

-- ════════════════════════════════════════
-- CREATE VERIFICATION LOG TABLE
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verification_logs (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL, -- 'property', 'service', 'marketplace_item'
  item_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected'
  admin_id TEXT NOT NULL,
  admin_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_item ON verification_logs(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_admin ON verification_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created ON verification_logs(created_at);
