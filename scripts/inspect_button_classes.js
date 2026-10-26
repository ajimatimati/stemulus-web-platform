const fs = require('fs');

function inspectButtonsInFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n========================================\nFILE: ${file}\n========================================`);
  
  // Find all buttons, links styled as buttons, navbars
  const regex = /<(button|a)[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const classes = match[2];
    const rawInner = match[3];
    const text = rawInner.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    
    // Check if this looks like a button or nav item
    const isButton = tag === 'button' || classes.includes('btn') || classes.includes('nav-link') || classes.includes('pill') || classes.includes('tab');
    if (!isButton) continue;

    // Check potential mobile issues:
    // 1. Long text without whitespace-normal, truncate, or responsive text sizing
    // 2. Fixed min-w or w- that exceeds 320px
    // 3. Flex container without flex-wrap
    const hasResponsiveText = /text-\[(?:1[0-2]|8|9)px\]|text-xs|sm:text-|md:text-/i.test(classes);
    const hasNowrap = /whitespace-nowrap/.test(classes);
    const hasFixedLargeWidth = /w-(?:64|72|80|96|\d{3,}px)|min-w-\[\d{3,}px\]/.test(classes);
    
    if (text.length > 18) {
      console.log(`[${tag.toUpperCase()}] Text: "${text}" (${text.length} chars)`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Flags: hasResponsiveText=${hasResponsiveText}, hasNowrap=${hasNowrap}, hasFixedLargeWidth=${hasFixedLargeWidth}`);
    }
  }
}

['parent-dashboard.html', 'tutor-dashboard.html', 'tutor-attendance-create.html', 'tutor-attendance.html', 'tutor-monthly-report.html', 'tutor-students.html', 'join-class.html', 'parent-progress.html', 'admin-dashboard.html'].forEach(inspectButtonsInFile);
