import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Load dashboard-engine in a mocked browser-like environment
const engineCode = fs.readFileSync('assets/js/dashboard-engine.js', 'utf8');

// Setup minimal globals
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
  dispatchEvent: () => {},
  CustomEvent: class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } }
};

// Evaluate dashboard engine
eval(engineCode);
const DE = globalThis.DashboardEngine;

test('Automated Credentials & Onboarding Engine Suite', async (t) => {
  await t.test('Auto-generates clean, domain-appropriate usernames', () => {
    const tutorUsername = DE.generateAutoUsername('Dr. Michael Faraday', 'tutor');
    assert.match(tutorUsername, /^michael\.faraday[0-9]*@stemuluskidstech\.com$/);

    const parentUsername = DE.generateAutoUsername('Mrs. Funke Adeyemi', 'parent');
    assert.match(parentUsername, /^funke\.adeyemi[0-9]*@parent\.stemuluskidstech\.com$/);
  });

  await t.test('Auto-generates high-entropy secure passwords meeting all complexity policies', () => {
    const pwd = DE.generateAutoPassword();
    assert.ok(pwd.startsWith('STEM-'), 'Password should begin with STEM- prefix');
    assert.ok(pwd.length >= 14, 'Password should have at least 14 characters');
    assert.match(pwd, /[A-Z]/, 'Password should have uppercase characters');
    assert.match(pwd, /[a-z]/, 'Password should have lowercase characters');
    assert.match(pwd, /[0-9]/, 'Password should have digits');
    assert.match(pwd, /[!@#$%&*]/, 'Password should have special characters');
  });

  await t.test('addUser auto-generates username & password and registers tutor in database', async () => {
    const result = await DE.addUser({
      name: 'Adaeze Okonkwo',
      role: 'tutor',
      phone: '+2348011223344',
      subjects: ['Python Programming Foundations', 'AI for Kids']
    });

    assert.equal(result.success, true);
    assert.ok(result.email.includes('@stemuluskidstech.com'));
    assert.ok(result.tempPassword.startsWith('STEM-'));

    const db = DE.getDB();
    assert.ok(db.users[result.email], 'User must exist in db.users');
    assert.equal(db.users[result.email].role, 'tutor');

    const tutorRecord = (db.tutors || []).find(t => t.email === result.email);
    assert.ok(tutorRecord, 'Tutor record must exist in db.tutors');
    assert.equal(tutorRecord.name, 'Adaeze Okonkwo');
  });

  await t.test('addUser auto-generates username & password and registers parent in database', async () => {
    const result = await DE.addUser({
      name: 'Babatunde Fashola',
      role: 'parent',
      phone: '+2348022334455'
    });

    assert.equal(result.success, true);
    assert.ok(result.email.includes('@parent.stemuluskidstech.com'));
    assert.ok(result.tempPassword.startsWith('STEM-'));

    const db = DE.getDB();
    assert.ok(db.users[result.email], 'User must exist in db.users');
    assert.equal(db.users[result.email].role, 'parent');

    const parentRecord = (db.parents || []).find(p => p.email === result.email);
    assert.ok(parentRecord, 'Parent record must exist in db.parents');
    assert.equal(parentRecord.name, 'Babatunde Fashola');
  });

  await t.test('quickOnboardUser queues draft welcome email for tutor in db.emailQueue', async () => {
    const res = await DE.quickOnboardUser({
      type: 'tutor',
      name: 'Chinedu Eze',
      program: 'Web Development & Robotics'
    });

    assert.equal(res.success, true);
    assert.ok(res.email.includes('@stemuluskidstech.com'));
    assert.ok(res.tempPassword.startsWith('STEM-'));

    const db = DE.getDB();
    const queuedEmail = (db.emailQueue || []).find(q => q.to === res.email);
    assert.ok(queuedEmail, 'Email must be saved in db.emailQueue');
    assert.equal(queuedEmail.status, 'draft', 'Email must remain in draft status for admin review');
    assert.equal(queuedEmail.type, 'tutor-welcome');
    assert.equal(queuedEmail.data.tempPassword, res.tempPassword);
    assert.ok(queuedEmail.htmlPreview.includes(res.tempPassword));
  });

  await t.test('quickOnboardUser queues draft welcome email for student & parent in db.emailQueue', async () => {
    const res = await DE.quickOnboardUser({
      type: 'student',
      name: 'Grace Hopper Parent',
      childName: 'Little Grace',
      childAge: '9',
      program: 'Scratch Creators'
    });

    assert.equal(res.success, true);
    assert.ok(res.parentEmail.includes('@parent.stemuluskidstech.com'));
    assert.ok(res.tempPassword.startsWith('STEM-'));

    const db = DE.getDB();
    const queuedEmail = (db.emailQueue || []).find(q => q.to === res.parentEmail);
    assert.ok(queuedEmail, 'Email must be saved in db.emailQueue');
    assert.equal(queuedEmail.status, 'draft', 'Email must remain in draft status for admin review');
    assert.equal(queuedEmail.type, 'welcome');
    assert.equal(queuedEmail.data.tempPassword, res.tempPassword);
    assert.equal(queuedEmail.data.studentName, 'Little Grace');
  });
});
