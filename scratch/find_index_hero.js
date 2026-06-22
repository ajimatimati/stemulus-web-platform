const fs = require('fs');
const lines = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\index.html", 'utf8').split('\n');
lines.forEach((line, index) => {
  if (line.includes('hero-panel') || line.includes('scrub-video') || line.includes('video-bg')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
