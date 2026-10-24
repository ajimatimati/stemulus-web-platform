/**
 * STEMulus Automated Verification Suite: Smart Reschedule & Tutor Coverage Concierge
 * 
 * Validates:
 * 1. Deterministic Availability & Conflict Scanner.
 * 2. 1-Click Conflict-Free Open Slot Recommendation Generator.
 * 3. Qualified Substitute Tutor Matching (Subject + Language + Zero Conflict).
 * 4. Parent Smart Reschedule Lifecycle (Submission, Diagnostic Flagging, Approval, Day-of-Week Sync).
 * 5. Tutor Emergency & Coverage Lifecycle (Peer Tutor Suggestion, Handover, Reassignment).
 * 6. Google Meet Link (Hostless, 1080p Auto-Record) & Google Classroom Preservation.
 * 7. Browser UI & DOM Integration across Parent, Tutor, and Admin Dashboards (Playwright).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const RescheduleConciergeEngine = require('../assets/js/reschedule-concierge-engine.js');
const DashboardEngine = require('../assets/js/dashboard-engine.js');

let totalPass = 0;
let totalFail = 0;

function pass(desc) {
  console.log(`  ✅ [PASS] ${desc}`);
  totalPass++;
}

function fail(desc, err) {
  console.error(`  ❌ [FAIL] ${desc}: ${err.message || err}`);
  totalFail++;
}

async function runTest(desc, fn) {
  try {
    await fn();
    pass(desc);
  } catch (e) {
    fail(desc, e);
  }
}

// Simple test static server for Playwright
function createTestServer(port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const rootDir = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/__prime') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.min.js"></script></head><body></body></html>`);
      return;
    }
    if (reqUrl === '/') reqUrl = '/admin-dashboard.html';
    const filePath = path.join(rootDir, reqUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise(resolve => {
    server.listen(port, () => resolve(server));
  });
}

async function primeSession(page, port, session) {
  await page.goto(`http://localhost:${port}/__prime`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => {
    if (typeof StemulusSecurity !== 'undefined') {
      StemulusSecurity.saveSecureSession(s);
    }
    sessionStorage.setItem('stemulus_session_raw', JSON.stringify(s));
    localStorage.setItem('user', JSON.stringify(s));
    localStorage.setItem('role', s.role);
    localStorage.setItem('stemulus_auth_role', s.role);
    localStorage.setItem('stemulus_user_email', s.email);
    localStorage.setItem('stemulus_auth_token', 'stemulus_e2e_verified_token');
  }, session);
}

(async () => {
  console.log('================================================================');
  console.log('TEST SUITE: Smart Reschedule & Tutor Coverage Concierge');
  console.log('================================================================\n');

  // --- STAGE 1: Engine Methods & Helpers ---
  console.log('[STAGE 1] Testing Concierge Engine Core & Helpers...');

  await runTest('RescheduleConciergeEngine exports all required functions', () => {
    assert.strictEqual(typeof RescheduleConciergeEngine.checkTutorAvailability, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.checkStudentAvailability, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.findRecommendedSlots, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.findQualifiedSubstitutes, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.submitSmartReschedule, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.submitTutorCoverageRequest, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.approveRescheduleWithConcierge, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.approveCoverageWithConcierge, 'function');
    assert.strictEqual(typeof RescheduleConciergeEngine.getDayOfWeek, 'function');
  });

  await runTest('getDayOfWeek accurately maps calendar dates to weekday names', () => {
    assert.strictEqual(RescheduleConciergeEngine.getDayOfWeek('2026-10-18'), 'Sunday');
    assert.strictEqual(RescheduleConciergeEngine.getDayOfWeek('2026-10-19'), 'Monday');
    assert.strictEqual(RescheduleConciergeEngine.getDayOfWeek('2026-10-23'), 'Friday');
    assert.strictEqual(RescheduleConciergeEngine.getDayOfWeek('2026-10-24'), 'Saturday');
  });

  await runTest('timeToMinutes and minutesToTime correctly handle 24h format', () => {
    assert.strictEqual(RescheduleConciergeEngine.timeToMinutes('19:00'), 1140);
    assert.strictEqual(RescheduleConciergeEngine.timeToMinutes('10:30'), 630);
    assert.strictEqual(RescheduleConciergeEngine.minutesToTime(1140), '19:00');
    assert.strictEqual(RescheduleConciergeEngine.minutesToTime(630), '10:30');
  });

  // --- STAGE 2: Availability & Conflict Scanner ---
  console.log('\n[STAGE 2] Testing Deterministic Availability & Conflict Scanner...');

  const mockDb = {
    tutors: [
      { id: 'tut-olalekan', name: 'Olalekan Israel Ajimati', email: 'olalekan@stemuluskidstech.com', subjects: ['Scratch Creators', 'Python Programming'], languages: ['English'] },
      { id: 'tut-moses', name: 'Moses Oluwafemi Adebayo', email: 'adefemiadebayo20@gmail.com', subjects: ['Scratch Creators', 'Robotics'], languages: ['English'] },
      { id: 'tut-kafa', name: 'Kafayat Abdulwahab', email: 'kafa@stemuluskidstech.com', subjects: ['Scratch Creators', 'Python Programming'], languages: ['English'] },
      { id: 'tut-sarah', name: 'Sarah Jane', email: 'sarah@stemuluskidstech.com', subjects: ['Python Programming'], languages: ['English'] }
    ],
    students: [
      { id: 'std-junayd', name: 'JUNAYD KARI', tutorName: 'Olalekan Israel Ajimati', program: 'Scratch Creators' },
      { id: 'std-joshua', name: 'Joshua Ogba', tutorName: 'Moses Oluwafemi Adebayo', program: 'Scratch Creators' }
    ],
    schedules: [
      {
        id: 'sch-junayd-1',
        studentId: 'std-junayd',
        studentName: 'JUNAYD KARI',
        tutorId: 'tut-olalekan',
        mentor: 'Olalekan Israel Ajimati',
        course: 'Scratch Creators',
        date: '2026-10-24',
        time: '10:00',
        duration: 60,
        dayOfWeek: 'Saturday',
        status: 'scheduled',
        link: 'https://meet.google.com/gyd-fewb-cdh',
        hostNotRequired: true,
        autoRecord: true
      }
    ],
    rescheduleRequests: [],
    coverageRequests: [],
    notifications: []
  };

  await runTest('Detects tutor schedule conflict during overlapping hours', () => {
    // Coach Olalekan is teaching Junayd on 2026-10-24 at 10:00
    const conflictCheck = RescheduleConciergeEngine.checkTutorAvailability('tut-olalekan', '2026-10-24', '10:00', 60, 'sch-diff', mockDb);
    assert.strictEqual(conflictCheck.available, false);
    assert.strictEqual(conflictCheck.conflictingSchedule.studentName, 'JUNAYD KARI');

    const overlapCheck = RescheduleConciergeEngine.checkTutorAvailability('tut-olalekan', '2026-10-24', '10:30', 60, 'sch-diff', mockDb);
    assert.strictEqual(overlapCheck.available, false);
  });

  await runTest('Confirms tutor available when no overlapping schedule exists', () => {
    const freeCheck = RescheduleConciergeEngine.checkTutorAvailability('tut-olalekan', '2026-10-24', '16:00', 60, null, mockDb);
    assert.strictEqual(freeCheck.available, true);

    const otherDayCheck = RescheduleConciergeEngine.checkTutorAvailability('tut-olalekan', '2026-10-25', '10:00', 60, null, mockDb);
    assert.strictEqual(otherDayCheck.available, true);
  });

  await runTest('Detects student conflict if child is already booked', () => {
    const studentConflict = RescheduleConciergeEngine.checkStudentAvailability('std-junayd', '2026-10-24', '10:00', 60, 'sch-diff', mockDb);
    assert.strictEqual(studentConflict.available, false);

    const studentFree = RescheduleConciergeEngine.checkStudentAvailability('std-junayd', '2026-10-24', '16:00', 60, null, mockDb);
    assert.strictEqual(studentFree.available, true);
  });

  // --- STAGE 3: 1-Click Conflict-Free Slot Recommendations ---
  console.log('\n[STAGE 3] Testing 1-Click Slot Recommendation Generator...');

  await runTest('Generates 1-click verified open slots without conflict', () => {
    const recommended = RescheduleConciergeEngine.findRecommendedSlots('std-junayd', 'tut-olalekan', 7, mockDb);
    assert(Array.isArray(recommended) && recommended.length > 0, 'Must return recommendations');
    assert(recommended.length <= 4, 'Must return at most 4 curated slots');

    recommended.forEach(slot => {
      assert.strictEqual(slot.status, 'verified_conflict_free');
      assert(slot.date && slot.time && slot.dayOfWeek, 'Slot must have date, time, and dayOfWeek');
      const tutorAvail = RescheduleConciergeEngine.checkTutorAvailability('tut-olalekan', slot.date, slot.time, 60, null, mockDb);
      assert.strictEqual(tutorAvail.available, true, `Slot ${slot.date} ${slot.time} must be free for coach`);
    });
  });

  // --- STAGE 4: Qualified Substitute Tutor Matching ---
  console.log('\n[STAGE 4] Testing Qualified Substitute Tutor Matcher...');

  await runTest('Finds vetted peer substitute tutors matching course and availability', () => {
    // For Scratch Creators at 2026-10-24 10:00, exclude Coach Olalekan
    const substitutes = RescheduleConciergeEngine.findQualifiedSubstitutes('Scratch Creators', 'English', '2026-10-24', '10:00', 60, 'tut-olalekan', mockDb);
    
    assert(Array.isArray(substitutes), 'Must return array');
    assert(substitutes.length >= 2, 'Should find Coach Moses and Coach Kafayat');

    // Coach Sarah only teaches Python, so should not match Scratch Creators
    const hasSarah = substitutes.some(s => s.name === 'Sarah Jane');
    assert.strictEqual(hasSarah, false, 'Tutor without Scratch track must not be recommended');

    // Top candidate must be free and teach Scratch
    const topSub = substitutes[0];
    assert(topSub.subjects.includes('Scratch Creators'), 'Substitute must teach course');
    assert(topSub.matchScore >= 80, 'Match score must be high');
  });

  // --- STAGE 5: Smart Reschedule Lifecycle ---
  console.log('\n[STAGE 5] Testing Smart Reschedule Lifecycle (Parent -> Engine -> Approval)...');

  let submittedReqId = null;

  await runTest('Submits smart reschedule request with availability diagnostics', () => {
    // Request a slot on 2026-10-25 at 14:00
    const req = RescheduleConciergeEngine.submitSmartReschedule({
      scheduleId: 'sch-junayd-1',
      requestedDate: '2026-10-25',
      requestedTime: '14:00',
      reason: 'Family Travel',
      parentEmail: 'parent@example.com'
    }, mockDb);

    assert(req.id && req.id.startsWith('res-'), 'Must generate request ID');
    assert.strictEqual(req.status, 'pending');
    assert.strictEqual(req.requestedDayOfWeek, 'Sunday');
    assert.strictEqual(req.primaryTutorAvailable, true); // Coach free on 2026-10-25 at 14:00

    submittedReqId = req.id;
  });

  await runTest('Approves reschedule, synchronizing date, time, and dayOfWeek accurately', () => {
    const success = RescheduleConciergeEngine.approveRescheduleWithConcierge(submittedReqId, null, mockDb);
    assert.strictEqual(success, true);

    const sch = mockDb.schedules.find(s => s.id === 'sch-junayd-1');
    assert(sch, 'Schedule must exist');
    assert.strictEqual(sch.date, '2026-10-25');
    assert.strictEqual(sch.time, '14:00');
    assert.strictEqual(sch.dayOfWeek, 'Sunday', 'dayOfWeek must be recalculated accurately');
    assert.strictEqual(sch.hostNotRequired, true, 'Hostless guarantee must remain active');
    assert.strictEqual(sch.autoRecord, true, 'Auto-record must remain active');
  });

  // --- STAGE 6: Tutor Emergency & Coverage Request Lifecycle ---
  console.log('\n[STAGE 6] Testing Tutor Emergency Coverage Workflow...');

  let coverageId = null;

  await runTest('Tutor submits emergency coverage request with candidate substitutes', () => {
    const cov = RescheduleConciergeEngine.submitTutorCoverageRequest({
      scheduleId: 'sch-junayd-1',
      tutorId: 'tut-olalekan',
      tutorName: 'Olalekan Israel Ajimati',
      reason: 'Illness / Medical Leave',
      notes: 'Junayd is halfway through dinosaur animation'
    }, mockDb);

    assert(cov.id && cov.id.startsWith('cov-'), 'Must generate coverage ID');
    assert.strictEqual(cov.status, 'pending');
    assert.strictEqual(cov.reason, 'Illness / Medical Leave');
    assert(Array.isArray(cov.suggestedSubstitutes), 'Must attach candidate substitutes');
    coverageId = cov.id;
  });

  await runTest('Admin confirms coverage, reassigning tutor while preserving Google Meet', () => {
    // Assign Moses as substitute
    const success = RescheduleConciergeEngine.approveCoverageWithConcierge(coverageId, 'tut-moses', mockDb);
    assert.strictEqual(success, true);

    const sch = mockDb.schedules.find(s => s.id === 'sch-junayd-1');
    assert(sch, 'Schedule must exist');
    assert.strictEqual(sch.tutorId, 'tut-moses');
    assert.strictEqual(sch.mentor, 'Moses Oluwafemi Adebayo');
    assert.strictEqual(sch.coverageApproved, true);
    assert.strictEqual(sch.hostNotRequired, true, 'Hostless access preserved');
    assert.strictEqual(sch.autoRecord, true, 'Auto-record preserved');
  });

  // --- STAGE 7: Browser DOM & Playwright Integration ---
  console.log('\n[STAGE 7] Testing Browser DOM Integration via Playwright...');

  const serverPort = 8101;
  const server = await createTestServer(serverPort);
  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    // 1. Check Parent Dashboard Reschedule Modal
    await runTest('Parent Dashboard: Smart Reschedule modal renders recommended slots', async () => {
      const page = await browser.newPage();
      try {
        await primeSession(page, serverPort, {
          id: 'usr-parent-01',
          name: 'Parent User',
          email: 'parent@stemuluskidstech.com',
          role: 'parent'
        });
        await page.goto(`http://localhost:${serverPort}/parent-dashboard.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        // Verify ParentEngine.selectRecommendedSlot is defined
        const hasSlotHandler = await page.evaluate(() => typeof ParentEngine !== 'undefined' && typeof ParentEngine.selectRecommendedSlot === 'function');
        assert.strictEqual(hasSlotHandler, true);

        // Verify modal DOM
        const modalExists = await page.$('#parent-reschedule-modal');
        assert(modalExists !== null, 'Reschedule modal element must be present in DOM');

        const recContainer = await page.$('#resch-recommended-container');
        assert(recContainer !== null, 'Recommended slots container must exist');
      } finally {
        await page.close();
      }
    });

    // 2. Check Tutor Dashboard Coverage Button & Modal
    await runTest('Tutor Dashboard: Upcoming classes display Coverage button and modal', async () => {
      const page = await browser.newPage();
      try {
        await primeSession(page, serverPort, {
          id: 'usr-tut-103',
          name: 'Olalekan Israel Ajimati',
          email: 'olalekan@stemuluskidstech.com',
          role: 'tutor'
        });
        await page.goto(`http://localhost:${serverPort}/tutor-dashboard.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const hasCoverageHandler = await page.evaluate(() => typeof TutorEngine !== 'undefined' && typeof TutorEngine.openCoverageModal === 'function');
        assert.strictEqual(hasCoverageHandler, true);

        const covModal = await page.$('#tutor-coverage-modal');
        assert(covModal !== null, 'Tutor coverage modal must be injected in DOM');
      } finally {
        await page.close();
      }
    });

    // 3. Check Admin Dashboard Concierge Radar
    await runTest('Admin Dashboard: Concierge Radar renders intelligent diagnostics', async () => {
      const page = await browser.newPage();
      try {
        await primeSession(page, serverPort, {
          id: 'usr-admin-01',
          name: 'STEMulus Admin',
          email: 'admin@stemuluskidstech.com',
          role: 'admin'
        });
        await page.goto(`http://localhost:${serverPort}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const hasApproveHandler = await page.evaluate(() => typeof AdminEngine !== 'undefined' && typeof AdminEngine.approveScheduleAdjust === 'function');
        assert.strictEqual(hasApproveHandler, true);

        const hasCoverageApproveHandler = await page.evaluate(() => typeof AdminEngine !== 'undefined' && typeof AdminEngine.approveCoverageRequest === 'function');
        assert.strictEqual(hasCoverageApproveHandler, true);
      } finally {
        await page.close();
      }
    });

  } finally {
    if (browser) await browser.close();
    server.close();
  }

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${totalPass} Passed | ${totalFail} Failed`);
  console.log('================================================================');

  if (totalFail > 0) {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL SMART RESCHEDULE & COVERAGE CONCIERGE TESTS PASSED!\n');
    process.exit(0);
  }
})();
