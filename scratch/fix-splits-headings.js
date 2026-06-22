const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function fixContent(content, fileName) {
    let c = content;

    // 1. Fix split headings like <h 1, <h 2, <h 3, <h 4, <h 5, <h 6, </h 1, etc.
    c = c.replace(/<h\s+(\d)(?=\s|>)/gi, '<h$1');
    c = c.replace(/<\/h\s+(\d)(?=\s|>)/gi, '</h$1');

    // 2. Fix split hex colors like #1a 2332, #1d 1d1f, #f4 600c
    // Let's find any "#" followed by hex characters with spaces that add up to 6 hex chars.
    // e.g. #1a 2332 -> #1a2332
    // #1d 1d1f -> #1d1d1f
    // #f4 600c -> #f4600c
    // #1a 2332 -> #1a2332
    c = c.replace(/#([0-9a-fA-F])\s+([0-9a-fA-F]{5})\b/g, '#$1$2');
    c = c.replace(/#([0-9a-fA-F]{2})\s+([0-9a-fA-F]{4})\b/g, '#$1$2');
    c = c.replace(/#([0-9a-fA-F]{3})\s+([0-9a-fA-F]{3})\b/g, '#$1$2');
    c = c.replace(/#([0-9a-fA-F]{4})\s+([0-9a-fA-F]{2})\b/g, '#$1$2');
    c = c.replace(/#([0-9a-fA-F]{5})\s+([0-9a-fA-F])\b/g, '#$1$2');
    
    // Also support double-split hex colors if any (e.g. #1a 23 32 -> #1a2332)
    c = c.replace(/#([0-9a-fA-F]{2})\s+([0-9a-fA-F]{2})\s+([0-9a-fA-F]{2})\b/g, '#$1$2$3');

    // 3. Fix unsplash photo URLs with spaces in the ID
    // Match any unsplash photo path containing space(s) before query params
    // e.g., https://images.unsplash.com/photo-1513364776144-60967b 0f 800f?w=800
    // We want to remove the spaces in the path part of the Unsplash URL.
    c = c.replace(/(https?:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9_\-\s]+)/g, (match) => {
        return match.replace(/\s+/g, '');
    });

    // 4. Fix specific files known to have other space issues
    // Let's check for "font-family:'Nunito',sans-serif" or color values
    c = c.replace(/color:#1a\s+2332/g, 'color:#1a2332');

    return c;
}

function healFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const healed = fixContent(content, path.basename(filePath));

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Healed: ${path.basename(filePath)}`);
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

console.log('Running split headings & hex colors healing pass...');
scanDir(rootDir);
console.log('Split headings & hex colors healing complete!');
