const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../programs.html');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
    { search: /1485827404703-8-9b5-5fcc59-5e/g, replace: '1485827404703-89b55fcc595e' },
    { search: /1513364776144-6096-7b0f800f/g, replace: '1513364776144-60967b0f800f' },
    { search: /1532094349884-54-3bc11b23-4d/g, replace: '1532094349884-543bc11b234d' }
];

let original = content;
for (const r of replacements) {
    content = content.replace(r.search, r.replace);
}

if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Healed Unsplash URLs in programs.html!');
} else {
    console.log('No changes needed or patterns not found in programs.html.');
}
