const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const healingReplacements = [
    // 1. Long digits (phones, sizes, etc.)
    { search: /2-3-4-7-0-5-2-4-6-6-7-1-6/g, replace: '2347052466716' },
    { search: /8-9-4-3-7-3-6/g, replace: '8943736' },
    { search: /7-9-8-0-3-2-8/g, replace: '7980328' },
    { search: /8-1-8-9-2-2-8/g, replace: '8189228' },
    { search: /7-6-5-0-3-9/g, replace: '765039' },
    { search: /7-8-3-3-1-4/g, replace: '783314' },
    { search: /5-6-1-1-9-3/g, replace: '561193' },
    { search: /9-3-5-4-8-4/g, replace: '935484' },
    { search: /5-6-5-2-4/g, replace: '56524' },
    { search: /1-8-9-3-6-1/g, replace: '189361' },
    { search: /8-0-9-0/g, replace: '8090' },
    { search: /2-0-2-5/g, replace: '2025' },
    { search: /2-0-2-6/g, replace: '2026' },
    { search: /1-5-0-0/g, replace: '1500' },
    
    // 2. Three-digit numbers
    { search: /3-0-0/g, replace: '300' },
    { search: /5-0-0/g, replace: '500' },
    { search: /7-0-0/g, replace: '700' },
    
    // 3. Two-digit numbers
    { search: /1-0/g, replace: '10' },
    { search: /1-1/g, replace: '11' },
    { search: /1-2/g, replace: '12' },
    { search: /1-3/g, replace: '13' },
    { search: /1-4/g, replace: '14' },
    { search: /1-5/g, replace: '15' },
    { search: /1-6/g, replace: '16' },
    { search: /1-7/g, replace: '17' },
    { search: /1-8/g, replace: '18' },
    { search: /2-0/g, replace: '20' },
    { search: /2-4/g, replace: '24' },
    { search: /2-5/g, replace: '25' },
    { search: /2-8/g, replace: '28' },
    { search: /3-0/g, replace: '30' },
    { search: /3-2/g, replace: '32' },
    { search: /4-0/g, replace: '40' },
    { search: /5-0/g, replace: '50' },
    { search: /5-2/g, replace: '52' },
    { search: /5-6/g, replace: '56' },
    { search: /6-0/g, replace: '60' },
    { search: /6-4/g, replace: '64' },
    { search: /8-0/g, replace: '80' },
    { search: /9-0/g, replace: '90' },
    { search: /9-6/g, replace: '96' }
];

function healFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove the center dot and space prefix
    content = content.replace(/· /g, '');
    
    // Apply the number healing replacements
    for (const r of healingReplacements) {
        content = content.replace(r.search, r.replace);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Healed: ${path.basename(filePath)}`);
    }
}

function scanHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
                scanHtmlFiles(fullPath);
            }
        } else if (file.endsWith('.html')) {
            healFile(fullPath);
        }
    }
}

console.log('Healing numbers split by the previous script...');
scanHtmlFiles(rootDir);
console.log('Number healing complete!');
