const fs = require('fs');

['parent-dashboard.html', 'tutor-dashboard.html'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const navs = content.match(/<(nav|header)[^>]*>[\s\S]*?<\/\1>/gi) || [];
  navs.forEach((n, idx) => {
    console.log(`--- Nav #${idx + 1} ---`);
    console.log(n);
  });
});
