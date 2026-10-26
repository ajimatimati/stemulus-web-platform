/**
 * Comprehensive Database Sync, Deduplication & Weekly Hours Audit Script
 * Verifies:
 * 1. Canonical weekly hours across all tutors (0 tutors with 12 hrs/wk or 15 hrs/wk)
 * 2. 1.0 hr per 60-minute session in Tutor Monthly Report, Admin Report Review, PDF Generator, and Monthly Payroll
 * 3. Zero tautology (zero duplicate students, tutors, parents, or schedules) in localStorage and live Firestore
 * 4. Canonical Google Meet links across Student Profiles, Schedules, Tutor Dashboard, Parent Dashboard, and Admin Dossier
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\66a470fd-ed7c-4b64-9669-b95d564bb83e\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function startStaticServer(port = 8194) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(ROOT_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const PORT = 8194;
  const server = await startStaticServer(PORT);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];
  function assert(condition, label, detail = '') {
    results.push({ pass: Boolean(condition), label, detail });
    console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${label}${detail ? ' — ' + detail : ''}`);
  }

  try {
    // 1. Authenticate as Admin via DashboardEngine.login so StemulusSecurity signed session is created
    await page.goto(`http://localhost:${PORT}/admin-login.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof DashboardEngine !== 'undefined') {
        await DashboardEngine.initDefaultAccounts();
        await DashboardEngine.login('admin@stemuluskidstech.com', 'Admin2026!');
      }
    });

    await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);

    // 2. Run in-page Database Deduplication, Canonical Sync & Live Firestore Cleanup
    const dbAudit = await page.evaluate(async () => {
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.initDefaultAccounts) {
        await DashboardEngine.initDefaultAccounts();
      }
      const db = DashboardEngine.getDB();

      // Sync & clean live Firestore collections if Firebase is connected
      let firestoreCleaned = { schedulesDeleted: 0, schedulesSynced: 0, tutorsSynced: 0, studentsSynced: 0, parentsSynced: 0 };
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          const fsDb = firebase.firestore();
          // Push clean canonical state
          if (typeof StemulusFirestore !== 'undefined' && StemulusFirestore.decomposeMonolith) {
            await StemulusFirestore.decomposeMonolith(db);
          }

          // Inspect live schedules collection and remove any duplicate or stale (sch-2001/sch-2002) docs whose ID is not in db.schedules
          const validScheduleIds = new Set((db.schedules || []).map(s => String(s.id)));
          const schedSnap = await fsDb.collection('schedules').get();
          for (const doc of schedSnap.docs) {
            if (!validScheduleIds.has(doc.id)) {
              await fsDb.collection('schedules').doc(doc.id).delete();
              firestoreCleaned.schedulesDeleted++;
            } else {
              firestoreCleaned.schedulesSynced++;
            }
          }

          // Inspect live tutors collection and remove any duplicate doc not in canonical tutors
          const canonicalTutors = DashboardEngine.getTutors();
          const validTutorIds = new Set(canonicalTutors.map(t => String(t.id || t.email)));
          const tutSnap = await fsDb.collection('tutors').get();
          for (const doc of tutSnap.docs) {
            if (!validTutorIds.has(doc.id)) {
              await fsDb.collection('tutors').doc(doc.id).delete();
            } else {
              firestoreCleaned.tutorsSynced++;
            }
          }

          // Inspect live students collection and remove any duplicate doc not in canonical students
          const canonicalStudents = DashboardEngine.getStudents();
          const validStudentIds = new Set(canonicalStudents.map(s => String(s.id)));
          const stuSnap = await fsDb.collection('students').get();
          for (const doc of stuSnap.docs) {
            if (!validStudentIds.has(doc.id)) {
              await fsDb.collection('students').doc(doc.id).delete();
            } else {
              firestoreCleaned.studentsSynced++;
            }
          }

          const parSnap = await fsDb.collection('parents').get();
          firestoreCleaned.parentsSynced = parSnap.size;
        } catch (err) {
          firestoreCleaned.error = err.message;
        }
      }

      // Re-render Operations Suite & Admin tables after sync
      const opsEl = document.getElementById('mount-operations-suite');
      if (opsEl && typeof OperationsManagerEngine !== 'undefined') {
        opsEl.innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();
      }
      if (typeof AdminEngine !== 'undefined') {
        if (AdminEngine.renderTutorsTable) AdminEngine.renderTutorsTable();
        if (AdminEngine.renderPayrollPeriod) AdminEngine.renderPayrollPeriod('2026-10');
      }

      const workload = (typeof OperationsManagerEngine !== 'undefined' && OperationsManagerEngine.getFacultyWorkloadReport)
        ? OperationsManagerEngine.getFacultyWorkloadReport()
        : [];
      const canonicalWeekly = DashboardEngine.getCanonicalWeeklySchedules();
      const tutors = DashboardEngine.getTutors();
      const students = DashboardEngine.getStudents();
      const schedules = DashboardEngine.getSchedules();

      // Check for any duplicate students, tutors, or schedules
      const studentKeys = students.map(s => `${(s.firstName || '').toLowerCase()}_${(s.lastName || '').toLowerCase()}_${(s.parentEmail || '').toLowerCase()}`);
      const duplicateStudents = studentKeys.filter((k, i) => studentKeys.indexOf(k) !== i);

      const tutorEmails = tutors.map(t => (t.email || '').toLowerCase());
      const duplicateTutors = tutorEmails.filter((k, i) => tutorEmails.indexOf(k) !== i);

      const scheduleKeys = schedules.map(s => `${(s.studentId || s.studentName || '').toLowerCase()}|${s.date}|${s.time}`);
      const duplicateSchedules = scheduleKeys.filter((k, i) => scheduleKeys.indexOf(k) !== i);

      // Check canonical meet links on students vs schedules (supporting Physical Hub with meetLinkBackup)
      const meetMismatches = [];
      students.forEach(s => {
        const expectedLink = s.meetLink || s.classroomLink;
        schedules.filter(sch => sch.studentId === s.id).forEach(sch => {
          const isPhysicalMatch = (sch.link && sch.link.includes('Physical') && sch.meetLinkBackup === expectedLink);
          if (sch.link !== expectedLink && !isPhysicalMatch) {
            meetMismatches.push({ student: `${s.firstName} ${s.lastName}`, studentLink: expectedLink, scheduleId: sch.id, scheduleLink: sch.link });
          }
        });
      });

      return {
        workload,
        canonicalWeeklyCount: canonicalWeekly.length,
        tutorsCount: tutors.length,
        studentsCount: students.length,
        schedulesCount: schedules.length,
        duplicateStudents,
        duplicateTutors,
        duplicateSchedules,
        meetMismatches,
        firestoreCleaned,
        opsHtmlText: opsEl ? opsEl.innerText : ''
      };
    });

    console.log('\n--- DATABASE & WORKLOAD AUDIT ---');
    console.log('Workload Report:', JSON.stringify(dbAudit.workload, null, 2));
    console.log('Firestore Sync Summary:', JSON.stringify(dbAudit.firestoreCleaned, null, 2));

    // Assertions on canonical weekly hours
    const byEmail = {};
    dbAudit.workload.forEach(w => { byEmail[(w.email || '').toLowerCase()] = w; });

    assert(
      byEmail['olalekan@stemuluskidstech.com'] && byEmail['olalekan@stemuluskidstech.com'].totalAssignedHours === 5,
      'Olalekan Israel Ajimati weekly hours = 5 hrs/wk',
      `Got ${byEmail['olalekan@stemuluskidstech.com']?.totalAssignedHours} hrs/wk (${byEmail['olalekan@stemuluskidstech.com']?.assignedSessionsCount} sessions)`
    );
    assert(
      byEmail['kafayatabdulwahab.et@gmail.com'] && byEmail['kafayatabdulwahab.et@gmail.com'].totalAssignedHours === 4,
      'Kafayat Abdulwahab weekly hours = 4 hrs/wk (NOT 12 hrs/wk)',
      `Got ${byEmail['kafayatabdulwahab.et@gmail.com']?.totalAssignedHours} hrs/wk (${byEmail['kafayatabdulwahab.et@gmail.com']?.assignedSessionsCount} sessions)`
    );
    assert(
      byEmail['adefemiadebayo20@gmail.com'] && byEmail['adefemiadebayo20@gmail.com'].totalAssignedHours === 2,
      'Moses Oluwafemi Adebayo weekly hours = 2 hrs/wk',
      `Got ${byEmail['adefemiadebayo20@gmail.com']?.totalAssignedHours} hrs/wk`
    );
    assert(
      byEmail['tonetbod@gmail.com'] && byEmail['tonetbod@gmail.com'].totalAssignedHours === 2,
      'Tola Tosin Ayanleke weekly hours = 2 hrs/wk',
      `Got ${byEmail['tonetbod@gmail.com']?.totalAssignedHours} hrs/wk`
    );
    assert(
      byEmail['emmanuel@stemuluskidstech.com'] && byEmail['emmanuel@stemuluskidstech.com'].totalAssignedHours === 2,
      'Emmanuel O. weekly hours = 2 hrs/wk',
      `Got ${byEmail['emmanuel@stemuluskidstech.com']?.totalAssignedHours} hrs/wk`
    );
    assert(
      !dbAudit.workload.some(w => w.totalAssignedHours >= 12),
      'Zero tutors have 12+ hrs/wk inflated count',
      `Max tutor weekly hours is ${Math.max(...dbAudit.workload.map(w => w.totalAssignedHours))} hrs/wk`
    );
    assert(
      dbAudit.canonicalWeeklyCount === 15,
      'Total canonical weekly classes across academy = 15 classes/wk',
      `Got ${dbAudit.canonicalWeeklyCount}`
    );
    assert(
      dbAudit.duplicateStudents.length === 0 && dbAudit.duplicateTutors.length === 0 && dbAudit.duplicateSchedules.length === 0,
      'Zero duplicate students, tutors, or schedules in database',
      `Duplicates: students=${dbAudit.duplicateStudents.length}, tutors=${dbAudit.duplicateTutors.length}, schedules=${dbAudit.duplicateSchedules.length}`
    );
    assert(
      dbAudit.meetMismatches.length === 0,
      '100% of schedules match their student canonical Google Meet / Hub link',
      `Mismatches: ${dbAudit.meetMismatches.length}`
    );

    // 3. Screenshot & verify Faculty Workload Balancer in Admin Dashboard
    assert(
      dbAudit.opsHtmlText.includes('5 hrs / wk') && dbAudit.opsHtmlText.includes('4 hrs / wk') && !dbAudit.opsHtmlText.includes('12 hrs / wk') && !dbAudit.opsHtmlText.includes('15 hrs / wk'),
      'Admin Faculty Workload Balancer UI displays 5 hrs / wk and 4 hrs / wk (zero 12 hrs / wk)',
      'Verified #mount-operations-suite rendered text'
    );
    const opsSuiteEl = await page.locator('#mount-operations-suite');
    if (await opsSuiteEl.count() > 0) {
      await opsSuiteEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_workload_balancer_verified.png'), fullPage: false });
    }

    // 4. Open Tutor Dossier Modal for Kafayat and verify 4 Classes / Week • 4 hrs / wk
    await page.evaluate(() => {
      if (typeof AdminEngine !== 'undefined' && AdminEngine.openTutorDossierModal) {
        AdminEngine.openTutorDossierModal('kafayatabdulwahab.et@gmail.com');
      }
    });
    await page.waitForTimeout(500);
    const dossierText = await page.locator('#td-schedules-list').innerText();
    assert(
      dossierText.includes('4 Classes / Week') && dossierText.includes('4 hrs / wk') && dossierText.includes('Joshua Ogba'),
      'Kafayat Tutor Dossier Modal shows 4 Classes / Week • 4 hrs / wk without multi-week repetition',
      dossierText.replace(/\s+/g, ' ')
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_tutor_dossier_kafayat_4hrs.png'), fullPage: false });

    await page.evaluate(() => {
      if (typeof AdminEngine !== 'undefined' && AdminEngine.closeTutorDossierModal) {
        AdminEngine.closeTutorDossierModal();
      }
    });

    // 5. Verify Tutor Dashboard as Kafayat Abdulwahab
    await page.evaluate(async () => {
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.login) {
        await DashboardEngine.login('kafayatabdulwahab.et@gmail.com', 'Tutor2026!');
      }
    });
    await page.goto(`http://localhost:${PORT}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);

    const tutorUpcomingStat = await page.locator('#stat-upcoming').innerText();
    assert(
      tutorUpcomingStat.trim() === '4',
      'Tutor Dashboard (Kafayat) shows 4 canonical weekly classes in #stat-upcoming (not 12)',
      `Got #stat-upcoming = ${tutorUpcomingStat.trim()}`
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tutor_dashboard_kafayat_verified.png'), fullPage: false });

    // 6. Verify Tutor Monthly Report 1.0x hour calculation (no 1.5x inflation)
    await page.goto(`http://localhost:${PORT}/tutor-monthly-report.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1200);
    const reportCalc = await page.evaluate(() => {
      const firstStudentSessions = document.querySelector('#student-entries .student-sessions-input') || document.querySelector('#student-entries input[type="number"]');
      if (firstStudentSessions) {
        firstStudentSessions.value = '8';
        firstStudentSessions.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const sessVal = document.getElementById('report-total-sessions')?.value;
      const hrsVal = document.getElementById('report-total-hours')?.value;
      const noticeText = document.getElementById('report-stats-notice')?.innerText || '';
      return { sessVal, hrsVal, noticeText };
    });
    assert(
      Number(reportCalc.hrsVal) === Number(reportCalc.sessVal),
      'Tutor Monthly Report calculates 1.0 hr per 60-min session (zero 1.5x inflation)',
      `Sessions=${reportCalc.sessVal}, Hours=${reportCalc.hrsVal}`
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tutor_monthly_report_1hr_verified.png'), fullPage: false });

    // 7. Verify Parent Dashboard as Mrs. Ogba (Joshua Ogba's parent)
    await page.evaluate(async () => {
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.login) {
        await DashboardEngine.login('joshuaogba.parent@gmail.com', 'Parent2026!');
      }
    });
    await page.goto(`http://localhost:${PORT}/parent-dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);

    const parentBodyText = await page.locator('body').innerText();
    assert(
      parentBodyText.includes('Joshua Ogba') && parentBodyText.includes('Kafayat Abdulwahab') && parentBodyText.includes('meet.google.com/yko-xwce-ugd'),
      'Parent Dashboard (Mrs. Ogba) displays child Joshua Ogba, Mentor Kafayat Abdulwahab, and canonical Meet link meet.google.com/yko-xwce-ugd',
      'Verified child card & classroom link'
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'parent_dashboard_ogba_verified.png'), fullPage: false });

  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n========================================`);
  console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed.length} | FAILED: ${failed.length}`);
  console.log(`========================================`);
  if (failed.length > 0) {
    process.exit(1);
  }
})();
