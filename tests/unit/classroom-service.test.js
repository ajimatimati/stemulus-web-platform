import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGoogleMeetLink,
  normalizeCourseTrack,
  getCourseAssignments,
  generateClassroomMetadata,
  provisionCoderClassroomAndMeet
} from '../../src/features/classroom/classroom-service.js';

describe('Classroom & Meet Provisioning Feature Service Suite', () => {
  it('generateGoogleMeetLink creates valid pattern and avoids collisions', () => {
    const existing = new Set(['https://meet.google.com/abc-defg-hij']);
    const link = generateGoogleMeetLink(existing);

    assert.ok(link.startsWith('https://meet.google.com/'));
    const parts = link.replace('https://meet.google.com/', '').split('-');
    assert.equal(parts.length, 3);
    assert.equal(parts[0].length, 3);
    assert.equal(parts[1].length, 4);
    assert.equal(parts[2].length, 3);
    assert.notEqual(link, 'https://meet.google.com/abc-defg-hij');
  });

  it('normalizeCourseTrack maps varied course titles to canonical curriculum tracks', () => {
    assert.equal(normalizeCourseTrack('Scratch Visual Coding for Kids'), 'scratch');
    assert.equal(normalizeCourseTrack('Python Software Engineering'), 'python');
    assert.equal(normalizeCourseTrack('Full-Stack Web Architecture'), 'fullstack');
    assert.equal(normalizeCourseTrack('Frontend Web Wizards (HTML/CSS/JS)'), 'web');
    assert.equal(normalizeCourseTrack('Arduino C++ Microcontrollers'), 'arduino');
    assert.equal(normalizeCourseTrack('Junior Robotics and Smart Machines'), 'junior_robotics');
    assert.equal(normalizeCourseTrack('Artificial Intelligence and Machine Learning'), 'ai');
    assert.equal(normalizeCourseTrack('Creative Coding and Generative Art'), 'creative_coding');
    assert.equal(normalizeCourseTrack('Digital Art and UI/UX Design'), 'digital_art');
    assert.equal(normalizeCourseTrack('Systems and Linux Shell Scripting'), 'systems');
    assert.equal(normalizeCourseTrack('Unknown Subject'), 'python');
  });

  it('getCourseAssignments drafts syllabus coursework with rubrics and lesson counts', () => {
    const assignments = getCourseAssignments('Python Software Engineering', 4, '998877665544');
    assert.equal(assignments.length, 4);
    assert.equal(assignments[0].lessonNumber, 1);
    assert.equal(assignments[0].trackId, 'python');
    assert.ok(assignments[0].id.includes('998877665544'));
    assert.ok(assignments[0].materials.length >= 2);
    assert.ok(assignments[0].rubric.length >= 3);
    assert.equal(assignments[0].status, 'DRAFT');
  });

  it('generateClassroomMetadata produces Google Classroom course and invite links', () => {
    const meta = generateClassroomMetadata('Bolanle Adeleke', 'Web Wizards', 8);
    assert.ok(meta.classroomId);
    assert.equal(meta.classroomId.length, 12);
    assert.equal(meta.enrollmentCode.length, 7);
    assert.ok(meta.studentInviteLink.includes(meta.classroomId));
    assert.ok(meta.studentInviteLink.includes(meta.enrollmentCode));
    assert.ok(meta.tutorInviteLink.includes('role=teacher'));
    assert.equal(meta.draftedAssignments.length, 8);
    assert.equal(meta.autoProvisioned, true);
  });

  it('provisionCoderClassroomAndMeet enforces 1080p recording, hostless mode, and classroom codes', () => {
    const student = {
      id: 'stud-505',
      firstName: 'Tunde',
      lastName: 'Bakare',
      program: 'Scratch Game Creators'
    };

    let saved = false;
    const mockDb = { students: [student] };
    const mockStorage = { save: () => { saved = true; } };

    const provisioned = provisionCoderClassroomAndMeet(student, 8, mockDb, mockStorage);
    assert.ok(provisioned.meetLink.startsWith('https://meet.google.com/'));
    assert.equal(provisioned.autoRecord, true);
    assert.equal(provisioned.autoRecordEnabled, true);
    assert.equal(provisioned.hostNotRequired, true);
    assert.equal(provisioned.recordingMode, '1080p_hd_companion_and_cloud');
    assert.ok(provisioned.googleClassroom);
    assert.equal(provisioned.classroomCode, provisioned.googleClassroom.enrollmentCode);
    assert.equal(provisioned.classroomLink, provisioned.googleClassroom.studentInviteLink);
    assert.equal(saved, true);
  });
});
