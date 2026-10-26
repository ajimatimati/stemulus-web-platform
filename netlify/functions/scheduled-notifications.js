/**
 * STEMulus Scheduled Notifications: Netlify Scheduled Function
 *
 * Runs twice daily via netlify.toml cron:
 *   07:00 WAT (06:00 UTC) - morning run: tutor daily schedule digests + birthday alerts
 *   18:00 WAT (17:00 UTC) - evening run: parent 24-hour session reminders
 *
 * Required Netlify environment variables (same as notify.js):
 *   NTFY_TOKEN
 *   NTFY_TOPIC_ENROLL
 *   NTFY_TOPIC_CONTACT
 *   NTFY_TOPIC_TUTOR
 *   NTFY_TOPIC_BIRTHDAY
 *   FIREBASE_PROJECT_ID: e.g. stemulus-kidstech
 *   FIREBASE_API_KEY: Web API key (for REST access)
 *   RESEND_API_KEY: for sending emails
 *   ADMIN_EMAIL: admin@stemuluskidstech.com
 *   ADMIN_WHATSAPP: 2347052466716
 *
 * Data contract (Firestore collections read by this function):
 *   schedules/{id}  - { studentId, studentName, course, date, time, duration,
 *                       mentor, tutorEmail, tutorBirthday, link,
 *                       parentEmail, parentName, attendanceStatus }
 *   students/{id}   - { firstName, lastName, birthday, parentEmail, parentName,
 *                       tutorName, tutorEmail }
 *   users/{email}   - { role, name, email, birthday }   (tutors have role:'tutor')
 */

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@stemuluskidstech.com';
const ADMIN_WA       = process.env.ADMIN_WHATSAPP || '2347052466716';
const RESEND_KEY     = process.env.RESEND_API_KEY;
const NTFY_TOKEN     = process.env.NTFY_TOKEN;
const FB_PROJECT     = process.env.FIREBASE_PROJECT_ID || 'stemulus-lms';
const FB_API_KEY     = process.env.FIREBASE_API_KEY;
const FROM_ADDRESS   = 'STEMulus Kids Tech <hello@portal.stemuluskidstech.com>';

function unpackFirestoreField(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return parseFloat(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) {
    const out = {};
    const fields = (v.mapValue && v.mapValue.fields) || {};
    for (const [k, subVal] of Object.entries(fields)) {
      out[k] = unpackFirestoreField(subVal);
    }
    return out;
  }
  if ('arrayValue' in v) {
    const values = (v.arrayValue && v.arrayValue.values) || [];
    return values.map(unpackFirestoreField);
  }
  return null;
}

// ─── Firestore REST helper ────────────────────────────────────────────────────

async function firestoreQuery(collection) {
  if (!FB_PROJECT) return [];
  const keyParam = FB_API_KEY ? `&key=${FB_API_KEY}` : '';
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}?pageSize=300${keyParam}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const json = await resp.json();
    if (!json.documents) return [];
    return json.documents.map(doc => {
      const fields = doc.fields || {};
      const out = { _id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(fields)) {
        out[k] = unpackFirestoreField(v);
      }
      return out;
    });
  } catch { return []; }
}

// ─── NTFY helper ─────────────────────────────────────────────────────────────

async function ntfyPush(topic, title, message, { priority = 'high', tags = '', click = '' } = {}) {
  if (!topic) return;
  const cleanTitle = String(title || '').replace(/[^\x20-\x7E]/g, ' ').trim();
  const headers = {
    'Content-Type': 'text/plain',
    'Title': cleanTitle,
    'Priority': priority,
  };
  if (NTFY_TOKEN && NTFY_TOKEN.trim()) headers['Authorization'] = `Bearer ${NTFY_TOKEN.trim()}`;
  if (tags)  headers['Tags']  = tags;
  if (click) headers['Click'] = click;
  try {
    let resp = await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
    if ((resp.status === 401 || resp.status === 403) && headers['Authorization']) {
      delete headers['Authorization'];
      await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
    }
  } catch (e) {
    console.error('[scheduled-notifications] ntfy push failed:', e.message);
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
    });
  } catch (e) {
    console.error('[scheduled-notifications] email failed:', e.message);
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr() {
  // WAT is UTC+1: offset so midnight WAT aligns
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function tomorrowStr() {
  const d = new Date(Date.now() + 60 * 60 * 1000 + 86400000);
  return d.toISOString().slice(0, 10);
}

function isBirthday(birthdayISO, targetDate) {
  if (!birthdayISO) return false;
  // Compare MM-DD regardless of year
  const bday = birthdayISO.slice(5, 10); // MM-DD
  const today = targetDate.slice(5, 10);
  return bday === today;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h, 10);
  const suffix = hr >= 12 ? 'PM' : 'AM';
  const displayHr = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
  return `${displayHr}:${m} ${suffix}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Task 1: Tutor Daily Schedule Digest (07:00 WAT) ─────────────────────────

async function sendTutorDailyDigests(schedules, tutorTopic) {
  const today = todayStr();

  // Group today's sessions by tutor email
  const todaySchedules = schedules.filter(s => s.date === today && s.attendanceStatus !== 'cancelled');
  if (todaySchedules.length === 0) {
    console.log('[digest] No sessions today');
    return;
  }

  const byTutor = {};
  todaySchedules.forEach(s => {
    const email = (s.tutorEmail || '').toLowerCase();
    if (!email) return;
    if (!byTutor[email]) byTutor[email] = { name: s.mentor || 'Tutor', sessions: [] };
    byTutor[email].sessions.push(s);
  });

  for (const [email, { name, sessions }] of Object.entries(byTutor)) {
    const sessionLines = sessions
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .map((s, i) => `${i + 1}. ${formatTime(s.time)} - ${s.studentName} (${s.course})${s.link ? '\n   Link: ' + s.link : ''}`)
      .join('\n');

    const ntfyMsg = `Hi ${name}! Your sessions for today (${formatDate(today)}):\n\n${sessionLines}\n\nHave a great teaching day! `;
    const waClick = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(`Hi STEMulus! Just confirming my ${sessions.length} session(s) for today.`)}`;

    // ntfy push to admin channel (tutor-specific topics would need one per tutor: not practical)
    await ntfyPush(
      tutorTopic,
      `[Daily Digest]: ${name} has ${sessions.length} session${sessions.length > 1 ? 's' : ''} today`,
      ntfyMsg,
      { tags: 'calendar,teacher', click: waClick }
    );

    // Email direct to tutor
    const sessionHTML = sessions
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .map(s => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0d1b2a">${formatTime(s.time)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#374151">${s.studentName}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b">${s.course}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">${s.link ? `<a href="${s.link}" style="color:#f4600c;font-weight:700">Join</a>` : '-'}</td>
        </tr>`).join('');

    await sendEmail(email,
      `Your STEMulus Sessions for ${formatDate(today)}`,
      `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
      <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1A237E;padding:24px 32px"><h2 style="color:#fff;margin:0;font-size:1.2rem">Your Teaching Schedule: Today</h2></div>
        <div style="height:4px;background:#F4600C"></div>
        <div style="padding:28px 32px">
          <p style="color:#374151;margin:0 0 8px">Hi <strong>${name}</strong>,</p>
          <p style="color:#374151;margin:0 0 24px">Here are your sessions for <strong>${formatDate(today)}</strong>:</p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th style="text-align:left;padding-bottom:8px;font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Time</th>
              <th style="text-align:left;padding-bottom:8px;padding-left:8px;font-size:0.75rem;color:#64748b;text-transform:uppercase">Student</th>
              <th style="text-align:left;padding-bottom:8px;font-size:0.75rem;color:#64748b;text-transform:uppercase">Program</th>
              <th style="text-align:left;padding-bottom:8px;font-size:0.75rem;color:#64748b;text-transform:uppercase">Link</th>
            </tr></thead>
            <tbody>${sessionHTML}</tbody>
          </table>
          <p style="color:#94a3b8;font-size:0.78rem;margin-top:24px">Need to reschedule? Reply to this email or message us on WhatsApp.</p>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8">
          STEMulus Kids Tech · <a href="https://stemuluskidstech.com" style="color:#f4600c">stemuluskidstech.com</a>
        </div>
      </div></body></html>`
    );

    console.log(`[digest] Sent to tutor: ${email} (${sessions.length} sessions)`);
  }
}

// ─── Task 2: Parent & Tutor 24-hour Reminders (18:00 WAT) ─────────────────────

async function sendParentReminders(schedules, enrollTopic, tutorTopic) {
  const tomorrow = tomorrowStr();

  const tomorrowSessions = schedules.filter(s => s.date === tomorrow && s.attendanceStatus !== 'cancelled');
  if (tomorrowSessions.length === 0) {
    console.log('[reminders] No sessions tomorrow');
    return;
  }

  for (const s of tomorrowSessions) {
    const parentEmail = s.parentEmail;
    if (parentEmail) {
      const msg = `Hi ${s.parentName || 'there'}! Reminder: ${s.studentName} has a ${s.course} session tomorrow (${formatDate(tomorrow)}) at ${formatTime(s.time)} with ${s.mentor}.${s.link ? ' Join: ' + s.link : ''} See you then! `;

      // ntfy push (admin sees it too as a heads-up)
      await ntfyPush(
        enrollTopic,
        `⏰ Reminder: ${s.studentName}'s class tomorrow at ${formatTime(s.time)}`,
        msg,
        { tags: 'bell,calendar', click: s.link || `https://wa.me/${ADMIN_WA}` }
      );

      // Email to parent
      await sendEmail(parentEmail,
        `Reminder: ${s.studentName}'s ${s.course} class tomorrow`,
        `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
        <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#1A237E;padding:24px 32px"><h2 style="color:#fff;margin:0;font-size:1.2rem">⏰ Class Reminder: Tomorrow</h2></div>
          <div style="height:4px;background:#F4600C"></div>
          <div style="padding:28px 32px">
            <p style="color:#374151;margin:0 0 24px">Hi <strong>${s.parentName || 'there'}</strong>,</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;width:40%">Student</td><td style="padding:6px 0;font-weight:700;color:#0d1b2a">${s.studentName}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Program</td><td style="padding:6px 0;color:#0d1b2a">${s.course}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Date</td><td style="padding:6px 0;color:#0d1b2a">${formatDate(tomorrow)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Time</td><td style="padding:6px 0;font-weight:700;color:#F4600C;font-size:1.1rem">${formatTime(s.time)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Mentor</td><td style="padding:6px 0;color:#0d1b2a">${s.mentor}</td></tr>
                ${s.duration ? `<tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Duration</td><td style="padding:6px 0;color:#0d1b2a">${s.duration} min</td></tr>` : ''}
              </table>
            </div>
            ${s.link ? `<div style="text-align:center;margin-bottom:24px"><a href="${s.link}" style="display:inline-block;background:#F4600C;color:#fff;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:0.9rem">Join Class on Zoom →</a></div>` : ''}
            <p style="color:#94a3b8;font-size:0.78rem">Need to reschedule? Reply to this email at least 12 hours before the session.</p>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8">
            STEMulus Kids Tech · <a href="https://stemuluskidstech.com" style="color:#f4600c">stemuluskidstech.com</a>
          </div>
        </div></body></html>`
      );
      console.log(`[reminders] Sent reminder to parent: ${parentEmail} for ${s.studentName}`);
    }

    const tutorEmail = s.tutorEmail;
    if (tutorEmail) {
      const tutorMsg = `Hi ${s.mentor || 'Mentor'}! Reminder: You have an upcoming session with ${s.studentName} tomorrow (${formatDate(tomorrow)}) at ${formatTime(s.time)}.${s.link ? ' Join: ' + s.link : ''}`;

      if (tutorTopic) {
        await ntfyPush(
          tutorTopic,
          `⏰ [24h Reminder]: Session with ${s.studentName} tomorrow at ${formatTime(s.time)}`,
          tutorMsg,
          { tags: 'teacher,calendar', click: s.link || `https://wa.me/${ADMIN_WA}` }
        );
      }

      await sendEmail(tutorEmail,
        `[24h Reminder] Tomorrow: Session with ${s.studentName} at ${formatTime(s.time)}`,
        `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
        <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#1A237E;padding:24px 32px"><h2 style="color:#fff;margin:0;font-size:1.2rem">⏰ 24-Hour Tutor Session Reminder</h2></div>
          <div style="height:4px;background:#F4600C"></div>
          <div style="padding:28px 32px">
            <p style="color:#374151;margin:0 0 24px">Hi <strong>${s.mentor || 'Mentor'}</strong>,</p>
            <p style="color:#374151;margin:0 0 20px">This is a reminder that you have an upcoming 1-on-1 coding session tomorrow:</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem;width:40%">Student</td><td style="padding:6px 0;font-weight:700;color:#0d1b2a">${s.studentName}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Program</td><td style="padding:6px 0;color:#0d1b2a">${s.course}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Date</td><td style="padding:6px 0;color:#0d1b2a">${formatDate(tomorrow)}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Time</td><td style="padding:6px 0;font-weight:700;color:#F4600C;font-size:1.1rem">${formatTime(s.time)} (WAT)</td></tr>
                <tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Parent Email</td><td style="padding:6px 0;color:#0d1b2a">${s.parentEmail || 'On file'}</td></tr>
                ${s.duration ? `<tr><td style="padding:6px 0;color:#64748b;font-size:0.85rem">Duration</td><td style="padding:6px 0;color:#0d1b2a">${s.duration} min</td></tr>` : ''}
              </table>
            </div>
            ${s.link ? `<div style="text-align:center;margin-bottom:24px"><a href="${s.link}" style="display:inline-block;background:#1A237E;color:#fff;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:0.9rem">Open Zoom Classroom →</a></div>` : ''}
            <p style="color:#94a3b8;font-size:0.78rem">Remember to log attendance and session notes immediately following the class.</p>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8">
            STEMulus Kids Tech · <a href="https://stemuluskidstech.com" style="color:#f4600c">stemuluskidstech.com</a>
          </div>
        </div></body></html>`
      );
      console.log(`[reminders] Sent 24h reminder to tutor: ${tutorEmail} for ${s.studentName}`);
    }
  }
}

// ─── Task 3: Birthday Alerts: Students AND Tutors ────────────────────────────

async function sendBirthdayAlerts(students, tutors, birthdayTopic) {
  const today = todayStr();

  // Student birthdays
  const birthdayStudents = students.filter(s => isBirthday(s.birthday, today));
  for (const s of birthdayStudents) {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const age = today.slice(0, 4) - (s.birthday || '').slice(0, 4);

    await ntfyPush(
      birthdayTopic,
      `[Birthday] Student Birthday: ${name} turns ${age} today!`,
      `Happy birthday to ${name}! They turn ${age} today.\nParent: ${s.parentName} (${s.parentEmail || 'no email'})\nSend them a special coding challenge or discount! `,
      { tags: 'birthday,tada,party_popper', priority: 'default' }
    );

    // POLICY: Birthday emails to parents require explicit admin approval; keep NTFY alert to staff
    console.log(`[birthday] Student birthday detected for ${name}. Admin notified via NTFY; automated email withheld pending admin approval.`);
  }

  // Tutor birthdays
  const birthdayTutors = tutors.filter(t => isBirthday(t.birthday, today));
  for (const t of birthdayTutors) {
    const name = t.name || t.email;
    const age = t.birthday ? (parseInt(today.slice(0, 4)) - parseInt(t.birthday.slice(0, 4))) : null;

    await ntfyPush(
      birthdayTopic,
      `[Birthday] Tutor Birthday: ${name}${age ? ` turns ${age}` : ''} today!`,
      `Happy birthday to our mentor ${name}! ${age ? `They turn ${age} today.` : ''}\nEmail: ${t.email}\nSend them a special appreciation message! `,
      { tags: 'birthday,heart,teacher', priority: 'default' }
    );

    // POLICY: Birthday emails to tutors require explicit admin approval; keep NTFY alert to staff
    console.log(`[birthday] Tutor birthday detected for ${name}. Staff notified via NTFY; automated email withheld pending admin approval.`);
  }
}

// ─── Class Reminder Sender ─────────────────────────────────
async function sendClassReminder(schedule, minutesBefore, type) {
  const studentName = schedule.studentName || schedule.student || 'Student';
  const tutorName = schedule.mentor || schedule.tutorName || 'Your Tutor';
  const classTime = schedule.time || '';
  const classDate = schedule.date || '';
  const joinLink = schedule.link || 'https://meet.google.com/new';

  const reminderType = minutesBefore >= 1400 ? '24h' : (minutesBefore >= 50 ? '1h' : '10m');
  const labelMap = { 1440: '24 hours', 60: '1 hour', 10: '10 minutes' };
  const label = labelMap[minutesBefore] || (minutesBefore + ' minutes');

  const title = label + ' until ' + studentName + "'s coding class";
  const message = "Tutor: " + tutorName + "\nTime: " + classTime + " on " + classDate + "\nJoin: " + joinLink;

  // NTFY to admin & tutor
  const enroll_topic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
  const tutor_topic  = process.env.NTFY_TOPIC_TUTOR  || 'stm-ttr-nb3r5y6jd1cx8ws';
  const ntfy_token = process.env.NTFY_TOKEN;
  const ntfyHeaders = { 'Content-Type': 'text/plain', 'Title': title, 'Priority': minutesBefore <= 10 ? 'urgent' : 'high', 'Tags': 'alarm_clock,computer' };
  if (ntfy_token) ntfyHeaders['Authorization'] = 'Bearer ' + ntfy_token;

  try {
    await fetch('https://ntfy.sh/' + enroll_topic, { method: 'POST', headers: ntfyHeaders, body: message });
    await fetch('https://ntfy.sh/' + tutor_topic,  { method: 'POST', headers: ntfyHeaders, body: message });
  } catch(e) { console.warn('[Reminder] NTFY failed:', e.message); }

  // POLICY: Reminder emails to parents and tutors require explicit admin review/approval
  console.log(`[Reminder] ${label} alert for ${studentName} sent to internal NTFY channels. Direct emails withheld pending admin approval.`);
}

// ─── Check upcoming sessions and send reminders ─────────
async function processClassReminders(db) {
  const schedules = db.schedules || [];
  const students = db.students || [];
  const now = new Date();

  const reminderWindows = [1440, 60, 10]; // 24 hours (1440m), 1 hour (60m), and 10 minutes (10m) before class

  for (const schedule of schedules) {
    if (!schedule.date || !schedule.time) continue;
    if (schedule.attendanceStatus === 'present' || schedule.attendanceStatus === 'absent') continue;

    // Check if student has reminders paused
    const student = students.find(s => s.id === schedule.studentId || (s.firstName+' '+s.lastName) === schedule.studentName);
    if (student && student.remindersPaused) continue;

    const classDateTime = new Date(schedule.date + 'T' + schedule.time);
    const minutesUntil = (classDateTime - now) / (1000 * 60);

    for (const window of reminderWindows) {
      // Fire if we're within a 15-minute window of the reminder time
      if (minutesUntil > window - 15 && minutesUntil <= window) {
        const reminderKey = 'reminded_' + window + '_' + schedule.id;
        if (!db.sentReminders) db.sentReminders = {};
        if (!db.sentReminders[reminderKey]) {
          db.sentReminders[reminderKey] = new Date().toISOString();
          await sendClassReminder(schedule, window, window + 'min');
        }
      }
    }
  }
}

// ─── Weekly report generation reminder ──────────────────
async function sendWeeklyReportReminder() {
  const topic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
  const token = process.env.NTFY_TOKEN;
  const headers = { 'Content-Type': 'text/plain', 'Title': 'Weekly Reports Ready to Generate', 'Priority': 'high', 'Tags': 'clipboard' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    await fetch('https://ntfy.sh/' + topic, { method: 'POST', headers, body: "It's Sunday: time to generate weekly parent reports in the admin portal." });
  } catch(e) {}
}

// ─── Day-clamped addMonths helper ──────────────────────────────────────────────
function addMonthsClamped(dateStr, monthsToAdd = 1, preferredAnchorDay = null) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = dateStr.trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return '';
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) - 1;
  if (isNaN(y) || isNaN(m)) return '';
  const origDay = parseInt(parts[2], 10);
  const anchor = (typeof preferredAnchorDay === 'number' && preferredAnchorDay >= 1 && preferredAnchorDay <= 31)
    ? preferredAnchorDay
    : (isNaN(origDay) ? 1 : origDay);
  m += monthsToAdd;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  const maxDays = new Date(y, m + 1, 0).getDate();
  const clampedDay = Math.min(anchor, maxDays);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

// ─── Monthly Tuition Renewal Reminders ──────────────────────────────────────────
async function sendMonthlyBillingReminders(students, schedules, adminTopic) {
  const today = todayStr();
  const todayMs = new Date(today).getTime();

  for (const s of students) {
    if (s.status === 'withdrawn' || s.status === 'inactive' || s.isDeleted) continue;

    // Determine first class date / cycle start date
    const b = s.billing || {};
    let firstClass = b.firstClassDate || s.billing_firstClassDate || s.firstClassDate;
    if (!firstClass) {
      const studSched = schedules.filter(sc => sc.studentId === s._id || (sc.studentName && sc.studentName.toLowerCase().includes((s.firstName || '').toLowerCase())));
      if (studSched.length > 0) {
        studSched.sort((a, b) => new Date(a.date) - new Date(b.date));
        firstClass = studSched[0].date;
      }
    }
    if (!firstClass) firstClass = s.createdAt ? s.createdAt.slice(0, 10) : today;

    const anchorDay = b.anchorDay || parseInt(firstClass.slice(8, 10), 10) || 1;
    const cycleStart = b.cycleStartDate || s.billing_cycleStartDate || firstClass;
    let nextDue = b.nextDueDate || s.billing_nextDueDate;
    if (!nextDue) {
      nextDue = addMonthsClamped(cycleStart, 1, anchorDay);
    }

    const dueMs = new Date(nextDue).getTime();
    const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    // Send reminder at structured milestones: 5 days advance, on due date, and overdue follow-up (T+3d, T+7d)
    const shouldRemind = (diffDays === 5 || diffDays === 0 || diffDays === -3 || diffDays === -7);
    if (shouldRemind) {
      const childName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      const parentName = s.parentName || 'Parent';
      const parentEmail = s.parentEmail;
      const amount = s.monthlyFee ? `₦${Number(s.monthlyFee).toLocaleString()}` : '₦35,000';

      console.log(`[scheduled-notifications] Tuition renewal due for ${childName} (${diffDays} days remaining, due ${nextDue})`);

      // 1. Notify Admin via NTFY push
      if (adminTopic) {
        await ntfyPush(
          adminTopic,
          `Tuition Reminder: ${childName} (Due ${nextDue})`,
          `1-month cycle payment reminder for ${childName}. Monthly fee: ${amount}. Parent: ${parentName} (${parentEmail || 'no email'}). Kindly follow up.`,
          { priority: diffDays < 0 ? 'urgent' : 'high', tags: 'moneybag,calendar', click: 'https://stemuluskidstech.com/admin-dashboard.html#billing' }
        );
      }

      // Zero-Autonomous Policy: Never email parents directly from background cron.
      // Admin is alerted via NTFY above; invoice drafts are staged in Admin Email Queue for review.
      console.log(`[scheduled-notifications] Tuition renewal flagged to Admin for ${childName}. Autonomous parent email disabled per executive policy.`);
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log('[scheduled-notifications] Running at', new Date().toISOString());

  const utcHour = new Date().getUTCHours();
  // 06:00 UTC = 07:00 WAT = morning run
  // 17:00 UTC = 18:00 WAT = evening run
  const isMorning = utcHour >= 5 && utcHour < 10;
  const isEvening = utcHour >= 16 && utcHour < 21;

  const enrollTopic   = process.env.NTFY_TOPIC_ENROLL   || 'stm-enr-lx7k9w2mq8vp4tz';
  const tutorTopic    = process.env.NTFY_TOPIC_TUTOR    || 'stm-ttr-nb3r5y6jd1cx8ws';
  const birthdayTopic = process.env.NTFY_TOPIC_BIRTHDAY || 'stm-bday-qm4p7s9ke2ax1nf';

  // Load data from Firestore
  const [schedules, students, userDocs] = await Promise.all([
    firestoreQuery('schedules'),
    firestoreQuery('students'),
    firestoreQuery('users'),
  ]);

  const tutors = userDocs.filter(u => u.role === 'tutor');

  console.log(`[scheduled-notifications] Loaded: ${schedules.length} schedules, ${students.length} students, ${tutors.length} tutors`);

  if (isMorning) {
    await sendTutorDailyDigests(schedules, tutorTopic);
    await sendBirthdayAlerts(students, tutors, birthdayTopic);
    await sendMonthlyBillingReminders(students, schedules, enrollTopic);
    console.log('[scheduled-notifications] Morning tasks complete');
  }

  if (isEvening) {
    await sendParentReminders(schedules, enrollTopic, tutorTopic);
    console.log('[scheduled-notifications] Evening tasks complete');
  }

  if (!isMorning && !isEvening) {
    console.log('[scheduled-notifications] Outside scheduled windows: no tasks run');
  }

  // Class reminders: check on every invocation using Firestore data already loaded
  try {
    const db = { schedules, students, sentReminders: {} };
    await processClassReminders(db);
    console.log('[Notifications] Class reminder check complete');
  } catch(e) { console.warn('Reminder check error:', e.message); }

  // Sunday evening: send weekly report reminder to admin
  const now = new Date();
  if (now.getDay() === 0 && now.getHours() >= 20) {
    await sendWeeklyReportReminder();
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, utcHour, isMorning, isEvening }) };
};
