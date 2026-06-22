const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html');

let totalUpdated = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Search for ScrollTrigger.create that modifies main-nav with mixBlendMode
    const targetPattern = /ScrollTrigger\.create\(\{\s*trigger\s*:\s*['"]body['"],\s*start\s*:\s*['"]200px top['"],[\s\S]*?onLeaveBack[\s\S]*?\}\);/g;
    
    if (targetPattern.test(content)) {
        content = content.replace(targetPattern, '');
        changed = true;
    }

    // Also look for another variation if spacing differs
    const targetPattern2 = /ScrollTrigger\.create\(\{\s*trigger:\s*['"]body['"],\s*start:\s*['"]200px top['"],[\s\S]*?onLeaveBack[\s\S]*?\}\);/g;
    if (targetPattern2.test(content)) {
        content = content.replace(targetPattern2, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Removed nav scroll trigger from ${file}`);
        totalUpdated++;
    }
});

console.log(`\nUpdated ${totalUpdated} files.`);
