/**
 * STEMulus Session Monitoring & Attendance Verification Engine
 * 
 * 1. Continuous Meeting Session Monitoring:
 *    - Monitors and logs all meeting sessions, their start/end timestamps, individual participant durations,
 *      and concurrent overlap minutes between tutor and coder at all points in time.
 * 2. Scheduled Class Enforcement:
 *    - Strictly prevents tutors from submitting attendance outside of scheduled classes.
 *    - Blocks advance/future submissions before a session has taken place.
 * 3. False Submission & Ghost Class Detection:
 *    - Detects false attendance claims for classes that did not hold (0 minutes elapsed in meeting room).
 *    - Detects claims where the student was absent but claimed present.
 *    - Detects gross duration discrepancies (< 15 mins held vs 60 mins claimed).
 * 4. Real-time Escalation & ntfy Push Alerts:
 *    - Dispatches instant priority alerts to https://ntfy.sh/stemulus-admin-alerts.
 *    - Freezes false submissions as 'flagged_for_review' to safeguard academy payroll.
 *    - Records formal incidents in db.incidents and data/untoward_incidents.json.
 */

(function(root, factory) {
  var instance = factory();
  if (typeof root !== 'undefined') {
    root.SessionMonitoringEngine = instance;
  }
  if (typeof window !== 'undefined') {
    window.SessionMonitoringEngine = instance;
  }
  if (typeof global !== 'undefined') {
    global.SessionMonitoringEngine = instance;
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this), function() {
  'use strict';

  const STORAGE_KEY_SESSIONS = 'stemulus_meeting_sessions';
  const STORAGE_KEY_PRESENCE = 'stemulus_live_presence';
  const STORAGE_KEY_INCIDENTS = 'stemulus_untoward_incidents';
  const NTFY_TOPIC = (typeof window !== 'undefined' && window.STEMULUS_CONFIG && window.STEMULUS_CONFIG.NTFY_TOPIC) 
    ? window.STEMULUS_CONFIG.NTFY_TOPIC 
    : 'stemulus-admin-alerts';

  // In-memory cache
  let sessionStore = null;

  function getStore() {
    if (sessionStore) return sessionStore;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
        sessionStore = raw ? JSON.parse(raw) : {};
      } else {
        sessionStore = {};
      }
    } catch(e) {
      sessionStore = {};
    }
    return sessionStore;
  }

  function saveStore(store) {
    sessionStore = store;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(store));
      }
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) {
        const db = DashboardEngine.getDB();
        db.meetingSessions = store;
        if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
      }
    } catch(e) {
      console.warn('[SessionMonitoringEngine] Persistence warning:', e.message);
    }
  }

  /**
   * Continuous Heartbeat Tracker:
   * Called every 15s by join-class.html companion tab to monitor active sessions,
   * participant presence, and concurrent overlap duration.
   */
  function recordMeetingHeartbeat(params = {}) {
    const {
      sessionId,
      scheduleId,
      studentId,
      studentName,
      tutorEmail,
      tutorName,
      role = 'student',
      courseName = 'Coding Track'
    } = params;

    const key = scheduleId || sessionId || `${studentId || 'std'}_${new Date().toISOString().slice(0, 10)}`;
    const store = getStore();
    const now = Date.now();
    const nowIso = new Date().toISOString();

    let session = store[key] || {
      sessionId: sessionId || ('ses-' + now),
      scheduleId: scheduleId || key,
      studentId: studentId || '',
      studentName: studentName || 'Student',
      tutorEmail: tutorEmail || '',
      tutorName: tutorName || 'Tutor',
      courseName: courseName,
      scheduledDate: new Date().toISOString().slice(0, 10),
      firstActivityAt: nowIso,
      lastActivityAt: nowIso,
      actualStartTime: nowIso,
      actualEndTime: null,
      tutorJoinedAt: null,
      tutorLastSeenAt: null,
      tutorDurationSec: 0,
      studentJoinedAt: null,
      studentLastSeenAt: null,
      studentDurationSec: 0,
      overlapDurationSec: 0,
      sessionState: 'INITIALIZING',
      connectionQuality: 'STABLE',
      dropoutsCount: 0,
      heartbeatCount: 0
    };

    session.heartbeatCount = (session.heartbeatCount || 0) + 1;
    session.lastActivityAt = nowIso;

    if (role === 'tutor') {
      if (!session.tutorJoinedAt) session.tutorJoinedAt = nowIso;
      session.tutorLastSeenAt = nowIso;
      session.tutorDurationSec = (session.tutorDurationSec || 0) + 15;
    } else {
      if (!session.studentJoinedAt) session.studentJoinedAt = nowIso;
      session.studentLastSeenAt = nowIso;
      session.studentDurationSec = (session.studentDurationSec || 0) + 15;
    }

    // Check if both tutor and student were active within the last 45 seconds (concurrent overlap)
    const tutorActive = session.tutorLastSeenAt && (now - new Date(session.tutorLastSeenAt).getTime()) < 45000;
    const studentActive = session.studentLastSeenAt && (now - new Date(session.studentLastSeenAt).getTime()) < 45000;

    if (tutorActive && studentActive) {
      session.overlapDurationSec = (session.overlapDurationSec || 0) + 15;
      session.sessionState = 'IN_SESSION';
    } else if (tutorActive && !studentActive) {
      session.sessionState = 'TUTOR_WAITING';
    } else if (!tutorActive && studentActive) {
      session.sessionState = 'STUDENT_WAITING';
    }

    session.actualDurationMins = Math.round((session.overlapDurationSec || Math.min(session.tutorDurationSec || 0, session.studentDurationSec || 0)) / 60);

    store[key] = session;
    saveStore(store);
    return session;
  }

  /**
   * Concludes a monitored session and calculates final verified duration.
   */
  function concludeMeetingSession(paramsOrKey = {}, options = {}) {
    let key;
    let endedBy = 'System';
    if (typeof paramsOrKey === 'string') {
      key = paramsOrKey;
      endedBy = options.endedBy || options.reason || 'System';
    } else {
      key = paramsOrKey.scheduleId || paramsOrKey.sessionId;
      endedBy = paramsOrKey.endedBy || 'System';
    }
    if (!key) return null;

    const store = getStore();
    const session = store[key];
    if (!session) return null;

    const nowIso = new Date().toISOString();
    session.actualEndTime = nowIso;
    session.endedBy = endedBy;

    const overlapMins = Math.round((session.overlapDurationSec || 0) / 60);
    const tutorMins = Math.round((session.tutorDurationSec || 0) / 60);
    const studentMins = Math.round((session.studentDurationSec || 0) / 60);

    session.finalOverlapMins = overlapMins;
    session.finalTutorMins = tutorMins;
    session.finalStudentMins = studentMins;

    if (overlapMins >= 15) {
      session.sessionState = 'COMPLETED';
      session.verifiedHeld = true;
    } else if (tutorMins >= 10 && studentMins === 0) {
      session.sessionState = 'STUDENT_NO_SHOW';
      session.verifiedHeld = false;
    } else if (studentMins >= 10 && tutorMins === 0) {
      session.sessionState = 'TUTOR_NO_SHOW';
      session.verifiedHeld = false;
    } else if (overlapMins > 0 && overlapMins < 15) {
      session.sessionState = 'ABANDONED_SHORT_SESSION';
      session.verifiedHeld = false;
    } else {
      session.sessionState = 'DID_NOT_HOLD';
      session.verifiedHeld = false;
    }

    store[key] = session;
    saveStore(store);
    console.log(`[SessionMonitoringEngine] Meeting concluded for ${key}: State=${session.sessionState}, Overlap=${overlapMins}m`);
    return session;
  }

  /**
   * Retrieves monitored session telemetry for an assigned schedule.
   */
  function getSessionTelemetry(scheduleId, date = null, studentId = null) {
    const store = getStore();

    // 1. Direct match by scheduleId
    if (scheduleId && store[scheduleId]) {
      const s = store[scheduleId];
      return formatMetrics(s);
    }

    // 2. Search by matching studentId + date
    if (studentId && date) {
      const entries = Object.values(store);
      const match = entries.find(e => 
        e.studentId === studentId && 
        (e.scheduledDate === date || (e.actualStartTime && e.actualStartTime.startsWith(date)))
      );
      if (match) return formatMetrics(match);
    }

    // 3. Check live presence store from ClassEscalationEngine
    try {
      if (typeof localStorage !== 'undefined') {
        const presRaw = localStorage.getItem(STORAGE_KEY_PRESENCE);
        if (presRaw) {
          const presStore = JSON.parse(presRaw);
          const pres = (scheduleId && presStore[scheduleId]) || null;
          if (pres && pres.tutorJoinedAt && pres.studentJoinedAt) {
            const startMs = Math.min(new Date(pres.tutorJoinedAt).getTime(), new Date(pres.studentJoinedAt).getTime());
            const endMs = pres.lastHeartbeat || Date.now();
            const mins = Math.max(1, Math.round((endMs - startMs) / 60000));
            return {
              held: mins >= 15,
              monitoredDurationMins: mins,
              tutorPresent: true,
              studentPresent: true,
              overlapMins: mins,
              status: mins >= 15 ? 'VERIFIED_HELD' : 'INSUFFICIENT_DURATION',
              source: 'live_presence'
            };
          }
        }
      }
    } catch(e) {}

    // 4. Check auto-logged attendance in storage
    try {
      if (typeof localStorage !== 'undefined') {
        const attRaw = localStorage.getItem('stemulus_attendance_records');
        if (attRaw) {
          const atts = JSON.parse(attRaw);
          const match = atts.find(a => 
            (scheduleId && a.scheduleId === scheduleId) ||
            (studentId && a.studentId === studentId && a.classDate === date)
          );
          if (match && match.verifiedTelemetry) {
            return {
              held: true,
              monitoredDurationMins: match.duration || 60,
              tutorPresent: true,
              studentPresent: match.attendanceStatus === 'present',
              overlapMins: match.duration || 60,
              status: 'VERIFIED_HELD',
              source: 'auto_attendance'
            };
          }
        }
      }
    } catch(e) {}

    // 5. Check prefilled telemetry
    try {
      if (typeof localStorage !== 'undefined') {
        const prefillRaw = localStorage.getItem('stemulus_prefilled_tutor_log');
        if (prefillRaw) {
          const prefill = JSON.parse(prefillRaw);
          if ((scheduleId && prefill.scheduleId === scheduleId) || (studentId && prefill.studentId === studentId)) {
            return {
              held: true,
              monitoredDurationMins: prefill.duration || 60,
              tutorPresent: true,
              studentPresent: true,
              overlapMins: prefill.duration || 60,
              status: 'VERIFIED_HELD',
              source: 'telemetry_prefill'
            };
          }
        }
      }
    } catch(e) {}

    // 6. Check historical schedules in database
    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) {
      const scheds = DashboardEngine.getSchedules();
      const sched = scheds.find(s => 
        s.id === scheduleId || 
        (studentId && s.studentId === studentId && s.date === date)
      );
      if (sched && (sched.attendanceStatus === 'done' || sched.attendanceStatus === 'present' || sched.status === 'done' || sched.status === 'completed')) {
        return {
          held: true,
          monitoredDurationMins: parseInt(sched.duration, 10) || 60,
          tutorPresent: true,
          studentPresent: true,
          overlapMins: parseInt(sched.duration, 10) || 60,
          status: 'VERIFIED_HELD',
          source: 'historical_schedule'
        };
      }
    }

    // Default: Session did not hold or has zero monitored activity
    return {
      held: false,
      monitoredDurationMins: 0,
      tutorPresent: false,
      studentPresent: false,
      overlapMins: 0,
      status: 'DID_NOT_HOLD',
      source: 'none'
    };
  }

  function formatMetrics(session) {
    const overlapMins = session.finalOverlapMins || Math.round((session.overlapDurationSec || 0) / 60);
    const tutorPresent = !!session.tutorJoinedAt || ((session.tutorDurationSec || 0) > 0);
    const studentPresent = !!session.studentJoinedAt || ((session.studentDurationSec || 0) > 0);
    const monitoredDurationMins = overlapMins || session.finalTutorMins || Math.round((session.tutorDurationSec || 0) / 60);
    const held = overlapMins >= 15 || session.verifiedHeld === true;

    return {
      held,
      monitoredDurationMins,
      tutorPresent,
      studentPresent,
      overlapMins,
      status: session.sessionState || (held ? 'VERIFIED_HELD' : 'DID_NOT_HOLD'),
      source: 'monitored_store'
    };
  }

  /**
   * SCHEDULE & WINDOW VALIDATOR:
   * Enforces that tutors can ONLY submit attendance for real, scheduled classes,
   * never in advance (future dates/times), and within the active window.
   */
  function validateAttendanceEligibility(record = {}) {
    const studentId = record.studentId || record.student_id;
    const studentName = record.studentName || record.student_name || 'Student';
    const classDate = record.classDate || record.class_date;
    const classTime = record.classTime || record.class_time || '00:00';
    const tutorEmail = (record.tutorEmail || '').toLowerCase();
    const tutorName = (record.tutorName || '').toLowerCase();
    const isStandIn = record.isStandIn === true;

    if (!studentId || !classDate) {
      return {
        allowed: false,
        eligible: false,
        errorType: 'INVALID_INPUT',
        reason: 'INVALID_INPUT',
        title: 'Missing Required Fields',
        message: 'Student and class date are mandatory.'
      };
    }

    // 1. ADVANCE SUBMISSION PROHIBITION
    const scheduledDateTime = new Date(`${classDate}T${classTime}`);
    const now = new Date();
    if (scheduledDateTime > now) {
      return {
        allowed: false,
        eligible: false,
        errorType: 'FUTURE_CLASS',
        reason: 'FUTURE_CLASS',
        title: 'Advance Attendance Blocked',
        message: `You cannot submit attendance before a class has occurred. This class is scheduled for ${scheduledDateTime.toLocaleString()}. Please submit after concluding the session.`
      };
    }

    // 2. SCHEDULE MATCHING REQUIREMENT
    // Tutors cannot submit attendance for arbitrary dates/times without a matching scheduled class
    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) {
      const allSchedules = DashboardEngine.getSchedules() || [];
      const matchingSchedule = allSchedules.find(s => {
        const matchesStudent = s.studentId === studentId || 
          (s.studentName && s.studentName.toLowerCase().includes(studentName.toLowerCase()));
        const matchesDate = s.date === classDate;
        
        let matchesTutor = true;
        if (!isStandIn && tutorEmail) {
          const sTutorEmail = (s.tutorEmail || '').toLowerCase();
          const sTutorName = (s.mentor || s.tutorName || '').toLowerCase();
          matchesTutor = sTutorEmail === tutorEmail || sTutorName.includes(tutorName) || tutorName.includes(sTutorName);
        }

        return matchesStudent && matchesDate && matchesTutor;
      });

      if (!matchingSchedule) {
        // Check if there is an approved reschedule record
        let isApprovedReschedule = false;
        try {
          const reschedules = (DashboardEngine.getDB && DashboardEngine.getDB().rescheduleRequests) || [];
          isApprovedReschedule = reschedules.some(r => 
            r.studentId === studentId && 
            (r.requestedDate === classDate || r.originalDate === classDate) && 
            r.status === 'approved'
          );
        } catch(e) {}

        if (!isApprovedReschedule) {
          return {
            allowed: false,
            eligible: false,
            errorType: 'NO_SCHEDULED_CLASS',
            reason: 'NO_SCHEDULED_CLASS',
            title: 'Unscheduled Class Submission Prohibited',
            message: `No scheduled class was found for ${studentName} on ${classDate} with your faculty profile. Tutors are strictly prohibited from submitting attendance outside of scheduled classes. Please contact the Academic Operations Director to schedule or reschedule this session.`
          };
        }
      }
    }

    return {
      allowed: true,
      eligible: true,
      errorType: null,
      reason: null,
      message: 'Class schedule and submission window verified.'
    };
  }

  /**
   * FALSE SUBMISSION & GHOST CLASS DETECTOR:
   * Cross-references claimed attendance with monitored meeting sessions and durations.
   */
  function detectFalseSubmission(record = {}) {
    // If tutor marked absent, they are legitimately reporting student absence
    if (record.attendanceStatus === 'absent' || record.attendance_status === 'absent') {
      return { isFalse: false, verified: true, reason: 'Reported Absent' };
    }

    const scheduleId = record.scheduleId || '';
    const classDate = record.classDate || record.class_date;
    const studentId = record.studentId || record.student_id;
    const claimedDuration = parseInt(record.duration || record.duration_minutes || 60, 10);

    const telemetry = getSessionTelemetry(scheduleId, classDate, studentId);

    // Discrepancy 1: Ghost Class (Class did not hold / 0 mins elapsed)
    if (!telemetry.held && telemetry.monitoredDurationMins === 0) {
      return {
        isFalse: true,
        isFalseSubmission: true,
        type: 'GHOST_CLASS_DID_NOT_HOLD',
        severity: 'CRITICAL',
        title: '🚨 Attendance Verification Alert: Class Did Not Hold',
        message: `Automated meeting monitors recorded 0 minutes of meeting activity for ${record.studentName} on ${classDate}. Meeting records confirm this class did not take place.`,
        monitoredDuration: 0,
        claimedDuration
      };
    }

    // Discrepancy 2: Student Absent but Claimed Present
    if (telemetry.tutorPresent && !telemetry.studentPresent) {
      return {
        isFalse: true,
        isFalseSubmission: true,
        type: 'STUDENT_ABSENT_CLAIMED_PRESENT',
        severity: 'CRITICAL',
        title: '🚨 Discrepancy: Student Never Joined Meeting Room',
        message: `Meeting room records indicate Coach ${record.tutorName} opened the call, but student ${record.studentName} was not in attendance. Attendance cannot be logged as Present.`,
        monitoredDuration: telemetry.monitoredDurationMins,
        claimedDuration
      };
    }

    // Discrepancy 3: Gross Insufficient Duration (< 15 mins for 60m class)
    if (telemetry.monitoredDurationMins > 0 && telemetry.monitoredDurationMins < 15 && claimedDuration >= 45) {
      return {
        isFalse: true,
        isFalseSubmission: true,
        type: 'INSUFFICIENT_DURATION',
        severity: 'HIGH',
        title: '⚠️ Discrepancy: Insufficient Meeting Duration',
        message: `Monitored classroom duration was only ${telemetry.monitoredDurationMins} minutes before disconnect, but a full ${claimedDuration}-minute lesson was submitted.`,
        monitoredDuration: telemetry.monitoredDurationMins,
        claimedDuration
      };
    }

    return {
      isFalse: false,
      isFalseSubmission: false,
      verified: true,
      monitoredDuration: telemetry.monitoredDurationMins,
      source: telemetry.source
    };
  }

  /**
   * REAL-TIME ESCALATION & NTFY PUSH NOTIFICATION:
   * Fires instant push alert to administrators and freezes record for investigation.
   */
  async function escalateFalseSubmission(record, detection) {
    const studentName = record.studentName || record.student_name || 'Student';
    const tutorName = record.tutorName || 'Tutor';
    const classDate = record.classDate || record.class_date || 'Today';
    const claimedMins = record.duration || 60;
    const monitoredMins = detection.monitoredDuration || 0;

    const incident = {
      id: 'inc-att-' + Date.now(),
      type: 'ATTENDANCE_FRAUD_ESCALATION',
      severity: detection.severity || 'CRITICAL',
      discrepancyType: detection.type,
      title: detection.title || 'Attendance Fraud Alert',
      message: `[FALSE SUBMISSION] Coach ${tutorName} submitted ${claimedMins}m attendance for ${studentName} on ${classDate}, but meeting monitoring records show ${monitoredMins}m (${detection.message}). Session frozen for review.`,
      tutorName,
      tutorEmail: record.tutorEmail || '',
      studentName,
      classDate,
      classTime: record.classTime || '',
      claimedDuration: claimedMins,
      monitoredDuration: monitoredMins,
      timestamp: new Date().toISOString(),
      status: 'PENDING_AUDIT'
    };

    // 1. Log incident into DB
    try {
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) {
        const db = DashboardEngine.getDB();
        db.incidents = db.incidents || [];
        db.incidents.unshift(incident);
        db.notifications = db.notifications || [];
        db.notifications.unshift({
          id: 'not-fraud-' + Date.now(),
          title: `🚨 ATTENDANCE ALERT: ${tutorName}`,
          message: incident.message,
          timestamp: incident.timestamp,
          read: false,
          userEmail: 'admin@stemuluskidstech.com'
        });
        if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
      }
      if (typeof localStorage !== 'undefined') {
        const incRaw = localStorage.getItem(STORAGE_KEY_INCIDENTS);
        const incList = incRaw ? JSON.parse(incRaw) : [];
        incList.unshift(incident);
        localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incList.slice(0, 50)));
      }
    } catch(e) {
      console.warn('[SessionMonitoringEngine] Incident logging warning:', e.message);
    }

    // 2. Dispatch real-time ntfy push notification to admin topic
    try {
      const endpoint = `https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`;
      const safeTitle = `ATTENDANCE FRAUD ALERT: ${tutorName.slice(0, 25)}`;
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Title': safeTitle.replace(/[^\x00-\x7F]/g, ''),
          'Priority': 'urgent',
          'Tags': 'warning,police_car,no_entry',
          'Click': 'https://stemuluskidstech.com/admin-dashboard.html?tab=attendance'
        },
        body: incident.message
      }).then(res => {
        console.log('[SessionMonitoringEngine] ntfy push alert dispatched:', res.status);
      }).catch(err => {
        console.warn('[SessionMonitoringEngine] ntfy push notice (non-blocking):', err.message);
      });
    } catch(e) {}

    // 3. Emit DOM event for active admin dashboards
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('stemulus_attendance_fraud_alert', { detail: incident }));
      } catch(evErr) {}
    }

    return incident;
  }

  // Seed verified meeting telemetry for core demo schedules on first boot
  function seedVerifiedDemoMeetings() {
    try {
      const store = getStore();
      const existingKeys = Object.keys(store);
      if (existingKeys.length === 0) {
        const seeds = [
          {
            scheduleId: 'sch-101-mon-sarah',
            studentId: 'std-1001-sarah',
            studentName: 'Sarah Adeyemi',
            tutorEmail: 'sarah.jane@stemuluskidstech.com',
            tutorName: 'Sarah Jane',
            courseName: 'Python Prodigies',
            scheduledDate: '2026-10-19',
            actualStartTime: '2026-10-19T16:00:00Z',
            actualEndTime: '2026-10-19T17:00:00Z',
            tutorJoinedAt: '2026-10-19T15:58:00Z',
            studentJoinedAt: '2026-10-19T16:01:00Z',
            overlapDurationSec: 3600,
            finalOverlapMins: 60,
            sessionState: 'COMPLETED',
            verifiedHeld: true
          },
          {
            scheduleId: 'sch-102-tue-junayd',
            studentId: 'std-1010-ilb5',
            studentName: 'Junayd Kari',
            tutorEmail: 'olalekan@stemuluskidstech.com',
            tutorName: 'Olalekan Israel Ajimati',
            courseName: 'Scratch Creators',
            scheduledDate: '2026-10-20',
            actualStartTime: '2026-10-20T17:00:00Z',
            actualEndTime: '2026-10-20T18:00:00Z',
            tutorJoinedAt: '2026-10-20T16:59:00Z',
            studentJoinedAt: '2026-10-20T17:00:00Z',
            overlapDurationSec: 3600,
            finalOverlapMins: 60,
            sessionState: 'COMPLETED',
            verifiedHeld: true
          },
          {
            scheduleId: 'sch-2001',
            studentId: 'std-101-daniel',
            studentName: 'Daniel M.',
            tutorEmail: 'tutor@stemuluskidstech.com',
            tutorName: 'Sarah Jane',
            courseName: 'Python Programming',
            scheduledDate: '2026-06-01',
            actualStartTime: '2026-06-01T16:00:00Z',
            actualEndTime: '2026-06-01T17:00:00Z',
            tutorJoinedAt: '2026-06-01T15:59:00Z',
            studentJoinedAt: '2026-06-01T16:00:00Z',
            overlapDurationSec: 3600,
            finalOverlapMins: 60,
            sessionState: 'COMPLETED',
            verifiedHeld: true
          }
        ];

        seeds.forEach(s => {
          store[s.scheduleId] = s;
        });
        saveStore(store);
      }
    } catch(e) {}
  }

  seedVerifiedDemoMeetings();

  return {
    recordMeetingHeartbeat,
    concludeMeetingSession,
    getSessionTelemetry,
    validateAttendanceEligibility,
    detectFalseSubmission,
    escalateFalseSubmission,
    getStore,
    saveStore,
    getMonitoredSession: (id) => getStore()[id],
    getAllMonitoredSessions: getStore
  };
});
