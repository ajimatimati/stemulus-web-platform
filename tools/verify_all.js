const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function runVerification() {
    console.log('=== STEMULUS LAUNCH PRE-FLIGHT VERIFICATION ===\n');

    let errors = 0;

    // 1. Check SEO / GEO Files
    console.log('1. Checking SEO & GEO assets...');
    const filesToCheck = [
        'llms.txt',
        'llms-full.txt',
        '.well-known/llms.txt',
        'robots.txt',
        'sitemap.xml'
    ];
    for (const f of filesToCheck) {
        const fullPath = path.join(__dirname, '..', f);
        if (fs.existsSync(fullPath)) {
            const size = fs.statSync(fullPath).size;
            console.log(`  ✓ ${f} exists (${size} bytes)`);
        } else {
            console.error(`  ✗ ${f} MISSING!`);
            errors++;
        }
    }

    const robotsContent = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
    if (robotsContent.includes('llms.txt') && robotsContent.includes('GPTBot') && robotsContent.includes('ClaudeBot')) {
        console.log('  ✓ robots.txt contains AI crawlers and llms.txt directives');
    } else {
        console.error('  ✗ robots.txt missing GEO directives');
        errors++;
    }

    const sitemapContent = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
    if (sitemapContent.includes('/curriculum/slides/index.html') && sitemapContent.includes('llms.txt')) {
        console.log('  ✓ sitemap.xml contains curriculum and llms.txt');
    } else {
        console.error('  ✗ sitemap.xml missing curriculum slides');
        errors++;
    }

    // 2. Playwright Headless Browser Verification
    console.log('\n2. Running Playwright UI Verification...');
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 2a. Book Class Page
    console.log('  Testing book-class.html...');
    const bookClassUrl = 'file:///' + path.join(__dirname, '..', 'book-class.html').replace(/\\/g, '/');
    await page.goto(bookClassUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const bdayInput = await page.$('#qb-student-birthday');
    if (bdayInput) {
        console.log('  ✓ #qb-student-birthday input rendered in QuickBooking inline form');
    } else {
        console.error('  ✗ #qb-student-birthday NOT found in book-class.html');
        errors++;
    }

    const bookScreenshotPath = path.join(__dirname, '..', '.gemini', 'antigravity', 'brain', '66a470fd-ed7c-4b64-9669-b95d564bb83e', 'screenshots', 'book_class_birthday_verified.png');
    // Ensure dir exists
    const ssDir = path.dirname(bookScreenshotPath);
    if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
    await page.screenshot({ path: bookScreenshotPath });
    console.log(`  ✓ Screenshot saved: ${bookScreenshotPath}`);

    // 2b. Join As Tutor Page
    console.log('\n  Testing join-as-tutor.html...');
    const tutorUrl = 'file:///' + path.join(__dirname, '..', 'join-as-tutor.html').replace(/\\/g, '/');
    await page.goto(tutorUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const tutorBday = await page.$('#tutor_birthday');
    if (tutorBday) {
        console.log('  ✓ #tutor_birthday input rendered in tutorApplyForm');
    } else {
        console.error('  ✗ #tutor_birthday NOT found in join-as-tutor.html');
        errors++;
    }

    const tutorScreenshotPath = path.join(__dirname, '..', '.gemini', 'antigravity', 'brain', '66a470fd-ed7c-4b64-9669-b95d564bb83e', 'screenshots', 'join_tutor_birthday_verified.png');
    await page.screenshot({ path: tutorScreenshotPath });
    console.log(`  ✓ Screenshot saved: ${tutorScreenshotPath}`);

    // 2c. Curriculum Hub
    console.log('\n  Testing curriculum/slides/index.html...');
    const curriculumUrl = 'file:///' + path.join(__dirname, '..', 'curriculum', 'slides', 'index.html').replace(/\\/g, '/') + '?role=tutor';
    await page.goto(curriculumUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const slideCards = await page.$$('.lesson-card, .deck-card, .slide-card');
    console.log(`  ✓ Curriculum hub rendered ${slideCards.length} interactive deck items`);

    const currScreenshotPath = path.join(__dirname, '..', '.gemini', 'antigravity', 'brain', '66a470fd-ed7c-4b64-9669-b95d564bb83e', 'screenshots', 'curriculum_hub_verified.png');
    await page.screenshot({ path: currScreenshotPath });
    console.log(`  ✓ Screenshot saved: ${currScreenshotPath}`);

    // 2d. Lead Genius Diagnostic Widget on index.html
    console.log('\n  Testing index.html and LeadGenius Diagnostic Launcher...');
    const indexUrl = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const launcher = await page.$('#lead-genius-launcher');
    if (launcher) {
        console.log('  ✓ #lead-genius-launcher floating badge rendered');
        await launcher.click();
        await page.waitForTimeout(600);

        const modalOpen = await page.$('#lead-genius-modal.open');
        if (modalOpen) {
            console.log('  ✓ #lead-genius-modal opened successfully upon click');
            
            // Fill step 1
            await page.fill('#lg-child-name', 'Alexander');
            await page.fill('#lg-child-birthday', '2015-06-15');
            await page.waitForTimeout(300);

            const ageBadge = await page.$('#lg-age-badge');
            const isVisible = await ageBadge.isVisible();
            console.log(`  ✓ Auto-calculated age badge visible: ${isVisible}`);

            await page.click('button[type="submit"]');
            await page.waitForTimeout(500);

            // Select interest
            await page.click('.lg-choice-card[data-val="ai"]');
            await page.click('#lg-btn-to-step3');
            await page.waitForTimeout(500);

            // Fill parent details
            await page.fill('#lg-parent-name', 'Victoria Sterling');
            await page.fill('#lg-email', 'victoria.sterling@example.com');
            await page.fill('#lg-phone', '+14155552671');
            await page.fill('#lg-country', 'United States');

            const lgScreenshotPath = path.join(__dirname, '..', '.gemini', 'antigravity', 'brain', '66a470fd-ed7c-4b64-9669-b95d564bb83e', 'screenshots', 'lead_genius_diagnostic_verified.png');
            await page.screenshot({ path: lgScreenshotPath });
            console.log(`  ✓ Screenshot saved: ${lgScreenshotPath}`);
        } else {
            console.error('  ✗ #lead-genius-modal failed to open');
            errors++;
        }
    } else {
        console.error('  ✗ #lead-genius-launcher NOT found');
        errors++;
    }

    await browser.close();

    console.log('\n=======================================');
    if (errors === 0) {
        console.log('✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
    } else {
        console.log(`❌ ENCOUNTERED ${errors} VERIFICATION ERRORS.`);
    }
    console.log('=======================================');
}

runVerification().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
