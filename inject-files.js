/**
 * STEMulus — Inject responsive.css and mobile-nav.js into all HTML pages
 * Run: node inject-files.js
 */
const fs   = require('fs');
const path = require('path');

const dir = __dirname;

const CSS_TAG = '<link rel="stylesheet" href="responsive.css">';
const JS_TAG  = '<script src="mobile-nav.js"><\/script>';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let patched = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);

  let html;
  try {
    html = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error('✗ Could not read:', file, e.message);
    return;
  }

  let modified = false;

  // ── Inject CSS just before </head> ────────────────────────────
  if (!html.includes('responsive.css')) {
    html = html.replace(/<\/head>/i, CSS_TAG + '\n</head>');
    modified = true;
  }

  // ── Inject JS just before </body> ─────────────────────────────
  if (!html.includes('mobile-nav.js')) {
    html = html.replace(/<\/body>/i, JS_TAG + '\n</body>');
    modified = true;
  }

  if (modified) {
    try {
      fs.writeFileSync(filePath, html, 'utf-8');
      console.log('✓ Patched:', file);
      patched++;
    } catch (e) {
      console.error('✗ Could not write:', file, e.message);
    }
  } else {
    console.log('· Already up-to-date:', file);
    skipped++;
  }
});

console.log(`\n✅ Done — patched ${patched} file(s), ${skipped} already up-to-date, ${files.length} total.`);
