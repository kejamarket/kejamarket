/**
 * KejaMarket Master Location Service
 * Hierarchical location management, intelligent search engine, and persistent storage
 */

const fs = require('fs');
const path = require('path');

const LOCATIONS_FILE = path.join(__dirname, 'locations-data.json');

class LocationService {
  constructor() {
    this.locations = [];
    this.locationMap = new Map();
    this.childrenMap = new Map();
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(LOCATIONS_FILE)) {
        const raw = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
        this.locations = JSON.parse(raw);
      } else {
        this.locations = [];
      }
    } catch (err) {
      console.error('Error loading locations file:', err.message);
      this.locations = [];
    }

    this.rebuildIndexes();
    this.initialized = true;
    console.log(`📍 LocationService initialized with ${this.locations.length} locations`);
  }

  rebuildIndexes() {
    this.locationMap.clear();
    this.childrenMap.clear();

    for (const loc of this.locations) {
      this.locationMap.set(loc.id, loc);
      const parentId = loc.parentId || 'ROOT';
      if (!this.childrenMap.has(parentId)) {
        this.childrenMap.set(parentId, []);
      }
      this.childrenMap.get(parentId).push(loc);
    }
  }

  save() {
    try {
      fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(this.locations, null, 2), 'utf-8');
      this.rebuildIndexes();
      return true;
    } catch (err) {
      console.error('Error saving locations file:', err.message);
      return false;
    }
  }

  getAll(options = {}) {
    let list = this.locations.filter(l => l.status !== 'archived');
    if (options.county) {
      list = list.filter(l => (l.county || '').toLowerCase() === options.county.toLowerCase());
    }
    if (options.type) {
      list = list.filter(l => l.type === options.type);
    }
    if (options.parentId !== undefined) {
      const targetParent = options.parentId === 'null' || options.parentId === '' ? null : options.parentId;
      list = list.filter(l => l.parentId === targetParent);
    }
    return list;
  }

  getById(id) {
    return this.locationMap.get(id) || null;
  }

  getChildren(parentId = null) {
    const key = parentId || 'ROOT';
    return (this.childrenMap.get(key) || []).filter(l => l.status !== 'archived');
  }

  getAncestors(id) {
    const ancestors = [];
    let curr = this.getById(id);
    while (curr && curr.parentId) {
      const parent = this.getById(curr.parentId);
      if (parent) {
        ancestors.unshift(parent);
        curr = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  /**
   * Search locations intelligently matching:
   * - exact name
   * - partial name
   * - aliases (e.g. "Buru 3", "Eastleigh Sec 7", "Rongai")
   * - parent + child hierarchical combinations (e.g. "Nyayo Phase 2", "Buruburu Phase 3", "Sheshe Gardens Phase 1")
   */
  search(query, limit = 25) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      // Return popular top-level areas / estates by default
      return this.locations
        .filter(l => l.status !== 'archived' && (l.type === 'ESTATE' || l.type === 'AREA'))
        .slice(0, limit);
    }

    const STOP_WORDS = new Set(['phase', 'gate', 'section', 'sec', 'court', 'stage', 'road', 'estate', 'area', 'sub-area', 'town', 'county', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);

    const rawQ = query.trim().toLowerCase();
    const cleanQ = rawQ.replace(/['’]/g, '');
    const tokens = cleanQ.split(/\s+/).filter(t => t.length > 0);
    const nonStopTokens = tokens.filter(t => !STOP_WORDS.has(t));

    const scored = [];

    for (const loc of this.locations) {
      if (loc.status === 'archived') continue;

      const locName = (loc.name || '').toLowerCase().replace(/['’]/g, '');
      const pathStr = (loc.pathString || '').toLowerCase().replace(/['’]/g, '');
      const searchTerms = (loc.searchTerms || []).map(t => t.toLowerCase().replace(/['’]/g, ''));
      const aliases = (loc.aliases || []).map(a => a.toLowerCase().replace(/['’]/g, ''));

      let score = 0;

      // Check if ALL tokens appear in the path, search terms, or aliases
      const allTokensInPath = tokens.every(token => 
        pathStr.includes(token) || searchTerms.some(st => st.includes(token)) || aliases.some(a => a.includes(token))
      );

      // In multi-token queries, verify distinctive (non-stop) words are matched
      const matchesNonStop = nonStopTokens.length === 0 || nonStopTokens.every(token => 
        pathStr.includes(token) || searchTerms.some(st => st.includes(token)) || aliases.some(a => a.includes(token))
      );

      // For queries with 2+ tokens, skip candidates that don't match the distinctive parent keywords
      if (tokens.length >= 2 && !matchesNonStop) {
        continue;
      }

      // 1. Exact name match
      if (locName === cleanQ) {
        score += 300;
      } else if (locName.startsWith(cleanQ)) {
        score += 200;
      } else if (locName.includes(cleanQ)) {
        score += 150;
      }

      // 2. Exact alias match
      if (aliases.some(a => a === cleanQ)) {
        score += 250;
      } else if (aliases.some(a => a.startsWith(cleanQ))) {
        score += 180;
      } else if (aliases.some(a => a.includes(cleanQ))) {
        score += 120;
      }

      // 3. Multi-token hierarchical matching (e.g. "Nyayo Phase 2" or "Sheshe Gardens Phase 1")
      if (allTokensInPath) {
        score += 200 + (tokens.length * 30);

        // Boost leaf nodes that specifically match the query
        const lastToken = tokens[tokens.length - 1];
        if (locName.includes(lastToken)) {
          score += 50;
        }

        // Boost if query matches the sequence in pathString
        if (pathStr.includes(cleanQ)) {
          score += 100;
        }
      } else {
        const matchCount = tokens.filter(t => pathStr.includes(t) || aliases.some(a => a.includes(t)) || searchTerms.some(st => st.includes(t))).length;
        score += matchCount * 30;
      }

      // Boost verified locations
      if (loc.verified) {
        score += 10;
      }

      // Specific micro-locations boost
      if (loc.type === 'PHASE' || loc.type === 'GATE' || loc.type === 'SECTION') {
        if (tokens.length > 1) {
          score += 20;
        }
      }

      if (score > 60) {
        scored.push({
          location: loc,
          score,
          childCount: (this.childrenMap.get(loc.id) || []).length
        });
      }
    }

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => ({
      ...s.location,
      childCount: s.childCount
    }));
  }

  // ----------------------------------------------------
  // ADMIN LOCATION MANAGEMENT (CRUD)
  // ----------------------------------------------------

  addLocation(data) {
    if (!data.name || !data.type) {
      throw new Error('Location name and type are required');
    }

    let parent = null;
    let countyId = data.countyId || 'loc-county-nairobi';
    let county = data.county || 'Nairobi';
    let metroGroup = data.metroGroup || 'Nairobi & Environs';

    if (data.parentId) {
      parent = this.getById(data.parentId);
      if (parent) {
        countyId = parent.countyId;
        county = parent.county;
        metroGroup = parent.metroGroup;
      }
    }

    const slug = data.name.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-');
    let id = data.id || (parent ? `${parent.id}-${slug}` : `loc-${slug}`);
    
    // Ensure uniqueness
    if (this.locationMap.has(id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }

    const path = parent ? [...parent.path, data.name] : [data.name];
    const pathIds = parent ? [...parent.pathIds, id] : [id];
    const pathString = path.join(' > ');

    const searchTerms = new Set();
    searchTerms.add(data.name.toLowerCase());
    if (parent) {
      searchTerms.add(`${parent.name} ${data.name}`.toLowerCase());
      for (const p of parent.path) {
        searchTerms.add(`${p} ${data.name}`.toLowerCase());
      }
    }
    (data.aliases || []).forEach(a => searchTerms.add(a.toLowerCase()));

    // Human display path
    let displayLocation = data.name;
    if (path.length >= 3) {
      const reversed = [...path].reverse();
      const leaf = reversed[0];
      const immediate = reversed[1];
      const mid = reversed.slice(2, -1).reverse().join(', ');
      const top = reversed[reversed.length - 1];
      displayLocation = `${immediate} · ${leaf}${mid ? ' · ' + mid : ''}, ${top}`;
    } else if (path.length === 2) {
      displayLocation = `${path[1]}, ${path[0]}`;
    }

    const newLoc = {
      id,
      name: data.name.trim(),
      type: data.type.toUpperCase(),
      parentId: parent ? parent.id : null,
      countyId,
      county,
      metroGroup,
      aliases: data.aliases || [],
      searchTerms: Array.from(searchTerms),
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      verified: data.verified !== false,
      sortOrder: data.sortOrder || 0,
      status: 'active',
      path,
      pathIds,
      pathString,
      displayLocation
    };

    this.locations.push(newLoc);
    this.save();
    return newLoc;
  }

  updateLocation(id, updates) {
    const loc = this.getById(id);
    if (!loc) {
      throw new Error(`Location with id ${id} not found`);
    }

    // If name or parentId changed, recalculate paths for this and all descendants
    const nameChanged = updates.name && updates.name !== loc.name;
    const parentChanged = updates.parentId !== undefined && updates.parentId !== loc.parentId;

    Object.assign(loc, updates);

    if (nameChanged || parentChanged) {
      this.recalculatePaths(loc);
    } else {
      // Update search terms
      const searchTerms = new Set();
      searchTerms.add(loc.name.toLowerCase());
      (loc.path || []).forEach(p => searchTerms.add(`${p} ${loc.name}`.toLowerCase()));
      (loc.aliases || []).forEach(a => searchTerms.add(a.toLowerCase()));
      loc.searchTerms = Array.from(searchTerms);
    }

    this.save();
    return loc;
  }

  recalculatePaths(targetLoc) {
    const parent = targetLoc.parentId ? this.getById(targetLoc.parentId) : null;
    targetLoc.path = parent ? [...parent.path, targetLoc.name] : [targetLoc.name];
    targetLoc.pathIds = parent ? [...parent.pathIds, targetLoc.id] : [targetLoc.id];
    targetLoc.pathString = targetLoc.path.join(' > ');

    if (parent) {
      targetLoc.countyId = parent.countyId;
      targetLoc.county = parent.county;
      targetLoc.metroGroup = parent.metroGroup;
    }

    // Refresh displayLocation
    if (targetLoc.path.length >= 3) {
      const reversed = [...targetLoc.path].reverse();
      const leaf = reversed[0];
      const immediate = reversed[1];
      const mid = reversed.slice(2, -1).reverse().join(', ');
      const top = reversed[reversed.length - 1];
      targetLoc.displayLocation = `${immediate} · ${leaf}${mid ? ' · ' + mid : ''}, ${top}`;
    } else if (targetLoc.path.length === 2) {
      targetLoc.displayLocation = `${targetLoc.path[1]}, ${targetLoc.path[0]}`;
    } else {
      targetLoc.displayLocation = targetLoc.name;
    }

    // Rebuild searchTerms
    const searchTerms = new Set();
    searchTerms.add(targetLoc.name.toLowerCase());
    targetLoc.path.forEach(p => searchTerms.add(`${p} ${targetLoc.name}`.toLowerCase()));
    (targetLoc.aliases || []).forEach(a => searchTerms.add(a.toLowerCase()));
    targetLoc.searchTerms = Array.from(searchTerms);

    // Recursively update children
    const children = this.childrenMap.get(targetLoc.id) || [];
    for (const child of children) {
      this.recalculatePaths(child);
    }
  }

  deleteLocation(id) {
    const loc = this.getById(id);
    if (!loc) throw new Error(`Location with id ${id} not found`);

    // Mark as archived (soft delete) to preserve historical listings
    loc.status = 'archived';

    // Also mark children as archived
    const children = this.childrenMap.get(id) || [];
    children.forEach(c => (c.status = 'archived'));

    this.save();
    return true;
  }

  moveLocation(id, newParentId) {
    return this.updateLocation(id, { parentId: newParentId });
  }

  mergeLocations(sourceId, targetId) {
    const source = this.getById(sourceId);
    const target = this.getById(targetId);

    if (!source || !target) {
      throw new Error('Both source and target locations must exist to merge');
    }

    // Add source name and aliases into target aliases
    const combinedAliases = new Set([...(target.aliases || []), source.name, ...(source.aliases || [])]);
    target.aliases = Array.from(combinedAliases);

    // Move all children of source to target
    const children = this.childrenMap.get(sourceId) || [];
    for (const child of children) {
      child.parentId = targetId;
      this.recalculatePaths(child);
    }

    // Archive source
    source.status = 'archived';

    this.save();
    return target;
  }
}

const locationService = new LocationService();
module.exports = locationService;
