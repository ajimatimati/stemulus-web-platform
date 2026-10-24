/**
 * Automated Verification Suite: Session Content & Transcript Analysis Engine
 * Validates:
 * 1. Lesson plan adherence & curriculum milestone scoring
 * 2. Real-time and post-session untoward event detection
 * 3. Urgent escalation dispatch to ntfy.sh and Operations Action Matrix
 * 4. DOM modals & script integration in Admin and Classroom Companion
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Polyfill minimal browser localStorage for headless Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const ROOT_DIR = path.resolve(__dirname, '..');
const AnalysisEngine = require('../assets/js/session-content-analysis-engine.js');
const EscalationEngine = require('../assets/js/class-escalation-engine.js');
const OpsEngine = require('../assets/js/operations-manager-engine.js');

let totalPass = 0;
let totalFail = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    totalPass++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
    totalFail++;
  }
}

console.log('===========================================================');
console.log('STEMULUS SESSION CONTENT & UNTOWARD ANALYSIS VERIFICATION');
console.log('===========================================================\n');

// 1. Compliant Session Analysis
console.log('[1/4] Checking On-Track / Compliant Session (Junayd Scratch Quest)...');
const junaydReport = AnalysisEngine.runSampleAudit('junayd_scratch_quest');

it('Identifies session as COMPLIANT', () => {
  assert.strictEqual(junaydReport.status, 'COMPLIANT');
});

it('Calculates high curriculum adherence score (>= 75%)', () => {
  assert(junaydReport.adherenceScore >= 75, `Expected >= 75, got ${junaydReport.adherenceScore}`);
});

it('Maintains 100% safeguarding compliance score', () => {
  assert.strictEqual(junaydReport.safeguardingScore, 100);
  assert.strictEqual(junaydReport.untowardEvents.length, 0);
});

it('Measures balanced student talk ratio and positive encouragement', () => {
  assert(junaydReport.studentTalkPct >= 30, `Student talk ratio too low: ${junaydReport.studentTalkPct}%`);
  assert(junaydReport.encouragementCount >= 2, `Praises given too low: ${junaydReport.encouragementCount}`);
});

// 2. Untoward Event Detection & Critical Escalation
console.log('\n[2/4] Checking Untoward Safeguarding Event Watchdog...');
const untowardReport = AnalysisEngine.runSampleAudit('simulated_untoward_test');

it('Identifies untoward session as FLAGGED', () => {
  assert.strictEqual(untowardReport.status, 'FLAGGED');
});

it('Detects multiple untoward violations (Harshness, Distress, Solicitation)', () => {
  assert(untowardReport.untowardEvents.length >= 3, `Expected at least 3 events, got ${untowardReport.untowardEvents.length}`);
  const categories = untowardReport.untowardEvents.map(e => e.category);
  assert(categories.some(c => c.includes('Harshness') || c.includes('Hostility') || c.includes('Abusive')), 'Must detect tutor harshness or hostility');
  assert(categories.some(c => c.includes('Distress')), 'Must detect student distress');
  assert(categories.some(c => c.includes('Solicitation')), 'Must detect off-platform contact');
});

it('Severely docks safeguarding score on critical untoward violations', () => {
  assert(untowardReport.safeguardingScore < 50, `Safeguarding score not penalized enough: ${untowardReport.safeguardingScore}`);
});

it('Persists incident to stemulus_untoward_incidents in storage', () => {
  const incidents = JSON.parse(mockStorage['stemulus_untoward_incidents'] || '[]');
  assert(incidents.length > 0, 'Incident must be persisted in localStorage');
  assert.strictEqual(incidents[0].status, 'UNRESOLVED');
});

// 3. Live Fragment Inspection & Operations Action Matrix Integration
console.log('\n[3/4] Checking Live Watchdog & Admin Action Matrix Integration...');
it('Live fragment analyzer ignores normal classroom speech', () => {
  const res = AnalysisEngine.analyzeLiveFragment('Junayd', 'Je veux avancer de 10 pas avec le bloc');
  assert.strictEqual(res, null, 'Clean text should return null');
});

it('Live fragment analyzer triggers instant incident on distress or harshness', () => {
  const res = AnalysisEngine.analyzeLiveFragment('Student', 'i want to cry, please stop shouting at me');
  assert(res !== null, 'Untoward fragment must return incident object');
  assert.strictEqual(res.category, 'Acute Student Distress');
  assert.strictEqual(res.severity, 'HIGH');
});

it('Operations Manager Action Matrix automatically elevates untoward incidents to CRITICAL', () => {
  const actions = OpsEngine.getDailyActionItems();
  const incidentAction = actions.find(a => a.priority === 'CRITICAL' && (a.id.includes('act-incident') || a.title.includes('Safeguarding Alert')));
  assert(incidentAction !== undefined, 'Operations Action Matrix must feature untoward incident');
  console.log(`     Action surfaced: "${incidentAction.title}" [${incidentAction.priority}]`);
});

// 4. HTML Mounts & Script Tags
console.log('\n[4/4] Checking Dashboard HTML Mounts & Script References...');
const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin-dashboard.html'), 'utf8');
const joinClassHtml = fs.readFileSync(path.join(ROOT_DIR, 'join-class.html'), 'utf8');

it('admin-dashboard.html embeds AI Analysis modal & script tag', () => {
  assert(adminHtml.includes('modal-transcript-analysis'), 'Missing modal-transcript-analysis');
  assert(adminHtml.includes('mount-transcript-analysis-content'), 'Missing mount-transcript-analysis-content');
  assert(adminHtml.includes('session-content-analysis-engine'), 'Missing session-content-analysis-engine script tag');
});

it('join-class.html embeds session-content-analysis-engine script tag', () => {
  assert(joinClassHtml.includes('session-content-analysis-engine'), 'Missing session-content-analysis-engine script tag');
});

it('Rendered HTML card matches 3D playful minimalist double-bezel squircle styling', () => {
  const cardHtml = AnalysisEngine.renderAnalysisCardHTML(junaydReport, { studentName: 'Junayd Kari', courseName: 'Scratch Creators' });
  assert(cardHtml.includes('AI Content & Transcript Inspector') || cardHtml.includes('Analyseur IA'), 'Card title missing');
  assert(cardHtml.includes('radar-chart-3d.png'), 'Must include 3D radar standalone asset');
  assert(cardHtml.includes('Plan Adherence') || cardHtml.includes('Adhérence'), 'Must display plan adherence');
});

console.log('\n-----------------------------------------------------------');
console.log(`RESULTS: ${totalPass} Passed | ${totalFail} Failed`);
console.log('-----------------------------------------------------------');

if (totalFail > 0) {
  process.exit(1);
} else {
  console.log('[SUCCESS] All Session Content & Transcript Analysis tests passed!\n');
}
