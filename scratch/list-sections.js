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
    if (!fs.existsSync(filePath)) {
        console.log(`Missing file: ${file}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n=== Headings for ${file} ===`);
    lines.forEach((line, idx) => {
        if (line.includes('<h1') || line.includes('<h2') || line.includes('<section id="curriculum"') || line.includes('FAQ') || line.includes('faq')) {
            console.log(`${idx + 1}: ${line.trim()}`);
        }
    });
});
