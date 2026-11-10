import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMeetingSession } from '../../src/features/classroom/classroom-service.js';

describe('Direct Meeting Sessions & Portal Cleanliness Suite', () => {
  beforeEach(() => {
    global.localStorage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    };
    global.window = {
      open: () => ({ closed: false }),
      location: { href: '' }
    };
  });

  describe('Pillar 1: Meeting Session Accessories & Direct Launch', () => {
    it('launchMeetingSession records 1080p safeguarding telemetry metadata', () => {
      const res = launchMeetingSession({
        scheduleId: 'sch-101',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        studentName: 'Chinedu Eze',
        courseName: 'Python Software Engineering',
        tutorName: 'Abdulwahab Mentor',
        role: 'tutor'
      });

      assert.equal(res.success, true);
      assert.equal(res.meetingUrl, 'https://meet.google.com/abc-defg-hij');

      const recRaw = global.localStorage.getItem('stemulus_recorded_sessions');
      assert.ok(recRaw, 'Recorded sessions key should be populated');
      const recList = JSON.parse(recRaw);
      assert.equal(recList.length, 1);
      assert.equal(recList[0].scheduleId, 'sch-101');
      assert.equal(recList[0].student, 'Chinedu Eze');
      assert.equal(recList[0].resolution, '1080p HD');
      assert.equal(recList[0].recordingMode, '1080p_hd_companion_and_cloud');
      assert.equal(recList[0].meetingUrl, 'https://meet.google.com/abc-defg-hij');
    });

    it('launchMeetingSession initiates real-time transcript ingestion buffer', () => {
      launchMeetingSession({
        scheduleId: 'sch-202',
        meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
        studentName: 'Amina Bello',
        courseName: 'Web Wizards',
        tutorName: 'Olalekan Faculty',
        role: 'parent'
      });

      const transRaw = global.localStorage.getItem('stemulus_session_transcripts');
      assert.ok(transRaw, 'Transcripts key should be populated');
      const transList = JSON.parse(transRaw);
      assert.equal(transList.length, 1);
      assert.equal(transList[0].scheduleId, 'sch-202');
      assert.equal(transList[0].student, 'Amina Bello');
      assert.equal(transList[0].active, true);
      assert.equal(transList[0].status, 'Live Ingestion');
      assert.equal(transList[0].meetingUrl, 'https://meet.google.com/xyz-uvwx-rst');
    });

    it('falls back gracefully to default Meet URL if missing or invalid', () => {
      const res = launchMeetingSession({
        meetingUrl: 'javascript:void(0)'
      });

      assert.equal(res.meetingUrl, 'https://meet.google.com');
    });
  });

  describe('Pillar 2: Archival & Retirement of LMS, Pass, and Slides', () => {
    it('verifies academy.html, learner-hub.html, and curriculum/ are removed from active root', () => {
      assert.equal(fs.existsSync('academy.html'), false, 'academy.html should not exist in active root');
      assert.equal(fs.existsSync('learner-hub.html'), false, 'learner-hub.html should not exist in active root');
      assert.equal(fs.existsSync('curriculum'), false, 'curriculum/ directory should not exist in active root');
    });

    it('verifies original files are safely preserved in archive/ directory', () => {
      assert.equal(fs.existsSync('archive/academy.html'), true, 'archive/academy.html must exist');
      assert.equal(fs.existsSync('archive/learner-hub.html'), true, 'archive/learner-hub.html must exist');
      assert.equal(fs.existsSync('archive/join-class.html'), true, 'archive/join-class.html must exist');
      assert.equal(fs.existsSync('archive/curriculum/slides'), true, 'archive/curriculum/slides must exist');
      assert.equal(fs.existsSync('archive/assets/js/lms-quest-engine.js'), true, 'archive/assets/js/lms-quest-engine.js must exist');
      assert.equal(fs.existsSync('archive/assets/js/stemulus-pass-engine.js'), true, 'archive/assets/js/stemulus-pass-engine.js must exist');
    });

    it('verifies join-class.html in root is now an autonomous redirector', () => {
      const joinClassContent = fs.readFileSync('join-class.html', 'utf8');
      assert.ok(joinClassContent.includes('Connecting to Live Classroom'));
      assert.ok(joinClassContent.includes('window.location.replace(targetMeetingUrl)'));
      assert.ok(joinClassContent.includes('stemulus_recorded_sessions'));
      assert.ok(joinClassContent.includes('stemulus_session_transcripts'));
    });
  });

  describe('Pillar 3: Dashboard Navigation & Link Sanitation', () => {
    it('verifies tutor-dashboard.html has 0 references to academy, learner-hub, or curriculum/slides', () => {
      const content = fs.readFileSync('tutor-dashboard.html', 'utf8');
      assert.equal(content.includes('academy.html'), false);
      assert.equal(content.includes('learner-hub.html'), false);
      assert.equal(content.includes('curriculum/slides'), false);
      assert.equal(content.includes('STEMulus Quest LMS Hub'), false);
    });

    it('verifies parent-dashboard.html has 0 references to curriculum/slides or prompt_lab', () => {
      const content = fs.readFileSync('parent-dashboard.html', 'utf8');
      assert.equal(content.includes('curriculum/slides'), false);
      assert.equal(content.includes('curriculum/prompt_lab'), false);
    });

    it('verifies admin-dashboard.html has 0 references to curriculum/slides', () => {
      const content = fs.readFileSync('admin-dashboard.html', 'utf8');
      assert.equal(content.includes('curriculum/slides'), false);
    });

    it('verifies index.html has 0 references to academy.html', () => {
      const content = fs.readFileSync('index.html', 'utf8');
      assert.equal(content.includes('academy.html'), false);
    });

    it('verifies netlify.toml has 301 redirect rules for retired routes', () => {
      const content = fs.readFileSync('netlify.toml', 'utf8');
      assert.ok(content.includes('from = "/academy.html"'));
      assert.ok(content.includes('from = "/learner-hub.html"'));
      assert.ok(content.includes('from = "/curriculum/*"'));
    });
  });

  describe('Pillar 4: 1-Click Email Join, T+3-5m Monitoring, 10m & 5m Reminders, and Pre-Filled Projects', () => {
    it('verifies netlify/functions/join-session.js provides 1-click email join with ntfy and Firestore presence + late-join email queuing', () => {
      assert.equal(fs.existsSync('netlify/functions/join-session.js'), true);
      const fnContent = fs.readFileSync('netlify/functions/join-session.js', 'utf8');
      assert.ok(fnContent.includes('statusCode: 302'));
      assert.ok(fnContent.includes('https://ntfy.sh/'));
      assert.ok(fnContent.includes('live_presence'));
      assert.ok(fnContent.includes('email_queue'));
      assert.ok(fnContent.includes('admin@stemuluskidstech.com'));
    });

    it('verifies class-escalation-engine.js sends ntfy on join and detects late/absent between T+3m and T+5m', () => {
      const escContent = fs.readFileSync('assets/js/class-escalation-engine.js', 'utf8');
      assert.ok(escContent.includes('alertedTutorJoined'));
      assert.ok(escContent.includes('alertedStudentJoined'));
      assert.ok(escContent.includes('diffMinutes >= 3'));
      assert.ok(escContent.includes('lateJoinMins >= 3'));
      assert.ok(escContent.includes('syncRemotePresenceFromFirestore'));
    });

    it('verifies class-reminder-engine.js and auto-reminders.js support both 10m and 5m pre-session reminders with 1-click Join Now links', () => {
      const remContent = fs.readFileSync('assets/js/class-reminder-engine.js', 'utf8');
      assert.ok(remContent.includes('FIVE_MINUTES_MS'));
      assert.ok(remContent.includes('TEN_MINUTES_MS'));
      assert.ok(remContent.includes('show5MinuteModal'));
      assert.ok(remContent.includes('show10MinuteModal'));

      const autoRemContent = fs.readFileSync('netlify/functions/auto-reminders.js', 'utf8');
      assert.ok(autoRemContent.includes('10m'));
      assert.ok(autoRemContent.includes('5m'));
    });

    it('verifies monthly-report-engine.js and tutor-engine.js pre-fill submitted projects and allow adding more', () => {
      const mrContent = fs.readFileSync('assets/js/monthly-report-engine.js', 'utf8');
      assert.ok(mrContent.includes('getSubmittedProjectsForStudent'));
      const teContent = fs.readFileSync('assets/js/tutor-engine.js', 'utf8');
      assert.ok(teContent.includes('prefillMonthlyReportProjects'));
      assert.ok(teContent.includes('addMonthlyReportProjectRow'));
    });
  });
});
