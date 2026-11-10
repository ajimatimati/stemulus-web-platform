const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require(path.join(__dirname, 'node_modules', 'terser'));

const rootDir = path.join(__dirname, '..');
const cssFile = path.join(rootDir, 'style.css');
const jsDir = path.join(rootDir, 'assets', 'js');

const binDir = path.join(__dirname, 'node_modules', '.bin');
const cleanCssBin = path.join(binDir, process.platform === 'win32' ? 'cleancss.cmd' : 'cleancss');

function writeFileResilient(filePath, content) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (fs.existsSync(filePath)) {
                try { fs.chmodSync(filePath, 0o666); } catch (e) {}
                try { fs.unlinkSync(filePath); } catch (e) {}
            }
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } catch (err) {
            if (attempt === 3) throw err;
        }
    }
}

async function runMinification() {
    // Minify CSS
    console.log('Minifying style.css...');
    try {
        execSync(`"${cleanCssBin}" -o "${path.join(rootDir, 'style.min.css')}" "${cssFile}"`);
        console.log('Success: style.min.css created.');
    } catch (err) {
        console.error('Error minifying CSS:', err.message);
    }

    // Minify JS files in-process
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

    for (const file of jsFiles) {
        const inputPath = path.join(jsDir, file);
        const outputPath = path.join(jsDir, file.replace('.js', '.min.js'));
        try {
            const source = fs.readFileSync(inputPath, 'utf8');
            const result = await minify(source, { compress: true, mangle: true });
            if (result && result.code) {
                writeFileResilient(outputPath, result.code);
                console.log(`Success: ${file.replace('.js', '.min.js')} created.`);
            }
        } catch (err) {
            console.error(`Error minifying ${file}:`, err.message);
        }
    }

    console.log('Minification complete!');
}

runMinification();
