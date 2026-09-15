const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'admin.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix: line 116 ends with "loadMpesaConfig();" but the closing brace of switchTab() is missing
// Then line 117 starts "   async refreshAllData()" with extra leading space
// We need to:
// 1. Add "  }" after line 116 (closing switchTab)
// 2. Fix the leading space on line 117

// Replace the broken part
const broken = `    if (tabName === 'system') this.loadMpesaConfig();\r\n   async refreshAllData()`;
const fixed = `    if (tabName === 'system') this.loadMpesaConfig();\r\n  }\r\n\r\n  async refreshAllData()`;

if (content.includes(broken)) {
  content = content.replace(broken, fixed);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed: Added closing brace for switchTab() and fixed refreshAllData indentation');
} else {
  // Try without \r
  const broken2 = `    if (tabName === 'system') this.loadMpesaConfig();\n   async refreshAllData()`;
  const fixed2 = `    if (tabName === 'system') this.loadMpesaConfig();\n  }\n\n  async refreshAllData()`;
  if (content.includes(broken2)) {
    content = content.replace(broken2, fixed2);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed (LF): Added closing brace for switchTab() and fixed refreshAllData indentation');
  } else {
    console.error('Could not find pattern to fix! Showing context around line 115-120:');
    const lines = content.split('\n');
    lines.slice(110, 122).forEach((l, i) => console.log(i+111, JSON.stringify(l)));
  }
}
