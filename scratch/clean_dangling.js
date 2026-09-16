const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const isCRLF = html.includes('\r\n');
const lines = html.split(isCRLF ? '\r\n' : '\n');

const idx = lines.findIndex(l => l.includes('admin-tab-btn-users'));
if (idx !== -1) {
  lines.splice(idx, 1);
  fs.writeFileSync('index.html', lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
  console.log('Removed admin-tab-btn-users line');
}
