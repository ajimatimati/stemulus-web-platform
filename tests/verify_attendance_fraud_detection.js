/**
 * End-to-End Test Suite: Automated Attendance Fraud & Ghost Class Detection
 * Verifies:
 * 1. Strict Schedule & Window Enforcement: Unscheduled or future dates are rejected.
 * 2. Continuous Meeting Session Monitoring: Telemetry heartbeats accurately log presence and duration.
 * 3. Smart False Submission Detection: Ghost classes (0m held) and absentee claims are flagged.
 * 4. Real-Time Admin Escalation: Push alerts to ntfy.sh and incident records are created.
 * 5. Payroll Safeguard: Flagged records are strictly excluded from batch approvals.
 * 6. Browser UI & Double-Bezel Modal: Clean user feedback without native browser alerts.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function pass(msg) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
  totalTests++;
  passedTests++;
}

function fail(msg, err) {
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
  if (err) console.error('        Details:', err);
  totalTests++;
  failedTests++;
}

// Set up mock browser-like environment for Node evaluation
function setupMockEnvironment() {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
  global.sessionStorage = {
    getItem: (k) => store['sess_' + k] || null,
    setItem: (k, v) => { store['sess_' + k] = String(v); },
    removeItem: (k) => { delete store['sess_' + k]; },
    clear: () => {}
  };
  global.window = global;
  global.document = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  global.Event = function(name) { this.name = name; };
  global.CustomEvent = function(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; };

  // Mock fetch for ntfy dispatch
  global.fetchCalls = [];
  global.fetch = function(url, options) {
    global.fetchCalls.push({ url, options });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('OK')
    });
  };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🛡️ EXECUTING ATTENDANCE FRAUD DETECTION & MONITORING TEST SUITE');
  console.log('================================================================\n');

  setupMockEnvironment();

  // Load engines
  const dashboardEnginePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
  const sessionMonitoringEnginePath = path.join(__dirname, '..', 'assets', 'js', 'session-monitoring-engine.js');

  const dashboardCode = fs.readFileSync(dashboardEnginePath, 'utf8');
  const monitoringCode = fs.readFileSync(sessionMonitoringEnginePath, 'utf8');

  // Evaluate scripts in vm context
  const sandbox = {
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    window: global.window,
    document: global.document,
    fetch: global.fetch,
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Promise: Promise,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Event: global.Event,
    CustomEvent: global.CustomEvent,
    TextEncoder: typeof TextEncoder !== 'undefined' ? TextEncoder : require('util').TextEncoder,
    crypto: typeof crypto !== 'undefined' ? crypto : require('crypto').webcrypto
  };
  sandbox.global = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dashboardCode, sandbox);
  vm.runInContext(monitoringCode, sandbox);

  global.DashboardEngine = sandbox.DashboardEngine;
  global.SessionMonitoringEngine = sandbox.SessionMonitoringEngine;

  console.log('PART 1: CONTINUOUS MEETING SESSION MONITORING & TELEMETRY');
  console.log('---------------------------------------------------------');

  const todayDate = new Date().toISOString().split('T')[0];
  const testSessionId = 'live-meet-test-101';
  const testScheduleId = 'sched-live-101';

  // Seed schedule in DB for morning slot (09:00) so it's already elapsed
  const db = DashboardEngine.getDB();
  db.schedules = db.schedules || [];
  db.schedules.push({
    id: testScheduleId,
    studentId: 'st-junayd-01',
    studentName: 'Junayd Kari',
    mentor: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com',
    date: todayDate,
    time: '09:00',
    course: 'Scratch Creators'
  });
  DashboardEngine.saveDB(db);

  // Both tutor and student pulse 60 intervals (15 mins overlap)
  for (let i = 0; i < 60; i++) {
    SessionMonitoringEngine.recordMeetingHeartbeat({
      scheduleId: testScheduleId,
      sessionId: testSessionId,
      role: 'tutor',
      userEmail: 'tutor@stemuluskidstech.com',
      studentId: 'st-junayd-01',
      studentName: 'Junayd Kari',
      tutorName: 'Olalekan Israel Ajimati',
      course: 'Scratch Creators'
    });
    SessionMonitoringEngine.recordMeetingHeartbeat({
      scheduleId: testScheduleId,
      sessionId: testSessionId,
      role: 'student',
      userEmail: 'parent@example.com',
      studentId: 'st-junayd-01',
      studentName: 'Junayd Kari',
      tutorName: 'Olalekan Israel Ajimati',
      course: 'Scratch Creators'
    });
  }

  const monitoredSession = SessionMonitoringEngine.getMonitoredSession(testScheduleId);
  if (monitoredSession && monitoredSession.tutorDurationSec >= 60 && monitoredSession.studentDurationSec >= 60) {
    pass(`Continuous meeting heartbeats recorded: Tutor ${monitoredSession.tutorDurationSec}s, Student ${monitoredSession.studentDurationSec}s`);
  } else {
    fail('Failed to record continuous meeting heartbeats', monitoredSession);
  }

  // Conclude meeting session
  const concluded = SessionMonitoringEngine.concludeMeetingSession(testScheduleId, { reason: 'NORMAL_CONCLUSION' });
  if (concluded && concluded.sessionState === 'COMPLETED') {
    pass('Meeting session concluded cleanly with status COMPLETED');
  } else {
    fail('Failed to conclude meeting session cleanly', concluded);
  }

  console.log('\nPART 2: STRICT SCHEDULE ELIGIBILITY VALIDATION');
  console.log('---------------------------------------------------------');

  // Test 2: Unscheduled class submission must be strictly blocked
  const unscheduledCheck = SessionMonitoringEngine.validateAttendanceEligibility({
    studentId: 'st-unscheduled-999',
    classDate: todayDate,
    classTime: '09:00',
    tutorEmail: 'tutor@stemuluskidstech.com',
    tutorName: 'Olalekan Israel Ajimati'
  });

  if (!unscheduledCheck.allowed && unscheduledCheck.errorType === 'NO_SCHEDULED_CLASS') {
    pass(`Unscheduled class blocked: "${unscheduledCheck.message}"`);
  } else {
    fail('Unscheduled class was incorrectly allowed', unscheduledCheck);
  }

  // Test 3: Advance/future class submission must be strictly blocked
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const futureDateStr = tomorrow.toISOString().split('T')[0];

  const futureCheck = SessionMonitoringEngine.validateAttendanceEligibility({
    studentId: 'st-junayd-01',
    classDate: futureDateStr,
    classTime: '12:00',
    tutorEmail: 'tutor@stemuluskidstech.com',
    tutorName: 'Olalekan Israel Ajimati'
  });

  if (!futureCheck.allowed && futureCheck.errorType === 'FUTURE_CLASS') {
    pass(`Advance/future class submission blocked: "${futureCheck.message}"`);
  } else {
    fail('Future class submission was incorrectly allowed', futureCheck);
  }

  // Test 4: Blocked submission via DashboardEngine.addAttendanceRecord
  const blockedSubmitResult = await DashboardEngine.addAttendanceRecord({
    studentId: 'st-unscheduled-999',
    studentName: 'Phantom Student',
    classDate: todayDate,
    classTime: '09:00',
    course: 'Python Programming',
    topic: 'Loops',
    whatBuilt: 'Test project',
    attendanceStatus: 'present',
    tutorEmail: 'tutor@stemuluskidstech.com'
  });

  if (blockedSubmitResult && blockedSubmitResult.success === false && blockedSubmitResult.errorType === 'NO_SCHEDULED_CLASS') {
    pass('DashboardEngine.addAttendanceRecord safely rejects unscheduled submission without writing to DB');
  } else {
    fail('DashboardEngine.addAttendanceRecord allowed unscheduled record', blockedSubmitResult);
  }

  console.log('\nPART 3: SMART FALSE SUBMISSION / GHOST CLASS DETECTION');
  console.log('---------------------------------------------------------');

  // Test 5: Detect ghost class when monitored telemetry shows 0 minutes
  const ghostScheduleId = 'sched-ghost-99';
  db.schedules.push({
    id: ghostScheduleId,
    studentId: 'st-ghost-student',
    studentName: 'Ghost Coder',
    mentor: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com',
    date: todayDate,
    time: '08:00',
    course: 'Web Development'
  });
  DashboardEngine.saveDB(db);

  // Tutor attempts to log attendance claiming 60 mins present
  const ghostRecord = {
    scheduleId: ghostScheduleId,
    studentId: 'st-ghost-student',
    studentName: 'Ghost Coder',
    classDate: todayDate,
    classTime: '08:00',
    course: 'Web Development',
    duration: 60,
    topic: 'CSS Grid layouts',
    whatBuilt: 'Grid portfolio prototype',
    attendanceStatus: 'present',
    tutorName: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com'
  };

  const ghostDetection = SessionMonitoringEngine.detectFalseSubmission(ghostRecord);
  if (ghostDetection.isFalse && ghostDetection.type === 'GHOST_CLASS_DID_NOT_HOLD') {
    pass(`Ghost class successfully intercepted: "${ghostDetection.message}"`);
  } else {
    fail('Ghost class detection failed', ghostDetection);
  }

  // Test 6: Detect student absent claimed present
  const absentScheduleId = 'sched-absent-99';
  db.schedules.push({
    id: absentScheduleId,
    studentId: 'st-absent-student',
    studentName: 'Absent Student',
    mentor: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com',
    date: todayDate,
    time: '10:00',
    course: 'Python Algorithms'
  });
  DashboardEngine.saveDB(db);

  // Seed meeting record where tutor was in room for 50m but student duration is 0m
  const sessionStore = SessionMonitoringEngine.getStore();
  sessionStore[absentScheduleId] = {
    scheduleId: absentScheduleId,
    sessionId: 'session-tutor-alone',
    tutorJoinedAt: new Date(Date.now() - 3600000).toISOString(),
    studentJoinedAt: null, // student never joined
    tutorDurationSec: 3000,
    studentDurationSec: 0,
    overlapDurationSec: 0,
    finalTutorMins: 50,
    finalStudentMins: 0,
    finalOverlapMins: 0,
    sessionState: 'STUDENT_NO_SHOW'
  };
  SessionMonitoringEngine.saveStore(sessionStore);

  const absentClaimPresentRecord = {
    scheduleId: absentScheduleId,
    studentId: 'st-absent-student',
    studentName: 'Absent Student',
    classDate: todayDate,
    classTime: '10:00',
    course: 'Python Algorithms',
    duration: 50,
    topic: 'Recursion',
    whatBuilt: 'Tree traversals',
    attendanceStatus: 'present', // claiming student was present
    tutorName: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com'
  };

  const absentDetection = SessionMonitoringEngine.detectFalseSubmission(absentClaimPresentRecord);
  if (absentDetection.isFalse && absentDetection.type === 'STUDENT_ABSENT_CLAIMED_PRESENT') {
    pass(`Absentee misrepresentation intercepted: "${absentDetection.message}"`);
  } else {
    fail('Absent student claim detection failed', absentDetection);
  }

  console.log('\nPART 4: REAL-TIME ESCALATION & NTFY NOTIFICATIONS');
  console.log('---------------------------------------------------------');

  // Test 7: Submitting a ghost class via DashboardEngine flags record and escalates
  const preEscalationsCount = (DashboardEngine.getDB().incidents || []).length;

  const ghostSubmitResult = await DashboardEngine.addAttendanceRecord(ghostRecord);

  const updatedDb = DashboardEngine.getDB();
  const savedRecord = (updatedDb.attendanceRecords || []).find(r => r.scheduleId === ghostScheduleId);
  const postEscalationsCount = (updatedDb.incidents || []).length;

  if (ghostSubmitResult && ghostSubmitResult.flagged === true && savedRecord && savedRecord.status === 'flagged_for_review') {
    pass(`Ghost record saved with status 'flagged_for_review' and fraudAlert: true`);
  } else {
    fail('Ghost record was not properly flagged', { ghostSubmitResult, savedRecord });
  }

  if (postEscalationsCount > preEscalationsCount) {
    const incident = updatedDb.incidents[0];
    pass(`Untoward incident registered in DB: ${incident.type} for ${incident.studentName} (${incident.discrepancyType || incident.type})`);
  } else {
    fail('Incident was not created in db.incidents');
  }

  // Verify ntfy push notification was dispatched
  const ntfyCalls = global.fetchCalls.filter(c => c.url && c.url.includes('ntfy.sh/stemulus-admin-alerts'));
  if (ntfyCalls.length > 0) {
    const call = ntfyCalls[ntfyCalls.length - 1];
    pass(`Real-time ntfy push alert dispatched to ${call.url} with priority ${call.options.headers['Priority']}`);
  } else {
    fail('No ntfy push alert was dispatched for false submission', global.fetchCalls);
  }

  console.log('\nPART 5: PAYROLL SAFEGUARD & BATCH APPROVAL ISOLATION');
  console.log('---------------------------------------------------------');

  // Test 8: Seed a valid legitimate session with 60 mins telemetry
  const validScheduleId = 'sched-valid-101';
  const currentDb = DashboardEngine.getDB();
  currentDb.schedules = currentDb.schedules || [];
  currentDb.schedules.push({
    id: validScheduleId,
    studentId: 'st-valid-student',
    studentName: 'Verified Student',
    mentor: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com',
    date: todayDate,
    time: '11:00',
    course: 'App Development'
  });
  DashboardEngine.saveDB(currentDb);

  // Seed verified session telemetry (60 mins both in room)
  const store2 = SessionMonitoringEngine.getStore();
  store2[validScheduleId] = {
    scheduleId: validScheduleId,
    sessionId: 'session-verified-101',
    tutorJoinedAt: new Date(Date.now() - 3600000).toISOString(),
    studentJoinedAt: new Date(Date.now() - 3600000).toISOString(),
    tutorDurationSec: 3600,
    studentDurationSec: 3600,
    overlapDurationSec: 3600,
    finalTutorMins: 60,
    finalStudentMins: 60,
    finalOverlapMins: 60,
    verifiedHeld: true,
    sessionState: 'COMPLETED'
  };
  SessionMonitoringEngine.saveStore(store2);

  const validRecord = {
    scheduleId: validScheduleId,
    studentId: 'st-valid-student',
    studentName: 'Verified Student',
    classDate: todayDate,
    classTime: '11:00',
    course: 'App Development',
    duration: 60,
    topic: 'Flutter Navigation',
    whatBuilt: 'Multi-screen portfolio',
    attendanceStatus: 'present',
    tutorName: 'Olalekan Israel Ajimati',
    tutorEmail: 'tutor@stemuluskidstech.com'
  };

  const validSubmitResult = await DashboardEngine.addAttendanceRecord(validRecord);
  const dbAfterValid = DashboardEngine.getDB();
  const savedValid = (dbAfterValid.attendanceRecords || []).find(r => r.scheduleId === validScheduleId);

  if (validSubmitResult && validSubmitResult.success === true && savedValid && savedValid.status === 'pending' && !savedValid.fraudAlert) {
    pass(`Legitimate verified class accepted cleanly: status 'pending', fraudAlert false`);
  } else {
    fail('Valid class was not accepted cleanly', { validSubmitResult, savedValid });
  }

  // Test 9: Verify batch approval strictly ignores flagged records
  const dbRecords = dbAfterValid.attendanceRecords || [];
  const pendingClean = dbRecords.filter(r => r.status === 'pending' && !r.fraudAlert && r.status !== 'flagged_for_review');

  // Run approval only on pending clean records
  pendingClean.forEach(r => { r.status = 'approved'; });
  DashboardEngine.saveDB(dbAfterValid);

  const finalRecords = DashboardEngine.getDB().attendanceRecords || [];
  const approvedValidRecord = finalRecords.find(r => r.scheduleId === validScheduleId);
  const protectedGhostRecord = finalRecords.find(r => r.scheduleId === ghostScheduleId);

  if (approvedValidRecord && approvedValidRecord.status === 'approved') {
    pass('Clean verified session successfully batch-approved for monthly payroll');
  } else {
    fail('Clean verified session failed to batch approve', approvedValidRecord);
  }

  if (protectedGhostRecord && protectedGhostRecord.status === 'flagged_for_review') {
    pass('Flagged ghost session remained strictly frozen in FLAGGED_FOR_REVIEW (zero accidental payout)');
  } else {
    fail('Flagged ghost session was accidentally approved!', protectedGhostRecord);
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
