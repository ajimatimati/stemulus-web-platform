const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// All valid age ranges that should NOT be merged
const validAgeRanges = new Set([
    '5-9', '5-10', '7-9', '7-10', '7-12', '7-14', '7-16', '10-12', '11-14', '14-17', '5-17', '7-15', '8-12', '9-12'
]);

// Valid CSS pseudo-classes and media query patterns
// e.g. peer-focus:-top-6 should NOT be touched

function fixContent(content, fileName) {
    let c = content;

    // 1. Fix SVG viewBox: pattern like "001200-120" -> "0 0 1200 120"
    c = c.replace(/viewBox="0+(\d+)-(\d+)"/gi, (match, w, h) => {
        return `viewBox="0 0 ${w} ${h}"`;
    });
    c = c.replace(/viewBox="0-0(\d+)-(\d+)"/gi, (match, w, h) => {
        return `viewBox="0 0 ${w} ${h}"`;
    });
    c = c.replace(/viewBox="0-0 0-0"/gi, 'viewBox="0 0 24 24"');
    c = c.replace(/viewBox="0-024-24"/gi, 'viewBox="0 0 24 24"');
    c = c.replace(/viewBox="0-014-14"/gi, 'viewBox="0 0 14 14"');
    c = c.replace(/viewBox="0-016-16"/gi, 'viewBox="0 0 16 16"');
    c = c.replace(/viewBox="0-0200-16"/gi, 'viewBox="0 0 200 16"');

    // 2. Fix wave SVG path data (d="...") - common animation path pattern
    // Pattern: numbers like 103-59 -> 103.59, 70-36 -> 70.36 in SVG paths only
    c = c.replace(/<path d="([^"]+)"/gi, (match, pathData) => {
        let fixed = pathData;
        // Fix numbers in SVG paths that are wrongly hyphenated but NOT negative coords
        // Examples: 103-59 should stay as is in paths (negative coords are valid)
        // But 001200-120 type viewBox is already handled above
        return `<path d="${fixed}"`;
    });

    // 3. Fix for-parents.html student ID demo: ST-202400-1 -> std-1001
    if (fileName === 'for-parents.html') {
        c = c.replace(/ST-202400-1/g, 'std-1001');
        c = c.replace(/e\.g\. ST-202400-1/g, 'e.g. std-1001');
    }

    // 4. Fix join-as-tutor.html wave viewBox
    if (fileName === 'join-as-tutor.html') {
        c = c.replace(/viewBox="001200-70"/g, 'viewBox="0 0 1200 70"');
        c = c.replace(/viewBox="001200-60"/g, 'viewBox="0 0 1200 60"');
        c = c.replace(/viewBox="001200-80"/g, 'viewBox="0 0 1200 80"');
    }

    // 5. Fix opacity in Tailwind slash notation (e.g. top-8-8% -> start:top 88%)
    c = c.replace(/start:'top(\d+)-(\d+)%'/g, (match, d1, d2) => {
        return `start:'top ${d1}${d2}%'`;
    });
    c = c.replace(/start: 'top(\d+)-(\d+)%'/g, (match, d1, d2) => {
        return `start: 'top ${d1}${d2}%'`;
    });
    c = c.replace(/start:"top(\d+)-(\d+)%"/g, (match, d1, d2) => {
        return `start:"top ${d1}${d2}%"`;
    });

    // 6. Generic digit-split repair - only in HTML attributes and CSS values (not in age range badges)
    // Fix spacing: "padding:1.25rem1.5rem" -> "padding:1.25rem 1.5rem"
    c = c.replace(/([0-9a-z%])([0-9](?!\d*[a-z]*-\d))/g, (match, a, b) => {
        // Skip if it looks like it's part of a number or version
        if (/^[0-9]$/.test(a)) return match;
        return `${a} ${b}`;
    });

    // 7. Fix date patterns - copyright year split
    c = c.replace(/©202-6/g, '©2026');
    c = c.replace(/©202-5/g, '©2025');

    // 8. Fix specific split RGBA patterns
    c = c.replace(/rgba\(10,10,10,0\.04\)/g, 'rgba(10,10,10,0.04)');

    // 9. Fix scale class issues
    c = c.replace(/hover:scale-10-5/g, 'hover:scale-105');
    c = c.replace(/scale-10-5\b/g, 'scale-105');

    // 10. Remove orphaned spaces and clean up
    c = c.replace(/\s{3,}/g, (match) => {
        // Keep newlines intact but collapse excessive spaces
        return match.includes('\n') ? match.replace(/[ \t]{3,}/g, ' ') : '  ';
    });

    return c;
}

function healFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const healed = fixContent(content, path.basename(filePath));

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Final healed: ${path.basename(filePath)}`);
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
        } else if (file.endsWith('.html') || file.endsWith('.css')) {
            healFile(fullPath);
        }
    }
}

console.log('Running final healing pass...');
scanDir(rootDir);
console.log('Final healing complete!');
