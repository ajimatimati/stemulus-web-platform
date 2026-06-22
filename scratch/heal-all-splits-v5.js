const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const ageRanges = new Set([
    '5-9', '5-10', '7-9', '7-10', '7-12', '7-14', '7-16', '10-12', '11-14', '14-17', '5-17', '7-15'
]);

function smartHealContent(content, fileName) {
    let original = content;

    // 1. Specific SVG replacements in verify-certificate.html
    if (fileName === 'verify-certificate.html') {
        // Watermark SVG
        content = content.replace(/<svg class="w-64 h-64"[\s\S]+?<\/svg>/gi, '<i data-lucide="award" class="w-64 h-64"></i>');
        // Check success SVG
        content = content.replace(/<svg class="w-6 h-6 text-\[\#10B981\]"[\s\S]+?<\/svg>/gi, '<i data-lucide="shield-check" class="w-6 h-6 text-[#10B981]"></i>');
        content = content.replace(/<svg class="w-6 h-6 text-\[\#10B98-1\]"[\s\S]+?<\/svg>/gi, '<i data-lucide="shield-check" class="w-6 h-6 text-[#10B981]"></i>');
    }

    // 2. Generic WhatsApp float button replacement
    const waFloatRegex = /<a\s+[^>]*?class="wa-float"[^>]*>[\s\S]+?<\/a>/gi;
    const waFloatReplacement = `<a href="https://wa.me/2347052466716?text=Hello%20STEMulus%2C%20I'm%20interested%20in%20a%20coding%20class%20for%20my%20child" class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with STEMulus on WhatsApp">
    <i data-lucide="message-circle" style="width:30px;height:30px;"></i>
</a>`;
    content = content.replace(waFloatRegex, waFloatReplacement);

    // 3. Spacing in linear gradients and color percentages
    content = content.replace(/linear-gradient\(([^)]+?)\)/gi, (match, inner) => {
        // Fix 13-5deg -> 135deg
        let fixed = inner.replace(/13-5deg/g, '135deg');
        // Fix #059669-100% -> #059669 100%
        fixed = fixed.replace(/#059669-100%/g, '#059669 100%');
        fixed = fixed.replace(/#10B9810%/g, '#10B981 0%');
        return `linear-gradient(${fixed})`;
    });

    // 4. Heal rgba/rgb blocks comprehensively (even if they look like age ranges like 5-9)
    content = content.replace(/rgba?\(([^)]+?)\)/gi, (match, inner) => {
        const fixed = inner.replace(/(\d+)-(\d+)/g, '$1$2');
        return match.replace(inner, fixed);
    });

    // 5. Generic hyphenated numbers v5 (handles deg, px, rem suffix, excludes age ranges)
    content = content.replace(/\b(\d+)-(\d+)(?=[a-zA-Z%]+|\b)/g, (match, d1, d2) => {
        if (ageRanges.has(match)) {
            return match; // Keep age range intact
        }
        // Skip phone number blocks
        if (d1 === '234' || d1.length === 6 || d2.length === 6) {
            return match;
        }
        // Merge!
        return d1 + d2;
    });

    // 6. Handle specific remaining phone placeholders
    content = content.replace(/\+234-800000-0000/g, '+234 800 000 0000');
    content = content.replace(/234-800000-0000/g, '2348000000000');

    return content;
}

function healFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const healed = smartHealContent(content, path.basename(filePath));

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Healed splits v5 in: ${path.basename(filePath)}`);
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

console.log('Running global smart HTML/CSS split healing v5...');
scanDir(rootDir);
console.log('Smart healing v5 completed!');
