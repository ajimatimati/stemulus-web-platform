const fs = require('fs');
const path = require('path');

const files = ["for-parents.html", "programs.html"];
files.forEach(file => {
  const filePath = path.join("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus", file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const index = content.indexOf('three-js-canvas-container');
    if (index !== -1) {
      console.log(`\n=== ${file} ===`);
      // print 150 characters before and 350 after
      const start = Math.max(0, index - 300);
      const end = Math.min(content.length, index + 350);
      console.log(content.substring(start, end));
    }
  }
});
