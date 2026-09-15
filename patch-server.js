const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the pending-listings comment (handles any encoding of the em-dash)
const marker = "app.get('/api/admin/pending-listings'";
const idx = content.indexOf(marker);
if (idx === -1) {
  console.error('Could not find pending-listings endpoint!');
  process.exit(1);
}

// Find the start of the comment line before it
const commentEnd = content.lastIndexOf('\n', idx);
const commentStart = content.lastIndexOf('\n', commentEnd - 1);

// New endpoint to insert
const newEndpoint = `
// GET /api/admin/all-properties -- returns ALL properties (verified + pending) for admin
app.get('/api/admin/all-properties', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const all = await store.getAllProperties();
    res.json({ success: true, count: all.length, total: all.length, properties: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

`;

// Insert before the pending-listings comment
const insertAt = commentStart + 1;
content = content.slice(0, insertAt) + newEndpoint + content.slice(insertAt);

// Also fix the pending-listings filter to check is_verified
content = content.replace(
  `    const pending = all.filter(p =>\r\n      !p.isApproved &&\r\n      p.status !== 'approved' &&\r\n      p.status !== 'rejected' &&\r\n      !p.isPlaceholder &&\r\n      !p.isTest\r\n    );`,
  `    const pending = all.filter(p =>\r\n      !p.isVerified && !p.is_verified &&\r\n      !p.isApproved &&\r\n      p.status !== 'approved' &&\r\n      p.status !== 'rejected' &&\r\n      !p.isPlaceholder &&\r\n      !p.isTest\r\n    );`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! Inserted /api/admin/all-properties endpoint.');
console.log('Position:', insertAt, 'chars from start');
