const fs = require('fs');
const path = require('path');

const publicPages = [
  // Group A: Curriculum
  'python-programming.html',
  'scratch-creators.html',
  'web-wizards.html',
  'fullstack-web-dev.html',
  'junior-robotics.html',
  'arduino-robotics.html',
  'digital-art.html',
  'creative-coding.html',
  'ai-machine-learning.html',
  // Group B: Academy & Funnel
  'programs.html',
  'for-parents.html',
  'join-as-tutor.html',
  'child-safety.html',
  'book-class.html',
  'enroll.html',
  'contact.html',
  // Group C: Regional Gateways
  'coding-classes-for-kids-usa.html',
  'coding-classes-for-kids-uk.html',
  'coding-classes-for-kids-canada.html',
  'coding-classes-for-kids-australia.html',
  // Group D: Portals
  'admin-dashboard.html',
  'parent-dashboard.html',
  'parent-progress.html',
  'tutor-dashboard.html',
  'tutor-attendance-create.html',
  'tutor-monthly-report.html'
];

let totalErrors = 0;
console.log('================================================================');
console.log('   STEMULUS DESIGN STANDARDS & ANTI-PATTERN VERIFICATION SCAN   ');
console.log('================================================================\n');

publicPages.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`[SKIP] ${file} (file not found)`);
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  const errors = [];

  // 1. Zero Tilts Check
  const tilts = (content.match(/card-3d-tilt|data-tilt|tilt-card/g) || []).length;
  if (tilts > 0) {
    errors.push(`Found ${tilts} 3D tilt instances`);
  }

  // 2. Zero 3D Icons Check
  const icons3d = (content.match(/data-icon-3d/g) || []).length;
  if (icons3d > 0) {
    errors.push(`Found ${icons3d} legacy data-icon-3d instances`);
  }

  // 3. Zero Pulsing Glow / Nodes in public funnel Check
  const pulses = (content.match(/dot-pulse|pulse-glow|box-shadow:\s*0\s*0\s*8px/g) || []).length;
  if (pulses > 0) {
    errors.push(`Found ${pulses} pulsing glow/node instances`);
  }

  // 4. Zero Pill Buttons Check (btn-pill-solid, btn-pill-outline)
  const pillBtns = (content.match(/btn-pill-solid|btn-pill-outline/g) || []).length;
  if (pillBtns > 0) {
    errors.push(`Found ${pillBtns} legacy pill button classes`);
  }

  // 5. Luxury CSS Linked Check
  if (!content.includes('stemulus-luxury.css')) {
    errors.push('Missing stemulus-luxury.css link');
  }

  // 6. Proprietary SVG Icons Linked Check
  if (!content.includes('stemulus-icons.js')) {
    errors.push('Missing stemulus-icons.js link');
  }

  // 7. Scroll Choreography Linked Check
  if (!content.includes('scroll-choreography.js')) {
    errors.push('Missing scroll-choreography.js link');
  }

  // 8. Interactive Engine Linked Check
  if (!content.includes('stemulus-interactive.js')) {
    errors.push('Missing stemulus-interactive.js link');
  }

  // 9. Zero emdash / endash check
  const dashes = (content.match(/[\u2014\u2013]|&mdash;|&ndash;/g) || []).length;
  if (dashes > 0) {
    errors.push(`Found ${dashes} em/en dash occurrences`);
  }

  if (errors.length === 0) {
    console.log(`[PASS] ${file.padEnd(38)} -> Clean, Compliant, Elevated`);
  } else {
    totalErrors += errors.length;
    console.log(`[FAIL] ${file.padEnd(38)} -> ${errors.join(', ')}`);
  }
});

console.log('\n================================================================');
if (totalErrors === 0) {
  console.log('   ALL VERIFIED FILES PASS 100% OF DESIGN SYSTEM CONSTRAINTS!   ');
} else {
  console.log(`   TOTAL ERRORS DETECTED: ${totalErrors} (Review and remediate)    `);
}
console.log('================================================================');

process.exit(totalErrors === 0 ? 0 : 1);
