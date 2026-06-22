const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixContent(content, fileName) {
    let c = content;

    // Fix split hex colors where spaces were introduced between hex digits
    // e.g. #faf 9f 7 -> #faf9f7, #f 5f 0e 8 -> #f5f0e8, #e 5e 7eb -> #e5e7eb
    c = c.replace(/#([a-fA-F0-9\s]+)/gi, (match, hexPart) => {
        // Strip all whitespace
        const cleanHex = hexPart.replace(/\s+/g, '');
        // Check if the cleaned hex consists of exactly 3, 4, 6, or 8 hex characters
        if (/^[a-f0-9]{3}$|^[a-f0-9]{4}$|^[a-f0-9]{6}$|^[a-f0-9]{8}$/i.test(cleanHex)) {
            return '#' + cleanHex;
        }
        return match;
    });

    return c;
}

function healFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const healed = fixContent(content, path.basename(filePath));

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Healed colors: ${path.basename(filePath)}`);
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
            healFile(fullPath);
        }
    }
}

console.log('Running split hex colors healing pass...');
scanDir(rootDir);
console.log('Split hex colors healing complete!');
