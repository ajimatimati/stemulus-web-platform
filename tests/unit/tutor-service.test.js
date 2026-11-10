import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_DEFAULT_TUTORS,
  getCanonicalWeeklySchedules,
  resolveTutorDetails,
  getTutors,
  updateTutor,
  deleteTutor,
  updateTutorStatus,
  getTutorStudents,
  validateTutorBanking,
  auditTutorAccounts,
  formatBankDossier
} from '../../src/features/tutor-management/tutor-service.js';

describe('Tutor Management & Banking Audits Feature Service Suite', () => {
  it('CORE_DEFAULT_TUTORS contains verified faculty list with complete attributes', () => {
    assert.ok(Array.isArray(CORE_DEFAULT_TUTORS));
    assert.ok(CORE_DEFAULT_TUTORS.length >= 7);
    const olalekan = CORE_DEFAULT_TUTORS.find(t => t.id === 'tut-103');
    assert.ok(olalekan);
    assert.equal(olalekan.name, 'Olalekan Israel Ajimati');
    assert.equal(olalekan.bankName, 'GTBank');
    assert.equal(olalekan.accountNumber, '0123456789');
    assert.ok(olalekan.workstationAudit.includes('Solar Inverter'));
  });

  it('getCanonicalWeeklySchedules deduplicates recurring weekly slots by composite key', () => {
    const db = {
      schedules: [
        { id: 'sch-1', studentId: 'stu-1', dayOfWeek: 'Tuesday', time: '16:00', duration: '60', status: 'active' },
        { id: 'sch-2', studentId: 'stu-1', dayOfWeek: 'Tuesday', time: '16:00', duration: '60', status: 'active' },
        { id: 'sch-3', studentId: 'stu-1', dayOfWeek: 'Thursday', time: '16:00', duration: '60', status: 'active' }
      ]
    };

    const canonical = getCanonicalWeeklySchedules(db);
    assert.equal(canonical.length, 2);
    assert.ok(canonical.some(s => s.dayOfWeek === 'Tuesday'));
    assert.ok(canonical.some(s => s.dayOfWeek === 'Thursday'));
  });

  it('resolveTutorDetails identifies tutor by email, altEmail, id, name, and token', () => {
    const db = {
      tutors: [
        { id: 'tut-103', name: 'Olalekan Israel Ajimati', email: 'olalekan@stemuluskidstech.com', altEmail: 'ajimatimati@gmail.com' }
      ]
    };

    // Exact email
    const byEmail = resolveTutorDetails('olalekan@stemuluskidstech.com', db);
    assert.ok(byEmail);
    assert.equal(byEmail.id, 'tut-103');

    // Alt email
    const byAltEmail = resolveTutorDetails('ajimatimati@gmail.com', db);
    assert.ok(byAltEmail);
    assert.equal(byAltEmail.id, 'tut-103');

    // ID
    const byId = resolveTutorDetails('tut-103', db);
    assert.ok(byId);
    assert.equal(byId.name, 'Olalekan Israel Ajimati');

    // Name token
    const byToken = resolveTutorDetails('Ajimati', db);
    assert.ok(byToken);
    assert.equal(byToken.id, 'tut-103');
  });

  it('getTutors aggregates faculty, filters deleted records, and computes weekly workloads', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      tutors: [],
      deletedTutorEmails: ['deleted.tutor@stemulus.com'],
      schedules: [
        {
          studentId: 'stu-1',
          tutorEmail: 'olalekan@stemuluskidstech.com',
          dayOfWeek: 'Tuesday',
          time: '16:00',
          duration: '60',
          status: 'active'
        }
      ]
    };

    const tutors = getTutors(db, mockStorage);
    assert.ok(Array.isArray(tutors));
    assert.ok(tutors.length >= 7);

    const olalekan = tutors.find(t => t.email === 'olalekan@stemuluskidstech.com');
    assert.ok(olalekan);
    assert.equal(olalekan.weeklySessions, 1);
    assert.equal(olalekan.weeklyHours, 1);
    assert.equal(saved, true);
  });

  it('updateTutor modifies fields and synchronizes user collection', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      tutors: [
        { id: 'tut-edit-1', name: 'Initial Name', email: 'coach.edit@stemulus.com', phone: '08000000000' }
      ],
      users: {
        'coach.edit@stemulus.com': { name: 'Initial Name', phone: '08000000000' }
      }
    };

    const updated = updateTutor('tut-edit-1', {
      name: 'Verified Coach Name',
      phone: '08111111111'
    }, db, mockStorage);

    assert.ok(updated);
    assert.equal(updated.name, 'Verified Coach Name');
    assert.equal(db.users['coach.edit@stemulus.com'].name, 'Verified Coach Name');
    assert.equal(db.users['coach.edit@stemulus.com'].phone, '08111111111');
    assert.equal(saved, true);
  });

  it('deleteTutor purges records and unassigns from students', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      tutors: [
        { id: 'tut-del-1', email: 'coach.del@stemulus.com', name: 'Coach To Delete' }
      ],
      users: {
        'coach.del@stemulus.com': { name: 'Coach To Delete' }
      },
      students: [
        { id: 'stu-1', name: 'Student One', tutorId: 'tut-del-1', tutorEmail: 'coach.del@stemulus.com', tutorName: 'Coach To Delete' }
      ]
    };

    const res = deleteTutor('tut-del-1', db, mockStorage);
    assert.equal(res, true);
    assert.equal(db.tutors.length, 0);
    assert.equal(db.users['coach.del@stemulus.com'], undefined);
    assert.equal(db.students[0].tutorName, 'Unassigned');
    assert.equal(db.students[0].tutorEmail, '');
    assert.ok(db.deletedTutorIds.includes('tut-del-1'));
    assert.equal(saved, true);
  });

  it('updateTutorStatus sets tutor status in users map', () => {
    let saved = false;
    const mockStorage = {
      save: () => { saved = true; }
    };
    const db = {
      users: {
        'coach.status@stemulus.com': { role: 'tutor', status: 'active' }
      }
    };

    const res = updateTutorStatus('coach.status@stemulus.com', 'suspended', db, mockStorage);
    assert.equal(res, true);
    assert.equal(db.users['coach.status@stemulus.com'].status, 'suspended');
    assert.equal(saved, true);
  });

  it('getTutorStudents resolves assigned students or all for admin role', () => {
    const db = {
      tutors: [
        { id: 'tut-target', name: 'Coach Target', email: 'coach.target@stemulus.com' }
      ],
      students: [
        { id: 'stu-a', tutorId: 'tut-target', tutorEmail: 'coach.target@stemulus.com', tutorName: 'Coach Target' },
        { id: 'stu-b', tutorId: 'tut-other', tutorEmail: 'other@stemulus.com', tutorName: 'Coach Other' }
      ]
    };

    // Tutor view
    const tutorStudents = getTutorStudents('coach.target@stemulus.com', db);
    assert.equal(tutorStudents.length, 1);
    assert.equal(tutorStudents[0].id, 'stu-a');

    // Admin view
    const adminSession = { role: 'admin', email: 'admin@stemuluskidstech.com' };
    const adminStudents = getTutorStudents('admin', db, adminSession);
    assert.equal(adminStudents.length, 2);
  });

  it('validateTutorBanking enforces Nigerian NUBAN standards and account holder presence', () => {
    // Valid account
    const res1 = validateTutorBanking({
      bankName: 'GTBank',
      accountNumber: '0123456789',
      accountHolderName: 'Olalekan Israel Ajimati'
    });
    assert.equal(res1.valid, true);
    assert.equal(res1.errors.length, 0);

    // Invalid account (too short)
    const res2 = validateTutorBanking({
      bankName: 'Access Bank',
      accountNumber: '12345',
      accountHolderName: 'Test Name'
    });
    assert.equal(res2.valid, false);
    assert.ok(res2.errors.some(e => e.includes('exactly 10 digits')));

    // Missing bank name
    const res3 = validateTutorBanking({
      bankName: '',
      accountNumber: '0123456789',
      accountHolderName: 'Test Name'
    });
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some(e => e.includes('Bank name is required')));
  });

  it('auditTutorAccounts summarizes banking compliance and workstation audit metrics', () => {
    const db = {
      tutors: [
        {
          id: 'tut-comp',
          name: 'Compliant Tutor',
          email: 'comp@stemulus.com',
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountHolderName: 'Compliant Tutor',
          workstationAudit: 'High-Performance 16GB RAM Fiber Inverter'
        },
        {
          id: 'tut-incomp',
          name: 'Incomplete Tutor',
          email: 'incomp@stemulus.com',
          bankName: '',
          accountNumber: '',
          accountHolderName: '',
          workstationAudit: ''
        }
      ]
    };

    const audit = auditTutorAccounts(db);
    assert.ok(audit.totalTutors >= 2);
    assert.ok(audit.fullyCompliantCount >= 1);
    assert.ok(typeof audit.complianceRate === 'number');
  });

  it('formatBankDossier formats clean string representation of banking details', () => {
    const formatted = formatBankDossier({
      bankName: 'Wema Bank',
      accountNumber: '0128062292',
      accountHolderName: 'STEMulus Kids Tech'
    });
    assert.equal(formatted, 'Wema Bank - 0128062292 (STEMulus Kids Tech)');
  });
});
