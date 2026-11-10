import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  quickOnboardUser,
  generateAutoUsername,
  generateAutoPassword,
  hashPassword
} from '../../src/features/onboarding/onboarding-service.js';

import {
  resolveTutorDetails,
  getTutorStudents,
  getCanonicalWeeklySchedules,
  CORE_DEFAULT_TUTORS
} from '../../src/features/tutor-management/tutor-service.js';

import {
  generateGoogleMeetLink,
  provisionCoderClassroomAndMeet,
  generateClassroomMetadata,
  normalizeCourseTrack
} from '../../src/features/classroom/classroom-service.js';

import {
  addAttendanceRecord,
  updateAttendanceStatus,
  getOverdueAttendance,
  calculateMonthlySessionTarget
} from '../../src/features/attendance/attendance-service.js';

import {
  addSchedule,
  getSchedules,
  reconcileHeldSchedules,
  submitCoverageRequest,
  approveCoverageRequest
} from '../../src/features/scheduling/scheduling-service.js';

import {
  sanitizeDirectorVoice,
  crawlWoohooMoments,
  getMonthlyReports,
  addMonthlyReport,
  updateMonthlyReport,
  rejectMonthlyReport,
  approveAndSendMonthlyReport
} from '../../src/features/student-reports/reports-service.js';

import {
  addStudent,
  getStudents
} from '../../src/features/students/student-service.js';

describe('Tutor Dashboard and Faculty Workflow End to End Suite', () => {

  describe('Pillar 1: Tutor Onboarding Seamlessness', () => {
    it('generates standard domain username and handles collisions with numeric suffixes', () => {
      const u1 = generateAutoUsername('Adekunle Ciroma', 'tutor', {});
      assert.equal(u1, 'adekunle.ciroma@stemuluskidstech.com');

      const existingUsers = {
        'adekunle.ciroma@stemuluskidstech.com': { name: 'Existing Tutor' }
      };
      const u2 = generateAutoUsername('Adekunle Ciroma', 'tutor', existingUsers);
      assert.ok(u2.startsWith('adekunle.ciroma'));
      assert.ok(u2.endsWith('@stemuluskidstech.com'));
      assert.notEqual(u2, 'adekunle.ciroma@stemuluskidstech.com');
    });

    it('generates high entropy password adhering to STEM policy', () => {
      const pwd = generateAutoPassword();
      assert.ok(pwd.startsWith('STEM-'), 'Password should begin with STEM- prefix');
      assert.ok(pwd.length >= 10, 'Password length should meet security minimum');
      assert.match(pwd, /[A-Z]/, 'Password should have uppercase letter');
      assert.match(pwd, /[a-z]/, 'Password should have lowercase letter');
      assert.match(pwd, /[0-9]/, 'Password should have numeric digit');
      assert.match(pwd, /[!@#$%&*]/, 'Password should have special character');
    });

    it('hashes passwords consistently using SHA-256', async () => {
      const plain = 'STEM-Xy9$Secret';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
    });

    it('onboards new faculty tutor, populating users, tutors, notifications, and email queue', async () => {
      let savedDb = null;
      let syncedCollections = [];

      const mockStorage = {
        getDB: () => ({
          users: {},
          tutors: [],
          notifications: [],
          emailQueue: []
        }),
        saveDB: (d) => { savedDb = d; return true; },
        syncDocument: (coll, id, doc) => {
          syncedCollections.push({ coll, id, doc });
          return Promise.resolve();
        }
      };

      const result = await quickOnboardUser({
        type: 'tutor',
        name: 'Chioma Okonkwo',
        email: 'chioma.okonkwo@stemuluskidstech.com',
        phone: '+2348031234567',
        program: 'Python and Web Development'
      }, null, mockStorage);

      assert.equal(result.success, true);
      assert.equal(result.email, 'chioma.okonkwo@stemuluskidstech.com');
      assert.equal(result.name, 'Chioma Okonkwo');
      assert.ok(result.tempPassword);

      // Verify user collection record
      assert.ok(savedDb.users['chioma.okonkwo@stemuluskidstech.com']);
      const user = savedDb.users['chioma.okonkwo@stemuluskidstech.com'];
      assert.equal(user.role, 'tutor');
      assert.equal(user.name, 'Chioma Okonkwo');
      assert.equal(user.password.length, 64);

      // Verify tutor collection record
      const tutor = savedDb.tutors.find(t => t.email === 'chioma.okonkwo@stemuluskidstech.com');
      assert.ok(tutor);
      assert.equal(tutor.name, 'Chioma Okonkwo');
      assert.equal(tutor.status, 'active');
      assert.deepEqual(tutor.subjects, ['Python and Web Development']);

      // Verify notification created
      const notif = savedDb.notifications.find(n => n.userEmail === 'chioma.okonkwo@stemuluskidstech.com');
      assert.ok(notif);
      assert.equal(notif.title, 'Welcome to STEMulus Faculty!');

      // Verify email queued
      const queuedEmail = savedDb.emailQueue.find(e => e.to === 'chioma.okonkwo@stemuluskidstech.com');
      assert.ok(queuedEmail);
      assert.equal(queuedEmail.type, 'tutor-welcome');
      assert.equal(queuedEmail.status, 'draft');
      assert.ok(queuedEmail.data.meetLink);
      assert.ok(queuedEmail.data.classroomLink);

      // Verify cloud sync dispatched
      assert.ok(syncedCollections.some(s => s.coll === 'users'));
      assert.ok(syncedCollections.some(s => s.coll === 'tutors'));
    });
  });

  describe('Pillar 2: Student Assignment and Faculty Roster Resolution', () => {
    it('accurately resolves assigned students by tutor email, id, or name tokens', () => {
      const db = {
        tutors: [
          { id: 'tut-101', name: 'Joshua Ogba', email: 'joshua@stemuluskidstech.com' },
          { id: 'tut-102', name: 'Chioma Okonkwo', email: 'chioma.okonkwo@stemuluskidstech.com' }
        ],
        students: [
          {
            id: 'stu-1',
            firstName: 'Amina',
            lastName: 'Bello',
            tutorEmail: 'chioma.okonkwo@stemuluskidstech.com',
            program: 'Scratch Coding'
          },
          {
            id: 'stu-2',
            firstName: 'Kene',
            lastName: 'Eze',
            tutorId: 'tut-102',
            program: 'Python Foundations'
          },
          {
            id: 'stu-3',
            firstName: 'Tunde',
            lastName: 'Bakare',
            tutorName: 'Chioma Okonkwo',
            program: 'Web Development'
          },
          {
            id: 'stu-4',
            firstName: 'David',
            lastName: 'Ojo',
            tutorEmail: 'joshua@stemuluskidstech.com',
            program: 'Robotics'
          }
        ]
      };

      const chiomaSession = {
        name: 'Chioma Okonkwo',
        email: 'chioma.okonkwo@stemuluskidstech.com',
        role: 'tutor'
      };

      const chiomaStudents = getTutorStudents('chioma.okonkwo@stemuluskidstech.com', db, chiomaSession);
      assert.equal(chiomaStudents.length, 3);
      assert.ok(chiomaStudents.some(s => s.id === 'stu-1'));
      assert.ok(chiomaStudents.some(s => s.id === 'stu-2'));
      assert.ok(chiomaStudents.some(s => s.id === 'stu-3'));
      assert.ok(!chiomaStudents.some(s => s.id === 'stu-4'), 'Should not include students assigned to other tutors');

      // Admin view verification
      const adminSession = { role: 'admin', email: 'admin@stemuluskidstech.com' };
      const allStudentsForAdmin = getTutorStudents(null, db, adminSession);
      assert.equal(allStudentsForAdmin.length, 4);

      const filteredForAdmin = getTutorStudents('chioma.okonkwo@stemuluskidstech.com', db, adminSession);
      assert.equal(filteredForAdmin.length, 3);
    });
  });

  describe('Pillar 3: Google Meet and Classroom Provisioning', () => {
    it('generates authentic Google Meet links matching pattern and avoiding collisions', () => {
      const existing = new Set(['https://meet.google.com/abc-defg-hij']);
      const link = generateGoogleMeetLink(existing);
      assert.match(link, /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
      assert.notEqual(link, 'https://meet.google.com/abc-defg-hij');
    });

    it('provisions student with Google Meet link, 1080p recording, and classroom syllabus', () => {
      let saved = false;
      const mockStorage = {
        save: () => { saved = true; }
      };

      const rawStudent = {
        id: 'stu-new-coder',
        firstName: 'Zainab',
        lastName: 'Ahmed',
        program: 'Python Foundations',
        lessonCount: 8
      };

      const db = { students: [rawStudent] };
      const student = provisionCoderClassroomAndMeet(rawStudent, 8, db, mockStorage);

      assert.ok(student.meetLink);
      assert.match(student.meetLink, /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
      assert.equal(student.autoRecord, true);
      assert.equal(student.autoRecordEnabled, true);
      assert.equal(student.hostNotRequired, true);
      assert.equal(student.recordingMode, '1080p_hd_companion_and_cloud');
      assert.equal(student.recordingHostEmail, 'stemulusclubs@gmail.com');

      // Classroom metadata check
      assert.ok(student.googleClassroom);
      assert.ok(student.googleClassroom.enrollmentCode);
      assert.ok(student.googleClassroom.studentInviteLink);
      assert.ok(student.googleClassroom.tutorInviteLink);
      assert.equal(student.googleClassroom.totalDraftedAssignments, 8);
      assert.equal(student.googleClassroom.draftedAssignments[0].rubric.length, 3);
      assert.equal(saved, true);
    });
  });

  describe('Pillar 4: Completed and Upcoming Schedules Attribution', () => {
    it('correctly filters tutor schedules and calculates upcoming vs completed sessions', () => {
      let savedDb = null;
      const mockStorage = {
        save: (d) => { savedDb = d; return true; }
      };

      const tutorEmail = 'chioma.okonkwo@stemuluskidstech.com';
      const studentId = 'stu-101';

      const db = {
        students: [
          { id: studentId, firstName: 'Amina', lastName: 'Bello', tutorEmail }
        ],
        schedules: []
      };

      // Add upcoming schedule
      const s1 = addSchedule({
        studentId,
        studentName: 'Amina Bello',
        tutorEmail,
        tutorName: 'Chioma Okonkwo',
        course: 'Python Foundations',
        date: '2026-11-05',
        time: '16:00',
        duration: '60',
        attendanceStatus: 'pending'
      }, db, mockStorage);

      // Add completed schedule
      const s2 = addSchedule({
        studentId,
        studentName: 'Amina Bello',
        tutorEmail,
        tutorName: 'Chioma Okonkwo',
        course: 'Python Foundations',
        date: '2026-10-25',
        time: '16:00',
        duration: '60',
        attendanceStatus: 'present'
      }, db, mockStorage);

      // Add schedule for another tutor
      const s3 = addSchedule({
        studentId: 'stu-999',
        studentName: 'David Ojo',
        tutorEmail: 'joshua@stemuluskidstech.com',
        tutorName: 'Joshua Ogba',
        course: 'Robotics',
        date: '2026-11-05',
        time: '17:00',
        duration: '60',
        attendanceStatus: 'pending'
      }, db, mockStorage);

      const all = getSchedules(null, db);
      assert.equal(all.length, 3);

      // Mimic tutor-engine doesItemBelongToCurrentTutor filter
      const myStudentIds = new Set([studentId]);
      const mySchedules = all.filter(s => {
        const e = (s.tutorEmail || '').toLowerCase().trim();
        if (e === tutorEmail) return true;
        if (s.studentId && myStudentIds.has(s.studentId)) return true;
        return false;
      });

      assert.equal(mySchedules.length, 2);

      const upcoming = mySchedules.filter(s => s.attendanceStatus === 'pending');
      const completed = mySchedules.filter(s => s.attendanceStatus === 'present' || s.attendanceStatus === 'done');

      assert.equal(upcoming.length, 1);
      assert.equal(upcoming[0].id, s1.id);
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, s2.id);
    });

    it('detects overdue attendance for past sessions awaiting submission', () => {
      const tutorEmail = 'chioma.okonkwo@stemuluskidstech.com';
      const db = {
        schedules: [
          {
            id: 'sch-past-1',
            studentId: 'stu-101',
            studentName: 'Amina Bello',
            tutorEmail,
            date: '2026-10-01',
            time: '16:00',
            attendanceStatus: 'pending'
          },
          {
            id: 'sch-future-1',
            studentId: 'stu-101',
            studentName: 'Amina Bello',
            tutorEmail,
            date: '2026-12-01',
            time: '16:00',
            attendanceStatus: 'pending'
          }
        ],
        attendanceRecords: []
      };

      const overdue = getOverdueAttendance(tutorEmail, db, { email: tutorEmail, role: 'tutor' });
      assert.equal(overdue.length, 1);
      assert.equal(overdue[0].id, 'sch-past-1');
    });
  });

  describe('Pillar 5: Seamless Attendance Logging and Schedule Reconciliation', () => {
    it('records attendance, queues admin approval, reconciles schedule, and notifies parent', () => {
      let saved = false;
      const mockStorage = {
        save: () => { saved = true; }
      };

      const tutorEmail = 'chioma.okonkwo@stemuluskidstech.com';
      const tutorName = 'Chioma Okonkwo';
      const studentId = 'stu-101';
      const parentEmail = 'parent.bello@gmail.com';

      const db = {
        students: [
          {
            id: studentId,
            firstName: 'Amina',
            lastName: 'Bello',
            parentEmail,
            tutorEmail,
            metrics: { attended: 0, total: 8, projects: 0, lines: 0 },
            billing: null
          }
        ],
        schedules: [
          {
            id: 'sch-session-101',
            studentId,
            studentName: 'Amina Bello',
            tutorEmail,
            date: '2026-10-28',
            time: '16:00',
            duration: '60',
            attendanceStatus: 'pending'
          }
        ],
        attendanceRecords: [],
        notifications: [],
        progressReports: []
      };

      const tutorSession = { email: tutorEmail, name: tutorName, role: 'tutor' };

      // 1. Tutor logs attendance with aliases
      const logResult = addAttendanceRecord({
        scheduleId: 'sch-session-101',
        student_id: studentId,
        student_name: 'Amina Bello',
        class_date: '2026-10-28',
        class_time: '16:00',
        topic: 'Loops and Dynamic Lists in Python',
        what_built: 'Automated multiplication table generator',
        concept_grasp: 5,
        homework_assigned: 'Complete list slicing exercises 1 to 5',
        tutor_comment: 'Amina demonstrated high computational speed and zero syntax errors.',
        duration_minutes: '60',
        attendance_status: 'present'
      }, db, mockStorage, tutorSession);

      assert.equal(logResult.success, true);
      assert.equal(logResult.status, 'pending');
      assert.equal(db.attendanceRecords.length, 1);

      // Verify admin notification was enqueued
      const adminNotif = db.notifications.find(n => n.userEmail === 'admin@stemuluskidstech.com');
      assert.ok(adminNotif);
      assert.ok(adminNotif.message.includes('Loops and Dynamic Lists'));

      // 2. Admin approves attendance record
      const approvedRecord = updateAttendanceStatus(logResult.id, 'approved', db, mockStorage);
      assert.ok(approvedRecord);
      assert.equal(approvedRecord.status, 'approved');

      // 3. Verify schedule was reconciled to present
      const reconciledSchedule = db.schedules.find(s => s.id === 'sch-session-101');
      assert.ok(reconciledSchedule);
      assert.equal(reconciledSchedule.attendanceStatus, 'present');
      assert.equal(reconciledSchedule.topic, 'Loops and Dynamic Lists in Python');
      assert.equal(reconciledSchedule.whatBuilt, 'Automated multiplication table generator');

      // 4. Verify student metrics updated
      const student = db.students.find(s => s.id === studentId);
      assert.equal(student.metrics.attended, 1);
      assert.ok(student.metrics.total > 0);

      // 5. Verify parent notification created
      const parentNotif = db.notifications.find(n => n.userEmail === parentEmail);
      assert.ok(parentNotif);
      assert.equal(parentNotif.title, 'Class Verified: Amina Bello');
      assert.ok(parentNotif.message.includes('Loops and Dynamic Lists'));

      // 6. Verify progress report created
      assert.equal(db.progressReports.length, 1);
      assert.equal(db.progressReports[0].grade, 'A');
    });
  });

  describe('Pillar 6: Monthly Progress Reports with Woohoo Moments and Director Voice', () => {
    it('crawls attendance logs for breakthrough keywords to extract woohoo moments', () => {
      const studentId = 'stu-101';
      const db = {
        students: [
          { id: studentId, firstName: 'Amina', lastName: 'Bello' }
        ],
        attendanceRecords: [
          {
            id: 'att-1',
            studentId,
            studentName: 'Amina Bello',
            date: '2026-10-10',
            topic: 'Nested Loops and Algorithm Design',
            summary: 'Engineered a brilliant procedural grid with nested loops completely independently.',
            tutorRemark: 'Total breakthrough moment for Amina.'
          },
          {
            id: 'att-2',
            studentId,
            studentName: 'Amina Bello',
            date: '2026-10-20',
            topic: 'Debugging and Dictionary Logic',
            summary: 'Solved challenging logic bug in inventory system without instructor intervention.',
            tutorRemark: 'Exceptional debugging resilience.'
          }
        ]
      };

      const moments = crawlWoohooMoments(studentId, 'October 2026', db);
      assert.ok(Array.isArray(moments));
      assert.equal(moments.length, 2);
      assert.ok(moments[0].moment.includes('Engineered a brilliant procedural grid'));
      assert.ok(moments[1].moment.includes('Solved challenging logic bug'));
    });

    it('enforces Director Voice sanitization with strict zero em-dashes', () => {
      const emDash = String.fromCharCode(8212);
      const doubleDash = String.fromCharCode(45, 45);
      const rawText = 'Outstanding month' + emDash + 'Amina excelled in all tasks' + doubleDash + 'highly commended!';
      const sanitized = sanitizeDirectorVoice(rawText);

      assert.equal(sanitized.includes(emDash), false, 'Should have no unicode em-dashes');
      assert.equal(sanitized.includes(doubleDash), false, 'Should have no double-hyphen em-dashes');
      assert.equal(sanitized, 'Outstanding month, Amina excelled in all tasks, highly commended!');
    });

    it('manages full monthly report lifecycle from tutor draft to director approval', () => {
      let saved = false;
      const mockStorage = {
        save: () => { saved = true; }
      };

      const db = {
        monthlyReports: []
      };

      // 1. Tutor drafts monthly report
      const draft = addMonthlyReport({
        studentId: 'stu-101',
        studentName: 'Amina Bello',
        course: 'Python Programming Foundations',
        parentName: 'Mrs. Bello',
        parentEmail: 'parent.bello@gmail.com',
        tutorId: 'tut-102',
        tutorName: 'Chioma Okonkwo',
        tutorEmail: 'chioma.okonkwo@stemuluskidstech.com',
        month: 'October 2026',
        projectLinks: [
          { title: 'Multiplication Grid Generator', url: 'https://github.com/stemulus/amina-grid' },
          { title: 'Interactive Inventory Game', url: 'https://github.com/stemulus/amina-game' }
        ],
        shiningHighlights: 'Mastered nested loops and conditional branching with genuine joy.',
        growthAreas: 'Continue strengthening functions with return arguments.',
        woohooMoments: [
          { date: '2026-10-10', topic: 'Nested Loops', moment: 'Built procedural grid independently.' }
        ]
      }, db, mockStorage);

      assert.ok(draft.id);
      assert.ok(draft.status === 'pending_review' || draft.status === 'pending_admin_approval');
      assert.equal(db.monthlyReports.length, 1);

      // 2. Director requests revision
      const rejected = rejectMonthlyReport(draft.id, 'Please add project demo video link if available.', db, mockStorage);
      assert.ok(rejected);
      assert.ok(rejected.status === 'rejected' || rejected.status === 'rejected_needs_revision');
      assert.equal(rejected.rejectionReason, 'Please add project demo video link if available.');

      // 3. Tutor revises report
      const revised = updateMonthlyReport(draft.id, {
        status: 'pending_review',
        growthAreas: 'Continue strengthening functions with return arguments. Practice daily 15 mins.'
      }, db, mockStorage);
      assert.ok(revised.status === 'pending_review' || revised.status === 'pending_admin_approval');

      // 4. Director approves report
      const approved = approveAndSendMonthlyReport(draft.id, null, db, mockStorage);
      assert.ok(approved);
      assert.ok(approved.status === 'sent_to_parent' || approved.status === 'approved');
      assert.ok(approved.reviewedAt || approved.approvedAt);
    });
  });

});
