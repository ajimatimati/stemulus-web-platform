const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (content.includes('testimonial-rotator')) {
    console.log(`File: ${f} has testimonial-rotator`);
  }
});
