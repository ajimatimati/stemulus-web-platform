const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

// 1. Add Joshua Ogba to coreEnrolledStudents
const targetEnd = `                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          }
];`;

const joshuaBlock = `                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
          {
                    "id": "std-1013-jogb",
                    "firstName": "Joshua",
                    "lastName": "Ogba",
                    "age": 10,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Mrs. Ogba",
                    "parentEmail": "joshuaogba.parent@gmail.com",
                    "parentPhone": "+2348060000000",
                    "program": "Scratch Creators",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Kafayat Abdulwahab",
                    "tutorEmail": "kafayatabdulwahab.et@gmail.com",
                    "tutorId": "tut-105-kafa",
                    "notes": "Assigned to Kafayat Abdulwahab. 4 weekly sessions: Tue 3pm, Wed 3pm, Sat 12pm, Sun 7pm WAT.",
                    "classroomLink": "https://meet.google.com/swf-vyjv-adm",
                    "meetLink": "https://meet.google.com/swf-vyjv-adm",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 16,
                              "projects": 0,
                              "lines": 0
                    }
          }
];`;

const normCode = code.replace(/\r\n/g, '\n');
const normTarget = targetEnd.replace(/\r\n/g, '\n');
const normReplacement = joshuaBlock.replace(/\r\n/g, '\n');

let updated = normCode;
if (updated.includes(normTarget)) {
    updated = updated.replace(normTarget, normReplacement);
    console.log('Added Joshua Ogba to coreEnrolledStudents in dashboard-engine.js');
} else {
    console.warn('Could not match targetEnd for coreEnrolledStudents');
}

// 2. Fix getTutors() object reconstruction to preserve all properties (...t)
const oldTutorReconstruct = `                    tutorMap[key] = {
                        id: t.id || ('tut-' + key),
                        name: t.name || 'Tutor',
                        email: t.email || '',
                        phone: t.phone || '',
                        subjects: t.subjects || ['General Coding'],
                        bio: t.bio || '',
                        availability: t.availability || {},
                        status: t.status || 'active'
                    };`;

const newTutorReconstruct = `                    tutorMap[key] = {
                        ...t,
                        id: t.id || ('tut-' + key),
                        name: t.name || 'Tutor',
                        email: t.email || '',
                        phone: t.phone || '',
                        subjects: t.subjects || ['General Coding'],
                        bio: t.bio || '',
                        availability: t.availability || {},
                        status: t.status || 'active'
                    };`;

if (updated.includes(oldTutorReconstruct.replace(/\r\n/g, '\n'))) {
    updated = updated.replace(oldTutorReconstruct.replace(/\r\n/g, '\n'), newTutorReconstruct.replace(/\r\n/g, '\n'));
    console.log('Enhanced tutorMap[key] with ...t in getTutors().');
}

// Also ensure coreDefaults merges all verified details
const oldCoreDefaultsMerge = `        coreDefaults.forEach(ct => {
            const key = ct.email.toLowerCase().trim();
            if (!tutorMap[key]) {
                tutorMap[key] = ct;
            } else if (!tutorMap[key].name || tutorMap[key].name === 'Tutor') {
                tutorMap[key].name = ct.name;
            }
        });`;

const newCoreDefaultsMerge = `        coreDefaults.forEach(ct => {
            const key = ct.email.toLowerCase().trim();
            if (!tutorMap[key]) {
                tutorMap[key] = { ...ct };
            } else {
                tutorMap[key] = { ...ct, ...tutorMap[key] };
            }
        });`;

if (updated.includes(oldCoreDefaultsMerge.replace(/\r\n/g, '\n'))) {
    updated = updated.replace(oldCoreDefaultsMerge.replace(/\r\n/g, '\n'), newCoreDefaultsMerge.replace(/\r\n/g, '\n'));
    console.log('Enhanced coreDefaults merging in getTutors().');
}

fs.writeFileSync(enginePath, updated, 'utf8');
console.log('Successfully saved fixes in dashboard-engine.js!');
