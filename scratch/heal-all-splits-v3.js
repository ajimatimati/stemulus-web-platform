const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const healingReplacements = [
    // 1. Text & CSS splits
    { search: /#1A23-7E/gi, replace: '#1A237E' },
    { search: /1,20-4\+/g, replace: '1,204+' },
    { search: /1,20-4/g, replace: '1,204' },
    { search: /-0\.0-2em/g, replace: '-0.02em' },
    { search: /rgba\(10,10,10,0\.0-4\)/g, replace: 'rgba(10,10,10,0.04)' },
    { search: /rgba\(30,5-8,13-8,/g, replace: 'rgba(30,58,138,' },
    { search: /scale\(1\.0-2\)/g, replace: 'scale(1.02)' },
    { search: /scale\(1\.0-5\)/g, replace: 'scale(1.05)' },
    { search: /scale\(1\.0-1\)/g, replace: 'scale(1.01)' },
    
    // 2. Mismatched code entities
    { search: /&#965-4;/g, replace: '<i data-lucide="play" class="w-3 h-3 inline-block align-middle mr-1"></i>' },
    { search: /&#9654;/g, replace: '<i data-lucide="play" class="w-3 h-3 inline-block align-middle mr-1"></i>' },

    // 3. Arrow SVGs
    { 
        search: /<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5-12h14M125l7-7-7-7"\/><\/svg>/g,
        replace: '<i data-lucide="arrow-right" class="w-4 h-4 inline-block align-middle ml-1"></i>'
    },
    { 
        search: /<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M125v14M5-12l7-77-7"\/><\/svg>/g,
        replace: '<i data-lucide="arrow-down" class="w-4 h-4 inline-block align-middle"></i>'
    }
];

// Clean WhatsApp float button regex and replacement
const waFloatRegex = /<a href="https:\/\/wa\.me\/2347052466716" class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">[\s\S]+?<\/a>/g;
const waFloatReplacement = `<a href="https://wa.me/2347052466716" class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
    <i data-lucide="message-circle" style="width:28px;height:28px;"></i>
</a>`;

function healFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply WhatsApp float replacement
    content = content.replace(waFloatRegex, waFloatReplacement);

    // Apply specific replacements
    for (const r of healingReplacements) {
        content = content.replace(r.search, r.replace);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Healed splits v3 in: ${path.basename(filePath)}`);
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
        } else if (file.endsWith('.html')) {
            healFile(fullPath);
        }
    }
}

console.log('Running global HTML split digits v3 healing script...');
scanDir(rootDir);
console.log('Global healing v3 complete!');
