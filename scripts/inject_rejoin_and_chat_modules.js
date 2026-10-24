const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update admin-dashboard.html
console.log('Updating admin-dashboard.html...');
let adminHtml = fs.readFileSync(path.join(rootDir, 'admin-dashboard.html'), 'utf8');

// 1a. Sidebar link
const adminNavChatTarget = `<a href="#" data-section="whatsapp-bot"`;
const adminNavChatReplacement = ` <li>\r\n <a href="#" data-section="chat" class="nav-link flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-orange-500/15 hover:text-orange-400 transition-colors">\r\n <i data-lucide="messages-square" class="w-5 h-5"></i>\r\n <span>Faculty Messenger</span>\r\n <span id="nav-chat-badge" class="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full hidden">0</span>\r\n </a>\r\n </li>\r\n <li>\r\n <a href="#" data-section="whatsapp-bot"`;

if (!adminHtml.includes('data-section="chat"')) {
    adminHtml = adminHtml.replace(adminNavChatTarget, adminNavChatReplacement);
    console.log('-> Added chat nav link to admin sidebar');
}

// 1b. Section chat
const adminSectionTarget = `<!-- ===== WHATSAPP BOT SECTION ===== -->`;
const adminSectionReplacement = `<!-- ===== FACULTY MESSENGER CHAT SECTION ===== -->\r\n <section id="section-chat" class="admin-section animate-fadeIn" style="display:none;">\r\n <div id="mount-faculty-chat-suite"></div>\r\n </section>\r\n\r\n <!-- ===== WHATSAPP BOT SECTION ===== -->`;

if (!adminHtml.includes('id="section-chat"')) {
    adminHtml = adminHtml.replace(adminSectionTarget, adminSectionReplacement);
    console.log('-> Added #section-chat to admin-dashboard.html');
}

// 1c. Script tags
const adminScriptTarget = `<script src="assets/js/session-content-analysis-engine.js" defer></script>`;
const adminScriptReplacement = `<script src="assets/js/classroom-rejoin-beacon.js" defer></script>\r\n <script src="assets/js/faculty-chat-engine.js" defer></script>\r\n <script src="assets/js/session-content-analysis-engine.js" defer></script>`;

if (!adminHtml.includes('assets/js/faculty-chat-engine.js')) {
    adminHtml = adminHtml.replace(adminScriptTarget, adminScriptReplacement);
    console.log('-> Injected script tags to admin-dashboard.html');
}

// 1d. Auto-mount
const adminMountTarget = `if (typeof ClassEscalationEngine !== 'undefined') {\r\n ClassEscalationEngine.startWatchdog(15000);\r\n }`;
const adminMountTargetAlt = `if (typeof ClassEscalationEngine !== 'undefined') {\n ClassEscalationEngine.startWatchdog(15000);\n }`;

const adminMountReplacement = `if (typeof ClassEscalationEngine !== 'undefined') {\r\n ClassEscalationEngine.startWatchdog(15000);\r\n }\r\n if (typeof ClassroomRejoinBeacon !== 'undefined') {\r\n ClassroomRejoinBeacon.init();\r\n }\r\n if (typeof FacultyChatEngine !== 'undefined') {\r\n FacultyChatEngine.init('admin');\r\n FacultyChatEngine.renderChatSuite();\r\n }`;

if (!adminHtml.includes('FacultyChatEngine.renderChatSuite()')) {
    if (adminHtml.includes(adminMountTarget)) {
        adminHtml = adminHtml.replace(adminMountTarget, adminMountReplacement);
    } else if (adminHtml.includes(adminMountTargetAlt)) {
        adminHtml = adminHtml.replace(adminMountTargetAlt, adminMountReplacement);
    } else {
        // Fallback replacement near initOpsAndCelebrations
        adminHtml = adminHtml.replace(`window.addEventListener('stemulus_db_loaded', initOpsAndCelebrations);`, `window.addEventListener('stemulus_db_loaded', initOpsAndCelebrations);\r\n setTimeout(() => { if (typeof FacultyChatEngine !== 'undefined') { FacultyChatEngine.init('admin'); FacultyChatEngine.renderChatSuite(); } if (typeof ClassroomRejoinBeacon !== 'undefined') { ClassroomRejoinBeacon.init(); } }, 700);`);
    }
    console.log('-> Injected FacultyChatEngine init & render in admin-dashboard.html');
}

fs.writeFileSync(path.join(rootDir, 'admin-dashboard.html'), adminHtml, 'utf8');

// 2. Update assets/js/admin-engine.js
console.log('Updating assets/js/admin-engine.js...');
let adminJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'admin-engine.js'), 'utf8');

const targetTitles = `'recordings': 'Class Recordings & Safeguarding Vault' };`;
const replaceTitles = `'recordings': 'Class Recordings & Safeguarding Vault', 'chat': 'Faculty Messenger Suite' };`;

if (!adminJs.includes(`'chat': 'Faculty Messenger Suite'`)) {
    adminJs = adminJs.replace(targetTitles, replaceTitles);
    console.log('-> Added chat to SECTION_TITLES in admin-engine.js');
}

const targetSwitch = `if (sectionName === 'recordings') { if (typeof loadClassRecordings === 'function') loadClassRecordings(); }`;
const replaceSwitch = `if (sectionName === 'chat') { if (typeof FacultyChatEngine !== 'undefined') FacultyChatEngine.renderChatSuite(); }\n if (sectionName === 'recordings') { if (typeof loadClassRecordings === 'function') loadClassRecordings(); }`;

if (!adminJs.includes(`sectionName === 'chat'`)) {
    adminJs = adminJs.replace(targetSwitch, replaceSwitch);
    console.log('-> Added chat handler to navigateToSection in admin-engine.js');
}

fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'admin-engine.js'), adminJs, 'utf8');

// 3. Update tutor-dashboard.html
console.log('Updating tutor-dashboard.html...');
let tutorHtml = fs.readFileSync(path.join(rootDir, 'tutor-dashboard.html'), 'utf8');

const tutorNavTarget = `<a href="javascript:void(0)" onclick="TutorEngine.openProfileModal()"`;
const tutorNavReplacement = `<a href="javascript:void(0)" onclick="if(typeof FacultyChatEngine!=='undefined'){FacultyChatEngine.openTutorDrawer();}" class="flex items-center gap-3 px-4 py-3 font-medium transition-all hover:bg-white/10 hover:text-white" style="border-radius:16px;color:rgba(255,255,255,0.75);" title="Admin Direct Line">\r\n <i data-lucide="messages-square" class="w-5 h-5 shrink-0"></i> <span class="nav-text">Admin Direct Line</span>\r\n <span id="tutor-chat-badge" class="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full hidden">0</span>\r\n </a>\r\n <a href="javascript:void(0)" onclick="TutorEngine.openProfileModal()"`;

if (!tutorHtml.includes('Admin Direct Line')) {
    tutorHtml = tutorHtml.replace(tutorNavTarget, tutorNavReplacement);
    console.log('-> Added Admin Direct Line link to tutor-dashboard.html');
}

const tutorScriptTarget = `<script src="assets/js/bilingual-classroom-engine.js" defer></script>`;
const tutorScriptReplacement = `<script src="assets/js/classroom-rejoin-beacon.js" defer></script>\r\n <script src="assets/js/faculty-chat-engine.js" defer></script>\r\n <script src="assets/js/bilingual-classroom-engine.js" defer></script>`;

if (!tutorHtml.includes('assets/js/faculty-chat-engine.js')) {
    tutorHtml = tutorHtml.replace(tutorScriptTarget, tutorScriptReplacement);
    console.log('-> Injected script tags to tutor-dashboard.html');
}

const tutorInitTarget = `var el = document.getElementById("mount-tutor-dual-switcher");`;
const tutorInitReplacement = `var el = document.getElementById("mount-tutor-dual-switcher");\r\n if (typeof ClassroomRejoinBeacon !== "undefined") { ClassroomRejoinBeacon.init(); }\r\n if (typeof FacultyChatEngine !== "undefined") { FacultyChatEngine.init('tutor'); }`;

if (!tutorHtml.includes(`FacultyChatEngine.init('tutor')`)) {
    tutorHtml = tutorHtml.replace(tutorInitTarget, tutorInitReplacement);
    console.log('-> Added FacultyChatEngine and ClassroomRejoinBeacon init to tutor-dashboard.html');
}

if (!tutorHtml.includes('id="mount-tutor-chat-drawer"')) {
    tutorHtml = tutorHtml.replace('</body>', ' <!-- Mount for Tutor Direct Line Chat Drawer -->\r\n <div id="mount-tutor-chat-drawer"></div>\r\n</body>');
    console.log('-> Added #mount-tutor-chat-drawer before </body>');
}

fs.writeFileSync(path.join(rootDir, 'tutor-dashboard.html'), tutorHtml, 'utf8');

// 4. Update parent-dashboard.html
console.log('Updating parent-dashboard.html...');
let parentHtml = fs.readFileSync(path.join(rootDir, 'parent-dashboard.html'), 'utf8');

const parentScriptTarget = `<script src="assets/js/class-reminder-engine.js" defer></script>`;
const parentScriptReplacement = `<script src="assets/js/classroom-rejoin-beacon.js" defer></script>\r\n <script src="assets/js/class-reminder-engine.js" defer></script>`;

if (!parentHtml.includes('assets/js/classroom-rejoin-beacon.js')) {
    parentHtml = parentHtml.replace(parentScriptTarget, parentScriptReplacement);
    console.log('-> Injected classroom-rejoin-beacon.js to parent-dashboard.html');
}

const parentInitTarget = `var el = document.getElementById("mount-parent-dual-switcher");`;
const parentInitReplacement = `var el = document.getElementById("mount-parent-dual-switcher");\r\n if (typeof ClassroomRejoinBeacon !== "undefined") { ClassroomRejoinBeacon.init(); }`;

if (!parentHtml.includes('ClassroomRejoinBeacon.init()')) {
    parentHtml = parentHtml.replace(parentInitTarget, parentInitReplacement);
    console.log('-> Added ClassroomRejoinBeacon.init to parent-dashboard.html');
}

fs.writeFileSync(path.join(rootDir, 'parent-dashboard.html'), parentHtml, 'utf8');

console.log('All dashboard modules injected successfully!');
