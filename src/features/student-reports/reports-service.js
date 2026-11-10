/**
 * STEMulus Student Reports Feature Service (ES Module)
 * Authoritative business logic for monthly academic evaluations,
 * Director Voice sanitization, AI Woohoo moments crawler,
 * weekly session aggregation, report approvals and revision cycles.
 */

/**
 * Strips em-dashes and normalizes text for clear communication.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeDirectorVoice(text) {
  if (!text || typeof text !== 'string') return '';
  const emDashChar = String.fromCharCode(8212);
  const enDashChar = String.fromCharCode(8211);
  const doubleHyphen = String.fromCharCode(45, 45);
  let cleaned = text
    .split(emDashChar).join(', ')
    .split(enDashChar).join('-')
    .split(doubleHyphen).join(', ')
    .replace(/&(?:m|n)dash;/gi, ', ')
    .replace(/(?:,\s*){2,}/g, ', ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

/**
 * Automatically compiles attendance logs, built projects, and completed project links into a monthly report.
 * @param {object} report
 * @param {object} db
 * @returns {object}
 */
export function compileStudentAttendanceForReport(report, db = {}) {
  if (!report || typeof report !== 'object') return report;
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  const sId = report.studentId || '';
  const sNameLower = String(report.studentName || '').toLowerCase().trim();
  const monthPrefix = report.month && /^\d{4}-\d{2}/.test(String(report.month)) ? String(report.month).slice(0, 7) : '';

  const matchingLogs = records.filter(r => {
    if (!r || r.status === 'rejected' || r.attendanceStatus === 'absent') return false;
    const idMatch = sId && r.studentId === sId;
    const nameMatch = !r.studentId && sNameLower && String(r.studentName || '').toLowerCase().trim() === sNameLower;
    if (!idMatch && !nameMatch) return false;
    if (monthPrefix && r.classDate && String(r.classDate).slice(0, 7) !== monthPrefix) {
      return false;
    }
    return true;
  });

  const existingRawLinks = report.completedProjectLinks !== undefined
    ? report.completedProjectLinks
    : (report.completed_project_links || report.projectLinks || '');
  const initialLinks = Array.isArray(existingRawLinks)
    ? existingRawLinks.map(u => String(u || '').trim()).filter(Boolean)
    : String(existingRawLinks || '').split(/[\n,]+/).map(u => u.trim()).filter(Boolean);

  const linkSet = new Set(initialLinks);
  const topicSet = new Set();
  const buildSet = new Set();
  const sessionLogs = [];

  matchingLogs.forEach(r => {
    const rLinks = Array.isArray(r.completedProjectLinks)
      ? r.completedProjectLinks
      : String(r.completed_project_links || r.projectLink || '').split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    rLinks.forEach(l => {
      if (l) linkSet.add(l);
    });
    if (r.topic) topicSet.add(sanitizeDirectorVoice(String(r.topic).trim()));
    if (r.whatBuilt) buildSet.add(sanitizeDirectorVoice(String(r.whatBuilt).trim()));
    sessionLogs.push({
      id: r.id,
      date: r.classDate || r.date || '',
      topic: sanitizeDirectorVoice(r.topic || ''),
      whatBuilt: sanitizeDirectorVoice(r.whatBuilt || ''),
      tutorComment: sanitizeDirectorVoice(r.tutorComment || r.notes || ''),
      conceptGrasp: r.conceptGrasp || 4,
      completedProjectLinks: rLinks.filter(Boolean)
    });
  });

  report.completedProjectLinks = Array.from(linkSet);
  report.completed_project_links = report.completedProjectLinks.join(', ');
  report.compiledTopics = Array.from(topicSet);
  report.compiledBuilds = Array.from(buildSet);
  report.compiledSessionLogs = sessionLogs;
  if (!report.topics && report.compiledTopics.length > 0) {
    report.topics = report.compiledTopics.join('; ');
  }
  if (!report.sessionsAttended && matchingLogs.length > 0) {
    report.sessionsAttended = matchingLogs.length;
  }
  return report;
}

/**
 * Generates the Oval Office STEMulus standard formatted HTML preview for the Admin Email Queue.
 * @param {object} r
 * @returns {string}
 */
export function buildOvalOfficeEmailPreviewHtml(r = {}) {
  const sName = sanitizeDirectorVoice(r.studentName || 'Student');
  const month = sanitizeDirectorVoice(r.month || 'Current Period');
  const course = sanitizeDirectorVoice(r.course || 'Coding & Robotics Track');
  const tutor = sanitizeDirectorVoice(r.tutorName || 'Assigned Instructor');
  const grade = sanitizeDirectorVoice(r.overallGrade || 'A');
  const narrative = sanitizeDirectorVoice(r.journeyNarrative || r.topics || `${sName} demonstrated consistent focus and hands-on engineering growth throughout ${month}.`);
  const highlights = sanitizeDirectorVoice(r.shiningHighlights || r.strengths || (Array.isArray(r.compiledBuilds) && r.compiledBuilds.length ? r.compiledBuilds.join(' | ') : 'Completed structured programming exercises and live debugging sessions.'));
  const recommendation = sanitizeDirectorVoice(r.recommendation || 'Continue practicing independent problem-solving between weekly mentored classes.');
  const links = Array.isArray(r.completedProjectLinks) ? r.completedProjectLinks.filter(Boolean) : [];
  const linksHtml = links.length > 0
    ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:12px;color:#0f172a;"><strong>Completed Project Links:</strong> ${links.map(u => `<a href="${u}" target="_blank" style="color:#2563eb;font-weight:700;margin-right:8px;">${u}</a>`).join(', ')}</div>`
    : '';

  return `<div style="font-family:'Plus Jakarta Sans',Inter,sans-serif;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;color:#0f172a;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:12px;">
      <div>
        <div style="font-size:14px;font-weight:800;color:#0f172a;">STEMulus Innovation Limited</div>
        <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Private In-Home Technology Education • Official Academic Evaluation</div>
      </div>
      <div style="text-align:right;">
        <span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">Standing: ${grade} (${month})</span>
      </div>
    </div>
    <div style="font-size:12px;color:#334155;margin-bottom:10px;">
      <strong>Student:</strong> ${sName} &nbsp;•&nbsp; <strong>Track:</strong> ${course} &nbsp;•&nbsp; <strong>Instructor:</strong> ${tutor}
    </div>
    <div style="font-size:12px;color:#1e293b;line-height:1.55;margin-bottom:8px;">
      <strong>Executive Summary:</strong> ${narrative}
    </div>
    <div style="font-size:12px;color:#1e293b;line-height:1.55;margin-bottom:8px;">
      <strong>Breakthrough Highlights:</strong> ${highlights}
    </div>
    <div style="font-size:12px;color:#1e293b;line-height:1.55;">
      <strong>Home Practice Recommendation:</strong> ${recommendation}
    </div>
    ${linksHtml}
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#475569;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <span><strong>Official Email:</strong> admin@stemuluskidstech.com • <strong>Operations:</strong> 09067521562 • <strong>Emergency:</strong> 07052466716</span>
      <span><strong>Signatory:</strong> Director, STEMulus Innovations Limited</span>
    </div>
  </div>`;
}

/**
 * Crawl attendance records and tutor remarks for student breakthrough moments.
 * @param {string} studentId
 * @param {string|null} reportingMonth
 * @param {object} db
 * @returns {Array}
 */
export function crawlWoohooMoments(studentId, reportingMonth = null, db = {}) {
  const records = Array.isArray(db.attendanceRecords) ? db.attendanceRecords : [];
  if (!records.length) return [];

  let targetName = '';
  if (Array.isArray(db.students)) {
    const std = db.students.find(s => s && s.id === studentId);
    if (std) {
      targetName = ((std.firstName || '') + ' ' + (std.lastName || '')).toLowerCase().trim();
    }
  }

  const studentRecords = records.filter(r => {
    if (!r) return false;
    const matchId = (r.studentId && (r.studentId === studentId || r.studentId === 'std-pearl-01'));
    const rName = (r.studentName || '').toLowerCase().trim();
    const matchName = targetName && (rName === targetName || (rName && targetName.includes(rName)) || (targetName && rName.includes(targetName)));
    return matchId || matchName;
  });

  const breakthroughs = [];
  const keywords = [
    'loop', 'loops', 'function', 'variable', 'debug', 'debugged',
    'independently', 'solved', 'created', 'built', 'project',
    'completed', 'milestone', 'logic', 'breakthrough', 'excited',
    'impressive', 'algorithm', 'syntax', 'game', 'calculator'
  ];

  studentRecords.forEach(r => {
    const topic = r.topic || '';
    const summary = r.summary || '';
    const remark = r.tutorRemark || '';
    const combined = `${topic} ${summary} ${remark}`.toLowerCase();

    const matchedKeyword = keywords.find(k => combined.includes(k));
    if (matchedKeyword) {
      let momentDesc = '';
      if (summary && summary.length > 20) {
        const firstSentence = summary.split(/[.\n]/)[0].trim();
        momentDesc = firstSentence;
      } else if (topic) {
        momentDesc = `Demonstrated solid mastery and hands-on implementation of ${topic}.`;
      }

      if (momentDesc) {
        breakthroughs.push({
          date: r.dateFormatted || r.date,
          topic: topic || 'Core Programming',
          moment: sanitizeDirectorVoice(momentDesc),
          tutorRemark: sanitizeDirectorVoice(remark)
        });
      }
    }
  });

  return breakthroughs.slice(-3);
}

/**
 * Retrieve progress reports, optionally filtered by studentId.
 * @param {string|null} studentId
 * @param {object} db
 * @returns {Array}
 */
export function getReports(studentId = null, db = {}) {
  const reps = Array.isArray(db.progressReports) ? db.progressReports : [];
  if (studentId) {
    return reps.filter(r => r && r.studentId === studentId);
  }
  return reps;
}

/**
 * Add a progress report and queue parent notification.
 * @param {object} rawReport
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addReport(rawReport, db = {}, storageService = null) {
  if (!Array.isArray(db.progressReports)) db.progressReports = [];
  const report = Object.assign({}, rawReport);
  report.id = report.id || `rep-${Date.now()}`;
  db.progressReports.push(report);

  if (Array.isArray(db.students)) {
    const student = db.students.find(s => s && s.id === report.studentId);
    if (student && student.parentEmail) {
      if (!Array.isArray(db.notifications)) db.notifications = [];
      db.notifications.push({
        id: `not-${Date.now()}`,
        title: 'New Progress Report',
        message: `A new progress report for ${student.firstName || 'your student'} is available in your dashboard.`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: student.parentEmail.toLowerCase().trim()
      });
    }
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'progressReports', item: report } }));
  }

  return report;
}

/**
 * Retrieve monthly reports with flexible filtering.
 * @param {string|object|null} filter
 * @param {object} db
 * @param {object|null} currentSession
 * @returns {Array}
 */
export function getMonthlyReports(filter = null, db = {}, currentSession = null) {
  const reports = Array.isArray(db.monthlyReports) ? db.monthlyReports : [];
  if (!filter) return reports;

  if (typeof filter === 'string') {
    const filterLower = filter.toLowerCase().trim();
    if (currentSession && currentSession.role === 'admin' && filterLower === (currentSession.email || '').toLowerCase()) {
      return reports;
    }
    return reports.filter(r => {
      if (!r) return false;
      return (r.tutorEmail && r.tutorEmail.toLowerCase().trim() === filterLower) ||
        (r.parentEmail && r.parentEmail.toLowerCase().trim() === filterLower) ||
        (r.studentId && r.studentId === filter) ||
        (r.status && r.status === filter);
    });
  }

  if (typeof filter === 'object') {
    return reports.filter(r => {
      if (!r) return false;
      for (const key in filter) {
        if (filter[key] !== undefined && filter[key] !== null) {
          const val = r[key];
          if (typeof val === 'string' && typeof filter[key] === 'string') {
            if (val.toLowerCase() !== filter[key].toLowerCase()) return false;
          } else if (val !== filter[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  return reports;
}

/**
 * Submit or update a monthly progress report by tutor.
 * @param {object} rawReport
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addMonthlyReport(rawReport, db = {}, storageService = null) {
  if (!rawReport || typeof rawReport !== 'object') {
    return { success: false, code: 'INVALID_PAYLOAD', message: 'Report payload is required.' };
  }
  if (!Array.isArray(db.monthlyReports)) db.monthlyReports = [];
  const report = Object.assign({}, rawReport);

  // Oversized payload protection (>10,000 chars per field or >25,000 total)
  const textFieldsToCheck = [
    report.journeyNarrative, report.shiningHighlights, report.growthAreas,
    report.tutorNotes, report.topics, report.strengths, report.challenges,
    report.recommendation, report.otherComments
  ];
  let totalChars = 0;
  for (const val of textFieldsToCheck) {
    if (typeof val === 'string') {
      if (val.length > 10000) {
        return {
          success: false,
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Report field exceeds the maximum allowed length of 10,000 characters.'
        };
      }
      totalChars += val.length;
    }
  }
  if (totalChars > 25000) {
    return {
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Total report payload exceeds the maximum allowed length of 25,000 characters.'
    };
  }

  // Inherit existing fields if updating an existing report by ID
  const existingIdx = report.id ? db.monthlyReports.findIndex(r => r && r.id === report.id) : -1;
  const existingReport = existingIdx !== -1 ? db.monthlyReports[existingIdx] : null;
  if (existingReport) {
    report.month = report.month || existingReport.month;
    report.studentId = report.studentId || existingReport.studentId;
    report.studentName = report.studentName || existingReport.studentName;
    report.parentEmail = report.parentEmail || existingReport.parentEmail;
    report.course = report.course || existingReport.course;
  }

  // Required fields validation for non-draft submissions
  const isDraft = report.status === 'draft';
  if (!isDraft) {
    const hasStudentIdentifier = Boolean((report.studentId && String(report.studentId).trim()) || (report.studentName && String(report.studentName).trim()));
    const hasMonth = Boolean(report.month && String(report.month).trim());
    const hasEvaluationBody = Boolean(
      (report.shiningHighlights && String(report.shiningHighlights).trim()) ||
      (report.strengths && String(report.strengths).trim()) ||
      (report.topics && String(report.topics).trim()) ||
      (report.journeyNarrative && String(report.journeyNarrative).trim()) ||
      (report.feedback && String(report.feedback).trim())
    );
    if (!hasStudentIdentifier || !hasMonth || (report.requireComplete !== false && !hasEvaluationBody)) {
      return {
        success: false,
        code: 'INCOMPLETE_REPORT',
        message: 'Incomplete monthly report: student, reporting month, and evaluation highlights/strengths are required.'
      };
    }
  }

  const students = Array.isArray(db.students) ? db.students : [];
  if (report.studentId && (!report.parentEmail || !report.studentName)) {
    const matchedById = students.find(s => s && s.id === report.studentId);
    if (matchedById) {
      report.studentName = report.studentName || ((matchedById.firstName || '') + ' ' + (matchedById.lastName || '')).trim();
      report.parentEmail = report.parentEmail || matchedById.parentEmail;
      report.parentName = report.parentName || matchedById.parentName;
      if (!report.course && matchedById.program) report.course = matchedById.program;
    }
  }

  if (report.studentName && (!report.studentId || !report.parentEmail)) {
    const sNameLower = report.studentName.toLowerCase().trim();
    const matched = students.find(s => {
      if (!s) return false;
      const full = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
      return full === sNameLower || (s.firstName && s.firstName.toLowerCase().trim() === sNameLower);
    });
    if (matched) {
      report.studentId = report.studentId || matched.id;
      report.parentEmail = report.parentEmail || matched.parentEmail;
      report.parentName = report.parentName || matched.parentName;
      if (!report.course && matched.program) report.course = matched.program;
    }
  }

  report.journeyNarrative = sanitizeDirectorVoice(report.journeyNarrative);
  report.shiningHighlights = sanitizeDirectorVoice(report.shiningHighlights || report.strengths);
  report.strengths = sanitizeDirectorVoice(report.strengths || report.shiningHighlights);
  report.growthAreas = sanitizeDirectorVoice(report.growthAreas || report.challenges);
  report.challenges = sanitizeDirectorVoice(report.challenges || report.growthAreas);
  report.recommendation = sanitizeDirectorVoice(report.recommendation);
  report.tutorNotes = sanitizeDirectorVoice(report.tutorNotes);

  // Automatically compile attendance logs and completed project links for this student/month
  compileStudentAttendanceForReport(report, db);

  if (existingIdx !== -1) {
    const existingReport = db.monthlyReports[existingIdx];
    if (existingReport && ['approved', 'sent_to_parent', 'published'].includes(existingReport.status) && !report.allowFinalizedEdit) {
      return {
        success: false,
        locked: true,
        code: 'REPORT_LOCKED_FINALIZED',
        message: 'This monthly report has already been approved and finalized. Tutors are locked out of editing finalized reports.'
      };
    }
    report.status = 'pending_review';
    report.resubmittedAt = new Date().toISOString();
    report.rejectionReason = '';
    db.monthlyReports[existingIdx] = Object.assign({}, db.monthlyReports[existingIdx], report);
    const updatedReport = db.monthlyReports[existingIdx];

    if (updatedReport.parentEmail) {
      if (!Array.isArray(db.emailQueue)) db.emailQueue = [];
      const eqIdx = db.emailQueue.findIndex(eq => eq && eq.data && eq.data.reportId === updatedReport.id);
      const previewHtml = buildOvalOfficeEmailPreviewHtml(updatedReport);
      const eqEntry = {
        id: eqIdx !== -1 ? db.emailQueue[eqIdx].id : `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'monthly_report',
        from: 'admin@stemuluskidstech.com',
        senderEmail: 'admin@stemuluskidstech.com',
        to: updatedReport.parentEmail.toLowerCase().trim(),
        recipientEmail: updatedReport.parentEmail.toLowerCase().trim(),
        recipientName: updatedReport.parentName || 'Parent',
        subject: `STEMulus Official Monthly Academic Evaluation - ${updatedReport.studentName || 'Student'} (${updatedReport.month || ''})`,
        htmlPreview: previewHtml,
        status: 'draft',
        createdAt: eqIdx !== -1 ? db.emailQueue[eqIdx].createdAt : new Date().toISOString(),
        queuedAt: new Date().toISOString(),
        data: {
          reportId: updatedReport.id,
          studentId: updatedReport.studentId,
          studentName: updatedReport.studentName,
          grade: updatedReport.overallGrade || 'A',
          month: updatedReport.month,
          course: updatedReport.course,
          tutorName: updatedReport.tutorName,
          completedProjectLinks: updatedReport.completedProjectLinks || [],
          compiledTopics: updatedReport.compiledTopics || [],
          compiledBuilds: updatedReport.compiledBuilds || [],
          pdfHtml: previewHtml,
          directorNote: updatedReport.adminNotes || 'Approved by Academic Director'
        },
        triggeredBy: `tutor_monthly_report_resubmit:${updatedReport.id}`
      };
      if (eqIdx !== -1) db.emailQueue[eqIdx] = eqEntry;
      else db.emailQueue.push(eqEntry);
    }

    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'monthlyReports', item: db.monthlyReports[existingIdx] } }));
    }
    return Object.assign({ success: true, isUpdate: true }, db.monthlyReports[existingIdx]);
  }

  // Also check if a finalized report already exists for this same studentId + month
  if (report.studentId && report.month && !report.allowFinalizedEdit) {
    const finalizedDup = db.monthlyReports.find(r =>
      r &&
      r.studentId === report.studentId &&
      String(r.month || '').toLowerCase().trim() === String(report.month || '').toLowerCase().trim() &&
      ['approved', 'sent_to_parent', 'published'].includes(r.status)
    );
    if (finalizedDup) {
      return {
        success: false,
        locked: true,
        code: 'REPORT_LOCKED_FINALIZED',
        message: 'A finalized monthly report already exists for this student and month. Tutors cannot overwrite or duplicate approved reports.'
      };
    }
  }

  report.id = report.id || (`mrep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  report.createdAt = report.createdAt || new Date().toISOString();
  report.submittedAt = report.submittedAt || new Date().toISOString();
  report.status = report.status || 'pending_review';
  report.rejectionReason = report.rejectionReason || '';
  report.adminNotes = report.adminNotes || '';
  db.monthlyReports.push(report);

  // Automatically compile and queue in Admin Email Queue (draft ready to send from admin@stemuluskidstech.com)
  if (!isDraft && report.parentEmail) {
    if (!Array.isArray(db.emailQueue)) db.emailQueue = [];
    const existingEqIdx = db.emailQueue.findIndex(eq => eq && eq.data && eq.data.reportId === report.id);
    const previewHtml = buildOvalOfficeEmailPreviewHtml(report);
    const eqItem = {
      id: existingEqIdx !== -1 ? db.emailQueue[existingEqIdx].id : `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'monthly_report',
      from: 'admin@stemuluskidstech.com',
      senderEmail: 'admin@stemuluskidstech.com',
      to: report.parentEmail.toLowerCase().trim(),
      recipientEmail: report.parentEmail.toLowerCase().trim(),
      recipientName: report.parentName || 'Parent',
      subject: `STEMulus Official Monthly Academic Evaluation - ${report.studentName || 'Student'} (${report.month || ''})`,
      htmlPreview: previewHtml,
      status: 'draft',
      createdAt: new Date().toISOString(),
      queuedAt: new Date().toISOString(),
      data: {
        reportId: report.id,
        studentId: report.studentId,
        studentName: report.studentName,
        grade: report.overallGrade || 'A',
        month: report.month,
        course: report.course,
        tutorName: report.tutorName,
        completedProjectLinks: report.completedProjectLinks || [],
        compiledTopics: report.compiledTopics || [],
        compiledBuilds: report.compiledBuilds || [],
        pdfHtml: previewHtml,
        directorNote: report.adminNotes || 'Approved by Academic Director'
      },
      triggeredBy: `tutor_monthly_report_submit:${report.id}`
    };
    if (existingEqIdx !== -1) db.emailQueue[existingEqIdx] = eqItem;
    else db.emailQueue.push(eqItem);
  }

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.push({
    id: `not-${Date.now()}`,
    title: 'New Monthly Report Submitted',
    message: `${report.tutorName || 'A tutor'} submitted a monthly report for ${report.studentName || 'a student'} (${report.month || 'Current Month'}). Pending review.`,
    timestamp: new Date().toISOString(),
    read: false,
    userEmail: 'admin@stemuluskidstech.com'
  });

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'monthlyReports', item: report } }));
  }

  return Object.assign({ success: true }, report);
}

/**
 * Update an existing monthly report.
 * @param {string} id
 * @param {object} updates
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateMonthlyReport(id, updates, db = {}, storageService = null, session = null) {
  if (!Array.isArray(db.monthlyReports)) return null;
  const idx = db.monthlyReports.findIndex(r => r && r.id === id);
  if (idx === -1) return null;

  const current = db.monthlyReports[idx];
  const isFinalized = current && ['approved', 'sent_to_parent', 'published'].includes(current.status);
  const isAdmin = session && session.role === 'admin';
  if (isFinalized && !isAdmin && (!updates || !updates.allowFinalizedEdit)) {
    return {
      success: false,
      locked: true,
      code: 'REPORT_LOCKED_FINALIZED',
      message: 'This monthly report has already been approved and finalized. Tutors are locked out of editing finalized reports.'
    };
  }

  db.monthlyReports[idx] = Object.assign({}, db.monthlyReports[idx], updates);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'monthlyReports', item: db.monthlyReports[idx] } }));
  }

  return db.monthlyReports[idx];
}

/**
 * Reject monthly report and request revisions from tutor.
 * @param {string} id
 * @param {string} reason
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function rejectMonthlyReport(id, reason, db = {}, storageService = null) {
  if (!Array.isArray(db.monthlyReports)) return null;
  const idx = db.monthlyReports.findIndex(r => r && r.id === id);
  if (idx === -1) return null;

  const r = db.monthlyReports[idx];
  r.status = 'rejected';
  r.rejectionReason = sanitizeDirectorVoice(reason || 'Please revise your feedback and resubmit.');
  r.reviewedAt = new Date().toISOString();

  if (r.tutorEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Monthly Report Revision Requested',
      message: `Admin requested revisions for ${r.studentName || 'student'}'s ${r.month || ''} report: "${r.rejectionReason}". You can edit and resubmit in your portal.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: r.tutorEmail.toLowerCase().trim()
    });

    if (typeof fetch === 'function') {
      try {
        fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'monthly-report-revision-tutor',
            to: r.tutorEmail.toLowerCase().trim(),
            studentName: r.studentName,
            month: r.month,
            rejectionReason: r.rejectionReason
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'monthlyReports', item: r } }));
  }

  return r;
}

/**
 * Approve monthly report and deliver to parent.
 * @param {string} id
 * @param {object|null} adminEdits
 * @param {object} db
 * @param {object|null} storageService
 * @param {object|null} currentSession
 * @returns {object|null}
 */
export function approveAndSendMonthlyReport(id, adminEdits = null, db = {}, storageService = null, currentSession = null) {
  if (!Array.isArray(db.monthlyReports)) return null;
  const idx = db.monthlyReports.findIndex(r => r && r.id === id);
  if (idx === -1) return null;

  const r = db.monthlyReports[idx];
  if (adminEdits && typeof adminEdits === 'object') {
    Object.assign(r, adminEdits);
  }

  compileStudentAttendanceForReport(r, db);

  r.status = 'sent_to_parent';
  r.reviewedAt = new Date().toISOString();
  r.sentAt = new Date().toISOString();

  const directorEmail = (currentSession && currentSession.email) ? currentSession.email : 'admin@stemuluskidstech.com';
  r.approvalTimeline = r.approvalTimeline || {};
  r.approvalTimeline.submittedAt = r.submittedAt || r.createdAt || new Date().toISOString();
  r.approvalTimeline.managerApprovedAt = r.reviewedAt;
  r.approvalTimeline.directorApprovedAt = new Date().toISOString();
  r.approvalTimeline.directorEmail = directorEmail;
  r.approvalTimeline.directorNote = (adminEdits && adminEdits.adminNotes) || r.adminNotes || 'Approved by Academic Director';

  const students = Array.isArray(db.students) ? db.students : [];
  const matchedStudent = students.find(s => {
    if (!s) return false;
    return s.id === r.studentId || (r.studentName && ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim() === r.studentName.toLowerCase().trim());
  });

  const parentEmail = r.parentEmail || (matchedStudent ? matchedStudent.parentEmail : null);
  const sId = r.studentId || (matchedStudent ? matchedStudent.id : null);

  if (!Array.isArray(db.progressReports)) db.progressReports = [];
  const existingProgressIdx = db.progressReports.findIndex(p => p && p.monthlyReportId === r.id);
  const progEntry = {
    id: existingProgressIdx !== -1 ? db.progressReports[existingProgressIdx].id : (`rep-${Date.now()}`),
    monthlyReportId: r.id,
    studentId: sId,
    studentName: r.studentName,
    program: r.course,
    date: (r.month ? `${r.month}-28` : new Date().toISOString().split('T')[0]),
    tutorName: r.tutorName,
    module: r.module || 'Monthly Academic Review',
    grade: r.overallGrade || 'A',
    completedProjectLinks: r.completedProjectLinks || [],
    feedback: r.strengths ? (r.strengths + (r.recommendation ? ` | Recommendation: ${r.recommendation}` : '')) : (r.topics || 'Monthly progress evaluation completed.')
  };

  if (existingProgressIdx !== -1) {
    db.progressReports[existingProgressIdx] = progEntry;
  } else {
    db.progressReports.push(progEntry);
  }

  if (parentEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}`,
      title: 'Official Monthly Progress Report Ready! [Report]',
      message: `The official ${r.month || ''} progress evaluation for ${r.studentName || 'your child'} is now available in your portal with full academic grades and clean printable PDF.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: parentEmail.toLowerCase().trim()
    });

    if (!Array.isArray(db.emailQueue)) db.emailQueue = [];
    const existingEqIdx = db.emailQueue.findIndex(eq => eq && eq.data && eq.data.reportId === r.id);
    const previewHtml = buildOvalOfficeEmailPreviewHtml(r);
    const eqEntry = {
      id: existingEqIdx !== -1 ? db.emailQueue[existingEqIdx].id : `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'monthly_report',
      from: 'admin@stemuluskidstech.com',
      senderEmail: 'admin@stemuluskidstech.com',
      to: parentEmail.toLowerCase().trim(),
      recipientEmail: parentEmail.toLowerCase().trim(),
      recipientName: r.parentName || 'Parent',
      subject: `STEMulus Official Monthly Academic Evaluation - ${r.studentName || 'Student'} (${r.month || ''})`,
      htmlPreview: previewHtml,
      status: 'draft',
      createdAt: existingEqIdx !== -1 ? db.emailQueue[existingEqIdx].createdAt : new Date().toISOString(),
      queuedAt: new Date().toISOString(),
      data: {
        reportId: r.id,
        studentId: sId,
        studentName: r.studentName,
        grade: r.overallGrade || 'A',
        month: r.month,
        course: r.course,
        tutorName: r.tutorName,
        completedProjectLinks: r.completedProjectLinks || [],
        compiledTopics: r.compiledTopics || [],
        compiledBuilds: r.compiledBuilds || [],
        pdfHtml: previewHtml,
        directorNote: r.approvalTimeline.directorNote
      },
      triggeredBy: `admin_monthly_report_send:${r.id}`
    };
    if (existingEqIdx !== -1) db.emailQueue[existingEqIdx] = eqEntry;
    else db.emailQueue.push(eqEntry);

    if (typeof fetch === 'function') {
      try {
        fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'monthly_report',
            from: 'admin@stemuluskidstech.com',
            to: parentEmail.toLowerCase().trim(),
            studentName: r.studentName,
            grade: r.overallGrade,
            month: r.month,
            course: r.course,
            tutorName: r.tutorName,
            completedProjectLinks: r.completedProjectLinks || [],
            directorNote: r.approvalTimeline.directorNote
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  if (r.tutorEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `not-${Date.now()}-tut`,
      title: 'Monthly Report Dispatched to Parent',
      message: `Your report for ${r.studentName || 'student'} (${r.month || ''}) was approved by admin and dispatched to the parent.`,
      timestamp: new Date().toISOString(),
      read: false,
      userEmail: r.tutorEmail.toLowerCase().trim()
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'monthlyReports', item: r } }));
  }

  r.success = true;
  return r;
}

/**
 * Generate weekly report by aggregating attendance and session records over 7 days.
 * @param {string} studentId
 * @param {object} db
 * @returns {object|null}
 */
export function generateWeeklyReport(studentId, db = {}) {
  const students = Array.isArray(db.students) ? db.students : [];
  const student = students.find(s => s && s.id === studentId);
  if (!student) return null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);

  const schedules = Array.isArray(db.schedules) ? db.schedules : [];
  const records = schedules.filter(s => {
    if (!s || !s.date) return false;
    const d = new Date(s.date);
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const matches = (s.studentId === studentId || s.studentName === fullName) && d >= weekStart && d <= weekEnd;
    return matches;
  });

  if (!records.length) return null;

  const sessionSummaries = records.map(r => ({
    date: r.date,
    topic: r.topic || r.module || '',
    whatBuilt: r.whatBuilt || '',
    attendanceStatus: r.attendanceStatus || '',
    punctuality: r.punctuality || '',
    conceptGrasp: r.conceptGrasp || 0,
    tutorComment: r.tutorComment || '',
    homeworkAssigned: r.homeworkAssigned || '',
    assignmentStatus: r.assignmentStatus || ''
  }));

  let avgGrasp = 0;
  const graspCount = sessionSummaries.filter(s => s.conceptGrasp > 0).length;
  if (graspCount > 0) {
    avgGrasp = Math.round(sessionSummaries.reduce((sum, s) => sum + (s.conceptGrasp || 0), 0) / graspCount * 10) / 10;
  }

  const report = {
    id: `wr-${Date.now()}`,
    studentId: studentId,
    studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
    tutorName: student.tutorName || '',
    parentEmail: student.parentEmail || '',
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    sessionsTotal: records.length,
    sessionsAttended: records.filter(r => r.attendanceStatus === 'present' || r.attendanceStatus === 'done').length,
    averageConceptGrasp: avgGrasp,
    sessions: sessionSummaries,
    generatedAt: new Date().toISOString(),
    status: 'draft'
  };

  return report;
}

/**
 * Generate weekly progress reports for all active enrolled students.
 * @param {object} db
 * @returns {Array}
 */
export function generateAllWeeklyReports(db = {}) {
  const students = Array.isArray(db.students) ? db.students : [];
  const reports = [];
  students
    .filter(s => s && s.status !== 'inactive' && s.status !== 'withdrawn')
    .forEach(student => {
      const report = generateWeeklyReport(student.id, db);
      if (report) reports.push(report);
    });
  return reports;
}

export const StudentReportsService = {
  sanitizeDirectorVoice,
  compileStudentAttendanceForReport,
  buildOvalOfficeEmailPreviewHtml,
  crawlWoohooMoments,
  getReports,
  addReport,
  getMonthlyReports,
  addMonthlyReport,
  updateMonthlyReport,
  rejectMonthlyReport,
  approveAndSendMonthlyReport,
  generateWeeklyReport,
  generateAllWeeklyReports
};
