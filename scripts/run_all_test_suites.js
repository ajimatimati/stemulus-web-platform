const { execSync } = require('child_process');
const path = require('path');

const testSuites = [
    { name: 'Rejoin Monitoring & Faculty Chat Suite', file: 'tests/test_rejoin_and_chat_suite.js' },
    { name: 'Session Content & AI Safeguard Audit', file: 'tests/verify_session_content_analysis.js' },
    { name: 'Bilingual Classroom & 3D Visual Engine', file: 'tests/verify_bilingual_and_visual_engine.js' },
    { name: 'Gemini Autonomous Integration', file: 'tests/verify_gemini_integration.js' },
    { name: 'Operations Manager & Escalation Radar', file: 'tests/verify_suite_and_escalations.js' },
    { name: 'Sentinel Safeguard Watchdog', file: 'tests/test_sentinel_watchdog.js' },
    { name: 'Authentic Google Meet Pro Links', file: 'tests/verify_authentic_google_pro_links.js' },
    { name: 'Automated Google Classroom & Auto-Record Meet Onboarding', file: 'tests/verify_auto_classroom_and_meet_onboarding.js' },
    { name: 'Smart Reschedule & Tutor Coverage Concierge', file: 'tests/verify_smart_reschedule_concierge.js' },
    { name: 'Complete Portal E2E Playwright Suite', file: 'tests/e2e_everything_portal_test.js' }
];

console.log('🚀 EXECUTING COMPLETE PORTAL TEST SUITE IN SEQUENCE...\n');

let failedSuites = [];

for (const suite of testSuites) {
    console.log(`================================================================`);
    console.log(`RUNNING: ${suite.name} (${suite.file})`);
    console.log(`================================================================`);
    try {
        const output = execSync(`node "${path.join(__dirname, '..', suite.file)}"`, {
            encoding: 'utf8',
            stdio: 'inherit'
        });
        console.log(`✅ [PASSED] ${suite.name}\n`);
    } catch (e) {
        console.error(`❌ [FAILED] ${suite.name}`);
        failedSuites.push(suite.name);
    }
}

console.log('================================================================');
console.log('ALL TEST SUITES EXECUTION COMPLETED');
console.log('================================================================');

if (failedSuites.length > 0) {
    console.error(`\n❌ Failures detected in ${failedSuites.length} test suites:`);
    failedSuites.forEach(s => console.error(` - ${s}`));
    process.exit(1);
} else {
    console.log(`\n🎉 ALL ${testSuites.length} TEST SUITES PASSED FLAWLESSLY WITH ZERO ISSUES!`);
    process.exit(0);
}
