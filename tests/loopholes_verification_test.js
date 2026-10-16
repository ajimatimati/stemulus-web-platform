/**
 * System Loopholes Fixes & Operational Escalation Verification Suite
 */

const assert = require('assert');
const path = require('path');

// 1. Verify BillingEngine day clamping & anchorDay preservation
const BillingEngine = require('../assets/js/billing-engine.js');

console.log('--- [VERIFY 1] Calendar Day-Clamping & Anchor Day Persistence ---');
const jan31 = '2026-01-31';
const feb28 = BillingEngine.addMonths(jan31, 1, 31);
assert.strictEqual(feb28, '2026-02-28', 'Jan 31 + 1mo should clamp to Feb 28, not overflow to March');
console.log('✓ Jan 31 + 1mo clamped cleanly:', feb28);

const mar31 = BillingEngine.addMonths(feb28, 1, 31);
assert.strictEqual(mar31, '2026-03-31', 'Feb 28 + 1mo with anchor 31 should restore to March 31');
console.log('✓ Feb 28 + 1mo with anchor 31 restored cleanly:', mar31);

const aug31 = '2026-08-31';
const sep30 = BillingEngine.addMonths(aug31, 1, 31);
assert.strictEqual(sep30, '2026-09-30', 'Aug 31 + 1mo should clamp to Sep 30, not overflow to October');
console.log('✓ Aug 31 + 1mo clamped cleanly:', sep30);

const oct31 = BillingEngine.addMonths(sep30, 1, 31);
assert.strictEqual(oct31, '2026-10-31', 'Sep 30 + 1mo with anchor 31 should restore to October 31');
console.log('✓ Sep 30 + 1mo with anchor 31 restored cleanly:', oct31);

// 2. Verify ClassEscalationEngine states & escalation logic
const ClassEscalationEngine = require('../assets/js/class-escalation-engine.js');

console.log('\n--- [VERIFY 2] Class Escalation Ladder & Presence Detection ---');
const mockSchedule = {
  id: 'sch-test-999',
  studentId: 'std-1001',
  studentName: 'Daniel M.',
  course: 'Python Programming',
  date: new Date().toISOString().slice(0, 10),
  time: '10:00',
  duration: '60',
  mentor: 'Sarah Jane',
  parentEmail: 'parent@stemuluskidstech.com'
};

// Simulation A: Tutor joined, student absent after 8 mins
const stateA = ClassEscalationEngine.evaluateSessionState(
  { ...mockSchedule, time: new Date(Date.now() - 8 * 60000).toTimeString().slice(0, 5) },
  { tutorJoinedAt: new Date(Date.now() - 8 * 60000).toISOString(), studentJoinedAt: null }
);
assert.strictEqual(stateA.status, 'STUDENT_ABSENT_ALERT');
assert.strictEqual(stateA.alertType, 'parent_nudge');
console.log('✓ T+8m missing coder correctly triggers STUDENT_ABSENT_ALERT & parent nudge');

// Simulation B: Tutor not joined after 6 mins
const stateB = ClassEscalationEngine.evaluateSessionState(
  { ...mockSchedule, time: new Date(Date.now() - 6 * 60000).toTimeString().slice(0, 5) },
  { tutorJoinedAt: null, studentJoinedAt: null }
);
assert.strictEqual(stateB.status, 'TUTOR_ABSENT_ALERT');
assert.strictEqual(stateB.alertType, 'tutor_alert');
console.log('✓ T+6m missing tutor correctly triggers TUTOR_ABSENT_ALERT');

// Simulation C: Tutor not joined after 12 mins -> Critical Incident
const stateC = ClassEscalationEngine.evaluateSessionState(
  { ...mockSchedule, time: new Date(Date.now() - 12 * 60000).toTimeString().slice(0, 5) },
  { tutorJoinedAt: null, studentJoinedAt: null }
);
assert.strictEqual(stateC.status, 'CRITICAL_INCIDENT');
assert.strictEqual(stateC.alertType, 'ops_intervention');
console.log('✓ T+12m missing tutor correctly escalates to CRITICAL_INCIDENT ops intervention');

// Simulation D: Issue 1-click makeup reschedule token
const token = ClassEscalationEngine.issueMakeupToken(mockSchedule, 'Tutor Unreachable');
assert(token.tokenCode.startsWith('MAKEUP-'), 'Makeup token should generate unique MAKEUP- prefix');
console.log('✓ 1-Click makeup reschedule token issued:', token.tokenCode);

// 3. Verify HTML sanitization
console.log('\n--- [VERIFY 3] Global XSS Sanitizer Shield ---');
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  };
}
const DashboardEngine = require('../assets/js/dashboard-engine.js');
const rawAttack = '<script>alert("xss")</script><img src=x onerror=steal()>';
const safeClean = DashboardEngine.escapeHtml(rawAttack);
assert(!safeClean.includes('<script>'), 'Script tags must be escaped');
assert(!safeClean.includes('<img'), 'Img tags must be escaped');
assert(safeClean.includes('&lt;script&gt;'), 'Html entities must replace angle brackets');
console.log('✓ XSS Attack string safely escaped:', safeClean);

console.log('\n============================================================');
console.log('🏆 ALL SYSTEM LOOPHOLE FIXES VERIFIED 100% SUCCESFULLY! 🏆');
console.log('============================================================\n');
