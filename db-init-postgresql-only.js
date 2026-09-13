// PostgreSQL-ONLY Database Initialization (NO JSON FALLBACK)
const { initializePostgres } = require('./db/smart-pg-connect');
const emailService = require('./db/email-service');
const uploadService = require('./db/upload-service');
const fs = require('fs');
const path = require('path');

let store;

async function initializeDatabase() {
  try {
    console.log('DATABASE INITIALIZATION: PostgreSQL-ONLY MODE');
    console.log('JSON storage has been permanently disabled');
    
    // Force PostgreSQL connection using smart connector
    const pool = await initializePostgres();
    
    // Load PostgreSQL store
    store = require('./db/postgres-store.js');
    store.pool = pool;
    const success = await store.init();

    if (!success) {
      throw new Error('PostgreSQL store initialization failed');
    }

    // Run migration
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, 'db/postgres-migration.sql'), 'utf8');
      await pool.query(schemaSql);
      console.log('Schema migration completed');
    } catch (schemaErr) {
      if (!schemaErr.message.includes('already exists')) {
        console.warn('Schema warning:', schemaErr.message);
      }
    }

    console.log('PostgreSQL database ready');

  } catch (error) {
    console.error('FATAL: PostgreSQL connection failed');
    console.error(error.message);
    process.exit(1);
  }

  // Initialize services
  emailService.initEmailService();
  uploadService.initCloudinary();
  
  return store;
}

module.exports = { initializeDatabase, getStore: () => store };
