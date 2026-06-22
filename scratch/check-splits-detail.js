const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'contact.html';
const content = fs.readFileSync(path.join(__dirname, '..', target), 'utf8');
const lines = content.split('\n');
const splitRegex = /\b\d+-\d+\b/g;

console.log(`Splits in ${target}:`);
lines.forEach((line, idx) => {
    const matches = line.match(splitRegex);
    if (matches) {
        console.log(`Line ${idx + 1}: ${matches.join(', ')} -> "${line.trim()}"`);
    }
});
