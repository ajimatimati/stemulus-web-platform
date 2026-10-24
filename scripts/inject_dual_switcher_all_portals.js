const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// 1. Update admin-dashboard.html
const adminPath = path.join(ROOT_DIR, 'admin-dashboard.html');
let adminHTML = fs.readFileSync(adminPath, 'utf8');

if (!adminHTML.includes('id="mount-admin-dual-switcher"')) {
  adminHTML = adminHTML.replace(
    '<!-- Quick Actions -->',
    '<div id="mount-admin-dual-switcher" class="shrink-0"></div>\n        <!-- Quick Actions -->'
  );
  console.log('[Admin] Injected mount-admin-dual-switcher');
}

if (!adminHTML.includes('i18n-visual-engine.js')) {
  adminHTML = adminHTML.replace(
    '<script src="assets/js/operations-manager-engine.js" defer></script>',
    '<script src="assets/js/operations-manager-engine.js" defer></script>\n\n <!-- i18n & 3D Visual Engine -->\n <script src="assets/js/i18n-visual-engine.js" defer></script>\n\n <!-- Bilingual Classroom Translation Engine -->\n <script src="assets/js/bilingual-classroom-engine.js" defer></script>'
  );
  console.log('[Admin] Injected i18n and bilingual script tags');
}

if (!adminHTML.includes("switcherEl.innerHTML = I18nVisualEngine.renderSwitcherWidgetHTML()")) {
  adminHTML = adminHTML.replace(
    'if (opsEl && typeof OperationsManagerEngine !== \'undefined\') {',
    'const switcherEl = document.getElementById(\'mount-admin-dual-switcher\');\n        if (switcherEl && typeof I18nVisualEngine !== \'undefined\') {\n          switcherEl.innerHTML = I18nVisualEngine.renderSwitcherWidgetHTML();\n        }\n        if (opsEl && typeof OperationsManagerEngine !== \'undefined\') {'
  );
  console.log('[Admin] Injected switcher initialization');
}
fs.writeFileSync(adminPath, adminHTML, 'utf8');

// 2. Update parent-dashboard.html
const parentPath = path.join(ROOT_DIR, 'parent-dashboard.html');
let parentHTML = fs.readFileSync(parentPath, 'utf8');

if (!parentHTML.includes('id="mount-parent-dual-switcher"')) {
  parentHTML = parentHTML.replace(
    '<div style="display:flex; align-items:center; gap:12px;">\n        <a href="parent-progress.html"',
    '<div style="display:flex; align-items:center; gap:12px;">\n        <div id="mount-parent-dual-switcher"></div>\n        <a href="parent-progress.html"'
  );
  console.log('[Parent] Injected mount-parent-dual-switcher');
}

if (!parentHTML.includes('i18n-visual-engine.js')) {
  parentHTML = parentHTML.replace(
    '<script src="assets/js/class-reminder-engine.js" defer></script>',
    '<script src="assets/js/class-reminder-engine.js" defer></script>\n  <script src="assets/js/i18n-visual-engine.js" defer></script>\n  <script src="assets/js/bilingual-classroom-engine.js" defer></script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      setTimeout(function() {\n        var el = document.getElementById("mount-parent-dual-switcher");\n        if (el && typeof I18nVisualEngine !== "undefined") {\n          el.innerHTML = I18nVisualEngine.renderSwitcherWidgetHTML();\n        }\n      }, 500);\n    });\n  </script>'
  );
  console.log('[Parent] Injected i18n scripts');
}
fs.writeFileSync(parentPath, parentHTML, 'utf8');

// 3. Update tutor-dashboard.html
const tutorPath = path.join(ROOT_DIR, 'tutor-dashboard.html');
let tutorHTML = fs.readFileSync(tutorPath, 'utf8');

if (!tutorHTML.includes('id="mount-tutor-dual-switcher"')) {
  tutorHTML = tutorHTML.replace(
    '<div style="display:flex; align-items:center; gap:12px;">\n        <a href="tutor-attendance.html"',
    '<div style="display:flex; align-items:center; gap:12px;">\n        <div id="mount-tutor-dual-switcher"></div>\n        <a href="tutor-attendance.html"'
  );
  console.log('[Tutor] Injected mount-tutor-dual-switcher');
}

if (!tutorHTML.includes('i18n-visual-engine.js')) {
  tutorHTML = tutorHTML.replace(
    '<script src="assets/js/tutor-attendance-engine.js" defer></script>',
    '<script src="assets/js/tutor-attendance-engine.js" defer></script>\n  <script src="assets/js/i18n-visual-engine.js" defer></script>\n  <script src="assets/js/bilingual-classroom-engine.js" defer></script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      setTimeout(function() {\n        var el = document.getElementById("mount-tutor-dual-switcher");\n        if (el && typeof I18nVisualEngine !== "undefined") {\n          el.innerHTML = I18nVisualEngine.renderSwitcherWidgetHTML();\n        }\n      }, 500);\n    });\n  </script>'
  );
  console.log('[Tutor] Injected i18n scripts');
}
fs.writeFileSync(tutorPath, tutorHTML, 'utf8');

console.log('[Success] Dual switchers injected across Admin, Parent, and Tutor dashboards!');
