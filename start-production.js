// Production startup script with forced correct DATABASE_URL
// This ensures PostgreSQL connection works regardless of environment variable format

// Force correct DATABASE_URL if it's wrong
if (process.env.DATABASE_URL) {
  const currentUrl = process.env.DATABASE_URL;
  
  // Fix common issues
  let fixedUrl = currentUrl;
  
  // Issue 1: Username format "postgres.xxxxx" should be just "postgres"
  if (fixedUrl.includes('postgres.yvosarkfeukzdjxoenwe')) {
    fixedUrl = fixedUrl.replace('postgres.yvosarkfeukzdjxoenwe', 'postgres');
    console.log('🔧 Fixed: Corrected username from postgres.xxx to postgres');
  }
  
  // Issue 2: Password not URL-encoded
  if (fixedUrl.includes('Stallon@jevugwe4') && !fixedUrl.includes('Stallon%40jevugwe4')) {
    fixedUrl = fixedUrl.replace('Stallon@jevugwe4', 'Stallon%40jevugwe4');
    console.log('🔧 Fixed: URL-encoded password');
  }
  
  // Issue 3: Remove problematic SSL mode parameters
  if (fixedUrl.includes('?sslmode=') || fixedUrl.includes('&sslmode=')) {
    fixedUrl = fixedUrl.replace(/[?&]sslmode=[^&]+/, '');
    console.log('🔧 Fixed: Removed sslmode parameter (handled in code)');
  }
  
  // Update environment variable
  if (fixedUrl !== currentUrl) {
    process.env.DATABASE_URL = fixedUrl;
    console.log('✅ DATABASE_URL corrected and ready');
    console.log('📝 Format:', fixedUrl.substring(0, 40) + '...');
  }
} else if (process.env.SUPABASE_HOST) {
  // Build from components
  const password = encodeURIComponent(process.env.SUPABASE_PASSWORD || 'Stallon@jevugwe4');
  process.env.DATABASE_URL = `postgresql://postgres:${password}@${process.env.SUPABASE_HOST}:5432/postgres`;
  console.log('✅ DATABASE_URL built from SUPABASE_HOST');
} else {
  // Hardcode for production if nothing is set
  console.warn('⚠️  No DATABASE_URL or SUPABASE_HOST found');
  console.log('🔧 Using hardcoded production connection string');
  process.env.DATABASE_URL = 'postgresql://postgres:Stallon%40jevugwe4@db.yvosarkfeukzdjxoenwe.supabase.co:5432/postgres';
}

// Now start the actual server
require('./server.js');
