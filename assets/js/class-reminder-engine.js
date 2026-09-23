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
          DashboardEngine.saveDB(db);
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

  // Dispatch Automated Email Reminders to both Parent and Tutor
  function dispatchReminderEmails(schedule, milestone) {
    if (typeof EmailService === 'undefined') return;

    // 1. Send to Parent
    if (schedule.parentEmail && typeof EmailService.sendReminderEmail === 'function') {
      EmailService.sendReminderEmail({
        student: {
          name: schedule.studentName,
          parentEmail: schedule.parentEmail,
          parentName: schedule.parentName || 'Parent'
        },
        schedule: schedule,
        type: milestone
      }).catch(e => console.warn('[ClassReminders] Parent email dispatch notice:', e.message));
    }

    // 2. Send to Tutor
    if (schedule.tutorEmail && typeof EmailService.sendTutorReminderEmail === 'function') {
      EmailService.sendTutorReminderEmail({
        tutor: {
          tutorEmail: schedule.tutorEmail,
          name: schedule.mentor || 'Mentor'
        },
        student: {
          name: schedule.studentName,
          parentEmail: schedule.parentEmail
        },
        schedule: schedule,
        type: milestone
      }).catch(e => console.warn('[ClassReminders] Tutor email dispatch notice:', e.message));
    }
  }

  // Add in-portal Notifications for both Parent and Tutor
  function addPortalNotifications(schedule, milestone) {
    if (typeof DashboardEngine === 'undefined' || typeof DashboardEngine.addNotification !== 'function') return;

    const label = milestone === '24h' ? '24 Hours' : (milestone === '10m' ? '10 Minutes' : '1 Hour');
    const isUrgent = milestone === '10m';

    // 1. Notification for Tutor
    if (schedule.tutorEmail) {
      DashboardEngine.addNotification({
        userEmail: schedule.tutorEmail,
        title: isUrgent ? `🚨 Class in 10 Minutes: ${schedule.studentName}` : `⏰ Class in ${label}: ${schedule.studentName}`,
        message: `Your 1-on-1 session for ${schedule.course} is scheduled for ${schedule.date} at ${schedule.time} (WAT). Link: ${schedule.link || 'Zoom'}`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    // 2. Notification for Parent
    if (schedule.parentEmail) {
      DashboardEngine.addNotification({
        userEmail: schedule.parentEmail,
        title: isUrgent ? `🚨 Class in 10 Minutes: ${schedule.studentName}` : `⏰ Class in ${label}: ${schedule.studentName}`,
        message: `${schedule.studentName}'s coding session with ${schedule.mentor || 'Mentor'} is at ${schedule.time} on ${schedule.date}. Link: ${schedule.link || 'Zoom'}`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }

  // Show 24-Hour Preparation Toast Banner
  function show24HourBanner(schedule) {
    if (typeof document === 'undefined') return;
    const bannerId = 'reminder-banner-24h-' + schedule.id;
    if (document.getElementById(bannerId)) return;

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const time = schedule.time || 'Upcoming';
    const date = schedule.date || 'Tomorrow';

    const div = document.createElement('div');
    div.id = bannerId;
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 420px;
      width: calc(100% - 40px);
      background: linear-gradient(135deg, #1E293B, #0F172A);
      border: 1px solid rgba(244, 96, 12, 0.4);
      border-radius: 16px;
      padding: 16px 20px;
      color: #FFFFFF;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 0 20px rgba(244, 96, 12, 0.15);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: fadeIn 0.4s ease forwards;
    `;

    div.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="flex-shrink:0; margin-top:2px;">
          <span style="font-size:24px;">⏰</span>
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#F4600C; background:rgba(244,96,12,0.12); padding:2px 8px; border-radius:6px; border:1px solid rgba(244,96,12,0.25);">
              Class in 24 Hours
            </span>
            <button onclick="document.getElementById('${bannerId}').remove()" style="background:none; border:none; color:#94A3B8; font-size:16px; cursor:pointer; padding:0 4px;">&times;</button>
          </div>
          <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:800; color:#FFFFFF;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 10px 0; font-size:12px; color:#94A3B8; line-height:1.4;">
            Scheduled for <strong>${date} at ${time}</strong> with <strong>${tutorName}</strong>. Automatic email dispatched to parent and tutor.
          </p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="${schedule.link || 'https://meet.google.com'}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#F4600C; color:#FFFFFF; text-decoration:none; font-size:11px; font-weight:700; padding:6px 12px; border-radius:8px;">
              Meeting Link &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => {
      if (document.getElementById(bannerId)) {
        div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 400);
      }
    }, 18000);
  }

  // Show 1-Hour Preparation Toast Banner
  function show1HourBanner(schedule) {
    if (typeof document === 'undefined') return;
    const bannerId = 'reminder-banner-1h-' + schedule.id;
    if (document.getElementById(bannerId)) return;

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const time = schedule.time || 'Upcoming';
    const date = schedule.date || 'Today';

    const div = document.createElement('div');
    div.id = bannerId;
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 420px;
      width: calc(100% - 40px);
      background: linear-gradient(135deg, #1E293B, #0F172A);
      border: 1px solid rgba(59, 130, 246, 0.5);
      border-radius: 16px;
      padding: 16px 20px;
      color: #FFFFFF;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 0 20px rgba(59, 130, 246, 0.2);
      z-index: 99999;
      font-family: 'Nunito', sans-serif;
      animation: fadeIn 0.4s ease forwards;
    `;

    div.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="flex-shrink:0; margin-top:2px;">
          <span style="font-size:24px;">🔔</span>
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#60A5FA; background:rgba(59,130,246,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(59,130,246,0.3);">
              Class in 1 Hour
            </span>
            <button onclick="document.getElementById('${bannerId}').remove()" style="background:none; border:none; color:#94A3B8; font-size:16px; cursor:pointer; padding:0 4px;">&times;</button>
          </div>
          <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:800; color:#FFFFFF;">
            ${studentName} &bull; ${course}
          </h4>
          <p style="margin:0 0 10px 0; font-size:12px; color:#94A3B8; line-height:1.4;">
            Session starts at <strong>${time}</strong> with <strong>${tutorName}</strong>. 1-hour email notification dispatched.
          </p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="${schedule.link || 'https://meet.google.com'}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#2563EB; color:#FFFFFF; text-decoration:none; font-size:11px; font-weight:700; padding:6px 12px; border-radius:8px;">
              Open Zoom &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => {
      if (document.getElementById(bannerId)) {
        div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 400);
      }
    }, 18000);
  }

  // Show 10-Minute Urgent Classroom Modal with Web Audio Chime
  function show10MinuteModal(schedule) {
    if (typeof document === 'undefined') return;
    const modalId = 'urgent-class-modal-' + schedule.id;
    if (document.getElementById(modalId)) return;

    playReminderChime();

    const studentName = schedule.studentName || schedule.student || 'Your Student';
    const tutorName = schedule.mentor || schedule.tutorName || 'Your Mentor';
    const course = schedule.course || 'Coding Session';
    const link = schedule.link || 'https://meet.google.com';

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(12px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
      font-family: 'Nunito', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg, #1E293B, #0F172A); border:2px solid #F4600C; box-shadow:0 0 40px rgba(244,96,12,0.35); border-radius:24px; max-width:460px; width:100%; padding:32px; text-align:center; position:relative; color:#FFFFFF;">
        <button onclick="document.getElementById('${modalId}').remove()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.08); border:none; width:32px; height:32px; border-radius:50%; color:#94A3B8; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>

        <div style="margin-bottom:16px; font-size:44px;">
          ⚡
        </div>

        <span style="display:inline-block; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#F4600C; background:rgba(244,96,12,0.15); border:1px solid rgba(244,96,12,0.3); padding:4px 12px; border-radius:20px; margin-bottom:12px;">
          Starting in 10 Minutes!
        </span>

        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px 0; font-family:'Outfit', sans-serif; color:#FFFFFF;">
          Classroom Launching Now
        </h2>

        <p style="font-size:14px; color:#CBD5E1; line-height:1.5; margin:0 0 24px 0;">
          <strong>${studentName}</strong>'s 1-on-1 <strong>${course}</strong> class with mentor <strong>${tutorName}</strong> begins in 10 minutes.
        </p>

        <a href="${link}" target="_blank" onclick="document.getElementById('${modalId}').remove()" style="display:block; background:#F4600C; color:#FFFFFF; text-decoration:none; font-weight:800; font-size:15px; padding:14px 28px; border-radius:14px; box-shadow:0 8px 24px rgba(244,96,12,0.4); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          Launch Classroom Now &rarr;
        </a>

        <p style="margin:16px 0 0 0; font-size:11px; color:#64748B;">
          Dual 10-minute alerts dispatched to both Parent and Mentor.
        </p>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  // Periodic Schedule Evaluator (24h, 1h, 10m)
  function evaluateSchedules() {
    const schedules = getSchedules();
    if (!schedules || schedules.length === 0) return;

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    schedules.forEach(schedule => {
      if (!schedule.date || !schedule.time) return;
      if (schedule.attendanceStatus === 'present' || schedule.attendanceStatus === 'absent' || schedule.attendanceStatus === 'cancelled') return;

      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`).getTime();
      if (isNaN(scheduleDateTime)) return;

      const diff = scheduleDateTime - now;

      // 1. 24-Hour Milestone (between 1 hour and 24 hours away)
      if (diff > ONE_HOUR_MS && diff <= TWENTY_FOUR_HOURS_MS && !schedule.reminded24h) {
        markScheduleReminded(schedule.id, '24h');
        show24HourBanner(schedule);
        dispatchReminderEmails(schedule, '24h');
        addPortalNotifications(schedule, '24h');
        console.log(`[ClassReminders] Dispatched 24h reminder for session #${schedule.id} (${schedule.studentName}) to Tutor and Parent`);
      }

      // 2. 1-Hour Milestone (between 10 minutes and 1 hour away)
      if (diff > TEN_MINUTES_MS && diff <= ONE_HOUR_MS && !schedule.reminded1h) {
        markScheduleReminded(schedule.id, '1h');
        show1HourBanner(schedule);
        dispatchReminderEmails(schedule, '1h');
        addPortalNotifications(schedule, '1h');
        console.log(`[ClassReminders] Dispatched 1h prep briefing for session #${schedule.id} (${schedule.studentName}) to Tutor and Parent`);
      }

      // 3. 10-Minute Milestone (between 0 and 10 minutes away)
      if (diff > 0 && diff <= TEN_MINUTES_MS && !schedule.reminded10m) {
        markScheduleReminded(schedule.id, '10m');
        show10MinuteModal(schedule);
        dispatchReminderEmails(schedule, '10m');
        addPortalNotifications(schedule, '10m');
        console.log(`[ClassReminders] Dispatched 10m urgent alert for session #${schedule.id} (${schedule.studentName}) to Tutor and Parent`);
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
    console.log('[ClassReminders] Background reminder monitor active (checks 24h, 1h, 10m intervals)');
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
    playChime: playReminderChime
  };
});
