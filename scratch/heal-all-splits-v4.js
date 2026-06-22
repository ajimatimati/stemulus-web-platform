const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const ageRanges = new Set([
    '5-9', '5-10', '7-9', '7-10', '7-12', '7-14', '7-16', '10-12', '11-14', '14-17', '5-17', '7-15'
]);

// Clean WhatsApp float button regex and replacement
const waFloatRegex = /<a\s+[^>]*?class="wa-float"[^>]*>[\s\S]+?<\/a>/gi;
const waFloatReplacement = `<a href="https://wa.me/2347052466716?text=Hello%20STEMulus%2C%20I'm%20interested%20in%20a%20coding%20class%20for%20my%20child" class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with STEMulus on WhatsApp">
    <i data-lucide="message-circle" style="width:30px;height:30px;"></i>
</a>`;

// Arrow right SVG replacement
const arrowRightRegex = /<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2-7h10M8-3l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"\/><\/svg>/gi;
const arrowRightReplacement = `<i data-lucide="arrow-right" class="w-3.5 h-3.5 inline-block align-middle ml-1"></i>`;

function smartHealContent(content) {
    let original = content;

    // 1. Replace WhatsApp Float Badge
    content = content.replace(waFloatRegex, waFloatReplacement);

    // 2. Replace Arrow Right SVG
    content = content.replace(arrowRightRegex, arrowRightReplacement);

    // 3. Fix editorial underline SVG path split
    content = content.replace(/Q100,0-195,10/g, 'Q100,0 195,10');
    content = content.replace(/Q100,0-195/g, 'Q100,0 195');

    // 4. Fix specific known splits
    content = content.replace(/#1A23-7E/gi, '#1A237E');
    content = content.replace(/1,20-4\+/g, '1,204+');
    content = content.replace(/1,20-4/g, '1,204');
    content = content.replace(/\+234-705246-6716/g, '+234 705 246 6716');
    content = content.replace(/234-705246-6716/g, '2347052466716');

    // 5. Fix spacing in CSS properties
    content = content.replace(/0-00-4px/g, '0 0 0 4px');
    content = content.replace(/0-16px40px/g, '0 16px 40px');
    content = content.replace(/0-30px80px/g, '0 30px 80px');
    content = content.replace(/0-8px24px/g, '0 8px 24px');
    content = content.replace(/0-8px40px/g, '0 8px 40px');
    content = content.replace(/0-4px20px/g, '0 4px 20px');
    content = content.replace(/0-6px28px/g, '0 6px 28px');
    
    content = content.replace(/margin:\s*0-00\.5rem/g, 'margin:0 0 0.5rem');
    content = content.replace(/margin:\s*0-01rem/g, 'margin:0 0 1rem');
    content = content.replace(/margin:\s*0-02rem/g, 'margin:0 0 2rem');
    content = content.replace(/padding:\s*0-2rem/g, 'padding:0 2rem');

    // 6. Generic Tailwind opacity classes (e.g. text-white/6-5 -> text-white/65)
    content = content.replace(/(\b[a-z0-9-]+\/)(\d+)-(\d+)\b/gi, (match, prefix, d1, d2) => {
        return prefix + d1 + d2;
    });

    // 7. Decimals (e.g. 0.0-4 -> 0.04)
    content = content.replace(/\b(\d+)\.(\d+)-(\d+)\b/g, (match, d1, d2, d3) => {
        return `${d1}.${d2}${d3}`;
    });

    // 8. Hex color codes inside styles or CSS
    content = content.replace(/#([A-Fa-f0-9]+)-([A-Fa-f0-9]+)\b/g, (match, hex1, hex2) => {
        if ((hex1 + hex2).length === 6 || (hex1 + hex2).length === 3 || (hex1 + hex2).length === 8) {
            return '#' + hex1 + hex2;
        }
        return match;
    });

    // 9. Generic hyphenated numbers (excluding age ranges)
    content = content.replace(/\b(\d+)-(\d+)\b/g, (match, d1, d2) => {
        if (ageRanges.has(match)) {
            return match; // Keep age range intact
        }
        // Also skip phone format parts if they start with 234 or look like phone parts
        if (d1 === '234' || d1.length === 6 || d2.length === 6) {
            return match;
        }
        // Otherwise, it's a split number!
        return d1 + d2;
    });

    return content;
}

function healFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const healed = smartHealContent(content);

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Smart healed splits in: ${path.basename(filePath)}`);
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

console.log('Running global smart HTML/CSS split healing...');
scanDir(rootDir);
console.log('Smart healing completed!');
