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
    'db/data.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Required file missing: ${file}`);
    }
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