/**
 * STEMulus Student Attendance and Class Session Management Service (ES Module)
 * Authoritative business logic for attendance submission, verification, fraud checks,
 * overdue session monitoring, schedule reconciliation, and parent progress reporting.
 */

import { addMonths } from '../tuition/tuition-service.js';

/**
 * Retrieve attendance records, optionally filtered by tutor email or name.
 * @param {string|null} tutorEmail
 * @param {object} db
 * @returns {Array}
 */
export function getAttendanceRecords(tutorEmail = null, db = {}) {
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  if (!tutorEmail) return records;

  const key = String(tutorEmail).toLowerCase().trim();
  return records.filter(r => {
    if (!r) return false;
    const rEmail = (r.tutorEmail || '').toLowerCase().trim();
    const rName = (r.tutorName || '').toLowerCase().trim();
    return rEmail === key || rName === key;
  });
}

/**
 * Calculate expected monthly session target based on booked days, weekly frequency (1, 2, 3, 4+ sessions/week), and calendar dates.
 * @param {object|string} studentOrId
 * @param {string|Date|null} targetDate
 * @param {object} db
 * @returns {number}
 */
export function calculateMonthlySessionTarget(studentOrId, targetDate = null, db = {}) {
  const d = targetDate ? new Date(targetDate) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth();

  let student = null;
  if (typeof studentOrId === 'object' && studentOrId !== null) {
    student = studentOrId;
  } else if (typeof studentOrId === 'string' && Array.isArray(db.students)) {
    student = db.students.find(s => s && s.id === studentOrId);
  }

  if (student && (student.monthlyTarget || student.sessionsPerMonth)) {
    const explicitMonthly = parseInt(student.monthlyTarget || student.sessionsPerMonth, 10);
    if (!isNaN(explicitMonthly) && explicitMonthly > 0) return explicitMonthly;
  }

  const studentSchedules = (Array.isArray(db.schedules) ? db.schedules : []).filter(s => {
    if (!s || !student) return false;
    const matchId = s.studentId && s.studentId === student.id;
    const sFullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
    const matchName = s.studentName && s.studentName.toLowerCase().trim() === sFullName;
    return matchId || matchName;
  });

  const dayNames = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const bookedDaysOfWeek = new Set();

  if (student && Array.isArray(student.scheduleDays) && student.scheduleDays.length > 0) {
    student.scheduleDays.forEach(day => {
      if (typeof day === 'number' && day >= 0 && day <= 6) bookedDaysOfWeek.add(day);
      else if (typeof day === 'string' && dayNames[day.toLowerCase().trim()] !== undefined) {
        bookedDaysOfWeek.add(dayNames[day.toLowerCase().trim()]);
      }
    });
  }

  studentSchedules.forEach(s => {
    if (!s) return;
    if (s.dayOfWeek && typeof s.dayOfWeek === 'string' && dayNames[s.dayOfWeek.toLowerCase().trim()] !== undefined) {
      bookedDaysOfWeek.add(dayNames[s.dayOfWeek.toLowerCase().trim()]);
    } else if (s.date) {
      const schedDate = new Date(s.date + 'T00:00:00');
      if (!isNaN(schedDate.getTime())) {
        bookedDaysOfWeek.add(schedDate.getDay());
      }
    }
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const explicitWeeklyFreq = (student && (student.weeklyFrequency || student.sessionsPerWeek))
    ? parseInt(student.weeklyFrequency || student.sessionsPerWeek, 10)
    : 0;

  if (bookedDaysOfWeek.size > 0 && bookedDaysOfWeek.size >= explicitWeeklyFreq) {
    let sessionCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(year, month, day);
      if (bookedDaysOfWeek.has(checkDate.getDay())) {
        sessionCount++;
      }
    }
    if (student && student.metrics && student.metrics.total && student.metrics.total > sessionCount && (!student.scheduleDays || student.scheduleDays.length === 0)) {
      return parseInt(student.metrics.total, 10);
    }
    return sessionCount;
  }

  if (explicitWeeklyFreq === 0 && student && student.metrics && student.metrics.total && student.metrics.total > 0) {
    return parseInt(student.metrics.total, 10);
  }

  const weeklyFrequency = explicitWeeklyFreq > 0 ? explicitWeeklyFreq : 2;
  const freqDayMap = {
    1: [6],
    2: [2, 4],
    3: [1, 3, 5],
    4: [2, 3, 6, 0],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6]
  };
  const defaultDays = freqDayMap[weeklyFrequency] || [2, 4];
  let sessionCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const checkDate = new Date(year, month, day);
    if (defaultDays.includes(checkDate.getDay())) {
      sessionCount++;
    }
  }
  return sessionCount;
}

/**
 * Add an attendance record submitted by a tutor.
 * @param {object} rawRecord
 * @param {object} db
 * @param {object} storageService
 * @param {object} session
 * @returns {object}
 */
export function addAttendanceRecord(rawRecord, db = {}, storageService = null, session = null) {
  if (!rawRecord || typeof rawRecord !== 'object') {
    return { success: false, message: 'Invalid attendance record data.' };
  }

  const record = Object.assign({}, rawRecord);

  record.studentId = record.studentId || record.student_id;
  record.studentName = record.studentName || record.student_name || '';
  record.classDate = record.classDate || record.class_date || new Date().toISOString().split('T')[0];
  record.classTime = record.classTime || record.class_time || '16:00';
  record.attendanceStatus = record.attendanceStatus || record.attendance_status || 'present';
  record.duration = record.duration || record.duration_minutes || '60';
  record.whatBuilt = record.whatBuilt !== undefined ? record.whatBuilt : (record.what_built !== undefined ? record.what_built : '');
  record.homeworkAssigned = record.homeworkAssigned !== undefined ? record.homeworkAssigned : (record.homework_assigned !== undefined ? record.homework_assigned : '');
  record.conceptGrasp = record.conceptGrasp !== undefined ? record.conceptGrasp : (record.concept_grasp !== undefined ? record.concept_grasp : 0);
  record.assignmentStatus = record.assignmentStatus !== undefined ? record.assignmentStatus : (record.assignment_status !== undefined ? record.assignment_status : '');
  record.tutorComment = record.tutorComment !== undefined ? record.tutorComment : (record.tutor_comment !== undefined ? record.tutor_comment : (record.notes || ''));

  if (!Array.isArray(record.coursesCovered) || record.coursesCovered.length === 0) {
    if (record.course) {
      record.coursesCovered = [record.course];
    } else {
      record.coursesCovered = ['STEM Coding'];
    }
  }
  if (!record.topic && record.whatBuilt) {
    record.topic = record.whatBuilt;
  }

  if (!record.studentId || !record.topic) {
    return {
      success: false,
      code: !record.studentId ? 'MISSING_STUDENT' : 'MISSING_TOPIC',
      errorType: 'MISSING_FIELDS',
      message: 'Missing required fields: studentId and topic are mandatory.'
    };
  }

  // Validate duration bounds (1 to 300 minutes)
  const rawDur = rawRecord.duration !== undefined ? rawRecord.duration : rawRecord.duration_minutes;
  const durNum = rawDur !== undefined ? parseFloat(rawDur) : parseFloat(record.duration);
  if (isNaN(durNum) || durNum <= 0 || durNum > 300) {
    return {
      success: false,
      errorType: 'INVALID_DURATION',
      code: 'INVALID_DURATION',
      message: 'Invalid session duration: Duration must be between 15 and 300 minutes.'
    };
  }
  record.duration = String(Math.round(durNum));

  // Normalize attendance status (present, absent, late, rescheduled)
  const normStatus = String(record.attendanceStatus || 'present').toLowerCase().trim();
  record.attendanceStatus = ['present', 'absent', 'late', 'rescheduled'].includes(normStatus) ? normStatus : 'present';
  if (record.attendanceStatus === 'late' && !record.punctuality) {
    record.punctuality = 'late';
  }

  // Validate classDate against future-dating and excessive backdating (>90 days)
  const todayStr = new Date().toISOString().split('T')[0];
  if (record.classDate > todayStr && !rawRecord.allowFutureDate) {
    return {
      success: false,
      errorType: 'FUTURE_CLASS',
      code: 'FUTURE_CLASS',
      message: `Advance submission blocked: Cannot log attendance for a future date (${record.classDate}).`
    };
  }

  const parsedClassDate = new Date(record.classDate + 'T00:00:00Z');
  const parsedToday = new Date(todayStr + 'T00:00:00Z');
  if (!isNaN(parsedClassDate.getTime()) && !rawRecord.allowBackdate) {
    const diffDays = (parsedToday.getTime() - parsedClassDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      return {
        success: false,
        errorType: 'BACKDATE_LIMIT_EXCEEDED',
        code: 'BACKDATE_LIMIT_EXCEEDED',
        message: 'Backdate limit exceeded: Attendance logs cannot be backdated more than 90 days without administrative override.'
      };
    }
  }

  if (!Array.isArray(db.attendanceRecords)) {
    db.attendanceRecords = [];
  }

  // Race-condition & duplicate guard: block rapid double-submissions for the same student + date + time + topic
  if (!rawRecord.allowDuplicate) {
    const existingDup = db.attendanceRecords.find(r =>
      r &&
      r.studentId === record.studentId &&
      r.classDate === record.classDate &&
      (r.classTime || '16:00') === (record.classTime || '16:00') &&
      String(r.topic || '').toLowerCase().trim() === String(record.topic || '').toLowerCase().trim()
    );
    if (existingDup) {
      return {
        success: false,
        errorType: 'DUPLICATE_SUBMISSION',
        code: 'DUPLICATE_SUBMISSION',
        duplicateOf: existingDup.id,
        message: 'Duplicate attendance submission blocked: A log for this student, date, and session slot has already been recorded.'
      };
    }
  }

  if (!record.studentName && record.studentId && Array.isArray(db.students)) {
    const st = db.students.find(s => s && s.id === record.studentId);
    if (st) record.studentName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
  }

  if (!record.tutorName && session) record.tutorName = session.name || 'Tutor';
  if (!record.tutorEmail && session) record.tutorEmail = session.email || '';

  if (!Array.isArray(db.attendanceRecords)) {
    db.attendanceRecords = [];
  }

  record.id = record.id || `att-${Date.now()}`;
  record.status = record.status || 'pending';
  record.verifiedMeeting = true;
  record.timestamp = record.timestamp || new Date().toISOString();

  if (record.punctuality === undefined) record.punctuality = '';
  if (record.assignmentStatus === undefined) record.assignmentStatus = '';
  if (record.conceptGrasp === undefined) record.conceptGrasp = 0;
  if (record.tutorComment === undefined) record.tutorComment = '';
  if (record.homeworkAssigned === undefined) record.homeworkAssigned = '';

  // Normalize optional Completed Project Links
  const rawLinks = record.completedProjectLinks !== undefined
    ? record.completedProjectLinks
    : (record.completed_project_links || record.projectLinks || record.projectLink || '');
  const normalizedLinks = Array.isArray(rawLinks)
    ? rawLinks.map(u => String(u || '').trim()).filter(Boolean)
    : String(rawLinks || '').split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
  record.completedProjectLinks = normalizedLinks;
  record.completed_project_links = normalizedLinks.join(', ');
  record.projectLink = normalizedLinks[0] || '';

  db.attendanceRecords.push(record);

  // Sync Completed Project Links / session build into student milestones & active monthly report compilation
  if (normalizedLinks.length > 0) {
    if (!Array.isArray(db.milestones)) db.milestones = [];
    const projTitle = record.whatBuilt || record.topic || 'Completed Class Project';
    const dupMilestone = db.milestones.find(m =>
      m && m.studentId === record.studentId && m.projectUrl === normalizedLinks[0] && m.date === record.classDate
    );
    if (!dupMilestone) {
      db.milestones.push({
        id: `mil-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId: record.studentId,
        studentName: record.studentName,
        title: projTitle,
        description: record.tutorComment || `Completed during ${record.topic || 'coding'} session (${record.classDate}).`,
        category: Array.isArray(record.coursesCovered) && record.coursesCovered[0] ? record.coursesCovered[0] : (record.course || 'Project Build'),
        projectUrl: normalizedLinks[0],
        completedProjectLinks: normalizedLinks,
        date: record.classDate
      });
    }
  }

  if (Array.isArray(db.monthlyReports) && record.studentId && record.classDate) {
    const monthKey = String(record.classDate).slice(0, 7);
    db.monthlyReports.forEach(mr => {
      if (mr && mr.studentId === record.studentId && (!mr.month || String(mr.month).startsWith(monthKey))) {
        const existingLinks = Array.isArray(mr.completedProjectLinks) ? mr.completedProjectLinks : [];
        const mergedLinks = Array.from(new Set([...existingLinks, ...normalizedLinks]));
        mr.completedProjectLinks = mergedLinks;
        mr.completed_project_links = mergedLinks.join(', ');
      }
    });
  }

  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  db.notifications.push({
    id: `not-${Date.now()}`,
    title: 'New Attendance Submitted',
    message: `${record.tutorName || 'A tutor'} submitted attendance for ${record.studentName || 'a student'} (${record.classDate}). Topic: "${record.topic}". Pending admin approval.`,
    timestamp: new Date().toISOString(),
    read: false,
    userEmail: 'admin@stemuluskidstech.com'
  });

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'attendanceRecords', item: record } }));
  }

  return Object.assign({ success: true, record: record }, record);
}

/**
 * Update attendance status (approved, rejected, flagged) and update child records accordingly.
 * @param {string} id
 * @param {string} status
 * @param {object} db
 * @param {object} storageService
 * @returns {object|null}
 */
export function updateAttendanceStatus(id, status, db = {}, storageService = null) {
  if (!Array.isArray(db.attendanceRecords)) {
    return null;
  }

  const idx = db.attendanceRecords.findIndex(r => r && r.id === id);
  if (idx === -1) {
    return null;
  }

  db.attendanceRecords[idx].status = status;
  const record = db.attendanceRecords[idx];

  if (status === 'approved') {
    if (!Array.isArray(db.schedules)) db.schedules = [];

    const schedIdx = db.schedules.findIndex(s =>
      s && (
        (record.scheduleId && s.id === record.scheduleId) ||
        (s.studentId === record.studentId && s.date === record.classDate)
      )
    );

    const effectiveStatus = (record.attendanceStatus === 'absent' || record.attendanceStatus === 'rescheduled')
      ? record.attendanceStatus
      : 'present';

    if (schedIdx !== -1) {
      db.schedules[schedIdx].attendanceStatus = effectiveStatus;
      if (record.attendanceStatus === 'late' || record.punctuality === 'late') {
        db.schedules[schedIdx].punctuality = 'late';
      }
      db.schedules[schedIdx].topic = record.topic;
      db.schedules[schedIdx].homework = record.homeworkAssigned;
      db.schedules[schedIdx].homeworkAssigned = record.homeworkAssigned;
      db.schedules[schedIdx].tutorComment = record.tutorComment || record.notes;
      db.schedules[schedIdx].conceptGrasp = record.conceptGrasp || 0;
      db.schedules[schedIdx].whatBuilt = record.whatBuilt || '';
    } else {
      const newSchedule = {
        id: `sch-${Date.now()}`,
        studentId: record.studentId,
        studentName: record.studentName,
        course: (Array.isArray(record.coursesCovered) && record.coursesCovered.length > 0 ? record.coursesCovered[0] : (record.course || 'STEM Program')),
        date: record.classDate,
        time: record.classTime || '16:00',
        duration: record.duration || '60',
        mentor: record.tutorName || 'Faculty Instructor',
        link: '',
        attendanceStatus: effectiveStatus,
        punctuality: record.attendanceStatus === 'late' ? 'late' : (record.punctuality || 'on_time'),
        topic: record.topic,
        homework: record.homeworkAssigned,
        homeworkAssigned: record.homeworkAssigned,
        tutorComment: record.tutorComment || record.notes,
        conceptGrasp: record.conceptGrasp || 0,
        whatBuilt: record.whatBuilt || ''
      };
      db.schedules.push(newSchedule);
    }

    if (Array.isArray(db.students)) {
      const studIdx = db.students.findIndex(s => s && s.id === record.studentId);
      if (studIdx !== -1) {
        const student = db.students[studIdx];
        if (!student.metrics) {
          student.metrics = { attended: 0, total: 0, projects: 0, lines: 0 };
        }

        const approvedCount = db.attendanceRecords.filter(r =>
          r && r.studentId === record.studentId &&
          (r.status === 'approved' || r.isHeld) &&
          r.attendanceStatus !== 'absent'
        ).length;

        student.metrics.attended = approvedCount;
        student.metrics.total = calculateMonthlySessionTarget(student, record.classDate, db);

        if (!student.billing) {
          const nextDue = addMonths(record.classDate, 1);
          student.billing = {
            firstClassDate: record.classDate,
            anchorDay: parseInt(record.classDate.slice(8, 10), 10) || 1,
            cycleStartDate: record.classDate,
            nextDueDate: nextDue,
            monthlyFee: student.monthlyFee || 35000,
            currency: 'NGN',
            status: 'current',
            history: []
          };
        } else if (!student.billing.firstClassDate) {
          student.billing.firstClassDate = record.classDate;
          if (!student.billing.cycleStartDate) {
            student.billing.cycleStartDate = record.classDate;
            student.billing.nextDueDate = addMonths(record.classDate, 1, student.billing.anchorDay);
          }
        }
      }
    }

    if (!Array.isArray(db.progressReports)) db.progressReports = [];
    db.progressReports.push({
      id: `rep-${Date.now()}`,
      studentId: record.studentId,
      studentName: record.studentName,
      program: Array.isArray(record.coursesCovered) ? record.coursesCovered.join(', ') : (record.course || 'STEM Program'),
      date: record.classDate,
      tutorName: record.tutorName,
      module: record.topic,
      grade: (record.conceptGrasp >= 4 ? 'A' : (record.conceptGrasp >= 3 ? 'B' : 'Satisfactory')),
      feedback: record.tutorComment || record.notes || (record.whatBuilt ? `Built: ${record.whatBuilt}` : 'Active class participation.'),
      homework: record.homeworkAssigned,
      homeworkAssigned: record.homeworkAssigned,
      whatBuilt: record.whatBuilt,
      completedProjectLinks: Array.isArray(record.completedProjectLinks) ? record.completedProjectLinks : [],
      completed_project_links: record.completed_project_links || '',
      projectLink: record.projectLink || (Array.isArray(record.completedProjectLinks) && record.completedProjectLinks[0]) || '',
      attendanceRecordId: record.id
    });

    const studentRecord = Array.isArray(db.students) ? db.students.find(s => s && s.id === record.studentId) : null;
    const parentEmail = studentRecord && studentRecord.parentEmail ? studentRecord.parentEmail.toLowerCase().trim() : null;

    if (parentEmail) {
      if (!Array.isArray(db.notifications)) db.notifications = [];
      db.notifications.push({
        id: `not-${Date.now()}`,
        title: `Class Verified: ${record.studentName}`,
        message: `${record.studentName}'s session for ${record.classDate} has been verified by admin. Topic: "${record.topic}". Assignment given: "${record.homeworkAssigned || 'Review class project'}".`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: parentEmail
      });
    }
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'attendanceRecords', item: record } }));
  }

  return record;
}

/**
 * Scan schedules for overdue attendance submissions.
 * @param {string|null} tutorEmail
 * @param {object} db
 * @param {object|null} session
 * @returns {Array}
 */
export function getOverdueAttendance(tutorEmail = null, db = {}, session = null) {
  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const attendanceRecords = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const todayStr = new Date().toISOString().split('T')[0];

  let overdue = schedules.filter(s => {
    if (!s || !s.date) return false;
    const isPastOrToday = s.date <= todayStr;
    const isPendingSchedule = s.attendanceStatus === 'pending';
    if (!isPastOrToday || !isPendingSchedule) return false;

    const hasSubmitted = attendanceRecords.some(r =>
      r && (
        (r.scheduleId && r.scheduleId === s.id) ||
        (r.studentId === s.studentId && (r.classDate === s.date || r.date === s.date))
      )
    );
    return !hasSubmitted;
  });

  if (tutorEmail) {
    const tutorLower = tutorEmail.toLowerCase().trim();
    const tutorNameLower = (session && session.name ? session.name : '').toLowerCase().trim();
    overdue = overdue.filter(s => {
      const matchEmail = s.tutorEmail && s.tutorEmail.toLowerCase().trim() === tutorLower;
      const matchMentor = s.mentor && s.mentor.toLowerCase().trim() === tutorNameLower;
      return matchEmail || matchMentor;
    });
  }

  return overdue;
}

/**
 * Check if attendance has already been submitted for a session.
 * @param {string} studentId
 * @param {string} date
 * @param {string} time
 * @param {string} topic
 * @param {Array} courses
 * @param {object} db
 * @returns {object}
 */
export function checkDuplicateAttendance(studentId, date, time, topic = '', courses = [], db = {}) {
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const matches = records.filter(r => r && r.studentId === studentId && r.classDate === date);

  if (matches.length === 0) {
    return { has_duplicate: false, has_exact_duplicate: false, duplicates: [] };
  }

  let hasExact = false;
  const duplicateList = matches.map(dup => {
    const timeMatches = dup.classTime === time;
    const topicMatches = (dup.topic || '').toLowerCase().trim() === (topic || '').toLowerCase().trim();
    const c1 = Array.isArray(dup.coursesCovered) ? dup.coursesCovered.slice().sort() : [];
    const c2 = Array.isArray(courses) ? courses.slice().sort() : [];
    const coursesMatch = JSON.stringify(c1) === JSON.stringify(c2);
    const isExact = timeMatches && topicMatches && coursesMatch;
    if (isExact) hasExact = true;
    return {
      id: dup.id,
      topic: dup.topic,
      classTime: dup.classTime,
      is_exact: isExact
    };
  });

  return {
    has_duplicate: true,
    has_exact_duplicate: hasExact,
    duplicates: duplicateList
  };
}

export const AttendanceService = {
  getAttendanceRecords,
  calculateMonthlySessionTarget,
  addAttendanceRecord,
  updateAttendanceStatus,
  getOverdueAttendance,
  checkDuplicateAttendance
};
