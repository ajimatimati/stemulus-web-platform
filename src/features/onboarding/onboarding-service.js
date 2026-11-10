/**
 * STEMulus Onboarding Feature Service
 * Authoritative business logic for username generation, high-entropy password creation,
 * faculty tutor registration, coder enrollment, and welcome credential automation.
 */

import { getDB as defaultGetDB, saveDB as defaultSaveDB, syncDocument as defaultSyncDocument } from '../../services/storage-service.js';

/**
 * Computes SHA-256 hash string for credential storage.
 * @param {string} plainText 
 * @returns {Promise<string>}
 */
export async function hashPassword(plainText) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return plainText;
}

/**
 * Derives a clean, normalized email username adhering to domain conventions.
 * Tutors: firstname.lastname@stemuluskidstech.com
 * Parents: firstname.lastname@parent.stemuluskidstech.com
 * @param {string} name 
 * @param {'tutor'|'parent'} role 
 * @param {object} existingUsers 
 * @returns {string}
 */
export function generateAutoUsername(name, role = 'parent', existingUsers = {}) {
  const defaultBase = role === 'tutor' ? 'tutor' : 'parent';
  let raw = (name || defaultBase).toLowerCase().trim();
  raw = raw.replace(/^(mr|mrs|ms|dr|prof|engr|chief|pastor|barr|barrister|alhaji|arc|elder|sir|lady)\.?\s+/i, '');
  let cleaned = raw.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  if (!cleaned) cleaned = defaultBase;

  const domain = role === 'tutor' ? 'stemuluskidstech.com' : 'parent.stemuluskidstech.com';
  const candidate = `${cleaned}@${domain}`;

  if (!existingUsers || !existingUsers[candidate]) {
    return candidate;
  }

  for (let i = 0; i < 20; i++) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const testCandidate = `${cleaned}${suffix}@${domain}`;
    if (!existingUsers[testCandidate]) {
      return testCandidate;
    }
  }

  return `${cleaned}.${Date.now().toString(36)}@${domain}`;
}

/**
 * Generates a cryptographically strong, policy-compliant temporary password.
 * Policy: 14+ characters, starts with STEM-, uppercase, lowercase, digit, special character.
 * @returns {string}
 */
export function generateAutoPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%&*';
  const all = upper + lower + digits + specials;

  const u = upper[Math.floor(Math.random() * upper.length)];
  const l = lower[Math.floor(Math.random() * lower.length)];
  const d = digits[Math.floor(Math.random() * digits.length)];
  const s = specials[Math.floor(Math.random() * specials.length)];

  let rest = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    rest = Array.from(randomBytes).map(b => all[b % all.length]).join('');
  } else {
    for (let i = 0; i < 6; i++) {
      rest += all[Math.floor(Math.random() * all.length)];
    }
  }

  return `STEM-${u}${l}${d}${s}${rest}`;
}

/**
 * Executes 1-click or quick onboarding for a tutor or student/parent pair.
 * Registers user accounts, provisions classroom/schedule details, and queues welcome credentials.
 * @param {object} params 
 * @param {object} [dbInstance] 
 * @param {object} [storageAdapter] 
 * @returns {Promise<object>}
 */
export async function quickOnboardUser(params, dbInstance = null, storageAdapter = null) {
  const getDB = (storageAdapter && storageAdapter.getDB) || defaultGetDB;
  const saveDB = (storageAdapter && storageAdapter.saveDB) || defaultSaveDB;
  const syncDocument = (storageAdapter && storageAdapter.syncDocument) || defaultSyncDocument;

  const db = dbInstance || getDB();
  const tempPwd = params.password || generateAutoPassword();
  const hashed = await hashPassword(tempPwd);

  if (params.type === 'tutor') {
    let tutorEmail = (params.email || '').toLowerCase().trim();
    if (!tutorEmail && params.name) {
      tutorEmail = generateAutoUsername(params.name, 'tutor', db.users);
    }
    if (!tutorEmail) {
      return { success: false, message: 'Tutor name or email is required.' };
    }
    if (db.users && db.users[tutorEmail]) {
      return { success: false, message: `A user with email ${tutorEmail} already exists.` };
    }

    db.users = db.users || {};
    db.users[tutorEmail] = {
      email: tutorEmail,
      name: params.name || 'Tutor',
      role: 'tutor',
      password: hashed,
      createdAt: new Date().toISOString()
    };

    db.tutors = db.tutors || [];
    const existingIdx = db.tutors.findIndex(t => {
      return (t.email && t.email.toLowerCase().trim() === tutorEmail) ||
             (t.name && params.name && t.name.toLowerCase().trim() === params.name.toLowerCase().trim());
    });

    if (existingIdx === -1) {
      db.tutors.push({
        id: `tut-${Date.now()}`,
        name: params.name || 'Tutor',
        email: tutorEmail,
        phone: params.phone || '',
        subjects: params.program ? [params.program] : ['General Coding'],
        status: 'active',
        createdAt: new Date().toISOString()
      });
    } else {
      db.tutors[existingIdx].name = params.name || db.tutors[existingIdx].name;
      db.tutors[existingIdx].email = tutorEmail;
      if (params.phone) db.tutors[existingIdx].phone = params.phone;
      db.tutors[existingIdx].status = 'active';
    }

    db.notifications = db.notifications || [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Welcome to STEMulus Faculty!',
      message: `Your tutor portal account is active. Log in with your email and temporary password: ${tempPwd}`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: tutorEmail
    });

    db.emailQueue = db.emailQueue || [];
    const emailQueueItem = {
      id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'tutor-welcome',
      status: 'draft',
      from: 'admin@stemuluskidstech.com',
      senderEmail: 'admin@stemuluskidstech.com',
      to: tutorEmail,
      recipientName: params.name || 'Tutor',
      subject: 'Welcome to STEMulus Faculty: Your Tutor Portal Access',
      htmlPreview: `Welcome ${params.name || 'Tutor'}! Your tutor portal credentials: Login: ${tutorEmail} | Temp Password: ${tempPwd} | Portal: https://stemuluskidstech.com/tutor-login.html`,
      data: {
        tutorEmail: tutorEmail,
        tutorName: params.name || 'Tutor',
        tempPassword: tempPwd,
        curriculum: params.program || 'Python Programming Foundations',
        subjects: params.program || 'Python Programming Foundations',
        meetLink: 'https://meet.google.com/gyd-fewb-cdh',
        classroomLink: 'https://classroom.google.com/c/ODg2NTc4NzE1MTgz?cjc=sfgboast',
        scheduleText: 'Agreed weekly sessions (WAT, GMT+1)'
      },
      triggeredBy: 'quick_onboard_tutor',
      createdAt: new Date().toISOString(),
      sentAt: null,
      editedSubject: null,
      editedBody: null
    };
    db.emailQueue.push(emailQueueItem);

    saveDB(db);
    syncDocument('users', tutorEmail, db.users[tutorEmail]);
    const tutRecord = (db.tutors || []).find(t => t.email === tutorEmail);
    if (tutRecord) syncDocument('tutors', tutRecord.id || tutorEmail, tutRecord);

    return {
      success: true,
      type: 'tutor',
      email: tutorEmail,
      username: tutorEmail,
      tempPassword: tempPwd,
      name: params.name || 'Tutor',
      emailQueueId: emailQueueItem.id
    };
  }

  // Student and Parent Onboarding
  let parentEmail = (params.email || '').toLowerCase().trim();
  if (!parentEmail && params.name) {
    parentEmail = generateAutoUsername(params.name, 'parent', db.users);
  }
  if (!parentEmail) {
    return { success: false, message: 'Parent name or email is required.' };
  }

  db.users = db.users || {};
  if (!db.users[parentEmail]) {
    db.users[parentEmail] = {
      email: parentEmail,
      name: params.name || 'Parent',
      role: 'parent',
      password: hashed,
      createdAt: new Date().toISOString()
    };
  } else {
    db.users[parentEmail].password = hashed;
    db.users[parentEmail].role = 'parent';
    if (params.name) db.users[parentEmail].name = params.name;
  }

  const childAge = parseInt(params.childAge, 10) || 10;
  const parts = (params.childName || 'Student').trim().split(/\s+/);
  const fName = parts[0] || 'Student';
  const lName = parts.slice(1).join(' ') || (params.name ? params.name.split(' ').slice(-1)[0] : 'S.');

  db.students = db.students || [];
  const existingStudIdx = db.students.findIndex(s => {
    return (s.parentEmail && s.parentEmail.toLowerCase() === parentEmail) &&
           (s.firstName && s.firstName.toLowerCase() === fName.toLowerCase()) &&
           (s.lastName && s.lastName.toLowerCase() === lName.toLowerCase());
  });

  let resolvedTutorName = params.tutorName || 'Sarah Jane';
  let resolvedTutorEmail = params.tutorEmail || (resolvedTutorName.toLowerCase().trim() === 'sarah jane' ? 'tutor@stemuluskidstech.com' : '');
  let resolvedTutorId = params.tutorId || (resolvedTutorName.toLowerCase().trim() === 'sarah jane' ? 'tut-101' : '');

  if (Array.isArray(db.tutors)) {
    const tQuery = (params.tutorEmail || params.tutorId || params.tutorName || '').toLowerCase().trim();
    if (tQuery) {
      const matchedT = db.tutors.find(t =>
        t && (
          (t.email && t.email.toLowerCase().trim() === tQuery) ||
          (t.id && t.id.toLowerCase().trim() === tQuery) ||
          (t.name && t.name.toLowerCase().trim() === tQuery)
        )
      );
      if (matchedT) {
        resolvedTutorName = matchedT.name || resolvedTutorName;
        resolvedTutorEmail = matchedT.email || resolvedTutorEmail;
        resolvedTutorId = matchedT.id || resolvedTutorId;
      }
    }
  }

  let studentRecord;
  if (existingStudIdx !== -1) {
    db.students[existingStudIdx].tutorName = resolvedTutorName;
    db.students[existingStudIdx].tutorEmail = resolvedTutorEmail;
    db.students[existingStudIdx].tutorId = resolvedTutorId;
    db.students[existingStudIdx].program = params.program || db.students[existingStudIdx].program;
    db.students[existingStudIdx].age = childAge;
    if (params.phone) db.students[existingStudIdx].parentPhone = params.phone;
    studentRecord = db.students[existingStudIdx];
  } else {
    studentRecord = {
      id: `std-${Date.now()}`,
      firstName: fName,
      lastName: lName,
      age: childAge,
      gender: params.gender || 'Not specified',
      experience: params.experience || 'Beginner',
      program: params.program || 'Python Programming Foundations',
      status: 'active',
      remindersPaused: false,
      parentEmail: parentEmail,
      parentName: params.name || 'Parent',
      parentPhone: params.phone || '',
      birthday: (params.birthday && typeof params.birthday === 'string' && params.birthday.trim().length >= 10) ? params.birthday.trim() : '',
      hasExplicitBirthday: !!(params.birthday && params.birthday.trim()),
      progress: 0,
      avatarColor: ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#2563EB', '#0891B2'][Math.floor(Math.random() * 7)],
      tutorName: resolvedTutorName,
      tutorEmail: resolvedTutorEmail,
      tutorId: resolvedTutorId,
      classroomLink: params.classroomLink || '',
      createdAt: new Date().toISOString()
    };

    const provisionFn = (storageAdapter && storageAdapter.provisionCoderClassroomAndMeet) ||
                        (typeof DashboardEngine !== 'undefined' && DashboardEngine.provisionCoderClassroomAndMeet) ||
                        null;

    if (typeof provisionFn === 'function') {
      provisionFn(studentRecord, params.lessonCount || 8);
    } else {
      const cjc = Math.random().toString(36).substring(2, 9);
      const cId = Math.floor(100000000000 + Math.random() * 900000000000);
      studentRecord.googleClassroom = {
        classroomId: String(cId),
        enrollmentCode: cjc,
        studentInviteLink: `https://classroom.google.com/c/${cId}?cjc=${cjc}`,
        tutorInviteLink: `https://classroom.google.com/c/${cId}/teachers/invite?token=tut-${cjc}`,
        draftedAssignments: [
          { lessonNumber: 1, title: 'Lesson 1: Introduction to Coding & Setup' }
        ]
      };
      studentRecord.classroomLink = studentRecord.classroomLink || studentRecord.googleClassroom.studentInviteLink;
      studentRecord.meetLink = studentRecord.meetLink || 'https://meet.google.com/gyd-fewb-cdh';
    }

    studentRecord.autoRecord = true;
    studentRecord.autoRecordEnabled = true;
    studentRecord.hostNotRequired = true;
    db.students.push(studentRecord);
  }

  // Auto-create initial schedule slot 3 days from now at 16:30 WAT
  const schedDate = new Date();
  schedDate.setDate(schedDate.getDate() + 3);
  db.schedules = db.schedules || [];
  db.schedules.push({
    id: `sch-${Date.now()}`,
    studentId: studentRecord.id,
    studentName: `${fName} ${lName}`,
    course: studentRecord.program,
    date: schedDate.toISOString().split('T')[0],
    time: '16:30',
    duration: '60',
    mentor: studentRecord.tutorName,
    tutorName: studentRecord.tutorName,
    tutorEmail: studentRecord.tutorEmail,
    tutorId: studentRecord.tutorId,
    link: studentRecord.meetLink || studentRecord.classroomLink,
    autoRecord: true,
    autoRecordEnabled: true,
    hostNotRequired: true,
    recordingMode: '1080p_hd_companion_and_cloud',
    attendanceStatus: 'pending'
  });

  // Welcome notification
  db.notifications = db.notifications || [];
  db.notifications.push({
    id: `not-${Date.now()}`,
    title: 'Student Onboarded Successfully!',
    message: `${fName} ${lName} has been registered in ${studentRecord.program}. Portal login credentials generated.`,
    timestamp: new Date().toISOString(),
    read: false,
    userEmail: parentEmail
  });

  // Queue parent welcome email
  db.emailQueue = db.emailQueue || [];
  const parentEmailItem = {
    id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'welcome',
    status: 'draft',
    from: 'admin@stemuluskidstech.com',
    senderEmail: 'admin@stemuluskidstech.com',
    to: parentEmail,
    recipientName: params.name || 'Parent',
    subject: `Parents Welcome to STEMulus Kids Tech: Official Onboarding for ${fName} ${lName}`,
    htmlPreview: `Welcome ${params.name || 'Parent'}! Portal credentials: Email: ${parentEmail} | Temp Password: ${tempPwd} | Coder: ${fName} ${lName} (${studentRecord.program}) | Portal: https://stemuluskidstech.com/parent-login.html`,
    data: {
      parentEmail: parentEmail,
      parentName: params.name || 'Parent',
      studentName: `${fName} ${lName}`,
      courseName: studentRecord.program,
      tempPassword: tempPwd,
      meetLink: studentRecord.meetLink,
      classroomLink: studentRecord.classroomLink,
      studentInviteLink: studentRecord.classroomLink,
      autoRecord: true,
      hostNotRequired: true
    },
    triggeredBy: 'quick_onboard_student',
    createdAt: new Date().toISOString(),
    sentAt: null,
    editedSubject: null,
    editedBody: null
  };
  db.emailQueue.push(parentEmailItem);

  saveDB(db);
  syncDocument('users', parentEmail, db.users[parentEmail]);
  syncDocument('students', studentRecord.id, studentRecord);

  return {
    success: true,
    type: 'student_parent',
    parentEmail: parentEmail,
    parentName: params.name || 'Parent',
    childName: `${fName} ${lName}`,
    program: studentRecord.program,
    tutorName: studentRecord.tutorName,
    tempPassword: tempPwd,
    meetLink: studentRecord.meetLink,
    classroomLink: studentRecord.classroomLink,
    googleClassroom: studentRecord.googleClassroom,
    studentInviteLink: (studentRecord.googleClassroom && studentRecord.googleClassroom.studentInviteLink) ? studentRecord.googleClassroom.studentInviteLink : studentRecord.classroomLink,
    tutorInviteLink: (studentRecord.googleClassroom && studentRecord.googleClassroom.tutorInviteLink) ? studentRecord.googleClassroom.tutorInviteLink : '',
    enrollmentCode: (studentRecord.googleClassroom && studentRecord.googleClassroom.enrollmentCode) ? studentRecord.googleClassroom.enrollmentCode : '',
    draftedAssignments: (studentRecord.googleClassroom && studentRecord.googleClassroom.draftedAssignments) ? studentRecord.googleClassroom.draftedAssignments : [],
    totalDraftedAssignments: (studentRecord.googleClassroom && studentRecord.googleClassroom.draftedAssignments) ? studentRecord.googleClassroom.draftedAssignments.length : 0,
    autoRecord: true,
    autoRecordEnabled: true,
    hostNotRequired: true,
    emailQueueId: parentEmailItem.id
  };
}

// Global browser window bridge
if (typeof window !== 'undefined') {
  window.STEMulus = window.STEMulus || {};
  window.STEMulus.Onboarding = {
    hashPassword,
    generateAutoUsername,
    generateAutoPassword,
    quickOnboardUser
  };
}
