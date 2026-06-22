const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

let errors = [];

function checkFile(filename, checks) {
  try {
    const content = fs.readFileSync(path.join(ROOT, filename), 'utf8');
    checks(content);
  } catch (e) {
    errors.push(`Failed to read/check ${filename}: ${e.message}`);
  }
}

// 1. Verify preai-overhaul.css transforms and sweep styles
checkFile('preai-overhaul.css', (content) => {
  // Check transform ordering: translateX must precede scale
  const translateScaleMatches = content.match(/transform:\s*translateX\([^)]+\)\s*scale\([^)]+\)/g);
  if (!translateScaleMatches || translateScaleMatches.length === 0) {
    errors.push("preai-overhaul.css: Could not find any transform rule in translateX(...) scale(...) order!");
  } else {
    console.log(`✓ preai-overhaul.css: Found ${translateScaleMatches.length} transform rules with correct function order.`);
  }

  // Check button sweeps
  if (!content.includes('.btn-primary-raw::after') || !content.includes('transform: skewX(-25deg);')) {
    errors.push("preai-overhaul.css: Button sweep hover styling is missing!");
  } else {
    console.log("✓ preai-overhaul.css: Button sweep hover styling found.");
  }

  // Check marquee mobile responsiveness
  if (!content.includes('@media (max-width: 768px)') || !content.includes('.skills-marquee-container') || !content.includes('animation-duration: 25s')) {
    errors.push("preai-overhaul.css: Skills marquee mobile responsive overrides are missing!");
  } else {
    console.log("✓ preai-overhaul.css: Skills marquee mobile overrides found.");
  }
});

// 2. Verify reviews in index.html
checkFile('index.html', (content) => {
  const expectedNames = ['Fatimah Bello', 'Chioma Nwachukwu', 'Adaeze Okonkwo', 'Yewande Adebayo', 'Emeka Okafor', 'Amina Yusuf'];
  expectedNames.forEach(name => {
    if (!content.includes(name)) {
      errors.push(`index.html: Testimonial name '${name}' is missing!`);
    } else {
      console.log(`✓ index.html: Localized review name '${name}' found.`);
    }
  });
});

// 3. Verify reviews in for-parents.html
checkFile('for-parents.html', (content) => {
  if (content.includes('James T.') || content.includes('Safeguarding is our number one priority, James.')) {
    errors.push("for-parents.html: Old Western name 'James T.' is still present in parent testimonials!");
  } else if (!content.includes('Tunde T.') || !content.includes('Safeguarding is our number one priority, Tunde.')) {
    errors.push("for-parents.html: Localized name 'Tunde T.' was not correctly placed!");
  } else {
    console.log("✓ for-parents.html: Localized parent testimonial name 'Tunde T.' found.");
  }
});

// 4. Verify student names in hall-of-fame.html
checkFile('hall-of-fame.html', (content) => {
  if (content.includes('Daniel, Age 9') || content.includes('Sarah, Age 11') || content.includes('Michael, Age 16')) {
    errors.push("hall-of-fame.html: Old student names (Daniel/Sarah/Michael) still present in showcase!");
  } else if (!content.includes('Chinedu, Age 9') || !content.includes('Amina, Age 11') || !content.includes('Tunde, Age 16')) {
    errors.push("hall-of-fame.html: Localized student names (Chinedu/Amina/Tunde) missing!");
  } else {
    console.log("✓ hall-of-fame.html: Localized student showcase names (Chinedu, Amina, Tunde) found.");
  }
});

// 5. Verify smooth-scroll.js smart loader
checkFile('assets/js/smooth-scroll.js', (content) => {
  if (!content.includes("typeof Lenis !== 'undefined'") || !content.includes("querySelector('script[src*=\"lenis\"]')")) {
    errors.push("assets/js/smooth-scroll.js: Smart loader checks are missing!");
  } else {
    console.log("✓ assets/js/smooth-scroll.js: Smart loader check for duplicate Lenis instances is present.");
  }
});

// Summary
console.log('\n=======================================');
if (errors.length > 0) {
  console.error("❌ Phase 6 Verification FAILED:");
  errors.forEach(err => console.error("- " + err));
  process.exit(1);
} else {
  console.log("🎉 Phase 6 Verification PASSED successfully with 0 errors!");
}
console.log('=======================================');
