/**
 * STEMulus Student Management & Enrollments Feature Service (ES Module)
 * Authoritative business logic for student roster lifecycle, parent accounts aggregation,
 * status transitions, reminders controls, admissions enrollments pipeline, and conversions.
 */

import { resolveTutorDetails } from '../tutor-management/tutor-service.js';
import { provisionCoderClassroomAndMeet } from '../classroom/classroom-service.js';
import { hashPassword } from '../auth/auth-service.js';

/**
 * Retrieve students, optionally filtered by parent email or name.
 * @param {string|null} parentEmail
 * @param {object} db
 * @param {object|null} currentSession
 * @returns {Array}
 */
export function getStudents(parentEmail = null, db = {}, currentSession = null) {
  const students = Array.isArray(db.students) ? db.students : [];
  let filterEmail = parentEmail;

  if (!filterEmail && currentSession && currentSession.role === 'parent' && currentSession.email) {
    filterEmail = currentSession.email;
  }

  if (filterEmail) {
    const clean = String(filterEmail).toLowerCase().trim();
    return students.filter(s => {
      if (!s) return false;
      if (s.parentEmail && String(s.parentEmail).toLowerCase().trim() === clean) return true;
      if (s.parentName && String(s.parentName).toLowerCase().trim() === clean) return true;
      return false;
    });
  }

  return students;
}

/**
 * Gather all parent profiles from registered users and enrolled student records.
 * @param {object} db
 * @returns {Array}
 */
export function getParents(db = {}) {
  const students = Array.isArray(db.students) ? db.students : [];
  const users = db.users || {};
  const parentsMap = {};

  // 1. Gather all users registered with role 'parent'
  Object.keys(users).forEach(emailKey => {
    const u = users[emailKey];
    if (u && (u.role === 'parent' || (!u.role && emailKey.includes('parent')))) {
      const normEmail = (u.email || emailKey).toLowerCase().trim();
      parentsMap[normEmail] = {
        id: `parent-${normEmail.replace(/[^a-z0-9]/g, '_')}`,
        name: u.name || 'Parent Account',
        email: normEmail,
        phone: u.phone || u.whatsapp || '',
        whatsapp: u.whatsapp || u.phone || '',
        country: u.country || 'Nigeria',
        role: 'parent',
        createdAt: u.createdAt || new Date().toISOString(),
        status: u.status || 'active',
        children: []
      };
    }
  });

  // 2. Scan students to associate children and discover any missing parent records
  students.forEach(s => {
    if (!s) return;
    const pEmail = (s.parentEmail || '').toLowerCase().trim();
    if (!pEmail) return;

    if (!parentsMap[pEmail]) {
      parentsMap[pEmail] = {
        id: `parent-${pEmail.replace(/[^a-z0-9]/g, '_')}`,
        name: s.parentName || 'Parent Account',
        email: pEmail,
        phone: s.parentPhone || s.parentWhatsapp || '',
        whatsapp: s.parentWhatsapp || s.parentPhone || '',
        country: s.country || 'Nigeria',
        role: 'parent',
        createdAt: s.createdAt || new Date().toISOString(),
        status: s.status || 'active',
        children: []
      };
    }

    const existingChild = parentsMap[pEmail].children.find(c => c && c.id === s.id);
    if (!existingChild) {
      parentsMap[pEmail].children.push({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        program: s.program || 'General STEM',
        progress: s.progress || 0,
        age: s.age || 0,
        status: s.status || 'active'
      });
    }

    if (!parentsMap[pEmail].phone && s.parentPhone) {
      parentsMap[pEmail].phone = s.parentPhone;
      parentsMap[pEmail].whatsapp = s.parentPhone;
    }
    if ((!parentsMap[pEmail].name || parentsMap[pEmail].name === 'Parent Account') && s.parentName) {
      parentsMap[pEmail].name = s.parentName;
    }
  });

  return Object.values(parentsMap);
}

/**
 * Register a new student, resolving tutor assignment and provisioning classrooms.
 * @param {object} rawStudent
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addStudent(rawStudent, db = {}, storageService = null) {
  if (!Array.isArray(db.students)) db.students = [];
  const student = Object.assign({}, rawStudent);

  student.id = student.id || (`std-${Date.now()}`);
  if (student.parentEmail) student.parentEmail = String(student.parentEmail).toLowerCase().trim();
  if (student.parentName) student.parentName = String(student.parentName).trim();
  if (student.status === undefined) student.status = 'active';
  if (student.remindersPaused === undefined) student.remindersPaused = false;
  if (student.progress === undefined) student.progress = 0;
  if (!student.skills) student.skills = { logic: 60, loops: 60, variables: 60, syntax: 60, projects: 60 };
  const initialMonthlyTarget = student.monthlyTarget || student.sessionsPerMonth || (student.weeklyFrequency ? parseInt(student.weeklyFrequency, 10) * 4 : (Array.isArray(student.scheduleDays) && student.scheduleDays.length > 0 ? student.scheduleDays.length * 4 : 8));
  if (!student.metrics) student.metrics = { attended: 0, total: initialMonthlyTarget, projects: 0, lines: 0 };
  student.birthday = (student.birthday && typeof student.birthday === 'string' && student.birthday.trim().length >= 10) ? student.birthday.trim() : '';
  student.hasExplicitBirthday = Boolean(student.birthday);

  // Resolve tutor identity if provided
  if (student.tutorName || student.tutorEmail || student.tutorId) {
    const tutorMatch = resolveTutorDetails(student.tutorEmail || student.tutorName || student.tutorId, db);
    if (tutorMatch) {
      student.tutorName = tutorMatch.name;
      student.tutorEmail = tutorMatch.email;
      student.tutorId = tutorMatch.id;
    }
  }

  // Provision Google Classroom and hostless 1080p recording Google Meet
  try {
    provisionCoderClassroomAndMeet(student, student.lessonCount || initialMonthlyTarget);
  } catch (e) {
    // Graceful fallback if helper is unavailable
  }

  db.students.push(student);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'students', action: 'add', item: student } }));
  }

  return student;
}

/**
 * Update an existing student record and synchronize linked scheduled classes.
 * @param {string|object} studentDataOrId
 * @param {object|null} optionalUpdates
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateStudent(studentDataOrId, optionalUpdates = null, db = {}, storageService = null) {
  if (!Array.isArray(db.students)) return null;

  let id, updates;
  if (typeof studentDataOrId === 'string') {
    id = studentDataOrId;
    updates = optionalUpdates || {};
  } else if (studentDataOrId && typeof studentDataOrId === 'object') {
    id = studentDataOrId.id;
    updates = studentDataOrId;
  } else {
    return null;
  }

  const idx = db.students.findIndex(s => s && s.id === id);
  if (idx === -1) return null;

  db.students[idx] = Object.assign({}, db.students[idx], updates, { id: id });

  // Synchronize tutor changes across scheduled sessions
  if (updates.tutorName || updates.tutorEmail || updates.tutorId) {
    const tutorInput = updates.tutorEmail || updates.tutorName || updates.tutorId;
    const tutorMatch = resolveTutorDetails(tutorInput, db);
    if (tutorMatch) {
      db.students[idx].tutorName = tutorMatch.name;
      db.students[idx].tutorEmail = tutorMatch.email;
      db.students[idx].tutorId = tutorMatch.id;
    } else if (updates.tutorName === 'Unassigned' || updates.tutorEmail === '') {
      db.students[idx].tutorName = 'Unassigned';
      db.students[idx].tutorEmail = '';
      db.students[idx].tutorId = '';
    }

    const sName = `${db.students[idx].firstName || ''} ${db.students[idx].lastName || ''}`.trim().toLowerCase();
    const assignedTutorName = db.students[idx].tutorName || '';
    const assignedTutorEmail = db.students[idx].tutorEmail || '';
    const assignedTutorId = db.students[idx].tutorId || '';

    if (Array.isArray(db.schedules)) {
      db.schedules.forEach(sch => {
        if (!sch) return;
        const isPending = sch.attendanceStatus === 'pending' || sch.attendanceStatus === 'scheduled' || sch.status === 'scheduled';
        if (isPending) {
          const matchId = sch.studentId && sch.studentId === id;
          const matchName = sch.studentName && sch.studentName.trim().toLowerCase() === sName;
          if (matchId || matchName) {
            sch.mentor = assignedTutorName;
            sch.tutorName = assignedTutorName;
            sch.tutorEmail = assignedTutorEmail;
            sch.tutorId = assignedTutorId;
          }
        }
      });
    }
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'students', action: 'update', item: db.students[idx] } }));
  }

  return db.students[idx];
}

/**
 * Remove a student from active roster and record in deletedStudentIds.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteStudent(id, db = {}, storageService = null) {
  if (!Array.isArray(db.students)) return false;

  db.deletedStudentIds = db.deletedStudentIds || [];
  if (!db.deletedStudentIds.includes(id)) {
    db.deletedStudentIds.push(id);
  }

  const initialLen = db.students.length;
  db.students = db.students.filter(s => s && s.id !== id);

  if (db.students.length !== initialLen) {
    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'students', action: 'delete', id: id } }));
    }
    return true;
  }

  return false;
}

/**
 * Set reminders paused or active for a student.
 * @param {string} studentId
 * @param {boolean} paused
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function setRemindersPaused(studentId, paused, db = {}, storageService = null) {
  if (!Array.isArray(db.students)) return false;
  const student = db.students.find(s => s && s.id === studentId);
  if (!student) return false;

  student.remindersPaused = Boolean(paused);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return true;
}

/**
 * Update student status (e.g. active, paused, graduated, withdrawn).
 * @param {string} studentId
 * @param {string} status
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function updateStudentStatus(studentId, status, db = {}, storageService = null) {
  if (!Array.isArray(db.students)) return false;
  const student = db.students.find(s => s && s.id === studentId);
  if (!student) return false;

  student.status = status;

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return true;
}

/**
 * Retrieve admissions enrollments applications list.
 * @param {object} db
 * @returns {Array}
 */
export function getEnrollments(db = {}) {
  return Array.isArray(db.enrollments) ? db.enrollments : [];
}

/**
 * Add a new online admission enrollment.
 * @param {object} rawEnrollment
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addEnrollment(rawEnrollment, db = {}, storageService = null) {
  if (!Array.isArray(db.enrollments)) db.enrollments = [];
  const enrollment = Object.assign({}, rawEnrollment);

  enrollment.id = enrollment.id || (`enr-${Date.now()}`);
  enrollment.status = 'pending';
  enrollment.timestamp = new Date().toISOString();

  db.enrollments.push(enrollment);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'enrollments', action: 'add', item: enrollment } }));
  }

  return enrollment;
}

/**
 * Approve enrollment application and onboard as active enrolled student.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {Promise<object|null>}
 */
export async function approveEnrollment(id, db = {}, storageService = null) {
  if (!Array.isArray(db.enrollments)) return null;
  const idx = db.enrollments.findIndex(e => e && e.id === id);
  if (idx === -1) return null;

  const enr = db.enrollments[idx];
  enr.status = 'approved';

  if (!Array.isArray(db.students)) db.students = [];
  const newStudent = {
    id: `std-${Date.now()}`,
    firstName: enr.studentFirstName || '',
    lastName: enr.studentLastName || '',
    age: parseInt(enr.studentAge, 10) || 8,
    gender: enr.studentGender || 'Unspecified',
    experience: enr.experience || 'Beginner',
    program: enr.program || 'Scratch Creators',
    status: 'active',
    parentEmail: (enr.parentEmail || enr.email || '').toLowerCase().trim(),
    parentName: enr.parentName || '',
    studentEmail: enr.studentEmail || '',
    mediaConsent: enr.mediaConsent !== false,
    birthday: (enr.studentBirthday && typeof enr.studentBirthday === 'string' && enr.studentBirthday.trim().length >= 10) ? enr.studentBirthday.trim() : '',
    hasExplicitBirthday: Boolean(enr.studentBirthday && enr.studentBirthday.trim()),
    fatherName: enr.fatherName || '',
    fatherPhone: enr.fatherPhone || '',
    motherName: enr.motherName || '',
    motherPhone: enr.motherPhone || '',
    progress: 0,
    avatarColor: 'bg-purple-500',
    tutorName: 'Sarah Jane',
    tutorEmail: 'tutor@stemuluskidstech.com',
    tutorId: 'tut-101',
    classroomLink: enr.classroomLink || ''
  };
  db.students.push(newStudent);

  if (!Array.isArray(db.schedules)) db.schedules = [];
  const sessionDate = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
  db.schedules.push({
    id: `sch-${Date.now()}`,
    studentId: newStudent.id,
    studentName: `${newStudent.firstName} ${newStudent.lastName}`.trim(),
    course: newStudent.program,
    date: sessionDate,
    time: '16:30',
    duration: '60',
    mentor: 'Sarah Jane',
    tutorName: 'Sarah Jane',
    tutorEmail: 'tutor@stemuluskidstech.com',
    tutorId: 'tut-101',
    link: 'https://zoom.us/j/mock-link',
    attendanceStatus: 'pending'
  });

  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (enr.email) {
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Student Registered!',
      message: `Congratulations! ${enr.studentFirstName || 'your child'}'s enrollment in ${enr.program || 'the program'} has been approved.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: enr.email.toLowerCase().trim()
    });

    db.users = db.users || {};
    const parentKey = enr.email.toLowerCase().trim();
    if (!db.users[parentKey]) {
      const pwdChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let randomPassword = '';
      for (let i = 0; i < 10; i++) {
        randomPassword += pwdChars.charAt(Math.floor(Math.random() * pwdChars.length));
      }
      const defaultPwd = await hashPassword(randomPassword);
      db.users[parentKey] = {
        email: enr.email,
        password: defaultPwd,
        role: 'parent',
        name: enr.parentName || 'Parent'
      };

      db.notifications.push({
        id: `not-${Date.now() + 1}`,
        title: 'Your Portal Login Credentials',
        message: `Welcome ${enr.parentName || 'Parent'}! Your STEMulus parent portal login: Email: ${enr.email} | Temporary Password: ${randomPassword} - Please change this after your first login.`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: enr.email.toLowerCase().trim()
      });
    }
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'students', action: 'add', item: newStudent } }));
  }

  return newStudent;
}

export const StudentManagementService = {
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
};
