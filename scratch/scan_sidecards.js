const fs = require('fs');
const path = require('path');

const files = ["for-parents.html", "programs.html"];
files.forEach(file => {
  const filePath = path.join("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus", file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('col') || line.includes('card') || line.includes('visual')) {
        if (line.includes('style') || line.includes('class')) {
          console.log(`${file}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
