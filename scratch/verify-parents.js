const fs = require('fs');
const c = fs.readFileSync('for-parents.html', 'utf8');
const lines = c.split('\n').length;
const size = (fs.statSync('for-parents.html').size / 1024).toFixed(1);

const checks = {
  hasHero:         c.includes('fp-hero'),
  hasStatsBar:     c.includes('fp-stats-bar'),
  hasHowSteps:     c.includes('fp-steps'),
  hasDashMock:     c.includes('fp-dash-mock'),
  hasSafetyGrid:   c.includes('fp-safety-grid'),
  hasTestimonials: c.includes('fp-chat-card'),
  hasFAQ:          c.includes('fp-faq'),
  hasCTA:          c.includes('fp-cta'),
  hasNavigation:   c.includes('nav-editorial'),
  hasFooter:       c.includes('footer-editorial'),
  hasMobileNav:    c.includes('mobile-nav.js'),
  noBrokenPricing: !c.includes('href="pricing.html"'),
  hasEnrollCTA:    c.includes('enroll.html'),
  hasDarkHero:     c.includes('background: var(--navy)') || c.includes('background:var(--navy)') || c.includes('bg-color:var(--navy)') || c.includes("background: '#0d1b2a'") || c.includes('fp-hero__h1'),
  hasAccordion:    c.includes('details') && c.includes('summary'),
};

console.log('Lines:', lines, '| Size:', size + 'KB');
console.log('');
let pass = 0, fail = 0;
Object.entries(checks).forEach(([k, v]) => {
  console.log((v ? 'PASS' : 'FAIL'), k);
  if (v) pass++; else fail++;
});
console.log('');
console.log('Result:', pass, 'pass /', fail, 'fail');
