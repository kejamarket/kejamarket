-- ====================================================================
-- NAIROBI RENTAL HOUSING PLATFORM (NAIROBI RENTALS LIVE)
-- Master Relational Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Target: Nairobi Metropolitan Area & Satellite Towns (Kenya)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Role Types
CREATE TYPE user_role AS ENUM ('tenant', 'landlord', 'admin', 'bot');

-- Water Supply Availability Types
CREATE TYPE water_supply_enum AS ENUM ('Borehole Water', 'City Council Water', 'Rationed Water', 'Borehole + Council Backup', 'Water Tanker Supply');

-- Electricity Meter Types
CREATE TYPE electricity_meter_enum AS ENUM ('Prepaid (Tokens)', 'Postpaid (Monthly Bill)', 'Sub-metered (Landlord)');

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(20),
    role user_role DEFAULT 'tenant',
    is_verified BOOLEAN DEFAULT FALSE,
    id_document_url TEXT,
    verification_submitted_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. LOCATIONS TABLE (Nairobi Metropolitan & Satellite Towns)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county VARCHAR(100) NOT NULL,              -- Nairobi, Kiambu, Machakos, Kajiado
    sub_county VARCHAR(100),                   -- e.g., Westlands, Roysambu, Kasarani, Mavoko
    corridor VARCHAR(100) NOT NULL,            -- e.g., 'Westlands & Diplomatic Belt', 'Kiambu Road & Northern Bypass'
    town VARCHAR(100),                         -- e.g., Ruaka, Athi River, Kikuyu
    estate_suburb VARCHAR(100) NOT NULL,       -- e.g., Ruaka, Kilimani, Roysambu, Syokimau
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_estate ON locations(estate_suburb);
CREATE INDEX IF NOT EXISTS idx_locations_county ON locations(county);

-- 3. PROPERTIES TABLE (Rental Listings)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,            -- 'Single Room', 'Bedsitter / Studio', '1 Bedroom', '2 Bedroom', etc.
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 1,
    floor_level INT,
    rent_kes NUMERIC(10, 2) NOT NULL,
    deposit_kes NUMERIC(10, 2),
    water_supply_type VARCHAR(100) DEFAULT 'Borehole Water', -- Borehole, City Water, Rationed
    electricity_meter_type VARCHAR(100) DEFAULT 'Prepaid (Tokens)', -- Prepaid (Tokens), Postpaid
    garbage_fee_kes NUMERIC(10, 2) DEFAULT 0,
    water_bill_rate_kes NUMERIC(10, 2) DEFAULT 0,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    exact_address_notes VARCHAR(255),
    is_bnb BOOLEAN DEFAULT FALSE,              -- True for Airbnbs / BnBs / Short-Stays
    rent_period VARCHAR(20) DEFAULT 'month',   -- 'month', 'night', 'week'
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,         -- TOP AD / Featured badge
    source VARCHAR(50) DEFAULT 'direct',       -- 'direct' or 'bot'
    dedup_hash VARCHAR(64) UNIQUE,             -- SHA256 hash for scraper deduplication
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_kes);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties(latitude, longitude);

-- 4. PROPERTY AMENITIES TABLE
CREATE TABLE IF NOT EXISTS property_amenities (
    property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    has_balcony BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_electric_fence BOOLEAN DEFAULT FALSE,
    has_cctv BOOLEAN DEFAULT FALSE,
    has_internet BOOLEAN DEFAULT FALSE,
    has_tiles BOOLEAN DEFAULT FALSE,
    is_master_ensuite BOOLEAN DEFAULT FALSE,
    has_gym BOOLEAN DEFAULT FALSE,
    has_swimming_pool BOOLEAN DEFAULT FALSE,
    has_backup_generator BOOLEAN DEFAULT FALSE,
    is_pet_friendly BOOLEAN DEFAULT FALSE
);

-- 5. PROPERTY MEDIA (Photos & Floor Plans)
CREATE TABLE IF NOT EXISTS property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    watermarked_url TEXT,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_property ON property_media(property_id);

-- 6. COMMUNITY REVIEWS & RATINGS TABLE
CREATE TABLE IF NOT EXISTS property_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    rating_overall NUMERIC(2, 1) NOT NULL,     -- 1.0 to 5.0
    rating_water NUMERIC(2, 1) NOT NULL,       -- Water consistency rating (1-5)
    rating_security NUMERIC(2, 1) NOT NULL,    -- Security & safety rating (1-5)
    rating_deposit NUMERIC(2, 1) NOT NULL,     -- Deposit refund transparency (1-5)
    review_text TEXT NOT NULL,
    is_verified_tenant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_property ON property_reviews(property_id);

-- 7. AGGREGATOR BOT SCRAPE LOGS (Tracking & Deduplication)
CREATE TABLE IF NOT EXISTS bot_scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT NOT NULL,
    source_platform VARCHAR(100) NOT NULL,     -- 'public_classifieds', 'property_portal', 'social_feed'
    extracted_title VARCHAR(255),
    extracted_rent NUMERIC(10, 2),
    extracted_estate VARCHAR(100),
    status VARCHAR(50) NOT NULL,               -- 'inserted', 'duplicate_skipped', 'archived_stale'
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- HELPER STORED PROCEDURE: Stale Listing Auto-Archiving (>21 days)
-- ====================================================================
CREATE OR REPLACE PROCEDURE archive_stale_listings(days_threshold INT DEFAULT 21)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = TRUE
      AND last_verified_at < NOW() - (days_threshold || ' days')::INTERVAL;
END;
$$;
