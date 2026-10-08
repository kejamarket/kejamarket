# KejaMarket Hierarchical Location System - Integration Guide

## Overview
This guide explains how to integrate the new hierarchical location system into the property posting form and search filters.

## Current Implementation (To Be Updated)

### Property Posting Form (`index.html` line ~1000)
```html
<div class="form-group">
  <label>Estate / Area / Suburb * <small>(Start typing...)</small></label>
  <input type="text" id="post-suburb-search" class="form-control" 
         placeholder="Type estate name (e.g. Ruaka, Kilimani...)" 
         autocomplete="off" required>
  <div id="suburb-suggestions" ...></div>
</div>
```

## New Implementation Steps

### Step 1: Add LocationSearch Component to Property Posting Form

Replace the suburb search input with:

```html
<div class="form-group">
  <label>Location * 
    <small style="color: #64748b;">(Type to search - e.g. Mlolongo, Umoja, Eastleigh)</small>
  </label>
  
  <!-- Location Search Container -->
  <div class="location-search-container">
    <i class="fas fa-map-marker-alt location-search-icon"></i>
    <input type="text" 
           id="post-location-search" 
           class="location-search-input" 
           placeholder="Start typing location..." 
           autocomplete="off" 
           required>
    <div id="post-location-results" class="location-search-results"></div>
  </div>
  
  <!-- Hidden fields to store selected location -->
  <input type="hidden" id="post-location-id" name="locationHierarchyId">
  <input type="hidden" id="post-location-name" name="locationName">
  <input type="hidden" id="post-location-path" name="locationPath">
  
  <!-- Selected location display -->
  <div id="post-location-breadcrumb" class="location-breadcrumb" style="display: none;">
    <div class="location-breadcrumb-item">
      <i class="fas fa-map-marker-alt"></i>
      <span id="post-location-display"></span>
    </div>
    <button type="button" class="location-breadcrumb-clear" onclick="postLocationSearch.clear()">
      <i class="fas fa-times"></i>
    </button>
  </div>
</div>
```

### Step 2: Initialize LocationSearch in Property Posting Form

Add to `js/landlord.js` or create new initialization in `js/app.js`:

```javascript
// Initialize location search for property posting form
let postLocationSearch = null;

function initPostPropertyLocationSearch() {
  postLocationSearch = new LocationSearch({
    inputElement: document.getElementById('post-location-search'),
    resultsContainer: document.getElementById('post-location-results'),
    
    onSelect: function(location, childLocation) {
      // User selected a location
      const selected = childLocation || location;
      
      // Store in hidden fields
      document.getElementById('post-location-id').value = selected.id;
      document.getElementById('post-location-name').value = selected.name;
      document.getElementById('post-location-path').value = selected.fullPath;
      
      // Show breadcrumb
      const breadcrumb = document.getElementById('post-location-breadcrumb');
      const display = document.getElementById('post-location-display');
      display.textContent = selected.fullPath || selected.name;
      breadcrumb.style.display = 'flex';
      
      // Store full location object for submission
      window.selectedPostLocation = selected;
    },
    
    onClear: function() {
      // Clear hidden fields
      document.getElementById('post-location-id').value = '';
      document.getElementById('post-location-name').value = '';
      document.getElementById('post-location-path').value = '';
      
      // Hide breadcrumb
      document.getElementById('post-location-breadcrumb').style.display = 'none';
      
      window.selectedPostLocation = null;
    }
  });
}

// Call when modal opens
document.addEventListener('DOMContentLoaded', function() {
  // Wait for modal to be available
  const postModal = document.getElementById('modal-post-ad');
  if (postModal) {
    // Initialize on first modal open
    const originalOpen = app.openPostPropertyModal;
    app.openPostPropertyModal = function(event) {
      originalOpen.call(app, event);
      
      // Initialize location search if not already done
      if (!postLocationSearch) {
        setTimeout(initPostPropertyLocationSearch, 100);
      }
    };
  }
});
```

### Step 3: Update Form Submission to Send Location Hierarchy ID

In the property posting form submission handler (likely in `js/landlord.js`):

```javascript
// OLD CODE (to be replaced):
const data = {
  estateSuburb: document.getElementById('post-suburb-search').value,
  county: 'Nairobi'
};

// NEW CODE:
const data = {
  // Keep legacy fields for backward compatibility
  estateSuburb: document.getElementById('post-location-name').value,
  county: window.selectedPostLocation?.county || 'Nairobi',
  
  // Add new hierarchical location fields
  locationHierarchyId: document.getElementById('post-location-id').value,
  locationName: document.getElementById('post-location-name').value,
  locationPath: document.getElementById('post-location-path').value,
  locationFullPath: window.selectedPostLocation?.fullPath,
  locationPathIds: window.selectedPostLocation ? getLocationPathIds(window.selectedPostLocation.id) : []
};

function getLocationPathIds(locationId) {
  // Get all ancestor IDs for hierarchical filtering
  const pathIds = [locationId];
  let current = postLocationSearch.locations.find(l => l.id === locationId);
  
  while (current && current.parentId) {
    pathIds.unshift(current.parentId);
    current = postLocationSearch.locations.find(l => l.id === current.parentId);
  }
  
  return pathIds;
}
```

### Step 4: Update Search Filter to Use LocationSearch

In the main property search section (index.html, around the filter sidebar):

```html
<!-- Replace existing location filter with LocationSearch -->
<div class="filter-section">
  <h4>Location</h4>
  
  <div class="location-search-container">
    <i class="fas fa-search location-search-icon"></i>
    <input type="text" 
           id="filter-location-search" 
           class="location-search-input" 
           placeholder="Search location..." 
           autocomplete="off">
    <div id="filter-location-results" class="location-search-results"></div>
  </div>
  
  <div id="filter-location-breadcrumb" class="location-breadcrumb" style="display: none;">
    <div class="location-breadcrumb-item">
      <i class="fas fa-map-marker-alt"></i>
      <span id="filter-location-display"></span>
    </div>
    <button type="button" class="location-breadcrumb-clear" onclick="filterLocationSearch.clear()">
      <i class="fas fa-times"></i>
    </button>
  </div>
</div>
```

Initialize in `js/app.js`:

```javascript
let filterLocationSearch = null;

// In NairobiRentalsApp.prototype.init or similar:
filterLocationSearch = new LocationSearch({
  inputElement: document.getElementById('filter-location-search'),
  resultsContainer: document.getElementById('filter-location-results'),
  
  onSelect: (location, childLocation) => {
    const selected = childLocation || location;
    
    // Set app's selected location for filtering
    this.selectedLocation = selected;
    this.selectedLocationId = selected.id;
    
    // Get all descendant IDs for parent search
    this.selectedLocationDescendants = filterLocationSearch.getDescendantIds(selected.id);
    
    // Show breadcrumb
    document.getElementById('filter-location-display').textContent = selected.fullPath;
    document.getElementById('filter-location-breadcrumb').style.display = 'flex';
    
    // Apply filters
    this.currentPage = 1;
    this.applyFilters();
  },
  
  onClear: () => {
    this.selectedLocation = null;
    this.selectedLocationId = null;
    this.selectedLocationDescendants = [];
    
    document.getElementById('filter-location-breadcrumb').style.display = 'none';
    
    this.applyFilters();
  }
});
```

### Step 5: Update applyFilters() to Use Descendant Matching

In `js/app.js`, the `applyFilters()` method around line 1370:

```javascript
// ENHANCED hierarchical location filtering
if (this.selectedLocation && this.selectedLocationDescendants) {
  const selectedId = this.selectedLocation.id;
  const descendantIds = this.selectedLocationDescendants;
  
  const matchesLocation = 
    // Direct match
    p.locationHierarchyId === selectedId ||
    
    // Match any descendant (e.g., Mlolongo matches Phase 1, 2, 3, 4)
    (p.locationHierarchyId && descendantIds.includes(p.locationHierarchyId)) ||
    
    // Legacy path-based matching (for old properties)
    (p.locationPathIds && p.locationPathIds.some(id => descendantIds.includes(id))) ||
    
    // Fallback string matching for properties not yet migrated
    (p.estateSuburb && p.estateSuburb.toLowerCase().includes(this.selectedLocation.name.toLowerCase())) ||
    (p.displayLocation && p.displayLocation.toLowerCase().includes(this.selectedLocation.name.toLowerCase()));
  
  if (!matchesLocation) return false;
}
```

## CSS Integration

Add the LocationSearch CSS to the page by adding to `index.html` in the `<head>` section:

```html
<!-- Hierarchical Location Search Styles -->
<link rel="stylesheet" href="css/location-search.css?v=1.0">
```

## JavaScript Integration

Add the LocationSearch script before the closing `</body>` tag:

```html
<!-- Hierarchical Location Search Component -->
<script src="js/location-search.js?v=1.0"></script>
```

## User Experience Flow

### Property Posting Flow:
1. User clicks "Post Property"
2. User types "Mlol" in location field
3. Autocomplete shows:
   - **Mlolongo** (📍 Machakos → Mlolongo) - 45 properties
   - Mlolongo Phase 1 - 12 properties
   - Mlolongo Phase 2 - 15 properties
   - ...
4. User can:
   - **Option A**: Click "Mlolongo" directly (general location)
   - **Option B**: Click "Mlolongo" then see children options:
     - "Mlolongo — All Areas" (select parent)
     - Or select Phase 1, Phase 2, Phase 3, Phase 4
5. Selected location shows as: **Machakos → Mlolongo → Phase 2**
6. Form submits with `locationHierarchyId` for hierarchical filtering

### Property Search Flow:
1. User types "Umoja" in search filter
2. Autocomplete shows:
   - **Umoja** (📍 Nairobi → Umoja) - 134 properties
   - Umoja I - 72 properties
   - Umoja II - 41 properties
   - Umoja Innercore - 21 properties
3. User selects "Umoja"
4. Results show ALL properties in:
   - Umoja (general)
   - Umoja I
   - Umoja II
   - Umoja Innercore
   - Tena
5. User can refine by selecting "Umoja I" specifically

## Database Fields

### Properties Table (Add these fields):
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_hierarchy_id UUID REFERENCES locations_hierarchy(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_path_ids UUID[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_estate_suburb VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_county VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_properties_location_hierarchy ON properties(location_hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_properties_location_path_ids ON properties USING GIN(location_path_ids);
```

### JSON Store (data.json):
Add these fields to each property object:
```json
{
  "id": "km-prop-001",
  "title": "Cozy Studio BNB - Kilimani",
  
  "locationHierarchyId": "loc-nairobi-kilimani",
  "locationPathIds": ["loc-nairobi", "loc-nairobi-kilimani"],
  "locationName": "Kilimani",
  "locationFullPath": "Nairobi → Kilimani",
  
  "estateSuburb": "Kilimani",
  "county": "Nairobi"
}
```

## Testing Scenarios

### Test 1: Parent Location Search
- **Action**: Select "Mlolongo"
- **Expected**: Returns properties from Mlolongo + Phase 1 + Phase 2 + Phase 3 + Phase 4
- **Verify**: Count should be sum of all phases

### Test 2: Specific Location Search
- **Action**: Select "Mlolongo → Phase 2"
- **Expected**: Returns ONLY Phase 2 properties
- **Verify**: Properties should have `locationHierarchyId` matching Phase 2 ID

### Test 3: Property Posting - General Location
- **Action**: Post property, select "Mlolongo" (without drilling down)
- **Expected**: Property saved with `locationHierarchyId` = Mlolongo parent ID
- **Verify**: Property appears in "Mlolongo — All Areas" search

### Test 4: Property Posting - Specific Location
- **Action**: Post property, select "Mlolongo → Phase 2"
- **Expected**: Property saved with `locationHierarchyId` = Phase 2 ID
- **Verify**: 
  - Property appears in "Mlolongo" search (parent)
  - Property appears in "Mlolongo Phase 2" search (specific)

### Test 5: Autocomplete Search
- **Action**: Type "east" in location search
- **Expected**: Shows:
  - Eastleigh
  - Eastleigh Section 1
  - Eastleigh Section 2
  - ... (all Eastleigh sections)
- **Verify**: Hierarchy displayed correctly

### Test 6: Breadcrumb Display
- **Action**: Select "Nairobi → Umoja → Umoja I"
- **Expected**: Breadcrumb shows full path with → separators
- **Verify**: Can click to clear selection

## Migration Strategy

### Phase 1: Soft Launch
1. Add new location fields to properties table
2. Keep old `estateSuburb` field populated for backward compatibility
3. New properties get both old and new fields
4. Old properties continue working with fallback matching

### Phase 2: Migration Script
Run migration to map existing properties to hierarchical locations:

```javascript
// migration-script.js
const { LocationsHierarchy } = require('./db/locations-hierarchy');
const store = require('./db/store');

async function migrateProperties() {
  const locationsDb = new LocationsHierarchy();
  const properties = store.data.properties;
  
  for (const property of properties) {
    const estateSuburb = property.estateSuburb || '';
    
    // Find matching location in hierarchy
    const results = locationsDb.search(estateSuburb, 1);
    if (results.length > 0) {
      const location = results[0];
      
      // Update property with hierarchical location
      property.locationHierarchyId = location.id;
      property.locationPathIds = getPathIds(location.id, locationsDb);
      property.locationName = location.name;
      property.locationFullPath = location.fullPath;
      property.legacy_estate_suburb = estateSuburb;
      
      console.log(`Migrated: ${property.title} → ${location.fullPath}`);
    } else {
      console.warn(`No match found for: ${estateSuburb} (${property.title})`);
    }
  }
  
  store.save();
  console.log(`✅ Migration complete! ${properties.length} properties processed.`);
}

function getPathIds(locationId, locationsDb) {
  const pathIds = [locationId];
  let current = locationsDb.getById(locationId);
  
  while (current && current.parentId) {
    pathIds.unshift(current.parentId);
    current = locationsDb.getById(current.parentId);
  }
  
  return pathIds;
}

migrateProperties();
```

### Phase 3: Full Cutover
After migration and testing:
1. Remove fallback string matching from filters
2. Make `locationHierarchyId` required for new properties
3. Archive old `estateSuburb` field (but keep for reference)

## Support & Troubleshooting

### Common Issues

**Issue**: Autocomplete not showing results
- **Solution**: Check API endpoint `/api/locations/hierarchy` is returning data
- **Debug**: Open browser console, check for 404 or network errors

**Issue**: Parent search not including children
- **Solution**: Verify `getDescendantIds()` is called and `descendantIds` includes child location IDs
- **Debug**: `console.log(filterLocationSearch.getDescendantIds(selectedId))`

**Issue**: Old properties not appearing in new searches
- **Solution**: Ensure fallback string matching is still active in `applyFilters()`
- **Consider**: Run migration script to update old properties

**Issue**: Location not persisting after page reload
- **Solution**: Ensure hidden fields are being submitted in form POST
- **Check**: Server-side is saving `locationHierarchyId` to database

## API Endpoints Reference

```
GET /api/locations/hierarchy
Returns: Array of all active hierarchical locations

GET /api/locations/search?q=mlolongo&limit=25
Returns: Search results with fuzzy matching

GET /api/locations/:id
Returns: Single location with ancestors and children

GET /api/locations/:id/children
Returns: Direct children of a location
```

## Complete Implementation Checklist

- [ ] Add location-search.css to index.html
- [ ] Add location-search.js to index.html
- [ ] Replace property posting form location input with LocationSearch
- [ ] Initialize LocationSearch for property posting
- [ ] Update form submission to send locationHierarchyId
- [ ] Replace search filter location input with LocationSearch
- [ ] Initialize LocationSearch for search filter
- [ ] Update applyFilters() to use descendant matching
- [ ] Add database fields for location hierarchy
- [ ] Test parent location search (Mlolongo returns all phases)
- [ ] Test specific location search (Phase 2 returns only Phase 2)
- [ ] Test autocomplete with various queries
- [ ] Test property posting with general location
- [ ] Test property posting with specific location
- [ ] Run migration script for existing properties
- [ ] Verify backward compatibility
- [ ] Update API documentation
- [ ] Deploy to production
- [ ] Monitor for issues

---

**Document Version:** 1.0  
**Last Updated:** October 8, 2026  
**Status:** Ready for Implementation
