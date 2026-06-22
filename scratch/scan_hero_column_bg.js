const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\preai-overhaul.css", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('preai-hero-img-col')) {
    // print the line and next 5 lines
    console.log(`\nLine ${index + 1}:`);
    for (let i = 0; i < 6; i++) {
      if (lines[index + i]) {
        console.log(`  ${lines[index + i].trim()}`);
      }
    }
  }
});
