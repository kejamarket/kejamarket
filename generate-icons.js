/**
 * Generate KejaMarket PWA icons (192x192 and 512x512)
 * Creates simple green PNG icons with "KM" text
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Minimal PNG generator — creates a solid green square PNG
function createPNG(size) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crcBuf = Buffer.concat([t, data]);
    const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcBuf));
    return Buffer.concat([len, t, data, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT — solid #00b53f green (0, 181, 63)
  const zlib = require('zlib');
  const rawRows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      // Draw a slightly lighter center area for visual interest
      const cx = Math.abs(x - size / 2) / (size / 2);
      const cy = Math.abs(y - size / 2) / (size / 2);
      const inCenter = cx < 0.5 && cy < 0.5;
      row[1 + x * 3 + 0] = inCenter ? 0 : 0;       // R
      row[1 + x * 3 + 1] = inCenter ? 200 : 181;   // G
      row[1 + x * 3 + 2] = inCenter ? 80 : 63;     // B
    }
    rawRows.push(row);
  }
  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512));

console.log('✅ PWA icons created: icons/icon-192.png and icons/icon-512.png');
