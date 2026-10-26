const fs = require('fs');

const files = [
  'parent-dashboard.html',
  'tutor-dashboard.html',
  'parent-progress.html',
  'tutor-attendance.html',
  'tutor-attendance-create.html',
  'tutor-monthly-report.html',
  'tutor-students.html',
  'join-class.html',
  'admin-dashboard.html'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' === (' + (content.length / 1024).toFixed(1) + ' KB)');
  
  // Extract nav / header structure
  const navMatches = content.match(/<nav[\s\S]*?<\/nav>/gi) || [];
  console.log(`  <nav> count: ${navMatches.length}`);
  
  // Extract all buttons and their classes & text
  const buttonMatches = [...content.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi)];
  console.log(`  <button> count: ${buttonMatches.length}`);
  
  // Look for buttons with long text
  const longButtons = buttonMatches
    .map(m => {
      const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
      const attrs = m[1];
      return { text, attrs };
    })
    .filter(b => b.text.length > 20);

  if (longButtons.length > 0) {
    console.log(`  Long button labels (>20 chars): ${longButtons.length}`);
    longButtons.slice(0, 8).forEach(b => console.log(`    - "${b.text}"`));
  }
});
