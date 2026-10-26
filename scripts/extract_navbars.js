const fs = require('fs');

const files = [
  'parent-dashboard.html',
  'tutor-dashboard.html',
  'tutor-attendance.html',
  'tutor-monthly-report.html',
  'tutor-students.html',
  'parent-progress.html',
  'admin-dashboard.html'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log(`\n========================================\nNAVBAR IN: ${f}\n========================================`);
  
  // Find <nav> or <header>
  const navs = content.match(/<(nav|header)[^>]*>[\s\S]*?<\/\1>/gi) || [];
  navs.forEach((n, idx) => {
    console.log(`--- Nav/Header #${idx + 1} (${n.length} bytes) ---`);
    console.log(n.slice(0, 1500));
  });
});
