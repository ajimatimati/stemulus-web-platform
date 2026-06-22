const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\preai-overhaul.css", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('#hero-panel') || line.includes('#scrub-video') || line.includes('#video-bg') || line.includes('.hero-headline')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
