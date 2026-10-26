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

const { handler: sendEmailHandler } = require('./send-email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stemuluskidstech.com';
const RESEND_KEY = process.env.RESEND_API_KEY;
const NTFY_TOKEN = process.env.NTFY_TOKEN;
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'stemulus-lms';
const FB_API_KEY = process.env.FIREBASE_API_KEY;

// Query Firestore schedules
async function getFirestoreSchedules() {
  if (!FB_PROJECT) return [];
  const keyParam = FB_API_KEY ? `&key=${FB_API_KEY}` : '';
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/schedules?pageSize=300${keyParam}`;
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

// Mark reminder milestone as dispatched in Firestore to guarantee idempotency across cron ticks
async function markMilestoneDispatched(scheduleId, milestone, currentDispatched) {
  if (!FB_PROJECT || !scheduleId) return;
  const list = currentDispatched ? currentDispatched.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!list.includes(milestone)) list.push(milestone);
  const updatedStr = list.join(',');
  const keyParam = FB_API_KEY ? `&key=${FB_API_KEY}` : '';
  const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/schedules/${scheduleId}?updateMask.fieldPaths=remindersDispatched${keyParam}`;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          remindersDispatched: { stringValue: updatedStr }
        }
      })
    });
  } catch (e) {
    console.warn('[ClassReminders] Failed to update remindersDispatched in Firestore:', e.message);
  }
}

// Push NTFY Notification with automatic anonymous retry and stemulus-admin-alerts mirror
async function pushNtfy(topic, title, message, { priority = 'high', tags = '' } = {}) {
  if (!topic) return;
  const cleanTitle = String(title || '').replace(/[^\x20-\x7E]/g, ' ').trim();
  const headers = { 'Content-Type': 'text/plain', 'Title': cleanTitle, 'Priority': priority };
  if (NTFY_TOKEN && NTFY_TOKEN.trim()) headers['Authorization'] = `Bearer ${NTFY_TOKEN.trim()}`;
  if (tags) headers['Tags'] = tags;
  try {
    let resp = await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
    if ((resp.status === 401 || resp.status === 403) && headers['Authorization']) {
      delete headers['Authorization'];
      await fetch(`https://ntfy.sh/${topic}`, { method: 'POST', headers, body: message });
    }
  } catch (e) {}
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
  const adminTopic = process.env.NTFY_TOPIC_ADMIN || 'stemulus-admin-alerts';
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
    const link = (s.link && s.link.startsWith('http')) ? s.link : (s.meetLink || 'https://meet.google.com/stm-prog-live');
    const parentEmail = s.parentEmail;
    const tutorEmail = s.tutorEmail;
    const sentMilestones = (s.remindersDispatched || '').split(',').map(x => x.trim()).filter(Boolean);

    let activeMilestone = null;
    if (!sentMilestones.includes('24h') && diffMinutes >= 1380 && diffMinutes <= 1470) {
      activeMilestone = '24h';
    } else if (!sentMilestones.includes('1h') && diffMinutes >= 45 && diffMinutes <= 75) {
      activeMilestone = '1h';
    } else if (!sentMilestones.includes('10m') && diffMinutes >= 0 && diffMinutes <= 15) {
      activeMilestone = '10m';
    }

    if (activeMilestone) {
      const isUrgent = activeMilestone === '10m';
      await pushNtfy(
        adminTopic,
        `[${activeMilestone} Class Reminder] ${studentName} (${course})`,
        `Session at ${s.time} WAT with Tutor ${tutorName}.\nMeeting Link: ${link}`,
        { priority: isUrgent ? 'urgent' : 'high', tags: isUrgent ? 'alarm_clock,zap' : 'bell,calendar' }
      );
      await pushNtfy(
        tutorTopic,
        `[${activeMilestone} Faculty Alert] ${studentName}`,
        `Session at ${s.time} WAT (${course}).\nJoin Link: ${link}`,
        { priority: isUrgent ? 'urgent' : 'high', tags: 'mortar_board,calendar' }
      );

      // Dispatch strategic email with meeting link to Parent
      if (parentEmail) {
        try {
          await sendEmailHandler({
            httpMethod: 'POST',
            body: JSON.stringify({
              type: 'reminder',
              data: {
                parentEmail,
                parentName: s.parentName || 'Parent',
                studentName,
                courseName: course,
                classDate: s.date,
                classTime: s.time,
                duration: s.duration || 60,
                link,
                meetLink: link,
                mentorName: tutorName,
                reminderType: activeMilestone
              }
            })
          });
        } catch (e) {}
      }

      // Dispatch strategic email with meeting link to Tutor
      if (tutorEmail) {
        try {
          await sendEmailHandler({
            httpMethod: 'POST',
            body: JSON.stringify({
              type: 'tutor-reminder',
              data: {
                tutorEmail,
                tutorName,
                studentName,
                courseName: course,
                classDate: s.date,
                classTime: s.time,
                duration: s.duration || 60,
                link,
                meetLink: link,
                reminderType: activeMilestone
              }
            })
          });
        } catch (e) {}
      }

      if (activeMilestone === '10m') {
        try {
          const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://stemuluskidstech.com';
          fetch(`${baseUrl}/.netlify/functions/record-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleId: s.id,
              studentName,
              tutorName,
              courseName: course,
              meetingUrl: link,
              triggeredBy: 'cron_countdown'
            })
          }).catch(() => {});
        } catch (e) {}
      }

      await markMilestoneDispatched(s.id, activeMilestone, s.remindersDispatched);
      sentMilestones.push(activeMilestone);
      s.remindersDispatched = sentMilestones.join(',');
      dispatched.push({ milestone: activeMilestone, scheduleId: s.id, studentName, link });
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
