/**
 * STEMulus Kids Tech: Automated Dual Class Reminder Engine
 * Wires automated notifications and emails for Parents & Tutors:
 * 1. 24 Hours Before Class: Calendar Schedule Reminder & Setup Checklist
 * 2. 1 Hour Before Class: Prep Briefing, Student Check & Classroom Readiness
 * 3. 10 Minutes Before Class: Urgent Classroom Alert + Web Audio Chime + 1-Click Launch Modal
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StemulusClassReminders = factory();
  }
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';

  let checkInterval = null;
  let audioContext = null;

  // Synthesize Web Audio Chime (880Hz -> 1760Hz two-tone chime, zero external mp3 needed)
  function playReminderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();

      const now = audioContext.currentTime;

      // Note 1: A5 (880Hz)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A6 (1760Hz) - higher chime
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('[ClassReminders] Audio chime error:', e.message);
    }
  }

  // Get active schedules from DashboardEngine or localStorage
  function getSchedules() {
    if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSchedules === 'function') {
      return DashboardEngine.getSchedules() || [];
    }
    try {
      const raw = localStorage.getItem('stemulus_db');
      if (raw) {
        const db = JSON.parse(raw);
        return db.schedules || [];
      }
    } catch (e) {}
    return [];
  }

  // Update schedule flags (reminded24h, reminded1h, reminded10m) in database
  function markScheduleReminded(scheduleId, milestone) {
    const flagKey = 'reminded' + milestone;
    if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function') {
      const db = DashboardEngine.getDB();
      if (db.schedules) {
        const sched = db.schedules.find(s => String(s.id) === String(scheduleId));
        if (sched) {
          sched[flagKey] = true;
          sched[flagKey + '_at'] = new Date().toISOString();
          DashboardEngine.saveDB(db, { silent: true });
          return;
        }
      }
    }

    try {
      const raw = localStorage.getItem('stemulus_db');
      if (raw) {
        const db = JSON.parse(raw);
        if (db.schedules) {
          const sched = db.schedules.find(s => String(s.id) === String(scheduleId));
          if (sched) {
            sched[flagKey] = true;
            sched[flagKey + '_at'] = new Date().toISOString();
            localStorage.setItem('stemulus_db', JSON.stringify(db));
          }
        }
      }
    } catch (e) {}
  }

  // Resolve canonical Tutor & Parent participants for a schedule from the Student record
  function resolveScheduleParticipants(schedule) {
    if (!schedule) return { tutorEmail: '', tutorAltEmail: '', tutorName: '', parentEmail: '', parentName: '', studentName: '' };
    let tutorEmail = (schedule.tutorEmail || '').toLowerCase().trim();
    let tutorAltEmail = '';
    let tutorName = schedule.mentor || schedule.tutorName || 'Mentor';
    let parentEmail = (schedule.parentEmail || '').toLowerCase().trim();
    let parentName = schedule.parentName || 'Parent';
    let studentName = schedule.studentName || schedule.student || 'Student';
    let studentId = schedule.studentId || '';

    try {
      const db = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function')
        ? DashboardEngine.getDB()
        : JSON.parse(localStorage.getItem('stemulus_db') || '{}');
      const students = (db && Array.isArray(db.students)) ? db.students : [];
      const tutors = (db && Array.isArray(db.tutors)) ? db.tutors : [];

      const sNameClean = String(studentName).toLowerCase().trim();
      const matchedStudent = students.find(s => {
        if (!s) return false;
        if (studentId && s.id === studentId) return true;
        const full = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
        return full && full === sNameClean;
      });

      if (matchedStudent) {
        studentId = matchedStudent.id || studentId;
        studentName = ((matchedStudent.firstName || '') + ' ' + (matchedStudent.lastName || '')).trim() || studentName;
        if (matchedStudent.tutorEmail) tutorEmail = String(matchedStudent.tutorEmail).toLowerCase().trim();
        if (matchedStudent.tutorName) tutorName = matchedStudent.tutorName;
        if (matchedStudent.parentEmail) parentEmail = String(matchedStudent.parentEmail).toLowerCase().trim();
        if (matchedStudent.parentName) parentName = matchedStudent.parentName;
      }

      if (tutorEmail || tutorName) {
        const matchedTutor = tutors.find(t =>
          (t && t.email && t.email.toLowerCase().trim() === tutorEmail) ||
          (t && t.altEmail && t.altEmail.toLowerCase().trim() === tutorEmail) ||
          (t && t.name && t.name.toLowerCase().trim() === String(tutorName).toLowerCase().trim())
        );
        if (matchedTutor) {
          if (matchedTutor.email) tutorEmail = matchedTutor.email.toLowerCase().trim();
          if (matchedTutor.altEmail) tutorAltEmail = matchedTutor.altEmail.toLowerCase().trim();
          if (matchedTutor.name) tutorName = matchedTutor.name;
        }
      }
    } catch (e) {}

    return {
      studentId,
      studentName,
      tutorEmail,
      tutorAltEmail,
      tutorName,
      parentEmail,
      parentName
    };
  }

  // Resolve direct Google Meet / Zoom meeting link for a schedule
  function resolveMeetingLink(schedule, participants) {
    if (!schedule) return 'https://meet.google.com/stm-prog-live';
    if (schedule.link && schedule.link.trim() && schedule.link.startsWith('http')) return schedule.link.trim();
    if (schedule.meetLink && schedule.meetLink.trim() && schedule.meetLink.startsWith('http')) return schedule.meetLink.trim();
    if (schedule.googleMeetLink && schedule.googleMeetLink.trim() && schedule.googleMeetLink.startsWith('http')) return schedule.googleMeetLink.trim();
    if (schedule.zoomLink && schedule.zoomLink.trim() && schedule.zoomLink.startsWith('http')) return schedule.zoomLink.trim();

    // Look up student default link from database
    try {
      const db = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function')
        ? DashboardEngine.getDB()
        : JSON.parse(localStorage.getItem('stemulus_db') || '{}');
      const students = (db && Array.isArray(db.students)) ? db.students : [];
      const sId = schedule.studentId || (participants && participants.studentId);
      const student = students.find(s => s && ((sId && s.id === sId) || (s.firstName && schedule.studentName && schedule.studentName.includes(s.firstName))));
      if (student) {
        if (student.meetLink && student.meetLink.startsWith('http')) return student.meetLink.trim();
        if (student.googleMeetLink && student.googleMeetLink.startsWith('http')) return student.googleMeetLink.trim();
        if (student.classroomLink && student.classroomLink.startsWith('http')) return student.classroomLink.trim();
      }
    } catch(e) {}

    return 'https://meet.google.com/stm-prog-live';
  }

  // Build exact Portal Classroom Companion launch URL (direct Google Meet link)
  function buildPortalLaunchLink(schedule, role, participantsOverride, rawMeetOverride, forceAbsolute = false) {
    const participants = participantsOverride || resolveScheduleParticipants(schedule);
    const rawMeetUrl = rawMeetOverride || resolveMeetingLink(schedule, participants);
    return rawMeetUrl || 'https://meet.google.com';
  }

  // Build 1-click serverless email join URL (triggers ntfy + Firestore presence + 302 redirect to Google Meet without opening portal)
  function buildOneClickEmailJoinUrl(schedule, role, participantsOverride, rawMeetOverride) {
    const participants = participantsOverride || resolveScheduleParticipants(schedule);
    const rawMeetUrl = rawMeetOverride || resolveMeetingLink(schedule, participants);
    const qs = [
      'meet=' + encodeURIComponent(rawMeetUrl),
      'sid=' + encodeURIComponent((schedule && schedule.id) || ''),
      'role=' + encodeURIComponent(role || 'tutor'),
      'tutor=' + encodeURIComponent((participants && participants.tutorName) || (schedule && (schedule.mentor || schedule.tutorName)) || 'Mentor'),
      'student=' + encodeURIComponent((participants && participants.studentName) || (schedule && (schedule.studentName || schedule.student)) || 'Student'),
      'course=' + encodeURIComponent((schedule && schedule.course) || 'Coding Session'),
      'date=' + encodeURIComponent((schedule && schedule.date) || ''),
      'time=' + encodeURIComponent((schedule && schedule.time) || '')
    ].join('&');
    return 'https://stemuluskidstech.com/.netlify/functions/join-session?' + qs;
  }

  // Strictly check whether the currently logged-in user owns this schedule
  function isScheduleForCurrentUser(schedule) {
    if (!schedule || typeof DashboardEngine === 'undefined' || typeof DashboardEngine.getSession !== 'function') return false;
    const session = DashboardEngine.getSession();
    if (!session || !session.email || !session.role) return false;

    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    if (path.includes('login') || path.includes('admin-dashboard')) return false;

    const sessionEmail = String(session.email).toLowerCase().trim();
    const role = String(session.role).toLowerCase().trim();
    const participants = resolveScheduleParticipants(schedule);

    if (role === 'tutor') {
      if (!participants.tutorEmail) return false;
      if (sessionEmail === participants.tutorEmail) return true;
      if (participants.tutorAltEmail && sessionEmail === participants.tutorAltEmail) return true;
      // Also check if session user's tutor profile matches participants.tutorEmail
      if (typeof DashboardEngine.getTutorStudents === 'function') {
        const myStudents = DashboardEngine.getTutorStudents(sessionEmail) || [];
        return myStudents.some(s =>
          (participants.studentId && s.id === participants.studentId) ||
          (((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim() === participants.studentName.toLowerCase().trim())
        );
      }
      return false;
    }

    if (role === 'parent') {
      if (!participants.parentEmail) return false;
      return sessionEmail === participants.parentEmail;
    }

    return false;
  }

  // Dispatch Automated Strategic Email Reminders to both Parent and Tutor
  function dispatchReminderEmails(schedule, milestone) {
    const db = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function')
      ? DashboardEngine.getDB()
      : null;
    const settings = (db && db.settings) || {};
    if (settings.autoRemindersEnabled === false) {
      console.log('[ClassReminders] Automated email reminders paused in settings.');
      return;
    }
    if (typeof EmailService === 'undefined') {
      console.warn('[ClassReminders] EmailService unavailable.');
      return;
    }

    const participants = resolveScheduleParticipants(schedule);
    const meetingLink = resolveMeetingLink(schedule, participants);
    const portalTutorUrl = buildPortalLaunchLink(schedule, 'tutor', participants, meetingLink, true);
    const portalStudentUrl = buildPortalLaunchLink(schedule, 'student', participants, meetingLink, true);
    const oneClickTutorUrl = buildOneClickEmailJoinUrl(schedule, 'tutor', participants, meetingLink);
    const oneClickStudentUrl = buildOneClickEmailJoinUrl(schedule, 'student', participants, meetingLink);

    // Enriched schedule carrying canonical meeting link + 1-click serverless email join URLs
    const enrichedSchedule = Object.assign({}, schedule, {
      studentId: participants.studentId || schedule.studentId || '',
      tutorEmail: participants.tutorEmail || schedule.tutorEmail || '',
      rawMeetLink: meetingLink,
      portalTutorUrl: portalTutorUrl,
      portalStudentUrl: portalStudentUrl,
      oneClickTutorUrl: oneClickTutorUrl,
      oneClickStudentUrl: oneClickStudentUrl,
      link: meetingLink,
      meetLink: meetingLink,
      zoomLink: meetingLink
    });

    // 1. Send to Parent
    if (participants.parentEmail && typeof EmailService.sendReminderEmail === 'function') {
      EmailService.sendReminderEmail({
        student: {
          id: participants.studentId,
          name: participants.studentName,
          parentEmail: participants.parentEmail,
          parentName: participants.parentName || 'Parent'
        },
        schedule: enrichedSchedule,
        type: milestone
      }).then(function(res) {
        if (res && res.success) {
          console.log(`[ClassReminders] Sent ${milestone} reminder email to parent (${participants.parentEmail}) with portal link: ${portalStudentUrl}`);
        }
      }).catch(function(e) {
        console.warn('[ClassReminders] Parent email dispatch notice:', e.message);
      });
    }

    // 2. Send to Tutor
    if (participants.tutorEmail && typeof EmailService.sendTutorReminderEmail === 'function') {
      EmailService.sendTutorReminderEmail({
        tutor: {
          tutorEmail: participants.tutorEmail,
          name: participants.tutorName || 'Mentor'
        },
        student: {
          id: participants.studentId,
          name: participants.studentName,
          parentEmail: participants.parentEmail
        },
        schedule: enrichedSchedule,
        type: milestone
      }).then(function(res) {
        if (res && res.success) {
          console.log(`[ClassReminders] Sent ${milestone} reminder email to tutor (${participants.tutorEmail}) with portal link: ${portalTutorUrl}`);
        }
      }).catch(function(e) {
        console.warn('[ClassReminders] Tutor email dispatch notice:', e.message);
      });
    }
  }

  // Add in-portal Notifications for both Parent and Tutor (strictly scoped to canonical owner emails)
  function addPortalNotifications(schedule, milestone) {
    if (typeof DashboardEngine === 'undefined' || typeof DashboardEngine.addNotification !== 'function') return;

    const participants = resolveScheduleParticipants(schedule);
    const meetingLink = resolveMeetingLink(schedule, participants);
    const portalTutorLink = buildPortalLaunchLink(schedule, 'tutor', participants, meetingLink, false);
    const portalStudentLink = buildPortalLaunchLink(schedule, 'student', participants, meetingLink, false);
    const label = milestone === '24h' ? '24 Hours' : (milestone === '5m' ? '5 Minutes' : (milestone === '10m' ? '10 Minutes' : '1 Hour'));
    const isUrgent = milestone === '10m' || milestone === '5m';
    const titleStr = milestone === '5m'
      ? `Class in 5 Minutes: ${participants.studentName}`
      : (milestone === '10m' ? `Class in 10 Minutes: ${participants.studentName}` : `Class in ${label}: ${participants.studentName}`);

    const db = (typeof DashboardEngine.getDB === 'function') ? DashboardEngine.getDB() : null;
    const existingNotifs = (db && Array.isArray(db.notifications)) ? db.notifications : [];

    // 1. Notification for Tutor (only to canonical assigned tutorEmail)
    if (participants.tutorEmail) {
      const tutorMsg = `Your 1-on-1 session for ${schedule.course} is scheduled for ${schedule.date} at ${schedule.time} (WAT). Click to launch via Portal Companion (${meetingLink}).`;
      const alreadyExists = existingNotifs.some(n =>
        n && String(n.userEmail || '').toLowerCase().trim() === participants.tutorEmail &&
        n.title === titleStr && n.message === tutorMsg
      );
      if (!alreadyExists) {
        DashboardEngine.addNotification({
          userEmail: participants.tutorEmail,
          studentId: participants.studentId,
          studentName: participants.studentName,
          title: titleStr,
          message: tutorMsg,
          actionUrl: portalTutorLink,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    // 2. Notification for Parent (only to canonical assigned parentEmail)
    if (participants.parentEmail) {
      const parentMsg = `${participants.studentName}'s coding session with ${participants.tutorName || 'Mentor'} is at ${schedule.time} on ${schedule.date}. Click to launch classroom (${meetingLink}).`;
      const alreadyExists = existingNotifs.some(n =>
        n && String(n.userEmail || '').toLowerCase().trim() === participants.parentEmail &&
        n.title === titleStr && n.message === parentMsg
      );
      if (!alreadyExists) {
        DashboardEngine.addNotification({
          userEmail: participants.parentEmail,
          studentId: participants.studentId,
          studentName: participants.studentName,
          title: titleStr,
          message: parentMsg,
          actionUrl: portalStudentLink,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }
  }

  // Ensure keyframes and dismiss helper for refined floating alert animations
  function ensureAlertStyles() {
    if (typeof document === 'undefined') return;
    if (!window.dismissStemulusCard) {
      window.dismissStemulusCard = function(id, isTop = false) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        el.style.opacity = '0';
        el.style.transform = isTop ? 'translateY(-12px)' : 'translateY(16px)';
        setTimeout(() => { if (el) el.remove(); }, 250);
      };
    }
    if (!window.launchStemulusReminderSession) {
      window.launchStemulusReminderSession = function(scheduleId, meetingLink, studentName, tutorName, course) {
        try {
          const session = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSession === 'function')
            ? DashboardEngine.getSession()
            : null;
          const role = (session && session.role === 'parent') ? 'student' : 'tutor';
          if (typeof window.STEMulus !== 'undefined' && window.STEMulus.Classroom && typeof window.STEMulus.Classroom.launchMeetingSession === 'function') {
            window.STEMulus.Classroom.launchMeetingSession({
              scheduleId: scheduleId,
              role: role,
              studentName: studentName,
              tutorName: tutorName,
              course: course,
              meetingUrl: meetingLink
            });
            return false;
          }
          if (typeof window.ClassEscalationEngine !== 'undefined' && typeof window.ClassEscalationEngine.recordHeartbeat === 'function') {
            window.ClassEscalationEngine.recordHeartbeat(scheduleId, role, role === 'tutor' ? tutorName : studentName);
          }
        } catch (e) {}
        return true;
      };
    }
    if (document.getElementById('stemulus-alert-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'stemulus-alert-keyframes';
    style.textContent = `
      @keyframes stemulusAlertSlideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes stemulusAlertTopSlideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes stemulusDotPulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Show 24-Hour Preparation Toast Banner (3D Minimalist Playful Light Theme)
  function show24HourBanner(schedule) {
    if (typeof document === 'undefined') return;
    ensureAlertStyles();
    const bannerId = 'reminder-banner-24h-' + schedule.id;
    if (document.getElementById(bannerId)) return;

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const time = schedule.time || 'Upcoming';
    const date = schedule.date || 'Tomorrow';
    const meetingLink = buildPortalLaunchLink(schedule);
    const safeSid = String(schedule.id || '').replace(/'/g, "\\'");
    const safeLink = String(meetingLink || '').replace(/'/g, "\\'");
    const safeStudent = String(studentName || '').replace(/'/g, "\\'");
    const safeTutor = String(tutorName || '').replace(/'/g, "\\'");
    const safeCourse = String(course || '').replace(/'/g, "\\'");

    const div = document.createElement('div');
    div.id = bannerId;
    div.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      max-width: 420px;
      width: calc(100vw - 48px);
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-bottom: 4px solid #CBD5E1;
      border-radius: 22px;
      padding: 18px 20px;
      color: #0F172A;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: stemulusAlertTopSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    div.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <div style="width:42px; height:42px; border-radius:14px; background:#FFF7ED; border:2px solid #FED7AA; border-bottom:3px solid #FDBA74; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#EA580C;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#EA580C; background:#FFF7ED; border:1px solid #FED7AA; padding:2px 8px; border-radius:8px;">
              Class Tomorrow
            </span>
            <button onclick="window.dismissStemulusCard('${bannerId}', true)" aria-label="Close notification" style="background:none; border:none; color:#94A3B8; font-size:18px; line-height:1; cursor:pointer; padding:2px 6px; border-radius:4px; transition:color 0.15s;">&times;</button>
          </div>
          <h4 style="margin:0 0 3px 0; font-size:15px; font-weight:800; color:#0F172A; line-height:1.35; word-break:break-word; font-family:'Outfit', sans-serif;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 12px 0; font-size:12px; color:#64748B; line-height:1.45;">
            Scheduled for <strong>${date} at ${time}</strong> with <strong>${tutorName}</strong>.
          </p>
          <div style="display:flex; gap:8px; align-items:center;">
            <a href="${meetingLink}" target="_blank" onclick="window.launchStemulusReminderSession('${safeSid}','${safeLink}','${safeStudent}','${safeTutor}','${safeCourse}')" style="display:inline-flex; align-items:center; gap:6px; background:#F4600C; color:#FFFFFF; text-decoration:none; font-size:12px; font-weight:800; padding:8px 16px; border-radius:12px; border:2px solid #EA580C; border-bottom:3px solid #C2410C;">
              <span>Meeting Link</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => {
      if (typeof window !== 'undefined' && window.dismissStemulusCard) {
        window.dismissStemulusCard(bannerId, true);
      }
    }, 18000);
  }

  // Show 1-Hour Preparation Toast Banner (3D Minimalist Playful Light Theme)
  function show1HourBanner(schedule) {
    if (typeof document === 'undefined') return;
    ensureAlertStyles();
    const bannerId = 'reminder-banner-1h-' + schedule.id;
    if (document.getElementById(bannerId)) return;

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const time = schedule.time || 'Upcoming';
    const meetingLink = buildPortalLaunchLink(schedule);
    const safeSid = String(schedule.id || '').replace(/'/g, "\\'");
    const safeLink = String(meetingLink || '').replace(/'/g, "\\'");
    const safeStudent = String(studentName || '').replace(/'/g, "\\'");
    const safeTutor = String(tutorName || '').replace(/'/g, "\\'");
    const safeCourse = String(course || '').replace(/'/g, "\\'");

    const div = document.createElement('div');
    div.id = bannerId;
    div.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      max-width: 420px;
      width: calc(100vw - 48px);
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-bottom: 4px solid #CBD5E1;
      border-radius: 22px;
      padding: 18px 20px;
      color: #0F172A;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: stemulusAlertTopSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    `;

    div.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <div style="width:42px; height:42px; border-radius:14px; background:#EFF6FF; border:2px solid #BFDBFE; border-bottom:3px solid #93C5FD; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#1D4ED8;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#1D4ED8; background:#EFF6FF; border:1px solid #BFDBFE; padding:2px 8px; border-radius:8px;">
              Class in 1 Hour
            </span>
            <button onclick="window.dismissStemulusCard('${bannerId}', true)" aria-label="Close notification" style="background:none; border:none; color:#94A3B8; font-size:18px; line-height:1; cursor:pointer; padding:2px 6px; border-radius:4px; transition:color 0.15s;">&times;</button>
          </div>
          <h4 style="margin:0 0 3px 0; font-size:15px; font-weight:800; color:#0F172A; line-height:1.35; word-break:break-word; font-family:'Outfit', sans-serif;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 12px 0; font-size:12px; color:#64748B; line-height:1.45;">
            Session starts at <strong>${time}</strong> with <strong>${tutorName}</strong>.
          </p>
          <div style="display:flex; gap:8px; align-items:center;">
            <a href="${meetingLink}" target="_blank" onclick="window.launchStemulusReminderSession('${safeSid}','${safeLink}','${safeStudent}','${safeTutor}','${safeCourse}')" style="display:inline-flex; align-items:center; gap:6px; background:#2563EB; color:#FFFFFF; text-decoration:none; font-size:12px; font-weight:800; padding:8px 16px; border-radius:12px; border:2px solid #1D4ED8; border-bottom:3px solid #1E40AF;">
              <span>Join Live Classroom</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => {
      if (typeof window !== 'undefined' && window.dismissStemulusCard) {
        window.dismissStemulusCard(bannerId, true);
      }
    }, 18000);
  }

  // Show 10-Minute Urgent Classroom Alert (3D Minimalist Playful Light Theme - Student Name + Class in 10 Mins + Meeting Link)
  function show10MinuteModal(schedule) {
    if (typeof document === 'undefined') return;
    ensureAlertStyles();
    const modalId = 'urgent-class-modal-' + schedule.id;
    if (document.getElementById(modalId)) return;

    playReminderChime();

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const link = buildPortalLaunchLink(schedule);
    const time = schedule.time || '10 minutes';
    const safeSid = String(schedule.id || '').replace(/'/g, "\\'");
    const safeLink = String(link || '').replace(/'/g, "\\'");
    const safeStudent = String(studentName || '').replace(/'/g, "\\'");
    const safeTutor = String(tutorName || '').replace(/'/g, "\\'");
    const safeCourse = String(course || '').replace(/'/g, "\\'");

    const card = document.createElement('div');
    card.id = modalId;
    card.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 440px;
      width: calc(100vw - 48px);
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-bottom: 4px solid #CBD5E1;
      border-radius: 22px;
      padding: 20px 22px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.04);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: stemulusAlertSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      color: #0F172A;
    `;

    card.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:44px; height:44px; border-radius:14px; background:#FFF7ED; border:2px solid #FED7AA; border-bottom:3px solid #FDBA74; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#EA580C;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 8-6 4 6 4V8Z"/>
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
          </svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
            <div style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:#EA580C; background:#FFF7ED; border:1px solid #FED7AA; padding:3px 10px; border-radius:999px;">
              <span style="width:6px; height:6px; border-radius:50%; background:#F4600C; display:inline-block; animation:stemulusDotPulse 1.8s infinite;"></span>
              Class in 10 Minutes
            </div>
            <button onclick="window.dismissStemulusCard('${modalId}', false)" aria-label="Dismiss alert" style="background:none; border:none; color:#94A3B8; font-size:18px; line-height:1; cursor:pointer; padding:2px 6px; border-radius:4px; transition:color 0.15s;">&times;</button>
          </div>
          <h4 style="margin:0 0 4px 0; font-size:15px; font-weight:800; color:#0F172A; font-family:'Outfit', sans-serif; line-height:1.35; word-break:break-word;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 8px 0; font-size:13px; color:#64748B; line-height:1.45;">
            Class with <strong>${tutorName}</strong> starts in <strong>10 minutes</strong> (${time}).
          </p>
          <p style="margin:0 0 12px 0; font-size:11px; color:#475569; background:#F8FAFC; border:1px solid #E2E8F0; padding:6px 10px; border-radius:10px; word-break:break-all;">
            Meeting Link: <a href="${link}" target="_blank" onclick="window.launchStemulusReminderSession('${safeSid}','${safeLink}','${safeStudent}','${safeTutor}','${safeCourse}')" style="color:#2563EB; font-weight:800; text-decoration:underline;">${link}</a>
          </p>
          <div style="display:flex; align-items:center; gap:10px;">
            <a href="${link}" target="_blank" onclick="window.dismissStemulusCard('${modalId}', false); return window.launchStemulusReminderSession('${safeSid}','${safeLink}','${safeStudent}','${safeTutor}','${safeCourse}');" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; background:#F4600C; color:#FFFFFF; text-decoration:none; font-weight:800; font-size:13px; padding:9px 18px; border-radius:12px; border:2px solid #EA580C; border-bottom:4px solid #C2410C;">
              <span>Join Class</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <button onclick="window.dismissStemulusCard('${modalId}', false)" style="background:#F8FAFC; border:2px solid #E2E8F0; border-bottom:3px solid #CBD5E1; color:#64748B; font-size:12px; font-weight:800; cursor:pointer; padding:7px 12px; border-radius:10px;">Dismiss</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(card);
  }

  // Show 5-Minute Urgent Join-Now Alert (3D Minimalist Playful Light Theme - Student Name + Class in 5 Mins + Join Now Button with Meeting Link)
  function show5MinuteModal(schedule) {
    if (typeof document === 'undefined') return;
    ensureAlertStyles();
    const modalId = 'urgent-class-5m-modal-' + schedule.id;
    if (document.getElementById(modalId)) return;

    playReminderChime();

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const link = buildPortalLaunchLink(schedule);
    const time = schedule.time || '5 minutes';
    const safeSid = String(schedule.id || '').replace(/'/g, "\\'");
    const safeLink = String(link || '').replace(/'/g, "\\'");
    const safeStudent = String(studentName || '').replace(/'/g, "\\'");
    const safeTutor = String(tutorName || '').replace(/'/g, "\\'");
    const safeCourse = String(course || '').replace(/'/g, "\\'");

    const card = document.createElement('div');
    card.id = modalId;
    card.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 440px;
      width: calc(100vw - 48px);
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-bottom: 4px solid #CBD5E1;
      border-radius: 22px;
      padding: 20px 22px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.04);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: stemulusAlertSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      color: #0F172A;
    `;

    card.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:44px; height:44px; border-radius:14px; background:#ECFDF5; border:2px solid #A7F3D0; border-bottom:3px solid #6EE7B7; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#047857;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 8-6 4 6 4V8Z"/>
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
          </svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
            <div style="display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:#047857; background:#ECFDF5; border:1px solid #A7F3D0; padding:3px 10px; border-radius:999px;">
              <span style="width:6px; height:6px; border-radius:50%; background:#10B981; display:inline-block; animation:stemulusDotPulse 1.8s infinite;"></span>
              Class in 5 Minutes
            </div>
            <button onclick="window.dismissStemulusCard('${modalId}', false)" aria-label="Dismiss alert" style="background:none; border:none; color:#94A3B8; font-size:18px; line-height:1; cursor:pointer; padding:2px 6px; border-radius:4px; transition:color 0.15s;">&times;</button>
          </div>
          <h4 style="margin:0 0 4px 0; font-size:15px; font-weight:800; color:#0F172A; font-family:'Outfit', sans-serif; line-height:1.35; word-break:break-word;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 12px 0; font-size:13px; color:#64748B; line-height:1.45;">
            Class with <strong>${tutorName}</strong> starts in <strong>5 minutes</strong> (${time}). Click <strong>Join Now</strong> to launch Google Meet.
          </p>
          <div style="display:flex; align-items:center; gap:10px;">
            <a href="${link}" target="_blank" onclick="window.dismissStemulusCard('${modalId}', false); return window.launchStemulusReminderSession('${safeSid}','${safeLink}','${safeStudent}','${safeTutor}','${safeCourse}');" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; background:#10B981; color:#FFFFFF; text-decoration:none; font-weight:800; font-size:13px; padding:10px 20px; border-radius:12px; border:2px solid #059669; border-bottom:4px solid #047857;">
              <span>Join Now</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <button onclick="window.dismissStemulusCard('${modalId}', false)" style="background:#F8FAFC; border:2px solid #E2E8F0; border-bottom:3px solid #CBD5E1; color:#64748B; font-size:12px; font-weight:800; cursor:pointer; padding:7px 12px; border-radius:10px;">Dismiss</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(card);
  }

  // Periodic Schedule Evaluator (24h, 1h, 10m, 5m)
  function evaluateSchedules() {
    const schedules = getSchedules();
    if (!schedules || schedules.length === 0) return;

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const isAdminPage = typeof window !== 'undefined' && window.location && window.location.pathname.includes('admin-dashboard');
    const session = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSession === 'function') ? DashboardEngine.getSession() : null;
    const sessionEmail = (session && session.email) ? String(session.email).toLowerCase().trim() : '';

    function hasShownUserBanner(scheduleId, milestone) {
      if (!sessionEmail) return true;
      try {
        return sessionStorage.getItem(`stemulus_ui_rem_${milestone}_${scheduleId}_${sessionEmail}`) === '1';
      } catch (e) {
        return false;
      }
    }

    function markShownUserBanner(scheduleId, milestone) {
      if (!sessionEmail) return;
      try {
        sessionStorage.setItem(`stemulus_ui_rem_${milestone}_${scheduleId}_${sessionEmail}`, '1');
      } catch (e) {}
    }

    schedules.forEach(schedule => {
      if (!schedule.date || !schedule.time) return;
      if (schedule.attendanceStatus === 'present' || schedule.attendanceStatus === 'absent' || schedule.attendanceStatus === 'cancelled' || schedule.status === 'done') return;

      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`).getTime();
      if (isNaN(scheduleDateTime)) return;

      const diff = scheduleDateTime - now;
      const belongsToCurrentUser = !isAdminPage && isScheduleForCurrentUser(schedule);

      // 1. 24-Hour Milestone (between 1 hour and 24 hours away)
      if (diff > ONE_HOUR_MS && diff <= TWENTY_FOUR_HOURS_MS) {
        if (!schedule.reminded24h) {
          markScheduleReminded(schedule.id, '24h');
          dispatchReminderEmails(schedule, '24h');
          addPortalNotifications(schedule, '24h');
          console.log(`[ClassReminders] Dispatched 24h reminder for session #${schedule.id} (${schedule.studentName}) to canonical Tutor and Parent`);
        }
        if (belongsToCurrentUser && !hasShownUserBanner(schedule.id, '24h')) {
          markShownUserBanner(schedule.id, '24h');
          show24HourBanner(schedule);
        }
      }

      // 2. 1-Hour Milestone (between 10 minutes and 1 hour away)
      if (diff > TEN_MINUTES_MS && diff <= ONE_HOUR_MS) {
        if (!schedule.reminded1h) {
          markScheduleReminded(schedule.id, '1h');
          dispatchReminderEmails(schedule, '1h');
          addPortalNotifications(schedule, '1h');
          console.log(`[ClassReminders] Dispatched 1h prep briefing for session #${schedule.id} (${schedule.studentName}) to canonical Tutor and Parent`);
        }
        if (belongsToCurrentUser && !hasShownUserBanner(schedule.id, '1h')) {
          markShownUserBanner(schedule.id, '1h');
          show1HourBanner(schedule);
        }
      }

      // 3. 10-Minute Milestone (between 5 minutes and 10 minutes away)
      if (diff > FIVE_MINUTES_MS && diff <= TEN_MINUTES_MS) {
        if (!schedule.reminded10m) {
          markScheduleReminded(schedule.id, '10m');
          dispatchReminderEmails(schedule, '10m');
          addPortalNotifications(schedule, '10m');
          console.log(`[ClassReminders] Dispatched 10m urgent alert for session #${schedule.id} (${schedule.studentName}) to canonical Tutor and Parent`);
        }
        if (belongsToCurrentUser && !hasShownUserBanner(schedule.id, '10m')) {
          markShownUserBanner(schedule.id, '10m');
          show10MinuteModal(schedule);
        }
      }

      // 4. 5-Minute Milestone (between 0 and 5 minutes away)
      if (diff > 0 && diff <= FIVE_MINUTES_MS) {
        if (!schedule.reminded5m) {
          markScheduleReminded(schedule.id, '5m');
          if (!schedule.reminded10m) markScheduleReminded(schedule.id, '10m');
          dispatchReminderEmails(schedule, '5m');
          addPortalNotifications(schedule, '5m');
          console.log(`[ClassReminders] Dispatched 5m Join-Now alert for session #${schedule.id} (${schedule.studentName}) to canonical Tutor and Parent`);
        }
        if (belongsToCurrentUser && !hasShownUserBanner(schedule.id, '5m')) {
          markShownUserBanner(schedule.id, '5m');
          show5MinuteModal(schedule);
        }
      }
    });
  }

  // Simulation API for testing and verification
  function simulate(milestone = '10m', customSchedule = null) {
    const dummySchedule = customSchedule || {
      id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
      studentName: 'Daniel Adeyemi',
      mentor: 'Mentor Sarah',
      tutorEmail: 'tutor@stemuluskidstech.com',
      parentEmail: 'parent@example.com',
      course: 'Python for Young Coders',
      time: '16:30',
      date: new Date().toISOString().split('T')[0],
      link: 'https://meet.google.com/stm-test-room'
    };

    if (milestone === '24h') {
      show24HourBanner(dummySchedule);
    } else if (milestone === '1h') {
      show1HourBanner(dummySchedule);
    } else if (milestone === '5m') {
      show5MinuteModal(dummySchedule);
    } else {
      show10MinuteModal(dummySchedule);
    }

    dispatchReminderEmails(dummySchedule, milestone);
    addPortalNotifications(dummySchedule, milestone);

    return { success: true, milestone, schedule: dummySchedule };
  }

  // Start Background Monitor
  function start() {
    if (checkInterval) clearInterval(checkInterval);
    evaluateSchedules();
    checkInterval = setInterval(evaluateSchedules, 30000); // check every 30s
    console.log('[ClassReminders] Background reminder monitor active (checks 24h, 1h, 10m, 5m intervals)');
  }

  function stop() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  // Auto-start on load in browser
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  return {
    start,
    stop,
    evaluate: evaluateSchedules,
    simulate,
    playChime: playReminderChime,
    resolveMeetingLink,
    buildPortalLaunchLink,
    buildOneClickEmailJoinUrl
  };
});
