const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\index.html', 'utf8');
const lines = content.split('\n');

// Find scroll hint
lines.forEach((l, idx) => {
  if (l.includes('id="scroll-hint"')) {
    console.log(`Scroll hint start line: ${idx + 1}`);
    console.log(`Lines 283-291:`);
    for (let i = idx - 2; i <= idx + 4; i++) {
      console.log(`  ${i+1}: ${lines[i]}`);
    }
  }
});

// Find testimonials section
let startIdx = -1;
let endIdx = -1;
lines.forEach((l, idx) => {
  if (l.includes('id="testimonials-section"')) {
    startIdx = idx;
  }
  if (startIdx !== -1 && endIdx === -1 && l.includes('</section>') && idx > startIdx) {
    // We need the next section closing tag
    // Let's count sections or find the correct closing section tag
    if (lines[idx].includes('</section>')) {
      endIdx = idx;
    }
  }
});

if (startIdx !== -1) {
  console.log(`\nTestimonials section start line: ${startIdx + 1}`);
  console.log(`Lines around start:`);
  for (let i = startIdx - 1; i <= startIdx + 3; i++) {
    console.log(`  ${i+1}: ${lines[i]}`);
  }
  
  // Find the exact closing section tag
  // Testimonials ends before the footer or before the next section
  // Let's search from startIdx to find when the next section or footer starts
  let testimonialsEnd = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('<!-- ══════════════════════════════════════════════')) {
      // the next comment divider
      testimonialsEnd = i;
      break;
    }
    if (lines[i].includes('<section') && i > startIdx) {
      testimonialsEnd = i;
      break;
    }
    if (lines[i].includes('<footer') && i > startIdx) {
      testimonialsEnd = i;
      break;
    }
  }
  console.log(`Testimonials section ends around line: ${testimonialsEnd}`);
  console.log(`Lines around end:`);
  for (let i = testimonialsEnd - 5; i <= testimonialsEnd + 2; i++) {
    console.log(`  ${i+1}: ${lines[i]}`);
  }
}
