const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = [
  "parent-dashboard.html",
  "tutor-dashboard.html",
  "admin-dashboard.html",
  "assets/js/parent-engine.js",
  "assets/js/tutor-engine.js",
  "assets/js/admin-engine.js"
];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('login') || line.includes('session') || line.includes('prompt') || line.includes('redirect')) {
        if (line.includes('window.location') || line.includes('login') || line.includes('showLogin')) {
          console.log(`${file}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
