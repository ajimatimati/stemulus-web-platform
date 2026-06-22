const fs = require('fs');
const path = require('path');

const workspace = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';
const images = {};

function registerImage(src, file, type) {
    if (!src) return;
    // Clean up query parameters or hashes if any
    const cleanSrc = src.split('?')[0].split('#')[0].trim();
    if (!cleanSrc) return;
    
    if (!images[cleanSrc]) {
        images[cleanSrc] = {
            src: cleanSrc,
            referenced_in: []
        };
    }
    const ref = `${file} (${type})`;
    if (!images[cleanSrc].referenced_in.includes(ref)) {
        images[cleanSrc].referenced_in.push(ref);
    }
}

// Read directory
const files = fs.readdirSync(workspace);

files.forEach(file => {
    const filePath = path.join(workspace, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.html') {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 1. Match img src
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
            let match;
            while ((match = imgRegex.exec(content)) !== null) {
                registerImage(match[1], file, 'HTML <img> Tag');
            }
            
            // 2. Match background url in style attributes or inline styles
            const urlRegex = /url\(["']?([^'"\)]+\.(?:png|jpg|jpeg|svg|webp|gif))["']?\)/gi;
            while ((match = urlRegex.exec(content)) !== null) {
                registerImage(match[1], file, 'HTML inline url()');
            }
        } else if (ext === '.css') {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Match url(...) in CSS files
            const urlRegex = /url\(["']?([^'"\)]+\.(?:png|jpg|jpeg|svg|webp|gif))["']?\)/gi;
            let match;
            while ((match = urlRegex.exec(content)) !== null) {
                registerImage(match[1], file, 'CSS file url()');
            }
        }
    }
});

// Output format
const result = Object.values(images);
fs.writeFileSync(path.join(workspace, 'scratch/images_audit.json'), JSON.stringify(result, null, 2));
console.log(`Successfully audited ${result.length} unique images.`);
