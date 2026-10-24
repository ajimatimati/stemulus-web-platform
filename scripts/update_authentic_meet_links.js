const fs = require('fs');
const path = require('path');

const dashboardEnginePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
let content = fs.readFileSync(dashboardEnginePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Replace old meet links in initial data and schedules
// Old: cjr-phmf-ahs (Myles) -> New: miz-dthg-pmt
// Old: ocz-qcjr-cqb (David) -> New: ckd-ngjs-cth
// Old: swf-vyjv-adm (Joshua) -> New: yko-xwce-ugd
// Old: mxh-ndjc-gox (Gbolade) -> New: qye-ezub-uqi
// Old: mim-qifa-avc (was on Pearl) -> New on Pearl: bbx-ocde-ytw (Farouq takes mim-qifa-avc)
// Old: miz-dthg-pmt on Daniel -> stm-demo-dan

// Let's replace specifically in schedule and student mappings
// For Pearl:
content = content.replace(/"https:\/\/meet\.google\.com\/mim-qifa-avc"/g, '"https://meet.google.com/bbx-ocde-ytw"');
content = content.replace(/'https:\/\/meet\.google\.com\/mim-qifa-avc'/g, "'https://meet.google.com/bbx-ocde-ytw'");

// For Gbolade:
content = content.replace(/"https:\/\/meet\.google\.com\/mxh-ndjc-gox"/g, '"https://meet.google.com/qye-ezub-uqi"');
content = content.replace(/'https:\/\/meet\.google\.com\/mxh-ndjc-gox'/g, "'https://meet.google.com/qye-ezub-uqi'");

// For Myles:
content = content.replace(/"https:\/\/meet\.google\.com\/cjr-phmf-ahs"/g, '"https://meet.google.com/miz-dthg-pmt"');
content = content.replace(/'https:\/\/meet\.google\.com\/cjr-phmf-ahs'/g, "'https://meet.google.com/miz-dthg-pmt'");

// For Joshua:
content = content.replace(/"https:\/\/meet\.google\.com\/swf-vyjv-adm"/g, '"https://meet.google.com/yko-xwce-ugd"');
content = content.replace(/'https:\/\/meet\.google\.com\/swf-vyjv-adm'/g, "'https://meet.google.com/yko-xwce-ugd'");

// For David:
content = content.replace(/"https:\/\/meet\.google\.com\/ocz-qcjr-cqb"/g, '"https://meet.google.com/ckd-ngjs-cth"');
content = content.replace(/'https:\/\/meet\.google\.com\/ocz-qcjr-cqb'/g, "'https://meet.google.com/ckd-ngjs-cth'");

// For Daniel M. (Demo): change from miz-dthg-pmt to stm-demo-dan so Daniel does not collide with Myles Omosuyi
content = content.replace(/id: "std-1001",([^}]+)classroomLink:"https:\/\/meet\.google\.com\/miz-dthg-pmt"/g, 'id: "std-1001",$1classroomLink:"https://meet.google.com/stm-demo-dan"');
content = content.replace(/id: "std-1001",([^}]+)meetLink:"https:\/\/meet\.google\.com\/miz-dthg-pmt"/g, 'id: "std-1001",$1meetLink:"https://meet.google.com/stm-demo-dan"');

// For Alexandra Sotayo: change from bbx-ocde-ytw to stm-sotayo-alex so she doesn't collide with Pearl Babalola
content = content.replace(/id: "std-1004-e1rm",([^}]+)classroomLink:"https:\/\/meet\.google\.com\/bbx-ocde-ytw"/g, 'id: "std-1004-e1rm",$1classroomLink:"https://meet.google.com/stm-sotayo-alex"');
content = content.replace(/id: "std-1004-e1rm",([^}]+)meetLink:"https:\/\/meet\.google\.com\/bbx-ocde-ytw"/g, 'id: "std-1004-e1rm",$1meetLink:"https://meet.google.com/stm-sotayo-alex"');

// Also update Daniel's lines 2393-2396 if any:
content = content.replace(/if \(s\.id === 'std-1001' && !s\.meetLink\) \{\s*s\.meetLink = '[^']+';\s*s\.classroomLink = s\.classroomLink \|\| '[^']+';/g, 
  "if (s.id === 'std-1001' && !s.meetLink) {\n                    s.meetLink = 'https://meet.google.com/stm-demo-dan';\n                    s.classroomLink = s.classroomLink || 'https://meet.google.com/stm-demo-dan';");

// Check if Farouq is in coreEnrolledStudents
if (!content.includes('std-1014-faro')) {
  const farouqEntry = `          {
                    "id": "std-1014-faro",
                    "firstName": "Farouq",
                    "lastName": "",
                    "age": 10,
                    "birthday": "",
                    "hasExplicitBirthday": false,
                    "parentName": "Parent of Farouq",
                    "parentEmail": "farouq.parent@stemuluskidstech.com",
                    "parentPhone": "",
                    "program": "Coding Track",
                    "status": "active",
                    "remindersPaused": false,
                    "progress": 0,
                    "tutorName": "Sarah Jane",
                    "tutorEmail": "tutor@stemuluskidstech.com",
                    "tutorId": "tut-101",
                    "notes": "Authentic Google Pro Meet link mapped from Coders Class Links.",
                    "classroomLink": "https://meet.google.com/mim-qifa-avc",
                    "meetLink": "https://meet.google.com/mim-qifa-avc",
                    "skills": {
                              "logic": 50,
                              "loops": 50,
                              "variables": 50,
                              "syntax": 50,
                              "projects": 50
                    },
                    "metrics": {
                              "attended": 0,
                              "total": 8,
                              "projects": 0,
                              "lines": 0
                    }
          },
`;
  content = content.replace('const coreEnrolledStudents = [', 'const coreEnrolledStudents = [\n' + farouqEntry);
}

// Update studentMeetMap in dashboard-engine.js
const targetMapRegex = /const studentMeetMap = \{[\s\S]*?\};/;
const updatedStudentMeetMap = `const studentMeetMap = {
                "std-1001": "https://meet.google.com/stm-demo-dan",
                "std-1002": "https://meet.google.com/gua-sisg-tei",
                "std-1003-8ecr": "https://meet.google.com/zhv-jquf-rem",
                "std-1004-e1rm": "https://meet.google.com/stm-sotayo-alex",
                "std-1005-6f4y": "https://meet.google.com/kos-rxkp-bkd",
                "std-1006-il0c": "https://meet.google.com/wvh-vwbr-hoq",
                "std-1007-r4cv": "https://meet.google.com/bbx-ocde-ytw",
                "std-1008-a0lp": "https://meet.google.com/qye-ezub-uqi",
                "std-1009-tbod": "https://meet.google.com/miz-dthg-pmt",
                "std-1010-ilb5": "https://meet.google.com/gyd-fewb-cdh",
                "std-1011-tq1u": "https://meet.google.com/vdp-nmbh-sjj",
                "std-1012-wq6b": "https://meet.google.com/ckd-ngjs-cth",
                "std-1013-jogb": "https://meet.google.com/yko-xwce-ugd",
                "std-1014-faro": "https://meet.google.com/mim-qifa-avc"
            };`;

content = content.replace(targetMapRegex, updatedStudentMeetMap);

// Add proactive sync in getDB to guarantee cached localStorage gets migrated:
const migrationHook = `
            // Proactive sync for Authentic Google Pro Meet Links
            const AUTH_MEET_LINKS = {
                'pearl': 'https://meet.google.com/bbx-ocde-ytw',
                'babalola': 'https://meet.google.com/bbx-ocde-ytw',
                'gbolade': 'https://meet.google.com/qye-ezub-uqi',
                'okesanjo': 'https://meet.google.com/qye-ezub-uqi',
                'myles': 'https://meet.google.com/miz-dthg-pmt',
                'omosuyi': 'https://meet.google.com/miz-dthg-pmt',
                'junayd': 'https://meet.google.com/gyd-fewb-cdh',
                'kari': 'https://meet.google.com/gyd-fewb-cdh',
                'joshua': 'https://meet.google.com/yko-xwce-ugd',
                'ogba': 'https://meet.google.com/yko-xwce-ugd',
                'momooreoluwa': 'https://meet.google.com/vdp-nmbh-sjj',
                'sonaike': 'https://meet.google.com/vdp-nmbh-sjj',
                'david': 'https://meet.google.com/ckd-ngjs-cth',
                'gjoka': 'https://meet.google.com/ckd-ngjs-cth',
                'farouq': 'https://meet.google.com/mim-qifa-avc'
            };

            function getAuthMeet(nameStr) {
                if (!nameStr) return null;
                const low = nameStr.toLowerCase();
                for (const k in AUTH_MEET_LINKS) {
                    if (low.includes(k)) return AUTH_MEET_LINKS[k];
                }
                return null;
            }

            if (parsed.students && Array.isArray(parsed.students)) {
                parsed.students.forEach(s => {
                    const fullName = ((s.firstName || '') + ' ' + (s.lastName || '')).trim();
                    const authM = getAuthMeet(fullName) || studentMeetMap[s.id];
                    if (authM && s.meetLink !== authM) {
                        s.meetLink = authM;
                        s.classroomLink = authM;
                        studentsAppended = true;
                    }
                });
            }

            if (parsed.schedules && Array.isArray(parsed.schedules)) {
                parsed.schedules.forEach(sch => {
                    const authM = getAuthMeet(sch.studentName);
                    if (authM) {
                        if (sch.link && sch.link.includes('Physical')) {
                            if (sch.meetLinkBackup !== authM) {
                                sch.meetLinkBackup = authM;
                                studentsAppended = true;
                            }
                        } else if (sch.link !== authM) {
                            sch.link = authM;
                            studentsAppended = true;
                        }
                    }
                });
            }
`;

// Insert the migration hook right after coreEnrolledStudents.forEach
const insertAfter = 'coreEnrolledStudents.forEach(ces => {';
if (content.includes(insertAfter)) {
    // Find the end of coreEnrolledStudents.forEach block
    const hookMarker = '// 2b. Sync official tutor reassignments as dispatched';
    if (content.includes(hookMarker)) {
        content = content.replace(hookMarker, migrationHook + '\n            ' + hookMarker);
    }
}

fs.writeFileSync(dashboardEnginePath, content, 'utf8');
console.log('Successfully updated dashboard-engine.js! New length:', content.length);
