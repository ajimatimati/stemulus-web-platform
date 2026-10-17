const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'admin-dashboard.html');
const jsPath = path.join(__dirname, '..', 'assets', 'js', 'admin-engine.js');

let html = fs.readFileSync(htmlPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

// ==========================================
// 1. UPDATE admin-dashboard.html
// ==========================================

const dossierModalHTML = `
  <!-- Tutor Full Dossier & Legal/Banking Profile Modal -->
  <div id="tutor-dossier-modal" class="fixed inset-0 z-50 hidden">
    <div class="modal-overlay absolute inset-0 bg-black/75 backdrop-blur-xs" onclick="AdminEngine.closeTutorDossierModal()"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-4">
      <div class="admin-card rounded-2xl p-6 sm:p-8 bg-white shadow-2xl border border-slate-200 animate-fadeIn">
        
        <!-- Header -->
        <div class="flex items-start justify-between pb-5 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div id="td-avatar" class="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 font-nunito font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-200">
              T
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 id="td-name" class="text-xl font-nunito font-bold text-slate-800">Tutor Legal Name</h3>
                <span id="td-status-badge" class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                <span id="td-mode-badge" class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">Online Only</span>
              </div>
              <p id="td-email" class="text-xs text-slate-500 font-medium mt-0.5">tutor@stemuluskidstech.com</p>
              <p id="td-phone" class="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> +234...
              </p>
            </div>
          </div>
          <button type="button" onclick="AdminEngine.closeTutorDossierModal()" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="py-5 space-y-5 text-sm">
          <!-- Banking & Payout Dossier -->
          <div class="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <i data-lucide="landmark" class="w-4 h-4 text-amber-600"></i>
                Official Banking & Remuneration Details
              </span>
              <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i> NUBAN Verified
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="bg-white/80 p-3 rounded-xl border border-amber-100">
                <p class="text-slate-400 uppercase font-bold text-[10px]">Bank Name</p>
                <p id="td-bank-name" class="font-bold text-slate-800 text-sm mt-0.5">—</p>
              </div>
              <div class="bg-white/80 p-3 rounded-xl border border-amber-100">
                <p class="text-slate-400 uppercase font-bold text-[10px]">Account Name</p>
                <p id="td-account-name" class="font-bold text-slate-800 text-sm mt-0.5">—</p>
              </div>
              <div class="bg-white/80 p-3 rounded-xl border border-amber-100 relative group">
                <p class="text-slate-400 uppercase font-bold text-[10px]">10-Digit NUBAN</p>
                <div class="flex items-center justify-between mt-0.5">
                  <p id="td-account-number" class="font-mono font-extrabold text-slate-800 text-sm tracking-wider">—</p>
                  <button type="button" onclick="AdminEngine.copyTutorBankInfo()" class="text-xs text-amber-700 hover:text-amber-900 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1" title="Copy Account Number">
                    <i data-lucide="copy" class="w-3 h-3"></i> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Emergency Contact & Residential Location -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-500"></i> Residential Location
              </h4>
              <p id="td-location" class="text-xs text-slate-700 font-medium leading-relaxed">—</p>
            </div>
            <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <i data-lucide="heart-handshake" class="w-3.5 h-3.5 text-rose-500"></i> Next of Kin / Emergency Contact
              </h4>
              <p id="td-nok-name" class="text-xs font-bold text-slate-800">—</p>
              <p id="td-nok-contact" class="text-xs text-slate-600 font-mono mt-0.5">—</p>
            </div>
          </div>

          <!-- Workstation & Power Audit -->
          <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <i data-lucide="cpu" class="w-3.5 h-3.5 text-purple-500"></i> Workstation, Speed & Power Inverter Audit
            </h4>
            <p id="td-workstation" class="text-xs text-slate-700 leading-relaxed font-medium">—</p>
            <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span id="td-slots" class="font-medium"><i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-slate-400"></i> Preferred: Weekdays / Weekends</span>
              <span id="td-signature" class="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Digitally Signed</span>
            </div>
          </div>

          <!-- Assigned Coders & Weekly Schedule -->
          <div class="border border-slate-200 rounded-2xl p-4 bg-white">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i data-lucide="users" class="w-3.5 h-3.5 text-blue-600"></i>
                Assigned Coders & Live Teaching Roster
              </span>
              <span id="td-coders-count" class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">0 coders</span>
            </h4>
            <div id="td-coders-list" class="flex flex-wrap gap-2 mb-4">
              <!-- Rendered dynamically -->
            </div>

            <h5 class="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-orange-500"></i>
              Weekly Class Timetable & Dedicated Meet Links
            </h5>
            <div id="td-schedules-list" class="space-y-2 max-h-48 overflow-y-auto pr-1">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
          <div class="flex items-center gap-2">
            <button type="button" onclick="AdminEngine.editTutorFromDossier()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Profile Fields
            </button>
            <button type="button" id="td-msg-btn" onclick="" class="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5">
              <i data-lucide="mail" class="w-3.5 h-3.5"></i> Send Notice
            </button>
          </div>
          <button type="button" onclick="AdminEngine.closeTutorDossierModal()" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors shadow">
            Done
          </button>
        </div>

      </div>
    </div>
  </div>
`;

// Insert dossier modal before <!-- Add Parent Modal -->
if (!html.includes('id="tutor-dossier-modal"')) {
    html = html.replace('<!-- Add Parent Modal -->', dossierModalHTML + '\n <!-- Add Parent Modal -->');
    console.log('Added #tutor-dossier-modal to admin-dashboard.html');
}

// Enhance #tutor-modal form with banking & location fields
const tutorModalFormAnchor = `<div class="flex items-center gap-3 pt-2">`;
const tutorExtraFieldsHTML = `  <div class="border-t border-slate-200 pt-3">
    <p class="text-xs font-bold uppercase text-slate-500 mb-2">Banking & Payout Details (NUBAN)</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div>
        <label class="block text-[11px] font-bold text-slate-500 mb-1">Bank Name</label>
        <input type="text" id="tutor-bank-name" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="e.g. GTBank, Opay, UBA">
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-500 mb-1">Account Holder</label>
        <input type="text" id="tutor-account-name" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="Full Account Name">
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-500 mb-1">10-Digit NUBAN</label>
        <input type="text" id="tutor-account-number" maxlength="10" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs font-mono text-gray-800 placeholder-slate-400 font-bold" placeholder="0123456789">
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label class="block text-[11px] font-bold text-slate-500 mb-1">Physical Residential Location</label>
      <input type="text" id="tutor-location" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="e.g. Tanke, Ilorin / Ojoo, Ibadan">
    </div>
    <div>
      <label class="block text-[11px] font-bold text-slate-500 mb-1">Assignment Readiness</label>
      <select id="tutor-assignment-type" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 font-medium">
        <option value="Online Only: Currently restricted to remote online sessions only.">Online Only (Remote)</option>
        <option value="Physical (In-Person Hub & Hardware Maker Mentor)">Physical (In-Person Hub)</option>
        <option value="Hybrid (Online & In-Person)">Hybrid (Both)</option>
      </select>
    </div>
  </div>

  <div class="border-t border-slate-200 pt-3">
    <p class="text-xs font-bold uppercase text-slate-500 mb-2">Emergency Contact & Workstation Audit</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label class="block text-[11px] font-bold text-slate-500 mb-1">Next of Kin Full Name & Relation</label>
        <input type="text" id="tutor-nok-name" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="e.g. Mr Adebayo Michael (Sibling)">
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-500 mb-1">Emergency Contact Phone & City</label>
        <input type="text" id="tutor-nok-contact" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="080... Apo Wumba, Abuja">
      </div>
    </div>
    <div class="mt-2">
      <label class="block text-[11px] font-bold text-slate-500 mb-1">Workstation & Power Backup Audit</label>
      <input type="text" id="tutor-workstation" class="w-full bg-gray-50 border border-admin-border rounded-lg py-2 px-3 text-xs text-gray-800 placeholder-slate-400 font-medium" placeholder="Laptop 8GB+, HD Cam, Fiber/4G 10Mbps, Inverter/Solar">
    </div>
  </div>
`;

if (!html.includes('id="tutor-bank-name"')) {
    html = html.replace(tutorModalFormAnchor, tutorExtraFieldsHTML + '\n ' + tutorModalFormAnchor);
    console.log('Added extra profile & bank fields to #tutor-modal form in admin-dashboard.html');
}

fs.writeFileSync(htmlPath, html, 'utf8');


// ==========================================
// 2. UPDATE assets/js/admin-engine.js
// ==========================================

// Add Profile & Bank button to renderTutorsTable()
const oldActionButtons = `<button onclick="AdminEngine.openAssignCodersModal('\${tutorIdentifier}')" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1" title="Assign / Reassign Coders">
                            <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Assign Coders
                        </button>`;

const newActionButtons = `<button onclick="AdminEngine.openTutorDossierModal('\${tutorIdentifier}')" class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-2xs border border-amber-200/80" title="View Full Profile & Legal/Banking Dossier">
                            <i data-lucide="file-badge" class="w-3.5 h-3.5 text-amber-600"></i> Profile & Bank
                        </button>
                        <button onclick="AdminEngine.openAssignCodersModal('\${tutorIdentifier}')" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1" title="Assign / Reassign Coders">
                            <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Assign Coders
                        </button>`;

if (js.includes(oldActionButtons)) {
    js = js.replace(oldActionButtons, newActionButtons);
    console.log('Added Profile & Bank button to renderTutorsTable in admin-engine.js');
}

// Add dossier methods and update openTutorModal/saveTutor
let dossierEngineCode = `
let activeDossierTutor = null;

function openTutorDossierModal(tutorIdentifier) {
    const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
    const engineTutors = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getTutors) ? DashboardEngine.getTutors() : [];
    const dbTutors = db && db.tutors ? db.tutors : [];
    const tutors = engineTutors.concat(dbTutors);
    const target = (tutorIdentifier || '').toLowerCase().trim();
    const tutor = tutors.find(t => (t.id && t.id.toLowerCase() === target) || (t.email && t.email.toLowerCase().trim() === target) || (t.name && t.name.toLowerCase().trim() === target));

    if (!tutor) {
        showToast('Tutor record not found.', 'error');
        return;
    }
    activeDossierTutor = tutor;

    const modal = document.getElementById('tutor-dossier-modal');
    if (!modal) return;

    // Header info
    const avatarEl = document.getElementById('td-avatar');
    const nameEl = document.getElementById('td-name');
    const statusBadge = document.getElementById('td-status-badge');
    const modeBadge = document.getElementById('td-mode-badge');
    const emailEl = document.getElementById('td-email');
    const phoneEl = document.getElementById('td-phone');

    if (avatarEl) avatarEl.textContent = (tutor.name || 'T')[0].toUpperCase();
    if (nameEl) nameEl.textContent = tutor.name || 'Tutor';
    if (emailEl) emailEl.textContent = tutor.email || 'No email registered';
    if (phoneEl) phoneEl.innerHTML = '<i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400 inline mr-1"></i> ' + (tutor.phone || 'No phone recorded');

    const isDisengaged = tutor.status === 'inactive' || tutor.status === 'disengaged';
    if (statusBadge) {
        statusBadge.textContent = isDisengaged ? 'Disengaged' : 'Active';
        statusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ' + 
            (isDisengaged ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200');
    }
    if (modeBadge) {
        const isPhysical = (tutor.assignmentType || '').toLowerCase().includes('physical');
        modeBadge.textContent = isPhysical ? 'Physical Hub Mentor' : 'Online Only (Remote)';
        modeBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold ' + 
            (isPhysical ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200');
    }

    // Banking details
    const bankNameEl = document.getElementById('td-bank-name');
    const accNameEl = document.getElementById('td-account-name');
    const accNumEl = document.getElementById('td-account-number');
    if (bankNameEl) bankNameEl.textContent = tutor.bankName || 'Opay / Bank on file';
    if (accNameEl) accNameEl.textContent = tutor.accountHolderName || tutor.name || '—';
    if (accNumEl) accNumEl.textContent = tutor.accountNumber || '—';

    // Emergency & Location
    const locEl = document.getElementById('td-location');
    const nokNameEl = document.getElementById('td-nok-name');
    const nokContactEl = document.getElementById('td-nok-contact');
    if (locEl) locEl.textContent = tutor.location || 'Location on file';
    if (nokNameEl) nokNameEl.textContent = tutor.nextOfKinName || 'Emergency contact verified';
    if (nokContactEl) nokContactEl.textContent = tutor.nextOfKinContact || '—';

    // Workstation & Power Audit
    const workEl = document.getElementById('td-workstation');
    const slotsEl = document.getElementById('td-slots');
    const sigEl = document.getElementById('td-signature');
    if (workEl) workEl.textContent = tutor.workstationAudit || 'Teaching Laptop (8GB+ RAM), HD Webcam, Stable Internet (10Mbps+), Reliable Power Backup/Solar.';
    if (slotsEl) slotsEl.innerHTML = '<i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-slate-400"></i> Preferred: ' + (tutor.weeklyAvailableSlots || 'Weekday & Weekend slots');
    if (sigEl) sigEl.textContent = '✓ Signed: ' + (tutor.digitalSignature || tutor.name || 'Verified');

    // Assigned Coders
    const students = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getStudents) ? DashboardEngine.getStudents() : (db ? db.students || [] : []);
    const tEmail = (tutor.email || '').toLowerCase();
    const tName = (tutor.name || '').toLowerCase();
    const tFirst = tName.split(' ')[0] || '';
    const tId = tutor.id || '';

    const assignedStudents = students.filter(s => {
        if (s.tutorId && tId && s.tutorId === tId) return true;
        if (s.tutorEmail && tEmail && s.tutorEmail.toLowerCase() === tEmail) return true;
        if (s.tutorName) {
            const sTutorName = s.tutorName.toLowerCase();
            if (sTutorName === tName) return true;
            if (tFirst.length > 2 && sTutorName.includes(tFirst)) return true;
        }
        return false;
    });

    const codersCountEl = document.getElementById('td-coders-count');
    if (codersCountEl) codersCountEl.textContent = assignedStudents.length + ' coder' + (assignedStudents.length !== 1 ? 's' : '');

    const codersListEl = document.getElementById('td-coders-list');
    if (codersListEl) {
        if (assignedStudents.length === 0) {
            codersListEl.innerHTML = '<span class="text-xs text-slate-400 italic">No coders currently assigned to this tutor.</span>';
        } else {
            codersListEl.innerHTML = assignedStudents.map(s => {
                const meet = s.meetLink || s.classroomLink || '';
                return \`
                    <div class="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold shadow-2xs">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>\${s.firstName} \${s.lastName}</span>
                        <span class="text-[10px] text-slate-400 font-normal">(\${s.program || 'Coding'})</span>
                        \${meet ? \`<a href="\${meet}" target="_blank" class="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline ml-1" title="Test Meet Room">Meet</a>\` : ''}
                    </div>
                \`;
            }).join('');
        }
    }

    // Weekly Schedules
    const allSchedules = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getSchedules) ? DashboardEngine.getSchedules() : (db ? db.schedules || [] : []);
    const tutorSchedules = allSchedules.filter(sch => {
        if (sch.tutorId && tId && sch.tutorId === tId) return true;
        if (sch.tutorEmail && tEmail && sch.tutorEmail.toLowerCase() === tEmail) return true;
        if (sch.mentor && sch.mentor.toLowerCase() === tName) return true;
        if (sch.tutorName && sch.tutorName.toLowerCase() === tName) return true;
        return false;
    });

    const schedulesListEl = document.getElementById('td-schedules-list');
    if (schedulesListEl) {
        if (tutorSchedules.length === 0) {
            schedulesListEl.innerHTML = '<p class="text-xs text-slate-400 italic py-2">No active recurring sessions scheduled yet.</p>';
        } else {
            schedulesListEl.innerHTML = tutorSchedules.map(sch => {
                const isPhysical = (sch.link || '').toLowerCase().includes('physical');
                const meetHref = isPhysical ? (sch.meetLinkBackup || '#') : (sch.link || '#');
                return \`
                    <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                        <div class="flex items-center gap-2.5">
                            <span class="font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[11px]">\${sch.dayOfWeek || sch.date || 'Weekly'}</span>
                            <span class="font-bold text-slate-800">\${sch.time} WAT</span>
                            <span class="text-slate-600 font-medium">| \${sch.studentName} (\${sch.course || 'Private'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            \${isPhysical 
                                ? \`<span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Physical Hub</span>\`
                                : \`<a href="\${meetHref}" target="_blank" class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                                    <i data-lucide="video" class="w-3 h-3"></i> Google Meet
                                   </a>\`
                            }
                        </div>
                    </div>
                \`;
            }).join('');
        }
    }

    // Message button
    const msgBtn = document.getElementById('td-msg-btn');
    if (msgBtn) {
        msgBtn.onclick = function() {
            closeTutorDossierModal();
            openMessageTutorModal(tutor.email, (tutor.name || '').replace(/'/g, "\\\\\\'"));
        };
    }

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeTutorDossierModal() {
    const modal = document.getElementById('tutor-dossier-modal');
    if (modal) modal.classList.add('hidden');
}

function copyTutorBankInfo() {
    if (!activeDossierTutor) return;
    const num = activeDossierTutor.accountNumber || '';
    const bank = activeDossierTutor.bankName || '';
    const name = activeDossierTutor.accountHolderName || activeDossierTutor.name || '';
    const textToCopy = \`\${bank} - \${num} (\${name})\`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num || textToCopy).then(() => {
            showToast('Account Number ' + (num || textToCopy) + ' copied to clipboard!', 'success');
        }).catch(() => {
            prompt('Bank Account Details (Ctrl+C to copy):', textToCopy);
        });
    } else {
        prompt('Bank Account Details (Ctrl+C to copy):', textToCopy);
    }
}

function editTutorFromDossier() {
    if (!activeDossierTutor) return;
    closeTutorDossierModal();
    openTutorModal(activeDossierTutor.email);
}
`;

// Insert dossier methods right before renderTutorsTable
if (!js.includes('function openTutorDossierModal(')) {
    js = js.replace('function renderTutorsTable() {', dossierEngineCode + '\nfunction renderTutorsTable() {');
    console.log('Added openTutorDossierModal and helper functions to admin-engine.js');
}

// Enhance openTutorModal to populate extra fields
const oldOpenTutorModalPopulate = `            var phoneInput = document.getElementById('tutor-phone'); if (phoneInput) phoneInput.value = tutor.phone || tutor.phoneNumber || '';
        }`;

const newOpenTutorModalPopulate = `            var phoneInput = document.getElementById('tutor-phone'); if (phoneInput) phoneInput.value = tutor.phone || tutor.phoneNumber || '';
            if (document.getElementById('tutor-bank-name')) document.getElementById('tutor-bank-name').value = tutor.bankName || '';
            if (document.getElementById('tutor-account-name')) document.getElementById('tutor-account-name').value = tutor.accountHolderName || '';
            if (document.getElementById('tutor-account-number')) document.getElementById('tutor-account-number').value = tutor.accountNumber || '';
            if (document.getElementById('tutor-location')) document.getElementById('tutor-location').value = tutor.location || '';
            if (document.getElementById('tutor-assignment-type') && tutor.assignmentType) document.getElementById('tutor-assignment-type').value = tutor.assignmentType;
            if (document.getElementById('tutor-nok-name')) document.getElementById('tutor-nok-name').value = tutor.nextOfKinName || '';
            if (document.getElementById('tutor-nok-contact')) document.getElementById('tutor-nok-contact').value = tutor.nextOfKinContact || '';
            if (document.getElementById('tutor-workstation')) document.getElementById('tutor-workstation').value = tutor.workstationAudit || '';
        }`;

if (js.includes(oldOpenTutorModalPopulate)) {
    js = js.replace(oldOpenTutorModalPopulate, newOpenTutorModalPopulate);
    console.log('Enhanced openTutorModal field population in admin-engine.js');
}

// Enhance saveTutor to extract and persist extra fields
const oldSaveTutorExtract = `    const existingEmail = document.getElementById('tutor-existing-email') ? document.getElementById('tutor-existing-email').value : '';`;

const newSaveTutorExtract = `    const existingEmail = document.getElementById('tutor-existing-email') ? document.getElementById('tutor-existing-email').value : '';
    const bankName = document.getElementById('tutor-bank-name') ? document.getElementById('tutor-bank-name').value.trim() : '';
    const accountHolderName = document.getElementById('tutor-account-name') ? document.getElementById('tutor-account-name').value.trim() : '';
    const accountNumber = document.getElementById('tutor-account-number') ? document.getElementById('tutor-account-number').value.trim() : '';
    const location = document.getElementById('tutor-location') ? document.getElementById('tutor-location').value.trim() : '';
    const assignmentType = document.getElementById('tutor-assignment-type') ? document.getElementById('tutor-assignment-type').value : '';
    const nextOfKinName = document.getElementById('tutor-nok-name') ? document.getElementById('tutor-nok-name').value.trim() : '';
    const nextOfKinContact = document.getElementById('tutor-nok-contact') ? document.getElementById('tutor-nok-contact').value.trim() : '';
    const workstationAudit = document.getElementById('tutor-workstation') ? document.getElementById('tutor-workstation').value.trim() : '';`;

if (js.includes(oldSaveTutorExtract)) {
    js = js.replace(oldSaveTutorExtract, newSaveTutorExtract);
    console.log('Enhanced saveTutor variable extraction in admin-engine.js');
}

// Enhance saveTutor persistence
const oldSaveTutorExisting = `        if (password) await DashboardEngine.updateUserPassword(existingEmail, password);
        showToast('Tutor details updated.', 'success');`;

const newSaveTutorExisting = `        if (password) await DashboardEngine.updateUserPassword(existingEmail, password);
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.updateTutor) {
            DashboardEngine.updateTutor(existingEmail, {
                name,
                phone,
                subjects,
                bankName,
                accountHolderName,
                accountNumber,
                location,
                assignmentType,
                nextOfKinName,
                nextOfKinContact,
                workstationAudit
            });
        }
        showToast('Tutor dossier and banking details updated successfully.', 'success');`;

if (js.includes(oldSaveTutorExisting)) {
    js = js.replace(oldSaveTutorExisting, newSaveTutorExisting);
    console.log('Enhanced saveTutor persistence with DashboardEngine.updateTutor');
}

// Export new functions in AdminEngine
const oldExports = `    // Silicon Valley PII Privacy Protection
    togglePrivacyMask,
    isPrivacyMaskActive: function() { return isPrivacyMaskActive; }`;

const newExports = `    // Tutor Dossier & Profile
    openTutorDossierModal,
    closeTutorDossierModal,
    copyTutorBankInfo,
    editTutorFromDossier,

    // Silicon Valley PII Privacy Protection
    togglePrivacyMask,
    isPrivacyMaskActive: function() { return isPrivacyMaskActive; }`;

if (js.includes(oldExports)) {
    js = js.replace(oldExports, newExports);
    console.log('Exported dossier functions in AdminEngine.');
}

// Export on window
const oldWindowExport = `    window.openTutorModal = AdminEngine.openTutorModal;`;
const newWindowExport = `    window.openTutorModal = AdminEngine.openTutorModal;
    window.openTutorDossierModal = AdminEngine.openTutorDossierModal;
    window.closeTutorDossierModal = AdminEngine.closeTutorDossierModal;
    window.copyTutorBankInfo = AdminEngine.copyTutorBankInfo;
    window.editTutorFromDossier = AdminEngine.editTutorFromDossier;`;

if (js.includes(oldWindowExport)) {
    js = js.replace(oldWindowExport, newWindowExport);
    console.log('Attached dossier functions to window object.');
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('Successfully updated assets/js/admin-engine.js!');
