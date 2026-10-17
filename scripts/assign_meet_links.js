/**
 * STEMulus Autonomous Google Meet Link Allocator
 * Maps and assigns unique Google Meet classroom links generated under stemulusclubs@gmail.com
 * to every child/coder and updates their assigned schedules and parent communication records.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');

// Dedicated Google Meet links from the stemulusclubs@gmail.com profile
const MEET_POOL = [
  { id: "std-1011-tq1u", name: "Momooreoluwa Sonaike", link: "https://meet.google.com/vdp-nmbh-sjj" }, // "Momoreoluwa's Coding Quest"
  { id: "std-1010-ilb5", name: "JUNAYD KARI", link: "https://meet.google.com/gyd-fewb-cdh" },          // "Junayd's Coding Quest"
  { id: "std-1001", name: "Daniel M.", link: "https://meet.google.com/nxg-rbcg-nsr" },
  { id: "std-1002", name: "Sarah M.", link: "https://meet.google.com/gua-sisg-tei" },
  { id: "std-1003-8ecr", name: "Abdulsalam Modesire Shittu", link: "https://meet.google.com/zhv-jquf-rem" },
  { id: "std-1004-e1rm", name: "Alexandra Sotayo", link: "https://meet.google.com/yre-naci-zmp" },
  { id: "std-1005-6f4y", name: "Annabelle Sotayo", link: "https://meet.google.com/kos-rxkp-bkd" },
  { id: "std-1006-il0c", name: "Brian Osenedum Chukwuka-Mordi", link: "https://meet.google.com/wvh-vwbr-hoq" },
  { id: "std-1007-r4cv", name: "Babalola Oluwadunmininu Pearl", link: "https://meet.google.com/mim-qifa-avc" },
  { id: "std-1008-a0lp", name: "Gbolade Okesanjo", link: "https://meet.google.com/mxh-ndjc-gox" },
  { id: "std-1009-tbod", name: "King Myles Omosuyi", link: "https://meet.google.com/cjr-phmf-ahs" },
  { id: "std-1012-wq6b", name: "David Gjoka", link: "https://meet.google.com/ocz-qcjr-cqb" }
];

function assignMeetLinks() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found at:', DB_PATH);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  db.students = db.students || [];
  db.schedules = db.schedules || [];
  db.emailQueue = db.emailQueue || [];

  console.log('====================================================');
  console.log('   STEMULUS AUTONOMOUS GOOGLE MEET LINK ALLOCATOR');
  console.log('   Source Profile: stemulusclubs@gmail.com');
  console.log('====================================================');

  const poolMap = new Map();
  MEET_POOL.forEach(item => poolMap.set(item.id, item.link));

  let assignedCount = 0;

  // 1. Assign to Students
  db.students.forEach(student => {
    let assignedLink = poolMap.get(student.id);

    // Fallback if student not in pre-mapped pool
    if (!assignedLink) {
      assignedLink = student.classroomLink && student.classroomLink.includes('meet.google.com') 
        ? student.classroomLink 
        : `https://meet.google.com/stm-${Math.random().toString(36).substring(2, 6)}`;
    }

    student.meetLink = assignedLink;
    student.classroomLink = assignedLink;
    assignedCount++;

    console.log(`[STUDENT] ${student.firstName} ${student.lastName} (${student.id}) -> ${assignedLink}`);
  });

  // 2. Sync to Schedules
  let scheduleCount = 0;
  db.schedules.forEach(schedule => {
    const student = db.students.find(s => s.id === schedule.studentId);
    if (student && student.meetLink) {
      schedule.link = student.meetLink;
      scheduleCount++;
      console.log(`[SCHEDULE] ${schedule.id} (${schedule.studentName}) updated link -> ${schedule.link}`);
    } else if (schedule.link && schedule.link.includes('zoom.us')) {
      schedule.link = 'https://meet.google.com/gyd-fewb-cdh';
      scheduleCount++;
    }
  });

  // 3. Sync to Staged Email Queue
  let queueCount = 0;
  db.emailQueue.forEach(item => {
    if (item.data) {
      const student = db.students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === (item.to || '').toLowerCase());
      if (student && student.meetLink) {
        item.data.classroomLink = student.meetLink;
        item.data.meetLink = student.meetLink;
        queueCount++;
      }
    }
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log('====================================================');
  console.log(`Successfully allocated Google Meet links to:`);
  console.log(` - ${assignedCount} Students`);
  console.log(` - ${scheduleCount} Active Schedules`);
  console.log(` - ${queueCount} Staged Outbox Items`);
  console.log(`Updated database written to: ${DB_PATH}`);
  console.log('====================================================');
}

assignMeetLinks();
