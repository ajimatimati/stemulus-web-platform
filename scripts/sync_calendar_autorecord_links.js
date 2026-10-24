const fs = require('fs');
const path = require('path');

console.log('Synchronizing newly provisioned Google Calendar Auto-Record Meet links...');

// 1. Update data/stemulus_db_latest.json
const dbPath = path.join(__dirname, '..', 'data', 'stemulus_db_latest.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Update King Myles (std-1009-tbod) -> https://meet.google.com/miz-dthg-pmt
const myles = db.students.find(s => s.id === 'std-1009-tbod');
if (myles) {
  myles.meetLink = 'https://meet.google.com/miz-dthg-pmt';
  myles.classroomLink = 'https://meet.google.com/miz-dthg-pmt';
  console.log('Updated King Myles student record to https://meet.google.com/miz-dthg-pmt');
}

db.schedules.forEach(s => {
  if (s.studentId === 'std-1009-tbod') {
    s.link = 'https://meet.google.com/miz-dthg-pmt';
  }
});
console.log('Updated King Myles schedules.');

// Update Pearl Babalola (std-1007-r4cv) -> https://meet.google.com/bbx-ocde-ytw
const pearl = db.students.find(s => s.id === 'std-1007-r4cv');
if (pearl) {
  pearl.meetLink = 'https://meet.google.com/bbx-ocde-ytw';
  pearl.classroomLink = 'https://meet.google.com/bbx-ocde-ytw';
  console.log('Updated Pearl student record to https://meet.google.com/bbx-ocde-ytw');
}

db.schedules.forEach(s => {
  if (s.studentId === 'std-1007-r4cv') {
    s.link = 'https://meet.google.com/bbx-ocde-ytw';
  }
});
console.log('Updated Pearl schedules.');

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Saved data/stemulus_db_latest.json.');

// 2. Update scripts/update_authentic_meet_links.js
const authLinksScriptPath = path.join(__dirname, 'update_authentic_meet_links.js');
let authContent = fs.readFileSync(authLinksScriptPath, 'utf8');
authContent = authContent.replace(/nxg-rbcg-nsr/g, 'miz-dthg-pmt');
authContent = authContent.replace(/yre-naci-zmp/g, 'bbx-ocde-ytw');
fs.writeFileSync(authLinksScriptPath, authContent, 'utf8');
console.log('Updated scripts/update_authentic_meet_links.js.');

// Run scripts/update_authentic_meet_links.js to propagate to dashboard-engine.js
require('./update_authentic_meet_links.js');

// 3. Update tests/verify_authentic_google_pro_links.js
const verifyTestPath = path.join(__dirname, '..', 'tests', 'verify_authentic_google_pro_links.js');
let verifyContent = fs.readFileSync(verifyTestPath, 'utf8');
verifyContent = verifyContent.replace(/'https:\/\/meet\.google\.com\/nxg-rbcg-nsr'/g, "'https://meet.google.com/miz-dthg-pmt'");
verifyContent = verifyContent.replace(/'https:\/\/meet\.google\.com\/yre-naci-zmp'/g, "'https://meet.google.com/bbx-ocde-ytw'");
fs.writeFileSync(verifyTestPath, verifyContent, 'utf8');
console.log('Updated tests/verify_authentic_google_pro_links.js.');

console.log('All authentic Google Calendar auto-recording links successfully synchronized!');
