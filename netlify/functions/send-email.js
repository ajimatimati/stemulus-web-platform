/**
 * STEMulus Email Proxy — Netlify Function
 * Routes all transactional email through Resend API.
 * RESEND_API_KEY is stored as a Netlify environment variable — never in client JS.
 *
 * Supported types:
 *   enrollment  → admin alert + parent confirmation
 *   booking     → admin alert + parent confirmation
 *   contact     → admin alert only
 *   welcome     → parent welcome with temp password
 *   reminder    → class reminder (24h or 1h)
 *   schedule    → schedule change notice
 *   certificate → completion certificate notice
 *   custom      → generic send (admin dashboard compose)
 */

const ADMIN_EMAIL = 'admin@stemuluskidstech.com';
const FROM_ADDRESS = 'STEMulus Kids Tech <hello@portal.stemuluskidstech.com>';
const SITE_URL = 'https://stemuluskidstech.com';
const WHATSAPP_NUMBER = '2347052466716';

// ─── Brand colours for HTML emails ───────────────────────────────────────────
const C = {
  orange: '#F4600C',
  navy: '#1A237E',
  white: '#ffffff',
  bgLight: '#f8fafc',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

// ─── Shared HTML email shell ──────────────────────────────────────────────────
function shell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:${C.bgLight};font-family:'Helvetica Neue',Arial,sans-serif;color:#1e293b}
  .wrap{max-width:600px;margin:32px auto;background:${C.white};border-radius:12px;overflow:hidden;border:1px solid ${C.border}}
  .header{background:${C.navy};padding:28px 32px;text-align:center}
  .header img{height:56px;width:auto}
  .header-rule{height:4px;background:${C.orange};margin:0}
  .body{padding:32px}
  .body h2{margin:0 0 12px;font-size:1.4rem;color:${C.navy}}
  .body p{margin:0 0 16px;line-height:1.7;color:#374151;font-size:0.95rem}
  .info-box{background:${C.bgLight};border:1px solid ${C.border};border-radius:8px;padding:20px;margin:20px 0}
  .info-box table{width:100%;border-collapse:collapse}
  .info-box td{padding:6px 0;font-size:0.88rem;vertical-align:top}
  .info-box td:first-child{color:${C.textMuted};width:42%;font-weight:600}
  .id-badge{display:inline-block;background:${C.bgLight};border:1px dashed ${C.border};border-radius:6px;padding:6px 16px;font-family:monospace;font-weight:700;color:${C.navy};font-size:0.95rem;margin:8px 0 20px}
  .btn{display:inline-block;background:${C.orange};color:${C.white}!important;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;font-size:0.92rem;margin-top:8px}
  .btn-green{background:#25D366}
  .footer{padding:20px 32px;background:${C.bgLight};border-top:1px solid ${C.border};text-align:center;font-size:0.78rem;color:${C.textMuted}}
  .footer a{color:${C.orange};text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${SITE_URL}/logo-light.jpg" alt="STEMulus Kids Tech">
  </div>
  <div class="header-rule"></div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">
    STEMulus Kids Tech &mdash; Private 1-on-1 Coding for Kids &bull; <a href="${SITE_URL}">${SITE_URL.replace('https://', '')}</a><br>
    <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>
  </div>
</div>
</body>
</html>`;
}

// ─── Email template builders ──────────────────────────────────────────────────

function tplEnrollmentAdmin(d) {
  const children = (d.children || []).map((c, i) =>
    `<tr><td>#${i + 1} Child</td><td><strong>${c.firstName} ${c.lastName}</strong> &mdash; Age ${c.age}, ${c.program}</td></tr>`
  ).join('');

  return {
    subject: `[New Enrollment] ${d.studentFirstName} ${d.studentLastName} &mdash; ${d.enrollmentId}`,
    html: shell('New Enrollment', `
      <h2>New Enrollment Received</h2>
      <p>A new enrollment has just been submitted via the website.</p>
      <div class="id-badge">${d.enrollmentId}</div>
      <div class="info-box">
        <table>
          <tr><td>Parent</td><td><strong>${d.parentName}</strong></td></tr>
          <tr><td>Email</td><td><a href="mailto:${d.email}">${d.email}</a></td></tr>
          <tr><td>Phone</td><td>${d.phone}</td></tr>
          <tr><td>Referral</td><td>${d.referral || 'Not specified'}</td></tr>
          <tr><td>Submitted</td><td>${new Date().toLocaleString('en-GB')}</td></tr>
          ${children}
        </table>
      </div>
      <a class="btn btn-green" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Following up on enrollment ${d.enrollmentId} for ${d.studentFirstName}`)}" target="_blank">Reply on WhatsApp</a>
    `)
  };
}

function tplEnrollmentParent(d) {
  return {
    subject: `Welcome to STEMulus, ${d.studentFirstName}! Enrollment Received`,
    html: shell('Enrollment Confirmed', `
      <h2>Enrollment Received!</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>Thank you for enrolling <strong>${d.studentFirstName}</strong> at STEMulus! We've received your details and our team will be in touch within <strong>24 hours</strong> to confirm your first session.</p>
      <div class="id-badge">${d.enrollmentId}</div>
      <div class="info-box">
        <table>
          <tr><td>Student</td><td>${d.studentFirstName} ${d.studentLastName}</td></tr>
          <tr><td>Program</td><td>${d.program || 'To be confirmed'}</td></tr>
          <tr><td>Your Email</td><td>${d.email}</td></tr>
        </table>
      </div>
      <p>In the meantime, feel free to reach us on WhatsApp:</p>
      <a class="btn btn-green" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I just enrolled ${d.studentFirstName}. Enrollment ID: ${d.enrollmentId}`)}" target="_blank">Chat on WhatsApp</a>
    `)
  };
}

function tplBookingAdmin(d) {
  return {
    subject: `[Quick Booking] ${d.studentName} &mdash; ${d.bookingId}`,
    html: shell('Quick Booking', `
      <h2>New Trial Class Booking</h2>
      <div class="id-badge">${d.bookingId}</div>
      <div class="info-box">
        <table>
          <tr><td>Parent</td><td><strong>${d.parentName}</strong></td></tr>
          <tr><td>Child</td><td>${d.studentName}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${d.email}">${d.email}</a></td></tr>
          <tr><td>Phone</td><td>${d.phone}</td></tr>
          <tr><td>Preferred Contact</td><td>${d.contactPref}</td></tr>
          <tr><td>Submitted</td><td>${new Date().toLocaleString('en-GB')}</td></tr>
        </table>
      </div>
      <a class="btn btn-green" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Following up on quick booking ${d.bookingId} for ${d.studentName}`)}" target="_blank">Reply on WhatsApp</a>
    `)
  };
}

function tplBookingParent(d) {
  return {
    subject: `Free Trial Class Requested — STEMulus`,
    html: shell('Trial Class Booked', `
      <h2>Booking Received!</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>We've received your request for a free trial class for <strong>${d.studentName}</strong>. A mentor will contact you within <strong>2 hours</strong> to confirm your schedule and send a Zoom link.</p>
      <div class="id-badge">${d.bookingId}</div>
      <p>Your preferred contact channel: <strong>${d.contactPref}</strong></p>
      <a class="btn btn-green" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! Following up on quick booking ${d.bookingId} for ${d.studentName}`)}" target="_blank">Chat on WhatsApp for Instant Setup</a>
    `)
  };
}

function tplContactAdmin(d) {
  return {
    subject: `[New Message] ${d.firstName} ${d.lastName}: ${d.subject}`,
    html: shell('New Contact Message', `
      <h2>New Contact Form Submission</h2>
      <div class="info-box">
        <table>
          <tr><td>Name</td><td><strong>${d.firstName} ${d.lastName}</strong></td></tr>
          <tr><td>Email</td><td><a href="mailto:${d.email}">${d.email}</a></td></tr>
          <tr><td>Subject</td><td>${d.subject}</td></tr>
          <tr><td>Received</td><td>${new Date().toLocaleString('en-GB')}</td></tr>
        </table>
      </div>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:${C.bgLight};padding:16px;border-radius:8px;border:1px solid ${C.border}">${d.message}</p>
      <a class="btn" href="mailto:${d.email}?subject=${encodeURIComponent('Re: ' + d.subject)}">Reply by Email</a>
    `)
  };
}

function tplWelcome(d) {
  const classroomSection = d.classroomLink ? `
    <tr><td colspan="2" style="padding-top:12px;">
      <a href="${d.classroomLink}" style="display:inline-flex;align-items:center;gap:8px;background:#1a73e8;color:#fff;text-decoration:none;font-weight:700;padding:10px 20px;border-radius:8px;font-size:0.88rem;" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
        Join Google Classroom
      </a>
    </td></tr>` : '';

  const steps = [
    { n:'1', t:'Log in to your portal', d:'Use the credentials below to access your Parent Dashboard' },
    { n:'2', t:'Change your password', d:'Go to Settings in your portal and set a personal password' },
    d.classroomLink ? { n:'3', t:'Join Google Classroom', d:`Click the Google Classroom button above — ${d.studentName} will find class materials there` } : { n:'3', t:'Watch for your session invite', d:'Your first Zoom session link will be sent within 24 hours' },
    { n:'4', t:'Track progress', d:"After every session you'll receive a progress update in your portal" }
  ];

  const stepRows = steps.map(s => `
    <tr>
      <td style="padding:8px 0;vertical-align:top;">
        <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${C.orange};color:#fff;font-weight:700;font-size:0.8rem;text-align:center;line-height:28px;">${s.n}</span>
      </td>
      <td style="padding:8px 0 8px 12px;vertical-align:top;">
        <strong style="color:#1e293b;font-size:0.9rem;">${s.t}</strong><br>
        <span style="color:${C.textMuted};font-size:0.82rem;">${s.d}</span>
      </td>
    </tr>
  `).join('');

  return {
    subject: `Welcome to STEMulus — ${d.studentName}'s coding journey starts now!`,
    html: shell(`Welcome, ${d.parentName}!`, `
      <h2 style="font-size:1.5rem;margin:0 0 8px;">Welcome to STEMulus KidsTech!</h2>
      <p style="font-size:1rem;color:${C.textMuted};margin:0 0 24px;">Hi <strong style="color:#1e293b;">${d.parentName}</strong>, we're thrilled to have <strong style="color:${C.navy};">${d.studentName}</strong> join us for <strong>${d.courseName || 'their coding programme'}</strong>.</p>

      <div style="background:linear-gradient(135deg,${C.navy} 0%,#2d3f8c 100%);border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.72);font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Parent Portal Login</p>
        <p style="margin:0 0 16px;color:#fff;font-size:0.82rem;">Log in to track progress, view reports, and download certificates</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:6px 0 0 0;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;width:42%;">Email</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:0 6px 0 0;color:#fff;font-size:0.88rem;">${d.parentEmail}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 0 6px;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;">Temp Password</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 6px 0;font-family:monospace;font-weight:700;font-size:1rem;color:${C.orange};">${d.tempPassword}</td>
          </tr>
          ${classroomSection}
        </table>
        <p style="margin:16px 0 0;color:rgba(255,255,255,0.55);font-size:0.75rem;">Please change your password after your first login.</p>
      </div>

      <table style="width:100%;margin-bottom:20px;"><tbody>
        <tr>
          <td style="padding-right:8px;">
            <a href="${SITE_URL}/parent-login.html" style="display:block;background:${C.orange};color:#fff;text-align:center;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;font-size:0.95rem;">Log Into Parent Portal →</a>
          </td>
          <td style="padding-left:8px;">
            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I just received my welcome email for ' + d.studentName + '. Ready to get started!')}" style="display:block;background:#25D366;color:#fff;text-align:center;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;font-size:0.95rem;" target="_blank">Chat on WhatsApp</a>
          </td>
        </tr>
      </table>

      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-weight:700;color:${C.navy};font-size:0.92rem;">What happens next</p>
        <table style="width:100%;border-collapse:collapse;">${stepRows}</table>
      </div>

      <div style="background:#f0f4ff;border-radius:10px;padding:18px;border-left:4px solid ${C.navy};">
        <p style="margin:0 0 8px;font-weight:700;color:${C.navy};font-size:0.88rem;">Your Portal gives you access to:</p>
        <table style="width:100%;border-collapse:collapse;">
          ${[
            ['[Schedule]','Live session schedule','Never miss a class'],
            ['[Reports]','Progress reports','After every single session'],
            ['[Certificates]','Certificates','On successful completion'],
            ['[Alerts]','Notifications','Important updates in real time']
          ].map(([icon, title, sub]) => `<tr>
            <td style="width:28px;font-size:1.1rem;vertical-align:top;padding:5px 0;">${icon}</td>
            <td style="padding:5px 0 5px 8px;vertical-align:top;"><strong style="font-size:0.85rem;">${title}</strong><br><span style="font-size:0.78rem;color:${C.textMuted};">${sub}</span></td>
          </tr>`).join('')}
        </table>
      </div>

      <p style="margin:20px 0 0;font-size:0.88rem;color:${C.textMuted};line-height:1.7;">
        If you have any questions, please email us at <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};">${ADMIN_EMAIL}</a> or chat with us on WhatsApp.<br>
        We're happy to have <strong>${d.studentName}</strong> with us and look forward to a great learning experience together.<br><br>
        <strong>The STEMulus Kids Tech Team</strong>
      </p>
    `)
  };
}

function tplTutorWelcome(d) {
  const steps = [
    { n:'1', t:'Log in and change your password', d:'Use the credentials below, then update your password in portal settings' },
    { n:'2', t:'Review your assigned students', d:'Your dashboard shows all your students, their programs, and session history' },
    { n:'3', t:'Check your session schedule', d:"Your upcoming classes are listed on your dashboard. Zoom links are included." },
    { n:'4', t:'Log attendance after each session', d:'Use the Attendance Log to record topics covered, student performance, and notes' },
    { n:'5', t:'Submit monthly progress reports', d:'At the end of each month, submit a detailed report from your Tutor Portal' }
  ];

  const stepRows = steps.map(s => `
    <tr>
      <td style="padding:8px 0;vertical-align:top;">
        <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:${C.navy};color:#fff;font-weight:700;font-size:0.76rem;text-align:center;line-height:26px;">${s.n}</span>
      </td>
      <td style="padding:8px 0 8px 12px;vertical-align:top;">
        <strong style="color:#1e293b;font-size:0.88rem;">${s.t}</strong><br>
        <span style="color:${C.textMuted};font-size:0.8rem;">${s.d}</span>
      </td>
    </tr>
  `).join('');

  return {
    subject: `Welcome to the STEMulus Team, ${d.tutorName}!`,
    html: shell(`Welcome, ${d.tutorName}!`, `
      <h2 style="font-size:1.4rem;margin:0 0 8px;">Welcome to the STEMulus Teaching Team!</h2>
      <p style="color:${C.textMuted};margin:0 0 24px;">Hi <strong style="color:#1e293b;">${d.tutorName}</strong>, we're excited to have you on board as a STEMulus mentor. Here's everything you need to get started.</p>

      <div style="background:linear-gradient(135deg,${C.navy} 0%,#2d3f8c 100%);border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.72);font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Tutor Portal Login</p>
        <p style="margin:0 0 16px;color:#fff;font-size:0.82rem;">Select the <strong>Tutor</strong> tab on the login page</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:6px 0 0 0;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;width:42%;">Email</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:0 6px 0 0;color:#fff;font-size:0.88rem;">${d.tutorEmail}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 0 6px;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;">Temp Password</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 6px 0;font-family:monospace;font-weight:700;font-size:1rem;color:${C.orange};">${d.tempPassword}</td>
          </tr>
          ${d.subjects ? `<tr><td style="padding:6px 12px;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;">Subjects</td><td style="padding:6px 12px;color:#fff;font-size:0.88rem;">${d.subjects}</td></tr>` : ''}
        </table>
        <p style="margin:16px 0 0;color:rgba(255,255,255,0.55);font-size:0.75rem;">Please change your password after your first login.</p>
      </div>

      <table style="width:100%;margin-bottom:20px;"><tbody>
        <tr>
          <td style="padding-right:8px;">
            <a href="${SITE_URL}/parent-login.html?role=tutor" style="display:block;background:${C.orange};color:#fff;text-align:center;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;font-size:0.95rem;">Log Into Tutor Portal →</a>
          </td>
          <td style="padding-left:8px;">
            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, this is ' + d.tutorName + '. I just received my STEMulus tutor welcome email!')}" style="display:block;background:#25D366;color:#fff;text-align:center;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;font-size:0.95rem;" target="_blank">Confirm on WhatsApp</a>
          </td>
        </tr>
      </table>

      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-weight:700;color:${C.navy};font-size:0.92rem;">Getting started — 5 steps</p>
        <table style="width:100%;border-collapse:collapse;">${stepRows}</table>
      </div>

      <div style="background:#f0f4ff;border-radius:10px;padding:18px;border-left:4px solid ${C.navy};margin-bottom:20px;">
        <p style="margin:0 0 8px;font-weight:700;color:${C.navy};font-size:0.88rem;">Your Tutor Portal lets you:</p>
        <table style="width:100%;border-collapse:collapse;">
          ${[
            ['[Students]','View assigned students','Profiles, programs, and full session history'],
            ['[Attendance]','Log attendance & reports','After every class — topic covered, performance notes'],
            ['[Reports]','Submit monthly reports','Detailed progress summaries for admin review'],
            ['[Schedule]','Track your schedule','All upcoming sessions in one place']
          ].map(([icon, title, sub]) => `<tr>
            <td style="width:28px;font-size:1.1rem;vertical-align:top;padding:5px 0;">${icon}</td>
            <td style="padding:5px 0 5px 8px;vertical-align:top;"><strong style="font-size:0.85rem;">${title}</strong><br><span style="font-size:0.78rem;color:${C.textMuted};">${sub}</span></td>
          </tr>`).join('')}
        </table>
      </div>

      <p style="margin:0;font-size:0.88rem;color:${C.textMuted};line-height:1.7;">
        Questions? Email <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};">${ADMIN_EMAIL}</a> or WhatsApp us anytime.<br><br>
        We look forward to building great coding skills with you.<br>
        <strong>The STEMulus Admin Team</strong>
      </p>
    `)
  };
}

function tplReminder(d) {
  const label = d.reminderType === '24h' ? '24-Hour' : '1-Hour';
  return {
    subject: `${label} Reminder: ${d.studentName}'s class at ${d.classTime}`,
    html: shell(`${label} Class Reminder`, `
      <h2>${label} Class Reminder</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>This is a friendly reminder that <strong>${d.studentName}</strong> has a class coming up.</p>
      <div class="info-box">
        <table>
          <tr><td>Course</td><td>${d.courseName}</td></tr>
          <tr><td>Date</td><td>${d.classDate}</td></tr>
          <tr><td>Time</td><td><strong>${d.classTime}</strong></td></tr>
          <tr><td>Duration</td><td>${d.duration || 60} minutes</td></tr>
          <tr><td>Instructor</td><td>${d.mentorName}</td></tr>
        </table>
      </div>
      <a class="btn" href="${d.zoomLink || SITE_URL}">Join Class on Zoom</a>
    `)
  };
}

function tplScheduleChange(d) {
  return {
    subject: `Schedule Update: ${d.studentName}'s class has been rescheduled`,
    html: shell('Schedule Change', `
      <h2>Class Schedule Updated</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>${d.changeMessage || 'Please note the updated schedule for your upcoming class.'}</p>
      <div class="info-box">
        <table>
          <tr><td>Course</td><td>${d.courseName}</td></tr>
          <tr><td>Previous Date</td><td><s>${d.oldDate} at ${d.oldTime}</s></td></tr>
          <tr><td>New Date</td><td><strong>${d.newDate} at ${d.newTime}</strong></td></tr>
        </table>
      </div>
      <a class="btn btn-green" href="https://wa.me/${WHATSAPP_NUMBER}">Questions? Chat on WhatsApp</a>
    `)
  };
}

function tplCertificate(d) {
  return {
    subject: `${d.studentName} has completed ${d.courseName}!`,
    html: shell('Course Completion', `
      <h2>Certificate of Completion</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>Congratulations! <strong>${d.studentName}</strong> has successfully completed the <strong>${d.courseName}</strong> programme at STEMulus.</p>
      <div class="info-box">
        <table>
          <tr><td>Student</td><td>${d.studentName}</td></tr>
          <tr><td>Programme</td><td>${d.courseName}</td></tr>
          <tr><td>Completed</td><td>${d.completionDate}</td></tr>
        </table>
      </div>
      <p>You can view and download the certificate from the parent portal:</p>
      <a class="btn" href="${SITE_URL}/verify-certificate.html">View Certificate</a>
    `)
  };
}

function tplCertificateDelivery(d) {
  return {
    subject: d.studentName + ' has earned their STEMulus Certificate!',
    html: shell('Certificate of Completion', `
      <h2 style="font-size:1.5rem;margin:0 0 8px;">Congratulations, ${d.studentName}!</h2>
      <p>Hi <strong>${d.parentName}</strong>,</p>
      <p>We are thrilled to share that <strong>${d.studentName}</strong> has successfully completed <strong>${d.courseName}</strong> at STEMulus KidsTech.</p>

      <div style="background:linear-gradient(135deg,#1a237e 0%,#283593 50%,#3949ab 100%);border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:8px;"><span data-icon-3d="graduation-cap" data-icon-size="48"></span></div>
        <p style="color:#fff;font-family:Fredoka,sans-serif;font-size:1.3rem;font-weight:600;margin:0 0 4px;">${d.studentName}</p>
        <p style="color:rgba(255,255,255,0.7);font-size:0.85rem;margin:0 0 8px;">${d.courseName}</p>
        <p style="color:rgba(255,255,255,0.5);font-size:0.75rem;font-family:monospace;margin:0;">Credential ID: ${d.credentialId}</p>
      </div>

      <p>The certificate is attached to this email. You can also verify it anytime at:</p>
      <a href="${SITE_URL}/verify-certificate.html" style="display:inline-block;background:${C.orange};color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;font-size:0.92rem;margin:8px 0 16px;">Verify Certificate</a>

      <p style="font-size:0.85rem;color:#64748b;">Issued on ${d.issueDate}. Thank you for being part of the STEMulus family.</p>
    `)
  };
}

function tplCredentialsReset(d) {
  return {
    subject: 'Your New STEMulus Login Details',
    html: shell('New Login Credentials', `
      <h2 style="font-size:1.4rem;margin:0 0 8px;">Your login details have been reset</h2>
      <p>Hi <strong>${d.recipientName || d.recipientEmail}</strong>,</p>
      <p>An admin has reset your STEMulus portal password. Here are your new login details:</p>

      <div style="background:linear-gradient(135deg,${C.navy} 0%,#2d3f8c 100%);border-radius:12px;padding:24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:6px 0 0 0;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;width:40%;">Email</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.1);border-radius:0 6px 0 0;color:#fff;font-size:0.88rem;">${d.recipientEmail}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 0 6px;color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:600;text-transform:uppercase;">New Password</td>
            <td style="padding:6px 12px;background:rgba(255,255,255,0.08);border-radius:0 0 6px 0;font-family:monospace;font-weight:700;font-size:1.1rem;color:${C.orange};">${d.newPassword}</td>
          </tr>
        </table>
        <p style="margin:12px 0 0;color:rgba(255,255,255,0.55);font-size:0.75rem;">Please change your password after logging in.</p>
      </div>

      <a href="${d.portalUrl || SITE_URL + '/parent-login.html'}" style="display:inline-block;background:${C.orange};color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;font-size:0.92rem;margin:8px 0 16px;">Log In to Your Portal</a>

      <p style="font-size:0.85rem;color:#64748b;">If you did not request this reset, please contact <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};">${ADMIN_EMAIL}</a> immediately.</p>
    `)
  };
}

function tplCustom(d) {
  return {
    subject: d.subject,
    html: shell(d.subject, `
      <h2>${d.subject}</h2>
      <p>${(d.body || '').replace(/\n/g, '<br>')}</p>
    `)
  };
}

// ─── Template router ─────────────────────────────────────────────────────────

function buildEmail(type, data) {
  switch (type) {
    case 'enrollment_admin':   return { ...tplEnrollmentAdmin(data),  to: ADMIN_EMAIL };
    case 'enrollment_parent':  return { ...tplEnrollmentParent(data), to: data.email };
    case 'booking_admin':      return { ...tplBookingAdmin(data),     to: ADMIN_EMAIL };
    case 'booking_parent':     return { ...tplBookingParent(data),    to: data.email };
    case 'contact':            return { ...tplContactAdmin(data),     to: ADMIN_EMAIL };
    case 'welcome':            return { ...tplWelcome(data),          to: data.parentEmail };
    case 'reminder':           return { ...tplReminder(data),         to: data.parentEmail };
    case 'schedule':           return { ...tplScheduleChange(data),   to: data.parentEmail };
    case 'certificate':        return { ...tplCertificate(data),      to: data.parentEmail };
    case 'tutor-welcome':       return { ...tplTutorWelcome(data),    to: data.tutorEmail };
    case 'credentials-reset':   return { ...tplCredentialsReset(data),    to: data.recipientEmail || data.to };
    case 'certificate-delivery': return { ...tplCertificateDelivery(data), to: data.parentEmail,
      attachments: data.fileData ? [{ filename: data.fileName || 'STEMulus-Certificate.pdf', content: data.fileData.split(',')[1] || data.fileData, encoding: 'base64' }] : undefined };
    case 'custom':             return { ...tplCustom(data),           to: data.to };
    default: return null;
  }
}

// ─── Resend API call ─────────────────────────────────────────────────────────

async function sendViaResend(to, subject, html, attachments) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable not set');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Object.assign({ from: FROM_ADDRESS, to: Array.isArray(to)?to:[to], subject, html }, attachments ? { attachments } : {})),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Resend API error ${resp.status}: ${err}`);
  }
  return await resp.json();
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': 'https://stemuluskidstech.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { type, data } = payload;

  // Basic honeypot check
  if (data && data.honeypot) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  if (!type || !data) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing type or data' }) };
  }

  // Handle compound types that send multiple emails at once
  const types = type === 'enrollment'
    ? ['enrollment_admin', 'enrollment_parent']
    : type === 'booking'
    ? ['booking_admin', 'booking_parent']
    : [type];

  const results = [];
  for (const t of types) {
    const email = buildEmail(t, data);
    if (!email) {
      results.push({ type: t, error: 'Unknown email type' });
      continue;
    }
    try {
      const res = await sendViaResend(email.to, email.subject, email.html, email.attachments);
      results.push({ type: t, ok: true, id: res.id });
    } catch (err) {
      console.error(`[send-email] Failed to send ${t}:`, err.message);
      results.push({ type: t, ok: false, error: err.message });
    }
  }

  const allOk = results.every(r => r.ok);
  return {
    statusCode: allOk ? 200 : 207,
    headers: CORS,
    body: JSON.stringify({ ok: allOk, results }),
  };
};
