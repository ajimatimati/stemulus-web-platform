const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

const emojiRegex = /\p{Extended_Pictographic}/gu;
const replacementCharRegex = /\uFFFD/g;

console.log("=== SCANNING FOR EMOJIS & MOJIBAKES IN ROOT FILES ===");
let totalFound = 0;

// Only read files in the root directory
fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
        return; // Skip folders
    }
    
    if (!file.endsWith('.html') && !file.endsWith('.js')) {
        return; // Only HTML and JS files in root
    }
    
    if (file === 'tailwind.js' || file === 'gsap.js' || file === 'lucide.js' || file === 'scrolltrigger.js') {
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    lines.forEach((line, index) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
            return;
        }
        
        let reasons = [];
        
        // 1. Check for unicode replacement character \uFFFD or ï¿½
        if (line.includes('\uFFFD') || line.includes('ï¿½')) {
            reasons.push("Replacement character (mojibake)");
        }
        
        // 2. Check for raw emoji character using regex
        const emojiMatches = line.match(emojiRegex);
        if (emojiMatches) {
            const filteredEmojis = emojiMatches.filter(char => {
                const code = char.codePointAt(0);
                if (code < 0x2000) return false;
                // Exclude common symbols that are okay, but wait, the prompt says "remove all emojis... replace them all with 3d icons / lucide icons"
                // Let's check what icons are used. Heart ♥ (0x2665) or copyright © (0x00A9) or trademark.
                // We should flag them and see if they should be replaced.
                if (char === '♥' || char === '©' || char === '®' || char === '™') return false;
                return true;
            });
            if (filteredEmojis.length > 0) {
                reasons.push(`Raw Emojis: ${filteredEmojis.join(', ')}`);
            }
        }
        
        // 3. Look for weird multibyte characters that commonly indicate mojibake
        const mojibakePatterns = [/Ã‚Â/g, /Ã¢â„¢/g, /â€¡/g, /ÃƒÂ/g];
        mojibakePatterns.forEach(pattern => {
            if (pattern.test(line)) {
                reasons.push(`Mojibake bytes (${pattern.source})`);
            }
        });
        
        if (reasons.length > 0) {
            console.log(`${file}:${index + 1}: ${line.trim()} [Reasons: ${reasons.join(' | ')}]`);
            totalFound++;
        }
    });
});

console.log(`Scan complete. Found ${totalFound} issues in root files.`);
