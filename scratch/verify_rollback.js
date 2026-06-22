const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

let errors = [];

// 1. Verify smooth-scroll.js file is deleted
const jsPath = path.join(ROOT, 'assets', 'js', 'smooth-scroll.js');
if (fs.existsSync(jsPath)) {
  errors.push(`File still exists: ${jsPath}`);
} else {
  console.log("✓ assets/js/smooth-scroll.js file deletion verified.");
}

// 2. Verify no HTML files contain references to smooth-scroll.js or lenis
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
files.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (content.includes('smooth-scroll.js')) {
    errors.push(`${f} still contains reference to 'smooth-scroll.js'!`);
  }
  if (content.toLowerCase().includes('lenis')) {
    errors.push(`${f} still contains reference to 'lenis'!`);
  }
});

if (errors.length === 0) {
  console.log("✓ Checked all HTML files. No references to smooth-scroll.js or lenis remain.");
}

// Summary
console.log('\n=======================================');
if (errors.length > 0) {
  console.error("❌ Rollback Verification FAILED:");
  errors.forEach(err => console.error("- " + err));
  process.exit(1);
} else {
  console.log("🎉 Rollback Verification PASSED successfully with 0 errors!");
}
console.log('=======================================');
