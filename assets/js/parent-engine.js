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
        currentParent = DashboardEngine.getSession();
        
        // For local development, if no session, show a beautiful login panel
        if (!currentParent || currentParent.role !== 'parent') {
            showLoginOverlay();
        } else {
            hideLoginOverlay();
            renderDashboard();
        }
    }

    function showLoginOverlay() {
        let loginOverlay = document.getElementById('parent-login-overlay');
        if (!loginOverlay) {
            loginOverlay = document.createElement('div');
            loginOverlay.id = 'parent-login-overlay';
            loginOverlay.className = 'fixed inset-0 bg-[#0c1322] z-50 flex items-center justify-center p-4';
            loginOverlay.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-2xl text-center space-y-6">
                    <div>
                        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="shield-check" class="w-8 h-8 text-orange-600"></i>
                        </div>
                        <h2 class="text-2xl font-nunito font-bold text-gray-800">Parent Portal Login</h2>
                        <p class="text-sm text-gray-500 mt-1">Access your child's coding schedule and achievements</p>
                    </div>

                    <form id="portal-login-form" class="space-y-4 text-left">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
                            <input type="email" id="portal-email" required value="parent@stemulus.com"
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Password</label>
                            <input type="password" id="portal-password" required value="parent123"
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
                        </div>
                        <div id="portal-login-err" class="hidden text-red-500 text-xs py-2 bg-red-50 rounded-lg text-center font-medium"></div>
                        
                        <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25">
                            Login as Parent
                        </button>
                    </form>

                    <div class="border-t border-gray-100 pt-4 text-xs text-gray-400">
                        Demo Account Email: <span class="font-mono text-gray-600">parent@stemulus.com</span><br>Password: <span class="font-mono text-gray-600">parent123</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loginOverlay);
            if (window.lucide) lucide.createIcons();

            document.getElementById('portal-login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('portal-email').value;
                const password = document.getElementById('portal-password').value;
                const res = DashboardEngine.login(email, password);
                if (res.success && res.user.role === 'parent') {
                    loginOverlay.remove();
                    currentParent = res.user;
                    renderDashboard();
                } else {
                    const errEl = document.getElementById('portal-login-err');
                    errEl.textContent = res.message || "Access denied. Not a parent account.";
                    errEl.classList.remove('hidden');
                }
            });
        }
    }

    function hideLoginOverlay() {
        const loginOverlay = document.getElementById('parent-login-overlay');
        if (loginOverlay) loginOverlay.remove();
    }

    function renderDashboard() {
        // Remove loading screen
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }

        // Set parent name in header
        const nameEl = document.getElementById('user-name');
        if (nameEl) nameEl.textContent = currentParent.name || "Parent";

        // Wire logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                DashboardEngine.logout();
                window.location.reload();
            });
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
        const main = document.querySelector('main');
        
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
        
        main.insertBefore(panel, main.firstChild);
    }

    function completeStep(stepId) {
        DashboardEngine.completeOnboardingStep(currentParent.email, stepId);
        renderOnboardingPanel();
        renderNotifications();
    }

    function renderChildren() {
        const childrenContainer = document.getElementById('children-container');
        if (!childrenContainer) return;

        const students = DashboardEngine.getStudents(currentParent.email);

        if (students.length === 0) {
            childrenContainer.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center py-10 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <i data-lucide="smile" class="w-12 h-12 text-gray-500 mx-auto mb-3"></i>
                    <p class="text-gray-500 font-semibold">No children enrolled yet.</p>
                    <a href="enroll.html" class="inline-block mt-3 text-orange-500 hover:underline font-bold">Enroll your first child</a>
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
                                        <p class="text-[10px] text-emerald-600">ID: ${c.credential_id} • Issued: ${c.issue_date}</p>
                                    </div>
                                    <button onclick="ParentEngine.viewCertificate('${c.credential_id}')" 
                                        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <i data-lucide="eye" class="w-3 h-3"></i> View
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                   </div>`
                : '';

            return `
                <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col space-y-4 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full ${s.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-white font-bold text-lg">
                                ${s.firstName[0]}
                            </div>
                            <div>
                                <h3 class="text-lg font-bold font-nunito text-gray-800">${s.firstName} ${s.lastName}</h3>
                                <p class="text-xs text-gray-500">${s.program} • Age ${s.age}</p>
                            </div>
                        </div>
                        <span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">${s.status}</span>
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
                        <a href="parent-progress.html?studentId=${s.id}" class="w-full text-center block bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 rounded-xl transition-all border border-indigo-100/50">
                            View Detailed Progress Dashboard
                        </a>
                    </div>

                    ${reportHTML}
                    ${certsHTML}
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function renderUpcomingClasses() {
        const scheduleContainer = document.getElementById('schedule-container');
        if (!scheduleContainer) return;

        // Get schedules for all children of this parent
        const students = DashboardEngine.getStudents(currentParent.email);
        const studentIds = students.map(s => s.id);
        const schedules = DashboardEngine.getSchedules().filter(s => studentIds.includes(s.studentId));

        if (schedules.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="p-8 text-center" id="no-schedule-msg">
                    <i data-lucide="calendar" class="w-10 h-10 text-gray-500 mx-auto mb-3"></i>
                    <p class="text-gray-500 font-semibold">No upcoming classes scheduled.</p>
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
                            class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5">
                            <i data-lucide="video" class="w-3.5 h-3.5"></i> Join Session
                        </a>
                        <button onclick="ParentEngine.openRescheduleModal('${s.id}')"
                            class="border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors">
                            Reschedule
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }

    function renderNotifications() {
        const container = document.querySelector('section.bg-white.p-6 div.space-y-4');
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
                    <p class="text-[9px] text-gray-400 mt-1">${new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
            modal.classList.remove('hidden');
        }
    }

    function closeRescheduleModal() {
        const modal = document.getElementById('parent-reschedule-modal');
        if (modal) modal.classList.add('hidden');
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

        alert("Reschedule request submitted to administrator successfully!");
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
            document.getElementById('modal-cert-date').textContent = cert.issue_date;
            document.getElementById('modal-cert-id').textContent = cert.credential_id;

            modal.classList.remove('hidden');
        }
    }

    function closeCertModal() {
        const modal = document.getElementById('parent-cert-modal');
        if (modal) modal.classList.add('hidden');
    }

    function injectModals() {
        // Inject Reschedule Modal
        if (!document.getElementById('parent-reschedule-modal')) {
            const resModal = document.createElement('div');
            resModal.id = 'parent-reschedule-modal';
            resModal.className = 'fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm';
            resModal.innerHTML = `
                <div class="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-5 animate-fadeIn">
                    <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                        <h3 class="text-lg font-nunito font-bold text-gray-800">Reschedule Session</h3>
                        <button onclick="ParentEngine.closeRescheduleModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
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
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Requested Date</label>
                            <input type="date" id="resch-new-date" required
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Requested Time</label>
                            <input type="time" id="resch-new-time" required
                                class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors">
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
            certModal.className = 'fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm';
            certModal.innerHTML = `
                <div class="bg-[#faf8f5] rounded-2xl p-8 max-w-3xl w-full border border-amber-200/50 shadow-2xl relative animate-fadeIn flex flex-col items-center">
                    
                    <!-- Close button -->
                    <button onclick="ParentEngine.closeCertModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
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

    return {
        init,
        completeStep,
        openRescheduleModal,
        closeRescheduleModal,
        viewCertificate,
        closeCertModal
    };
})();

document.addEventListener('DOMContentLoaded', ParentEngine.init);
// Render on database updates
window.addEventListener('stemulusDbUpdated', ParentEngine.init);
