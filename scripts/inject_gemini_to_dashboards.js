const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dashboards = [
  'admin-dashboard.html',
  'parent-dashboard.html',
  'tutor-dashboard.html'
];

dashboards.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const scriptTags = `  <script src="assets/js/gemini-config.js" defer></script>\n  <script src="assets/js/gemini-service.js" defer></script>\n`;

  if (!content.includes('gemini-service.js')) {
    if (content.includes('assets/js/i18n-visual-engine.js')) {
      content = content.replace('assets/js/i18n-visual-engine.js', `assets/js/gemini-config.js"></script>\n  <script src="assets/js/gemini-service.js"></script>\n  <script src="assets/js/i18n-visual-engine.js`);
      modified = true;
    } else if (content.includes('assets/js/admin-engine')) {
      content = content.replace('<script src="assets/js/admin-engine', `${scriptTags}<script src="assets/js/admin-engine`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Success] Injected Gemini scripts into ${file}`);
  } else {
    console.log(`[Notice] Gemini scripts already present or bypassed in ${file}`);
  }
});
