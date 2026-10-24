/**
 * Comprehensive Unit & Integration Test for Sentinel Safeguard Engine & Operations Manager
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { SentinelSafeguardEngine } = require('../scripts/sentinel_safeguard_engine');
const SessionContentAnalysisEngine = require('../assets/js/session-content-analysis-engine');

console.log('--- 🧪 STARTING SENTINEL SAFEGUARD & OPERATIONS TESTS ---');

let passedTests = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Initial State & Arrival Grace Period Test
it('Never concludes prematurely during 20-minute arrival grace period', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Olalekan Israel Ajimati'
  });

  // Bot joins empty room (activeHumansCount = 1: only the bot)
  const conclusion1 = sentinel.canSafelyConclude(1, false);
  assert.strictEqual(conclusion1.canConclude, false, 'Must not conclude during grace period');
  assert.ok(conclusion1.reason.includes('grace period'), 'Reason should cite grace period');
});

// 2. Class Activity Trigger
it('Activates session monitoring when participants join or speak', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Olalekan Israel Ajimati'
  });

  assert.strictEqual(sentinel.hasSeenClassActivity, false);

  // Both participants arrive
  sentinel.canSafelyConclude(3, false); // bot + tutor + student = 3
  assert.strictEqual(sentinel.hasSeenClassActivity, true, 'Should mark class active when 2+ humans present');
});

// 3. Staying in Call Guarantee
it('Stays in call while teacher and coder are present', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Olalekan Israel Ajimati'
  });

  sentinel.processLiveTurn('Coach Olalekan', 'Bonjour Junayd! Welcome to class.');
  assert.strictEqual(sentinel.hasSeenClassActivity, true);

  // 2 humans present in room
  const check = sentinel.canSafelyConclude(3, false);
  assert.strictEqual(check.canConclude, false, 'Must never leave while participants are in the room');
});

// 4. Inappropriate / Sexual Language Detection & Immediate Action
it('Detects sexual/inappropriate language, flags CRITICAL, and sets immediate action', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Olalekan Israel Ajimati'
  });

  const incident = sentinel.processLiveTurn('Participant', 'show me your body right now');
  assert.ok(incident, 'Incident must be returned');
  assert.strictEqual(incident.category, 'Sexual / Inappropriate Language');
  assert.strictEqual(incident.severity, 'CRITICAL');
  assert.ok(incident.immediateAction.includes('CHILD SAFETY PROTOCOL'), 'Immediate action must specify child safety protocol');
  assert.strictEqual(sentinel.incidents.length, 1);
});

// 5. Violent / Threatening Language Detection
it('Detects violent language, flags CRITICAL, and sets emergency action', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Python Programming',
    studentName: 'David Gjoka',
    tutorName: 'Coach'
  });

  const incident = sentinel.processLiveTurn('Speaker', 'I will punch you and break your bones');
  assert.ok(incident, 'Incident must be caught');
  assert.strictEqual(incident.category, 'Violent / Threatening Language');
  assert.strictEqual(incident.severity, 'CRITICAL');
  assert.ok(incident.immediateAction.includes('SAFETY INTERVENTION'));
});

// 6. Unauthorized Contact Solicitation
it('Detects off-platform contact solicitation (Discord/Phone)', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Roblox Studio',
    studentName: 'Joshua Oyewole',
    tutorName: 'Coach'
  });

  const incident = sentinel.processLiveTurn('Tutor', 'Add me on discord so we can talk outside class');
  assert.ok(incident);
  assert.strictEqual(incident.category, 'Unauthorized Contact Solicitation');
  assert.strictEqual(incident.severity, 'CRITICAL');
  assert.ok(incident.immediateAction.includes('COPPA SAFEGUARDING'));
});

// 7. Foul / Abusive Language Detection
it('Detects foul language and hostility in English and French', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Coach'
  });

  const incident1 = sentinel.processLiveTurn('Speaker', 'Shut up, you are stupid and useless');
  assert.ok(incident1);
  assert.strictEqual(incident1.category, 'Foul / Abusive Language / Hostility');
  assert.strictEqual(incident1.severity, 'HIGH');

  const incident2 = sentinel.processLiveTurn('Speaker', 'Bordel de merde tais-toi');
  assert.ok(incident2);
  assert.strictEqual(incident2.severity, 'HIGH');
});

// 8. 5-Minute Student Inactivity Detection
it('Triggers high-priority admin alert after 5 minutes of student silence', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Web Development',
    studentName: 'Momoreoluwa Ojo',
    tutorName: 'Coach'
  });

  // Activate session
  sentinel.processLiveTurn('Coach', 'Welcome Momoreoluwa!');
  assert.strictEqual(sentinel.hasSeenClassActivity, true);

  // Simulate 5.5 minutes of student silence
  sentinel.lastStudentSpokeTime = Date.now() - (330 * 1000); // 330 seconds ago
  sentinel.checkPeriodicWatchdog();

  const inact = sentinel.incidents.find(i => i.category === 'Student Inactivity (5+ Mins)');
  assert.ok(inact, 'Must flag student inactivity after 5 minutes');
  assert.strictEqual(inact.severity, 'HIGH');
  assert.ok(inact.immediateAction.includes('ENGAGEMENT ASSISTANCE'), 'Must prescribe engagement assistance');
});

// 9. 20-Minute Progress Stagnation Watchdog
it('Triggers progress stagnation alert when minimal keywords detected after 20 minutes', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Coach'
  });

  // Simulate session running for 21 minutes with zero coding keywords
  sentinel.sessionStartTime = Date.now() - (21 * 60 * 1000);
  sentinel.checkPeriodicWatchdog();

  const prog = sentinel.incidents.find(i => i.category === 'Curriculum Progress Stagnation');
  assert.ok(prog, 'Must flag progress stagnation after 20 minutes');
  assert.strictEqual(prog.severity, 'MEDIUM');
  assert.ok(prog.immediateAction.includes('PACING ADJUSTMENT'));
});

// 10. Departure Confirmation (Requires 2 consecutive checks)
it('Requires 2 consecutive checks before concluding when participants depart', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Coach Olalekan'
  });

  sentinel.processLiveTurn('Coach Olalekan', 'Great job today Junayd!');
  assert.strictEqual(sentinel.hasSeenClassActivity, true);

  // Check 1: Everyone left (only bot remains = humanCount 1)
  const check1 = sentinel.canSafelyConclude(1, false);
  assert.strictEqual(check1.canConclude, false, 'First check must confirm persistence');
  assert.strictEqual(sentinel.consecutiveDepartureChecks, 1);

  // Check 2: Still empty
  const check2 = sentinel.canSafelyConclude(1, false);
  assert.strictEqual(check2.canConclude, true, 'Second consecutive check concludes cleanly');
  assert.ok(check2.reason.includes('Both teacher and coder have left'));
});

// 11. Closing Remarks & Homework Extraction
it('Captures closing remarks, bye-byes, and extracts assigned homework', () => {
  const sentinel = new SentinelSafeguardEngine({
    courseName: 'Scratch Creators',
    studentName: 'Junayd Kari',
    tutorName: 'Olalekan Israel Ajimati'
  });

  sentinel.processLiveTurn('Coach Olalekan', 'Your assignment for next week is to animate a dinosaur sprite. Bye bye Junayd!');
  assert.strictEqual(sentinel.closingRemarksDetected, true);
  assert.ok(sentinel.explicitHomeworkNotes.length > 0);

  sentinel.processLiveTurn('Junayd Kari', 'Au revoir Coach Olalekan, à la semaine prochaine !');

  const report = sentinel.synthesizePostClassReport();
  assert.ok(report.assignedHomework.includes('animate a dinosaur sprite'));
  assert.strictEqual(report.nextSteps.length, 3);
  assert.ok(report.parentUpdateDraft.includes('Junayd'));
  assert.ok(report.parentUpdateDraft.includes('Coach Olalekan'));
  assert.ok(report.accountTierNotice.includes('18-Month Jio Trial Plan'));
});

// 12. Client-Side SessionContentAnalysisEngine Tests
it('SessionContentAnalysisEngine correctly analyzes authentic Junayd transcript', () => {
  const debrief = SessionContentAnalysisEngine.runSampleAudit('junayd_scratch_quest');
  assert.strictEqual(debrief.status, 'COMPLIANT');
  assert.strictEqual(debrief.safeguardingScore, 100);
  assert.strictEqual(debrief.untowardEvents.length, 0);
  assert.ok(debrief.assignedHomework.length > 5);
  assert.strictEqual(debrief.nextSteps.length, 3);
  assert.ok(debrief.parentUpdateDraft.includes('Junayd Kari'));
});

it('SessionContentAnalysisEngine flags untoward events with immediate operations actions', () => {
  const debrief = SessionContentAnalysisEngine.runSampleAudit('simulated_untoward_test');
  assert.strictEqual(debrief.status, 'FLAGGED');
  assert.ok(debrief.safeguardingScore < 50);
  assert.ok(debrief.untowardEvents.length >= 2);
  assert.ok(debrief.thingsToAddressImmediately.length >= 2);
  assert.ok(debrief.thingsToAddressImmediately[0].includes('Immediate Action') || debrief.thingsToAddressImmediately[0].includes(':'));
});

it('renderAnalysisCardHTML renders 3D Playful Minimalist card without throwing', () => {
  const debrief = SessionContentAnalysisEngine.runSampleAudit('junayd_scratch_quest');
  const html = SessionContentAnalysisEngine.renderAnalysisCardHTML(debrief, {
    studentName: 'Junayd Kari',
    courseName: 'Scratch Creators'
  });

  assert.ok(html.includes('Plan Adhered • Verified COPPA'));
  assert.ok(html.includes('Assigned Homework & Challenge'));
  assert.ok(html.includes('Operations Next Steps'));
  assert.ok(html.includes('Autonomous WhatsApp Parent Update'));
  assert.ok(html.includes('18-Month Jio Plan Compatible'));
});

console.log(`\n🎉 ALL ${passedTests} SENTINEL & OPERATIONS TESTS PASSED FLAWLESSLY!\n`);
process.exit(0);
