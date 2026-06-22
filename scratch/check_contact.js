const fs = require('fs');
const content = fs.readFileSync("c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\contact.html", 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('form') || line.includes('contact-') || line.includes('bg-') || line.includes('text-')) {
    if (line.includes('class=') && (line.includes('form') || line.includes('input') || line.includes('section'))) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
