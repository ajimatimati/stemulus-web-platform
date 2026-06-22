const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\assets\\js\\dashboard-engine.js', 'utf8');
const lines = content.split('\n');
let count = 0;
lines.forEach((line, idx) => {
    if (line.includes('deleteStudent')) {
        console.log(`${idx + 1}: ${line.trim()}`);
        count++;
    }
});
console.log(`Total occurrences found: ${count}`);
