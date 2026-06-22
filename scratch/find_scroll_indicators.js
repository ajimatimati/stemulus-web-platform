const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lower = content.toLowerCase();
  if (lower.includes('scroll-indicator') || lower.includes('scroll_indicator') || lower.includes('scroll-down') || lower.includes('scrolldown') || lower.includes('scroll-hint') || lower.includes('scrollhint') || lower.includes('scroll-icon') || lower.includes('scroll_icon')) {
    console.log(`Match in ${filePath}:`);
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (l.toLowerCase().includes('scroll') && (l.toLowerCase().includes('indicator') || l.toLowerCase().includes('down') || l.toLowerCase().includes('hint') || l.toLowerCase().includes('icon'))) {
        console.log(`  L${idx+1}: ${l.trim()}`);
      }
    });
  }
}

fs.readdirSync(ROOT).forEach(f => {
  if (f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css')) {
    searchFile(path.join(ROOT, f));
  }
});
