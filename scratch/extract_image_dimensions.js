const fs = require('fs');
const path = require('path');

const workspace = 'c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus';
const auditFilePath = path.join(workspace, 'scratch/physical_images_audit.json');

if (!fs.existsSync(auditFilePath)) {
    console.error('Audit JSON not found!');
    process.exit(1);
}

const imagesList = JSON.parse(fs.readFileSync(auditFilePath, 'utf8'));
const detailedList = [];

function getPngDimensions(buffer) {
    if (buffer.length < 24) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

function getGifDimensions(buffer) {
    if (buffer.length < 10) return null;
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    return { width, height };
}

function getJpgDimensions(buffer) {
    let i = 2;
    while (i < buffer.length) {
        // Find marker
        if (buffer[i] !== 0xFF) return null;
        let marker = buffer[i + 1];
        if (marker === 0xD9 || marker === 0xDA) { // EOF or Start of Scan
            break;
        }
        
        let length = buffer.readUInt16BE(i + 2);
        
        // SOF markers (Start of Frame)
        // 0xC0 - 0xC3, 0xC5 - 0xC7, 0xC9 - 0xCB, 0xCD - 0xCF
        if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) || 
            (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
            if (i + 9 < buffer.length) {
                const height = buffer.readUInt16BE(i + 5);
                const width = buffer.readUInt16BE(i + 7);
                return { width, height };
            }
        }
        i += 2 + length;
    }
    return null;
}

function getSvgDimensions(content) {
    // Regex for width and height inside <svg ...> tag
    const svgTagMatch = content.match(/<svg[^>]+>/i);
    if (!svgTagMatch) return null;
    const svgTag = svgTagMatch[0];
    
    const wMatch = svgTag.match(/width=["'](\d+(?:\.\d+)?)p?x?["']/i);
    const hMatch = svgTag.match(/height=["'](\d+(?:\.\d+)?)p?x?["']/i);
    
    if (wMatch && hMatch) {
        return { width: Math.round(parseFloat(wMatch[1])), height: Math.round(parseFloat(hMatch[1])) };
    }
    
    const vbMatch = svgTag.match(/viewBox=["']\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*["']/i);
    if (vbMatch) {
        return { width: Math.round(parseFloat(vbMatch[3])), height: Math.round(parseFloat(vbMatch[4])) };
    }
    
    return null;
}

imagesList.forEach(img => {
    const fullPath = path.join(workspace, img.path);
    let dimensions = 'Unknown';
    let format = 'Unknown';
    
    if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        try {
            if (ext === '.svg') {
                const content = fs.readFileSync(fullPath, 'utf8');
                format = 'SVG';
                const dims = getSvgDimensions(content);
                if (dims) dimensions = `${dims.width}x${dims.height}`;
            } else {
                const buffer = fs.readFileSync(fullPath);
                if (ext === '.png') {
                    format = 'PNG';
                    const dims = getPngDimensions(buffer);
                    if (dims) dimensions = `${dims.width}x${dims.height}`;
                } else if (ext === '.jpg' || ext === '.jpeg') {
                    format = 'JPEG';
                    const dims = getJpgDimensions(buffer);
                    if (dims) dimensions = `${dims.width}x${dims.height}`;
                } else if (ext === '.gif') {
                    format = 'GIF';
                    const dims = getGifDimensions(buffer);
                    if (dims) dimensions = `${dims.width}x${dims.height}`;
                }
            }
        } catch (e) {
            dimensions = 'Error: ' + e.message;
        }
    } else {
        dimensions = 'File missing';
    }
    
    img.dimensions = dimensions;
    img.format = format;
    detailedList.push(img);
});

fs.writeFileSync(path.join(workspace, 'scratch/detailed_images_audit.json'), JSON.stringify(detailedList, null, 2));
console.log(`Audited dimensions for ${detailedList.length} physical images.`);
