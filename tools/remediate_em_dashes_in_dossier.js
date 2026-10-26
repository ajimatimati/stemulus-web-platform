const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '../admin-dashboard.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// Replace empty placeholder em-dashes in tutor dossier modal
html = html.replace(/Birthday: —/g, 'Birthday: Not specified');
html = html.replace(/<p id="td-bank-name" class="font-bold text-slate-800 text-sm mt-0\.5">—<\/p>/g, '<p id="td-bank-name" class="font-bold text-slate-800 text-sm mt-0.5">Not specified</p>');
html = html.replace(/<p id="td-account-name" class="font-bold text-slate-800 text-sm mt-0\.5">—<\/p>/g, '<p id="td-account-name" class="font-bold text-slate-800 text-sm mt-0.5">Not specified</p>');
html = html.replace(/<p id="td-account-number" class="font-mono font-extrabold text-slate-800 text-sm mt-0\.5 tracking-wider">—<\/p>/g, '<p id="td-account-number" class="font-mono font-extrabold text-slate-800 text-sm mt-0.5 tracking-wider">Not specified</p>');
html = html.replace(/<p id="td-location" class="text-xs text-slate-700 font-medium leading-relaxed">—<\/p>/g, '<p id="td-location" class="text-xs text-slate-700 font-medium leading-relaxed">Not specified</p>');
html = html.replace(/<p id="td-nok-name" class="text-xs font-bold text-slate-800">—<\/p>/g, '<p id="td-nok-name" class="text-xs font-bold text-slate-800">Not specified</p>');
html = html.replace(/<p id="td-nok-contact" class="text-xs text-slate-600 font-mono mt-0\.5">—<\/p>/g, '<p id="td-nok-contact" class="text-xs text-slate-600 font-mono mt-0.5">Not specified</p>');
html = html.replace(/<p id="td-workstation" class="text-xs text-slate-700 leading-relaxed font-medium mt-0\.5">—<\/p>/g, '<p id="td-workstation" class="text-xs text-slate-700 leading-relaxed font-medium mt-0.5">Not specified</p>');

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully sanitized empty modal placeholder em-dashes in admin-dashboard.html');
