/**
 * KejaMarket - Hierarchical Location System (JSON Implementation)
 * Supports parent-child relationships, descendant search, and comprehensive Nairobi + environs coverage
 * Browser + Node.js compatible
 */

// Node.js dependencies (only used server-side)
const isNode = typeof module !== 'undefined' && module.exports;
const fs = isNode ? require('fs') : null;
const path = isNode ? require('path') : null;

const LOCATIONS_FILE = isNode ? path.join(__dirname, 'locations-data.json') : null;

/**
 * Location Types
 */
const LocationType = {
  COUNTY: 'county',
  SUB_COUNTY: 'sub_county',
  TOWN: 'town',
  MAJOR_AREA: 'major_area',
  ESTATE: 'estate',
  NEIGHBOURHOOD: 'neighbourhood',
  PHASE: 'phase',
  SECTION: 'section',
  ZONE: 'zone',
  VILLAGE: 'village',
  LOCALITY: 'locality',
  INFORMAL_SETTLEMENT: 'informal_settlement'
};

class LocationsHierarchy {
  constructor(locationsData = null) {
    this.locations = [];
    this.locationsById = new Map();
    this.locationsBySlug = new Map();
    
    // Browser environment - data must be passed in
    if (locationsData) {
      this.locations = locationsData;
      this.buildIndexes();
    }
    // Node.js environment - load from file
    else if (isNode) {
      this.init();
    }
  }

  init() {
    try {
      if (fs && fs.existsSync(LOCATIONS_FILE)) {
        const raw = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
        this.locations = JSON.parse(raw);
        this.buildIndexes();
      } else {
        console.log('No locations file found, will be created on first save');
        this.locations = [];
      }
    } catch (err) {
      console.error('Error loading locations file:', err);
      this.locations = [];
    }
  }

  buildIndexes() {
    this.locationsById.clear();
    this.locationsBySlug.clear();
    
    for (const loc of this.locations) {
      this.locationsById.set(loc.id, loc);
      if (loc.slug) {
        this.locationsBySlug.set(loc.slug, loc);
      }
    }
  }

  save() {
    if (!isNode || !fs) {
      console.warn('save() only works in Node.js environment');
      return;
    }
    try {
      fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(this.locations, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving locations file:', err);
    }
  }

  /**
   * Generate slug from name
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'loc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Build full path for a location (e.g., "Nairobi → Umoja → Umoja I")
   */
  buildFullPath(locationId) {
    const parts = [];
    let current = this.locationsById.get(locationId);
    
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? this.locationsById.get(current.parentId) : null;
    }
    
    return parts.join(' → ');
  }

  /**
   * Get all descendant location IDs (including the location itself)
   * This is CRITICAL for parent search functionality
   */
  getDescendantIds(locationId) {
    const descendants = new Set([locationId]);
    const queue = [locationId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      
      // Find all children
      for (const loc of this.locations) {
        if (loc.parentId === currentId && !descendants.has(loc.id)) {
          descendants.add(loc.id);
          queue.push(loc.id);
        }
      }
    }
    
    return Array.from(descendants);
  }

  /**
   * Get location by ID
   */
  getById(id) {
    return this.locationsById.get(id);
  }

  /**
   * Get location by slug
   */
  getBySlug(slug) {
    return this.locationsBySlug.get(slug);
  }

  /**
   * Get children of a location
   */
  getChildren(parentId) {
    return this.locations.filter(loc => loc.parentId === parentId && loc.isActive);
  }

  /**
   * Search locations (fuzzy, supports autocomplete)
   */
  search(query, options = {}) {
    const { limit = 20, onlyVerified = false, parentId = null } = options;
    
    if (!query || query.length < 2) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    for (const loc of this.locations) {
      if (!loc.isActive) continue;
      if (onlyVerified && !loc.isVerified) continue;
      if (parentId && loc.parentId !== parentId) continue;
      
      const nameLower = loc.name.toLowerCase();
      const fullPathLower = loc.fullPath ? loc.fullPath.toLowerCase() : '';
      
      // Exact match gets highest priority
      if (nameLower === lowerQuery) {
        results.push({ ...loc, matchScore: 100 });
        continue;
      }
      
      // Starts with query
      if (nameLower.startsWith(lowerQuery)) {
        results.push({ ...loc, matchScore: 90 });
        continue;
      }
      
      // Contains query
      if (nameLower.includes(lowerQuery)) {
        results.push({ ...loc, matchScore: 70 });
        continue;
      }
      
      // Full path contains query
      if (fullPathLower.includes(lowerQuery)) {
        results.push({ ...loc, matchScore: 50 });
        continue;
      }
      
      // Check aliases
      if (loc.aliases && Array.isArray(loc.aliases)) {
        for (const alias of loc.aliases) {
          if (alias.toLowerCase().includes(lowerQuery)) {
            results.push({ ...loc, matchScore: 60 });
            break;
          }
        }
      }
    }
    
    // Sort by match score (descending), then by property count (descending)
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (b.propertyCount || 0) - (a.propertyCount || 0);
    });
    
    return results.slice(0, limit);
  }

  /**
   * Add a new location
   */
  addLocation(data) {
    const id = this.generateId();
    const slug = this.slugify(data.name);
    
    const location = {
      id,
      parentId: data.parentId || null,
      name: data.name,
      slug,
      type: data.type,
      county: data.county || null,
      subCounty: data.subCounty || null,
      fullPath: '',
      aliases: data.aliases || [],
      isVerified: data.isVerified || false,
      isActive: data.isActive !== false,
      verificationSource: data.verificationSource || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      sortOrder: data.sortOrder || 0,
      propertyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.locations.push(location);
    this.buildIndexes();
    
    // Update full path
    location.fullPath = this.buildFullPath(id);
    
    this.save();
    return location;
  }

  /**
   * Update location property counts
   * Should be called periodically or after property changes
   */
  updatePropertyCounts(properties) {
    const counts = new Map();
    
    // Count direct properties for each location
    for (const prop of properties) {
      if (prop.locationHierarchyId && prop.isActive !== false) {
        counts.set(prop.locationHierarchyId, (counts.get(prop.locationHierarchyId) || 0) + 1);
      }
    }
    
    // Propagate counts up the hierarchy (parent includes children)
    for (const loc of this.locations) {
      let totalCount = counts.get(loc.id) || 0;
      
      // Add counts from all descendants
      const descendants = this.getDescendantIds(loc.id);
      for (const descId of descendants) {
        if (descId !== loc.id) {
          totalCount += counts.get(descId) || 0;
        }
      }
      
      loc.propertyCount = totalCount;
    }
    
    this.save();
  }

  /**
   * Get all active locations
   */
  getAllActive() {
    return this.locations.filter(loc => loc.isActive);
  }

  /**
   * Get top-level locations (counties)
   */
  getTopLevel() {
    return this.locations.filter(loc => !loc.parentId && loc.isActive);
  }

  /**
   * Find location by name (exact match, case-insensitive)
   */
  findByName(name, parentId = null) {
    const nameLower = name.toLowerCase();
    return this.locations.find(loc => 
      loc.name.toLowerCase() === nameLower && 
      (!parentId || loc.parentId === parentId)
    );
  }

  /**
   * Get breadcrumb path for a location
   */
  getBreadcrumbs(locationId) {
    const breadcrumbs = [];
    let current = this.locationsById.get(locationId);
    
    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug,
        type: current.type
      });
      current = current.parentId ? this.locationsById.get(current.parentId) : null;
    }
    
    return breadcrumbs;
  }

  /**
   * Export all locations (for debugging)
   */
  exportAll() {
    return this.locations;
  }
}

// Export for Node.js
if (isNode) {
  module.exports = {
    LocationsHierarchy,
    LocationType
  };
}

// Export for browser (global window object)
if (typeof window !== 'undefined') {
  window.LocationsHierarchy = LocationsHierarchy;
  window.LocationType = LocationType;
}
