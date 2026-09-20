/**
 * PostgreSQL Database Connection Pool
 * Using the existing Supabase connection from docker-compose.yml
 */

const { Pool } = require('pg');

// Parse DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:Stallonjevugwe4@db.cwqmtrwdbjmsrrqjkfmj.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 25, // Optimized for 10,000+ concurrent users
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});

// Handle pool errors gracefully without terminating the process
pool.on('error', (err) => {
  console.warn('⚠️ Non-fatal error on idle client (auto-reconnecting):', err.message);
});

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully at:', result.rows[0].current_time);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize communication system tables if they don't exist
async function initializeCommunicationTables() {
  try {
    const client = await pool.connect();
    
    // Check if communication tables exist
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'support_tickets', 'notifications')
    `;
    
    const result = await client.query(checkQuery);
    const existingTables = result.rows.map(row => row.table_name);
    
    if (existingTables.length < 4) {
      console.log('⚠️  Communication tables not found. Run database migration to create them.');
      console.log('📁 Migration file: db/postgres-migration.sql');
    } else {
      console.log('✅ Communication system tables verified');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error checking communication tables:', error.message);
  }
}

// Health check function
async function healthCheck() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
  initializeCommunicationTables,
  healthCheck
};

console.log('📦 Database pool configured for KejaMarket Communication System');