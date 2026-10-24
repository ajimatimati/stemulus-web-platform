/**
 * Aspect 3 Deep QA/UX Audit Script:
 * Tutors' Main Operational Hub & Active Sessions (tutor-dashboard.html & tutor-engine.js)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8095;
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
  console.log(`[AUDIT] Aspect 3 Test Server active on http://localhost:${PORT}`);
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

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Establish cryptographically signed tutor session
    console.log(`[AUDIT] Step 1: Establishing Tutor Session...`);
    await page.goto(`http://localhost:${PORT}/parent-login.html?role=tutor`, { waitUntil: 'load' });
    await page.evaluate(() => {
      const tutorSession = {
        role: 'tutor',
        email: 'tutor@stemuluskidstech.com',
        name: 'Sarah Jane',
        id: 'tut-101',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(tutorSession);
      }
      localStorage.setItem('user', JSON.stringify(tutorSession));
      localStorage.setItem('role', 'tutor');
    });

    // 2. Load tutor-dashboard.html on Desktop
    console.log(`[AUDIT] Step 2: Navigating to tutor-dashboard.html (Desktop 1280x800)...`);
    const startTime = Date.now();
    await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const renderDuration = Date.now() - startTime;

    // Verify loading screen removed
    const loaderExists = await page.$eval('#loading-screen', el => !!el).catch(() => false);
    if (!loaderExists) {
      results.passed.push(`Loading screen removed cleanly in ${renderDuration}ms`);
    } else {
      results.failed.push('Loading screen (#loading-screen) remained in DOM or did not fade out');
    }

    // Verify Tutor Name & Avatar rendered
    const tutorName = await page.$eval('#tutor-name', el => el.textContent.trim()).catch(() => '');
    const heroName = await page.$eval('#hero-tutor-name', el => el.textContent.trim()).catch(() => '');
    if (tutorName.includes('Sarah') && heroName.includes('Sarah')) {
      results.passed.push(`Tutor identity correctly populated: "${tutorName}"`);
    } else {
      results.failed.push(`Tutor name failed to populate: nav="${tutorName}", hero="${heroName}"`);
    }

    // 3. Verify Stats & KPI Counters
    console.log(`[AUDIT] Step 3: Verifying KPIs and Stats Cards...`);
    const stats = await page.evaluate(() => {
      return {
        statUpcoming: document.getElementById('stat-upcoming')?.textContent.trim(),
        statStudents: document.getElementById('stat-students')?.textContent.trim(),
        statHours: document.getElementById('stat-hours')?.textContent.trim(),
        kpiUpcoming: document.getElementById('kpi-upcoming')?.textContent.trim(),
        kpiStudents: document.getElementById('kpi-students')?.textContent.trim(),
        kpiHours: document.getElementById('kpi-hours')?.textContent.trim()
      };
    });
    console.log('   Stats retrieved:', stats);
    if (stats.statStudents && parseInt(stats.statStudents) > 0) {
      results.passed.push(`Active students count verified: ${stats.statStudents}`);
    } else {
      results.uxGaps.push(`Active students stat card shows 0: check tutor student assignment`);
    }

    // 4. Verify Assigned Students Roster
    console.log(`[AUDIT] Step 4: Verifying Assigned Students List...`);
    const studentCards = await page.$$('#assigned-students-list > div');
    if (studentCards.length > 0) {
      results.passed.push(`Assigned students rendered (${studentCards.length} student items)`);
      
      // Check for Google Meet link and Google Classroom invite link
      const hasMeetLink = await page.$eval('#assigned-students-list a[href*="meet.google.com"]', el => !!el).catch(() => false);
      const hasLogBtn = await page.$eval('#assigned-students-list a[href*="tutor-attendance-create.html"]', el => !!el).catch(() => false);
      if (hasMeetLink) results.passed.push('Assigned student card contains Google Meet launch button');
      else results.uxGaps.push('No Google Meet link pill found in assigned students list');
      if (hasLogBtn) results.passed.push('Assigned student card contains direct "+ Log Attendance" button');
      else results.failed.push('Missing "+ Log Attendance" button in assigned student card');
    } else {
      results.uxGaps.push('No assigned students rendered in roster');
    }

    // 5. Verify Upcoming Class Sessions
    console.log(`[AUDIT] Step 5: Verifying Upcoming Class Sessions...`);
    const scheduleItems = await page.$$('#schedule-list > div');
    console.log(`   Found ${scheduleItems.length} schedule items`);
    if (scheduleItems.length > 0) {
      results.passed.push(`Schedule list rendered (${scheduleItems.length} sessions)`);
      
      // Verify Google Meet 1-click launch
      const meetBtn = await page.$eval('#schedule-list a[href*="join-class.html"]', el => el.getAttribute('href')).catch(() => null);
      if (meetBtn && meetBtn.includes('role=tutor')) {
        results.passed.push(`Google Meet 1-click launch route validated: ${meetBtn}`);
      } else {
        results.failed.push('Missing or invalid 1-click Google Meet launch link in upcoming class session');
      }

      // Verify Coverage button
      const coverageBtn = await page.$eval('#schedule-list button[onclick*="openCoverageModal"]', el => !!el).catch(() => false);
      if (coverageBtn) {
        results.passed.push('Peer coverage trigger button is present in upcoming session card');
      } else {
        results.uxGaps.push('Coverage button not present on unlogged/pending schedule items');
      }
    } else {
      results.uxGaps.push('Schedule list is empty');
    }

    // 6. Test Tutor Profile & Weekly Availability Matrix Modal
    console.log(`[AUDIT] Step 6: Testing Profile & Availability Matrix Modal...`);
    await page.evaluate(() => TutorEngine.openProfileModal());
    await page.waitForTimeout(300);
    const profileModalVisible = await page.$eval('#tutor-profile-modal', el => !el.classList.contains('hidden')).catch(() => false);
    if (profileModalVisible) {
      results.passed.push('Tutor Profile & Availability Matrix modal opens successfully');
      
      // Check availability matrix rows (7 days)
      const matrixRows = await page.$$('#tp-matrix-tbody tr');
      if (matrixRows.length === 7) {
        results.passed.push('Availability matrix contains all 7 days (Monday through Sunday)');
      } else {
        results.failed.push(`Availability matrix expected 7 rows, found ${matrixRows.length}`);
      }

      // Check banking inputs
      const hasBank = await page.$eval('#tp-bank-name', el => !!el).catch(() => false);
      const hasNuban = await page.$eval('#tp-account-number', el => !!el).catch(() => false);
      if (hasBank && hasNuban) {
        results.passed.push('Remuneration & Banking details inputs (Bank, NUBAN) verified');
      } else {
        results.failed.push('Missing Banking/NUBAN form fields in profile modal');
      }
      
      // Close modal
      await page.evaluate(() => TutorEngine.closeProfileModal());
      await page.waitForTimeout(200);
    } else {
      results.failed.push('Tutor Profile Modal failed to open');
    }

    // 7. Test Emergency Coverage Request Modal
    console.log(`[AUDIT] Step 7: Testing Emergency Coverage Request Modal...`);
    await page.evaluate(() => {
      const schedules = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getSchedules() : [];
      if (schedules.length > 0) {
        TutorEngine.openCoverageModal(schedules[0].id);
      }
    });
    await page.waitForTimeout(300);
    const covModalVisible = await page.$eval('#tutor-coverage-modal', el => el && el.style.display === 'flex').catch(() => false);
    if (covModalVisible) {
      results.passed.push('Emergency Coverage Request modal opens cleanly');
      const covStudent = await page.$eval('#cov-student-name', el => el.textContent.trim()).catch(() => '');
      if (covStudent) {
        results.passed.push(`Coverage target student populated: ${covStudent}`);
      }
      await page.evaluate(() => TutorEngine.closeCoverageModal());
    } else {
      results.failed.push('Emergency Coverage Modal failed to open or display');
    }

    // 8. Test Desktop Sidebar Collapsible Behavior
    console.log(`[AUDIT] Step 8: Testing Desktop Sidebar Collapsible Behavior...`);
    const initialSidebarWidth = await page.$eval('#sidebar', el => el.getBoundingClientRect().width);
    await page.evaluate(() => window.toggleTutorSidebar());
    await page.waitForTimeout(300);
    const collapsedSidebarWidth = await page.$eval('#sidebar', el => el.getBoundingClientRect().width);
    const hasCollapsedClass = await page.evaluate(() => document.body.classList.contains('sidebar-collapsed'));
    if (hasCollapsedClass && collapsedSidebarWidth < initialSidebarWidth) {
      results.passed.push(`Desktop sidebar collapsed smoothly from ${initialSidebarWidth}px to ${collapsedSidebarWidth}px`);
    } else {
      results.uxGaps.push(`Sidebar collapse failed: initial=${initialSidebarWidth}px, collapsed=${collapsedSidebarWidth}px`);
    }
    // Re-expand sidebar
    await page.evaluate(() => window.toggleTutorSidebar());
    await page.waitForTimeout(300);

    // 9. Mobile Viewport Audit (375x667 - iPhone SE standard)
    console.log(`[AUDIT] Step 9: Testing Mobile Viewport (375x667)...`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify Horizontal Overflow on Mobile
    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const overflowingElements = [];

      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1) {
          overflowingElements.push({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            right: rect.right,
            width: rect.width
          });
        }
      });

      return {
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth,
        overflowingElements: overflowingElements.slice(0, 5)
      };
    });

    if (!overflowInfo.hasOverflow) {
      results.passed.push(`Mobile horizontal layout: ZERO overflow (width=${overflowInfo.docWidth}px)`);
    } else {
      results.failed.push(`Mobile horizontal overflow detected: docWidth=${overflowInfo.docWidth}px, scrollWidth=${overflowInfo.scrollWidth}px, bodyScrollWidth=${overflowInfo.bodyScrollWidth}px`);
      console.log('   Overflowing elements:', overflowInfo.overflowingElements);
    }

    // Test Mobile Drawer Sidebar Open / Close
    console.log(`[AUDIT] Step 10: Testing Mobile Drawer Sidebar Open/Close...`);
    await page.click('#menu-btn');
    await page.waitForTimeout(300);
    const isDrawerOpen = await page.$eval('#sidebar', el => el.classList.contains('open')).catch(() => false);
    const isOverlayActive = await page.$eval('#sidebar-overlay', el => el.classList.contains('show')).catch(() => false);
    if (isDrawerOpen && isOverlayActive) {
      results.passed.push('Mobile sidebar drawer opened with active backdrop overlay');
      // Close via close button
      await page.click('#sidebar-close-btn');
      await page.waitForTimeout(300);
      const isDrawerClosed = await page.$eval('#sidebar', el => !el.classList.contains('open')).catch(() => false);
      if (isDrawerClosed) {
        results.passed.push('Mobile sidebar drawer closed successfully');
      } else {
        results.failed.push('Mobile sidebar drawer failed to close when clicking close button');
      }
    } else {
      results.failed.push('Mobile sidebar drawer failed to open on #menu-btn click');
    }

    // 11. WCAG 2.1 AA Touch Target Audit (All interactive elements >= 36px)
    console.log(`[AUDIT] Step 11: Testing WCAG 2.1 AA Touch Target Sizes...`);
    const touchAudits = await page.evaluate(() => {
      const interactiveSelectors = 'button, a, input, select, textarea, [role="button"]';
      const elements = Array.from(document.querySelectorAll(interactiveSelectors));
      const failures = [];

      elements.forEach(el => {
        // Skip hidden or detached elements
        if (el.offsetParent === null || window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden') {
          return;
        }
        // Skip hidden modal elements if modal is closed
        if (el.closest('.hidden') || el.closest('[style*="display: none"]') || el.closest('[style*="display:none"]')) {
          return;
        }

        const rect = el.getBoundingClientRect();
        // Skip elements with 0 width or height (e.g. hidden inputs)
        if (rect.width === 0 || rect.height === 0) return;

        // WCAG recommended min target size: 36px height and width
        const minDimension = 36;
        if (rect.height < minDimension || rect.width < minDimension) {
          failures.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: (el.className || '').toString().slice(0, 50),
            text: (el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      return failures;
    });

    if (touchAudits.length === 0) {
      results.passed.push('All interactive touch targets satisfy WCAG 2.1 AA (min 36x36px)');
    } else {
      results.touchTargetFailures = touchAudits;
      results.uxGaps.push(`Found ${touchAudits.length} interactive elements failing minimum 36px touch target size`);
      console.log(`   Touch target failures (${touchAudits.length}):`, touchAudits.slice(0, 8));
    }

    // 12. Check Console Errors
    if (consoleErrors.length === 0) {
      results.passed.push('Zero runtime console errors detected');
    } else {
      results.failed.push(`Console errors detected (${consoleErrors.length}): ${consoleErrors.join(' | ')}`);
    }

  } catch (err) {
    console.error('[AUDIT] Fatal test error:', err);
    results.failed.push(`Fatal test exception: ${err.message}`);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================');
  console.log('       ASPECT 3 AUDIT REPORT');
  console.log('========================================');
  console.log(`PASSED: ${results.passed.length}`);
  results.passed.forEach(p => console.log(`  [PASS] ${p}`));

  console.log(`\nFAILED: ${results.failed.length}`);
  results.failed.forEach(f => console.log(`  [FAIL] ${f}`));

  console.log(`\nUX COMPLIANCE GAPS: ${results.uxGaps.length}`);
  results.uxGaps.forEach(g => console.log(`  [GAP]  ${g}`));

  if (results.touchTargetFailures.length > 0) {
    console.log(`\nTOUCH TARGET FAILURES DETAILS (${results.touchTargetFailures.length}):`);
    results.touchTargetFailures.forEach(t => {
      console.log(`  - <${t.tag} id="${t.id}" class="${t.className}"> "${t.text}" => ${t.width}x${t.height}px`);
    });
  }
  console.log('========================================\n');
});
