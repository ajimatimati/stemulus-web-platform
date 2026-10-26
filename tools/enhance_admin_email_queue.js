const fs = require('fs');
const path = require('path');

const adminEnginePath = path.join(__dirname, '../assets/js/admin-engine.js');
const adminDashboardPath = path.join(__dirname, '../admin-dashboard.html');

let adminEngine = fs.readFileSync(adminEnginePath, 'utf8');
let adminDashboard = fs.readFileSync(adminDashboardPath, 'utf8');

// 1. Update loadEmailQueue in admin-engine.js
// Find queueList.innerHTML = queue.map(...)
const oldQueueMapRegex = /queueList\.innerHTML\s*=\s*queue\.map\(function\(item\)\s*\{[\s\S]*?return\s*'<div class="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm">'[\s\S]*?\}\)\.join\(''\);/;

const newQueueItemRender = `queueList.innerHTML = queue.map(function(item) {
      var typeLabel = typeLabels[item.type] || item.type;
      var typeColor = (item.type === 'welcome' || item.type === 'tutor-welcome' || item.type === 'tutor_welcome' || item.type === 'student-enrolled') ? 'bg-blue-100 text-blue-700' : item.type === 'certificate-delivery' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
      return '<div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-orange-300 transition-all">' +
        '<div class="flex items-start gap-3 flex-1 min-w-0">' +
          '<div class="pt-1 shrink-0"><input type="checkbox" class="queue-item-checkbox w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer" value="' + item.id + '" onchange="AdminEngine.updateQueueSelectionCount()"></div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1.5 flex-wrap">' +
              '<span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ' + typeColor + '">' + typeLabel + '</span>' +
              '<span class="text-xs text-slate-400 font-medium">' + new Date(item.createdAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</span>' +
            '</div>' +
            '<p class="font-bold text-slate-900 text-sm truncate">To: ' + (item.recipientName || item.to) + ' &lt;' + item.to + '&gt;</p>' +
            '<p class="text-sm text-slate-600 mt-0.5 truncate font-medium">Subject: ' + (item.editedSubject || item.subject) + '</p>' +
            '<p class="text-xs text-slate-400 mt-1">Triggered by: ' + (item.triggeredBy || 'manual') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">' +
          '<button type="button" onclick="editQueuedEmail(\\'' + item.id + '\\')" class="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"><svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Edit</button>' +
          '<button type="button" onclick="previewQueuedEmail(\\'' + item.id + '\\')" class="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 border border-blue-200 rounded-xl transition-colors cursor-pointer">Preview</button>' +
          '<button type="button" onclick="sendQueuedEmail(\\'' + item.id + '\\')" class="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer" style="background-color: #047857 !important;"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Send</button>' +
          '<button type="button" onclick="cancelQueuedEmail(\\'' + item.id + '\\')" class="text-xs font-semibold text-red-700 hover:text-red-900 px-3 py-1.5 border border-red-200 rounded-xl transition-colors cursor-pointer">Cancel</button>' +
        '</div>' +
      '</div>';
    }).join('');`;

adminEngine = adminEngine.replace(oldQueueMapRegex, newQueueItemRender);

// 2. Update historyList rendering in admin-engine.js
const oldHistoryRegex = /historyList\.innerHTML\s*=\s*history\.slice\(-20\)\.reverse\(\)\.map\(function\(item\)\s*\{[\s\S]*?return\s*'<div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">'[\s\S]*?\}\)\.join\(''\);/;

const newHistoryRender = `historyList.innerHTML = history.slice(-40).reverse().map(function(item) {
        var statusClass = item.status === 'sent' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200';
        return '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all bg-white shadow-xs">' +
          '<div class="flex items-center gap-3 min-w-0 flex-1">' +
            '<span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ' + statusClass + ' shrink-0">' + (item.status || 'SENT') + '</span>' +
            '<div class="min-w-0 flex-1">' +
              '<p class="text-sm font-bold text-slate-800 truncate">' + (item.recipientName || item.to) + ' &lt;' + item.to + '&gt;</p>' +
              '<p class="text-xs text-slate-500 truncate mt-0.5">' + (item.editedSubject || item.subject) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-3 shrink-0 self-end sm:self-center">' +
            '<span class="text-xs text-slate-400 font-medium">' + (item.sentAt ? new Date(item.sentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '') + '</span>' +
            '<button type="button" onclick="viewSentEmail(\\'' + item.id + '\\')" class="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"><svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Read Email</button>' +
          '</div>' +
        '</div>';
      }).join('');`;

adminEngine = adminEngine.replace(oldHistoryRegex, newHistoryRender);

// 3. Add editQueuedEmail, saveQueuedEmailEdit, and viewSentEmail functions to adminEngine
const emailModalHandlers = `
// ==================== EDIT QUEUED EMAIL & VIEW SENT EMAIL ====================

window.editQueuedEmail = function(id) {
  var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
  if (!db) return;
  var item = (db.emailQueue || []).find(function(e) { return e.id === id; });
  if (!item) return;

  var modal = document.getElementById('modal-edit-queued-email');
  if (!modal) return;

  document.getElementById('eqe-id').value = item.id;
  document.getElementById('eqe-name').value = item.recipientName || '';
  document.getElementById('eqe-to').value = item.to || '';
  document.getElementById('eqe-subject').value = item.editedSubject || item.subject || '';
  document.getElementById('eqe-body').value = item.editedBody || item.htmlPreview || '';
  document.getElementById('eqe-type-badge').textContent = (item.type || 'email').toUpperCase();

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
};

window.closeEditQueuedEmailModal = function() {
  var modal = document.getElementById('modal-edit-queued-email');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

window.saveQueuedEmailEdit = async function(andSend) {
  var id = document.getElementById('eqe-id').value;
  var name = document.getElementById('eqe-name').value.trim();
  var to = document.getElementById('eqe-to').value.trim();
  var subject = document.getElementById('eqe-subject').value.trim();
  var body = document.getElementById('eqe-body').value.trim();

  if (!to || !subject || !body) {
    if (typeof showToast === 'function') showToast('Please complete all required fields.', 'warning');
    return;
  }

  var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
  if (!db) return;
  var item = (db.emailQueue || []).find(function(e) { return e.id === id; });
  if (!item) return;

  item.recipientName = name;
  item.to = to;
  item.editedSubject = subject;
  item.subject = subject;
  item.editedBody = body;
  item.htmlPreview = body;
  if (item.data) {
    item.data.recipientName = name;
    item.data.to = to;
    item.data.subject = subject;
    item.data.body = body;
  }

  DashboardEngine.saveDB(db);
  closeEditQueuedEmailModal();

  if (andSend) {
    if (typeof showToast === 'function') showToast('Email saved. Dispatching now...', 'info');
    await window.sendQueuedEmail(id);
  } else {
    if (typeof showToast === 'function') showToast('Queued email updated successfully.', 'success');
    loadEmailQueue();
  }
};

window.viewSentEmail = function(id) {
  var db = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? DashboardEngine.getDB() : null;
  if (!db) return;
  var history = db.emailHistory || [];
  var item = history.find(function(e) { return e.id === id; });
  if (!item) return;

  var modal = document.getElementById('modal-view-sent-email');
  if (!modal) return;

  document.getElementById('vse-recipient').textContent = (item.recipientName ? (item.recipientName + ' <' + item.to + '>') : item.to);
  document.getElementById('vse-subject').textContent = item.editedSubject || item.subject || 'No Subject';
  document.getElementById('vse-date').textContent = item.sentAt ? new Date(item.sentAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown';
  document.getElementById('vse-type').textContent = (item.type || 'DISPATCHED').toUpperCase();

  var bodyContainer = document.getElementById('vse-body');
  var rawContent = item.editedBody || item.htmlPreview || (item.data && item.data.body) || 'No message content stored.';
  
  // Render cleanly in reader container
  if (rawContent.includes('<') && rawContent.includes('>')) {
    bodyContainer.innerHTML = rawContent;
  } else {
    bodyContainer.innerHTML = '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;color:#334155;line-height:1.6;">' + rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
};

window.closeViewSentEmailModal = function() {
  var modal = document.getElementById('modal-view-sent-email');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// ==================== DATABASE BACKUP & SNAPSHOT COCKPIT ====================

window.exportDatabaseBackup = function() {
  if (typeof DashboardEngine === 'undefined' || !DashboardEngine.exportDatabaseJSON) return;
  const json = DashboardEngine.exportDatabaseJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = 'stemulus_database_vault_' + dateStr + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Verified database backup downloaded.', 'success');
};

window.importDatabaseBackupFile = function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const jsonStr = e.target.result;
    if (typeof DashboardEngine !== 'undefined' && DashboardEngine.importDatabaseJSON) {
      const res = DashboardEngine.importDatabaseJSON(jsonStr);
      if (res.success) {
        if (typeof showToast === 'function') showToast(res.message, 'success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        if (typeof showToast === 'function') showToast('Restore failed: ' + res.error, 'error');
      }
    }
  };
  reader.readAsText(file);
};

window.renderSnapshotVaultList = function() {
  const container = document.getElementById('snapshot-vault-list');
  if (!container || typeof DashboardEngine === 'undefined' || !DashboardEngine.listSnapshots) return;
  const snaps = DashboardEngine.listSnapshots();
  if (!snaps.length) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">No rolling snapshots recorded yet.</p>';
    return;
  }
  container.innerHTML = snaps.map(s => \`
    <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <div>
        <p class="text-xs font-bold text-slate-800">\${s.formatted}</p>
        <p class="text-[11px] text-slate-500">\${s.students} Students &bull; \${s.attendance} Attendance Records</p>
      </div>
      <button type="button" onclick="rollbackToSnapshot(\\\'\${s.timestamp}\\\')" class="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer">
        Rollback
      </button>
    </div>
  \`).join('');
};

window.rollbackToSnapshot = function(timestamp) {
  if (!confirm('Are you sure you want to rollback the database to this snapshot point? Current state will be backed up before applying.')) return;
  if (typeof DashboardEngine !== 'undefined' && DashboardEngine.restoreSnapshot) {
    const success = DashboardEngine.restoreSnapshot(timestamp);
    if (success) {
      if (typeof showToast === 'function') showToast('Database successfully restored to snapshot point.', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } else {
      if (typeof showToast === 'function') showToast('Failed to restore snapshot point.', 'error');
    }
  }
};
`;

// Append modal handlers to admin-engine.js right before window.cancelQueuedEmail
const cancelMarker = 'window.cancelQueuedEmail = function(id) {';
adminEngine = adminEngine.replace(cancelMarker, emailModalHandlers + '\n' + cancelMarker);

fs.writeFileSync(adminEnginePath, adminEngine, 'utf8');
console.log('Updated assets/js/admin-engine.js with Email Queue actions and reader!');

// 4. Now add the modals to admin-dashboard.html
const modalsHtml = `
  <!-- MODAL: EDIT QUEUED EMAIL -->
  <div id="modal-edit-queued-email" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <i data-lucide="edit-3" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-nunito font-extrabold text-slate-800">Edit Queued Email</h3>
            <span id="eqe-type-badge" class="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-700">WELCOME</span>
          </div>
        </div>
        <button type="button" onclick="closeEditQueuedEmailModal()" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <input type="hidden" id="eqe-id">

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Recipient Name</label>
            <input type="text" id="eqe-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-orange-500 transition-colors">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Recipient Email Address *</label>
            <input type="email" id="eqe-to" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-orange-500 transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Subject Line *</label>
          <input type="text" id="eqe-subject" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-orange-500 transition-colors">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Message Content / HTML *</label>
          <textarea id="eqe-body" rows="8" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-orange-500 transition-colors resize-y leading-relaxed"></textarea>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button type="button" onclick="closeEditQueuedEmailModal()" class="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">
          Cancel
        </button>
        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button type="button" onclick="saveQueuedEmailEdit(false)" class="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-colors">
            Save Changes
          </button>
          <button type="button" onclick="saveQueuedEmailEdit(true)" class="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5" style="background-color: #047857 !important;">
            <i data-lucide="send" class="w-3.5 h-3.5"></i> Save & Send Now
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL: VIEW SENT EMAIL READER -->
  <div id="modal-view-sent-email" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
    <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-100 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <i data-lucide="mail" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-nunito font-extrabold text-slate-800">Dispatched Email Record</h3>
            <span id="vse-type" class="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">SENT</span>
          </div>
        </div>
        <button type="button" onclick="closeViewSentEmailModal()" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
          <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recipient:</span>
          <span id="vse-recipient" class="font-bold text-slate-800 truncate"></span>
        </div>
        <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
          <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Dispatched At:</span>
          <span id="vse-date" class="font-semibold text-slate-700"></span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Subject:</span>
          <span id="vse-subject" class="font-extrabold text-slate-900 text-sm"></span>
        </div>
      </div>

      <div class="border border-slate-200 rounded-2xl p-5 bg-white min-h-[220px]">
        <div id="vse-body" class="text-slate-700 text-sm leading-relaxed overflow-x-auto"></div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" onclick="closeViewSentEmailModal()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer">
          Close Reader
        </button>
      </div>
    </div>
  </div>
`;

// Insert modals before </body> in admin-dashboard.html
const bodyCloseMarker = '</body>';
adminDashboard = adminDashboard.replace(bodyCloseMarker, modalsHtml + '\n' + bodyCloseMarker);

// 5. Add Data Retention & Snapshot Vault card into section-settings in admin-dashboard.html
const vaultCardHtml = `
  <!-- 🛡️ STEMULUS DATA RETENTION SHIELD & SNAPSHOT VAULT -->
  <div class="admin-card rounded-2xl p-6 mb-6 border border-emerald-100 bg-linear-to-br from-white to-emerald-50/20">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
          <i data-lucide="shield-check" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-lg font-nunito font-extrabold text-slate-800 flex items-center gap-2">
            <span>Database Retention & Snapshot Vault</span>
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">100% Protected</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Automated write-ahead integrity guard, rolling hourly snapshot vault, and 1-click restore.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" onclick="exportDatabaseBackup()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5" style="background-color: #047857 !important;">
          <i data-lucide="download" class="w-3.5 h-3.5"></i> Export Backup JSON
        </button>
        <label class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
          <i data-lucide="upload" class="w-3.5 h-3.5 text-slate-500"></i> Restore JSON
          <input type="file" accept=".json" onchange="importDatabaseBackupFile(this)" class="hidden">
        </label>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Internal Snapshot History (Last 10 Rolling States)</h4>
        <button type="button" onclick="renderSnapshotVaultList()" class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
          <i data-lucide="refresh-cw" class="w-3 h-3"></i> Refresh
        </button>
      </div>
      <div id="snapshot-vault-list" class="space-y-2 max-h-56 overflow-y-auto pr-1">
        <!-- Rendered via renderSnapshotVaultList() -->
      </div>
    </div>
  </div>
`;

// Insert vaultCardHtml in section-settings right before <!-- Change Password -->
const settingsMarker = '<!-- Change Password -->';
adminDashboard = adminDashboard.replace(settingsMarker, vaultCardHtml + '\n  ' + settingsMarker);

fs.writeFileSync(adminDashboardPath, adminDashboard, 'utf8');
console.log('Successfully added modals and Database Vault cockpit to admin-dashboard.html!');
