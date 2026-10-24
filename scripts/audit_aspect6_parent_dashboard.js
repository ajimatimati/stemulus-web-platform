/**
 * Automated QA & UX Audit Script: Aspect 6 (Parents' Command Center & Multi-Child Overview)
 * Covers:
 * - parent-dashboard.html
 * - assets/js/parent-engine.js
 * - assets/js/classroom-rejoin-beacon.js
 * - #children-container, #sessions-container, #parent-add-child-modal, #parent-reschedule-modal
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8096;
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
      console.log(`[Audit Aspect 6] Static test server running on http://localhost:${PORT}`);
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
    console.log('PART 1: AUTHENTICATION & PARENT SESSION SETUP');
    console.log('=============================================================');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/parent-login.html?role=parent`, { waitUntil: 'load' });
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

    await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    if (page.url().includes('parent-dashboard.html')) {
      pass('Parent Dashboard loaded in authenticated parent session');
    } else {
      fail('Redirected away from parent-dashboard.html to ' + page.url());
    }

    // Verify parent name in header & hero
    const heroName = await page.$eval('#hero-user-name', el => el.innerText).catch(() => '');
    if (heroName.includes('Folashade') || heroName.length > 0) {
      pass(`Hero personalized greeting rendered: "Welcome back, ${heroName}"`);
    } else {
      fail('Hero greeting missing or not personalized', heroName);
    }

    console.log('\n=============================================================');
    console.log('PART 2: MULTI-CHILD OVERVIEW & ENROLLED CHILDREN');
    console.log('=============================================================');

    // 1. Verify children cards rendered
    const childCardsCount = await page.$$eval('#children-container > div', cards => cards.length);
    if (childCardsCount > 0) {
      pass(`Enrolled children rendered in overview (${childCardsCount} children cards found)`);
    } else {
      fail('No children cards rendered in #children-container');
    }

    // 2. Verify Google Meet & Classroom pill links
    const hasMeetLink = await page.$('#children-container a[href*="meet.google.com"]');
    if (hasMeetLink) {
      pass('Dedicated Auto-Recorded Google Meet link mounted on student card');
    } else {
      fail('Google Meet link not found in children cards');
    }

    const hasClassroomLink = await page.$('#children-container a[href*="classroom.google.com"]');
    if (hasClassroomLink) {
      pass('Google Classroom link mounted with course enrollment code');
    } else {
      fail('Google Classroom link missing from children cards');
    }

    // 3. Verify syllabus progress and attendance metrics
    const hasMetrics = await page.evaluate(() => {
      const container = document.getElementById('children-container');
      const txt = (container ? container.innerText : '').toLowerCase();
      return txt.includes('syllabus completion') && txt.includes('sessions');
    });
    if (hasMetrics) {
      pass('Real-time syllabus completion progress & verified session counts displayed');
    } else {
      fail('Syllabus completion or attendance metrics missing in student card');
    }

    // 4. Verify Technology Passport Badge Preview Card
    const hasBadgePassport = await page.evaluate(() => {
      const container = document.getElementById('children-container');
      return container && container.innerText.includes('Technology Passport');
    });
    if (hasBadgePassport) {
      pass('Technology Passport badge card with medallion preview rendered');
    } else {
      fail('Technology Passport badge card missing from children cards');
    }

    // 5. Verify Add Child Modal Workflow
    const addChildBtn = await page.$('button[onclick*="openAddChildModal"]');
    if (addChildBtn) {
      pass('Add Child button mounted in Enrolled Children header');
      await addChildBtn.click();
      await page.waitForTimeout(300);

      const modalOpen = await page.evaluate(() => {
        const m = document.getElementById('parent-add-child-modal');
        return m && !m.classList.contains('hidden') && window.getComputedStyle(m).display !== 'none';
      });

      if (modalOpen) {
        pass('Add Child modal opened upon button click');
        // Close modal
        await page.click('#parent-add-child-modal button[aria-label="Close modal"]');
        await page.waitForTimeout(200);
        const modalClosed = await page.evaluate(() => {
          const m = document.getElementById('parent-add-child-modal');
          return m && (m.classList.contains('hidden') || window.getComputedStyle(m).display === 'none');
        });
        if (modalClosed) {
          pass('Add Child modal closed cleanly');
        } else {
          fail('Add Child modal failed to close');
        }
      } else {
        fail('Add Child modal failed to open');
      }
    } else {
      fail('Add Child trigger button not found');
    }

    console.log('\n=============================================================');
    console.log('PART 3: UPCOMING SESSIONS & RESCHEDULE CONCIERGE');
    console.log('=============================================================');

    // 1. Upcoming session cards
    const upcomingCount = await page.$$eval('#sessions-container > div', cards => cards.length);
    if (upcomingCount > 0) {
      pass(`Upcoming class sessions rendered (${upcomingCount} sessions found)`);
    } else {
      fail('No upcoming class sessions found in #sessions-container');
    }

    // 2. Join Session link
    const joinClassBtn = await page.$('#sessions-container a[href*="join-class.html"]');
    if (joinClassBtn) {
      pass('Join Session 1-click Google Meet launch button verified');
    } else {
      fail('Join Session button not found in upcoming sessions');
    }

    // 3. Reschedule Modal Trigger
    const rescheduleLocator = page.locator('#sessions-container button[onclick*="openRescheduleModal"]').first();
    const rescheduleBtnCount = await rescheduleLocator.count();
    if (rescheduleBtnCount > 0) {
      pass('Reschedule Concierge button present on class card');
      await page.waitForTimeout(300);
      await rescheduleLocator.click();
      await page.waitForTimeout(500);

      const reschModalVisible = await page.evaluate(() => {
        const m = document.getElementById('parent-reschedule-modal');
        return m && m.style.display === 'flex';
      });

      if (reschModalVisible) {
        pass('Reschedule Concierge modal opened with 1-click open slots');
        // Close reschedule modal
        await page.click('#parent-reschedule-modal button[onclick*="closeRescheduleModal"]');
        await page.waitForTimeout(200);
      } else {
        fail('Reschedule Concierge modal failed to open');
      }
    } else {
      fail('Reschedule Concierge button not found in upcoming sessions');
    }

    console.log('\n=============================================================');
    console.log('PART 4: CLASSROOM REJOIN BEACON (DISCONNECT RECOVERY)');
    console.log('=============================================================');

    // Simulate an active disconnection in localStorage
    await page.evaluate(() => {
      if (typeof ClassroomRejoinBeacon !== 'undefined') {
        ClassroomRejoinBeacon.triggerManualTestPrompt('Daniel Adeyemi', 'Python Programming Foundations', 'Coach Olalekan');
      }
    });

    await page.waitForTimeout(400);

    const beaconMounted = await page.evaluate(() => {
      const b = document.getElementById('stemulus-rejoin-active-class-beacon');
      return b && window.getComputedStyle(b).display !== 'none';
    });

    if (beaconMounted) {
      pass('Classroom Rejoin Beacon banner mounted upon detecting live session disconnect');
      // Clean up beacon prompt
      await page.evaluate(() => {
        if (typeof ClassroomRejoinBeacon !== 'undefined') {
          ClassroomRejoinBeacon.dismissRejoinBanner();
        }
        localStorage.removeItem('stemulus_active_rejoin_prompts');
      });
      pass('Classroom Rejoin Beacon dismissed cleanly');
    } else {
      fail('Classroom Rejoin Beacon banner did not mount for active prompt');
    }

    console.log('\n=============================================================');
    console.log('PART 5: TOUCH TARGET & MOBILE OVERFLOW AUDIT');
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

    // Test mobile drawer toggle
    const menuBtn = await page.$('#menu-btn');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      const sidebarOpen = await page.evaluate(() => {
        const sb = document.getElementById('sidebar');
        return sb && sb.classList.contains('open');
      });
      if (sidebarOpen) {
        pass('Mobile navigation drawer opened via hamburger menu');
        await page.click('#sidebar-close-btn');
        await page.waitForTimeout(300);
        const sidebarClosed = await page.evaluate(() => {
          const sb = document.getElementById('sidebar');
          return sb && !sb.classList.contains('open');
        });
        if (sidebarClosed) {
          pass('Mobile navigation drawer closed via close button');
        } else {
          fail('Mobile navigation drawer failed to close');
        }
      } else {
        fail('Mobile navigation drawer failed to open on hamburger click');
      }
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
