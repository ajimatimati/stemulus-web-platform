/**
 * Automated QA & UX Audit Script: Aspect 5 (Tutors' Emergency Coverage & Faculty Chat Direct Line)
 * Covers:
 * - tutor-dashboard.html
 * - assets/js/faculty-chat-engine.js
 * - assets/js/reschedule-concierge-engine.js
 * - #tutor-coverage-modal & #mount-tutor-chat-drawer
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8095;
const ROOT_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/tutor-dashboard.html';
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
      console.log(`[Audit Aspect 5] Static test server running on http://localhost:${PORT}`);
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
      if (rect.bottom < 0 || rect.top > 20000) return;

      if (rect.width < 34 || rect.height < 34) {
        // Exclude inline text links inside paragraphs
        if (el.tagName === 'A' && el.closest('p, .text-xs, .field-hint') && !el.classList.contains('btn') && !el.classList.contains('pill')) {
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
          className: el.className || '',
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
    return { docWidth, maxScroll, hasOverflow };
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

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('favicon') && !txt.includes('firestore') && !txt.includes('Failed to load resource')) {
          consoleErrors.push(txt);
        }
      }
    });

    console.log('\n=============================================================');
    console.log('PART 1: AUTHENTICATION & TUTOR SESSION SETUP');
    console.log('=============================================================');

    await page.setViewportSize({ width: 1280, height: 800 });
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

    await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    if (page.url().includes('tutor-dashboard.html')) {
      pass('Tutor Dashboard loaded in authenticated tutor session');
    } else {
      fail('Redirected away from tutor-dashboard.html to ' + page.url());
    }

    console.log('\n=============================================================');
    console.log('PART 2: EMERGENCY COVERAGE CONCIERGE WORKFLOW');
    console.log('=============================================================');

    // 1. Verify upcoming schedule has active class session
    const scheduleCount = await page.$$eval('#schedule-list > div', cards => cards.length);
    if (scheduleCount > 0) {
      pass(`Upcoming class sessions rendered in schedule (${scheduleCount} cards found)`);
    } else {
      fail('No upcoming class sessions rendered in #schedule-list');
    }

    // 2. Verify coverage trigger button is present
    const coverageBtn = await page.$('button[onclick*="openCoverageModal"]');
    if (coverageBtn) {
      pass('Emergency Coverage button mounted on class session card');
      
      // Click coverage button
      await page.locator('button[onclick*="openCoverageModal"]').first().click();
      await page.waitForTimeout(400);

      const modalVisible = await page.evaluate(() => {
        const m = document.getElementById('tutor-coverage-modal');
        return m && m.style.display === 'flex';
      });

      if (modalVisible) {
        pass('Emergency Coverage modal opened upon button click');
      } else {
        fail('Emergency Coverage modal failed to open');
      }

      // Check candidate substitutes container
      const subContainerText = await page.$eval('#cov-suggested-substitutes', el => el.innerText).catch(() => '');
      if (subContainerText.includes('Coach') || subContainerText.includes('Substitutes') || subContainerText.includes('Concierge')) {
        pass(`Vetted peer substitutes rendered: "${subContainerText.substring(0, 45).replace(/\n/g, ' ')}..."`);
      } else {
        fail('Suggested peer substitutes container empty or missing text', subContainerText);
      }

      // Verify reason dropdown has essential leave options
      const reasons = await page.$$eval('#cov-reason option', opts => opts.map(o => o.value));
      const hasIllness = reasons.some(r => r.includes('Illness') || r.includes('Medical'));
      const hasPower = reasons.some(r => r.includes('Power') || r.includes('Internet'));
      if (hasIllness && hasPower) {
        pass(`Reason dropdown contains vetted emergency options (${reasons.length} choices)`);
      } else {
        fail('Reason dropdown missing required emergency categories', reasons);
      }

      // Test Submitting Coverage Request
      await page.fill('#cov-notes', 'Emergency coverage handover: coder completed loops challenge, please review functions.');
      const submitCoverageBtn = await page.$('#tutor-coverage-form button[type="submit"]');
      if (submitCoverageBtn) {
        await submitCoverageBtn.click();
        await page.waitForTimeout(800);

        // Check if modal closed and toast appeared
        const modalClosed = await page.evaluate(() => {
          const m = document.getElementById('tutor-coverage-modal');
          return !m || m.style.display === 'none';
        });
        if (modalClosed) {
          pass('Coverage request submitted successfully and modal closed cleanly');
        } else {
          fail('Coverage modal did not close after form submission');
        }

        // Verify request stored in DashboardEngine
        const coverageSaved = await page.evaluate(() => {
          if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getCoverageRequests) {
            const reqs = DashboardEngine.getCoverageRequests();
            return reqs.length > 0;
          }
          return false;
        });
        if (coverageSaved) {
          pass('Coverage request verified and logged in DashboardEngine coverage ledger');
        } else {
          fail('Coverage request was not saved in DashboardEngine');
        }
      }
    } else {
      fail('Coverage trigger button not found in upcoming schedule list');
    }

    console.log('\n=============================================================');
    console.log('PART 3: FACULTY CHAT DIRECT LINE (TUTOR <-> ADMIN)');
    console.log('=============================================================');

    // 1. Verify Floating Chat Bubble
    const chatBubble = await page.$('#stemulus-floating-chat-bubble');
    if (chatBubble) {
      pass('Floating 3D Chat Bubble mounted in DOM');

      // Click to toggle drawer
      const bubbleBtn = await page.$('#stemulus-floating-chat-bubble button');
      await bubbleBtn.click();
      await page.waitForTimeout(300);

      const drawerVisible = await page.evaluate(() => {
        const d = document.getElementById('stemulus-floating-chat-drawer');
        return d && !d.classList.contains('hidden') && (d.classList.contains('flex') || window.getComputedStyle(d).display !== 'none');
      });

      if (drawerVisible) {
        pass('Clicking floating chat bubble opened Admin Direct Line drawer');
      } else {
        fail('Floating chat drawer did not open on bubble click');
      }

      // Check stream rendered messages
      const msgCount = await page.$$eval('#chat-drawer-stream > div', msgs => msgs.length);
      if (msgCount > 0) {
        pass(`Chat stream rendered active conversation history (${msgCount} messages)`);
      } else {
        fail('Chat stream is empty');
      }

      // Send a test message from Tutor to Admin
      const testMsg = `Hello Admin! All sessions for today are confirmed. Test ping ${Date.now()}`;
      await page.fill('#chat-drawer-input', testMsg);
      await page.click('#stemulus-floating-chat-drawer button[type="submit"]');
      await page.waitForTimeout(400);

      // Verify message appears in stream
      const streamText = await page.$eval('#chat-drawer-stream', el => el.innerText);
      if (streamText.includes(testMsg)) {
        pass('Outgoing message rendered in Tutor Direct Line stream with instant timestamp');
      } else {
        fail('Submitted message not found in chat drawer stream');
      }

      // Close drawer
      const closeDrawerBtn = await page.$('#stemulus-floating-chat-drawer button:has-text("✕")');
      if (closeDrawerBtn) {
        await closeDrawerBtn.click();
        await page.waitForTimeout(200);
        const drawerHidden = await page.evaluate(() => {
          const d = document.getElementById('stemulus-floating-chat-drawer');
          return d && d.classList.contains('hidden');
        });
        if (drawerHidden) {
          pass('Chat drawer closes cleanly upon clicking close button');
        } else {
          fail('Chat drawer failed to close');
        }
      }
    } else {
      fail('Floating chat bubble #stemulus-floating-chat-bubble not found');
    }

    console.log('\n=============================================================');
    console.log('PART 4: TOUCH TARGET & MOBILE OVERFLOW AUDIT');
    console.log('=============================================================');

    // Desktop Touch Targets
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopTouchFailures = await auditTouchTargets(page, 'Desktop');
    if (desktopTouchFailures.length === 0) {
      pass('Desktop Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Desktop Touch Targets: ${desktopTouchFailures.length} undersized elements`, desktopTouchFailures);
    }

    // Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileOverflow = await auditOverflow(page);
    if (!mobileOverflow.hasOverflow) {
      pass(`Mobile Layout: Zero horizontal overflow on 375px viewport (maxScroll: ${mobileOverflow.maxScroll}px)`);
    } else {
      fail(`Mobile Layout: Horizontal overflow detected (${mobileOverflow.maxScroll}px > ${mobileOverflow.docWidth}px)`);
    }

    const mobileTouchFailures = await auditTouchTargets(page, 'Mobile');
    if (mobileTouchFailures.length === 0) {
      pass('Mobile Touch Targets: 100% compliant (>= 34px)');
    } else {
      fail(`Mobile Touch Targets: ${mobileTouchFailures.length} undersized elements`, mobileTouchFailures);
    }

    // Check console errors
    if (consoleErrors.length === 0) {
      pass('Zero critical JavaScript console errors during audit');
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
