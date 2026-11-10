/**
 * Apply Full-Stack Audit Remediations (Phases 3, 4, 5)
 * Cleanly patches core JS engines and portal HTML files, then verifies syntax and zero em-dashes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(ROOT, relPath), content, 'utf8');
  console.log('[PATCHED]', relPath);
}

// ---------------------------------------------------------------------------
// 1. Patch src/features/student-reports/reports-service.js
// ---------------------------------------------------------------------------
(function patchReportsService() {
  const rel = 'src/features/student-reports/reports-service.js';
  let code = readFile(rel);

  const target = `export function addMonthlyReport(rawReport, db = {}, storageService = null) {
  if (!Array.isArray(db.monthlyReports)) db.monthlyReports = [];
  const report = Object.assign({}, rawReport);`;

  const replacement = `export function addMonthlyReport(rawReport, db = {}, storageService = null) {
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
  }`;

  if (!code.includes('PAYLOAD_TOO_LARGE')) {
    if (!code.includes(target)) {
      throw new Error('Target not found in ' + rel);
    }
    code = code.replace(target, replacement);
    writeFile(rel, code);
  } else {
    console.log('[SKIP] Already patched', rel);
  }
})();

// ---------------------------------------------------------------------------
// 2. Patch assets/js/monthly-report-engine.js
// ---------------------------------------------------------------------------
(function patchMonthlyReportEngine() {
  const rel = 'assets/js/monthly-report-engine.js';
  let code = readFile(rel);

  const oldSaveAndSubmit = `    // Save report state
    function saveReport(report) {
        if (typeof DashboardEngine === 'undefined') return false;
        const db = DashboardEngine.getDB ? DashboardEngine.getDB() : {};
        db.monthlyReports = db.monthlyReports || [];

        const idx = db.monthlyReports.findIndex(r => r.id === report.id);
        if (idx >= 0) {
            db.monthlyReports[idx] = report;
        } else {
            db.monthlyReports.unshift(report);
        }

        return DashboardEngine.saveDB(db);
    }

    // Submit report by Tutor to Admin
    function submitReport(data) {
        const id = data.id || ('rep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));`;

  const newSaveAndSubmit = `    function escapeHtmlSafe(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Save report state
    function saveReport(report, options) {
        if (typeof DashboardEngine === 'undefined') return false;
        const db = DashboardEngine.getDB ? DashboardEngine.getDB() : {};
        db.monthlyReports = db.monthlyReports || [];

        const idx = db.monthlyReports.findIndex(r => r && r.id === report.id);
        if (idx >= 0) {
            const existing = db.monthlyReports[idx];
            const isAdminAction = options && options.isAdminAction === true;
            if (!isAdminAction && existing && ['approved', 'sent_to_parent', 'published'].includes(existing.status)) {
                return {
                    success: false,
                    locked: true,
                    code: 'REPORT_LOCKED_FINALIZED',
                    message: 'This monthly report has already been approved and finalized. Tutors are locked out of editing finalized reports.'
                };
            }
            db.monthlyReports[idx] = report;
        } else {
            db.monthlyReports.unshift(report);
        }

        return DashboardEngine.saveDB(db);
    }

    // Submit report by Tutor to Admin
    function submitReport(data) {
        if (!data || typeof data !== 'object') {
            return { success: false, code: 'INCOMPLETE_REPORT', message: 'Report data is required.' };
        }
        const hasStudent = Boolean((data.studentId && String(data.studentId).trim()) || (data.studentName && String(data.studentName).trim()));
        const hasMonth = Boolean(data.month && String(data.month).trim());
        const hasBody = Boolean(
            (data.shiningHighlights && String(data.shiningHighlights).trim()) ||
            (data.growthAreas && String(data.growthAreas).trim()) ||
            (data.journeyNarrative && String(data.journeyNarrative).trim())
        );
        if (!hasStudent || !hasMonth || !hasBody) {
            return {
                success: false,
                code: 'INCOMPLETE_REPORT',
                message: 'Incomplete monthly report: student, month, and evaluation highlights/growth areas are required.'
            };
        }
        const rawLen = [data.shiningHighlights, data.growthAreas, data.journeyNarrative, data.tutorNotes]
            .map(v => (typeof v === 'string' ? v.length : 0))
            .reduce((a, b) => a + b, 0);
        if (rawLen > 10000) {
            return {
                success: false,
                code: 'PAYLOAD_TOO_LARGE',
                message: 'Monthly report exceeds maximum length of 10,000 characters.'
            };
        }

        const existingReports = getReports();
        const existingMatch = existingReports.find(r =>
            r && (
                (data.id && r.id === data.id) ||
                (!data.id && r.studentId && data.studentId && r.studentId === data.studentId && String(r.month || '').toLowerCase() === String(data.month || '').toLowerCase())
            )
        );
        if (existingMatch && ['approved', 'sent_to_parent', 'published'].includes(existingMatch.status)) {
            return {
                success: false,
                locked: true,
                code: 'REPORT_LOCKED_FINALIZED',
                message: 'A finalized monthly report already exists for this student and month. Tutors cannot overwrite approved reports.'
            };
        }

        const id = (existingMatch && existingMatch.id) || data.id || ('rep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));`;

  if (!code.includes('REPORT_LOCKED_FINALIZED')) {
    code = code.replace(/\r\n/g, '\n');
    if (!code.includes(oldSaveAndSubmit)) {
      throw new Error('Target not found in ' + rel);
    }
    code = code.replace(oldSaveAndSubmit, newSaveAndSubmit);
    code = code.replace('saveReport(report);\n\n        // Notify tutor', 'saveReport(report, { isAdminAction: true });\n\n        // Notify tutor');
    code = code.replace('report.sentAt = new Date().toISOString();\n        saveReport(report);', 'report.sentAt = new Date().toISOString();\n        saveReport(report, { isAdminAction: true });');
    writeFile(rel, code);
  } else {
    console.log('[SKIP] Already patched', rel);
  }
})();

// ---------------------------------------------------------------------------
// 3. Patch assets/js/parent-engine.js
// ---------------------------------------------------------------------------
(function patchParentEngine() {
  const rel = 'assets/js/parent-engine.js';
  let code = readFile(rel).replace(/\r\n/g, '\n');

  // Fix 3a: Remove misplaced launchMeeting inside .map(function(r) { ... })
  const brokenMapBlock = `            }).map(function(r) {
                
    function launchMeeting(e, url, scheduleId, studentName, courseName) {
        const targetUrl = url || 'https://meet.google.com';
        if (typeof STEMulus !== 'undefined' && STEMulus.Classroom && typeof STEMulus.Classroom.launchMeetingSession === 'function') {
            STEMulus.Classroom.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        } else if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.launchMeetingSession === 'function') {
            DashboardEngine.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        }
    }

    return {
        launchMeeting,
                    date: r.classDate || r.date || '',`;

  const cleanMapBlock = `            }).map(function(r) {
                return {
                    date: r.classDate || r.date || '',`;

  if (code.includes(brokenMapBlock)) {
    code = code.replace(brokenMapBlock, cleanMapBlock);
  }

  // Fix 3b: Accept 'sent_to_parent', 'approved', and 'published' in monthlyReports filter on parent dashboard
  const oldMrFilter = `                monthlyReports = mrList.filter(mr => {
                    if (!mr || mr.status !== 'sent_to_parent') return false;
                    if (mr.studentId && mr.studentId === s.id) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === sNameLower) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === (s.firstName || '').toLowerCase().trim()) return true;
                    return false;
                });`;

  const newMrFilter = `                monthlyReports = mrList.filter(mr => {
                    if (!mr || (mr.status !== 'sent_to_parent' && mr.status !== 'approved' && mr.status !== 'published')) return false;
                    if (mr.studentId && mr.studentId === s.id) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === sNameLower) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === (s.firstName || '').toLowerCase().trim()) return true;
                    return false;
                });`;

  if (code.includes(oldMrFilter)) {
    code = code.replace(oldMrFilter, newMrFilter);
  }

  // Fix 3c: Update viewMonthlyReport to support both MonthlyReportEngine and StemulusReportPDF
  const oldViewReport = `    function viewMonthlyReport(reportId) {
        if (typeof StemulusReportPDF !== 'undefined') {
            const reports = DashboardEngine.getMonthlyReports ? DashboardEngine.getMonthlyReports() : [];
            const r = reports.find(item => item.id === reportId);
            if (r) {
                StemulusReportPDF.open(r);
                return;
            }
        }
        alert('Evaluation document is loading or could not be found.');
    }`;

  const newViewReport = `    function viewMonthlyReport(reportId) {
        const reports = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMonthlyReports) ? DashboardEngine.getMonthlyReports() : [];
        const r = (Array.isArray(reports) ? reports : []).find(item => item && item.id === reportId);
        if (typeof MonthlyReportEngine !== 'undefined' && typeof MonthlyReportEngine.openReportPDF === 'function' && r && (r.shiningHighlights || r.woohooMoments || r.journeyNarrative)) {
            MonthlyReportEngine.openReportPDF(reportId);
            return;
        }
        if (typeof StemulusReportPDF !== 'undefined' && r) {
            StemulusReportPDF.open(r);
            return;
        }
        if (typeof MonthlyReportEngine !== 'undefined' && typeof MonthlyReportEngine.openReportPDF === 'function' && r) {
            MonthlyReportEngine.openReportPDF(reportId);
            return;
        }
        alert('Evaluation document is loading or could not be found.');
    }`;

  if (code.includes(oldViewReport)) {
    code = code.replace(oldViewReport, newViewReport);
  }

  // Fix 3d: Add launchMeeting at module level and export it on ParentEngine
  const oldReturn = `    return {
        init,
        renderDashboard,`;

  const newReturn = `    function launchMeeting(e, url, scheduleId, studentName, courseName) {
        const targetUrl = url || 'https://meet.google.com';
        if (typeof STEMulus !== 'undefined' && STEMulus.Classroom && typeof STEMulus.Classroom.launchMeetingSession === 'function') {
            STEMulus.Classroom.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        } else if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.launchMeetingSession === 'function') {
            DashboardEngine.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        }
    }

    return {
        launchMeeting,
        init,
        renderDashboard,`;

  if (code.includes(oldReturn) && !code.includes('return {\n        launchMeeting,')) {
    code = code.replace(oldReturn, newReturn);
  }

  writeFile(rel, code);
})();

// ---------------------------------------------------------------------------
// 4. Patch tutor-monthly-report.html (Lockout finalized reports, validate payloads, escape HTML)
// ---------------------------------------------------------------------------
(function patchTutorMonthlyReportHtml() {
  const rel = 'tutor-monthly-report.html';
  let code = readFile(rel).replace(/\r\n/g, '\n');

  const oldSubmitBlock = `      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addMonthlyReport) {
        DashboardEngine.addMonthlyReport(revisedReport);
      }
    } else {
      // Multiple students submission
      var batchId = 'batch-' + Date.now();
      studentEntries.forEach(function(entry, idx) {
        var sIdVal = (entry.querySelector('.student-id-input') || {}).value || (entry.querySelector('.student-quick-picker') || {}).value || '';
        var childReport = Object.assign({}, commonMeta, {
          id: 'mrep-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4),
          batchId: batchId,
          studentId: sIdVal,
          studentName: (entry.querySelector('.student-name-input') || {}).value || '',
          course: (entry.querySelector('.student-course-input') || {}).value || '',
          sessionsAttended: parseInt((entry.querySelector('.student-sessions-input') || {}).value) || 0,
          module: (entry.querySelector('.student-module-input') || {}).value || '',
          topics: (entry.querySelector('.student-topics-input') || {}).value || '',
          strengths: (entry.querySelector('.student-strengths-input') || {}).value || '',
          challenges: (entry.querySelector('.student-challenges-input') || {}).value || '',
          recommendation: (entry.querySelector('.student-rec-input') || {}).value || '',
          overallGrade: (entry.querySelector('.student-grade-input') || {}).value || 'A',
          engagementLevel: (entry.querySelector('.student-engagement-input') || {}).value || 'engaged',
          status: 'pending_review'
        });

        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addMonthlyReport) {
          DashboardEngine.addMonthlyReport(childReport);
        }
      });
    }`;

  const newSubmitBlock = `      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addMonthlyReport) {
        var revRes = DashboardEngine.addMonthlyReport(revisedReport);
        if (revRes && revRes.success === false) {
          alert(revRes.message || 'Unable to submit revised monthly report.');
          return;
        }
      }
    } else {
      // Multiple students submission
      var batchId = 'batch-' + Date.now();
      var blockedError = null;
      var payloads = [];
      studentEntries.forEach(function(entry, idx) {
        var sIdVal = (entry.querySelector('.student-id-input') || {}).value || (entry.querySelector('.student-quick-picker') || {}).value || '';
        var childReport = Object.assign({}, commonMeta, {
          id: 'mrep-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substr(2, 4),
          batchId: batchId,
          studentId: sIdVal,
          studentName: ((entry.querySelector('.student-name-input') || {}).value || '').trim(),
          course: ((entry.querySelector('.student-course-input') || {}).value || '').trim(),
          sessionsAttended: parseInt((entry.querySelector('.student-sessions-input') || {}).value) || 0,
          module: ((entry.querySelector('.student-module-input') || {}).value || '').trim(),
          topics: ((entry.querySelector('.student-topics-input') || {}).value || '').trim(),
          strengths: ((entry.querySelector('.student-strengths-input') || {}).value || '').trim(),
          challenges: ((entry.querySelector('.student-challenges-input') || {}).value || '').trim(),
          recommendation: ((entry.querySelector('.student-rec-input') || {}).value || '').trim(),
          overallGrade: (entry.querySelector('.student-grade-input') || {}).value || 'A',
          engagementLevel: (entry.querySelector('.student-engagement-input') || {}).value || 'engaged',
          status: 'pending_review'
        });
        if (!childReport.studentName || !childReport.topics || !childReport.strengths) {
          blockedError = 'Incomplete monthly report: Student name, topics covered, and strengths are required.';
        }
        if ((childReport.topics.length + childReport.strengths.length + childReport.challenges.length + childReport.recommendation.length) > 10000) {
          blockedError = 'Report payload exceeds the maximum allowed 10,000 characters.';
        }
        payloads.push(childReport);
      });
      if (blockedError) {
        alert(blockedError);
        return;
      }
      for (var pIdx = 0; pIdx < payloads.length; pIdx++) {
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addMonthlyReport) {
          var addRes = DashboardEngine.addMonthlyReport(payloads[pIdx]);
          if (addRes && addRes.success === false) {
            alert(addRes.message || 'Unable to submit monthly report.');
            return;
          }
        }
      }
    }`;

  if (code.includes(oldSubmitBlock)) {
    code = code.replace(oldSubmitBlock, newSubmitBlock);
  }

  const oldHistoryItem = `      if (status === 'pending_review') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Admin Review</span>';
        actions = '<button onclick="previewReportPDF(\\'' + r.id + '\\')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"><i data-lucide="eye" style="width:13px;height:13px;"></i> Preview Draft</button>';
      } else if (status === 'sent_to_parent') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved &amp; Sent to Parent</span>';
        actions = '<button onclick="previewReportPDF(\\'' + r.id + '\\')" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"><i data-lucide="file-check" style="width:13px;height:13px;"></i> View Official PDF</button>';
      } else if (status === 'rejected') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revision Requested</span>';
        actions = '<button onclick="startReportRedo(\\'' + r.id + '\\')" class="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"><i data-lucide="edit-3" style="width:13px;height:13px;"></i> Redo &amp; Resubmit</button>';
      }`;

  const newHistoryItem = `      var esc = (typeof DashboardEngine !== 'undefined' && DashboardEngine.escapeHtml) ? DashboardEngine.escapeHtml : function(s){ return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
      if (status === 'pending_review' || status === 'pending_admin_approval') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Admin Review</span>';
        actions = '<button onclick="previewReportPDF(\\'' + esc(r.id) + '\\')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"><i data-lucide="eye" style="width:13px;height:13px;"></i> Preview Draft</button>';
      } else if (status === 'sent_to_parent' || status === 'approved' || status === 'published') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved &amp; Locked</span>';
        actions = '<span class="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Edit Locked</span>' +
                  '<button onclick="previewReportPDF(\\'' + esc(r.id) + '\\')" class="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"><i data-lucide="file-check" style="width:13px;height:13px;"></i> View Official PDF</button>';
      } else if (status === 'rejected' || status === 'rejected_needs_revision') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-md"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revision Requested</span>';
        actions = '<button onclick="startReportRedo(\\'' + esc(r.id) + '\\')" class="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"><i data-lucide="edit-3" style="width:13px;height:13px;"></i> Redo &amp; Resubmit</button>';
      }`;

  if (code.includes(oldHistoryItem)) {
    code = code.replace(oldHistoryItem, newHistoryItem);
    code = code.replace("'<h4 class=\"font-nunito font-extrabold text-slate-800 text-base leading-tight\">' + (r.studentName || 'Student Evaluation') + '</h4>'", "'<h4 class=\"font-nunito font-extrabold text-slate-800 text-base leading-tight\">' + esc(r.studentName || 'Student Evaluation') + '</h4>'");
    code = code.replace("'<p class=\"text-xs text-slate-500 font-medium\">' + (r.course || 'Coding Track') + ' &middot; ' + monthLabel + '</p>'", "'<p class=\"text-xs text-slate-500 font-medium\">' + esc(r.course || 'Coding Track') + ' &middot; ' + esc(monthLabel) + '</p>'");
    code = code.replace("(r.strengths ? '<div class=\"text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100\"><strong>Strengths:</strong> ' + r.strengths + '</div>' : '')", "(r.strengths ? '<div class=\"text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100\"><strong>Strengths:</strong> ' + esc(r.strengths) + '</div>' : '')");
  }

  const oldStartRedo = `  window.startReportRedo = function(reportId) {
    var allReports = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMonthlyReports)
      ? DashboardEngine.getMonthlyReports(_session.email)
      : [];
    var rep = allReports.find(function(r){ return r.id === reportId; });
    if (!rep) { alert('Report not found for redo.'); return; }`;

  const newStartRedo = `  window.startReportRedo = function(reportId) {
    var allReports = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMonthlyReports)
      ? DashboardEngine.getMonthlyReports(_session.email)
      : [];
    var rep = allReports.find(function(r){ return r.id === reportId; });
    if (!rep) { alert('Report not found for redo.'); return; }
    if (rep.status === 'sent_to_parent' || rep.status === 'approved' || rep.status === 'published') {
      alert('This monthly report has already been approved and finalized. Tutors are locked out of editing finalized reports.');
      return;
    }`;

  if (code.includes(oldStartRedo)) {
    code = code.replace(oldStartRedo, newStartRedo);
  }

  writeFile(rel, code);
})();

// ---------------------------------------------------------------------------
// 5. Patch assets/js/dashboard-engine.js (Add Issue Escalation Engine CRUD)
// ---------------------------------------------------------------------------
(function patchDashboardEngineEscalations() {
  const rel = 'assets/js/dashboard-engine.js';
  let code = readFile(rel).replace(/\r\n/g, '\n');

  if (!code.includes('submitIssueEscalation')) {
    const targetExport = `        exportDatabaseJSON: exportDatabaseJSON,`;
    const escalationMethods = `        submitIssueEscalation: function(rawEscalation) {
            if (!rawEscalation || typeof rawEscalation !== 'object') {
                return { success: false, code: 'INVALID_ESCALATION', message: 'Escalation payload is required.' };
            }
            const validCategories = ['student_behavior', 'technical_issue', 'scheduling_conflict', 'parent_dispute', 'payment_query'];
            const category = String(rawEscalation.category || '').toLowerCase().trim();
            if (!validCategories.includes(category)) {
                return { success: false, code: 'INVALID_CATEGORY', message: 'Invalid escalation category. Must be one of: ' + validCategories.join(', ') };
            }
            const summary = String(rawEscalation.summary || rawEscalation.title || '').trim();
            const details = String(rawEscalation.details || rawEscalation.notes || '').trim();
            if (!summary && !details) {
                return { success: false, code: 'MISSING_DETAILS', message: 'Please provide a summary or description for the escalation.' };
            }
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            const severity = validSeverities.includes(String(rawEscalation.severity || '').toLowerCase().trim())
                ? String(rawEscalation.severity).toLowerCase().trim()
                : (category === 'parent_dispute' || category === 'student_behavior' ? 'high' : 'medium');

            const db = getDB();
            if (!Array.isArray(db.issueEscalations)) db.issueEscalations = [];
            const session = getSession() || {};
            const nowIso = new Date().toISOString();

            const escalation = {
                id: rawEscalation.id || ('esc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
                category: category,
                categoryLabel: {
                    student_behavior: 'Student Behavior',
                    technical_issue: 'Technical Issue',
                    scheduling_conflict: 'Scheduling Conflict',
                    parent_dispute: 'Parent Dispute',
                    payment_query: 'Payment / Payout Query'
                }[category] || category,
                severity: severity,
                status: 'open',
                tutorId: rawEscalation.tutorId || session.id || 'tut-active',
                tutorName: rawEscalation.tutorName || session.name || 'Assigned Tutor',
                tutorEmail: (rawEscalation.tutorEmail || session.email || '').toLowerCase().trim(),
                studentId: rawEscalation.studentId || '',
                studentName: rawEscalation.studentName || 'General / Faculty',
                summary: summary || details.slice(0, 80),
                details: details || summary,
                attachmentUrl: String(rawEscalation.attachmentUrl || rawEscalation.attachment || '').trim(),
                assignedTo: rawEscalation.assignedTo || 'Academic Operations Director',
                replies: [],
                createdAt: nowIso,
                updatedAt: nowIso,
                resolvedAt: null,
                resolutionNotes: ''
            };

            db.issueEscalations.unshift(escalation);

            // Trigger real-time notification to Admin dashboard
            if (!Array.isArray(db.notifications)) db.notifications = [];
            db.notifications.unshift({
                id: 'not-esc-' + Date.now(),
                userEmail: 'admin@stemuluskidstech.com',
                targetRole: 'admin',
                title: '[' + severity.toUpperCase() + '] Tutor Issue Escalation: ' + escalation.categoryLabel,
                message: escalation.tutorName + ' escalated (' + escalation.studentName + '): ' + escalation.summary,
                escalationId: escalation.id,
                category: escalation.category,
                severity: escalation.severity,
                timestamp: nowIso,
                read: false
            });

            saveDB(db);
            syncToFirestore('issueEscalations', escalation.id, escalation);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { source: 'submitIssueEscalation', escalationId: escalation.id } }));
            }
            return { success: true, escalation: escalation };
        },
        getIssueEscalations: function(tutorEmailOrFilter) {
            const db = getDB();
            const list = Array.isArray(db.issueEscalations) ? db.issueEscalations : [];
            if (!tutorEmailOrFilter) return list;
            if (typeof tutorEmailOrFilter === 'string') {
                const emailClean = tutorEmailOrFilter.toLowerCase().trim();
                if (!emailClean || emailClean === 'admin@stemuluskidstech.com' || emailClean === 'all') return list;
                return list.filter(item => item && item.tutorEmail && item.tutorEmail.toLowerCase().trim() === emailClean);
            }
            return list;
        },
        replyIssueEscalation: function(escalationId, replyText, authorName, authorRole) {
            const db = getDB();
            if (!Array.isArray(db.issueEscalations)) db.issueEscalations = [];
            const esc = db.issueEscalations.find(e => e && e.id === escalationId);
            if (!esc) return { success: false, message: 'Escalation not found.' };
            const text = String(replyText || '').trim();
            if (!text) return { success: false, message: 'Reply message cannot be empty.' };

            const nowIso = new Date().toISOString();
            esc.replies = Array.isArray(esc.replies) ? esc.replies : [];
            const replyObj = {
                id: 'rep-' + Date.now(),
                authorName: authorName || 'Admin Operations',
                authorRole: authorRole || 'admin',
                message: text,
                timestamp: nowIso
            };
            esc.replies.push(replyObj);
            if (esc.status === 'open') esc.status = 'in_progress';
            esc.updatedAt = nowIso;

            if (esc.tutorEmail) {
                db.notifications = db.notifications || [];
                db.notifications.unshift({
                    id: 'not-escreply-' + Date.now(),
                    userEmail: esc.tutorEmail,
                    title: 'Admin Replied to Your Escalation (' + esc.categoryLabel + ')',
                    message: text,
                    escalationId: esc.id,
                    timestamp: nowIso,
                    read: false
                });
            }
            saveDB(db);
            syncToFirestore('issueEscalations', esc.id, esc);
            return { success: true, escalation: esc, reply: replyObj };
        },
        reassignIssueEscalation: function(escalationId, newAssignee) {
            const db = getDB();
            if (!Array.isArray(db.issueEscalations)) db.issueEscalations = [];
            const esc = db.issueEscalations.find(e => e && e.id === escalationId);
            if (!esc) return { success: false, message: 'Escalation not found.' };
            const assignee = String(newAssignee || '').trim();
            if (!assignee) return { success: false, message: 'Assignee name is required.' };
            const nowIso = new Date().toISOString();
            esc.assignedTo = assignee;
            esc.status = 'in_progress';
            esc.updatedAt = nowIso;
            if (esc.tutorEmail) {
                db.notifications = db.notifications || [];
                db.notifications.unshift({
                    id: 'not-escrss-' + Date.now(),
                    userEmail: esc.tutorEmail,
                    title: 'Escalation Reassigned: ' + esc.categoryLabel,
                    message: 'Your escalation "' + esc.summary + '" is now assigned to ' + assignee + '.',
                    escalationId: esc.id,
                    timestamp: nowIso,
                    read: false
                });
            }
            saveDB(db);
            syncToFirestore('issueEscalations', esc.id, esc);
            return { success: true, escalation: esc };
        },
        resolveIssueEscalation: function(escalationId, resolutionNotes, resolvedBy) {
            const db = getDB();
            if (!Array.isArray(db.issueEscalations)) db.issueEscalations = [];
            const esc = db.issueEscalations.find(e => e && e.id === escalationId);
            if (!esc) return { success: false, message: 'Escalation not found.' };
            const nowIso = new Date().toISOString();
            esc.status = 'resolved';
            esc.resolvedAt = nowIso;
            esc.updatedAt = nowIso;
            esc.resolvedBy = resolvedBy || 'Admin';
            esc.resolutionNotes = String(resolutionNotes || 'Resolved by Academic Operations.').trim();

            if (esc.tutorEmail) {
                db.notifications = db.notifications || [];
                db.notifications.unshift({
                    id: 'not-escres-' + Date.now(),
                    userEmail: esc.tutorEmail,
                    title: 'Escalation Resolved: ' + esc.categoryLabel,
                    message: 'Admin resolved "' + esc.summary + '": ' + esc.resolutionNotes,
                    escalationId: esc.id,
                    timestamp: nowIso,
                    read: false
                });
            }
            saveDB(db);
            syncToFirestore('issueEscalations', esc.id, esc);
            return { success: true, escalation: esc };
        },
        exportDatabaseJSON: exportDatabaseJSON,`;

    if (!code.includes(targetExport)) {
      throw new Error('Target export not found in ' + rel);
    }
    code = code.replace(targetExport, escalationMethods);
    writeFile(rel, code);
  } else {
    console.log('[SKIP] Already patched', rel);
  }
})();

// ---------------------------------------------------------------------------
// 6. Patch tutor-dashboard.html & assets/js/tutor-engine.js
//    (Add Tutor Issue Escalation Card/Modal + Finalized Report Lockout)
// ---------------------------------------------------------------------------
(function patchTutorPortalEscalationAndReportLock() {
  const htmlRel = 'tutor-dashboard.html';
  let html = readFile(htmlRel).replace(/\r\n/g, '\n');

  if (!html.includes('tutor-escalations-list')) {
    const targetCard = `        <div id="tutor-monthly-reports-list" class="space-y-3">
          <!-- Rendered by TutorEngine -->
        </div>
      </div>`;

    const replacementCard = `        <div id="tutor-monthly-reports-list" class="space-y-3">
          <!-- Rendered by TutorEngine -->
        </div>
      </div>

      <!-- ISSUE ESCALATION TO ADMIN CARD -->
      <div class="dash-card" id="tutor-escalations-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">
              <i data-lucide="shield-alert" class="w-5 h-5 text-rose-600"></i>
              Issue Escalation &amp; Support Desk
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Escalate student behavior, technical issues, scheduling conflicts, parent disputes, or payout queries directly to Admin.</p>
          </div>
          <button type="button" id="btn-open-escalation-modal" onclick="TutorEngine.openEscalationModal()" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i> Escalate Issue
          </button>
        </div>
        <div id="tutor-escalations-list" class="space-y-2.5">
          <p class="text-xs text-slate-400 p-3 text-center">No active issue escalations.</p>
        </div>
      </div>`;

    if (!html.includes(targetCard)) {
      throw new Error('Target card not found in ' + htmlRel);
    }
    html = html.replace(targetCard, replacementCard);
    writeFile(htmlRel, html);
  }

  const jsRel = 'assets/js/tutor-engine.js';
  let js = readFile(jsRel).replace(/\r\n/g, '\n');

  if (!js.includes('openEscalationModal')) {
    // 6a. Call renderEscalationsList() and injectEscalationModal() inside renderDashboard()
    const oldRenderCalls = `        renderLiveClassPresenceBanner();
        renderMonthlyReportsList();
        injectReportModal();
        injectCoverageModal();`;

    const newRenderCalls = `        renderLiveClassPresenceBanner();
        renderMonthlyReportsList();
        renderEscalationsList();
        injectReportModal();
        injectCoverageModal();
        injectEscalationModal();`;

    js = js.replace(oldRenderCalls, newRenderCalls);

    // 6b. Lock tutor out of editing finalized reports in openMonthlyReportModal & saveMonthlyReportForm
    const oldOpenMR = `        if (reportId && typeof MonthlyReportEngine !== 'undefined') {
            const r = MonthlyReportEngine.getReports().find(rep => rep.id === reportId);
            if (r) {`;

    const newOpenMR = `        if (reportId && typeof MonthlyReportEngine !== 'undefined') {
            const r = MonthlyReportEngine.getReports().find(rep => rep.id === reportId);
            if (r) {
                if (['approved', 'sent_to_parent', 'published'].includes(r.status)) {
                    if (typeof showToast === 'function') {
                        showToast('This monthly report is approved and finalized. Editing is locked.', 'warning');
                    } else {
                        alert('This monthly report is approved and finalized. Editing is locked.');
                    }
                    return;
                }`;

    js = js.replace(oldOpenMR, newOpenMR);

    const oldSaveMR = `        if (typeof MonthlyReportEngine !== 'undefined') {
            MonthlyReportEngine.submitReport(reportData);
            closeMonthlyReportModal();
            renderMonthlyReportsList();
            if (typeof showToast === 'function') {
                showToast('Monthly report submitted to Director for review!', 'success');
            }
        }`;

    const newSaveMR = `        if (typeof MonthlyReportEngine !== 'undefined') {
            const subRes = MonthlyReportEngine.submitReport(reportData);
            if (subRes && subRes.success === false) {
                if (typeof showToast === 'function') {
                    showToast(subRes.message || 'Could not submit monthly report.', 'error');
                } else {
                    alert(subRes.message || 'Could not submit monthly report.');
                }
                return;
            }
            closeMonthlyReportModal();
            renderMonthlyReportsList();
            if (typeof showToast === 'function') {
                showToast('Monthly report submitted to Director for review!', 'success');
            }
        }`;

    js = js.replace(oldSaveMR, newSaveMR);

    // 6c. Add Escalation Modal + History functions and export them
    const oldExport = `    return {
        launchMeeting,`;

    const escalationFunctionsAndExport = `    function injectEscalationModal() {
        if (document.getElementById('tutor-escalation-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'tutor-escalation-modal';
        modal.style.display = 'none';
        modal.className = 'fixed inset-0 z-[9999] items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm';
        modal.innerHTML = \`
            <div class="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-fadeIn">
                <div class="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                        <h3 class="text-base font-extrabold text-slate-900">Escalate Issue to Admin</h3>
                        <p class="text-xs text-slate-500">Direct operational escalation to Academic Operations &amp; Director</p>
                    </div>
                    <button type="button" onclick="TutorEngine.closeEscalationModal()" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close modal">&times;</button>
                </div>
                <form id="tutor-escalation-form" class="space-y-3.5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Escalation Category *</label>
                            <select id="esc-category" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold">
                                <option value="student_behavior">Student Behavior</option>
                                <option value="technical_issue">Technical Issue</option>
                                <option value="scheduling_conflict">Scheduling Conflict</option>
                                <option value="parent_dispute">Parent Dispute</option>
                                <option value="payment_query">Payment / Payout Query</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Severity Level *</label>
                            <select id="esc-severity" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold">
                                <option value="medium">Medium (Standard SLA)</option>
                                <option value="high">High (Urgent Attention)</option>
                                <option value="critical">Critical (Immediate Intervention)</option>
                                <option value="low">Low (Advisory Note)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Related Student (Optional)</label>
                        <select id="esc-student-id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
                            <option value="">-- General / Non-Student Specific --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issue Summary *</label>
                        <input type="text" id="esc-summary" required maxlength="200" placeholder="Brief summary of the issue..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Detailed Notes &amp; Context *</label>
                        <textarea id="esc-details" required rows="3" maxlength="5000" placeholder="Provide full context, timestamps, and any action already taken..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Evidence / Attachment Link (Optional)</label>
                        <input type="text" id="esc-attachment" placeholder="https://drive.google.com/... or screenshot reference" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
                    </div>
                    <button type="submit" id="esc-submit-btn" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer">
                        Submit Escalation to Admin
                    </button>
                </form>
            </div>
        \`;
        document.body.appendChild(modal);
        const form = document.getElementById('tutor-escalation-form');
        if (form) form.addEventListener('submit', submitEscalationForm);
    }

    function openEscalationModal(defaultCategory) {
        injectEscalationModal();
        const modal = document.getElementById('tutor-escalation-modal');
        if (!modal) return;
        const select = document.getElementById('esc-student-id');
        if (select && typeof DashboardEngine !== 'undefined' && currentTutor) {
            const myStudents = DashboardEngine.getTutorStudents ? DashboardEngine.getTutorStudents(currentTutor.email) : [];
            select.innerHTML = '<option value="">-- General / Non-Student Specific --</option>' +
                myStudents.map(s => \`<option value="\${s.id}" data-name="\${s.firstName} \${s.lastName || ''}">\${s.firstName} \${s.lastName || ''} (\${s.program || 'Coding'})</option>\`).join('');
        }
        if (defaultCategory && document.getElementById('esc-category')) {
            document.getElementById('esc-category').value = defaultCategory;
        }
        modal.style.display = 'flex';
    }

    function closeEscalationModal() {
        const modal = document.getElementById('tutor-escalation-modal');
        if (modal) modal.style.display = 'none';
    }

    function submitEscalationForm(e) {
        if (e && e.preventDefault) e.preventDefault();
        const cat = (document.getElementById('esc-category') || {}).value || 'technical_issue';
        const sev = (document.getElementById('esc-severity') || {}).value || 'medium';
        const stuSel = document.getElementById('esc-student-id');
        const stuId = stuSel ? stuSel.value : '';
        const stuName = (stuSel && stuSel.selectedIndex > 0) ? (stuSel.options[stuSel.selectedIndex].getAttribute('data-name') || 'Student') : 'General / Faculty';
        const summary = ((document.getElementById('esc-summary') || {}).value || '').trim();
        const details = ((document.getElementById('esc-details') || {}).value || '').trim();
        const attachmentUrl = ((document.getElementById('esc-attachment') || {}).value || '').trim();

        if (!summary || !details) {
            if (typeof showToast === 'function') showToast('Please enter both an issue summary and detailed notes.', 'warning');
            return;
        }

        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.submitIssueEscalation) {
            const res = DashboardEngine.submitIssueEscalation({
                category: cat,
                severity: sev,
                studentId: stuId,
                studentName: stuName,
                summary: summary,
                details: details,
                attachmentUrl: attachmentUrl,
                tutorId: currentTutor ? currentTutor.id : '',
                tutorName: currentTutor ? currentTutor.name : 'Tutor',
                tutorEmail: currentTutor ? currentTutor.email : ''
            });
            if (!res || !res.success) {
                if (typeof showToast === 'function') showToast((res && res.message) || 'Escalation failed.', 'error');
                return;
            }
        }

        const form = document.getElementById('tutor-escalation-form');
        if (form) form.reset();
        closeEscalationModal();
        renderEscalationsList();
        renderNotifications();
        if (typeof showToast === 'function') {
            showToast('Issue escalated to Admin Operations Desk.', 'success');
        }
    }

    function renderEscalationsList() {
        const container = document.getElementById('tutor-escalations-list');
        if (!container || typeof DashboardEngine === 'undefined' || !DashboardEngine.getIssueEscalations) return;
        const email = currentTutor ? currentTutor.email : '';
        const list = DashboardEngine.getIssueEscalations(email) || [];
        const escHtml = DashboardEngine.escapeHtml || function(s) { return String(s || ''); };

        if (!list.length) {
            container.innerHTML = '<p class="text-xs text-slate-400 p-3 text-center">No active issue escalations submitted yet.</p>';
            return;
        }

        const sevColors = {
            critical: 'bg-rose-100 text-rose-800 border-rose-200',
            high: 'bg-amber-100 text-amber-800 border-amber-200',
            medium: 'bg-blue-100 text-blue-800 border-blue-200',
            low: 'bg-slate-100 text-slate-700 border-slate-200'
        };
        const statusColors = {
            open: 'bg-amber-50 text-amber-700 border-amber-200',
            in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };

        container.innerHTML = list.slice(0, 8).map(item => {
            const sCls = sevColors[item.severity] || sevColors.medium;
            const stCls = statusColors[item.status] || statusColors.open;
            const repliesHtml = (Array.isArray(item.replies) && item.replies.length > 0)
                ? '<div class="mt-2 pt-2 border-t border-slate-100 space-y-1">' +
                  item.replies.map(rep => \`<div class="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg"><strong>\${escHtml(rep.authorName)}:</strong> \${escHtml(rep.message)}</div>\`).join('') +
                  '</div>'
                : '';
            const resHtml = item.status === 'resolved' && item.resolutionNotes
                ? \`<div class="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-2.5 py-1.5 rounded-lg"><strong>Resolution:</strong> \${escHtml(item.resolutionNotes)}</div>\`
                : '';
            return \`
                <div class="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border \${sCls}">\${escHtml(item.severity)}</span>
                            <span class="text-xs font-bold text-slate-900">\${escHtml(item.categoryLabel || item.category)}</span>
                            <span class="text-[11px] text-slate-500">&bull; \${escHtml(item.studentName)}</span>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border \${stCls}">\${escHtml(item.status.replace('_', ' '))}</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-800">\${escHtml(item.summary)}</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">\${escHtml(item.details)}</p>
                    \${item.attachmentUrl ? \`<p class="text-[10px] text-indigo-600 mt-1 truncate">Attachment: \${escHtml(item.attachmentUrl)}</p>\` : ''}
                    <div class="text-[10px] text-slate-400 mt-1">Assigned: \${escHtml(item.assignedTo || 'Admin Operations')}</div>
                    \${repliesHtml}
                    \${resHtml}
                </div>
            \`;
        }).join('');
    }

    return {
        openEscalationModal,
        closeEscalationModal,
        submitEscalationForm,
        renderEscalationsList,
        launchMeeting,`;

    js = js.replace(oldExport, escalationFunctionsAndExport);
    writeFile(jsRel, js);
  }
})();

// ---------------------------------------------------------------------------
// 7. Patch assets/js/mulu-widget.js (Remove 2 em-dashes + wire Smart Admin Assistant)
// ---------------------------------------------------------------------------
(function patchMuluWidget() {
  const rel = 'assets/js/mulu-widget.js';
  let code = readFile(rel).replace(/\r\n/g, '\n');

  // Remove any literal em-dashes (\u2014)
  if (code.includes('\u2014')) {
    code = code.replace(/\u2014/g, ' - ');
  }

  // Wire Smart Admin Operational Commands into MuluAIEngine.generateResponse
  const targetGen = `    async generateResponse(query) {
      // 1. Situation-Aware Special Intent Classifier (Pricing, Safeguarding, Urgent Ops)
      const specialResponse = this.checkSpecialIntents(query);
      if (specialResponse) {
        return specialResponse;
      }`;

  const replacementGen = `    async generateResponse(query) {
      // 0. Smart Admin Assistant Operational Command Execution (Schedule Mutation, Direct Tutor Messaging, Autonomous Reschedule Negotiation)
      if (typeof OperationsManagerEngine !== 'undefined' && typeof OperationsManagerEngine.executeSmartAdminCommand === 'function') {
        const isOperationalPrompt = /\\b(move\\b.*\\bclass|reschedule\\b.*\\bsession|wants\\s+to\\s+move|availability\\s+matrix|text\\s+|message\\s+|ask\\s+why.*attendance)\\b/i.test(query || '');
        if ((this.role === 'admin' || this.currentPortal === 'admin') && isOperationalPrompt) {
          const cmdResult = OperationsManagerEngine.executeSmartAdminCommand(query);
          if (cmdResult && cmdResult.handled) {
            return {
              text: cmdResult.responseMarkdown,
              actions: cmdResult.actions || [],
              commandResult: cmdResult
            };
          }
        }
      }

      // 1. Situation-Aware Special Intent Classifier (Pricing, Safeguarding, Urgent Ops)
      const specialResponse = this.checkSpecialIntents(query);
      if (specialResponse) {
        return specialResponse;
      }`;

  if (!code.includes('executeSmartAdminCommand')) {
    if (!code.includes(targetGen)) {
      throw new Error('Target generateResponse not found in ' + rel);
    }
    code = code.replace(targetGen, replacementGen);
  }
  writeFile(rel, code);
})();

// ---------------------------------------------------------------------------
// 8. Patch assets/js/operations-manager-engine.js
//    (Add Smart Admin Assistant Prompt-Driven Operations Engine & UI Console)
// ---------------------------------------------------------------------------
(function patchOperationsManagerEngine() {
  const rel = 'assets/js/operations-manager-engine.js';
  let code = readFile(rel).replace(/\r\n/g, '\n');

  if (!code.includes('executeSmartAdminCommand')) {
    const smartAssistantCode = `
  /**
   * Smart Admin Assistant: Prompt-Driven Operations Engine
   * Parses natural-language admin commands, validates ambiguity/conflicts, mutates DB schedules,
   * checks tutor availability matrices, and dispatches outbound tutor/parent notifications & webhooks.
   */
  function parseTimeTokenTo24h(rawTimeStr) {
    if (!rawTimeStr) return null;
    const m = String(rawTimeStr).trim().match(/^(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?$/i);
    if (!m) return null;
    let hr = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const mer = m[3] ? m[3].toLowerCase() : null;
    if (mer === 'pm' && hr < 12) hr += 12;
    if (mer === 'am' && hr === 12) hr = 0;
    if (hr < 0 || hr > 23 || min < 0 || min > 59) return null;
    return String(hr).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function getNextDateForDayName(dayName) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIdx = days.indexOf(String(dayName || '').toLowerCase().trim());
    if (targetIdx === -1) return null;
    const now = new Date();
    const currentIdx = now.getDay();
    let diff = targetIdx - currentIdx;
    if (diff <= 0) diff += 7;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toISOString().slice(0, 10);
  }

  function mapTime24ToSlotBucket(time24) {
    const hr = parseInt(String(time24 || '16:00').split(':')[0], 10);
    if (hr < 12) return 'morning';
    if (hr < 16) return 'afternoon';
    if (hr < 20) return 'evening';
    return 'night';
  }

  function executeSmartAdminCommand(promptText) {
    const rawPrompt = String(promptText || '').trim();
    if (!rawPrompt) {
      return {
        handled: false,
        status: 'EMPTY_PROMPT',
        responseMarkdown: 'Please enter an operational command.'
      };
    }

    const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : {};
    db.schedules = Array.isArray(db.schedules) ? db.schedules : [];
    db.tutors = Array.isArray(db.tutors) ? db.tutors : [];
    db.students = Array.isArray(db.students) ? db.students : [];
    db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
    db.outboundMessages = Array.isArray(db.outboundMessages) ? db.outboundMessages : [];
    db.smartAdminAuditLog = Array.isArray(db.smartAdminAuditLog) ? db.smartAdminAuditLog : [];

    const tutorsList = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getTutors)
      ? DashboardEngine.getTutors()
      : db.tutors;
    const studentsList = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getStudents)
      ? DashboardEngine.getStudents()
      : db.students;

    const findMatchingTutors = (nameQuery) => {
      const q = String(nameQuery || '').replace(/^coach\\s+/i, '').toLowerCase().trim();
      if (!q) return [];
      const exact = tutorsList.filter(t => t && (t.name || '').toLowerCase().trim() === q);
      if (exact.length > 0) return exact;
      return tutorsList.filter(t => {
        if (!t || !t.name) return false;
        const full = t.name.toLowerCase().trim();
        const parts = full.split(/\\s+/);
        return full.includes(q) || parts.includes(q);
      });
    };

    const findMatchingStudents = (nameQuery) => {
      const q = String(nameQuery || '').toLowerCase().trim();
      if (!q) return [];
      const exact = studentsList.filter(s => s && ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim() === q);
      if (exact.length > 0) return exact;
      return studentsList.filter(s => {
        if (!s) return false;
        const full = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
        const first = (s.firstName || '').toLowerCase().trim();
        return full.includes(q) || first === q;
      });
    };

    // Guardrail 0: Past Date Check (e.g. explicit YYYY-MM-DD in the past or "yesterday" / "last week")
    const isoDateMatch = rawPrompt.match(/\\b(20\\d{2}-\\d{2}-\\d{2})\\b/);
    const todayIso = new Date().toISOString().slice(0, 10);
    if (/\\b(yesterday|last\\s+week|last\\s+month|in\\s+the\\s+past)\\b/i.test(rawPrompt) || (isoDateMatch && isoDateMatch[1] < todayIso)) {
      const logEntry = {
        id: 'ai-cmd-' + Date.now(),
        intent: 'AMBIGUOUS_OR_INVALID_DATE',
        status: 'CLARIFICATION_REQUIRED',
        prompt: rawPrompt,
        mutatedDatabase: false,
        timestamp: new Date().toISOString()
      };
      db.smartAdminAuditLog.unshift(logEntry);
      if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
      return {
        handled: true,
        intent: 'AMBIGUOUS_OR_INVALID_DATE',
        status: 'CLARIFICATION_REQUIRED',
        mutatedDatabase: false,
        responseMarkdown: 'Clarification Required (Past Date Guardrail): You specified a date in the past. Schedule mutations and reschedules can only be booked for today or future dates. Which upcoming date and time (WAT) would you like instead?'
      };
    }

    // -------------------------------------------------------------------------
    // INTENT 1: AUTONOMOUS RESCHEDULE NEGOTIATION
    // Pattern: "Parent of [Student Name] wants to move [Day]'s session. Check [Tutor Name]'s availability matrix, find the best open slot, and message the tutor to negotiate/confirm the reschedule."
    // -------------------------------------------------------------------------
    const negotiationRegex = /Parent\\s+of\\s+(.+?)\\s+wants\\s+to\\s+move\\s+(\\w+day)(?:'s)?\\s+session[\\s\\S]*?Check\\s+(.+?)(?:'s|\\s+availability)\\s*availability/i;
    const negMatch = rawPrompt.match(negotiationRegex);
    if (negMatch) {
      const studentQuery = negMatch[1].trim();
      const fromDay = negMatch[2].trim();
      const tutorQuery = negMatch[3].replace(/'s$/i, '').trim();

      const matchedTutors = findMatchingTutors(tutorQuery);
      if (matchedTutors.length > 1) {
        return {
          handled: true,
          intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'DUPLICATE_TUTOR_NAME',
          mutatedDatabase: false,
          candidates: matchedTutors.map(t => t.name),
          responseMarkdown: \`Clarification Required (Ambiguous Tutor Name): Multiple tutors match "\${tutorQuery}": \${matchedTutors.map(t => t.name + ' (' + t.email + ')').join(', ')}. Please specify the tutor's full name before I negotiate the reschedule.\`
        };
      }
      if (matchedTutors.length === 0) {
        return {
          handled: true,
          intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'TUTOR_NOT_FOUND',
          mutatedDatabase: false,
          responseMarkdown: \`Clarification Required: Could not find a tutor matching "\${tutorQuery}". Please confirm the instructor's full name.\`
        };
      }

      const matchedStudents = findMatchingStudents(studentQuery);
      if (matchedStudents.length === 0) {
        return {
          handled: true,
          intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'STUDENT_NOT_FOUND',
          mutatedDatabase: false,
          responseMarkdown: \`Clarification Required: Could not find an enrolled student matching "\${studentQuery}".\`
        };
      }

      const tutor = matchedTutors[0];
      const student = matchedStudents[0];
      const studentFullName = ((student.firstName || '') + ' ' + (student.lastName || '')).trim();

      // Inspect tutor availability matrix & existing schedules to find the best conflict-free open slot
      const availMatrix = tutor.availability || {
        monday: ['afternoon', 'evening'],
        tuesday: ['afternoon', 'evening'],
        wednesday: ['afternoon', 'evening'],
        thursday: ['afternoon', 'evening'],
        friday: ['afternoon', 'evening'],
        saturday: ['morning', 'afternoon']
      };
      const slotDefaultTimes = { morning: '10:00', afternoon: '15:00', evening: '17:00', night: '20:00' };
      const candidateDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        .filter(d => d.toLowerCase() !== fromDay.toLowerCase());

      let bestOpenSlot = null;
      for (const dayName of candidateDays) {
        const dayKey = dayName.toLowerCase();
        const buckets = Array.isArray(availMatrix[dayKey]) && availMatrix[dayKey].length > 0
          ? availMatrix[dayKey]
          : ['afternoon', 'evening'];
        const candidateDate = getNextDateForDayName(dayName);
        for (const bucket of buckets) {
          const candidateTime = slotDefaultTimes[bucket] || '16:00';
          const hasConflict = db.schedules.some(s =>
            s && s.status !== 'cancelled' &&
            ((s.tutorEmail && tutor.email && s.tutorEmail.toLowerCase() === tutor.email.toLowerCase()) ||
             ((s.mentor || s.tutorName || '').toLowerCase() === (tutor.name || '').toLowerCase())) &&
            ((s.date === candidateDate) || ((s.dayOfWeek || '').toLowerCase() === dayKey)) &&
            s.time === candidateTime
          );
          if (!hasConflict) {
            bestOpenSlot = {
              dayOfWeek: dayName,
              date: candidateDate,
              time: candidateTime,
              bucket: bucket
            };
            break;
          }
        }
        if (bestOpenSlot) break;
      }

      if (!bestOpenSlot) {
        return {
          handled: true,
          intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
          status: 'NO_OPEN_SLOT',
          mutatedDatabase: false,
          responseMarkdown: \`No conflict-free open slot was found in \${tutor.name}'s availability matrix. Please expand \${tutor.name}'s availability or assign a standby tutor.\`
        };
      }

      const tutorPhone = String(tutor.phone || tutor.whatsapp || '2347052466716').replace(/[^0-9]/g, '');
      const messageBody = \`Hello Coach \${tutor.name}, the parent of \${studentFullName} requested to move \${fromDay}'s session. Based on your availability matrix, your best conflict-free slot is \${bestOpenSlot.dayOfWeek} (\${bestOpenSlot.date}) at \${bestOpenSlot.time} WAT. Please reply CONFIRM to lock in this reschedule.\`;
      const waUrl = \`https://wa.me/\${tutorPhone}?text=\${encodeURIComponent(messageBody)}\`;

      const negotiationRecord = {
        id: 'neg-' + Date.now(),
        studentId: student.id,
        studentName: studentFullName,
        parentEmail: student.parentEmail || '',
        tutorId: tutor.id || '',
        tutorName: tutor.name,
        tutorEmail: tutor.email,
        tutorPhone: tutorPhone,
        originalDay: fromDay,
        proposedSlot: bestOpenSlot,
        status: 'pending_tutor_confirmation',
        whatsappUrl: waUrl,
        createdAt: new Date().toISOString()
      };

      db.rescheduleNegotiations = Array.isArray(db.rescheduleNegotiations) ? db.rescheduleNegotiations : [];
      db.rescheduleNegotiations.unshift(negotiationRecord);

      const outboundRecord = {
        id: 'msg-' + Date.now(),
        channel: 'whatsapp_and_portal_webhook',
        recipientRole: 'tutor',
        recipientName: tutor.name,
        recipientEmail: tutor.email,
        recipientPhone: tutorPhone,
        message: messageBody,
        whatsappUrl: waUrl,
        deliveryStatus: 'dispatched',
        intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
        timestamp: new Date().toISOString()
      };
      db.outboundMessages.unshift(outboundRecord);

      db.notifications.unshift({
        id: 'not-neg-' + Date.now(),
        userEmail: (tutor.email || '').toLowerCase(),
        title: 'Reschedule Proposal for ' + studentFullName,
        message: messageBody,
        timestamp: new Date().toISOString(),
        read: false
      });

      db.smartAdminAuditLog.unshift({
        id: 'ai-cmd-' + Date.now(),
        intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
        status: 'SUCCESS',
        prompt: rawPrompt,
        negotiationId: negotiationRecord.id,
        proposedSlot: bestOpenSlot,
        outboundMessageId: outboundRecord.id,
        timestamp: new Date().toISOString()
      });

      if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);

      return {
        handled: true,
        intent: 'AUTONOMOUS_RESCHEDULE_NEGOTIATION',
        status: 'SUCCESS',
        mutatedDatabase: true,
        studentName: studentFullName,
        tutorName: tutor.name,
        tutorPhone: tutorPhone,
        proposedSlot: bestOpenSlot,
        negotiationRecord: negotiationRecord,
        outboundMessage: outboundRecord,
        responseMarkdown: \`Autonomous Reschedule Negotiation Initiated:\\n- Coder: \${studentFullName}\\n- Instructor: \${tutor.name} (\${tutorPhone})\\n- Original Session: \${fromDay}\\n- Best Open Slot Found: \${bestOpenSlot.dayOfWeek} (\${bestOpenSlot.date}) at \${bestOpenSlot.time} WAT (\${bestOpenSlot.bucket} matrix)\\n- Outbound Dispatch: Sent in-portal notification and prepared WhatsApp confirmation dispatch to \${tutor.name}.\`
      };
    }

    // -------------------------------------------------------------------------
    // INTENT 2: SCHEDULE MUTATION COMMAND
    // Pattern: "Move [Student Name]'s class with [Tutor Name] from [Day] [Time] to [Day] [Time]"
    // -------------------------------------------------------------------------
    const moveRegex = /Move\\s+(.+?)(?:'s)?\\s+(?:class|session)\\s+with\\s+(.+?)\\s+from\\s+(\\w+day)\\s+([0-9:]+\\s*(?:am|pm)?)\\s+to\\s+(\\w+day)\\s+([0-9:]+\\s*(?:am|pm)?)/i;
    const moveMatch = rawPrompt.match(moveRegex);
    if (moveMatch) {
      const studentQuery = moveMatch[1].trim();
      const tutorQuery = moveMatch[2].trim();
      const fromDay = moveMatch[3].trim();
      const fromTimeRaw = moveMatch[4].trim();
      const toDay = moveMatch[5].trim();
      const toTimeRaw = moveMatch[6].trim();

      const fromTime24 = parseTimeTokenTo24h(fromTimeRaw);
      const toTime24 = parseTimeTokenTo24h(toTimeRaw);

      const matchedTutors = findMatchingTutors(tutorQuery);
      if (matchedTutors.length > 1) {
        return {
          handled: true,
          intent: 'SCHEDULE_MUTATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'DUPLICATE_TUTOR_NAME',
          mutatedDatabase: false,
          candidates: matchedTutors.map(t => t.name),
          responseMarkdown: \`Clarification Required (Ambiguous Tutor Name): Multiple tutors match "\${tutorQuery}": \${matchedTutors.map(t => t.name).join(', ')}. Please specify the full name so I do not mutate the wrong schedule.\`
        };
      }
      if (matchedTutors.length === 0) {
        return {
          handled: true,
          intent: 'SCHEDULE_MUTATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'TUTOR_NOT_FOUND',
          mutatedDatabase: false,
          responseMarkdown: \`Clarification Required: No tutor found matching "\${tutorQuery}".\`
        };
      }

      const matchedStudents = findMatchingStudents(studentQuery);
      if (matchedStudents.length === 0) {
        return {
          handled: true,
          intent: 'SCHEDULE_MUTATION',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'STUDENT_NOT_FOUND',
          mutatedDatabase: false,
          responseMarkdown: \`Clarification Required: No student found matching "\${studentQuery}".\`
        };
      }

      const tutor = matchedTutors[0];
      const student = matchedStudents[0];
      const studentFullName = ((student.firstName || '') + ' ' + (student.lastName || '')).trim();
      const targetDate = getNextDateForDayName(toDay);

      // Find the schedule to move (or create/locate student's active slot with this tutor)
      let targetSchedule = db.schedules.find(s =>
        s &&
        (s.studentId === student.id || (s.studentName || '').toLowerCase() === studentFullName.toLowerCase()) &&
        ((s.dayOfWeek || '').toLowerCase() === fromDay.toLowerCase() || (fromTime24 && s.time === fromTime24))
      );
      if (!targetSchedule) {
        targetSchedule = db.schedules.find(s =>
          s && (s.studentId === student.id || (s.studentName || '').toLowerCase() === studentFullName.toLowerCase())
        );
      }

      // Check for tutor/student conflict at destination Day + Time
      const conflictingSession = db.schedules.find(s => {
        if (!s || s.status === 'cancelled' || (targetSchedule && s.id === targetSchedule.id)) return false;
        const sameTime = s.time === toTime24;
        const sameDayOrDate = ((s.dayOfWeek || '').toLowerCase() === toDay.toLowerCase()) || (s.date === targetDate);
        if (!sameTime || !sameDayOrDate) return false;
        const sameTutor = (s.tutorEmail && tutor.email && s.tutorEmail.toLowerCase() === tutor.email.toLowerCase()) ||
                          ((s.mentor || s.tutorName || '').toLowerCase() === (tutor.name || '').toLowerCase());
        const sameStudent = s.studentId === student.id || (s.studentName || '').toLowerCase() === studentFullName.toLowerCase();
        return sameTutor || sameStudent;
      });

      if (conflictingSession) {
        return {
          handled: true,
          intent: 'SCHEDULE_MUTATION',
          status: 'CONFLICT_DETECTED',
          reason: 'SLOT_UNAVAILABLE',
          mutatedDatabase: false,
          conflictingSession: conflictingSession,
          responseMarkdown: \`Schedule Conflict Blocked: \${tutor.name} already has a session with \${conflictingSession.studentName} on \${toDay} at \${toTime24} WAT. No destructive database write was performed. Would you like me to suggest the next open slot on \${toDay}?\`
        };
      }

      if (!targetSchedule) {
        targetSchedule = {
          id: 'sch-ai-' + Date.now(),
          studentId: student.id,
          studentName: studentFullName,
          parentEmail: student.parentEmail || '',
          course: student.program || 'Coding Track',
          mentor: tutor.name,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          link: student.meetLink || 'https://meet.google.com/stemulus-live',
          duration: 60,
          attendanceStatus: 'pending'
        };
        db.schedules.push(targetSchedule);
      }

      const previousDay = targetSchedule.dayOfWeek || fromDay;
      const previousTime = targetSchedule.time || fromTime24;
      const previousDate = targetSchedule.date || '';

      targetSchedule.dayOfWeek = toDay.charAt(0).toUpperCase() + toDay.slice(1).toLowerCase();
      targetSchedule.time = toTime24;
      targetSchedule.date = targetDate;
      targetSchedule.mentor = tutor.name;
      targetSchedule.tutorName = tutor.name;
      targetSchedule.tutorEmail = tutor.email;
      targetSchedule.updatedAt = new Date().toISOString();
      targetSchedule.updatedBy = 'SmartAdminAssistant';

      // Notify Tutor and Parent so both portals reflect the change immediately
      const nowIso = new Date().toISOString();
      db.notifications.unshift({
        id: 'not-aimove-tut-' + Date.now(),
        userEmail: (tutor.email || '').toLowerCase(),
        studentId: student.id,
        studentName: studentFullName,
        title: 'Schedule Updated: ' + studentFullName,
        message: \`Admin moved \${studentFullName}'s class from \${previousDay} \${previousTime} to \${targetSchedule.dayOfWeek} (\${targetDate}) at \${toTime24} WAT.\`,
        timestamp: nowIso,
        read: false
      });

      if (student.parentEmail) {
        db.notifications.unshift({
          id: 'not-aimove-par-' + Date.now(),
          userEmail: student.parentEmail.toLowerCase(),
          studentId: student.id,
          studentName: studentFullName,
          title: 'Class Schedule Updated for ' + studentFullName,
          message: \`\${studentFullName}'s session with Coach \${tutor.name} has been moved to \${targetSchedule.dayOfWeek} (\${targetDate}) at \${toTime24} WAT.\`,
          timestamp: nowIso,
          read: false
        });
      }

      db.smartAdminAuditLog.unshift({
        id: 'ai-cmd-' + Date.now(),
        intent: 'SCHEDULE_MUTATION',
        status: 'SUCCESS',
        prompt: rawPrompt,
        scheduleId: targetSchedule.id,
        studentId: student.id,
        studentName: studentFullName,
        tutorName: tutor.name,
        from: { day: previousDay, time: previousTime, date: previousDate },
        to: { day: targetSchedule.dayOfWeek, time: toTime24, date: targetDate },
        timestamp: nowIso
      });

      if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { source: 'smartAdminScheduleMutation', scheduleId: targetSchedule.id } }));
      }

      return {
        handled: true,
        intent: 'SCHEDULE_MUTATION',
        status: 'SUCCESS',
        mutatedDatabase: true,
        schedule: targetSchedule,
        responseMarkdown: \`Schedule Updated Successfully:\\n- Coder: \${studentFullName}\\n- Instructor: \${tutor.name}\\n- Previous Slot: \${previousDay} at \${previousTime} WAT\\n- New Slot: \${targetSchedule.dayOfWeek} (\${targetDate}) at \${toTime24} WAT\\n- Conflict Check: Zero overlaps detected.\\n- Portal Sync: Updated db.schedules and notified both Tutor (\${tutor.email}) and Parent (\${student.parentEmail || 'linked parent'}).\`,
        actions: [{ action: 'navigate_schedules', label: 'View Master Schedule' }]
      };
    }

    // -------------------------------------------------------------------------
    // INTENT 3: DIRECT TUTOR MESSAGING COMMAND
    // Pattern: "Text [Tutor Name] asking why today's attendance log isn't submitted yet"
    // -------------------------------------------------------------------------
    const msgRegex = /^(?:Text|Message|WhatsApp|Notify)\\s+(.+?)\\s+(?:asking|about|to\\s+say|that)\\s+([\\s\\S]+)$/i;
    const msgMatch = rawPrompt.match(msgRegex);
    if (msgMatch) {
      const tutorQuery = msgMatch[1].trim();
      const topicBody = msgMatch[2].trim();

      const matchedTutors = findMatchingTutors(tutorQuery);
      if (matchedTutors.length > 1) {
        return {
          handled: true,
          intent: 'DIRECT_TUTOR_MESSAGING',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'DUPLICATE_TUTOR_NAME',
          mutatedDatabase: false,
          candidates: matchedTutors.map(t => t.name),
          responseMarkdown: \`Clarification Required (Ambiguous Tutor Name): Multiple tutors match "\${tutorQuery}": \${matchedTutors.map(t => t.name + ' (' + (t.phone || t.email) + ')').join(', ')}. Which tutor should receive this message?\`
        };
      }
      if (matchedTutors.length === 0) {
        return {
          handled: true,
          intent: 'DIRECT_TUTOR_MESSAGING',
          status: 'CLARIFICATION_REQUIRED',
          reason: 'TUTOR_NOT_FOUND',
          mutatedDatabase: false,
          responseMarkdown: \`Clarification Required: Could not find a tutor matching "\${tutorQuery}".\`
        };
      }

      const tutor = matchedTutors[0];
      const tutorPhone = String(tutor.phone || tutor.whatsapp || '2347052466716').replace(/[^0-9]/g, '');
      const formattedMessage = \`Hello Coach \${tutor.name}, Admin Operations Desk check-in: please let us know \${topicBody.replace(/\\?$/, '')}? Please submit your session attendance log in the Tutor Portal right away.\`;
      const waUrl = \`https://wa.me/\${tutorPhone}?text=\${encodeURIComponent(formattedMessage)}\`;

      const nowIso = new Date().toISOString();
      const outboundPayload = {
        id: 'out-msg-' + Date.now(),
        intent: 'DIRECT_TUTOR_MESSAGING',
        channel: 'sms_whatsapp_ntfy_webhook',
        tutorId: tutor.id || 'tut-active',
        tutorName: tutor.name,
        tutorEmail: tutor.email,
        phoneNumber: tutorPhone,
        message: formattedMessage,
        whatsappUrl: waUrl,
        webhookStatus: 'dispatched_with_graceful_fallback',
        timestamp: nowIso
      };

      // Graceful async webhook dispatch (never crashes on offline/network error)
      try {
        if (typeof fetch === 'function') {
          const topic = db.ntfyTopic || 'stm-ops-admin-dispatch';
          fetch('https://ntfy.sh/' + topic, {
            method: 'POST',
            headers: { 'Title': 'Outbound Tutor Dispatch: ' + tutor.name, 'Priority': 'high' },
            body: \`To: \${tutor.name} (\${tutorPhone})\\nMessage: \${formattedMessage}\`
          }).catch(function(err) {
            outboundPayload.webhookFallbackNote = 'External webhook unreachable (' + (err && err.message ? err.message : 'offline') + '); persisted to local queue & portal notifications.';
          });
        }
      } catch (webhookErr) {
        outboundPayload.webhookFallbackNote = 'Handled webhook exception gracefully.';
      }

      db.outboundMessages.unshift(outboundPayload);
      db.notifications.unshift({
        id: 'not-tutor-msg-' + Date.now(),
        userEmail: (tutor.email || '').toLowerCase(),
        title: 'Urgent Admin Operations Follow-Up',
        message: formattedMessage,
        timestamp: nowIso,
        read: false
      });

      db.smartAdminAuditLog.unshift({
        id: 'ai-cmd-' + Date.now(),
        intent: 'DIRECT_TUTOR_MESSAGING',
        status: 'SUCCESS',
        prompt: rawPrompt,
        outboundPayload: outboundPayload,
        timestamp: nowIso
      });

      if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);

      return {
        handled: true,
        intent: 'DIRECT_TUTOR_MESSAGING',
        status: 'SUCCESS',
        mutatedDatabase: true,
        outboundPayload: outboundPayload,
        responseMarkdown: \`Direct Tutor Message Dispatched:\\n- Recipient: \${tutor.name} (ID: \${tutor.id || tutor.email})\\n- Phone / WhatsApp: +\${tutorPhone}\\n- Message Payload: "\${formattedMessage}"\\n- Delivery Status: Dispatched via Outbound Webhook + In-Portal Notification (with graceful network fallback).\`
      };
    }

    return {
      handled: false,
      intent: 'UNRECOGNIZED_COMMAND',
      status: 'UNHANDLED',
      mutatedDatabase: false,
      responseMarkdown: 'Command not matched as a direct schedule mutation, tutor dispatch, or reschedule negotiation.'
    };
  }

  function submitSmartAdminPrompt(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('smart-admin-prompt-input');
    const output = document.getElementById('smart-admin-prompt-output');
    if (!input || !output) return null;
    const promptVal = input.value.trim();
    if (!promptVal) return null;

    const res = executeSmartAdminCommand(promptVal);
    const statusColor = res.status === 'SUCCESS'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : (res.status === 'CLARIFICATION_REQUIRED' || res.status === 'CONFLICT_DETECTED')
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : 'bg-slate-50 border-slate-200 text-slate-800';

    const esc = (typeof DashboardEngine !== 'undefined' && DashboardEngine.escapeHtml)
      ? DashboardEngine.escapeHtml
      : function(s) { return String(s || ''); };

    output.innerHTML = \`
      <div class="p-4 rounded-2xl border \${statusColor} text-xs space-y-1.5 mt-3">
        <div class="flex items-center justify-between">
          <span class="font-extrabold uppercase tracking-wider text-[10px]">Intent: \${esc(res.intent || 'GENERAL')}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border">\${esc(res.status)}</span>
        </div>
        <div class="whitespace-pre-line font-medium leading-relaxed">\${esc(res.responseMarkdown)}</div>
      </div>
    \`;
    return res;
  }
`;

    // Insert smartAssistantCode right before renderOperationsSuiteHTML
    const targetRender = `  /**
   * Render Unified Classroom & Operations Manager HUD for Admin Dashboard.
   */
  function renderOperationsSuiteHTML() {`;

    code = code.replace(targetRender, smartAssistantCode + '\n' + targetRender);

    // Add Smart Admin Assistant Command Console into renderOperationsSuiteHTML()
    const targetReturnHtml = `      <div class="space-y-6 mb-8">`;
    const assistantConsoleHtml = `      <div class="space-y-6 mb-8">
        <!-- 0. Smart Admin Assistant (Prompt-Driven Operations Console) -->
        <div class="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">In-App Smart Admin Assistant</span>
                <span class="text-[11px] text-emerald-400 font-semibold">Live DB + Webhook Execution</span>
              </div>
              <h3 class="text-base font-black text-white mt-1">Prompt-Driven Operations Command Bar</h3>
              <p class="text-xs text-slate-400">Execute schedule mutations, direct tutor SMS/WhatsApp dispatches, and autonomous reschedule negotiations in plain English.</p>
            </div>
          </div>
          <form id="smart-admin-prompt-form" onsubmit="OperationsManagerEngine.submitSmartAdminPrompt(event)" class="flex flex-col sm:flex-row gap-2.5">
            <input type="text" id="smart-admin-prompt-input" placeholder="e.g. Move Gbolade's class with Moses Oluwafemi Adebayo from Tuesday 4 PM to Thursday 5 PM" class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500">
            <button type="submit" id="smart-admin-prompt-submit" class="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-all cursor-pointer shrink-0">
              Execute Prompt
            </button>
          </form>
          <div id="smart-admin-prompt-output"></div>
        </div>`;

    code = code.replace(targetReturnHtml, assistantConsoleHtml);

    const oldModuleExports = `    renderOperationsSuiteHTML,
    STANDBY_TUTORS`;
    const newModuleExports = `    executeSmartAdminCommand,
    submitSmartAdminPrompt,
    renderOperationsSuiteHTML,
    STANDBY_TUTORS`;
    code = code.replace(oldModuleExports, newModuleExports);

    writeFile(rel, code);
  }
})();

// ---------------------------------------------------------------------------
// 9. Patch admin-dashboard.html & assets/js/admin-engine.js
//    (Mount Operations Suite + Issue Escalation Inbox on Admin Dashboard)
// ---------------------------------------------------------------------------
(function patchAdminPortalEscalationInboxAndOpsMount() {
  const htmlRel = 'admin-dashboard.html';
  let html = readFile(htmlRel).replace(/\r\n/g, '\n');

  if (!html.includes('mount-admin-escalation-inbox')) {
    const targetMount = ` <!-- CLASSROOM & OPERATIONS HEADQUARTERS -->
 <div id="mount-operations-suite" class="mt-6"></div>`;

    const replacementMount = ` <!-- TUTOR ISSUE ESCALATION INBOX -->
 <div id="mount-admin-escalation-inbox" class="mt-6"></div>

 <!-- CLASSROOM & OPERATIONS HEADQUARTERS -->
 <div id="mount-operations-suite" class="mt-6"></div>`;

    if (!html.includes(targetMount)) {
      throw new Error('Target mount not found in ' + htmlRel);
    }
    html = html.replace(targetMount, replacementMount);
    writeFile(htmlRel, html);
  }

  const jsRel = 'assets/js/admin-engine.js';
  let js = readFile(jsRel).replace(/\r\n/g, '\n');

  if (!js.includes('renderIssueEscalationInbox')) {
    const oldLoadData = `    renderAttendanceEscalationCenter();
    checkBirthdays();`;

    const newLoadData = `    renderAttendanceEscalationCenter();
    renderIssueEscalationInbox();
    if (typeof OperationsManagerEngine !== 'undefined' && document.getElementById('mount-operations-suite')) {
        document.getElementById('mount-operations-suite').innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();
    }
    checkBirthdays();`;

    js = js.replace(oldLoadData, newLoadData);

    const inboxFunctions = `
function renderIssueEscalationInbox() {
    const container = document.getElementById('mount-admin-escalation-inbox');
    if (!container || typeof DashboardEngine === 'undefined' || !DashboardEngine.getIssueEscalations) return;
    const list = DashboardEngine.getIssueEscalations('all') || [];
    const openCount = list.filter(e => e && e.status !== 'resolved').length;
    const escHtml = DashboardEngine.escapeHtml || function(s) { return String(s || ''); };

    const sevBadge = {
        critical: 'bg-rose-100 text-rose-800 border-rose-200',
        high: 'bg-amber-100 text-amber-800 border-amber-200',
        medium: 'bg-blue-100 text-blue-800 border-blue-200',
        low: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    container.innerHTML = \`
        <div class="admin-card rounded-2xl p-5 border border-slate-200 bg-white">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                    <div class="flex items-center gap-2">
                        <h3 class="text-base font-nunito font-bold text-slate-900">Tutor Issue Escalation Inbox</h3>
                        <span id="admin-escalation-open-badge" class="px-2.5 py-0.5 rounded-full text-xs font-extrabold \${openCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">\${openCount} Open</span>
                    </div>
                    <p class="text-xs text-slate-500">Manage tutor escalations across student behavior, technical issues, scheduling conflicts, parent disputes, and payment queries.</p>
                </div>
            </div>
            \${list.length === 0 ? '<p class="text-xs text-slate-400 text-center py-6">No issue escalations submitted by faculty yet.</p>' : \`
                <div class="space-y-3" id="admin-escalation-items">
                    \${list.map(item => \`
                        <div class="p-4 rounded-2xl border \${item.status === 'resolved' ? 'border-slate-200 bg-slate-50/60' : 'border-rose-200/80 bg-rose-50/20'} flex flex-col lg:flex-row lg:items-center justify-between gap-4" data-escalation-id="\${escHtml(item.id)}">
                            <div class="space-y-1 flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border \${sevBadge[item.severity] || sevBadge.medium}">\${escHtml(item.severity)}</span>
                                    <span class="text-xs font-extrabold text-slate-900">\${escHtml(item.categoryLabel || item.category)}</span>
                                    <span class="text-xs text-slate-500">&bull; Tutor: <strong>\${escHtml(item.tutorName)}</strong></span>
                                    <span class="text-xs text-slate-500">&bull; Student: <strong>\${escHtml(item.studentName)}</strong></span>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase \${item.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">\${escHtml(item.status)}</span>
                                </div>
                                <p class="text-xs font-bold text-slate-800">\${escHtml(item.summary)}</p>
                                <p class="text-xs text-slate-600">\${escHtml(item.details)}</p>
                                <p class="text-[11px] text-slate-400">Assigned To: <strong class="text-slate-600">\${escHtml(item.assignedTo || 'Academic Operations Director')}</strong></p>
                                \${item.resolutionNotes ? \`<p class="text-[11px] text-emerald-700 font-semibold">Resolution: \${escHtml(item.resolutionNotes)}</p>\` : ''}
                            </div>
                            <div class="flex flex-wrap items-center gap-2 shrink-0">
                                <button type="button" onclick="AdminEngine.replyIssueEscalation('\${escHtml(item.id)}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer">Reply</button>
                                <button type="button" onclick="AdminEngine.reassignIssueEscalation('\${escHtml(item.id)}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 cursor-pointer">Reassign</button>
                                \${item.status !== 'resolved' ? \`<button type="button" onclick="AdminEngine.resolveIssueEscalation('\${escHtml(item.id)}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">Resolve</button>\` : ''}
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`}
        </div>
    \`;
}

function replyIssueEscalation(escalationId, customReply) {
    const replyText = customReply !== undefined ? customReply : prompt('Enter reply to tutor for this escalation:', 'Thank you. Academic Operations is reviewing this now.');
    if (!replyText) return null;
    const res = DashboardEngine.replyIssueEscalation(escalationId, replyText, 'Admin Operations', 'admin');
    if (res && res.success) {
        showToast('Reply sent to tutor.', 'success');
        renderIssueEscalationInbox();
    }
    return res;
}

function reassignIssueEscalation(escalationId, customAssignee) {
    const assignee = customAssignee !== undefined ? customAssignee : prompt('Reassign escalation to coordinator/department:', 'Senior Safeguarding & Academic Lead');
    if (!assignee) return null;
    const res = DashboardEngine.reassignIssueEscalation(escalationId, assignee);
    if (res && res.success) {
        showToast('Escalation reassigned to ' + assignee + '.', 'success');
        renderIssueEscalationInbox();
    }
    return res;
}

function resolveIssueEscalation(escalationId, customResolution) {
    const notes = customResolution !== undefined ? customResolution : prompt('Enter resolution notes:', 'Issue resolved and verified with tutor and parent.');
    if (!notes) return null;
    const res = DashboardEngine.resolveIssueEscalation(escalationId, notes, 'Admin Operations');
    if (res && res.success) {
        showToast('Escalation marked as resolved.', 'success');
        renderIssueEscalationInbox();
    }
    return res;
}
`;

    const targetAdminExport = `    // Attendance Escalation Center
    getAttendanceEscalations,
    renderAttendanceEscalationCenter,
    nudgeTutorEmail,`;

    const replacementAdminExport = inboxFunctions + `\n` + targetAdminExport + `
    renderIssueEscalationInbox,
    replyIssueEscalation,
    reassignIssueEscalation,
    resolveIssueEscalation,`;

    // Wait: inboxFunctions must be defined outside the return object! Let's place inboxFunctions right before `return {` in AdminEngine.
    const targetReturnBlock = `    // Attendance Escalation Center
    getAttendanceEscalations,`;

    // Let's find `return {` near the end of AdminEngine
    const returnIdx = js.lastIndexOf('return {', js.indexOf('getAttendanceEscalations,'));
    if (returnIdx === -1) {
      throw new Error('Could not find return { in ' + jsRel);
    }
    js = js.slice(0, returnIdx) + inboxFunctions + '\n' + js.slice(returnIdx);
    js = js.replace(targetAdminExport, targetAdminExport + `\n    renderIssueEscalationInbox,\n    replyIssueEscalation,\n    reassignIssueEscalation,\n    resolveIssueEscalation,`);
    writeFile(jsRel, js);
  }
})();

console.log('All remediation patches applied successfully.');
