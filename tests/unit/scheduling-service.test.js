import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDayOfWeek,
  timeToMinutes,
  reconcileHeldSchedules,
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  getRescheduleRequests,
  submitReschedule,
  approveReschedule,
  declineReschedule,
  getCoverageRequests,
  submitCoverageRequest,
  approveCoverageRequest,
  checkTutorAvailability
} from '../../src/features/scheduling/scheduling-service.js';

describe('Scheduling, Zoom & Google Meet Feature Service Suite', () => {
  it('getDayOfWeek and timeToMinutes convert dates and times accurately', () => {
    assert.equal(getDayOfWeek('2026-10-31'), 'Saturday');
    assert.equal(getDayOfWeek('2026-11-01'), 'Sunday');
    assert.equal(getDayOfWeek('2026-11-02'), 'Monday');
    assert.equal(getDayOfWeek(''), 'Monday');

    assert.equal(timeToMinutes('09:30'), 570);
    assert.equal(timeToMinutes('14:15'), 855);
    assert.equal(timeToMinutes('00:00'), 0);
    assert.equal(timeToMinutes(''), 0);
  });

  it('reconcileHeldSchedules synchronizes scheduled classes with attendance logs', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      schedules: [
        { id: 'sch-1', studentId: 'stu-101', studentName: 'Pearl Doe', date: '2026-10-15', attendanceStatus: 'pending', status: 'active' },
        { id: 'sch-2', studentId: 'stu-102', studentName: 'Alex Tech', date: '2026-10-16', attendanceStatus: 'pending', status: 'active' }
      ],
      attendanceRecords: [
        { id: 'att-1', scheduleId: 'sch-1', studentId: 'stu-101', classDate: '2026-10-15', status: 'approved' }
      ]
    };

    const res = reconcileHeldSchedules(db, mockStorage);
    assert.equal(res[0].attendanceStatus, 'done');
    assert.equal(res[0].status, 'done');
    assert.equal(res[1].attendanceStatus, 'pending');
    assert.equal(res[1].status, 'active');
    assert.equal(saved, true);
  });

  it('addSchedule, updateSchedule, and deleteSchedule manage sessions properly', () => {
    let savedCount = 0;
    const mockStorage = {
      save: () => { savedCount += 1; }
    };
    const db = { schedules: [] };

    const added = addSchedule({
      studentId: 'stu-101',
      studentName: 'Pearl Doe',
      course: 'Python Software Engineering',
      date: '2026-11-05',
      time: '16:00'
    }, db, mockStorage);

    assert.ok(added.id);
    assert.equal(added.dayOfWeek, 'Thursday');
    assert.equal(db.schedules.length, 1);
    assert.equal(savedCount, 1);

    const updated = updateSchedule(added.id, {
      date: '2026-11-06',
      time: '17:00'
    }, db, mockStorage);

    assert.equal(updated.dayOfWeek, 'Friday');
    assert.equal(updated.time, '17:00');
    assert.equal(savedCount, 2);

    const retrieved = getSchedules('stu-101', db, mockStorage);
    assert.equal(retrieved.length, 1);
    assert.equal(retrieved[0].id, added.id);

    const deleted = deleteSchedule(added.id, db, mockStorage);
    assert.equal(deleted, true);
    assert.equal(db.schedules.length, 0);
    assert.equal(savedCount, 3);
  });

  it('submitReschedule, approveReschedule, and declineReschedule handle workflow lifecycle', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      schedules: [
        { id: 'sch-99', studentId: 'stu-1', course: 'Scratch', date: '2026-11-02', time: '10:00' }
      ],
      tutors: [
        { id: 'tut-sub', name: 'Coach Alex', email: 'alex@stemulus.com' }
      ],
      rescheduleRequests: [],
      notifications: []
    };

    const req = submitReschedule({
      scheduleId: 'sch-99',
      studentName: 'Pearl Doe',
      course: 'Scratch',
      currentDate: '2026-11-02',
      requestedDate: '2026-11-04',
      requestedTime: '15:00',
      parentEmail: 'parent@example.com'
    }, db, mockStorage);

    assert.equal(req.status, 'pending');
    assert.equal(req.requestedDayOfWeek, 'Wednesday');
    assert.equal(db.rescheduleRequests.length, 1);
    assert.ok(db.notifications.some(n => n.title === 'New Reschedule Request'));

    const list = getRescheduleRequests('parent@example.com', db);
    assert.equal(list.length, 1);

    const approved = approveReschedule(req.id, 'tut-sub', db, mockStorage);
    assert.equal(approved, true);
    assert.equal(req.status, 'approved');
    assert.equal(db.schedules[0].date, '2026-11-04');
    assert.equal(db.schedules[0].time, '15:00');
    assert.equal(db.schedules[0].dayOfWeek, 'Wednesday');
    assert.equal(db.schedules[0].tutorId, 'tut-sub');
    assert.ok(db.notifications.some(n => n.title === 'Reschedule Approved'));

    const req2 = submitReschedule({
      scheduleId: 'sch-99',
      parentEmail: 'parent@example.com',
      requestedDate: '2026-11-08'
    }, db, mockStorage);

    const declined = declineReschedule(req2.id, db, mockStorage);
    assert.equal(declined, true);
    assert.equal(req2.status, 'declined');
    assert.ok(db.notifications.some(n => n.title === 'Reschedule Declined'));
  });

  it('submitCoverageRequest and approveCoverageRequest reassign session and notify faculty', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      schedules: [
        { id: 'sch-500', course: 'Web Wizards', mentor: 'Coach Initial' }
      ],
      tutors: [
        { id: 'tut-sub', name: 'Coach Brenda', email: 'brenda@stemulus.com' }
      ],
      coverageRequests: [],
      notifications: []
    };

    const cov = submitCoverageRequest({
      scheduleId: 'sch-500',
      tutorName: 'Coach Initial',
      tutorEmail: 'initial@stemulus.com',
      studentName: 'David Lee',
      date: '2026-11-10',
      time: '14:00'
    }, db, mockStorage);

    assert.equal(cov.status, 'pending');
    assert.equal(getCoverageRequests(db).length, 1);

    const approved = approveCoverageRequest(cov.id, 'tut-sub', db, mockStorage);
    assert.equal(approved, true);
    assert.equal(cov.status, 'approved');
    assert.equal(cov.assignedSubstituteId, 'tut-sub');
    assert.equal(db.schedules[0].substituteTutorId, 'tut-sub');
    assert.equal(db.schedules[0].mentor, 'Coach Brenda');
    assert.ok(db.notifications.some(n => n.title === 'Coverage Confirmed'));
    assert.ok(db.notifications.some(n => n.title === 'Class Coverage Assigned'));
  });

  it('checkTutorAvailability evaluates tutor schedule slots and detects conflicts', () => {
    const db = {
      tutors: [
        {
          id: 'tut-1',
          name: 'Coach Michael',
          email: 'michael@stemulus.com',
          availability: {
            monday: ['afternoon', 'evening'],
            wednesday: ['evening']
          }
        }
      ]
    };

    const res1 = checkTutorAvailability('tut-1', 'Monday', '14:00', db);
    assert.equal(res1.available, true);
    assert.equal(res1.status, 'AVAILABLE');

    const res2 = checkTutorAvailability('tut-1', 'Monday', '09:00', db);
    assert.equal(res2.available, false);
    assert.equal(res2.status, 'UNAVAILABLE_TIME');

    const res3 = checkTutorAvailability('tut-1', 'Tuesday', '17:00', db);
    assert.equal(res3.available, false);
    assert.equal(res3.status, 'UNAVAILABLE_DAY');

    const res4 = checkTutorAvailability('tut-unknown', 'Monday', '14:00', db);
    assert.equal(res4.available, true);
    assert.equal(res4.status, 'NOT_CONFIGURED');
  });
});
