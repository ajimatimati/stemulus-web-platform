const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8094;
const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/66a470fd-ed7c-4b64-9669-b95d564bb83e/screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    let rawUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, '..', rawUrl === '/' ? 'index.html' : rawUrl);

    if (!filePath.startsWith(path.join(__dirname, '..'))) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + rawUrl);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[TEST-SERVER] Listening at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runTests() {
  const server = await startServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];
  function logResult(name, passed, detail) {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  }

  try {
    // 1. Log in via admin-login.html
    console.log('\n--- AUTHENTICATION: Admin Login ---');
    await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'domcontentloaded' });
    await page.fill('#emailInput', 'admin@stemuluskidstech.com');
    await page.fill('#passwordInput', 'Admin2026!');
    await page.click('#submitBtn');
    await page.waitForTimeout(1500);

    if (!page.url().includes('admin-dashboard.html')) {
      await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(1200);

    console.log('\n--- TEST SUITE 1: Autonomous Delete Tutor Engine ---');
    // Navigate to Tutors section
    await page.click('a[data-section="tutors"]');
    await page.waitForTimeout(800);

    // 1. Verify Tutors Table rendered with Delete Buttons
    const deleteButtonsCount = await page.locator('#tutors-table-body button:has-text("Delete")').count();
    logResult('Tutors Table Delete Buttons', deleteButtonsCount > 0, `Found ${deleteButtonsCount} Delete buttons in table`);

    // 2. Onboard a test tutor to verify clean deletion
    const testTutorEmail = 'temporary.test.tutor@stemuluskidstech.com';
    const onboardResult = await page.evaluate(async (email) => {
      if (typeof window.DashboardEngine === 'undefined') return { error: 'DashboardEngine not loaded' };
      const res = await window.DashboardEngine.addUser({
        name: 'Temp Test Tutor',
        email: email,
        phone: '+2348011223344',
        role: 'tutor',
        password: 'TempPassword123!'
      });
      window.AdminEngine.loadTutors();
      return { success: true, res };
    }, testTutorEmail);
    logResult('Temp Tutor Provisioned', onboardResult.success === true, `Created ${testTutorEmail}`);

    await page.waitForTimeout(500);
    const tutorExistsBefore = await page.locator(`tr:has-text("${testTutorEmail}")`).count();
    logResult('Temp Tutor Visible Before Delete', tutorExistsBefore > 0, `Found row with ${testTutorEmail}`);

    // Auto-accept confirmation prompts
    page.on('dialog', async dialog => {
      console.log(`[DIALOG] ${dialog.type()}: ${dialog.message()}`);
      await dialog.accept();
    });

    // 3. Trigger Delete Tutor via AdminEngine
    const deleteExecuted = await page.evaluate(async (email) => {
      if (typeof window.AdminEngine.deleteTutor !== 'function') return false;
      return window.AdminEngine.deleteTutor(email);
    }, testTutorEmail);
    logResult('deleteTutor Executed', deleteExecuted === true, `Deleted: ${testTutorEmail}`);

    await page.waitForTimeout(600);
    const tutorExistsAfter = await page.locator(`tr:has-text("${testTutorEmail}")`).count();
    logResult('Temp Tutor Removed from Table', tutorExistsAfter === 0, `Row removed immediately from UI`);

    // 4. Verify permanent blacklist in deletedTutorEmails
    const blacklistVerified = await page.evaluate((email) => {
      const db = window.DashboardEngine.getDB();
      const isBlacklisted = (db.deletedTutorEmails || []).includes(email);
      const isStillInTutors = (db.tutors || []).some(t => t.email && t.email.toLowerCase() === email);
      return { isBlacklisted, isStillInTutors };
    }, testTutorEmail);
    logResult('Blacklist Safeguard', blacklistVerified.isBlacklisted && !blacklistVerified.isStillInTutors,
      `deletedTutorEmails contains email: ${blacklistVerified.isBlacklisted}`);

    // 5. Reload page to verify tutor never resurrects via coreDefaults
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.click('a[data-section="tutors"]');
    await page.waitForTimeout(600);
    const tutorExistsAfterReload = await page.locator(`tr:has-text("${testTutorEmail}")`).count();
    logResult('Persistent Suppression Across Reload', tutorExistsAfterReload === 0,
      `Tutor remained permanently deleted after full page reload`);

    // 6. Verify Tutor Dossier modal has Delete Tutor button
    const dossierDeleteBtnExists = await page.locator('#tutor-dossier-modal button[onclick*="deleteTutorFromDossier"]').count();
    logResult('Dossier Modal Delete Button', dossierDeleteBtnExists > 0,
      `Found danger Delete Tutor button inside Dossier modal`);

    // Capture screenshot of Tutors table with Delete buttons
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_delete_tutor_verified.png') });
    console.log(`[SCREENSHOT] Saved: ${path.join(ARTIFACT_DIR, 'admin_delete_tutor_verified.png')}`);

    console.log('\n--- TEST SUITE 2: Strategic Class Reminders Engine ---');
    // Navigate to Schedules section
    await page.click('a[data-section="schedules"]');
    await page.waitForTimeout(800);

    // 1. Verify Class Reminders Hub exists in DOM and is visible
    const remindersHub = page.locator('#class-reminders-hub');
    const remindersHubVisible = await remindersHub.isVisible();
    logResult('Class Reminders Hub Card Visible', remindersHubVisible, 'Found #class-reminders-hub in DOM');

    const scanBtn = page.locator('#btn-scan-reminders');
    const testBtn = page.locator('#btn-test-reminder');
    logResult('Reminders Scan Button', await scanBtn.isVisible(), 'Found #btn-scan-reminders');
    logResult('Reminders Test Button', await testBtn.isVisible(), 'Found #btn-test-reminder');

    // 2. Test Reminder Scan execution
    const scanResult = await page.evaluate(async () => {
      if (typeof window.triggerRemindersScan !== 'function') return { error: 'triggerRemindersScan missing' };
      return await window.triggerRemindersScan();
    });
    logResult('triggerRemindersScan Execution', scanResult.success === true,
      `Evaluated ${scanResult.evaluated || 0} schedules cleanly without error`);

    // 3. Test Meeting Link Resolution
    const meetingLinkTest = await page.evaluate(() => {
      if (typeof window.StemulusClassReminders === 'undefined') return { error: 'StemulusClassReminders not loaded' };

      const testScheduleWithMeet = {
        id: 'sched-101',
        studentName: 'David Adeleke',
        meetLink: 'https://meet.google.com/xyz-test-abc'
      };
      const resolvedMeet = window.StemulusClassReminders.resolveMeetingLink(testScheduleWithMeet);

      const testScheduleWithZoom = {
        id: 'sched-102',
        studentName: 'Aisha Bello',
        zoomLink: 'https://zoom.us/j/9988776655'
      };
      const resolvedZoom = window.StemulusClassReminders.resolveMeetingLink(testScheduleWithZoom);

      const testFallback = {
        id: 'sched-103',
        studentName: 'Unassigned Coder'
      };
      const resolvedFallback = window.StemulusClassReminders.resolveMeetingLink(testFallback);

      return {
        resolvedMeet,
        resolvedZoom,
        resolvedFallback,
        meetsMatch: resolvedMeet === 'https://meet.google.com/xyz-test-abc',
        zoomMatch: resolvedZoom === 'https://zoom.us/j/9988776655',
        fallbackValid: resolvedFallback.includes('meet.google.com')
      };
    });
    logResult('Meeting Link Resolver',
      meetingLinkTest.meetsMatch && meetingLinkTest.zoomMatch && meetingLinkTest.fallbackValid,
      `Google Meet, Zoom, and smart fallback verified: ${meetingLinkTest.resolvedMeet}`);

    // 4. Test 10-Minute Urgent Classroom Modal Simulation
    const simulateResult = await page.evaluate(() => {
      return window.StemulusClassReminders.simulate('10m');
    });
    await page.waitForTimeout(600);

    const urgentModal = page.locator('[id^="urgent-class-modal"]');
    const urgentModalVisible = await urgentModal.isVisible();
    logResult('Urgent 10-Minute Modal Rendered', urgentModalVisible, 'Modal surfaced on screen');

    // Verify modal has live classroom button with direct meeting link
    const modalLaunchLink = await urgentModal.locator('a[href*="meet.google.com"], a[href*="zoom"]').getAttribute('href');
    logResult('1-Click Direct Meeting Link on Modal', !!modalLaunchLink, `Direct Link: ${modalLaunchLink}`);

    // Capture screenshot of the Urgent Classroom Modal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'class_reminder_modal_with_link.png') });
    console.log(`[SCREENSHOT] Saved: ${path.join(ARTIFACT_DIR, 'class_reminder_modal_with_link.png')}`);

    console.log('\n--- TEST SUITE 3: Mobile Viewport Responsiveness (375px) ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const isMobileOverflow = await page.evaluate(() => {
      const hub = document.getElementById('class-reminders-hub');
      if (!hub) return false;
      return hub.scrollWidth > window.innerWidth;
    });
    logResult('Mobile Reminders Hub Width (375px)', !isMobileOverflow,
      `No horizontal overflow on iPhone mini width (375px)`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reminders_hub_mobile_375px.png') });
    console.log(`[SCREENSHOT] Saved: ${path.join(ARTIFACT_DIR, 'reminders_hub_mobile_375px.png')}`);

  } catch (err) {
    console.error('[ERROR during tests]', err);
    logResult('Test Execution', false, err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=======================================');
  console.log('         TEST SUMMARY REPORT           ');
  console.log('=======================================');
  const allPassed = results.every(r => r.passed);
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name.padEnd(40)}: ${r.detail}`);
  });
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} (${results.filter(r=>r.passed).length}/${results.length})`);

  if (!allPassed) process.exit(1);
}

runTests();
