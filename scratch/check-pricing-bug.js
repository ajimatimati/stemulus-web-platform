const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'assets' && file !== 'images' && file !== 'All img assests') {
                getFiles(name, fileList);
            }
        } else {
            fileList.push(name);
        }
    }
    return fileList;
}

const allFiles = getFiles(WORKSPACE_DIR);
const htmlFiles = allFiles.filter(f => f.endsWith('.html'));

const findings = [];

htmlFiles.forEach(filePath => {
    const relativePath = path.relative(WORKSPACE_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        if (line.includes('Investment in Their Future') || line.includes('Investment in their Future')) {
            // grab preceding and succeeding few lines
            const start = Math.max(0, idx - 4);
            const end = Math.min(lines.length - 1, idx + 4);
            const context = lines.slice(start, end + 1).map((l, i) => `${start + i + 1}: ${l.trim()}`).join('\n');
            findings.push({ file: relativePath, line: idx + 1, context });
        }
    });
});

console.log(JSON.stringify(findings, null, 2));
