const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus";
const files = ["for-parents.html", "programs.html", "contact.html", "blog.html"];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('radial-gradient') || line.includes('parents-visual-card') || line.includes('preai-hero-img-overlay')) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
