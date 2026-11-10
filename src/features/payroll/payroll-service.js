/**
 * STEMulus Faculty Payroll and Remittance Ledger Service (ES Module)
 * Authoritative business logic for monthly tutor teaching stats, verified session aggregations,
 * payout ledgers, batch approvals, and punctuality performance metrics.
 */

/**
 * Normalizes and extracts canonical recurring weekly schedules.
 * Keyed by (student, dayOfWeek, time) so multi-week rows never inflate weekly counts.
 * @param {object} dbInstance
 * @param {string|object|null} filterInput
 * @returns {Array}
 */
export function getCanonicalWeeklySchedules(dbInstance, filterInput = null) {
  const db = dbInstance || {};
  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slotMap = new Map();

  schedules.forEach(s => {
    if (!s || s.status === 'cancelled' || s.attendanceStatus === 'cancelled') return;
    if (!s.dayOfWeek && s.date && s.date < '2026-10-01') return;

    let dayName = s.dayOfWeek || '';
    if (!dayName && s.date) {
      const dObj = new Date(s.date + 'T12:00:00');
      if (!isNaN(dObj.getTime())) dayName = daysArr[dObj.getDay()];
    }
    if (!dayName) return;

    const studentKey = String(s.studentId || s.studentName || '').toLowerCase().trim();
    const timeKey = String(s.time || '16:00').trim();
    const canonicalKey = `${studentKey}|${dayName.toLowerCase().trim()}|${timeKey}`;

    if (!slotMap.has(canonicalKey)) {
      slotMap.set(canonicalKey, Object.assign({}, s, {
        dayOfWeek: dayName,
        duration: String(parseInt(s.duration, 10) || 60)
      }));
    } else {
      const existing = slotMap.get(canonicalKey);
      if (existing.id && existing.id.endsWith('-w1') && s.id && !s.id.endsWith('-w1')) {
        slotMap.set(canonicalKey, Object.assign({}, s, {
          dayOfWeek: dayName,
          duration: String(parseInt(s.duration, 10) || 60)
        }));
      }
    }
  });

  let result = Array.from(slotMap.values());

  if (filterInput) {
    const q = typeof filterInput === 'string' ? filterInput.toLowerCase().trim() : '';
    const filterObj = (typeof filterInput === 'object' && filterInput !== null) ? filterInput : null;

    result = result.filter(s => {
      const sStudentId = String(s.studentId || '').toLowerCase().trim();
      const sStudentName = String(s.studentName || '').toLowerCase().trim();
      const sTutorId = String(s.tutorId || '').toLowerCase().trim();
      const sTutorEmail = String(s.tutorEmail || '').toLowerCase().trim();
      const sTutorName = String(s.mentor || s.tutorName || '').toLowerCase().trim();

      if (filterObj) {
        if (filterObj.studentId && sStudentId === String(filterObj.studentId).toLowerCase().trim()) return true;
        if (filterObj.tutorId && sTutorId === String(filterObj.tutorId).toLowerCase().trim()) return true;
        if (filterObj.tutorEmail && sTutorEmail === String(filterObj.tutorEmail).toLowerCase().trim()) return true;
        if (filterObj.tutorName && sTutorName === String(filterObj.tutorName).toLowerCase().trim()) return true;
        return false;
      }
      if (q) {
        if (sStudentId === q || sStudentName === q) return true;
        if (sTutorId === q || sTutorEmail === q) return true;
        if (sTutorEmail && sTutorEmail.includes('@') && q.includes('@') && sTutorEmail !== q) return false;
        if (sTutorName === q || (q.length > 2 && sTutorName.includes(q))) return true;
      }
      return false;
    });
  }

  return result;
}

/**
 * Calculates tutor teaching statistics and monthly earnings for a specific month (e.g. '2026-10').
 * Deduplicates attendance logs and completed schedules by (student, date, time).
 * @param {string} tutorEmailOrName
 * @param {string|null} monthStr
 * @param {object} db
 * @returns {object}
 */
export function calculateTutorMonthlyStats(tutorEmailOrName, monthStr = null, db = {}) {
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const mStr = monthStr || new Date().toISOString().substring(0, 7);
  const tKey = (tutorEmailOrName || '').toLowerCase().trim();

  const aliases = new Set();
  if (tKey) aliases.add(tKey);

  const allTutors = (Array.isArray(db.tutors) ? db.tutors : []).concat(
    Object.values(db.users || {}).filter(u => u && u.role === 'tutor')
  );

  const found = allTutors.find(t => 
    (t.email && t.email.toLowerCase().trim() === tKey) ||
    (t.altEmail && t.altEmail.toLowerCase().trim() === tKey) ||
    (t.name && t.name.toLowerCase().trim() === tKey) ||
    (t.id && t.id.toLowerCase().trim() === tKey) ||
    (t.name && tKey.length > 2 && t.name.toLowerCase().trim().length > 2 && (t.name.toLowerCase().includes(tKey) || tKey.includes(t.name.toLowerCase())))
  );

  if (found) {
    if (found.email) aliases.add(found.email.toLowerCase().trim());
    if (found.altEmail) aliases.add(found.altEmail.toLowerCase().trim());
    if (found.name) aliases.add(found.name.toLowerCase().trim());
    if (found.id) aliases.add(found.id.toLowerCase().trim());
    const parts = (found.name || '').toLowerCase().split(/\s+/).filter(p => p.length > 2);
    parts.forEach(p => aliases.add(p));
  }

  const isTutorMatch = (email, name, mentor) => {
    if (!tKey) return true;
    const e = (email || '').toLowerCase().trim();
    const n = (name || '').toLowerCase().trim();
    const m = (mentor || '').toLowerCase().trim();
    if (e && aliases.has(e)) return true;
    if (e && e.includes('@') && !aliases.has(e)) return false;
    if ((n && aliases.has(n)) || (m && aliases.has(m))) return true;
    for (const alias of aliases) {
      if (alias.length > 2) {
        if (n.length > 2 && (n.includes(alias) || alias.includes(n))) return true;
        if (m.length > 2 && (m.includes(alias) || alias.includes(m))) return true;
      }
    }
    return false;
  };

  const seenLogKeys = new Set();
  const matchingLogs = [];
  records.forEach(r => {
    if (!r) return;
    const matchesTutor = isTutorMatch(r.tutorEmail, r.tutorName, r.mentor);
    const matchesMonth = r.classDate && r.classDate.startsWith(mStr);
    const isValidStatus = r.status === 'approved' || r.status === 'present' || r.status === 'pending' || r.attendanceStatus === 'present' || r.attendanceStatus === 'done' || !r.status;
    if (matchesTutor && matchesMonth && isValidStatus) {
      const logKey = `${String(r.studentId || r.studentName || '').toLowerCase().trim()}|${r.classDate}|${String(r.classTime || '').trim()}`;
      if (!seenLogKeys.has(logKey)) {
        seenLogKeys.add(logKey);
        matchingLogs.push(r);
      }
    }
  });

  const seenMonthSchedKeys = new Set();
  const allMonthTutorSchedules = [];
  const matchingSchedules = [];
  schedules.forEach(s => {
    if (!s || s.status === 'cancelled' || s.attendanceStatus === 'cancelled') return;
    const matchesTutor = isTutorMatch(s.tutorEmail, s.tutorName, s.mentor);
    const matchesMonth = s.date && s.date.startsWith(mStr);
    if (!matchesTutor || !matchesMonth) return;

    const schedKey = `${String(s.studentId || s.studentName || '').toLowerCase().trim()}|${s.date}|${String(s.time || '').trim()}`;
    if (seenMonthSchedKeys.has(schedKey)) return;
    seenMonthSchedKeys.add(schedKey);
    allMonthTutorSchedules.push(s);

    const isCompleted = s.attendanceStatus === 'present' || s.attendanceStatus === 'done' || s.status === 'done';
    const alreadyInLogs = matchingLogs.some(l => l.classDate === s.date && (
      (l.studentId && s.studentId && l.studentId === s.studentId) ||
      (l.studentName && s.studentName && l.studentName.toLowerCase().trim() === s.studentName.toLowerCase().trim())
    ));
    if (isCompleted && !alreadyInLogs) {
      matchingSchedules.push(s);
    }
  });

  let totalMinutes = 0;
  const studentStats = {};

  matchingLogs.forEach(r => {
    const mins = parseInt(r.duration, 10) || 60;
    totalMinutes += mins;
    const sid = r.studentId || r.studentName || 'unknown';
    if (!studentStats[sid]) {
      studentStats[sid] = { sessions: 0, minutes: 0, topics: [], studentName: r.studentName };
    }
    studentStats[sid].sessions += 1;
    studentStats[sid].minutes += mins;
    if (r.topic || r.whatBuilt) {
      studentStats[sid].topics.push(r.topic || r.whatBuilt);
    }
  });

  matchingSchedules.forEach(s => {
    const mins = parseInt(s.duration, 10) || 60;
    totalMinutes += mins;
    const sid = s.studentId || s.studentName || 'unknown';
    if (!studentStats[sid]) {
      studentStats[sid] = { sessions: 0, minutes: 0, topics: [], studentName: s.studentName };
    }
    studentStats[sid].sessions += 1;
    studentStats[sid].minutes += mins;
    if (s.topic || s.module) {
      studentStats[sid].topics.push(s.topic || s.module);
    }
  });

  const totalSessions = matchingLogs.length + matchingSchedules.length;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const approvedLogs = matchingLogs.filter(r => r.status === 'approved');
  const pendingReviewSessions = matchingLogs.filter(r => r.status === 'pending').length;

  let approvedMinutes = 0;
  approvedLogs.forEach(r => {
    approvedMinutes += (parseInt(r.duration, 10) || 60);
  });
  const approvedSessions = approvedLogs.length;
  const approvedHours = Math.round((approvedMinutes / 60) * 10) / 10;
  const hourlyRate = (found && parseFloat(found.hourlyRate)) || 25.00;
  const approvedPayout = parseFloat((approvedHours * hourlyRate).toFixed(2));

  const weeklySlots = getCanonicalWeeklySchedules(db, found ? (found.email || found.id || tKey) : tKey);
  const weeklyMinutes = weeklySlots.reduce((acc, s) => acc + (parseInt(s.duration, 10) || 60), 0);
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;

  return {
    month: mStr,
    scheduledSessions: Math.max(allMonthTutorSchedules.length, totalSessions),
    weeklySessions: weeklySlots.length,
    weeklyHours: weeklyHours,
    totalSessions: totalSessions,
    totalHours: totalHours,
    totalMinutes: totalMinutes,
    approvedSessions: approvedSessions,
    approvedHours: approvedHours,
    approvedMinutes: approvedMinutes,
    pendingReviewSessions: pendingReviewSessions,
    approvedPayout: approvedPayout,
    hourlyRate: hourlyRate,
    studentStats: studentStats
  };
}

/**
 * Generates the full master payroll and remittance ledger for a target month.
 * @param {string|null} monthYear - e.g. '2026-10'
 * @param {object} db
 * @returns {object}
 */
export function getPayrollLedger(monthYear = null, db = {}) {
  const tutors = Array.isArray(db.tutors) ? db.tutors : [];
  const attendances = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const disbursements = Array.isArray(db.payrollDisbursements) ? db.payrollDisbursements : [];

  const targetMonth = monthYear || new Date().toISOString().slice(0, 7);
  const isDisbursed = disbursements.some(d => d && d.month === targetMonth && d.status === 'PAID');

  const facultySummary = [];
  let totalVerifiedHours = 0;
  let totalGrossPayoutUSD = 0;

  tutors.forEach(tut => {
    if (!tut) return;
    const tutEmail = (tut.email || '').toLowerCase().trim();
    const tutName = tut.name || 'Tutor';
    const hourlyRate = parseFloat(tut.hourlyRate) || 35.00;

    const approvedSessions = attendances.filter(att => {
      if (!att || att.status !== 'approved') return false;
      const attEmail = (att.tutorEmail || '').toLowerCase().trim();
      const attName = (att.tutorName || att.mentor || '').trim();
      const matchesTutor = (tutEmail && attEmail === tutEmail) || (attName && attName === tutName);
      if (!matchesTutor) return false;
      const attDate = att.classDate || att.date || (att.createdAt ? att.createdAt.slice(0, 10) : '');
      return attDate && attDate.startsWith(targetMonth);
    });

    const hoursSum = approvedSessions.reduce((acc, curr) => acc + (parseFloat(curr.duration) || 60) / 60, 0);
    const payout = Math.round(hoursSum * hourlyRate * 100) / 100;

    totalVerifiedHours += hoursSum;
    totalGrossPayoutUSD += payout;

    facultySummary.push({
      tutorId: tut.id,
      tutorName: tutName,
      tutorEmail: tutEmail,
      phone: tut.phone || '',
      hourlyRate: hourlyRate,
      bankName: tut.bankName || 'GTBank',
      accountHolderName: tut.accountHolderName || tutName,
      accountNumber: tut.accountNumber || '0123456789',
      verifiedHours: Math.round(hoursSum * 10) / 10,
      approvedSessionsCount: approvedSessions.length,
      grossPayout: payout,
      status: isDisbursed ? 'PAID' : (hoursSum > 0 ? 'READY_FOR_PAYOUT' : 'NO_BILLABLE_HOURS'),
      sessions: approvedSessions
    });
  });

  return {
    month: targetMonth,
    isDisbursed: isDisbursed,
    totalTutors: facultySummary.length,
    activePayableTutors: facultySummary.filter(f => f.verifiedHours > 0).length,
    totalVerifiedHours: Math.round(totalVerifiedHours * 10) / 10,
    totalGrossPayoutUSD: Math.round(totalGrossPayoutUSD * 100) / 100,
    disbursements: facultySummary
  };
}

/**
 * Record a month as disbursed with payment reference.
 * @param {string} monthYear
 * @param {string} paymentReference
 * @param {object} db
 * @param {object} storageService
 * @returns {object}
 */
export function markPayrollDisbursed(monthYear, paymentReference = '', db = {}, storageService = null) {
  if (!Array.isArray(db.payrollDisbursements)) {
    db.payrollDisbursements = [];
  }

  const record = {
    id: `disb-${Date.now()}`,
    month: monthYear,
    paymentReference: paymentReference || `PAY-${Date.now()}`,
    status: 'PAID',
    disbursedAt: new Date().toISOString()
  };

  db.payrollDisbursements = db.payrollDisbursements.filter(d => d && d.month !== monthYear);
  db.payrollDisbursements.push(record);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'payrollDisbursements', item: record } }));
  }

  return record;
}

/**
 * 1-Click Batch approve all pending sessions for a target month.
 * @param {string} monthYear
 * @param {object} db
 * @param {object} storageService
 * @returns {object}
 */
export function batchApproveMonthPayroll(monthYear, db = {}, storageService = null) {
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  let updatedCount = 0;

  records.forEach(r => {
    if (!r) return;
    const classDate = r.classDate || r.date;
    if (classDate && classDate.startsWith(monthYear) && r.status === 'pending') {
      r.status = 'approved';
      r.approvedAt = new Date().toISOString();
      updatedCount++;
    }
  });

  if (updatedCount > 0 && storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (updatedCount > 0 && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'attendanceRecords' } }));
  }

  return { success: true, updatedCount: updatedCount, month: monthYear };
}

/**
 * Computes on-time attendance submission and turnaround performance metrics for a tutor.
 * @param {string} tutorEmail
 * @param {object} db
 * @returns {object}
 */
export function calculateTutorPerformance(tutorEmail, db = {}) {
  const attendances = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const tLower = (tutorEmail || '').toLowerCase().trim();

  const tutorRecords = attendances.filter(r => {
    if (!r) return false;
    const rEmail = (r.tutorEmail || '').toLowerCase().trim();
    return rEmail === tLower;
  });

  if (tutorRecords.length === 0) {
    return {
      totalSessions: 0,
      approvedSessions: 0,
      pendingSessions: 0,
      onTimeSubmissions: 0,
      onTimeRate: 100,
      onTimeRateFormatted: '100%',
      avgTurnaroundHours: 0,
      fulfillmentTier: 'Tier 1: Exemplary',
      tierName: 'Tier 1: Exemplary',
      tierColor: 'emerald'
    };
  }

  let onTimeCount = 0;
  let totalTurnaroundHours = 0;
  let turnaroundMeasuredCount = 0;

  tutorRecords.forEach(r => {
    const dateStr = r.classDate || r.date;
    if (dateStr && r.timestamp) {
      const classTimeStr = r.classTime || '18:00';
      const classDateTime = new Date(`${dateStr}T${classTimeStr}:00`);
      const subDateTime = new Date(r.timestamp);
      if (!isNaN(classDateTime.getTime()) && !isNaN(subDateTime.getTime())) {
        const diffHours = (subDateTime.getTime() - classDateTime.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 24) {
          onTimeCount++;
        }
        if (diffHours >= 0) {
          totalTurnaroundHours += diffHours;
          turnaroundMeasuredCount++;
        }
      } else {
        onTimeCount++;
      }
    } else {
      onTimeCount++;
    }
  });

  const onTimeRate = Math.round((onTimeCount / tutorRecords.length) * 100);
  const avgTurnaround = turnaroundMeasuredCount > 0 ? (Math.round((totalTurnaroundHours / turnaroundMeasuredCount) * 10) / 10) : 1.5;
  const approvedCount = tutorRecords.filter(r => r.status === 'approved').length;

  let fulfillmentTier = 'Tier 1: Exemplary';
  let tierColor = 'emerald';
  if (onTimeRate >= 90) {
    fulfillmentTier = 'Tier 1: Exemplary';
    tierColor = 'emerald';
  } else if (onTimeRate >= 75) {
    fulfillmentTier = 'Tier 2: Standard';
    tierColor = 'blue';
  } else {
    fulfillmentTier = 'Tier 3: Needs Review';
    tierColor = 'amber';
  }

  return {
    totalSessions: tutorRecords.length,
    approvedSessions: approvedCount,
    pendingSessions: tutorRecords.filter(r => r.status === 'pending').length,
    onTimeSubmissions: onTimeCount,
    onTimeRate: onTimeRate,
    onTimeRateFormatted: `${onTimeRate}%`,
    avgTurnaroundHours: avgTurnaround,
    fulfillmentTier: fulfillmentTier,
    tierName: fulfillmentTier,
    tierColor: tierColor
  };
}

export const PayrollService = {
  getCanonicalWeeklySchedules,
  calculateTutorMonthlyStats,
  getPayrollLedger,
  markPayrollDisbursed,
  batchApproveMonthPayroll,
  calculateTutorPerformance
};
