/**
 * STEMulus Dashboard State Engine
 * A centralized localStorage-backed state manager that coordinates the
 * parent portal, tutor portal, and admin dashboard with shared data.
 */

const DashboardEngine = (function() {
    // Default seed data for the STEMulus system
    const DEFAULT_DATA = {
        users: {
            "parent@stemulus.com": { email: "parent@stemulus.com", password: "parent123", role: "parent", name: "John Doe" },
            "tutor@stemulus.com": { email: "tutor@stemulus.com", password: "tutor123", role: "tutor", name: "Sarah Jane" },
            "admin@stemulus.com": { email: "admin@stemulus.com", password: "admin123", role: "admin", name: "Headmaster Admin" }
        },
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
                parentEmail: "parent@stemulus.com",
                parentName: "John Doe",
                parentPhone: "+2347052466716",
                birthday: "2015-06-01",
                progress: 65, // percent
                avatarColor: "bg-blue-500",
                tutorName: "Sarah Jane",
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
                parentEmail: "parent@stemulus.com",
                parentName: "John Doe",
                parentPhone: "+2347052466716",
                birthday: "2018-05-31", // Today!
                progress: 40,
                avatarColor: "bg-orange-500",
                tutorName: "Sarah Jane",
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
                parentEmail: "parent@stemulus.com"
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
            "parent@stemulus.com": {
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
                userEmail: "parent@stemulus.com"
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
        ntfyTopic: "stemulus-birthday-alerts-2026"
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
        localStorage.setItem("stemulus_db", JSON.stringify(db));
        window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));

        // ☁️ Broadcast updates to Firebase Firestore for cloud persistence
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            try {
                firebase.firestore().collection('state').doc('current').set(db)
                    .then(() => console.log('[STEMulus Cloud] ✅ Database state synced to Firestore'))
                    .catch(err => console.warn('[STEMulus Cloud] Firestore sync failed:', err));
            } catch (e) {
                console.error('[STEMulus Cloud] Firestore sync error:', e);
            }
        }
    }

    // Get currently logged-in user from session
    function getSession() {
        const sessionStr = sessionStorage.getItem("stemulus_session");
        if (!sessionStr) return null;
        try {
            return JSON.parse(sessionStr);
        } catch (e) {
            return null;
        }
    }

    function login(email, password) {
        const db = getDB();
        const user = db.users[email.toLowerCase().trim()];
        if (user && user.password === password) {
            sessionStorage.setItem("stemulus_session", JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: "Invalid email or password." };
    }

    function logout() {
        sessionStorage.removeItem("stemulus_session");
    }

    // --- Students Controller ---
    function getStudents(parentEmail = null) {
        const db = getDB();
        if (parentEmail) {
            return db.students.filter(s => s.parentEmail === parentEmail);
        }
        return db.students;
    }

    function addStudent(student) {
        const db = getDB();
        student.id = "std-" + Date.now();
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
                tutorMap[name] = { name, email: matchedUser ? matchedUser.email : (name.toLowerCase().replace(/\s+/g,'') + '@stemulus.com') };
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
            userEmail: "admin@stemulus.com"
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
        saveDB(db);

        // ☁️ Dual-write to Firebase Firestore for cross-device verification
        try {
            if (typeof firebase !== 'undefined' && firebase.apps.length) {
                const firestoreDb = firebase.firestore();
                firestoreDb.collection('certificates').doc(cert.credential_id).set({
                    credential_id: cert.credential_id,
                    student_name: cert.student_name,
                    program_name: cert.program_name,
                    grade_level: cert.grade_level,
                    issue_date: cert.issue_date,
                    issued_at: new Date().toISOString()
                }).then(() => {
                    console.log('[STEMulus] ✅ Certificate synced to Firebase cloud:', cert.credential_id);
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

        // ☁️ Also delete from Firebase Firestore
        if (cert) {
            try {
                if (typeof firebase !== 'undefined' && firebase.apps.length) {
                    const firestoreDb = firebase.firestore();
                    firestoreDb.collection('certificates').doc(cert.credential_id).delete().then(() => {
                        console.log('[STEMulus] ✅ Certificate revoked from Firebase cloud:', cert.credential_id);
                    }).catch(err => {
                        console.warn('[STEMulus] Firebase delete failed:', err);
                    });
                }
            } catch(e) {
                console.warn('[STEMulus] Firebase not available for cert deletion:', e);
            }
        }
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

    function approveEnrollment(id) {
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
                parentPhone: enr.phone,
                birthday: new Date(Date.now() - 365*24*3600*1000 * parseInt(enr.studentAge)).toISOString().split('T')[0], // approx birthday
                progress: 0,
                avatarColor: "bg-purple-500",
                tutorName: "Sarah Jane"
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
                db.users[enr.email.toLowerCase()] = {
                    email: enr.email,
                    password: "parent123", // default
                    role: "parent",
                    name: enr.parentName
                };
                
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
            return true;
        }
        return false;
    }

    // --- Birthday Notification / NTFY Alert ---
    async function triggerBirthdayNtfy(student) {
        const db = getDB();
        const topic = db.ntfyTopic || "stemulus-birthday-alerts-2026";
        const title = `🎂 STEMulus Birthday Alert: ${student.firstName} ${student.lastName}!`;
        const message = `Our student ${student.firstName} ${student.lastName} (Age ${student.age}) is celebrating their birthday today!\nLet's send them a special coding challenge or discount! 🎉\nParent: ${student.parentName} (${student.parentPhone})`;

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
                userEmail: "admin@stemulus.com"
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
        return db.notifications.filter(n => n.userEmail === email).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function addNotification(notif) {
        const db = getDB();
        notif.id = "not-" + Date.now();
        notif.timestamp = notif.timestamp || new Date().toISOString();
        notif.read = false;
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

    // Initialize DB on script load
    getDB();

    // ☁️ Firebase Cloud Sync real-time snapshot subscription
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
            firebase.firestore().collection('state').doc('current').onSnapshot(doc => {
                if (doc.exists()) {
                    const cloudData = doc.data();
                    
                    // Proactively ensure STEM-2026-QWHF is in the certificates list
                    if (cloudData.certificates && !cloudData.certificates.some(c => c.credential_id === "STEM-2026-QWHF")) {
                        if (!cloudData.certificates) cloudData.certificates = [];
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
                    console.log('[STEMulus Cloud] 🔄 Local state synchronized with Firestore cloud');
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
        getNtfyTopic: () => getDB().ntfyTopic
    };
})();
