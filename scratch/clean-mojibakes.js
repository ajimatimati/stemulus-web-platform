const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..');

// Common mojibake mappings
const replacements = [
  { search: /â• â• â•/g, replace: '═══' },
  { search: /Ã¢•Â\s*Ã¢•Â/g, replace: '═══════════════════════════════════════════════' },
  { search: /Ã¢•Â/g, replace: '═══════════════════════════════════════════════' },
  { search: /–/g, replace: '–' },
  { search: /—/g, replace: '—' },
  { search: /'/g, replace: '’' },
  { search: /"/g, replace: '“' },
  { search: /"\s/g, replace: '” ' },
  { search: /"/g, replace: '”' },
  { search: /Â·/g, replace: '·' },
  { search: /Ã¢─—/g, replace: '—' },
  { search: /Ã¢─/g, replace: '—' },
  { search: /Don&rsquo;t/g, replace: 'Don’t' },
  { search: /Don&rsquo;t/g, replace: 'Don’t' }
];

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const r of replacements) {
      content = content.replace(r.search, r.replace);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned: ${path.basename(filePath)}`);
    } else {
      console.log(`No changes needed: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.html')) {
      cleanFile(fullPath);
    }
  }
}

console.log('Scanning HTML files in workspace...');
scanDirectory(directoryPath);
console.log('Mojibake cleanup completed.');
