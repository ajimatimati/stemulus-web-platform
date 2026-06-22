const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = ["for-parents.html", "programs.html", "contact.html", "blog.html"];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('canvas') || line.includes('visual-') || line.includes('3d') || line.includes('radial') || line.includes('background:')) {
        // Log line if it contains style background or radial-gradient or visual card container
        if (line.includes('style=') || line.includes('class=') && (line.includes('visual') || line.includes('canvas') || line.includes('hero'))) {
          console.log(`${file}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
