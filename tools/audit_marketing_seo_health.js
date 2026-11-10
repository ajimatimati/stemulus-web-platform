const fs = require('fs');

console.log('================================================================');
console.log('MARKETING WEBSITE SEO & GEO HEALTH AUDIT');
console.log('================================================================\n');

const pages = [
  'index.html',
  'programs.html',
  'for-parents.html',
  'book-class.html',
  'enroll.html',
  'python-programming.html',
  'scratch-creators.html',
  'web-wizards.html'
];

let allPassed = true;

pages.forEach(p => {
  const c = fs.readFileSync(p, 'utf8');
  const hasTitle = /<title>[^<]+<\/title>/.test(c);
  const hasDesc = /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(c);
  const hasOgTitle = /<meta\s+property=["']og:title["']/i.test(c);
  const hasOgDesc = /<meta\s+property=["']og:description["']/i.test(c);
  const hasCanonical = /<link\s+rel=["']canonical["']/i.test(c);
  const hasSchema = c.includes('organization-schema') || c.includes('application/ld+json');

  const ok = hasTitle && hasDesc && hasOgTitle && hasOgDesc && hasCanonical && hasSchema;
  if (!ok) allPassed = false;

  console.log(`${p.padEnd(25)} -> Title: ${hasTitle ? '✅' : '❌'} | Desc: ${hasDesc ? '✅' : '❌'} | OG: ${(hasOgTitle && hasOgDesc) ? '✅' : '❌'} | Canonical: ${hasCanonical ? '✅' : '❌'} | Schema: ${hasSchema ? '✅' : '❌'}`);
});

console.log('\n================================================================');
console.log('SEO/GEO AUDIT RESULT:', allPassed ? '100% PERFECT HEALTH' : 'DEFECTS FOUND');
console.log('================================================================');
