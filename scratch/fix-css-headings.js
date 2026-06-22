const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Fix CSS split heading selectors and variables
function fixCSSContent(content) {
    let c = content;

    // Fix split headings selectors e.g. "h 1, h 2, h 3" -> "h1, h2, h3"
    // Also matches ".bg-slate-900 h 1" -> ".bg-slate-900 h1"
    c = c.replace(/\bh\s+([1-6])\b/g, 'h$1');

    // Fix split variables e.g. "--accent 1" -> "--accent-1"
    c = c.replace(/--accent\s+(\d+)\b/g, '--accent-$1');
    c = c.replace(/var\(--accent\s+(\d+)/g, 'var(--accent-$1');

    // Fix hero split classes e.g. ".preai-hero-h 1" -> ".preai-hero-h1"
    c = c.replace(/\.preai-hero-h\s+(\d+)/g, '.preai-hero-h$1');

    // Fix split lines e.g. "-line 1" -> "-line-1"
    c = c.replace(/-line\s+(\d+)\b/g, '-line-$1');

    return c;
}

// 2. Fix HTML split video paths and any other split tags
function fixHTMLContent(content) {
    let c = content;

    // Fix video path e.g. "Robot_scrub.mp 4" -> "Robot_scrub.mp4"
    c = c.replace(/\.mp\s+4\b/g, '.mp4');

    // Fix heading tags inside comments or texts if any split headings like "h 1" left
    // We already fixed <h 1 and </h 1, let's fix any occurrences in class names
    c = c.replace(/class="preai-hero-h\s+1"/g, 'class="preai-hero-h1"');
    c = c.replace(/class="preai-hero-h\s+1-line\s+1"/g, 'class="preai-hero-h1-line-1"');
    c = c.replace(/class="preai-hero-h\s+1-line\s+2"/g, 'class="preai-hero-h1-line-2"');
    c = c.replace(/class="preai-hero-h\s+1-line\s+3"/g, 'class="preai-hero-h1-line-3"');

    return c;
}

function healFile(filePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    let healed = content;

    if (ext === '.css') {
        healed = fixCSSContent(content);
    } else if (ext === '.html') {
        healed = fixHTMLContent(content);
    }

    if (healed !== content) {
        fs.writeFileSync(filePath, healed, 'utf8');
        console.log(`Healed CSS/Paths: ${path.basename(filePath)}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && file !== 'assets') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.css')) {
            healFile(fullPath);
        }
    }
}

console.log('Running final CSS headings, variables, and video paths healing pass...');
scanDir(rootDir);
console.log('Final CSS headings, variables, and video paths healing complete!');
