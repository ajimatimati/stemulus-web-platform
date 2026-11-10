const fs = require('fs');
const path = require('path');

console.log('--- Updating Portals for Direct Meeting Access & Removing LMS/Pass ---');

// 1. Update assets/js/parent-engine.js
let parentEngine = fs.readFileSync('assets/js/parent-engine.js', 'utf8');

// Remove curriculum/slides link in renderStudents
parentEngine = parentEngine.replace(
  /<div class="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">[\s\S]*?<a href="curriculum\/slides\/index\.html\?role=student[\s\S]*?<\/div>/,
  `<div class="pt-1">
                        <a href="parent-progress.html?studentId=\${s.id}" class="btn-3d btn-3d-secondary w-full border border-indigo-100 flex items-center justify-center gap-2 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors">
                            <i data-lucide="bar-chart-2" class="w-4 h-4 text-indigo-600"></i>
                            <span>Track Learning Progress &rarr;</span>
                        </a>
                    </div>`
);

// Replace join-class.html in renderUpcomingSchedule
parentEngine = parentEngine.replace(
  /<a href="join-class\.html\?id=\${encodeURIComponent\(s\.id\)}&role=parent&url=\${encodeURIComponent\(joinUrl\)}"[\s\S]*?<\/a>/,
  `<a href="\${joinUrl}" target="_blank" rel="noopener noreferrer" 
                            onclick="ParentEngine.launchMeeting(event, '\${joinUrl}', '\${s.id}', '\${(s.studentName || '').replace(/'/g, \"\\\\'\")}', '\${(s.course || '').replace(/'/g, \"\\\\'\")}')"
                            class="btn-3d btn-3d-blue px-3.5 py-2 min-h-[38px] text-xs rounded-xl inline-flex items-center justify-center gap-1.5 no-underline cursor-pointer" title="Launch Google Meet room (1080p recording &amp; transcript active)">
                            <i data-lucide="video" class="w-3.5 h-3.5"></i> \${isPhysical ? 'Backup Meet' : 'Join Session'}
                        </a>`
);

// Add launchMeeting to ParentEngine
if (!parentEngine.includes('function launchMeeting(')) {
  const parentLaunchMeetingFn = `
    function launchMeeting(e, url, scheduleId, studentName, courseName) {
        const targetUrl = url || 'https://meet.google.com';
        if (typeof STEMulus !== 'undefined' && STEMulus.Classroom && typeof STEMulus.Classroom.launchMeetingSession === 'function') {
            STEMulus.Classroom.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        } else if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.launchMeetingSession === 'function') {
            DashboardEngine.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'parent',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        }
    }
`;
  parentEngine = parentEngine.replace('return {', parentLaunchMeetingFn + '\n    return {\n        launchMeeting,');
}
fs.writeFileSync('assets/js/parent-engine.js', parentEngine, 'utf8');
console.log('Updated assets/js/parent-engine.js');

// 2. Update assets/js/tutor-engine.js
let tutorEngine = fs.readFileSync('assets/js/tutor-engine.js', 'utf8');

// Replace join-class.html in renderSchedules
tutorEngine = tutorEngine.replace(
  /<a href="join-class\.html\?id=\${encodeURIComponent\(s\.id\)}&role=tutor&url=\${encodeURIComponent\(s\.link \|\| 'https:\/\/meet\.google\.com'\)}"[\s\S]*?<\/a>/,
  `<a href="\${s.link || 'https://meet.google.com'}" target="_blank" rel="noopener noreferrer" 
                            onclick="TutorEngine.launchMeeting(event, '\${s.link || 'https://meet.google.com'}', '\${s.id}', '\${(s.studentName || '').replace(/'/g, \"\\\\'\")}', '\${(s.course || '').replace(/'/g, \"\\\\'\")}')"
                            class="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer" title="Launch Google Meet session (Auto-records 1080p for safeguarding &amp; live transcript)">
                            <i data-lucide="video" class="w-3.5 h-3.5 text-emerald-600"></i> Google Meet
                        </a>`
);

// Add launchMeeting to TutorEngine
if (!tutorEngine.includes('function launchMeeting(')) {
  const tutorLaunchMeetingFn = `
    function launchMeeting(e, url, scheduleId, studentName, courseName) {
        const targetUrl = url || 'https://meet.google.com';
        if (typeof STEMulus !== 'undefined' && STEMulus.Classroom && typeof STEMulus.Classroom.launchMeetingSession === 'function') {
            STEMulus.Classroom.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'tutor',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        } else if (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.launchMeetingSession === 'function') {
            DashboardEngine.launchMeetingSession({
                scheduleId: scheduleId || '',
                role: 'tutor',
                meetingUrl: targetUrl,
                studentName: studentName || 'Coder',
                courseName: courseName || 'STEMulus Class'
            });
        }
    }
`;
  tutorEngine = tutorEngine.replace('return {', tutorLaunchMeetingFn + '\n    return {\n        launchMeeting,');
}
fs.writeFileSync('assets/js/tutor-engine.js', tutorEngine, 'utf8');
console.log('Updated assets/js/tutor-engine.js');

// 3. Update tutor-dashboard.html (remove slides, assessments, prompt lab, pass, lms hub)
let tutorHtml = fs.readFileSync('tutor-dashboard.html', 'utf8');
// Remove sidebar links: curriculum/slides, interactive_assessment_runner, prompt_tester
tutorHtml = tutorHtml.replace(
  /<a href="curriculum\/slides\/index\.html\?role=tutor"[\s\S]*?<\/a>\s*<a href="curriculum\/assessments\/interactive_assessment_runner\.html\?role=tutor"[\s\S]*?<\/a>\s*<a href="curriculum\/prompt_lab\/prompt_tester\.html\?role=tutor"[\s\S]*?<\/a>/,
  ''
);
// Remove quick action cards: curriculum/slides, interactive_assessment_runner, prompt_tester, academy.html, learner-hub.html
tutorHtml = tutorHtml.replace(
  /<a href="curriculum\/slides\/index\.html\?role=tutor" class="action-btn-item"[\s\S]*?<\/a>\s*<a href="curriculum\/assessments\/interactive_assessment_runner\.html\?role=tutor" class="action-btn-item">[\s\S]*?<\/a>\s*<a href="curriculum\/prompt_lab\/prompt_tester\.html\?role=tutor" class="action-btn-item">[\s\S]*?<\/a>\s*<a href="academy\.html" target="_blank" class="action-btn-item">[\s\S]*?<\/a>\s*<a href="learner-hub\.html" target="_blank" class="action-btn-item">[\s\S]*?<\/a>/,
  ''
);
fs.writeFileSync('tutor-dashboard.html', tutorHtml, 'utf8');
console.log('Updated tutor-dashboard.html');

// 4. Update parent-dashboard.html (remove curriculum/slides, prompt_lab)
let parentHtml = fs.readFileSync('parent-dashboard.html', 'utf8');
// Remove sidebar links
parentHtml = parentHtml.replace(
  /<a href="curriculum\/slides\/index\.html\?role=parent"[\s\S]*?<\/a>\s*<a href="curriculum\/prompt_lab\/prompt_tester\.html\?role=parent"[\s\S]*?<\/a>/,
  ''
);
// Remove quick actions
parentHtml = parentHtml.replace(
  /<a href="curriculum\/slides\/index\.html\?role=parent" class="action-btn-item"[\s\S]*?<\/a>\s*<a href="curriculum\/prompt_lab\/prompt_tester\.html\?role=parent" class="action-btn-item">[\s\S]*?<\/a>/,
  ''
);
fs.writeFileSync('parent-dashboard.html', parentHtml, 'utf8');
console.log('Updated parent-dashboard.html');

// 5. Update admin-dashboard.html (remove curriculum slides sidebar link)
let adminHtml = fs.readFileSync('admin-dashboard.html', 'utf8');
adminHtml = adminHtml.replace(
  /<li>\s*<a href="curriculum\/slides\/index\.html\?role=admin"[\s\S]*?<\/li>/,
  ''
);
fs.writeFileSync('admin-dashboard.html', adminHtml, 'utf8');
console.log('Updated admin-dashboard.html');

// 6. Update index.html (remove Digital Academy link in header)
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
  /<a href="academy\.html">Digital Academy<\/a>/,
  ''
);
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Updated index.html');

// 7. Update assets/js/class-reminder-engine.js
let classReminder = fs.readFileSync('assets/js/class-reminder-engine.js', 'utf8');
classReminder = classReminder.replace(
  /function buildPortalLaunchLink\(schedule, role, participantsOverride, rawMeetOverride, forceAbsolute = false\) \{[\s\S]*?return `join-class\.html\?\$\{q\.toString\(\)\}`;[\s\S]*?\}/,
  `function buildPortalLaunchLink(schedule, role, participantsOverride, rawMeetOverride, forceAbsolute = false) {
    const participants = participantsOverride || resolveScheduleParticipants(schedule);
    const rawMeetUrl = rawMeetOverride || resolveMeetingLink(schedule, participants);
    return rawMeetUrl || 'https://meet.google.com';
  }`
);
fs.writeFileSync('assets/js/class-reminder-engine.js', classReminder, 'utf8');
console.log('Updated assets/js/class-reminder-engine.js');

// 8. Update assets/js/email-service.js
let emailService = fs.readFileSync('assets/js/email-service.js', 'utf8');
emailService = emailService.replace(
  /function buildPortalClassroomUrl\(schedule, student, role\) \{[\s\S]*?return `\$\{baseOrigin\}\/join-class\.html\?\$\{q\.toString\(\)\}`;[\s\S]*?\}/,
  `function buildPortalClassroomUrl(schedule, student, role) {
    var rawUrl = (schedule && (schedule.link || schedule.meetLink)) || (student && (student.meetLink || student.classroomLink)) || 'https://meet.google.com';
    return rawUrl;
  }`
);
fs.writeFileSync('assets/js/email-service.js', emailService, 'utf8');
console.log('Updated assets/js/email-service.js');

// 9. Update netlify/functions/send-email.js
let sendEmail = fs.readFileSync('netlify/functions/send-email.js', 'utf8');
sendEmail = sendEmail.replace(
  /function buildPortalClassroomUrl\(d, role\) \{[\s\S]*?return `\$\{SITE_URL\}\/join-class\.html\?\$\{params\.toString\(\)\}`;[\s\S]*?\}/,
  `function buildPortalClassroomUrl(d, role) {
  return extractRawMeetUrl(d);
}`
);
fs.writeFileSync('netlify/functions/send-email.js', sendEmail, 'utf8');
console.log('Updated netlify/functions/send-email.js');

// 10. Update assets/js/mulu-widget.js
let muluWidget = fs.readFileSync('assets/js/mulu-widget.js', 'utf8');
muluWidget = muluWidget.replace(
  /case 'open_classroom': \{\s*window\.location\.href = 'join-class\.html';\s*break;\s*\}/,
  `case 'open_classroom': {
          var session = (typeof DashboardEngine !== 'undefined' && typeof DashboardEngine.getSession === 'function') ? DashboardEngine.getSession() : null;
          var target = (session && session.role === 'tutor') ? 'tutor-dashboard.html' : 'parent-dashboard.html';
          window.location.href = target;
          break;
        }`
);
fs.writeFileSync('assets/js/mulu-widget.js', muluWidget, 'utf8');
console.log('Updated assets/js/mulu-widget.js');

// 11. Update sitemap.xml
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
sitemap = sitemap.replace(
  /\s*<!-- Interactive Curriculum & AI Resources -->[\s\S]*?<loc>https:\/\/stemuluskidstech\.com\/curriculum\/prompt_lab\/prompt_tester\.html<\/loc>\s*<\/url>/,
  ''
);
fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
console.log('Updated sitemap.xml');

// 12. Update netlify.toml
let netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
if (!netlifyToml.includes('from = "/academy.html"')) {
  const redirectsToAdd = `
# Retired Academy Pass, Quest LMS, and Curriculum slides
[[redirects]]
  from = "/academy.html"
  to = "/programs.html"
  status = 301

[[redirects]]
  from = "/learner-hub.html"
  to = "/programs.html"
  status = 301

[[redirects]]
  from = "/curriculum/*"
  to = "/programs.html"
  status = 301
`;
  netlifyToml += redirectsToAdd;
  fs.writeFileSync('netlify.toml', netlifyToml, 'utf8');
  console.log('Updated netlify.toml');
}

console.log('All portal updates completed successfully.');
