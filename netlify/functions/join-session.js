/**
 * STEMulus 1-Click Direct Classroom Join & Autonomous Presence Tracker (FOC)
 * ==========================================================================
 * Allows Tutors and Parents/Students to click "Join Class" / "Join Now"
 * directly from their reminder emails without opening or logging into the portal.
 *
 * 1. Fires an instant ntfy.sh push notification to Admin confirming the join
 *    (and flagging if they joined >= 3 minutes late).
 * 2. Updates live_presence/{scheduleId} in Firebase Firestore REST API so the
 *    Admin & Portal Watchdog knows the party has joined and cancels false alarms.
 * 3. If the party joined >= 3 minutes late, queues a Late-Join Notification Email
 *    draft in Firestore email_queue (from: admin@stemuluskidstech.com) for manual Admin send.
 * 4. Immediately returns an HTTP 302 redirect straight into the Google Meet session.
 */

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'stemulus-kidstech';
const NTFY_TOPIC = process.env.NTFY_ADMIN_TOPIC || 'stemulus-admin-alerts';
const OFFICIAL_ADMIN_EMAIL = 'admin@stemuluskidstech.com';

function sanitizeMeetUrl(rawUrl) {
  const str = String(rawUrl || '').trim();
  if (/^https:\/\/meet\.google\.com\/[a-zA-Z0-9_-]+/i.test(str)) {
    return str;
  }
  if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(str)) {
    return `https://meet.google.com/${str.toLowerCase()}`;
  }
  return 'https://meet.google.com';
}

function computeLateMinutes(dateStr, timeStr) {
  if (!dateStr || !timeStr) return 0;
  try {
    const cleanDate = String(dateStr).trim().slice(0, 10);
    const parts = String(timeStr).trim().split(':');
    const hh = String(parseInt(parts[0], 10) || 16).padStart(2, '0');
    const mm = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    // Interpret schedule time in WAT (UTC+1)
    const schedTimeMs = Date.parse(`${cleanDate}T${hh}:${mm}:00+01:00`);
    if (isNaN(schedTimeMs)) return 0;
    const diffMins = Math.round((Date.now() - schedTimeMs) / 60000);
    return diffMins;
  } catch (e) {
    return 0;
  }
}

async function sendNtfyNotification(title, message, priority = 'default', tags = 'video_camera,white_check_mark', meetUrl = '') {
  if (typeof fetch !== 'function') return false;
  try {
    const headers = {
      Title: String(title || 'STEMulus Classroom Update').replace(/[^\x20-\x7E]/g, '').trim(),
      Priority: priority,
      Tags: tags
    };
    if (meetUrl && meetUrl.startsWith('https://')) {
      headers.Click = meetUrl;
    }
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers,
      body: String(message || '')
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function toFirestoreFields(obj) {
  const fields = {};
  Object.keys(obj).forEach((k) => {
    const val = obj[k];
    if (val === undefined || val === null) return;
    if (typeof val === 'boolean') {
      fields[k] = { booleanValue: val };
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      if (Number.isInteger(val)) {
        fields[k] = { integerValue: String(val) };
      } else {
        fields[k] = { doubleValue: val };
      }
    } else {
      fields[k] = { stringValue: String(val) };
    }
  });
  return { fields };
}

async function patchFirestoreDoc(collection, docId, dataObj) {
  if (typeof fetch !== 'function' || !docId) return false;
  try {
    const safeDocId = String(docId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fieldKeys = Object.keys(dataObj).filter((k) => dataObj[k] !== undefined && dataObj[k] !== null);
    const maskParams = fieldKeys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${safeDocId}?${maskParams}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toFirestoreFields(dataObj))
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const meetUrl = sanitizeMeetUrl(q.meet || q.url || q.link);
  const scheduleId = String(q.sid || q.scheduleId || `adhoc-${Date.now()}`).trim();
  const roleRaw = String(q.role || 'tutor').toLowerCase().trim();
  const isTutor = roleRaw === 'tutor' || roleRaw === 'mentor' || roleRaw === 'coach';

  const tutorName = String(q.tutor || q.tutorName || 'Faculty Coach').trim();
  const tutorEmail = String(q.tutorEmail || '').trim().toLowerCase();
  const studentName = String(q.student || q.studentName || 'Student').trim();
  const parentName = String(q.parentName || 'Parent').trim();
  const parentEmail = String(q.parentEmail || '').trim().toLowerCase();
  const courseName = String(q.course || q.courseName || 'STEMulus Live Class').trim();
  const classDate = String(q.date || new Date().toISOString().split('T')[0]).trim();
  const classTime = String(q.time || '16:00').trim();

  const nowIso = new Date().toISOString();
  const lateMins = computeLateMinutes(classDate, classTime);
  const isLate = lateMins >= 3;

  // 1. Build Firestore live_presence payload
  const presencePatch = {
    scheduleId,
    studentName,
    tutorName,
    courseName,
    meetLink: meetUrl,
    classDate,
    classTime,
    lastHeartbeat: nowIso,
    updatedAt: nowIso
  };

  if (isTutor) {
    presencePatch.tutorPresent = true;
    presencePatch.tutorName = tutorName;
    presencePatch.tutorJoinedAt = nowIso;
    presencePatch.tutorJoinedVia = 'email_1click';
    presencePatch.tutorLateMinutes = Math.max(0, lateMins);
  } else {
    presencePatch.studentPresent = true;
    presencePatch.studentName = studentName;
    presencePatch.studentJoinedAt = nowIso;
    presencePatch.studentJoinedVia = 'email_1click';
    presencePatch.studentLateMinutes = Math.max(0, lateMins);
  }

  // 2. Build ntfy message for Admin
  let ntfyTitle = '';
  let ntfyBody = '';
  let ntfyPriority = isLate ? 'high' : 'default';
  let ntfyTags = isLate ? 'warning,clock3' : 'white_check_mark,video_camera';

  if (isTutor) {
    ntfyTitle = isLate
      ? `Late Join (+${lateMins}m): Tutor ${tutorName} -> ${studentName}`
      : `Tutor Joined: ${tutorName} -> ${studentName}`;
    ntfyBody =
      `Coach ${tutorName} clicked 1-Click Join directly from their reminder email for ${studentName} (${courseName}).\n` +
      `Scheduled: ${classDate} at ${classTime} WAT\n` +
      `Status: ${isLate ? `Joined ${lateMins} mins late (Admin email queued)` : 'Joined on time'}\n` +
      `Classroom: ${meetUrl}`;
  } else {
    ntfyTitle = isLate
      ? `Late Join (+${lateMins}m): Coder ${studentName} -> ${courseName}`
      : `Coder Joined: ${studentName} -> ${courseName}`;
    ntfyBody =
      `${studentName} clicked 1-Click Join directly from their reminder email for ${courseName} (Coach ${tutorName}).\n` +
      `Scheduled: ${classDate} at ${classTime} WAT\n` +
      `Status: ${isLate ? `Joined ${lateMins} mins late (Admin email queued)` : 'Joined on time'}\n` +
      `Classroom: ${meetUrl}`;
  }

  const tasks = [
    sendNtfyNotification(ntfyTitle, ntfyBody, ntfyPriority, ntfyTags, meetUrl),
    patchFirestoreDoc('live_presence', scheduleId, presencePatch)
  ];

  // 3. If joined >= 3 minutes late, queue Late-Join Notification Email draft in Firestore email_queue
  if (isLate) {
    const recipientEmail = isTutor ? tutorEmail : parentEmail;
    const recipientName = isTutor ? tutorName : parentName;
    if (recipientEmail && recipientEmail.includes('@')) {
      const queueId = `eq-late-${isTutor ? 'tutor' : 'student'}-${scheduleId}-${classDate}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const subject = isTutor
        ? `[Class Punctuality Notice] Late Join (+${lateMins}m) for ${studentName}'s ${courseName} Session`
        : `[Class Punctuality Notice] ${studentName} Joined ${courseName} +${lateMins}m Late`;
      const htmlBody = isTutor
        ? `<div style="font-family:'Plus Jakarta Sans',sans-serif;color:#1E293B;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;background:#FFFFFF;border:2px solid #E2E8F0;border-bottom:4px solid #CBD5E1;border-radius:20px;">
            <p style="margin:0 0 12px;font-size:15px;font-weight:700;">Hello Coach ${tutorName},</p>
            <p style="margin:0 0 14px;font-size:14px;color:#475569;">Our automated classroom monitor logged that you joined <strong>${studentName}</strong>'s <strong>${courseName}</strong> session <strong>${lateMins} minutes after the scheduled start time (${classTime} WAT)</strong>.</p>
            <p style="margin:0 0 18px;font-size:14px;color:#475569;">Please ensure all future sessions are launched at least 5 minutes before the scheduled start time using your 1-click reminder link.</p>
            <p style="margin:0;font-size:12px;color:#64748B;">STEMulus Academic Operations (${OFFICIAL_ADMIN_EMAIL})</p>
          </div>`
        : `<div style="font-family:'Plus Jakarta Sans',sans-serif;color:#1E293B;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;background:#FFFFFF;border:2px solid #E2E8F0;border-bottom:4px solid #CBD5E1;border-radius:20px;">
            <p style="margin:0 0 12px;font-size:15px;font-weight:700;">Hello ${parentName},</p>
            <p style="margin:0 0 14px;font-size:14px;color:#475569;">We noticed that <strong>${studentName}</strong> joined today's <strong>${courseName}</strong> session with <strong>Coach ${tutorName}</strong> <strong>${lateMins} minutes after the scheduled start time (${classTime} WAT)</strong>.</p>
            <p style="margin:0 0 18px;font-size:14px;color:#475569;">Joining on time helps ${studentName} get the full 1-on-1 coding experience. Please let us know if you need any scheduling adjustments.</p>
            <p style="margin:0;font-size:12px;color:#64748B;">Warm regards,<br>STEMulus Academic Operations (${OFFICIAL_ADMIN_EMAIL})</p>
          </div>`;

      tasks.push(
        patchFirestoreDoc('email_queue', queueId, {
          id: queueId,
          type: isTutor ? 'late_join_tutor' : 'late_join_student',
          from: OFFICIAL_ADMIN_EMAIL,
          senderEmail: OFFICIAL_ADMIN_EMAIL,
          to: recipientEmail,
          recipientName,
          subject,
          htmlPreview: htmlBody,
          status: 'queued',
          createdAt: nowIso,
          triggeredBy: `email_1click_${isTutor ? 'tutor' : 'student'}_${scheduleId}_${classDate}`
        })
      );
    }
  }

  // Wait up to 1.2s for telemetry so redirect remains near-instant even on slow networks
  try {
    await Promise.race([
      Promise.allSettled(tasks),
      new Promise((resolve) => setTimeout(resolve, 1200))
    ]);
  } catch (e) {}

  return {
    statusCode: 302,
    headers: {
      Location: meetUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    },
    body: ''
  };
};
