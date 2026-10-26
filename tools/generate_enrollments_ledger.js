const fs = require('fs');
const path = require('path');

// 1. Read Google Sheets Roster
const rosterCsv = fs.readFileSync('data/google_sheets_roster.csv', 'utf8');

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
                i++;
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

const rosterRows = parseCSV(rosterCsv);
const headers = ['Enrollment ID', 'Date Submitted', 'Student Name', 'Birthday (DOB)', 'Age', 'Gender', 'Program', 'Experience Level', 'Parent Name', 'Parent Email', 'Phone / WhatsApp', 'Country', 'Timezone', 'Media Consent', 'Referral / Source', 'Status'];

const ledgerRecords = [];

// Map existing roster rows:
// Headers: Timestamp, Email Address, Parent/Guardian Full Name, Parent/Guardian Email Address, Parent/Guardian Phone Number, Relationship to Child, Child’s Full Name, Child’s Age, Child’s Current School Class/Grade, Has your child had any prior coding/tech experience?, Which STEMulus program are you enrolling for?, Do you consent..., Do you agree..., Any additional..., Final Confirmation
for (let i = 1; i < rosterRows.length; i++) {
    const r = rosterRows[i];
    if (!r || r.length < 5) continue;
    
    const timestamp = r[0] ? r[0].trim() : '';
    const parentName = r[2] ? r[2].trim() : '';
    const parentEmail = (r[3] || r[1] || '').trim().toLowerCase();
    const phone = r[4] ? r[4].trim() : '';
    const studentName = r[6] ? r[6].trim() : '';
    const age = r[7] ? r[7].trim() : '';
    const experience = r[9] ? r[9].trim() : 'Some (Scratch, Basic coding)';
    const program = r[10] ? r[10].trim() : 'Coding Pathway';
    const mediaConsent = (r[11] && r[11].toLowerCase().includes('yes')) ? 'Granted' : 'Declined';
    
    // Check known student birthdays
    let birthday = 'Not specified';
    if (studentName.includes('Pearl')) birthday = '2013-05-18';
    if (studentName.includes('Gbolade')) birthday = '2012-10-04';
    if (studentName.includes('Myles')) birthday = '2020-09-08';
    if (studentName.includes('Joshua')) birthday = '2014-03-12';
    if (studentName.includes('Momooreoluwa')) birthday = '2019-10-05';
    if (studentName.includes('David')) birthday = '2016-10-06';
    if (studentName.includes('Junayd')) birthday = '2020-09-23';

    ledgerRecords.push([
        `STM-ROSTER-${1000 + i}`,
        timestamp,
        studentName,
        birthday,
        age,
        'Not specified',
        program,
        experience,
        parentName,
        parentEmail,
        phone,
        phone.startsWith('+44') || phone.startsWith('07') ? 'United Kingdom' : 'Nigeria',
        phone.startsWith('+44') || phone.startsWith('07') ? 'Europe/London' : 'Africa/Lagos',
        mediaConsent,
        'Google Form Roster',
        'active'
    ]);
}

// Format to CSV with UTF-8 BOM
const csvContent = '\uFEFF' + [headers, ...ledgerRecords].map(r => {
    return r.map(f => {
        const s = String(f == null ? '' : f);
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }).join(',');
}).join('\r\n');

fs.writeFileSync('data/enrollments_ledger.csv', csvContent, 'utf8');
console.log(`Successfully generated data/enrollments_ledger.csv with ${ledgerRecords.length} records!`);
