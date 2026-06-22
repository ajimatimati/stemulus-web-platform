const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\style.css", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('sr-hidden') || line.includes('sr-visible')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
