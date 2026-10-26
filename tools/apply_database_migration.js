const fs = require('fs');
const path = require('path');

const cleanedAttendancePath = path.join(__dirname, '../data/cleaned_attendance_records.json');
const dashboardEnginePath = path.join(__dirname, '../assets/js/dashboard-engine.js');

const cleanedAttendance = JSON.parse(fs.readFileSync(cleanedAttendancePath, 'utf8'));
console.log(`Loaded ${cleanedAttendance.length} cleaned attendance records.`);

let engineCode = fs.readFileSync(dashboardEnginePath, 'utf8');

// 1. Prepare formatted attendance records JSON string for insertion into DEFAULT_DATA
const formattedAttendance = JSON.stringify(cleanedAttendance, null, 8);

// 2. Find and replace attendanceRecords in DEFAULT_DATA
// Pattern from '"attendanceRecords": [' to '],' followed by '"billingSettings":' or similar
const attStartMarker = '"attendanceRecords": [';
const attStartIndex = engineCode.indexOf(attStartMarker);
if (attStartIndex === -1) {
    console.error('Could not find "attendanceRecords": [ in dashboard-engine.js');
    process.exit(1);
}

// Find matching closing bracket
let attEndIndex = -1;
let openBrackets = 0;
for (let i = attStartIndex + '"attendanceRecords": '.length; i < engineCode.length; i++) {
    if (engineCode[i] === '[') openBrackets++;
    else if (engineCode[i] === ']') {
        openBrackets--;
        if (openBrackets === 0) {
            attEndIndex = i + 1;
            break;
        }
    }
}

if (attEndIndex === -1) {
    console.error('Could not find closing bracket of attendanceRecords array');
    process.exit(1);
}

console.log(`Found attendanceRecords from character ${attStartIndex} to ${attEndIndex}`);
const replacementAtt = `"attendanceRecords": ${formattedAttendance}`;

engineCode = engineCode.slice(0, attStartIndex) + replacementAtt + engineCode.slice(attEndIndex);
console.log('Successfully replaced DEFAULT_DATA.attendanceRecords with 52 real records!');

// 3. Update Pearl Babalola in DEFAULT_DATA.students
// Pearl ID: "std-1007-r4cv"
const pearlRegex = /("id":\s*"std-1007-r4cv"[\s\S]*?"metrics":\s*\{[\s\S]*?"attended":\s*)\d+/;
if (pearlRegex.test(engineCode)) {
    engineCode = engineCode.replace(pearlRegex, '$127');
    console.log('Updated Pearl Babalola metrics.attended to 27.');
} else {
    console.warn('Pearl regex for metrics.attended did not match directly.');
}

// Update Pearl meetLink and classroomLink
engineCode = engineCode.replace(
    /("id":\s*"std-1007-r4cv"[\s\S]*?"classroomLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/yre-naci-zmp$2'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1007-r4cv"[\s\S]*?"meetLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/yre-naci-zmp$2'
);

// 4. Update Joshua Ogba
engineCode = engineCode.replace(
    /("id":\s*"std-1013-jogb"[\s\S]*?"metrics":\s*\{[\s\S]*?"attended":\s*)\d+/,
    '$114'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1013-jogb"[\s\S]*?"classroomLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/yko-xwce-ugd$2'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1013-jogb"[\s\S]*?"meetLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/yko-xwce-ugd$2'
);

// 5. Update Gbolade Okesanjo
engineCode = engineCode.replace(
    /("id":\s*"std-1008-a0lp"[\s\S]*?"metrics":\s*\{[\s\S]*?"attended":\s*)\d+/,
    '$14'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1008-a0lp"[\s\S]*?"classroomLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/qye-ezub-uqi$2'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1008-a0lp"[\s\S]*?"meetLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/qye-ezub-uqi$2'
);

// 6. Update Momooreoluwa
engineCode = engineCode.replace(
    /("id":\s*"std-1011-tq1u"[\s\S]*?"metrics":\s*\{[\s\S]*?"attended":\s*)\d+/,
    '$16'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1011-tq1u"[\s\S]*?"classroomLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/vdp-nmbh-sjj$2'
);
engineCode = engineCode.replace(
    /("id":\s*"std-1011-tq1u"[\s\S]*?"meetLink":\s*")[^"]+(")/,
    '$1https://meet.google.com/vdp-nmbh-sjj$2'
);

// 7. Bump DB_SYNC_VERSION to trigger clean sync across all portals
engineCode = engineCode.replace(
    /const DB_SYNC_VERSION = '[^']+';/,
    "const DB_SYNC_VERSION = '2026.10.26.v100_operational';"
);
console.log('Bumped DB_SYNC_VERSION to 2026.10.26.v100_operational');

// Save updated dashboard-engine.js
fs.writeFileSync(dashboardEnginePath, engineCode, 'utf8');
console.log('Saved updated assets/js/dashboard-engine.js successfully!');
