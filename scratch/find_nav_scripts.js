const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('mixBlendMode') || content.includes('nav-light')) {
        console.log(`File: ${file} has nav script/references`);
    }
});
