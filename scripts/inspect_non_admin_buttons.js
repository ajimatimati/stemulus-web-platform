const fs = require('fs');

function inspectButtonsInFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n========================================\nFILE: ${file}\n========================================`);
  
  const regex = /<(button|a)[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const classes = match[2];
    const rawInner = match[3];
    const text = rawInner.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    
    const isButton = tag === 'button' || classes.includes('btn') || classes.includes('nav-link') || classes.includes('pill') || classes.includes('tab');
    if (!isButton) continue;

    if (text.length > 15) {
      console.log(`[${tag.toUpperCase()}] Text: "${text}" (${text.length} chars)`);
      console.log(`  Classes: ${classes}`);
    }
  }
}

['parent-dashboard.html', 'tutor-dashboard.html', 'tutor-attendance-create.html', 'tutor-attendance.html', 'tutor-monthly-report.html', 'tutor-students.html', 'join-class.html', 'parent-progress.html'].forEach(inspectButtonsInFile);
