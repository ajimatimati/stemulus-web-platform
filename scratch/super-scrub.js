const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Helper to determine Lucide icon for a given Tarikul emoji path
function getLucideReplacement(src) {
    const s = src.toLowerCase();
    if (s.includes('seedling')) return { icon: 'sprout', color: 'text-emerald-500' };
    if (s.includes('herb')) return { icon: 'leaf', color: 'text-emerald-500' };
    if (s.includes('deciduous')) return { icon: 'trees', color: 'text-emerald-500' };
    if (s.includes('rocket')) return { icon: 'rocket', color: 'text-orange-500' };
    if (s.includes('laptop')) return { icon: 'laptop', color: 'text-indigo-500' };
    if (s.includes('books') || s.includes('book_cover')) return { icon: 'book-open', color: 'text-indigo-500' };
    if (s.includes('robot')) return { icon: 'bot', color: 'text-blue-500' };
    if (s.includes('snake')) return { icon: 'terminal', color: 'text-emerald-500' }; // snake -> terminal for python
    if (s.includes('globe')) return { icon: 'globe', color: 'text-blue-500' };
    if (s.includes('puzzle')) return { icon: 'puzzle', color: 'text-orange-500' };
    if (s.includes('brain')) return { icon: 'brain', color: 'text-pink-500' };
    if (s.includes('palette') || s.includes('artist')) return { icon: 'palette', color: 'text-amber-500' };
    if (s.includes('numbers')) return { icon: 'binary', color: 'text-blue-500' };
    if (s.includes('open%20book') || s.includes('open_book')) return { icon: 'book-open', color: 'text-emerald-500' };
    if (s.includes('microscope')) return { icon: 'microscope', color: 'text-teal-500' };
    if (s.includes('atom')) return { icon: 'atom', color: 'text-cyan-500' };
    if (s.includes('memo') || s.includes('writing')) return { icon: 'file-text', color: 'text-purple-500' };
    if (s.includes('family')) return { icon: 'users', color: 'text-indigo-500' };
    if (s.includes('check%20mark') || s.includes('check_mark')) return { icon: 'check-circle', color: 'text-emerald-500' };
    if (s.includes('party%20popper') || s.includes('party_popper')) return { icon: 'sparkles', color: 'text-yellow-500' };
    if (s.includes('locked')) return { icon: 'lock', color: 'text-red-500' };
    if (s.includes('gift') || s.includes('wrapped')) return { icon: 'gift', color: 'text-rose-500' };
    return null;
}

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace image emojis from Tarikul-Islam-Anik with Lucide icons
    // Regex matches <img ... src="...Tarikul-Islam-Anik..." ...>
    const imgRegex = /<img[^>]+src="([^"]*Tarikul-Islam-Anik[^"]*)"[^>]*>/gi;
    content = content.replace(imgRegex, (match, src) => {
        const replacement = getLucideReplacement(src);
        if (replacement) {
            return `<i data-lucide="${replacement.icon}" class="w-5 h-5 inline-block ${replacement.color} align-middle"></i>`;
        }
        return ''; // Remove if no mapping found
    });

    // 2. Remove raw unicode emojis in text (except footer love ♥ symbol)
    // We match common emojis like 🚀, 🌱, 🌿, 🌳, 💻, 📚, 🤖, 🐍, 🌐, 🧩, 🧠, 🎨, 🔢, 📖, 🔬, ⚛️, ⚛, 📝, 👨‍👩‍👧, 🎉, 🎁, 🔒, ✅
    const unicodeEmojiMap = [
        { char: /🚀/g, icon: 'rocket', color: 'text-orange-500' },
        { char: /🌱/g, icon: 'sprout', color: 'text-emerald-500' },
        { char: /🌿/g, icon: 'leaf', color: 'text-emerald-500' },
        { char: /🌳/g, icon: 'trees', color: 'text-emerald-500' },
        { char: /💻/g, icon: 'laptop', color: 'text-indigo-500' },
        { char: /📚/g, icon: 'book-open', color: 'text-indigo-500' },
        { char: /🤖/g, icon: 'bot', color: 'text-blue-500' },
        { char: /🐍/g, icon: 'terminal', color: 'text-emerald-500' },
        { char: /🌐/g, icon: 'globe', color: 'text-blue-500' },
        { char: /🧩/g, icon: 'puzzle', color: 'text-orange-500' },
        { char: /🧠/g, icon: 'brain', color: 'text-pink-500' },
        { char: /🎨/g, icon: 'palette', color: 'text-amber-500' },
        { char: /🔢/g, icon: 'binary', color: 'text-blue-500' },
        { char: /📖/g, icon: 'book-open', color: 'text-emerald-500' },
        { char: /🔬/g, icon: 'microscope', color: 'text-teal-500' },
        { char: /⚛️/g, icon: 'atom', color: 'text-cyan-500' },
        { char: /⚛/g, icon: 'atom', color: 'text-cyan-500' },
        { char: /📝/g, icon: 'file-text', color: 'text-purple-500' },
        { char: /👨‍👩‍👧/g, icon: 'users', color: 'text-indigo-500' },
        { char: /🎉/g, icon: 'sparkles', color: 'text-yellow-500' },
        { char: /🎁/g, icon: 'gift', color: 'text-rose-500' },
        { char: /🔒/g, icon: 'lock', color: 'text-red-500' },
        { char: /✅/g, icon: 'check-circle', color: 'text-emerald-500' }
    ];

    for (const item of unicodeEmojiMap) {
        content = content.replace(item.char, `<i data-lucide="${item.icon}" class="w-5 h-5 inline-block ${item.color} align-middle"></i>`);
    }

    // 3. Fix raw mojibakes (including the replacement character \uFFFD)
    // Replace \uFFFD near ranges (like 1014, 59) with a clean dash '-'
    content = content.replace(/(\d+)\s*\uFFFD\s*(\d+)/g, '$1-$2');
    content = content.replace(/(\d+)\s*\s*(\d+)/g, '$1-$2'); // literal match
    
    // Replace \uFFFD in chapter titles (like  Creative Lab)
    content = content.replace(/\uFFFD\s*Creative/g, 'Creative');
    content = content.replace(/\s*Creative/g, 'Creative');
    
    // Replace \uFFFD in footer bars (like  11)
    content = content.replace(/\uFFFD\s*(\d+)/g, '· $1');
    content = content.replace(/\s*(\d+)/g, '· $1');
    
    // Replace \uFFFD in footer headers
    content = content.replace(/FOOTER\s*\uFFFD\s*NEWSPAPER/g, 'FOOTER | NEWSPAPER');
    content = content.replace(/FOOTER\s*\s*NEWSPAPER/g, 'FOOTER | NEWSPAPER');

    // Replace generic mojibake block characters
    content = content.replace(/â• â• â•/g, '═══');
    content = content.replace(/Ã¢•Â/g, '═══════════════════════════════════════════════');

    // 4. Remove or replace em-dashes / en-dashes
    // The user wants em-dashes removed or replaced with alternative components.
    // Replace em-dash "—" with clean divider space/bars or hyphens
    content = content.replace(/—/g, ' | ');
    content = content.replace(/–/g, ' - ');
    content = content.replace(/&mdash;/g, ' | ');
    content = content.replace(/&ndash;/g, ' - ');

    // 5. Ensure lucide script is included in head if we injected icons
    if (content !== original && !content.includes('unpkg.com/lucide')) {
        const headIdx = content.indexOf('</head>');
        if (headIdx !== -1) {
            const lucideScript = '\n    <script src="https://unpkg.com/lucide@latest" defer></script>\n    <script defer>window.addEventListener(\'DOMContentLoaded\',function(){if(window.lucide)lucide.createIcons();});</script>\n';
            content = content.slice(0, headIdx) + lucideScript + content.slice(headIdx);
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned & Upgraded: ${path.basename(filePath)}`);
    }
}

function scanHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip folders that shouldn't be touched
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
                scanHtmlFiles(fullPath);
            }
        } else if (file.endsWith('.html')) {
            processHtmlFile(fullPath);
        }
    }
}

console.log('Sweeping workspace for mojibakes, em-dashes and animated emojis...');
scanHtmlFiles(rootDir);
console.log('Deep scrub complete!');
