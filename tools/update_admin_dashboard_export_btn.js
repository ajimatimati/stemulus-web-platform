const fs = require('fs');

let html = fs.readFileSync('admin-dashboard.html', 'utf8');
const target = `<button onclick="if(typeof loadNetlifyEnrollments==='function')loadNetlifyEnrollments()" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-lg transition-colors">Refresh</button>`;

const replacement = `<div class="flex items-center gap-2">
        <button onclick="if(typeof exportEnrollmentsSpreadsheet==='function')exportEnrollmentsSpreadsheet()" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 border border-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export Spreadsheet (CSV)
        </button>
        <button onclick="if(typeof loadNetlifyEnrollments==='function')loadNetlifyEnrollments()" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-lg transition-colors">Refresh</button>
      </div>`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('admin-dashboard.html', html, 'utf8');
    console.log('Successfully added Export Spreadsheet button to admin-dashboard.html!');
} else {
    console.error('Target not found in admin-dashboard.html');
    process.exit(1);
}
