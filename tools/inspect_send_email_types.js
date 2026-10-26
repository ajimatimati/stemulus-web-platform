const fs = require('fs');
const content = fs.readFileSync('netlify/functions/send-email.js', 'utf8');

const regex = /(?:case\s+['"]([^'"]+)['"]|if\s*\(\s*(?:type|payload\.type)\s*===?\s*['"]([^'"]+)['"])/g;
let match;
const types = new Set();
while ((match = regex.exec(content)) !== null) {
  if (match[1]) types.add(match[1]);
  if (match[2]) types.add(match[2]);
}
console.log('Supported email types:', Array.from(types));
