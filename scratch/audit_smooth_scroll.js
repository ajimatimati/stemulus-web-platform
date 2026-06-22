const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const hasSmooth = content.includes('smooth-scroll.js');
  const hasLenis = content.includes('lenis');
  console.log(`File: ${f} | has smooth-scroll: ${hasSmooth} | has lenis: ${hasLenis}`);
});
