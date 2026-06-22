const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

let errors = [];

// 1. Verify scroll hint removal from index.html
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (indexHtml.includes('id="scroll-hint"') && !indexHtml.includes('id="scroll-hint-hidden"')) {
  errors.push(`index.html still contains active scroll-hint element!`);
} else {
  console.log("✓ index.html scroll-hint removal verified.");
}

// 2. Verify testimonials section is removed from index.html
if (indexHtml.includes('id="testimonials-section"')) {
  errors.push(`index.html still contains the testimonials-section!`);
} else {
  console.log("✓ index.html testimonials-section removal verified.");
}

// 3. Verify admissions advisor section is removed from contact.html
const contactHtml = fs.readFileSync(path.join(ROOT, 'contact.html'), 'utf8');
if (contactHtml.includes('id="admissions-advisor-section"')) {
  errors.push(`contact.html still contains the admissions-advisor-section!`);
} else {
  console.log("✓ contact.html admissions-advisor-section removal verified.");
}

// 4. Verify CSS properties in preai-overhaul.css
const cssContent = fs.readFileSync(path.join(ROOT, 'preai-overhaul.css'), 'utf8');
if (!cssContent.includes('.btn-pill-solid:hover') || !cssContent.includes('transform: translateY(-6px) !important')) {
  errors.push(`preai-overhaul.css is missing 3D press button hover transformations!`);
} else {
  console.log("✓ preai-overhaul.css 3D press buttons styles verified.");
}

if (!cssContent.includes('.why-card:active')) {
  errors.push(`preai-overhaul.css is missing 3D press card styles!`);
} else {
  console.log("✓ preai-overhaul.css 3D press cards styles verified.");
}

if (errors.length === 0) {
  console.log("\n🎉 Design Upgrades & Section Removals Verification PASSED successfully with 0 errors!");
} else {
  console.error("\n❌ Design Upgrades & Section Removals Verification FAILED:");
  errors.forEach(err => console.error("- " + err));
  process.exit(1);
}
