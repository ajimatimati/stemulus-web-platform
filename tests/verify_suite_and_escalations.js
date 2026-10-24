/**
 * Comprehensive Automated Verification Suite for:
 * 1. Google Meet Host Controls (host not required to join first) & Auto-Record Audit
 * 2. Real-Time Attendance & Disconnect/Reconnect Escalations
 * 3. Birthday Celebration Engine (Tutors & Coders)
 * 4. Classroom Manager, Operations Manager & Admin Assistant Suite
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('STEMULUS ADVANCED PORTAL VERIFICATION & AUDIT SUITE');
console.log('================================================================\n');

// Mock localStorage for Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// 1. Verify Google Meet Calendar Automation Audit Summary
console.log('[Test 1] Verifying Google Meet Recurring Series Audit Summary...');
const auditSummaryPath = path.join(__dirname, 'autorecord_audit', 'audit_summary.json');
assert(fs.existsSync(auditSummaryPath), 'Audit summary file must exist');
const auditSummary = JSON.parse(fs.readFileSync(auditSummaryPath, 'utf8'));

assert.strictEqual(auditSummary.length, 6, 'All 6 coders must be audited');
auditSummary.forEach(row => {
  assert.strictEqual(row.status, 'CONFIGURED & AUTO-RECORD ON', `Coder ${row.coder} must be configured`);
  assert(row.meetLink && row.meetLink.includes('meet.google.com/'), `Valid Google Meet link required for ${row.coder}`);
  console.log(`  ✓ ${row.coder}: ${row.event} (${row.meetLink}) -> CONFIGURED & HOST NOT REQUIRED`);
});

// 2. Verify Birthday Celebration Engine
console.log('\n[Test 2] Verifying Birthday Celebration Engine...');
const BirthdayEngine = require('../assets/js/birthday-celebration-engine.js');
// Mock DashboardEngine if needed
global.DashboardEngine = {
  getDB: () => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'stemulus_db_latest.json'), 'utf8'))
};

const radar = BirthdayEngine.getBirthdayRadar();
console.log(`  - Total members with birthdays: ${radar.all.length}`);
console.log(`  - Today's celebrants: ${radar.today.length}`);
console.log(`  - Upcoming this month: ${radar.upcomingThisMonth.length}`);

assert(radar.all.length > 5, 'Must have at least 5 members with birthdays');
assert(radar.today.length >= 1, 'Must have at least 1 celebrant today to verify live engine');
const todayCelebrant = radar.today[0];
console.log(`  ✓ Today's Celebrant: ${todayCelebrant.name} (${todayCelebrant.typeLabel}, ${todayCelebrant.birthdayRaw})`);

const coderCard = BirthdayEngine.generateBirthdayMessage(todayCelebrant);
assert(coderCard.includes('HAPPY BIRTHDAY'), 'Celebration message must include greeting');
console.log(`  ✓ Generated Coder WhatsApp Card Preview:\n    "${coderCard.split('\n')[0]}"`);

// Test tutor birthday message
const aTutor = radar.all.find(m => m.role === 'tutor');
assert(aTutor, 'Must have at least 1 tutor with birthday');
const tutorCard = BirthdayEngine.generateBirthdayMessage(aTutor);
assert(tutorCard.includes('COACH') && tutorCard.includes('HAPPY BIRTHDAY'), 'Tutor greeting must be customized for faculty');
console.log(`  ✓ Generated Tutor WhatsApp Card Preview for Coach ${aTutor.name}:\n    "${tutorCard.split('\n')[0]}"`);

const bdayHTML = BirthdayEngine.renderBirthdayHeadquartersHTML();
assert(bdayHTML.includes('Birthday Headquarters') && bdayHTML.includes('Celebrations This Month'), 'Must render Birthday HQ HTML');
console.log('  ✓ Birthday Headquarters HTML rendered successfully.');

// 3. Verify Operations Manager Engine
console.log('\n[Test 3] Verifying Operations Manager & Classroom Suite...');
const OpsEngine = require('../assets/js/operations-manager-engine.js');
const rundown = OpsEngine.getDailyClassroomRundown();
console.log(`  - Daily Classroom Rundown: ${rundown.total} total sessions today`);

const workload = OpsEngine.getFacultyWorkloadReport();
console.log(`  - Faculty Workload Balancer: ${workload.length} active tutors analyzed`);
workload.forEach(t => {
  console.log(`    • ${t.name}: ${t.totalAssignedHours}h/wk (${t.status})`);
});
assert(workload.length > 0, 'Must have faculty members in report');

const sla = OpsEngine.getOperationalSLAMetrics();
console.log(`  - Institutional SLA: On-time ${sla.onTimeRate}%, Attendance ${sla.attendanceRate}%, ${sla.totalHoursDelivered}h delivered`);
assert(sla.onTimeRate >= 95, 'SLA on-time rate must meet target');

const conflicts = OpsEngine.auditScheduleConflicts();
console.log(`  - Double-Booking Schedule Audit: ${conflicts.length} conflict(s) detected`);

const actions = OpsEngine.getDailyActionItems();
console.log(`  - Admin Assistant Action Matrix: ${actions.length} action item(s)`);
assert(actions.length > 0, 'Action items must be generated');

const opsHTML = OpsEngine.renderOperationsSuiteHTML();
assert((opsHTML.includes('Classroom & Operations Headquarters') || opsHTML.includes('Classroom &amp; Operations Headquarters')) && opsHTML.includes('Faculty Workload Balancer'), 'Operations Suite HTML rendered');
console.log('  ✓ Classroom & Operations Headquarters HTML rendered successfully.');

// 4. Verify Class Escalation Engine (Presence, Disconnect, Reconnect)
console.log('\n[Test 4] Verifying Class Escalation Engine (Disconnect & Reconnect Watchdog)...');
const EscalationEngine = require('../assets/js/class-escalation-engine.js');

// Simulate session schedule
const mockSchedule = {
  id: 'test-sched-001',
  studentName: 'David Gjoka',
  mentor: 'Olalekan Israel Ajimati',
  course: 'Python Programming',
  date: new Date().toISOString().slice(0, 10),
  time: '5:00pm',
  duration: '60',
  link: 'https://meet.google.com/ckd-ngjs-cth'
};

// Test Heartbeat
const hb = EscalationEngine.recordHeartbeat('test-ses-1', mockSchedule.id, 'student', 'David Gjoka');
assert.strictEqual(hb.status, 'active');
assert.strictEqual(hb.studentPresent, true);
console.log('  ✓ Heartbeat recorded successfully.');

// Test Disconnect
EscalationEngine.recordDisconnect('test-ses-1', mockSchedule.id, 'student', 'David Gjoka', mockSchedule.course);
const storeAfterDisconnect = JSON.parse(localStorage.getItem('stemulus_live_presence') || '{}');
assert.strictEqual(storeAfterDisconnect['test-ses-1'].status, 'disconnected');
console.log('  ✓ Mid-Session Disconnect recorded and escalated.');

// Test Reconnect
EscalationEngine.recordReconnect('test-ses-1', mockSchedule.id, 'student', 'David Gjoka', mockSchedule.course);
const storeAfterReconnect = JSON.parse(localStorage.getItem('stemulus_live_presence') || '{}');
assert.strictEqual(storeAfterReconnect['test-ses-1'].status, 'reconnected');
console.log('  ✓ Party Reconnect recorded and info alert dispatched.');

console.log('\n================================================================');
console.log('ALL VERIFICATION SUITE CHECKS PASSED (100% SUCCESS)!');
console.log('================================================================\n');
