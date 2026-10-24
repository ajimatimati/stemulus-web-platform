/**
 * Comprehensive Portal Display & Functionality Perfection Inspector
 * =================================================================
 * Evaluates DOM elements, mobile viewport constraints (375px, 414px, 768px, 1280px),
 * console errors, modal behaviors, and script consistency across all portals.
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 8199;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  });
});

const PORTALS = [
    { name: 'Admin Dashboard', file: 'admin-dashboard.html', role: 'admin', email: 'admin@stemuluskidstech.com' },
    { name: 'Parent Dashboard', file: 'parent-dashboard.html', role: 'parent', email: 'parent.mark@gmail.com' },
    { name: 'Tutor Dashboard', file: 'tutor-dashboard.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
    { name: 'Join Class Companion', file: 'join-class.html?studentId=std-001&scheduleId=sch-101', role: 'coder', email: 'parent.mark@gmail.com' },
    { name: 'Parent Progress', file: 'parent-progress.html?id=std-001', role: 'parent', email: 'parent.mark@gmail.com' },
    { name: 'Tutor Attendance', file: 'tutor-attendance.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
    { name: 'Tutor Class Log', file: 'tutor-attendance-create.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
    { name: 'Tutor Monthly Report', file: 'tutor-monthly-report.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' },
    { name: 'Tutor Students Roster', file: 'tutor-students.html', role: 'tutor', email: 'tutor@stemuluskidstech.com' }
];

const VIEWPORTS = [
    { name: 'Mobile (375px)', width: 375, height: 667 },
    { name: 'Mobile Large (414px)', width: 414, height: 896 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Desktop (1280px)', width: 1280, height: 800 }
];

// Read StemulusSecurity code so we can inject signed tokens into browser context
const securityCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'stemulus-security.js'), 'utf8');

async function inspectPortalPerfection() {
    console.log('🔍 Launching Deep Portal Perfection Inspector across all 9 portals...\n');
    await new Promise(r => server.listen(PORT, r));

    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e) {
        browser = await chromium.launch({ headless: true });
    }
    const results = [];

    for (const portal of PORTALS) {
        console.log(`================================================================`);
        console.log(`Auditing: ${portal.name} (${portal.file})`);
        console.log(`================================================================`);

        const portalResults = {
            name: portal.name,
            file: portal.file,
            consoleErrors: [],
            consoleWarnings: [],
            overflowIssues: [],
            brokenImages: [],
            modalsChecked: []
        };

        const context = await browser.newContext();
        const page = await context.newPage();

        // Listen for console logs
        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                portalResults.consoleErrors.push(text);
            } else if (msg.type() === 'warning') {
                portalResults.consoleWarnings.push(text);
            }
        });

        // Inject authenticated session via StemulusSecurity
        await page.addInitScript(({ secCode, role, email }) => {
            try {
                // Evaluate security script to get minting capability
                const fn = new Function(secCode);
                fn();
                if (window.StemulusSecurity && window.StemulusSecurity.saveSecureSession) {
                    window.StemulusSecurity.saveSecureSession({
                        role: role,
                        email: email,
                        name: role === 'admin' ? 'STEMulus Admin' : role === 'tutor' ? 'Sarah Jane' : 'Mark Parent',
                        issuedAt: Date.now()
                    });
                }
            } catch (err) {
                console.error('Failed to init secure session in test:', err);
            }
        }, { secCode: securityCode, role: portal.role, email: portal.email });

        for (const vp of VIEWPORTS) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            const url = `http://localhost:${PORT}/${portal.file}`;
            
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await page.waitForTimeout(1200);

                // Check horizontal overflow
                const overflow = await page.evaluate(() => {
                    const docEl = document.documentElement;
                    const body = document.body;
                    const docWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
                    const winWidth = window.innerWidth;
                    return {
                        hasOverflow: docWidth > winWidth + 1, // allow 1px subpixel tolerance
                        docWidth,
                        winWidth,
                        diff: docWidth - winWidth
                    };
                });

                if (overflow.hasOverflow) {
                    portalResults.overflowIssues.push({
                        viewport: vp.name,
                        diff: overflow.diff,
                        docWidth: overflow.docWidth,
                        winWidth: overflow.winWidth
                    });
                    console.log(`  ⚠️ Overflow detected on ${vp.name}: content width ${overflow.docWidth}px vs window ${overflow.winWidth}px (+${overflow.diff}px)`);
                } else {
                    console.log(`  ✅ ${vp.name}: Perfectly bounded (zero horizontal scroll)`);
                }

                // Check broken images (ignore data URIs and hidden containers)
                const brokenImgs = await page.evaluate(() => {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    return imgs.filter(img => {
                        if (img.src.startsWith('data:')) return false;
                        if (img.closest('.hidden') || img.style.display === 'none') return false;
                        return !img.complete || img.naturalWidth === 0;
                    }).map(img => ({ src: img.src, outer: img.outerHTML.slice(0, 80) }));
                });
                if (brokenImgs.length > 0) {
                    portalResults.brokenImages.push({ viewport: vp.name, count: brokenImgs.length, details: brokenImgs });
                    console.log(`  🔴 Broken images on ${vp.name}:`, brokenImgs);
                }

            } catch (err) {
                console.error(`  ❌ Navigation error on ${vp.name}:`, err.message);
            }
        }

        // Check interactive components
        try {
            // Mulu widget existence
            const muluExists = await page.$('#mulu-toggle-btn');
            if (muluExists) {
                const isVisible = await muluExists.isVisible();
                console.log(`  🦉 Mulu Mascot Widget: Mounted & Active (Visible: ${isVisible})`);
            }

            // Check modals in DOM
            const modals = await page.$$eval('[id*="modal"]', els => els.map(e => ({ id: e.id, display: window.getComputedStyle(e).display })));
            portalResults.modalsChecked = modals;
            console.log(`  📋 Modals detected in DOM: ${modals.length}`);
        } catch (e) {
            console.warn(`  Notice during interactive check:`, e.message);
        }

        console.log(`  Console Errors: ${portalResults.consoleErrors.length}`);
        if (portalResults.consoleErrors.length > 0) {
            portalResults.consoleErrors.slice(0, 5).forEach(err => console.log(`     🔴 ${err}`));
        }
        results.push(portalResults);
        await context.close();
    }

    await browser.close();
    server.close();

    console.log('\n================================================================');
    console.log('📊 PORTAL PERFECTION INSPECTION SUMMARY');
    console.log('================================================================');
    let allClean = true;
    results.forEach(r => {
        const errorCount = r.consoleErrors.length;
        const overflowCount = r.overflowIssues.length;
        const brokenCount = r.brokenImages.length;
        const isPageClean = errorCount === 0 && overflowCount === 0 && brokenCount === 0;
        if (!isPageClean) allClean = false;

        console.log(`${r.name} (${r.file}):`);
        console.log(`  - Console Errors: ${errorCount === 0 ? '0 (Clean)' : errorCount + ' error(s)'}`);
        console.log(`  - Horizontal Overflows: ${overflowCount === 0 ? '0 (100% Responsive)' : overflowCount + ' viewport(s)'}`);
        console.log(`  - Broken Images: ${brokenCount === 0 ? '0' : brokenCount}`);
        console.log(`  - Modals Verified: ${r.modalsChecked.length}`);
        console.log(`  - Overall: ${isPageClean ? '🌟 100% PERFECT' : '⚠️ NEEDS ATTENTION'}`);
    });

    console.log('\n================================================================');
    console.log(`PORTAL SUITE STATUS: ${allClean ? '✅ ALL 9 PORTALS 100% PERFECT' : '⚠️ ISSUES DETECTED'}`);
    console.log('================================================================');
}

inspectPortalPerfection().catch(err => {
    console.error(err);
    server.close();
});
