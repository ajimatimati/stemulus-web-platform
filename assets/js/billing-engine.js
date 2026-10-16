/**
 * STEMulus Student Tuition & Monthly Billing Automation Engine
 * 
 * Rules:
 * 1. The student's first class establishes the start of their monthly billing cycle.
 * 2. When 1 month elapses, both Admin and Parent receive automatic payment reminders.
 * 3. Reminder-Driven: No forced auto-debit; payments are recorded manually upon transfer/settlement.
 * 4. Recording payment advances the billing period by 1 month and archives the payment receipt.
 */

const BillingEngine = (function() {
  'use strict';

  // Default School Settings for Payments
  const DEFAULT_SETTINGS = {
    bankName: 'Access Bank',
    accountName: 'STEMulus Kids Tech',
    accountNumber: '1853492019',
    defaultMonthlyFee: 35000,
    currencySymbol: '₦',
    reminderDaysNotice: 5 // Days before due date to flag 'due_soon'
  };

  /**
   * Helper: Add months safely to a date string YYYY-MM-DD.
   * Day-clamped to prevent month-skipping (e.g. Jan 31 + 1 mo = Feb 28, not Mar 3).
   * Supports preferredAnchorDay to retain original enrollment day on subsequent cycles.
   */
  function addMonths(dateStr, monthsToAdd = 1, preferredAnchorDay = null) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const clean = dateStr.trim().slice(0, 10);
    const parts = clean.split('-');
    if (parts.length !== 3) return '';
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1; // 0-indexed month
    if (isNaN(y) || isNaN(m)) return '';

    const origDay = parseInt(parts[2], 10);
    const anchor = (typeof preferredAnchorDay === 'number' && preferredAnchorDay >= 1 && preferredAnchorDay <= 31)
      ? preferredAnchorDay
      : (isNaN(origDay) ? 1 : origDay);

    m += monthsToAdd;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;

    // Days in target month (day 0 of month m+1 is last day of month m)
    const maxDays = new Date(y, m + 1, 0).getDate();
    const clampedDay = Math.min(anchor, maxDays);

    const mm = String(m + 1).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  /**
   * Determine the student's first class date.
   * Priority:
   * 1. Explicit student.billing.firstClassDate
   * 2. Earliest approved attendance record date
   * 3. Earliest schedule date
   * 4. Student createdAt date or today
   */
  function resolveFirstClassDate(student, attendanceRecords = [], schedules = []) {
    if (student.billing && student.billing.firstClassDate) {
      return student.billing.firstClassDate;
    }
    if (student.firstClassDate) {
      return student.firstClassDate;
    }

    // Search approved attendance records
    const sId = student.id;
    const sFullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();

    const studAtt = attendanceRecords.filter(r => {
      const matchId = r.studentId && r.studentId === sId;
      const matchName = r.studentName && r.studentName.toLowerCase().trim() === sFullName;
      return (matchId || matchName) && (r.status === 'approved' || r.isHeld || r.attendanceStatus === 'present');
    });

    if (studAtt.length > 0) {
      studAtt.sort((a, b) => new Date(a.classDate || a.date) - new Date(b.classDate || b.date));
      const earliest = studAtt[0].classDate || studAtt[0].date;
      if (earliest) return earliest.slice(0, 10);
    }

    // Search schedules
    const studSched = schedules.filter(s => {
      const matchId = s.studentId && s.studentId === sId;
      const matchName = s.studentName && s.studentName.toLowerCase().trim() === sFullName;
      return (matchId || matchName) && s.date;
    });

    if (studSched.length > 0) {
      studSched.sort((a, b) => new Date(a.date) - new Date(b.date));
      const earliestSched = studSched[0].date;
      if (earliestSched) return earliestSched.slice(0, 10);
    }

    // Fallback to student enrollment timestamp
    if (student.createdAt) {
      return student.createdAt.slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Calculate complete billing status for a student.
   */
  function calculateBillingInfo(student, attendanceRecords = [], schedules = []) {
    const today = new Date().toISOString().slice(0, 10);
    const firstClass = resolveFirstClassDate(student, attendanceRecords, schedules);
    const anchorDay = (student.billing && student.billing.anchorDay) || parseInt(firstClass.slice(8, 10), 10) || 1;

    let cycleStart = (student.billing && student.billing.cycleStartDate) || firstClass;
    let nextDue = (student.billing && student.billing.nextDueDate) || addMonths(cycleStart, 1, anchorDay);
    const monthlyFee = (student.billing && student.billing.monthlyFee) || student.monthlyFee || DEFAULT_SETTINGS.defaultMonthlyFee;

    // Calculate days remaining until next due date
    const todayMs = new Date(today).getTime();
    const dueMs = new Date(nextDue).getTime();
    const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    let status = 'current';
    if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= DEFAULT_SETTINGS.reminderDaysNotice) {
      status = 'due_soon';
    }

    return {
      firstClassDate: firstClass,
      anchorDay: anchorDay,
      cycleStartDate: cycleStart,
      nextDueDate: nextDue,
      monthlyFee: monthlyFee,
      formattedFee: `${DEFAULT_SETTINGS.currencySymbol}${Number(monthlyFee).toLocaleString()}`,
      daysRemaining: diffDays,
      status: status, // 'current' | 'due_soon' | 'overdue'
      lastReminderSent: (student.billing && student.billing.lastReminderSent) || null,
      history: (student.billing && student.billing.history) || []
    };
  }

  /**
   * Record a payment and advance billing period by 1 month.
   */
  function recordPayment(studentId, paymentData = {}) {
    if (typeof DashboardEngine === 'undefined') return { success: false, message: 'DashboardEngine not available' };
    const db = DashboardEngine.getDB ? DashboardEngine.getDB() : null;
    if (!db || !db.students) return { success: false, message: 'Database not found' };

    const student = db.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Student not found' };

    const attRecs = db.attendanceRecords || [];
    const scheds = db.schedules || [];
    const currentBilling = calculateBillingInfo(student, attRecs, scheds);

    const amountPaid = Number(paymentData.amount) || currentBilling.monthlyFee;
    const paymentDate = paymentData.date || new Date().toISOString().slice(0, 10);
    const reference = paymentData.reference || `REC-${Date.now().toString().slice(-6)}`;
    const method = paymentData.method || 'Bank Transfer';
    const notes = paymentData.notes || 'Monthly tuition renewal';

    // Idempotency check: prevent duplicate reference advance
    const duplicateRef = (currentBilling.history || []).some(h => h.reference && h.reference === reference);
    if (duplicateRef) {
      return { success: false, message: `Payment with reference ${reference} has already been recorded.` };
    }

    const receipt = {
      id: `pay-${Date.now()}`,
      reference: reference,
      amount: amountPaid,
      formattedAmount: `${DEFAULT_SETTINGS.currencySymbol}${amountPaid.toLocaleString()}`,
      date: paymentDate,
      method: method,
      notes: notes,
      cyclePaidFor: `${currentBilling.cycleStartDate} to ${currentBilling.nextDueDate}`,
      recordedBy: paymentData.recordedBy || 'Admin',
      createdAt: new Date().toISOString()
    };

    // Advance cycle: previous nextDueDate becomes new cycleStartDate, using anchorDay
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

    DashboardEngine.saveDB(db);
    if (typeof DashboardEngine.syncToFirestore === 'function') {
      DashboardEngine.syncToFirestore('students', student.id, student);
    }

    // Queue confirmation notification to parent
    if (student.parentEmail && db.notifications) {
      db.notifications.push({
        id: `notif-pay-${Date.now()}`,
        userEmail: student.parentEmail.toLowerCase(),
        title: 'Tuition Payment Confirmed',
        message: `Payment of ${receipt.formattedAmount} for ${student.firstName} ${student.lastName} (${receipt.cyclePaidFor}) has been confirmed. Next renewal due: ${newNextDue}.`,
        timestamp: new Date().toISOString(),
        read: false
      });
      DashboardEngine.saveDB(db);
    }

    return {
      success: true,
      student: student,
      receipt: receipt,
      newNextDue: newNextDue
    };
  }

  /**
   * Pre-format WhatsApp payment reminder message.
   */
  function generateWhatsAppReminderUrl(student, billingInfo = null, customSettings = {}) {
    const settings = Object.assign({}, DEFAULT_SETTINGS, customSettings);
    const info = billingInfo || calculateBillingInfo(student);
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
   * Pre-format email reminder payload.
   */
  function generateEmailReminderPayload(student, billingInfo = null, customSettings = {}) {
    const settings = Object.assign({}, DEFAULT_SETTINGS, customSettings);
    const info = billingInfo || calculateBillingInfo(student);
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
   * Scan all students and retrieve billing queue for Admin.
   */
  function getBillingRoster(students = null, attendanceRecords = null, schedules = null) {
    if (!students && typeof DashboardEngine !== 'undefined') {
      const db = DashboardEngine.getDB();
      students = db.students || [];
      attendanceRecords = attendanceRecords || db.attendanceRecords || [];
      schedules = schedules || db.schedules || [];
    }
    students = students || [];
    attendanceRecords = attendanceRecords || [];
    schedules = schedules || [];

    return students
      .filter(s => s.status !== 'withdrawn' && s.status !== 'inactive')
      .map(s => {
        const info = calculateBillingInfo(s, attendanceRecords, schedules);
        return {
          student: s,
          billing: info
        };
      })
      .sort((a, b) => a.billing.daysRemaining - b.billing.daysRemaining);
  }

  /**
   * Filter students that are due soon, due, or overdue.
   */
  function getDueStudents() {
    return getBillingRoster().filter(item => item.billing.status === 'due' || item.billing.status === 'overdue' || item.billing.status === 'due_soon');
  }

  /**
   * Get global school payment settings.
   */
  function getSettings() {
    if (typeof DashboardEngine !== 'undefined') {
      const db = DashboardEngine.getDB();
      if (db.billingSettings) return Object.assign({}, DEFAULT_SETTINGS, db.billingSettings);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  /**
   * Update global school payment settings.
   */
  function updateSettings(newSettings) {
    if (typeof DashboardEngine !== 'undefined') {
      const db = DashboardEngine.getDB();
      db.billingSettings = Object.assign({}, DEFAULT_SETTINGS, db.billingSettings || {}, newSettings);
      DashboardEngine.saveDB(db);
      return db.billingSettings;
    }
    return newSettings;
  }

  return {
    calculateBillingInfo,
    resolveFirstClassDate,
    recordPayment,
    generateWhatsAppReminderUrl,
    generateEmailReminderPayload,
    getBillingRoster,
    getDueStudents,
    getSettings,
    updateSettings,
    addMonths,
    DEFAULT_SETTINGS
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.BillingEngine = BillingEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BillingEngine;
}
