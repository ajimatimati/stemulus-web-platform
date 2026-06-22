const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../assets/js');
const files = fs.readdirSync(jsDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        const match = content.match(/ST-\d+/g);
        if (match) {
            console.log(`Found in ${file}: ${match.join(', ')}`);
        }
    }
});
