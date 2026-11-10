/**
 * STEMulus Notifications & NTFY Alerts Feature Service (ES Module)
 * Authoritative business logic for user notifications, student-ownership scoping guards,
 * read receipts, and automated NTFY birthday broadcast alerts.
 */

/**
 * Retrieve notifications with student-ownership scoping and role permissions.
 * @param {string|null} email
 * @param {object} db
 * @param {object|null} currentSession
 * @returns {Array}
 */
export function getNotifications(email = null, db = {}, currentSession = null) {
  const notifs = Array.isArray(db.notifications) ? db.notifications : [];
  if (!email) return notifs;

  const clean = String(email).toLowerCase().trim();
  const sessionRole = (currentSession && currentSession.role || '').toLowerCase();

  // Build allowed email set for user (including known tutor aliases)
  const myEmails = new Set([clean]);
  if (clean === 'olalekan@stemuluskidstech.com' || clean === 'ajimatimati@gmail.com') {
    myEmails.add('olalekan@stemuluskidstech.com');
    myEmails.add('ajimatimati@gmail.com');
  }

  const tutors = Array.isArray(db.tutors) ? db.tutors : [];
  const matchedTut = tutors.find(t =>
    t && ((t.email && t.email.toLowerCase().trim() === clean) || (t.altEmail && t.altEmail.toLowerCase().trim() === clean))
  );

  if (matchedTut) {
    if (matchedTut.email) myEmails.add(matchedTut.email.toLowerCase().trim());
    if (matchedTut.altEmail) myEmails.add(matchedTut.altEmail.toLowerCase().trim());
  }

  const isAdminUser = clean === 'admin@stemuluskidstech.com' || sessionRole === 'admin';
  const allStudents = Array.isArray(db.students) ? db.students : [];

  return notifs.filter(n => {
    if (!n) return false;
    if (isAdminUser) return true;

    const target = (n.userEmail || n.recipientEmail || '').toLowerCase().trim();
    const targetRole = (n.targetRole || n.recipientRole || '').toLowerCase().trim();

    let isRecipient = false;
    if (target === 'all' || target === 'everyone') isRecipient = true;
    else if (sessionRole === 'tutor' && (target === 'tutors' || target === 'all-tutors' || targetRole === 'tutor' || targetRole === 'all-tutors')) isRecipient = true;
    else if (sessionRole === 'parent' && (target === 'parents' || target === 'all-parents' || targetRole === 'parent' || targetRole === 'all-parents')) isRecipient = true;
    else if (myEmails.has(target)) isRecipient = true;

    if (!isRecipient) return false;

    // Strict student-ownership guard
    const textBlob = `${n.title || ''} ${n.message || ''} ${n.studentName || ''}`.toLowerCase();

    // Tutors must NEVER receive payment/payout calculations or admin-only "waiting in class" alerts
    const isTutorViewer = sessionRole === 'tutor' || Boolean(matchedTut);
    if (isTutorViewer) {
      const isPaymentOrWaitingAlert = /(\bpayout\b|\bpayroll\b|\bpayment\b|\bremittance\b|\bcompensation\b|\bsalary\b|\bhourly rate\b|\bwaiting in class\b|\bcoder waiting\b|\btutor waiting\b|\bchild is waiting\b|\bwaiting for tutor\b|\bwaiting for coder\b|\bwaiting for [a-z]+\b)/i.test(textBlob);
      if (isPaymentOrWaitingAlert) return false;
    }

    let refStudent = null;
    if (n.studentId) {
      refStudent = allStudents.find(s => s && s.id === n.studentId);
    }
    if (!refStudent) {
      refStudent = allStudents.find(s => {
        if (!s) return false;
        const full = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        if (full && full.length > 3 && textBlob.includes(full)) return true;
        const first = (s.firstName || '').toLowerCase().trim();
        if (first.length >= 5 && ['gbolade', 'momooreoluwa', 'junayd', 'babalola', 'joshua', 'abdulsalam', 'annabelle', 'alexandra', 'brian'].includes(first) && textBlob.includes(first)) {
          return true;
        }
        return false;
      });
    }

    if (refStudent) {
      const stTutorEmail = String(refStudent.tutorEmail || '').toLowerCase().trim();
      const stParentEmail = String(refStudent.parentEmail || '').toLowerCase().trim();
      if (isTutorViewer) {
        if (!stTutorEmail || !myEmails.has(stTutorEmail)) return false;
      } else if (sessionRole === 'parent') {
        if (!stParentEmail || !myEmails.has(stParentEmail)) return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Queue a new user notification.
 * @param {object} notif
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addNotification(notif, db = {}, storageService = null) {
  if (!Array.isArray(db.notifications)) db.notifications = [];
  const n = Object.assign({}, notif);

  n.id = n.id || (`not-${Date.now()}`);
  n.timestamp = n.timestamp || new Date().toISOString();
  n.read = false;
  n.userEmail = (n.userEmail || '').toLowerCase().trim();

  db.notifications.push(n);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'notifications', action: 'add', item: n } }));
  }

  return n;
}

/**
 * Mark notifications read for a specific user email.
 * @param {string} email
 * @param {object} db
 * @param {object|null} storageService
 * @returns {number}
 */
export function markNotificationsRead(email, db = {}, storageService = null) {
  if (!email || !Array.isArray(db.notifications)) return 0;
  const clean = String(email).toLowerCase().trim();
  let updatedCount = 0;

  db.notifications.forEach(n => {
    if (n && (n.userEmail || '').toLowerCase().trim() === clean && !n.read) {
      n.read = true;
      updatedCount += 1;
    }
  });

  if (updatedCount > 0) {
    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'notifications', action: 'markRead' } }));
    }
  }

  return updatedCount;
}

/**
 * Broadcast birthday alert via NTFY webhook and record admin notification.
 * @param {object} student
 * @param {object} db
 * @param {object|null} storageService
 * @returns {Promise<object>}
 */
export async function triggerBirthdayNtfy(student, db = {}, storageService = null) {
  if (!student || !student.birthday || typeof student.birthday !== 'string' || student.birthday.trim().length < 10) {
    return { success: false, message: 'Student has no recorded birthday.' };
  }

  const topic = db.ntfyTopic || 'stm-bday-qm4p7s9ke2ax1nf';
  const title = `[Birthday] STEMulus Birthday Alert: ${student.firstName} ${student.lastName}!`;
  const message = `Our student ${student.firstName} ${student.lastName} (Age ${student.age}) is celebrating their birthday today!\nLet's send them a special coding challenge or congratulations!\nParent: ${student.parentName} (${student.parentPhone})`;

  try {
    let ok = true;
    if (typeof fetch === 'function') {
      const response = await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': 'default',
          'Tags': 'birthday,tada,party_popper'
        },
        body: message
      });
      ok = response.ok;
    }

    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: `Birthday Alert Sent for ${student.firstName}`,
      message: `ntfy alert successfully broadcast to topic: ${topic}`,
      timestamp: new Date().toISOString(),
      read: true,
      userEmail: 'admin@stemuluskidstech.com'
    });

    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    return { success: ok, topic: topic };
  } catch (e) {
    return { success: false, error: e };
  }
}

export const NotificationService = {
  getNotifications,
  addNotification,
  markNotificationsRead,
  triggerBirthdayNtfy
};
