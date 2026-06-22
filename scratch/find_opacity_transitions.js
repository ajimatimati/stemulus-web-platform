const fs = require('fs');
const path = require('path');

const files = ["preai-overhaul.css", "style.css"];
files.forEach(file => {
  const filePath = path.join("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus", file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('opacity') || line.includes('transition') || line.includes('transform') || line.includes('reveal')) {
        if (line.includes('reveal') || line.includes('sr-') || line.includes('.fade') || line.includes('.animate')) {
          console.log(`${file}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
