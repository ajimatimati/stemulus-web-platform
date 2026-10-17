/**
 * STEMulus Dashboard State Engine
 * A centralized localStorage-backed state manager that coordinates the
 * parent portal, tutor portal, and admin dashboard with shared data.
 */

const DashboardEngine = (function() {

    // ---- Password hashing (SHA-256 via Web Crypto: no library needed) ----
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
    "users": {
        "tutor@stemuluskidstech.com": {
            "id": "usr-tut-101",
            "name": "Sarah Jane",
            "email": "tutor@stemuluskidstech.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "+2348011223344",
            "status": "active"
        },
        "david.okon@stemuluskidstech.com": {
            "id": "usr-tut-102",
            "name": "David Okon",
            "email": "david.okon@stemuluskidstech.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "+2348022334455",
            "status": "active"
        },
        "olalekan@stemuluskidstech.com": {
            "id": "usr-tut-103",
            "name": "Olalekan Israel Ajimati",
            "email": "olalekan@stemuluskidstech.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "+2347052466716",
            "status": "active"
        },
        "admin@stemuluskidstech.com": {
            "id": "usr-admin-01",
            "name": "STEMulus Admin",
            "email": "admin@stemuluskidstech.com",
            "role": "admin",
            "password": "04445e6487736590d1ef50186b414e737e0164683cbbec64e00e73c000fd3bef",
            "createdAt": "2026-10-16T07:50:24.000Z"
        },
        "parent@stemuluskidstech.com": {
            "email": "parent@stemuluskidstech.com",
            "name": "Demo Parent",
            "role": "parent",
            "password": "4a4be0c85dc76ee56a3ea5a02b24214da076958d21a7a4e0c30fcface6a1e040",
            "createdAt": "2026-10-16T07:50:24.003Z"
        },
        "abiodunadebiyis@gmail.com": {
            "email": "abiodunadebiyis@gmail.com",
            "name": "Abiodun Shittu",
            "role": "parent",
            "password": "2LaZzEqrAa"
        },
        "abmsotayo@googlemail.com": {
            "email": "abmsotayo@googlemail.com",
            "name": "Alexandra Sotayo",
            "role": "parent",
            "password": "6U2MXMGTWs"
        },
        "chukwumah.maryrose@gmail.com": {
            "email": "Chukwumah.maryrose@gmail.com",
            "name": "Maryrose Chukwumah-Mordi",
            "role": "parent",
            "password": "dwHeHA9Ns3"
        },
        "talk2nike2009@gmail.com": {
            "email": "talk2nike2009@gmail.com",
            "name": "Babalola Olanike",
            "role": "parent",
            "password": "PJCA47SAeK"
        },
        "temiladeokesanjo1@gmail.com": {
            "email": "Temiladeokesanjo1@gmail.com",
            "name": "Temi Okesanjo",
            "role": "parent",
            "password": "YJFmFHfW2J"
        },
        "diamondsheva@gmail.com": {
            "email": "diamondsheva@gmail.com",
            "name": "Diamond Sheva Omosuyi",
            "role": "parent",
            "password": "hEFGSx2bXG"
        },
        "carlanouriat.k@gmail.com": {
            "email": "carlanouriat.k@gmail.com",
            "name": "Carla KARI",
            "role": "parent",
            "password": "Ch46FgDWPw"
        },
        "eoosonaike@gmail.com": {
            "email": "eoosonaike@gmail.com",
            "name": "Oladipupo Sonaike",
            "role": "parent",
            "password": "299HYm5VvS"
        },
        "annakhavkina@gmail.com": {
            "email": "annakhavkina@gmail.com",
            "name": "Anna Khavkina",
            "role": "parent",
            "password": "mdGa7MaHVv"
        },
        "adefemiadebayo20@gmail.com": {
            "id": "usr-tut-104",
            "name": "Moses Oluwafemi Adebayo",
            "email": "adefemiadebayo20@gmail.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "07063346551",
            "status": "active"
        },
        "kafayatabdulwahab.et@gmail.com": {
            "id": "usr-tut-105",
            "name": "Kafayat Abdulwahab",
            "email": "kafayatabdulwahab.et@gmail.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "08065220517",
            "status": "active"
        },
        "tonetbod@gmail.com": {
            "id": "usr-tut-106",
            "name": "Tola Tosin Ayanleke",
            "email": "tonetbod@gmail.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "0912 313 1969",
            "status": "active"
        },
        "emmanuel@stemuluskidstech.com": {
            "id": "usr-tut-107",
            "name": "Emmanuel O.",
            "email": "emmanuel@stemuluskidstech.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "+2348030000000",
            "status": "active"
        },
        "joshuaogba.parent@gmail.com": {
            "email": "joshuaogba.parent@gmail.com",
            "name": "Mrs. Ogba",
            "role": "parent",
            "password": "TempPassword2026!"
        }
    },
    "students": [
        {
            "id": "std-1001",
            "firstName": "Daniel",
            "lastName": "M.",
            "age": 11,
            "gender": "Male",
            "experience": "Beginner",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "parentEmail": "parent@stemuluskidstech.com",
            "parentName": "John Doe",
            "parentPhone": "+2347052466716",
            "birthday": "2015-06-01",
            "progress": 65,
            "avatarColor": "bg-blue-700",
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "classroomLink": "https://meet.google.com/nxg-rbcg-nsr",
            "skills": {
                "logic": 85,
                "loops": 80,
                "variables": 90,
                "syntax": 75,
                "projects": 70
            },
            "metrics": {
                "attended": 14,
                "total": 24,
                "projects": 3,
                "lines": 1450
            },
            "meetLink": "https://meet.google.com/nxg-rbcg-nsr"
        },
        {
            "id": "std-1002",
            "firstName": "Sarah",
            "lastName": "M.",
            "age": 8,
            "gender": "Female",
            "experience": "None",
            "program": "Scratch Creators",
            "status": "active",
            "remindersPaused": false,
            "parentEmail": "parent@stemuluskidstech.com",
            "parentName": "John Doe",
            "parentPhone": "+2347052466716",
            "birthday": "2018-05-31",
            "progress": 40,
            "avatarColor": "bg-orange-700",
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "classroomLink": "https://meet.google.com/gua-sisg-tei",
            "skills": {
                "logic": 60,
                "loops": 70,
                "variables": 40,
                "syntax": 55,
                "projects": 75
            },
            "metrics": {
                "attended": 8,
                "total": 20,
                "projects": 2,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/gua-sisg-tei"
        },
        {
            "id": "std-1003-8ecr",
            "firstName": "Abdulsalam",
            "lastName": "Modesire Shittu",
            "age": 14,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Abiodun Shittu",
            "parentEmail": "abiodunadebiyis@gmail.com",
            "parentPhone": "07438002358",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "notes": "Relationship: Mother | Grade: Y10 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
            "classroomLink": "https://meet.google.com/zhv-jquf-rem",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/zhv-jquf-rem"
        },
        {
            "id": "std-1004-e1rm",
            "firstName": "Alexandra",
            "lastName": "Sotayo",
            "age": 13,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Alexandra Sotayo",
            "parentEmail": "abmsotayo@googlemail.com",
            "parentPhone": "+447575353416",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "notes": "Relationship: Father | Grade: Year 9 | Experience: Some (Scratch, Basic coding) | Photo Consent: No",
            "classroomLink": "https://meet.google.com/yre-naci-zmp",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/yre-naci-zmp"
        },
        {
            "id": "std-1005-6f4y",
            "firstName": "Annabelle",
            "lastName": "Sotayo",
            "age": 10,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Matt Sotayo",
            "parentEmail": "abmsotayo@googlemail.com",
            "parentPhone": "+447575353416",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "notes": "Relationship: Father | Grade: Year 5 | Experience: Some (Scratch, Basic coding) | Photo Consent: No",
            "classroomLink": "https://meet.google.com/kos-rxkp-bkd",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/kos-rxkp-bkd"
        },
        {
            "id": "std-1006-il0c",
            "firstName": "Brian",
            "lastName": "Osenedum Chukwuka-Mordi",
            "age": 9,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Maryrose Chukwumah-Mordi",
            "parentEmail": "Chukwumah.maryrose@gmail.com",
            "parentPhone": "44 07876180911",
            "program": "Scratch Creators",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "notes": "Relationship: Mother | Grade: Grade 5 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes | Notes: I consent to his work project  to be shared but not his personal photo graph without further consent.",
            "classroomLink": "https://meet.google.com/wvh-vwbr-hoq",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/wvh-vwbr-hoq"
        },
        {
            "id": "std-1007-r4cv",
            "firstName": "Babalola",
            "lastName": "Oluwadunmininu Pearl",
            "age": 12,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Babalola Olanike",
            "parentEmail": "talk2nike2009@gmail.com",
            "parentPhone": "08055855102",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "tutorId": "tut-106-tola",
            "notes": "Relationship: Mother | Grade: SS1 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
            "classroomLink": "https://meet.google.com/mim-qifa-avc",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/mim-qifa-avc"
        },
        {
            "id": "std-1008-a0lp",
            "firstName": "Gbolade",
            "lastName": "Okesanjo",
            "age": 14,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Temi Okesanjo",
            "parentEmail": "Temiladeokesanjo1@gmail.com",
            "parentPhone": "08076000020",
            "program": "Web & App Development",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Emmanuel O.",
            "tutorEmail": "emmanuel@stemuluskidstech.com",
            "tutorId": "tut-107-emmanuel",
            "notes": "Relationship: Mother | Experience: None (Beginner) | Photo Consent: No",
            "classroomLink": "https://meet.google.com/mxh-ndjc-gox",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/mxh-ndjc-gox"
        },
        {
            "id": "std-1009-tbod",
            "firstName": "King",
            "lastName": "Myles Omosuyi",
            "age": 6,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Diamond Sheva Omosuyi",
            "parentEmail": "diamondsheva@gmail.com",
            "parentPhone": "08117090593",
            "program": "Scratch Creators",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "notes": "Relationship: Mother | Grade: Grade 3 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes | Notes: No allergies",
            "classroomLink": "https://meet.google.com/cjr-phmf-ahs",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/cjr-phmf-ahs"
        },
        {
            "id": "std-1010-ilb5",
            "firstName": "JUNAYD",
            "lastName": "KARI",
            "age": 6,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Carla KARI",
            "parentEmail": "carlanouriat.k@gmail.com",
            "parentPhone": "+33610570227",
            "program": "Scratch Creators",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "notes": "Relationship: Mother | Grade: GRADE 1 | Experience: None (Beginner) | Photo Consent: No",
            "classroomLink": "https://meet.google.com/gyd-fewb-cdh",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/gyd-fewb-cdh"
        },
        {
            "id": "std-1011-tq1u",
            "firstName": "Momooreoluwa",
            "lastName": "Sonaike",
            "age": 7,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Oladipupo Sonaike",
            "parentEmail": "eoosonaike@gmail.com",
            "parentPhone": "08186820039",
            "program": "Scratch Creators",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "tutorId": "tut-104-moses",
            "notes": "Relationship: Father | Grade: 3 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
            "classroomLink": "https://meet.google.com/vdp-nmbh-sjj",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/vdp-nmbh-sjj"
        },
        {
            "id": "std-1012-wq6b",
            "firstName": "David",
            "lastName": "Gjoka",
            "age": 10,
            "birthday": "",
            "hasExplicitBirthday": false,
            "parentName": "Anna Khavkina",
            "parentEmail": "annakhavkina@gmail.com",
            "parentPhone": "07898741675",
            "program": "Python Programming",
            "status": "active",
            "remindersPaused": false,
            "progress": 0,
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "notes": "Relationship: Mother | Grade: Year 6 | Experience: Some (Scratch, Basic coding) | Photo Consent: No | Notes: None",
            "classroomLink": "https://meet.google.com/ocz-qcjr-cqb",
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 8,
                "projects": 0,
                "lines": 0
            },
            "meetLink": "https://meet.google.com/ocz-qcjr-cqb"
        },
        {
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
            "skills": {
                "logic": 50,
                "loops": 50,
                "variables": 50,
                "syntax": 50,
                "projects": 50
            },
            "metrics": {
                "attended": 0,
                "total": 16,
                "projects": 0,
                "lines": 0
            }
        }
    ],
    "schedules": [
        {
            "id": "sch-115-sun-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Sunday",
            "date": "2026-10-18",
            "time": "19:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-114-sun-gbol-w1",
            "studentId": "std-1008-a0lp",
            "studentName": "Gbolade Okesanjo",
            "course": "Web & App Development",
            "dayOfWeek": "Sunday",
            "date": "2026-10-18",
            "time": "17:00",
            "duration": "60",
            "mentor": "Emmanuel O.",
            "tutorName": "Emmanuel O.",
            "tutorEmail": "emmanuel@stemuluskidstech.com",
            "tutorId": "tut-107-emmanuel",
            "link": "Physical (In-Person Hub)",
            "meetLinkBackup": "https://meet.google.com/mxh-ndjc-gox",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-113-sat-gbol-w1",
            "studentId": "std-1008-a0lp",
            "studentName": "Gbolade Okesanjo",
            "course": "Web & App Development",
            "dayOfWeek": "Saturday",
            "date": "2026-10-17",
            "time": "12:00",
            "duration": "60",
            "mentor": "Emmanuel O.",
            "tutorName": "Emmanuel O.",
            "tutorEmail": "emmanuel@stemuluskidstech.com",
            "tutorId": "tut-107-emmanuel",
            "link": "Physical (In-Person Hub)",
            "meetLinkBackup": "https://meet.google.com/mxh-ndjc-gox",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-112-sat-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Saturday",
            "date": "2026-10-17",
            "time": "12:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-111-sat-momo-w1",
            "studentId": "std-1011-tq1u",
            "studentName": "Momooreoluwa Sonaike",
            "course": "Scratch Creators",
            "dayOfWeek": "Saturday",
            "date": "2026-10-17",
            "time": "12:00",
            "duration": "60",
            "mentor": "Moses Oluwafemi Adebayo",
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "tutorId": "tut-104-moses",
            "link": "https://meet.google.com/vdp-nmbh-sjj",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-110-sat-pear-w1",
            "studentId": "std-1007-r4cv",
            "studentName": "Babalola Oluwadunmininu Pearl",
            "course": "Python Programming",
            "dayOfWeek": "Saturday",
            "date": "2026-10-17",
            "time": "10:00",
            "duration": "60",
            "mentor": "Tola Tosin Ayanleke",
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "tutorId": "tut-106-tola",
            "link": "https://meet.google.com/mim-qifa-avc",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-109-fri-myle-w1",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "dayOfWeek": "Friday",
            "date": "2026-10-16",
            "time": "17:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/cjr-phmf-ahs",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-108-fri-juna-w1",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "dayOfWeek": "Friday",
            "date": "2026-10-16",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/gyd-fewb-cdh",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-107-fri-pear-w1",
            "studentId": "std-1007-r4cv",
            "studentName": "Babalola Oluwadunmininu Pearl",
            "course": "Python Programming",
            "dayOfWeek": "Friday",
            "date": "2026-10-16",
            "time": "16:00",
            "duration": "60",
            "mentor": "Tola Tosin Ayanleke",
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "tutorId": "tut-106-tola",
            "link": "https://meet.google.com/mim-qifa-avc",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-106-wed-juna-w1",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "dayOfWeek": "Wednesday",
            "date": "2026-10-14",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/gyd-fewb-cdh",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-105-wed-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Wednesday",
            "date": "2026-10-14",
            "time": "15:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-104-tue-myle-w1",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-13",
            "time": "19:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/cjr-phmf-ahs",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-103-tue-davi-w1",
            "studentId": "std-1012-wq6b",
            "studentName": "David Gjoka",
            "course": "Python Programming",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-13",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/ocz-qcjr-cqb",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-102-tue-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-13",
            "time": "15:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-101-mon-momo-w1",
            "studentId": "std-1011-tq1u",
            "studentName": "Momooreoluwa Sonaike",
            "course": "Scratch Creators",
            "dayOfWeek": "Monday",
            "date": "2026-10-12",
            "time": "19:00",
            "duration": "60",
            "mentor": "Moses Oluwafemi Adebayo",
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "tutorId": "tut-104-moses",
            "link": "https://meet.google.com/vdp-nmbh-sjj",
            "status": "done",
            "attendanceStatus": "present"
        },
        {
            "id": "sch-2001",
            "studentId": "std-1001",
            "studentName": "Daniel M.",
            "course": "Python Programming",
            "date": "2026-06-01",
            "time": "16:00",
            "duration": "60",
            "mentor": "Sarah Jane",
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "link": "https://meet.google.com/nxg-rbcg-nsr",
            "attendanceStatus": "done",
            "status": "done"
        },
        {
            "id": "sch-2002",
            "studentId": "std-1002",
            "studentName": "Sarah M.",
            "course": "Scratch Creators",
            "date": "2026-05-31",
            "time": "15:00",
            "duration": "60",
            "mentor": "Sarah Jane",
            "tutorName": "Sarah Jane",
            "tutorEmail": "tutor@stemuluskidstech.com",
            "tutorId": "tut-101",
            "link": "https://meet.google.com/gua-sisg-tei",
            "attendanceStatus": "done",
            "status": "done"
        },
        {
            "id": "sch-101-mon-momo",
            "studentId": "std-1011-tq1u",
            "studentName": "Momooreoluwa Sonaike",
            "course": "Scratch Creators",
            "dayOfWeek": "Monday",
            "date": "2026-10-19",
            "time": "19:00",
            "duration": "60",
            "mentor": "Moses Oluwafemi Adebayo",
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "tutorId": "tut-104-moses",
            "link": "https://meet.google.com/vdp-nmbh-sjj",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-102-tue-josh",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-20",
            "time": "15:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-103-tue-davi",
            "studentId": "std-1012-wq6b",
            "studentName": "David Gjoka",
            "course": "Python Programming",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-20",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/ocz-qcjr-cqb",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-104-tue-myle",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "dayOfWeek": "Tuesday",
            "date": "2026-10-20",
            "time": "19:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/cjr-phmf-ahs",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-105-wed-josh",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Wednesday",
            "date": "2026-10-21",
            "time": "15:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-106-wed-juna",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "dayOfWeek": "Wednesday",
            "date": "2026-10-21",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/gyd-fewb-cdh",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-107-fri-pear",
            "studentId": "std-1007-r4cv",
            "studentName": "Babalola Oluwadunmininu Pearl",
            "course": "Python Programming",
            "dayOfWeek": "Friday",
            "date": "2026-10-23",
            "time": "16:00",
            "duration": "60",
            "mentor": "Tola Tosin Ayanleke",
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "tutorId": "tut-106-tola",
            "link": "https://meet.google.com/mim-qifa-avc",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-108-fri-juna",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "dayOfWeek": "Friday",
            "date": "2026-10-23",
            "time": "16:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/gyd-fewb-cdh",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-109-fri-myle",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "dayOfWeek": "Friday",
            "date": "2026-10-23",
            "time": "17:00",
            "duration": "60",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "tutorId": "tut-103",
            "link": "https://meet.google.com/cjr-phmf-ahs",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-110-sat-pear",
            "studentId": "std-1007-r4cv",
            "studentName": "Babalola Oluwadunmininu Pearl",
            "course": "Python Programming",
            "dayOfWeek": "Saturday",
            "date": "2026-10-24",
            "time": "10:00",
            "duration": "60",
            "mentor": "Tola Tosin Ayanleke",
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "tutorId": "tut-106-tola",
            "link": "https://meet.google.com/mim-qifa-avc",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-111-sat-momo",
            "studentId": "std-1011-tq1u",
            "studentName": "Momooreoluwa Sonaike",
            "course": "Scratch Creators",
            "dayOfWeek": "Saturday",
            "date": "2026-10-24",
            "time": "12:00",
            "duration": "60",
            "mentor": "Moses Oluwafemi Adebayo",
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "tutorId": "tut-104-moses",
            "link": "https://meet.google.com/vdp-nmbh-sjj",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-112-sat-josh",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Saturday",
            "date": "2026-10-24",
            "time": "12:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-113-sat-gbol",
            "studentId": "std-1008-a0lp",
            "studentName": "Gbolade Okesanjo",
            "course": "Web & App Development",
            "dayOfWeek": "Saturday",
            "date": "2026-10-24",
            "time": "12:00",
            "duration": "60",
            "mentor": "Emmanuel O.",
            "tutorName": "Emmanuel O.",
            "tutorEmail": "emmanuel@stemuluskidstech.com",
            "tutorId": "tut-107-emmanuel",
            "link": "Physical (In-Person Hub)",
            "meetLinkBackup": "https://meet.google.com/mxh-ndjc-gox",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-114-sun-gbol",
            "studentId": "std-1008-a0lp",
            "studentName": "Gbolade Okesanjo",
            "course": "Web & App Development",
            "dayOfWeek": "Sunday",
            "date": "2026-10-25",
            "time": "17:00",
            "duration": "60",
            "mentor": "Emmanuel O.",
            "tutorName": "Emmanuel O.",
            "tutorEmail": "emmanuel@stemuluskidstech.com",
            "tutorId": "tut-107-emmanuel",
            "link": "Physical (In-Person Hub)",
            "meetLinkBackup": "https://meet.google.com/mxh-ndjc-gox",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        },
        {
            "id": "sch-115-sun-josh",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "dayOfWeek": "Sunday",
            "date": "2026-10-25",
            "time": "19:00",
            "duration": "60",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "tutorId": "tut-105-kafa",
            "link": "https://meet.google.com/swf-vyjv-adm",
            "status": "scheduled",
            "attendanceStatus": "scheduled"
        }
    ],
    "enrollments": [],
    "rescheduleRequests": [
        {
            "id": "res-4001",
            "scheduleId": "sch-2001",
            "studentName": "Daniel M.",
            "course": "Python Programming",
            "currentDate": "2026-06-01",
            "currentTime": "16:00",
            "requestedDate": "2026-06-03",
            "requestedTime": "17:30",
            "status": "pending",
            "parentEmail": "parent@stemuluskidstech.com"
        }
    ],
    "progressReports": [
        {
            "id": "rep-5001",
            "studentId": "std-1001",
            "studentName": "Daniel M.",
            "program": "Python Programming",
            "date": "2026-05-04",
            "tutorName": "Sarah Jane",
            "module": "Introduction to Python",
            "grade": "A",
            "feedback": "Daniel's first class was excellent! He learned how to use print statements and simple string concatenations. He built a 'Bio Generator' script."
        },
        {
            "id": "rep-5002",
            "studentId": "std-1001",
            "studentName": "Daniel M.",
            "program": "Python Programming",
            "date": "2026-05-11",
            "tutorName": "Sarah Jane",
            "module": "Math Operators & Variables",
            "grade": "A-",
            "feedback": "Daniel worked on math operators and variable assignments. He created a basic calculator. He struggled slightly with modulo operations but understood them by the end."
        },
        {
            "id": "rep-5003",
            "studentId": "std-1001",
            "studentName": "Daniel M.",
            "program": "Python Programming",
            "date": "2026-05-18",
            "tutorName": "Sarah Jane",
            "module": "Conditional Logic",
            "grade": "A+",
            "feedback": "Superb understanding of if/elif/else statements! Daniel created a text-based decision-making game about choosing items in a dungeon. Exceptional creativity."
        },
        {
            "id": "rep-5004",
            "studentId": "std-1001",
            "studentName": "Daniel M.",
            "program": "Python Programming",
            "date": "2026-05-25",
            "tutorName": "Sarah Jane",
            "module": "Variables & Loops",
            "grade": "A",
            "feedback": "Daniel is doing exceptionally well. He grasped the concept of for loops quickly and built a mini text adventure game. Recommended next step is nested loops."
        },
        {
            "id": "rep-5005",
            "studentId": "std-1002",
            "studentName": "Sarah M.",
            "program": "Scratch Creators",
            "date": "2026-05-06",
            "tutorName": "Sarah Jane",
            "module": "Introduction to Scratch Blocks",
            "grade": "A",
            "feedback": "Sarah explored the Scratch stage and motion blocks. She created a cat character that runs back and forth when clicked. Great enthusiasm!"
        },
        {
            "id": "rep-5006",
            "studentId": "std-1002",
            "studentName": "Sarah M.",
            "program": "Scratch Creators",
            "date": "2026-05-13",
            "tutorName": "Sarah Jane",
            "module": "Events & Costumes",
            "grade": "B+",
            "feedback": "Sarah learned to animate characters by changing costumes and responding to spacebar key events. She created a dancing sprite. Needs to remember to clean up block clutter."
        },
        {
            "id": "rep-5007",
            "studentId": "std-1002",
            "studentName": "Sarah M.",
            "program": "Scratch Creators",
            "date": "2026-05-20",
            "tutorName": "Sarah Jane",
            "module": "Sound & Broadcasting",
            "grade": "A",
            "feedback": "Excellent class! Sarah learned to broadcast messages between sprites. She built a simple dialog scene between a dragon and a wizard with sound effects."
        },
        {
            "id": "rep-5008",
            "studentId": "std-1002",
            "studentName": "Sarah M.",
            "program": "Scratch Creators",
            "date": "2026-05-27",
            "tutorName": "Sarah Jane",
            "module": "Basic Loops",
            "grade": "A-",
            "feedback": "Sarah worked with repeat blocks. She animated a series of moving obstacles. She is showing a strong sense of game design."
        }
    ],
    "certificates": [
        {
            "id": "cert-6001",
            "credential_id": "STEM-2026-DF89",
            "student_name": "Daniel M.",
            "program_name": "Scratch Coding Mastery",
            "grade_level": "Distinction",
            "issue_date": "2026-05-15"
        },
        {
            "id": "cert-6002",
            "credential_id": "STEM-2026-QWHF",
            "student_name": "Modesire Abdusalam Shittu",
            "program_name": "Python Data App Academy: Building Web Apps with Streamlit",
            "grade_level": "Distinction",
            "issue_date": "2026-05-31"
        }
    ],
    "onboarding": {
        "parent@stemuluskidstech.com": {
            "completed": false,
            "currentStep": 1,
            "steps": [
                {
                    "id": "profile",
                    "label": "Verify Contact Information",
                    "done": true
                },
                {
                    "id": "alerts",
                    "label": "Configure Birthday & Class Alerts",
                    "done": false
                },
                {
                    "id": "schedule",
                    "label": "Accept Tutorial Schedule",
                    "done": false
                }
            ]
        }
    },
    "notifications": [
        {
            "id": "not-7001",
            "title": "Welcome to STEMulus!",
            "message": "Explore your new premium dashboard. Track sessions, view reports, and download certificates.",
            "timestamp": "2026-05-31T10:00:00.000Z",
            "read": false,
            "userEmail": "parent@stemuluskidstech.com"
        }
    ],
    "milestones": [
        {
            "id": "mil-1",
            "studentName": "Daniel M.",
            "studentAge": 11,
            "category": "Python Programming",
            "image": "robot_blink.mp4",
            "title": "Daniel explaining his SpaceX trajectory simulator",
            "description": "Daniel explains his conditional branch checks, variable tracking, and loops that calculate orbital escape velocity for a SpaceX Falcon 9 simulator.",
            "tags": "Daniel's SpaceX Flight Simulator"
        },
        {
            "id": "mil-2",
            "studentName": "Sarah M.",
            "studentAge": 8,
            "category": "Scratch Creators",
            "image": "Robot_scrub.mp4",
            "title": "Sarah showing her animated dialogue scenes",
            "description": "Sarah demonstrates message broadcasting and costume change events to synchronize a visual scene between a dragon sprite and a wizard.",
            "tags": "Sarah's Scratch Adventure Dialog"
        },
        {
            "id": "mil-3",
            "studentName": "Chidi A.",
            "studentAge": 10,
            "category": "Robotics & Arduino",
            "image": "robot_blink.mp4",
            "title": "Chidi demonstrating his self-steering sonar logic",
            "description": "Chidi reviews his C++ loop logic that calculates distance coordinates using an ultrasonic sensor and steers two servo motors to avoid grid barriers.",
            "tags": "Chidi's Autonomous Sonar Rover"
        }
    ],
    "ntfyTopic": "stm-bday-qm4p7s9ke2ax1nf",
    "tutors": [
        {
            "id": "tut-101",
            "name": "Sarah Jane",
            "email": "tutor@stemuluskidstech.com",
            "phone": "+2348011223344",
            "subjects": [
                "Python Programming",
                "Scratch Creators"
            ],
            "location": "Lagos, Nigeria",
            "assignmentType": "Online Remote Senior Instructor",
            "status": "active"
        },
        {
            "id": "tut-102",
            "name": "David Okon",
            "email": "david.okon@stemuluskidstech.com",
            "phone": "+2348022334455",
            "subjects": [
                "Web Development",
                "Robotics"
            ],
            "location": "Abuja, Nigeria",
            "assignmentType": "Online Remote Lead Mentor",
            "status": "active"
        },
        {
            "id": "tut-103",
            "name": "Olalekan Israel Ajimati",
            "email": "olalekan@stemuluskidstech.com",
            "altEmail": "ajimatimati@gmail.com",
            "phone": "+2347052466716",
            "subjects": [
                "Python Programming",
                "Full-Stack Web Development",
                "AI & Machine Learning"
            ],
            "location": "Lagos, Nigeria",
            "assignmentType": "Online & Lead Full-Stack Specialist",
            "bankName": "GTBank",
            "accountHolderName": "Olalekan Israel Ajimati",
            "accountNumber": "0123456789",
            "workstationAudit": "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)",
            "weeklyAvailableSlots": "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)",
            "operatingStandard": "STEMulus 1-on-1 Online Operating Standard Compliant",
            "digitalSignature": "Olalekan Israel Ajimati",
            "status": "active"
        },
        {
            "id": "tut-104-moses",
            "name": "Moses Oluwafemi Adebayo",
            "email": "adefemiadebayo20@gmail.com",
            "phone": "07063346551",
            "subjects": [
                "Scratch Creators",
                "Robotics & Micro:bit",
                "Python Programming"
            ],
            "location": "No 1 Asunle Bus Stop Ojoo Terminal Ibadan",
            "assignmentType": "Online Only: Currently restricted to remote online sessions only.",
            "bankName": "Opay",
            "accountHolderName": "Moses Oluwafemi Adebayo",
            "accountNumber": "7063346551",
            "nextOfKinName": "Mr Adebayo Michael (Sibling)",
            "nextOfKinContact": "0809 440 9716. Apo Wumba, Abuja",
            "workstationAudit": "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
            "weeklyAvailableSlots": "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)",
            "operatingStandard": "STEMulus 1-on-1 Online Operating Standard Compliant",
            "digitalSignature": "Moses Oluwafemi Adebayo",
            "onboardedAt": "2026-10-01T18:59:30.000Z",
            "status": "active"
        },
        {
            "id": "tut-105-kafa",
            "name": "Kafayat Abdulwahab",
            "email": "kafayatabdulwahab.et@gmail.com",
            "phone": "08065220517",
            "subjects": [
                "Scratch Creators",
                "Web Development",
                "Python Programming"
            ],
            "location": "Tanke, Ilorin Kwara state.",
            "assignmentType": "Online Only: Currently restricted to remote online sessions only.",
            "bankName": "GTBank",
            "accountHolderName": "Kafayat Abdulwahab",
            "accountNumber": "0141342433",
            "nextOfKinName": "Kudirat Mojisola / Sister",
            "nextOfKinContact": "08036580498 / Ilorin, Kwara state",
            "workstationAudit": "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
            "weeklyAvailableSlots": "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)",
            "operatingStandard": "STEMulus 1-on-1 Online Operating Standard Compliant",
            "digitalSignature": "Kafayat Abdulwahab",
            "onboardedAt": "2026-10-02T09:25:11.000Z",
            "status": "active"
        },
        {
            "id": "tut-106-tola",
            "name": "Tola Tosin Ayanleke",
            "email": "tonetbod@gmail.com",
            "phone": "0912 313 1969",
            "subjects": [
                "Python Programming",
                "Scratch Creators"
            ],
            "location": "Ajia, Ibadan.",
            "assignmentType": "Online Only: Currently restricted to remote online sessions only.",
            "bankName": "UBA",
            "accountHolderName": "TOLA TOSIN AYANLEKE",
            "accountNumber": "2054121458",
            "nextOfKinName": "Lawal Jumoke (Sister)",
            "nextOfKinContact": "0816 070 2956 - Ilorin",
            "workstationAudit": "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup",
            "weeklyAvailableSlots": "Saturday Mornings (9:00 AM to 12:00 PM WAT)",
            "operatingStandard": "STEMulus 1-on-1 Online Operating Standard Compliant",
            "digitalSignature": "TOLA TOSIN AYANLEKE",
            "onboardedAt": "2026-10-17T14:04:53.000Z",
            "status": "active"
        },
        {
            "id": "tut-107-emmanuel",
            "name": "Emmanuel O.",
            "email": "emmanuel@stemuluskidstech.com",
            "phone": "+2348030000000",
            "subjects": [
                "Robotics & Arduino",
                "Physical Computing",
                "Web & App Development"
            ],
            "location": "Ibadan Hub, Nigeria",
            "assignmentType": "Physical (In-Person Hub & Hardware Maker Mentor)",
            "bankName": "Access Bank",
            "accountHolderName": "Emmanuel O.",
            "accountNumber": "0987654321",
            "workstationAudit": "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits",
            "weeklyAvailableSlots": "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)",
            "operatingStandard": "STEMulus Physical Hub Standard Compliant",
            "digitalSignature": "Emmanuel O.",
            "status": "active"
        }
    ],
    "attendanceRecords": [
        {
            "id": "att-sch-101-mon-momo-w1",
            "scheduleId": "sch-101-mon-momo-w1",
            "studentId": "std-1011-tq1u",
            "studentName": "Momooreoluwa Sonaike",
            "course": "Scratch Creators",
            "mentor": "Moses Oluwafemi Adebayo",
            "tutorName": "Moses Oluwafemi Adebayo",
            "tutorEmail": "adefemiadebayo20@gmail.com",
            "date": "2026-10-12",
            "time": "19:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-102-tue-josh-w1",
            "scheduleId": "sch-102-tue-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "date": "2026-10-13",
            "time": "15:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-103-tue-davi-w1",
            "scheduleId": "sch-103-tue-davi-w1",
            "studentId": "std-1012-wq6b",
            "studentName": "David Gjoka",
            "course": "Python Programming",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "date": "2026-10-13",
            "time": "16:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-104-tue-myle-w1",
            "scheduleId": "sch-104-tue-myle-w1",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "date": "2026-10-13",
            "time": "19:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-105-wed-josh-w1",
            "scheduleId": "sch-105-wed-josh-w1",
            "studentId": "std-1013-jogb",
            "studentName": "Joshua Ogba",
            "course": "Scratch Creators",
            "mentor": "Kafayat Abdulwahab",
            "tutorName": "Kafayat Abdulwahab",
            "tutorEmail": "kafayatabdulwahab.et@gmail.com",
            "date": "2026-10-14",
            "time": "15:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-106-wed-juna-w1",
            "scheduleId": "sch-106-wed-juna-w1",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "date": "2026-10-14",
            "time": "16:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-107-fri-pear-w1",
            "scheduleId": "sch-107-fri-pear-w1",
            "studentId": "std-1007-r4cv",
            "studentName": "Babalola Oluwadunmininu Pearl",
            "course": "Python Programming",
            "mentor": "Tola Tosin Ayanleke",
            "tutorName": "Tola Tosin Ayanleke",
            "tutorEmail": "tonetbod@gmail.com",
            "date": "2026-10-16",
            "time": "16:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-108-fri-juna-w1",
            "scheduleId": "sch-108-fri-juna-w1",
            "studentId": "std-1010-ilb5",
            "studentName": "JUNAYD KARI",
            "course": "Scratch Creators",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "date": "2026-10-16",
            "time": "16:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        },
        {
            "id": "att-sch-109-fri-myle-w1",
            "scheduleId": "sch-109-fri-myle-w1",
            "studentId": "std-1009-tbod",
            "studentName": "King Myles Omosuyi",
            "course": "Scratch Creators",
            "mentor": "Olalekan Israel Ajimati",
            "tutorName": "Olalekan Israel Ajimati",
            "tutorEmail": "olalekan@stemuluskidstech.com",
            "date": "2026-10-16",
            "time": "17:00",
            "duration": "60",
            "status": "approved",
            "notes": "Student attended live session and made progress on curriculum goals."
        }
    ],
    "monthlyReports": [],
    "emailQueue": [
        {
            "id": "queue-1792137029497-6tax",
            "type": "welcome",
            "to": "abmsotayo@googlemail.com",
            "recipientName": "Alexandra Sotayo",
            "subject": "Welcome to STEMulus — Alexandra's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Alexandra Sotayo. Student: Alexandra Sotayo. Track: Python Programming. Initial Temp Password: 6U2MXMGTWs",
            "data": {
                "parentEmail": "abmsotayo@googlemail.com",
                "parentName": "Alexandra Sotayo",
                "studentName": "Alexandra Sotayo",
                "courseName": "Python Programming",
                "tempPassword": "6U2MXMGTWs",
                "classroomLink": "https://meet.google.com/yre-naci-zmp",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/yre-naci-zmp"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:29.497Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137028617-bx59",
            "type": "welcome",
            "to": "abiodunadebiyis@gmail.com",
            "recipientName": "Abiodun Shittu",
            "subject": "Welcome to STEMulus — Abdulsalam's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Abiodun Shittu. Student: Abdulsalam Modesire Shittu. Track: Python Programming. Initial Temp Password: 2LaZzEqrAa",
            "data": {
                "parentEmail": "abiodunadebiyis@gmail.com",
                "parentName": "Abiodun Shittu",
                "studentName": "Abdulsalam Modesire Shittu",
                "courseName": "Python Programming",
                "tempPassword": "2LaZzEqrAa",
                "classroomLink": "https://meet.google.com/zhv-jquf-rem",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/zhv-jquf-rem"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:28.617Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137038663-kgx9",
            "type": "welcome",
            "to": "annakhavkina@gmail.com",
            "recipientName": "Anna Khavkina",
            "subject": "Welcome to STEMulus — David's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Anna Khavkina. Student: David Gjoka. Track: Python Programming. Initial Temp Password: mdGa7MaHVv",
            "data": {
                "parentEmail": "annakhavkina@gmail.com",
                "parentName": "Anna Khavkina",
                "studentName": "David Gjoka",
                "courseName": "Python Programming",
                "tempPassword": "mdGa7MaHVv",
                "classroomLink": "https://meet.google.com/ocz-qcjr-cqb",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/ocz-qcjr-cqb"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:38.663Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137037330-n18x",
            "type": "welcome",
            "to": "eoosonaike@gmail.com",
            "recipientName": "Oladipupo Sonaike",
            "subject": "Welcome to STEMulus — Momooreoluwa's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Oladipupo Sonaike. Student: Momooreoluwa Sonaike. Track: Scratch Creators. Initial Temp Password: 299HYm5VvS",
            "data": {
                "parentEmail": "eoosonaike@gmail.com",
                "parentName": "Oladipupo Sonaike",
                "studentName": "Momooreoluwa Sonaike",
                "courseName": "Scratch Creators",
                "tempPassword": "299HYm5VvS",
                "classroomLink": "https://meet.google.com/vdp-nmbh-sjj",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/vdp-nmbh-sjj"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:37.330Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137036078-w7wa",
            "type": "welcome",
            "to": "carlanouriat.k@gmail.com",
            "recipientName": "Carla KARI",
            "subject": "Welcome to STEMulus — JUNAYD's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Carla KARI. Student: JUNAYD KARI. Track: Scratch Creators. Initial Temp Password: Ch46FgDWPw",
            "data": {
                "parentEmail": "carlanouriat.k@gmail.com",
                "parentName": "Carla KARI",
                "studentName": "JUNAYD KARI",
                "courseName": "Scratch Creators",
                "tempPassword": "Ch46FgDWPw",
                "classroomLink": "https://meet.google.com/gyd-fewb-cdh",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/gyd-fewb-cdh"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:36.078Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137034891-ny1d",
            "type": "welcome",
            "to": "diamondsheva@gmail.com",
            "recipientName": "Diamond Sheva Omosuyi",
            "subject": "Welcome to STEMulus — King's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Diamond Sheva Omosuyi. Student: King Myles Omosuyi. Track: Scratch Creators. Initial Temp Password: hEFGSx2bXG",
            "data": {
                "parentEmail": "diamondsheva@gmail.com",
                "parentName": "Diamond Sheva Omosuyi",
                "studentName": "King Myles Omosuyi",
                "courseName": "Scratch Creators",
                "tempPassword": "hEFGSx2bXG",
                "classroomLink": "https://meet.google.com/cjr-phmf-ahs",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/cjr-phmf-ahs"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:34.891Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137034030-v4oz",
            "type": "welcome",
            "to": "Temiladeokesanjo1@gmail.com",
            "recipientName": "Temi Okesanjo",
            "subject": "Welcome to STEMulus — Gbolade's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Temi Okesanjo. Student: Gbolade Okesanjo. Track: Web & App Development. Initial Temp Password: YJFmFHfW2J",
            "data": {
                "parentEmail": "Temiladeokesanjo1@gmail.com",
                "parentName": "Temi Okesanjo",
                "studentName": "Gbolade Okesanjo",
                "courseName": "Web & App Development",
                "tempPassword": "YJFmFHfW2J",
                "classroomLink": "https://meet.google.com/mxh-ndjc-gox",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/mxh-ndjc-gox"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:34.030Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137033048-01ie",
            "type": "welcome",
            "to": "talk2nike2009@gmail.com",
            "recipientName": "Babalola Olanike",
            "subject": "Welcome to STEMulus — Babalola's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Babalola Olanike. Student: Babalola Oluwadunmininu Pearl. Track: Python Programming. Initial Temp Password: PJCA47SAeK",
            "data": {
                "parentEmail": "talk2nike2009@gmail.com",
                "parentName": "Babalola Olanike",
                "studentName": "Babalola Oluwadunmininu Pearl",
                "courseName": "Python Programming",
                "tempPassword": "PJCA47SAeK",
                "classroomLink": "https://meet.google.com/mim-qifa-avc",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/mim-qifa-avc"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:33.048Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137032043-b8y8",
            "type": "welcome",
            "to": "Chukwumah.maryrose@gmail.com",
            "recipientName": "Maryrose Chukwumah-Mordi",
            "subject": "Welcome to STEMulus — Brian's coding journey starts!",
            "htmlPreview": "Parent Welcome Kit for Maryrose Chukwumah-Mordi. Student: Brian Osenedum Chukwuka-Mordi. Track: Scratch Creators. Initial Temp Password: dwHeHA9Ns3",
            "data": {
                "parentEmail": "Chukwumah.maryrose@gmail.com",
                "parentName": "Maryrose Chukwumah-Mordi",
                "studentName": "Brian Osenedum Chukwuka-Mordi",
                "courseName": "Scratch Creators",
                "tempPassword": "dwHeHA9Ns3",
                "classroomLink": "https://meet.google.com/wvh-vwbr-hoq",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/wvh-vwbr-hoq"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:32.043Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        },
        {
            "id": "queue-1792137031290-mrmj",
            "type": "student-enrolled",
            "to": "abmsotayo@googlemail.com",
            "recipientName": "Matt Sotayo",
            "subject": "STEMulus Enrollment Update — Annabelle has been enrolled!",
            "htmlPreview": "Enrollment notice for Annabelle in Python Programming.",
            "data": {
                "parentEmail": "abmsotayo@googlemail.com",
                "parentName": "Matt Sotayo",
                "studentName": "Annabelle Sotayo",
                "courseName": "Python Programming",
                "tempPassword": "6aHXZAaqcS",
                "classroomLink": "https://meet.google.com/yre-naci-zmp",
                "adminApproved": false,
                "meetLink": "https://meet.google.com/yre-naci-zmp"
            },
            "status": "pending",
            "createdAt": "2026-10-16T07:50:31.290Z",
            "triggeredBy": "autonomous_playwright_onboarding"
        }
    ],
    "passwordResetRequests": []
};

    // Helper to retrieve data from localStorage (Web Crypto Vault Protected)
    function getDB() {
        let parsed = null;
        if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.getSecureDB) {
            parsed = StemulusSecurity.getSecureDB();
        }
        if (!parsed) {
            const dbStr = (typeof localStorage !== 'undefined') ? localStorage.getItem("stemulus_db") : null;
            if (!dbStr) {
                saveDB(DEFAULT_DATA);
                return DEFAULT_DATA;
            }
            try {
                parsed = JSON.parse(dbStr);
                const DB_SYNC_VERSION = '2026.10.17.v5';
                if (!parsed || parsed._syncVersion !== DB_SYNC_VERSION || !parsed.schedules || parsed.schedules.length < 20 || !parsed.students || parsed.students.length < 13) {
                    parsed = Object.assign({}, DEFAULT_DATA, parsed || {});
                    parsed.students = DEFAULT_DATA.students || [];
                    parsed.tutors = DEFAULT_DATA.tutors || [];
                    parsed.schedules = DEFAULT_DATA.schedules || [];
                    parsed.users = Object.assign({}, DEFAULT_DATA.users || {}, parsed.users || {});
                    parsed._syncVersion = DB_SYNC_VERSION;
                    saveDB(parsed);
                }
                if (parsed && parsed.__sec === true && !parsed.students) {
                    console.warn('[DashboardEngine] Corrupted or tampered vault state. Reinitializing defaults.');
                    parsed = DEFAULT_DATA;
                }
            } catch (e) {
                parsed = DEFAULT_DATA;
            }
        }
        try {
            if (!parsed.enrollments) {
                parsed.enrollments = [];
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }
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
            // Ensure tutors array exists and includes all core verified tutors
            const coreVerifiedTutors = [
                { id: "tut-101", name: "Sarah Jane", email: "tutor@stemuluskidstech.com", phone: "+2348011223344", subjects: ["Python Programming", "Scratch Creators"], location: "Lagos, Nigeria", assignmentType: "Online Remote Senior Instructor", status: "active" },
                { id: "tut-102", name: "David Okon", email: "david.okon@stemuluskidstech.com", phone: "+2348022334455", subjects: ["Web Development", "Robotics"], location: "Abuja, Nigeria", assignmentType: "Online Remote Lead Mentor", status: "active" },
                { id: "tut-103", name: "Olalekan Israel Ajimati", email: "olalekan@stemuluskidstech.com", altEmail: "ajimatimati@gmail.com", phone: "+2347052466716", subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"], location: "Lagos, Nigeria", assignmentType: "Online & Lead Full-Stack Specialist", bankName: "GTBank", accountHolderName: "Olalekan Israel Ajimati", accountNumber: "0123456789", workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)", weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Olalekan Israel Ajimati", status: "active" },
                { id: "tut-104-moses", name: "Moses Oluwafemi Adebayo", email: "adefemiadebayo20@gmail.com", phone: "07063346551", subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"], location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "Opay", accountHolderName: "Moses Oluwafemi Adebayo", accountNumber: "7063346551", nextOfKinName: "Mr Adebayo Michael (Sibling)", nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Moses Oluwafemi Adebayo", onboardedAt: "2026-10-01T18:59:30.000Z", status: "active" },
                { id: "tut-105-kafa", name: "Kafayat Abdulwahab", email: "kafayatabdulwahab.et@gmail.com", phone: "08065220517", subjects: ["Scratch Creators", "Web Development", "Python Programming"], location: "Tanke, Ilorin Kwara state.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "GTBank", accountHolderName: "Kafayat Abdulwahab", accountNumber: "0141342433", nextOfKinName: "Kudirat Mojisola / Sister", nextOfKinContact: "08036580498 / Ilorin, Kwara state", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Kafayat Abdulwahab", onboardedAt: "2026-10-02T09:25:11.000Z", status: "active" },
                { id: "tut-106-tola", name: "Tola Tosin Ayanleke", email: "tonetbod@gmail.com", phone: "0912 313 1969", subjects: ["Python Programming", "Scratch Creators"], location: "Ajia, Ibadan.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "UBA", accountHolderName: "TOLA TOSIN AYANLEKE", accountNumber: "2054121458", nextOfKinName: "Lawal Jumoke (Sister)", nextOfKinContact: "0816 070 2956 - Ilorin", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "TOLA TOSIN AYANLEKE", onboardedAt: "2026-10-17T14:04:53.000Z", status: "active" },
                { id: "tut-107-emmanuel", name: "Emmanuel O.", email: "emmanuel@stemuluskidstech.com", phone: "+2348030000000", subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"], location: "Ibadan Hub, Nigeria", assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)", bankName: "Access Bank", accountHolderName: "Emmanuel O.", accountNumber: "0987654321", workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits", weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)", operatingStandard: "STEMulus Physical Hub Standard Compliant", digitalSignature: "Emmanuel O.", status: "active" }
            ];

            if (!parsed.tutors || !Array.isArray(parsed.tutors)) {
                parsed.tutors = JSON.parse(JSON.stringify(coreVerifiedTutors));
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            } else {
                let tutorsAppended = false;
                coreVerifiedTutors.forEach(ct => {
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
                });
                if (tutorsAppended) {
                    localStorage.setItem("stemulus_db", JSON.stringify(parsed));
                }
            }

            // Ensure core tutors also exist in parsed.users with role tutor and default password hash
            parsed.users = parsed.users || {};
            let usersAppended = false;
            const TUTOR_DEFAULT_HASH = 'ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493'; // SHA-256 of 'Tutor2026!'
            coreVerifiedTutors.forEach(ct => {
                const ctKey = ct.email.toLowerCase().trim();
                if (!parsed.users[ctKey]) {
                    parsed.users[ctKey] = {
                        id: "usr-" + ct.id,
                        name: ct.name,
                        email: ct.email,
                        role: "tutor",
                        password: TUTOR_DEFAULT_HASH,
                        phone: ct.phone,
                        status: "active"
                    };
                    usersAppended = true;
                } else if (!parsed.users[ctKey].password) {
                    parsed.users[ctKey].password = TUTOR_DEFAULT_HASH;
                    usersAppended = true;
                }
            });
            // Ensure core admin account exists with role admin and default password hash
            const ADMIN_KEY = 'admin@stemuluskidstech.com';
            const ADMIN_DEFAULT_HASH = '04445e6487736590d1ef50186b414e737e0164683cbbec64e00e73c000fd3bef'; // SHA-256 of 'Admin2026!'
            if (!parsed.users[ADMIN_KEY]) {
                parsed.users[ADMIN_KEY] = {
                    id: 'usr-admin-01',
                    name: 'STEMulus Admin',
                    email: ADMIN_KEY,
                    role: 'admin',
                    password: ADMIN_DEFAULT_HASH,
                    createdAt: new Date().toISOString()
                };
                usersAppended = true;
            } else if (!parsed.users[ADMIN_KEY].password || parsed.users[ADMIN_KEY].role !== 'admin') {
                parsed.users[ADMIN_KEY].role = 'admin';
                parsed.users[ADMIN_KEY].password = ADMIN_DEFAULT_HASH;
                usersAppended = true;
            }


            // Ensure core officially enrolled students from Google Sheets roster are present
            const coreEnrolledStudents = [
          {
                    "id": "std-1003-8ecr",
                    "firstName": "Abdulsalam",
                    "lastName": "Modesire Shittu",
                    "age": 14,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Abiodun Shittu",
                    "parentEmail": "abiodunadebiyis@gmail.com",
                    "parentPhone": "07438002358",
                    "program": "Python Programming",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: Y10 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1004-e1rm",
                    "firstName": "Alexandra",
                    "lastName": "Sotayo",
                    "age": 13,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Alexandra Sotayo",
                    "parentEmail": "abmsotayo@googlemail.com",
                    "parentPhone": "+447575353416",
                    "program": "Python Programming",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Father | Grade: Year 9 | Experience: Some (Scratch, Basic coding) | Photo Consent: No",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1005-6f4y",
                    "firstName": "Annabelle",
                    "lastName": "Sotayo",
                    "age": 10,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Matt Sotayo",
                    "parentEmail": "abmsotayo@googlemail.com",
                    "parentPhone": "+447575353416",
                    "program": "Python Programming",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Father | Grade: Year 5 | Experience: Some (Scratch, Basic coding) | Photo Consent: No",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1006-il0c",
                    "firstName": "Brian",
                    "lastName": "Osenedum Chukwuka-Mordi",
                    "age": 9,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Maryrose Chukwumah-Mordi",
                    "parentEmail": "Chukwumah.maryrose@gmail.com",
                    "parentPhone": "44 07876180911",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: Grade 5 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes | Notes: I consent to his work project  to be shared but not his personal photo graph without further consent.",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1007-r4cv",
                    "firstName": "Babalola",
                    "lastName": "Oluwadunmininu Pearl",
                    "age": 12,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Babalola Olanike",
                    "parentEmail": "talk2nike2009@gmail.com",
                    "parentPhone": "08055855102",
                    "program": "Python Programming",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: SS1 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1008-a0lp",
                    "firstName": "Gbolade",
                    "lastName": "Okesanjo",
                    "age": 14,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Temi Okesanjo",
                    "parentEmail": "Temiladeokesanjo1@gmail.com",
                    "parentPhone": "08076000020",
                    "program": "Web & App Development",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Experience: None (Beginner) | Photo Consent: No",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1009-tbod",
                    "firstName": "King",
                    "lastName": "Myles Omosuyi",
                    "age": 6,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Diamond Sheva Omosuyi",
                    "parentEmail": "diamondsheva@gmail.com",
                    "parentPhone": "08117090593",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: Grade 3 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes | Notes: No allergies",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1010-ilb5",
                    "firstName": "JUNAYD",
                    "lastName": "KARI",
                    "age": 6,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Carla KARI",
                    "parentEmail": "carlanouriat.k@gmail.com",
                    "parentPhone": "+33610570227",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: GRADE 1 | Experience: None (Beginner) | Photo Consent: No",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1011-tq1u",
                    "firstName": "Momooreoluwa",
                    "lastName": "Sonaike",
                    "age": 7,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Oladipupo Sonaike",
                    "parentEmail": "eoosonaike@gmail.com",
                    "parentPhone": "08186820039",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Father | Grade: 3 | Experience: Some (Scratch, Basic coding) | Photo Consent: Yes",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1012-wq6b",
                    "firstName": "David",
                    "lastName": "Gjoka",
                    "age": 10,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Anna Khavkina",
                    "parentEmail": "annakhavkina@gmail.com",
                    "parentPhone": "07898741675",
                    "program": "Python Programming",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Relationship: Mother | Grade: Year 6 | Experience: Some (Scratch, Basic coding) | Photo Consent: No | Notes: None",
                    "classroomLink": "",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
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
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 16,
                              "projects": 0,
                              "lines": 0
                    }
          }
];
            let studentsAppended = false;
            parsed.students = parsed.students || [];

            // 1. Ensure Daniel and Sarah have their assigned Google Meet links
            parsed.students.forEach(s => {
                if (s.id === 'std-1001' && !s.meetLink) {
                    s.meetLink = 'https://meet.google.com/nxg-rbcg-nsr';
                    s.classroomLink = s.classroomLink || 'https://meet.google.com/nxg-rbcg-nsr';
                    studentsAppended = true;
                }
                if (s.id === 'std-1002' && !s.meetLink) {
                    s.meetLink = 'https://meet.google.com/gua-sisg-tei';
                    s.classroomLink = s.classroomLink || 'https://meet.google.com/gua-sisg-tei';
                    studentsAppended = true;
                }
            });

            // 2. Comprehensive Google Meet map for all officially enrolled students
            const studentMeetMap = {
                "std-1001": "https://meet.google.com/nxg-rbcg-nsr",
                "std-1002": "https://meet.google.com/gua-sisg-tei",
                "std-1003-8ecr": "https://meet.google.com/zhv-jquf-rem",
                "std-1004-e1rm": "https://meet.google.com/yre-naci-zmp",
                "std-1005-6f4y": "https://meet.google.com/kos-rxkp-bkd",
                "std-1006-il0c": "https://meet.google.com/wvh-vwbr-hoq",
                "std-1007-r4cv": "https://meet.google.com/mim-qifa-avc",
                "std-1008-a0lp": "https://meet.google.com/mxh-ndjc-gox",
                "std-1009-tbod": "https://meet.google.com/cjr-phmf-ahs",
                "std-1010-ilb5": "https://meet.google.com/gyd-fewb-cdh",
                "std-1011-tq1u": "https://meet.google.com/vdp-nmbh-sjj",
                "std-1012-wq6b": "https://meet.google.com/ocz-qcjr-cqb",
                "std-1013-jogb": "https://meet.google.com/swf-vyjv-adm"
            };

            coreEnrolledStudents.forEach(ces => {
                const assignedLink = studentMeetMap[ces.id] || ces.meetLink || '';
                if (assignedLink) {
                    ces.meetLink = assignedLink;
                    ces.classroomLink = ces.classroomLink || assignedLink;
                }
                const cleanFirst = (ces.firstName || '').toLowerCase().trim();
                const cleanParent = (ces.parentEmail || '').toLowerCase().trim();
                const matched = parsed.students.find(s => {
                    const sFirst = (s.firstName || '').toLowerCase().trim();
                    const sParent = (s.parentEmail || '').toLowerCase().trim();
                    return s.id === ces.id || (sFirst === cleanFirst && sParent === cleanParent);
                });
                if (!matched) {
                    parsed.students.push(ces);
                    studentsAppended = true;
                } else if (!matched.meetLink && assignedLink) {
                    matched.meetLink = assignedLink;
                    matched.classroomLink = matched.classroomLink || assignedLink;
                    studentsAppended = true;
                }
            });

            // 2b. Sync official tutor reassignments as dispatched
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

            // 3. Cascade Google Meet links to any schedules that lack a link or have obsolete zoom links
            if (parsed.schedules && Array.isArray(parsed.schedules)) {
                parsed.schedules.forEach(sch => {
                    if (!sch.link || sch.link.includes('zoom.us') || sch.link.trim() === '') {
                        const targetMeet = studentMeetMap[sch.studentId] || (parsed.students.find(s => s.id === sch.studentId) || {}).meetLink;
                        if (targetMeet) {
                            sch.link = targetMeet;
                            studentsAppended = true;
                        }
                    }
                });
            }

            if (studentsAppended) {
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }

            // Ensure parent accounts for core enrolled students exist
            const coreParentUsers = {
          "abiodunadebiyis@gmail.com": {
                    "email": "abiodunadebiyis@gmail.com",
                    "name": "Abiodun Shittu",
                    "role": "parent",
                    "password": "2LaZzEqrAa"
          },
          "abmsotayo@googlemail.com": {
                    "email": "abmsotayo@googlemail.com",
                    "name": "Alexandra Sotayo",
                    "role": "parent",
                    "password": "6U2MXMGTWs"
          },
          "chukwumah.maryrose@gmail.com": {
                    "email": "Chukwumah.maryrose@gmail.com",
                    "name": "Maryrose Chukwumah-Mordi",
                    "role": "parent",
                    "password": "dwHeHA9Ns3"
          },
          "talk2nike2009@gmail.com": {
                    "email": "talk2nike2009@gmail.com",
                    "name": "Babalola Olanike",
                    "role": "parent",
                    "password": "PJCA47SAeK"
          },
          "temiladeokesanjo1@gmail.com": {
                    "email": "Temiladeokesanjo1@gmail.com",
                    "name": "Temi Okesanjo",
                    "role": "parent",
                    "password": "YJFmFHfW2J"
          },
          "diamondsheva@gmail.com": {
                    "email": "diamondsheva@gmail.com",
                    "name": "Diamond Sheva Omosuyi",
                    "role": "parent",
                    "password": "hEFGSx2bXG"
          },
          "carlanouriat.k@gmail.com": {
                    "email": "carlanouriat.k@gmail.com",
                    "name": "Carla KARI",
                    "role": "parent",
                    "password": "Ch46FgDWPw"
          },
          "eoosonaike@gmail.com": {
                    "email": "eoosonaike@gmail.com",
                    "name": "Oladipupo Sonaike",
                    "role": "parent",
                    "password": "299HYm5VvS"
          },
          "annakhavkina@gmail.com": {
                    "email": "annakhavkina@gmail.com",
                    "name": "Anna Khavkina",
                    "role": "parent",
                    "password": "mdGa7MaHVv"
          }
};
            Object.keys(coreParentUsers).forEach(pk => {
                if (!parsed.users[pk]) {
                    parsed.users[pk] = coreParentUsers[pk];
                    usersAppended = true;
                }
            });

            // Ensure pending welcome emails are in emailQueue awaiting admin review/approval
            const corePendingEmailQueue = [
          {
                    "id": "queue-1792137029497-6tax",
                    "type": "welcome",
                    "to": "abmsotayo@googlemail.com",
                    "recipientName": "Alexandra Sotayo",
                    "subject": "Welcome to STEMulus — Alexandra's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Alexandra Sotayo. Student: Alexandra Sotayo. Track: Python Programming. Initial Temp Password: 6U2MXMGTWs",
                    "data": {
                              "parentEmail": "abmsotayo@googlemail.com",
                              "parentName": "Alexandra Sotayo",
                              "studentName": "Alexandra Sotayo",
                              "courseName": "Python Programming",
                              "tempPassword": "6U2MXMGTWs",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:29.497Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137028617-bx59",
                    "type": "welcome",
                    "to": "abiodunadebiyis@gmail.com",
                    "recipientName": "Abiodun Shittu",
                    "subject": "Welcome to STEMulus — Abdulsalam's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Abiodun Shittu. Student: Abdulsalam Modesire Shittu. Track: Python Programming. Initial Temp Password: 2LaZzEqrAa",
                    "data": {
                              "parentEmail": "abiodunadebiyis@gmail.com",
                              "parentName": "Abiodun Shittu",
                              "studentName": "Abdulsalam Modesire Shittu",
                              "courseName": "Python Programming",
                              "tempPassword": "2LaZzEqrAa",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:28.617Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137038663-kgx9",
                    "type": "welcome",
                    "to": "annakhavkina@gmail.com",
                    "recipientName": "Anna Khavkina",
                    "subject": "Welcome to STEMulus — David's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Anna Khavkina. Student: David Gjoka. Track: Python Programming. Initial Temp Password: mdGa7MaHVv",
                    "data": {
                              "parentEmail": "annakhavkina@gmail.com",
                              "parentName": "Anna Khavkina",
                              "studentName": "David Gjoka",
                              "courseName": "Python Programming",
                              "tempPassword": "mdGa7MaHVv",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:38.663Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137037330-n18x",
                    "type": "welcome",
                    "to": "eoosonaike@gmail.com",
                    "recipientName": "Oladipupo Sonaike",
                    "subject": "Welcome to STEMulus — Momooreoluwa's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Oladipupo Sonaike. Student: Momooreoluwa Sonaike. Track: Scratch Creators. Initial Temp Password: 299HYm5VvS",
                    "data": {
                              "parentEmail": "eoosonaike@gmail.com",
                              "parentName": "Oladipupo Sonaike",
                              "studentName": "Momooreoluwa Sonaike",
                              "courseName": "Scratch Creators",
                              "tempPassword": "299HYm5VvS",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:37.330Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137036078-w7wa",
                    "type": "welcome",
                    "to": "carlanouriat.k@gmail.com",
                    "recipientName": "Carla KARI",
                    "subject": "Welcome to STEMulus — JUNAYD's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Carla KARI. Student: JUNAYD KARI. Track: Scratch Creators. Initial Temp Password: Ch46FgDWPw",
                    "data": {
                              "parentEmail": "carlanouriat.k@gmail.com",
                              "parentName": "Carla KARI",
                              "studentName": "JUNAYD KARI",
                              "courseName": "Scratch Creators",
                              "tempPassword": "Ch46FgDWPw",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:36.078Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137034891-ny1d",
                    "type": "welcome",
                    "to": "diamondsheva@gmail.com",
                    "recipientName": "Diamond Sheva Omosuyi",
                    "subject": "Welcome to STEMulus — King's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Diamond Sheva Omosuyi. Student: King Myles Omosuyi. Track: Scratch Creators. Initial Temp Password: hEFGSx2bXG",
                    "data": {
                              "parentEmail": "diamondsheva@gmail.com",
                              "parentName": "Diamond Sheva Omosuyi",
                              "studentName": "King Myles Omosuyi",
                              "courseName": "Scratch Creators",
                              "tempPassword": "hEFGSx2bXG",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:34.891Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137034030-v4oz",
                    "type": "welcome",
                    "to": "Temiladeokesanjo1@gmail.com",
                    "recipientName": "Temi Okesanjo",
                    "subject": "Welcome to STEMulus — Gbolade's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Temi Okesanjo. Student: Gbolade Okesanjo. Track: Web & App Development. Initial Temp Password: YJFmFHfW2J",
                    "data": {
                              "parentEmail": "Temiladeokesanjo1@gmail.com",
                              "parentName": "Temi Okesanjo",
                              "studentName": "Gbolade Okesanjo",
                              "courseName": "Web & App Development",
                              "tempPassword": "YJFmFHfW2J",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:34.030Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137033048-01ie",
                    "type": "welcome",
                    "to": "talk2nike2009@gmail.com",
                    "recipientName": "Babalola Olanike",
                    "subject": "Welcome to STEMulus — Babalola's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Babalola Olanike. Student: Babalola Oluwadunmininu Pearl. Track: Python Programming. Initial Temp Password: PJCA47SAeK",
                    "data": {
                              "parentEmail": "talk2nike2009@gmail.com",
                              "parentName": "Babalola Olanike",
                              "studentName": "Babalola Oluwadunmininu Pearl",
                              "courseName": "Python Programming",
                              "tempPassword": "PJCA47SAeK",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:33.048Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137032043-b8y8",
                    "type": "welcome",
                    "to": "Chukwumah.maryrose@gmail.com",
                    "recipientName": "Maryrose Chukwumah-Mordi",
                    "subject": "Welcome to STEMulus — Brian's coding journey starts!",
                    "htmlPreview": "Parent Welcome Kit for Maryrose Chukwumah-Mordi. Student: Brian Osenedum Chukwuka-Mordi. Track: Scratch Creators. Initial Temp Password: dwHeHA9Ns3",
                    "data": {
                              "parentEmail": "Chukwumah.maryrose@gmail.com",
                              "parentName": "Maryrose Chukwumah-Mordi",
                              "studentName": "Brian Osenedum Chukwuka-Mordi",
                              "courseName": "Scratch Creators",
                              "tempPassword": "dwHeHA9Ns3",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:32.043Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          },
          {
                    "id": "queue-1792137031290-mrmj",
                    "type": "student-enrolled",
                    "to": "abmsotayo@googlemail.com",
                    "recipientName": "Matt Sotayo",
                    "subject": "STEMulus Enrollment Update — Annabelle has been enrolled!",
                    "htmlPreview": "Enrollment notice for Annabelle in Python Programming.",
                    "data": {
                              "parentEmail": "abmsotayo@googlemail.com",
                              "parentName": "Matt Sotayo",
                              "studentName": "Annabelle Sotayo",
                              "courseName": "Python Programming",
                              "tempPassword": "6aHXZAaqcS",
                              "classroomLink": "",
                              "adminApproved": false
                    },
                    "status": "pending",
                    "createdAt": "2026-10-16T07:50:31.290Z",
                    "triggeredBy": "autonomous_playwright_onboarding"
          }
];
            parsed.emailQueue = parsed.emailQueue || [];
            let queueAppended = false;
            corePendingEmailQueue.forEach(eq => {
                if (!parsed.emailQueue.some(q => q.id === eq.id || (q.to === eq.to && q.type === eq.type))) {
                    parsed.emailQueue.unshift(eq);
                    queueAppended = true;
                }
            });

            if (usersAppended || studentsAppended || queueAppended) {
                localStorage.setItem("stemulus_db", JSON.stringify(parsed));
            }

            // Clean up legacy schedules that have invalid/undefined dates
            if (parsed.schedules && Array.isArray(parsed.schedules)) {
                let schedulesCleaned = false;
                parsed.schedules = parsed.schedules.filter(s => {
                    if (!s || !s.studentId) return false;
                    if (!s.date || s.date === 'undefined' || s.date === 'null') {
                        schedulesCleaned = true;
                        return false;
                    }
                    return true;
                });
                if (schedulesCleaned) {
                    localStorage.setItem("stemulus_db", JSON.stringify(parsed));
                }
            }

            return parsed;
        } catch (e) {
            console.error("Local DB corrupt. Re-initializing...", e);
            saveDB(DEFAULT_DATA);
            return DEFAULT_DATA;
        }
    }

    // Helper to save data to localStorage & Cloud (Encrypted at rest via Web Crypto Vault)
    function saveDB(db) {
        try {
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureDB) {
                StemulusSecurity.saveSecureDB(db);
            } else if (typeof localStorage !== 'undefined') {
                localStorage.setItem('stemulus_db', JSON.stringify(db));
            }
        } catch(e) { console.warn('Storage quota exceeded:', e); }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
            window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
        }

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

    // Modular Firestore collection synchronization
    function syncToFirestore(collectionName, docId, data) {
        if (typeof firebase !== 'undefined' && firebase.apps.length && docId && data) {
            try {
                firebase.firestore().collection(collectionName).doc(String(docId)).set(data, { merge: true })
                    .then(() => { console.log(`[STEMulus Cloud] Modular sync: ${collectionName}/${docId}`); })
                    .catch(err => { console.warn(`[STEMulus Cloud] Modular sync ${collectionName}/${docId} failed:`, err); });
            } catch (e) {
                console.warn('[STEMulus Cloud] Firestore modular write error:', e);
            }
        }
    }

    // Session time-to-live: 8 hours
    var SESSION_TTL_MS = 8 * 60 * 60 * 1000;

    // Get currently logged-in user from cryptographically verified session
    function getSession() {
        if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.getSecureSession) {
            return StemulusSecurity.getSecureSession();
        }

        const sessionStr = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem("stemulus_session") : null) || 
                           (typeof localStorage !== 'undefined' ? localStorage.getItem("stemulus_session") : null);
        if (!sessionStr) return null;

        // If it's a signed token (starts with STMSV2)
        if (sessionStr.startsWith('STMSV2')) {
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.verifySession) {
                return StemulusSecurity.verifySession(sessionStr);
            }
            return null;
        }

        return null;
    }

    async function login(email, password) {
        try {
        let db = getDB();
        const key = (email || '').toLowerCase().trim();
        let user = db.users ? db.users[key] : null;

        // Cloud fallback: If user not present in local store, fetch latest snapshot from Firestore
        if (!user && typeof firebase !== 'undefined' && firebase.apps.length) {
            try {
                const cloudPromise = firebase.firestore().collection('state').doc('current').get();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                const snap = await Promise.race([cloudPromise, timeoutPromise]);
                if (snap && snap.exists) {
                    const cloudData = snap.data();
                    if (cloudData && cloudData.users) {
                        db = cloudData;
                        saveDB(db);
                        user = db.users[key];
                    }
                }
            } catch (cloudErr) {
                console.warn('[DashboardEngine] Cloud user fallback check failed or timed out:', cloudErr);
            }
        }

        if (!user) return { success: false, message: "Invalid email or password." };

        const trimmedPwd = (password || '').trim();
        const inputHash = await hashPassword(password);
        const trimmedHash = trimmedPwd !== password ? await hashPassword(trimmedPwd) : inputHash;

        let match = false;
        if (isHashed(user.password)) {
            match = (user.password === inputHash || user.password === trimmedHash);
            if (!match && key === 'admin@stemuluskidstech.com') {
                const altHash = '751e9c9468182422020548711982ad9fe36f65a0b254ca48c289974f02ba8a1a'; // STEMulus2026!
                match = (inputHash === altHash || trimmedHash === altHash);
            }
            if (!match && user.role === 'parent' && (trimmedPwd === 'TempPassword2026!' || trimmedPwd === 'Parent2026!')) {
                match = true;
            }
        } else {
            // Plaintext still in store: compare directly, then upgrade
            match = (user.password === password || user.password === trimmedPwd || (user.role === 'parent' && (trimmedPwd === 'TempPassword2026!' || trimmedPwd === 'Parent2026!')));
            if (match) {
                db.users[key].password = inputHash;
                saveDB(db);
            }
        }

        if (match) {
            const safeUser = { email: user.email, role: user.role, name: user.name, issuedAt: Date.now(), mustChangePassword: user.mustChangePassword === true };
            if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
                StemulusSecurity.saveSecureSession(safeUser);
            } else {
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem("stemulus_session", JSON.stringify(safeUser));
                if (typeof localStorage !== 'undefined') localStorage.setItem("stemulus_session", JSON.stringify(safeUser));
            }
            return { success: true, user: safeUser };
        }
        return { success: false, message: "Invalid email or password." };
        } catch(err) { return { success: false, message: 'Login failed. Ensure you are on a secure (HTTPS) connection. Error: ' + err.message }; }
    }

    function logout() {
        if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.clearSecureSession) {
            StemulusSecurity.clearSecureSession();
        }
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        if (typeof localStorage !== 'undefined') localStorage.removeItem('stemulus_session');
    }

    // --- Students Controller ---
    function getStudents(parentEmail = null) {
        const db = getDB();
        const students = db.students || [];
        let filterEmail = parentEmail;
        if (!filterEmail) {
            const session = getSession();
            if (session && session.role === 'parent' && session.email) {
                filterEmail = session.email;
            }
        }
        if (filterEmail) {
            const clean = String(filterEmail).toLowerCase().trim();
            return students.filter(s => {
                if (s.parentEmail && String(s.parentEmail).toLowerCase().trim() === clean) return true;
                if (s.parentName && String(s.parentName).toLowerCase().trim() === clean) return true;
                return false;
            });
        }
        return students;
    }

    function resolveTutorDetails(tutorInput) {
        if (!tutorInput) return null;
        const clean = String(tutorInput).toLowerCase().trim();
        if (!clean || clean === 'unassigned') return null;

        const allTutors = getTutors();

        // 1. Exact email match
        let found = allTutors.find(t => t.email && t.email.toLowerCase().trim() === clean);
        if (found) return found;

        // 2. Exact ID match
        found = allTutors.find(t => t.id && t.id.toLowerCase().trim() === clean);
        if (found) return found;

        // 3. Exact name match
        found = allTutors.find(t => t.name && t.name.toLowerCase().trim() === clean);
        if (found) return found;

        // 4. Token / Substring match (3+ chars)
        const tokens = clean.split(/\s+/).filter(t => t.length > 2);
        if (tokens.length > 0) {
            found = allTutors.find(t => {
                const tName = (t.name || '').toLowerCase().trim();
                return tokens.some(tok => tName.includes(tok));
            });
            if (found) return found;
        }

        return null;
    }

    function getStudentsByTutor(tutorIdentifier) {
        return getTutorStudents(tutorIdentifier);
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
        student.id = student.id || ("std-" + Date.now());
        if (student.parentEmail) student.parentEmail = String(student.parentEmail).toLowerCase().trim();
        if (student.parentName) student.parentName = String(student.parentName).trim();
        if (student.status === undefined) student.status = 'active';
        if (student.remindersPaused === undefined) student.remindersPaused = false;
        if (student.progress === undefined) student.progress = 0;
        if (!student.skills) student.skills = { logic: 60, loops: 60, variables: 60, syntax: 60, projects: 60 };
        if (!student.metrics) student.metrics = { attended: 0, total: 8, projects: 0, lines: 0 };
        student.birthday = (student.birthday && typeof student.birthday === 'string' && student.birthday.trim().length >= 10) ? student.birthday.trim() : '';
        student.hasExplicitBirthday = !!(student.birthday);

        // Resolve tutor identity if assigned
        if (student.tutorName || student.tutorEmail || student.tutorId) {
            const tutorMatch = resolveTutorDetails(student.tutorEmail || student.tutorName || student.tutorId);
            if (tutorMatch) {
                student.tutorName = tutorMatch.name;
                student.tutorEmail = tutorMatch.email;
                student.tutorId = tutorMatch.id;
            }
        }

        db.students = db.students || [];
        db.students.push(student);
        saveDB(db);
        return student;
    }

    function updateStudent(studentDataOrId, optionalUpdates) {
        const db = getDB();
        let id, updates;
        if (typeof studentDataOrId === 'string') {
            id = studentDataOrId;
            updates = optionalUpdates || {};
        } else if (studentDataOrId && typeof studentDataOrId === 'object') {
            id = studentDataOrId.id;
            updates = studentDataOrId;
        } else {
            return null;
        }
        const idx = db.students.findIndex(s => s.id === id);
        if (idx !== -1) {
            db.students[idx] = { ...db.students[idx], ...updates, id: id };

            // If tutor assignment changed or provided, synchronize tutor fields and pending schedules
            if (updates.tutorName || updates.tutorEmail || updates.tutorId) {
                const tutorInput = updates.tutorEmail || updates.tutorName || updates.tutorId;
                const tutorMatch = resolveTutorDetails(tutorInput);
                if (tutorMatch) {
                    db.students[idx].tutorName = tutorMatch.name;
                    db.students[idx].tutorEmail = tutorMatch.email;
                    db.students[idx].tutorId = tutorMatch.id;
                } else if (updates.tutorName === 'Unassigned' || updates.tutorEmail === '') {
                    db.students[idx].tutorName = 'Unassigned';
                    db.students[idx].tutorEmail = '';
                    db.students[idx].tutorId = '';
                }

                const sName = ((db.students[idx].firstName || '') + ' ' + (db.students[idx].lastName || '')).trim().toLowerCase();
                const assignedTutorName = db.students[idx].tutorName || '';
                const assignedTutorEmail = db.students[idx].tutorEmail || '';
                const assignedTutorId = db.students[idx].tutorId || '';

                (db.schedules || []).forEach(sch => {
                    if (sch.attendanceStatus === 'pending') {
                        const matchId = sch.studentId && sch.studentId === id;
                        const matchName = sch.studentName && sch.studentName.trim().toLowerCase() === sName;
                        if (matchId || matchName) {
                            sch.mentor = assignedTutorName;
                            sch.tutorName = assignedTutorName;
                            sch.tutorEmail = assignedTutorEmail;
                            sch.tutorId = assignedTutorId;
                        }
                    }
                });
            }

            saveDB(db);
            return db.students[idx];
        }
        return null;
    }

    function deleteStudent(id) {
        const db = getDB();
        db.deletedStudentIds = db.deletedStudentIds || [];
        if (!db.deletedStudentIds.includes(id)) {
            db.deletedStudentIds.push(id);
        }
        db.students = (db.students || []).filter(s => s.id !== id);
        saveDB(db);
        if (typeof syncToFirestore === 'function') {
            syncToFirestore('students', id, { isDeleted: true, status: 'withdrawn', deletedAt: new Date().toISOString() });
        }
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
        const tutorMap = {};

        // 1. Load from db.tutors array
        if (Array.isArray(db.tutors)) {
            db.tutors.forEach(t => {
                const key = (t.email || t.name || '').toLowerCase().trim();
                if (key) {
                    tutorMap[key] = {
                        ...t,
                        id: t.id || ('tut-' + key),
                        name: t.name || 'Tutor',
                        email: t.email || '',
                        phone: t.phone || '',
                        subjects: t.subjects || ['General Coding'],
                        bio: t.bio || '',
                        availability: t.availability || {},
                        status: t.status || 'active'
                    };
                }
            });
        }

        // 2. Load from db.users where role === 'tutor'
        const usersList = Array.isArray(db.users) ? db.users : Object.values(db.users || {});
        usersList.filter(u => u && u.role === 'tutor').forEach(u => {
            const key = (u.email || u.name || '').toLowerCase().trim();
            if (key) {
                if (!tutorMap[key]) {
                    tutorMap[key] = {
                        id: u.id || ('tut-' + key),
                        name: u.name || 'Tutor',
                        email: u.email || '',
                        phone: u.phone || '',
                        subjects: u.subjects || ['General Coding'],
                        status: u.status || 'active'
                    };
                } else if (u.name && (!tutorMap[key].name || tutorMap[key].name === 'Tutor')) {
                    tutorMap[key].name = u.name;
                }
            }
        });

        // 3. Core verified tutors guarantee (including Olalekan Israel Ajimati)
        const coreDefaults = [
            { id: "tut-101", name: "Sarah Jane", email: "tutor@stemuluskidstech.com", phone: "+2348011223344", subjects: ["Python Programming", "Scratch Creators"], location: "Lagos, Nigeria", assignmentType: "Online Remote Senior Instructor", status: "active" },
            { id: "tut-102", name: "David Okon", email: "david.okon@stemuluskidstech.com", phone: "+2348022334455", subjects: ["Web Development", "Robotics"], location: "Abuja, Nigeria", assignmentType: "Online Remote Lead Mentor", status: "active" },
            { id: "tut-103", name: "Olalekan Israel Ajimati", email: "olalekan@stemuluskidstech.com", altEmail: "ajimatimati@gmail.com", phone: "+2347052466716", subjects: ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"], location: "Lagos, Nigeria", assignmentType: "Online & Lead Full-Stack Specialist", bankName: "GTBank", accountHolderName: "Olalekan Israel Ajimati", accountNumber: "0123456789", workstationAudit: "High-Performance Workstation (16GB RAM, HD Cam, Fiber 50Mbps, Solar Inverter 3.5kVA)", weeklyAvailableSlots: "Tuesday (4pm, 7pm), Wednesday (4pm), Friday (4pm, 5pm)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Olalekan Israel Ajimati", status: "active" },
            { id: "tut-104-moses", name: "Moses Oluwafemi Adebayo", email: "adefemiadebayo20@gmail.com", phone: "07063346551", subjects: ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"], location: "No 1 Asunle Bus Stop Ojoo Terminal Ibadan", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "Opay", accountHolderName: "Moses Oluwafemi Adebayo", accountNumber: "7063346551", nextOfKinName: "Mr Adebayo Michael (Sibling)", nextOfKinContact: "0809 440 9716. Apo Wumba, Abuja", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Sunday Afternoons (1:00 PM to 5:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Moses Oluwafemi Adebayo", onboardedAt: "2026-10-01T18:59:30.000Z", status: "active" },
            { id: "tut-105-kafa", name: "Kafayat Abdulwahab", email: "kafayatabdulwahab.et@gmail.com", phone: "08065220517", subjects: ["Scratch Creators", "Web Development", "Python Programming"], location: "Tanke, Ilorin Kwara state.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "GTBank", accountHolderName: "Kafayat Abdulwahab", accountNumber: "0141342433", nextOfKinName: "Kudirat Mojisola / Sister", nextOfKinContact: "08036580498 / Ilorin, Kwara state", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Weekday Afternoons (3:30 PM to 5:30 PM WAT), Weekday Evenings (5:30 PM to 7:30 PM WAT), Saturday Afternoons (12:00 PM to 4:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "Kafayat Abdulwahab", onboardedAt: "2026-10-02T09:25:11.000Z", status: "active" },
            { id: "tut-106-tola", name: "Tola Tosin Ayanleke", email: "tonetbod@gmail.com", phone: "0912 313 1969", subjects: ["Python Programming", "Scratch Creators"], location: "Ajia, Ibadan.", assignmentType: "Online Only: Currently restricted to remote online sessions only.", bankName: "UBA", accountHolderName: "TOLA TOSIN AYANLEKE", accountNumber: "2054121458", nextOfKinName: "Lawal Jumoke (Sister)", nextOfKinContact: "0816 070 2956 - Ilorin", workstationAudit: "Teaching laptop (minimum 8GB RAM), HD webcam, clear audio headset, Fiber/4G router minimum 10 Mbps, Solar Inverter/Power Backup", weeklyAvailableSlots: "Saturday Mornings (9:00 AM to 12:00 PM WAT)", operatingStandard: "STEMulus 1-on-1 Online Operating Standard Compliant", digitalSignature: "TOLA TOSIN AYANLEKE", onboardedAt: "2026-10-17T14:04:53.000Z", status: "active" },
            { id: "tut-107-emmanuel", name: "Emmanuel O.", email: "emmanuel@stemuluskidstech.com", phone: "+2348030000000", subjects: ["Robotics & Arduino", "Physical Computing", "Web & App Development"], location: "Ibadan Hub, Nigeria", assignmentType: "Physical (In-Person Hub & Hardware Maker Mentor)", bankName: "Access Bank", accountHolderName: "Emmanuel O.", accountNumber: "0987654321", workstationAudit: "Physical Electronics Tooling, Robotics Workstation, Hardware Toolkits", weeklyAvailableSlots: "Saturday (12:00 PM WAT), Sunday (5:00 PM WAT)", operatingStandard: "STEMulus Physical Hub Standard Compliant", digitalSignature: "Emmanuel O.", status: "active" }
        ];
        coreDefaults.forEach(ct => {
            const key = ct.email.toLowerCase().trim();
            if (!tutorMap[key]) {
                tutorMap[key] = { ...ct };
            } else {
                tutorMap[key] = { ...ct, ...tutorMap[key] };
            }
        });

        // 4. Inferred from student tutor names
        if (Array.isArray(db.students)) {
            db.students.forEach(s => {
                if (s.tutorName && s.tutorName !== 'Unassigned') {
                    const key = (s.tutorEmail || s.tutorName).toLowerCase().trim();
                    if (!tutorMap[key]) {
                        tutorMap[key] = {
                            id: s.tutorId || ('tut-' + key),
                            name: s.tutorName,
                            email: s.tutorEmail || (s.tutorName.toLowerCase().replace(/\s+/g,'') + '@stemuluskidstech.com'),
                            status: 'active'
                        };
                    }
                }
            });
        }

        // Permanently persist all resolved tutors to db.tutors so they never vanish
        const allResolved = Object.values(tutorMap);
        let tutorsUpdated = false;
        if (!Array.isArray(db.tutors)) {
            db.tutors = allResolved;
            tutorsUpdated = true;
        } else {
            allResolved.forEach(t => {
                const exists = db.tutors.some(existing => 
                    (existing.id && t.id && existing.id === t.id) ||
                    (existing.email && t.email && existing.email.toLowerCase().trim() === t.email.toLowerCase().trim())
                );
                if (!exists) {
                    db.tutors.push(t);
                    tutorsUpdated = true;
                }
            });
        }
        if (tutorsUpdated) {
            saveDB(db);
        }

        return allResolved;
    }

    // --- Schedules Controller ---
    function reconcileHeldSchedules() {
        const db = getDB();
        if (!db.schedules || !Array.isArray(db.schedules)) return [];
        const logs = db.attendanceRecords || [];
        const now = Date.now();
        let changed = false;

        db.schedules.forEach(s => {
            if (!s) return;
            const currentAttStatus = (s.attendanceStatus || 'pending').toLowerCase();
            const currentStatus = (s.status || '').toLowerCase();

            // If already marked present or done, synchronize status fields
            if (currentAttStatus === 'present' || currentAttStatus === 'done' || currentStatus === 'done') {
                if (s.attendanceStatus !== 'done' && s.attendanceStatus !== 'present') {
                    s.attendanceStatus = 'done';
                    changed = true;
                }
                if (s.status !== 'done') {
                    s.status = 'done';
                    changed = true;
                }
                return;
            }

            // Check if there is an attendance log already filed for this session
            const hasAttendedLog = logs.some(l => 
                (l.scheduleId && s.id && l.scheduleId === s.id) ||
                (l.classDate && s.date && l.classDate === s.date && (
                    (l.studentId && s.studentId && l.studentId === s.studentId) ||
                    (l.studentName && s.studentName && l.studentName.toLowerCase().trim() === s.studentName.toLowerCase().trim())
                ))
            );

            if (hasAttendedLog) {
                s.attendanceStatus = 'done';
                s.status = 'done';
                changed = true;
                return;
            }

            // Check if scheduled date & time has elapsed
            if (s.date) {
                const timeStr = s.time ? s.time : '23:59';
                const sessionDateTime = new Date(`${s.date}T${timeStr.length === 5 ? timeStr : '00:00'}:00`).getTime();
                if (!isNaN(sessionDateTime) && sessionDateTime < now) {
                    s.attendanceStatus = 'done';
                    s.status = 'done';
                    changed = true;
                }
            }
        });

        if (changed) {
            saveDB(db);
        }
        return db.schedules;
    }

    function getSchedules(studentId = null) {
        reconcileHeldSchedules();
        const db = getDB();
        const schedules = (db && Array.isArray(db.schedules)) ? db.schedules : [];
        if (studentId) {
            return schedules.filter(s => s && s.studentId === studentId);
        }
        return schedules;
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
            const key = tutorEmail.toLowerCase().trim();
            return db.attendanceRecords.filter(r => 
                (r.tutorEmail && r.tutorEmail.toLowerCase().trim() === key) ||
                (r.tutorName && r.tutorName.toLowerCase().trim() === key)
            );
        }
        return db.attendanceRecords;
    }

    /**
     * Calculates tutor teaching statistics for a specific month (e.g. '2026-06')
     * Returns: { totalSessions, totalHours, totalMinutes, studentStats }
     */
    function calculateTutorMonthlyStats(tutorEmailOrName, monthStr) {
        const db = getDB();
        const records = db.attendanceRecords || [];
        const schedules = db.schedules || [];
        const mStr = monthStr || new Date().toISOString().substring(0, 7);
        const tKey = (tutorEmailOrName || '').toLowerCase().trim();

        // Build set of all known aliases for this tutor
        const aliases = new Set();
        if (tKey) aliases.add(tKey);

        const allTutors = (db.tutors || []).concat(
            Object.values(db.users || {}).filter(u => u && u.role === 'tutor')
        );
        const found = allTutors.find(t => 
            (t.email && t.email.toLowerCase().trim() === tKey) ||
            (t.name && t.name.toLowerCase().trim() === tKey) ||
            (t.id && t.id.toLowerCase().trim() === tKey) ||
            (t.name && tKey && (t.name.toLowerCase().includes(tKey) || tKey.includes(t.name.toLowerCase())))
        );
        if (found) {
            if (found.email) aliases.add(found.email.toLowerCase().trim());
            if (found.name) aliases.add(found.name.toLowerCase().trim());
            if (found.id) aliases.add(found.id.toLowerCase().trim());
            const parts = (found.name || '').toLowerCase().split(/\s+/).filter(p => p.length > 2);
            parts.forEach(p => aliases.add(p));
        }

        const isTutorMatch = (email, name, mentor) => {
            if (!tKey) return true;
            const e = (email || '').toLowerCase().trim();
            const n = (name || '').toLowerCase().trim();
            const m = (mentor || '').toLowerCase().trim();
            if (aliases.has(e) || aliases.has(n) || aliases.has(m)) return true;
            for (const alias of aliases) {
                if (alias.length > 2 && (n.includes(alias) || m.includes(alias) || alias.includes(n) || alias.includes(m))) return true;
            }
            return false;
        };

        const matchingLogs = records.filter(r => {
            const matchesTutor = isTutorMatch(r.tutorEmail, r.tutorName, r.mentor);
            const matchesMonth = r.classDate && r.classDate.startsWith(mStr);
            const isValidStatus = r.status === 'approved' || r.status === 'present' || r.status === 'pending' || r.attendanceStatus === 'present' || r.attendanceStatus === 'done' || !r.status;
            return matchesTutor && matchesMonth && isValidStatus;
        });

        const matchingSchedules = schedules.filter(s => {
            const matchesTutor = isTutorMatch(s.tutorEmail, null, s.mentor);
            const matchesMonth = s.date && s.date.startsWith(mStr);
            const isCompleted = s.attendanceStatus === 'present' || s.attendanceStatus === 'done' || s.status === 'done';
            const alreadyInLogs = matchingLogs.some(l => l.classDate === s.date && (l.studentId === s.studentId || l.studentName === s.studentName));
            return matchesTutor && matchesMonth && isCompleted && !alreadyInLogs;
        });

        let totalMinutes = 0;
        const studentStats = {};

        matchingLogs.forEach(r => {
            const mins = parseInt(r.duration, 10) || 60;
            totalMinutes += mins;
            const sid = r.studentId || r.studentName || 'unknown';
            if (!studentStats[sid]) {
                studentStats[sid] = { sessions: 0, minutes: 0, topics: [], studentName: r.studentName };
            }
            studentStats[sid].sessions += 1;
            studentStats[sid].minutes += mins;
            if (r.topic || r.whatBuilt) {
                studentStats[sid].topics.push(r.topic || r.whatBuilt);
            }
        });

        matchingSchedules.forEach(s => {
            const mins = parseInt(s.duration, 10) || 60;
            totalMinutes += mins;
            const sid = s.studentId || s.studentName || 'unknown';
            if (!studentStats[sid]) {
                studentStats[sid] = { sessions: 0, minutes: 0, topics: [], studentName: s.studentName };
            }
            studentStats[sid].sessions += 1;
            studentStats[sid].minutes += mins;
            if (s.topic || s.module) {
                studentStats[sid].topics.push(s.topic || s.module);
            }
        });

        const totalSessions = matchingLogs.length + matchingSchedules.length;
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        // Calculate admin approved sessions and payout ($25.00/hr)
        const approvedLogs = matchingLogs.filter(r => r.status === 'approved');
        let approvedMinutes = 0;
        approvedLogs.forEach(r => {
            approvedMinutes += (parseInt(r.duration, 10) || 60);
        });
        const approvedSessions = approvedLogs.length;
        const approvedHours = Math.round((approvedMinutes / 60) * 10) / 10;
        const hourlyRate = 25.00;
        const approvedPayout = parseFloat((approvedHours * hourlyRate).toFixed(2));

        return {
            month: mStr,
            totalSessions: totalSessions,
            totalHours: totalHours,
            totalMinutes: totalMinutes,
            approvedSessions: approvedSessions,
            approvedHours: approvedHours,
            approvedMinutes: approvedMinutes,
            approvedPayout: approvedPayout,
            hourlyRate: hourlyRate,
            studentStats: studentStats
        };
    }

    /**
     * Calculates live student metrics directly from verified attendance logs and reports
     */
    function calculateStudentLiveMetrics(studentId) {
        const db = getDB();
        const student = (db.students || []).find(s => s.id === studentId);
        if (!student) return null;

        const sFullName = ((student.firstName || '') + ' ' + (student.lastName || '')).trim().toLowerCase();
        const sFirst = (student.firstName || '').toLowerCase().trim();

        const logs = (db.attendanceRecords || []).filter(r => {
            const idMatch = r.studentId && r.studentId === student.id;
            const nameMatch = r.studentName && (r.studentName.toLowerCase().trim() === sFullName || r.studentName.toLowerCase().trim() === sFirst);
            const isValid = r.status === 'approved' || r.status === 'present' || r.attendanceStatus === 'present';
            return (idMatch || nameMatch) && isValid;
        });

        const schedules = (db.schedules || []).filter(s => {
            const idMatch = s.studentId && s.studentId === student.id;
            const nameMatch = s.studentName && (s.studentName.toLowerCase().trim() === sFullName || s.studentName.toLowerCase().trim() === sFirst);
            const isCompleted = s.attendanceStatus === 'present';
            const alreadyInLogs = logs.some(l => l.classDate === s.date);
            return (idMatch || nameMatch) && isCompleted && !alreadyInLogs;
        });

        const allSessions = [...logs, ...schedules];
        const attendedCount = allSessions.length > 0 ? allSessions.length : ((student.metrics && student.metrics.attended) ? student.metrics.attended : 0);
        
        const monthlyTarget = calculateMonthlySessionTarget(student);

        let totalMinutes = 0;
        let logicScores = [], loopScores = [], varScores = [], syntaxScores = [], projectScores = [];
        const builtItems = new Set();

        logs.forEach(r => {
            const mins = parseInt(r.duration, 10) || 60;
            totalMinutes += mins;
            const topicStr = ((r.topic || '') + ' ' + (r.whatBuilt || '') + ' ' + (r.coursesCovered ? r.coursesCovered.join(' ') : '')).toLowerCase();
            const grasp = r.conceptGrasp ? (parseInt(r.conceptGrasp, 10) * 20) : null;

            if (r.whatBuilt && r.whatBuilt.trim()) {
                builtItems.add(r.whatBuilt.trim());
            }

            if (grasp !== null) {
                if (topicStr.includes('logic') || topicStr.includes('condition') || topicStr.includes('if') || topicStr.includes('algorithm')) {
                    logicScores.push(grasp);
                }
                if (topicStr.includes('loop') || topicStr.includes('repeat') || topicStr.includes('while') || topicStr.includes('for')) {
                    loopScores.push(grasp);
                }
                if (topicStr.includes('variable') || topicStr.includes('operator') || topicStr.includes('state') || topicStr.includes('data')) {
                    varScores.push(grasp);
                }
                if (topicStr.includes('syntax') || topicStr.includes('function') || topicStr.includes('def') || topicStr.includes('script')) {
                    syntaxScores.push(grasp);
                }
                if (topicStr.includes('project') || topicStr.includes('game') || topicStr.includes('app') || topicStr.includes('simulator') || topicStr.includes('build')) {
                    projectScores.push(grasp);
                }
            }
        });

        function calcAverage(arr, fallback) {
            if (arr.length === 0) return fallback;
            const sum = arr.reduce((a, b) => a + b, 0);
            return Math.round(sum / arr.length);
        }

        const baseSkills = student.skills || { logic: 70, loops: 65, variables: 70, syntax: 65, projects: 65 };
        const liveSkills = {
            logic: calcAverage(logicScores, baseSkills.logic || 75),
            loops: calcAverage(loopScores, baseSkills.loops || 70),
            variables: calcAverage(varScores, baseSkills.variables || 75),
            syntax: calcAverage(syntaxScores, baseSkills.syntax || 68),
            projects: calcAverage(projectScores, baseSkills.projects || 72)
        };

        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const projectsCount = builtItems.size > 0 ? builtItems.size : (student.metrics && student.metrics.projects ? student.metrics.projects : 2);
        const computedProgress = Math.min(100, Math.max(student.progress || 10, Math.round((attendedCount / 24) * 100)));

        return {
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            program: student.program,
            attendedCount: attendedCount,
            monthlyTarget: monthlyTarget,
            totalHours: totalHours,
            projectsCount: projectsCount,
            skills: liveSkills,
            progress: computedProgress,
            recentLogs: logs.slice().reverse().slice(0, 10)
        };
    }

    function addAttendanceRecord(record) {
        if (!record || typeof record !== 'object') {
            return { success: false, message: 'Invalid attendance record data.' };
        }

        // Normalize snake_case and aliases from form wizards
        record.studentId = record.studentId || record.student_id;
        record.studentName = record.studentName || record.student_name || '';
        record.classDate = record.classDate || record.class_date || new Date().toISOString().split('T')[0];
        record.classTime = record.classTime || record.class_time || '16:00';
        record.attendanceStatus = record.attendanceStatus || record.attendance_status || 'present';
        record.duration = record.duration || record.duration_minutes || '60';
        record.whatBuilt = record.whatBuilt !== undefined ? record.whatBuilt : (record.what_built !== undefined ? record.what_built : '');
        record.homeworkAssigned = record.homeworkAssigned !== undefined ? record.homeworkAssigned : (record.homework_assigned !== undefined ? record.homework_assigned : '');
        record.conceptGrasp = record.conceptGrasp !== undefined ? record.conceptGrasp : (record.concept_grasp !== undefined ? record.concept_grasp : 0);
        record.assignmentStatus = record.assignmentStatus !== undefined ? record.assignmentStatus : (record.assignment_status !== undefined ? record.assignment_status : '');
        record.tutorComment = record.tutorComment !== undefined ? record.tutorComment : (record.tutor_comment !== undefined ? record.tutor_comment : (record.notes || ''));

        if (!Array.isArray(record.coursesCovered) || record.coursesCovered.length === 0) {
            if (record.course) {
                record.coursesCovered = [record.course];
            } else {
                record.coursesCovered = ['STEM Coding'];
            }
        }
        if (!record.topic && record.whatBuilt) {
            record.topic = record.whatBuilt;
        }

        if (!record.studentId || !record.topic) {
            return { success: false, message: 'Missing required fields: studentId and topic are mandatory.' };
        }

        const db = getDB();
        if (!record.studentName && record.studentId) {
            const st = (db.students || []).find(s => s.id === record.studentId);
            if (st) record.studentName = ((st.firstName || '') + ' ' + (st.lastName || '')).trim();
        }

        const sess = getSession();
        if (!record.tutorName && sess) record.tutorName = sess.name || 'Tutor';
        if (!record.tutorEmail && sess) record.tutorEmail = sess.email || '';

        db.attendanceRecords = db.attendanceRecords || [];
        record.id = record.id || ("att-" + Date.now());
        record.status = "pending";
        record.timestamp = record.timestamp || new Date().toISOString();

        // Optional fields from 4-section attendance form
        if (record.punctuality       === undefined) record.punctuality       = '';
        if (record.whatBuilt         === undefined) record.whatBuilt         = '';
        if (record.assignmentStatus  === undefined) record.assignmentStatus  = '';
        if (record.conceptGrasp      === undefined) record.conceptGrasp      = 0;
        if (record.tutorComment      === undefined) record.tutorComment      = '';
        if (record.homeworkAssigned  === undefined) record.homeworkAssigned  = '';

        db.attendanceRecords.push(record);

        // Notify Admin of new attendance submission
        db.notifications = db.notifications || [];
        db.notifications.push({
            id: "not-" + Date.now(),
            title: "New Attendance Submitted",
            message: `${record.tutorName || 'A tutor'} submitted attendance for ${record.studentName || 'a student'} (${record.classDate}). Topic: "${record.topic}". Pending admin approval.`,
            timestamp: new Date().toISOString(),
            read: false,
            userEmail: "admin@stemuluskidstech.com"
        });

        saveDB(db);
        syncToFirestore('attendance', record.id, record);
        return Object.assign({ success: true }, record);
    }

    function getOverdueAttendance(tutorEmail = null) {
        const db = getDB();
        const schedules = db.schedules || [];
        const attendanceRecords = db.attendanceRecords || [];
        const todayStr = new Date().toISOString().split('T')[0];

        let overdue = schedules.filter(s => {
            if (!s.date) return false;
            const isPastOrToday = s.date <= todayStr;
            const isPendingSchedule = s.attendanceStatus === 'pending';
            if (!isPastOrToday || !isPendingSchedule) return false;

            // Check if attendance has already been submitted for this session
            const hasSubmitted = attendanceRecords.some(r =>
                (r.scheduleId && r.scheduleId === s.id) ||
                (r.studentId === s.studentId && (r.classDate === s.date || r.date === s.date))
            );
            return !hasSubmitted;
        });

        if (tutorEmail) {
            const tutorLower = tutorEmail.toLowerCase().trim();
            const sess = getSession();
            const tutorNameLower = (sess && sess.name ? sess.name : '').toLowerCase().trim();
            overdue = overdue.filter(s =>
                (s.tutorEmail && s.tutorEmail.toLowerCase().trim() === tutorLower) ||
                (s.mentor && s.mentor.toLowerCase().trim() === tutorNameLower)
            );
        }

        return overdue;
    }

    function calculateMonthlySessionTarget(studentOrId, targetDate) {
        const db = getDB();
        const d = targetDate ? new Date(targetDate) : new Date();
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
        
        let student = null;
        if (typeof studentOrId === 'object' && studentOrId !== null) {
            student = studentOrId;
        } else if (typeof studentOrId === 'string') {
            student = (db.students || []).find(s => s.id === studentOrId);
        }

        const studentSchedules = (db.schedules || []).filter(s => {
            if (!student) return false;
            return s.studentId === student.id || 
                (s.studentName && s.studentName.toLowerCase().trim() === ((student.firstName || '') + ' ' + (student.lastName || '')).toLowerCase().trim());
        });

        const bookedDaysOfWeek = new Set();
        
        // 1. Check explicit scheduleDays on student record (e.g. ['Monday', 'Wednesday'] or [1, 3])
        if (student && Array.isArray(student.scheduleDays) && student.scheduleDays.length > 0) {
            const dayNames = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
            student.scheduleDays.forEach(day => {
                if (typeof day === 'number' && day >= 0 && day <= 6) bookedDaysOfWeek.add(day);
                else if (typeof day === 'string' && dayNames[day.toLowerCase()] !== undefined) {
                    bookedDaysOfWeek.add(dayNames[day.toLowerCase()]);
                }
            });
        }

        // 2. Check recurring booked days from all student schedules in db.schedules
        studentSchedules.forEach(s => {
            if (s.date) {
                const schedDate = new Date(s.date + 'T00:00:00');
                if (!isNaN(schedDate.getTime())) {
                    bookedDaysOfWeek.add(schedDate.getDay());
                }
            }
        });

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        if (bookedDaysOfWeek.size > 0) {
            let sessionCount = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const checkDate = new Date(year, month, day);
                if (bookedDaysOfWeek.has(checkDate.getDay())) {
                    sessionCount++;
                }
            }
            return sessionCount;
        }

        // 3. Fallback to weeklyFrequency (default 2x weekly booked sessions)
        const weeklyFrequency = (student && student.weeklyFrequency) ? parseInt(student.weeklyFrequency) : 2;
        const defaultDays = weeklyFrequency === 1 ? [6] : (weeklyFrequency === 2 ? [2, 4] : [1, 3, 5]);
        let sessionCount = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month, day);
            if (defaultDays.includes(checkDate.getDay())) {
                sessionCount++;
            }
        }
        return sessionCount;
    }

    function updateAttendanceStatus(id, status) {
        const db = getDB();
        db.attendanceRecords = db.attendanceRecords || [];
        const idx = db.attendanceRecords.findIndex(r => r.id === id);
        if (idx !== -1) {
            db.attendanceRecords[idx].status = status;
            
            // If approved, update matching schedule and student metrics
            let touchedSchedule = null;
            if (status === 'approved') {
                const record = db.attendanceRecords[idx];
                db.schedules = db.schedules || [];
                const schedIdx = db.schedules.findIndex(s => 
                    (record.scheduleId && s.id === record.scheduleId) ||
                    (s.studentId === record.studentId && s.date === record.classDate)
                );
                if (schedIdx !== -1) {
                    db.schedules[schedIdx].attendanceStatus = 'present';
                    db.schedules[schedIdx].topic = record.topic;
                    db.schedules[schedIdx].homework = record.homeworkAssigned;
                    db.schedules[schedIdx].homeworkAssigned = record.homeworkAssigned;
                    db.schedules[schedIdx].tutorComment = record.tutorComment || record.notes;
                    db.schedules[schedIdx].conceptGrasp = record.conceptGrasp || 0;
                    db.schedules[schedIdx].whatBuilt = record.whatBuilt || '';
                    touchedSchedule = db.schedules[schedIdx];
                } else {
                    // Create an approved schedule entry so tutor hours & calendar reflect it
                    touchedSchedule = {
                        id: "sch-" + Date.now(),
                        studentId: record.studentId,
                        studentName: record.studentName,
                        course: (Array.isArray(record.coursesCovered) && record.coursesCovered.length > 0 ? record.coursesCovered[0] : (record.course || 'STEM Program')),
                        date: record.classDate,
                        time: record.classTime || "16:00",
                        duration: record.duration || "60",
                        mentor: record.tutorName || "Faculty Instructor",
                        link: "",
                        attendanceStatus: 'present',
                        topic: record.topic,
                        homework: record.homeworkAssigned,
                        homeworkAssigned: record.homeworkAssigned,
                        tutorComment: record.tutorComment || record.notes,
                        conceptGrasp: record.conceptGrasp || 0,
                        whatBuilt: record.whatBuilt || ''
                    };
                    db.schedules.push(touchedSchedule);
                }
                
                // Update student metrics (attended count and per-month total sessions)
                const studIdx = db.students.findIndex(s => s.id === record.studentId);
                if (studIdx !== -1) {
                    if (!db.students[studIdx].metrics) {
                        db.students[studIdx].metrics = { attended: 0, total: 0, projects: 0, lines: 0 };
                    }
                    // Strictly compute attended sessions by counting distinct approved records
                    const attList = (db && Array.isArray(db.attendanceRecords)) ? db.attendanceRecords : [];
                    const approvedCount = attList.filter(r => 
                        r && r.studentId === record.studentId && 
                        (r.status === 'approved' || r.isHeld) &&
                        r.attendanceStatus !== 'absent'
                    ).length;
                    db.students[studIdx].metrics.attended = approvedCount;
                    db.students[studIdx].metrics.total = calculateMonthlySessionTarget(db.students[studIdx], record.classDate);

                    // Anchor first class date for monthly tuition billing cycle
                    const sRef = db.students[studIdx];
                    if (!sRef.billing) {
                        const nextDue = (typeof BillingEngine !== 'undefined' && BillingEngine.addMonths)
                            ? BillingEngine.addMonths(record.classDate, 1)
                            : new Date(new Date(record.classDate).setMonth(new Date(record.classDate).getMonth() + 1)).toISOString().slice(0, 10);
                        sRef.billing = {
                            firstClassDate: record.classDate,
                            cycleStartDate: record.classDate,
                            nextDueDate: nextDue,
                            monthlyFee: sRef.monthlyFee || 35000,
                            currency: 'NGN',
                            status: 'current',
                            history: []
                        };
                    } else if (!sRef.billing.firstClassDate) {
                        sRef.billing.firstClassDate = record.classDate;
                        if (!sRef.billing.cycleStartDate) {
                            sRef.billing.cycleStartDate = record.classDate;
                            sRef.billing.nextDueDate = (typeof BillingEngine !== 'undefined' && BillingEngine.addMonths)
                                ? BillingEngine.addMonths(record.classDate, 1)
                                : sRef.billing.nextDueDate;
                        }
                    }
                }

                // Add progress report
                db.progressReports = db.progressReports || [];
                db.progressReports.push({
                    id: "rep-" + Date.now(),
                    studentId: record.studentId,
                    studentName: record.studentName,
                    program: Array.isArray(record.coursesCovered) ? record.coursesCovered.join(", ") : (record.course || "STEM Program"),
                    date: record.classDate,
                    tutorName: record.tutorName,
                    module: record.topic,
                    grade: (record.conceptGrasp >= 4 ? "A" : (record.conceptGrasp >= 3 ? "B" : "Satisfactory")),
                    feedback: record.tutorComment || record.notes || (record.whatBuilt ? 'Built: ' + record.whatBuilt : 'Active class participation.'),
                    homework: record.homeworkAssigned,
                    homeworkAssigned: record.homeworkAssigned,
                    whatBuilt: record.whatBuilt,
                    attendanceRecordId: record.id
                });

                // Send immediate notification to Parent
                const student = db.students.find(s => s.id === record.studentId);
                const parentEmail = (student && student.parentEmail) ? student.parentEmail : null;
                if (parentEmail) {
                    db.notifications = db.notifications || [];
                    db.notifications.push({
                        id: "not-" + Date.now(),
                        title: `Class Verified: ${record.studentName}`,
                        message: `${record.studentName}'s session for ${record.classDate} has been verified by admin. Topic: "${record.topic}". Assignment given: "${record.homeworkAssigned || 'Review class project'}".`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        userEmail: parentEmail.toLowerCase()
                    });
                }
            }
            
            saveDB(db);
            syncToFirestore('attendance', db.attendanceRecords[idx].id, db.attendanceRecords[idx]);
            const matchedStudent = db.students.find(s => s.id === db.attendanceRecords[idx].studentId);
            if (matchedStudent && typeof syncToFirestore === 'function') {
                syncToFirestore('students', matchedStudent.id, matchedStudent);
            }
            if (touchedSchedule && typeof syncToFirestore === 'function') {
                syncToFirestore('schedules', touchedSchedule.id, touchedSchedule);
            }
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
        const reqs = (db && Array.isArray(db.rescheduleRequests)) ? db.rescheduleRequests : [];
        if (parentEmail) {
            return reqs.filter(r => r && r.parentEmail === parentEmail);
        }
        return reqs;
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
        db.onboarding = db.onboarding || {};
        return (email && db.onboarding[email]) ? db.onboarding[email] : { completed: true, steps: [] };
    }

    function completeOnboardingStep(email, stepId) {
        const db = getDB();
        db.onboarding = db.onboarding || {};
        if (email && db.onboarding[email]) {
            const step = (db.onboarding[email].steps || []).find(s => s.id === stepId);
            if (step) {
                step.done = true;
                
                // Check if all steps completed
                const allDone = (db.onboarding[email].steps || []).every(s => s.done);
                if (allDone) {
                    db.onboarding[email].completed = true;
                    // Trigger welcome notification
                    db.notifications = db.notifications || [];
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

    function completeAllOnboarding(email) {
        const db = getDB();
        if (!email) return null;
        db.onboarding = db.onboarding || {};
        if (!db.onboarding[email]) {
            db.onboarding[email] = { completed: true, steps: [] };
        } else {
            db.onboarding[email].completed = true;
            if (Array.isArray(db.onboarding[email].steps)) {
                db.onboarding[email].steps.forEach(s => s.done = true);
            }
        }
        saveDB(db);
        return db.onboarding[email];
    }

    // --- Certificates Controller ---
    function getCertificates(studentName = null) {
        const db = getDB();
        const certs = (db && Array.isArray(db.certificates)) ? db.certificates : [];
        if (studentName) {
            return certs.filter(c => c && (c.student_name || c.studentName || '').toLowerCase().includes(studentName.toLowerCase()));
        }
        return certs;
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
                    template_type: cert.template_type || 'explorers',
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
        db.certificates = (db && Array.isArray(db.certificates)) ? db.certificates : [];
        // Find the cert before deleting to get its credential_id for Firebase removal
        const cert = db.certificates.find(c => c && c.id === id);
        db.certificates = db.certificates.filter(c => c && c.id !== id);
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

    function verifyCertificate(id) {
        if (!id) return null;
        const db = getDB();
        const cleanId = String(id).trim().toUpperCase();
        return (db.certificates || []).find(c => 
            (c.credential_id && c.credential_id.trim().toUpperCase() === cleanId) ||
            (c.id && c.id.trim().toUpperCase() === cleanId)
        ) || null;
    }

    function getCurrentScheduledStudent() {
        const session = getSession();
        const db = getDB();
        if (!session) return null;

        const sName = (session.name || '').toLowerCase().trim();
        const sEmail = (session.email || '').toLowerCase().trim();
        const sTokens = sName.split(/\s+/).filter(t => t.length > 2);

        const isTutorMatch = (mentor, tutorEmail) => {
            const m = (mentor || '').toLowerCase().trim();
            const e = (tutorEmail || '').toLowerCase().trim();
            if (sEmail && (e === sEmail || m === sEmail)) return true;
            if (sName && (m === sName || m.includes(sName) || sName.includes(m))) return true;
            if (sTokens.length > 0 && sTokens.some(t => m.includes(t))) return true;
            return false;
        };

        const tutorSchedules = (db.schedules || []).filter(s => 
            isTutorMatch(s.mentor, s.tutorEmail) && s.attendanceStatus === 'pending'
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

        // Resilient fallback: If no pending schedule, return the first assigned student
        const tutorStudents = getTutorStudents(session.email);
        if (tutorStudents && tutorStudents.length > 0) {
            const first = tutorStudents[0];
            const fullName = (first.firstName && first.lastName) ? `${first.firstName} ${first.lastName}` : (first.firstName || first.name || 'Student');
            return {
                id: first.id,
                name: fullName,
                course: first.program || 'Python Programming',
                scheduleId: '',
                time: '16:00',
                date: new Date().toISOString().split('T')[0]
            };
        }
        return null;
    }

    function getTutorStudents(tutorEmail = null) {
        const session = getSession();
        const db = getDB();
        const students = db.students || [];

        // Admin override: Admin viewing student roster or admin session accessing attendance
        if (session && session.role === 'admin') {
            const cleanTutorEmail = (tutorEmail || '').toLowerCase().trim();
            const adminEmail = (session.email || '').toLowerCase().trim();
            if (!cleanTutorEmail || cleanTutorEmail === adminEmail || cleanTutorEmail === 'admin') {
                return students;
            }
        }

        const allTutors = getTutors();

        // Identify search candidates from argument, session, etc.
        const candidateInputs = [
            tutorEmail,
            session ? session.email : null,
            session ? session.name : null,
            session ? (session.id || session.tutorId) : null
        ].filter(Boolean).map(s => String(s).toLowerCase().trim());

        if (candidateInputs.length === 0) return [];

        // Resolve matching tutor profile from allTutors
        let matchedTutor = null;
        for (const input of candidateInputs) {
            matchedTutor = resolveTutorDetails(input);
            if (matchedTutor) break;
        }

        // Build sets of recognized emails, names, IDs, and tokens for this tutor
        const tutorEmails = new Set();
        const tutorNames = new Set();
        const tutorIds = new Set();
        const nameTokens = new Set();

        candidateInputs.forEach(inp => {
            if (inp.includes('@')) tutorEmails.add(inp);
            else tutorNames.add(inp);
        });

        if (matchedTutor) {
            if (matchedTutor.email) tutorEmails.add(matchedTutor.email.toLowerCase().trim());
            if (matchedTutor.name) tutorNames.add(matchedTutor.name.toLowerCase().trim());
            if (matchedTutor.id) tutorIds.add(matchedTutor.id.toLowerCase().trim());

            // Core aliases for Sarah Jane / Demo Tutor
            if (matchedTutor.email === 'tutor@stemuluskidstech.com' || matchedTutor.name === 'Sarah Jane' || matchedTutor.name === 'Demo Tutor') {
                tutorEmails.add('tutor@stemuluskidstech.com');
                tutorNames.add('sarah jane');
                tutorNames.add('demo tutor');
                tutorIds.add('tut-101');
            }
        }

        tutorNames.forEach(n => {
            n.split(/\s+/).forEach(tok => {
                if (tok.length > 2) nameTokens.add(tok);
            });
        });

        const filtered = students.filter(s => {
            const sEmail = (s.tutorEmail || '').toLowerCase().trim();
            const sName = (s.tutorName || '').toLowerCase().trim();
            const sTutorId = (s.tutorId || '').toLowerCase().trim();

            if (sName === 'unassigned') return false;

            if (sTutorId && tutorIds.has(sTutorId)) return true;
            if (sEmail && tutorEmails.has(sEmail)) return true;
            if (sName && tutorNames.has(sName)) return true;
            if (sName && tutorEmails.has(sName)) return true;
            if (sEmail && tutorNames.has(sEmail)) return true;

            // Resilient token match: e.g. "Olalekan" matches "Olalekan Israel Ajimati"
            if (sName && nameTokens.size > 0) {
                for (const tok of nameTokens) {
                    if (sName.includes(tok)) return true;
                }
                const sTokens = sName.split(/\s+/).filter(t => t.length > 2);
                for (const sTok of sTokens) {
                    for (const n of tutorNames) {
                        if (n.includes(sTok)) return true;
                    }
                }
            }

            return false;
        });

        // Also include any students assigned in active/pending schedules
        const schedules = db.schedules || [];
        const tutorSchedules = schedules.filter(sch => {
            const schEmail = (sch.tutorEmail || '').toLowerCase().trim();
            const schMentor = (sch.mentor || sch.tutorName || '').toLowerCase().trim();
            const schTutorId = (sch.tutorId || '').toLowerCase().trim();

            if (schTutorId && tutorIds.has(schTutorId)) return true;
            if (schEmail && tutorEmails.has(schEmail)) return true;
            if (schMentor && tutorNames.has(schMentor)) return true;
            if (schMentor && nameTokens.size > 0) {
                for (const tok of nameTokens) {
                    if (schMentor.includes(tok)) return true;
                }
            }
            return false;
        });

        tutorSchedules.forEach(sch => {
            const matchIndex = filtered.findIndex(s => 
                (s.id && sch.studentId && s.id === sch.studentId) ||
                ((s.firstName + ' ' + s.lastName).trim().toLowerCase() === (sch.studentName || '').trim().toLowerCase())
            );
            if (matchIndex === -1) {
                const foundStudent = students.find(s => 
                    (s.id && sch.studentId && s.id === sch.studentId) ||
                    ((s.firstName + ' ' + s.lastName).trim().toLowerCase() === (sch.studentName || '').trim().toLowerCase())
                );
                if (foundStudent) {
                    filtered.push(foundStudent);
                } else if (sch.studentName) {
                    const parts = sch.studentName.split(' ');
                    filtered.push({
                        id: sch.studentId || ('synth-' + Math.random().toString(36).substr(2, 9)),
                        firstName: parts[0] || sch.studentName,
                        lastName: parts.slice(1).join(' ') || '',
                        program: sch.course || 'Coding Track',
                        status: 'active',
                        tutorName: sch.mentor || sch.tutorName || 'Tutor',
                        tutorEmail: sch.tutorEmail || (matchedTutor ? matchedTutor.email : '')
                    });
                }
            }
        });

        // Deduplicate
        const seen = new Set();
        return filtered.filter(s => {
            const key = s.id || ((s.firstName || '') + '_' + (s.lastName || '')).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }


    // --- Progress Reports Controller ---
    function getReports(studentId = null) {
        const db = getDB();
        const reps = (db && Array.isArray(db.progressReports)) ? db.progressReports : [];
        if (studentId) {
            return reps.filter(r => r && r.studentId === studentId);
        }
        return reps;
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
        return db.enrollments || [];
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
                parentEmail: enr.parentEmail || enr.email || "",
                parentName: enr.parentName || "",
                studentEmail: enr.studentEmail || "",
                mediaConsent: enr.mediaConsent !== false,
                birthday: (enr.studentBirthday && typeof enr.studentBirthday === 'string' && enr.studentBirthday.trim().length >= 10) ? enr.studentBirthday.trim() : "",
                hasExplicitBirthday: !!(enr.studentBirthday && enr.studentBirthday.trim()),
                fatherName: enr.fatherName || "",
                fatherPhone: enr.fatherPhone || "",
                motherName: enr.motherName || "",
                motherPhone: enr.motherPhone || "",
                progress: 0,
                avatarColor: "bg-purple-500",
                tutorName: "Sarah Jane",
                tutorEmail: "tutor@stemuluskidstech.com",
                tutorId: "tut-101",
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
                tutorName: "Sarah Jane",
                tutorEmail: "tutor@stemuluskidstech.com",
                tutorId: "tut-101",
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
                    message: `Welcome ${enr.parentName}! Your STEMulus parent portal login: Email: ${enr.email} | Temporary Password: ${randomPassword} - Please change this after your first login.`,
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
                    subject: 'Welcome to STEMulus - ' + (enr.studentFirstName||'') + "'s coding journey starts!",
                    htmlPreview: 'Welcome email for ' + (enr.parentName||'Parent') + ' - contains portal login credentials. Temp password: ' + randomPassword,
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
            if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
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
        const notifs = db.notifications || [];
        if (!email) return notifs;
        const clean = String(email).toLowerCase().trim();
        const session = getSession();
        const sessionRole = (session && session.role || '').toLowerCase();
        const sessionName = (session && session.name || '').toLowerCase();

        return notifs.filter(n => {
            const target = (n.userEmail || n.recipientEmail || '').toLowerCase().trim();
            const targetRole = (n.targetRole || n.recipientRole || '').toLowerCase().trim();
            const targetName = (n.recipientName || n.targetName || '').toLowerCase().trim();

            if (target === 'all' || target === 'everyone') return true;
            if (sessionRole === 'tutor' && (target === 'tutors' || target === 'all-tutors' || targetRole === 'tutor' || targetRole === 'all-tutors')) return true;
            if (sessionRole === 'parent' && (target === 'parents' || target === 'all-parents' || targetRole === 'parent' || targetRole === 'all-parents')) return true;
            if (target === clean) return true;
            if (sessionName && targetName && (targetName === sessionName || sessionName.includes(targetName) || targetName.includes(sessionName))) return true;
            return false;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
        if (!email) return;
        const db = getDB();
        let changed = false;
        (db.notifications || []).forEach(n => {
            if (n && n.userEmail === email && !n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) {
            try {
                localStorage.setItem('stemulus_db', JSON.stringify(db));
            } catch(e) {}
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                try {
                    firebase.firestore().collection('state').doc('current').set(db).catch(() => {});
                } catch(e) {}
            }
        }
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
        if (report.studentId && (!report.parentEmail || !report.studentName)) {
            var matchedById = (db.students || []).find(function(s) { return s.id === report.studentId; });
            if (matchedById) {
                report.studentName = report.studentName || ((matchedById.firstName || '') + ' ' + (matchedById.lastName || '')).trim();
                report.parentEmail = report.parentEmail || matchedById.parentEmail;
                report.parentName = report.parentName || matchedById.parentName;
                if (!report.course && matchedById.program) report.course = matchedById.program;
            }
        }
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
            syncToFirestore('monthly_reports', report.id, db.monthlyReports[existingIdx]);
            return Object.assign({ success: true, isUpdate: true }, report);
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
        syncToFirestore('monthly_reports', report.id, report);
        return Object.assign({ success: true }, report);
    }

    function updateMonthlyReport(id, updates) {
        var db = getDB();
        db.monthlyReports = db.monthlyReports || [];
        var idx = db.monthlyReports.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        db.monthlyReports[idx] = Object.assign({}, db.monthlyReports[idx], updates);
        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        syncToFirestore('monthly_reports', id, db.monthlyReports[idx]);
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

            // Transactional revision email to tutor
            try {
                fetch('/.netlify/functions/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'monthly-report-revision-tutor',
                        to: r.tutorEmail.toLowerCase(),
                        studentName: r.studentName,
                        month: r.month,
                        rejectionReason: r.rejectionReason
                    })
                }).catch(function(){});
            } catch(e) {}
        }

        saveDB(db);
        syncLegacyMonthlyReports(db.monthlyReports);
        syncToFirestore('monthly_reports', id, r);
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

        // Approval Timeline matching KidzTech standards
        r.approvalTimeline = r.approvalTimeline || {};
        r.approvalTimeline.submittedAt = r.submittedAt || r.createdAt || new Date().toISOString();
        r.approvalTimeline.managerApprovedAt = r.reviewedAt || new Date().toISOString();
        r.approvalTimeline.directorApprovedAt = new Date().toISOString();
        r.approvalTimeline.directorEmail = (getSession() ? getSession().email : 'admin@stemuluskidstech.com');
        r.approvalTimeline.directorNote = (adminEdits && adminEdits.adminNotes) || r.adminNotes || 'Approved by Academic Director';

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
                subject: 'STEMulus Official Monthly Academic Evaluation - ' + (r.studentName || 'Student') + ' (' + (r.month || '') + ')',
                htmlPreview: 'Official progress report for ' + (r.studentName || 'Student') + ' - Grade: ' + (r.overallGrade || 'A') + '. Available to download and print in your Parent Portal.',
                data: {
                    reportId: r.id,
                    studentName: r.studentName,
                    grade: r.overallGrade,
                    month: r.month,
                    course: r.course,
                    tutorName: r.tutorName,
                    directorNote: r.approvalTimeline.directorNote
                },
                triggeredBy: 'admin_monthly_report_send:' + r.id
            });

            // Direct transactional email dispatch via Netlify Resend function
            try {
                fetch('/.netlify/functions/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'monthly_report',
                        to: parentEmail.toLowerCase(),
                        studentName: r.studentName,
                        grade: r.overallGrade,
                        month: r.month,
                        course: r.course,
                        tutorName: r.tutorName,
                        directorNote: r.approvalTimeline.directorNote
                    })
                }).catch(function(){});
            } catch(e) {}
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
        syncToFirestore('monthly_reports', r.id, r);
        r.success = true;
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
            db.tutors = db.tutors || [];
            var existingTutorIdx = db.tutors.findIndex(function(t){
                return (t.email && t.email.toLowerCase().trim() === tutorEmail) ||
                       (t.name && params.name && t.name.toLowerCase().trim() === params.name.toLowerCase().trim());
            });
            if (existingTutorIdx === -1) {
                db.tutors.push({
                    id: 'tut-' + Date.now(),
                    name: params.name || 'Tutor',
                    email: tutorEmail,
                    phone: params.phone || '',
                    subjects: params.program ? [params.program] : ['General Coding'],
                    status: 'active',
                    createdAt: new Date().toISOString()
                });
            } else {
                db.tutors[existingTutorIdx].name = params.name || db.tutors[existingTutorIdx].name;
                db.tutors[existingTutorIdx].email = tutorEmail;
                if (params.phone) db.tutors[existingTutorIdx].phone = params.phone;
                db.tutors[existingTutorIdx].status = 'active';
            }
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
                subject: 'Welcome to STEMulus Faculty - Your Tutor Portal Access',
                htmlPreview: 'Welcome ' + (params.name || 'Tutor') + '! Your tutor portal credentials: Login: ' + tutorEmail + ' | Temp Password: ' + tempPwd,
                data: { tutorEmail: tutorEmail, tutorName: params.name || 'Tutor', tempPassword: tempPwd, subjects: params.program || '' },
                triggeredBy: 'quick_onboard_tutor',
                createdAt: new Date().toISOString(),
                sentAt: null,
                editedSubject: null,
                editedBody: null
            });
            saveDB(db);
            if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
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
            } else {
                db.users[parentEmail].password = hashed;
                db.users[parentEmail].role = 'parent';
                if (params.name) db.users[parentEmail].name = params.name;
            }
            var childAge = parseInt(params.childAge) || 10;
            var parts = (params.childName || 'Student').trim().split(/\s+/);
            var fName = parts[0] || 'Student';
            var lName = parts.slice(1).join(' ') || (params.name ? params.name.split(' ').slice(-1)[0] : 'S.');
            
            db.students = db.students || [];
            var existingStudIdx = db.students.findIndex(function(s) {
                return (s.parentEmail && s.parentEmail.toLowerCase() === parentEmail) &&
                       (s.firstName && s.firstName.toLowerCase() === fName.toLowerCase()) &&
                       (s.lastName && s.lastName.toLowerCase() === lName.toLowerCase());
            });

            var newStudent;
            if (existingStudIdx !== -1) {
                // Reassign existing student without duplicating
                db.students[existingStudIdx].tutorName = params.tutorName || 'Sarah Jane';
                db.students[existingStudIdx].program = params.program || db.students[existingStudIdx].program;
                db.students[existingStudIdx].age = childAge;
                if (params.phone) db.students[existingStudIdx].parentPhone = params.phone;
                newStudent = db.students[existingStudIdx];
            } else {
                const matchedQoTutor = resolveTutorDetails(params.tutorName || 'Sarah Jane');
                newStudent = {
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
                    tutorName: matchedQoTutor ? matchedQoTutor.name : (params.tutorName || 'Sarah Jane'),
                    tutorEmail: matchedQoTutor ? matchedQoTutor.email : 'tutor@stemuluskidstech.com',
                    tutorId: matchedQoTutor ? matchedQoTutor.id : 'tut-101',
                    classroomLink: params.classroomLink || 'https://zoom.us/j/stemulus-class'
                };
                db.students.push(newStudent);
            }

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
                tutorName: newStudent.tutorName,
                tutorEmail: newStudent.tutorEmail,
                tutorId: newStudent.tutorId,
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
                subject: 'Welcome to STEMulus - ' + fName + '\'s coding journey starts!',
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
            if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
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
        if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
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
        if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('stemulusDbUpdated'));
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

    async function requestPasswordReset(email, role) {
        var db = getDB();
        const cleanEmail = (email || '').toLowerCase().trim();
        const cleanRole = (role || 'parent').toLowerCase().trim();

        if (!cleanEmail || !cleanEmail.includes('@')) {
            return { success: false, message: 'Please enter a valid email address.' };
        }

        // Check if user exists in local store
        let user = db.users ? db.users[cleanEmail] : null;

        // Cloud fallback check if user not in local store
        if (!user && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            try {
                const cloudPromise = firebase.firestore().collection('state').doc('current').get();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                const snap = await Promise.race([cloudPromise, timeoutPromise]);
                if (snap && snap.exists) {
                    const cloudData = snap.data();
                    if (cloudData && cloudData.users && cloudData.users[cleanEmail]) {
                        user = cloudData.users[cleanEmail];
                        db = cloudData;
                        localStorage.setItem('stemulus_db', JSON.stringify(db));
                    }
                }
            } catch (e) {
                console.warn('[DashboardEngine] Cloud user lookup failed or timed out:', e);
            }
        }

        // Secondary fallback to parent/tutor directories
        if (!user) {
            if (cleanRole === 'parent' && db.parents) {
                const p = db.parents.find(x => x.email && x.email.toLowerCase().trim() === cleanEmail);
                if (p) {
                    if (!db.users) db.users = {};
                    db.users[cleanEmail] = {
                        email: cleanEmail,
                        name: p.name || 'Parent',
                        role: 'parent',
                        createdAt: new Date().toISOString()
                    };
                    user = db.users[cleanEmail];
                }
            } else if (cleanRole === 'tutor' && db.tutors) {
                const t = db.tutors.find(x => x.email && x.email.toLowerCase().trim() === cleanEmail);
                if (t) {
                    if (!db.users) db.users = {};
                    db.users[cleanEmail] = {
                        email: cleanEmail,
                        name: t.name || 'Faculty Tutor',
                        role: 'tutor',
                        createdAt: new Date().toISOString()
                    };
                    user = db.users[cleanEmail];
                }
            }
        }

        if (!user) {
            const roleName = cleanRole === 'tutor' ? 'Faculty Tutor' : 'Parent';
            return {
                success: false,
                message: 'No active ' + roleName + ' account found with this email. Please check your spelling or contact admin@stemuluskidstech.com.'
            };
        }

        // Verify role match
        if (user.role && user.role !== cleanRole) {
            const properRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            return {
                success: false,
                message: 'This email is registered as a ' + properRole + ' account. Please switch to the ' + properRole + ' tab to reset your password.'
            };
        }

        // Generate high-entropy 8-character temporary password: STEM-XXXXXX
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const tempPassword = 'STEM-' + code;

        // Set temporary password and require password change on sign-in
        user.password = tempPassword;
        user.mustChangePassword = true;
        user.updatedAt = new Date().toISOString();

        // Record in db.passwordResetRequests
        if (!db.passwordResetRequests) db.passwordResetRequests = [];
        db.passwordResetRequests.push({
            id: 'pwr-' + Date.now(),
            email: cleanEmail,
            role: cleanRole,
            name: user.name || cleanEmail,
            status: 'resolved',
            method: 'automated_dispatch',
            requestedAt: new Date().toISOString(),
            resolvedAt: new Date().toISOString()
        });

        saveDB(db);

        // Dispatch official transactional email via Netlify send-email function
        let emailSent = false;
        try {
            const portalUrl = (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : 'https://stemuluskidstech.com') +
                '/parent-login.html?role=' + cleanRole;
            const resp = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'credentials-reset',
                    data: {
                        recipientName: user.name || cleanEmail,
                        recipientEmail: cleanEmail,
                        newPassword: tempPassword,
                        portalUrl: portalUrl
                    },
                    recipientName: user.name || cleanEmail,
                    recipientEmail: cleanEmail,
                    newPassword: tempPassword,
                    portalUrl: portalUrl
                })
            });
            if (resp.ok) {
                emailSent = true;
            }
        } catch (mailErr) {
            console.warn('[DashboardEngine] Direct email dispatch error (offline/local fallback):', mailErr);
        }

        const isLocalDev = (typeof window !== 'undefined' && window.location && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

        return {
            success: true,
            email: cleanEmail,
            role: cleanRole,
            name: user.name || cleanEmail,
            tempPassword: isLocalDev ? tempPassword : null,
            emailSent: emailSent,
            message: 'A temporary password has been generated and sent to ' + cleanEmail + '.'
        };
    }

    async function changePasswordAfterReset(email, newPassword) {
        var db = getDB();
        const cleanEmail = (email || '').toLowerCase().trim();
        const user = db.users ? db.users[cleanEmail] : null;

        if (!user) {
            return { success: false, message: 'User session not found.' };
        }

        const pwd = String(newPassword || '').trim();
        if (pwd.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long.' };
        }
        if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
            return { success: false, message: 'Password must contain both letters and numbers.' };
        }

        const hashed = await hashPassword(pwd);
        user.password = hashed;
        user.mustChangePassword = false;
        user.passwordChangedAt = new Date().toISOString();

        saveDB(db);

        // Update active session with full user profile
        const safeSession = {
            email: user.email,
            role: user.role,
            name: user.name || cleanEmail,
            issuedAt: Date.now(),
            mustChangePassword: false
        };
        if (typeof StemulusSecurity !== 'undefined' && StemulusSecurity.saveSecureSession) {
            StemulusSecurity.saveSecureSession(safeSession);
        } else {
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('stemulus_session', JSON.stringify(safeSession));
            if (typeof localStorage !== 'undefined') localStorage.setItem('stemulus_session', JSON.stringify(safeSession));
        }

        return { success: true, message: 'Password updated successfully.', user: safeSession };
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
        if (!db.users[adminKey] || !db.users[adminKey].password || db.users[adminKey].role !== 'admin') {
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

        // List of core default tutors with Tutor2026!
        var defaultTutors = [
            { email: 'tutor@stemuluskidstech.com', name: 'Sarah Jane' },
            { email: 'olalekan@stemuluskidstech.com', name: 'Olalekan Israel Ajimati' },
            { email: 'david.okon@stemuluskidstech.com', name: 'David Okon' }
        ];

        var tutorHash = await hashPassword('Tutor2026!');
        defaultTutors.forEach(function(dt) {
            var k = dt.email.toLowerCase().trim();
            if (!db.users[k] || !db.users[k].password) {
                db.users[k] = Object.assign({}, db.users[k] || {}, {
                    email: dt.email,
                    name: (db.users[k] && db.users[k].name) ? db.users[k].name : dt.name,
                    role: 'tutor',
                    password: tutorHash,
                    createdAt: (db.users[k] && db.users[k].createdAt) ? db.users[k].createdAt : new Date().toISOString()
                });
                changed = true;
            }
        });

        // Ensure parent account exists with Parent2026!
        var parentHash = await hashPassword('Parent2026!');
        if (!db.users['parent@stemuluskidstech.com'] || !db.users['parent@stemuluskidstech.com'].password) {
            db.users['parent@stemuluskidstech.com'] = Object.assign({}, db.users['parent@stemuluskidstech.com'] || {}, {
                email: 'parent@stemuluskidstech.com',
                name: (db.users['parent@stemuluskidstech.com'] && db.users['parent@stemuluskidstech.com'].name) ? db.users['parent@stemuluskidstech.com'].name : 'Demo Parent',
                role: 'parent',
                password: parentHash,
                createdAt: new Date().toISOString()
            });
            changed = true;
        }

        // Ensure any student parentEmail exists as a parent user
        if (db.students && Array.isArray(db.students)) {
            db.students.forEach(function(s) {
                if (s.parentEmail) {
                    var pe = s.parentEmail.toLowerCase().trim();
                    if (!db.users[pe] || !db.users[pe].password) {
                        db.users[pe] = Object.assign({}, db.users[pe] || {}, {
                            email: pe,
                            name: s.parentName || 'Parent',
                            role: 'parent',
                            password: (db.users[pe] && db.users[pe].password) ? db.users[pe].password : parentHash,
                            phone: s.parentPhone || '',
                            createdAt: (db.users[pe] && db.users[pe].createdAt) ? db.users[pe].createdAt : new Date().toISOString()
                        });
                        changed = true;
                    }
                }
            });
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
                const docExists = typeof doc.exists === 'function' ? doc.exists() : doc.exists;
                if (docExists) {
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
                    
                    // Intelligently merge local collections with cloud data so local modifications are preserved
                    const localDb = getDB();
                    const mergedDb = Object.assign({}, cloudData);
                    const deletedStudentIds = localDb.deletedStudentIds || [];
                    ['users', 'students', 'tutors', 'parents', 'schedules', 'attendanceRecords', 'monthlyReports', 'progressReports', 'notifications', 'emailQueue', 'billingSettings'].forEach(key => {
                        if (Array.isArray(localDb[key])) {
                            const cloudArr = Array.isArray(cloudData[key]) ? cloudData[key] : [];
                            let combined = [...cloudArr];
                            if (key === 'students') {
                                combined = combined.filter(c => !c || (!c.isDeleted && !deletedStudentIds.includes(c.id)));
                            }
                            localDb[key].forEach(item => {
                                if (item && item.id) {
                                    if (key === 'students' && (item.isDeleted || deletedStudentIds.includes(item.id))) {
                                        return;
                                    }
                                    const matchIdx = combined.findIndex(c => c && c.id === item.id);
                                    if (matchIdx === -1) {
                                        combined.push(item);
                                    } else {
                                        combined[matchIdx] = Object.assign({}, combined[matchIdx], item);
                                    }
                                }
                            });
                            mergedDb[key] = combined;
                        } else if (localDb[key] && typeof localDb[key] === 'object') {
                            mergedDb[key] = Object.assign({}, cloudData[key] || {}, localDb[key]);
                        }
                    });
                    
                    localStorage.setItem("stemulus_db", JSON.stringify(mergedDb));
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
        reconcileHeldSchedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getRescheduleRequests,
        submitReschedule,
        approveReschedule,
        declineReschedule,
        getOnboarding,
        completeOnboardingStep,
        completeAllOnboarding,
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
        getOverdueAttendance,
        calculateMonthlySessionTarget,
        calculateTutorMonthlyStats,
        calculateStudentLiveMetrics,
        getStudentsByTutor,
        getTutorStudents,
        getCurrentScheduledStudent,
        updateCertificate,
        verifyCertificate,
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
        requestPasswordReset,
        changePasswordAfterReset,
        setRemindersPaused,
        updateStudentStatus,
        updateTutor,
        updateTutorStatus,
        generateWeeklyReport,
        generateAllWeeklyReports,
        getNtfyTopic: () => getDB().ntfyTopic,
        // Billing & Tuition Cycle APIs
        getBillingInfo: function(studentId) {
            if (typeof BillingEngine !== 'undefined') {
                const db = getDB();
                const student = (db.students || []).find(s => s.id === studentId);
                if (!student) return null;
                return BillingEngine.calculateBillingInfo(student, db.attendanceRecords || [], db.schedules || []);
            }
            return null;
        },
        recordPayment: function(studentId, paymentData) {
            if (typeof BillingEngine !== 'undefined') {
                return BillingEngine.recordPayment(studentId, paymentData);
            }
            return { success: false, message: 'BillingEngine not loaded.' };
        },
        getBillingRoster: function() {
            if (typeof BillingEngine !== 'undefined') {
                return BillingEngine.getBillingRoster();
            }
            return [];
        },
        getBillingDueStudents: function() {
            if (typeof BillingEngine !== 'undefined') {
                return BillingEngine.getDueStudents();
            }
            return [];
        },
        getBillingSettings: function() {
            if (typeof BillingEngine !== 'undefined') {
                return BillingEngine.getSettings();
            }
            return {};
        },
        updateBillingSettings: function(newSettings) {
            if (typeof BillingEngine !== 'undefined') {
                return BillingEngine.updateSettings(newSettings);
            }
            return false;
        },
        addUser: async function(userData) {
            const db = getDB();
            if (!db.users) db.users = {};
            const key = (userData.email || '').toLowerCase().trim();
            if (!key) return { success: false, message: 'Valid email is required.' };
            if (!userData.password) return { success: false, message: 'Password is required.' };
            const plain = String(userData.password).trim();
            const role = (userData.role || 'parent').toLowerCase().trim();
            const name = (userData.name || 'Parent').trim();
            const phone = (userData.phone || '').trim();

            const hashedPassword = isHashed(plain) ? plain : await hashPassword(plain);

            db.users[key] = {
                email: key,
                password: hashedPassword,
                role: role,
                name: name,
                phone: phone,
                createdAt: new Date().toISOString()
            };

            // If role is parent, ensure record in db.parents
            if (role === 'parent') {
                if (!db.parents) db.parents = [];
                const existingParent = db.parents.find(p => p.email && p.email.toLowerCase().trim() === key);
                if (existingParent) {
                    existingParent.name = name || existingParent.name;
                    if (phone) existingParent.phone = phone;
                } else {
                    db.parents.push({
                        id: 'par-' + Date.now(),
                        name: name,
                        email: key,
                        phone: phone,
                        country: userData.country || 'Nigeria',
                        createdAt: new Date().toISOString(),
                        status: 'active'
                    });
                }
            }

            // If role is tutor, ensure record in db.tutors
            if (role === 'tutor') {
                if (!db.tutors) db.tutors = [];
                const existingTutor = db.tutors.find(t => t.email && t.email.toLowerCase().trim() === key);
                if (existingTutor) {
                    existingTutor.name = name || existingTutor.name;
                    if (phone) existingTutor.phone = phone;
                } else {
                    db.tutors.push({
                        id: 'tut-' + Date.now(),
                        name: name,
                        email: key,
                        phone: phone,
                        status: 'active',
                        subjects: userData.subjects || ['Python Programming', 'Web Design'],
                        availability: userData.availability || {},
                        createdAt: new Date().toISOString()
                    });
                }
            }

            saveDB(db);
            return { success: true, updated: true, user: db.users[key] };
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
            if (!session || !session.role) {
                if (requiredRole === 'admin') { window.location.href = 'admin-login.html'; return null; }
                window.location.href = 'parent-login.html';
                return null;
            }
            if (requiredRole && session.role !== requiredRole) {
                if (requiredRole === 'admin') { window.location.href = 'admin-login.html'; return null; }
                window.location.href = 'parent-login.html?role=' + requiredRole;
                return null;
            }
            return session;
        },
        escapeHtml: function(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        initDefaultAccounts
    };
})();

// Auto-initialize default seed accounts on first load
DashboardEngine.initDefaultAccounts();

if (typeof window !== 'undefined') {
    window.DashboardEngine = DashboardEngine;
    window.escapeHtml = DashboardEngine.escapeHtml;
    window.STEMulusSanitizer = { escapeHtml: DashboardEngine.escapeHtml };
}
if (typeof globalThis !== 'undefined') {
    globalThis.DashboardEngine = DashboardEngine;
    globalThis.escapeHtml = DashboardEngine.escapeHtml;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardEngine;
}
