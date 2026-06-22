const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const recoveries = [
    { search: /20-0/g, replace: '200' },
    { search: /30-0/g, replace: '300' },
    { search: /10-0/g, replace: '100' },
    { search: /15-0/g, replace: '150' },
    { search: /40-0/g, replace: '400' },
    { search: /50-0/g, replace: '500' },
    { search: /60-0/g, replace: '600' },
    { search: /70-0/g, replace: '700' },
    { search: /80-0/g, replace: '800' },
    { search: /90-0/g, replace: '900' },
    { search: /25-0/g, replace: '250' },
    { search: /35-0/g, replace: '350' },
    { search: /45-0/g, replace: '450' },
    { search: /75-0/g, replace: '750' },
    { search: /18-0/g, replace: '180' },
    { search: /24-0/g, replace: '240' }
];

function healFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const r of recoveries) {
        content = content.replace(r.search, r.replace);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Healed hundreds in: ${path.basename(filePath)}`);
    }
}

function scanHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
                scanHtmlFiles(fullPath);
            }
        } else if (file.endsWith('.html')) {
            healFile(fullPath);
        }
    }
}

console.log('Healing hundreds (e.g. 20-0 -> 200) in HTML files...');
scanHtmlFiles(rootDir);
console.log('Hundreds healing complete!');
