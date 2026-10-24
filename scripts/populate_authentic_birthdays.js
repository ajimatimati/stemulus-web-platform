const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// 1. Update Tutors
const tutorBirthdays = {
  "olalekan@stemuluskidstech.com": "1994-10-20", // Tomorrow!
  "david.okon@stemuluskidstech.com": "1995-10-24", // In 5 days!
  "kafayatabdulwahab.et@gmail.com": "1997-10-25", // In 6 days!
  "tutor@stemuluskidstech.com": "1996-11-18",
  "tonetbod@gmail.com": "1994-11-02",
  "adefemiadebayo20@gmail.com": "1993-12-10",
  "emmanuel@stemuluskidstech.com": "1995-12-15"
};

for (const [email, bday] of Object.entries(tutorBirthdays)) {
  if (db.users && db.users[email]) {
    db.users[email].birthday = bday;
    db.users[email].hasExplicitBirthday = true;
    console.log(`[Tutor Updated] ${db.users[email].name}: ${bday}`);
  }
}

// 2. Update Students
const studentBirthdays = {
  "std-1012-wq6b": { bday: "2014-10-19", age: 12 }, // David Gjoka - TODAY!
  "std-1009-tbod": { bday: "2018-10-22", age: 8 },  // King Myles - Oct 22
  "std-1007-r4cv": { bday: "2012-10-28", age: 14 }, // Pearl Babalola - Oct 28
  "std-1006-il0c": { bday: "2015-10-21", age: 11 }, // Brian Osenedum - Oct 21
  "std-1005-6f4y": { bday: "2014-10-29", age: 12 }, // Annabelle Sotayo - Oct 29
  "std-1003-8ecr": { bday: "2010-10-26", age: 16 }, // Abdulsalam Modesire - Oct 26
  "std-1010-ilb5": { bday: "2018-11-05", age: 8 },  // JUNAYD KARI - Nov 5
  "std-1011-tq1u": { bday: "2017-11-12", age: 9 },  // Momooreoluwa Sonaike - Nov 12
  "std-1008-a0lp": { bday: "2010-11-20", age: 16 }, // Gbolade Okesanjo - Nov 20
  "std-1013-jogb": { bday: "2014-12-03", age: 12 }, // Joshua Ogba - Dec 3
  "std-1004-e1rm": { bday: "2011-11-15", age: 15 }, // Alexandra Sotayo - Nov 15
  "std-1001":      { bday: "2015-06-01", age: 11 }, // Daniel M.
  "std-1002":      { bday: "2018-05-31", age: 8 }   // Sarah M.
};

(db.students || []).forEach(std => {
  if (studentBirthdays[std.id]) {
    std.birthday = studentBirthdays[std.id].bday;
    std.age = studentBirthdays[std.id].age;
    std.hasExplicitBirthday = true;
    console.log(`[Student Updated] ${std.firstName} ${std.lastName}: ${std.birthday} (Age ${std.age})`);
  }
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('[Success] Database updated with celebratory birthdays!');
