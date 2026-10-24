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
  const NTFY_TOPIC = 'stemulus-admin-escalations-2026';
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

  function saveLivePresenceStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {}
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

  // Web Audio Alarm Synthesizer
  function playAudioSiren(type = 'urgent') {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

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
  async function dispatchUrgentAlert({ title, message, priority = '5', tags = 'warning,loudspeaker', actionUrl = '' }) {
    console.warn(`[EscalationEngine] 🚨 URGENT DISPATCH: [${title}] ${message}`);

    // 1. Play audio alarm
    const alarmType = (priority === '5' || priority === 'urgent') ? 'urgent' : (tags.includes('check') ? 'reconnect' : 'warning');
    playAudioSiren(alarmType);

    // 2. Dispatch to ntfy.sh (Urgent push channel, bypasses DND)
    try {
      const asciiTitle = (title || 'STEMulus Escalation').replace(/[^\x20-\x7E]/g, '').trim() || 'STEMulus Escalation';
      const asciiTags = (tags || 'warning').replace(/[^\x20-\x7E]/g, '').trim();
      fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': asciiTitle,
          'Priority': String(priority),
          'Tags': asciiTags,
          'Click': actionUrl || 'https://stemuluskidstech.com/admin-dashboard.html'
        },
        body: message
      }).catch(err => console.warn('[EscalationEngine] ntfy push dispatch notice:', err.message));
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
   * Mount floating sticky emergency banner on Admin Dashboard.
   */
  function mountAdminLiveEscalationBanner(incident) {
    if (typeof document === 'undefined') return;
    let banner = document.getElementById('stemulus-urgent-escalation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'stemulus-urgent-escalation-banner';
      banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl bg-gradient-to-r from-rose-950/95 via-rose-900/95 to-red-950/95 border-2 border-rose-500 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-bounce-once transition-all flex items-start gap-4';
      document.body.appendChild(banner);
    }

    const isReconnect = (incident.tags || '').includes('check') || (incident.priority === '3');
    const borderClass = isReconnect ? 'border-emerald-500 from-emerald-950/95 to-slate-900/95' : 'border-rose-500 from-rose-950/95 to-red-950/95';
    banner.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl bg-gradient-to-r ${borderClass} border-2 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-xl transition-all flex items-start gap-4`;

    const icon = isReconnect ? '✅' : '🚨';
    const waLink = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`[STEMulus Urgent Escalation] ${incident.title}: ${incident.message}`)}`;

    banner.innerHTML = `
      <div class="text-3xl flex-shrink-0 animate-pulse">${icon}</div>
      <div class="flex-grow min-w-0">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h4 class="font-black text-sm uppercase tracking-wider text-rose-300 ${isReconnect ? 'text-emerald-300' : ''}">${incident.title}</h4>
          <span class="text-[10px] text-slate-400 font-mono">${new Date().toLocaleTimeString()}</span>
        </div>
        <p class="text-xs text-slate-200 leading-relaxed mb-3">${incident.message}</p>
        <div class="flex items-center gap-2">
          <a href="${waLink}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md">
            <span>💬 WhatsApp Admin</span>
          </a>
          <button id="btn-dismiss-escalation-banner" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-all">
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
    if (!schedule || !schedule.date || !schedule.time) {
      return { status: 'INVALID', label: 'Incomplete Schedule', badgeClass: 'bg-slate-100 text-slate-500' };
    }

    const sessPresence = presence || getLivePresenceStore()[schedule.id] || {};
    const tutorPresent = !!sessPresence.tutorJoinedAt;
    const studentPresent = !!sessPresence.studentJoinedAt;
    const isDisconnected = sessPresence.status === 'disconnected';
    const isReconnected = sessPresence.status === 'reconnected';

    // Parse session date & time
    const schedDate = schedule.date.slice(0, 10);
    const { hh, mm } = parseTimeComponents(schedule.time);
    const sessionStart = new Date(`${schedDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    const now = new Date();
    const durationMinutes = parseInt(schedule.duration, 10) || 60;
    const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);

    const diffMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / 60000);

    // Mid-session Disconnect state
    if (isDisconnected && now <= sessionEnd && diffMinutes >= 0) {
      return {
        status: 'DISCONNECTED',
        label: `🚨 Disconnected (${sessPresence.disconnectedParty || 'Participant'})`,
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500 font-black animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true,
        alertType: 'disconnect_alert',
        presence: sessPresence
      };
    }

    // Before start time
    if (diffMinutes < 0) {
      return {
        status: 'UPCOMING',
        label: `Starts in ${Math.abs(diffMinutes)} mins`,
        badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false
      };
    }

    // After session finished
    if (now > sessionEnd) {
      if (schedule.attendanceStatus === 'present' || (tutorPresent && studentPresent)) {
        return {
          status: 'COMPLETED',
          label: 'Completed',
          badgeClass: 'bg-slate-100 text-slate-700',
          tutorPresent,
          studentPresent,
          diffMinutes,
          actionRequired: false
        };
      }
      return {
        status: 'ENDED_UNVERIFIED',
        label: 'Awaiting Log',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: true
      };
    }

    // Active session window (between start and end)
    if (tutorPresent && studentPresent) {
      const label = isReconnected ? 'Active • Reconnected' : 'Active • Both in Room';
      return {
        status: 'IN_SESSION',
        label: label,
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false
      };
    }

    if (tutorPresent && !studentPresent) {
      if (diffMinutes >= 7) {
        return {
          status: 'STUDENT_ABSENT_ALERT',
          label: `Coder Missing (${diffMinutes}m late)`,
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
          tutorPresent,
          studentPresent,
          diffMinutes,
          actionRequired: true,
          alertType: 'parent_nudge'
        };
      }
      return {
        status: 'TUTOR_WAITING',
        label: `Tutor Waiting (${diffMinutes}m)`,
        badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false
      };
    }

    if (!tutorPresent) {
      if (diffMinutes >= 10) {
        return {
          status: 'CRITICAL_INCIDENT',
          label: `🚨 Tutor Absent (${diffMinutes}m late)`,
          badgeClass: 'bg-rose-100 text-rose-900 border border-rose-400 font-extrabold animate-pulse',
          tutorPresent,
          studentPresent,
          diffMinutes,
          actionRequired: true,
          alertType: 'ops_intervention'
        };
      }
      if (diffMinutes >= 5) {
        return {
          status: 'TUTOR_ABSENT_ALERT',
          label: `Tutor Not Joined (${diffMinutes}m late)`,
          badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold',
          tutorPresent,
          studentPresent,
          diffMinutes,
          actionRequired: true,
          alertType: 'tutor_alert'
        };
      }
      return {
        status: 'STARTING',
        label: `Started (${diffMinutes}m ago)`,
        badgeClass: 'bg-slate-100 text-slate-800',
        tutorPresent,
        studentPresent,
        diffMinutes,
        actionRequired: false
      };
    }

    return {
      status: 'SCHEDULED',
      label: 'Scheduled',
      badgeClass: 'bg-slate-100 text-slate-700',
      tutorPresent,
      studentPresent,
      diffMinutes,
      actionRequired: false
    };
  }

  /**
   * Heartbeat tracker called by join-class.html companion tab.
   */
  function recordHeartbeat(sessionId, scheduleId, role, name) {
    const store = getLivePresenceStore();
    const entry = store[sessionId] || store[scheduleId] || {};
    const nowIso = new Date().toISOString();

    entry.sessionId = sessionId;
    entry.scheduleId = scheduleId;
    entry.lastHeartbeat = Date.now();
    entry.status = 'active';

    if (role === 'tutor') {
      entry.tutorJoinedAt = entry.tutorJoinedAt || nowIso;
      entry.tutorName = name || entry.tutorName || 'Tutor';
      entry.tutorPresent = true;
    } else {
      entry.studentJoinedAt = entry.studentJoinedAt || nowIso;
      entry.studentName = name || entry.studentName || 'Student';
      entry.studentPresent = true;
    }

    store[sessionId] = entry;
    if (scheduleId) store[scheduleId] = entry;
    saveLivePresenceStore(store);
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
        joinUrl: `join-class.html?sessionId=${encodeURIComponent(sessionId || key)}&scheduleId=${encodeURIComponent(scheduleId || key)}`
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
   * Watchdog scanner: checks active sessions, late joins (>5m), and missing heartbeats.
   */
  function runWatchdog() {
    if (typeof DashboardEngine === 'undefined') return;
    const db = DashboardEngine.getDB();
    const schedules = db.schedules || [];
    const presenceStore = getLivePresenceStore();
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();

    schedules.filter(s => s.date === todayStr).forEach(s => {
      const state = evaluateSessionState(s, presenceStore[s.id]);
      const sessionKey = `${s.id}_${state.status}`;

      // Check Heartbeat staleness for active sessions (>45s without ping)
      const pres = presenceStore[s.id];
      if (pres && pres.status === 'active' && pres.lastHeartbeat && (now - pres.lastHeartbeat > 45000)) {
        // Party likely closed tab without clean exit
        recordDisconnect(pres.sessionId, s.id, 'participant', s.studentName, s.course);
      }

      // Late Join Escalations
      if (state.actionRequired && !alertedIncidents.has(sessionKey)) {
        if (state.status === 'TUTOR_ABSENT_ALERT') {
          alertedIncidents.add(sessionKey);
          dispatchUrgentAlert({
            title: `🚨 LATE JOIN: Tutor Not in Room (+${state.diffMinutes}m)`,
            message: `Tutor ${s.mentor || s.tutorName} has not joined session "${s.course}" with ${s.studentName} scheduled for ${s.time}!`,
            priority: '5',
            tags: 'alarm_clock,warning',
            actionUrl: generateTutorAlertUrl(s)
          });
        } else if (state.status === 'STUDENT_ABSENT_ALERT') {
          alertedIncidents.add(sessionKey);
          dispatchUrgentAlert({
            title: `⚠️ LATE JOIN: Coder Missing (+${state.diffMinutes}m)`,
            message: `Coder ${s.studentName} is missing from "${s.course}". Coach ${s.mentor || s.tutorName} is waiting in the room.`,
            priority: '4',
            tags: 'clock,information_source',
            actionUrl: generateParentNudgeUrl(s)
          });
        } else if (state.status === 'CRITICAL_INCIDENT') {
          alertedIncidents.add(sessionKey);
          issueMakeupToken(s, 'Tutor Unavailability (>10m late)');
          dispatchUrgentAlert({
            title: `🚨 CRITICAL INCIDENT: Tutor Absent (+${state.diffMinutes}m)`,
            message: `Tutor ${s.mentor || s.tutorName} is 10+ minutes late for ${s.studentName}. Automated makeup token generated!`,
            priority: '5',
            tags: 'fire,emergency',
            actionUrl: `https://stemuluskidstech.com/admin-dashboard.html`
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
   * Scan today's schedules and return live radar data.
   */
  function getLiveRadarHUD() {
    if (typeof DashboardEngine === 'undefined') return [];
    const db = DashboardEngine.getDB();
    const schedules = db.schedules || [];
    const presenceStore = getLivePresenceStore();

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySchedules = schedules.filter(s => s.date === todayStr);

    return todaySchedules.map(s => {
      const state = evaluateSessionState(s, presenceStore[s.id]);
      return {
        schedule: s,
        presence: presenceStore[s.id] || {},
        state: state
      };
    }).sort((a, b) => (a.schedule.time || '').localeCompare(b.schedule.time || ''));
  }

  function generateParentNudgeUrl(schedule) {
    const parentPhone = (schedule.parentPhone || schedule.phone || ADMIN_WHATSAPP).replace(/[^0-9]/g, '');
    const childName = schedule.studentName || 'your child';
    const tutorName = schedule.mentor || schedule.tutorName || 'Coach';
    const joinUrl = `https://stemuluskidstech.com/join-class.html?id=${schedule.id}&role=student`;

    const text = `👋 Hello! Coach ${tutorName} is waiting in the STEMulus virtual classroom for ${childName}. Click here to hop straight into class: ${joinUrl}`;
    const targetPhone = parentPhone.startsWith('0') ? '234' + parentPhone.slice(1) : parentPhone;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  }

  function generateTutorAlertUrl(schedule) {
    const tutorPhone = (schedule.tutorPhone || ADMIN_WHATSAPP).replace(/[^0-9]/g, '');
    const childName = schedule.studentName || 'student';
    const joinUrl = `https://stemuluskidstech.com/join-class.html?id=${schedule.id}&role=tutor`;

    const text = `⚠️ URGENT: Your scheduled coding class with ${childName} started at ${schedule.time}. Please click to join immediately: ${joinUrl}`;
    const targetPhone = tutorPhone.startsWith('0') ? '234' + tutorPhone.slice(1) : tutorPhone;
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
