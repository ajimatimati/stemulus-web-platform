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
        const hasFirebase = (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore);

        if (hasFirebase) {
            // Use Firebase Auth's real-time state listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    const session = DashboardEngine.getSession();
                    if (session && (session.role === 'tutor' || session.role === 'admin') && session.email.toLowerCase() === user.email.toLowerCase()) {
                        currentTutor = session;
                        hideLoginOverlay();
                        renderDashboard();
                    } else {
                        // Fetch role from Firestore
                        try {
                            const userDoc = await firebase.firestore().collection('users').doc(user.email.toLowerCase()).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                if (userData.role === 'tutor' || userData.role === 'admin') {
                                    sessionStorage.setItem("stemulus_session", JSON.stringify(userData));
                                    currentTutor = userData;
                                    hideLoginOverlay();
                                    renderDashboard();
                                } else {
                                    console.warn("[Tutor Engine] User is logged in but role is:", userData.role);
                                    showLoginOverlay();
                                }
                            } else {
                                window.location.href = 'parent-login.html?role=tutor&error=account_not_found';
                            }
                        } catch (e) {
                            console.error("[Tutor Engine] Firestore check failed:", e);
                            if (session && (session.role === 'tutor' || session.role === 'admin')) {
                                currentTutor = session;
                                hideLoginOverlay();
                                renderDashboard();
                            } else {
                                showLoginOverlay();
                            }
                        }
                    }
                } else {
                    const localSession = DashboardEngine.getSession();
                    if (localSession && (localSession.role === 'tutor' || localSession.role === 'admin')) {
                        currentTutor = localSession;
                        hideLoginOverlay();
                        renderDashboard();
                    } else {
                        showLoginOverlay();
                    }
                }
            });
        } else {
            currentTutor = DashboardEngine.getSession();
            if (!currentTutor || (currentTutor.role !== 'tutor' && currentTutor.role !== 'admin')) {
                showLoginOverlay();
            } else {
                hideLoginOverlay();
                renderDashboard();
            }
        }
    }

    function showLoginOverlay() {
        window.location.href = 'parent-login.html?role=tutor';
    }

    function hideLoginOverlay() {
        const loginOverlay = document.getElementById('tutor-login-overlay');
        if (loginOverlay) loginOverlay.remove();
    }

    function renderDashboard() {
        if (!currentTutor) return;
        document.documentElement.style.visibility = 'visible';
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

        var sidebarName = document.getElementById('sidebar-tutor-name');
        if (sidebarName) sidebarName.textContent = currentTutor.name || 'Tutor';
        var sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) sidebarAvatar.textContent = ((currentTutor.name || 'T').charAt(0)).toUpperCase();
        var heroName = document.getElementById('hero-tutor-name');
        if (heroName) heroName.textContent = (currentTutor.name || 'Mentor').split(' ')[0];

        // Wire logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                DashboardEngine.logout();
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    firebase.auth().signOut().catch(function(){}).then(function(){ window.location.href = 'parent-login.html'; });
                } else { window.location.href = 'parent-login.html'; }
            };
        }

        // Load content
        renderOverdueAttendanceAlert();
        renderStats();
        renderSchedule();
        renderNotifications();
        injectReportModal();
    }

    function renderStats() {
        if (!currentTutor) return;
        const tutorNameLower = (currentTutor.name || '').toLowerCase().trim();
        const tutorEmailLower = (currentTutor.email || '').toLowerCase().trim();

        const schedules = DashboardEngine.getSchedules().filter(s => {
            const m = (s.mentor || '').toLowerCase().trim();
            const e = (s.tutorEmail || '').toLowerCase().trim();
            const matchesTutor = (tutorNameLower && (m === tutorNameLower || m.includes(tutorNameLower) || tutorNameLower.includes(m))) ||
                                (tutorEmailLower && e === tutorEmailLower);
            return matchesTutor && s.attendanceStatus === 'pending';
        });
        const students = DashboardEngine.getTutorStudents ? DashboardEngine.getTutorStudents(currentTutor.email) : [];

        const upcomingEl = document.getElementById('stat-upcoming');
        const studentsEl = document.getElementById('stat-students');
        if (upcomingEl) upcomingEl.textContent = schedules.length;
        if (studentsEl) studentsEl.textContent = students.length;
        const kpiUpcoming = document.getElementById('kpi-upcoming');
        if (kpiUpcoming) kpiUpcoming.textContent = schedules.length;
        const kpiStudents = document.getElementById('kpi-students');
        if (kpiStudents) kpiStudents.textContent = students.length;

        // Teaching hours: calculate from approved attendance records and approved schedules
        var db = DashboardEngine.getDB ? DashboardEngine.getDB() : {};

        var approvedAttendance = (db.attendanceRecords || []).filter(function(r) {
            var mName = (r.tutorName || r.mentor || '').toLowerCase();
            var mEmail = (r.tutorEmail || '').toLowerCase();
            var isTutor = (tutorNameLower && mName === tutorNameLower) || (tutorEmailLower && mEmail === tutorEmailLower);
            return isTutor && (r.status === 'approved' || r.status === 'present');
        });

        var allSchedules = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
        var approvedSchedules = allSchedules.filter(function(s) {
            var mName = (s.mentor || '').toLowerCase();
            var mEmail = (s.tutorEmail || '').toLowerCase();
            var isTutor = (tutorNameLower && mName === tutorNameLower) || (tutorEmailLower && mEmail === tutorEmailLower);
            return isTutor && (s.attendanceStatus === 'present' || s.status === 'approved');
        });

        var approvedSessionMinutes = 0;
        var countedScheduleIds = {};

        approvedAttendance.forEach(function(r) {
            if (r.scheduleId) countedScheduleIds[r.scheduleId] = true;
            approvedSessionMinutes += (parseInt(r.duration) || 60);
        });

        approvedSchedules.forEach(function(s) {
            if (!countedScheduleIds[s.id]) {
                approvedSessionMinutes += (parseInt(s.duration) || 60);
            }
        });

        var hoursVal = Math.round((approvedSessionMinutes / 60) * 10) / 10;
        var hoursDisplay = (hoursVal % 1 === 0) ? (hoursVal + 'h') : (hoursVal.toFixed(1) + 'h');
        var hoursNum = (hoursVal % 1 === 0) ? hoursVal : hoursVal.toFixed(1);

        var hoursEl = document.getElementById('stat-hours'); 
        if (hoursEl) hoursEl.textContent = hoursDisplay;
        var kh = document.getElementById('kpi-hours');
        if (kh) kh.textContent = hoursNum;
    }

    function renderSchedule() {
        if (!currentTutor) return;
        const listContainer = document.getElementById('schedule-list');
        if (!listContainer) return;

        const tutorNameLower = (currentTutor.name || '').toLowerCase().trim();
        const tutorEmailLower = (currentTutor.email || '').toLowerCase().trim();

        const schedules = DashboardEngine.getSchedules().filter(s => {
            const m = (s.mentor || '').toLowerCase().trim();
            const e = (s.tutorEmail || '').toLowerCase().trim();
            const matchesTutor = (tutorNameLower && (m === tutorNameLower || m.includes(tutorNameLower) || tutorNameLower.includes(m))) ||
                                (tutorEmailLower && e === tutorEmailLower);
            return matchesTutor && s.attendanceStatus !== 'cancelled';
        });

        if (schedules.length === 0) {
            listContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500">
                    <p>No upcoming classes scheduled in your calendar.</p>
                </div>
            `;
            return;
        }

        // Sort upcoming first (by date and time)
        schedules.sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return timeA - timeB;
        });

        listContainer.innerHTML = schedules.map(s => {
            const dateObj = new Date(s.date + 'T12:00:00');
            const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            }) : s.date;

            const isToday = s.date === new Date().toISOString().split('T')[0];

            const attendanceBadge = s.attendanceStatus === 'pending'
                ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">${isToday ? 'Today • Scheduled' : 'Scheduled'}</span>`
                : (s.attendanceStatus === 'present'
                    ? `<span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Present</span>`
                    : `<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Absent</span>`);

            const actionBtn = s.attendanceStatus === 'pending'
                ? `<a href="tutor-attendance-create.html?scheduleId=${s.id}&studentId=${s.studentId || ''}&date=${s.date || ''}&course=${encodeURIComponent(s.course || '')}"
                        class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 no-underline">
                        <i data-lucide="clipboard-check" style="width:14px;height:14px;"></i> Log Class & Attendance
                   </a>`
                : `<span class="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Logged</span>`;

            return `
                <div class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <i data-lucide="video" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-800">${s.course} session for <strong class="text-indigo-600">${s.studentName}</strong></p>
                            <div class="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
                                <span>${dateFormatted}</span>
                                <span>•</span>
                                <span>${s.time} (${s.duration || 60} mins)</span>
                                <span>•</span>
                                ${attendanceBadge}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <a href="${s.link || 'https://meet.google.com'}" target="_blank" rel="noopener noreferrer" 
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

    function renderOverdueAttendanceAlert() {
        if (!currentTutor) return;
        const bannerContainer = document.getElementById('overdue-attendance-banner');
        if (!bannerContainer) return;

        const overdue = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getOverdueAttendance)
            ? DashboardEngine.getOverdueAttendance(currentTutor.email)
            : [];

        if (!overdue.length) {
            bannerContainer.innerHTML = '';
            bannerContainer.style.display = 'none';
            return;
        }

        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
            <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
                <div class="flex items-start gap-3.5">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-black text-lg">
                        ⚠️
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-bold text-amber-900">Action Required: Compulsory Class Attendance</h3>
                            <span class="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">${overdue.length} Unlogged</span>
                        </div>
                        <p class="text-xs text-amber-800 mt-0.5 leading-relaxed">
                            You have <strong>${overdue.length} completed session${overdue.length > 1 ? 's' : ''}</strong> pending attendance submission. STEMulus requires every session log to be filed for admin verification and parent updates.
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                    ${overdue.slice(0, 2).map(s => `
                        <a href="tutor-attendance-create.html?scheduleId=${s.id}&studentId=${s.studentId || ''}&date=${s.date || ''}&course=${encodeURIComponent(s.course || '')}"
                           class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 no-underline">
                            Log ${s.studentName.split(' ')[0]} (${s.date})
                        </a>
                    `).join('')}
                    ${overdue.length > 2 ? `<a href="tutor-attendance.html" class="text-xs font-bold text-amber-800 underline">View all (${overdue.length})</a>` : ''}
                </div>
            </div>
        `;
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
            modal.style.display = 'flex';
        }
    }

    function closeReportModal() {
        const modal = document.getElementById('tutor-report-modal');
        if (modal) modal.style.display = 'none';
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
        } else if (status === 'absent') {
            var absSessions = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
            var absSession = absSessions.find(function(s) { return s.id === scheduleId; });
            var sessionDate = absSession ? absSession.date : '';
            var studentName = absSession ? absSession.studentName : '';
            var absStudent = (DashboardEngine.getStudents ? DashboardEngine.getStudents() : []).find(function(s) { return s.id === scheduleId || s.firstName === studentName; });
            if (absStudent && absStudent.parentEmail && DashboardEngine.addNotification) {
                DashboardEngine.addNotification({ userEmail: absStudent.parentEmail, title: 'Class Missed', message: (absStudent.firstName || 'Your child') + ' missed their ' + (sessionDate || 'recent') + ' session. Please contact the admin to reschedule.', timestamp: new Date().toISOString(), read: false });
            }
        }

        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 z-[9999] bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-xl text-sm font-semibold animate-fadeIn flex items-center gap-2';
        successMsg.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Attendance and report submitted!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3500);

        closeReportModal();
        renderDashboard();
    }

    function renderNotifications() {
        if (!currentTutor) return;
        const container = document.getElementById('tutor-notifications-container');
        if (!container) return;

        const notifs = DashboardEngine.getNotifications(currentTutor.email);
        if (notifs.length === 0) {
            container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No notifications yet.</p>`;
            return;
        }

        container.innerHTML = notifs.map(n => {
            const timeFormatted = new Date(n.timestamp).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            const unreadDot = !n.read ? `<span class="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>` : '';
            return `
                <div class="flex gap-3 items-start p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                    ${unreadDot}
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-gray-800">${n.title}</p>
                        <p class="text-[11px] text-gray-500 mt-0.5 leading-relaxed">${n.message}</p>
                        <span class="text-[9px] text-slate-400 font-medium block mt-1">${timeFormatted}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Mark read
        DashboardEngine.markNotificationsRead(currentTutor.email);
    }

    function injectReportModal() {
        if (document.getElementById('tutor-report-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'tutor-report-modal';
        modal.style.display = 'none';
        modal.className = 'fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 class="text-lg font-nunito font-bold text-gray-800">Submit Session Report</h3>
                    <button type="button" onclick="TutorEngine.closeReportModal()" class="text-gray-400 hover:text-gray-650 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <form id="tutor-report-form" class="space-y-4">
                    <input type="hidden" id="tutor-schedule-id">
                    <input type="hidden" id="tutor-student-id">
                    
                    <div class="flex justify-between border-b border-slate-50 pb-2">
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
                        <select id="tutor-attendance-status" required onchange="const fields=document.getElementById('tutor-academic-fields'); if(this.value==='present') fields.classList.remove('hidden'); else fields.classList.add('hidden'); var acFields = document.getElementById('tutor-academic-fields'); if (acFields) { var isAbsent = this.value !== 'present'; acFields.querySelectorAll('input,select,textarea').forEach(function(el) { el.disabled = isAbsent; }); }"
                            class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            <option value="present">Present (Write Report)</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>

                    <div id="tutor-academic-fields" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Module / Topic *</label>
                                <input type="text" id="tutor-module" required
                                    class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grade *</label>
                                <select id="tutor-grade" required
                                    class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors">
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
                                class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                        Submit Report & Mark Completed
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('tutor-report-form').addEventListener('submit', submitReportForm);
    }

    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const TIME_SLOTS = [
        { id: 'morning', label: 'Morning' },
        { id: 'afternoon', label: 'Afternoon' },
        { id: 'evening', label: 'Evening' },
        { id: 'night', label: 'Night' }
    ];

    function openProfileModal() {
        const modal = document.getElementById('tutor-profile-modal');
        if (!modal) return;

        const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
        const session = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSession) ? DashboardEngine.getSession() : currentTutor;
        const email = session ? (session.email || '').toLowerCase() : '';

        // Find tutor record
        let tutor = null;
        if (db && db.tutors) {
            tutor = db.tutors.find(t => t.email && t.email.toLowerCase() === email);
        }
        if (!tutor) tutor = session || {};

        const nameInput = document.getElementById('tp-name');
        const emailInput = document.getElementById('tp-email');
        const phoneInput = document.getElementById('tp-phone');
        const subjectsInput = document.getElementById('tp-subjects');
        const bioInput = document.getElementById('tp-bio');

        if (nameInput) nameInput.value = tutor.name || '';
        if (emailInput) emailInput.value = tutor.email || email || '';
        if (phoneInput) phoneInput.value = tutor.phone || tutor.whatsapp || '';
        if (subjectsInput) {
            subjectsInput.value = Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : (tutor.subjects || '');
        }
        if (bioInput) bioInput.value = tutor.bio || '';

        // Render Availability Matrix
        const matrixTbody = document.getElementById('tp-matrix-tbody');
        if (matrixTbody) {
            const avail = tutor.availability || {};
            matrixTbody.innerHTML = DAYS_OF_WEEK.map(day => {
                const dayKey = day.toLowerCase();
                const daySlots = avail[dayKey] || [];
                return `
                    <tr class="hover:bg-slate-100/50 transition-colors">
                        <td class="py-2.5 px-3 text-left font-bold text-slate-700">${day}</td>
                        ${TIME_SLOTS.map(slot => {
                            const isChecked = Array.isArray(daySlots) && daySlots.includes(slot.id);
                            return `
                                <td class="py-2.5 px-1">
                                    <label class="inline-flex items-center justify-center p-1 cursor-pointer">
                                        <input type="checkbox" name="avail-${dayKey}" value="${slot.id}" ${isChecked ? 'checked' : ''}
                                            class="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-slate-300">
                                    </label>
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `;
            }).join('');
        }

        modal.classList.remove('hidden');
    }

    function closeProfileModal() {
        const modal = document.getElementById('tutor-profile-modal');
        if (modal) modal.classList.add('hidden');
    }

    function saveProfile(e) {
        if (e && e.preventDefault) e.preventDefault();

        const name = (document.getElementById('tp-name').value || '').trim();
        const email = (document.getElementById('tp-email').value || '').trim().toLowerCase();
        const phone = (document.getElementById('tp-phone').value || '').trim();
        const subjectsStr = (document.getElementById('tp-subjects').value || '').trim();
        const bio = (document.getElementById('tp-bio').value || '').trim();
        const subjects = subjectsStr ? subjectsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Build availability matrix object
        const availability = {};
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            const checkedBoxes = Array.from(document.querySelectorAll(`input[name="avail-${dayKey}"]:checked`)).map(cb => cb.value);
            availability[dayKey] = checkedBoxes;
        });

        const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
        if (db) {
            if (!db.tutors) db.tutors = [];
            let tIdx = db.tutors.findIndex(t => t.email && t.email.toLowerCase() === email);
            if (tIdx !== -1) {
                db.tutors[tIdx].name = name;
                db.tutors[tIdx].phone = phone;
                db.tutors[tIdx].subjects = subjects;
                db.tutors[tIdx].bio = bio;
                db.tutors[tIdx].availability = availability;
            } else {
                db.tutors.push({
                    name,
                    email,
                    phone,
                    subjects,
                    bio,
                    availability,
                    status: 'active'
                });
            }

            // Sync user name
            if (db.users) {
                const u = db.users.find(user => user.email && user.email.toLowerCase() === email);
                if (u) {
                    u.name = name;
                    u.phone = phone;
                }
            }

            try {
                localStorage.setItem('stemulus_db', JSON.stringify(db));
                // Update session
                const session = JSON.parse(sessionStorage.getItem('stemulus_session') || '{}');
                session.name = name;
                session.phone = phone;
                sessionStorage.setItem('stemulus_session', JSON.stringify(session));
                window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { source: 'tutor_profile_update' } }));
            } catch(err) {}
        }

        // Update UI
        const nameEl = document.getElementById('tutor-name');
        if (nameEl) nameEl.textContent = name;
        const avatarEl = document.getElementById('avatar-initials');
        if (avatarEl) avatarEl.textContent = (name || 'T')[0].toUpperCase();
        const sidebarName = document.getElementById('sidebar-tutor-name');
        if (sidebarName) sidebarName.textContent = name;

        if (typeof showToast === 'function') {
            showToast('Profile & availability matrix updated successfully!', 'success');
        } else if (typeof DashboardEngine !== 'undefined' && DashboardEngine.showToast) {
            DashboardEngine.showToast('Profile & availability matrix updated successfully!', 'success');
        }

        closeProfileModal();
    }

    return {
        init,
        renderDashboard,
        openReportModal,
        closeReportModal,
        openProfileModal,
        closeProfileModal,
        saveProfile
    };
})();

document.addEventListener('DOMContentLoaded', TutorEngine.init);
// On cloud sync: re-render data without re-running auth redirect
window.addEventListener('stemulusDbUpdated', function() {
    if (TutorEngine && typeof TutorEngine.renderDashboard === 'function') {
        TutorEngine.renderDashboard();
    }
});
