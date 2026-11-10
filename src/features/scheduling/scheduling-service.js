/**
 * STEMulus Scheduling, Google Meet & Zoom Class Management Service (ES Module)
 * Authoritative business logic for weekly recurring schedules, schedule reconciliation,
 * parent reschedule concierge workflows, tutor emergency coverage, and conflict checking.
 */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns the capitalized English day of week from a YYYY-MM-DD date string.
 * @param {string} dateString
 * @returns {string}
 */
export function getDayOfWeek(dateString) {
  if (!dateString) return 'Monday';
  const parts = String(dateString).trim().slice(0, 10).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d, 12, 0, 0);
    return !isNaN(dateObj.getDay()) ? DAYS_OF_WEEK[dateObj.getDay()] : 'Monday';
  }
  const fallback = new Date(dateString);
  return !isNaN(fallback.getDay()) ? DAYS_OF_WEEK[fallback.getDay()] : 'Monday';
}

/**
 * Convert HH:MM time string to minutes from midnight.
 * @param {string} timeStr
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return (h * 60) + m;
}

/**
 * Synchronize completed schedules with approved attendance records.
 * @param {object} db
 * @param {object|null} storageService
 * @returns {Array}
 */
export function reconcileHeldSchedules(db = {}, storageService = null) {
  if (!Array.isArray(db.schedules)) return [];
  const logs = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  let changed = false;

  db.schedules.forEach(s => {
    if (!s) return;
    const currentAttStatus = (s.attendanceStatus || 'pending').toLowerCase();
    const currentStatus = (s.status || '').toLowerCase();

    if (currentAttStatus === 'present' || currentAttStatus === 'done' || currentStatus === 'done') {
      if (s.attendanceStatus !== 'done' && s.attendanceStatus !== 'present') {
        s.attendanceStatus = 'done';
        changed = true;
      }
      if (s.status !== 'done') {
        s.status = 'done';
        changed = true;
      }
      return;
    }

    const hasAttendedLog = logs.some(l => {
      if (!l) return false;
      const matchScheduleId = l.scheduleId && s.id && l.scheduleId === s.id;
      const matchDate = l.classDate && s.date && l.classDate === s.date;
      const matchStudentId = l.studentId && s.studentId && l.studentId === s.studentId;
      const matchStudentName = l.studentName && s.studentName &&
        l.studentName.toLowerCase().trim() === s.studentName.toLowerCase().trim();

      return matchScheduleId || (matchDate && (matchStudentId || matchStudentName));
    });

    if (hasAttendedLog) {
      s.attendanceStatus = 'done';
      s.status = 'done';
      changed = true;
    }
  });

  if (changed && storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  return db.schedules;
}

/**
 * Retrieve schedules, optionally filtered by studentId.
 * Automatically reconciles held sessions against attendance records.
 * @param {string|null} studentId
 * @param {object} db
 * @param {object|null} storageService
 * @returns {Array}
 */
export function getSchedules(studentId = null, db = {}, storageService = null) {
  reconcileHeldSchedules(db, storageService);
  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  if (studentId) {
    return schedules.filter(s => s && s.studentId === studentId);
  }
  return schedules;
}

/**
 * Add a new scheduled class session.
 * @param {object} session
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addSchedule(session, db = {}, storageService = null) {
  if (!Array.isArray(db.schedules)) db.schedules = [];
  const newSession = Object.assign({}, session);
  newSession.id = newSession.id || `sch-${Date.now()}`;
  newSession.duration = String(parseInt(newSession.duration, 10) || 60);
  if (!newSession.dayOfWeek && newSession.date) {
    newSession.dayOfWeek = getDayOfWeek(newSession.date);
  }

  db.schedules.push(newSession);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'schedules', item: newSession } }));
  }

  return newSession;
}

/**
 * Update an existing scheduled class session.
 * @param {string} id
 * @param {object} updatedFields
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateSchedule(id, updatedFields, db = {}, storageService = null) {
  if (!Array.isArray(db.schedules)) return null;
  const idx = db.schedules.findIndex(s => s && s.id === id);
  if (idx === -1) return null;

  db.schedules[idx] = Object.assign({}, db.schedules[idx], updatedFields);
  if (updatedFields.date && !updatedFields.dayOfWeek) {
    db.schedules[idx].dayOfWeek = getDayOfWeek(updatedFields.date);
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'schedules', item: db.schedules[idx] } }));
  }

  return db.schedules[idx];
}

/**
 * Remove a scheduled class session.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteSchedule(id, db = {}, storageService = null) {
  if (!Array.isArray(db.schedules)) return false;
  const initialLen = db.schedules.length;
  db.schedules = db.schedules.filter(s => s && s.id !== id);

  if (db.schedules.length !== initialLen) {
    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'schedules' } }));
    }
    return true;
  }
  return false;
}

/**
 * Retrieve reschedule requests, optionally filtered by parentEmail.
 * @param {string|null} parentEmail
 * @param {object} db
 * @returns {Array}
 */
export function getRescheduleRequests(parentEmail = null, db = {}) {
  const reqs = Array.isArray(db.rescheduleRequests) ? db.rescheduleRequests : [];
  if (parentEmail) {
    const key = String(parentEmail).toLowerCase().trim();
    return reqs.filter(r => r && (r.parentEmail || '').toLowerCase().trim() === key);
  }
  return reqs;
}

/**
 * Submit a reschedule request from parent or tutor.
 * @param {object} rawRequest
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function submitReschedule(rawRequest, db = {}, storageService = null) {
  const request = Object.assign({}, rawRequest);
  request.id = request.id || `res-${Date.now()}`;
  request.status = request.status || 'pending';
  request.requestedDayOfWeek = getDayOfWeek(request.requestedDate);
  request.createdAt = request.createdAt || new Date().toISOString();

  if (!Array.isArray(db.rescheduleRequests)) db.rescheduleRequests = [];
  db.rescheduleRequests.push(request);

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.push({
    id: `not-${Date.now()}`,
    title: 'New Reschedule Request',
    message: `${request.studentName || 'Student'} requested to reschedule ${request.course || 'class'} from ${request.currentDate} to ${request.requestedDate}`,
    timestamp: new Date().toISOString(),
    read: false,
    userEmail: 'admin@stemuluskidstech.com'
  });

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'rescheduleRequests', item: request } }));
  }

  return request;
}

/**
 * Approve a reschedule request, updating the underlying schedule slot and notifying the parent.
 * @param {string} id
 * @param {string|null} substituteTutorId
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function approveReschedule(id, substituteTutorId = null, db = {}, storageService = null) {
  const reqs = Array.isArray(db.rescheduleRequests) ? db.rescheduleRequests : [];
  const reqIdx = reqs.findIndex(r => r && r.id === id);
  if (reqIdx === -1) return false;

  const req = reqs[reqIdx];
  req.status = 'approved';
  req.resolvedAt = new Date().toISOString();

  if (Array.isArray(db.schedules)) {
    const schIdx = db.schedules.findIndex(s => s && s.id === req.scheduleId);
    if (schIdx !== -1) {
      db.schedules[schIdx].date = req.requestedDate;
      db.schedules[schIdx].time = req.requestedTime;
      db.schedules[schIdx].dayOfWeek = getDayOfWeek(req.requestedDate);

      if (substituteTutorId && Array.isArray(db.tutors)) {
        const sub = db.tutors.find(t => t && t.id === substituteTutorId);
        if (sub) {
          db.schedules[schIdx].tutorId = sub.id;
          db.schedules[schIdx].tutorEmail = sub.email;
          db.schedules[schIdx].mentor = sub.name;
        }
      }
    }
  }

  if (req.parentEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Reschedule Approved',
      message: `Your request to move ${req.course || 'class'} to ${req.requestedDate} at ${req.requestedTime} has been approved.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: req.parentEmail.toLowerCase().trim()
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'rescheduleRequests', item: req } }));
  }

  return true;
}

/**
 * Decline a reschedule request and notify the parent.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function declineReschedule(id, db = {}, storageService = null) {
  const reqs = Array.isArray(db.rescheduleRequests) ? db.rescheduleRequests : [];
  const reqIdx = reqs.findIndex(r => r && r.id === id);
  if (reqIdx === -1) return false;

  const req = reqs[reqIdx];
  req.status = 'declined';
  req.resolvedAt = new Date().toISOString();

  if (req.parentEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Reschedule Declined',
      message: `Your request to move ${req.course || 'class'} to ${req.requestedDate} was declined. Please contact support.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: req.parentEmail.toLowerCase().trim()
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'rescheduleRequests', item: req } }));
  }

  return true;
}

/**
 * Retrieve tutor coverage requests.
 * @param {object} db
 * @returns {Array}
 */
export function getCoverageRequests(db = {}) {
  return Array.isArray(db.coverageRequests) ? db.coverageRequests : [];
}

/**
 * Submit an emergency tutor coverage request.
 * @param {object} rawData
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function submitCoverageRequest(rawData, db = {}, storageService = null) {
  const data = Object.assign({}, rawData);
  data.id = data.id || `cov-${Date.now()}`;
  data.status = 'pending';
  data.timestamp = new Date().toISOString();

  if (!Array.isArray(db.coverageRequests)) db.coverageRequests = [];
  db.coverageRequests.push(data);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'coverageRequests', item: data } }));
  }

  return data;
}

/**
 * Approve a coverage request and assign substitute tutor.
 * @param {string} coverageId
 * @param {string} chosenSubstituteId
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function approveCoverageRequest(coverageId, chosenSubstituteId, db = {}, storageService = null) {
  const reqs = Array.isArray(db.coverageRequests) ? db.coverageRequests : [];
  const cov = reqs.find(c => c && c.id === coverageId);
  if (!cov) return false;

  const tutors = Array.isArray(db.tutors) ? db.tutors : [];
  const subTutor = tutors.find(t => t && t.id === chosenSubstituteId);
  if (!subTutor) return false;

  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const sch = schedules.find(s => s && s.id === cov.scheduleId);
  if (sch) {
    sch.substituteTutorId = subTutor.id;
    sch.substituteTutorEmail = subTutor.email;
    sch.substituteTutorName = subTutor.name;
    sch.mentor = subTutor.name;
    sch.coverageApproved = true;
  }

  cov.status = 'approved';
  cov.assignedSubstituteId = subTutor.id;
  cov.assignedSubstituteName = subTutor.name;
  cov.resolvedAt = new Date().toISOString();

  if (!Array.isArray(db.notifications)) db.notifications = [];

  if (cov.tutorEmail) {
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Coverage Confirmed',
      message: `Coach ${subTutor.name} has been assigned to cover your session for ${cov.studentName || 'your student'}.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: cov.tutorEmail.toLowerCase().trim()
    });
  }

  if (subTutor.email) {
    db.notifications.push({
      id: `not-${Date.now()}-sub`,
      title: 'Class Coverage Assigned',
      message: `You have been confirmed to cover ${sch ? sch.course : 'a coding class'} for ${cov.studentName || 'a student'}.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: subTutor.email.toLowerCase().trim()
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'coverageRequests', item: cov } }));
  }

  return true;
}

/**
 * Check tutor availability against declared slots and existing schedules.
 * @param {object|string} tutorOrId
 * @param {string|null} dayOrDate
 * @param {string|null} timeString
 * @param {object} db
 * @returns {object}
 */
export function checkTutorAvailability(tutorOrId, dayOrDate = null, timeString = null, db = {}) {
  let tutor = null;
  const tutors = Array.isArray(db.tutors) ? db.tutors : [];

  if (typeof tutorOrId === 'object' && tutorOrId !== null) {
    tutor = tutorOrId;
  } else if (typeof tutorOrId === 'string') {
    const key = tutorOrId.toLowerCase().trim();
    tutor = tutors.find(t =>
      t && (
        (t.id && t.id.toLowerCase().trim() === key) ||
        (t.email && t.email.toLowerCase().trim() === key) ||
        (t.name && t.name.toLowerCase().trim() === key)
      )
    );
  }

  if (!tutor) {
    return { available: true, status: 'NOT_CONFIGURED', message: 'Tutor profile not found; open by default.' };
  }

  let targetDay = '';
  if (dayOrDate) {
    const dLower = String(dayOrDate).toLowerCase().trim();
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dLower)) {
      targetDay = dLower;
    } else {
      targetDay = getDayOfWeek(dayOrDate).toLowerCase();
    }
  }

  let targetSlot = 'evening';
  if (timeString) {
    const hour = parseInt(String(timeString).split(':')[0], 10);
    if (!isNaN(hour)) {
      if (hour >= 8 && hour < 12) targetSlot = 'morning';
      else if (hour >= 12 && hour < 16) targetSlot = 'afternoon';
      else if (hour >= 16 && hour < 20) targetSlot = 'evening';
      else if (hour >= 20 && hour < 23) targetSlot = 'night';
    }
  }

  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const avail = tutor.availability;

  if (avail && typeof avail === 'object') {
    const daySlots = avail[targetDay] || [];
    if (daySlots.includes(targetSlot)) {
      return {
        available: true,
        status: 'AVAILABLE',
        tutorName: tutor.name,
        day: capitalize(targetDay),
        slot: targetSlot,
        message: `Verified Available: ${tutor.name} is open for ${capitalize(targetDay)} ${targetSlot} sessions.`
      };
    } else if (daySlots.length > 0) {
      return {
        available: false,
        status: 'UNAVAILABLE_TIME',
        tutorName: tutor.name,
        day: capitalize(targetDay),
        slot: targetSlot,
        openSlots: daySlots,
        message: `Notice: ${tutor.name} is open on ${capitalize(targetDay)}, but for [${daySlots.join(', ')}] slots (not ${targetSlot}).`
      };
    } else {
      const openDays = Object.keys(avail).filter(d => Array.isArray(avail[d]) && avail[d].length > 0).map(capitalize);
      return {
        available: false,
        status: 'UNAVAILABLE_DAY',
        tutorName: tutor.name,
        day: capitalize(targetDay),
        slot: targetSlot,
        openDays: openDays,
        message: `Notice: ${tutor.name} has no open slots on ${capitalize(targetDay)}. Open days: ${openDays.join(', ') || 'None declared'}.`
      };
    }
  }

  return {
    available: true,
    status: 'NOT_CONFIGURED',
    tutorName: tutor.name,
    message: `${tutor.name} has not set custom availability limits.`
  };
}

export const SchedulingService = {
  getDayOfWeek,
  timeToMinutes,
  reconcileHeldSchedules,
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  getRescheduleRequests,
  submitReschedule,
  approveReschedule,
  declineReschedule,
  getCoverageRequests,
  submitCoverageRequest,
  approveCoverageRequest,
  checkTutorAvailability
};
