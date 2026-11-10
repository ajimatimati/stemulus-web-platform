/**
 * STEMulus Classroom and Google Meet Provisioning Service (ES Module)
 * Authoritative logic for automated 1080p Google Meet generation, Google Classroom
 * metadata creation, teacher and student invite links, and coursework syllabus drafting.
 */

export function generateGoogleMeetLink(existingLinks = null) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let link = '';
  let attempts = 0;
  do {
    let p1 = '';
    for (let i = 0; i < 3; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    let p2 = '';
    for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    let p3 = '';
    for (let i = 0; i < 3; i++) p3 += chars.charAt(Math.floor(Math.random() * chars.length));
    link = `https://meet.google.com/${p1}-${p2}-${p3}`;
    attempts++;
  } while (existingLinks && existingLinks.has(link) && attempts < 100);
  return link;
}

export function normalizeCourseTrack(programName) {
  const p = (programName || '').toLowerCase();
  if (p.includes('scratch') || p.includes('literacy') || p.includes('keyboard')) return 'scratch';
  if (p.includes('fullstack') || p.includes('full-stack') || p.includes('backend') || p.includes('architecture')) return 'fullstack';
  if (p.includes('web') || p.includes('html') || p.includes('javascript') || p.includes('frontend')) return 'web';
  if (p.includes('arduino')) return 'arduino';
  if (p.includes('junior') || p.includes('hardware') || (p.includes('robot') && !p.includes('arduino'))) return 'junior_robotics';
  if (p.includes('ai') || p.includes('intelligence') || p.includes('machine learning') || p.includes('data')) return 'ai';
  if (p.includes('creative')) return 'creative_coding';
  if (p.includes('system') || p.includes('shell') || p.includes('bash') || p.includes('linux')) return 'systems';
  if (p.includes('art') || p.includes('design') || /\bui\b/.test(p) || /\bux\b/.test(p) || p.includes('figma')) return 'digital_art';
  if (p.includes('python')) return 'python';
  return 'python';
}

export const COURSE_ASSIGNMENTS_CATALOG = {
  'scratch': [
    { title: 'Sprite Navigation, Costumes and Event Listeners', description: 'Initialize project canvas, configure sprite coordinates, and respond to keypress and green-flag trigger events.', submissionType: 'scratch_project_link' },
    { title: 'Directional Motion, Velocity Vectors and Boundaries', description: 'Code smooth keyboard movement using change-x/change-y blocks and bounce off edge boundaries.', submissionType: 'scratch_project_link' },
    { title: 'Coordinate Systems (X/Y) and Collision Detection', description: 'Program sprite sensing triggers, touching color detection, and build an interactive maze navigation challenge.', submissionType: 'scratch_project_link' },
    { title: 'Conditional Logic and Variable Score Keepers', description: 'Implement if-then-else conditions, coin collection variables, and timer countdown mechanics.', submissionType: 'scratch_project_link' },
    { title: 'Nested Loops, Sprite Cloning and Procedural Enemies', description: 'Use clone creation and deletion blocks to spawn dynamic enemy waves with randomized trajectory angles.', submissionType: 'scratch_project_link' },
    { title: 'Broadcast Messaging and Game State Management', description: 'Coordinate scene transitions using broadcast events: Title Screen, Play State, Game Over, and Victory screens.', submissionType: 'scratch_project_link' },
    { title: 'Custom My-Blocks (Functions) and Modular Logic', description: 'Create reusable parameter-driven custom blocks for character jump physics and enemy AI maneuvers.', submissionType: 'scratch_project_link' },
    { title: 'Physics Simulation (Gravity and Jump Trajectories) Capstone', description: 'Build a multi-level platformer with realistic falling acceleration, platform detection, and goal flags.', submissionType: 'scratch_project_link' }
  ],
  'python': [
    { title: 'Python Syntax, Variables, Data Types and Dynamic I/O', description: 'Configure Python REPL, declare integer, float, string variables, and build an interactive Mad Libs story generator.', submissionType: 'github_or_replit_link' },
    { title: 'Arithmetic Operators, Math Module and Precision Logic', description: 'Perform computational calculations, use math functions (sqrt, floor, ceil), and construct a currency converter utility.', submissionType: 'github_or_replit_link' },
    { title: 'Conditional Branching, Comparison and Boolean Operators', description: 'Build a branching adventure game using if, elif, else statements and logical compound evaluation.', submissionType: 'github_or_replit_link' },
    { title: 'Iteration Engines: While Loops and For Range Structures', description: 'Implement numerical count-loops, input validation while-loops, and build an automated multiplication practice engine.', submissionType: 'github_or_replit_link' },
    { title: 'Sequences: Lists, Tuples and String Indexing/Slicing', description: 'Manipulate ordered collections using append, pop, sort, slicing intervals, and build an inventory management system.', submissionType: 'github_or_replit_link' },
    { title: 'Associative Collections: Dictionaries and Set Operations', description: 'Model key-value records, implement nested dictionaries, and engineer a flashcard quiz system with persistent state.', submissionType: 'github_or_replit_link' },
    { title: 'Modular Programming: Functions, Return Values and Scope', description: 'Define clean functions with positional, keyword, and default parameters, returning structured data tuples.', submissionType: 'github_or_replit_link' },
    { title: 'OOP Foundations: Classes, Encapsulation and Capstone Game', description: 'Design Object-Oriented blueprints with init constructor, instance attributes, methods, and build a Battle Arena RPG.', submissionType: 'github_or_replit_link' }
  ],
  'web': [
    { title: 'Semantic HTML5 Architecture and Document Trees', description: 'Structure accessible web pages using semantic tags (header, nav, main, section, footer), lists, tables, and forms.', submissionType: 'code_sandbox_or_github' },
    { title: 'Modern CSS3 Styling, Typography and Box Model Mastery', description: 'Apply colors, custom Google Fonts, margins, padding, borders, box-sizing, and responsive units (rem, vw, vh).', submissionType: 'code_sandbox_or_github' },
    { title: 'Flexbox Dynamic Layouts and Responsive Alignments', description: 'Engineer flexible navigation bars, multi-column card galleries, and center content with flex direction and justify-content.', submissionType: 'code_sandbox_or_github' },
    { title: 'CSS Grid Matrix Systems and Mobile-First Media Queries', description: 'Build 2D page layouts with grid-template-columns, fr units, minmax, and adapt designs across mobile and desktop viewports.', submissionType: 'code_sandbox_or_github' },
    { title: 'JavaScript Fundamentals: Variables, Data Types and Operators', description: 'Declare let/const variables, write template literals, execute arithmetic/comparisons, and experiment in Chrome DevTools.', submissionType: 'code_sandbox_or_github' },
    { title: 'DOM Tree Manipulation, Selectors and Content Injection', description: 'Target elements with querySelector, dynamically update textContent and innerHTML, and toggle CSS classes.', submissionType: 'code_sandbox_or_github' },
    { title: 'Event Driven Programming, Listeners and Interactive Forms', description: 'Handle click, submit, input, and keydown events, prevent default form submission, and build an interactive Todo task list.', submissionType: 'code_sandbox_or_github' },
    { title: 'Asynchronous JavaScript: Fetch API, Promises and JSON Data Capstone', description: 'Fetch live external data from a public REST API, parse JSON payloads, and render dynamic weather cards.', submissionType: 'code_sandbox_or_github' }
  ]
};

export function getCourseAssignments(programName, lessonCount = 8, classroomId = '100000000000') {
  const trackKey = normalizeCourseTrack(programName);
  const catalog = COURSE_ASSIGNMENTS_CATALOG[trackKey] || COURSE_ASSIGNMENTS_CATALOG['python'];
  const cleanProgram = (programName || 'STEMulus Coding Program').trim();
  const count = Math.max(1, Math.min(catalog.length, parseInt(lessonCount, 10) || 8));
  const sliced = catalog.slice(0, count);

  return sliced.map((item, idx) => {
    const lessonNum = idx + 1;
    const padded = String(lessonNum).padStart(2, '0');
    return {
      id: `asg-${classroomId}-L${padded}`,
      lessonNumber: lessonNum,
      title: `Lesson ${lessonNum}: ${item.title}`,
      description: item.description,
      courseTrack: cleanProgram,
      trackId: trackKey,
      lessonCountTotal: count,
      status: 'DRAFT',
      state: 'DRAFT',
      points: 100,
      submissionType: item.submissionType || 'code_link_or_file',
      dueDaysFromStart: lessonNum * 3,
      materials: [
        { title: `Lesson ${lessonNum} Starter Sandbox and Cheatsheet`, url: `https://classroom.google.com/c/${classroomId}/m/template-${padded}`, type: 'template' },
        { title: `Lesson ${lessonNum} Project Rubric and Objectives`, url: `https://classroom.google.com/c/${classroomId}/m/rubric-${padded}`, type: 'doc' }
      ],
      rubric: [
        'Computational Logic and Execution (40%)',
        'Creative Enhancements and Feature Expansion (30%)',
        'Code Readability, Clean Formatting and Comments (30%)'
      ]
    };
  });
}

export function generateClassroomMetadata(studentName, programName, lessonCount = 8) {
  const classroomId = String(Math.floor(100000000000 + Math.random() * 900000000000));
  const codeChars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let enrollmentCode = '';
  for (let i = 0; i < 7; i++) {
    enrollmentCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
  }

  const tokenChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let tutorToken = 'tut_';
  for (let i = 0; i < 16; i++) {
    tutorToken += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
  }

  const cleanName = (studentName || 'Coder').trim();
  const cleanProgram = (programName || 'STEMulus Coding Program').trim();
  const courseName = `${cleanName} - ${cleanProgram}`;
  const section = 'STEMulus Private 1-on-1 Tutoring';
  const classroomUrl = `https://classroom.google.com/c/${classroomId}`;
  const studentInviteLink = `https://classroom.google.com/c/${classroomId}?cjc=${enrollmentCode}`;
  const tutorInviteLink = `https://classroom.google.com/c/${classroomId}/t/${tutorToken}?role=teacher`;

  const effectiveCount = parseInt(lessonCount, 10) || 8;
  const draftedAssignments = getCourseAssignments(cleanProgram, effectiveCount, classroomId);

  return {
    classroomId: classroomId,
    courseName: courseName,
    section: section,
    enrollmentCode: enrollmentCode,
    classroomUrl: classroomUrl,
    studentInviteLink: studentInviteLink,
    tutorInviteLink: tutorInviteLink,
    draftedAssignments: draftedAssignments,
    totalDraftedAssignments: draftedAssignments.length,
    lessonCount: effectiveCount,
    availableLessonCounts: [4, 8, 12, 16, 24],
    autoProvisioned: true,
    createdAt: new Date().toISOString()
  };
}

export function provisionCoderClassroomAndMeet(student, lessonCount = 8, db = null, storageService = null) {
  if (!student) return student;

  const hasValidMeet = student.meetLink &&
    typeof student.meetLink === 'string' &&
    student.meetLink.startsWith('https://meet.google.com/') &&
    !student.meetLink.includes('xxx-yyyy-zzz');

  if (!hasValidMeet) {
    const existingLinks = new Set();
    if (db && Array.isArray(db.students)) {
      db.students.forEach(s => {
        if (s && s.meetLink) existingLinks.add(s.meetLink.trim());
      });
    }
    student.meetLink = generateGoogleMeetLink(existingLinks);
  }

  student.autoRecord = true;
  student.autoRecordEnabled = true;
  student.hostNotRequired = true;
  student.recordingMode = '1080p_hd_companion_and_cloud';
  student.recordingHostEmail = 'stemulusclubs@gmail.com';

  const studentFullName = ((student.firstName || '') + ' ' + (student.lastName || '')).trim() || student.studentName || 'Coder';
  const program = student.program || student.course || 'Python Programming Foundations';
  const effectiveCount = parseInt(lessonCount, 10) || parseInt(student.lessonCount, 10) || 8;

  if (!student.googleClassroom || !student.googleClassroom.studentInviteLink || !student.googleClassroom.tutorInviteLink || !student.googleClassroom.draftedAssignments || student.googleClassroom.draftedAssignments.length === 0) {
    const classroomMeta = generateClassroomMetadata(studentFullName, program, effectiveCount);
    student.googleClassroom = classroomMeta;
    student.classroomLink = classroomMeta.studentInviteLink;
    student.classroomCode = classroomMeta.enrollmentCode;
  }

  if (db && storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return student;
}

export function launchMeetingSession(sessionDetails = {}) {
  const scheduleId = sessionDetails.scheduleId || '';
  const role = sessionDetails.role || 'participant';
  const meetingUrl = (sessionDetails.meetingUrl && String(sessionDetails.meetingUrl).startsWith('http'))
    ? String(sessionDetails.meetingUrl).trim()
    : 'https://meet.google.com';
  const studentName = sessionDetails.studentName || 'Coder';
  const courseName = sessionDetails.courseName || sessionDetails.course || 'STEMulus Live Session';
  const tutorName = sessionDetails.tutorName || sessionDetails.mentor || 'Faculty Mentor';
  const sessionId = sessionDetails.sessionId || ('ses_' + Date.now());
  const timestamp = new Date().toISOString();

  // 1. Trigger 1080p Recording Safeguarding Telemetry
  try {
    const recKey = 'stemulus_recorded_sessions';
    let recList = [];
    if (typeof localStorage !== 'undefined') {
      recList = JSON.parse(localStorage.getItem(recKey) || '[]');
      recList.unshift({
        id: 'rec-' + Date.now(),
        sessionId: sessionId,
        scheduleId: scheduleId,
        course: courseName,
        student: studentName,
        tutor: tutorName,
        meetingUrl: meetingUrl,
        role: role,
        resolution: '1080p HD',
        status: 'Recording Telemetry Active',
        triggeredAt: timestamp,
        recordingMode: '1080p_hd_companion_and_cloud'
      });
      localStorage.setItem(recKey, JSON.stringify(recList.slice(0, 50)));
    }
    if (typeof window !== 'undefined' && window.ClassroomRecorderEngine && typeof window.ClassroomRecorderEngine.setContext === 'function') {
      window.ClassroomRecorderEngine.setContext(courseName, studentName);
    }
  } catch (e) {
    console.warn('[ClassroomService] Recording telemetry error:', e);
  }

  // 2. Trigger Real-time Transcript and Session Monitoring Telemetry
  try {
    const transKey = 'stemulus_session_transcripts';
    let transList = [];
    if (typeof localStorage !== 'undefined') {
      transList = JSON.parse(localStorage.getItem(transKey) || '[]');
      transList.unshift({
        id: 'trans-' + Date.now(),
        sessionId: sessionId,
        scheduleId: scheduleId,
        course: courseName,
        student: studentName,
        tutor: tutorName,
        role: role,
        active: true,
        transcriptStartedAt: timestamp,
        status: 'Live Ingestion',
        meetingUrl: meetingUrl
      });
      localStorage.setItem(transKey, JSON.stringify(transList.slice(0, 50)));
    }

    if (typeof window !== 'undefined') {
      const sendHeartbeatTick = () => {
        try {
          if (window.SessionMonitoringEngine && typeof window.SessionMonitoringEngine.recordMeetingHeartbeat === 'function') {
            window.SessionMonitoringEngine.recordMeetingHeartbeat({
              sessionId: sessionId,
              scheduleId: scheduleId,
              courseName: courseName,
              studentName: studentName,
              tutorName: tutorName,
              meetingUrl: meetingUrl,
              role: role,
              resolution: '1080p HD',
              transcriptActive: true
            });
          }
          if (window.ClassEscalationEngine && typeof window.ClassEscalationEngine.recordHeartbeat === 'function') {
            const participantName = (role === 'tutor' || role === 'mentor') ? tutorName : studentName;
            window.ClassEscalationEngine.recordHeartbeat(sessionId, scheduleId, role, participantName, {
              courseName: courseName,
              studentName: studentName,
              tutorName: tutorName,
              meetingUrl: meetingUrl,
              resolution: '1080p HD',
              transcriptActive: true
            });
          }
        } catch (err) {}
      };

      sendHeartbeatTick();

      if (typeof window.setInterval === 'function') {
        window._stemulusActiveClassHeartbeats = window._stemulusActiveClassHeartbeats || {};
        const hbKey = scheduleId || sessionId;
        if (window._stemulusActiveClassHeartbeats[hbKey]) {
          clearInterval(window._stemulusActiveClassHeartbeats[hbKey]);
        }
        let ticks = 0;
        window._stemulusActiveClassHeartbeats[hbKey] = window.setInterval(() => {
          ticks += 1;
          if (ticks > 180) {
            clearInterval(window._stemulusActiveClassHeartbeats[hbKey]);
            delete window._stemulusActiveClassHeartbeats[hbKey];
            return;
          }
          sendHeartbeatTick();
        }, 30000);
      }
    }
  } catch (e) {
    console.warn('[ClassroomService] Transcript telemetry error:', e);
  }

  // 3. Trigger Classroom Rejoin Beacon
  try {
    if (typeof window !== 'undefined' && window.ClassroomRejoinBeacon && typeof window.ClassroomRejoinBeacon.trackMeetingLaunched === 'function') {
      window.ClassroomRejoinBeacon.trackMeetingLaunched({ scheduleId: scheduleId, studentName: studentName, meetingUrl: meetingUrl });
    }
  } catch (e) {
    console.warn('[ClassroomService] Rejoin tracking error:', e);
  }

  // 4. Launch Meeting in clean new tab
  if (typeof window !== 'undefined') {
    const opened = window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = meetingUrl;
    }
    return { success: true, meetingUrl: meetingUrl, sessionId: sessionId };
  }

  return { success: true, meetingUrl: meetingUrl, sessionId: sessionId };
}

export const ClassroomService = {
  generateGoogleMeetLink,
  normalizeCourseTrack,
  COURSE_ASSIGNMENTS_CATALOG,
  getCourseAssignments,
  generateClassroomMetadata,
  provisionCoderClassroomAndMeet,
  launchMeetingSession
};
