/**
 * STEMulus Tutor Dashboard Controller
 * Wires up the tutor portal interface using the DashboardEngine state
 */

const TutorEngine = (function() {
    let currentTutor = null;

    function init() {
        checkAuth();
    }

    function checkAuth() {
        currentTutor = DashboardEngine.getSession();
        
        if (!currentTutor || currentTutor.role !== 'tutor') {
            showLoginOverlay();
        } else {
            hideLoginOverlay();
            renderDashboard();
        }
    }

    function showLoginOverlay() {
        let loginOverlay = document.getElementById('tutor-login-overlay');
        if (!loginOverlay) {
            loginOverlay = document.createElement('div');
            loginOverlay.id = 'tutor-login-overlay';
            loginOverlay.className = 'fixed inset-0 bg-[#0c1322] z-50 flex items-center justify-center p-4';
            loginOverlay.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-2xl text-center space-y-6">
                    <div>
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="graduation-cap" class="w-8 h-8 text-purple-600"></i>
                        </div>
                        <h2 class="text-2xl font-nunito font-bold text-gray-800">Tutor Portal Login</h2>
                        <p class="text-sm text-gray-500 mt-1">Manage your sessions and write student reports</p>
                    </div>

                    <form id="tutor-login-form" class="space-y-4 text-left">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
                            <input type="email" id="tutor-email" required value="tutor@stemulus.com"
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Password</label>
                            <input type="password" id="tutor-password" required value="tutor123"
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors">
                        </div>
                        <div id="tutor-login-err" class="hidden text-red-500 text-xs py-2 bg-red-50 rounded-lg text-center font-medium"></div>
                        
                        <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/25">
                            Login as Tutor
                        </button>
                    </form>

                    <div class="border-t border-gray-100 pt-4 text-xs text-gray-400">
                        Demo Account Email: <span class="font-mono text-gray-600">tutor@stemulus.com</span><br>Password: <span class="font-mono text-gray-600">tutor123</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loginOverlay);
            if (window.lucide) lucide.createIcons();

            document.getElementById('tutor-login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('tutor-email').value;
                const password = document.getElementById('tutor-password').value;
                const res = DashboardEngine.login(email, password);
                if (res.success && res.user.role === 'tutor') {
                    loginOverlay.remove();
                    currentTutor = res.user;
                    renderDashboard();
                } else {
                    const errEl = document.getElementById('tutor-login-err');
                    errEl.textContent = res.message || "Access denied. Not a tutor account.";
                    errEl.classList.remove('hidden');
                }
            });
        }
    }

    function hideLoginOverlay() {
        const loginOverlay = document.getElementById('tutor-login-overlay');
        if (loginOverlay) loginOverlay.remove();
    }

    function renderDashboard() {
        // Remove loading screen
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }

        // Set tutor details
        const nameEl = document.getElementById('tutor-name');
        if (nameEl) nameEl.textContent = currentTutor.name || "Tutor";
        
        const avatarEl = document.getElementById('avatar-initials');
        if (avatarEl) avatarEl.textContent = (currentTutor.name || "T")[0].toUpperCase();

        // Wire logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                DashboardEngine.logout();
                window.location.reload();
            });
        }

        // Load content
        renderStats();
        renderSchedule();
        injectReportModal();
    }

    function renderStats() {
        const schedules = DashboardEngine.getSchedules().filter(s => s.mentor === currentTutor.name && s.attendanceStatus === 'pending');
        const students = DashboardEngine.getStudents().filter(s => s.tutorName === currentTutor.name);
        
        // Find stats text blocks
        const statsCards = document.querySelectorAll('main div.grid-cols-1 p.text-3xl');
        if (statsCards.length >= 3) {
            statsCards[0].textContent = schedules.length; // Upcoming Classes
            statsCards[1].textContent = students.length; // Active Students
            statsCards[2].textContent = (students.length * 8) + "h"; // teaching hours (approx)
        }
    }

    function renderSchedule() {
        const listContainer = document.getElementById('schedule-list');
        if (!listContainer) return;

        const schedules = DashboardEngine.getSchedules().filter(s => s.mentor === currentTutor.name);

        if (schedules.length === 0) {
            listContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500">
                    <p>No classes scheduled in your calendar.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = schedules.map(s => {
            const dateFormatted = new Date(s.date).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });

            const attendanceBadge = s.attendanceStatus === 'pending'
                ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Scheduled</span>`
                : (s.attendanceStatus === 'present'
                    ? `<span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Present</span>`
                    : `<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Absent</span>`);

            const actionBtn = s.attendanceStatus === 'pending'
                ? `<button onclick="TutorEngine.openReportModal('${s.id}')"
                        class="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md">
                        Log Attendance & Report
                   </button>`
                : `<span class="text-xs text-gray-400 font-medium">Logged</span>`;

            return `
                <div class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                            <i data-lucide="video" class="w-5 h-5 text-purple-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-800">${s.course} session for <strong class="text-indigo-600">${s.studentName}</strong></p>
                            <div class="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
                                <span>${dateFormatted}</span>
                                <span>•</span>
                                <span>${s.time} (${s.duration} mins)</span>
                                <span>•</span>
                                ${attendanceBadge}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <a href="${s.link}" target="_blank" rel="noopener noreferrer" 
                            class="border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                            <i data-lucide="external-link" class="w-3 h-3"></i> Zoom
                        </a>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function openReportModal(scheduleId) {
        const db = DashboardEngine.getSchedules();
        const session = db.find(s => s.id === scheduleId);
        if (!session) return;

        const modal = document.getElementById('tutor-report-modal');
        if (modal) {
            document.getElementById('tutor-schedule-id').value = session.id;
            document.getElementById('tutor-student-id').value = session.studentId;
            document.getElementById('tutor-student-name').textContent = session.studentName;
            document.getElementById('tutor-course-name').textContent = session.course;
            modal.classList.remove('hidden');
        }
    }

    function closeReportModal() {
        const modal = document.getElementById('tutor-report-modal');
        if (modal) modal.classList.add('hidden');
    }

    function submitReportForm(e) {
        e.preventDefault();
        const scheduleId = document.getElementById('tutor-schedule-id').value;
        const studentId = document.getElementById('tutor-student-id').value;
        const status = document.getElementById('tutor-attendance-status').value;
        const module = document.getElementById('tutor-module').value;
        const grade = document.getElementById('tutor-grade').value;
        const feedback = document.getElementById('tutor-feedback').value;

        // Mark attendance in schedules
        DashboardEngine.updateSchedule(scheduleId, { attendanceStatus: status });

        // If present, write a progress report
        if (status === 'present') {
            const schedules = DashboardEngine.getSchedules();
            const session = schedules.find(s => s.id === scheduleId);
            
            DashboardEngine.addReport({
                studentId,
                studentName: session.studentName,
                program: session.course,
                date: new Date().toISOString().split('T')[0],
                tutorName: currentTutor.name,
                module,
                grade,
                feedback
            });
        }

        alert("Attendance and report submitted successfully!");
        closeReportModal();
        renderDashboard();
    }

    function injectReportModal() {
        if (document.getElementById('tutor-report-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'tutor-report-modal';
        modal.className = 'fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 class="text-lg font-nunito font-bold text-gray-800">Submit Session Report</h3>
                    <button onclick="TutorEngine.closeReportModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <form id="tutor-report-form" class="space-y-4">
                    <input type="hidden" id="tutor-schedule-id">
                    <input type="hidden" id="tutor-student-id">
                    
                    <div class="flex justify-between border-b border-gray-50 pb-2">
                        <div>
                            <span class="text-xs text-gray-400 uppercase">Student</span>
                            <p id="tutor-student-name" class="font-bold text-gray-800"></p>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-gray-400 uppercase">Course</span>
                            <p id="tutor-course-name" class="font-bold text-gray-800"></p>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attendance Status *</label>
                        <select id="tutor-attendance-status" required onchange="const fields=document.getElementById('tutor-academic-fields'); if(this.value==='present') fields.classList.remove('hidden'); else fields.classList.add('hidden');"
                            class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors">
                            <option value="present">Present (Write Report)</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>

                    <div id="tutor-academic-fields" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Module / Topic *</label>
                                <input type="text" id="tutor-module" value="Loops & Logic" required
                                    class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grade *</label>
                                <select id="tutor-grade" required
                                    class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors">
                                    <option value="A+">A+</option>
                                    <option value="A" selected>A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tutor Feedback & Next Steps *</label>
                            <textarea id="tutor-feedback" required rows="4" placeholder="Detail how the student performed, what they built, and what they need to work on next..."
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors resize-none"></textarea>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                        Submit Report & Mark Completed
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('tutor-report-form').addEventListener('submit', submitReportForm);
    }

    return {
        init,
        openReportModal,
        closeReportModal
    };
})();

document.addEventListener('DOMContentLoaded', TutorEngine.init);
window.addEventListener('stemulusDbUpdated', TutorEngine.init);
