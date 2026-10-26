const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('STEMULUS AUTOMATED TEST SUITE: PRICING, SMART DETECTOR & QUEUE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function main() {
  // ────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: WEBSITE PRICING REALIGNMENT (programs.html)
  // ────────────────────────────────────────────────────────────────────────
  const programsHtml = fs.readFileSync(path.join(__dirname, '../programs.html'), 'utf8');

  await runTest('1.1 programs.html domestic beginner rate is ₦48,000', () => {
    assert(programsHtml.includes('₦48,000') || programsHtml.includes('48,000'), 'Beginner rate 48,000 missing');
  });

  await runTest('1.2 programs.html domestic intermediate rate is ₦75,000', () => {
    assert(programsHtml.includes('₦75,000') || programsHtml.includes('75,000'), 'Intermediate rate 75,000 missing');
  });

  await runTest('1.3 programs.html domestic advanced rate is ₦120,000', () => {
    assert(programsHtml.includes('₦120,000') || programsHtml.includes('120,000'), 'Advanced rate 120,000 missing');
  });

  await runTest('1.4 programs.html international Tier 2 is anchored to £80 parallel', () => {
    assert(programsHtml.includes('£80') || programsHtml.includes('80/mo'), 'International £80 anchor missing');
  });

  await runTest('1.5 programs.html contains executive global admissions context badge', () => {
    assert(programsHtml.includes('Global Admissions:') && programsHtml.includes('timezone accommodation'), 'Global admissions notice missing');
  });

  // ────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: PEARL BABALOLA & DATABASE LEDGER (dashboard-engine.js)
  // ────────────────────────────────────────────────────────────────────────
  const dashEngineCode = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard-engine.js'), 'utf8');

  const sStart = dashEngineCode.indexOf('"students": [');
  let sEnd = -1;
  let openCount = 0;
  for (let i = sStart + '"students": '.length; i < dashEngineCode.length; i++) {
    if (dashEngineCode[i] === '[') openCount++;
    else if (dashEngineCode[i] === ']') {
      openCount--;
      if (openCount === 0) {
        sEnd = i + 1;
        break;
      }
    }
  }
  const students = JSON.parse(dashEngineCode.slice(sStart + '"students": '.length, sEnd));

  await runTest('2.1 Pearl Babalola has age 13 and intermediate tier', () => {
    const pearl = students.find(s => s.id === 'std-1007-r4cv' || (s.firstName === 'Babalola' && s.lastName && s.lastName.includes('Pearl')));
    assert(pearl, 'Pearl Babalola not found in DEFAULT_DATA.students');
    assert.strictEqual(pearl.age, 13, `Expected age 13, got ${pearl.age}`);
    assert.strictEqual(pearl.tier, 'intermediate', `Expected tier intermediate, got ${pearl.tier}`);
  });

  await runTest('2.2 Pearl Babalola has ₦75,000 fee, ₦37,500 October bridge, and ₦112,500 realignment', () => {
    const pearl = students.find(s => s.id === 'std-1007-r4cv');
    assert(pearl.billing, 'Pearl billing missing');
    assert.strictEqual(pearl.billing.monthlyFee, 75000, `Monthly fee ${pearl.billing.monthlyFee}`);
    assert.strictEqual(pearl.billing.octoberBridge, 37500, `October bridge ${pearl.billing.octoberBridge}`);
    assert.strictEqual(pearl.billing.combinedRealignment, 112500, `Combined realignment ${pearl.billing.combinedRealignment}`);
  });

  await runTest('2.3 Pearl Babalola has Fire Progression Badge unlocked', () => {
    const pearl = students.find(s => s.id === 'std-1007-r4cv');
    assert.strictEqual(pearl.badgeLevel, 'Fire Master', `Badge level ${pearl.badgeLevel}`);
    assert.strictEqual(pearl.classesAttended, 27, `Attended ${pearl.classesAttended}`);
    assert(pearl.earnedBadges && pearl.earnedBadges.length >= 6, 'Earned badges missing or incomplete');
  });

  await runTest('2.4 Joshua Ogba is recorded as paid through 2026-12-31 with 14 classes', () => {
    const joshua = students.find(s => s.id === 'std-1013-jogb');
    assert(joshua, 'Joshua Ogba not found');
    assert.strictEqual(joshua.classesAttended, 14, `Classes attended ${joshua.classesAttended}`);
    assert.strictEqual(joshua.billing.paidThrough, '2026-12-31', `Paid through ${joshua.billing.paidThrough}`);
  });

  await runTest('2.5 Gbolade Okesanjo has physical sessions and payment due Nov 4, 2026', () => {
    const gbolade = students.find(s => s.id === 'std-1012-goke');
    assert(gbolade, 'Gbolade Okesanjo not found');
    assert.strictEqual(gbolade.billing.nextDueDate, '2026-11-04', `Due date ${gbolade.billing.nextDueDate}`);
  });

  // ────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: SMART OPERATIONAL DETECTOR ENGINE
  // ────────────────────────────────────────────────────────────────────────
  const detectorCode = fs.readFileSync(path.join(__dirname, '../assets/js/admin-smart-detector.js'), 'utf8');

  const mockLocalStorage = {};
  global.localStorage = {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  };

  const mockDB = {
    students: JSON.parse(JSON.stringify(students)),
    mentors: [
      {
        id: 'mentor-1',
        name: 'Tola Tosin Ayanleke',
        email: 'tonetbod@gmail.com',
        dateOfBirth: '1995-10-28',
        phone: '+2348123456789'
      }
    ],
    emailQueue: [],
    scheduleRequests: [
      {
        id: 'req-test-1',
        studentName: 'Babalola Oluwadunmininu Pearl',
        parentEmail: 'adewale.babalola@yahoo.com',
        parentName: 'Mr. & Mrs. Babalola',
        tutorName: 'Tola Tosin Ayanleke',
        course: 'Python Programming',
        date: '2026-10-31',
        time: '11:00',
        meetLink: 'https://meet.google.com/yre-naci-zmp'
      }
    ]
  };

  global.DashboardEngine = {
    getDB: () => mockDB,
    saveDB: (db) => { Object.assign(mockDB, db); },
    getStudents: () => mockDB.students,
    getMentors: () => mockDB.mentors
  };

  global.window = {
    dispatchEvent: () => {},
    addEventListener: () => {}
  };
  global.document = {
    getElementById: () => null,
    createElement: () => ({ setAttribute: () => {}, classList: { add: () => {} } })
  };
  global.fetch = async (url, opts) => {
    return { ok: true, json: async () => ({ ok: true }), text: async () => 'OK' };
  };

  eval(detectorCode);
  const Detector = global.window.AdminSmartDetector;

  await runTest('3.1 AdminSmartDetector is defined and exposes core methods', () => {
    assert(Detector, 'AdminSmartDetector not defined');
    assert(typeof Detector.scanPaymentCycles === 'function', 'scanPaymentCycles missing');
    assert(typeof Detector.scanBirthdayCelebrations === 'function', 'scanBirthdayCelebrations missing');
    assert(typeof Detector.scanScheduleAdjustments === 'function', 'scanScheduleAdjustments missing');
    assert(typeof Detector.scanTimezoneShifts === 'function', 'scanTimezoneShifts missing');
    assert(typeof Detector.stageQueuedEmail === 'function', 'stageQueuedEmail missing');
  });

  await runTest('3.2 scanPaymentCycles queues Pearl Babalola realignment draft', async () => {
    mockDB.emailQueue = [];
    Detector.clearAlertsLog();
    const queued = await Detector.scanPaymentCycles();
    assert(queued >= 1, `Expected at least 1 queued payment draft, got ${queued}`);

    const pearlDraft = mockDB.emailQueue.find(e => e.type === 'billing' && (e.studentName.includes('Pearl') || e.studentId === 'std-1007-r4cv'));
    assert(pearlDraft, 'Pearl realignment draft not found in queue');
    assert.strictEqual(pearlDraft.status, 'pending', 'Draft status MUST be pending');
    assert(pearlDraft.htmlPreview.includes('₦112,500'), 'Realignment total ₦112,500 missing from draft');
    assert(pearlDraft.htmlPreview.includes('₦37,500'), 'Bridge ₦37,500 missing from draft');
    assert(pearlDraft.htmlPreview.includes('₦75,000'), 'Cycle ₦75,000 missing from draft');
    assert(pearlDraft.htmlPreview.includes('0128062292'), 'Wema NGN account missing from draft');
  });

  await runTest('3.3 scanPaymentCycles ignores Joshua Ogba and excluded students', async () => {
    const joshuaDraft = mockDB.emailQueue.find(e => e.studentName && e.studentName.toLowerCase().includes('joshua ogba'));
    assert(!joshuaDraft, 'Joshua Ogba should NOT have a payment demand in queue');

    const djokaDraft = mockDB.emailQueue.find(e => e.studentName && e.studentName.toLowerCase().includes('djoka'));
    assert(!djokaDraft, 'David Djoka should be excluded');

    const junaydDraft = mockDB.emailQueue.find(e => e.studentName && e.studentName.toLowerCase().includes('junayd'));
    assert(!junaydDraft, 'Junayd should be excluded');
  });

  await runTest('3.4 scanBirthdayCelebrations identifies upcoming birthdays within 7 days', async () => {
    const queued = await Detector.scanBirthdayCelebrations();
    const bdayDraft = mockDB.emailQueue.find(e => e.type === 'birthday');
    assert(bdayDraft, 'Birthday greeting draft not found');
    assert.strictEqual(bdayDraft.status, 'pending', 'Birthday status must be pending');
    assert(bdayDraft.subject.includes('Happy Birthday'), 'Subject should wish happy birthday');
  });

  await runTest('3.5 scanScheduleAdjustments queues schedule update notice', async () => {
    const queued = await Detector.scanScheduleAdjustments();
    const schedDraft = mockDB.emailQueue.find(e => e.type === 'schedule');
    assert(schedDraft, 'Schedule adjustment draft not found');
    assert.strictEqual(schedDraft.status, 'pending', 'Schedule status must be pending');
    assert(schedDraft.htmlPreview.includes('yre-naci-zmp'), 'Meet link missing from draft');
  });

  await runTest('3.6 Strict Zero-Autonomous Dispatch Rule: NO drafts marked sent', () => {
    const nonPending = mockDB.emailQueue.filter(e => e.status !== 'pending');
    assert.strictEqual(nonPending.length, 0, `Found ${nonPending.length} non-pending items in queue! Zero-autonomous rule violated.`);
  });

  await runTest('3.7 Director Voice: Zero em-dashes across all queued templates', () => {
    mockDB.emailQueue.forEach(item => {
      assert(!item.htmlPreview.includes('—'), `Em-dash (—) found in ${item.type} email preview!`);
      assert(!item.htmlPreview.includes('--'), `Double-dash (--) found in ${item.type} email preview!`);
      assert(!item.subject.includes('—'), `Em-dash (—) found in subject: ${item.subject}`);
      assert(!item.subject.includes('--'), `Double-dash (--) found in subject: ${item.subject}`);
    });
  });

  await runTest('3.8 Deduplication Guard: Second scan does not duplicate queue entries', async () => {
    const countBefore = mockDB.emailQueue.length;
    await Detector.scanAll(false);
    const countAfter = mockDB.emailQueue.length;
    assert.strictEqual(countAfter, countBefore, `Queue count grew from ${countBefore} to ${countAfter} on second scan without new events!`);
  });

  // ────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: ADMIN ENGINE & DASHBOARD WIRING
  // ────────────────────────────────────────────────────────────────────────
  const adminHtml = fs.readFileSync(path.join(__dirname, '../admin-dashboard.html'), 'utf8');
  const adminEngineCode = fs.readFileSync(path.join(__dirname, '../assets/js/admin-engine.js'), 'utf8');

  await runTest('4.1 admin-dashboard.html loads admin-smart-detector.min.js', () => {
    assert(adminHtml.includes('admin-smart-detector.min.js'), 'admin-smart-detector.min.js script tag missing');
  });

  await runTest('4.2 admin-engine.js includes billing, birthday, schedule, timezone in typeLabels', () => {
    assert(adminEngineCode.includes("billing: 'Tuition Renewal'"), 'billing typeLabel missing');
    assert(adminEngineCode.includes("birthday: 'Birthday Greeting'"), 'birthday typeLabel missing');
    assert(adminEngineCode.includes("schedule: 'Schedule Notice'"), 'schedule typeLabel missing');
    assert(adminEngineCode.includes("timezone: 'Timezone Advisory'"), 'timezone typeLabel missing');
  });

  await runTest('4.3 admin-engine.js has editQueuedEmail and sendQueuedEmail handlers', () => {
    assert(adminEngineCode.includes('window.editQueuedEmail'), 'editQueuedEmail missing');
    assert(adminEngineCode.includes('window.sendQueuedEmail'), 'sendQueuedEmail missing');
  });

  // ────────────────────────────────────────────────────────────────────────
  // TEST RESULTS SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round(passedTests / totalTests * 100)}%)`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
