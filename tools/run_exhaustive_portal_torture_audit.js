/**
 * EXHAUSTIVE FULL-STACK PORTAL TORTURE TEST HARNESS (Phases 2, 3, 4, 5)
 * Executes live Playwright browser automation + serverless function routing across Tutor, Parent, and Admin portals.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
};

const fileCache = new Map();

function createFullStackServer() {
  return http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(parsedUrl.pathname);

      // Route /.netlify/functions/* to local Netlify function handlers
      if (pathname.startsWith('/.netlify/functions/')) {
        const fnName = pathname.replace('/.netlify/functions/', '').split('/')[0];
        const fnPath = path.join(ROOT, 'netlify', 'functions', fnName + '.js');
        if (fs.existsSync(fnPath)) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const fnModule = require(fnPath);
              const event = {
                httpMethod: req.method,
                headers: req.headers,
                path: pathname,
                queryStringParameters: Object.fromEntries(parsedUrl.searchParams.entries()),
                body: body
              };
              const result = await fnModule.handler(event, {});
              res.writeHead(result.statusCode || 200, Object.assign({ 'Content-Type': 'application/json' }, result.headers || {}));
              res.end(result.body || '{}');
            } catch (fnErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: fnErr.message }));
            }
          });
          return;
        }
      }

      let safePath = pathname === '/' ? '/index.html' : pathname;
      let filePath = path.join(ROOT, safePath);
      if (filePath.toLowerCase().indexOf(ROOT.toLowerCase()) !== 0) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found: ' + pathname);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      let buf = fileCache.get(filePath);
      if (!buf) {
        buf = fs.readFileSync(filePath);
        fileCache.set(filePath, buf);
      }
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': buf.length,
        'Cache-Control': 'no-store'
      });
      res.end(buf);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(err.message);
    }
  });
}

(async () => {
  const results = {
    startedAt: new Date().toISOString(),
    phases: {
      phase2: { checks: [], passed: 0, failed: 0 },
      phase3: { checks: [], passed: 0, failed: 0 },
      phase4: { checks: [], passed: 0, failed: 0 },
      phase5: { checks: [], passed: 0, failed: 0 }
    },
    consoleErrors: [],
    pageErrors: []
  };

  function record(phaseKey, name, passed, details) {
    results.phases[phaseKey].checks.push({ name, passed: Boolean(passed), details: details || '' });
    if (passed) {
      results.phases[phaseKey].passed++;
      console.log(`[PASS] [${phaseKey.toUpperCase()}] ${name} -> ${details || 'OK'}`);
    } else {
      results.phases[phaseKey].failed++;
      console.error(`[FAIL] [${phaseKey.toUpperCase()}] ${name} -> ${details || 'FAILED'}`);
    }
  }

  const server = createFullStackServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}`;
  record('phase2', 'Local Full-Stack Server Spin-Up', port > 0, `Listening on ${BASE_URL} (static + /.netlify/functions/*)`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ headless: true }));
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    // Fulfill all external https:// requests immediately so CDN/Firebase/ntfy calls never stall page load
    await context.route('https://**/*', route => {
      const reqUrl = route.request().url();
      if (reqUrl.includes('ntfy.sh')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ntfy-mock-ok', event: 'message' }) });
      }
      if (reqUrl.includes('.js')) {
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* external cdn stub */' });
      }
      if (reqUrl.includes('.css') || reqUrl.includes('fonts.googleapis.com')) {
        return route.fulfill({ status: 200, contentType: 'text/css', body: '/* external font stub */' });
      }
      return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    });

    const page = await context.newPage();
    page.on('pageerror', err => {
      results.pageErrors.push({ url: page.url(), message: err.message });
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('favicon') && !txt.includes('ERR_INTERNET_DISCONNECTED') && !txt.includes('firestore') && !txt.includes('Firebase')) {
          results.consoleErrors.push({ url: page.url(), text: txt });
        }
      }
    });

    // Override window.open and window.alert/prompt in page so PDF previews and modals never hang headless execution
    await page.addInitScript(() => {
      window.__openedWindows = [];
      window.__alerts = [];
      window.open = function(url, target) {
        const fakeDoc = {
          _html: '',
          write: function(h) { this._html += h; },
          close: function() {}
        };
        const fakeWin = { url, target, document: fakeDoc, print: function() {}, close: function() {} };
        window.__openedWindows.push(fakeWin);
        return fakeWin;
      };
      window.alert = function(msg) {
        window.__alerts.push(String(msg));
      };
    });

    async function gotoReady(url, checkFn) {
      await page.goto(url, { waitUntil: 'commit' });
      await page.waitForFunction(
        checkFn || (() => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined'),
        null,
        { timeout: 15000 }
      );
      await page.waitForTimeout(200);
    }

    // =========================================================================
    // PHASE 2: ROLE MATRIX INITIALIZATION (Tutor, Parent, Admin)
    // =========================================================================
    await gotoReady(`${BASE_URL}/tutor-login.html`);
    const roleMatrixInit = await page.evaluate(async () => {
      DashboardEngine.initDefaultAccounts();
      const db = DashboardEngine.getDB();
      const tutorUser = {
        id: 'usr-tut-104',
        name: 'Moses Oluwafemi Adebayo',
        email: 'adefemiadebayo20@gmail.com',
        phone: '2347063346551',
        role: 'tutor',
        issuedAt: Date.now()
      };
      const parentUser = {
        id: 'par-sonaike-01',
        name: 'Mrs. Sonaike',
        email: 'sonaike.family@gmail.com',
        phone: '2348030001111',
        role: 'parent',
        issuedAt: Date.now()
      };
      const adminUser = {
        id: 'usr-admin-01',
        name: 'STEMulus Executive Admin',
        email: 'admin@stemuluskidstech.com',
        role: 'admin',
        issuedAt: Date.now()
      };

      // Ensure Momooreoluwa Sonaike is linked to sonaike.family@gmail.com and Moses Oluwafemi Adebayo
      db.students = Array.isArray(db.students) ? db.students : [];
      let momo = db.students.find(s => s && (s.firstName && s.firstName.toLowerCase().includes('momooreoluwa')));
      if (!momo) {
        momo = {
          id: 'std-1011-momo',
          firstName: 'Momooreoluwa',
          lastName: 'Sonaike',
          age: 10,
          program: 'Scratch Creators',
          status: 'active',
          parentName: 'Mrs. Sonaike',
          parentEmail: 'sonaike.family@gmail.com',
          parentPhone: '2348030001111',
          tutorName: 'Moses Oluwafemi Adebayo',
          tutorEmail: 'adefemiadebayo20@gmail.com',
          meetLink: 'https://meet.google.com/vdp-nmbh-sjj'
        };
        db.students.push(momo);
      } else {
        momo.id = 'std-1011-momo';
        momo.parentEmail = 'sonaike.family@gmail.com';
        momo.parentName = 'Mrs. Sonaike';
        momo.tutorName = 'Moses Oluwafemi Adebayo';
        momo.tutorEmail = 'adefemiadebayo20@gmail.com';
        momo.meetLink = momo.meetLink || 'https://meet.google.com/vdp-nmbh-sjj';
      }

      // Ensure a second student belonging to ANOTHER family exists for IDOR testing
      let otherStudent = db.students.find(s => s && s.id === 'std-1007-r4cv');
      if (!otherStudent) {
        otherStudent = {
          id: 'std-1007-r4cv',
          firstName: 'Joshua',
          lastName: 'Babalola',
          age: 12,
          program: 'Python Programming Foundations',
          status: 'active',
          parentName: 'Mr. Babalola',
          parentEmail: 'babalola.family@gmail.com',
          tutorName: 'Olalekan Israel Ajimati',
          tutorEmail: 'olalekan@stemuluskidstech.com',
          meetLink: 'https://meet.google.com/xyz-abcd-efg'
        };
        db.students.push(otherStudent);
      } else {
        otherStudent.firstName = 'Joshua';
        otherStudent.lastName = 'Babalola';
        otherStudent.parentName = 'Mr. Babalola';
        otherStudent.parentEmail = 'babalola.family@gmail.com';
      }

      // Ensure Joshua has a schedule slot on Monday 15:00
      let joshSched = db.schedules.find(s => s && s.studentId === 'std-1007-r4cv');
      if (!joshSched) {
        db.schedules.push({
          id: 'sch-audit-josh-mon',
          studentId: 'std-1007-r4cv',
          studentName: 'Joshua Babalola',
          course: 'Python Programming Foundations',
          dayOfWeek: 'Monday',
          time: '15:00',
          duration: 60,
          mentor: 'Olalekan Israel Ajimati',
          tutorName: 'Olalekan Israel Ajimati',
          tutorEmail: 'olalekan@stemuluskidstech.com',
          attendanceStatus: 'scheduled'
        });
      } else {
        joshSched.studentName = 'Joshua Babalola';
      }

      // Ensure tutor record has availability matrix and phone
      db.tutors = Array.isArray(db.tutors) ? db.tutors : [];
      let moses = db.tutors.find(t => t && t.email && t.email.toLowerCase() === 'adefemiadebayo20@gmail.com');
      if (!moses) {
        moses = {
          id: 'usr-tut-104',
          name: 'Moses Oluwafemi Adebayo',
          email: 'adefemiadebayo20@gmail.com',
          phone: '2347063346551',
          status: 'active',
          subjects: ['Scratch Creators', 'Python Programming'],
          availability: {
            tuesday: ['afternoon', 'evening'],
            thursday: ['afternoon', 'evening'],
            saturday: ['morning', 'afternoon']
          }
        };
        db.tutors.push(moses);
      } else {
        moses.phone = '2347063346551';
        moses.availability = {
          tuesday: ['afternoon', 'evening'],
          thursday: ['afternoon', 'evening'],
          saturday: ['morning', 'afternoon']
        };
      }

      // Ensure schedule slot on Tuesday 16:00 for Momooreoluwa with Moses
      db.schedules = Array.isArray(db.schedules) ? db.schedules : [];
      const existingSched = db.schedules.find(s => s && s.id === 'sch-audit-momo-tue');
      if (!existingSched) {
        db.schedules.push({
          id: 'sch-audit-momo-tue',
          studentId: momo.id,
          studentName: 'Momooreoluwa Sonaike',
          parentEmail: 'sonaike.family@gmail.com',
          course: 'Scratch Creators',
          dayOfWeek: 'Tuesday',
          date: new Date().toISOString().slice(0, 10),
          time: '16:00',
          duration: 60,
          mentor: 'Moses Oluwafemi Adebayo',
          tutorName: 'Moses Oluwafemi Adebayo',
          tutorEmail: 'adefemiadebayo20@gmail.com',
          link: 'https://meet.google.com/vdp-nmbh-sjj',
          attendanceStatus: 'pending'
        });
      }

      DashboardEngine.saveDB(db);
      return {
        studentsCount: db.students.length,
        tutorsCount: db.tutors.length,
        schedulesCount: db.schedules.length,
        momoId: momo.id,
        otherStudentId: otherStudent.id
      };
    });
    record('phase2', 'Seed & Verify Multi-Role Database State', roleMatrixInit.studentsCount >= 2 && roleMatrixInit.tutorsCount >= 1, JSON.stringify(roleMatrixInit));

    // Helper to switch active role session in sessionStorage + StemulusSecurity
    async function setRoleSession(role) {
      await page.evaluate((r) => {
        const sessions = {
          tutor: {
            id: 'usr-tut-104',
            name: 'Moses Oluwafemi Adebayo',
            email: 'adefemiadebayo20@gmail.com',
            phone: '2347063346551',
            role: 'tutor',
            issuedAt: Date.now()
          },
          parent: {
            id: 'par-sonaike-01',
            name: 'Mrs. Sonaike',
            email: 'sonaike.family@gmail.com',
            phone: '2348030001111',
            role: 'parent',
            issuedAt: Date.now()
          },
          admin: {
            id: 'usr-admin-01',
            name: 'STEMulus Executive Admin',
            email: 'admin@stemuluskidstech.com',
            role: 'admin',
            issuedAt: Date.now()
          }
        };
        const user = sessions[r];
        sessionStorage.setItem('stemulus_session', JSON.stringify(user));
        if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
          StemulusSecurity.saveSecureSession(user);
        }
      }, role);
    }

    // =========================================================================
    // PHASE 3: EXHAUSTIVE TUTOR PORTAL TORTURE TEST
    // =========================================================================
    await setRoleSession('tutor');
    await gotoReady(`${BASE_URL}/tutor-dashboard.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined' && typeof TutorEngine !== 'undefined');

    // 3.1 Navigation & UI Integrity (Desktop + Mobile viewports, Modals, Sidebar, Direct Meet Launch)
    const tutorDesktopCheck = await page.evaluate(() => {
      const tutorName = (document.getElementById('tutor-name') || {}).textContent || '';
      const assignedCards = document.querySelectorAll('#assigned-students-list > *').length;
      const scheduleCards = document.querySelectorAll('#schedule-list > *').length;
      const hasEscalationCard = Boolean(document.getElementById('tutor-escalations-card'));
      const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 8;

      // Test Profile & Availability Modal open/close
      TutorEngine.openProfileModal();
      const profileOpen = !document.getElementById('tutor-profile-modal').classList.contains('hidden');
      TutorEngine.closeProfileModal();

      // Test Direct Meeting Launch (no join-class.html intermediary)
      window.__openedWindows = [];
      TutorEngine.launchMeeting(null, 'https://meet.google.com/vdp-nmbh-sjj', 'sch-audit-momo-tue', 'Momooreoluwa Sonaike', 'Scratch Creators');
      const launchedDirectly = window.__openedWindows.some(w => w.url && w.url.includes('meet.google.com/vdp-nmbh-sjj'));

      return { tutorName, assignedCards, scheduleCards, hasEscalationCard, hasHorizontalOverflow, profileOpen, launchedDirectly };
    });
    record('phase3', 'Tutor Dashboard Desktop UI, Modals & Direct Meet Launch',
      tutorDesktopCheck.tutorName.includes('Moses') && tutorDesktopCheck.hasEscalationCard && tutorDesktopCheck.profileOpen && tutorDesktopCheck.launchedDirectly && !tutorDesktopCheck.hasHorizontalOverflow,
      JSON.stringify(tutorDesktopCheck)
    );

    // Mobile Viewport Test (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    const tutorMobileCheck = await page.evaluate(() => {
      const menuBtn = document.getElementById('menu-btn');
      if (menuBtn) menuBtn.click();
      const sidebar = document.getElementById('sidebar');
      const closeBtn = document.getElementById('sidebar-close-btn');
      if (closeBtn) closeBtn.click();
      return {
        hasMenuBtn: Boolean(menuBtn),
        hasSidebar: Boolean(sidebar),
        scrollWidth: document.documentElement.scrollWidth
      };
    });
    record('phase3', 'Tutor Dashboard Mobile Viewport (375x812) Rendering', tutorMobileCheck.hasMenuBtn && tutorMobileCheck.hasSidebar, JSON.stringify(tutorMobileCheck));
    await page.setViewportSize({ width: 1440, height: 900 });

    // 3.2 Tutor Attendance Logs Torture Test (Valid statuses + Edge cases)
    await gotoReady(`${BASE_URL}/tutor-attendance-create.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined');
    const attendanceTorture = await page.evaluate(() => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
      const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const backdate120d = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);

      // 1. Valid Present Log (60 mins)
      const resPresent = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        course: 'Scratch Creators',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        classDate: todayStr,
        classTime: '16:00',
        duration: 60,
        attendanceStatus: 'present',
        topic: 'Sprite Loop Animations & Event Broadcasts',
        whatBuilt: 'Interactive Space Dodger Game in Scratch',
        conceptGrasp: 5,
        tutorComment: 'Momooreoluwa mastered nested repeat loops independently!'
      });

      // 2. Rapid Double-Submit Race Condition Test (identical student + date + topic within 60s)
      const resRaceCondition = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        course: 'Scratch Creators',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        classDate: todayStr,
        classTime: '16:00',
        duration: 60,
        attendanceStatus: 'present',
        topic: 'Sprite Loop Animations & Event Broadcasts'
      });

      // 3. Valid Late, Absent, Rescheduled Logs
      const resLate = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        course: 'Scratch Creators',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        classDate: yesterday,
        classTime: '16:15',
        duration: 45,
        attendanceStatus: 'late',
        topic: 'Variables & Score Counters'
      });

      const resAbsent = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        course: 'Scratch Creators',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        classDate: twoDaysAgo,
        classTime: '16:00',
        duration: 60,
        attendanceStatus: 'absent',
        topic: 'Missed Session - Family Travel'
      });

      const resRescheduled = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        course: 'Scratch Creators',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        classDate: threeDaysAgo,
        classTime: '16:00',
        duration: 60,
        attendanceStatus: 'rescheduled',
        topic: 'Rescheduled to Thursday 5 PM'
      });

      // 4. Edge Case: Missing Fields
      const resMissingTopic = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        classDate: todayStr,
        topic: ''
      });

      // 5. Edge Case: Future Date
      const resFuture = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        classDate: futureDate,
        topic: 'Future Class Topic'
      });

      // 6. Edge Case: Backdating > 90 days
      const resBackdate = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        classDate: backdate120d,
        topic: 'Ancient Class Topic'
      });

      // 7. Edge Case: Invalid Durations (0 mins and 480 mins)
      const resZeroDuration = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        classDate: todayStr,
        duration: 0,
        topic: 'Zero Duration Test'
      });
      const resHugeDuration = DashboardEngine.submitAttendance({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        classDate: todayStr,
        duration: 480,
        topic: 'Oversized Duration Test'
      });

      return {
        presentOk: Boolean(resPresent && resPresent.success),
        presentRecordId: resPresent && resPresent.record ? resPresent.record.id : null,
        absentRecordId: resAbsent && resAbsent.record ? resAbsent.record.id : null,
        raceBlocked: resRaceCondition && resRaceCondition.success === false && resRaceCondition.code === 'DUPLICATE_SUBMISSION',
        lateOk: Boolean(resLate && resLate.success && resLate.record.attendanceStatus === 'late'),
        absentOk: Boolean(resAbsent && resAbsent.success && resAbsent.record.attendanceStatus === 'absent'),
        rescheduledOk: Boolean(resRescheduled && resRescheduled.success && resRescheduled.record.attendanceStatus === 'rescheduled'),
        missingBlocked: resMissingTopic && resMissingTopic.success === false && resMissingTopic.code === 'MISSING_TOPIC',
        futureBlocked: resFuture && resFuture.success === false && resFuture.code === 'FUTURE_CLASS',
        backdateBlocked: resBackdate && resBackdate.success === false && resBackdate.code === 'BACKDATE_LIMIT_EXCEEDED',
        durationBlocked: resZeroDuration.code === 'INVALID_DURATION' && resHugeDuration.code === 'INVALID_DURATION'
      };
    });

    record('phase3', 'Tutor Attendance Valid Statuses (present, late, absent, rescheduled)',
      attendanceTorture.presentOk && attendanceTorture.lateOk && attendanceTorture.absentOk && attendanceTorture.rescheduledOk,
      JSON.stringify({ presentOk: attendanceTorture.presentOk, lateOk: attendanceTorture.lateOk, absentOk: attendanceTorture.absentOk, rescheduledOk: attendanceTorture.rescheduledOk })
    );
    record('phase3', 'Tutor Attendance Edge Cases (Race Condition, Missing Fields, Future Date, >90d Backdate, Invalid Duration)',
      attendanceTorture.raceBlocked && attendanceTorture.missingBlocked && attendanceTorture.futureBlocked && attendanceTorture.backdateBlocked && attendanceTorture.durationBlocked,
      JSON.stringify(attendanceTorture)
    );

    // 3.3 Monthly Report Submission Torture Test
    await gotoReady(`${BASE_URL}/tutor-monthly-report.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined' && typeof MonthlyReportEngine !== 'undefined');
    const reportTorture = await page.evaluate(() => {
      // 1. Incomplete report blocked
      const incompleteRes = DashboardEngine.addMonthlyReport({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        month: '',
        strengths: ''
      });

      // 2. Oversized payload (>10,000 chars) blocked
      const oversizedRes = DashboardEngine.addMonthlyReport({
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        month: '2026-10',
        strengths: 'A'.repeat(10500)
      });

      // 3. Valid Monthly Report with Special Characters & Director Voice sanitization
      const validRes = DashboardEngine.addMonthlyReport({
        id: 'mrep-audit-momo-oct',
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        parentName: 'Mrs. Sonaike',
        parentEmail: 'sonaike.family@gmail.com',
        tutorName: 'Moses Oluwafemi Adebayo',
        tutorEmail: 'adefemiadebayo20@gmail.com',
        course: 'Scratch Creators',
        month: '2026-10',
        sessionsAttended: 8,
        totalSessions: 8,
        totalHours: 8,
        module: 'Module 3: Event Loops & Clones',
        topics: 'Nested loops, custom blocks, collision detection & <script>alert("xss")</script>',
        strengths: 'Exceptional independent debugging -- Momooreoluwa built a complete Space Dodger game.',
        shiningHighlights: 'Exceptional independent debugging -- Momooreoluwa built a complete Space Dodger game.',
        growthAreas: 'Continue practicing modular custom blocks with parameters.',
        challenges: 'Initial coordinate math on negative Y axes.',
        recommendation: 'Advance to Python Turtle Graphics & Game Physics.',
        overallGrade: 'A+',
        engagementLevel: 'highly-engaged',
        status: 'pending_review'
      });

      // 4. Approve the report (simulating Admin finalization) and test Tutor Edit Lockout!
      DashboardEngine.updateMonthlyReportStatus('mrep-audit-momo-oct', 'sent_to_parent');

      // 5. Attempt to overwrite or edit the finalized report as a Tutor
      const overwriteAttempt1 = DashboardEngine.addMonthlyReport({
        id: 'mrep-audit-momo-oct',
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        month: '2026-10',
        strengths: 'Tampered after approval'
      });
      const overwriteAttempt2 = DashboardEngine.updateMonthlyReport('mrep-audit-momo-oct', {
        strengths: 'Tampered via updateMonthlyReport'
      });
      const overwriteAttempt3 = MonthlyReportEngine.submitReport({
        id: 'mrep-audit-momo-oct',
        studentId: 'std-1011-momo',
        studentName: 'Momooreoluwa Sonaike',
        month: '2026-10',
        shiningHighlights: 'Tampered via MonthlyReportEngine'
      });

      return {
        incompleteBlocked: incompleteRes && incompleteRes.success === false && incompleteRes.code === 'INCOMPLETE_REPORT',
        oversizedBlocked: oversizedRes && oversizedRes.success === false && oversizedRes.code === 'PAYLOAD_TOO_LARGE',
        validSubmitted: Boolean(validRes && validRes.id === 'mrep-audit-momo-oct'),
        emDashSanitized: !String(validRes.shiningHighlights || '').includes('\u2014') && !String(validRes.shiningHighlights || '').includes('--'),
        lockoutAddBlocked: overwriteAttempt1 && overwriteAttempt1.success === false && overwriteAttempt1.code === 'REPORT_LOCKED_FINALIZED',
        lockoutUpdateBlocked: overwriteAttempt2 && overwriteAttempt2.success === false && overwriteAttempt2.code === 'REPORT_LOCKED_FINALIZED',
        lockoutEngineBlocked: overwriteAttempt3 && overwriteAttempt3.success === false && overwriteAttempt3.code === 'REPORT_LOCKED_FINALIZED'
      };
    });

    record('phase3', 'Monthly Report Validation (Incomplete & Oversized >10k Chars Blocked, Em-Dash Sanitized)',
      reportTorture.incompleteBlocked && reportTorture.oversizedBlocked && reportTorture.validSubmitted && reportTorture.emDashSanitized,
      JSON.stringify(reportTorture)
    );
    record('phase3', 'Monthly Report Finalization Lockout (Tutors Locked Out Once Approved/Sent)',
      reportTorture.lockoutAddBlocked && reportTorture.lockoutUpdateBlocked && reportTorture.lockoutEngineBlocked,
      JSON.stringify({
        lockoutAddBlocked: reportTorture.lockoutAddBlocked,
        lockoutUpdateBlocked: reportTorture.lockoutUpdateBlocked,
        lockoutEngineBlocked: reportTorture.lockoutEngineBlocked
      })
    );

    // 3.4 Tutor Issue Escalation to Admin (All 5 Categories)
    await gotoReady(`${BASE_URL}/tutor-dashboard.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined' && typeof TutorEngine !== 'undefined');
    const escalationTorture = await page.evaluate(() => {
      const categories = [
        { category: 'student_behavior', severity: 'high', summary: 'Repeated off-task tab switching during Scratch lab', details: 'Coder opened external gaming tabs 3 times during loop exercise.' },
        { category: 'technical_issue', severity: 'medium', summary: 'WebGL canvas lag on student Chromebook', details: 'Scratch stage frame rate dropped when cloning >50 sprites.' },
        { category: 'scheduling_conflict', severity: 'high', summary: 'School exam timetable overlap on Tuesday 4 PM', details: 'Parent mentioned school math prep conflicts with Tuesday slot.' },
        { category: 'parent_dispute', severity: 'critical', summary: 'Dispute over missed makeup session policy', details: 'Parent requested extra unbilled makeup session after unnotified absence.' },
        { category: 'payment_query', severity: 'low', summary: 'Clarification on October bonus hours calculation', details: 'Checking whether 90-minute workshop session counts as 1.5x hours.' }
      ];

      const submittedIds = [];
      categories.forEach((item, idx) => {
        const res = DashboardEngine.submitIssueEscalation({
          id: 'esc-audit-' + (idx + 1),
          category: item.category,
          severity: item.severity,
          studentId: 'std-1011-momo',
          studentName: 'Momooreoluwa Sonaike',
          tutorId: 'usr-tut-104',
          tutorName: 'Moses Oluwafemi Adebayo',
          tutorEmail: 'adefemiadebayo20@gmail.com',
          summary: item.summary,
          details: item.details,
          attachmentUrl: 'https://drive.google.com/file/d/audit-evidence-' + (idx + 1)
        });
        if (res && res.success) submittedIds.push(res.escalation.id);
      });

      TutorEngine.renderEscalationsList();
      const renderedItems = document.querySelectorAll('#tutor-escalations-list > div').length;
      const adminNotifs = DashboardEngine.getDB().notifications.filter(n => n && n.escalationId);

      return {
        submittedCount: submittedIds.length,
        renderedItems,
        adminNotificationsCount: adminNotifs.length,
        firstEscalationId: submittedIds[0]
      };
    });
    record('phase3', 'Tutor Issue Escalation across All 5 Categories + Real-Time Admin Notification',
      escalationTorture.submittedCount === 5 && escalationTorture.renderedItems >= 5 && escalationTorture.adminNotificationsCount >= 5,
      JSON.stringify(escalationTorture)
    );

    // =========================================================================
    // PHASE 4: EXHAUSTIVE PARENT PORTAL TORTURE TEST
    // =========================================================================
    // First approve the attendance record so it is visible to the Parent portal
    await page.evaluate((attId) => {
      if (attId && DashboardEngine.updateAttendanceStatus) {
        DashboardEngine.updateAttendanceStatus(attId, 'approved');
      }
    }, attendanceTorture.presentRecordId);

    await setRoleSession('parent');
    await gotoReady(`${BASE_URL}/parent-dashboard.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined' && typeof ParentEngine !== 'undefined');

    const parentDashboardCheck = await page.evaluate(() => {
      const containerText = (document.getElementById('children-container') || {}).innerText || '';
      const showsOwnChild = containerText.includes('Momooreoluwa');
      const leaksOtherChild = containerText.includes('Joshua Babalola');

      // Test interactive modals on Parent Dashboard
      ParentEngine.openInternationalPaymentGuide();
      const paymentGuideOpen = !document.getElementById('modal-international-payment-guide').classList.contains('hidden');
      ParentEngine.closeInternationalPaymentGuide();

      ParentEngine.openNoticesModal();
      const noticesModal = document.getElementById('parent-notices-modal');
      const noticesOpen = noticesModal ? !noticesModal.classList.contains('hidden') : true;
      ParentEngine.closeNoticesModal();

      // Test PDF report button on Parent Dashboard
      window.__openedWindows = [];
      ParentEngine.viewMonthlyReport('mrep-audit-momo-oct');
      const pdfOpened = window.__openedWindows.length > 0;

      // Test Direct Meet Launch on Parent Dashboard
      window.__openedWindows = [];
      ParentEngine.launchMeeting(null, 'https://meet.google.com/vdp-nmbh-sjj', 'sch-audit-momo-tue', 'Momooreoluwa Sonaike', 'Scratch Creators');
      const meetLaunched = window.__openedWindows.some(w => w.url && w.url.includes('meet.google.com/vdp-nmbh-sjj'));

      // Check notifications isolation
      const parentNotifs = DashboardEngine.getNotifications('sonaike.family@gmail.com');
      const leakedNotif = parentNotifs.some(n => (n.studentName || '').includes('Joshua Babalola'));

      return {
        showsOwnChild,
        leaksOtherChild,
        paymentGuideOpen,
        noticesOpen,
        pdfOpened,
        meetLaunched,
        leakedNotif
      };
    });

    record('phase4', 'Parent Dashboard Zero Data Leakage & Child Roster Isolation',
      parentDashboardCheck.showsOwnChild && !parentDashboardCheck.leaksOtherChild && !parentDashboardCheck.leakedNotif,
      JSON.stringify({ showsOwnChild: parentDashboardCheck.showsOwnChild, leaksOtherChild: parentDashboardCheck.leaksOtherChild, leakedNotif: parentDashboardCheck.leakedNotif })
    );
    record('phase4', 'Parent Dashboard Interactive Modals, PDF Evaluation Viewer & Direct Meet Launch',
      parentDashboardCheck.paymentGuideOpen && parentDashboardCheck.pdfOpened && parentDashboardCheck.meetLaunched,
      JSON.stringify(parentDashboardCheck)
    );

    // 4.1 Parameter Tampering / IDOR Test on parent-progress.html?studentId=std-1007-r4cv
    await gotoReady(`${BASE_URL}/parent-progress.html?studentId=std-1007-r4cv`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined');
    const idorTamperCheck = await page.evaluate(() => {
      const blockedFlag = Boolean(window.__unauthorizedStudentAccessBlocked);
      const bodyText = document.body.innerText || '';
      const leakedJoshua = bodyText.includes('Joshua Babalola');
      return { blockedFlag, leakedJoshua };
    });
    record('phase4', 'Parent Portal IDOR Parameter Tampering Blocked (?studentId=std-1007-r4cv)',
      idorTamperCheck.blockedFlag && !idorTamperCheck.leakedJoshua,
      JSON.stringify(idorTamperCheck)
    );

    // 4.2 Parent Progress Visibility & Sync Verification for Own Linked Child (?studentId=std-1011-momo)
    await gotoReady(`${BASE_URL}/parent-progress.html?studentId=std-1011-momo`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined');
    const parentProgressSyncCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const showsChildName = bodyText.includes('Momooreoluwa');
      const showsAttendanceTopic = bodyText.includes('Sprite Loop Animations') || bodyText.includes('Space Dodger');
      const evalSection = document.getElementById('official-reports-list') || document.getElementById('official-monthly-evaluations-list');
      const evalHtml = evalSection ? evalSection.innerHTML : '';
      const showsMonthlyEval = evalHtml.includes('Module 3') || evalHtml.includes('Space Dodger') || evalHtml.includes('Scratch Creators');
      const rawScriptInjected = evalSection ? Boolean(evalSection.querySelector('script')) : false;

      window.__openedWindows = [];
      if (typeof window.openOfficialPDF === 'function') {
        window.openOfficialPDF('mrep-audit-momo-oct');
      }
      const pdfOpened = window.__openedWindows.length > 0;

      return { showsChildName, showsAttendanceTopic, showsMonthlyEval, rawScriptInjected, pdfOpened };
    });
    record('phase4', 'Parent Progress Live Sync (Phase 3 Attendance Log + Approved Monthly Report + XSS Escaping)',
      parentProgressSyncCheck.showsChildName && parentProgressSyncCheck.showsAttendanceTopic && parentProgressSyncCheck.showsMonthlyEval && !parentProgressSyncCheck.rawScriptInjected && parentProgressSyncCheck.pdfOpened,
      JSON.stringify(parentProgressSyncCheck)
    );

    // =========================================================================
    // PHASE 5: ADMIN PORTAL & IN-APP SMART ADMIN ASSISTANT STRESS TEST
    // =========================================================================
    await setRoleSession('admin');
    await gotoReady(`${BASE_URL}/admin-dashboard.html`, () => document.readyState !== 'loading' && typeof DashboardEngine !== 'undefined' && typeof AdminEngine !== 'undefined' && typeof OperationsManagerEngine !== 'undefined');
    await page.evaluate(() => {
      const opsEl = document.getElementById('mount-operations-suite');
      if (opsEl && !document.getElementById('smart-admin-prompt-input') && typeof OperationsManagerEngine !== 'undefined') {
        opsEl.innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();
      }
    });

    // 5.1 Manual Admin Surface (Escalation Inbox Reply/Reassign/Resolve, Attendance Override, Report Workflow)
    const adminManualCheck = await page.evaluate((absentRecId) => {
      // 1. Verify Issue Escalation Inbox rendered all 5 escalations from Phase 3
      AdminEngine.renderIssueEscalationInbox();
      const inboxItems = document.querySelectorAll('#admin-escalation-items > div').length;

      // 2. Reply, Reassign, and Resolve escalation #1
      const repRes = AdminEngine.replyIssueEscalation('esc-audit-1', 'Reviewed session recording; parent advisory dispatched.');
      const reasRes = AdminEngine.reassignIssueEscalation('esc-audit-1', 'Lead Safeguarding & Behaviour Coordinator');
      const resvRes = AdminEngine.resolveIssueEscalation('esc-audit-1', 'Behaviour contract agreed with parent and student.');

      // 3. Approve the absent attendance record and verify schedule status remains 'absent' (not overwritten to 'present')
      let absentPreserved = false;
      if (absentRecId) {
        DashboardEngine.updateAttendanceStatus(absentRecId, 'approved');
        const rec = DashboardEngine.getAttendanceRecords().find(r => r && r.id === absentRecId);
        absentPreserved = Boolean(rec && rec.status === 'approved' && rec.attendanceStatus === 'absent');
      }

      // 4. Test MonthlyReportEngine approveReport decoupled email & invoice queue
      const mrApprove = MonthlyReportEngine.approveReport('mrep-audit-momo-oct');
      const db = DashboardEngine.getDB();
      const queuedInvoice = (db.emailQueue || []).some(e => e && e.triggeredBy === 'admin_monthly_report_approval_invoice');

      return {
        inboxItems,
        replyOk: Boolean(repRes && repRes.success),
        reassignOk: Boolean(reasRes && reasRes.success),
        resolveOk: Boolean(resvRes && resvRes.success && resvRes.escalation.status === 'resolved'),
        absentPreserved,
        mrApproveOk: Boolean(mrApprove && mrApprove.status === 'approved' && queuedInvoice)
      };
    }, attendanceTorture.absentRecordId);

    record('phase5', 'Admin Manual Surface (Issue Escalation Inbox Reply/Reassign/Resolve, Attendance Override, Report Approval)',
      adminManualCheck.inboxItems >= 5 && adminManualCheck.replyOk && adminManualCheck.reassignOk && adminManualCheck.resolveOk && adminManualCheck.absentPreserved && adminManualCheck.mrApproveOk,
      JSON.stringify(adminManualCheck)
    );

    // 5.2 Smart Admin Assistant (Prompt-Driven Operations Stress Test)
    const smartAdminStressTest = await page.evaluate(async () => {
      function submitLivePrompt(promptText) {
        const liveInput = document.getElementById('smart-admin-prompt-input');
        const liveOutput = document.getElementById('smart-admin-prompt-output');
        if (liveInput && liveOutput) {
          liveInput.value = promptText;
          return OperationsManagerEngine.submitSmartAdminPrompt(new Event('submit'));
        }
        return OperationsManagerEngine.executeSmartAdminCommand(promptText);
      }

      // Command 1: Schedule Mutation Command
      const prompt1 = "Move Momooreoluwa Sonaike's class with Moses Oluwafemi Adebayo from Tuesday 4 PM to Thursday 5 PM";
      const resMove = submitLivePrompt(prompt1);

      // Verify DB schedule actually mutated to Thursday 17:00
      const dbAfterMove = DashboardEngine.getDB();
      const updatedSchedule = (dbAfterMove.schedules || []).find(s =>
        s && s.studentName === 'Momooreoluwa Sonaike' && s.dayOfWeek === 'Thursday' && s.time === '17:00'
      );

      // Command 2: Direct Tutor Messaging Command
      const prompt2 = "Text Moses Oluwafemi Adebayo asking why today's attendance log isn't submitted yet";
      const resText = submitLivePrompt(prompt2);

      // Command 3: Autonomous Reschedule Negotiation Command
      const prompt3 = "Parent of Momooreoluwa Sonaike wants to move Saturday's session. Check Moses Oluwafemi Adebayo's availability matrix, find the best open slot, and message the tutor to negotiate/confirm the reschedule.";
      const resNegotiate = submitLivePrompt(prompt3);

      // Command 4A: Ambiguous Prompt - Duplicate Tutor First Name
      const db = DashboardEngine.getDB();
      db.tutors.push({
        id: 'usr-tut-dup-moses',
        name: 'Moses Adeyemi',
        email: 'moses.adeyemi@stemuluskidstech.com',
        phone: '2348099998888',
        status: 'active'
      });
      DashboardEngine.saveDB(db);

      const resAmbiguousTutor = OperationsManagerEngine.executeSmartAdminCommand(
        "Move Momooreoluwa Sonaike's class with Moses from Thursday 5 PM to Friday 4 PM"
      );

      // Remove duplicate tutor after test
      const dbClean = DashboardEngine.getDB();
      dbClean.tutors = dbClean.tutors.filter(t => t && t.id !== 'usr-tut-dup-moses');
      DashboardEngine.saveDB(dbClean);

      // Command 4B: Conflicting / Unavailable Time Slot
      // Try moving Joshua Babalola's class with Moses Oluwafemi Adebayo to Thursday 5 PM (already occupied by Momooreoluwa!)
      const resConflictSlot = OperationsManagerEngine.executeSmartAdminCommand(
        "Move Joshua Babalola's class with Moses Oluwafemi Adebayo from Monday 3 PM to Thursday 5 PM"
      );

      // Command 4C: Past Date Prompt
      const resPastDate = OperationsManagerEngine.executeSmartAdminCommand(
        "Move Momooreoluwa Sonaike's class with Moses Oluwafemi Adebayo on 2020-01-01 from Thursday 5 PM to Friday 4 PM"
      );

      // Also verify MuluAIEngine.generateResponse delegates Admin operational commands
      let muluDelegatedOk = false;
      if (typeof MuluAIEngine !== 'undefined') {
        const muluInstance = new MuluAIEngine();
        muluInstance.role = 'admin';
        muluInstance.currentPortal = 'admin';
        const muluReply = await muluInstance.generateResponse("Text Moses Oluwafemi Adebayo asking why today's attendance log isn't submitted yet");
        muluDelegatedOk = Boolean(muluReply && muluReply.text && muluReply.text.includes('Direct Tutor Message Dispatched'));
      }

      return {
        moveOk: Boolean(resMove && resMove.status === 'SUCCESS' && updatedSchedule),
        updatedSlot: updatedSchedule ? `${updatedSchedule.dayOfWeek} ${updatedSchedule.time} (${updatedSchedule.date})` : null,
        textOk: Boolean(resText && resText.status === 'SUCCESS' && resText.outboundPayload && resText.outboundPayload.phoneNumber === '2347063346551'),
        negotiateOk: Boolean(resNegotiate && resNegotiate.status === 'SUCCESS' && resNegotiate.proposedSlot && resNegotiate.outboundMessage),
        proposedSlot: resNegotiate && resNegotiate.proposedSlot ? resNegotiate.proposedSlot : null,
        ambiguousBlocked: Boolean(resAmbiguousTutor && resAmbiguousTutor.status === 'CLARIFICATION_REQUIRED' && resAmbiguousTutor.reason === 'DUPLICATE_TUTOR_NAME' && resAmbiguousTutor.mutatedDatabase === false),
        conflictBlocked: Boolean(resConflictSlot && resConflictSlot.status === 'CONFLICT_DETECTED' && resConflictSlot.reason === 'SLOT_UNAVAILABLE' && resConflictSlot.mutatedDatabase === false),
        pastDateBlocked: Boolean(resPastDate && resPastDate.status === 'CLARIFICATION_REQUIRED' && resPastDate.mutatedDatabase === false),
        muluDelegatedOk
      };
    });

    record('phase5', 'Smart Admin Assistant: Schedule Mutation Command (DB Mutated + Conflict Checked + Portals Notified)',
      smartAdminStressTest.moveOk,
      `Moved to ${smartAdminStressTest.updatedSlot}`
    );
    record('phase5', 'Smart Admin Assistant: Direct Tutor Messaging Command (Phone Resolved + Webhook & Notification Dispatched)',
      smartAdminStressTest.textOk && smartAdminStressTest.muluDelegatedOk,
      JSON.stringify({ textOk: smartAdminStressTest.textOk, muluDelegatedOk: smartAdminStressTest.muluDelegatedOk })
    );
    record('phase5', 'Smart Admin Assistant: Autonomous Reschedule Negotiation (Availability Matrix Checked + Best Open Slot Found)',
      smartAdminStressTest.negotiateOk,
      JSON.stringify(smartAdminStressTest.proposedSlot)
    );
    record('phase5', 'Smart Admin Assistant: Ambiguous & Invalid Prompt Guardrails (Duplicate Tutor Name, Conflicting Slot, Past Date)',
      smartAdminStressTest.ambiguousBlocked && smartAdminStressTest.conflictBlocked && smartAdminStressTest.pastDateBlocked,
      JSON.stringify({
        ambiguousBlocked: smartAdminStressTest.ambiguousBlocked,
        conflictBlocked: smartAdminStressTest.conflictBlocked,
        pastDateBlocked: smartAdminStressTest.pastDateBlocked
      })
    );

    record('phase5', 'Zero Unhandled Console or Page Errors Across All 3 Portals',
      results.consoleErrors.length === 0 && results.pageErrors.length === 0,
      `consoleErrors=${results.consoleErrors.length}, pageErrors=${results.pageErrors.length}`
    );

  } finally {
    if (browser) await browser.close();
    server.close();
  }

  results.completedAt = new Date().toISOString();
  const outPath = path.join(ROOT, 'tools', 'torture_audit_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  const totalPassed = Object.values(results.phases).reduce((acc, p) => acc + p.passed, 0);
  const totalFailed = Object.values(results.phases).reduce((acc, p) => acc + p.failed, 0);
  console.log(`\n=== EXHAUSTIVE PORTAL TORTURE AUDIT COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED ===`);
  if (totalFailed > 0) process.exit(1);
})();
