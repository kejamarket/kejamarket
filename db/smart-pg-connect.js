// Smart PostgreSQL Connection Manager
// Tries multiple connection methods and formats automatically

const { Pool } = require('pg');

/**
 * Build DATABASE_URL from environment or use provided URL
 */
function buildDatabaseUrl() {
  // If DATABASE_URL is already set and looks correct, use it
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
    return process.env.DATABASE_URL;
  }

  // Build from components if available
  if (process.env.SUPABASE_HOST && process.env.SUPABASE_PASSWORD) {
    const password = encodeURIComponent(process.env.SUPABASE_PASSWORD);
    return `postgresql://postgres:${password}@${process.env.SUPABASE_HOST}:5432/postgres`;
  }

  // Fallback: try to fix common DATABASE_URL issues
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    
    // Fix password encoding if needed
    if (url.includes('@') && !url.includes('%40')) {
      const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/);
      if (match) {
        const [, user, password, rest] = match;
        const encodedPassword = encodeURIComponent(password);
        url = `postgresql://${user}:${encodedPassword}@${rest}`;
      }
    }
    
    return url;
  }

  return null;
}

/**
 * Attempts to connect to PostgreSQL using multiple connection string formats
 * @param {string} baseUrl - The DATABASE_URL from environment
 * @returns {Promise<Pool>} Connected PostgreSQL pool
 */
async function smartConnect(baseUrl) {
  console.log('🔌 Smart PostgreSQL connector initializing...');

  let url = baseUrl || buildDatabaseUrl();

  if (!url) {
    throw new Error('DATABASE_URL not found. Set DATABASE_URL or SUPABASE_HOST + SUPABASE_PASSWORD');
  }

  console.log('📝 Connection string format:', url.substring(0, 30) + '...');

  // Ensure SSL mode is set
  if (!url.includes('sslmode=') && !url.includes('ssl=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  // Remove sslmode from URL since we handle SSL in config
  const cleanUrl = url.replace(/[?&]sslmode=[^&]+/, '');

  // Connection configurations to try (in order)
  const connectionConfigs = [];

  // Config 1: Direct connection with SSL
  connectionConfigs.push({
    name: 'Direct SSL Connection',
    config: {
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false }
    }
  });

  // Config 2: Pooler connection (if using Supabase)
  if (cleanUrl.includes('supabase.co') && cleanUrl.includes('db.')) {
    const poolerUrl = cleanUrl
      .replace('db.', 'aws-0-eu-west-1.pooler.')
      .replace(':5432', ':6543');
    connectionConfigs.push({
      name: 'Supabase Pooler Connection (Port 6543)',
      config: {
        connectionString: poolerUrl,
        ssl: { rejectUnauthorized: false }
      }
    });
  }

  // Config 3: Transaction pooler with pgbouncer
  if (cleanUrl.includes('supabase.co')) {
    const txPoolerUrl = cleanUrl
      .replace('db.', 'aws-0-eu-west-1.pooler.')
      .replace(':5432', ':6543') +
      (cleanUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
    connectionConfigs.push({
      name: 'Transaction Pooler with PgBouncer',
      config: {
        connectionString: txPoolerUrl,
        ssl: { rejectUnauthorized: false }
      }
    });
  }

  // Config 4: Parsed connection (manual SSL)
  const parsed = parseConnectionString(cleanUrl);
  if (parsed) {
    connectionConfigs.push({
      name: 'Parsed Connection with Manual SSL',
      config: {
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        user: parsed.user,
        password: parsed.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      }
    });
  }

  // Try each configuration
  let lastError;
  for (const { name, config } of connectionConfigs) {
    try {
      console.log(`🔄 Trying: ${name}...`);
      const pool = new Pool(config);

      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.log(`✅ SUCCESS! Connected using: ${name}`);
      console.log(`🎉 PostgreSQL is now active - JSON storage disabled`);
      return pool;
    } catch (err) {
      console.log(`❌ ${name} failed:`, err.message);
      lastError = err;
    }
  }

  // All methods failed
  console.error('\n❌ All PostgreSQL connection methods failed!');
  console.error('Last error:', lastError.message);
  throw new Error('FORCED POSTGRESQL MODE: Cannot connect to database. JSON storage is disabled. Please check DATABASE_URL configuration.');
}

/**
 * Parse PostgreSQL connection string into components
 */
function parseConnectionString(url) {
  try {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
    if (!match) return null;

    const [, user, password, host, port, database] = match;
    return {
      user,
      password: decodeURIComponent(password),
      host,
      port: port ? parseInt(port) : 5432,
      database: database.split('?')[0] // Remove query params
    };
  } catch (err) {
    return null;
  }
}

/**
 * Initialize PostgreSQL connection with smart retry logic
 */
async function initializePostgres() {
  const DATABASE_URL = buildDatabaseUrl();

  if (!DATABASE_URL) {
    console.error('\n❌ FATAL: DATABASE_URL not set!');
    console.error('📋 JSON storage has been disabled.');
    console.error('🔧 Set one of these:');
    console.error('   DATABASE_URL=postgresql://user:password@host:5432/database');
    console.error('   OR');
    console.error('   SUPABASE_HOST=db.xxx.supabase.co');
    console.error('   SUPABASE_PASSWORD=yourpassword\n');
    process.exit(1);
  }

  try {
    const pool = await smartConnect(DATABASE_URL);
    return pool;
  } catch (err) {
    console.error('\n❌ FATAL: Cannot connect to PostgreSQL');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check DATABASE_URL format');
    console.error('2. Verify database is accessible from this network');
    console.error('3. Ensure SSL certificates are valid');
    console.error('4. Check firewall rules\n');
    process.exit(1);
  }
}

module.exports = { initializePostgres, smartConnect, buildDatabaseUrl };
