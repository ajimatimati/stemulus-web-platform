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

const findings = {
    pricingLinks: [],
    sparkles: [],
    gradients: [],
    duplicateIds: [],
    aiPhrases: [],
    glassmorphism: [],
};

htmlFiles.forEach(filePath => {
    const relativePath = path.relative(WORKSPACE_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        if (line.includes('pricing.html')) {
            findings.pricingLinks.push({ file: relativePath, line: idx + 1, content: line.trim() });
        }
        if (line.includes('✨')) {
            findings.sparkles.push({ file: relativePath, line: idx + 1, content: line.trim() });
        }
        if (line.includes('personalize') || line.includes('Personalize') || line.includes('smart-') || line.includes('diagnostic')) {
            findings.aiPhrases.push({ file: relativePath, line: idx + 1, content: line.trim() });
        }
        if (line.includes('text-transparent bg-clip-text') || line.includes('bg-gradient-to-r') || line.includes('gradient-text')) {
            findings.gradients.push({ file: relativePath, line: idx + 1, content: line.trim() });
        }
        if (line.includes('glass-form') || line.includes('backdrop-blur') || line.includes('bg-white/')) {
            findings.glassmorphism.push({ file: relativePath, line: idx + 1, content: line.trim() });
        }
    });

    const idRegex = /id=["']([^"']+)["']/g;
    const ids = {};
    let match;
    while ((match = idRegex.exec(content)) !== null) {
        const id = match[1];
        if (ids[id]) {
            ids[id]++;
        } else {
            ids[id] = 1;
        }
    }
    for (const [id, count] of Object.entries(ids)) {
        if (count > 1) {
            findings.duplicateIds.push({ file: relativePath, id, count });
        }
    }
});

fs.writeFileSync(path.join(WORKSPACE_DIR, 'scratch/audit-results.json'), JSON.stringify(findings, null, 2), 'utf8');
console.log('Audit complete. Results written to scratch/audit-results.json');
