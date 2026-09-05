/**
 * STEMulus Parent Dashboard Controller
 * Wires up the parent dashboard interface using the DashboardEngine state
 */

const ParentEngine = (function() {
    let currentParent = null;

    function init() {
        // Load dependencies
        checkAuth();
    }

    function checkAuth() {
        const hasFirebase = (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore);

        if (hasFirebase) {
            // Use Firebase Auth's real-time state listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    const session = DashboardEngine.getSession();
                    if (session && (session.role === 'parent' || session.role === 'admin') && session.email.toLowerCase() === user.email.toLowerCase()) {
                        currentParent = session;
                        hideLoginOverlay();
                        renderDashboard();
                    } else {
                        // Fetch role from Firestore
                        try {
                            const userDoc = await firebase.firestore().collection('users').doc(user.email.toLowerCase()).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                if (userData.role === 'parent' || userData.role === 'admin') {
                                    sessionStorage.setItem("stemulus_session", JSON.stringify(userData));
                                    currentParent = userData;
                                    hideLoginOverlay();
                                    renderDashboard();
                                } else {
                                    console.warn("[Parent Engine] User is logged in but role is:", userData.role);
                                    showLoginOverlay();
                                }
                            } else {
                                // User exists in Firebase Auth but no Firestore record — create one and prompt password reset
                                await firebase.firestore().collection('users').doc(user.email.toLowerCase()).set({
                                    email: user.email,
                                    role: 'parent',
                                    name: user.displayName || 'Parent'
                                });
                                const seedData = await DashboardEngine.login(user.email, null);
                                if (seedData && seedData.success && (seedData.user.role === 'parent' || seedData.user.role === 'admin')) {
                                    currentParent = seedData.user;
                                    hideLoginOverlay();
                                    renderDashboard();
                                } else {
                                    showLoginOverlay();
                                }
                            }
                        } catch (e) {
                            console.error("[Parent Engine] Firestore check failed:", e);
                            // Fallback to local session if network failed
                            if (session && (session.role === 'parent' || session.role === 'admin')) {
                                currentParent = session;
                                hideLoginOverlay();
                                renderDashboard();
                            } else {
                                showLoginOverlay();
                            }
                        }
                    }
                } else {
                    // No Firebase Auth user - check if local mock session exists
                    const localSession = DashboardEngine.getSession();
                    if (localSession && (localSession.role === 'parent' || localSession.role === 'admin')) {
                        currentParent = localSession;
                        hideLoginOverlay();
                        renderDashboard();
                    } else {
                        showLoginOverlay();
                    }
                }
            });
        } else {
            // Local fallback
            currentParent = DashboardEngine.getSession();
            if (!currentParent || (currentParent.role !== 'parent' && currentParent.role !== 'admin')) {
                showLoginOverlay();
            } else {
                hideLoginOverlay();
                renderDashboard();
            }
        }
    }

    function showLoginOverlay() {
        window.location.href = 'parent-login.html?role=parent';
    }

    function hideLoginOverlay() {
        const loginOverlay = document.getElementById('parent-login-overlay');
        if (loginOverlay) loginOverlay.remove();
    }

    function renderDashboard() {
        if (!currentParent) return;
        document.documentElement.style.visibility = 'visible';
        // Remove loading screen
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }

        // Set parent name in header
        const nameEl = document.getElementById('user-name');
        if (nameEl) nameEl.textContent = currentParent.name || "Parent";

        var sidebarName = document.getElementById('sidebar-user-name');
        if (sidebarName && currentParent && currentParent.name) sidebarName.textContent = currentParent.name;

        var heroName = document.getElementById('hero-user-name');
        if (heroName && currentParent && currentParent.name) heroName.textContent = currentParent.name.split(' ')[0];

        // Wire logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                DashboardEngine.logout();
                if (typeof firebase !== 'undefined' && firebase.auth) { firebase.auth().signOut().catch(function(){}).then(function(){ window.location.href = 'parent-login.html'; }); }
                else { window.location.href = 'parent-login.html'; }
            };
        }

        // Load content
        renderOnboardingPanel();
        renderChildren();
        renderUpcomingClasses();
        renderNotifications();
        injectModals();
    }

    function renderOnboardingPanel() {
        const onboarding = DashboardEngine.getOnboarding(currentParent.email);
        const main = document.querySelector('[id="main-content"]') || document.querySelector('.content-area') || document.querySelector('.lg\\:ml-64') || document.body;
        
        // Remove existing onboarding section if any
        const existing = document.getElementById('onboarding-panel');
        if (existing) existing.remove();

        if (onboarding.completed) return;

        const panel = document.createElement('section');
        panel.id = 'onboarding-panel';
        panel.className = 'mb-8 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/20 rounded-2xl p-6 relative overflow-hidden';
        
        const stepsHTML = onboarding.steps.map(step => `
            <div class="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                <button onclick="ParentEngine.completeStep('${step.id}')" 
                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${step.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500 bg-white'}"
                    ${step.done ? 'disabled' : ''}>
                    ${step.done ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                </button>
                <span class="text-sm font-semibold ${step.done ? 'line-through text-gray-400' : 'text-gray-700'}">${step.label}</span>
            </div>
        `).join('');

        panel.innerHTML = `
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="space-y-2">
                    <span class="inline-block bg-blue-100 text-blue-700 text-xs font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider">Onboarding Wizard</span>
                    <h3 class="text-xl font-bold font-nunito text-gray-800">Welcome to STEMulus! Complete these quick steps to get started:</h3>
                    <p class="text-sm text-gray-500">Setting up notifications allows you to receive automated birthday alerts and class link reminders.</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 md:max-w-xl w-full">
                    ${stepsHTML}
                </div>
            </div>
            <div class="absolute -right-10 -bottom-10 opacity-5">
                <svg class="w-48 h-48 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
            </div>
        `;
        
        if (main) { main.insertBefore(panel, main.firstChild); } else { document.body.insertBefore(panel, document.body.firstChild); }
    }

    function completeStep(stepId) {
        DashboardEngine.completeOnboardingStep(currentParent.email, stepId);
        renderOnboardingPanel();
        renderNotifications();
    }

    function renderLatestSessionData(student) {
        var schedules = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
        var studentSessions = schedules.filter(function(s) {
            return (s.studentId === student.id || s.studentName === (student.firstName + ' ' + student.lastName)) && s.attendanceStatus === 'present' && s.tutorComment;
        }).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

        if (!studentSessions.length) return '';
        var latest = studentSessions[0];

        var stars = '';
        for (var i = 1; i <= 5; i++) {
            stars += '<span style="color:' + (i <= (latest.conceptGrasp || 0) ? '#f59e0b' : '#d1d5db') + '">&#9733;</span>';
        }

        return '<div style="background:linear-gradient(135deg,#f0f4ff,#e8f4fd);border-radius:12px;padding:1rem;margin-top:0.75rem;border-left:3px solid #6366F1;">' +
            '<p style="font-size:0.7rem;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem;">Latest Session — ' + (latest.date || '') + '</p>' +
            (latest.topic ? '<p style="font-size:0.82rem;font-weight:600;color:#1e293b;margin:0 0 0.25rem;">Topic: ' + latest.topic + '</p>' : '') +
            (latest.conceptGrasp ? '<p style="font-size:0.8rem;margin:0.25rem 0;">Concept Grasp: ' + stars + '</p>' : '') +
            (latest.tutorComment ? '<p style="font-size:0.8rem;color:#374151;margin:0.25rem 0;font-style:italic;">&ldquo;' + latest.tutorComment + '&rdquo;</p>' : '') +
            (latest.homeworkAssigned ? '<div style="background:#fff7ed;border-radius:8px;padding:0.5rem 0.75rem;margin-top:0.5rem;"><p style="font-size:0.72rem;font-weight:700;color:#ea580c;margin:0 0 0.2rem;">Homework</p><p style="font-size:0.8rem;color:#374151;margin:0;">' + latest.homeworkAssigned + '</p></div>' : '') +
            '</div>';
    }

    function renderChildren() {
        const childrenContainer = document.getElementById('children-container');
        if (!childrenContainer) return;

        const students = (currentParent.role === 'admin' && DashboardEngine.getStudents(currentParent.email).length === 0)
            ? DashboardEngine.getStudents()
            : DashboardEngine.getStudents(currentParent.email);

        if (students.length === 0) {
            childrenContainer.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div class="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="rocket" class="w-8 h-8 text-orange-500"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 font-nunito mb-1">Ready to begin?</h3>
                    <p class="text-gray-500 font-medium text-sm mb-5 max-w-sm mx-auto">Enroll your child to start tracking their coding journey, curriculum milestones, and interactive projects.</p>
                    <a href="enroll.html" class="btn-3d">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i> Enroll your first child
                    </a>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        childrenContainer.innerHTML = students.map(s => {
            // Get reports
            const reports = DashboardEngine.getReports(s.id);
            const reportHTML = reports.length > 0 
                ? `<div class="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tutor Feedback</span>
                            <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">Grade: ${reports[0].grade}</span>
                        </div>
                        <p class="text-xs text-gray-600 italic">"${reports[0].feedback}"</p>
                        <p class="text-[10px] text-gray-400 text-right">- ${reports[0].tutorName}, ${reports[0].date}</p>
                   </div>`
                : `<p class="text-xs text-gray-400 italic mt-4">No progress reports available yet.</p>`;

            // Check for official monthly academic evaluations (approved by admin & sent to parent)
            let monthlyReports = [];
            if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMonthlyReports) {
                const allMR = DashboardEngine.getMonthlyReports();
                const sNameLower = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
                monthlyReports = allMR.filter(mr => {
                    if (mr.status !== 'sent_to_parent') return false;
                    if (mr.studentId && mr.studentId === s.id) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === sNameLower) return true;
                    if (mr.studentName && mr.studentName.toLowerCase().trim() === (s.firstName || '').toLowerCase().trim()) return true;
                    return false;
                });
            }

            const officialReportHTML = monthlyReports.length > 0 ? (function() {
                const latestMR = monthlyReports[monthlyReports.length - 1];
                const periodLabel = latestMR.month 
                    ? new Date(latestMR.month + '-01').toLocaleDateString('en-GB', {month:'long', year:'numeric'}) 
                    : 'Official Evaluation';
                const gradeBadge = latestMR.overallGrade || 'A';
                return `
                    <div class="bg-gradient-to-r from-indigo-50/90 to-blue-50/80 border-2 border-indigo-200 rounded-2xl p-4 mt-4 shadow-sm space-y-3">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                    <i data-lucide="award" class="w-4 h-4"></i>
                                </span>
                                <div>
                                    <span class="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Official Academic Evaluation</span>
                                    <h4 class="font-bold text-slate-800 text-xs font-nunito">${periodLabel} Evaluation</h4>
                                </div>
                            </div>
                            <span class="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">Grade: ${gradeBadge}</span>
                        </div>
                        ${latestMR.topics ? `<p class="text-xs text-slate-600 line-clamp-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100/60 leading-relaxed"><strong>Topics:</strong> ${latestMR.topics}</p>` : ''}
                        <button type="button" onclick="ParentEngine.viewMonthlyReport('${latestMR.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md">
                            <i data-lucide="file-text" class="w-3.5 h-3.5"></i> View / Download Official PDF Report
                        </button>
                    </div>
                `;
            })() : '';

            // Get certificates
            const certs = DashboardEngine.getCertificates(s.firstName);
            const certsHTML = certs.length > 0
                ? `<div class="pt-4 border-t border-gray-100 mt-4">
                        <p class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><i data-lucide="award" class="w-4 h-4 text-emerald-500"></i> Certificates Issued</p>
                        <div class="space-y-2">
                            ${certs.map(c => `
                                <div class="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                    <div>
                                        <p class="text-xs font-bold text-emerald-800">${c.program_name}</p>
                                        <p class="text-[10px] text-emerald-600">ID: ${c.credential_id} • Issued: ${new Date(c.issue_date).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})}</p>
                                    </div>
                                    <button onclick="ParentEngine.viewCertificate('${c.credential_id}')" 
                                        style="background-color: #059669; color: #ffffff !important; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                                        class="hover:bg-emerald-700 transition-colors">
                                        <i data-lucide="eye" class="w-3.5 h-3.5"></i> View
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                   </div>`
                : '';

            return `
                <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col space-y-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3.5">
                            <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #4F46E5; color: #ffffff !important; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.125rem; flex-shrink: 0;" class="shadow-sm">
                                ${(s.firstName || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 class="text-lg font-bold font-nunito text-gray-800 leading-snug">${s.firstName} ${s.lastName}</h3>
                                <p class="text-xs text-gray-500 font-medium">${s.program} • Stage ${s.stage || 'N/A'} • Age ${s.age}</p>
                            </div>
                        </div>
                        <span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">${s.status || 'Active'}</span>
                    </div>

                    <!-- Progress Tracking -->
                    <div class="space-y-1.5 pt-2">
                        <div class="flex justify-between text-xs font-semibold text-gray-500">
                            <span>Syllabus Completion</span>
                            <span>${s.progress}%</span>
                        </div>
                        <div class="w-full bg-gray-100 h-2.5 rounded-xl overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-xl transition-all duration-500" style="width: ${s.progress}%"></div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <a href="parent-progress.html?studentId=${s.id}" class="btn-3d btn-3d-secondary w-full border border-indigo-100 flex items-center justify-center gap-2 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors">
                            <i data-lucide="bar-chart-2" class="w-4 h-4 text-indigo-600"></i>
                            <span>Track Learning Progress &rarr;</span>
                        </a>
                    </div>

                    ${officialReportHTML}
                    ${reportHTML}
                    ${renderLatestSessionData(s)}
                    ${certsHTML}
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function renderUpcomingClasses() {
        const scheduleContainer = document.getElementById('sessions-container') || document.getElementById('schedule-container');
        if (!scheduleContainer) return;

        // Get schedules for all children of this parent
        const students = (currentParent.role === 'admin' && DashboardEngine.getStudents(currentParent.email).length === 0)
            ? DashboardEngine.getStudents()
            : DashboardEngine.getStudents(currentParent.email);
        const studentIds = students.map(s => s.id);
        const schedules = DashboardEngine.getSchedules().filter(function(s) { return studentIds.includes(s.studentId) && new Date(s.date) >= new Date(new Date().toDateString()); });

        if (schedules.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="p-8 text-center" id="no-schedule-msg">
                    <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="calendar-off" class="w-6 h-6 text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 font-semibold text-sm">No upcoming classes scheduled.</p>
                    <p class="text-xs text-gray-400 mt-1">Assignments will appear here once confirmed by a tutor.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        scheduleContainer.innerHTML = schedules.map(s => {
            const dateFormatted = new Date(s.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <i data-lucide="video" class="w-5 h-5 text-orange-600"></i>
                        </div>
                        <div class="space-y-1">
                            <p class="text-sm font-bold text-gray-800">${s.course} session for <span class="text-orange-500">${s.studentName}</span></p>
                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${dateFormatted}</span>
                                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${s.time} (${s.duration} min)</span>
                                <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5"></i> Mentor: ${s.mentor}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <a href="${s.link}" target="_blank" rel="noopener noreferrer" 
                            class="btn-3d btn-3d-blue px-3 py-1.5 text-[11px] rounded-lg">
                            <i data-lucide="video" class="w-3.5 h-3.5"></i> Join Session
                        </a>
                        <button onclick="ParentEngine.openRescheduleModal('${s.id}')"
                            class="btn-3d btn-3d-secondary px-3 py-1.5 text-[11px] rounded-lg border border-gray-200">
                            Reschedule
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function renderNotifications() {
        const container = document.getElementById('parent-notifications-list');
        if (!container) return;

        const notifs = DashboardEngine.getNotifications(currentParent.email);

        if (notifs.length === 0) {
            container.innerHTML = `
                <p class="text-sm text-gray-400 text-center py-4">No notifications yet.</p>
            `;
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div class="w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-orange-500'} mt-2 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-800 font-bold leading-tight">${n.title}</p>
                    <p class="text-xs text-gray-500 leading-normal mt-0.5">${n.message}</p>
                    <p class="text-[9px] text-gray-400 mt-1">${new Date(n.timestamp).toLocaleString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
        `).join('');

        // Automatically mark read after rendering
        DashboardEngine.markNotificationsRead(currentParent.email);
    }

    function openRescheduleModal(scheduleId) {
        const db = DashboardEngine.getSchedules();
        const session = db.find(s => s.id === scheduleId);
        if (!session) return;

        const modal = document.getElementById('parent-reschedule-modal');
        if (modal) {
            document.getElementById('resch-schedule-id').value = session.id;
            document.getElementById('resch-title-course').textContent = session.course;
            document.getElementById('resch-current-details').textContent = `${session.date} at ${session.time}`;
            modal.style.display = 'flex';
        }
    }

    function closeRescheduleModal() {
        const modal = document.getElementById('parent-reschedule-modal');
        if (modal) modal.style.display = 'none';
    }

    function submitRescheduleForm(e) {
        e.preventDefault();
        const scheduleId = document.getElementById('resch-schedule-id').value;
        const requestedDate = document.getElementById('resch-new-date').value;
        const requestedTime = document.getElementById('resch-new-time').value;

        const schedules = DashboardEngine.getSchedules();
        const session = schedules.find(s => s.id === scheduleId);
        if (!session) return;

        DashboardEngine.submitReschedule({
            scheduleId,
            studentName: session.studentName,
            course: session.course,
            currentDate: session.date,
            currentTime: session.time,
            requestedDate,
            requestedTime,
            parentEmail: currentParent.email
        });

        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 z-[9999] bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-xl text-sm font-semibold animate-fadeIn flex items-center gap-2';
        successMsg.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Reschedule request submitted!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3500);

        closeRescheduleModal();
        renderNotifications();
    }

    function viewCertificate(credentialId) {
        const certs = DashboardEngine.getCertificates();
        const cert = certs.find(c => c.credential_id === credentialId);
        if (!cert) return;

        const modal = document.getElementById('parent-cert-modal');
        if (modal) {
            document.getElementById('modal-cert-student').textContent = cert.student_name;
            document.getElementById('modal-cert-program').textContent = cert.program_name;
            document.getElementById('modal-cert-grade').textContent = cert.grade_level;
            document.getElementById('modal-cert-date').textContent = new Date(cert.issue_date).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
            document.getElementById('modal-cert-id').textContent = cert.credential_id;

            modal.style.display = 'flex';
        }
    }

    function closeCertModal() {
        const modal = document.getElementById('parent-cert-modal');
        if (modal) modal.style.display = 'none';
    }

    function injectModals() {
        // Inject Reschedule Modal
        if (!document.getElementById('parent-reschedule-modal')) {
            const resModal = document.createElement('div');
            resModal.id = 'parent-reschedule-modal';
            resModal.style.display = 'none';
            resModal.className = 'fixed inset-0 z-50 items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
            resModal.innerHTML = `
                <div class="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn">
                    <div class="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 class="text-lg font-nunito font-bold text-gray-800">Reschedule Session</h3>
                        <button type="button" onclick="ParentEngine.closeRescheduleModal()" class="text-gray-400 hover:text-gray-650 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <form id="resch-form" class="space-y-4">
                        <input type="hidden" id="resch-schedule-id">
                        
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session</label>
                            <p id="resch-title-course" class="font-bold text-gray-800 text-sm"></p>
                            <p id="resch-current-details" class="text-xs text-gray-400 mt-0.5"></p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-650 uppercase tracking-wider mb-2">Requested Date</label>
                            <input type="date" id="resch-new-date" required
                                class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-650 uppercase tracking-wider mb-2">Requested Time</label>
                            <input type="time" id="resch-new-time" required
                                class="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
                        </div>

                        <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all">
                            Submit Reschedule Request
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(resModal);
            document.getElementById('resch-form').addEventListener('submit', submitRescheduleForm);
        }

        // Inject Certificate presentation modal
        if (!document.getElementById('parent-cert-modal')) {
            const certModal = document.createElement('div');
            certModal.id = 'parent-cert-modal';
            certModal.style.display = 'none';
            certModal.className = 'fixed inset-0 z-50 items-center justify-center p-4 bg-black/85 backdrop-blur-sm';
            certModal.innerHTML = `
                <div class="bg-[#faf8f5] rounded-3xl p-8 max-w-3xl w-full border border-amber-100 shadow-2xl relative animate-fadeIn flex flex-col items-center">
                    
                    <!-- Close button -->
                    <button type="button" onclick="ParentEngine.closeCertModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>

                    <!-- Certificate border -->
                    <div class="border-4 border-double border-amber-700/60 p-8 w-full text-center space-y-6 bg-white relative">
                        <div class="absolute inset-4 border border-amber-600/30 pointer-events-none"></div>
                        
                        <!-- Header -->
                        <div class="space-y-1">
                            <span class="text-xs tracking-[0.3em] font-bold text-amber-700 uppercase">Certificate of Excellence</span>
                            <h2 class="text-4xl font-serif text-slate-800 font-medium">STEMulus Coding Academy</h2>
                            <div class="w-24 h-[2px] bg-amber-700/40 mx-auto mt-2"></div>
                        </div>

                        <!-- Body -->
                        <div class="space-y-4 py-4">
                            <p class="text-sm font-sans text-gray-500 italic">This credential certifies that student</p>
                            <h3 id="modal-cert-student" class="text-3xl font-serif text-slate-900 font-bold border-b border-gray-100 pb-2 max-w-md mx-auto">John Doe</h3>
                            <p class="text-sm font-sans text-gray-500 max-w-lg mx-auto">has successfully completed the comprehensive curriculum and final capstone project for the program</p>
                            <h4 id="modal-cert-program" class="text-xl font-bold font-nunito text-indigo-700">Python Programming Foundations</h4>
                            <p class="text-xs text-gray-400">Awarded with the grade of <strong id="modal-cert-grade" class="text-emerald-700 uppercase">Distinction</strong></p>
                        </div>

                        <!-- Footer Signatures -->
                        <div class="flex justify-between items-end pt-8 text-left px-8">
                            <div>
                                <p class="font-serif italic text-sm text-slate-800">Sarah Jane</p>
                                <div class="w-28 h-[1px] bg-gray-300 my-1"></div>
                                <p class="text-[10px] text-gray-400 font-sans">Lead Mentor Signature</p>
                            </div>
                            <div class="text-center">
                                <div class="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                                </div>
                                <p class="text-[9px] text-gray-400 mt-2">STEMulus Official Seal</p>
                            </div>
                            <div class="text-right">
                                <p id="modal-cert-date" class="font-sans text-xs text-slate-800">2026-05-15</p>
                                <div class="w-28 h-[1px] bg-gray-300 my-1"></div>
                                <p class="text-[10px] text-gray-400 font-sans">Date of Issuance</p>
                            </div>
                        </div>

                        <!-- ID -->
                        <div class="pt-4 text-center">
                            <span class="text-[9px] font-mono text-gray-400">Verification Link Credential ID: <span id="modal-cert-id" class="text-gray-500 font-semibold">STEM-2026-DF89</span></span>
                        </div>
                    </div>

                    <!-- Options -->
                    <div class="flex gap-4 mt-6">
                        <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Print Certificate
                        </button>
                        <button onclick="ParentEngine.closeCertModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all text-sm">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(certModal);
        }
    }

    function viewMonthlyReport(reportId) {
        if (typeof StemulusReportPDF !== 'undefined') {
            const reports = DashboardEngine.getMonthlyReports ? DashboardEngine.getMonthlyReports() : [];
            const r = reports.find(item => item.id === reportId);
            if (r) {
                StemulusReportPDF.open(r);
                return;
            }
        }
        alert('Evaluation document is loading or could not be found.');
    }

    return {
        init,
        renderDashboard,
        completeStep,
        openRescheduleModal,
        closeRescheduleModal,
        viewCertificate,
        closeCertModal,
        viewMonthlyReport
    };
})();

document.addEventListener('DOMContentLoaded', ParentEngine.init);
// On cloud sync: re-render data without re-running auth redirect
window.addEventListener('stemulusDbUpdated', function() {
    if (ParentEngine && typeof ParentEngine.renderDashboard === 'function') {
        ParentEngine.renderDashboard();
    }
});
