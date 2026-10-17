const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'tutor-dashboard.html');
const jsPath = path.join(__dirname, '..', 'assets', 'js', 'tutor-engine.js');

let html = fs.readFileSync(htmlPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

// 1. UPDATE tutor-dashboard.html
const oldBioBlock = `          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Instructor Bio &amp; Pedagogy</label>
            <textarea id="tp-bio" rows="2" placeholder="Tell parents and students about your background, passions, and teaching style..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>`;

const newBioAndBankBlock = `          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Instructor Bio &amp; Pedagogy</label>
            <textarea id="tp-bio" rows="2" placeholder="Tell parents and students about your background, passions, and teaching style..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>

          <!-- Official Banking & Workstation Audit -->
          <div class="border-t border-slate-100 pt-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <i data-lucide="landmark" class="w-4 h-4 text-amber-500"></i>
              Remuneration & Banking Details (NUBAN)
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bank Name</label>
                <input type="text" id="tp-bank-name" placeholder="e.g. Opay, GTBank, UBA" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Account Holder</label>
                <input type="text" id="tp-account-name" placeholder="Account Name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">10-Digit NUBAN</label>
                <input type="text" id="tp-account-number" maxlength="10" placeholder="0123456789" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 font-bold">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Residential Location</label>
              <input type="text" id="tp-location" placeholder="City / Address" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Emergency Contact / Next of Kin</label>
              <input type="text" id="tp-nok" placeholder="Name & Phone Number" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
            </div>
          </div>`;

const normHtml = html.replace(/\r\n/g, '\n');
const normOldBio = oldBioBlock.replace(/\r\n/g, '\n');
const normNewBio = newBioAndBankBlock.replace(/\r\n/g, '\n');

if (normHtml.includes(normOldBio) && !normHtml.includes('id="tp-bank-name"')) {
    html = normHtml.replace(normOldBio, normNewBio);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Added bank and profile inputs to tutor-dashboard.html');
}

// 2. UPDATE assets/js/tutor-engine.js
const normJs = js.replace(/\r\n/g, '\n');

const oldOpenProfilePopulate = `        if (nameInput) nameInput.value = tutor.name || '';
        if (emailInput) emailInput.value = tutor.email || email || '';
        if (phoneInput) phoneInput.value = tutor.phone || tutor.whatsapp || '';
        if (subjectsInput) {
            subjectsInput.value = Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : (tutor.subjects || '');
        }
        if (bioInput) bioInput.value = tutor.bio || '';`;

const newOpenProfilePopulate = `        if (nameInput) nameInput.value = tutor.name || '';
        if (emailInput) emailInput.value = tutor.email || email || '';
        if (phoneInput) phoneInput.value = tutor.phone || tutor.whatsapp || '';
        if (subjectsInput) {
            subjectsInput.value = Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : (tutor.subjects || '');
        }
        if (bioInput) bioInput.value = tutor.bio || '';

        const bankNameInput = document.getElementById('tp-bank-name');
        const accNameInput = document.getElementById('tp-account-name');
        const accNumInput = document.getElementById('tp-account-number');
        const locInput = document.getElementById('tp-location');
        const nokInput = document.getElementById('tp-nok');

        if (bankNameInput) bankNameInput.value = tutor.bankName || '';
        if (accNameInput) accNameInput.value = tutor.accountHolderName || tutor.name || '';
        if (accNumInput) accNumInput.value = tutor.accountNumber || '';
        if (locInput) locInput.value = tutor.location || '';
        if (nokInput) nokInput.value = tutor.nextOfKinName ? (tutor.nextOfKinName + (tutor.nextOfKinContact ? ' (' + tutor.nextOfKinContact + ')' : '')) : '';`;

const oldSaveProfileLogic = `        // Save to DashboardEngine/db
        const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
        if (db && db.tutors) {
            const idx = db.tutors.findIndex(t => t.email && t.email.toLowerCase() === email);
            if (idx !== -1) {
                db.tutors[idx].name = name;
                db.tutors[idx].phone = phone;
                db.tutors[idx].subjects = subjects;
                db.tutors[idx].bio = bio;
                db.tutors[idx].availability = availability;
                DashboardEngine.saveDB(db);
            }
        }`;

const newSaveProfileLogic = `        const bankName = (document.getElementById('tp-bank-name') ? document.getElementById('tp-bank-name').value : '').trim();
        const accountHolderName = (document.getElementById('tp-account-name') ? document.getElementById('tp-account-name').value : '').trim();
        const accountNumber = (document.getElementById('tp-account-number') ? document.getElementById('tp-account-number').value : '').trim();
        const location = (document.getElementById('tp-location') ? document.getElementById('tp-location').value : '').trim();

        // Save to DashboardEngine/db
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.updateTutor) {
            DashboardEngine.updateTutor(email, {
                name,
                phone,
                subjects,
                bio,
                availability,
                bankName,
                accountHolderName,
                accountNumber,
                location
            });
        } else {
            const db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
            if (db && db.tutors) {
                const idx = db.tutors.findIndex(t => t.email && t.email.toLowerCase() === email);
                if (idx !== -1) {
                    db.tutors[idx].name = name;
                    db.tutors[idx].phone = phone;
                    db.tutors[idx].subjects = subjects;
                    db.tutors[idx].bio = bio;
                    db.tutors[idx].availability = availability;
                    db.tutors[idx].bankName = bankName;
                    db.tutors[idx].accountHolderName = accountHolderName;
                    db.tutors[idx].accountNumber = accountNumber;
                    db.tutors[idx].location = location;
                    DashboardEngine.saveDB(db);
                }
            }
        }`;

let updatedJs = normJs;
if (updatedJs.includes(oldOpenProfilePopulate.replace(/\r\n/g, '\n'))) {
    updatedJs = updatedJs.replace(oldOpenProfilePopulate.replace(/\r\n/g, '\n'), newOpenProfilePopulate);
    console.log('Updated openProfileModal in tutor-engine.js');
}

if (updatedJs.includes(oldSaveProfileLogic.replace(/\r\n/g, '\n'))) {
    updatedJs = updatedJs.replace(oldSaveProfileLogic.replace(/\r\n/g, '\n'), newSaveProfileLogic);
    console.log('Updated saveProfile in tutor-engine.js');
}

fs.writeFileSync(jsPath, updatedJs, 'utf8');
console.log('Finished updating tutor-dashboard.html & tutor-engine.js!');
