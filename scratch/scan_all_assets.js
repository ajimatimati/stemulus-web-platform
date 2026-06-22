const fs = require('fs');
const path = require('path');

const workspace = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';

// Get all files recursively in a directory
function getFilesRecursively(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // Exclude directories like .git, node_modules, .vscode
            if (!file.startsWith('.') && file !== 'node_modules') {
                getFilesRecursively(filePath, fileList);
            }
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const allFiles = getFilesRecursively(workspace);

// 1. Identify all image files in the project
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
const imageFiles = [];

allFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
        imageFiles.push(file);
    }
});

console.log(`Found ${imageFiles.length} physical image files in project.`);

// 2. Scan all text files (HTML, CSS, JS) for references to these image filenames
const textExtensions = ['.html', '.css', '.js', '.json', '.md'];
const textFiles = allFiles.filter(file => textExtensions.includes(path.extname(file).toLowerCase()));

const references = {};
imageFiles.forEach(img => {
    const relativeImgPath = path.relative(workspace, img).replace(/\\/g, '/');
    const imgName = path.basename(img);
    references[relativeImgPath] = {
        physical_path: img,
        size_bytes: fs.statSync(img).size,
        filename: imgName,
        referenced_in: []
    };
});

textFiles.forEach(txtFile => {
    const txtContent = fs.readFileSync(txtFile, 'utf8');
    const relativeTxtPath = path.relative(workspace, txtFile).replace(/\\/g, '/');
    
    // Skip checking scratch scripts or audit files
    if (relativeTxtPath.startsWith('scratch/') || relativeTxtPath.startsWith('.system_generated/')) return;
    
    Object.keys(references).forEach(imgRelPath => {
        const imgObj = references[imgRelPath];
        
        // Match exact filename or path
        const escapedFilename = imgObj.filename.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const escapedRelPath = imgRelPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        const fileRegex = new RegExp(escapedFilename, 'i');
        const pathRegex = new RegExp(escapedRelPath, 'i');
        
        if (fileRegex.test(txtContent) || pathRegex.test(txtContent)) {
            imgObj.referenced_in.push(relativeTxtPath);
        }
    });
});

const result = Object.keys(references).map(key => {
    return {
        path: key,
        filename: references[key].filename,
        size_bytes: references[key].size_bytes,
        referenced_in: references[key].referenced_in
    };
});

fs.writeFileSync(path.join(workspace, 'scratch/physical_images_audit.json'), JSON.stringify(result, null, 2));
console.log(`Audited ${result.length} physical image files for code references.`);
