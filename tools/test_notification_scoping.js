const fs = require('fs');

// Mock DOM & environment
global.window = {
    location: { pathname: '/tutor-dashboard.html', protocol: 'http:' },
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
};
global.document = {
    getElementById: (id) => ({ style: {}, innerHTML: '', appendChild: () => {}, remove: () => {} }),
    createElement: () => ({ style: {}, appendChild: () => {}, remove: () => {} }),
    body: { appendChild: () => {} },
    addEventListener: () => {}
};
global.sessionStorage = { getItem: () => null, setItem: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

// Mock DashboardEngine & ClassEscalationEngine
global.DashboardEngine = {
    getSession: () => ({ role: 'tutor', email: 'olalekan@stemuluskidstech.com', name: 'Olalekan Israel Ajimati' }),
    getTutorStudents: (email) => [
        { id: 'std-1014-faro', firstName: 'Farouq', lastName: 'Adebayo' }
    ],
    getParentStudents: (email) => {
        if (email === 'joshuaogba.parent@gmail.com') {
            return [{ id: 'std-1013-jogb', firstName: 'Joshua', lastName: 'Ogba' }];
        }
        return [];
    }
};

const joshuaRadarItem = {
    state: { code: 'CODER_WAITING_FOR_TUTOR' },
    schedule: {
        id: 'sch-joshua-01',
        studentId: 'std-1013-jogb',
        studentName: 'Joshua Ogba',
        mentor: 'Kafayat Abdulwahab',
        tutorName: 'Kafayat Abdulwahab',
        tutorEmail: 'kafayatabdulwahab.et@gmail.com'
    },
    contacts: {
        studentName: 'Joshua Ogba',
        tutorName: 'Kafayat Abdulwahab',
        tutorEmail: 'kafayatabdulwahab.et@gmail.com'
    }
};

const farouqRadarItem = {
    state: { code: 'CODER_WAITING_FOR_TUTOR' },
    schedule: {
        id: 'sch-farouq-01',
        studentId: 'std-1014-faro',
        studentName: 'Farouq Adebayo',
        mentor: 'Olalekan Israel Ajimati',
        tutorName: 'Olalekan Israel Ajimati',
        tutorEmail: 'olalekan@stemuluskidstech.com'
    },
    contacts: {
        studentName: 'Farouq Adebayo',
        tutorName: 'Olalekan Israel Ajimati',
        tutorEmail: 'olalekan@stemuluskidstech.com'
    }
};

global.ClassEscalationEngine = {
    getLiveRadarHUD: () => [joshuaRadarItem, farouqRadarItem],
    resolveSessionContacts: (s) => s
};

// Test Beacon scoping
const beaconCode = fs.readFileSync('assets/js/classroom-rejoin-beacon.js', 'utf8');
const runBeacon = new Function(beaconCode + '\nreturn ClassroomRejoinBeacon;');
const Beacon = runBeacon();

// Test Tutor Scoping
const tutorCode = fs.readFileSync('assets/js/tutor-engine.js', 'utf8');
const runTutor = new Function('ClassEscalationEngine', 'DashboardEngine', tutorCode + '\nreturn TutorEngine;');
const Tutor = runTutor(global.ClassEscalationEngine, global.DashboardEngine);

console.log('--- TEST 1: TUTOR SCOPING FOR OLALEKAN ---');
const currentTutor = { email: 'olalekan@stemuluskidstech.com', name: 'Olalekan Israel Ajimati' };
const radarItems = global.ClassEscalationEngine.getLiveRadarHUD();
const tutorEmail = currentTutor.email.toLowerCase().trim();
const tutorName = currentTutor.name.toLowerCase().trim();
const tutorFirst = tutorName.split(' ')[0];

const filteredForOlalekan = radarItems.filter(item => {
    const s = item.schedule || {};
    const contacts = item.contacts || s;
    const sEmail = (contacts.tutorEmail || s.tutorEmail || '').toLowerCase().trim();
    const sName = (contacts.tutorName || s.mentor || s.tutorName || '').toLowerCase().trim();

    const isMyClass = (tutorEmail && sEmail === tutorEmail) ||
                      (tutorName && sName === tutorName) ||
                      (tutorFirst && sName.includes(tutorFirst));

    let matchStudent = false;
    if (!isMyClass) {
        const myStudents = global.DashboardEngine.getTutorStudents(tutorEmail) || [];
        const schedStudentId = s.studentId || contacts.studentId;
        matchStudent = myStudents.some(st => schedStudentId && st.id === schedStudentId);
    }
    return isMyClass || matchStudent;
});

console.log('Items visible to Olalekan:', filteredForOlalekan.map(i => i.schedule.studentName));
const olalekanSeesJoshua = filteredForOlalekan.some(i => i.schedule.studentName.includes('Joshua'));
console.log('Does Olalekan see Joshua Ogba?', olalekanSeesJoshua ? 'FAIL (LEAK)' : 'PASS (ISOLATED - NOT SEEN!)');
const olalekanSeesFarouq = filteredForOlalekan.some(i => i.schedule.studentName.includes('Farouq'));
console.log('Does Olalekan see Farouq Adebayo?', olalekanSeesFarouq ? 'PASS (SEEN AS ASSIGNED)' : 'FAIL');

console.log('\n--- TEST 2: CLASSROOM REJOIN BEACON SCOPING ---');
// Extract isPromptForCurrentUser from beacon code
const matchHelper = beaconCode.match(/function isPromptForCurrentUser\(promptData\) \{[\s\S]*?\n  \}/);
const isPromptForCurrentUser = new Function('promptData', 'DashboardEngine', matchHelper[0] + '\nreturn isPromptForCurrentUser(promptData);');

// 2a. Tutor Olalekan logged in
global.DashboardEngine.getSession = () => ({ role: 'tutor', email: 'olalekan@stemuluskidstech.com', name: 'Olalekan Israel Ajimati' });
const joshuaPrompt = { studentId: 'std-1013-jogb', studentName: 'Joshua Ogba', tutorEmail: 'kafayatabdulwahab.et@gmail.com', tutorName: 'Kafayat Abdulwahab' };
const farouqPrompt = { studentId: 'std-1014-faro', studentName: 'Farouq Adebayo', tutorEmail: 'olalekan@stemuluskidstech.com', tutorName: 'Olalekan Israel Ajimati' };

console.log('Olalekan sees Joshua rejoin popup?', isPromptForCurrentUser(joshuaPrompt, global.DashboardEngine) ? 'FAIL (LEAK)' : 'PASS (BLOCKED)');
console.log('Olalekan sees Farouq rejoin popup?', isPromptForCurrentUser(farouqPrompt, global.DashboardEngine) ? 'PASS (ALLOWED)' : 'FAIL');

// 2b. Parent Mrs. Ogba logged in
global.DashboardEngine.getSession = () => ({ role: 'parent', email: 'joshuaogba.parent@gmail.com', name: 'Mrs. Ogba' });
const pearlPrompt = { studentId: 'std-1007-r4cv', studentName: 'Pearl Babalola', parentEmail: 'talk2nike2009@gmail.com' };
console.log('Mrs. Ogba sees Joshua rejoin popup?', isPromptForCurrentUser(joshuaPrompt, global.DashboardEngine) ? 'PASS (ALLOWED)' : 'FAIL');
console.log('Mrs. Ogba sees Pearl rejoin popup?', isPromptForCurrentUser(pearlPrompt, global.DashboardEngine) ? 'FAIL (LEAK)' : 'PASS (BLOCKED)');
