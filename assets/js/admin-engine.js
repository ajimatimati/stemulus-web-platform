/**
 * STEMulus Admin Dashboard Engine
 * Coordinates administrative tasks such as student registrations, reschedule approvals, 
 * certificate generations, and student birthday push alerts via ntfy.
 */

const AdminEngine = (function() {
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
        checkAuth();
    }

    function checkAuth() {
        currentUser = DashboardEngine.getSession();
        
        const loginScreen = document.getElementById('login-screen');
        const dashboardContainer = document.getElementById('dashboard-container');

        if (currentUser && currentUser.role === 'admin') {
            if (loginScreen) loginScreen.classList.add('hidden');
            if (dashboardContainer) dashboardContainer.classList.remove('hidden');
            
            if (document.getElementById('user-email')) document.getElementById('user-email').textContent = currentUser.email;
            if (document.getElementById('user-name')) document.getElementById('user-name').textContent = currentUser.name;
            if (document.getElementById('user-avatar')) document.getElementById('user-avatar').textContent = (currentUser.name || 'A')[0].toUpperCase();

            loadDashboardData();
            bindEvents();
        } else {
            window.location.href = 'parent-login.html?role=admin';
        }
    }

    function bindLoginForm() {
        const form = document.getElementById('login-form');
        const errorDiv = document.getElementById('login-error');

        if (!form) return;

        form.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');

            btn.disabled = true;
            btn.innerHTML = '<span>Signing in...</span>';
            if (errorDiv) errorDiv.classList.add('hidden');

            const res = DashboardEngine.login(email, password);
            if (res.success && res.user.role === 'admin') {
                showToast('Welcome back, Admin!', 'success');
                currentUser = res.user;
                init();
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
            logoutBtn.onclick = function() {
                DashboardEngine.logout();
                window.location.reload();
            };
        }

        // Sidebar Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.onclick = function(e) {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                navigateToSection(section);
            };
        });

        // Search inputs
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.oninput = function(e) {
                filterStudents(e.target.value);
            };
        }

        const studentSearch = document.getElementById('student-search');
        if (studentSearch) {
            studentSearch.oninput = function(e) {
                filterStudents(e.target.value);
            };
        }

        const certSearch = document.getElementById('cert-search');
        if (certSearch) {
            certSearch.oninput = function(e) {
                filterCertificates(e.target.value);
            };
        }

        // Student Form
        const studentForm = document.getElementById('student-form');
        if (studentForm) {
            studentForm.onsubmit = saveStudent;
        }

        // Add Student Buttons
        const addStudentBtn = document.getElementById('add-student-btn');
        if (addStudentBtn) {
            addStudentBtn.onclick = function() {
                openStudentModal();
            };
        }

        const quickAddStudentBtn = document.getElementById('quick-add-student');
        if (quickAddStudentBtn) {
            quickAddStudentBtn.onclick = function() {
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
            addScheduleBtn.onclick = function() {
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
            addProjectBtn.onclick = function() {
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
            pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        }

        if (window.lucide) lucide.createIcons();
    }

    function showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `px-6 py-3.5 rounded-xl shadow-xl text-white text-sm animate-fadeIn flex items-center gap-3 ${
            type === 'success' ? 'bg-emerald-600' : (type === 'warning' ? 'bg-amber-600' : 'bg-blue-600')
        }`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5 shrink-0"></i>
            <span>${msg}</span>
        `;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => toast.remove(), 4000);
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
        checkBirthdays();
        populateNotificationRecipients();
    }

    function loadStats() {
        const students = DashboardEngine.getStudents();
        const enrollments = DashboardEngine.getEnrollments().filter(e => e.status === 'pending');
        const schedules = DashboardEngine.getSchedules();

        const statStudents = document.getElementById('stat-total-students');
        if (statStudents) statStudents.textContent = students.length;

        const statPending = document.getElementById('stat-pending-emails');
        if (statPending) statPending.textContent = enrollments.length;

        const statUpcoming = document.getElementById('stat-upcoming-classes');
        if (statUpcoming) statUpcoming.textContent = schedules.filter(s => s.attendanceStatus === 'pending').length;

        const statCourses = document.getElementById('stat-active-courses');
        if (statCourses) statCourses.textContent = "6"; // Standard programs count
    }

    // ==================== BIRTHDAY NOTIFICATIONS ====================

    function checkBirthdays() {
        const students = DashboardEngine.getStudents();
        const todayStr = new Date().toISOString().split('T')[0].substring(5); // MM-DD format

        const birthdayStudents = students.filter(s => {
            if (!s.birthday) return false;
            return s.birthday.substring(5) === todayStr;
        });

        const dashboardSection = document.getElementById('section-dashboard');
        // Remove existing birthday alert panel if present
        const oldAlert = document.getElementById('admin-birthday-alert');
        if (oldAlert) oldAlert.remove();

        if (birthdayStudents.length > 0 && dashboardSection) {
            const student = birthdayStudents[0];
            const alertPanel = document.createElement('div');
            alertPanel.id = 'admin-birthday-alert';
            alertPanel.className = 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-orange-500/20 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn';
            alertPanel.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-2xl shrink-0">
                        🎂
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-base">Student Birthday Today!</h4>
                        <p class="text-xs text-gray-500">It is <strong class="text-orange-600 font-bold">${student.firstName} ${student.lastName}</strong>'s birthday today (Ages ${student.age}). Send them an alert!</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs text-gray-400 font-mono bg-white border px-2.5 py-1 rounded-lg">Topic: ${DashboardEngine.getNtfyTopic()}</span>
                    <button onclick="AdminEngine.sendBirthdayNotification('${student.id}')"
                        class="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5">
                        <i data-lucide="bell" class="w-3.5 h-3.5"></i> Send Push via ntfy
                    </button>
                </div>
            `;
            
            // Insert after Stats cards
            const statsGrid = dashboardSection.querySelector('div.grid');
            if (statsGrid) {
                statsGrid.parentNode.insertBefore(alertPanel, statsGrid.nextSibling);
            }
            if (window.lucide) lucide.createIcons();
        }
    }

    async function sendBirthdayNotification(studentId) {
        const student = DashboardEngine.getStudents().find(s => s.id === studentId);
        if (!student) return;

        const res = await DashboardEngine.triggerBirthdayNtfy(student);
        if (res.success) {
            showToast(`Birthday push alert broadcasted to ntfy topic: ${res.topic}!`, 'success');
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
                            <p class="text-xs text-gray-500">${e.program} • Age ${e.studentAge} • Exp: ${e.experience}</p>
                            <p class="text-[10px] text-gray-400 mt-1">Parent: ${e.parentName} (${e.phone} / ${e.email})</p>
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

    function approveRegistration(id) {
        const success = DashboardEngine.approveEnrollment(id);
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
        resSection.className = 'glass-card rounded-none p-6 mt-8';
        resSection.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i data-lucide="calendar" class="w-5 h-5 text-orange-500"></i>
                Pending Schedule Adjustments (${requests.length})
            </h3>
            <div class="space-y-3">
                ${requests.map(r => `
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                        <div>
                            <p class="text-sm font-bold text-gray-800">${r.studentName} - ${r.course}</p>
                            <p class="text-xs text-gray-500">Move from: <span class="line-through text-red-500">${r.currentDate} at ${r.currentTime}</span></p>
                            <p class="text-xs font-bold text-emerald-700">Requested: ${r.requestedDate} at ${r.requestedTime}</p>
                        </div>
                        <div class="flex items-center gap-2 self-end md:self-auto">
                            <button onclick="AdminEngine.approveScheduleAdjust('${r.id}')"
                                class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md">
                                Approve
                            </button>
                            <button onclick="AdminEngine.declineScheduleAdjust('${r.id}')"
                                class="border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors">
                                Decline
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Insert before schedules or after recent students
        const container = dashboardSection.querySelector('div.grid-cols-1');
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
            }
        } else {
            if (title) title.textContent = 'Add New Student';
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
            notes
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

    function filterStudents(query) {
        const lower = query.toLowerCase();
        const filtered = studentsCache.filter(s => 
            s.firstName.toLowerCase().includes(lower) || 
            s.lastName.toLowerCase().includes(lower) ||
            s.program.toLowerCase().includes(lower)
        );
        renderStudentsTable(filtered);
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
            studentSelect.innerHTML = '<option value="">-- Select Student --</option>' + 
                students.map(s => `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`).join('');
        }

        if (mentorSelect) {
            const tutors = DashboardEngine.getTutors();
            mentorSelect.innerHTML = '<option value="">-- Select Tutor --</option>' + 
                tutors.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
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

    function saveCertificate(e) {
        e.preventDefault();
        const studentName = document.getElementById('cert-student-name').value.trim();
        const programName = document.getElementById('cert-program-name').value.trim();
        const gradeLevel = document.getElementById('cert-grade').value;
        const issueDate = document.getElementById('cert-issue-date').value;

        if (!studentName || !programName) {
            showToast('Please fill out all required fields.', 'warning');
            return;
        }

        const credentialId = generateCredentialId();
        DashboardEngine.addCertificate({
            student_name: studentName,
            program_name: programName,
            grade_level: gradeLevel,
            issue_date: issueDate,
            credential_id: credentialId
        });

        showToast('Certificate successfully issued!', 'success');
        document.getElementById('cert-student-name').value = '';
        document.getElementById('cert-program-name').value = '';
        loadCertificates();

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

        const verificationUrl = `${window.location.origin}/verify-certificate.html?id=${credentialId}`;

        new QRCode(canvas, {
            text: verificationUrl,
            width: 180,
            height: 180,
            colorDark : "#0a0a0a",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        credIdEl.textContent = credentialId;
        studentEl.textContent = studentName;

        downloadBtn.onclick = () => {
            const img = canvas.querySelector('img');
            if (img && img.src) {
                const link = document.createElement('a');
                link.download = `QR-${credentialId}-${studentName.replace(/\s+/g, '-')}.png`;
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
        const verificationUrl = `${window.location.origin}/verify-certificate.html?id=${credentialId}`;
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
        copyCertLink
    };
})();

document.addEventListener('DOMContentLoaded', AdminEngine.init);
// On cloud sync: only reload data, don't re-run full auth check
window.addEventListener('stemulusDbUpdated', function() {
    if (document.getElementById('dashboard-container') && !document.getElementById('dashboard-container').classList.contains('hidden')) {
        AdminEngine.reloadData();
    }
});
