const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function walkDir(currentDir, callback) {
    fs.readdirSync(currentDir).forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.gemini') {
                walkDir(filePath, callback);
            }
        } else if (file.endsWith('.html')) {
            callback(filePath);
        }
    });
}

console.log("=== AUDITING ALL IMG TAGS FOR EXISTING FILES ===");
let totalChecked = 0;
let totalBroken = 0;

walkDir(dir, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all img tags and extract their src attribute
    // Regex matches <img ... src="path" ... > or src='path'
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        totalChecked++;
        
        // Skip base64 data URLs or external HTTP/HTTPS URLs
        if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
            console.log(`[EXTERNAL] ${path.relative(dir, filePath)}: ${src}`);
            continue;
        }
        
        // Construct absolute path to the image
        // The src is relative to the HTML file's location
        const htmlDir = path.dirname(filePath);
        const imgPath = path.resolve(htmlDir, src);
        
        if (!fs.existsSync(imgPath)) {
            console.log(`[BROKEN] ${path.relative(dir, filePath)}: image src="${src}" DOES NOT exist on disk! (Resolved path: ${imgPath})`);
            totalBroken++;
        }
    }
});

console.log(`\nAudit complete. Checked ${totalChecked} images. Found ${totalBroken} broken images.`);
