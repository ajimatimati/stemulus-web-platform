const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '../assets/js/dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// We want to ensure Pearl Babalola has the Fire Progression Badge, attended: 27, currentMonth: 7, and correct billing
// And Joshua Ogba has paid through end of 2026
// And Gbolade has payment due Nov 4, 2026
// And Momooreoluwa has 1-month paid, next due Nov 5, 2026

// Let's inspect students array in DEFAULT_DATA
const studentsMarker = '"students": [';
const sStart = code.indexOf(studentsMarker);
let sEnd = -1;
let openCount = 0;
for (let i = sStart + '"students": '.length; i < code.length; i++) {
    if (code[i] === '[') openCount++;
    else if (code[i] === ']') {
        openCount--;
        if (openCount === 0) {
            sEnd = i + 1;
            break;
        }
    }
}

const studentsJSON = code.slice(sStart + '"students": '.length, sEnd);
let students = JSON.parse(studentsJSON);

students = students.map(s => {
    if (s.id === 'std-1007-r4cv' || (s.firstName === 'Babalola' && s.lastName && s.lastName.includes('Pearl'))) {
        // Pearl Babalola
        s.age = 13;
        s.tier = 'intermediate';
        s.package = 'Intermediate Young Engineers';
        s.classesAttended = 27;
        s.metrics = s.metrics || {};
        s.metrics.attended = 27;
        s.currentMonth = 7;
        s.badgeMonth = 7;
        s.badgeLevel = 'Fire Master';
        s.earnedBadges = [
            'fire-finder',
            'ember-keeper',
            'hearth-builder',
            'torch-bearer',
            'signal-fire',
            'forge-master'
        ];
        s.unlockedEras = ['Era I: The First Light'];
        s.classroomLink = 'https://meet.google.com/yre-naci-zmp';
        s.meetLink = 'https://meet.google.com/yre-naci-zmp';
        s.startDate = '2026-09-18';
        s.billing = {
            firstClassDate: '2026-09-18',
            anchorDay: 18,
            cycleStartDate: '2026-09-18',
            nextDueDate: '2026-11-18',
            monthlyFee: 75000,
            packageRate: 75000,
            tier: 'intermediate',
            octoberBridge: 37500,
            nextCycleFee: 75000,
            combinedRealignment: 112500,
            status: 'renewal_pending',
            uncollectedOctober: true,
            notes: 'Intermediate package (Age 13): ₦75,000/month. October bridge (Oct 19-31, 4 sessions): ₦37,500. November cycle: ₦75,000. Realignment total: ₦112,500 (or ₦37,500 bridge now + ₦75,000 on Nov 1).',
            history: [
                {
                    id: 'pay-pearl-sep2026',
                    reference: 'REC-2026-PEARL-01',
                    amount: 35000,
                    formattedAmount: '₦35,000',
                    date: '2026-09-18',
                    method: 'Bank Transfer (Wema)',
                    notes: 'Initial Month Enrollment - JavaScript & Python',
                    cyclePaidFor: '2026-09-18 to 2026-10-18',
                    recordedBy: 'Admin',
                    createdAt: '2026-09-18T10:00:00Z'
                }
            ]
        };
    } else if (s.id === 'std-1013-jogb' || (s.firstName === 'Joshua' && s.lastName === 'Ogba')) {
        // Joshua Ogba
        s.classesAttended = 14;
        s.metrics = s.metrics || {};
        s.metrics.attended = 14;
        s.classroomLink = 'https://meet.google.com/yko-xwce-ugd';
        s.meetLink = 'https://meet.google.com/yko-xwce-ugd';
        s.startDate = '2026-10-03';
        s.billing = {
            firstClassDate: '2026-10-03',
            anchorDay: 3,
            cycleStartDate: '2026-10-03',
            nextDueDate: '2027-01-03',
            paidThrough: '2026-12-31',
            annualPaid: true,
            monthlyFee: 35000,
            status: 'paid_annual',
            notes: 'Paid for the rest of the year (through Dec 31, 2026). Up to date.',
            history: [
                {
                    id: 'pay-joshua-full2026',
                    reference: 'REC-2026-JOSHUA-ANNUAL',
                    amount: 105000,
                    formattedAmount: '₦105,000',
                    date: '2026-10-03',
                    method: 'Bank Transfer (Wema)',
                    notes: 'Full Term Tuition (Paid for the rest of 2026)',
                    cyclePaidFor: '2026-10-03 to 2026-12-31',
                    recordedBy: 'Admin',
                    createdAt: '2026-10-03T11:00:00Z'
                }
            ]
        };
    } else if (s.id === 'std-1008-a0lp' || (s.firstName === 'Gbolade' && s.lastName === 'Okesanjo')) {
        // Gbolade Okesanjo
        s.classesAttended = 4;
        s.metrics = s.metrics || {};
        s.metrics.attended = 4;
        s.classroomLink = 'https://meet.google.com/qye-ezub-uqi';
        s.meetLink = 'https://meet.google.com/qye-ezub-uqi';
        s.startDate = '2026-10-04';
        s.tutorName = 'Ojekudo Oghenemaro Emmanuel';
        s.tutorEmail = 'oojekudo@gmail.com';
        s.billing = {
            firstClassDate: '2026-10-04',
            anchorDay: 4,
            cycleStartDate: '2026-10-04',
            nextDueDate: '2026-11-04',
            monthlyFee: 60000, // Physical session rate
            status: 'active',
            sessionType: 'physical',
            notes: 'Physical in-person sessions paid. Next payment due on November 4th, 2026.',
            history: [
                {
                    id: 'pay-gbolade-oct2026',
                    reference: 'REC-2026-GBOLADE-01',
                    amount: 60000,
                    formattedAmount: '₦60,000',
                    date: '2026-10-04',
                    method: 'Bank Transfer (Wema)',
                    notes: 'Physical Sessions Month 1',
                    cyclePaidFor: '2026-10-04 to 2026-11-04',
                    recordedBy: 'Admin',
                    createdAt: '2026-10-04T12:00:00Z'
                }
            ]
        };
    } else if (s.id === 'std-1011-tq1u' || (s.firstName === 'Momooreoluwa')) {
        // Momooreoluwa
        s.classesAttended = 6;
        s.metrics = s.metrics || {};
        s.metrics.attended = 6;
        s.classroomLink = 'https://meet.google.com/vdp-nmbh-sjj';
        s.meetLink = 'https://meet.google.com/vdp-nmbh-sjj';
        s.startDate = '2026-10-05';
        s.billing = {
            firstClassDate: '2026-10-05',
            anchorDay: 5,
            cycleStartDate: '2026-10-05',
            nextDueDate: '2026-11-05',
            monthlyFee: 35000,
            status: 'active',
            uncollectedOctober: false,
            notes: 'Paid for 1 month (October). Next payment due on November 5th, 2026.',
            history: [
                {
                    id: 'pay-momoore-oct2026',
                    reference: 'REC-2026-MOMOORE-01',
                    amount: 35000,
                    formattedAmount: '₦35,000',
                    date: '2026-10-05',
                    method: 'Bank Transfer (Wema)',
                    notes: 'Month 1 Scratch Track',
                    cyclePaidFor: '2026-10-05 to 2026-11-05',
                    recordedBy: 'Admin',
                    createdAt: '2026-10-05T14:30:00Z'
                }
            ]
        };
    } else if (s.firstName === 'Farouq' || s.lastName === 'Adebayo') {
        s.classroomLink = 'https://meet.google.com/mim-qifa-avc';
        s.meetLink = 'https://meet.google.com/mim-qifa-avc';
        s.tier = 'beginners';
        s.billing = {
            firstClassDate: '2026-10-01',
            anchorDay: 1,
            cycleStartDate: '2026-10-01',
            nextDueDate: '2026-11-01',
            monthlyFee: 48000,
            tier: 'beginners',
            status: 'renewal_pending',
            uncollectedOctober: true,
            notes: 'Beginners track (₦48,000/mo). Paid for initial month; no payment collected in October. Never autonomously demand payment.'
        };
    }
    if (s.billing) {
        if (s.billing.paidThrough) s.paidThrough = s.billing.paidThrough;
        if (s.billing.nextDueDate) s.nextDueDate = s.billing.nextDueDate;
        if (s.billing.status === 'paid_annual') s.status = 'paid_annual';
    } else {
        const age = s.age || 10;
        let fee = 48000;
        let tierName = 'beginners';
        if (age >= 14) { fee = 120000; tierName = 'advanced'; }
        else if (age >= 10) { fee = 75000; tierName = 'intermediate'; }
        s.tier = s.tier || tierName;
        s.billing = {
            monthlyFee: fee,
            tier: tierName,
            status: 'active'
        };
        s.nextDueDate = '2026-11-01';
    }
    return s;
});

const newStudentsJSON = JSON.stringify(students, null, 8);
code = code.slice(0, sStart + '"students": '.length) + newStudentsJSON + code.slice(sEnd);

// Also add tutor Ojekudo Oghenemaro Emmanuel to DEFAULT_DATA.users if not present
if (!code.includes('"oojekudo@gmail.com":')) {
    const userInsertPoint = code.indexOf('"users": {') + '"users": {'.length;
    const oojekudoUser = `
        "oojekudo@gmail.com": {
            "id": "usr-tut-107b",
            "name": "Ojekudo Oghenemaro Emmanuel",
            "email": "oojekudo@gmail.com",
            "role": "tutor",
            "password": "ed9f63ccbac9636a57844776385a1169871fa0b42e9b83a98585e648fa058493",
            "phone": "08076000020",
            "status": "active"
        },`;
    code = code.slice(0, userInsertPoint) + oojekudoUser + code.slice(userInsertPoint);
    console.log('Added oojekudo@gmail.com to DEFAULT_DATA.users.');
}

// Update tut-107-emmanuel in DEFAULT_DATA.tutors to have Ojekudo Oghenemaro Emmanuel
code = code.replace(
    /("id":\s*"tut-107-emmanuel"[\s\S]*?"name":\s*")[^"]+(")/,
    '$1Ojekudo Oghenemaro Emmanuel$2'
);
code = code.replace(
    /("id":\s*"tut-107-emmanuel"[\s\S]*?"email":\s*")[^"]+(")/,
    '$1oojekudo@gmail.com$2'
);

fs.writeFileSync(enginePath, code, 'utf8');
console.log('Successfully configured student profiles, fire badge for Pearl, and payment cycles!');
