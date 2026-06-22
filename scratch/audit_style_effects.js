const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

// Search in CSS files
const cssFiles = ['style.css', 'preai-overhaul.css', 'responsive.css', 'section-dividers.css', 'hero-parallax.css'];
cssFiles.forEach(f => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    console.log(`\n=== Auditing CSS: ${f} ===`);
    
    // Look for box-shadow glows or glowing borders
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      if (lower.includes('glow') || lower.includes('box-shadow') && (lower.includes('orange') || lower.includes('f4600c') || lower.includes('rgba(244') || lower.includes('rgba(239') || lower.includes('purple') || lower.includes('active-g')) || lower.includes('border-color') || lower.includes('scroll-indicator') || lower.includes('scroll-down')) {
        console.log(`  L${idx+1}: ${line.trim()}`);
      }
    });
  }
});
