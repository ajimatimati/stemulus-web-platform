import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStudents,
  getParents,
  addStudent,
  updateStudent,
  deleteStudent,
  setRemindersPaused,
  updateStudentStatus,
  getEnrollments,
  addEnrollment,
  approveEnrollment
} from '../../src/features/students/student-service.js';

describe('Student Management & Enrollments Feature Service Suite', () => {
  it('getStudents retrieves students and filters by parentEmail or session', () => {
    const db = {
      students: [
        { id: 'stu-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl.parent@example.com' },
        { id: 'stu-2', firstName: 'David', lastName: 'Okonkwo', parentEmail: 'david.parent@example.com' }
      ]
    };

    // Filter by explicit parent email
    const res1 = getStudents('pearl.parent@example.com', db);
    assert.equal(res1.length, 1);
    assert.equal(res1[0].firstName, 'Pearl');

    // Filter by session role parent
    const parentSession = { role: 'parent', email: 'david.parent@example.com' };
    const res2 = getStudents(null, db, parentSession);
    assert.equal(res2.length, 1);
    assert.equal(res2[0].firstName, 'David');

    // All students
    const res3 = getStudents(null, db);
    assert.equal(res3.length, 2);
  });

  it('getParents aggregates parents from user accounts and enrolled student records', () => {
    const db = {
      users: {
        'parent.one@example.com': { role: 'parent', name: 'Parent One', phone: '08011112222' }
      },
      students: [
        { id: 'stu-10', firstName: 'Emeka', lastName: 'One', parentEmail: 'parent.one@example.com', parentName: 'Parent One', program: 'Scratch' },
        { id: 'stu-20', firstName: 'Chioma', lastName: 'Two', parentEmail: 'parent.two@example.com', parentName: 'Parent Two', program: 'Python', parentPhone: '08033334444' }
      ]
    };

    const parents = getParents(db);
    assert.equal(parents.length, 2);

    const p1 = parents.find(p => p.email === 'parent.one@example.com');
    assert.ok(p1);
    assert.equal(p1.children.length, 1);
    assert.equal(p1.children[0].name, 'Emeka One');

    const p2 = parents.find(p => p.email === 'parent.two@example.com');
    assert.ok(p2);
    assert.equal(p2.phone, '08033334444');
    assert.equal(p2.children[0].name, 'Chioma Two');
  });

  it('addStudent registers student, initializes metrics, and resolves tutor assignment', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [],
      tutors: [
        { id: 'tut-103', name: 'Olalekan Israel Ajimati', email: 'olalekan@stemuluskidstech.com' }
      ]
    };

    const s = addStudent({
      firstName: 'Joshua',
      lastName: 'Adebayo',
      age: 10,
      parentEmail: 'adebayo.p@example.com',
      parentName: 'Mr. Adebayo',
      program: 'Full-Stack Web Development',
      tutorName: 'Olalekan Israel Ajimati'
    }, db, mockStorage);

    assert.ok(s.id);
    assert.equal(s.tutorEmail, 'olalekan@stemuluskidstech.com');
    assert.equal(s.tutorId, 'tut-103');
    assert.equal(s.status, 'active');
    assert.equal(s.progress, 0);
    assert.ok(s.skills.logic >= 50);
    assert.equal(db.students.length, 1);
    assert.equal(saved, true);
  });

  it('updateStudent modifies student details and synchronizes pending scheduled classes', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-edit-1', firstName: 'Kene', lastName: 'Eze', tutorName: 'Sarah Jane', tutorEmail: 'tutor@stemulus.com', tutorId: 'tut-101' }
      ],
      tutors: [
        { id: 'tut-102', name: 'David Okon', email: 'david.okon@stemuluskidstech.com' }
      ],
      schedules: [
        { id: 'sch-k1', studentId: 'stu-edit-1', studentName: 'Kene Eze', mentor: 'Sarah Jane', status: 'scheduled' }
      ]
    };

    const updated = updateStudent('stu-edit-1', {
      tutorName: 'David Okon'
    }, db, mockStorage);

    assert.ok(updated);
    assert.equal(updated.tutorName, 'David Okon');
    assert.equal(updated.tutorEmail, 'david.okon@stemuluskidstech.com');
    assert.equal(updated.tutorId, 'tut-102');
    assert.equal(db.schedules[0].mentor, 'David Okon');
    assert.equal(saved, true);
  });

  it('deleteStudent removes student from active roster and records deleted id', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-del-1', firstName: 'Delete', lastName: 'Me' }
      ],
      deletedStudentIds: []
    };

    const res = deleteStudent('stu-del-1', db, mockStorage);
    assert.equal(res, true);
    assert.equal(db.students.length, 0);
    assert.ok(db.deletedStudentIds.includes('stu-del-1'));
    assert.equal(saved, true);
  });

  it('setRemindersPaused and updateStudentStatus control reminder states and lifecycle', () => {
    let savedCount = 0;
    const mockStorage = {
      save: () => { savedCount += 1; }
    };
    const db = {
      students: [
        { id: 'stu-status-1', status: 'active', remindersPaused: false }
      ]
    };

    const resPause = setRemindersPaused('stu-status-1', true, db, mockStorage);
    assert.equal(resPause, true);
    assert.equal(db.students[0].remindersPaused, true);

    const resStatus = updateStudentStatus('stu-status-1', 'graduated', db, mockStorage);
    assert.equal(resStatus, true);
    assert.equal(db.students[0].status, 'graduated');
    assert.equal(savedCount, 2);
  });

  it('getEnrollments, addEnrollment, and approveEnrollment manage admissions workflow', async () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      enrollments: [],
      students: [],
      schedules: [],
      users: {},
      notifications: []
    };

    const enr = addEnrollment({
      studentFirstName: 'Alexandra',
      studentLastName: 'Cole',
      studentAge: '11',
      studentGender: 'Female',
      program: 'Artificial Intelligence and Machine Learning',
      email: 'parent.alex@example.com',
      parentName: 'Mrs. Cole'
    }, db, mockStorage);

    assert.ok(enr.id);
    assert.equal(enr.status, 'pending');
    assert.equal(getEnrollments(db).length, 1);

    const student = await approveEnrollment(enr.id, db, mockStorage);
    assert.ok(student);
    assert.equal(student.firstName, 'Alexandra');
    assert.equal(student.status, 'active');
    assert.equal(db.students.length, 1);
    assert.equal(db.schedules.length, 1);
    assert.ok(db.users['parent.alex@example.com']);
    assert.equal(db.users['parent.alex@example.com'].role, 'parent');
    assert.ok(db.notifications.some(n => n.title === 'Student Registered!'));
    assert.ok(db.notifications.some(n => n.title === 'Your Portal Login Credentials'));
    assert.equal(saved, true);
  });
});
