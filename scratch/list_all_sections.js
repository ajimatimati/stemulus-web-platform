const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\index.html', 'utf8');
const sectionRegex = /<section\b[^>]*>/gi;
let match;
while ((match = sectionRegex.exec(content)) !== null) {
  console.log(match[0]);
}
