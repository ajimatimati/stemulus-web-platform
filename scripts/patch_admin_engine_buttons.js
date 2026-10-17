const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'assets', 'js', 'admin-engine.js');
let code = fs.readFileSync(jsPath, 'utf8');

// 1. Add DashboardEngine.updateTutor to saveTutor
const oldSaveElse = `    } else {
        if (password) await DashboardEngine.updateUserPassword(existingEmail, password);
        showToast('Tutor details updated.', 'success');
    }`;

const newSaveElse = `    } else {
        if (password) await DashboardEngine.updateUserPassword(existingEmail, password);
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
        showToast('Tutor details and banking dossier updated.', 'success');
    }`;

// Normalize line endings
const normCode = code.replace(/\r\n/g, '\n');
const normOldSave = oldSaveElse.replace(/\r\n/g, '\n');
const normNewSave = newSaveElse.replace(/\r\n/g, '\n');

let updated = normCode;
if (updated.includes(normOldSave)) {
    updated = updated.replace(normOldSave, normNewSave);
    console.log('Patched saveTutor with DashboardEngine.updateTutor.');
}

// 2. Add Profile & Bank button in renderTutorsTable
const oldActionButtons = `<button onclick="AdminEngine.openAssignCodersModal('\${tutorIdentifier}')" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1" title="Assign / Reassign Coders">`;
const newActionButtons = `<button onclick="AdminEngine.openTutorDossierModal('\${tutorIdentifier}')" class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-200/80 shadow-2xs" title="View Full Profile & Legal/Banking Dossier">
                            <i data-lucide="file-badge" class="w-3.5 h-3.5 text-amber-600"></i> Profile & Bank
                        </button>
                        <button onclick="AdminEngine.openAssignCodersModal('\${tutorIdentifier}')" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1" title="Assign / Reassign Coders">`;

if (updated.includes(oldActionButtons)) {
    updated = updated.replace(oldActionButtons, newActionButtons);
    console.log('Added Profile & Bank button to renderTutorsTable in admin-engine.js.');
}

// 3. Make sure openTutorModal populates all fields
const oldOpenPopulate = `            var phoneInput = document.getElementById('tutor-phone'); if (phoneInput) phoneInput.value = tutor.phone || tutor.phoneNumber || '';
        }`;

const newOpenPopulate = `            var phoneInput = document.getElementById('tutor-phone'); if (phoneInput) phoneInput.value = tutor.phone || tutor.phoneNumber || '';
            if (document.getElementById('tutor-bank-name')) document.getElementById('tutor-bank-name').value = tutor.bankName || '';
            if (document.getElementById('tutor-account-name')) document.getElementById('tutor-account-name').value = tutor.accountHolderName || '';
            if (document.getElementById('tutor-account-number')) document.getElementById('tutor-account-number').value = tutor.accountNumber || '';
            if (document.getElementById('tutor-location')) document.getElementById('tutor-location').value = tutor.location || '';
            if (document.getElementById('tutor-assignment-type') && tutor.assignmentType) document.getElementById('tutor-assignment-type').value = tutor.assignmentType;
            if (document.getElementById('tutor-nok-name')) document.getElementById('tutor-nok-name').value = tutor.nextOfKinName || '';
            if (document.getElementById('tutor-nok-contact')) document.getElementById('tutor-nok-contact').value = tutor.nextOfKinContact || '';
            if (document.getElementById('tutor-workstation')) document.getElementById('tutor-workstation').value = tutor.workstationAudit || '';
        }`;

const normOldOpen = oldOpenPopulate.replace(/\r\n/g, '\n');
const normNewOpen = newOpenPopulate.replace(/\r\n/g, '\n');

if (updated.includes(normOldOpen)) {
    updated = updated.replace(normOldOpen, normNewOpen);
    console.log('Patched openTutorModal field population.');
}

// 4. Also ensure exports include openTutorDossierModal
if (!updated.includes('openTutorDossierModal,')) {
    updated = updated.replace('// Silicon Valley PII Privacy Protection', `// Tutor Dossier & Profile\n    openTutorDossierModal,\n    closeTutorDossierModal,\n    copyTutorBankInfo,\n    editTutorFromDossier,\n\n    // Silicon Valley PII Privacy Protection`);
    console.log('Exported openTutorDossierModal in AdminEngine object.');
}

fs.writeFileSync(jsPath, updated, 'utf8');
console.log('Finished updating admin-engine.js!');
