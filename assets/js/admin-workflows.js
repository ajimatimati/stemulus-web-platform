/**
 * STEMulus Admin Workflows
 * 5 self-contained workflow modules appended to AdminEngine.
 * Depends on: DashboardEngine, Tailwind CSS, Lucide icons.
 */

// ── DashboardEngine stubs for methods that may not exist ──────────────────────
if (typeof DashboardEngine !== 'undefined') {
  if (!DashboardEngine.getTutors)
    DashboardEngine.getTutors = () => {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        return Object.values(db.users || {}).filter(u => u.role === 'tutor');
      } catch(e) { return []; }
    };

  if (!DashboardEngine.addTutor)
    DashboardEngine.addTutor = (t) => {
      if (DashboardEngine.addUser) {
        return DashboardEngine.addUser({ ...t, role: 'tutor' });
      }
    };

  if (!DashboardEngine.getSchedules)
    DashboardEngine.getSchedules = () => {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        return db.schedules || [];
      } catch(e) { return []; }
    };

  if (!DashboardEngine.addSchedule)
    DashboardEngine.addSchedule = (s) => {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        if (!db.schedules) db.schedules = [];
        const record = { ...s, id: s.id || ('sch-' + Date.now()) };
        db.schedules.push(record);
        if (DashboardEngine.saveDB) DashboardEngine.saveDB(db);
        else localStorage.setItem('stemulus_db', JSON.stringify(db));
        return record;
      } catch(e) { return s; }
    };

  if (!DashboardEngine.getAttendanceLogs)
    DashboardEngine.getAttendanceLogs = () => {
      if (DashboardEngine.getAttendanceRecords) return DashboardEngine.getAttendanceRecords();
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        return db.attendanceRecords || [];
      } catch(e) { return []; }
    };

  if (!DashboardEngine.getEnrollments)
    DashboardEngine.getEnrollments = () => {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        return db.enrollments || [];
      } catch (e) { return []; }
    };

  if (!DashboardEngine.getStudents)
    DashboardEngine.getStudents = () => {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        return db.students || [];
      } catch (e) { return []; }
    };
}

// ── Namespace ─────────────────────────────────────────────────────────────────
const AdminWorkflows = {};

// ── Shared Utilities ──────────────────────────────────────────────────────────
AdminWorkflows.showToast = function (message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-[9999] space-y-3';
    document.body.appendChild(container);
  }
  const colors = {
    success: 'bg-orange-500',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };
  const bg = colors[type] || colors.success;
  const toast = document.createElement('div');
  toast.className = `${bg} text-white px-5 py-3.5 rounded-xl shadow-xl text-sm flex items-center gap-3 animate-fadeIn`;
  toast.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'check-circle'}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.remove(), 3000);
};

AdminWorkflows.closeModal = function (modalId) {
  const el = document.getElementById(modalId);
  if (el) el.remove();
};

AdminWorkflows.generateTempPassword = function () {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < 12; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

AdminWorkflows._sendEmail = async function (type, data) {
  try {
    const res = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data })
    });
    return res.ok ? await res.json() : { success: false };
  } catch (e) {
    console.warn('[AdminWorkflows] Email send failed:', e);
    return { success: false };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 · OnboardingWizard
// ─────────────────────────────────────────────────────────────────────────────
AdminWorkflows.OnboardingWizard = {

  _buildShell(title) {
    const id = 'wiz-modal-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-fadeIn">
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 class="text-xl font-bold text-slate-800">${title}</h2>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div id="${id}-stepper" class="px-6 pt-5"></div>
        <div id="${id}-body" class="p-6"></div>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
    return id;
  },

  _renderStepper(modalId, steps, current) {
    const el = document.getElementById(modalId + '-stepper');
    if (!el) return;
    el.innerHTML = `<div class="flex items-center mb-2">${steps.map((s, i) => `
      <div class="flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}">
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
            ${i + 1 < current ? 'bg-emerald-500 border-emerald-500 text-white' : i + 1 === current ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'}">
            ${i + 1 < current ? '<i data-lucide="check" class="w-4 h-4"></i>' : i + 1}
          </div>
          <span class="text-[10px] mt-1 font-semibold ${i + 1 === current ? 'text-blue-600' : 'text-slate-400'} whitespace-nowrap">${s}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="flex-1 h-0.5 mx-2 mb-4 ${i + 1 < current ? 'bg-emerald-400' : 'bg-slate-200'}"></div>` : ''}
      </div>`).join('')}
    </div>`;
    if (window.lucide) lucide.createIcons();
  },

  openParentOnboarding(prefillData = {}) {
    const id = this._buildShell('Onboard New Parent');
    const steps = ['Parent Details', 'Child Details', 'Account Setup', 'Confirmation'];
    let step = 1;
    const data = { parent: { ...prefillData }, children: [{}], password: '' };

    const render = () => {
      this._renderStepper(id, steps, step);
      const body = document.getElementById(id + '-body');
      if (!body) return;

      if (step === 1) {
        body.innerHTML = `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Full Name *</label>
                <input id="wiz-p-name" value="${data.parent.name || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Parent full name"></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Email *</label>
                <input id="wiz-p-email" type="email" value="${data.parent.email || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="email@example.com"></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                <input id="wiz-p-phone" value="${data.parent.phone || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="+234..."></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">WhatsApp Number</label>
                <input id="wiz-p-wa" value="${data.parent.whatsapp || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="+234..."></div>
            </div>
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Country</label>
              <input id="wiz-p-country" value="${data.parent.country || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Nigeria"></div>
          </div>
          <div class="flex justify-end mt-6">
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Next Step</button>
          </div>`;
        document.getElementById('wiz-next').onclick = () => {
          const name = document.getElementById('wiz-p-name').value.trim();
          const email = document.getElementById('wiz-p-email').value.trim();
          if (!name || !email) { AdminWorkflows.showToast('Name and email are required.', 'warning'); return; }
          data.parent = { name, email, phone: document.getElementById('wiz-p-phone').value.trim(), whatsapp: document.getElementById('wiz-p-wa').value.trim(), country: document.getElementById('wiz-p-country').value.trim() };
          step = 2; render();
        };
      }

      else if (step === 2) {
        const programs = ['Python', 'Scratch', 'Robotics', 'Web Dev', 'AI/ML', 'Digital Art', 'Unity/Roblox'];
        const levels = ['None', 'Beginner', 'Intermediate', 'Advanced'];
        const childForms = data.children.map((c, i) => `
          <div class="border border-slate-100 rounded-xl p-4 mb-4 bg-slate-50" data-child="${i}">
            <h4 class="font-semibold text-slate-700 text-sm mb-3">Child ${i + 1}</h4>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                <input class="child-name w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value="${c.name || ''}" placeholder="Child's name"></div>
              <div><label class="block text-xs font-medium text-slate-500 mb-1">Age *</label>
                <input type="number" class="child-age w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value="${c.age || ''}" min="4" max="18" placeholder="Age"></div>
              <div><label class="block text-xs font-medium text-slate-500 mb-1">Gender</label>
                <select class="child-gender w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">--</option>
                  <option ${c.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option ${c.gender === 'Female' ? 'selected' : ''}>Female</option>
                </select></div>
              <div><label class="block text-xs font-medium text-slate-500 mb-1">Program Interest</label>
                <select class="child-program w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  ${programs.map(p => `<option ${c.program === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select></div>
              <div class="col-span-2"><label class="block text-xs font-medium text-slate-500 mb-1">Experience Level</label>
                <select class="child-level w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  ${levels.map(l => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select></div>
            </div>
          </div>`).join('');

        body.innerHTML = `
          <div id="children-forms">${childForms}</div>
          ${data.children.length < 3 ? `<button id="add-child-btn" class="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1 mb-4"><i data-lucide="plus-circle" class="w-4 h-4"></i> Add another child</button>` : ''}
          <div class="flex justify-between mt-4">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Next Step</button>
          </div>`;
        if (window.lucide) lucide.createIcons();

        const addBtn = document.getElementById('add-child-btn');
        if (addBtn) addBtn.onclick = () => { data.children.push({}); render(); };

        document.getElementById('wiz-back').onclick = () => { step = 1; render(); };
        document.getElementById('wiz-next').onclick = () => {
          const cards = document.querySelectorAll('#children-forms [data-child]');
          data.children = [];
          let valid = true;
          cards.forEach(card => {
            const name = card.querySelector('.child-name').value.trim();
            const age = card.querySelector('.child-age').value;
            if (!name || !age) { valid = false; return; }
            data.children.push({ name, age, gender: card.querySelector('.child-gender').value, program: card.querySelector('.child-program').value, level: card.querySelector('.child-level').value });
          });
          if (!valid) { AdminWorkflows.showToast('Each child needs a name and age.', 'warning'); return; }
          step = 3; render();
        };
      }

      else if (step === 3) {
        if (!data.password) data.password = AdminWorkflows.generateTempPassword();
        body.innerHTML = `
          <div class="space-y-4">
            <p class="text-sm text-slate-600">A temporary password has been generated. Share it with the parent so they can log in and change it.</p>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Temporary Password</label>
              <div class="flex gap-2">
                <input id="wiz-pwd" type="text" value="${data.password}" readonly class="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-slate-50">
                <button onclick="navigator.clipboard.writeText('${data.password}');AdminWorkflows.showToast('Copied!','success')" class="border border-slate-200 rounded-lg px-3 py-2.5 text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                <button onclick="document.getElementById('wiz-pwd').value='${AdminWorkflows.generateTempPassword()}';data_password=document.getElementById('wiz-pwd').value" class="border border-slate-200 rounded-lg px-3 py-2.5 text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1">
                  <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">Role will be set to <strong>parent</strong>. The parent can reset their password after first login.</div>
          </div>
          <div class="flex justify-between mt-6">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Review</button>
          </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('wiz-back').onclick = () => { step = 2; render(); };
        document.getElementById('wiz-next').onclick = () => {
          data.password = document.getElementById('wiz-pwd').value;
          step = 4; render();
        };
      }

      else if (step === 4) {
        const childList = data.children.map(c => `<li class="text-sm text-slate-600">${c.name}, Age ${c.age} — ${c.program} (${c.level})</li>`).join('');
        body.innerHTML = `
          <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3 mb-5">
            <div class="flex items-center gap-2 mb-2"><i data-lucide="user" class="w-4 h-4 text-blue-600"></i><span class="font-semibold text-slate-800">Parent: ${data.parent.name}</span></div>
            <p class="text-sm text-slate-500">Email: ${data.parent.email} &nbsp;|&nbsp; Phone: ${data.parent.phone || 'N/A'}</p>
            <p class="text-sm text-slate-500">WhatsApp: ${data.parent.whatsapp || 'N/A'} &nbsp;|&nbsp; Country: ${data.parent.country || 'N/A'}</p>
            <div class="border-t border-slate-200 pt-3"><p class="text-xs font-semibold text-slate-500 uppercase mb-2">Children</p><ul class="space-y-1">${childList}</ul></div>
            <div class="border-t border-slate-200 pt-3"><p class="text-xs font-semibold text-slate-500 uppercase mb-1">Temp Password</p><p class="font-mono text-sm text-slate-700">${data.password}</p></div>
          </div>
          <div class="flex justify-between">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-create" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <i data-lucide="user-check" class="w-4 h-4"></i> Create Account &amp; Send Welcome Email
            </button>
          </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('wiz-back').onclick = () => { step = 3; render(); };
        document.getElementById('wiz-create').onclick = () => AdminWorkflows.OnboardingWizard.saveAccount({ ...data, role: 'parent', modalId: id });
      }
    };
    render();
  },

  openTutorOnboarding() {
    const id = this._buildShell('Onboard New Tutor');
    const steps = ['Tutor Details', 'Qualifications', 'Availability', 'Account Setup'];
    let step = 1;
    const data = { tutor: {}, quals: {}, availability: {}, password: '' };
    const programs = ['Python', 'Scratch', 'Robotics', 'Web Dev', 'AI/ML', 'Digital Art', 'Unity/Roblox'];
    const ageGroups = ['5-8', '9-12', '13-17'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const slots = [{ label: 'Morning (8am–12pm)', val: 'morning' }, { label: 'Afternoon (12pm–5pm)', val: 'afternoon' }, { label: 'Evening (5pm–9pm)', val: 'evening' }];

    const render = () => {
      this._renderStepper(id, steps, step);
      const body = document.getElementById(id + '-body');
      if (!body) return;

      if (step === 1) {
        body.innerHTML = `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Full Name *</label>
                <input id="wiz-t-name" value="${data.tutor.name || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Tutor full name"></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Email *</label>
                <input id="wiz-t-email" type="email" value="${data.tutor.email || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                <input id="wiz-t-phone" value="${data.tutor.phone || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="+234..."></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">WhatsApp</label>
                <input id="wiz-t-wa" value="${data.tutor.whatsapp || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="+234..."></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Country</label>
                <input id="wiz-t-country" value="${data.tutor.country || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Timezone</label>
                <input id="wiz-t-tz" value="${data.tutor.timezone || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. WAT (UTC+1)"></div>
            </div>
          </div>
          <div class="flex justify-end mt-6">
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Next</button>
          </div>`;
        document.getElementById('wiz-next').onclick = () => {
          const name = document.getElementById('wiz-t-name').value.trim();
          const email = document.getElementById('wiz-t-email').value.trim();
          if (!name || !email) { AdminWorkflows.showToast('Name and email required.', 'warning'); return; }
          data.tutor = { name, email, phone: document.getElementById('wiz-t-phone').value.trim(), whatsapp: document.getElementById('wiz-t-wa').value.trim(), country: document.getElementById('wiz-t-country').value.trim(), timezone: document.getElementById('wiz-t-tz').value.trim() };
          step = 2; render();
        };
      }

      else if (step === 2) {
        body.innerHTML = `
          <div class="space-y-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-2">Specializations</label>
              <div class="grid grid-cols-2 gap-2">${programs.map(p => `
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="spec-cb w-4 h-4 rounded" value="${p}" ${(data.quals.specs || []).includes(p) ? 'checked' : ''}> ${p}
                </label>`).join('')}</div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Years Experience</label>
                <input id="wiz-t-yrs" type="number" min="0" max="40" value="${data.quals.years || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"></div>
              <div><label class="block text-sm font-medium text-slate-600 mb-1">Certifications</label>
                <input id="wiz-t-certs" value="${data.quals.certifications || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Google CS, MIT OCW"></div>
            </div>
            <div><label class="block text-sm font-medium text-slate-600 mb-2">Age Groups Comfortable With</label>
              <div class="flex gap-4">${ageGroups.map(ag => `
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="age-cb w-4 h-4 rounded" value="${ag}" ${(data.quals.ageGroups || []).includes(ag) ? 'checked' : ''}> ${ag} yrs
                </label>`).join('')}</div>
            </div>
          </div>
          <div class="flex justify-between mt-6">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Next</button>
          </div>`;
        document.getElementById('wiz-back').onclick = () => { step = 1; render(); };
        document.getElementById('wiz-next').onclick = () => {
          data.quals = {
            specs: [...document.querySelectorAll('.spec-cb:checked')].map(cb => cb.value),
            years: document.getElementById('wiz-t-yrs').value,
            certifications: document.getElementById('wiz-t-certs').value.trim(),
            ageGroups: [...document.querySelectorAll('.age-cb:checked')].map(cb => cb.value)
          };
          step = 3; render();
        };
      }

      else if (step === 3) {
        body.innerHTML = `
          <div class="space-y-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-2">Available Days</label>
              <div class="grid grid-cols-2 gap-2">${days.map(d => `
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="day-cb w-4 h-4 rounded" value="${d}" ${(data.availability.days || []).includes(d) ? 'checked' : ''}> ${d}
                </label>`).join('')}</div>
            </div>
            <div><label class="block text-sm font-medium text-slate-600 mb-2">Time Slots</label>
              <div class="space-y-2">${slots.map(s => `
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="slot-cb w-4 h-4 rounded" value="${s.val}" ${(data.availability.slots || []).includes(s.val) ? 'checked' : ''}> ${s.label}
                </label>`).join('')}</div>
            </div>
          </div>
          <div class="flex justify-between mt-6">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-next" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Next</button>
          </div>`;
        document.getElementById('wiz-back').onclick = () => { step = 2; render(); };
        document.getElementById('wiz-next').onclick = () => {
          data.availability = {
            days: [...document.querySelectorAll('.day-cb:checked')].map(cb => cb.value),
            slots: [...document.querySelectorAll('.slot-cb:checked')].map(cb => cb.value)
          };
          step = 4; render();
        };
      }

      else if (step === 4) {
        if (!data.password) data.password = AdminWorkflows.generateTempPassword();
        body.innerHTML = `
          <div class="space-y-4">
            <p class="text-sm text-slate-600">Account will be created with role <strong>tutor</strong>. Share the password below with the tutor.</p>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Temporary Password</label>
              <div class="flex gap-2">
                <input id="wiz-t-pwd" type="text" value="${data.password}" readonly class="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-slate-50">
                <button onclick="navigator.clipboard.writeText(document.getElementById('wiz-t-pwd').value);AdminWorkflows.showToast('Copied!','success')" class="border border-slate-200 rounded-lg px-3 py-2.5 text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 border border-slate-100">
              <p class="font-semibold text-slate-700 mb-2">${data.tutor.name} · ${data.tutor.email}</p>
              <p>Specializations: ${(data.quals.specs || []).join(', ') || 'None selected'}</p>
              <p>Availability: ${(data.availability.days || []).join(', ') || 'Not set'}</p>
            </div>
          </div>
          <div class="flex justify-between mt-6">
            <button id="wiz-back" class="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm border border-slate-200">Back</button>
            <button id="wiz-create" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <i data-lucide="user-check" class="w-4 h-4"></i> Create Tutor Account
            </button>
          </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('wiz-back').onclick = () => { step = 3; render(); };
        document.getElementById('wiz-create').onclick = () => {
          data.password = document.getElementById('wiz-t-pwd').value;
          AdminWorkflows.OnboardingWizard.saveAccount({ ...data, role: 'tutor', modalId: id });
        };
      }
    };
    render();
  },

  async saveAccount(data) {
    const { role, modalId } = data;
    const email = role === 'parent' ? data.parent.email : data.tutor.email;
    const name = role === 'parent' ? data.parent.name : data.tutor.name;

    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addUser) {
      const result = await DashboardEngine.addUser({ email, password: data.password, role, name });
      if (!result.success) {
        AdminWorkflows.showToast(result.message || 'Failed to create account.', 'error');
        return;
      }
    }

    if (role === 'tutor' && typeof DashboardEngine !== 'undefined') {
      DashboardEngine.addTutor({
        name, email,
        phone: data.tutor.phone || '',
        subjects: data.quals ? data.quals.specs || [] : [],
        availability: data.availability || {},
        timezone: data.tutor.timezone || ''
      });
    }

    await AdminWorkflows._sendEmail('welcome', { to: email, name, role, password: data.password });

    AdminWorkflows.showToast(`${role === 'parent' ? 'Parent' : 'Tutor'} account created! Welcome email sent.`, 'success');
    AdminWorkflows.closeModal(modalId);
    if (typeof AdminEngine !== 'undefined' && AdminEngine.reloadData) AdminEngine.reloadData();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 · EnrollmentAssignment
// ─────────────────────────────────────────────────────────────────────────────
AdminWorkflows.EnrollmentAssignment = {

  renderAssignmentPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const enrollments = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getEnrollments)
      ? DashboardEngine.getEnrollments().filter(e => !e.tutorId || e.tutorId === '')
      : [];
    const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];

    const unassignedHTML = enrollments.length === 0
      ? `<div class="text-center py-10 text-slate-400"><i data-lucide="check-circle" class="w-10 h-10 mx-auto mb-2 text-emerald-400"></i><p class="text-sm">All enrollments are assigned.</p></div>`
      : enrollments.map(e => `
          <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-bold text-slate-800 text-sm">${e.studentFirstName || e.studentName || 'Student'} ${e.studentLastName || ''}</p>
                <p class="text-xs text-slate-500 mt-0.5">${e.program} &nbsp;·&nbsp; Age ${e.studentAge || '?'}</p>
                <p class="text-xs text-slate-400 mt-0.5">Enrolled: ${e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'N/A'}</p>
                <p class="text-xs text-slate-400 mt-0.5">Parent: ${e.parentName || e.fatherName || ''} &nbsp; ${e.phone || e.fatherPhone || ''}</p>
              </div>
              <span class="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">Unassigned</span>
            </div>
            <button onclick="AdminWorkflows.EnrollmentAssignment.openAssignModal('${e.id}')"
              class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
              Assign Tutor
            </button>
          </div>`).join('');

    const tutorsHTML = tutors.length === 0
      ? `<div class="text-center py-10 text-slate-400"><i data-lucide="user-x" class="w-10 h-10 mx-auto mb-2"></i><p class="text-sm">No tutors onboarded yet.</p></div>`
      : tutors.map(t => {
          const studentCount = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getStudents)
            ? DashboardEngine.getStudents().filter(s => s.tutorName === t.name).length : 0;
          const specs = Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || t.specializations || 'General');
          return `
            <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">${(t.name || 'T')[0].toUpperCase()}</div>
                <div>
                  <p class="font-bold text-slate-800 text-sm">${t.name}</p>
                  <p class="text-xs text-slate-500">${t.email || ''}</p>
                </div>
              </div>
              <p class="text-xs text-slate-500 mb-2">${specs}</p>
              <span class="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">${studentCount} student${studentCount !== 1 ? 's' : ''}</span>
            </div>`;
        }).join('');

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 text-amber-500"></i>
            Unassigned Enrollments (${enrollments.length})
          </h3>
          <div class="space-y-3">${unassignedHTML}</div>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="briefcase" class="w-4 h-4 text-blue-500"></i>
            Available Tutors (${tutors.length})
          </h3>
          <div class="space-y-3">${tutorsHTML}</div>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  openAssignModal(enrollmentId) {
    const enrollments = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getEnrollments) ? DashboardEngine.getEnrollments() : [];
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) { AdminWorkflows.showToast('Enrollment not found.', 'error'); return; }

    const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    const id = 'assign-modal-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';

    const tutorCards = tutors.map(t => {
      const score = this.getMatchScore(enrollment, t);
      const scoreColor = score >= 70 ? 'text-emerald-600 bg-emerald-50' : score >= 40 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50';
      return `
        <label class="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
          <input type="radio" name="assign-tutor" value="${t.id || t.email}" class="w-4 h-4 text-blue-600">
          <div class="flex-1">
            <p class="font-semibold text-slate-800 text-sm">${t.name}</p>
            <p class="text-xs text-slate-500">${(Array.isArray(t.subjects) ? t.subjects : []).join(', ') || 'General'}</p>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}">${score}% match</span>
        </label>`;
    }).join('');

    div.innerHTML = `
      <div class="absolute inset-0 bg-black/70" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">Assign Tutor</h3>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-6 space-y-5">
          <div class="bg-slate-50 rounded-xl p-4 text-sm">
            <p class="font-semibold text-slate-800">${enrollment.studentFirstName || ''} ${enrollment.studentLastName || ''}</p>
            <p class="text-slate-500">${enrollment.program} &nbsp;·&nbsp; Age ${enrollment.studentAge || '?'}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-700 mb-3">Select Tutor</p>
            <div class="space-y-2">${tutorCards || '<p class="text-sm text-slate-400">No tutors available.</p>'}</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Day of Week</label>
              <select id="${id}-day" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                ${days.map(d => `<option>${d}</option>`).join('')}
              </select></div>
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
              <select id="${id}-time" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                ${times.map(t => `<option>${t}</option>`).join('')}
              </select></div>
          </div>
          <div class="flex gap-3">
            <button onclick="AdminWorkflows.closeModal('${id}')" class="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button id="${id}-confirm" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm">Confirm Assignment</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();

    document.getElementById(id + '-confirm').onclick = () => {
      const selected = document.querySelector(`input[name="assign-tutor"]:checked`);
      if (!selected) { AdminWorkflows.showToast('Please select a tutor.', 'warning'); return; }
      const day = document.getElementById(id + '-day').value;
      const time = document.getElementById(id + '-time').value;
      const tutor = tutors.find(t => (t.id || t.email) === selected.value);
      this.assignTutor(enrollmentId, selected.value, { dayOfWeek: day, time }, tutor);
      AdminWorkflows.closeModal(id);
    };
  },

  assignTutor(enrollmentId, tutorId, schedule, tutor) {
    if (typeof DashboardEngine === 'undefined') return;

    const enrollments = DashboardEngine.getEnrollments();
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return;

    enrollment.tutorId = tutorId;
    enrollment.schedule = schedule;
    try {
      const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
      if (db.enrollments) {
        const idx = db.enrollments.findIndex(e => e.id === enrollmentId);
        if (idx !== -1) { db.enrollments[idx] = enrollment; localStorage.setItem('stemulus_db', JSON.stringify(db)); }
      }
    } catch (e) {}

    DashboardEngine.addSchedule({
      studentId: enrollment.studentId || enrollmentId,
      studentName: `${enrollment.studentFirstName || ''} ${enrollment.studentLastName || ''}`.trim(),
      tutorId,
      tutorName: tutor ? tutor.name : tutorId,
      program: enrollment.program,
      dayOfWeek: schedule.dayOfWeek,
      time: schedule.time,
      zoomLink: ''
    });

    if (enrollment.email) {
      AdminWorkflows._sendEmail('custom', {
        to: enrollment.email,
        subject: 'Your Tutor Has Been Assigned',
        body: `Great news! ${tutor ? tutor.name : 'A tutor'} has been assigned to ${enrollment.studentFirstName || 'your child'} for ${enrollment.program}. Sessions will be ${schedule.dayOfWeek}s at ${schedule.time}.`
      });
    }
    if (tutor && tutor.email) {
      AdminWorkflows._sendEmail('custom', {
        to: tutor.email,
        subject: 'New Student Assignment',
        body: `You have been assigned a new student: ${enrollment.studentFirstName || ''} ${enrollment.studentLastName || ''} for ${enrollment.program}, scheduled ${schedule.dayOfWeek}s at ${schedule.time}.`
      });
    }

    AdminWorkflows.showToast('Tutor assigned successfully!', 'success');
    this.renderAssignmentPanel('assignment-panel');
  },

  getMatchScore(enrollment, tutor) {
    if (!tutor) return 0;
    const program = (enrollment.program || '').toLowerCase();
    const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
    let score = 0;
    subjects.forEach(s => { if (program.includes(s.toLowerCase()) || s.toLowerCase().includes(program.split(' ')[0].toLowerCase())) score += 40; });
    score = Math.min(score, 80);
    const age = parseInt(enrollment.studentAge) || 10;
    const ageGroups = Array.isArray(tutor.ageGroups) ? tutor.ageGroups : (tutor.availability && tutor.availability.ageGroups ? tutor.availability.ageGroups : []);
    if ((age >= 5 && age <= 8 && ageGroups.includes('5-8')) ||
        (age >= 9 && age <= 12 && ageGroups.includes('9-12')) ||
        (age >= 13 && age <= 17 && ageGroups.includes('13-17'))) score += 20;
    return Math.min(score + 10, 100);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 · ScheduleManager
// ─────────────────────────────────────────────────────────────────────────────
AdminWorkflows.ScheduleManager = {

  _currentWeekStart: null,

  _getWeekStart(date) {
    const d = new Date(date || Date.now());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  _programColor(program) {
    const p = (program || '').toLowerCase();
    if (p.includes('python')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (p.includes('scratch')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (p.includes('robot')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (p.includes('web')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (p.includes('ai') || p.includes('ml')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (p.includes('unity') || p.includes('roblox')) return 'bg-pink-100 text-pink-800 border-pink-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  },

  renderCalendarView(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this._currentWeekStart) this._currentWeekStart = this._getWeekStart();

    const weekStart = new Date(this._currentWeekStart);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const hours = [];
    for (let h = 8; h <= 21; h++) hours.push(h);

    const schedules = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getSchedules() : [];

    const weekLabel = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const slotMap = {};
    schedules.forEach(s => {
      if (!s.date || !s.time) return;
      const d = new Date(s.date + 'T00:00:00');
      const dayKey = d.toDateString();
      const [hh] = s.time.split(':');
      const key = dayKey + '_' + hh;
      if (!slotMap[key]) slotMap[key] = [];
      slotMap[key].push(s);
    });

    const dayHeaders = days.map(d => `
      <div class="text-center py-2 border-r border-slate-100 last:border-r-0">
        <p class="text-xs font-bold text-slate-500 uppercase">${d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
        <p class="text-sm font-semibold ${d.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-slate-700'}">${d.getDate()}</p>
      </div>`).join('');

    const timeRows = hours.map(h => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h;
      const cells = days.map(d => {
        const key = d.toDateString() + '_' + h;
        const sessions = slotMap[key] || [];
        const content = sessions.map(s => `
          <div onclick="AdminWorkflows.ScheduleManager.openSessionDetail('${s.id}')"
            class="cursor-pointer mb-1 px-2 py-1 rounded-lg text-xs border ${this._programColor(s.course || s.program)} truncate hover:opacity-80 transition-opacity">
            <p class="font-bold truncate">${s.studentName || 'Student'}</p>
            <p class="truncate opacity-75">${s.mentor || s.tutorName || ''}</p>
          </div>`).join('');
        return `<div class="border-r border-b border-slate-100 last:border-r-0 p-1 min-h-[52px] hover:bg-blue-50/30 transition-colors cursor-pointer"
          onclick="if(!event.target.closest('[onclick]')||event.target===this)AdminWorkflows.ScheduleManager.openSessionForm('${d.toISOString().split('T')[0]}','${String(h).padStart(2,'0')}:00')">${content}</div>`;
      }).join('');
      return `
        <div class="grid grid-cols-8 border-b border-slate-100">
          <div class="text-xs text-slate-400 text-right pr-3 py-2 font-medium">${h12}${ampm}</div>
          ${cells}
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <button onclick="AdminWorkflows.ScheduleManager._navigate(-1)" class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <span class="text-sm font-semibold text-slate-700">${weekLabel}</span>
            <button onclick="AdminWorkflows.ScheduleManager._navigate(1)" class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
            <button onclick="AdminWorkflows.ScheduleManager._navigate(0)" class="text-xs font-semibold text-blue-600 hover:underline ml-1">Today</button>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="AdminWorkflows.ScheduleManager.exportSchedule()" class="text-xs border border-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Export
            </button>
            <button onclick="AdminWorkflows.ScheduleManager.openSessionForm('','')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Session
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <div class="min-w-[640px]">
            <div class="grid grid-cols-8 border-b border-slate-100 bg-slate-50">
              <div class="py-2 text-xs text-slate-400 text-right pr-3 font-medium">UTC</div>
              ${dayHeaders}
            </div>
            <div class="overflow-y-auto max-h-[520px]">${timeRows}</div>
          </div>
        </div>
        <div class="p-3 border-t border-slate-100 flex flex-wrap gap-3">
          ${[['Python','bg-blue-200'],['Scratch','bg-purple-200'],['Robotics','bg-emerald-200'],['Web Dev','bg-orange-200'],['AI/ML','bg-indigo-200']].map(([l,c]) => `<span class="flex items-center gap-1.5 text-xs text-slate-600"><span class="w-3 h-3 rounded ${c}"></span>${l}</span>`).join('')}
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  _navigate(direction) {
    if (direction === 0) {
      this._currentWeekStart = this._getWeekStart();
    } else {
      const d = new Date(this._currentWeekStart);
      d.setDate(d.getDate() + direction * 7);
      this._currentWeekStart = d;
    }
    this.renderCalendarView('schedule-calendar');
  },

  openSessionForm(date, time) {
    const students = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getStudents() : [];
    const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];
    const programs = ['Python', 'Scratch', 'Robotics', 'Web Dev', 'AI/ML', 'Digital Art', 'Unity/Roblox'];
    const id = 'session-form-' + Date.now();

    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="absolute inset-0 bg-black/70" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">New Session</h3>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <form id="${id}-form" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Student *</label>
              <select id="${id}-student" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required>
                <option value="">-- Select --</option>
                ${students.map(s => `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`).join('')}
              </select></div>
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Tutor *</label>
              <select id="${id}-tutor" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required>
                <option value="">-- Select --</option>
                ${tutors.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
              </select></div>
          </div>
          <div><label class="block text-sm font-medium text-slate-600 mb-1">Program *</label>
            <select id="${id}-prog" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required>
              ${programs.map(p => `<option>${p}</option>`).join('')}
            </select></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Date *</label>
              <input type="date" id="${id}-date" value="${date || new Date().toISOString().split('T')[0]}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required></div>
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Time *</label>
              <input type="time" id="${id}-time" value="${time || '16:00'}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" required></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Duration</label>
              <select id="${id}-dur" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="45">45 min</option>
                <option value="60" selected>60 min</option>
                <option value="90">90 min</option>
              </select></div>
            <div><label class="block text-sm font-medium text-slate-600 mb-1">Recurring</label>
              <select id="${id}-recur" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="once">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
              </select></div>
          </div>
          <div><label class="block text-sm font-medium text-slate-600 mb-1">Zoom Link</label>
            <input type="url" id="${id}-zoom" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="https://zoom.us/j/..."></div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="AdminWorkflows.closeModal('${id}')" class="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm">Save Session</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();

    document.getElementById(id + '-form').onsubmit = (e) => {
      e.preventDefault();
      const sel = document.getElementById(id + '-student');
      const studentName = sel.options[sel.selectedIndex]?.text || '';
      const tutorName = document.getElementById(id + '-tutor').value;
      const sessionData = {
        studentId: document.getElementById(id + '-student').value,
        studentName,
        course: document.getElementById(id + '-prog').value,
        date: document.getElementById(id + '-date').value,
        time: document.getElementById(id + '-time').value,
        duration: document.getElementById(id + '-dur').value,
        mentor: tutorName,
        tutorName,
        link: document.getElementById(id + '-zoom').value,
        recurring: document.getElementById(id + '-recur').value,
        attendanceStatus: 'pending'
      };
      if (typeof DashboardEngine !== 'undefined') DashboardEngine.addSchedule(sessionData);
      AdminWorkflows.showToast('Session saved!', 'success');
      AdminWorkflows.closeModal(id);
      this.renderCalendarView('schedule-calendar');
    };
  },

  openSessionDetail(sessionId) {
    const schedules = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getSchedules() : [];
    const s = schedules.find(x => x.id === sessionId);
    if (!s) return;

    const id = 'session-detail-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="absolute inset-0 bg-black/70" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">Session Details</h3>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-slate-50 rounded-xl p-4 space-y-2">
            <p class="font-bold text-slate-800">${s.course || s.program || 'Session'}</p>
            <p class="text-sm text-slate-600">Student: <strong>${s.studentName}</strong></p>
            <p class="text-sm text-slate-600">Tutor: <strong>${s.mentor || s.tutorName || 'N/A'}</strong></p>
            <p class="text-sm text-slate-600">Date: ${s.date} at ${s.time} (${s.duration || 60} min)</p>
            ${s.link ? `<a href="${s.link}" target="_blank" class="text-xs text-blue-600 hover:underline flex items-center gap-1"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> Join Meeting</a>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase px-2.5 py-1 rounded-full
              ${s.attendanceStatus === 'present' ? 'bg-emerald-100 text-emerald-700' : s.attendanceStatus === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">
              ${s.attendanceStatus || 'Pending'}
            </span>
          </div>
          ${s.notes ? `<div class="text-sm text-slate-600"><strong>Notes:</strong> ${s.notes}</div>` : ''}
          <div class="flex flex-wrap gap-2 pt-2">
            <button onclick="AdminWorkflows.ScheduleManager._markAttended('${s.id}','${id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">Mark Attended</button>
            <button onclick="AdminWorkflows.ScheduleManager._sendReminder('${s.id}')" class="flex-1 border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors">Send Reminder</button>
            <button onclick="if(confirm('Cancel this session?')){DashboardEngine.deleteSchedule&&DashboardEngine.deleteSchedule('${s.id}');AdminWorkflows.showToast('Session cancelled.','info');AdminWorkflows.closeModal('${id}');AdminWorkflows.ScheduleManager.renderCalendarView('schedule-calendar');}" class="flex-1 border border-red-200 text-red-600 text-xs font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors">Cancel Session</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
  },

  _markAttended(sessionId, modalId) {
    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.updateSchedule) {
      DashboardEngine.updateSchedule(sessionId, { attendanceStatus: 'present' });
    }
    AdminWorkflows.showToast('Session marked as attended.', 'success');
    AdminWorkflows.closeModal(modalId);
    this.renderCalendarView('schedule-calendar');
  },

  _sendReminder(sessionId) {
    const s = DashboardEngine ? DashboardEngine.getSchedules().find(x => x.id === sessionId) : null;
    if (!s) return;
    AdminWorkflows._sendEmail('reminder-24h', { sessionId, studentName: s.studentName, course: s.course, date: s.date, time: s.time });
    AdminWorkflows.showToast('Reminder sent!', 'success');
  },

  exportSchedule() {
    const schedules = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getSchedules() : [];
    const rows = schedules.map(s => `<tr><td>${s.date}</td><td>${s.time}</td><td>${s.studentName}</td><td>${s.course}</td><td>${s.mentor || s.tutorName || ''}</td><td>${s.duration || 60} min</td><td>${s.attendanceStatus || 'pending'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>STEMulus Schedule Export</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f1f5f9;font-weight:600}</style></head><body><h2>STEMulus Class Schedule</h2><p>Exported: ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Course</th><th>Tutor</th><th>Duration</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `stemulus-schedule-${new Date().toISOString().split('T')[0]}.html`;
    a.click(); URL.revokeObjectURL(url);
    AdminWorkflows.showToast('Schedule exported!', 'success');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 · AttendanceApproval
// ─────────────────────────────────────────────────────────────────────────────
AdminWorkflows.AttendanceApproval = {

  renderApprovalQueue(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allLogs = this.loadPendingLogs();
    const pending = allLogs.filter(l => !l.status || l.status === 'pending');
    const approved = allLogs.filter(l => l.status === 'approved');
    const flagged = allLogs.filter(l => l.status === 'flagged' || l.status === 'needs_correction');

    const buildCard = (log, col) => `
      <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-2 mb-3">
          <div>
            <p class="font-bold text-slate-800 text-sm">${log.tutorName || 'Tutor'}</p>
            <p class="text-xs text-slate-500">${log.studentName || 'Student'} &nbsp;·&nbsp; ${log.classDate || log.date || ''}</p>
            <p class="text-xs text-slate-400 mt-0.5">${log.duration || ''} min &nbsp;·&nbsp; ${log.topic || log.course || ''}</p>
          </div>
          <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0
            ${col === 'pending' ? 'bg-amber-100 text-amber-700' : col === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
            ${col}
          </span>
        </div>
        ${log.timestamp ? `<p class="text-[10px] text-slate-400 mb-3">Submitted: ${new Date(log.timestamp).toLocaleString()}</p>` : ''}
        <div class="flex gap-2">
          <button onclick="AdminWorkflows.AttendanceApproval.openLogDetail('${log.id}')" class="flex-1 text-xs border border-slate-200 text-slate-600 font-semibold py-1.5 rounded-lg hover:bg-slate-50 transition-colors">View</button>
          ${col === 'pending' ? `
          <button onclick="AdminWorkflows.AttendanceApproval.approveLog('${log.id}','')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Approve</button>
          <button onclick="AdminWorkflows.AttendanceApproval.flagLog('${log.id}')" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Flag</button>` : ''}
        </div>
      </div>`;

    const emptyCol = (label) => `<div class="text-center py-8 text-slate-400 text-sm"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>${label}</div>`;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
            <h4 class="font-bold text-slate-700 text-sm">Pending Review (${pending.length})</h4>
          </div>
          <div class="space-y-3">${pending.length ? pending.map(l => buildCard(l, 'pending')).join('') : emptyCol('No pending logs')}</div>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
            <h4 class="font-bold text-slate-700 text-sm">Approved (${approved.length})</h4>
          </div>
          <div class="space-y-3">${approved.length ? approved.map(l => buildCard(l, 'approved')).join('') : emptyCol('No approved logs yet')}</div>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <h4 class="font-bold text-slate-700 text-sm">Needs Correction (${flagged.length})</h4>
          </div>
          <div class="space-y-3">${flagged.length ? flagged.map(l => buildCard(l, 'flagged')).join('') : emptyCol('No flagged logs')}</div>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  openLogDetail(logId) {
    const logs = this.loadPendingLogs();
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const id = 'log-detail-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="absolute inset-0 bg-black/70" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">Attendance Log Detail</h3>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-400 mb-1">Tutor</p><p class="font-semibold text-slate-800">${log.tutorName || 'N/A'}</p></div>
            <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-400 mb-1">Student</p><p class="font-semibold text-slate-800">${log.studentName || 'N/A'}</p></div>
            <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-400 mb-1">Date</p><p class="font-semibold text-slate-800">${log.classDate || log.date || 'N/A'}</p></div>
            <div class="bg-slate-50 p-3 rounded-xl"><p class="text-xs text-slate-400 mb-1">Duration</p><p class="font-semibold text-slate-800">${log.duration || 'N/A'} min ${log.scheduledDuration ? `<span class="text-xs text-slate-400">/ ${log.scheduledDuration} scheduled</span>` : ''}</p></div>
          </div>
          ${log.topic ? `<div><p class="text-xs font-semibold text-slate-500 uppercase mb-1">Topic</p><p class="text-sm text-slate-700">${log.topic}</p></div>` : ''}
          ${log.notes || log.tutorNotes ? `<div><p class="text-xs font-semibold text-slate-500 uppercase mb-1">Tutor Notes</p><p class="text-sm text-slate-700">${log.notes || log.tutorNotes}</p></div>` : ''}
          ${log.progressNotes ? `<div><p class="text-xs font-semibold text-slate-500 uppercase mb-1">Student Progress Notes</p><p class="text-sm text-slate-700">${log.progressNotes}</p></div>` : ''}
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Admin Comment</label>
            <textarea id="${id}-comment" rows="2" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Optional note..."></textarea>
          </div>
          <div class="flex gap-2 pt-2">
            <button onclick="AdminWorkflows.AttendanceApproval.approveLog('${log.id}',document.getElementById('${id}-comment').value);AdminWorkflows.closeModal('${id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm">Approve</button>
            <button onclick="AdminWorkflows.AttendanceApproval.flagLog('${log.id}');AdminWorkflows.closeModal('${id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm">Flag</button>
            <button onclick="AdminWorkflows.closeModal('${id}')" class="px-4 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
  },

  approveLog(logId, adminNote) {
    this._updateLogStatus(logId, 'approved', adminNote);
    AdminWorkflows.showToast('Attendance log approved.', 'success');
    this.renderApprovalQueue('approval-queue');

    const logs = this.loadPendingLogs();
    const log = logs.find(l => l.id === logId);
    if (log && log.tutorEmail) {
      AdminWorkflows._sendEmail('custom', { to: log.tutorEmail, subject: 'Attendance Log Approved', body: `Your attendance log for ${log.studentName} on ${log.classDate || log.date} has been approved.${adminNote ? ' Note: ' + adminNote : ''}` });
    }

    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        firebase.firestore().collection('monthly_reports').add({ ...log, status: 'approved', approvedAt: new Date().toISOString(), adminNote: adminNote || '' });
      } catch (e) { console.warn('[AdminWorkflows] Firestore write failed:', e); }
    }
  },

  flagLog(logId) {
    this._updateLogStatus(logId, 'flagged');
    AdminWorkflows.showToast('Log flagged for correction.', 'warning');
    this.renderApprovalQueue('approval-queue');
  },

  _updateLogStatus(logId, status, note) {
    const key = 'stemulus_attendance';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = logs.findIndex(l => l.id === logId);
    if (idx !== -1) { logs[idx].status = status; if (note) logs[idx].adminNote = note; localStorage.setItem(key, JSON.stringify(logs)); }

    if (typeof DashboardEngine !== 'undefined') {
      try {
        const db = JSON.parse(localStorage.getItem('stemulus_db') || '{}');
        if (db.attendanceRecords) {
          const i = db.attendanceRecords.findIndex(l => l.id === logId);
          if (i !== -1) { db.attendanceRecords[i].status = status; if (note) db.attendanceRecords[i].adminNote = note; localStorage.setItem('stemulus_db', JSON.stringify(db)); }
        }
      } catch (e) {}
    }
  },

  renderMonthlyReportReview(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reports = JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]');
    if (reports.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-slate-400"><i data-lucide="file-text" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i><p class="text-sm">No monthly reports submitted yet.</p></div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = reports.map(r => `
      <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <p class="font-bold text-slate-800 text-sm">${r.tutorName || 'Tutor'}</p>
          <p class="text-xs text-slate-500">${r.month || ''} &nbsp;·&nbsp; ${r.studentsCount || 0} students</p>
          <p class="text-xs text-slate-400">Submitted: ${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">${r.status || 'pending'}</span>
          <button class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Review</button>
        </div>
      </div>`).join('');
    if (window.lucide) lucide.createIcons();
  },

  loadPendingLogs() {
    let logs = [];
    if (typeof DashboardEngine !== 'undefined') {
      if (DashboardEngine.getAttendanceLogs) logs = DashboardEngine.getAttendanceLogs();
      else if (DashboardEngine.getAttendanceRecords) logs = DashboardEngine.getAttendanceRecords();
    }
    if (!logs.length) logs = JSON.parse(localStorage.getItem('stemulus_attendance') || '[]');
    return logs;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 · NotificationCenter
// ─────────────────────────────────────────────────────────────────────────────
AdminWorkflows.NotificationCenter = {

  _log: JSON.parse(localStorage.getItem('stemulus_notif_log') || '[]'),

  _saveLog() {
    localStorage.setItem('stemulus_notif_log', JSON.stringify(this._log));
  },

  renderComposer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const students = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getStudents() : [];
    const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Composer -->
        <div class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <i data-lucide="send" class="w-5 h-5 text-blue-600"></i> New Notification
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-2">Recipient Type</label>
              <div class="flex flex-wrap gap-2" id="notif-type-btns">
                ${['all_parents','all_tutors','specific_student','specific_tutor'].map((t,i) => `
                  <button onclick="AdminWorkflows.NotificationCenter._setType('${t}')"
                    class="notif-type-btn text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${i === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}"
                    data-type="${t}">
                    ${t === 'all_parents' ? 'All Parents' : t === 'all_tutors' ? 'All Tutors' : t === 'specific_student' ? 'Specific Student' : 'Specific Tutor'}
                  </button>`).join('')}
              </div>
            </div>
            <div id="notif-specific-row" class="hidden">
              <label class="block text-sm font-medium text-slate-600 mb-2">Search & Select</label>
              <select id="notif-specific-select" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select --</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-2">Channel</label>
              <div class="flex gap-3">
                ${['Email','WhatsApp','Both'].map((c,i) => `
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="notif-channel" value="${c.toLowerCase()}" ${i === 0 ? 'checked' : ''} class="w-4 h-4 text-blue-600"> ${c}
                  </label>`).join('')}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-2">Subject</label>
              <input id="notif-subject" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Notification subject...">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-2">Message</label>
              <textarea id="notif-body" rows="5" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Type your message here... Supports basic formatting."></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-2">Schedule</label>
              <div class="flex gap-3 items-center">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="notif-schedule" value="now" checked class="w-4 h-4 text-blue-600"> Send Now
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="notif-schedule" value="scheduled" class="w-4 h-4 text-blue-600"> Schedule
                </label>
                <input type="datetime-local" id="notif-schedule-time" class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm hidden focus:outline-none focus:border-blue-500">
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button onclick="AdminWorkflows.NotificationCenter._preview()" class="flex-1 border border-blue-200 text-blue-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors">Preview</button>
              <button onclick="AdminWorkflows.NotificationCenter._send()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i> Send
              </button>
            </div>
          </div>
        </div>
        <!-- History panel -->
        <div id="notif-history-panel">
          <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="clock" class="w-4 h-4 text-slate-500"></i> Recent Sent
          </h3>
          <div id="notif-history-list" class="space-y-3"></div>
        </div>
      </div>`;

    if (window.lucide) lucide.createIcons();

    document.querySelectorAll('input[name="notif-schedule"]').forEach(r => {
      r.onchange = () => {
        const st = document.getElementById('notif-schedule-time');
        if (st) st.classList.toggle('hidden', r.value !== 'scheduled');
      };
    });

    this._currentType = 'all_parents';
    this._students = students;
    this._tutors = tutors;
    this.renderNotificationHistory('notif-history-list');
  },

  _currentType: 'all_parents',
  _students: [],
  _tutors: [],

  _setType(type) {
    this._currentType = type;
    document.querySelectorAll('.notif-type-btn').forEach(btn => {
      const active = btn.dataset.type === type;
      btn.className = `notif-type-btn text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`;
    });
    const row = document.getElementById('notif-specific-row');
    const sel = document.getElementById('notif-specific-select');
    if (!row || !sel) return;
    if (type === 'specific_student' || type === 'specific_tutor') {
      row.classList.remove('hidden');
      const list = type === 'specific_student' ? this._students : this._tutors;
      sel.innerHTML = '<option value="">-- Select --</option>' + list.map(p => {
        const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim();
        const email = p.email || p.parentEmail || '';
        return `<option value="${email}">${name} (${email})</option>`;
      }).join('');
    } else {
      row.classList.add('hidden');
    }
  },

  _preview() {
    const subject = (document.getElementById('notif-subject') || {}).value || '';
    const body = (document.getElementById('notif-body') || {}).value || '';
    if (!body) { AdminWorkflows.showToast('Add a message first.', 'warning'); return; }
    const id = 'notif-preview-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'fixed inset-0 z-[999] flex items-center justify-center p-4';
    div.innerHTML = `
      <div class="absolute inset-0 bg-black/60" onclick="AdminWorkflows.closeModal('${id}')"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800">Preview</h3>
          <button onclick="AdminWorkflows.closeModal('${id}')" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p class="text-xs font-semibold text-slate-500 mb-1">To: <span class="text-slate-700">${this._currentType.replace('_', ' ')}</span></p>
          ${subject ? `<p class="text-sm font-bold text-slate-800 mt-2">${subject}</p>` : ''}
          <p class="text-sm text-slate-600 mt-2 whitespace-pre-wrap">${body}</p>
        </div>
        <div class="flex gap-3 mt-4">
          <button onclick="AdminWorkflows.closeModal('${id}')" class="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50">Edit</button>
          <button onclick="AdminWorkflows.NotificationCenter._send();AdminWorkflows.closeModal('${id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm">Send Now</button>
        </div>
      </div>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
  },

  _send() {
    const subject = (document.getElementById('notif-subject') || {}).value || '';
    const body = (document.getElementById('notif-body') || {}).value || '';
    const channelEl = document.querySelector('input[name="notif-channel"]:checked');
    const channel = channelEl ? channelEl.value : 'email';
    const scheduleEl = document.querySelector('input[name="notif-schedule"]:checked');
    const scheduleMode = scheduleEl ? scheduleEl.value : 'now';
    const scheduledAt = scheduleMode === 'scheduled' ? (document.getElementById('notif-schedule-time') || {}).value : null;

    if (!body) { AdminWorkflows.showToast('Please write a message.', 'warning'); return; }

    const specific = document.getElementById('notif-specific-select');
    const specificEmail = specific ? specific.value : '';

    this.sendBroadcast(this._currentType, channel, subject, body, scheduledAt, specificEmail);
  },

  sendBroadcast(type, channel, subject, body, scheduledAt, specificEmail) {
    let recipients = [];
    if (type === 'all_parents') {
      const students = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getStudents() : [];
      recipients = [...new Set(students.map(s => ({ email: s.parentEmail, name: s.parentName })).filter(r => r.email))];
    } else if (type === 'all_tutors') {
      const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];
      recipients = tutors.filter(t => t.email).map(t => ({ email: t.email, name: t.name }));
    } else if (specificEmail) {
      recipients = [{ email: specificEmail, name: specificEmail }];
    }

    if (recipients.length === 0) { AdminWorkflows.showToast('No recipients found.', 'warning'); return; }

    recipients.forEach(r => {
      if (channel === 'email' || channel === 'both') {
        AdminWorkflows._sendEmail('custom', { to: r.email, name: r.name, subject, body });
      }
      if (typeof DashboardEngine !== 'undefined' && DashboardEngine.addNotification) {
        DashboardEngine.addNotification({ userEmail: r.email, title: subject, message: body });
      }
    });

    const logEntry = { id: 'nl-' + Date.now(), type, channel, subject, body, recipientCount: recipients.length, sentAt: new Date().toISOString(), status: scheduledAt ? 'scheduled' : 'sent', scheduledAt };
    this._log.unshift(logEntry);
    if (this._log.length > 100) this._log.length = 100;
    this._saveLog();

    AdminWorkflows.showToast(`Sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}!`, 'success');
    this.renderNotificationHistory('notif-history-list');
  },

  renderNotificationHistory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const logs = this._log.slice(0, 20);
    if (!logs.length) {
      container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No notifications sent yet.</p>`;
      return;
    }
    container.innerHTML = logs.map(l => `
      <div class="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-xs">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-800 truncate">${l.subject || '(no subject)'}</p>
            <p class="text-slate-500 mt-0.5">${l.type?.replace('_', ' ')} &nbsp;·&nbsp; ${l.channel} &nbsp;·&nbsp; ${l.recipientCount || 1} recipient${l.recipientCount !== 1 ? 's' : ''}</p>
            <p class="text-slate-400 mt-0.5">${l.sentAt ? new Date(l.sentAt).toLocaleString() : ''}</p>
          </div>
          <span class="shrink-0 px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${l.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : l.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}">${l.status}</span>
        </div>
      </div>`).join('');
  },

  scheduleReminders() {
    const schedules = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getSchedules() : [];
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    schedules.forEach(s => {
      if (!s.date || !s.time) return;
      const sessionDate = new Date(s.date + 'T' + s.time);
      if (sessionDate > now && sessionDate <= in24h) {
        const sentKey = `stemulus_reminder_${s.id}`;
        if (!localStorage.getItem(sentKey)) {
          AdminWorkflows._sendEmail('reminder-24h', { studentName: s.studentName, course: s.course, date: s.date, time: s.time, link: s.link });
          localStorage.setItem(sentKey, '1');
        }
      }
    });

    const students = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getStudents() : [];
    const todayMMDD = now.toISOString().substring(5, 10);
    students.forEach(s => {
      if (s.birthday && s.birthday.substring(5) === todayMMDD) {
        const key = `stemulus_bday_wa_${now.toISOString().split('T')[0]}_${s.id}`;
        if (!localStorage.getItem(key)) {
          AdminWorkflows._sendEmail('birthday', { studentName: `${s.firstName} ${s.lastName}`, parentEmail: s.parentEmail });
          localStorage.setItem(key, '1');
        }
      }
    });

    const today = now.getDate();
    if (today >= 25) {
      const tutors = (typeof DashboardEngine !== 'undefined') ? DashboardEngine.getTutors() : [];
      const reports = JSON.parse(localStorage.getItem('stemulus_monthly_reports') || '[]');
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      tutors.forEach(t => {
        const submitted = reports.some(r => r.tutorEmail === t.email && r.month === monthKey);
        if (!submitted && t.email) {
          const key = `stemulus_report_reminder_${monthKey}_${t.email}`;
          if (!localStorage.getItem(key)) {
            AdminWorkflows._sendEmail('custom', { to: t.email, subject: 'Monthly Report Reminder', body: `Hi ${t.name}, please submit your monthly report for ${monthKey} by end of month.` });
            localStorage.setItem(key, '1');
          }
        }
      });
    }
  },

  renderInbox(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const messages = JSON.parse(localStorage.getItem('stemulus_inbox') || '[]');

    if (!messages.length) {
      container.innerHTML = `<div class="text-center py-10 text-slate-400"><i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i><p class="text-sm">Your inbox is empty.</p></div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = messages.map((m, i) => `
      <div class="bg-white border ${m.read ? 'border-slate-100' : 'border-blue-200 bg-blue-50/30'} rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.unread-dot')?.remove()">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            ${!m.read ? '<span class="unread-dot w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>' : ''}
            <div>
              <p class="font-semibold text-slate-800 text-sm">${m.senderName || 'Anonymous'}</p>
              <p class="text-xs text-slate-500">${m.email || ''} &nbsp;·&nbsp; ${m.subject || '(no subject)'}</p>
            </div>
          </div>
          <p class="text-xs text-slate-400 shrink-0">${m.date ? new Date(m.date).toLocaleDateString() : ''}</p>
        </div>
      </div>
      <div class="hidden bg-white border border-slate-100 rounded-xl p-4 -mt-2 border-t-0 rounded-t-none">
        <p class="text-sm text-slate-700 whitespace-pre-wrap mb-4">${m.body || m.message || ''}</p>
        <div class="flex gap-2">
          <input class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Quick reply..." id="reply-${i}">
          <button onclick="AdminWorkflows._sendEmail('custom',{to:'${m.email}',subject:'Re: ${(m.subject||'').replace(/'/g,"\\'")}',body:document.getElementById('reply-${i}').value});AdminWorkflows.showToast('Reply sent!','success')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">Reply</button>
        </div>
      </div>`).join('');
    if (window.lucide) lucide.createIcons();
  }
};

// ── Init hook: schedule reminders on admin dashboard load ─────────────────────
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('dashboard-container')) {
    setTimeout(() => {
      if (typeof AdminWorkflows !== 'undefined' && AdminWorkflows.NotificationCenter) {
        AdminWorkflows.NotificationCenter.scheduleReminders();
      }
    }, 3000);
  }
});
