const fs = require('fs');
const path = require('path');

const DASH_PATH = path.join(__dirname, '..', 'admin-dashboard.html');
let content = fs.readFileSync(DASH_PATH, 'utf8');

// 1. Mount containers
const targetWidget = " <!-- Today's Classes Widget -->";
const mountHTML = ` <!-- BIRTHDAY CELEBRATIONS HEADQUARTERS -->\n <div id="mount-birthday-headquarters" class="mt-6"></div>\n\n <!-- CLASSROOM & OPERATIONS HEADQUARTERS -->\n <div id="mount-operations-suite" class="mt-6"></div>\n\n` + targetWidget;

if (!content.includes('id="mount-birthday-headquarters"')) {
  if (content.includes(targetWidget)) {
    content = content.replace(targetWidget, mountHTML);
    console.log('[Inject] Successfully added mount containers before Today\'s Classes Widget.');
  } else {
    console.error('[Inject Error] targetWidget not found in admin-dashboard.html');
  }
} else {
  console.log('[Inject] Mount containers already present.');
}

// 2. Script tags
const targetScript = '<script src="assets/js/class-escalation-engine.js" defer></script>';
const scriptTags = `${targetScript}\n\n <!-- Birthday Celebration Engine -->\n <script src="assets/js/birthday-celebration-engine.js" defer></script>\n\n <!-- Classroom Manager, Operations Manager & Admin Assistant Engine -->\n <script src="assets/js/operations-manager-engine.js" defer></script>`;

if (!content.includes('birthday-celebration-engine.js')) {
  if (content.includes(targetScript)) {
    content = content.replace(targetScript, scriptTags);
    console.log('[Inject] Successfully added Birthday and Operations engine script tags.');
  } else {
    console.error('[Inject Error] targetScript not found in admin-dashboard.html');
  }
} else {
  console.log('[Inject] Script tags already present.');
}

// 3. Initializer script
const initHookTarget = "<!-- WhatsApp Bot Integration -->";
const initHookCode = `<!-- Operations & Birthday Engines Auto-Mount -->\n <script>\n   document.addEventListener('DOMContentLoaded', () => {\n     function initOpsAndCelebrations() {\n       const bdayEl = document.getElementById('mount-birthday-headquarters');\n       if (bdayEl && typeof BirthdayCelebrationEngine !== 'undefined') {\n         bdayEl.innerHTML = BirthdayCelebrationEngine.renderBirthdayHeadquartersHTML();\n       }\n       const opsEl = document.getElementById('mount-operations-suite');\n       if (opsEl && typeof OperationsManagerEngine !== 'undefined') {\n         opsEl.innerHTML = OperationsManagerEngine.renderOperationsSuiteHTML();\n       }\n       if (typeof ClassEscalationEngine !== 'undefined') {\n         ClassEscalationEngine.startWatchdog(15000);\n       }\n     }\n     setTimeout(initOpsAndCelebrations, 600);\n     window.addEventListener('stemulus_db_loaded', initOpsAndCelebrations);\n   });\n </script>\n\n ${initHookTarget}`;

if (!content.includes('Operations & Birthday Engines Auto-Mount')) {
  if (content.includes(initHookTarget)) {
    content = content.replace(initHookTarget, initHookCode);
    console.log('[Inject] Successfully added auto-mount initialization script.');
  } else {
    console.error('[Inject Error] initHookTarget not found in admin-dashboard.html');
  }
} else {
  console.log('[Inject] Auto-mount script already present.');
}

fs.writeFileSync(DASH_PATH, content, 'utf8');
console.log('[Inject Complete] admin-dashboard.html updated successfully!');
