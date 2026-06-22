const fs = require('fs');
const path = require('path');

let errors = [];

// 1. Verify index.html does not contain hero-left-col or hero-right-col wrapper divs anymore
try {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  if (indexHtml.includes('class="hero-left-col"') || indexHtml.includes("class='hero-left-col'")) {
    errors.push("index.html still contains 'hero-left-col' class!");
  }
  if (indexHtml.includes('class="hero-right-col"') || indexHtml.includes("class='hero-right-col'")) {
    errors.push("index.html still contains 'hero-right-col' class!");
  }
} catch (e) {
  errors.push("Failed to read index.html: " + e.message);
}

// 2. Verify preai-overhaul.css contains the correct positive translateX offsets on #scrub-video
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  
  if (!cssContent.includes('translateX(24%)')) {
    errors.push("preai-overhaul.css does not contain positive translation translateX(24%) for min-width 1200px!");
  }
  if (!cssContent.includes('translateX(22%)')) {
    errors.push("preai-overhaul.css does not contain positive translation translateX(22%) for min-width 1024px!");
  }
  if (!cssContent.includes('translateX(18%)')) {
    errors.push("preai-overhaul.css does not contain positive translation translateX(18%) for min-width 769px!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css: " + e.message);
}

// 3. Verify preai-overhaul.css defines .sr-hidden and .sr-visible classes
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  if (!cssContent.includes('.sr-hidden')) {
    errors.push("preai-overhaul.css does not define '.sr-hidden' scroll reveal class!");
  }
  if (!cssContent.includes('.sr-visible')) {
    errors.push("preai-overhaul.css does not define '.sr-visible' scroll reveal class!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css for scroll reveals: " + e.message);
}

// 4. Verify verifyforzoho.html is intact and contains Zoho token
try {
  const zohoFile = 'verifyforzoho.html';
  if (!fs.existsSync(zohoFile)) {
    errors.push("verifyforzoho.html is missing!");
  } else {
    const content = fs.readFileSync(zohoFile, 'utf8').trim();
    if (content !== '93211519') {
      errors.push(`verifyforzoho.html content is incorrect. Found: '${content}', expected: '93211519'`);
    }
  }
} catch (e) {
  errors.push("Failed to verify Zoho file: " + e.message);
}

// 5. Verify preai-overhaul.css contains the left warm feather gradient blending to warm-white
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  if (!cssContent.includes('rgba(250, 249, 247, 1.0) 36%')) {
    errors.push("preai-overhaul.css does not contain the warm-white linear gradient blending overlay at 36% width!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css for gradient blend: " + e.message);
}

// 6. Verify #hero-panel padding has been compacted to respect 100vh layout
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  if (!cssContent.includes('padding: calc(70px + 4vh) 6vw 4vh !important')) {
    errors.push("preai-overhaul.css does not use compact padding for #hero-panel to fit elements in 100vh viewport!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css for hero panel padding: " + e.message);
}

// 7. Verify preai-overhaul.css contains transparent overrides for Zone B
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  if (!cssContent.includes('body.borderless-homepage .zb-section') || !cssContent.includes('background: transparent !important')) {
    errors.push("preai-overhaul.css does not contain transparent overrides for Zone B sections!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css for Zone B transparent overrides: " + e.message);
}

// 8. Verify #scrub-spacer has height 180vh in preai-overhaul.css
try {
  const cssContent = fs.readFileSync('preai-overhaul.css', 'utf8');
  if (!cssContent.includes('height: 180vh !important; /* Provides scroll depth for scrubbing on desktop (shortened for snappy reveal) */')) {
    errors.push("preai-overhaul.css does not contain the 180vh desktop height spacer!");
  }
} catch (e) {
  errors.push("Failed to read preai-overhaul.css for spacer height: " + e.message);
}

// 9. Verify video-scrub.js starts dynamic transition at 40vh and ends at 120vh
try {
  const jsContent = fs.readFileSync('video-scrub.js', 'utf8');
  if (!jsContent.includes("start: '40vh top'") || !jsContent.includes("end: '120vh top'")) {
    errors.push("video-scrub.js does not use 40vh/120vh scroll triggers for video transitions!");
  }
} catch (e) {
  errors.push("Failed to read video-scrub.js: " + e.message);
}

// 10. Verify index.html has timeline start: 'top top'
try {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  if (!indexHtml.includes("start: 'top top'") || !indexHtml.includes("end: function () { return '+=' + getScrollDistance(); }")) {
    errors.push("index.html does not have top top start/end conditions for timeline scroll trigger!");
  }
} catch (e) {
  errors.push("Failed to read index.html: " + e.message);
}

if (errors.length > 0) {
  console.error("❌ Phase 5 Verification failed:");
  errors.forEach(err => console.error("- " + err));
  process.exit(1);
} else {
  console.log("✅ Phase 5 Verification passed successfully!");
}
