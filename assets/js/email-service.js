/**
 * STEMulus Email Service v2
 * All email now routes through /.netlify/functions/send-email (Resend API).
 * No keys are stored in this file. Public API is backwards-compatible with v1.
 */

const EmailService = (function () {

  const ENDPOINT = '/.netlify/functions/send-email';

  async function _post(type, data) {
    try {
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
      const json = await resp.json();
      if (!resp.ok && resp.status !== 207) throw new Error(json.error || 'Send failed');
      return { success: json.ok, results: json.results };
    } catch (err) {
      console.error('[EmailService]', type, err.message);
      return { success: false, error: err.message };
    }
  }

  // ── Public API (same shape as v1) ────────────────────────────────────────

  /**
   * Generic send: used by admin compose, quick-booking, etc.
   * options: { to, subject, body, studentName, ccParent? }
   */
  async function send(options) {
    return _post('custom', {
      to: options.to || 'admin@stemuluskidstech.com',
      subject: options.subject || 'Message from STEMulus',
      body: options.body || '',
      cc: options.ccParent || undefined,
    });
  }

  /**
   * Welcome email sent when a parent account is first created.
   * student: { parentEmail, parentName, name, course, tempPassword }
   */
  async function sendWelcomeEmail(student) {
    return _post('welcome', {
      parentEmail: student.parentEmail || student.email,
      parentName: student.parentName || student.name,
      studentName: student.name || student.studentName || 'Student',
      courseName: getCourseLabel(student.course || student.program),
      tempPassword: student.tempPassword || '(see admin portal)',
      classroomLink: student.classroomLink || '',
      meetLink: student.meetLink || student.googleMeetLink || 'https://meet.google.com/stm-prog-live',
      classSchedule: student.classSchedule || student.scheduleText || 'As agreed with your admissions coordinator',
    });
  }

  /**
   * Welcome email sent when a tutor account is first created.
   * tutor: { tutorEmail, tutorName, tempPassword, subjects }
   */
  async function sendTutorWelcomeEmail(tutor) {
    // tutor: { tutorEmail, tutorName, tempPassword, subjects }
    return _post('tutor-welcome', {
      tutorEmail: tutor.tutorEmail || tutor.email,
      tutorName: tutor.tutorName || tutor.name,
      tempPassword: tutor.tempPassword,
      subjects: tutor.subjects || ''
    });
  }

  /**
   * Class reminder email.
   * options: { student, schedule, type ('24h'|'1h'|'10m') }
   */
  async function sendReminderEmail(options) {
    const { student, schedule, type } = options;
    return _post('reminder', {
      parentEmail: (student && (student.parentEmail || student.email)) || (schedule && schedule.parentEmail),
      parentName: (student && (student.parentName || student.name)) || (schedule && schedule.parentName) || 'Parent',
      studentName: (student && (student.name || (student.firstName + ' ' + student.lastName))) || (schedule && schedule.studentName),
      courseName: getCourseLabel((schedule && schedule.course) || (student && student.course)),
      classDate: formatDate((schedule && schedule.date) || new Date()),
      classTime: (schedule && schedule.time) || '',
      duration: (schedule && schedule.duration) || 60,
      zoomLink: (schedule && schedule.link) || '',
      mentorName: (schedule && schedule.mentor) || 'Your Instructor',
      reminderType: type,
    });
  }

  /**
   * Tutor class reminder email (24h, 1h, 10m).
   * options: { tutor, student, schedule, type ('24h'|'1h'|'10m') }
   */
  async function sendTutorReminderEmail(options) {
    const { tutor, student, schedule, type } = options;
    const tutorEmail = (tutor && (tutor.email || tutor.tutorEmail)) || (schedule && schedule.tutorEmail);
    const tutorName = (tutor && (tutor.name || tutor.tutorName)) || (schedule && schedule.mentor) || 'Mentor';
    const studentName = (student && (student.name || (student.firstName + ' ' + student.lastName))) || (schedule && schedule.studentName);
    return _post('tutor-reminder', {
      tutorEmail,
      tutorName,
      studentName,
      parentEmail: (student && student.parentEmail) || (schedule && schedule.parentEmail) || '',
      courseName: getCourseLabel((schedule && schedule.course) || (student && student.course)),
      classDate: formatDate((schedule && schedule.date) || new Date()),
      classTime: (schedule && schedule.time) || '',
      duration: (schedule && schedule.duration) || 60,
      zoomLink: (schedule && schedule.link) || '',
      reminderType: type,
    });
  }

  /**
   * Schedule change notification.
   * options: { student, oldSchedule, newSchedule, message }
   */
  async function sendScheduleChangeEmail(options) {
    const { student, oldSchedule, newSchedule, message } = options;
    return _post('schedule', {
      parentEmail: student.parentEmail || student.email,
      parentName: student.parentName || student.name,
      studentName: student.name,
      courseName: getCourseLabel(newSchedule.course),
      oldDate: formatDate(oldSchedule.date),
      oldTime: oldSchedule.time,
      newDate: formatDate(newSchedule.date),
      newTime: newSchedule.time,
      changeMessage: message || '',
    });
  }

  /**
   * Certificate of completion email.
   * student: { parentEmail, parentName, name }  courseName: string
   */
  async function sendCertificateEmail(student, courseName) {
    return _post('certificate', {
      parentEmail: student.parentEmail || student.email,
      parentName: student.parentName || student.name,
      studentName: student.name,
      courseName,
      completionDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
    });
  }

  // No-op init kept so callers that do EmailService.init() don't break
  async function init() { return true; }

  // ── Utilities ─────────────────────────────────────────────────────────────

  function getCourseLabel(courseId) {
    const labels = {
      'junior-robotics':    'Junior Robotics',
      'python-programming': 'Python Programming',
      'web-design':         'Web Design & Development',
      'scratch-creators':   'Scratch Creators',
      'ai-explorers':       'AI Explorers',
      'creative-coding':    'Creative Coding',
      'digital-art':        'Digital Art',
      'arduino-robotics':   'Arduino & Robotics',
      'fullstack-web-dev':  'Full-Stack Web Development',
    };
    return labels[courseId] || courseId || 'STEMulus Programme';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return { init, send, sendWelcomeEmail, sendTutorWelcomeEmail, sendReminderEmail, sendTutorReminderEmail, sendScheduleChangeEmail, sendCertificateEmail };

})();

// Kept for backwards-compat: no actual initialisation needed
document.addEventListener('DOMContentLoaded', EmailService.init);
