/**
 * STEMulus Data Integrity and Deduplication Service
 * Authoritative business logic for sanitizing state, resolving referential integrity,
 * and deduplicating students, schedules, attendance logs, notifications, email queues,
 * and monthly reports across all storage adapters.
 */

/**
 * Returns a normalized English day name from a YYYY-MM-DD date string.
 * @param {string} dateString
 * @returns {string}
 */
export function deriveDayOfWeek(dateString) {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (!dateString) return 'Monday';
  const parts = String(dateString).trim().slice(0, 10).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d, 12, 0, 0);
    return !isNaN(dateObj.getDay()) ? DAYS[dateObj.getDay()] : 'Monday';
  }
  const fallback = new Date(dateString);
  return !isNaN(fallback.getDay()) ? DAYS[fallback.getDay()] : 'Monday';
}

/**
 * Deduplicate students roster by primary ID and natural composite key.
 * Merges attributes so richer metrics, Google Meet links, and Google Classroom metadata are retained.
 * @param {Array} students
 * @param {Array} deletedStudentIds
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateStudents(students = [], deletedStudentIds = []) {
  if (!Array.isArray(students)) return { deduped: [], prunedCount: 0 };
  const delIds = new Set((Array.isArray(deletedStudentIds) ? deletedStudentIds : []).map(id => String(id).trim()));

  const seenIds = new Map();
  const seenNaturalKeys = new Map();
  const deduped = [];
  let prunedCount = 0;

  students.forEach(s => {
    if (!s || s.isDeleted === true) {
      prunedCount++;
      return;
    }
    const id = String(s.id || '').trim();
    if (id && delIds.has(id)) {
      prunedCount++;
      return;
    }

    const fName = String(s.firstName || '').toLowerCase().trim();
    const lName = String(s.lastName || '').toLowerCase().trim();
    const pEmail = String(s.parentEmail || '').toLowerCase().trim();
    const naturalKey = (fName || lName) ? `${fName}_${lName}_${pEmail}` : '';

    const existingByIdIdx = id ? seenIds.get(id) : undefined;
    const existingByNatIdx = naturalKey.length > 3 ? seenNaturalKeys.get(naturalKey) : undefined;
    const targetIdx = existingByIdIdx !== undefined ? existingByIdIdx : existingByNatIdx;

    if (targetIdx !== undefined) {
      prunedCount++;
      const existing = deduped[targetIdx];
      // Merge richer attributes into canonical record
      if (!existing.meetLink && s.meetLink) existing.meetLink = s.meetLink;
      if (!existing.googleClassroom && s.googleClassroom) existing.googleClassroom = s.googleClassroom;
      if (!existing.classroomLink && s.classroomLink) existing.classroomLink = s.classroomLink;
      if (!existing.tutorEmail && s.tutorEmail) existing.tutorEmail = s.tutorEmail;
      if (!existing.tutorName && s.tutorName) existing.tutorName = s.tutorName;
      if (!existing.parentPhone && s.parentPhone) existing.parentPhone = s.parentPhone;
      if (!existing.birthday && s.birthday) existing.birthday = s.birthday;
      if (s.metrics && (!existing.metrics || (s.metrics.attended || 0) > (existing.metrics.attended || 0))) {
        existing.metrics = Object.assign({}, existing.metrics || {}, s.metrics);
      }
      if (s.billing && !existing.billing) {
        existing.billing = s.billing;
      }
      return;
    }

    const newIdx = deduped.length;
    if (id) seenIds.set(id, newIdx);
    if (naturalKey.length > 3) seenNaturalKeys.set(naturalKey, newIdx);
    deduped.push(Object.assign({}, s));
  });

  return { deduped, prunedCount };
}

/**
 * Deduplicate schedules by slot key (student + date + time).
 * Cleans corrupted dates, cascades tutor and parent metadata from students,
 * and preserves held/completed attendance statuses.
 * @param {Array} schedules
 * @param {Array} students
 * @returns {{ deduped: Array, prunedCount: number, healedCount: number }}
 */
export function deduplicateSchedules(schedules = [], students = []) {
  if (!Array.isArray(schedules)) return { deduped: [], prunedCount: 0, healedCount: 0 };
  const studentMapById = new Map();
  const studentMapByName = new Map();

  (Array.isArray(students) ? students : []).forEach(st => {
    if (!st) return;
    if (st.id) studentMapById.set(st.id, st);
    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase().trim();
    if (fullName) studentMapByName.set(fullName, st);
  });

  const slotMap = new Map();
  const deduped = [];
  let prunedCount = 0;
  let healedCount = 0;

  schedules.forEach(sch => {
    if (!sch) {
      prunedCount++;
      return;
    }

    // Cleanse corrupt dates
    const dateStr = String(sch.date || '').trim();
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') {
      prunedCount++;
      return;
    }

    // Resolve or heal student reference
    let matchedStudent = sch.studentId ? studentMapById.get(sch.studentId) : null;
    if (!matchedStudent && sch.studentName) {
      matchedStudent = studentMapByName.get(String(sch.studentName).toLowerCase().trim());
    }

    const working = Object.assign({}, sch);
    if (matchedStudent) {
      if (!working.studentId) {
        working.studentId = matchedStudent.id;
        healedCount++;
      }
      if (!working.studentName) {
        working.studentName = `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim();
        healedCount++;
      }
      if (matchedStudent.tutorEmail && working.tutorEmail !== matchedStudent.tutorEmail) {
        working.tutorEmail = matchedStudent.tutorEmail;
        healedCount++;
      }
      if (matchedStudent.tutorName && (!working.tutorName || !working.mentor)) {
        working.tutorName = working.tutorName || matchedStudent.tutorName;
        working.mentor = working.mentor || matchedStudent.tutorName;
        healedCount++;
      }
      if (matchedStudent.tutorId && working.tutorId !== matchedStudent.tutorId) {
        working.tutorId = matchedStudent.tutorId;
        healedCount++;
      }
      if (matchedStudent.parentEmail && working.parentEmail !== matchedStudent.parentEmail) {
        working.parentEmail = matchedStudent.parentEmail;
        healedCount++;
      }
      if (matchedStudent.meetLink && (!working.link || working.link === 'https://meet.google.com')) {
        working.link = matchedStudent.meetLink;
        healedCount++;
      }
    }

    if (!working.dayOfWeek && working.date) {
      working.dayOfWeek = deriveDayOfWeek(working.date);
    }
    if (!working.duration) {
      working.duration = '60';
    }

    const studentRef = String(working.studentId || working.studentName || '').toLowerCase().trim();
    const timeRef = String(working.time || '00:00').trim();
    const slotKey = `${studentRef}|${dateStr}|${timeRef}`;

    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, deduped.length);
      deduped.push(working);
    } else {
      prunedCount++;
      const existingIdx = slotMap.get(slotKey);
      const existing = deduped[existingIdx];

      // Merge: if duplicate was present or done, elevate canonical schedule
      const isComplete = working.attendanceStatus === 'present' || working.attendanceStatus === 'done' || working.status === 'done' || working.status === 'approved';
      if (isComplete) {
        existing.attendanceStatus = 'present';
        existing.status = 'done';
        if (working.topic && !existing.topic) existing.topic = working.topic;
        if (working.whatBuilt && !existing.whatBuilt) existing.whatBuilt = working.whatBuilt;
        if (working.homework && !existing.homework) existing.homework = working.homework;
        if (working.tutorComment && !existing.tutorComment) existing.tutorComment = working.tutorComment;
      }
    }
  });

  return { deduped, prunedCount, healedCount };
}

/**
 * Deduplicate attendance records by student, date, and schedule ID.
 * Preserves approved status and richest evaluation feedback.
 * @param {Array} records
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateAttendanceRecords(records = []) {
  if (!Array.isArray(records)) return { deduped: [], prunedCount: 0 };
  const seenMap = new Map();
  const deduped = [];
  let prunedCount = 0;

  records.forEach(r => {
    if (!r) {
      prunedCount++;
      return;
    }

    const stId = String(r.studentId || r.student_id || '').trim();
    const dateStr = String(r.classDate || r.class_date || r.date || '').trim();
    const timeStr = String(r.classTime || r.class_time || r.time || '').trim();
    const schedId = String(r.scheduleId || r.schedule_id || '').trim();

    const primaryKey = schedId ? `sched:${schedId}` : `st:${stId}|${dateStr}|${timeStr}`;

    if (!seenMap.has(primaryKey)) {
      seenMap.set(primaryKey, deduped.length);
      deduped.push(Object.assign({}, r));
    } else {
      prunedCount++;
      const existingIdx = seenMap.get(primaryKey);
      const existing = deduped[existingIdx];

      // Elevate to approved status if either was approved
      if (r.status === 'approved' || r.attendanceStatus === 'present') {
        existing.status = 'approved';
        existing.attendanceStatus = 'present';
      }
      if (r.topic && !existing.topic) existing.topic = r.topic;
      if (r.whatBuilt && !existing.whatBuilt) existing.whatBuilt = r.whatBuilt;
      if (r.conceptGrasp && (!existing.conceptGrasp || r.conceptGrasp > existing.conceptGrasp)) {
        existing.conceptGrasp = r.conceptGrasp;
      }
      if (r.tutorComment && !existing.tutorComment) existing.tutorComment = r.tutorComment;
    }
  });

  return { deduped, prunedCount };
}

/**
 * Deduplicate notifications by recipient email, title, and timestamp/date.
 * Preserves read receipt state.
 * @param {Array} notifications
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateNotifications(notifications = []) {
  if (!Array.isArray(notifications)) return { deduped: [], prunedCount: 0 };
  const seenKeys = new Map();
  const deduped = [];
  let prunedCount = 0;

  notifications.forEach(n => {
    if (!n) {
      prunedCount++;
      return;
    }

    const uEmail = String(n.userEmail || '').toLowerCase().trim();
    const title = String(n.title || '').trim();
    const isCountdown = title.includes('Class in ') || title.includes('Class Reminder');
    const datePart = String(n.timestamp || '').slice(0, 10);
    const msg = String(n.message || '').trim();

    const dedupKey = isCountdown
      ? `${uEmail}|${title}|${datePart}`
      : `${uEmail}|${title}|${msg}`;

    if (!seenKeys.has(dedupKey)) {
      seenKeys.set(dedupKey, deduped.length);
      deduped.push(Object.assign({}, n));
    } else {
      prunedCount++;
      const existingIdx = seenKeys.get(dedupKey);
      // If any instance was marked read, maintain read state
      if (n.read === true) {
        deduped[existingIdx].read = true;
      }
    }
  });

  return { deduped, prunedCount };
}

/**
 * Deduplicate email queue items by recipient and email type.
 * @param {Array} emailQueue
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateEmailQueue(emailQueue = []) {
  if (!Array.isArray(emailQueue)) return { deduped: [], prunedCount: 0 };
  const seenIds = new Set();
  const seenKeys = new Set();
  const deduped = [];
  let prunedCount = 0;

  emailQueue.forEach(item => {
    if (!item) {
      prunedCount++;
      return;
    }
    const to = String(item.to || '').toLowerCase().trim();
    const type = String(item.type || '').trim();
    const id = String(item.id || '').trim();
    const typeKey = (to && type) ? `${to}|${type}` : '';

    if ((id && seenIds.has(id)) || (typeKey && seenKeys.has(typeKey))) {
      prunedCount++;
      return;
    }

    if (id) seenIds.add(id);
    if (typeKey) seenKeys.add(typeKey);
    deduped.push(item);
  });

  return { deduped, prunedCount };
}

/**
 * Deduplicate student monthly progress reports by studentId and evaluation month.
 * @param {Array} reports
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateMonthlyReports(reports = []) {
  if (!Array.isArray(reports)) return { deduped: [], prunedCount: 0 };
  const seen = new Map();
  const deduped = [];
  let prunedCount = 0;

  reports.forEach(r => {
    if (!r) {
      prunedCount++;
      return;
    }
    const studentId = String(r.studentId || '').trim();
    const month = String(r.month || '').toLowerCase().trim();
    const key = (studentId && month) ? `${studentId}|${month}` : String(r.id || '');

    if (!seen.has(key)) {
      seen.set(key, deduped.length);
      deduped.push(Object.assign({}, r));
    } else {
      prunedCount++;
      const existingIdx = seen.get(key);
      const existing = deduped[existingIdx];

      // Prefer approved report over draft or revision
      const isApproved = r.status === 'approved' || r.status === 'sent_to_parent' || r.status === 'sent';
      if (isApproved) {
        deduped[existingIdx] = Object.assign({}, existing, r);
      }
    }
  });

  return { deduped, prunedCount };
}

/**
 * Deduplicate faculty tutors list by email and altEmail, purging deleted records.
 * @param {Array} tutors
 * @param {Array} deletedTutorEmails
 * @returns {{ deduped: Array, prunedCount: number }}
 */
export function deduplicateTutors(tutors = [], deletedTutorEmails = []) {
  if (!Array.isArray(tutors)) return { deduped: [], prunedCount: 0 };
  const delEmails = new Set((Array.isArray(deletedTutorEmails) ? deletedTutorEmails : []).map(e => String(e).toLowerCase().trim()));

  const seenEmails = new Set();
  const seenIds = new Set();
  const deduped = [];
  let prunedCount = 0;

  tutors.forEach(t => {
    if (!t) {
      prunedCount++;
      return;
    }
    const email = String(t.email || '').toLowerCase().trim();
    const altEmail = String(t.altEmail || '').toLowerCase().trim();
    const id = String(t.id || '').trim();

    if ((email && delEmails.has(email)) || (altEmail && delEmails.has(altEmail)) || (id && delEmails.has(id))) {
      prunedCount++;
      return;
    }

    const matchesSeen = (email && seenEmails.has(email)) || (altEmail && seenEmails.has(altEmail)) || (id && seenIds.has(id));
    if (matchesSeen) {
      prunedCount++;
      return;
    }

    if (email) seenEmails.add(email);
    if (altEmail) seenEmails.add(altEmail);
    if (id) seenIds.add(id);
    deduped.push(t);
  });

  return { deduped, prunedCount };
}

/**
 * Enforces holistic database integrity and deduplication across all root collections.
 * Heals orphaned relationships, prunes duplicated entries, and returns an audit report.
 * @param {object} db
 * @returns {{ db: object, audit: object }}
 */
export function enforceDatabaseIntegrity(db = {}) {
  if (!db || typeof db !== 'object') {
    return { db: {}, audit: { valid: false, message: 'Invalid DB object' } };
  }

  const audit = {
    valid: true,
    studentsPruned: 0,
    schedulesPruned: 0,
    schedulesHealed: 0,
    attendancePruned: 0,
    notificationsPruned: 0,
    emailQueuePruned: 0,
    monthlyReportsPruned: 0,
    tutorsPruned: 0,
    totalRecordsPruned: 0
  };

  // 1. Deduplicate Students
  if (Array.isArray(db.students)) {
    const res = deduplicateStudents(db.students, db.deletedStudentIds);
    db.students = res.deduped;
    audit.studentsPruned = res.prunedCount;
  }

  // 2. Deduplicate Schedules & Heal References
  if (Array.isArray(db.schedules)) {
    const res = deduplicateSchedules(db.schedules, db.students);
    db.schedules = res.deduped;
    audit.schedulesPruned = res.prunedCount;
    audit.schedulesHealed = res.healedCount;
  }

  // 3. Deduplicate Attendance Records
  if (Array.isArray(db.attendanceRecords)) {
    const res = deduplicateAttendanceRecords(db.attendanceRecords);
    db.attendanceRecords = res.deduped;
    audit.attendancePruned = res.prunedCount;
  }

  // 4. Deduplicate Notifications
  if (Array.isArray(db.notifications)) {
    const res = deduplicateNotifications(db.notifications);
    db.notifications = res.deduped;
    audit.notificationsPruned = res.prunedCount;
  }

  // 5. Deduplicate Email Queue
  if (Array.isArray(db.emailQueue)) {
    const res = deduplicateEmailQueue(db.emailQueue);
    db.emailQueue = res.deduped;
    audit.emailQueuePruned = res.prunedCount;
  }

  // 6. Deduplicate Monthly Reports
  if (Array.isArray(db.monthlyReports)) {
    const res = deduplicateMonthlyReports(db.monthlyReports);
    db.monthlyReports = res.deduped;
    audit.monthlyReportsPruned = res.prunedCount;
  }

  // 7. Deduplicate Tutors
  if (Array.isArray(db.tutors)) {
    const res = deduplicateTutors(db.tutors, db.deletedTutorEmails);
    db.tutors = res.deduped;
    audit.tutorsPruned = res.prunedCount;
  }

  audit.totalRecordsPruned = (
    audit.studentsPruned +
    audit.schedulesPruned +
    audit.attendancePruned +
    audit.notificationsPruned +
    audit.emailQueuePruned +
    audit.monthlyReportsPruned +
    audit.tutorsPruned
  );

  return { db, audit };
}

// Global browser window bridge
if (typeof window !== 'undefined') {
  window.STEMulus = window.STEMulus || {};
  window.STEMulus.DataIntegrity = {
    deriveDayOfWeek,
    deduplicateStudents,
    deduplicateSchedules,
    deduplicateAttendanceRecords,
    deduplicateNotifications,
    deduplicateEmailQueue,
    deduplicateMonthlyReports,
    deduplicateTutors,
    enforceDatabaseIntegrity
  };
}
