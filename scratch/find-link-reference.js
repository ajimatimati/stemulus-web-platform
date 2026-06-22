const fs = require('fs');
const path = require('path');

const refPath = path.join(__dirname, '../scratch/New STEMulus website/for-parents.html');
if (fs.existsSync(refPath)) {
    const content = fs.readFileSync(refPath, 'utf8');
    const lines = content.split('\n');
    console.log('Search in reference for-parents.html:');
    lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('modal') || line.toLowerCase().includes('link-student') || line.toLowerCase().includes('student-id') || line.toLowerCase().includes('st-')) {
            console.log(`Line ${idx + 1}: ${line.trim()}`);
        }
    });
} else {
    console.log('Reference for-parents.html not found.');
}
