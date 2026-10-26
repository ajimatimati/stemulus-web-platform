const path = require('path');
const { execSync } = require('child_process');
const terserBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'terser.cmd' : 'terser');
const rootDir = path.join(__dirname, '..');

const target = path.join(rootDir, 'assets', 'js', 'tutor-engine.js');
const output = path.join(rootDir, 'assets', 'js', 'tutor-engine.min.js');

execSync(`"${terserBin}" "${target}" -o "${output}" --compress --mangle`);
console.log('tutor-engine.min.js updated successfully!');
