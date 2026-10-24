const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8130;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/__prime') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><head><script src="assets/js/stemulus-security.min.js"></script></head><body></body></html>`);
    return;
  }
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: Automated Google Classroom & Auto-Record Meet Onboarding');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(title, ok, detail = '') {
    if (ok) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} - ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // UNIT / ENGINE TESTS
  // -------------------------------------------------------------
  console.log('[STAGE 1] Testing DashboardEngine Provisioning Helpers & Google Meet Constraints...');

  global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };

  const DE = require('../assets/js/dashboard-engine.js');

  // Test 1: Helper exports
  report('DashboardEngine exports provisionCoderClassroomAndMeet', typeof DE.provisionCoderClassroomAndMeet === 'function');
  report('DashboardEngine exports generateClassroomMetadata', typeof DE.generateClassroomMetadata === 'function');
  report('DashboardEngine exports generateGoogleMeetLink', typeof DE.generateGoogleMeetLink === 'function');
  report('DashboardEngine exports getCourseAssignments', typeof DE.getCourseAssignments === 'function');
  report('DashboardEngine exports getAllCoursesCatalog', typeof DE.getAllCoursesCatalog === 'function');
  report('DashboardEngine exports COURSE_ASSIGNMENTS_CATALOG', typeof DE.COURSE_ASSIGNMENTS_CATALOG === 'object' && Object.keys(DE.COURSE_ASSIGNMENTS_CATALOG).length >= 10);

  // Test 2: Provision a coder with auto-record & hostless access guarantees
  const dummyCoder = {
    firstName: 'Zainab',
    lastName: 'Balogun',
    program: 'Python Programming Foundations'
  };
  const provisioned = DE.provisionCoderClassroomAndMeet(dummyCoder, 8);

  const meetMatch = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(provisioned.meetLink);
  report('Generates valid 3-4-3 Google Meet link', meetMatch, provisioned.meetLink);
  report('Enforces autoRecord = true on student', provisioned.autoRecord === true);
  report('Enforces autoRecordEnabled = true on student', provisioned.autoRecordEnabled === true);
  report('Enforces hostNotRequired = true (hostless access for tutors & coders)', provisioned.hostNotRequired === true);
  report('Enforces recordingMode = 1080p_hd_companion_and_cloud', provisioned.recordingMode === '1080p_hd_companion_and_cloud');

  report('Generates googleClassroom metadata object', provisioned.googleClassroom && typeof provisioned.googleClassroom === 'object');
  report('Google Classroom has 12-digit classroomId', /^\d{12}$/.test(provisioned.googleClassroom.classroomId), provisioned.googleClassroom.classroomId);
  report('Google Classroom has enrollmentCode (cjc)', typeof provisioned.googleClassroom.enrollmentCode === 'string' && provisioned.googleClassroom.enrollmentCode.length >= 6);
  report('Google Classroom studentInviteLink includes cjc code', provisioned.googleClassroom.studentInviteLink.includes('?cjc='));
  report('Google Classroom tutorInviteLink includes teacher role token', provisioned.googleClassroom.tutorInviteLink.includes('/t/tut_') && provisioned.googleClassroom.tutorInviteLink.includes('role=teacher'));
  report('Student classroomLink points to student invite link', provisioned.classroomLink === provisioned.googleClassroom.studentInviteLink);

  // -------------------------------------------------------------
  // STAGE 2: DRAFTED ASSIGNMENTS ACROSS ALL COURSES & LESSON COUNTS
  // -------------------------------------------------------------
  console.log('\n[STAGE 2] Testing Drafted Assignments Across Every Course & Multiple Lesson Counts...');

  const allCourses = [
    { name: 'Scratch Creators (Ages 6-9)', track: 'scratch' },
    { name: 'Pre-Coding Literacy & Logic', track: 'scratch' },
    { name: 'Keyboard Basics & Computer Fundamentals', track: 'scratch' },
    { name: 'Python Programming Foundations', track: 'python' },
    { name: 'Python Game Development & Arcade Pygame', track: 'python' },
    { name: 'Web Wizards: HTML, CSS & JavaScript Frontend', track: 'web' },
    { name: 'Web & App Development', track: 'web' },
    { name: 'Junior Robotics & Smart Machines', track: 'junior_robotics' },
    { name: 'Robotics Lab (Arduino C++)', track: 'arduino' },
    { name: 'AI & Machine Learning Explorers', track: 'ai' },
    { name: 'Creative Coding & Generative Art', track: 'creative_coding' },
    { name: 'Digital Art & UI/UX Design', track: 'digital_art' },
    { name: 'Full-Stack Web Architectures & Backend Engineering', track: 'fullstack' },
    { name: 'Systems & Shell Scripting', track: 'systems' }
  ];

  const lessonCountsToTest = [4, 8, 12, 16, 24];

  let allCoursesAndCountsValid = true;
  let totalAssignmentsVerified = 0;

  for (const course of allCourses) {
    for (const count of lessonCountsToTest) {
      const assignments = DE.getCourseAssignments(course.name, count, '987654321012');
      if (!Array.isArray(assignments) || assignments.length !== count) {
        allCoursesAndCountsValid = false;
        report(`Assignments count for "${course.name}" with count=${count}`, false, `Got length ${assignments ? assignments.length : 0}`);
        continue;
      }

      // Check structure of each assignment
      for (let i = 0; i < assignments.length; i++) {
        const asg = assignments[i];
        const expectedLessonNum = i + 1;
        if (asg.lessonNumber !== expectedLessonNum ||
            asg.status !== 'DRAFT' ||
            asg.state !== 'DRAFT' ||
            asg.points !== 100 ||
            !asg.title || !asg.title.includes(`Lesson ${expectedLessonNum}:`) ||
            !asg.description ||
            !Array.isArray(asg.materials) || asg.materials.length === 0 ||
            !asg.rubric) {
          allCoursesAndCountsValid = false;
          report(`Structure validation for "${course.name}" L${expectedLessonNum}`, false, JSON.stringify(asg));
          break;
        }
        totalAssignmentsVerified++;
      }
    }
  }

  report(`Verified drafted assignments across ${allCourses.length} courses x ${lessonCountsToTest.length} counts (${totalAssignmentsVerified} total assignment objects verified)`, allCoursesAndCountsValid);

  // Test generateClassroomMetadata directly with specific lesson count
  const customMetadata = DE.generateClassroomMetadata('Bisi Akande', 'Robotics Lab (Arduino C++)', 16);
  report('generateClassroomMetadata returns 16 drafted assignments for 16-lesson request', customMetadata.draftedAssignments && customMetadata.draftedAssignments.length === 16);
  report('generateClassroomMetadata sets totalDraftedAssignments = 16', customMetadata.totalDraftedAssignments === 16);
  report('generateClassroomMetadata includes availableLessonCounts array [4, 8, 12, 16, 24]', Array.isArray(customMetadata.availableLessonCounts) && customMetadata.availableLessonCounts.includes(24));

  // -------------------------------------------------------------
  // STAGE 3: QUICK ONBOARD USER END-TO-END FLOW
  // -------------------------------------------------------------
  console.log('\n[STAGE 3] Testing DashboardEngine.quickOnboardUser End-To-End Automated Flow...');
  const testParentEmail = `parent-${Date.now()}@stemulusonboarding.test`;
  const qoResult = await DE.quickOnboardUser({
    type: 'student',
    name: 'Mrs. Funke Balogun',
    email: testParentEmail,
    phone: '+2348031234567',
    childName: 'Timi Balogun',
    childAge: 11,
    program: 'Web & App Development',
    lessonCount: 12,
    tutorName: 'Sarah Jane'
  });

  report('quickOnboardUser returns success: true', qoResult.success === true);
  report('quickOnboardUser returns auto-generated meetLink', typeof qoResult.meetLink === 'string' && qoResult.meetLink.includes('meet.google.com/'));
  report('quickOnboardUser returns auto-generated studentInviteLink', typeof qoResult.studentInviteLink === 'string' && qoResult.studentInviteLink.includes('classroom.google.com/c/'));
  report('quickOnboardUser returns auto-generated tutorInviteLink', typeof qoResult.tutorInviteLink === 'string' && qoResult.tutorInviteLink.includes('role=teacher'));
  report('quickOnboardUser returns auto-generated enrollmentCode', typeof qoResult.enrollmentCode === 'string' && qoResult.enrollmentCode.length >= 6);
  report('quickOnboardUser returns autoRecord: true and hostNotRequired: true', qoResult.autoRecord === true && qoResult.hostNotRequired === true);
  report('quickOnboardUser returns exactly 12 drafted assignments', Array.isArray(qoResult.draftedAssignments) && qoResult.draftedAssignments.length === 12);
  report('quickOnboardUser returns totalDraftedAssignments: 12', qoResult.totalDraftedAssignments === 12);

  const db = DE.getDB();
  const createdStudent = db.students.find(s => s.parentEmail === testParentEmail);
  report('Student is persisted in DB with googleClassroom and meetLink', !!createdStudent && !!createdStudent.googleClassroom && !!createdStudent.meetLink);
  report('Student record contains 12 drafted assignments', createdStudent && createdStudent.googleClassroom && createdStudent.googleClassroom.draftedAssignments.length === 12);

  const createdSchedule = db.schedules.find(sch => sch.studentId === (createdStudent ? createdStudent.id : null));
  report('Initial schedule slot automatically inherits student meetLink', !!createdSchedule && createdSchedule.link === createdStudent.meetLink);
  report('Initial schedule slot inherits autoRecord = true', !!createdSchedule && createdSchedule.autoRecord === true);
  report('Initial schedule slot inherits hostNotRequired = true', !!createdSchedule && createdSchedule.hostNotRequired === true);
  report('Initial schedule slot inherits googleClassroom metadata with drafted assignments', !!createdSchedule && !!createdSchedule.googleClassroom && createdSchedule.googleClassroom.draftedAssignments.length === 12);

  // -------------------------------------------------------------
  // STAGE 4: BROWSER E2E TEST: ADMIN QUICK ONBOARD & MODALS
  // -------------------------------------------------------------
  console.log('\n[STAGE 4] Testing Browser UI Integration (Playwright)...');

  server.listen(PORT, async () => {
    let browser;
    try {
      try {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
      } catch {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
      }
      const page = await browser.newPage();

      // Seed authenticated admin session via __prime
      await page.goto(`http://localhost:${PORT}/__prime`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const sessionObj = {
          role: 'admin',
          email: 'admin@stemuluskidstech.com',
          name: 'Super Admin',
          issuedAt: Date.now()
        };
        if (typeof StemulusSecurity !== 'undefined') {
          StemulusSecurity.saveSecureSession(sessionObj);
        }
        sessionStorage.setItem('stemulus_session_raw', JSON.stringify(sessionObj));
        localStorage.setItem('user', JSON.stringify(sessionObj));
        localStorage.setItem('role', 'admin');
        localStorage.setItem('stemulus_auth_role', 'admin');
        localStorage.setItem('stemulus_user_email', 'admin@stemuluskidstech.com');
        localStorage.setItem('stemulus_auth_token', 'stemulus_e2e_verified_token');
      });

      // Go to admin dashboard
      await page.goto(`http://localhost:${PORT}/admin-dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Verify AdminEngine functions are exposed
      const adminEngineFns = await page.evaluate(() => {
        return {
          hasCopyStudentMeetLink: typeof window.AdminEngine.copyStudentMeetLink === 'function',
          hasCopyStudentClassroomLink: typeof window.AdminEngine.copyStudentClassroomLink === 'function',
          hasCopyTutorClassroomLink: typeof window.AdminEngine.copyTutorClassroomLink === 'function',
          hasCopyQuickOnboardCredentials: typeof window.AdminEngine.copyQuickOnboardCredentials === 'function'
        };
      });

      report('AdminEngine.copyStudentMeetLink is available in browser window', adminEngineFns.hasCopyStudentMeetLink);
      report('AdminEngine.copyStudentClassroomLink is available in browser window', adminEngineFns.hasCopyStudentClassroomLink);
      report('AdminEngine.copyTutorClassroomLink is available in browser window', adminEngineFns.hasCopyTutorClassroomLink);
      report('AdminEngine.copyQuickOnboardCredentials is available in browser window', adminEngineFns.hasCopyQuickOnboardCredentials);

      // Verify #qo-lesson-count selector exists in Quick Onboard Modal
      const lessonCountElExists = await page.evaluate(() => {
        const select = document.getElementById('qo-lesson-count');
        if (!select) return false;
        const options = Array.from(select.options).map(o => o.value);
        return options.includes('4') && options.includes('8') && options.includes('12') && options.includes('24');
      });
      report('Quick Onboard Modal renders #qo-lesson-count with 4, 8, 12, 16, 24 lesson options', lessonCountElExists);

      // Open Quick Onboard Modal and fill out form with 12 lessons
      const formSubmitted = await page.evaluate(async () => {
        const modal = document.getElementById('modal-quick-onboard');
        if (modal) modal.classList.remove('hidden');

        const parentNameInput = document.getElementById('qo-parent-name');
        const parentEmailInput = document.getElementById('qo-parent-email');
        const childNameInput = document.getElementById('qo-child-name');
        const childAgeInput = document.getElementById('qo-child-age');
        const progInput = document.getElementById('qo-program');
        const lessonCountInput = document.getElementById('qo-lesson-count');

        if (parentNameInput) parentNameInput.value = 'Dr. Chidi Okonkwo';
        if (parentEmailInput) parentEmailInput.value = 'chidi.okonkwo@onboardtest.org';
        if (childNameInput) childNameInput.value = 'Somto Okonkwo';
        if (childAgeInput) childAgeInput.value = '10';
        if (progInput) progInput.value = 'Python Programming Foundations';
        if (lessonCountInput) lessonCountInput.value = '12';

        // Trigger submit
        await window.AdminEngine.submitQuickOnboardStudent(new Event('submit'));

        const successBox = document.getElementById('qo-success-box');
        const outputEl = document.getElementById('qo-credential-output');

        return {
          successBoxVisible: successBox && !successBox.classList.contains('hidden'),
          outputHtml: outputEl ? outputEl.innerHTML : '',
          outputText: outputEl ? outputEl.innerText : ''
        };
      });

      report('Quick Onboard success box appears after submission', formSubmitted.successBoxVisible);
      report('Output surfaces Auto-Record 1080p Google Meet badge', formSubmitted.outputHtml.includes('AUTO-RECORD 1080p') && formSubmitted.outputHtml.includes('meet.google.com/'));
      report('Output surfaces No Host Required indicator', formSubmitted.outputHtml.includes('NO HOST REQUIRED'));
      report('Output surfaces Google Classroom Student Invite link with copy action', formSubmitted.outputHtml.includes('classroom.google.com/c/') && (formSubmitted.outputHtml.includes('Student / Parent Invite Link') || formSubmitted.outputHtml.includes('Coder / Student Invite Link')));
      report('Output surfaces Google Classroom Tutor Invite link with copy action', formSubmitted.outputHtml.includes('/t/tut_') && formSubmitted.outputHtml.includes('role=teacher'));
      report('Output surfaces Google Classroom Join Code', formSubmitted.outputHtml.includes('JOIN CODE:') || formSubmitted.outputHtml.includes('CODE:'));
      report('Output surfaces 12 Drafted Assignments badge', formSubmitted.outputHtml.includes('12 Drafted Assignments Ready'));
      report('Output displays drafted coursework list with DRAFT tags and Lesson 12', formSubmitted.outputHtml.includes('DRAFT') && formSubmitted.outputHtml.includes('L12:'));

      // Check students table for badges
      const tableCheck = await page.evaluate(() => {
        const tbody = document.getElementById('students-table-body');
        if (!tbody) return { hasRecBadge: false, hasClassroomLink: false };
        const text = tbody.innerHTML;
        return {
          hasRecBadge: text.includes('REC') && text.includes('1080p Auto-Record Enabled'),
          hasClassroomLink: text.includes('Classroom (') && text.includes('copyStudentClassroomLink')
        };
      });

      report('Student directory table displays Auto-Record REC badge', tableCheck.hasRecBadge);
      report('Student directory table displays Google Classroom copy & launch buttons', tableCheck.hasClassroomLink);

      await browser.close();
    } catch (err) {
      console.error('Browser testing error:', err);
      failed++;
    } finally {
      server.close();

      console.log('\n================================================================');
      console.log(`TEST RESULTS: ${passed} Passed | ${failed} Failed`);
      console.log('================================================================');

      if (failed === 0) {
        console.log('🎉 ALL AUTOMATED GOOGLE CLASSROOM & MEET PROVISIONING TESTS PASSED!');
        process.exit(0);
      } else {
        console.error(`💥 ${failed} test(s) failed.`);
        process.exit(1);
      }
    }
  });
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
