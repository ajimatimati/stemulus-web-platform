const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const AUTHENTIC_CODERS = [
  {
    tokens: ['david', 'gjoka'],
    meetCode: 'ckd-ngjs-cth',
    meetLink: 'https://meet.google.com/ckd-ngjs-cth'
  },
  {
    tokens: ['junayd', 'kari'],
    meetCode: 'gyd-fewb-cdh',
    meetLink: 'https://meet.google.com/gyd-fewb-cdh'
  },
  {
    tokens: ['momooreoluwa', 'sonaike'],
    meetCode: 'vdp-nmbh-sjj',
    meetLink: 'https://meet.google.com/vdp-nmbh-sjj'
  },
  {
    tokens: ['joshua', 'ogba'],
    meetCode: 'yko-xwce-ugd',
    meetLink: 'https://meet.google.com/yko-xwce-ugd'
  },
  {
    tokens: ['myles', 'omosuyi'],
    meetCode: 'miz-dthg-pmt',
    meetLink: 'https://meet.google.com/miz-dthg-pmt'
  },
  {
    tokens: ['pearl', 'babalola'],
    meetCode: 'bbx-ocde-ytw',
    meetLink: 'https://meet.google.com/bbx-ocde-ytw'
  }
];

let updatedStudents = 0;
let updatedSchedules = 0;

AUTHENTIC_CODERS.forEach(coder => {
  // 1. Find and update student
  db.students.forEach(s => {
    const fullName = ((s.firstName || '') + ' ' + (s.lastName || '') + ' ' + (s.name || '')).toLowerCase();
    const matches = coder.tokens.some(tok => fullName.includes(tok));
    if (matches) {
      s.meetLink = coder.meetLink;
      s.classroomLink = coder.meetLink;
      updatedStudents++;
      console.log(`Updated student record: ${fullName} -> ${coder.meetLink}`);
    }
  });

  // 2. Find and update schedules
  db.schedules.forEach(sc => {
    const schedName = ((sc.studentName || '') + ' ' + (sc.course || '')).toLowerCase();
    const matches = coder.tokens.some(tok => schedName.includes(tok));
    if (matches) {
      sc.link = coder.meetLink;
      sc.meetingLink = coder.meetLink;
      sc.meetLink = coder.meetLink;
      sc.hostNotRequired = true;
      updatedSchedules++;
      console.log(`Updated schedule ${sc.id} (${sc.studentName}) -> ${coder.meetLink} (hostNotRequired: true)`);
    }
  });
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully updated ${updatedStudents} students and ${updatedSchedules} schedules in stemulus_db_latest.json!`);
