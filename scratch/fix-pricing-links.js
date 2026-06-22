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

let updatedCount = 0;

htmlFiles.forEach(filePath => {
    const relativePath = path.relative(WORKSPACE_DIR, filePath).replace(/\\/g, '/');
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('pricing.html')) {
        // Replace pricing.html with programs.html#pricing
        content = content.replace(/pricing\.html/g, 'programs.html#pricing');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated pricing links in: ${relativePath}`);
        updatedCount++;
    }
});

console.log(`Finished updating pricing links. Total files modified: ${updatedCount}`);
