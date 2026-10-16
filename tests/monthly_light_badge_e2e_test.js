/**
 * STEMulus Technology Passport™ - Chapter 1: The Light Evolution™
 * Comprehensive End-to-End Test Suite
 * 
 * Verifies:
 * 1. Engine & Data Integrity (All 48 Badges, 8 Eras, Age-Adaptive Logic)
 * 2. Parent Dashboard Integration (Preview Card, View Badge Button, Modal)
 * 3. Parent Progress Deep Journey (48-Badge Grid, Era Filtering, Counter & Progress Bar, Locked/Unlocked States)
 * 4. Age-Adaptive Scientific Explanations (Young Coder 5-7, Explorer 8-11, Scholar 12-17)
 * 5. Tutor Students Roster Integration (Monthly Badge Tag & Modal Launch)
 * 6. Tutor Dashboard Integration (Assigned Student Monthly Badge Indicators)
 * 7. Dynamic Progression & Badge Unlocking Logic
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8099;
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
  console.log(`============================================================`);
  console.log(`🎖️  STEMULUS TECHNOLOGY PASSPORT™: MONTHLY LIGHT BADGE E2E TEST`);
  console.log(`============================================================`);
  console.log(`Test Server active at: http://localhost:${PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    // -------------------------------------------------------------------------
    // PARENT PORTAL CONTEXT
    // -------------------------------------------------------------------------
    const parentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await parentCtx.addInitScript(() => {
      const parentSession = {
        name: 'Demo Parent',
        email: 'parent@stemuluskidstech.com',
        role: 'parent',
        issuedAt: Date.now()
      };
      sessionStorage.setItem('stemulus_session', JSON.stringify(parentSession));
      localStorage.setItem('stemulus_session', JSON.stringify(parentSession));
    });

    const parentPage = await parentCtx.newPage();
    parentPage.on('pageerror', err => {
      console.warn(`    [Parent Page Warning/Error]: ${err.message}`);
    });

    // -------------------------------------------------------------------------
    // TEST 1: Engine Integrity & Badge Data Validation (In-browser)
    // -------------------------------------------------------------------------
    console.log(`--- [TEST 1] Technology Passport Data & Engine Integrity ---`);
    await parentPage.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'load' });
    await parentPage.waitForTimeout(500);

    const engineCheck = await parentPage.evaluate(() => {
      if (typeof BadgePassportEngine === 'undefined') return { loaded: false };
      const badges = BadgePassportEngine.getAllBadges ? BadgePassportEngine.getAllBadges() : [];
      const eras = BadgePassportEngine.getEras ? BadgePassportEngine.getEras() : [];
      return {
        loaded: true,
        badgeCount: badges.length,
        eraCount: eras.length,
        firstBadge: badges[0],
        lastBadge: badges[badges.length - 1],
        eras
      };
    });

    assert(engineCheck.loaded === true, 'BadgePassportEngine is defined and loaded on the page');
    assert(engineCheck.badgeCount === 48, `All 48 monthly light evolution badges loaded (Got: ${engineCheck.badgeCount})`);
    assert(engineCheck.eraCount === 8, `All 8 historical light eras defined (Got: ${engineCheck.eraCount})`);
    assert(engineCheck.firstBadge && engineCheck.firstBadge.title === 'Fire Finder', 'First badge is Month 1: "Fire Finder"');
    assert(engineCheck.lastBadge && engineCheck.lastBadge.month === 48, 'Last badge is Month 48');

    // -------------------------------------------------------------------------
    // TEST 2: Parent Dashboard Preview Card & Badge Modal
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 2] Parent Dashboard Badge Preview & Modal Interaction ---`);
    const parentPageText = await parentPage.content();
    assert(parentPageText.includes('Technology Passport: Light Evolution'), 'Parent Dashboard renders Technology Passport card');
    assert(parentPageText.includes('View Badge'), 'Child card includes interactive "View Badge" button');

    // Click "View Badge" button
    const hasViewBtn = await parentPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('View Badge'));
      if (b) { b.click(); return true; }
      return false;
    });
    assert(hasViewBtn, 'Found and clicked "View Badge" button element in DOM');
    if (hasViewBtn) {
      await parentPage.waitForTimeout(600);

      const modal = await parentPage.$('#passport-badge-modal');
      const isVisible = modal ? await modal.isVisible() : false;
      assert(isVisible, 'Passport Badge Modal opened and visible on Parent Dashboard');

      const modalDetails = await parentPage.evaluate(() => {
        const m = document.getElementById('passport-badge-modal');
        if (!m) return null;
        return {
          title: document.getElementById('pbm-title')?.textContent?.trim(),
          era: document.getElementById('pbm-era-badge')?.textContent?.trim(),
          problem: document.getElementById('pbm-problem')?.textContent?.trim(),
          science: document.getElementById('pbm-science')?.textContent?.trim(),
          stemulus: document.getElementById('pbm-stemulus')?.textContent?.trim(),
          next: document.getElementById('pbm-next')?.textContent?.trim(),
          hasImg: !!document.getElementById('pbm-image')?.getAttribute('src')
        };
      });

      assert(!!modalDetails?.title, `Modal displays badge title: "${modalDetails?.title}"`);
      assert(!!modalDetails?.era, `Modal displays era tag: "${modalDetails?.era}"`);
      assert(!!modalDetails?.problem, 'Modal displays Problem Solved section');
      assert(!!modalDetails?.science, 'Modal displays Scientific Principle baseline');
      assert(!!modalDetails?.stemulus, 'Modal displays STEMulus Connection & project hands-on link');
      assert(!!modalDetails?.next, 'Modal displays Next Milestone Discovery teaser');
      assert(modalDetails?.hasImg === true, 'Modal displays badge artwork image');

      // Test modal close
      await parentPage.evaluate(() => BadgePassportEngine.closeBadgeModal());
      await parentPage.waitForTimeout(300);
      const isModalClosed = !(await modal.isVisible());
      assert(isModalClosed, 'Badge modal closes cleanly on close action');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Parent Progress Deep 48-Badge Journey & Era Filtering
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 3] Parent Progress 48-Badge Journey, Grid & Era Filters ---`);
    await parentPage.goto(`http://localhost:${PORT}/parent-progress.html`, { waitUntil: 'load' });
    await parentPage.waitForTimeout(1000);

    const passportSection = await parentPage.$('#passport-section');
    assert(!!passportSection, 'Parent Progress renders dedicated #passport-section');

    const counterText = await parentPage.evaluate(() => document.getElementById('passport-badge-counter')?.textContent?.trim());
    assert(counterText && counterText.includes('/ 48 Unlocked'), `Badge Counter displays progression: "${counterText}"`);

    const progressFill = await parentPage.evaluate(() => document.getElementById('passport-progress-fill')?.style?.width);
    assert(!!progressFill && progressFill !== '', `Badge progress bar fill computed: ${progressFill}`);

    // Verify initial "All Eras" view renders all 48 badges
    const initialBadgeCount = await parentPage.evaluate(() => {
      const grid = document.getElementById('passport-badges-grid');
      return grid ? grid.children.length : 0;
    });
    assert(initialBadgeCount === 48, `Default "All Eras" view renders exactly 48 badges in grid (Got: ${initialBadgeCount})`);

    // Verify presence of locked badges with lock icons
    const lockedBadgesCount = await parentPage.evaluate(() => {
      const grid = document.getElementById('passport-badges-grid');
      return grid ? grid.querySelectorAll('[data-lucide="lock"], svg.lucide-lock').length : 0;
    });
    assert(lockedBadgesCount > 0, `Locked badges display padlock indicators (Count: ${lockedBadgesCount})`);

    // Test Era Filter Switching: Click Era I (Months 1-6)
    console.log(`    Testing Era Filter: Era I (First Light, Months 1-6)...`);
    const era1Btn = await parentPage.$('button[data-era="1"]');
    if (era1Btn) {
      await era1Btn.click();
      await parentPage.waitForTimeout(400);

      const era1Count = await parentPage.evaluate(() => document.getElementById('passport-badges-grid')?.children?.length || 0);
      assert(era1Count === 6, `Era I filter displays exactly 6 badges (Got: ${era1Count})`);
    }

    // Test Era Filter Switching: Click Era II (Months 7-12)
    console.log(`    Testing Era Filter: Era II (Flamecraft, Months 7-12)...`);
    const era2Btn = await parentPage.$('button[data-era="2"]');
    if (era2Btn) {
      await era2Btn.click();
      await parentPage.waitForTimeout(400);

      const era2Count = await parentPage.evaluate(() => document.getElementById('passport-badges-grid')?.children?.length || 0);
      assert(era2Count === 6, `Era II filter displays exactly 6 badges (Got: ${era2Count})`);
    }

    // Test Era Filter Switching: Click Era V (Electric Revolution, Months 25-30)
    console.log(`    Testing Era Filter: Era V (Electric Revolution, Months 25-30)...`);
    const era5Btn = await parentPage.$('button[data-era="5"]');
    if (era5Btn) {
      await era5Btn.click();
      await parentPage.waitForTimeout(400);

      const era5Count = await parentPage.evaluate(() => document.getElementById('passport-badges-grid')?.children?.length || 0);
      assert(era5Count === 6, `Era V filter displays exactly 6 badges (Got: ${era5Count})`);
    }

    // Test Restoring "All Eras"
    console.log(`    Testing Restoring "All Eras" filter...`);
    const allErasBtn = await parentPage.$('button[data-era="all"]');
    if (allErasBtn) {
      await allErasBtn.click();
      await parentPage.waitForTimeout(400);

      const restoredCount = await parentPage.evaluate(() => document.getElementById('passport-badges-grid')?.children?.length || 0);
      assert(restoredCount === 48, `Restoring "All Eras" brings back all 48 badges (Got: ${restoredCount})`);
    }

    // Test Clicking an Unlocked Badge in Parent Progress
    const firstBadgeCard = await parentPage.$('#passport-badges-grid > div:first-child');
    if (firstBadgeCard) {
      await firstBadgeCard.click();
      await parentPage.waitForTimeout(500);

      const progressModal = await parentPage.$('#passport-badge-modal');
      const isProgressModalVisible = progressModal ? await progressModal.isVisible() : false;
      assert(isProgressModalVisible, 'Clicking badge card in Parent Progress opens Passport Badge Modal');

      await parentPage.evaluate(() => BadgePassportEngine.closeBadgeModal());
      await parentPage.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Age-Adaptive Scientific Explanations
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 4] Age-Adaptive Science Explanation Verification ---`);
    const explanations = await parentPage.evaluate(() => {
      // Badge 1: Fire Finder
      BadgePassportEngine.openBadgeModal(1, 6);
      const textYoung = document.getElementById('pbm-age-explanation')?.textContent?.trim();

      BadgePassportEngine.openBadgeModal(1, 10);
      const textExplorer = document.getElementById('pbm-age-explanation')?.textContent?.trim();

      BadgePassportEngine.openBadgeModal(1, 15);
      const textScholar = document.getElementById('pbm-age-explanation')?.textContent?.trim();

      BadgePassportEngine.closeBadgeModal();

      return { textYoung, textExplorer, textScholar };
    });

    assert(!!explanations.textYoung, `Young Coder (Ages 5-7) explanation: "${explanations.textYoung.slice(0, 55)}..."`);
    assert(!!explanations.textExplorer, `Explorer (Ages 8-11) explanation: "${explanations.textExplorer.slice(0, 55)}..."`);
    assert(!!explanations.textScholar, `Scholar (Ages 12-17) explanation: "${explanations.textScholar.slice(0, 55)}..."`);
    assert(explanations.textYoung !== explanations.textScholar, 'Explanations dynamically adapt with tailored pedagogy across age brackets');

    // -------------------------------------------------------------------------
    // TEST 5: Tutor Students Roster Integration
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 5] Tutor Students Roster Monthly Badge Integration ---`);
    const tutorCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await tutorCtx.addInitScript(() => {
      const tutorSession = {
        name: 'Sarah Jane',
        email: 'tutor@stemuluskidstech.com',
        role: 'tutor',
        issuedAt: Date.now()
      };
      sessionStorage.setItem('stemulus_session', JSON.stringify(tutorSession));
      localStorage.setItem('stemulus_session', JSON.stringify(tutorSession));
    });

    const tutorPage = await tutorCtx.newPage();
    tutorPage.on('pageerror', err => {
      console.warn(`    [Tutor Page Warning/Error]: ${err.message}`);
    });

    await tutorPage.goto(`http://localhost:${PORT}/tutor-students.html`, { waitUntil: 'load' });
    await tutorPage.waitForTimeout(1000);

    const tutorStudentsHtml = await tutorPage.content();
    assert(tutorStudentsHtml.includes('Month') && tutorStudentsHtml.includes('of 48'), 'Tutor Students roster displays student monthly badge progression');

    const tutorViewBadgeBtn = await tutorPage.$('button:has-text("View Badge")');
    assert(!!tutorViewBadgeBtn, 'Tutor Students page has clickable "View Badge" modal launcher');
    if (tutorViewBadgeBtn) {
      await tutorPage.evaluate(btn => btn.click(), tutorViewBadgeBtn);
      await tutorPage.waitForTimeout(500);

      const tutorModal = await tutorPage.$('#passport-badge-modal');
      const isTutorModalOpen = tutorModal ? await tutorModal.isVisible() : false;
      assert(isTutorModalOpen, 'Badge modal opens from Tutor Students roster');

      await tutorPage.evaluate(() => BadgePassportEngine.closeBadgeModal());
      await tutorPage.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Tutor Dashboard Assigned Student Badge Indicators
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 6] Tutor Dashboard Student Badge Indicator ---`);
    await tutorPage.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'load' });
    await tutorPage.waitForTimeout(1000);

    const tutorDashHtml = await tutorPage.content();
    const hasStudentBadgeChip = tutorDashHtml.includes('Month') && (tutorDashHtml.includes('Flame Controller') || tutorDashHtml.includes('Fire Finder') || tutorDashHtml.includes('Torch Maker'));
    assert(hasStudentBadgeChip, 'Tutor Dashboard displays student monthly badge chip in assigned student roster');

    // -------------------------------------------------------------------------
    // TEST 7: Dynamic Membership Progression & Badge Unlocking
    // -------------------------------------------------------------------------
    console.log(`\n--- [TEST 7] Dynamic Progression & Unlocking Recalculation ---`);
    const progressionCheck = await parentPage.evaluate(() => {
      // 1 Month student
      const pass1 = BadgePassportEngine.getStudentPassport({ id: 'sim-std-1', currentMonth: 1, age: 7 });
      // 7 Month student (Era II: Flamecraft)
      const pass7 = BadgePassportEngine.getStudentPassport({ id: 'sim-std-7', currentMonth: 7, age: 10 });
      // 25 Month student (Era V: The Electric Revolution)
      const pass25 = BadgePassportEngine.getStudentPassport({ id: 'sim-std-25', currentMonth: 25, age: 14 });

      return {
        pass1Unlocked: pass1.unlockedCount,
        pass1Title: pass1.currentBadge?.title,
        pass7Unlocked: pass7.unlockedCount,
        pass7Title: pass7.currentBadge?.title,
        pass7Era: pass7.currentBadge?.eraName,
        pass7Percent: pass7.completionPercent,
        pass25Unlocked: pass25.unlockedCount,
        pass25Title: pass25.currentBadge?.title,
        pass25Era: pass25.currentBadge?.eraName,
        pass25Percent: pass25.completionPercent
      };
    });

    assert(progressionCheck.pass1Unlocked === 1, `Month 1 student has 1 unlocked badge (Got: ${progressionCheck.pass1Unlocked})`);
    assert(progressionCheck.pass1Title === 'Fire Finder', `Month 1 badge is "${progressionCheck.pass1Title}"`);
    assert(progressionCheck.pass7Unlocked === 7, `Month 7 student has 7 unlocked badges (Got: ${progressionCheck.pass7Unlocked})`);
    assert(progressionCheck.pass7Era === 'Era II: Flamecraft', `Month 7 student advanced to "${progressionCheck.pass7Era}"`);
    assert(progressionCheck.pass7Percent === Math.round((7 / 48) * 100), `Month 7 completion percentage accurate (${progressionCheck.pass7Percent}%)`);
    assert(progressionCheck.pass25Unlocked === 25, `Month 25 student has 25 unlocked badges (Got: ${progressionCheck.pass25Unlocked})`);
    assert(progressionCheck.pass25Era === 'Era V: The Electric Revolution', `Month 25 student reached "${progressionCheck.pass25Era}"`);

    await parentCtx.close();
    await tutorCtx.close();
    await browser.close();
  } catch (err) {
    console.error('Fatal error during badge E2E test execution:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n============================================================`);
    console.log(`🏆 MONTHLY LIGHT BADGE E2E TEST SUMMARY`);
    console.log(`============================================================`);
    console.log(`TOTAL CHECKS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`============================================================\n`);

    process.exit(failed === 0 ? 0 : 1);
  }
});
