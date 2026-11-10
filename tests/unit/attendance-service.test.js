import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAttendanceRecords,
  calculateMonthlySessionTarget,
  addAttendanceRecord,
  updateAttendanceStatus,
  getOverdueAttendance,
  checkDuplicateAttendance
} from '../../src/features/attendance/attendance-service.js';

describe('Attendance & Class Management Feature Service Suite', () => {
  it('getAttendanceRecords retrieves records and filters by tutor identity', () => {
    const db = {
      attendanceRecords: [
        { id: 'att-1', tutorEmail: 'kemi@stemuluskidstech.com', tutorName: 'Kemi Ade' },
        { id: 'att-2', tutorEmail: 'tunde@stemuluskidstech.com', tutorName: 'Tunde Bakare' },
        { id: 'att-3', tutorEmail: 'kemi@stemuluskidstech.com', tutorName: 'Kemi Ade' }
      ]
    };

    assert.equal(getAttendanceRecords(null, db).length, 3);
    assert.equal(getAttendanceRecords('kemi@stemuluskidstech.com', db).length, 2);
    assert.equal(getAttendanceRecords('Tunde Bakare', db).length, 1);
    assert.equal(getAttendanceRecords('nobody@stemuluskidstech.com', db).length, 0);
  });

  it('calculateMonthlySessionTarget computes sessions from recurring schedule days or frequency', () => {
    // Student with explicit booked Monday and Wednesday (e.g. in October 2026)
    const student = {
      id: 'stud-1',
      scheduleDays: ['Monday', 'Wednesday']
    };
    const db = { schedules: [] };
    const target = calculateMonthlySessionTarget(student, '2026-10-01', db);
    // In October 2026, Mondays: 5, 12, 19, 26 (4); Wednesdays: 7, 14, 21, 28 (4); Total = 8
    assert.equal(target, 8);

    // Fallback frequency student (weeklyFrequency 1 -> Saturday = 5 Saturdays in Oct 2026)
    const freqStudent = {
      id: 'stud-2',
      weeklyFrequency: 1
    };
    const freqTarget = calculateMonthlySessionTarget(freqStudent, '2026-10-01', db);
    assert.equal(freqTarget, 5);

    // 3x weekly frequency student (Mon, Wed, Fri in Oct 2026: 4 Mon + 4 Wed + 5 Fri = 13)
    const freq3Student = {
      id: 'stud-3',
      weeklyFrequency: 3
    };
    assert.equal(calculateMonthlySessionTarget(freq3Student, '2026-10-01', db), 13);

    // 4x weekly frequency student (Tue, Wed, Sat, Sun in Oct 2026: 4 Tue + 4 Wed + 5 Sat + 4 Sun = 17)
    const freq4Student = {
      id: 'stud-4',
      weeklyFrequency: 4
    };
    assert.equal(calculateMonthlySessionTarget(freq4Student, '2026-10-01', db), 17);

    // Explicit monthlyTarget override (e.g. 16 sessions/month for 4x/week package)
    const explicitTargetStudent = {
      id: 'stud-5',
      monthlyTarget: 16
    };
    assert.equal(calculateMonthlySessionTarget(explicitTargetStudent, '2026-10-01', db), 16);
  });

  it('addAttendanceRecord normalizes aliases, validates fields, and queues admin notification', () => {
    const db = {
      students: [{ id: 's-10', firstName: 'Damilola', lastName: 'Taylor' }],
      attendanceRecords: [],
      notifications: []
    };

    let saved = false;
    const mockStorage = { save: () => { saved = true; } };
    const session = { name: 'Lead Tutor', email: 'tutor@stemuluskidstech.com' };

    const invalid = addAttendanceRecord({ student_id: 's-10' }, db, mockStorage, session);
    assert.equal(invalid.success, false);
    assert.ok(invalid.message.includes('Missing required fields'));

    const validSubmission = {
      student_id: 's-10',
      topic: 'Intro to Python Loops',
      class_date: '2026-10-14',
      class_time: '17:00',
      duration_minutes: '60',
      concept_grasp: 4,
      what_built: 'Multiplication Quiz Engine'
    };

    const res = addAttendanceRecord(validSubmission, db, mockStorage, session);
    assert.equal(res.success, true);
    assert.equal(res.studentId, 's-10');
    assert.equal(res.studentName, 'Damilola Taylor');
    assert.equal(res.tutorName, 'Lead Tutor');
    assert.equal(res.status, 'pending');
    assert.equal(saved, true);
    assert.equal(db.attendanceRecords.length, 1);
    assert.equal(db.notifications.length, 1);
    assert.ok(db.notifications[0].message.includes('Intro to Python Loops'));
  });

  it('updateAttendanceStatus approves record, reconciles schedule, and generates parent notice', () => {
    const db = {
      students: [
        {
          id: 'stud-99',
          firstName: 'Simi',
          lastName: 'Dipe',
          parentEmail: 'parent.simi@example.com',
          monthlyFee: 35000,
          metrics: { attended: 0, total: 8 }
        }
      ],
      schedules: [
        {
          id: 'sch-1',
          studentId: 'stud-99',
          date: '2026-10-15',
          attendanceStatus: 'pending'
        }
      ],
      attendanceRecords: [
        {
          id: 'att-100',
          studentId: 'stud-99',
          studentName: 'Simi Dipe',
          tutorName: 'Amina Lawal',
          classDate: '2026-10-15',
          classTime: '16:00',
          duration: '60',
          topic: 'Building Web Components',
          whatBuilt: 'Responsive Navbar',
          conceptGrasp: 4,
          homeworkAssigned: 'Create a footer with flexbox',
          status: 'pending'
        }
      ],
      progressReports: [],
      notifications: []
    };

    let saved = false;
    const mockStorage = { save: () => { saved = true; } };

    const approved = updateAttendanceStatus('att-100', 'approved', db, mockStorage);
    assert.ok(approved);
    assert.equal(approved.status, 'approved');
    assert.equal(saved, true);

    // Schedule status reconciled to present
    assert.equal(db.schedules[0].attendanceStatus, 'present');
    assert.equal(db.schedules[0].topic, 'Building Web Components');

    // Student attended count incremented
    assert.equal(db.students[0].metrics.attended, 1);

    // Student billing cycle initialized if missing
    assert.ok(db.students[0].billing);
    assert.equal(db.students[0].billing.firstClassDate, '2026-10-15');

    // Progress report logged
    assert.equal(db.progressReports.length, 1);
    assert.equal(db.progressReports[0].studentName, 'Simi Dipe');
    assert.equal(db.progressReports[0].grade, 'A');

    // Parent notification generated
    assert.equal(db.notifications.length, 1);
    assert.equal(db.notifications[0].userEmail, 'parent.simi@example.com');
    assert.ok(db.notifications[0].title.includes('Class Verified: Simi Dipe'));
  });

  it('getOverdueAttendance detects unsubmitted sessions that passed', () => {
    const db = {
      schedules: [
        { id: 's-past', date: '2026-09-01', attendanceStatus: 'pending', studentId: 'st-1', tutorEmail: 'tutor@stemuluskidstech.com' },
        { id: 's-done', date: '2026-09-02', attendanceStatus: 'present', studentId: 'st-2', tutorEmail: 'tutor@stemuluskidstech.com' },
        { id: 's-future', date: '2028-10-01', attendanceStatus: 'pending', studentId: 'st-3', tutorEmail: 'tutor@stemuluskidstech.com' }
      ],
      attendanceRecords: []
    };

    const overdue = getOverdueAttendance('tutor@stemuluskidstech.com', db);
    assert.equal(overdue.length, 1);
    assert.equal(overdue[0].id, 's-past');
  });

  it('checkDuplicateAttendance flags existing submissions on same student and date', () => {
    const db = {
      attendanceRecords: [
        {
          id: 'rec-1',
          studentId: 'st-dup',
          classDate: '2026-10-20',
          classTime: '15:00',
          topic: 'Variables and Functions',
          coursesCovered: ['Python']
        }
      ]
    };

    const check1 = checkDuplicateAttendance('st-dup', '2026-10-20', '15:00', 'Variables and Functions', ['Python'], db);
    assert.equal(check1.has_duplicate, true);
    assert.equal(check1.has_exact_duplicate, true);

    const check2 = checkDuplicateAttendance('st-dup', '2026-10-21', '15:00', 'Variables and Functions', ['Python'], db);
    assert.equal(check2.has_duplicate, false);
    assert.equal(check2.has_exact_duplicate, false);
  });
});
