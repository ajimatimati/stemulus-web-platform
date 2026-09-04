/**
 * STEMulus Automated Class Reminder Serverless Function
 * Netlify Function triggered by cron or external scheduler.
 *
 * Checks all upcoming schedules and dispatches dual notifications:
 * 1. 6 Hours Before Class (345m to 375m window):
 *    - Detailed preparation briefing to Parent
 *    - Session prep and attendance link to Tutor
 * 2. 5 Minutes Before Class (0m to 10m window):
 *    - Urgent countdown join alert with 1-click meeting link to Parent
 *    - Immediate start class notification with roster link to Tutor
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stemuluskidstech.com';
const RESEND_KEY = process.env.RESEND_API_KEY;
const NTFY_TOKEN = process.env.NTFY_TOKEN;
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'stemulus-kidstech';
const FB_API_KEY = process.env.FIREBASE_API_KEY;

// Query Firestore schedules
async function getFirestoreSchedules() {
  if (!FB_PROJECT || !FB_API_KEY) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/schedules?key=${FB_API_KEY}&pageSize=300`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const json = await resp.json();
    if (!json.documents) return [];
    return json.documents.map(doc => {
      const fields = doc.fields || {};
      const out = { _id: doc.name.split('/').pop(), id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(fields)) {
        out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.doubleValue ?? null;
      }
      return out;
    });
  } catch (e) {
    return [];
  }
}

// Push NTFY Notification
async function pushNtfy(topic, title, message, { priority = 'high', tags = '' } = {}) {
  if (!topic) return;
  const headers = { 'Content-Type': 'text/plain', 'Title': title, 'Priority': priority };
  if (NTFY_TOKEN) headers['Authorization'] = `Bearer ${NTFY_TOKEN}`;
  if (tags) headers['Tags'] = tags;
  try {
    await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
  } catch (e) {}
}

// Send Transactional Email via Resend
async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'STEMulus Kids Tech <hello@portal.stemuluskidstech.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });
  } catch (e) {
    console.error('[ClassReminders] Resend error:', e.message);
  }
}

// HTML Email Template Builder
function buildEmailTemplate({ title, subtitle, studentName, tutorName, course, date, time, link, isUrgent }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:'Helvetica Neue',Arial,sans-serif; background:#f8fafc; margin:0; padding:0; color:#1e293b;">
      <div style="max-width:580px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <div style="background:linear-gradient(135deg, #1A237E, #312E81); padding:28px 32px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:800; letter-spacing:-0.02em;">STEMulus Kids Tech</h1>
          <p style="color:#F4600C; margin:6px 0 0 0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">${title}</p>
        </div>

        <div style="padding:32px;">
          <h2 style="font-size:18px; color:#1A237E; margin:0 0 12px 0;">${subtitle}</h2>
          <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 20px 0;">
            This is an automated class reminder for your upcoming 1-on-1 session.
          </p>

          <div style="background:#f1f5f9; border-radius:12px; padding:20px; margin-bottom:24px; border:1px solid #e2e8f0;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr><td style="color:#64748b; padding:6px 0; width:35%;">Student:</td><td style="font-weight:700; color:#1e293b;">${studentName}</td></tr>
              <tr><td style="color:#64748b; padding:6px 0;">Mentor:</td><td style="font-weight:700; color:#1e293b;">${tutorName}</td></tr>
              <tr><td style="color:#64748b; padding:6px 0;">Course:</td><td style="font-weight:700; color:#1e293b;">${course}</td></tr>
              <tr><td style="color:#64748b; padding:6px 0;">Date &amp; Time:</td><td style="font-weight:700; color:#F4600C;">${date} at ${time} (WAT)</td></tr>
            </table>
          </div>

          <div style="text-align:center; margin:28px 0;">
            <a href="${link}" style="display:inline-block; background:${isUrgent ? '#F4600C' : '#1A237E'}; color:#ffffff; text-decoration:none; font-weight:800; font-size:15px; padding:14px 32px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              ${isUrgent ? 'Launch Classroom Now &rarr;' : 'Open Meeting Room &rarr;'}
            </a>
          </div>

          <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin:0; text-align:center;">
            Need help or need to reschedule? Reply directly or message our coordinator on WhatsApp at +234 705 246 6716.
          </p>
        </div>

        <div style="background:#f8fafc; padding:16px 32px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0;">
          STEMulus Kids Tech &bull; Private 1-on-1 Coding for Kids &bull; <a href="https://stemuluskidstech.com" style="color:#F4600C; text-decoration:none;">stemuluskidstech.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const now = new Date();
  const schedules = await getFirestoreSchedules();
  const enrollTopic = process.env.NTFY_TOPIC_ENROLL || 'stm-enr-lx7k9w2mq8vp4tz';
  const tutorTopic = process.env.NTFY_TOPIC_TUTOR || 'stm-ttr-nb3r5y6jd1cx8ws';

  const dispatched = [];

  for (const s of schedules) {
    if (!s.date || !s.time) continue;
    if (s.attendanceStatus === 'present' || s.attendanceStatus === 'absent') continue;

    const classTime = new Date(`${s.date}T${s.time}`).getTime();
    if (isNaN(classTime)) continue;

    const diffMinutes = (classTime - now.getTime()) / (1000 * 60);

    const studentName = s.studentName || s.student || 'Student';
    const tutorName = s.mentor || s.tutorName || 'Mentor';
    const course = s.course || 'Coding Class';
    const link = s.link || 'https://meet.google.com';
    const parentEmail = s.parentEmail;
    const tutorEmail = s.tutorEmail;

    // ── Milestone 1: 6 Hours Before Class (345 to 375 minutes window) ──
    if (diffMinutes >= 345 && diffMinutes <= 375) {
      // 1. Alert to Parent
      if (parentEmail) {
        await sendEmail(
          parentEmail,
          `[Prep Reminder] 6 Hours Until ${studentName}'s Coding Class`,
          buildEmailTemplate({
            title: '6-Hour Class Preparation Briefing',
            subtitle: `Preparation Reminder: ${studentName}'s 1-on-1 Class`,
            studentName, tutorName, course, date: s.date, time: s.time, link, isUrgent: false
          })
        );
      }

      // 2. Alert to Tutor
      if (tutorEmail) {
        await sendEmail(
          tutorEmail,
          `[Mentor Briefing] 6 Hours Until Session with ${studentName}`,
          buildEmailTemplate({
            title: 'Mentor Class Briefing',
            subtitle: `Upcoming 1-on-1 Class with ${studentName}`,
            studentName, tutorName, course, date: s.date, time: s.time, link, isUrgent: false
          })
        );
      }

      // 3. NTFY Push Alert
      await pushNtfy(enrollTopic, `[6h Prep Alert] ${studentName} &bull; ${course}`, `Class in 6 hours (${s.time} WAT).\nTutor: ${tutorName}\nLink: ${link}`, { priority: 'high', tags: 'clock,computer' });
      await pushNtfy(tutorTopic, `[Tutor Prep Alert] Session with ${studentName}`, `Starts in 6 hours at ${s.time} WAT.\nCourse: ${course}`, { priority: 'high', tags: 'mortar_board' });

      dispatched.push({ milestone: '6h', scheduleId: s.id, studentName });
    }

    // ── Milestone 2: 5 Minutes Before Class (0 to 10 minutes window) ──
    if (diffMinutes >= 0 && diffMinutes <= 10) {
      // 1. Alert to Parent
      if (parentEmail) {
        await sendEmail(
          parentEmail,
          `[Immediate Alert] 5 Minutes Until Class Starts — ${studentName}`,
          buildEmailTemplate({
            title: 'Starting in 5 Minutes!',
            subtitle: `Urgent: ${studentName}'s Classroom is Launching`,
            studentName, tutorName, course, date: s.date, time: s.time, link, isUrgent: true
          })
        );
      }

      // 2. Alert to Tutor
      if (tutorEmail) {
        await sendEmail(
          tutorEmail,
          `[Class Starting] 5 Minutes Until Session with ${studentName}`,
          buildEmailTemplate({
            title: 'Class Launching Now!',
            subtitle: `Urgent: Your session with ${studentName} begins in 5 minutes`,
            studentName, tutorName, course, date: s.date, time: s.time, link, isUrgent: true
          })
        );
      }

      // 3. NTFY Urgent Push
      await pushNtfy(enrollTopic, `[5m Urgent Alert] ${studentName} Class Starting`, `Classroom open now!\nJoin Link: ${link}`, { priority: 'urgent', tags: 'alarm_clock,zap' });
      await pushNtfy(tutorTopic, `[Tutor Launch Alert] 5m until ${studentName}`, `Please join classroom:\n${link}`, { priority: 'urgent', tags: 'alarm_clock,zap' });

      dispatched.push({ milestone: '5m', scheduleId: s.id, studentName });
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      schedulesChecked: schedules.length,
      dispatchedCount: dispatched.length,
      dispatched
    })
  };
};
