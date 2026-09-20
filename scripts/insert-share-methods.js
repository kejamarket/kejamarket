/**
 * Insert missing share popover methods into js/app.js
 * Run once: node scripts/insert-share-methods.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(file, 'utf8');

// Check if already inserted
if (content.includes('toggleShareMenu(propertyId')) {
  console.log('Methods already present - nothing to do.');
  process.exit(0);
}

const newMethods = [
  '',
  '  // -- SHARE POPOVER --------------------------------------------------------',
  '  toggleShareMenu(propertyId, event) {',
  '    if (event) event.stopPropagation();',
  "    const popover = document.getElementById('share-popover-' + propertyId);",
  '    if (!popover) return;',
  "    const isVisible = popover.style.display !== 'none';",
  "    document.querySelectorAll('.card-share-popover').forEach(function(el) { el.style.display = 'none'; });",
  "    if (!isVisible) popover.style.display = 'flex';",
  '  }',
  '',
  '  copyShareLink(propertyId, event) {',
  "    if (event) { event.preventDefault(); event.stopPropagation(); }",
  '    const self = this;',
  "    const url = window.location.origin + '/?property=' + encodeURIComponent(propertyId);",
  "    const done = function() { self.showToast('Link copied to clipboard!', 'success'); };",
  '    if (navigator.clipboard && navigator.clipboard.writeText) {',
  '      navigator.clipboard.writeText(url).then(done).catch(function() { self._fallbackCopy(url); done(); });',
  '    } else { this._fallbackCopy(url); done(); }',
  "    const popover = document.getElementById('share-popover-' + propertyId);",
  "    if (popover) popover.style.display = 'none';",
  '  }',
  '',
  '  _fallbackCopy(text) {',
  "    const el = document.createElement('textarea');",
  '    el.value = text;',
  "    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';",
  '    document.body.appendChild(el);',
  '    el.select();',
  '    try { document.execCommand(\'copy\'); } catch (e) {}',
  '    document.body.removeChild(el);',
  '  }',
  '',
  '  // -- CLOSE ALL OPEN POPOVERS / DROPDOWNS ----------------------------------',
  '  closeAllPopups() {',
  "    document.querySelectorAll('.card-share-popover').forEach(function(el) { el.style.display = 'none'; });",
  "    const postMenu = document.getElementById('header-post-menu');",
  "    if (postMenu) postMenu.style.display = 'none';",
  "    const locMenu = document.getElementById('header-location-menu');",
  "    if (locMenu) locMenu.style.display = 'none';",
  '  }',
  '',
].join('\n');

const marker = '  updatePostButtonsVisibility()';
const idx = content.indexOf(marker);
if (idx === -1) {
  console.error('ERROR: marker not found in app.js');
  process.exit(1);
}

content = content.slice(0, idx) + newMethods + content.slice(idx);
fs.writeFileSync(file, content, 'utf8');
console.log('Success: share methods inserted at index', idx);
