import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCanonicalWeeklySchedules,
  calculateTutorMonthlyStats,
  getPayrollLedger,
  markPayrollDisbursed,
  batchApproveMonthPayroll,
  calculateTutorPerformance
} from '../../src/features/payroll/payroll-service.js';

describe('Payroll & Faculty Remittance Feature Service Suite', () => {
  it('calculateTutorMonthlyStats deduplicates logs, computes approved hours, and calculates payout', () => {
    const db = {
      tutors: [
        {
          id: 'tut-001',
          name: 'Babajide Sanwo',
          email: 'babajide@stemuluskidstech.com',
          hourlyRate: 30.00
        }
      ],
      users: {},
      attendanceRecords: [
        // Session 1: 60 mins approved
        {
          studentId: 's1',
          studentName: 'Emeka',
          tutorEmail: 'babajide@stemuluskidstech.com',
          classDate: '2026-10-05',
          classTime: '16:00',
          duration: 60,
          status: 'approved'
        },
        // Duplicate session 1 (same student, date, time): must be ignored
        {
          studentId: 's1',
          studentName: 'Emeka',
          tutorEmail: 'babajide@stemuluskidstech.com',
          classDate: '2026-10-05',
          classTime: '16:00',
          duration: 60,
          status: 'approved'
        },
        // Session 2: 90 mins pending
        {
          studentId: 's2',
          studentName: 'Fatima',
          tutorEmail: 'babajide@stemuluskidstech.com',
          classDate: '2026-10-12',
          classTime: '17:00',
          duration: 90,
          status: 'pending'
        },
        // Session in different month: must be ignored
        {
          studentId: 's1',
          studentName: 'Emeka',
          tutorEmail: 'babajide@stemuluskidstech.com',
          classDate: '2026-09-28',
          classTime: '16:00',
          duration: 60,
          status: 'approved'
        }
      ],
      schedules: []
    };

    const stats = calculateTutorMonthlyStats('babajide@stemuluskidstech.com', '2026-10', db);
    assert.equal(stats.totalSessions, 2);
    assert.equal(stats.totalMinutes, 150);
    assert.equal(stats.totalHours, 2.5);
    assert.equal(stats.approvedSessions, 1);
    assert.equal(stats.approvedHours, 1.0);
    assert.equal(stats.pendingReviewSessions, 1);
    assert.equal(stats.approvedPayout, 30.00); // 1.0 hr * $30.00
  });

  it('getPayrollLedger aggregates faculty records and identifies disbursement status', () => {
    const db = {
      tutors: [
        {
          id: 'tut-101',
          name: 'Ngozi Okonjo',
          email: 'ngozi@stemuluskidstech.com',
          hourlyRate: 35.00,
          bankName: 'Zenith Bank',
          accountNumber: '1002003004'
        },
        {
          id: 'tut-102',
          name: 'Wole Soyinka',
          email: 'wole@stemuluskidstech.com',
          hourlyRate: 40.00,
          bankName: 'Access Bank',
          accountNumber: '2003004005'
        }
      ],
      attendanceRecords: [
        {
          tutorEmail: 'ngozi@stemuluskidstech.com',
          classDate: '2026-10-02',
          duration: 60,
          status: 'approved'
        },
        {
          tutorEmail: 'ngozi@stemuluskidstech.com',
          classDate: '2026-10-09',
          duration: 120,
          status: 'approved'
        }
      ],
      payrollDisbursements: []
    };

    const ledger = getPayrollLedger('2026-10', db);
    assert.equal(ledger.month, '2026-10');
    assert.equal(ledger.isDisbursed, false);
    assert.equal(ledger.totalTutors, 2);
    assert.equal(ledger.activePayableTutors, 1);
    assert.equal(ledger.totalVerifiedHours, 3.0);
    assert.equal(ledger.totalGrossPayoutUSD, 105.00); // 3.0 hrs * $35.00

    const ngoziRecord = ledger.disbursements.find(d => d.tutorEmail === 'ngozi@stemuluskidstech.com');
    assert.ok(ngoziRecord);
    assert.equal(ngoziRecord.verifiedHours, 3.0);
    assert.equal(ngoziRecord.grossPayout, 105.00);
    assert.equal(ngoziRecord.status, 'READY_FOR_PAYOUT');

    const woleRecord = ledger.disbursements.find(d => d.tutorEmail === 'wole@stemuluskidstech.com');
    assert.ok(woleRecord);
    assert.equal(woleRecord.verifiedHours, 0);
    assert.equal(woleRecord.status, 'NO_BILLABLE_HOURS');
  });

  it('markPayrollDisbursed records payout and updates status to PAID', () => {
    const db = {
      tutors: [{ id: 'tut-1', email: 'test@stemuluskidstech.com', hourlyRate: 35 }],
      attendanceRecords: [{ tutorEmail: 'test@stemuluskidstech.com', classDate: '2026-10-01', duration: 60, status: 'approved' }],
      payrollDisbursements: []
    };

    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };

    const record = markPayrollDisbursed('2026-10', 'WIRE-CONF-774411', db, mockStorage);
    assert.equal(record.status, 'PAID');
    assert.equal(record.month, '2026-10');
    assert.equal(record.paymentReference, 'WIRE-CONF-774411');
    assert.equal(saved, true);
    assert.equal(db.payrollDisbursements.length, 1);

    // Ledger should now report isDisbursed: true
    const ledger = getPayrollLedger('2026-10', db);
    assert.equal(ledger.isDisbursed, true);
  });

  it('batchApproveMonthPayroll approves all pending sessions for target month', () => {
    const db = {
      attendanceRecords: [
        { id: 'att-1', classDate: '2026-10-02', status: 'pending' },
        { id: 'att-2', classDate: '2026-10-08', status: 'pending' },
        { id: 'att-3', classDate: '2026-10-15', status: 'approved' },
        { id: 'att-4', classDate: '2026-11-01', status: 'pending' } // Different month
      ]
    };

    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };

    const result = batchApproveMonthPayroll('2026-10', db, mockStorage);
    assert.equal(result.success, true);
    assert.equal(result.updatedCount, 2);
    assert.equal(saved, true);

    assert.equal(db.attendanceRecords[0].status, 'approved');
    assert.equal(db.attendanceRecords[1].status, 'approved');
    assert.equal(db.attendanceRecords[2].status, 'approved');
    assert.equal(db.attendanceRecords[3].status, 'pending');
  });

  it('calculateTutorPerformance computes turnaround hours and punctuality tiers accurately', () => {
    const db = {
      attendanceRecords: [
        // On-time submission: class at 16:00, submitted at 18:00 (2 hrs diff)
        {
          tutorEmail: 'punctual@stemuluskidstech.com',
          classDate: '2026-10-01',
          classTime: '16:00',
          timestamp: '2026-10-01T18:00:00.000Z',
          status: 'approved'
        },
        // Late submission: class at 16:00, submitted 30 hours later
        {
          tutorEmail: 'punctual@stemuluskidstech.com',
          classDate: '2026-10-03',
          classTime: '16:00',
          timestamp: '2026-10-04T22:00:00.000Z',
          status: 'approved'
        }
      ]
    };

    const perf = calculateTutorPerformance('punctual@stemuluskidstech.com', db);
    assert.equal(perf.totalSessions, 2);
    assert.equal(perf.approvedSessions, 2);
    assert.equal(perf.onTimeSubmissions, 1);
    assert.equal(perf.onTimeRate, 50);
    assert.equal(perf.fulfillmentTier, 'Tier 3: Needs Review');
    assert.equal(perf.tierColor, 'amber');

    // Exemplary tutor (100% on time)
    const db2 = {
      attendanceRecords: [
        {
          tutorEmail: 'stellar@stemuluskidstech.com',
          classDate: '2026-10-01',
          classTime: '16:00',
          timestamp: '2026-10-01T17:00:00.000Z',
          status: 'approved'
        }
      ]
    };
    const perf2 = calculateTutorPerformance('stellar@stemuluskidstech.com', db2);
    assert.equal(perf2.onTimeRate, 100);
    assert.equal(perf2.fulfillmentTier, 'Tier 1: Exemplary');
    assert.equal(perf2.tierColor, 'emerald');
  });
});
