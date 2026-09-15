const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `    // Try to get counts from database\r
    if (pool) {\r
      try {\r
        const propCount = await pool.query('SELECT COUNT(*) FROM properties');\r
        const servCount = await pool.query('SELECT COUNT(*) FROM services');\r
        const mktCount = await pool.query('SELECT COUNT(*) FROM marketplace_items');\r
        const userCount = await pool.query('SELECT COUNT(*) FROM users');`;

const replacement = `    // Try to get counts from database
    if (store && store.isConnected) {
      try {
        const propCount = await store.query('SELECT COUNT(*) FROM properties');
        const servCount = await store.query('SELECT COUNT(*) FROM services');
        const mktCount = await store.query('SELECT COUNT(*) FROM marketplace_items');
        const userCount = await store.query('SELECT COUNT(*) FROM users');`;

if (content.includes('if (pool) {')) {
  // Replace all instances just to be safe
  content = content.replace(/if \(pool\) \{/g, 'if (store && store.isConnected) {');
  content = content.replace(/await pool\.query/g, 'await store.query');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed /api/health pool issue.');
} else {
  console.log('pool check not found. Did it already get replaced?');
}
