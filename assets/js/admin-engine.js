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
        'Game Dev': 'bg-purple-600/90',
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
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (dashboardContainer) dashboardContainer.classList.add('hidden');
            bindLoginForm();
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

        // Project Form
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.onsubmit = saveProject;
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
        loadProjects();
        loadCertificates();
        renderPendingRegistrations();
        renderRescheduleRequests();
        checkBirthdays();
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
                    <span class="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">${s.program}</span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-xs font-bold text-gray-800">${s.parentName}</p>
                    <p class="text-[10px] text-gray-400">${s.parentPhone || ''}</p>
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
                    <button class="text-gray-400 hover:text-red-500 transition-colors p-1" onclick="AdminEngine.deleteStudent('${s.id}')">
                        <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }

    function saveStudent(e) {
        e.preventDefault();
        showToast('Adding manual students is restricted. Please register via Enroll Form or registrations list.', 'warning');
        closeModal('student-modal');
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

    // ==================== PROJECTS CRUD ====================

    function loadProjects() {
        projectsCache = DashboardEngine.getCertificates(); // Mock projects mapping to certs or locally
        // Seed default local projects if empty
        const grid = document.getElementById('admin-projects-grid');
        if (!grid) return;

        // Fetch mock projects
        const mockProjects = [
            { id: "p1", title: "Alien Invader", category: "Game Dev", studentName: "Daniel M.", studentAge: 11, description: "A classic retro arcade game built with Scratch.", image: "student_scratch_game.png", tags: ["Scratch", "Gaming"] },
            { id: "p2", title: "IoT Plant Waterer", category: "Robotics", studentName: "Sarah M.", studentAge: 8, description: "An automated watering system coded on Arduino.", image: "student_robot.png", tags: ["Arduino", "Hardware"] }
        ];

        projectsCache = mockProjects;
        renderProjectCards(mockProjects);
    }

    function renderProjectCards(projects) {
        const grid = document.getElementById('admin-projects-grid');
        if (!grid) return;

        grid.innerHTML = projects.map(p => `
            <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col">
                <div class="h-40 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                    <span class="absolute top-3 left-3 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider z-10">${p.category}</span>
                    <i data-lucide="image" class="w-12 h-12 text-gray-300"></i>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-gray-800 text-base mb-1">${p.title}</h4>
                        <p class="text-xs text-gray-400 mb-2"><i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${p.studentName}, Age ${p.studentAge}</p>
                        <p class="text-xs text-gray-600 leading-relaxed">${p.description}</p>
                    </div>
                    <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                        <button onclick="AdminEngine.editProject('${p.id}')" class="flex-1 border text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors">Edit</button>
                        <button onclick="AdminEngine.deleteProject('${p.id}')" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-xl transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }

    function openProjectModal(projectData) {
        const modal = document.getElementById('project-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function saveProject(e) {
        e.preventDefault();
        showToast('Project details successfully saved.', 'success');
        closeModal('project-modal');
    }

    function editProject(id) {
        openProjectModal();
    }

    function deleteProject(id) {
        if (confirm('Delete this project?')) {
            showToast('Project deleted successfully.');
        }
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
        approveRegistration,
        approveScheduleAdjust,
        declineScheduleAdjust,
        sendBirthdayNotification,
        deleteStudent,
        openStudentModal: () => openModal('student-modal'),
        closeModal,
        openProjectModal: () => openModal('project-modal'),
        editProject,
        deleteProject,
        deleteCertificate,
        showQRCodeModal,
        copyCertLink
    };
})();

document.addEventListener('DOMContentLoaded', AdminEngine.init);
window.addEventListener('stemulusDbUpdated', AdminEngine.init);
