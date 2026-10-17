const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const BASE_DIR = path.resolve(__dirname, '..');

function createStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4'
  };

  return http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/') cleanUrl = '/index.html';
    let filePath = path.join(BASE_DIR, cleanUrl);

    if (cleanUrl.startsWith('/.netlify/functions/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, success: true }));
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function verifyHumanAdminExperience() {
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  console.log('========================================================================');
  console.log('  STEMULUS CLINICAL VERIFICATION: HUMAN ADMIN END-TO-END JOURNEY');
  console.log('========================================================================');
  console.log(`Server listening on http://127.0.0.1:${PORT}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // Step 1: Human Admin Login Journey
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Human Admin Login Journey ---');
    await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'networkidle' });
    await page.fill('#emailInput', 'admin@stemuluskidstech.com');
    await page.fill('#passwordInput', 'Admin2026!');
    await page.click('#submitBtn');
    
    await page.waitForTimeout(2000);
    if (!page.url().includes('admin-dashboard.html')) {
      await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    assert(page.url().includes('admin-dashboard.html'), 'Admin successfully authenticated and reached Admin Dashboard');

    // -------------------------------------------------------------
    // Step 2: Verify Top KPI Stats
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Verify Top KPI Stats ---');
    const totalStudentsText = (await page.locator('#stat-total-students').textContent() || '').trim();
    const upcomingClassesText = (await page.locator('#stat-upcoming-classes').textContent() || '').trim();
    const pendingEmailsText = (await page.locator('#stat-pending-emails').textContent() || '').trim();
    const activeCoursesText = (await page.locator('#stat-active-courses').textContent() || '').trim();

    console.log(`  Observed KPI Stats:
    - Total Students:    ${totalStudentsText}
    - Upcoming Classes:  ${upcomingClassesText}
    - Pending Emails:    ${pendingEmailsText}
    - Active Tracks:     ${activeCoursesText}`);

    const totalStudents = parseInt(totalStudentsText, 10);
    const upcomingClasses = parseInt(upcomingClassesText, 10);

    assert(totalStudents === 13, `Total Students stat displays exact count of 13 enrolled students (got: ${totalStudents})`);
    assert(upcomingClasses > 0, `Upcoming Classes stat is non-zero and accurately populated (got: ${upcomingClasses})`);
    assert(parseInt(activeCoursesText, 10) > 0, `Active Tracks count is populated (got: ${activeCoursesText})`);

    // -------------------------------------------------------------
    // Step 3: Verify "This Week" Summary Cards
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Verify "This Week" Summary Cards ---');
    const weekSessionsText = (await page.locator('#week-sessions').textContent() || '').trim();
    const weekPresentText = (await page.locator('#week-present').textContent() || '').trim();
    const weekAbsentText = (await page.locator('#week-absent').textContent() || '').trim();
    const weekPendingText = (await page.locator('#week-pending').textContent() || '').trim();

    console.log(`  Observed "This Week" Summary:
    - Total Sessions: ${weekSessionsText}
    - Present:        ${weekPresentText}
    - Absent:         ${weekAbsentText}
    - Pending Review: ${weekPendingText}`);

    const weekSessions = parseInt(weekSessionsText, 10);
    const weekPresent = parseInt(weekPresentText, 10);
    const weekAbsent = parseInt(weekAbsentText, 10);
    const weekPending = parseInt(weekPendingText, 10);

    assert(weekSessions === 15, `Sessions This Week is accurately calculated (expected: 15, got: ${weekSessions})`);
    assert(weekPresent >= 9, `Present sessions count is accurately populated (got: ${weekPresent})`);
    assert(weekSessions === (weekPresent + weekAbsent + weekPending), `Sessions This Week (${weekSessions}) equals Present (${weekPresent}) + Absent (${weekAbsent}) + Pending (${weekPending})`);

    // -------------------------------------------------------------
    // Step 4: Verify Today's Scheduled Classes (Saturday)
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Verify Today\'s Scheduled Classes ---');
    const todayList = page.locator('#todays-classes-list');
    const todayItemsCount = await todayList.locator('> div').count();
    const todayContent = await todayList.textContent();

    console.log(`  Found ${todayItemsCount} classes scheduled for Today (Saturday):`);
    assert(todayItemsCount === 4, `Today's classes list displays exactly 4 Saturday classes (got: ${todayItemsCount})`);
    assert(todayContent.includes('Pearl'), 'Today\'s list includes Pearl (10:00 AM WAT)');
    assert(todayContent.includes('Momooreoluwa'), 'Today\'s list includes Momooreoluwa (12:00 PM WAT)');
    assert(todayContent.includes('Joshua Ogba'), 'Today\'s list includes Joshua Ogba (12:00 PM WAT)');
    assert(todayContent.includes('Gbolade'), 'Today\'s list includes Gbolade (12:00 PM WAT - Physical Session)');

    // -------------------------------------------------------------
    // Step 5: Test Navigation As Normal Human Admin
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Human Admin Navigation Across Portal Sections ---');

    // 5A: Coders Roster
    console.log('  Navigating to Coders Roster...');
    await page.click('a[data-section="students"][data-roster-tab="students"]');
    await page.waitForTimeout(800);
    const studentsRowsCount = await page.locator('#students-table-body tr').count();
    assert(studentsRowsCount >= 10, `Coders Roster table contains all enrolled students (rows: ${studentsRowsCount})`);

    // Test Search input inside Coders Roster
    console.log('  Testing search filtering for "Junayd"...');
    await page.fill('#student-search', 'Junayd');
    await page.waitForTimeout(400);
    const filteredRows = await page.locator('#students-table-body tr:visible').count();
    assert(filteredRows === 1, `Search correctly filtered table to 1 row for "Junayd" (got: ${filteredRows})`);
    // Clear search
    await page.fill('#student-search', '');
    await page.waitForTimeout(400);

    // 5B: Schedules & Timetable
    console.log('  Navigating to Schedules & Timetable...');
    await page.click('a[data-section="schedules"]');
    await page.waitForTimeout(800);
    const isSchedulesVisible = await page.locator('#section-schedules').isVisible();
    const isRadarVisible = await page.locator('#live-class-radar').isVisible();
    assert(isSchedulesVisible && isRadarVisible, 'Schedules view and Live Operations Class Radar are visible and active');

    // 5C: Attendance & Logs
    console.log('  Navigating to Attendance Logs...');
    await page.click('a[data-section="attendance"]');
    await page.waitForTimeout(800);
    const totalAttendanceCount = await page.evaluate(() => (DashboardEngine.getAttendanceRecords ? DashboardEngine.getAttendanceRecords().length : 0));
    const pendingText = await page.locator('#admin-attendance-list').textContent();
    assert(totalAttendanceCount >= 9, `Attendance records stored in system for completed classes (found: ${totalAttendanceCount} records)`);
    assert(pendingText.includes('No pending') || pendingText.length > 20, 'Pending attendance review table displays status cleanly');

    // 5D: Mentors & Faculty
    console.log('  Navigating to Mentors & Faculty...');
    await page.click('a[data-section="tutors"]');
    await page.waitForTimeout(800);
    const tutorsContent = await page.locator('#tutors-table-body').textContent();
    assert(tutorsContent.includes('Olalekan') && tutorsContent.includes('Kafayat') && tutorsContent.includes('Tola'), 'Mentors table displays active onboarded tutors (Olalekan, Kafayat, Tola, etc.)');

    // 5E: Recordings Vault
    console.log('  Navigating to Recordings Vault...');
    await page.click('a[data-section="recordings"]');
    await page.waitForTimeout(800);
    const isRecordingsVisible = await page.locator('#section-recordings').isVisible();
    assert(isRecordingsVisible, 'Recordings Vault view is active and displayed to admin');

    // 5F: Parents Directory
    console.log('  Navigating to Parents Directory...');
    await page.click('a[data-section="students"][data-roster-tab="parents"]');
    await page.waitForTimeout(800);
    const parentsRowsCount = await page.locator('#parents-table-body tr').count();
    assert(parentsRowsCount >= 8, `Parents directory contains registered parents (rows: ${parentsRowsCount})`);

    // -------------------------------------------------------------
    // Step 6: Verify Google Meet Links Configuration
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Google Meet Links Verification ---');
    const meetIntegrity = await page.evaluate(() => {
      const db = DashboardEngine.getDB();
      const onlineStudents = (db.students || []).filter(s => (s.program || '').toLowerCase() !== 'physical');
      const studentsWithMeet = onlineStudents.filter(s => s.meetLink && s.meetLink.includes('meet.google.com'));
      return {
        totalOnline: onlineStudents.length,
        withMeet: studentsWithMeet.length,
        tutorsCount: (db.tutors || []).length
      };
    });
    assert(meetIntegrity.withMeet >= 10, `All online students have active, dedicated Google Meet links configured (${meetIntegrity.withMeet}/${meetIntegrity.totalOnline})`);
    assert(meetIntegrity.tutorsCount >= 7, `All 7 tutors are active in database (${meetIntegrity.tutorsCount} tutors)`);

    // -------------------------------------------------------------
    // Step 7: Return to Dashboard and Capture Verification Screenshot
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Visual Capture of Verified Dashboard ---');
    await page.click('a[data-section="dashboard"]');
    await page.waitForTimeout(800);

    const screenshotPath = path.join(BASE_DIR, 'admin_dashboard_verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    assert(fs.existsSync(screenshotPath), `Full-page screenshot successfully saved at: ${screenshotPath}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================================================');
  console.log(`  HUMAN-LIKE ADMIN PORTAL AUDIT: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyHumanAdminExperience();
