const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const splitRegex = /\b\d+-\d+\b/g;

function countSplits(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(splitRegex);
    return matches ? matches.length : 0;
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
            const count = countSplits(fullPath);
            if (count > 0) {
                console.log(`${path.basename(fullPath)}: ${count} splits`);
            }
        }
    }
}

console.log('Counting splits per file...');
scanDir(rootDir);
