// Simple validation script for deployment
console.log('🔍 Validating server configuration...');

try {
  // Check if main dependencies can be loaded
  require('dotenv').config();
  require('express');
  require('cors');
  require('jsonwebtoken');
  require('bcryptjs');
  require('node-fetch');
  require('africastalking');
  
  // Check if main files exist
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'server.js',
    'package.json',
    'db/store.js',
    'db/postgres-store.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Ensure data.json exists for store fallback
  const dataJsonPath = path.join(__dirname, 'db', 'data.json');
  if (!fs.existsSync(dataJsonPath)) {
    const defaultData = {
      users: [],
      properties: [],
      services: [],
      marketplace_items: [],
      reviews: {},
      service_reviews: {},
      transactions: [],
      alerts: [],
      leads: [],
      messages: [],
      comments: {},
      verification_logs: []
    };
    fs.writeFileSync(dataJsonPath, JSON.stringify(defaultData, null, 2), 'utf8');
    console.log('📦 Created initial db/data.json for fallback safety');
  }
  
  // Try to require the store
  require('./db/store');
  
  console.log('✅ All dependencies and required files are available');
  console.log('✅ Server validation passed');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}