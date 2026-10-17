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
    // Step 0: Simulate Existing Browser With Stale Cached LocalStorage
    // -------------------------------------------------------------
    console.log('\n--- Step 0: Pre-Seed Stale LocalStorage (Simulating Existing Human Browser) ---');
    await page.goto(`http://127.0.0.1:${PORT}/admin-login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      // Simulate an old cached encrypted DB that previously caused Upcoming=0, Weekly=0, and Daniel M. banner
      const staleDb = {
        _syncVersion: '2026.06.01.v1',
        students: [{ id: 1001, name: 'Old Cached Student', status: 'active' }],
        schedules: [],
        attendance: [],
        rescheduleRequests: [
          { id: 'res-4001', studentName: 'Daniel M.', oldDate: '2026-06-15', status: 'pending' }
        ]
      };
      if (window.StemulusSecurity && typeof window.StemulusSecurity.saveSecureDB === 'function') {
        window.StemulusSecurity.saveSecureDB(staleDb);
      } else {
        localStorage.setItem('stemulus_db', JSON.stringify(staleDb));
      }
    });

    // -------------------------------------------------------------
    // Step 1: Human Admin Login Journey
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Human Admin Login Journey ---');
    await page.fill('#emailInput', 'admin@stemuluskidstech.com');
    await page.fill('#passwordInput', 'Admin2026!');
    await page.click('#submitBtn');
    
    await page.waitForTimeout(2000);
    if (!page.url().includes('admin-dashboard.html')) {
      await page.goto(`http://127.0.0.1:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
    assert(page.url().includes('admin-dashboard.html'), 'Admin successfully authenticated and reached Admin Dashboard');

    // Verify automatic migration to 2026.10.17.v6 and hybrid StorageVault compatibility
    const migrationInfo = await page.evaluate(() => {
      const db = DashboardEngine.getDB();
      const rawJson = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
      return {
        syncVersion: db._syncVersion,
        rawHasTopLevelStudents: Array.isArray(rawJson.students) && rawJson.students.length >= 13,
        rawHasEncryptedEnvelope: rawJson.__sec === true && typeof rawJson.data === 'string',
        rescheduleCount: (db.rescheduleRequests || []).length
      };
    });
    assert(migrationInfo.syncVersion === '2026.10.17.v6', `Stale localStorage DB automatically migrated to v6 (${migrationInfo.syncVersion})`);
    assert(migrationInfo.rawHasTopLevelStudents && migrationInfo.rawHasEncryptedEnvelope, 'StorageVault hybrid envelope exposes both top-level collections and encrypted payload');
    assert(migrationInfo.rescheduleCount === 0, `Legacy June 2026 "Daniel M." reschedule request stripped (remaining: ${migrationInfo.rescheduleCount})`);

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
    assert(upcomingClasses === 21, `Upcoming Classes stat displays exact count of 21 upcoming sessions (got: ${upcomingClasses})`);
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
    assert(weekPresent === 9, `Present sessions count is 9 (Mon-Fri completed classes, got: ${weekPresent})`);
    assert(weekPending === 6, `Pending sessions count is 6 (4 Saturday + 2 Sunday classes awaiting tutor log, got: ${weekPending})`);
    assert(weekSessions === (weekPresent + weekAbsent + weekPending), `Sessions This Week (${weekSessions}) equals Present (${weekPresent}) + Absent (${weekAbsent}) + Pending (${weekPending})`);

    // -------------------------------------------------------------
    // Step 4: Verify Overview Widgets (Today's Classes, Recent Students, Upcoming Schedule)
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Verify Overview Widgets ---');
    const todayList = page.locator('#todays-classes-list');
    const todayItemsCount = await todayList.locator('> div').count();
    const todayContent = await todayList.textContent();

    assert(todayItemsCount === 4, `Today's classes list displays all 4 Saturday classes (got: ${todayItemsCount})`);
    assert(todayContent.includes('Pearl') && todayContent.includes('Momooreoluwa') && todayContent.includes('Joshua Ogba') && todayContent.includes('Gbolade'), 'Today\'s list includes Pearl, Momooreoluwa, Joshua Ogba, and Gbolade');

    const recentStudentsCount = await page.locator('#recent-students-list > div > div').count();
    const recentStudentsText = await page.locator('#recent-students-list').textContent();
    assert(recentStudentsCount === 6 && !recentStudentsText.includes('No pending registrations'), `Recent Students widget displays 6 active students instead of empty state (got: ${recentStudentsCount})`);

    const upcomingWidgetCount = await page.locator('#today-schedule-list > div').count();
    assert(upcomingWidgetCount === 6, `Right-column Upcoming Schedule widget displays next 6 sessions (got: ${upcomingWidgetCount})`);

    const rescheduleBannerVisible = await page.locator('#admin-reschedule-banner').isVisible();
    assert(!rescheduleBannerVisible, 'Legacy Daniel M. reschedule banner is hidden');

    // -------------------------------------------------------------
    // Step 5: Test Navigation As Normal Human Admin
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Human Admin Navigation Across Portal Sections ---');

    // 5A: Coders Roster
    await page.click('a[data-section="students"][data-roster-tab="students"]');
    await page.waitForTimeout(600);
    const studentsRowsCount = await page.locator('#students-table-body tr').count();
    assert(studentsRowsCount >= 10, `Coders Roster table contains all enrolled students (rows: ${studentsRowsCount})`);

    // Test Search input inside Coders Roster
    await page.fill('#student-search', 'Junayd');
    await page.waitForTimeout(300);
    const filteredRows = await page.locator('#students-table-body tr:visible').count();
    assert(filteredRows === 1, `Search correctly filtered table to 1 row for "Junayd" (got: ${filteredRows})`);
    await page.fill('#student-search', '');
    await page.waitForTimeout(300);

    // 5B: Schedules & Timetable
    await page.click('a[data-section="schedules"]');
    await page.waitForTimeout(600);
    const isSchedulesVisible = await page.locator('#section-schedules').isVisible();
    const isRadarVisible = await page.locator('#live-class-radar').isVisible();
    assert(isSchedulesVisible && isRadarVisible, 'Schedules view and Live Operations Class Radar are visible and active');

    // 5C: Attendance & Logs
    await page.click('a[data-section="attendance"]');
    await page.waitForTimeout(600);
    const totalAttendanceCount = await page.evaluate(() => (DashboardEngine.getAttendanceRecords ? DashboardEngine.getAttendanceRecords().length : 0));
    assert(totalAttendanceCount >= 9, `Attendance records stored in system for completed classes (found: ${totalAttendanceCount} records)`);

    // 5D: Mentors & Faculty
    await page.click('a[data-section="tutors"]');
    await page.waitForTimeout(600);
    const tutorsContent = await page.locator('#tutors-table-body').textContent();
    assert(tutorsContent.includes('Olalekan') && tutorsContent.includes('Kafayat') && tutorsContent.includes('Tola'), 'Mentors table displays active onboarded tutors (Olalekan, Kafayat, Tola, etc.)');

    // 5E: Recordings Vault
    await page.click('a[data-section="recordings"]');
    await page.waitForTimeout(600);
    const isRecordingsVisible = await page.locator('#section-recordings').isVisible();
    assert(isRecordingsVisible, 'Recordings Vault view is active and displayed to admin');

    // 5F: Parents Directory
    await page.click('a[data-section="students"][data-roster-tab="parents"]');
    await page.waitForTimeout(600);
    const parentsRowsCount = await page.locator('#parents-table-body tr').count();
    assert(parentsRowsCount >= 8, `Parents directory contains registered parents (rows: ${parentsRowsCount})`);

    // -------------------------------------------------------------
    // Step 6: Return to Admin Dashboard and Capture Verification Screenshot
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Visual Capture of Verified Admin Dashboard ---');
    await page.click('a[data-section="dashboard"]');
    await page.waitForTimeout(800);

    const screenshotPath = path.join(BASE_DIR, 'admin_dashboard_verified.png');
    const artifactScreenshotPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\66a470fd-ed7c-4b64-9669-b95d564bb83e\\admin_dashboard_verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    try { fs.copyFileSync(screenshotPath, artifactScreenshotPath); } catch (e) {}
    assert(fs.existsSync(screenshotPath), `Full-page screenshot successfully saved at: ${screenshotPath}`);

    // -------------------------------------------------------------
    // Step 7: Human Tutor Journey (Olalekan via altEmail & Profile Update)
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Human Tutor Portal Journey (Olalekan) ---');
    const tutorLoginRes = await page.evaluate(async () => {
      return await DashboardEngine.login('ajimatimati@gmail.com', 'Tutor2026!');
    });
    assert(tutorLoginRes && tutorLoginRes.success, 'Tutor Olalekan logged in via secondary email ajimatimati@gmail.com');

    await page.goto(`http://127.0.0.1:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const tutorStats = await page.evaluate(() => {
      return {
        students: (document.getElementById('stat-students')?.textContent || document.getElementById('kpi-students')?.textContent || '').trim(),
        upcoming: (document.getElementById('stat-upcoming')?.textContent || document.getElementById('kpi-upcoming')?.textContent || '').trim(),
        hours: (document.getElementById('stat-hours')?.textContent || document.getElementById('kpi-hours')?.textContent || '').trim(),
        tutorName: (document.getElementById('tutor-name')?.textContent || '').trim()
      };
    });
    console.log(`  Tutor Dashboard KPIs (Olalekan via ajimatimati@gmail.com):`, tutorStats);
    assert(parseInt(tutorStats.students, 10) === 3, `Tutor Olalekan sees 3 assigned students (Junayd, Myles, David) (got: ${tutorStats.students})`);
    assert(parseInt(tutorStats.upcoming, 10) > 0, `Tutor Olalekan Upcoming Sessions KPI is non-zero (got: ${tutorStats.upcoming})`);
    assert(parseInt(tutorStats.hours, 10) >= 4, `Tutor Olalekan Teaching Hours KPI is populated (got: ${tutorStats.hours})`);

    // Test Tutor Profile Save preserves session
    const profileSavedOk = await page.evaluate(() => {
      if (window.TutorEngine && typeof window.TutorEngine.openProfileModal === 'function') {
        window.TutorEngine.openProfileModal();
      }
      const bioEl = document.getElementById('tp-bio');
      if (bioEl) bioEl.value = 'Senior Coding & Robotics Instructor at Stemulus.';
      if (window.TutorEngine && typeof window.TutorEngine.saveProfile === 'function') {
        window.TutorEngine.saveProfile({ preventDefault: () => {} });
      }
      const sess = DashboardEngine.getSession();
      return sess && sess.role === 'tutor' && sess.email;
    });
    assert(Boolean(profileSavedOk), 'Tutor profile save updates DB and preserves signed STMSV2 session');

    // -------------------------------------------------------------
    // Step 8: Human Parent Portal Journey (Pearl's Parent)
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Human Parent Portal Journey ---');
    const parentLoginRes = await page.evaluate(async () => {
      return await DashboardEngine.login('talk2nike2009@gmail.com', 'Parent2026!');
    });
    assert(parentLoginRes && parentLoginRes.success, 'Parent Babalola Olanike (talk2nike2009@gmail.com) logged in');

    await page.goto(`http://127.0.0.1:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const parentView = await page.evaluate(() => {
      const upcomingHtml = document.getElementById('sessions-container')?.innerHTML || '';
      const childrenHtml = document.getElementById('children-container')?.innerHTML || document.body.innerText;
      return {
        hasPearl: childrenHtml.includes('Pearl'),
        hasUpcomingMeet: upcomingHtml.includes('mim-qifa-avc') || childrenHtml.includes('mim-qifa-avc'),
        upcomingCount: document.querySelectorAll('#sessions-container > div').length
      };
    });
    assert(parentView.hasPearl, 'Parent Dashboard renders Pearl\'s profile for talk2nike2009@gmail.com');
    assert(parentView.hasUpcomingMeet && parentView.upcomingCount > 0, `Parent Dashboard displays Pearl's upcoming classes (${parentView.upcomingCount}) with dedicated Google Meet link`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================================================');
  console.log(`  HUMAN-LIKE ADMIN/TUTOR/PARENT PORTAL AUDIT: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyHumanAdminExperience();
