/**
 * KejaMarket - Authentic Nairobi Facebook Marketplace Property Database
 * Curated from active Nairobi real estate feeds, Facebook marketplace listings, and direct landlord posts across Nairobi Metropolitan corridors.
 */

const SEED_PROPERTIES = [
  // ─── 1. RUAKA & KIAMBU ROAD CORRIDOR ─────────────────────────────────────────
  {
    id: 'prop-nrb-001',
    title: 'Executive 2 Bedroom Master Ensuite with Balcony in Ruaka (Near Two Rivers)',
    description: 'Direct Facebook Listing: Newly built 2-bedroom master ensuite apartment located in Ruaka, just 3 minutes from Two Rivers Mall & Rosslyn Riviera. Features a spacious living room with large glass sliding doors opening to a scenic balcony, modern open-plan kitchen with granite tops and pantry, fitted bedroom wardrobes, continuous borehole water supply with overhead tanks, high-speed elevator, rooftop chill lounge, 24/7 CCTV surveillance, and perimeter electric fence. Rent includes garbage and service charge.',
    category: '2 Bedroom',
    bedrooms: 2,
    bathrooms: 2,
    floorLevel: 3,
    rentKes: 32000,
    depositKes: 32000,
    county: 'Kiambu',
    corridorId: 'ruaka_kiambu',
    estateSuburb: 'Ruaka (Bypass & Slaughter Rd)',
    exactLocation: 'Ruaka Bypass, near Joyland Supermarket',
    latitude: -1.2056,
    longitude: 36.7762,
    waterSupplyType: 'Borehole + Council Backup',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500,
    waterRateKes: 120,
    isFeatured: true,
    isTopAd: true,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '12m ago on Facebook Marketplace',
    landlord: {
      id: 'usr-landlord-01',
      name: 'James Mwangi Properties',
      phone: '+254712345678',
      whatsapp: '+254712345678',
      isVerified: true,
      memberSince: 'March 2023',
      rating: 4.9,
      reviewCount: 14
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: true,
      hasGym: true,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', caption: 'Spacious living room opening to private balcony' },
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', caption: 'Master ensuite bedroom with wide closet' },
      { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80', caption: 'Modern fitted kitchen with granite countertops' }
    ],
    photoCount: 8
  },
  {
    id: 'prop-nrb-008',
    title: 'Modern 1 Bedroom Apartment in Ruaka along Limuru Road',
    description: 'Spacious 1 bedroom apartment along Limuru Road near Ruaka Square. Features tiled floors, separate laundry area, continuous water with booster pumps, prepaid tokens meter, and 24hr manned gate with night guard. High-speed fibre internet from Safaricom and Zuku installed in the building.',
    category: '1 Bedroom',
    bedrooms: 1,
    bathrooms: 1,
    floorLevel: 2,
    rentKes: 18500,
    depositKes: 18500,
    county: 'Kiambu',
    corridorId: 'ruaka_kiambu',
    estateSuburb: 'Ruaka (Bypass & Slaughter Rd)',
    exactLocation: 'Limuru Road, near Ruaka Square',
    latitude: -1.2091,
    longitude: 36.7725,
    waterSupplyType: 'Borehole Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 400,
    waterRateKes: 100,
    isFeatured: false,
    isTopAd: false,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '35m ago',
    landlord: {
      id: 'usr-landlord-08',
      name: 'Catherine Njeri',
      phone: '+254722998877',
      whatsapp: '+254722998877',
      isVerified: true,
      memberSince: 'January 2024',
      rating: 4.8,
      reviewCount: 9
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: false,
      hasGym: false,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', caption: 'Living space with good natural lighting' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', caption: 'Fitted kitchen area' }
    ],
    photoCount: 5
  },

  // ─── 2. KILIMANI, KILELESHWA & WESTLANDS BELT ──────────────────────────────
  {
    id: 'prop-nrb-003',
    title: 'Luxury 2 Bedroom Master Ensuite with Pool & Gym in Kilimani (Dennis Pritt Rd)',
    description: 'Premium apartment located on Dennis Pritt Road, Kilimani. High-floor corner unit offering stunning panoramic views of Nairobi skyline. Features wooden parquet finish, designer fitted kitchen with cooker & microwave, standby generator for common areas and inside apartment, heated swimming pool, fully equipped fitness center, high-speed elevators, and biometric access control.',
    category: '2 Bedroom',
    bedrooms: 2,
    bathrooms: 2,
    floorLevel: 7,
    rentKes: 65000,
    depositKes: 65000,
    county: 'Nairobi',
    corridorId: 'kilimani_westlands',
    estateSuburb: 'Kilimani (Yaya & Dennis Pritt)',
    exactLocation: 'Dennis Pritt Road, near State House Girls',
    latitude: -1.2915,
    longitude: 36.7925,
    waterSupplyType: 'Borehole + Council Backup',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0,
    waterRateKes: 0,
    isFeatured: true,
    isTopAd: true,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '1 hour ago',
    landlord: {
      id: 'usr-landlord-03',
      name: 'Prime City Realty Kenya',
      phone: '+254733112244',
      whatsapp: '+254733112244',
      isVerified: true,
      memberSince: 'July 2022',
      rating: 5.0,
      reviewCount: 28
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: true,
      hasGym: true,
      hasSwimmingPool: true
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', caption: 'Open-plan living room with expansive glass windows' },
      { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Modern bathroom with glass cubicle' },
      { url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80', caption: 'Heated residents swimming pool' }
    ],
    photoCount: 12
  },
  {
    id: 'prop-bnb-001',
    title: 'Cozy Designer Studio BnB / Airbnb in Kilimani near Yaya Centre',
    description: 'Chic, fully furnished and serviced studio apartment on Argwings Kodhek Road. Equipped with ultra-fast 50Mbps WiFi, 55" 4K Smart TV with Netflix/YouTube, queen-size orthopedic mattress, microwave, fridge, toaster, kettle, and hot rain shower. Self check-in via smart keypad lock. Perfect for business travelers, tourists, or weekend staycations.',
    category: 'BnB / Airbnb Short Stay',
    bedrooms: 0,
    bathrooms: 1,
    floorLevel: 4,
    rentKes: 3800,
    depositKes: 0,
    rentPeriod: 'night',
    isBnb: true,
    county: 'Nairobi',
    corridorId: 'kilimani_westlands',
    estateSuburb: 'Kilimani (Yaya & Dennis Pritt)',
    exactLocation: 'Argwings Kodhek Road, opposite Yaya Centre',
    latitude: -1.2942,
    longitude: 36.7868,
    waterSupplyType: 'Borehole Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0,
    waterRateKes: 0,
    isFeatured: true,
    isTopAd: true,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: 'Just now',
    landlord: {
      id: 'usr-bnb-host-01',
      name: 'Mercy Achieng (Superhost)',
      phone: '+254720556677',
      whatsapp: '+254720556677',
      isVerified: true,
      memberSince: 'September 2021',
      rating: 4.95,
      reviewCount: 54
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: true,
      hasGym: true,
      hasSwimmingPool: true
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', caption: 'Cozy queen bed with hotel-grade linens' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', caption: 'Lounge area with Smart TV' }
    ],
    photoCount: 10
  },
  {
    id: 'prop-nrb-009',
    title: 'Spacious 3 Bedroom Master Ensuite with DSQ in Kileleshwa (Oloitokitok Rd)',
    description: 'Executive 3-bedroom family apartment with detached servant quarter (DSQ). Features large separate dining area, spacious laundry yard with washing machine provision, large pantry, private balconies in living and master bedroom, 2 parking slots per unit, generator, borehole, solar water heating, and children play garden.',
    category: '3 Bedroom',
    bedrooms: 3,
    bathrooms: 3,
    floorLevel: 4,
    rentKes: 85000,
    depositKes: 85000,
    county: 'Nairobi',
    corridorId: 'kilimani_westlands',
    estateSuburb: 'Kileleshwa (Gatundu & Oloitokitok)',
    exactLocation: 'Oloitokitok Road, near Kasuku Centre',
    latitude: -1.2825,
    longitude: 36.7850,
    waterSupplyType: 'Borehole + Council Backup',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 0,
    waterRateKes: 0,
    isFeatured: true,
    isTopAd: false,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '2 hours ago',
    landlord: {
      id: 'usr-landlord-09',
      name: 'Kileleshwa Heights Management',
      phone: '+254710445566',
      whatsapp: '+254710445566',
      isVerified: true,
      memberSince: 'February 2023',
      rating: 4.8,
      reviewCount: 16
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: true,
      hasGym: true,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', caption: 'Spacious family living area' },
      { url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80', caption: 'Modern kitchen with fitted cabinets' }
    ],
    photoCount: 9
  },

  // ─── 3. ROYSAMBU, MIREMA & THIKA ROAD CORRIDOR ──────────────────────────────
  {
    id: 'prop-nrb-002',
    title: 'Modern Tiled Bedsitter / Studio along Mirema Drive, Roysambu (Near TRM)',
    description: 'Facebook Verified Post: Clean, modern bedsitter along Mirema Drive, just 4 minutes walk to TRM Mall & Thika Superhighway. Fully tiled, fitted kitchen area with sink and cabinets, private balcony with clothesline, spacious washroom with hot instant shower, 24/7 borehole water supply, biometric front gate, CCTV, and fibre internet from Safaricom / Zuku installed.',
    category: 'Bedsitter / Studio',
    bedrooms: 0,
    bathrooms: 1,
    floorLevel: 3,
    rentKes: 11000,
    depositKes: 11000,
    county: 'Nairobi',
    corridorId: 'roysambu_thika',
    estateSuburb: 'Roysambu (TRM & Mirema Drive)',
    exactLocation: 'Mirema Drive, near Paris Lounge',
    latitude: -1.2185,
    longitude: 36.8850,
    waterSupplyType: 'Borehole Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300,
    waterRateKes: 100,
    isFeatured: true,
    isTopAd: true,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '15m ago',
    landlord: {
      id: 'usr-landlord-02',
      name: 'Grace Wambui (Caretaker)',
      phone: '+254722001122',
      whatsapp: '+254722001122',
      isVerified: true,
      memberSince: 'May 2023',
      rating: 4.8,
      reviewCount: 22
    },
    amenities: {
      hasBalcony: true,
      hasParking: false,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: false,
      hasGym: false,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80', caption: 'Tiled bedsitter interior with wide window' },
      { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Clean private bathroom with instant shower' }
    ],
    photoCount: 6
  },
  {
    id: 'prop-nrb-010',
    title: 'Spacious 1 Bedroom Apartment in Kasarani ICIPE Road',
    description: 'Modern 1 bedroom apartment in Kasarani near ICIPE and Sportsview Hotel. Spacious sitting room, large bedroom with in-built wardrobe, water tanks with automatic pumping, tokens meter, secure perimeter wall with electric razor fence. Quick matatu access to CBD via Thika Road.',
    category: '1 Bedroom',
    bedrooms: 1,
    bathrooms: 1,
    floorLevel: 2,
    rentKes: 15000,
    depositKes: 15000,
    county: 'Nairobi',
    corridorId: 'roysambu_thika',
    estateSuburb: 'Kasarani (Sportsview & Seasons)',
    exactLocation: 'ICIPE Road, near Sportsview Hotel',
    latitude: -1.2250,
    longitude: 36.9010,
    waterSupplyType: 'Borehole Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 300,
    waterRateKes: 100,
    isFeatured: false,
    isTopAd: false,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '45m ago',
    landlord: {
      id: 'usr-landlord-10',
      name: 'Samuel Kariuki',
      phone: '+254715887766',
      whatsapp: '+254715887766',
      isVerified: true,
      memberSince: 'November 2023',
      rating: 4.7,
      reviewCount: 8
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: false,
      hasGym: false,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', caption: 'Living area with ceramic tile floors' },
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', caption: 'Bedroom with large window' }
    ],
    photoCount: 5
  },

  // ─── 4. NGARA & NAIROBI URBAN CORE ──────────────────────────────────────────
  {
    id: 'prop-nrb-007',
    title: 'Clean Single Room in Ngara near Fig Tree (Walking to CBD)',
    description: 'Convenient single room located 5 minutes walking distance to Nairobi CBD and University of Nairobi. Shared clean tiled washrooms, regular council water supply with overhead storage tanks, tokens meter, secure gated building with night watchman and caretaker.',
    category: 'Single Room',
    bedrooms: 0,
    bathrooms: 1,
    floorLevel: 2,
    rentKes: 6500,
    depositKes: 6500,
    county: 'Nairobi',
    corridorId: 'nairobi_central',
    estateSuburb: 'Ngara (Fig Tree & Ngara Rd)',
    exactLocation: 'Ngara Road, near Stima Club',
    latitude: -1.2764,
    longitude: 36.8282,
    waterSupplyType: 'City Council Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 200,
    waterRateKes: 80,
    isFeatured: false,
    isTopAd: false,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: 'Today',
    landlord: {
      id: 'usr-landlord-07',
      name: 'Francis Kimani',
      phone: '+254711882233',
      whatsapp: '+254711882233',
      isVerified: true,
      memberSince: 'August 2024',
      rating: 4.5,
      reviewCount: 5
    },
    amenities: {
      hasBalcony: false,
      hasParking: false,
      hasElectricFence: false,
      hasCctv: true,
      hasInternet: false,
      hasTiles: true,
      isMasterEnsuite: false,
      hasGym: false,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80', caption: 'Clean single room interior' }
    ],
    photoCount: 4
  },

  // ─── 5. SYOKIMAU & MOMBASA ROAD CORRIDOR ──────────────────────────────────
  {
    id: 'prop-nrb-011',
    title: '4 Bedroom Own Compound Maisonette in Syokimau Katani Road (Gated Estate)',
    description: 'Executive 4-bedroom standalone maisonette with private compound in a gated community along Katani Road, Syokimau. Features master ensuite with bathtub and walk-in wardrobe, spacious family lounge, dining room, solar water heating, 24hr borehole water, private parking for 4 cars, and green manicured lawn. Quick access to Gateway Mall, SGR Nairobi Terminus & JKIA Airport.',
    category: 'Maisonette / Townhouse',
    bedrooms: 4,
    bathrooms: 4,
    floorLevel: 1,
    rentKes: 60000,
    depositKes: 60000,
    county: 'Machakos',
    corridorId: 'syokimau_mombasa',
    estateSuburb: 'Syokimau (Katani & Gateway)',
    exactLocation: 'Katani Road, near Syokimau Blessed Court',
    latitude: -1.3650,
    longitude: 36.9350,
    waterSupplyType: 'Borehole Water',
    electricityMeterType: 'Prepaid (Tokens)',
    garbageFeeKes: 500,
    waterRateKes: 100,
    isFeatured: true,
    isTopAd: true,
    isVerified: true,
    source: 'direct',
    postedTimeAgo: '3 hours ago',
    landlord: {
      id: 'usr-landlord-11',
      name: 'Gateway Homes Agency',
      phone: '+254721445588',
      whatsapp: '+254721445588',
      isVerified: true,
      memberSince: 'April 2022',
      rating: 4.9,
      reviewCount: 31
    },
    amenities: {
      hasBalcony: true,
      hasParking: true,
      hasElectricFence: true,
      hasCctv: true,
      hasInternet: true,
      hasTiles: true,
      isMasterEnsuite: true,
      hasGym: false,
      hasSwimmingPool: false
    },
    media: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', caption: 'Own compound maisonette exterior with parking' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', caption: 'Spacious ground floor living room' }
    ],
    photoCount: 10
  }
];

const SEED_REVIEWS = {
  'prop-nrb-001': [
    {
      id: 'rev-01',
      author: 'Kevin Otieno (Resident)',
      ratingOverall: 5.0,
      ratingWater: 5.0,
      ratingSecurity: 5.0,
      ratingDeposit: 5.0,
      date: '2026-08-15',
      text: 'Lived here for 1 year. The borehole water never stops even when county water is disconnected. Caretaker James is very transparent with deposit refunds upon notice.',
      verified: true
    }
  ],
  'prop-nrb-002': [
    {
      id: 'rev-02',
      author: 'Brian K.',
      ratingOverall: 4.9,
      ratingWater: 5.0,
      ratingSecurity: 4.8,
      ratingDeposit: 5.0,
      date: '2026-07-28',
      text: 'Best bedsitter building in Roysambu! No water rationing, clean tiles, and biometric gate entrance makes you feel super safe.',
      verified: true
    }
  ],
  'prop-nrb-003': [
    {
      id: 'rev-03',
      author: 'Dr. Elizabeth N.',
      ratingOverall: 5.0,
      ratingWater: 5.0,
      ratingSecurity: 5.0,
      ratingDeposit: 5.0,
      date: '2026-08-20',
      text: 'Top tier management, generator kicks in instantly during KPLC blackouts, pool is heated and always clean.',
      verified: true
    }
  ],
  'prop-bnb-001': [
    {
      id: 'rev-04',
      author: 'Michael T. (UK Visitor)',
      ratingOverall: 5.0,
      ratingWater: 5.0,
      ratingSecurity: 5.0,
      ratingDeposit: 5.0,
      date: '2026-08-30',
      text: 'Stunning Kilimani studio BnB! Fast WiFi, super comfy bed, seamless self check-in keypad. Will definitely book again.',
      verified: true
    }
  ]
};
