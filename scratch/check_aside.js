const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\enroll.html", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('aside') || line.includes('/aside')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
