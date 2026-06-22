const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const cssFiles = ["style.css", "preai-overhaul.css"];

cssFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('.form-label') || line.includes('.form-input')) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
