const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\index.html', 'utf8');
const regex = /<section[^>]*id="showcase-section"[\s\S]*?<\/section>/gi;
const match = regex.exec(content);
if (match) {
  console.log(match[0].substring(0, 2000));
} else {
  console.log("Not found");
}
