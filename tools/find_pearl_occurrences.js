const fs = require('fs');
const code = fs.readFileSync('assets/js/dashboard-engine.js', 'utf8');

let idx = 0;
while (true) {
  const found = code.indexOf('std-1007-r4cv', idx);
  if (found === -1) break;
  console.log('Found std-1007-r4cv at', found);
  console.log(code.slice(found - 40, found + 120));
  idx = found + 1;
}
