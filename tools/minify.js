const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const cssFile = path.join(rootDir, 'style.css');
const jsDir = path.join(rootDir, 'assets', 'js');

const binDir = path.join(__dirname, 'node_modules', '.bin');
const cleanCssBin = path.join(binDir, 'cleancss');
const terserBin = path.join(binDir, 'terser');

// Minify CSS
console.log('Minifying style.css...');
try {
    execSync(`"${cleanCssBin}" -o "${path.join(rootDir, 'style.min.css')}" "${cssFile}"`);
    console.log('Success: style.min.css created.');
} catch (err) {
    console.error('Error minifying CSS:', err.message);
}

// Minify JS files
const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

jsFiles.forEach(file => {
    console.log(`Minifying ${file}...`);
    const inputPath = path.join(jsDir, file);
    const outputPath = path.join(jsDir, file.replace('.js', '.min.js'));
    try {
        execSync(`"${terserBin}" "${inputPath}" -o "${outputPath}" --compress --mangle`);
        console.log(`Success: ${file.replace('.js', '.min.js')} created.`);
    } catch (err) {
        console.error(`Error minifying ${file}:`, err.message);
    }
});

console.log('Minification complete!');
