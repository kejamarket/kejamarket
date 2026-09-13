const { Pool } = require('pg');
const crypto = require('crypto');

// Simple UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = crypto.randomBytes(1)[0] % 16;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const services = [
  {
    title: 'Nellions Moving & Relocations - Professional Movers',
    description: 'Quality house moving, office moving, international moving and storage services. Member of IAM with over 9 years of experience. Trusted by families, corporations and NGOs across Kenya.',
    service_type: 'moving',
    provider_id: 'PROV001',
    provider_name: 'Nellions Relocations Ltd',
    provider_phone: '0700000002',
    provider_rating: 4.8,
    review_count: 156,
    price_min: 15000,
    price_max: 150000,
    is_verified: true,
    coverage_area: 'Nairobi, Kiambu, Machakos',
    service_hours: 'Mon-Sat 7am-7pm, Sun 8am-5pm',
    status: 'active'
  },
  {
    title: 'Access Movers Kenya - Office & Home Relocation',
    description: 'Professional office movers in Nairobi Kenya. We handle your office moving needs with minimum disruption to your working schedule. Residential and commercial moving services available.',
    service_type: 'moving',
    provider_id: 'PROV002',
    provider_name: 'Access Movers Kenya',
    provider_phone: '0722000111',
    provider_rating: 4.7,
    review_count: 98,
    price_min: 12000,
    price_max: 120000,
    is_verified: true,
    coverage_area: 'Nairobi CBD, Westlands, Kilimani',
    service_hours: 'Mon-Fri 8am-6pm, Sat 9am-4pm',
    status: 'active'
  },
  {
    title: 'Prime Movers - Affordable Moving Services',
    description: 'Reliable and affordable moving services in Nairobi. We offer house moving, office relocation, and storage solutions. Experienced team with proper equipment.',
    service_type: 'moving',
    provider_id: 'PROV003',
    provider_name: 'Prime Movers',
    provider_phone: '0715296624',
    provider_rating: 4.5,
    review_count: 72,
    price_min: 8000,
    price_max: 80000,
    is_verified: false,
    coverage_area: 'Nairobi',
    service_hours: 'Daily 7am-6pm',
    status: 'active'
  },
  {
    title: 'Kelly Movers Limited - Professional Relocation',
    description: 'Trusted moving and storage service provider in Nairobi. Professional packing, loading, transportation and unpacking services. Insured moves for your peace of mind.',
    service_type: 'moving',
    provider_id: 'PROV004',
    provider_name: 'Kelly Movers Limited',
    provider_phone: '0725707976',
    provider_rating: 5.0,
    review_count: 45,
    price_min: 10000,
    price_max: 100000,
    is_verified: true,
    coverage_area: 'Nairobi, Thika, Ruiru',
    service_hours: 'Mon-Sat 6am-7pm',
    status: 'active'
  },
  {
    title: 'Jirani Movers - Your Neighbor Moving Company',
    description: 'Friendly and professional moving services. House moves, apartment relocations, and delivery services. Competitive pricing with excellent customer service.',
    service_type: 'moving',
    provider_id: 'PROV005',
    provider_name: 'Jirani Movers',
    provider_phone: '0724548002',
    provider_rating: 4.0,
    review_count: 63,
    price_min: 7000,
    price_max: 70000,
    is_verified: false,
    coverage_area: 'Nairobi Metropolitan Area',
    service_hours: 'Mon-Sun 7am-7pm',
    status: 'active'
  },
  {
    title: 'Taylor Movers Kenya - International & Domestic',
    description: 'Professional house, office and international movers. Trusted by leading corporations, NGOs and government institutions. Comprehensive relocation services with insurance.',
    service_type: 'moving',
    provider_id: 'PROV006',
    provider_name: 'Taylor Movers Kenya',
    provider_phone: '0718160622',
    provider_rating: 4.9,
    review_count: 203,
    price_min: 18000,
    price_max: 250000,
    is_verified: true,
    coverage_area: 'Kenya, East Africa, International',
    service_hours: 'Mon-Fri 8am-6pm',
    status: 'active'
  },
  {
    title: 'Professional Plumbing Services - 24/7 Emergency',
    description: 'Licensed plumber offering repairs, installations, and maintenance. Drain cleaning, pipe repairs, water heater installation, bathroom and kitchen plumbing. Available 24/7 for emergencies.',
    service_type: 'plumbing',
    provider_id: 'PROV007',
    provider_name: 'KejaFix Plumbing Services',
    provider_phone: '0722333444',
    provider_rating: 4.7,
    review_count: 142,
    price_min: 2500,
    price_max: 50000,
    is_verified: true,
    coverage_area: 'All Nairobi Areas',
    service_hours: '24/7 Emergency Service',
    status: 'active'
  },
  {
    title: 'Expert Electrician - Licensed & Insured',
    description: 'Professional electrical services for homes and businesses. Wiring, lighting installation, power backup systems, electrical repairs and safety inspections. Quick response time.',
    service_type: 'electrical',
    provider_id: 'PROV008',
    provider_name: 'PowerFix Electrical Solutions',
    provider_phone: '0733444555',
    provider_rating: 4.8,
    review_count: 118,
    price_min: 3000,
    price_max: 80000,
    is_verified: true,
    coverage_area: 'Nairobi & Environs',
    service_hours: 'Mon-Sat 7am-8pm, Emergency 24/7',
    status: 'active'
  },
  {
    title: 'Cleaning Services - Home & Office',
    description: 'Professional cleaning services for residential and commercial properties. Deep cleaning, regular maintenance, move-in/move-out cleaning, carpet and upholstery cleaning.',
    service_type: 'cleaning',
    provider_id: 'PROV009',
    provider_name: 'SparkleClean Services',
    provider_phone: '0744555666',
    provider_rating: 4.6,
    review_count: 97,
    price_min: 4000,
    price_max: 30000,
    is_verified: true,
    coverage_area: 'Nairobi Metropolitan',
    service_hours: 'Mon-Sat 6am-6pm',
    status: 'active'
  },
  {
    title: 'Painting & Decoration Services',
    description: 'Professional painters for interior and exterior painting. Wall texturing, color consultation, spray painting, and wallpaper installation. Quality finishes guaranteed.',
    service_type: 'painting',
    provider_id: 'PROV010',
    provider_name: 'ColorPro Painters',
    provider_phone: '0755666777',
    provider_rating: 4.5,
    review_count: 76,
    price_min: 8000,
    price_max: 100000,
    is_verified: false,
    coverage_area: 'Nairobi, Kiambu',
    service_hours: 'Mon-Sat 7am-6pm',
    status: 'active'
  }
];

async function loadServices() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    console.log(`Loading ${services.length} services...`);
    
    for (const service of services) {
      const id = uuidv4();
      const images = JSON.stringify([`https://via.placeholder.com/400x300?text=${encodeURIComponent(service.title.substring(0, 20))}`]);
      const raw_data = JSON.stringify({
        source: 'web_search',
        imported_at: new Date().toISOString()
      });
      
      const result = await client.query(`
        INSERT INTO services (
          id, title, description, service_type, provider_id, provider_name,
          provider_phone, provider_rating, review_count, price_min, price_max,
          is_verified, coverage_area, service_hours, images, status, raw_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING id, title
      `, [
        id,
        service.title,
        service.description,
        service.service_type,
        service.provider_id,
        service.provider_name,
        service.provider_phone,
        service.provider_rating,
        service.review_count,
        service.price_min,
        service.price_max,
        service.is_verified,
        service.coverage_area,
        service.service_hours,
        images,
        service.status,
        raw_data
      ]);
      
      console.log(`✓ Loaded: ${result.rows[0].title}`);
    }
    
    console.log('\n✅ All services loaded successfully!');
    
  } catch (error) {
    console.error('Error loading services:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

loadServices();
