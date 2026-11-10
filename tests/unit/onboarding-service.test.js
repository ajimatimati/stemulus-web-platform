import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  generateAutoUsername,
  generateAutoPassword,
  quickOnboardUser
} from '../../src/features/onboarding/onboarding-service.js';

test('Onboarding Feature Service Suite', async (t) => {
  await t.test('generateAutoUsername derives domain-specific usernames for tutors and parents', () => {
    const tutorEmail = generateAutoUsername('Dr. Michael Faraday', 'tutor');
    assert.match(tutorEmail, /^michael\.faraday[0-9]*@stemuluskidstech\.com$/);

    const parentEmail = generateAutoUsername('Mrs. Funke Adeyemi', 'parent');
    assert.match(parentEmail, /^funke\.adeyemi[0-9]*@parent\.stemuluskidstech\.com$/);
  });

  await t.test('generateAutoUsername resolves collisions cleanly', () => {
    const existing = {
      'michael.faraday@stemuluskidstech.com': true
    };
    const collided = generateAutoUsername('Dr. Michael Faraday', 'tutor', existing);
    assert.notEqual(collided, 'michael.faraday@stemuluskidstech.com');
    assert.match(collided, /^michael\.faraday[0-9]+@stemuluskidstech\.com$/);
  });

  await t.test('generateAutoPassword produces high-entropy policy-compliant passwords', () => {
    const pwd = generateAutoPassword();
    assert.ok(pwd.startsWith('STEM-'), 'Password should begin with STEM-');
    assert.ok(pwd.length >= 14, 'Password should have minimum 14 characters');
    assert.match(pwd, /[A-Z]/, 'Password should contain uppercase character');
    assert.match(pwd, /[a-z]/, 'Password should contain lowercase character');
    assert.match(pwd, /[0-9]/, 'Password should contain numeric character');
    assert.match(pwd, /[!@#$%&*]/, 'Password should contain special character');
  });

  await t.test('hashPassword computes deterministic SHA-256 strings', async () => {
    const hash1 = await hashPassword('SecretPass123!');
    const hash2 = await hashPassword('SecretPass123!');
    assert.equal(hash1, hash2);
    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64);
  });

  await t.test('quickOnboardUser provisions tutor and queues welcome email', async () => {
    const mockDB = {
      users: {},
      students: [],
      tutors: [],
      emailQueue: []
    };
    const mockStorage = {
      getDB: () => mockDB,
      saveDB: (db) => true,
      syncDocument: async () => true
    };

    const res = await quickOnboardUser({
      type: 'tutor',
      name: 'Engr. Ada Lovelace',
      phone: '+2348011223344',
      program: 'Robotics & AI'
    }, mockDB, mockStorage);

    assert.equal(res.success, true);
    assert.equal(res.type, 'tutor');
    assert.match(res.email, /^ada\.lovelace[0-9]*@stemuluskidstech\.com$/);
    assert.ok(mockDB.users[res.email]);
    assert.equal(mockDB.users[res.email].role, 'tutor');
    assert.equal(mockDB.tutors.length, 1);
    assert.equal(mockDB.emailQueue.length, 1);
    assert.equal(mockDB.emailQueue[0].status, 'draft');
    assert.equal(mockDB.emailQueue[0].to, res.email);
  });

  await t.test('quickOnboardUser provisions student and parent and queues welcome credentials', async () => {
    const mockDB = {
      users: {},
      students: [],
      schedules: [],
      emailQueue: []
    };
    const mockStorage = {
      getDB: () => mockDB,
      saveDB: (db) => true,
      syncDocument: async () => true
    };

    const res = await quickOnboardUser({
      type: 'student',
      name: 'Chief Obafemi Awolowo',
      childName: 'Segun Awolowo',
      childAge: 11,
      program: 'Web Development Foundations',
      phone: '+2348099887766'
    }, mockDB, mockStorage);

    assert.equal(res.success, true);
    assert.equal(res.type, 'student_parent');
    assert.match(res.parentEmail, /^obafemi\.awolowo[0-9]*@parent\.stemuluskidstech\.com$/);
    assert.ok(mockDB.users[res.parentEmail]);
    assert.equal(mockDB.students.length, 1);
    assert.equal(mockDB.students[0].firstName, 'Segun');
    assert.equal(mockDB.schedules.length, 1);
    assert.equal(mockDB.emailQueue.length, 1);
    assert.equal(mockDB.emailQueue[0].status, 'draft');
    assert.ok(res.studentInviteLink, 'studentInviteLink should be returned');
    assert.ok(res.tutorInviteLink, 'tutorInviteLink should be returned');
    assert.ok(res.enrollmentCode, 'enrollmentCode should be returned');
    assert.ok(Array.isArray(res.draftedAssignments), 'draftedAssignments should be returned');
    assert.ok(res.googleClassroom, 'googleClassroom metadata should be returned');
  });
});
