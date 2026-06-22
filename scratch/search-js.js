const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../assets/js');
const files = fs.readdirSync(jsDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        if (content.includes('2024') || content.includes('ST-')) {
            console.log(`Found reference in ${file}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('2024') || line.includes('ST-')) {
                    console.log(`  Line ${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
});
