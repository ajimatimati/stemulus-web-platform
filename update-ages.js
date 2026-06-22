const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Replace 5-9 with 5-9
  content = content.replace(/\b7-9\b/g, '5-9');
  
  // Replace 5-10 with 5-10
  content = content.replace(/\b7-10\b/g, '5-10');

  // Also catch wordy formats if any e.g. "ages 5 to 9" -> "ages 5 to 9"
  content = content.replace(/\b7 to 9\b/gi, '5 to 9');
  content = content.replace(/\b7 to 10\b/gi, '5 to 10');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ages in:', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.md')) {
        processFile(fullPath);
      }
    }
  });
}

walkDir(__dirname);
