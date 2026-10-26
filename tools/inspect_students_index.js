const fs = require('fs');
const code = fs.readFileSync('assets/js/dashboard-engine.js', 'utf8');

let idx = 0;
while (true) {
  const found = code.indexOf('"students": [', idx);
  if (found === -1) break;
  console.log('Found "students": [ at index', found);
  // print next 100 chars
  console.log(code.slice(found, found + 120));
  idx = found + 1;
}
