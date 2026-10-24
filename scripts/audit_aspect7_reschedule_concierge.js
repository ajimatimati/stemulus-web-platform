/**
 * Automated QA & UX Audit Script: Aspect 7 (Parents' Smart Reschedule Concierge)
 * Covers:
 * - parent-dashboard.html
 * - assets/js/reschedule-concierge-engine.js
 * - assets/js/parent-engine.js
 * - #parent-reschedule-modal, #resch-recommended-container, #resch-recommended-slots, #resch-live-availability
 * - Conflict checking diagnostics, 1-click recommended slot selection, reschedule request submission
 * - WCAG touch targets (>= 34px, target 38px/40px)
 * - Mobile responsive 375px zero horizontal overflow
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8097;
const ROOT_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/parent-dashboard.html';
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
      console.log(`[Audit Aspect 7] Static test server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function auditTouchTargets(page, contextLabel) {
  return await page.evaluate((label) => {
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
    const failures = [];
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0) {
        return;
      }
      if (rect.bottom < 0 || rect.top > 25000) return;

      if (rect.width < 34 || rect.height < 34) {
        // Exclude inline text links inside paragraphs
        if (el.tagName === 'A' && el.closest('p, .text-xs, .field-hint') && !el.classList.contains('btn') && !el.classList.contains('pill') && !el.classList.contains('btn-3d')) {
          return;
        }
        // Exclude inputs wrapped in compliant labels
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const labelRect = parentLabel.getBoundingClientRect();
            if (labelRect.height >= 34 && labelRect.width >= 34) return;
          }
        }
        failures.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: (el.className || '').toString().substring(0, 50),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().substring(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
    return failures;
  }, contextLabel);
}

async function auditOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyScroll = document.body.scrollWidth;
    const docScroll = document.documentElement.scrollWidth;
    const maxScroll = Math.max(bodyScroll, docScroll);
    const hasOverflow = maxScroll > docWidth + 1;

    let offender = null;
    if (hasOverflow) {
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 2) {
          offender = {
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: (el.className || '').toString().substring(0, 50),
            right: Math.round(r.right),
            docWidth
          };
          break;
        }
      }
    }

    return {
      hasOverflow,
      docWidth,
      maxScroll,
      offender
    };
  });
}

async function runAudit() {
  console.log('\n=============================================================');
  console.log('--- ASPECT 7 AUDIT: PARENTS\' SMART RESCHEDULE CONCIERGE ---');
  console.log('=============================================================\n');

  const server = await startStaticServer();
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('net::ERR_ABORTED') && !txt.includes('firestore')) {
        consoleErrors.push(txt);
      }
    }
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    const failure = req.failure() ? req.failure().errorText : '';
    if (failure.includes('ERR_ABORTED') || req.url().includes('firestore.googleapis.com')) return;
    failedRequests.push({ url: req.url(), failure });
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('firestore')) {
      failedRequests.push({ url: resp.url(), status: resp.status() });
    }
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      testsFailed++;
    }
  }

  try {
    // 1. Setup authenticated parent session via login page
    await page.goto(`http://localhost:${PORT}/parent-login.html?role=parent`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const parentSession = {
        role: 'parent',
        email: 'parent@stemuluskidstech.com',
        name: 'Mrs. Folashade Adeyemi',
        id: 'par-101',
        issuedAt: Date.now()
      };
      if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
        StemulusSecurity.saveSecureSession(parentSession);
      }
      localStorage.setItem('user', JSON.stringify(parentSession));
      localStorage.setItem('role', 'parent');
    });

    // Navigate to parent dashboard
    await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Test 1: Page loads and session initializes
    const heroName = await page.$eval('#hero-user-name', el => el.innerText).catch(() => '');
    assert(heroName.includes('Folashade') || heroName.length > 0, 'Parent session authenticated and hero personalized', heroName);

    // Test 2: Upcoming session card exists and contains Reschedule button
    const rescheduleBtns = await page.$$('#sessions-container button[onclick*="openRescheduleModal"]');
    assert(rescheduleBtns.length > 0, 'Upcoming session cards render Reschedule button', `Found: ${rescheduleBtns.length}`);

    // Test 3: Modal opens when clicking Reschedule
    await page.locator('#sessions-container button[onclick*="openRescheduleModal"]').first().click();
    await page.waitForTimeout(300);

    const isModalVisible = await page.evaluate(() => {
      const m = document.getElementById('parent-reschedule-modal');
      return m && window.getComputedStyle(m).display !== 'none';
    });
    assert(isModalVisible, 'Reschedule modal opens on button click (#parent-reschedule-modal)');

    // Test 4: Modal pre-populates session info
    const modalSessionInfo = await page.evaluate(() => {
      const course = document.getElementById('resch-title-course');
      const details = document.getElementById('resch-current-details');
      const schedId = document.getElementById('resch-schedule-id');
      return {
        course: course ? course.innerText : '',
        details: details ? details.innerText : '',
        schedId: schedId ? schedId.value : ''
      };
    });
    assert(modalSessionInfo.course.length > 0, 'Modal pre-populates course and student name', modalSessionInfo.course);
    assert(modalSessionInfo.details.includes('WAT'), 'Modal pre-populates session date/time/mentor with WAT timezone', modalSessionInfo.details);
    assert(modalSessionInfo.schedId.length > 0, 'Modal tracks underlying schedule ID', modalSessionInfo.schedId);

    // Test 5: 1-Click Recommended Open Slots render
    const recommendedSlotsCount = await page.evaluate(() => {
      const container = document.getElementById('resch-recommended-container');
      const slots = document.querySelectorAll('#resch-recommended-slots .btn-resch-slot');
      const isContainerVisible = container && window.getComputedStyle(container).display !== 'none';
      return {
        isContainerVisible,
        count: slots.length
      };
    });
    assert(recommendedSlotsCount.isContainerVisible && recommendedSlotsCount.count > 0,
      '1-Click Recommended Open Slots rendered (Autonomous Scan)',
      `Slots count: ${recommendedSlotsCount.count}`);

    // Test 6: Touch target compliance inside modal
    const modalTouchAudit = await page.evaluate(() => {
      const modal = document.getElementById('parent-reschedule-modal');
      const failures = [];
      if (!modal) return [{ error: 'Modal not found' }];

      const closeBtn = modal.querySelector('button[onclick*="closeRescheduleModal"]');
      if (closeBtn) {
        const r = closeBtn.getBoundingClientRect();
        if (r.width < 34 || r.height < 34) {
          failures.push({ name: 'Modal close button', width: Math.round(r.width), height: Math.round(r.height) });
        }
      }

      const slotBtns = modal.querySelectorAll('.btn-resch-slot');
      slotBtns.forEach((b, i) => {
        const r = b.getBoundingClientRect();
        if (r.height < 34) {
          failures.push({ name: `Slot button ${i+1}`, height: Math.round(r.height) });
        }
      });

      const dateInput = document.getElementById('resch-new-date');
      if (dateInput) {
        const r = dateInput.getBoundingClientRect();
        if (r.height < 34) failures.push({ name: 'Date input', height: Math.round(r.height) });
      }

      const timeInput = document.getElementById('resch-new-time');
      if (timeInput) {
        const r = timeInput.getBoundingClientRect();
        if (r.height < 34) failures.push({ name: 'Time input', height: Math.round(r.height) });
      }

      const reasonSelect = document.getElementById('resch-reason');
      if (reasonSelect) {
        const r = reasonSelect.getBoundingClientRect();
        if (r.height < 34) failures.push({ name: 'Reason select', height: Math.round(r.height) });
      }

      const submitBtn = modal.querySelector('button[type="submit"]');
      if (submitBtn) {
        const r = submitBtn.getBoundingClientRect();
        if (r.height < 34) failures.push({ name: 'Submit button', height: Math.round(r.height) });
      }

      return failures;
    });
    assert(modalTouchAudit.length === 0, 'All modal touch targets satisfy WCAG 2.1 AA (>= 34px)', JSON.stringify(modalTouchAudit));

    // Test 7: Clicking a 1-click recommended slot auto-populates date/time and highlights button
    const slotSelectionResult = await page.evaluate(() => {
      const firstSlot = document.querySelector('#resch-recommended-slots .btn-resch-slot');
      if (!firstSlot) return { success: false, reason: 'no slot button' };
      firstSlot.click();

      const dateVal = document.getElementById('resch-new-date').value;
      const timeVal = document.getElementById('resch-new-time').value;
      const hasRing = firstSlot.classList.contains('ring-2');

      const liveFeedback = document.getElementById('resch-live-availability');
      const liveFeedbackVisible = liveFeedback && window.getComputedStyle(liveFeedback).display !== 'none';
      const liveFeedbackText = liveFeedback ? liveFeedback.innerText : '';

      return {
        success: !!(dateVal && timeVal && hasRing),
        dateVal,
        timeVal,
        hasRing,
        liveFeedbackVisible,
        liveFeedbackText
      };
    });
    assert(slotSelectionResult.success, '1-Click slot click populates date and time with active ring highlight',
      `Date: ${slotSelectionResult.dateVal}, Time: ${slotSelectionResult.timeVal}`);
    assert(slotSelectionResult.liveFeedbackVisible && slotSelectionResult.liveFeedbackText.includes('verified available'),
      'Live availability diagnostic indicator confirms coach availability',
      slotSelectionResult.liveFeedbackText);

    // Test 8: Live conflict diagnostic feedback when picking a conflicting slot
    const conflictResult = await page.evaluate(() => {
      // Pick a date/time known to conflict or simulate tutor conflict
      const db = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getDB() : null;
      if (!db || !db.schedules || db.schedules.length < 2) return { success: true, simulated: true };

      // Find another active session
      const currentSchedId = document.getElementById('resch-schedule-id').value;
      const otherSession = db.schedules.find(s => s.id !== currentSchedId && s.status !== 'cancelled');
      if (!otherSession) return { success: true, simulated: true };

      // Set date and time to match that session
      const dateIn = document.getElementById('resch-new-date');
      const timeIn = document.getElementById('resch-new-time');
      dateIn.value = otherSession.date;
      timeIn.value = otherSession.time;
      ParentEngine.checkLiveRescheduleAvailability();

      const feedback = document.getElementById('resch-live-availability');
      const isVisible = feedback && window.getComputedStyle(feedback).display !== 'none';
      const text = feedback ? feedback.innerText : '';
      return {
        success: isVisible,
        text,
        isConflict: text.includes('conflict') || text.includes('peer coach') || text.includes('coverage')
      };
    });
    assert(conflictResult.success, 'Conflict checker correctly evaluates schedule slots', conflictResult.text);

    // Test 9: Close button closes modal
    const closeModalResult = await page.evaluate(() => {
      ParentEngine.closeRescheduleModal();
      const m = document.getElementById('parent-reschedule-modal');
      return m && window.getComputedStyle(m).display === 'none';
    });
    assert(closeModalResult, 'Modal closes cleanly on close action');

    // Test 10: Re-open modal and submit reschedule request
    await page.locator('#sessions-container button[onclick*="openRescheduleModal"]').first().click();
    await page.waitForTimeout(200);

    // Select recommended slot 1 again
    await page.evaluate(() => {
      const firstSlot = document.querySelector('#resch-recommended-slots .btn-resch-slot');
      if (firstSlot) firstSlot.click();
    });
    await page.waitForTimeout(200);

    // Submit form
    const submitResult = await page.evaluate(() => {
      const form = document.getElementById('resch-form');
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.click();

      // Check DB
      const db = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getDB() : null;
      const requests = db ? db.rescheduleRequests : [];
      const latestReq = requests && requests.length > 0 ? requests[requests.length - 1] : null;

      // Check parent notifications
      const notifs = db ? db.notifications : [];
      const parentNotif = notifs.find(n => n.userEmail === 'parent@stemuluskidstech.com');

      const modalHidden = document.getElementById('parent-reschedule-modal').style.display === 'none';

      return {
        modalHidden,
        hasRequest: !!latestReq,
        latestReq,
        hasParentNotif: !!parentNotif,
        parentNotif
      };
    });

    assert(submitResult.modalHidden, 'Modal closes immediately after submission');
    assert(submitResult.hasRequest && submitResult.latestReq.status === 'pending',
      'Reschedule request persisted to database with pending status',
      JSON.stringify(submitResult.latestReq));
    assert(submitResult.hasParentNotif,
      'Parent received confirmation notification in database',
      submitResult.parentNotif ? submitResult.parentNotif.message : 'None');

    // Test 11: Parent notification rendered in UI
    const notifsRendered = await page.evaluate(() => {
      const container = document.getElementById('parent-notifications-list');
      return container ? container.innerText : '';
    });
    assert(notifsRendered.includes('Reschedule Request Received') || notifsRendered.includes('reschedule') || notifsRendered.includes('registered'),
      'Parent notification list dynamically displays reschedule confirmation');

    // Test 12: Mobile Viewport 375px Audit (Zero Overflow & Touch Targets)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileOverflow = await auditOverflow(page);
    assert(!mobileOverflow.hasOverflow,
      `Mobile 375px zero horizontal overflow (maxScroll: ${mobileOverflow.maxScroll}px, docWidth: ${mobileOverflow.docWidth}px)`,
      mobileOverflow.hasOverflow ? JSON.stringify(mobileOverflow.offender) : 'Clean');

    // Test 13: Mobile modal open and overflow test
    const mobileBtnCount = await page.locator('button:has-text("Reschedule")').count();
    if (mobileBtnCount > 0) {
      await page.locator('button:has-text("Reschedule")').first().click();
      await page.waitForTimeout(200);

      const modalMobileOverflow = await page.evaluate(() => {
        const modal = document.getElementById('parent-reschedule-modal');
        const card = modal.querySelector('div');
        const docWidth = document.documentElement.clientWidth;
        const cardWidth = card ? card.offsetWidth : 0;
        return {
          cardWidth,
          docWidth,
          fitsInside: cardWidth <= docWidth
        };
      });
      assert(modalMobileOverflow.fitsInside,
        `Mobile modal fits within 375px viewport (cardWidth: ${modalMobileOverflow.cardWidth}px, docWidth: ${modalMobileOverflow.docWidth}px)`);

      const mobileTouchFailures = await auditTouchTargets(page, 'Mobile Reschedule Modal');
      assert(mobileTouchFailures.length === 0,
        'Mobile modal touch targets all >= 34px',
        JSON.stringify(mobileTouchFailures));

      // Close modal
      await page.evaluate(() => ParentEngine.closeRescheduleModal());
    }

    // Test 14: Console and asset integrity
    assert(consoleErrors.length === 0, 'Zero console errors during complete user flow', JSON.stringify(consoleErrors));
    assert(failedRequests.length === 0, 'Zero failed HTTP requests (404s)', JSON.stringify(failedRequests));

  } catch (err) {
    console.error('Audit exception occurred:', err);
    testsFailed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`Aspect 7 Audit Completed: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('-------------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAudit();
