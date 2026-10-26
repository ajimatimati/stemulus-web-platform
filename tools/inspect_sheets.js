const fs = require('fs');

console.log('=== PAYMENT SHEET CONTENT ===');
const payContent = fs.readFileSync('data/google_sheet_payments.csv', 'utf8');
console.log(payContent);

console.log('\n=== ATTENDANCE SHEET PARSING ===');
const attContent = fs.readFileSync('data/google_sheet_attendance.csv', 'utf8');

// Proper CSV parser supporting multi-line quoted fields
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
}

const rows = parseCSV(attContent);
console.log('Total Parsed Rows:', rows.length);
if (rows.length > 0) {
    console.log('Header Row:', rows[0]);
}

const studentStats = {};
const tutorStats = {};

// Headers: ["Column 12", "Timestamp", "Email Address", "Tutor Name ", "Student Name", "Date Of Class", "Time Started", "Time Ended", "Topic Covered", "Class Summary", "Attendance Status", "Tutor Remark"]
for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;
    const timestamp = r[1] ? r[1].trim() : '';
    const tutorEmail = r[2] ? r[2].trim() : '';
    const tutorName = r[3] ? r[3].trim() : '';
    const studentName = r[4] ? r[4].trim() : '';
    const classDate = r[5] ? r[5].trim() : '';
    const timeStarted = r[6] ? r[6].trim() : '';
    const timeEnded = r[7] ? r[7].trim() : '';
    const topic = r[8] ? r[8].trim() : '';
    const summary = r[9] ? r[9].trim() : '';
    const status = r[10] ? r[10].trim() : '';
    const remark = r[11] ? r[11].trim() : '';

    if (!studentName && !tutorName) continue;

    if (!studentStats[studentName]) {
        studentStats[studentName] = { count: 0, tutors: new Set(), topics: [], dates: [] };
    }
    studentStats[studentName].count++;
    studentStats[studentName].tutors.add(tutorName + ' (' + tutorEmail + ')');
    studentStats[studentName].dates.push(classDate);
    if (topic) studentStats[studentName].topics.push(topic);

    if (!tutorStats[tutorName]) {
        tutorStats[tutorName] = { count: 0, email: tutorEmail, students: new Set() };
    }
    tutorStats[tutorName].count++;
    tutorStats[tutorName].students.add(studentName);
}

console.log('\n--- TUTORS BREAKDOWN ---');
for (const [t, data] of Object.entries(tutorStats)) {
    console.log(`Tutor: ${t} [${data.email}] -> ${data.count} sessions with students: ${Array.from(data.students).join(', ')}`);
}

console.log('\n--- STUDENTS BREAKDOWN ---');
for (const [s, data] of Object.entries(studentStats)) {
    console.log(`Student: "${s}" -> ${data.count} sessions. Tutors: ${Array.from(data.tutors).join(' | ')}. Date range: ${data.dates[0]} to ${data.dates[data.dates.length - 1]}`);
}
