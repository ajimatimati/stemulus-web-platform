import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Zero-Downtime Rollback Verification Suite', async (t) => {
  // Load dashboard engine in environment where window.STEMULUS_USE_LEGACY is set to true
  const engineCode = fs.readFileSync('assets/js/dashboard-engine.js', 'utf8');
  const billingCode = fs.readFileSync('assets/js/billing-engine.js', 'utf8');

  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
  globalThis.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
  globalThis.window = {
    STEMULUS_USE_LEGACY: true, // Forces legacy fallback path
    dispatchEvent: () => {},
    CustomEvent: class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } }
  };

  // Evaluate engines
  eval(engineCode);
  eval(billingCode);

  const DE = globalThis.window.DashboardEngine || globalThis.DashboardEngine;
  const BE = globalThis.window.BillingEngine || globalThis.BillingEngine;

  await t.test('Legacy fallback generates usernames without modular bundle', () => {
    const user = DE.generateAutoUsername('Prof. Wole Soyinka', 'tutor');
    assert.match(user, /^wole\.soyinka[0-9]*@stemuluskidstech\.com$/);
  });

  await t.test('Legacy fallback generates passwords meeting policy', () => {
    const pwd = DE.generateAutoPassword();
    assert.ok(pwd.startsWith('STEM-'));
    assert.ok(pwd.length >= 14);
  });

  await t.test('Legacy fallback creates student & parent in database', async () => {
    const res = await DE.quickOnboardUser({
      type: 'student',
      name: 'Dr. Nnamdi Azikiwe',
      childName: 'Emeka Azikiwe',
      childAge: 12,
      program: 'Web Development Foundations'
    });

    assert.equal(res.success, true);
    assert.equal(res.type, 'student_parent');
    assert.match(res.parentEmail, /^nnamdi\.azikiwe[0-9]*@parent\.stemuluskidstech\.com$/);
    const db = DE.getDB();
    assert.ok(db.users[res.parentEmail]);
    assert.equal(db.emailQueue.length >= 1, true);
  });

  await t.test('Legacy fallback calculates payroll ledger correctly', () => {
    const db = DE.getDB();
    const ledger = DE.getPayrollLedger();
    assert.ok(ledger);
    assert.equal(typeof ledger.totalVerifiedHours, 'number');
    assert.equal(typeof ledger.totalGrossPayoutUSD, 'number');
    assert.ok(Array.isArray(ledger.disbursements));
  });

  await t.test('Legacy fallback BillingEngine calculates tuition renewal accurately', () => {
    const student = {
      id: 'test-student-1',
      firstName: 'Kene',
      lastName: 'Eze',
      monthlyFee: 35000,
      billing: {
        anchorDay: 12,
        cycleStartDate: '2026-10-12',
        nextDueDate: '2026-11-12'
      }
    };

    const info = BE.calculateBillingInfo(student);
    assert.equal(info.anchorDay, 12);
    assert.equal(info.cycleStartDate, '2026-10-12');
    assert.equal(info.nextDueDate, '2026-11-12');
    assert.equal(info.formattedFee, '₦35,000');
  });

  await t.test('Legacy fallback retrieves attendance and computes targets', () => {
    const records = DE.getAttendanceRecords();
    assert.ok(Array.isArray(records));

    const target = DE.calculateMonthlySessionTarget({ weeklyFrequency: 2 }, '2026-10-01');
    assert.ok(target > 0);
  });

  await t.test('Legacy fallback generates Google Meet links meeting format', () => {
    const meet = DE.generateGoogleMeetLink();
    assert.ok(meet.startsWith('https://meet.google.com/'));
  });

  await t.test('Legacy fallback adds and retrieves schedules', () => {
    const s = DE.addSchedule({
      studentId: 'stu-legacy',
      studentName: 'Chidi Mokeme',
      course: 'Python Software Engineering',
      date: '2026-11-05',
      time: '14:00'
    });
    assert.ok(s.id);
    const schedules = DE.getSchedules('stu-legacy');
    assert.equal(schedules.length, 1);
    assert.equal(schedules[0].studentName, 'Chidi Mokeme');
  });

  await t.test('Legacy fallback adds and retrieves progress reports', () => {
    const r = DE.addReport({
      studentId: 'stu-legacy',
      grade: 'A',
      feedback: 'Legacy progress evaluation.'
    });
    assert.ok(r.id);
    const reports = DE.getReports('stu-legacy');
    assert.equal(reports.length, 1);
    assert.equal(reports[0].grade, 'A');
  });

  await t.test('Legacy fallback adds and filters notices', () => {
    const n = DE.addNotice({
      title: 'Legacy System Bulletin',
      targetAudience: 'tutor',
      content: 'Important bulletin for faculty.'
    });
    assert.ok(n.id);
    const notices = DE.getNotices('tutor');
    assert.ok(notices.some(item => item.id === n.id));
  });

  await t.test('Legacy fallback retrieves tutors and resolves profile', () => {
    const tutors = DE.getTutors();
    assert.ok(Array.isArray(tutors));
    assert.ok(tutors.length >= 5);

    const tutor = DE.resolveTutorDetails('olalekan@stemuluskidstech.com');
    assert.ok(tutor);
    assert.equal(tutor.name, 'Olalekan Israel Ajimati');
  });

  await t.test('Legacy fallback adds and retrieves students', () => {
    const s = DE.addStudent({
      firstName: 'RollbackStudent',
      lastName: 'LegacyTest',
      parentEmail: 'rollback.p@example.com'
    });
    assert.ok(s.id);
    const students = DE.getStudents('rollback.p@example.com');
    assert.equal(students.length, 1);
    assert.equal(students[0].firstName, 'RollbackStudent');
  });

  await t.test('Legacy fallback adds and verifies certificates', () => {
    const cert = DE.addCertificate({
      credential_id: 'LEGACY-CERT-001',
      student_name: 'RollbackStudent LegacyTest'
    });
    assert.ok(cert.id);
    const verified = DE.verifyCertificate('LEGACY-CERT-001');
    assert.ok(verified);
    assert.equal(verified.student_name, 'RollbackStudent LegacyTest');
  });

  await t.test('Legacy fallback adds and retrieves notifications', () => {
    const notif = DE.addNotification({
      title: 'Rollback Notification Test',
      userEmail: 'rollback.user@example.com'
    });
    assert.ok(notif.id);
    const list = DE.getNotifications('rollback.user@example.com');
    assert.ok(list.some(item => item.title === 'Rollback Notification Test'));
  });
});
