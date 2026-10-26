const fs = require('fs');
const path = require('path');

const tutorEnginePath = path.join(__dirname, '../assets/js/tutor-engine.js');
const beaconPath = path.join(__dirname, '../assets/js/classroom-rejoin-beacon.js');

// 1. Update tutor-engine.js
let tutorCode = fs.readFileSync(tutorEnginePath, 'utf8');

// Replace urgentItems filter in renderLiveClassPresenceBanner
const oldTutorFilterRegex = /\/\/\s*Filter items that need active attention[\s\S]*?const urgentItems = radarItems\.filter\(item => \{[\s\S]*?return \([\s\S]*?code === 'IN_SESSION'[\s\S]*?\);\s*\}\);/;

const newTutorFilter = `// Filter items that need active attention STRICTLY FOR THIS TUTOR ONLY (Olalekan never sees Joshua Ogba's or others' sessions)
        const tutorEmail = (currentTutor && currentTutor.email) ? currentTutor.email.toLowerCase().trim() : '';
        const tutorAltEmail = (currentTutor && currentTutor.altEmail) ? currentTutor.altEmail.toLowerCase().trim() : '';
        const tutorName = (currentTutor && currentTutor.name) ? currentTutor.name.toLowerCase().trim() : '';
        const tutorFirst = tutorName ? tutorName.split(' ')[0] : '';

        const urgentItems = radarItems.filter(item => {
            if (!item || !item.state) return false;
            const code = item.state.code;
            const isUrgent = (
                code === 'CODER_WAITING_FOR_TUTOR' ||
                code === 'TUTOR_WAITING_FOR_CODER' ||
                code === 'STUDENT_ABSENT_ALERT' ||
                code === 'TUTOR_DELAY_CRITICAL' ||
                code === 'CRITICAL_ESCALATION' ||
                code === 'IN_SESSION'
            );
            if (!isUrgent) return false;

            const s = item.schedule || {};
            const contacts = item.contacts || (ClassEscalationEngine.resolveSessionContacts ? ClassEscalationEngine.resolveSessionContacts(s) : {});
            const sEmail = (contacts.tutorEmail || s.tutorEmail || '').toLowerCase().trim();
            const sName = (contacts.tutorName || s.mentor || s.tutorName || '').toLowerCase().trim();

            const isMyClass = (tutorEmail && sEmail === tutorEmail) ||
                              (tutorAltEmail && sEmail === tutorAltEmail) ||
                              (tutorName && sName === tutorName) ||
                              (tutorFirst && sName.includes(tutorFirst));

            let matchStudent = false;
            if (!isMyClass && typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getTutorStudents === 'function') {
                const myStudents = DashboardEngine.getTutorStudents(tutorEmail) || [];
                const schedStudentId = s.studentId || contacts.studentId;
                const schedStudentName = (contacts.studentName || s.studentName || '').toLowerCase().trim();
                matchStudent = myStudents.some(st => (schedStudentId && st.id === schedStudentId) ||
                    (((st.firstName || '') + ' ' + (st.lastName || '')).toLowerCase().trim() === schedStudentName));
            }

            return isMyClass || matchStudent;
        });`;

tutorCode = tutorCode.replace(oldTutorFilterRegex, newTutorFilter);
fs.writeFileSync(tutorEnginePath, tutorCode, 'utf8');
console.log('Successfully scoped renderLiveClassPresenceBanner in tutor-engine.js to currentTutor only!');

// 2. Update classroom-rejoin-beacon.js
let beaconCode = fs.readFileSync(beaconPath, 'utf8');

// Insert isPromptForCurrentUser helper before checkActiveRejoinPrompts
const isPromptHelper = `
  function isPromptForCurrentUser(promptData) {
    if (!promptData) return false;
    if (typeof DashboardEngine === 'undefined' || typeof DashboardEngine.getSession !== 'function') return true;
    const session = DashboardEngine.getSession();
    if (!session || !session.role || !session.email) return true; // If no session established, do not block

    const role = String(session.role).toLowerCase().trim();
    const sessionEmail = String(session.email).toLowerCase().trim();
    const sessionName = String(session.name || '').toLowerCase().trim();
    const sessionFirst = sessionName.split(' ')[0] || '';

    if (role === 'tutor') {
      const pTutorEmail = (promptData.tutorEmail || '').toLowerCase().trim();
      const pTutorName = (promptData.tutorName || '').toLowerCase().trim();
      if (pTutorEmail && (pTutorEmail === sessionEmail)) return true;
      if (sessionFirst && pTutorName.includes(sessionFirst)) return true;
      if (typeof DashboardEngine.getTutorStudents === 'function') {
        const myStudents = DashboardEngine.getTutorStudents(sessionEmail) || [];
        const stId = promptData.studentId;
        const stName = (promptData.studentName || '').toLowerCase().trim();
        return myStudents.some(s => (stId && s.id === stId) || (((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase().trim() === stName));
      }
      return false;
    }

    if (role === 'parent') {
      const pEmail = (promptData.parentEmail || '').toLowerCase().trim();
      if (pEmail && pEmail === sessionEmail) return true;
      if (typeof DashboardEngine.getParentStudents === 'function') {
        const myKids = DashboardEngine.getParentStudents(sessionEmail) || [];
        const stId = promptData.studentId;
        const stName = (promptData.studentName || '').toLowerCase().trim();
        return myKids.some(c => (stId && c.id === stId) || (((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase().trim() === stName));
      }
      return false;
    }

    if (role === 'admin') {
      return true;
    }

    return false;
  }
`;

// Insert isPromptHelper right before function checkActiveRejoinPrompts()
beaconCode = beaconCode.replace('function checkActiveRejoinPrompts() {', isPromptHelper + '\n  function checkActiveRejoinPrompts() {');

// Update checkActiveRejoinPrompts to check isPromptForCurrentUser
const oldCheckRejoin = `      if (activeKey) {
        const promptData = prompts[activeKey];
        mountRejoinBanner(promptData, activeKey);
      } else {
        dismissRejoinBanner();
      }`;

const newCheckRejoin = `      if (activeKey) {
        const promptData = prompts[activeKey];
        if (isPromptForCurrentUser(promptData)) {
          mountRejoinBanner(promptData, activeKey);
        } else {
          dismissRejoinBanner();
        }
      } else {
        dismissRejoinBanner();
      }`;

beaconCode = beaconCode.replace(oldCheckRejoin, newCheckRejoin);
fs.writeFileSync(beaconPath, beaconCode, 'utf8');
console.log('Successfully scoped ClassroomRejoinBeacon to active session (tutor/parent) only!');
