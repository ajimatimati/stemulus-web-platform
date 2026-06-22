const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const lines = content.split('\n');
const splitRegex = /\b\d+-\d+\b/g;

lines.forEach((line, idx) => {
    const matches = line.match(splitRegex);
    if (matches) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
