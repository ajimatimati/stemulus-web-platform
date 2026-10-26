const fs = require('fs');

['parent-dashboard.html', 'tutor-dashboard.html'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const tabs = [...content.matchAll(/data-tab=["']([^"']+)["']/g)].map(m => m[1]);
  console.log('data-tabs:', [...new Set(tabs)]);
  const tabPanels = [...content.matchAll(/id=["'](tab-[^"']+)["']/g)].map(m => m[1]);
  console.log('tab IDs:', [...new Set(tabPanels)]);
  const navLinks = [...content.matchAll(/<a[^>]*class=["'][^"']*nav[^"']*["'][^>]*>(.*?)<\/a>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('Nav links:', navLinks);
});
