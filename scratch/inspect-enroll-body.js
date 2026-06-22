const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\enroll.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('✨') || line.includes('personalize') || line.includes('Personalize') || line.includes('None') || line.includes('Some') || line.includes('Expert') || line.includes('Coding Experience') || line.includes('Experience Level')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
