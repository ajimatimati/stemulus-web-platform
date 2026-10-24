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
        const localSession = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSession) ? DashboardEngine.getSession() : null;
        if (localSession && (localSession.role === 'parent' || localSession.role === 'admin')) {
            currentParent = localSession;
            hideLoginOverlay();
            renderDashboard();
        }

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
                                    if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
                                        StemulusSecurity.saveSecureSession(userData);
                                    } else {
                                        sessionStorage.setItem("stemulus_session", JSON.stringify(userData));
                                    }
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
            renderBillingVault();
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
            var allAtt = DashboardEngine.getAttendanceRecords() || [];
            var attList = Array.isArray(allAtt) ? allAtt : [];
            var attRecords = attList.filter(function(r) {
                if (!r) return false;
                var rName = (r.studentName || '').toLowerCase().trim();
                return (r.studentId === student.id || rName === fullName || (student.firstName && rName.startsWith(student.firstName.toLowerCase()))) && r.status === 'approved';
            }).map(function(r) {
                return {
                    date: r.classDate || r.date || '',
                    topic: r.topic || '',
                    conceptGrasp: r.conceptGrasp || 0,
                    tutorComment: r.tutorComment || r.notes || '',
                    homeworkAssigned: r.homeworkAssigned || r.homework || '',
                    whatBuilt: r.whatBuilt || ''
                };
            });
            records = records.concat(attRecords);
        }

        // 2. Query schedules in db.schedules
        var schedules = (DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : []) || [];
        var schedList = Array.isArray(schedules) ? schedules : [];
        var schedRecords = schedList.filter(function(s) {
            if (!s) return false;
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

    function filterChildCards(childId) {
        window._parentActiveChildFilter = childId;
        renderChildren();
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

        const activeFilter = window._parentActiveChildFilter || 'all';
        const displayStudents = (activeFilter === 'all') 
            ? students 
            : students.filter(s => s.id === activeFilter);

        const filterTabsHTML = students.length > 1 ? `
            <div class="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-2 overflow-x-auto">
                <button type="button" onclick="ParentEngine.filterChildCards('all')" class="px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'} cursor-pointer shrink-0">
                    All Children (${students.length})
                </button>
                ${students.map(s => `
                    <button type="button" onclick="ParentEngine.filterChildCards('${s.id}')" class="px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-all ${activeFilter === s.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'} cursor-pointer shrink-0">
                        ${s.firstName}
                    </button>
                `).join('')}
            </div>
        ` : '';

        const studentsToRender = (displayStudents.length > 0) ? displayStudents : students;

        childrenContainer.innerHTML = filterTabsHTML + studentsToRender.map(s => {
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
            const rawReports = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getReports) ? DashboardEngine.getReports(s.id) : [];
            const reports = Array.isArray(rawReports) ? rawReports : [];
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
                const allMR = DashboardEngine.getMonthlyReports() || [];
                const mrList = Array.isArray(allMR) ? allMR : [];
                const sNameLower = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
                monthlyReports = mrList.filter(mr => {
                    if (!mr || mr.status !== 'sent_to_parent') return false;
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

            // Monthly Tuition Cycle details
            const billingInfo = (typeof BillingEngine !== 'undefined')
                ? BillingEngine.calculateBillingInfo(s, (typeof DashboardEngine !== 'undefined' ? DashboardEngine.getAttendanceRecords() : []), (typeof DashboardEngine !== 'undefined' ? DashboardEngine.getSchedules() : []))
                : null;

            const billingHTML = billingInfo ? (function() {
                const isOverdue = billingInfo.status === 'overdue';
                const isDueSoon = billingInfo.status === 'due_soon';
                const statusBadge = isOverdue
                    ? `<span class="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">Overdue by ${Math.abs(billingInfo.daysRemaining)} days</span>`
                    : (isDueSoon
                        ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">Due in ${billingInfo.daysRemaining} days</span>`
                        : `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">Active • Renews ${billingInfo.nextDueDate}</span>`);

                const settings = (typeof BillingEngine !== 'undefined') ? BillingEngine.getSettings() : {
                    bankName: 'Wema Nigeria',
                    accountNumber: '0128062292',
                    accountName: 'STEMulus innovation Limited',
                    usdBankName: 'Wema Bank (USD DOM)',
                    usdAccountNumber: '0622219817',
                    usdAccountName: 'STEMulus innovation Limited'
                };

                return `
                    <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2 mt-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="receipt" class="w-4 h-4 text-emerald-600"></i>
                                <span class="text-xs font-bold text-slate-700">Tuition Cycle</span>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                            <div>
                                <span class="text-[10px] text-slate-400 block">Monthly Rate</span>
                                <span class="font-bold text-slate-800 font-mono">${billingInfo.formattedFee}</span>
                            </div>
                            <div class="text-right">
                                <span class="text-[10px] text-slate-400 block">Next Due Date</span>
                                <span class="font-bold text-slate-800">${billingInfo.nextDueDate}</span>
                            </div>
                        </div>

                        <button type="button" onclick="ParentEngine.openInternationalPaymentGuide()" class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200/80 transition-colors mt-1 cursor-pointer" style="min-height: 38px !important;">
                            <i data-lucide="globe" class="w-3.5 h-3.5 text-indigo-600"></i>
                            <span>Bank Accounts &amp; Remitly / Sendwave Guide</span>
                        </button>

                        ${(isOverdue || isDueSoon) ? `
                            <div class="bg-white border border-amber-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-2 mt-2 shadow-2xs">
                                <p class="font-bold text-amber-800 flex items-center gap-1">
                                    <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i> Tuition Renewal Reminder
                                </p>
                                <div class="space-y-1.5 pt-1 border-t border-amber-100">
                                    <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <div>
                                            <span class="text-[10px] text-slate-500 block font-medium">Nigeria (NGN) &bull; ${settings.bankName}</span>
                                            <span class="font-mono font-bold text-slate-900 text-xs">${settings.accountNumber}</span>
                                            <span class="text-[10px] text-slate-500 block">${settings.accountName}</span>
                                        </div>
                                        <button type="button" onclick="ParentEngine.copyBankDetail('${settings.accountNumber}', this)" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer" style="min-height: 36px !important; min-width: 54px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;">Copy</button>
                                    </div>
                                    <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <div>
                                            <span class="text-[10px] text-teal-700 block font-medium">USD DOM &bull; ${settings.usdBankName || 'Wema Bank (USD DOM)'}</span>
                                            <span class="font-mono font-bold text-teal-800 text-xs">${settings.usdAccountNumber || '0622219817'}</span>
                                            <span class="text-[10px] text-slate-500 block">${settings.usdAccountName || settings.accountName}</span>
                                        </div>
                                        <button type="button" onclick="ParentEngine.copyBankDetail('${settings.usdAccountNumber || '0622219817'}', this)" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer" style="min-height: 36px !important; min-width: 54px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;">Copy</button>
                                    </div>
                                </div>
                                <div class="pt-1 flex items-center justify-between gap-2">
                                    <button type="button" onclick="ParentEngine.openInternationalPaymentGuide()" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer" style="min-height: 36px !important;">
                                        <span>🌍 Remitly / Sendwave Guide</span> &rarr;
                                    </button>
                                    <a href="https://wa.me/2347052466716?text=${encodeURIComponent('Hello STEMulus Admin, I have completed tuition payment for ' + s.firstName + ' ' + s.lastName + '. Here is my proof:')}" target="_blank" class="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 min-h-[38px] rounded-lg border border-emerald-200 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer">
                                        <i data-lucide="send" class="w-3 h-3"></i> WhatsApp Proof
                                    </a>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            })() : '';

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
                                <div class="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                                    <span class="flex items-center gap-1 font-semibold text-slate-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                        <i data-lucide="user-check" class="w-3.5 h-3.5 text-orange-500"></i> Mentor: <strong class="text-slate-900">${s.tutorName || 'Kafayat Abdulwahab'}</strong>
                                    </span>
                                    ${(s.meetLink || s.classroomLink) ? `
                                    <a href="${s.meetLink || s.classroomLink}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/80 font-mono text-[11px] font-semibold transition-colors no-underline" title="Dedicated Google Meet Classroom (Automatically Recorded for Child Safeguarding): ${s.meetLink || s.classroomLink}">
                                        <i data-lucide="video" class="w-3.5 h-3.5 text-blue-600"></i> ${(s.meetLink || s.classroomLink).replace('https://', '')}
                                        <span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-sans ml-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Auto-Recorded
                                        </span>
                                    </a>` : ''}
                                    ${s.googleClassroom ? `
                                    <a href="${s.googleClassroom.studentInviteLink || s.classroomLink}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200/80 font-mono text-[11px] font-semibold transition-colors no-underline" title="Google Classroom: ${s.googleClassroom.courseName}">
                                        <i data-lucide="book-open" class="w-3.5 h-3.5 text-indigo-600"></i> Classroom (${s.googleClassroom.enrollmentCode || 'Join'})
                                    </a>` : ''}
                                </div>
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
                            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important; border: 1px solid #334155 !important; border-radius: 16px; padding: 12px 14px; color: #ffffff !important; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="position: relative; width: 44px; height: 44px; border-radius: 12px; background: rgba(255, 255, 255, 0.12) !important; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.25) !important; flex-shrink: 0; overflow: hidden; cursor: pointer;" onclick="BadgePassportEngine.openBadgeModal(${currBadge.id || 1}, ${s.age || 10})">
                                        <img src="${currBadge.image || 'assets/images/badges/light-evolution/badge-01-fire-finder.png'}" alt="Medallion" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" class="hover:scale-110 transition-transform">
                                    </div>
                                    <div style="min-width: 0;">
                                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                                            <span style="background: ${eraCol}33 !important; color: #ffffff !important; border: 1px solid ${eraCol}88 !important; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 9999px;">${(pass.currentEra && pass.currentEra.name) || 'Era I'}</span>
                                            <span style="font-size: 9px; color: #cbd5e1 !important; font-family: monospace; font-weight: 600;">Badge ${pass.unlockedCount} of 48</span>
                                        </div>
                                        <h4 style="color: #ffffff !important; font-size: 13px; font-weight: 800; margin: 0; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currBadge.title || 'Fire Finder'}</h4>
                                        <p style="color: #94a3b8 !important; font-size: 10px; margin: 2px 0 0 0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Technology Passport: ${(pass.currentEra && pass.currentEra.theme) || 'Light Evolution'}</p>
                                    </div>
                                </div>
                                <button type="button" onclick="BadgePassportEngine.openBadgeModal(${currBadge.id || 1}, ${s.age || 10})" style="background: #f4600c !important; color: #ffffff !important; font-weight: 800; font-size: 11px; border: none; padding: 8px 14px; border-radius: 10px; cursor: pointer; box-shadow: 0 2px 8px rgba(244,96,12,0.4); flex-shrink: 0; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                    <span>View Badge</span> &rarr;
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

                    ${billingHTML}
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
        const studentIds = (Array.isArray(students) ? students : []).map(s => s.id);
        const rawSched = (DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : []) || [];
        const schedList = Array.isArray(rawSched) ? rawSched : [];
        const todayStr = new Date().toISOString().split('T')[0];
        let schedules = schedList.filter(function(s) { 
            return s && studentIds.includes(s.studentId) && s.date && s.date >= todayStr && s.status !== 'cancelled' && s.attendanceStatus !== 'cancelled' && s.attendanceStatus !== 'done' && s.attendanceStatus !== 'present' && s.attendanceStatus !== 'absent'; 
        });
        if (schedules.length === 0 && schedList.length > 0) {
            schedules = schedList.filter(function(s) {
                return s && studentIds.includes(s.studentId) && s.status !== 'cancelled' && s.attendanceStatus !== 'cancelled';
            });
        }
        schedules.sort(function(a, b) {
            return ((a.date || '') + ' ' + (a.time || '')).localeCompare((b.date || '') + ' ' + (b.time || ''));
        });

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
            const dObj = new Date((s.date || '') + 'T12:00:00');
            const dateFormatted = !isNaN(dObj) ? dObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : s.date;
            const isPhysical = (s.link || '').toLowerCase().includes('physical');
            const joinUrl = isPhysical ? (s.meetLinkBackup || 'https://meet.google.com') : (s.link || 'https://meet.google.com');

            // Next Class Countdown & Live Status
            let countdownBadge = '';
            try {
                const now = new Date();
                const sessionDateStr = s.date;
                const sessionTimeStr = s.time || '16:00';
                const [hrs, mins] = sessionTimeStr.split(':').map(Number);
                const sessionDateTime = new Date(`${sessionDateStr}T${String(hrs).padStart(2, '0')}:${String(mins || 0).padStart(2, '0')}:00`);
                const diffMs = sessionDateTime - now;
                const diffMins = Math.round(diffMs / 60000);
                const diffHours = Math.round(diffMs / 3600000);

                if (diffMins >= -30 && diffMins <= 60) {
                    if (diffMins <= 0 && diffMins >= -60) {
                        countdownBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs animate-pulse"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Live Now</span>`;
                    } else {
                        countdownBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300 shadow-xs"><i data-lucide="clock" class="w-3 h-3 text-orange-600"></i> In ${diffMins}m</span>`;
                    }
                } else if (diffHours > 0 && diffHours <= 24) {
                    countdownBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><i data-lucide="clock" class="w-3 h-3 text-indigo-500"></i> In ${diffHours}h</span>`;
                }
            } catch(e) {}

            return `
                <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl ${isPhysical ? 'bg-purple-100' : 'bg-orange-100'} flex items-center justify-center shrink-0">
                            <i data-lucide="${isPhysical ? 'map-pin' : 'video'}" class="w-5 h-5 ${isPhysical ? 'text-purple-600' : 'text-orange-600'}"></i>
                        </div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-sm font-bold text-gray-800">${s.course} session for <span class="text-orange-500 font-extrabold">${s.studentName}</span></p>
                                ${countdownBadge}
                            </div>
                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${dateFormatted}</span>
                                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${s.time} WAT (${s.duration || 60} min)</span>
                                <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5"></i> Mentor: ${s.mentor || s.tutorName}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        ${isPhysical ? `<span class="bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-purple-200">Physical Hub</span>` : ''}
                        <a href="join-class.html?id=${encodeURIComponent(s.id)}&role=parent&url=${encodeURIComponent(joinUrl)}" target="_blank" rel="noopener noreferrer" 
                            class="btn-3d btn-3d-blue px-3.5 py-2 min-h-[38px] text-xs rounded-xl inline-flex items-center justify-center gap-1.5 no-underline">
                            <i data-lucide="video" class="w-3.5 h-3.5"></i> ${isPhysical ? 'Backup Meet' : 'Join Session'}
                        </a>
                        <button onclick="ParentEngine.openRescheduleModal('${s.id}')"
                            class="btn-3d btn-3d-secondary px-3.5 py-2 min-h-[38px] text-xs rounded-xl border border-gray-200 inline-flex items-center justify-center cursor-pointer">
                            Reschedule
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function renderBillingVault() {
        const container = document.getElementById('parent-billing-vault-container');
        if (!container || !currentParent) return;

        const students = (currentParent.role === 'admin' && DashboardEngine.getStudents(currentParent.email).length === 0)
            ? DashboardEngine.getStudents()
            : DashboardEngine.getStudents(currentParent.email);

        if (!students || students.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                    <i data-lucide="receipt" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-slate-700">No active billing accounts found.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const settings = (typeof BillingEngine !== 'undefined') ? BillingEngine.getSettings() : {
            bankName: 'Wema Nigeria',
            accountNumber: '0128062292',
            accountName: 'STEMulus innovation Limited',
            usdBankName: 'Wema Bank (USD DOM)',
            usdAccountNumber: '0622219817',
            usdAccountName: 'STEMulus innovation Limited'
        };

        const attRecords = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getAttendanceRecords) ? DashboardEngine.getAttendanceRecords() : [];
        const schedules = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) ? DashboardEngine.getSchedules() : [];

        // 1. Render Active Tuition Cycles for each student
        const cyclesHTML = students.map(s => {
            const info = (typeof BillingEngine !== 'undefined')
                ? BillingEngine.calculateBillingInfo(s, attRecords, schedules)
                : { formattedFee: '₦35,000', nextDueDate: '2026-11-01', status: 'current', daysRemaining: 15 };

            const isOverdue = info.status === 'overdue';
            const isDueSoon = info.status === 'due_soon';
            const statusBadge = isOverdue
                ? `<span class="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-200">Overdue by ${Math.abs(info.daysRemaining)} days</span>`
                : (isDueSoon
                    ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200">Due in ${info.daysRemaining} days</span>`
                    : `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">Active &bull; Renews ${info.nextDueDate}</span>`);

            return `
                <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block">Tuition Ledger</span>
                            <h3 class="text-sm font-extrabold text-slate-900 font-nunito">${s.firstName} ${s.lastName} &bull; <span class="text-slate-600 font-semibold">${s.program}</span></h3>
                        </div>
                        ${statusBadge}
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                        <div>
                            <span class="text-[10px] text-slate-500 font-semibold block uppercase">Monthly Tuition</span>
                            <span class="font-extrabold text-slate-900 font-mono text-sm">${info.formattedFee}</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-slate-500 font-semibold block uppercase">Cycle Renewal Due</span>
                            <span class="font-bold text-slate-800 text-xs">${info.nextDueDate}</span>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <span class="text-[10px] text-slate-500 font-semibold block uppercase">Cycle Status</span>
                            <span class="font-bold text-emerald-700 text-xs">${isOverdue ? 'Action Required' : 'Current'}</span>
                        </div>
                    </div>

                    <!-- Fast Bank Transfer & WhatsApp Proof Row -->
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                            <button type="button" onclick="ParentEngine.copyBankDetail('${settings.accountNumber}', this)" class="btn-3d px-3 py-1.5 min-h-[36px] min-w-[54px] text-[11px] rounded-xl border border-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 hover:bg-slate-50">
                                <i data-lucide="copy" class="w-3.5 h-3.5 text-orange-500"></i>
                                <span>Copy Wema NGN (${settings.accountNumber})</span>
                            </button>
                            <button type="button" onclick="ParentEngine.copyBankDetail('${settings.usdAccountNumber || '0622219817'}', this)" class="btn-3d px-3 py-1.5 min-h-[36px] min-w-[54px] text-[11px] rounded-xl border border-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 hover:bg-slate-50">
                                <i data-lucide="copy" class="w-3.5 h-3.5 text-teal-600"></i>
                                <span>Copy USD DOM (${settings.usdAccountNumber || '0622219817'})</span>
                            </button>
                        </div>
                        <a href="https://wa.me/2347052466716?text=${encodeURIComponent('Hello STEMulus Admin, I have completed tuition payment for ' + s.firstName + ' ' + s.lastName + ' (' + s.program + '). Here is my transfer confirmation receipt:')}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs shrink-0 no-underline cursor-pointer" style="min-height: 38px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                            <span>WhatsApp Proof to Admin</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // 2. Gather All Archived Receipts from student billing histories
        let allReceipts = [];
        students.forEach(s => {
            const hist = (s.billing && Array.isArray(s.billing.history)) ? s.billing.history : [];
            hist.forEach(r => {
                allReceipts.push({ ...r, studentName: `${s.firstName} ${s.lastName}`, program: s.program });
            });
        });

        // Sort newest first
        allReceipts.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        let receiptsHTML = '';
        if (allReceipts.length > 0) {
            receiptsHTML = `
                <div class="mt-2 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i data-lucide="history" class="w-4 h-4 text-orange-600"></i>
                            <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-800">Verified Payment Receipts Ledger</h4>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500">${allReceipts.length} Settled Invoices</span>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                    <th class="py-2 px-3">Receipt Ref</th>
                                    <th class="py-2 px-3">Student</th>
                                    <th class="py-2 px-3">Amount</th>
                                    <th class="py-2 px-3">Method</th>
                                    <th class="py-2 px-3">Cycle Covered</th>
                                    <th class="py-2 px-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${allReceipts.map(r => `
                                    <tr class="hover:bg-white/80 transition-colors">
                                        <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${r.reference || r.id}</td>
                                        <td class="py-2.5 px-3 font-semibold text-slate-800">${r.studentName}</td>
                                        <td class="py-2.5 px-3 font-mono font-extrabold text-emerald-700">${r.formattedAmount || ('₦' + Number(r.amount).toLocaleString())}</td>
                                        <td class="py-2.5 px-3 text-slate-600">${r.method || 'Bank Transfer'}</td>
                                        <td class="py-2.5 px-3 text-slate-500 font-mono text-[11px]">${r.cyclePaidFor || r.date}</td>
                                        <td class="py-2.5 px-3 text-right">
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Verified
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            receiptsHTML = `
                <div class="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                    <i data-lucide="info" class="w-4 h-4 text-orange-500 shrink-0 mt-0.5"></i>
                    <p class="leading-relaxed">
                        <strong>Active 1-Month Cycle in Progress:</strong> Your child's enrolled tuition period is verified active. Once renewed, official receipts will be archived permanently in this ledger.
                    </p>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="space-y-3.5">
                ${cyclesHTML}
                ${receiptsHTML}
            </div>
        `;

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
            <div class="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div class="w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-orange-500'} mt-1.5 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold leading-tight" style="color: #0F172A !important; font-weight: 800;">${n.title}</p>
                    <p class="text-xs leading-normal mt-0.5" style="color: #475569 !important;">${n.message}</p>
                    <p class="text-[10px] mt-1" style="color: #94A3B8 !important; font-weight: 600;">${new Date(n.timestamp).toLocaleString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
        `).join('');

        // Automatically mark read after rendering
        DashboardEngine.markNotificationsRead(currentParent.email);
    }

    function openRescheduleModal(scheduleId) {
        const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) ? DashboardEngine.getSchedules() : [];
        const session = db.find(s => s.id === scheduleId);
        if (!session) return;

        const modal = document.getElementById('parent-reschedule-modal');
        if (modal) {
            document.getElementById('resch-schedule-id').value = session.id;
            document.getElementById('resch-title-course').textContent = `${session.course} for ${session.studentName || 'Student'}`;
            document.getElementById('resch-current-details').textContent = `${session.dayOfWeek ? session.dayOfWeek + ', ' : ''}${session.date} at ${session.time} WAT (${session.mentor || session.tutorName || 'Coach'})`;

            const dateInput = document.getElementById('resch-new-date');
            const timeInput = document.getElementById('resch-new-time');
            if (dateInput) dateInput.value = '';
            if (timeInput) timeInput.value = '';

            // Render 1-click recommended open slots
            const recContainer = document.getElementById('resch-recommended-container');
            const recSlotsDiv = document.getElementById('resch-recommended-slots');
            if (recContainer && recSlotsDiv) {
                let slots = [];
                if (typeof RescheduleConciergeEngine !== 'undefined') {
                    slots = RescheduleConciergeEngine.findRecommendedSlots(session.studentId, session.tutorId || session.mentor, 7);
                }
                if (slots && slots.length > 0) {
                    recContainer.style.display = 'block';
                    recSlotsDiv.innerHTML = slots.map(function(slot) {
                        return '<button type="button" class="btn-resch-slot text-left p-2.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/90 text-xs text-orange-950 font-medium transition-all flex items-center justify-between cursor-pointer" style="min-height: 38px !important;" onclick="ParentEngine.selectRecommendedSlot(\'' + slot.date + '\', \'' + slot.time + '\', this)">' +
                            '<span><strong>' + slot.dayOfWeek + '</strong>, ' + slot.date + ' • ' + slot.time + ' WAT</span>' +
                            '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Coach Free</span>' +
                        '</button>';
                    }).join('');
                } else {
                    recContainer.style.display = 'none';
                }
            }

            const liveFeedback = document.getElementById('resch-live-availability');
            if (liveFeedback) {
                liveFeedback.style.display = 'none';
                liveFeedback.innerHTML = '';
            }

            modal.style.display = 'flex';
        }
    }

    function selectRecommendedSlot(date, time, btnEl) {
        const dateInput = document.getElementById('resch-new-date');
        const timeInput = document.getElementById('resch-new-time');
        if (dateInput) dateInput.value = date;
        if (timeInput) timeInput.value = time;

        const allSlotBtns = document.querySelectorAll('.btn-resch-slot');
        allSlotBtns.forEach(function(b) {
            b.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-100');
        });
        if (btnEl) {
            btnEl.classList.add('ring-2', 'ring-orange-500', 'bg-orange-100');
        }

        checkLiveRescheduleAvailability();
    }

    function checkLiveRescheduleAvailability() {
        const scheduleId = document.getElementById('resch-schedule-id').value;
        const requestedDate = document.getElementById('resch-new-date').value;
        const requestedTime = document.getElementById('resch-new-time').value;
        const feedbackEl = document.getElementById('resch-live-availability');
        if (!feedbackEl) return;

        if (!requestedDate || !requestedTime) {
            feedbackEl.style.display = 'none';
            return;
        }

        const schedules = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) ? DashboardEngine.getSchedules() : [];
        const session = schedules.find(s => s.id === scheduleId);
        if (!session) return;

        if (typeof RescheduleConciergeEngine !== 'undefined') {
            const tutorCheck = RescheduleConciergeEngine.checkTutorAvailability(session.tutorId || session.mentor, requestedDate, requestedTime, 60, scheduleId);
            feedbackEl.style.display = 'block';
            if (tutorCheck.available) {
                feedbackEl.className = 'text-xs p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium flex items-center gap-2 mt-2';
                feedbackEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Coach ' + (session.mentor || session.tutorName || 'Olalekan') + ' is verified available for this slot!';
            } else {
                feedbackEl.className = 'text-xs p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-medium flex items-center gap-2 mt-2';
                feedbackEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span> Coach has a class conflict, but our Concierge will pair an approved peer coach for coverage.';
            }
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
        const reason = document.getElementById('resch-reason') ? document.getElementById('resch-reason').value : '';

        const schedules = DashboardEngine.getSchedules();
        const session = schedules.find(s => s.id === scheduleId);
        if (!session) return;

        DashboardEngine.submitReschedule({
            scheduleId: scheduleId,
            studentId: session.studentId,
            studentName: session.studentName,
            course: session.course,
            currentDate: session.date,
            currentTime: session.time,
            requestedDate: requestedDate,
            requestedTime: requestedTime,
            reason: reason,
            parentEmail: currentParent.email
        });

        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 z-[9999] bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-xl text-sm font-semibold animate-fadeIn flex items-center gap-2';
        successMsg.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Smart Reschedule request submitted!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3500);

        closeRescheduleModal();
        renderUpcomingClasses();
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
                <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200/90 space-y-4 animate-fadeIn" style="box-shadow: 0 20px 40px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(244,96,12,0.06);">
                    <div class="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                            <h3 class="text-base font-nunito font-extrabold text-gray-900">⚡ Smart Reschedule Concierge</h3>
                            <p class="text-[11px] text-gray-500">Autonomous conflict checking & slot verification</p>
                        </div>
                        <button type="button" onclick="ParentEngine.closeRescheduleModal()" class="text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition-colors cursor-pointer rounded-xl" style="width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important; display: flex !important; align-items: center !important; justify-content: center !important;" aria-label="Close reschedule modal">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <form id="resch-form" class="space-y-3.5">
                        <input type="hidden" id="resch-schedule-id">
                        
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Selected Session</label>
                            <p id="resch-title-course" class="font-bold text-gray-900 text-sm"></p>
                            <p id="resch-current-details" class="text-xs text-gray-500 mt-0.5"></p>
                        </div>

                        <!-- 1-Click Recommended Open Slots -->
                        <div id="resch-recommended-container" style="display:none;">
                            <label class="block text-xs font-bold text-orange-600 mb-1.5 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                                1-Click Recommended Slots (Zero Conflict)
                            </label>
                            <div id="resch-recommended-slots" class="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1"></div>
                        </div>

                        <div class="pt-1">
                            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Or Pick Custom Date</label>
                            <input type="date" id="resch-new-date" required onchange="ParentEngine.checkLiveRescheduleAvailability()"
                                class="w-full bg-gray-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 transition-colors" style="min-height: 38px !important;">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Requested Time (WAT)</label>
                            <input type="time" id="resch-new-time" required onchange="ParentEngine.checkLiveRescheduleAvailability()"
                                class="w-full bg-gray-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 transition-colors" style="min-height: 38px !important;">
                        </div>

                        <!-- Real-time live availability indicator -->
                        <div id="resch-live-availability" style="display:none;"></div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Reason for Adjustment</label>
                            <select id="resch-reason" class="w-full bg-gray-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-orange-500 transition-colors" style="min-height: 38px !important;">
                                <option value="Family Travel / Trip">Family Travel / Trip</option>
                                <option value="School Exams / Academic Conflict">School Exams / Academic Conflict</option>
                                <option value="Illness / Recovery">Illness / Recovery</option>
                                <option value="Timezone / Routine Adjustment">Timezone / Routine Adjustment</option>
                                <option value="Other Personal Commitment">Other Personal Commitment</option>
                            </select>
                        </div>

                        <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer" style="min-height: 40px !important;">
                            <span>Confirm Reschedule Request</span>
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
            const rawAtt = DashboardEngine.getAttendanceRecords() || [];
            const attList = Array.isArray(rawAtt) ? rawAtt : [];
            const records = attList.filter(r => 
                r && (r.studentId === student.id || (r.studentName && r.studentName.toLowerCase().trim() === sFull)) &&
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
                            <button type="button" onclick="ParentEngine.shareProjectOnWhatsApp('${safeTitle}', '${safeName}', '${safeCat}', '${safeDesc}')" class="flex-1 min-w-[200px] min-h-[38px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0">
                                <i data-lucide="message-circle" class="w-4 h-4"></i> Share with Family on WhatsApp
                            </button>
                            <button type="button" onclick="ParentEngine.openProjectModal('${p.id}')" class="px-4 py-2.5 min-h-[38px] rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0">
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
                link: newStudent.meetLink || newStudent.classroomLink,
                autoRecord: true,
                autoRecordEnabled: true,
                hostNotRequired: true,
                recordingMode: '1080p_hd_companion_and_cloud',
                googleClassroom: newStudent.googleClassroom,
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

    function copyBankDetail(text, btnElement) {
        if (!text) return;
        const val = String(text).trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(val).then(() => {
                showCopyFeedback(btnElement, val);
            }).catch(() => fallbackCopy(val, btnElement));
        } else {
            fallbackCopy(val, btnElement);
        }
    }

    function fallbackCopy(val, btnElement) {
        try {
            const ta = document.createElement('textarea');
            ta.value = val;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showCopyFeedback(btnElement, val);
        } catch (e) {
            if (typeof showToast === 'function') showToast(`Account: ${val}`, 'info');
        }
    }

    function showCopyFeedback(btnElement, val) {
        if (btnElement) {
            const orig = btnElement.innerHTML;
            btnElement.innerHTML = 'Copied!';
            btnElement.style.backgroundColor = '#10B981';
            btnElement.style.color = '#ffffff';
            setTimeout(() => {
                btnElement.innerHTML = orig;
                btnElement.style.backgroundColor = '';
                btnElement.style.color = '';
            }, 2000);
        }
        if (typeof showToast === 'function') {
            showToast(`Copied ${val} to clipboard!`, 'success');
        }
    }

    function createInternationalPaymentGuideModal() {
        if (document.getElementById('modal-international-payment-guide')) return;

        const settings = (typeof BillingEngine !== 'undefined') ? BillingEngine.getSettings() : {
            bankName: 'Wema Nigeria',
            accountNumber: '0128062292',
            accountName: 'STEMulus innovation Limited',
            usdBankName: 'Wema Bank (USD DOM)',
            usdAccountNumber: '0622219817',
            usdAccountName: 'STEMulus innovation Limited'
        };

        const modalDiv = document.createElement('div');
        modalDiv.id = 'modal-international-payment-guide';
        modalDiv.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-sm animate-fadeIn';
        modalDiv.innerHTML = `
            <div class="fixed inset-0" onclick="ParentEngine.closeInternationalPaymentGuide()"></div>
            <div class="relative bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 z-10 my-6">
                <!-- Modal Header -->
                <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Official Accounts</span>
                            <span class="text-[10px] font-bold text-slate-500">Global &amp; Local Settlements</span>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tuition &amp; International Payment Guide</h2>
                        <p class="text-xs text-slate-500 mt-1">Direct Bank Transfers, Remitly, Sendwave, Send by Flutterwave, and USD Wire</p>
                    </div>
                    <button type="button" onclick="ParentEngine.closeInternationalPaymentGuide()" class="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shrink-0 cursor-pointer" style="width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important; display: flex !important; align-items: center !important; justify-content: center !important;" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- STEMulus Official Bank Accounts Bento -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                    <!-- Nigeria NGN Account -->
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important; border: 1px solid #334155 !important; border-radius: 18px; padding: 18px; color: #ffffff !important; box-shadow: 0 4px 14px rgba(15,23,42,0.15);">
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px; background: rgba(16, 185, 129, 0.2) !important; color: #6ee7b7 !important; border: 1px solid rgba(16, 185, 129, 0.4) !important;">Nigeria &amp; Remitly NGN</span>
                            <span style="font-size: 11px; font-weight: 700; color: #94a3b8 !important;">Local Currency</span>
                        </div>
                        <p style="font-size: 11px; color: #cbd5e1 !important; font-weight: 500; margin: 0 0 6px 0;">Bank Name: <strong style="color: #ffffff !important; font-weight: 800;">${settings.bankName || 'Wema Nigeria'}</strong></p>
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.1) !important; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.18) !important; margin: 8px 0;">
                            <div>
                                <span style="font-size: 9px; color: #cbd5e1 !important; display: block; text-transform: uppercase; font-family: monospace; font-weight: 600;">Account Number</span>
                                <span style="font-family: monospace; font-weight: 800; color: #ffffff !important; font-size: 17px; letter-spacing: 0.05em; display: block;">${settings.accountNumber || '0128062292'}</span>
                            </div>
                            <button type="button" onclick="ParentEngine.copyBankDetail('${settings.accountNumber || '0128062292'}', this)" style="background: #f4600c !important; color: #ffffff !important; font-weight: 800; font-size: 11px; border: none; padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: transform 0.15s ease; min-height: 36px !important; min-width: 56px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                Copy
                            </button>
                        </div>
                        <p style="font-size: 11px; color: #cbd5e1 !important; font-weight: 500; margin: 4px 0 0 0;">Account Name: <strong style="color: #ffffff !important; font-weight: 800;">${settings.accountName || 'STEMulus innovation Limited'}</strong></p>
                    </div>

                    <!-- USD Domiciliary Account -->
                    <div style="background: linear-gradient(135deg, #042f2e 0%, #0f172a 100%) !important; border: 1px solid #115e59 !important; border-radius: 18px; padding: 18px; color: #ffffff !important; box-shadow: 0 4px 14px rgba(4,47,46,0.15);">
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px; background: rgba(20, 184, 166, 0.2) !important; color: #5eead4 !important; border: 1px solid rgba(20, 184, 166, 0.4) !important;">USD Domiciliary (DOM)</span>
                            <span style="font-size: 11px; font-weight: 700; color: #5eead4 !important;">International Wire ($)</span>
                        </div>
                        <p style="font-size: 11px; color: #ccfbf1 !important; font-weight: 500; margin: 0 0 6px 0;">Bank Name: <strong style="color: #ffffff !important; font-weight: 800;">${settings.usdBankName || 'Wema Bank (USD DOM)'}</strong></p>
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.1) !important; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.18) !important; margin: 8px 0;">
                            <div>
                                <span style="font-size: 9px; color: #99f6e4 !important; display: block; text-transform: uppercase; font-family: monospace; font-weight: 600;">USD Account Number</span>
                                <span style="font-family: monospace; font-weight: 800; color: #ffffff !important; font-size: 17px; letter-spacing: 0.05em; display: block;">${settings.usdAccountNumber || '0622219817'}</span>
                            </div>
                            <button type="button" onclick="ParentEngine.copyBankDetail('${settings.usdAccountNumber || '0622219817'}', this)" style="background: #0d9488 !important; color: #ffffff !important; font-weight: 800; font-size: 11px; border: none; padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: transform 0.15s ease; min-height: 36px !important; min-width: 56px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                Copy
                            </button>
                        </div>
                        <p style="font-size: 11px; color: #ccfbf1 !important; font-weight: 500; margin: 4px 0 0 0;">Account Name: <strong style="color: #ffffff !important; font-weight: 800;">${settings.usdAccountName || 'STEMulus innovation Limited'}</strong></p>
                        <p style="font-size: 10px; color: #5eead4 !important; margin: 4px 0 0 0; font-family: monospace;">SWIFT Code: <strong style="color: #ffffff !important; font-weight: 800;">WEMANGLA</strong></p>
                    </div>
                </div>

                <!-- Step-by-Step Payment Instructions -->
                <div class="space-y-4 mb-6">
                    <h3 class="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <i data-lucide="help-circle" class="w-4 h-4 text-brand-orange"></i>
                        How to Pay from the UK, US, Canada, Europe &amp; Diaspora
                    </h3>

                    <!-- Remitly Guide -->
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                        <div class="flex items-center gap-2.5 mb-2">
                            <span class="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">1</span>
                            <h4 class="font-bold text-slate-900 text-xs sm:text-sm">Paying via Remitly (Recommended)</h4>
                            <span class="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">Lowest Fees</span>
                        </div>
                        <ol class="text-xs text-slate-600 space-y-1.5 list-decimal pl-5">
                            <li>Open the <strong>Remitly app</strong> or visit <a href="https://www.remitly.com" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-semibold underline">remitly.com</a>.</li>
                            <li>Select <strong>Nigeria</strong> as the destination country.</li>
                            <li>Choose <strong>Bank Deposit</strong> as your delivery method.</li>
                            <li>Select Bank: <strong>Wema Bank</strong>.</li>
                            <li>Enter Account Number: <strong class="text-slate-900 font-mono">0128062292</strong> (Recipient Name resolves to <strong>STEMulus innovation Limited</strong>).</li>
                            <li>Enter tuition amount in your local currency (USD, GBP, CAD, EUR) and confirm transfer.</li>
                            <li>Save transfer receipt/screenshot to share with Admin.</li>
                        </ol>
                    </div>

                    <!-- Sendwave / Send by Flutterwave -->
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                        <div class="flex items-center gap-2.5 mb-2">
                            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">2</span>
                            <h4 class="font-bold text-slate-900 text-xs sm:text-sm">Paying via Sendwave / Send by Flutterwave (Sendnow)</h4>
                            <span class="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-auto">Instant Credit</span>
                        </div>
                        <ol class="text-xs text-slate-600 space-y-1.5 list-decimal pl-5">
                            <li>Open <strong>Sendwave</strong> or <strong>Send by Flutterwave</strong> app.</li>
                            <li>Destination country: <strong>Nigeria</strong>.</li>
                            <li>Select <strong>Wema Bank</strong> from the bank list.</li>
                            <li>Account Number: <strong class="text-slate-900 font-mono">0128062292</strong> (Beneficiary: <strong>STEMulus innovation Limited</strong>).</li>
                            <li>Review exchange rate, fee waiver, and send.</li>
                        </ol>
                    </div>

                    <!-- Direct USD Wire Transfer -->
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                        <div class="flex items-center gap-2.5 mb-2">
                            <span class="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">3</span>
                            <h4 class="font-bold text-slate-900 text-xs sm:text-sm">Direct USD Wire Transfer (To USD DOM)</h4>
                            <span class="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full ml-auto">International Wire</span>
                        </div>
                        <div class="text-xs text-slate-600 space-y-1">
                            <p>For international wire transfers directly from corporate or personal foreign accounts:</p>
                            <p>&bull; <strong>Beneficiary:</strong> STEMulus innovation Limited</p>
                            <p>&bull; <strong>USD Account Number:</strong> <span class="font-mono font-bold text-slate-900">0622219817</span></p>
                            <p>&bull; <strong>Bank Name:</strong> Wema Bank Plc, Nigeria</p>
                            <p>&bull; <strong>SWIFT / BIC Code:</strong> <span class="font-mono font-bold text-slate-900">WEMANGLA</span></p>
                            <p>&bull; <strong>Bank Address:</strong> 54 Marina, Lagos Island, Lagos, Nigeria</p>
                        </div>
                    </div>
                </div>

                <!-- Instant Proof Submission Footer -->
                <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                        <h4 class="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> Done with payment?
                        </h4>
                        <p class="text-[11px] text-emerald-800 mt-0.5">WhatsApp your transfer receipt to STEMulus Admin for instant credit verification.</p>
                    </div>
                    <a href="https://wa.me/2347052466716?text=${encodeURIComponent('Hello STEMulus Admin, I have completed a tuition payment. Here is my transfer confirmation receipt:')}" target="_blank" class="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> Send Proof to Admin
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
        if (window.lucide) lucide.createIcons();
    }

    function openInternationalPaymentGuide() {
        createInternationalPaymentGuideModal();
        const modal = document.getElementById('modal-international-payment-guide');
        if (modal) modal.classList.remove('hidden');
    }

    function closeInternationalPaymentGuide() {
        const modal = document.getElementById('modal-international-payment-guide');
        if (modal) modal.classList.add('hidden');
    }

    return {
        init,
        renderDashboard,
        renderLatestSessionData,
        completeStep,
        openRescheduleModal,
        closeRescheduleModal,
        selectRecommendedSlot,
        checkLiveRescheduleAvailability,
        viewCertificate,
        closeCertModal,
        viewMonthlyReport,
        openAddChildModal,
        closeAddChildModal,
        saveChild,
        renderProjectShowcase,
        shareProjectOnWhatsApp,
        openProjectModal,
        closeProjectModal,
        openInternationalPaymentGuide,
        closeInternationalPaymentGuide,
        filterChildCards,
        copyBankDetail,
        renderBillingVault
    };
})();

if (typeof window !== 'undefined') {
    window.ParentEngine = ParentEngine;
}

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
