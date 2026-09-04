const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const CSS_FILES = [
  'style.css',
  'section-dividers.css',
  'assets/css/visual-enhancements.css',
  'preai-overhaul.css',
  'assets/css/carousel-3d.css',
  'assets/css/card-enhancements.css',
  'hero-parallax.css',
  'responsive.css',
  'assets/css/responsive-overhaul.css',
  'assets/css/motion-engine.css',
  'assets/css/ui-3d-layer.css',
];

const output = CSS_FILES.map(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${file} not found, skipping`);
    return '';
  }
  return `/* === ${file} === */\n` + fs.readFileSync(filePath, 'utf8');
}).join('\n\n');

const outPath = path.join(rootDir, 'dist', 'combined.css');
fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });
fs.writeFileSync(outPath, output);

const sizeKB = Math.round(output.length / 1024);
console.log(`Combined CSS written to dist/combined.css (${sizeKB}KB)`);
