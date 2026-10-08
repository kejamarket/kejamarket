-- ====================================================================
-- KEJAMARKET - HIERARCHICAL LOCATION SYSTEM
-- PostgreSQL Schema for Comprehensive Nairobi & Environs Coverage
-- ====================================================================

-- Location Type Enum
CREATE TYPE location_type AS ENUM (
    'county',              -- Nairobi, Kiambu, Machakos, Kajiado, Murang'a
    'sub_county',          -- Westlands, Kasarani, Mavoko, etc.
    'town',                -- Ruiru, Thika, Kitengela, Athi River
    'major_area',          -- Umoja, Eastleigh, Dandora, Mlolongo
    'estate',              -- Specific estates/neighbourhoods
    'neighbourhood',       -- Local neighbourhoods
    'phase',               -- Phase 1, Phase 2, etc.
    'section',             -- Section 1, Section 8, etc.
    'zone',                -- Zone A, Zone H, etc.
    'village',             -- Smaller villages
    'locality',            -- Specific localities
    'informal_settlement'  -- Recognized informal settlements
);

-- Hierarchical Locations Table
CREATE TABLE IF NOT EXISTS locations_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES locations_hierarchy(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type location_type NOT NULL,
    
    -- Administrative details
    county VARCHAR(100),
    sub_county VARCHAR(100),
    
    -- Search & Display
    full_path TEXT,                    -- e.g., "Nairobi → Umoja → Umoja I → Zone H"
    aliases TEXT[],                    -- Alternative names/spellings
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE, -- Verified from official sources
    is_active BOOLEAN DEFAULT TRUE,    -- Can be searched/selected
    verification_source TEXT,          -- Source of verification
    
    -- Coordinates (optional, for mapping)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Property counts (cached, updated periodically)
    property_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(slug, parent_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations_hierarchy(slug);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations_hierarchy(type);
CREATE INDEX IF NOT EXISTS idx_locations_county ON locations_hierarchy(county);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations_hierarchy(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_verified ON locations_hierarchy(is_verified);
CREATE INDEX IF NOT EXISTS idx_locations_name_search ON locations_hierarchy USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_locations_full_path ON locations_hierarchy(full_path);

-- Update properties table to reference hierarchical locations
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_hierarchy_id UUID REFERENCES locations_hierarchy(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_location_hierarchy ON properties(location_hierarchy_id);

-- Preserve existing location data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_estate_suburb VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_county VARCHAR(100);

-- Function to get all descendant location IDs (for parent search)
CREATE OR REPLACE FUNCTION get_descendant_locations(location_uuid UUID)
RETURNS TABLE(descendant_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
        -- Base case: the location itself
        SELECT id FROM locations_hierarchy WHERE id = location_uuid
        UNION ALL
        -- Recursive case: children of descendants
        SELECT lh.id
        FROM locations_hierarchy lh
        INNER JOIN descendants d ON lh.parent_id = d.id
    )
    SELECT id FROM descendants;
END;
$$ LANGUAGE plpgsql;

-- Function to build full path for a location
CREATE OR REPLACE FUNCTION build_location_path(location_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    path_parts TEXT[];
    current_id UUID;
    current_name VARCHAR(255);
    parent_id UUID;
BEGIN
    current_id := location_uuid;
    
    WHILE current_id IS NOT NULL LOOP
        SELECT name, parent_id INTO current_name, parent_id
        FROM locations_hierarchy
        WHERE id = current_id;
        
        IF current_name IS NOT NULL THEN
            path_parts := array_prepend(current_name, path_parts);
        END IF;
        
        current_id := parent_id;
    END LOOP;
    
    RETURN array_to_string(path_parts, ' → ');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update full_path when location changes
CREATE OR REPLACE FUNCTION update_location_full_path()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_path := build_location_path(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_path
    BEFORE INSERT OR UPDATE ON locations_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_location_full_path();

-- Function to update property counts
CREATE OR REPLACE PROCEDURE update_location_property_counts()
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE locations_hierarchy lh
    SET property_count = (
        SELECT COUNT(*)
        FROM properties p
        WHERE p.location_hierarchy_id IN (
            SELECT descendant_id FROM get_descendant_locations(lh.id)
        )
        AND p.is_active = TRUE
    );
END;
$$;

-- View for easy location browsing with parent info
CREATE OR REPLACE VIEW locations_with_parent AS
SELECT 
    l.id,
    l.name,
    l.slug,
    l.type,
    l.county,
    l.full_path,
    l.is_verified,
    l.is_active,
    l.property_count,
    p.name AS parent_name,
    p.id AS parent_id
FROM locations_hierarchy l
LEFT JOIN locations_hierarchy p ON l.parent_id = p.id
WHERE l.is_active = TRUE;

-- ====================================================================
-- COMMENTS
-- ====================================================================

COMMENT ON TABLE locations_hierarchy IS 'Hierarchical location system supporting county → sub-county → town → estate → phase → section → zone structure';
COMMENT ON COLUMN locations_hierarchy.parent_id IS 'Parent location (NULL for top-level counties)';
COMMENT ON COLUMN locations_hierarchy.full_path IS 'Human-readable path: "Nairobi → Umoja → Umoja I → Zone H"';
COMMENT ON COLUMN locations_hierarchy.aliases IS 'Alternative names for fuzzy search (e.g., ["Mlolongo Town", "Mlolongo area"])';
COMMENT ON COLUMN locations_hierarchy.is_verified IS 'TRUE if verified from official government/planning documents';
COMMENT ON COLUMN locations_hierarchy.verification_source IS 'Citation of verification source';
COMMENT ON FUNCTION get_descendant_locations IS 'Returns all descendant location IDs for parent search functionality';
