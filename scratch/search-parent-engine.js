const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../assets/js/parent-engine.js'), 'utf8');
const lines = content.split('\n');

console.log('Searching in parent-engine.js:');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('id') || line.toLowerCase().includes('link') || line.toLowerCase().includes('student')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
