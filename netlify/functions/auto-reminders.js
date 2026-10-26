/**
 * STEMulus Kids Tech: Automated Strategic Class Reminders Serverless Runner
 * Evaluates upcoming 1-on-1 sessions against strategic reminder windows:
 * 1. 24 Hours Before: Preparation & Schedule Confirmation
 * 2. 1 Hour Before: Readiness Briefing & Equipment Check
 * 3. 10 Minutes Before: Urgent Launch & Direct Room Link
 */

const { handler: sendEmailHandler } = require('./send-email');

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function resolveMeetingLink(schedule) {
  if (!schedule) return 'https://meet.google.com/stm-prog-live';
  if (schedule.link && schedule.link.trim() && schedule.link.startsWith('http')) return schedule.link.trim();
  if (schedule.meetLink && schedule.meetLink.trim() && schedule.meetLink.startsWith('http')) return schedule.meetLink.trim();
  if (schedule.googleMeetLink && schedule.googleMeetLink.trim() && schedule.googleMeetLink.startsWith('http')) return schedule.googleMeetLink.trim();
  return 'https://meet.google.com/stm-prog-live';
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let payload = {};
    if (event.body) {
      try {
        payload = JSON.parse(event.body);
      } catch (e) {
        payload = {};
      }
    }

    const schedules = Array.isArray(payload.schedules) ? payload.schedules : [];
    const now = Date.now();
    const dispatched = [];
    const updatedSchedules = [];

    for (const schedule of schedules) {
      if (!schedule || !schedule.date || !schedule.time) {
        updatedSchedules.push(schedule);
        continue;
      }

      if (['present', 'absent', 'cancelled', 'done'].includes(String(schedule.attendanceStatus || schedule.status || '').toLowerCase())) {
        updatedSchedules.push(schedule);
        continue;
      }

      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`).getTime();
      if (isNaN(scheduleDateTime)) {
        updatedSchedules.push(schedule);
        continue;
      }

      const diff = scheduleDateTime - now;
      const meetingLink = resolveMeetingLink(schedule);
      let milestone = null;

      // 1. 24-Hour Milestone
      if (diff > ONE_HOUR_MS && diff <= TWENTY_FOUR_HOURS_MS && !schedule.reminded24h) {
        milestone = '24h';
        schedule.reminded24h = true;
        schedule.reminded24h_at = new Date().toISOString();
      }
      // 2. 1-Hour Milestone
      else if (diff > TEN_MINUTES_MS && diff <= ONE_HOUR_MS && !schedule.reminded1h) {
        milestone = '1h';
        schedule.reminded1h = true;
        schedule.reminded1h_at = new Date().toISOString();
      }
      // 3. 10-Minute Urgent Milestone
      else if (diff > 0 && diff <= TEN_MINUTES_MS && !schedule.reminded10m) {
        milestone = '10m';
        schedule.reminded10m = true;
        schedule.reminded10m_at = new Date().toISOString();
      }

      if (milestone) {
        // Dispatch to Parent
        if (schedule.parentEmail) {
          try {
            await sendEmailHandler({
              httpMethod: 'POST',
              body: JSON.stringify({
                type: 'reminder',
                data: {
                  scheduleId: schedule.id,
                  studentId: schedule.studentId || '',
                  rawDate: schedule.date,
                  parentEmail: schedule.parentEmail,
                  parentName: schedule.parentName || 'Parent',
                  studentName: schedule.studentName || 'Student',
                  tutorEmail: schedule.tutorEmail || '',
                  courseName: schedule.course || 'Coding Track',
                  classDate: schedule.date,
                  classTime: schedule.time,
                  duration: schedule.duration || 60,
                  rawMeetLink: meetingLink,
                  link: meetingLink,
                  meetLink: meetingLink,
                  mentorName: schedule.mentor || schedule.tutorName || 'Mentor',
                  reminderType: milestone
                }
              })
            });
            dispatched.push({ type: 'parent', email: schedule.parentEmail, milestone, scheduleId: schedule.id });
          } catch (e) {
            console.error('[AutoReminders] Parent dispatch error:', e.message);
          }
        }

        // Dispatch to Tutor
        if (schedule.tutorEmail) {
          try {
            await sendEmailHandler({
              httpMethod: 'POST',
              body: JSON.stringify({
                type: 'tutor-reminder',
                data: {
                  scheduleId: schedule.id,
                  studentId: schedule.studentId || '',
                  rawDate: schedule.date,
                  tutorEmail: schedule.tutorEmail,
                  tutorName: schedule.mentor || schedule.tutorName || 'Mentor',
                  studentName: schedule.studentName || 'Student',
                  courseName: schedule.course || 'Coding Track',
                  classDate: schedule.date,
                  classTime: schedule.time,
                  duration: schedule.duration || 60,
                  rawMeetLink: meetingLink,
                  link: meetingLink,
                  meetLink: meetingLink,
                  reminderType: milestone
                }
              })
            });
            dispatched.push({ type: 'tutor', email: schedule.tutorEmail, milestone, scheduleId: schedule.id });
          } catch (e) {
            console.error('[AutoReminders] Tutor dispatch error:', e.message);
          }
        }
      }

      updatedSchedules.push(schedule);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        evaluatedCount: schedules.length,
        dispatchedCount: dispatched.length,
        dispatches: dispatched,
        updatedSchedules
      })
    };
  } catch (err) {
    console.error('[AutoReminders] Top-level handler failure:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
