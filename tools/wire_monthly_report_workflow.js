const fs = require('fs');
const path = require('path');

const tutorHtmlPath = path.join(__dirname, '../tutor-dashboard.html');
const tutorEnginePath = path.join(__dirname, '../assets/js/tutor-engine.js');
const adminHtmlPath = path.join(__dirname, '../admin-dashboard.html');
const adminEnginePath = path.join(__dirname, '../assets/js/admin-engine.js');

let tutorHtml = fs.readFileSync(tutorHtmlPath, 'utf8');
let tutorEngine = fs.readFileSync(tutorEnginePath, 'utf8');
let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
let adminEngine = fs.readFileSync(adminEnginePath, 'utf8');

// =========================================================================
// 1. TUTOR DASHBOARD: Add script tag & Monthly Reports UI Card and Modal
// =========================================================================

if (!tutorHtml.includes('monthly-report-engine')) {
    tutorHtml = tutorHtml.replace(
        '<script src="assets/js/tutor-engine.min.js?v=20261017d" defer></script>',
        '<script src="assets/js/tutor-engine.min.js?v=20261017d" defer></script>\n  <script src="assets/js/monthly-report-engine.min.js" defer></script>'
    );
}

// Add Monthly Reports card to tutor dashboard grid (after attendance alerts)
const tutorReportCard = `
        <!-- 📝 MONTHLY PROGRESS REPORTS WORKFLOW (DIRECTOR APPROVED STANDARDS) -->
        <div class="dash-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">
                <i data-lucide="award" class="w-5 h-5 text-orange-500"></i>
                Monthly Student Progress Reports
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Comprehensive monthly learning portfolios, AI-crawled woohoo moments, and Director-approved parent updates.</p>
            </div>
            <button type="button" onclick="TutorEngine.openMonthlyReportModal()" class="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer" style="background-color: #ea580c !important;">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> New Monthly Report
            </button>
          </div>

          <div id="tutor-monthly-reports-list" class="space-y-3">
            <!-- Rendered by TutorEngine -->
          </div>
        </div>
`;

if (!tutorHtml.includes('tutor-monthly-reports-list')) {
    const cardTarget = '<div id="assigned-students-container"';
    tutorHtml = tutorHtml.replace(cardTarget, tutorReportCard + '\n        ' + cardTarget);
}

// Modal for Tutor to create / edit monthly report
const tutorReportModal = `
  <!-- MODAL: TUTOR CREATE / EDIT MONTHLY REPORT -->
  <div id="modal-tutor-monthly-report" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-nunito font-extrabold text-slate-800">Submit Monthly Student Report</h3>
            <p class="text-xs text-slate-500">Curate projects, strengths, and AI-suggested breakthrough moments for Director review.</p>
          </div>
        </div>
        <button type="button" onclick="TutorEngine.closeMonthlyReportModal()" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="form-tutor-monthly-report" onsubmit="TutorEngine.saveMonthlyReportForm(event)" class="space-y-4">
        <input type="hidden" id="tmr-id">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Select Enrolled Student *</label>
            <select id="tmr-student-id" required onchange="TutorEngine.onReportStudentChange(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-orange-500 transition-colors">
              <option value="">-- Choose Assigned Student --</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Evaluation Month / Period *</label>
            <input type="text" id="tmr-month" required value="October 2026" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-orange-500 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Project Portfolio Showcase (Links to what student built) *</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input type="text" id="tmr-proj1-title" placeholder="Project 1 Title (e.g. Space Shooter Game)" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
            <input type="url" id="tmr-proj1-url" placeholder="Project 1 URL (Scratch / Web / GitHub)" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" id="tmr-proj2-title" placeholder="Project 2 Title (e.g. Smart Tip Calculator)" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
            <input type="url" id="tmr-proj2-url" placeholder="Project 2 URL (Scratch / Web / GitHub)" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono">
          </div>
        </div>

        <!-- AI WOOHOO MOMENTS CRAWLER SECTION -->
        <div class="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-base">✨</span>
              <h4 class="text-xs font-black uppercase tracking-wider text-amber-900">AI Breakthrough "Woohoo" Moments</h4>
            </div>
            <button type="button" onclick="TutorEngine.triggerWoohooCrawler()" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1 cursor-pointer">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Crawl Monthly Session Logs
            </button>
          </div>
          <p class="text-[11px] text-amber-800 mb-2">The bot scans monthly logs for breakthrough moments. Review and tweak them below:</p>
          <textarea id="tmr-woohoo-moments" rows="3" placeholder="Click 'Crawl Monthly Session Logs' above or type specific breakthrough moments where the student shone independently..." class="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Where the Student Shined (Strengths & Celebrations) *</label>
          <textarea id="tmr-strengths" rows="3" required placeholder="Describe what clicked, concepts mastered, and positive attitudes observed..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Focus Areas for Growth & Next Month's Roadmap *</label>
          <textarea id="tmr-growth" rows="3" required placeholder="Constructive areas for reinforcement (e.g. nested conditionals, debugging resilience)..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"></textarea>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button type="button" onclick="TutorEngine.closeMonthlyReportModal()" class="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">
            Cancel
          </button>
          <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer" style="background-color: #ea580c !important;">
            <i data-lucide="send" class="w-4 h-4"></i> Submit to Director for Approval
          </button>
        </div>
      </form>
    </div>
  </div>
`;

if (!tutorHtml.includes('modal-tutor-monthly-report')) {
    tutorHtml = tutorHtml.replace('</body>', tutorReportModal + '\n</body>');
}

fs.writeFileSync(tutorHtmlPath, tutorHtml, 'utf8');

// =========================================================================
// 2. TUTOR ENGINE: Add methods to handle reports, student change, and rendering
// =========================================================================

const tutorEngineAdditions = `
    // ===== MONTHLY PROGRESS REPORTS WORKFLOW =====
    function renderMonthlyReportsList() {
        const container = document.getElementById('tutor-monthly-reports-list');
        if (!container || typeof MonthlyReportEngine === 'undefined') return;
        if (!currentTutor) return;

        const allReports = MonthlyReportEngine.getReports();
        const tutorEmail = (currentTutor.email || '').toLowerCase().trim();
        const myReports = allReports.filter(r => (r.tutorEmail || '').toLowerCase().trim() === tutorEmail);

        if (!myReports.length) {
            container.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">No monthly progress reports filed yet. Click "New Monthly Report" above to draft an evaluation.</p>';
            return;
        }

        container.innerHTML = myReports.map(r => {
            let statusBadge = '';
            let actionBtn = '';

            if (r.status === 'pending_admin_approval') {
                statusBadge = '<span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Director Approval</span>';
            } else if (r.status === 'rejected_needs_revision') {
                statusBadge = '<span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">Revision Requested</span>';
                actionBtn = '<button type="button" onclick="TutorEngine.editMonthlyReport(\\'' + r.id + '\\')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs">Edit &amp; Resubmit</button>';
            } else if (r.status === 'approved') {
                statusBadge = '<span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Approved &amp; Sent</span>';
                actionBtn = '<button type="button" onclick="MonthlyReportEngine.openReportPDF(\\'' + r.id + '\\')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"><i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-600"></i> View PDF</button>';
            }

            return \`
                <div class="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 class="text-sm font-extrabold text-slate-900">\${r.studentName}</h4>
                            <span class="text-xs text-slate-400 font-semibold">&bull; \${r.month}</span>
                            \${statusBadge}
                        </div>
                        <p class="text-xs text-slate-600 line-clamp-1">\${r.shiningHighlights || 'Learning evaluation filed.'}</p>
                        \${r.adminFeedback ? \`<p class="text-xs text-rose-700 font-bold mt-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">Director Feedback: "\${r.adminFeedback}"</p>\` : ''}
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        \${actionBtn}
                    </div>
                </div>
            \`;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    function openMonthlyReportModal(reportId = null) {
        const modal = document.getElementById('modal-tutor-monthly-report');
        if (!modal) return;

        // Populate student selector
        const select = document.getElementById('tmr-student-id');
        if (select && typeof DashboardEngine !== 'undefined') {
            const myStudents = DashboardEngine.getTutorStudents ? DashboardEngine.getTutorStudents(currentTutor.email) : [];
            select.innerHTML = '<option value="">-- Choose Assigned Student --</option>' +
                myStudents.map(s => \`<option value="\${s.id}" data-name="\${s.firstName} \${s.lastName || ''}" data-course="\${s.program || 'Coding'}" data-parent-name="\${s.parentName || 'Parent'}" data-parent-email="\${s.parentEmail || ''}">\${s.firstName} \${s.lastName || ''} (\${s.program || 'Coding'})</option>\`).join('');
        }

        if (reportId && typeof MonthlyReportEngine !== 'undefined') {
            const r = MonthlyReportEngine.getReports().find(rep => rep.id === reportId);
            if (r) {
                document.getElementById('tmr-id').value = r.id;
                select.value = r.studentId;
                document.getElementById('tmr-month').value = r.month || 'October 2026';
                document.getElementById('tmr-proj1-title').value = (r.projectLinks[0] && r.projectLinks[0].title) || '';
                document.getElementById('tmr-proj1-url').value = (r.projectLinks[0] && r.projectLinks[0].url) || '';
                document.getElementById('tmr-proj2-title').value = (r.projectLinks[1] && r.projectLinks[1].title) || '';
                document.getElementById('tmr-proj2-url').value = (r.projectLinks[1] && r.projectLinks[1].url) || '';
                document.getElementById('tmr-woohoo-moments').value = (r.woohooMoments || []).map(m => m.moment).join('\\n');
                document.getElementById('tmr-strengths').value = r.shiningHighlights || '';
                document.getElementById('tmr-growth').value = r.growthAreas || '';
            }
        } else {
            document.getElementById('tmr-id').value = '';
            document.getElementById('tmr-proj1-title').value = '';
            document.getElementById('tmr-proj1-url').value = '';
            document.getElementById('tmr-proj2-title').value = '';
            document.getElementById('tmr-proj2-url').value = '';
            document.getElementById('tmr-woohoo-moments').value = '';
            document.getElementById('tmr-strengths').value = '';
            document.getElementById('tmr-growth').value = '';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }

    function closeMonthlyReportModal() {
        const modal = document.getElementById('modal-tutor-monthly-report');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function onReportStudentChange(studentId) {
        if (!studentId) return;
        triggerWoohooCrawler();
    }

    function triggerWoohooCrawler() {
        const select = document.getElementById('tmr-student-id');
        const studentId = select.value;
        if (!studentId || typeof MonthlyReportEngine === 'undefined') return;

        const moments = MonthlyReportEngine.crawlWoohooMoments(studentId, document.getElementById('tmr-month').value);
        if (moments && moments.length) {
            const formatted = moments.map((m, idx) => \`\${idx + 1}. [\${m.date}] \${m.moment} (Remark: \${m.tutorRemark})\`).join('\\n\\n');
            document.getElementById('tmr-woohoo-moments').value = formatted;
            if (typeof showToast === 'function') showToast('Crawled ' + moments.length + ' breakthrough moments from monthly session logs!', 'success');
        } else {
            document.getElementById('tmr-woohoo-moments').value = '1. Successfully completed structured curriculum hands-on exercises with growing independence.';
        }
    }

    function saveMonthlyReportForm(e) {
        e.preventDefault();
        const select = document.getElementById('tmr-student-id');
        const selectedOpt = select.options[select.selectedIndex];
        if (!select.value) {
            alert('Please select an enrolled student.');
            return;
        }

        const p1Title = document.getElementById('tmr-proj1-title').value.trim();
        const p1Url = document.getElementById('tmr-proj1-url').value.trim();
        const p2Title = document.getElementById('tmr-proj2-title').value.trim();
        const p2Url = document.getElementById('tmr-proj2-url').value.trim();

        const projectLinks = [];
        if (p1Title && p1Url) projectLinks.push({ title: p1Title, url: p1Url });
        if (p2Title && p2Url) projectLinks.push({ title: p2Title, url: p2Url });

        const woohooRaw = document.getElementById('tmr-woohoo-moments').value.trim();
        const moments = woohooRaw ? woohooRaw.split('\\n').filter(Boolean).map(m => ({
            date: 'Monthly Session',
            topic: 'Practical Application',
            moment: m.replace(/^\\d+\\.\\s*/, '').trim()
        })) : [];

        const reportData = {
            id: document.getElementById('tmr-id').value || null,
            studentId: select.value,
            studentName: selectedOpt.getAttribute('data-name'),
            course: selectedOpt.getAttribute('data-course'),
            parentName: selectedOpt.getAttribute('data-parent-name'),
            parentEmail: selectedOpt.getAttribute('data-parent-email'),
            tutorId: currentTutor.id || 'tut-current',
            tutorName: currentTutor.name || 'Tutor',
            tutorEmail: currentTutor.email || '',
            month: document.getElementById('tmr-month').value.trim(),
            projectLinks: projectLinks,
            shiningHighlights: document.getElementById('tmr-strengths').value.trim(),
            growthAreas: document.getElementById('tmr-growth').value.trim(),
            woohooMoments: moments
        };

        if (typeof MonthlyReportEngine !== 'undefined') {
            MonthlyReportEngine.submitReport(reportData);
            closeMonthlyReportModal();
            renderMonthlyReportsList();
            if (typeof showToast === 'function') {
                showToast('Monthly report submitted to Director for review!', 'success');
            }
        }
    }
`;

// Insert tutorEngineAdditions right before return object in tutor-engine.js
const tutorReturnMarker = 'return {';
const tLastReturn = tutorEngine.lastIndexOf(tutorReturnMarker);
tutorEngine = tutorEngine.slice(0, tLastReturn) + tutorEngineAdditions + '\n' + tutorEngine.slice(tLastReturn);

// Also expose in TutorEngine return
const tutorExposeMethods = `
        renderMonthlyReportsList: renderMonthlyReportsList,
        openMonthlyReportModal: openMonthlyReportModal,
        closeMonthlyReportModal: closeMonthlyReportModal,
        editMonthlyReport: openMonthlyReportModal,
        onReportStudentChange: onReportStudentChange,
        triggerWoohooCrawler: triggerWoohooCrawler,
        saveMonthlyReportForm: saveMonthlyReportForm,
`;
tutorEngine = tutorEngine.slice(0, tLastReturn + tutorReturnMarker.length) + tutorExposeMethods + tutorEngine.slice(tLastReturn + tutorReturnMarker.length);

// Call renderMonthlyReportsList in init()
tutorEngine = tutorEngine.replace('renderNotifications();', 'renderNotifications();\n        renderMonthlyReportsList();');

fs.writeFileSync(tutorEnginePath, tutorEngine, 'utf8');
console.log('Successfully updated tutor-engine.js with Monthly Reports workflow!');

// =========================================================================
// 3. ADMIN DASHBOARD: Add script tag, Cockpit section, and Approval Modal
// =========================================================================

if (!adminHtml.includes('monthly-report-engine')) {
    adminHtml = adminHtml.replace(
        '<script src="assets/js/billing-engine.min.js" defer></script>',
        '<script src="assets/js/billing-engine.min.js" defer></script>\n<script src="assets/js/monthly-report-engine.min.js" defer></script>'
    );
}

// Add Monthly Reports section in admin-dashboard.html
const adminReportsSection = `
  <!-- ===== MONTHLY PROGRESS REPORTS REVIEW SECTION ===== -->
  <section id="section-monthly-reports" class="admin-section space-y-6 animate-fadeIn">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Student Monthly Progress Reports</h2>
        <p class="text-sm text-gray-500 mt-1">Review tutor-submitted evaluations, enforce Director voice standards, approve reports, and dispatch follow-up invoices.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
          Standard: Minimalist Luxury Oval Office Preset
        </span>
      </div>
    </div>

    <!-- PENDING REVIEWS COCKPIT -->
    <div class="admin-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <h3 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4 text-orange-500"></i>
          Reports Awaiting Director Approval
        </h3>
        <span id="admin-pending-reports-count" class="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">0 Pending</span>
      </div>
      <div id="admin-pending-reports-list" class="space-y-3">
        <!-- Rendered by AdminEngine -->
      </div>
    </div>

    <!-- APPROVED ARCHIVE -->
    <div class="admin-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
      <h3 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
        Approved &amp; Dispatched Reports
      </h3>
      <div id="admin-approved-reports-list" class="space-y-2">
        <!-- Rendered by AdminEngine -->
      </div>
    </div>
  </section>
`;

if (!adminHtml.includes('section-monthly-reports')) {
    const sSettingsMarker = '<section id="section-settings"';
    adminHtml = adminHtml.replace(sSettingsMarker, adminReportsSection + '\n' + sSettingsMarker);
}

// Add navigation link in admin sidebar
const navItemReports = `
<li>
  <a href="#" data-section="monthly-reports" class="nav-link flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-orange-500/15 hover:text-orange-400 transition-colors">
    <i data-lucide="file-check" class="w-5 h-5"></i>
    <span>Monthly Reports</span>
    <span id="nav-reports-badge" class="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-md hidden">0</span>
  </a>
</li>
`;

if (!adminHtml.includes('data-section="monthly-reports"')) {
    const emailQueueNavMarker = '<a href="#" data-section="email-queue"';
    adminHtml = adminHtml.replace(emailQueueNavMarker, navItemReports + '\n' + emailQueueNavMarker);
}

// Admin Modal: Inspect, Approve, or Reject Report
const adminReviewModal = `
  <!-- MODAL: ADMIN REVIEW MONTHLY REPORT -->
  <div id="modal-admin-review-report" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <i data-lucide="file-search" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-nunito font-extrabold text-slate-800">Director Report Inspection</h3>
            <span id="amr-badge" class="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">REVIEW PENDING</span>
          </div>
        </div>
        <button type="button" onclick="AdminEngine.closeReviewModal()" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <input type="hidden" id="amr-id">

      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
        <div class="flex justify-between border-b border-slate-200/60 pb-2">
          <span class="text-slate-500 font-bold uppercase">Student:</span>
          <span id="amr-student" class="font-extrabold text-slate-900 text-sm"></span>
        </div>
        <div class="flex justify-between border-b border-slate-200/60 pb-2">
          <span class="text-slate-500 font-bold uppercase">Tutor:</span>
          <span id="amr-tutor" class="font-bold text-slate-800"></span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500 font-bold uppercase">Period:</span>
          <span id="amr-month" class="font-bold text-slate-800"></span>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Where the Student Shined</h4>
          <div id="amr-strengths" class="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed"></div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Breakthrough "Woohoo" Moments</h4>
          <div id="amr-woohoo" class="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed"></div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Project Portfolio Showcase</h4>
          <div id="amr-projects" class="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"></div>
        </div>

        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Focus Areas &amp; Growth Roadmap</h4>
          <div id="amr-growth" class="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed"></div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button type="button" onclick="AdminEngine.promptRejectReport()" class="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Request Redo / Reject
        </button>
        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button type="button" onclick="AdminEngine.previewReportPDF()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Preview PDF
          </button>
          <button type="button" onclick="AdminEngine.approveAndSendReport()" class="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer" style="background-color: #047857 !important;">
            <i data-lucide="check" class="w-4 h-4"></i> Approve &amp; Send to Parent
          </button>
        </div>
      </div>
    </div>
  </div>
`;

if (!adminHtml.includes('modal-admin-review-report')) {
    adminHtml = adminHtml.replace('</body>', adminReviewModal + '\n</body>');
}

fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');

// =========================================================================
// 4. ADMIN ENGINE: Add review handlers, approval dispatch, and PDF rendering
// =========================================================================

const adminEngineAdditions = `
// ==================== MONTHLY PROGRESS REPORTS COCKPIT ====================

function loadAdminMonthlyReports() {
  var pendingList = document.getElementById('admin-pending-reports-list');
  var approvedList = document.getElementById('admin-approved-reports-list');
  var pendingBadge = document.getElementById('admin-pending-reports-count');
  var navBadge = document.getElementById('nav-reports-badge');
  if (!pendingList || typeof MonthlyReportEngine === 'undefined') return;

  var reports = MonthlyReportEngine.getReports();
  var pending = reports.filter(function(r) { return r.status === 'pending_admin_approval'; });
  var approved = reports.filter(function(r) { return r.status === 'approved' || r.status === 'sent_to_parent'; });

  if (pendingBadge) pendingBadge.textContent = pending.length + ' Pending';
  if (navBadge) {
    navBadge.textContent = pending.length;
    navBadge.classList.toggle('hidden', pending.length === 0);
  }

  if (!pending.length) {
    pendingList.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">No reports awaiting Director approval.</p>';
  } else {
    pendingList.innerHTML = pending.map(function(r) {
      return '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-orange-300 transition-all">' +
        '<div>' +
          '<div class="flex items-center gap-2 mb-1 flex-wrap">' +
            '<span class="text-sm font-extrabold text-slate-900">' + r.studentName + '</span>' +
            '<span class="text-xs text-slate-500 font-semibold">&bull; ' + r.course + '</span>' +
            '<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">' + r.month + '</span>' +
          '</div>' +
          '<p class="text-xs text-slate-500">Tutor: <strong class="text-slate-700">' + r.tutorName + '</strong> &bull; Submitted: ' + new Date(r.submittedAt).toLocaleDateString('en-GB') + '</p>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0">' +
          '<button type="button" onclick="AdminEngine.openReviewModal(\\'' + r.id + '\\')" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">' +
            '<i data-lucide="eye" class="w-3.5 h-3.5"></i> Inspect Report' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  if (approvedList) {
    if (!approved.length) {
      approvedList.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">No approved reports archived yet.</p>';
    } else {
      approvedList.innerHTML = approved.map(function(r) {
        return '<div class="flex items-center justify-between gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">' +
          '<div>' +
            '<p class="text-xs font-bold text-slate-900">' + r.studentName + ' &bull; ' + r.month + '</p>' +
            '<p class="text-[11px] text-slate-500">Tutor: ' + r.tutorName + ' &bull; Approved: ' + (r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-GB') : 'Yes') + '</p>' +
          '</div>' +
          '<button type="button" onclick="MonthlyReportEngine.openReportPDF(\\'' + r.id + '\\')" class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">' +
            '<i data-lucide="printer" class="w-3.5 h-3.5"></i> View PDF' +
          '</button>' +
        '</div>';
      }).join('');
    }
  }

  if (window.lucide) lucide.createIcons();
}

function openReviewModal(reportId) {
  var modal = document.getElementById('modal-admin-review-report');
  if (!modal || typeof MonthlyReportEngine === 'undefined') return;

  var r = MonthlyReportEngine.getReports().find(function(rep) { return rep.id === reportId; });
  if (!r) return;

  document.getElementById('amr-id').value = r.id;
  document.getElementById('amr-student').textContent = r.studentName + ' (' + r.course + ')';
  document.getElementById('amr-tutor').textContent = r.tutorName + ' (' + r.tutorEmail + ')';
  document.getElementById('amr-month').textContent = r.month;

  document.getElementById('amr-strengths').textContent = r.shiningHighlights || 'None specified.';
  document.getElementById('amr-growth').textContent = r.growthAreas || 'None specified.';

  var woohooContainer = document.getElementById('amr-woohoo');
  if (r.woohooMoments && r.woohooMoments.length) {
    woohooContainer.innerHTML = r.woohooMoments.map(function(m) {
      return '<div class="mb-1.5 last:mb-0"><strong>&bull; ' + (m.topic || 'Moment') + ':</strong> ' + (m.moment || '') + '</div>';
    }).join('');
  } else {
    woohooContainer.textContent = 'None logged.';
  }

  var projContainer = document.getElementById('amr-projects');
  if (r.projectLinks && r.projectLinks.length) {
    projContainer.innerHTML = r.projectLinks.map(function(p) {
      return '<div><strong>' + p.title + ':</strong> <a href="' + p.url + '" target="_blank" class="text-blue-600 underline font-mono">' + p.url + '</a></div>';
    }).join('');
  } else {
    projContainer.textContent = 'No project links included.';
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function closeReviewModal() {
  var modal = document.getElementById('modal-admin-review-report');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function promptRejectReport() {
  var id = document.getElementById('amr-id').value;
  var feedback = prompt('Enter revision comments for the tutor explaining what needs adjustment:');
  if (!feedback) return;

  if (typeof MonthlyReportEngine !== 'undefined') {
    MonthlyReportEngine.rejectReport(id, feedback);
    closeReviewModal();
    loadAdminMonthlyReports();
    if (typeof showToast === 'function') showToast('Report sent back to tutor for revision with comments.', 'info');
  }
}

function previewReportPDF() {
  var id = document.getElementById('amr-id').value;
  if (typeof MonthlyReportEngine !== 'undefined') {
    MonthlyReportEngine.openReportPDF(id);
  }
}

function approveAndSendReport() {
  var id = document.getElementById('amr-id').value;
  if (typeof MonthlyReportEngine !== 'undefined') {
    MonthlyReportEngine.approveReport(id);
    closeReviewModal();
    loadAdminMonthlyReports();
    if (typeof loadEmailQueue === 'function') loadEmailQueue();
    if (typeof showToast === 'function') {
      showToast('Report officially approved! Progress report sent to parent, and follow-up invoice queued.', 'success');
    }
  }
}
`;

// Append adminEngineAdditions right before return in admin-engine.js
const adminReturnMarker = 'return {';
const aLastReturn = adminEngine.lastIndexOf(adminReturnMarker);
adminEngine = adminEngine.slice(0, aLastReturn) + adminEngineAdditions + '\n' + adminEngine.slice(aLastReturn);

// Expose methods in AdminEngine return
const adminExposeMethods = `
    loadAdminMonthlyReports: loadAdminMonthlyReports,
    openReviewModal: openReviewModal,
    closeReviewModal: closeReviewModal,
    promptRejectReport: promptRejectReport,
    previewReportPDF: previewReportPDF,
    approveAndSendReport: approveAndSendReport,
`;
adminEngine = adminEngine.slice(0, aLastReturn + adminReturnMarker.length) + adminExposeMethods + adminEngine.slice(aLastReturn + adminReturnMarker.length);

// Also call loadAdminMonthlyReports in init
adminEngine = adminEngine.replace('loadEmailQueue();', 'loadEmailQueue();\n    loadAdminMonthlyReports();');

fs.writeFileSync(adminEnginePath, adminEngine, 'utf8');
console.log('Successfully wired Monthly Reports Cockpit and review handlers into admin-engine.js!');
