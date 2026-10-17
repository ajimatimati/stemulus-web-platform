const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Update Users
const TUTOR_DEFAULT_HASH = 'ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493'; // SHA-256 of 'Tutor2026!'

const newTutorUsers = {
  "adefemiadebayo20@gmail.com": {
    "id": "usr-tut-104",
    "name": "Moses Oluwafemi Adebayo",
    "email": "adefemiadebayo20@gmail.com",
    "role": "tutor",
    "password": TUTOR_DEFAULT_HASH,
    "phone": "07063346551",
    "status": "active"
  },
  "kafayatabdulwahab.et@gmail.com": {
    "id": "usr-tut-105",
    "name": "Kafayat Abdulwahab",
    "email": "kafayatabdulwahab.et@gmail.com",
    "role": "tutor",
    "password": TUTOR_DEFAULT_HASH,
    "phone": "08065220517",
    "status": "active"
  },
  "tonetbod@gmail.com": {
    "id": "usr-tut-106",
    "name": "Tola Tosin Ayanleke",
    "email": "tonetbod@gmail.com",
    "role": "tutor",
    "password": TUTOR_DEFAULT_HASH,
    "phone": "0912 313 1969",
    "status": "active"
  },
  "emmanuel@stemuluskidstech.com": {
    "id": "usr-tut-107",
    "name": "Emmanuel O.",
    "email": "emmanuel@stemuluskidstech.com",
    "role": "tutor",
    "password": TUTOR_DEFAULT_HASH,
    "phone": "+2348030000000",
    "status": "active"
  }
};

Object.entries(newTutorUsers).forEach(([email, u]) => {
  db.users[email] = { ...(db.users[email] || {}), ...u };
});

// Also ensure Parent account for Joshua Ogba exists
if (!db.users["joshuaogba.parent@gmail.com"]) {
  db.users["joshuaogba.parent@gmail.com"] = {
    "email": "joshuaogba.parent@gmail.com",
    "name": "Mrs. Ogba",
    "role": "parent",
    "password": "TempPassword2026!"
  };
}

// 2. Comprehensive Tutors Roster with Full Legal, Bank & Workstation Audit
db.tutors = [
  {
    "id": "tut-101",
    "name": "Sarah Jane",
    "email": "tutor@stemuluskidstech.com",
    "phone": "+2348011223344",
    "subjects": ["Python Programming", "Scratch Creators"],
    "location": "Lagos, Nigeria",
    "assignmentType": "Online Remote Senior Instructor",
    "status": "active"
  },
  {
    "id": "tut-102",
    "name": "David Okon",
    "email": "david.okon@stemuluskidstech.com",
    "phone": "+2348022334455",
    "subjects": ["Web Development", "Robotics"],
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
    "subjects": ["Python Programming", "Full-Stack Web Development", "AI & Machine Learning"],
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
    "subjects": ["Scratch Creators", "Robotics & Micro:bit", "Python Programming"],
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
    "subjects": ["Scratch Creators", "Web Development", "Python Programming"],
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
    "subjects": ["Python Programming", "Scratch Creators"],
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
    "subjects": ["Robotics & Arduino", "Physical Computing", "Web & App Development"],
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
];

// 3. Update Student Tutor Assignments & Add Joshua Ogba
const tutorAssignments = {
  "std-1007-r4cv": { tutorName: "Tola Tosin Ayanleke", tutorEmail: "tonetbod@gmail.com", tutorId: "tut-106-tola" },
  "std-1008-a0lp": { tutorName: "Emmanuel O.", tutorEmail: "emmanuel@stemuluskidstech.com", tutorId: "tut-107-emmanuel" },
  "std-1009-tbod": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" },
  "std-1010-ilb5": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" },
  "std-1011-tq1u": { tutorName: "Moses Oluwafemi Adebayo", tutorEmail: "adefemiadebayo20@gmail.com", tutorId: "tut-104-moses" },
  "std-1012-wq6b": { tutorName: "Olalekan Israel Ajimati", tutorEmail: "olalekan@stemuluskidstech.com", tutorId: "tut-103" }
};

db.students.forEach(s => {
  if (tutorAssignments[s.id]) {
    s.tutorName = tutorAssignments[s.id].tutorName;
    s.tutorEmail = tutorAssignments[s.id].tutorEmail;
    s.tutorId = tutorAssignments[s.id].tutorId;
  }
});

// Check if Joshua Ogba is already in db.students
const joshuaExists = db.students.some(s => s.id === 'std-1013-jogb' || (s.firstName === 'Joshua' && s.lastName === 'Ogba'));
if (!joshuaExists) {
  db.students.push({
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
  });
}

// 4. Autonomous Timetable / Schedules
const newWeeklySchedules = [
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
];

db.schedules = db.schedules || [];
newWeeklySchedules.forEach(ns => {
  const existingIdx = db.schedules.findIndex(s => s.id === ns.id);
  if (existingIdx !== -1) {
    db.schedules[existingIdx] = ns;
  } else {
    db.schedules.push(ns);
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated stemulus_db_latest.json with tutors, Joshua Ogba, and schedules!');
