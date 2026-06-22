const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';
const programPages = [
    'scratch-creators.html',
    'junior-robotics.html',
    'creative-coding.html',
    'digital-art.html',
    'web-wizards.html',
    'python-programming.html',
    'arduino-robotics.html',
    'ai-machine-learning.html',
    'fullstack-web-dev.html'
];

programPages.forEach(file => {
    const filePath = path.join(WORKSPACE_DIR, file);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n=== Pricing Section Context for ${file} ===`);
    let found = false;
    lines.forEach((line, idx) => {
        if (line.includes('Investment') || line.includes('investment') || line.includes('Start Their Journey') || line.includes('Choose Basic') || line.includes('Choose Advanced')) {
            const start = Math.max(0, idx - 8);
            const end = Math.min(lines.length - 1, idx + 10);
            console.log(`Lines ${start + 1}-${end + 1}:`);
            console.log(lines.slice(start, end + 1).map((l, i) => `  ${start + i + 1}: ${l}`).join('\n'));
            found = true;
        }
    });
    if (!found) {
        console.log("Not found.");
    }
});
