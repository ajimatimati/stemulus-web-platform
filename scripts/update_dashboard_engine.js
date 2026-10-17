const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// 1. Prepare 7 verified tutors block
const tutorsJSON = `        tutors: [
            {
                id: "tut-101",
                name: "Sarah Jane",
                email: "tutor@stemuluskidstech.com",
                phone: "+2348011223344",
                subjects: ["Python Programming", "Scratch Creators"],
                location: "Lagos, Nigeria",
                assignmentType: "Online Remote Senior Instructor",
                status: "active"
            },
            {
                id: "tut-102",
                name: "David Okon",
                email: "david.okon@stemuluskidstech.com",
                phone: "+2348022334455",
                subjects: ["Web Development", "Robotics"],
                location: "Abuja, Nigeria",
                assignmentType: "Online Remote Lead Mentor",
                status: "active"
            },
            {
                id: "tut-103",
                name: "Olalekan Israel Ajimati",
                email: "olalekan@stemuluskidstech.com",
                altEmail: "ajimatimati@gmail.com",
                phone: "+2347052466716",
                subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"],
                location: "Lagos, Nigeria",
                assignmentType: "Online & Lead Full-Stack Specialist",
                bankName: "GTBank",
                accountHolderName: "Olalekan Israel Ajimati",
                accountNumber: "0123456789",
                workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)",
                weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)",
                operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
                digitalSignature: "Olalekan Israel Ajimati",
                status: "active"
            },
            {
                id: "tut-104-moses",
                name: "Moses Oluwafemi Adebayo",
                email: "adefemiadebayo20@gmail.com",
                phone: "07063346551",
                subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"],
                location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan",
                assignmentType: "Online Only: Currently restricted to remote online sessions only.",
                bankName: "Opay",
                accountHolderName: "Moses Oluwafemi Adebayo",
                accountNumber: "7063346551",
                nextOfKinName: "Mr Adebayo Michael (Sibling)",
                nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja",
                workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
                weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)",
                operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
                digitalSignature: "Moses Oluwafemi Adebayo",
                onboardedAt: "2026-10-01T18:59:30.000Z",
                status: "active"
            },
            {
                id: "tut-105-kafa",
                name: "Kafayat Abdulwahab",
                email: "kafayatabdulwahab.et@gmail.com",
                phone: "08065220517",
                subjects: ["Scratch Creators", "Web Development", "Python Programming"],
                location: "Tanke, Ilorin Kwara state.",
                assignmentType: "Online Only: Currently restricted to remote online sessions only.",
                bankName: "GTBank",
                accountHolderName: "Kafayat Abdulwahab",
                accountNumber: "0141342433",
                nextOfKinName: "Kudirat Mojisola / Sister",
                nextOfKinContact: "08036580498 / Ilorin, Kwara state",
                workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
                weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)",
                operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
                digitalSignature: "Kafayat Abdulwahab",
                onboardedAt: "2026-10-02T09:25:11.000Z",
                status: "active"
            },
            {
                id: "tut-106-tola",
                name: "Tola Tosin Ayanleke",
                email: "tonetbod@gmail.com",
                phone: "0912 313 1969",
                subjects: ["Python Programming", "Scratch Creators"],
                location: "Ajia, Ibadan.",
                assignmentType: "Online Only: Currently restricted to remote online sessions only.",
                bankName: "UBA",
                accountHolderName: "TOLA TOSIN AYANLEKE",
                accountNumber: "2054121458",
                nextOfKinName: "Lawal Jumoke (Sister)",
                nextOfKinContact: "0816 070 2956 - Ilorin",
                workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
                weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)",
                operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant",
                digitalSignature: "TOLA TOSIN AYANLEKE",
                onboardedAt: "2026-10-17T14:04:53.000Z",
                status: "active"
            },
            {
                id: "tut-107-emmanuel",
                name: "Emmanuel O.",
                email: "emmanuel@stemuluskidstech.com",
                phone: "+2348030000000",
                subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"],
                location: "Ibadan Hub, Nigeria",
                assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)",
                bankName: "Access Bank",
                accountHolderName: "Emmanuel O.",
                accountNumber: "0987654321",
                workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits",
                weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)",
                operatingStandard: "STEMulus Physical Hub Standard Compliant",
                digitalSignature: "Emmanuel O.",
                status: "active"
            }
        ],`;

// Replace tutors in DEFAULT_DATA
const oldDefaultTutorsRegex = /tutors:\s*\[[\s\S]*?id:\s*"tut-101"[\s\S]*?id:\s*"tut-103"[\s\S]*?\]\s*,/;
if (oldDefaultTutorsRegex.test(code)) {
    code = code.replace(oldDefaultTutorsRegex, tutorsJSON.trim());
    console.log('Replaced DEFAULT_DATA.tutors successfully.');
} else {
    console.warn('Could not match old DEFAULT_DATA.tutors regex');
}

// 2. Replace coreVerifiedTutors inside getDB()
const newCoreVerifiedTutors = `const coreVerifiedTutors = [
                { id: "tut-101", name: "Sarah Jane", email: "tutor@stemuluskidstech.com", phone: "+2348011223344", subjects: ["Python Programming", "Scratch Creators"], location: "Lagos, Nigeria", assignmentType: "Online Remote Senior Instructor", status: "active" },
                { id: "tut-102", name: "David Okon", email: "david.okon@stemuluskidstech.com", phone: "+2348022334455", subjects: ["Web Development", "Robotics"], location: "Abuja, Nigeria", assignmentType: "Online Remote Lead Mentor", status: "active" },
                { id: "tut-103", name: "Olalekan Israel Ajimati", email: "olalekan@stemuluskidstech.com", altEmail: "ajimatimati@gmail.com", phone: "+2347052466716", subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"], location: "Lagos, Nigeria", assignmentType: "Online & Lead Full-Stack Specialist", bankName: "GTBank", accountHolderName: "Olalekan Israel Ajimati", accountNumber: "0123456789", workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)", weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Olalekan Israel Ajimati", status: "active" },
                { id: "tut-104-moses", name: "Moses Oluwafemi Adebayo", email: "adefemiadebayo20@gmail.com", phone: "07063346551", subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"], location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "Opay", accountHolderName: "Moses Oluwafemi Adebayo", accountNumber: "7063346551", nextOfKinName: "Mr Adebayo Michael (Sibling)", nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Moses Oluwafemi Adebayo", onboardedAt: "2026-10-01T18:59:30.000Z", status: "active" },
                { id: "tut-105-kafa", name: "Kafayat Abdulwahab", email: "kafayatabdulwahab.et@gmail.com", phone: "08065220517", subjects: ["Scratch Creators", "Web Development", "Python Programming"], location: "Tanke, Ilorin Kwara state.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "GTBank", accountHolderName: "Kafayat Abdulwahab", accountNumber: "0141342433", nextOfKinName: "Kudirat Mojisola / Sister", nextOfKinContact: "08036580498 / Ilorin, Kwara state", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Kafayat Abdulwahab", onboardedAt: "2026-10-02T09:25:11.000Z", status: "active" },
                { id: "tut-106-tola", name: "Tola Tosin Ayanleke", email: "tonetbod@gmail.com", phone: "0912 313 1969", subjects: ["Python Programming", "Scratch Creators"], location: "Ajia, Ibadan.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "UBA", accountHolderName: "TOLA TOSIN AYANLEKE", accountNumber: "2054121458", nextOfKinName: "Lawal Jumoke (Sister)", nextOfKinContact: "0816 070 2956 - Ilorin", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "TOLA TOSIN AYANLEKE", onboardedAt: "2026-10-17T14:04:53.000Z", status: "active" },
                { id: "tut-107-emmanuel", name: "Emmanuel O.", email: "emmanuel@stemuluskidstech.com", phone: "+2348030000000", subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"], location: "Ibadan Hub, Nigeria", assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)", bankName: "Access Bank", accountHolderName: "Emmanuel O.", accountNumber: "0987654321", workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits", weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)", operatingStandard: "STEMulus Physical Hub Standard Compliant", digitalSignature: "Emmanuel O.", status: "active" }
            ];`;

const oldCoreVerifiedRegex = /const coreVerifiedTutors = \[[\s\S]*?id:\s*"tut-101"[\s\S]*?id:\s*"tut-103"[\s\S]*?\];/;
if (oldCoreVerifiedRegex.test(code)) {
    code = code.replace(oldCoreVerifiedRegex, newCoreVerifiedTutors);
    console.log('Replaced coreVerifiedTutors in getDB() successfully.');
} else {
    console.warn('Could not match old coreVerifiedTutors regex');
}

// 3. Update the coreVerifiedTutors merge loop to enrich existing records
const oldMergeLoop = `                coreVerifiedTutors.forEach(ct => {
                    const ctKey = ct.email.toLowerCase().trim();
                    const exists = parsed.tutors.some(t => (t.email && t.email.toLowerCase().trim() === ctKey) || (t.id && t.id === ct.id));
                    if (!exists) {
                        parsed.tutors.push(ct);
                        tutorsAppended = true;
                    }
                });`;

const newMergeLoop = `                coreVerifiedTutors.forEach(ct => {
                    const ctKey = ct.email.toLowerCase().trim();
                    const existing = parsed.tutors.find(t => (t.email && t.email.toLowerCase().trim() === ctKey) || (t.id && t.id === ct.id));
                    if (!existing) {
                        parsed.tutors.push(ct);
                        tutorsAppended = true;
                    } else {
                        // Enrich existing record with verified onboarding & banking details if missing
                        const fieldsToSync = ['bankName', 'accountHolderName', 'accountNumber', 'location', 'assignmentType', 'nextOfKinName', 'nextOfKinContact', 'workstationAudit', 'weeklyAvailableSlots', 'operatingStandard', 'digitalSignature', 'onboardedAt'];
                        fieldsToSync.forEach(f => {
                            if (ct[f] && (!existing[f] || existing[f] !== ct[f])) {
                                existing[f] = ct[f];
                                tutorsAppended = true;
                            }
                        });
                    }
                });`;

if (code.includes(oldMergeLoop.trim())) {
    code = code.replace(oldMergeLoop.trim(), newMergeLoop.trim());
    console.log('Replaced tutor merge loop in getDB() successfully.');
} else {
    console.warn('Could not match old tutor merge loop in getDB()');
}

// 4. Update coreEnrolledStudents to include Joshua Ogba and updated tutor assignments
const oldStudentMeetMap = `"std-1012-wq6b": "https://meet.google.com/ocz-qcjr-cqb"`;
const newStudentMeetMap = `"std-1012-wq6b": "https://meet.google.com/ocz-qcjr-cqb",\n                "std-1013-jogb": "https://meet.google.com/swf-vyjv-adm"`;

if (code.includes(oldStudentMeetMap)) {
    code = code.replace(oldStudentMeetMap, newStudentMeetMap);
    console.log('Updated studentMeetMap with Joshua Ogba.');
}

// Check and append Joshua Ogba to coreEnrolledStudents if not present
if (!code.includes('std-1013-jogb')) {
    const joshuaStudentJSON = `,\n          {
                    "id": "std-1013-jogb",
                    "firstName": "Joshua",
                    "lastName": "Ogba",
                    "age": 10,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Mrs. Ogba",
                    "parentEmail": "joshuaogba.parent@gmail.com",
                    "parentPhone": "+2348060000000",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Kafayat Abdulwahab",
                    "tutorEmail": "kafayatabdulwahab.et@gmail.com",
                    "tutorId": "tut-105-kafa",
                    "notes": "Assigned to Kafayat Abdulwahab. 4 weekly sessions: Tue 3pm, Wed 3pm, Sat 12pm, Sun 7pm WAT.",
                    "classroomLink": "https://meet.google.com/swf-vyjv-adm",
                    "meetLink": "https://meet.google.com/swf-vyjv-adm",
                    "skills": { "logic": 50, "loops": 50, "variables": 50, "syntax": 50, "projects": 50 },
                    "metrics": { "attended": 0, "total": 16, "projects": 0, "lines": 0 }
          }`;
    // Insert before closing bracket of coreEnrolledStudents
    const cesEndPattern = /("id":\s*"std-1012-wq6b"[\s\S]*?lines":\s*0\s*}\s*)\n\s*\];/;
    if (cesEndPattern.test(code)) {
        code = code.replace(cesEndPattern, `$1${joshuaStudentJSON}\n];`);
        console.log('Appended Joshua Ogba to coreEnrolledStudents.');
    }
}

// 5. Add official tutor reassignments sync and weekly schedules sync in getDB()
const scheduleCascadeAnchor = `// 3. Cascade Google Meet links to any schedules that lack a link or have obsolete zoom links`;
const newSyncBlock = `// 2b. Sync official tutor reassignments as dispatched
            const officialTutorAssignments = {
                "std-1007-r4cv": { tutorName: "Tola Tosin Ayanleke", tutorEmail: "tonetbod@gmail.com", tutorId: "tut-106-tola" },
                "std-1008-a0lp": { tutorName: "Emmanuel O.", tutorEmail: "emmanuel@stemuluskidstech.com", tutorId: "tut-107-emmanuel" },
                "std-1009-tbod": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" },
                "std-1010-ilb5": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" },
                "std-1011-tq1u": { tutorName: "Moses Oluwafemi Adebayo", tutorEmail: "adefemiadebayo20@gmail.com", tutorId: "tut-104-moses" },
                "std-1012-wq6b": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" },
                "std-1013-jogb": { tutorName: "Kafayat Abdulwahab", tutorEmail: "kafayatabdulwahab.et@gmail.com", tutorId: "tut-105-kafa" }
            };
            parsed.students.forEach(s => {
                if (officialTutorAssignments[s.id]) {
                    const ota = officialTutorAssignments[s.id];
                    if (s.tutorEmail !== ota.tutorEmail || s.tutorName !== ota.tutorName || s.tutorId !== ota.tutorId) {
                        s.tutorName = ota.tutorName;
                        s.tutorEmail = ota.tutorEmail;
                        s.tutorId = ota.tutorId;
                        studentsAppended = true;
                    }
                }
            });

            // 2c. Populate core weekly schedules for all assigned students
            const coreWeeklySchedules = [
                { id: "sch-101-mon-momo", studentId: "std-1011-tq1u", studentName: "Momooreoluwa Sonaike", course: "Scratch Creators", dayOfWeek: "Monday", date: "2026-10-19", time: "19:00", duration: "60", mentor: "Moses Oluwafemi Adebayo", tutorName: "Moses Oluwafemi Adebayo", tutorEmail: "adefemiadebayo20@gmail.com", tutorId: "tut-104-moses", link: "https://meet.google.com/vdp-nmbh-sjj", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-102-tue-josh", studentId: "std-1013-jogb", studentName: "Joshua Ogba", course: "Scratch Creators", dayOfWeek: "Tuesday", date: "2026-10-20", time: "15:00", duration: "60", mentor: "Kafayat Abdulwahab", tutorName: "Kafayat Abdulwahab", tutorEmail: "kafayatabdulwahab.et@gmail.com", tutorId: "tut-105-kafa", link: "https://meet.google.com/swf-vyjv-adm", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-103-tue-davi", studentId: "std-1012-wq6b", studentName: "David Gjoka", course: "Python Programming", dayOfWeek: "Tuesday", date: "2026-10-20", time: "16:00", duration: "60", mentor: "Olalekan Israel Ajimati", tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103", link: "https://meet.google.com/ocz-qcjr-cqb", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-104-tue-myle", studentId: "std-1009-tbod", studentName: "King Myles Omosuyi", course: "Scratch Creators", dayOfWeek: "Tuesday", date: "2026-10-20", time: "19:00", duration: "60", mentor: "Olalekan Israel Ajimati", tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103", link: "https://meet.google.com/cjr-phmf-ahs", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-105-wed-josh", studentId: "std-1013-jogb", studentName: "Joshua Ogba", course: "Scratch Creators", dayOfWeek: "Wednesday", date: "2026-10-21", time: "15:00", duration: "60", mentor: "Kafayat Abdulwahab", tutorName: "Kafayat Abdulwahab", tutorEmail: "kafayatabdulwahab.et@gmail.com", tutorId: "tut-105-kafa", link: "https://meet.google.com/swf-vyjv-adm", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-106-wed-juna", studentId: "std-1010-ilb5", studentName: "JUNAYD KARI", course: "Scratch Creators", dayOfWeek: "Wednesday", date: "2026-10-21", time: "16:00", duration: "60", mentor: "Olalekan Israel Ajimati", tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103", link: "https://meet.google.com/gyd-fewb-cdh", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-107-fri-pear", studentId: "std-1007-r4cv", studentName: "Babalola Oluwadunmininu Pearl", course: "Python Programming", dayOfWeek: "Friday", date: "2026-10-23", time: "16:00", duration: "60", mentor: "Tola Tosin Ayanleke", tutorName: "Tola Tosin Ayanleke", tutorEmail: "tonetbod@gmail.com", tutorId: "tut-106-tola", link: "https://meet.google.com/mim-qifa-avc", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-108-fri-juna", studentId: "std-1010-ilb5", studentName: "JUNAYD KARI", course: "Scratch Creators", dayOfWeek: "Friday", date: "2026-10-23", time: "16:00", duration: "60", mentor: "Olalekan Israel Ajimati", tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103", link: "https://meet.google.com/gyd-fewb-cdh", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-109-fri-myle", studentId: "std-1009-tbod", studentName: "King Myles Omosuyi", course: "Scratch Creators", dayOfWeek: "Friday", date: "2026-10-23", time: "17:00", duration: "60", mentor: "Olalekan Israel Ajimati", tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103", link: "https://meet.google.com/cjr-phmf-ahs", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-110-sat-pear", studentId: "std-1007-r4cv", studentName: "Babalola Oluwadunmininu Pearl", course: "Python Programming", dayOfWeek: "Saturday", date: "2026-10-24", time: "10:00", duration: "60", mentor: "Tola Tosin Ayanleke", tutorName: "Tola Tosin Ayanleke", tutorEmail: "tonetbod@gmail.com", tutorId: "tut-106-tola", link: "https://meet.google.com/mim-qifa-avc", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-111-sat-momo", studentId: "std-1011-tq1u", studentName: "Momooreoluwa Sonaike", course: "Scratch Creators", dayOfWeek: "Saturday", date: "2026-10-24", time: "12:00", duration: "60", mentor: "Moses Oluwafemi Adebayo", tutorName: "Moses Oluwafemi Adebayo", tutorEmail: "adefemiadebayo20@gmail.com", tutorId: "tut-104-moses", link: "https://meet.google.com/vdp-nmbh-sjj", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-112-sat-josh", studentId: "std-1013-jogb", studentName: "Joshua Ogba", course: "Scratch Creators", dayOfWeek: "Saturday", date: "2026-10-24", time: "12:00", duration: "60", mentor: "Kafayat Abdulwahab", tutorName: "Kafayat Abdulwahab", tutorEmail: "kafayatabdulwahab.et@gmail.com", tutorId: "tut-105-kafa", link: "https://meet.google.com/swf-vyjv-adm", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-113-sat-gbol", studentId: "std-1008-a0lp", studentName: "Gbolade Okesanjo", course: "Web & App Development", dayOfWeek: "Saturday", date: "2026-10-24", time: "12:00", duration: "60", mentor: "Emmanuel O.", tutorName: "Emmanuel O.", tutorEmail: "emmanuel@stemuluskidstech.com", tutorId: "tut-107-emmanuel", link: "Physical (In-Person Hub)", meetLinkBackup: "https://meet.google.com/mxh-ndjc-gox", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-114-sun-gbol", studentId: "std-1008-a0lp", studentName: "Gbolade Okesanjo", course: "Web & App Development", dayOfWeek: "Sunday", date: "2026-10-25", time: "17:00", duration: "60", mentor: "Emmanuel O.", tutorName: "Emmanuel O.", tutorEmail: "emmanuel@stemuluskidstech.com", tutorId: "tut-107-emmanuel", link: "Physical (In-Person Hub)", meetLinkBackup: "https://meet.google.com/mxh-ndjc-gox", status: "scheduled", attendanceStatus: "scheduled" },
                { id: "sch-115-sun-josh", studentId: "std-1013-jogb", studentName: "Joshua Ogba", course: "Scratch Creators", dayOfWeek: "Sunday", date: "2026-10-25", time: "19:00", duration: "60", mentor: "Kafayat Abdulwahab", tutorName: "Kafayat Abdulwahab", tutorEmail: "kafayatabdulwahab.et@gmail.com", tutorId: "tut-105-kafa", link: "https://meet.google.com/swf-vyjv-adm", status: "scheduled", attendanceStatus: "scheduled" }
            ];
            parsed.schedules = parsed.schedules || [];
            coreWeeklySchedules.forEach(cs => {
                const sIdx = parsed.schedules.findIndex(s => s.id === cs.id);
                if (sIdx === -1) {
                    parsed.schedules.push(cs);
                    studentsAppended = true;
                } else if (!parsed.schedules[sIdx].link || parsed.schedules[sIdx].link.includes('zoom.us')) {
                    parsed.schedules[sIdx].link = cs.link;
                    studentsAppended = true;
                }
            });

            ${scheduleCascadeAnchor}`;

if (code.includes(scheduleCascadeAnchor) && !code.includes('sch-101-mon-momo')) {
    code = code.replace(scheduleCascadeAnchor, newSyncBlock);
    console.log('Added official tutor reassignments and core weekly schedules into getDB().');
}

// 6. Update getTutors() field copying and coreDefaults
const oldGetTutorsMap = `                    tutorMap[key] = {
                        id: t.id || ('tut-' + key),
                        name: t.name || 'Tutor',
                        email: t.email || '',
                        phone: t.phone || '',
                        subjects: t.subjects || ['General Coding'],
                        bio: t.bio || '',
                        availability: t.availability || {},
                        status: t.status || 'active'
                    };`;

const newGetTutorsMap = `                    tutorMap[key] = {
                        id: t.id || ('tut-' + key),
                        name: t.name || 'Tutor',
                        email: t.email || '',
                        altEmail: t.altEmail || '',
                        phone: t.phone || '',
                        subjects: t.subjects || ['General Coding'],
                        bio: t.bio || '',
                        availability: t.availability || {},
                        location: t.location || '',
                        assignmentType: t.assignmentType || '',
                        bankName: t.bankName || '',
                        accountHolderName: t.accountHolderName || '',
                        accountNumber: t.accountNumber || '',
                        nextOfKinName: t.nextOfKinName || '',
                        nextOfKinContact: t.nextOfKinContact || '',
                        workstationAudit: t.workstationAudit || '',
                        weeklyAvailableSlots: t.weeklyAvailableSlots || '',
                        operatingStandard: t.operatingStandard || '',
                        digitalSignature: t.digitalSignature || '',
                        onboardedAt: t.onboardedAt || '',
                        status: t.status || 'active'
                    };`;

if (code.includes(oldGetTutorsMap.trim())) {
    code = code.replace(oldGetTutorsMap.trim(), newGetTutorsMap.trim());
    console.log('Enhanced getTutors() field mapping.');
}

const oldCoreDefaultsRegex = /const coreDefaults = \[[\s\S]*?id:\s*"tut-101"[\s\S]*?id:\s*"tut-103"[\s\S]*?\];/;
const newCoreDefaultsBlock = `const coreDefaults = [
            { id: "tut-101", name: "Sarah Jane", email: "tutor@stemuluskidstech.com", phone: "+2348011223344", subjects: ["Python Programming", "Scratch Creators"], location: "Lagos, Nigeria", assignmentType: "Online Remote Senior Instructor", status: "active" },
            { id: "tut-102", name: "David Okon", email: "david.okon@stemuluskidstech.com", phone: "+2348022334455", subjects: ["Web Development", "Robotics"], location: "Abuja, Nigeria", assignmentType: "Online Remote Lead Mentor", status: "active" },
            { id: "tut-103", name: "Olalekan Israel Ajimati", email: "olalekan@stemuluskidstech.com", altEmail: "ajimatimati@gmail.com", phone: "+2347052466716", subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"], location: "Lagos, Nigeria", assignmentType: "Online & Lead Full-Stack Specialist", bankName: "GTBank", accountHolderName: "Olalekan Israel Ajimati", accountNumber: "0123456789", workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)", weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Olalekan Israel Ajimati", status: "active" },
            { id: "tut-104-moses", name: "Moses Oluwafemi Adebayo", email: "adefemiadebayo20@gmail.com", phone: "07063346551", subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"], location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "Opay", accountHolderName: "Moses Oluwafemi Adebayo", accountNumber: "7063346551", nextOfKinName: "Mr Adebayo Michael (Sibling)", nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Moses Oluwafemi Adebayo", onboardedAt: "2026-10-01T18:59:30.000Z", status: "active" },
            { id: "tut-105-kafa", name: "Kafayat Abdulwahab", email: "kafayatabdulwahab.et@gmail.com", phone: "08065220517", subjects: ["Scratch Creators", "Web Development", "Python Programming"], location: "Tanke, Ilorin Kwara state.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "GTBank", accountHolderName: "Kafayat Abdulwahab", accountNumber: "0141342433", nextOfKinName: "Kudirat Mojisola / Sister", nextOfKinContact: "08036580498 / Ilorin, Kwara state", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Kafayat Abdulwahab", onboardedAt: "2026-10-02T09:25:11.000Z", status: "active" },
            { id: "tut-106-tola", name: "Tola Tosin Ayanleke", email: "tonetbod@gmail.com", phone: "0912 313 1969", subjects: ["Python Programming", "Scratch Creators"], location: "Ajia, Ibadan.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "UBA", accountHolderName: "TOLA TOSIN AYANLEKE", accountNumber: "2054121458", nextOfKinName: "Lawal Jumoke (Sister)", nextOfKinContact: "0816 070 2956 - Ilorin", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "TOLA TOSIN AYANLEKE", onboardedAt: "2026-10-17T14:04:53.000Z", status: "active" },
            { id: "tut-107-emmanuel", name: "Emmanuel O.", email: "emmanuel@stemuluskidstech.com", phone: "+2348030000000", subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"], location: "Ibadan Hub, Nigeria", assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)", bankName: "Access Bank", accountHolderName: "Emmanuel O.", accountNumber: "0987654321", workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits", weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)", operatingStandard: "STEMulus Physical Hub Standard Compliant", digitalSignature: "Emmanuel O.", status: "active" }
        ];`;

if (oldCoreDefaultsRegex.test(code)) {
    code = code.replace(oldCoreDefaultsRegex, newCoreDefaultsBlock);
    console.log('Replaced coreDefaults inside getTutors() successfully.');
}

// 7. Add updateTutor(tutorIdOrEmail, updates)
if (!code.includes('function updateTutor(')) {
    const updateTutorFn = `
    function updateTutor(tutorIdOrEmail, updates) {
        const db = getDB();
        db.tutors = db.tutors || [];
        const target = (tutorIdOrEmail || '').toLowerCase().trim();
        const index = db.tutors.findIndex(t => (t.id && t.id.toLowerCase() === target) || (t.email && t.email.toLowerCase().trim() === target));
        if (index !== -1) {
            db.tutors[index] = { ...db.tutors[index], ...updates };
            // Also update db.users if name or phone changed
            if (updates.name || updates.phone) {
                const userKey = (db.tutors[index].email || '').toLowerCase().trim();
                if (db.users && db.users[userKey]) {
                    if (updates.name) db.users[userKey].name = updates.name;
                    if (updates.phone) db.users[userKey].phone = updates.phone;
                }
            }
            saveDB(db);
            return db.tutors[index];
        }
        return null;
    }
`;
    // Add right before function updateTutorStatus
    code = code.replace('function updateTutorStatus(', updateTutorFn + '\n    function updateTutorStatus(');
    console.log('Added updateTutor function.');
}

// 8. Export updateTutor in DashboardEngine
if (!code.includes('updateTutor,')) {
    code = code.replace('updateTutorStatus,', 'updateTutor,\n        updateTutorStatus,');
    console.log('Exported updateTutor in DashboardEngine.');
}

fs.writeFileSync(enginePath, code, 'utf8');
console.log('Successfully saved enhanced dashboard-engine.js!');
