/**
 * STEMulus Class Presence Tracking, Real-Time Disconnect/Reconnect Watchdog,
 * and Urgent Admin Escalation Engine (Production)
 * 
 * Capabilities:
 * 1. Real-time Heartbeat & Presence Tracking (Student & Tutor).
 * 2. Instant Escalations:
 *    - T+5m Late Join: Alerts missing tutor/coder via ntfy push & WhatsApp.
 *    - Mid-Session Disconnect: Detects abrupt page close / connection loss; fires urgent alarm.
 *    - Party Reconnect: Immediately notifies Admin that the participant has returned.
 *    - T+10m Critical Incident: Escalates to Operations Manager & auto-issues makeup class token.
 * 3. High-Priority Urgent Notification Channels:
 *    - ntfy.sh instant push notifications (Priority: 5 / urgent, audible sirens bypassing DND).
 *    - Web Audio API dual-tone emergency siren synthesizer (zero external mp3 dependency).
 *    - In-Dashboard sticky pulsating Emergency HUD banner.
 *    - 1-Click WhatsApp direct link to Nigerian admin line (+234 705 246 6716) and parents.
 */

const ClassEscalationEngine = (function() {
  'use strict';

  const STORAGE_KEY = 'stemulus_live_presence';
  const INCIDENTS_KEY = 'stemulus_class_incidents';
  const MAKEUP_TOKENS_KEY = 'stemulus_makeup_tokens';
  const NTFY_TOPIC = (typeof window !== 'undefined' && window.STEMULUS_CONFIG && window.STEMULUS_CONFIG.NTFY_TOPIC)
    ? window.STEMULUS_CONFIG.NTFY_TOPIC
    : 'stemulus-admin-alerts';
  const ADMIN_WHATSAPP = '2347052466716';

  // In-memory state
  let audioCtx = null;
  let isMuted = false;
  let watchdogTimer = null;
  let alertedIncidents = new Set();

  function getLivePresenceStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveLivePresenceStore(store, changedKey = null) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      if (changedKey && store[changedKey]) {
        if (typeof StemulusFirestore !== 'undefined' && typeof StemulusFirestore.syncDoc === 'function') {
          StemulusFirestore.syncDoc('live_presence', String(changedKey), store[changedKey]).catch(() => {});
        } else if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
          const safeId = String(changedKey).replace(/[^a-zA-Z0-9_-]/g, '_');
          firebase.firestore().collection('live_presence').doc(safeId).set(store[changedKey], { merge: true }).catch(() => {});
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stemulus_presence_updated', { detail: { key: changedKey, store } }));
      }
    } catch (e) {}
  }

  function syncRemotePresenceFromFirestore() {
    try {
      if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') return;
      const todayStr = new Date().toISOString().slice(0, 10);
      firebase.firestore().collection('live_presence')
        .where('classDate', '==', todayStr)
        .get()
        .then(snapshot => {
          if (!snapshot || snapshot.empty) return;
          const store = getLivePresenceStore();
          let updated = false;
          snapshot.forEach(doc => {
            const data = doc.data() || {};
            const key = data.scheduleId || doc.id;
            if (!key) return;
            const local = store[key] || {};
            if (data.tutorPresent && !local.tutorPresent) {
              local.tutorPresent = true;
              local.tutorJoinedAt = data.tutorJoinedAt || new Date().toISOString();
              local.tutorName = data.tutorName || local.tutorName;
              local.lastHeartbeat = Date.now();
              updated = true;
            }
            if (data.studentPresent && !local.studentPresent) {
              local.studentPresent = true;
              local.studentJoinedAt = data.studentJoinedAt || new Date().toISOString();
              local.studentName = data.studentName || local.studentName;
              local.lastHeartbeat = Date.now();
              updated = true;
            }
            if (updated) {
              local.scheduleId = key;
              local.status = local.status || 'active';
              store[key] = local;
            }
          });
          if (updated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  /**
   * Resolves complete contact & participant details for any schedule or presence entry.
   */
  function resolveSessionContacts(scheduleOrPresence = {}) {
    let db = {};
    try {
      if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getDB === 'function') {
        db = DashboardEngine.getDB() || {};
      } else if (typeof localStorage !== 'undefined') {
        db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
      }
    } catch (e) {}

    const students = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getStudents === 'function')
      ? DashboardEngine.getStudents()
      : (db.students || []);
    const tutors = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getTutors === 'function')
      ? DashboardEngine.getTutors()
      : (db.tutors || []);
    const schedules = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSchedules === 'function')
      ? DashboardEngine.getSchedules()
      : (db.schedules || []);

    const schedId = scheduleOrPresence.scheduleId || scheduleOrPresence.id || scheduleOrPresence.sessionId;
    const matchedSchedule = schedules.find(s => s && (s.id === schedId || s.sessionId === schedId)) || scheduleOrPresence || {};

    const rawStudentName = matchedSchedule.studentName || scheduleOrPresence.studentName || 'Student';
    const studentId = matchedSchedule.studentId || scheduleOrPresence.studentId || '';
    const matchedStudent = students.find(st => {
      if (!st) return false;
      if (studentId && st.id === studentId) return true;
      const full = `${st.firstName || ''} ${st.lastName || ''}`.trim().toLowerCase();
      const target = rawStudentName.toLowerCase().trim();
      return full === target || full.includes(target) || target.includes(st.firstName ? st.firstName.toLowerCase() : '___');
    }) || {};

    const studentName = matchedStudent.firstName
      ? `${matchedStudent.firstName} ${matchedStudent.lastName || ''}`.trim()
      : rawStudentName;
    const studentFirstName = (matchedStudent.firstName || studentName.split(' ')[0] || 'Coder').trim();

    const rawTutorName = matchedSchedule.mentor || matchedSchedule.tutorName || scheduleOrPresence.tutorName || matchedStudent.tutorName || 'Assigned Tutor';
    const rawTutorEmail = matchedSchedule.tutorEmail || scheduleOrPresence.tutorEmail || matchedStudent.tutorEmail || '';
    const matchedTutor = tutors.find(t => {
      if (!t) return false;
      if (rawTutorEmail && t.email && t.email.toLowerCase().trim() === rawTutorEmail.toLowerCase().trim()) return true;
      const tName = (t.name || '').toLowerCase().trim();
      const targetT = rawTutorName.toLowerCase().trim();
      return tName && targetT && (tName === targetT || tName.includes(targetT) || targetT.includes(tName.split(' ')[0]));
    }) || {};

    const tutorName = matchedTutor.name || rawTutorName;
    const tutorFirstName = (tutorName.replace(/^(Coach|Tutor|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(' ')[0] || 'Tutor').trim();
    const tutorPhone = matchedTutor.phone || matchedSchedule.tutorPhone || '+2347052466716';
    const tutorEmail = (matchedTutor.email || rawTutorEmail || '').toLowerCase().trim();

    const parentName = matchedStudent.parentName || matchedSchedule.parentName || `${studentFirstName}'s Parent`;
    const parentPhone = matchedStudent.parentPhone || matchedStudent.phone || matchedSchedule.parentPhone || matchedSchedule.phone || '+2347052466716';
    const parentEmail = (matchedStudent.parentEmail || matchedStudent.email || matchedSchedule.parentEmail || '').toLowerCase().trim();

    const courseName = matchedSchedule.course || matchedSchedule.program || scheduleOrPresence.courseName || matchedStudent.program || 'STEMulus Coding Session';
    const meetingUrl = matchedSchedule.link || matchedSchedule.meetLink || matchedStudent.meetLink || matchedStudent.classroomLink || 'https://meet.google.com/stm-prog-live';

    return {
      scheduleId: schedId || matchedSchedule.id || 'live-session',
      studentId: matchedStudent.id || studentId,
      studentName,
      studentFirstName,
      tutorName,
      tutorFirstName,
      tutorPhone,
      tutorEmail,
      parentName,
      parentPhone,
      parentEmail,
      courseName,
      meetingUrl,
      date: matchedSchedule.date || scheduleOrPresence.date || new Date().toISOString().slice(0, 10),
      time: matchedSchedule.time || 'Scheduled Time'
    };
  }

  /**
   * Queues a Late-Join / Waiting Notification Email draft into the Admin Email Queue (db.emailQueue)
   * from admin@stemuluskidstech.com so the Admin can review and manually dispatch with 1 click.
   * Deduplicated per scheduleId + lateRole so a session never queues duplicate drafts.
   */
  function queueLateJoinNotificationEmail(opts = {}) {
    if (typeof DashboardEngine === 'undefined' || typeof DashboardEngine.addToEmailQueue !== 'function') return null;

    const lateRole = String(opts.lateRole || 'tutor').toLowerCase().trim();
    const contacts = opts.contacts || resolveSessionContacts(opts);
    const scheduleId = String(opts.scheduleId || contacts.scheduleId || 'live-session');
    const lateMinutes = Math.max(1, parseInt(opts.lateMinutes, 10) || 5);
    const dedupeKey = `late_join_${scheduleId}_${lateRole}`;

    try {
      const db = (typeof DashboardEngine.getDB === 'function') ? DashboardEngine.getDB() : {};
      const existingQueue = Array.isArray(db.emailQueue) ? db.emailQueue : [];
      const alreadyQueued = existingQueue.some(item => item && (
        item.dedupeKey === dedupeKey ||
        (item.data && item.data.dedupeKey === dedupeKey)
      ));
      if (alreadyQueued) return null;
    } catch (e) {}

    const recipientEmail = lateRole === 'tutor' ? contacts.tutorEmail : contacts.parentEmail;
    if (!recipientEmail || !recipientEmail.includes('@')) return null;

    const recipientName = lateRole === 'tutor' ? contacts.tutorName : contacts.parentName;
    const meetUrl = contacts.meetingUrl || 'https://meet.google.com/stm-prog-live';
    const sessionTime = contacts.time || 'Scheduled Time';
    const joinedLate = !!opts.joinedLate;

    const subject = lateRole === 'tutor'
      ? `Session Punctuality Notice: ${contacts.studentName} (${contacts.courseName})`
      : `Live Classroom Update: ${contacts.studentFirstName}'s ${contacts.courseName} Session`;

    const bodyText = lateRole === 'tutor'
      ? (joinedLate
          ? `Dear ${contacts.tutorName},\n\nOur automated Google Meet session monitor recorded that you joined ${contacts.studentName}'s ${contacts.courseName} session (${sessionTime} WAT) approximately ${lateMinutes} minutes past the scheduled start time.\n\nAt STEMulus Kids Tech, mentors are expected to launch the Google Meet room 5 minutes prior to class start so every coder receives their full 60-minute learning experience. Please ensure the full session duration is completed today (${meetUrl}).\n\nWarm regards,\nAcademic Operations Directorate\nSTEMulus Kids Technologies Ltd.\nadmin@stemuluskidstech.com`
          : `Dear ${contacts.tutorName},\n\n${contacts.studentName} is currently waiting in the live Google Meet classroom for their ${contacts.courseName} session scheduled at ${sessionTime} WAT (+${lateMinutes} mins).\n\nPlease join the classroom immediately using your dedicated session link so the class can hold: ${meetUrl}\n\nWarm regards,\nAcademic Operations Directorate\nSTEMulus Kids Technologies Ltd.\nadmin@stemuluskidstech.com`)
      : (joinedLate
          ? `Dear ${contacts.parentName},\n\nWe noticed that ${contacts.studentFirstName} joined today's ${contacts.courseName} session with Mentor ${contacts.tutorName} (${sessionTime} WAT) approximately ${lateMinutes} minutes after the scheduled start time.\n\nYour child is now connected in the live Google Meet classroom (${meetUrl}). Encouraging ${contacts.studentFirstName} to join 2 to 5 minutes before the hour helps ensure they enjoy their full 60-minute 1-on-1 coding session.\n\nWarm regards,\nAcademic Operations Directorate\nSTEMulus Kids Technologies Ltd.\nadmin@stemuluskidstech.com`
          : `Dear ${contacts.parentName},\n\nMentor ${contacts.tutorName} is currently in the STEMulus Google Meet classroom waiting for ${contacts.studentFirstName} for today's ${contacts.courseName} session (${sessionTime} WAT).\n\nPlease use this direct link for ${contacts.studentFirstName} to join the live session now: ${meetUrl}\n\nIf you need any assistance connecting, simply reply to this email or message us on WhatsApp.\n\nWarm regards,\nAcademic Operations Directorate\nSTEMulus Kids Technologies Ltd.\nadmin@stemuluskidstech.com`);

    return DashboardEngine.addToEmailQueue({
      type: 'custom',
      from: 'admin@stemuluskidstech.com',
      senderEmail: 'admin@stemuluskidstech.com',
      to: recipientEmail,
      recipientName: recipientName,
      subject: subject,
      htmlPreview: bodyText,
      dedupeKey: dedupeKey,
      data: {
        to: recipientEmail,
        recipientName: recipientName,
        subject: subject,
        body: bodyText,
        html: bodyText.replace(/\n/g, '<br>'),
        from: 'admin@stemuluskidstech.com',
        senderEmail: 'admin@stemuluskidstech.com',
        scheduleId: scheduleId,
        studentName: contacts.studentName,
        tutorName: contacts.tutorName,
        courseName: contacts.courseName,
        lateRole: lateRole,
        lateMinutes: lateMinutes,
        dedupeKey: dedupeKey
      },
      triggeredBy: 'autonomous_meet_late_monitor'
    });
  }

  function getIncidents() {
    try {
      return JSON.parse(localStorage.getItem(INCIDENTS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveIncident(incident) {
    try {
      const incidents = getIncidents();
      incidents.unshift(incident);
      if (incidents.length > 100) incidents.pop();
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    } catch (e) {}
  }

  function getMakeupTokens() {
    try {
      return JSON.parse(localStorage.getItem(MAKEUP_TOKENS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // Resilient Web Audio user gesture unlocker to prevent browser autoplay warnings
  if (typeof window !== 'undefined') {
    const unlockAudio = () => {
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      } catch (_) {}
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
    window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
  }

  // Web Audio Alarm Synthesizer
  function playAudioSiren(type = 'urgent') {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) {
        try {
          audioCtx = new AudioContext();
        } catch (_) {
          return;
        }
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;

      if (type === 'urgent' || type === 'disconnect') {
        // High-low alternating emergency siren (880Hz / 660Hz)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);

        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.4);
        osc.frequency.setValueAtTime(660, now + 0.6);
        osc.frequency.setValueAtTime(880, now + 0.8);
        osc.frequency.setValueAtTime(660, now + 1.0);
        osc.frequency.setValueAtTime(880, now + 1.2);
        osc.frequency.setValueAtTime(660, now + 1.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.6);
      } else if (type === 'reconnect' || type === 'success') {
        // Ascending pleasant major arpeggio chime (C5 -> E5 -> G5)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          const t = now + (idx * 0.15);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      } else if (type === 'warning') {
        // Dual warning beep (750Hz)
        [0, 0.25].forEach(delay => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          const t = now + delay;
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.frequency.setValueAtTime(750, t);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
        });
      }
    } catch (e) {
      console.warn('[EscalationEngine] Audio siren error:', e);
    }
  }

  /**
   * Dispatch urgent push notification via ntfy.sh and local channels.
   */
  async function dispatchUrgentAlert({ title, message, priority = '5', tags = 'warning,loudspeaker', actionUrl = '', contactActionLabel = '', whoToContact = '' }) {
    console.warn(`[EscalationEngine] 🚨 URGENT DISPATCH: [${title}] ${message}`);

    // 1. Play audio alarm
    const alarmType = (priority === '5' || priority === 'urgent') ? 'urgent' : (tags.includes('check') ? 'reconnect' : 'warning');
    playAudioSiren(alarmType);

    // 2. Dispatch to unified ntfy.sh channel (Direct + Serverless Relay)
    const asciiTitle = (title || 'STEMulus Class Monitor').replace(/[^\x20-\x7E]/g, '').trim() || 'STEMulus Class Monitor';
    const asciiTags = (tags || 'warning').replace(/[^\x20-\x7E]/g, '').trim();
    const targetClick = actionUrl || 'https://stemuluskidstech.com/admin-dashboard.html';

    try {
      fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': asciiTitle,
          'Priority': String(priority),
          'Tags': asciiTags,
          'Click': targetClick
        },
        body: message
      }).catch(err => console.warn('[EscalationEngine] Direct ntfy push notice:', err.message));

      if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
        fetch('/.netlify/functions/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'admin',
            topic: NTFY_TOPIC,
            title: asciiTitle,
            message: message,
            priority: String(priority || 'high'),
            tags: asciiTags,
            click: targetClick
          })
        }).catch(() => {});
      }
    } catch (e) {}

    // 3. Desktop Notification (if permitted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/assets/images/favicon.png',
          tag: 'stemulus-escalation'
        });
      } catch (e) {}
    }

    // 4. Save incident in store
    const incident = {
      id: 'inc-' + Date.now(),
      title,
      message,
      priority,
      tags,
      actionUrl: targetClick,
      contactActionLabel: contactActionLabel || (whoToContact ? `Reach Out to ${whoToContact}` : 'Reach Out via WhatsApp'),
      whoToContact: whoToContact || '',
      timestamp: new Date().toISOString()
    };
    saveIncident(incident);

    // 5. Emit custom DOM event for active UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stemulus_escalation_alert', { detail: incident }));
      mountAdminLiveEscalationBanner(incident);
    }

    return incident;
  }

  /**
   * Mount floating emergency banner on Admin Dashboard ONLY with a clean white ceramic design.
   */
  function mountAdminLiveEscalationBanner(incident) {
    if (typeof document === 'undefined' || !document.body) return;

    const currentSession = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSession === 'function')
      ? DashboardEngine.getSession()
      : null;
    const isAdminPage = typeof window !== 'undefined' && window.location && (
      window.location.pathname.includes('admin-dashboard.html') ||
      window.location.href.includes('admin-dashboard.html')
    );
    const isAdminRole = currentSession && currentSession.role === 'admin';

    // Strictly restrict waiting/escalation banners to Admin only (never show on Tutor, Parent, or Join-Class views)
    if (!isAdminPage && !isAdminRole) {
      const existing = document.getElementById('stemulus-urgent-escalation-banner');
      if (existing) existing.remove();
      return;
    }

    let banner = document.getElementById('stemulus-urgent-escalation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'stemulus-urgent-escalation-banner';
      document.body.appendChild(banner);
    }

    const isReconnect = (incident.tags || '').includes('check') || (incident.priority === '3');

    // Clean, 3D minimalist playful pure white card design
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-900 rounded-3xl shadow-xl p-4 transition-all flex items-start gap-3.5';
    banner.style.cssText = 'position:fixed !important; top:16px !important; left:50% !important; transform:translateX(-50%) !important; z-index:99999 !important; width:95% !important; max-width:672px !important; background:#FFFFFF !important; background-color:#FFFFFF !important; border:2px solid #E2E8F0 !important; border-bottom:4px solid #CBD5E1 !important; color:#0F172A !important; border-radius:22px !important; padding:16px 20px !important; box-shadow:0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05) !important; display:flex !important; align-items:flex-start !important; gap:14px !important; font-family:"Plus Jakarta Sans", system-ui, sans-serif !important;';

    const iconBadge = isReconnect
      ? '<div style="width:36px; height:36px; border-radius:12px; background:#ECFDF5; border:1px solid #A7F3D0; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:16px; font-weight:800;">✓</div>'
      : '<div style="width:36px; height:36px; border-radius:12px; background:#FEF2F2; border:1px solid #FECDD3; color:#DC2626; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:16px; font-weight:800;">⚠️</div>';

    const primaryActionUrl = (incident.actionUrl && incident.actionUrl.startsWith('https://wa.me/'))
      ? incident.actionUrl
      : `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`[STEMulus Class Monitor] ${incident.title}: ${incident.message}`)}`;
    const primaryBtnLabel = incident.contactActionLabel || 'Reach Out on WhatsApp';

    banner.innerHTML = `
      ${iconBadge}
      <div class="flex-grow min-w-0" style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
          <h4 style="font-weight:800; font-size:13.5px; color:#0F172A; margin:0; letter-spacing:-0.01em;">${incident.title}</h4>
          <span style="font-size:11px; font-weight:600; color:#94A3B8; font-family:'JetBrains Mono', monospace;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p style="font-size:12.5px; color:#475569; font-weight:500; line-height:1.5; margin:0 0 12px 0;">${incident.message}</p>
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
          <a href="${primaryActionUrl}" target="_blank" rel="noopener noreferrer" style="background:#10B981; color:#FFFFFF; font-weight:700; font-size:12px; padding:7px 16px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(16, 185, 129, 0.25); transition:background 0.15s ease;">
            <span>${primaryBtnLabel}</span>
          </a>
          <button id="btn-dismiss-escalation-banner" style="background:#F1F5F9; color:#475569; border:1px solid #E2E8F0; font-weight:700; font-size:12px; padding:7px 14px; border-radius:10px; cursor:pointer; transition:all 0.15s ease;">
            Dismiss
          </button>
        </div>
      </div>
    `;

    const dismissBtn = (typeof banner.querySelector === 'function') ? banner.querySelector('#btn-dismiss-escalation-banner') : null;
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        if (typeof banner.remove === 'function') banner.remove();
      };
    }
  }

  function parseTimeComponents(timeStr) {
    if (!timeStr) return { hh: 0, mm: 0 };
    const clean = String(timeStr).trim();
    const isPM = /pm/i.test(clean);
    const isAM = /am/i.test(clean);
    const parts = clean.replace(/[^0-9:]/g, '').split(':');
    let hh = parseInt(parts[0], 10) || 0;
    let mm = parseInt(parts[1], 10) || 0;
    if (isPM && hh < 12) hh += 12;
    if (isAM && hh === 12) hh = 0;
    return { hh, mm };
  }

  /**
   * Evaluate state of a scheduled class at current time.
   */
  function evaluateSessionState(schedule, presence = null) {
    if (!schedule) {
      return { status: 'INVALID', code: 'INVALID', label: 'Incomplete Schedule', badgeClass: 'bg-slate-100 text-slate-500' };
    }

    const store = getLivePresenceStore();
    const validPresenceArg = (presence && typeof presence === 'object') ? presence : null;
    const sessPresence = validPresenceArg || store[schedule.id] || store[schedule.sessionId] || {};
    const tutorPresent = !!(sessPresence.tutorPresent || sessPresence.tutorJoinedAt);
    const studentPresent = !!(sessPresence.studentPresent || sessPresence.studentJoinedAt);
    const isDisconnected = sessPresence.status === 'disconnected';
    const isReconnected = sessPresence.status === 'reconnected';
    const contacts = resolveSessionContacts({ ...schedule, ...sessPresence });

    // Parse session date & time (fallback to today if date missing on live presence entry)
    const todayStr = new Date().toISOString().slice(0, 10);
    const schedDate = (schedule.date || todayStr).slice(0, 10);
    const { hh, mm } = parseTimeComponents(schedule.time || '12:00');
    const sessionStart = new Date(`${schedDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    const now = new Date();
    const durationMinutes = parseInt(schedule.duration, 10) || 60;
    const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);

    const diffMinutes = isNaN(sessionStart.getTime()) ? 0 : Math.floor((now.getTime() - sessionStart.getTime()) / 60000);

    // 1. Mid-session Disconnect state
    if (isDisconnected) {
      const missingRole = sessPresence.disconnectedRole === 'tutor' ? 'Tutor' : 'Coder';
      const reachOutTarget = sessPresence.disconnectedRole === 'tutor'
        ? `Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`
        : `${contacts.studentFirstName}'s Parent (${contacts.parentName} · ${contacts.parentPhone})`;
      return {
        status: 'DISCONNECTED',
        code: 'DISCONNECTED',
        label: `🚨 Disconnected (${sessPresence.disconnectedParty || missingRole})`,
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500 font-black animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true,
        alertType: sessPresence.disconnectedRole === 'tutor' ? 'tutor_alert' : 'parent_nudge',
        contactSummary: `${sessPresence.disconnectedParty || missingRole} disconnected mid-session. Please reach out to ${reachOutTarget}.`,
        whoToContact: reachOutTarget,
        contacts,
        presence: sessPresence
      };
    }

    // 2. Active Live Presence States (Immediate detection whenever either party joins the room)
    if (tutorPresent && studentPresent) {
      const label = isReconnected ? 'Active • Reconnected' : 'Active • Both in Room';
      return {
        status: 'IN_SESSION',
        code: 'IN_SESSION',
        label: label,
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false,
        alertType: 'none',
        contactSummary: `Both ${contacts.studentFirstName} and Tutor ${contacts.tutorFirstName} have joined. Class is holding live!`,
        whoToContact: 'None (Both in Class)',
        contacts,
        presence: sessPresence
      };
    }

    if (studentPresent && !tutorPresent) {
      const waitMins = sessPresence.studentJoinedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(sessPresence.studentJoinedAt).getTime()) / 60000))
        : Math.max(0, diffMinutes);
      return {
        status: 'CODER_WAITING_FOR_TUTOR',
        code: 'CODER_WAITING_FOR_TUTOR',
        label: `🚨 Coder Waiting for Tutor (${contacts.studentFirstName} waiting for ${contacts.tutorFirstName})`,
        badgeClass: 'bg-rose-100 text-rose-900 border border-rose-400 font-extrabold animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes: waitMins,
        actionRequired: true,
        alertType: 'coder_waiting',
        contactSummary: `${contacts.studentFirstName} is now in class waiting for ${contacts.tutorFirstName}. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}).`,
        whoToContact: `Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`,
        contacts,
        presence: sessPresence
      };
    }

    if (tutorPresent && !studentPresent) {
      const waitMins = sessPresence.tutorJoinedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(sessPresence.tutorJoinedAt).getTime()) / 60000))
        : Math.max(0, diffMinutes);
      const stCode = waitMins >= 7 ? 'STUDENT_ABSENT_ALERT' : 'TUTOR_WAITING_FOR_CODER';
      return {
        status: stCode,
        code: stCode,
        label: `⏳ ${contacts.tutorFirstName} Waiting for ${contacts.studentFirstName}${waitMins > 0 ? ' (' + waitMins + 'm)' : ''}`,
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-400 font-bold animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes: waitMins,
        actionRequired: true,
        alertType: 'parent_nudge',
        contactSummary: `Tutor ${contacts.tutorFirstName} is now in class waiting for ${contacts.studentFirstName}. Please reach out to ${contacts.studentFirstName}'s Parent (${contacts.parentName} · ${contacts.parentPhone}) in order for the class to hold.`,
        whoToContact: `${contacts.studentFirstName}'s Parent (${contacts.parentName} · ${contacts.parentPhone})`,
        contacts,
        presence: sessPresence
      };
    }

    // 3. Neither party has joined yet - evaluate against scheduled clock
    if (diffMinutes < 0) {
      return {
        status: 'UPCOMING',
        code: 'UPCOMING',
        label: `Starts in ${Math.abs(diffMinutes)} mins`,
        badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false,
        contactSummary: `Upcoming class for ${contacts.studentFirstName} with Tutor ${contacts.tutorFirstName} at ${contacts.time}.`,
        whoToContact: `Tutor ${contacts.tutorFirstName}`,
        contacts
      };
    }

    if (now > sessionEnd) {
      if (schedule.attendanceStatus === 'present' || schedule.attendanceStatus === 'done') {
        return {
          status: 'COMPLETED',
          code: 'COMPLETED',
          label: 'Completed',
          badgeClass: 'bg-slate-100 text-slate-700',
          tutorPresent,
          studentPresent,
          diffMinutes,
          actionRequired: false,
          contactSummary: `Session completed.`,
          contacts
        };
      }
      return {
        status: 'ENDED_UNVERIFIED',
        code: 'ENDED_UNVERIFIED',
        label: 'Awaiting Log',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true,
        alertType: 'tutor_alert',
        contactSummary: `Session window ended without live verification. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}).`,
        whoToContact: `Tutor ${contacts.tutorFirstName}`,
        contacts
      };
    }

    // Neither joined during active class window
    if (diffMinutes >= 10) {
      return {
        status: 'CRITICAL_INCIDENT',
        code: 'CRITICAL_INCIDENT',
        label: `🚨 Neither Joined (${diffMinutes}m late)`,
        badgeClass: 'bg-rose-100 text-rose-900 border border-rose-400 font-extrabold animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true,
        alertType: 'ops_intervention',
        contactSummary: `Neither ${contacts.studentFirstName} nor Tutor ${contacts.tutorFirstName} has joined (${diffMinutes}m past start). Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}) and Parent (${contacts.parentPhone}).`,
        whoToContact: `Tutor ${contacts.tutorFirstName} & Parent`,
        contacts
      };
    }
    if (diffMinutes >= 3) {
      return {
        status: 'TUTOR_ABSENT_ALERT',
        code: 'TUTOR_ABSENT_ALERT',
        label: `Tutor Not Joined (${diffMinutes}m late)`,
        badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true,
        alertType: 'tutor_alert',
        contactSummary: `Tutor ${contacts.tutorFirstName} has not joined ${contacts.studentFirstName}'s class (${diffMinutes}m late). Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}).`,
        whoToContact: `Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`,
        contacts
      };
    }

    return {
      status: 'STARTING',
      code: 'STARTING',
      label: `Starting (${diffMinutes}m in)`,
      badgeClass: 'bg-slate-100 text-slate-800',
      tutorPresent,
      studentPresent,
      diffMinutes,
      actionRequired: false,
      contactSummary: `Awaiting ${contacts.studentFirstName} and Tutor ${contacts.tutorFirstName} to join.`,
      whoToContact: `Tutor ${contacts.tutorFirstName}`,
      contacts
    };
  }

  /**
   * Heartbeat tracker called on 1-click Join Class or background heartbeat.
   * Immediately notifies Admin via ntfy when either party joins, and evaluates
   * partner presence / T+3m to T+5m non-join or late-join states.
   */
  function recordHeartbeat(sessionId, scheduleId, role, name, extra = {}) {
    const store = getLivePresenceStore();
    const primaryKey = scheduleId || sessionId || 'live-session';
    const entry = store[primaryKey] || store[sessionId] || {};
    const nowIso = new Date().toISOString();
    const cleanRole = String(role || 'student').toLowerCase().trim();
    const isTutor = cleanRole === 'tutor';

    entry.sessionId = sessionId || primaryKey;
    entry.scheduleId = scheduleId || primaryKey;
    entry.lastHeartbeat = Date.now();
    entry.status = 'active';
    if (extra.courseName) entry.courseName = extra.courseName;
    if (extra.studentName) entry.studentName = extra.studentName;
    if (extra.tutorName) entry.tutorName = extra.tutorName;
    if (extra.meetingUrl) entry.meetingUrl = extra.meetingUrl;

    if (isTutor) {
      entry.tutorJoinedAt = entry.tutorJoinedAt || nowIso;
      entry.tutorName = name || entry.tutorName || 'Tutor';
      entry.tutorPresent = true;
    } else {
      entry.studentJoinedAt = entry.studentJoinedAt || nowIso;
      entry.studentName = name || entry.studentName || 'Student';
      entry.studentPresent = true;
    }

    const contacts = resolveSessionContacts({ ...entry, scheduleId: primaryKey, sessionId });
    entry.studentName = contacts.studentName || entry.studentName;
    entry.tutorName = contacts.tutorName || entry.tutorName;
    entry.tutorEmail = contacts.tutorEmail || entry.tutorEmail;
    entry.tutorPhone = contacts.tutorPhone || entry.tutorPhone;
    entry.parentName = contacts.parentName || entry.parentName;
    entry.parentPhone = contacts.parentPhone || entry.parentPhone;
    entry.parentEmail = contacts.parentEmail || entry.parentEmail;
    entry.courseName = contacts.courseName || entry.courseName;
    entry.meetingUrl = contacts.meetingUrl || entry.meetingUrl;
    entry.date = contacts.date || entry.date;
    entry.time = contacts.time || entry.time;
    entry.classDate = entry.date;

    store[primaryKey] = entry;
    if (sessionId && sessionId !== primaryKey) store[sessionId] = entry;
    saveLivePresenceStore(store, primaryKey);

    const waitMins = entry.studentJoinedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(entry.studentJoinedAt).getTime()) / 60000))
      : 0;
    const tutorWaitMins = entry.tutorJoinedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(entry.tutorJoinedAt).getTime()) / 60000))
      : 0;
    const isTestMode = !!(extra && extra.isTest) || (typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('test=1'));

    // 1. Immediate ntfy push notification to Admin when Tutor or Student joins
    if (!isTestMode && isTutor && !entry.alertedTutorJoined) {
      entry.alertedTutorJoined = true;
      store[primaryKey] = entry;
      saveLivePresenceStore(store, primaryKey);

      dispatchUrgentAlert({
        title: `✅ Tutor Joined: ${contacts.tutorFirstName} -> ${contacts.studentFirstName}`,
        message: `Coach ${contacts.tutorName} has joined the Google Meet classroom for ${contacts.studentName} (${contacts.courseName}).`,
        priority: '3',
        tags: 'white_check_mark,video_camera',
        actionUrl: contacts.meetingUrl || 'https://stemuluskidstech.com/admin-dashboard.html',
        contactActionLabel: '✅ Tutor in Classroom'
      });
    } else if (!isTestMode && !isTutor && !entry.alertedStudentJoined) {
      entry.alertedStudentJoined = true;
      store[primaryKey] = entry;
      saveLivePresenceStore(store, primaryKey);

      dispatchUrgentAlert({
        title: `✅ Coder Joined: ${contacts.studentFirstName} -> ${contacts.courseName}`,
        message: `${contacts.studentName} has joined the Google Meet classroom for ${contacts.courseName} with Coach ${contacts.tutorName}.`,
        priority: '3',
        tags: 'white_check_mark,student',
        actionUrl: contacts.meetingUrl || 'https://stemuluskidstech.com/admin-dashboard.html',
        contactActionLabel: '✅ Coder in Classroom'
      });
    }

    // 2. Check if the joining party arrived >= 3 minutes (T+3m to T+5m+) after the scheduled start time
    if (!isTestMode && contacts.time && contacts.time !== 'Scheduled Time') {
      const schedDate = (contacts.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const { hh, mm } = parseTimeComponents(contacts.time);
      const scheduledStart = new Date(`${schedDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
      const joinTimestamp = isTutor ? (entry.tutorJoinedAt ? new Date(entry.tutorJoinedAt) : new Date()) : (entry.studentJoinedAt ? new Date(entry.studentJoinedAt) : new Date());
      const lateJoinMins = !isNaN(scheduledStart.getTime())
        ? Math.floor((joinTimestamp.getTime() - scheduledStart.getTime()) / 60000)
        : 0;

      if (lateJoinMins >= 3 && lateJoinMins <= 120) {
        if (isTutor && !entry.queuedTutorLateEmail) {
          entry.queuedTutorLateEmail = true;
          store[primaryKey] = entry;
          saveLivePresenceStore(store, primaryKey);
          queueLateJoinNotificationEmail({
            scheduleId: primaryKey,
            lateRole: 'tutor',
            lateMinutes: lateJoinMins,
            contacts,
            joinedLate: true
          });
        } else if (!isTutor && !entry.queuedStudentLateEmail) {
          entry.queuedStudentLateEmail = true;
          store[primaryKey] = entry;
          saveLivePresenceStore(store, primaryKey);
          queueLateJoinNotificationEmail({
            scheduleId: primaryKey,
            lateRole: 'parent',
            lateMinutes: lateJoinMins,
            contacts,
            joinedLate: true
          });
        }
      }
    }

    // 3. Evaluate partner non-join / waiting (>= 3 mins) or both in room
    if (!isTestMode && entry.studentPresent && !entry.tutorPresent && !entry.alertedCoderWaiting && waitMins >= 3) {
      entry.alertedCoderWaiting = true;
      store[primaryKey] = entry;
      saveLivePresenceStore(store, primaryKey);

      queueLateJoinNotificationEmail({
        scheduleId: primaryKey,
        lateRole: 'tutor',
        lateMinutes: waitMins,
        contacts,
        joinedLate: false
      });

      const alertTitle = `🚨 Coder Waiting: ${contacts.studentFirstName} waiting for ${contacts.tutorFirstName}`;
      const alertMsg = `${contacts.studentFirstName} is now in class waiting for ${contacts.tutorFirstName}. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}) in order for the class to hold.`;
      const tutorWaUrl = generateTutorAlertUrl({ ...entry, id: primaryKey });

      dispatchUrgentAlert({
        title: alertTitle,
        message: alertMsg,
        priority: '5',
        tags: 'rotating_light,bell,student',
        actionUrl: tutorWaUrl,
        contactActionLabel: `💬 Reach Out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`,
        whoToContact: `Tutor ${contacts.tutorFirstName}`
      });

      if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.addNotification === 'function') {
        DashboardEngine.addNotification({
          userEmail: 'admin@stemuluskidstech.com',
          role: 'admin',
          title: alertTitle,
          message: alertMsg,
          actionUrl: tutorWaUrl,
          timestamp: nowIso,
          read: false
        });
      }
    } else if (!isTestMode && entry.tutorPresent && !entry.studentPresent && !entry.alertedTutorWaiting && tutorWaitMins >= 3) {
      entry.alertedTutorWaiting = true;
      store[primaryKey] = entry;
      saveLivePresenceStore(store, primaryKey);

      queueLateJoinNotificationEmail({
        scheduleId: primaryKey,
        lateRole: 'parent',
        lateMinutes: tutorWaitMins,
        contacts,
        joinedLate: false
      });

      const alertTitle = `⏳ Tutor Waiting: ${contacts.tutorFirstName} waiting for ${contacts.studentFirstName}`;
      const alertMsg = `Tutor ${contacts.tutorFirstName} is now in class waiting for ${contacts.studentFirstName}. Please reach out to ${contacts.parentName} (${contacts.parentPhone}) in order for the class to hold.`;
      const parentWaUrl = generateParentNudgeUrl({ ...entry, id: primaryKey });

      dispatchUrgentAlert({
        title: alertTitle,
        message: alertMsg,
        priority: '4',
        tags: 'hourglass_flowing_sand,telephone_receiver',
        actionUrl: parentWaUrl,
        contactActionLabel: `💬 Reach Out to ${contacts.studentFirstName}'s Parent (${contacts.parentPhone})`,
        whoToContact: `Parent ${contacts.parentName}`
      });

      if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.addNotification === 'function') {
        DashboardEngine.addNotification({
          userEmail: 'admin@stemuluskidstech.com',
          role: 'admin',
          title: alertTitle,
          message: alertMsg,
          actionUrl: parentWaUrl,
          timestamp: nowIso,
          read: false
        });
      }
    } else if (entry.studentPresent && entry.tutorPresent && !entry.alertedBothJoined) {
      entry.alertedBothJoined = true;
      store[primaryKey] = entry;
      saveLivePresenceStore(store, primaryKey);

      const alertTitle = `✅ Class Active: ${contacts.studentFirstName} & Tutor ${contacts.tutorFirstName}`;
      const alertMsg = `Both ${contacts.studentName} and Tutor ${contacts.tutorName} have joined "${contacts.courseName}". The session is now holding live!`;

      dispatchUrgentAlert({
        title: alertTitle,
        message: alertMsg,
        priority: '3',
        tags: 'white_check_mark,rocket',
        actionUrl: 'https://stemuluskidstech.com/admin-dashboard.html',
        contactActionLabel: '✅ Session Active in Classroom'
      });
    }

    return entry;
  }

  /**
   * Called when a party abruptly closes window, navigates away, or disconnects.
   */
  function recordDisconnect(sessionId, scheduleId, role, name, courseName) {
    const store = getLivePresenceStore();
    const key = sessionId || scheduleId;
    const entry = store[key] || {};

    entry.status = 'disconnected';
    entry.disconnectedParty = name || (role === 'tutor' ? 'Tutor' : 'Student');
    entry.disconnectedRole = role;
    entry.disconnectedAt = new Date().toISOString();

    // Track dropout history telemetry
    entry.dropoutHistory = entry.dropoutHistory || [];
    entry.dropoutHistory.push({
      role,
      name: entry.disconnectedParty,
      disconnectedAt: entry.disconnectedAt,
      reconnectedAt: null,
      durationSeconds: null
    });
    entry.dropoutCount = (entry.dropoutCount || 0) + 1;

    store[key] = entry;
    if (scheduleId && scheduleId !== key) store[scheduleId] = entry;
    saveLivePresenceStore(store);

    // Save active rejoin prompt so any open or subsequent dashboard shows the prompt
    try {
      const prompts = JSON.parse(localStorage.getItem('stemulus_active_rejoin_prompts') || '{}');
      prompts[key] = {
        sessionId: sessionId || key,
        scheduleId: scheduleId || key,
        courseName: courseName || 'Live Coding Track',
        disconnectedParty: entry.disconnectedParty,
        disconnectedRole: role,
        disconnectedAt: entry.disconnectedAt,
        tutorName: entry.tutorName || (role === 'tutor' ? entry.disconnectedParty : 'Coach'),
        studentName: entry.studentName || (role === 'student' ? entry.disconnectedParty : 'Student'),
        joinUrl: entry.meetingUrl || entry.meetLink || 'https://meet.google.com/stm-prog-live'
      };
      localStorage.setItem('stemulus_active_rejoin_prompts', JSON.stringify(prompts));
    } catch (e) {}

    // Trigger local laptop notification to dropped user if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 Class in Progress: ${courseName || 'Coding Session'}`, {
          body: `You disconnected from your live class. Click here to rejoin now and finish your session!`,
          icon: 'favicon.png',
          tag: 'stemulus-rejoin-alert'
        });
      } catch (e) {}
    }

    const roleStr = typeof role === 'string' ? role : 'student';
    const title = `🚨 MID-SESSION DISCONNECT: ${entry.disconnectedParty}`;
    const message = `${entry.disconnectedParty} (${roleStr.toUpperCase()}) just abruptly left/disconnected from "${courseName || 'Live Coding Track'}". Check classroom immediately!`;
    const alertPayload = {
      title,
      message,
      priority: '5',
      tags: 'warning,rotating_light,exclamation',
      actionUrl: `https://stemuluskidstech.com/admin-dashboard.html?tab=radar`
    };
    dispatchUrgentAlert(alertPayload);
    return { type: 'dropout', title, message, entry };
  }

  /**
   * Called when a previously disconnected party rejoins the session.
   */
  function recordReconnect(sessionId, scheduleId, role, name, courseName) {
    const store = getLivePresenceStore();
    const key = sessionId || scheduleId;
    const entry = store[key] || {};

    const priorDisconnect = entry.status === 'disconnected';
    let durationSec = 0;
    if (entry.disconnectedAt) {
      durationSec = Math.max(1, Math.round((Date.now() - new Date(entry.disconnectedAt).getTime()) / 1000));
    }

    // Update dropout history with reconnect timestamp and duration
    if (entry.dropoutHistory && entry.dropoutHistory.length > 0) {
      const lastDropout = entry.dropoutHistory[entry.dropoutHistory.length - 1];
      if (!lastDropout.reconnectedAt) {
        lastDropout.reconnectedAt = new Date().toISOString();
        lastDropout.durationSeconds = durationSec;
      }
    }

    entry.status = 'reconnected';
    entry.reconnectedParty = name || (role === 'tutor' ? 'Tutor' : 'Student');
    entry.reconnectedAt = new Date().toISOString();
    entry.lastHeartbeat = Date.now();

    store[key] = entry;
    if (scheduleId && scheduleId !== key) store[scheduleId] = entry;
    saveLivePresenceStore(store);

    // Clear active rejoin prompt
    try {
      const prompts = JSON.parse(localStorage.getItem('stemulus_active_rejoin_prompts') || '{}');
      delete prompts[key];
      if (scheduleId) delete prompts[scheduleId];
      localStorage.setItem('stemulus_active_rejoin_prompts', JSON.stringify(prompts));
    } catch (e) {}

    const roleStr = typeof role === 'string' ? role : 'student';
    if (priorDisconnect) {
      const durStr = durationSec >= 60 ? `${(durationSec / 60).toFixed(1)} mins` : `${durationSec} secs`;
      const title = `✅ RECONNECTED: ${entry.reconnectedParty}`;
      const message = `${entry.reconnectedParty} (${roleStr.toUpperCase()}) has re-entered "${courseName || 'Live Coding Track'}" after ${durStr}. Session resumed!`;
      dispatchUrgentAlert({
        title,
        message,
        priority: '3',
        tags: 'white_check_mark,bell',
        actionUrl: `https://stemuluskidstech.com/admin-dashboard.html?tab=radar`
      });
      return { type: 'reconnect', title, message, durationSeconds: durationSec, entry };
    }
    return { type: 'reconnect', title: 'Active', message: 'Session resumed', durationSeconds: 0, entry };
  }

  /**
   * Auto-logs verified attendance with dropout analytics into system
   * while pre-filling the Tutor's pedagogical session log.
   */
  function autoLogSessionAttendance(sessionId, scheduleId, extraData = {}) {
    if (typeof sessionId === 'object' && sessionId !== null) {
      extraData = sessionId;
      sessionId = extraData.sessionId || extraData.scheduleId;
      scheduleId = extraData.scheduleId || sessionId;
    }
    const store = getLivePresenceStore();
    const key = sessionId || scheduleId;
    const entry = store[key] || {};
    const now = new Date();

    const joinedAt = extraData.startTime || entry.studentJoinedAt || entry.tutorJoinedAt || now.toISOString();
    const startTimeMs = new Date(joinedAt).getTime();
    const endTimeMs = extraData.endTime ? new Date(extraData.endTime).getTime() : now.getTime();
    const totalMinutes = Math.max(1, Math.round((endTimeMs - startTimeMs) / 60000));
    const dropouts = typeof extraData.dropoutCount === 'number' ? extraData.dropoutCount : (entry.dropoutCount || 0);

    let attendanceStatus = extraData.attendanceStatus || 'present';
    if (!extraData.attendanceStatus && dropouts > 0 && totalMinutes < 30) {
      attendanceStatus = 'partial';
    }

    const autoRecord = {
      id: 'att-auto-' + Date.now(),
      sessionId: key,
      scheduleId: scheduleId || key,
      studentName: extraData.studentName || entry.studentName || 'Coder',
      tutorName: extraData.tutorName || entry.tutorName || 'Faculty Mentor',
      courseName: extraData.courseName || entry.courseName || 'Coding Track',
      classDate: now.toISOString().slice(0, 10),
      classTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: totalMinutes,
      activeDurationMins: totalMinutes,
      dropoutCount: dropouts,
      dropoutHistory: entry.dropoutHistory || [],
      attendanceStatus: attendanceStatus,
      autoLogged: true,
      verifiedTelemetry: true,
      tutorLogStatus: 'PENDING_TUTOR_LOG',
      createdAt: now.toISOString()
    };

    // Save to attendance records in storage
    try {
      const existing = JSON.parse(localStorage.getItem('stemulus_attendance_records') || '[]');
      existing.unshift(autoRecord);
      localStorage.setItem('stemulus_attendance_records', JSON.stringify(existing.slice(0, 100)));

      // Pre-fill tutor's log for tutor-attendance-create.html
      localStorage.setItem('stemulus_prefilled_tutor_log', JSON.stringify({
        scheduleId: autoRecord.scheduleId,
        studentName: autoRecord.studentName,
        courseName: autoRecord.courseName,
        classDate: autoRecord.classDate,
        classTime: autoRecord.classTime,
        duration: autoRecord.duration,
        dropoutCount: autoRecord.dropoutCount,
        dropoutNotes: autoRecord.dropoutCount > 0 ? `Student had ${autoRecord.dropoutCount} brief reconnection(s) during class.` : 'Full continuous connection maintained.',
        verifiedTelemetry: true,
        autoLoggedId: autoRecord.id
      }));
    } catch(e) {}

    console.log(`[EscalationEngine] 📋 Auto-Attendance logged for ${autoRecord.studentName} (${autoRecord.duration} mins, ${autoRecord.attendanceStatus})`);
    return autoRecord;
  }

  /**
   * Watchdog scanner: checks active sessions, waiting participants, late joins (>5m), and missing heartbeats.
   */
  function runWatchdog() {
    if (typeof DashboardEngine === 'undefined') return;
    syncRemotePresenceFromFirestore();
    const db = DashboardEngine.getDB();
    const schedules = db.schedules || [];
    const presenceStore = getLivePresenceStore();
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();

    // Evaluate today's schedules + any schedule with active live presence
    const activeIds = new Set();
    const targetSchedules = [];

    schedules.forEach(s => {
      if (s && (s.date === todayStr || presenceStore[s.id])) {
        activeIds.add(s.id);
        targetSchedules.push(s);
      }
    });

    Object.keys(presenceStore).forEach(k => {
      const p = presenceStore[k];
      if (p && !activeIds.has(k) && p.lastHeartbeat && (now - p.lastHeartbeat < 7200000)) {
        activeIds.add(k);
        targetSchedules.push({
          id: k,
          date: todayStr,
          time: new Date(p.lastHeartbeat).toTimeString().slice(0, 5),
          studentName: p.studentName || 'Student',
          mentor: p.tutorName || 'Assigned Tutor',
          course: p.courseName || 'Coding Session',
          link: p.meetingUrl || ''
        });
      }
    });

    targetSchedules.forEach(s => {
      const state = evaluateSessionState(s, presenceStore[s.id]);
      const contacts = state.contacts || resolveSessionContacts(s);
      const sessionKey = `${s.id}_${state.status}`;

      // Check Heartbeat staleness for active sessions (>90s without ping)
      const pres = presenceStore[s.id];
      if (pres && pres.status === 'active' && pres.lastHeartbeat && (now - pres.lastHeartbeat > 90000)) {
        recordDisconnect(pres.sessionId, s.id, 'participant', contacts.studentName, contacts.courseName);
      }

      // Escalations
      if (state.actionRequired && !alertedIncidents.has(sessionKey)) {
        if (state.status === 'CODER_WAITING_FOR_TUTOR') {
          alertedIncidents.add(sessionKey);
          queueLateJoinNotificationEmail({
            scheduleId: s.id,
            lateRole: 'tutor',
            lateMinutes: state.diffMinutes || 3,
            contacts,
            joinedLate: false
          });
          if (!pres || !pres.alertedCoderWaiting) {
            dispatchUrgentAlert({
              title: `🚨 Coder Waiting: ${contacts.studentFirstName} waiting for ${contacts.tutorFirstName}`,
              message: `${contacts.studentFirstName} is now in class waiting for ${contacts.tutorFirstName}. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}) in order for the class to hold.`,
              priority: '5',
              tags: 'rotating_light,bell,student',
              actionUrl: generateTutorAlertUrl(s),
              contactActionLabel: `💬 Reach Out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`,
              whoToContact: `Tutor ${contacts.tutorFirstName}`
            });
          }
        } else if (state.status === 'TUTOR_WAITING_FOR_CODER' || state.status === 'STUDENT_ABSENT_ALERT') {
          alertedIncidents.add(sessionKey);
          queueLateJoinNotificationEmail({
            scheduleId: s.id,
            lateRole: 'parent',
            lateMinutes: state.diffMinutes || 3,
            contacts,
            joinedLate: false
          });
          if (!pres || !pres.alertedTutorWaiting) {
            dispatchUrgentAlert({
              title: `⏳ Tutor Waiting: ${contacts.tutorFirstName} waiting for ${contacts.studentFirstName}`,
              message: `Tutor ${contacts.tutorFirstName} is now in class waiting for ${contacts.studentFirstName}. Please reach out to ${contacts.parentName} (${contacts.parentPhone}) in order for the class to hold.`,
              priority: '4',
              tags: 'hourglass_flowing_sand,telephone_receiver',
              actionUrl: generateParentNudgeUrl(s),
              contactActionLabel: `💬 Reach Out to ${contacts.studentFirstName}'s Parent (${contacts.parentPhone})`,
              whoToContact: `Parent ${contacts.parentName}`
            });
          }
        } else if (state.status === 'TUTOR_ABSENT_ALERT') {
          alertedIncidents.add(sessionKey);
          queueLateJoinNotificationEmail({
            scheduleId: s.id,
            lateRole: 'tutor',
            lateMinutes: state.diffMinutes || 5,
            contacts,
            joinedLate: false
          });
          dispatchUrgentAlert({
            title: `🚨 LATE JOIN: Tutor ${contacts.tutorFirstName} Not in Room (+${state.diffMinutes}m)`,
            message: `Tutor ${contacts.tutorName} has not joined session "${contacts.courseName}" with ${contacts.studentName} scheduled for ${s.time}. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})!`,
            priority: '5',
            tags: 'alarm_clock,warning',
            actionUrl: generateTutorAlertUrl(s),
            contactActionLabel: `💬 Reach Out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone})`,
            whoToContact: `Tutor ${contacts.tutorFirstName}`
          });
        } else if (state.status === 'CRITICAL_INCIDENT') {
          alertedIncidents.add(sessionKey);
          queueLateJoinNotificationEmail({
            scheduleId: s.id,
            lateRole: 'tutor',
            lateMinutes: state.diffMinutes || 10,
            contacts,
            joinedLate: false
          });
          issueMakeupToken(s, 'Tutor Unavailability (>10m late)');
          dispatchUrgentAlert({
            title: `🚨 CRITICAL INCIDENT: Tutor ${contacts.tutorFirstName} Absent (+${state.diffMinutes}m)`,
            message: `Tutor ${contacts.tutorName} is 10+ minutes late for ${contacts.studentName}. Please reach out to Tutor ${contacts.tutorFirstName} (${contacts.tutorPhone}) and Parent (${contacts.parentPhone}). Automated makeup token generated!`,
            priority: '5',
            tags: 'fire,emergency',
            actionUrl: generateTutorAlertUrl(s),
            contactActionLabel: `💬 Reach Out to Tutor ${contacts.tutorFirstName}`
          });
        }
      }
    });
  }

  function startWatchdog(intervalMs = 15000) {
    if (watchdogTimer) clearInterval(watchdogTimer);
    runWatchdog();
    watchdogTimer = setInterval(runWatchdog, intervalMs);
    console.log('[EscalationEngine] Watchdog active (interval: 15s).');
  }

  function stopWatchdog() {
    if (watchdogTimer) clearInterval(watchdogTimer);
    watchdogTimer = null;
  }

  /**
   * Scan today's schedules + any live presence sessions and return live radar data.
   */
  function getLiveRadarHUD() {
    if (typeof DashboardEngine === 'undefined') return [];
    const db = DashboardEngine.getDB();
    const schedules = db.schedules || [];
    const presenceStore = getLivePresenceStore();
    const now = Date.now();

    const todayStr = new Date().toISOString().slice(0, 10);
    const seenIds = new Set();
    const radarSchedules = [];

    schedules.forEach(s => {
      if (!s) return;
      const hasRecentPresence = presenceStore[s.id] && presenceStore[s.id].lastHeartbeat && (now - presenceStore[s.id].lastHeartbeat < 14400000);
      if (s.date === todayStr || hasRecentPresence) {
        seenIds.add(s.id);
        radarSchedules.push(s);
      }
    });

    Object.keys(presenceStore).forEach(k => {
      const p = presenceStore[k];
      if (p && !seenIds.has(k) && !seenIds.has(p.scheduleId) && p.lastHeartbeat && (now - p.lastHeartbeat < 14400000)) {
        seenIds.add(k);
        const contacts = resolveSessionContacts(p);
        radarSchedules.push({
          id: k,
          date: todayStr,
          time: contacts.time || new Date(p.lastHeartbeat).toTimeString().slice(0, 5),
          studentName: contacts.studentName,
          mentor: contacts.tutorName,
          tutorName: contacts.tutorName,
          tutorPhone: contacts.tutorPhone,
          parentPhone: contacts.parentPhone,
          course: contacts.courseName,
          link: contacts.meetingUrl
        });
      }
    });

    return radarSchedules.map(s => {
      const pres = presenceStore[s.id] || presenceStore[s.sessionId] || {};
      const state = evaluateSessionState(s, pres);
      const contacts = state.contacts || resolveSessionContacts({ ...s, ...pres });
      return {
        schedule: {
          ...s,
          studentName: contacts.studentName,
          mentor: contacts.tutorName,
          tutorName: contacts.tutorName,
          tutorPhone: contacts.tutorPhone,
          parentName: contacts.parentName,
          parentPhone: contacts.parentPhone,
          course: contacts.courseName,
          link: contacts.meetingUrl
        },
        contacts,
        presence: pres,
        state: state
      };
    }).sort((a, b) => {
      // Prioritize active/alert states at the top of the radar
      const score = (st) => {
        if (st.status === 'CODER_WAITING_FOR_TUTOR' || st.status === 'DISCONNECTED') return 0;
        if (st.status === 'TUTOR_WAITING_FOR_CODER' || st.status === 'STUDENT_ABSENT_ALERT' || st.status === 'TUTOR_ABSENT_ALERT') return 1;
        if (st.status === 'IN_SESSION') return 2;
        return 3;
      };
      const diff = score(a.state) - score(b.state);
      if (diff !== 0) return diff;
      return (a.schedule.time || '').localeCompare(b.schedule.time || '');
    });
  }

  function generateParentNudgeUrl(schedule) {
    const contacts = resolveSessionContacts(schedule || {});
    const rawPhone = (contacts.parentPhone || ADMIN_WHATSAPP).replace(/[^0-9]/g, '');
    const targetPhone = rawPhone.startsWith('0') ? '234' + rawPhone.slice(1) : (rawPhone || ADMIN_WHATSAPP);
    const joinUrl = contacts.meetingUrl || 'https://meet.google.com/stm-prog-live';

    const text = `👋 Hello ${contacts.parentName}! Tutor ${contacts.tutorFirstName} is now in the STEMulus virtual classroom waiting for ${contacts.studentFirstName}. Please click here for ${contacts.studentFirstName} to join class now: ${joinUrl}`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  }

  function generateTutorAlertUrl(schedule) {
    const contacts = resolveSessionContacts(schedule || {});
    const rawPhone = (contacts.tutorPhone || ADMIN_WHATSAPP).replace(/[^0-9]/g, '');
    const targetPhone = rawPhone.startsWith('0') ? '234' + rawPhone.slice(1) : (rawPhone || ADMIN_WHATSAPP);
    const joinUrl = contacts.meetingUrl || 'https://meet.google.com/stm-prog-live';

    const text = `🚨 URGENT: ${contacts.studentFirstName} (${contacts.studentName}) is now in class waiting for you (${contacts.tutorFirstName})! Please join the classroom immediately so the class can hold: ${joinUrl}`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  }

  function issueMakeupToken(schedule, reason = 'Tutor Absence') {
    const tokens = getMakeupTokens();
    const token = {
      id: 'mkt-' + Date.now(),
      scheduleId: schedule.id,
      studentId: schedule.studentId,
      studentName: schedule.studentName,
      parentEmail: schedule.parentEmail,
      course: schedule.course,
      reason: reason,
      issuedAt: new Date().toISOString(),
      status: 'available',
      tokenCode: 'MAKEUP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    };

    tokens.push(token);
    try {
      localStorage.setItem(MAKEUP_TOKENS_KEY, JSON.stringify(tokens));
    } catch (e) {}

    if (typeof DashboardEngine !== 'undefined' && schedule.parentEmail) {
      DashboardEngine.addNotification({
        userEmail: schedule.parentEmail.toLowerCase(),
        title: 'Complimentary Makeup Class Token Issued',
        message: `We apologize for the delay during ${schedule.studentName}'s session today. A complimentary 1-click makeup class token (${token.tokenCode}) has been credited to your account.`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    return token;
  }

  return {
    evaluateSessionState,
    resolveSessionContacts,
    queueLateJoinNotificationEmail,
    getLivePresenceStore,
    getLiveRadarHUD,
    recordHeartbeat,
    recordDisconnect,
    recordReconnect,
    autoLogSessionAttendance,
    dispatchUrgentAlert,
    playAudioSiren,
    mountAdminLiveEscalationBanner,
    startWatchdog,
    stopWatchdog,
    runWatchdog,
    generateParentNudgeUrl,
    generateTutorAlertUrl,
    issueMakeupToken,
    getIncidents,
    getMakeupTokens,
    setMuted: (val) => { isMuted = !!val; }
  };
})();

if (typeof window !== 'undefined') {
  window.ClassEscalationEngine = ClassEscalationEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassEscalationEngine;
}
