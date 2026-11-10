/**
 * STEMulus Tuition and Student Billing Service (ES Module)
 * Authoritative business logic for tuition cycles, billing rosters, and payment receipts.
 */

export const DEFAULT_TUITION_SETTINGS = {
  bankName: 'Wema Nigeria',
  accountName: 'STEMulus innovation Limited',
  accountNumber: '0128062292',
  usdBankName: 'Wema Bank (USD DOM)',
  usdAccountName: 'STEMulus innovation Limited',
  usdAccountNumber: '0622219817',
  defaultMonthlyFee: 35000,
  currencySymbol: '₦',
  reminderDaysNotice: 5
};

/**
 * Add calendar months safely to a YYYY-MM-DD date string.
 * Clamps days to prevent month-skipping (e.g. Jan 31 + 1 mo = Feb 28).
 * Supports preferredAnchorDay to retain original enrollment day on subsequent cycles.
 * @param {string} dateStr
 * @param {number} monthsToAdd
 * @param {number|null} preferredAnchorDay
 * @returns {string}
 */
export function addMonths(dateStr, monthsToAdd = 1, preferredAnchorDay = null) {
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

  const mm = String(m + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Determine the student's first class date.
 * @param {object} student
 * @param {Array} attendanceRecords
 * @param {Array} schedules
 * @returns {string}
 */
export function resolveFirstClassDate(student, attendanceRecords = [], schedules = []) {
  if (!student) return new Date().toISOString().slice(0, 10);

  if (student.billing && student.billing.firstClassDate) {
    return student.billing.firstClassDate;
  }
  if (student.firstClassDate) {
    return student.firstClassDate;
  }

  const sId = student.id;
  const sFullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();

  const studAtt = (attendanceRecords || []).filter(r => {
    if (!r) return false;
    const matchId = r.studentId && r.studentId === sId;
    const matchName = r.studentName && r.studentName.toLowerCase().trim() === sFullName;
    return (matchId || matchName) && (r.status === 'approved' || r.isHeld || r.attendanceStatus === 'present');
  });

  if (studAtt.length > 0) {
    studAtt.sort((a, b) => new Date(a.classDate || a.date) - new Date(b.classDate || b.date));
    const earliest = studAtt[0].classDate || studAtt[0].date;
    if (earliest) return earliest.slice(0, 10);
  }

  const studSched = (schedules || []).filter(s => {
    if (!s) return false;
    const matchId = s.studentId && s.studentId === sId;
    const matchName = s.studentName && s.studentName.toLowerCase().trim() === sFullName;
    return (matchId || matchName) && s.date;
  });

  if (studSched.length > 0) {
    studSched.sort((a, b) => new Date(a.date) - new Date(b.date));
    const earliestSched = studSched[0].date;
    if (earliestSched) return earliestSched.slice(0, 10);
  }

  if (student.createdAt) {
    return student.createdAt.slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate complete billing status for a student.
 * @param {object} student
 * @param {Array} attendanceRecords
 * @param {Array} schedules
 * @param {object} settings
 * @returns {object}
 */
export function calculateBillingInfo(student, attendanceRecords = [], schedules = [], settings = DEFAULT_TUITION_SETTINGS) {
  if (!student) return null;
  const currentSettings = Object.assign({}, DEFAULT_TUITION_SETTINGS, settings || {});
  const today = new Date().toISOString().slice(0, 10);
  const firstClass = resolveFirstClassDate(student, attendanceRecords, schedules);
  const anchorDay = (student.billing && student.billing.anchorDay) || parseInt(firstClass.slice(8, 10), 10) || 1;

  let cycleStart = (student.billing && student.billing.cycleStartDate) || firstClass;
  let nextDue = (student.billing && student.billing.nextDueDate) || addMonths(cycleStart, 1, anchorDay);
  const monthlyFee = (student.billing && student.billing.monthlyFee) || student.monthlyFee || currentSettings.defaultMonthlyFee;

  const todayMs = new Date(today).getTime();
  const dueMs = new Date(nextDue).getTime();
  const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  let status = 'current';
  if (diffDays < 0) {
    status = 'overdue';
  } else if (diffDays <= (currentSettings.reminderDaysNotice || 5)) {
    status = 'due_soon';
  }

  return {
    firstClassDate: firstClass,
    anchorDay: anchorDay,
    cycleStartDate: cycleStart,
    nextDueDate: nextDue,
    monthlyFee: monthlyFee,
    formattedFee: `${currentSettings.currencySymbol}${Number(monthlyFee).toLocaleString()}`,
    daysRemaining: diffDays,
    status: status,
    lastReminderSent: (student.billing && student.billing.lastReminderSent) || null,
    history: (student.billing && student.billing.history) || []
  };
}

/**
 * Record payment for a student and advance their billing cycle by 1 month.
 * @param {string} studentId
 * @param {object} paymentData
 * @param {object} db
 * @param {object} storageService
 * @returns {object}
 */
export function recordPayment(studentId, paymentData = {}, db, storageService) {
  if (!db || !Array.isArray(db.students)) {
    return { success: false, message: 'Database not initialized or invalid' };
  }

  const student = db.students.find(s => s && s.id === studentId);
  if (!student) {
    return { success: false, message: 'Student not found' };
  }

  const attRecs = db.attendanceRecords || [];
  const scheds = db.schedules || [];
  const settings = getSettings(db);
  const currentBilling = calculateBillingInfo(student, attRecs, scheds, settings);

  const amountPaid = Number(paymentData.amount) || currentBilling.monthlyFee;
  const paymentDate = paymentData.date || new Date().toISOString().slice(0, 10);
  const reference = paymentData.reference || `REC-${Date.now().toString().slice(-6)}`;
  const method = paymentData.method || 'Bank Transfer';
  const notes = paymentData.notes || 'Monthly tuition renewal';

  const duplicateRef = (currentBilling.history || []).some(h => h && h.reference && h.reference === reference);
  if (duplicateRef) {
    return { success: false, message: `Payment with reference ${reference} has already been recorded.` };
  }

  const receipt = {
    id: `pay-${Date.now()}`,
    reference: reference,
    amount: amountPaid,
    formattedAmount: `${settings.currencySymbol}${amountPaid.toLocaleString()}`,
    date: paymentDate,
    method: method,
    notes: notes,
    cyclePaidFor: `${currentBilling.cycleStartDate} to ${currentBilling.nextDueDate}`,
    recordedBy: paymentData.recordedBy || 'Admin',
    createdAt: new Date().toISOString()
  };

  const newCycleStart = currentBilling.nextDueDate;
  const newNextDue = addMonths(newCycleStart, 1, currentBilling.anchorDay);

  student.billing = {
    firstClassDate: currentBilling.firstClassDate,
    anchorDay: currentBilling.anchorDay,
    cycleStartDate: newCycleStart,
    nextDueDate: newNextDue,
    monthlyFee: currentBilling.monthlyFee,
    status: 'current',
    lastReminderSent: null,
    lastPaymentDate: paymentDate,
    history: [receipt, ...(currentBilling.history || [])]
  };

  if (student.parentEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `notif-pay-${Date.now()}`,
      userEmail: student.parentEmail.toLowerCase(),
      title: 'Tuition Payment Confirmed',
      message: `Payment of ${receipt.formattedAmount} for ${student.firstName || ''} ${student.lastName || ''} (${receipt.cyclePaidFor}) has been confirmed. Next renewal due: ${newNextDue}.`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'students', item: student } }));
  }

  return {
    success: true,
    student: student,
    receipt: receipt,
    newNextDue: newNextDue
  };
}

/**
 * Format pre-populated WhatsApp payment reminder URL.
 * @param {object} student
 * @param {object|null} billingInfo
 * @param {object} customSettings
 * @returns {string}
 */
export function generateWhatsAppReminderUrl(student, billingInfo = null, customSettings = {}) {
  const settings = Object.assign({}, DEFAULT_TUITION_SETTINGS, customSettings);
  const info = billingInfo || calculateBillingInfo(student, [], [], settings);
  const childName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const parentName = student.parentName || 'Parent';
  const phone = (student.parentPhone || '').replace(/[^0-9]/g, '');

  const message = `Hello ${parentName}, this is STEMulus Kids Tech regarding ${childName}'s coding classes. ` +
    `Their 1-month learning cycle renews on *${info.nextDueDate}*. ` +
    `Monthly Tuition: *${info.formattedFee}*.\n\n` +
    `Payment Details:\n` +
    `Bank: *${settings.bankName}*\n` +
    `Account: *${settings.accountNumber}*\n` +
    `Name: *${settings.accountName}*\n\n` +
    `Kindly share your payment receipt once completed so we can update ${childName}'s student ledger. Thank you!`;

  const encoded = encodeURIComponent(message);
  const targetPhone = phone.startsWith('0') ? '234' + phone.slice(1) : phone;
  return `https://wa.me/${targetPhone}?text=${encoded}`;
}

/**
 * Generate email reminder payload for parent tuition notice.
 * @param {object} student
 * @param {object|null} billingInfo
 * @param {object} customSettings
 * @returns {object}
 */
export function generateEmailReminderPayload(student, billingInfo = null, customSettings = {}) {
  const settings = Object.assign({}, DEFAULT_TUITION_SETTINGS, customSettings);
  const info = billingInfo || calculateBillingInfo(student, [], [], settings);
  const childName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

  return {
    type: 'tuition-reminder-parent',
    to: student.parentEmail,
    recipientName: student.parentName || 'Parent',
    data: {
      parentName: student.parentName || 'Parent',
      studentName: childName,
      courseName: student.program || 'Coding Track',
      dueDate: info.nextDueDate,
      amount: info.formattedFee,
      bankName: settings.bankName,
      accountNumber: settings.accountNumber,
      accountName: settings.accountName,
      portalUrl: 'https://stemuluskidstech.com/parent-dashboard.html'
    }
  };
}

/**
 * Scan all students and retrieve sorted billing roster.
 * @param {object} db
 * @param {Array|null} attendanceRecords
 * @param {Array|null} schedules
 * @returns {Array}
 */
export function getBillingRoster(db, attendanceRecords = null, schedules = null) {
  if (!db || !Array.isArray(db.students)) return [];
  const students = db.students;
  const atts = attendanceRecords || db.attendanceRecords || [];
  const scheds = schedules || db.schedules || [];
  const settings = getSettings(db);

  return students
    .filter(s => s && s.status !== 'withdrawn' && s.status !== 'inactive')
    .map(s => {
      const info = calculateBillingInfo(s, atts, scheds, settings);
      return {
        student: s,
        billing: info
      };
    })
    .sort((a, b) => a.billing.daysRemaining - b.billing.daysRemaining);
}

/**
 * Filter students that are due soon, due, or overdue.
 * @param {object} db
 * @returns {Array}
 */
export function getDueStudents(db) {
  return getBillingRoster(db).filter(item => {
    const st = item && item.billing && item.billing.status;
    return st === 'due' || st === 'overdue' || st === 'due_soon';
  });
}

/**
 * Get school payment settings, automatically upgrading legacy bank credentials.
 * @param {object} db
 * @returns {object}
 */
export function getSettings(db) {
  if (db && db.billingSettings) {
    if (db.billingSettings.accountNumber === '1853492019' || !db.billingSettings.usdAccountNumber) {
      db.billingSettings = Object.assign({}, DEFAULT_TUITION_SETTINGS, db.billingSettings, {
        bankName: 'Wema Nigeria',
        accountName: 'STEMulus innovation Limited',
        accountNumber: '0128062292',
        usdBankName: 'Wema Bank (USD DOM)',
        usdAccountName: 'STEMulus innovation Limited',
        usdAccountNumber: '0622219817'
      });
    }
    return Object.assign({}, DEFAULT_TUITION_SETTINGS, db.billingSettings);
  }
  return Object.assign({}, DEFAULT_TUITION_SETTINGS);
}

/**
 * Update school payment settings and persist.
 * @param {object} newSettings
 * @param {object} db
 * @param {object} storageService
 * @returns {object}
 */
export function updateSettings(newSettings, db, storageService) {
  if (!db) return newSettings;
  db.billingSettings = Object.assign({}, DEFAULT_TUITION_SETTINGS, db.billingSettings || {}, newSettings || {});
  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }
  return db.billingSettings;
}

export const TuitionService = {
  DEFAULT_SETTINGS: DEFAULT_TUITION_SETTINGS,
  addMonths,
  resolveFirstClassDate,
  calculateBillingInfo,
  recordPayment,
  generateWhatsAppReminderUrl,
  generateEmailReminderPayload,
  getBillingRoster,
  getDueStudents,
  getSettings,
  updateSettings
};
