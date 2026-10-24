/**
 * Automated QA & UX Audit Script: Aspect 4 (Attendance & Monthly Progress Reporting)
 * Covers:
 * - tutor-attendance.html
 * - tutor-attendance-create.html
 * - tutor-monthly-report.html
 * - assets/js/tutor-attendance-engine.js
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8094;
const ROOT_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/tutor-attendance.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webmanifest': 'application/manifest+json'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Audit Aspect 4] Static test server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function auditTouchTargets(page, pageName) {
  return await page.evaluate((pName) => {
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"], label.pill-radio, label.radio-card'));
    const failures = [];
    interactives.forEach(el => {
      // Ignore hidden elements
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0) {
        return;
      }
      if (rect.bottom < 0 || rect.top > 20000) return; // out of reasonable DOM bounds

      // Check minimum dimension (WCAG 2.1 AA guideline target: 36px)
      if (rect.width < 34 || rect.height < 34) {
        // Exclude specific inline text links inside paragraphs if any
        if (el.tagName === 'A' && el.closest('p, .text-xs, .field-hint') && !el.classList.contains('btn') && !el.classList.contains('pill')) {
          return;
        }
        // Exclude native checkboxes or radio buttons wrapped by a compliant interactive label
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const labelRect = parentLabel.getBoundingClientRect();
            if (labelRect.height >= 34 && labelRect.width >= 34) {
              return;
            }
          }
        }
        failures.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || '',
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().substring(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
    return failures;
  }, pageName);
}

async function auditOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyScroll = document.body.scrollWidth;
    const docScroll = document.documentElement.scrollWidth;
    const maxScroll = Math.max(bodyScroll, docScroll);
    const hasOverflow = maxScroll > docWidth + 1;

    let violatingElements = [];
    if (hasOverflow) {
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1 && el.offsetParent !== null) {
          violatingElements.push({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: (el.className || '').toString().slice(0, 50),
            right: Math.round(rect.right),
            docWidth
          });
        }
      });
    }

    return { docWidth, maxScroll, hasOverflow, violatingCount: violatingElements.length, violatingSample: violatingElements.slice(0, 5) };
  });
}

async function runAudit() {
  const server = await startStaticServer();
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  let totalPassed = 0;
  let totalFailed = 0;

  function pass(msg) {
    console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
    totalPassed++;
  }

  function fail(msg, details) {
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
    if (details) console.error('        Details:', details);
    totalFailed++;
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Catch page errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Failed to load resource: the server responded with a status of 404')) {
          consoleErrors.push(text);
        }
      }
    });

    // 1. Establish cryptographically signed tutor session on login page
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

    console.log('\n=============================================================');
    console.log('PART 1: AUDIT tutor-attendance.html (Attendance History)');
    console.log('=============================================================');

    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/tutor-attendance.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Verify session
    const isLoginPage = page.url().includes('login');
    if (!isLoginPage) {
      pass('Attendance History loaded in authenticated tutor session');
    } else {
      fail('Redirected to login instead of tutor-attendance.html');
    }

    // Check stats row
    const statSubmissions = await page.$eval('#stat-total-submissions', el => el.textContent.trim()).catch(() => null);
    if (statSubmissions !== null) {
      pass(`Stats summary counter mounted (Total Submissions: ${statSubmissions})`);
    } else {
      fail('Stats summary counter #stat-total-submissions not found');
    }

    // Check tab switching
    const tabStandIn = await page.$('#tab-stand-in');
    if (tabStandIn) {
      await tabStandIn.click();
      await page.waitForTimeout(200);
      const tabClass = await page.$eval('#tab-stand-in', el => el.className);
      if (tabClass.includes('text-blue-600') || tabClass.includes('active')) {
        pass('Stand-in Lessons tab switches active state cleanly');
      } else {
        fail('Stand-in Lessons tab did not adopt active state class', tabClass);
      }
      // Switch back
      await page.click('#tab-my-students');
    }

    // Touch targets check Desktop
    const touchFailuresHistDesktop = await auditTouchTargets(page, 'tutor-attendance.html (Desktop)');
    if (touchFailuresHistDesktop.length === 0) {
      pass('Desktop Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Desktop Touch Targets: ${touchFailuresHistDesktop.length} undersized elements`, touchFailuresHistDesktop);
    }

    // Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const overflowHistMobile = await auditOverflow(page);
    if (!overflowHistMobile.hasOverflow) {
      pass(`Mobile Layout: Zero horizontal overflow on 375px viewport (maxScroll: ${overflowHistMobile.maxScroll}px)`);
    } else {
      fail(`Mobile Layout: Horizontal overflow detected (${overflowHistMobile.maxScroll}px > ${overflowHistMobile.docWidth}px)`, overflowHistMobile.violatingSample);
    }

    const touchFailuresHistMobile = await auditTouchTargets(page, 'tutor-attendance.html (Mobile)');
    if (touchFailuresHistMobile.length === 0) {
      pass('Mobile Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Mobile Touch Targets: ${touchFailuresHistMobile.length} undersized elements`, touchFailuresHistMobile);
    }

    // Test Mobile Drawer toggle
    const menuBtn = await page.$('#menu-btn');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      const sidebarOpen = await page.$eval('#sidebar', el => el.classList.contains('open'));
      if (sidebarOpen) {
        pass('Mobile Navigation Drawer opens cleanly upon clicking #menu-btn');
      } else {
        fail('Mobile Navigation Drawer failed to open on #menu-btn click');
      }
      const closeBtn = await page.$('#sidebar-close-btn');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(300);
        const sidebarClosed = await page.$eval('#sidebar', el => !el.classList.contains('open'));
        if (sidebarClosed) {
          pass('Mobile Navigation Drawer closes cleanly upon close button click');
        } else {
          fail('Mobile Navigation Drawer failed to close');
        }
      }
    }

    console.log('\n=============================================================');
    console.log('PART 2: AUDIT tutor-attendance-create.html (Log Class Session)');
    console.log('=============================================================');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/tutor-attendance-create.html`, { waitUntil: 'load' });
    await page.waitForTimeout(800);

    // Form presence
    const formPresent = await page.$('#attendanceForm');
    if (formPresent) {
      pass('Attendance Logging Form (#attendanceForm) mounted');
    } else {
      fail('#attendanceForm not found in DOM');
    }

    // Check student population
    const studentSelect = await page.$('#student_id_select');
    if (studentSelect) {
      const studentOptionsCount = await page.$$eval('#student_id_select option', opts => opts.length);
      if (studentOptionsCount > 1) {
        pass(`Assigned student dropdown automatically populated with ${studentOptionsCount - 1} students`);
      } else {
        fail(`Assigned student dropdown empty or has <= 1 option (count: ${studentOptionsCount})`);
      }
    } else {
      fail('#student_id_select not found');
    }

    // Step navigation check
    const stepItemsCount = await page.$$eval('.step-item', items => items.length);
    if (stepItemsCount >= 4) {
      pass(`Multi-step progress bar present with ${stepItemsCount} steps`);
    } else {
      fail(`Multi-step bar has fewer than 4 steps (${stepItemsCount})`);
    }

    // Test Express Fill feature
    const expressBtn = await page.$('button[onclick*="expressFillSession"]');
    if (expressBtn) {
      await expressBtn.click();
      await page.waitForTimeout(300);
      const activeStep = await page.evaluate(() => window.currentStep);
      const topicVal = await page.$eval('#topic', el => el.value).catch(() => '');
      if (activeStep === 4 && topicVal.length > 0) {
        pass(`1-Click Express Fill works: populates topic ("${topicVal.substring(0, 25)}...") & advances to Step 4 Review`);
      } else {
        fail(`Express Fill failed: activeStep=${activeStep}, topicVal="${topicVal}"`);
      }
    } else {
      fail('Express Fill 1-click button not found');
    }

    // Touch targets check on Create page
    const touchFailuresCreateDesktop = await auditTouchTargets(page, 'tutor-attendance-create.html (Desktop)');
    if (touchFailuresCreateDesktop.length === 0) {
      pass('Desktop Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Desktop Touch Targets: ${touchFailuresCreateDesktop.length} undersized elements`, touchFailuresCreateDesktop);
    }

    // Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const overflowCreateMobile = await auditOverflow(page);
    if (!overflowCreateMobile.hasOverflow) {
      pass(`Mobile Layout: Zero horizontal overflow on 375px viewport (maxScroll: ${overflowCreateMobile.maxScroll}px)`);
    } else {
      fail(`Mobile Layout: Horizontal overflow detected (${overflowCreateMobile.maxScroll}px > ${overflowCreateMobile.docWidth}px)`, overflowCreateMobile.violatingSample);
    }

    const touchFailuresCreateMobile = await auditTouchTargets(page, 'tutor-attendance-create.html (Mobile)');
    if (touchFailuresCreateMobile.length === 0) {
      pass('Mobile Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Mobile Touch Targets: ${touchFailuresCreateMobile.length} undersized elements`, touchFailuresCreateMobile);
    }

    console.log('\n=============================================================');
    console.log('PART 3: AUDIT tutor-monthly-report.html (Monthly Report)');
    console.log('=============================================================');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/tutor-monthly-report.html`, { waitUntil: 'load' });
    await page.waitForTimeout(800);

    // Tutor name population
    const reportTutorName = await page.$eval('#report-tutor-name', el => el.value).catch(() => '');
    if (reportTutorName.includes('Sarah Jane')) {
      pass(`Tutor name correctly auto-populated: "${reportTutorName}"`);
    } else {
      fail(`Tutor name not populated or incorrect: "${reportTutorName}"`);
    }

    // Verified compensation audit notice
    const noticePresent = await page.$('#report-stats-notice');
    if (noticePresent) {
      pass('Verified Compensation & Attendance Audit component rendered');
    } else {
      fail('#report-stats-notice not rendered');
    }

    // Tab toggle check: Form vs History
    const tabHistory = await page.$('#tab-btn-history');
    if (tabHistory) {
      await tabHistory.click();
      await page.waitForTimeout(200);
      const isHistoryActive = await page.$eval('#tab-btn-history', el => el.classList.contains('bg-white') || el.classList.contains('text-indigo-700') || el.classList.contains('active'));
      if (isHistoryActive) {
        pass('Report History tab toggle switches views cleanly');
      } else {
        fail('Report History tab did not switch active classes');
      }
      await page.click('#tab-btn-create');
    }

    // Touch targets check on Monthly Report
    const touchFailuresReportDesktop = await auditTouchTargets(page, 'tutor-monthly-report.html (Desktop)');
    if (touchFailuresReportDesktop.length === 0) {
      pass('Desktop Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Desktop Touch Targets: ${touchFailuresReportDesktop.length} undersized elements`, touchFailuresReportDesktop);
    }

    // Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const overflowReportMobile = await auditOverflow(page);
    if (!overflowReportMobile.hasOverflow) {
      pass(`Mobile Layout: Zero horizontal overflow on 375px viewport (maxScroll: ${overflowReportMobile.maxScroll}px)`);
    } else {
      fail(`Mobile Layout: Horizontal overflow detected (${overflowReportMobile.maxScroll}px > ${overflowReportMobile.docWidth}px)`, overflowReportMobile.violatingSample);
    }

    const touchFailuresReportMobile = await auditTouchTargets(page, 'tutor-monthly-report.html (Mobile)');
    if (touchFailuresReportMobile.length === 0) {
      pass('Mobile Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Mobile Touch Targets: ${touchFailuresReportMobile.length} undersized elements`, touchFailuresReportMobile);
    }

    // Check console errors
    if (consoleErrors.length === 0) {
      pass('Zero critical JavaScript console errors across all audited pages');
    } else {
      fail(`Encountered ${consoleErrors.length} console errors`, consoleErrors);
    }

  } catch (err) {
    fail('Audit run encountered fatal error', err.stack);
  } finally {
    await browser.close();
    server.close();
    console.log('\n=============================================================');
    console.log(`AUDIT RESULTS: ${totalPassed} Passed | ${totalFailed} Failed`);
    console.log('=============================================================');
    if (totalFailed > 0) {
      process.exit(1);
    }
  }
}

runAudit();
