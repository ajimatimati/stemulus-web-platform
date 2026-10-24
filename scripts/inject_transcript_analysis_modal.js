const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'admin-dashboard.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

const marker = '<!-- ===== MANUAL BOT DISPATCH MODAL ===== -->';
const modalHtml = `<!-- ===== AI TRANSCRIPT & CONTENT ANALYSIS MODAL ===== -->
  <div id="modal-transcript-analysis" class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <i data-lucide="shield-alert" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-800">AI Content &amp; Transcript Inspector</h3>
            <p class="text-xs text-slate-500">Autonomous Lesson Plan Adherence &amp; Untoward Safeguarding Watchdog</p>
          </div>
        </div>
        <button type="button" onclick="AdminEngine.closeTranscriptAnalysisModal()" class="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div id="mount-transcript-analysis-content">
        <!-- Rendered dynamically by SessionContentAnalysisEngine.renderAnalysisCardHTML -->
      </div>
    </div>
  </div>

  `;

if (!html.includes('id="modal-transcript-analysis"')) {
  if (html.includes(marker)) {
    html = html.replace(marker, modalHtml + marker);
    console.log('Injected modal-transcript-analysis into admin-dashboard.html');
  } else {
    console.warn('Marker for modal not found!');
  }
} else {
  console.log('modal-transcript-analysis already present in admin-dashboard.html');
}

const scriptMarker = '<script src="assets/js/admin-engine.min.js?v=20261017d" defer></script>';
const scriptTag = '<script src="assets/js/session-content-analysis-engine.js" defer></script>\n  ';

if (!html.includes('session-content-analysis-engine.js')) {
  if (html.includes(scriptMarker)) {
    html = html.replace(scriptMarker, scriptTag + scriptMarker);
    console.log('Injected session-content-analysis-engine.js script tag');
  } else {
    console.warn('Script marker not found!');
  }
} else {
  console.log('session-content-analysis-engine.js script tag already present');
}

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('admin-dashboard.html injection complete!');
