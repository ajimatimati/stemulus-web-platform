/**
 * STEMulus Scheduled Notifications — Netlify Scheduled Function
 *
 * Runs twice daily via netlify.toml cron:
 *   07:00 WAT (06:00 UTC) — morning run: tutor daily schedule digests + birthday alerts
 *   18:00 WAT (17:00 UTC) — evening run: parent 24-hour session reminders
 *
 * Required Netlify environment variables (same as notify.js):
 *   NTFY_TOKEN
 *   NTFY_TOPIC_ENROLL
 *   NTFY_TOPIC_CONTACT
 *   NTFY_TOPIC_TUTOR
 *   NTFY_TOPIC_BIRTHDAY
 *   FIREBASE_PROJECT_ID       — e.g. stemulus-kidstech
 *   FIREBASE_API_KEY          — Web API key (for REST access)
 *   RESEND_API_KEY            — for sending emails
 *   ADMIN_EMAIL               — admin@stemuluskidstech.com
 *   ADMIN_WHATSAPP            — 2347052466716
 *
 * Data contract (Firestore collections read by this function):
 *   schedules/{id}  — { studentId, studentName, course, date, time, duration,
 *                       mentor, tutorEmail, tutorBirthday, link,
 *                       parentEmail, parentName, attendanceStatus }
 *   students/{id}   — { firstName, lastName, birthday, parentEmail, parentName,
 *                       tutorName, tutorEmail }
 *   users/{email}   — { role, name, email, birthday }   (tutors have role:'tutor')
 */

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@stemuluskidstech.com';
const ADMIN_WA       = process.env.ADMIN_WHATSAPP || '2347052466716';
const RESEND_KEY     = process.env.RESEND_API_KEY;
const NTFY_TOKEN     = process.env.NTFY_TOKEN;
const FB_PROJECT     = process.env.FIREBASE_PROJECT_ID || 'stemulus-kidstech';
const FB_API_KEY     = process.env.FIREBASE_API_KEY;
const FROM_ADDRESS   = 'STEMulus Kids Tech <hello@portal.stemuluskidstech.com>';

// ─── Firestore REST helper ────────────────────────────────────────────────────

async function firestoreQuery(collection) {
  if (!FB_PROJECT || !FB_API_KEY) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}?key=${FB_API_KEY}&pageSize=300`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const json = await resp.json();
    if (!json.documents) return [];
    return json.documents.map(doc => {
      const fields = doc.fields || {};
      const out = { _id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(fields)) {
        out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.doubleValue ?? null;
      }
      return out;
    });
  } catch { return []; }
}

// ─── NTFY helper ─────────────────────────────────────────────────────────────

async function ntfyPush(topic, title, message, { priority = 'high', tags = '', click = '' } = {}) {
  if (!topic) return;
  const headers = {
    'Content-Type': 'text/plain',
    'Title': title,
    'Priority': priority,
  };
  if (NTFY_TOKEN) headers['Authorization'] = `Bearer ${NTFY_TOKEN}`;
  if (tags)  headers['Tags']  = tags;
  if (click) headers['Click'] = click;
  try {
    await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
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
  // WAT is UTC+1 — offset so midnight WAT aligns
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
      .map((s, i) => `${i + 1}. ${formatTime(s.time)} — ${s.studentName} (${s.course})${s.link ? '\n   Link: ' + s.link : ''}`)
      .join('\n');

    const ntfyMsg = `Hi ${name}! Your sessions for today (${formatDate(today)}):\n\n${sessionLines}\n\nHave a great teaching day! `;
    const waClick = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(`Hi STEMulus! Just confirming my ${sessions.length} session(s) for today.`)}`;

    // ntfy push to admin channel (tutor-specific topics would need one per tutor — not practical)
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
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">${s.link ? `<a href="${s.link}" style="color:#f4600c;font-weight:700">Join</a>` : '—'}</td>
        </tr>`).join('');

    await sendEmail(email,
      `Your STEMulus Sessions for ${formatDate(today)}`,
      `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
      <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#1A237E;padding:24px 32px"><h2 style="color:#fff;margin:0;font-size:1.2rem">Your Teaching Schedule — Today</h2></div>
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

// ─── Task 2: Parent 24-hour Reminders (18:00 WAT) ────────────────────────────

async function sendParentReminders(schedules, enrollTopic) {
  const tomorrow = tomorrowStr();

  const tomorrowSessions = schedules.filter(s => s.date === tomorrow && s.attendanceStatus !== 'cancelled');
  if (tomorrowSessions.length === 0) {
    console.log('[reminders] No sessions tomorrow');
    return;
  }

  for (const s of tomorrowSessions) {
    const parentEmail = s.parentEmail;
    if (!parentEmail) continue;

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
        <div style="background:#1A237E;padding:24px 32px"><h2 style="color:#fff;margin:0;font-size:1.2rem">⏰ Class Reminder — Tomorrow</h2></div>
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
}

// ─── Task 3: Birthday Alerts — Students AND Tutors ────────────────────────────

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

    // Email parent a birthday note
    if (s.parentEmail) {
      await sendEmail(s.parentEmail,
        ` Happy Birthday, ${s.firstName}! A special message from STEMulus`,
        `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
        <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#1A237E,#F4600C);padding:32px;text-align:center">
            <div style="font-size:3rem"></div>
            <h2 style="color:#fff;margin:8px 0 0;font-size:1.5rem">Happy Birthday, ${s.firstName}!</h2>
          </div>
          <div style="padding:32px;text-align:center">
            <p style="color:#374151;font-size:1rem;line-height:1.7">The entire STEMulus team wishes <strong>${s.firstName}</strong> a wonderful ${age}th birthday! Keep building amazing things — the world needs more young coders like you! </p>
            <p style="color:#64748b;font-size:0.85rem">From all of us at STEMulus Kids Tech</p>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8">
            STEMulus Kids Tech · <a href="https://stemuluskidstech.com" style="color:#f4600c">stemuluskidstech.com</a>
          </div>
        </div></body></html>`
      );
    }
    console.log(`[birthday] Student: ${name}`);
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

    // Email tutor directly
    if (t.email) {
      await sendEmail(t.email,
        ` Happy Birthday from the STEMulus Family!`,
        `<!DOCTYPE html><html><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
        <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#1A237E,#7C3AED);padding:32px;text-align:center">
            <div style="font-size:3rem"></div>
            <h2 style="color:#fff;margin:8px 0 0;font-size:1.5rem">Happy Birthday, ${name}!</h2>
          </div>
          <div style="padding:32px;text-align:center">
            <p style="color:#374151;font-size:1rem;line-height:1.7">Thank you for being an incredible mentor and making a real difference in the lives of our students. Today is your day — we appreciate everything you do! </p>
            <p style="color:#64748b;font-size:0.85rem">With love from the entire STEMulus family</p>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:0.75rem;color:#94a3b8">
            STEMulus Kids Tech · <a href="https://stemuluskidstech.com" style="color:#f4600c">stemuluskidstech.com</a>
          </div>
        </div></body></html>`
      );
    }
    console.log(`[birthday] Tutor: ${name}`);
  }
}

// ─── Class Reminder Sender ─────────────────────────────────
async function sendClassReminder(schedule, minutesBefore, type) {
  const studentName = schedule.studentName || schedule.student || 'Student';
  const tutorName = schedule.mentor || schedule.tutorName || 'Your Tutor';
  const classTime = schedule.time || '';
  const classDate = schedule.date || '';
  const joinLink = schedule.link || 'https://meet.google.com/new';

  const labelMap = { 360: '6 hours', 5: '5 minutes' };
  const label = labelMap[minutesBefore] || (minutesBefore + ' minutes');

  const title = label + ' until ' + studentName + "'s coding class";
  const message = "Tutor: " + tutorName + "\nTime: " + classTime + " on " + classDate + "\nJoin: " + joinLink;

  // NTFY to admin
  const enroll_topic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
  const ntfy_token = process.env.NTFY_TOKEN;
  const ntfyHeaders = { 'Content-Type': 'text/plain', 'Title': title, 'Priority': minutesBefore <= 5 ? 'urgent' : 'high', 'Tags': 'alarm_clock,computer' };
  if (ntfy_token) ntfyHeaders['Authorization'] = 'Bearer ' + ntfy_token;

  try {
    await fetch('https://ntfy.sh/' + enroll_topic, { method: 'POST', headers: ntfyHeaders, body: message });
  } catch(e) { console.warn('[Reminder] NTFY failed:', e.message); }

  // Email to BOTH parent and tutor
  const SEND_EMAIL = process.env.URL ? process.env.URL + '/.netlify/functions/send-email' : null;
  if (SEND_EMAIL) {
    if (schedule.parentEmail) {
      const emailData = { studentName, tutorName, classDate, classTime, duration: schedule.duration||60, zoomLink: joinLink, mentorName: tutorName, reminderType: minutesBefore <= 5 ? '5min' : '6h', parentEmail: schedule.parentEmail, parentName: schedule.parentName||'Parent' };
      fetch(SEND_EMAIL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'reminder', data: emailData }) }).catch(()=>{});
    }
    if (schedule.tutorEmail) {
      const tutorData = { studentName, tutorName, classDate, classTime, duration: schedule.duration||60, zoomLink: joinLink, mentorName: tutorName, reminderType: minutesBefore <= 5 ? '5min' : '6h', parentEmail: schedule.tutorEmail, parentName: tutorName };
      fetch(SEND_EMAIL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'reminder', data: tutorData }) }).catch(()=>{});
    }
  }
}

// ─── Check upcoming sessions and send reminders ─────────
async function processClassReminders(db) {
  const schedules = db.schedules || [];
  const students = db.students || [];
  const now = new Date();

  const reminderWindows = [360, 5]; // 6 hours (360m) and 5 minutes (5m) before class

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
    await fetch('https://ntfy.sh/' + topic, { method: 'POST', headers, body: "It's Sunday — time to generate weekly parent reports in the admin portal." });
  } catch(e) {}
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
    console.log('[scheduled-notifications] Morning tasks complete');
  }

  if (isEvening) {
    await sendParentReminders(schedules, enrollTopic);
    console.log('[scheduled-notifications] Evening tasks complete');
  }

  if (!isMorning && !isEvening) {
    console.log('[scheduled-notifications] Outside scheduled windows — no tasks run');
  }

  // Class reminders — check on every invocation using Firestore data already loaded
  try {
    const db = { schedules, students, sentReminders: {} };
    await processClassReminders(db);
    console.log('[Notifications] Class reminder check complete');
  } catch(e) { console.warn('Reminder check error:', e.message); }

  // Sunday evening — send weekly report reminder to admin
  const now = new Date();
  if (now.getDay() === 0 && now.getHours() >= 20) {
    await sendWeeklyReportReminder();
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, utcHour, isMorning, isEvening }) };
};
