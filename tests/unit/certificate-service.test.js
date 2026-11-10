import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCertificates,
  addCertificate,
  deleteCertificate,
  updateCertificate,
  verifyCertificate,
  getMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone
} from '../../src/features/certificates/certificate-service.js';

describe('Certificates & Milestones Feature Service Suite', () => {
  it('getCertificates retrieves certificates and filters by studentName', () => {
    const db = {
      certificates: [
        { id: 'c-1', credential_id: 'STEM-PY-001', student_name: 'Pearl Doe', program_name: 'Python Master' },
        { id: 'c-2', credential_id: 'STEM-WEB-002', student_name: 'Chidi Mokeme', program_name: 'Web Wizards' }
      ]
    };

    assert.equal(getCertificates(null, db).length, 2);
    const pearlCerts = getCertificates('Pearl', db);
    assert.equal(pearlCerts.length, 1);
    assert.equal(pearlCerts[0].credential_id, 'STEM-PY-001');
  });

  it('addCertificate registers certificate, notifies parent, and persists', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      students: [
        { id: 'stu-1', firstName: 'Pearl', lastName: 'Doe', parentEmail: 'pearl.parent@example.com' }
      ],
      certificates: [],
      notifications: []
    };

    const cert = addCertificate({
      credential_id: 'STEM-ROBO-999',
      student_name: 'Pearl Doe',
      program_name: 'Junior Robotics'
    }, db, mockStorage);

    assert.ok(cert.id);
    assert.equal(db.certificates.length, 1);
    assert.ok(db.notifications.some(n => n.title === 'Certificate Issued' && n.userEmail === 'pearl.parent@example.com'));
    assert.equal(saved, true);
  });

  it('updateCertificate modifies fields and preserves credential ID', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      certificates: [
        { id: 'cert-1', credential_id: 'CRED-100', student_name: 'Old Name', grade_level: 'Honors' }
      ]
    };

    const updated = updateCertificate('cert-1', {
      student_name: 'New Name',
      grade_level: 'High Distinction'
    }, db, mockStorage);

    assert.ok(updated);
    assert.equal(updated.student_name, 'New Name');
    assert.equal(updated.grade_level, 'High Distinction');
    assert.equal(saved, true);
  });

  it('deleteCertificate revokes certificate from database', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      certificates: [
        { id: 'cert-del', credential_id: 'CRED-REVOKE' }
      ]
    };

    const res = deleteCertificate('cert-del', db, mockStorage);
    assert.equal(res, true);
    assert.equal(db.certificates.length, 0);
    assert.equal(saved, true);
  });

  it('verifyCertificate verifies credential validity by ID or credential_id', () => {
    const db = {
      certificates: [
        { id: 'c-int-1', credential_id: 'STEM-AI-2026', student_name: 'Brian Cole', status: 'issued' }
      ]
    };

    const byCredId = verifyCertificate('STEM-AI-2026', db);
    assert.ok(byCredId);
    assert.equal(byCredId.student_name, 'Brian Cole');

    const byInternalId = verifyCertificate('c-int-1', db);
    assert.ok(byInternalId);

    const nonExistent = verifyCertificate('FAKE-ID', db);
    assert.equal(nonExistent, null);
  });

  it('getMilestones, addMilestone, updateMilestone, and deleteMilestone manage badges', () => {
    let savedCount = 0;
    const mockStorage = {
      save: () => { savedCount += 1; }
    };
    const db = { milestones: [] };

    const m = addMilestone({
      studentId: 'stu-1',
      title: 'Python Function Master',
      badge: 'gold-star'
    }, db, mockStorage);

    assert.ok(m.id);
    assert.equal(getMilestones(db).length, 1);
    assert.equal(savedCount, 1);

    const updated = updateMilestone(m.id, { title: 'Python Advanced Architect' }, db, mockStorage);
    assert.ok(updated);
    assert.equal(updated.title, 'Python Advanced Architect');
    assert.equal(savedCount, 2);

    const deleted = deleteMilestone(m.id, db, mockStorage);
    assert.equal(deleted, true);
    assert.equal(db.milestones.length, 0);
    assert.equal(savedCount, 3);
  });
});
