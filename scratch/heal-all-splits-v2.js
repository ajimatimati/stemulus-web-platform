const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const healingReplacements = [
    // 1. Specific colors & properties
    { search: /#06-5f4-6/gi, replace: '#065f46' },
    { search: /#5b2-1b6/gi, replace: '#5b21b6' },
    { search: /#25D36-6/gi, replace: '#25D366' },
    { search: /#10B98-1/gi, replace: '#10B981' },
    { search: /#0f17-2a/gi, replace: '#0f172a' },
    { search: /#4a556-8/gi, replace: '#4a5568' },
    
    // 2. RGB/RGBA color functions
    { search: /rgba\(24-4,96,12,0.1\)/g, replace: 'rgba(244,96,12,0.1)' },
    { search: /rgba\(24-4,96,12,0.4\)/g, replace: 'rgba(244,96,12,0.4)' },
    { search: /rgba\(24-4,96,12,0.0-5\)/g, replace: 'rgba(244,96,12,0.05)' },
    { search: /rgba\(24-4,96,12,/g, replace: 'rgba(244,96,12,' },
    { search: /rgba\(3-7,211,10-2,\.4-5\)/g, replace: 'rgba(37,211,102,.45)' },
    { search: /rgba\(3-7,211,10-2,\.6\)/g, replace: 'rgba(37,211,102,.6)' },
    { search: /rgba\(3-7,211,10-2,0.4-5\)/g, replace: 'rgba(37,211,102,0.45)' },
    { search: /rgba\(3-7,211,10-2,0.6\)/g, replace: 'rgba(37,211,102,0.6)' },
    { search: /rgba\(6,9-5,7-0,0.3\)/g, replace: 'rgba(6,95,70,0.3)' },
    { search: /rgba\(9-1,3-3,18-2,0.3\)/g, replace: 'rgba(91,33,182,0.3)' },
    { search: /rgba\(2-6,3-5,50,0.7\)/g, replace: 'rgba(26,35,50,0.7)' },
    { search: /rgba\(2-6,3-5,50,0.3\)/g, replace: 'rgba(26,35,50,0.3)' },
    { search: /rgba\(2-6,3-5,50,0.5\)/g, replace: 'rgba(26,35,50,0.5)' },
    { search: /rgba\(25-5,25-5,25-5,/g, replace: 'rgba(255,255,255,' },
    
    // 3. Opacities, box-shadows, scales, spacing, etc.
    { search: /rgba\(10,10,10,0.0-2\)/g, replace: 'rgba(10,10,10,0.02)' },
    { search: /rgba\(10,10,10,0.0-8\)/g, replace: 'rgba(10,10,10,0.08)' },
    { search: /rgba\(10,10,10,0.0-5\)/g, replace: 'rgba(10,10,10,0.05)' },
    { search: /rgba\(10,10,10,0.7-5\)/g, replace: 'rgba(10,10,10,0.75)' },
    { search: /rgba\(0,0,0,0.0-2\)/g, replace: 'rgba(0,0,0,0.02)' },
    { search: /rgba\(0,0,0,0.0-3\)/g, replace: 'rgba(0,0,0,0.03)' },
    { search: /rgba\(0,0,0,0.0-8\)/g, replace: 'rgba(0,0,0,0.08)' },
    
    { search: /opacity-\[0.0-3\]/g, replace: 'opacity-[0.03]' },
    { search: /opacity-\[0.0-5\]/g, replace: 'opacity-[0.05]' },
    { search: /opacity-\[0.0-8\]/g, replace: 'opacity-[0.08]' },
    
    { search: /box-shadow:0-4px20px/g, replace: 'box-shadow:0 4px 20px' },
    { search: /box-shadow:0-6px28px/g, replace: 'box-shadow:0 6px 28px' },
    { search: /box-shadow:0-8px24px/g, replace: 'box-shadow:0 8px 24px' },
    { search: /box-shadow:0-8px40px/g, replace: 'box-shadow:0 8px 40px' },
    { search: /box-shadow:0-16px40px/g, replace: 'box-shadow:0 16px 40px' },
    { search: /box-shadow:0-30px80px/g, replace: 'box-shadow:0 30px 80px' },
    { search: /box-shadow:0-00-4px/g, replace: 'box-shadow:0 0 0 4px' },
    
    { search: /scale-10-5/g, replace: 'scale-105' },
    { search: /scale-\[1.0-1\]/g, replace: 'scale-[1.01]' },
    { search: /scale-\[1.0-5\]/g, replace: 'scale-[1.05]' },
    { search: /hover:scale-10-5/g, replace: 'hover:scale-105' },
    { search: /stagger:0.0-7/g, replace: 'stagger:0.07' },
    { search: /z-index:999-9/g, replace: 'z-index:9999' },
    
    // 4. Margins, Paddings, and Font sizes
    { search: /margin:0-00.5rem/g, replace: 'margin:0 0 0.5rem' },
    { search: /margin:0-01rem/g, replace: 'margin:0 0 1rem' },
    { search: /margin:0-02rem/g, replace: 'margin:0 0 2rem' },
    { search: /margin:0-00.25rem/g, replace: 'margin:0 0 0.25rem' },
    { search: /margin:0-01.5rem/g, replace: 'margin:0 0 1.5rem' },
    { search: /margin:0-0-0.5rem/g, replace: 'margin:0 0 -0.5rem' },
    { search: /padding:0-2rem/g, replace: 'padding:0 2rem' },
    { search: /padding:0.8-5rem1.7-5rem/g, replace: 'padding:0.85rem 1.75rem' },
    { search: /padding:0.2rem0.6rem/g, replace: 'padding:0.2rem 0.6rem' },
    
    { search: /font-size:0.6-5rem/g, replace: 'font-size:0.65rem' },
    { search: /font-size:0.7-2rem/g, replace: 'font-size:0.72rem' },
    { search: /font-size:0.7-5rem/g, replace: 'font-size:0.75rem' },
    { search: /font-size:0.7-8rem/g, replace: 'font-size:0.78rem' },
    { search: /font-size:0.8-5rem/g, replace: 'font-size:0.85rem' },
    { search: /letter-spacing:0.0-4em/g, replace: 'letter-spacing:0.04em' },
    { search: /letter-spacing:0.0-8em/g, replace: 'letter-spacing:0.08em' },
    { search: /line-height:1.7-5/g, replace: 'line-height:1.75' },
    { search: /border-radius:0.7-5rem/g, replace: 'border-radius:0.75rem' },
    { search: /border-radius:99-9px/g, replace: 'border-radius:999px' },
    
    // 5. SVG and layout values
    { search: /viewBox="0-024-24"/g, replace: 'viewBox="0 0 24 24"' },
    { search: /viewBox="0-016-16"/g, replace: 'viewBox="0 0 16 16"' },
    { search: /viewBox="0-014-14"/g, replace: 'viewBox="0 0 14 14"' },
    { search: /viewBox="0-0200-16"/g, replace: 'viewBox="0 0 200 16"' },
    { search: /xmlns="http:\/\/www.w3.org\/200-0\/svg"/g, replace: 'xmlns="http://www.w3.org/2000/svg"' },
    { search: /width="4-4" height="4-4"/g, replace: 'width="44" height="44"' },
    { search: /·0-8/g, replace: '· 08' },
    { search: /· 0-8/g, replace: '· 08' },
    { search: /"price": "80.0-0"/g, replace: '"price": "80.00"' },
    { search: /"price": "50.0-0"/g, replace: '"price": "50.00"' },
    
    // 6. Years and specific IDs
    { search: /202-6/g, replace: '2026' },
    { search: /202-5/g, replace: '2025' },
    { search: /202-2/g, replace: '2022' },
    { search: /STEM-202-6-X8F3/g, replace: 'STEM-2026-X8F3' },
    
    // 7. Timeline steps
    { search: /<div class="timeline-step-num">0-1<\/div>/g, replace: '<div class="timeline-step-num">01</div>' },
    { search: /<div class="timeline-step-num">0-2<\/div>/g, replace: '<div class="timeline-step-num">02</div>' },
    { search: /<div class="timeline-step-num">0-3<\/div>/g, replace: '<div class="timeline-step-num">03</div>' },
    { search: /<div class="timeline-step-num">0-4<\/div>/g, replace: '<div class="timeline-step-num">04</div>' },
    { search: /<div class="timeline-step-num">0-5<\/div>/g, replace: '<div class="timeline-step-num">05</div>' },
    { search: /<div class="timeline-step-num">0-6<\/div>/g, replace: '<div class="timeline-step-num">06</div>' }
];

// Clean footer block replacement
const footerSearchRegex = /<div class="footer-bottom">[\s\S]+?<\/div>/g;
const footerReplacement = `<div class="footer-bottom">
        <p class="footer-legal">©2026 STEMulus Innovations LTD. All rights reserved.</p>
        <p class="footer-legal" style="display:flex;align-items:center;gap:0.5rem;">
            Built with craft, not algorithms
            <span style="color:var(--orange);">♥</span>
            <a href="mailto:admin@stemuluskidstech.com" aria-label="Email STEMulus" style="color:currentColor;margin-left:1rem;display:flex;align-items:center;">
                <i data-lucide="mail" style="width:18px;height:18px;"></i>
            </a>
            <a href="https://wa.me/2347052466716" aria-label="WhatsApp STEMulus" style="color:currentColor;margin-left:0.5rem;display:flex;align-items:center;">
                <i data-lucide="message-circle" style="width:18px;height:18px;"></i>
            </a>
        </p>
    </div>`;

// Specific SVG replacements in verify-certificate.html
const verifyCertReplacements = [
    {
        search: /<svg class="w-64 h-64" viewBox="0-024-24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="7"\/><path d="M8.2113.8-9L7-23l5-3-53-1.2-1-9.12"\/><\/svg>/g,
        replace: '<i data-lucide="award" class="w-64 h-64"></i>'
    },
    {
        search: /<svg class="w-6 h-6 text-\[\#10B98-1\]" fill="none" viewBox="0-024-24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9-12l2-24-4m5.618-4.016A11.955-11.95500112-2.94-4a11.955-11.95500-18.618-3.0-4A12.02-12.020003-9c0-5.5913.824-10.29-911.6225.17-6-1.332-96.03-9-11.6220-1.04-2-.13-32.052-.38-2-3.016z"\/><\/svg>/g,
        replace: '<i data-lucide="shield-check" class="w-6 h-6 text-[#10B981]"></i>'
    },
    {
        search: /<svg class="w-3.5 h-3.5 fill-\[\#F4600C\] stroke-none" viewBox="0-024-24"><path d="M12-2l3.096.2-6L22-9.2-7l-5-4.87-1.18-6.8-8L12-17.7-7l-6.18-3.25L7-14.14-29.2-7l6.9-11.0-1L12-2z"\/><\/svg>/g,
        replace: '<i data-lucide="star" class="w-3.5 h-3.5 fill-[#F4600C] stroke-none"></i>'
    },
    {
        search: /<svg class="w-3.5 h-3.5 fill-\[\#10B98-1\] stroke-none" viewBox="0-024-24"><path d="M12-2l3.096.2-6L22-9.2-7l-5-4.87-1.18-6.8-8L12-17.7-7l-6.18-3.25L7-14.14-29.2-7l6.9-11.0-1L12-2z"\/><\/svg>/g,
        replace: '<i data-lucide="star" class="w-3.5 h-3.5 fill-[#10B981] stroke-none"></i>'
    }
];

function healFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply specific replacements
    for (const r of healingReplacements) {
        content = content.replace(r.search, r.replace);
    }

    // Apply footer replacement
    if (filePath.endsWith('.html')) {
        content = content.replace(footerSearchRegex, footerReplacement);
        
        // Clean index-specific icons and mojibakes
        if (filePath.endsWith('index.html')) {
            content = content.replace(/<div style="font-size:2rem;margin-bottom:0.3rem;">🎮<\/div>/g, '<div style="font-size:2rem;margin-bottom:0.3rem;display:flex;align-items:center;justify-content:center;color:white;"><i data-lucide="gamepad-2" class="w-10 h-10"></i></div>');
            content = content.replace(/<div style="width:32px;height:32px;border-radius:50%;background:rgba\(24-4,96,12,0.1\);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8-5rem;">🔎<\/div>/g, '<div style="width:32px;height:32px;border-radius:50%;background:rgba(244,96,12,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#f4600c;"><i data-lucide="shield-check" class="w-5 h-5"></i></div>');
            content = content.replace(/<div style="width:32px;height:32px;border-radius:50%;background:rgba\(24-4,96,12,0.1\);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8-5rem;">⚡<\/div>/g, '<div style="width:32px;height:32px;border-radius:50%;background:rgba(244,96,12,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#f4600c;"><i data-lucide="zap" class="w-5 h-5"></i></div>');
            content = content.replace(/<div style="width:32px;height:32px;border-radius:50%;background:rgba\(24-4,96,12,0.1\);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8-5rem;">ðŸŒ <\/div>/g, '<div style="width:32px;height:32px;border-radius:50%;background:rgba(244,96,12,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#f4600c;"><i data-lucide="globe" class="w-5 h-5"></i></div>');
        }

        // Clean verify-certificate specific SVGs
        if (filePath.endsWith('verify-certificate.html')) {
            for (const r of verifyCertReplacements) {
                content = content.replace(r.search, r.replace);
            }
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Healed splits & SVGs in: ${path.basename(filePath)}`);
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

console.log('Running global HTML/CSS split digits and SVG healing script...');
scanDir(rootDir);
console.log('Global healing complete!');
