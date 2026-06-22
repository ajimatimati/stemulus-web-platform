const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Regex for emojis (excluding hearts ♥ \u2665 and ❤ \u2764)
const emojiRegex = /[\u{1F300}-\u{1FDFF}\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const emdashRegex = /[—–]|&mdash;|&ndash;/g;
// Mojibake-like patterns (e.g. â, Ã, æ, ™ etc in weird combinations)
const mojibakeRegex = /[âÃæœ]/g; 

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let found = [];

    lines.forEach((line, index) => {
        // Exclude footer lines containing ♥ or heart
        if (line.includes('♥') || line.includes('fa-heart') || line.includes('text-red-500')) {
            // But check if there are other emojis on the same line
            const matches = line.match(emojiRegex);
            if (matches && matches.length > 0) {
                // If only hearts, ignore. Otherwise check.
            }
        }

        const emojis = line.match(emojiRegex);
        if (emojis) {
            found.push(`Line ${index + 1} (Emoji): ${emojis.join(', ')} -> "${line.trim()}"`);
        }

        const dashes = line.match(emdashRegex);
        if (dashes) {
            found.push(`Line ${index + 1} (Dash): ${dashes.join(', ')} -> "${line.trim()}"`);
        }

        const mojis = line.match(mojibakeRegex);
        if (mojis) {
            // Avoid false positives like normal text, e.g. code/libraries containing those characters in rare cases
            if (line.includes('â•') || line.includes('Ã¢') || line.includes('â─') || line.includes('Ã─') || line.includes('Â·')) {
                found.push(`Line ${index + 1} (Mojibake): "${line.trim()}"`);
            }
        }
    });

    if (found.length > 0) {
        console.log(`\n--- File: ${path.basename(filePath)} ---`);
        found.forEach(f => console.log(f));
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
            scanFile(fullPath);
        }
    }
}

console.log('Scanning HTML files for emojis, emdashes, and mojibakes...');
scanHtmlFiles(rootDir);
console.log('\nScan complete.');
