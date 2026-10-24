const fs = require('fs');

const files = [
  'admin-dashboard.html',
  'parent-dashboard.html',
  'tutor-dashboard.html',
  'join-class.html',
  'parent-progress.html',
  'tutor-attendance.html',
  'tutor-attendance-create.html',
  'tutor-monthly-report.html',
  'tutor-students.html',
  'referral-dashboard.html',
  'tutor-evaluation.html',
  'parent-login.html',
  'admin-login.html',
  'tutor-login.html'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=================== ${file} ===================`);
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let unminified = [];
  let allScripts = [];
  while ((match = scriptRegex.exec(content)) !== null) {
    allScripts.push(match[1]);
    const src = match[1].split('?')[0];
    if (src.startsWith('assets/js/') && !src.endsWith('.min.js')) {
      unminified.push(match[1]);
    }
  }
  console.log(`Total scripts: ${allScripts.length}`);
  console.log(`Has stemulus-firestore: ${allScripts.some(s => s.includes('stemulus-firestore'))}`);
  console.log(`Unminified assets/js (${unminified.length}):`);
  unminified.forEach(s => console.log('  - ' + s));
});
