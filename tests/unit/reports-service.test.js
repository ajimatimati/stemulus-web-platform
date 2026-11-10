import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeDirectorVoice,
  crawlWoohooMoments,
  getReports,
  addReport,
  getMonthlyReports,
  addMonthlyReport,
  updateMonthlyReport,
  rejectMonthlyReport,
  approveAndSendMonthlyReport,
  generateWeeklyReport,
  generateAllWeeklyReports
} from '../../src/features/student-reports/reports-service.js';

describe('Student Reports Feature Service Suite', () => {
  it('sanitizeDirectorVoice removes em-dashes and cleans excessive whitespace', () => {
    const emDash = String.fromCharCode(8212);
    const doubleDash = String.fromCharCode(45, 45);
    const input = 'Great progress' + emDash + 'Pearl is mastering loops' + doubleDash + 'very impressive!';
    const cleaned = sanitizeDirectorVoice(input);

    assert.equal(cleaned.includes(emDash), false);
    assert.equal(cleaned.includes(doubleDash), false);
    assert.equal(cleaned, 'Great progress, Pearl is mastering loops, very impressive!');
  });

  it('crawlWoohooMoments extracts breakthrough milestones from session logs', () => {
    const db = {
      students: [
        { id: 'stu-pearl', firstName: 'Pearl', lastName: 'Doe' }
      ],
      attendanceRecords: [
        {
          id: 'att-1',
          studentId: 'stu-pearl',
          studentName: 'Pearl Doe',
          date: '2026-10-10',
          topic: 'Nested Loops and Algorithms',
          summary: 'Built an impressive algorithmic number pattern generator with zero errors.',
          tutorRemark: 'Super sharp problem solving today.'
        },
        {
          id: 'att-2',
          studentId: 'stu-pearl',
          studentName: 'Pearl Doe',
          date: '2026-10-17',
          topic: 'Variables and Functions',
          summary: 'Successfully debugged a complex calculator program independently.',
          tutorRemark: 'Showed real persistence.'
        }
      ]
    };

    const moments = crawlWoohooMoments('stu-pearl', 'October 2026', db);
    assert.ok(Array.isArray(moments));
    assert.equal(moments.length, 2);
    assert.equal(moments[0].topic, 'Nested Loops and Algorithms');
    assert.ok(moments[0].moment.includes('Built an impressive algorithmic'));
    assert.ok(moments[1].moment.includes('Successfully debugged a complex calculator'));
  });

  it('getReports and addReport manage progress reports with parent notifications', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-10', firstName: 'David', parentEmail: 'parent.david@example.com' }
      ],
      progressReports: [],
      notifications: []
    };

    const rep = addReport({
      studentId: 'stu-10',
      grade: 'A',
      feedback: 'Excellent work in Scratch coding.'
    }, db, mockStorage);

    assert.ok(rep.id);
    assert.equal(saved, true);
    assert.equal(db.progressReports.length, 1);
    assert.ok(db.notifications.some(n => n.title === 'New Progress Report' && n.userEmail === 'parent.david@example.com'));

    const list = getReports('stu-10', db);
    assert.equal(list.length, 1);
    assert.equal(list[0].grade, 'A');
  });

  it('getMonthlyReports filters by student, tutor, status, or role permissions', () => {
    const db = {
      monthlyReports: [
        { id: 'm-1', studentId: 'stu-1', tutorEmail: 'coach.a@stemulus.com', parentEmail: 'p1@example.com', status: 'approved' },
        { id: 'm-2', studentId: 'stu-2', tutorEmail: 'coach.b@stemulus.com', parentEmail: 'p2@example.com', status: 'pending_review' }
      ]
    };

    // Filter by tutor email
    const tutorReports = getMonthlyReports('coach.a@stemulus.com', db);
    assert.equal(tutorReports.length, 1);
    assert.equal(tutorReports[0].id, 'm-1');

    // Filter by status
    const pendingReports = getMonthlyReports('pending_review', db);
    assert.equal(pendingReports.length, 1);
    assert.equal(pendingReports[0].id, 'm-2');

    // Admin bypass: returns all
    const adminSession = { role: 'admin', email: 'admin@stemuluskidstech.com' };
    const allForAdmin = getMonthlyReports('admin@stemuluskidstech.com', db, adminSession);
    assert.equal(allForAdmin.length, 2);

    // Object filter
    const objFiltered = getMonthlyReports({ status: 'approved' }, db);
    assert.equal(objFiltered.length, 1);
    assert.equal(objFiltered[0].id, 'm-1');
  });

  it('addMonthlyReport links student details, queues admin notice, and handles resubmissions', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-50', firstName: 'Ada', lastName: 'Lovelace', parentEmail: 'ada.parent@example.com', parentName: 'Lady Byron', program: 'Python Software Engineering' }
      ],
      monthlyReports: [],
      notifications: []
    };

    const added = addMonthlyReport({
      studentId: 'stu-50',
      tutorName: 'Coach Michael',
      month: 'October 2026',
      journeyNarrative: 'Ada did great this month.',
      overallGrade: 'A'
    }, db, mockStorage);

    assert.ok(added.id);
    assert.equal(added.studentName, 'Ada Lovelace');
    assert.equal(added.parentEmail, 'ada.parent@example.com');
    assert.equal(added.course, 'Python Software Engineering');
    assert.equal(added.status, 'pending_review');
    assert.ok(db.notifications.some(n => n.title === 'New Monthly Report Submitted'));

    // Test resubmission of rejected report
    db.monthlyReports[0].status = 'rejected';
    db.monthlyReports[0].rejectionReason = 'Needs more details on algorithms';

    const resubmitted = addMonthlyReport({
      id: added.id,
      studentId: 'stu-50',
      journeyNarrative: 'Updated with complete algorithm breakdown.'
    }, db, mockStorage);

    assert.equal(resubmitted.isUpdate, true);
    assert.equal(resubmitted.status, 'pending_review');
    assert.equal(resubmitted.rejectionReason, '');
    assert.equal(db.monthlyReports.length, 1);
  });

  it('rejectMonthlyReport flags revision needed and notifies tutor', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      monthlyReports: [
        {
          id: 'rep-reject-1',
          studentName: 'Emeka Eze',
          tutorEmail: 'tutor.emeka@stemulus.com',
          month: 'October 2026',
          status: 'pending_review'
        }
      ],
      notifications: []
    };

    const rejected = rejectMonthlyReport('rep-reject-1', 'Please expand on homework submissions.', db, mockStorage);
    assert.equal(rejected.status, 'rejected');
    assert.equal(rejected.rejectionReason, 'Please expand on homework submissions.');
    assert.equal(saved, true);
    assert.ok(db.notifications.some(n => n.title === 'Monthly Report Revision Requested' && n.userEmail === 'tutor.emeka@stemulus.com'));
  });

  it('approveAndSendMonthlyReport completes review workflow, queues email and updates timeline', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-99', firstName: 'Kene', lastName: 'Okonkwo', parentEmail: 'kene.parent@example.com' }
      ],
      monthlyReports: [
        {
          id: 'rep-app-1',
          studentId: 'stu-99',
          studentName: 'Kene Okonkwo',
          parentEmail: 'kene.parent@example.com',
          tutorEmail: 'tutor.kene@stemulus.com',
          tutorName: 'Coach John',
          course: 'Creative Coding',
          month: 'October 2026',
          overallGrade: 'A+',
          status: 'pending_review',
          strengths: 'Exceptional visual aesthetics'
        }
      ],
      progressReports: [],
      notifications: [],
      emailQueue: []
    };

    const approved = approveAndSendMonthlyReport('rep-app-1', { adminNotes: 'Outstanding progress verified.' }, db, mockStorage, { email: 'admin@stemulus.com' });
    assert.equal(approved.status, 'sent_to_parent');
    assert.equal(approved.approvalTimeline.directorEmail, 'admin@stemulus.com');
    assert.equal(approved.approvalTimeline.directorNote, 'Outstanding progress verified.');
    assert.equal(db.progressReports.length, 1);
    assert.equal(db.progressReports[0].grade, 'A+');
    assert.ok(db.notifications.some(n => n.title.includes('Official Monthly Progress Report Ready')));
    assert.ok(db.emailQueue.some(eq => eq.type === 'monthly_report' && eq.to === 'kene.parent@example.com'));
    assert.ok(db.notifications.some(n => n.title === 'Monthly Report Dispatched to Parent'));
    assert.equal(saved, true);
  });

  it('generateWeeklyReport and generateAllWeeklyReports aggregate 7-day sessions accurately', () => {
    const today = new Date().toISOString().split('T')[0];
    const db = {
      students: [
        { id: 'stu-w1', firstName: 'Chidi', lastName: 'Mokeme', status: 'active', tutorName: 'Coach Alex', parentEmail: 'chidi.p@example.com' }
      ],
      schedules: [
        {
          id: 'sch-w1',
          studentId: 'stu-w1',
          studentName: 'Chidi Mokeme',
          date: today,
          topic: 'Functions in Python',
          attendanceStatus: 'present',
          conceptGrasp: 5,
          tutorComment: 'Mastered function returns.'
        }
      ]
    };

    const report = generateWeeklyReport('stu-w1', db);
    assert.ok(report);
    assert.equal(report.studentName, 'Chidi Mokeme');
    assert.equal(report.sessionsTotal, 1);
    assert.equal(report.sessionsAttended, 1);
    assert.equal(report.averageConceptGrasp, 5);
    assert.equal(report.status, 'draft');

    const all = generateAllWeeklyReports(db);
    assert.equal(all.length, 1);
    assert.equal(all[0].studentId, 'stu-w1');
  });
});
