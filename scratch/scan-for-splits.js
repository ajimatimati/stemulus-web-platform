const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const splitRegex = /\b\d+-\d+\b/g;

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(splitRegex);
    if (matches) {
        console.log(`\n--- File: ${path.basename(filePath)} (${matches.length} splits) ---`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.match(splitRegex)) {
                console.log(`Line ${idx + 1}: "${line.trim()}"`);
            }
        });
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
            scanFile(fullPath);
        }
    }
}

console.log('Scanning files for hyphenated number patterns (e.g. 24-4)...');
scanDir(rootDir);
console.log('\nScan complete.');
