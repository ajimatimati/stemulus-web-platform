const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Update admin-dashboard.html
console.log('Updating admin-dashboard.html...');
const adminHtmlPath = path.join(rootDir, 'admin-dashboard.html');
let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// Top billing header
adminHtml = adminHtml.replace(
  /<span id="billing-bank-name" class="font-bold text-white">Access Bank<\/span>/,
  '<span id="billing-bank-name" class="font-bold text-white">Wema Nigeria</span>'
);
adminHtml = adminHtml.replace(
  /<span id="billing-account-number" class="font-bold text-white text-sm tracking-wider">1853492019<\/span>/,
  '<span id="billing-account-number" class="font-bold text-white text-sm tracking-wider">0128062292</span>'
);
adminHtml = adminHtml.replace(
  /<span id="billing-account-name" class="font-bold text-white">STEMulus Kids Tech<\/span>/,
  '<span id="billing-account-name" class="font-bold text-white">STEMulus innovation Limited</span>'
);

// Add USD DOM in billing header if not already present
if (!adminHtml.includes('billing-usd-account-number')) {
  adminHtml = adminHtml.replace(
    /(<span id="billing-account-number"[^>]*>0128062292<\/span>\s*<\/div>)/,
    `$1\n        <div class="min-w-[120px] sm:border-l sm:border-white/20 sm:pl-4">\n          <span class="text-[10px] text-teal-300 block font-sans">USD DOM Account</span>\n          <span id="billing-usd-account-number" class="font-bold text-teal-300 text-sm tracking-wider">0622219817</span>\n        </div>`
  );
}

// Settings card summary grid
adminHtml = adminHtml.replace(
  /<p id="settings-card-bank-name" class="font-bold text-slate-800 text-sm mt-0.5">Access Bank<\/p>/,
  '<p id="settings-card-bank-name" class="font-bold text-slate-800 text-sm mt-0.5">Wema Nigeria</p>'
);
adminHtml = adminHtml.replace(
  /<p id="settings-card-account-number" class="font-mono font-bold text-slate-800 text-sm mt-0.5">1853492019<\/p>/,
  '<p id="settings-card-account-number" class="font-mono font-bold text-slate-800 text-sm mt-0.5">0128062292</p>'
);
adminHtml = adminHtml.replace(
  /<p id="settings-card-account-name" class="font-bold text-slate-800 text-sm mt-0.5">STEMulus Kids Tech<\/p>/,
  '<p id="settings-card-account-name" class="font-bold text-slate-800 text-sm mt-0.5">STEMulus innovation Limited</p>'
);

// Add USD DOM in settings card summary if not present
if (!adminHtml.includes('settings-card-usd-account-number')) {
  adminHtml = adminHtml.replace(
    /(<p id="settings-card-account-number"[^>]*>0128062292<\/p>\s*<\/div>)/,
    `$1\n      <div>\n        <p class="text-xs text-teal-700 font-semibold uppercase tracking-wider">USD DOM Account</p>\n        <p id="settings-card-usd-account-number" class="font-mono font-bold text-teal-800 text-sm mt-0.5">0622219817</p>\n      </div>`
  );
}

// Billing settings modal inputs
adminHtml = adminHtml.replace('placeholder="Access Bank"', 'placeholder="Wema Nigeria"');
adminHtml = adminHtml.replace('placeholder="1853492019"', 'placeholder="0128062292"');
adminHtml = adminHtml.replace('placeholder="STEMulus Kids Tech"', 'placeholder="STEMulus innovation Limited"');

if (!adminHtml.includes('id="settings-usd-account-number"')) {
  adminHtml = adminHtml.replace(
    /(<input type="text" id="settings-account-number"[^>]*>\s*<\/div>)/,
    `$1\n        <div>\n          <label for="settings-usd-account-number" class="block text-xs font-bold text-teal-700 uppercase mb-1">USD DOM Account Number</label>\n          <input type="text" id="settings-usd-account-number" placeholder="0622219817" class="w-full bg-slate-50 border border-teal-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-teal-900 focus:outline-none focus:border-teal-600">\n        </div>`
  );
}

fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');
console.log('admin-dashboard.html updated successfully.');

// 2. Update assets/js/admin-engine.js
console.log('Updating assets/js/admin-engine.js...');
const adminJsPath = path.join(rootDir, 'assets', 'js', 'admin-engine.js');
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

adminJs = adminJs.replace(
  /if \(sBank\) sBank\.textContent = bSettings\.bankName \|\| 'Access Bank';\s*if \(sAcc\) sAcc\.textContent = bSettings\.accountNumber \|\| '1853492019';\s*if \(sName\) sName\.textContent = bSettings\.accountName \|\| 'STEMulus Kids Tech';/g,
  `if (sBank) sBank.textContent = bSettings.bankName || 'Wema Nigeria';
            if (sAcc) sAcc.textContent = bSettings.accountNumber || '0128062292';
            if (sName) sName.textContent = bSettings.accountName || 'STEMulus innovation Limited';
            var sUsdAcc = document.getElementById('settings-card-usd-account-number');
            if (sUsdAcc) sUsdAcc.textContent = bSettings.usdAccountNumber || '0622219817';`
);

adminJs = adminJs.replace(
  /if \(bankEl\) bankEl\.textContent = settings\.bankName;\s*if \(accNumEl\) accNumEl\.textContent = settings\.accountNumber;\s*if \(accNameEl\) accNameEl\.textContent = settings\.accountName;/g,
  `if (bankEl) bankEl.textContent = settings.bankName || 'Wema Nigeria';
    if (accNumEl) accNumEl.textContent = settings.accountNumber || '0128062292';
    if (accNameEl) accNameEl.textContent = settings.accountName || 'STEMulus innovation Limited';
    const usdAccEl = document.getElementById('billing-usd-account-number');
    if (usdAccEl) usdAccEl.textContent = settings.usdAccountNumber || '0622219817';`
);

adminJs = adminJs.replace(
  /bankName: bankEl \? bankEl\.value : 'Access Bank',\s*accountNumber: accNumEl \? accNumEl\.value : '1853492019',\s*accountName: accNameEl \? accNameEl\.value : 'STEMulus Kids Tech',/g,
  `bankName: bankEl ? bankEl.value : 'Wema Nigeria',
        accountNumber: accNumEl ? accNumEl.value : '0128062292',
        accountName: accNameEl ? accNameEl.value : 'STEMulus innovation Limited',
        usdBankName: 'Wema Bank (USD DOM)',
        usdAccountNumber: document.getElementById('settings-usd-account-number') ? document.getElementById('settings-usd-account-number').value : '0622219817',
        usdAccountName: 'STEMulus innovation Limited',`
);

// Populate USD DOM input in openBillingSettingsModal
if (!adminJs.includes(`const usdAccInput = document.getElementById('settings-usd-account-number');`)) {
  adminJs = adminJs.replace(
    /if \(accNumEl\) accNumEl\.value = settings\.accountNumber \|\| '';/,
    `if (accNumEl) accNumEl.value = settings.accountNumber || '0128062292';
    const usdAccInput = document.getElementById('settings-usd-account-number');
    if (usdAccInput) usdAccInput.value = settings.usdAccountNumber || '0622219817';`
  );
}

fs.writeFileSync(adminJsPath, adminJs, 'utf8');
console.log('assets/js/admin-engine.js updated successfully.');

// 3. Update assets/js/billing-engine.js
console.log('Updating assets/js/billing-engine.js...');
const billingJsPath = path.join(rootDir, 'assets', 'js', 'billing-engine.js');
let billingJs = fs.readFileSync(billingJsPath, 'utf8');

// Ensure getSettings migrates old account numbers
billingJs = billingJs.replace(
  /if \(db\.billingSettings\) return Object\.assign\(\{\}, DEFAULT_SETTINGS, db\.billingSettings\);/,
  `if (db.billingSettings) {
        if (db.billingSettings.accountNumber === '1853492019' || !db.billingSettings.usdAccountNumber) {
          db.billingSettings = Object.assign({}, DEFAULT_SETTINGS, db.billingSettings, {
            bankName: 'Wema Nigeria',
            accountName: 'STEMulus innovation Limited',
            accountNumber: '0128062292',
            usdBankName: 'Wema Bank (USD DOM)',
            usdAccountName: 'STEMulus innovation Limited',
            usdAccountNumber: '0622219817'
          });
          DashboardEngine.saveDB(db);
        }
        return Object.assign({}, DEFAULT_SETTINGS, db.billingSettings);
      }`
);

fs.writeFileSync(billingJsPath, billingJs, 'utf8');
console.log('assets/js/billing-engine.js updated successfully.');

// 4. Update assets/js/dashboard-engine.js
console.log('Updating assets/js/dashboard-engine.js...');
const dashJsPath = path.join(rootDir, 'assets', 'js', 'dashboard-engine.js');
let dashJs = fs.readFileSync(dashJsPath, 'utf8');

if (!dashJs.includes(`parsed.billingSettings.accountNumber === '1853492019'`)) {
  dashJs = dashJs.replace(
    /if \(!parsed\.enrollments\) \{/,
    `// Ensure official Wema Bank billing settings are set
            if (!parsed.billingSettings || parsed.billingSettings.accountNumber === '1853492019' || !parsed.billingSettings.usdAccountNumber) {
                parsed.billingSettings = Object.assign({}, parsed.billingSettings || {}, {
                    bankName: 'Wema Nigeria',
                    accountName: 'STEMulus innovation Limited',
                    accountNumber: '0128062292',
                    usdBankName: 'Wema Bank (USD DOM)',
                    usdAccountName: 'STEMulus innovation Limited',
                    usdAccountNumber: '0622219817'
                });
                saveDB(parsed);
            }
            if (!parsed.enrollments) {`
  );
}

fs.writeFileSync(dashJsPath, dashJs, 'utf8');
console.log('assets/js/dashboard-engine.js updated successfully.');

// 5. Update netlify/functions/send-email.js
console.log('Updating netlify/functions/send-email.js...');
const sendEmailPath = path.join(rootDir, 'netlify', 'functions', 'send-email.js');
let sendEmail = fs.readFileSync(sendEmailPath, 'utf8');

sendEmail = sendEmail.replace(
  /const bankName = d\.bankName \|\| 'Access Bank';\s*const accountName = d\.accountName \|\| 'STEMulus Kids Tech';\s*const accountNumber = d\.accountNumber \|\| '1853492019';/,
  `const bankName = d.bankName || 'Wema Nigeria';
  const accountName = d.accountName || 'STEMulus innovation Limited';
  const accountNumber = d.accountNumber || '0128062292';
  const usdAccountNumber = d.usdAccountNumber || '0622219817';`
);

fs.writeFileSync(sendEmailPath, sendEmail, 'utf8');
console.log('netlify/functions/send-email.js updated successfully.');

// 6. Update netlify/functions/scheduled-notifications.js
console.log('Updating netlify/functions/scheduled-notifications.js...');
const schedNotifPath = path.join(rootDir, 'netlify', 'functions', 'scheduled-notifications.js');
let schedNotif = fs.readFileSync(schedNotifPath, 'utf8');

schedNotif = schedNotif.replace(
  /<h4 style="margin:0 0 8px 0;color:#1E40AF;">School Bank Account Details<\/h4>\s*<p style="margin:4px 0;"><strong>Bank:<\/strong> Access Bank<\/p>\s*<p style="margin:4px 0;"><strong>Account Name:<\/strong> STEMulus Kids Tech<\/p>\s*<p style="margin:4px 0;"><strong>Account Number:<\/strong> 1853492019<\/p>/,
  `<h4 style="margin:0 0 8px 0;color:#1E40AF;">Official STEMulus Bank Accounts</h4>
              <p style="margin:4px 0;"><strong>Bank:</strong> Wema Nigeria</p>
              <p style="margin:4px 0;"><strong>Account Name:</strong> STEMulus innovation Limited</p>
              <p style="margin:4px 0;"><strong>Account Number (NGN):</strong> 0128062292</p>
              <p style="margin:4px 0;"><strong>USD DOM Account:</strong> 0622219817 (Wema Bank)</p>`
);

fs.writeFileSync(schedNotifPath, schedNotif, 'utf8');
console.log('netlify/functions/scheduled-notifications.js updated successfully.');

console.log('All bank accounts updated successfully.');
