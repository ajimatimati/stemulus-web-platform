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
    const sections = content.split(/<section/g);

    sections.forEach((section, sIdx) => {
        if (sIdx === 0) return;
        const hasLightBg = section.includes('bg-white') || section.includes('bg-slate-50') || section.includes('bg-gray-50') || section.includes('bg-warm-white');
        if (hasLightBg) {
            const lines = section.split('\n');
            lines.forEach((line, lIdx) => {
                if (line.includes('text-white') && (line.includes('<h1') || line.includes('<h2') || line.includes('<h3') || line.includes('<p') || line.includes('<span') || line.includes('<div'))) {
                    const isDarkSubBlock = line.includes('bg-') && !line.includes('bg-white') && !line.includes('bg-slate-50') && !line.includes('bg-gray-50') && !line.includes('bg-warm-white') && !line.includes('bg-transparent');
                    if (!isDarkSubBlock) {
                        findings.push({
                            file: relativePath,
                            sectionIndex: sIdx,
                            line: line.trim()
                        });
                    }
                }
            });
        }
    });
});

fs.writeFileSync(path.join(WORKSPACE_DIR, 'scratch/white-on-white-results.json'), JSON.stringify(findings, null, 2), 'utf8');
console.log('Done. Results written to scratch/white-on-white-results.json');
