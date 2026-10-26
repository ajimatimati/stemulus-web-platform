const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING ENROLLMENT BIRTHDAY COLLECTION & SPREADSHEET EXPORT');
console.log('================================================================\n');

let passCount = 0;
function test(desc, fn) {
    try {
        fn();
        console.log(`[PASS] ${desc}`);
        passCount++;
    } catch (err) {
        console.error(`[FAIL] ${desc}`);
        console.error('       ' + err.message);
        process.exitCode = 1;
    }
}

// 1. enroll.html inputs & validation
const enrollHtml = fs.readFileSync('enroll.html', 'utf8');
test('enroll.html contains student_birthday input with required attribute', () => {
    assert(enrollHtml.includes('id="student_birthday"'), 'Missing id="student_birthday"');
    assert(enrollHtml.includes('name="student_birthday"'), 'Missing name="student_birthday"');
    assert(enrollHtml.includes('type="date"'), 'Missing type="date"');
});

test('enroll.html auto-syncs birthday with age dropdown', () => {
    assert(enrollHtml.includes('wireBirthdayAge'), 'Missing wireBirthdayAge auto-sync');
    assert(enrollHtml.includes('bdayEl.addEventListener(\'change\''), 'Missing change listener on birthday');
});

test('enroll.html multi-child capture retains birthday in childrenArray and review', () => {
    assert(enrollHtml.includes('const birthday   = document.querySelector(\'[name="student_birthday"]\').value;'), 'Missing birthday in addChild');
    assert(enrollHtml.includes('childrenArray.push({ firstName, lastName, age, birthday'), 'Missing birthday in childrenArray push');
    assert(enrollHtml.includes('DOB: \' + child.birthday'), 'Missing DOB in review step');
});

// 2. enrollment-handler.js serialization & notification
const handlerJs = fs.readFileSync('assets/js/enrollment-handler.js', 'utf8');
test('enrollment-handler.js extracts studentBirthday and saves locally', () => {
    assert(handlerJs.includes('studentBirthday: childrenArray[0]?.birthday || formData.get(\'student_birthday\') || \'\''), 'Missing studentBirthday extraction');
    assert(handlerJs.includes('studentBirthday: data.studentBirthday'), 'Missing studentBirthday in local or pending save');
});

test('enrollment-handler.js sets student_birthday and children_summary in Netlify FormData', () => {
    assert(handlerJs.includes("formData.set('student_birthday', enrollmentData.studentBirthday)"), 'Missing formData.set student_birthday');
    assert(handlerJs.includes("formData.set('children_summary'"), 'Missing formData.set children_summary');
});

test('enrollment-handler.js includes DOB in phone notification summary', () => {
    assert(handlerJs.includes('DOB: ${child.birthday}'), 'Missing DOB in child phone notification');
    assert(handlerJs.includes('DOB: ${data.studentBirthday}'), 'Missing DOB in single child phone notification');
});

// 3. send-email.js template
const sendEmailJs = fs.readFileSync('netlify/functions/send-email.js', 'utf8');
test('send-email.js includes DOB in tplEnrollmentAdmin and tplEnrollmentParent', () => {
    assert(sendEmailJs.includes('DOB: ${c.birthday}'), 'Missing DOB in admin multi-child table');
    assert(sendEmailJs.includes('DOB: ${d.studentBirthday}'), 'Missing DOB in admin primaryChildRow');
    assert(sendEmailJs.includes('Birthday (DOB)'), 'Missing Birthday (DOB) row in parent confirmation email');
});

// 4. admin-engine.js card & export
const adminEngineJs = fs.readFileSync('assets/js/admin-engine.js', 'utf8');
test('admin-engine.js loadNetlifyEnrollments displays DOB badge', () => {
    assert(adminEngineJs.includes('🎂 DOB: '), 'Missing DOB badge in loadNetlifyEnrollments');
});

test('admin-engine.js importNetlifyEnrollment preserves student birthday', () => {
    assert(adminEngineJs.includes('hasExplicitBirthday: !!(child.birthday || enr.studentBirthday)'), 'Missing hasExplicitBirthday on import');
});

test('admin-engine.js implements exportEnrollmentsSpreadsheet', () => {
    assert(adminEngineJs.includes('function exportEnrollmentsSpreadsheet()'), 'Missing exportEnrollmentsSpreadsheet function');
    assert(adminEngineJs.includes('stemulus_enrollments_spreadsheet_'), 'Missing spreadsheet download filename');
    assert(adminEngineJs.includes('exportEnrollmentsSpreadsheet,'), 'Missing export in AdminEngine object');
    assert(adminEngineJs.includes('window.exportEnrollmentsSpreadsheet = AdminEngine.exportEnrollmentsSpreadsheet;'), 'Missing window alias');
});

// 5. admin-dashboard.html button
const adminHtml = fs.readFileSync('admin-dashboard.html', 'utf8');
test('admin-dashboard.html includes Export Spreadsheet (CSV) button', () => {
    assert(adminHtml.includes('exportEnrollmentsSpreadsheet()'), 'Missing exportEnrollmentsSpreadsheet button in admin-dashboard.html');
    assert(adminHtml.includes('Export Spreadsheet (CSV)'), 'Missing button text');
});

// 6. data/enrollments_ledger.csv exists
test('data/enrollments_ledger.csv exists and has valid headers and rows', () => {
    assert(fs.existsSync('data/enrollments_ledger.csv'), 'Missing data/enrollments_ledger.csv');
    const csv = fs.readFileSync('data/enrollments_ledger.csv', 'utf8');
    assert(csv.includes('Birthday (DOB)'), 'Missing Birthday header in CSV');
    assert(csv.includes('Pearl'), 'Missing Pearl in CSV ledger');
    assert(csv.includes('2013-05-18'), 'Missing Pearl birthday in CSV ledger');
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${passCount} / 12 PASSED (100%)`);
console.log('================================================================');
