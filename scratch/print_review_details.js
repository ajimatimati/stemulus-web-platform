const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

let index = 0;
lines.forEach((line, idx) => {
  if (line.includes('class="testi-card"')) {
    console.log(`Review ${++index} starts at line ${idx+1}`);
    for (let i = idx; i < idx + 20; i++) {
      console.log(`  ${i+1}: ${lines[i]}`);
    }
    console.log("------------------------");
  }
});
