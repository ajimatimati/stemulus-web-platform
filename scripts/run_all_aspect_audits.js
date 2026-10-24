/**
 * MASTER REGRESSION RUNNER: ALL 9 ASPECTS AUDIT SUITE
 * Executes all 9 portal audit suites sequentially with consolidated reporting.
 */

const { execSync } = require('child_process');
const path = require('path');

const aspectSuites = [
  { aspect: 'Aspect 1', name: "Coders' Virtual Classroom & Live Learning Companion", script: 'scripts/audit_aspect1_classroom.js' },
  { aspect: 'Aspect 2', name: "Coders' Progress, Portfolio & Technology Passport", script: 'scripts/audit_aspect2_progress.js' },
  { aspect: 'Aspect 3', name: "Tutors' Main Operational Hub & Active Sessions", script: 'scripts/audit_aspect3_tutor.js' },
  { aspect: 'Aspect 4', name: "Tutors' Attendance Logging & Academic Reporting", script: 'scripts/audit_aspect4_attendance.js' },
  { aspect: 'Aspect 5', name: "Tutors' Emergency Coverage & Faculty Chat Direct Line", script: 'scripts/audit_aspect5_coverage_chat.js' },
  { aspect: 'Aspect 6', name: "Parents' Command Center & Multi-Child Overview", script: 'scripts/audit_aspect6_parent_dashboard.js' },
  { aspect: 'Aspect 7', name: "Parents' Smart Reschedule Concierge", script: 'scripts/audit_aspect7_reschedule_concierge.js' },
  { aspect: 'Aspect 8', name: "Parents' Tuition Billing, Invoicing & Receipts Vault", script: 'scripts/audit_aspect8_billing_vault.js' },
  { aspect: 'Aspect 9', name: "Cross-Portal Visual Harmony, Performance & Production Build", script: 'scripts/audit_aspect9_visual_harmony_production.js' }
];

console.log('================================================================');
console.log('🚀 EXECUTING COMPLETE 9-ASPECT PORTAL AUDIT SUITE IN SEQUENCE...');
console.log('================================================================\n');

const results = [];
let overallFailed = 0;

for (const suite of aspectSuites) {
  console.log(`----------------------------------------------------------------`);
  console.log(`RUNNING: [${suite.aspect}] ${suite.name}`);
  console.log(`Script:  ${suite.script}`);
  console.log(`----------------------------------------------------------------`);
  
  const startTime = Date.now();
  try {
    const stdout = execSync(`node "${path.join(__dirname, '..', suite.script)}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [PASSED] ${suite.aspect} (${duration}s)`);
    results.push({ aspect: suite.aspect, name: suite.name, status: 'PASSED', duration: `${duration}s` });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ [FAILED] ${suite.aspect} (${duration}s)`);
    console.error(err.stdout || err.message);
    results.push({ aspect: suite.aspect, name: suite.name, status: 'FAILED', duration: `${duration}s` });
    overallFailed++;
  }
}

console.log('\n================================================================');
console.log('🏆 9-ASPECT QUALITY ASSURANCE & UX AUDIT SUMMARY REPORT');
console.log('================================================================');
results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(` ${icon} [${r.status}] ${r.aspect}: ${r.name} (${r.duration})`);
});
console.log('================================================================\n');

if (overallFailed > 0) {
  console.error(`💥 ${overallFailed} aspect audit(s) failed.`);
  process.exit(1);
} else {
  console.log('🎉 100% OF ALL 9 PORTAL AUDIT SUITES PASSED FLAWLESSLY WITH ZERO ISSUES!');
  process.exit(0);
}
