/**
 * Master Location System Seed Builder for KejaMarket
 * Constructs the complete hierarchical location dataset according to the prompt spec.
 */

const fs = require('fs');
const path = require('path');

const locations = [];
const idSet = new Set();

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addLocation({
  id,
  name,
  type,
  parent = null,
  countyId,
  county,
  metroGroup = 'Nairobi & Environs',
  aliases = [],
  latitude = null,
  longitude = null,
  verified = true,
  sortOrder = 0
}) {
  let finalId = id || (parent ? `${parent.id}-${slugify(name)}` : `loc-${slugify(name)}`);
  
  // Ensure unique ID
  if (idSet.has(finalId)) {
    let counter = 2;
    while (idSet.has(`${finalId}-${counter}`)) {
      counter++;
    }
    finalId = `${finalId}-${counter}`;
  }
  idSet.add(finalId);

  const path = parent ? [...parent.path, name] : [name];
  const pathIds = parent ? [...parent.pathIds, finalId] : [finalId];
  const pathString = path.join(' > ');

  // Compute search names and aliases
  const searchTermsSet = new Set();
  searchTermsSet.add(name.toLowerCase());
  if (parent) {
    searchTermsSet.add(`${parent.name} ${name}`.toLowerCase());
    searchTermsSet.add(`${name} ${parent.name}`.toLowerCase());
    // Add path combinations e.g. "Nyayo Phase 2", "Buruburu Phase 3", "Eastleigh Section 7"
    for (const ancestor of parent.path) {
      searchTermsSet.add(`${ancestor} ${name}`.toLowerCase());
    }
  }

  (aliases || []).forEach(a => {
    if (a) {
      searchTermsSet.add(a.toLowerCase());
      if (parent) searchTermsSet.add(`${parent.name} ${a}`.toLowerCase());
    }
  });

  // Calculate friendly displayLocation
  // e.g.: "Nyayo Estate · Gate A · Phase 2 · Embakasi, Nairobi"
  let displayLocation = name;
  if (path.length >= 3) {
    // Reverse hierarchical representation
    const reversed = [...path].reverse();
    const leaf = reversed[0];
    const immediate = reversed[1];
    const mid = reversed.slice(2, -1).reverse().join(', ');
    const top = reversed[reversed.length - 1];
    displayLocation = `${immediate} · ${leaf}${mid ? ' · ' + mid : ''}, ${top}`;
  } else if (path.length === 2) {
    displayLocation = `${path[1]}, ${path[0]}`;
  } else {
    displayLocation = path[0];
  }

  const record = {
    id: finalId,
    name,
    type,
    parentId: parent ? parent.id : null,
    countyId,
    county,
    metroGroup,
    aliases: aliases || [],
    searchTerms: Array.from(searchTermsSet),
    latitude,
    longitude,
    verified,
    sortOrder,
    status: 'active',
    path,
    pathIds,
    pathString,
    displayLocation
  };

  locations.push(record);
  return record;
}

// ----------------------------------------------------
// 1. COUNTIES (ROOT LEVEL)
// ----------------------------------------------------
const nairobiCounty = addLocation({
  id: 'loc-county-nairobi',
  name: 'Nairobi',
  type: 'COUNTY',
  countyId: 'loc-county-nairobi',
  county: 'Nairobi',
  aliases: ['Nairobi County', 'Nai'],
  latitude: -1.2921,
  longitude: 36.8219,
  sortOrder: 1
});

const kiambuCounty = addLocation({
  id: 'loc-county-kiambu',
  name: 'Kiambu',
  type: 'COUNTY',
  countyId: 'loc-county-kiambu',
  county: 'Kiambu',
  aliases: ['Kiambu County'],
  latitude: -1.1714,
  longitude: 36.8356,
  sortOrder: 2
});

const machakosCounty = addLocation({
  id: 'loc-county-machakos',
  name: 'Machakos',
  type: 'COUNTY',
  countyId: 'loc-county-machakos',
  county: 'Machakos',
  aliases: ['Machakos County', 'Mks'],
  latitude: -1.5177,
  longitude: 37.2634,
  sortOrder: 3
});

const kajiadoCounty = addLocation({
  id: 'loc-county-kajiado',
  name: 'Kajiado',
  type: 'COUNTY',
  countyId: 'loc-county-kajiado',
  county: 'Kajiado',
  aliases: ['Kajiado County'],
  latitude: -1.8524,
  longitude: 36.7768,
  sortOrder: 4
});

// Helper builder
function createSubTree(parent, data) {
  for (const item of data) {
    const loc = addLocation({
      name: item.name,
      type: item.type || 'ESTATE',
      parent,
      countyId: parent.countyId,
      county: parent.county,
      metroGroup: parent.metroGroup,
      aliases: item.aliases || [],
      latitude: item.lat || null,
      longitude: item.lng || null
    });

    if (item.children && item.children.length > 0) {
      createSubTree(loc, item.children);
    }
  }
}

// ----------------------------------------------------
// 2. NAIROBI AREAS & ESTATES
// ----------------------------------------------------

// WESTLANDS / NORTH-WEST
const westlandsArea = addLocation({
  name: 'Westlands',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Westlands Area']
});

createSubTree(westlandsArea, [
  { name: 'Westlands CBD', type: 'NEIGHBOURHOOD', aliases: ['Westlands Centre', 'Sarit Area', 'Westgate Area'] },
  {
    name: 'Parklands',
    type: 'ESTATE',
    aliases: ['Parklands Area'],
    children: [
      { name: '1st Parklands', type: 'ROAD', aliases: ['1st Parklands Ave'] },
      { name: '2nd Parklands', type: 'ROAD', aliases: ['2nd Parklands Ave'] },
      { name: '3rd Parklands', type: 'ROAD', aliases: ['3rd Parklands Ave'] },
      { name: '4th Parklands', type: 'ROAD', aliases: ['4th Parklands Ave'] },
      { name: '5th Parklands', type: 'ROAD', aliases: ['5th Parklands Ave'] },
      { name: '6th Parklands', type: 'ROAD', aliases: ['6th Parklands Ave'] },
      { name: 'Highridge', type: 'NEIGHBOURHOOD' },
      { name: 'City Park', type: 'LANDMARK', aliases: ['City Park Environs'] }
    ]
  },
  { name: 'Highridge', type: 'NEIGHBOURHOOD' },
  { name: 'Kitisuru', type: 'ESTATE', aliases: ['Old Kitisuru', 'New Kitisuru'] },
  { name: 'Loresho', type: 'ESTATE' },
  { name: 'Spring Valley', type: 'ESTATE' },
  { name: 'Kangemi', type: 'ESTATE', aliases: ['Waruku', 'Posta Kangemi'] },
  { name: 'Mountain View', type: 'ESTATE' },
  { name: 'Lower Kabete', type: 'AREA' },
  { name: 'Upper Kabete', type: 'AREA' },
  { name: 'Brookside', type: 'ESTATE', aliases: ['Brookside Drive'] },
  { name: 'Muthangari', type: 'NEIGHBOURHOOD' },
  { name: 'Riverside', type: 'ESTATE', aliases: ['Riverside Drive'] },
  { name: 'Gigiri', type: 'ESTATE', aliases: ['UN Gigiri'] },
  {
    name: 'Runda',
    type: 'ESTATE',
    aliases: ['Runda Estate'],
    children: [
      { name: 'Mimosa', type: 'SUB_AREA', aliases: ['Runda Mimosa'] },
      { name: 'Meadows', type: 'SUB_AREA', aliases: ['Runda Meadows'] },
      { name: 'Evergreen', type: 'SUB_AREA', aliases: ['Runda Evergreen'] },
      { name: 'Paradise', type: 'SUB_AREA', aliases: ['Runda Paradise'] }
    ]
  },
  { name: 'Rosslyn', type: 'ESTATE', aliases: ['Rosslyn Lone Tree', 'Rosslyn Riviera'] },
  { name: 'Nyari', type: 'ESTATE' },
  { name: 'Thigiri', type: 'ESTATE', aliases: ['Thigiri Ridge'] },
  { name: 'Ridgeways', type: 'ESTATE' },
  { name: 'Garden Estate', type: 'ESTATE' },
  { name: 'Muthaiga', type: 'ESTATE', aliases: ['Old Muthaiga'] },
  { name: 'Muthaiga North', type: 'ESTATE' },
  { name: 'New Muthaiga', type: 'ESTATE' },
  { name: 'Marurui', type: 'NEIGHBOURHOOD' },
  { name: 'Githogoro', type: 'NEIGHBOURHOOD' },
  { name: 'Kibagare', type: 'NEIGHBOURHOOD' },
  { name: 'Fourways', type: 'ESTATE', aliases: ['Fourways Junction'] },
  { name: 'Thome', type: 'ESTATE' },
  { name: 'Safari Park', type: 'NEIGHBOURHOOD' },
  { name: 'City Park', type: 'LANDMARK' }
]);

// KILIMANI / KILELESHWA / LAVINGTON
const kilimaniArea = addLocation({
  name: 'Kilimani',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Kilimani Area']
});

createSubTree(kilimaniArea, [
  { name: 'Yaya', type: 'LANDMARK', aliases: ['Yaya Centre', 'Yaya Area'] },
  { name: 'Hurlingham', type: 'ESTATE' },
  { name: 'Adams Arcade', type: 'LANDMARK', aliases: ['Adams'] },
  { name: 'Adams', type: 'NEIGHBOURHOOD' },
  { name: 'Hatheru', type: 'ROAD', aliases: ['Hatheru Road'] },
  { name: 'Valley Arcade', type: 'LANDMARK' },
  { name: 'Woodlands', type: 'ROAD' },
  { name: 'Wood Avenue', type: 'ROAD' },
  { name: 'Dennis Pritt Road', type: 'ROAD', aliases: ['Dennis Pritt'] },
  { name: 'Argwings Kodhek Road', type: 'ROAD', aliases: ['Argwings Kodhek'] },
  { name: 'Kabarnet Gardens', type: 'ESTATE' },
  { name: 'Riara', type: 'ROAD', aliases: ['Riara Road'] },
  { name: 'Woodley', type: 'ESTATE' },
  { name: 'Golf Course', type: 'ESTATE' },
  { name: 'Jamhuri', type: 'ESTATE', aliases: ['Jamhuri Estate'] },
  { name: 'Ngong Road', type: 'ROAD' },
  { name: 'Prestige area', type: 'LANDMARK', aliases: ['Prestige Plaza', 'Prestige'] }
]);

const kileleshwaArea = addLocation({
  name: 'Kileleshwa',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Kile']
});

createSubTree(kileleshwaArea, [
  { name: 'Riverside', type: 'ROAD', aliases: ['Riverside Drive'] },
  { name: 'Laikipia Road', type: 'ROAD' },
  { name: 'Oloitoktok Road', type: 'ROAD' },
  { name: 'Mandera Road', type: 'ROAD' },
  { name: 'Ring Road', type: 'ROAD', aliases: ['Kileleshwa Ring Road'] },
  { name: 'Gatundu Road', type: 'ROAD' },
  { name: 'Arboretum side', type: 'LANDMARK', aliases: ['Arboretum'] }
]);

const lavingtonArea = addLocation({
  name: 'Lavington',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Lavington Area']
});

createSubTree(lavingtonArea, [
  { name: 'Lavington Green', type: 'LANDMARK' },
  { name: 'Lavington Curve', type: 'LANDMARK' },
  { name: 'Muthangari', type: 'ROAD', aliases: ['Muthangari Drive'] },
  { name: 'Valley Arcade side', type: 'LANDMARK' },
  { name: 'James Gichuru', type: 'ROAD', aliases: ['James Gichuru Road'] },
  { name: 'Gitanga Road', type: 'ROAD' },
  { name: 'Amboseli Road', type: 'ROAD' },
  { name: 'Chalbi Drive', type: 'ROAD' }
]);

// UPPER HILL / SOUTH-WEST
const upperHillArea = addLocation({
  name: 'Upper Hill',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Upperhill']
});

createSubTree(upperHillArea, [
  { name: 'Madaraka', type: 'ESTATE', aliases: ['Madaraka Estate'] },
  {
    name: 'Nairobi West',
    type: 'ESTATE',
    aliases: ['Nai West'],
    children: [
      { name: 'Nairobi West Estate', type: 'SUB_AREA' },
      { name: 'Nyayo Highrise', type: 'ESTATE' },
      { name: 'Mugumo-ini', type: 'NEIGHBOURHOOD' },
      { name: 'Mbagathi', type: 'ROAD', aliases: ['Mbagathi Way', 'Raila Odinga Way'] },
      { name: 'Wilson', type: 'LANDMARK', aliases: ['Wilson Airport side'] },
      { name: 'Southlands', type: 'ESTATE' }
    ]
  },
  {
    name: 'South B',
    type: 'ESTATE',
    aliases: ['South B Estate', 'Hazina South B'],
    children: [
      { name: 'Golden Gate', type: 'SUB_AREA' },
      { name: 'Hazina', type: 'SUB_AREA', aliases: ['Hazina Estate'] },
      { name: 'Akiba', type: 'SUB_AREA', aliases: ['Akiba Estate'] },
      { name: 'Mariakani', type: 'SUB_AREA' },
      { name: 'Villa Franca', type: 'SUB_AREA' },
      { name: 'Plainsview', type: 'SUB_AREA' },
      { name: 'Riverbank', type: 'SUB_AREA' },
      { name: 'Bellevue', type: 'LANDMARK' }
    ]
  },
  {
    name: 'South C',
    type: 'ESTATE',
    aliases: ['South C Estate'],
    children: [
      { name: 'Hazina', type: 'SUB_AREA' },
      { name: 'Akiba', type: 'SUB_AREA' },
      { name: 'Plainsview', type: 'SUB_AREA' },
      { name: 'Bellevue', type: 'LANDMARK' },
      { name: 'Mugoya', type: 'SUB_AREA', aliases: ['Mugoya Estate'] },
      { name: 'Savanna', type: 'SUB_AREA' },
      { name: 'South C Shopping Centre', type: 'LANDMARK' }
    ]
  },
  { name: 'Industrial Area', type: 'AREA', aliases: ['Inda'] },
  { name: 'Mbagathi', type: 'ROAD' },
  { name: 'Ngumo', type: 'ESTATE', aliases: ['Ngumo Estate'] }
]);

// KAREN / LANG'ATA
const karenArea = addLocation({
  name: 'Karen',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Karen Nairobi']
});

createSubTree(karenArea, [
  { name: 'Hardy', type: 'ESTATE', aliases: ['Hardy Karen'] },
  { name: 'Karen C', type: 'SUB_AREA' },
  { name: 'Karen Green', type: 'SUB_AREA' },
  { name: 'Karen Crossroads', type: 'LANDMARK' },
  { name: 'Windy Ridge', type: 'ROAD' },
  { name: 'Bogani', type: 'ROAD', aliases: ['Bogani Road', 'Bogani East'] },
  { name: 'Kuwinda', type: 'NEIGHBOURHOOD' },
  { name: 'Karen Shopping Centre', type: 'LANDMARK' },
  { name: 'Hardy Shopping Centre', type: 'LANDMARK' }
]);

const langataArea = addLocation({
  name: "Lang'ata",
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Langata', 'Langata Area']
});

createSubTree(langataArea, [
  { name: 'Otiende', type: 'ESTATE', aliases: ['Otiende Estate'] },
  { name: 'Onyonka', type: 'ESTATE', aliases: ['Onyonka Estate'] },
  { name: 'Southlands', type: 'ESTATE' },
  { name: 'Nyayo Highrise', type: 'ESTATE', aliases: ['Highrise'] },
  { name: 'Mugumo-ini', type: 'NEIGHBOURHOOD' },
  { name: 'NHC Langata', type: 'ESTATE', aliases: ['NHC Houses', 'NHC Lang\'ata'] },
  { name: 'Wilson', type: 'LANDMARK', aliases: ['Wilson Airport'] },
  { name: 'Carnivore area', type: 'LANDMARK', aliases: ['Carnivore', 'Langata Road area'] }
]);

// DAGORETTI / KAWANGWARE / NGONG ROAD
const dagorettiArea = addLocation({
  name: 'Dagoretti',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Dagoretti Corner']
});

createSubTree(dagorettiArea, [
  { name: 'Dagoretti Corner', type: 'NEIGHBOURHOOD', aliases: ['Corner'] },
  {
    name: 'Kawangware',
    type: 'ESTATE',
    aliases: ['Kware Ngong'],
    children: [
      { name: 'Kawangware 46', type: 'STAGE', aliases: ['Stage 46', '46'] },
      { name: 'Kawangware 56', type: 'STAGE', aliases: ['Stage 56', '56'] },
      { name: 'Kawangware Stage', type: 'STAGE' },
      { name: 'Congo', type: 'SUB_AREA', aliases: ['Congo Stage'] },
      { name: 'Gatina', type: 'SUB_AREA' },
      { name: 'Kabiro', type: 'SUB_AREA' }
    ]
  },
  { name: 'Riruta', type: 'ESTATE', aliases: ['Riruta Satellite', 'Satellite'] },
  { name: 'Ngando', type: 'NEIGHBOURHOOD' },
  { name: 'Mutuini', type: 'NEIGHBOURHOOD' },
  { name: 'Waithaka', type: 'ESTATE' },
  { name: 'Ruthimitu', type: 'NEIGHBOURHOOD' },
  { name: 'Uthiru', type: 'ESTATE', aliases: ['Uthiru Nairobi'] }
]);

// KIBERA / KIBRA
const kiberaArea = addLocation({
  name: 'Kibera',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Kibra']
});

createSubTree(kiberaArea, [
  { name: 'Laini Saba', type: 'SUB_AREA' },
  { name: 'Lindi', type: 'SUB_AREA' },
  { name: 'Makina', type: 'SUB_AREA' },
  { name: 'Kianda', type: 'SUB_AREA' },
  { name: 'Olympic', type: 'SUB_AREA', aliases: ['Olympic Stage'] },
  { name: 'Ayany', type: 'ESTATE', aliases: ['Ayany Estate'] },
  { name: 'Gatwekera', type: 'SUB_AREA' },
  { name: 'Soweto', type: 'SUB_AREA' },
  { name: 'Mashimoni', type: 'SUB_AREA' },
  { name: 'Sarang\'ombe', type: 'SUB_AREA' },
  { name: 'Woodley', type: 'ESTATE' }
]);

// CBD / CENTRAL
const centralArea = addLocation({
  name: 'Central Nairobi',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Nairobi CBD', 'CBD', 'Town']
});

createSubTree(centralArea, [
  { name: 'Nairobi CBD', type: 'NEIGHBOURHOOD', aliases: ['CBD', 'City Centre'] },
  { name: 'Ngara', type: 'ESTATE', aliases: ['Ngara Road', 'Fig Tree'] },
  { name: 'Pangani', type: 'ESTATE' },
  { name: 'Ziwani', type: 'ESTATE' },
  { name: 'Kariokor', type: 'ESTATE' },
  { name: 'Gikomba', type: 'LANDMARK', aliases: ['Gikomba Market'] },
  { name: 'Pumwani', type: 'ESTATE' },
  { name: 'Majengo', type: 'ESTATE' },
  { name: 'Shauri Moyo', type: 'ESTATE' },
  { name: 'California', type: 'ESTATE' },
  { name: 'Bondeni', type: 'ESTATE' },
  { name: 'Kaloleni', type: 'ESTATE' },
  { name: 'Jericho', type: 'ESTATE' },
  { name: 'Lumumba', type: 'ESTATE' },
  { name: 'Ofafa', type: 'ESTATE' },
  { name: 'Maringo', type: 'ESTATE' },
  { name: 'Hamza', type: 'ESTATE' },
  { name: 'Makongeni', type: 'ESTATE' },
  { name: 'Mbotela', type: 'ESTATE' },
  { name: 'Harambee', type: 'ESTATE' },
  { name: 'Landimawe', type: 'ESTATE' },
  { name: 'Muthurwa', type: 'ESTATE' },
  { name: 'Starehe', type: 'ESTATE' }
]);

// EASTLANDS
const eastlandsArea = addLocation({
  name: 'Eastlands',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Eastlands Nairobi']
});

createSubTree(eastlandsArea, [
  {
    name: 'Buruburu',
    type: 'ESTATE',
    aliases: ['Buru', 'Buruburu Estate'],
    children: [
      { name: 'Phase 1', type: 'PHASE', aliases: ['Buruburu Phase 1', 'Buru 1'] },
      { name: 'Phase 2', type: 'PHASE', aliases: ['Buruburu Phase 2', 'Buru 2'] },
      { name: 'Phase 3', type: 'PHASE', aliases: ['Buruburu Phase 3', 'Buru 3'] },
      { name: 'Phase 4', type: 'PHASE', aliases: ['Buruburu Phase 4', 'Buru 4'] },
      { name: 'Phase 5', type: 'PHASE', aliases: ['Buruburu Phase 5', 'Buru 5'] },
      { name: 'Phase 5 Annex', type: 'PHASE', aliases: ['Phase 5 Annex'] }
    ]
  },
  {
    name: 'Umoja',
    type: 'ESTATE',
    aliases: ['Umoja Estate'],
    children: [
      { name: 'Umoja I', type: 'SUB_AREA', aliases: ['Umoja 1'] },
      { name: 'Umoja II', type: 'SUB_AREA', aliases: ['Umoja 2'] },
      { name: 'Umoja Innercore', type: 'SUB_AREA', aliases: ['Innercore'] },
      { name: 'Moi Drive', type: 'ROAD' },
      { name: 'Caltex Area', type: 'LANDMARK' },
      { name: 'Mowlem Road Area', type: 'ROAD' },
      { name: 'Busara', type: 'SUB_AREA' },
      { name: 'Tumaini', type: 'SUB_AREA' },
      { name: 'Kifaru', type: 'SUB_AREA' }
    ]
  },
  {
    name: 'Dandora',
    type: 'ESTATE',
    aliases: ['Dandora Estate'],
    children: [
      { name: 'Phase 1', type: 'PHASE', aliases: ['Dandora Phase 1'] },
      { name: 'Phase 2', type: 'PHASE', aliases: ['Dandora Phase 2'] },
      { name: 'Phase 3', type: 'PHASE', aliases: ['Dandora Phase 3'] },
      { name: 'Phase 4', type: 'PHASE', aliases: ['Dandora Phase 4'] },
      { name: 'Phase 5', type: 'PHASE', aliases: ['Dandora Phase 5'] }
    ]
  },
  {
    name: 'Kayole',
    type: 'ESTATE',
    aliases: ['Kayole Estate'],
    children: [
      { name: 'Kayole North', type: 'SUB_AREA' },
      { name: 'Kayole Central', type: 'SUB_AREA' },
      { name: 'Kayole South', type: 'SUB_AREA' },
      { name: 'Soweto', type: 'SUB_AREA', aliases: ['Kayole Soweto'] },
      { name: 'Spine Road', type: 'ROAD' },
      { name: 'Junction', type: 'STAGE' },
      { name: 'Stage', type: 'STAGE' },
      { name: 'Saika', type: 'ESTATE' }
    ]
  },
  {
    name: 'Komarock',
    type: 'ESTATE',
    aliases: ['Komarock Estate'],
    children: [
      { name: 'Sector 1', type: 'SECTION' },
      { name: 'Sector 2', type: 'SECTION' },
      { name: 'Sector 3', type: 'SECTION' },
      { name: 'Sector 4', type: 'SECTION' },
      { name: 'Phase 1', type: 'PHASE' },
      { name: 'Phase 2', type: 'PHASE' },
      { name: 'Phase 3', type: 'PHASE' },
      { name: 'Spine Road', type: 'ROAD' }
    ]
  },
  {
    name: 'Eastleigh',
    type: 'ESTATE',
    aliases: ['Eastleigh Nairobi', 'Isli'],
    children: [
      { name: 'Eastleigh North', type: 'SUB_AREA' },
      { name: 'Eastleigh South', type: 'SUB_AREA' },
      { name: 'Section 1', type: 'SECTION', aliases: ['Eastleigh Section 1', 'Eastleigh 1'] },
      { name: 'Section 2', type: 'SECTION', aliases: ['Eastleigh Section 2', 'Eastleigh 2'] },
      { name: 'Section 3', type: 'SECTION', aliases: ['Eastleigh Section 3', 'Eastleigh 3'] },
      { name: 'Section 4', type: 'SECTION', aliases: ['Eastleigh Section 4', 'Eastleigh 4'] },
      { name: 'Section 5', type: 'SECTION', aliases: ['Eastleigh Section 5', 'Eastleigh 5'] },
      { name: 'Section 6', type: 'SECTION', aliases: ['Eastleigh Section 6', 'Eastleigh 6'] },
      { name: 'Section 7', type: 'SECTION', aliases: ['Eastleigh Section 7', 'Eastleigh 7', 'Eastleigh Sec 7'] },
      { name: 'Section 8', type: 'SECTION', aliases: ['Eastleigh Section 8', 'Eastleigh 8'] },
      { name: 'Section 9', type: 'SECTION', aliases: ['Eastleigh Section 9', 'Eastleigh 9'] },
      { name: 'Section 10', type: 'SECTION', aliases: ['Eastleigh Section 10', 'Eastleigh 10'] },
      { name: 'Section 11', type: 'SECTION', aliases: ['Eastleigh Section 11', 'Eastleigh 11'] },
      { name: 'Section 12', type: 'SECTION', aliases: ['Eastleigh Section 12', 'Eastleigh 12'] },
      { name: 'Section 13', type: 'SECTION', aliases: ['Eastleigh Section 13', 'Eastleigh 13'] },
      { name: 'Section 14', type: 'SECTION', aliases: ['Eastleigh Section 14', 'Eastleigh 14'] },
      { name: 'Section 15', type: 'SECTION', aliases: ['Eastleigh Section 15', 'Eastleigh 15'] },
      { name: 'California', type: 'SUB_AREA' },
      { name: 'Airbase', type: 'SUB_AREA', aliases: ['Moi Air Base'] },
      { name: 'Pumwani / Gikomba side', type: 'LANDMARK' }
    ]
  },
  {
    name: 'Kariobangi',
    type: 'ESTATE',
    aliases: ['Kariobangi Area'],
    children: [
      { name: 'Kariobangi North', type: 'SUB_AREA' },
      { name: 'Kariobangi South', type: 'SUB_AREA' },
      { name: 'Kariobangi Light Industries', type: 'SUB_AREA' },
      { name: 'Kariobangi South Estate', type: 'SUB_AREA' }
    ]
  },
  {
    name: 'Mukuru',
    type: 'AREA',
    children: [
      { name: 'Mukuru Kwa Njenga', type: 'SUB_AREA' },
      { name: 'Mukuru Kwa Reuben', type: 'SUB_AREA' },
      { name: 'Kware', type: 'SUB_AREA' },
      { name: 'Viwandani', type: 'SUB_AREA' },
      { name: 'Sinai', type: 'SUB_AREA' },
      { name: 'Kwa Maringo', type: 'SUB_AREA' },
      { name: 'Mukuru Kayaba', type: 'SUB_AREA' },
      { name: 'Fuata Nyayo', type: 'SUB_AREA' }
    ]
  },
  { name: 'Matopeni', type: 'NEIGHBOURHOOD' },
  { name: 'Bahati', type: 'ESTATE' },
  { name: 'Uhuru', type: 'ESTATE' }
]);

// EMBAKASI
const embakasiArea = addLocation({
  name: 'Embakasi',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Embakasi Sub-County']
});

createSubTree(embakasiArea, [
  {
    name: 'Nyayo Estate',
    type: 'ESTATE',
    aliases: ['Nyayo Embakasi', 'Nyayo'],
    children: [
      {
        name: 'Gate A',
        type: 'GATE',
        aliases: ['Nyayo Gate A'],
        children: [
          { name: 'Phase 1', type: 'PHASE', aliases: ['Nyayo Phase 1', 'Gate A Phase 1'] },
          { name: 'Phase 2', type: 'PHASE', aliases: ['Nyayo Phase 2', 'Gate A Phase 2'] }
        ]
      },
      { name: 'Gate B', type: 'GATE', aliases: ['Nyayo Gate B'] },
      { name: 'Gate C', type: 'GATE', aliases: ['Nyayo Gate C'] },
      {
        name: 'Gate D',
        type: 'GATE',
        aliases: ['Nyayo Gate D'],
        children: [
          { name: 'Phase 3', type: 'PHASE', aliases: ['Nyayo Phase 3', 'Gate D Phase 3'] },
          { name: 'Phase 4', type: 'PHASE', aliases: ['Nyayo Phase 4', 'Gate D Phase 4'] },
          { name: 'Phase 5', type: 'PHASE', aliases: ['Nyayo Phase 5', 'Gate D Phase 5'] }
        ]
      }
    ]
  },
  {
    name: 'Donholm',
    type: 'ESTATE',
    aliases: ['Doni', 'Donholm Estate'],
    children: [
      { name: 'Phase 1', type: 'PHASE', aliases: ['Donholm Phase 1'] },
      { name: 'Phase 2', type: 'PHASE', aliases: ['Donholm Phase 2'] },
      { name: 'Phase 3', type: 'PHASE', aliases: ['Donholm Phase 3'] },
      { name: 'Phase 4', type: 'PHASE', aliases: ['Donholm Phase 4'] },
      { name: 'Phase 5', type: 'PHASE', aliases: ['Donholm Phase 5'] },
      { name: 'Phase 6', type: 'PHASE', aliases: ['Donholm Phase 6'] },
      { name: 'Phase 7', type: 'PHASE', aliases: ['Donholm Phase 7'] },
      { name: 'Phase 8', type: 'PHASE', aliases: ['Donholm Phase 8'] },
      { name: 'Greenfields', type: 'SUB_AREA' },
      { name: 'Greenspan', type: 'ESTATE', aliases: ['Greenspan Mall', 'Greenspan Estate'] },
      { name: 'Jacaranda', type: 'ESTATE' },
      { name: 'Savannah', type: 'SUB_AREA', aliases: ['Donholm Savannah'] },
      { name: 'Lower Savannah', type: 'SUB_AREA' }
    ]
  },
  { name: 'Embakasi Village', type: 'NEIGHBOURHOOD' },
  { name: 'Pipeline', type: 'ESTATE', aliases: ['Pipeline Embakasi'] },
  { name: 'Tassia', type: 'ESTATE', aliases: ['Tassia Estate', 'Tassia Hill'] },
  { name: 'Fedha', type: 'ESTATE', aliases: ['Fedha Estate'] },
  { name: 'Kwa Njenga', type: 'SUB_AREA' },
  { name: 'Kwa Reuben', type: 'SUB_AREA' },
  { name: 'Kware', type: 'SUB_AREA' },
  { name: 'Imara Daima', type: 'ESTATE' },
  { name: 'Transami', type: 'SUB_AREA' },
  { name: 'Tena', type: 'ESTATE', aliases: ['Tena Estate'] },
  { name: 'Mowlem', type: 'ESTATE' },
  { name: 'Savannah', type: 'ESTATE' },
  { name: 'Upper Savannah', type: 'SUB_AREA' },
  { name: 'Lower Savannah', type: 'SUB_AREA' },
  { name: 'Mihang\'o', type: 'ESTATE', aliases: ['Mihango'] },
  { name: 'Utawala', type: 'ESTATE', aliases: ['Utawala Area', 'Shooters'] },
  { name: 'Mukuru Kwa Njenga', type: 'SUB_AREA' }
]);

// KASARANI / NORTH / ROYSAMBU
const kasaraniArea = addLocation({
  name: 'Kasarani',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Kasarani Area']
});

createSubTree(kasaraniArea, [
  { name: 'Mwiki', type: 'ESTATE' },
  { name: 'Clay City', type: 'ESTATE' },
  { name: 'Njiru', type: 'ESTATE' },
  { name: 'Ruai', type: 'ESTATE' },
  { name: 'Seasons', type: 'STAGE', aliases: ['Seasons Kasarani'] },
  { name: 'Sunton', type: 'ESTATE' },
  { name: 'Hunters', type: 'STAGE', aliases: ['Hunters Kasarani'] },
  { name: 'Kwa Chief', type: 'STAGE' },
  { name: 'Kasarani Stage', type: 'STAGE' },
  { name: 'Ruaraka', type: 'AREA' },
  { name: 'Babadogo', type: 'ESTATE' },
  { name: 'Utalii', type: 'NEIGHBOURHOOD' },
  { name: 'Mathare North', type: 'ESTATE' },
  { name: 'Lucky Summer', type: 'ESTATE' },
  { name: 'Korogocho', type: 'NEIGHBOURHOOD' },
  { name: 'Mathare', type: 'NEIGHBOURHOOD' },
  { name: 'Huruma', type: 'ESTATE' },
  { name: 'Mlango Kubwa', type: 'NEIGHBOURHOOD' },
  { name: 'Ngei', type: 'SUB_AREA' },
  { name: 'Mabatini', type: 'SUB_AREA' }
]);

const roysambuArea = addLocation({
  name: 'Roysambu',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Roysambu Area']
});

createSubTree(roysambuArea, [
  { name: 'Roysambu', type: 'ESTATE', aliases: ['Roysambu Roundabout', 'TRM Area'] },
  { name: 'Zimmerman', type: 'ESTATE', aliases: ['Zimma'] },
  { name: 'Githurai', type: 'ESTATE', aliases: ['Githurai 44'] },
  { name: 'Kahawa', type: 'AREA' },
  { name: 'Kahawa West', type: 'ESTATE' },
  { name: 'Kahawa Sukari', type: 'ESTATE' },
  { name: 'Mirema', type: 'ESTATE', aliases: ['Mirema Drive'] },
  { name: 'Thome', type: 'ESTATE' },
  { name: 'Marurui', type: 'ESTATE' },
  { name: 'Garden Estate', type: 'ESTATE' },
  { name: 'Ridgeways', type: 'ESTATE' }
]);

// RUAI / NORTH-EAST CORRIDOR
const ruaiArea = addLocation({
  name: 'Ruai Corridor',
  type: 'AREA',
  parent: nairobiCounty,
  countyId: nairobiCounty.id,
  county: 'Nairobi',
  aliases: ['Ruai Area']
});

createSubTree(ruaiArea, [
  { name: 'Ruai', type: 'ESTATE' },
  { name: 'Kamulu', type: 'ESTATE' },
  { name: 'Njiru', type: 'ESTATE' },
  { name: 'Mihang\'o', type: 'ESTATE' },
  { name: 'Mowlem', type: 'ESTATE' },
  { name: 'Njathaini', type: 'ESTATE' },
  { name: 'Tena', type: 'ESTATE' },
  { name: 'Utawala', type: 'ESTATE' }
]);

// ----------------------------------------------------
// 3. NAIROBI METRO / ENVIRONS (MACHAKOS, KAJIADO, KIAMBU)
// ----------------------------------------------------

// MLOLONGO / MAVOKO / ATHI RIVER (Machakos County)
const mlolongoTown = addLocation({
  name: 'Mlolongo',
  type: 'TOWN',
  parent: machakosCounty,
  countyId: machakosCounty.id,
  county: 'Machakos',
  aliases: ['Mlolongo Town']
});

createSubTree(mlolongoTown, [
  { name: 'Mlolongo Town', type: 'NEIGHBOURHOOD' },
  { name: 'Katani', type: 'ESTATE', aliases: ['Katani Road'] },
  { name: 'Syokimau', type: 'ESTATE', aliases: ['Syokimau Gateway'] },
  { name: 'Athi River', type: 'TOWN' },
  { name: 'Great Wall', type: 'ESTATE', aliases: ['Great Wall Gardens'] },
  {
    name: 'Sheshe Gardens',
    type: 'ESTATE',
    aliases: ['Sheshe Gardens Mlolongo', 'Sheshe'],
    children: [
      { name: 'Phase 1', type: 'PHASE', aliases: ['Sheshe Gardens Phase 1', 'Sheshe Phase 1'] },
      { name: 'Phase 2', type: 'PHASE', aliases: ['Sheshe Gardens Phase 2', 'Sheshe Phase 2'] }
    ]
  },
  { name: 'Sabaki', type: 'ESTATE' },
  { name: 'Mavoko', type: 'AREA' },
  { name: 'Kinanie', type: 'ESTATE' }
]);

const athiRiverTown = addLocation({
  name: 'Athi River',
  type: 'TOWN',
  parent: machakosCounty,
  countyId: machakosCounty.id,
  county: 'Machakos',
  aliases: ['Athi River Town']
});

createSubTree(athiRiverTown, [
  { name: 'Mavoko', type: 'AREA' },
  { name: 'Daystar', type: 'LANDMARK', aliases: ['Daystar University Environs'] },
  { name: 'Kinanie', type: 'ESTATE' },
  { name: 'Great Wall', type: 'ESTATE' },
  { name: 'Mlolongo corridor', type: 'AREA' }
]);

// KITENGELA (Kajiado County)
const kitengelaTown = addLocation({
  name: 'Kitengela',
  type: 'TOWN',
  parent: kajiadoCounty,
  countyId: kajiadoCounty.id,
  county: 'Kajiado',
  aliases: ['Kitengela Town', 'Kite']
});

createSubTree(kitengelaTown, [
  { name: 'Acacia', type: 'ESTATE', aliases: ['Acacia Kitengela'] },
  { name: 'Milimani', type: 'ESTATE', aliases: ['Milimani Kitengela'] },
  { name: 'Yukos', type: 'STAGE', aliases: ['Yukos Kitengela'] },
  { name: 'New Valley', type: 'ESTATE' },
  { name: 'Muigai', type: 'ESTATE' },
  { name: 'Isinya Road', type: 'ROAD' },
  { name: 'EPZ', type: 'LANDMARK' }
]);

// NGONG / RONGAI / KAJIADO CORRIDOR (Kajiado County)
const rongaiTown = addLocation({
  name: 'Ongata Rongai',
  type: 'TOWN',
  parent: kajiadoCounty,
  countyId: kajiadoCounty.id,
  county: 'Kajiado',
  aliases: ['Rongai', 'Ronga']
});

createSubTree(rongaiTown, [
  { name: 'Rongai', type: 'ESTATE', aliases: ['Rongai Town'] },
  { name: 'Tuala', type: 'ESTATE' },
  { name: 'Kiserian', type: 'TOWN', aliases: ['Kiserian Town'] },
  { name: 'Oloolua', type: 'ESTATE' },
  { name: 'Kibiko', type: 'ESTATE' }
]);

const ngongTown = addLocation({
  name: 'Ngong',
  type: 'TOWN',
  parent: kajiadoCounty,
  countyId: kajiadoCounty.id,
  county: 'Kajiado',
  aliases: ['Ngong Town']
});

createSubTree(ngongTown, [
  { name: 'Ngong Town', type: 'NEIGHBOURHOOD' },
  { name: 'Oloolua', type: 'ESTATE' },
  { name: 'Kibiko', type: 'ESTATE' },
  { name: 'Kiserian', type: 'TOWN' }
]);

// RUAKA / KIAMBU (Kiambu County)
const ruakaTown = addLocation({
  name: 'Ruaka',
  type: 'TOWN',
  parent: kiambuCounty,
  countyId: kiambuCounty.id,
  county: 'Kiambu',
  aliases: ['Ruaka Town', 'Ruaka Bypass']
});

createSubTree(ruakaTown, [
  { name: 'Ndenderu', type: 'ESTATE' },
  { name: 'Rosslyn', type: 'ESTATE' },
  { name: 'Banana', type: 'TOWN', aliases: ['Banana Hill'] },
  { name: 'Muchatha', type: 'ESTATE' },
  { name: 'Kiambu', type: 'TOWN' },
  { name: 'Thindigua', type: 'ESTATE', aliases: ['Thindigua Kiambu Road'] },
  { name: 'Gachie', type: 'ESTATE' },
  { name: 'Kiambu Road', type: 'ROAD' }
]);

// RUIRU (Kiambu County)
const ruiruTown = addLocation({
  name: 'Ruiru',
  type: 'TOWN',
  parent: kiambuCounty,
  countyId: kiambuCounty.id,
  county: 'Kiambu',
  aliases: ['Ruiru Town']
});

createSubTree(ruiruTown, [
  { name: 'Membley', type: 'ESTATE', aliases: ['Membley Estate'] },
  { name: 'Kimbo', type: 'ESTATE', aliases: ['Ruiru Kimbo'] },
  { name: 'Githurai', type: 'ESTATE', aliases: ['Githurai 45'] },
  { name: 'Rainbow', type: 'LANDMARK' },
  { name: 'Kwa Kairu', type: 'ESTATE' },
  { name: 'Kamakis', type: 'AREA', aliases: ['Kamakis Eastern Bypass'] }
]);

// KIKUYU / WESTERN METRO (Kiambu County)
const kikuyuTown = addLocation({
  name: 'Kikuyu',
  type: 'TOWN',
  parent: kiambuCounty,
  countyId: kiambuCounty.id,
  county: 'Kiambu',
  aliases: ['Kikuyu Town']
});

createSubTree(kikuyuTown, [
  { name: 'Kinoo', type: 'ESTATE', aliases: ['Kinoo 87', 'Kinoo Stage'] },
  { name: 'Wangige', type: 'TOWN' },
  { name: 'Uthiru', type: 'ESTATE', aliases: ['Uthiru Kiambu'] },
  { name: 'Zambezi', type: 'ESTATE' },
  { name: 'Regen', type: 'ESTATE' },
  { name: 'Karura', type: 'NEIGHBOURHOOD' }
]);

// LIMURU / TIGONI (Kiambu County)
const limuruTown = addLocation({
  name: 'Limuru',
  type: 'TOWN',
  parent: kiambuCounty,
  countyId: kiambuCounty.id,
  county: 'Kiambu',
  aliases: ['Limuru Town']
});

createSubTree(limuruTown, [
  { name: 'Tigoni', type: 'ESTATE', aliases: ['Tigoni Tea'] },
  { name: 'Redhill', type: 'ESTATE', aliases: ['Redhill Road'] },
  { name: 'Kentmere', type: 'LANDMARK' }
]);

// Write output
const targetPath = path.join(__dirname, '..', 'db', 'locations-data.json');
fs.writeFileSync(targetPath, JSON.stringify(locations, null, 2), 'utf-8');
console.log(`✅ Master location dataset created with ${locations.length} verified records at ${targetPath}`);
