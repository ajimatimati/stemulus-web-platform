const fs = require('fs');

const content = fs.readFileSync('book-class.html', 'utf8');
const asideEnd = content.indexOf('</aside>');
if (asideEnd !== -1) {
  console.log(content.slice(asideEnd, asideEnd + 1500));
} else {
  console.log('</aside> not found');
}
