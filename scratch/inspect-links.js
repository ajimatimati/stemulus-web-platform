const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

// Check pricing link exact format in scratch-creators.html
const sc = fs.readFileSync(path.join(ROOT, 'scratch-creators.html'), 'utf8');
const lines = sc.split('\n');
const results = { pricingLines: [], deepscrubLines: [], adminDupIds: [], programsMainTag: [] };

lines.forEach((l, i) => {
  if (l.toLowerCase().includes('pricing')) {
    results.pricingLines.push({ line: i+1, content: l.trim().substring(0, 200) });
  }
});

// Check deep-scrub.js
const ds = fs.readFileSync(path.join(ROOT, 'deep-scrub.js'), 'utf8');
ds.split('\n').forEach((l, i) => {
  results.deepscrubLines.push({ line: i+1, content: l });
});

// Check admin-dashboard duplicate IDs
const ad = fs.readFileSync(path.join(ROOT, 'admin-dashboard.html'), 'utf8');
const idMatches = ad.match(/id="auto-[^"]+"/g) || [];
results.adminDupIds = idMatches;

// Check programs.html for </main> tag
const pr = fs.readFileSync(path.join(ROOT, 'programs.html'), 'utf8');
pr.split('\n').forEach((l, i) => {
  if (l.includes('</main>') || l.includes('id="pricing"')) {
    results.programsMainTag.push({ line: i+1, content: l.trim() });
  }
});

fs.writeFileSync(path.join(ROOT, 'scratch', 'inspect-links-result.json'), JSON.stringify(results, null, 2));
console.log('Done. Check scratch/inspect-links-result.json');
console.log('Pricing lines in scratch-creators.html:', results.pricingLines.length);
console.log('deep-scrub.js line count:', results.deepscrubLines.length);
console.log('Admin dup IDs found:', results.adminDupIds);
console.log('programs.html main/pricing tags:', results.programsMainTag);
