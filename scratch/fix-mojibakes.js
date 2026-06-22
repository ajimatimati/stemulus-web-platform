const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

console.log("=== STARTING MOJIBAKE & EMCOJI CLEANUP ===");

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Clean up HERO comment mojibakes
    content = content.replace(/<!--\s*---\s*HERO\s*(?:[^\w\s]|Ã¯Â¿Â½|ï¿½||Ã¯Â¿Â½)+\s*Pre-AI\s*Editorial\s*---\s*-->/g, '<!-- --- HERO - Pre-AI Editorial --- -->');
    content = content.replace(/HERO\s*(?:[^\w\s]|Ã¯Â¿Â½|ï¿½||Ã¯Â¿Â½)+\s*Pre-AI\s*Editorial/g, 'HERO - Pre-AI Editorial');

    // 2. Clean up "No fluff" paragraph mojibakes
    content = content.replace(/No\s*fluff\s*(?:[^\w\s]|Ã¯Â¿Â½|ï¿½||Ã¯Â¿Â½)+\s*we\s*go/g, 'No fluff &mdash; we go');

    // 3. Clean up Python drag-and-drop paragraph mojibakes
    content = content.replace(/real\s*Python\s*(?:[^\w\s]|Ã¯Â¿Â½|ï¿½||Ã¯Â¿Â½)+\s*not\s*drag-and-drop/g, 'real Python &mdash; not drag-and-drop');

    // 4. Clean up Full-Stack Dev label mojibake in fullstack-web-dev.html
    content = content.replace(/<p\s*class="preai-hero-chapter">[^<]*Full-Stack\s*Dev<\/p>/g, 
        '<p class="preai-hero-chapter"><i data-lucide="layers" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></i>Full-Stack Dev</p>');

    // 5. Clean up Dot Separator mojibakes
    content = content.replace(/<span>Ã‚Â·\s*16<\/span>/g, '<span>&middot; 16</span>');
    content = content.replace(/<span>Ã‚Â·\s*10<\/span>/g, '<span>&middot; 10</span>');
    content = content.replace(/<span>Ã‚Â·\s*08<\/span>/g, '<span>&middot; 08</span>');
    content = content.replace(/<span>Ã‚Â·\s*8<\/span>/g, '<span>&middot; 08</span>');
    
    // Catch general mid-dots (Ã‚Â·)
    content = content.replace(/Ã‚Â·/g, '&middot;');

    // 6. Clean up Copyright symbol mojibakes
    content = content.replace(/Ã‚Â©2026/g, '&copy;2026');
    content = content.replace(/Ã‚Â©/g, '&copy;');

    // 7. Clean up Heart mojibakes and raw shapes in footer
    content = content.replace(/<span\s*style="color:var\(--orange\);">Ã¢â„¢Â¥<\/span>/g, 
        '<i data-lucide="heart" style="width:12px;height:12px;fill:var(--orange);color:var(--orange);display:inline-block;vertical-align:middle;margin:0 2px;"></i>');
    content = content.replace(/<span\s*style="color:var\(--orange\);">♥<\/span>/g, 
        '<i data-lucide="heart" style="width:12px;height:12px;fill:var(--orange);color:var(--orange);display:inline-block;vertical-align:middle;margin:0 2px;"></i>');
    content = content.replace(/Ã¢â„¢Â¥/g, '<i data-lucide="heart" style="width:12px;height:12px;fill:var(--orange);color:var(--orange);display:inline-block;vertical-align:middle;margin:0 2px;"></i>');

    // 8. Clean up hall-of-fame.html play button symbols
    if (file === 'hall-of-fame.html') {
        content = content.replace(/<span\s*class="showcase-run">▶\s*Play\s*This\s*Project<\/span>/g,
            '<span class="showcase-run"><i data-lucide="play" style="width:12px;height:12px;fill:currentColor;display:inline-block;vertical-align:middle;margin-right:4px;"></i>Play This Project</span>');
        content = content.replace(/<span\s*class="showcase-run">▶\s*See\s*How\s*It\s*Works<\/span>/g,
            '<span class="showcase-run"><i data-lucide="play" style="width:12px;height:12px;fill:currentColor;display:inline-block;vertical-align:middle;margin-right:4px;"></i>See How It Works</span>');
        content = content.replace(/<span\s*class="showcase-run">▶\s*Visit\s*This\s*Website<\/span>/g,
            '<span class="showcase-run"><i data-lucide="play" style="width:12px;height:12px;fill:currentColor;display:inline-block;vertical-align:middle;margin-right:4px;"></i>Visit This Website</span>');
    }

    // 9. Clean up verify-certificate.html checkmark console logs
    if (file === 'verify-certificate.html') {
        content = content.replace(/\[STEMulus Verification\]\s*✅/g, '[STEMulus Verification]');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched: ${file}`);
    }
});

console.log("=== CLEANUP FINISHED ===");
