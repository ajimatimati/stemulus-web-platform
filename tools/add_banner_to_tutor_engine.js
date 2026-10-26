const fs = require('fs');
const path = require('path');

const tutorEnginePath = path.join(__dirname, '../assets/js/tutor-engine.js');
let code = fs.readFileSync(tutorEnginePath, 'utf8');

const target = '    function renderStats() {';

const bannerMethod = `    // Filter items that need active attention STRICTLY FOR THIS TUTOR ONLY (Olalekan never sees Joshua Ogba's or others' sessions)
    function renderLiveClassPresenceBanner() {
        if (!currentTutor) return;
        const bannerContainer = document.getElementById('tutor-live-class-monitor-banner');
        if (!bannerContainer || typeof ClassEscalationEngine === 'undefined') return;

        const tutorEmail = (currentTutor.email || '').toLowerCase().trim();
        const tutorAltEmail = (currentTutor.altEmail || '').toLowerCase().trim();
        const tutorName = (currentTutor.name || '').toLowerCase().trim();
        const tutorFirst = tutorName ? tutorName.split(' ')[0] : '';

        const radarItems = ClassEscalationEngine.buildEscalationRadar ? ClassEscalationEngine.buildEscalationRadar() : [];
        const urgentItems = radarItems.filter(item => {
            if (!item || !item.state) return false;
            const code = item.state.code;
            const isUrgent = (
                code === 'CODER_WAITING_FOR_TUTOR' ||
                code === 'TUTOR_WAITING_FOR_CODER' ||
                code === 'STUDENT_ABSENT_ALERT' ||
                code === 'TUTOR_DELAY_CRITICAL' ||
                code === 'CRITICAL_ESCALATION' ||
                code === 'IN_SESSION'
            );
            if (!isUrgent) return false;

            const s = item.schedule || {};
            const contacts = item.contacts || (ClassEscalationEngine.resolveSessionContacts ? ClassEscalationEngine.resolveSessionContacts(s) : {});
            const sEmail = (contacts.tutorEmail || s.tutorEmail || '').toLowerCase().trim();
            const sName = (contacts.tutorName || s.mentor || s.tutorName || '').toLowerCase().trim();

            const isMyClass = (tutorEmail && sEmail === tutorEmail) ||
                              (tutorAltEmail && sEmail === tutorAltEmail) ||
                              (tutorName && sName === tutorName) ||
                              (tutorFirst && sName.includes(tutorFirst));

            let matchStudent = false;
            if (!isMyClass && typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getTutorStudents === 'function') {
                const myStudents = DashboardEngine.getTutorStudents(tutorEmail) || [];
                const schedStudentId = s.studentId || contacts.studentId;
                const schedStudentName = (contacts.studentName || s.studentName || '').toLowerCase().trim();
                matchStudent = myStudents.some(st => (schedStudentId && st.id === schedStudentId) ||
                    (((st.firstName || '') + ' ' + (st.lastName || '')).toLowerCase().trim() === schedStudentName));
            }

            return isMyClass || matchStudent;
        });

        if (!urgentItems.length) {
            bannerContainer.style.display = 'none';
            bannerContainer.innerHTML = '';
            return;
        }

        const topItem = urgentItems[0];
        const studentName = topItem.contacts.studentName || 'Student';
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = \`
            <div class="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-yellow-500/15 border border-orange-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 font-bold">
                  <i data-lucide="radio" class="w-4 h-4 animate-pulse"></i>
                </div>
                <div>
                  <h4 class="text-xs font-extrabold text-orange-950">Active Class Presence: \${studentName}</h4>
                  <p class="text-[11px] text-orange-800 line-clamp-1">\${topItem.state.label || 'Live session monitoring active.'}</p>
                </div>
              </div>
              <a href="\${topItem.schedule.meetLink || '#'}" target="_blank" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition-colors shrink-0 shadow-xs inline-flex items-center gap-1.5">
                Join Classroom &rarr;
              </a>
            </div>
        \`;
        if (window.lucide) lucide.createIcons();
    }

`;

if (!code.includes('STRICTLY FOR THIS TUTOR ONLY')) {
    code = code.replace(target, bannerMethod + target);
}

// Expose in return object
if (!code.includes('renderLiveClassPresenceBanner,')) {
    code = code.replace('renderMonthlyReportsList,', 'renderLiveClassPresenceBanner,\r\n        renderMonthlyReportsList,');
}

// Call in renderDashboard
if (!code.includes('renderLiveClassPresenceBanner();')) {
    code = code.replace('renderNotifications();', 'renderNotifications();\r\n        renderLiveClassPresenceBanner();');
}

fs.writeFileSync(tutorEnginePath, code, 'utf8');
console.log('Successfully inserted renderLiveClassPresenceBanner with STRICTLY FOR THIS TUTOR ONLY filter into tutor-engine.js!');
