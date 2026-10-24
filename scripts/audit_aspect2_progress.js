/**
 * Aspect 2 Deep QA/UX Audit Script:
 * Coders' Portfolio, Progress & Technology Badge Passport (parent-progress.html)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8094;
const ROOT_DIR = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error');
  }
});

server.listen(PORT, async () => {
  console.log(`[AUDIT] Aspect 2 Test Server active on http://localhost:${PORT}`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = {
    passed: [],
    failed: [],
    uxGaps: [],
    touchTargetFailures: []
  };

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Establish cryptographically signed session on page
    await page.goto(`http://localhost:${PORT}/parent-login.html?role=parent`, { waitUntil: 'load' });
    await page.evaluate(() => {
      const parentSession = {
        role: 'parent',
        email: 'parent@stemuluskidstech.com',
        name: 'Demo Parent',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(parentSession);
      }
      localStorage.setItem('user', JSON.stringify(parentSession));
      localStorage.setItem('role', 'parent');
    });

    // 2. Load parent-progress.html
    console.log(`[AUDIT] Navigating to parent-progress.html...`);
    await page.goto(`http://localhost:${PORT}/parent-progress.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Verify main components exist
    const hasGrid = await page.$eval('#dashboard-grid', el => !el.classList.contains('hidden')).catch(() => false);
    if (hasGrid) {
      results.passed.push('Dashboard grid is visible and child loaded');
    } else {
      results.failed.push('Dashboard grid is hidden or failed to load');
    }

    // 3. Test Student Selector & URL aliases (?studentId, ?id, ?student, ?coder)
    console.log(`[AUDIT] Testing query parameter aliases...`);
    await page.goto(`http://localhost:${PORT}/parent-progress.html?id=stu-1`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const activeStudentWithIdParam = await page.$eval('#active-student-title', el => el.textContent.trim()).catch(() => '');
    
    // Check if ?id= worked or fell back
    console.log(`[AUDIT] activeStudentTitle with ?id=stu-1: "${activeStudentWithIdParam}"`);

    // 4. Test Passport Badges & Modal
    console.log(`[AUDIT] Testing 48-Badge Passport Grid & Modal...`);
    const badgeCount = await page.$$eval('#passport-badges-grid > div', els => els.length).catch(() => 0);
    console.log(`[AUDIT] Found ${badgeCount} badges in passport grid`);
    if (badgeCount === 48) {
      results.passed.push('48 badges rendered in passport grid');
    } else {
      results.failed.push(`Expected 48 badges, got ${badgeCount}`);
    }

    // Click first badge to open modal
    const firstUnlockedBadge = await page.$('#passport-badges-grid > div.cursor-pointer');
    if (firstUnlockedBadge) {
      await firstUnlockedBadge.click();
      await page.waitForTimeout(500);
      const isModalOpen = await page.$eval('#passport-badge-modal', el => !el.classList.contains('hidden')).catch(() => false);
      if (isModalOpen) {
        results.passed.push('Passport badge modal opened on click');

        // Check age group buttons inside modal
        const ageTabs = await page.$$eval('#passport-badge-modal button[id^="pbm-tab-"]', els => els.map(b => ({
          id: b.id,
          text: b.textContent.trim(),
          height: b.getBoundingClientRect().height,
          width: b.getBoundingClientRect().width
        })));
        console.log(`[AUDIT] Modal age tabs:`, ageTabs);
        ageTabs.forEach(tab => {
          if (tab.height < 36 || tab.width < 36) {
            results.touchTargetFailures.push(`Modal tab #${tab.id} ("${tab.text}") height=${tab.height.toFixed(1)}px (WCAG minimum 36px)`);
          }
        });

        // Close modal
        await page.evaluate(() => {
          if (window.BadgePassportEngine && window.BadgePassportEngine.closeBadgeModal) {
            window.BadgePassportEngine.closeBadgeModal();
          }
        });
        await page.waitForTimeout(400);
      } else {
        results.failed.push('Passport badge modal did not open');
      }
    }

    // 5. Test Touch Targets across the entire page (Desktop)
    console.log(`[AUDIT] Checking interactive touch targets...`);
    const interactiveElements = await page.evaluate(() => {
      const targets = [];
      const els = document.querySelectorAll('button, a, select, input, [role="button"]');
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        // check visible elements (excluding security honeypot anti-bot inputs)
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden' && !el.id.startsWith('hp_')) {
          targets.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: el.className ? String(el.className).substring(0, 50) : '',
            text: (el.textContent || '').trim().substring(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      return targets;
    });

    interactiveElements.forEach(item => {
      if (item.height < 36 || item.width < 36) {
        // filter out zero or invisible
        results.touchTargetFailures.push(`${item.tag}#${item.id || item.text || item.className} [${item.width}x${item.height}px] violates WCAG 36px minimum`);
      }
    });

    // 6. Test Mobile Viewport (375x667)
    console.log(`[AUDIT] Testing Mobile Viewport 375x667...`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileOverflow = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const overflowingElements = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 2) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: el.className ? String(el.className).substring(0, 40) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      });
      return {
        viewportWidth: window.innerWidth,
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasHorizontalOverflow: scrollWidth > window.innerWidth || bodyScrollWidth > window.innerWidth,
        overflowingCount: overflowingElements.length,
        sampleOverflows: overflowingElements.slice(0, 8)
      };
    });
    console.log(`[AUDIT] Mobile viewport overflow check:`, mobileOverflow);
    if (mobileOverflow.hasHorizontalOverflow) {
      results.failed.push(`Mobile horizontal overflow detected: scrollWidth=${mobileOverflow.scrollWidth} > viewport=${mobileOverflow.viewportWidth}`);
    } else {
      results.passed.push('Mobile viewport has no horizontal overflow');
    }

    // Test mobile drawer toggle
    const menuBtn = await page.$('#menu-btn');
    if (menuBtn) {
      const menuBtnBox = await menuBtn.boundingBox();
      console.log(`[AUDIT] Mobile menu-btn size:`, menuBtnBox);
      if (menuBtnBox && (menuBtnBox.height < 36 || menuBtnBox.width < 36)) {
        results.touchTargetFailures.push(`Mobile #menu-btn size [${menuBtnBox.width}x${menuBtnBox.height}px] < 36px`);
      }
      await menuBtn.click();
      await page.waitForTimeout(400);
      const isDrawerOpen = await page.$eval('#sidebar', el => el.classList.contains('open')).catch(() => false);
      if (isDrawerOpen) {
        results.passed.push('Mobile navigation drawer opens smoothly');
      } else {
        results.failed.push('Mobile navigation drawer failed to open');
      }
    }

    console.log(`\n================ AUDIT SUMMARY ================`);
    console.log(`PASSED CHECKS (${results.passed.length}):`);
    results.passed.forEach(p => console.log(`  + ${p}`));
    console.log(`\nFAILED CHECKS (${results.failed.length}):`);
    results.failed.forEach(f => console.log(`  - ${f}`));
    console.log(`\nTOUCH TARGET FAILURES (${results.touchTargetFailures.length}):`);
    results.touchTargetFailures.forEach(t => console.log(`  ! ${t}`));
    if (consoleErrors.length > 0) {
      console.log(`\nCONSOLE ERRORS (${consoleErrors.length}):`);
      consoleErrors.forEach(e => console.log(`  * ${e}`));
    }
    console.log(`================================================\n`);

  } catch (err) {
    console.error(`[AUDIT ERROR]`, err);
  } finally {
    await browser.close();
    server.close();
  }
});
