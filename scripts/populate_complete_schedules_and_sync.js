const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Current Week Sessions (October 12 - 18, 2026)
const currentWeekSchedules = [
  {
    id: "sch-101-mon-momo-w1",
    studentId: "std-1011-tq1u",
    studentName: "Momooreoluwa Sonaike",
    course: "Scratch Creators",
    dayOfWeek: "Monday",
    date: "2026-10-12",
    time: "19:00",
    duration: "60",
    mentor: "Moses Oluwafemi Adebayo",
    tutorName: "Moses Oluwafemi Adebayo",
    tutorEmail: "adefemiadebayo20@gmail.com",
    tutorId: "tut-104-moses",
    link: "https://meet.google.com/vdp-nmbh-sjj",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-102-tue-josh-w1",
    studentId: "std-1013-jogb",
    studentName: "Joshua Ogba",
    course: "Scratch Creators",
    dayOfWeek: "Tuesday",
    date: "2026-10-13",
    time: "15:00",
    duration: "60",
    mentor: "Kafayat Abdulwahab",
    tutorName: "Kafayat Abdulwahab",
    tutorEmail: "kafayatabdulwahab.et@gmail.com",
    tutorId: "tut-105-kafa",
    link: "https://meet.google.com/swf-vyjv-adm",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-103-tue-davi-w1",
    studentId: "std-1012-wq6b",
    studentName: "David Gjoka",
    course: "Python Programming",
    dayOfWeek: "Tuesday",
    date: "2026-10-13",
    time: "16:00",
    duration: "60",
    mentor: "Olalekan Israel Ajimati",
    tutorName: "Olalekan Israel Ajimati",
    tutorEmail: "olalekan@stemuluskidstech.com",
    tutorId: "tut-103",
    link: "https://meet.google.com/ocz-qcjr-cqb",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-104-tue-myle-w1",
    studentId: "std-1009-tbod",
    studentName: "King Myles Omosuyi",
    course: "Scratch Creators",
    dayOfWeek: "Tuesday",
    date: "2026-10-13",
    time: "19:00",
    duration: "60",
    mentor: "Olalekan Israel Ajimati",
    tutorName: "Olalekan Israel Ajimati",
    tutorEmail: "olalekan@stemuluskidstech.com",
    tutorId: "tut-103",
    link: "https://meet.google.com/cjr-phmf-ahs",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-105-wed-josh-w1",
    studentId: "std-1013-jogb",
    studentName: "Joshua Ogba",
    course: "Scratch Creators",
    dayOfWeek: "Wednesday",
    date: "2026-10-14",
    time: "15:00",
    duration: "60",
    mentor: "Kafayat Abdulwahab",
    tutorName: "Kafayat Abdulwahab",
    tutorEmail: "kafayatabdulwahab.et@gmail.com",
    tutorId: "tut-105-kafa",
    link: "https://meet.google.com/swf-vyjv-adm",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-106-wed-juna-w1",
    studentId: "std-1010-ilb5",
    studentName: "JUNAYD KARI",
    course: "Scratch Creators",
    dayOfWeek: "Wednesday",
    date: "2026-10-14",
    time: "16:00",
    duration: "60",
    mentor: "Olalekan Israel Ajimati",
    tutorName: "Olalekan Israel Ajimati",
    tutorEmail: "olalekan@stemuluskidstech.com",
    tutorId: "tut-103",
    link: "https://meet.google.com/gyd-fewb-cdh",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-107-fri-pear-w1",
    studentId: "std-1007-r4cv",
    studentName: "Babalola Oluwadunmininu Pearl",
    course: "Python Programming",
    dayOfWeek: "Friday",
    date: "2026-10-16",
    time: "16:00",
    duration: "60",
    mentor: "Tola Tosin Ayanleke",
    tutorName: "Tola Tosin Ayanleke",
    tutorEmail: "tonetbod@gmail.com",
    tutorId: "tut-106-tola",
    link: "https://meet.google.com/mim-qifa-avc",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-108-fri-juna-w1",
    studentId: "std-1010-ilb5",
    studentName: "JUNAYD KARI",
    course: "Scratch Creators",
    dayOfWeek: "Friday",
    date: "2026-10-16",
    time: "16:00",
    duration: "60",
    mentor: "Olalekan Israel Ajimati",
    tutorName: "Olalekan Israel Ajimati",
    tutorEmail: "olalekan@stemuluskidstech.com",
    tutorId: "tut-103",
    link: "https://meet.google.com/gyd-fewb-cdh",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-109-fri-myle-w1",
    studentId: "std-1009-tbod",
    studentName: "King Myles Omosuyi",
    course: "Scratch Creators",
    dayOfWeek: "Friday",
    date: "2026-10-16",
    time: "17:00",
    duration: "60",
    mentor: "Olalekan Israel Ajimati",
    tutorName: "Olalekan Israel Ajimati",
    tutorEmail: "olalekan@stemuluskidstech.com",
    tutorId: "tut-103",
    link: "https://meet.google.com/cjr-phmf-ahs",
    status: "done",
    attendanceStatus: "present"
  },
  {
    id: "sch-110-sat-pear-w1",
    studentId: "std-1007-r4cv",
    studentName: "Babalola Oluwadunmininu Pearl",
    course: "Python Programming",
    dayOfWeek: "Saturday",
    date: "2026-10-17",
    time: "10:00",
    duration: "60",
    mentor: "Tola Tosin Ayanleke",
    tutorName: "Tola Tosin Ayanleke",
    tutorEmail: "tonetbod@gmail.com",
    tutorId: "tut-106-tola",
    link: "https://meet.google.com/mim-qifa-avc",
    status: "scheduled",
    attendanceStatus: "scheduled"
  },
  {
    id: "sch-111-sat-momo-w1",
    studentId: "std-1011-tq1u",
    studentName: "Momooreoluwa Sonaike",
    course: "Scratch Creators",
    dayOfWeek: "Saturday",
    date: "2026-10-17",
    time: "12:00",
    duration: "60",
    mentor: "Moses Oluwafemi Adebayo",
    tutorName: "Moses Oluwafemi Adebayo",
    tutorEmail: "adefemiadebayo20@gmail.com",
    tutorId: "tut-104-moses",
    link: "https://meet.google.com/vdp-nmbh-sjj",
    status: "scheduled",
    attendanceStatus: "scheduled"
  },
  {
    id: "sch-112-sat-josh-w1",
    studentId: "std-1013-jogb",
    studentName: "Joshua Ogba",
    course: "Scratch Creators",
    dayOfWeek: "Saturday",
    date: "2026-10-17",
    time: "12:00",
    duration: "60",
    mentor: "Kafayat Abdulwahab",
    tutorName: "Kafayat Abdulwahab",
    tutorEmail: "kafayatabdulwahab.et@gmail.com",
    tutorId: "tut-105-kafa",
    link: "https://meet.google.com/swf-vyjv-adm",
    status: "scheduled",
    attendanceStatus: "scheduled"
  },
  {
    id: "sch-113-sat-gbol-w1",
    studentId: "std-1008-a0lp",
    studentName: "Gbolade Okesanjo",
    course: "Web & App Development",
    dayOfWeek: "Saturday",
    date: "2026-10-17",
    time: "12:00",
    duration: "60",
    mentor: "Emmanuel O.",
    tutorName: "Emmanuel O.",
    tutorEmail: "emmanuel@stemuluskidstech.com",
    tutorId: "tut-107-emmanuel",
    link: "Physical (In-Person Hub)",
    meetLinkBackup: "https://meet.google.com/mxh-ndjc-gox",
    status: "scheduled",
    attendanceStatus: "scheduled"
  },
  {
    id: "sch-114-sun-gbol-w1",
    studentId: "std-1008-a0lp",
    studentName: "Gbolade Okesanjo",
    course: "Web & App Development",
    dayOfWeek: "Sunday",
    date: "2026-10-18",
    time: "17:00",
    duration: "60",
    mentor: "Emmanuel O.",
    tutorName: "Emmanuel O.",
    tutorEmail: "emmanuel@stemuluskidstech.com",
    tutorId: "tut-107-emmanuel",
    link: "Physical (In-Person Hub)",
    meetLinkBackup: "https://meet.google.com/mxh-ndjc-gox",
    status: "scheduled",
    attendanceStatus: "scheduled"
  },
  {
    id: "sch-115-sun-josh-w1",
    studentId: "std-1013-jogb",
    studentName: "Joshua Ogba",
    course: "Scratch Creators",
    dayOfWeek: "Sunday",
    date: "2026-10-18",
    time: "19:00",
    duration: "60",
    mentor: "Kafayat Abdulwahab",
    tutorName: "Kafayat Abdulwahab",
    tutorEmail: "kafayatabdulwahab.et@gmail.com",
    tutorId: "tut-105-kafa",
    link: "https://meet.google.com/swf-vyjv-adm",
    status: "scheduled",
    attendanceStatus: "scheduled"
  }
];

// Merge into db.schedules
db.schedules = db.schedules || [];
currentWeekSchedules.forEach(cws => {
  const existingIdx = db.schedules.findIndex(s => s.id === cws.id);
  if (existingIdx !== -1) {
    db.schedules[existingIdx] = cws;
  } else {
    db.schedules.unshift(cws);
  }
});

// Also populate attendanceRecords for the completed sessions
db.attendanceRecords = db.attendanceRecords || [];
currentWeekSchedules.filter(s => s.attendanceStatus === 'present').forEach(cs => {
  const attId = 'att-' + cs.id;
  const existing = db.attendanceRecords.find(a => a.id === attId || a.scheduleId === cs.id);
  if (!existing) {
    db.attendanceRecords.push({
      id: attId,
      scheduleId: cs.id,
      studentId: cs.studentId,
      studentName: cs.studentName,
      course: cs.course,
      mentor: cs.mentor,
      tutorName: cs.tutorName,
      tutorEmail: cs.tutorEmail,
      date: cs.date,
      time: cs.time,
      duration: cs.duration || "60",
      status: "approved",
      notes: "Student attended live session and made progress on curriculum goals."
    });
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated stemulus_db_latest.json! Schedules count:', db.schedules.length, 'Attendance records count:', db.attendanceRecords.length);
