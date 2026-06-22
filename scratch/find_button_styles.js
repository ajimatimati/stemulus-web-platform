const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function searchFile(f) {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  console.log(`\n=== Button search in: ${f} ===`);
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('.btn') || l.includes('button') || l.includes('nav-cta-btn')) {
      console.log(`  L${idx+1}: ${l.trim()}`);
    }
  });
}

searchFile('style.css');
searchFile('preai-overhaul.css');
