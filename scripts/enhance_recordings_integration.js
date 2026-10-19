const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// 1. Update admin-dashboard.html with 1-click Google Drive recordings button
const adminPath = path.join(ROOT, 'admin-dashboard.html');
let adminHtml = fs.readFileSync(adminPath, 'utf8');

const targetBtn = `<button type="button" onclick="AdminEngine.openManualBotDispatchModal()" class="bg-indigo-600`;
const replacementBtn = `<a href="https://drive.google.com/drive/u/0/search?q=Meet%20Recordings" target="_blank" rel="noopener noreferrer" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 no-underline cursor-pointer" title="Direct access to Google Drive Meet Recordings cloud archive">
        <i data-lucide="hard-drive" class="w-4 h-4"></i>
        <span>Google Drive Archive</span>
      </a>
      <button type="button" onclick="AdminEngine.openManualBotDispatchModal()" class="bg-indigo-600`;

if (!adminHtml.includes('Google Drive Archive') && adminHtml.includes(targetBtn)) {
  adminHtml = adminHtml.replace(targetBtn, replacementBtn);
  fs.writeFileSync(adminPath, adminHtml, 'utf8');
  console.log('[Success] Added Google Drive Archive button to admin-dashboard.html');
} else {
  console.log('[Notice] Google Drive Archive button already present or target not found.');
}

// 2. Update parent-engine.js with "Auto-Recorded" badge on meeting link pill
const parentEnginePath = path.join(ROOT, 'assets', 'js', 'parent-engine.js');
let parentEngineJs = fs.readFileSync(parentEnginePath, 'utf8');

const parentTarget = `target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-100 font-mono text-[11px] font-semibold transition-colors">
                                        <i data-lucide="video" class="w-3.5 h-3.5 text-blue-600"></i> \${(s.meetLink || s.classroomLink).replace('https://', '')}
                                    </a>`;

const parentReplacement = `target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/80 font-mono text-[11px] font-semibold transition-colors no-underline" title="Dedicated Google Meet Classroom (Automatically Recorded via Google Cloud for Child Safeguarding): \${s.meetLink || s.classroomLink}">
                                        <i data-lucide="video" class="w-3.5 h-3.5 text-blue-600"></i>
                                        <span>\${(s.meetLink || s.classroomLink).replace('https://', '')}</span>
                                        <span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-sans ml-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Auto-Recorded
                                        </span>
                                    </a>`;

if (!parentEngineJs.includes('Auto-Recorded') && parentEngineJs.includes(parentTarget)) {
  parentEngineJs = parentEngineJs.replace(parentTarget, parentReplacement);
  fs.writeFileSync(parentEnginePath, parentEngineJs, 'utf8');
  console.log('[Success] Added Auto-Recorded badge to parent-engine.js');
} else {
  console.log('[Notice] Auto-Recorded badge in parent-engine.js already present or target not found.');
}

// 3. Update tutor-engine.js with "Auto-Recorded" badge on meeting link pill
const tutorEnginePath = path.join(ROOT, 'assets', 'js', 'tutor-engine.js');
let tutorEngineJs = fs.readFileSync(tutorEnginePath, 'utf8');

const tutorTarget = `<a href="\${meetUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-mono font-semibold transition-colors no-underline" title="Dedicated Google Meet Classroom: \${meetUrl}">
                    <i data-lucide="video" style="width:12px;height:12px;" class="text-blue-600"></i>
                    <span>\${meetCode}</span>
                </a>`;

const tutorReplacement = `<a href="\${meetUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-mono font-semibold transition-colors no-underline" title="Dedicated Google Meet Classroom (Automatically Recorded for Student Safeguarding & Quality Assurance): \${meetUrl}">
                    <i data-lucide="video" style="width:12px;height:12px;" class="text-blue-600"></i>
                    <span>\${meetCode}</span>
                    <span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-sans ml-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Auto-Recorded
                    </span>
                </a>`;

if (!tutorEngineJs.includes('Auto-Recorded') && tutorEngineJs.includes(tutorTarget)) {
  tutorEngineJs = tutorEngineJs.replace(tutorTarget, tutorReplacement);
  fs.writeFileSync(tutorEnginePath, tutorEngineJs, 'utf8');
  console.log('[Success] Added Auto-Recorded badge to tutor-engine.js');
} else {
  console.log('[Notice] Auto-Recorded badge in tutor-engine.js already present or target not found.');
}
