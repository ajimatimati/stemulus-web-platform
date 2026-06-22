const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\preai-overhaul.css", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('.preai-hero-') || line.includes('preai-hero-split')) {
    if (line.includes('{') || line.includes('background') || line.includes('radial-gradient')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
