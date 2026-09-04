/**
 * STEMulus Tutor Attendance Engine
 * Controls rendering and validation logic for tutor-attendance.html and tutor-attendance-create.html
 */

const TutorAttendanceEngine = (function() {
    let currentTutor = null;
    let activeTab = 'my-students'; // 'my-students' or 'stand-in'
    let skipDuplicateCheck = false;
    let skipScheduleCheck = false;
    let pendingSubmissionData = null;
    let isStandIn = false;

    function init() {
        checkAuth();
    }

    function checkAuth() {
        const hasFirebase = (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore);

        if (hasFirebase) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    const session = DashboardEngine.getSession();
                    if (session && (session.role === 'tutor' || session.role === 'admin') && session.email.toLowerCase() === user.email.toLowerCase()) {
                        currentTutor = session;
                        hideLoginOverlay();
                        setupPage();
                    } else {
                        try {
                            const userDoc = await firebase.firestore().collection('users').doc(user.email.toLowerCase()).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                if (userData.role === 'tutor' || userData.role === 'admin') {
                                    sessionStorage.setItem("stemulus_session", JSON.stringify(userData));
                                    currentTutor = userData;
                                    hideLoginOverlay();
                                    setupPage();
                                } else {
                                    showLoginOverlay();
                                }
                            } else {
                                // Self-seed fallback for testing
                                const seedData = await DashboardEngine.login(user.email, "tutor123");
                                if (seedData.success && (seedData.user.role === 'tutor' || seedData.user.role === 'admin')) {
                                    await firebase.firestore().collection('users').doc(user.email.toLowerCase()).set({
                                        email: seedData.user.email,
                                        role: seedData.user.role,
                                        name: seedData.user.name
                                    });
                                    currentTutor = seedData.user;
                                    hideLoginOverlay();
                                    setupPage();
                                } else {
                                    showLoginOverlay();
                                }
                            }
                        } catch (e) {
                            console.error("[Attendance Engine] Firebase auth query failed:", e);
                            if (session && (session.role === 'tutor' || session.role === 'admin')) {
                                currentTutor = session;
                                hideLoginOverlay();
                                setupPage();
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
                        setupPage();
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
                setupPage();
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

    function setupPage() {
        // Remove loading screen
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }

        // Sidebar details
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

        // Page-specific setup
        const isHistoryPage = document.getElementById('attendance-list-container') !== null;
        const isCreatePage = document.getElementById('attendanceForm') !== null;

        if (isHistoryPage) {
            setupHistoryPage();
        } else if (isCreatePage) {
            setupCreatePage();
        }
    }

    // ================= HISTORY PAGE LOGIC =================
    function setupHistoryPage() {
        // Initialize Month Input filter to current month
        const monthInput = document.getElementById('filter-month');
        if (monthInput && !monthInput.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            monthInput.value = `${yyyy}-${mm}`;
        }

        // Render stats & list
        renderHistoryStats();
        renderHistoryList();

        // Bind filter event listeners
        const monthFilter = document.getElementById('filter-month');
        const statusFilter = document.getElementById('filter-status');
        const resetBtn = document.getElementById('filter-reset-btn');

        if (monthFilter) monthFilter.addEventListener('change', renderHistoryList);
        if (statusFilter) statusFilter.addEventListener('change', renderHistoryList);
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (monthFilter) {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    monthFilter.value = `${yyyy}-${mm}`;
                }
                if (statusFilter) statusFilter.value = 'all';
                renderHistoryList();
            });
        }

        // Bind tab buttons
        const tabMyStudents = document.getElementById('tab-my-students');
        const tabStandIn = document.getElementById('tab-stand-in');

        if (tabMyStudents && tabStandIn) {
            tabMyStudents.addEventListener('click', () => {
                activeTab = 'my-students';
                tabMyStudents.className = "flex-1 py-4 text-center font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50/30 transition-all focus:outline-none flex items-center justify-center gap-2";
                tabStandIn.className = "flex-1 py-4 text-center font-semibold text-gray-500 hover:text-gray-700 transition-all focus:outline-none flex items-center justify-center gap-2";
                renderHistoryList();
            });

            tabStandIn.addEventListener('click', () => {
                activeTab = 'stand-in';
                tabStandIn.className = "flex-1 py-4 text-center font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50/30 transition-all focus:outline-none flex items-center justify-center gap-2";
                tabMyStudents.className = "flex-1 py-4 text-center font-semibold text-gray-500 hover:text-gray-700 transition-all focus:outline-none flex items-center justify-center gap-2";
                renderHistoryList();
            });
        }
    }

    function renderHistoryStats() {
        const records = DashboardEngine.getAttendanceRecords(currentTutor.email);
        var filterMonthEl = document.getElementById('filter-month');
        var monthStr = (filterMonthEl && filterMonthEl.value) ? filterMonthEl.value : new Date().toISOString().substring(0,7);

        const thisMonthRecords = records.filter(r => r.classDate.startsWith(monthStr));

        const totalEl = document.getElementById('stat-total-submissions');
        const approvedEl = document.getElementById('stat-approved-submissions');
        const pendingEl = document.getElementById('stat-pending-submissions');
        const standinEl = document.getElementById('stat-standin-submissions');

        if (totalEl) totalEl.textContent = thisMonthRecords.length;
        if (approvedEl) approvedEl.textContent = thisMonthRecords.filter(r => r.status === 'approved').length;
        if (pendingEl) pendingEl.textContent = thisMonthRecords.filter(r => r.status === 'pending').length;
        if (standinEl) standinEl.textContent = thisMonthRecords.filter(r => r.isStandIn).length;
    }

    function renderHistoryList() {
        const container = document.getElementById('attendance-list-container');
        if (!container) return;

        const monthFilter = document.getElementById('filter-month').value; // "YYYY-MM"
        const statusFilter = document.getElementById('filter-status').value; // "all", "pending", "approved", "rejected"

        let records = DashboardEngine.getAttendanceRecords(currentTutor.email);

        // Filter by Tab
        records = records.filter(r => activeTab === 'stand-in' ? r.isStandIn === true : r.isStandIn !== true);

        // Filter by Month
        if (monthFilter) {
            records = records.filter(r => r.classDate.startsWith(monthFilter));
        }

        // Filter by Status
        if (statusFilter !== 'all') {
            records = records.filter(r => r.status === statusFilter);
        }

        if (records.length === 0) {
            container.innerHTML = `
                <div class="text-center text-slate-400 py-12 flex flex-col items-center justify-center gap-2">
                    <i data-lucide="folder-open" class="w-12 h-12 text-slate-300"></i>
                    <p class="font-medium text-sm">No attendance records found matching your filters.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Sort descending by date & time
        records.sort((a, b) => {
            const dtA = new Date(a.classDate + 'T' + a.classTime);
            const dtB = new Date(b.classDate + 'T' + b.classTime);
            return dtB - dtA;
        });

        container.innerHTML = records.map(r => {
            const dateObj = new Date(r.classDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            // Format Time (12h format)
            const [hh, mm] = r.classTime.split(':');
            let h = parseInt(hh);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const formattedTime = `${h}:${mm} ${ampm}`;

            const badgeClass = r.status === 'approved' ? 'badge-approved' : (r.status === 'rejected' ? 'badge-rejected' : 'badge-pending');
            const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);

            // Get initials for avatar
            const initials = r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Calculate student monthly attendance count
            const monthlyTally = DashboardEngine.getAttendanceRecords(currentTutor.email)
                .filter(ar => ar.studentId === r.studentId && ar.classDate.startsWith(r.classDate.substring(0, 7)) && ar.status === 'approved').length;

            return `
                <div class="p-5 bg-white border border-gray-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                    <div class="flex items-start gap-4">
                        <!-- Student Avatar -->
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm uppercase">
                            ${initials}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-bold text-gray-800 text-base">${r.studentName}</h4>
                                <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${monthlyTally} approved this month</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                                <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${formattedDate}</span>
                                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${formattedTime}</span>
                                <span class="flex items-center gap-1"><i data-lucide="hourglass" class="w-3.5 h-3.5"></i> ${r.duration} mins</span>
                            </div>
                            <p class="text-xs text-slate-400 mt-2 italic border-l-2 border-gray-200 pl-2">"${r.topic || 'Class Session'}" · ${Array.isArray(r.coursesCovered) ? r.coursesCovered.join(', ') : (r.coursesCovered || r.course || 'STEM Program')}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2 shrink-0 self-end md:self-auto">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeClass}">
                            ${statusLabel}
                        </span>
                        <span class="text-[10px] text-slate-400">Logged ${formatTimeAgo(r.timestamp)}</span>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    // ================= CREATE PAGE LOGIC =================
    function setupCreatePage() {
        // Populate Class Date default to today
        const dateInput = document.getElementById('class_date');
        if (dateInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
            dateInput.max = `${yyyy}-${mm}-${dd}`;
        }

        // Set up Alpine toggle listener to repopulate dropdown
        const selectEl = document.getElementById('student_id');
        if (selectEl) {
            populateStudentDropdown();

            // ATT-004: Alpine v3 compatible — use direct event listeners instead of body.__x (v2 only)
            var standInCheckbox = document.getElementById('stand-in-toggle')
                || document.querySelector('[x-model*="standIn"]')
                || document.querySelector('[x-on\\:change*="standIn"]');
            if (standInCheckbox) {
                standInCheckbox.addEventListener('change', function() {
                    isStandIn = this.checked;
                    populateStudentDropdown();
                });
            } else {
                // Fallback: MutationObserver watches for disabled-state changes on the select
                var _standInObserver = new MutationObserver(function() {
                    populateStudentDropdown();
                });
                _standInObserver.observe(selectEl, { attributes: true, attributeFilter: ['disabled'] });
            }
        }
    }

    function populateStudentDropdown() {
        const selectEl = document.getElementById('student_id');
        if (!selectEl) return;

        selectEl.innerHTML = '<option value="">Choose student...</option>';

        let studentsList = [];
        if (isStandIn) {
            // Stand-in mode: list all active students in the system
            studentsList = DashboardEngine.getStudents().filter(s => s.status === 'active');
        } else {
            // Normal mode: only students assigned to this tutor
            studentsList = DashboardEngine.getStudents().filter(s => s.tutorName === currentTutor.name && s.status === 'active');
        }

        studentsList.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.firstName} ${s.lastName} (${s.program})`;
            selectEl.appendChild(opt);
        });
    }

    // ================= FORM SUBMISSION & MODAL VALIDATION =================
    window.handleFormSubmit = function(event) {
        if (skipDuplicateCheck && skipScheduleCheck) {
            // Validation completed or bypassed, let regular engine submit
            processFinalSubmission();
            return false;
        }

        event.preventDefault();

        const studentId = document.getElementById('student_id').value;
        const selectEl = document.getElementById('student_id');
        const studentName = selectEl.options[selectEl.selectedIndex].text.split(' (')[0];
        const classDate = document.getElementById('class_date').value;
        const classTime = document.getElementById('class_time').value;
        const duration = parseInt(document.getElementById('duration_minutes').value);
        const topic = document.getElementById('topic').value;
        const notes = document.getElementById('notes').value;

        // Get selected courses checkboxes
        const courseCheckboxes = document.querySelectorAll('input[name="courses_covered[]"]:checked');
        const coursesCovered = Array.from(courseCheckboxes).map(cb => cb.value);

        if (!studentId || !classDate || !classTime || coursesCovered.length === 0) {
            // Trigger browser HTML5 error messages
            const btn = document.createElement('button');
            btn.type = 'submit';
            document.getElementById('attendanceForm').appendChild(btn);
            btn.click();
            btn.remove();
            return false;
        }

        // Store pending data structure
        pendingSubmissionData = {
            studentId,
            studentName,
            classDate,
            classTime,
            duration,
            topic,
            notes,
            coursesCovered,
            tutorName: currentTutor.name,
            tutorEmail: currentTutor.email,
            isStandIn: isStandIn,
            isRescheduled: document.getElementById('is_rescheduled').checked,
            originalScheduledTime: document.getElementById('original_scheduled_time').value || "",
            rescheduleReason: document.getElementById('reschedule_reason').value || "",
            rescheduleNotes: document.getElementById('reschedule_notes').value || ""
        };

        // CHECK 1: Early Submission check
        const classDateTime = new Date(`${classDate}T${classTime}`);
        const now = new Date();
        if (classDateTime > now) {
            showEarlySubmissionModal(classDate, classTime);
            return false;
        }

        // CHECK 2: Duplicate Check
        if (!skipDuplicateCheck) {
            const check = DashboardEngine.checkDuplicateAttendance(studentId, classDate, classTime, topic, coursesCovered);
            if (check.has_duplicate) {
                showDuplicateModal(studentName, classDate, check);
                return false;
            }
        }

        // CHECK 3: Schedule Tally Warning (makeup check)
        if (!skipScheduleCheck) {
            const schedules = DashboardEngine.getSchedules().filter(s => 
                s.studentId === studentId && 
                s.date === classDate &&
                s.mentor === currentTutor.name
            );
            if (schedules.length === 0) {
                showScheduleWarningModal(studentName, classDate);
                return false;
            }
        }

        processFinalSubmission();
        return false;
    };

    function processFinalSubmission() {
        if (!pendingSubmissionData) return;

        DashboardEngine.addAttendanceRecord(pendingSubmissionData);

        // Notify parent if student was absent
        if (pendingSubmissionData && pendingSubmissionData.attendanceStatus === 'absent') {
            try {
                var students = DashboardEngine.getStudents ? DashboardEngine.getStudents() : [];
                var student = students.find(function(s){
                    return s.id === pendingSubmissionData.studentId ||
                           (s.firstName + ' ' + s.lastName).toLowerCase() === (pendingSubmissionData.studentName||'').toLowerCase();
                });
                if (student && student.parentEmail && DashboardEngine.addNotification) {
                    DashboardEngine.addNotification({
                        userEmail: student.parentEmail.toLowerCase(),
                        title: 'Class Missed — ' + (student.firstName || pendingSubmissionData.studentName),
                        message: (student.firstName || 'Your child') + ' missed their coding session on ' + (pendingSubmissionData.classDate || 'today') + '. Please contact us to reschedule or discuss make-up options.',
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                }
            } catch(notifErr) {
                console.warn('[Attendance] Could not send absent notification:', notifErr);
            }
        }

        // Feedback alert
        const alertMsg = document.createElement('div');
        alertMsg.className = 'fixed top-4 right-4 z-[9999] bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-xl text-sm font-semibold animate-fadeIn flex items-center gap-2';
        alertMsg.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Attendance report submitted for approval!';
        document.body.appendChild(alertMsg);
        setTimeout(() => {
            alertMsg.remove();
            window.location.href = 'tutor-attendance.html';
        }, 2000);
    }

    // Modal Triggers
    function showEarlySubmissionModal(classDate, classTime) {
        const classDateTime = new Date(`${classDate}T${classTime}`);
        const now = new Date();

        document.getElementById('earlySubmissionClassTime').textContent = classDateTime.toLocaleString();
        document.getElementById('earlySubmissionCurrentTime').textContent = now.toLocaleString();

        const modal = document.getElementById('earlySubmissionModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    window.closeEarlySubmissionModal = function() {
        const modal = document.getElementById('earlySubmissionModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    function showDuplicateModal(studentName, date, data) {
        document.getElementById('duplicateStudentName').textContent = studentName;
        document.getElementById('duplicateDate').textContent = date;

        const warningBox = document.getElementById('exactDuplicateWarning');
        const header = document.getElementById('duplicateModalHeader');
        const title = document.getElementById('duplicateModalTitle');

        if (data.has_exact_duplicate) {
            warningBox.classList.remove('hidden');
            header.className = 'px-6 py-4 bg-red-500 text-white flex items-center gap-3';
            title.textContent = 'Exact Duplicate Detected!';
        } else {
            warningBox.classList.add('hidden');
            header.className = 'px-6 py-4 bg-amber-500 text-white flex items-center gap-3';
            title.textContent = 'Duplicate Attendance Warning';
        }

        const listEl = document.getElementById('duplicateList');
        listEl.innerHTML = '';

        data.duplicates.forEach(dup => {
            const item = document.createElement('div');
            item.className = 'p-3 bg-white border border-gray-150 rounded-xl text-xs space-y-1.5 shadow-sm';
            
            let badges = '';
            if (dup.is_exact_match) {
                badges += `<span class="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Exact Match</span> `;
            } else {
                if (dup.time_matches) badges += `<span class="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">Same Time</span> `;
                if (dup.topic_matches) badges += `<span class="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">Same Topic</span> `;
                if (dup.courses_match) badges += `<span class="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">Same Courses</span>`;
            }

            const badgeColor = dup.status === 'Approved' ? 'bg-green-100 text-green-800' : (dup.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800');

            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <span class="font-bold text-gray-800">${dup.time}</span>
                        <span class="text-slate-400">by ${dup.tutor}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor}">${dup.status}</span>
                </div>
                <p class="text-[11px] text-slate-500"><strong>Topic:</strong> ${dup.topic} · <strong>Courses:</strong> ${dup.courses}</p>
                ${badges ? `<div class="flex flex-wrap gap-1 mt-1">${badges}</div>` : ''}
            `;
            listEl.appendChild(item);
        });

        const modal = document.getElementById('duplicateModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    window.closeDuplicateModal = function() {
        const modal = document.getElementById('duplicateModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    window.submitAnyway = function() {
        closeDuplicateModal();
        skipDuplicateCheck = true;
        
        // Re-submit form triggering next checks
        const form = document.getElementById('attendanceForm');
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
    };

    function showScheduleWarningModal(studentName, date) {
        document.getElementById('scheduleStudentName').textContent = studentName;
        document.getElementById('scheduleDate').textContent = date;

        const modal = document.getElementById('scheduleWarningModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    window.closeScheduleWarningModal = function() {
        const modal = document.getElementById('scheduleWarningModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    window.submitWithForce = function() {
        closeScheduleWarningModal();
        skipScheduleCheck = true;

        // Re-submit form
        const form = document.getElementById('attendanceForm');
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
    };

    // Helper: format time elapsed
    function formatTimeAgo(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    }

    return {
        init
    };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', TutorAttendanceEngine.init);
