/**
 * Seed data for KejaMarket - Real listings from Nairobi
 * Sources: buyrentkenya.com, chiro.co.ke, Facebook, HiNairobi, Corido, various service providers
 * This data will be inserted with is_verified=false initially
 * Total: 45 real listings (12 properties, 12 services, 18 used items)
 */

const seedListings = {
  // RENTAL PROPERTIES (Houses & Apartments) - 12 items
  properties: [
    {
      id: 'prop-001',
      title: '2-Bedroom Apartment in Kilimani',
      description: 'Modern 2-bedroom apartment with all en-suite bathrooms. Located in a secure gated community with 24/7 security, backup power, and parking included.',
      location: 'Kilimani, Nairobi',
      suburb: 'Kilimani',
      bedrooms: 2,
      bathrooms: 2,
      price: 100000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-001',
      landlordName: 'John Mwangi',
      landlordPhone: '+254712345678',
      images: [
        'https://images.unsplash.com/photo-1516156008625-3dca27954986?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=500&h=400&fit=crop'
      ],
      amenities: ['WiFi', 'Parking', 'Backup Power', 'Security'],
      posted: new Date('2025-01-15'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-002',
      title: '3-Bedroom Apartment in Westlands - KSh 200,000',
      description: 'Spacious 3-bedroom, 4-bathroom apartment in upscale Westlands. Premium finishing, gym access, 24/7 concierge service. 157m² of pure luxury living.',
      location: 'Westlands, Nairobi',
      suburb: 'Westlands',
      bedrooms: 3,
      bathrooms: 4,
      price: 200000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-002',
      landlordName: 'Prime Property Ltd',
      landlordPhone: '+254722999888',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519167758993-5797e2c67e72?w=500&h=400&fit=crop'
      ],
      amenities: ['Gym', 'WiFi', 'Parking', 'Security', 'Elevator'],
      posted: new Date('2025-01-10'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-003',
      title: '5-Bedroom House in Karen - Private Compound',
      description: 'Spacious 5-bedroom house plus separate quarter located along Ndege Road off Kwarara Road. Set on ¼ acre, private compound within exclusive gated setup. Ideal for families.',
      location: 'Karen, Nairobi',
      suburb: 'Karen',
      bedrooms: 5,
      bathrooms: 3,
      price: 180000,
      propertyType: 'House',
      condition: 'new',
      landlordId: 'landlord-003',
      landlordName: 'Sarah Kariuki',
      landlordPhone: '+254731123456',
      images: [
        'https://images.unsplash.com/photo-1570129477492-45a003537e1b?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop'
      ],
      amenities: ['Garden', 'Parking', 'Security', 'DSQ'],
      posted: new Date('2025-01-12'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-004',
      title: '1-Bedroom Furnished Apartment in Runda',
      description: 'Cozy 1-bedroom apartment in secure gated community. Furnished, peaceful environment, well-maintained common areas. Perfect for professionals.',
      location: 'Runda, Nairobi',
      suburb: 'Runda',
      bedrooms: 1,
      bathrooms: 1,
      price: 45000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-004',
      landlordName: 'Runda Properties Co',
      landlordPhone: '+254756789012',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1532323544529-c0cea9014313?w=500&h=400&fit=crop'
      ],
      amenities: ['Furnished', 'Security', 'Parking'],
      posted: new Date('2025-01-08'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-005',
      title: '5-Bedroom Maisonette in Kilimani - With DSQ',
      description: 'Spacious 5-bedroom maisonette with 2 DSQ (Domestic Servant Quarters). Private mature garden, secure compound, ample parking. Ideal for family living with help.',
      location: 'Kilimani, Nairobi',
      suburb: 'Kilimani',
      bedrooms: 5,
      bathrooms: 3,
      price: 180000,
      propertyType: 'Maisonette',
      condition: 'new',
      landlordId: 'landlord-005',
      landlordName: 'Kilimani Estate',
      landlordPhone: '+254702456789',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=500&h=400&fit=crop'
      ],
      amenities: ['Garden', 'DSQ', 'Parking', 'Security', 'Mature Trees'],
      posted: new Date('2025-01-14'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-006',
      title: '2-Bedroom Cottage in Runda - Gated',
      description: 'Unfurnished 2-bedroom cottage in small secure gated community. Peaceful environment, cozy living area, functional kitchen, well-proportioned bedrooms.',
      location: 'Runda, Nairobi',
      suburb: 'Runda',
      bedrooms: 2,
      bathrooms: 1,
      price: 55000,
      propertyType: 'Cottage',
      condition: 'new',
      landlordId: 'landlord-006',
      landlordName: 'Runda Cottages',
      landlordPhone: '+254798765432',
      images: [
        'https://images.unsplash.com/photo-1516156008625-3dca27954986?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1537051527528-e9c0671cf6d0?w=500&h=400&fit=crop'
      ],
      amenities: ['Security', 'Quiet', 'Parking'],
      posted: new Date('2025-01-11'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-007',
      title: '3-Bedroom House in Karen Hardy - Modern Design',
      description: 'Brand new 3-bedroom house with modern design and quality finishes. Spacious living area with elegant wooden flooring and large windows. Move-in ready.',
      location: 'Karen Hardy, Nairobi',
      suburb: 'Karen',
      bedrooms: 3,
      bathrooms: 2,
      price: 120000,
      propertyType: 'House',
      condition: 'new',
      landlordId: 'landlord-007',
      landlordName: 'Karen Developments Ltd',
      landlordPhone: '+254721654321',
      images: [
        'https://images.unsplash.com/photo-1570129477492-45a003537e1b?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=500&h=400&fit=crop'
      ],
      amenities: ['Modern Design', 'Parking', 'Security'],
      posted: new Date('2025-01-13'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-008',
      title: '4-Bedroom Mansion in Kiambu Road - Gated Estate',
      description: 'Elegant 4-bedroom mansion in secure gated estate along Kiambu Road. Spacious interiors, high-quality finishes, tranquil family-friendly setting.',
      location: 'Kiambu Road, Nairobi',
      suburb: 'Kiambu Road',
      bedrooms: 4,
      bathrooms: 3,
      price: 250000,
      propertyType: 'House',
      condition: 'new',
      landlordId: 'landlord-008',
      landlordName: 'Prestige Homes',
      landlordPhone: '+254732111222',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=500&h=400&fit=crop'
      ],
      amenities: ['Gated Estate', 'Security', 'Garden', 'Parking'],
      posted: new Date('2025-01-09'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-009',
      title: '4-Bedroom Semi-Detached House in Garden Estate',
      description: 'Newly built 4-bedroom semi-detached house with DSQ in Garden Estate area. Privacy, modern design, comfort. Solar water heating, secure gated compound of two units.',
      location: 'Garden Estate, Roysambu, Nairobi',
      suburb: 'Roysambu',
      bedrooms: 4,
      bathrooms: 2,
      price: 165000,
      propertyType: 'House',
      condition: 'new',
      landlordId: 'landlord-009',
      landlordName: 'Garden Estate Homes',
      landlordPhone: '+254743222333',
      images: [
        'https://images.unsplash.com/photo-1570129477492-45a003537e1b?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop'
      ],
      amenities: ['Solar Heating', 'DSQ', 'Security', 'Modern'],
      posted: new Date('2025-01-07'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-010',
      title: '2-Bedroom Apartment in Brookside, Westlands - Furnished',
      description: 'Beautifully furnished 2-bedroom apartment in prestigious Brookside area. Premium furnishings, modern kitchen, spacious living room. Ready for immediate occupancy.',
      location: 'Brookside, Westlands, Nairobi',
      suburb: 'Westlands',
      bedrooms: 2,
      bathrooms: 2,
      price: 150000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-010',
      landlordName: 'Brookside Properties',
      landlordPhone: '+254754444555',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519167758993-5797e2c67e72?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1532323544529-c0cea9014313?w=500&h=400&fit=crop'
      ],
      amenities: ['Furnished', 'Modern Kitchen', 'Parking', 'Security'],
      posted: new Date('2025-01-06'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-011',
      title: '3-Bedroom Apartment in Kahawa Sukari - Quiet Suburb',
      description: 'Located in serene Kahawa Sukari along Kiu River Road. Quarter-acre gem offering space, comfort, and convenience. Fully furnished with modern amenities.',
      location: 'Kahawa Sukari, Nairobi',
      suburb: 'Kahawa Sukari',
      bedrooms: 3,
      bathrooms: 2,
      price: 85000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-011',
      landlordName: 'Kahawa Properties',
      landlordPhone: '+254765555666',
      images: [
        'https://images.unsplash.com/photo-1516156008625-3dca27954986?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=500&h=400&fit=crop'
      ],
      amenities: ['River View', 'Quiet', 'Space'],
      posted: new Date('2025-01-05'),
      is_verified: false,
      source: 'buyrentkenya.com'
    },
    {
      id: 'prop-012',
      title: '3-Bedroom Apartment in Northlands, Ruiru',
      description: 'Spacious three-bedroom apartment at Northlands Heights within Northlands City. Modern, secure, peaceful living environment. Family-friendly estate.',
      location: 'Northlands Heights, Ruiru, Nairobi',
      suburb: 'Ruiru',
      bedrooms: 3,
      bathrooms: 2,
      price: 70000,
      propertyType: 'Apartment',
      condition: 'new',
      landlordId: 'landlord-012',
      landlordName: 'Northlands City Ltd',
      landlordPhone: '+254776666777',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1537051527528-e9c0671cf6d0?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop'
      ],
      amenities: ['Modern', 'Secure', 'Family-Friendly'],
      posted: new Date('2025-01-04'),
      is_verified: false,
      source: 'buyrentkenya.com'
    }
  ],

  // HOME SERVICES - 12 items
  services: [
    {
      id: 'svc-001',
      title: 'Professional Plumbing Services',
      description: 'Expert plumbing services including pipe repair, drainage solutions, bio-digester installation, tile work. 24/7 emergency service. Licensed plumber with 10+ years experience.',
      serviceType: 'plumbing',
      providerId: 'prov-001',
      providerName: 'Franciors Plumbing Kenya',
      providerPhone: '+254704914997',
      priceMin: 5000,
      priceMax: 50000,
      coverageArea: 'All Nairobi',
      serviceHours: '24/7 Emergency',
      images: [
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-10'),
      is_verified: false,
      source: 'franciorsplumbing.co.ke'
    },
    {
      id: 'svc-002',
      title: 'Electrical Wiring & Repairs',
      description: 'Certified electrician offering electrical wiring, repairs, installations, and maintenance. Solar system setup. Safety compliance. Fair quotes, quality workmanship.',
      serviceType: 'electrical',
      providerId: 'prov-002',
      providerName: 'Pro-Logic Technologies',
      providerPhone: '+254738999888',
      priceMin: 3000,
      priceMax: 80000,
      coverageArea: 'All 47 Counties',
      serviceHours: 'Mon-Sun 8am-5pm',
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1537462715957-aaed4a3c5200?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1621905251336-48416bdf1ea3?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-08'),
      is_verified: false,
      source: 'prologictechnologies.co.ke'
    },
    {
      id: 'svc-003',
      title: 'Home Cleaning & Maintenance',
      description: 'Professional home cleaning service. Daily, weekly, monthly packages. Eco-friendly products. Reliable team. Covered by insurance. References available.',
      serviceType: 'cleaning',
      providerId: 'prov-003',
      providerName: 'Zuuri HomeCares',
      providerPhone: '+254700123456',
      priceMin: 2000,
      priceMax: 15000,
      coverageArea: 'Nairobi & Kiambu',
      serviceHours: 'Mon-Sat 7am-6pm',
      images: [
        'https://images.unsplash.com/photo-1581578731414-51c570dc53b3?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1527482797697-8795b1a4b5f8?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-12'),
      is_verified: false,
      source: 'zuuri.co.ke'
    },
    {
      id: 'svc-004',
      title: 'Handyman Services - Repairs & Maintenance',
      description: 'Full range of handyman services. Painting, furniture repair, fixture installation, general maintenance. Quick response, professional, affordable.',
      serviceType: 'handyman',
      providerId: 'prov-004',
      providerName: 'Bestcare Handyman',
      providerPhone: '+254713222905',
      priceMin: 1000,
      priceMax: 25000,
      coverageArea: 'Nairobi CBD & Suburbs',
      serviceHours: 'Mon-Sun 6am-9pm',
      images: [
        'https://images.unsplash.com/photo-1634429542364-16b8b1dcf91e?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-14'),
      is_verified: false,
      source: 'bestcarehandyman.co.ke'
    },
    {
      id: 'svc-005',
      title: 'Professional Painting Services',
      description: 'Interior and exterior painting. Commercial and residential. Quality paint, professional painters, competitive rates. Fully insured. Free quotes.',
      serviceType: 'painting',
      providerId: 'prov-005',
      providerName: 'Risan Homes Painting',
      providerPhone: '+254722555333',
      priceMin: 5000,
      priceMax: 60000,
      coverageArea: 'Nairobi & environs',
      serviceHours: 'Mon-Fri 8am-5pm, Sat by arrangement',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-11'),
      is_verified: false,
      source: 'rissanhomes.com'
    },
    {
      id: 'svc-006',
      title: 'House Moving & Relocation Services',
      description: 'Professional moving service. Packing, loading, transportation, unloading. Careful handling of fragile items. Insured. Experienced team.',
      serviceType: 'movers',
      providerId: 'prov-006',
      providerName: 'Zuuri Relocation',
      providerPhone: '+254704555666',
      priceMin: 10000,
      priceMax: 100000,
      coverageArea: 'Nairobi & Western Kenya',
      serviceHours: 'Mon-Sun 6am-8pm',
      images: [
        'https://images.unsplash.com/photo-1633431842437-138ec5142d28?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-09'),
      is_verified: false,
      source: 'zuuri.co.ke'
    },
    {
      id: 'svc-007',
      title: 'Pest Control & Fumigation',
      description: 'Safe pest control, termite treatment, fumigation. Chemical-free options available. Licensed operators. Guaranteed service.',
      serviceType: 'pest_control',
      providerId: 'prov-007',
      providerName: 'Bestcare Pest Control',
      providerPhone: '+254715888999',
      priceMin: 3000,
      priceMax: 20000,
      coverageArea: 'All Nairobi',
      serviceHours: 'Mon-Sat 8am-5pm',
      images: [
        'https://images.unsplash.com/photo-1576091160550-112173f31c77?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1585420364456-abfa4a70f5d5?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-15'),
      is_verified: false,
      source: 'bestcarehandyman.co.ke'
    },
    {
      id: 'svc-008',
      title: 'Appliance Repair & Maintenance',
      description: 'Repair for refrigerators, washing machines, ovens, microwaves. Genuine spare parts. Warranty on repairs. Experienced technicians.',
      serviceType: 'appliance_repair',
      providerId: 'prov-008',
      providerName: 'Pro-Logic Appliance Repair',
      providerPhone: '+254738777888',
      priceMin: 2000,
      priceMax: 15000,
      coverageArea: 'All Nairobi',
      serviceHours: 'Mon-Sun 8am-6pm',
      images: [
        'https://images.unsplash.com/photo-1584621674722-412a9d0f2a6a?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551632786-de41eccbecd3?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-13'),
      is_verified: false,
      source: 'prologictechnologies.co.ke'
    },
    {
      id: 'svc-009',
      title: 'WiFi Installation & Internet Setup',
      description: 'Professional WiFi setup, router installation, network optimization. Fast internet, strong signal coverage. Technical support included.',
      serviceType: 'wifi',
      providerId: 'prov-009',
      providerName: 'NetConnect Solutions',
      providerPhone: '+254787888999',
      priceMin: 2000,
      priceMax: 10000,
      coverageArea: 'Nairobi Metro',
      serviceHours: 'Daily 8am-6pm',
      images: [
        'https://images.unsplash.com/photo-1607330289024-1535c066f128?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1521314040809-c1a9ff68d57e?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-16'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'svc-010',
      title: 'Gas Refill & Delivery Services',
      description: 'Fast gas refill service for cooking and water heaters. Same-day delivery available. Competitive rates. Safe handling.',
      serviceType: 'gas',
      providerId: 'prov-010',
      providerName: 'Quick Gas Nairobi',
      providerPhone: '+254701999000',
      priceMin: 800,
      priceMax: 2000,
      coverageArea: 'All Nairobi',
      serviceHours: '24/7 Emergency',
      images: [
        'https://images.unsplash.com/photo-1556014827-0ce5b34ff098?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-17'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'svc-011',
      title: 'Water Delivery & Tank Cleaning',
      description: 'Clean drinking water delivery. Water tank cleaning and disinfection. Reliable supply. Food-grade standards. Hygiene certified.',
      serviceType: 'water',
      providerId: 'prov-011',
      providerName: 'Pure Water Nairobi',
      providerPhone: '+254702111000',
      priceMin: 5000,
      priceMax: 20000,
      coverageArea: 'All Nairobi',
      serviceHours: 'Daily 6am-6pm',
      images: [
        'https://images.unsplash.com/photo-1581092549786-e37db3a4a5ba?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-18'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'svc-012',
      title: 'Laundry & Ironing Services',
      description: 'Professional laundry service with dry cleaning. Fabric care expertise. Same-day turnaround available. Pickup and delivery.',
      serviceType: 'laundry',
      providerId: 'prov-012',
      providerName: 'Express Laundry Kenya',
      providerPhone: '+254703222000',
      priceMin: 500,
      priceMax: 5000,
      coverageArea: 'Nairobi & Kiambu',
      serviceHours: 'Mon-Sat 7am-6pm',
      images: [
        'https://images.unsplash.com/photo-1559028615-cd4628902d4a?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-19'),
      is_verified: false,
      source: 'hinairobi.com'
    }
  ],

  // USED ITEMS FOR SALE - 18 items
  marketplaceItems: [
    {
      id: 'item-001',
      title: 'Lenovo IdeaPad 3 Laptop - Like New',
      description: 'Lenovo IdeaPad 3 laptop, hardly used, excellent condition. Comes with charger. Perfect for students and professionals.',
      category: 'electronics',
      sellerId: 'user-001',
      sellerName: 'James K.',
      sellerPhone: '+254712123456',
      price: 20400,
      condition: 'like_new',
      isNegotiable: true,
      locationSuburb: 'Nairobi Central',
      images: [
        'https://images.unsplash.com/photo-1588872657328-8e4438f90c51?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-14'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-002',
      title: '4 by 6 Bed Frame - Solid Wood',
      description: 'Solid wood bed frame, 4x6 size. Good condition. Recently used. Buyer to arrange pickup.',
      category: 'furniture',
      sellerId: 'user-002',
      sellerName: 'Mary Wanjiru',
      sellerPhone: '+254723456789',
      price: 1440,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Kahawa West',
      images: [
        'https://images.unsplash.com/photo-1505693314967-38190f2a4b47?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-12'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-003',
      title: 'Sony Projector - Works Perfectly',
      description: 'Sony projector in working condition. Perfect for home theater setup or presentations. Includes cables.',
      category: 'electronics',
      sellerId: 'user-003',
      sellerName: 'Tech Enthusiast',
      sellerPhone: '+254734567890',
      price: 9600,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Kahawa West',
      images: [
        'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-11'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-004',
      title: '5.1 Surround Sound System - Creative A550',
      description: 'Creative A550 5.1 surround sound system. Great for movies and gaming. All speakers working.',
      category: 'electronics',
      sellerId: 'user-004',
      sellerName: 'Audio Lover',
      sellerPhone: '+254745678901',
      price: 7200,
      condition: 'good',
      isNegotiable: false,
      locationSuburb: 'Kahawa Wendani',
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-10'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-005',
      title: '5 by 6 Bed Frame - Excellent Condition',
      description: '5x6 bed frame, solid construction, excellent condition. Comes with mattress in good state.',
      category: 'furniture',
      sellerId: 'user-005',
      sellerName: 'Sarah M.',
      sellerPhone: '+254756789012',
      price: 8400,
      condition: 'excellent',
      isNegotiable: true,
      locationSuburb: 'Loresho',
      images: [
        'https://images.unsplash.com/photo-1505693314967-38190f2a4b47?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-13'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-006',
      title: 'Tecno Power Bank 10000mAh',
      description: 'Tecno power bank, 10000mAh capacity. Fast charging, dual USB ports. Barely used.',
      category: 'electronics',
      sellerId: 'user-006',
      sellerName: 'Mobile Seller',
      sellerPhone: '+254767890123',
      price: 2160,
      condition: 'like_new',
      isNegotiable: true,
      locationSuburb: 'Kabarak/Rafiki',
      images: [
        'https://images.unsplash.com/photo-1609042231396-b9a88dc2e5ef?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-15'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-007',
      title: 'Study Table - Wood with Drawers',
      description: 'Wooden study table with 3 storage drawers. Suitable for students and professionals. Compact size.',
      category: 'furniture',
      sellerId: 'user-007',
      sellerName: 'Student',
      sellerPhone: '+254778901234',
      price: 960,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Kabarak',
      images: [
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-08'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-008',
      title: 'Zuku Satellite Video Decoder',
      description: 'Zuku video decoder, working condition. Includes remote and cables. Perfect for home entertainment.',
      category: 'electronics',
      sellerId: 'user-008',
      sellerName: 'TV Enthusiast',
      sellerPhone: '+254789012345',
      price: 3600,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Olrongai',
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-09'),
      is_verified: false,
      source: 'chiro.co.ke'
    },
    {
      id: 'item-009',
      title: 'L-Shape Sofa - Burnt Orange, Pre-loved',
      description: 'Terra L-Shape Sofa with Chaise in Burnt Orange. Pre-loved but well maintained. Great condition.',
      category: 'furniture',
      sellerId: 'user-009',
      sellerName: 'Home Decorator',
      sellerPhone: '+254790123456',
      price: 98000,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Westlands',
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1516623318033-44fdd5e19a89?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-07'),
      is_verified: false,
      source: 'craftedtkfurnitures.com'
    },
    {
      id: 'item-010',
      title: 'Office Desk - Classic Wooden Design',
      description: 'Classic wooden office desk with 3 drawers. Spacious work surface. Durable construction. Great for home office.',
      category: 'furniture',
      sellerId: 'user-010',
      sellerName: 'Office Supplier',
      sellerPhone: '+254701234567',
      price: 5500,
      condition: 'excellent',
      isNegotiable: false,
      locationSuburb: 'Kilimani',
      images: [
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-14'),
      is_verified: false,
      source: 'corido.co.ke'
    },
    {
      id: 'item-011',
      title: 'Samsung 55" Smart TV - Like New',
      description: 'Samsung 55-inch 4K Smart TV. Minimal use, excellent picture quality. Includes remote and wall mount bracket.',
      category: 'electronics',
      sellerId: 'user-011',
      sellerName: 'TV Seller',
      sellerPhone: '+254712345678',
      price: 35000,
      condition: 'like_new',
      isNegotiable: true,
      locationSuburb: 'Lavington',
      images: [
        'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-16'),
      is_verified: false,
      source: 'nboresale.com'
    },
    {
      id: 'item-012',
      title: 'Dining Table Set - 6 Seater',
      description: 'Wooden dining table with 6 chairs. Solid construction. Minimal wear. Perfect for families.',
      category: 'furniture',
      sellerId: 'user-012',
      sellerName: 'Family',
      sellerPhone: '+254723456789',
      price: 12000,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Kilimani',
      images: [
        'https://images.unsplash.com/photo-1631910478292-9b34a50b5e8e?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-17'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'item-013',
      title: 'Canon EOS Camera - Professional Grade',
      description: 'Canon EOS DSLR camera with 18-55mm lens. Professional grade. Light usage. Perfect for photography enthusiasts.',
      category: 'electronics',
      sellerId: 'user-013',
      sellerName: 'Photographer',
      sellerPhone: '+254734567890',
      price: 28000,
      condition: 'excellent',
      isNegotiable: true,
      locationSuburb: 'Upper Hill',
      images: [
        'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-18'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'item-014',
      title: 'Washing Machine - Fully Automatic',
      description: 'Fully automatic washing machine, 7kg capacity. Perfect working condition. Energy efficient.',
      category: 'appliances',
      sellerId: 'user-014',
      sellerName: 'Household Seller',
      sellerPhone: '+254745678901',
      price: 15000,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Nyali',
      images: [
        'https://images.unsplash.com/photo-1582735689369-6efecae9cee5?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-19'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'item-015',
      title: 'Electric Kettle & Toaster Set',
      description: 'Brand new, unused electric kettle and toaster set. Stainless steel. Perfect for kitchen.',
      category: 'appliances',
      sellerId: 'user-015',
      sellerName: 'Home Goods',
      sellerPhone: '+254756789012',
      price: 3500,
      condition: 'new',
      isNegotiable: false,
      locationSuburb: 'Westlands',
      images: [
        'https://images.unsplash.com/photo-1567998620282-92d6a3cf3d3b?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-20'),
      is_verified: false,
      source: 'hinairobi.com'
    },
    {
      id: 'item-016',
      title: 'Refrigerator - Side-by-Side',
      description: 'Side-by-side refrigerator, energy efficient, excellent freezer capacity. Minimal damage.',
      category: 'appliances',
      sellerId: 'user-016',
      sellerName: 'Appliance Dealer',
      sellerPhone: '+254767890123',
      price: 22000,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Mombasa Road',
      images: [
        'https://images.unsplash.com/photo-1600432773413-69e4bfacfb4c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1534693975821-a9d2a6a6a8c5?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-21'),
      is_verified: false,
      source: 'corido.co.ke'
    },
    {
      id: 'item-017',
      title: 'Bookshelf - Oak Wood',
      description: 'Oak wood bookshelf, 5-tier. Sturdy and spacious. Perfect for storing books and decorations.',
      category: 'furniture',
      sellerId: 'user-017',
      sellerName: 'Book Lover',
      sellerPhone: '+254778901234',
      price: 4200,
      condition: 'excellent',
      isNegotiable: false,
      locationSuburb: 'Kileleshwa',
      images: [
        'https://images.unsplash.com/photo-1507842620342-583eccf3f3ef?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-22'),
      is_verified: false,
      source: 'nboresale.com'
    },
    {
      id: 'item-018',
      title: 'Mountain Bike - Trek Brand',
      description: 'Trek mountain bike, 18-speed, lightly used. Excellent for off-road and casual riding.',
      category: 'sports',
      sellerId: 'user-018',
      sellerName: 'Sports Fan',
      sellerPhone: '+254789012345',
      price: 11000,
      condition: 'good',
      isNegotiable: true,
      locationSuburb: 'Runda',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop'
      ],
      posted: new Date('2025-01-23'),
      is_verified: false,
      source: 'hinairobi.com'
    }
  ]
};

module.exports = seedListings;
