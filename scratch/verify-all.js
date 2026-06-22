const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

const allHtml = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const report = { pass: [], warn: [], fail: [] };

// ── CHECK 1: No old pricing.html links remain ─────────────────────────────
let oldPricingCount = 0;
allHtml.forEach(f => {
  if (read(f).includes('href="pricing.html"')) {
    report.fail.push(`OLD PRICING LINK: ${f}`);
    oldPricingCount++;
  }
});
if (oldPricingCount === 0) report.pass.push('No old pricing.html links found across all HTML files');

// ── CHECK 2: programs.html has #pricing section ───────────────────────────
const pr = read('programs.html');
if (pr.includes('id="pricing"')) {
  report.pass.push('programs.html has id="pricing" section');
} else {
  report.fail.push('programs.html is MISSING id="pricing" section');
}
if (pr.includes('Simple, Transparent Pricing')) {
  report.pass.push('programs.html pricing section contains correct heading');
} else {
  report.fail.push('programs.html pricing heading missing');
}
if (pr.includes('Frequently Asked Questions')) {
  report.pass.push('programs.html FAQ section present');
} else {
  report.fail.push('programs.html FAQ section missing');
}

// ── CHECK 3: Program subpages have flat pricing cards ────────────────────
const programPages = [
  { file: 'scratch-creators.html', price: '$50', tier: 'Starter' },
  { file: 'junior-robotics.html',  price: '$50', tier: 'Starter' },
  { file: 'creative-coding.html',  price: '$50', tier: 'Starter' },
  { file: 'digital-art.html',      price: '$50', tier: 'Starter' },
  { file: 'web-wizards.html',      price: '$80', tier: 'Advanced' },
  { file: 'python-programming.html', price: '$80', tier: 'Advanced' },
  { file: 'arduino-robotics.html',  price: '$80', tier: 'Advanced' },
  { file: 'ai-machine-learning.html', price: '$80', tier: 'Advanced' },
  { file: 'fullstack-web-dev.html',  price: '$80', tier: 'Advanced' },
];
programPages.forEach(({ file, price, tier }) => {
  const c = read(file);
  if (c.includes(price) && c.includes('Programme Fee')) {
    report.pass.push(`${file}: flat pricing card (${price}) present`);
  } else if (c.includes(price)) {
    report.warn.push(`${file}: has price ${price} but "Programme Fee" heading not found — check layout`);
  } else {
    report.fail.push(`${file}: MISSING flat pricing card (${price})`);
  }
  // Check glassmorphism removal
  const glassCount = (c.match(/backdrop-blur-md/g) || []).length;
  if (glassCount === 0) {
    report.pass.push(`${file}: backdrop-blur-md removed`);
  } else {
    report.warn.push(`${file}: ${glassCount} remaining backdrop-blur-md instances`);
  }
  // Check AI phrase removal
  if (c.includes('Perfect for building a strong foundation with personalized guidance')) {
    report.fail.push(`${file}: AI phrase "Perfect for building..." still present`);
  } else {
    report.pass.push(`${file}: AI phrase removed`);
  }
});

// ── CHECK 4: Admin dashboard duplicate IDs ────────────────────────────────
const ad = read('admin-dashboard.html');
const idMatches = ad.match(/id="auto-[^"]+"/g) || [];
const idCounts = {};
idMatches.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const dups = Object.entries(idCounts).filter(([,c]) => c > 1);
if (dups.length === 0) {
  report.pass.push('admin-dashboard.html: no duplicate automation IDs');
} else {
  dups.forEach(([id, c]) => report.fail.push(`admin-dashboard.html: duplicate ID ${id} (${c}x)`));
}

// ── CHECK 5: enroll.html sparkle emoji removed ────────────────────────────
const en = read('enroll.html');
if (!en.includes('✨')) {
  report.pass.push('enroll.html: sparkle emoji removed');
} else {
  report.warn.push('enroll.html: sparkle emoji still present');
}
if (en.includes("Enter the student")) {
  report.pass.push('enroll.html: AI personalization copy replaced');
} else {
  report.warn.push('enroll.html: check personalization copy replacement');
}

// ── CHECK 6: verify-certificate.html SVG star ────────────────────────────
const vc = read('verify-certificate.html');
if (vc.includes('M12 2l3.09 6.26L22 9.27')) {
  report.pass.push('verify-certificate.html: star SVG path is correct');
} else {
  report.warn.push('verify-certificate.html: star SVG path format — review manually');
}

// ── CHECK 7: join-as-tutor.html AI copy removal ───────────────────────────
const jt = read('join-as-tutor.html');
if (jt.includes('No chaotic private mentor sessions')) {
  report.fail.push('join-as-tutor.html: old AI phrase still present');
} else {
  report.pass.push('join-as-tutor.html: AI copy removed');
}

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log('\n========= VERIFICATION REPORT =========');
console.log(`\nPASS (${report.pass.length}):`);
report.pass.forEach(m => console.log('  ✓', m));
if (report.warn.length) {
  console.log(`\nWARN (${report.warn.length}):`);
  report.warn.forEach(m => console.log('  ⚠', m));
}
if (report.fail.length) {
  console.log(`\nFAIL (${report.fail.length}):`);
  report.fail.forEach(m => console.log('  ✗', m));
}
console.log('\n=======================================');
console.log(`Score: ${report.pass.length} pass / ${report.warn.length} warn / ${report.fail.length} fail`);

fs.writeFileSync(
  path.join(ROOT, 'scratch', 'verification-report.json'),
  JSON.stringify(report, null, 2)
);
