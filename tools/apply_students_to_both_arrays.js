const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const enginePath = path.join(__dirname, '../assets/js/dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// Function to update a students array
function patchStudentsList(arr) {
  return arr.map(s => {
    const sName = ((s.firstName || '') + ' ' + (s.lastName || '')).trim().toLowerCase();
    
    // Pearl Babalola
    if (s.id === 'std-1007-r4cv' || sName.includes('pearl')) {
      s.id = 'std-1007-r4cv';
      s.firstName = 'Babalola';
      s.lastName = 'Oluwadunmininu Pearl';
      s.age = 13;
      s.tier = 'intermediate';
      s.package = 'Intermediate Young Engineers';
      s.classesAttended = 27;
      s.metrics = s.metrics || {};
      s.metrics.attended = 27;
      s.currentMonth = 7;
      s.badgeMonth = 7;
      s.badgeLevel = 'Fire Master';
      s.earnedBadges = [
        'fire-finder',
        'ember-keeper',
        'hearth-builder',
        'torch-bearer',
        'signal-fire',
        'forge-master'
      ];
      s.unlockedEras = ['Era I: The First Light'];
      s.classroomLink = 'https://meet.google.com/yre-naci-zmp';
      s.meetLink = 'https://meet.google.com/yre-naci-zmp';
      s.startDate = '2026-09-18';
      s.billing = {
        firstClassDate: '2026-09-18',
        anchorDay: 18,
        cycleStartDate: '2026-09-18',
        nextDueDate: '2026-11-18',
        monthlyFee: 75000,
        packageRate: 75000,
        tier: 'intermediate',
        octoberBridge: 37500,
        nextCycleFee: 75000,
        combinedRealignment: 112500,
        status: 'renewal_pending',
        uncollectedOctober: true,
        notes: 'Intermediate package (Age 13): ₦75,000/month. October bridge (Oct 19-31, 4 sessions): ₦37,500. November cycle: ₦75,000. Realignment total: ₦112,500 (or ₦37,500 bridge now + ₦75,000 on Nov 1).'
      };
    }
    // Joshua Ogba
    else if (s.id === 'std-1013-jogb' || sName.includes('joshua ogba')) {
      s.id = 'std-1013-jogb';
      s.classesAttended = 14;
      s.metrics = s.metrics || {};
      s.metrics.attended = 14;
      s.classroomLink = 'https://meet.google.com/yko-xwce-ugd';
      s.meetLink = 'https://meet.google.com/yko-xwce-ugd';
      s.startDate = '2026-10-03';
      s.billing = {
        firstClassDate: '2026-10-03',
        anchorDay: 3,
        cycleStartDate: '2026-10-03',
        nextDueDate: '2027-01-03',
        paidThrough: '2026-12-31',
        annualPaid: true,
        monthlyFee: 35000,
        status: 'paid_annual',
        notes: 'Paid for the rest of 2026 (through Dec 31, 2026).'
      };
    }
    // Gbolade Okesanjo
    else if (s.id === 'std-1012-goke' || sName.includes('gbolade')) {
      s.id = 'std-1012-goke';
      s.classesAttended = 4;
      s.metrics = s.metrics || {};
      s.metrics.attended = 4;
      s.classroomLink = 'Physical Lab';
      s.meetLink = 'Physical Lab';
      s.startDate = '2026-10-04';
      s.billing = {
        firstClassDate: '2026-10-04',
        anchorDay: 4,
        cycleStartDate: '2026-10-04',
        nextDueDate: '2026-11-04',
        monthlyFee: 48000,
        status: 'active',
        paidThrough: '2026-11-04',
        notes: 'Physical sessions paid. Next cycle due Nov 4, 2026.'
      };
    }
    // Momooreoluwa
    else if (s.id === 'std-1011-momo' || sName.includes('momo')) {
      s.id = 'std-1011-momo';
      s.classesAttended = 6;
      s.metrics = s.metrics || {};
      s.metrics.attended = 6;
      s.startDate = '2026-10-05';
      s.billing = {
        firstClassDate: '2026-10-05',
        anchorDay: 5,
        cycleStartDate: '2026-10-05',
        nextDueDate: '2026-11-05',
        monthlyFee: 48000,
        status: 'active',
        uncollectedOctober: true,
        notes: 'Paid for 1 month initially. Next cycle due Nov 5, 2026.'
      };
    }
    // General coders
    else {
      if (!s.tier) s.tier = s.age >= 14 ? 'advanced' : s.age >= 10 ? 'intermediate' : 'beginner';
      if (!s.billing) {
        s.billing = {
          monthlyFee: s.tier === 'advanced' ? 120000 : s.tier === 'intermediate' ? 75000 : 48000,
          tier: s.tier,
          uncollectedOctober: true,
          status: 'pending'
        };
      }
    }
    return s;
  });
}

// 1. Update DEFAULT_DATA.students
const dMarker = '"students": [';
const dStart = code.indexOf(dMarker);
if (dStart !== -1) {
  let dEnd = -1;
  let count = 0;
  for (let i = dStart + '"students": '.length; i < code.length; i++) {
    if (code[i] === '[') count++;
    else if (code[i] === ']') {
      count--;
      if (count === 0) {
        dEnd = i + 1;
        break;
      }
    }
  }
  if (dEnd !== -1) {
    const dSlice = code.slice(dStart + '"students": '.length, dEnd);
    let dArr = JSON.parse(dSlice);
    
    // Ensure Pearl, Joshua, Gbolade are in DEFAULT_DATA.students if not present
    if (!dArr.some(s => s.id === 'std-1007-r4cv')) {
      dArr.push({ id: 'std-1007-r4cv', firstName: 'Babalola', lastName: 'Oluwadunmininu Pearl' });
    }
    if (!dArr.some(s => s.id === 'std-1013-jogb')) {
      dArr.push({ id: 'std-1013-jogb', firstName: 'Joshua', lastName: 'Ogba' });
    }
    if (!dArr.some(s => s.id === 'std-1012-goke')) {
      dArr.push({ id: 'std-1012-goke', firstName: 'Gbolade', lastName: 'Okesanjo' });
    }

    dArr = patchStudentsList(dArr);
    code = code.slice(0, dStart + '"students": '.length) + JSON.stringify(dArr, null, 2) + code.slice(dEnd);
    console.log('Successfully patched DEFAULT_DATA.students!');
  }
}

// 2. Update coreEnrolledStudents
const cMarker = 'const coreEnrolledStudents = [';
const cStart = code.indexOf(cMarker);
if (cStart !== -1) {
  let cEnd = -1;
  let count = 0;
  for (let i = cStart + 'const coreEnrolledStudents = '.length; i < code.length; i++) {
    if (code[i] === '[') count++;
    else if (code[i] === ']') {
      count--;
      if (count === 0) {
        cEnd = i + 1;
        break;
      }
    }
  }
  if (cEnd !== -1) {
    const cSlice = code.slice(cStart + 'const coreEnrolledStudents = '.length, cEnd);
    let cArr = JSON.parse(cSlice);
    cArr = patchStudentsList(cArr);
    code = code.slice(0, cStart + 'const coreEnrolledStudents = '.length) + JSON.stringify(cArr, null, 2) + code.slice(cEnd);
    console.log('Successfully patched coreEnrolledStudents!');
  }
}

// Bump DB sync version
code = code.replace(/DB_SYNC_VERSION = ['"][^'"]+['"]/, `DB_SYNC_VERSION = '2026.10.26.v103_full_operational'`);

fs.writeFileSync(enginePath, code, 'utf8');
console.log('dashboard-engine.js written successfully.');

// Minify dashboard-engine.js
const terserBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'terser.cmd' : 'terser');
const dashMin = path.join(__dirname, '../assets/js/dashboard-engine.min.js');
execSync(`"${terserBin}" "${enginePath}" -o "${dashMin}" --compress --mangle`);
console.log('dashboard-engine.min.js re-minified (' + fs.statSync(dashMin).size + ' bytes).');
