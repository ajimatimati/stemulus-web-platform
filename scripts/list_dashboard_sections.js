const fs = require('fs');

['admin-dashboard.html', 'parent-dashboard.html', 'tutor-dashboard.html'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const dataSections = [...content.matchAll(/data-section=["']([^"']+)["']/g)].map(m => m[1]);
  console.log('data-sections:', [...new Set(dataSections)]);
  const ids = [...content.matchAll(/id=["'](section-[^"']+)["']/g)].map(m => m[1]);
  console.log('section IDs:', [...new Set(ids)]);
});
