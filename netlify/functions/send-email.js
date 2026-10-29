/**
 * STEMulus Email Proxy: Netlify Function
 * Routes all transactional email through Resend API.
 * Formatted to world-class tech company standards (Apple / Stripe / Linear caliber).
 * High-contrast, WCAG AAA/AA compliant, responsive, and strictly zero emojis.
 *
 * Supported types:
 *   enrollment           → admin alert + parent confirmation
 *   booking              → admin alert + parent confirmation
 *   contact              → admin alert only
 *   welcome              → parent welcome with portal credentials
 *   tutor-welcome        → tutor faculty welcome with portal credentials
 *   reminder             → class reminder (24h, 1h, 10m)
 *   tutor-reminder       → tutor session reminder
 *   schedule             → schedule change notice
 *   certificate          → completion certificate notice
 *   certificate-delivery → certificate delivery with verification link & PDF
 *   credentials-reset    → password reset notification
 *   custom               → generic send (admin dashboard compose)
 */

const ADMIN_EMAIL = 'admin@stemuluskidstech.com';
const ADMIN_ALERT_RECIPIENTS = ['admin@stemuluskidstech.com', 'stemuluskidstech@gmail.com'];
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'STEMulus Kids Tech <hello@stemuluskidstech.com>';
const SITE_URL = 'https://stemuluskidstech.com';
const WHATSAPP_NUMBER = '2347052466716';

// Brand design tokens
const C = {
  orange: '#F4600C',
  orangeDark: '#D44F00',
  navy: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  emerald: '#059669',
  emeraldDark: '#047857',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
};

// World-Class HTML Email Shell
function shell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title>
<!--[if mso]>
<style type="text/css">
  body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style type="text/css">
  body { margin: 0; padding: 0; background-color: ${C.slate50}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; }
  a { text-decoration: none; }
  .email-wrapper { width: 100%; background-color: ${C.slate50}; padding: 32px 12px; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: ${C.white}; border: 1px solid ${C.slate200}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04); }
  .email-header { background-color: ${C.white}; padding: 28px 36px 20px; border-bottom: 1px solid ${C.slate200}; text-align: left; }
  .header-logo { max-width: 172px; width: 172px; height: auto; display: block; border: 0; }
  .header-accent { height: 3px; background-color: ${C.orange}; width: 100%; }
  .email-body { padding: 36px 36px 28px; }
  .email-body h1 { margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: ${C.navy}; line-height: 1.3; letter-spacing: -0.02em; }
  .email-body h2 { margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: ${C.navy}; line-height: 1.35; letter-spacing: -0.01em; }
  .email-body p { margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 400; color: ${C.slate700}; line-height: 1.65; }
  .btn-primary { display: inline-block; background-color: ${C.orange}; color: ${C.white} !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 13px 26px; border-radius: 10px; text-decoration: none; text-align: center; border: 1px solid ${C.orangeDark}; box-shadow: 0 2px 6px rgba(244, 96, 12, 0.25); }
  .btn-secondary { display: inline-block; background-color: ${C.emerald}; color: ${C.white} !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 13px 26px; border-radius: 10px; text-decoration: none; text-align: center; border: 1px solid ${C.emeraldDark}; }
  .btn-outline { display: inline-block; background-color: ${C.white}; color: ${C.navy} !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 10px; text-decoration: none; text-align: center; border: 1px solid ${C.slate200}; }
  .badge-pill { display: inline-block; padding: 4px 10px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .email-footer { background-color: ${C.slate50}; padding: 24px 36px 32px; border-top: 1px solid ${C.slate200}; text-align: left; }
  .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: ${C.slate500}; margin: 0 0 8px 0; }
  .footer-links a { color: ${C.slate600}; text-decoration: underline; font-weight: 600; }
  @media only screen and (max-width: 620px) {
    .email-wrapper { padding: 12px 6px; }
    .email-container { border-radius: 12px; }
    .email-header { padding: 20px 20px 16px; }
    .email-body { padding: 24px 20px 20px; }
    .email-footer { padding: 20px 20px 24px; }
    .btn-primary, .btn-secondary, .btn-outline { display: block !important; width: 100% !important; box-sizing: border-box; margin-bottom: 10px; }
    .grid-cell { display: block !important; width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; }
  }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-container">
    <div class="header-accent"></div>
    <div class="email-header">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" valign="middle">
            <a href="${SITE_URL}" target="_blank">
              <img src="${SITE_URL}/logo.png" alt="STEMulus Kids Tech" class="header-logo" width="172">
            </a>
          </td>
          <td align="right" valign="middle">
            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:${C.slate500};text-transform:uppercase;letter-spacing:0.06em;">Official Communication</span>
          </td>
        </tr>
      </table>
    </div>
    <div class="email-body">
      ${bodyHtml}
    </div>
    <div class="email-footer">
      <p class="footer-text" style="font-weight:600;color:${C.slate700};">STEMulus Kids Technologies Ltd.</p>
      <p class="footer-text">
        Private 1-on-1 Coding, Robotics and Artificial Intelligence Mentorship for Young Innovators.<br>
        Website: <a href="${SITE_URL}" target="_blank" style="color:${C.orange};font-weight:600;">stemuluskidstech.com</a> &nbsp;|&nbsp; 
        Email: <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};font-weight:600;">${ADMIN_EMAIL}</a>
      </p>
      <p class="footer-text" style="font-size:11px;color:${C.slate400};margin-top:12px;margin-bottom:0;">
        Confidentiality Notice: This email and any attachments are intended solely for the designated recipient. If you received this transmission in error, please notify administration immediately.
      </p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Template Builders ────────────────────────────────────────────────────────

function tplEnrollmentAdmin(d) {
  const children = (d.children || []).map((c, i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Child #${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};"><strong>${c.firstName} ${c.lastName}</strong> &mdash; Age ${c.age}${c.birthday ? ` (DOB: ${c.birthday})` : ''}, Program: ${c.program}</td>
    </tr>
  `).join('');

  const primaryChildRow = (!d.children || !d.children.length) ? `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Student Details</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};"><strong>${d.studentFirstName} ${d.studentLastName}</strong> &mdash; Age ${d.studentAge}${d.studentBirthday ? ` (DOB: ${d.studentBirthday})` : ''}, Program: ${d.program || 'Not specified'}</td>
    </tr>
  ` : '';

  return {
    subject: `[New Enrollment] ${d.studentFirstName} ${d.studentLastName} &mdash; ${d.enrollmentId}`,
    html: shell('New Student Enrollment', `
      <h1>New Student Enrollment Received</h1>
      <p>A new student enrollment has been recorded through the admissions platform.</p>
      
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:12px;padding:20px;margin:20px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:16px;">
          ${d.enrollmentId}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Parent Name</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.parentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Parent Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.blue};"><a href="mailto:${d.email}" style="color:${C.blue};">${d.email}</a></td>
          </tr>
          ${d.studentEmail ? `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Student Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.studentEmail}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Phone / WhatsApp</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.phone}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Media Consent</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${['yes','granted','true'].includes(String(d.mediaConsent).toLowerCase()) ? C.emerald : C.slate600};">${['yes','granted','true'].includes(String(d.mediaConsent).toLowerCase()) ? 'Granted (Approved for celebrations &amp; showcase)' : 'Declined / Undisclosed'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Referral Source</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.referral || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Submission Timestamp</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;color:${C.slate600};">${new Date().toLocaleString('en-GB')}</td>
          </tr>
          ${children}
          ${primaryChildRow}
        </table>
      </div>

      <div style="margin-top:24px;">
        <a class="btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Following up on enrollment ${d.enrollmentId} for ${d.studentFirstName}`)}" target="_blank">Initiate Contact via WhatsApp</a>
      </div>
    `)
  };
}

function tplEnrollmentParent(d) {
  const bday = d.studentBirthday || (d.children && d.children[0] && d.children[0].birthday) || '';
  return {
    subject: `Enrollment Confirmed: Welcome to STEMulus, ${d.studentFirstName}!`,
    html: shell('Enrollment Confirmation', `
      <h1>Enrollment Received</h1>
      <p>Dear <strong>${d.parentName}</strong>,</p>
      <p>Thank you for enrolling <strong>${d.studentFirstName}</strong> with STEMulus Kids Technologies. We have successfully registered your admissions details.</p>
      
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:12px;padding:20px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.slate800};color:${C.white};font-family:monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:14px;">
          Reference ID: ${d.enrollmentId}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Student</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.studentFirstName} ${d.studentLastName}</td>
          </tr>
          ${bday ? `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Birthday (DOB)</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${bday}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Program</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.program || 'Curriculum Pathway Confirmed upon Intake'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Registered Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.email}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size:16px;margin-top:24px;">What Happens Next</h2>
      <p>An Academic Coordinator will review your enrollment and contact you within <strong>24 hours</strong> to finalize your schedule slot and assign your designated mentor.</p>

      <div style="margin-top:24px;">
        <a class="btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! Following up on enrollment ${d.enrollmentId} for ${d.studentFirstName}`)}" target="_blank">Connect with Admissions on WhatsApp</a>
      </div>
    `)
  };
}

function tplBookingAdmin(d) {
  return {
    subject: `[Trial Booking] ${d.studentName} &mdash; ${d.bookingId}`,
    html: shell('Trial Class Booking', `
      <h1>New Trial Class Booking</h1>
      <p>A new trial lesson request has been submitted.</p>
      
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:12px;padding:20px;margin:20px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:14px;">
          ${d.bookingId}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Parent Name</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.parentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Student Name</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.studentName}</td>
          </tr>
          ${d.studentBirthday ? `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Date of Birth</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.orange};">${d.studentBirthday} ${d.studentAge ? `(Age ${d.studentAge})` : ''}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Location / Country</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.country || 'Global'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.blue};"><a href="mailto:${d.email}" style="color:${C.blue};">${d.email}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Phone / WhatsApp</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.phone}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Lead Source</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.leadSource || d.referral || 'Website'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Preferred Channel</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.contactPref || 'WhatsApp'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Timestamp</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;color:${C.slate600};">${new Date().toLocaleString('en-GB')}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:24px;">
        <a class="btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Following up on trial booking ${d.bookingId} for ${d.studentName}`)}" target="_blank">Contact Parent on WhatsApp</a>
      </div>
    `)
  };
}

function tplBookingParent(d) {
  return {
    subject: `Trial Class Confirmation: STEMulus Coding Assessment`,
    html: shell('Trial Class Requested', `
      <h1>Free Trial Class Requested</h1>
      <p>Dear <strong>${d.parentName}</strong>,</p>
      <p>We have received your trial booking request for <strong>${d.studentName}</strong>. A dedicated mentor will reach out within <strong>2 hours</strong> to confirm your schedule and provide your live Zoom session link.</p>
      
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:12px;padding:20px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.slate800};color:${C.white};font-family:monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:14px;">
          Booking ID: ${d.bookingId}
        </div>
        <p style="margin:0;font-size:14px;color:${C.slate700};">
          Selected Contact Channel: <strong>${d.contactPref || 'WhatsApp'}</strong>
        </p>
      </div>

      <h2 style="font-size:16px;">What to Expect During the Trial</h2>
      <p>Our 45-minute discovery session features a 10-minute student skill evaluation, a 25-minute interactive coding build, and a 10-minute debrief with you to review learning recommendations.</p>

      <div style="margin-top:24px;">
        <a class="btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! Following up on quick booking ${d.bookingId} for ${d.studentName}`)}" target="_blank">Connect via WhatsApp for Instant Setup</a>
      </div>
    `)
  };
}

function tplContactAdmin(d) {
  return {
    subject: `[Contact Inquiry] ${d.firstName} ${d.lastName}: ${d.subject}`,
    html: shell('New Contact Inquiry', `
      <h1>New Contact Inquiry</h1>
      
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:12px;padding:20px;margin:20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Sender Name</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.firstName} ${d.lastName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Sender Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.blue};"><a href="mailto:${d.email}" style="color:${C.blue};">${d.email}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Subject</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.subject}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Received At</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;color:${C.slate600};">${new Date().toLocaleString('en-GB')}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size:15px;margin-top:20px;">Message Body</h2>
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:10px;padding:16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};line-height:1.65;white-space:pre-wrap;">${d.message}</div>

      <div style="margin-top:24px;">
        <a class="btn-primary" href="mailto:${d.email}?subject=${encodeURIComponent('Re: ' + d.subject)}">Reply by Email</a>
      </div>
    `)
  };
}

/**
 * World-Class Parent Welcome Onboarding Email
 * Matches exact structured reference specifications:
 * 1. Live Coding Sessions (Google Meet, WAT GMT+1 schedule)
 * 2. Google Classroom Learning Hub (materials, assignments, projects)
 * 3. Parent Portal Credentials (URL, email, temporary password, report tracking)
 * Pristine typography, clean high-contrast containers, zero emojis.
 */
function tplWelcome(d) {
  const studentName = d.studentName || d.studentFirstName || 'Young Innovator';
  const parentName = d.parentName || d.parentSalutation || 'Ma/Sir';
  const scheduleText = d.classSchedule || d.scheduleText || 'Wednesday 4:00 PM • Friday 4:00 PM (WAT, GMT+1)';
  const meetLink = d.meetLink || d.googleMeetLink || 'https://meet.google.com/gyd-fewb-cdh';
  const classroomLink = d.classroomLink || 'https://classroom.google.com/c/ODg2NTc4NzE1MTgz?cjc=sfgboast';
  const parentEmail = d.parentEmail || d.email || 'parent@stemuluskidstech.com';
  const tempPassword = d.tempPassword || 'STEM-2026';

  return {
    subject: `Parents Welcome to STEMulus Kids Tech: Official Onboarding for ${studentName}`,
    html: shell(`Welcome to STEMulus Kids Tech`, `
      <h1>Parents Welcome to STEMulus Kids Tech</h1>
      <p style="font-size:15px;color:${C.navy};margin:0 0 16px 0;">Dear <strong>${parentName}</strong>,</p>
      <p style="font-size:14px;color:${C.slate600};line-height:1.65;margin:0 0 20px 0;">
        We are pleased to welcome <strong>${studentName}</strong> to STEMulus Kids Tech. We are excited to have a new coder join our community and look forward to supporting the development of coding and technology skills.<br><br>
        To help you get started, please find the key information below.
      </p>

      <!-- Section 1: LIVE CODING SESSIONS -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
          Live Coding Sessions
        </div>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 16px 0;">
          Coding classes will be conducted live online via Google Meet. The same meeting link will be used for all scheduled sessions.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;margin-bottom:14px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Class Schedule</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${scheduleText}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Google Meet Link</td>
            <td style="padding:12px 16px;">
              <a href="${meetLink}" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;word-break:break-all;">${meetLink}</a>
            </td>
          </tr>
        </table>

        <div style="text-align:left;">
          <a class="btn-primary" href="${meetLink}" target="_blank" style="display:inline-block;padding:10px 18px;font-size:13px;">Launch Google Meet Classroom &rarr;</a>
        </div>
      </div>

      <!-- Section 2: GOOGLE CLASSROOM -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
          Google Classroom (Learning Hub)
        </div>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 16px 0;">
          Google Classroom will serve as the learning hub. This is where learning materials will be accessed, assignments will be received, projects will be submitted, and communication with the tutor can take place when needed outside live class sessions.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;margin-bottom:14px;">
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Classroom Invite</td>
            <td style="padding:12px 16px;">
              <a href="${classroomLink}" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;word-break:break-all;">${classroomLink}</a>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:${C.slate500};line-height:1.5;margin:0 0 14px 0;">
          Note: You may use an existing Google account or create a separate account for the coder.
        </p>

        <div style="text-align:left;">
          <a class="btn-secondary" href="${classroomLink}" target="_blank" style="display:inline-block;padding:10px 18px;font-size:13px;">Open Google Classroom &rarr;</a>
        </div>
      </div>

      <!-- Section 3: PARENT PORTAL ACCESS -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
          Parent Portal
        </div>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 16px 0;">
          You also have full access to our official Parent Portal, which allows you to stay informed about the learning journey, view session attendance records, inspect monthly badge progression, and track real-time progress reports.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;margin-bottom:14px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Portal URL</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};">
              <a href="${SITE_URL}/parent-login.html" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;">${SITE_URL}/parent-login.html</a>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Login Email</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${parentEmail}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Temporary Password</td>
            <td style="padding:12px 16px;">
              <span style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:15px;font-weight:800;color:${C.navy};background-color:${C.slate100};border:1px solid ${C.slate200};padding:4px 10px;border-radius:6px;letter-spacing:0.05em;display:inline-block;">${tempPassword}</span>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:${C.slate500};line-height:1.5;margin:0 0 14px 0;">
          Instructions: Sign in using your registered email and temporary password above. You will be prompted to create your secure permanent password upon first sign-in.
        </p>

        <div style="text-align:left;">
          <a class="btn-primary" href="${SITE_URL}/parent-login.html" target="_blank" style="display:inline-block;padding:10px 18px;font-size:13px;">Sign In to Parent Portal &rarr;</a>
        </div>
      </div>

      <!-- Assistance & Support -->
      <div style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:14px;padding:20px;margin:22px 0;">
        <h3 style="font-size:14px;font-weight:800;color:${C.navy};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px 0;">Assistance &amp; Inquiries</h3>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 14px 0;">
          If you have any questions or need assistance at any point, please feel free to contact us.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${C.slate600};">
              <strong>WhatsApp Support:</strong> <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello STEMulus Team, following up on onboarding for ' + studentName)}" target="_blank" style="color:${C.emerald};font-weight:700;text-decoration:none;">+234 705 246 6716</a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${C.slate600};">
              <strong>Academic Support Email:</strong> <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};font-weight:700;text-decoration:none;">${ADMIN_EMAIL}</a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:${C.slate600};line-height:1.65;margin:24px 0 0 0;">
        We are happy to have a new coder join STEMulus Kids Tech and look forward to a great learning experience together.<br><br>
        Sincerely,<br>
        <strong style="color:${C.navy};">STEMulus Kids Tech Team</strong>
      </p>
    `)
  };
}

/**
 * World-Class Tutor Welcome Onboarding Email
 * Comprehensive faculty onboarding communication:
 * 1. Faculty Portal Credentials
 * 2. Live Coding Sessions & Meeting Rooms
 * 3. Google Classroom Learning Hub Protocol
 * 4. Attendance Logging & Monthly Payouts
 */
function tplTutorWelcome(d) {
  const tutorName = d.tutorName || 'Faculty Instructor';
  const tutorEmail = d.tutorEmail || d.email || 'tutor@stemuluskidstech.com';
  const tempPassword = d.tempPassword || 'Tutor2026!';
  const assignedStudents = d.assignedStudents || d.studentName || 'Available on Faculty Roster';
  const curriculum = d.curriculum || d.courseName || d.subjects || 'Junior Scratch / Python Programming';
  const scheduleText = d.classSchedule || d.scheduleText || 'Wednesday 4:00 PM • Friday 4:00 PM (WAT, GMT+1)';
  const meetLink = d.meetLink || d.googleMeetLink || 'https://meet.google.com/gyd-fewb-cdh';
  const classroomLink = d.classroomLink || 'https://classroom.google.com/c/ODg2NTc4NzE1MTgz?cjc=sfgboast';

  return {
    subject: `Welcome to STEMulus Teaching Faculty: Portal Credentials for ${tutorName}`,
    html: shell(`Welcome, ${tutorName}!`, `
      <h1>Welcome to the STEMulus Teaching Faculty</h1>
      <p style="font-size:15px;color:${C.navy};margin:0 0 16px 0;">Dear <strong>${tutorName}</strong>,</p>
      <p style="font-size:14px;color:${C.slate600};line-height:1.65;margin:0 0 20px 0;">
        We are delighted to welcome you to the STEMulus instructional team. We are excited to have you guide and empower our young coders in developing critical computational, problem-solving, and technology skills.<br><br>
        Please review your teaching credentials, assigned student schedule, and instructional protocols below.
      </p>

      <!-- Section 1: FACULTY PORTAL CREDENTIALS -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
          Faculty Portal Credentials
        </div>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 16px 0;">
          Your official mentor account has been provisioned. Log in to access your student roster, session calendar, attendance logging console, and monthly payroll reports.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;margin-bottom:14px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Portal URL</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};">
              <a href="${SITE_URL}/tutor-login.html" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;">${SITE_URL}/tutor-login.html</a>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Faculty Email</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${tutorEmail}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Temporary Password</td>
            <td style="padding:12px 16px;">
              <span style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:15px;font-weight:800;color:${C.navy};background-color:${C.slate100};border:1px solid ${C.slate200};padding:4px 10px;border-radius:6px;letter-spacing:0.05em;display:inline-block;">${tempPassword}</span>
            </td>
          </tr>
        </table>

        <div style="text-align:left;">
          <a class="btn-primary" href="${SITE_URL}/tutor-login.html" target="_blank" style="display:inline-block;padding:10px 18px;font-size:13px;">Sign In to Faculty Portal &rarr;</a>
        </div>
      </div>

      <!-- Section 2: LIVE CODING SESSIONS -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
          Live Classroom &amp; Assigned Students
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;margin-bottom:14px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Assigned Student(s)</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${assignedStudents}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Curriculum Pathway</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${curriculum}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Teaching Schedule</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${scheduleText}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Persistent Meet Link</td>
            <td style="padding:12px 16px;">
              <a href="${meetLink}" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;word-break:break-all;">${meetLink}</a>
            </td>
          </tr>
          ${classroomLink ? `
          <tr>
            <td style="padding:12px 16px;border-top:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">Google Classroom</td>
            <td style="padding:12px 16px;border-top:1px solid ${C.slate200};">
              <a href="${classroomLink}" target="_blank" style="color:${C.blue};font-weight:700;font-size:13px;text-decoration:none;word-break:break-all;">${classroomLink}</a>
            </td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Section 3: INSTRUCTIONAL PROTOCOLS -->
      <div style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <h3 style="font-size:14px;font-weight:800;color:${C.navy};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px 0;">Mandatory Faculty Protocols</h3>
        <ol style="margin:0;padding-left:20px;font-size:13px;color:${C.slate600};line-height:1.7;">
          <li><strong>Punctuality:</strong> Launch the Google Meet room 5 minutes prior to class time.</li>
          <li><strong>Post-Session Attendance:</strong> Submit detailed session attendance logs within 2 hours of class completion via the Faculty Portal.</li>
          <li><strong>Monthly Evaluation Reports:</strong> Submit end-of-month progress evaluations for all assigned students to finalize verified payroll disbursement ($25.00/hour).</li>
          <li><strong>Classroom Hub:</strong> Share lesson recap notes, coding starter projects, and feedback via Google Classroom.</li>
        </ol>
      </div>

      <!-- Assistance & Lead Coordination -->
      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:20px;margin:22px 0;">
        <h3 style="font-size:14px;font-weight:800;color:${C.navy};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px 0;">Academic Coordination &amp; Lead Support</h3>
        <p style="font-size:13px;color:${C.slate600};line-height:1.6;margin:0 0 14px 0;">
          For emergency schedule adjustments, curriculum questions, or student technical assistance, contact Academic Operations immediately.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${C.slate600};">
              <strong>WhatsApp Faculty Dispatch:</strong> <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Academic Operations, this is ' + tutorName + ' confirming faculty onboarding.')}" target="_blank" style="color:${C.emerald};font-weight:700;text-decoration:none;">+234 705 246 6716</a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${C.slate600};">
              <strong>Faculty Coordination Email:</strong> <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};font-weight:700;text-decoration:none;">${ADMIN_EMAIL}</a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:${C.slate600};line-height:1.65;margin:24px 0 0 0;">
        We look forward to an inspiring, high-impact teaching collaboration with you.<br><br>
        Sincerely,<br>
        <strong style="color:${C.navy};">The STEMulus Academic Team</strong>
      </p>
    `)
  };
}

function extractRawMeetUrl(d) {
  const candidates = [d.rawMeetLink, d.meetLink, d.zoomLink, d.link].filter(Boolean);
  for (const c of candidates) {
    const str = String(c).trim();
    if (str.includes('join-class.html')) {
      try {
        const u = new URL(str, SITE_URL);
        const inner = u.searchParams.get('url');
        if (inner && inner.startsWith('http')) return inner;
      } catch (e) {}
    } else if (str.startsWith('http')) {
      return str;
    }
  }
  return 'https://meet.google.com/stm-prog-live';
}

function buildPortalClassroomUrl(d, role) {
  if (d.portalLaunchUrl && String(d.portalLaunchUrl).includes('join-class.html')) {
    return String(d.portalLaunchUrl).trim();
  }
  if (d.link && String(d.link).includes('join-class.html')) {
    return String(d.link).trim();
  }
  const rawMeetUrl = extractRawMeetUrl(d);
  const scheduleId = d.scheduleId || d.id || ('ses-' + String(d.studentName || 'class').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  const params = new URLSearchParams();
  params.set('id', String(scheduleId));
  params.set('role', role === 'tutor' ? 'tutor' : 'student');
  if (d.studentId) params.set('studentId', String(d.studentId));
  if (d.studentName) params.set('student', String(d.studentName));
  if (d.tutorName || d.mentorName) params.set('tutor', String(d.tutorName || d.mentorName));
  if (d.tutorEmail) params.set('tutorEmail', String(d.tutorEmail));
  if (d.courseName || d.course) params.set('course', String(d.courseName || d.course));
  if (d.rawDate) params.set('date', String(d.rawDate));
  if (d.classTime || d.time) params.set('time', String(d.classTime || d.time));
  params.set('url', rawMeetUrl);
  return `${SITE_URL}/join-class.html?${params.toString()}`;
}

function tplReminder(d) {
  const label = d.reminderType === '24h' ? '24-Hour' : (d.reminderType === '10m' ? '10-Minute' : '1-Hour');
  const isUrgent = d.reminderType === '10m';
  const rawMeetUrl = extractRawMeetUrl(d);
  const portalLaunchUrl = buildPortalClassroomUrl(d, 'student');
  const isMeet = rawMeetUrl.includes('meet.google.com');
  const isZoom = rawMeetUrl.includes('zoom.us');
  const platformName = isMeet ? 'Google Meet' : (isZoom ? 'Zoom' : 'Live Classroom');

  let subjectTitle;
  if (isUrgent) {
    subjectTitle = `[STARTING IN 10 MINS] Live Coding Class: ${d.studentName} with ${d.mentorName || 'Mentor'}`;
  } else if (d.reminderType === '1h') {
    subjectTitle = `[Class in 1 Hour] ${d.studentName}'s coding session at ${d.classTime || d.time} (WAT)`;
  } else {
    subjectTitle = `[24-Hour Reminder] ${d.studentName}'s coding session tomorrow at ${d.classTime || d.time} (WAT)`;
  }

  return {
    subject: subjectTitle,
    html: shell(`${label} Class Reminder`, `
      <h1>${isUrgent ? 'Class Launching in 10 Minutes' : label + ' Session Reminder'}</h1>
      <p>Dear <strong>${d.parentName || 'Parent'}</strong>,</p>
      <p>${isUrgent ? `The 1-on-1 live coding session for <strong>${d.studentName}</strong> is launching in 10 minutes.` : `This is your automated schedule reminder that <strong>${d.studentName}</strong> has an upcoming 1-on-1 coding class scheduled.`}</p>

      <!-- Prominent Strategic Meeting Room Card -->
      <div style="background-color:${C.navy};border-radius:14px;padding:22px;margin:24px 0;text-align:center;box-shadow:0 8px 24px rgba(15,23,42,0.15);">
        <div style="display:inline-block;background-color:rgba(255,255,255,0.15);color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 12px;border-radius:999px;margin-bottom:12px;">
          ${platformName} Classroom &bull; Portal Companion Active
        </div>
        <h3 style="color:${C.white};font-size:18px;font-weight:800;margin:0 0 14px 0;letter-spacing:-0.01em;">
          ${isUrgent ? 'The Meeting Room Is Open &bull; Join Now' : '1-Click Portal Classroom Launch'}
        </h3>
        <div style="margin:14px 0;">
          <a class="btn-primary" href="${portalLaunchUrl}" target="_blank" style="display:inline-block;background-color:${C.orange};color:${C.white};font-size:15px;font-weight:800;padding:14px 34px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(244,96,12,0.4);">
            ${isUrgent ? 'Launch Live Classroom Now &rarr;' : 'Join ' + platformName + ' via Portal &rarr;'}
          </a>
        </div>
        <p style="font-size:12px;color:#CBD5E1;margin:12px 0 4px 0;line-height:1.45;">
          Portal Session Launch Link (Activates Live Attendance &amp; ${platformName}):<br>
          <a href="${portalLaunchUrl}" target="_blank" style="color:#60A5FA;font-weight:700;text-decoration:underline;word-break:break-all;">${portalLaunchUrl}</a>
        </p>
        <p style="font-size:11px;color:#94A3B8;margin:6px 0 0 0;line-height:1.4;">
          Direct ${platformName} Room: <a href="${rawMeetUrl}" target="_blank" style="color:#94A3B8;text-decoration:underline;word-break:break-all;">${rawMeetUrl}</a>
        </p>
      </div>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Student</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.studentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Curriculum</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.courseName || d.course}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Date</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.classDate || d.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Scheduled Time</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;font-weight:800;color:${C.orange};">${d.classTime || d.time} (WAT)</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Session Duration</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.duration || 60} Minutes</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Assigned Mentor</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.mentorName || 'STEMulus Faculty Mentor'}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:${C.slate500};line-height:1.5;">
        <strong>Readiness Checklist:</strong> Please ensure the student has their laptop charged, microphone/webcam connected, and clicks the Portal Session Launch Link 5 minutes prior to start time so the automated classroom radar registers their arrival.
      </p>
    `)
  };
}

function tplTutorReminder(d) {
  const label = d.reminderType === '24h' ? '24-Hour' : (d.reminderType === '10m' ? '10-Minute' : '1-Hour');
  const isUrgent = d.reminderType === '10m';
  const rawMeetUrl = extractRawMeetUrl(d);
  const portalLaunchUrl = buildPortalClassroomUrl(d, 'tutor');
  const isMeet = rawMeetUrl.includes('meet.google.com');
  const isZoom = rawMeetUrl.includes('zoom.us');
  const platformName = isMeet ? 'Google Meet' : (isZoom ? 'Zoom' : 'Live Classroom');
  const attendanceUrl = `${SITE_URL}/tutor-attendance-create.html?scheduleId=${encodeURIComponent(d.scheduleId || '')}&studentId=${encodeURIComponent(d.studentId || '')}&date=${encodeURIComponent(d.rawDate || '')}&course=${encodeURIComponent(d.courseName || d.course || '')}`;

  let subjectTitle;
  if (isUrgent) {
    subjectTitle = `[STARTING IN 10 MINS] Faculty Session: ${d.studentName} at ${d.classTime || d.time}`;
  } else if (d.reminderType === '1h') {
    subjectTitle = `[Class in 1 Hour] Faculty Briefing: 1-on-1 with ${d.studentName} at ${d.classTime || d.time}`;
  } else {
    subjectTitle = `[24-Hour Reminder] Faculty Schedule: ${d.studentName} tomorrow at ${d.classTime || d.time}`;
  }

  return {
    subject: subjectTitle,
    html: shell(`${label} Faculty Reminder`, `
      <h1>${isUrgent ? 'Session Launching in 10 Minutes' : label + ' Session Reminder'}</h1>
      <p>Dear <strong>${d.tutorName || d.mentorName || 'Mentor'}</strong>,</p>
      <p>${isUrgent ? `Your scheduled 1-on-1 teaching session with <strong>${d.studentName}</strong> starts in 10 minutes.` : `This is your automated instructional reminder for your upcoming session with <strong>${d.studentName}</strong>.`}</p>

      <!-- Prominent Strategic Meeting Room Card for Tutor -->
      <div style="background-color:${C.navy};border-radius:14px;padding:22px;margin:24px 0;text-align:center;box-shadow:0 8px 24px rgba(15,23,42,0.15);">
        <div style="display:inline-block;background-color:rgba(255,255,255,0.15);color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 12px;border-radius:999px;margin-bottom:12px;">
          ${platformName} Faculty Room &bull; Auto-Activates Portal Telemetry
        </div>
        <h3 style="color:${C.white};font-size:18px;font-weight:800;margin:0 0 10px 0;letter-spacing:-0.01em;">
          ${isUrgent ? 'Launch Classroom via Portal &bull; Student Waiting' : '1-Click Faculty Portal Classroom Launch'}
        </h3>
        <p style="font-size:12px;color:#CBD5E1;margin:0 auto 16px auto;max-width:460px;line-height:1.5;">
          Clicking the button or link below opens your <strong>STEMulus Classroom Companion</strong> (activating live attendance radar, duration tracking &amp; safeguarding) and launches your <strong>${platformName}</strong> session automatically.
        </p>
        <div style="margin:14px 0;">
          <a class="btn-primary" href="${portalLaunchUrl}" target="_blank" style="display:inline-block;background-color:${C.blue};color:${C.white};font-size:15px;font-weight:800;padding:14px 34px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(37,99,235,0.4);">
            ${isUrgent ? 'Launch Classroom &amp; Activate Portal Now &rarr;' : 'Open ' + platformName + ' via Portal Companion &rarr;'}
          </a>
        </div>
        <p style="font-size:12px;color:#CBD5E1;margin:14px 0 4px 0;line-height:1.45;">
          Exact Portal Session Link (Click directly from email &mdash; no portal login required):<br>
          <a href="${portalLaunchUrl}" target="_blank" style="color:#60A5FA;font-weight:700;text-decoration:underline;word-break:break-all;">${portalLaunchUrl}</a>
        </p>
        <p style="font-size:11px;color:#94A3B8;margin:6px 0 0 0;line-height:1.4;">
          Backup Direct ${platformName} URL: <a href="${rawMeetUrl}" target="_blank" style="color:#94A3B8;text-decoration:underline;word-break:break-all;">${rawMeetUrl}</a>
        </p>
      </div>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Student</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.studentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Course Track</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.courseName || d.course}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Date</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.classDate || d.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Scheduled Time</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;font-weight:800;color:${C.orange};">${d.classTime || d.time} (WAT)</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Duration</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.duration || 60} Minutes</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:${C.slate600};line-height:1.5;">
        <strong>Faculty Protocol:</strong> Click the Portal Session Link above 5 minutes early and keep the companion tab open while teaching. Submit session attendance immediately upon class completion via the <a href="${attendanceUrl}" style="color:${C.orange};font-weight:700;">1-Click Attendance Log</a> to ensure timely administrative payroll verification.
      </p>
    `)
  };
}

function tplScheduleChange(d) {
  return {
    subject: `Schedule Update: ${d.studentName}'s class has been rescheduled`,
    html: shell('Schedule Update', `
      <h1>Class Schedule Updated</h1>
      <p>Dear <strong>${d.parentName}</strong>,</p>
      <p>${d.changeMessage || 'Please note the revised schedule for your upcoming 1-on-1 coding class.'}</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Curriculum</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.courseName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Previous Schedule</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.slate500};text-decoration:line-through;">${d.oldDate} at ${d.oldTime}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">New Confirmed Schedule</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;font-weight:800;color:${C.emerald};">${d.newDate} at ${d.newTime}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:24px;">
        <a class="btn-secondary" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">Questions? Chat with Coordinator on WhatsApp</a>
      </div>
    `)
  };
}

function tplCertificate(d) {
  return {
    subject: `Certificate Awarded: ${d.studentName} has completed ${d.courseName}!`,
    html: shell('Course Completion Certificate', `
      <h1>Certificate of Completion</h1>
      <p>Dear <strong>${d.parentName}</strong>,</p>
      <p>Congratulations! <strong>${d.studentName}</strong> has successfully completed the <strong>${d.courseName}</strong> curriculum pathway at STEMulus Kids Technologies.</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Graduate</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.studentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Program</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${d.courseName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Completion Date</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:600;color:${C.navy};">${d.completionDate}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:24px;">
        <a class="btn-primary" href="${SITE_URL}/verify-certificate.html">View &amp; Verify Official Certificate &rarr;</a>
      </div>
    `)
  };
}

function tplCertificateDelivery(d) {
  return {
    subject: `Official STEMulus Certificate of Completion &mdash; ${d.studentName}`,
    html: shell('Certificate Delivery', `
      <h1>Congratulations, ${d.studentName}!</h1>
      <p>Dear <strong>${d.parentName}</strong>,</p>
      <p>We are proud to present the official Certificate of Completion for <strong>${d.studentName}</strong>, celebrating the successful completion of the <strong>${d.courseName}</strong> program.</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:16px;padding:32px 24px;margin:24px 0;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:${C.navy};color:${C.white};text-align:center;line-height:56px;margin-bottom:16px;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:18px;font-weight:800;color:${C.orange};">&#9733;</span>
        </div>
        <h2 style="font-size:20px;color:${C.navy};margin:0 0 6px 0;">${d.studentName}</h2>
        <p style="font-size:14px;color:${C.slate600};margin:0 0 14px 0;font-weight:600;">${d.courseName}</p>
        <div style="display:inline-block;background-color:${C.white};border:1px solid ${C.slate200};padding:6px 14px;border-radius:8px;">
          <span style="font-family:monospace;font-size:12px;font-weight:700;color:${C.slate700};">Credential ID: ${d.credentialId}</span>
        </div>
      </div>

      <p style="font-size:14px;color:${C.slate600};">
        The official certificate document is attached to this email. You may also view and verify the cryptographically certified record at any time:
      </p>

      <div style="margin:24px 0;">
        <a class="btn-primary" href="${SITE_URL}/verify-certificate.html?id=${encodeURIComponent(d.credentialId || '')}">Verify Certificate Online &rarr;</a>
      </div>

      <p style="font-size:12px;color:${C.slate500};margin-top:20px;">
        Issued on ${d.issueDate || new Date().toLocaleDateString('en-GB')}. STEMulus Kids Technologies Certification Authority.
      </p>
    `)
  };
}

function tplCredentialsReset(d) {
  return {
    subject: 'Security Notice: Your Updated STEMulus Portal Credentials',
    html: shell('Portal Security Credentials', `
      <h1>Security Credentials Reset</h1>
      <p>Dear <strong>${d.recipientName || d.recipientEmail}</strong>,</p>
      <p>An authorized administrator has generated new access credentials for your STEMulus account. Please find your updated credentials below:</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:24px;margin:24px 0;">
        <div style="display:inline-block;background-color:${C.navy};color:${C.white};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:6px;margin-bottom:16px;">
          Updated Credentials
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.white};border:1px solid ${C.slate200};border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;width:38%;">Account Email</td>
            <td style="padding:12px 16px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${d.recipientEmail}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;font-weight:700;color:${C.slate600};text-transform:uppercase;letter-spacing:0.05em;">New Temporary Password</td>
            <td style="padding:12px 16px;">
              <span style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:16px;font-weight:700;color:${C.navy};background-color:${C.slate100};border:1px solid ${C.slate200};padding:4px 12px;border-radius:6px;letter-spacing:0.05em;display:inline-block;">${d.newPassword}</span>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0 0;font-size:12px;color:${C.slate500};line-height:1.5;">
          For account security, you will be prompted to update this temporary password upon signing in.
        </p>
      </div>

      <div style="margin:24px 0;">
        <a class="btn-primary" href="${d.portalUrl || SITE_URL + '/parent-login.html'}">Access Portal Sign-In &rarr;</a>
      </div>

      <p style="font-size:13px;color:${C.slate500};margin-top:20px;line-height:1.5;">
        Security Notice: If you did not request this credential change, please alert administration immediately at <a href="mailto:${ADMIN_EMAIL}" style="color:${C.orange};font-weight:600;">${ADMIN_EMAIL}</a>.
      </p>
    `)
  };
}

function tplMonthlyReportParent(d) {
  const studentName = d.studentName || 'Student';
  const month = d.month || 'Current Evaluation Period';
  const grade = d.grade || d.overallGrade || 'A';
  const course = d.course || 'Coding & Robotics';
  const tutorName = d.tutorName || 'Assigned Instructor';
  const directorNote = d.directorNote || d.adminNotes || 'Student has demonstrated outstanding progress and problem-solving growth this month.';

  return {
    subject: `Official Academic Progress Report: ${studentName} (${month})`,
    html: shell(`Official Progress Report — ${studentName}`, `
      <div style="margin-bottom:20px;">
        <span class="badge-pill" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;">ACADEMIC BOARD EVALUATION</span>
      </div>
      <h1>Monthly Progress Report Approved</h1>
      <p>Dear Parent,</p>
      <p>The monthly academic evaluation for <strong>${studentName}</strong> covering <strong>${month}</strong> in <strong>${course}</strong> has been reviewed and officially approved by the Academic Director.</p>
      
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #059669;border-radius:12px;padding:20px;margin:24px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Overall Academic Grade</div>
            <div style="font-size:28px;font-weight:900;color:#059669;">${grade}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Lead Instructor</div>
            <div style="font-size:14px;font-weight:700;color:#1E293B;">${tutorName}</div>
          </div>
        </div>
        <div style="border-top:1px solid #E2E8F0;padding-top:12px;font-size:13px;color:#334155;line-height:1.6;">
          <strong>Director's Note:</strong> “${directorNote}”
        </div>
      </div>

      <p>You can review the full evaluation metrics, mastered programming concepts, and print or download the official verification-stamped PDF report inside your parent portal.</p>
      <div style="margin:28px 0;">
        <a href="${SITE_URL}/parent-progress.html" class="btn-primary">View &amp; Download Official PDF Report</a>
      </div>
      <p style="font-size:13px;color:#64748B;">If you have any questions regarding your child's curriculum milestone progression, our academic advisors are always available via WhatsApp at <strong>+234 705 246 6716</strong>.</p>
    `)
  };
}

function tplMonthlyReportRevision(d) {
  const studentName = d.studentName || 'Student';
  const month = d.month || 'Evaluation';
  const reason = d.rejectionReason || 'Please review observations and resubmit.';

  return {
    subject: `Report Revision Requested: ${studentName} (${month})`,
    html: shell(`Report Revision Requested`, `
      <div style="margin-bottom:20px;">
        <span class="badge-pill" style="background:#FFF1F2;color:#E11D48;border:1px solid #FECDD3;">ACADEMIC REVIEW ACTION REQUIRED</span>
      </div>
      <h1>Monthly Report Revision Requested</h1>
      <p>Hello,</p>
      <p>Your submitted monthly evaluation report for <strong>${studentName}</strong> (${month}) requires revision prior to director approval and release to the parent.</p>
      
      <div style="background:#FFF1F2;border:1px solid #FECDD3;border-left:4px solid #E11D48;border-radius:12px;padding:20px;margin:24px 0;">
        <div style="font-size:11px;font-weight:800;color:#9F1239;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Admin Feedback &amp; Adjustments Needed:</div>
        <div style="font-size:14px;color:#881337;font-style:italic;line-height:1.6;">“${reason}”</div>
      </div>

      <p>Please log into your Tutor Portal to edit the report entries and resubmit for immediate review.</p>
      <div style="margin:28px 0;">
        <a href="${SITE_URL}/tutor-monthly-report.html" class="btn-primary">Open Tutor Report Editor</a>
      </div>
    `)
  };
}

function tplCustom(d) {
  const isHtml = /<[a-z][\s\S]*>/i.test(d.body || '');
  const content = isHtml ? (d.body || '') : (d.body || '').replace(/\n/g, '<br>');
  return {
    subject: d.subject || 'Communication from STEMulus Kids Technologies',
    html: shell(d.subject || 'STEMulus Communication', `
      <h1>${d.subject || 'Message from STEMulus'}</h1>
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;color:${C.navy};line-height:1.65;margin:20px 0;">
        ${content}
      </div>
    `)
  };
}

function tplTuitionReminderParent(d) {
  const bankName = d.bankName || 'Wema Nigeria';
  const accountName = d.accountName || 'STEMulus innovation Limited';
  const accountNumber = d.accountNumber || '0128062292';
  const usdAccountNumber = d.usdAccountNumber || '0622219817';
  const amount = d.amount || '₦35,000';
  const dueDate = d.dueDate || 'End of Month';
  const studentName = d.studentName || 'Student';
  const courseName = d.courseName || 'Coding Track';

  return {
    subject: `Tuition Renewal Notice: ${studentName}'s Monthly Learning Cycle Due ${dueDate}`,
    html: shell('Tuition Renewal Reminder', `
      <h1>Monthly Learning Cycle Renewal</h1>
      <p>Dear <strong>${d.parentName || 'Parent'}</strong>,</p>
      <p>This is a cordial advisory that <strong>${studentName}</strong>'s 1-month tuition cycle for the <strong>${courseName}</strong> program is scheduled for renewal on <strong>${dueDate}</strong>.</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Student</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${studentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Curriculum</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${courseName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Renewal Due Date</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.orange};">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Monthly Tuition</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;font-weight:800;color:${C.emerald};">${amount}</td>
          </tr>
        </table>
      </div>

      <div style="background-color:${C.blueLight};border:1px solid #BFDBFE;border-radius:14px;padding:20px;margin:20px 0;">
        <h2 style="font-size:15px;margin:0 0 10px 0;color:${C.blue};">Settlement Bank Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:${C.slate600};font-weight:600;width:35%;">Bank:</td>
            <td style="padding:4px 0;font-size:14px;color:${C.navy};font-weight:700;">${bankName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:${C.slate600};font-weight:600;">Account Name:</td>
            <td style="padding:4px 0;font-size:14px;color:${C.navy};font-weight:700;">${accountName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:${C.slate600};font-weight:600;">Account Number:</td>
            <td style="padding:4px 0;font-size:16px;color:${C.navy};font-weight:800;font-family:monospace;letter-spacing:1px;">${accountNumber}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:${C.slate600};line-height:1.6;">
        Kindly send proof of payment via WhatsApp to <strong>+${WHATSAPP_NUMBER}</strong> or reply to this email so our administrative team can update ${studentName}'s learning ledger and provide your official receipt.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a class="btn-primary" href="${SITE_URL}/parent-dashboard.html" target="_blank" style="font-size:15px;padding:14px 32px;">
          Open Parent Portal &rarr;
        </a>
      </div>
    `)
  };
}

function tplTuitionAlertAdmin(d) {
  const studentName = d.studentName || 'Student';
  const dueDate = d.dueDate || 'Today';
  const amount = d.amount || '₦35,000';
  const parentName = d.parentName || 'Parent';
  const parentEmail = d.parentEmail || 'N/A';
  const parentPhone = d.parentPhone || 'N/A';

  return {
    subject: `[Billing Notice] Tuition Renewal Due for ${studentName} on ${dueDate}`,
    html: shell('Billing Renewal Due Notice', `
      <h1>Tuition Renewal Due: ${studentName}</h1>
      <p>This is an automated administrative notification that <strong>${studentName}</strong>'s 1-month tuition cycle is due for renewal.</p>

      <div style="background-color:${C.slate50};border:1px solid ${C.slate200};border-radius:14px;padding:22px;margin:22px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};width:38%;">Student</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;color:${C.navy};">${studentName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Parent</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:${C.navy};">${parentName} (${parentEmail} / ${parentPhone})</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Renewal Due Date</td>
            <td style="padding:8px 12px;border-bottom:1px solid ${C.slate200};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:800;color:${C.orange};">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:700;color:${C.slate600};">Amount Due</td>
            <td style="padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;font-weight:800;color:${C.emerald};">${amount}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:${C.slate600};line-height:1.5;">
        Reminder Policy: As this system is reminder-driven, no card was charged. Once payment is confirmed via bank statement or receipt, record it in the Admin Dashboard to advance the billing cycle.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a class="btn-primary" href="${SITE_URL}/admin-dashboard.html" target="_blank" style="font-size:15px;padding:14px 32px;">
          Open Admin Tuition Ledger &rarr;
        </a>
      </div>
    `)
  };
}

// ─── Template Router ──────────────────────────────────────────────────────────

function buildEmail(type, data) {
  switch (type) {
    case 'enrollment_admin':     return { ...tplEnrollmentAdmin(data),    to: ADMIN_ALERT_RECIPIENTS };
    case 'enrollment_parent':    return { ...tplEnrollmentParent(data),   to: data.email || data.parentEmail || data.to };
    case 'booking_admin':        return { ...tplBookingAdmin(data),       to: ADMIN_ALERT_RECIPIENTS };
    case 'booking_parent':       return { ...tplBookingParent(data),      to: data.email || data.parentEmail || data.to };
    case 'contact':              return { ...tplContactAdmin(data),       to: ADMIN_ALERT_RECIPIENTS };
    case 'welcome':              return { ...tplWelcome(data),            to: data.parentEmail || data.email || data.to };
    case 'reminder':             return { ...tplReminder(data),           to: data.recipientEmail || data.parentEmail || data.email || data.to };
    case 'tutor-reminder':       return { ...tplTutorReminder(data),      to: data.tutorEmail || data.recipientEmail || data.email || data.to };
    case 'schedule':             return { ...tplScheduleChange(data),     to: data.parentEmail || data.email || data.to };
    case 'certificate':          return { ...tplCertificate(data),        to: data.parentEmail || data.email || data.to };
    case 'tutor-welcome':         return { ...tplTutorWelcome(data),      to: data.tutorEmail || data.email || data.to };
    case 'credentials-reset':     return { ...tplCredentialsReset(data),  to: data.recipientEmail || data.email || data.to };
    case 'monthly_report':
    case 'monthly-report-parent': return { ...tplMonthlyReportParent(data), to: data.to || data.parentEmail || data.email };
    case 'monthly-report-revision-tutor': return { ...tplMonthlyReportRevision(data), to: data.to || data.tutorEmail || data.email };
    case 'tuition-reminder-parent':
    case 'tuition_reminder':
      return { ...tplTuitionReminderParent(data), to: data.to || data.recipientEmail || data.parentEmail || data.email };
    case 'tuition-alert-admin':
      return { ...tplTuitionAlertAdmin(data), to: ADMIN_ALERT_RECIPIENTS };
    case 'certificate-delivery': return {
      ...tplCertificateDelivery(data),
      to: data.parentEmail || data.email || data.to,
      attachments: data.fileData ? [{
        filename: data.fileName || 'STEMulus-Certificate.pdf',
        content: data.fileData.split(',')[1] || data.fileData,
        encoding: 'base64'
      }] : undefined
    };
    case 'custom':               return { ...tplCustom(data),             to: data.to || data.email };
    default: return null;
  }
}

// ─── Firestore Public Lead Persistence (Write-Only Public Intake) ──────────────

async function persistLeadToFirestore(type, data) {
  if (type !== 'enrollment' && type !== 'booking') return;
  try {
    const rawId = data.enrollmentId || data.bookingId || ('lead-' + Date.now());
    const docId = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '-');
    const studentFirst = data.studentFirstName || (data.studentName ? String(data.studentName).split(',')[0].trim() : 'Student');
    const studentLast = data.studentLastName || (type === 'booking' ? 'Inquiry' : '');
    const studentAge = String(data.studentAge || (data.studentName && String(data.studentName).includes('age') ? String(data.studentName).split('age')[1].trim() : (data.ageGroup || '')));
    const program = data.program || (type === 'booking' ? 'Discovery Session (Free 45-Min Trial)' : 'General Coding');
    const nowIso = data.timestamp || new Date().toISOString();

    const fields = {
      id:               { stringValue: docId },
      studentFirstName: { stringValue: String(studentFirst || '') },
      studentLastName:  { stringValue: String(studentLast || '') },
      studentAge:       { stringValue: String(studentAge || '') },
      studentBirthday:  { stringValue: String(data.studentBirthday || '') },
      studentGender:    { stringValue: String(data.studentGender || '') },
      experience:       { stringValue: String(data.experience || 'Beginner') },
      program:          { stringValue: String(program || '') },
      parentName:       { stringValue: String(data.parentName || '') },
      email:            { stringValue: String(data.email || data.parentEmail || '').toLowerCase().trim() },
      parentEmail:      { stringValue: String(data.parentEmail || data.email || '').toLowerCase().trim() },
      phone:            { stringValue: String(data.phone || '') },
      country:          { stringValue: String(data.country || data.location || 'Global') },
      leadSource:       { stringValue: String(data.leadSource || data.referral || data.utmSource || 'direct') },
      preferredDay:     { stringValue: String(data.preferredDay || 'Flexible') },
      preferredTime:    { stringValue: String(data.preferredTime || data.contactPref || 'Flexible') },
      isFreeTrial:      { booleanValue: type === 'booking' || Boolean(data.isFreeTrial) },
      status:           { stringValue: 'pending' },
      source:           { stringValue: type === 'booking' ? 'public_booking' : 'public_enrollment' },
      timestamp:        { stringValue: String(nowIso) },
      _lastUpdated:     { stringValue: new Date().toISOString() }
    };

    const fbProject = process.env.FIREBASE_PROJECT_ID || 'stemulus-kidstech';
    const fbKey = process.env.FIREBASE_API_KEY || 'AIzaSyBwiBfq11WfgQTPIqvPzxhv3Evz5gN4IUk';
    await fetch(`https://firestore.googleapis.com/v1/projects/${fbProject}/databases/(default)/documents/leads?documentId=${encodeURIComponent(docId)}&key=${fbKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.warn('[send-email] Firestore lead sync notice:', err.message);
  }
}

// ─── Resend API Transport ─────────────────────────────────────────────────────

async function sendViaResend(to, subject, html, attachments) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable not set');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Object.assign({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    }, attachments ? { attachments } : {})),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Resend API error ${resp.status}: ${err}`);
  }
  return await resp.json();
}

// ─── CORS Headers ─────────────────────────────────────────────────────────────

function getCorsHeaders(event) {
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = [
    'https://stemuluskidstech.com',
    'https://www.stemuluskidstech.com',
    'https://portal.stemuluskidstech.com',
    'https://stemulus-portal-web.netlify.app'
  ];
  const isAllowed = allowed.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://stemuluskidstech.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Netlify Handler ──────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const cors = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const type = payload.type;
  const data = payload.data || payload;

  if (data && data.honeypot) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }

  if (!type || !data) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing type or data' }) };
  }

  // Anti-abuse: enforce valid recipient email format if provided
  const targetRecipient = data.to || data.recipientEmail || data.parentEmail || data.tutorEmail || data.email;
  if (targetRecipient && typeof targetRecipient === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetRecipient.trim())) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid recipient email format' }) };
    }
  }

  // Prevent giant payload bombing
  if (event.body && event.body.length > 500000 && !data.fileData) {
    return { statusCode: 413, headers: cors, body: JSON.stringify({ error: 'Payload exceeds allowed limit' }) };
  }

  // Persist public enrollment/booking lead directly to Firestore 'leads' collection
  await persistLeadToFirestore(type, data);

  const types = type === 'enrollment'
    ? ['enrollment_admin', 'enrollment_parent']
    : type === 'booking'
    ? ['booking_admin', 'booking_parent']
    : [type];

  const isApprovedByAdmin = data.adminApproved === true || 
                            data.approvedByAdmin === true || 
                            (event.headers && (event.headers['x-admin-approval'] === 'true' || event.headers['X-Admin-Approval'] === 'true'));

  const results = [];
  for (const t of types) {
    // STRICT POLICY: Sensitive administrative notices (welcome credentials, password resets, certificates)
    // require explicit admin approval or x-admin-approval header before dispatching.
    // Public booking and enrollment confirmation receipts (booking_parent, enrollment_parent) are transactional receipts
    // that must be sent immediately to reassure the prospective parent.
    const isAdminRecipient = data.to && ADMIN_ALERT_RECIPIENTS.includes(String(data.to).toLowerCase().trim());
    const isSensitiveCredentialNotice = (t === 'welcome' || t === 'tutor-welcome' || t === 'tutor_welcome' || 
                                          t === 'student-enrolled' || t === 'credentials-reset' || 
                                          (t === 'custom' && data.to && !isAdminRecipient));

    if (isSensitiveCredentialNotice && !isApprovedByAdmin) {
      console.log(`[send-email] Sensitive administrative notice withheld for ${t}. Requires explicit admin approval.`);
      results.push({ 
        type: t, 
        ok: true, 
        heldForApproval: true, 
        message: 'Held in Admin Review Queue. Requires manual admin approval prior to dispatch.' 
      });
      continue;
    }

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
    headers: cors,
    body: JSON.stringify({ ok: allOk, results }),
  };
};

exports.buildEmail = buildEmail;
