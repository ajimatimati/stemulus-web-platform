const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../for-parents.html'), 'utf8');
const lines = content.split('\n');

console.log('Link/Modal triggers in for-parents.html:');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('modal') || line.toLowerCase().includes('link-student') || line.toLowerCase().includes('student-id')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
