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

const DATABASE_URL = 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Users for service providers
const providers = [
  { id: 'PROV001', name: 'Nellions Relocations Ltd', email: 'info@nellions.co.ke', phone: '0700000002', role: 'service_provider' },
  { id: 'PROV002', name: 'Access Movers Kenya', email: 'info@accessmovers.co.ke', phone: '0722000111', role: 'service_provider' },
  { id: 'PROV003', name: 'Prime Movers', email: 'info@primemovers.co.ke', phone: '0715296624', role: 'service_provider' },
  { id: 'PROV004', name: 'Kelly Movers Limited', email: 'info@kellymovers.co.ke', phone: '0725707976', role: 'service_provider' },
  { id: 'PROV005', name: 'Jirani Movers', email: 'info@jiranimovers.co.ke', phone: '0724548002', role: 'service_provider' },
  { id: 'PROV006', name: 'Taylor Movers Kenya', email: 'info@taylorea.com', phone: '0718160622', role: 'service_provider' },
  { id: 'PROV007', name: 'KejaFix Plumbing Services', email: 'plumber@kejaservices.co.ke', phone: '0722333444', role: 'service_provider' },
  { id: 'PROV008', name: 'PowerFix Electrical Solutions', email: 'electrician@kejaservices.co.ke', phone: '0733444555', role: 'service_provider' },
  { id: 'PROV009', name: 'SparkleClean Services', email: 'cleaning@kejaservices.co.ke', phone: '0744555666', role: 'service_provider' },
  { id: 'PROV010', name: 'ColorPro Painters', email: 'painting@kejaservices.co.ke', phone: '0755666777', role: 'service_provider' }
];

// Users for marketplace sellers
const sellers = [
  { id: 'SELL001', name: 'John Mwangi', email: 'john.mwangi@example.com', phone: '0722111222', role: 'tenant' },
  { id: 'SELL002', name: 'Mary Wanjiru', email: 'mary.wanjiru@example.com', phone: '0733222333', role: 'tenant' },
  { id: 'SELL003', name: 'Peter Kamau', email: 'peter.kamau@example.com', phone: '0744333444', role: 'tenant' },
  { id: 'SELL004', name: 'Grace Akinyi', email: 'grace.akinyi@example.com', phone: '0755444555', role: 'tenant' },
  { id: 'SELL005', name: 'David Omondi', email: 'david.omondi@example.com', phone: '0766555666', role: 'tenant' },
  { id: 'SELL006', name: 'Sarah Njeri', email: 'sarah.njeri@example.com', phone: '0777666777', role: 'tenant' },
  { id: 'SELL007', name: 'James Kibet', email: 'james.kibet@example.com', phone: '0788777888', role: 'tenant' },
  { id: 'SELL008', name: 'Michael Otieno', email: 'michael.otieno@example.com', phone: '0799888999', role: 'tenant' },
  { id: 'SELL009', name: 'Lucy Muthoni', email: 'lucy.muthoni@example.com', phone: '0711999000', role: 'tenant' },
  { id: 'SELL010', name: 'Robert Maina', email: 'robert.maina@example.com', phone: '0722101112', role: 'tenant' },
  { id: 'SELL011', name: 'Ann Wambui', email: 'ann.wambui@example.com', phone: '0733111222', role: 'tenant' },
  { id: 'SELL012', name: 'Francis Ouma', email: 'francis.ouma@example.com', phone: '0744222333', role: 'tenant' },
  { id: 'SELL013', name: 'Kevin Wekesa', email: 'kevin.wekesa@example.com', phone: '0755333444', role: 'tenant' },
  { id: 'SELL014', name: 'Elizabeth Chebet', email: 'elizabeth.chebet@example.com', phone: '0766444555', role: 'tenant' },
  { id: 'SELL015', name: 'Jane Nyambura', email: 'jane.nyambura@example.com', phone: '0777555666', role: 'tenant' },
  { id: 'SELL016', name: 'Daniel Kariuki', email: 'daniel.kariuki@example.com', phone: '0788666777', role: 'tenant' },
  { id: 'SELL017', name: 'Monica Achieng', email: 'monica.achieng@example.com', phone: '0799777888', role: 'tenant' },
  { id: 'SELL018', name: 'Susan Nafula', email: 'susan.nafula@example.com', phone: '0711888999', role: 'tenant' },
  { id: 'SELL019', name: 'Tom Mutua', email: 'tom.mutua@example.com', phone: '0722999000', role: 'tenant' },
  { id: 'SELL020', name: 'Helen Wangui', email: 'helen.wangui@example.com', phone: '0733000111', role: 'tenant' }
];

async function loadUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    
    // First check the schema
    const schemaCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\nUsers table schema:');
    schemaCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log(`\n Loading ${providers.length + sellers.length} users...`);
    
    const allUsers = [...providers, ...sellers];
    
    for (const user of allUsers) {
      // Simple password hash (in production, use bcrypt)
      const password_hash = crypto.createHash('sha256').update('password123').digest('hex');
      
      try {
        const result = await client.query(`
          INSERT INTO users (
            id, name, email, phone, password, role, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone
          RETURNING id, name, role
        `, [
          user.id,
          user.name,
          user.email,
          user.phone,
          password_hash,
          user.role
        ]);
        
        console.log(`✓ Loaded: ${result.rows[0].name} (${result.rows[0].role})`);
      } catch (err) {
        console.error(`✗ Failed to load ${user.name}:`, err.message);
      }
    }
    
    console.log('\n✅ All users loaded successfully!');
    
  } catch (error) {
    console.error('Error loading users:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

loadUsers();
