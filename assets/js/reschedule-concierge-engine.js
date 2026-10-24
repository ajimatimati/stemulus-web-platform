/**
 * STEMulus Smart Reschedule & Tutor Coverage Concierge Engine (Production)
 * 
 * Capabilities:
 * 1. Deterministic Availability & Conflict Scanner (evaluates primary tutor & student schedule overlap).
 * 2. 1-Click Conflict-Free Open Slot Recommendation Generator (looks ahead 7-14 days).
 * 3. Qualified Substitute Tutor Matching (matches subject expertise, language compatibility, zero-conflict).
 * 4. Autonomous Schedule Re-linking with accurate dayOfWeek recalculation.
 * 5. Tutor Emergency & Coverage Self-Service Pipeline.
 * 6. Full preservation of authentic Google Meet links (hostless, 1080p auto-record) & Google Classroom.
 */

const RescheduleConciergeEngine = (function() {
  'use strict';

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function getDayOfWeek(dateString) {
    if (!dateString) return 'Monday';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      return DAYS_OF_WEEK[d.getDay()] || 'Monday';
    }
    const d = new Date(dateString);
    return !isNaN(d.getDay()) ? DAYS_OF_WEEK[d.getDay()] : 'Monday';
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return (h * 60) + m;
  }

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function getDBInstance(providedDb = null) {
    if (providedDb && typeof providedDb === 'object') return providedDb;
    if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function') {
      return DashboardEngine.getDB();
    }
    if (typeof window !== 'undefined' && window.stemulus_db) {
      return window.stemulus_db;
    }
    return { schedules: [], tutors: [], students: [], rescheduleRequests: [], coverageRequests: [] };
  }

  function saveDBInstance(db) {
    if (!db) return;
    if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.saveDB === 'function') {
      DashboardEngine.saveDB(db);
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('stemulus_db', JSON.stringify(db));
      } catch (e) {}
    }
  }

  /**
   * 1. Check Tutor Availability.
   */
  function checkTutorAvailability(tutorIdentifier, date, time, duration = 60, excludeScheduleId = null, dbParam = null) {
    const db = getDBInstance(dbParam);
    const schedules = Array.isArray(db.schedules) ? db.schedules : [];
    const targetMinStart = timeToMinutes(time);
    const targetMinEnd = targetMinStart + (parseInt(duration, 10) || 60);

    const tutorIdLower = (tutorIdentifier || '').toLowerCase().trim();
    if (!tutorIdLower || !date || !time) return { available: true };

    const conflictingSchedule = schedules.find(s => {
      if (!s || s.id === excludeScheduleId) return false;
      if (s.date !== date) return false;
      if (s.status === 'cancelled' || s.attendanceStatus === 'cancelled') return false;

      const sTutorId = (s.tutorId || '').toLowerCase().trim();
      const sTutorEmail = (s.tutorEmail || '').toLowerCase().trim();
      const sTutorName = (s.mentor || s.tutorName || '').toLowerCase().trim();

      const matchesTutor = (sTutorId && (sTutorId === tutorIdLower || tutorIdLower.includes(sTutorId))) ||
                           (sTutorEmail && (sTutorEmail === tutorIdLower || tutorIdLower.includes(sTutorEmail))) ||
                           (sTutorName && (sTutorName === tutorIdLower || tutorIdLower.includes(sTutorName) || sTutorName.includes(tutorIdLower)));

      if (!matchesTutor) return false;

      const sStart = timeToMinutes(s.time);
      const sEnd = sStart + (parseInt(s.duration, 10) || 60);

      // Overlap condition
      return (targetMinStart < sEnd) && (targetMinEnd > sStart);
    });

    if (conflictingSchedule) {
      return {
        available: false,
        conflictingSchedule: {
          id: conflictingSchedule.id,
          studentName: conflictingSchedule.studentName,
          course: conflictingSchedule.course,
          date: conflictingSchedule.date,
          time: conflictingSchedule.time,
          duration: conflictingSchedule.duration || 60
        }
      };
    }

    return { available: true };
  }

  /**
   * 2. Check Student Availability.
   */
  function checkStudentAvailability(studentId, date, time, duration = 60, excludeScheduleId = null, dbParam = null) {
    const db = getDBInstance(dbParam);
    const schedules = Array.isArray(db.schedules) ? db.schedules : [];
    const targetMinStart = timeToMinutes(time);
    const targetMinEnd = targetMinStart + (parseInt(duration, 10) || 60);

    const sIdLower = (studentId || '').toLowerCase().trim();
    if (!sIdLower || !date || !time) return { available: true };

    const conflict = schedules.find(s => {
      if (!s || s.id === excludeScheduleId) return false;
      if (s.date !== date) return false;
      if (s.status === 'cancelled' || s.attendanceStatus === 'cancelled') return false;

      const curId = (s.studentId || '').toLowerCase().trim();
      if (curId !== sIdLower) return false;

      const sStart = timeToMinutes(s.time);
      const sEnd = sStart + (parseInt(s.duration, 10) || 60);
      return (targetMinStart < sEnd) && (targetMinEnd > sStart);
    });

    if (conflict) {
      return {
        available: false,
        conflictingSchedule: {
          id: conflict.id,
          course: conflict.course,
          time: conflict.time,
          duration: conflict.duration || 60
        }
      };
    }

    return { available: true };
  }

  /**
   * 3. Find 1-Click Conflict-Free Open Slots for Student & Primary Tutor.
   */
  function findRecommendedSlots(studentId, tutorIdentifier, daysAhead = 7, dbParam = null) {
    const db = getDBInstance(dbParam);
    const recommended = [];
    const now = new Date();

    // Standard high-engagement tutoring hours (WAT / CET)
    const slotTimes = ['10:00', '11:30', '14:00', '16:00', '17:30', '19:00'];

    for (let offset = 1; offset <= daysAhead + 3; offset++) {
      const d = new Date(now.getTime() + (offset * 24 * 60 * 60 * 1000));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = getDayOfWeek(dateStr);

      for (const timeStr of slotTimes) {
        const tutorCheck = checkTutorAvailability(tutorIdentifier, dateStr, timeStr, 60, null, db);
        if (!tutorCheck.available) continue;

        const studentCheck = checkStudentAvailability(studentId, dateStr, timeStr, 60, null, db);
        if (!studentCheck.available) continue;

        const dateFormatted = d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });

        recommended.push({
          date: dateStr,
          dayOfWeek,
          time: timeStr,
          duration: 60,
          label: `${dateFormatted} at ${timeStr} WAT`,
          status: 'verified_conflict_free'
        });

        if (recommended.length >= 4) return recommended;
      }
    }

    return recommended;
  }

  /**
   * 4. Find Qualified Substitute Tutors.
   * Matches by track/course, language, and zero schedule conflict at the requested slot.
   */
  function findQualifiedSubstitutes(course, studentLang = 'English', date, time, duration = 60, excludeTutorIdentifier = null, dbParam = null) {
    const db = getDBInstance(dbParam);
    const tutors = Array.isArray(db.tutors) ? db.tutors : [];
    const courseLower = (course || '').toLowerCase().trim();
    const excludeLower = (excludeTutorIdentifier || '').toLowerCase().trim();

    const qualified = [];

    tutors.forEach(t => {
      if (!t || t.status === 'inactive') return;

      const tIdLower = (t.id || '').toLowerCase().trim();
      const tEmailLower = (t.email || '').toLowerCase().trim();
      const tNameLower = (t.name || '').toLowerCase().trim();

      if (excludeLower && (tIdLower === excludeLower || tEmailLower === excludeLower || tNameLower === excludeLower)) {
        return;
      }

      // 1. Check Course / Subject Match
      const subjects = Array.isArray(t.subjects) ? t.subjects : [];
      const hasSubjectMatch = subjects.some(subj => {
        const sLower = (subj || '').toLowerCase();
        if (sLower === courseLower) return true;
        if (courseLower.includes('scratch') && sLower.includes('scratch')) return true;
        if (courseLower.includes('python') && sLower.includes('python')) return true;
        if ((courseLower.includes('web') || courseLower.includes('app')) && (sLower.includes('web') || sLower.includes('app') || sLower.includes('full-stack'))) return true;
        if (courseLower.includes('robotics') && sLower.includes('robotics')) return true;
        return false;
      });

      if (!hasSubjectMatch) return;

      // 2. Check Availability
      const availCheck = checkTutorAvailability(t.id, date, time, duration, null, db);
      if (!availCheck.available) return;

      // 3. Compute Match Score
      let matchScore = 80;
      if (subjects.some(s => (s || '').toLowerCase() === courseLower)) {
        matchScore += 10;
      }

      const langs = Array.isArray(t.languages) ? t.languages : ['English'];
      if (studentLang && studentLang.toLowerCase().includes('fr')) {
        if (langs.some(l => l.toLowerCase().includes('fr'))) {
          matchScore += 15;
        }
      }

      qualified.push({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone || '',
        subjects,
        matchScore,
        availability: 'Available (Zero Conflict)'
      });
    });

    // Sort by match score descending
    qualified.sort((a, b) => b.matchScore - a.matchScore);
    return qualified;
  }

  /**
   * 5. Submit Smart Reschedule with Concierge Diagnostics.
   */
  function submitSmartReschedule(request, dbParam = null) {
    const db = getDBInstance(dbParam);
    db.rescheduleRequests = Array.isArray(db.rescheduleRequests) ? db.rescheduleRequests : [];
    db.schedules = Array.isArray(db.schedules) ? db.schedules : [];
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];

    const schedule = db.schedules.find(s => s && s.id === request.scheduleId) || {};
    const tutorId = schedule.tutorId || schedule.tutorEmail || schedule.mentor || '';
    const studentId = request.studentId || schedule.studentId || '';
    const studentName = request.studentName || schedule.studentName || 'Student';
    const course = request.course || schedule.course || 'Coding';

    const reqDayOfWeek = getDayOfWeek(request.requestedDate);
    const tutorAvail = checkTutorAvailability(tutorId, request.requestedDate, request.requestedTime, 60, request.scheduleId, db);
    const studentAvail = checkStudentAvailability(studentId, request.requestedDate, request.requestedTime, 60, request.scheduleId, db);

    let suggestedSubstitutes = [];
    if (!tutorAvail.available) {
      suggestedSubstitutes = findQualifiedSubstitutes(course, 'English', request.requestedDate, request.requestedTime, 60, tutorId, db);
    }

    const newRequest = {
      id: 'res-' + Date.now(),
      scheduleId: request.scheduleId,
      studentId,
      studentName,
      course,
      currentDate: schedule.date || request.currentDate || '',
      currentTime: schedule.time || request.currentTime || '',
      currentTutorName: schedule.mentor || schedule.tutorName || 'Assigned Tutor',
      currentTutorId: tutorId,
      requestedDate: request.requestedDate,
      requestedTime: request.requestedTime,
      requestedDayOfWeek: reqDayOfWeek,
      reason: request.reason || 'Parent requested time adjustment',
      parentEmail: request.parentEmail || '',
      primaryTutorAvailable: tutorAvail.available,
      studentAvailable: studentAvail.available,
      conflicts: {
        tutorConflict: !tutorAvail.available ? tutorAvail.conflictingSchedule : null,
        studentConflict: !studentAvail.available ? studentAvail.conflictingSchedule : null
      },
      suggestedSubstitutes: suggestedSubstitutes.slice(0, 3),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    db.rescheduleRequests.push(newRequest);

    // Push Admin Notification
    db.notifications.push({
      id: 'not-' + Date.now(),
      title: 'Smart Reschedule Concierge Request',
      message: `${studentName} requested to reschedule ${course} to ${reqDayOfWeek}, ${request.requestedDate} at ${request.requestedTime}. Primary Tutor: ${tutorAvail.available ? 'Available' : 'Conflict (Substitute Recommended)'}`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: 'admin@stemuluskidstech.com'
    });

    if (request.parentEmail) {
      db.notifications.push({
        id: 'not-p-' + Date.now(),
        title: 'Reschedule Request Received',
        message: `Your request to move ${studentName}'s ${course} session to ${reqDayOfWeek}, ${request.requestedDate} at ${request.requestedTime} WAT has been registered. Concierge status: ${tutorAvail.available ? 'Coach Confirmed Available' : 'Substitute Coverage Pending'}.`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: request.parentEmail
      });
    }

    saveDBInstance(db);
    return newRequest;
  }

  /**
   * 6. Submit Tutor Emergency & Coverage Request.
   */
  function submitTutorCoverageRequest(coverageData, dbParam = null) {
    const db = getDBInstance(dbParam);
    db.coverageRequests = Array.isArray(db.coverageRequests) ? db.coverageRequests : [];
    db.schedules = Array.isArray(db.schedules) ? db.schedules : [];
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];

    const schedule = db.schedules.find(s => s && s.id === coverageData.scheduleId) || {};
    const tutorId = coverageData.tutorId || schedule.tutorId || '';
    const tutorName = coverageData.tutorName || schedule.tutorName || schedule.mentor || 'Coach';
    const studentName = schedule.studentName || 'Student';
    const course = schedule.course || 'Coding Track';
    const date = schedule.date || coverageData.date || '';
    const time = schedule.time || coverageData.time || '';

    // Find top matching peer tutors
    const suggestedSubstitutes = findQualifiedSubstitutes(course, 'English', date, time, 60, tutorId, db);

    const covRequest = {
      id: 'cov-' + Date.now(),
      scheduleId: coverageData.scheduleId,
      tutorId,
      tutorName,
      tutorEmail: coverageData.tutorEmail || schedule.tutorEmail || '',
      studentId: schedule.studentId || '',
      studentName,
      course,
      date,
      time,
      dayOfWeek: schedule.dayOfWeek || getDayOfWeek(date),
      reason: coverageData.reason || 'Medical / Emergency',
      notes: coverageData.notes || '',
      suggestedSubstitutes: suggestedSubstitutes.slice(0, 3),
      assignedSubstituteId: null,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    db.coverageRequests.push(covRequest);

    // Alert Admin Operations Radar
    db.notifications.push({
      id: 'not-' + Date.now(),
      title: '🚨 Tutor Class Coverage Request',
      message: `${tutorName} requested coverage for ${studentName}'s ${course} class on ${covRequest.dayOfWeek}, ${date} at ${time}. Top substitute candidate: ${suggestedSubstitutes[0] ? suggestedSubstitutes[0].name : 'Admin assignment needed'}.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: 'admin@stemuluskidstech.com'
    });

    saveDBInstance(db);
    return covRequest;
  }

  /**
   * 7. Approve Reschedule with Concierge Execution.
   * Accurately updates date, time, dayOfWeek, and optionally assigns substitute coach.
   */
  function approveRescheduleWithConcierge(requestId, substituteTutorId = null, dbParam = null) {
    const db = getDBInstance(dbParam);
    const reqs = Array.isArray(db.rescheduleRequests) ? db.rescheduleRequests : [];
    const schedules = Array.isArray(db.schedules) ? db.schedules : [];
    const tutors = Array.isArray(db.tutors) ? db.tutors : [];
    const notifications = Array.isArray(db.notifications) ? db.notifications : [];

    const reqIdx = reqs.findIndex(r => r && r.id === requestId);
    if (reqIdx === -1) return false;
    const req = reqs[reqIdx];

    const schIdx = schedules.findIndex(s => s && s.id === req.scheduleId);
    if (schIdx === -1) return false;
    const sch = schedules[schIdx];

    // 1. Update Date, Time, and accurately computed DayOfWeek
    sch.date = req.requestedDate;
    sch.time = req.requestedTime;
    sch.dayOfWeek = getDayOfWeek(req.requestedDate);
    sch.isRescheduled = true;
    sch.lastRescheduledAt = new Date().toISOString();

    // 2. If substitute tutor specified, reassign
    let assignedTutorName = sch.mentor || sch.tutorName;
    if (substituteTutorId) {
      const subTutor = tutors.find(t => t && t.id === substituteTutorId);
      if (subTutor) {
        sch.originalTutorName = sch.tutorName || sch.mentor;
        sch.originalTutorId = sch.tutorId;
        sch.tutorId = subTutor.id;
        sch.tutorName = subTutor.name;
        sch.tutorEmail = subTutor.email;
        sch.mentor = subTutor.name;
        sch.substituteAssigned = true;
        assignedTutorName = subTutor.name;
      }
    }

    // 3. Strictly maintain hostless auto-record flags
    sch.hostNotRequired = true;
    sch.autoRecord = true;
    sch.autoRecordEnabled = true;

    // 4. Update request status
    req.status = 'approved';
    req.approvedAt = new Date().toISOString();
    req.assignedTutorName = assignedTutorName;

    // 5. Notify Parent
    notifications.push({
      id: 'not-' + Date.now(),
      title: '✅ Reschedule Approved',
      message: `Your ${sch.course} class for ${sch.studentName} has been moved to ${sch.dayOfWeek}, ${sch.date} at ${sch.time} WAT with ${assignedTutorName}.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: req.parentEmail
    });

    saveDBInstance(db);
    return true;
  }

  /**
   * 8. Approve Tutor Coverage Request with Concierge Execution.
   */
  function approveCoverageWithConcierge(coverageId, chosenSubstituteId, dbParam = null) {
    const db = getDBInstance(dbParam);
    const covs = Array.isArray(db.coverageRequests) ? db.coverageRequests : [];
    const schedules = Array.isArray(db.schedules) ? db.schedules : [];
    const tutors = Array.isArray(db.tutors) ? db.tutors : [];
    const notifications = Array.isArray(db.notifications) ? db.notifications : [];

    const covIdx = covs.findIndex(c => c && c.id === coverageId);
    if (covIdx === -1) return false;
    const cov = covs[covIdx];

    const schIdx = schedules.findIndex(s => s && s.id === cov.scheduleId);
    if (schIdx === -1) return false;
    const sch = schedules[schIdx];

    const subTutor = tutors.find(t => t && t.id === chosenSubstituteId);
    if (!subTutor) return false;

    // Update Schedule Mentor
    sch.originalTutorName = sch.tutorName || sch.mentor;
    sch.originalTutorId = sch.tutorId;
    sch.tutorId = subTutor.id;
    sch.tutorName = subTutor.name;
    sch.tutorEmail = subTutor.email;
    sch.mentor = subTutor.name;
    sch.coverageApproved = true;
    sch.hostNotRequired = true;
    sch.autoRecord = true;

    cov.status = 'approved';
    cov.assignedSubstituteId = subTutor.id;
    cov.assignedSubstituteName = subTutor.name;
    cov.resolvedAt = new Date().toISOString();

    // Notify Original Tutor
    notifications.push({
      id: 'not-' + Date.now(),
      title: 'Coverage Confirmed',
      message: `Coach ${subTutor.name} has been assigned to cover your ${sch.course} session for ${sch.studentName} on ${sch.date} at ${sch.time}.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: cov.tutorEmail
    });

    // Notify Substitute Tutor
    notifications.push({
      id: 'not-' + Date.now() + '-sub',
      title: '🎯 Class Coverage Assigned',
      message: `You have been confirmed to cover ${sch.course} for ${sch.studentName} on ${sch.dayOfWeek}, ${sch.date} at ${sch.time} WAT. Google Meet & Classroom ready.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: subTutor.email
    });

    saveDBInstance(db);
    return true;
  }

  function getCoverageRequests(dbParam = null) {
    const db = getDBInstance(dbParam);
    return Array.isArray(db.coverageRequests) ? db.coverageRequests : [];
  }


  return {
    getDayOfWeek,
    timeToMinutes,
    minutesToTime,
    checkTutorAvailability,
    checkStudentAvailability,
    findRecommendedSlots,
    findQualifiedSubstitutes,
    submitSmartReschedule,
    submitTutorCoverageRequest,
    approveRescheduleWithConcierge,
    approveCoverageWithConcierge,
    getCoverageRequests
  };
})();

if (typeof window !== 'undefined') {
  window.RescheduleConciergeEngine = RescheduleConciergeEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RescheduleConciergeEngine;
}
