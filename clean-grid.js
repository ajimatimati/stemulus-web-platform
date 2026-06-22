const fs = require('fs');
const path = require('path');

const indexHtml = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexHtml, 'utf-8');

// The exact strings in index.html as per our inspection
content = content.replace(/<div class="prog-card card-tall" style="background:#1d1038;">/g, '<div class="prog-card">');
content = content.replace(/<div class="prog-card card-offset" style="background:#1a1040;">/g, '<div class="prog-card">');
content = content.replace(/<div class="prog-card card-tall" style="background:#012210;">/g, '<div class="prog-card">');
content = content.replace(/<div class="prog-card card-bleed" style="background:#0f1f3d;">/g, '<div class="prog-card">');
content = content.replace(/<div class="prog-card " style="background:#2d1000;">/g, '<div class="prog-card">');
content = content.replace(/<div class="prog-card card-offset" style="background:#200020;">/g, '<div class="prog-card">');

fs.writeFileSync(indexHtml, content, 'utf-8');
console.log('Stripped legacy inline styles and masonry classes.');
