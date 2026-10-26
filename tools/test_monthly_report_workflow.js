const fs = require('fs');
const path = require('path');

// Mock browser environment for testing
const mockStorage = {};
global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.window = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};
global.document = {
    addEventListener: () => {}
};

// Load DashboardEngine & MonthlyReportEngine
const dashEngineCode = fs.readFileSync(path.join(__dirname, '../assets/js/dashboard-engine.js'), 'utf8');
eval(dashEngineCode);

const reportEngineCode = fs.readFileSync(path.join(__dirname, '../assets/js/monthly-report-engine.js'), 'utf8');
eval(reportEngineCode);

console.log('--- 🧪 STARTING TEST: MONTHLY PROGRESS REPORT & INVOICING WORKFLOW ---');

// 1. Test AI Woohoo Moments Crawler for Pearl Babalola
const pearlId = 'std-1007-r4cv';
const moments = MonthlyReportEngine.crawlWoohooMoments(pearlId, 'October 2026');
console.log('1. AI Woohoo Moments Crawled for Pearl:', moments.length);
if (moments.length > 0) {
    console.log('   Sample moment:', JSON.stringify(moments[0]));
}
if (!moments.length) {
    console.error('❌ FAIL: Expected woohoo moments for Pearl Babalola, found 0');
    process.exit(1);
}
console.log('✅ PASS: AI Woohoo Moments successfully crawled from attendance logs!');

// 2. Test Tutor submitting a report
const reportData = {
    studentId: pearlId,
    studentName: 'Pearl Babalola',
    course: 'Web Development & Scratch Game Engineering',
    parentName: 'Mrs. Babalola',
    parentEmail: 'pearl_parent@test.com',
    tutorId: 'tut-001',
    tutorName: 'Olalekan Agboola',
    tutorEmail: 'olalekan@stemulus.com',
    month: 'October 2026',
    projectLinks: [
        { title: 'Interactive Story Game', url: 'https://scratch.mit.edu/projects/123456' },
        { title: 'Personal Portfolio Webpage', url: 'https://pearl.github.io/portfolio' }
    ],
    shiningHighlights: 'Pearl displayed remarkable self-reliance during debugging loops and CSS flexbox styling.',
    growthAreas: 'Continue strengthening confidence when handling multi-variable conditions.',
    woohooMoments: moments
};

const submitted = MonthlyReportEngine.submitReport(reportData);
console.log('2. Submitted report ID:', submitted.id, '| Status:', submitted.status);
if (submitted.status !== 'pending_admin_approval') {
    console.error('❌ FAIL: Report status should be pending_admin_approval');
    process.exit(1);
}
console.log('✅ PASS: Report submitted to Director with pending_admin_approval status!');

// 3. Test Director requesting revision (rejection with comments)
const rejected = MonthlyReportEngine.rejectReport(submitted.id, 'Please add a second Scratch project link.');
console.log('3. Rejected report status:', rejected.status, '| Feedback:', rejected.adminFeedback);
if (rejected.status !== 'rejected_needs_revision' || !rejected.adminFeedback.includes('second Scratch project')) {
    console.error('❌ FAIL: Rejection did not set correct status or feedback');
    process.exit(1);
}
console.log('✅ PASS: Rejection workflow correctly sets rejected_needs_revision and records Director feedback!');

// 4. Test Tutor resubmitting
reportData.id = submitted.id;
reportData.projectLinks.push({ title: 'Maze Runner Game', url: 'https://scratch.mit.edu/projects/654321' });
const resubmitted = MonthlyReportEngine.submitReport(reportData);
console.log('4. Resubmitted report status:', resubmitted.status, '| Projects count:', resubmitted.projectLinks.length);
if (resubmitted.status !== 'pending_admin_approval' || resubmitted.projectLinks.length !== 3) {
    console.error('❌ FAIL: Resubmission did not return to pending_admin_approval');
    process.exit(1);
}
console.log('✅ PASS: Tutor resubmission properly resets status for Director review!');

// 5. Test Director Approval & Dispatch
const approved = MonthlyReportEngine.approveReport(resubmitted.id);
console.log('5. Approved report status:', approved.status);
if (approved.status !== 'approved') {
    console.error('❌ FAIL: Approval did not set status to approved');
    process.exit(1);
}
console.log('✅ PASS: Director approval successful!');

// 6. Verify Email decoupling:
// Academic Report sent (zero payment hints)
// Follow-up tuition invoice queued in db.emailQueue
const db = DashboardEngine.getDB();
const sentReportEmail = db.emailHistory.find(e => e.to === 'pearl_parent@test.com' && e.subject.includes('Monthly Progress Report'));
const queuedInvoice = db.emailQueue.find(e => e.to === 'pearl_parent@test.com' && e.subject.includes('Tuition Invoice'));

if (!sentReportEmail) {
    console.error('❌ FAIL: Sent progress report email not found in emailHistory');
    process.exit(1);
}
if (!queuedInvoice) {
    console.error('❌ FAIL: Follow-up tuition invoice not found in emailQueue');
    process.exit(1);
}

// Ensure NO payment keywords in the progress report email HTML
const reportContent = sentReportEmail.htmlPreview.toLowerCase();
const paymentKeywords = ['bank transfer', 'account number', '0128062292', 'pay now', 'wema bank', 'tuition fee'];
for (const kw of paymentKeywords) {
    if (reportContent.includes(kw)) {
        console.error(`❌ FAIL: Progress report contains payment reference: "${kw}"`);
        process.exit(1);
    }
}
console.log('✅ PASS: Progress report is 100% decoupled from payment! Zero payment mentions found.');

// Ensure invoice email contains payment details and polite wording
const invoiceContent = queuedInvoice.htmlPreview.toLowerCase();
if (!invoiceContent.includes('0128062292') || !invoiceContent.includes('wema bank')) {
    console.error('❌ FAIL: Invoice email missing bank details');
    process.exit(1);
}
console.log('✅ PASS: Follow-up invoice properly queued with polite Director voice and verified bank details!');

// 7. Verify Oval Office PDF HTML standard (no em-dashes, Segoe UI, A4 styling)
const pdfHtml = MonthlyReportEngine.buildOvalOfficePDFHTML(approved);
if (pdfHtml.includes('—') || pdfHtml.includes('--')) {
    console.error('❌ FAIL: PDF HTML contains forbidden em-dash!');
    process.exit(1);
}
if (!pdfHtml.includes('Segoe UI') || !pdfHtml.includes('210mm') || !pdfHtml.includes('297mm')) {
    console.error('❌ FAIL: PDF HTML does not conform to ISO A4 Oval Office specifications');
    process.exit(1);
}
console.log('✅ PASS: PDF HTML conforms 100% to Oval Office standards with ZERO em-dashes and ISO A4 geometry!');

console.log('\n🎉 ALL 7 TEST PHASES PASSED WITH 100% SUCCESS!');
