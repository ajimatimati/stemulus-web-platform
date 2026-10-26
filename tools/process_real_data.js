const fs = require('fs');
const path = require('path');

// Robust CSV Parser supporting multiline fields inside quotes
function parseCSVWithQuotes(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
            rows.push(currentRow);
        }
    }
    
    return rows;
}

const attendancePath = path.join(__dirname, '../data/google_sheet_attendance.csv');
const paymentPath = path.join(__dirname, '../data/google_sheet_payments.csv');

const rawAttendance = fs.readFileSync(attendancePath, 'utf8');
const attendanceRows = parseCSVWithQuotes(rawAttendance);

console.log('Total Attendance Rows Parsed:', attendanceRows.length);
const headers = attendanceRows[0];
console.log('Headers:', headers);

// Header indices:
// 0: Column 12 (counter)
// 1: Timestamp
// 2: Email Address
// 3: Tutor Name 
// 4: Student Name
// 5: Date Of Class
// 6: Time Started
// 7: Time Ended
// 8: Topic Covered
// 9: Class Summary
// 10: Attendance Status
// 11: Tutor Remark

const ignoredStudents = ['david djoka', 'david', 'junayd', 'king myles', 'myles omosuyi', 'myles'];

const cleanRecords = [];
for (let i = 1; i < attendanceRows.length; i++) {
    const row = attendanceRows[i];
    if (row.length < 5) continue;
    
    const timestamp = row[1] || '';
    const tutorEmail = (row[2] || '').trim().toLowerCase();
    const tutorName = (row[3] || '').trim();
    const rawStudent = (row[4] || '').trim();
    const dateOfClass = (row[5] || '').trim();
    const timeStarted = (row[6] || '').trim();
    const timeEnded = (row[7] || '').trim();
    const topicCovered = (row[8] || '').trim();
    const classSummary = (row[9] || '').trim();
    const attendanceStatus = (row[10] || 'Present').trim();
    const tutorRemark = (row[11] || '').trim();
    
    const sLower = rawStudent.toLowerCase();
    if (ignoredStudents.some(ign => sLower.includes(ign))) {
        console.log(`Skipping ignored student: ${rawStudent} (${tutorName})`);
        continue;
    }
    
    // Canonical student mapping
    let studentId = '';
    let studentFullName = '';
    let parentEmail = '';
    let parentName = '';
    let course = 'Coding Track';
    
    if (sLower.includes('pearl')) {
        studentId = 'std-pearl-01';
        studentFullName = 'Pearl Babalola';
        parentEmail = 'talk2nike2009@gmail.com';
        parentName = 'Babalola Olanike';
        course = 'JavaScript & Web Innovation';
    } else if (sLower.includes('joshua')) {
        studentId = 'std-joshua-01';
        studentFullName = 'Joshua Ogba';
        parentEmail = 'joshuaogba.parent@gmail.com';
        parentName = 'Mrs. Ogba';
        course = 'Python Programming & AI';
    } else if (sLower.includes('momoore')) {
        studentId = 'std-momoore-01';
        studentFullName = 'Momooreoluwa Shittu';
        parentEmail = 'abiodunadebiyis@gmail.com';
        parentName = 'Abiodun Shittu';
        course = 'Scratch & Creative Coding';
    } else if (sLower.includes('gbolade')) {
        studentId = 'std-gbolade-01';
        studentFullName = 'Gbolade Okesanjo';
        parentEmail = 'temiladeokesanjo1@gmail.com';
        parentName = 'Temi Okesanjo';
        course = 'Physical Robotics & Creative Computing';
    } else if (sLower.includes('olasunkanmi')) {
        studentId = 'std-olasunkanmi-01';
        studentFullName = 'Olasunkanmi';
        parentEmail = 'admin@stemuluskidstech.com';
        parentName = 'Academy Review';
        course = 'Diagnostic Assessment';
    } else {
        console.log(`Unmatched student row: "${rawStudent}"`);
        continue;
    }
    
    // Standardize Date into YYYY-MM-DD
    let isoDate = dateOfClass;
    if (dateOfClass.includes('/')) {
        const parts = dateOfClass.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        isoDate = `${year}-${month}-${day}`;
    }
    
    const record = {
        id: 'att-gsheet-' + (cleanRecords.length + 1) + '-' + Date.now(),
        studentId: studentId,
        studentName: studentFullName,
        parentEmail: parentEmail,
        parentName: parentName,
        tutorName: tutorName,
        tutorEmail: tutorEmail,
        course: course,
        date: isoDate,
        dateFormatted: dateOfClass,
        startTime: timeStarted,
        endTime: timeEnded,
        topic: topicCovered,
        summary: classSummary,
        status: attendanceStatus.toLowerCase() === 'present' ? 'present' : attendanceStatus.toLowerCase(),
        attendanceStatus: attendanceStatus.toLowerCase() === 'present' ? 'present' : attendanceStatus.toLowerCase(),
        tutorRemark: tutorRemark,
        source: 'GoogleSheetVerifiedAttendance',
        verified: true,
        createdAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };
    
    cleanRecords.push(record);
}

console.log('\n--- CLEAN RECORDS COUNT BY STUDENT ---');
const counts = {};
cleanRecords.forEach(r => {
    counts[r.studentName] = (counts[r.studentName] || 0) + 1;
});
console.log(counts);
console.log('Total verified attendance records to migrate:', cleanRecords.length);

// Save clean records to data/cleaned_attendance_records.json
fs.writeFileSync(
    path.join(__dirname, '../data/cleaned_attendance_records.json'),
    JSON.stringify(cleanRecords, null, 2),
    'utf8'
);
console.log('Saved to data/cleaned_attendance_records.json');
