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

const items = [
  // Furniture
  {
    title: '4 by 6 Wooden Bed Frame',
    description: 'Quality wooden bed frame in excellent condition. Sturdy construction, no wobbling. Perfect for master bedroom. Buyer to arrange transport.',
    category: 'furniture',
    condition: 'good',
    item_type: 'bedroom',
    price_kes: 8500,
    location_suburb: 'Kasarani',
    seller_id: 'SELL001',
    seller_name: 'John Mwangi',
    seller_phone: '0722111222',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: '5 by 6 King Size Bed with Mattress',
    description: 'King size bed with comfortable mattress. 2 years old, well maintained. Includes bedside drawers. Must sell urgently.',
    category: 'furniture',
    condition: 'excellent',
    item_type: 'bedroom',
    price_kes: 18000,
    location_suburb: 'South B',
    seller_id: 'SELL002',
    seller_name: 'Mary Wanjiru',
    seller_phone: '0733222333',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Classic Wooden Office Desk With 3 Drawers',
    description: 'Professional office desk made from solid wood. Three spacious drawers for storage. Perfect for home office or study room. Excellent craftsmanship.',
    category: 'furniture',
    condition: 'excellent',
    item_type: 'office',
    price_kes: 12500,
    location_suburb: 'Westlands',
    seller_id: 'SELL003',
    seller_name: 'Peter Kamau',
    seller_phone: '0744333444',
    is_negotiable: false,
    status: 'active'
  },
  {
    title: '6-Seater Dining Table Set',
    description: 'Beautiful dining table with 6 chairs. Wooden construction with cushioned seats. Great for family dining. Slight wear on one chair leg.',
    category: 'furniture',
    condition: 'good',
    item_type: 'dining',
    price_kes: 22000,
    location_suburb: 'Kilimani',
    seller_id: 'SELL004',
    seller_name: 'Grace Akinyi',
    seller_phone: '0755444555',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'L-Shaped Sofa Set - 7 Seater',
    description: 'Modern L-shaped sofa in grey fabric. Comfortable seating for 7 people. Clean and well maintained. Relocating, must sell.',
    category: 'furniture',
    condition: 'excellent',
    item_type: 'living_room',
    price_kes: 35000,
    location_suburb: 'Parklands',
    seller_id: 'SELL005',
    seller_name: 'David Omondi',
    seller_phone: '0766555666',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: '3-Seater Leather Sofa',
    description: 'Genuine leather 3-seater sofa in brown. Elegant design, comfortable. Minor scratches from pet. Great value for money.',
    category: 'furniture',
    condition: 'fair',
    item_type: 'living_room',
    price_kes: 15000,
    location_suburb: 'Embakasi',
    seller_id: 'SELL006',
    seller_name: 'Sarah Njeri',
    seller_phone: '0777666777',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Double Door Wardrobe',
    description: 'Spacious wardrobe with hanging space and shelves. Wooden construction with mirror on one door. Good storage solution.',
    category: 'furniture',
    condition: 'good',
    item_type: 'bedroom',
    price_kes: 9500,
    location_suburb: 'Ruaka',
    seller_id: 'SELL007',
    seller_name: 'James Kibet',
    seller_phone: '0788777888',
    is_negotiable: true,
    status: 'active'
  },
  
  // Electronics
  {
    title: 'Lenovo IdeaPad 3 - Core i5',
    description: 'Lenovo IdeaPad 3, Intel Core i5 10th Gen, 8GB RAM, 512GB SSD. Windows 11, excellent performance. Used for 1 year, very clean.',
    category: 'electronics',
    condition: 'excellent',
    item_type: 'laptop',
    price_kes: 42000,
    location_suburb: 'Nairobi CBD',
    seller_id: 'SELL008',
    seller_name: 'Michael Otieno',
    seller_phone: '0799888999',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Samsung 43" Smart TV',
    description: '43 inch Samsung Smart TV, Full HD, WiFi enabled. Netflix and YouTube apps. Comes with remote and power cable. Perfect working condition.',
    category: 'electronics',
    condition: 'excellent',
    item_type: 'tv',
    price_kes: 28000,
    location_suburb: 'Ngong Road',
    seller_id: 'SELL009',
    seller_name: 'Lucy Muthoni',
    seller_phone: '0711999000',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Creative A550 5.1 Surround Sound System',
    description: 'Powerful 5.1 channel home theater system. Crystal clear sound, powerful bass. Includes 5 speakers and subwoofer. Great for movies and music.',
    category: 'electronics',
    condition: 'good',
    item_type: 'audio',
    price_kes: 14500,
    location_suburb: 'Donholm',
    seller_id: 'SELL010',
    seller_name: 'Robert Maina',
    seller_phone: '0722000111',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Amtec AM-02 2.1 Multimedia Subwoofer',
    description: '2.1 speaker system with powerful subwoofer. Perfect for desktop or TV. Good bass response and clear highs. Slightly used.',
    category: 'electronics',
    condition: 'good',
    item_type: 'audio',
    price_kes: 4500,
    location_suburb: 'Umoja',
    seller_id: 'SELL011',
    seller_name: 'Ann Wambui',
    seller_phone: '0733111222',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'HP Desktop Computer - Complete Set',
    description: 'HP desktop with monitor, keyboard and mouse. Intel Core i3, 4GB RAM, 500GB HDD. Good for office work, browsing, light gaming.',
    category: 'electronics',
    condition: 'fair',
    item_type: 'desktop',
    price_kes: 18000,
    location_suburb: 'Kayole',
    seller_id: 'SELL012',
    seller_name: 'Francis Ouma',
    seller_phone: '0744222333',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Sony Playstation 4 with 2 Controllers',
    description: 'PS4 console 500GB with 2 wireless controllers. Includes FIFA 23, GTA V, and 3 other games. All cables included. Works perfectly.',
    category: 'electronics',
    condition: 'good',
    item_type: 'gaming',
    price_kes: 25000,
    location_suburb: 'Kilimani',
    seller_id: 'SELL013',
    seller_name: 'Kevin Wekesa',
    seller_phone: '0755333444',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Samsung Refrigerator - Double Door',
    description: 'Large capacity Samsung fridge, double door with freezer. Energy efficient, quiet operation. 3 years old, well maintained.',
    category: 'appliances',
    condition: 'good',
    item_type: 'kitchen',
    price_kes: 32000,
    location_suburb: 'South C',
    seller_id: 'SELL014',
    seller_name: 'Elizabeth Chebet',
    seller_phone: '0766444555',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: '6kg Total Gas Cylinder with Stand',
    description: 'Full 6kg gas cylinder with sturdy metal stand. Gas included. Perfect for small family. Clean and safe.',
    category: 'appliances',
    condition: 'excellent',
    item_type: 'kitchen',
    price_kes: 7200,
    location_suburb: 'Kikuyu',
    seller_id: 'SELL015',
    seller_name: 'Jane Nyambura',
    seller_phone: '0777555666',
    is_negotiable: false,
    status: 'active'
  },
  {
    title: 'Microwave Oven - 20L Capacity',
    description: 'Digital microwave oven with grill function. 20 liter capacity, 6 power levels. Clean inside and out. Works perfectly.',
    category: 'appliances',
    condition: 'excellent',
    item_type: 'kitchen',
    price_kes: 5500,
    location_suburb: 'Ruiru',
    seller_id: 'SELL016',
    seller_name: 'Daniel Kariuki',
    seller_phone: '0788666777',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Washing Machine - 7kg Front Load',
    description: 'Semi-automatic washing machine, 7kg capacity. Multiple wash programs. Saves water and time. Good working condition.',
    category: 'appliances',
    condition: 'good',
    item_type: 'laundry',
    price_kes: 16500,
    location_suburb: 'Buruburu',
    seller_id: 'SELL017',
    seller_name: 'Monica Achieng',
    seller_phone: '0799777888',
    is_negotiable: true,
    status: 'active'
  },
  {
    title: 'Rice Cooker - 1.8L',
    description: 'Automatic rice cooker with keep-warm function. Cooks perfect rice every time. Used twice, almost new.',
    category: 'appliances',
    condition: 'excellent',
    item_type: 'kitchen',
    price_kes: 2800,
    location_suburb: 'Langata',
    seller_id: 'SELL018',
    seller_name: 'Susan Nafula',
    seller_phone: '0711888999',
    is_negotiable: false,
    status: 'active'
  },
  {
    title: 'Electric Kettle - 1.7L Stainless Steel',
    description: 'Fast boiling electric kettle. Stainless steel body, auto shut-off. Boils water in 3 minutes. Like new.',
    category: 'appliances',
    condition: 'excellent',
    item_type: 'kitchen',
    price_kes: 1650,
    location_suburb: 'Rongai',
    seller_id: 'SELL019',
    seller_name: 'Tom Mutua',
    seller_phone: '0722999000',
    is_negotiable: false,
    status: 'active'
  },
  {
    title: 'Blender - 1.5L Glass Jug',
    description: '4-speed blender with pulse function. Glass jug, stainless steel blades. Great for smoothies and soups. Barely used.',
    category: 'appliances',
    condition: 'excellent',
    item_type: 'kitchen',
    price_kes: 3200,
    location_suburb: 'Karen',
    seller_id: 'SELL020',
    seller_name: 'Helen Wangui',
    seller_phone: '0733000111',
    is_negotiable: true,
    status: 'active'
  }
];

async function loadMarketplaceItems() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    console.log(`Loading ${items.length} marketplace items...`);
    
    for (const item of items) {
      const id = uuidv4();
      const images = JSON.stringify([`https://via.placeholder.com/400x300?text=${encodeURIComponent(item.title.substring(0, 20))}`]);
      const raw_data = JSON.stringify({
        source: 'web_search',
        imported_at: new Date().toISOString()
      });
      
      const result = await client.query(`
        INSERT INTO marketplace_items (
          id, title, description, category, seller_id, seller_name, seller_phone,
          price_kes, condition, item_type, is_negotiable, location_suburb,
          images, status, raw_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING id, title
      `, [
        id,
        item.title,
        item.description,
        item.category,
        item.seller_id,
        item.seller_name,
        item.seller_phone,
        item.price_kes,
        item.condition,
        item.item_type,
        item.is_negotiable,
        item.location_suburb,
        images,
        item.status,
        raw_data
      ]);
      
      console.log(`✓ Loaded: ${result.rows[0].title}`);
    }
    
    console.log('\n✅ All marketplace items loaded successfully!');
    
  } catch (error) {
    console.error('Error loading marketplace items:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

loadMarketplaceItems();
