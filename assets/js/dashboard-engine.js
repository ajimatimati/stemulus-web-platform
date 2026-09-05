/**
 * STEMulus Dashboard State Engine
 * A centralized localStorage-backed state manager that coordinates the
 * parent portal, tutor portal, and admin dashboard with shared data.
 */

const DashboardEngine = (function() {

    // ---- Password hashing (SHA-256 via Web Crypto — no library needed) ----
    async function hashPassword(plain) {
        const encoded = new TextEncoder().encode(plain);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function isHashed(value) {
        return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
    }
    // -----------------------------------------------------------------------

    // ---- Write-lock: prevents Firestore snapshot from overwriting a local save in-flight ----
    var isSyncing = false;
    // -------------------------------------------------------------------------------------------

    // Default seed data for the STEMulus system
    const DEFAULT_DATA = {
        users: {},
        students: [
            {
                id: "std-1001",
                firstName: "Daniel",
                lastName: "M.",
                age: 11,
                gender: "Male",
                experience: "Beginner",
                program: "Python Programming",
                status: "active",
                remindersPaused: false,
                parentEmail: "parent@stemuluskidstech.com",
                parentName: "John Doe",
                parentPhone: "+2347052466716",
                birthday: "2015-06-01",
                progress: 65, // percent
                avatarColor: "bg-blue-700",
                tutorName: "Sarah Jane",
                classroomLink: '',
                skills: { logic: 85, loops: 80, variables: 90, syntax: 75, projects: 70 },
                metrics: { attended: 14, total: 24, projects: 3, lines: 1450 }
            },
            {
                id: "std-1002",
                firstName: "Sarah",
                lastName: "M.",
                age: 8,
                gender: "Female",
                experience: "None",
                program: "Scratch Creators",
                status: "active",
                remindersPaused: false,
                parentEmail: "parent@stemuluskidstech.com",
                parentName: "John Doe",
                parentPhone: "+2347052466716",
                birthday: "2018-05-31", // Today!
                progress: 40,
                avatarColor: "bg-orange-700",
                tutorName: "Sarah Jane",
                classroomLink: '',
                skills: { logic: 60, loops: 70, variables: 40, syntax: 55, projects: 75 },
                metrics: { attended: 8, total: 20, projects: 2, lines: 0 }
            }
        ],
        schedules: [
            {
                id: "sch-2001",
                studentId: "std-1001",
                studentName: "Daniel M.",
                course: "Python Programming",
                date: "2026-06-01",
                time: "16:00",
                duration: "60",
                mentor: "Sarah Jane",
                link: "https://zoom.us/j/1234567890",
                attendanceStatus: "pending" // pending, present, absent
            },
            {
                id: "sch-2002",
                studentId: "std-1002",
                studentName: "Sarah M.",
                course: "Scratch Creators",
                date: "2026-05-31", // Today
                time: "15:00",
                duration: "60",
                mentor: "Sarah Jane",
                link: "https://zoom.us/j/0987654321",
                attendanceStatus: "pending"
            }
        ],
        enrollments: [
            {
                id: "enr-3001",
                studentFirstName: "Chidi",
                studentLastName: "A.",
                studentAge: 10,
                studentGender: "Male",
                experience: "Some",
                program: "Robotics & Arduino",
                parentName: "Kalu A.",
                email: "kalu@gmail.com",
                phone: "+2348123456789",
                status: "pending", // pending, approved
                timestamp: "2026-05-30T10:00:00.000Z"
            }
        ],
        rescheduleRequests: [
            {
                id: "res-4001",
                scheduleId: "sch-2001",
                studentName: "Daniel M.",
                course: "Python Programming",
                currentDate: "2026-06-01",
                currentTime: "16:00",
                requestedDate: "2026-06-03",
                requestedTime: "17:30",
                status: "pending", // pending, approved, declined
                parentEmail: "parent@stemuluskidstech.com"
            }
        ],
        progressReports: [
            {
                id: "rep-5001",
                studentId: "std-1001",
                studentName: "Daniel M.",
                program: "Python Programming",
                date: "2026-05-04",
                tutorName: "Sarah Jane",
                module: "Introduction to Python",
                grade: "A",
                feedback: "Daniel's first class was excellent! He learned how to use print statements and simple string concatenations. He built a 'Bio Generator' script."
            },
            {
                id: "rep-5002",
                studentId: "std-1001",
                studentName: "Daniel M.",
                program: "Python Programming",
                date: "2026-05-11",
                tutorName: "Sarah Jane",
                module: "Math Operators & Variables",
                grade: "A-",
                feedback: "Daniel worked on math operators and variable assignments. He created a basic calculator. He struggled slightly with modulo operations but understood them by the end."
            },
            {
                id: "rep-5003",
                studentId: "std-1001",
                studentName: "Daniel M.",
                program: "Python Programming",
                date: "2026-05-18",
                tutorName: "Sarah Jane",
                module: "Conditional Logic",
                grade: "A+",
                feedback: "Superb understanding of if/elif/else statements! Daniel created a text-based decision-making game about choosing items in a dungeon. Exceptional creativity."
            },
            {
                id: "rep-5004",
                studentId: "std-1001",
                studentName: "Daniel M.",
                program: "Python Programming",
                date: "2026-05-25",
                tutorName: "Sarah Jane",
                module: "Variables & Loops",
                grade: "A",
                feedback: "Daniel is doing exceptionally well. He grasped the concept of for loops quickly and built a mini text adventure game. Recommended next step is nested loops."
            },
            {
                id: "rep-5005",
                studentId: "std-1002",
                studentName: "Sarah M.",
                program: "Scratch Creators",
                date: "2026-05-06",
                tutorName: "Sarah Jane",
                module: "Introduction to Scratch Blocks",
                grade: "A",
                feedback: "Sarah explored the Scratch stage and motion blocks. She created a cat character that runs back and forth when clicked. Great enthusiasm!"
            },
            {
                id: "rep-5006",
                studentId: "std-1002",
                studentName: "Sarah M.",
                program: "Scratch Creators",
                date: "2026-05-13",
                tutorName: "Sarah Jane",
                module: "Events & Costumes",
                grade: "B+",
                feedback: "Sarah learned to animate characters by changing costumes and responding to spacebar key events. She created a dancing sprite. Needs to remember to clean up block clutter."
            },
            {
                id: "rep-5007",
                studentId: "std-1002",
                studentName: "Sarah M.",
                program: "Scratch Creators",
                date: "2026-05-20",
                tutorName: "Sarah Jane",
                module: "Sound & Broadcasting",
                grade: "A",
                feedback: "Excellent class! Sarah learned to broadcast messages between sprites. She built a simple dialog scene between a dragon and a wizard with sound effects."
            },
            {
                id: "rep-5008",
                studentId: "std-1002",
                studentName: "Sarah M.",
                program: "Scratch Creators",
                date: "2026-05-27",
                tutorName: "Sarah Jane",
                module: "Basic Loops",
                grade: "A-",
                feedback: "Sarah worked with repeat blocks. She animated a series of moving obstacles. She is showing a strong sense of game design."
            }
        ],
        certificates: [
            {
                id: "cert-6001",
                credential_id: "STEM-2026-DF89",
                student_name: "Daniel M.",
                program_name: "Scratch Coding Mastery",
                grade_level: "Distinction",
                issue_date: "2026-05-15"
            },
            {
                id: "cert-6002",
                credential_id: "STEM-2026-QWHF",
                student_name: "Modesire Abdusalam Shittu",
                program_name: "Python Data App Academy: Building Web Apps with Streamlit",
                grade_level: "Distinction",
                issue_date: "2026-05-31"
            }
        ],
        onboarding: {
            "parent@stemuluskidstech.com": {
                completed: false,
                currentStep: 1, // 1: Profile, 2: Setup Slack/ntfy, 3: Schedule Review
                steps: [
                    { id: "profile", label: "Verify Contact Information", done: true },
                    { id: "alerts", label: "Configure Birthday & Class Alerts", done: false },
                    { id: "schedule", label: "Accept Tutorial Schedule", done: false }
                ]
            }
        },
        notifications: [
            {
                id: "not-7001",
                title: "Welcome to STEMulus!",
                message: "Explore your new premium dashboard. Track sessions, view reports, and download certificates.",
                timestamp: "2026-05-31T10:00:00.000Z",
                read: false,
                userEmail: "parent@stemuluskidstech.com"
            }
        ],
        milestones: [
            {
                id: "mil-1",
                studentName: "Daniel M.",
                studentAge: 11,
                category: "Python Programming",
                image: "Robot.mp4",
                title: "Daniel explaining his SpaceX trajectory simulator",
                description: "Daniel explains his conditional branch checks, variable tracking, and loops that calculate orbital escape velocity for a SpaceX Falcon 9 simulator.",
                tags: "Daniel's SpaceX Flight Simulator"
            },
            {
                id: "mil-2",
                studentName: "Sarah M.",
                studentAge: 8,
                category: "Scratch Creators",
                image: "Robot_scrub.mp4",
                title: "Sarah showing her animated dialogue scenes",
                description: "Sarah demonstrates message broadcasting and costume change events to synchronize a visual scene between a dragon sprite and a wizard.",
                tags: "Sarah's Scratch Adventure Dialog"
            },
            {
                id: "mil-3",
                studentName: "Chidi A.",
                studentAge: 10,
                category: "Robotics & Arduino",
                image: "Robot.mp4",
                title: "Chidi demonstrating his self-steering sonar logic",
                description: "Chidi reviews his C++ loop logic that calculates distance coordinates using an ultrasonic sensor and steers two servo motors to avoid grid barriers.",
                tags: "Chidi's Autonomous Sonar Rover"
            }
        ],
        ntfyTopic: "stm-bday-qm4p7s9ke2ax1nf",
        attendanceRecords: [],
        monthlyReports: [],
        emailQueue: [],
        passwordResetRequests: []
    };

    // Helper to retrieve data from localStorage
    function getDB() {
        const dbStr = localStorage.getItem("stemulus_db");
        if (!dbStr) {
            localStorage.setItem("stemulus_db", JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
        try {
            const parsed = JSON.parse(dbStr);
            if (!parsed.attendanceRecords) {
                parsed.attendanceRecords = [];
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }
            if (!parsed.monthlyReports) {
                try {
                    var legacyReports = JSON.parse(localStorage.getItem("stemulus_monthly_reports") || "[]");
                    parsed.monthlyReports = Array.isArray(legacyReports) ? legacyReports : [];
                } catch(e) {
                    parsed.monthlyReports = [];
                }
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }
            // Sanitize any legacy students created during testing that had synthetic "today" birthdays
            if (parsed.students && Array.isArray(parsed.students)) {
                let cleaned = false;
                parsed.students.forEach(s => {
                    if (s.id !== 'std-1001' && s.id !== 'std-1002' && !s.hasExplicitBirthday) {
                        if (s.birthday && (s.birthday.endsWith('-09-05') || s.birthday.endsWith('-09-04') || s.birthday.endsWith('-09-06'))) {
                            s.birthday = '';
                            cleaned = true;
                        }
                    }
                });
                if (cleaned) {
                    localStorage.setItem("stemulus_db", JSON.stringify(parsed));
                }
            }
            // Proactively ensure STEM-2026-QWHF is in the local storage certificates
            if (parsed.certificates && !parsed.certificates.some(c => c.credential_id === "STEM-2026-QWHF")) {
                parsed.certificates.push({
                    id: "cert-6002",
                    credential_id: "STEM-2026-QWHF",
                    student_name: "Modesire Abdusalam Shittu",
                    program_name: "Python Data App Academy: Building Web Apps with Streamlit",
                    grade_level: "Distinction",
                    issue_date: "2026-05-31"
                });
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            console.error("Local DB corrupt. Re-initializing...", e);
            localStorage.setItem("stemulus_db", JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
    }

    // Helper to save data to localStorage & Cloud
    function saveDB(db) {
        try { localStorage.setItem('stemulus_db', JSON.stringify(db)); } catch(e) { console.warn('Storage quota exceeded:', e); }
        window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));

        // Broadcast updates to Firebase Firestore for cloud persistence
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            try {
                isSyncing = true;
                firebase.firestore().collection('state').doc('current').set(db)
                    .then(() => { isSyncing = false; console.log('[STEMulus Cloud] [Synced] Database state synced to Firestore'); })
                    .catch(err => { isSyncing = false; console.warn('[STEMulus Cloud] Firestore sync failed:', err); });
            } catch (e) {
                isSyncing = false;
                console.error('[STEMulus Cloud] Firestore sync error:', e);
            }
        }
    }

    // Session time-to-live: 8 hours
    var SESSION_TTL_MS = 8 * 60 * 60 * 1000;

    // Get currently logged-in user from session
    function getSession() {
        const sessionStr = sessionStorage.getItem("stemulus_session");
        if (!sessionStr) return null;
        try {
            const session = JSON.parse(sessionStr);
            if (session && session.issuedAt) {
                if (Date.now() - session.issuedAt > SESSION_TTL_MS) {
                    sessionStorage.clear();
                    return null;
                }
            }
            return session;
        } catch (e) {
            return null;
        }
    }

    async function login(email, password) {
        try {
        const db = getDB();
        const key = email.toLowerCase().trim();
        const user = db.users[key];
        if (!user) return { success: false, message: "Invalid email or password." };

        const inputHash = await hashPassword(password);

        let match = false;
        if (isHashed(user.password)) {
            match = user.password === inputHash;
        } else {
            // Plaintext still in store — compare directly, then upgrade
            match = user.password === password;
            if (match) {
                db.users[key].password = inputHash;
                saveDB(db);
            }
        }

        if (match) {
            const safeUser = { email: user.email, role: user.role, name: user.name, issuedAt: Date.now() };
            sessionStorage.setItem("stemulus_session", JSON.stringify(safeUser));
            return { success: true, user: safeUser };
        }
        return { success: false, message: "Invalid email or password." };
        } catch(err) { return { success: false, message: 'Login failed. Ensure you are on a secure (HTTPS) connection. Error: ' + err.message }; }
    }

    function logout() {
        sessionStorage.clear();
    }

    // --- Students Controller ---
    function getStudents(parentEmail = null) {
        const db = getDB();
        if (parentEmail) {
            return db.students.filter(s => s.parentEmail && s.parentEmail.toLowerCase() === parentEmail.toLowerCase());
        }
        return db.students;
    }

    function getStudentsByTutor(tutorIdentifier) {
        var db = getDB ? getDB() : JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        var students = db.students || [];
        if (!tutorIdentifier) return students;
        var q = tutorIdentifier.toLowerCase().trim();
        return students.filter(function(s) {
            var tEmail = (s.tutorEmail || '').toLowerCase().trim();
            var tName = (s.tutorName || '').toLowerCase().trim();
            if (tEmail && tEmail === q) return true;
            if (tName && (tName === q || q.includes(tName) || tName.includes(q))) return true;
            if (q.includes('tutor') && (!tEmail || tEmail.includes('tutor') || tName.includes('tutor') || tName.includes('sarah'))) return true;
            return false;
        });
    }

    function getParents() {
        var db = getDB();
        var students = db.students || [];
        var users = db.users || {};
        var parentsMap = {};

        // 1. Gather all users registered with role 'parent'
        Object.keys(users).forEach(function(emailKey) {
            var u = users[emailKey];
            if (u && (u.role === 'parent' || (!u.role && emailKey.includes('parent')))) {
                var normEmail = (u.email || emailKey).toLowerCase().trim();
                parentsMap[normEmail] = {
                    id: 'parent-' + normEmail.replace(/[^a-z0-9]/g, '_'),
                    name: u.name || 'Parent Account',
                    email: normEmail,
                    phone: u.phone || u.whatsapp || '',
                    whatsapp: u.whatsapp || u.phone || '',
                    country: u.country || 'Nigeria',
                    role: 'parent',
                    createdAt: u.createdAt || new Date().toISOString(),
                    status: u.status || 'active',
                    children: []
                };
            }
        });

        // 2. Scan students to associate children and discover any parents in student records
        students.forEach(function(s) {
            var pEmail = (s.parentEmail || '').toLowerCase().trim();
            if (!pEmail) return;

            if (!parentsMap[pEmail]) {
                parentsMap[pEmail] = {
                    id: 'parent-' + pEmail.replace(/[^a-z0-9]/g, '_'),
                    name: s.parentName || 'Parent Account',
                    email: pEmail,
                    phone: s.parentPhone || s.parentWhatsapp || '',
                    whatsapp: s.parentWhatsapp || s.parentPhone || '',
                    country: s.country || 'Nigeria',
                    role: 'parent',
                    createdAt: s.createdAt || new Date().toISOString(),
                    status: s.status || 'active',
                    children: []
                };
            }

            // Associate child with parent
            var existingChild = parentsMap[pEmail].children.find(function(c) { return c.id === s.id; });
            if (!existingChild) {
                parentsMap[pEmail].children.push({
                    id: s.id,
                    name: (s.firstName || '') + ' ' + (s.lastName || ''),
                    program: s.program || 'General STEM',
                    progress: s.progress || 0,
                    age: s.age || 0,
                    status: s.status || 'active'
                });
            }

            // Sync phone/name if missing
            if (!parentsMap[pEmail].phone && s.parentPhone) {
                parentsMap[pEmail].phone = s.parentPhone;
                parentsMap[pEmail].whatsapp = s.parentPhone;
            }
            if ((!parentsMap[pEmail].name || parentsMap[pEmail].name === 'Parent Account') && s.parentName) {
                parentsMap[pEmail].name = s.parentName;
            }
        });

        return Object.values(parentsMap);
    }

    function addStudent(student) {
        const db = getDB();
        student.id = "std-" + Date.now();
        if (student.status === undefined) student.status = 'active';
        if (student.remindersPaused === undefined) student.remindersPaused = false;
        student.birthday = (student.birthday && typeof student.birthday === 'string' && student.birthday.trim().length >= 10) ? student.birthday.trim() : '';
        student.hasExplicitBirthday = !!(student.birthday);
        db.students.push(student);
        saveDB(db);
        return student;
    }

    function updateStudent(studentData) {
        const db = getDB();
        const idx = db.students.findIndex(s => s.id === studentData.id);
        if (idx !== -1) {
            db.students[idx] = { ...db.students[idx], ...studentData };
            saveDB(db);
            return db.students[idx];
        }
        return null;
    }

    function deleteStudent(id) {
        const db = getDB();
        db.students = db.students.filter(s => s.id !== id);
        saveDB(db);
    }

    function setRemindersPaused(studentId, paused) {
        var db = getDB();
        var student = (db.students||[]).find(function(s){ return s.id===studentId; });
        if (!student) return false;
        student.remindersPaused = !!paused;
        saveDB(db);
        return true;
    }

    function updateStudentStatus(studentId, status) {
        var db = getDB();
        var student = (db.students||[]).find(function(s){ return s.id===studentId; });
        if (!student) return false;
        student.status = status;
        saveDB(db);
        return true;
    }

    function updateTutorStatus(tutorEmail, status) {
        var db = getDB();
        var key = (tutorEmail||'').toLowerCase().trim();
        var tutor = db.users && db.users[key];
        if (!tutor) return false;
        tutor.status = status;
        saveDB(db);
        return true;
    }

    // --- Tutors Controller ---
    function getTutors() {
        const db = getDB();
        // Derive tutors from users + student assignments
        const tutorUsers = Object.values(db.users).filter(u => u.role === 'tutor');
        // Also add tutors inferred from student records (for legacy seed data)
        const tutorNamesFromStudents = [...new Set(db.students.map(s => s.tutorName).filter(Boolean))];
        const tutorMap = {};
        tutorUsers.forEach(u => {
            tutorMap[u.name || u.email] = { name: u.name || u.email, email: u.email };
        });
        tutorNamesFromStudents.forEach(name => {
            if (!tutorMap[name]) {
                const matchedUser = tutorUsers.find(u => u.name === name);
                tutorMap[name] = { name, email: matchedUser ? matchedUser.email : (name.toLowerCase().replace(/\s+/g,'') + '@stemuluskidstech.com') };
            }
        });
        return Object.values(tutorMap);
    }

    // --- Schedules Controller ---
    function getSchedules(studentId = null) {
        const db = getDB();
        if (studentId) {
            return db.schedules.filter(s => s.studentId === studentId);
        }
        return db.schedules;
    }

    function addSchedule(session) {
        const db = getDB();
        session.id = "sch-" + Date.now();
        db.schedules.push(session);
        saveDB(db);
        return session;
    }

    function updateSchedule(id, updatedFields) {
        const db = getDB();
        const idx = db.schedules.findIndex(s => s.id === id);
        if (idx !== -1) {
            db.schedules[idx] = { ...db.schedules[idx], ...updatedFields };
            saveDB(db);
            return db.schedules[idx];
        }
        return null;
    }

    function deleteSchedule(id) {
        const db = getDB();
        db.schedules = db.schedules.filter(s => s.id !== id);
        saveDB(db);
    }

    // --- Attendance Records Controller ---
    function getAttendanceRecords(tutorEmail = null) {
        const db = getDB();
        db.attendanceRecords = db.attendanceRecords || [];
        if (tutorEmail) {
            return db.attendanceRecords.filter(r => r.tutorEmail === tutorEmail);
        }
        return db.attendanceRecords;
    }

    function addAttendanceRecord(record) {
        if (!record || !record.studentId || !record.topic || !Array.isArray(record.coursesCovered) || record.coursesCovered.length === 0) {
            return { success: false, message: 'Missing required fields: studentId, topic, and coursesCovered (array).' };
        }
        const db = getDB();
        db.attendanceRecords = db.attendanceRecords || [];
        record.id = "att-" + Date.now();
        record.status = "pending";
        record.timestamp = new Date().toISOString();
        // Optional fields from 4-section attendance form (undefined means not provided — old records are unaffected)
        if (record.punctuality       === undefined) record.punctuality       = '';
        if (record.whatBuilt         === undefined) record.whatBuilt         = '';
        if (record.assignmentStatus  === undefined) record.assignmentStatus  = '';
        if (record.conceptGrasp      === undefined) record.conceptGrasp      = 0;
        if (record.tutorComment      === undefined) record.tutorComment      = '';
        if (record.homeworkAssigned  === undefined) record.homeworkAssigned  = '';
        db.attendanceRecords.push(record);
        saveDB(db);
        return record;
    }

    function updateAttendanceStatus(id, status) {
        const db = getDB();
        db.attendanceRecords = db.attendanceRecords || [];
        const idx = db.attendanceRecords.findIndex(r => r.id === id);
        if (idx !== -1) {
            db.attendanceRecords[idx].status = status;
            
            // If approved, update matching schedule and student metrics
            if (status === 'approved') {
                const record = db.attendanceRecords[idx];
                const schedIdx = db.schedules.findIndex(s => 
                    s.studentId === record.studentId && 
                    s.date === record.classDate
                );
                if (schedIdx !== -1) {
                    db.schedules[schedIdx].attendanceStatus = 'present';
                }
                
                // Update student metrics (attended count)
                const studIdx = db.students.findIndex(s => s.id === record.studentId);
                if (studIdx !== -1) {
                    if (!db.students[studIdx].metrics) {
                        db.students[studIdx].metrics = { attended: 0, total: 0, projects: 0, lines: 0 };
                    }
                    db.students[studIdx].metrics.attended = (db.students[studIdx].metrics.attended || 0) + 1;
                    db.students[studIdx].metrics.total = (db.students[studIdx].metrics.total || 0) + 1;
                }

                // Add progress report
                db.progressReports = db.progressReports || [];
                db.progressReports.push({
                    id: "rep-" + Date.now(),
                    studentId: record.studentId,
                    studentName: record.studentName,
                    program: record.coursesCovered.join(", "),
                    date: record.classDate,
                    tutorName: record.tutorName,
                    module: record.topic,
                    grade: "A",
                    feedback: record.notes
                });
            }
            
            saveDB(db);
            return db.attendanceRecords[idx];
        }
        return null;
    }

    function checkDuplicateAttendance(studentId, date, time, topic, courses) {
        const db = getDB();
        const records = db.attendanceRecords || [];
        const matches = records.filter(r => r.studentId === studentId && r.classDate === date);
        if (matches.length === 0) {
            return { has_duplicate: false, has_exact_duplicate: false, duplicates: [] };
        }
        
        let hasExact = false;
        const duplicateList = matches.map(dup => {
            const timeMatches = (dup.classTime === time);
            const topicMatches = (dup.topic.toLowerCase().trim() === topic.toLowerCase().trim());
            const coursesMatch = (JSON.stringify(dup.coursesCovered.sort()) === JSON.stringify(courses.sort()));
            const isExact = timeMatches && topicMatches && coursesMatch;
            if (isExact) hasExact = true;
            
            return {
                time: dup.classTime,
                tutor: dup.tutorName,
                status: dup.status === 'pending' ? 'Pending' : (dup.status === 'approved' ? 'Approved' : 'Rejected'),
                topic: dup.topic,
                courses: dup.coursesCovered.join(", "),
                time_matches: timeMatches,
                topic_matches: topicMatches,
                courses_match: coursesMatch,
                is_exact_match: isExact
            };
        });

        return {
            has_duplicate: true,
            has_exact_duplicate: hasExact,
            duplicates: duplicateList
        };
    }

    // --- Reschedule Requests ---
    function getRescheduleRequests(parentEmail = null) {
        const db = getDB();
        if (parentEmail) {
            return db.rescheduleRequests.filter(r => r.parentEmail === parentEmail);
        }
        return db.rescheduleRequests;
    }

    function submitReschedule(request) {
        const db = getDB();
        request.id = "res-" + Date.now();
        request.status = "pending";
        db.rescheduleRequests.push(request);
        
        // Add Admin notification
        db.notifications.push({
            id: "not-" + Date.now(),
            title: "New Reschedule Request",
            message: `${request.studentName} requested to reschedule ${request.course} from ${request.currentDate} to ${request.requestedDate}`,
            timestamp: new Date().toISOString(),
            read: false,
            userEmail: "admin@stemuluskidstech.com"
        });

        saveDB(db);
        return request;
    }

    function approveReschedule(id) {
        const db = getDB();
        const reqIdx = db.rescheduleRequests.findIndex(r => r.id === id);
        if (reqIdx !== -1) {
            const req = db.rescheduleRequests[reqIdx];
            req.status = "approved";

            // Update actual schedule
            const schIdx = db.schedules.findIndex(s => s.id === req.scheduleId);
            if (schIdx !== -1) {
                db.schedules[schIdx].date = req.requestedDate;
                db.schedules[schIdx].time = req.requestedTime;
            }

            // Create notification for Parent
            db.notifications.push({
                id: "not-" + Date.now(),
                title: "Reschedule Approved",
                message: `Your request to move ${req.course} to ${req.requestedDate} at ${req.requestedTime} has been approved.`,
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: req.parentEmail
            });

            saveDB(db);
            return true;
        }
        return false;
    }

    function declineReschedule(id) {
        const db = getDB();
        const reqIdx = db.rescheduleRequests.findIndex(r => r.id === id);
        if (reqIdx !== -1) {
            const req = db.rescheduleRequests[reqIdx];
            req.status = "declined";

            db.notifications.push({
                id: "not-" + Date.now(),
                title: "Reschedule Declined",
                message: `Your request to move ${req.course} to ${req.requestedDate} was declined. Please contact support.`,
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: req.parentEmail
            });

            saveDB(db);
            return true;
        }
        return false;
    }

    // --- Onboarding Controller ---
    function getOnboarding(email) {
        const db = getDB();
        return db.onboarding[email] || { completed: true, steps: [] };
    }

    function completeOnboardingStep(email, stepId) {
        const db = getDB();
        if (db.onboarding[email]) {
            const step = db.onboarding[email].steps.find(s => s.id === stepId);
            if (step) {
                step.done = true;
                
                // Check if all steps completed
                const allDone = db.onboarding[email].steps.every(s => s.done);
                if (allDone) {
                    db.onboarding[email].completed = true;
                    // Trigger welcome notification
                    db.notifications.push({
                        id: "not-" + Date.now(),
                        title: "Onboarding Complete!",
                        message: "Thank you for completing onboarding. Your child is all set for their coding class!",
                        timestamp: new Date().toISOString(),
                        read: false,
                        userEmail: email
                    });
                }
                saveDB(db);
            }
            return db.onboarding[email];
        }
        return null;
    }

    // --- Certificates Controller ---
    function getCertificates(studentName = null) {
        const db = getDB();
        if (studentName) {
            return db.certificates.filter(c => c.student_name.toLowerCase().includes(studentName.toLowerCase()));
        }
        return db.certificates;
    }

    function addCertificate(cert) {
        const db = getDB();
        cert.id = "cert-" + Date.now();
        db.certificates.push(cert);

        var certStudent = (db.students || []).find(function(s) { return (s.firstName + ' ' + s.lastName) === cert.student_name || s.firstName === cert.student_name; });
        if (certStudent && certStudent.parentEmail) {
            if (!db.notifications) db.notifications = [];
            db.notifications.push({ id: 'notif-cert-' + Date.now(), userEmail: certStudent.parentEmail.toLowerCase(), title: 'Certificate Issued', message: cert.student_name + ' has been awarded: ' + (cert.program_name || cert.program || 'STEM Program Certification') + '. Credential ID: ' + cert.credential_id, timestamp: new Date().toISOString(), read: false });
        }

        saveDB(db);

        // Dual-write to Firebase Firestore for cross-device verification
        try {
            if (typeof firebase !== 'undefined' && firebase.apps.length) {
                const firestoreDb = firebase.firestore();
                firestoreDb.collection('certificates').doc(cert.credential_id).set({
                    credential_id: cert.credential_id,
                    student_name: cert.student_name,
                    program_name: cert.program_name,
                    grade_level: cert.grade_level,
                    issue_date: cert.issue_date,
                    tutor_name: cert.tutor_name || 'STEMulus Faculty',
                    status: cert.status || 'issued',
                    director_note: cert.director_note || '',
                    issued_at: cert.issued_at || new Date().toISOString()
                }).then(() => {
                    console.log('[STEMulus] [Synced] Certificate synced to Firebase cloud:', cert.credential_id);
                }).catch(err => {
                    console.warn('[STEMulus] Firebase sync failed (offline?). Cert saved locally.', err);
                });
            }
        } catch(e) {
            console.warn('[STEMulus] Firebase not available for cert sync:', e);
        }

        return cert;
    }

    function deleteCertificate(id) {
        const db = getDB();
        // Find the cert before deleting to get its credential_id for Firebase removal
        const cert = db.certificates.find(c => c.id === id);
        db.certificates = db.certificates.filter(c => c.id !== id);
        saveDB(db);

        // Also delete from Firebase Firestore
        if (cert) {
            try {
                if (typeof firebase !== 'undefined' && firebase.apps.length) {
                    const firestoreDb = firebase.firestore();
                    firestoreDb.collection('certificates').doc(cert.credential_id).delete().then(() => {
                        console.log('[STEMulus] [Revoked] Certificate revoked from Firebase cloud:', cert.credential_id);
                    }).catch(err => {
                        console.warn('[STEMulus] Firebase delete failed:', err);
                    });
                }
            } catch(e) {
                console.warn('[STEMulus] Firebase not available for cert deletion:', e);
            }
        }
    }

    function updateCertificate(id, updates) {
        const db = getDB();
        const idx = db.certificates.findIndex(c => c.id === id || c.credential_id === id);
        if (idx !== -1) {
            db.certificates[idx] = { ...db.certificates[idx], ...updates };
            saveDB(db);
            // Dual-write update to Firestore
            try {
                if (typeof firebase !== 'undefined' && firebase.apps.length) {
                    const cert = db.certificates[idx];
                    firebase.firestore().collection('certificates').doc(cert.credential_id).set(cert, { merge: true }).catch(() => {});
                }
            } catch(e) {}
            return db.certificates[idx];
        }
        return null;
    }

    function getCurrentScheduledStudent() {
        const session = getSession();
        const db = getDB();
        if (!session) return null;
        const tutorSchedules = (db.schedules || []).filter(s => 
            (s.mentor === session.name || s.tutorEmail === session.email) && s.attendanceStatus === 'pending'
        );
        if (tutorSchedules.length > 0) {
            const sched = tutorSchedules[0];
            return {
                id: sched.studentId,
                name: sched.studentName,
                course: sched.course,
                scheduleId: sched.id,
                time: sched.time,
                date: sched.date
            };
        }
        return null;
    }

    function getTutorStudents(tutorEmail = null) {
        const session = getSession();
        const email = tutorEmail || (session && session.email);
        const name = session && session.name;
        const db = getDB();
        const students = db.students || [];
        if (!email && !name) return students;
        if (session && session.role === 'admin') return students;
        const filtered = students.filter(s => 
            (email && s.tutorEmail && s.tutorEmail.toLowerCase() === email.toLowerCase()) ||
            (name && s.tutorName && s.tutorName.toLowerCase() === name.toLowerCase())
        );
        return filtered.length > 0 ? filtered : students;
    }


    // --- Progress Reports Controller ---
    function getReports(studentId = null) {
        const db = getDB();
        if (studentId) {
            return db.progressReports.filter(r => r.studentId === studentId);
        }
        return db.progressReports;
    }

    function addReport(report) {
        const db = getDB();
        report.id = "rep-" + Date.now();
        db.progressReports.push(report);

        // Notify parent
        const student = db.students.find(s => s.id === report.studentId);
        if (student) {
            db.notifications.push({
                id: "not-" + Date.now(),
                title: "New Progress Report",
                message: `A new progress report for ${student.firstName} is available in your dashboard.`,
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: student.parentEmail
            });
        }

        saveDB(db);
        return report;
    }

    // --- Enrollments (Student Registrations) Controller ---
    function getEnrollments() {
        const db = getDB();
        return db.enrollments;
    }

    function addEnrollment(enrollment) {
        const db = getDB();
        enrollment.id = "enr-" + Date.now();
        enrollment.status = "pending";
        enrollment.timestamp = new Date().toISOString();
        db.enrollments.push(enrollment);
        saveDB(db);
        return enrollment;
    }

    async function approveEnrollment(id) {
        const db = getDB();
        const idx = db.enrollments.findIndex(e => e.id === id);
        if (idx !== -1) {
            const enr = db.enrollments[idx];
            enr.status = "approved";

            // Add as active student
            const newStudent = {
                id: "std-" + Date.now(),
                firstName: enr.studentFirstName,
                lastName: enr.studentLastName,
                age: parseInt(enr.studentAge),
                gender: enr.studentGender,
                experience: enr.experience,
                program: enr.program,
                status: "active",
                parentEmail: enr.email,
                parentName: enr.parentName,
                birthday: (enr.studentBirthday && typeof enr.studentBirthday === 'string' && enr.studentBirthday.trim().length >= 10) ? enr.studentBirthday.trim() : "",
                hasExplicitBirthday: !!(enr.studentBirthday && enr.studentBirthday.trim()),
                fatherName: enr.fatherName || "",
                fatherPhone: enr.fatherPhone || "",
                motherName: enr.motherName || "",
                motherPhone: enr.motherPhone || "",
                progress: 0,
                avatarColor: "bg-purple-500",
                tutorName: "Sarah Jane",
                classroomLink: enr.classroomLink || ''
            };
            db.students.push(newStudent);

            // Add a mock upcoming class
            db.schedules.push({
                id: "sch-" + Date.now(),
                studentId: newStudent.id,
                studentName: `${newStudent.firstName} ${newStudent.lastName}`,
                course: newStudent.program,
                date: new Date(Date.now() + 2*24*3600*1000).toISOString().split('T')[0], // 2 days from now
                time: "16:30",
                duration: "60",
                mentor: "Sarah Jane",
                link: "https://zoom.us/j/mock-link",
                attendanceStatus: "pending"
            });

            // Create notification for Parent
            db.notifications.push({
                id: "not-" + Date.now(),
                title: "Student Registered!",
                message: `Congratulations! ${enr.studentFirstName}'s enrollment in ${enr.program} has been approved.`,
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: enr.email
            });

            // Make sure parent user exists
            if (!db.users[enr.email.toLowerCase()]) {
                var pwdChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                var randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(function(b) { return pwdChars[b % pwdChars.length]; }).join('');
                const defaultPwd = await hashPassword(randomPassword);
                db.users[enr.email.toLowerCase()] = {
                    email: enr.email,
                    password: defaultPwd,
                    role: "parent",
                    name: enr.parentName
                };

                // Send the generated password to the parent via notification
                db.notifications.push({
                    id: "not-" + (Date.now() + 1),
                    title: "Your Portal Login Credentials",
                    message: `Welcome ${enr.parentName}! Your STEMulus parent portal login: Email: ${enr.email} | Temporary Password: ${randomPassword} — Please change this after your first login.`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    userEmail: enr.email
                });

                // Queue welcome email with portal credentials
                db.emailQueue = db.emailQueue || [];
                db.emailQueue.push({
                    id: 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                    type: 'welcome',
                    status: 'draft',
                    to: enr.email || enr.parentEmail,
                    recipientName: enr.parentName || 'Parent',
                    subject: 'Welcome to STEMulus — ' + (enr.studentFirstName||'') + "'s coding journey starts!",
                    htmlPreview: 'Welcome email for ' + (enr.parentName||'Parent') + ' — contains portal login credentials. Temp password: ' + randomPassword,
                    data: {
                        parentEmail: enr.email || enr.parentEmail,
                        parentName: enr.parentName || 'Parent',
                        studentName: (enr.studentFirstName||'') + ' ' + (enr.studentLastName||''),
                        courseName: enr.program || enr.course || '',
                        tempPassword: randomPassword,
                        classroomLink: enr.classroomLink || ''
                    },
                    triggeredBy: 'enrollment_approval:' + (enr.id||id),
                    createdAt: new Date().toISOString(),
                    sentAt: null,
                    editedSubject: null,
                    editedBody: null
                });

                // Initialize parent onboarding
                db.onboarding[enr.email] = {
                    completed: false,
                    currentStep: 1,
                    steps: [
                        { id: "profile", label: "Verify Contact Information", done: false },
                        { id: "alerts", label: "Configure Birthday & Class Alerts", done: false },
                        { id: "schedule", label: "Accept Tutorial Schedule", done: false }
                    ]
                };
            }

            saveDB(db);
            dispatchEvent(new CustomEvent('stemulusDbUpdated'));
            return true;
        }
        return false;
    }

    // --- Birthday Notification / NTFY Alert ---
    async function triggerBirthdayNtfy(student) {
        if (!student || !student.birthday || typeof student.birthday !== 'string' || student.birthday.trim().length < 10) {
            console.warn("[Birthday] Skipping birthday alert: Student has no recorded birthday.");
            return { success: false, message: "Student has no recorded birthday." };
        }
        const db = getDB();
        const topic = db.ntfyTopic || "stm-bday-qm4p7s9ke2ax1nf";
        const title = `[Birthday] STEMulus Birthday Alert: ${student.firstName} ${student.lastName}!`;
        const message = `Our student ${student.firstName} ${student.lastName} (Age ${student.age}) is celebrating their birthday today!\nLet's send them a special coding challenge or congratulations!\nParent: ${student.parentName} (${student.parentPhone})`;

        try {
            const response = await fetch(`https://ntfy.sh/${topic}`, {
                method: 'POST',
                headers: {
                    'Title': title,
                    'Priority': 'default',
                    'Tags': 'birthday,tada,party_popper',
                },
                body: message
            });

            // Log notification locally
            db.notifications.push({
                id: "not-" + Date.now(),
                title: `Birthday Alert Sent for ${student.firstName}`,
                message: `ntfy alert successfully broadcast to topic: ${topic}`,
                timestamp: new Date().toISOString(),
                read: true,
                userEmail: "admin@stemuluskidstech.com"
            });
            saveDB(db);

            return { success: response.ok, topic };
        } catch (e) {
            console.error("Failed to send NTFY birthday alert:", e);
            return { success: false, error: e };
        }
    }

    // --- Notifications Controller ---
    function getNotifications(email) {
        const db = getDB();
        return db.notifications.filter(n => (n.userEmail||'').toLowerCase() === (email||'').toLowerCase()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function addNotification(notif) {
        const db = getDB();
        notif.id = "not-" + Date.now();
        notif.timestamp = notif.timestamp || new Date().toISOString();
        notif.read = false;
        notif.userEmail = (notif.userEmail || '').toLowerCase();
        db.notifications.push(notif);
        saveDB(db);
        return notif;
    }

    function markNotificationsRead(email) {
        const db = getDB();
        db.notifications.forEach(n => {
            if (n.userEmail === email) n.read = true;
        });
        saveDB(db);
    }

    function syncLegacyMonthlyReports(reportsList) {
        try {
            localStorage.setItem('stemulus_monthly_reports', JSON.stringify(reportsList));
        } catch(e) {}
    }

    function getMonthlyReports(filter) {
        var db = getDB();
        var reports = db.monthlyReports || [];
        if (!filter) return reports;
        if (typeof filter === 'string') {
            var filterLower = filter.toLowerCase().trim();
            var currentSession = getSession();
            if (currentSession && currentSession.role === 'admin' && filterLower === (currentSession.email || '').toLowerCase()) {
                return reports;
            }
            return reports.filter(function(r) {
                return (r.tutorEmail && r.tutorEmail.toLowerCase() === filterLower) ||
                       (r.parentEmail && r.parentEmail.toLowerCase() === filterLower) ||
                       (r.studentId && r.studentId === filter) ||
                       (r.status && r.status === filter);
            });
        }
        if (typeof filter === 'object') {
            return reports.filter(function(r) {
                for (var key in filter) {
                    if (filter[key] !== undefined && filter[key] !== null) {
                        var val = r[key];
                        if (typeof val === 'string' && typeof filter[key] === 'string') {
                            if (val.toLowerCase() !== filter[key].toLowerCase()) return false;
                        } else if (val !== filter[key]) {
                            return false;
                        }
                    }
                }
                return true;
            });
        }
        return reports;
    }

    function addMonthlyReport(report) {
        var db = getDB();
        if (!db.monthlyReports) db.monthlyReports = [];
        
        // Link student profile if student exists in database
        if (report.studentName && (!report.studentId || !report.parentEmail)) {
            var sNameLower = report.studentName.toLowerCase().trim();
            var matched = (db.students || []).find(function(s) {
                var full = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim();
                return full === sNameLower || (s.firstName && s.firstName.toLowerCase() === sNameLower);
            });
            if (matched) {
                report.studentId = report.studentId || matched.id;
                report.parentEmail = report.parentEmail || matched.parentEmail;
                report.parentName = report.parentName || matched.parentName;
                if (!report.course && matched.program) report.course = matched.program;
            }
        }

        // If ID exists and is already in db (e.g. resubmitting a rejected report)
        var existingIdx = report.id ? db.monthlyReports.findIndex(function(r){ return r.id === report.id; }) : -1;
        if (existingIdx !== -1) {
            report.status = 'pending_review';
            report.resubmittedAt = new Date().toISOString();
            report.rejectionReason = ''; // Cleared upon tutor redo
            db.monthlyReports[existingIdx] = Object.assign({}, db.monthlyReports[existingIdx], report);
            saveDB(db);
            syncLegacyMonthlyReports(db.monthlyReports);
            return { success: true, id: report.id, isUpdate: true };
        }

        report.id = report.id || ('mrep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5));
        report.createdAt = report.createdAt || new Date().toISOString();
        report.submittedAt = report.submittedAt || new Date().toISOString();
        report.status = report.status || 'pending_review';
        report.rejectionReason = report.rejectionReason || '';
        report.adminNotes = report.adminNotes || '';
        db.monthlyReports.push(report);

        // Notify Admin of new monthly submission
        db.notifications = db.notifications || [];
        db.notifications.push({
            id: 'not-' + Date.now(),
            title: 'New Monthly Report Submitted',
            message: (report.tutorName || 'A tutor') + ' submitted a monthly report for ' + (report.studentName || 'a student') + ' (' + (report.month || 'Current Month') + '). Pending review.',
            timestamp: new Date().toISOString(),
            read: false,
            userEmail: 'admin@stemuluskidstech.com'
        });

        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        return { success: true, id: report.id };
    }

    function updateMonthlyReport(id, updates) {
        var db = getDB();
        db.monthlyReports = db.monthlyReports || [];
        var idx = db.monthlyReports.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        db.monthlyReports[idx] = Object.assign({}, db.monthlyReports[idx], updates);
        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        return db.monthlyReports[idx];
    }

    function rejectMonthlyReport(id, reason) {
        var db = getDB();
        db.monthlyReports = db.monthlyReports || [];
        var idx = db.monthlyReports.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        var r = db.monthlyReports[idx];
        r.status = 'rejected';
        r.rejectionReason = reason || 'Please revise your feedback and resubmit.';
        r.reviewedAt = new Date().toISOString();

        // Notify Tutor with revision details
        if (r.tutorEmail) {
            db.notifications = db.notifications || [];
            db.notifications.push({
                id: 'not-' + Date.now(),
                title: 'Monthly Report Revision Requested',
                message: 'Admin requested revisions for ' + (r.studentName || 'student') + '\'s ' + (r.month || '') + ' report: "' + r.rejectionReason + '". You can edit and resubmit in your portal.',
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: r.tutorEmail.toLowerCase()
            });
        }

        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        return r;
    }

    function approveAndSendMonthlyReport(id, adminEdits) {
        var db = getDB();
        db.monthlyReports = db.monthlyReports || [];
        var idx = db.monthlyReports.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        var r = db.monthlyReports[idx];

        if (adminEdits && typeof adminEdits === 'object') {
            Object.assign(r, adminEdits);
        }

        r.status = 'sent_to_parent';
        r.reviewedAt = new Date().toISOString();
        r.sentAt = new Date().toISOString();

        // Find or link student
        var matchedStudent = (db.students || []).find(function(s){
            return s.id === r.studentId || (r.studentName && ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim() === r.studentName.toLowerCase().trim());
        });

        var parentEmail = r.parentEmail || (matchedStudent ? matchedStudent.parentEmail : null);
        var sId = r.studentId || (matchedStudent ? matchedStudent.id : null);

        // Sync into progressReports for child's persistent historical timeline
        db.progressReports = db.progressReports || [];
        var existingProgressIdx = db.progressReports.findIndex(function(p){ return p.monthlyReportId === r.id; });
        var progEntry = {
            id: existingProgressIdx !== -1 ? db.progressReports[existingProgressIdx].id : ('rep-' + Date.now()),
            monthlyReportId: r.id,
            studentId: sId,
            studentName: r.studentName,
            program: r.course,
            date: (r.month ? r.month + '-28' : new Date().toISOString().split('T')[0]),
            tutorName: r.tutorName,
            module: r.module || 'Monthly Academic Review',
            grade: r.overallGrade || 'A',
            feedback: r.strengths ? (r.strengths + (r.recommendation ? ' | Recommendation: ' + r.recommendation : '')) : (r.topics || 'Monthly progress evaluation completed.')
        };
        if (existingProgressIdx !== -1) {
            db.progressReports[existingProgressIdx] = progEntry;
        } else {
            db.progressReports.push(progEntry);
        }

        // Notify Parent with link to official evaluation
        if (parentEmail) {
            db.notifications = db.notifications || [];
            db.notifications.push({
                id: 'not-' + Date.now(),
                title: 'Official Monthly Progress Report Ready! [Report]',
                message: 'The official ' + (r.month || '') + ' progress evaluation for ' + (r.studentName || 'your child') + ' is now available in your portal with full academic grades and clean printable PDF.',
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: parentEmail.toLowerCase()
            });

            // Queue welcome / report delivery email
            addToEmailQueue({
                type: 'monthly_report',
                to: parentEmail.toLowerCase(),
                recipientName: r.parentName || 'Parent',
                subject: 'STEMulus Official Monthly Academic Evaluation — ' + (r.studentName || 'Student') + ' (' + (r.month || '') + ')',
                htmlPreview: 'Official progress report for ' + (r.studentName || 'Student') + ' — Grade: ' + (r.overallGrade || 'A') + '. Available to download and print in your Parent Portal.',
                data: {
                    reportId: r.id,
                    studentName: r.studentName,
                    grade: r.overallGrade,
                    month: r.month,
                    course: r.course,
                    tutorName: r.tutorName
                },
                triggeredBy: 'admin_monthly_report_send:' + r.id
            });
        }

        // Notify Tutor
        if (r.tutorEmail) {
            db.notifications = db.notifications || [];
            db.notifications.push({
                id: 'not-' + Date.now() + '-tut',
                title: 'Monthly Report Dispatched to Parent',
                message: 'Your report for ' + (r.studentName || 'student') + ' (' + (r.month || '') + ') was approved by admin and dispatched to the parent.',
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: r.tutorEmail.toLowerCase()
            });
        }

        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        return r;
    }

    async function quickOnboardUser(params) {
        var db = getDB();
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@';
        var tempPwd = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(function(b){return chars[b%chars.length];}).join('');
        var hashed = await hashPassword(tempPwd);

        if (params.type === 'tutor') {
            var tutorEmail = (params.email || '').toLowerCase().trim();
            if (!tutorEmail) return { success: false, message: 'Tutor email is required.' };
            if (db.users && db.users[tutorEmail]) {
                return { success: false, message: 'A user with email ' + tutorEmail + ' already exists.' };
            }
            db.users[tutorEmail] = {
                email: tutorEmail,
                name: params.name || 'Tutor',
                role: 'tutor',
                password: hashed,
                createdAt: new Date().toISOString()
            };
            db.notifications = db.notifications || [];
            db.notifications.push({
                id: 'not-' + Date.now(),
                title: 'Welcome to STEMulus Faculty!',
                message: 'Your tutor portal account is active. Log in with your email and temporary password: ' + tempPwd,
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: tutorEmail
            });
            db.emailQueue = db.emailQueue || [];
            db.emailQueue.push({
                id: 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                type: 'tutor-welcome',
                status: 'draft',
                to: tutorEmail,
                recipientName: params.name || 'Tutor',
                subject: 'Welcome to STEMulus Faculty — Your Tutor Portal Access',
                htmlPreview: 'Welcome ' + (params.name || 'Tutor') + '! Your tutor portal credentials: Login: ' + tutorEmail + ' | Temp Password: ' + tempPwd,
                data: { tutorEmail: tutorEmail, tutorName: params.name || 'Tutor', tempPassword: tempPwd, subjects: params.program || '' },
                triggeredBy: 'quick_onboard_tutor',
                createdAt: new Date().toISOString(),
                sentAt: null,
                editedSubject: null,
                editedBody: null
            });
            saveDB(db);
            dispatchEvent(new CustomEvent('stemulusDbUpdated'));
            return { success: true, type: 'tutor', email: tutorEmail, tempPassword: tempPwd, name: params.name || 'Tutor' };
        } else {
            // Student + Parent
            var parentEmail = (params.email || '').toLowerCase().trim();
            if (!parentEmail) return { success: false, message: 'Parent email is required.' };
            if (!db.users[parentEmail]) {
                db.users[parentEmail] = {
                    email: parentEmail,
                    name: params.name || 'Parent',
                    role: 'parent',
                    password: hashed,
                    createdAt: new Date().toISOString()
                };
            }
            var childAge = parseInt(params.childAge) || 10;
            var parts = (params.childName || 'Student').trim().split(/\s+/);
            var fName = parts[0] || 'Student';
            var lName = parts.slice(1).join(' ') || (params.name ? params.name.split(' ').slice(-1)[0] : 'S.');
            
            var newStudent = {
                id: 'std-' + Date.now(),
                firstName: fName,
                lastName: lName,
                age: childAge,
                gender: params.gender || 'Not specified',
                experience: params.experience || 'Beginner',
                program: params.program || 'Python Programming Foundations',
                status: 'active',
                remindersPaused: false,
                parentEmail: parentEmail,
                parentName: params.name || 'Parent',
                parentPhone: params.phone || '',
                birthday: (params.birthday && typeof params.birthday === 'string' && params.birthday.trim().length >= 10) ? params.birthday.trim() : '',
                hasExplicitBirthday: !!(params.birthday && params.birthday.trim()),
                progress: 0,
                avatarColor: ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#2563EB', '#0891B2'][Math.floor(Math.random() * 7)],
                tutorName: params.tutorName || 'Sarah Jane',
                classroomLink: params.classroomLink || 'https://zoom.us/j/stemulus-class'
            };
            db.students = db.students || [];
            db.students.push(newStudent);

            // Auto-create initial schedule slot 3 days from now at 16:30
            var schedDate = new Date();
            schedDate.setDate(schedDate.getDate() + 3);
            db.schedules = db.schedules || [];
            db.schedules.push({
                id: 'sch-' + Date.now(),
                studentId: newStudent.id,
                studentName: fName + ' ' + lName,
                course: newStudent.program,
                date: schedDate.toISOString().split('T')[0],
                time: '16:30',
                duration: '60',
                mentor: newStudent.tutorName,
                link: newStudent.classroomLink,
                attendanceStatus: 'pending'
            });

            // Set onboarding wizard for parent
            db.onboarding = db.onboarding || {};
            db.onboarding[parentEmail] = {
                completed: false,
                currentStep: 1,
                steps: [
                    { id: 'profile', label: 'Verify Contact Information', done: true },
                    { id: 'alerts', label: 'Configure Birthday & Class Alerts', done: false },
                    { id: 'schedule', label: 'Accept Tutorial Schedule', done: false }
                ]
            };

            // Queue welcome notification & email
            db.notifications = db.notifications || [];
            db.notifications.push({
                id: 'not-' + Date.now(),
                title: 'Student Onboarded Successfully!',
                message: fName + ' ' + lName + ' has been registered in ' + newStudent.program + '. Portal login credentials generated.',
                timestamp: new Date().toISOString(),
                read: false,
                userEmail: parentEmail
            });

            db.emailQueue = db.emailQueue || [];
            db.emailQueue.push({
                id: 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                type: 'welcome',
                status: 'draft',
                to: parentEmail,
                recipientName: params.name || 'Parent',
                subject: 'Welcome to STEMulus — ' + fName + '\'s coding journey starts!',
                htmlPreview: 'Welcome ' + (params.name || 'Parent') + '! Portal credentials: Email: ' + parentEmail + ' | Temp Password: ' + tempPwd,
                data: {
                    parentEmail: parentEmail,
                    parentName: params.name || 'Parent',
                    studentName: fName + ' ' + lName,
                    courseName: newStudent.program,
                    tempPassword: tempPwd,
                    classroomLink: newStudent.classroomLink
                },
                triggeredBy: 'quick_onboard_student',
                createdAt: new Date().toISOString(),
                sentAt: null,
                editedSubject: null,
                editedBody: null
            });

            saveDB(db);
            dispatchEvent(new CustomEvent('stemulusDbUpdated'));
            return {
                success: true,
                type: 'student_parent',
                parentEmail: parentEmail,
                parentName: params.name || 'Parent',
                childName: fName + ' ' + lName,
                program: newStudent.program,
                tutorName: newStudent.tutorName,
                tempPassword: tempPwd,
                classroomLink: newStudent.classroomLink
            };
        }
    }

    // --- Email Queue Controller ---
    function addToEmailQueue(item) {
        // item: { type, to, recipientName, subject, htmlPreview, data, triggeredBy }
        var db = getDB();
        if (!db.emailQueue) db.emailQueue = [];
        var entry = Object.assign({
            id: 'eq-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            status: 'draft',
            createdAt: new Date().toISOString(),
            sentAt: null,
            editedSubject: null,
            editedBody: null
        }, item);
        db.emailQueue.push(entry);
        saveDB(db);
        dispatchEvent(new CustomEvent('stemulusDbUpdated'));
        return entry.id;
    }

    function getEmailQueue() {
        var db = getDB();
        return (db.emailQueue || []).filter(function(e){ return e.status === 'draft'; });
    }

    function getEmailHistory() {
        var db = getDB();
        return (db.emailQueue || []).filter(function(e){ return e.status !== 'draft'; });
    }

    function updateQueuedEmail(id, fields) {
        // fields: { editedSubject, editedBody }
        var db = getDB();
        var entry = (db.emailQueue || []).find(function(e){ return e.id === id; });
        if (!entry) return false;
        Object.assign(entry, fields);
        saveDB(db);
        return true;
    }

    function cancelQueuedEmail(id) {
        var db = getDB();
        var entry = (db.emailQueue || []).find(function(e){ return e.id === id; });
        if (!entry) return false;
        entry.status = 'cancelled';
        saveDB(db);
        return true;
    }

    // --- Password Reset Requests Controller ---
    function addPasswordResetRequest(email) {
        var db = getDB();
        if (!db.passwordResetRequests) db.passwordResetRequests = [];
        var existing = db.passwordResetRequests.find(function(r){ return r.email===email && r.status==='pending'; });
        if (existing) { existing.updatedAt = new Date().toISOString(); saveDB(db); return existing.id; }
        var req = { id: 'pwr-'+Date.now(), email: email.toLowerCase().trim(), status: 'pending', requestedAt: new Date().toISOString() };
        db.passwordResetRequests.push(req);
        saveDB(db);
        dispatchEvent(new CustomEvent('stemulusDbUpdated'));
        return req.id;
    }

    function getPendingPasswordResets() {
        var db = getDB();
        return (db.passwordResetRequests || []).filter(function(r){ return r.status==='pending'; });
    }

    function resolvePasswordReset(reqId, newPassword) {
        var db = getDB();
        var req = (db.passwordResetRequests || []).find(function(r){ return r.id===reqId; });
        if (!req) return false;
        req.status = 'resolved';
        req.resolvedAt = new Date().toISOString();
        // Also update the user password
        if (db.users && db.users[req.email]) {
            // Will be hashed on next login via auto-upgrade logic
            db.users[req.email].password = newPassword;
            db.users[req.email].mustChangePassword = true;
        }
        saveDB(db);
        return true;
    }

    function resetUserPassword(email, newPassword) {
        var db = getDB();
        var key = (email||'').toLowerCase().trim();
        if (!db.users || !db.users[key]) return { success:false, message:'User not found' };
        db.users[key].password = newPassword; // stored plain, auto-upgraded on next login
        db.users[key].mustChangePassword = true;
        saveDB(db);
        return { success:true };
    }

    // --- Milestones Controller ---
    function getMilestones() {
        const db = getDB();
        return db.milestones || [];
    }

    function addMilestone(m) {
        const db = getDB();
        if (!db.milestones) db.milestones = [];
        m.id = "mil-" + Date.now();
        db.milestones.push(m);
        saveDB(db);
        return m;
    }

    function updateMilestone(id, updatedFields) {
        const db = getDB();
        if (!db.milestones) db.milestones = [];
        const idx = db.milestones.findIndex(m => m.id === id);
        if (idx !== -1) {
            db.milestones[idx] = { ...db.milestones[idx], ...updatedFields };
            saveDB(db);
            return db.milestones[idx];
        }
        return null;
    }

    function deleteMilestone(id) {
        const db = getDB();
        if (!db.milestones) db.milestones = [];
        const idx = db.milestones.findIndex(m => m.id === id);
        if (idx !== -1) {
            db.milestones.splice(idx, 1);
            saveDB(db);
            return true;
        }
        return false;
    }

    // --- Weekly Report Generator ---
    function generateWeeklyReport(studentId) {
        var db = getDB();
        var student = (db.students||[]).find(function(s){ return s.id===studentId; });
        if (!student) return null;

        var now = new Date();
        var weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0,0,0,0);
        var weekEnd = new Date(now); weekEnd.setHours(23,59,59,999);

        var records = (db.schedules||[]).filter(function(s){
            if (!s.date) return false;
            var d = new Date(s.date);
            var matches = (s.studentId===studentId || s.studentName===(student.firstName+' '+student.lastName)) && d>=weekStart && d<=weekEnd;
            return matches;
        });

        if (!records.length) return null;

        var sessionSummaries = records.map(function(r){ return {
            date: r.date, topic: r.topic||r.module||'', whatBuilt: r.whatBuilt||'',
            attendanceStatus: r.attendanceStatus||'', punctuality: r.punctuality||'',
            conceptGrasp: r.conceptGrasp||0, tutorComment: r.tutorComment||'',
            homeworkAssigned: r.homeworkAssigned||'', assignmentStatus: r.assignmentStatus||''
        }; });

        var avgGrasp = 0;
        var graspCount = sessionSummaries.filter(function(s){ return s.conceptGrasp>0; }).length;
        if (graspCount>0) avgGrasp = Math.round(sessionSummaries.reduce(function(sum,s){ return sum+(s.conceptGrasp||0); },0)/graspCount*10)/10;

        var report = {
            id: 'wr-'+Date.now(),
            studentId: studentId,
            studentName: student.firstName+' '+student.lastName,
            tutorName: student.tutorName||'',
            parentEmail: student.parentEmail||'',
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            sessionsTotal: records.length,
            sessionsAttended: records.filter(function(r){ return r.attendanceStatus==='present'; }).length,
            averageConceptGrasp: avgGrasp,
            sessions: sessionSummaries,
            generatedAt: new Date().toISOString(),
            status: 'draft'
        };

        return report;
    }

    function generateAllWeeklyReports() {
        var db = getDB();
        var students = db.students||[];
        var reports = [];
        students.filter(function(s){ return s.status!=='inactive'&&s.status!=='withdrawn'; }).forEach(function(student){
            var report = generateWeeklyReport(student.id);
            if (report) reports.push(report);
        });
        return reports;
    }

    // Ensures default admin/tutor/parent accounts exist with valid credentials
    async function initDefaultAccounts() {
        var db = getDB();
        if (!db.users) db.users = {};
        var adminKey = 'admin@stemuluskidstech.com';
        var changed = false;

        // Ensure admin account exists and has role 'admin'
        if (!db.users[adminKey] || db.users[adminKey].role !== 'admin') {
            var adminHash = await hashPassword('Admin2026!');
            db.users[adminKey] = {
                email: adminKey,
                name: 'STEMulus Admin',
                role: 'admin',
                password: adminHash,
                createdAt: new Date().toISOString()
            };
            changed = true;
        }

        if (!db.users['tutor@stemuluskidstech.com']) {
            var tutorHash = await hashPassword('Tutor2026!');
            db.users['tutor@stemuluskidstech.com'] = {
                email: 'tutor@stemuluskidstech.com',
                name: 'Demo Tutor',
                role: 'tutor',
                password: tutorHash,
                createdAt: new Date().toISOString()
            };
            changed = true;
        }

        if (!db.users['parent@stemuluskidstech.com']) {
            var parentHash = await hashPassword('Parent2026!');
            db.users['parent@stemuluskidstech.com'] = {
                email: 'parent@stemuluskidstech.com',
                name: 'Demo Parent',
                role: 'parent',
                password: parentHash,
                createdAt: new Date().toISOString()
            };
            changed = true;
        }

        if (changed) {
            saveDB(db);
            console.log('[STEMulus] Default accounts verified and initialized.');
            return true;
        }
        return false;
    }

    // Initialize DB on script load
    getDB();

    // Firebase Cloud Sync real-time snapshot subscription
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
            firebase.firestore().collection('state').doc('current').onSnapshot(doc => {
                if (isSyncing) return; // skip snapshot while a local save is in-flight
                if (doc.exists()) {
                    const cloudData = doc.data();
                    
                    // Proactively ensure STEM-2026-QWHF is in the certificates list
                    if (!cloudData.certificates) cloudData.certificates = [];
                    if (cloudData.certificates && !cloudData.certificates.some(c => c.credential_id === "STEM-2026-QWHF")) {
                        cloudData.certificates.push({
                            id: "cert-6002",
                            credential_id: "STEM-2026-QWHF",
                            student_name: "Modesire Abdusalam Shittu",
                            program_name: "Python Data App Academy: Building Web Apps with Streamlit",
                            grade_level: "Distinction",
                            issue_date: "2026-05-31"
                        });
                    }
                    
                    localStorage.setItem("stemulus_db", JSON.stringify(cloudData));
                    window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
                    console.log('[STEMulus Cloud] [Synced] Local state synchronized with Firestore cloud');
                } else {
                    console.log('[STEMulus Cloud] Seeding initial state to Firestore...');
                    firebase.firestore().collection('state').doc('current').set(getDB());
                }
            }, err => {
                console.warn('[STEMulus Cloud] Snapshot listener subscription failed:', err);
            });
        } catch (e) {
            console.error('[STEMulus Cloud] Snapshot listener error:', e);
        }
    }

    return {
        login,
        logout,
        getSession,
        getStudents,
        getParents,
        addStudent,
        updateStudent,
        deleteStudent,
        getTutors,
        getSchedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getRescheduleRequests,
        submitReschedule,
        approveReschedule,
        declineReschedule,
        getOnboarding,
        completeOnboardingStep,
        getCertificates,
        addCertificate,
        deleteCertificate,
        getReports,
        addReport,
        getEnrollments,
        addEnrollment,
        approveEnrollment,
        triggerBirthdayNtfy,
        getNotifications,
        addNotification,
        markNotificationsRead,
        getMilestones,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        getAttendanceRecords,
        addAttendanceRecord,
        updateAttendanceStatus,
        checkDuplicateAttendance,
        getStudentsByTutor,
        getTutorStudents,
        getCurrentScheduledStudent,
        updateCertificate,
        getDB,
        saveDB,
        getMonthlyReports,
        addMonthlyReport,
        updateMonthlyReport,
        rejectMonthlyReport,
        approveAndSendMonthlyReport,
        quickOnboardUser,
        addToEmailQueue,
        getEmailQueue,
        getEmailHistory,
        updateQueuedEmail,
        cancelQueuedEmail,
        addPasswordResetRequest,
        getPendingPasswordResets,
        resolvePasswordReset,
        resetUserPassword,
        setRemindersPaused,
        updateStudentStatus,
        updateTutorStatus,
        generateWeeklyReport,
        generateAllWeeklyReports,
        getNtfyTopic: () => getDB().ntfyTopic,
        addUser: async function(userData) {
            const db = getDB();
            const key = userData.email.toLowerCase().trim();
            if (db.users[key]) return { success: false, message: 'A user with this email already exists.' };
            if (!userData.password) { throw new Error('Password is required for addUser()'); }
            const plain = userData.password;
            db.users[key] = {
                email: userData.email.toLowerCase().trim(),
                password: await hashPassword(plain),
                role: userData.role || 'parent',
                name: userData.name
            };
            saveDB(db);
            return { success: true };
        },
        updateUserPassword: async function(email, newPassword) {
            const db = getDB();
            const key = email.toLowerCase().trim();
            if (!db.users[key]) return false;
            db.users[key].password = await hashPassword(newPassword);
            saveDB(db);
            return true;
        },
        checkAuth: function(requiredRole) {
            var session = this.getSession ? this.getSession() : JSON.parse(sessionStorage.getItem('stemulus_session') || 'null');
            if (!session || !session.role) { window.location.href = 'parent-login.html'; return null; }
            if (requiredRole && session.role !== requiredRole) { window.location.href = 'parent-login.html?role=' + requiredRole; return null; }
            return session;
        },
        initDefaultAccounts
    };
})();

// Auto-initialize default seed accounts on first load
DashboardEngine.initDefaultAccounts();
