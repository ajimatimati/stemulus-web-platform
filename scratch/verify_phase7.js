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

// 1. Verify preai-overhaul.css contains the new indicator badge, grid, and glows
checkFile('preai-overhaul.css', (content) => {
  // Check skills-pill-badge
  if (!content.includes('.skills-pill-badge') || !content.includes('pulse-breathing')) {
    errors.push("preai-overhaul.css: Indicators badge (.skills-pill-badge) or breathing pulse keyframes are missing!");
  } else {
    console.log("✓ preai-overhaul.css: indicator badge pill styles & pulse keyframes found.");
  }

  // Check radial gradient micro-grid
  if (!content.includes('background-image: radial-gradient(rgba(26, 35, 126, 0.05)')) {
    errors.push("preai-overhaul.css: Dotted micro-grid gradient pattern on #skills-section is missing!");
  } else {
    console.log("✓ preai-overhaul.css: Dotted micro-grid radial background pattern found.");
  }

  // Check brand glows
  const brandClasses = ['card-scratch', 'card-python', 'card-js', 'card-html', 'card-ai', 'card-arduino', 'card-robotics', 'card-3d', 'card-roblox', 'card-pygame'];
  brandClasses.forEach(bc => {
    if (!content.includes(`.logo-card.${bc}:hover`)) {
      errors.push(`preai-overhaul.css: Brand hover glow style for '.logo-card.${bc}:hover' is missing!`);
    } else {
      console.log(`   - logo-card hover glow style for '${bc}' verified.`);
    }
  });
});

// 2. Verify skills indicator badge and category classes are in index.html
checkFile('index.html', (content) => {
  if (!content.includes('skills-pill-badge') || !content.includes('pulse-dot')) {
    errors.push("index.html: Glowing indicators pill badge is missing from skills section!");
  } else {
    console.log("✓ index.html: Glowing indicators pill badge found in markup.");
  }

  const brandClasses = ['card-scratch', 'card-python', 'card-js', 'card-html', 'card-ai', 'card-arduino', 'card-robotics', 'card-3d', 'card-roblox', 'card-pygame'];
  brandClasses.forEach(bc => {
    if (!content.includes(`logo-card ${bc}`)) {
      errors.push(`index.html: Marquee item card with class '${bc}' is missing!`);
    } else {
      console.log(`   - marquee card class '${bc}' verified in index.html.`);
    }
  });
});

// 3. Verify video-scrub.js features
checkFile('video-scrub.js', (content) => {
  // Check matchMedia calls
  if (!content.includes('gsap.matchMedia()') || !content.includes('matchMediaInstance.add(')) {
    errors.push("video-scrub.js: gsap.matchMedia structure is missing!");
  } else {
    console.log("✓ video-scrub.js: gsap.matchMedia wrapper found.");
  }

  // Check scroll restoration bypass
  if (!content.includes('window.scrollY > 50') || !content.includes('loadedmetadata')) {
    errors.push("video-scrub.js: Scroll restoration / loader bypass for window.scrollY > 50 is missing!");
  } else {
    console.log("✓ video-scrub.js: Scroll restoration loader bypass logic found.");
  }

  // Check unified timeline and properties
  if (!content.includes('gsap.timeline(') || !content.includes('time:') || !content.includes('currentTime = playhead.time')) {
    errors.push("video-scrub.js: Unified timeline playhead scrub logic is missing!");
  } else {
    console.log("✓ video-scrub.js: Unified timeline and playhead time-scrub logic found.");
  }

  // Check window resize listener
  if (!content.includes("window.addEventListener('resize'") || !content.includes('ScrollTrigger.refresh()')) {
    errors.push("video-scrub.js: Debounced window resize ScrollTrigger refresh handler is missing!");
  } else {
    console.log("✓ video-scrub.js: Debounced window resize ScrollTrigger refresh listener found.");
  }
});

// Summary
console.log('\n=======================================');
if (errors.length > 0) {
  console.error("❌ Phase 7 Verification FAILED:");
  errors.forEach(err => console.error("- " + err));
  process.exit(1);
} else {
  console.log("🎉 Phase 7 Verification PASSED successfully with 0 errors!");
}
console.log('=======================================');
