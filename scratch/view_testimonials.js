const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\index.html', 'utf8');
const regex = /<section[^>]*id="testimonials-section"[\s\S]*?<\/section>/gi;
const match = regex.exec(content);
if (match) {
  console.log(match[0].substring(0, 1500));
  console.log('\n... TRUNCATED ...\n');
  console.log(match[0].substring(match[0].length - 1000));
} else {
  console.log("Not found");
}
