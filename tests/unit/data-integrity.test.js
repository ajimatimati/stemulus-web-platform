import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveDayOfWeek,
  deduplicateStudents,
  deduplicateSchedules,
  deduplicateAttendanceRecords,
  deduplicateNotifications,
  deduplicateEmailQueue,
  deduplicateMonthlyReports,
  deduplicateTutors,
  enforceDatabaseIntegrity
} from '../../src/services/data-integrity-service.js';

import {
  saveDB,
  getDB,
  validateDBSchema
} from '../../src/services/storage-service.js';

describe('Data Integrity and Deduplication Feature Service Suite', () => {

  describe('deriveDayOfWeek', () => {
    it('accurately resolves day names from ISO date strings', () => {
      assert.equal(deriveDayOfWeek('2026-10-31'), 'Saturday');
      assert.equal(deriveDayOfWeek('2026-11-01'), 'Sunday');
      assert.equal(deriveDayOfWeek('2026-11-02'), 'Monday');
      assert.equal(deriveDayOfWeek('2026-11-03'), 'Tuesday');
      assert.equal(deriveDayOfWeek('2026-11-04'), 'Wednesday');
      assert.equal(deriveDayOfWeek('2026-11-05'), 'Thursday');
      assert.equal(deriveDayOfWeek('2026-11-06'), 'Friday');
    });

    it('falls back gracefully on empty or malformed inputs', () => {
      assert.equal(deriveDayOfWeek(''), 'Monday');
      assert.equal(deriveDayOfWeek(null), 'Monday');
    });
  });

  describe('deduplicateStudents', () => {
    it('deduplicates students by primary ID and merges richer attributes', () => {
      const input = [
        {
          id: 'std-101',
          firstName: 'Pearl',
          lastName: 'Babalola',
          parentEmail: 'talk2nike@gmail.com',
          metrics: { attended: 2, total: 8 }
        },
        {
          id: 'std-101',
          firstName: 'Pearl',
          lastName: 'Babalola',
          parentEmail: 'talk2nike@gmail.com',
          meetLink: 'https://meet.google.com/bbx-ocde-ytw',
          googleClassroom: { enrollmentCode: 'abc1234' },
          metrics: { attended: 6, total: 8 }
        }
      ];

      const res = deduplicateStudents(input, []);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 1);

      const canonical = res.deduped[0];
      assert.equal(canonical.id, 'std-101');
      assert.equal(canonical.meetLink, 'https://meet.google.com/bbx-ocde-ytw');
      assert.equal(canonical.googleClassroom.enrollmentCode, 'abc1234');
      assert.equal(canonical.metrics.attended, 6, 'Should retain highest attended session count');
    });

    it('deduplicates students by natural composite key and filters deleted records', () => {
      const input = [
        {
          id: 'std-alpha',
          firstName: 'Gbolade',
          lastName: 'Okesanjo',
          parentEmail: 'temi@gmail.com'
        },
        {
          id: 'std-beta',
          firstName: 'gbolade',
          lastName: 'okesanjo',
          parentEmail: 'TEMI@GMAIL.COM',
          tutorEmail: 'olalekan@stemuluskidstech.com'
        },
        {
          id: 'std-deleted',
          firstName: 'Old',
          lastName: 'Student',
          parentEmail: 'old@gmail.com',
          isDeleted: true
        },
        {
          id: 'std-purged',
          firstName: 'Purged',
          lastName: 'Student',
          parentEmail: 'purged@gmail.com'
        }
      ];

      const res = deduplicateStudents(input, ['std-purged']);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 3);
      assert.equal(res.deduped[0].firstName, 'Gbolade');
      assert.equal(res.deduped[0].tutorEmail, 'olalekan@stemuluskidstech.com');
    });
  });

  describe('deduplicateSchedules', () => {
    it('deduplicates schedules by slot key and elevates completed attendance status', () => {
      const students = [
        {
          id: 'std-101',
          firstName: 'Pearl',
          lastName: 'Babalola',
          parentEmail: 'talk2nike@gmail.com',
          tutorEmail: 'olalekan@stemuluskidstech.com',
          tutorName: 'Olalekan Israel Ajimati',
          tutorId: 'tut-103',
          meetLink: 'https://meet.google.com/bbx-ocde-ytw'
        }
      ];

      const schedules = [
        {
          id: 'sch-1',
          studentId: 'std-101',
          date: '2026-10-31',
          time: '16:00',
          attendanceStatus: 'pending',
          status: 'scheduled'
        },
        {
          id: 'sch-2',
          studentId: 'std-101',
          date: '2026-10-31',
          time: '16:00',
          attendanceStatus: 'present',
          status: 'done',
          topic: 'Advanced Algorithms in Python',
          whatBuilt: 'Interactive Maze Solver'
        }
      ];

      const res = deduplicateSchedules(schedules, students);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 1);

      const canonical = res.deduped[0];
      assert.equal(canonical.attendanceStatus, 'present');
      assert.equal(canonical.status, 'done');
      assert.equal(canonical.topic, 'Advanced Algorithms in Python');
      assert.equal(canonical.whatBuilt, 'Interactive Maze Solver');
      assert.equal(canonical.tutorEmail, 'olalekan@stemuluskidstech.com');
      assert.equal(canonical.link, 'https://meet.google.com/bbx-ocde-ytw');
    });

    it('heals missing studentId and cleanses corrupt or undefined dates', () => {
      const students = [
        {
          id: 'std-202',
          firstName: 'Brian',
          lastName: 'Chukwuka-Mordi',
          parentEmail: 'maryrose@gmail.com'
        }
      ];

      const schedules = [
        {
          id: 'sch-corrupt-1',
          studentId: 'std-202',
          date: 'undefined',
          time: '14:00'
        },
        {
          id: 'sch-corrupt-2',
          studentId: 'std-202',
          date: '',
          time: '14:00'
        },
        {
          id: 'sch-healed',
          studentName: 'Brian Chukwuka-Mordi',
          date: '2026-11-04',
          time: '15:00'
        }
      ];

      const res = deduplicateSchedules(schedules, students);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 2);
      assert.equal(res.healedCount >= 1, true);

      const healed = res.deduped[0];
      assert.equal(healed.studentId, 'std-202');
      assert.equal(healed.dayOfWeek, 'Wednesday');
      assert.equal(healed.duration, '60');
    });
  });

  describe('deduplicateAttendanceRecords', () => {
    it('deduplicates attendance logs and preserves approved status and highest concept grasp', () => {
      const records = [
        {
          id: 'att-1',
          studentId: 'std-101',
          classDate: '2026-10-24',
          classTime: '16:00',
          status: 'pending',
          conceptGrasp: 3,
          topic: 'Variables'
        },
        {
          id: 'att-2',
          studentId: 'std-101',
          classDate: '2026-10-24',
          classTime: '16:00',
          status: 'approved',
          conceptGrasp: 5,
          topic: 'Variables and Memory Management',
          whatBuilt: 'Memory Calculator'
        }
      ];

      const res = deduplicateAttendanceRecords(records);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 1);

      const canonical = res.deduped[0];
      assert.equal(canonical.status, 'approved');
      assert.equal(canonical.conceptGrasp, 5);
      assert.equal(canonical.whatBuilt, 'Memory Calculator');
    });
  });

  describe('deduplicateNotifications', () => {
    it('deduplicates countdown notifications and preserves read receipts', () => {
      const notifs = [
        {
          id: 'n-1',
          userEmail: 'parent@gmail.com',
          title: 'Class in 2 Hours: Python Session',
          timestamp: '2026-10-31T14:00:00Z',
          read: false
        },
        {
          id: 'n-2',
          userEmail: 'parent@gmail.com',
          title: 'Class in 2 Hours: Python Session',
          timestamp: '2026-10-31T14:00:05Z',
          read: true
        },
        {
          id: 'n-3',
          userEmail: 'parent@gmail.com',
          title: 'Welcome Kit Ready',
          message: 'Your portal account is active.',
          read: false
        },
        {
          id: 'n-4',
          userEmail: 'parent@gmail.com',
          title: 'Welcome Kit Ready',
          message: 'Your portal account is active.',
          read: false
        }
      ];

      const res = deduplicateNotifications(notifs);
      assert.equal(res.deduped.length, 2);
      assert.equal(res.prunedCount, 2);

      const countdown = res.deduped.find(n => n.title.includes('Class in 2 Hours'));
      assert.ok(countdown);
      assert.equal(countdown.read, true, 'Should elevate to read: true');
    });
  });

  describe('deduplicateEmailQueue', () => {
    it('deduplicates email drafts by recipient and type', () => {
      const queue = [
        { id: 'eq-1', to: 'parent@gmail.com', type: 'welcome', status: 'draft' },
        { id: 'eq-2', to: 'parent@gmail.com', type: 'welcome', status: 'draft' },
        { id: 'eq-3', to: 'parent@gmail.com', type: 'invoice-reminder', status: 'draft' }
      ];

      const res = deduplicateEmailQueue(queue);
      assert.equal(res.deduped.length, 2);
      assert.equal(res.prunedCount, 1);
    });
  });

  describe('deduplicateMonthlyReports', () => {
    it('deduplicates reports by student and month, preserving approved version', () => {
      const reports = [
        {
          id: 'rep-draft',
          studentId: 'std-101',
          month: 'October 2026',
          status: 'pending_review',
          shiningHighlights: 'Good effort.'
        },
        {
          id: 'rep-approved',
          studentId: 'std-101',
          month: 'October 2026',
          status: 'approved',
          shiningHighlights: 'Mastered loops and built games independently.'
        }
      ];

      const res = deduplicateMonthlyReports(reports);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 1);
      assert.equal(res.deduped[0].status, 'approved');
      assert.equal(res.deduped[0].shiningHighlights, 'Mastered loops and built games independently.');
    });
  });

  describe('deduplicateTutors', () => {
    it('deduplicates tutors by email or altEmail and purges deleted records', () => {
      const tutors = [
        { id: 'tut-1', name: 'Olalekan Ajimati', email: 'olalekan@stemuluskidstech.com', altEmail: 'ajimatimati@gmail.com' },
        { id: 'tut-1b', name: 'Olalekan Ajimati', email: 'ajimatimati@gmail.com' },
        { id: 'tut-del', name: 'Deleted Coach', email: 'deleted@stemulus.com' }
      ];

      const res = deduplicateTutors(tutors, ['deleted@stemulus.com']);
      assert.equal(res.deduped.length, 1);
      assert.equal(res.prunedCount, 2);
      assert.equal(res.deduped[0].id, 'tut-1');
    });
  });

  describe('enforceDatabaseIntegrity Pipeline', () => {
    it('runs comprehensive deduplication across all root collections and returns detailed audit report', () => {
      const db = {
        users: { 'admin@stemulus.com': { role: 'admin' } },
        deletedStudentIds: ['std-purged'],
        deletedTutorEmails: ['deleted@stemulus.com'],
        students: [
          { id: 'std-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl@gmail.com' },
          { id: 'std-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl@gmail.com' },
          { id: 'std-purged', firstName: 'Purged', lastName: 'Student', parentEmail: 'p@gmail.com' }
        ],
        schedules: [
          { id: 's-1', studentId: 'std-1', date: '2026-10-31', time: '16:00', attendanceStatus: 'pending' },
          { id: 's-2', studentId: 'std-1', date: '2026-10-31', time: '16:00', attendanceStatus: 'present' },
          { id: 's-bad', studentId: 'std-1', date: 'undefined', time: '16:00' }
        ],
        attendanceRecords: [
          { id: 'a-1', studentId: 'std-1', classDate: '2026-10-31', classTime: '16:00', status: 'pending' },
          { id: 'a-2', studentId: 'std-1', classDate: '2026-10-31', classTime: '16:00', status: 'approved' }
        ],
        notifications: [
          { id: 'n-1', userEmail: 'pearl@gmail.com', title: 'Reminder', message: 'Class soon', read: false },
          { id: 'n-2', userEmail: 'pearl@gmail.com', title: 'Reminder', message: 'Class soon', read: true }
        ],
        emailQueue: [
          { id: 'e-1', to: 'pearl@gmail.com', type: 'welcome' },
          { id: 'e-2', to: 'pearl@gmail.com', type: 'welcome' }
        ],
        monthlyReports: [
          { id: 'r-1', studentId: 'std-1', month: 'October 2026', status: 'pending' },
          { id: 'r-2', studentId: 'std-1', month: 'October 2026', status: 'approved' }
        ],
        tutors: [
          { id: 't-1', email: 'olalekan@stemulus.com' },
          { id: 't-2', email: 'olalekan@stemulus.com' },
          { id: 't-del', email: 'deleted@stemulus.com' }
        ]
      };

      const result = enforceDatabaseIntegrity(db);
      assert.equal(result.audit.valid, true);
      assert.equal(result.audit.studentsPruned, 2);
      assert.equal(result.audit.schedulesPruned, 2);
      assert.equal(result.audit.attendancePruned, 1);
      assert.equal(result.audit.notificationsPruned, 1);
      assert.equal(result.audit.emailQueuePruned, 1);
      assert.equal(result.audit.monthlyReportsPruned, 1);
      assert.equal(result.audit.tutorsPruned, 2);
      assert.equal(result.audit.totalRecordsPruned, 10);

      // Verify clean target lengths
      assert.equal(db.students.length, 1);
      assert.equal(db.schedules.length, 1);
      assert.equal(db.schedules[0].attendanceStatus, 'present');
      assert.equal(db.attendanceRecords.length, 1);
      assert.equal(db.attendanceRecords[0].status, 'approved');
      assert.equal(db.notifications.length, 1);
      assert.equal(db.notifications[0].read, true);
      assert.equal(db.emailQueue.length, 1);
      assert.equal(db.monthlyReports.length, 1);
      assert.equal(db.monthlyReports[0].status, 'approved');
      assert.equal(db.tutors.length, 1);
    });

    it('StorageService.saveDB automatically enforces integrity before persisting', () => {
      let savedToStorage = null;
      global.localStorage = {
        setItem: (k, v) => { savedToStorage = JSON.parse(v); },
        getItem: () => null
      };

      const uncleanedDB = {
        users: { 'admin@stemulus.com': { role: 'admin' } },
        students: [
          { id: 'std-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl@gmail.com' },
          { id: 'std-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl@gmail.com' }
        ],
        schedules: [],
        emailQueue: []
      };

      const ok = saveDB(uncleanedDB);
      assert.equal(ok, true);
      assert.ok(savedToStorage);
      assert.equal(savedToStorage.students.length, 1, 'Storage snapshot should have deduplicated students roster');
    });
  });

});
