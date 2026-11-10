import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TUITION_SETTINGS,
  addMonths,
  resolveFirstClassDate,
  calculateBillingInfo,
  recordPayment,
  generateWhatsAppReminderUrl,
  generateEmailReminderPayload,
  getBillingRoster,
  getDueStudents,
  getSettings,
  updateSettings
} from '../../src/features/tuition/tuition-service.js';

describe('Tuition & Student Billing Feature Service Suite', () => {
  it('addMonths correctly adds calendar months with anchor day clamping', () => {
    // Normal 1 month addition
    assert.equal(addMonths('2026-01-15', 1), '2026-02-15');

    // Clamping on short months (Jan 31 + 1 mo = Feb 28 in non-leap year)
    assert.equal(addMonths('2026-01-31', 1), '2026-02-28');

    // Preferred anchor day preservation (Feb 28 + 1 mo with anchor 31 = Mar 31)
    assert.equal(addMonths('2026-02-28', 1, 31), '2026-03-31');

    // Multi-month addition with year boundary crossing
    assert.equal(addMonths('2026-11-10', 3), '2027-02-10');

    // Invalid inputs return empty string
    assert.equal(addMonths(''), '');
    assert.equal(addMonths(null), '');
    assert.equal(addMonths('invalid-date'), '');
  });

  it('resolveFirstClassDate resolves dates using prioritized fallback chain', () => {
    // 1. Explicit billing firstClassDate
    const s1 = { id: 's1', billing: { firstClassDate: '2026-09-01' }, firstClassDate: '2026-09-15' };
    assert.equal(resolveFirstClassDate(s1), '2026-09-01');

    // 2. Direct student.firstClassDate
    const s2 = { id: 's2', firstClassDate: '2026-09-15' };
    assert.equal(resolveFirstClassDate(s2), '2026-09-15');

    // 3. Approved attendance records
    const s3 = { id: 's3', firstName: 'Ada', lastName: 'Lovelace' };
    const attendanceRecords = [
      { studentId: 's3', classDate: '2026-09-20', status: 'approved' },
      { studentId: 's3', classDate: '2026-09-10', status: 'approved' },
      { studentId: 's3', classDate: '2026-09-05', status: 'pending' } // pending not considered
    ];
    assert.equal(resolveFirstClassDate(s3, attendanceRecords, []), '2026-09-10');

    // 4. Earliest schedule
    const s4 = { id: 's4', firstName: 'Charles', lastName: 'Babbage' };
    const schedules = [
      { studentId: 's4', date: '2026-09-18' },
      { studentId: 's4', date: '2026-09-12' }
    ];
    assert.equal(resolveFirstClassDate(s4, [], schedules), '2026-09-12');

    // 5. Fallback to createdAt
    const s5 = { id: 's5', createdAt: '2026-08-01T10:00:00Z' };
    assert.equal(resolveFirstClassDate(s5, [], []), '2026-08-01');
  });

  it('calculateBillingInfo computes accurate renewal dates, diff days, and statuses', () => {
    const student = {
      id: 'stud-101',
      firstName: 'Tobi',
      lastName: 'Amusan',
      monthlyFee: 40000,
      billing: {
        anchorDay: 15,
        cycleStartDate: '2026-10-15',
        nextDueDate: '2026-11-15',
        history: []
      }
    };

    const info = calculateBillingInfo(student);
    assert.equal(info.anchorDay, 15);
    assert.equal(info.cycleStartDate, '2026-10-15');
    assert.equal(info.nextDueDate, '2026-11-15');
    assert.equal(info.monthlyFee, 40000);
    assert.equal(info.formattedFee, '₦40,000');
    assert.equal(typeof info.daysRemaining, 'number');

    // Overdue student
    const overdueStudent = {
      id: 'stud-102',
      billing: {
        cycleStartDate: '2026-08-01',
        nextDueDate: '2026-09-01'
      }
    };
    const overdueInfo = calculateBillingInfo(overdueStudent);
    assert.equal(overdueInfo.status, 'overdue');
    assert.ok(overdueInfo.daysRemaining < 0);
  });

  it('recordPayment idempotently advances billing cycle and archives receipt', () => {
    const db = {
      students: [
        {
          id: 'stud-201',
          firstName: 'Chidi',
          lastName: 'Mokeme',
          parentEmail: 'parent.chidi@example.com',
          billing: {
            anchorDay: 10,
            cycleStartDate: '2026-10-10',
            nextDueDate: '2026-11-10',
            monthlyFee: 35000,
            history: []
          }
        }
      ],
      notifications: []
    };

    let saved = false;
    const mockStorage = {
      save: (d) => { saved = true; }
    };

    const paymentData = {
      amount: 35000,
      reference: 'TXN-998877',
      date: '2026-11-09',
      method: 'Bank Transfer',
      notes: 'November Tuition Settlement',
      recordedBy: 'Admin Director'
    };

    const result = recordPayment('stud-201', paymentData, db, mockStorage);
    assert.equal(result.success, true);
    assert.equal(result.newNextDue, '2026-12-10');
    assert.equal(saved, true);

    const updatedStudent = db.students[0];
    assert.equal(updatedStudent.billing.cycleStartDate, '2026-11-10');
    assert.equal(updatedStudent.billing.nextDueDate, '2026-12-10');
    assert.equal(updatedStudent.billing.history.length, 1);
    assert.equal(updatedStudent.billing.history[0].reference, 'TXN-998877');

    // Parent notification generated
    assert.equal(db.notifications.length, 1);
    assert.equal(db.notifications[0].userEmail, 'parent.chidi@example.com');
    assert.ok(db.notifications[0].message.includes('TXN-998877') || db.notifications[0].message.includes('2026-12-10'));

    // Idempotency: Duplicate payment reference must be rejected
    const dupResult = recordPayment('stud-201', paymentData, db, mockStorage);
    assert.equal(dupResult.success, false);
    assert.ok(dupResult.message.includes('already been recorded'));
  });

  it('generateWhatsAppReminderUrl creates valid encoded communication links', () => {
    const student = {
      firstName: 'Kamsi',
      lastName: 'Okafor',
      parentName: 'Mrs. Okafor',
      parentPhone: '08031234567',
      billing: {
        nextDueDate: '2026-11-20',
        monthlyFee: 35000
      }
    };

    const url = generateWhatsAppReminderUrl(student);
    assert.ok(url.startsWith('https://wa.me/2348031234567?text='));
    assert.ok(url.includes('Kamsi'));
    assert.ok(url.includes('2026-11-20'));
  });

  it('generateEmailReminderPayload formats structured email notification data', () => {
    const student = {
      firstName: 'Zainab',
      lastName: 'Bello',
      parentName: 'Alhaji Bello',
      parentEmail: 'bello@example.com',
      program: 'Python AI Masters',
      billing: {
        nextDueDate: '2026-11-15',
        monthlyFee: 35000
      }
    };

    const payload = generateEmailReminderPayload(student);
    assert.equal(payload.type, 'tuition-reminder-parent');
    assert.equal(payload.to, 'bello@example.com');
    assert.equal(payload.data.studentName, 'Zainab Bello');
    assert.equal(payload.data.dueDate, '2026-11-15');
    assert.equal(payload.data.bankName, 'Wema Nigeria');
  });

  it('getBillingRoster and getDueStudents filter and sort active student ledgers', () => {
    const db = {
      students: [
        {
          id: 's-active-1',
          status: 'active',
          billing: { cycleStartDate: '2026-08-01', nextDueDate: '2026-09-01' } // overdue
        },
        {
          id: 's-withdrawn',
          status: 'withdrawn',
          billing: { cycleStartDate: '2026-08-01', nextDueDate: '2026-09-01' } // should be ignored
        },
        {
          id: 's-active-2',
          status: 'active',
          billing: { cycleStartDate: '2026-10-01', nextDueDate: '2027-10-01' } // far future
        }
      ]
    };

    const roster = getBillingRoster(db);
    assert.equal(roster.length, 2);
    // Overdue student must be first due to smallest daysRemaining
    assert.equal(roster[0].student.id, 's-active-1');

    const due = getDueStudents(db);
    assert.equal(due.length, 1);
    assert.equal(due[0].student.id, 's-active-1');
  });

  it('getSettings and updateSettings handle legacy bank migration and persistence', () => {
    const legacyDB = {
      billingSettings: {
        accountNumber: '1853492019' // Legacy account number that must upgrade
      }
    };

    const upgraded = getSettings(legacyDB);
    assert.equal(upgraded.accountNumber, '0128062292');
    assert.equal(upgraded.usdAccountNumber, '0622219817');

    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };

    const updated = updateSettings({ defaultMonthlyFee: 45000 }, legacyDB, mockStorage);
    assert.equal(updated.defaultMonthlyFee, 45000);
    assert.equal(saved, true);
  });
});
