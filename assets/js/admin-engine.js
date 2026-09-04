/**
 * STEMulus Admin Dashboard Engine
 * Coordinates administrative tasks such as student registrations, reschedule approvals, 
 * certificate generations, and student birthday push alerts via ntfy.
 */

const AdminEngine = (function () {
    let currentUser = null;
    let studentsCache = [];
    let projectsCache = [];
    let certsCache = [];

    // Category → badge color auto-mapping
    const CATEGORY_COLORS = {
        'Game Dev': 'bg-sky-650/90',
        'Web Dev': 'bg-orange-500/90',
        'Robotics': 'bg-green-600/90',
        'Python': 'bg-blue-900/90',
        'Mobile App': 'bg-cyan-500/90',
        'Animation': 'bg-pink-500/90',
        'AI / ML': 'bg-indigo-600/90'
    };

    // ==================== INITIALIZATION ====================

    function init() {
        bindLoginForm();
        checkAuth();
    }

    function checkAuth() {
        const hasFirebase = (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore);

        const loginScreen = document.getElementById('login-screen');
        const dashboardContainer = document.getElementById('dashboard-container');

        const proceedAsAdmin = (userData) => {
            currentUser = userData;
            if (loginScreen) loginScreen.classList.add('hidden');
            if (dashboardContainer) dashboardContainer.classList.remove('hidden');
            document.documentElement.style.visibility = 'visible';

            if (document.getElementById('user-email')) document.getElementById('user-email').textContent = currentUser.email;
            if (document.getElementById('user-name')) document.getElementById('user-name').textContent = currentUser.name;
            if (document.getElementById('user-avatar')) document.getElementById('user-avatar').textContent = (currentUser.name || 'A')[0].toUpperCase();

            loadDashboardData();
            bindEvents();
        };

        const redirectToLogin = () => {
            window.location.href = 'admin-login.html';
        };

        if (hasFirebase) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    const session = DashboardEngine.getSession();
                    if (session && session.role === 'admin' && session.email.toLowerCase() === user.email.toLowerCase()) {
                        proceedAsAdmin(session);
                    } else {
                        // Fetch role from Firestore
                        try {
                            const userDoc = await firebase.firestore().collection('users').doc(user.email.toLowerCase()).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                if (userData.role === 'admin') {
                                    sessionStorage.setItem('stemulus_session', JSON.stringify(userData));
                                    proceedAsAdmin(userData);
                                } else {
                                    console.warn('[Admin Engine] User is logged in but role is:', userData.role);
                                    redirectToLogin();
                                }
                            } else {
                                redirectToLogin();
                            }
                        } catch (e) {
                            console.error('[Admin Engine] Firestore check failed:', e);
                            const fallback = DashboardEngine.getSession();
                            if (fallback && fallback.role === 'admin') {
                                proceedAsAdmin(fallback);
                            } else {
                                redirectToLogin();
                            }
                        }
                    }
                } else {
                    const localSession = DashboardEngine.getSession();
                    if (localSession && localSession.role === 'admin') {
                        proceedAsAdmin(localSession);
                    } else {
                        redirectToLogin();
                    }
                }
            });
        } else {
            // Local fallback — no Firebase available
            const localSession = DashboardEngine.getSession();
            if (localSession && localSession.role === 'admin') {
                proceedAsAdmin(localSession);
            } else {
                redirectToLogin();
            }
        }
    }

function bindLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');

    if (!form) return;

    form.onsubmit = async function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');

        btn.disabled = true;
        btn.innerHTML = '<span>Signing in...</span>';
        if (errorDiv) errorDiv.classList.add('hidden');

        const res = await DashboardEngine.login(email, password);
        if (res.success && res.user.role === 'admin') {
            showToast('Welcome back, Admin!', 'success');
            currentUser = res.user;
            if (!document.getElementById('compose-email-form')) { init(); }
        } else {
            if (errorDiv) {
                errorDiv.textContent = res.message || 'Login failed. Access restricted to Admin.';
                errorDiv.classList.remove('hidden');
            }
            btn.disabled = false;
            btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right" class="w-5 h-5"></i>';
            if (window.lucide) lucide.createIcons();
        }
    };
}

function bindEvents() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = function () {
            DashboardEngine.logout();
            window.location.reload();
        };
    }

    // Sidebar Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.onclick = function (e) {
            const section = link.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                navigateToSection(section);
            }
        };
    });

    // Search inputs
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.oninput = function (e) {
            filterStudents(e.target.value);
        };
    }

    const studentSearch = document.getElementById('student-search');
    if (studentSearch) {
        studentSearch.oninput = function (e) {
            filterStudents(e.target.value);
        };
    }

    const certSearch = document.getElementById('cert-search');
    if (certSearch) {
        certSearch.oninput = function (e) {
            filterCertificates(e.target.value);
        };
    }

    const reportsSearch = document.getElementById('admin-reports-search');
    if (reportsSearch) {
        reportsSearch.oninput = function (e) {
            filterMonthlyReports(e.target.value);
        };
    }

    const reportFilters = document.querySelectorAll('.admin-report-filter');
    reportFilters.forEach(btn => {
        btn.onclick = function () {
            const filter = btn.getAttribute('data-filter') || 'all';
            setMonthlyReportsFilter(filter);
        };
    });

    // Student Form
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.onsubmit = saveStudent;
    }

    // Add Student Buttons
    const addStudentBtn = document.getElementById('add-student-btn');
    if (addStudentBtn) {
        addStudentBtn.onclick = function () {
            openStudentModal();
        };
    }

    const quickAddStudentBtn = document.getElementById('quick-add-student');
    if (quickAddStudentBtn) {
        quickAddStudentBtn.onclick = function () {
            openStudentModal();
        };
    }

    // Schedule Form & Button
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.onsubmit = saveSchedule;
    }

    const addScheduleBtn = document.getElementById('add-schedule-btn');
    if (addScheduleBtn) {
        addScheduleBtn.onclick = function () {
            openScheduleModal();
        };
    }

    // Project Form
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.onsubmit = saveProject;
    }

    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.onclick = function () {
            openProjectModal();
        };
    }

    // Notification Form
    const notificationForm = document.getElementById('compose-notification-form');
    if (notificationForm) {
        notificationForm.onsubmit = sendPortalNotification;
    }

    // Certificate Form
    const certForm = document.getElementById('issue-cert-form');
    if (certForm) {
        certForm.onsubmit = saveCertificate;
        const dateInput = document.getElementById('cert-issue-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    // Export CSV
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.onclick = exportStudentsCSV;
    }

    // Filter dropdowns
    const filterCourse = document.getElementById('filter-course');
    if (filterCourse) filterCourse.onchange = function () { filterStudents('', filterCourse.value, document.getElementById('filter-status') ? document.getElementById('filter-status').value : ''); };
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) filterStatus.onchange = function () { filterStudents('', filterCourse ? filterCourse.value : '', filterStatus.value); };

    // Add Tutor button + form
    const addTutorBtn = document.getElementById('add-tutor-btn');
    if (addTutorBtn) addTutorBtn.onclick = function () { openTutorModal(); };
    const tutorForm = document.getElementById('tutor-form');
    if (tutorForm) tutorForm.onsubmit = saveTutor;

    // Add Parent button + form
    const addParentBtn = document.getElementById('add-parent-btn');
    if (addParentBtn) addParentBtn.onclick = function () { openParentModal(); };
    const parentForm = document.getElementById('parent-form');
    if (parentForm) parentForm.onsubmit = saveParent;

    // Compose Email Form
    const composeForm = document.getElementById('compose-email-form');
    if (composeForm) {
        composeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const subject = (document.getElementById('email-subject') || {}).value || '';
            const body = (document.getElementById('email-body') || {}).value || '';
            if (!subject.trim() || !body.trim()) {
                if (typeof showToast === 'function') showToast('Please fill in subject and message', 'error');
                return;
            }
            var submitBtn = composeForm.querySelector('button[type="submit"]');
            var originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
            try {
                var recipientType = document.getElementById('email-recipient-type') ? document.getElementById('email-recipient-type').value : 'individual';
                var recipientEmail = 'admin@stemuluskidstech.com';
                var recipientName = 'Admin';
                if (recipientType === 'individual') {
                    var studentSel = document.getElementById('email-student');
                    if (studentSel && studentSel.value) {
                        var students = DashboardEngine.getStudents ? DashboardEngine.getStudents() : [];
                        var student = students.find(function(s){ return s.id === studentSel.value || s.email === studentSel.value; });
                        if (student) { recipientEmail = student.parentEmail || student.email; recipientName = student.parentName || student.firstName; }
                    }
                } else if (recipientType === 'all_parents') {
                    recipientEmail = '__bulk_parents__'; // handled below
                } else if (recipientType === 'all_tutors') {
                    recipientEmail = '__bulk_tutors__';
                }

                // For individual: queue the email for admin review
                if (recipientEmail && !recipientEmail.startsWith('__')) {
                    if (DashboardEngine.addToEmailQueue) {
                        DashboardEngine.addToEmailQueue({
                            type: 'custom',
                            to: recipientEmail,
                            recipientName: recipientName,
                            subject: subject,
                            htmlPreview: body,
                            data: { to: recipientEmail, subject: subject, body: body },
                            triggeredBy: 'admin_compose'
                        });
                        if (typeof showToast === 'function') showToast('Email added to queue for review', 'success');
                        composeForm.reset();
                    } else {
                        if (window.EmailService && typeof window.EmailService.send === 'function') {
                            await window.EmailService.send({ subject, body: body, to: recipientEmail });
                        } else if (window.emailjs) {
                            await emailjs.send('service_7v7j9u5', 'template_duun9x7', { subject, message: body });
                        }
                        if (typeof showToast === 'function') showToast('Email sent!', 'success');
                        composeForm.reset();
                    }
                }
            } catch(err) {
                if (typeof showToast === 'function') showToast('Failed to send email', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
            }
        });
    }

    // Schedule Email Button
    const scheduleEmailBtn = document.getElementById('schedule-email-btn');
    if (scheduleEmailBtn && !scheduleEmailBtn._wired) {
        scheduleEmailBtn._wired = true;
        scheduleEmailBtn.addEventListener('click', function() {
            if (typeof showToast === 'function') showToast('Email scheduling coming soon', 'info');
        });
    }

    // Save Automation Button
    const saveAutomBtn = document.getElementById('save-automation-btn');
    if (saveAutomBtn && !saveAutomBtn._wired) {
        saveAutomBtn._wired = true;
        saveAutomBtn.addEventListener('click', function() {
            if (typeof showToast === 'function') showToast('Automation settings saved', 'success');
        });
    }

    // Cert file input preview
    var certFileInput = document.getElementById('cert-file-input');
    var certFileName = document.getElementById('cert-file-name');
    var certPreview = document.getElementById('cert-file-preview');
    var certPreviewImg = document.getElementById('cert-preview-img');
    var certPreviewPdf = document.getElementById('cert-preview-pdf');
    if (certFileInput) {
        certFileInput.addEventListener('change', function() {
            var file = this.files[0];
            if (!file) return;
            if (certFileName) certFileName.textContent = file.name;
            if (certPreview) certPreview.classList.remove('hidden');
            if (file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function(e){ if(certPreviewImg){ certPreviewImg.src=e.target.result; certPreviewImg.classList.remove('hidden'); if(certPreviewPdf) certPreviewPdf.classList.add('hidden'); }};
                reader.readAsDataURL(file);
            } else {
                if (certPreviewImg) certPreviewImg.classList.add('hidden');
                if (certPreviewPdf) certPreviewPdf.classList.remove('hidden');
            }
        });
    }

    // Google Meet shortcut on schedule link input
    var linkInput = document.getElementById('session-link') || document.getElementById('schedule-link');
    if (linkInput && !document.getElementById('create-meet-btn')) {
        var meetBtn = document.createElement('button');
        meetBtn.type = 'button';
        meetBtn.id = 'create-meet-btn';
        meetBtn.className = 'mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1';
        meetBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg> Create Google Meet';
        meetBtn.onclick = function(){ window.open('https://meet.google.com/new','_blank'); };
        linkInput.parentNode.insertBefore(meetBtn, linkInput.nextSibling);
    }

    // Notification Modal Form (notification-form)
    var notifModalForm = document.getElementById('notification-form');
    if (notifModalForm && !notifModalForm._wired) {
        notifModalForm._wired = true;
        notifModalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var text = document.getElementById('notification-text') ? document.getElementById('notification-text').value : '';
            var title = document.getElementById('notification-title') ? document.getElementById('notification-title').value : 'Portal Notification';
            if (!text.trim()) return;
            if (typeof sendPortalNotification === 'function') { sendPortalNotification({ title: title, message: text }); }
            else { var db = DashboardEngine.getDB ? DashboardEngine.getDB() : null; if (db) { if (!db.notifications) db.notifications = []; db.notifications.push({ id: 'notif-' + Date.now(), userEmail: 'all', title: title, message: text, timestamp: new Date().toISOString(), read: false }); DashboardEngine.saveDB(db); } }
            this.reset();
            var modal = document.getElementById('notification-modal'); if (modal) modal.classList.add('hidden');
            if (typeof showToast === 'function') showToast('Notification sent to all parents', 'success');
        });
    }

    // Change Password Form
    var changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm && !changePasswordForm._wired) {
        changePasswordForm._wired = true;
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var currentPwd = (document.getElementById('current-password')||{}).value||'';
            var newPwd = (document.getElementById('new-password')||{}).value||'';
            var confirmPwd = (document.getElementById('confirm-password')||{}).value||'';
            var msgEl = document.getElementById('password-change-msg');

            if (!currentPwd||!newPwd||!confirmPwd) { showMsg(msgEl,'All fields required','error'); return; }
            if (newPwd.length<8) { showMsg(msgEl,'New password must be at least 8 characters','error'); return; }
            if (newPwd!==confirmPwd) { showMsg(msgEl,'New passwords do not match','error'); return; }

            var session = DashboardEngine.getSession ? DashboardEngine.getSession() : null;
            if (!session) return;

            var loginResult = await DashboardEngine.login(session.email, currentPwd);
            if (!loginResult.success) { showMsg(msgEl,'Current password is incorrect','error'); return; }

            var pwdResult = DashboardEngine.resetUserPassword ? DashboardEngine.resetUserPassword(session.email, newPwd) : {success:false};
            // resetUserPassword stores plaintext; on next login() call it auto-upgrades to hash
            if (pwdResult.success) {
                showMsg(msgEl,'Password changed successfully!','success');
                changePasswordForm.reset();
            } else { showMsg(msgEl,'Failed to change password','error'); }
        });
    }

    // Weekly Report Generator Button
    var genWeeklyBtn = document.getElementById('generate-weekly-reports-btn');
    if (genWeeklyBtn && !genWeeklyBtn._wired) {
        genWeeklyBtn._wired = true;
        genWeeklyBtn.addEventListener('click', async function() {
            this.textContent = 'Generating...'; this.disabled = true;
            var reports = DashboardEngine.generateAllWeeklyReports ? DashboardEngine.generateAllWeeklyReports() : [];
            var queued = 0;
            reports.forEach(function(report) {
                if (!report || !report.parentEmail) return;
                var sessions = report.sessions || [];
                var topicsList = sessions.filter(function(s){ return s.topic; }).map(function(s){ return s.topic; }).join(', ') || 'Various topics';
                var hwList = sessions.filter(function(s){ return s.homeworkAssigned; }).map(function(s){ return s.homeworkAssigned; }).join(' | ') || 'None assigned';
                var graspLabel = report.averageConceptGrasp>=4?'Excellent':report.averageConceptGrasp>=3?'Good':report.averageConceptGrasp>0?'Needs Review':'Not rated';
                var subject = 'Weekly Progress Report — ' + report.studentName + ' (' + report.weekStart + ' to ' + report.weekEnd + ')';
                var preview = 'Sessions: '+report.sessionsAttended+'/'+report.sessionsTotal+' | Topics: '+topicsList+' | Concept Grasp: '+graspLabel+' | Homework: '+hwList;
                DashboardEngine.addToEmailQueue({
                    type: 'custom',
                    to: report.parentEmail,
                    recipientName: report.studentName + "'s parent",
                    subject: subject,
                    htmlPreview: preview,
                    data: { to: report.parentEmail, subject: subject, body: preview, reportData: report },
                    triggeredBy: 'weekly_report_' + report.studentId
                });
                queued++;
            });
            this.textContent = 'Generate This Week\'s Reports'; this.disabled = false;
            if (queued>0) { showToast(queued+' weekly report(s) added to Email Queue for review','success'); loadEmailQueue(); }
            else showToast('No sessions found this week to report on','info');
        });
    }
}

function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'text-sm mt-2 ' + (type==='success'?'text-emerald-600':'text-red-600');
    el.classList.remove('hidden');
    setTimeout(function(){ el.classList.add('hidden'); }, 4000);
}

function navigateToSection(sectionName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) link.classList.add('active');
    });

    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    const target = document.getElementById(`section-${sectionName}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        var SECTION_TITLES = { 'dashboard': 'Dashboard', 'students': 'Students', 'tutors': 'Tutors', 'parents': 'Parents', 'schedule-wf': 'Weekly Schedule', 'schedules': 'Schedule', 'certificates': 'Certificates', 'emails': 'Email Center', 'notifications': 'Notifications', 'settings': 'Settings', 'whatsapp-bot': 'WhatsApp Bot', 'reports': 'Reports' };
        var title = SECTION_TITLES[sectionName] || (sectionName.charAt(0).toUpperCase() + sectionName.slice(1));
        pageTitle.textContent = title;
    }

    if (sectionName === 'email-queue') { loadEmailQueue(); }
    if (sectionName === 'password-resets') { loadPasswordResets(); }
    if (sectionName === 'reports') { loadTutorMonthlyReports(); }
    if (sectionName === 'approvals') { if (typeof loadNetlifyEnrollments === 'function') loadNetlifyEnrollments(); }

    if (sectionName === 'settings') {
        var session = DashboardEngine.getSession ? DashboardEngine.getSession() : null;
        if (session) {
            var nameEl = document.getElementById('profile-name');
            var emailEl = document.getElementById('profile-email');
            var roleEl = document.getElementById('acct-role');
            var sinceEl = document.getElementById('acct-since');
            if (nameEl) nameEl.value = session.name || '';
            if (emailEl) emailEl.value = session.email || '';
            if (roleEl) roleEl.textContent = session.role ? (session.role.charAt(0).toUpperCase()+session.role.slice(1)) : 'Admin';
            if (sinceEl) {
                var db = DashboardEngine.getDB ? DashboardEngine.getDB() : null;
                var userRecord = db && db.users && db.users[session.email];
                sinceEl.textContent = userRecord && userRecord.createdAt ? new Date(userRecord.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'Nov 2025';
            }
        }
    }

    if (window.lucide) lucide.createIcons();
}

function loadNetlifyEnrollments() {
    var container = document.getElementById('netlify-enrollments-list');
    if (!container) return;
    var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
    if (!pending.length) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">No pending web form submissions found.<br><span class="text-xs">Submissions appear here after parents complete the enrollment form on the website.</span></p>';
        return;
    }
    container.innerHTML = pending.map(function(enr, idx) {
        var children = enr.children || [];
        var childList = children.length ?
            children.map(function(c){ return (c.firstName||'') + ' ' + (c.lastName||'') + ' (' + (c.program||'?') + ')'; }).join(', ') :
            (enr.studentFirstName||'') + ' ' + (enr.studentLastName||'') + ' (' + (enr.program||'?') + ')';
        var submitted = enr.timestamp ? new Date(enr.timestamp).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '?';
        return '<div class="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 bg-white">' +
            '<div class="flex-1 min-w-0">' +
                '<p class="font-semibold text-gray-800 text-sm">' + (enr.parentName||'Parent') + ' &bull; ' + (enr.email||'') + ' &bull; ' + (enr.phone||'') + '</p>' +
                '<p class="text-sm text-gray-500 mt-0.5">Child/Children: ' + childList + '</p>' +
                '<p class="text-xs text-gray-400 mt-0.5">Submitted: ' + submitted + '</p>' +
            '</div>' +
            '<button onclick="importNetlifyEnrollment(' + idx + ')" class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shrink-0">Approve &amp; Add</button>' +
        '</div>';
    }).join('');
}

window.importNetlifyEnrollment = function(idx) {
    var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
    var enr = pending[idx];
    if (!enr) return;
    var children = enr.children || [];
    if (!children.length && enr.studentFirstName) {
        children = [{ firstName: enr.studentFirstName, lastName: enr.studentLastName, age: enr.studentAge, gender: enr.studentGender, experience: enr.experience, program: enr.program }];
    }
    // Generate random password — never hardcode defaults
    var chars2 = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@';
    var importTempPwd = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(function(b){return chars2[b%chars2.length];}).join('');
    var added = 0;
    children.forEach(function(child) {
        var studentData = { firstName: child.firstName, lastName: child.lastName, age: child.age, gender: child.gender, experience: child.experience, program: child.program, parentName: enr.parentName, parentEmail: enr.email, parentPhone: enr.phone, tutorName: '', classroomLink: '', status: 'active', remindersPaused: false };
        if (DashboardEngine.addStudent) DashboardEngine.addStudent(studentData);
        if (DashboardEngine.getDB && enr.email) {
            var db2 = DashboardEngine.getDB();
            if (db2.users && !db2.users[enr.email.toLowerCase()]) {
                if (DashboardEngine.addUser) DashboardEngine.addUser({ email: enr.email, name: enr.parentName, role: 'parent', password: importTempPwd });
            }
        }
        added++;
    });
    // Queue welcome email for admin review
    if (DashboardEngine.addToEmailQueue && enr.email) {
        DashboardEngine.addToEmailQueue({
            type: 'welcome',
            to: enr.email,
            recipientName: enr.parentName || 'Parent',
            subject: "Welcome to STEMulus — your child's coding journey starts!",
            htmlPreview: 'Welcome email for ' + (enr.parentName||'') + ' (' + enr.email + '). Temp password: ' + importTempPwd + '. Review before sending.',
            data: { parentEmail: enr.email, parentName: enr.parentName, studentName: children[0] ? (children[0].firstName+' '+children[0].lastName) : '', courseName: children[0] ? children[0].program : '', tempPassword: importTempPwd, classroomLink: '' },
            triggeredBy: 'netlify_enrollment_import'
        });
    }
    pending.splice(idx, 1);
    localStorage.setItem('stemulus_pending_enrollments', JSON.stringify(pending));
    if (typeof showToast === 'function') showToast(added + ' student(s) added. Welcome email queued — check Email Queue.', 'success');
    loadNetlifyEnrollments();
    if (typeof loadDashboardData === 'function') loadDashboardData();
};

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    var colorClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-amber-600' : 'bg-blue-600';
    toast.className = `px-6 py-3.5 rounded-xl shadow-xl text-white text-sm animate-fadeIn flex items-center gap-3 ${colorClass}`;
    toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5 shrink-0"></i>
            <span>${msg}</span>
        `;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => toast.remove(), 4000);
}

var currentReportFilter = 'all';
var currentReportSearchQuery = '';

function setMonthlyReportsFilter(filter) {
    currentReportFilter = filter;
    document.querySelectorAll('.admin-report-filter').forEach(btn => {
        const f = btn.getAttribute('data-filter');
        if (f === filter) {
            btn.className = 'admin-report-filter px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all';
        } else {
            btn.className = 'admin-report-filter px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all';
        }
    });
    loadTutorMonthlyReports();
}

function filterMonthlyReports(query) {
    currentReportSearchQuery = (query || '').toLowerCase().trim();
    loadTutorMonthlyReports();
}

function loadTutorMonthlyReports() {
    const container = document.getElementById('monthly-reports-list');
    const badge = document.getElementById('reports-count-badge');
    const navBadge = document.getElementById('reports-nav-badge');
    if (!container) return;

    let allReports = [];
    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getMonthlyReports) {
        allReports = DashboardEngine.getMonthlyReports();
    } else {
        try {
            allReports = JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]');
        } catch(e) { allReports = []; }
    }

    // Counts
    const countAll = allReports.length;
    const countPending = allReports.filter(r => (r.status === 'pending_review' || !r.status)).length;
    const countSent = allReports.filter(r => r.status === 'sent_to_parent').length;
    const countRejected = allReports.filter(r => r.status === 'rejected').length;

    const elCountAll = document.getElementById('rep-count-all');
    const elCountPending = document.getElementById('rep-count-pending');
    const elCountSent = document.getElementById('rep-count-sent');
    const elCountRejected = document.getElementById('rep-count-rejected');
    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountPending) elCountPending.textContent = countPending;
    if (elCountSent) elCountSent.textContent = countSent;
    if (elCountRejected) elCountRejected.textContent = countRejected;

    if (badge) {
        badge.textContent = countPending + ' pending';
        badge.classList.toggle('hidden', countPending === 0);
    }
    if (navBadge) {
        navBadge.textContent = countPending > 0 ? countPending : (countAll > 0 ? countAll : '');
        navBadge.classList.toggle('hidden', countAll === 0);
    }

    // Filter by status tab
    let filtered = allReports;
    if (currentReportFilter === 'pending_review') {
        filtered = filtered.filter(r => r.status === 'pending_review' || !r.status);
    } else if (currentReportFilter === 'sent_to_parent') {
        filtered = filtered.filter(r => r.status === 'sent_to_parent');
    } else if (currentReportFilter === 'rejected') {
        filtered = filtered.filter(r => r.status === 'rejected');
    }

    // Filter by text search query
    if (currentReportSearchQuery) {
        const q = currentReportSearchQuery;
        filtered = filtered.filter(r => {
            const sName = (r.studentName || '').toLowerCase();
            const tName = (r.tutorName || '').toLowerCase();
            const course = (r.course || '').toLowerCase();
            const month = (r.month || '').toLowerCase();
            const topics = (r.topics || '').toLowerCase();
            return sName.includes(q) || tName.includes(q) || course.includes(q) || month.includes(q) || topics.includes(q);
        });
    }

    if (!filtered.length) {
        const emptyMsg = currentReportSearchQuery
            ? 'No reports matching "' + currentReportSearchQuery + '".'
            : (currentReportFilter === 'pending_review' ? 'No reports currently pending review. All caught up!'
            : (currentReportFilter === 'sent_to_parent' ? 'No reports have been dispatched to parents yet.'
            : (currentReportFilter === 'rejected' ? 'No reports marked for revision.'
            : 'No monthly reports submitted yet.')));

        container.innerHTML = `
            <div class="glass-card rounded-2xl p-12 text-center text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4 opacity-40 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="font-bold text-slate-700 text-sm mb-1">${emptyMsg}</p>
                <p class="text-xs text-slate-400">Tutor submissions appear here automatically for review and PDF dispatch.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.slice().reverse().map(function(r) {
        const isPending = !r.status || r.status === 'pending_review';
        const isSent = r.status === 'sent_to_parent';
        const isRejected = r.status === 'rejected';

        const dateStr = r.month 
            ? new Date(r.month + '-01').toLocaleDateString('en-GB', {month:'long', year:'numeric'}) 
            : (r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-GB', {month:'long', year:'numeric'}) : 'Current Period');

        let statusBadge = '';
        if (isPending) {
            statusBadge = '<span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-extrabold px-3 py-1 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending Review</span>';
        } else if (isSent) {
            statusBadge = '<span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-full"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> Sent to Parent</span>';
        } else if (isRejected) {
            statusBadge = '<span class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-extrabold px-3 py-1 rounded-full"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-rose-600"></i> Needs Revision</span>';
        }

        const studentTitle = r.studentName 
            ? `<h4 class="font-extrabold text-base text-slate-800 font-nunito">${r.studentName}</h4>`
            : `<h4 class="font-extrabold text-base text-slate-800 font-nunito">${(r.students && r.students[0] && r.students[0].name) || 'Student Report'}</h4>`;

        const courseLabel = r.course || (r.students && r.students[0] && r.students[0].course) || 'Coding Track';
        const gradeBadge = r.overallGrade ? `<span class="bg-indigo-100 text-indigo-800 font-black text-xs px-2.5 py-0.5 rounded-lg border border-indigo-200">Grade: ${r.overallGrade}</span>` : '';
        const sessionsText = (r.sessionsAttended || r.totalSessions || (r.students && r.students[0] && r.students[0].sessionsAttended) || '?') + ' Sessions';

        return `
            <div class="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div class="p-5 border-b border-admin-border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="space-y-1.5">
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <span class="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">${dateStr}</span>
                            ${statusBadge}
                            ${gradeBadge}
                            <span class="text-[11px] text-gray-400 font-mono">${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            ${studentTitle}
                            <span class="text-xs text-slate-400">&bull;</span>
                            <span class="text-xs font-semibold text-slate-600">${courseLabel}</span>
                        </div>
                        <p class="text-xs text-slate-500">
                            Tutor: <strong class="text-slate-700">${r.tutorName || 'Faculty Instructor'}</strong> &nbsp;&bull;&nbsp;
                            Attendance: <strong class="text-slate-700">${sessionsText}</strong> &nbsp;&bull;&nbsp;
                            Engagement: <strong class="text-slate-700 capitalize">${(r.engagementLevel || 'Engaged').replace('-', ' ')}</strong>
                        </p>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap shrink-0">
                        <button type="button" onclick="AdminEngine.previewReportPDF('${r.id}')" class="px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center gap-1.5">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Clean PDF
                        </button>
                        ${isPending ? `
                            <button type="button" onclick="AdminEngine.openReportReviewModal('${r.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm">
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Review &amp; Edit
                            </button>
                            <button type="button" onclick="AdminEngine.quickApproveReport('${r.id}')" class="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm" title="Accept as is & dispatch PDF to parent">
                                <i data-lucide="send" class="w-3.5 h-3.5"></i> Accept &amp; Send
                            </button>
                            <button type="button" onclick="AdminEngine.promptRejectReport('${r.id}')" class="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5">
                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Redo
                            </button>
                        ` : ''}
                        ${isSent ? `
                            <button type="button" onclick="AdminEngine.openReportReviewModal('${r.id}')" class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                                <i data-lucide="sliders" class="w-3.5 h-3.5"></i> Re-edit &amp; Resend
                            </button>
                        ` : ''}
                        ${isRejected ? `
                            <button type="button" onclick="AdminEngine.openReportReviewModal('${r.id}')" class="px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5">
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Review Tutor Draft
                            </button>
                        ` : ''}
                        <button type="button" onclick="toggleReportDetails(this)" class="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors">
                            Details
                        </button>
                    </div>
                </div>

                <!-- Callout banners if rejected or sent -->
                ${isRejected ? `
                    <div class="bg-rose-50 border-b border-rose-100 px-5 py-2.5 text-xs text-rose-800 flex items-start gap-2">
                        <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
                        <div>
                            <strong>Revision Requested from Tutor:</strong>
                            <p class="mt-0.5 text-rose-700 italic font-medium">"${r.rejectionReason || 'Please expand details and resubmit.'}"</p>
                        </div>
                    </div>
                ` : ''}

                ${isSent ? `
                    <div class="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2 text-xs text-emerald-800 flex items-center justify-between gap-2">
                        <span class="flex items-center gap-2">
                            <i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>
                            Official evaluation report delivered to parent portal and email queue (${r.sentAt ? new Date(r.sentAt).toLocaleDateString('en-GB') : 'Delivered'}).
                        </span>
                        <span class="font-bold text-emerald-700 cursor-pointer hover:underline" onclick="AdminEngine.previewReportPDF('${r.id}')">View Official PDF &rarr;</span>
                    </div>
                ` : ''}

                <!-- Collapsible detail section -->
                <div class="report-details hidden p-5 space-y-4 bg-slate-50/60 border-t border-slate-100">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div class="bg-white p-3.5 rounded-xl border border-slate-200/70">
                            <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Topics Mastered</span>
                            <p class="text-slate-800 whitespace-pre-wrap">${r.topics || 'Not recorded'}</p>
                        </div>
                        <div class="bg-white p-3.5 rounded-xl border border-emerald-200/70 bg-emerald-50/30">
                            <span class="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-1"><span data-icon-3d="star" data-icon-size="14"></span> Strengths Observed</span>
                            <p class="text-slate-800 whitespace-pre-wrap">${r.strengths || r.achievements || 'Not recorded'}</p>
                        </div>
                        <div class="bg-white p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/30">
                            <span class="font-bold text-amber-700 uppercase tracking-wider text-[10px] block mb-1"><span data-icon-3d="target" data-icon-size="14"></span> Challenges &amp; Focus Areas</span>
                            <p class="text-slate-800 whitespace-pre-wrap">${r.challenges || r.supportNeeded || 'None noted'}</p>
                        </div>
                        <div class="bg-white p-3.5 rounded-xl border border-indigo-200/70 bg-indigo-50/30">
                            <span class="font-bold text-indigo-700 uppercase tracking-wider text-[10px] block mb-1"><span data-icon-3d="rocket" data-icon-size="14"></span> Next Month's Objectives</span>
                            <p class="text-slate-800 whitespace-pre-wrap">${r.recommendation || 'Continue steady progress'}</p>
                        </div>
                    </div>
                    ${r.directorNote ? `
                        <div class="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs">
                            <strong class="text-indigo-900 block uppercase text-[10px] tracking-wider mb-0.5">Academic Director Endorsement Note:</strong>
                            <p class="text-indigo-800 italic">"${r.directorNote}"</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

window.toggleReportDetails = function(btn) {
    var card = btn.closest('.glass-card');
    if (!card) return;
    var details = card.querySelector('.report-details');
    if (!details) return;
    var isHidden = details.classList.contains('hidden');
    details.classList.toggle('hidden', !isHidden);
    btn.textContent = isHidden ? 'Hide Details' : 'Details';
};

// ==================== ADMIN REPORT REVIEW & PDF MODAL ====================

function openReportReviewModal(id) {
    const reports = DashboardEngine.getMonthlyReports ? DashboardEngine.getMonthlyReports() : (JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]'));
    const r = reports.find(item => item.id === id);
    if (!r) {
        showToast('Report not found.', 'error');
        return;
    }

    const modal = document.getElementById('admin-report-review-modal');
    if (!modal) return;

    const dateStr = r.month 
        ? new Date(r.month + '-01').toLocaleDateString('en-GB', {month:'long', year:'numeric'}) 
        : 'Current Period';

    document.getElementById('rev-report-id').value = r.id;
    document.getElementById('rev-modal-title').textContent = `Review Evaluation: ${r.studentName || 'Student'}`;
    document.getElementById('rev-modal-subtitle').innerHTML = `Tutor: <strong>${r.tutorName || 'Faculty'}</strong> &middot; Period: <strong>${dateStr}</strong>`;
    
    document.getElementById('rev-student-name').textContent = r.studentName || '—';
    document.getElementById('rev-course-name').textContent = r.course || 'Coding Track';
    document.getElementById('rev-attendance-count').textContent = `${r.sessionsAttended || r.totalSessions || 0} Sessions`;
    document.getElementById('rev-total-hours').textContent = `${r.totalHours || 0} hrs`;

    document.getElementById('rev-overall-grade').value = r.overallGrade || 'A';
    document.getElementById('rev-engagement-level').value = r.engagementLevel || 'highly-engaged';
    document.getElementById('rev-topics').value = r.topics || '';
    document.getElementById('rev-strengths').value = r.strengths || r.achievements || '';
    document.getElementById('rev-challenges').value = r.challenges || r.supportNeeded || '';
    document.getElementById('rev-recommendation').value = r.recommendation || '';
    document.getElementById('rev-director-note').value = r.directorNote || `The Academic Board is delighted with ${r.studentName || 'the student'}'s dedication and problem-solving prowess throughout this period. Highly commendable work!`;

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function getReportReviewFormData() {
    return {
        overallGrade: document.getElementById('rev-overall-grade').value,
        engagementLevel: document.getElementById('rev-engagement-level').value,
        topics: document.getElementById('rev-topics').value.trim(),
        strengths: document.getElementById('rev-strengths').value.trim(),
        challenges: document.getElementById('rev-challenges').value.trim(),
        recommendation: document.getElementById('rev-recommendation').value.trim(),
        directorNote: document.getElementById('rev-director-note').value.trim()
    };
}

function previewCurrentReportPDF() {
    const id = document.getElementById('rev-report-id').value;
    const reports = DashboardEngine.getMonthlyReports ? DashboardEngine.getMonthlyReports() : (JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]'));
    const r = reports.find(item => item.id === id) || {};
    const formData = getReportReviewFormData();
    const previewData = Object.assign({}, r, formData);

    if (typeof StemulusReportPDF !== 'undefined') {
        StemulusReportPDF.open(previewData);
    } else {
        showToast('PDF Generator module loading...', 'warning');
    }
}

function previewReportPDF(id) {
    const reports = DashboardEngine.getMonthlyReports ? DashboardEngine.getMonthlyReports() : (JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]'));
    const r = reports.find(item => item.id === id);
    if (!r) {
        showToast('Report not found.', 'error');
        return;
    }
    if (typeof StemulusReportPDF !== 'undefined') {
        StemulusReportPDF.open(r);
    } else {
        showToast('PDF generator is initializing...', 'warning');
    }
}

function saveReportDraft() {
    const id = document.getElementById('rev-report-id').value;
    if (!id) return;
    const formData = getReportReviewFormData();
    DashboardEngine.updateMonthlyReport(id, formData);
    showToast('Report draft saved successfully.', 'success');
    loadTutorMonthlyReports();
}

function promptRejectReport(reportId) {
    const id = reportId || document.getElementById('rev-report-id').value;
    if (!id) return;

    const reason = prompt('Please enter revision feedback for the tutor (e.g., Please elaborate on the student\'s challenge or verify session count):');
    if (reason === null) return; // User cancelled
    const finalReason = reason.trim() || 'Please expand on student achievements and clarify next month\'s learning goals.';

    DashboardEngine.rejectMonthlyReport(id, finalReason);
    showToast('Report returned to tutor for revision with feedback.', 'warning');
    closeModal('admin-report-review-modal');
    loadTutorMonthlyReports();
}

function approveAndSendReport() {
    const id = document.getElementById('rev-report-id').value;
    if (!id) return;
    const formData = getReportReviewFormData();
    const result = DashboardEngine.approveAndSendMonthlyReport(id, formData);
    if (result) {
        showToast('Report approved! Clean PDF evaluation dispatched to parent.', 'success');
        closeModal('admin-report-review-modal');
        loadTutorMonthlyReports();
    } else {
        showToast('Error approving report.', 'error');
    }
}

function quickApproveReport(id) {
    if (!id) return;
    const result = DashboardEngine.approveAndSendMonthlyReport(id);
    if (result) {
        showToast('Report accepted! Dispatched to parent with official PDF evaluation.', 'success');
        loadTutorMonthlyReports();
    } else {
        showToast('Error approving report.', 'error');
    }
}

// ==================== 1-CLICK QUICK ONBOARD MODAL ====================

function openQuickOnboardModal() {
    const modal = document.getElementById('admin-quick-onboard-modal');
    if (!modal) return;

    // Reset forms and success box
    const sForm = document.getElementById('qo-student-form');
    const tForm = document.getElementById('qo-tutor-form');
    const successBox = document.getElementById('qo-success-box');
    if (sForm) sForm.reset();
    if (tForm) tForm.reset();
    if (successBox) successBox.classList.add('hidden');

    switchQuickOnboardTab('student');

    // Populate tutors select
    const tutorSelect = document.getElementById('qo-tutor-select');
    if (tutorSelect && typeof DashboardEngine !== 'undefined') {
        const db = DashboardEngine.getDB ? DashboardEngine.getDB() : {};
        const tutors = [];
        if (db.users) {
            Object.values(db.users).forEach(u => {
                if (u.role === 'tutor') tutors.push(u);
            });
        }
        if (tutors.length) {
            tutorSelect.innerHTML = tutors.map(t => `<option value="${t.name || t.email}">${t.name || t.email} (Faculty)</option>`).join('');
        } else {
            tutorSelect.innerHTML = '<option value="Sarah Jane">Sarah Jane (Lead Instructor)</option>';
        }
    }

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function switchQuickOnboardTab(tab) {
    const sForm = document.getElementById('qo-student-form');
    const tForm = document.getElementById('qo-tutor-form');
    const tabStudent = document.getElementById('qo-tab-student');
    const tabTutor = document.getElementById('qo-tab-tutor');
    const successBox = document.getElementById('qo-success-box');
    if (successBox) successBox.classList.add('hidden');

    if (tab === 'tutor') {
        if (sForm) sForm.classList.add('hidden');
        if (tForm) tForm.classList.remove('hidden');
        if (tabStudent) tabStudent.className = 'flex-1 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all text-center';
        if (tabTutor) tabTutor.className = 'flex-1 py-2 rounded-lg bg-white text-indigo-700 shadow-sm transition-all text-center font-bold';
    } else {
        if (sForm) sForm.classList.remove('hidden');
        if (tForm) tForm.classList.add('hidden');
        if (tabStudent) tabStudent.className = 'flex-1 py-2 rounded-lg bg-white text-indigo-700 shadow-sm transition-all text-center font-bold';
        if (tabTutor) tabTutor.className = 'flex-1 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all text-center';
    }
}

async function submitQuickOnboardStudent(e) {
    if (e) e.preventDefault();
    const parentName = document.getElementById('qo-parent-name').value.trim();
    const parentEmail = document.getElementById('qo-parent-email').value.trim();
    const parentPhone = (document.getElementById('qo-parent-phone') ? document.getElementById('qo-parent-phone').value.trim() : '');
    const childName = document.getElementById('qo-child-name').value.trim();
    const childAge = document.getElementById('qo-child-age').value.trim();
    const program = document.getElementById('qo-program').value;
    const tutorSelect = document.getElementById('qo-tutor-select');
    const tutorName = tutorSelect ? tutorSelect.value : 'Lead Instructor';

    if (!parentName || !parentEmail || !childName) {
        showToast('Please fill in parent name, parent email, and child name.', 'warning');
        return;
    }

    const result = await DashboardEngine.quickOnboardUser({
        type: 'student',
        name: parentName,
        email: parentEmail,
        phone: parentPhone,
        childName: childName,
        childAge: childAge,
        program: program,
        tutorName: tutorName
    });

    if (!result.success) {
        showToast(result.message || 'Error onboarding student.', 'error');
        return;
    }

    const outputEl = document.getElementById('qo-credential-output');
    const successBox = document.getElementById('qo-success-box');
    if (outputEl && successBox) {
        outputEl.innerHTML = `
            <div><strong>ACCOUNT TYPE:</strong> Parent &amp; Student Portal</div>
            <div><strong>PARENT LOGIN:</strong> ${result.parentEmail}</div>
            <div><strong>INITIAL PASSWORD:</strong> <span class="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">${result.tempPassword}</span></div>
            <div><strong>CHILD ROSTER:</strong> ${result.childName} (${result.program})</div>
            <div><strong>ASSIGNED TUTOR:</strong> ${result.tutorName}</div>
            <div><strong>CLASSROOM LINK:</strong> <a href="${result.classroomLink}" target="_blank" class="text-indigo-600 underline">${result.classroomLink}</a></div>
            <div class="text-[11px] text-gray-500 mt-2">&check; Account ready immediately. Temporary password generated.</div>
        `;
        successBox.classList.remove('hidden');
    }

    showToast(`Successfully onboarded ${childName}! Credentials ready.`, 'success');
    loadDashboardData();
    if (window.lucide) lucide.createIcons();
}

async function submitQuickOnboardTutor(e) {
    if (e) e.preventDefault();
    const tutorName = document.getElementById('qo-tutor-name').value.trim();
    const tutorEmail = document.getElementById('qo-tutor-email').value.trim();
    const tracks = (document.getElementById('qo-tutor-tracks') ? document.getElementById('qo-tutor-tracks').value.trim() : 'Python, Scratch, Robotics');

    if (!tutorName || !tutorEmail) {
        showToast('Please enter tutor name and email.', 'warning');
        return;
    }

    const result = await DashboardEngine.quickOnboardUser({
        type: 'tutor',
        name: tutorName,
        email: tutorEmail,
        program: tracks
    });

    if (!result.success) {
        showToast(result.message || 'Error onboarding tutor.', 'error');
        return;
    }

    const outputEl = document.getElementById('qo-credential-output');
    const successBox = document.getElementById('qo-success-box');
    if (outputEl && successBox) {
        outputEl.innerHTML = `
            <div><strong>ACCOUNT TYPE:</strong> STEMulus Tutor / Faculty Portal</div>
            <div><strong>TUTOR LOGIN:</strong> ${result.email}</div>
            <div><strong>INITIAL PASSWORD:</strong> <span class="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">${result.tempPassword}</span></div>
            <div><strong>TUTOR NAME:</strong> ${result.name}</div>
            <div><strong>PORTAL URL:</strong> https://stemuluskidstech.com/tutor-login.html</div>
            <div class="text-[11px] text-gray-500 mt-2">&check; Tutor credentials ready for login.</div>
        `;
        successBox.classList.remove('hidden');
    }

    showToast(`Tutor ${tutorName} onboarded successfully!`, 'success');
    loadDashboardData();
    if (window.lucide) lucide.createIcons();
}

function copyQuickOnboardCredentials() {
    const outputEl = document.getElementById('qo-credential-output');
    const copyBtn = document.getElementById('qo-copy-btn');
    if (!outputEl) return;

    const textToCopy = outputEl.innerText || outputEl.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            if (copyBtn) {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Copied to Clipboard!';
                if (window.lucide) lucide.createIcons();
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    if (window.lucide) lucide.createIcons();
                }, 2500);
            }
            showToast('Credentials copied to clipboard!', 'success');
        });
    } else {
        showToast('Clipboard access unavailable.', 'warning');
    }
}

// ==================== DATA LOADING ====================

function loadDashboardData() {
    loadStats();
    loadStudents();
    loadSchedules();
    loadProjects();
    loadCertificates();
    renderPendingRegistrations();
    renderRescheduleRequests();
    renderAttendanceApprovals();
    updatePendingAttendanceBadge();
    checkBirthdays();
    populateNotificationRecipients();
    loadTutorMonthlyReports();
    if (document.getElementById('email-queue-list')) loadEmailQueue();
    if (document.getElementById('password-resets-list')) loadPasswordResets();
    loadWeekSummary();
    loadTodaysClasses();
    loadNoticeBoard();
}

function loadWeekSummary() {
    var weekRange = document.getElementById('week-range-label');
    var wSessions = document.getElementById('week-sessions');
    var wPresent = document.getElementById('week-present');
    var wAbsent = document.getElementById('week-absent');
    var wPending = document.getElementById('week-pending');
    if (!wSessions) return;

    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun
    var startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0,0,0,0);
    var endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (weekRange) {
        weekRange.textContent = startOfWeek.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ' – ' + endOfWeek.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    }

    var schedules = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
    var weekSessions = schedules.filter(function(s) {
        if (!s.date) return false;
        var d = new Date(s.date);
        return d >= startOfWeek && d <= endOfWeek;
    });

    var present = weekSessions.filter(function(s){ return s.attendanceStatus === 'present'; }).length;
    var absent = weekSessions.filter(function(s){ return s.attendanceStatus === 'absent'; }).length;
    var pending = weekSessions.filter(function(s){ return !s.attendanceStatus || s.attendanceStatus === 'pending'; }).length;

    if (wSessions) wSessions.textContent = weekSessions.length || '0';
    if (wPresent) wPresent.textContent = present || '0';
    if (wAbsent) wAbsent.textContent = absent || '0';
    if (wPending) wPending.textContent = pending || '0';
}

// ==================== TODAY'S CLASSES & NOTICE BOARD ====================

function loadTodaysClasses() {
    var list = document.getElementById('todays-classes-list');
    var dateLabel = document.getElementById('today-classes-date');
    if (!list) return;
    var today = new Date().toISOString().split('T')[0];
    if (dateLabel) dateLabel.textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
    var schedules = DashboardEngine.getSchedules ? DashboardEngine.getSchedules() : [];
    var todayClasses = schedules.filter(function(s){ return s.date===today; }).sort(function(a,b){ return (a.time||'').localeCompare(b.time||''); });
    if (!todayClasses.length) { list.innerHTML='<p class="text-gray-400 text-sm text-center py-4">No classes scheduled today.</p>'; return; }
    list.innerHTML = todayClasses.map(function(s){
        var statusColor = s.attendanceStatus==='present'?'text-emerald-600':s.attendanceStatus==='absent'?'text-rose-500':'text-amber-600';
        var statusLabel = s.attendanceStatus==='present'?'Completed':s.attendanceStatus==='absent'?'Absent':'Upcoming';
        var joinLink = s.link||'https://meet.google.com/new';
        return '<div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">'+
            '<div class="text-xs font-bold text-gray-500 w-14 shrink-0">'+(s.time||'—')+'</div>'+
            '<div class="flex-1 min-w-0"><p class="font-semibold text-gray-800 text-sm truncate">'+(s.studentName||'Student')+'</p><p class="text-xs text-gray-400 truncate">Tutor: '+(s.mentor||s.tutorName||'—')+'</p></div>'+
            '<div class="flex items-center gap-2 shrink-0">'+
                '<span class="text-xs font-bold '+statusColor+'">'+statusLabel+'</span>'+
                '<a href="'+joinLink+'" target="_blank" class="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg transition-colors">Join</a>'+
            '</div></div>';
    }).join('');
}

window.saveNotice = function() {
    var title = (document.getElementById('notice-title-input')||{}).value||'';
    var body = (document.getElementById('notice-body-input')||{}).value||'';
    if (!title.trim()) return;
    var db = DashboardEngine.getDB ? DashboardEngine.getDB() : null;
    if (!db) return;
    if (!db.notices) db.notices = [];
    db.notices.unshift({ id:'ntc-'+Date.now(), title:title.trim(), body:body.trim(), createdAt:new Date().toISOString() });
    DashboardEngine.saveDB(db);
    document.getElementById('create-notice-form').classList.add('hidden');
    document.getElementById('notice-title-input').value='';
    document.getElementById('notice-body-input').value='';
    loadNoticeBoard();
    showToast('Notice posted','success');
};

function loadNoticeBoard() {
    var list = document.getElementById('notice-board-list');
    if (!list) return;
    var db = DashboardEngine.getDB ? DashboardEngine.getDB() : {};
    var notices = (db.notices||[]).slice(0,5);
    if (!notices.length) { list.innerHTML='<p class="text-gray-400 text-sm">No notices yet.</p>'; return; }
    list.innerHTML = notices.map(function(n){ return '<div class="bg-indigo-50 rounded-lg p-3"><p class="font-semibold text-indigo-800 text-sm">'+n.title+'</p>'+(n.body?'<p class="text-indigo-600 text-xs mt-0.5">'+n.body+'</p>':'')+'<p class="text-indigo-400 text-xs mt-1">'+new Date(n.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})+'</p></div>'; }).join('');
    var createNoticeBtn = document.getElementById('create-notice-btn');
    if (createNoticeBtn && !createNoticeBtn._wired) {
        createNoticeBtn._wired = true;
        createNoticeBtn.addEventListener('click', function(){ document.getElementById('create-notice-form').classList.toggle('hidden'); });
    }
}

// ==================== EMAIL QUEUE ====================

function loadEmailQueue() {
  var queueList = document.getElementById('email-queue-list');
  var historyList = document.getElementById('email-history-list');
  var badge = document.getElementById('queue-count-badge');
  var navBadge = document.getElementById('nav-queue-badge');
  if (!queueList) return;

  var queue = DashboardEngine.getEmailQueue ? DashboardEngine.getEmailQueue() : [];
  var history = DashboardEngine.getEmailHistory ? DashboardEngine.getEmailHistory() : [];

  // Update badges
  if (badge) { badge.textContent = queue.length + ' pending'; badge.classList.toggle('hidden', queue.length === 0); }
  if (navBadge) { navBadge.textContent = queue.length; navBadge.classList.toggle('hidden', queue.length === 0); }

  if (!queue.length) {
    queueList.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No emails pending review.</p>';
  } else {
    queueList.innerHTML = queue.map(function(item) {
      var typeLabels = { welcome: 'Parent Welcome', 'tutor-welcome': 'Tutor Welcome', 'certificate-delivery': 'Certificate', 'credentials-reset': 'Password Reset', custom: 'Custom Message' };
      var typeLabel = typeLabels[item.type] || item.type;
      var typeColor = item.type === 'welcome' || item.type === 'tutor-welcome' ? 'bg-blue-100 text-blue-700' : item.type === 'certificate-delivery' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
      return '<div class="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="inline-block text-xs font-bold px-2 py-0.5 rounded ' + typeColor + '">' + typeLabel + '</span>' +
            '<span class="text-xs text-gray-400">' + new Date(item.createdAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</span>' +
          '</div>' +
          '<p class="font-semibold text-gray-800 text-sm truncate">To: ' + (item.recipientName || item.to) + ' &lt;' + item.to + '&gt;</p>' +
          '<p class="text-sm text-gray-500 mt-0.5 truncate">Subject: ' + (item.editedSubject || item.subject) + '</p>' +
          '<p class="text-xs text-gray-400 mt-0.5">Triggered by: ' + (item.triggeredBy || 'manual') + '</p>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0">' +
          '<button onclick="previewQueuedEmail(\'' + item.id + '\')" class="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-lg transition-colors">Preview</button>' +
          '<button onclick="sendQueuedEmail(\'' + item.id + '\')" class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors">Send Now</button>' +
          '<button onclick="cancelQueuedEmail(\'' + item.id + '\')" class="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg transition-colors">Cancel</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  if (historyList) {
    if (!history.length) {
      historyList.innerHTML = '<p class="text-gray-400 text-sm">No emails sent yet.</p>';
    } else {
      historyList.innerHTML = history.slice(-20).reverse().map(function(item) {
        var statusClass = item.status === 'sent' ? 'text-emerald-600' : 'text-gray-400';
        return '<div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">' +
          '<span class="text-xs font-bold ' + statusClass + ' w-16 shrink-0">' + item.status.toUpperCase() + '</span>' +
          '<span class="text-sm text-gray-600 flex-1 truncate">' + (item.recipientName||item.to) + ' — ' + (item.editedSubject||item.subject) + '</span>' +
          '<span class="text-xs text-gray-400 shrink-0">' + (item.sentAt ? new Date(item.sentAt).toLocaleDateString('en-GB') : '') + '</span>' +
        '</div>';
      }).join('');
    }
  }
}

window.sendQueuedEmail = async function(id) {
  var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
  if (!db) return;
  var item = (db.emailQueue||[]).find(function(e){ return e.id===id; });
  if (!item) return;

  var btn = event.target;
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

  try {
    var payload;
    if (item.type === 'welcome') {
      payload = { type: 'welcome', data: item.data };
    } else if (item.type === 'certificate-delivery') {
      payload = { type: 'certificate-delivery', data: item.data };
    } else if (item.type === 'credentials-reset') {
      payload = { type: 'credentials-reset', data: item.data };
    } else {
      payload = { type: 'custom', data: { to: item.to, subject: item.editedSubject||item.subject, body: item.editedBody||item.htmlPreview } };
    }

    var resp = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var json = await resp.json();

    item.status = 'sent';
    item.sentAt = new Date().toISOString();
    if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
    if (typeof showToast === 'function') showToast('Email sent to ' + (item.recipientName||item.to), 'success');
    loadEmailQueue();
  } catch(err) {
    if (btn) { btn.textContent = 'Send Now'; btn.disabled = false; }
    if (typeof showToast === 'function') showToast('Failed to send email: ' + err.message, 'error');
  }
};

window.cancelQueuedEmail = function(id) {
  if (DashboardEngine.cancelQueuedEmail) DashboardEngine.cancelQueuedEmail(id);
  loadEmailQueue();
  if (typeof showToast === 'function') showToast('Email cancelled', 'info');
};

window.previewQueuedEmail = function(id) {
  var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
  if (!db) return;
  var item = (db.emailQueue||[]).find(function(e){ return e.id===id; });
  if (!item) return;
  var win = window.open('','_blank','width=700,height=600');
  win.document.write('<html><head><title>Email Preview: '+item.subject+'</title></head><body style="margin:0;font-family:sans-serif;"><div style="padding:20px;background:#f8fafc;min-height:100vh;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"><h3 style="margin:0 0 8px;color:#1e293b;">'+item.subject+'</h3><p style="color:#64748b;font-size:0.875rem;margin:0 0 16px;">To: '+item.to+'</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"><pre style="white-space:pre-wrap;font-family:inherit;color:#374151;">'+item.htmlPreview+'</pre></div></div></body></html>');
  win.document.close();
};

// ==================== PASSWORD RESETS ====================

function loadPasswordResets() {
  var list = document.getElementById('password-resets-list');
  var navBadge = document.getElementById('nav-reset-badge');
  if (!list) return;
  var reqs = DashboardEngine.getPendingPasswordResets ? DashboardEngine.getPendingPasswordResets() : [];
  if (navBadge) { navBadge.textContent = reqs.length; navBadge.classList.toggle('hidden', reqs.length === 0); }
  if (!reqs.length) {
    list.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No pending password reset requests.</p>';
    return;
  }
  list.innerHTML = reqs.map(function(req) {
    return '<div class="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">' +
      '<div>' +
        '<p class="font-semibold text-gray-800">' + req.email + '</p>' +
        '<p class="text-xs text-gray-400 mt-0.5">Requested: ' + new Date(req.requestedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</p>' +
      '</div>' +
      '<button onclick="adminResetAndSend(\'' + req.id + '\',\'' + req.email + '\')" class="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors">Reset & Send</button>' +
    '</div>';
  }).join('');
}

window.adminResetAndSend = async function(reqId, email) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  var newPwd = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function(b){return chars[b%chars.length];}).join('');
  if (DashboardEngine.resolvePasswordReset) DashboardEngine.resolvePasswordReset(reqId, newPwd);
  try {
    await fetch('/.netlify/functions/send-email', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type:'credentials-reset', data:{ to:email, recipientEmail:email, newPassword:newPwd, portalUrl:'https://stemuluskidstech.com/parent-login.html' }})
    });
    if (typeof showToast === 'function') showToast('New credentials sent to ' + email, 'success');
  } catch(e) {
    if (typeof showToast === 'function') showToast('Reset saved but email failed — new password: ' + newPwd, 'warning');
  }
  loadPasswordResets();
};

function loadStats() {
    const students = DashboardEngine.getStudents();
    const enrollments = DashboardEngine.getEnrollments().filter(e => e.status === 'pending'); // Pending enrollments awaiting admin approval
    const schedules = DashboardEngine.getSchedules();

    const statStudents = document.getElementById('stat-total-students');
    if (statStudents) statStudents.textContent = students.length;

    const statPending = document.getElementById('stat-pending-emails');
    if (statPending) statPending.textContent = enrollments.length;

    const statUpcoming = document.getElementById('stat-upcoming-classes');
    if (statUpcoming) statUpcoming.textContent = schedules.filter(function(s) { return new Date(s.date + 'T' + (s.time || '00:00')) > new Date(); }).length;

    const statCourses = document.getElementById('stat-active-courses');
    if (statCourses) statCourses.textContent = "6"; // Standard programs count
}

// ==================== BIRTHDAY NOTIFICATIONS ====================

async function checkBirthdays() {
    const students = DashboardEngine.getStudents();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayMMDD = today.substring(5);                 // MM-DD

    const birthdayStudents = students.filter(s => {
        if (!s.birthday) return false;
        return s.birthday.substring(5) === todayMMDD;
    });

    const dashboardSection = document.getElementById('section-dashboard');
    const oldAlert = document.getElementById('admin-birthday-alert');
    if (oldAlert) oldAlert.remove();

    if (birthdayStudents.length === 0 || !dashboardSection) return;

    // Auto-fire NTFY for each student not yet alerted today
    for (const student of birthdayStudents) {
        const sentKey = `stemulus_bday_sent_${today}_${student.id}`;
        if (!localStorage.getItem(sentKey)) {
            await DashboardEngine.triggerBirthdayNtfy(student);
            localStorage.setItem(sentKey, '1');
        }
    }

    // Show banner for first birthday student (with re-send option)
    const student = birthdayStudents[0];
    const sentKey = `stemulus_bday_sent_${today}_${student.id}`;
    const alreadySent = !!localStorage.getItem(sentKey);

    const alertPanel = document.createElement('div');
    alertPanel.id = 'admin-birthday-alert';
    alertPanel.className = 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-orange-500/20 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn';
    alertPanel.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-2xl shrink-0">
                    <span data-icon-3d="cake" data-icon-size="28"></span>
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 text-base">Student Birthday Today!</h4>
                    <p class="text-xs text-gray-500">It is <strong class="text-orange-600 font-bold">${student.firstName} ${student.lastName}</strong>'s birthday today (Age ${student.age}). Push alert sent automatically.</p>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <span class="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Alert Sent
                </span>
                <button onclick="AdminEngine.sendBirthdayNotification('${student.id}')"
                    class="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Re-send
                </button>
            </div>
        `;

    const statsGrid = dashboardSection.querySelector('div.grid');
    if (statsGrid) {
        statsGrid.parentNode.insertBefore(alertPanel, statsGrid.nextSibling);
    }
    if (window.lucide) lucide.createIcons();
}

async function sendBirthdayNotification(studentId) {
    const student = DashboardEngine.getStudents().find(s => s.id === studentId);
    if (!student) return;

    const res = await DashboardEngine.triggerBirthdayNtfy(student);
    if (res.success) {
        showToast(`Birthday push alert re-sent for ${student.firstName}!`, 'success');
    } else {
        showToast('Failed to send birthday push alert.', 'warning');
    }
}

// ==================== PENDING REGISTRATIONS ====================

function renderPendingRegistrations() {
    const container = document.getElementById('recent-students-list'); // Re-use recent students for registrations
    if (!container) return;

    const enrollments = DashboardEngine.getEnrollments().filter(e => e.status === 'pending');

    if (enrollments.length === 0) {
        container.innerHTML = `
                <div class="text-center py-6 text-gray-400">
                    <i data-lucide="smile" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
                    <p class="text-sm">No pending registrations to process.</p>
                </div>
            `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = `
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending Student Registrations (${enrollments.length})</div>
            <div class="space-y-3">
                ${enrollments.map(e => `
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p class="text-sm font-bold text-gray-800">${e.studentFirstName} ${e.studentLastName}</p>
                            <p class="text-xs text-gray-500">${e.program} • Age ${e.studentAge} ${e.studentBirthday ? `(DOB: ${e.studentBirthday})` : ''} • Exp: ${e.experience}</p>
                            ${e.studentEmail ? `<p class="text-xs text-gray-500 mt-0.5">Child's Email: ${e.studentEmail}</p>` : ''}
                            <p class="text-[10px] text-gray-400 mt-1.5">
                                ${e.fatherName ? `Father: ${e.fatherName} (${e.fatherPhone})` : ''}
                                ${e.fatherName && e.motherName ? ' &nbsp;·&nbsp; ' : ''}
                                ${e.motherName ? `Mother: ${e.motherName} (${e.motherPhone})` : ''}
                                ${!e.fatherName && !e.motherName ? `Parent: ${e.parentName} (${e.phone})` : ''}
                                &nbsp;·&nbsp; Email: ${e.email}
                            </p>
                        </div>
                        <button onclick="AdminEngine.approveRegistration('${e.id}')"
                            class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all self-end md:self-auto shadow-md">
                            Approve Registration
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    if (window.lucide) lucide.createIcons();
}

async function approveRegistration(id) {
    const success = await DashboardEngine.approveEnrollment(id);
    if (success) {
        showToast('Enrollment approved! Student is registered and onboarding initialized.', 'success');
        loadDashboardData();
    } else {
        showToast('Failed to approve enrollment.', 'warning');
    }
}

// ==================== RESCHEDULE REQUESTS ====================

function renderRescheduleRequests() {
    const dashboardSection = document.getElementById('section-dashboard');
    if (!dashboardSection) return;

    const requests = DashboardEngine.getRescheduleRequests().filter(r => r.status === 'pending');

    // Remove old reschedule section if present
    const oldSection = document.getElementById('admin-reschedule-section');
    if (oldSection) oldSection.remove();

    if (requests.length === 0) return;

    const resSection = document.createElement('div');
    resSection.id = 'admin-reschedule-section';
    resSection.className = 'w-full glass-card rounded-2xl p-5 sm:p-6 mt-6 border border-slate-200 bg-white shadow-sm';
    resSection.innerHTML = `
            <h3 class="text-base sm:text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <i data-lucide="calendar-range" class="w-5 h-5 text-orange-500"></i>
                Pending Schedule Adjustments (${requests.length})
            </h3>
            <div class="space-y-3">
                ${requests.map(r => `
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 animate-fadeIn">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                            <p class="text-sm font-bold text-slate-900">${r.studentName} — <span class="text-slate-600 font-semibold">${r.course}</span></p>
                            <span class="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 self-start sm:self-auto">Pending Approval</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                                <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Current Schedule</span>
                                <span class="line-through text-rose-500 font-medium">${r.currentDate} at ${r.currentTime}</span>
                            </div>
                            <div class="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                                <span class="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">Requested Change</span>
                                <span class="font-bold text-emerald-800">${r.requestedDate} at ${r.requestedTime}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 mt-1 flex-wrap">
                            <button onclick="AdminEngine.approveScheduleAdjust('${r.id}')"
                                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex-1 sm:flex-none text-center inline-flex items-center justify-center gap-1.5">
                                <i data-lucide="check" class="w-3.5 h-3.5"></i> Approve
                            </button>
                            <button onclick="AdminEngine.declineScheduleAdjust('${r.id}')"
                                class="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors flex-1 sm:flex-none text-center inline-flex items-center justify-center gap-1.5">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i> Decline
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    // Insert before schedules or after recent students
    const container = dashboardSection.querySelector('div.grid-cols-1') || dashboardSection;
    if (container) {
        container.appendChild(resSection);
    }
    if (window.lucide) lucide.createIcons();
}

function approveScheduleAdjust(id) {
    if (DashboardEngine.approveReschedule(id)) {
        showToast('Schedule adjustment approved and updated.', 'success');
        loadDashboardData();
    }
}

function declineScheduleAdjust(id) {
    if (DashboardEngine.declineReschedule(id)) {
        showToast('Schedule adjustment declined.', 'info');
        loadDashboardData();
    }
}

// ==================== ATTENDANCE APPROVALS ====================

function renderAttendanceApprovals() {
    const listContainer = document.getElementById('admin-attendance-list');
    if (!listContainer) return;

    const records = DashboardEngine.getAttendanceRecords();
    const pendingRecords = records.filter(r => r.status === 'pending');

    if (pendingRecords.length === 0) {
        listContainer.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-slate-400">No pending attendance logs to review.</td>
                </tr>
            `;
        return;
    }

    // Sort descending by timestamp
    pendingRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listContainer.innerHTML = pendingRecords.map(r => {
        const dateObj = new Date(r.classDate);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Format Time (12h format)
        const [hh, mm] = r.classTime.split(':');
        let h = parseInt(hh);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const formattedTime = `${h}:${mm} ${ampm}`;

        const typeLabel = r.isStandIn
            ? '<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Stand-in</span>'
            : (r.isRescheduled
                ? '<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Rescheduled</span>'
                : '<span class="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Regular</span>');

        return `
                <tr class="border-b border-admin-border hover:bg-slate-50/50">
                    <td class="p-3 text-sm font-medium">
                        <div>${formattedDate}</div>
                        <div class="text-xs text-slate-400">${formattedTime}</div>
                    </td>
                    <td class="p-3 text-sm font-semibold">${r.tutorName}</td>
                    <td class="p-3 text-sm font-semibold">${r.studentName}</td>
                    <td class="p-3 text-sm">
                        <div class="font-medium">${r.topic}</div>
                        <div class="text-xs text-slate-400">${r.coursesCovered.join(', ')}</div>
                    </td>
                    <td class="p-3 text-sm">${r.duration} mins</td>
                    <td class="p-3 text-sm">${typeLabel}</td>
                    <td class="p-3 text-sm">
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                    </td>
                    <td class="p-3 text-sm text-right space-x-2">
                        <button onclick="AdminEngine.processAttendance('${r.id}', 'approved')" 
                                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                            Approve
                        </button>
                        <button onclick="AdminEngine.processAttendance('${r.id}', 'rejected')" 
                                class="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                            Reject
                        </button>
                    </td>
                </tr>
            `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function updatePendingAttendanceBadge() {
    const records = DashboardEngine.getAttendanceRecords();
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('pending-attendance-badge');
    if (badge) {
        badge.textContent = pendingCount;
        if (pendingCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function processAttendance(id, status) {
    const res = DashboardEngine.updateAttendanceStatus(id, status);
    if (res) {
        showToast(`Attendance log ${status}!`, 'success');
        loadDashboardData();
    } else {
        showToast('Failed to update attendance status', 'warning');
    }
}

// ==================== STUDENTS CRUD ====================

function loadStudents() {
    studentsCache = DashboardEngine.getStudents();
    renderStudentsTable(studentsCache);
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-400">No students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => `
            <tr class="hover:bg-gray-50 border-b border-gray-200 text-gray-800">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full ${s.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white font-bold text-xs">
                            ${s.firstName[0]}
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 text-sm">${s.firstName} ${s.lastName}</p>
                            <p class="text-[10px] text-gray-400">${s.gender || 'Unknown'} • Age ${s.age || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-xs font-bold text-gray-800">${s.parentName}</p>
                    <p class="text-[10px] text-gray-400">${s.parentPhone || ''}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">${s.program}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-1.5 text-xs text-gray-500">
                        <i data-lucide="user" class="w-3.5 h-3.5 text-gray-400"></i> ${s.tutorName || 'Unassigned'}
                    </div>
                </td>
                <td class="px-6 py-4">
                     <span class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${s.status || 'Active'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="text-gray-400 hover:text-admin-accent transition-colors p-1" onclick="AdminEngine.editStudent('${s.id}')" title="Edit Student">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button class="text-gray-400 hover:text-red-500 transition-colors p-1" onclick="AdminEngine.deleteStudent('${s.id}')" title="Delete Student">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        <button class="text-xs px-2 py-1 rounded-lg border transition-colors ${s.remindersPaused ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}" onclick="if(DashboardEngine.setRemindersPaused){DashboardEngine.setRemindersPaused('${s.id}',${!s.remindersPaused});AdminEngine.reloadData();}" title="${s.remindersPaused ? 'Reminders paused — click to resume' : 'Click to pause reminders'}">${s.remindersPaused ? 'Unmute' : 'Mute'}</button>
                    </div>
                </td>
            </tr>
        `).join('');
    if (window.lucide) lucide.createIcons();
}

function populateTutorsDropdown() {
    const select = document.getElementById('student-tutor');
    if (!select) return;
    const tutors = DashboardEngine.getTutors();
    select.innerHTML = '<option value="">-- Select Tutor --</option>' +
        tutors.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
}

function openStudentModal(studentId = null) {
    populateTutorsDropdown();
    const modal = document.getElementById('student-modal');
    const title = document.getElementById('student-modal-title');
    const form = document.getElementById('student-form');
    if (form) form.reset();

    const idInput = document.getElementById('student-id');
    if (idInput) idInput.value = studentId || '';

    if (studentId) {
        if (title) title.textContent = 'Edit Student';
        const student = studentsCache.find(s => s.id === studentId);
        if (student) {
            if (document.getElementById('student-name')) {
                document.getElementById('student-name').value = `${student.firstName} ${student.lastName}`.trim();
            }
            if (document.getElementById('student-age')) document.getElementById('student-age').value = student.age || '';
            if (document.getElementById('student-email')) document.getElementById('student-email').value = student.email || '';
            if (document.getElementById('student-phone')) document.getElementById('student-phone').value = student.phone || '';
            if (document.getElementById('parent-name')) document.getElementById('parent-name').value = student.parentName || '';
            if (document.getElementById('parent-email')) document.getElementById('parent-email').value = student.parentEmail || '';
            if (document.getElementById('parent-phone')) document.getElementById('parent-phone').value = student.parentPhone || '';
            if (document.getElementById('student-course')) document.getElementById('student-course').value = student.program || '';
            if (document.getElementById('student-status')) document.getElementById('student-status').value = student.status || 'active';
            if (document.getElementById('student-tutor')) document.getElementById('student-tutor').value = student.tutorName || '';
            if (document.getElementById('student-notes')) document.getElementById('student-notes').value = student.notes || '';
            var classroomInput = document.getElementById('student-classroom-link');
            if (classroomInput) classroomInput.value = student.classroomLink || '';
        }
    } else {
        if (title) title.textContent = 'Add New Student';
        var classroomInput = document.getElementById('student-classroom-link');
        if (classroomInput) classroomInput.value = '';
    }

    if (modal) modal.classList.remove('hidden');
}

function editStudent(id) {
    openStudentModal(id);
}

function saveStudent(e) {
    e.preventDefault();

    const id = document.getElementById('student-id').value;
    const nameVal = document.getElementById('student-name').value.trim();
    const nameParts = nameVal.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const age = parseInt(document.getElementById('student-age').value) || 0;
    const email = document.getElementById('student-email') ? document.getElementById('student-email').value.trim() : '';
    const phone = document.getElementById('student-phone') ? document.getElementById('student-phone').value.trim() : '';

    const parentName = document.getElementById('parent-name').value.trim();
    const parentEmail = document.getElementById('parent-email').value.trim();
    const parentPhone = document.getElementById('parent-phone').value.trim();

    const program = document.getElementById('student-course').value;
    const status = document.getElementById('student-status').value;
    const tutorName = document.getElementById('student-tutor').value;
    const notes = document.getElementById('student-notes') ? document.getElementById('student-notes').value.trim() : '';
    const classroomLink = (document.getElementById('student-classroom-link') || {}).value || '';

    if (!firstName || !parentName || !parentEmail || !program || !tutorName) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    const studentData = {
        firstName,
        lastName,
        age,
        email,
        phone,
        parentName,
        parentEmail,
        parentPhone,
        program,
        status,
        tutorName,
        notes,
        classroomLink
    };

    if (id) {
        studentData.id = id;
        const updated = DashboardEngine.updateStudent(studentData);
        if (updated) {
            showToast('Student updated successfully!', 'success');
        } else {
            showToast('Failed to update student.', 'error');
        }
    } else {
        studentData.progress = 0;
        studentData.avatarColor = getRandomAvatarColor();
        studentData.birthday = new Date(Date.now() - age * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        studentData.skills = { logic: 50, loops: 50, variables: 50, syntax: 50, projects: 50 };
        studentData.metrics = { attended: 0, total: 12, projects: 0, lines: 0 };

        const added = DashboardEngine.addStudent(studentData);
        if (added) {
            showToast('Student registered successfully!', 'success');
            if (studentData.parentEmail) {
                var db2 = DashboardEngine.getDB ? DashboardEngine.getDB() : null;
                if (db2 && db2.users && !db2.users[studentData.parentEmail.toLowerCase()]) {
                    // Generate a random temporary password (never hardcode)
                    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@';
                    var tempPwd = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(function(b){return chars[b%chars.length];}).join('');
                    DashboardEngine.addUser ? DashboardEngine.addUser({ email: studentData.parentEmail, name: studentData.parentName || 'Parent', role: 'parent', password: tempPwd }) : null;
                    // Queue welcome email for admin review before sending (consistent with our email vetting policy)
                    if (DashboardEngine.addToEmailQueue) {
                        DashboardEngine.addToEmailQueue({
                            type: 'welcome',
                            to: studentData.parentEmail,
                            recipientName: studentData.parentName || 'Parent',
                            subject: 'Welcome to STEMulus — ' + (studentData.firstName||'') + "'s coding journey starts!",
                            htmlPreview: 'Welcome email for ' + (studentData.parentName||'') + ' — portal credentials inside. Temp password: ' + tempPwd,
                            data: {
                                parentEmail: studentData.parentEmail,
                                parentName: studentData.parentName || 'Parent',
                                studentName: (studentData.firstName||'') + ' ' + (studentData.lastName||''),
                                courseName: studentData.program || '',
                                tempPassword: tempPwd,
                                classroomLink: studentData.classroomLink || ''
                            },
                            triggeredBy: 'manual_student_add'
                        });
                        showToast('Student added. Welcome email queued for review — check Email Queue.', 'success');
                    }
                }
            }
            var savedStudent = (typeof added === 'object' && added) ? added : studentData;
            var nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
            var scheduleDate = nextWeek.toISOString().split('T')[0];
            DashboardEngine.addSchedule({
                studentId: savedStudent.id || savedStudent.studentId || '',
                studentName: (studentData.firstName || '') + ' ' + (studentData.lastName || ''),
                mentor: studentData.tutorName || studentData.tutor || '',
                tutorEmail: studentData.tutorEmail || '',
                program: studentData.program || '',
                date: scheduleDate,
                time: '16:00',
                attendanceStatus: 'pending',
                notes: 'Auto-scheduled on enrollment'
            });
        } else {
            showToast('Failed to add student.', 'error');
        }
    }

    closeModal('student-modal');
    loadDashboardData();
}

function getRandomAvatarColor() {
    const colors = ['bg-blue-500', 'bg-sky-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500', 'bg-pink-500', 'bg-amber-500', 'bg-indigo-500'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student and revoke portal access?')) return;
    DashboardEngine.deleteStudent(id);
    showToast('Student record deleted.', 'success');
    loadDashboardData();
}

function filterStudents(query, course, status) {
    const searchEl = document.getElementById('student-search') || document.getElementById('global-search');
    const q = (query !== undefined ? query : (searchEl ? searchEl.value : '')).toLowerCase();
    const filterCourseEl = document.getElementById('filter-course');
    const filterStatusEl = document.getElementById('filter-status');
    const c = course !== undefined ? course : (filterCourseEl ? filterCourseEl.value : '');
    const st = status !== undefined ? status : (filterStatusEl ? filterStatusEl.value : '');

    const filtered = studentsCache.filter(s => {
        const matchQuery = !q || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || (s.parentEmail || '').toLowerCase().includes(q);
        const matchCourse = !c || (s.program || '').toLowerCase().includes(c.replace(/-/g, ' ').toLowerCase()) || (s.program || '').toLowerCase().replace(/\s+/g, '-') === c;
        const matchStatus = !st || (s.status || 'active') === st;
        return matchQuery && matchCourse && matchStatus;
    });
    renderStudentsTable(filtered);
}

function exportStudentsCSV() {
    const headers = ['First Name', 'Last Name', 'Age', 'Email', 'Phone', 'Parent Name', 'Parent Email', 'Parent Phone', 'Course', 'Status', 'Tutor', 'Progress', 'Enrolled'];
    const rows = studentsCache.map(s => [
        s.firstName, s.lastName, s.age, s.email || '', s.phone || '',
        s.parentName || '', s.parentEmail || '', s.parentPhone || '',
        s.program || '', s.status || 'active', s.tutorName || '',
        (s.progress || 0) + '%', s.enrolledDate || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stemulus-students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${studentsCache.length} students to CSV.`, 'success');
}

// ==================== SCHEDULES CRUD ====================

function loadSchedules() {
    const schedules = DashboardEngine.getSchedules();
    const calendar = document.getElementById('schedule-calendar');
    if (!calendar) return;

    if (schedules.length === 0) {
        calendar.innerHTML = `
                <div class="text-center py-20">
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i>
                    <p class="text-gray-400">No scheduled sessions. Click "Add Session" to set one up!</p>
                </div>
            `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const grouped = {};
    schedules.forEach(s => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
    });

    const sortedDates = Object.keys(grouped).sort();

    calendar.innerHTML = sortedDates.map(dateStr => {
        const dateObj = new Date(dateStr);
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        const sessionsHTML = grouped[dateStr].map(s => {
            let badgeClass = 'bg-gray-100 text-gray-800';
            if (s.attendanceStatus === 'present') badgeClass = 'bg-emerald-100 text-emerald-800';
            if (s.attendanceStatus === 'absent') badgeClass = 'bg-rose-100 text-rose-800';

            return `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-admin-accent/30 transition-colors group">
                        <div class="flex items-start gap-3">
                            <div class="w-1.5 h-12 bg-admin-accent rounded-full shrink-0"></div>
                            <div>
                                <p class="font-bold text-gray-800 text-sm">${s.course}</p>
                                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 mt-0.5">
                                    <span class="font-semibold text-slate-600">Student: ${s.studentName}</span>
                                    <span>•</span>
                                    <span>${s.time} (${s.duration} mins)</span>
                                    <span>•</span>
                                    <span>Mentor: ${s.mentor}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-center">
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeClass}">
                                ${s.attendanceStatus || 'pending'}
                            </span>
                            ${s.link ? `
                                <a href="${s.link}" target="_blank" class="text-xs text-admin-accent hover:underline flex items-center gap-1">
                                    <i data-lucide="external-link" class="w-3.5 h-3.5 flex-shrink-0"></i> Meeting
                                </a>
                            ` : ''}
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                <button onclick="AdminEngine.openScheduleModal('${s.id}')" class="text-gray-400 hover:text-admin-accent p-1 transition-colors" title="Edit Session">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button onclick="AdminEngine.deleteSchedule('${s.id}')" class="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Delete Session">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        }).join('');

        return `
                <div class="mb-6 last:mb-0">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">${formattedDate}</h4>
                    <div class="space-y-2.5">
                        ${sessionsHTML}
                    </div>
                </div>
            `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function populateScheduleModalFields() {
    const studentSelect = document.getElementById('schedule-student');
    const mentorSelect = document.getElementById('schedule-mentor');

    if (studentSelect) {
        const students = DashboardEngine.getStudents();
        // Store parentEmail as data attribute so saveSchedule can read it
        studentSelect.innerHTML = '<option value="">-- Select Student --</option>' +
            students.map(s => `<option value="${s.id}" data-parent-email="${s.parentEmail || ''}" data-parent-name="${s.parentName || ''}">${s.firstName} ${s.lastName}</option>`).join('');
    }

    if (mentorSelect) {
        const tutors = DashboardEngine.getTutors();
        // Store tutorEmail and birthday as data attributes
        mentorSelect.innerHTML = '<option value="">-- Select Tutor --</option>' +
            tutors.map(t => `<option value="${t.name}" data-tutor-email="${t.email || ''}" data-tutor-birthday="${t.birthday || ''}">${t.name}</option>`).join('');
    }
}

function openScheduleModal(scheduleId = null) {
    populateScheduleModalFields();

    const modal = document.getElementById('schedule-modal');
    const title = document.getElementById('schedule-modal-title');
    const form = document.getElementById('schedule-form');

    if (form) form.reset();

    const idInput = document.getElementById('schedule-id');
    if (idInput) idInput.value = scheduleId || '';

    if (scheduleId) {
        if (title) title.textContent = 'Edit Session';
        const schedules = DashboardEngine.getSchedules();
        const session = schedules.find(s => s.id === scheduleId);
        if (session) {
            if (document.getElementById('schedule-student')) document.getElementById('schedule-student').value = session.studentId || '';
            if (document.getElementById('schedule-course')) document.getElementById('schedule-course').value = session.course || '';
            if (document.getElementById('schedule-date')) document.getElementById('schedule-date').value = session.date || '';
            if (document.getElementById('schedule-time')) document.getElementById('schedule-time').value = session.time || '';
            if (document.getElementById('schedule-duration')) document.getElementById('schedule-duration').value = session.duration || '60';
            if (document.getElementById('schedule-mentor')) document.getElementById('schedule-mentor').value = session.mentor || '';
            if (document.getElementById('schedule-link')) document.getElementById('schedule-link').value = session.link || '';
        }
    } else {
        if (title) title.textContent = 'Add New Session';
        const dateInput = document.getElementById('schedule-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (modal) modal.classList.remove('hidden');
}

function handleScheduleStudentChange(studentId) {
    if (!studentId) return;
    const students = DashboardEngine.getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
        const courseSelect = document.getElementById('schedule-course');
        if (courseSelect) {
            const options = Array.from(courseSelect.options);
            const matching = options.find(o => o.text.toLowerCase().includes(student.program.toLowerCase()) || student.program.toLowerCase().includes(o.value.toLowerCase()));
            if (matching) courseSelect.value = matching.value;
        }

        const mentorSelect = document.getElementById('schedule-mentor');
        if (mentorSelect && student.tutorName) {
            mentorSelect.value = student.tutorName;
        }
    }
}

function saveSchedule(e) {
    e.preventDefault();

    const id = document.getElementById('schedule-id').value;
    const studentId = document.getElementById('schedule-student').value;
    const studentSelect = document.getElementById('schedule-student');
    const studentName = studentSelect.options[studentSelect.selectedIndex].text;

    const courseSelect = document.getElementById('schedule-course');
    const course = courseSelect.options[courseSelect.selectedIndex].text;

    const date = document.getElementById('schedule-date').value;
    const time = document.getElementById('schedule-time').value;
    const duration = document.getElementById('schedule-duration').value;
    const mentor = document.getElementById('schedule-mentor').value;
    const link = document.getElementById('schedule-link').value.trim();

    // Enrich with parent + tutor contact details for automated notifications
    const selectedStudent = studentSelect.options[studentSelect.selectedIndex];
    const parentEmail   = selectedStudent ? (selectedStudent.dataset.parentEmail   || '') : '';
    const parentName    = selectedStudent ? (selectedStudent.dataset.parentName    || '') : '';

    const mentorSelectEl   = document.getElementById('schedule-mentor');
    const selectedMentor   = mentorSelectEl ? mentorSelectEl.options[mentorSelectEl.selectedIndex] : null;
    const tutorEmail       = selectedMentor ? (selectedMentor.dataset.tutorEmail    || '') : '';
    const tutorBirthday    = selectedMentor ? (selectedMentor.dataset.tutorBirthday || '') : '';

    if (!studentId || !course || !date || !time || !mentor) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    const sessionData = {
        studentId,
        studentName,
        course,
        date,
        time,
        duration,
        mentor,
        tutorEmail,
        tutorBirthday,
        parentEmail,
        parentName,
        link
    };

    if (id) {
        const updated = DashboardEngine.updateSchedule(id, sessionData);
        if (updated) {
            showToast('Session updated successfully!', 'success');
        } else {
            showToast('Failed to update session.', 'error');
        }
    } else {
        sessionData.attendanceStatus = 'pending';
        const added = DashboardEngine.addSchedule(sessionData);
        if (added) {
            showToast('Session scheduled successfully!', 'success');
        } else {
            showToast('Failed to schedule session.', 'error');
        }
    }

    closeModal('schedule-modal');
    loadDashboardData();
}

function deleteSchedule(id) {
    if (!confirm('Are you sure you want to cancel this scheduled session?')) return;
    DashboardEngine.deleteSchedule(id);
    showToast('Session cancelled.', 'success');
    loadDashboardData();
}

// ==================== PROJECTS (WooHooMents) CRUD ====================

function loadProjects() {
    const milestones = DashboardEngine.getMilestones();
    projectsCache = milestones;
    renderProjectCards(milestones);
}

function renderProjectCards(projects) {
    const grid = document.getElementById('admin-projects-grid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
                <div class="col-span-full glass-card rounded-3xl p-12 text-center border border-slate-100 bg-white">
                    <i data-lucide="video" class="w-12 h-12 mx-auto mb-4 text-slate-400"></i>
                    <p class="text-slate-500">No video highlights added yet.</p>
                </div>
            `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = projects.map(p => `
            <div class="glass-card rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-white flex flex-col hover:shadow-md transition-shadow">
                <div class="h-40 overflow-hidden relative bg-slate-900 flex items-center justify-center group">
                    <span class="absolute top-3 left-3 px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider z-10">${p.category}</span>
                    <video src="${p.image}" class="w-full h-full object-cover" muted loop playsinline onmouseenter="this.play()" onmouseleave="this.pause()"></video>
                    <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white text-xs bg-blue-600/90 px-3 py-1.5 rounded-full font-semibold">Hover to Preview</span>
                    </div>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-gray-800 text-base mb-1">${p.title}</h4>
                        <p class="text-xs text-gray-400 mb-2"><i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${p.studentName}, Age ${p.studentAge}</p>
                        <p class="text-xs text-gray-650 leading-relaxed">${p.description}</p>
                    </div>
                    <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                        <button onclick="AdminEngine.editProject('${p.id}')" class="flex-1 border border-slate-200 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors">Edit</button>
                        <button onclick="AdminEngine.deleteProject('${p.id}')" class="flex-1 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold py-2 rounded-xl transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    if (window.lucide) lucide.createIcons();
}

function openProjectModal(projectData) {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    document.getElementById('project-form').reset();

    if (projectData) {
        document.getElementById('project-id').value = projectData.id;
        document.getElementById('project-title').value = projectData.title;
        document.getElementById('project-category').value = projectData.category;
        document.getElementById('project-student-name').value = projectData.studentName;
        document.getElementById('project-student-age').value = projectData.studentAge;
        document.getElementById('project-description').value = projectData.description;
        document.getElementById('project-image').value = projectData.image;
        document.getElementById('project-tags').value = projectData.tags;
        document.getElementById('project-modal-title').textContent = "Edit Video Highlight";
    } else {
        document.getElementById('project-id').value = "";
        document.getElementById('project-modal-title').textContent = "Add Video Highlight";
    }

    modal.classList.remove('hidden');
}

function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const projectData = {
        title: document.getElementById('project-title').value,
        category: document.getElementById('project-category').value,
        studentName: document.getElementById('project-student-name').value,
        studentAge: parseInt(document.getElementById('project-student-age').value),
        description: document.getElementById('project-description').value,
        image: document.getElementById('project-image').value,
        tags: document.getElementById('project-tags').value
    };

    if (id) {
        DashboardEngine.updateMilestone(id, projectData);
        showToast('Video highlight updated successfully.', 'success');
    } else {
        DashboardEngine.addMilestone(projectData);
        showToast('Video highlight added successfully.', 'success');
    }

    closeModal('project-modal');
    loadProjects();
    window.dispatchEvent(new Event('stemulusDbUpdated'));
}

function editProject(id) {
    const project = projectsCache.find(p => p.id === id);
    if (project) {
        openProjectModal(project);
    }
}

function deleteProject(id) {
    if (confirm('Are you sure you want to delete this video highlight?')) {
        const success = DashboardEngine.deleteMilestone(id);
        if (success) {
            showToast('Video highlight deleted.', 'success');
            loadProjects();
            window.dispatchEvent(new Event('stemulusDbUpdated'));
        } else {
            showToast('Failed to delete video highlight.', 'error');
        }
    }
}

// ==================== NOTIFICATIONS BROADCAST ====================

function populateNotificationRecipients() {
    const select = document.getElementById('notification-recipient');
    if (!select) return;

    select.innerHTML = `
            <option value="everyone">Everyone (All Parents & Tutors)</option>
            <option value="parents">All Parents</option>
            <option value="tutors">All Tutors</option>
        `;

    const students = DashboardEngine.getStudents();
    const parentsEmails = [...new Set(students.map(s => s.parentEmail).filter(Boolean))];
    const tutors = DashboardEngine.getTutors();

    if (parentsEmails.length > 0) {
        const parentOptGroup = document.createElement('optgroup');
        parentOptGroup.label = "Individual Parents";
        parentsEmails.forEach(email => {
            const opt = document.createElement('option');
            opt.value = `parent:${email}`;
            opt.textContent = `Parent: ${email}`;
            parentOptGroup.appendChild(opt);
        });
        select.appendChild(parentOptGroup);
    }

    if (tutors.length > 0) {
        const tutorOptGroup = document.createElement('optgroup');
        tutorOptGroup.label = "Individual Tutors";
        tutors.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `tutor:${t.email}`;
            opt.textContent = `Tutor: ${t.name} (${t.email})`;
            tutorOptGroup.appendChild(opt);
        });
        select.appendChild(tutorOptGroup);
    }
}

function sendPortalNotification(e) {
    e.preventDefault();
    const recipientVal = document.getElementById('notification-recipient').value;
    const title = document.getElementById('notification-title').value;
    const message = document.getElementById('notification-message').value;

    if (!title || !message) {
        showToast('Please fill out all fields.', 'error');
        return;
    }

    const students = DashboardEngine.getStudents();
    const parentsEmails = [...new Set(students.map(s => s.parentEmail).filter(Boolean))];
    const tutors = DashboardEngine.getTutors();

    let targetEmails = [];
    if (recipientVal === 'everyone') {
        targetEmails = [...parentsEmails, ...tutors.map(t => t.email)];
    } else if (recipientVal === 'parents') {
        targetEmails = parentsEmails;
    } else if (recipientVal === 'tutors') {
        targetEmails = tutors.map(t => t.email);
    } else if (recipientVal.startsWith('parent:')) {
        targetEmails = [recipientVal.split('parent:')[1]];
    } else if (recipientVal.startsWith('tutor:')) {
        targetEmails = [recipientVal.split('tutor:')[1]];
    }

    if (targetEmails.length === 0) {
        showToast('No recipients found for selection.', 'error');
        return;
    }

    targetEmails.forEach(email => {
        DashboardEngine.addNotification({
            userEmail: email,
            title: title,
            message: message
        });
    });

    showToast(`Broadcasted notification to ${targetEmails.length} user(s).`, 'success');
    document.getElementById('compose-notification-form').reset();
    window.dispatchEvent(new Event('stemulusDbUpdated'));
}

// ==================== CERTIFICATES CRUD ====================

function loadCertificates() {
    certsCache = DashboardEngine.getCertificates();
    renderCertificatesTable(certsCache);
}

function renderCertificatesTable(certs) {
    const tbody = document.getElementById('certs-table-body');
    if (!tbody) return;

    if (certs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">No certificates issued yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = certs.map(c => `
            <tr class="hover:bg-gray-50 border-b border-gray-200 text-gray-800">
                <td class="px-4 py-3 font-bold">${c.student_name}</td>
                <td class="px-4 py-3 text-xs text-gray-500">
                    ${c.program_name} 
                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded ml-1 border border-emerald-200">${c.grade_level || 'Distinction'}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs font-semibold text-gray-500">${c.credential_id}</td>
                <td class="px-4 py-3 text-right space-x-1.5">
                    <button class="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors inline-block" onclick="AdminEngine.showQRCodeModal('${c.credential_id}', '${c.student_name}')" title="Get QR Code">
                        <i data-lucide="qr-code" class="w-4 h-4"></i>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-[#f4600c] transition-colors inline-block" onclick="AdminEngine.copyCertLink('${c.credential_id}')" title="Copy Verification Link">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-red-500 transition-colors inline-block" onclick="AdminEngine.deleteCertificate('${c.id}')" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    if (window.lucide) lucide.createIcons();
}

async function saveCertificate(e) {
    e.preventDefault();
    const studentName = document.getElementById('cert-student-name').value.trim();
    const programName = document.getElementById('cert-program-name').value.trim();
    const gradeLevel = document.getElementById('cert-grade').value;
    const issueDate = document.getElementById('cert-issue-date').value;

    if (!studentName || !programName) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    var fileInput = document.getElementById('cert-file-input');
    var fileData = null;
    var fileName = null;
    var fileType = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
        var file = fileInput.files[0];
        fileName = file.name;
        fileType = file.type;
        fileData = await new Promise(function(resolve) {
            var reader = new FileReader();
            reader.onload = function(e){ resolve(e.target.result); };
            reader.readAsDataURL(file);
        });
    }

    const credentialId = generateCredentialId();
    DashboardEngine.addCertificate({
        student_name: studentName,
        program_name: programName,
        grade_level: gradeLevel,
        issue_date: issueDate,
        credential_id: credentialId,
        fileData: fileData || null,
        fileName: fileName || null,
        fileType: fileType || null
    });

    showToast('Certificate successfully issued!', 'success');
    document.getElementById('cert-student-name').value = '';
    document.getElementById('cert-program-name').value = '';
    loadCertificates();

    // Queue certificate delivery email if file is present and student has parentEmail
    if (fileData) {
        var students = DashboardEngine.getStudents ? DashboardEngine.getStudents() : [];
        var student = students.find(function(s){ return (s.firstName+' '+s.lastName).toLowerCase() === studentName.toLowerCase(); });
        if (student && student.parentEmail) {
            DashboardEngine.addToEmailQueue({
                type: 'certificate-delivery',
                to: student.parentEmail,
                recipientName: student.parentName || (student.firstName+' '+student.lastName),
                subject: studentName + ' has earned their STEMulus Certificate!',
                htmlPreview: 'Certificate delivery for ' + studentName + ' — file: ' + fileName,
                data: { parentEmail: student.parentEmail, parentName: student.parentName, studentName: studentName, courseName: programName, credentialId: credentialId, issueDate: issueDate, fileData: fileData, fileName: fileName, fileType: fileType },
                triggeredBy: 'certificate_issue'
            });
            showToast('Certificate queued for delivery — review in Email Queue', 'success');
        }
    }

    showQRCodeModal(credentialId, studentName);
}

function deleteCertificate(id) {
    if (!confirm('Delete and revoke this certificate? Verification scans will fail.')) return;
    DashboardEngine.deleteCertificate(id);
    showToast('Certificate successfully revoked.');
    loadCertificates();
}

function filterCertificates(query) {
    const lower = query.toLowerCase();
    const filtered = certsCache.filter(c =>
        c.student_name.toLowerCase().includes(lower) ||
        c.credential_id.toLowerCase().includes(lower)
    );
    renderCertificatesTable(filtered);
}

// ==================== QR MODAL ====================

function showQRCodeModal(credentialId, studentName) {
    const modal = document.getElementById('qrcode-modal');
    const canvas = document.getElementById('qrcode-canvas');
    const credIdEl = document.getElementById('qrcode-credential-id');
    const studentEl = document.getElementById('qrcode-student-name');
    const downloadBtn = document.getElementById('download-qr-btn');

    if (!modal || !canvas) return;

    canvas.innerHTML = '';

    // Retrieve certificate record for metadata payload
    const certs = DashboardEngine.getCertificates();
    const cert = certs.find(c => c.credential_id && c.credential_id.trim().toUpperCase() === credentialId.trim().toUpperCase()) || {};

    const progName = cert.program_name || 'STEM Coding Mastery';
    const gradeLvl = cert.grade_level || 'Distinction';
    const issueDt = cert.issue_date || new Date().toISOString().split('T')[0];

    // Production domain fallback for file:// or localhost
    let baseUrl = window.location.origin;
    if (!baseUrl || baseUrl.startsWith('file:') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = 'https://stemuluskidstech.com';
    }

    const verificationUrl = `${baseUrl}/verify-certificate.html?id=${encodeURIComponent(credentialId)}&name=${encodeURIComponent(studentName || cert.student_name || 'Student')}&program=${encodeURIComponent(progName)}&grade=${encodeURIComponent(gradeLvl)}&date=${encodeURIComponent(issueDt)}`;

    new QRCode(canvas, {
        text: verificationUrl,
        width: 180,
        height: 180,
        colorDark: "#0a0a0a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    credIdEl.textContent = credentialId;
    studentEl.textContent = studentName || cert.student_name;

    downloadBtn.onclick = () => {
        const img = canvas.querySelector('img');
        if (img && img.src) {
            const link = document.createElement('a');
            link.download = `QR-${credentialId}-${(studentName || 'student').replace(/\s+/g, '-')}.png`;
            link.href = img.src;
            link.click();
        } else {
            showToast('QR code generation is in progress, please wait.', 'warning');
        }
    };

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function copyCertLink(credentialId) {
    const certs = DashboardEngine.getCertificates();
    const cert = certs.find(c => c.credential_id && c.credential_id.trim().toUpperCase() === credentialId.trim().toUpperCase()) || {};

    const progName = cert.program_name || 'STEM Coding Mastery';
    const gradeLvl = cert.grade_level || 'Distinction';
    const issueDt = cert.issue_date || new Date().toISOString().split('T')[0];
    const sName = cert.student_name || 'Student';

    let baseUrl = window.location.origin;
    if (!baseUrl || baseUrl.startsWith('file:') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = 'https://stemuluskidstech.com';
    }

    const verificationUrl = `${baseUrl}/verify-certificate.html?id=${encodeURIComponent(credentialId)}&name=${encodeURIComponent(sName)}&program=${encodeURIComponent(progName)}&grade=${encodeURIComponent(gradeLvl)}&date=${encodeURIComponent(issueDt)}`;
    navigator.clipboard.writeText(verificationUrl)
        .then(() => {
            showToast('Certificate verification link copied!', 'success');
        })
        .catch(err => {
            showToast('Failed to copy verification link.', 'warning');
        });
}

function generateCredentialId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let hash = '';
    for (let i = 0; i < 4; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `STEM-2026-${hash}`;
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// ==================== TUTOR MANUAL ONBOARDING ====================

function openTutorModal(email) {
    const modal = document.getElementById('tutor-modal');
    const form = document.getElementById('tutor-form');
    if (form) form.reset();
    if (email) {
        const tutors = DashboardEngine.getTutors();
        const tutor = tutors.find(t => t.email === email);
        if (tutor) {
            if (document.getElementById('tutor-name')) document.getElementById('tutor-name').value = tutor.name || '';
            if (document.getElementById('tutor-email')) document.getElementById('tutor-email').value = tutor.email || '';
            if (document.getElementById('tutor-subjects')) document.getElementById('tutor-subjects').value = (tutor.subjects || []).join(', ');
            var phoneInput = document.getElementById('tutor-phone'); if (phoneInput) phoneInput.value = tutor.phone || tutor.phoneNumber || '';
        }
        var modalTitle = document.getElementById('tutor-modal-title'); if (modalTitle) modalTitle.textContent = email ? 'Edit Tutor' : 'Add New Tutor';
        const hiddenEmail = document.getElementById('tutor-existing-email');
        if (hiddenEmail) hiddenEmail.value = email;
    } else {
        const hiddenEmail = document.getElementById('tutor-existing-email');
        if (hiddenEmail) hiddenEmail.value = '';
        var titleEl = document.getElementById('tutor-modal-title');
        if (titleEl) titleEl.textContent = 'Add New Tutor';
    }
    if (modal) modal.classList.remove('hidden');
}

async function saveTutor(e) {
    e.preventDefault();
    const name = (document.getElementById('tutor-name').value || '').trim();
    const email = (document.getElementById('tutor-email').value || '').trim().toLowerCase();
    const password = (document.getElementById('tutor-password').value || '').trim();
    const subjects = (document.getElementById('tutor-subjects').value || '').split(',').map(s => s.trim()).filter(Boolean);
    const phone = (document.getElementById('tutor-phone') ? document.getElementById('tutor-phone').value.trim() : '');
    const existingEmail = document.getElementById('tutor-existing-email') ? document.getElementById('tutor-existing-email').value : '';

    if (!name || !email) { showToast('Name and email are required.', 'warning'); return; }

    if (!existingEmail) {
        const tempPwd = password || (Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9).toUpperCase() + Math.floor(Math.random()*90+10));
        const result = await DashboardEngine.addUser({ email, password: tempPwd, role: 'tutor', name });
        if (!result.success) { showToast(result.message || 'Could not create tutor account.', 'error'); return; }
        showToast(`Tutor account created. Login: ${email} — temporary password sent to their email.`, 'success');
        // Send tutor welcome email
        if (typeof EmailService !== 'undefined' && EmailService.sendTutorWelcomeEmail) {
            var tutorEmailData = { tutorEmail: email, tutorName: name, tempPassword: tempPwd, subjects: subjects || '' };
            EmailService.sendTutorWelcomeEmail(tutorEmailData)
              .catch(function(e) { console.warn('[STEMulus] Tutor welcome email failed:', e.message); });
        }
    } else {
        if (password) await DashboardEngine.updateUserPassword(existingEmail, password);
        showToast('Tutor details updated.', 'success');
    }

    closeModal('tutor-modal');
    loadDashboardData();
}

// ==================== PARENT MANUAL ONBOARDING ====================

function openParentModal() {
    const modal = document.getElementById('parent-modal');
    const form = document.getElementById('parent-form');
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
}

async function saveParent(e) {
    e.preventDefault();
    const name = (document.getElementById('new-parent-name').value || '').trim();
    const email = (document.getElementById('new-parent-email').value || '').trim().toLowerCase();
    const password = (document.getElementById('new-parent-password').value || '').trim();
    const phone = (document.getElementById('new-parent-phone') ? document.getElementById('new-parent-phone').value.trim() : '');

    if (!name || !email) { showToast('Name and email are required.', 'warning'); return; }

    const tempPwd = password || (Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9).toUpperCase() + Math.floor(Math.random()*90+10));
    const result = await DashboardEngine.addUser({ email, password: tempPwd, role: 'parent', name });
    if (!result.success) { showToast(result.message || 'Could not create parent account.', 'error'); return; }

    showToast(`Parent portal account created. Login: ${email} — temporary password sent to their email.`, 'success');
    closeModal('parent-modal');
    loadDashboardData();
}

return {
    init,
    reloadData: loadDashboardData,
    approveRegistration,
    approveScheduleAdjust,
    declineScheduleAdjust,
    sendBirthdayNotification,
    deleteStudent,
    openStudentModal,
    editStudent,
    openScheduleModal,
    deleteSchedule,
    handleScheduleStudentChange,
    closeModal,
    openProjectModal,
    editProject,
    deleteProject,
    deleteCertificate,
    showQRCodeModal,
    copyCertLink,
    processAttendance,
    openTutorModal,
    openParentModal,
    exportStudentsCSV,
    openReportReviewModal,
    previewCurrentReportPDF,
    previewReportPDF,
    saveReportDraft,
    promptRejectReport,
    approveAndSendReport,
    quickApproveReport,
    setMonthlyReportsFilter,
    filterMonthlyReports,
    openQuickOnboardModal,
    switchQuickOnboardTab,
    submitQuickOnboardStudent,
    submitQuickOnboardTutor,
    copyQuickOnboardCredentials
};
}) ();

document.addEventListener('DOMContentLoaded', AdminEngine.init);
// On cloud sync: only reload data, don't re-run full auth check
window.addEventListener('stemulusDbUpdated', function () {
    if (document.getElementById('dashboard-container') && !document.getElementById('dashboard-container').classList.contains('hidden')) {
        AdminEngine.reloadData();
    }
});
