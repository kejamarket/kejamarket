/**
 * Seed Real Service Provider Data & Accounts for KejaMarket
 * Includes Top Providers:
 * - Safaricom Home Fiber
 * - Zuku Fiber Kenya
 * - Faiba 4G (Jamii Telecom)
 * - Airtel Home Broadband
 * - Nellions Moving & Relocations
 * - Taylor Movers Kenya
 * - SparkleClean Services
 * - CleanPro Kenya
 */

const SEED_SERVICE_PROVIDERS = [
  {
    user: {
      id: 'prov-safaricom-01',
      name: 'Safaricom Home Fibre',
      phone: '0800720100',
      email: 'homefibre@safaricom.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.9,
      area: 'All Nairobi'
    },
    service: {
      id: 'svc-safaricom-fibre',
      title: 'Safaricom Home Fibre & 5G Router',
      description: 'Ultra-fast unlimited home fibre internet. Packages from 10Mbps (KES 2,999) to 100Mbps (KES 12,499). Free installation and router included.',
      serviceType: 'Safaricom Fibre',
      service_type: 'Safaricom Fibre',
      providerId: 'prov-safaricom-01',
      provider_id: 'prov-safaricom-01',
      providerName: 'Safaricom Home Fibre',
      provider_name: 'Safaricom Home Fibre',
      providerPhone: '0800720100',
      provider_phone: '0800720100',
      priceMin: 2999,
      priceMax: 12499,
      coverageArea: 'All Nairobi, Ruaka, Kilimani, Westlands, Roysambu, South B, Karen, Ngong Rd',
      coverage_area: 'All Nairobi, Ruaka, Kilimani, Westlands, Roysambu, South B, Karen, Ngong Rd',
      serviceHours: '24/7 Technical Support',
      service_hours: '24/7 Technical Support',
      images: [
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.9,
      review_count: 142
    }
  },
  {
    user: {
      id: 'prov-zuku-01',
      name: 'Zuku Fiber Kenya',
      phone: '0800723001',
      email: 'support@zuku.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.6,
      area: 'Nairobi & Mombasa'
    },
    service: {
      id: 'svc-zuku-fibre',
      title: 'Zuku Triple Play Fibre & Digital TV',
      description: 'High-speed unlimited fibre internet bundled with 60+ digital TV channels and free local calls. Packages from 20Mbps (KES 2,799) to 60Mbps.',
      serviceType: 'Zuku Fibre',
      service_type: 'Zuku Fibre',
      providerId: 'prov-zuku-01',
      provider_id: 'prov-zuku-01',
      providerName: 'Zuku Fiber Kenya',
      provider_name: 'Zuku Fiber Kenya',
      providerPhone: '0800723001',
      provider_phone: '0800723001',
      priceMin: 2799,
      priceMax: 5999,
      coverageArea: 'Nairobi, Kilimani, Westlands, Parklands, South C, Ngong Rd, Kileleshwa',
      coverage_area: 'Nairobi, Kilimani, Westlands, Parklands, South C, Ngong Rd, Kileleshwa',
      serviceHours: 'Mon-Sun 8am-8pm',
      service_hours: 'Mon-Sun 8am-8pm',
      images: [
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.6,
      review_count: 88
    }
  },
  {
    user: {
      id: 'prov-faiba-01',
      name: 'Faiba 4G / Jamii Telecom',
      phone: '0747000200',
      email: 'customercare@jtl.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.7,
      area: 'Nairobi Metro'
    },
    service: {
      id: 'svc-faiba-fibre',
      title: 'Faiba High-Speed Pure Optic Fibre',
      description: 'Lightning-fast pure optic fibre for heavy streaming, work-from-home, and gaming. 30Mbps to 125Mbps unlimited speeds. Zero throttling.',
      serviceType: 'Jamii Telecom (Faiba)',
      service_type: 'Jamii Telecom (Faiba)',
      providerId: 'prov-faiba-01',
      provider_id: 'prov-faiba-01',
      providerName: 'Faiba 4G (Jamii Telecom)',
      provider_name: 'Faiba 4G (Jamii Telecom)',
      providerPhone: '0747000200',
      provider_phone: '0747000200',
      priceMin: 5000,
      priceMax: 20000,
      coverageArea: 'Nairobi, Westlands, Kilimani, Upper Hill, CBD, Ruaka, Roysambu',
      coverage_area: 'Nairobi, Westlands, Kilimani, Upper Hill, CBD, Ruaka, Roysambu',
      serviceHours: '24/7 Support',
      service_hours: '24/7 Support',
      images: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.7,
      review_count: 95
    }
  },
  {
    user: {
      id: 'prov-airtel-01',
      name: 'Airtel Home Broadband',
      phone: '0733001001',
      email: 'broadband@ke.airtel.com',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.5,
      area: 'Kenya Wide'
    },
    service: {
      id: 'svc-airtel-broadband',
      title: 'Airtel 5G Unlimited Home Router',
      description: 'Plug-and-play high-speed 5G wireless home internet. No trenching required. Unlimited monthly plans starting at KES 3,500.',
      serviceType: 'Airtel 4G/5G Internet',
      service_type: 'Airtel 4G/5G Internet',
      providerId: 'prov-airtel-01',
      provider_id: 'prov-airtel-01',
      providerName: 'Airtel Home Broadband',
      provider_name: 'Airtel Home Broadband',
      providerPhone: '0733001001',
      provider_phone: '0733001001',
      priceMin: 3500,
      priceMax: 7500,
      coverageArea: 'All Nairobi, Kenya Wide, Ruaka, Roysambu, Westlands, Rongai, Syokimau',
      coverage_area: 'All Nairobi, Kenya Wide, Ruaka, Roysambu, Westlands, Rongai, Syokimau',
      serviceHours: '24/7 Support',
      service_hours: '24/7 Support',
      images: [
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.5,
      review_count: 64
    }
  },
  {
    user: {
      id: 'prov-nellions-01',
      name: 'Nellions Moving & Relocations',
      phone: '0700000002',
      email: 'move@nellions.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.9,
      area: 'Nairobi & Kiambu'
    },
    service: {
      id: 'svc-nellions-movers',
      title: 'Nellions Premium House Moving & Storage',
      description: 'Kenya’s premier licensed relocation partner. Full packing, crating of delicate electronics, furniture disassembly & setup, goods-in-transit insurance included.',
      serviceType: 'House Moving & Relocations',
      service_type: 'House Moving & Relocations',
      providerId: 'prov-nellions-01',
      provider_id: 'prov-nellions-01',
      providerName: 'Nellions Moving & Relocations',
      provider_name: 'Nellions Moving & Relocations',
      providerPhone: '0700000002',
      provider_phone: '0700000002',
      priceMin: 12000,
      priceMax: 85000,
      coverageArea: 'All Nairobi, Ruaka, Westlands, Kilimani, Karen, Lavington, Kiambu Rd',
      coverage_area: 'All Nairobi, Ruaka, Westlands, Kilimani, Karen, Lavington, Kiambu Rd',
      serviceHours: 'Mon-Sun 7am-7pm',
      service_hours: 'Mon-Sun 7am-7pm',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581578731414-51c570dc53b3?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.9,
      review_count: 156
    }
  },
  {
    user: {
      id: 'prov-taylor-01',
      name: 'Taylor Movers Kenya',
      phone: '0718160622',
      email: 'info@taylormovers.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.8,
      area: 'Kenya & International'
    },
    service: {
      id: 'svc-taylor-movers',
      title: 'Taylor Movers Home Relocations & Packing',
      description: 'Stress-free moving across Nairobi and nationwide. Professional movers, bubble wrapping, heavy lifting, TV wall mounting, and clean truck fleet.',
      serviceType: 'House Moving & Relocations',
      service_type: 'House Moving & Relocations',
      providerId: 'prov-taylor-01',
      provider_id: 'prov-taylor-01',
      providerName: 'Taylor Movers Kenya',
      provider_name: 'Taylor Movers Kenya',
      providerPhone: '0718160622',
      provider_phone: '0718160622',
      priceMin: 10000,
      priceMax: 70000,
      coverageArea: 'All Nairobi, Westlands, Kilimani, Roysambu, South B, Ruaka, Rongai',
      coverage_area: 'All Nairobi, Westlands, Kilimani, Roysambu, South B, Ruaka, Rongai',
      serviceHours: 'Mon-Sun 6am-8pm',
      service_hours: 'Mon-Sun 6am-8pm',
      images: [
        'https://images.unsplash.com/photo-1633431842437-138ec5142d28?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.8,
      review_count: 124
    }
  },
  {
    user: {
      id: 'prov-sparkle-01',
      name: 'SparkleClean Services',
      phone: '0744555666',
      email: 'sparkle@clean.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.8,
      area: 'Nairobi Metro'
    },
    service: {
      id: 'svc-sparkle-clean',
      title: 'Deep House Move-In & Move-Out Cleaning',
      description: 'Thorough post-tenancy cleaning, tile scrubbing, kitchen grease removal, carpet shampooing, window polishing, and disinfectant fumigation.',
      serviceType: 'Cleaning Services',
      service_type: 'Cleaning Services',
      providerId: 'prov-sparkle-01',
      provider_id: 'prov-sparkle-01',
      providerName: 'SparkleClean Services',
      provider_name: 'SparkleClean Services',
      providerPhone: '0744555666',
      provider_phone: '0744555666',
      priceMin: 2500,
      priceMax: 18000,
      coverageArea: 'Nairobi Metro, Ruaka, Westlands, Kilimani, Roysambu, South B, Karen',
      coverage_area: 'Nairobi Metro, Ruaka, Westlands, Kilimani, Roysambu, South B, Karen',
      serviceHours: 'Mon-Sat 7am-6pm',
      service_hours: 'Mon-Sat 7am-6pm',
      images: [
        'https://images.unsplash.com/photo-1581578731414-51c570dc53b3?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.8,
      review_count: 92
    }
  },
  {
    user: {
      id: 'prov-cleanpro-01',
      name: 'CleanPro Kenya',
      phone: '0722111222',
      email: 'info@cleanpro.co.ke',
      role: 'service',
      isVerified: true,
      is_verified: true,
      rating: 4.7,
      area: 'Nairobi Environs'
    },
    service: {
      id: 'svc-cleanpro-kenya',
      title: 'Professional Sofa, Carpet & Home Cleaning',
      description: 'Specialized industrial steam extraction for fabric sofas, mattresses, and wool carpets. Removes tough stains, dust mites, and pet odors.',
      serviceType: 'Cleaning Services',
      service_type: 'Cleaning Services',
      providerId: 'prov-cleanpro-01',
      provider_id: 'prov-cleanpro-01',
      providerName: 'CleanPro Kenya',
      provider_name: 'CleanPro Kenya',
      providerPhone: '0722111222',
      provider_phone: '0722111222',
      priceMin: 2000,
      priceMax: 15000,
      coverageArea: 'All Nairobi, Westlands, Kilimani, Ruaka, Thika Road, South C',
      coverage_area: 'All Nairobi, Westlands, Kilimani, Ruaka, Thika Road, South C',
      serviceHours: 'Mon-Sun 8am-6pm',
      service_hours: 'Mon-Sun 8am-6pm',
      images: [
        'https://images.unsplash.com/photo-1527482797697-8795b1a4b5f8?w=500&h=400&fit=crop'
      ],
      is_verified: true,
      isVerified: true,
      status: 'active',
      provider_rating: 4.7,
      review_count: 78
    }
  }
];

async function seedServiceProviders(store) {
  try {
    console.log('[Seed] Seeding service providers & services...');

    // 1. If store has Postgres query method
    if (store && typeof store.query === 'function') {
      for (const item of SEED_SERVICE_PROVIDERS) {
        // Upsert user
        await store.query(`
          INSERT INTO users (id, name, phone, email, role, is_verified, rating, area)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            is_verified = EXCLUDED.is_verified,
            area = EXCLUDED.area
        `, [item.user.id, item.user.name, item.user.phone, item.user.email, item.user.role, true, item.user.rating, item.user.area]);

        // Upsert service
        await store.query(`
          INSERT INTO services (
            id, title, description, service_type, provider_id, provider_name,
            provider_phone, provider_rating, review_count, price_min, price_max,
            is_verified, coverage_area, service_hours, images, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            service_type = EXCLUDED.service_type,
            provider_name = EXCLUDED.provider_name,
            provider_phone = EXCLUDED.provider_phone,
            price_min = EXCLUDED.price_min,
            price_max = EXCLUDED.price_max,
            is_verified = true,
            coverage_area = EXCLUDED.coverage_area,
            service_hours = EXCLUDED.service_hours,
            status = 'active'
        `, [
          item.service.id,
          item.service.title,
          item.service.description,
          item.service.serviceType,
          item.service.providerId,
          item.service.providerName,
          item.service.providerPhone,
          item.service.provider_rating,
          item.service.review_count,
          item.service.priceMin,
          item.service.priceMax,
          true,
          item.service.coverageArea,
          item.service.serviceHours,
          JSON.stringify(item.service.images),
          'active'
        ]);
      }
      console.log('[Seed] Postgres services seeded successfully.');
    }

    // 2. Also ensure JSON store (data.json) has them and all services are verified
    if (store && store.data) {
      if (!Array.isArray(store.data.users)) store.data.users = [];
      if (!Array.isArray(store.data.services)) store.data.services = [];

      for (const item of SEED_SERVICE_PROVIDERS) {
        // User
        const userIdx = store.data.users.findIndex(u => u.id === item.user.id || u.phone === item.user.phone);
        if (userIdx >= 0) {
          store.data.users[userIdx] = { ...store.data.users[userIdx], ...item.user };
        } else {
          store.data.users.push(item.user);
        }

        // Service
        const svcIdx = store.data.services.findIndex(s => s.id === item.service.id);
        if (svcIdx >= 0) {
          store.data.services[svcIdx] = { ...store.data.services[svcIdx], ...item.service };
        } else {
          store.data.services.unshift(item.service);
        }
      }

      // Ensure all other existing services are also verified
      store.data.services.forEach(s => {
        s.is_verified = true;
        s.isVerified = true;
        s.status = 'active';
      });

      if (typeof store.save === 'function') {
        store.save();
      }
      console.log('[Seed] JSON store services updated and verified.');
    }

    return true;
  } catch (err) {
    console.error('[Seed] Service providers seed error:', err.message);
    return false;
  }
}

module.exports = {
  SEED_SERVICE_PROVIDERS,
  seedServiceProviders
};
