const fs = require('fs');
const path = require('path');

// Mock localStorage and window
const store = {};
global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
};
global.sessionStorage = {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {}
};
global.window = {
    location: { pathname: '/admin-dashboard.html', protocol: 'http:' },
    dispatchEvent: () => {}
};
global.CustomEvent = class {};

// Load dashboard engine and badge engine onto global
const dashCode = fs.readFileSync('assets/js/dashboard-engine.js', 'utf8');
const badgeCode = fs.readFileSync('assets/js/badge-passport-engine.js', 'utf8');

// assign to global
const runDash = new Function(dashCode + '\nreturn DashboardEngine;');
global.DashboardEngine = runDash();

const runBadge = new Function(badgeCode + '\nreturn BadgePassportEngine;');
global.BadgePassportEngine = runBadge();

const students = DashboardEngine.getStudents();
const pearl = students.find(s => s.id === 'std-1007-r4cv');
console.log('--- PEARL RECORD ---');
console.log('Pearl Name:', pearl.firstName, pearl.lastName);
console.log('Pearl classes attended in DB:', pearl.classesAttended, 'metrics.attended:', pearl.metrics.attended);
console.log('Pearl currentMonth:', pearl.currentMonth);
console.log('Pearl badgeLevel:', pearl.badgeLevel);
console.log('Pearl earnedBadges:', pearl.earnedBadges);
console.log('Pearl billing nextDueDate:', pearl.billing.nextDueDate, 'status:', pearl.billing.status);

const attendance = DashboardEngine.getAttendanceRecords();
const pearlAtt = attendance.filter(a => a.studentId === 'std-1007-r4cv' || (a.studentName && a.studentName.includes('Pearl')));
console.log('Total verified attendance records for Pearl:', pearlAtt.length);

const passport = BadgePassportEngine.getStudentPassport(pearl);
console.log('\n--- PEARL PASSPORT CALCULATION ---');
console.log('Passport Unlocked Count:', passport.unlockedCount);
console.log('Passport Current Era:', passport.currentEra.name);
console.log('Passport Current Badge:', passport.currentBadge.name, `(Era: ${passport.currentBadge.eraName})`);
console.log('First 6 badges unlocked status:\n', passport.badges.slice(0, 6).map(b => `  - ${b.name}: ${b.isUnlocked ? 'UNLOCKED' : 'LOCKED'}`).join('\n'));

// Also check Joshua Ogba
const joshua = students.find(s => s.id === 'std-1013-jogb');
console.log('\n--- JOSHUA RECORD ---');
console.log('Joshua Name:', joshua.firstName, joshua.lastName);
console.log('Joshua Billing status:', joshua.billing.status, 'paidThrough:', joshua.billing.paidThrough, 'nextDueDate:', joshua.billing.nextDueDate);
const joshuaAtt = attendance.filter(a => a.studentId === 'std-1013-jogb' || (a.studentName && a.studentName.includes('Joshua')));
console.log('Total verified attendance records for Joshua:', joshuaAtt.length);

// Check Gbolade
const gbolade = students.find(s => s.id === 'std-1008-a0lp');
console.log('\n--- GBOLADE RECORD ---');
console.log('Gbolade Name:', gbolade.firstName, gbolade.lastName);
console.log('Gbolade Billing status:', gbolade.billing.status, 'nextDueDate:', gbolade.billing.nextDueDate, 'sessionType:', gbolade.billing.sessionType);
const gboladeAtt = attendance.filter(a => a.studentId === 'std-1008-a0lp' || (a.studentName && a.studentName.includes('Gbolade')));
console.log('Total verified attendance records for Gbolade:', gboladeAtt.length);

// Check Momoore
const momoore = students.find(s => s.id === 'std-1011-tq1u');
console.log('\n--- MOMOORE RECORD ---');
console.log('Momoore Name:', momoore.firstName, momoore.lastName);
console.log('Momoore Billing status:', momoore.billing.status, 'nextDueDate:', momoore.billing.nextDueDate);
const momooreAtt = attendance.filter(a => a.studentId === 'std-1011-tq1u' || (a.studentName && a.studentName.includes('Momoore')));
console.log('Total verified attendance records for Momoore:', momooreAtt.length);

// Verify ignored students have zero attendance records
const ignoredAtt = attendance.filter(a => {
    const sName = (a.studentName || '').toLowerCase();
    return sName.includes('david djoka') || sName.includes('junayd') || sName.includes('king myles');
});
console.log('\n--- EXCLUSION CHECK ---');
console.log('Ignored students (David, Junayd, King Myles) attendance count in DB:', ignoredAtt.length, '(Must be 0)');
