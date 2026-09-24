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
                                // User exists in Firebase Auth but no Firestore record: create one and prompt password reset
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

    let isRenderingDashboard = false;
    function renderDashboard() {
        if (!currentParent || isRenderingDashboard) return;
        isRenderingDashboard = true;
        try {
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
            renderProjectShowcase();
            injectModals();
        } finally {
            isRenderingDashboard = false;
        }
    }

    function renderOnboardingPanel() {
        if (!currentParent || !currentParent.email) return;
        
        // Remove existing onboarding section if any
        const existing = document.getElementById('onboarding-panel');
        if (existing) existing.remove();

        const onboarding = DashboardEngine.getOnboarding(currentParent.email);
        // Automatically accept/complete non-essential onboarding checks on login so parents have seamless access
        if (onboarding && !onboarding.completed) {
            if (typeof DashboardEngine !== 'undefined' && DashboardEngine.completeAllOnboarding) {
                DashboardEngine.completeAllOnboarding(currentParent.email);
            }
            return;
        }
    }

    function completeStep(stepId) {
        DashboardEngine.completeOnboardingStep(currentParent.email, stepId);
        renderOnboardingPanel();
        renderNotifications();
    }

    function renderLatestSessionData(student) {
        var records = [];
        var fullName = ((student.firstName || '') + ' ' + (student.lastName || '')).toLowerCase().trim();

        // 1. Query approved attendance records from db.attendanceRecords
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getAttendanceRecords) {
            var allAtt = DashboardEngine.getAttendanceRecords();
            var attRecords = allAtt.filter(function(r) {
                var rName = (r.studentName || '').toLowerCase().trim();
                return (r.studentId === student.id || rName === fullName || (student.firstName && rName.startsWith(student.firstName.toLowerCase()))) && r.status === 'approved';
            }).map(function(r) {
                return {
                    date: r.classDate,
                    topic: r.topic,
                    conceptGrasp: r.conceptGrasp || 0,
                    tutorComment: r.tutorComment || r.notes || '',
                    homeworkAssigned: r.homeworkAssigned || r.homework || '',
                    whatBuilt: r.whatBuilt || ''
                };
            });
            records = records.concat(attRecords);
        }

        // 2. Query schedules in db.schedules
        var schedules = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
        var schedRecords = schedules.filter(function(s) {
            var sName = (s.studentName || '').toLowerCase().trim();
            return (s.studentId === student.id || sName === fullName || (student.firstName && sName.startsWith(student.firstName.toLowerCase()))) && 
                   (s.attendanceStatus === 'present' || s.status === 'approved') &&
                   (s.tutorComment || s.topic || s.homeworkAssigned || s.homework);
        }).map(function(s) {
            return {
                date: s.date,
                topic: s.topic,
                conceptGrasp: s.conceptGrasp || 0,
                tutorComment: s.tutorComment || '',
                homeworkAssigned: s.homeworkAssigned || s.homework || '',
                whatBuilt: s.whatBuilt || ''
            };
        });
        records = records.concat(schedRecords);

        // Sort descending by date
        records.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        if (!records.length) return '';
        var latest = records[0];

        var stars = '';
        for (var i = 1; i <= 5; i++) {
            stars += '<span style="color:' + (i <= (latest.conceptGrasp || 0) ? '#f59e0b' : '#d1d5db') + '">&#9733;</span>';
        }

        return '<div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:14px;padding:1.1rem;margin-top:0.85rem;border:1px solid #e2e8f0;border-left:4px solid #F4600C;box-shadow:0 2px 8px rgba(0,0,0,0.03);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">' +
              '<p style="font-size:0.7rem;font-weight:800;color:#F4600C;text-transform:uppercase;letter-spacing:0.08em;margin:0;">Latest Verified Session &bull; ' + (latest.date || 'Recent') + '</p>' +
              '<span style="background:#dcfce7;color:#15803d;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:9999px;">Approved</span>' +
            '</div>' +
            (latest.topic ? '<p style="font-size:0.88rem;font-weight:700;color:#0f172a;margin:0 0 0.35rem;">Topic: ' + latest.topic + '</p>' : '') +
            (latest.whatBuilt ? '<p style="font-size:0.8rem;color:#475569;margin:0 0 0.3rem;"><span style="font-weight:600;color:#1e293b;">Built:</span> ' + latest.whatBuilt + '</p>' : '') +
            (latest.conceptGrasp ? '<p style="font-size:0.8rem;color:#475569;margin:0.2rem 0 0.35rem;">Concept Grasp: ' + stars + ' <span style="font-size:0.75rem;color:#64748b;">(' + latest.conceptGrasp + '/5)</span></p>' : '') +
            (latest.tutorComment ? '<p style="font-size:0.8rem;color:#334155;margin:0.25rem 0 0.4rem;font-style:italic;background:#ffffff;padding:0.5rem 0.75rem;border-radius:8px;border-left:2px solid #cbd5e1;">&ldquo;' + latest.tutorComment + '&rdquo;</p>' : '') +
            (latest.homeworkAssigned ? '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:0.6rem 0.85rem;margin-top:0.5rem;"><p style="font-size:0.72rem;font-weight:800;color:#c2410c;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 0.2rem;">Assignment Given</p><p style="font-size:0.82rem;font-weight:600;color:#7c2d12;margin:0;">' + latest.homeworkAssigned + '</p></div>' : '') +
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
                    <button type="button" onclick="ParentEngine.openAddChildModal()" class="btn-3d" style="cursor:pointer;">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i> Add Your Child Now
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        childrenContainer.innerHTML = students.map(s => {
            // Calculate real live metrics from verified attendance logs and completed sessions
            const liveMetrics = (typeof DashboardEngine !== 'undefined' && DashboardEngine.calculateStudentLiveMetrics)
                ? DashboardEngine.calculateStudentLiveMetrics(s.id)
                : null;

            const progressVal = liveMetrics ? liveMetrics.progress : (s.progress || 0);
            const attendedSessions = liveMetrics ? liveMetrics.attendedCount : ((s.metrics && s.metrics.attended) ? s.metrics.attended : 0);
            const targetSessions = liveMetrics ? liveMetrics.monthlyTarget : 8;
            const liveProjects = liveMetrics ? liveMetrics.projectsCount : 1;
            const liveHours = liveMetrics ? liveMetrics.totalHours : 0;

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

                    <!-- Progress & Verified Attendance Metrics -->
                    <div class="space-y-2 pt-2">
                        <div class="flex justify-between text-xs font-semibold text-gray-500">
                            <span>Syllabus Completion</span>
                            <span class="font-bold text-slate-800">${progressVal}%</span>
                        </div>
                        <div class="w-full bg-gray-100 h-2.5 rounded-xl overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-xl transition-all duration-500" style="width: ${progressVal}%"></div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sessions</span>
                                <span class="font-extrabold text-slate-800 text-xs">${attendedSessions} / ${targetSessions}</span>
                            </div>
                            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hours</span>
                                <span class="font-extrabold text-slate-800 text-xs">${liveHours} hrs</span>
                            </div>
                            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capstones</span>
                                <span class="font-extrabold text-slate-800 text-xs">${liveProjects} built</span>
                            </div>
                        </div>
                    </div>

                    <!-- Technology Passport Badge Preview Card -->
                    ${(function() {
                        if (typeof BadgePassportEngine === 'undefined') return '';
                        const pass = BadgePassportEngine.getStudentPassport(s.id);
                        if (!pass) return '';
                        const currBadge = pass.currentBadge || {};
                        const eraCol = (pass.currentEra && pass.currentEra.color) || '#f97316';
                        return `
                            <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-3.5 shadow-sm border border-slate-800 flex items-center justify-between gap-3 my-2">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="relative w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 overflow-hidden cursor-pointer" onclick="BadgePassportEngine.openBadgeModal(${currBadge.id || 1}, ${s.age || 10})">
                                        <img src="${currBadge.image || 'assets/images/badges/light-evolution/badge-01-fire-finder.png'}" alt="Medallion" class="w-9 h-9 object-contain drop-shadow hover:scale-110 transition-transform">
                                    </div>
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-1.5 mb-0.5">
                                            <span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full" style="background:${eraCol}25;color:${eraCol};border:1px solid ${eraCol}40;">${(pass.currentEra && pass.currentEra.name) || 'Era I'}</span>
                                            <span class="text-[9px] text-slate-300 font-mono">Badge ${pass.unlockedCount} of 48</span>
                                        </div>
                                        <h4 class="text-xs font-bold text-white truncate">${currBadge.title || 'Fire Finder'}</h4>
                                        <p class="text-[10px] text-slate-400 truncate">Technology Passport: Light Evolution</p>
                                    </div>
                                </div>
                                <button type="button" onclick="BadgePassportEngine.openBadgeModal(${currBadge.id || 1}, ${s.age || 10})" class="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-[11px] transition-all shrink-0">
                                    View Badge
                                </button>
                            </div>
                        `;
                    })()}

                    <div class="pt-1">
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

        // Inject Project Showcase Modal
        if (!document.getElementById('parent-project-modal')) {
            const projModal = document.createElement('div');
            projModal.id = 'parent-project-modal';
            projModal.style.display = 'none';
            projModal.className = 'fixed inset-0 z-50 items-center justify-center p-4 bg-black/80 backdrop-blur-sm';
            projModal.innerHTML = `
                <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative animate-fadeIn flex flex-col space-y-4">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div class="flex items-center gap-2.5">
                            <span class="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                <i data-lucide="sparkles" class="w-5 h-5"></i>
                            </span>
                            <div>
                                <span id="modal-proj-category" class="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block">Category</span>
                                <h3 id="modal-proj-title" class="text-base font-extrabold text-slate-800 font-nunito">Project Title</h3>
                            </div>
                        </div>
                        <button type="button" onclick="ParentEngine.closeProjectModal()" class="text-slate-400 hover:text-slate-700 transition-colors p-1.5" aria-label="Close modal">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div id="modal-proj-media-container" class="w-full h-56 rounded-2xl bg-slate-950 overflow-hidden relative flex items-center justify-center shadow-inner">
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs text-slate-500">
                            <span id="modal-proj-author" class="font-bold text-slate-700">Built by Daniel, Age 10</span>
                            <span class="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Verified by Mentor
                            </span>
                        </div>
                        <p id="modal-proj-desc" class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100"></p>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-2 pt-2">
                        <button type="button" id="modal-proj-whatsapp-btn" class="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-.984-.067-.58-.201-1.398-.636-2.316-1.554-.919-.918-1.353-1.736-1.554-2.316-.12-.35-.112-.672-.067-.984.05-.333.419-1.026.824-1.17.135-.048.281-.03.392.041.353.228.847 1.114.922 1.258.075.144.075.255.015.375-.06.12-.135.21-.24.315-.105.105-.18.18-.285.285-.105.105-.225.225-.105.435.12.21.536.883 1.155 1.502.619.619 1.292 1.035 1.502 1.155.21.12.33.105.435-.001.105-.105.18-.18.285-.285.105-.105.195-.18.315-.24.12-.06.231-.06.375.015.144.075 1.03.569 1.258.922.071.111.089.257.041.392z"/></svg> Share with Family on WhatsApp
                        </button>
                        <button type="button" onclick="ParentEngine.closeProjectModal()" class="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(projModal);
        }
    }

    function getStudentProjects(student) {
        const projects = [];
        const sFirst = (student.firstName || '').toLowerCase().trim();
        const sFull = ((student.firstName || '') + ' ' + (student.lastName || '')).toLowerCase().trim();

        // 1. Check DashboardEngine.getMilestones()
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMilestones) {
            const milestones = DashboardEngine.getMilestones();
            milestones.forEach(m => {
                const mName = (m.studentName || '').toLowerCase().trim();
                if (mName === sFull || mName.startsWith(sFirst) || sFirst.startsWith(mName.split(' ')[0])) {
                    projects.push({
                        id: m.id || 'mil-' + Math.random().toString(36).substr(2, 6),
                        title: m.title || 'Coding Milestone',
                        description: m.description || '',
                        category: m.category || student.program || 'Programming',
                        image: m.image || '',
                        isVideo: m.image && (m.image.endsWith('.mp4') || m.image.endsWith('.webm')),
                        studentName: student.firstName,
                        studentAge: m.studentAge || student.age || 10,
                        date: m.date || 'Recent Session',
                        source: 'milestone'
                    });
                }
            });
        }

        // 2. Check approved attendance records with whatBuilt
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getAttendanceRecords) {
            const records = DashboardEngine.getAttendanceRecords().filter(r => 
                (r.studentId === student.id || (r.studentName && r.studentName.toLowerCase().trim() === sFull)) &&
                r.status === 'approved' &&
                (r.whatBuilt || r.topic)
            );

            records.forEach(r => {
                const title = r.whatBuilt || r.topic;
                if (!projects.some(p => p.title.toLowerCase() === title.toLowerCase())) {
                    projects.push({
                        id: 'att-proj-' + r.id,
                        title: title,
                        description: r.tutorComment ? `"${r.tutorComment}"` : `Completed in mentored session on ${r.classDate}.`,
                        category: student.program || 'Coding Track',
                        image: '',
                        isVideo: false,
                        studentName: student.firstName,
                        studentAge: student.age || 10,
                        date: r.classDate || 'Recent',
                        source: 'attendance'
                    });
                }
            });
        }

        // 3. Fallback default project if none yet
        if (projects.length === 0) {
            let defaultTitle = "Space Raider Arcade Launch";
            let defaultCat = "Game Dev & Python";
            let defaultDesc = `${student.firstName} is currently programming player movement, boundary checks, and collision detection algorithms.`;
            if (student.program && student.program.includes("Scratch")) {
                defaultTitle = "Interactive Quest & Sprite Animation";
                defaultCat = "Scratch Creators";
                defaultDesc = `${student.firstName} is building multi-level game loops with sound broadcast and score trackers.`;
            } else if (student.program && student.program.includes("Robotics")) {
                defaultTitle = "Autonomous Obstacle Avoidance Rover";
                defaultCat = "Robotics & IoT";
                defaultDesc = `${student.firstName} is programming ultrasonic sonar sensors and motor steering sequences.`;
            }

            projects.push({
                id: 'starter-' + student.id,
                title: defaultTitle,
                description: defaultDesc,
                category: defaultCat,
                image: 'Robot.mp4',
                isVideo: true,
                studentName: student.firstName,
                studentAge: student.age || 10,
                date: 'In Progress',
                source: 'starter'
            });
        }

        return projects;
    }

    function renderProjectShowcase() {
        const container = document.getElementById('parent-projects-showcase');
        if (!container) return;

        const students = (currentParent.role === 'admin' && DashboardEngine.getStudents(currentParent.email).length === 0)
            ? DashboardEngine.getStudents()
            : DashboardEngine.getStudents(currentParent.email);

        if (students.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                    <i data-lucide="folder-code" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-slate-700">No student projects found.</p>
                    <p class="text-[11px] text-slate-500 mt-1">Once your child begins classes and builds projects, their digital showcase will appear here.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let allProjects = [];
        students.forEach(s => {
            const studentProjs = getStudentProjects(s);
            studentProjs.forEach(p => {
                allProjects.push({ ...p, student: s });
            });
        });

        container.innerHTML = allProjects.map(p => {
            const safeTitle = encodeURIComponent(p.title);
            const safeName = encodeURIComponent(p.studentName);
            const safeCat = encodeURIComponent(p.category);
            const safeDesc = encodeURIComponent(p.description);

            return `
                <div class="bg-gradient-to-br from-white to-slate-50/60 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start">
                    <!-- Media Preview -->
                    <div class="w-full md:w-44 h-32 rounded-xl bg-slate-900 overflow-hidden relative shrink-0 flex items-center justify-center group shadow-inner">
                        ${p.isVideo ? `
                            <video src="${p.image}" class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform" muted loop playsinline onmouseenter="this.play()" onmouseleave="this.pause()"></video>
                            <div class="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                <div class="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                    <i data-lucide="play" class="w-4 h-4 text-white ml-0.5"></i>
                                </div>
                            </div>
                        ` : `
                            <div class="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white p-3 text-center">
                                <i data-lucide="code-2" class="w-8 h-8 text-indigo-400 mb-1"></i>
                                <span class="text-[10px] font-mono text-indigo-200 uppercase font-bold tracking-wider">${p.category}</span>
                            </div>
                        `}
                        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow">
                            ${p.category}
                        </span>
                    </div>

                    <!-- Details -->
                    <div class="flex-1 space-y-2 w-full">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i> STEMulus Verified Build
                            </span>
                            <span class="text-[11px] text-slate-500 font-medium">${p.studentName}, Age ${p.studentAge}</span>
                        </div>
                        <h4 class="font-extrabold text-slate-800 text-sm font-nunito leading-snug">${p.title}</h4>
                        <p class="text-xs text-slate-600 leading-relaxed">${p.description}</p>
                        
                        <!-- Viral WhatsApp Share & Interactive Preview -->
                        <div class="pt-2 flex flex-wrap items-center gap-2.5">
                            <button type="button" onclick="ParentEngine.shareProjectOnWhatsApp('${safeTitle}', '${safeName}', '${safeCat}', '${safeDesc}')" class="flex-1 min-w-[200px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer">
                                <i data-lucide="message-circle" class="w-4 h-4"></i> Share with Family on WhatsApp
                            </button>
                            <button type="button" onclick="ParentEngine.openProjectModal('${p.id}')" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                                <i data-lucide="eye" class="w-3.5 h-3.5"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    function shareProjectOnWhatsApp(safeTitle, safeStudentName, safeCategory, safeDescription) {
        const title = decodeURIComponent(safeTitle);
        const studentName = decodeURIComponent(safeStudentName);
        const category = decodeURIComponent(safeCategory);
        const description = safeDescription ? decodeURIComponent(safeDescription) : '';

        const message = 
            `🌟 *Proud Parent Moment!* 🌟\n\n` +
            `My child *${studentName}* just coded and launched their tech project: *${title}* (${category}) at *STEMulus Kids Tech Academy*! 🚀💻\n\n` +
            (description ? `"${description}"\n\n` : '') +
            `STEMulus is building the next generation of African tech innovators. Check them out: https://stemuluskidstech.com`;

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        if (typeof showToast === 'function') {
            showToast(`Opening WhatsApp! Share text ready for family and friends.`, 'success');
        }
    }

    function openProjectModal(projectId) {
        const modal = document.getElementById('parent-project-modal');
        if (!modal) return;

        const students = (currentParent.role === 'admin' && DashboardEngine.getStudents(currentParent.email).length === 0)
            ? DashboardEngine.getStudents()
            : DashboardEngine.getStudents(currentParent.email);

        let foundProj = null;
        for (const s of students) {
            const list = getStudentProjects(s);
            const match = list.find(p => p.id === projectId);
            if (match) {
                foundProj = match;
                break;
            }
        }

        if (!foundProj) return;

        const titleEl = document.getElementById('modal-proj-title');
        const catEl = document.getElementById('modal-proj-category');
        const authorEl = document.getElementById('modal-proj-author');
        const descEl = document.getElementById('modal-proj-desc');
        const mediaContainer = document.getElementById('modal-proj-media-container');
        const waBtn = document.getElementById('modal-proj-whatsapp-btn');

        if (titleEl) titleEl.textContent = foundProj.title;
        if (catEl) catEl.textContent = foundProj.category;
        if (authorEl) authorEl.textContent = `Coded by ${foundProj.studentName}, Age ${foundProj.studentAge}`;
        if (descEl) descEl.textContent = foundProj.description;

        if (mediaContainer) {
            if (foundProj.isVideo) {
                mediaContainer.innerHTML = `<video src="${foundProj.image}" controls autoplay muted loop playsinline class="w-full h-full object-cover"></video>`;
            } else {
                mediaContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center text-white p-6 text-center space-y-2">
                        <div class="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                            <i data-lucide="code-2" class="w-8 h-8 text-indigo-400"></i>
                        </div>
                        <h4 class="text-sm font-bold">${foundProj.title}</h4>
                        <span class="text-[11px] text-indigo-300 font-mono">${foundProj.category}</span>
                    </div>
                `;
            }
        }

        if (waBtn) {
            const safeTitle = encodeURIComponent(foundProj.title);
            const safeName = encodeURIComponent(foundProj.studentName);
            const safeCat = encodeURIComponent(foundProj.category);
            const safeDesc = encodeURIComponent(foundProj.description);
            waBtn.onclick = function() {
                shareProjectOnWhatsApp(safeTitle, safeName, safeCat, safeDesc);
            };
        }

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }

    function closeProjectModal() {
        const modal = document.getElementById('parent-project-modal');
        if (modal) {
            const video = modal.querySelector('video');
            if (video) video.pause();
            modal.style.display = 'none';
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

    function openAddChildModal() {
        const modal = document.getElementById('parent-add-child-modal');
        const form = document.getElementById('parent-add-child-form');
        if (form) form.reset();
        const tutorSel = document.getElementById('add-child-tutor');
        if (tutorSel && typeof DashboardEngine !== 'undefined' && DashboardEngine.getTutors) {
            const tutors = DashboardEngine.getTutors();
            if (tutors && tutors.length > 0) {
                tutorSel.innerHTML = tutors.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
            }
        }
        if (modal) modal.classList.remove('hidden');
    }

    function closeAddChildModal() {
        const modal = document.getElementById('parent-add-child-modal');
        if (modal) modal.classList.add('hidden');
    }

    async function saveChild(e) {
        if (e) e.preventDefault();
        if (!currentParent) return;

        const fName = (document.getElementById('add-child-first-name') ? document.getElementById('add-child-first-name').value : '').trim();
        const lName = (document.getElementById('add-child-last-name') ? document.getElementById('add-child-last-name').value : '').trim();
        const age = parseInt(document.getElementById('add-child-age') ? document.getElementById('add-child-age').value : '10') || 10;
        const bday = (document.getElementById('add-child-birthday') ? document.getElementById('add-child-birthday').value : '').trim();
        const prog = (document.getElementById('add-child-course') ? document.getElementById('add-child-course').value : 'Python Programming Foundations');
        const exp = (document.getElementById('add-child-experience') ? document.getElementById('add-child-experience').value : 'Beginner');
        const tutor = (document.getElementById('add-child-tutor') ? document.getElementById('add-child-tutor').value : 'Sarah Jane');

        if (!fName || !lName) {
            if (typeof showToast === 'function') showToast('Please enter both child first and last name', 'warning');
            return;
        }

        const newStudent = DashboardEngine.addStudent({
            firstName: fName,
            lastName: lName,
            age: age,
            birthday: bday,
            hasExplicitBirthday: !!(bday && bday.length >= 10),
            gender: 'Not specified',
            experience: exp,
            program: prog,
            status: 'active',
            parentEmail: currentParent.email,
            parentName: currentParent.name || 'Parent',
            parentPhone: currentParent.phone || '',
            tutorName: tutor,
            progress: 0,
            skills: { logic: 60, loops: 60, variables: 60, syntax: 60, projects: 60 },
            metrics: { attended: 0, total: 8, projects: 0, lines: 0 }
        });

        // Add initial schedule slot 3 days from now
        const schedDate = new Date();
        schedDate.setDate(schedDate.getDate() + 3);
        const db = DashboardEngine.getDB ? DashboardEngine.getDB() : null;
        if (db && newStudent) {
            db.schedules = db.schedules || [];
            db.schedules.push({
                id: "sch-" + Date.now(),
                studentId: newStudent.id,
                studentName: fName + ' ' + lName,
                course: prog,
                date: schedDate.toISOString().split('T')[0],
                time: "16:30",
                duration: "60",
                mentor: tutor,
                link: "https://zoom.us/j/stemulus-class",
                attendanceStatus: "pending"
            });
            if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
        }

        closeAddChildModal();
        if (typeof showToast === 'function') {
            showToast(`Successfully enrolled ${fName}!`, 'success');
        }
        renderChildren();
        if (typeof updateKPIs === 'function') updateKPIs();
    }

    return {
        init,
        renderDashboard,
        renderLatestSessionData,
        completeStep,
        openRescheduleModal,
        closeRescheduleModal,
        viewCertificate,
        closeCertModal,
        viewMonthlyReport,
        openAddChildModal,
        closeAddChildModal,
        saveChild,
        renderProjectShowcase,
        shareProjectOnWhatsApp,
        openProjectModal,
        closeProjectModal
    };
})();

document.addEventListener('DOMContentLoaded', ParentEngine.init);
// On cloud sync: re-render data without re-running auth redirect
window.addEventListener('stemulusDbUpdated', function() {
    if (ParentEngine && typeof ParentEngine.renderDashboard === 'function') {
        ParentEngine.renderDashboard();
    }
});
window.addEventListener('storage', function(e) {
    if (!e.key || e.key === 'stemulus_db' || e.key === 'stemulus_monthly_reports') {
        if (ParentEngine && typeof ParentEngine.renderDashboard === 'function') {
            ParentEngine.renderDashboard();
        }
    }
});
