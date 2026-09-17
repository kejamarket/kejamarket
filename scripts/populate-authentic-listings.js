/**
 * Authentic Kenyan Real Estate Seed Listings Generator
 * Generates 55+ realistic properties across all Nairobi corridors and categories
 */
const fs = require('fs');
const path = require('path');

const photoLibrary = {
  living: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80'
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80'
  ],
  bathroom: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80'
  ],
  exterior: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80'
  ]
};

function buildMedia(seedIndex, category) {
  const l = photoLibrary.living[seedIndex % photoLibrary.living.length];
  const b = photoLibrary.bedroom[seedIndex % photoLibrary.bedroom.length];
  const k = photoLibrary.kitchen[seedIndex % photoLibrary.kitchen.length];
  const bt = photoLibrary.bathroom[seedIndex % photoLibrary.bathroom.length];
  const ex = photoLibrary.exterior[seedIndex % photoLibrary.exterior.length];
  const ex2 = photoLibrary.exterior[(seedIndex + 3) % photoLibrary.exterior.length];

  if (category.includes('Single Room')) {
    return [
      { url: b, caption: 'Clean well-ventilated single room space' },
      { url: bt, caption: 'Clean shared tiled washroom' },
      { url: ex, caption: 'Secure gated building exterior' },
      { url: l, caption: 'Hallway and compound view' }
    ];
  }
  if (category.includes('Bedsitter')) {
    return [
      { url: l, caption: 'Spacious bedsitter main living area with ceramic tiles' },
      { url: k, caption: 'Fitted kitchen sink and storage shelves' },
      { url: bt, caption: 'Private ceramic tiled bathroom with hot instant shower' },
      { url: ex, caption: 'Apartment exterior and secure gated parking' },
      { url: b, caption: 'Sleeping zone layout' }
    ];
  }
  return [
    { url: l, caption: 'Spacious naturally-lit living room' },
    { url: b, caption: 'Master bedroom with built-in wardrobes' },
    { url: k, caption: 'Modern fitted kitchen with granite countertops' },
    { url: bt, caption: 'Contemporary tiled bathroom with instant shower' },
    { url: ex, caption: 'Building exterior and secure gated compound' },
    { url: ex2, caption: 'Ample cabro paved parking with 24/7 security' }
  ];
}

const rawListingTemplates = [
  // ─── NAIROBI CENTRAL ─────────────────────────────────────────────────────────────
  {
    title: 'Clean Tiled Single Room in Ngara West near Chemelil Rd',
    description: 'Neat, quiet single room near Chemelil Road and Stima Club. 5 minutes walk to CBD. Constant council water supply with booster pumps and 10,000L backup storage. Tokens meter per floor, perimeter security with biometric gate and 24/7 caretaker.',
    category: 'Single Room',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 6800, depositKes: 6800,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'Ngara (Fig Tree & Ngara Rd)',
    exactLocation: 'Ngara West, near Chemelil Road', latitude: -1.2730, longitude: 36.8210,
    waterSupplyType: 'City Council Water + Borehole Backup', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Geoffrey (Caretaker)', caretakerPhone: '0721445566',
    landlord: { name: 'Peter Kariuki', phone: '+254721445566', whatsapp: '+254721445566', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern Bedsitter in Pangani near Thika Road Interchange',
    description: 'Spacious bedsitter in Pangani, quick access to Thika Superhighway and CBD. Features private bathroom, kitchenette with granite top, prepaid KPLC token meter, borehole water 24/7, high perimeter wall with electric fence.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 11000, depositKes: 11000,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'Pangani',
    exactLocation: 'Near Pangani Girls and Thika Rd Interchange', latitude: -1.2709, longitude: 36.8375,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'John Kamau', caretakerPhone: '0712334455',
    landlord: { name: 'Mary Nduta', phone: '+254712334455', whatsapp: '+254712334455', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 1 Bedroom Apartment in Parklands (3rd Parklands Ave)',
    description: 'Charming 1 bedroom apartment located in prestigious 3rd Parklands Avenue. Very secure, close to Diamond Plaza, MP Shah Hospital, and Aga Khan. Well-lit lounge, kitchen with cabinets, backup generator for common areas, high-speed lift, 24/7 security guards.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 4, rentKes: 38000, depositKes: 38000,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'Parklands (1st to 6th Parklands)',
    exactLocation: '3rd Parklands Avenue, near Diamond Plaza', latitude: -1.2612, longitude: 36.8155,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Parklands Premier Properties', caretakerName: 'Ali Mohammed', caretakerPhone: '0733887766',
    landlord: { name: 'Parklands Premier Properties', phone: '+254733887766', whatsapp: '+254733887766', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious 2 Bedroom Master Ensuite in Highridge Parklands',
    description: 'Quiet residential court in Highridge. Large living room with dining area, master ensuite bedroom, fitted wardrobes, solar water heating, 2 reserved parking slots, full-time guard, intercom connection to gate.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 2, rentKes: 54000, depositKes: 54000,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'Highridge (Parklands)',
    exactLocation: 'Masari Road, Highridge', latitude: -1.2580, longitude: 36.8080,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 600, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'HassConsult Real Estate', caretakerName: 'Francis Omondi', caretakerPhone: '0722998811',
    landlord: { name: 'HassConsult Real Estate', phone: '+254733112233', whatsapp: '+254733112233', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: false }
  },
  {
    title: 'Luxury 3 Bedroom Master Ensuite Apartment near City Park Environs',
    description: 'Stunning 3-bedroom apartment with scenic green views of City Park forest. Features spacious open kitchen, separate laundry balcony, servant quarter (DSQ), heated rooftop pool, gym, high speed lifts, solar panels and 24/7 security.',
    category: '3 Bedroom',
    bedrooms: 3, bathrooms: 3, floorLevel: 5, rentKes: 78000, depositKes: 78000,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'City Park Environs',
    exactLocation: 'Limuru Road, opposite City Park Market', latitude: -1.2620, longitude: 36.8260,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 800, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Knight Frank Kenya', caretakerName: 'Bernard Mutiso', caretakerPhone: '0711554433',
    landlord: { name: 'Knight Frank Kenya', phone: '+254711554433', whatsapp: '+254711554433', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Commercial Office / Co-Working Stall in Nairobi CBD (Tom Mboya St)',
    description: 'Prime commercial shop/stall in busy commercial arcade along Tom Mboya Street. High foot traffic, clean tiled floor, glass frontage, prepaid electricity meter, 24/7 security, suitable for boutique, electronics, agency or salon.',
    category: 'Commercial Office / Co-Working',
    bedrooms: 0, bathrooms: 1, floorLevel: 1, rentKes: 26000, depositKes: 52000,
    county: 'Nairobi', corridorId: 'nairobi_central', estateSuburb: 'CBD (City Centre)',
    exactLocation: 'Tom Mboya Street near Odeon Cinema', latitude: -1.2840, longitude: 36.8245,
    waterSupplyType: 'City Council Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 100, managedBy: 'agency',
    agencyName: 'Nairobi City Properties', caretakerName: 'Harrison Wafula', caretakerPhone: '0722114477',
    landlord: { name: 'Nairobi City Properties', phone: '+254722114477', whatsapp: '+254722114477', isAgency: true },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },

  // ─── WESTLANDS & DIPLOMATIC BELT ────────────────────────────────────────────────
  {
    title: 'Executive 1 Bedroom Apartment in Westlands (Rhapta Road)',
    description: 'Chic modern 1 bedroom apartment along Rhapta Road. Features open-plan living, fully fitted kitchen cabinets, bedroom with mirrored wardrobes, high-speed fiber internet connection, gym, rooftop terrace, 24/7 manned security and CCTV.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 52000, depositKes: 52000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Rhapta Road',
    exactLocation: 'Rhapta Road, near Sarit Centre & Westgate', latitude: -1.2625, longitude: 36.7932,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 600, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Westlands Living Agency', caretakerName: 'Eric Kiprono', caretakerPhone: '0720448833',
    landlord: { name: 'Westlands Living Agency', phone: '+254720448833', whatsapp: '+254720448833', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Master Ensuite with Pool in Kileleshwa (Siaya Rd)',
    description: 'Top-of-the-range 2 bedroom master ensuite apartment on Siaya Road, Kileleshwa. Fitted kitchen with granite breakfast island, spacious lounge leading to balcony, heated swimming pool, modern fitness gym, generator backup for all apartments, 2 elevators.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 4, rentKes: 68000, depositKes: 68000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Kileleshwa (Oloitokitok, Kandara, Siaya)',
    exactLocation: 'Siaya Road, near Kileleshwa Police Station', latitude: -1.2801, longitude: 36.7862,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 700, waterRateKes: 150, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Jackson Mutiso', caretakerPhone: '0711993322',
    landlord: { name: 'Eng. Patrick Ochieng', phone: '+254711993322', whatsapp: '+254711993322', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Luxury 3 Bedroom All Ensuite + DSQ in Lavington (Isaac Gathanju)',
    description: 'Sprawling 3 bedroom all ensuite townhouse apartment in serene leafy Lavington. Includes detached servant quarter (DSQ), expansive dining and living area, pantry, laundry yard, clubhouse, infinity swimming pool, children play area, solar water heating.',
    category: '3 Bedroom',
    bedrooms: 3, bathrooms: 4, floorLevel: 2, rentKes: 115000, depositKes: 115000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Lavington (James Gichuru, Isaac Gathanju)',
    exactLocation: 'Isaac Gathanju Road, near Lavington Mall', latitude: -1.2824, longitude: 36.7681,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 1000, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'HassConsult Real Estate', caretakerName: 'Stephen Maina', caretakerPhone: '0733556677',
    landlord: { name: 'HassConsult Real Estate', phone: '+254733112233', whatsapp: '+254733112233', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: '4 Bedroom Standalone Villa with Private Garden in Spring Valley',
    description: 'Magnificent 4-bedroom standalone ambassadorial villa nestled in a quiet cul-de-sac in Spring Valley. Set on 0.5 acre manicured lawn, family room, 2 fireplaces, lockable garage for 3 cars, perimeter electric wall, UN security certified.',
    category: '4 Bedroom+',
    bedrooms: 4, bathrooms: 4, floorLevel: 1, rentKes: 220000, depositKes: 220000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Spring Valley',
    exactLocation: 'Spring Valley Road, near Lower Kabete Rd', latitude: -1.2483, longitude: 36.7865,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Postpaid (Monthly Meter)',
    garbageFeeKes: 1500, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Pam Golding Properties Kenya', caretakerName: 'Paul K.', caretakerPhone: '0722337788',
    landlord: { name: 'Pam Golding Properties Kenya', phone: '+254722337788', whatsapp: '+254722337788', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Penthouse with Panoramic Views in Riverside Drive',
    description: 'Exclusive 4-bedroom duplex penthouse offering 360-degree views of Nairobi skyline and the arboretum. Jacuzzi in master bathroom, imported Italian kitchen with built-in appliances, private elevator access, 3 covered parking slots, heated pool and spa.',
    category: 'Penthouse',
    bedrooms: 4, bathrooms: 5, floorLevel: 8, rentKes: 190000, depositKes: 190000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Riverside Drive',
    exactLocation: 'Riverside Drive, near German Embassy', latitude: -1.2721, longitude: 36.7944,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 1200, waterRateKes: 180, managedBy: 'agency',
    agencyName: 'Riverside Elite Realty', caretakerName: 'Anthony Kimani', caretakerPhone: '0710224466',
    landlord: { name: 'Riverside Elite Realty', phone: '+254710224466', whatsapp: '+254710224466', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Studio BnB Short-Stay in Kilimani (Rose Avenue near Yaya Centre)',
    description: 'Tastefully furnished studio apartment available for daily and monthly short stays. Superfast WiFi (50Mbps), smart TV with Netflix/DSTV, king bed with orthopaedic mattress, fully equipped kitchenette, rooftop heated pool, 24/7 self check-in.',
    category: 'Studio BnB (Short-Stay)',
    bedrooms: 1, bathrooms: 1, floorLevel: 5, rentKes: 65000, depositKes: 10000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Kilimani (Dennis Pritt, Argwings Kodhek, Lenana)',
    exactLocation: 'Rose Avenue, off Denis Pritt Road, Kilimani', latitude: -1.2921, longitude: 36.7884,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0, waterRateKes: 0, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Grace N.', caretakerPhone: '0718552211',
    landlord: { name: 'Grace N. (Superhost)', phone: '+254718552211', whatsapp: '+254718552211', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },

  // ─── NORTHERN THIKA ROAD CORRIDOR ────────────────────────────────────────────────
  {
    title: 'Modern Bedsitter in Roysambu along Lumumba Drive (Near TRM)',
    description: 'Neat bedsitter located on Lumumba Drive, 3 minutes walk to Thika Road Mall (TRM). Tiled floor, ceiling fan, balcony with laundry taps, unlimited borehole water, Safaricom Home Fibre ready, security guard 24/7 with CCTV.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 9500, depositKes: 9500,
    county: 'Nairobi', corridorId: 'northern_thika_road', estateSuburb: 'Roysambu / Mirema',
    exactLocation: 'Lumumba Drive, near TRM Roundabout', latitude: -1.2185, longitude: 36.8860,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Dennis Wanyama', caretakerPhone: '0728331199',
    landlord: { name: 'Samuel Mwangi', phone: '+254728331199', whatsapp: '+254728331199', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious 1 Bedroom Apartment in Kasarani (Clay City near Season)',
    description: 'Newly constructed 1-bedroom apartment in Clay City Kasarani. Spacious sitting room with open dining space, kitchen with overhead cabinets, master bedroom with wardrobe, borehole water, elevator, dedicated parking, CCTV surveillance.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 16500, depositKes: 16500,
    county: 'Nairobi', corridorId: 'northern_thika_road', estateSuburb: 'Kasarani (Sports View & Clay City)',
    exactLocation: 'Clay City, off Thika Road near Season', latitude: -1.2120, longitude: 36.8990,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Kennedy Otieno', caretakerPhone: '0703882211',
    landlord: { name: 'Eunice Wangari', phone: '+254703882211', whatsapp: '+254703882211', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Master Ensuite in Kahawa Sukari with Borehole',
    description: 'Quiet, secure court in Kahawa Sukari. Spacious 2 bedroom master ensuite, modern kitchen cabinets, laundry balcony, 24/7 borehole water, perimeter wall with razor wire and electric fence, secure parking with 2 guards.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 1, rentKes: 25000, depositKes: 25000,
    county: 'Kiambu', corridorId: 'northern_thika_road', estateSuburb: 'Kahawa Sukari',
    exactLocation: 'Kahawa Sukari, 1st South Avenue', latitude: -1.1890, longitude: 36.9320,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'George Mwangi', caretakerPhone: '0714778899',
    landlord: { name: 'Dr. Joseph Kuria', phone: '+254714778899', whatsapp: '+254714778899', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 3 Bedroom Maisonette in Garden Estate (Off Thika Rd)',
    description: 'Gated community maisonette in Garden Estate. Living room with fireplace, private backyard garden, ensuite master bedroom, servant quarter, solar water heating system, 2 parking slots, borehole water and 24/7 security patrol.',
    category: 'Maisonette / Townhouse',
    bedrooms: 3, bathrooms: 3, floorLevel: 1, rentKes: 68000, depositKes: 68000,
    county: 'Nairobi', corridorId: 'northern_thika_road', estateSuburb: 'Garden Estate',
    exactLocation: 'Garden Estate Road, off Thika Superhighway', latitude: -1.2310, longitude: 36.8650,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 700, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Thika Road Homes', caretakerName: 'Mathew Barasa', caretakerPhone: '0725667788',
    landlord: { name: 'Thika Road Homes', phone: '+254725667788', whatsapp: '+254725667788', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Student Friendly Bedsitter in Juja near JKUAT Gate C',
    description: 'Clean student-friendly bedsitter located 400m from JKUAT Gate C. Tiled floor, kitchen sink, instant hot shower, reliable borehole water, study desk area, WiFi ready, secure lockable compound with gate watchman.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 7500, depositKes: 7500,
    county: 'Kiambu', corridorId: 'northern_thika_road', estateSuburb: 'Juja (JKUAT & Toll Station)',
    exactLocation: 'Juja, near JKUAT Gate C', latitude: -1.1020, longitude: 37.0130,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Titus Kiplagat', caretakerPhone: '0719881122',
    landlord: { name: 'Titus Kiplagat', phone: '+254719881122', whatsapp: '+254719881122', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },

  // ─── KIAMBU ROAD & NORTHERN BYPASS ──────────────────────────────────────────────
  {
    title: 'Spacious Bedsitter in Ruaka (Joyland near Quickmart)',
    description: 'Bright bedsitter in central Ruaka, walking distance to Quickmart and Two Rivers Mall. Modern tiles, private washroom with instant shower, kitchenette counter, 24/7 borehole water, tokens meter, perimeter electric fence.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 10500, depositKes: 10500,
    county: 'Kiambu', corridorId: 'kiambu_northern_bypass', estateSuburb: 'Ruaka (Bypass & Slaughter Rd)',
    exactLocation: 'Ruaka Joyland, near Quickmart Supermarket', latitude: -1.2056, longitude: 36.7762,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Simon Njuguna', caretakerPhone: '0722339900',
    landlord: { name: 'Simon Njuguna', phone: '+254722339900', whatsapp: '+254722339900', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom Apartment in Thindigua, Kiambu Road',
    description: 'Executive 1 bedroom apartment along Kiambu Road in Thindigua. Open-plan kitchen with granite counters, spacious bedroom with built-in wardrobes, elevator, rooftop chill area with laundry hanging space, borehole water, 24/7 CCTV and manned gate.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 23000, depositKes: 23000,
    county: 'Kiambu', corridorId: 'kiambu_northern_bypass', estateSuburb: 'Thindigua',
    exactLocation: 'Thindigua, off Kiambu Road near Quickmart', latitude: -1.2140, longitude: 36.8320,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Kiambu Road Realty', caretakerName: 'Caleb Mutua', caretakerPhone: '0716447733',
    landlord: { name: 'Kiambu Road Realty', phone: '+254716447733', whatsapp: '+254716447733', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: false }
  },
  {
    title: 'Executive 3 Bedroom Townhouse in Fourways Junction Gated Estate',
    description: 'High-end 3-bedroom master ensuite townhouse inside Fourways Junction gated community on Kiambu Road. Private manicured garden, paved cabro parking for 2 cars, clubhouse, communal swimming pool, jogging tracks, top-notch 24/7 security.',
    category: 'Maisonette / Townhouse',
    bedrooms: 3, bathrooms: 3, floorLevel: 1, rentKes: 90000, depositKes: 90000,
    county: 'Kiambu', corridorId: 'kiambu_northern_bypass', estateSuburb: 'Fourways Junction',
    exactLocation: 'Fourways Junction, Kiambu Road', latitude: -1.2260, longitude: 36.8370,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 800, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'HassConsult Real Estate', caretakerName: 'Dennis Kimutai', caretakerPhone: '0733112233',
    landlord: { name: 'HassConsult Real Estate', phone: '+254733112233', whatsapp: '+254733112233', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: '4 Bedroom All Ensuite Villa in Edenville Phase 1 (Kiambu Rd)',
    description: 'Luxurious 4 bedroom all ensuite villa in prestigious Edenville gated estate. Spacious living room with separate dining room, family lounge on upper floor, detached domestic servant quarter, automated irrigation, UN security compliant.',
    category: '4 Bedroom+',
    bedrooms: 4, bathrooms: 5, floorLevel: 1, rentKes: 135000, depositKes: 135000,
    county: 'Kiambu', corridorId: 'kiambu_northern_bypass', estateSuburb: 'Edenville (Kiambu Rd)',
    exactLocation: 'Edenville Estate, Kiambu Road', latitude: -1.2010, longitude: 36.8390,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 1000, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Edenville Estate Management', caretakerName: 'Lucas Mwita', caretakerPhone: '0722883344',
    landlord: { name: 'Edenville Estate Management', phone: '+254722883344', whatsapp: '+254722883344', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },

  // ─── WAIYAKI WAY & KIKUYU CORRIDOR ──────────────────────────────────────────────
  {
    title: 'Clean Single Room in Kangemi near Waruku (Waiyaki Way)',
    description: 'Convenient single room located 3 minutes from Waiyaki Way at Waruku. Regular clean council water, shared tiled bathroom with hot water, tokens electricity, secure perimeter gate with night watchman. Easy commute to Westlands.',
    category: 'Single Room',
    bedrooms: 1, bathrooms: 1, floorLevel: 1, rentKes: 4800, depositKes: 4800,
    county: 'Nairobi', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Kangemi (Waruku & Posta)',
    exactLocation: 'Waruku, Kangemi, off Waiyaki Way', latitude: -1.2660, longitude: 36.7580,
    waterSupplyType: 'City Council Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 200, waterRateKes: 80, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Moses Chege', caretakerPhone: '0721665544',
    landlord: { name: 'Moses Chege', phone: '+254721665544', whatsapp: '+254721665544', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: false, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious Bedsitter in Kinoo 87 near Waiyaki Way Interchange',
    description: 'Well-finished bedsitter in Kinoo 87. Large window for natural light, tiled floors, kitchen sink with lower cabinets, constant borehole water supply, prepaid token meter, perimeter wall and CCTV.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 8500, depositKes: 8500,
    county: 'Kiambu', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Kinoo (87 & Stage)',
    exactLocation: 'Kinoo 87, 200m from Waiyaki Way', latitude: -1.2580, longitude: 36.7110,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 350, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Joshua M.', caretakerPhone: '0715994411',
    landlord: { name: 'Grace Wambui', phone: '+254715994411', whatsapp: '+254715994411', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom Apartment in Uthiru near Junction',
    description: 'Brand new 1 bedroom apartment in Uthiru. Clean modern finishes, spacious living area, bedroom fitted with wardrobes, private balcony with laundry connection, constant water, secure compound with ample parking.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 14500, depositKes: 14500,
    county: 'Kiambu', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Uthiru',
    exactLocation: 'Uthiru Junction, near Shopping Centre', latitude: -1.2610, longitude: 36.7320,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Evans Odhiambo', caretakerPhone: '0723884422',
    landlord: { name: 'James Kimani', phone: '+254723884422', whatsapp: '+254723884422', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 2 Bedroom Master Ensuite in Kikuyu Town (Gitaru Rd)',
    description: 'Tastefully built 2-bedroom master ensuite in Kikuyu Town. Close to Southern Bypass and Western Bypass for seamless commuting. Open kitchen, ceramic tiled floors, high-speed lift, secure parking, 24/7 borehole water.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 3, rentKes: 22000, depositKes: 22000,
    county: 'Kiambu', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Kikuyu (Town & Ondiri)',
    exactLocation: 'Kikuyu Town, Gitaru Road', latitude: -1.2460, longitude: 36.6640,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Bypass Heights Agency', caretakerName: 'Jackson Ngugi', caretakerPhone: '0717228844',
    landlord: { name: 'Bypass Heights Agency', phone: '+254717228844', whatsapp: '+254717228844', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: '3 Bedroom Standalone Bungalow in Mountain View Estate',
    description: 'Charming standalone 3-bedroom bungalow in prestigious Mountain View Estate along Waiyaki Way. Private compound with mature green garden, lockable garage, perimeter electric fence, perimeter wall, 24/7 guarded security gate.',
    category: 'Bungalow',
    bedrooms: 3, bathrooms: 2, floorLevel: 1, rentKes: 72000, depositKes: 72000,
    county: 'Nairobi', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Mountain View',
    exactLocation: 'Mountain View Estate, Court 4', latitude: -1.2590, longitude: 36.7450,
    waterSupplyType: 'City Council Water + Borehole Backup', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 700, waterRateKes: 150, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Silas Kilonzo', caretakerPhone: '0722119933',
    landlord: { name: 'Silas Kilonzo', phone: '+254722119933', whatsapp: '+254722119933', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },

  // ─── SOUTHERN SUBURBS & KAREN ───────────────────────────────────────────────────
  {
    title: 'Modern Bedsitter in South B (Plainsview near Capital Centre)',
    description: 'Clean, well-maintained bedsitter in Plainsview South B. Easy walking distance to Capital Centre and Mombasa Road. Kitchen sink, tiled washroom with hot shower, borehole water backup, tokens meter, perimeter electric fence.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 11500, depositKes: 11500,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'South B (Plainsview & Hazina)',
    exactLocation: 'Plainsview Estate, South B', latitude: -1.3090, longitude: 36.8370,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Richard Otieno', caretakerPhone: '0729443311',
    landlord: { name: 'Alice Muthoni', phone: '+254729443311', whatsapp: '+254729443311', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: '1 Bedroom Apartment in Nairobi West near Strathmore University',
    description: 'Well-designed 1-bedroom apartment in Nairobi West, highly ideal for young professionals and Strathmore students. Features bright living room, modern kitchen cabinets, borehole water, elevator, biometric entry, CCTV surveillance.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 22500, depositKes: 22500,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Nairobi West',
    exactLocation: 'Nairobi West, near Strathmore University Gate', latitude: -1.3080, longitude: 36.8210,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Nicholas Mutua', caretakerPhone: '0711776655',
    landlord: { name: 'Dr. Arthur Wanyonyi', phone: '+254711776655', whatsapp: '+254711776655', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Master Ensuite in Madaraka Estate near T-Mall',
    description: 'Renovated 2-bedroom master ensuite apartment in Madaraka Estate. Spacious sitting area with large windows, fitted kitchen with breakfast counter, ample parking, children play yard, round-the-clock security guard.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 2, rentKes: 33000, depositKes: 33000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Madaraka',
    exactLocation: 'Madaraka Estate, near T-Mall and Strathmore', latitude: -1.3040, longitude: 36.8120,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Madaraka Property Consultants', caretakerName: 'Victor K.', caretakerPhone: '0722668899',
    landlord: { name: 'Madaraka Property Consultants', phone: '+254722668899', whatsapp: '+254722668899', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 3 Bedroom Townhouse in Langata (Phenom Estate)',
    description: 'Premium 3 bedroom master ensuite townhouse inside Phenom Estate Langata. Features private compound, manicured lawn, modern modular kitchen, community swimming pool, gym, estate supermarket, 24/7 multi-tier security barrier.',
    category: 'Maisonette / Townhouse',
    bedrooms: 3, bathrooms: 3, floorLevel: 1, rentKes: 58000, depositKes: 58000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Langata (Phenom, Southlands & Ngei)',
    exactLocation: 'Phenom Estate, Langata Road', latitude: -1.3210, longitude: 36.7840,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 700, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Langata Living Properties', caretakerName: 'Felix Mwiti', caretakerPhone: '0733441188',
    landlord: { name: 'Langata Living Properties', phone: '+254733441188', whatsapp: '+254733441188', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: '4 Bedroom Luxury Colonial Villa on 0.5 Acre in Karen (Mbagathi Ridge)',
    description: 'Immaculate 4-bedroom colonial-style villa on half an acre in Karen Mbagathi Ridge. Enclosed verandah overlooking swimming pool, detached staff quarters for 2, solar inverter backup system, mature indigenous trees, UN approved security standards.',
    category: '4 Bedroom+',
    bedrooms: 4, bathrooms: 4, floorLevel: 1, rentKes: 260000, depositKes: 260000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Karen (Hardy, Bogani & Mbagathi)',
    exactLocation: 'Mbagathi Ridge, off Karen Road', latitude: -1.3320, longitude: 36.7210,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 1500, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Knight Frank Kenya', caretakerName: 'Harrison Mutua', caretakerPhone: '0711554433',
    landlord: { name: 'Knight Frank Kenya', phone: '+254711554433', whatsapp: '+254711554433', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },

  // ─── EASTLANDS & JOGOO ROAD ─────────────────────────────────────────────────────
  {
    title: 'Clean Budget Single Room in Pipeline Estate (Plot 10)',
    description: 'Economical single room in Pipeline near Plot 10. Clean shared facilities, tiled floor, constant borehole water supply, tokens meter per section, security guard on ground floor gate.',
    category: 'Single Room',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 4200, depositKes: 4200,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Pipeline',
    exactLocation: 'Pipeline, Plot 10, near Matatu Stage', latitude: -1.3190, longitude: 36.8850,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 200, waterRateKes: 80, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Benson Otieno', caretakerPhone: '0728114499',
    landlord: { name: 'Benson Otieno', phone: '+254728114499', whatsapp: '+254728114499', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: false, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious Tiled Bedsitter in Donholm Greenfields Estate',
    description: 'Spacious bedsitter in secure gated Greenfields Donholm. Kitchen sink with tiled wall splash, modern toilet with instant shower, perimeter wall with security guards at gate, borehole water 24/7.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 1, rentKes: 9200, depositKes: 9200,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Donholm (Phase 5 & Greenfields)',
    exactLocation: 'Donholm Greenfields, Court 12', latitude: -1.3020, longitude: 36.8880,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Tobias Makau', caretakerPhone: '0713559922',
    landlord: { name: 'Esther Njeri', phone: '+254713559922', whatsapp: '+254713559922', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom Apartment in Buruburu Phase 4',
    description: 'Neat 1-bedroom apartment in Buruburu Phase 4. Spacious living area, bedroom with fitted cabinets, kitchen with shelves, reliable water supply with backup tanks, parking space, 24/7 security guard.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 17000, depositKes: 17000,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Buruburu (Phases 1 to 5)',
    exactLocation: 'Buruburu Phase 4, near Mumias Road', latitude: -1.2910, longitude: 36.8780,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Eastlands Premier Properties', caretakerName: 'Philip Musyoka', caretakerPhone: '0720884433',
    landlord: { name: 'Eastlands Premier Properties', phone: '+254720884433', whatsapp: '+254720884433', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Apartment in Komarock Sector 3A',
    description: 'Newly refreshed 2 bedroom apartment in Komarock Sector 3A. Ceramic tiled floors, spacious sitting area, kitchen with lower and upper cabinets, borehole water backup, cabro paved parking, perimeter wall with razor wire.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 1, floorLevel: 2, rentKes: 21000, depositKes: 21000,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Komarock (Sectors 1 to 4)',
    exactLocation: 'Komarock Sector 3A, near K-Mall', latitude: -1.2720, longitude: 36.9120,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Paul Mutinda', caretakerPhone: '0718337755',
    landlord: { name: 'Paul Mutinda', phone: '+254718337755', whatsapp: '+254718337755', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 3 Bedroom Maisonette in Buruburu Phase 5',
    description: 'Charming 3-bedroom standalone maisonette with private front and backyard in Buruburu Phase 5. Living room with dining alcove, master ensuite, solar heating, private gate and parking for 2 cars.',
    category: 'Maisonette / Townhouse',
    bedrooms: 3, bathrooms: 2, floorLevel: 1, rentKes: 42000, depositKes: 42000,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Buruburu (Phases 1 to 5)',
    exactLocation: 'Buruburu Phase 5, near Mesora Centre', latitude: -1.2940, longitude: 36.8820,
    waterSupplyType: 'City Council Water + Borehole Backup', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 600, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Francis Kimani', caretakerPhone: '0722557766',
    landlord: { name: 'Francis Kimani', phone: '+254722557766', whatsapp: '+254722557766', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },

  // ─── MOMBASA ROAD & SATELLITE TOWNS ─────────────────────────────────────────────
  {
    title: 'Executive Bedsitter in Mlolongo near Nairobi Expressway Toll',
    description: 'Modern bedsitter in Mlolongo town, 300m from Expressway entrance. Direct transit to CBD in 15 minutes. Tiled floor, kitchen sink counter, clean water 24/7 from dedicated borehole, tokens meter, perimeter wall with CCTV.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 8500, depositKes: 8500,
    county: 'Machakos', corridorId: 'mombasa_road_satellite', estateSuburb: 'Mlolongo Town',
    exactLocation: 'Mlolongo, behind Signature Mall', latitude: -1.3810, longitude: 36.9390,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Jackson Mutie', caretakerPhone: '0724883311',
    landlord: { name: 'Jackson Mutie', phone: '+254724883311', whatsapp: '+254724883311', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom Apartment in Syokimau (Chady Road near Gateway)',
    description: 'Brand new 1 bedroom apartment along Chady Road, Syokimau. Walking distance to Gateway Mall and Syokimau SGR Terminus. Large living room, fitted kitchen, balcony with laundry area, high-speed lift, gym, borehole, 24/7 security.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 19000, depositKes: 19000,
    county: 'Machakos', corridorId: 'mombasa_road_satellite', estateSuburb: 'Syokimau (Chady & Airport Rd)',
    exactLocation: 'Chady Road, off Mombasa Road, Syokimau', latitude: -1.3520, longitude: 36.9180,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Mombasa Road Homes', caretakerName: 'Martin Nzioki', caretakerPhone: '0716554422',
    landlord: { name: 'Mombasa Road Homes', phone: '+254716554422', whatsapp: '+254716554422', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: false }
  },
  {
    title: 'Spacious 2 Bedroom Master Ensuite in Athi River (Crystal Rivers)',
    description: 'Modern 2-bedroom master ensuite apartment located near Crystal Rivers Mall in Athi River. Features ceramic tiles throughout, balcony, solar water heating, 24/7 borehole water, perimeter wall, children play area.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 3, rentKes: 22000, depositKes: 22000,
    county: 'Machakos', corridorId: 'mombasa_road_satellite', estateSuburb: 'Athi River (Sabaki & EPZ)',
    exactLocation: 'Near Crystal Rivers Mall, Athi River', latitude: -1.4390, longitude: 36.9780,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Geoffrey Muli', caretakerPhone: '0721773344',
    landlord: { name: 'Geoffrey Muli', phone: '+254721773344', whatsapp: '+254721773344', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: '4 Bedroom Standalone Maisonette on 50x100 in Kitengela (Milimani)',
    description: 'Executive 4 bedroom master ensuite maisonette sitting on its own 50x100 plot in Milimani Kitengela. Living room with dining area, perimeter stone wall with electric wire, underground water reservoir of 15,000 litres, cabro compound for 4 cars.',
    category: 'Maisonette / Townhouse',
    bedrooms: 4, bathrooms: 3, floorLevel: 1, rentKes: 52000, depositKes: 52000,
    county: 'Kajiado', corridorId: 'mombasa_road_satellite', estateSuburb: 'Kitengela Town',
    exactLocation: 'Milimani Estate, Kitengela, 1km from Namanga Road', latitude: -1.4820, longitude: 36.9610,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 600, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Daniel Ole Kaelo', caretakerPhone: '0722995511',
    landlord: { name: 'Daniel Ole Kaelo', phone: '+254722995511', whatsapp: '+254722995511', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },

  // ─── NGONG ROAD & ONGATA RONGAI ─────────────────────────────────────────────────
  {
    title: 'Spacious Bedsitter in Ongata Rongai (Tumaini Supermarket Environs)',
    description: 'Neat and quiet bedsitter near Tumaini Rongai. Features tiled flooring, fitted kitchen counter with stainless sink, clean tiled toilet with instant shower, unlimited borehole water, security guard and perimeter wall.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 7800, depositKes: 7800,
    county: 'Kajiado', corridorId: 'ngong_rongai_satellite', estateSuburb: 'Ongata Rongai (Maasai Lodge & Town)',
    exactLocation: 'Near Tumaini Supermarket, Ongata Rongai', latitude: -1.3960, longitude: 36.7580,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Robert Kiprotich', caretakerPhone: '0714885522',
    landlord: { name: 'Robert Kiprotich', phone: '+254714885522', whatsapp: '+254714885522', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom in Ngong Town near SGR Station',
    description: 'Cozy 1 bedroom apartment in serene Ngong Town with cool breeze from the hills. Spacious living area, tiled modern bathroom, kitchen cabinets, private balcony with hills view, 24/7 water supply, ample parking with perimeter wall.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 13500, depositKes: 13500,
    county: 'Kajiado', corridorId: 'ngong_rongai_satellite', estateSuburb: 'Ngong Town & Hills',
    exactLocation: 'Ngong Town, near SGR Station', latitude: -1.3610, longitude: 36.6570,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Moses Nderitu', caretakerPhone: '0726338844',
    landlord: { name: 'Moses Nderitu', phone: '+254726338844', whatsapp: '+254726338844', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Apartment in Rongai (Maasai Lodge Rd)',
    description: 'Executive 2-bedroom master ensuite apartment along Maasai Lodge Road. Modern kitchen, spacious balcony, continuous borehole water supply, tokens meter, perimeter wall with electric fence, dedicated parking.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 2, rentKes: 19500, depositKes: 19500,
    county: 'Kajiado', corridorId: 'ngong_rongai_satellite', estateSuburb: 'Ongata Rongai (Maasai Lodge & Town)',
    exactLocation: 'Maasai Lodge Road, Rongai', latitude: -1.3910, longitude: 36.7640,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Boniface Mutua', caretakerPhone: '0715332288',
    landlord: { name: 'Boniface Mutua', phone: '+254715332288', whatsapp: '+254715332288', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: '3 Bedroom Standalone Bungalow with Big Garden in Kiserian',
    description: 'Serene 3 bedroom bungalow set on 1/4 acre private compound in Kiserian. Large lounge with stone fireplace, spacious kitchen with store, mature fruit trees in compound, solar water heating, underground water storage.',
    category: 'Bungalow',
    bedrooms: 3, bathrooms: 2, floorLevel: 1, rentKes: 34000, depositKes: 34000,
    county: 'Kajiado', corridorId: 'ngong_rongai_satellite', estateSuburb: 'Kiserian',
    exactLocation: 'Kiserian Pipelines, off Magadi Road', latitude: -1.4320, longitude: 36.6890,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'John Sunkuli', caretakerPhone: '0722774411',
    landlord: { name: 'John Sunkuli', phone: '+254722774411', whatsapp: '+254722774411', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 2 Bedroom Master Ensuite in Brookside Drive, Westlands',
    description: 'Prestigious 2 bedroom master ensuite apartment along Brookside Drive. Open plan kitchen with granite island, spacious balcony with peaceful tree canopy views, heated pool, gym, full backup generator, 2 high speed lifts and UN security clearance.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 4, rentKes: 78000, depositKes: 78000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Brookside Drive',
    exactLocation: 'Brookside Drive, off Waiyaki Way', latitude: -1.2541, longitude: 36.7972,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 800, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Knight Frank Kenya', caretakerName: 'Wilson Kiptoo', caretakerPhone: '0711554433',
    landlord: { name: 'Knight Frank Kenya', phone: '+254711554433', whatsapp: '+254711554433', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Designer Studio BnB / Airbnb in Two Rivers Area (Ruaka)',
    description: 'Fully furnished and serviced studio apartment 2 minutes from Two Rivers Mall. High-speed 50Mbps internet, Netflix, smart TV, self check-in smart lock, plush queen bed, fully equipped kitchenette, rooftop infinity pool and gym.',
    category: 'Studio BnB (Short-Stay)',
    bedrooms: 1, bathrooms: 1, floorLevel: 6, rentKes: 55000, depositKes: 10000,
    county: 'Kiambu', corridorId: 'kiambu_northern_bypass', estateSuburb: 'Ruaka (Bypass & Slaughter Rd)',
    exactLocation: 'Limuru Road near Two Rivers Mall', latitude: -1.2080, longitude: 36.7790,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0, waterRateKes: 0, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Brenda Cherono', caretakerPhone: '0729118833',
    landlord: { name: 'Brenda Cherono', phone: '+254729118833', whatsapp: '+254729118833', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Spacious 3 Bedroom Master Ensuite in Hurlingham near Yaya Centre',
    description: 'Prime 3 bedroom master ensuite apartment on Argwings Kodhek Road. Walking distance to Yaya Centre and Chaka Place. Large living room with dining area, closed kitchen with pantry, borehole, dedicated parking, 24/7 security guard.',
    category: '3 Bedroom',
    bedrooms: 3, bathrooms: 2, floorLevel: 3, rentKes: 85000, depositKes: 85000,
    county: 'Nairobi', corridorId: 'westlands_diplomatic', estateSuburb: 'Hurlingham',
    exactLocation: 'Argwings Kodhek Road, Hurlingham', latitude: -1.2965, longitude: 36.7951,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 700, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'HassConsult Real Estate', caretakerName: 'Kennedy Mwangi', caretakerPhone: '0733112233',
    landlord: { name: 'HassConsult Real Estate', phone: '+254733112233', whatsapp: '+254733112233', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Affordable Single Room in Kawangware 46 near Naivasha Rd',
    description: 'Clean budget single room situated near Naivasha Road stage 46. Tiled floor, regular city council water supply with overhead storage, secure lockable compound with gatekeeper, convenient transit to Junction Mall and CBD.',
    category: 'Single Room',
    bedrooms: 1, bathrooms: 1, floorLevel: 1, rentKes: 3800, depositKes: 3800,
    county: 'Nairobi', corridorId: 'dagoretti_waiyaki_way', estateSuburb: 'Kawangware (46 & 56)',
    exactLocation: 'Kawangware 46, off Naivasha Road', latitude: -1.2890, longitude: 36.7450,
    waterSupplyType: 'City Council Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 150, waterRateKes: 80, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Ezekiel Omari', caretakerPhone: '0724991122',
    landlord: { name: 'Ezekiel Omari', phone: '+254724991122', whatsapp: '+254724991122', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: false, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Student Friendly Bedsitter in Kahawa Wendani near KU Gate',
    description: 'Ideal bedsitter for Kenyatta University students and young professionals. Located along Wendani Matatu route, 5 minutes walk to KU footbridge. Ceramic tiles, private washroom with instant shower, unlimited borehole water, WiFi ready.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 7800, depositKes: 7800,
    county: 'Kiambu', corridorId: 'northern_thika_road', estateSuburb: 'Kahawa Wendani',
    exactLocation: 'Kahawa Wendani, near Magunas Supermarket', latitude: -1.1960, longitude: 36.9280,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Barnabas Wafula', caretakerPhone: '0719445588',
    landlord: { name: 'Barnabas Wafula', phone: '+254719445588', whatsapp: '+254719445588', isAgency: false },
    amenities: { hasBalcony: false, hasParking: false, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 2 Bedroom Apartment in Ruiru Town near Eastern Bypass',
    description: 'Spacious 2 bedroom apartment in Ruiru town near Kamakis. Easy access to Eastern Bypass and Superhighway. Large sitting room, modern fitted kitchen cabinets, laundry balcony, borehole water, perimeter wall with electric fence and CCTV.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 1, floorLevel: 2, rentKes: 22000, depositKes: 22000,
    county: 'Kiambu', corridorId: 'northern_thika_road', estateSuburb: 'Ruiru Town',
    exactLocation: 'Ruiru, near Kamakis Bypass Junction', latitude: -1.1460, longitude: 36.9580,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Ruiru Metro Realty', caretakerName: 'Charles Karanja', caretakerPhone: '0722116633',
    landlord: { name: 'Ruiru Metro Realty', phone: '+254722116633', whatsapp: '+254722116633', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious 1 Bedroom Apartment in Roysambu near Mirema Drive',
    description: 'Neat 1-bedroom apartment located in prime Roysambu near Mirema Drive. Tiled flooring, large living room, fitted kitchen cabinets, bedroom with wardrobe, borehole water, lift, 24/7 security guard, biometric gate entry.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 3, rentKes: 15500, depositKes: 15500,
    county: 'Nairobi', corridorId: 'northern_thika_road', estateSuburb: 'Roysambu / Mirema',
    exactLocation: 'Mirema Drive, Roysambu', latitude: -1.2160, longitude: 36.8820,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Hillary Kipkemboi', caretakerPhone: '0712884499',
    landlord: { name: 'Gladys Muthoni', phone: '+254712884499', whatsapp: '+254712884499', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 2 Bedroom Master Ensuite in South C (Mugoya Estate)',
    description: 'Immaculate 2-bedroom master ensuite apartment in secure gated Mugoya Estate, South C. Modern open kitchen with granite countertops, private balcony, borehole water backup, ample paved parking, 24/7 security patrol.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 2, rentKes: 36000, depositKes: 36000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'South C (Mugoya & Bellevue)',
    exactLocation: 'Mugoya Estate, South C, near Red Cross', latitude: -1.3170, longitude: 36.8280,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'South C Prime Properties', caretakerName: 'Ali Hassan', caretakerPhone: '0722771144',
    landlord: { name: 'South C Prime Properties', phone: '+254722771144', whatsapp: '+254722771144', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Modern 1 Bedroom in South B (Hazina Estate near Mombasa Rd)',
    description: 'Newly renovated 1-bedroom apartment in Hazina Estate, South B. Quick access to Mombasa Road and CBD. Fitted kitchen with lower and upper cabinets, large windows, borehole water, secure court with manned barrier.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 20000, depositKes: 20000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'South B (Plainsview & Hazina)',
    exactLocation: 'Hazina Estate, South B', latitude: -1.3120, longitude: 36.8340,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 450, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Josephat Muia', caretakerPhone: '0726115599',
    landlord: { name: 'Josephat Muia', phone: '+254726115599', whatsapp: '+254726115599', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 4 Bedroom Villa on 0.5 Acre in Karen (Bogani Road)',
    description: 'Prestigious 4-bedroom all ensuite standalone villa in Karen along Bogani Road. Expansive sunken living room with fireplace, private swimming pool, mature garden, detached domestic servant quarters for 2, solar water heater, 24/7 security.',
    category: '4 Bedroom+',
    bedrooms: 4, bathrooms: 4, floorLevel: 1, rentKes: 200000, depositKes: 200000,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Karen (Hardy, Bogani & Mbagathi)',
    exactLocation: 'Bogani Road, Karen', latitude: -1.3360, longitude: 36.7260,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Postpaid (Monthly Meter)',
    garbageFeeKes: 1200, waterRateKes: 150, managedBy: 'agency',
    agencyName: 'Knight Frank Kenya', caretakerName: 'Harrison Mutua', caretakerPhone: '0711554433',
    landlord: { name: 'Knight Frank Kenya', phone: '+254711554433', whatsapp: '+254711554433', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: true, hasSwimmingPool: true }
  },
  {
    title: 'Modern Bedsitter in Langata near Carnivore / Southlands',
    description: 'Neat modern bedsitter in Southlands Langata. Tiled floors, private bathroom with hot instant shower, kitchen counter, borehole water backup, tokens meter, secure perimeter fence and night guard.',
    category: 'Bedsitter / Studio',
    bedrooms: 1, bathrooms: 1, floorLevel: 1, rentKes: 10500, depositKes: 10500,
    county: 'Nairobi', corridorId: 'southern_langata_kibra', estateSuburb: 'Langata (Phenom, Southlands & Ngei)',
    exactLocation: 'Southlands, Langata, off Langata Road', latitude: -1.3280, longitude: 36.7790,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Patrick Oloo', caretakerPhone: '0713772266',
    landlord: { name: 'Patrick Oloo', phone: '+254713772266', whatsapp: '+254713772266', isAgency: false },
    amenities: { hasBalcony: false, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 2 Bedroom Master Ensuite in Fedha Estate near Tassia',
    description: 'Newly finished 2 bedroom master ensuite apartment in Fedha Estate. Open plan kitchen with polished granite tops, large sitting room, modern tiled bathrooms, borehole water, elevator, biometric security gate and CCTV.',
    category: '2 Bedroom',
    bedrooms: 2, bathrooms: 2, floorLevel: 3, rentKes: 24000, depositKes: 24000,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Fedha (Embakasi)',
    exactLocation: 'Fedha Estate, near Tassia Hill', latitude: -1.3230, longitude: 36.9010,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500, waterRateKes: 120, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Collins Wekesa', caretakerPhone: '0727448811',
    landlord: { name: 'Collins Wekesa', phone: '+254727448811', whatsapp: '+254727448811', isAgency: false },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Spacious 1 Bedroom Apartment in Umoja Innercore (Near Market)',
    description: 'Clean, quiet 1-bedroom apartment in Umoja Innercore. Ceramic tiles, spacious bedroom with wardrobe, kitchen with double sink, regular council water plus borehole backup tanks, 24/7 security watchman.',
    category: '1 Bedroom',
    bedrooms: 1, bathrooms: 1, floorLevel: 2, rentKes: 12500, depositKes: 12500,
    county: 'Nairobi', corridorId: 'eastlands_outer_ring', estateSuburb: 'Umoja (Innercore & Phase 1)',
    exactLocation: 'Umoja Innercore, near Main Market', latitude: -1.2882, longitude: 36.8958,
    waterSupplyType: 'City Council Water + Borehole Backup', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300, waterRateKes: 100, managedBy: 'landlord',
    agencyName: null, caretakerName: 'Martin Maina', caretakerPhone: '0715663322',
    landlord: { name: 'Martin Maina', phone: '+254715663322', whatsapp: '+254715663322', isAgency: false },
    amenities: { hasBalcony: true, hasParking: false, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: 'Executive 3 Bedroom Master Ensuite in Syokimau (Katani Road)',
    description: 'Charming 3-bedroom master ensuite townhouse apartment on Katani Road, Syokimau. Spacious lounge with dining space, pantry, borehole water, solar water heating, cabro paved parking for 2 cars, 24/7 security guard.',
    category: '3 Bedroom',
    bedrooms: 3, bathrooms: 2, floorLevel: 1, rentKes: 38000, depositKes: 38000,
    county: 'Machakos', corridorId: 'mombasa_road_satellite', estateSuburb: 'Syokimau (Katani & Mombasa Rd)',
    exactLocation: 'Katani Road, 1.5km from Mombasa Road', latitude: -1.3650, longitude: 36.9240,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 600, waterRateKes: 120, managedBy: 'agency',
    agencyName: 'Syokimau Valley Realty', caretakerName: 'Duncan Kioko', caretakerPhone: '0721885544',
    landlord: { name: 'Syokimau Valley Realty', phone: '+254721885544', whatsapp: '+254721885544', isAgency: true },
    amenities: { hasBalcony: true, hasParking: true, hasElectricFence: true, hasCctv: true, hasInternet: true, hasTiles: true, isMasterEnsuite: true, hasGym: false, hasSwimmingPool: false }
  },
  {
    title: '1/4 Acre Residential Fenced Plot for Rent/Lease in Kitengela',
    description: 'Prime fenced 1/4 acre residential plot in Kitengela town outskirts. Ideal for yard, nursery, storage, residential usage or temporary structures. Good access road, water and electricity connections nearby.',
    category: 'Land',
    bedrooms: 0, bathrooms: 0, floorLevel: 0, rentKes: 25000, depositKes: 25000,
    county: 'Kajiado', corridorId: 'mombasa_road_satellite', estateSuburb: 'Kitengela Town',
    exactLocation: 'Kitengela, off Old Namanga Road', latitude: -1.4880, longitude: 36.9550,
    waterSupplyType: 'Borehole Water', electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0, waterRateKes: 0, managedBy: 'agency',
    agencyName: 'Kitengela Land Consultants', caretakerName: 'Peter Saitoti', caretakerPhone: '0722441199',
    landlord: { name: 'Kitengela Land Consultants', phone: '+254722441199', whatsapp: '+254722441199', isAgency: true },
    amenities: { hasBalcony: false, hasParking: true, hasElectricFence: true, hasCctv: false, hasInternet: false, hasTiles: false, isMasterEnsuite: false, hasGym: false, hasSwimmingPool: false }
  }
];

function generateNewListings() {
  const generated = [];
  let nextId = 24;

  rawListingTemplates.forEach((tpl, idx) => {
    const id = `prop-nrb-${String(nextId).padStart(3, '0')}`;
    nextId++;

    const media = buildMedia(idx, tpl.category);
    const images = media.map(m => m.url);

    const fullListing = {
      id,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      bedrooms: tpl.bedrooms,
      bathrooms: tpl.bathrooms,
      floorLevel: tpl.floorLevel,
      rentKes: tpl.rentKes,
      depositKes: tpl.depositKes,
      county: tpl.county,
      corridorId: tpl.corridorId,
      estateSuburb: tpl.estateSuburb,
      exactLocation: tpl.exactLocation,
      latitude: tpl.latitude,
      longitude: tpl.longitude,
      waterSupplyType: tpl.waterSupplyType,
      electricityMeterType: tpl.electricityMeterType,
      garbageFeeKes: tpl.garbageFeeKes,
      waterRateKes: tpl.waterRateKes,
      isFeatured: idx % 4 === 0,
      isTopAd: idx % 5 === 0,
      isVerified: true,
      badgeType: idx % 4 === 0 ? 'featured' : 'verified',
      status: 'approved',
      isApproved: true,
      availability: 'vacant',
      dateAdded: new Date(Date.now() - (idx * 3600 * 1000 * 8)).toISOString(),
      source: 'direct',
      managedBy: tpl.managedBy,
      agencyName: tpl.agencyName,
      caretakerName: tpl.caretakerName,
      caretakerPhone: tpl.caretakerPhone,
      postedTimeAgo: `${(idx + 1) * 2}h ago`,
      landlord: {
        id: `usr-lnd-${nextId}`,
        name: tpl.landlord.name,
        phone: tpl.landlord.phone,
        whatsapp: tpl.landlord.whatsapp,
        isVerified: true,
        isPremiumVerified: true,
        isAgency: tpl.landlord.isAgency,
        memberSince: 'March 2024',
        rating: 4.8,
        reviewCount: 15 + (idx % 20),
        responseRate: 97,
        listingCount: 5 + (idx % 10),
        verificationDate: '2024-03-01',
        backgroundCheckPassed: true
      },
      amenities: tpl.amenities,
      media,
      images,
      photoCount: media.length
    };

    generated.push(fullListing);
  });

  return generated;
}

module.exports = { generateNewListings };
